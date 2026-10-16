// One full-screen pass: chroma split, zoom blur, madness (wobble + hue rings + kaleido edges),
// hurt vignette, cover dim, flash, grain + scanlines (stream look).
import * as THREE from 'three';
import { NOISE_GLSL } from './paper.js';

const FRAG = `
uniform sampler2D tDiffuse; uniform float time; uniform float aspect;
uniform float flash; uniform vec3 flashColor; uniform float chroma; uniform float blur; uniform vec2 center;
uniform float madness; uniform float hurt; uniform float dim; uniform float grain; uniform float wipe; uniform float warn; uniform vec3 warnColor;
varying vec2 vUv;
${NOISE_GLSL}
vec3 hueShift(vec3 c, float a){ const vec3 k = vec3(0.57735); float ca = cos(a); return c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca); }
void main(){
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  float r = length(p);
  if (madness > 0.0) {
    uv.x += sin(uv.y * 11.0 + time * 2.7) * 0.007 * madness;
    uv.y += cos(uv.x * 9.0 - time * 2.1) * 0.006 * madness;
    // mirror the screen edges like a kaleidoscope
    float edge = smoothstep(0.62, 0.95, r) * madness;
    float ang = atan(p.y, p.x);
    float seg = 6.2831 / 8.0;
    float a2 = abs(mod(ang + time * 0.25, seg) - seg * 0.5);
    vec2 kp = vec2(cos(a2), sin(a2)) * r * 0.8;
    uv = mix(uv, kp / vec2(aspect, 1.0) + 0.5, edge * 0.4);
  }
  vec2 dir = uv - center;
  vec3 c;
  if (blur > 0.001) {
    vec3 acc = vec3(0.0);
    for (int i = 0; i < 8; i++) { float k = float(i) / 7.0; acc += texture2D(tDiffuse, center + dir * (1.0 - blur * k * 0.1)).rgb; }
    c = acc / 8.0;
  } else c = texture2D(tDiffuse, uv).rgb;
  float ch = chroma + madness * 0.4;
  if (ch > 0.001) {
    vec2 off = (uv - 0.5) * ch * 0.009;
    c.r = texture2D(tDiffuse, uv + off).r;
    c.b = texture2D(tDiffuse, uv - off).b;
  }
  if (madness > 0.0) {
    float rings = sin(r * 18.0 - time * 5.0) * 0.5 + 0.5;
    c = mix(c, hueShift(c, time * 1.3 + r * 6.0), madness * smoothstep(0.15, 0.7, r) * (0.3 + 0.35 * rings));
    float l = dot(c, vec3(0.3, 0.59, 0.11));
    c = mix(vec3(l), c, 1.0 + madness * 0.4);
  }
  // vignette, cover dim, hurt
  float v = smoothstep(0.35, 1.05, r);
  c *= 1.0 - v * (0.35 + dim * 0.35);
  c *= 1.0 - dim * 0.12;
  c = mix(c, vec3(0.75, 0.0, 0.12), clamp(hurt * (v * 1.4 + 0.05), 0.0, 1.0));
  c = mix(c, warnColor, clamp(warn * smoothstep(0.3, 1.0, r) * 1.4, 0.0, 0.85)); // edge pulse for unstoppable attacks
  // stream grain + faint scanlines
  float gn = hash12(vUv * vec2(1920.0, 1080.0) + fract(time * 7.0) * 100.0);
  c += (gn - 0.5) * grain;
  c *= 1.0 - 0.035 * step(0.5, fract(vUv.y * 360.0 + time * 0.5));
  c = mix(c, flashColor, flash);
  // paper-tear wipe (transition): torn edge sweeping across
  if (wipe > 0.0) {
    float edgeN = fbm(vec2(vUv.y * 9.0, 0.0)) * 0.12;
    float x = vUv.x * 1.2 - 0.1 + edgeN;
    float m = step(x, wipe * 1.3 - 0.15);
    float rim = step(x, wipe * 1.3 - 0.13) - m;
    c = mix(c, vec3(0.06, 0.03, 0.07), m);
    c = mix(c, vec3(0.95, 0.9, 0.82), rim);
  }
  gl_FragColor = vec4(c, 1.0);
}`;

export class Post {
  constructor(renderer) {
    this.renderer = renderer;
    this.rt = new THREE.WebGLRenderTarget(4, 4, { depthBuffer: true, samples: 0 });
    this.u = {
      tDiffuse: { value: this.rt.texture }, time: { value: 0 }, aspect: { value: 1 },
      flash: { value: 0 }, flashColor: { value: new THREE.Color(1, 1, 1) }, chroma: { value: 0 }, blur: { value: 0 }, center: { value: new THREE.Vector2(0.5, 0.5) },
      madness: { value: 0 }, hurt: { value: 0 }, dim: { value: 0 }, grain: { value: 0.045 }, wipe: { value: 0 }, warn: { value: 0 }, warnColor: { value: new THREE.Color(0.69, 0.36, 1) },
    };
    this.scene = new THREE.Scene();
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: this.u, depthTest: false, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: FRAG,
    }));
    this.scene.add(this.quad);
    this.shakeAmt = 0;
    this.shakeX = 0; this.shakeY = 0;
  }
  setSize(w, h, dpr) {
    this.rt.setSize(Math.round(w * dpr), Math.round(h * dpr));
    this.u.aspect.value = w / h;
  }
  flash(a = 0.7, color = 0xffffff) { this.u.flash.value = Math.max(this.u.flash.value, a); this.u.flashColor.value.set(color); }
  shake(a) { this.shakeAmt = Math.max(this.shakeAmt, a); }
  kick(chroma = 1, blur = 0) { this.u.chroma.value = Math.max(this.u.chroma.value, chroma); this.u.blur.value = Math.max(this.u.blur.value, blur); }
  update(dt) {
    const u = this.u;
    u.time.value += dt;
    u.flash.value = Math.max(0, u.flash.value - dt * 4);
    u.chroma.value = Math.max(0, u.chroma.value - dt * 3.5);
    u.blur.value = Math.max(0, u.blur.value - dt * 3);
    u.hurt.value = Math.max(0, u.hurt.value - dt * 1.4);
    this.shakeAmt = Math.max(0, this.shakeAmt - dt * 3.5);
    const s = this.shakeAmt * this.shakeAmt;
    this.shakeX = (Math.random() - 0.5) * s; this.shakeY = (Math.random() - 0.5) * s;
  }
  render(drawScenes) {
    const r = this.renderer;
    r.setRenderTarget(this.rt);
    r.clear();
    drawScenes();
    r.setRenderTarget(null);
    r.render(this.scene, this.cam);
  }
}

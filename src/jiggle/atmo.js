// Atmosphere + shutter motion blur for the 2D stage.
//   base  (background + props) -> mist behind the girls
//   chars (girls, muzzle flashes, breath vapour, dust): rendered once per physics sub-step and averaged
//         = a real shutter: fast jiggle / recoil leave a soft smear, like in-between frames
//   composite: warm light shafts from the sun (blocked by the girls), faint ground mist in front, haze,
//              barely-there film grain and vignette
import * as THREE from 'three';

const QUAD_V = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const ADD_F = 'uniform sampler2D src; uniform float w; varying vec2 vUv; void main(){ gl_FragColor = texture2D(src, vUv) * w; }';
const COMP_F = `
uniform sampler2D base; uniform sampler2D chars; uniform vec2 sun; uniform float t; uniform float on; uniform vec2 res; uniform float aspect;
varying vec2 vUv;
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), u.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * vn(p); p = p * 2.03 + 7.1; a *= 0.5; } return v; }
float mist(vec2 uv, float top, float speed, float scale){
  vec2 q = vec2(uv.x * aspect, uv.y) * scale;
  float n = fbm(q + vec2(t * speed, t * speed * 0.3)) * 0.65 + fbm(q * 2.1 - vec2(t * speed * 1.7, 0.0)) * 0.35;
  return smoothstep(top, 0.0, uv.y) * smoothstep(0.35, 0.75, n);
}
void main(){
  vec3 b = texture2D(base, vUv).rgb;
  vec4 c = texture2D(chars, vUv);          // premultiplied
  if (on < 0.5) { gl_FragColor = vec4(b * (1.0 - c.a) + c.rgb, 1.0); return; }
  // mist that lives behind the girls (rolling along the ground)
  b = mix(b, vec3(1.0, 0.84, 0.76), mist(vUv, 0.5, 0.012, 2.2) * 0.4);
  vec3 col = b * (1.0 - c.a) + c.rgb;
  // light shafts: soft beams fanning out from the sun; anything in the char layer between a pixel and the sun
  // (the girls) casts a shadow lane through them
  vec2 dv = (vUv - sun) * vec2(aspect, 1.0); float dist = length(dv); float ang = atan(dv.y, dv.x);
  float beams = smoothstep(0.42, 0.78, fbm(vec2(ang * 7.0, t * 0.04))) * 0.75 + smoothstep(0.5, 0.85, fbm(vec2(ang * 19.0 + 3.0, t * 0.07))) * 0.35;
  vec2 d = (sun - vUv) / 28.0; vec2 p = vUv; float occ = 0.0;
  for (int i = 0; i < 28; i++) { p += d; occ += texture2D(chars, p).a; }
  float vis = 1.0 - clamp(occ * 0.12, 0.0, 0.85);
  float reach = smoothstep(1.6, 0.05, dist);
  vec3 warm = vec3(1.0, 0.66, 0.4);
  col += warm * beams * reach * vis * 0.16;
  col += warm * pow(max(0.0, 1.0 - dist / 0.55), 2.0) * 0.22;   // glow around the sun
  // a thin veil of mist in front of the feet, and haze toward the horizon
  col = mix(col, vec3(1.0, 0.88, 0.8), mist(vUv + 0.31, 0.2, 0.02, 3.0) * 0.22);
  col = mix(col, vec3(1.0, 0.8, 0.7), smoothstep(0.75, 0.35, vUv.y) * smoothstep(0.1, 0.45, vUv.y) * 0.05);
  // vignette + grain (barely there)
  vec2 v = vUv - 0.5; col *= 1.0 - dot(v * vec2(1.0, 0.8), v * vec2(1.0, 0.8)) * 0.42;
  col += (h21(vUv * res + fract(t * 23.0) * 91.0) - 0.5) * 0.028;
  gl_FragColor = vec4(col, 1.0);
}`;

const DUST_V = `
attribute float size; attribute float alpha; varying float vA;
void main(){ vA = alpha; gl_PointSize = size; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const DUST_F = `
uniform vec3 col; varying float vA;
void main(){ vec2 q = gl_PointCoord - 0.5; float r = length(q) * 2.0; float a = smoothstep(1.0, 0.0, r); a *= a;
  gl_FragColor = vec4(col, a * vA); }`;

const rnd = (a, b) => a + Math.random() * (b - a);

export class Atmo {
  constructor(renderer) {
    this.r = renderer;
    const mk = (type) => new THREE.WebGLRenderTarget(4, 4, { type, depthBuffer: false });
    this.rtBase = mk(THREE.UnsignedByteType);
    this.rtTmp = mk(THREE.HalfFloatType);
    this.rtAcc = mk(THREE.HalfFloatType);
    this.cam = new THREE.Camera();
    const quad = (mat) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); m.frustumCulled = false; const s = new THREE.Scene(); s.add(m); return s; };
    this.addMat = new THREE.ShaderMaterial({ uniforms: { src: { value: null }, w: { value: 1 } }, vertexShader: QUAD_V, fragmentShader: ADD_F,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor, depthTest: false, depthWrite: false });
    this.addScene = quad(this.addMat);
    this.comp = new THREE.ShaderMaterial({
      uniforms: { base: { value: this.rtBase.texture }, chars: { value: this.rtAcc.texture }, sun: { value: new THREE.Vector2(0.11, 0.66) }, t: { value: 0 }, on: { value: 1 }, res: { value: new THREE.Vector2(1, 1) }, aspect: { value: 1 } },
      vertexShader: QUAD_V, fragmentShader: COMP_F, depthTest: false, depthWrite: false,
    });
    this.compScene = quad(this.comp);
    this.samples = 0;
  }
  setSize(w, h) {
    const pr = this.r.getPixelRatio(), W = Math.round(w * pr), H = Math.round(h * pr);
    for (const rt of [this.rtBase, this.rtTmp, this.rtAcc]) rt.setSize(W, H);
    this.comp.uniforms.res.value.set(W, H);
    this.comp.uniforms.aspect.value = w / h;
  }
  beginFrame() {
    this.r.setRenderTarget(this.rtAcc); this.r.setClearColor(0x000000, 0); this.r.clear();
    this.samples = 0;
  }
  // one shutter sample of the character layer
  sample(scene, cam, weight) {
    const r = this.r;
    r.setRenderTarget(this.rtTmp); r.setClearColor(0x000000, 0); r.clear();
    r.render(scene, cam);
    this.addMat.uniforms.src.value = this.rtTmp.texture; this.addMat.uniforms.w.value = weight;
    r.setRenderTarget(this.rtAcc); r.render(this.addScene, this.cam);
    this.samples++;
  }
  endFrame(baseScene, cam, t, on) {
    const r = this.r;
    r.setRenderTarget(this.rtBase); r.setClearColor(0x1a0f20, 1); r.clear(); r.render(baseScene, cam);
    this.comp.uniforms.t.value = t; this.comp.uniforms.on.value = on ? 1 : 0;
    r.setRenderTarget(null); r.render(this.compScene, this.cam);
  }
}

// floating dust in the evening light
export class Dust {
  constructor(n = 70) {
    this.n = n;
    this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(n * 3); this.size = new Float32Array(n); this.alpha = new Float32Array(n);
    this.p = Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), z: rnd(0.3, 1), ph: rnd(0, 6.28), vx: rnd(-0.004, 0.006), vy: rnd(0.002, 0.009) }));
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('size', new THREE.BufferAttribute(this.size, 1));
    this.geo.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1));
    this.mat = new THREE.ShaderMaterial({ uniforms: { col: { value: new THREE.Color(1, 0.86, 0.66) } }, vertexShader: DUST_V, fragmentShader: DUST_F, transparent: true, depthTest: false, depthWrite: false,
      blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.renderOrder = 30; this.points.frustumCulled = false;
  }
  update(dt, t, W, H, pr) {
    for (let i = 0; i < this.n; i++) {
      const p = this.p[i];
      p.x += (p.vx + Math.sin(t * 0.4 + p.ph) * 0.004) * dt; p.y += (p.vy + Math.cos(t * 0.3 + p.ph) * 0.003) * dt;
      if (p.y > 1.05) { p.y = -0.05; p.x = Math.random(); } if (p.x > 1.05) p.x = -0.05; if (p.x < -0.05) p.x = 1.05;
      this.pos[i * 3] = p.x * W; this.pos[i * 3 + 1] = p.y * H; this.pos[i * 3 + 2] = 0;
      this.size[i] = (3 + 7 * p.z) * pr * (H / 900);
      // brighter on the sunny left, twinkling
      this.alpha[i] = (0.2 + 0.45 * p.z) * (0.55 + 0.45 * Math.sin(t * 1.7 + p.ph * 3)) * (1.15 - p.x * 0.7);
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.size.needsUpdate = true; this.geo.attributes.alpha.needsUpdate = true;
  }
}

// breath vapour: a short stream of small puffs out of the nose on each exhale, forward (the way she faces) and a little down
const puffTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  for (let i = 0; i < 9; i++) {
    const x = 64 + rnd(-22, 22), y = 64 + rnd(-18, 18), r = rnd(26, 44);
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t;
})();
export class Breath {
  constructor(scene, max = 24) {
    this.items = Array.from({ length: max }, () => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: puffTex, transparent: true, depthTest: false, depthWrite: false, color: 0xf2f4ff }));
      m.renderOrder = 20; m.visible = false; scene.add(m);
      return { m, life: 0, t: 0, vx: 0, vy: 0, s0: 0, s1: 0, rot: 0 };
    });
    this.i = 0;
  }
  // x, y: nose in px; dir: the way she faces (+1 right); H: screen height px; k: 0..1 how hard she breathes
  puff(x, y, dir, H, k = 0.5) {
    const n = 3 + Math.round(k * 3);
    for (let i = 0; i < n; i++) {
      const p = this.items[this.i++ % this.items.length];
      p.m.visible = true; p.t = -i * 0.05; p.life = rnd(0.7, 1.1);
      p.m.position.set(x, y, 0);
      p.vx = dir * H * rnd(0.05, 0.08) * (0.7 + 0.5 * k); p.vy = -H * rnd(0.004, 0.014);
      p.s0 = H * 0.008; p.s1 = H * rnd(0.03, 0.045) * (0.8 + 0.4 * k); p.rot = rnd(-0.6, 0.6);
      p.a = 0.75 + 0.25 * k;
    }
  }
  update(dt) {
    for (const p of this.items) {
      if (!p.m.visible) continue;
      p.t += dt;
      if (p.t < 0) { p.m.material.opacity = 0; continue; }
      const k = p.t / p.life;
      if (k >= 1) { p.m.visible = false; continue; }
      p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.vx *= 1 - dt * 2.2; p.vy += dt * Math.abs(p.vx) * 0.6;
      const s = p.s0 + (p.s1 - p.s0) * (1 - (1 - k) * (1 - k));
      p.m.scale.set(s, s * 0.8, 1); p.m.rotation.z += p.rot * dt;
      p.m.material.opacity = Math.min(1, k * 8) * (1 - k) * p.a;
    }
  }
}


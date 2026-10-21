// One full-screen pass: chroma split, zoom blur, madness (wobble + hue rings + kaleido edges),
// hurt vignette, cover dim, flash, grain + scanlines (stream look), the impact frame (a kill: two frames in hard black and white).
// And the "electric wave" styles (DESIGN「总纲」 电波系精神污染, after the streamer-girl MVs: made by the program, not by pictures or a
// colour grade): 7 datamosh (blocks of the last frame dragged over this one), 8 pixel drag (bright pixels smeared down in streaks),
// 9 melt (the picture running down in columns), 10 echoes (the last frames left behind, fading), 11 kaleidoscope (the whole picture
// mirrored six ways, turning), 12 tear (the picture rolling and torn sideways with its colours apart). 7 and 10 read the last frame.
// Also the shake the cameras read (shakeX / shakeY / shakeR: smooth, with a roll; tuning combat.feel).
import * as THREE from 'three';
import { NOISE_GLSL } from './paper.js';

const FRAG = `
uniform sampler2D tDiffuse; uniform float time; uniform float aspect;
uniform float flash; uniform vec3 flashColor; uniform float chroma; uniform float blur; uniform vec2 center;
uniform float madness; uniform float hurt; uniform float dim; uniform float grain; uniform float wipe; uniform float warn; uniform vec3 warnColor;
uniform float fade; uniform vec3 fadeColor;   // (the picture fading out to a colour: the end of a run, src/battle/ride.js outro)
uniform vec4 focus; uniform vec4 edgeA; uniform vec4 edgeB; uniform float impact; uniform float style; uniform vec3 styleA; uniform vec3 styleB; uniform vec2 px;
uniform sampler2D tPrev; uniform float hasPrev;
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
  // the picture redrawn in another way for a while (Post.styleBurst; the MVs and R-Type's last stage: a whole section switches how it is
  // drawn, cut on the beat): 3 glitch (blocks of the picture shoved sideways), 4 pixels (big blocks)
  if (style > 2.5 && style < 3.5) { float row = floor(uv.y * 24.0); float n = hash12(vec2(row, floor(time * 20.0))); if (n > 0.6) uv.x += (n - 0.8) * 0.12; }
  if (style > 3.5 && style < 4.5) { vec2 bs = px * 14.0; uv = (floor(uv / bs) + 0.5) * bs; }
  if (style > 8.5 && style < 9.5) { float col = floor(uv.x * 90.0); float run = hash12(vec2(col, 3.1)) * 0.6 + 0.4; uv.y = fract(uv.y + fract(time * 0.35 * run) * run * 0.6); }
  if (style > 10.5 && style < 11.5) { vec2 q = (uv - 0.5) * vec2(aspect, 1.0); float a = atan(q.y, q.x) + time * 0.6, rr = length(q), sg = 6.2831 / 6.0; a = abs(mod(a, sg) - sg * 0.5); uv = vec2(cos(a), sin(a)) * rr / vec2(aspect, 1.0) + 0.5; }
  if (style > 11.5) { uv.y = fract(uv.y + time * 0.9); float row = floor(uv.y * 40.0); uv.x += (hash12(vec2(row, floor(time * 24.0))) - 0.5) * 0.08; }
  // the danger moment: inside the circle round the threat, a little magnified
  float fin = 0.0;
  if (focus.w > 0.001) { float fd = length((uv - focus.xy) * vec2(aspect, 1.0)); fin = 1.0 - smoothstep(focus.z, focus.z * 1.35, fd); uv = mix(uv, focus.xy + (uv - focus.xy) * (1.0 - 0.16 * focus.w), fin); }
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
  if (focus.w > 0.001) {
    // outside it the world goes grey and hard; inside, its colour and a ghost of it (a copy pushed out from the middle)
    float l = dot(c, vec3(0.3, 0.59, 0.11)); vec3 gr = vec3(smoothstep(0.08, 0.9, l)) * vec3(0.9, 0.93, 1.0);
    c = mix(c, gr, focus.w * (1.0 - fin) * 0.92);
    vec3 ghost = texture2D(tDiffuse, uv + (uv - focus.xy) * 0.06).rgb;
    c = mix(c, max(c, ghost), fin * focus.w * 0.35);
    c *= 1.0 + fin * focus.w * 0.12;
  }
  // vignette, cover dim, hurt
  float v = smoothstep(0.35, 1.05, r);
  c *= 1.0 - v * (0.35 + dim * 0.35);
  c *= 1.0 - dim * 0.12;
  c = mix(c, vec3(0.75, 0.0, 0.12), clamp(hurt * (v * 1.4 + 0.05), 0.0, 1.0));
  c = mix(c, warnColor, clamp(warn * smoothstep(0.3, 1.0, r) * 1.4, 0.0, 0.85)); // edge pulse for unstoppable attacks
  // the heroines' Fever / skill glow: licking in from her side of the screen (1P left, 2P right), stronger low down
  for (int s = 0; s < 2; s++) {
    vec4 E = s == 0 ? edgeA : edgeB;
    if (E.a < 0.001) continue;
    float x = s == 0 ? vUv.x : 1.0 - vUv.x;
    float fl = fbm(vec2(vUv.y * 5.0 - time * 1.2, time * 0.7 + float(s) * 3.0));
    // a band at the very edge (the heroines stand at 10-30% of the width: the glow must not wash over them)
    float band = smoothstep(0.05 + 0.07 * E.a + fl * 0.04, 0.0, x) * (0.55 + 0.45 * smoothstep(1.0, 0.2, vUv.y));
    float stripes = 0.75 + 0.25 * sin(vUv.y * 40.0 - time * 8.0);
    c += E.rgb * band * stripes * min(1.0, E.a) * 0.9;
    c = mix(c, E.rgb, band * 0.12 * E.a);
  }
  // stream grain + faint scanlines
  float gn = hash12(vUv * vec2(1920.0, 1080.0) + fract(time * 7.0) * 100.0);
  c += (gn - 0.5) * grain;
  c *= 1.0 - 0.035 * step(0.5, fract(vUv.y * 360.0 + time * 0.5));
  // the other styles: 1 two colours (a dark and a light one by brightness: the sunset section), 2 line art (only the edges, dark lines on
  // paper), 3 glitch (the colours torn apart too), 5 manga halftone dots, 6 the negative
  if (style > 0.5) {
    float l = dot(c, vec3(0.3, 0.59, 0.11));
    if (style < 1.5) c = mix(styleA, styleB, smoothstep(0.2, 0.75, l));
    else if (style < 2.5) {
      float lx = dot(texture2D(tDiffuse, uv + vec2(px.x, 0.0)).rgb - texture2D(tDiffuse, uv - vec2(px.x, 0.0)).rgb, vec3(0.333));
      float ly = dot(texture2D(tDiffuse, uv + vec2(0.0, px.y)).rgb - texture2D(tDiffuse, uv - vec2(0.0, px.y)).rgb, vec3(0.333));
      float e = smoothstep(0.04, 0.16, length(vec2(lx, ly)));
      c = mix(vec3(0.96, 0.93, 0.88), vec3(0.08, 0.05, 0.1), e);
    }
    else if (style < 3.5) { c.r = texture2D(tDiffuse, uv + vec2(0.012, 0.0)).r; c.b = texture2D(tDiffuse, uv - vec2(0.012, 0.0)).b; c = mix(c, styleB, step(0.97, hash12(vec2(floor(uv.y * 60.0), floor(time * 30.0)))) * 0.8); }
    else if (style > 4.5 && style < 5.5) { vec2 g = fract(vUv / (px * 9.0)) - 0.5; float dotR = sqrt(1.0 - l) * 0.55; c = mix(styleA, vec3(0.97, 0.94, 0.9), step(dotR, length(g))); }
    else if (style > 5.5 && style < 6.5) c = 1.0 - c;
    else if (style > 6.5 && style < 7.5 && hasPrev > 0.5) {   // datamosh: whole blocks taken from the last frame, dragged a little
      vec2 bs = vec2(0.06, 0.06 * aspect); vec2 blk = floor(uv / bs); float h = hash12(blk + floor(time * 6.0));
      if (h > 0.45) c = texture2D(tPrev, uv - vec2(hash12(blk + 7.0) - 0.5, hash12(blk + 13.0) - 0.5) * 0.02).rgb;
    }
    else if (style > 7.5 && style < 8.5) {   // pixel drag: what is bright above runs down over what is below
      vec3 m = c; for (int i = 1; i < 14; i++) { vec3 s = texture2D(tDiffuse, uv + vec2(0.0, float(i) * 0.012)).rgb; if (dot(s, vec3(0.333)) > dot(m, vec3(0.333)) + 0.08) m = mix(m, s, 0.85); }
      c = mix(c, m, step(0.4, hash12(vec2(floor(uv.x * 160.0), 1.7))));
    }
    else if (style > 9.5 && style < 10.5 && hasPrev > 0.5) c = max(c, texture2D(tPrev, (vUv - 0.5) * 0.985 + 0.5).rgb * vec3(0.93, 0.82, 0.96));   // echoes, drifting in
    else if (style > 11.5) { c.r = texture2D(tDiffuse, uv + vec2(0.02, 0.0)).r; c.b = texture2D(tDiffuse, uv - vec2(0.02, 0.0)).b; c *= 0.85 + 0.3 * step(0.5, fract(uv.y * 120.0)); }
  }
  // the impact frame (anime / fighting games): everything hard black or white for a moment, the second frame turned inside out
  if (impact > 0.5) { float l = dot(c, vec3(0.3, 0.59, 0.11)); float k = step(0.42, l); if (impact > 1.5) k = 1.0 - k;
    c = mix(vec3(0.07, 0.0, 0.05), vec3(1.0, 0.96, 0.98), k); }
  c = mix(c, flashColor, flash);
  c = mix(c, fadeColor, fade);
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
    this.outs = [0, 1].map(() => new THREE.WebGLRenderTarget(4, 4, { depthBuffer: false }));   // (the last frames, for styles 7 / 10)
    this.blit = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ depthTest: false, depthWrite: false }));
    this.blitScene = new THREE.Scene(); this.blitScene.add(this.blit); this.oi = 0;
    this.u = {
      tDiffuse: { value: this.rt.texture }, time: { value: 0 }, aspect: { value: 1 },
      flash: { value: 0 }, flashColor: { value: new THREE.Color(1, 1, 1) }, chroma: { value: 0 }, blur: { value: 0 }, center: { value: new THREE.Vector2(0.5, 0.5) },
      madness: { value: 0 }, hurt: { value: 0 }, dim: { value: 0 }, grain: { value: 0.045 }, wipe: { value: 0 }, fade: { value: 0 }, fadeColor: { value: new THREE.Color(0, 0, 0) }, warn: { value: 0 }, warnColor: { value: new THREE.Color(0.69, 0.36, 1) }, focus: { value: new THREE.Vector4(0, 0, 0, 0) }, edgeA: { value: new THREE.Vector4() }, edgeB: { value: new THREE.Vector4() },
      tPrev: { value: null }, hasPrev: { value: 0 },
      impact: { value: 0 }, style: { value: 0 }, styleA: { value: new THREE.Color(0.12, 0.0, 0.08) }, styleB: { value: new THREE.Color(1.0, 0.45, 0.2) }, px: { value: new THREE.Vector2(0.001, 0.001) },
    };
    this.scene = new THREE.Scene();
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: this.u, depthTest: false, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: FRAG,
    }));
    this.scene.add(this.quad);
    this.shakeAmt = 0; this.shakeT = 0; this.impactT = 0;
    this.shakeX = 0; this.shakeY = 0; this.shakeR = 0;
  }
  setSize(w, h, dpr) {
    this.rt.setSize(Math.round(w * dpr), Math.round(h * dpr));
    for (const o of this.outs) o.setSize(Math.round(w * dpr), Math.round(h * dpr));
    this.u.aspect.value = w / h; this.u.px.value.set(1 / Math.max(1, w * dpr), 1 / Math.max(1, h * dpr));
  }
  // a burst of other ways of drawing the picture, cut hard every beat seconds for dur seconds (seq: the styles to cycle through:
  // 1 two colours, 2 line art, 3 glitch, 4 pixels, 5 halftone, 6 negative, 7 datamosh, 8 pixel drag, 9 melt, 10 echoes, 11 kaleidoscope,
  // 12 tear; colours: the two-colour / halftone pair, as hex)
  styleBurst(dur = 1.2, seq = [1, 2, 3, 5], beat = 0.15, a = 0x1e0014, b = 0xff7330) {
    this.burst = { t: 0, dur, seq, beat }; this.u.styleA.value.set(a); this.u.styleB.value.set(b);
  }
  flash(a = 0.7, color = 0xffffff) { this.u.flash.value = Math.max(this.u.flash.value, a); this.u.flashColor.value.set(color); }
  shake(a) { this.shakeAmt = Math.max(this.shakeAmt, a); }
  // the impact frame for t seconds (its first half hard black and white, the second half inside out)
  impact(t = 0.07) { this.impactT = Math.max(this.impactT, t); this.impactT0 = this.impactT; }
  // the danger moment (Game.danger): the threat's place on the screen (uv, y up), the circle's radius (screen heights), how strong
  focus(x, y, r, k) { this.u.focus.value.set(x, y, r, k); }
  kick(chroma = 1, blur = 0) { this.u.chroma.value = Math.max(this.u.chroma.value, chroma); this.u.blur.value = Math.max(this.u.blur.value, blur); }
  update(dt) {
    const u = this.u;
    u.time.value += dt;
    u.flash.value = Math.max(0, u.flash.value - dt * 4);
    u.chroma.value = Math.max(0, u.chroma.value - dt * 3.5);
    u.blur.value = Math.max(0, u.blur.value - dt * 3);
    u.hurt.value = Math.max(0, u.hurt.value - dt * 1.4);
    this.shakeAmt = Math.max(0, this.shakeAmt - dt * 3.5);
    // trauma squared, sampled from a few sines (smooth, not a new random spot every frame), and a roll: a turn of the camera hits harder
    // than a slide in 3D
    const s = this.shakeAmt * this.shakeAmt, q = (this.shakeT += dt);
    this.shakeX = s * 0.5 * (Math.sin(q * 41.3) * 0.6 + Math.sin(q * 67.9 + 1.3) * 0.4);
    this.shakeY = s * 0.5 * (Math.sin(q * 37.7 + 2.1) * 0.6 + Math.sin(q * 59.1 + 0.4) * 0.4);
    this.shakeR = s * 0.011 * (Math.sin(q * 31.9 + 0.7) * 0.6 + Math.sin(q * 53.3 + 2.6) * 0.4);
    this.impactT = Math.max(0, this.impactT - dt);
    if (this.burst) { const B = this.burst; B.t += dt; u.style.value = B.t < B.dur ? B.seq[Math.floor(B.t / B.beat) % B.seq.length] : 0; if (B.t >= B.dur) this.burst = null; }
    u.impact.value = this.impactT > 0 ? (this.impactT > this.impactT0 * 0.5 ? 1 : 2) : 0;
  }
  // drawScenes: the world (shaken, warped, graded by the pass); drawAfter: things drawn straight on top, untouched (the HUD)
  render(drawScenes, drawAfter) {
    const r = this.renderer;
    r.setRenderTarget(this.rt);
    r.clear();
    drawScenes();
    // (a style that reads the last frame: the pass is drawn into one of two targets and that one shown; the other is the last frame)
    const st = this.u.style.value, prev = st > 6.5 && st < 7.5 || st > 9.5 && st < 10.5;
    if (prev) {
      const out = this.outs[this.oi], last = this.outs[1 - this.oi]; this.oi = 1 - this.oi;
      this.u.tPrev.value = last.texture; this.u.hasPrev.value = this.prevOk ? 1 : 0;
      r.setRenderTarget(out); r.render(this.scene, this.cam);
      r.setRenderTarget(null); this.blit.material.map = out.texture; r.render(this.blitScene, this.cam); this.prevOk = true;
    } else { this.prevOk = false; r.setRenderTarget(null); r.render(this.scene, this.cam); }
    if (drawAfter) drawAfter();
  }
}

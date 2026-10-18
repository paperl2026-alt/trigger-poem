// Paper cut-out material: one shader carries every hit / kill look.
//  - damage map (per sprite canvas):  R = holes and cuts, G = scorch, B = heat glow ("solid" sprites: R = how hurt, never holed)
//  - dissolve: burn-away from an origin with an ember edge
//  - slice: keep one side of a line (uv space) with a glowing cut edge
//  - flash / tint for hit feedback, "boil" jitter is done by the owner on the mesh
import * as THREE from 'three';

export const NOISE_GLSL = `
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash12(i), hash12(i+vec2(1,0)), u.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; } return v; }
`;

// soft: up to 6 elliptical uv regions (xy centre, zw radii). softD = (dx, dy) shift in uv units + z = radial swell/squash.
// Used for the heroines' procedural jiggle / sway (see game/soft.js).
const VERT = `
uniform float softOn; uniform vec4 softA[6]; uniform vec3 softD[6]; uniform vec2 softSize;
uniform sampler2D relief; uniform float reliefOn; uniform float reliefAmt;
varying vec2 vUv; varying float vFogDepth;
void main(){
  vUv = uv;
  vec3 p = position;
  // depth relief (tools/relief.py): the drawing pushed out toward the viewer by how near each part of it is
  if (reliefOn > 0.5) p.z += (texture2D(relief, uv).r - 0.35) * reliefAmt;
  if (softOn > 0.5) {
    for (int i = 0; i < 6; i++) {
      vec2 d = uv - softA[i].xy;
      vec2 r = d / max(softA[i].zw, vec2(1e-3));
      float w = 1.0 - smoothstep(0.0, 1.0, dot(r, r));
      p.xy += (softD[i].xy + d * softD[i].z) * w * softSize;
    }
  }
  vec4 mv = modelViewMatrix * vec4(p, 1.0); vFogDepth = -mv.z; gl_Position = projectionMatrix * mv;
}
`;

// shared fog uniforms (the world updates them; every paper sprite reads the same objects)
export const FOG = { color: { value: new THREE.Color(0, 0, 0) }, density: { value: 0 } };

const FRAG = `
uniform sampler2D map; uniform sampler2D dmg; uniform float useDmg; uniform float dmgSolid;
uniform float flash; uniform vec3 tint; uniform float tintAmt; uniform float opacity; uniform float dark;
uniform float dissolve; uniform vec2 dOrigin; uniform vec3 slice; uniform float sliceOn; uniform float aspect;
uniform float seed; uniform float time; uniform vec3 edgeColor;
uniform vec3 lit; uniform vec3 fogColor; uniform float fogDensity; uniform float useFog;
uniform sampler2D relief; uniform float reliefOn; uniform float reliefAmt; uniform vec2 reliefTexel; uniform vec2 softSize; uniform vec3 lightL;
uniform float outlineOn; uniform vec2 mapTexel; uniform vec3 outlineCol;
varying vec2 vUv; varying float vFogDepth;
${NOISE_GLSL}
void main(){
  vec4 tx = texture2D(map, vUv);
  float thr = reliefOn > 0.5 ? 0.45 : 0.03;
  if (tx.a < thr) {
    // what can be shot gets a white outline and a soft white glow around it (docs/DESIGN.md「战斗画面布局」)
    if (outlineOn < 0.5) discard;
    float o = 0.0, g = 0.0;
    for (int i = 0; i < 12; i++) {
      float an = float(i) * 0.5236;
      vec2 d = vec2(cos(an), sin(an)) * mapTexel;
      o = max(o, texture2D(map, vUv + d * 5.0).a);
      g = max(g, texture2D(map, vUv + d * 12.0).a);
    }
    float line = smoothstep(0.35, 0.6, o), glow = smoothstep(0.35, 0.6, g) * 0.4;
    float a = max(line, glow) * opacity * outlineOn;
    if (a < 0.02) discard;
    gl_FragColor = vec4(mix(outlineCol, vec3(1.0), flash), a);
    return;
  }
  vec3 col = tx.rgb;
  if (reliefOn > 0.5) {
    // light it like a solid: normals from the relief, two soft toon bands (an anime cel look, not plastic)
    float rx = texture2D(relief, vUv + vec2(reliefTexel.x, 0.0)).r - texture2D(relief, vUv - vec2(reliefTexel.x, 0.0)).r;
    float ry = texture2D(relief, vUv + vec2(0.0, reliefTexel.y)).r - texture2D(relief, vUv - vec2(0.0, reliefTexel.y)).r;
    vec2 sl = vec2(rx, ry) * reliefAmt / (2.0 * reliefTexel * softSize);
    vec3 nrm = normalize(vec3(-sl, 1.0));
    float dl = dot(nrm, normalize(lightL));
    float shade = mix(0.74, 0.92, smoothstep(0.05, 0.2, dl));
    shade = mix(shade, 1.08, smoothstep(0.55, 0.7, dl));
    col *= shade;
  }
  vec2 q = vec2(vUv.x * aspect, vUv.y);
  float n = fbm(q * 14.0 + seed);
  float n2 = vnoise(q * 60.0 + seed * 3.0);
  float am = 1.0;   // (how much is left where it is hurt: monsters)
  if (useDmg > 0.5 && dmgSolid > 0.5) {
    // monsters and the boss (docs/DESIGN.md「Boss」): never holed — the shape and the hit area stay; where it is hurt, the material
    // changes, old-arcade style: the colour drains and bruises toward violet-black, cracks open and glow, burns char and smoulder
    // (2026-10-18 user: not black, "半透明的适当变色和消失"): hurt spots turn a pale violet-pink (lighter, the drawing still shows), the
    // worst ones thin out to semi-transparent with a glowing rim (never gone: the shape and the hit area stay); burns go amber
    vec3 d = texture2D(dmg, vUv).rgb;
    float hv = d.r + (n - 0.5) * 0.3 + (n2 - 0.5) * 0.1;
    float k = smoothstep(0.15, 0.7, hv);
    float lum = dot(col, vec3(0.3, 0.5, 0.2));
    vec3 tintc = mix(col, vec3(lum) * vec3(1.05, 0.74, 1.12) + vec3(0.1, 0.03, 0.12), 0.7);
    col = mix(col, tintc, k * 0.85);
    float vein = smoothstep(0.045, 0.0, abs(fbm(q * 7.0 + seed * 2.0) - 0.5)) * smoothstep(0.3, 0.75, hv);
    col += vec3(1.0, 0.4, 0.75) * vein * (0.8 + 0.5 * n2);
    float fade = smoothstep(0.4, 1.05, hv) * (0.6 + 0.4 * n);
    am = 1.0 - 0.6 * fade;
    col += vec3(1.0, 0.6, 0.9) * smoothstep(0.08, 0.0, abs(hv - 0.62)) * 0.55;   // the glowing rim where it thins
    float sc = d.g + (n - 0.5) * 0.35;
    col = mix(col, col * vec3(1.12, 0.86, 0.62) + vec3(0.1, 0.04, 0.0), smoothstep(0.12, 0.8, sc) * 0.6);
    am *= 1.0 - 0.35 * smoothstep(0.55, 1.0, sc);
    col += vec3(1.0, 0.5, 0.12) * d.b * smoothstep(0.2, 0.6, sc) * (0.6 + 1.1 * n2);
  } else if (useDmg > 0.5) {
    vec3 d = texture2D(dmg, vUv).rgb;
    float hv = d.r + (n - 0.5) * 0.32 + (n2 - 0.5) * 0.12;
    if (hv > 0.55) discard;                                   // punched / cut through
    float rim = smoothstep(0.2, 0.55, hv);
    col = mix(col, vec3(0.13, 0.05, 0.07), rim * 0.9);         // dark torn rim
    col = mix(col, vec3(0.96, 0.92, 0.82), smoothstep(0.50, 0.55, hv) * 0.8); // white paper fibre at the very edge
    float sc = d.g + (n - 0.5) * 0.35;
    col = mix(col, col * vec3(0.16, 0.10, 0.08), smoothstep(0.12, 0.7, sc));
    if (sc > 0.95) discard;                                   // burnt through
    // embers glow on the rim of the char and around burn-through holes, not as a flat blob
    float ring = smoothstep(0.18, 0.42, sc) * (1.0 - smoothstep(0.48, 0.78, sc));
    float edge = smoothstep(0.8, 0.95, sc);
    col += vec3(1.0, 0.42, 0.07) * d.b * (ring * 1.5 + edge * 2.6) * (0.5 + 1.1 * n2);
  }
  if (dissolve > 0.0) {
    float dd = distance(q, dOrigin * vec2(aspect, 1.0)) * 0.9 + n * 0.55;
    float e = dd - dissolve * 1.6;
    if (e < 0.0) discard;
    col = mix(col, vec3(0.08, 0.04, 0.03), smoothstep(0.16, 0.04, e));
    col += vec3(1.0, 0.55, 0.12) * smoothstep(0.05, 0.0, e) * 2.2;
  }
  if (sliceOn != 0.0) {
    float s = (dot(slice.xy, q) + slice.z) * sliceOn;
    if (s < 0.0) discard;
    col = mix(col, edgeColor, smoothstep(0.018, 0.0, s));
  }
  col *= lit;
  col = mix(col, tint, tintAmt);
  col *= 1.0 - dark;
  col = mix(col, vec3(1.0), flash);
  float fogF = useFog * (1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth));
  col = mix(col, fogColor, fogF);
  gl_FragColor = vec4(col, tx.a * opacity * am);
}
`;

let blank = null;
function blankTex() {
  if (!blank) { blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); blank.needsUpdate = true; }
  return blank;
}

export function paperMaterial(map, aspect = 1) {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: map }, dmg: { value: blankTex() }, useDmg: { value: 0 }, dmgSolid: { value: 0 },
      outlineOn: { value: 0 }, mapTexel: { value: new THREE.Vector2(1 / 512, 1 / 512) }, outlineCol: { value: new THREE.Color(1, 1, 1) },
      flash: { value: 0 }, tint: { value: new THREE.Color(1, 1, 1) }, tintAmt: { value: 0 }, opacity: { value: 1 }, dark: { value: 0 },
      dissolve: { value: 0 }, dOrigin: { value: new THREE.Vector2(0.5, 0.5) },
      slice: { value: new THREE.Vector3() }, sliceOn: { value: 0 }, aspect: { value: aspect },
      seed: { value: Math.random() * 50 }, time: { value: 0 }, edgeColor: { value: new THREE.Color(1, 0.35, 0.7) },
      lit: { value: new THREE.Color(1, 1, 1) }, fogColor: FOG.color, fogDensity: FOG.density, useFog: { value: 1 },
      softOn: { value: 0 }, softA: { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, 1e-3, 1e-3)) },
      softD: { value: Array.from({ length: 6 }, () => new THREE.Vector3()) }, softSize: { value: new THREE.Vector2(1, 1) },
      relief: { value: blankTex() }, reliefOn: { value: 0 }, reliefAmt: { value: 0 }, reliefTexel: { value: new THREE.Vector2(1 / 256, 1 / 256) },
      lightL: { value: new THREE.Vector3(-0.45, 0.55, 0.75) },
    },
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
}

// A relief map on a mesh made with segs (enough vertices to carry it): amt = how deep the nearest part comes out (world units)
export function setRelief(mesh, reliefTex, amt) {
  const u = mesh.material.uniforms;
  if (!reliefTex) { u.reliefOn.value = 0; return; }
  u.relief.value = reliefTex; u.reliefOn.value = 1; u.reliefAmt.value = amt;
  u.reliefTexel.value.set(1 / reliefTex.image.width, 1 / reliefTex.image.height);
  mesh.material.depthWrite = true;   // a solid: it hides what is behind it and itself
}

// Plane with its pivot at bottom-centre (standing paper) or centre.
export function paperMesh(texture, widthWorld, { pivot = 'bottom', aspectOverride, segs = null } = {}) {
  const img = texture.image;
  const ar = aspectOverride || img.height / img.width; // h / w
  const h = widthWorld * ar;
  const geo = segs ? new THREE.PlaneGeometry(widthWorld, h, segs[0], segs[1]) : new THREE.PlaneGeometry(widthWorld, h);
  if (pivot === 'bottom') geo.translate(0, h / 2, 0);
  const mat = paperMaterial(texture, widthWorld / h);
  mat.uniforms.softSize.value.set(widthWorld, h);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.size = { w: widthWorld, h };
  return mesh;
}

// Canvas painted in uv space. 'lighter' adds per channel, so pure red / green / blue strokes stay separate.
export class DamageMap {
  constructor(aspectHW, size = 256) {
    this.w = size;
    this.h = Math.max(48, Math.min(512, Math.round(size * aspectHW)));
    this.c = document.createElement('canvas');
    this.c.width = this.w; this.c.height = this.h;
    this.g = this.c.getContext('2d');
    this.g.fillStyle = '#000'; this.g.fillRect(0, 0, this.w, this.h);
    this.g.globalCompositeOperation = 'lighter';
    this.tex = new THREE.CanvasTexture(this.c);
    this.tex.colorSpace = THREE.NoColorSpace;
    this.tex.generateMipmaps = false;
    this.tex.minFilter = THREE.LinearFilter;
    this.heat = 0;
  }
  px(u, v) { return [u * this.w, (1 - v) * this.h]; }
  blob(u, v, r, color, a) {
    const [x, y] = this.px(u, v), R = r * this.w;
    const gr = this.g.createRadialGradient(x, y, 0, x, y, R);
    gr.addColorStop(0, `rgba(${color},${a})`);
    gr.addColorStop(0.55, `rgba(${color},${a * 0.75})`);
    gr.addColorStop(1, `rgba(${color},0)`);
    this.g.fillStyle = gr;
    this.g.fillRect(x - R, y - R, R * 2, R * 2);
  }
  hole(u, v, r = 0.05) {
    this.blob(u, v, r, '255,0,0', 1);
    for (let i = 0; i < 3; i++) { // small tears around the hole
      const a = Math.random() * 6.28, d = r * (0.8 + Math.random() * 0.9);
      this.blob(u + Math.cos(a) * d, v + Math.sin(a) * d * (this.w / this.h), r * 0.35, '255,0,0', 0.7);
    }
    this.blob(u, v, r * 1.9, '0,255,0', 0.18);
    this.tex.needsUpdate = true;
  }
  cut(pts, width = 0.018) {
    if (pts.length < 2) return;
    const g = this.g;
    g.lineCap = 'round'; g.lineJoin = 'round';
    const path = () => { g.beginPath(); pts.forEach((p, i) => { const [x, y] = this.px(p[0], p[1]); i ? g.lineTo(x, y) : g.moveTo(x, y); }); };
    path(); g.strokeStyle = 'rgba(0,255,0,0.3)'; g.lineWidth = width * 3.6 * this.w; g.stroke();
    path(); g.strokeStyle = 'rgba(255,0,0,0.7)'; g.lineWidth = width * 2.2 * this.w; g.stroke();
    path(); g.strokeStyle = 'rgba(255,0,0,1)'; g.lineWidth = width * 1.2 * this.w; g.stroke();
    this.tex.needsUpdate = true;
  }
  scorch(u, v, r = 0.08, amt = 0.3) {
    this.blob(u, v, r, '0,255,0', amt);
    this.blob(u, v, r * 0.8, '0,0,255', Math.min(1, amt * 2.2));
    this.heat = 1;
    this.tex.needsUpdate = true;
  }
  update(dt) {
    if (this.heat <= 0) return;
    this.heat -= dt * 0.5;
    const g = this.g;
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = `rgb(255,255,${Math.round(255 * Math.exp(-dt * 1.4))})`;
    g.fillRect(0, 0, this.w, this.h);
    g.globalCompositeOperation = 'lighter';
    this.tex.needsUpdate = true;
  }
  dispose() { this.tex.dispose(); }
}

// solid: the damage changes the material only (monsters, the boss); otherwise it can hole the paper (covers, props)
export function attachDamage(mesh, dm, solid = false) {
  mesh.material.uniforms.dmg.value = dm.tex;
  mesh.material.uniforms.useDmg.value = 1;
  mesh.material.uniforms.dmgSolid.value = solid ? 1 : 0;
}

// Archangel Lion (CELESTIAL): white marble lion, golden shard mane, great gold-trimmed angel wings,
// floating glowing halo, glowing sky-blue rune markings painted into the marble (per-facet planar projection).
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// ---------------- colours ----------------
const MB_TOP = [255, 255, 255], MB_BOT = [214, 210, 228];   // white marble
const VEIN_TOP = [222, 218, 236], VEIN_BOT = [184, 178, 204]; // soft lavender-grey veins
const GL = [150, 242, 255], GL_BOT = [70, 205, 255];         // glowing runes (bright even without emissive)
const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const lerp3 = (a, b, t) => [0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * Math.min(1, Math.max(0, t)));
const clamp01 = (t) => Math.min(1, Math.max(0, t));

// ---------------- layout ----------------
const H = { y: 0.74, z: 0.36, hx: 0.2, hy: 0.155, hz: 0.155 }; // head centre & half sizes

// marble veins (symmetric in |x| where needed)
function vein(a, b) {
  const v1 = Math.sin(a * 13 + Math.sin(b * 8.5) * 1.8 + Math.sin(a * 4.3 + b * 2.7) * 1.2);
  const v2 = Math.sin(b * 11 - a * 6 + Math.sin(a * 9.1) * 1.4);
  return Math.abs(v1) < 0.06 || Math.abs(v2) < 0.035;
}
const segD = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay;
  const t = clamp01(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
};
// flank: forward-pointing chevrons + diamonds
function runeSide(z, y) {
  for (const [z0, yc, s] of [[-0.31, 0.4, 0.9], [-0.17, 0.41, 1], [-0.02, 0.42, 1.05]]) {
    if (segD(z, y, z0, yc, z0 - 0.075 * s, yc + 0.085 * s) < 0.011) return true;
    if (segD(z, y, z0, yc, z0 - 0.075 * s, yc - 0.085 * s) < 0.011) return true;
    if (Math.abs(z - z0 - 0.04) + Math.abs(y - yc) < 0.02 * s) return true;
  }
  return false;
}
function runeTop(z, x) {
  const ax = Math.abs(x);
  for (const z0 of [-0.4, -0.27]) if (Math.abs(z - z0) / 0.045 + ax / 0.03 < 1) return true;
  if (z < -0.2 && z > -0.46 && ax < 0.007) return true;
  return false;
}
function runeHeadFront(x, ly) {
  const ax = Math.abs(x);
  if (Math.abs(ly - 0.115) / 0.055 + ax / 0.026 < 1) return true;  // forehead diamond
  if (ly > 0.16 && ly < 0.24 && ax < 0.008) return true;            // line up over the crown
  return false;
}
function runeHeadSide(lz, ly) {
  // cheek swoosh
  return segD(lz, ly, 0.08, -0.01, -0.06, 0.04) < 0.01 || segD(lz, ly, 0.06, -0.06, -0.06, -0.02) < 0.009;
}
function runeHeadTop(x, lz) { return Math.abs(x) < 0.008 && lz > -0.08; }
function runeLeg(u, y) {
  const au = Math.abs(u);
  if (Math.abs(y - 0.19) < 0.011) return true;                        // band
  if (au < 0.06 && Math.abs(y - 0.25 - 0.9 * au) < 0.011) return true; // up-chevron
  return false;
}

const marble = (a, b, t, rune, glowPass) => {
  if (rune) return glowPass ? lerp3(GL, GL_BOT, t * 0.5) : lerp3(GL, GL_BOT, t * 0.6);
  if (glowPass) return [0, 0, 0];
  return vein(a, b) ? lerp3(VEIN_TOP, VEIN_BOT, t) : lerp3(MB_TOP, MB_BOT, t);
};
const REG = {
  bodySide: { x: 0, y: 256, w: 512, h: 256, a: [-0.62, 0.42], b: [0.7, 0.1],
    col: (z, y, gp) => marble(z, y, (0.62 - y) / 0.42, runeSide(z, y), gp) },
  bodyTop: { x: 512, y: 256, w: 512, h: 256, a: [-0.62, 0.42], b: [-0.28, 0.28],
    col: (z, x, gp) => marble(z, Math.abs(x), 0.0, runeTop(z, x), gp) },
  headFront: { x: 0, y: 512, w: 256, h: 256, a: [-0.28, 0.28], b: [0.28, -0.24],
    col: (x, ly, gp) => marble(Math.abs(x), ly, (0.2 - ly) / 0.42 * 0.7, runeHeadFront(x, ly), gp) },
  headSide: { x: 256, y: 512, w: 256, h: 256, a: [-0.26, 0.26], b: [0.28, -0.24],
    col: (lz, ly, gp) => marble(lz, ly, (0.2 - ly) / 0.42 * 0.7, runeHeadSide(lz, ly), gp) },
  headTop: { x: 512, y: 512, w: 256, h: 256, a: [-0.28, 0.28], b: [-0.26, 0.26],
    col: (x, lz, gp) => marble(Math.abs(x), lz, 0, runeHeadTop(x, lz), gp) },
  legF: { x: 768, y: 512, w: 128, h: 256, a: [-0.14, 0.14], b: [0.62, 0.0],
    col: (u, y, gp) => marble(Math.abs(u) * 2, y, (0.55 - y) / 0.55, runeLeg(u, y), gp) },
  legB: { x: 896, y: 512, w: 128, h: 256, a: [-0.16, 0.16], b: [0.62, 0.0],
    col: (u, y, gp) => marble(Math.abs(u) * 2 + 1, y, (0.55 - y) / 0.55, runeLeg(u, y), gp) },
};
// cell 63 is never used: it holds the atlas background (black in the emissive pass, white otherwise)
const isGlowPass = (g) => g.getImageData(1020, 1020, 1, 1).data[0] < 10;
function drawRegions(g) {
  const gp = isGlowPass(g);
  for (const r of Object.values(REG)) {
    const img = g.createImageData(r.w, r.h);
    for (let py = 0; py < r.h; py++) for (let px = 0; px < r.w; px++) {
      const acc = [0, 0, 0];
      for (const [ox, oy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
        const a = r.a[0] + ((px + ox) / r.w) * (r.a[1] - r.a[0]);
        const b = r.b[0] + ((py + oy) / r.h) * (r.b[1] - r.b[0]);
        const c = r.col(a, b, gp);
        for (let k = 0; k < 3; k++) acc[k] += c[k] / 4;
      }
      const o = (py * r.w + px) * 4;
      img.data[o] = acc[0]; img.data[o + 1] = acc[1]; img.data[o + 2] = acc[2]; img.data[o + 3] = 255;
    }
    g.putImageData(img, r.x, r.y);
  }
}
const regUV = (r, a, b) => {
  const fa = clamp01((a - r.a[0]) / (r.a[1] - r.a[0])), fb = clamp01((b - r.b[0]) / (r.b[1] - r.b[0]));
  return [(r.x + 3 + fa * (r.w - 6)) / 1024, (r.y + 3 + fb * (r.h - 6)) / 1024];
};

export const PALETTE = {
  white:  { i: 0, top: '#FFFFFF', bot: '#DAD6E8' },
  muzzle: { i: 1, top: '#FFFDF6', bot: '#EFE4D2' },
  mane:   { i: 2, top: '#FFE36A', bot: '#F0A818' },
  maneDk: { i: 3, top: '#FFCB3A', bot: '#D98A0E' },
  eye:    { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  eyeW:   { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  gold:   { i: 6, top: '#FFE680', bot: '#E09C14' },
  brow:   { i: 7, top: '#E9E4F4', bot: '#9C92BC' },
  nose:   { i: 8, top: '#D98E98', bot: '#A65864' },
  mouth:  { i: 9, top: '#7A4A54', bot: '#4A2A32' },
  feather:{ i: 10, draw: (g, x, y) => { // white quill, solid gold tip (t > 0.74)
    const gr = g.createLinearGradient(0, y + 16, 0, y + 87); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(1, '#F1F2FA');
    g.fillStyle = gr; g.fillRect(x, y, 128, 88);
    const gg = g.createLinearGradient(0, y + 88, 0, y + 128); gg.addColorStop(0, '#FFE070'); gg.addColorStop(1, '#F0A820');
    g.fillStyle = gg; g.fillRect(x, y + 88, 128, 40); } },
  light:  { i: 11, top: '#FFF4D8', bot: '#F5DDA4' },
  halo:   { i: 12, top: '#FFFBC8', bot: '#FFD23A', glow: true },
  gem:    { i: 13, top: '#E6FDFF', bot: '#5CD8FF', glow: true },
  paw:    { i: 14, top: '#FFFFFF', bot: '#DCD6EA' },
  earIn:  { i: 15, top: '#FFE9A8', bot: '#F2BE52' },
  marble: { i: 16, glow: true, draw: drawRegions }, // paints every REG rect (rows 2..5)
};
const SW = PALETTE;

// per-facet planar projection: pick(n) -> [region, (p) => [a, b]]
function project(g, pick) {
  const p = g.attributes.position, uv = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    n.subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const [r, f] = pick(n);
    for (const v of [a, b, c]) uv.push(...regUV(r, ...f(v)));
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
const bodyPaint = (g) => project(g, (n) =>
  n.y > 0.8 ? [REG.bodyTop, (v) => [v.z, v.x]] : [REG.bodySide, (v) => [v.z, v.y]]);
const headPaint = (g) => project(g, (n) => {
  const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
  if (n.y > 0 && ay >= ax && ay >= az * 0.8) return [REG.headTop, (v) => [v.x, v.z - H.z]];
  if (az >= ax) return [REG.headFront, (v) => [v.x, v.y - H.y]];
  return [REG.headSide, (v) => [v.z - H.z, v.y - H.y]];
});
const legPaint = (g, reg, cx, cz) => project(g, (n) =>
  Math.abs(n.z) > Math.abs(n.x) ? [reg, (v) => [v.x - cx, v.y]] : [reg, (v) => [v.z - cz, v.y]]);

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const sub = (a, b) => a.clone().sub(b);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);

// flat blade (feather / mane lock): convex polygon prism in the plane of dir with normal n
function blade(base, dir, n, L, w, th = 0.016, shape = null, ridge = 0) {
  const d = nrm(dir);
  const nn = nrm(add(n, d, -n.dot(d)));
  const v = nrm(cross(nn, d));
  const pts2 = shape || [[0, -0.3], [0, 0.3], [0.2, 0.5], [0.8, 0.5], [1, 0.05], [0.8, -0.5], [0.2, -0.5]];
  const pts = [];
  for (const [u, s] of pts2) {
    const p = add(add(base, d, u * L), v, s * w);
    const t = th * (u > 0.9 ? 0.6 : 1);
    pts.push(add(p, nn, t / 2), add(p, nn, -t / 2));
  }
  // optional centre ridge: faceted both sides so the back of a wing also catches light
  if (ridge) for (const u of [0.08, 0.6]) { const p = add(base, d, u * L); pts.push(add(p, nn, ridge), add(p, nn, -ridge)); }
  return hull(pts);
}

// UV by distance along a blade (0 = base, 1 = tip), for gold-tipped feathers
function alongPaint(g, sw, base, dir, L) {
  const p = g.attributes.position, d = nrm(dir), uv = [];
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  for (let i = 0; i < p.count; i++) {
    const t = clamp01((V(p.getX(i), p.getY(i), p.getZ(i)).sub(base).dot(d)) / L);
    uv.push((x + 64) / 1024, (y + 16 + t * 100) / 1024);
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const gold = (g) => paint(g, SW.gold, 'y');
  const goldF = (g) => paint(g, SW.gold, 'flat');

  // ================= TORSO (powerful barrel) =================
  C.push(bodyPaint(hull([
    ...ring(V(0, 0.42, -0.44), 0.11, 0.1, 10, 'z'),
    ...ring(V(0, 0.41, -0.38), 0.18, 0.165, 10, 'z'),
    ...ring(V(0, 0.4, -0.2), 0.195, 0.18, 10, 'z'),
    ...ring(V(0, 0.4, 0.0), 0.2, 0.185, 10, 'z'),
    ...ring(V(0, 0.42, 0.15), 0.2, 0.185, 10, 'z'),
    ...ring(V(0, 0.46, 0.26), 0.15, 0.14, 10, 'z'),
  ])));
  C.push(headPaint(hull([...ring(V(0, 0.48, 0.2), 0.15, 0.14, 10, 'y'), ...ring(V(0, 0.66, 0.3), 0.16, 0.12, 10, 'y')])));

  // ================= LEGS =================
  const FL = { x: 0.155, z: 0.19 };
  S.push(legPaint(hull([...ring(V(FL.x, 0.06, FL.z + 0.01), 0.094, 0.092, 8), ...ring(V(FL.x - 0.004, 0.2, FL.z), 0.1, 0.1, 8),
    ...ring(V(FL.x - 0.02, 0.38, FL.z - 0.02), 0.114, 0.128, 8), ...ring(V(FL.x - 0.03, 0.49, FL.z - 0.03), 0.08, 0.1, 8)]), REG.legF, FL.x, FL.z));
  const BL = { x: 0.16, z: -0.3 };
  S.push(legPaint(hull([...ring(V(BL.x - 0.015, 0.45, BL.z + 0.02), 0.145, 0.145, 8, 'x'),
    ...ring(V(BL.x + 0.005, 0.45, BL.z + 0.02), 0.125, 0.125, 8, 'x'),
    ...ring(V(BL.x + 0.005, 0.2, BL.z - 0.03), 0.098, 0.1, 8)]), REG.legB, BL.x, BL.z));
  S.push(legPaint(hull([...ring(V(BL.x + 0.005, 0.22, BL.z - 0.03), 0.095, 0.1, 8), ...ring(V(BL.x + 0.008, 0.06, BL.z), 0.09, 0.088, 8)]),
    REG.legB, BL.x, BL.z));
  // gold anklets (trim) + paws with gold claws
  const anklet = (x, z, r) => S.push(gold(hull([...ring(V(x, 0.085, z), r, r, 8), ...ring(V(x, 0.125, z), r * 0.97, r * 0.97, 8)])));
  anklet(FL.x, FL.z + 0.008, 0.104);
  anklet(BL.x + 0.008, BL.z - 0.002, 0.1);
  const paw = (x, z, s = 1) => {
    S.push(paint(hull(cbox(V(x, 0.045, z), 0.08 * s, 0.045, 0.074 * s, 0.024)), SW.paw, 'y', [0, 0.1]));
    for (const dx of [-0.054, -0.018, 0.018, 0.054]) {
      S.push(paint(hull(cbox(V(x + dx * s, 0.036, z + 0.07 * s), 0.02 * s, 0.036, 0.03, 0.01)), SW.paw, 'y', [0, 0.1]));
      S.push(goldF(shard(V(x + dx * s, 0.026, z + 0.1 * s), V(0, -0.5, 1), 0.012, 0.035)));
    }
  };
  paw(FL.x, FL.z + 0.02, 1.28);
  paw(BL.x + 0.008, BL.z + 0.02, 1.22);

  // ================= HEAD =================
  const hc0 = C.length, hs0 = S.length;
  C.push(headPaint(hull([
    ...cbox(V(0, H.y - 0.01, H.z), H.hx, H.hy - 0.01, H.hz, 0.07),
    ...ring(V(0, H.y + 0.18, H.z - 0.01), 0.14, 0.12, 10, 'y'),
    ...ring(V(0, H.y + 0.06, H.z - 0.16), 0.19, 0.15, 10, 'z'),
    V(0.23, H.y - 0.07, H.z + 0.05), V(-0.23, H.y - 0.07, H.z + 0.05),
    V(0.21, H.y - 0.12, H.z + 0.02), V(-0.21, H.y - 0.12, H.z + 0.02),
  ])));
  const FZ = H.z + H.hz;

  // muzzle, chin, nose, mouth
  C.push(paint(hull([...cbox(V(0, H.y - 0.07, FZ + 0.035), 0.085, 0.06, 0.075, 0.03),
    V(0.065, H.y + 0.0, FZ - 0.03), V(-0.065, H.y + 0.0, FZ - 0.03)]), SW.muzzle, 'y', [H.y - 0.15, H.y]));
  // puffy whisker pads either side of the nose
  S.push(paint(hull([...cbox(V(0.062, H.y - 0.088, FZ + 0.05), 0.068, 0.05, 0.058, 0.026),
    V(0.13, H.y - 0.07, FZ - 0.02), V(0.12, H.y - 0.13, FZ - 0.02)]), SW.muzzle, 'y', [H.y - 0.15, H.y - 0.03]));
  // chunky lion jaw / chin
  C.push(paint(hull([...cbox(V(0, H.y - 0.152, FZ + 0.01), 0.095, 0.04, 0.07, 0.02), V(0, H.y - 0.2, FZ + 0.0)]), SW.muzzle, 'y', [H.y - 0.2, H.y - 0.11]));
  // white cheek tufts sweeping out & down in front of the mane
  for (const [b, d, w, l] of [
    [V(0.19, H.y - 0.06, H.z + 0.1), V(1, -0.35, 0.25), 0.045, 0.08],
    [V(0.18, H.y - 0.12, H.z + 0.1), V(0.8, -0.8, 0.25), 0.045, 0.085],
    [V(0.12, H.y - 0.17, H.z + 0.12), V(0.35, -1, 0.3), 0.04, 0.07],
  ]) S.push(paint(shard(b, d, w, l), SW.white, 'y', [H.y - 0.26, H.y - 0.02]));
  C.push(paint(hull([...cbox(V(0, H.y - 0.035, FZ + 0.108), 0.05, 0.022, 0.02, 0.01),
    V(0, H.y - 0.075, FZ + 0.1), V(0.02, H.y - 0.065, FZ + 0.1), V(-0.02, H.y - 0.065, FZ + 0.1)]), SW.nose, 'y'));
  C.push(paint(hull(cbox(V(0, H.y - 0.095, FZ + 0.105), 0.006, 0.022, 0.006, 0.002)), SW.mouth, 'flat'));
  S.push(paint(hull([V(0, H.y - 0.117, FZ + 0.11), V(0, H.y - 0.105, FZ + 0.11), V(0.06, H.y - 0.127, FZ + 0.098),
    V(0.06, H.y - 0.117, FZ + 0.098), V(0, H.y - 0.117, FZ + 0.1), V(0.06, H.y - 0.123, FZ + 0.085)]), SW.mouth, 'flat'));

  // fierce eyes
  const E = V(0.092, H.y + 0.035, 0);
  S.push(paint(hull(plate([[-0.044, 0.004], [0.048, 0.034], [0.054, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.048, -0.016]],
    E, FZ - 0.01, FZ + 0.012)), SW.eyeW, 'flat'));
  S.push(paint(hull(plate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]],
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.014, FZ + 0.021)), SW.eyeW, 'flat'));
  S.push(paint(hull([
    V(0.03, E.y + 0.012, FZ + 0.03), V(0.032, E.y + 0.05, FZ + 0.02),
    V(0.16, E.y + 0.05, FZ - 0.01), V(0.16, E.y + 0.09, FZ - 0.025),
    V(0.03, E.y + 0.012, FZ - 0.03), V(0.032, E.y + 0.06, FZ - 0.04),
    V(0.16, E.y + 0.05, FZ - 0.06), V(0.16, E.y + 0.092, FZ - 0.07),
  ]), SW.brow, 'y'));

  // round ears with gold inners
  const EA = V(0.15, H.y + 0.17, H.z - 0.02);
  S.push(paint(hull([...ring(EA, 0.07, 0.07, 10, 'z', 0), ...ring(V(EA.x + 0.005, EA.y - 0.01, EA.z - 0.05), 0.075, 0.07, 10, 'z', 0)]),
    SW.white, 'y', [H.y + 0.1, H.y + 0.26]));
  S.push(paint(hull([...ring(V(EA.x, EA.y - 0.006, EA.z + 0.012), 0.045, 0.045, 10, 'z', 0),
    ...ring(V(EA.x, EA.y - 0.006, EA.z - 0.01), 0.045, 0.045, 10, 'z', 0)]), SW.earIn, 'y', [EA.y - 0.05, EA.y + 0.05]));

  // ================= GOLDEN MANE (layered shard sunburst framing the face) =================
  const MC = V(0, H.y - 0.01, 0);
  C.push(paint(hull([...ring(V(0, H.y - 0.01, H.z - 0.06), 0.24, 0.22, 12, 'z'), ...ring(V(0, H.y + 0.0, H.z - 0.2), 0.16, 0.15, 12, 'z'),
    ...ring(V(0, H.y - 0.04, H.z - 0.26), 0.1, 0.1, 12, 'z')]), SW.maneDk, 'y', [H.y - 0.25, H.y + 0.25]));
  const kite = [[0, -0.35], [0, 0.35], [0.4, 0.5], [1, 0], [0.4, -0.5]];
  const maneRing = (n, a0, a1, rx, ry, z, back, L, w, sw, center) => {
    for (let i = 0; i < n; i++) {
      const a = a0 + (a1 - a0) * i / Math.max(1, n - 1);
      const r = V(Math.cos(a), Math.sin(a), 0);
      const base = V(MC.x + rx * r.x, MC.y + ry * r.y, z);
      const dir = add(r, V(0, 0, -back));
      const g = paint(blade(base, dir, V(r.x * 0.5, r.y * 0.5, 1), L, w, 0.045, kite), sw, 'flat');
      (center && Math.abs(r.x) < 1e-3 ? C : S).push(g);
    }
  };
  // front layer (bright gold), right side from chin to crown
  maneRing(6, -1.25, 1.2, 0.19, 0.17, H.z + 0.04, 0.35, 0.15, 0.1, SW.mane);
  // middle layer, darker, longer, offset
  maneRing(6, -1.05, 1.35, 0.2, 0.19, H.z - 0.05, 0.6, 0.2, 0.12, SW.maneDk);
  // back layer, swept back
  maneRing(5, -0.9, 1.25, 0.18, 0.17, H.z - 0.16, 1.2, 0.22, 0.12, SW.mane);
  // rear layers: shards fanning outward & back so the mane is 3D from behind
  maneRing(5, -1.15, 1.3, 0.14, 0.13, H.z - 0.22, 1.5, 0.19, 0.11, SW.maneDk);
  maneRing(4, -0.75, 1.0, 0.07, 0.07, H.z - 0.27, 2.4, 0.15, 0.1, SW.mane);
  // shards on the back of the mane mass, pointing back
  C.push(paint(shard(V(0, H.y + 0.0, H.z - 0.26), V(0, 0.1, -1), 0.08, 0.14), SW.mane, 'flat'));
  for (const [x, y, d] of [[0.1, 0.08, V(0.5, 0.4, -1)], [0.12, -0.08, V(0.5, -0.4, -1)], [0.0, 0.12, V(0, 0.7, -1)], [0, -0.13, V(0, -0.7, -1)]])
    (x === 0 ? C : S).push(paint(shard(V(x, H.y + y, H.z - 0.22), d, 0.07, 0.13), SW.maneDk, 'flat'));
  // centre top & chin beard
  C.push(paint(blade(V(0, MC.y + 0.18, H.z + 0.0), V(0, 1, -0.5), V(0, 0, 1), 0.17, 0.11, 0.035, kite), SW.mane, 'flat'));
  C.push(paint(blade(V(0, MC.y + 0.18, H.z - 0.12), V(0, 1, -1.1), V(0, 0, 1), 0.2, 0.12, 0.035, kite), SW.maneDk, 'flat'));
  C.push(paint(blade(V(0, H.y - 0.15, H.z + 0.08), V(0, -1, 0.35), V(0, 0, 1), 0.16, 0.1, 0.035, kite), SW.mane, 'flat'));
  // chest mane: gold ruff down the neck and chest
  C.push(paint(blob(1, V(0, 0.5, 0.3), V(0.16, 0.17, 0.1), { jitter: 0.18 }), SW.mane, 'y', [0.3, 0.7]));
  C.push(paint(shard(V(0, 0.38, 0.32), V(0, -1, 0.35), 0.065, 0.13), SW.mane, 'flat'));
  C.push(paint(shard(V(0, 0.49, 0.37), V(0, -0.7, 1), 0.07, 0.09), SW.maneDk, 'flat'));
  for (const [b, d, w, l, sw] of [
    [V(0.065, 0.37, 0.31), V(0.25, -1, 0.35), 0.058, 0.12, SW.maneDk],
    [V(0.12, 0.4, 0.28), V(0.6, -1, 0.3), 0.055, 0.11, SW.mane],
    [V(0.07, 0.49, 0.36), V(0.35, -0.7, 1), 0.06, 0.085, SW.mane],
    [V(0.14, 0.49, 0.3), V(0.8, -0.9, 0.5), 0.058, 0.085, SW.maneDk],
    [V(0.16, 0.56, 0.22), V(1, -0.6, -0.2), 0.06, 0.1, SW.mane],
  ]) S.push(paint(shard(b, d, w, l), sw, 'flat'));
  // mane down the back of the neck
  for (const [b, d, w, l, sw] of [
    [V(0.0, 0.72, 0.12), V(0, -0.3, -1), 0.07, 0.16, SW.maneDk],
    [V(0.1, 0.68, 0.14), V(0.6, -0.6, -0.7), 0.06, 0.15, SW.mane],
  ]) (b.x === 0 ? C : S).push(paint(shard(b, d, w, l), sw, 'flat'));

  // ================= FLOATING HALO (glowing gold ring) =================
  const HC = V(0, H.y + 0.35, H.z - 0.11), HR = 0.17, tilt = 0.22, NSEG = 12;
  const hp = (ang, dr, dy) => {
    const x = Math.cos(ang) * (HR + dr), z = Math.sin(ang) * (HR + dr);
    // tilt about x (back edge higher)
    return V(HC.x + x, HC.y + dy * Math.cos(tilt) - z * Math.sin(tilt), HC.z + z * Math.cos(tilt) + dy * Math.sin(tilt));
  };
  const xs = [[0.032, 0], [0.016, 0.024], [-0.016, 0.024], [-0.032, 0], [-0.016, -0.024], [0.016, -0.024]];
  for (let k = 0; k < NSEG; k++) {
    const a0 = (2 * Math.PI * k) / NSEG, a1 = (2 * Math.PI * (k + 1)) / NSEG;
    C.push(paint(hull([...xs.map(([dr, dy]) => hp(a0, dr, dy)), ...xs.map(([dr, dy]) => hp(a1, dr, dy))]), SW.halo, 'y'));
  }
  // crown-halo: short glowing points rising from the ring
  const up = V(0, Math.cos(tilt), Math.sin(tilt));
  for (const [ang, len, part] of [[Math.PI / 2, 0.1, C], [Math.PI / 2 - 0.85, 0.08, S], [-0.35, 0.07, S], [-Math.PI / 2, 0.06, C]])
    part.push(paint(shard(hp(ang, 0, 0.012), up, 0.022, len), SW.halo, 'y'));

  // big-head look: scale head, mane and halo about the neck
  const HS = 1.21, piv = V(0, 0.56, 0.3);
  for (const g of [...C.slice(hc0), ...S.slice(hs0)]) {
    g.translate(-piv.x, -piv.y, -piv.z); g.scale(HS, HS, HS); g.translate(piv.x, piv.y, piv.z);
  }

  // ================= TAIL (white, gold cuff, gold tuft) =================
  const tailPts = [V(0, 0.46, -0.42), V(0, 0.44, -0.55), V(0, 0.32, -0.66), V(0, 0.3, -0.78), V(0, 0.4, -0.86)];
  C.push(paint(tube(curveSamples(tailPts, 7, (t) => 0.045 - 0.012 * t), { seg: 6, axis: X, capEnd: 0.0, phase: Math.PI / 6 }), SW.white, 'len'));
  C.push(gold(hull([...ring(V(0, 0.36, -0.835), 0.042, 0.042, 8, 'y'), ...ring(V(0, 0.41, -0.86), 0.05, 0.05, 8, 'y')])));
  C.push(paint(shard(V(0, 0.43, -0.87), V(0, 1, -0.3), 0.055, 0.14), SW.mane, 'flat'));
  S.push(paint(shard(V(0.02, 0.43, -0.87), V(0.6, 0.8, -0.4), 0.045, 0.12), SW.maneDk, 'flat'));
  C.push(paint(shard(V(0, 0.42, -0.88), V(0, 0.4, -1), 0.05, 0.12), SW.maneDk, 'flat'));

  // ================= GREAT ANGEL WINGS (heroic V: tips up & back; gold-tipped white primaries) =================
  const SH = V(0.13, 0.6, -0.06), WR = V(0.4, 1.03, -0.17), TP = V(0.62, 1.4, -0.44);
  const edgePts = [SH, add(SH, sub(WR, SH), 0.5), WR, add(WR, sub(TP, WR), 0.5).add(V(0, 0.03, 0.02)), TP];
  const edge = new THREE.CatmullRomCurve3(edgePts, false, 'centripetal');
  const wN = nrm(cross(sub(TP, SH), V(0.2, -1, -0.45)));
  if (wN.z < 0) wN.negate();
  const bN = nrm(add(wN, V(0, 0.6, 0.15)));
  const fk = [[0, -0.35], [0, 0.35], [0.7, 0.5], [1, 0], [0.7, -0.5]];
  const fdir = (t) => nrm(V(0.25, -1, -0.45).lerp(V(0.75, 0.45, -0.6), Math.pow(t, 1.15)));
  S.push(paint(tube(curveSamples(edgePts, 10, (t) => 0.06 - 0.024 * t, (t) => 0.044 - 0.016 * t),
    { seg: 6, ref: wN, capEnd: 0.045, capStart: 0.01 }), SW.gold, 'len'));
  S.push(goldF(shard(add(WR, V(0.02, 0.03, 0.02)), V(0.6, 0.6, 0.3), 0.035, 0.1)));
  const coverts = (g) => project(g, () => [REG.bodyTop, (v) => [v.z * 0.8 + v.y * 0.3 - 0.5, 0.2 + v.x * 0.1]]);
  // long primaries / flight feathers (white, gold tips)
  const NP = 11;
  for (let i = 0; i < NP; i++) {
    const t = 0.06 + 0.94 * i / (NP - 1);
    const L = 0.3 + 0.24 * Math.sin(Math.PI * Math.min(1, t * 0.85 + 0.15));
    const b0 = add(edge.getPoint(t), wN, -0.024 - 0.002 * i), d = fdir(t);
    S.push(alongPaint(blade(b0, d, bN, L, 0.15, 0.03, fk, 0.034), SW.feather, b0, d, L));
  }
  // secondaries (cream)
  const NS = 8;
  for (let i = 0; i < NS; i++) {
    const t = 0.04 + 0.9 * i / (NS - 1);
    S.push(paint(blade(add(edge.getPoint(t), wN, 0.004 - 0.002 * i), fdir(t), bN, 0.2 + 0.08 * t, 0.13, 0.028, fk), SW.light, 'y'));
  }
  // marble coverts along the arm
  const NC = 7;
  for (let i = 0; i < NC; i++) {
    const t = 0.05 + 0.85 * i / (NC - 1);
    S.push(coverts(blade(add(edge.getPoint(t), wN, 0.03 - 0.002 * i), fdir(t), bN, 0.12 + 0.04 * t, 0.1, 0.026, fk)));
  }
  return assemble(C, S);
}

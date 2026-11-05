// Meteor Moose: purple armoured moose with burning meteor-rock antlers, comet trails and glowing eyes.
import { V, THREE, hash3, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  body:    { i: 0, top: '#A877F0', bot: '#5E35A8' },
  mane:    { i: 1, top: '#8657D6', bot: '#41226F' },
  belly:   { i: 2, top: '#E2C9FF', bot: '#AE86E6' },
  rock:    { i: 3, top: '#7A6560', bot: '#3A2C2C' },
  lava:    { i: 4, top: '#FFC04D', bot: '#FF6A00', glow: true },
  flame:   { i: 5, top: '#FFB13B', bot: '#FF5A0A', glow: true },
  core:    { i: 6, top: '#FFFBD0', bot: '#FFD43F', glow: true },
  gold:    { i: 7, top: '#FFE07A', bot: '#D69A1E' },
  armor:   { i: 8, top: '#4E46B8', bot: '#2A2270' },
  white:   { i: 9, top: '#FFFFFF', bot: '#FFF6D6', glow: true },
  eye:     { i: 10, top: '#1A1416', bot: '#0C0A0B' },
  iris:    { i: 11, top: '#FFB13B', bot: '#FF6A00', glow: true },
  brow:    { i: 12, top: '#8D5EDC', bot: '#4C2A88' },
  nose:    { i: 13, top: '#4A2C5E', bot: '#2A1638' },
  hoof:    { i: 14, top: '#5E4C4A', bot: '#2E2424' },
  muzzle:  { i: 16, top: '#CDA8F5', bot: '#9A6EDB' },
  crack:   { i: 17, top: '#FFD040', bot: '#FF5200', glow: true }, // bright lava seams (yellow core -> orange)
  fire:    { i: 15, top: '#FF5A08', bot: '#FFD84A', glow: true }, // painted by height: pale-yellow base -> orange tips
};
const SW = PALETTE;

// ---- small local helpers ----
// convex 2D polygon clip, keeps a*u + b*v <= c
function clip(poly, a, b, c) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const dp = a * p[0] + b * p[1] - c, dq = a * q[0] + b * q[1] - c;
    if (dp <= 0) out.push(p);
    if ((dp < 0 && dq > 0) || (dp > 0 && dq < 0)) {
      const t = dp / (dp - dq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out;
}
// extrude a 2D polygon in an arbitrary frame (O + u*U + v*Vv + n*N)
const slab = (poly, O, U, Vv, N, n0, n1) => poly.flatMap(([u, v]) => [n0, n1].map((n) =>
  O.clone().addScaledVector(U, u).addScaledVector(Vv, v).addScaledVector(N, n)));
// arc of an elliptical body section (angles in degrees, 90 = top)
const arc = (cy, cz, rx, ry, a0, a1, n, s = 1) => {
  const pts = [];
  for (let k = 0; k <= n; k++) {
    const a = ((a0 + (a1 - a0) * k / n) * Math.PI) / 180;
    pts.push(V(Math.cos(a) * rx * s, cy + Math.sin(a) * ry * s, cz));
  }
  return pts;
};
// teardrop flame rising (mostly) up, slightly flattened in z
const flame = (b, h, w, lean = V(0, 0, -0.25), flatZ = 0.7) => {
  const pts = [];
  for (const [f, r] of [[0, 0.55], [0.32, 1], [0.62, 0.62]]) {
    const c = b.clone().addScaledVector(V(lean.x, 1, lean.z), h * f);
    for (let k = 0; k < 5; k++) {
      const a = (2 * Math.PI * k) / 5 + Math.PI / 10 + f;
      pts.push(V(c.x + Math.cos(a) * w * r, c.y, c.z + Math.sin(a) * w * r * flatZ));
    }
  }
  pts.push(b.clone().addScaledVector(V(lean.x * 1.6, 1, lean.z * 1.6), h));
  pts.push(b.clone().addScaledVector(V(0, -1, 0), w * 0.4));
  return hull(pts);
};

export function buildGeometry() {
  const C = [], S = [];      // upper body (dropped by DROP so the legs read short)
  const LS = [];             // legs + hooves (not dropped)
  const HC = [], HS = [];    // head group (scaled up about the neck)
  const X = V(1, 0, 0);
  const body = (pts, lo = 0.12, hi = 0.8) => paint(hull(pts), SW.body, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');
  const ys = (g, sw, lo, hi) => paint(g, sw, 'y', lo === undefined ? null : [lo, hi]);

  // ================= BODY (barrel with a moose shoulder hump) =================
  const SEC = [ // [z, cy, rx, ry]
    [-0.42, 0.44, 0.11, 0.1],
    [-0.35, 0.44, 0.19, 0.18],
    [-0.16, 0.45, 0.215, 0.2],
    [0.04, 0.47, 0.235, 0.22],
    [0.18, 0.49, 0.235, 0.22],
    [0.28, 0.5, 0.17, 0.18],
  ];
  C.push(body(SEC.flatMap(([z, cy, rx, ry]) => ring(V(0, cy, z), rx, ry, 10, 'z'))));
  // shoulder hump
  C.push(body([...cbox(V(0, 0.66, 0.08), 0.14, 0.07, 0.16, 0.05), ...cbox(V(0, 0.6, -0.08), 0.13, 0.05, 0.1, 0.04)]));
  // belly panel (lighter)
  C.push(ys(hull([...arc(0.45, -0.22, 0.215, 0.2, 235, 305, 4, 1.03), ...arc(0.47, 0.06, 0.235, 0.22, 235, 305, 4, 1.03),
    ...arc(0.45, -0.22, 0.215, 0.2, 235, 305, 4, 0.9), ...arc(0.47, 0.06, 0.235, 0.22, 235, 305, 4, 0.9)]), SW.belly, 0.2, 0.35));
  // neck
  C.push(body([...ring(V(0, 0.52, 0.24), 0.16, 0.17, 8, 'z'), ...ring(V(0, 0.63, 0.38), 0.14, 0.14, 8, 'z')], 0.3, 0.8));

  // ================= LEGS (short, thick) =================
  S.push(paint(blob(0, V(0.19, 0.45, 0.16), V(0.11, 0.15, 0.13), { jitter: 0.1 }), SW.body, 'y', [0.1, 0.75]));
  LS.push(body([...ring(V(0.2, 0.1, 0.18), 0.08, 0.082, 8), ...ring(V(0.205, 0.2, 0.17), 0.1, 0.1, 8),
    ...ring(V(0.19, 0.32, 0.15), 0.11, 0.115, 8)], 0.05, 0.75));
  S.push(paint(blob(1, V(0.16, 0.42, -0.27), V(0.1, 0.15, 0.14), { jitter: 0.04 }), SW.body, 'y', [0.1, 0.75]));
  LS.push(body([...ring(V(0.17, 0.3, -0.27), 0.095, 0.105, 8), ...ring(V(0.18, 0.19, -0.3), 0.09, 0.092, 8),
    ...ring(V(0.178, 0.1, -0.29), 0.08, 0.08, 8)], 0.05, 0.75));
  // cloven meteor-rock hooves with gold greave cuffs
  const hoof = (x, z) => {
    for (const dx of [-0.04, 0.04])
      LS.push(ys(hull([...cbox(V(x + dx, 0.04, z + 0.01), 0.039, 0.04, 0.064, 0.016),
        V(x + dx, 0.0, z + 0.08), V(x + dx, 0.05, z + 0.075)]), SW.hoof, 0, 0.09));
    LS.push(ys(hull([...ring(V(x, 0.085, z), 0.092, 0.09, 8, 'y'), ...ring(V(x, 0.125, z), 0.088, 0.086, 8, 'y')]), SW.gold, 0.07, 0.14));
  };
  hoof(0.2, 0.18);
  hoof(0.178, -0.29);

  // ================= SHARD FUR (dark hump mane, dewlap, tufts) =================
  const maneSh = (b, d, w, l, fl = 0.7) => ys(shard(b, d, w, l, 4, fl), SW.mane, 0.3, 0.9);
  C.push(maneSh(V(0, 0.72, 0.16), V(0, 0.7, -1), 0.08, 0.15));
  C.push(maneSh(V(0, 0.71, 0.02), V(0, 0.55, -1), 0.08, 0.14));
  C.push(maneSh(V(0, 0.66, -0.1), V(0, 0.4, -1), 0.07, 0.12));
  for (const [b, d, w, l] of [
    [V(0.09, 0.7, 0.14), V(0.4, 0.4, -1), 0.07, 0.13],
    [V(0.12, 0.68, 0.0), V(0.5, 0.2, -1), 0.065, 0.12],
  ]) S.push(maneSh(b, d, w, l));

  // ================= ARMOUR =================
  // saddle caparison over the back and down the flanks, gold hem
  const sad = SEC.slice(1, 4);
  C.push(ys(hull(sad.flatMap(([z, cy, rx, ry]) => arc(cy, z + (z < -0.3 ? 0.02 : 0.01), rx, ry, 2, 178, 10, 1.065))), SW.gold, 0.45, 0.7));
  C.push(ys(hull(sad.flatMap(([z, cy, rx, ry]) => arc(cy, z + (z < -0.3 ? 0.045 : -0.025), rx, ry, 10, 170, 10, 1.1))), SW.armor, 0.48, 0.7));
  // glowing runes along the spine
  for (const [z, s] of [[-0.24, 0.035], [-0.13, 0.03], [-0.03, 0.025]]) {
    const y = 0.45 + 0.205 * 1.1 + 0.006;
    const dia = [[0, s], [s * 0.7, 0], [0, -s], [-s * 0.7, 0]];
    C.push(flat(hull([...dia.map(([u, v]) => V(u, y - 0.03, z + v)), ...dia.map(([u, v]) => V(u, y + 0.008, z + v))]), SW.lava));
  }
  // comet emblem on each flank: glowing head with trailing streaks sweeping back and up
  {
    const sec = (z) => { // interpolated body section at z
      for (let i = 0; i < SEC.length - 1; i++) if (z <= SEC[i + 1][0]) {
        const t = (z - SEC[i][0]) / (SEC[i + 1][0] - SEC[i][0]);
        return SEC[i].map((v, k) => v + (SEC[i + 1][k] - v) * t);
      }
      return SEC[SEC.length - 1];
    };
    const sx = (y, z, off) => { const [, cy, rx, ry] = sec(z); const q = (y - cy) / (1.1 * ry); return 1.1 * rx * Math.sqrt(Math.max(0, 1 - q * q)) + off; };
    const P = (y, z, off) => V(sx(y, z, off), y, z);
    const cy = 0.5, cz = -0.06, r = 0.042;
    const head = [];
    for (let k = 0; k < 6; k++) {
      const t = (k * Math.PI) / 3;
      const y = cy + Math.sin(t) * r, z = cz + Math.cos(t) * r;
      head.push(P(y, z, -0.004), P(y, z, 0.022));
    }
    S.push(flat(hull(head), SW.core));
    for (const [dy, len, w] of [[0.028, 0.17, 0.015], [0, 0.23, 0.021], [-0.028, 0.15, 0.013]]) {
      const z0 = cz - 0.02, z1 = cz - len, y0 = cy + dy, y1 = cy + dy + len * 0.28;
      S.push(flat(hull([P(y0 + w, z0, -0.004), P(y0 - w, z0, -0.004), P(y0 + w, z0, 0.014), P(y0 - w, z0, 0.014),
        P(y1, z1, -0.004), P(y1, z1, 0.008)]), SW.lava));
    }
  }
  // shoulder pauldrons: gold rim + indigo dome + rune
  S.push(ys(hull([...ring(V(0.215, 0.5, 0.16), 0.14, 0.15, 8, 'x', 0), V(0.3, 0.56, 0.16)]), SW.gold, 0.4, 0.66));
  S.push(ys(hull([...ring(V(0.25, 0.53, 0.16), 0.115, 0.12, 8, 'x', 0), V(0.318, 0.58, 0.16)]), SW.armor, 0.42, 0.66));
  S.push(flat(hull([V(0.33, 0.58, 0.16), V(0.315, 0.62, 0.16), V(0.315, 0.54, 0.16), V(0.31, 0.58, 0.2), V(0.31, 0.58, 0.12)]), SW.lava));
  // chest plate (shield) hanging under the neck
  {
    const pts2 = [[-0.12, 0.08], [0.12, 0.08], [0.13, -0.03], [0.06, -0.13], [0, -0.16], [-0.06, -0.13], [-0.13, -0.03]];
    const O = V(0, 0.44, 0.0), tilt = 0.3;
    const mk = (s, z0, z1) => hull(pts2.flatMap(([u, v]) => [z0, z1].map((z) => V(u * s, O.y + v * s, z - v * tilt))));
    C.push(ys(mk(1.08, 0.24, 0.335), SW.gold, 0.26, 0.54));
    C.push(ys(mk(0.9, 0.25, 0.352), SW.armor, 0.28, 0.54));
    C.push(flat(hull([...ring(V(0, 0.42, 0.37), 0.035, 0.035, 6, 'z', 0), ...ring(V(0, 0.42, 0.385), 0.024, 0.024, 6, 'z', 0)]), SW.core));
  }

  // ================= HEAD (big, boxy moose head with a long droopy muzzle) =================
  const H = { y: 0.71, z: 0.39 };
  HC.push(body([...cbox(V(0, H.y + 0.01, H.z), 0.19, 0.16, 0.15, 0.06), ...ring(V(0, H.y + 0.18, H.z - 0.01), 0.13, 0.09, 8, 'y'),
    V(0.12, H.y - 0.12, H.z - 0.17), V(-0.12, H.y - 0.12, H.z - 0.17)], 0.45, 0.9));
  const FZ = H.z + 0.15;
  const MZ = [], MZS = [];
  // long moose muzzle with an overhanging bulbous nose
  MZ.push(ys(hull([
    V(0.13, H.y - 0.0, FZ - 0.04), V(-0.13, H.y - 0.0, FZ - 0.04),
    V(0.125, H.y - 0.015, FZ + 0.06), V(-0.125, H.y - 0.015, FZ + 0.06),
    V(0.105, H.y - 0.035, FZ + 0.16), V(-0.105, H.y - 0.035, FZ + 0.16),
    V(0.115, H.y - 0.09, FZ + 0.185), V(-0.115, H.y - 0.09, FZ + 0.185),
    V(0.105, H.y - 0.18, FZ + 0.165), V(-0.105, H.y - 0.18, FZ + 0.165),
    V(0.115, H.y - 0.205, FZ + 0.05), V(-0.115, H.y - 0.205, FZ + 0.05),
    V(0.135, H.y - 0.16, FZ - 0.04), V(-0.135, H.y - 0.16, FZ - 0.04),
  ]), SW.muzzle, H.y - 0.2, H.y));
  // lower jaw
  MZ.push(ys(hull(cbox(V(0, H.y - 0.21, FZ + 0.05), 0.085, 0.03, 0.085, 0.015)), SW.muzzle, H.y - 0.24, H.y - 0.16));
  // nostrils
  MZS.push(flat(hull(plate([[-0.02, 0.012], [0.0, 0.02], [0.024, 0.012], [0.026, -0.008], [0.008, -0.02], [-0.016, -0.012]],
    V(0.058, H.y - 0.085, 0), FZ + 0.176, FZ + 0.196)), SW.nose));
  MZ.push(flat(hull(cbox(V(0, H.y - 0.155, FZ + 0.176), 0.05, 0.006, 0.004, 0.002)), SW.nose));

  { // shrink the muzzle ~15% and drop it so the eyes and brow lead the face
    const mp = V(0, H.y - 0.1, FZ - 0.04);
    for (const g of [...MZ, ...MZS]) { g.translate(-mp.x, -mp.y, -mp.z); g.scale(0.85, 0.85, 0.85); g.translate(mp.x, mp.y - 0.03, mp.z); }
    HC.push(...MZ); HS.push(...MZS);
  }
  // big fierce eyes: white almond, big black pupil with a thin glowing orange rim, catchlight.
  // Layers share one frame and tilt back toward the outer corner to follow the head's chamfer.
  const E = V(0.1, H.y + 0.045, 0), k = 1.75, tilt = 0.32;
  const eyeL = (pts, dx, dy, s, z0, z1) => hull(pts.flatMap(([u, v]) => [z0, z1].map((z) => {
    const x = dx + u * s * k; return V(E.x + x, E.y + dy + v * s * k, z - tilt * x);
  })));
  const PUP = [[-0.026, 0.006], [0.012, 0.018], [0.02, -0.006], [0.004, -0.028], [-0.02, -0.026], [-0.028, -0.01]];
  HS.push(flat(eyeL([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]], 0, 0, 1, FZ - 0.012, FZ + 0.01), SW.white));
  HS.push(flat(eyeL(PUP, -0.012, -0.006, 1.13, FZ + 0.004, FZ + 0.015), SW.iris));
  HS.push(flat(eyeL(PUP, -0.012, -0.006, 1.0, FZ + 0.009, FZ + 0.02), SW.eye));
  HS.push(flat(eyeL([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]], 0.002, 0.008, 1, FZ + 0.016, FZ + 0.025), SW.white));
  // heavy brow sitting right on the eye's flat top, slanting down toward the centre
  const bz = (x) => FZ - tilt * (x - E.x);
  HS.push(ys(hull([
    V(0.012, E.y + 0.006, bz(0.012) + 0.05), V(0.014, E.y + 0.056, bz(0.014) + 0.034),
    V(0.215, E.y + 0.05, bz(0.215) + 0.014), V(0.215, E.y + 0.1, bz(0.215) - 0.012),
    V(0.012, E.y + 0.006, bz(0.012) - 0.03), V(0.014, E.y + 0.07, bz(0.014) - 0.04),
    V(0.215, E.y + 0.05, bz(0.215) - 0.05), V(0.215, E.y + 0.1, bz(0.215) - 0.06),
  ]), SW.brow));
  // dewlap ("bell") of shards under the chin
  HC.push(maneSh(V(0, H.y - 0.2, H.z + 0.02), V(0, -1, -0.15), 0.06, 0.14));
  HS.push(maneSh(V(0.06, H.y - 0.19, H.z + 0.02), V(0.4, -1, -0.2), 0.05, 0.11));
  // ears: long leaf ears angled out and up
  HS.push(ys(hull([V(0.14, H.y + 0.12, H.z - 0.03), V(0.14, H.y + 0.04, H.z - 0.06), V(0.14, H.y + 0.09, H.z - 0.12),
    V(0.24, H.y + 0.13, H.z - 0.05), V(0.24, H.y + 0.05, H.z - 0.09), V(0.33, H.y + 0.12, H.z - 0.1)]), SW.mane, H.y, H.y + 0.15));

  // gold circlet across the brow-top with a glowing meteor gem
  HC.push(ys(hull([...cbox(V(0, H.y + 0.17, H.z + 0.07), 0.15, 0.03, 0.065, 0.02), V(0.1, H.y + 0.195, H.z + 0.0), V(-0.1, H.y + 0.195, H.z + 0.0)]), SW.gold, H.y + 0.14, H.y + 0.2));
  // mane continuing up the back of the head/neck
  HC.push(maneSh(V(0, H.y + 0.12, H.z - 0.12), V(0, 0.2, -1), 0.07, 0.13));
  HS.push(maneSh(V(0.08, H.y + 0.06, H.z - 0.13), V(0.5, 0.0, -1), 0.06, 0.11));
  HC.push(maneSh(V(0, H.y + 0.01, H.z - 0.15), V(0, -0.1, -1), 0.065, 0.12));
  HC.push(flat(hull([...ring(V(0, H.y + 0.17, FZ - 0.012), 0.038, 0.038, 6, 'z', Math.PI / 2), V(0, H.y + 0.17, FZ + 0.02)]), SW.core));
  // crown points rising from the circlet
  HC.push(ys(shard(V(0, H.y + 0.19, H.z + 0.06), V(0, 1, 0.25), 0.04, 0.09, 4, 0.55), SW.gold, H.y + 0.17, H.y + 0.29));
  HS.push(ys(shard(V(0.08, H.y + 0.185, H.z + 0.05), V(0.35, 1, 0.2), 0.032, 0.065, 4, 0.55), SW.gold, H.y + 0.17, H.y + 0.27));

  // ================= ANTLERS (broad palmate meteor-rock antlers, lava seams, burning tines) =================
  {
    const B0 = V(0.1, H.y + 0.16, H.z - 0.03), B1 = V(0.2, H.y + 0.22, H.z - 0.04);
    // short, thick beam
    HS.push(ys(hull([...ring(B0, 0.06, 0.06, 6, 'x', 0), ...ring(V(B1.x, B1.y, B1.z), 0.058, 0.055, 6, 'x', 0)]), SW.rock));
    // brow tine pointing forward
    HS.push(ys(shard(V(0.2, H.y + 0.21, H.z - 0.01), V(0.35, 0.3, 1), 0.04, 0.1, 4, 0.8), SW.rock));
    // palm frame: spreads outward and a little up, broad face toward the front
    const U = V(1, 0.22, 0).normalize(), Vv = V(-0.15, 1, -0.22).normalize(), N = V(0, -0.2, 1).normalize();
    const O = B1.clone().add(V(0.01, 0.0, 0));
    const P = (u, v, n = 0) => O.clone().addScaledVector(U, u).addScaledVector(Vv, v).addScaledVector(N, n);
    const palm = [[-0.04, -0.03], [0.08, -0.07], [0.24, -0.06], [0.35, 0.02], [0.37, 0.12], [0.26, 0.18], [0.08, 0.18], [-0.03, 0.1]];
    // glowing lava core (seen through the seams)
    HS.push(ys(hull(slab(palm.map(([u, v]) => [0.16 + (u - 0.16) * 0.95, 0.06 + (v - 0.06) * 0.95]), O, U, Vv, N, -0.022, 0.022)),
      SW.crack, O.y - 0.06, O.y + 0.42));
    // rock plates separated by thick seams
    const g = 0.022;
    const cut = (poly, [a, b, c], side) => side > 0 ? clip(poly, a, b, c - g) : clip(poly, -a, -b, -c - g);
    const c1 = [1, 0.45, 0.14], c2 = [1, -0.5, 0.25], c3 = [-0.35, 1, 0.05], c4 = [0.2, 1, 0.1];
    const L = cut(palm, c1, 1), R = cut(palm, c1, -1);
    const RL = cut(R, c2, 1), RR = cut(R, c2, -1);
    const pieces = [cut(L, c3, 1), cut(L, c3, -1), cut(RL, c4, 1), cut(RL, c4, -1), RR].filter((p) => p.length >= 3);
    pieces.forEach((p, i) => {
      const cu = p.reduce((a, q) => a + q[0], 0) / p.length, cv = p.reduce((a, q) => a + q[1], 0) / p.length;
      const pts = slab(p, O, U, Vv, N, -0.036, 0.036);
      pts.push(P(cu, cv, 0.05 + 0.01 * (i % 2)), P(cu, cv, -0.048));
      HS.push(ys(hull(pts), SW.rock));
    });
    // five chunky tines along the top edge, each burning
    const tines = [[0.0, 0.1, -0.35, 0.08], [0.09, 0.16, -0.12, 0.1], [0.18, 0.17, 0.08, 0.1], [0.27, 0.16, 0.3, 0.09], [0.35, 0.1, 0.7, 0.085]];
    const Fy0 = O.y + 0.06, Fy1 = O.y + 0.42;
    const tips = [];
    for (const [u, v, lean, len] of tines) {
      const b = P(u, v - 0.025);
      const d = Vv.clone().addScaledVector(U, lean);
      HS.push(ys(shard(b, d, 0.05, len, 4, 0.75), SW.rock));
      const tip = b.clone().addScaledVector(d.clone().normalize(), len * 0.7);
      HS.push(ys(flame(tip.clone().add(V(0, -0.035, 0)), 0.2, 0.06, V(lean * 0.3, 0, -0.35), 0.75), SW.fire, Fy0, Fy1));
      tips.push(tip);
    }
    for (let i = 0; i < tips.length - 1; i++) {
      const m = tips[i].clone().add(tips[i + 1]).multiplyScalar(0.5).add(V(0, -0.05, -0.012));
      HS.push(ys(flame(m, 0.13, 0.045, V(0.05 * (i - 1.5), 0, -0.4), 0.75), SW.fire, Fy0, Fy1));
    }
  }

  // ================= TAIL (stub ending in a big cracked meteor with a wide comet trail) =================
  C.push(ys(hull([...ring(V(0, 0.52, -0.38), 0.06, 0.06, 6, 'z'), ...ring(V(0, 0.56, -0.47), 0.05, 0.05, 6, 'z')]), SW.body, 0.4, 0.7));
  {
    const M = V(0, 0.585, -0.56), R = 0.12, gap = 0.018;
    // glowing core
    C.push(ys(blob(0, M, V(R * 0.9, R * 0.9, R * 0.9)), SW.crack, M.y - R, M.y + R));
    // rock shell in 4 chunks per side (split by x = 0, a horizontal and a front/back plane), seams glow
    const pts = [];
    const nF = 46, ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < nF; i++) {
      const y = 1 - (2 * (i + 0.5)) / nF, r = Math.sqrt(1 - y * y), th = ga * i;
      pts.push(V(Math.cos(th) * r, y, Math.sin(th) * r));
    }
    for (const sy of [1, -1]) for (const sz of [1, -1]) {
      const ch = [M.clone().add(V(gap, sy * gap, sz * gap))];
      for (const d of pts) {
        const j = 1 + (hash3(d.x.toFixed(3), d.y.toFixed(3), d.z.toFixed(3)) - 0.5) * 0.18;
        const q = d.clone().multiplyScalar(R * j);
        if (q.x > gap && q.y * sy > gap && q.z * sz > gap) ch.push(M.clone().add(q));
      }
      // seam edges
      for (const t of [0.15, 0.5, 0.85]) {
        const a = (t * Math.PI) / 2;
        ch.push(M.clone().add(V(gap, sy * Math.cos(a) * R * 0.95, sz * Math.sin(a) * R * 0.95)));
        ch.push(M.clone().add(V(Math.cos(a) * R * 0.95, sy * gap, sz * Math.sin(a) * R * 0.95)));
        ch.push(M.clone().add(V(Math.cos(a) * R * 0.95, sy * Math.sin(a) * R * 0.95, sz * gap)));
      }
      S.push(ys(hull(ch), SW.rock, M.y - R, M.y + R));
    }
    // wide comet trail streaming back and up
    C.push(ys(flame(M.clone().add(V(0, 0.0, -0.04)), 0.32, 0.11, V(0, 0, -1.0), 1), SW.flame));
    C.push(ys(flame(M.clone().add(V(0, 0.03, -0.03)), 0.24, 0.08, V(0, 0, -0.55), 1), SW.flame));
    S.push(ys(flame(M.clone().add(V(0.05, -0.01, -0.03)), 0.24, 0.075, V(0.5, 0, -0.85), 0.9), SW.flame));
    C.push(ys(flame(M.clone().add(V(0, 0.01, -0.07)), 0.2, 0.06, V(0, 0, -0.9), 1), SW.core));
  }

  const DROP = 0.075, HSC = 1.14, piv = V(0, H.y - 0.12, H.z - 0.05);
  for (const g of [...HC, ...HS]) {
    g.translate(-piv.x, -piv.y, -piv.z); g.scale(HSC, HSC, HSC); g.translate(piv.x, piv.y, piv.z);
  }
  C.push(...HC); S.push(...HS);
  for (const g of [...C, ...S]) g.translate(0, -DROP, 0);
  S.push(...LS);
  return assemble(C, S);
}

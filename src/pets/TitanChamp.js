// Titan Champ (CELESTIAL): stocky golden armored titan, red champion cape, marble + gold trim,
// white feather wings on the helmet and pauldrons, glowing celestial runes, floating gold crown.
import { V, THREE, hull, cbox, ring, plate, shard, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  gold:    { i: 0, top: '#FFE36A', bot: '#D48E10' },
  goldDk:  { i: 1, top: '#F2BE33', bot: '#A86A08' },
  marble:  { i: 2, top: '#FFFFFF', bot: '#DCD8D2' },
  skin:    { i: 3, top: '#E9A866', bot: '#B06B32' },
  cape:    { i: 4, top: '#F2383E', bot: '#A3121E' },
  eye:     { i: 5, top: '#1A1416', bot: '#0C0A0B' },
  white:   { i: 6, top: '#FFFFFF', bot: '#F1F1F4' },
  feather: { i: 7, top: '#FFFFFF', bot: '#F6F7FF' },
  rune:    { i: 8, top: '#A6F8FF', bot: '#2FCBFF', glow: true },
  gem:     { i: 9, top: '#FFF59A', bot: '#FFB000', glow: true },
  mouth:   { i: 10, top: '#5A2E1A', bot: '#3E1E10' },
  capeIn:  { i: 11, top: '#C21E2A', bot: '#7E0E18' },
};
const SW = PALETTE;

// n hull segments forming an open band (crown / halo) around axis
function band(C, c0, r, h, th, n, sw, axis = 'y', segs = null) {
  for (let k = 0; k < n; k++) {
    if (segs && !segs(k)) continue;
    const a0 = (2 * Math.PI * k) / n, a1 = (2 * Math.PI * (k + 1)) / n;
    const pts = [];
    for (const a of [a0, a1]) for (const rr of [r - th / 2, r + th / 2]) for (const hh of [-h / 2, h / 2]) {
      const u = Math.sin(a) * rr, v = Math.cos(a) * rr;
      if (axis === 'y') pts.push(V(c0.x + u, c0.y + hh, c0.z + v));
      else pts.push(V(c0.x + u, c0.y + v, c0.z + hh));
    }
    C.push(paint(hull(pts), sw, 'flat'));
  }
}

// flat faceted feather: diamond blade with a raised spine
function featherBlade(base, dir, w, len) {
  const d = dir.clone().normalize();
  const up = Math.abs(d.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
  let a = new THREE.Vector3().crossVectors(d, up).normalize(); // thickness axis
  const b = new THREE.Vector3().crossVectors(a, d).normalize(); // width axis
  const P = (u, v, t) => base.clone().addScaledVector(d, u * len).addScaledVector(b, v * w).addScaledVector(a, t);
  const body = [], tip = [];
  for (const t of [0.02, -0.02]) {
    body.push(P(0, 0.45, t), P(0, -0.45, t), P(0.5, 1, t), P(0.5, -1, t), P(0.74, 0.62, t), P(0.74, -0.62, t));
    tip.push(P(0.72, 0.66, t * 1.15), P(0.72, -0.66, t * 1.15), P(1, 0, t * 0.6));
  }
  return [hull(body), hull(tip)];
}

export function buildGeometry() {
  const C = [], S = [];
  const gold = (pts, lo = 0, hi = 1.1) => paint(hull(pts), SW.gold, 'y', [lo, hi]);
  const goldDk = (pts, lo = 0, hi = 1.1) => paint(hull(pts), SW.goldDk, 'y', [lo, hi]);
  const marble = (pts, lo = 0, hi = 1.0) => paint(hull(pts), SW.marble, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= LEGS: short, thick, planted apart =================
  const LX = 0.13;
  // armored boot + toe cap
  S.push(goldDk([...cbox(V(LX, 0.04, 0.0), 0.085, 0.04, 0.1, 0.025), ...cbox(V(LX, 0.075, -0.01), 0.075, 0.03, 0.08, 0.02)], 0, 0.3));
  S.push(gold([...cbox(V(LX + 0.005, 0.035, 0.085), 0.075, 0.035, 0.045, 0.02), V(LX, 0.07, 0.07)], 0, 0.3));
  // greave (gold shin)
  S.push(gold([...ring(V(LX, 0.07, 0), 0.08, 0.08, 8), ...ring(V(LX, 0.15, 0.005), 0.09, 0.09, 8),
    ...ring(V(LX, 0.23, 0.0), 0.085, 0.085, 8)], 0.0, 0.4));
  // knee guard
  S.push(goldDk([...cbox(V(LX, 0.225, 0.07), 0.06, 0.045, 0.03, 0.02), V(LX, 0.26, 0.06), V(LX, 0.19, 0.1)], 0.1, 0.35));
  // marble thigh
  S.push(marble([...ring(V(LX, 0.2, 0), 0.08, 0.08, 8), ...ring(V(LX - 0.005, 0.3, 0), 0.105, 0.1, 8),
    ...ring(V(LX - 0.02, 0.37, 0), 0.1, 0.1, 8)], 0.15, 0.45));
  // shin rune
  S.push(flat(hull(plate([[-0.016, 0.03], [0.016, 0.03], [0.022, 0.0], [0, -0.035], [-0.022, 0.0]],
    V(LX, 0.145, 0), 0.085, 0.1)), SW.rune));

  // ================= HIPS / BELT / TASSETS =================
  C.push(goldDk([...ring(V(0, 0.33, 0), 0.2, 0.135, 8), ...ring(V(0, 0.4, 0), 0.205, 0.14, 8)], 0.25, 0.45));
  // belt buckle with glowing gem
  C.push(gold([...cbox(V(0, 0.365, 0.135), 0.065, 0.05, 0.02, 0.015)], 0.3, 0.42));
  C.push(flat(hull([...ring(V(0, 0.365, 0.155), 0.032, 0.032, 4, 'z', 0), V(0, 0.365, 0.168)]), SW.gem));
  // marble tassets with gold trim (front centre + mirrored side)
  C.push(marble(plate([[-0.07, 0.04], [0.07, 0.04], [0.06, -0.08], [0, -0.1], [-0.06, -0.08]], V(0, 0.31, 0), 0.115, 0.14), 0.15, 0.4));
  C.push(gold(plate([[-0.06, -0.075], [0.06, -0.075], [0, -0.105], [0.0, -0.085]], V(0, 0.31, 0), 0.118, 0.146), 0.15, 0.4));
  S.push(marble([V(0.15, 0.36, 0.1), V(0.2, 0.36, 0.08), V(0.15, 0.36, -0.1), V(0.2, 0.36, -0.08),
    V(0.17, 0.25, 0.09), V(0.235, 0.25, 0.07), V(0.17, 0.25, -0.09), V(0.235, 0.25, -0.07)], 0.15, 0.4));

  // ================= TORSO: broad gold breastplate =================
  C.push(gold([
    ...ring(V(0, 0.39, -0.005), 0.185, 0.135, 8),
    ...ring(V(0, 0.5, 0.005), 0.245, 0.172, 8),
    ...ring(V(0, 0.6, 0.0), 0.275, 0.178, 8),
    ...ring(V(0, 0.67, -0.01), 0.21, 0.14, 8),
  ], 0.35, 0.72));
  // marble collar / gorget with gold rim
  C.push(marble([...ring(V(0, 0.65, -0.01), 0.15, 0.11, 8), ...ring(V(0, 0.72, -0.01), 0.12, 0.09, 8)], 0.6, 0.75));
  // pectoral plates (raised, faceted)
  S.push(gold([...cbox(V(0.1, 0.56, 0.155), 0.09, 0.058, 0.03, 0.025), V(0.03, 0.52, 0.185), V(0.15, 0.6, 0.135)], 0.45, 0.7));
  // glowing celestial star emblem on chest + rune chevrons
  C.push(flat(hull([...ring(V(0, 0.49, 0.165), 0.045, 0.045, 4, 'z', Math.PI / 2), ...ring(V(0, 0.49, 0.182), 0.03, 0.03, 4, 'z', Math.PI / 2)]), SW.rune));
  S.push(flat(hull([V(0.045, 0.47, 0.17), V(0.17, 0.5, 0.15), V(0.17, 0.515, 0.15), V(0.045, 0.49, 0.17),
    V(0.045, 0.47, 0.14), V(0.17, 0.5, 0.12), V(0.17, 0.515, 0.12), V(0.045, 0.49, 0.14)]), SW.rune));
  // abs ridges (gold dark)
  C.push(goldDk([...cbox(V(0, 0.42, 0.14), 0.05, 0.025, 0.012, 0.008)], 0.35, 0.5));

  // ================= ARMS: big pauldrons, thick arms, huge fists =================
  // pauldron (layered gold domes, broad) + marble underlayer
  S.push(marble([...ring(V(0.295, 0.6, -0.005), 0.115, 0.125, 8), ...ring(V(0.34, 0.51, -0.005), 0.125, 0.135, 8)], 0.45, 0.7));
  S.push(gold([...ring(V(0.27, 0.715, 0), 0.08, 0.09, 8), ...ring(V(0.315, 0.67, 0), 0.13, 0.135, 8),
    ...ring(V(0.365, 0.58, 0), 0.12, 0.13, 8)], 0.5, 0.77));
  S.push(flat(hull([...ring(V(0.365, 0.585, 0.0), 0.125, 0.135, 8), ...ring(V(0.37, 0.562, 0.0), 0.122, 0.132, 8)]), SW.goldDk));
  // pauldron glowing gem
  S.push(flat(hull([...ring(V(0.34, 0.655, 0.13), 0.024, 0.024, 4, 'z', 0), V(0.34, 0.655, 0.152)]), SW.gem));
  // upper arm (marble)
  S.push(marble([...ring(V(0.34, 0.56, 0), 0.075, 0.075, 8), ...ring(V(0.37, 0.42, 0.01), 0.08, 0.08, 8)], 0.3, 0.6));
  // bracer (gold) with rune
  S.push(gold([...ring(V(0.375, 0.43, 0.01), 0.08, 0.08, 8), ...ring(V(0.385, 0.31, 0.02), 0.092, 0.092, 8)], 0.25, 0.48));
  S.push(flat(hull(plate([[-0.015, 0.035], [0.015, 0.035], [0.02, 0.0], [0, -0.04], [-0.02, 0.0]],
    V(0.38, 0.37, 0), 0.09, 0.105)), SW.rune));
  // champion fist (boxing-glove scale): big knuckle block, finger ridges, thumb
  S.push(goldDk([...cbox(V(0.4, 0.215, 0.03), 0.11, 0.1, 0.115, 0.04), ...cbox(V(0.4, 0.29, 0.02), 0.095, 0.03, 0.095, 0.02)], 0.1, 0.33));
  for (const dz of [-0.06, -0.02, 0.02, 0.06])
    S.push(gold(cbox(V(0.43, 0.155, 0.03 + dz * 1.3), 0.085, 0.048, 0.033, 0.014), 0.09, 0.3));
  S.push(gold(cbox(V(0.32, 0.23, 0.13), 0.042, 0.05, 0.045, 0.016), 0.12, 0.3));
  // knuckle rune band
  S.push(flat(hull(plate([[-0.08, 0.01], [0.08, 0.01], [0.08, -0.01], [-0.08, -0.01]], V(0.4, 0.235, 0), 0.142, 0.152)), SW.rune));

  // ================= RED CHAMPION CAPE =================
  // clasp gems at the shoulders
  S.push(flat(hull([...ring(V(0.17, 0.68, 0.09), 0.03, 0.03, 6, 'z', 0), V(0.17, 0.68, 0.11)]), SW.gem));
  // cape: hangs from the collar, touches the back, folds into vertical facets and flares at the hem.
  // rows: [y, half width, front z, fold amplitude, wrap-forward at the edge]
  const ROWS = [[0.74, 0.21, -0.125, 0.0, 0.05], [0.42, 0.31, -0.165, 0.022, 0.09], [0.05, 0.44, -0.235, 0.04, 0.15]];
  const EF = [0, 0.35, 0.6, 0.82, 1.0], EZ = [-1, -1, 1, -1, 0.6]; // edge fractions and fold sign (+ = toward body)
  const CT = 0.024; // cloth thickness
  const capePt = (r, e, back) => { const [y, hw, z, amp, wrap] = ROWS[r];
    return V(EF[e] * hw, y, z + EZ[e] * amp + wrap * EF[e] * EF[e] - (back ? CT : 0)); };
  for (let r = 0; r < 2; r++) for (let e = 0; e < 4; e++) {
    const pts = [];
    for (const rr of [r, r + 1]) for (const ee of [e, e + 1]) for (const bk of [0, 1]) pts.push(capePt(rr, ee, bk));
    S.push(paint(hull(pts), e % 2 ? SW.capeIn : SW.cape, 'y', [0.05, 0.78]));
  }
  // gold hem trim following the folds
  for (let e = 0; e < 4; e++) {
    const pts = [];
    for (const ee of [e, e + 1]) {
      const f = capePt(2, ee, 0), k = capePt(2, ee, 1);
      for (const dy of [-0.012, 0.03]) pts.push(V(f.x, f.y + dy, f.z + 0.006 + dy * 0.18), V(k.x, k.y + dy, k.z - 0.006 + dy * 0.18));
    }
    S.push(paint(hull(pts), SW.gold, 'y', [0, 0.15]));
  }
  const capeSlab = (pts) => paint(hull(pts), SW.cape, 'y', [0.08, 0.85]);
  // champion stand-up collar behind the neck (red with gold rim)
  C.push(capeSlab([V(-0.17, 0.66, -0.1), V(0.17, 0.66, -0.1), V(-0.17, 0.66, -0.15), V(0.17, 0.66, -0.15),
    V(-0.22, 0.8, -0.17), V(0.22, 0.8, -0.17), V(-0.22, 0.8, -0.21), V(0.22, 0.8, -0.21)]));
  C.push(gold([V(-0.225, 0.79, -0.165), V(0.225, 0.79, -0.165), V(-0.225, 0.79, -0.215), V(0.225, 0.79, -0.215),
    V(-0.23, 0.825, -0.17), V(0.23, 0.825, -0.17), V(-0.23, 0.825, -0.222), V(0.23, 0.825, -0.222)], 0.7, 0.9));
  // gold champion star emblem on the cape back with a glowing core
  const capeZ = (y) => { const [r0, r1] = y > 0.42 ? [ROWS[0], ROWS[1]] : [ROWS[1], ROWS[2]];
    const t = (y - r0[0]) / (r1[0] - r0[0]); return (r0[2] - r0[3]) + t * ((r1[2] - r1[3]) - (r0[2] - r0[3])) - CT; };
  const emb = (r, d0, d1, cy, n, ph) => { const pts = [];
    for (let k = 0; k < n; k++) { const a = ph + (2 * Math.PI * k) / n; const y = cy + Math.sin(a) * r;
      pts.push(V(Math.cos(a) * r, y, capeZ(y) - d0), V(Math.cos(a) * r, y, capeZ(y) - d1)); }
    return pts; };
  C.push(gold(emb(0.09, -0.004, 0.012, 0.47, 4, Math.PI / 2), 0.35, 0.55));
  C.push(goldDk(emb(0.082, -0.004, 0.009, 0.47, 4, Math.PI / 4), 0.35, 0.55));
  C.push(flat(hull(emb(0.038, 0.008, 0.022, 0.47, 4, Math.PI / 2)), SW.rune));

  // ================= HEAD: big, golden helmet, bronze face =================
  const hc0 = C.length, hs0 = S.length;
  const H = { y: 0.86, z: 0.02 };
  const FZ = H.z + 0.15;
  // face block
  C.push(paint(hull([...cbox(V(0, H.y - 0.02, H.z + 0.01), 0.15, 0.13, 0.14, 0.05),
    V(0.1, H.y - 0.15, FZ - 0.02), V(-0.1, H.y - 0.15, FZ - 0.02)]), SW.skin, 'y', [0.7, 0.92]));
  // helmet dome (covers top/back/sides, open face)
  C.push(gold([
    ...cbox(V(0, H.y + 0.06, H.z - 0.02), 0.18, 0.085, 0.165, 0.06),
    ...ring(V(0, H.y + 0.17, H.z - 0.02), 0.13, 0.12, 8),
    V(0.17, H.y - 0.06, H.z - 0.1), V(-0.17, H.y - 0.06, H.z - 0.1),
    V(0.14, H.y - 0.13, H.z - 0.12), V(-0.14, H.y - 0.13, H.z - 0.12),
  ], 0.75, 1.05));
  // cheek guards
  S.push(gold([...cbox(V(0.155, H.y - 0.04, H.z + 0.04), 0.03, 0.08, 0.1, 0.02), V(0.14, H.y - 0.14, H.z + 0.08)], 0.7, 0.95));
  // brow band (heavy brow, gold) slanting down to the centre
  S.push(goldDk([
    V(0.0, H.y + 0.03, FZ + 0.035), V(0.0, H.y + 0.075, FZ + 0.03),
    V(0.17, H.y + 0.07, FZ + 0.0), V(0.17, H.y + 0.11, FZ - 0.015),
    V(0.0, H.y + 0.03, FZ - 0.03), V(0.0, H.y + 0.085, FZ - 0.04),
    V(0.17, H.y + 0.07, FZ - 0.06), V(0.17, H.y + 0.11, FZ - 0.07),
  ], 0.8, 1.0));
  // forehead rune
  C.push(flat(hull([...ring(V(0, H.y + 0.1, FZ + 0.005), 0.025, 0.03, 4, 'z', Math.PI / 2), V(0, H.y + 0.1, FZ + 0.02)]), SW.rune));
  // fierce eyes
  const E = V(0.07, H.y + 0.0, 0);
  S.push(flat(hull(plate([[-0.042, 0.012], [0.046, 0.04], [0.052, -0.006], [0.02, -0.036], [-0.03, -0.032], [-0.046, -0.012]],
    E, FZ - 0.01, FZ + 0.012)), SW.white));
  S.push(flat(hull(plate([[-0.03, 0.01], [0.016, 0.026], [0.024, -0.004], [0.006, -0.028], [-0.022, -0.026], [-0.034, -0.008]],
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye));
  S.push(flat(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.006, 0), FZ + 0.014, FZ + 0.021)), SW.white));
  // nose + stern mouth + strong chin
  C.push(paint(hull([...cbox(V(0, H.y - 0.055, FZ + 0.012), 0.026, 0.016, 0.02, 0.008),
    V(0.012, H.y - 0.01, FZ - 0.0), V(-0.012, H.y - 0.01, FZ - 0.0)]), SW.skin, 'y', [0.7, 0.9]));
  C.push(flat(hull(plate([[-0.058, 0.006], [0.058, 0.006], [0.07, -0.006], [0.062, -0.01], [-0.062, -0.01], [-0.07, -0.006]],
    V(0, H.y - 0.1, 0), FZ - 0.01, FZ + 0.007)), SW.mouth));

  // ================= HEAVENLY FEATHERS =================
  // helmet wings: fanned white feather shards
  for (const [b, d, w, l] of [
    [V(0.17, H.y + 0.08, H.z - 0.03), V(0.45, 1, -0.45), 0.055, 0.19],
    [V(0.17, H.y + 0.05, H.z - 0.06), V(0.8, 0.65, -0.6), 0.052, 0.17],
    [V(0.17, H.y + 0.01, H.z - 0.08), V(1, 0.25, -0.7), 0.046, 0.14],
  ]) { const [f, t] = featherBlade(b, d, w, l); S.push(flat(f, SW.feather), paint(t, SW.gold, 'flat')); }
  S.push(flat(hull(cbox(V(0.18, H.y + 0.04, H.z - 0.04), 0.02, 0.05, 0.05, 0.012)), SW.gold));
  // pauldron feathers fanning out and back
  for (const [b, d, w, l] of [
    [V(0.37, 0.67, -0.06), V(0.45, 0.75, -0.7), 0.055, 0.16],
    [V(0.42, 0.61, -0.05), V(0.85, 0.25, -0.6), 0.052, 0.15],
    [V(0.42, 0.55, -0.06), V(0.8, -0.3, -0.6), 0.046, 0.13],
  ]) { const [f, t] = featherBlade(b, d, w, l); S.push(flat(f, SW.feather), paint(t, SW.gold, 'flat')); }

  // ================= FLOATING GOLD CROWN =================
  const CY = H.y + 0.27, CZ = H.z - 0.02;
  band(C, V(0, CY, CZ), 0.13, 0.055, 0.03, 12, SW.gold);
  band(C, V(0, CY - 0.032, CZ), 0.135, 0.018, 0.042, 12, SW.goldDk);
  // 5 chunky crown points: front, 2 mirrored sides (at 60 / 120 deg) + back
  const pt = (a, tall) => {
    const x = Math.sin(a) * 0.13, z = Math.cos(a) * 0.13;
    const n = V(x, 0, z).normalize();
    const t = V(n.z, 0, -n.x); // tangent
    const base = V(x, CY + 0.02, CZ + z);
    const w = tall ? 0.05 : 0.04, h = tall ? 0.11 : 0.08;
    return hull([
      base.clone().addScaledVector(t, w).addScaledVector(n, 0.015), base.clone().addScaledVector(t, -w).addScaledVector(n, 0.015),
      base.clone().addScaledVector(t, w).addScaledVector(n, -0.015), base.clone().addScaledVector(t, -w).addScaledVector(n, -0.015),
      V(x * 1.06, CY + 0.02 + h, CZ + z * 1.06).addScaledVector(n, 0.008), V(x * 1.06, CY + 0.02 + h, CZ + z * 1.06).addScaledVector(n, -0.008),
    ]);
  };
  C.push(paint(pt(0, true), SW.gold, 'y', [CY, CY + 0.14]));
  C.push(paint(pt(Math.PI, true), SW.gold, 'y', [CY, CY + 0.14]));
  for (const a of [Math.PI / 3, (2 * Math.PI) / 3]) S.push(paint(pt(a, false), SW.gold, 'y', [CY, CY + 0.14]));
  // gems
  C.push(flat(hull([...ring(V(0, CY, CZ + 0.145), 0.026, 0.026, 4, 'z', 0), V(0, CY, CZ + 0.165)]), SW.gem));
  C.push(flat(hull([...ring(V(0, CY + 0.085, CZ + 0.14), 0.016, 0.016, 4, 'z', 0), V(0, CY + 0.085, CZ + 0.155)]), SW.rune));
  S.push(flat(hull([...ring(V(0.075, CY, CZ + 0.122), 0.017, 0.017, 4, 'z', 0), V(0.083, CY, CZ + 0.136)]), SW.rune));

  // floating gold sparkles around the crown (4-point stars)
  const spark = (c, r) => hull([V(c.x, c.y + r * 1.7, c.z), V(c.x, c.y - r * 1.7, c.z), V(c.x + r, c.y, c.z), V(c.x - r, c.y, c.z),
    V(c.x, c.y, c.z + r * 0.6), V(c.x, c.y, c.z - r * 0.6)]);
  S.push(flat(spark(V(0.22, CY + 0.06, CZ + 0.04), 0.022), SW.gem));
  S.push(flat(spark(V(0.19, CY - 0.06, CZ - 0.1), 0.016), SW.gem));
  C.push(flat(spark(V(0, CY + 0.17, CZ - 0.02), 0.018), SW.gem));

  // scale the head group up about the neck for the big-head look
  const HS = 1.15, piv = V(0, 0.7, 0.02);
  for (const g of [...C.slice(hc0), ...S.slice(hs0)]) {
    g.translate(-piv.x, -piv.y, -piv.z); g.scale(HS, HS, HS); g.translate(piv.x, piv.y, piv.z);
  }

  return assemble(C, S);
}

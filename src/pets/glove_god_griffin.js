// Glove God Griffin (EPIC): eagle front, lion back, crowned, gold-trimmed raised wings, gem-tipped tail.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  brown:    { i: 0, top: '#C98242', bot: '#7A421F' },
  cream:    { i: 1, top: '#FFF6E4', bot: '#E9D3AE' },
  white:    { i: 2, top: '#FFFFFF', bot: '#F2EEE8' },
  feather:  { i: 3, top: '#FFFFFF', bot: '#E6D9C4' },
  gold:     { i: 4, top: '#FFE46C', bot: '#E39E12' },
  goldDk:   { i: 5, top: '#F6C431', bot: '#B9780C' },
  beak:     { i: 6, top: '#FFE14E', bot: '#EE9710' },
  eye:      { i: 7, top: '#1A1416', bot: '#0C0A0B' },
  brow:     { i: 8, top: '#FFFFFF', bot: '#CDBBA0' },
  wing:     { i: 9, top: '#FFFBF0', bot: '#F0D6AA' },
  paw:      { i: 10, top: '#FCEBC6', bot: '#DDB57C' },
  gem:      { i: 11, top: '#FFF6B0', bot: '#E8A010' },
  mouth:    { i: 12, top: '#6A3A1A', bot: '#3E1E10' },
  tail:     { i: 13, top: '#B9733A', bot: '#8A4C22' },
  wingGold: { i: 14, top: '#FFDF5C', bot: '#F0B21E' },
};
const SW = PALETTE;

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const sub = (a, b) => a.clone().sub(b);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);

// flat feather blade: convex polygon prism lying in the plane spanned by dir and (normal n)
function blade(base, dir, n, L, w, th = 0.016, shape = null) {
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
  return hull(pts);
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const brown = (pts, lo = 0.06, hi = 0.58) => paint(hull(pts), SW.brown, 'y', [lo, hi]);
  const gold = (g) => paint(g, SW.gold, 'y');
  const goldF = (g) => paint(g, SW.gold, 'flat');
  const goldDk = (g) => paint(g, SW.goldDk, 'y');
  const cream = (g, lo, hi) => paint(g, SW.cream, lo === undefined ? 'flat' : 'y', lo === undefined ? null : [lo, hi]);
  const feath = (g) => paint(g, SW.feather, 'flat');

  // ================= LION BODY (stocky barrel) =================
  C.push(brown([
    ...ring(V(0, 0.39, -0.5), 0.09, 0.09, 10, 'z'),
    ...ring(V(0, 0.38, -0.44), 0.16, 0.16, 10, 'z'),
    ...ring(V(0, 0.36, -0.28), 0.18, 0.17, 10, 'z'),
    ...ring(V(0, 0.35, -0.08), 0.175, 0.165, 10, 'z'),
    ...ring(V(0, 0.38, 0.1), 0.175, 0.17, 10, 'z'),
    ...ring(V(0, 0.42, 0.2), 0.13, 0.14, 10, 'z'),
  ]));

  // ================= BACK LEGS (big brown haunch, cream paws, gold claws) =================
  S.push(paint(blob(1, V(0.145, 0.33, -0.33), V(0.1, 0.15, 0.16), { jitter: 0.12 }), SW.brown, 'y', [0.06, 0.58]));
  S.push(brown([...ring(V(0.16, 0.27, -0.32), 0.075, 0.085, 8), ...ring(V(0.17, 0.14, -0.37), 0.064, 0.064, 8),
    ...ring(V(0.172, 0.06, -0.35), 0.062, 0.062, 8)], 0.0, 0.58));
  const paw = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.044, z - 0.005), 0.074, 0.044, 0.068, 0.022)), SW.paw, 'y', [0, 0.09]));
    for (const dx of [-0.047, 0, 0.047]) {
      S.push(paint(hull(cbox(V(x + dx, 0.035, z + 0.06), 0.025, 0.035, 0.032, 0.012)), SW.paw, 'y', [0, 0.09]));
      S.push(goldDk(shard(V(x + dx, 0.026, z + 0.088), V(0, -0.6, 1), 0.015, 0.04)));
    }
  };
  paw(0.173, -0.34);
  // brown fur tufts on haunch
  S.push(paint(shard(V(0.2, 0.36, -0.28), V(0.5, -0.3, 1), 0.045, 0.07), SW.brown, 'flat'));

  // ================= TAIL (lion tail swinging low, gold faceted gem) =================
  C.push(paint(tube(curveSamples(
    [V(0, 0.42, -0.48), V(0, 0.33, -0.6), V(0, 0.2, -0.7), V(0, 0.16, -0.83), V(0, 0.23, -0.94), V(0, 0.33, -0.98)],
    10, (t) => 0.04 - 0.014 * t), { seg: 6, axis: X, capEnd: 0.0, phase: Math.PI / 6 }), SW.tail, 'len'));
  C.push(goldDk(hull(ring(V(0, 0.32, -0.98), 0.034, 0.034, 8, 'y').concat(ring(V(0, 0.37, -0.98), 0.05, 0.05, 8, 'y')))));
  C.push(paint(blob(0, V(0, 0.45, -0.98), V(0.09, 0.1, 0.09)), SW.gem, 'y'));

  // ================= FEATHERED EAGLE CHEST =================
  C.push(paint(blob(1, V(0, 0.47, 0.25), V(0.17, 0.18, 0.14), { jitter: 0.15 }), SW.cream, 'y', [0.28, 0.66]));
  C.push(cream(hull([...ring(V(0, 0.48, 0.24), 0.14, 0.12, 10, 'y'), ...ring(V(0, 0.68, 0.3), 0.14, 0.13, 10, 'y')]), 0.4, 0.8));
  C.push(cream(shard(V(0, 0.32, 0.31), V(0, -1, 0.4), 0.065, 0.13)));
  C.push(cream(shard(V(0, 0.44, 0.37), V(0, -0.8, 1), 0.07, 0.1)));
  C.push(cream(shard(V(0, 0.56, 0.37), V(0, -0.5, 1), 0.07, 0.09)));
  for (const [b, d, w, l] of [
    [V(0.065, 0.32, 0.3), V(0.25, -1, 0.4), 0.058, 0.12],
    [V(0.12, 0.35, 0.27), V(0.6, -1, 0.3), 0.055, 0.11],
    [V(0.07, 0.44, 0.36), V(0.35, -0.8, 1), 0.062, 0.095],
    [V(0.14, 0.46, 0.3), V(0.9, -0.7, 0.6), 0.058, 0.09],
    [V(0.075, 0.56, 0.36), V(0.45, -0.5, 1), 0.06, 0.08],
    [V(0.15, 0.57, 0.29), V(1, -0.5, 0.5), 0.058, 0.08],
    [V(0.17, 0.48, 0.2), V(1, -0.8, -0.1), 0.052, 0.075],
  ]) S.push(cream(shard(b, d, w, l)));

  // ================= FRONT LEGS (gold armoured legs, big talons) =================
  S.push(gold(hull([...ring(V(0.13, 0.36, 0.2), 0.09, 0.095, 8), ...ring(V(0.14, 0.2, 0.23), 0.07, 0.072, 8),
    ...ring(V(0.145, 0.07, 0.25), 0.058, 0.058, 8)])));
  S.push(goldDk(hull([...ring(V(0.143, 0.15, 0.24), 0.075, 0.075, 8, 'y'), ...ring(V(0.143, 0.19, 0.235), 0.08, 0.08, 8, 'y')])));
  // gold shoulder armour shards
  S.push(goldF(shard(V(0.16, 0.4, 0.21), V(0.5, -0.6, 0.6), 0.065, 0.11)));
  S.push(goldF(shard(V(0.175, 0.33, 0.18), V(0.6, -0.9, 0.2), 0.055, 0.1)));
  S.push(goldF(shard(V(0.17, 0.45, 0.13), V(0.7, -0.4, -0.4), 0.055, 0.095)));
  const talon = (x, z) => {
    S.push(gold(hull(cbox(V(x, 0.042, z), 0.055, 0.042, 0.05, 0.02))));
    for (const a of [-0.5, 0, 0.5]) {
      const d = V(Math.sin(a), 0, Math.cos(a));
      const k = add(V(x, 0.03, z), d, 0.085);
      S.push(gold(hull([...cbox(add(V(x, 0.036, z), d, 0.03), 0.022, 0.032, 0.022, 0.008), ...cbox(k, 0.02, 0.026, 0.02, 0.008)])));
      S.push(goldDk(shard(add(k, d, 0.014), add(d, V(0, -0.9, 0)), 0.018, 0.055)));
    }
    S.push(goldDk(shard(V(x, 0.03, z - 0.04), V(0, -0.6, -1), 0.018, 0.055)));
  };
  talon(0.145, 0.26);

  // ================= HEAD =================
  const hc0 = C.length, hs0 = S.length;
  const H = { y: 0.8, z: 0.33 };
  C.push(paint(hull([
    ...cbox(V(0, H.y, H.z), 0.16, 0.145, 0.15, 0.065),
    ...ring(V(0, H.y + 0.17, H.z - 0.01), 0.11, 0.1, 8, 'y'),
    V(0.185, H.y - 0.07, H.z - 0.02), V(-0.185, H.y - 0.07, H.z - 0.02),
  ]), SW.white, 'y', [0.62, 0.98]));
  const FZ = H.z + 0.15;

  // feather mane: layered kite blades lying on the head and sweeping back (three rings)
  const kite = [[0, -0.3], [0, 0.3], [0.38, 0.5], [1, 0], [0.38, -0.5]];
  const mane = (n, a0, a1, rad, z, back, L, w, sw, out) => {
    for (let i = 0; i < n; i++) {
      const a = a0 + (a1 - a0) * i / (n - 1);
      const r = V(Math.cos(a), Math.sin(a) * 0.95, 0);
      const base = V(rad * r.x, H.y - 0.01 + rad * r.y, z);
      const dir = add(r, V(0, 0, -back), 1);
      S.push(paint(blade(add(base, r, out), dir, r, L, w, 0.03, kite), sw, 'flat'));
    }
  };
  mane(5, -1.0, 1.25, 0.15, H.z + 0.02, 1.6, 0.13, 0.085, SW.feather, 0.0);
  mane(5, -1.2, 1.35, 0.15, H.z - 0.07, 1.3, 0.17, 0.095, SW.feather, 0.012);
  mane(4, -1.0, 1.15, 0.12, H.z - 0.14, 1.5, 0.17, 0.1, SW.cream, 0.02);
  C.push(feath(shard(V(0, H.y + 0.14, H.z - 0.09), V(0, 0.6, -1), 0.055, 0.14)));
  S.push(feath(shard(V(0.16, H.y - 0.06, H.z + 0.04), V(1, -0.5, -0.2), 0.05, 0.09)));
  S.push(feath(shard(V(0.14, H.y - 0.115, H.z + 0.06), V(0.6, -1, -0.1), 0.05, 0.09)));

  // beak: big gold hook
  const BY = H.y - 0.03;
  const beakPaint = (g) => paint(g, SW.beak, 'y', [BY - 0.17, BY + 0.04]);
  C.push(beakPaint(hull([
    ...plate([[-0.095, 0.035], [0.095, 0.035], [0.1, -0.065], [0.065, -0.11], [-0.065, -0.11], [-0.1, -0.065]], V(0, BY, 0), FZ - 0.05, FZ - 0.02),
    V(0.055, BY + 0.025, FZ + 0.06), V(-0.055, BY + 0.025, FZ + 0.06),
    V(0.038, BY + 0.0, FZ + 0.145), V(-0.038, BY + 0.0, FZ + 0.145),
    V(0.05, BY - 0.075, FZ + 0.09), V(-0.05, BY - 0.075, FZ + 0.09),
    V(0.027, BY - 0.055, FZ + 0.175), V(-0.027, BY - 0.055, FZ + 0.175),
  ])));
  C.push(beakPaint(hull([
    V(0.027, BY - 0.045, FZ + 0.175), V(-0.027, BY - 0.045, FZ + 0.175),
    V(0.038, BY - 0.075, FZ + 0.11), V(-0.038, BY - 0.075, FZ + 0.11),
    V(0.0, BY - 0.17, FZ + 0.16), V(0.013, BY - 0.135, FZ + 0.135), V(-0.013, BY - 0.135, FZ + 0.135),
  ])));
  C.push(paint(hull([
    ...plate([[-0.065, 0], [0.065, 0], [0.055, -0.04], [-0.055, -0.04]], V(0, BY - 0.09, 0), FZ - 0.035, FZ - 0.01),
    V(0.032, BY - 0.1, FZ + 0.09), V(-0.032, BY - 0.1, FZ + 0.09), V(0, BY - 0.122, FZ + 0.065),
  ]), SW.goldDk, 'flat'));
  S.push(paint(hull(cbox(V(0.034, BY + 0.016, FZ + 0.06), 0.011, 0.006, 0.013, 0.003)), SW.mouth, 'flat'));

  // fierce eyes: white almond with angry flat top, big pupil, catchlight
  const E = V(0.09, H.y + 0.04, 0), es = 1.25;
  const sc = (arr) => arr.map(([u, v]) => [u * es, v * es]);
  S.push(paint(hull(plate(sc([[-0.036, 0.0], [0.044, 0.03], [0.05, -0.008], [0.02, -0.036], [-0.026, -0.032], [-0.04, -0.016]]),
    E, FZ - 0.014, FZ + 0.008, 0.35)), SW.white, 'flat'));
  S.push(paint(hull(plate(sc([[-0.026, 0.0], [0.014, 0.017], [0.022, -0.008], [0.006, -0.03], [-0.02, -0.028], [-0.03, -0.012]]),
    V(E.x - 0.004, E.y, 0), FZ + 0.0, FZ + 0.014, 0.35)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.008, FZ + 0.019, 0.35)), SW.white, 'flat'));
  // heavy brow slanting down toward the beak
  S.push(paint(hull([
    V(0.025, E.y + 0.01, FZ + 0.03), V(0.028, E.y + 0.05, FZ + 0.018),
    V(0.165, E.y + 0.06, FZ - 0.045), V(0.165, E.y + 0.1, FZ - 0.06),
    V(0.025, E.y + 0.01, FZ - 0.03), V(0.028, E.y + 0.06, FZ - 0.04),
    V(0.165, E.y + 0.06, FZ - 0.1), V(0.165, E.y + 0.1, FZ - 0.11),
  ]), SW.brow, 'y'));

  // crown: gold band + 5 points
  const CY = H.y + 0.13, CZ = H.z - 0.01;
  C.push(gold(hull([...ring(V(0, CY, CZ), 0.12, 0.11, 10, 'y'), ...ring(V(0, CY + 0.055, CZ), 0.13, 0.12, 10, 'y')])));
  C.push(goldF(shard(V(0, CY + 0.045, CZ + 0.105), V(0, 1, 0.15), 0.04, 0.11)));
  S.push(goldF(shard(V(0.08, CY + 0.045, CZ + 0.075), V(0.25, 1, 0.15), 0.034, 0.095)));
  S.push(goldF(shard(V(0.115, CY + 0.045, CZ - 0.025), V(0.3, 1, -0.1), 0.032, 0.085)));

  // scale the whole head up about the neck for the big-head look
  const HS = 1.14, piv = V(0, 0.6, 0.3);
  for (const g of [...C.slice(hc0), ...S.slice(hs0)]) {
    g.translate(-piv.x, -piv.y, -piv.z); g.scale(HS, HS, HS); g.translate(piv.x, piv.y, piv.z);
  }

  // ================= WINGS (raised & spread: cream feather fan, gold upper edge + coverts) =================
  const SH = V(0.15, 0.56, 0.04), WR = V(0.45, 1.0, -0.08), TP = V(0.62, 1.12, -0.7);
  const armDir = nrm(sub(WR, SH)), handDir = nrm(sub(TP, WR));
  const wingN = (dir) => { const n = nrm(cross(armDir, dir)); if (n.x < 0) n.multiplyScalar(-1); return n; };
  // gold leading edge: shoulder -> wrist -> tip
  S.push(paint(tube(curveSamples([SH, add(SH, sub(WR, SH), 0.5), WR, add(WR, V(0.06, 0.07, -0.25), 1), TP], 10,
    (t) => 0.05 - 0.02 * t, (t) => 0.036 - 0.012 * t), { seg: 6, ref: V(1, 0, 0.2), capEnd: 0.035, capStart: 0.01 }), SW.wingGold, 'len'));
  // long flight feathers fanning back from the arm
  const NF = 7;
  for (let i = 0; i < NF; i++) {
    const t = 0.1 + 0.9 * i / (NF - 1);
    const p = add(SH, sub(WR, SH), t);
    const ang = -0.75 + 0.62 * t; // lower feathers droop, upper ones sweep straight back
    const dir = nrm(V(0.42, Math.sin(ang), -Math.cos(ang)));
    const n = wingN(dir);
    const k = NF - i;
    const L = 0.26 + 0.36 * Math.pow(t, 1.2);
    S.push(paint(blade(add(p, n, -0.014 + k * 0.005), dir, n, L, 0.13), SW.wing, 'flat'));
    S.push(paint(blade(add(add(p, n, 0.016 + k * 0.005), dir, 0.01), dir, n, L * 0.58, 0.12), SW.wing, 'flat'));
  }
  // primaries off the hand (wrist -> tip) pointing back-down
  for (let i = 0; i < 3; i++) {
    const t = 0.15 + i * 0.3;
    const p = add(WR, sub(TP, WR), t);
    const dir = nrm(V(0.35, -0.5 - 0.2 * i, -1));
    const n = wingN(V(0.35, -0.3, -1));
    S.push(paint(blade(add(p, n, -0.02 - i * 0.005), dir, n, 0.3 - i * 0.05, 0.12), SW.wing, 'flat'));
  }
  // gold coverts: a continuous band of gold blades hanging off the whole upper edge
  const edge = new THREE.CatmullRomCurve3([SH, add(SH, sub(WR, SH), 0.5), WR, add(WR, V(0.06, 0.07, -0.25), 1), TP], false, 'centripetal');
  const NC = 11;
  for (let i = 0; i < NC; i++) {
    const t = 0.2 + 0.72 * i / (NC - 1);
    const p = edge.getPoint(t);
    const dir = nrm(V(0.38, -0.45 - 0.35 * Math.max(0, t - 0.55), -1));
    const n = wingN(V(0.38, -0.3, -1));
    S.push(paint(blade(add(p, n, 0.04 + i * 0.005), dir, n, 0.19 + 0.04 * t, 0.08,
      0.016, [[0, -0.4], [0, 0.4], [0.2, 0.5], [0.75, 0.5], [1, 0], [0.75, -0.5], [0.2, -0.5]]), SW.wingGold, 'flat'));
  }

  return assemble(C, S);
}

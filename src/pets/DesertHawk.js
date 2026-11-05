// Desert Hawk (RARE): brown hawk, cream chest, gold hooked beak, wide spread wings, shard crest,
// sandstone + gold + lapis ornaments (neck collar, shoulder guards, leg bands), small sandstone horns.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  brown:   { i: 0, top: '#B8733A', bot: '#6E3A18' },
  brownL:  { i: 1, top: '#C98A4C', bot: '#8E5226' },
  feath:   { i: 2, top: '#A9652F', bot: '#4A2410' }, // wing / tail feather: brown -> dark tip
  feathD:  { i: 16, top: '#7E4520', bot: '#3A1A0A' },
  cream:   { i: 3, top: '#FFF4DC', bot: '#E8CFA2' },
  beak:    { i: 4, top: '#FFDF4A', bot: '#E8900E' },
  beakD:   { i: 5, top: '#E9A42A', bot: '#B8700A' },
  leg:     { i: 6, top: '#FFD23A', bot: '#E39A10' },
  claw:    { i: 7, top: '#4A3A34', bot: '#221A18' },
  eye:     { i: 8, top: '#1A1416', bot: '#0C0A0B' },
  white:   { i: 9, top: '#FFFFFF', bot: '#F1F1F4' },
  brow:    { i: 10, top: '#7A421C', bot: '#4A2410' },
  gold:    { i: 11, top: '#FFE46C', bot: '#E39E12' },
  goldF:   { i: 12, top: '#F8CC3A', bot: '#D99412' },
  lapis:   { i: 13, top: '#3F7BFF', bot: '#16308F' },
  sand:    { i: 14, top: '#F0CE92', bot: '#C99350' },
  sandD:   { i: 15, top: '#DDB074', bot: '#A87436' },
};
const P = PALETTE;

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const sub = (a, b) => a.clone().sub(b);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);

// flat faceted feather blade (convex prism) in the plane of dir with normal n
function blade(base, dir, n, L, w, th = 0.018, shape = null) {
  const d = nrm(dir);
  const nn = nrm(add(n, d, -n.dot(d)));
  const v = nrm(cross(nn, d));
  const pts2 = shape || [[0, -0.35], [0, 0.35], [0.2, 0.5], [0.78, 0.5], [1, 0.0], [0.78, -0.5], [0.2, -0.5]];
  const pts = [];
  for (const [u, s] of pts2) {
    const p = add(add(base, d, u * L), v, s * w);
    const t = th * (u > 0.9 ? 0.6 : 1);
    pts.push(add(p, nn, t / 2), add(p, nn, -t / 2));
  }
  return hull(pts);
}
// faceted gem: double pyramid facing +z
function gem(c, r, depth, n = 6) {
  return hull([...ring(c, r, r, n, 'z', Math.PI / 2), add(c, V(0, 0, depth)), add(c, V(0, 0, -depth * 0.5))]);
}

export function buildGeometry() {
  const C = [], S = [];
  const brownY = (g, lo = 0.2, hi = 0.75) => paint(g, P.brown, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');
  const cream = (g) => paint(g, P.cream, 'flat');

  // ================= BODY (stocky barrel, wide chest) =================
  C.push(brownY(hull([
    ...ring(V(0, 0.19, -0.02), 0.2, 0.15, 10, 'y'),
    ...ring(V(0, 0.27, 0.0), 0.33, 0.22, 10, 'y'),
    ...ring(V(0, 0.39, 0.01), 0.385, 0.25, 10, 'y'),
    ...ring(V(0, 0.51, 0.02), 0.36, 0.24, 10, 'y'),
    ...ring(V(0, 0.62, 0.03), 0.26, 0.19, 10, 'y'),
    ...ring(V(0, 0.68, 0.04), 0.17, 0.14, 10, 'y'),
  ]), 0.15, 0.75));
  // neck
  C.push(brownY(hull([...ring(V(0, 0.6, 0.04), 0.2, 0.17, 8, 'y'), ...ring(V(0, 0.8, 0.07), 0.16, 0.14, 8, 'y')])));

  // cream chest bib: rounded blob + rows of layered shard feathers on its surface
  const BC = V(0, 0.42, 0.13), BR = V(0.27, 0.23, 0.17);
  C.push(paint(blob(1, BC, BR, { jitter: 0.12 }), P.cream, 'y', [0.2, 0.66]));
  const bibZ = (x, y) => BC.z + BR.z * Math.sqrt(Math.max(0.05, 1 - (x / BR.x) ** 2 - ((y - BC.y) / BR.y) ** 2));
  const bibShard = (x, y, w, l, out = 0.006) => {
    const z = bibZ(x, y) + out;
    const d = V(x * 2.2, -1, 0.35 + 0.5 * Math.max(0, (y - 0.3) / 0.3));
    const g = cream(shard(V(x, y, z), d, w, l, 4, 0.7));
    (x === 0 ? C : S).push(g);
  };
  for (const [y, xs, w, l] of [
    [0.6, [0, 0.085], 0.06, 0.085],
    [0.5, [0, 0.1, 0.19], 0.065, 0.1],
    [0.39, [0.05, 0.15, 0.23], 0.065, 0.11],
    [0.28, [0, 0.1, 0.19], 0.062, 0.11],
  ]) for (const x of xs) bibShard(x, y, w, l);

  // gold neck collar with lapis pendant
  const tilt = (pts, c, k) => pts.map((q) => V(q.x, q.y - k * (q.z - c.z), q.z));
  const CC = V(0, 0.66, 0.06);
  C.push(paint(hull([...tilt(ring(CC, 0.2, 0.175, 10, 'y'), CC, 0.4), ...tilt(ring(add(CC, V(0, 0.055, 0)), 0.19, 0.168, 10, 'y'), CC, 0.4)]), P.gold, 'y'));
  C.push(paint(hull(plate([[-0.05, 0.025], [0.05, 0.025], [0.055, -0.025], [0, -0.085], [-0.055, -0.025]], V(0, 0.6, 0), 0.24, 0.27)), P.goldF, 'flat'));
  C.push(paint(gem(V(0, 0.585, 0.27), 0.032, 0.024), P.lapis, 'y'));
  // gold sun medallion with lapis centre on the chest
  const MZ = bibZ(0, 0.44) + 0.02;
  C.push(paint(hull([...ring(V(0, 0.44, MZ - 0.02), 0.062, 0.062, 8, 'z', 0), ...ring(V(0, 0.44, MZ + 0.008), 0.054, 0.054, 8, 'z', 0)]), P.gold, 'y'));
  C.push(paint(gem(V(0, 0.44, MZ + 0.01), 0.034, 0.024, 6), P.lapis, 'y'));

  // ================= LEGS (brown feathered thighs, yellow shanks, gold+lapis bands, talons) =================
  const LX = 0.15;
  S.push(paint(blob(1, V(LX, 0.22, 0.0), V(0.1, 0.1, 0.11), { jitter: 0.15 }), P.brown, 'y', [0.1, 0.4]));
  S.push(paint(shard(V(LX + 0.06, 0.2, 0.04), V(0.3, -1, 0.3), 0.05, 0.08), P.brownL, 'flat'));
  S.push(paint(shard(V(LX + 0.07, 0.2, -0.05), V(0.3, -1, -0.3), 0.05, 0.08), P.brownL, 'flat'));
  S.push(paint(shard(V(LX, 0.19, 0.08), V(0, -1, 0.35), 0.05, 0.075), P.brownL, 'flat'));
  const leg0 = S.length;
  S.push(paint(hull([...ring(V(LX, 0.25, 0.0), 0.05, 0.05, 6), ...ring(V(LX + 0.003, 0.04, 0.02), 0.045, 0.045, 6)]), P.leg, 'y', [0, 0.2]));
  S.push(paint(hull([...ring(V(LX + 0.002, 0.095, 0.01), 0.059, 0.059, 8), ...ring(V(LX + 0.002, 0.135, 0.007), 0.06, 0.06, 8)]), P.gold, 'y', [0.09, 0.14]));
  S.push(paint(gem(V(LX + 0.002, 0.115, 0.068), 0.017, 0.012, 4), P.lapis, 'y'));
  const foot = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.03, z), 0.055, 0.03, 0.055, 0.014)), P.leg, 'y', [0, 0.07]));
    for (const a of [-0.55, 0, 0.55]) {
      const d = V(Math.sin(a), 0, Math.cos(a));
      const k = add(V(x, 0.022, z), d, 0.1);
      S.push(paint(hull([...cbox(add(V(x, 0.026, z), d, 0.035), 0.024, 0.026, 0.024, 0.008), ...cbox(k, 0.02, 0.022, 0.019, 0.007)]), P.leg, 'y', [0, 0.07]));
      S.push(flat(shard(add(k, d, 0.012), add(d, V(0, -0.7, 0)), 0.017, 0.048), P.claw));
    }
    S.push(paint(hull(cbox(V(x, 0.02, z - 0.06), 0.019, 0.02, 0.032, 0.006)), P.leg, 'y', [0, 0.07]));
    S.push(flat(shard(V(x, 0.016, z - 0.092), V(0, -0.5, -1), 0.015, 0.042), P.claw));
  };
  foot(LX + 0.005, 0.045);
  const leg1 = S.length;

  // ================= TAIL (wide, thick fan back + down) =================
  for (const [x, dx, L, w, dy] of [[0, 0, 0.38, 0.095, 0.0], [0.06, 0.32, 0.36, 0.09, 0.01], [0.11, 0.66, 0.33, 0.085, 0.02], [0.15, 1.05, 0.28, 0.075, 0.03]]) {
    const g = blade(V(x, 0.33 + dy, -0.19), V(dx, -0.4, -1), V(0, 1, -0.4), L, w, 0.045);
    (x === 0 ? C : S).push(paint(g, P.feath, 'y'));
  }
  // upper tail coverts
  C.push(paint(blade(V(0, 0.37, -0.18), V(0, -0.33, -1), V(0, 1, -0.35), 0.2, 0.085, 0.04), P.brownL, 'y'));
  S.push(paint(blade(V(0.07, 0.37, -0.18), V(0.55, -0.33, -1), V(0, 1, -0.35), 0.18, 0.075, 0.04), P.brownL, 'y'));
  // gold tail band
  C.push(paint(hull([...ring(V(0, 0.32, -0.21), 0.1, 0.06, 8, 'z'), ...ring(V(0, 0.33, -0.25), 0.105, 0.065, 8, 'z')]), P.gold, 'y'));
  // back saddle feathers
  C.push(paint(blade(V(0, 0.66, -0.1), V(0, -0.5, -1), V(0, 1, -0.6), 0.18, 0.09, 0.035), P.brownL, 'y'));
  S.push(paint(blade(V(0.12, 0.62, -0.12), V(0.4, -0.6, -1), V(0.3, 1, -0.6), 0.16, 0.08, 0.035), P.brownL, 'y'));
  C.push(paint(blade(V(0, 0.52, -0.19), V(0, -0.6, -1), V(0, 1, -0.7), 0.15, 0.085, 0.035), P.brown, 'y'));

  // ================= WINGS (wide spread, chunky arm + covert mass, layered feathers) =================
  const SH = V(0.32, 0.6, -0.02), WR = V(0.58, 0.84, -0.07), TP = V(0.9, 0.88, -0.15);
  const edgePts = [SH, add(SH, sub(WR, SH), 0.5), WR, add(WR, sub(TP, WR), 0.5), TP];
  const edge = new THREE.CatmullRomCurve3(edgePts, false, 'centripetal');
  // chunky arm: shoulder -> wrist hull, wrist -> tip hull
  S.push(paint(hull([
    ...ring(add(SH, V(-0.06, -0.02, 0)), 0.11, 0.11, 8, 'x'),
    ...ring(add(SH, sub(WR, SH), 0.5), 0.085, 0.075, 8, 'x'),
    ...ring(WR, 0.065, 0.055, 8, 'x'),
  ]), P.brown, 'y', [0.45, 0.9]));
  S.push(paint(hull([...ring(WR, 0.06, 0.05, 6, 'x'), ...ring(add(WR, sub(TP, WR), 0.95), 0.03, 0.025, 6, 'x')]), P.brown, 'y', [0.6, 0.95]));
  // covert mass: thick faceted wedge hanging below the arm
  const covPts = [];
  for (const t of [0.0, 0.35, 0.7, 1.0]) {
    const p = edge.getPoint(t * 0.55);
    const h = 0.17 - 0.06 * t, th = 0.05 - 0.02 * t;
    covPts.push(add(p, V(0, 0, th)), add(p, V(0, 0, -th)), add(p, V(0.03 + 0.08 * t, -h, th * 0.6)), add(p, V(0.03 + 0.08 * t, -h, -th * 0.6)));
  }
  S.push(paint(hull(covPts), P.brownL, 'y', [0.45, 0.88]));
  // gold leading-edge trim
  S.push(paint(tube(curveSamples(edgePts.map((p, i) => add(p, V(0, 0.06 - 0.03 * i / 4, 0.01))), 9, (t) => 0.034 - 0.014 * t, (t) => 0.026 - 0.01 * t),
    { seg: 6, ref: V(0, 0, 1), capEnd: 0.02 }), P.gold, 'y', [0.6, 0.9]));
  const N = V(0, 0.12, 1);
  // flight feathers hanging from the edge, longer outward (front layer + darker back layer)
  const NF = 9;
  for (let i = 0; i < NF; i++) {
    const t = 0.1 + 0.9 * i / (NF - 1);
    const p = edge.getPoint(t);
    const dir = nrm(V(0.1 + 0.9 * t * t, -1 + 0.55 * t * t, -0.12));
    const L = 0.28 + 0.2 * t;
    S.push(paint(blade(add(p, N, -0.0 - i * 0.002), dir, N, L, 0.1, 0.026), P.feath, 'y'));
    const t2 = Math.min(1, t + 0.05);
    const dir2 = nrm(V(0.1 + 0.9 * t2 * t2, -1 + 0.55 * t2 * t2, -0.12));
    S.push(paint(blade(add(edge.getPoint(t2), N, -0.035 - i * 0.002), dir2, N, L * 0.92, 0.1, 0.024), P.feathD, 'y'));
  }
  // coverts: shorter lighter row in front, past the covert mass
  const NC = 6;
  for (let i = 0; i < NC; i++) {
    const t = 0.25 + 0.65 * i / (NC - 1);
    const p = edge.getPoint(t);
    const dir = nrm(V(0.1 + 0.8 * t * t, -1 + 0.4 * t * t, -0.05));
    S.push(paint(blade(add(p, N, 0.03 + i * 0.002), dir, N, 0.16 + 0.04 * t, 0.09, 0.03), P.brownL, 'y'));
  }

  // sandstone shoulder guard with lapis gem
  const PC = V(0.33, 0.63, 0.0);
  S.push(paint(hull([...ring(add(PC, V(-0.03, -0.06, 0)), 0.1, 0.1, 8, 'x'), ...ring(add(PC, V(0.04, 0, 0)), 0.088, 0.09, 8, 'x'),
    ...ring(add(PC, V(0.075, 0.02, 0)), 0.05, 0.05, 8, 'x')]), P.sand, 'y'));
  S.push(paint(hull([...ring(add(PC, V(-0.035, -0.08, 0)), 0.107, 0.107, 8, 'x'), ...ring(add(PC, V(-0.005, -0.05, 0)), 0.107, 0.107, 8, 'x')]), P.gold, 'y'));
  S.push(paint(shard(add(PC, V(0.06, 0.04, -0.02)), V(0.6, 0.8, -0.3), 0.03, 0.09), P.gold, 'flat'));
  S.push(paint(gem(add(PC, V(0.04, 0.0, 0.088)), 0.022, 0.016, 4), P.lapis, 'y'));

  // ================= HEAD =================
  const hc0 = C.length, hs0 = S.length;
  const H = { y: 0.84, z: 0.1 };
  C.push(paint(hull([
    ...cbox(V(0, H.y, H.z), 0.155, 0.135, 0.145, 0.06),
    ...ring(V(0, H.y + 0.15, H.z - 0.01), 0.1, 0.09, 8, 'y'),
    V(0.165, H.y - 0.07, H.z - 0.01), V(-0.165, H.y - 0.07, H.z - 0.01),
  ]), P.brown, 'y', [0.66, 1.0]));
  const FZ = H.z + 0.145;
  // cream cheeks / throat

  // crest: a few low shards swept back along the top/back of the head
  C.push(paint(shard(V(0, H.y + 0.15, H.z + 0.03), V(0, 0.32, -1), 0.05, 0.15, 4, 0.6), P.brownL, 'flat'));
  C.push(paint(shard(V(0, H.y + 0.13, H.z - 0.07), V(0, 0.2, -1), 0.05, 0.14, 4, 0.6), P.brown, 'flat'));
  S.push(paint(shard(V(0.05, H.y + 0.13, H.z - 0.01), V(0.25, 0.25, -1), 0.04, 0.12, 4, 0.6), P.brown, 'flat'));
  // nape feathers draping down the back of the head
  C.push(paint(shard(V(0, H.y + 0.02, H.z - 0.14), V(0, -0.7, -1), 0.06, 0.12), P.brownL, 'flat'));
  S.push(paint(shard(V(0.08, H.y + 0.0, H.z - 0.12), V(0.5, -0.7, -1), 0.05, 0.11), P.brownL, 'flat'));
  C.push(paint(shard(V(0, H.y - 0.08, H.z - 0.12), V(0, -0.9, -0.8), 0.055, 0.1), P.brown, 'flat'));
  // small sandstone horns
  S.push(paint(hull([...ring(V(0.115, H.y + 0.1, H.z - 0.03), 0.034, 0.034, 6, 'y'), ...ring(V(0.13, H.y + 0.125, H.z - 0.04), 0.03, 0.03, 6, 'y')]), P.gold, 'y'));
  S.push(paint(shard(V(0.135, H.y + 0.13, H.z - 0.045), V(0.45, 0.75, -0.8), 0.03, 0.11, 4), P.sand, 'y'));

  // beak: gold hook
  const bk0 = C.length;
  const BY = H.y - 0.02;
  const bp = (g) => paint(g, P.beak, 'y', [BY - 0.16, BY + 0.04]);
  C.push(bp(hull([
    ...plate([[-0.075, 0.03], [0.075, 0.03], [0.08, -0.055], [0.05, -0.09], [-0.05, -0.09], [-0.08, -0.055]], V(0, BY, 0), FZ - 0.05, FZ - 0.02),
    V(0.045, BY + 0.02, FZ + 0.05), V(-0.045, BY + 0.02, FZ + 0.05),
    V(0.03, BY + 0.0, FZ + 0.12), V(-0.03, BY + 0.0, FZ + 0.12),
    V(0.04, BY - 0.065, FZ + 0.08), V(-0.04, BY - 0.065, FZ + 0.08),
    V(0.022, BY - 0.045, FZ + 0.15), V(-0.022, BY - 0.045, FZ + 0.15),
  ])));
  C.push(bp(hull([
    V(0.022, BY - 0.035, FZ + 0.15), V(-0.022, BY - 0.035, FZ + 0.15),
    V(0.03, BY - 0.065, FZ + 0.095), V(-0.03, BY - 0.065, FZ + 0.095),
    V(0.0, BY - 0.15, FZ + 0.135), V(0.011, BY - 0.12, FZ + 0.115), V(-0.011, BY - 0.12, FZ + 0.115),
  ])));
  C.push(paint(hull([
    ...plate([[-0.05, 0], [0.05, 0], [0.045, -0.03], [-0.045, -0.03]], V(0, BY - 0.08, 0), FZ - 0.035, FZ - 0.01),
    V(0.025, BY - 0.09, FZ + 0.07), V(-0.025, BY - 0.09, FZ + 0.07), V(0, BY - 0.105, FZ + 0.05),
  ]), P.beakD, 'flat'));
  for (const g of C.slice(bk0)) { g.translate(0, -BY, -FZ); g.scale(1.25, 1.2, 1.2); g.translate(0, BY, FZ); }
  S.push(flat(hull(cbox(V(0.036, BY + 0.015, FZ + 0.06), 0.009, 0.005, 0.011, 0.003)), P.claw));

  // fierce eyes
  const E = V(0.085, H.y + 0.045, 0), es = 1.2;
  const sc = (arr) => arr.map(([u, v]) => [u * es, v * es]);
  S.push(flat(hull(plate(sc([[-0.036, 0.0], [0.044, 0.03], [0.05, -0.008], [0.02, -0.036], [-0.026, -0.032], [-0.04, -0.016]]),
    E, FZ - 0.014, FZ + 0.008, 0.35)), P.white));
  S.push(flat(hull(plate(sc([[-0.026, 0.0], [0.014, 0.017], [0.022, -0.008], [0.006, -0.03], [-0.02, -0.028], [-0.03, -0.012]]),
    V(E.x - 0.004, E.y, 0), FZ + 0.0, FZ + 0.014, 0.35)), P.eye));
  S.push(flat(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.008, FZ + 0.019, 0.35)), P.white));
  S.push(paint(hull([
    V(0.022, E.y + 0.008, FZ + 0.03), V(0.025, E.y + 0.05, FZ + 0.018),
    V(0.16, E.y + 0.055, FZ - 0.045), V(0.16, E.y + 0.095, FZ - 0.06),
    V(0.022, E.y + 0.008, FZ - 0.03), V(0.025, E.y + 0.06, FZ - 0.04),
    V(0.16, E.y + 0.055, FZ - 0.1), V(0.16, E.y + 0.095, FZ - 0.11),
  ]), P.brow, 'y'));
  // cheek feather flares
  S.push(paint(shard(V(0.15, H.y - 0.05, H.z + 0.0), V(1, -0.4, -0.5), 0.045, 0.08), P.brown, 'flat'));
  S.push(paint(shard(V(0.13, H.y - 0.02, H.z - 0.1), V(0.5, -0.3, -1), 0.045, 0.09), P.brown, 'flat'));

  const HS = 1.38, piv = V(0, 0.72, 0.1);
  for (const g of [...C.slice(hc0), ...S.slice(hs0)]) {
    g.translate(-piv.x, -piv.y, -piv.z); g.scale(HS, HS, HS); g.translate(piv.x, piv.y, piv.z);
  }
  // lift everything except the shanks/feet so the legs read longer
  const LIFT = 0.07;
  C.forEach((g) => g.translate(0, LIFT, 0));
  S.forEach((g, i) => { if (i < leg0 || i >= leg1) g.translate(0, LIFT, 0); });
  return assemble(C, S);
}

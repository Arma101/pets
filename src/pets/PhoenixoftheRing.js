// Phoenix of the Ring (Robux egg, Legends Egg): blazing orange phoenix, gold flame wings, halo of fire,
// battle scars, ornate gold armour with glowing runes. Chunky faceted biped bird, both feet planted.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  orange:  { i: 0, top: '#FF7A1A', bot: '#D9400A' },
  belly:   { i: 1, top: '#FFD860', bot: '#FF9A22' },
  red:     { i: 2, top: '#F2541E', bot: '#B8240C' },
  gold:    { i: 3, top: '#FFE070', bot: '#F2960E' },
  goldDk:  { i: 4, top: '#F8C832', bot: '#D08A10' },
  beak:    { i: 5, top: '#FFE04A', bot: '#F09216' },
  eye:     { i: 6, top: '#1A1416', bot: '#0C0A0B' },
  white:   { i: 7, top: '#FFFFFF', bot: '#F1F1F4' },
  brow:    { i: 8, top: '#E0461A', bot: '#9E2408' },
  flame:   { i: 9, top: '#FFF27A', bot: '#FF6A00', glow: true },
  fire:    { i: 10, top: '#FFE14A', bot: '#FF5A0A', glow: true },
  rune:    { i: 11, top: '#FFFCD8', bot: '#FFE24A', glow: true },
  panel:   { i: 12, top: '#A8241A', bot: '#6A120C' },
  scar:    { i: 13, top: '#FFE2C8', bot: '#EDB494' },
  claw:    { i: 14, top: '#5A3A2A', bot: '#2A1A12' },
  tail:    { i: 15, top: '#E8380E', bot: '#FFE45A', glow: true },
  wing:    { i: 16, top: '#FFD030', bot: '#FF7A0E' },
  mouth:   { i: 17, top: '#6A2A12', bot: '#3E160A' },
  covert:  { i: 18, top: '#FFE04A', bot: '#F29A12' },
  wedge:   { i: 19, top: '#FFD844', bot: '#F28A10' },
};
const P = PALETTE;

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const sub = (a, b) => a.clone().sub(b);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);

// flat feather blade lying in the plane spanned by dir with normal n
function blade(base, dir, n, L, w, th = 0.018, shape = null) {
  const d = nrm(dir);
  const nn = nrm(add(n, d, -n.dot(d)));
  const v = nrm(cross(nn, d));
  const pts2 = shape || [[0, -0.3], [0, 0.3], [0.25, 0.5], [0.7, 0.45], [1, 0.0], [0.7, -0.45], [0.25, -0.5]];
  const pts = [];
  for (const [u, s] of pts2) {
    const p = add(add(base, d, u * L), v, s * w);
    const t = th * (u > 0.9 ? 0.6 : 1);
    pts.push(add(p, nn, t / 2), add(p, nn, -t / 2));
  }
  return hull(pts);
}

// chunky feather plate (rooster style): base b, direction d, outward normal n
function fplate(b, d, n, w, l, th = 0.014) {
  d = nrm(d); n = nrm(n);
  const sd = nrm(cross(d, n));
  n = nrm(cross(sd, d));
  const at = (u, v, h) => b.clone().addScaledVector(d, u).addScaledVector(sd, v).addScaledVector(n, h);
  const pts = [];
  for (const h of [-th, th * 0.3]) pts.push(at(0, w * 0.8, h), at(0, -w * 0.8, h), at(l * 0.3, w, h * 0.8), at(l * 0.3, -w, h * 0.8));
  pts.push(at(l, 0, -th * 0.3), at(l * 0.3, 0, th * 1.1), at(0, 0, th));
  return hull(pts);
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const orange = (g, lo, hi) => paint(g, P.orange, 'y', lo === undefined ? null : [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');
  const gold = (g, lo, hi) => paint(g, P.gold, 'y', lo === undefined ? null : [lo, hi]);

  // ================= BODY (sturdy egg, chest forward) =================
  C.push(orange(hull([
    ...ring(V(0, 0.36, -0.27), 0.09, 0.08, 10, 'z'),
    ...ring(V(0, 0.37, -0.17), 0.18, 0.15, 10, 'z'),
    ...ring(V(0, 0.39, -0.04), 0.215, 0.18, 10, 'z'),
    ...ring(V(0, 0.43, 0.08), 0.21, 0.185, 10, 'z'),
    ...ring(V(0, 0.49, 0.16), 0.17, 0.16, 10, 'z'),
    ...ring(V(0, 0.55, 0.2), 0.1, 0.1, 10, 'z'),
  ]), 0.2, 0.68));
  C.push(orange(hull([...ring(V(0, 0.5, 0.06), 0.155, 0.145, 8, 'y'), ...ring(V(0, 0.7, 0.1), 0.14, 0.135, 8, 'y')]), 0.4, 0.85));

  // ---- golden belly feather shards below the breastplate
  C.push(paint(shard(V(0, 0.34, 0.2), V(0, -1, 0.35), 0.06, 0.1, 4, 0.6), P.belly, 'flat'));
  S.push(paint(shard(V(0.08, 0.33, 0.18), V(0.3, -1, 0.3), 0.055, 0.1, 4, 0.6), P.belly, 'flat'));
  S.push(paint(shard(V(0.15, 0.36, 0.12), V(0.7, -1, 0.1), 0.05, 0.09, 4, 0.6), P.red, 'flat'));

  // ================= CHEST ARMOUR (curved gold breastplate, crimson medallion, glowing runes) =================
  // curved surface: z falls off with |x|, two layers -> faceted shell hugging the chest
  const bp = (u, v, zc, k) => V(u, v, zc - k * u * u);
  const outline = [[-0.16, 0.66], [0.16, 0.66], [0.19, 0.57], [0.18, 0.46], [0.12, 0.38], [0, 0.35], [-0.12, 0.38], [-0.18, 0.46], [-0.19, 0.57]];
  const sh = [];
  for (const [u, v] of outline) { sh.push(bp(u, v, 0.255 - Math.max(0, 0.5 - v) * 0.45, 2.4)); sh.push(bp(u * 0.92, v, 0.2 - Math.max(0, 0.52 - v) * 0.6, 2.4)); }
  for (const [u, v] of [[-0.08, 0.6], [0.08, 0.6], [-0.09, 0.47], [0.09, 0.47], [0, 0.53]]) sh.push(bp(u, v, 0.268, 2.4));
  C.push(gold(hull(sh), 0.34, 0.68));
  const CZ = 0.27, MY = 0.515;
  // crimson medallion (octagon) + gold rim
  const oct = (r) => Array.from({ length: 8 }, (_, k) => [Math.cos(Math.PI / 8 + k * Math.PI / 4) * r, Math.sin(Math.PI / 8 + k * Math.PI / 4) * r]);
  C.push(paint(hull(plate(oct(0.078), V(0, MY, 0), CZ - 0.02, CZ + 0.006)), P.goldDk, 'flat'));
  C.push(flat(hull(plate(oct(0.062), V(0, MY, 0), CZ - 0.01, CZ + 0.012)), P.panel));
  // sun rune: diamond core + 4 rays + diagonal ticks
  C.push(flat(hull(plate([[0, 0.034], [0.022, 0], [0, -0.034], [-0.022, 0]], V(0, MY, 0), CZ, CZ + 0.019)), P.rune));
  for (const [x, y, hw, hh] of [[0, 0.05, 0.005, 0.009], [0, -0.05, 0.005, 0.009]])
    C.push(flat(hull(plate([[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]], V(x, MY + y, 0), CZ, CZ + 0.019)), P.rune));
  S.push(flat(hull(plate([[-0.009, -0.005], [0.009, -0.005], [0.009, 0.005], [-0.009, 0.005]], V(0.044, MY, 0), CZ, CZ + 0.019)), P.rune));
  S.push(flat(hull(plate([[-0.004, -0.004], [0.006, 0.006], [0.004, 0.009], [-0.006, -0.001]].map(([a, b]) => [a * 1.4, b * 1.4]), V(0.032, MY + 0.032, 0), CZ, CZ + 0.019)), P.rune));
  S.push(flat(hull(plate([[-0.004, 0.004], [0.006, -0.006], [0.004, -0.009], [-0.006, 0.001]].map(([a, b]) => [a * 1.4, b * 1.4]), V(0.032, MY - 0.032, 0), CZ, CZ + 0.019)), P.rune));
  // rune lines etched along the plate sides
  S.push(flat(hull([bp(0.12, 0.62, 0.262, 2.4), bp(0.135, 0.6, 0.262, 2.4), bp(0.15, 0.5, 0.262, 2.4), bp(0.135, 0.5, 0.262, 2.4),
    bp(0.12, 0.62, 0.248, 2.4), bp(0.15, 0.5, 0.248, 2.4)]), P.rune));
  // gold rim studs
  S.push(paint(blob(0, bp(0.15, 0.63, 0.262, 2.4), V(0.022, 0.022, 0.018)), P.goldDk, 'flat'));
  S.push(paint(blob(0, bp(0.1, 0.4, 0.262, 2.4), V(0.02, 0.02, 0.018)), P.goldDk, 'flat'));
  C.push(paint(blob(0, V(0, 0.37, 0.262), V(0.026, 0.026, 0.02)), P.rune, 'flat'));

  // ================= HEAD =================
  const hc0 = C.length, hs0 = S.length;
  const H = { y: 0.82, z: 0.12 };
  C.push(orange(hull([
    ...cbox(V(0, H.y, H.z), 0.182, 0.15, 0.145, 0.07),
    ...ring(V(0, H.y + 0.16, H.z - 0.01), 0.1, 0.085, 8, 'y'),
    V(0.185, H.y - 0.075, H.z + 0.02), V(-0.185, H.y - 0.075, H.z + 0.02),
  ]), 0.66, 1.0));
  const FZ = H.z + 0.145;
  // golden cheek ruff feather plates
  S.push(paint(fplate(V(0.15, H.y - 0.05, H.z + 0.05), V(0.5, -0.8, -0.4), V(1, 0, 0.3), 0.055, 0.11), P.belly, 'flat'));
  S.push(paint(fplate(V(0.15, H.y - 0.01, H.z - 0.05), V(0.4, -0.4, -1), V(1, 0.2, -0.2), 0.055, 0.12), P.orange, 'flat'));
  S.push(paint(fplate(V(0.12, H.y - 0.11, H.z - 0.05), V(0.4, -1, -0.5), V(1, 0, -0.3), 0.055, 0.11), P.red, 'flat'));
  C.push(paint(fplate(V(0, H.y + 0.0, H.z - 0.14), V(0, -0.6, -1), V(0, 0.3, -1), 0.07, 0.13), P.red, 'flat'));
  S.push(paint(fplate(V(0.09, H.y + 0.03, H.z - 0.13), V(0.3, -0.5, -1), V(0.5, 0.3, -1), 0.06, 0.12), P.orange, 'flat'));

  // beak: chunky gold hook
  const BY = H.y - 0.04;
  C.push(paint(hull([
    ...cbox(V(0, BY, FZ + 0.0), 0.075, 0.05, 0.02, 0.015),
    V(0.035, BY + 0.025, FZ + 0.08), V(-0.035, BY + 0.025, FZ + 0.08),
    V(0, BY - 0.075, FZ + 0.165), V(0.015, BY - 0.045, FZ + 0.15), V(-0.015, BY - 0.045, FZ + 0.15),
    V(0.032, BY - 0.045, FZ + 0.07), V(-0.032, BY - 0.045, FZ + 0.07),
  ]), P.beak, 'y', [BY - 0.08, BY + 0.05]));
  C.push(paint(hull([...cbox(V(0, BY - 0.055, FZ + 0.02), 0.048, 0.016, 0.02, 0.007),
    V(0, BY - 0.062, FZ + 0.1), V(0.013, BY - 0.054, FZ + 0.09), V(-0.013, BY - 0.054, FZ + 0.09)]), P.goldDk, 'flat'));
  S.push(paint(hull(cbox(V(0.036, BY + 0.012, FZ + 0.06), 0.011, 0.006, 0.013, 0.003)), P.mouth, 'flat'));

  // fierce eyes
  const E = V(0.088, H.y + 0.04, 0), ek = 1.22;
  const K = (a) => a.map(([u, v]) => [u * ek, v * ek]);
  S.push(flat(hull(plate(K([[-0.036, 0.004], [0.04, 0.03], [0.045, -0.01], [0.018, -0.036], [-0.026, -0.032], [-0.04, -0.014]]),
    E, FZ - 0.012, FZ + 0.01, 0.25)), P.white));
  S.push(flat(hull(plate(K([[-0.024, 0.004], [0.012, 0.017], [0.018, -0.007], [0.004, -0.026], [-0.017, -0.024], [-0.027, -0.009]]),
    V(E.x - 0.006, E.y - 0.002, 0), FZ + 0.004, FZ + 0.016, 0.25)), P.eye));
  S.push(flat(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.0, E.y + 0.003, 0), FZ + 0.012, FZ + 0.021, 0.25)), P.white));
  // heavy brow, deep red
  S.push(paint(hull([
    V(0.02, E.y + 0.01, FZ + 0.03), V(0.022, E.y + 0.05, FZ + 0.02),
    V(0.165, E.y + 0.055, FZ - 0.03), V(0.165, E.y + 0.095, FZ - 0.045),
    V(0.02, E.y + 0.01, FZ - 0.03), V(0.022, E.y + 0.06, FZ - 0.04),
    V(0.165, E.y + 0.055, FZ - 0.08), V(0.165, E.y + 0.1, FZ - 0.09),
  ]), P.brow, 'y'));
  // battle scars: a pale slash cut through the brow and continuing below the eye (both sides)
  const scarSeg = (x0, y0, x1, y1, z0, z1) => S.push(flat(hull([
    V(x0 - 0.007, y0, z0 + 0.006), V(x0 + 0.007, y0, z0 + 0.006), V(x1 - 0.007, y1, z1 + 0.006), V(x1 + 0.007, y1, z1 + 0.006),
    V(x0, y0, z0 - 0.01), V(x1, y1, z1 - 0.01)]), P.scar));
  scarSeg(0.105, E.y + 0.105, 0.118, E.y + 0.035, FZ - 0.045, FZ - 0.016);
  scarSeg(0.13, E.y - 0.045, 0.142, E.y - 0.095, FZ - 0.03, FZ - 0.04);
  // gold circlet with rune gem on the forehead
  const HY = H.y + 0.12;
  C.push(gold(hull([...ring(V(0, HY, H.z), 0.15, 0.13, 10, 'y'), ...ring(V(0, HY + 0.04, H.z - 0.005), 0.135, 0.12, 10, 'y')])));
  C.push(gold(hull([V(0, HY + 0.1, FZ - 0.01), V(0.045, HY + 0.02, FZ - 0.0), V(-0.045, HY + 0.02, FZ - 0.0),
    V(0, HY - 0.03, FZ + 0.0), V(0, HY + 0.03, FZ - 0.05), V(0.04, HY + 0.02, FZ - 0.05), V(-0.04, HY + 0.02, FZ - 0.05)])));
  C.push(flat(hull(plate([[0, 0.035], [0.02, 0], [0, -0.03], [-0.02, 0]], V(0, HY + 0.025, 0), FZ - 0.005, FZ + 0.012)), P.rune));

  // flame crest: shards fanning up and back
  for (const [z, dz, len, w] of [[0.06, 0.5, 0.16, 0.05], [0.0, -0.1, 0.22, 0.06], [-0.07, -0.7, 0.24, 0.06], [-0.12, -1.3, 0.2, 0.05]])
    C.push(paint(shard(V(0, HY + 0.03, H.z + z), V(0, 1, dz), w, len, 4, 0.7), P.flame, 'y', [HY, HY + 0.24]));
  for (const [z, dz, len] of [[0.02, 0.1, 0.16], [-0.08, -0.8, 0.18]])
    S.push(paint(shard(V(0.06, HY + 0.03, H.z + z), V(0.35, 1, dz), 0.045, len, 4, 0.7), P.flame, 'y', [HY, HY + 0.2]));

  // flame nape feathers streaming back from the head
  C.push(paint(shard(V(0, H.y + 0.04, H.z - 0.12), V(0, 0.35, -1), 0.055, 0.15, 4, 0.6), P.flame, 'flat'));
  S.push(paint(shard(V(0.08, H.y + 0.02, H.z - 0.11), V(0.4, 0.2, -1), 0.05, 0.13, 4, 0.6), P.flame, 'flat'));
  S.push(paint(shard(V(0.12, H.y - 0.06, H.z - 0.08), V(0.5, -0.2, -1), 0.045, 0.12, 4, 0.6), P.fire, 'flat'));

  // scale the head up about the neck for the big-head look
  const HS = 1.12, piv = V(0, 0.66, 0.1);
  for (const g of [...C.slice(hc0), ...S.slice(hs0)]) {
    g.translate(-piv.x, -piv.y, -piv.z); g.scale(HS, HS, HS); g.translate(piv.x, piv.y, piv.z);
  }

  // ================= HALO OF FIRE (ring behind the head, on the centre line) =================
  const HC = V(0, H.y + 0.1, H.z - 0.2), HR = 0.25, NSEG = 12;
  const hp = (a, r, dz = 0) => V(Math.sin(a) * r, HC.y + Math.cos(a) * r, HC.z + dz);
  for (let k = 0; k < NSEG / 2; k++) {
    const a0 = (k * 2 * Math.PI) / NSEG, a1 = ((k + 1) * 2 * Math.PI) / NSEG;
    const pts = [];
    for (const a of [a0 - 0.02, a1 + 0.02]) for (const [dr, dz] of [[-0.03, -0.025], [0.03, -0.025], [-0.03, 0.025], [0.03, 0.025]]) pts.push(hp(a, HR + dr, dz));
    S.push(paint(hull(pts), P.fire, 'flat'));
    const am = (a0 + a1) / 2;
    const out = V(Math.sin(am), Math.cos(am), 0);
    const big = k % 2 === 0;
    S.push(paint(shard(hp(am, HR + 0.015), nrm(add(out, V(0, 0.9, 0))), big ? 0.05 : 0.04, big ? 0.15 : 0.1, 4, 0.55), P.flame, 'flat'));
    const ab = a1;
    if (k < NSEG / 2 - 1) S.push(paint(shard(hp(ab, HR + 0.015), nrm(add(V(Math.sin(ab), Math.cos(ab), 0), V(0, 0.9, 0))), 0.03, 0.07, 4, 0.55), P.fire, 'flat'));
  }

  // ================= WINGS (raised gold flame wings) =================
  const SH = V(0.17, 0.58, 0.0), WR = V(0.44, 0.92, -0.1), TP = V(0.62, 1.08, -0.6);
  const armDir = nrm(sub(WR, SH));
  const wingN = (dir) => { const n = nrm(cross(armDir, dir)); if (n.x < 0) n.multiplyScalar(-1); return n; };
  const edge = new THREE.CatmullRomCurve3([SH, add(SH, sub(WR, SH), 0.5), WR, add(WR, V(0.06, 0.07, -0.22), 1), TP], false, 'centripetal');
  S.push(paint(tube(curveSamples([SH, add(SH, sub(WR, SH), 0.5), WR, add(WR, V(0.06, 0.07, -0.22), 1), TP], 10,
    (t) => 0.055 - 0.02 * t, (t) => 0.04 - 0.012 * t), { seg: 6, ref: V(1, 0, 0.2), capEnd: 0.035, capStart: 0.01 }), P.wedge, 'len'));
  const NF = 7;
  for (let i = 0; i < NF; i++) {
    const t = 0.1 + 0.9 * i / (NF - 1);
    const p = add(SH, sub(WR, SH), t);
    const ang = -0.8 + 0.65 * t;
    const dir = nrm(V(0.4, Math.sin(ang), -Math.cos(ang)));
    const n = wingN(dir);
    const L = 0.24 + 0.32 * Math.pow(t, 1.2);
    S.push(paint(blade(add(p, n, -0.014 + (NF - i) * 0.005), dir, n, L, 0.12), P.fire, 'y', [0.3, 1.1]));
    S.push(paint(blade(add(add(p, n, 0.016 + (NF - i) * 0.005), dir, 0.01), dir, n, L * 0.6, 0.11), P.wing, 'y', [0.3, 1.1]));
  }
  for (let i = 0; i < 3; i++) {
    const t = 0.15 + i * 0.3;
    const p = add(WR, sub(TP, WR), t);
    const dir = nrm(V(0.35, -0.45 - 0.2 * i, -1));
    const n = wingN(V(0.35, -0.3, -1));
    S.push(paint(blade(add(p, n, -0.02 - i * 0.005), dir, n, 0.3 - i * 0.05, 0.12), P.fire, 'y', [0.3, 1.1]));
  }
  // coverts: two staggered rows of overlapping angular kite shards along the gold edge
  const kiteS = [[0, -0.25], [0, 0.25], [0.3, 0.5], [1, 0], [0.3, -0.5]];
  const NC = 9;
  for (let row = 0; row < 2; row++) {
    const nRow = row ? NC - 1 : NC;
    for (let i = 0; i < nRow; i++) {
      const t = 0.2 + 0.72 * (i + row * 0.5) / (NC - 1);
      const dir = nrm(V(0.38, -0.5 - 0.35 * Math.max(0, t - 0.55), -1));
      const p = add(edge.getPoint(t), dir, row * 0.07);
      const n = wingN(V(0.38, -0.3, -1));
      const L = (row ? 0.15 : 0.19) + 0.04 * t;
      S.push(paint(blade(add(p, n, 0.045 - row * 0.012 + i * 0.004), dir, n, L, row ? 0.075 : 0.085, 0.03, kiteS),
        row ? P.wing : P.covert, 'y', [0.55, 1.15]));
    }
  }
  // gold pauldron over the wing root
  S.push(gold(hull([...ring(V(0.17, 0.6, 0.02), 0.06, 0.09, 8, 'x'), ...ring(V(0.23, 0.58, 0.02), 0.035, 0.07, 8, 'x'),
    V(0.16, 0.7, 0.02)]), 0.5, 0.7));
  S.push(paint(shard(V(0.21, 0.66, 0.02), V(0.6, 1, 0), 0.03, 0.08), P.goldDk, 'flat'));
  S.push(flat(hull([V(0.226, 0.615, 0.02), V(0.226, 0.545, 0.02), V(0.226, 0.58, 0.042), V(0.226, 0.58, -0.002),
    V(0.24, 0.6, 0.02), V(0.24, 0.56, 0.02), V(0.24, 0.58, 0.032), V(0.24, 0.58, 0.008)]), P.rune));

  // ornate gold back plate between the wings, with a glowing rune
  const bpPts = [];
  for (const [x, y, z] of [[0.12, 0.67, -0.075], [0.16, 0.57, -0.1], [0.09, 0.5, -0.17], [0, 0.48, -0.19], [0, 0.69, -0.06]])
    for (const sx of x ? [-1, 1] : [1]) { bpPts.push(V(sx * x, y, z)); bpPts.push(V(sx * x * 0.9, y - 0.03, z + 0.06)); }
  C.push(gold(hull(bpPts), 0.45, 0.72));
  C.push(flat(hull([V(0, 0.64, -0.095), V(0.02, 0.59, -0.122), V(-0.02, 0.59, -0.122), V(0, 0.54, -0.15),
    V(0, 0.63, -0.08), V(0, 0.55, -0.13)]).translate(0, 0.005, -0.004), P.rune));

  // ================= LEGS (thick feathered thighs, gold greaves, talons) =================
  const LX = 0.11;
  S.push(orange(blob(1, V(LX, 0.26, -0.01), V(0.1, 0.105, 0.12), { jitter: 0.15 }), 0.15, 0.4));
  // trouser feathers: a ring of angular orange/red shards hanging over the top of the leg
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI * 0.75 + k * (Math.PI * 1.5) / 6 + Math.PI / 2; // skip the inner side (facing -x)
    const r = V(Math.sin(a), 0, Math.cos(a));
    if (r.x < -0.6) continue;
    const base = add(V(LX, 0.26, 0.0), r, 0.085);
    S.push(paint(shard(base, nrm(add(r, V(0, -1.7, 0), 0.6)), 0.048, 0.12, 4, 0.55), k % 2 ? P.red : P.orange, 'flat'));
  }
  S.push(paint(fplate(V(LX + 0.065, 0.28, 0.04), V(0.3, -1, 0.2), V(1, 0, 0.6), 0.05, 0.1, 0.011), P.red, 'flat'));
  S.push(paint(fplate(V(LX, 0.28, 0.08), V(0, -1, 0.3), V(0, 0, 1), 0.05, 0.1, 0.011), P.red, 'flat'));
  // shin
  S.push(paint(hull([...ring(V(LX, 0.2, 0.0), 0.063, 0.063, 6), ...ring(V(LX + 0.004, 0.04, 0.02), 0.058, 0.058, 6)]), P.beak, 'y', [0, 0.2]));
  // gold greave
  S.push(gold(hull([...ring(V(LX, 0.2, 0.002), 0.083, 0.083, 8), ...ring(V(LX + 0.003, 0.09, 0.014), 0.076, 0.076, 8),
    V(LX, 0.15, 0.103)]), 0.08, 0.22));
  S.push(paint(hull([...ring(V(LX, 0.205, 0.002), 0.09, 0.09, 8), ...ring(V(LX, 0.225, 0.002), 0.088, 0.088, 8)]), P.goldDk, 'flat'));
  S.push(flat(hull(plate([[0, 0.03], [0.014, 0], [0, -0.03], [-0.014, 0]], V(LX + 0.002, 0.145, 0), 0.084, 0.106)), P.rune));
  const foot = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.034, z), 0.066, 0.034, 0.058, 0.016)), P.beak, 'y', [0, 0.07]));
    for (const [dx, dz] of [[-0.06, 0.09], [0, 0.11], [0.06, 0.09]]) {
      S.push(paint(hull([...cbox(V(x + dx * 0.45, 0.027, z + dz * 0.45), 0.024, 0.027, 0.024, 0.008),
        ...cbox(V(x + dx, 0.023, z + dz), 0.022, 0.023, 0.018, 0.007)]), P.beak, 'y', [0, 0.07]));
      S.push(paint(shard(V(x + dx * 1.08, 0.02, z + dz + 0.014), V(dx, -0.45, 0.8), 0.018, 0.045), P.goldDk, 'flat'));
    }
    S.push(paint(hull(cbox(V(x, 0.022, z - 0.055), 0.02, 0.022, 0.03, 0.006)), P.beak, 'y', [0, 0.07]));
    S.push(paint(shard(V(x, 0.016, z - 0.087), V(0, -0.4, -1), 0.016, 0.04), P.goldDk, 'flat'));
  };
  foot(LX + 0.005, 0.03);

  // ================= TAIL (long flame plumes sweeping back, red -> yellow) =================
  const plume = (pts, w, thick) => paint(tube(curveSamples(pts, 9,
    (t) => thick * (1 - 0.6 * t), (t) => w * Math.sin(Math.PI * (0.18 + 0.82 * t)) + 0.006),
    { seg: 4, axis: X }), P.tail, 'len');
  const tails = [
    { x: [0, 0], w: 0.1, pts: [[0.42, -0.22], [0.5, -0.42], [0.62, -0.62], [0.8, -0.74], [0.95, -0.72]] },
    { x: [0.04, 0.14], w: 0.09, pts: [[0.4, -0.22], [0.42, -0.42], [0.48, -0.62], [0.6, -0.78], [0.72, -0.8]] },
    { x: [0.04, 0.2], w: 0.085, pts: [[0.38, -0.22], [0.33, -0.4], [0.32, -0.58], [0.38, -0.74], [0.48, -0.82]] },
  ];
  for (const t of tails) {
    const n = t.pts.length;
    const pts = t.pts.map(([y, z], i) => V(t.x[0] + (t.x[1] - t.x[0]) * i / (n - 1), y, z));
    (t.x[1] === 0 ? C : S).push(plume(pts, t.w, 0.03));
  }
  // back feathers over the rump
  C.push(paint(fplate(V(0, 0.6, 0.0), V(0, -0.35, -1), V(0, 1, -0.3), 0.085, 0.18), P.orange, 'flat'));
  C.push(paint(fplate(V(0, 0.54, -0.13), V(0, -0.45, -1), V(0, 1, -0.4), 0.08, 0.17), P.red, 'flat'));
  S.push(paint(fplate(V(0.1, 0.56, -0.05), V(0.3, -0.45, -1), V(0.5, 1, -0.3), 0.07, 0.16), P.red, 'flat'));

  return assemble(C, S);
}

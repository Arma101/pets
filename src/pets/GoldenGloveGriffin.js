// Golden Glove Griffin (ROBUX EGG, Champion Egg): gold griffin, white wings, crown + floating halo,
// gold boxing gloves on the front talons, gold title belt, armour plates and bold bronze markings.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  body:     { i: 0, top: '#F6B32E', bot: '#A85A08' },   // warm lion-gold body
  head:     { i: 1, top: '#FFEA98', bot: '#F0BC40' },   // paler golden eagle feathers
  chest:    { i: 2, top: '#FFF6D2', bot: '#F4D27A' },   // light gold chest ruff
  white:    { i: 3, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:      { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  brow:     { i: 5, top: '#C9761A', bot: '#8A4A0C' },   // dark amber brow
  beak:     { i: 6, top: '#FFF6DE', bot: '#E3C78E' },   // ivory beak (contrasts with gold head)
  trophy:   { i: 7, top: '#FFF27A', bot: '#F0A500' },   // bright trophy gold accents
  bronze:   { i: 8, top: '#A8601A', bot: '#5E3008' },   // dark trim / markings
  wing:     { i: 9, top: '#FFFFFF', bot: '#EEE8DC' },   // white wings, cool shade
  wingEdge: { i: 10, top: '#FFFFFF', bot: '#F4EFE4' },
  strap:    { i: 11, top: '#D8283A', bot: '#8E0F1E' },   // red leather belt strap
  gem:      { i: 12, top: '#FF6B7A', bot: '#C0102A' },
  halo:     { i: 13, top: '#FFFDE6', bot: '#FFE45C', glow: true },
  glove:    { i: 14, top: '#FFE04A', bot: '#DE7A00' },   // boxing-glove gold (more orange)
  cuff:     { i: 15, top: '#FFFFFF', bot: '#ECE6DA' },
  crown:    { i: 19, top: '#FFE23A', bot: '#D98A00' },   // richer crown gold
  velvet:   { i: 20, top: '#9B3FD8', bot: '#5A1C8E' },   // purple crown band
  mouth:    { i: 16, top: '#6A3A1A', bot: '#3E1E10' },
  paw:      { i: 17, top: '#FFE9A8', bot: '#E2B04A' },
  gemBlue:  { i: 18, top: '#9FF7FF', bot: '#2FB8E8', glow: true },
};
const SW = PALETTE;

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const sub = (a, b) => a.clone().sub(b);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);

// flat feather blade: convex polygon prism lying in the plane spanned by dir and normal n
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

// faceted torus built from convex segments (closed, no holes)
function torus(c0, R, r, n, sides, tilt) {
  const q = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), tilt);
  const parts = [];
  const sec = (a) => {
    const dir = V(Math.cos(a), 0, Math.sin(a));
    const pts = [];
    for (let k = 0; k < sides; k++) {
      const b = (2 * Math.PI * k) / sides;
      pts.push(add(add(V(0, 0, 0), dir, R + Math.cos(b) * r), V(0, 1, 0), Math.sin(b) * r));
    }
    return pts;
  };
  for (let i = 0; i < n; i++) {
    const a0 = (2 * Math.PI * i) / n, a1 = (2 * Math.PI * (i + 1)) / n;
    const g = hull([...sec(a0), ...sec(a1)]);
    g.applyQuaternion(q); g.translate(c0.x, c0.y, c0.z);
    parts.push(g);
  }
  return parts;
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const body = (pts, lo = 0.06, hi = 0.6) => paint(hull(pts), SW.body, 'y', [lo, hi]);
  const tro = (g) => paint(g, SW.trophy, 'y');
  const troF = (g) => paint(g, SW.trophy, 'flat');
  const brz = (g) => paint(g, SW.bronze, 'flat');
  const chest = (g, lo, hi) => paint(g, SW.chest, lo === undefined ? 'flat' : 'y', lo === undefined ? null : [lo, hi]);

  // ================= LION BODY =================
  C.push(body([
    ...ring(V(0, 0.39, -0.5), 0.09, 0.09, 10, 'z'),
    ...ring(V(0, 0.38, -0.44), 0.16, 0.16, 10, 'z'),
    ...ring(V(0, 0.36, -0.28), 0.18, 0.17, 10, 'z'),
    ...ring(V(0, 0.35, -0.08), 0.175, 0.165, 10, 'z'),
    ...ring(V(0, 0.38, 0.1), 0.175, 0.17, 10, 'z'),
    ...ring(V(0, 0.42, 0.2), 0.13, 0.14, 10, 'z'),
  ]));

  // ================= GOLD TITLE BELT (red strap, big trophy-gold side plates) =================
  C.push(paint(hull([...ring(V(0, 0.352, -0.2), 0.2, 0.19, 10, 'z'), ...ring(V(0, 0.352, -0.04), 0.2, 0.19, 10, 'z')]),
    SW.strap, 'y', [0.17, 0.54]));
  // gold rim lines on the strap edges
  C.push(tro(hull([...ring(V(0, 0.352, -0.212), 0.206, 0.196, 10, 'z'), ...ring(V(0, 0.352, -0.194), 0.206, 0.196, 10, 'z')])));
  C.push(tro(hull([...ring(V(0, 0.352, -0.046), 0.206, 0.196, 10, 'z'), ...ring(V(0, 0.352, -0.028), 0.206, 0.196, 10, 'z')])));
  // big side plate (octagon) with bronze rim + red gem
  const BP = V(0.19, 0.355, -0.12);
  const oct = (r, ry) => Array.from({ length: 8 }, (_, k) => { const a = Math.PI / 8 + k * Math.PI / 4; return [Math.cos(a) * r, Math.sin(a) * ry]; });
  const sidePlate = (pts2, x0, x1) => {
    const out = [];
    for (const [u, v] of pts2) for (const x of [x0, x1]) out.push(V(x, BP.y + v, BP.z + u));
    return hull(out);
  };
  S.push(brz(sidePlate(oct(0.062, 0.095), 0.18, 0.215)));
  S.push(tro(sidePlate(oct(0.052, 0.083), 0.19, 0.232)));
  S.push(paint(hull([...ring(V(0.232, BP.y, BP.z), 0.022, 0.034, 6, 'x'), ...ring(V(0.232, BP.y, BP.z), 0.022, 0.034, 6, 'x').map(p => V(0.222, p.y, p.z)), V(0.252, BP.y, BP.z)]), SW.gem, 'y'));
  // small top plate on the spine
  C.push(tro(hull(cbox(V(0, 0.53, -0.12), 0.06, 0.012, 0.045, 0.015))));
  C.push(paint(hull(cbox(V(0, 0.545, -0.12), 0.022, 0.008, 0.018, 0.006)), SW.gemBlue, 'y'));

  // ================= BACK ARMOUR PLATES (segmented, bronze trim under gold) =================
  for (const [z, w] of [[-0.3, 0.12], [-0.4, 0.1]]) {
    C.push(brz(hull([...ring(V(0, 0.52, z), w + 0.012, 0.03, 8, 'z').filter(p => p.y > 0.5), V(w * 0.9, 0.46, z - 0.035), V(-w * 0.9, 0.46, z - 0.035), V(w * 0.9, 0.46, z + 0.035), V(-w * 0.9, 0.46, z + 0.035),
      ...ring(V(0, 0.54, z), w * 0.6, 0.02, 6, 'z').map(p => V(p.x, p.y, z - 0.04)), ...ring(V(0, 0.54, z), w * 0.6, 0.02, 6, 'z').map(p => V(p.x, p.y, z + 0.04))])));
    C.push(tro(hull([V(w * 0.85, 0.48, z - 0.03), V(-w * 0.85, 0.48, z - 0.03), V(w * 0.85, 0.48, z + 0.03), V(-w * 0.85, 0.48, z + 0.03),
      V(w * 0.5, 0.555, z - 0.032), V(-w * 0.5, 0.555, z - 0.032), V(w * 0.5, 0.555, z + 0.032), V(-w * 0.5, 0.555, z + 0.032),
      V(0, 0.575, z - 0.025), V(0, 0.575, z + 0.025)])));
  }

  // ================= BACK LEGS (gold haunch, bronze chevron markings, pale paws) =================
  S.push(paint(blob(1, V(0.145, 0.33, -0.33), V(0.1, 0.15, 0.16), { jitter: 0.12 }), SW.body, 'y', [0.06, 0.6]));
  S.push(body([...ring(V(0.16, 0.27, -0.32), 0.075, 0.085, 8), ...ring(V(0.17, 0.14, -0.37), 0.064, 0.064, 8),
    ...ring(V(0.172, 0.06, -0.35), 0.062, 0.062, 8)], 0.0, 0.6));
  // markings: bronze stripes wrapping the haunch
  for (const [y, z, l] of [[0.44, -0.25, 0.16], [0.37, -0.23, 0.17], [0.3, -0.24, 0.13]])
    S.push(brz(shard(V(0.24, y, z), V(-0.18, -0.4, -1), 0.036, l, 4, 0.35)));
  const paw = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.044, z - 0.005), 0.074, 0.044, 0.068, 0.022)), SW.paw, 'y', [0, 0.09]));
    for (const dx of [-0.047, 0, 0.047]) {
      S.push(paint(hull(cbox(V(x + dx, 0.035, z + 0.06), 0.025, 0.035, 0.032, 0.012)), SW.paw, 'y', [0, 0.09]));
      S.push(brz(shard(V(x + dx, 0.026, z + 0.088), V(0, -0.6, 1), 0.015, 0.04)));
    }
  };
  paw(0.173, -0.34);
  // gold hip armour plate
  S.push(tro(hull([V(0.2, 0.47, -0.36), V(0.2, 0.47, -0.24), V(0.25, 0.4, -0.38), V(0.25, 0.4, -0.22),
    V(0.215, 0.47, -0.36), V(0.215, 0.47, -0.24), V(0.265, 0.4, -0.38), V(0.265, 0.4, -0.22), V(0.26, 0.36, -0.3), V(0.245, 0.36, -0.3)])));

  // ================= TAIL (gold lion tail, bronze shard tuft) =================
  C.push(paint(tube(curveSamples(
    [V(0, 0.42, -0.48), V(0, 0.33, -0.6), V(0, 0.2, -0.7), V(0, 0.16, -0.83), V(0, 0.23, -0.94), V(0, 0.33, -0.98)],
    8, (t) => 0.04 - 0.012 * t), { seg: 6, axis: X, capEnd: 0.0, phase: Math.PI / 6 }), SW.body, 'len'));
  C.push(tro(hull([...ring(V(0, 0.31, -0.98), 0.036, 0.036, 8, 'y'), ...ring(V(0, 0.355, -0.98), 0.042, 0.042, 8, 'y')])));
  C.push(brz(shard(V(0, 0.37, -0.98), V(0, 1, 0), 0.05, 0.13)));
  C.push(brz(shard(V(0, 0.37, -0.99), V(0, 0.7, -0.6), 0.045, 0.1)));
  S.push(brz(shard(V(0.02, 0.365, -0.98), V(0.7, 0.8, 0), 0.042, 0.1)));
  S.push(brz(shard(V(0.02, 0.365, -0.97), V(0.4, 0.7, 0.5), 0.04, 0.09)));

  // ================= FEATHERED CHEST (light gold) =================
  C.push(paint(blob(1, V(0, 0.47, 0.25), V(0.17, 0.18, 0.14), { jitter: 0.15 }), SW.chest, 'y', [0.28, 0.66]));
  C.push(paint(hull([...ring(V(0, 0.48, 0.24), 0.14, 0.12, 10, 'y'), ...ring(V(0, 0.68, 0.3), 0.14, 0.13, 10, 'y')]), SW.head, 'y', [0.4, 0.8]));
  C.push(chest(shard(V(0, 0.32, 0.31), V(0, -1, 0.4), 0.065, 0.13)));
  C.push(chest(shard(V(0, 0.44, 0.37), V(0, -0.8, 1), 0.07, 0.1)));
  C.push(chest(shard(V(0, 0.56, 0.37), V(0, -0.5, 1), 0.07, 0.09)));
  for (const [b, d, w, l] of [
    [V(0.065, 0.32, 0.3), V(0.25, -1, 0.4), 0.058, 0.12],
    [V(0.07, 0.44, 0.36), V(0.35, -0.8, 1), 0.062, 0.095],
    [V(0.14, 0.46, 0.3), V(0.9, -0.7, 0.6), 0.058, 0.09],
    [V(0.075, 0.56, 0.36), V(0.45, -0.5, 1), 0.06, 0.08],
  ]) S.push(chest(shard(b, d, w, l)));
  // trophy-gold chest medallion (champion detail) with bronze rim
  C.push(brz(hull(plate(oct(0.05, 0.05), V(0, 0.5, 0), 0.38, 0.4))));
  C.push(tro(hull([...plate(oct(0.04, 0.04), V(0, 0.5, 0), 0.39, 0.41), V(0, 0.5, 0.425)])));

  // ================= FRONT LEGS (scaled gold legs, white cuffs, gold boxing gloves) =================
  S.push(body([...ring(V(0.13, 0.38, 0.2), 0.085, 0.09, 8), ...ring(V(0.14, 0.26, 0.23), 0.068, 0.07, 8),
    ...ring(V(0.15, 0.25, 0.262), 0.06, 0.06, 8)], 0.0, 0.6));
  // shoulder pauldron: layered armour plates with bronze underlayer
  const GX = 0.155, GZ = 0.27;
  const paul = (y, r, col) => hull([
    ...ring(V(0.175, y, 0.18), r, r * 0.95, 8, 'x').filter(p => p.y > y - r * 0.3),
    ...ring(V(0.175, y, 0.18), r, r * 0.95, 8, 'x').filter(p => p.y > y - r * 0.3).map(p => V(0.228 + (p.y - y) * -0.3, p.y - 0.012, p.z)),
  ]);
  S.push(brz(paul(0.4, 0.125)));
  S.push(paint(paul(0.418, 0.108), SW.trophy, 'y'));
  S.push(paint(hull([...ring(V(0.245, 0.44, 0.18), 0.012, 0.012, 6, 'x'), V(0.262, 0.44, 0.18), ...ring(V(0.232, 0.44, 0.18), 0.02, 0.02, 6, 'x')]), SW.gem, 'y'));
  // the glove: big puffy mitt, flat on the ground, rounded fist forward
  const gl = (pts) => paint(hull(pts), SW.glove, 'y', [0, 0.22]);
  const GC = GZ + 0.03;
  S.push(gl([
    ...ring(V(GX, 0.0, GC), 0.085, 0.1, 10, 'y'),
    ...ring(V(GX, 0.03, GC), 0.115, 0.13, 10, 'y'),
    ...ring(V(GX, 0.09, GC + 0.005), 0.122, 0.142, 10, 'y'),
    ...ring(V(GX, 0.15, GC), 0.105, 0.125, 10, 'y'),
    ...ring(V(GX, 0.2, GC - 0.015), 0.072, 0.088, 8, 'y'),
    V(GX, 0.1, GC + 0.165), V(GX + 0.07, 0.09, GC + 0.15), V(GX - 0.07, 0.09, GC + 0.15),
  ]));
  // thumb bulge on the inner side, running up the front
  S.push(gl([...cbox(V(GX - 0.1, 0.12, GC + 0.055), 0.04, 0.048, 0.055, 0.02), V(GX - 0.088, 0.17, GC + 0.1), V(GX - 0.095, 0.09, GC + 0.125)]));
  // padded white cuff with a dark lace stripe and bronze rim
  const CZc = GZ - 0.005;
  S.push(paint(hull([...ring(V(GX, 0.18, CZc), 0.088, 0.09, 8, 'y'), ...ring(V(GX, 0.225, CZc), 0.095, 0.097, 8, 'y'), ...ring(V(GX, 0.27, CZc), 0.085, 0.087, 8, 'y')]), SW.cuff, 'y'));
  S.push(brz(hull([...ring(V(GX, 0.262, CZc), 0.09, 0.092, 8, 'y'), ...ring(V(GX, 0.282, CZc), 0.086, 0.088, 8, 'y')])));
  S.push(paint(hull(cbox(V(GX, 0.225, CZc + 0.095), 0.018, 0.04, 0.012, 0.005)), SW.strap, 'y'));
  // hind talon spur so it still reads as a planted foot
  S.push(brz(shard(V(GX, 0.035, GC - 0.12), V(0, -0.5, -1), 0.018, 0.06)));

  // ================= HEAD (gold eagle) =================
  const hc0 = C.length, hs0 = S.length;
  const H = { y: 0.8, z: 0.33 };
  C.push(paint(hull([
    ...cbox(V(0, H.y, H.z), 0.16, 0.145, 0.15, 0.065),
    ...ring(V(0, H.y + 0.17, H.z - 0.01), 0.11, 0.1, 8, 'y'),
    V(0.185, H.y - 0.07, H.z - 0.02), V(-0.185, H.y - 0.07, H.z - 0.02),
  ]), SW.head, 'y', [0.62, 0.98]));
  const FZ = H.z + 0.15;

  // feather mane: layered kite blades sweeping back (gold over darker body gold)
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
  mane(5, -1.0, 1.25, 0.15, H.z + 0.02, 1.6, 0.13, 0.085, SW.head, 0.0);
  mane(5, -1.2, 1.35, 0.15, H.z - 0.07, 1.3, 0.17, 0.095, SW.chest, 0.012);
  mane(3, -0.9, 1.05, 0.12, H.z - 0.14, 1.5, 0.17, 0.1, SW.body, 0.02);
  C.push(paint(shard(V(0, H.y + 0.12, H.z - 0.11), V(0, 0.5, -1), 0.055, 0.14), SW.body, 'flat'));
  S.push(paint(shard(V(0.16, H.y - 0.06, H.z + 0.04), V(1, -0.5, -0.2), 0.05, 0.09), SW.head, 'flat'));
  S.push(paint(shard(V(0.14, H.y - 0.115, H.z + 0.06), V(0.6, -1, -0.1), 0.05, 0.09), SW.chest, 'flat'));
  // bold bronze marking: swept stripe from the eye corner back along the cheek
  S.push(brz(hull([V(0.14, H.y + 0.03, FZ - 0.03), V(0.165, H.y + 0.04, FZ - 0.06), V(0.172, H.y - 0.02, FZ - 0.15),
    V(0.165, H.y - 0.06, FZ - 0.15), V(0.145, H.y + 0.0, FZ - 0.05), V(0.15, H.y + 0.03, FZ - 0.08)])));
  // beak: big ivory hook
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
  ]), SW.paw, 'flat'));
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
  // heavy dark-amber brow slanting down toward the beak
  S.push(paint(hull([
    V(0.025, E.y + 0.01, FZ + 0.03), V(0.028, E.y + 0.05, FZ + 0.018),
    V(0.165, E.y + 0.06, FZ - 0.045), V(0.165, E.y + 0.1, FZ - 0.06),
    V(0.025, E.y + 0.01, FZ - 0.03), V(0.028, E.y + 0.06, FZ - 0.04),
    V(0.165, E.y + 0.06, FZ - 0.1), V(0.165, E.y + 0.1, FZ - 0.11),
  ]), SW.brow, 'y'));

  // crown: bronze band base, trophy-gold band + 5 points, red gems
  const CY = H.y + 0.13, CZ = H.z - 0.01;
  const crw = (g) => paint(g, SW.crown, 'y');
  C.push(paint(hull([...ring(V(0, CY - 0.03, CZ), 0.118, 0.108, 10, 'y'), ...ring(V(0, CY - 0.005, CZ), 0.128, 0.118, 10, 'y')]), SW.velvet, 'y'));
  C.push(brz(hull([...ring(V(0, CY - 0.008, CZ), 0.132, 0.122, 10, 'y'), ...ring(V(0, CY + 0.014, CZ), 0.136, 0.126, 10, 'y')])));
  C.push(crw(hull([...ring(V(0, CY + 0.012, CZ), 0.13, 0.12, 10, 'y'), ...ring(V(0, CY + 0.06, CZ), 0.14, 0.13, 10, 'y')])));
  C.push(paint(hull(ring(V(0, CY + 0.07, CZ), 0.11, 0.1, 8, 'y').concat([V(0, CY + 0.11, CZ)])), SW.velvet, 'y'));
  C.push(crw(shard(V(0, CY + 0.05, CZ + 0.115), V(0, 1, 0.15), 0.042, 0.12)));
  S.push(crw(shard(V(0.09, CY + 0.05, CZ + 0.082), V(0.25, 1, 0.15), 0.036, 0.1)));
  S.push(crw(shard(V(0.125, CY + 0.05, CZ - 0.025), V(0.3, 1, -0.1), 0.034, 0.09)));
  C.push(crw(shard(V(0, CY + 0.05, CZ - 0.115), V(0, 1, -0.15), 0.036, 0.09)));
  C.push(paint(hull([V(0.024, CY + 0.036, CZ + 0.136), V(-0.024, CY + 0.036, CZ + 0.136), V(0, CY + 0.062, CZ + 0.138), V(0, CY + 0.01, CZ + 0.136),
    V(0, CY + 0.036, CZ + 0.158)]), SW.gem, 'y'));
  S.push(paint(hull([V(0.096, CY + 0.035, CZ + 0.1), V(0.074, CY + 0.035, CZ + 0.116), V(0.087, CY + 0.054, CZ + 0.108), V(0.087, CY + 0.016, CZ + 0.108),
    V(0.098, CY + 0.035, CZ + 0.127)]), SW.gemBlue, 'y'));

  // scale the whole head up about the neck for the big-head look
  const HS = 1.16, piv = V(0, 0.6, 0.3);
  for (const g of [...C.slice(hc0), ...S.slice(hs0)]) {
    g.translate(-piv.x, -piv.y, -piv.z); g.scale(HS, HS, HS); g.translate(piv.x, piv.y, piv.z);
  }

  // ================= HALO (floating close above the crown, tilted back) =================
  const hy = piv.y + (CY + 0.2 - piv.y) * HS, hz = piv.z + (CZ - 0.04 - piv.z) * HS;
  for (const g of torus(V(0, hy, hz), 0.15, 0.021, 10, 4, -0.28)) C.push(paint(g, SW.halo, 'y'));

  // ================= WINGS (white, raised & spread) =================
  const SH = V(0.15, 0.56, 0.0), WR = V(0.45, 0.98, -0.12), TP = V(0.64, 1.1, -0.72);
  const armDir = nrm(sub(WR, SH));
  const wingN = (dir) => { const n = nrm(cross(armDir, dir)); if (n.x < 0) n.multiplyScalar(-1); return n; };
  const edgePts = [SH, add(SH, sub(WR, SH), 0.5), WR, add(WR, V(0.06, 0.07, -0.25), 1), TP];
  // white leading edge with a thin trophy-gold trim
  S.push(paint(tube(curveSamples(edgePts, 10, (t) => 0.05 - 0.02 * t, (t) => 0.038 - 0.012 * t),
    { seg: 6, ref: V(1, 0, 0.2), capEnd: 0.035, capStart: 0.01 }), SW.wingEdge, 'y'));
  S.push(tro(tube(curveSamples(edgePts.map(p => add(p, V(0, 0.03, 0.005))), 10, (t) => 0.022 - 0.008 * t, (t) => 0.02 - 0.008 * t),
    { seg: 5, ref: V(1, 0, 0.2), capEnd: 0.02, capStart: 0.0 })));
  const NF = 7;
  for (let i = 0; i < NF; i++) {
    const t = 0.1 + 0.9 * i / (NF - 1);
    const p = add(SH, sub(WR, SH), t);
    const ang = -0.75 + 0.62 * t;
    const dir = nrm(V(0.42, Math.sin(ang), -Math.cos(ang)));
    const n = wingN(dir);
    const k = NF - i;
    const L = 0.26 + 0.36 * Math.pow(t, 1.2);
    S.push(paint(blade(add(p, n, -0.014 + k * 0.005), dir, n, L, 0.13), SW.wing, 'flat'));
    S.push(paint(blade(add(add(p, n, 0.016 + k * 0.005), dir, 0.01), dir, n, L * 0.58, 0.12), SW.wing, 'y'));
  }
  for (let i = 0; i < 3; i++) {
    const t = 0.15 + i * 0.3;
    const p = add(WR, sub(TP, WR), t);
    const dir = nrm(V(0.35, -0.5 - 0.2 * i, -1));
    const n = wingN(V(0.35, -0.3, -1));
    S.push(paint(blade(add(p, n, -0.02 - i * 0.005), dir, n, 0.3 - i * 0.05, 0.12), SW.wing, 'flat'));
  }
  // white coverts along the upper edge
  const edge = new THREE.CatmullRomCurve3(edgePts, false, 'centripetal');
  const NC = 6;
  for (let i = 0; i < NC; i++) {
    const t = 0.2 + 0.72 * i / (NC - 1);
    const p = edge.getPoint(t);
    const dir = nrm(V(0.38, -0.45 - 0.35 * Math.max(0, t - 0.55), -1));
    const n = wingN(V(0.38, -0.3, -1));
    S.push(paint(blade(add(p, n, 0.04 + i * 0.005), dir, n, 0.17 + 0.04 * t, 0.08,
      0.016, [[0, -0.4], [0, 0.4], [0.2, 0.5], [0.75, 0.5], [1, 0], [0.75, -0.5], [0.2, -0.5]]), SW.wingEdge, 'flat'));
  }

  return assemble(C, S);
}

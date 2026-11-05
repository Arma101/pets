// Gym Bull: stocky charcoal bull with a shard mane, huge cream-gold horns and gold trim.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  body:    { i: 0, top: '#625D6A', bot: '#36333D' },
  mane:    { i: 1, top: '#55505D', bot: '#2C2A31' },
  horn:    { i: 2, top: '#E9BE5E', bot: '#FFEDB4' }, // 'len': base gold -> pale cream tip
  gold:    { i: 3, top: '#FFD95A', bot: '#D69A1E' },
  muzzle:  { i: 4, top: '#F8D898', bot: '#D9A65A' },
  hoof:    { i: 5, top: '#FCE6AE', bot: '#D7AA5E' },
  white:   { i: 6, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:     { i: 7, top: '#1A1416', bot: '#0C0A0B' },
  brow:    { i: 8, top: '#6E6977', bot: '#3A3740' },
  nostril: { i: 9, top: '#5A3A26', bot: '#3A2416' },
  dark:    { i: 10, top: '#46424D', bot: '#25232A' },
  tail:    { i: 11, top: '#4E4A56', bot: '#3A3741' },
};
const SW = PALETTE;

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const body = (pts, lo = 0.1, hi = 0.75) => paint(hull(pts), SW.body, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= BODY (heavy front, hump at shoulders, smaller hips) =================
  C.push(body([
    ...ring(V(0, 0.4, -0.45), 0.12, 0.11, 10, 'z'),
    ...ring(V(0, 0.4, -0.38), 0.2, 0.17, 10, 'z'),
    ...ring(V(0, 0.4, -0.2), 0.22, 0.18, 10, 'z'),
    ...ring(V(0, 0.42, 0.0), 0.26, 0.22, 10, 'z'),
    ...ring(V(0, 0.44, 0.16), 0.27, 0.23, 10, 'z'),
    ...ring(V(0, 0.45, 0.27), 0.21, 0.19, 10, 'z'),
  ], 0.18, 0.7));
  // shoulder hump
  C.push(body([...cbox(V(0, 0.6, 0.1), 0.18, 0.08, 0.17, 0.05)], 0.3, 0.72));
  // neck block joining head
  C.push(body([...ring(V(0, 0.46, 0.25), 0.18, 0.18, 8, 'z'), ...ring(V(0, 0.48, 0.38), 0.16, 0.16, 8, 'z')], 0.3, 0.72));

  // ================= LEGS (short, thick, faceted) =================
  // front leg: big shoulder + thick column
  S.push(paint(blob(0, V(0.2, 0.4, 0.15), V(0.12, 0.15, 0.14), { jitter: 0.1 }), SW.body, 'y', [0.08, 0.7]));
  S.push(body([...ring(V(0.215, 0.08, 0.18), 0.08, 0.082, 8), ...ring(V(0.218, 0.22, 0.17), 0.108, 0.105, 8),
    ...ring(V(0.195, 0.34, 0.14), 0.115, 0.12, 8)], 0.04, 0.7));
  // back leg: thigh + shin
  S.push(paint(blob(1, V(0.165, 0.37, -0.29), V(0.11, 0.15, 0.14), { jitter: 0.12 }), SW.body, 'y', [0.08, 0.7]));
  S.push(body([...ring(V(0.175, 0.31, -0.28), 0.095, 0.1, 8), ...ring(V(0.188, 0.18, -0.335), 0.09, 0.09, 8),
    ...ring(V(0.185, 0.08, -0.31), 0.078, 0.078, 8)], 0.04, 0.7));
  // cloven cream hooves with a gold cuff
  const hoof = (x, z) => {
    for (const dx of [-0.043, 0.043])
      S.push(paint(hull([...cbox(V(x + dx, 0.04, z + 0.01), 0.042, 0.04, 0.068, 0.016),
        V(x + dx, 0.0, z + 0.085), V(x + dx, 0.055, z + 0.08)]), SW.hoof, 'y', [0, 0.09]));
    S.push(paint(hull(ring(V(x, 0.085, z), 0.096, 0.094, 8, 'y').concat(ring(V(x, 0.11, z), 0.092, 0.09, 8, 'y'))), SW.hoof, 'y', [0.06, 0.13]));
  };
  hoof(0.215, 0.18);
  hoof(0.185, -0.31);

  // ================= MANE (layered dark shards over neck, shoulders, chest) =================
  const maneSh = (b, d, w, l, fl = 0.55) => paint(shard(b, d, w, l, 4, fl), SW.mane, 'y', [0.2, 0.85]);
  // mane mass: a shaggy hump wrapping the neck and shoulders
  C.push(paint(hull([
    ...ring(V(0, 0.5, 0.33), 0.2, 0.22, 10, 'z', Math.PI / 10),
    ...ring(V(0, 0.5, 0.16), 0.26, 0.255, 10, 'z', 0),
    ...ring(V(0, 0.47, -0.03), 0.23, 0.21, 10, 'z', Math.PI / 10),
  ]), SW.mane, 'y', [0.25, 0.8]));
  // rows of shards on the mane, each row further back, all sweeping back and down
  for (const [z, cy, rx, ry, w, l, degs] of [
    [0.31, 0.5, 0.2, 0.23, 0.1, 0.15, [60, 28, -4, -36]],
    [0.18, 0.5, 0.26, 0.26, 0.11, 0.17, [90, 74, 44, 14, -18]],
    [0.04, 0.47, 0.24, 0.22, 0.1, 0.16, [90, 58, 28, -4, -36]],
    [-0.09, 0.45, 0.21, 0.2, 0.085, 0.13, [74, 42, 10]],
  ]) {
    for (const deg of degs) {
      const th = (deg * Math.PI) / 180;
      const n = V(Math.cos(th), Math.sin(th), 0);
      const base = V(n.x * rx, cy + n.y * ry, z);
      const lift = deg >= 70 ? 0.55 : deg >= 40 ? 0.25 : 0;
      const dir = n.clone().multiplyScalar(0.55).add(V(0, lift - 0.2 - 0.6 * (1 - Math.sin(th)) / 2, -1));
      const g = maneSh(base, dir, w, l, 0.8);
      if (deg === 90) C.push(g); else S.push(g);
    }
  }
  // shaggy chest / dewlap under the head
  C.push(maneSh(V(0, 0.36, 0.42), V(0, -1, 0.25), 0.08, 0.13, 0.7));
  S.push(maneSh(V(0.09, 0.36, 0.4), V(0.35, -1, 0.2), 0.075, 0.12, 0.7));
  S.push(maneSh(V(0.17, 0.38, 0.34), V(0.6, -1, 0.0), 0.075, 0.12, 0.7));
  // shoulder tufts hanging over the front legs
  S.push(maneSh(V(0.27, 0.4, 0.14), V(0.4, -1, -0.3), 0.08, 0.13, 0.6));
  S.push(maneSh(V(0.27, 0.42, 0.02), V(0.4, -1, -0.6), 0.075, 0.12, 0.6));

  // gold shoulder trim pieces at the back edge of the mane
  S.push(paint(shard(V(0.15, 0.64, -0.08), V(0.45, 0.1, -1), 0.07, 0.11, 4, 0.45), SW.gold, 'y', [0.58, 0.72]));
  S.push(paint(shard(V(0.235, 0.53, -0.09), V(0.7, -0.3, -1), 0.06, 0.1, 4, 0.45), SW.gold, 'y', [0.48, 0.64]));

  // ================= HEAD (big, boxy, low and forward) =================
  const H = { y: 0.56, z: 0.42 };
  C.push(body([
    ...cbox(V(0, H.y, H.z), 0.19, 0.16, 0.17, 0.055),
    ...ring(V(0, H.y + 0.18, H.z - 0.01), 0.14, 0.11, 8, 'y'),
  ], 0.4, 0.8));
  const FZ = H.z + 0.17;

  // big boxy cream muzzle
  C.push(paint(hull([...cbox(V(0, H.y - 0.085, FZ + 0.04), 0.145, 0.08, 0.07, 0.03),
    V(0.1, H.y + 0.0, FZ - 0.02), V(-0.1, H.y + 0.0, FZ - 0.02)]), SW.muzzle, 'y', [H.y - 0.16, H.y]));
  // nostrils
  S.push(flat(hull(plate([[-0.022, 0.008], [-0.008, 0.018], [0.018, 0.016], [0.026, 0.0], [0.016, -0.016], [-0.016, -0.016]],
    V(0.062, H.y - 0.07, 0), FZ + 0.1, FZ + 0.115)), SW.nostril));
  // frown mouth line
  C.push(flat(hull(cbox(V(0, H.y - 0.135, FZ + 0.111), 0.04, 0.006, 0.004, 0.002)), SW.nostril));

  // fierce eyes (scaled-up punch_pup eye block)
  const E = V(0.102, H.y + 0.05, 0), k = 1.28;
  const sc = (pts) => pts.map(([u, v]) => [u * k, v * k]);
  S.push(flat(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.01, FZ + 0.012)), SW.white));
  S.push(flat(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.006, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye));
  S.push(flat(hull(plate([[-0.009, -0.009], [0.009, -0.009], [0.009, 0.009], [-0.009, 0.009]],
    V(E.x + 0.006, E.y + 0.004, 0), FZ + 0.014, FZ + 0.022)), SW.white));
  // heavy brow, slanting down toward the centre
  S.push(paint(hull([
    V(0.02, E.y + 0.012, FZ + 0.045), V(0.022, E.y + 0.058, FZ + 0.03),
    V(0.185, E.y + 0.07, FZ + 0.0), V(0.185, E.y + 0.112, FZ - 0.02),
    V(0.02, E.y + 0.012, FZ - 0.03), V(0.022, E.y + 0.07, FZ - 0.04),
    V(0.185, E.y + 0.07, FZ - 0.06), V(0.185, E.y + 0.112, FZ - 0.07),
  ]), SW.brow, 'y'));

  // ears: dark flaps sticking out sideways below the horns
  S.push(paint(hull([V(0.17, H.y + 0.06, H.z - 0.0), V(0.17, H.y - 0.01, H.z - 0.03), V(0.17, H.y + 0.05, H.z - 0.09),
    V(0.33, H.y - 0.01, H.z - 0.04), V(0.33, H.y + 0.02, H.z - 0.02), V(0.3, H.y + 0.03, H.z - 0.06)]), SW.dark, 'flat'));

  // ================= HORNS (huge, out then up) =================
  S.push(paint(tube(curveSamples(
    [V(0.14, H.y + 0.13, H.z - 0.02), V(0.28, H.y + 0.15, H.z - 0.01), V(0.4, H.y + 0.2, H.z + 0.0), V(0.45, H.y + 0.3, H.z + 0.0),
      V(0.45, H.y + 0.42, H.z + 0.02), V(0.42, H.y + 0.5, H.z + 0.05)],
    8, (t) => 0.096 - 0.074 * Math.pow(t, 0.85), (t) => 0.088 - 0.068 * Math.pow(t, 0.85)),
    { seg: 6, axis: V(0, 0, 1), capStart: 0, capEnd: 0.04, phase: Math.PI / 6 }), SW.horn, 'len'));
  // gold horn-base band
  S.push(paint(hull([...ring(V(0.15, H.y + 0.13, H.z - 0.02), 0.095, 0.095, 6, 'x', 0),
    ...ring(V(0.21, H.y + 0.14, H.z - 0.02), 0.095, 0.095, 6, 'x', 0)]), SW.gold, 'y'));
  // gold crown: band across the top of the head with three short gold shards
  C.push(paint(hull([...cbox(V(0, H.y + 0.175, H.z - 0.01), 0.13, 0.03, 0.09, 0.022)]), SW.gold, 'y', [H.y + 0.14, H.y + 0.21]));
  C.push(paint(shard(V(0, H.y + 0.2, H.z + 0.0), V(0, 1, -0.5), 0.05, 0.08, 4, 0.6), SW.gold, 'y', [H.y + 0.17, H.y + 0.3]));
  S.push(paint(shard(V(0.075, H.y + 0.195, H.z - 0.02), V(0.4, 1, -0.6), 0.045, 0.07, 4, 0.6), SW.gold, 'y', [H.y + 0.17, H.y + 0.3]));

  // ================= TAIL (rope curling up, dark faceted tuft) =================
  C.push(paint(tube(curveSamples(
    [V(0, 0.48, -0.43), V(0, 0.45, -0.57), V(0, 0.5, -0.69), V(0, 0.62, -0.73), V(0, 0.71, -0.68)],
    7, (t) => 0.032 - 0.01 * t),
    { seg: 6, axis: X }), SW.tail, 'y', [0.4, 0.9]));
  // tuft: big faceted spade with side flicks
  const T = V(0, 0.71, -0.68);
  const tp = (x, y, z) => V(T.x + x, T.y + y, T.z + z);
  C.push(paint(hull([tp(0, -0.04, -0.01), ...ring(tp(0, 0.07, 0.02), 0.055, 0.075, 6, 'y', 0), tp(0, 0.2, 0.06),
    tp(0, 0.13, 0.1), tp(0, 0.12, -0.06)]), SW.dark, 'y', [T.y - 0.05, T.y + 0.2]));
  S.push(paint(shard(tp(0.03, 0.06, 0.02), V(0.8, 0.6, 0), 0.03, 0.085, 4, 0.6), SW.dark, 'y', [T.y - 0.05, T.y + 0.2]));
  C.push(paint(shard(tp(0, 0.06, -0.02), V(0, 0.4, -1), 0.035, 0.09, 4, 0.6), SW.dark, 'y', [T.y - 0.05, T.y + 0.2]));

  return assemble(C, S);
}

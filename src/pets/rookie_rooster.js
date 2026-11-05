// Rookie Rooster: chunky faceted white rooster with red comb, teal sickle tail, gold legs.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  white:  { i: 0, top: '#FFFFFF', bot: '#E6DDD3' },
  feath:  { i: 1, top: '#FBF8F4', bot: '#DCD1C5' },
  red:    { i: 2, top: '#F23A2E', bot: '#B8121A' },
  beak:   { i: 3, top: '#FFD43C', bot: '#F0951A' },
  leg:    { i: 4, top: '#FFCE33', bot: '#E39A10' },
  claw:   { i: 5, top: '#F4B21E', bot: '#C47A0A' },
  teal:   { i: 6, top: '#2DC4AA', bot: '#0A7C72' },
  tealD:  { i: 7, top: '#20A898', bot: '#06615A' },
  eye:    { i: 8, top: '#1A1416', bot: '#0C0A0B' },
  eyeW:   { i: 9, top: '#FFFFFF', bot: '#F1F1F4' },
  brow:   { i: 10, top: '#FFFFFF', bot: '#DDD3C8' },
  wingD:  { i: 11, top: '#E8E0D6', bot: '#CFC3B6' },
};
const P = PALETTE;

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const wh = (g, lo, hi) => paint(g, P.white, 'y', lo === undefined ? null : [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');
  const fe = (b, d, w, l, fl = 0.55) => paint(shard(b, d, w, l, 4, fl), P.feath, 'flat');
  // flat faceted feather blade: base b, direction d, outward normal n, half-width w, length l, thickness th
  const fplate = (b, d, n, w, l, th = 0.014, sw = P.feath, mode = 'flat') => {
    d = d.clone().normalize(); n = n.clone().normalize();
    const sd = new THREE.Vector3().crossVectors(d, n).normalize();
    n = new THREE.Vector3().crossVectors(sd, d).normalize();
    const pts = [];
    const at = (u, v, h) => b.clone().addScaledVector(d, u).addScaledVector(sd, v).addScaledVector(n, h);
    for (const h of [-th, th * 0.3]) {
      pts.push(at(0, w * 0.8, h), at(0, -w * 0.8, h), at(l * 0.3, w, h * 0.8), at(l * 0.3, -w, h * 0.8));
    }
    pts.push(at(l, 0, -th * 0.3), at(l * 0.3, 0, th * 1.1), at(0, 0, th * 1.0));
    return paint(hull(pts), sw, mode);
  };

  // ================= BODY (round egg, chest puffed forward/up, rump back) =================
  C.push(wh(hull([
    ...ring(V(0, 0.34, -0.25), 0.09, 0.08, 10, 'z'),
    ...ring(V(0, 0.36, -0.16), 0.17, 0.15, 10, 'z'),
    ...ring(V(0, 0.38, -0.04), 0.205, 0.17, 10, 'z'),
    ...ring(V(0, 0.42, 0.08), 0.2, 0.18, 10, 'z'),
    ...ring(V(0, 0.48, 0.16), 0.16, 0.16, 10, 'z'),
    ...ring(V(0, 0.54, 0.2), 0.1, 0.1, 10, 'z'),
  ]), 0.18, 0.66));
  // neck
  C.push(wh(hull([...ring(V(0, 0.5, 0.07), 0.15, 0.14, 8, 'y'), ...ring(V(0, 0.68, 0.1), 0.135, 0.13, 8, 'y')]), 0.4, 0.85));

  // chest feather plates (big overlapping rows fanning down)
  for (const [y, z, w, l] of [[0.63, 0.24, 0.075, 0.13], [0.5, 0.235, 0.08, 0.14], [0.37, 0.21, 0.075, 0.14]]) {
    C.push(fplate(V(0, y, z), V(0, -1, 0.3), V(0, 0.25, 1), w, l, 0.012));
    for (const [x, dz] of [[0.095, -0.035], [0.165, -0.1]]) {
      if (y > 0.6 && x > 0.1) continue;
      S.push(fplate(V(x, y - 0.025, z + dz), V(x * 1.5, -1, 0.25), V(x * 6, 0.25, 1), w, l, 0.012));
    }
  }
  S.push(fplate(V(0.12, 0.27, 0.13), V(0.3, -1, 0.2), V(0.7, 0.1, 0.8), 0.06, 0.11, 0.012));
  // neck hackles: plates draping from the nape over the shoulders
  C.push(fplate(V(0, 0.7, -0.03), V(0, -1, -0.45), V(0, 0.1, -1), 0.08, 0.17, 0.012));
  for (const [x, z, n] of [[0.08, -0.0, V(0.6, 0.1, -0.8)], [0.13, 0.07, V(1, 0.1, -0.2)], [0.12, 0.15, V(1, 0.1, 0.5)]])
    S.push(fplate(V(x, 0.7, z), V(n.x * 0.3, -1, n.z * 0.4), n, 0.075, 0.17, 0.012));

  // back saddle feathers sweeping toward the tail
  C.push(fplate(V(0, 0.6, 0.02), V(0, -0.35, -1), V(0, 1, -0.3), 0.08, 0.17, 0.012));
  C.push(fplate(V(0, 0.55, -0.1), V(0, -0.45, -1), V(0, 1, -0.4), 0.075, 0.16, 0.012));
  S.push(fplate(V(0.09, 0.58, 0.0), V(0.3, -0.45, -1), V(0.5, 1, -0.3), 0.07, 0.16, 0.012));
  S.push(fplate(V(0.08, 0.53, -0.12), V(0.3, -0.55, -1), V(0.5, 1, -0.4), 0.065, 0.15, 0.012));
  S.push(fplate(V(0.06, 0.71, 0.0), V(0.3, -1, -0.5), V(0.4, 0.1, -1), 0.07, 0.16, 0.012));

  // ================= HEAD =================
  const H = { y: 0.79, z: 0.12 };
  C.push(wh(hull([
    ...cbox(V(0, H.y, H.z), 0.16, 0.14, 0.14, 0.075),
    ...ring(V(0, H.y + 0.15, H.z - 0.01), 0.09, 0.08, 8, 'y'),
    V(0.155, H.y - 0.08, H.z + 0.02), V(-0.155, H.y - 0.08, H.z + 0.02),
  ]), 0.62, 1.0));
  const FZ = H.z + 0.14;
  // cheek / nape feather plates (flared, layered back and down)
  S.push(fplate(V(0.15, H.y - 0.05, H.z + 0.06), V(0.5, -0.8, -0.5), V(1, 0, 0.3), 0.05, 0.1, 0.012));
  S.push(fplate(V(0.15, H.y - 0.02, H.z - 0.04), V(0.4, -0.5, -1), V(1, 0.2, -0.2), 0.055, 0.11, 0.012));
  S.push(fplate(V(0.13, H.y - 0.1, H.z - 0.06), V(0.4, -1, -0.5), V(1, 0, -0.3), 0.055, 0.11, 0.012));
  S.push(fplate(V(0.09, H.y + 0.04, H.z - 0.13), V(0.3, -0.5, -1), V(0.5, 0.3, -1), 0.06, 0.1, 0.012));
  C.push(fplate(V(0, H.y + 0.0, H.z - 0.14), V(0, -0.6, -1), V(0, 0.3, -1), 0.065, 0.11, 0.012));

  // beak: chunky, slightly hooked
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.05, FZ + 0.005), 0.07, 0.045, 0.02, 0.014),
    V(0.032, H.y - 0.025, FZ + 0.08), V(-0.032, H.y - 0.025, FZ + 0.08),
    V(0, H.y - 0.1, FZ + 0.165), V(0.014, H.y - 0.075, FZ + 0.15), V(-0.014, H.y - 0.075, FZ + 0.15),
    V(0.03, H.y - 0.085, FZ + 0.07), V(-0.03, H.y - 0.085, FZ + 0.07),
  ]), P.beak, 'y', [H.y - 0.1, H.y + 0.0]));
  // lower mandible (darker, tucked under)
  C.push(paint(hull([...cbox(V(0, H.y - 0.098, FZ + 0.02), 0.045, 0.016, 0.02, 0.007),
    V(0, H.y - 0.104, FZ + 0.1), V(0.012, H.y - 0.096, FZ + 0.09), V(-0.012, H.y - 0.096, FZ + 0.09)]), P.claw, 'flat'));
  // wattle (two hanging lobes)
  S.push(paint(hull([
    ...ring(V(0.022, H.y - 0.11, FZ + 0.03), 0.028, 0.025, 6, 'y'),
    ...ring(V(0.03, H.y - 0.175, FZ + 0.04), 0.036, 0.034, 6, 'y'),
    V(0.024, H.y - 0.23, FZ + 0.035),
  ]), P.red, 'y', [H.y - 0.23, H.y - 0.09]));

  // comb: big chunky lobes fanning up and back
  for (const [z, y, dz, len, w] of [
    [0.1, 0.09, 0.9, 0.13, 0.045],
    [0.06, 0.11, 0.35, 0.18, 0.05],
    [0.0, 0.12, -0.05, 0.22, 0.055],
    [-0.06, 0.11, -0.5, 0.2, 0.055],
    [-0.11, 0.08, -1.1, 0.16, 0.05],
  ]) {
    const d = V(0, 1, dz).normalize(), b = V(0, H.y + y, H.z + z);
    const side = V(0, -d.z, d.y);
    const tip = b.clone().addScaledVector(d, len);
    C.push(paint(hull([
      ...[-1, 1].flatMap((sx) => [
        V(sx * 0.05, b.y, b.z).addScaledVector(side, w), V(sx * 0.05, b.y, b.z).addScaledVector(side, -w),
        V(sx * 0.045, 0, 0).add(b).addScaledVector(d, len * 0.65).addScaledVector(side, w * 0.9),
        V(sx * 0.045, 0, 0).add(b).addScaledVector(d, len * 0.65).addScaledVector(side, -w * 0.7),
        V(sx * 0.022, tip.y, tip.z),
      ]),
    ]), P.red, 'y', [H.y + 0.1, H.y + 0.34]));
  }
  C.push(paint(hull(cbox(V(0, H.y + 0.135, H.z - 0.0), 0.042, 0.03, 0.11, 0.015)), P.red, 'flat'));

  for (const [z, y, dz, len] of [[0.04, 0.1, 0.25, 0.15], [-0.05, 0.1, -0.55, 0.15]])
    S.push(paint(shard(V(0.028, H.y + y, H.z + z), V(0.28, 1, dz), 0.055, len, 4, 0.75), P.red, 'y', [H.y + 0.1, H.y + 0.3]));
  // eyes
  const E = V(0.084, H.y + 0.04, 0), ek = 1.2;
  const K = (a) => a.map(([u, v]) => [u * ek, v * ek]);
  S.push(flat(hull(plate(K([[-0.036, 0.004], [0.04, 0.03], [0.045, -0.01], [0.018, -0.036], [-0.026, -0.032], [-0.04, -0.014]]),
    E, FZ - 0.01, FZ + 0.01)), P.eyeW));
  S.push(flat(hull(plate(K([[-0.022, 0.004], [0.011, 0.016], [0.017, -0.007], [0.004, -0.024], [-0.016, -0.022], [-0.025, -0.009]]),
    V(E.x - 0.008, E.y - 0.002, 0), FZ + 0.005, FZ + 0.016)), P.eye));
  S.push(flat(hull(plate(K([[-0.006, -0.006], [0.006, -0.006], [0.006, 0.006], [-0.006, 0.006]]),
    V(E.x - 0.001, E.y + 0.002, 0), FZ + 0.012, FZ + 0.019)), P.eyeW));
  S.push(paint(hull([
    V(0.02, E.y + 0.01, FZ + 0.028), V(0.022, E.y + 0.048, FZ + 0.018),
    V(0.155, E.y + 0.05, FZ - 0.01), V(0.155, E.y + 0.088, FZ - 0.025),
    V(0.02, E.y + 0.01, FZ - 0.03), V(0.022, E.y + 0.058, FZ - 0.04),
    V(0.155, E.y + 0.05, FZ - 0.06), V(0.155, E.y + 0.093, FZ - 0.07),
  ]), P.brow, 'y'));

  // ================= WINGS (folded, layered feather plates sweeping back) =================
  S.push(wh(hull([
    ...ring(V(0.175, 0.47, 0.05), 0.035, 0.09, 8, 'x'),
    ...ring(V(0.19, 0.44, -0.06), 0.04, 0.1, 8, 'x'),
    V(0.17, 0.38, -0.2), V(0.16, 0.46, -0.18),
  ]), 0.3, 0.6));
  // primaries (long, lower), secondaries, coverts (short, upper)
  for (const [y, z, dy, w, l, x, sw] of [
    [0.38, 0.02, -0.45, 0.065, 0.28, 0.212, P.wingD], [0.44, 0.0, -0.22, 0.07, 0.3, 0.218, P.wingD],
    [0.5, -0.02, -0.02, 0.065, 0.26, 0.214, P.wingD],
    [0.4, 0.1, -0.55, 0.065, 0.22, 0.228, P.feath], [0.47, 0.09, -0.3, 0.07, 0.23, 0.232, P.feath],
    [0.53, 0.07, -0.1, 0.06, 0.2, 0.226, P.feath],
    [0.47, 0.16, -0.6, 0.06, 0.15, 0.238, P.feath], [0.54, 0.15, -0.35, 0.06, 0.13, 0.234, P.feath],
  ]) S.push(fplate(V(x, y, z), V(0.1, dy, -1), V(1, 0.1, 0.05), w, l, 0.012, sw));

  // ================= LEGS (short, thick, gold) =================
  const legX = 0.095;
  S.push(wh(blob(1, V(legX, 0.24, -0.01), V(0.085, 0.09, 0.1), { jitter: 0.15 }), 0.15, 0.4));
  S.push(fplate(V(legX + 0.06, 0.26, 0.04), V(0.3, -1, 0.2), V(1, 0, 0.6), 0.045, 0.1, 0.011));
  S.push(fplate(V(legX + 0.06, 0.26, -0.06), V(0.3, -1, -0.3), V(1, 0, -0.5), 0.045, 0.1, 0.011));
  S.push(fplate(V(legX, 0.26, 0.07), V(0, -1, 0.3), V(0, 0, 1), 0.045, 0.09, 0.011));
  S.push(paint(hull([...ring(V(legX, 0.2, -0.005), 0.052, 0.052, 6), ...ring(V(legX + 0.003, 0.12, 0.005), 0.05, 0.05, 6),
    ...ring(V(legX + 0.005, 0.04, 0.02), 0.045, 0.045, 6)]), P.leg, 'y', [0, 0.22]));
  S.push(paint(shard(V(legX + 0.003, 0.1, -0.035), V(0, -0.2, -1), 0.014, 0.04), P.claw, 'flat')); // spur
  const foot = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.032, z), 0.05, 0.032, 0.05, 0.014)), P.leg, 'y', [0, 0.07]));
    for (const [dx, dz] of [[-0.055, 0.085], [0, 0.105], [0.055, 0.085]]) {
      S.push(paint(hull([...cbox(V(x + dx * 0.45, 0.026, z + dz * 0.45), 0.022, 0.026, 0.022, 0.008),
        ...cbox(V(x + dx, 0.022, z + dz), 0.02, 0.022, 0.016, 0.007)]), P.leg, 'y', [0, 0.07]));
      S.push(paint(shard(V(x + dx * 1.08, 0.02, z + dz + 0.012), V(dx, -0.45, 0.8), 0.016, 0.04), P.claw, 'flat'));
    }
    S.push(paint(hull([...cbox(V(x, 0.022, z - 0.055), 0.018, 0.022, 0.03, 0.006)]), P.leg, 'y', [0, 0.07]));
    S.push(paint(shard(V(x, 0.016, z - 0.085), V(0, -0.4, -1), 0.014, 0.035), P.claw, 'flat'));
  };
  foot(legX + 0.005, 0.03);

  // ================= TAIL (big fan of teal sickle blades sweeping up and back) =================
  const blade = (pts, w, thick, sw) => paint(tube(curveSamples(pts, 9,
    (t) => thick * (1 - 0.6 * t), (t) => w * Math.sin(Math.PI * (0.18 + 0.82 * t)) + 0.006),
    { seg: 4, axis: X, capEnd: 0.0, capStart: 0.0 }), sw, 'len');
  // [x0, x1, pts...]
  const tails = [
    { x: [0, 0], c: P.teal, w: 0.1, pts: [[0.48, -0.2], [0.75, -0.3], [0.98, -0.4], [1.04, -0.56], [0.95, -0.68]] },
    { x: [0.04, 0.13], c: P.tealD, w: 0.1, pts: [[0.45, -0.22], [0.66, -0.36], [0.84, -0.52], [0.86, -0.68], [0.76, -0.78]] },
    { x: [0.03, 0.1], c: P.teal, w: 0.1, pts: [[0.42, -0.24], [0.56, -0.4], [0.68, -0.58], [0.66, -0.74], [0.54, -0.82]] },
    { x: [0.06, 0.18], c: P.tealD, w: 0.09, pts: [[0.4, -0.24], [0.46, -0.42], [0.5, -0.6], [0.44, -0.74], [0.32, -0.78]] },
    { x: [0.03, 0.11], c: P.teal, w: 0.08, pts: [[0.38, -0.24], [0.38, -0.4], [0.36, -0.55], [0.28, -0.66], [0.18, -0.66]] },
  ];
  for (const t of tails) {
    const n = t.pts.length;
    const pts = t.pts.map(([y, z], i) => V(t.x[0] + (t.x[1] - t.x[0]) * i / (n - 1), y, z));
    (t.x[0] === 0 && t.x[1] === 0 ? C : S).push(blade(pts, t.w, 0.028, t.c));
  }

  return assemble(C, S);
}

// Game name: MeshPart name in Roblox and the export file name
export const NAME = 'RookieRooster';

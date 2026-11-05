// Star Pegasus (RARE): chunky faceted white horse with indigo shard mane, gold-trimmed feathered wings.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  body:   { i: 0, top: '#FFFCFF', bot: '#D8CFEA' },
  muzzle: { i: 1, top: '#F7F0FA', bot: '#E2D3EC' },
  mane:   { i: 2, top: '#7656F0', bot: '#3A1FA6' },
  gold:   { i: 3, top: '#FFE27A', bot: '#D69A12' },
  eye:    { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  brow:   { i: 6, top: '#F2ECF8', bot: '#CFC3E2' },
  feather:{ i: 7, top: '#FFFEFA', bot: '#F2E8D8' },
  blue:   { i: 8, top: '#C2D4FF', bot: '#9DB6F5' },
  gem:    { i: 9, top: '#FFFFFF', bot: '#BFD0FF' },
  pink:   { i: 10, top: '#F8C2D2', bot: '#E28AA6' },
  nostril:{ i: 11, top: '#8A7896', bot: '#5E4E6E' },
  tail:   { i: 12, top: '#6E4EEC', bot: '#3418A0' },
};
const SW = PALETTE;

// flat feather blade: base b, direction d, plane normal n
function blade(b, d, n, w, len, th = 0.012) {
  d = d.clone().normalize();
  const s = new THREE.Vector3().crossVectors(d, n).normalize();
  const nn = new THREE.Vector3().crossVectors(s, d).normalize();
  const pts = [];
  const prof = [[0, 0.55], [0.3, 1], [0.75, 0.75], [1, 0]];
  for (const [t, wf] of prof) for (const sg of [-1, 1]) for (const k of [-1, 1]) {
    if (wf === 0 && sg === 1) continue;
    pts.push(b.clone().addScaledVector(d, t * len).addScaledVector(s, sg * wf * w).addScaledVector(nn, k * th * (wf === 0 ? 0.3 : 1)));
  }
  return hull(pts);
}

// rotate points about pivot by yaw (around Y)
function yaw(pts, pivot, a) {
  const q = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), a);
  return pts.map((p) => p.clone().sub(pivot).applyQuaternion(q).add(pivot));
}

export function buildGeometry() {
  const C = [], S = [];
  const body = (pts, lo = 0.0, hi = 1.0) => paint(hull(pts), SW.body, 'y', [lo, hi]);
  const gold = (g) => paint(g, SW.gold, 'y');
  const mane = (g) => paint(g, SW.mane, 'flat');

  // ================= TORSO =================
  C.push(body([
    ...ring(V(0, 0.43, -0.34), 0.1, 0.1, 10, 'z'),
    ...ring(V(0, 0.425, -0.27), 0.17, 0.17, 10, 'z'),
    ...ring(V(0, 0.42, -0.1), 0.18, 0.185, 10, 'z'),
    ...ring(V(0, 0.43, 0.08), 0.18, 0.19, 10, 'z'),
    ...ring(V(0, 0.45, 0.2), 0.165, 0.18, 10, 'z'),
    ...ring(V(0, 0.48, 0.27), 0.11, 0.13, 10, 'z'),
  ], 0.25, 0.75));
  // chest bulge
  C.push(paint(blob(1, V(0, 0.5, 0.22), V(0.145, 0.15, 0.115), { jitter: 0.08 }), SW.body, 'y', [0.3, 0.75]));
  // neck (short, thick, leaning forward)
  C.push(body([
    ...ring(V(0, 0.5, 0.17), 0.135, 0.14, 8, 'y'),
    ...ring(V(0, 0.68, 0.24), 0.115, 0.115, 8, 'y'),
    ...ring(V(0, 0.8, 0.27), 0.11, 0.11, 8, 'y'),
  ], 0.4, 1.0));

  // ================= LEGS =================
  const leg = (x, z, top, thick, kz) => {
    S.push(body([...ring(V(x, 0.08, z), 0.064, 0.064, 8), ...ring(V(x, 0.2, z + kz), 0.07, 0.074, 8),
      ...ring(V(x - 0.01, top, z), thick, thick * 1.1, 8)], 0.0, 0.6));
    // gold hoof + anklet
    S.push(gold(hull([...ring(V(x, 0.0, z + 0.008), 0.086, 0.092, 8), ...ring(V(x, 0.075, z), 0.074, 0.076, 8)])));
    S.push(gold(hull([...ring(V(x, 0.083, z), 0.076, 0.078, 8), ...ring(V(x, 0.118, z), 0.072, 0.074, 8)])));
  };
  leg(0.11, 0.17, 0.38, 0.088, 0.012);
  leg(0.115, -0.24, 0.34, 0.085, -0.018);
  S.push(paint(blob(1, V(0.1, 0.4, 0.15), V(0.085, 0.11, 0.095), { jitter: 0.04 }), SW.body, 'y', [0.2, 0.7]));
  S.push(paint(blob(1, V(0.105, 0.41, -0.22), V(0.088, 0.13, 0.125), { jitter: 0.05 }), SW.body, 'y', [0.2, 0.7]));

  // ================= HEAD (big, boxy) =================
  const H = { y: 0.9, z: 0.31 };
  C.push(body([
    ...cbox(V(0, H.y, H.z), 0.152, 0.128, 0.13, 0.048),
    ...ring(V(0, H.y + 0.14, H.z - 0.01), 0.09, 0.08, 8, 'y'),
    V(0.158, H.y - 0.075, H.z + 0.03), V(-0.158, H.y - 0.075, H.z + 0.03),
  ], 0.6, 1.1));
  const FZ = H.z + 0.13;
  // snout (chunky, slightly down)
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.07, FZ - 0.02), 0.105, 0.065, 0.04, 0.025),
    ...cbox(V(0, H.y - 0.085, FZ + 0.1), 0.09, 0.065, 0.04, 0.03),
  ]), SW.muzzle, 'y', [0.7, 0.92]));
  // nostrils
  S.push(paint(hull(plate([[-0.014, -0.01], [0.014, -0.005], [0.014, 0.012], [-0.01, 0.01]],
    V(0.045, H.y - 0.07, 0), FZ + 0.137, FZ + 0.146)), SW.nostril, 'flat'));
  // mouth line
  C.push(paint(hull(cbox(V(0, H.y - 0.135, FZ + 0.1), 0.06, 0.004, 0.038, 0.002)), SW.nostril, 'flat'));

  // eyes (yawed outward)
  const E = V(0.097, H.y + 0.028, FZ);
  const ey = 0.3;
  const eyeP = (pts, z0, z1, c = E) => yaw(plate(pts, c, z0, z1), V(E.x, E.y, FZ), ey);
  S.push(paint(hull(eyeP([[-0.04, 0.0], [0.042, 0.03], [0.048, -0.008], [0.018, -0.038], [-0.028, -0.034], [-0.044, -0.015]],
    FZ - 0.01, FZ + 0.012)), SW.white, 'flat'));
  S.push(paint(hull(eyeP([[-0.026, 0.004], [0.016, 0.018], [0.022, -0.006], [0.004, -0.03], [-0.02, -0.028], [-0.03, -0.01]],
    FZ + 0.006, FZ + 0.018)), SW.eye, 'flat'));
  S.push(paint(hull(eyeP([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    FZ + 0.014, FZ + 0.021, V(E.x + 0.007, E.y + 0.003, 0))), SW.white, 'flat'));
  // heavy brow
  S.push(paint(hull(yaw([
    V(0.035, E.y + 0.012, FZ + 0.03), V(0.037, E.y + 0.05, FZ + 0.022),
    V(0.155, E.y + 0.046, FZ - 0.0), V(0.155, E.y + 0.086, FZ - 0.016),
    V(0.035, E.y + 0.012, FZ - 0.03), V(0.037, E.y + 0.06, FZ - 0.04),
    V(0.155, E.y + 0.046, FZ - 0.05), V(0.155, E.y + 0.088, FZ - 0.06),
  ], V(E.x, E.y, FZ), ey)), SW.brow, 'y'));

  // ears (upright, pink inner facing forward)
  S.push(paint(hull([V(0.055, H.y + 0.1, H.z - 0.02), V(0.135, H.y + 0.1, H.z - 0.02), V(0.06, H.y + 0.1, H.z - 0.09),
    V(0.13, H.y + 0.1, H.z - 0.09), V(0.115, H.y + 0.29, H.z - 0.045)]), SW.body, 'y', [0.95, 1.25]));
  S.push(paint(hull([V(0.07, H.y + 0.13, H.z - 0.012), V(0.12, H.y + 0.13, H.z - 0.012), V(0.11, H.y + 0.255, H.z - 0.034),
    V(0.095, H.y + 0.14, H.z - 0.04)]), SW.pink, 'flat'));

  // tiara: gold band + central crest
  C.push(gold(hull([...cbox(V(0, H.y + 0.115, FZ - 0.035), 0.08, 0.017, 0.022, 0.006)])));
  C.push(gold(hull([V(0, H.y + 0.22, FZ - 0.045), V(0.035, H.y + 0.115, FZ - 0.02), V(-0.035, H.y + 0.115, FZ - 0.02),
    V(0, H.y + 0.115, FZ - 0.07), V(0, H.y + 0.15, FZ - 0.0)])));

  // ================= MANE (chunky indigo locks) =================
  const lock = (b, d, w, l, n = V(1, 0.15, 0)) => {
    d = d.clone().normalize(); n = n.clone().normalize();
    const sd = new THREE.Vector3().crossVectors(d, n).normalize();
    const nn = new THREE.Vector3().crossVectors(sd, d).normalize();
    const pts = [b.clone().addScaledVector(d, l)];
    for (const [t, wf, th] of [[-0.05, 0.8, 0.03], [0.3, 1, 0.032], [0.65, 0.55, 0.02]])
      for (const sg of [-1, 1]) for (const k of [-1, 1])
        pts.push(b.clone().addScaledVector(d, t * l).addScaledVector(sd, sg * wf * w).addScaledVector(nn, k * th));
    S.push(mane(hull(pts)));
  };
  // forelock sweeping forward/out over the brow
  lock(V(0.02, H.y + 0.15, H.z + 0.0), V(0.5, -0.2, 1), 0.05, 0.17, V(0, 1, 0.2));
  lock(V(0.08, H.y + 0.13, H.z - 0.02), V(1, -0.5, 0.45), 0.05, 0.16, V(0.4, 1, 0));
  // crest locks along the neck, flowing back and down both sides
  for (const [b, d, w, l] of [
    [V(0.0, H.y + 0.15, H.z - 0.05), V(0.15, 0.35, -1), 0.06, 0.24],
    [V(0.08, H.y + 0.1, H.z - 0.08), V(0.5, -0.15, -1), 0.06, 0.26],
    [V(0.03, H.y + 0.04, H.z - 0.12), V(0.25, 0.05, -1), 0.065, 0.28],
    [V(0.1, 0.86, 0.2), V(0.5, -0.5, -0.9), 0.06, 0.25],
    [V(0.03, 0.8, 0.17), V(0.25, -0.15, -1), 0.065, 0.28],
    [V(0.11, 0.75, 0.16), V(0.5, -0.8, -0.7), 0.055, 0.22],
    [V(0.04, 0.7, 0.13), V(0.3, -0.3, -1), 0.065, 0.26],
    [V(0.11, 0.66, 0.13), V(0.45, -1, -0.5), 0.05, 0.19],
    [V(0.04, 0.62, 0.08), V(0.35, -0.45, -1), 0.055, 0.2],
  ]) lock(b, d, w, l);

  // ================= TAIL (long flowing indigo) =================
  const tailStrand = (pts, r) => paint(tube(curveSamples(pts, 9, (t) => r * (1 - 0.85 * t) + 0.02 * Math.sin(Math.PI * t)),
    { seg: 6, axis: V(1, 0, 0), capEnd: 0.025 }), SW.tail, 'len');
  C.push(tailStrand([V(0, 0.5, -0.3), V(0, 0.54, -0.44), V(0, 0.42, -0.58), V(0, 0.22, -0.64), V(0, 0.06, -0.6)], 0.07));
  S.push(tailStrand([V(0.02, 0.5, -0.31), V(0.06, 0.48, -0.44), V(0.09, 0.32, -0.54), V(0.1, 0.15, -0.55), V(0.09, 0.04, -0.48)], 0.055));
  S.push(tailStrand([V(0.02, 0.48, -0.3), V(0.04, 0.4, -0.4), V(0.05, 0.25, -0.44), V(0.06, 0.12, -0.44)], 0.045));

  lock(V(0.03, 0.53, -0.3), V(0.25, -0.15, -1), 0.06, 0.24, V(1, 0.3, 0));
  lock(V(0.06, 0.5, -0.33), V(0.4, -0.8, -0.6), 0.055, 0.24, V(1, 0, 0.2));

  // ================= CHEST PIECE =================
  // gold collar band around the neck base, dipping to the chest
  const collar = (r) => ring(V(0, 0, 0.19), r * 1.02, r, 12, 'y').map((p) => V(p.x, 0.66 - 0.55 * (p.z - 0.19), p.z));
  C.push(gold(hull([...collar(0.142), ...collar(0.142).map((p) => V(p.x, p.y - 0.035, p.z))])));
  // diamond setting + gem
  C.push(gold(hull(plate([[0, 0.075], [0.06, 0], [0, -0.08], [-0.06, 0]], V(0, 0.53, 0), 0.31, 0.36))));
  C.push(paint(hull([V(0, 0.59, 0.36), V(0.038, 0.53, 0.36), V(0, 0.465, 0.36), V(-0.038, 0.53, 0.36), V(0, 0.53, 0.39)]),
    SW.gem, 'y'));

  // ================= WINGS =================
  const L0 = V(0.08, 0.6, 0.05), L1 = V(0.2, 0.84, -0.02), L2 = V(0.4, 1.17, -0.38);
  const wN = new THREE.Vector3().crossVectors(L2.clone().sub(L0), V(0.12, -0.3, -1)).normalize();
  if (wN.x < 0) wN.negate();
  const bN = wN.clone().add(V(0, 0.35, 0.3)).normalize(); // shingled feather tilt, catches the light
  // gold arm along leading edge
  S.push(gold(tube(curveSamples([L0, L1, L2], 7, (t) => 0.062 - 0.026 * t, (t) => 0.03 - 0.01 * t),
    { seg: 6, ref: wN, capEnd: 0.04 })));
  S.push(gold(shard(L1.clone().add(V(0, 0.025, 0)), V(0.1, 1, 0.3), 0.03, 0.085)));
  const edge = (t) => t < 0.35 ? L0.clone().lerp(L1, t / 0.35) : L1.clone().lerp(L2, (t - 0.35) / 0.65);
  const fdir = (t) => V(0.12 + 0.1 * t, -0.62 + 0.5 * t, -1);
  // long cream primaries
  const NP = 12;
  for (let i = 0; i < NP; i++) {
    const t = 0.08 + 0.92 * i / (NP - 1);
    S.push(paint(blade(edge(t).addScaledVector(wN, -0.014), fdir(t), bN, 0.072, 0.24 + 0.34 * t, 0.012), SW.feather, 'flat'));
  }
  // cream secondaries between primaries and coverts
  const NS = 9;
  for (let i = 0; i < NS; i++) {
    const t = 0.06 + 0.84 * i / (NS - 1);
    S.push(paint(blade(edge(t).addScaledVector(wN, 0.0).addScaledVector(fdir(t).normalize(), 0.03), fdir(t), bN, 0.065,
      0.2 + 0.16 * t, 0.011), SW.feather, 'flat'));
  }
  // light-blue coverts on top
  const NC = 9;
  for (let i = 0; i < NC; i++) {
    const t = 0.06 + 0.86 * i / (NC - 1);
    S.push(paint(blade(edge(t).addScaledVector(wN, 0.016).addScaledVector(fdir(t).normalize(), 0.01), fdir(t), bN, 0.064,
      0.15 + 0.13 * t, 0.011), SW.blue, 'flat'));
  }

  return assemble(C, S);
}

// Uppercut Unicorn (ROBUX EGG / Legends Egg): chunky faceted white winged unicorn, pink shard mane,
// glowing spiral horn, battle scars, ornate gold armour with glowing aqua runes.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  body:   { i: 0, top: '#FFFFFF', bot: '#D9D2EA' },
  muzzle: { i: 1, top: '#FFFFFF', bot: '#E4DCF0' },
  nose:   { i: 16, top: '#F6E2EF', bot: '#DDBCD6' },
  mane:   { i: 2, top: '#FF8CCB', bot: '#E0398F' },
  gold:   { i: 3, top: '#FFE680', bot: '#D9960F' },
  eye:    { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  brow:   { i: 6, top: '#CFC2E2', bot: '#9C8BB8' },
  feather:{ i: 7, top: '#FFFFFF', bot: '#ECE8F5' },
  covert: { i: 8, top: '#FFCBE7', bot: '#FF9ED0' },
  horn:   { i: 9, top: '#2FD2FF', bot: '#A6F7FF', glow: true },
  rune:   { i: 10, top: '#B8FBFF', bot: '#3FD8FF', glow: true },
  nostril:{ i: 11, top: '#8A7896', bot: '#5E4E6E' },
  tail:   { i: 12, top: '#FF7FC2', bot: '#C92A7E' },
  socket: { i: 13, top: '#5B4A70', bot: '#3C2F4E' },
  scar:   { i: 14, top: '#B596AE', bot: '#94728E' },
  goldDk: { i: 15, top: '#E9B530', bot: '#A86A08' },
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

// angular pointed feather shard (widest near the base, straight edges to a sharp tip)
function shardBlade(b, d, n, w, len, th = 0.012) {
  d = d.clone().normalize();
  const s = new THREE.Vector3().crossVectors(d, n).normalize();
  const nn = new THREE.Vector3().crossVectors(s, d).normalize();
  const pts = [b.clone().addScaledVector(d, len)];
  for (const [t, wf] of [[0, 0.7], [0.35, 1]]) for (const sg of [-1, 1]) for (const k of [-1, 1])
    pts.push(b.clone().addScaledVector(d, t * len).addScaledVector(s, sg * wf * w).addScaledVector(nn, k * th));
  return hull(pts);
}

function yaw(pts, pivot, a) {
  const q = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), a);
  return pts.map((p) => p.clone().sub(pivot).applyQuaternion(q).add(pivot));
}

// thin strip lying on a surface: from a to b, normal n, half-width w, raised h above and sunk d below
function strip(a, b, n, w, h = 0.007, d = 0.02) {
  n = n.clone().normalize();
  const dir = b.clone().sub(a).normalize();
  const s = new THREE.Vector3().crossVectors(dir, n).normalize();
  const pts = [];
  for (const p of [a, b]) for (const sg of [-1, 1]) for (const k of [h, -d]) {
    const ww = (p === a ? 0.6 : 0.6) * w;
    pts.push(p.clone().addScaledVector(s, sg * ww).addScaledVector(n, k));
  }
  // pointed ends
  pts.push(a.clone().addScaledVector(dir, -w * 1.5).addScaledVector(n, h * 0.5));
  pts.push(b.clone().addScaledVector(dir, w * 1.5).addScaledVector(n, h * 0.5));
  return hull(pts);
}

export function buildGeometry() {
  const C = [], S = [];
  const body = (pts, lo = 0.0, hi = 1.0) => paint(hull(pts), SW.body, 'y', [lo, hi]);
  const gold = (g) => paint(g, SW.gold, 'y');
  const goldDk = (g) => paint(g, SW.goldDk, 'y');
  const rune = (g) => paint(g, SW.rune, 'y');

  // ================= TORSO (sturdy barrel) =================
  C.push(body([
    ...ring(V(0, 0.44, -0.35), 0.11, 0.1, 10, 'z'),
    ...ring(V(0, 0.435, -0.28), 0.2, 0.175, 10, 'z'),
    ...ring(V(0, 0.43, -0.1), 0.215, 0.19, 10, 'z'),
    ...ring(V(0, 0.44, 0.08), 0.215, 0.195, 10, 'z'),
    ...ring(V(0, 0.46, 0.2), 0.2, 0.185, 10, 'z'),
    ...ring(V(0, 0.49, 0.27), 0.14, 0.135, 10, 'z'),
  ], 0.25, 0.75));
  C.push(paint(blob(1, V(0, 0.5, 0.23), V(0.18, 0.16, 0.12), { jitter: 0.08 }), SW.body, 'y', [0.3, 0.75]));
  // neck: thick, leaning forward
  C.push(body([
    ...ring(V(0, 0.52, 0.17), 0.16, 0.145, 8, 'y'),
    ...ring(V(0, 0.7, 0.25), 0.122, 0.12, 8, 'y'),
    ...ring(V(0, 0.8, 0.28), 0.115, 0.115, 8, 'y'),
  ], 0.4, 1.0));

  // ================= LEGS (short, thick, gold-shod) =================
  const leg = (x, z, top, thick, kz) => {
    S.push(body([...ring(V(x, 0.08, z), 0.088, 0.088, 8), ...ring(V(x, 0.2, z + kz), 0.094, 0.098, 8),
      ...ring(V(x - 0.01, top, z), thick, thick * 1.1, 8)], 0.0, 0.6));
    // gold hoof (broad, flat), dark-gold sole band, anklet with rune
    S.push(gold(hull([...ring(V(x, 0.0, z + 0.01), 0.112, 0.118, 8), ...ring(V(x, 0.07, z + 0.002), 0.098, 0.101, 8)])));
    S.push(goldDk(hull([...ring(V(x, 0.072, z), 0.101, 0.104, 8), ...ring(V(x, 0.088, z), 0.098, 0.101, 8)])));
    S.push(gold(hull([...ring(V(x, 0.15, z + kz * 0.6), 0.1, 0.103, 8), ...ring(V(x, 0.19, z + kz * 0.8), 0.101, 0.105, 8)])));
    S.push(rune(hull(plate([[0, 0.016], [0.012, 0], [0, -0.016], [-0.012, 0]], V(x, 0.17, 0), z + kz * 0.7 + 0.098, z + kz * 0.7 + 0.112))));
  };
  leg(0.14, 0.17, 0.4, 0.11, 0.012);
  leg(0.144, -0.25, 0.36, 0.106, -0.018);
  S.push(paint(blob(1, V(0.12, 0.42, 0.15), V(0.1, 0.115, 0.105), { jitter: 0.04 }), SW.body, 'y', [0.2, 0.7]));
  S.push(paint(blob(1, V(0.125, 0.43, -0.23), V(0.105, 0.14, 0.13), { jitter: 0.05 }), SW.body, 'y', [0.2, 0.7]));

  // ================= HEAD (big, boxy) =================
  const H = { y: 0.92, z: 0.32 };
  C.push(body([
    ...cbox(V(0, H.y, H.z), 0.175, 0.145, 0.145, 0.052),
    ...ring(V(0, H.y + 0.15, H.z - 0.01), 0.1, 0.085, 8, 'y'),
    V(0.18, H.y - 0.085, H.z + 0.03), V(-0.18, H.y - 0.085, H.z + 0.03),
  ], 0.6, 1.1));
  const FZ = H.z + 0.145;
  // snout
  // long, tapered horse muzzle
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.07, FZ - 0.02), 0.115, 0.075, 0.04, 0.028),
    ...cbox(V(0, H.y - 0.093, FZ + 0.12), 0.088, 0.058, 0.035, 0.03),
  ]), SW.muzzle, 'y', [0.72, 0.95]));
  // soft pink-lavender nose tip
  C.push(paint(hull(cbox(V(0, H.y - 0.104, FZ + 0.145), 0.084, 0.05, 0.03, 0.034)), SW.nose, 'y', [0.76, 0.86]));
  // small angled nostrils
  S.push(paint(hull(plate([[-0.013, -0.009], [0.012, 0.0], [0.014, 0.013], [-0.008, 0.004]],
    V(0.035, H.y - 0.088, 0), FZ + 0.172, FZ + 0.185)), SW.nostril, 'flat'));
  // determined mouth line
  C.push(paint(hull(cbox(V(0, H.y - 0.136, FZ + 0.172), 0.048, 0.004, 0.012, 0.002)), SW.nostril, 'flat'));

  // eyes: dark socket plate so the white almond reads on a white face
  const E = V(0.1, H.y + 0.03, FZ);
  const ey = 0.3;
  const eyeP = (pts, z0, z1, c = E) => yaw(plate(pts, c, z0, z1), V(E.x, E.y, FZ), ey);
  S.push(paint(hull(eyeP([[-0.052, 0.008], [0.056, 0.042], [0.064, -0.012], [0.026, -0.052], [-0.036, -0.048], [-0.058, -0.02]],
    FZ - 0.014, FZ + 0.006)), SW.socket, 'flat'));
  S.push(paint(hull(eyeP([[-0.04, 0.0], [0.044, 0.03], [0.05, -0.008], [0.018, -0.039], [-0.028, -0.035], [-0.045, -0.015]],
    FZ - 0.01, FZ + 0.013)), SW.white, 'flat'));
  S.push(paint(hull(eyeP([[-0.027, 0.004], [0.016, 0.019], [0.022, -0.006], [0.004, -0.031], [-0.021, -0.029], [-0.031, -0.01]],
    FZ + 0.007, FZ + 0.019)), SW.eye, 'flat'));
  S.push(paint(hull(eyeP([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    FZ + 0.015, FZ + 0.022, V(E.x + 0.007, E.y + 0.003, 0))), SW.white, 'flat'));
  // heavy brow (gold-armoured brow plate)
  S.push(goldDk(hull(yaw([
    V(0.03, E.y + 0.014, FZ + 0.035), V(0.032, E.y + 0.056, FZ + 0.026),
    V(0.165, E.y + 0.05, FZ - 0.0), V(0.165, E.y + 0.094, FZ - 0.016),
    V(0.03, E.y + 0.014, FZ - 0.03), V(0.032, E.y + 0.066, FZ - 0.04),
    V(0.165, E.y + 0.05, FZ - 0.05), V(0.165, E.y + 0.096, FZ - 0.06),
  ], V(E.x, E.y, FZ), ey))));

  // battle scars: slash across the right cheek below the eye + nick on the snout (mirrored)
  S.push(paint(strip(V(0.176, H.y + 0.04, H.z + 0.06), V(0.178, H.y - 0.1, H.z - 0.0), V(1, 0, 0), 0.012, 0.007, 0.03), SW.scar, 'flat'));
  S.push(paint(strip(V(0.176, H.y - 0.01, H.z + 0.08), V(0.178, H.y - 0.05, H.z - 0.05), V(1, 0, 0), 0.009, 0.007, 0.03), SW.scar, 'flat'));
  // nick across the snout bridge
  C.push(paint(strip(V(-0.065, H.y + 0.002, FZ + 0.04), V(0.065, H.y + 0.002, FZ + 0.04), V(0, 1, 0.15), 0.011, 0.007, 0.03), SW.scar, 'flat'));

  // ears
  S.push(paint(hull([V(0.06, H.y + 0.1, H.z - 0.03), V(0.145, H.y + 0.1, H.z - 0.03), V(0.065, H.y + 0.1, H.z - 0.1),
    V(0.14, H.y + 0.1, H.z - 0.1), V(0.135, H.y + 0.29, H.z - 0.06)]), SW.body, 'y', [0.95, 1.25]));
  S.push(paint(hull([V(0.078, H.y + 0.13, H.z - 0.022), V(0.13, H.y + 0.13, H.z - 0.022), V(0.128, H.y + 0.255, H.z - 0.048),
    V(0.105, H.y + 0.14, H.z - 0.05)]), SW.covert, 'flat'));

  // chanfron: gold face plate down the forehead with rune, horn socket on top
  C.push(gold(hull([
    ...plate([[-0.06, 0.06], [0.06, 0.06], [0.07, 0.0], [0.03, -0.09], [-0.03, -0.09], [-0.07, 0.0]], V(0, H.y + 0.06, 0), FZ - 0.025, FZ + 0.012),
  ])));
  C.push(rune(hull(plate([[0, 0.03], [0.018, 0], [0, -0.04], [-0.018, 0]], V(0, H.y + 0.06, 0), FZ + 0.004, FZ + 0.019))));
  // gold crown band around the forehead, with points
  C.push(gold(hull([...cbox(V(0, H.y + 0.128, H.z + 0.02), 0.13, 0.02, 0.12, 0.01)])));
  for (const [x, z, h] of [[0.08, FZ - 0.02, 0.07], [0.125, H.z + 0.06, 0.06]])
    S.push(gold(shard(V(x, H.y + 0.13, z), V(0.3, 1, 0.1), 0.022, h)));

  // ================= HORN (glowing spiral) =================
  const hb = V(0, H.y + 0.15, FZ - 0.04);
  C.push(gold(hull([...ring(hb.clone().add(V(0, -0.02, 0)), 0.062, 0.062, 8, 'y'), ...ring(hb.clone().add(V(0, 0.035, 0.008)), 0.05, 0.05, 8, 'y')])));
  C.push(paint(tube(curveSamples([hb.clone().add(V(0, 0.03, 0.006)), hb.clone().add(V(0, 0.17, 0.05)), hb.clone().add(V(0, 0.31, 0.1))],
    8, (t) => 0.044 * (1 - t) + 0.004),
    { seg: 5, axis: V(1, 0, 0), capEnd: 0.035, twist: (i) => i * 0.63, scale: (i) => (i % 2 ? 1.12 : 0.95) }), SW.horn, 'len'));

  // ================= MANE (chunky pink locks) =================
  const lock = (b, d, w, l, n = V(1, 0.15, 0), sw = SW.mane, side = S) => {
    d = d.clone().normalize(); n = n.clone().normalize();
    const sd = new THREE.Vector3().crossVectors(d, n).normalize();
    const nn = new THREE.Vector3().crossVectors(sd, d).normalize();
    const pts = [b.clone().addScaledVector(d, l)];
    for (const [t, wf, th] of [[-0.05, 0.8, 0.032], [0.3, 1, 0.034], [0.65, 0.55, 0.022]])
      for (const sg of [-1, 1]) for (const k of [-1, 1])
        pts.push(b.clone().addScaledVector(d, t * l).addScaledVector(sd, sg * wf * w).addScaledVector(nn, k * th));
    side.push(paint(hull(pts), sw, 'flat'));
  };
  // forelock: sweeps out to the sides past the horn
  lock(V(0.03, H.y + 0.15, H.z + 0.03), V(0.6, -0.15, 1), 0.05, 0.16, V(0, 1, 0.2));
  lock(V(0.09, H.y + 0.14, H.z - 0.0), V(1, -0.45, 0.45), 0.052, 0.17, V(0.4, 1, 0));
  for (const [b, d, w, l] of [
    [V(0.0, H.y + 0.15, H.z - 0.06), V(0.15, 0.4, -1), 0.065, 0.26],
    [V(0.08, H.y + 0.11, H.z - 0.09), V(0.5, -0.1, -1), 0.065, 0.27],
    [V(0.03, H.y + 0.04, H.z - 0.13), V(0.25, 0.1, -1), 0.07, 0.3],
    [V(0.11, 0.87, 0.21), V(0.55, -0.5, -0.9), 0.065, 0.26],
    [V(0.03, 0.81, 0.18), V(0.25, -0.1, -1), 0.07, 0.3],
    [V(0.12, 0.76, 0.17), V(0.5, -0.8, -0.7), 0.06, 0.23],
    [V(0.04, 0.71, 0.14), V(0.3, -0.3, -1), 0.07, 0.28],
    [V(0.12, 0.67, 0.14), V(0.45, -1, -0.5), 0.055, 0.2],
    [V(0.04, 0.63, 0.09), V(0.35, -0.45, -1), 0.06, 0.22],
  ]) lock(b, d, w, l);

  // centre crest locks along the neck top
  for (const [b, d, w, l] of [
    [V(0, H.y + 0.12, H.z - 0.1), V(0, 0.5, -1), 0.06, 0.2],
    [V(0, 0.84, 0.2), V(0, 0.35, -1), 0.06, 0.22],
    [V(0, 0.72, 0.13), V(0, 0.25, -1), 0.06, 0.22],
  ]) lock(b, d, w, l, V(1, 0, 0), SW.mane, C);

  // ================= TAIL (big pink shard plume) =================
  const tailStrand = (pts, r) => paint(tube(curveSamples(pts, 9, (t) => r * (1 - 0.85 * t) + 0.02 * Math.sin(Math.PI * t)),
    { seg: 6, axis: V(1, 0, 0), capEnd: 0.025 }), SW.tail, 'len');
  C.push(tailStrand([V(0, 0.52, -0.31), V(0, 0.57, -0.45), V(0, 0.45, -0.6), V(0, 0.24, -0.66), V(0, 0.07, -0.62)], 0.075));
  S.push(tailStrand([V(0.02, 0.52, -0.32), V(0.06, 0.5, -0.45), V(0.1, 0.34, -0.56), V(0.11, 0.16, -0.57), V(0.1, 0.05, -0.5)], 0.06));
  S.push(tailStrand([V(0.02, 0.5, -0.31), V(0.04, 0.42, -0.41), V(0.055, 0.27, -0.46), V(0.065, 0.13, -0.46)], 0.048));
  lock(V(0.03, 0.55, -0.31), V(0.25, -0.1, -1), 0.065, 0.25, V(1, 0.3, 0), SW.tail);
  lock(V(0.06, 0.52, -0.34), V(0.4, -0.8, -0.6), 0.06, 0.25, V(1, 0, 0.2), SW.tail);

  // ================= ARMOUR =================
  // gorget collar around neck base
  const collar = (r, y0) => ring(V(0, 0, 0.2), r * 1.02, r, 12, 'y').map((p) => V(p.x, y0 - 0.5 * (p.z - 0.2), p.z));
  C.push(gold(hull([...collar(0.152, 0.69), ...collar(0.152, 0.65)])));
  // peytral: ornate curved chest plate
  const arc = (r, dz, y) => { const pts = []; for (let k = 0; k <= 6; k++) { const a = -1.0 + 2.0 * k / 6; pts.push(V(Math.sin(a) * r, y, 0.23 + Math.cos(a) * r * 0.8 + dz)); } return pts; };
  C.push(gold(hull([...arc(0.185, 0.0, 0.62), ...arc(0.185, -0.05, 0.62), ...arc(0.175, -0.0, 0.42), ...arc(0.175, -0.05, 0.42),
    V(0, 0.36, 0.33), V(0, 0.36, 0.28)])));
  // rune gem medallion
  C.push(goldDk(hull(plate([[0, 0.085], [0.07, 0], [0, -0.085], [-0.07, 0]], V(0, 0.52, 0), 0.33, 0.385))));
  C.push(rune(hull([V(0, 0.59, 0.384), V(0.045, 0.52, 0.384), V(0, 0.45, 0.384), V(-0.045, 0.52, 0.384), V(0, 0.52, 0.41)])));
  // rune ticks on the peytral
  for (const [y, a] of [[0.58, 0.62], [0.47, 0.6]]) {
    const r = 0.18, n = V(Math.sin(a), 0, Math.cos(a) * 0.8).normalize();
    const c = V(Math.sin(a) * r, y, 0.23 + Math.cos(a) * r * 0.8);
    S.push(paint(strip(c.clone().add(V(0, 0.03, 0)), c.clone().add(V(0, -0.03, 0)), n, 0.016, 0.008, 0.03), SW.rune, 'y'));
  }

  // pauldrons: layered gold domes capping the front shoulders
  const dome = (y, z, sc = 1) => {
    S.push(gold(hull([...ring(V(0.120, y, z), 0.12 * sc, 0.13 * sc, 8, 'x'), ...ring(V(0.210, y + 0.01, z), 0.105 * sc, 0.11 * sc, 8, 'x'),
      ...ring(V(0.238, y + 0.02, z), 0.05 * sc, 0.055 * sc, 8, 'x')])));
    S.push(goldDk(hull([...ring(V(0.120, y - 0.075 * sc, z), 0.125 * sc, 0.07 * sc, 8, 'x'), ...ring(V(0.225, y - 0.08 * sc, z), 0.1 * sc, 0.05 * sc, 8, 'x')])));
    S.push(rune(hull([V(0.256, y + 0.02, z), V(0.240, y + 0.06, z), V(0.240, y - 0.02, z), V(0.240, y + 0.02, z + 0.028), V(0.240, y + 0.02, z - 0.028)])));
    S.push(gold(shard(V(0.200, y + 0.08 * sc, z), V(0.5, 1, 0), 0.03, 0.07)));
  };
  dome(0.5, 0.15);
  // back plate / saddle between the wings, with spine ridge and rune
  C.push(gold(hull([...cbox(V(0, 0.62, -0.06), 0.13, 0.03, 0.17, 0.03), V(0.16, 0.56, -0.06), V(-0.16, 0.56, -0.06)])));
  C.push(goldDk(hull([...cbox(V(0, 0.655, -0.06), 0.03, 0.015, 0.15, 0.01)])));
  dome(0.5, -0.24, 0.95);

  // battle scars on the flank: three claw slashes (mirrored)
  for (const dz of [-0.04, 0.0, 0.04])
    S.push(paint(strip(V(0.212, 0.5, -0.02 + dz), V(0.214, 0.37, -0.08 + dz), V(1, 0, 0), 0.012, 0.007, 0.03), SW.scar, 'flat'));

  // ================= WINGS =================
  const L0 = V(0.09, 0.62, 0.0), L1 = V(0.22, 0.86, -0.06), L2 = V(0.45, 1.2, -0.4);
  const wN = new THREE.Vector3().crossVectors(L2.clone().sub(L0), V(0.12, -0.3, -1)).normalize();
  if (wN.x < 0) wN.negate();
  const bN = wN.clone().add(V(0, 0.6, 0.3)).normalize();
  S.push(gold(tube(curveSamples([L0, L1, L2], 7, (t) => 0.07 - 0.028 * t, (t) => 0.035 - 0.012 * t),
    { seg: 6, ref: wN, capEnd: 0.05 })));
  // wing armour: gold spikes and rune on the wrist
  S.push(gold(shard(L1.clone().add(V(0, 0.03, 0)), V(0.1, 1, 0.3), 0.034, 0.1)));
  S.push(gold(shard(L2.clone().add(V(0, 0.01, 0)), V(0.6, 0.6, -0.5), 0.03, 0.09)));
  S.push(rune(hull([L1.clone().add(V(0.0, 0.0, 0.055)), L1.clone().add(V(0.0, 0.035, 0.03)), L1.clone().add(V(0, -0.035, 0.03)),
    L1.clone().add(V(0.03, 0.0, 0.035)), L1.clone().add(V(-0.03, 0, 0.03))])));
  const edge = (t) => t < 0.35 ? L0.clone().lerp(L1, t / 0.35) : L1.clone().lerp(L2, (t - 0.35) / 0.65);
  const fdir = (t) => V(0.12 + 0.1 * t, -0.62 + 0.5 * t, -1);
  // glowing runes along the gold wing arm
  for (const t of [0.5, 0.68, 0.86]) {
    const tt = (t - 0.35) / 0.65 * 0.5 + 0.5; // approx curve param for radius
    const c = edge(t).addScaledVector(wN, 0.035 - 0.012 * tt + 0.002);
    const dl = L2.clone().sub(L1).normalize();
    const sd = new THREE.Vector3().crossVectors(dl, wN).normalize();
    S.push(rune(hull([c.clone().addScaledVector(dl, 0.03), c.clone().addScaledVector(dl, -0.03), c.clone().addScaledVector(sd, 0.016),
      c.clone().addScaledVector(sd, -0.016), c.clone().addScaledVector(wN, 0.012)])));
  }
  const NP = 10;
  for (let i = 0; i < NP; i++) {
    const t = 0.08 + 0.92 * i / (NP - 1);
    S.push(paint(blade(edge(t).addScaledVector(wN, -0.014), fdir(t), bN, 0.078, 0.25 + 0.34 * t, 0.012), SW.feather, 'y', [-2, -1]));
  }
  const NS = 7;
  for (let i = 0; i < NS; i++) {
    const t = 0.06 + 0.84 * i / (NS - 1);
    S.push(paint(blade(edge(t).addScaledVector(fdir(t).normalize(), 0.03), fdir(t), bN, 0.07, 0.2 + 0.16 * t, 0.011), SW.feather, 'y', [-2, -1]));
  }
  const NC = 7;
  for (let i = 0; i < NC; i++) {
    const t = 0.06 + 0.86 * i / (NC - 1);
    S.push(paint(shardBlade(edge(t).addScaledVector(wN, 0.016).addScaledVector(fdir(t).normalize(), 0.0), fdir(t), bN, 0.072,
      0.22 + 0.14 * t, 0.011), SW.covert, 'flat'));
  }

  // shorten the legs ~15%: compress everything below Y0, drop the rest by the same amount
  const Y0 = 0.4, K = 0.85;
  for (const g of [...C, ...S]) {
    const pa = g.attributes.position;
    for (let i = 0; i < pa.count; i++) { const y = pa.getY(i); pa.setY(i, y < Y0 ? y * K : y - (1 - K) * Y0); }
    g.computeVertexNormals();
  }
  return assemble(C, S);
}

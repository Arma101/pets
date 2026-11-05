// Jab Bunny: chunky faceted cream bunny with purple shard ruff + tail, tall pink-lined ears.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  body:   { i: 0, top: '#FBEBDD', bot: '#E2C3AD' },
  cream:  { i: 1, top: '#FFF8EF', bot: '#EBD7C4' },
  pink:   { i: 2, top: '#FF95A0', bot: '#E8606F' },
  nose:   { i: 3, top: '#FF8A98', bot: '#E05C6E' },
  eye:    { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  muzzle: { i: 6, top: '#FFF6EC', bot: '#EEDAC6' },
  purple: { i: 7, top: '#C58BF0', bot: '#7B3FBE' },
  brow:   { i: 8, top: '#F5E2D2', bot: '#D9BBA5' },
  mouth:  { i: 10, top: '#6A3A3A', bot: '#4A2626' },
  purpleD:{ i: 11, top: '#A866E0', bot: '#6A2EAA' },
};
const SW = PALETTE;

// broad leaf-like shard: diamond outline with real thickness (wider than kit shard)
function petal(base, dir, w, len, th = null, roll = 0) {
  const d = dir.clone().normalize();
  const up = Math.abs(d.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
  let a = new THREE.Vector3().crossVectors(d, up).normalize();
  let b = new THREE.Vector3().crossVectors(a, d).normalize();
  if (roll) { const q = new THREE.Quaternion().setFromAxisAngle(d, roll); a.applyQuaternion(q); b.applyQuaternion(q); }
  const t = th === null ? w * 0.45 : th;
  const P = (along, ac, bc) => base.clone().addScaledVector(d, along).addScaledVector(a, ac).addScaledVector(b, bc);
  return hull([
    P(-0.15 * len, w * 0.45, t), P(-0.15 * len, -w * 0.45, t), P(-0.15 * len, w * 0.45, -t), P(-0.15 * len, -w * 0.45, -t),
    P(0.4 * len, w, t * 0.7), P(0.4 * len, -w, t * 0.7), P(0.4 * len, w, -t * 0.7), P(0.4 * len, -w, -t * 0.7),
    P(len, 0, t * 0.15), P(len, 0, -t * 0.15),
  ]);
}

export function buildGeometry() {
  const C = [], S = [];
  const body = (pts, lo = 0.0, hi = 0.8) => paint(hull(pts), SW.body, 'y', [lo, hi]);
  const cream = (g, lo, hi) => paint(g, SW.cream, lo === undefined ? 'flat' : 'y', lo === undefined ? null : [lo, hi]);

  // ================= BODY (crouched barrel, haunches low at the back) =================
  C.push(body([
    ...ring(V(0, 0.27, -0.32), 0.09, 0.08, 10, 'z'),
    ...ring(V(0, 0.3, -0.22), 0.16, 0.16, 10, 'z'),
    ...ring(V(0, 0.32, -0.08), 0.165, 0.17, 10, 'z'),
    ...ring(V(0, 0.315, 0.08), 0.15, 0.15, 10, 'z'),
    ...ring(V(0, 0.335, 0.17), 0.12, 0.12, 10, 'z'),
  ], 0.12, 0.55));
  // neck
  C.push(body([...ring(V(0, 0.3, 0.13), 0.11, 0.1, 10, 'y'), ...ring(V(0, 0.5, 0.18), 0.12, 0.11, 10, 'y')], 0.3, 0.7));
  // lighter chest
  C.push(paint(blob(1, V(0, 0.3, 0.2), V(0.1, 0.1, 0.07), { jitter: 0.15 }), SW.cream, 'y', [0.2, 0.5]));

  // ================= LEGS =================
  // front legs: short and thick
  S.push(body([...ring(V(0.1, 0.06, 0.21), 0.066, 0.066, 8), ...ring(V(0.1, 0.14, 0.2), 0.072, 0.074, 8),
    ...ring(V(0.098, 0.25, 0.165), 0.088, 0.092, 8)], 0.0, 0.5));
  S.push(paint(blob(0, V(0.105, 0.25, 0.15), V(0.088, 0.1, 0.1), { jitter: 0.1 }), SW.body, 'y', [0.0, 0.5]));
  // front paws: block + 3 toes
  const frontPaw = (x, z) => {
    S.push(cream(hull(cbox(V(x, 0.04, z), 0.07, 0.04, 0.062, 0.02)), 0, 0.08));
    for (const dx of [-0.044, 0, 0.044])
      S.push(cream(hull(cbox(V(x + dx, 0.032, z + 0.058), 0.024, 0.032, 0.032, 0.01)), 0, 0.08));
  };
  frontPaw(0.105, 0.22);
  // hind: big haunch + long flat foot
  S.push(paint(blob(1, V(0.135, 0.21, -0.15), V(0.1, 0.15, 0.16), { jitter: 0.12 }), SW.body, 'y', [0.0, 0.5]));
  S.push(cream(hull([...cbox(V(0.165, 0.045, -0.1), 0.07, 0.045, 0.135, 0.022), ...ring(V(0.165, 0.1, -0.18), 0.06, 0.05, 8, 'y')]), 0, 0.1));
  for (const dx of [-0.042, 0, 0.042])
    S.push(cream(hull(cbox(V(0.165 + dx, 0.034, 0.04), 0.025, 0.034, 0.036, 0.01)), 0, 0.09));

  // ================= HEAD =================
  const H = { y: 0.565, z: 0.22 };
  C.push(body([
    ...cbox(V(0, H.y, H.z), 0.19, 0.15, 0.155, 0.075),
    ...ring(V(0, H.y + 0.17, H.z - 0.01), 0.12, 0.1, 8, 'y'),
    ...ring(V(0, H.y + 0.02, H.z - 0.18), 0.13, 0.1, 8, 'z'),
    V(0.21, H.y - 0.07, H.z + 0.04), V(-0.21, H.y - 0.07, H.z + 0.04),
  ], 0.45, 0.85));
  const FZ = H.z + 0.155;

  // forehead tuft
  C.push(paint(shard(V(0, H.y + 0.15, H.z + 0.04), V(0, 1, 0.6), 0.035, 0.06), SW.body, 'flat'));
  S.push(paint(shard(V(0.04, H.y + 0.155, H.z + 0.02), V(0.4, 1, 0.4), 0.03, 0.05), SW.body, 'flat'));
  // cheek fluff (sideways shards)
  S.push(cream(petal(V(0.17, H.y - 0.07, H.z + 0.07), V(1, -0.35, 0.3), 0.05, 0.1, 0.025)));
  S.push(cream(petal(V(0.16, H.y - 0.095, H.z + 0.08), V(1, -0.55, 0.35), 0.035, 0.065, 0.018)));
  // nape fur at the back of the head
  S.push(paint(petal(V(0.08, H.y - 0.02, H.z - 0.13), V(0.4, -0.5, -1), 0.05, 0.09, 0.022), SW.body, 'y', [0.4, 0.7]));
  C.push(paint(petal(V(0, H.y + 0.03, H.z - 0.14), V(0, -0.3, -1), 0.055, 0.09, 0.022), SW.body, 'y', [0.4, 0.7]));

  // muzzle
  C.push(paint(hull([...cbox(V(0, H.y - 0.075, FZ + 0.0), 0.1, 0.055, 0.045, 0.028),
    V(0.05, H.y - 0.015, FZ - 0.01), V(-0.05, H.y - 0.015, FZ - 0.01), V(0, H.y - 0.03, FZ + 0.05)]), SW.muzzle, 'y', [0.5, 0.64]));
  // pink nose (inverted triangle)
  C.push(paint(hull([V(-0.034, H.y - 0.022, FZ + 0.052), V(0.034, H.y - 0.022, FZ + 0.052), V(0, H.y - 0.058, FZ + 0.056),
    V(-0.034, H.y - 0.022, FZ + 0.02), V(0.034, H.y - 0.022, FZ + 0.02), V(0, H.y - 0.058, FZ + 0.03)]), SW.nose, 'y'));
  // mouth
  C.push(paint(hull(cbox(V(0, H.y - 0.075, FZ + 0.048), 0.005, 0.018, 0.005, 0.002)), SW.mouth, 'flat'));
  S.push(paint(hull([V(0, H.y - 0.095, FZ + 0.05), V(0, H.y - 0.085, FZ + 0.05), V(0.04, H.y - 0.1, FZ + 0.048),
    V(0.04, H.y - 0.092, FZ + 0.048), V(0, H.y - 0.09, FZ + 0.035), V(0.04, H.y - 0.097, FZ + 0.035)]), SW.mouth, 'flat'));

  // fierce eyes
  const E = V(0.088, H.y + 0.03, 0);
  const ek = 1.15, sc = (a) => a.map(([u, v]) => [u * ek, v * ek]);
  S.push(paint(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.01, FZ + 0.012)), SW.white, 'flat'));
  S.push(paint(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.005, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.006, E.y + 0.003, 0), FZ + 0.014, FZ + 0.021)), SW.white, 'flat'));
  // heavy brow
  S.push(paint(hull([
    V(0.026, E.y + 0.012, FZ + 0.03), V(0.028, E.y + 0.05, FZ + 0.02),
    V(0.14, E.y + 0.05, FZ - 0.01), V(0.14, E.y + 0.088, FZ - 0.025),
    V(0.026, E.y + 0.012, FZ - 0.03), V(0.028, E.y + 0.06, FZ - 0.04),
    V(0.14, E.y + 0.05, FZ - 0.06), V(0.14, E.y + 0.09, FZ - 0.07),
  ]), SW.brow, 'y'));

  // ================= EARS (tall, upright, pink inner plate) =================
  {
    const base = V(0.085, H.y + 0.12, H.z - 0.03);
    const up = V(0.3, 1, -0.1).normalize();
    const nrm = V(0.25, 0, 1); nrm.addScaledVector(up, -nrm.dot(up)).normalize();
    const acr = new THREE.Vector3().crossVectors(up, nrm).normalize();
    const P = (u, v, w) => base.clone().addScaledVector(acr, u).addScaledVector(up, v).addScaledVector(nrm, w);
    const prof = [[0.0, 0.055], [0.1, 0.09], [0.24, 0.095], [0.36, 0.07], [0.45, 0.015]];
    const th = 0.03;
    const outer = [];
    for (const [v, hw] of prof) for (const s of [-1, 1]) for (const w of [-th, th]) outer.push(P(s * hw, v, w * (v > 0.42 ? 0.6 : 1)));
    S.push(paint(hull(outer), SW.body, 'y', [0.6, 1.2]));
    const inner = [];
    for (const [v, hw] of prof.slice(0, 4)) for (const s of [-1, 1]) for (const w of [th - 0.006, th + 0.007])
      inner.push(P(s * hw * 0.68, v * 0.95 + 0.03, w));
    inner.push(P(0, 0.42, th - 0.006), P(0, 0.42, th + 0.004));
    S.push(paint(hull(inner), SW.pink, 'y', [0.7, 1.2]));
  }

  // ================= PURPLE COLLAR RUFF =================
  const NK = { y: 0.41, z: 0.17 };
  const nRing = 12;
  for (let k = 0; k < nRing; k++) {
    const a = (k / nRing) * Math.PI * 2 + Math.PI / nRing; // 0 = +x
    const cx = Math.cos(a), cz = Math.sin(a);
    if (cx < -0.01) continue; // right side + centre handled
    const b = V(cx * 0.12, NK.y, NK.z + cz * 0.11);
    const d = V(cx, -0.55, cz);
    const g = petal(b, d, 0.055, 0.13, 0.02);
    const sw = (k % 2) ? SW.purple : SW.purpleD;
    S.push(paint(g, sw, 'y', [NK.y - 0.12, NK.y + 0.05]));
  }
  // second row lower, offset
  for (let k = 0; k < nRing; k++) {
    const a = ((k + 0.5) / nRing) * Math.PI * 2;
    const cx = Math.cos(a), cz = Math.sin(a);
    if (cx < 0.05 || cz < -0.3) continue;
    const b = V(cx * 0.12, NK.y - 0.05, NK.z + cz * 0.12);
    S.push(paint(petal(b, V(cx, -0.9, cz), 0.05, 0.12, 0.02), SW.purpleD, 'y', [NK.y - 0.16, NK.y]));
  }
  C.push(paint(petal(V(0, NK.y - 0.03, NK.z + 0.12), V(0, -0.8, 1), 0.055, 0.13, 0.02), SW.purple, 'y', [NK.y - 0.15, NK.y]));

  // ================= TAIL (big purple shard tuft, fanned up and back) =================
  const tl = (b, d, w, l, sw, lo = 0.12, hi = 0.66) => paint(petal(b, d, w * 0.9, l, w * 0.32), sw, 'y', [lo, hi]);
  const TC = V(0, 0.31, -0.36);
  C.push(paint(blob(1, TC, V(0.12, 0.12, 0.1), { jitter: 0.2 }), SW.purpleD, 'y', [0.18, 0.42]));
  // outer layer
  C.push(tl(V(0, 0.35, -0.36), V(0, 1, -0.4), 0.11, 0.3, SW.purple));
  C.push(tl(V(0, 0.32, -0.4), V(0, 0.55, -1), 0.11, 0.29, SW.purple));
  C.push(tl(V(0, 0.27, -0.4), V(0, -0.15, -1), 0.1, 0.24, SW.purpleD));
  for (const [b, d, w, l, sw] of [
    [V(0.04, 0.35, -0.35), V(0.45, 1, -0.35), 0.1, 0.27, SW.purple],
    [V(0.05, 0.33, -0.38), V(0.5, 0.6, -1), 0.1, 0.27, SW.purple],
    [V(0.06, 0.28, -0.38), V(0.6, -0.05, -1), 0.095, 0.23, SW.purpleD],
    [V(0.08, 0.34, -0.33), V(1, 0.75, -0.35), 0.09, 0.2, SW.purple],
    [V(0.08, 0.27, -0.33), V(1, -0.2, -0.45), 0.085, 0.17, SW.purpleD],
    [V(0.05, 0.24, -0.36), V(0.45, -0.75, -0.8), 0.08, 0.15, SW.purpleD],
  ]) S.push(tl(b, d, w, l, sw));
  // inner layer (shorter, lighter, fills the core)
  C.push(tl(V(0, 0.33, -0.42), V(0, 0.8, -0.8), 0.085, 0.2, SW.purple, 0.2, 0.6));
  S.push(tl(V(0.04, 0.33, -0.42), V(0.5, 0.35, -1), 0.08, 0.19, SW.purple, 0.2, 0.6));

  return assemble(C, S);
}

// Game name: MeshPart name in Roblox and the export file name
export const NAME = 'JabBunny';

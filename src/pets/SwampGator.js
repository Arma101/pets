// Swamp Gator (MYTHIC): chunky faceted dark-green alligator, pale banded belly, ridged back, strong tail,
// moss + bog roots, glowing green spots and markings, gold horns and claws.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  body:  { i: 0, top: '#2F7D3B', bot: '#143D20' },
  belly: { i: 1, top: '#FBF3CF', bot: '#E2D49A' },
  belly2:{ i: 2, top: '#CDBB7E', bot: '#A8955A' },
  scute: { i: 3, top: '#235F2D', bot: '#0F3018' },
  eye:   { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white: { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  gold:  { i: 6, top: '#FFE680', bot: '#E09A18' },
  brow:  { i: 7, top: '#2A7536', bot: '#143D20' },
  teeth: { i: 8, top: '#FFF8E2', bot: '#EBD5A2' },
  dark:  { i: 9, top: '#123A1A', bot: '#0A2410' },
  moss:  { i: 10, top: '#A9C84A', bot: '#6E9230' },
  root:  { i: 11, top: '#7A5232', bot: '#4A2E1A' },
  glow:  { i: 12, top: '#D2FF6E', bot: '#3DFF7A', glow: true },
  snout: { i: 13, top: '#348A40', bot: '#1C5228' },
};
const SW = PALETTE;

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const green = (pts, lo = 0.12, hi = 0.62) => paint(hull(pts), SW.body, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= TORSO (long, low, broad barrel) =================
  // [z, yc, rx, ry]
  const T = [
    [-0.31, 0.305, 0.2, 0.15],
    [-0.2, 0.32, 0.25, 0.17],
    [-0.06, 0.335, 0.27, 0.18],
    [0.08, 0.345, 0.26, 0.175],
    [0.18, 0.36, 0.22, 0.16],
    [0.26, 0.39, 0.165, 0.14],
  ];
  const tAt = (z) => {
    for (let k = 0; k < T.length - 1; k++) {
      const a = T[k], b = T[k + 1];
      if (z >= a[0] && z <= b[0]) { const f = (z - a[0]) / (b[0] - a[0]); return a.map((v, j) => v + (b[j] - v) * f); }
    }
    return z < T[0][0] ? T[0] : T[T.length - 1];
  };
  C.push(green(T.flatMap(([z, y, a, b]) => ring(V(0, y, z), a, b, 10, 'z', 0))));

  // pale banded belly: darker under-hull + segmented lighter scale bands
  C.push(paint(hull(T.slice(1).flatMap(([z, y, a, b]) => ring(V(0, y - 0.035, z + 0.01), a * 0.8, b * 0.82, 10, 'z', 0)
    .filter((p) => p.y < y))), SW.belly2, 'y', [0.15, 0.35]));
  for (let z = -0.22; z < 0.22; z += 0.085) {
    const z0 = z, z1 = z + 0.068;
    const pts = [];
    for (const zz of [z0, z1]) {
      const [, y, a, b] = tAt(zz);
      pts.push(...ring(V(0, y - 0.035, zz), a * 0.82, b * 0.84, 10, 'z', 0).filter((p) => p.y < y - 0.02));
    }
    C.push(paint(hull(pts), SW.belly, 'y', [0.15, 0.4]));
  }

  // neck (thick, merges torso into skull)
  C.push(green([...ring(V(0, 0.39, 0.2), 0.17, 0.145, 10, 'z', 0), ...ring(V(0, 0.46, 0.32), 0.17, 0.13, 10, 'z', 0)], 0.2, 0.62));

  // ================= LEGS (short, thick, splayed elbows-out, chunky feet, gold claws) =================
  const foot = (x, z, w, l) => {
    S.push(green([...cbox(V(x, 0.04, z), w, 0.04, l, 0.022), ...ring(V(x, 0.1, z - 0.01), w * 0.8, l * 0.75, 8, 'y')], 0.0, 0.3));
    for (const dx of [-0.06, -0.02, 0.02, 0.06].map((d) => d * w / 0.075)) {
      const cx = x + dx, cz = z + l;
      S.push(flat(hull([V(cx - 0.02, 0, cz - 0.03), V(cx + 0.02, 0, cz - 0.03), V(cx - 0.02, 0.045, cz - 0.03), V(cx + 0.02, 0.045, cz - 0.03),
        V(cx + dx * 0.25 - 0.007, 0, cz + 0.05), V(cx + dx * 0.25 + 0.007, 0, cz + 0.05), V(cx + dx * 0.25, 0.014, cz + 0.05)]), SW.gold));
    }
  };
  // front legs: upper arm sweeps out sideways to the elbow, thick forearm drops to the foot
  S.push(green([...ring(V(0.17, 0.35, 0.15), 0.095, 0.1, 8, 'x'), ...ring(V(0.33, 0.27, 0.16), 0.09, 0.095, 8, 'x')], 0.05, 0.55));
  S.push(green([...ring(V(0.335, 0.28, 0.16), 0.095, 0.09, 8), ...ring(V(0.35, 0.11, 0.17), 0.085, 0.08, 8)], 0.0, 0.5));
  foot(0.355, 0.2, 0.095, 0.085);
  // hind legs: big angular haunch, splayed shin
  S.push(green([...ring(V(0.16, 0.43, -0.17), 0.08, 0.12, 8, 'y'), ...ring(V(0.26, 0.31, -0.165), 0.1, 0.13, 8, 'y'), ...ring(V(0.31, 0.21, -0.16), 0.085, 0.095, 8, 'y')], 0.1, 0.55));
  S.push(green([...ring(V(0.315, 0.25, -0.16), 0.095, 0.095, 8), ...ring(V(0.35, 0.11, -0.16), 0.088, 0.085, 8)], 0.0, 0.5));
  foot(0.355, -0.13, 0.1, 0.09);

  // ================= TAIL (strong: hip-wide base, few big faceted hull segments, gentle downward arc) =================
  const TS = [ // [z, y, rx, ry]
    [-0.22, 0.325, 0.215, 0.16],
    [-0.4, 0.285, 0.18, 0.135],
    [-0.54, 0.205, 0.13, 0.1],
    [-0.64, 0.125, 0.08, 0.068],
    [-0.71, 0.085, 0.032, 0.032],
  ];
  for (let k = 0; k < TS.length - 1; k++) {
    const [z0, y0, a0, b0] = TS[k], [z1, y1, a1, b1] = TS[k + 1];
    const pts = [...ring(V(0, y0, z0), a0, b0, 10, 'z', 0), ...ring(V(0, y1, z1), a1, b1, 10, 'z', 0)];
    if (k === TS.length - 2) pts.push(V(0, y1 + 0.005, z1 - 0.035));
    C.push(paint(hull(pts), SW.body, 'y', [0.04, 0.5]));
  }
  // pale scaled underside of the tail
  for (let k = 0; k < 3; k++) {
    const [z0, y0, a0, b0] = TS[k], [z1, y1, a1, b1] = TS[k + 1];
    C.push(paint(hull([...ring(V(0, y0 - 0.03, z0 - 0.01), a0 * 0.66, b0 * 0.9, 10, 'z', 0).filter((p) => p.y < y0 - 0.03),
      ...ring(V(0, y1 - 0.02, z1 + 0.01), a1 * 0.66, b1 * 0.9, 10, 'z', 0).filter((p) => p.y < y1 - 0.02)]), SW.belly, 'y', [0.05, 0.3]));
  }
  const tailCurve = new THREE.CatmullRomCurve3(TS.map(([z, y]) => V(0, y, z)), false, 'centripetal');
  const tAtT = (t) => { const f = t * (TS.length - 1), k = Math.min(TS.length - 2, Math.floor(f)), u = f - k;
    return TS[k].map((v, j) => v + (TS[k + 1][j] - v) * u); };
  const tRX = (t) => tAtT(t)[2], tRY = (t) => tAtT(t)[3];

  // ================= RIDGED BACK (paired scute rows on body, single crest on tail) =================
  const scute = (x, y, z, l, w, h, sw = SW.scute) => paint(hull([
    V(x - w, y - 0.02, z - l), V(x + w, y - 0.02, z - l), V(x - w, y - 0.02, z + l), V(x + w, y - 0.02, z + l),
    V(x, y + h, z - l * 0.6), V(x, y + h, z + l * 0.25),
  ]), sw, 'y', [y - 0.02, y + h]);
  for (let z = -0.28; z <= 0.25; z += 0.075) {
    const [, y, , b] = tAt(z);
    const top = y + b;
    S.push(scute(0.06, top - 0.008, z, 0.032, 0.022, 0.05));
    S.push(scute(0.14, top - 0.045, z, 0.028, 0.02, 0.035));
  }
  for (let z = -0.245; z <= 0.22; z += 0.075) {
    const [, y, , b] = tAt(z), top = y + b - 0.006;
    C.push(flat(hull([V(0, top + 0.02, z), V(0.03, top, z), V(-0.03, top, z), V(0, top, z + 0.034), V(0, top, z - 0.034),
      V(0, top - 0.02, z)]), SW.glow));
  }
  for (let k = 0; k < 7; k++) {
    const t = 0.03 + k * 0.13, p = tailCurve.getPoint(t), tp = tAtT(t);
    const ry = tp[3], h = 0.08 * (1 - t * 0.6);
    if (k < 3) S.push(scute(0.05 * (1 - t), tp[1] + ry - 0.012, tp[0], 0.036, 0.022, h));
    else C.push(scute(0, tp[1] + ry - 0.012, tp[0], 0.04, 0.024, h));
  }

  // ================= HEAD (big skull + broad rounded alligator snout) =================
  const HC = [], HS = [];
  const SK = { y: 0.5, z: 0.43 };
  HC.push(green([...cbox(V(0, SK.y, SK.z), 0.175, 0.115, 0.11, 0.045), ...ring(V(0, SK.y + 0.13, SK.z - 0.02), 0.115, 0.075, 8, 'y')], 0.3, 0.68));
  const FZ = SK.z + 0.11;
  // upper jaw: broad, flat, U-shaped (rounded) front
  const snoutPts = [
    ...cbox(V(0, 0.455, 0.53), 0.16, 0.05, 0.05, 0.02),
    ...ring(V(0, 0.415, 0.67), 0.135, 0.11, 10, 'y', 0).filter((p) => p.z > 0.63),
    ...ring(V(0, 0.475, 0.66), 0.12, 0.1, 10, 'y', 0).filter((p) => p.z > 0.63),
  ];
  HC.push(paint(hull(snoutPts), SW.snout, 'y', [0.38, 0.5]));
  // nostril bump + nostrils
  HC.push(paint(hull(cbox(V(0, 0.48, 0.72), 0.06, 0.02, 0.03, 0.012)), SW.snout, 'y', [0.42, 0.52]));
  for (const x of [-0.028, 0.028]) HC.push(flat(hull(cbox(V(x, 0.5, 0.73), 0.01, 0.004, 0.01, 0.003)), SW.dark));
  // pale lower jaw (slightly narrower, under the upper)
  HC.push(paint(hull([
    ...cbox(V(0, 0.38, 0.535), 0.15, 0.04, 0.055, 0.02), V(0.14, 0.41, 0.47), V(-0.14, 0.41, 0.47),
    ...ring(V(0, 0.36, 0.65), 0.12, 0.1, 10, 'y', 0).filter((p) => p.z > 0.61),
    ...ring(V(0, 0.405, 0.65), 0.122, 0.1, 10, 'y', 0).filter((p) => p.z > 0.61),
  ]), SW.belly, 'y', [0.34, 0.42]));
  // dark mouth line
  HC.push(paint(hull([
    ...ring(V(0, 0.406, 0.65), 0.126, 0.104, 10, 'y', 0).filter((p) => p.z > 0.61),
    ...ring(V(0, 0.414, 0.65), 0.126, 0.104, 10, 'y', 0).filter((p) => p.z > 0.61),
    ...cbox(V(0, 0.41, 0.56), 0.152, 0.004, 0.06, 0.002),
  ]), SW.dark, 'flat'));
  // small teeth peeking down over the lip
  const tooth = (x, z) => flat(hull([V(x - 0.012, 0.418, z - 0.012), V(x + 0.012, 0.418, z - 0.012), V(x - 0.012, 0.418, z + 0.012),
    V(x + 0.012, 0.418, z + 0.012), V(x + 0.004, 0.385, z)]), SW.teeth);
  for (const z of [0.56, 0.62]) HS.push(tooth(0.132, z));
  HS.push(tooth(0.115, 0.67));

  // fierce eyes on skull front, heavy brow
  const E = V(0.088, 0.548, 0);
  const sc = (arr, k = 1.3) => arr.map(([u, v]) => [u * k, v * k]);
  HS.push(flat(hull(plate(sc([[-0.04, 0.004], [0.044, 0.032], [0.05, -0.008], [0.022, -0.036], [-0.028, -0.034], [-0.045, -0.016]]),
    E, FZ - 0.01, FZ + 0.01, 0.4)), SW.white));
  HS.push(flat(hull(plate(sc([[-0.025, 0.002], [0.014, 0.016], [0.02, -0.006], [0.006, -0.026], [-0.018, -0.024], [-0.028, -0.01]]),
    V(E.x - 0.003, E.y, 0), FZ + 0.004, FZ + 0.016, 0.4)), SW.eye));
  HS.push(flat(hull(plate(sc([[-0.006, -0.006], [0.006, -0.006], [0.006, 0.006], [-0.006, 0.006]]),
    V(E.x + 0.008, E.y + 0.005, 0), FZ + 0.012, FZ + 0.02, 0.4)), SW.white));
  HS.push(paint(hull([
    V(0.022, E.y + 0.016, FZ + 0.032), V(0.025, E.y + 0.056, FZ + 0.022),
    V(0.172, E.y + 0.058, FZ - 0.02), V(0.172, E.y + 0.1, FZ - 0.035),
    V(0.022, E.y + 0.016, FZ - 0.04), V(0.025, E.y + 0.066, FZ - 0.05),
    V(0.172, E.y + 0.058, FZ - 0.08), V(0.172, E.y + 0.1, FZ - 0.09),
  ]), SW.brow, 'y', [0.55, 0.66]));

  // gold horns sweeping back and up from the back of the skull
  HS.push(paint(tube(curveSamples([V(0.11, 0.6, 0.39), V(0.17, 0.645, 0.34), V(0.205, 0.67, 0.26), V(0.215, 0.71, 0.18)], 6,
    (t) => 0.04 * (1 - t) + 0.006), { seg: 6, capEnd: 0.02, axis: V(1, 0, 0.3) }), SW.gold, 'len'));
  HS.push(paint(tube(curveSamples([V(0.15, 0.52, 0.36), V(0.21, 0.55, 0.32), V(0.25, 0.6, 0.29)], 5,
    (t) => 0.028 * (1 - t) + 0.005), { seg: 5, capEnd: 0.015 }), SW.gold, 'len'));

  // glowing forehead gem (gold setting) + glowing markings
  HC.push(flat(hull([V(0, 0.665, 0.47), V(0.035, 0.635, 0.475), V(-0.035, 0.635, 0.475), V(0, 0.6, 0.5),
    V(0, 0.66, 0.42), V(0.035, 0.63, 0.43), V(-0.035, 0.63, 0.43)]), SW.gold));
  HC.push(flat(hull([V(0, 0.672, 0.465), V(0.022, 0.645, 0.478), V(-0.022, 0.645, 0.478), V(0, 0.618, 0.495), V(0, 0.65, 0.45)]), SW.glow));
  // glow stripes on snout top
  for (const [z, w] of [[0.6, 0.05], [0.66, 0.04]])
    HC.push(flat(hull(cbox(V(0, 0.503 - (z - 0.62) * 0.15, z), w, 0.006, 0.012, 0.004)), SW.glow));

  // glowing cheek slashes on the skull sides
  for (const [y, z, l] of [[0.53, 0.44, 0.05], [0.49, 0.42, 0.04]])
    HS.push(flat(hull([V(0.172, y + 0.008, z + l), V(0.172, y - 0.008, z + l), V(0.172, y + 0.016, z - l), V(0.172, y, z - l),
      V(0.182, y + 0.004, z + l * 0.8), V(0.182, y + 0.01, z - l * 0.8)]), SW.glow));
  // glowing spots on top of the skull
  for (const [x, z, r] of [[0.1, 0.43, 0.026], [0.13, 0.37, 0.02]])
    HS.push(flat(hull([...ring(V(x, 0.612, z), r, r * 0.85, 6, 'y'), ...ring(V(x, 0.625, z), r * 0.75, r * 0.6, 6, 'y'), V(x, 0.598, z)]), SW.glow));
  // moss tuft on head back
  HC.push(paint(blob(0, V(0, 0.615, 0.35), V(0.09, 0.03, 0.06), { jitter: 0.25 }), SW.moss, 'y', [0.58, 0.65]));

  // big-head scale about the neck joint
  const HP = V(0, 0.42, 0.36), HSC = 1.4;
  for (const g of [...HC, ...HS]) { g.translate(-HP.x, -HP.y, -HP.z); g.scale(HSC, HSC, HSC); g.translate(HP.x, HP.y + 0.035, HP.z - 0.085); }
  C.push(...HC); S.push(...HS);

  // ================= GLOWING SPOTS on flanks + tail =================
  const spot = (z, ang, r) => {
    const [, y, a, b] = tAt(z);
    const p = V(Math.cos(ang) * a, y + Math.sin(ang) * b, z);
    const n = V(Math.cos(ang) / a, Math.sin(ang) / b, 0).normalize();
    return flat(hull([...ring(V(0, 0, 0), r, r * 0.8, 6, 'z').map((q) => {
      // orient ring plane to the normal
      const m = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), n);
      return q.applyQuaternion(m).add(p).addScaledVector(n, -0.01);
    }), p.clone().addScaledVector(n, 0.012)]), SW.glow);
  };
  for (const [z, ang, r] of [[0.1, 0.8, 0.045], [-0.04, 0.55, 0.052], [-0.15, 0.9, 0.04], [-0.26, 0.5, 0.045], [0.04, 0.2, 0.036], [-0.12, 0.25, 0.034], [0.2, 0.45, 0.034]])
    S.push(spot(z, ang, r));
  // glowing tail stripe spots
  for (const t of [0.12, 0.36, 0.58]) {
    const p = tailCurve.getPoint(t), rx = tRX(t), ry = tRY(t);
    const tp = tAtT(t); S.push(flat(hull(cbox(V(tp[2] * 0.62, tp[1] + tp[3] * 0.6, tp[0]), 0.032, 0.016, 0.034, 0.008)), SW.glow));
  }

  // gold cuff near the tail tip (Mythic trim)
  {
    const t0 = 0.66, t1 = 0.74, q0 = tAtT(t0), q1 = tAtT(t1), p0 = V(0, q0[1], q0[0]), p1 = V(0, q1[1], q1[0]);
    C.push(paint(hull([...ring(p0, tRX(t0) + 0.014, tRY(t0) + 0.014, 8, 'z'), ...ring(p1, tRX(t1) + 0.014, tRY(t1) + 0.014, 8, 'z')]),
      SW.gold, 'y', [p1.y - 0.04, p0.y + 0.05]));
  }
  // ================= MOSS + BOG ROOTS =================
  // moss patches over shoulders and hips, drooping strands
  S.push(paint(blob(1, V(0.17, 0.5, 0.12), V(0.1, 0.04, 0.1), { jitter: 0.3 }), SW.moss, 'y', [0.45, 0.55]));
  S.push(paint(blob(1, V(0.16, 0.48, -0.17), V(0.095, 0.04, 0.09), { jitter: 0.3 }), SW.moss, 'y', [0.42, 0.52]));
  for (const [b, d, w, l] of [
    [V(0.24, 0.47, 0.15), V(0.7, -1, 0.1), 0.026, 0.07],
    [V(0.22, 0.46, 0.07), V(0.6, -1, -0.1), 0.022, 0.06],
    [V(0.24, 0.46, 0.2), V(0.6, -1, 0.4), 0.02, 0.055],
    [V(0.23, 0.45, -0.17), V(0.7, -1, 0), 0.024, 0.065],
    [V(0.225, 0.45, -0.1), V(0.7, -1, 0.2), 0.02, 0.05],
    [V(0.215, 0.44, -0.24), V(0.6, -1, -0.3), 0.02, 0.055],
  ]) S.push(paint(shard(b, d, w, l), SW.moss, 'flat'));
  // gnarled bog roots twisted round the forearms: two overlapping wobbly loops + a short stub root
  const loop = (c, r, tilt, ph, thick, n = 7) => {
    const pts = [];
    for (let k = 0; k <= n; k++) {
      const a = ph + (2 * Math.PI * k) / n, w = 1 + 0.12 * Math.sin(a * 3 + ph);
      pts.push(V(c.x + Math.cos(a) * r * w, c.y + Math.sin(a) * tilt + 0.01 * Math.cos(a * 2), c.z + Math.sin(a) * r * w));
    }
    return paint(tube(pts.map((q, k) => ({ p: q, rx: thick * (k % 2 ? 1.25 : 0.85), ry: thick })), { seg: 5 }), SW.root, 'flat');
  };
  const FA = V(0.345, 0.17, 0.165);
  S.push(loop(FA, 0.09, 0.03, 0, 0.02));
  S.push(loop(V(FA.x, FA.y + 0.035, FA.z), 0.094, -0.035, 1.3, 0.017));
  S.push(paint(tube(curveSamples([V(FA.x + 0.07, FA.y + 0.01, FA.z + 0.04), V(FA.x + 0.1, FA.y - 0.02, FA.z + 0.06), V(FA.x + 0.105, FA.y - 0.06, FA.z + 0.075)], 4,
    (t) => 0.019 * (1 - t) + 0.005), { seg: 5, capEnd: 0.01 }), SW.root, 'len'));
  // roots draped over the shoulders from the spine, tangled into the moss
  S.push(paint(tube(curveSamples([V(0.02, 0.53, 0.1), V(0.12, 0.515, 0.09), V(0.21, 0.465, 0.1), V(0.26, 0.39, 0.12), V(0.29, 0.33, 0.15)], 7,
    (t) => 0.024 * (1 - 0.5 * t) + 0.004 * Math.sin(t * 20)), { seg: 5, capEnd: 0.01 }), SW.root, 'len'));
  S.push(paint(tube(curveSamples([V(0.17, 0.5, 0.1), V(0.21, 0.465, 0.05), V(0.245, 0.42, 0.02)], 4, (t) => 0.016 * (1 - t) + 0.005),
    { seg: 5, capEnd: 0.01 }), SW.root, 'len'));
  return assemble(C, S);
}

// Croc Crusher (Godly, Round 6 – Swamp Slam): big beefy mid-green crocodile with heavy toothy jaws,
// big back spikes, a crown of twisted swamp wood with moss, bog roots, glowing green spots,
// glowing runes and ornate gold armour (shoulder pauldrons, jaw trim, snout band).
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  body:  { i: 0, top: '#62CC48', bot: '#2C8A2C' },
  belly: { i: 1, top: '#EEF0A6', bot: '#C6C968' },
  spike: { i: 2, top: '#C8EC52', bot: '#78B22C' },
  claw:  { i: 3, top: '#FFF1D2', bot: '#E2C48E' },
  eye:   { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white: { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  mouth: { i: 6, top: '#6A1E1E', bot: '#3A0E10' },
  brow:  { i: 7, top: '#3FAE3A', bot: '#1F7426' },
  teeth: { i: 8, top: '#FFF8E2', bot: '#EBD5A2' },
  dark:  { i: 9, top: '#24702A', bot: '#14501C' },
  wood:  { i: 10, top: '#8A5E38', bot: '#3E2716' },
  moss:  { i: 11, top: '#A6DA4C', bot: '#5E9E2C' },
  gold:  { i: 12, top: '#FFE36E', bot: '#D0961C' },
  rune:  { i: 13, top: '#C8FFB0', bot: '#4CFF7A', glow: true },
  spot:  { i: 14, top: '#B8FF6A', bot: '#46F24A', glow: true },
  root:  { i: 15, top: '#6A4A2C', bot: '#2E1D10' },
};
const SW = PALETTE;

const flat = (g, sw) => paint(g, sw, 'flat');

// chunky claw with a flat bottom on y = y0 pointing along (dx, dz)
function claw(x, y0, z, w, h, len, dx = 0) {
  return hull([
    V(x - w, y0, z), V(x + w, y0, z), V(x - w, y0 + h, z), V(x + w, y0 + h, z),
    V(x - w * 0.8, y0, z - 0.03), V(x + w * 0.8, y0, z - 0.03), V(x - w * 0.8, y0 + h, z - 0.03), V(x + w * 0.8, y0 + h, z - 0.03),
    V(x + dx - w * 0.3, y0, z + len), V(x + dx + w * 0.3, y0, z + len), V(x + dx, y0 + h * 0.3, z + len),
  ]);
}

// flat thin polygon laid on a surface: centre c, normal n, 2D points in its plane, thickness t
function decal(c, n, pts2d, t = 0.006, upHint = V(0, 1, 0)) {
  const N = n.clone().normalize();
  let U = new THREE.Vector3().crossVectors(upHint, N);
  if (U.lengthSq() < 1e-6) U = V(1, 0, 0);
  U.normalize();
  const W = new THREE.Vector3().crossVectors(N, U).normalize();
  const out = [];
  for (const [u, v] of pts2d) for (const d of [-t, t])
    out.push(c.clone().addScaledVector(U, u).addScaledVector(W, v).addScaledVector(N, d));
  return hull(out);
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const green = (pts, lo = 0.12, hi = 0.75) => paint(hull(pts), SW.body, 'y', [lo, hi]);

  // ================= BODY (wide, beefy, low barrel) =================
  const BODY = [
    // z, y, rx, ry
    [-0.36, 0.33, 0.19, 0.14],
    [-0.28, 0.36, 0.27, 0.19],
    [-0.1, 0.38, 0.31, 0.215],
    [0.1, 0.4, 0.3, 0.21],
    [0.26, 0.43, 0.23, 0.18],
    [0.36, 0.45, 0.16, 0.14],
  ];
  C.push(green(BODY.flatMap(([z, y, a, b]) => ring(V(0, y, z), a, b, 10, 'z', Math.PI / 10))));
  // pale belly slab underneath
  C.push(paint(hull(BODY.slice(1, 5).flatMap(([z, y, a, b]) => ring(V(0, y - 0.035, z), a * 0.72, b * 0.88, 10, 'z', Math.PI / 10))),
    SW.belly, 'y', [0.15, 0.4]));

  // ================= LEGS (short, thick, sprawled, planted) =================
  const leg = (x, z, front) => {
    const sh = V(0.2, 0.36, z), el = V(x, 0.24, z + (front ? 0.02 : -0.02)), an = V(x + 0.01, 0.08, z + 0.02);
    S.push(green([...ring(sh, 0.13, 0.13, 8, 'x'), ...ring(el, 0.115, 0.115, 8, 'y')], 0.05, 0.6));
    S.push(green([...ring(el, 0.112, 0.112, 8, 'y'), ...ring(an, 0.1, 0.1, 8, 'y')], 0.05, 0.6));
    // foot: broad slab + 4 cream claws
    S.push(green([...ring(V(an.x, 0.1, an.z), 0.095, 0.095, 8, 'y'), ...cbox(V(an.x + 0.01, 0.04, an.z + 0.04), 0.12, 0.04, 0.11, 0.025)], 0.0, 0.5));
    for (const dx of [-0.075, -0.025, 0.025, 0.075])
      S.push(flat(claw(an.x + 0.01 + dx, 0, an.z + 0.13, 0.022, 0.04, 0.06, dx * 0.4), SW.claw));
  };
  leg(0.33, 0.2, true);
  leg(0.34, -0.24, false);

  // ================= TAIL (thick, tall-sided, sweeping back to the ground) =================
  const tailPts = [V(0, 0.35, -0.29), V(0, 0.29, -0.44), V(0, 0.2, -0.57), V(0, 0.12, -0.655), V(0, 0.07, -0.74)];
  const tRX = (t) => 0.2 * (1 - t) + 0.02, tRY = (t) => 0.17 * (1 - t) + 0.022;
  C.push(paint(tube(curveSamples(tailPts, 8, tRX, tRY), { seg: 8, axis: X, capEnd: 0.03, phase: Math.PI / 8 }), SW.body, 'y', [0.0, 0.5]));
  const tailCurve = new THREE.CatmullRomCurve3(tailPts, false, 'centripetal');
  const tailAt = (t) => ({ p: tailCurve.getPoint(t), rx: tRX(t), ry: tRY(t) });

  // ================= BACK SPIKES (big double row of scute spikes + tail ridge) =================
  const spikeRow = [
    // z, y (top of body), height
    [0.22, 0.6, 0.14], [0.05, 0.6, 0.18], [-0.12, 0.58, 0.18], [-0.27, 0.535, 0.15], [-0.35, 0.48, 0.12],
  ];
  for (const [z, y, h] of spikeRow) {
    S.push(paint(shard(V(0.11, y - 0.02, z), V(0.35, 1, -0.3), 0.075, h * 1.05, 4, 0.55), SW.spike, 'y', [y - 0.04, y + h]));
  }
  // centre ridge between the rows (smaller)
  for (const [z, y, h] of spikeRow.slice(0, 4))
    C.push(paint(shard(V(0, y + 0.0, z - 0.09), V(0, 1, -0.3), 0.055, h * 0.65, 4, 0.5), SW.spike, 'y', [y - 0.04, y + h]));
  // tail: double then single ridge
  for (const t of [0.04, 0.36]) {
    const { p, rx, ry } = tailAt(t);
    S.push(paint(shard(V(rx * 0.42, p.y + ry * 0.8, p.z), V(0.3, 1, -0.5), 0.06 * (1.2 - t), 0.14 * (1.15 - t), 4, 0.55), SW.spike, 'y', [p.y, p.y + 0.15]));
  }
  for (const t of [0.52, 0.68, 0.83]) {
    const { p, ry } = tailAt(t);
    C.push(paint(shard(V(0, p.y + ry * 0.8, p.z), V(0, 1, -0.8), 0.06 * (1.3 - t), 0.16 * (1.2 - t), 4, 0.5), SW.spike, 'y', [p.y, p.y + 0.12]));
  }

  const c0 = C.length, s0 = S.length;
  // ================= NECK + HEAD (big skull, long heavy toothy jaws) =================
  C.push(green([...ring(V(0, 0.45, 0.3), 0.21, 0.17, 10, 'z', Math.PI / 10), ...ring(V(0, 0.5, 0.48), 0.2, 0.15, 10, 'z', Math.PI / 10)], 0.15, 0.8));
  const SK = { y: 0.56, z: 0.52 };
  C.push(green([...cbox(V(0, SK.y, SK.z + 0.06), 0.22, 0.15, 0.09, 0.05), ...cbox(V(0, SK.y - 0.015, SK.z - 0.1), 0.18, 0.12, 0.05, 0.04)], 0.3, 0.75));
  const FZ = SK.z + 0.15; // skull front face
  // upper jaw: wide at the skull, tapering to a broad nose pad
  const UJ = { yB: 0.43, yT: 0.55, z0: 0.6, z1: 0.86 };
  const uw = (z) => 0.19 + (0.115 - 0.19) * (z - UJ.z0) / (UJ.z1 - UJ.z0); // half width at z
  C.push(green([
    ...[[UJ.z0, UJ.yT], [UJ.z1, UJ.yT - 0.035]].flatMap(([z, yt]) => [
      V(uw(z), UJ.yB, z), V(-uw(z), UJ.yB, z), V(uw(z) - 0.03, yt, z), V(-uw(z) + 0.03, yt, z), V(uw(z), yt - 0.03, z), V(-uw(z), yt - 0.03, z)]),
    V(0.1, UJ.yB, UJ.z1 + 0.03), V(-0.1, UJ.yB, UJ.z1 + 0.03), V(0.08, UJ.yT - 0.05, UJ.z1 + 0.03), V(-0.08, UJ.yT - 0.05, UJ.z1 + 0.03),
  ], 0.3, 0.7));
  // nose bump + nostrils on top of the snout tip
  C.push(green(cbox(V(0, UJ.yT - 0.02, UJ.z1 - 0.04), 0.075, 0.03, 0.05, 0.015), 0.3, 0.7));
  for (const x of [-0.032, 0.032]) C.push(flat(hull(cbox(V(x, UJ.yT + 0.01, UJ.z1 - 0.03), 0.012, 0.004, 0.01, 0.002)), SW.dark));
  // lower jaw: heavy, slightly dropped, pale underside
  const LJ = { yB: 0.27, yT: 0.405, z0: 0.42, z1: 0.84 };
  const lw = (z) => 0.2 + (0.105 - 0.2) * (z - LJ.z0) / (LJ.z1 - LJ.z0);
  C.push(green([
    ...[[LJ.z0, LJ.yB + 0.01], [0.66, LJ.yB], [LJ.z1, LJ.yB + 0.03]].flatMap(([z, yb]) => [
      V(lw(z), LJ.yT, z), V(-lw(z), LJ.yT, z), V(lw(z), yb + 0.03, z), V(-lw(z), yb + 0.03, z), V(lw(z) - 0.04, yb, z), V(-lw(z) + 0.04, yb, z)]),
  ], 0.28, 0.5));
  C.push(paint(hull([
    ...[[0.5, LJ.yB - 0.008], [0.81, LJ.yB + 0.01]].flatMap(([z, yb]) => [
      V(lw(z) - 0.035, yb, z), V(-lw(z) + 0.035, yb, z), V(lw(z) - 0.01, yb + 0.04, z), V(-lw(z) + 0.01, yb + 0.04, z)]),
  ]), SW.belly, 'y', [0.28, 0.36]));
  // dark mouth line between the jaws
  C.push(flat(hull([V(lw(0.55) - 0.02, LJ.yT - 0.01, 0.55), V(-lw(0.55) + 0.02, LJ.yT - 0.01, 0.55), V(uw(0.6) - 0.012, UJ.yB + 0.01, 0.55), V(-uw(0.6) + 0.012, UJ.yB + 0.01, 0.55),
    V(lw(0.83) - 0.012, LJ.yT - 0.01, 0.84), V(-lw(0.83) + 0.012, LJ.yT - 0.01, 0.84), V(uw(0.86) - 0.01, UJ.yB + 0.01, 0.86), V(-uw(0.86) + 0.01, UJ.yB + 0.01, 0.86)]), SW.mouth));
  // interlocking teeth along both jaws (visible on the outside like a real croc)
  const tooth = (x, y, z, dy, w = 0.016) => flat(hull([V(x - w, y, z - w), V(x + w * 0.4, y, z - w), V(x - w, y, z + w),
    V(x + w * 0.4, y, z + w), V(x + w * 0.3, y + dy, z)]), SW.teeth);
  for (const z of [0.64, 0.705, 0.77, 0.83]) S.push(tooth(uw(z) + 0.004, UJ.yB + 0.012, z, -0.06));
  for (const z of [0.675, 0.74, 0.805]) S.push(tooth(lw(z) + 0.004, LJ.yT - 0.012, z, 0.055));
  S.push(tooth(0.05, UJ.yB + 0.01, UJ.z1 + 0.02, -0.05, 0.014)); // front fang
  // gold jaw trim: band over the snout + plates along the lower jaw + ornate cheek disc
  C.push(paint(hull([
    ...[0.7, 0.745].flatMap((z) => [V(uw(z) + 0.012, UJ.yB + 0.03, z), V(-uw(z) - 0.012, UJ.yB + 0.03, z), V(uw(z) - 0.015, UJ.yT + 0.012, z),
      V(-uw(z) + 0.015, UJ.yT + 0.012, z), V(uw(z) + 0.012, UJ.yT - 0.02, z), V(-uw(z) - 0.012, UJ.yT - 0.02, z)]),
  ]), SW.gold, 'y', [0.42, 0.57]));
  C.push(flat(decal(V(0, UJ.yT + 0.016, 0.7225), V(0, 1, 0.05), [[0, 0.03], [0.022, 0], [0, -0.03], [-0.022, 0]], 0.006, V(0, 0, 1)), SW.rune));
  S.push(paint(hull([0.5, 0.66].flatMap((z, k) => [V(lw(z) + 0.008, LJ.yT - 0.022, z), V(lw(z) + 0.008, LJ.yT - 0.06 + k * 0.01, z),
    V(lw(z) - 0.02, LJ.yT - 0.022, z), V(lw(z) - 0.02, LJ.yT - 0.06 + k * 0.01, z)])), SW.gold, 'y', [0.3, 0.42]));

  // fierce eyes on the skull front, heavy brow
  const E = V(0.105, 0.612, 0);
  S.push(flat(hull(plate([[-0.0625, 0.0075], [0.0675, 0.0500], [0.0775, -0.0150], [0.0325, -0.0575], [-0.0425, -0.0550], [-0.0688, -0.0250]],
    E, FZ - 0.01, FZ + 0.012, 0.35)), SW.white));
  S.push(flat(hull(plate([[-0.0375, 0.0050], [0.0200, 0.0250], [0.0300, -0.0100], [0.0088, -0.0425], [-0.0275, -0.0387], [-0.0425, -0.0150]],
    V(E.x - 0.004, E.y - 0.002, 0), FZ + 0.006, FZ + 0.02, 0.35)), SW.eye));
  S.push(flat(hull(plate([[-0.0100, -0.0100], [0.0100, -0.0100], [0.0100, 0.0100], [-0.0100, 0.0100]],
    V(E.x + 0.004, E.y + 0.002, 0), FZ + 0.016, FZ + 0.025, 0.35)), SW.white));
  S.push(paint(hull([
    V(0.03, E.y + 0.012, FZ + 0.035), V(0.032, E.y + 0.055, FZ + 0.025),
    V(0.2, E.y + 0.06, FZ - 0.03), V(0.2, E.y + 0.105, FZ - 0.045),
    V(0.03, E.y + 0.012, FZ - 0.03), V(0.032, E.y + 0.065, FZ - 0.04),
    V(0.2, E.y + 0.06, FZ - 0.09), V(0.2, E.y + 0.105, FZ - 0.1),
  ]), SW.brow, 'y', [0.6, 0.73]));

  // ================= SWAMP-WOOD CROWN (twisted dark wood spikes, moss, glowing gem) =================
  const CR = { y: SK.y + 0.15, z: SK.z - 0.01 };
  C.push(paint(hull([...ring(V(0, CR.y - 0.02, CR.z), 0.15, 0.12, 8, 'y'), ...ring(V(0, CR.y + 0.05, CR.z), 0.16, 0.13, 8, 'y')]), SW.wood, 'y', [CR.y - 0.03, CR.y + 0.06]));
  const woodSpike = (base, tip, mid, r) => tube(curveSamples([base, mid, tip], 5, (t) => r * 1.25 * (1 - 0.85 * t)),
    { seg: 5, capEnd: 0.0, twist: (i) => i * 0.5, axis: null });
  // centre front + back spikes
  C.push(paint(woodSpike(V(0, CR.y + 0.03, CR.z + 0.11), V(0, CR.y + 0.24, CR.z + 0.16), V(0.0, CR.y + 0.14, CR.z + 0.11), 0.04), SW.wood, 'len'));
  C.push(paint(woodSpike(V(0, CR.y + 0.03, CR.z - 0.11), V(0, CR.y + 0.17, CR.z - 0.17), V(0, CR.y + 0.11, CR.z - 0.12), 0.034), SW.wood, 'len'));
  for (const [a, h, r] of [[0.75, 0.21, 0.036], [0.0, 0.19, 0.034], [-0.75, 0.15, 0.03]]) {
    const bx = Math.cos(a) * 0.14, bz = CR.z + Math.sin(a) * 0.11;
    S.push(paint(woodSpike(V(bx, CR.y + 0.03, bz), V(bx + 0.07, CR.y + h, bz + Math.sin(a) * 0.03),
      V(bx + 0.02, CR.y + h * 0.55, bz), r), SW.wood, 'len'));
  }
  // glowing gem at the crown front
  C.push(flat(hull([V(0, CR.y + 0.075, CR.z + 0.14), V(0, CR.y - 0.03, CR.z + 0.15), V(0.035, CR.y + 0.02, CR.z + 0.145), V(-0.035, CR.y + 0.02, CR.z + 0.145),
    V(0, CR.y + 0.02, CR.z + 0.175)]), SW.rune));
  // moss clumps draped on the crown band
  S.push(paint(blob(0, V(0.13, CR.y + 0.04, CR.z + 0.06), V(0.045, 0.03, 0.05), { jitter: 0.3 }), SW.moss, 'y', [CR.y, CR.y + 0.07]));
  S.push(paint(blob(0, V(0.155, CR.y + 0.0, CR.z - 0.02), V(0.035, 0.04, 0.05), { jitter: 0.3 }), SW.moss, 'y', [CR.y - 0.04, CR.y + 0.05]));
  S.push(paint(blob(0, V(0.12, CR.y + 0.035, CR.z - 0.08), V(0.04, 0.03, 0.045), { jitter: 0.3 }), SW.moss, 'y', [CR.y, CR.y + 0.07]));
  C.push(paint(blob(0, V(0, CR.y + 0.055, CR.z - 0.11), V(0.05, 0.03, 0.04), { jitter: 0.3 }), SW.moss, 'y', [CR.y, CR.y + 0.08]));
  // hanging bog roots from the crown band
  S.push(paint(tube(curveSamples([V(0.15, CR.y, CR.z + 0.02), V(0.2, CR.y - 0.06, CR.z + 0.01), V(0.215, CR.y - 0.13, CR.z + 0.03)], 4,
    (t) => 0.026 * (1 - 0.5 * t)), { seg: 5, capEnd: 0.012 }), SW.root, 'len'));
  // ornate gold cheek plate on the skull side with a glowing diamond + slash rune
  {
    const pz = SK.z + 0.055, py = SK.y - 0.02;
    const hex = [[-0.07, 0], [-0.04, 0.065], [0.04, 0.065], [0.07, 0], [0.04, -0.065], [-0.04, -0.065]];
    S.push(paint(hull(hex.flatMap(([u, v]) => [V(0.234, py + v * 0.92, pz + u * 0.92), V(0.185, py + v, pz + u)])), SW.gold, 'y', [py - 0.07, py + 0.07]));
    const n = V(1, 0, 0);
    S.push(flat(decal(V(0.237, py + 0.002, pz + 0.018), n, [[0, 0.04], [0.024, 0], [0, -0.04], [-0.024, 0]], 0.005), SW.rune));
    S.push(flat(decal(V(0.237, py, pz - 0.032), n, [[-0.006, -0.042], [0.008, -0.042], [0.022, 0.042], [0.008, 0.042]], 0.005), SW.rune));
  }

  // scale the whole head + crown up about the neck (big-head proportions)
  const HP = V(0, 0.45, 0.36), HSC = 1.22;
  for (const g of [...C.slice(c0), ...S.slice(s0)]) {
    g.translate(-HP.x, -HP.y, -HP.z); g.scale(HSC, HSC, HSC); g.translate(HP.x, HP.y + 0.02, HP.z - 0.07);
  }

  // ================= GOLD ARMOUR (ornate shoulder pauldrons with runes) =================
  const arcPlate = (P, R, t0, t1, hz, n = 5) => {
    const pts = [V(P.x, P.y, P.z - hz * 0.8), V(P.x, P.y, P.z + hz * 0.8)];
    for (let k = 0; k <= n; k++) {
      const t = t0 + (t1 - t0) * k / n, e = (k === 0 || k === n) ? 0.75 : 1;
      for (const sz of [-1, 1]) pts.push(V(P.x + Math.cos(t) * R, P.y + Math.sin(t) * R, P.z + sz * hz * e));
    }
    return hull(pts);
  };
  const SP = V(0.17, 0.36, 0.195);
  S.push(paint(arcPlate(SP.clone().add(V(0.0, -0.035, 0)), 0.19, -0.35, 0.35, 0.1), SW.gold, 'y', [0.28, 0.5]));
  S.push(paint(arcPlate(SP, 0.2, 0.25, 1.35, 0.125), SW.gold, 'y', [0.38, 0.58]));
  // gold rim spikes on the pauldron
  S.push(paint(shard(V(SP.x + 0.1, SP.y + 0.17, SP.z), V(0.5, 1, 0), 0.04, 0.08), SW.gold, 'y', [0.45, 0.65]));
  S.push(paint(shard(V(SP.x + 0.16, SP.y + 0.1, SP.z + 0.08), V(0.8, 0.6, 0.5), 0.03, 0.06), SW.gold, 'y', [0.45, 0.65]));
  S.push(paint(shard(V(SP.x + 0.16, SP.y + 0.1, SP.z - 0.08), V(0.8, 0.6, -0.5), 0.03, 0.06), SW.gold, 'y', [0.45, 0.65]));
  // glowing rune on its outer face
  {
    const t = 0.72, n = V(Math.cos(t), Math.sin(t), 0), rc = SP.clone().addScaledVector(n, 0.2 * Math.cos(0.11) + 0.004);
    S.push(flat(decal(rc, n, [[0, 0.04], [0.026, 0], [0, -0.04], [-0.026, 0]], 0.006, V(0, 0, 1)), SW.rune));
    S.push(flat(decal(rc.clone().addScaledVector(n, 0.002), n, [[-0.006, 0.065], [0.006, 0.065], [0.006, -0.065], [-0.006, -0.065]], 0.006, V(0, 0, 1)), SW.rune));
  }
  // gold armour plate on the back between the spike rows, with rune line
  C.push(paint(hull([...cbox(V(0, 0.6, -0.04), 0.075, 0.018, 0.14, 0.01), V(0, 0.625, 0.1), V(0, 0.625, -0.18)]), SW.gold, 'y', [0.58, 0.63]));
  C.push(flat(decal(V(0, 0.63, -0.04), V(0, 1, 0), [[0, 0.1], [0.025, 0.05], [0.012, 0], [0.025, -0.05], [0, -0.1], [-0.025, -0.05], [-0.012, 0], [-0.025, 0.05]], 0.006, V(0, 0, 1)), SW.rune));
  // gold tail band with rune
  {
    const { p, rx, ry } = tailAt(0.2);
    C.push(paint(hull([...ring(V(0, p.y, p.z + 0.03), rx + 0.015, ry + 0.015, 8, 'z'), ...ring(V(0, p.y, p.z - 0.03), rx + 0.012, ry + 0.012, 8, 'z')]), SW.gold, 'y', [p.y - ry, p.y + ry]));
  }

  // ================= SWAMP DETAILS: glowing spots, moss, bog roots =================
  // glowing green spots on the flanks and tail
  const spot = (c, n, r) => S.push(flat(decal(c, n, [[r, 0], [r * 0.5, r * 0.85], [-r * 0.5, r * 0.85], [-r, 0], [-r * 0.5, -r * 0.85], [r * 0.5, -r * 0.85]], 0.006), SW.spot));
  for (const [z, dy, r] of [[-0.1, 0.07, 0.042], [-0.23, -0.01, 0.034], [0.02, -0.03, 0.03], [-0.31, 0.08, 0.028]]) {
    // body ring at z: find radius
    let k = 0; while (k < BODY.length - 2 && BODY[k + 1][0] < z) k++;
    const [z0, y0, a0, b0] = BODY[k], [z1, y1, a1, b1] = BODY[k + 1], f = (z - z0) / (z1 - z0);
    const y = y0 + (y1 - y0) * f, a = a0 + (a1 - a0) * f, b = b0 + (b1 - b0) * f;
    const ang = Math.asin(Math.max(-1, Math.min(1, dy / b)));
    const px = a * Math.cos(ang) * 0.96, py = y + dy;
    spot(V(px, py, z), V(Math.cos(ang) / a, Math.sin(ang) / b, 0), r);
  }
  for (const t of [0.5]) {
    const { p, rx } = tailAt(t);
    spot(V(rx * 0.96, p.y + 0.01, p.z), V(1, 0.1, 0), 0.034 * (1.2 - t));
  }
  // moss patches on the back between spikes and on the haunches
  C.push(paint(blob(1, V(0, 0.585, 0.2), V(0.07, 0.03, 0.06), { jitter: 0.3 }), SW.moss, 'y', [0.56, 0.62]));
  S.push(paint(blob(0, V(0.2, 0.52, -0.25), V(0.07, 0.035, 0.07), { jitter: 0.3 }), SW.moss, 'y', [0.48, 0.56]));
  { const { p, ry } = tailAt(0.44); C.push(paint(blob(0, V(0, p.y + ry * 0.92, p.z - 0.04), V(0.06, 0.03, 0.06), { jitter: 0.3 }), SW.moss, 'y', [p.y + ry - 0.03, p.y + ry + 0.04])); }
  // bog roots: thick gnarled 6-sided root coils around the lower legs, each with a short stub root
  const wrap = (c, r) => {
    const tr = 0.019, R0 = r + 0.005 + tr;
    const pts = [];
    for (let k = 0; k <= 10; k++) {
      const a = -0.6 + k / 10 * Math.PI * 2.1;
      pts.push(V(c.x + Math.cos(a) * R0, c.y + k * 0.005 - 0.025 + 0.008 * Math.sin(k * 2.3), c.z + Math.sin(a) * R0));
    }
    S.push(paint(tube(curveSamples(pts, 14, (t) => tr * (1 + 0.22 * Math.sin(t * 23))), { seg: 6, capStart: 0.012, capEnd: 0.012, twist: (i) => i * 0.4 }), SW.root, 'y', [c.y - 0.04, c.y + 0.04]));
    // stub root dangling off the outer side
    const b0 = V(c.x + R0 * 0.93, c.y - 0.01, c.z + R0 * 0.35);
    S.push(paint(tube(curveSamples([b0, b0.clone().add(V(0.03, -0.035, 0.015)), b0.clone().add(V(0.045, -0.075, 0.035))], 4,
      (t) => 0.017 * (1 - 0.6 * t)), { seg: 6, capEnd: 0.01 }), SW.root, 'len'));
  };
  wrap(V(0.334, 0.17, 0.22), 0.106);
  wrap(V(0.344, 0.17, -0.2425), 0.106);

  return assemble(C, S);
}

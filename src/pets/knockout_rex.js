// Knockout Rex: chunky faceted green T-rex matching the creature sheet style.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  body:  { i: 0, top: '#3DCB5A', bot: '#1C8A3A' },
  belly: { i: 1, top: '#FFF0B0', bot: '#E9C46E' },
  spike: { i: 2, top: '#C2E64C', bot: '#7DBE2C' },
  claw:  { i: 3, top: '#FFF1D2', bot: '#E2C48E' },
  eye:   { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white: { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  mouth: { i: 6, top: '#6A1E1E', bot: '#3A0E10' },
  brow:  { i: 7, top: '#2FB84C', bot: '#1A7A33' },
  teeth: { i: 8, top: '#FFF8E2', bot: '#EBD5A2' },
  dark:  { i: 9, top: '#1E8A3A', bot: '#126228' },
};
const SW = PALETTE;

// flat triangular fin in the y/z plane: profile [[z,y],...] around centre, half-thickness t (tip thinner)
function fin(cx, prof, t, tipT = 0.006) {
  const pts = [];
  prof.forEach(([z, y], k) => {
    const th = k === prof.length - 1 ? tipT : t;
    pts.push(V(cx - th, y, z), V(cx + th, y, z));
  });
  return hull(pts);
}

// chunky claw with a flat bottom sitting on y = y0, pointing along +z (or dir in xz)
function claw(x, y0, z, w, h, len, dx = 0) {
  return hull([
    V(x - w, y0, z), V(x + w, y0, z), V(x - w, y0 + h, z), V(x + w, y0 + h, z),
    V(x - w * 0.8, y0, z - 0.03), V(x + w * 0.8, y0, z - 0.03), V(x - w * 0.8, y0 + h, z - 0.03), V(x + w * 0.8, y0 + h, z - 0.03),
    V(x + dx - w * 0.3, y0, z + len), V(x + dx + w * 0.3, y0, z + len), V(x + dx, y0 + h * 0.3, z + len),
  ]);
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const green = (pts, lo = 0.1, hi = 1.0) => paint(hull(pts), SW.body, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= TORSO (leaning up toward the head) =================
  const torso = [
    [-0.32, 0.47, 0.13, 0.125],
    [-0.2, 0.46, 0.165, 0.155],
    [-0.05, 0.48, 0.19, 0.18],
    [0.09, 0.55, 0.175, 0.17],
    [0.18, 0.65, 0.14, 0.14],
  ];
  // dorsal ridge: a hunched spine line from the back of the head down to the tail
  const SPINE = [[0.2, 0.9], [0.11, 0.85], [0.02, 0.77], [-0.1, 0.7], [-0.22, 0.645], [-0.32, 0.6]];
  const ySpine = (z) => {
    for (let k = 0; k < SPINE.length - 1; k++) {
      const [z0, y0] = SPINE[k], [z1, y1] = SPINE[k + 1];
      if (z <= z0 && z >= z1) return y0 + (y1 - y0) * (z - z0) / (z1 - z0);
    }
    return SPINE[SPINE.length - 1][1];
  };
  const ridge = (lo, hi) => SPINE.filter(([z]) => z >= lo && z <= hi).flatMap(([z, y]) => [V(0.055, y, z), V(-0.055, y, z), V(0, y + 0.008, z)]);
  C.push(green([...torso.flatMap(([z, y, a, b]) => ring(V(0, y, z), a, b, 10, 'z')), ...ridge(-0.33, 0.03)]));
  // cream belly: narrower copy pushed down/forward so it shows on the underside & chest
  C.push(paint(hull(torso.slice(1).flatMap(([z, y, a, b]) => ring(V(0, y - 0.022, z + 0.03), a * 0.62, b, 10, 'z'))),
    SW.belly, 'y', [0.3, 0.8]));
  // neck
  C.push(green([...ring(V(0, 0.6, 0.15), 0.13, 0.12, 10, 'y'), ...ring(V(0, 0.82, 0.24), 0.12, 0.11, 10, 'y'),
    ...ridge(0.0, 0.21)], 0.3, 1.0));
  C.push(paint(hull([...ring(V(0, 0.6, 0.19), 0.085, 0.09, 8, 'y'), ...ring(V(0, 0.78, 0.29), 0.085, 0.07, 8, 'y')]),
    SW.belly, 'y', [0.4, 0.85]));

  // ================= LEGS (big thighs, thick shins, green feet + cream claws) =================
  S.push(paint(blob(1, V(0.18, 0.38, -0.06), V(0.12, 0.18, 0.185), { jitter: 0.1 }), SW.body, 'y', [0.05, 0.6]));
  // shin angles back from the knee to a thick ankle, then a wide flat foot
  S.push(green([...ring(V(0.195, 0.28, 0.01), 0.1, 0.105, 8), ...ring(V(0.2, 0.13, -0.07), 0.088, 0.088, 8)], 0.0, 0.6));
  S.push(green([...ring(V(0.2, 0.15, -0.065), 0.084, 0.084, 8), ...cbox(V(0.2, 0.05, -0.02), 0.105, 0.05, 0.1, 0.03),
    ...cbox(V(0.2, 0.035, 0.07), 0.1, 0.035, 0.03, 0.015)], 0.0, 0.6));
  for (const dx of [-0.058, 0, 0.058]) S.push(flat(claw(0.195 + dx, 0, 0.09, 0.026, 0.05, 0.075, dx * 0.3), SW.claw));
  S.push(flat(claw(0.195, 0, -0.11, 0.022, 0.035, -0.05), SW.claw)); // dew claw at the heel

  // ================= ARMS (small, with cream claws) =================
  S.push(green([...ring(V(0.13, 0.61, 0.17), 0.058, 0.058, 6), ...ring(V(0.17, 0.51, 0.23), 0.05, 0.05, 6)], 0.3, 0.8));
  S.push(green([...ring(V(0.17, 0.51, 0.23), 0.046, 0.046, 6, 'z'), ...ring(V(0.165, 0.49, 0.32), 0.042, 0.038, 6, 'z')], 0.3, 0.8));
  for (const dx of [-0.024, 0, 0.024])
    S.push(flat(shard(V(0.165 + dx, 0.48, 0.335), V(dx * 1.5, -0.9, 0.55), 0.016, 0.06), SW.claw));

  // ================= TAIL (long, tapering, held out back) =================
  const tailRX = (t) => 0.13 * (1 - t) + 0.02, tailRY = (t) => 0.125 * (1 - t) + 0.018;
  const tailCurve = (pts) => new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const tailPts = [V(0, 0.49, -0.22), V(0, 0.43, -0.45), V(0, 0.33, -0.65), V(0, 0.21, -0.83), V(0, 0.1, -0.98)];
  C.push(paint(tube(curveSamples(tailPts, 9, tailRX, tailRY),
    { seg: 8, axis: X, capEnd: 0.03, phase: Math.PI / 8 }), SW.body, 'len'));
  C.push(paint(tube(curveSamples(tailPts.slice(0, 4).map((p) => p.clone().add(V(0, -0.04, 0))), 6,
    (t) => tailRX(0.75 * t) * 0.6 * (1 - 0.35 * t), (t) => tailRY(0.75 * t) * 0.85 * (1 - 0.35 * t)),
    { seg: 6, axis: X, capEnd: 0.05 }), SW.belly, 'flat'));

  // ================= HEAD (big blocky skull + long snout, open toothy mouth) =================
  const HC = [], HS = [];
  const SK = { y: 0.89, z: 0.27 };
  const FZ = SK.z + 0.13; // skull front face (centre panel)
  // skull: boxy back, front corners cut into ~23 degree panels so the eyes can face slightly outward
  const EYAW = Math.atan2(0.048, 0.115);
  HC.push(green([
    ...cbox(V(0, SK.y, SK.z), 0.15, 0.115, 0.13, 0.04).filter((p) => p.z < FZ - 0.05),
    ...[-1, 1].flatMap((sx) => [-1, 1].flatMap((sy) => [
      V(sx * 0.035, SK.y + sy * 0.085, FZ), V(sx * 0.035, SK.y + sy * 0.115, FZ - 0.03),
      V(sx * 0.15, SK.y + sy * 0.085, FZ - 0.048), V(sx * 0.135, SK.y + sy * 0.115, FZ - 0.072),
    ])),
  ], 0.6, 1.02));
  // upper jaw / snout
  HC.push(green([...cbox(V(0, 0.83, 0.47), 0.115, 0.055, 0.125, 0.03), V(0.09, 0.875, 0.36), V(-0.09, 0.875, 0.36)], 0.6, 1.0));
  HC.push(green(cbox(V(0, 0.883, 0.555), 0.07, 0.018, 0.035, 0.012), 0.6, 1.0)); // nostril bump
  // mouth interior
  HC.push(flat(hull(cbox(V(0, 0.75, 0.39), 0.1, 0.045, 0.125, 0.01)), SW.mouth));
  for (const x of [-0.035, 0.035]) HC.push(flat(hull(cbox(V(x, 0.897, 0.585), 0.009, 0.004, 0.008, 0.002)), SW.dark)); // nostrils
  // cream lower jaw / underjaw (wide at the back like a big chin)
  HC.push(paint(hull([
    ...cbox(V(0, 0.68, 0.42), 0.1, 0.04, 0.14, 0.02),
    V(0.14, 0.78, 0.2), V(-0.14, 0.78, 0.2), V(0.13, 0.64, 0.2), V(-0.13, 0.64, 0.2),
  ]), SW.belly, 'y', [0.62, 0.8]));
  // teeth: upper row pointing down, lower row pointing up
  const tooth = (x, y, z, dy) => flat(hull([V(x - 0.013, y, z - 0.012), V(x + 0.013, y, z - 0.012), V(x - 0.013, y, z + 0.012),
    V(x + 0.013, y, z + 0.012), V(x, y + dy, z)]), SW.teeth);
  for (const x of [0.03, 0.075]) HS.push(tooth(x, 0.792, 0.575, -0.045));
  for (const z of [0.52, 0.46, 0.4, 0.34]) HS.push(tooth(0.1, 0.792, z, -0.045));
  for (const x of [0.022, 0.065]) HS.push(tooth(x, 0.718, 0.545, 0.04));
  for (const z of [0.49, 0.43, 0.37]) HS.push(tooth(0.088, 0.718, z, 0.04));

  // fierce eyes on the angled front-corner panels (yawed ~23 deg outward), scaled up 1.3x, heavy brow
  const ESC = 1.3, EX = 0.088, EY = 0.94, EZ = FZ - (EX - 0.035) * Math.tan(EYAW);
  const eyePart = (g, sw, mode = 'flat', range = null) => {
    g.scale(ESC, ESC, ESC); g.rotateY(EYAW); g.translate(EX, EY, EZ);
    return paint(g, sw, mode, range);
  };
  const O = V(0, 0, 0);
  HS.push(eyePart(hull(plate([[-0.04, 0.004], [0.044, 0.034], [0.05, -0.008], [0.022, -0.038], [-0.028, -0.036], [-0.045, -0.016]],
    O, -0.012, 0.008)), SW.white));
  HS.push(eyePart(hull(plate([[-0.024, 0.002], [0.014, 0.016], [0.02, -0.006], [0.006, -0.027], [-0.018, -0.025], [-0.028, -0.01]],
    V(-0.002, 0, 0), 0.004, 0.0125)), SW.eye));
  HS.push(eyePart(hull(plate([[-0.006, -0.006], [0.006, -0.006], [0.006, 0.006], [-0.006, 0.006]],
    V(0.006, 0.002, 0), 0.009, 0.0155)), SW.white));
  HS.push(eyePart(hull([
    V(-0.05, 0.008, 0.024), V(-0.047, 0.042, 0.014),
    V(0.062, 0.04, 0.0), V(0.062, 0.07, -0.01),
    V(-0.05, 0.008, -0.03), V(-0.047, 0.05, -0.04),
    V(0.062, 0.04, -0.05), V(0.062, 0.07, -0.06),
  ]), SW.brow, 'y', [0.95, 1.06]));

  // crown: splayed side spikes at the back of the skull
  for (const [z, h] of [[0.2, 0.09], [0.29, 0.07]]) {
    const g = fin(0, [[z - 0.05, -0.04], [z + 0.05, -0.04], [z - 0.045, h]], 0.02, 0.004);
    g.rotateZ(-0.6); g.translate(0.085, 0.995, 0);
    HS.push(paint(g, SW.spike, 'y', [0.95, 1.08]));
  }
  // scale the whole head up about the neck joint (big-head proportions)
  const HP = V(0, 0.78, 0.24), HSC = 1.2;
  for (const g of [...HC, ...HS]) {
    g.translate(-HP.x, -HP.y, -HP.z); g.scale(HSC, HSC, HSC); g.translate(HP.x, HP.y - 0.01, HP.z + 0.02);
  }
  C.push(...HC); S.push(...HS);

  // ================= BACK SPIKES (light-green triangular fins head -> tail) =================
  const spikes = [
    // [z, y base, height, half-length, lean]
    [0.24, 1.04, 0.12, 0.065, -0.05],
    [0.13, 0.9, 0.15, 0.065, -0.07],
    [0.06, 0.82, 0.15, 0.07, -0.08],
    [-0.04, 0.71, 0.14, 0.07, -0.08],
    [-0.16, 0.65, 0.13, 0.07, -0.08],
    [-0.29, 0.6, 0.12, 0.065, -0.07],
    [-0.43, 0.55, 0.1, 0.06, -0.07],
    [-0.58, 0.48, 0.085, 0.055, -0.06],
    [-0.73, 0.39, 0.07, 0.045, -0.05],
    [-0.87, 0.3, 0.055, 0.04, -0.04],
  ];
  for (const s of spikes) if (s[0] >= -0.33 && s[0] < 0.2) s[1] = ySpine(s[0]) + 0.01;
  // tail spikes follow the tail's top line
  const tc = tailCurve(tailPts);
  for (const s of spikes) if (s[0] < -0.33) {
    let bt = 0, bd = 9;
    for (let i = 0; i <= 100; i++) { const d = Math.abs(tc.getPoint(i / 100).z - s[0]); if (d < bd) { bd = d; bt = i / 100; } }
    s[1] = tc.getPoint(bt).y + tailRY(bt) * 0.92;
  }
  for (const [z, y, h, l, lean] of spikes)
    C.push(paint(fin(0, [[z - l * 1.3, y - 0.04], [z + l * 1.3, y - 0.04], [z + lean * 1.4, y + h]], 0.024, 0.004),
      SW.spike, 'y', [y - 0.05, y + h]));
  // layered side row: smaller fins splayed outward between the centre spikes
  for (let k = 1; k < 7; k++) {
    const [z0, y0] = spikes[k], [z1, y1] = spikes[k + 1];
    const z = (z0 + z1) / 2, y = (y0 + y1) / 2 - 0.035, h = spikes[k][2] * 0.6, l = spikes[k][3];
    const g = fin(0, [[z - l, -0.04], [z + l, -0.04], [z - 0.05, h]], 0.02, 0.004);
    g.rotateZ(-0.45); g.translate(0.035, y, 0);
    S.push(paint(g, SW.spike, 'y', [y - 0.05, y + h]));
  }

  return assemble(C, S);
}

// Game name: MeshPart name in Roblox and the export file name
export const NAME = 'KnockoutRex';

// Hammerhead Hitter (Celestial, Round 8 – Ocean Octagon): upright steel-blue hammerhead shark boxer
// with a wide T-shaped hammer head, white belly, coral armour + pearls, glowing cyan markings and a floating gold crown.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  body:   { i: 0, top: '#A2C8EA', bot: '#3C6189' },
  dark:   { i: 1, top: '#5E86AE', bot: '#2C4A6C' },
  belly:  { i: 2, top: '#FFFFFF', bot: '#D9E4EE' },
  coral:  { i: 3, top: '#FF8FA8', bot: '#E8506E' },
  coral2: { i: 4, top: '#FF9C7A', bot: '#E0604E' },
  pearl:  { i: 5, top: '#FFFFFF', bot: '#F2D3E4' },
  glow:   { i: 6, top: '#B8FBFF', bot: '#3FD8FF', glow: true },
  gold:   { i: 7, top: '#FFE680', bot: '#E09A1E' },
  eye:    { i: 8, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 9, top: '#FFFFFF', bot: '#F1F1F4' },
  mouth:  { i: 10, top: '#3A1A2A', bot: '#1E0C16' },
  brow:   { i: 11, top: '#5E86AE', bot: '#355880' },
  sheen:  { i: 12, top: '#E6F6FF', bot: '#C2E4FA' },
};
const SW = PALETTE;

// flat fin in the y/z plane: profile [[z,y],...], half-thickness t (last point = thin tip)
function fin(cx, prof, t, tipT = 0.006) {
  const pts = [];
  prof.forEach(([z, y], k) => {
    const th = k === prof.length - 1 ? tipT : t;
    pts.push(V(cx - th, y, z), V(cx + th, y, z));
  });
  return hull(pts);
}
// rotate a locally built part about Y (front normal +z turns toward +x for yaw>0) then move it
const place = (g, yaw, p) => { g.rotateY(yaw); g.translate(p.x, p.y, p.z); return g; };

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const flat = (g, sw) => paint(g, sw, 'flat');
  const blue = (pts, lo = 0.0, hi = 0.9) => paint(hull(pts), SW.body, 'y', [lo, hi]);

  const pearl = (p, r) => paint(blob(1, p, V(r, r, r)), SW.pearl, 'y', [p.y - r, p.y + r]);
  // ================= TORSO (upright barrel) =================
  const T = [ // [y, zc, rx, rz]
    [0.16, -0.035, 0.14, 0.125],
    [0.29, -0.02, 0.172, 0.155],
    [0.43, 0.01, 0.2, 0.178],
    [0.53, 0.025, 0.206, 0.172],
    [0.61, 0.035, 0.165, 0.145],
    [0.68, 0.04, 0.12, 0.12],
  ];
  const R = (y) => { // interpolated torso section at height y
    for (let k = 0; k < T.length - 1; k++) {
      const a = T[k], b = T[k + 1];
      if (y >= a[0] && y <= b[0]) { const t = (y - a[0]) / (b[0] - a[0]); return a.map((v, j) => v + (b[j] - v) * t); }
    }
    return y < T[0][0] ? T[0] : T[T.length - 1];
  };
  C.push(blue(T.flatMap(([y, z, a, b]) => ring(V(0, y, z), a, b, 10, 'y')), 0.1, 0.8));
  // white belly: narrower copy pushed forward
  C.push(paint(hull(T.slice(0, 4).flatMap(([y, z, a, b]) => ring(V(0, y + (y < 0.2 ? 0.01 : 0), z + 0.03), a * 0.74, b, 10, 'y'))),
    SW.belly, 'y', [0.15, 0.6]));

  // ================= LEGS (short thick fin-legs, flipper feet) =================
  const LX = 0.115;
  S.push(blue([...ring(V(LX, 0.05, -0.01), 0.068, 0.072, 8), ...ring(V(LX, 0.16, -0.01), 0.078, 0.08, 8),
    ...ring(V(LX, 0.27, -0.015), 0.09, 0.095, 8)], 0.0, 0.5));
  // glowing chevrons on the thigh fronts
  for (const sx of [-1, 1])
    S.push(flat(hull([V(LX + sx * 0.028, 0.185, 0.078), V(LX + sx * 0.028, 0.168, 0.078), V(LX, 0.15, 0.08), V(LX, 0.133, 0.08),
      V(LX + sx * 0.028, 0.185, 0.04), V(LX + sx * 0.028, 0.168, 0.04), V(LX, 0.15, 0.04), V(LX, 0.133, 0.04)]), SW.glow));
  // flipper foot: flat block flaring forward/outward, two dark fin-toes
  S.push(blue([...cbox(V(LX + 0.005, 0.032, 0.02), 0.08, 0.032, 0.095, 0.022), V(LX + 0.06, 0.0, 0.14), V(LX + 0.06, 0.03, 0.13),
    V(LX - 0.05, 0.0, 0.13), V(LX - 0.05, 0.03, 0.12)], 0.0, 0.5));
  for (const dx of [-0.032, 0.04])
    S.push(paint(hull([...cbox(V(LX + dx, 0.022, 0.135), 0.03, 0.022, 0.03, 0.01), V(LX + dx * 1.3, 0.0, 0.19), V(LX + dx * 1.3, 0.012, 0.19)]),
      SW.dark, 'y', [0, 0.05]));

  // ================= TAIL (thick, sweeping down to the ground, heterocercal caudal fin) =================
  const tailPts = [V(0, 0.28, -0.1), V(0, 0.17, -0.26), V(0, 0.08, -0.4), V(0, 0.05, -0.5)];
  C.push(paint(tube(curveSamples(tailPts, 7, (t) => 0.12 * (1 - t) + 0.035, (t) => 0.11 * (1 - t) + 0.045),
    { seg: 8, axis: X, capEnd: 0.02, phase: Math.PI / 8 }), SW.body, 'y', [0.0, 0.4]));
  // caudal fin: big upper lobe sweeping up-back, small lower lobe resting on the ground
  C.push(paint(fin(0, [[-0.47, 0.03], [-0.53, 0.1], [-0.56, 0.06], [-0.7, 0.34]], 0.024, 0.008), SW.dark, 'y', [0.0, 0.35]));
  C.push(paint(fin(0, [[-0.47, 0.08], [-0.55, 0.06], [-0.5, 0.0], [-0.64, 0.0]], 0.022, 0.01), SW.dark, 'y', [0.0, 0.35]));

  // ================= DORSAL FIN =================
  C.push(paint(fin(0, [[-0.02, 0.68], [-0.12, 0.42], [0.04, 0.6], [-0.33, 0.8]], 0.03, 0.008), SW.dark, 'y', [0.45, 0.82]));

  // ================= HEAD (core + wide hammer / cephalofoil) =================
  const HC = [], HS = [];
  // head core: tapers forward under the hammer; white chin underneath
  HC.push(blue([...ring(V(0, 0.63, 0.03), 0.13, 0.13, 10, 'y'), ...ring(V(0, 0.71, -0.02), 0.13, 0.1, 8, 'z'),
    ...ring(V(0, 0.72, 0.12), 0.125, 0.085, 8, 'z'), ...ring(V(0, 0.745, 0.235), 0.09, 0.055, 8, 'z')], 0.55, 0.88));
  HC.push(paint(hull([...ring(V(0, 0.665, 0.03), 0.115, 0.1, 8, 'y'), ...ring(V(0, 0.65, 0.17), 0.095, 0.06, 8, 'y'),
    V(0.07, 0.68, 0.235), V(-0.07, 0.68, 0.235), V(0.06, 0.665, 0.22), V(-0.06, 0.665, 0.22)]), SW.belly, 'y', [0.6, 0.7]));
  // the hammer: one half (auto-mirrored), bevelled front edge, thick centre ridge, tapering toward the tips
  HS.push(paint(hull([
    V(0, 0.885, 0.2), V(0, 0.875, -0.04), V(0, 0.835, 0.3), V(0, 0.77, 0.3), V(0, 0.735, 0.22), V(0, 0.745, -0.04),
    V(0.13, 0.875, 0.19), V(0.13, 0.865, -0.0), V(0.13, 0.828, 0.285), V(0.13, 0.77, 0.283), V(0.13, 0.742, 0.21), V(0.13, 0.75, 0.0),
    V(0.24, 0.86, 0.17), V(0.24, 0.85, 0.04), V(0.24, 0.818, 0.245), V(0.24, 0.772, 0.24), V(0.24, 0.75, 0.18), V(0.24, 0.756, 0.05),
  ]), SW.body, 'y', [0.7, 0.9]));
  // hammer tips (angled outward so the eyes read from the front and 3/4)
  const YAW = 0.3, TIP = V(0.31, 0.8, 0.255), ES = 1.3;
  const sc = (pts, k = ES) => pts.map(([u, v]) => [u * k, v * k]);
  const tip = (g) => place(g, YAW, TIP);
  HS.push(paint(tip(hull([...cbox(V(0.0, -0.002, -0.07), 0.082, 0.062, 0.07, 0.026), V(0.1, 0.0, -0.09), V(0.09, 0.01, -0.14)])),
    SW.body, 'y', [0.7, 0.9]));
  // fierce eye: white almond, angry flat top sloping down to the inner side, big pupil, square catchlight
  HS.push(flat(tip(hull(plate(sc([[-0.044, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.032, -0.036], [-0.048, -0.014]]),
    V(0, 0, 0), -0.01, 0.012))), SW.white));
  HS.push(flat(tip(hull(plate(sc([[-0.03, 0.004], [0.017, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.021, -0.03], [-0.034, -0.011]]),
    V(-0.004, 0, 0), 0.006, 0.018))), SW.eye));
  HS.push(flat(tip(hull(plate(sc([[-0.0075, -0.0075], [0.0075, -0.0075], [0.0075, 0.0075], [-0.0075, 0.0075]], 1.25),
    V(0.009, 0.004, 0), 0.014, 0.021))), SW.white));
  // heavy brow over each eye (inner end low = angry), merging back into the hammer top
  HS.push(paint(tip(hull([
    V(-0.084, 0.02, 0.032), V(-0.082, 0.064, 0.02), V(0.078, 0.058, 0.0), V(0.078, 0.092, -0.014),
    V(-0.084, 0.02, -0.05), V(-0.082, 0.062, -0.06), V(0.078, 0.058, -0.06), V(0.078, 0.082, -0.075),
  ])), SW.brow, 'y', [0.8, 0.9]));
  // mouth: determined dark line on the chin front with small teeth
  const MY = 0.692, MZ = 0.236;
  HC.push(flat(hull([V(-0.06, MY - 0.007, MZ - 0.01), V(0.06, MY - 0.007, MZ - 0.01), V(-0.06, MY + 0.007, MZ - 0.01), V(0.06, MY + 0.007, MZ - 0.01),
    V(-0.06, MY - 0.007, MZ + 0.008), V(0.06, MY - 0.007, MZ + 0.008), V(-0.06, MY + 0.007, MZ + 0.008), V(0.06, MY + 0.007, MZ + 0.008)]), SW.mouth));
  HS.push(flat(hull([V(0.06, MY - 0.007, MZ - 0.01), V(0.06, MY + 0.007, MZ - 0.01), V(0.06, MY - 0.007, MZ + 0.008), V(0.06, MY + 0.007, MZ + 0.008),
    V(0.09, MY - 0.02, MZ - 0.05), V(0.09, MY - 0.01, MZ - 0.05), V(0.085, MY - 0.02, MZ - 0.03), V(0.085, MY - 0.01, MZ - 0.03)]), SW.mouth));
  for (const x of [0.018, 0.048])
    HS.push(flat(hull([V(x - 0.011, MY - 0.006, MZ + 0.01), V(x + 0.011, MY - 0.006, MZ + 0.01), V(x - 0.011, MY - 0.006, MZ + 0.0), V(x + 0.011, MY - 0.006, MZ + 0.0),
      V(x, MY - 0.022, MZ + 0.006)]), SW.white));

  // glowing gill slits on the neck sides
  for (const [k, y] of [[0, 0.6], [1, 0.635], [2, 0.67]]) {
    const z = 0.05 - k * 0.04, x = 0.142 + 0.002 * k;
    HS.push(flat(hull([V(x, y - 0.035, z + 0.012), V(x, y + 0.035, z - 0.004), V(x + 0.012, y - 0.035, z + 0.012), V(x + 0.012, y + 0.035, z - 0.004),
      V(x - 0.02, y - 0.035, z + 0.012), V(x - 0.02, y + 0.035, z - 0.004)]), SW.glow));
  }

  // glowing chevron along the top of the hammer
  HS.push(flat(hull([V(0, 0.882, 0.16), V(0, 0.883, 0.13), V(0.22, 0.86, 0.15), V(0.22, 0.86, 0.125),
    V(0, 0.893, 0.16), V(0, 0.894, 0.13), V(0.22, 0.869, 0.15), V(0.22, 0.869, 0.125)]), SW.glow));
  // glowing line along the hammer's front edge
  const FE = [[0, 0.3], [0.13, 0.284], [0.24, 0.243]];
  HS.push(flat(hull(FE.flatMap(([x, z]) => [V(x, 0.795, z + 0.007), V(x, 0.811, z + 0.007), V(x, 0.795, z - 0.02), V(x, 0.811, z - 0.02)])), SW.glow));
  // scale the head up about the neck (big-head proportions)
  const HP = V(0, 0.63, 0.06), HSC = 1.15;
  for (const g of [...HC, ...HS]) { g.translate(-HP.x, -HP.y, -HP.z); g.scale(HSC, HSC, HSC); g.translate(HP.x, HP.y, HP.z); }
  C.push(...HC); S.push(...HS);

  // ================= ARMS (short thick fin-arms in a boxer guard, coral gauntlets) =================
  const SH = V(0.2, 0.53, 0.0), EL = V(0.29, 0.39, 0.08), FI = V(0.215, 0.47, 0.27);
  S.push(blue([...ring(SH, 0.07, 0.07, 8, 'y'), ...ring(EL, 0.062, 0.062, 8, 'y')], 0.3, 0.7));
  S.push(blue([...ring(EL, 0.06, 0.06, 8, 'y'), ...cbox(FI.clone().add(V(0, -0.01, -0.06)), 0.05, 0.05, 0.04, 0.02)], 0.3, 0.7));
  // coral gauntlet cuff + big chunky fist with coral knuckle plate
  S.push(paint(hull([...ring(FI.clone().add(V(0.0, -0.01, -0.07)), 0.064, 0.062, 8, 'z'), ...ring(FI.clone().add(V(0.0, -0.01, -0.025)), 0.072, 0.07, 8, 'z')]),
    SW.coral, 'y', [0.38, 0.55]));
  S.push(paint(hull([...cbox(FI.clone().add(V(0, 0, 0.035)), 0.068, 0.066, 0.06, 0.032), FI.clone().add(V(-0.07, -0.02, 0.01))]), SW.body, 'y', [0.38, 0.56]));
  // coral wrap band around the hand
  S.push(paint(hull([...ring(FI.clone().add(V(0, 0, 0.022)), 0.078, 0.076, 8, 'z'), ...ring(FI.clone().add(V(0, 0, 0.048)), 0.078, 0.076, 8, 'z')]), SW.coral, 'y', [0.38, 0.56]));
  // chunky dark knuckle blocks
  for (const dx of [-0.036, 0.0, 0.036])
    S.push(paint(hull(cbox(FI.clone().add(V(dx, 0.016, 0.092)), 0.017, 0.03, 0.014, 0.007)), SW.dark, 'y', [0.44, 0.52]));
  S.push(pearl(FI.clone().add(V(0.0, 0.065, 0.04)), 0.016));
  // pectoral fin trailing back from the elbow
  S.push(paint(hull([EL.clone().add(V(0.0, 0.04, 0.03)), EL.clone().add(V(0.0, -0.04, -0.03)), EL.clone().add(V(0.03, 0.03, 0.0)),
    EL.clone().add(V(0.03, -0.02, -0.04)), V(0.37, 0.27, -0.12), V(0.355, 0.26, -0.13)]), SW.dark, 'y', [0.25, 0.45]));

  // ================= CORAL ARMOUR =================
  // pauldrons: layered angular coral plates stepping down the shoulder
  for (const [k, y, x0, x1] of [[0, 0.628, 0.12, 0.27], [1, 0.592, 0.17, 0.305], [2, 0.553, 0.215, 0.33]]) {
    const hz = 0.105 - k * 0.008;
    S.push(paint(hull([
      V(x0, y + 0.03, hz * 0.8), V(x0, y + 0.03, -hz * 0.8), V((x0 + x1) / 2, y + 0.045, 0), V((x0 + x1) / 2, y + 0.02, hz), V((x0 + x1) / 2, y + 0.02, -hz),
      V(x1, y - 0.035, hz * 0.7), V(x1, y - 0.035, -hz * 0.7), V(x1, y - 0.055, 0.0),
      V(x0, y - 0.01, hz * 0.7), V(x0, y - 0.01, -hz * 0.7), V((x0 + x1) / 2, y - 0.03, hz * 0.85), V((x0 + x1) / 2, y - 0.03, -hz * 0.85),
    ]), k % 2 ? SW.coral2 : SW.coral, 'y', [y - 0.06, y + 0.05]));
  }
  // short chunky branching coral shards rising from the top plate
  const cs = (b, d, w, l, sw = SW.coral) => S.push(paint(shard(b, d, w, l, 5), sw, 'y', [b.y - 0.02, b.y + l]));
  cs(V(0.2, 0.65, 0.02), V(0.25, 1, 0.15), 0.03, 0.11);
  cs(V(0.225, 0.7, 0.04), V(1, 0.8, 0.3), 0.017, 0.055, SW.coral2);
  cs(V(0.16, 0.645, -0.05), V(0.05, 1, -0.35), 0.026, 0.09);
  cs(V(0.165, 0.69, -0.075), V(-0.5, 0.8, -0.6), 0.015, 0.045, SW.coral2);
  cs(V(0.26, 0.61, -0.04), V(0.9, 0.7, -0.3), 0.022, 0.07, SW.coral2);
  // chest plate: curved shell on the upper chest
  const arc = (y, dr, a0, a1, n, out) => {
    const [, zc, rx, rz] = R(y);
    for (let k = 0; k <= n; k++) {
      const a = a0 + (a1 - a0) * k / n;
      out.push(V(Math.cos(a) * (rx * 0.66 + dr), y, zc + 0.03 + Math.sin(a) * (rz + dr)));
    }
    return out;
  };
  const chest = [];
  for (const [y, h] of [[0.37, 0.1], [0.42, 0.24], [0.49, 0.31], [0.56, 0.3]]) {
    arc(y, 0.018, Math.PI * (0.5 - h), Math.PI * (0.5 + h), 6, chest); arc(y, -0.03, Math.PI * (0.5 - h), Math.PI * (0.5 + h), 6, chest);
  }
  for (const y of [0.4, 0.5]) { const [, zc, , rz] = R(y); chest.push(V(0, y, zc + 0.03 + rz + 0.035)); }
  C.push(paint(hull(chest), SW.coral, 'y', [0.36, 0.57]));
  // coral rim along the top of the chest plate
  const rim = []; arc(0.565, 0.026, Math.PI * 0.2, Math.PI * 0.8, 6, rim); arc(0.585, 0.012, Math.PI * 0.2, Math.PI * 0.8, 6, rim); arc(0.565, -0.03, Math.PI * 0.2, Math.PI * 0.8, 6, rim);
  C.push(paint(hull(rim), SW.coral2, 'flat'));
  // pearls: centre of chest plate + on each pauldron + a belt pair
  const [, czc, , crz] = R(0.47);
  { const gz = czc + 0.03 + crz + 0.03; // glowing gem set in the chest plate
    C.push(paint(hull([V(0, 0.525, gz), V(0, 0.415, gz), V(0.04, 0.47, gz), V(-0.04, 0.47, gz), V(0, 0.47, gz + 0.03), V(0, 0.47, gz - 0.03)]), SW.glow, 'flat')); }
  S.push(pearl(V(0.075, 0.43, czc + 0.03 + crz - 0.0), 0.02));
  S.push(pearl(V(0.075, 0.51, czc + 0.03 + crz - 0.008), 0.02));
  S.push(pearl(V(0.27, 0.585, 0.075), 0.022));
  // coral belt
  const belt = [];
  for (const y of [0.235, 0.27]) {
    const [, zc, rx, rz] = R(y);
    belt.push(...ring(V(0, y, zc + 0.005), rx + 0.012, rz + 0.022, 10, 'y'));
  }
  C.push(paint(hull(belt), SW.coral2, 'y', [0.22, 0.28]));
  C.push(pearl(V(0, 0.252, R(0.252)[1] + R(0.252)[3] + 0.04), 0.026));

  // ================= GLOWING MARKINGS =================
  // flank stripes (curved bands hugging the torso sides)
  const band = (y, a0, a1, h) => {
    const pts = [];
    for (const dy of [-h, h]) {
      const [, zc, rx, rz] = R(y + dy);
      for (let k = 0; k <= 4; k++) {
        const a = a0 + (a1 - a0) * k / 4;
        pts.push(V(Math.cos(a) * (rx + 0.008), y + dy, zc + Math.sin(a) * (rz + 0.008)));
        pts.push(V(Math.cos(a) * (rx - 0.03), y + dy, zc + Math.sin(a) * (rz - 0.03)));
      }
    }
    return hull(pts);
  };
  const stripe = (y0, y1, a0, a1, h) => {
    const pts = [];
    for (let k = 0; k <= 4; k++) {
      const t = k / 4, a = a0 + (a1 - a0) * t, y = y0 + (y1 - y0) * t, hh = h * (1 - 0.6 * t);
      for (const dy of [-hh, hh]) {
        const [, zc, rx, rz] = R(y + dy);
        pts.push(V(Math.cos(a) * (rx + 0.007), y + dy, zc + Math.sin(a) * (rz + 0.007)));
        pts.push(V(Math.cos(a) * (rx - 0.03), y + dy, zc + Math.sin(a) * (rz - 0.03)));
      }
    }
    return hull(pts);
  };
  // shark-tiger style slashes sweeping from the back down onto the flanks
  for (const [y0, y1, a0, a1] of [[0.5, 0.42, -1.2, -0.15], [0.42, 0.34, -1.2, -0.1], [0.34, 0.27, -1.15, -0.15]]) S.push(flat(stripe(y0, y1, a0, a1, 0.014), SW.glow));
  // glowing dorsal-fin edge
  C.push(flat(fin(0, [[-0.06, 0.66], [-0.08, 0.7], [-0.33, 0.8]], 0.036, 0.012), SW.glow));

  // ================= FLOATING GOLD CROWN (centre line, just above the hammer) =================
  const CY = 0.995, CZ = 0.1;
  C.push(paint(hull([...ring(V(0, CY, CZ), 0.085, 0.075, 8, 'y'), ...ring(V(0, CY + 0.055, CZ), 0.105, 0.095, 8, 'y')]), SW.gold, 'y', [CY, CY + 0.06]));
  C.push(paint(shard(V(0, CY + 0.05, CZ + 0.08), V(0, 1, 0.15), 0.03, 0.08), SW.gold, 'y', [CY, CY + 0.14]));
  C.push(paint(shard(V(0, CY + 0.05, CZ - 0.08), V(0, 1, -0.15), 0.028, 0.065), SW.gold, 'y', [CY, CY + 0.14]));
  S.push(paint(shard(V(0.075, CY + 0.05, CZ + 0.055), V(0.3, 1, 0.2), 0.026, 0.065), SW.gold, 'y', [CY, CY + 0.14]));
  S.push(paint(shard(V(0.09, CY + 0.05, CZ - 0.04), V(0.4, 1, -0.2), 0.024, 0.055), SW.gold, 'y', [CY, CY + 0.14]));
  // glowing gem on the crown front
  C.push(flat(hull([V(0, CY + 0.05, CZ + 0.1), V(0, CY + 0.005, CZ + 0.095), V(0.02, CY + 0.028, CZ + 0.095), V(-0.02, CY + 0.028, CZ + 0.095),
    V(0, CY + 0.028, CZ + 0.11), V(0, CY + 0.028, CZ + 0.08)]), SW.glow));

  // glowing halo ring floating around the crown
  const HR = 0.175, HN = 16;
  for (let k = 0; k < HN / 2; k++) {
    const a0 = -Math.PI / 2 + (Math.PI * k) / (HN / 2), a1 = a0 + Math.PI / (HN / 2);
    const pts = [];
    for (const a of [a0, a1]) for (const [dr, dy] of [[-0.016, -0.012], [0.016, -0.012], [-0.016, 0.012], [0.016, 0.012]]) {
      const z = Math.sin(a) * (HR * 0.92 + dr);
      pts.push(V(Math.cos(a) * (HR + dr), CY + 0.04 + dy - z * 0.35, CZ - 0.02 + z));
    }
    S.push(flat(hull(pts), SW.glow));
  }
  const geo = assemble(C, S);
  return geo;
}

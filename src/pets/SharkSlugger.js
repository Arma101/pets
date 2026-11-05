// Shark Slugger (Secret): chunky faceted blue-grey shark standing upright on fin legs,
// toothy grin, white belly, coral + pearl accents, glowing cyan markings and floating pearls.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  skin:   { i: 0, top: '#A2C6E2', bot: '#4C7398' },  // glossy blue-grey (light top = wet sheen)
  belly:  { i: 1, top: '#FFFFFF', bot: '#DCE6F0' },
  dark:   { i: 2, top: '#5A7FA2', bot: '#33536F' },  // fin edges / brow
  nose:   { i: 3, top: '#2E3A48', bot: '#141B24' },
  eye:    { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  mouth:  { i: 6, top: '#5E1E2A', bot: '#320C14' },
  teeth:  { i: 7, top: '#FFFFFF', bot: '#EAF0F6' },
  glow:   { i: 8, top: '#9FF7FF', bot: '#3FD8FF', glow: true },
  coral:  { i: 9, top: '#FF8FA0', bot: '#E8476A' },
  pearl:  { i: 10, top: '#FFFFFF', bot: '#F8EBF6' },
  orb:    { i: 11, top: '#7FF4FF', bot: '#22C8F5', glow: true },
  coral2: { i: 12, top: '#FFD0D6', bot: '#FF9AAE' },
  coral3: { i: 13, top: '#FFB070', bot: '#F2703E' },
};
const SW = PALETTE;

// flat fin in the y/z plane at x = cx: profile [[z,y],...], half-thickness t (last point = tip, thinner)
function fin(cx, prof, t, tipT = 0.006) {
  const pts = [];
  prof.forEach(([z, y], k) => {
    const th = k === prof.length - 1 ? tipT : t;
    pts.push(V(cx - th, y, z), V(cx + th, y, z));
  });
  return hull(pts);
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const skin = (pts, lo, hi) => paint(hull(pts), SW.skin, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= TORSO (stout barrel, upright) =================
  const TR = [ // [y, rx, rz, cz]
    [0.13, 0.12, 0.11, -0.03],
    [0.22, 0.175, 0.155, -0.025],
    [0.36, 0.195, 0.17, -0.01],
    [0.5, 0.185, 0.165, 0.0],
    [0.62, 0.16, 0.15, 0.01],
  ];
  const tAt = (y) => {
    for (let k = 0; k < TR.length - 1; k++) {
      const a = TR[k], b = TR[k + 1];
      if (y >= a[0] && y <= b[0]) { const f = (y - a[0]) / (b[0] - a[0]); return a.map((v, j) => v + (b[j] - v) * f); }
    }
    return TR[TR.length - 1];
  };
  C.push(skin(TR.flatMap(([y, a, b, z]) => ring(V(0, y, z), a, b, 12, 'y')), 0.1, 0.7));
  // white belly: narrower, pushed forward so it bulges out the front
  C.push(paint(hull([
    ...ring(V(0, 0.15, 0.01), 0.07, 0.08, 10, 'y'),
    ...ring(V(0, 0.24, 0.03), 0.12, 0.13, 10, 'y'),
    ...ring(V(0, 0.38, 0.05), 0.135, 0.135, 10, 'y'),
    ...ring(V(0, 0.52, 0.08), 0.13, 0.15, 10, 'y'),
  ]), SW.belly, 'y', [0.1, 0.65]));

  // ================= LEGS (thick columns ending in flat fin feet) =================
  const LX = 0.115;
  S.push(skin([...ring(V(LX - 0.005, 0.26, -0.01), 0.085, 0.085, 8), ...ring(V(LX, 0.13, 0.0), 0.075, 0.075, 8),
    ...ring(V(LX + 0.005, 0.05, 0.0), 0.07, 0.07, 8)], 0.0, 0.4));
  // fin foot: broad flipper, flat on the ground, flaring forward and slightly out
  S.push(paint(hull([
    V(LX - 0.06, 0, -0.08), V(LX + 0.06, 0, -0.08), V(LX - 0.05, 0.07, -0.06), V(LX + 0.05, 0.07, -0.06),
    V(LX - 0.075, 0, 0.05), V(LX + 0.085, 0, 0.05), V(LX - 0.06, 0.06, 0.04), V(LX + 0.065, 0.06, 0.04),
    V(LX + 0.065, 0, 0.19), V(LX + 0.06, 0.026, 0.175), V(LX - 0.045, 0, 0.15), V(LX - 0.04, 0.022, 0.14),
  ]), SW.skin, 'y', [0.0, 0.12]));
  // pelvic fin flap sweeping back off the outer thigh (fin legs)
  S.push(paint(hull([V(LX + 0.06, 0.3, -0.02), V(LX + 0.07, 0.27, -0.06), V(LX + 0.075, 0.2, -0.02), V(LX + 0.06, 0.2, 0.02),
    V(LX + 0.05, 0.27, 0.0), V(LX + 0.13, 0.1, -0.13), V(LX + 0.12, 0.12, -0.11)]), SW.dark, 'y', [0.08, 0.3]));
  // darker fin-tip lobes on the foot
  S.push(flat(hull([V(LX + 0.04, 0, 0.17), V(LX + 0.08, 0, 0.22), V(LX + 0.075, 0.016, 0.205),
    V(LX + 0.01, 0, 0.15), V(LX + 0.02, 0.022, 0.16)]), SW.dark));
  S.push(flat(hull([V(LX - 0.05, 0, 0.135), V(LX - 0.065, 0, 0.18), V(LX - 0.06, 0.014, 0.17),
    V(LX - 0.015, 0, 0.14), V(LX - 0.025, 0.02, 0.14)]), SW.dark));

  // ================= ARMS (pectoral fins as short thick boxer arms) =================
  const sh = V(0.17, 0.53, 0.03), el = V(0.255, 0.4, 0.07), fs = V(0.2, 0.44, 0.2);
  S.push(skin([...ring(sh, 0.07, 0.07, 8), ...ring(el, 0.058, 0.058, 8)], 0.3, 0.65));
  S.push(skin([...ring(el, 0.055, 0.055, 8, 'z'), ...ring(fs, 0.05, 0.05, 8, 'z')], 0.3, 0.65));
  // fin-mitt fist
  S.push(skin([...ring(V(fs.x, fs.y + 0.005, fs.z - 0.02), 0.055, 0.055, 8, 'z'), ...ring(V(fs.x, fs.y + 0.008, fs.z + 0.03), 0.068, 0.066, 8, 'z'),
    ...ring(V(fs.x, fs.y + 0.006, fs.z + 0.075), 0.055, 0.052, 8, 'z')], 0.36, 0.52));
  S.push(paint(hull(cbox(V(fs.x, fs.y - 0.045, fs.z + 0.03), 0.042, 0.02, 0.04, 0.012)), SW.belly, 'flat'));
  // trailing pectoral fin blade sweeping out/down/back from the upper arm
  S.push(paint(hull([V(0.2, 0.52, 0.03), V(0.21, 0.5, -0.03), V(0.25, 0.42, 0.05), V(0.23, 0.44, -0.01),
    V(0.215, 0.5, 0.0), V(0.37, 0.27, -0.08), V(0.36, 0.29, -0.05), V(0.34, 0.32, -0.02)]), SW.dark, 'y', [0.27, 0.52]));
  // glowing wrist wraps
  S.push(paint(hull([...ring(V(fs.x + 0.004, fs.y - 0.001, fs.z - 0.07), 0.06, 0.06, 8, 'z'), ...ring(V(fs.x, fs.y, fs.z - 0.03), 0.062, 0.062, 8, 'z')]),
    SW.glow, 'y', [0.38, 0.5]));

  // ================= TAIL (curves down behind, caudal fin rests on the ground) =================
  const tailPts = [V(0, 0.3, -0.12), V(0, 0.2, -0.27), V(0, 0.14, -0.42), V(0, 0.15, -0.55)];
  C.push(paint(tube(curveSamples(tailPts, 7, (t) => 0.12 * (1 - t) + 0.035, (t) => 0.115 * (1 - t) + 0.03),
    { seg: 8, axis: X, capEnd: 0.02, phase: Math.PI / 8 }), SW.skin, 'len'));
  // crescent caudal fin: tall upper lobe, short lower lobe touching the ground
  C.push(paint(fin(0, [[-0.5, 0.2], [-0.58, 0.12], [-0.56, 0.21], [-0.72, 0.42]], 0.026), SW.skin, 'y', [0.1, 0.45]));
  C.push(paint(fin(0, [[-0.5, 0.14], [-0.57, 0.17], [-0.6, 0.1], [-0.64, 0.0]], 0.024), SW.dark, 'y', [0, 0.2]));

  // ================= DORSAL FIN (tall classic triangle on the back centreline) =================
  C.push(paint(fin(0, [[-0.06, 0.7], [-0.1, 0.42], [-0.17, 0.4], [-0.46, 1.17]], 0.042, 0.012), SW.skin, 'y', [0.45, 1.05]));
  // glowing panel on both sides of the dorsal fin
  C.push(paint(fin(0, [[-0.15, 0.56], [-0.2, 0.5], [-0.4, 1.02]], 0.049), SW.glow, 'y', [0.5, 0.95]));

  // ================= HEAD (wedge: crown flows down a ridge into a pointed snout) =================
  // eye planes: yawed outward and pitched up, forming a V-wedge front with the snout ridge between
  const E0 = V(0.09, 0.835, 0.2), q = 0.45, pch = 0.3;
  const n = V(Math.sin(q) * Math.cos(pch), Math.sin(pch), Math.cos(q) * Math.cos(pch));
  const u = V(Math.cos(q), 0, -Math.sin(q));
  const v = new THREE.Vector3().crossVectors(n, u).normalize();
  const L = (x, y, z) => E0.clone().addScaledVector(u, x).addScaledVector(v, y).addScaledVector(n, z);
  const onEye = (g) => {
    const pa = g.attributes.position;
    for (let i = 0; i < pa.count; i++) { const w = L(pa.getX(i), pa.getY(i), pa.getZ(i)); pa.setXYZ(i, w.x, w.y, w.z); }
    g.computeVertexNormals();
    return g;
  };
  const quad = [L(-0.075, -0.065, 0), L(0.075, -0.065, 0), L(-0.075, 0.07, 0), L(0.075, 0.07, 0)];
  const mx = (p) => V(-p.x, p.y, p.z);
  C.push(skin([...ring(V(0, 0.62, -0.01), 0.2, 0.165, 8, 'y'), ...ring(V(0, 0.88, -0.02), 0.205, 0.16, 8, 'y'),
    ...ring(V(0, 0.96, -0.03), 0.13, 0.12, 8, 'y'),
    ...quad, ...quad.map(mx),
    V(0.19, 0.66, 0.16), V(-0.19, 0.66, 0.16)], 0.6, 1.0));
  // snout: ridge from between the eyes down to a rounded point overhanging the grin
  C.push(skin([V(0, 0.875, 0.19), V(0, 0.8, 0.36), V(0.03, 0.78, 0.37), V(-0.03, 0.78, 0.37),
    V(0.035, 0.735, 0.37), V(-0.035, 0.735, 0.37), V(0.028, 0.845, 0.19), V(-0.028, 0.845, 0.19),
    V(0.1, 0.75, 0.19), V(-0.1, 0.75, 0.19), V(0.13, 0.69, 0.17), V(-0.13, 0.69, 0.17),
    V(0.1, 0.685, 0.29), V(-0.1, 0.685, 0.29), V(0.045, 0.695, 0.35), V(-0.045, 0.695, 0.35)], 0.66, 0.9));
  for (const x of [-0.03, 0.03]) C.push(flat(hull(cbox(V(x, 0.745, 0.366), 0.012, 0.006, 0.01, 0.003)), SW.nose));

  // white underside: lower jaw -> throat, sharing its bottom section with the belly
  C.push(paint(hull([
    V(0.06, 0.64, 0.32), V(-0.06, 0.64, 0.32), V(0.12, 0.64, 0.26), V(-0.12, 0.64, 0.26), V(0.145, 0.645, 0.15), V(-0.145, 0.645, 0.15),
    V(0.05, 0.6, 0.305), V(-0.05, 0.6, 0.305), V(0.11, 0.6, 0.25), V(-0.11, 0.6, 0.25),
    ...ring(V(0, 0.52, 0.08), 0.13, 0.15, 10, 'y'),
  ]), SW.belly, 'y', [0.5, 0.66]));

  // grin: wide crescent mouth band under the snout, corners curving up, interlocking tooth rows
  const mY = (x) => 0.655 + 1.5 * x * x, mZ = (x) => 0.335 - 2.6 * x * x, mH = (x) => 0.027 - x * 0.06;
  const MX = [0, 0.04, 0.08, 0.115, 0.15];
  for (let k = 0; k < MX.length - 1; k++) {
    const a = MX[k], b = MX[k + 1], ha = mH(a), hb = mH(b);
    S.push(flat(hull([V(a, mY(a) - ha, mZ(a)), V(a, mY(a) + ha, mZ(a)), V(b, mY(b) - hb, mZ(b)), V(b, mY(b) + hb, mZ(b)),
      V(a, mY(a) - ha, mZ(a) - 0.09), V(a, mY(a) + ha, mZ(a) - 0.09), V(b, mY(b) - hb, mZ(b) - 0.09), V(b, mY(b) + hb, mZ(b) - 0.09)]), SW.mouth));
  }
  const tooth = (x, w, h, up) => {
    const y0 = up ? mY(x) - mH(x) : mY(x) + mH(x), z = mZ(x) + 0.006;
    const tipY = y0 + (up ? h : -h);
    return flat(hull([V(x - w, y0, z), V(x + w, y0, z), V(x - w, y0, z - 0.02), V(x + w, y0, z - 0.02),
      V(x, tipY, z), V(x, tipY, z - 0.012)]), SW.teeth);
  };
  C.push(tooth(0, 0.016, 0.03, false));
  for (const x of [0.034, 0.068, 0.1, 0.13]) S.push(tooth(x, 0.015, 0.028 - x * 0.06, false));
  for (const x of [0.017, 0.051, 0.084, 0.115, 0.142]) S.push(tooth(x, 0.015, 0.026 - x * 0.06, true));

  // fierce eyes on the wedge planes: white almond, angry flat top, big pupil, square catchlight
  S.push(flat(onEye(hull(plate([[-0.044, 0.004], [0.048, 0.036], [0.055, -0.01], [0.022, -0.042], [-0.032, -0.038], [-0.048, -0.017]],
    V(0, 0, 0), -0.01, 0.012))), SW.white));
  S.push(flat(onEye(hull(plate([[-0.03, 0.004], [0.017, 0.021], [0.025, -0.008], [0.006, -0.034], [-0.023, -0.032], [-0.035, -0.013]],
    V(-0.004, 0, 0), 0.006, 0.018))), SW.eye));
  S.push(flat(onEye(hull(plate([[-0.0075, -0.0075], [0.0075, -0.0075], [0.0075, 0.0075], [-0.0075, 0.0075]],
    V(0.006, 0.002, 0), 0.014, 0.022))), SW.white));
  // heavy brow ridge slanting down toward the snout ridge
  S.push(paint(onEye(hull([
    V(-0.062, 0.012, 0.032), V(-0.06, 0.052, 0.022), V(0.072, 0.052, -0.01), V(0.072, 0.092, -0.025),
    V(-0.062, 0.012, -0.03), V(-0.06, 0.062, -0.04), V(0.072, 0.052, -0.06), V(0.072, 0.092, -0.07),
  ])), SW.dark, 'y', [0.83, 0.96]));

  // glowing gill slits on the sides of the head
  for (const [k, z] of [[0, 0.07], [1, 0.025], [2, -0.02]]) {
    const g = hull(cbox(V(0.2, 0.72, z), 0.012, 0.055, 0.008, 0.004));
    g.translate(-0.2, -0.72, -z); g.rotateX(0.25); g.translate(0.2 + k * 0.0, 0.72 + k * 0.005, z);
    S.push(paint(g, SW.glow, 'y', [0.66, 0.78]));
  }

  // ================= GLOWING MARKINGS (slashes across the torso sides/back) =================
  const slash = (y0, y1, th0, th1) => {
    const pts = [];
    for (const [y, th] of [[y0, th0], [(y0 + y1) / 2, (th0 + th1) / 2], [y1, th1]]) {
      const [, a, b, cz] = tAt(y);
      for (const s of [1.035, 0.8]) for (const dy of [-0.014, 0.014])
        pts.push(V(Math.cos(th) * a * s, y + dy, cz + Math.sin(th) * b * s));
    }
    return paint(hull(pts), SW.glow, 'y', [0.2, 0.6]);
  };
  S.push(slash(0.3, 0.36, -0.15, -0.95));
  S.push(slash(0.4, 0.46, -0.1, -0.95));
  S.push(slash(0.5, 0.55, -0.15, -0.9));
  // glowing chevron ticks framing the belly
  S.push(slash(0.27, 0.31, 0.95, 0.5));
  S.push(slash(0.37, 0.41, 0.95, 0.5));
  // glowing dots along the top of the head
  for (const [x, z] of [[0.05, -0.05], [0.09, 0.0], [0.1, -0.08]])
    S.push(paint(hull(cbox(V(x, 0.968, z), 0.014, 0.012, 0.014, 0.005)), SW.glow, 'flat'));

  // ================= CORAL + PEARLS =================
  const coralBranch = (pts, r, sw) => paint(tube(curveSamples(pts, 4, (t) => r * (1 - 0.45 * t)),
    { seg: 5, capEnd: r * 0.6 }), sw, 'len');
  const pearl = (c, r, det = 1) => paint(blob(det, c, V(r, r, r)), SW.pearl, 'y', [c.y - r, c.y + r]);
  const knob = (c, r, sw) => paint(blob(0, c, V(r, r, r)), sw, 'flat');
  // branching coral: a stubby trunk that forks into short branches, each ending in a light rounded knob
  const coralTree = (base, trunk, forks, r, sw, tip) => {
    const m = base.clone().add(trunk);
    S.push(coralBranch([base, base.clone().addScaledVector(trunk, 0.5), m], r, sw));
    for (const [d1, d2] of forks) {
      const k = m.clone().add(d1), e = d2 ? k.clone().add(d2) : null;
      S.push(coralBranch(e ? [m, k, e] : [m, m.clone().addScaledVector(d1, 0.5), k], r * 0.75, sw));
      S.push(knob(e || k, r * 0.8, tip));
    }
  };
  // shoulder coral growing on top of each shoulder
  coralTree(V(0.19, 0.575, -0.02), V(0.01, 0.035, -0.005), [
    [V(-0.025, 0.035, 0.0), V(-0.005, 0.025, 0.0)],
    [V(0.03, 0.03, 0.0), V(0.015, 0.025, 0.0)],
    [V(0.0, 0.03, -0.03), null],
    [V(0.035, 0.0, -0.025), null],
  ], 0.024, SW.coral, SW.coral2);
  coralTree(V(0.24, 0.55, -0.05), V(0.02, 0.02, -0.01), [
    [V(0.02, 0.03, 0.005), null],
    [V(0.03, 0.005, -0.02), null],
  ], 0.018, SW.coral3, SW.coral2);
  S.push(pearl(V(0.185, 0.63, 0.02), 0.019, 1));
  // pearl set on the crown of the head
  C.push(pearl(V(0, 0.975, 0.02), 0.03));
  // pearl studs on the fists
  S.push(pearl(V(0.2, 0.47, 0.258), 0.018, 0));

  // ================= FLOATING DETAILS (pearls + glow orbs, close to the body) =================
  // floating pearl arc framing the dorsal fin tip
  S.push(pearl(V(0.1, 1.12, -0.06), 0.028));
  S.push(pearl(V(0.2, 1.05, -0.06), 0.022));
  S.push(paint(blob(1, V(0.33, 0.86, -0.1), V(0.025, 0.025, 0.025)), SW.orb, 'y', [0.83, 0.89]));

  return assemble(C, S);
}

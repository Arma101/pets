// Jab Frog: chunky faceted bright-green tree frog with sticky toe pads, vine belt, leaves and carved jade.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  body:  { i: 0, top: '#72E03C', bot: '#2E9E2A' },
  belly: { i: 1, top: '#F4FFB0', bot: '#C9E86A' },
  pad:   { i: 2, top: '#FFD266', bot: '#F2982E' },
  brow:  { i: 3, top: '#52C832', bot: '#2A8A24' },
  eye:   { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white: { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  mouth: { i: 6, top: '#4A1E14', bot: '#2E100A' },
  jade:  { i: 7, top: '#8AF2CF', bot: '#23AE86' },
  jadeD: { i: 8, top: '#1E8C6C', bot: '#11634C' },
  vine:  { i: 9, top: '#8C7A34', bot: '#544418' },
  leaf:  { i: 10, top: '#3FBF62', bot: '#1C7438' },
  dark:  { i: 11, top: '#1F7A22', bot: '#145A18' },
};
const SW = PALETTE;

// faceted leaf: base -> tip along dir, flat in the plane with normal n
function leaf(base, dir, n, len, w, t = 0.01) {
  const d = dir.clone().normalize();
  const nn = n.clone().normalize();
  const side = new THREE.Vector3().crossVectors(d, nn).normalize();
  const tip = base.clone().addScaledVector(d, len);
  const m1 = base.clone().addScaledVector(d, len * 0.42);
  const m2 = base.clone().addScaledVector(d, len * 0.72);
  return hull([
    base.clone().addScaledVector(nn, t * 0.5), base.clone().addScaledVector(nn, -t * 0.5), tip,
    m1.clone().addScaledVector(side, w).addScaledVector(nn, t * 0.3), m1.clone().addScaledVector(side, -w).addScaledVector(nn, t * 0.3),
    m1.clone().addScaledVector(side, w).addScaledVector(nn, -t * 0.5), m1.clone().addScaledVector(side, -w).addScaledVector(nn, -t * 0.5),
    m2.clone().addScaledVector(side, w * 0.7), m2.clone().addScaledVector(side, -w * 0.7),
    m1.clone().addScaledVector(nn, t * 1.6),
  ]);
}

export function buildGeometry() {
  const C = [], S = [];
  const R = (c, a, b, n, ax = 'y') => ring(c, a, b, n, ax, Math.PI / n); // mirror-symmetric n-gon
  const green = (pts, lo = 0.1, hi = 0.8) => paint(hull(pts), SW.body, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');

  const DY = -0.06; // whole upper body sits lower (shorter arms)
  const c0 = C.length, s0 = S.length;
  // ================= BODY (squat pear, sloping up to the head) =================
  const body = [
    [-0.25, 0.2, 0.1, 0.085],
    [-0.15, 0.235, 0.175, 0.15],
    [-0.02, 0.29, 0.19, 0.17],
    [0.1, 0.33, 0.17, 0.15],
    [0.17, 0.35, 0.13, 0.12],
  ];
  C.push(green(body.flatMap(([z, y, a, b]) => R(V(0, y, z), a, b, 10, 'z'))));
  // pale lime belly / chest
  C.push(paint(hull(body.slice(1).flatMap(([z, y, a, b]) => R(V(0, y - 0.025, z + 0.035), a * 0.68, b, 10, 'z'))),
    SW.belly, 'y', [-0.25, 0.5]));

  // ================= HEAD (wide flat frog head, bulging eyes on top) =================
  const H = { y: 0.52, z: 0.15 };
  const HW = 0.22, HD = 0.17;
  // upper head: overhanging lip outline -> flat crown
  C.push(green([
    ...R(V(0, H.y - 0.035, H.z), HW, HD, 10),
    ...R(V(0, H.y + 0.05, H.z - 0.005), HW - 0.01, HD - 0.01, 10),
    ...R(V(0, H.y + 0.1, H.z - 0.03), HW - 0.06, HD - 0.05, 10),
    ...R(V(0, H.y + 0.02, H.z - 0.2), 0.15, 0.08, 8, 'z'),
  ], 0.4, 0.8));
  // nape: slope from the back of the head down onto the back
  C.push(green([...R(V(0, H.y + 0.03, H.z - 0.17), 0.15, 0.07, 8, 'z'), ...R(V(0, 0.4, -0.1), 0.15, 0.05, 8, 'z')], 0.1, 0.8));
  const FZ = H.z + HD; // snout front
  // lower jaw / throat (pale lime), inset so the lip overhangs
  C.push(paint(hull([
    ...R(V(0, H.y - 0.052, H.z - 0.004), HW - 0.012, HD - 0.01, 10),
    ...R(V(0, H.y - 0.08, H.z - 0.012), HW - 0.03, HD - 0.025, 10),
    ...R(V(0, H.y - 0.105, H.z - 0.04), HW - 0.08, HD - 0.065, 10),
    ...R(V(0, H.y - 0.075, H.z - 0.15), 0.12, 0.035, 8, 'z'),
  ]), SW.belly, 'y', [H.y - 0.11, H.y - 0.04]));
  // dark mouth slit core between lip and jaw
  C.push(flat(hull([...R(V(0, H.y - 0.03, H.z - 0.002), HW - 0.008, HD - 0.008, 10), ...R(V(0, H.y - 0.057, H.z - 0.002), HW - 0.008, HD - 0.008, 10)]), SW.mouth));
  // nostrils
  S.push(flat(hull(cbox(V(0.045, H.y + 0.085, FZ - 0.025), 0.012, 0.006, 0.01, 0.003)), SW.dark));

  // eye bulges
  const EB = V(0.125, H.y + 0.15, H.z + 0.045);
  S.push(green([...cbox(EB, 0.085, 0.075, 0.08, 0.042), V(0.14, H.y + 0.06, H.z + 0.09), V(0.1, H.y + 0.06, H.z - 0.06)], 0.45, 0.85));
  const EZ = EB.z + 0.08; // bulge front
  const E = V(EB.x, EB.y - 0.005, 0);
  S.push(flat(hull(plate([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]],
    E, EZ - 0.01, EZ + 0.012)), SW.white));
  S.push(flat(hull(plate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]],
    V(E.x - 0.004, E.y, 0), EZ + 0.006, EZ + 0.018)), SW.eye));
  S.push(flat(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), EZ + 0.014, EZ + 0.021)), SW.white));
  // heavy brow ridge, inner end lower
  S.push(paint(hull([
    V(E.x - 0.07, E.y + 0.012, EZ + 0.03), V(E.x - 0.068, E.y + 0.05, EZ + 0.02),
    V(E.x + 0.07, E.y + 0.055, EZ - 0.01), V(E.x + 0.07, E.y + 0.09, EZ - 0.025),
    V(E.x - 0.07, E.y + 0.012, EZ - 0.04), V(E.x - 0.068, E.y + 0.06, EZ - 0.05),
    V(E.x + 0.07, E.y + 0.055, EZ - 0.07), V(E.x + 0.07, E.y + 0.09, EZ - 0.08),
  ]), SW.brow, 'y', [0.6, 0.8]));

  for (const g of [...C.slice(c0), ...S.slice(s0)]) g.translate(0, DY, 0);

  // sticky toe: chunky digit + round faceted pad at the tip
  const toe = (from, to, r, padR) => {
    S.push(paint(hull([...R(from, r, r, 6), V(from.x, from.y + r, from.z), ...R(V(to.x, 0.014, to.z), r * 0.85, r * 0.85, 6),
      V(to.x, 0.014 + r, to.z)]), SW.body, 'y', [0.0, 0.15]));
    S.push(paint(hull([...R(V(to.x, 0, to.z), padR, padR, 8), ...R(V(to.x, padR * 0.85, to.z), padR * 0.72, padR * 0.72, 8),
      V(to.x, padR * 1.1, to.z)]), SW.pad, 'y', [0, padR * 1.1]));
  };

  // ================= FRONT ARMS (short, sturdy) =================
  const SH = V(0.155, 0.235, 0.15), EL = V(0.228, 0.14, 0.2), WR = V(0.218, 0.058, 0.24);
  S.push(green([...R(SH, 0.084, 0.084, 8), ...R(EL, 0.07, 0.07, 8)], 0.0, 0.4));
  S.push(green([...R(EL, 0.068, 0.068, 8), ...R(WR, 0.058, 0.058, 8)], 0.0, 0.4));
  // carved jade armband on the forearm
  S.push(paint(hull([...R(V(0.224, 0.117, 0.212), 0.078, 0.078, 8), ...R(V(0.222, 0.085, 0.226), 0.075, 0.075, 8)]), SW.jade, 'y', [0.08, 0.12]));
  S.push(flat(hull(cbox(V(0.223, 0.101, 0.292), 0.015, 0.012, 0.006, 0.003)), SW.jadeD));
  S.push(flat(hull(cbox(V(0.296, 0.101, 0.219), 0.006, 0.012, 0.015, 0.003)), SW.jadeD));
  // front hand: palm + 4 splayed fingers
  S.push(green(cbox(V(0.218, 0.032, 0.258), 0.062, 0.032, 0.055, 0.016), 0.0, 0.25));
  for (const a of [-0.6, -0.1, 0.4, 0.9]) {
    const d = V(Math.sin(a), 0, Math.cos(a));
    toe(V(0.218 + d.x * 0.03, 0.024, 0.262 + d.z * 0.03), V(0.218 + d.x * 0.105, 0, 0.258 + d.z * 0.105), 0.017, 0.029);
  }

  // ================= BACK LEGS (big folded haunches, long webbed feet) =================
  // thigh: big muscular wedge from the hip forward to the knee
  S.push(green([...R(V(0.16, 0.28, -0.12), 0.1, 0.1, 8, 'z'), ...R(V(0.19, 0.25, -0.2), 0.085, 0.09, 8, 'z'),
    ...R(V(0.2, 0.28, 0.0), 0.085, 0.09, 8, 'z'), ...R(V(0.255, 0.21, 0.065), 0.05, 0.06, 8, 'z')], 0.0, 0.5));
  // shin: folded back along the outside of the thigh to the ankle
  S.push(green([...R(V(0.29, 0.17, 0.055), 0.05, 0.055, 8, 'z'), ...R(V(0.295, 0.085, -0.17), 0.046, 0.05, 8, 'z')], 0.0, 0.5));
  // foot: heel under the ankle, long sole forward
  S.push(green([...cbox(V(0.295, 0.03, -0.17), 0.05, 0.03, 0.05, 0.015), ...cbox(V(0.33, 0.025, -0.04), 0.052, 0.025, 0.045, 0.012)], 0.0, 0.25));
  for (const a of [-0.3, 0.25, 0.8, 1.35]) {
    const d = V(Math.sin(a), 0, Math.cos(a));
    toe(V(0.33 + d.x * 0.025, 0.022, -0.04 + d.z * 0.025), V(0.33 + d.x * 0.125, 0, -0.04 + d.z * 0.125), 0.018, 0.033);
  }

  // ================= VINE BELT over the back, leaves =================
  const VZ = -0.15;
  // vine drapes over the back and both haunches, ends tucked down the outside of the hips
  const vineR = [V(0.26, 0.19, VZ + 0.01), V(0.285, 0.27, VZ), V(0.245, 0.35, VZ), V(0.17, 0.39, VZ), V(0.1, 0.357, VZ)];
  const vinePts = [...vineR, V(0, 0.35, VZ), ...vineR.slice().reverse().map((p) => V(-p.x, p.y, p.z))];
  C.push(paint(tube(curveSamples(vinePts, 19, () => 0.022), { seg: 6, axis: V(0, 0, 1), capStart: 0.01, capEnd: 0.01 }), SW.vine, 'flat'));
  // leaves on the back
  S.push(paint(leaf(V(0.06, 0.36, VZ), V(0.5, -0.3, -1), V(0.25, 1, -0.25), 0.16, 0.05), SW.leaf, 'y'));
  S.push(paint(leaf(V(0.07, 0.365, VZ + 0.01), V(0.9, 0.1, 0.5), V(0.1, 1, -0.1), 0.12, 0.04), SW.leaf, 'y'));
  C.push(paint(leaf(V(0, 0.355, VZ - 0.02), V(0, -0.45, -1), V(0, 1, -0.4), 0.15, 0.05), SW.leaf, 'y'));
  // leaves hanging down over the hips / flanks
  S.push(paint(leaf(V(0.29, 0.3, VZ + 0.01), V(0.25, -1, 0.45), V(1, 0.15, -0.2), 0.15, 0.048), SW.leaf, 'y'));
  S.push(paint(leaf(V(0.265, 0.345, VZ - 0.01), V(0.35, -0.7, -1), V(1, 0.4, 0), 0.14, 0.044), SW.leaf, 'y'));
  // carved jade disc on the vine at the centre of the back
  C.push(paint(hull([...R(V(0, 0.345, VZ), 0.05, 0.05, 6), ...R(V(0, 0.382, VZ), 0.045, 0.045, 6)]), SW.jade, 'y', [0.34, 0.385]));
  C.push(flat(hull([...R(V(0, 0.377, VZ), 0.024, 0.024, 6), ...R(V(0, 0.388, VZ), 0.019, 0.019, 6)]), SW.jadeD));

  const c1 = C.length, s1 = S.length;
  // ================= JADE PENDANT on a vine cord at the chest =================
  const cordPts = [V(0.09, 0.44, 0.06), V(0.1, 0.37, 0.19), V(0, 0.32, 0.225), V(-0.1, 0.37, 0.19), V(-0.09, 0.44, 0.06)];
  C.push(paint(tube(curveSamples(cordPts, 11, () => 0.012), { seg: 6, axis: V(0, 0, 1) }), SW.vine, 'flat'));
  S.push(paint(leaf(V(0.055, 0.33, 0.228), V(0.55, -1, 0.15), V(0.1, 0.1, 1), 0.085, 0.03, 0.008), SW.leaf, 'y'));
  S.push(paint(leaf(V(0.085, 0.345, 0.222), V(1, -0.35, 0.1), V(0.1, 0.2, 1), 0.075, 0.026, 0.008), SW.leaf, 'y'));
  const PJ = V(0, 0.27, 0.228);
  C.push(paint(hull(plate([[0, 0.05], [0.042, 0.02], [0.03, -0.038], [-0.03, -0.038], [-0.042, 0.02]], PJ, PJ.z - 0.012, PJ.z + 0.016)), SW.jade, 'y', [0.22, 0.32]));
  C.push(flat(hull(plate([[0, 0.024], [0.017, 0.006], [0.011, -0.017], [-0.011, -0.017], [-0.017, 0.006]], PJ, PJ.z + 0.012, PJ.z + 0.021)), SW.jadeD));

  for (const g of [...C.slice(c1), ...S.slice(s1)]) g.translate(0, DY, 0);

  const g = assemble(C, S);
  g.scale(1.12, 1.12, 1.12); // squat frog: bump overall size toward standard pet height
  g.computeBoundingBox();
  return g;
}

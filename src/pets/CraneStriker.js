// Crane Striker (SECRET, Round 7 Blossom Brawl): chunky white red-crowned crane in a wide-winged kung-fu crane stance,
// silk sash with trailing tails, jade pendant and anklets, cherry blossoms, glowing jade patterns, floating petal halo.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  white:  { i: 0, top: '#FFFFFF', bot: '#F2F1F7' },
  feath:  { i: 1, top: '#FFFFFF', bot: '#ECEBF3' },
  black:  { i: 2, top: '#3A3946', bot: '#17161E' },
  red:    { i: 3, top: '#FF3B3B', bot: '#C8121F' },
  beak:   { i: 4, top: '#F6EBBC', bot: '#C2AA6A' },
  leg:    { i: 5, top: '#64627A', bot: '#34333F' },
  claw:   { i: 6, top: '#2A2830', bot: '#141218' },
  eye:    { i: 7, top: '#1A1416', bot: '#0C0A0B' },
  eyeW:   { i: 8, top: '#FFFFFF', bot: '#F1F1F4' },
  jade:   { i: 10, top: '#4FD6A0', bot: '#13805A' },
  glow:   { i: 11, top: '#C8FFF0', bot: '#38F2C0', glow: true },
  petal:  { i: 12, top: '#FFE0EC', bot: '#FF8CB8' },
  silk:   { i: 13, top: '#FF5A78', bot: '#C21A48' },
  gold:   { i: 14, top: '#FFE46C', bot: '#E39E12' },
  pglow:  { i: 15, top: '#FF9AD5', bot: '#FF4FB0', glow: true },
  wingW:  { i: 18, top: '#FFFFFF', bot: '#E4EAF5' },
  wingB:  { i: 16, top: '#34333F', bot: '#1C1B24' },
  // flight feather: white with a crisp black tip (mapped along the feather with 'len')
  ftip: {
    i: 17, draw(g, x, y) {
      const gr = g.createLinearGradient(0, y, 0, y + 74);
      gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(1, '#E4EAF5');
      g.fillStyle = gr; g.fillRect(x, y, 128, 74);
      g.fillStyle = '#26252F'; g.fillRect(x, y + 74, 128, 54);
    },
  },
};
const P = PALETTE;

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const sub = (a, b) => a.clone().sub(b);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);

// flat faceted blade: polygon prism in the plane of dir with normal n
function blade(base, dir, n, L, w, th = 0.016, shape = null) {
  const d = nrm(dir);
  const nn = nrm(add(n, d, -n.dot(d)));
  const v = nrm(cross(nn, d));
  const pts2 = shape || [[0, -0.3], [0, 0.3], [0.2, 0.5], [0.8, 0.5], [1, 0.05], [0.8, -0.5], [0.2, -0.5]];
  const pts = [];
  for (const [u, s] of pts2) {
    const p = add(add(base, d, u * L), v, s * w);
    const t = th * (u > 0.9 ? 0.6 : 1);
    pts.push(add(p, nn, t / 2), add(p, nn, -t / 2));
  }
  return hull(pts);
}
// thick keeled feather (diamond section) with a slight curl of the tip toward -n
function feather(base, dir, n, L, w, th, bend = 0.03) {
  const d = nrm(dir);
  const nn = nrm(add(n, d, -n.dot(d)));
  const v = nrm(cross(nn, d));
  const prof = [[0, 0.55, 1], [0.3, 1, 1], [0.66, 0.82, 0.8], [1, 0.06, 0.3]];
  const smp = prof.map(([t, kw, kt]) => ({ p: add(add(base, d, L * t), nn, -bend * t * t), rx: w * kw, ry: th * kt }));
  return tube(smp, { seg: 4, axis: v, phase: 0, capStart: 0, capEnd: 0 });
}
const PETAL = [[0, 0], [0.45, 0.5], [1, 0.25], [1, -0.25], [0.45, -0.5]];
const petal = (c, d, n, L, w, sw = P.petal) => paint(blade(c, d, n, L, w, 0.014, PETAL), sw, 'flat');

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const wh = (g, lo, hi) => paint(g, P.white, 'y', lo === undefined ? null : [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');
  const fplate = (b, d, n, w, l, th = 0.022, sw = P.feath) => paint(blade(b, d, n, l, w, th,
    [[0, -0.75], [0, 0.75], [0.35, 1], [0.75, 0.7], [1, 0], [0.75, -0.7], [0.35, -1]]), sw, 'flat');

  // five-petal blossom facing n (up vector u), gold centre
  const flower = (out, c, n, u, r) => {
    n = nrm(n); u = nrm(add(u, n, -u.dot(n)));
    const w = cross(n, u);
    for (let k = 0; k < 5; k++) {
      const a = (2 * Math.PI * k) / 5;
      const d = add(u.clone().multiplyScalar(Math.cos(a)), w, Math.sin(a));
      out.push(petal(add(c, d, r * 0.15), d, n, r, r * 0.75));
    }
    out.push(paint(blob(0, add(c, n, 0.008), V(r * 0.32, r * 0.32, r * 0.32)), P.gold, 'flat'));
  };

  // ================= BODY (big round chunky breast, like the rooster) =================
  const bodyG = wh(hull([
    ...ring(V(0, 0.48, -0.34), 0.1, 0.09, 10, 'z'),
    ...ring(V(0, 0.48, -0.24), 0.2, 0.18, 10, 'z'),
    ...ring(V(0, 0.5, -0.1), 0.245, 0.215, 10, 'z'),
    ...ring(V(0, 0.53, 0.04), 0.24, 0.225, 10, 'z'),
    ...ring(V(0, 0.58, 0.15), 0.2, 0.2, 10, 'z'),
    ...ring(V(0, 0.65, 0.22), 0.12, 0.12, 10, 'z'),
  ]), 0.3, 0.8);
  C.push(bodyG);
  const bodyMesh = new THREE.Mesh(bodyG, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  const rc = new THREE.Raycaster();
  const surf = (o, d) => { rc.set(o, nrm(d)); const h = rc.intersectObject(bodyMesh); return h.length ? h[h.length - 1].point : add(o, nrm(d), 0.2); };

  // breast feathers: big layered plates hugging the body, pointing down (front) and down-back (flanks)
  for (const [y, angs, w, l] of [
    [0.66, [0, 0.5], 0.085, 0.15],
    [0.55, [0, 0.45, 0.95, 1.45], 0.09, 0.16],
    [0.44, [0, 0.5, 1.05, 1.6], 0.095, 0.15],
  ]) {
    for (const a of angs) {
      const hd = V(Math.sin(a), 0, Math.cos(a));
      const b = add(surf(V(0, y, -0.04), hd), hd, 0.006);
      const d = nrm(add(V(0, -1, 0), V(hd.x * 0.25, 0, hd.z * 0.25 - Math.sin(a) * 0.35)));
      const n = nrm(add(hd, V(0, 0.35, 0)));
      (a === 0 ? C : S).push(fplate(b, d, n, w, l));
    }
  }

  // ================= NECK (black, thick, gentle S-curve; gold collar + jade pendant) =================
  C.push(paint(tube(curveSamples([V(0, 0.62, 0.12), V(0, 0.71, 0.08), V(0, 0.79, 0.1), V(0, 0.86, 0.15)], 6,
    (t) => 0.11 - 0.02 * t), { seg: 8, axis: X, phase: Math.PI / 8 }), P.black, 'y', [0.6, 0.9]));
  C.push(paint(hull([...ring(V(0, 0.68, 0.09), 0.125, 0.12, 10, 'y'), ...ring(V(0, 0.715, 0.085), 0.12, 0.115, 10, 'y')]), P.gold, 'y'));
  const PD = add(surf(V(0, 0.585, 0), V(0, 0, 1)), V(0, 0, 1), 0.035);
  C.push(paint(hull(plate(ringPts(0.055, 8), V(0, PD.y, 0), PD.z, PD.z + 0.026)), P.jade, 'y'));
  C.push(paint(hull(plate(ringPts(0.024, 8), V(0, PD.y, 0), PD.z + 0.02, PD.z + 0.033)), P.glow, 'flat'));
  C.push(paint(hull([...cbox(V(0, 0.66, 0.205), 0.012, 0.012, 0.012, 0.004), ...cbox(V(0, PD.y + 0.05, PD.z + 0.012), 0.012, 0.01, 0.01, 0.004)]), P.gold, 'flat'));

  // ================= HEAD (big, sculpted, tapering toward the beak) =================
  const H = { y: 0.97, z: 0.14 };
  const FZ = H.z + 0.165;
  C.push(wh(hull([
    ...cbox(V(0, H.y + 0.005, H.z + 0.11), 0.165, 0.135, 0.055, 0.03),
    ...ring(V(0, H.y, H.z - 0.04), 0.2, 0.165, 8, 'z'),
    ...ring(V(0, H.y + 0.01, H.z - 0.17), 0.125, 0.115, 8, 'z'),          // rounded back of skull
    ...ring(V(0, H.y + 0.17, H.z - 0.01), 0.11, 0.1, 8, 'y'),              // domed crown
    V(0.195, H.y - 0.05, H.z - 0.01), V(-0.195, H.y - 0.05, H.z - 0.01),   // cheek facets
    V(0.15, H.y - 0.13, H.z + 0.05), V(-0.15, H.y - 0.13, H.z + 0.05),     // jowls
    V(0.08, H.y - 0.075, FZ + 0.015), V(-0.08, H.y - 0.075, FZ + 0.015),   // lower face tapers into the beak
  ]), 0.82, 1.14));
  // black throat / chin wedge under the beak
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.115, H.z + 0.07), 0.11, 0.05, 0.1, 0.03),
    V(0, H.y - 0.065, FZ + 0.045), V(0.06, H.y - 0.085, FZ + 0.03), V(-0.06, H.y - 0.085, FZ + 0.03),
  ]), P.black, 'y', [H.y - 0.17, H.y]));
  // red crown patch: low faceted dome hugging the top of the head
  C.push(paint(hull([
    ...ring(V(0, H.y + 0.158, H.z + 0.045), 0.12, 0.1, 8, 'y'),
    ...ring(V(0, H.y + 0.188, H.z + 0.02), 0.08, 0.07, 8, 'y'),
    V(0, H.y + 0.198, H.z + 0.01),
    V(0, H.y + 0.14, H.z + 0.15), V(0.06, H.y + 0.14, H.z + 0.14), V(-0.06, H.y + 0.14, H.z + 0.14),
  ]), P.red, 'y', [H.y + 0.13, H.y + 0.2]));
  // nape + cheek feather shards (white, swept back)
  C.push(fplate(V(0, H.y + 0.06, H.z - 0.2), V(0, -0.5, -1), V(0, 1, -0.5), 0.07, 0.13));
  S.push(fplate(V(0.09, H.y + 0.03, H.z - 0.19), V(0.35, -0.5, -1), V(0.5, 1, -0.5), 0.06, 0.12));
  S.push(fplate(V(0.18, H.y - 0.06, H.z - 0.03), V(0.35, -0.45, -1), V(1, 0.2, -0.2), 0.055, 0.13));
  // beak: big strong point
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.04, FZ + 0.02), 0.07, 0.05, 0.02, 0.014),
    V(0.032, H.y - 0.02, FZ + 0.13), V(-0.032, H.y - 0.02, FZ + 0.13),
    V(0.026, H.y - 0.075, FZ + 0.13), V(-0.026, H.y - 0.075, FZ + 0.13),
    V(0, H.y - 0.055, FZ + 0.27),
  ]), P.beak, 'y', [H.y - 0.09, H.y + 0.01]));
  C.push(paint(hull([V(0.03, H.y - 0.054, FZ + 0.13), V(-0.03, H.y - 0.054, FZ + 0.13),
    V(0, H.y - 0.056, FZ + 0.255), V(0.03, H.y - 0.05, FZ + 0.13), V(0, H.y - 0.052, FZ + 0.255)]), P.claw, 'flat'));
  // eyes (tilted to follow the cheek)
  const E = V(0.08, H.y + 0.04, 0), ek = 1.75, TL = 0.35, FE = FZ + 0.008;
  const K = (a) => a.map(([u, v]) => [u * ek, v * ek]);
  S.push(flat(hull(plate(K([[-0.036, 0.004], [0.04, 0.03], [0.045, -0.01], [0.018, -0.036], [-0.026, -0.032], [-0.04, -0.014]]),
    E, FE - 0.01, FE + 0.012, TL)), P.eyeW));
  S.push(flat(hull(plate(K([[-0.022, 0.004], [0.011, 0.016], [0.017, -0.007], [0.004, -0.024], [-0.016, -0.022], [-0.025, -0.009]]),
    V(E.x - 0.008, E.y - 0.002, 0), FE + 0.006, FE + 0.019, TL)), P.eye));
  S.push(flat(hull(plate(K([[-0.006, -0.006], [0.006, -0.006], [0.006, 0.006], [-0.006, 0.006]]),
    V(E.x - 0.001, E.y + 0.002, 0), FE + 0.016, FE + 0.023, TL)), P.eyeW));
  // heavy black brow slanting down toward the beak
  S.push(paint(hull([
    V(0.015, E.y + 0.012, FE + 0.03), V(0.017, E.y + 0.052, FE + 0.02),
    V(0.145, E.y + 0.064, FE - 0.03), V(0.145, E.y + 0.106, FE - 0.042),
    V(0.015, E.y + 0.012, FE - 0.03), V(0.017, E.y + 0.062, FE - 0.04),
    V(0.145, E.y + 0.064, FE - 0.085), V(0.145, E.y + 0.11, FE - 0.095),
  ]), P.black, 'y'));
  // glowing cheek marks under the eyes and on the temples
  S.push(paint(hull(plate([[-0.035, 0.006], [0.035, 0.0], [0.035, -0.012], [-0.035, -0.005]], V(0.11, H.y - 0.03, 0), FZ - 0.04, FZ + 0.008, 0.45)), P.glow, 'flat'));
  for (const [dy, dz] of [[0.0, 0.0], [-0.045, -0.035]])
    S.push(paint(hull([V(0.17, H.y + 0.03 + dy, H.z + 0.07 + dz), V(0.182, H.y + 0.03 + dy, H.z + 0.07 + dz),
      V(0.17, H.y + 0.0 + dy, H.z - 0.02 + dz), V(0.182, H.y + 0.0 + dy, H.z - 0.02 + dz),
      V(0.17, H.y + 0.012 + dy, H.z + 0.07 + dz), V(0.182, H.y + 0.012 + dy, H.z + 0.07 + dz),
      V(0.17, H.y - 0.016 + dy, H.z - 0.01 + dz), V(0.182, H.y - 0.016 + dy, H.z - 0.01 + dz)]), P.glow, 'flat'));
  // blossom tucked at the side of the crown
  flower(S, V(0.13, H.y + 0.13, H.z - 0.07), V(1, 0.7, -0.2), V(0, 1, 0.3), 0.045);

  // ================= LEGS (long but chunky; beefy feathered thighs; jade anklets) =================
  const LX = 0.115, LIFT = 0.06;
  S.push(wh(blob(1, V(LX, 0.36, -0.03), V(0.12, 0.11, 0.13), { jitter: 0.12 }), 0.25, 0.5));
  for (const [dx, dz, nx, nz] of [[0.05, 0.07, 0.4, 1], [0.1, -0.0, 1, 0.1], [0.05, -0.1, 0.5, -1], [-0.04, 0.08, -0.2, 1]])
    S.push(fplate(V(LX + dx, 0.34, -0.03 + dz), V(nx * 0.25, -1, nz * 0.2), V(nx, 0.2, nz), 0.06, 0.13));
  const SL = [];
  SL.push(paint(hull([...ring(V(LX, 0.3 + LIFT, -0.02), 0.07, 0.07, 8), ...ring(V(LX + 0.003, 0.19, -0.01), 0.065, 0.065, 8)]), P.leg, 'y', [0, 0.3]));
  SL.push(paint(blob(0, V(LX + 0.003, 0.185, -0.012), V(0.074, 0.06, 0.074)), P.leg, 'y', [0, 0.3]));
  SL.push(paint(hull([...ring(V(LX + 0.003, 0.19, -0.005), 0.062, 0.062, 8), ...ring(V(LX + 0.005, 0.045, 0.02), 0.06, 0.06, 8)]), P.leg, 'y', [0, 0.3]));
  SL.push(paint(hull([...ring(V(LX + 0.004, 0.1, 0.01), 0.074, 0.074, 8), ...ring(V(LX + 0.004, 0.135, 0.005), 0.074, 0.074, 8)]), P.jade, 'y', [0.09, 0.14]));
  SL.push(paint(hull([...ring(V(LX + 0.004, 0.112, 0.008), 0.077, 0.077, 8), ...ring(V(LX + 0.004, 0.123, 0.007), 0.077, 0.077, 8)]), P.glow, 'flat'));
  const foot = (x, z) => {
    SL.push(paint(hull(cbox(V(x, 0.036, z), 0.07, 0.036, 0.065, 0.016)), P.leg, 'y', [0, 0.08]));
    for (const [dx, dz] of [[-0.085, 0.11], [0, 0.145], [0.085, 0.11]]) {
      SL.push(paint(hull([...cbox(V(x + dx * 0.4, 0.03, z + dz * 0.4), 0.032, 0.03, 0.03, 0.01),
        ...cbox(V(x + dx, 0.026, z + dz), 0.028, 0.026, 0.024, 0.009)]), P.leg, 'y', [0, 0.08]));
      SL.push(paint(shard(V(x + dx * 1.07, 0.022, z + dz + 0.018), V(dx, -0.45, 0.8), 0.02, 0.045), P.claw, 'flat'));
    }
    SL.push(paint(hull(cbox(V(x, 0.026, z - 0.07), 0.026, 0.026, 0.04, 0.009)), P.leg, 'y', [0, 0.08]));
  };
  foot(LX + 0.005, 0.03);

  // ================= SILK SASH (tilted around the waist, blossom clasp, bow + trailing tails behind) =================
  const sashPts = [];
  const SC = V(0, 0.5, -0.02), SU = nrm(V(0, 0.9, -0.44));
  for (let k = 0; k <= 20; k++) {
    const a = (2 * Math.PI * k) / 20;
    const d = add(X.clone().multiplyScalar(Math.cos(a)), SU, Math.sin(a));
    sashPts.push({ p: add(surf(SC, d), nrm(d), 0.03), rx: 0.016, ry: 0.042 });
  }
  C.push(paint(tube(sashPts, { seg: 4, axis: cross(X, SU), phase: Math.PI / 4 }), P.silk, 'y', [0.28, 0.75]));
  const KN = add(surf(SC, SU), SU, 0.02);
  C.push(paint(blob(0, KN, V(0.04, 0.035, 0.04)), P.silk, 'y', [KN.y - 0.04, KN.y + 0.04]));
  S.push(paint(hull([V(0.01, KN.y + 0.012, KN.z), V(0.01, KN.y - 0.012, KN.z), V(0.1, KN.y + 0.04, KN.z - 0.02), V(0.1, KN.y - 0.04, KN.z - 0.02),
    V(0.01, KN.y + 0.012, KN.z - 0.03), V(0.01, KN.y - 0.012, KN.z - 0.03), V(0.095, KN.y + 0.035, KN.z - 0.045), V(0.095, KN.y - 0.035, KN.z - 0.045)]), P.silk, 'y', [KN.y - 0.05, KN.y + 0.05]));
  S.push(paint(tube(curveSamples([add(KN, V(0.015, -0.01, -0.01)), V(0.06, KN.y - 0.03, -0.24), V(0.1, KN.y - 0.1, -0.38),
    V(0.12, KN.y - 0.16, -0.5), V(0.16, KN.y - 0.18, -0.62)], 9, (t) => 0.009, (t) => 0.034 + 0.014 * t),
    { seg: 4, axis: V(0, 1, 0.3), phase: Math.PI / 4 }), P.silk, 'len'));
  S.push(paint(shard(V(0.16, KN.y - 0.18, -0.62), V(0.3, -0.3, -1), 0.045, 0.055, 4, 0.25), P.gold, 'flat'));

  // ================= TAIL BUSTLE (black tertial plates drooping back) =================
  C.push(fplate(V(0, 0.52, -0.3), V(0, -0.45, -1), V(0, 1, -0.3), 0.08, 0.2, 0.024, P.wingB));
  S.push(fplate(V(0.08, 0.51, -0.28), V(0.4, -0.55, -1), V(0.4, 1, -0.3), 0.075, 0.19, 0.024, P.wingB));
  S.push(fplate(V(0.12, 0.46, -0.26), V(0.6, -0.9, -1), V(0.8, 0.6, -0.3), 0.07, 0.17, 0.024, P.wingB));
  C.push(fplate(V(0, 0.57, -0.27), V(0, -0.25, -1), V(0, 1, -0.2), 0.07, 0.14));

  // ================= WINGS (raised, spread wide: kung-fu crane stance) =================
  const SH = V(0.2, 0.62, -0.04), WR = V(0.41, 0.86, -0.09), TP = V(0.6, 1.0, -0.14);
  const armDir = nrm(sub(TP, SH));
  const wingN = (dir) => { const n = nrm(cross(armDir, dir)); if (n.z < 0) n.multiplyScalar(-1); return n; };
  const edgePts = [SH, add(SH, sub(WR, SH), 0.5), WR, add(WR, sub(TP, WR), 0.5), TP];
  const edge = new THREE.CatmullRomCurve3(edgePts, false, 'centripetal');
  S.push(paint(tube(curveSamples(edgePts, 7, (t) => 0.065 - 0.03 * t, (t) => 0.05 - 0.02 * t),
    { seg: 6, ref: V(0, 0, 1), capEnd: 0.045, capStart: 0.01 }), P.wingW, 'len'));
  S.push(wh(hull([...ring(V(0.17, 0.6, -0.04), 0.06, 0.12, 8, 'x'), V(0.28, 0.72, -0.06), V(0.25, 0.56, -0.04)]), 0.5, 0.78));
  const NF = 7;
  for (let i = 0; i < NF; i++) {
    const t = 0.08 + 0.92 * i / (NF - 1);
    const p = edge.getPoint(t);
    const dir = nrm(V(0.15 + 0.85 * t, -1 + 0.35 * t, -0.42));
    const n = wingN(dir);
    const L = 0.3 + 0.16 * t;
    // flight feather: thick, keeled, white with black tip
    S.push(paint(feather(add(p, n, -0.008), dir, n, L, 0.06, 0.022, 0.035), P.ftip, 'len'));
    // covert layered in front, glowing vein on every other one
    S.push(paint(blade(add(p, n, 0.022), dir, n, L * 0.45, 0.12, 0.024, [[0, -0.35], [0, 0.35], [0.3, 0.5], [1, 0], [0.3, -0.5]]), P.wingW, 'flat'));
    if (i % 2 === 0)
      S.push(paint(blade(add(add(p, dir, L * 0.42), n, 0.012), dir, n, L * 0.32, 0.016, 0.014, [[0, 0], [0.5, 0.5], [1, 0], [0.5, -0.5]]), P.glow, 'flat'));
  }
  const wn = wingN(V(0.3, -1, -0.25));
  flower(S, add(edge.getPoint(0.28), wn, 0.055), wn, V(0, 1, 0), 0.05);

  // ================= FLOATING PETAL HALO (behind the head: chunky glowing ring + blossom petals + jade) =================
  const RC = V(0, H.y + 0.03, H.z - 0.3), RR = 0.29;
  const arc = [];
  for (let k = 0; k <= 14; k++) {
    const a = -Math.PI / 6 + (k / 14) * (Math.PI * 4 / 3);
    arc.push({ p: add(RC, V(Math.cos(a), Math.sin(a), 0), RR), rx: 0.03, ry: 0.034 });
  }
  C.push(paint(tube(arc, { seg: 6, axis: V(0, 0, 1), phase: 0, capStart: 0.015, capEnd: 0.015 }), P.pglow, 'flat'));
  for (let k = 0; k <= 4; k++) {
    const a = Math.PI / 2 - k * (Math.PI / 6);
    const d = V(Math.cos(a), Math.sin(a), 0);
    const c = add(RC, d, RR);
    const tgt = k === 0 ? C : S;
    tgt.push(paint(blade(add(c, d, -0.035), d, V(0, 0, 1), 0.13, 0.1, 0.02,
      [[0, 0], [0.35, 0.48], [0.85, 0.42], [1, 0], [0.85, -0.42], [0.35, -0.48]]), P.petal, 'flat'));
    if (k === 2) tgt.push(paint(blob(0, add(RC, V(Math.cos(a + Math.PI / 12), Math.sin(a + Math.PI / 12), 0), RR), V(0.04, 0.04, 0.04)), P.jade, 'flat'));
  }
  S.push(paint(blob(0, add(RC, V(Math.cos(-Math.PI / 6), Math.sin(-Math.PI / 6), 0), RR), V(0.045, 0.045, 0.045)), P.jade, 'flat'));

  for (const g of [...C, ...S]) g.translate(0, LIFT, 0);
  const out = assemble(C, [...S, ...SL]);
  out.scale(0.86, 0.86, 0.86);
  out.computeBoundingBox();
  return out;
}

function ringPts(r, n) {
  const out = [];
  for (let k = 0; k < n; k++) { const a = Math.PI / n + (2 * Math.PI * k) / n; out.push([Math.cos(a) * r, Math.sin(a) * r]); }
  return out;
}

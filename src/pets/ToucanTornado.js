// Toucan Tornado: chunky faceted black toucan with a huge orange/yellow beak, white throat bib,
// wings ending in clenched feather fists, vine wrist wraps with leaves and a carved jade necklace.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  body:   { i: 0, top: '#3a3a44', bot: '#15151c' },
  bodyL:  { i: 1, top: '#4d4d5a', bot: '#25252f' },
  cream:  { i: 2, top: '#FFFAEC', bot: '#EEDDB8' },
  beak:   { i: 3, top: '#FFD93A', bot: '#FF7414' },
  tip:    { i: 4, top: '#C2441A', bot: '#561608' },
  lowBk:  { i: 5, top: '#FF9A26', bot: '#E2560C' },
  eye:    { i: 6, top: '#1A1416', bot: '#0C0A0B' },
  eyeW:   { i: 7, top: '#FFFFFF', bot: '#F1F1F4' },
  skin:   { i: 8, top: '#5CCBFF', bot: '#1F7FE0' },
  leg:    { i: 9, top: '#7F9DCB', bot: '#45618F' },
  claw:   { i: 10, top: '#3a3a44', bot: '#1c1c24' },
  vine:   { i: 11, top: '#5BAE3A', bot: '#2C6A1E' },
  leaf:   { i: 12, top: '#82DA4A', bot: '#2E8C26' },
  jade:   { i: 13, top: '#7DF0C4', bot: '#17A07A' },
  jadeD:  { i: 14, top: '#3CC99A', bot: '#0E6E55' },
  red:    { i: 15, top: '#F2483A', bot: '#B01E1E' },
  gape:   { i: 16, top: '#2A1410', bot: '#160806' },
  leafD:  { i: 17, top: '#4FB834', bot: '#1F6A1A' },
};
const P = PALETTE;

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const flat = (g, sw) => paint(g, sw, 'flat');
  const blk = (g, lo, hi) => paint(g, P.body, 'y', lo === undefined ? null : [lo, hi]);
  // flat faceted feather blade (from rookie_rooster)
  const fplate = (b, d, n, w, l, th = 0.014, sw = P.bodyL, mode = 'flat') => {
    d = d.clone().normalize(); n = n.clone().normalize();
    const sd = new THREE.Vector3().crossVectors(d, n).normalize();
    n = new THREE.Vector3().crossVectors(sd, d).normalize();
    const pts = [];
    const at = (u, v, h) => b.clone().addScaledVector(d, u).addScaledVector(sd, v).addScaledVector(n, h);
    for (const h of [-th, th * 0.3]) pts.push(at(0, w * 0.8, h), at(0, -w * 0.8, h), at(l * 0.3, w, h * 0.8), at(l * 0.3, -w, h * 0.8));
    pts.push(at(l, 0, -th * 0.3), at(l * 0.3, 0, th * 1.1), at(0, 0, th * 1.0));
    return paint(hull(pts), sw, mode);
  };

  // ================= BODY (upright plump egg) =================
  C.push(blk(hull([
    ...ring(V(0, 0.17, -0.03), 0.1, 0.09, 10, 'y'),
    ...ring(V(0, 0.26, -0.02), 0.165, 0.15, 10, 'y'),
    ...ring(V(0, 0.4, 0.0), 0.185, 0.165, 10, 'y'),
    ...ring(V(0, 0.53, 0.02), 0.165, 0.15, 10, 'y'),
    ...ring(V(0, 0.66, 0.05), 0.125, 0.12, 10, 'y'),
    V(0, 0.36, -0.21), V(0.07, 0.34, -0.19), V(-0.07, 0.34, -0.19),
  ]), 0.15, 0.7));

  // ================= HEAD =================
  const H = { y: 0.8, z: 0.06 };
  // rounded faceted head: stacked octagon-ish levels with a flat front face for the eyes
  const HF = H.z + 0.13;
  const lvl = (dy, sx, sb, fz = HF) => {
    const y = H.y + dy, pts = [];
    for (const sg of [-1, 1]) pts.push(
      V(sg * 0.16 * sx, y, fz), V(sg * 0.195 * sx, y, fz - 0.05), V(sg * 0.205 * sx, y, H.z - 0.03 * sb),
      V(sg * 0.165 * sx, y, H.z - 0.115 * sb), V(sg * 0.075 * sx, y, H.z - 0.145 * sb));
    return pts;
  };
  C.push(blk(hull([
    ...lvl(-0.145, 0.78, 0.75, HF - 0.03), ...lvl(-0.08, 0.95, 0.95), ...lvl(0.03, 1.0, 1.0),
    ...lvl(0.12, 0.93, 0.9), ...lvl(0.165, 0.78, 0.72, HF - 0.01),
    ...ring(V(0, H.y + 0.2, H.z - 0.01), 0.1, 0.085, 8, 'y'),
  ]), 0.62, 1.0));
  // side cheek feather tufts sweeping back
  S.push(fplate(V(0.2, H.y - 0.04, H.z + 0.02), V(0.3, -0.5, -1), V(1, 0, -0.1), 0.045, 0.1, 0.012));
  S.push(fplate(V(0.2, H.y + 0.05, H.z - 0.03), V(0.3, -0.1, -1), V(1, 0.2, -0.1), 0.04, 0.09, 0.012));
  const FZ = H.z + 0.13;
  // crown feathers swept back (a little "tornado" swirl)
  C.push(fplate(V(0, H.y + 0.15, H.z - 0.02), V(0, 0.5, -1), V(0, 1, 0.3), 0.05, 0.13, 0.014));
  S.push(fplate(V(0.06, H.y + 0.14, H.z - 0.04), V(0.4, 0.35, -1), V(0.3, 1, 0.2), 0.045, 0.11, 0.013));
  C.push(fplate(V(0, H.y + 0.08, H.z - 0.12), V(0, -0.2, -1), V(0, 1, -0.2), 0.055, 0.1, 0.013));
  S.push(fplate(V(0.15, H.y - 0.02, H.z - 0.06), V(0.5, -0.4, -1), V(1, 0.2, -0.2), 0.045, 0.09, 0.012));

  // beak: huge, deep at base, arcing culmen, tapering, slight hook; yellow top -> orange -> red-brown tip
  const by = H.y - 0.035;
  // [z, top(ridge), bottom(cutting edge), half-width]
  const UB = [[-0.03, 0.1, -0.03, 0.068], [0.08, 0.098, -0.032, 0.06], [0.18, 0.084, -0.036, 0.052],
    [0.27, 0.062, -0.04, 0.043], [0.34, 0.038, -0.045, 0.033], [0.395, 0.01, -0.052, 0.021]];
  const usec = ([z, t, b, w]) => [V(w, by + t - 0.022, FZ + z), V(-w, by + t - 0.022, FZ + z), V(0, by + t, FZ + z),
    V(w * 0.95, by + b, FZ + z), V(-w * 0.95, by + b, FZ + z)];
  for (let i = 0; i < UB.length - 1; i++)
    C.push(paint(hull([...usec(UB[i]), ...usec(UB[i + 1])]), i < 3 ? P.beak : P.tip, 'y',
      i < 3 ? [by - 0.045, by + 0.1] : [by - 0.075, by + 0.065]));
  C.push(paint(hull([...usec(UB[UB.length - 1]), V(0, by - 0.078, FZ + 0.43), V(0.008, by - 0.035, FZ + 0.425), V(-0.008, by - 0.035, FZ + 0.425)]),
    P.tip, 'y', [by - 0.075, by + 0.065]));
  // lower mandible (sits 0.008 below the upper's cutting edge)
  const LB = [[-0.03, -0.038, -0.09, 0.06], [0.15, -0.042, -0.082, 0.046], [0.3, -0.05, -0.074, 0.03]];
  const lsec = ([z, t, b, w]) => [V(w, by + t, FZ + z), V(-w, by + t, FZ + z), V(w * 0.8, by + b, FZ + z), V(-w * 0.8, by + b, FZ + z),
    V(0, by + b - 0.006, FZ + z)];
  for (let i = 0; i < LB.length - 1; i++) C.push(paint(hull([...lsec(LB[i]), ...lsec(LB[i + 1])]), P.lowBk, 'y', [by - 0.095, by - 0.035]));
  C.push(paint(hull([...lsec(LB[2]), V(0, by - 0.06, FZ + 0.355)]), P.tip, 'y', [by - 0.08, by - 0.04]));
  // thin dark gape line between the mandibles
  C.push(flat(hull([V(0.058, by - 0.029, FZ - 0.03), V(-0.058, by - 0.029, FZ - 0.03), V(0.058, by - 0.04, FZ - 0.03), V(-0.058, by - 0.04, FZ - 0.03),
    V(0.04, by - 0.036, FZ + 0.2), V(-0.04, by - 0.036, FZ + 0.2), V(0.04, by - 0.045, FZ + 0.2), V(-0.04, by - 0.045, FZ + 0.2),
    V(0.024, by - 0.042, FZ + 0.33), V(-0.024, by - 0.042, FZ + 0.33), V(0.024, by - 0.05, FZ + 0.33), V(-0.024, by - 0.05, FZ + 0.33)]), P.gape));

  // eyes: blue skin ring + white angry almond + big pupil + catchlight, heavy brow
  const E = V(0.095, H.y + 0.085, 0);
  const K = (a, k) => a.map(([u, v]) => [u * k, v * k]);
  const almond = [[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]];
  S.push(flat(hull(plate(K(almond, 1.4), V(E.x + 0.002, E.y - 0.004, 0), FZ - 0.02, FZ + 0.004)), P.skin));
  S.push(flat(hull(plate(almond, E, FZ - 0.01, FZ + 0.012)), P.eyeW));
  S.push(flat(hull(plate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]],
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), P.eye));
  S.push(flat(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.014, FZ + 0.021)), P.eyeW));
  S.push(paint(hull([
    V(0.03, E.y + 0.012, FZ + 0.032), V(0.032, E.y + 0.05, FZ + 0.022),
    V(0.165, E.y + 0.05, FZ - 0.01), V(0.165, E.y + 0.088, FZ - 0.025),
    V(0.03, E.y + 0.012, FZ - 0.03), V(0.032, E.y + 0.06, FZ - 0.04),
    V(0.165, E.y + 0.05, FZ - 0.06), V(0.165, E.y + 0.09, FZ - 0.07),
  ]), P.bodyL, 'y'));

  // ================= WHITE THROAT BIB =================
  C.push(paint(blob(1, V(0, 0.6, 0.11), V(0.14, 0.17, 0.1), { jitter: 0.12 }), P.cream, 'y', [0.42, 0.76]));
  C.push(flat(shard(V(0, 0.47, 0.18), V(0, -1, 0.4), 0.05, 0.09), P.cream));
  S.push(flat(shard(V(0.06, 0.48, 0.17), V(0.4, -1, 0.35), 0.045, 0.08), P.cream));
  S.push(flat(shard(V(0.11, 0.52, 0.14), V(0.8, -1, 0.2), 0.04, 0.07), P.cream));
  // white throat on the lower face, under the beak
  C.push(paint(hull([
    ...plate([[-0.12, -0.03], [0.12, -0.03], [0.14, -0.1], [0.09, -0.15], [-0.09, -0.15], [-0.14, -0.1]], V(0, H.y, 0), FZ - 0.06, FZ + 0.006),
  ]), P.cream, 'y', [H.y - 0.15, H.y - 0.03]));

  // ================= JADE NECKLACE =================
  const NK = (th) => { const c = Math.cos(th); return V(Math.sin(th) * 0.165, 0.645 - 0.06 * c * c, 0.06 + c * 0.17); };
  const cord = [];
  for (let i = 0; i <= 16; i++) cord.push(NK(-Math.PI + (2 * Math.PI * i) / 16));
  C.push(paint(tube(curveSamples(cord, 24, () => 0.008), { seg: 5 }), P.vine, 'flat'));
  const bead = (p, r) => flat(blob(0, p, V(r, r, r)), P.jade);
  for (const th of [0.32, 0.64, 0.96, 1.28]) S.push(bead(NK(th), 0.022));
  // carved jade pendant: hexagon plate with a raised carved centre
  const PZ = 0.218, PY = 0.535;
  C.push(flat(hull(plate([[0, 0.05], [0.04, 0.025], [0.04, -0.025], [0, -0.05], [-0.04, -0.025], [-0.04, 0.025]],
    V(0, PY, 0), PZ - 0.03, PZ)), P.jadeD));
  C.push(flat(hull(plate([[0, 0.03], [0.024, 0.0], [0, -0.03], [-0.024, 0.0]], V(0, PY, 0), PZ - 0.01, PZ + 0.012)), P.jade));
  C.push(bead(V(0, 0.585, 0.215), 0.02));
  C.push(flat(hull(cbox(V(0, 0.565, 0.205), 0.008, 0.02, 0.008, 0.003)), P.jadeD));

  // ================= WINGS ending in feather FISTS =================
  S.push(blk(hull([
    ...ring(V(0.165, 0.56, 0.01), 0.04, 0.08, 8, 'x'),
    ...ring(V(0.205, 0.4, 0.03), 0.045, 0.075, 8, 'x'),
    V(0.2, 0.36, 0.06), V(0.18, 0.42, -0.12), V(0.17, 0.5, -0.1),
  ]), 0.3, 0.62));
  // upper-wing feather shards
  for (const [y, z, dy, dz, w, l] of [
    [0.56, 0.03, -0.6, -1, 0.05, 0.13], [0.5, 0.05, -0.8, -0.8, 0.05, 0.12],
    [0.53, -0.04, -0.5, -1, 0.05, 0.13], [0.46, -0.03, -0.7, -1, 0.05, 0.12],
  ]) S.push(fplate(V(0.215, y, z), V(0.08, dy, dz), V(1, 0.1, 0), w, l, 0.012));
  // wrist
  S.push(blk(hull([...ring(V(0.215, 0.38, 0.05), 0.045, 0.05, 8, 'y'), ...ring(V(0.225, 0.32, 0.065), 0.045, 0.05, 8, 'y')]), 0.25, 0.5));
  // fist block + curled feather "fingers" + thumb
  const F = V(0.23, 0.255, 0.075);
  S.push(blk(hull(cbox(F, 0.055, 0.065, 0.06, 0.022)), 0.17, 0.33));
  for (const dy of [0.045, 0.015, -0.015, -0.045])
    S.push(paint(hull(cbox(V(F.x + 0.004, F.y + dy, F.z + 0.055), 0.05, 0.0135, 0.022, 0.009)), P.bodyL, 'y', [F.y - 0.07, F.y + 0.07]));
  S.push(paint(hull([...cbox(V(F.x - 0.04, F.y + 0.035, F.z + 0.04), 0.018, 0.018, 0.035, 0.007),
    ...cbox(V(F.x - 0.03, F.y + 0.0, F.z + 0.075), 0.016, 0.016, 0.015, 0.006)]), P.bodyL, 'y', [F.y - 0.07, F.y + 0.07]));
  // vine wrapped around the wrist + leaves
  const vp = [];
  for (let i = 0; i <= 14; i++) {
    const a = (i / 14) * Math.PI * 3.2, yy = 0.395 - (i / 14) * 0.08;
    vp.push(V(0.22 + Math.cos(a) * 0.056, yy, 0.055 + Math.sin(a) * 0.06));
  }
  S.push(paint(tube(curveSamples(vp, 22, () => 0.011), { seg: 5, capStart: 0.006, capEnd: 0.006 }), P.vine, 'flat'));
  // broad two-tone diamond leaves with a raised midrib
  const leaf = (b, d, n, w, l) => {
    d = d.clone().normalize(); n = n.clone().normalize();
    const sd = new THREE.Vector3().crossVectors(d, n).normalize();
    n = new THREE.Vector3().crossVectors(sd, d).normalize();
    const at = (u, v, h) => b.clone().addScaledVector(d, u).addScaledVector(sd, v).addScaledVector(n, h);
    for (const [sg, sw] of [[1, P.leaf], [-1, P.leafD]])
      S.push(flat(hull([at(0, 0, 0.006), at(0, 0, -0.006), at(l, 0, 0.003), at(l, 0, -0.003),
        at(l * 0.42, sg * w, 0.0), at(l * 0.42, sg * w, -0.006), at(l * 0.45, 0, 0.011), at(l * 0.45, 0, -0.008),
        at(l * 0.75, sg * w * 0.55, 0.0), at(l * 0.15, sg * w * 0.5, -0.003)]), sw));
  };
  leaf(V(0.268, 0.39, 0.075), V(0.6, 0.75, 0.15), V(0.35, -0.1, 1), 0.048, 0.085);
  leaf(V(0.275, 0.335, 0.06), V(1, -0.35, 0.15), V(0.25, 0.2, 1), 0.045, 0.08);
  leaf(V(0.255, 0.33, -0.01), V(0.35, -0.3, -1), V(1, 0.2, 0.1), 0.042, 0.075);

  // ================= LEGS (short, thick, blue-grey with planted toes) =================
  const legX = 0.09;
  S.push(blk(blob(1, V(legX, 0.19, 0.0), V(0.08, 0.075, 0.09), { jitter: 0.15 }), 0.1, 0.3));
  S.push(paint(hull([...ring(V(legX, 0.15, 0.0), 0.045, 0.045, 6), ...ring(V(legX + 0.004, 0.04, 0.02), 0.042, 0.042, 6)]), P.leg, 'y', [0, 0.18]));
  const foot = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.03, z), 0.05, 0.03, 0.05, 0.014)), P.leg, 'y', [0, 0.07]));
    for (const [dx, dz] of [[-0.05, 0.085], [0, 0.1], [0.05, 0.085]]) {
      S.push(paint(hull([...cbox(V(x + dx * 0.45, 0.025, z + dz * 0.45), 0.022, 0.025, 0.022, 0.008),
        ...cbox(V(x + dx, 0.021, z + dz), 0.02, 0.021, 0.016, 0.007)]), P.leg, 'y', [0, 0.07]));
      S.push(flat(shard(V(x + dx * 1.08, 0.019, z + dz + 0.012), V(dx, -0.45, 0.8), 0.016, 0.04), P.claw));
    }
    S.push(paint(hull(cbox(V(x, 0.022, z - 0.06), 0.02, 0.022, 0.035, 0.006)), P.leg, 'y', [0, 0.07]));
    S.push(flat(shard(V(x, 0.016, z - 0.092), V(0, -0.4, -1), 0.014, 0.035), P.claw));
  };
  foot(legX + 0.006, 0.03);

  // ================= TAIL (black blades down/back, red under-coverts) =================
  const blade = (pts, w, thick, sw) => paint(tube(curveSamples(pts, 7,
    (t) => thick * (1 - 0.5 * t), (t) => w * (1 - 0.35 * t) + 0.005),
    { seg: 4, axis: X, capEnd: 0.01, capStart: 0.0 }), sw, 'len');
  C.push(blade([V(0, 0.4, -0.16), V(0, 0.33, -0.24), V(0, 0.26, -0.29), V(0, 0.2, -0.32)], 0.06, 0.024, P.body));
  S.push(blade([V(0.035, 0.4, -0.15), V(0.06, 0.33, -0.22), V(0.075, 0.27, -0.27), V(0.085, 0.22, -0.29)], 0.05, 0.02, P.bodyL));
  // nape + back feather shards
  for (const [b, d, w, l] of [
    [V(0.07, H.y - 0.06, H.z - 0.12), V(0.3, -0.7, -0.6), 0.05, 0.1],
    [V(0.0, H.y - 0.09, H.z - 0.12), V(0, -0.8, -0.5), 0.055, 0.11],
    [V(0.06, 0.55, -0.1), V(0.3, -0.6, -1), 0.05, 0.1],
    [V(0.0, 0.5, -0.14), V(0, -0.6, -1), 0.055, 0.1],
  ]) (b.x === 0 ? C : S).push(fplate(b, d, V(b.x * 3, 0.4, -1), w, l, 0.012));
  // belly / flank feather facets
  for (const [b, d, n, w, l] of [
    [V(0.07, 0.36, 0.16), V(0.3, -1, 0.25), V(0.5, 0.1, 1), 0.045, 0.085],
    [V(0.14, 0.4, 0.1), V(0.5, -1, 0.0), V(1, 0.1, 0.6), 0.045, 0.085],
  ]) S.push(fplate(b, d, n, w, l, 0.012, P.body));
  C.push(paint(blob(0, V(0, 0.27, -0.16), V(0.075, 0.06, 0.07)), P.red, 'y', [0.2, 0.33]));
  S.push(flat(shard(V(0.04, 0.26, -0.17), V(0.3, -0.6, -1), 0.035, 0.07), P.red));

  return assemble(C, S);
}

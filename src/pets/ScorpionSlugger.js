// Scorpion Slugger (Rare, Round 3 - Desert Dojo): orange desert scorpion with sandy armour plates,
// fist-like pincers, raised curled stinger tail, sandstone / gold / lapis ornaments.
import { V, THREE, hull, cbox, ring, plate, shard, paint, assemble } from '../kit.js';

export const PALETTE = {
  body:   { i: 0, top: '#FF9A3C', bot: '#D2581C' },
  armor:  { i: 1, top: '#F6DDA4', bot: '#CFA466' },
  sand:   { i: 2, top: '#E6BC84', bot: '#B9844E' },
  gold:   { i: 3, top: '#FFE07A', bot: '#D99A1E' },
  lapis:  { i: 4, top: '#4F7CF0', bot: '#1F3696' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:    { i: 6, top: '#1A1416', bot: '#0C0A0B' },
  brow:   { i: 7, top: '#E07A2C', bot: '#A9481A' },
  mouth:  { i: 8, top: '#5A2414', bot: '#3A160C' },
  belly:  { i: 9, top: '#FFC27A', bot: '#E59244' },
};
const SW = PALETTE;

// convex limb segment between a and b (n-sided prism, radii ra / rb)
function limbPts(a, b, ra, rb, n = 6, phase = Math.PI / 6) {
  const d = new THREE.Vector3().subVectors(b, a).normalize();
  const up = Math.abs(d.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
  const u = new THREE.Vector3().crossVectors(d, up).normalize();
  const w = new THREE.Vector3().crossVectors(u, d).normalize();
  const pts = [];
  for (const [c, r] of [[a, ra], [b, rb]])
    for (let k = 0; k < n; k++) {
      const t = phase + (2 * Math.PI * k) / n;
      pts.push(c.clone().addScaledVector(u, Math.cos(t) * r).addScaledVector(w, Math.sin(t) * r));
    }
  return pts;
}
const limb = (a, b, ra, rb, n, phase) => hull(limbPts(a, b, ra, rb, n, phase));

export function buildGeometry() {
  const C = [], S = [];
  const P = (g, sw, mode = 'y', r = null) => paint(g, sw, mode, r);

  // ================= HEAD / CEPHALOTHORAX (big, chunky) =================
  const H = { y: 0.36, z: 0.17 };
  C.push(P(hull([
    ...cbox(V(0, H.y, H.z), 0.215, 0.14, 0.175, 0.06),
    ...ring(V(0, H.y + 0.15, H.z - 0.02), 0.13, 0.12, 8, 'y'),
    V(0.22, H.y - 0.04, H.z + 0.05), V(-0.22, H.y - 0.04, H.z + 0.05),
    ...ring(V(0, H.y - 0.14, H.z), 0.13, 0.12, 8, 'y'),
  ]), SW.body, 'y', [0.18, 0.5]));
  const FZ = H.z + 0.175;
  // sandy armour crown plate on top of the head
  C.push(P(hull([
    ...ring(V(0, H.y + 0.155, H.z - 0.02), 0.115, 0.105, 8, 'y'),
    ...ring(V(0, H.y + 0.18, H.z - 0.03), 0.085, 0.075, 8, 'y'),
    V(0, H.y + 0.13, H.z + 0.15), V(0, H.y + 0.16, H.z + 0.12),
  ]), SW.armor, 'y', [H.y + 0.1, H.y + 0.19]));
  // side cheek armour plates
  S.push(P(hull(cbox(V(0.19, H.y - 0.01, H.z + 0.02), 0.035, 0.08, 0.12, 0.025)), SW.armor, 'y', [H.y - 0.1, H.y + 0.08]));

  // forehead lapis gem in a gold setting
  const G = V(0, H.y + 0.125, FZ - 0.045);
  C.push(P(hull([...plate([[0, 0.062], [0.055, 0], [0, -0.052], [-0.055, 0]], G, FZ - 0.075, FZ - 0.045)]), SW.gold, 'flat'));
  C.push(P(hull([...plate([[0, 0.044], [0.038, 0], [0, -0.036], [-0.038, 0]], G, FZ - 0.06, FZ - 0.032),
    V(0, G.y, FZ - 0.018)]), SW.lapis, 'y', [G.y - 0.04, G.y + 0.04]));
  // small gold horns on the brow corners
  S.push(P(shard(V(0.13, H.y + 0.135, H.z + 0.06), V(0.45, 1, -0.35), 0.03, 0.09), SW.gold, 'y', [H.y + 0.1, H.y + 0.24]));
  S.push(P(shard(V(0.07, H.y + 0.175, H.z - 0.04), V(0.25, 1, -0.6), 0.024, 0.07), SW.gold, 'y', [H.y + 0.15, H.y + 0.25]));

  // fierce eyes
  const E = V(0.1, H.y + 0.02, 0), k = 1.3, sc = (a) => a.map(([u, v]) => [u * k, v * k]);
  S.push(P(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.01, FZ + 0.012)), SW.white, 'flat'));
  S.push(P(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.005, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye, 'flat'));
  S.push(P(hull(plate(sc([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]]),
    V(E.x + 0.008, E.y + 0.003, 0), FZ + 0.014, FZ + 0.021)), SW.white, 'flat'));
  S.push(P(hull([
    V(0.025, E.y + 0.012, FZ + 0.035), V(0.027, E.y + 0.06, FZ + 0.025),
    V(0.185, E.y + 0.06, FZ - 0.01), V(0.185, E.y + 0.105, FZ - 0.025),
    V(0.025, E.y + 0.012, FZ - 0.03), V(0.027, E.y + 0.07, FZ - 0.04),
    V(0.185, E.y + 0.06, FZ - 0.06), V(0.185, E.y + 0.105, FZ - 0.07),
  ]), SW.brow, 'y'));

  // mouth + chelicerae (small sandy mandible blocks)
  C.push(P(hull(cbox(V(0, H.y - 0.075, FZ + 0.005), 0.06, 0.012, 0.01, 0.004)), SW.mouth, 'flat'));
  S.push(P(hull([...cbox(V(0.042, H.y - 0.105, FZ + 0.01), 0.032, 0.03, 0.035, 0.012),
    V(0.03, H.y - 0.13, FZ + 0.055)]), SW.armor, 'y', [H.y - 0.14, H.y - 0.07]));

  // ================= ABDOMEN (segmented sandy armour plates) =================
  C.push(P(hull([
    ...ring(V(0, 0.29, 0.08), 0.2, 0.1, 8, 'z'),
    ...ring(V(0, 0.3, -0.14), 0.22, 0.11, 8, 'z'),
    ...ring(V(0, 0.31, -0.4), 0.11, 0.085, 8, 'z'),
  ]), SW.belly, 'y', [0.18, 0.4]));
  // 5 overlapping sandy armour plates, tapering back, each a raised ridge with side skirts
  const segs = [[0.02, 0.215, 0.36], [-0.085, 0.235, 0.37], [-0.19, 0.225, 0.37], [-0.29, 0.19, 0.36], [-0.375, 0.145, 0.34]];
  segs.forEach(([z, w, y], i) => {
    C.push(P(hull([
      ...cbox(V(0, y, z), w, 0.04, 0.06, 0.025),
      ...ring(V(0, y + 0.06, z - 0.01), w * 0.62, 0.05, 8, 'y'),
      V(w + 0.01, y - 0.07, z - 0.02), V(-w - 0.01, y - 0.07, z - 0.02),
    ]), SW.armor, 'y', [y - 0.08, y + 0.07]));
    // gold stud on the ridge of every other plate, lapis on the middle one
    if (i % 2 === 0) C.push(P(hull([...ring(V(0, y + 0.06, z), 0.028, 0.028, 6, 'y', 0), V(0, y + 0.09, z)]),
      i === 2 ? SW.lapis : SW.gold, 'y', [y + 0.06, y + 0.09]));
  });

  // ================= LEGS (4 short, thick pairs, planted) =================
  const legs = [
    { z: 0.2, kz: 0.3, fz: 0.42, kx: 0.35, fx: 0.47 },
    { z: 0.07, kz: 0.11, fz: 0.16, kx: 0.39, fx: 0.54 },
    { z: -0.07, kz: -0.12, fz: -0.17, kx: 0.39, fx: 0.54 },
    { z: -0.2, kz: -0.31, fz: -0.44, kx: 0.35, fx: 0.47 },
  ];
  for (const L of legs) {
    const A = V(0.16, 0.27, L.z), K = V(L.kx, 0.33, L.kz), F = V(L.fx, 0.14, L.fz);
    // thick upper segment out to the knee
    S.push(P(limb(A, K, 0.078, 0.076, 6), SW.body, 'y', [0.12, 0.38]));
    // knee joint block with an armour cap
    S.push(P(hull(cbox(K, 0.082, 0.08, 0.08, 0.032)), SW.body, 'y', [0.12, 0.38]));
    S.push(P(hull([...cbox(V(K.x, K.y + 0.065, K.z), 0.085, 0.025, 0.078, 0.02), V(K.x + 0.095, K.y + 0.01, K.z)]),
      SW.armor, 'y', [0.32, 0.43]));
    // thicker short lower segment down to the foot
    S.push(P(limb(K, F, 0.084, 0.072, 6), SW.body, 'y', [0.06, 0.38]));
    // foot: chunky sandstone tip, flat on ground (ground = y 0.06 before assemble)
    S.push(P(hull([...cbox(V(F.x + 0.012, 0.125, F.z), 0.075, 0.035, 0.075, 0.018), V(F.x + 0.06, 0.09, F.z + 0.06),
      V(F.x + 0.065, 0.09, F.z - 0.035)]), SW.sand, 'y', [0.09, 0.17]));
  }

  // ================= PINCERS (big fist-like claws) =================
  const sh = V(0.17, 0.27, 0.29), el = V(0.32, 0.25, 0.4), wr = V(0.28, 0.21, 0.53);
  S.push(P(limb(sh, el, 0.062, 0.066, 6), SW.body, 'y', [0.15, 0.35]));
  S.push(P(limb(el, wr, 0.064, 0.066, 6), SW.body, 'y', [0.15, 0.35]));
  S.push(P(hull(cbox(el, 0.07, 0.068, 0.07, 0.028)), SW.armor, 'y', [0.2, 0.34]));
  // gold wrist band
  S.push(P(limb(V(0.281, 0.215, 0.51), V(0.278, 0.208, 0.555), 0.078, 0.078, 8), SW.gold, 'y', [0.1, 0.28]));
  // the fist (palm) block
  const Hc = V(0.27, 0.19, 0.66);
  S.push(P(hull([
    ...cbox(Hc, 0.105, 0.095, 0.11, 0.04),
    V(Hc.x + 0.115, Hc.y, Hc.z - 0.02), V(Hc.x - 0.11, Hc.y, Hc.z - 0.02),
    V(Hc.x, Hc.y + 0.11, Hc.z - 0.02),
  ]), SW.body, 'y', [0.1, 0.32]));
  // armour plate on top of fist
  S.push(P(hull([...cbox(V(Hc.x, Hc.y + 0.09, Hc.z - 0.02), 0.08, 0.025, 0.08, 0.02)]), SW.armor, 'y', [0.27, 0.33]));
  // closed fingers curling forward (fixed outer finger + movable inner one), knuckle row
  S.push(P(hull([...cbox(V(Hc.x + 0.04, Hc.y + 0.005, Hc.z + 0.12), 0.06, 0.075, 0.05, 0.025),
    V(Hc.x + 0.03, Hc.y - 0.05, Hc.z + 0.17)]), SW.body, 'y', [0.1, 0.3]));
  S.push(P(hull([...cbox(V(Hc.x - 0.055, Hc.y - 0.005, Hc.z + 0.115), 0.045, 0.065, 0.045, 0.02),
    V(Hc.x - 0.05, Hc.y - 0.05, Hc.z + 0.16)]), SW.body, 'y', [0.1, 0.3]));
  for (const dx of [-0.06, 0.0, 0.06])
    S.push(P(hull(cbox(V(Hc.x + dx, Hc.y + 0.06, Hc.z + 0.135), 0.026, 0.026, 0.026, 0.01)), SW.sand, 'y', [0.22, 0.3]));
  // gold claw tips
  S.push(P(shard(V(Hc.x + 0.04, Hc.y - 0.04, Hc.z + 0.16), V(-0.4, -0.3, 1), 0.025, 0.05), SW.gold, 'flat'));
  S.push(P(shard(V(Hc.x - 0.05, Hc.y - 0.04, Hc.z + 0.15), V(0.4, -0.3, 1), 0.022, 0.045), SW.gold, 'flat'));
  // lapis gem in gold setting on top of each fist
  { const g = V(Hc.x, Hc.y + 0.118, Hc.z - 0.02);
    S.push(P(hull([...ring(g, 0.04, 0.04, 6, 'y', 0), ...ring(V(g.x, g.y - 0.012, g.z), 0.045, 0.045, 6, 'y', 0)]), SW.gold, 'flat'));
    S.push(P(hull([...ring(V(g.x, g.y + 0.004, g.z), 0.028, 0.028, 6, 'y', 0), V(g.x, g.y + 0.03, g.z)]), SW.lapis, 'y', [g.y, g.y + 0.03])); }
  // small spikes on top of the fist
  S.push(P(shard(V(Hc.x + 0.06, Hc.y + 0.1, Hc.z - 0.05), V(0.4, 1, -0.4), 0.022, 0.05), SW.armor, 'flat'));

  // ================= TAIL (segmented, curling up over the back) =================
  const curve = new THREE.CatmullRomCurve3([
    V(0, 0.3, -0.4), V(0, 0.44, -0.54), V(0, 0.64, -0.58), V(0, 0.82, -0.49), V(0, 0.92, -0.32), V(0, 0.9, -0.15),
  ], false, 'centripetal');
  const N = 6;
  const pts = [];
  for (let i = 0; i <= N; i++) pts.push(curve.getPoint(i / N));
  for (let i = 0; i < N; i++) {
    const a = pts[i], b = pts[i + 1];
    const r0 = 0.112 - i * 0.008, r1 = 0.1 - i * 0.008;
    const mid = a.clone().lerp(b, 0.5);
    const d = new THREE.Vector3().subVectors(b, a);
    const a2 = a.clone().addScaledVector(d, -0.08), b2 = b.clone().addScaledVector(d, 0.02);
    // bead segment: thin ends, fat middle
    C.push(P(hull([...limbPts(a2, mid, r0 * 0.8, r0, 6, Math.PI / 6), ...limbPts(mid, b2, r0, r1 * 0.8, 6, Math.PI / 6)]),
      SW.body, 'y', [0.25, 0.95]));
    // sandy armour plate on top/outside of each segment
    const out = mid.clone().sub(V(0, 0.64, -0.34)); out.addScaledVector(d.clone().normalize(), -out.dot(d.clone().normalize())); out.normalize();
    { const sp = [];
      for (const [c, R] of [[a.clone().lerp(b, 0.12), r0 * 1.04], [a.clone().lerp(b, 0.5), r0 * 1.1], [a.clone().lerp(b, 0.88), r1 * 1.0]]) {
        sp.push(c.clone().addScaledVector(out, R * 0.2));
        for (let t = -3; t <= 3; t++) {
          const th = t * Math.PI / 7;
          sp.push(c.clone().addScaledVector(out, Math.cos(th) * R).add(V(Math.sin(th) * R, 0, 0)));
        }
      }
      C.push(P(hull(sp), SW.armor, 'y', [0.3, 1])); }
    // gold band at the joint
    // gold band hugging the fat part of every other segment
    if (i % 2 === 1) C.push(P(limb(a.clone().lerp(b, 0.36), a.clone().lerp(b, 0.5), r0 * 0.93, r0 * 1.04, 6, Math.PI / 6),
      SW.gold, 'y', [0.3, 1]));
  }
  // stinger bulb + gold barb + lapis gem
  const tip = pts[N];
  const dir = new THREE.Vector3().subVectors(pts[N], pts[N - 1]).normalize();
  const bulbC = tip.clone().addScaledVector(dir, 0.05);
  C.push(P(hull([...limbPts(tip.clone().addScaledVector(dir, -0.02), bulbC, 0.06, 0.075, 8, Math.PI / 8),
    ...limbPts(bulbC, bulbC.clone().addScaledVector(dir, 0.06), 0.075, 0.035, 8, Math.PI / 8)]), SW.gold, 'y', [0.7, 0.95]));
  C.push(P(shard(bulbC.clone().addScaledVector(dir, 0.08), V(0, -0.8, 1), 0.03, 0.1), SW.gold, 'flat'));
  C.push(P(hull([V(0, bulbC.y + 0.11, bulbC.z), V(0.035, bulbC.y + 0.065, bulbC.z), V(-0.035, bulbC.y + 0.065, bulbC.z),
    V(0, bulbC.y + 0.065, bulbC.z + 0.035), V(0, bulbC.y + 0.065, bulbC.z - 0.035), V(0, bulbC.y + 0.03, bulbC.z)]), SW.lapis, 'y',
    [bulbC.y + 0.03, bulbC.y + 0.11]));

  return assemble(C, S);
}

// Turtle Tank (Secret, Round 8 - Ocean Octagon): green sea turtle with a thick tan armoured
// tank shell (hex scutes, riveted rim plates, raised turret plate), glowing cyan seams,
// coral + pearls on the shell, floating pearls above it, strong planted flippers.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  skin:   { i: 0, top: '#B0F592', bot: '#2F9447' },   // glossy wet green skin (bright top = wet sheen)
  skinDk: { i: 1, top: '#5CC060', bot: '#23743A' },   // head scales / flipper scales
  shell:  { i: 2, top: '#FADC9A', bot: '#CF9F58' },   // tan armour scutes
  rim:    { i: 3, top: '#D9AE68', bot: '#93683A' },   // darker armoured rim plates
  rivet:  { i: 4, top: '#FFE7A0', bot: '#D0A048' },   // gold rivets / trim
  belly:  { i: 5, top: '#F6EBB8', bot: '#D4BC78' },   // plastron
  glow:   { i: 6, top: '#9FF7FF', bot: '#3FD8FF', glow: true },
  white:  { i: 7, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:    { i: 8, top: '#1A1416', bot: '#0C0A0B' },
  beak:   { i: 9, top: '#EDE6A6', bot: '#B9A95E' },
  mouth:  { i: 10, top: '#3B2A1C', bot: '#24180F' },
  coral:  { i: 11, top: '#FF9DB0', bot: '#E8476C' },
  coral2: { i: 12, top: '#FFB46B', bot: '#F0703A' },
  pearl:  { i: 13, top: '#FFFFFF', bot: '#F6D2EC' },
  brow:   { i: 14, top: '#4FB257', bot: '#24763A' },
};
const SW = PALETTE;

// ---- shell ellipsoid ----
const EC = V(0, 0.25, -0.03), ER = V(0.37, 0.36, 0.44);
const eSurf = (d) => { const u = d.clone().normalize(); return V(EC.x + u.x * ER.x, EC.y + u.y * ER.y, EC.z + u.z * ER.z); };
const eNorm = (p) => V((p.x - EC.x) / (ER.x * ER.x), (p.y - EC.y) / (ER.y * ER.y), (p.z - EC.z) / (ER.z * ER.z)).normalize();
const toUnit = (p) => V((p.x - EC.x) / ER.x, (p.y - EC.y) / ER.y, (p.z - EC.z) / ER.z);
const dirPA = (polarDeg, azDeg) => {
  const p = THREE.MathUtils.degToRad(polarDeg), a = THREE.MathUtils.degToRad(azDeg);
  return V(Math.sin(p) * Math.sin(a), Math.cos(p), Math.sin(p) * Math.cos(a));
};
// plate following the ellipsoid: poly2d in tangent (u = azimuthal, v = toward pole), from depth b0 to height b1
function shellPlate(dir, poly, b0, b1, inset = 0.85, spin = 0) {
  const c = eSurf(dir), n = eNorm(c);
  let t1 = new THREE.Vector3().crossVectors(V(0, 1, 0), n);
  if (t1.lengthSq() < 1e-6) t1 = V(1, 0, 0);
  t1.normalize();
  const t2 = new THREE.Vector3().crossVectors(n, t1).normalize();
  const pts = [];
  const cs = Math.cos(spin), sn = Math.sin(spin);
  for (const [u0, v0] of poly) {
    const u = u0 * cs - v0 * sn, v = u0 * sn + v0 * cs;
    for (const [k, off] of [[1, -b0], [inset, b1]]) {
      const q = c.clone().addScaledVector(t1, u * k).addScaledVector(t2, v * k);
      const s = eSurf(toUnit(q));
      pts.push(s.addScaledVector(eNorm(s), off));
    }
  }
  return { g: hull(pts), c, n, t1, t2 };
}
const hexPoly = (r, rot = 0) => Array.from({ length: 6 }, (_, k) => {
  const a = rot + (k * Math.PI) / 3; return [Math.cos(a) * r, Math.sin(a) * r];
});

export function buildGeometry() {
  const C = [], S = [];
  const add = (g, x) => (x < 1e-4 && x > -1e-4 ? C : S).push(g);

  // ================= SHELL =================
  // glowing under-dome (shows between the scutes as glowing seams)
  {
    const pts = [];
    for (const pol of [0, 22, 44, 64, 80, 92]) {
      const n = pol === 0 ? 1 : 16;
      for (let k = 0; k < n; k++) pts.push(eSurf(dirPA(pol, 11.25 + k * 22.5)));
    }
    C.push(paint(hull(pts), SW.glow, 'flat'));
  }
  // plastron / belly
  C.push(paint(hull([...ring(V(0, 0.15, -0.03), 0.3, 0.37, 12, 'y', Math.PI / 12),
    ...ring(V(0, 0.24, -0.03), 0.355, 0.43, 12, 'y', Math.PI / 12)]), SW.belly, 'y', [0.12, 0.26]));

  // centre turret plate (raised, with a glowing rune ring and gold cap)
  {
    const t = shellPlate(V(0, 1, 0), hexPoly(0.135, Math.PI / 6), 0.02, 0.05, 0.88);
    C.push(paint(t.g, SW.shell, 'y', [0.5, 0.68]));
    const top = t.c.y + 0.05;
    C.push(paint(hull([...ring(V(0, top - 0.01, t.c.z), 0.085, 0.085, 6, 'y', Math.PI / 6),
      ...ring(V(0, top + 0.012, t.c.z), 0.085, 0.085, 6, 'y', Math.PI / 6)]), SW.glow, 'flat'));
    C.push(paint(hull([...ring(V(0, top, t.c.z), 0.072, 0.072, 6, 'y', Math.PI / 6),
      ...ring(V(0, top + 0.045, t.c.z), 0.05, 0.05, 6, 'y', Math.PI / 6)]), SW.shell, 'y', [top, top + 0.05]));
    C.push(paint(blob(0, V(0, top + 0.06, t.c.z), V(0.03, 0.025, 0.03)), SW.rivet, 'y'));
  }
  // ring 1: 6 hex scutes
  for (const az of [0, 60, 120, 180]) {
    const d = dirPA(42, az);
    const { g } = shellPlate(d, hexPoly(0.145, 0), 0.02, 0.04, 0.88);
    add(paint(g, SW.shell, 'y', [0.3, 0.66]), d.x);
  }
  // ring 2: 12 hex scutes
  for (const az of [0, 30, 60, 90, 120, 150, 180]) {
    const d = dirPA(71, az);
    const { g } = shellPlate(d, hexPoly(0.112, Math.PI / 6), 0.02, 0.036, 0.88);
    add(paint(g, SW.shell, 'y', [0.2, 0.6]), d.x);
  }
  // armoured rim: thick riveted skirt plates
  for (let k = 0; k < 8; k++) {
    const az = 11.25 + k * 22.5;
    const d = dirPA(93, az);
    const w = 0.068, h = 0.06;
    const p = shellPlate(d, [[-w, -h], [w, -h], [w, h], [-w, h]], 0.03, 0.045, 0.9);
    S.push(paint(p.g, SW.rim, 'y', [0.17, 0.33]));
    // two rivets on each plate
    for (const du of [-0.036, 0.036]) {
      const rc = p.c.clone().addScaledVector(p.t1, du).addScaledVector(p.t2, 0.02);
      const s = eSurf(toUnit(rc)), n = eNorm(s);
      const base = s.clone().addScaledVector(n, 0.035);
      S.push(paint(blob(0, base.clone().addScaledVector(n, 0.006), V(0.017, 0.017, 0.017)), SW.rivet, 'y'));
    }
  }

  // gold trim band under the rim plates (tank-skirt edge)
  C.push(paint(hull([...ring(V(0, 0.145, -0.03), 0.4, 0.475, 16, 'y', Math.PI / 16), ...ring(V(0, 0.185, -0.03), 0.41, 0.485, 16, 'y', Math.PI / 16)]), SW.rivet, 'y', [0.14, 0.19]));

  // ================= CORAL + PEARLS ON THE SHELL =================
  const coralBranch = (base, tip, r, sw) => tube(curveSamples([base, base.clone().lerp(tip, 0.5).add(V(0, 0.01, 0)), tip], 4,
    (t) => r * (1 - 0.45 * t)), { seg: 5, capEnd: r * 0.8 });
  {
    const onPlate = (pol, az, lift) => { const q = eSurf(dirPA(pol, az)); return q.addScaledVector(eNorm(q), lift); };
    // pink branching coral standing on a top costal plate
    const b = onPlate(42, 120, 0.03);
    S.push(paint(coralBranch(b, b.clone().add(V(0.03, 0.24, -0.03)), 0.04), SW.coral, 'len'));
    S.push(paint(coralBranch(b.clone().add(V(0.01, 0.07, -0.01)), b.clone().add(V(0.14, 0.19, -0.06)), 0.03), SW.coral, 'len'));
    S.push(paint(coralBranch(b.clone().add(V(0.0, 0.06, 0.0)), b.clone().add(V(-0.08, 0.19, 0.04)), 0.027), SW.coral, 'len'));
    // orange coral on a side plate
    const b2 = onPlate(71, 60, 0.03);
    S.push(paint(coralBranch(b2, b2.clone().add(V(0.06, 0.2, 0.0)), 0.035), SW.coral2, 'len'));
    S.push(paint(coralBranch(b2.clone().add(V(0.02, 0.06, 0)), b2.clone().add(V(0.14, 0.14, 0.05)), 0.026), SW.coral2, 'len'));
    S.push(paint(coralBranch(b2.clone().add(V(0.02, 0.05, 0)), b2.clone().add(V(0.05, 0.15, -0.07)), 0.024), SW.coral2, 'len'));
    // pearls resting on plates
    for (const [pol, az, r] of [[71, 120, 0.034], [71, 30, 0.03]]) {
      const ps = onPlate(pol, az, 0.03), pn = eNorm(ps);
      S.push(paint(blob(1, ps.clone().addScaledVector(pn, r * 0.8), V(r, r, r)), SW.pearl, 'y'));
    }
    const ps = onPlate(71, 180, 0.03), pn = eNorm(ps);
    C.push(paint(blob(1, ps.clone().addScaledVector(pn, 0.03), V(0.038, 0.038, 0.038)), SW.pearl, 'y'));
  }

  // ================= FLOATING DETAILS =================
  C.push(paint(blob(1, V(0, 0.9, -0.12), V(0.052, 0.052, 0.052)), SW.pearl, 'y'));
  S.push(paint(blob(1, V(0.17, 0.81, -0.18), V(0.04, 0.04, 0.04)), SW.pearl, 'y'));
  S.push(paint(hull([V(0.22, 0.84, -0.04), V(0.22, 0.74, -0.04), V(0.24, 0.79, -0.04), V(0.2, 0.79, -0.04), V(0.22, 0.79, -0.02), V(0.22, 0.79, -0.06)]), SW.glow, 'flat'));

  // ================= HEAD + NECK =================
  const skin = (g, lo, hi) => paint(g, SW.skin, 'y', [lo, hi]);
  C.push(skin(tube(curveSamples([V(0, 0.28, 0.2), V(0, 0.36, 0.34), V(0, 0.46, 0.44)], 4, () => 0.12, () => 0.105),
    { seg: 8, capStart: 0, capEnd: 0 }), 0.25, 0.6));
  const H = { y: 0.57, z: 0.52 };
  const c0 = C.length, s0 = S.length;
  C.push(skin(hull([
    ...ring(V(0, H.y, H.z + 0.135), 0.155, 0.12, 10, 'z', Math.PI / 10),
    ...ring(V(0, H.y + 0.01, H.z + 0.06), 0.172, 0.135, 10, 'z', Math.PI / 10),
    ...ring(V(0, H.y + 0.005, H.z - 0.06), 0.165, 0.13, 10, 'z', Math.PI / 10),
    ...ring(V(0, H.y - 0.005, H.z - 0.135), 0.11, 0.095, 10, 'z', Math.PI / 10),
    ...ring(V(0, H.y + 0.14, H.z - 0.0), 0.1, 0.08, 8, 'y'),
    V(0.17, H.y - 0.065, H.z - 0.02), V(-0.17, H.y - 0.065, H.z - 0.02),
    V(0.1, H.y - 0.085, H.z + 0.09), V(-0.1, H.y - 0.085, H.z + 0.09),
  ]), 0.42, 0.74));
  const FZ = H.z + 0.135;
  // hooked upper beak (wedge narrowing forward, tip hooks down)
  C.push(paint(hull([
    V(0.1, H.y - 0.02, FZ - 0.04), V(-0.1, H.y - 0.02, FZ - 0.04),
    V(0.11, H.y - 0.095, FZ - 0.03), V(-0.11, H.y - 0.095, FZ - 0.03),
    V(0, H.y - 0.0, FZ - 0.01),
    V(0.045, H.y - 0.03, FZ + 0.07), V(-0.045, H.y - 0.03, FZ + 0.07),
    V(0, H.y - 0.03, FZ + 0.095),
    V(0.03, H.y - 0.08, FZ + 0.1), V(-0.03, H.y - 0.08, FZ + 0.1),
    V(0, H.y - 0.13, FZ + 0.1),
  ]), SW.beak, 'y', [H.y - 0.12, H.y - 0.02]));
  // lower jaw
  C.push(paint(hull([
    V(0.095, H.y - 0.1, FZ - 0.04), V(-0.095, H.y - 0.1, FZ - 0.04),
    V(0.085, H.y - 0.145, FZ - 0.05), V(-0.085, H.y - 0.145, FZ - 0.05),
    V(0.035, H.y - 0.112, FZ + 0.045), V(-0.035, H.y - 0.112, FZ + 0.045),
    V(0.02, H.y - 0.135, FZ + 0.035), V(-0.02, H.y - 0.135, FZ + 0.035),
  ]), SW.beak, 'y', [H.y - 0.16, H.y - 0.09]));
  // mouth line + nostrils
  S.push(paint(hull([V(0, H.y - 0.103, FZ + 0.068), V(0, H.y - 0.096, FZ + 0.066), V(0.105, H.y - 0.096, FZ - 0.02),
    V(0.105, H.y - 0.09, FZ - 0.025), V(0, H.y - 0.103, FZ + 0.05), V(0.105, H.y - 0.098, FZ - 0.04)]), SW.mouth, 'flat'));
  S.push(paint(hull(cbox(V(0.02, H.y - 0.036, FZ + 0.083), 0.008, 0.006, 0.007, 0.002)), SW.mouth, 'flat'));
  // head scale plates (darker green)
  C.push(paint(hull([...ring(V(0, H.y + 0.13, H.z + 0.03), 0.085, 0.07, 6, 'y', 0), ...ring(V(0, H.y + 0.158, H.z + 0.03), 0.068, 0.055, 6, 'y', 0)]), SW.rivet, 'y', [H.y + 0.13, H.y + 0.16]));
  C.push(paint(hull([...ring(V(0, H.y + 0.155, H.z + 0.03), 0.03, 0.03, 4, 'y', 0), V(0, H.y + 0.19, H.z + 0.03)]), SW.glow, 'flat'));
  S.push(paint(hull([V(0.135, H.y + 0.1, H.z - 0.07), V(0.085, H.y + 0.138, H.z - 0.08), V(0.09, H.y + 0.135, H.z + 0.03),
    V(0.145, H.y + 0.1, H.z + 0.02), V(0.12, H.y + 0.112, H.z - 0.03), V(0.11, H.y + 0.128, H.z - 0.03)]), SW.skinDk, 'flat'));
  // glowing cheek chevrons
  S.push(paint(hull([V(0.17, H.y - 0.03, H.z + 0.05), V(0.172, H.y - 0.045, H.z + 0.06), V(0.177, H.y - 0.06, H.z - 0.02),
    V(0.175, H.y - 0.045, H.z - 0.03), V(0.16, H.y - 0.04, H.z + 0.02), V(0.163, H.y - 0.055, H.z - 0.02)]), SW.glow, 'flat'));

  // fierce eyes (punch_pup block, scaled up a touch)
  const E = V(0.068, H.y + 0.035, 0);
  const sc = (pts, k) => pts.map(([u, v]) => [u * k, v * k]);
  S.push(paint(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]], 1.14),
    E, FZ - 0.01, FZ + 0.012, 0.5)), SW.white, 'flat'));
  S.push(paint(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]], 1.14),
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018, 0.5)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.014, FZ + 0.021, 0.5)), SW.white, 'flat'));
  S.push(paint(hull([
    V(0.022, E.y + 0.014, FZ + 0.032), V(0.024, E.y + 0.054, FZ + 0.022),
    V(0.15, E.y + 0.056, FZ - 0.01), V(0.15, E.y + 0.096, FZ - 0.025),
    V(0.022, E.y + 0.014, FZ - 0.03), V(0.024, E.y + 0.064, FZ - 0.04),
    V(0.15, E.y + 0.056, FZ - 0.06), V(0.15, E.y + 0.098, FZ - 0.07),
  ]), SW.brow, 'y'));

  // scale the whole head block up about its centre (bigger, chunkier head)
  const HK = 1.16;
  for (const g of [...C.slice(c0), ...S.slice(s0)]) {
    g.translate(0, -H.y, -H.z); g.scale(HK, HK, HK); g.translate(0, H.y + 0.03, H.z + 0.03); g.computeVertexNormals();
  }

  // ================= FLIPPER LEGS =================
  // flat slab paddle from an outline [[x, z], ...] with thickness h (sits on y = 0)
  const slab = (outline, h) => hull(outline.flatMap(([x, z]) => [V(x, 0, z), V(x, h, z)]));
  const stripe = (x0, z0, x1, z1, y, w) => {
    const d = V(x1 - x0, 0, z1 - z0).normalize(), n = V(-d.z, 0, d.x).multiplyScalar(w);
    return paint(hull([V(x0 + n.x, y - 0.004, z0 + n.z), V(x0 - n.x, y - 0.004, z0 - n.z), V(x1 + n.x, y - 0.004, z1 + n.z), V(x1 - n.x, y - 0.004, z1 - n.z),
      V(x0 + n.x, y + 0.008, z0 + n.z), V(x0 - n.x, y + 0.008, z0 - n.z), V(x1 + n.x, y + 0.008, z1 + n.z), V(x1 - n.x, y + 0.008, z1 - n.z)]), SW.glow, 'flat');
  };
  const claw = (x, z, dx, dz) => paint(hull([V(x - dz * 0.02, 0.0, z + dx * 0.02), V(x + dz * 0.02, 0.0, z - dx * 0.02),
    V(x - dz * 0.02, 0.035, z + dx * 0.02), V(x + dz * 0.02, 0.035, z - dx * 0.02), V(x - dx * 0.02, 0.02, z - dz * 0.02),
    V(x + dx * 0.045, 0.004, z + dz * 0.045)]), SW.rivet, 'y', [0, 0.04]);
  // front: thick blocky column, widest at the base
  S.push(skin(hull([...ring(V(0.26, 0.28, 0.23), 0.1, 0.095, 8, 'y'), ...ring(V(0.3, 0.15, 0.27), 0.115, 0.11, 8, 'y'),
    ...ring(V(0.32, 0.055, 0.29), 0.135, 0.13, 8, 'y')]), 0.0, 0.34));
  // big broad front flipper paddle
  const FP = 0.055;
  S.push(skin(slab([[0.2, 0.2], [0.19, 0.36], [0.27, 0.47], [0.4, 0.54], [0.54, 0.56], [0.62, 0.5], [0.58, 0.38], [0.47, 0.25], [0.33, 0.16]], FP), 0.0, 0.34));
  S.push(stripe(0.42, 0.36, 0.56, 0.48, FP, 0.012));
  S.push(stripe(0.34, 0.42, 0.45, 0.51, FP, 0.01));
  for (const [x, z, dx, dz] of [[0.3, 0.5, 0.15, 1], [0.43, 0.555, 0.4, 0.9], [0.56, 0.555, 0.8, 0.6]]) {
    const L = Math.hypot(dx, dz); S.push(claw(x, z, dx / L, dz / L));
  }
  // rear: shorter blocky column + backward paddle
  S.push(skin(hull([...ring(V(0.22, 0.25, -0.3), 0.09, 0.09, 8, 'y'), ...ring(V(0.27, 0.13, -0.34), 0.1, 0.1, 8, 'y'),
    ...ring(V(0.29, 0.05, -0.36), 0.12, 0.115, 8, 'y')]), 0.0, 0.34));
  const RP = 0.048;
  S.push(skin(slab([[0.18, -0.26], [0.36, -0.24], [0.45, -0.34], [0.49, -0.48], [0.42, -0.57], [0.3, -0.54], [0.2, -0.44]], RP), 0.0, 0.34));
  S.push(stripe(0.36, -0.42, 0.45, -0.52, RP, 0.011));
  for (const [x, z, dx, dz] of [[0.36, -0.565, 0.3, -1], [0.47, -0.53, 0.8, -0.6]]) {
    const L = Math.hypot(dx, dz); S.push(claw(x, z, dx / L, dz / L));
  }

  // tail stub
  C.push(skin(hull([...ring(V(0, 0.2, -0.42), 0.065, 0.055, 6, 'z'), V(0, 0.12, -0.62)]), 0.1, 0.25));

  const g = assemble(C, S);
  return g;
}

// Polar Bruiser (Epic, Frozen Peaks): hulking white polar bear with pale-blue shading, round ears, huge clawed paws,
// bold icy-blue markings, ice armour plates (pauldrons + chest plate) and ice crystal clusters on the back.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  fur:     { i: 0, top: '#FFFFFF', bot: '#94C5F6' },
  furSh:   { i: 1, top: '#FFFFFF', bot: '#A8CFF6' },
  muzzle:  { i: 2, top: '#FFFFFF', bot: '#D6E4F3' },
  nose:    { i: 3, top: '#3A3D48', bot: '#15161C' },
  eye:     { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white:   { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  brow:    { i: 6, top: '#DCEBFB', bot: '#8DB4E2' },
  mark:    { i: 7, top: '#6FC9FF', bot: '#2C82D6' },
  ice:     { i: 8, top: '#E4FAFF', bot: '#74C0F0' },
  crystal: { i: 9, top: '#EFFFFF', bot: '#7FD6FF' },
  claw:    { i: 10, top: '#4C566A', bot: '#252A36' },
  mouth:   { i: 11, top: '#3E3540', bot: '#221C24' },
  earIn:   { i: 12, top: '#C4D9F0', bot: '#93B3DA' },
  pad:     { i: 13, top: '#FFFFFF', bot: '#C6DDF4' },
  trim:    { i: 14, top: '#4AA6EE', bot: '#1E62B0' },
};
const SW = PALETTE;

// oriented chamfered box points (rotation by Euler xyz, radians)
function obox(c0, hx, hy, hz, c, rx = 0, ry = 0, rz = 0) {
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz));
  return cbox(V(0, 0, 0), hx, hy, hz, c).map((p) => p.applyQuaternion(q).add(c0));
}

// curved armour shell around an axis parallel to z through O (in the x/y plane): rings at z0, mid, z1,
// outer radius R (ends pulled in by `taper`), thickness t, from angle a0 to a1 (degrees, 0 = +x, 90 = up)
function shell(O, z0, z1, R, t, a0, a1, n = 5, taper = 0.025) {
  const pts = [];
  for (const [z, r] of [[z0, R - taper], [(z0 + z1) / 2, R], [z1, R - taper]]) {
    for (let k = 0; k < n; k++) {
      const a = ((a0 + ((a1 - a0) * k) / (n - 1)) * Math.PI) / 180;
      for (const rr of [r, r - t]) pts.push(V(O.x + Math.cos(a) * rr, O.y + Math.sin(a) * rr, z));
    }
  }
  return hull(pts);
}

export function buildGeometry() {
  const C = [], S = [];
  const fur = (pts, lo = 0.1, hi = 0.8) => paint(hull(pts), SW.fur, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= BODY (massive, shoulder hump, slightly lower hips) =================
  C.push(fur([
    ...ring(V(0, 0.42, -0.44), 0.13, 0.12, 10, 'z'),
    ...ring(V(0, 0.43, -0.36), 0.21, 0.19, 10, 'z'),
    ...ring(V(0, 0.44, -0.16), 0.24, 0.21, 10, 'z'),
    ...ring(V(0, 0.47, 0.04), 0.27, 0.24, 10, 'z'),
    ...ring(V(0, 0.49, 0.2), 0.26, 0.24, 10, 'z'),
    ...ring(V(0, 0.5, 0.3), 0.19, 0.19, 10, 'z'),
  ], 0.22, 0.7));
  // shoulder hump + neck
  C.push(fur([...cbox(V(0, 0.65, 0.08), 0.17, 0.08, 0.17, 0.06)], 0.3, 0.78));
  C.push(fur([...ring(V(0, 0.52, 0.24), 0.18, 0.18, 8, 'z'), ...ring(V(0, 0.55, 0.38), 0.16, 0.16, 8, 'z')], 0.3, 0.8));

  // ================= LEGS (short, very thick) =================
  const FL = { x: 0.2, z: 0.2 }, BL = { x: 0.19, z: -0.3 };
  S.push(paint(blob(0, V(0.2, 0.44, 0.15), V(0.12, 0.15, 0.14), { jitter: 0.1 }), SW.fur, 'y', [0.1, 0.62]));
  S.push(fur([...ring(V(FL.x, 0.08, FL.z), 0.095, 0.095, 8), ...ring(V(FL.x + 0.005, 0.22, FL.z - 0.01), 0.11, 0.11, 8),
    ...ring(V(0.195, 0.36, 0.15), 0.12, 0.125, 8)], -0.1, 0.62));
  S.push(paint(blob(0, V(0.17, 0.41, -0.29), V(0.12, 0.16, 0.16), { jitter: 0.08 }), SW.fur, 'y', [0.15, 0.62]));
  S.push(fur([...ring(V(0.175, 0.32, -0.28), 0.1, 0.11, 8), ...ring(V(BL.x, 0.18, BL.z - 0.03), 0.1, 0.1, 8),
    ...ring(V(BL.x, 0.08, BL.z), 0.095, 0.095, 8)], 0.0, 0.6));

  // HUGE paws: broad pad block, 4 toes, dark claws
  const paw = (x, z, s = 1) => {
    S.push(paint(hull([...cbox(V(x, 0.05, z + 0.01), 0.112 * s, 0.05, 0.11 * s, 0.03),
      ...ring(V(x, 0.11, z - 0.005), 0.095, 0.095, 8)]), SW.pad, 'y', [0, 0.13]));
    for (const dx of [-0.066, -0.022, 0.022, 0.066]) {
      const tx = x + dx * s, tz = z + 0.105 * s;
      S.push(paint(hull(cbox(V(tx, 0.036, tz), 0.024, 0.036, 0.034, 0.012)), SW.pad, 'y', [0, 0.09]));
      S.push(paint(hull([V(tx - 0.012, 0.012, tz + 0.025), V(tx + 0.012, 0.012, tz + 0.025), V(tx - 0.01, 0.036, tz + 0.022),
        V(tx + 0.01, 0.036, tz + 0.022), V(tx, 0.003, tz + 0.06)]), SW.claw, 'y', [0, 0.04]));
    }
  };
  paw(FL.x, FL.z);
  paw(BL.x, BL.z, 0.95);

  // icy-blue bands on the forearms / shins (bold markings)
  S.push(paint(hull([...ring(V(FL.x + 0.003, 0.17, FL.z - 0.005), 0.111, 0.111, 8), ...ring(V(FL.x + 0.004, 0.205, FL.z - 0.008), 0.116, 0.116, 8)]), SW.mark, 'flat'));
  S.push(paint(hull([...ring(V(BL.x, 0.16, BL.z - 0.024), 0.106, 0.106, 8), ...ring(V(BL.x, 0.195, BL.z - 0.028), 0.107, 0.107, 8)]), SW.mark, 'flat'));

  // ================= NECK / SHOULDER SHARD FUR =================
  const furSh = (b, d, w, l, fl = 0.6) => paint(shard(b, d, w, l, 4, fl), SW.furSh, 'y', [0.25, 0.85]);
  for (const [z, cy, rx, ry, w, l, degs] of [
    [0.32, 0.55, 0.19, 0.2, 0.075, 0.11, [14, -20]],
    [0.22, 0.55, 0.24, 0.22, 0.07, 0.1, [-10, -38]],
  ]) {
    for (const deg of degs) {
      const th = (deg * Math.PI) / 180;
      const n = V(Math.cos(th), Math.sin(th), 0);
      const base = V(n.x * rx, cy + n.y * ry, z);
      const dir = n.clone().multiplyScalar(0.6).add(V(0, -0.45, -0.8));
      S.push(furSh(base, dir, w, l, 0.6));
    }
  }
  // chest ruff at the sides of the chest plate
  S.push(furSh(V(0.12, 0.36, 0.36), V(0.45, -1, 0.25), 0.06, 0.09));
  S.push(furSh(V(0.17, 0.42, 0.33), V(0.7, -1, 0.1), 0.06, 0.09));

  // ================= ICE ARMOUR =================
  // shoulder pauldrons: chunky curved ice shells wrapping over the shoulder, dark-blue rolled rim, crystal spike
  const PO = V(0.12, 0.5, 0);
  S.push(paint(shell(PO, 0.0, 0.3, 0.235, 0.075, 82, -18, 6, 0.03), SW.ice, 'y', [0.42, 0.74]));
  S.push(paint(shell(PO, -0.005, 0.305, 0.247, 0.06, -10, -30, 3, 0.03), SW.trim, 'y', [0.38, 0.5]));
  S.push(paint(shell(PO, 0.07, 0.23, 0.25, 0.05, 60, 40, 3, 0.012), SW.trim, 'y', [0.6, 0.72]));
  S.push(paint(shard(V(0.12 + 0.24 * Math.cos(0.9), 0.5 + 0.24 * Math.sin(0.9), 0.15), V(0.7, 1, -0.15), 0.042, 0.13, 5, 1),
    SW.crystal, 'y', [0.66, 0.84]));
  // hip armour: the same wrapped shell over each haunch
  const HO = V(0.1, 0.42, 0);
  S.push(paint(shell(HO, -0.42, -0.18, 0.215, 0.07, 76, -8, 6, 0.03), SW.ice, 'y', [0.38, 0.64]));
  S.push(paint(shell(HO, -0.425, -0.175, 0.227, 0.055, 0, -20, 3, 0.03), SW.trim, 'y', [0.33, 0.45]));
  // white shard fur poking out from under the armour edges and over the back of the neck
  for (const [deg, w, l] of [[78, 0.05, 0.09], [-12, 0.045, 0.08]]) {
    const a = (deg * Math.PI) / 180, b = V(PO.x + Math.cos(a) * 0.2, PO.y + Math.sin(a) * 0.2, -0.015);
    S.push(furSh(b, V(Math.cos(a) * 0.35, Math.sin(a) * 0.1 - 0.7, -1), w, l * 1.15, 0.5));
  }
  for (const [deg, w, l] of [[62, 0.045, 0.08], [-5, 0.04, 0.07]]) {
    const a = (deg * Math.PI) / 180, b = V(HO.x + Math.cos(a) * 0.175, HO.y + Math.sin(a) * 0.175, -0.43);
    S.push(furSh(b, V(Math.cos(a) * 0.35, Math.sin(a) * 0.1 - 0.7, -1), w, l * 1.15, 0.5));
  }
  C.push(furSh(V(0, 0.76, 0.2), V(0, 0.15, -1), 0.065, 0.12));
  S.push(furSh(V(0.075, 0.745, 0.2), V(0.45, 0.05, -1), 0.06, 0.11));
  C.push(furSh(V(0, 0.73, 0.07), V(0, 0.1, -1), 0.06, 0.1));
  S.push(furSh(V(0.08, 0.72, 0.06), V(0.5, 0.0, -1), 0.055, 0.09));
  // chest plate (hexagonal ice plate on the front of the chest) with a centre ridge
  C.push(paint(hull(plate([[-0.1, 0.05], [0, 0.085], [0.1, 0.05], [0.09, -0.06], [0, -0.1], [-0.09, -0.06]],
    V(0, 0.4, 0), 0.355, 0.39, 0.25)), SW.ice, 'y', [0.3, 0.5]));
  C.push(paint(hull(plate([[-0.03, 0.03], [0, 0.06], [0.03, 0.03], [0.03, -0.04], [0, -0.075], [-0.03, -0.04]],
    V(0, 0.4, 0), 0.38, 0.405, 0.25)), SW.mark, 'y', [0.32, 0.47]));

  // bold icy-blue flank slashes (follow the body hull between its rings at z -0.16 and 0.04)
  {
    const at = (z) => { const t = (z + 0.16) / 0.2; return { y: 0.44 + 0.03 * t, rx: 0.24 + 0.03 * t, ry: 0.21 + 0.03 * t }; };
    const P = (deg, z, k) => { const b = at(z), a = (deg * Math.PI) / 180; return V(Math.cos(a) * b.rx * k, b.y + Math.sin(a) * b.ry * k, z); };
    for (const z0 of [-0.135, -0.05]) {
      const pts = [];
      for (const [deg, w] of [[58.5, 0.032], [22.5, 0.024], [-13.5, 0.012]]) {
        const zc = z0 - (58.5 - deg) * 0.0006; // slant the slash backward as it runs down
        for (const k of [0.97, 1.022]) { pts.push(P(deg, zc - w, k)); pts.push(P(deg, zc + w, k)); }
      }
      S.push(flat(hull(pts), SW.mark));
    }
  }

  // ================= ICE CRYSTALS ON THE BACK =================
  const cry = (b, d, w, l, isC = false) => (isC ? C : S).push(paint(shard(b, d, w, l, 5, 1), SW.crystal, 'y', [b.y - 0.02, b.y + l]));
  cry(V(0, 0.68, -0.04), V(0, 1, -0.15), 0.06, 0.2, true);
  cry(V(0.07, 0.66, -0.01), V(0.55, 1, -0.05), 0.045, 0.14);
  cry(V(0.06, 0.65, -0.09), V(0.5, 1, -0.4), 0.035, 0.1);
  cry(V(0, 0.64, -0.2), V(0, 1, -0.3), 0.045, 0.13, true);
  cry(V(0.065, 0.62, -0.19), V(0.6, 1, -0.3), 0.032, 0.09);
  // frost cluster on the rump
  cry(V(0.055, 0.6, -0.3), V(0.35, 1, -0.4), 0.033, 0.095);
  cry(V(0, 0.6, -0.34), V(0, 1, -0.5), 0.032, 0.08, true);

  // ================= HEAD (big, broad, flat-topped bear skull) =================
  const H = { y: 0.7, z: 0.45 };
  C.push(fur([
    ...cbox(V(0, H.y, H.z), 0.225, 0.18, 0.185, 0.07),
    ...ring(V(0, H.y + 0.2, H.z - 0.01), 0.15, 0.11, 8, 'y'),
    V(0.245, H.y - 0.08, H.z + 0.05), V(-0.245, H.y - 0.08, H.z + 0.05),
  ], 0.5, 0.88));
  const FZ = H.z + 0.185;
  // bear muzzle: protruding block, nose on top front
  C.push(paint(hull([...cbox(V(0, H.y - 0.075, FZ + 0.05), 0.12, 0.072, 0.085, 0.032),
    V(0.09, H.y + 0.0, FZ - 0.03), V(-0.09, H.y + 0.0, FZ - 0.03)]), SW.muzzle, 'y', [H.y - 0.15, H.y]));
  C.push(paint(hull(cbox(V(0, H.y - 0.145, FZ + 0.03), 0.09, 0.027, 0.075, 0.012)), SW.muzzle, 'y', [H.y - 0.17, H.y - 0.11]));
  const MZ = FZ + 0.135; // muzzle front
  C.push(paint(hull([...cbox(V(0, H.y - 0.03, MZ - 0.005), 0.056, 0.024, 0.022, 0.01),
    V(0, H.y - 0.072, MZ - 0.008), V(0.024, H.y - 0.064, MZ - 0.008), V(-0.024, H.y - 0.064, MZ - 0.008)]), SW.nose, 'y'));
  C.push(flat(hull(cbox(V(0, H.y - 0.095, MZ + 0.001), 0.005, 0.022, 0.004, 0.002)), SW.mouth));
  S.push(flat(hull([V(0, H.y - 0.118, MZ + 0.004), V(0, H.y - 0.107, MZ + 0.004), V(0.055, H.y - 0.128, MZ - 0.006),
    V(0.055, H.y - 0.12, MZ - 0.006), V(0, H.y - 0.118, MZ - 0.012), V(0.055, H.y - 0.126, MZ - 0.02)]), SW.mouth));

  // fierce eyes (scaled punch_pup block)
  const E = V(0.108, H.y + 0.045, 0), k = 1.25;
  const sc = (pts) => pts.map(([u, v]) => [u * k, v * k]);
  S.push(flat(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.01, FZ + 0.012)), SW.white));
  S.push(flat(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.005, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye));
  S.push(flat(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.006, E.y + 0.003, 0), FZ + 0.014, FZ + 0.022)), SW.white));
  // heavy brow
  S.push(paint(hull([
    V(0.02, E.y + 0.012, FZ + 0.04), V(0.022, E.y + 0.056, FZ + 0.028),
    V(0.2, E.y + 0.068, FZ + 0.0), V(0.2, E.y + 0.108, FZ - 0.02),
    V(0.02, E.y + 0.012, FZ - 0.03), V(0.022, E.y + 0.066, FZ - 0.04),
    V(0.2, E.y + 0.068, FZ - 0.06), V(0.2, E.y + 0.108, FZ - 0.07),
  ]), SW.brow, 'y'));

  // icy-blue face markings: forehead diamond (wraps the brow-top chamfer) + bold cheek stripes
  {
    const f = 0.006, top = H.y + 0.185;
    C.push(flat(hull([
      V(0, H.y + 0.06, FZ + f), V(0.045, H.y + 0.11, FZ + f), V(-0.045, H.y + 0.11, FZ + f),
      V(0.02, H.y + 0.16, FZ - 0.05 + f), V(-0.02, H.y + 0.16, FZ - 0.05 + f), V(0, top, FZ - 0.075 + f),
      V(0, H.y + 0.07, FZ - 0.01), V(0.035, H.y + 0.11, FZ - 0.01), V(-0.035, H.y + 0.11, FZ - 0.01),
    ]), SW.mark));
  }
  for (const [dy, l] of [[0.05, 1], [-0.012, 0.85]]) {
    const x0 = 0.225 + 0.004, x1 = x0 + 0.01, zf = H.z + 0.11, zb = H.z + 0.11 - 0.2 * l;
    S.push(flat(hull([V(x0, H.y + dy + 0.006, zf), V(x0, H.y + dy - 0.006, zf + 0.004),
      V(x0, H.y + dy + 0.028, zb), V(x0, H.y + dy - 0.03, zb + 0.01),
      V(x1, H.y + dy + 0.006, zf - 0.01), V(x1, H.y + dy - 0.006, zf - 0.008),
      V(x1, H.y + dy + 0.024, zb + 0.01), V(x1, H.y + dy - 0.026, zb + 0.02)]), SW.mark));
  }

  // round ears: chunky octagonal discs on the top corners, pale-blue inner
  const EC = V(0.17, H.y + 0.19, H.z - 0.04);
  S.push(paint(hull([...ring(V(EC.x, EC.y, EC.z - 0.028), 0.078, 0.072, 8, 'z'), ...ring(V(EC.x, EC.y, EC.z + 0.028), 0.072, 0.066, 8, 'z')]),
    SW.fur, 'y', [EC.y - 0.06, EC.y + 0.06]));
  S.push(paint(hull([...ring(V(EC.x, EC.y + 0.008, EC.z + 0.026), 0.045, 0.042, 8, 'z'), ...ring(V(EC.x, EC.y + 0.008, EC.z + 0.035), 0.038, 0.035, 8, 'z')]),
    SW.earIn, 'flat'));
  // frost crest: small crystal shards on the crown
  C.push(paint(shard(V(0, H.y + 0.19, H.z - 0.02), V(0, 1, -0.4), 0.035, 0.08, 4, 0.7), SW.crystal, 'y', [H.y + 0.15, H.y + 0.26]));

  // ================= TAIL (stubby) =================
  C.push(paint(hull([...ring(V(0, 0.5, -0.4), 0.1, 0.095, 6, 'z', 0), ...ring(V(0, 0.55, -0.52), 0.085, 0.08, 6, 'z', Math.PI / 6),
    V(0, 0.6, -0.59), V(0, 0.52, -0.59)]), SW.fur, 'y', [0.38, 0.64]));
  C.push(paint(shard(V(0, 0.58, -0.56), V(0, 0.6, -1), 0.05, 0.08, 4, 0.7), SW.furSh, 'y', [0.45, 0.65]));
  S.push(paint(shard(V(0.05, 0.55, -0.55), V(0.6, 0.1, -1), 0.04, 0.07, 4, 0.7), SW.furSh, 'y', [0.45, 0.65]));

  return assemble(C, S);
}

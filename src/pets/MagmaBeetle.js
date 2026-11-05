// Magma Beetle (LEGENDARY): chunky obsidian rhino beetle, separate rock shell plates with glowing lava seams,
// big gold-tipped horn, gold-trimmed ornate armour, glowing fierce eyes, six thick planted legs.
import { V, THREE, hash3, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  rock:    { i: 0, top: '#574A6C', bot: '#1A1622' },
  rockDk:  { i: 1, top: '#3A3248', bot: '#15121C' },
  lava:    { i: 2, top: '#FFA238', bot: '#FF4E00', glow: true },
  gold:    { i: 3, top: '#FFDF6A', bot: '#D69A1E' },
  white:   { i: 4, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:     { i: 5, top: '#1A1416', bot: '#0C0A0B' },
  iris:    { i: 6, top: '#FFB52E', bot: '#FF7A00', glow: true },
  brow:    { i: 7, top: '#6A5E80', bot: '#2E2838' },
  hornDk:  { i: 8, top: '#55496A', bot: '#221D2C' },
  goldT:   { i: 9, top: '#FFD24A', bot: '#FFE98A' },
};
const P = PALETTE;

// ---------- helpers ----------
const lerp = (a, b, t) => a + (b - a) * t;
// point on an ellipsoid: a = angle from top (0) towards +x (90deg = side), s = -1..1 along z
function domePt(c, R, a, s, k = 1) {
  const r = Math.sqrt(Math.max(0, 1 - s * s));
  return V(c.x + R.x * r * Math.sin(a) * k, c.y + R.y * r * Math.cos(a) * k, c.z + R.z * s * k);
}
// a thick armour plate cut from an ellipsoid patch (outer skin + inner skin + raised centre ridge)
function domePlate(c, R, a0, a1, s0, s1, { na = 4, ns = 4, kin = 0.78, bump = 1.035 } = {}) {
  const pts = [];
  for (let i = 0; i < na; i++) for (let j = 0; j < ns; j++) {
    const a = lerp(a0, a1, i / (na - 1)), s = lerp(s0, s1, j / (ns - 1));
    pts.push(domePt(c, R, a, s, 1), domePt(c, R, a, s, kin));
  }
  pts.push(domePt(c, R, (a0 + a1) / 2, (s0 + s1) / 2, bump));
  return hull(pts);
}
// irregular plate from a quad of (a, s) corners [c00, c10, c11, c01] (bilinear patch), shrunk to leave lava seams.
// Outer skin is jittered and topped by a raised ridge so each plate reads as a chunky faceted rock slab.
function quadPlate(c, R, q, { n = 4, kin = 0.7, bump = 1.055, ga = 4 * Math.PI / 180, gs = 0.055, jit = 0.035 } = {}) {
  const ca = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, cs = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
  const sh = q.map(([a, s]) => [a + Math.sign(ca - a) * Math.min(ga, Math.abs(ca - a) * 0.5),
    Math.abs(s) >= 0.99 ? s * 0.998 : s + Math.sign(cs - s) * Math.min(gs, Math.abs(cs - s) * 0.5)]);
  const at = (u, v) => [
    (1 - u) * (1 - v) * sh[0][0] + u * (1 - v) * sh[1][0] + u * v * sh[2][0] + (1 - u) * v * sh[3][0],
    (1 - u) * (1 - v) * sh[0][1] + u * (1 - v) * sh[1][1] + u * v * sh[2][1] + (1 - u) * v * sh[3][1]];
  const pts = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const u = i / (n - 1), v = j / (n - 1);
    const [a, s] = at(u, v);
    const edge = i === 0 || j === 0 || i === n - 1 || j === n - 1;
    const kk = edge ? 0.995 : 1 + (hash3(a * 7.1, s * 3.3, ca * 5.7) - 0.5) * jit + 0.012;
    pts.push(domePt(c, R, a, s, kk), domePt(c, R, a, s, kin));
  }
  // ridge along the plate (gabled top -> big crisp facets)
  for (const [u, v, b] of [[0.5, 0.22, bump - 0.012], [0.45, 0.5, bump], [0.55, 0.78, bump - 0.012]]) {
    const [a, s] = at(u, v);
    pts.push(domePt(c, R, a, s, b));
  }
  return hull(pts);
}
// chunky faceted segment between two points
function seg(a, b, ra, rb, n = 6, ph = 0) {
  const d = new THREE.Vector3().subVectors(b, a).normalize();
  const up = Math.abs(d.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
  const u = new THREE.Vector3().crossVectors(d, up).normalize();
  const w = new THREE.Vector3().crossVectors(u, d).normalize();
  const pts = [];
  for (const [p, r] of [[a, ra], [b, rb]]) for (let k = 0; k < n; k++) {
    const t = ph + (2 * Math.PI * k) / n;
    pts.push(p.clone().addScaledVector(u, Math.cos(t) * r).addScaledVector(w, Math.sin(t) * r));
  }
  return hull(pts);
}
const D = Math.PI / 180;

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const rock = (g, lo = 0.1, hi = 0.75) => paint(g, P.rock, 'y', [lo, hi]);
  const lava = (g, lo = 0.1, hi = 0.75) => paint(g, P.lava, 'y', [lo, hi]);
  const gold = (g) => paint(g, P.gold, 'flat');

  // ================= ELYTRA (domed shell of separate obsidian plates over a lava core) =================
  const EC = V(0, 0.325, -0.16), ER = V(0.3, 0.29, 0.4);
  // lava core showing through every seam
  {
    const pts = [];
    for (let i = 0; i <= 8; i++) for (let j = 0; j <= 6; j++) {
      const a = (-115 + (230 * i) / 8) * D, s = -0.97 + (1.75 * j) / 6;
      pts.push(domePt(EC, ER, a, s, 0.95));
    }
    C.push(lava(hull(pts), 0.2, 0.66));
  }
  // irregular grid of shared plate corners [a, s] (a: 0 = centre seam, 106deg = lower edge), 2 rows x 3 per side
  const G = [
    [[0, -1], [0, -0.4], [0, 0.2], [0, 0.82]],
    [[50, -1], [56, -0.52], [46, 0.1], [53, 0.82]],
    [[106, -1], [106, -0.36], [106, 0.26], [106, 0.82]],
  ].map((r) => r.map(([a, s]) => [a * D, s]));
  const plateCtr = [];
  for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) {
    const q = [G[i][j], G[i + 1][j], G[i + 1][j + 1], G[i][j + 1]];
    if (i === 0) q.forEach((c, k) => { if (c[0] === 0) q[k] = [0.001, c[1]]; });
    S.push(rock(quadPlate(EC, ER, q), 0.08, 0.62));
    if (i === 1) plateCtr.push([(q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4]);
  }
  // gold studs on the lower shell plates
  for (const [a, sc0] of plateCtr)
    S.push(gold(blob(0, domePt(EC, ER, a, sc0, 1.05), V(0.03, 0.03, 0.03))));
  // gold filigree edging both sides of the glowing centre seam
  S.push(gold(tube(Array.from({ length: 7 }, (_, i) => {
    const s = -0.55 + (1.3 * i) / 6;
    return { p: domePt(EC, ER, 11 * D, s, 0.985), rx: 0.014, ry: 0.014 };
  }), { seg: 4, capStart: 0.008, capEnd: 0.008 })));
  // dark belly under the shell (sits ~0.045 off the ground)
  {
    const pts = [];
    for (let i = 0; i <= 6; i++) for (let j = 0; j <= 5; j++) {
      const a = (104 + (152 * i) / 6) * D, s = -0.985 + (1.75 * j) / 5;
      pts.push(domePt(EC, ER, a, s, 0.96));
    }
    C.push(paint(hull(pts), P.rockDk, 'y', [0.05, 0.35]));
  }
  // gold trim along the lower shell edge
  S.push(gold(tube(Array.from({ length: 9 }, (_, i) => {
    const s = -0.9 + (1.65 * i) / 8;
    return { p: domePt(EC, ER, 105 * D, s, 1.01), rx: 0.021, ry: 0.021 };
  }), { seg: 4, capStart: 0.01, capEnd: 0.01 })));

  // ================= PRONOTUM (thorax shield, plated over lava, ornate gold-rimmed crest) =================
  const PC = V(0, 0.375, 0.13), PR = V(0.26, 0.26, 0.18);
  {
    const pts = [];
    for (let i = 0; i <= 8; i++) for (let j = 0; j <= 5; j++) {
      const a = (-118 + (236 * i) / 8) * D, s = -0.9 + (1.8 * j) / 5;
      pts.push(domePt(PC, PR, a, s, 0.94));
    }
    C.push(lava(hull(pts), 0.2, 0.62));
  }
  for (const [a0, a1] of [[0.001, 52 * D], [52 * D, 114 * D]])
    S.push(rock(quadPlate(PC, PR, [[a0, -0.9], [a1, -0.9], [a1, 0.9], [a0, 0.9]], { bump: 1.05 }), 0.08, 0.62));
  // gold trim along the shield's lower edge
  S.push(gold(tube(Array.from({ length: 7 }, (_, i) => {
    const s = -0.85 + (1.7 * i) / 6;
    return { p: domePt(PC, PR, 113 * D, s, 1.01), rx: 0.021, ry: 0.021 };
  }), { seg: 4, capStart: 0.01, capEnd: 0.01 })));
  // raised ornate crest: gold rim plate, obsidian kite shield on top, glowing lava gem
  const kite = (sc, k0, k1) => {
    const pts = [];
    for (const [a, s] of [[0, 0.62], [30, 0.2], [26, -0.35], [0, -0.75], [-26, -0.35], [-30, 0.2]])
      for (const k of [k0, k1]) pts.push(domePt(PC, PR, a * sc * D, s * sc, k));
    pts.push(domePt(PC, PR, 0, -0.08, k1 + 0.03));
    return hull(pts);
  };
  C.push(gold(kite(1.38, 0.93, 1.055)));
  C.push(rock(kite(1.12, 0.95, 1.075), 0.55, 0.7));
  C.push(paint(hull([...ring(domePt(PC, PR, 0, -0.08, 1.05), 0.05, 0.06, 6, 'y', 0), ...ring(domePt(PC, PR, 0, -0.08, 1.12), 0.036, 0.044, 6, 'y', Math.PI / 6), domePt(PC, PR, 0, -0.08, 1.17)]), P.lava, 'y', [0.6, 0.72]));

  // ================= HEAD (big, blocky, plated, lifted) =================
  const H = { y: 0.38, z: 0.49 }, HX = 0.27, HY = 0.2, HZ = 0.185;
  const FZ0 = () => H.z + HZ;
  // tapered, bevelled head: octagon-ish sections, widest mid-cheek, narrower at the snout
  const sect = (z, w, h, bw, bh, dy = 0) => [V(w, H.y + dy + bh, z), V(w, H.y + dy - bh, z), V(bw, H.y + dy + h, z), V(bw, H.y + dy - h, z),
    V(-w, H.y + dy + bh, z), V(-w, H.y + dy - bh, z), V(-bw, H.y + dy + h, z), V(-bw, H.y + dy - h, z)];
  C.push(rock(hull([
    ...sect(H.z - HZ, 0.235, 0.18, 0.16, 0.09),
    ...sect(H.z - 0.02, HX + 0.01, HY, 0.2, 0.1),
    ...sect(FZ0(), 0.235, 0.185, 0.185, 0.125, -0.005),
    ...ring(V(0, H.y + HY + 0.02, H.z - 0.04), 0.17, 0.11, 8, 'y'),
  ]), 0.2, 0.62));
  const FZ = H.z + HZ;
  const TOP = H.y + HY;

  // obsidian head plates on the crown, split by a glowing lava seam
  C.push(paint(hull(cbox(V(0, TOP + 0.012, H.z - 0.04), 0.03, 0.02, 0.15, 0.008)), P.lava, 'y', [TOP - 0.05, TOP + 0.06]));
  S.push(rock(hull([
    V(0.022, TOP - 0.005, H.z - 0.2), V(0.2, TOP - 0.005, H.z - 0.17), V(0.215, TOP - 0.005, H.z + 0.06), V(0.022, TOP - 0.005, H.z + 0.1),
    V(0.03, TOP + 0.035, H.z - 0.17), V(0.18, TOP + 0.03, H.z - 0.14), V(0.19, TOP + 0.03, H.z + 0.04), V(0.03, TOP + 0.035, H.z + 0.07),
    V(0.1, TOP + 0.055, H.z - 0.06),
  ]), 0.35, 0.66));

  // lava cracks across the cheeks (flat seams on the side faces)
  const crackX = (x, yz, w = 0.013) => {
    for (let i = 0; i < yz.length - 1; i++) {
      const [y0, z0] = yz[i], [y1, z1] = yz[i + 1];
      const d = V(0, y1 - y0, z1 - z0).normalize(), n = V(0, -d.z, d.y).multiplyScalar(w / 2);
      const pts = [];
      for (const [y, z] of [[y0, z0], [y1, z1]]) for (const sgn of [-1, 1]) for (const xx of [x - 0.012, x])
        pts.push(V(xx, y + n.y * sgn, z + n.z * sgn));
      S.push(lava(hull(pts), 0.0, 0.6));
    }
  };
  // cheek armour plates: gold rim under a faceted obsidian plate, with a lava crack across it
  const cheek = [[0.11, -0.1], [0.12, 0.05], [0.04, 0.12], [-0.09, 0.1], [-0.12, -0.02], [-0.07, -0.13]]; // [dy, dz]
  const cheekPts = (sc, x0, x1, inset) => {
    const pts = [];
    for (const [dy, dz] of cheek) {
      pts.push(V(x0, H.y + dy * sc, H.z - 0.02 + dz * sc));
      pts.push(V(x1, H.y + dy * sc * inset, H.z - 0.02 + dz * sc * inset));
    }
    return pts;
  };
  S.push(gold(hull(cheekPts(1.14, 0.22, 0.29, 0.93))));
  S.push(rock(hull(cheekPts(1.0, 0.23, 0.305, 0.8)), 0.2, 0.62));
  crackX(0.309, [[H.y + 0.085, H.z - 0.07], [H.y + 0.03, H.z - 0.03], [H.y + 0.01, H.z + 0.04], [H.y - 0.06, H.z + 0.06]]);
  crackX(0.309, [[H.y + 0.03, H.z - 0.03], [H.y - 0.04, H.z - 0.09]]);

  // fierce glowing eyes: white almond, glowing iris ring, big black pupil, catchlight
  const E = V(0.13, H.y + 0.03, 0), k = 1.8;
  const sc = (pts) => pts.map(([u, v]) => [u * k, v * k]);
  S.push(paint(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.01, FZ + 0.01)), P.white, 'flat'));
  S.push(paint(hull(plate(sc([[-0.031, 0.006], [0.016, 0.022], [0.024, -0.009], [0.007, -0.033], [-0.022, -0.032], [-0.034, -0.013]]),
    V(E.x - 0.008, E.y, 0), FZ + 0.0, FZ + 0.015)), P.iris, 'flat'));
  S.push(paint(hull(plate(sc([[-0.022, 0.003], [0.01, 0.014], [0.016, -0.006], [0.004, -0.024], [-0.016, -0.022], [-0.025, -0.01]]),
    V(E.x - 0.008, E.y - 0.002, 0), FZ + 0.005, FZ + 0.021)), P.eye, 'flat'));
  S.push(paint(hull(plate([[-0.011, -0.011], [0.011, -0.011], [0.011, 0.011], [-0.011, 0.011]],
    V(E.x - 0.003, E.y + 0.008, 0), FZ + 0.012, FZ + 0.027)), P.white, 'flat'));
  // heavy protruding brow slab overhanging the eyes, slanting down to the centre
  S.push(paint(hull([
    V(0.03, E.y + 0.02, FZ + 0.07), V(0.032, E.y + 0.08, FZ + 0.05),
    V(0.265, E.y + 0.1, FZ + 0.02), V(0.265, E.y + 0.155, FZ - 0.005),
    V(0.03, E.y + 0.02, FZ - 0.03), V(0.032, E.y + 0.09, FZ - 0.04),
    V(0.265, E.y + 0.1, FZ - 0.06), V(0.265, E.y + 0.155, FZ - 0.07),
  ]), P.brow, 'y'));

  // lower face plate (clypeus) + gold mandibles
  C.push(rock(hull(cbox(V(0, H.y - 0.125, FZ + 0.01), 0.17, 0.06, 0.06, 0.025)), 0.1, 0.4));
  S.push(gold(tube(curveSamples([V(0.12, H.y - 0.115, FZ + 0.0), V(0.145, H.y - 0.105, FZ + 0.08), V(0.07, H.y - 0.085, FZ + 0.14)],
    5, (t) => 0.04 - 0.03 * t), { seg: 5, capEnd: 0.018 })));

  // ================= HORNS =================
  // big head horn: thrusts forward off the snout then curves up; obsidian shaft + crisp separate gold tip
  const hornPts = [V(0, H.y + 0.11, FZ - 0.08), V(0, H.y + 0.2, FZ + 0.04), V(0, H.y + 0.34, FZ + 0.12),
    V(0, H.y + 0.48, FZ + 0.12), V(0, H.y + 0.58, FZ + 0.05)];
  const hc = new THREE.CatmullRomCurve3(hornPts, false, 'centripetal');
  const hrx = (t) => 0.095 - 0.078 * Math.pow(t, 0.9), hry = (t) => 0.1 - 0.08 * Math.pow(t, 0.9);
  const hs = (t0, t1, n, m = 1) => Array.from({ length: n }, (_, i) => {
    const t = t0 + ((t1 - t0) * i) / (n - 1);
    return { p: hc.getPoint(t), rx: hrx(t) * m, ry: hry(t) * m };
  });
  C.push(paint(tube(hs(0, 0.62, 6), { seg: 6, axis: X, phase: Math.PI / 6 }), P.hornDk, 'len'));
  C.push(paint(tube(hs(0.6, 1, 4, 1.07), { seg: 6, axis: X, capEnd: 0.03, phase: Math.PI / 6 }), P.goldT, 'len'));
  // ornate gold band around the horn base
  C.push(gold(seg(hc.getPoint(0.08), hc.getPoint(0.16), 0.104, 0.098, 6, Math.PI / 6)));

  // ================= LEGS (six short thick crouched legs, glowing lava joint bands, gold claws) =================
  const leg = (hip, knee, foot) => {
    const dk = new THREE.Vector3().subVectors(knee, hip).normalize();
    const ft = V(foot.x, 0.075, foot.z);
    const dt = new THREE.Vector3().subVectors(ft, knee).normalize();
    // femur armour (tapered, flared cuff at the knee)
    S.push(rock(seg(hip, knee, 0.085, 0.088, 6), 0.0, 0.4));
    // obsidian knee-armour cap overhanging the joint
    S.push(rock(blob(0, knee.clone().addScaledVector(dt, 0.005).add(V(0, 0.01, 0)), V(0.098, 0.09, 0.098), { jitter: 0.08 }), 0.0, 0.4));
    // thin glowing joint seam just below the cap
    S.push(lava(seg(knee.clone().addScaledVector(dt, 0.07), knee.clone().addScaledVector(dt, 0.082), 0.083, 0.083, 6, Math.PI / 6), 0.0, 0.4));
    // tibia armour (thick, tapers to the foot)
    S.push(rock(seg(knee.clone().addScaledVector(dt, 0.088), ft, 0.088, 0.07, 6), 0.0, 0.4));
    // inner core joining cap and shin behind the seam
    S.push(rock(seg(knee, knee.clone().addScaledVector(dt, 0.1), 0.07, 0.07, 6), 0.0, 0.4));
    // spur on the back of the shin
    const mid = knee.clone().lerp(ft, 0.45);
    S.push(paint(shard(mid.clone().add(V(0.03, 0, -0.06)), V(0.4, 0.5, -1), 0.036, 0.085, 4, 0.7), P.brow, 'flat'));
    // chunky foot pad + 3 gold claws
    const fx = foot.x, fz = foot.z;
    const out = V(fx, 0, fz).normalize();
    S.push(rock(hull(cbox(V(fx, 0.042, fz), 0.078, 0.042, 0.078, 0.022)), 0.0, 0.3));
    for (const s of [-1, 0, 1]) {
      const side = V(-out.z, 0, out.x).multiplyScalar(s * 0.045);
      const b = V(fx, 0, fz).add(side).addScaledVector(out, 0.058);
      S.push(gold(hull([
        V(b.x - 0.022, 0, b.z - 0.022), V(b.x + 0.022, 0, b.z + 0.022), V(b.x - 0.022, 0, b.z + 0.022), V(b.x + 0.022, 0, b.z - 0.022),
        V(b.x, 0.055, b.z), b.clone().addScaledVector(out, 0.065).add(side.clone().multiplyScalar(0.4)),
      ])));
    }
  };
  leg(V(0.2, 0.17, 0.2), V(0.38, 0.25, 0.29), V(0.44, 0.0, 0.39));
  leg(V(0.22, 0.17, -0.02), V(0.43, 0.24, 0.0), V(0.5, 0.0, 0.0));
  leg(V(0.2, 0.17, -0.26), V(0.38, 0.24, -0.37), V(0.44, 0.0, -0.47));

  return assemble(C, S);
}

// Iron Fist Ape: grey steel-armoured gorilla, giant red iron fists planted on the ground,
// spiked gold-trimmed pauldrons, glowing cyan runes, battle scars. Faces +Z, symmetric about x=0.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  fur:    { i: 0, top: '#848A96', bot: '#4C525E' },   // dark steel-grey fur
  furDk:  { i: 1, top: '#626875', bot: '#363A44' },   // shard fur / shadows
  skin:   { i: 2, top: '#9C9496', bot: '#6E6668' },   // face / hands / feet skin
  muzzle: { i: 3, top: '#B9B0AE', bot: '#8F8584' },
  steel:  { i: 4, top: '#E2E7EE', bot: '#98A3B2' },   // steel armour
  steelDk:{ i: 5, top: '#AEB8C6', bot: '#6E7A8A' },
  gold:   { i: 6, top: '#FFE27A', bot: '#D99A16' },
  red:    { i: 7, top: '#FF5A48', bot: '#B81E1A' },   // red iron fists
  redDk:  { i: 8, top: '#D93A2E', bot: '#8E1512' },
  rune:   { i: 9, top: '#B8FBFF', bot: '#3FD8FF', glow: true },
  white:  { i: 10, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:    { i: 11, top: '#1A1416', bot: '#0C0A0B' },
  nose:   { i: 12, top: '#5A5258', bot: '#2E282C' },
  nostril:{ i: 16, top: '#141012', bot: '#0A0809' },
  scar:   { i: 13, top: '#E7C6C0', bot: '#C99D96' },
  gouge:  { i: 14, top: '#5E6672', bot: '#454C57' },
  brow:   { i: 15, top: '#5C616C', bot: '#353943' },
};
const P = PALETTE;

// transform helper: rotate (x,y,z euler) then translate
function xf(g, pos, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz, 'XYZ'));
  m.setPosition(pos);
  g.applyMatrix4(m);
  g.computeVertexNormals();
  return g;
}

export function buildGeometry() {
  const C = [], S = [];
  const fur = (pts, lo = 0, hi = 1) => paint(hull(pts), P.fur, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');
  const ys = (g, sw, lo, hi) => paint(g, sw, 'y', [lo, hi]);

  // ================= TORSO (big barrel chest leaning forward) =================
  C.push(fur([
    ...ring(V(0, 0.27, -0.13), 0.15, 0.12, 10, 'y'),
    ...ring(V(0, 0.4, -0.1), 0.19, 0.155, 10, 'y'),
    ...ring(V(0, 0.55, -0.05), 0.235, 0.17, 10, 'y'),
    ...ring(V(0, 0.67, -0.02), 0.22, 0.15, 10, 'y'),
    ...ring(V(0, 0.73, -0.01), 0.14, 0.1, 8, 'y'),
  ], 0.25, 0.75));

  // chest plate: steel shield on the front, leaning forward
  const LEAN = 0.22;
  const chestPos = V(0, 0.5, 0.135);
  const shield = [[-0.17, 0.15], [0.17, 0.15], [0.2, 0.06], [0.15, -0.1], [0.06, -0.17], [-0.06, -0.17], [-0.15, -0.1], [-0.2, 0.06]];
  {
    const pts = [];
    for (const [u, v] of shield) {
      pts.push(V(u, v, 0.0)); pts.push(V(u * 0.92, v * 0.92, -0.08));
    }
    // slight central ridge
    pts.push(V(0, 0.13, 0.025), V(0, -0.15, 0.02));
    C.push(xf(ys(hull(pts), P.steel, -0.17, 0.15), chestPos, LEAN));
  }
  // gold rim around the chest plate (segments along edges)
  const chestPt = (u, v, dz = 0) => V(u, v, dz).applyEuler(new THREE.Euler(LEAN, 0, 0)).add(chestPos);
  for (let k = 0; k < shield.length; k++) {
    const [u0, v0] = shield[k], [u1, v1] = shield[(k + 1) % shield.length];
    if (u0 < 0 && u1 <= 0) continue; // left side via mirror
    const a = chestPt(u0 * 1.02, v0 * 1.02, 0.0), b = chestPt(u1 * 1.02, v1 * 1.02, 0.0);
    const ai = chestPt(u0 * 0.88, v0 * 0.88, 0.022), bi = chestPt(u1 * 0.88, v1 * 0.88, 0.022);
    const back = (p) => p.clone().add(V(0, 0, -0.05));
    const g = flat(hull([a, b, ai, bi, back(a), back(b)]), P.gold);
    if (u0 >= 0 && u1 >= 0 && (u0 > 0 || u1 > 0)) S.push(g); else C.push(g);
  }
  // glowing rune on chest: fist-sigil (diamond + bars)
  {
    const rz = 0.034;
    C.push(flat(hull([chestPt(0, 0.08, rz), chestPt(0.045, 0.02, rz), chestPt(0, -0.04, rz), chestPt(-0.045, 0.02, rz),
      chestPt(0, 0.08, rz - 0.02), chestPt(0.045, 0.02, rz - 0.02), chestPt(0, -0.04, rz - 0.02), chestPt(-0.045, 0.02, rz - 0.02)]), P.rune));
    C.push(flat(hull([chestPt(-0.012, -0.06, rz), chestPt(0.012, -0.06, rz), chestPt(-0.012, -0.12, rz), chestPt(0.012, -0.12, rz),
      chestPt(-0.012, -0.06, rz - 0.02), chestPt(0.012, -0.06, rz - 0.02), chestPt(-0.012, -0.12, rz - 0.02), chestPt(0.012, -0.12, rz - 0.02)]), P.rune));
    for (const [u, v, du, dv] of [[0.09, 0.07, 0.035, -0.03], [0.1, -0.03, 0.03, -0.035]]) {
      S.push(flat(hull([chestPt(u, v, rz - 0.006), chestPt(u + du, v + dv, rz - 0.006), chestPt(u, v - 0.02, rz - 0.006), chestPt(u + du, v + dv - 0.02, rz - 0.006),
        chestPt(u, v, rz - 0.03), chestPt(u + du, v + dv, rz - 0.03), chestPt(u, v - 0.02, rz - 0.03), chestPt(u + du, v + dv - 0.02, rz - 0.03)]), P.rune));
    }
    // battle-scar gouges across the plate (dark diagonal scratches)
    for (const [u, v] of [[0.1, 0.1], [0.125, 0.085]]) {
      S.push(flat(hull([chestPt(u, v, 0.02), chestPt(u + 0.05, v - 0.07, 0.014), chestPt(u + 0.008, v + 0.004, 0.02), chestPt(u + 0.058, v - 0.066, 0.014),
        chestPt(u, v, 0.0), chestPt(u + 0.05, v - 0.07, 0.0)]), P.gouge));
    }
  }

  // gold gorget collar closing the neck above the chest plate
  C.push(ys(hull([...ring(V(0, 0.655, 0.0), 0.19, 0.16, 10, 'y'), ...ring(V(0, 0.735, 0.02), 0.14, 0.13, 10, 'y')]), P.gold, 0.65, 0.74));
  // gold belt + steel tassets
  C.push(flat(hull([...ring(V(0, 0.3, -0.12), 0.165, 0.135, 10, 'y'), ...ring(V(0, 0.36, -0.105), 0.18, 0.15, 10, 'y')]), P.gold));
  C.push(flat(hull(cbox(V(0, 0.33, 0.04), 0.045, 0.04, 0.012, 0.01)), P.gold));
  C.push(flat(hull(cbox(V(0, 0.33, 0.05), 0.022, 0.022, 0.006, 0.006)), P.rune));
  S.push(ys(hull([V(0.06, 0.31, 0.035), V(0.16, 0.31, -0.02), V(0.07, 0.2, 0.04), V(0.17, 0.22, -0.02),
    V(0.06, 0.31, -0.02), V(0.15, 0.31, -0.07), V(0.07, 0.22, 0.0), V(0.16, 0.23, -0.05)]), P.steelDk, 0.2, 0.31));

  // ================= LEGS (short bowed, with gold knee guards) =================
  S.push(fur([...ring(V(0.12, 0.33, -0.13), 0.085, 0.08, 8), ...ring(V(0.15, 0.2, -0.09), 0.085, 0.085, 8),
    ...ring(V(0.145, 0.1, -0.08), 0.07, 0.07, 8), ...ring(V(0.14, 0.055, -0.08), 0.065, 0.065, 8)], 0, 0.4));
  S.push(flat(hull([...ring(V(0.15, 0.19, -0.012), 0.062, 0.055, 6, 'z'), V(0.15, 0.2, 0.02), ...ring(V(0.15, 0.19, -0.07), 0.07, 0.065, 6, 'z')]), P.gold));
  // feet: dark skin block + toes
  S.push(ys(hull(cbox(V(0.14, 0.035, -0.06), 0.072, 0.035, 0.085, 0.025)), P.skin, 0, 0.08));
  for (const dx of [-0.04, 0.005, 0.048]) S.push(ys(hull(cbox(V(0.14 + dx, 0.026, 0.02), 0.022, 0.026, 0.03, 0.01)), P.skin, 0, 0.08));
  S.push(ys(hull(cbox(V(0.075, 0.024, -0.01), 0.02, 0.024, 0.03, 0.01)), P.skin, 0, 0.08)); // big toe inward

  // ================= ARMS (huge, reaching down to planted fists) =================
  const SH = V(0.27, 0.6, -0.02), EL = V(0.37, 0.43, 0.04), WR = V(0.4, 0.265, 0.2);
  const L = (t) => EL.clone().lerp(WR, t);
  // upper arm (fur), elbow kinked out and back
  S.push(fur([...ring(SH, 0.1, 0.1, 8, 'y'), ...ring(V(SH.x, SH.y + 0.06, SH.z), 0.08, 0.08, 8, 'y'),
    ...ring(V(EL.x + 0.01, EL.y, EL.z - 0.01), 0.088, 0.088, 8, 'y')], 0.35, 0.7));
  // forearm: short, thick, widening toward the fist (gorilla forearm)
  S.push(fur([...ring(EL, 0.09, 0.09, 8, 'y'), ...ring(L(0.35), 0.1, 0.1, 8, 'y')], 0.35, 0.7));
  // steel vambrace hugging the forearm, flaring toward the wrist
  S.push(ys(hull([...ring(L(0.25), 0.105, 0.105, 8, 'y'), ...ring(L(0.7), 0.12, 0.12, 8, 'y'), ...ring(V(WR.x, WR.y + 0.01, WR.z), 0.125, 0.12, 8, 'y')]), P.steel, 0.24, 0.4));
  // gold cuffs: top edge of the vambrace and wrist
  S.push(flat(hull([...ring(L(0.2), 0.112, 0.112, 8, 'y'), ...ring(L(0.32), 0.114, 0.114, 8, 'y')]), P.gold));
  S.push(flat(hull([...ring(V(WR.x, WR.y + 0.03, WR.z - 0.008), 0.133, 0.128, 8, 'y'), ...ring(V(WR.x, WR.y - 0.005, WR.z + 0.005), 0.133, 0.128, 8, 'y')]), P.gold));
  // forearm rune stripe (outer side of the vambrace)
  {
    const A = L(0.42), B = L(0.85);
    const pts = [];
    for (const [q, r] of [[A, 0.112], [B, 0.12]]) for (const [dx, dz] of [[r - 0.01, -0.016], [r - 0.01, 0.016], [r + 0.008, -0.012], [r + 0.008, 0.012]]) pts.push(V(q.x + dx, q.y, q.z + dz));
    S.push(flat(hull(pts), P.rune));
  }
  // elbow fur shards
  S.push(paint(shard(V(EL.x + 0.05, EL.y + 0.04, EL.z - 0.06), V(0.4, -0.3, -1), 0.045, 0.08), P.furDk, 'flat'));
  S.push(paint(shard(V(EL.x + 0.07, EL.y + 0.1, EL.z - 0.04), V(0.8, -0.4, -0.6), 0.04, 0.07), P.furDk, 'flat'));

  // upper-arm fur below the pauldrons, and elbow/forearm-back tufts
  for (const [b, d, w, l, sw] of [
    [V(0.36, 0.52, 0.01), V(1, -0.6, 0.2), 0.05, 0.08, P.fur],
    [V(0.35, 0.47, -0.05), V(0.8, -0.7, -0.5), 0.05, 0.08, P.furDk],
    [V(0.31, 0.5, 0.07), V(0.4, -0.7, 0.8), 0.045, 0.07, P.fur],
    [V(0.29, 0.52, -0.08), V(0.2, -0.6, -1), 0.045, 0.075, P.furDk],
    [V(EL.x + 0.0, EL.y + 0.02, EL.z - 0.08), V(0.1, -0.5, -1), 0.045, 0.08, P.furDk],
  ]) S.push(paint(shard(b, d, w, l), sw, 'flat'));
  // hip / thigh fur
  for (const [b, d, w, l, sw] of [
    [V(0.22, 0.27, -0.1), V(1, -0.7, 0), 0.05, 0.08, P.fur],
    [V(0.2, 0.3, -0.18), V(0.6, -0.6, -0.8), 0.05, 0.08, P.furDk],
    [V(0.1, 0.27, -0.23), V(0.2, -0.6, -1), 0.05, 0.075, P.furDk],
    [V(0.21, 0.16, -0.11), V(1, -0.8, -0.2), 0.04, 0.065, P.fur],
  ]) S.push(paint(shard(b, d, w, l), sw, 'flat'));

  // GIANT RED IRON FIST, knuckles down on the ground
  const F = V(0.4, 0.13, 0.235);
  S.push(ys(hull([...cbox(F, 0.135, 0.13, 0.125, 0.05), V(F.x, F.y + 0.14, F.z - 0.03)]), P.red, 0.0, 0.29));
  // knuckle row (front, near the ground)
  for (const dx of [-0.09, -0.03, 0.03, 0.09])
    S.push(ys(hull(cbox(V(F.x + dx, 0.075, F.z + 0.12), 0.029, 0.068, 0.032, 0.013)), P.redDk, 0, 0.15));
  // gold knuckle studs
  for (const dx of [-0.09, -0.03, 0.03, 0.09])
    S.push(flat(hull([...ring(V(F.x + dx, 0.105, F.z + 0.15), 0.022, 0.022, 4, 'z', Math.PI / 4), V(F.x + dx, 0.105, F.z + 0.195)]), P.gold));
  // thumb on inner side
  S.push(ys(hull(cbox(V(F.x - 0.125, F.y + 0.01, F.z + 0.06), 0.03, 0.05, 0.065, 0.015)), P.redDk, 0.0, 0.2));
  // rune band across back of fist
  {
    const fz = F.z + 0.125, gy = F.y + 0.06;
    S.push(flat(hull([V(F.x, gy + 0.03, fz + 0.008), V(F.x + 0.026, gy, fz + 0.008), V(F.x, gy - 0.03, fz + 0.008), V(F.x - 0.026, gy, fz + 0.008),
      V(F.x, gy, fz + 0.016), V(F.x, gy + 0.03, fz - 0.02), V(F.x + 0.026, gy, fz - 0.02), V(F.x, gy - 0.03, fz - 0.02), V(F.x - 0.026, gy, fz - 0.02)]), P.rune));
    for (const sx of [-1, 1]) {
      const x0 = F.x + sx * 0.045, x1 = F.x + sx * 0.085;
      S.push(flat(hull([V(x0, gy + 0.022, fz + 0.007), V(x1, gy - 0.004, fz + 0.007), V(x0, gy + 0.008, fz + 0.007), V(x1, gy - 0.018, fz + 0.007),
        V(x0, gy + 0.022, fz - 0.02), V(x1, gy - 0.004, fz - 0.02), V(x0, gy + 0.008, fz - 0.02), V(x1, gy - 0.018, fz - 0.02)]), P.rune));
    }
  }

  // ================= SPIKED SHOULDER PAULDRONS =================
  const PD = V(0.29, 0.66, -0.02);
  S.push(ys(hull([...ring(V(PD.x, PD.y + 0.1, PD.z), 0.08, 0.08, 8, 'y'), ...ring(V(PD.x + 0.02, PD.y + 0.04, PD.z), 0.13, 0.13, 8, 'y'),
    ...ring(V(PD.x + 0.04, PD.y - 0.04, PD.z), 0.13, 0.13, 8, 'y'), V(PD.x - 0.08, PD.y + 0.06, PD.z)]), P.steel, PD.y - 0.06, PD.y + 0.12));
  // gold trim at the pauldron rim
  S.push(flat(hull([...ring(V(PD.x + 0.04, PD.y - 0.04, PD.z), 0.137, 0.137, 8, 'y'), ...ring(V(PD.x + 0.045, PD.y - 0.075, PD.z), 0.13, 0.13, 8, 'y')]), P.gold));
  // spikes (gold) fanning outward
  for (const [o, d, w, l] of [
    [V(0.05, 0.1, 0), V(0.5, 1, 0), 0.04, 0.13],
    [V(0.1, 0.06, 0.06), V(1, 0.6, 0.6), 0.035, 0.11],
    [V(0.1, 0.06, -0.06), V(1, 0.6, -0.6), 0.035, 0.11],
    [V(0.0, 0.11, -0.07), V(0.1, 1, -0.6), 0.032, 0.09],
  ]) S.push(ys(shard(PD.clone().add(o), d, w, l), P.gold, PD.y, PD.y + 0.25));
  // rune on pauldron front
  S.push(flat(hull([V(PD.x + 0.07, PD.y + 0.035, PD.z + 0.12), V(PD.x + 0.11, PD.y, PD.z + 0.108), V(PD.x + 0.07, PD.y - 0.03, PD.z + 0.124), V(PD.x + 0.035, PD.y, PD.z + 0.128),
    V(PD.x + 0.07, PD.y + 0.035, PD.z + 0.09), V(PD.x + 0.11, PD.y, PD.z + 0.08), V(PD.x + 0.07, PD.y - 0.03, PD.z + 0.09), V(PD.x + 0.035, PD.y, PD.z + 0.1)]), P.rune));

  // back fur shards (between the pauldrons)
  C.push(paint(shard(V(0, 0.7, -0.1), V(0, 0.2, -1), 0.06, 0.09), P.furDk, 'flat'));
  // steel back plate with gold spine ridge and glowing runes
  const bz = (y) => 0.012 + (y < 0.55 ? -0.27 + (y - 0.4) * (0.035 / 0.15) : -0.235 + (y - 0.55) * (0.045 / 0.11));
  const backShape = [[-0.12, 0.665], [0.12, 0.665], [0.17, 0.6], [0.15, 0.45], [0.07, 0.39], [-0.07, 0.39], [-0.15, 0.45], [-0.17, 0.6]];
  {
    const pts = [];
    for (const [u, v] of backShape) {
      const curve = Math.abs(u) * 0.22;
      pts.push(V(u, v, bz(v) - 0.012 + curve), V(u * 0.9, v, bz(v) + 0.09));
    }
    C.push(ys(hull(pts), P.steel, 0.38, 0.67));
    for (let k = 0; k < backShape.length; k++) {
      const [u0, v0] = backShape[k], [u1, v1] = backShape[(k + 1) % backShape.length];
      if (u0 < 0 && u1 <= 0) continue;
      const pt = (u, v, d) => V(u, v, bz(v) - 0.012 + Math.abs(u) * 0.22 - d);
      const g = flat(hull([pt(u0 * 1.03, v0 + (v0 > 0.6 ? 0.006 : -0.004), 0.004), pt(u1 * 1.03, v1 + (v1 > 0.6 ? 0.006 : -0.004), 0.004),
        pt(u0 * 0.88, v0 + (v0 > 0.6 ? -0.02 : v0 < 0.42 ? 0.02 : 0), 0.012), pt(u1 * 0.88, v1 + (v1 > 0.6 ? -0.02 : v1 < 0.42 ? 0.02 : 0), 0.012),
        pt(u0, v0, -0.05), pt(u1, v1, -0.05)]), P.gold);
      if (u0 >= 0 && u1 >= 0) S.push(g); else C.push(g);
    }
    const bp = (u, v, d) => V(u, v, bz(v) - 0.012 + Math.abs(u) * 0.22 - d);
    const dia = (cx, cy, r, d0, d1, sw, push) => push(flat(hull([bp(cx, cy + r, d1), bp(cx + r * 0.8, cy, d1), bp(cx, cy - r, d1), bp(cx - r * 0.8, cy, d1),
      bp(cx, cy + r, d0), bp(cx + r * 0.8, cy, d0), bp(cx, cy - r, d0), bp(cx - r * 0.8, cy, d0)]), sw));
    const cpush = (g) => C.push(g), spush = (g) => S.push(g);
    dia(0, 0.54, 0.085, -0.03, 0.01, P.gold, cpush);   // gold diamond setting
    dia(0, 0.54, 0.062, -0.03, 0.022, P.rune, cpush);  // glowing diamond rune
    C.push(flat(hull([bp(-0.012, 0.44, 0.012), bp(0.012, 0.44, 0.012), bp(-0.012, 0.405, 0.012), bp(0.012, 0.405, 0.012),
      bp(-0.012, 0.44, -0.03), bp(0.012, 0.44, -0.03), bp(-0.012, 0.405, -0.03), bp(0.012, 0.405, -0.03)]), P.rune));
    C.push(flat(hull([bp(-0.012, 0.65, 0.012), bp(0.012, 0.65, 0.012), bp(-0.012, 0.635, 0.012), bp(0.012, 0.635, 0.012),
      bp(-0.012, 0.65, -0.03), bp(0.012, 0.65, -0.03), bp(-0.012, 0.635, -0.03), bp(0.012, 0.635, -0.03)]), P.rune));
    for (const [u, v, du, dv] of [[0.085, 0.6, 0.04, -0.03], [0.095, 0.5, 0.035, -0.035]]) {
      S.push(flat(hull([bp(u, v, 0.008), bp(u + du, v + dv, 0.008), bp(u, v - 0.02, 0.008), bp(u + du, v + dv - 0.02, 0.008),
        bp(u, v, -0.03), bp(u + du, v + dv, -0.03), bp(u, v - 0.02, -0.03), bp(u + du, v + dv - 0.02, -0.03)]), P.rune));
    }
  }

  // ================= HEAD (big boxy gorilla head, low and forward) =================
  const H = { y: 0.86, z: 0.11 };
  C.push(fur([
    ...cbox(V(0, H.y, H.z), 0.19, 0.155, 0.15, 0.06),
    ...ring(V(0, H.y + 0.19, H.z - 0.04), 0.09, 0.09, 8, 'y'),   // sagittal crest dome
    V(0.21, H.y - 0.06, H.z + 0.02), V(-0.21, H.y - 0.06, H.z + 0.02),
  ], 0.6, 1.0));
  const FZ = H.z + 0.15;
  // face skin mask
  C.push(ys(hull([...cbox(V(0, H.y - 0.01, FZ - 0.02), 0.155, 0.11, 0.03, 0.03)]), P.skin, H.y - 0.11, H.y + 0.09));
  // muzzle: big protruding gorilla muzzle
  C.push(ys(hull([...cbox(V(0, H.y - 0.075, FZ + 0.035), 0.115, 0.065, 0.06, 0.03), V(0.06, H.y - 0.0, FZ), V(-0.06, H.y - 0.0, FZ)]), P.muzzle, H.y - 0.14, H.y));
  // nose: wide flat gorilla nose with nostrils
  C.push(ys(hull([...cbox(V(0, H.y - 0.035, FZ + 0.085), 0.062, 0.028, 0.018, 0.012), V(0.025, H.y + 0.02, FZ + 0.045), V(-0.025, H.y + 0.02, FZ + 0.045)]), P.nose, H.y - 0.065, H.y + 0.02));
  S.push(flat(hull(cbox(V(0.026, H.y - 0.045, FZ + 0.1), 0.016, 0.01, 0.006, 0.004)), P.nostril));
  // mouth line (stern)
  C.push(flat(hull(cbox(V(0, H.y - 0.105, FZ + 0.093), 0.06, 0.006, 0.004, 0.002)), P.nose));
  S.push(flat(hull([V(0.055, H.y - 0.1, FZ + 0.093), V(0.055, H.y - 0.112, FZ + 0.093), V(0.08, H.y - 0.118, FZ + 0.085), V(0.08, H.y - 0.11, FZ + 0.085),
    V(0.055, H.y - 0.106, FZ + 0.085)]), P.nose));
  // lower jaw
  C.push(ys(hull(cbox(V(0, H.y - 0.15, FZ + 0.0), 0.1, 0.03, 0.06, 0.015)), P.skin, H.y - 0.18, H.y - 0.12));
  // ears
  S.push(ys(hull([...ring(V(0.195, H.y + 0.0, H.z - 0.02), 0.035, 0.045, 6, 'x')].concat([V(0.22, H.y, H.z - 0.02)])), P.skin, H.y - 0.05, H.y + 0.05));

  // fierce eyes
  const E = V(0.083, H.y + 0.03, 0);
  S.push(flat(hull(plate([[-0.05, 0.0], [0.054, 0.038], [0.06, -0.01], [0.025, -0.045], [-0.032, -0.04], [-0.052, -0.018]],
    E, FZ + 0.0, FZ + 0.016)), P.white));
  S.push(flat(hull(plate([[-0.034, 0.002], [0.018, 0.021], [0.025, -0.01], [0.005, -0.036], [-0.025, -0.034], [-0.037, -0.013]],
    V(E.x - 0.004, E.y, 0), FZ + 0.012, FZ + 0.021)), P.eye));
  S.push(flat(hull(plate([[-0.006, -0.006], [0.006, -0.006], [0.006, 0.006], [-0.006, 0.006]],
    V(E.x + 0.004, E.y + 0.002, 0), FZ + 0.018, FZ + 0.025)), P.white));
  // heavy protruding brow ridge, slanting down to the centre and overhanging the eyes
  S.push(ys(hull([
    V(0.0, E.y - 0.004, FZ + 0.06), V(0.0, E.y + 0.06, FZ + 0.04),
    V(0.175, E.y + 0.042, FZ + 0.03), V(0.175, E.y + 0.08, FZ + 0.01),
    V(0.0, E.y - 0.004, FZ - 0.03), V(0.0, E.y + 0.07, FZ - 0.04),
    V(0.175, E.y + 0.042, FZ - 0.06), V(0.175, E.y + 0.08, FZ - 0.07),
    V(0.09, E.y + 0.025, FZ + 0.055),
  ]), P.brow, E.y, E.y + 0.08));

  // gold war-helm band on the forehead with a glowing rune gem
  C.push(ys(hull([...cbox(V(0, H.y + 0.13, H.z + 0.0), 0.175, 0.032, 0.16, 0.025), V(0, H.y + 0.145, FZ + 0.0)]), P.gold, H.y + 0.09, H.y + 0.15));
  C.push(flat(hull([V(0, H.y + 0.14, FZ + 0.012), V(0.022, H.y + 0.118, FZ + 0.01), V(0, H.y + 0.096, FZ + 0.012), V(-0.022, H.y + 0.118, FZ + 0.01),
    V(0, H.y + 0.118, FZ + 0.026)]), P.rune));
  // crest shards (dark fur mohawk-ish crest typical of a silverback)
  C.push(paint(shard(V(0, H.y + 0.19, H.z + 0.0), V(0, 1, 0.35), 0.055, 0.09), P.furDk, 'flat'));
  C.push(paint(shard(V(0, H.y + 0.18, H.z - 0.08), V(0, 1, -0.5), 0.055, 0.085), P.furDk, 'flat'));
  // cheek fur shards
  S.push(paint(shard(V(0.19, H.y - 0.06, H.z + 0.04), V(1, -0.5, 0.1), 0.04, 0.07), P.fur, 'flat'));
  S.push(paint(shard(V(0.18, H.y - 0.1, H.z - 0.02), V(0.8, -0.9, -0.2), 0.04, 0.06), P.fur, 'flat'));

  // sideburn / cheek fur framing the face (layered shards)
  for (const [b, d, w, l, sw] of [
    [V(0.19, H.y + 0.05, H.z + 0.07), V(1, 0.1, 0.2), 0.045, 0.075, P.fur],
    [V(0.2, H.y - 0.02, H.z + 0.08), V(1, -0.35, 0.25), 0.05, 0.085, P.fur],
    [V(0.19, H.y - 0.09, H.z + 0.08), V(0.8, -0.8, 0.25), 0.05, 0.085, P.fur],
    [V(0.14, H.y - 0.14, H.z + 0.1), V(0.4, -1, 0.3), 0.045, 0.075, P.furDk],
    [V(0.19, H.y + 0.0, H.z - 0.06), V(1, -0.3, -0.4), 0.045, 0.075, P.furDk],
  ]) S.push(paint(shard(b, d, w, l), sw, 'flat'));
  // battle scars: pale slashes over the outer brow down to the cheek (mirrored)
  for (const [x0, y0, x1, y1] of [[0.122, E.y - 0.03, 0.145, E.y - 0.1]]) {
    S.push(flat(hull([V(x0, y0, FZ + 0.013), V(x0 + 0.012, y0 + 0.002, FZ + 0.013), V(x1, y1, FZ + 0.013), V(x1 + 0.012, y1 + 0.002, FZ + 0.013),
      V(x0, y0, FZ - 0.01), V(x1, y1, FZ - 0.01), V(x1 + 0.012, y1 + 0.002, FZ - 0.01)]), P.scar));
  }
  return assemble(C, S);
}

// Orca Overlord (Celestial): a tall, broad, regal orca standing on chunky fin-legs and its tail flukes,
// with a floating coral-and-pearl crown, glowing cyan markings and a pearl necklace.
import { V, THREE, hull, cbox, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  body:   { i: 0, top: '#4A5878', bot: '#151B2A' },   // glossy charcoal-navy "black"
  belly:  { i: 1, top: '#FFFFFF', bot: '#DCE6F2' },   // white belly / chin / eye patch
  saddle: { i: 2, top: '#D2DAE6', bot: '#9EAABD' },   // grey saddle patch
  fin:    { i: 3, top: '#3A4766', bot: '#121725' },   // fins / flukes (slightly deeper)
  eye:    { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  brow:   { i: 6, top: '#2C3550', bot: '#10141F' },
  gold:   { i: 7, top: '#FFE27A', bot: '#E09A00' },
  coral:  { i: 8, top: '#FF8C9C', bot: '#E23C5E' },
  coralO: { i: 9, top: '#FFC27A', bot: '#F2712E' },
  pearl:  { i: 10, top: '#FFFFFF', bot: '#E6DCEF' },
  glow:   { i: 11, top: '#9FF7FF', bot: '#3FD8FF', glow: true },
  mouth:  { i: 12, top: '#3A1E2A', bot: '#1E0E16' },
  head:   { i: 13, top: '#5E6E98', bot: '#1A2133' },
};
const SW = PALETTE;

// ellipse points in the xz-plane at height y (centre z = cz), n sides, symmetric about x = 0
const ell = (y, rx, rz, cz = 0, n = 12, sc = 1) => {
  const pts = [];
  for (let k = 0; k < n; k++) {
    const a = (2 * Math.PI * (k + 0.5)) / n; // a = 0 -> front (+z)
    pts.push(V(Math.sin(a) * rx * sc, y, cz + Math.cos(a) * rz * sc));
  }
  return pts;
};
// point on an ellipse at angle a (0 = front, +a toward +x)
const onE = (y, rx, rz, cz, a, sc = 1) => V(Math.sin(a) * rx * sc, y, cz + Math.cos(a) * rz * sc);

// body cross-section profile (y, rx, rz, cz) used for the body hull and for surface overlays
const BODY = [
  [0.12, 0.16, 0.14, -0.02],
  [0.2, 0.235, 0.2, -0.02],
  [0.34, 0.275, 0.225, -0.01],
  [0.48, 0.275, 0.225, 0.0],
  [0.6, 0.25, 0.21, 0.01],
  [0.7, 0.225, 0.2, 0.02],
];
// head profile: a round blunt melon dome blending straight out of the torso
const HEAD = [
  [0.66, 0.228, 0.2, 0.02],
  [0.75, 0.232, 0.218, 0.03],
  [0.84, 0.222, 0.218, 0.035],
  [0.92, 0.2, 0.2, 0.035],
  [0.975, 0.155, 0.16, 0.03],
  [1.005, 0.085, 0.09, 0.03],
];
const profAt = (P, y) => {
  for (let k = 0; k < P.length - 1; k++) {
    const a = P[k], b = P[k + 1];
    if (y >= a[0] && y <= b[0]) {
      const t = (y - a[0]) / (b[0] - a[0]);
      return a.map((v, i) => v + (b[i] - v) * t);
    }
  }
  return y < P[0][0] ? P[0] : P[P.length - 1];
};
const bodyAt = (y) => profAt(BODY, y);
const surf = (P, y, a, sc) => { const [, rx, rz, cz] = profAt(P, y); return onE(y, rx, rz, cz, a, sc); };
// curved overlay patch hugging a profile: angle range a0..a1, y between lo(a) and hi(a), split into narrow strips
function patch(P, a0, a1, lo, hi, strips = 6, out = 1.035, inn = 0.9) {
  const g = [];
  for (let j = 0; j < strips; j++) {
    const pts = [];
    for (const a of [a0 + (a1 - a0) * j / strips, a0 + (a1 - a0) * (j + 1) / strips]) {
      const yl = lo(a), yh = hi(a);
      for (const y of [yl, (yl + yh) / 2, yh]) pts.push(surf(P, y, a, out), surf(P, y, a, inn));
    }
    g.push(hull(pts));
  }
  return g;
}
// slanted stroke patch from (ya, aa) to (yb, ab) with angular width w
function stroke(P, ya, aa, yb, ab, w, out = 1.05) {
  const pts = [];
  for (const [y, a] of [[ya, aa], [yb, ab]]) for (const d of [-w / 2, w / 2]) pts.push(surf(P, y, a + d, out), surf(P, y, a + d, 0.88));
  return hull(pts);
}

export function buildGeometry() {
  const C = [], S = [];
  const body = (g, lo = 0.05, hi = 1.0) => paint(g, SW.body, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= TORSO (broad barrel, no neck: flows straight into the head) =================
  C.push(body(hull(BODY.flatMap(([y, rx, rz, cz]) => ell(y, rx, rz, cz, 12))), 0.05, 0.85));

  // white belly: lobed front panel from the groin up to the chin
  C.push(paint(hull([
    ...ell(0.15, 0.1, 0.1, 0.06, 10),
    ...ell(0.26, 0.17, 0.15, 0.08, 10),
    ...ell(0.42, 0.19, 0.16, 0.085, 10),
    ...ell(0.58, 0.16, 0.15, 0.08, 10),
    ...ell(0.68, 0.13, 0.15, 0.08, 10),
  ]), SW.belly, 'y', [0.1, 0.75]));
  // white flank flashes sweeping up the lower sides toward the back (classic orca)
  for (const g of patch(BODY, 1.05, 2.35, (a) => 0.14 + 0.06 * (a - 1.05), (a) => 0.2 + 0.16 * Math.sin(Math.PI * (a - 1.05) / 1.3) + 0.05 * (a - 1.05), 6))
    S.push(paint(g, SW.belly, 'y', [0.12, 0.42]));

  // grey saddle patch hugging the back: tallest at the spine, tapering down the sides
  for (const g of patch(BODY, Math.PI - 0.85, Math.PI, (a) => 0.43 + 0.08 * ((Math.PI - a) / 0.85) ** 2, (a) => 0.62 - 0.08 * ((Math.PI - a) / 0.85) ** 2, 5, 1.03, 0.9))
    S.push(paint(g, SW.saddle, 'y', [0.42, 0.64]));
  // subtle glowing line arcing across the saddle
  for (const g of patch(BODY, Math.PI - 0.7, Math.PI, () => 0.515, () => 0.53, 4, 1.05, 0.9))
    S.push(paint(g, SW.glow, 'flat'));

  // glowing markings: stacked upward chevrons on the front flanks (visible from front and 3/4)
  for (const y0 of [0.3, 0.4, 0.5]) {
    S.push(paint(stroke(BODY, y0, 0.85, y0 + 0.065, 0.97, 0.1), SW.glow, 'flat'));
    S.push(paint(stroke(BODY, y0 + 0.065, 0.97, y0, 1.09, 0.1), SW.glow, 'flat'));
  }

  // ================= LEGS (short, thick fin-legs with paddle feet) =================
  const LX = 0.13, LZ = 0.04;
  S.push(body(hull([
    ...ell(0.05, 0.075, 0.08, LZ, 8).map((p) => p.add(V(LX + 0.01, 0, 0))),
    ...ell(0.16, 0.09, 0.095, LZ, 8).map((p) => p.add(V(LX, 0, 0))),
    ...ell(0.27, 0.1, 0.1, LZ - 0.01, 8).map((p) => p.add(V(LX - 0.02, 0, 0))),
  ]), 0.0, 0.6));
  // paddle foot: broad flat flipper, spread slightly outward, three chunky scallops at the front
  const fx = LX + 0.015, fz = LZ + 0.03;
  S.push(paint(hull([
    ...cbox(V(fx, 0.03, fz), 0.085, 0.03, 0.09, 0.025),
    V(fx - 0.06, 0.05, fz - 0.06), V(fx + 0.06, 0.05, fz - 0.06),
  ]), SW.fin, 'y', [0.0, 0.08]));
  for (const [dx, dz] of [[-0.05, 0.075], [0, 0.09], [0.05, 0.075]])
    S.push(paint(hull(cbox(V(fx + dx, 0.022, fz + dz), 0.03, 0.022, 0.035, 0.012)), SW.fin, 'y', [0.0, 0.08]));

  // ================= TAIL + FLUKES (thick base, gentle curve down, wide notched flukes on the ground) =================
  {
    const pts = [V(0, 0.27, -0.1), V(0, 0.17, -0.25), V(0, 0.1, -0.37), V(0, 0.065, -0.47)];
    const rxf = (t) => 0.145 - 0.095 * t, ryf = (t) => 0.125 - 0.08 * t;
    C.push(paint(tube(curveSamples(pts, 7, rxf, ryf), { seg: 8, axis: V(1, 0, 0), capEnd: 0.02 }), SW.body, 'y', [0.0, 0.4]));
    // glowing dashes along the tail top
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    for (const t of [0.22, 0.48, 0.74]) {
      const c = curve.getPoint(t), T = curve.getTangent(t).normalize();
      const up = V(0, 1, 0).addScaledVector(T, -T.y).normalize();
      const top = c.clone().addScaledVector(up, ryf(t) * 0.97);
      const q = [];
      for (const sT of [-1, 1]) for (const sx of [-1, 1]) for (const su of [-1, 1])
        q.push(top.clone().addScaledVector(T, sT * 0.032).add(V(sx * (sT > 0 ? 0.014 : 0.022), 0, 0)).addScaledVector(up, su * 0.012));
      C.push(paint(hull(q), SW.glow, 'flat'));
    }
  }
  // fluke lobe (right): leading edge sweeps back to a pointed tip, trailing edge curves in to the centre notch
  const flukeY = (x) => 0.05 - 0.1 * x; // top surface height
  const lobe = [[0, -0.44], [0.1, -0.48], [0.2, -0.55], [0.275, -0.63], [0.25, -0.67], [0.15, -0.665], [0.06, -0.64], [0.0, -0.6]];
  S.push(paint(hull(lobe.flatMap(([x, z]) => [V(x, 0, z), V(x, flukeY(x), z)])), SW.fin, 'y', [0.0, 0.06]));
  // glowing leading-edge rim on each fluke
  {
    const e = [[0.03, -0.45], [0.1, -0.48], [0.2, -0.55], [0.275, -0.63]];
    const q = [];
    e.forEach(([x, z]) => { q.push(V(x, flukeY(x) + 0.005, z - 0.004), V(x, 0.002, z - 0.008), V(x, flukeY(x) + 0.005, z - 0.03), V(x, 0.002, z - 0.03)); });
    S.push(paint(hull(q), SW.glow, 'flat'));
  }

  // ================= DORSAL FIN (tall, swept back) =================
  C.push(paint(hull([
    V(-0.04, 0.4, -0.2), V(0.04, 0.4, -0.2),
    V(-0.045, 0.66, -0.17), V(0.045, 0.66, -0.17),
    V(-0.03, 0.7, -0.24), V(0.03, 0.7, -0.24),
    V(-0.012, 0.86, -0.5), V(0.012, 0.86, -0.5),
    V(-0.02, 0.6, -0.38), V(0.02, 0.6, -0.38),
  ]), SW.fin, 'y', [0.4, 0.9]));
  // glowing stripe along the dorsal fin's leading edge
  C.push(paint(hull([
    V(-0.048, 0.63, -0.2), V(0.048, 0.63, -0.2), V(-0.04, 0.68, -0.24), V(0.04, 0.68, -0.24),
    V(-0.018, 0.82, -0.44), V(0.018, 0.82, -0.44), V(-0.022, 0.8, -0.43), V(0.022, 0.8, -0.43),
  ]), SW.glow, 'flat'));

  // ================= PECTORAL FIN PADDLES (broad, rounded, thick but flat, angled out) =================
  {
    const root = V(0.215, 0.56, 0.05);
    const d = V(0.24, -0.3, 0.03).normalize();          // along the fin
    const perp = V(0.3, 0.24, 0).normalize();
    const w = V(0, 0, 0.55).addScaledVector(perp, 0.45).addScaledVector(d, -0.55 * d.z).normalize(); // across the fin (front-out / back-in)
    const n = new THREE.Vector3().crossVectors(d, w).normalize(); // thickness
    const L = 0.34;
    // outline [s (0..1 along), half-width front, half-width back]
    const prof = [[0, 0.07, 0.06], [0.3, 0.1, 0.085], [0.6, 0.115, 0.09], [0.82, 0.095, 0.07], [0.95, 0.055, 0.04], [1, 0.0, 0.0]];
    const P = (sv, wv, tv) => root.clone().addScaledVector(d, sv * L).addScaledVector(w, wv).addScaledVector(n, tv);
    const pts = [];
    prof.forEach(([sv, wf, wb]) => {
      const th = 0.04 * (1 - 0.6 * sv);
      pts.push(P(sv, wf, th), P(sv, wf, -th), P(sv, -wb, th), P(sv, -wb, -th), P(sv, (wf - wb) / 2, th * 1.35), P(sv, (wf - wb) / 2, -th * 1.35));
    });
    pts.push(P(1.02, 0.01, 0));
    S.push(paint(hull(pts), SW.fin, 'y', [0.28, 0.6]));
    // glowing rim around the rounded tip
    const q = [];
    for (const [sv, wf, wb] of prof.slice(2)) {
      const th = 0.04 * (1 - 0.6 * sv) * 0.6;
      for (const sgn of [1, -1]) q.push(P(sv, wf * 1.08 + 0.004, sgn * th), P(sv, wf * 0.82, sgn * th));
      for (const sgn of [1, -1]) q.push(P(sv, -wb * 1.08 - 0.004, sgn * th), P(sv, -wb * 0.82, sgn * th));
    }
    q.push(P(1.04, 0.01, 0.006), P(1.04, 0.01, -0.006));
    // the rim hull fills the tip; it is wrapped by the fin except at the outer edge
    S.push(paint(hull(q), SW.glow, 'flat'));
  }
  // coral & pearl pauldron on the shoulder
  S.push(paint(hull([
    ...ell(0.6, 0.085, 0.1, 0.04, 8).map((p) => p.add(V(0.23, 0, 0))),
    ...ell(0.54, 0.105, 0.115, 0.05, 8).map((p) => p.add(V(0.27, 0, 0))),
    V(0.24, 0.65, 0.03),
  ]), SW.gold, 'y', [0.5, 0.66]));
  S.push(paint(shard(V(0.28, 0.6, 0.05), V(0.7, 1, 0.1), 0.028, 0.09, 5), SW.coral, 'y', [0.6, 0.72]));
  S.push(paint(shard(V(0.31, 0.59, -0.01), V(1, 0.6, -0.4), 0.024, 0.075, 5), SW.coralO, 'y', [0.58, 0.68]));
  S.push(flat(blob(1, V(0.3, 0.6, 0.1), V(0.022, 0.022, 0.022)), SW.pearl));

  // ================= HEAD (round blunt melon dome, flows out of the torso) =================
  const H = { y: 0.84, z: 0.035 };
  const FZ = 0.25; // front face plane (slightly flattened front of the melon, for the eyes)
  C.push(paint(hull([
    ...HEAD.flatMap(([y, rx, rz, cz]) => ell(y, rx, rz, cz, 12)),
    ...plate([[-0.13, 0.0], [0.13, 0.0], [0.15, 0.06], [0.13, 0.13], [-0.13, 0.13], [-0.15, 0.06]], V(0, 0.79, 0), FZ, FZ),
    V(0.1, 0.775, FZ + 0.025), V(-0.1, 0.775, FZ + 0.025), V(0.07, 0.752, FZ + 0.03), V(-0.07, 0.752, FZ + 0.03), // soft rostrum
  ]), SW.head, 'y', [0.62, 1.0]));

  // white lower jaw flowing into the white throat
  C.push(paint(hull([
    ...cbox(V(0, 0.715, FZ - 0.035), 0.115, 0.027, 0.032, 0.016),
    V(0.16, 0.725, FZ - 0.09), V(-0.16, 0.725, FZ - 0.09),
    ...ell(0.6, 0.15, 0.15, 0.08, 10),
  ]), SW.belly, 'y', [0.55, 0.74]));
  // mouth line (dark slit following the face curve, just under the rostrum)
  for (const [x0, z0, x1, z1] of [[0, FZ + 0.034, 0.07, FZ + 0.03], [0.07, FZ + 0.03, 0.13, FZ - 0.008], [0.13, FZ - 0.008, 0.175, FZ - 0.06]]) {
    const pts = [];
    for (const [x, z] of [[x0, z0], [x1, z1]]) for (const y of [0.737, 0.746]) pts.push(V(x, y, z), V(x, y, z - 0.03));
    S.push(paint(hull(pts), SW.mouth, 'flat'));
  }

  // big classic orca eye patch: white oval hugging the head side, behind/above the eye, tilting up to the back
  {
    const ac = 1.4, ha = 0.5;
    const yc = (a) => 0.87 + 0.07 * (a - ac);
    const hh = (a) => 0.048 * Math.sqrt(Math.max(0, 1 - ((a - ac) / ha) ** 2)) + 0.006;
    for (const g of patch(HEAD, ac - ha, ac + ha, (a) => yc(a) - hh(a), (a) => yc(a) + hh(a), 8, 1.03, 0.9))
      S.push(paint(g, SW.belly, 'flat'));
  }

  // fierce eyes on the front: white almond, angry flat top slanting to the centre, big pupil, catchlight
  const E = V(0.1, 0.87, 0), k = 1.25;
  S.push(paint(hull(plate([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]].map(([u, v]) => [u * k, v * k]),
    E, FZ - 0.01, FZ + 0.012)), SW.white, 'flat'));
  S.push(paint(hull(plate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]].map(([u, v]) => [u * k, v * k]),
    V(E.x - 0.005, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.009, -0.009], [0.009, -0.009], [0.009, 0.009], [-0.009, 0.009]],
    V(E.x + 0.008, E.y + 0.003, 0), FZ + 0.014, FZ + 0.022)), SW.white, 'flat'));
  // heavy brow ridge slanting down toward the centre
  S.push(paint(hull([
    V(0.03, E.y + 0.016, FZ + 0.035), V(0.032, E.y + 0.06, FZ + 0.025),
    V(0.175, E.y + 0.06, FZ - 0.015), V(0.175, E.y + 0.1, FZ - 0.03),
    V(0.03, E.y + 0.016, FZ - 0.03), V(0.032, E.y + 0.07, FZ - 0.04),
    V(0.175, E.y + 0.06, FZ - 0.075), V(0.175, E.y + 0.1, FZ - 0.085),
  ]), SW.brow, 'y'));
  // glowing forehead rune (diamond on the melon)
  C.push(paint(hull([[0.995, 0], [0.955, 0.2], [0.955, -0.2], [0.915, 0]].flatMap(([y, a]) => [surf(HEAD, y, a, 1.09), surf(HEAD, y, a, 0.9)])), SW.glow, 'flat'));

  // ================= PEARL NECKLACE with coral pendant =================
  {
    const y = 0.64, [, rx, rz, cz] = bodyAt(y);
    for (let i = 0; i < 6; i++) {
      const a = 0.12 + i * 0.27;
      const p = onE(y - 0.02 * Math.cos(a), rx, rz, cz, a, 1.0);
      S.push(flat(blob(1, p, V(0.024, 0.024, 0.024)), SW.pearl));
    }
    C.push(paint(hull([V(0, 0.64, 0.255), V(0.04, 0.6, 0.25), V(-0.04, 0.6, 0.25), V(0, 0.54, 0.255),
      V(0, 0.64, 0.225), V(0.04, 0.6, 0.22), V(-0.04, 0.6, 0.22), V(0, 0.54, 0.225)]), SW.gold, 'y', [0.54, 0.64]));
    C.push(flat(blob(1, V(0, 0.595, 0.262), V(0.025, 0.025, 0.02)), SW.glow));
  }

  // ================= FLOATING CORAL & PEARL CROWN =================
  const CY = 1.05, CR = 0.175, CH = 0.055, CZ = 0.035;
  const seg = 10;
  for (let s = 0; s < seg / 2; s++) {
    const a0 = (2 * Math.PI * s) / seg, a1 = (2 * Math.PI * (s + 1)) / seg;
    const pts = [];
    for (const a of [a0, a1]) for (const r of [CR, CR - 0.03]) for (const y of [CY, CY + CH])
      pts.push(V(Math.sin(a) * r, y, CZ + Math.cos(a) * r));
    S.push(paint(hull(pts), SW.gold, 'y', [CY, CY + CH]));
  }
  // coral branches (front centre, two front-sides, two back-sides)
  const branch = (a, h, sw, side) => {
    const base = V(Math.sin(a) * (CR - 0.012), CY + CH - 0.01, CZ + Math.cos(a) * (CR - 0.012));
    const out = V(Math.sin(a), 0, Math.cos(a));
    const main = V(0, 1, 0).addScaledVector(out, 0.25);
    const g = [paint(shard(base, main, 0.04, h, 5), sw, 'y', [CY, CY + CH + h])];
    // two side twigs
    const tang = V(Math.cos(a), 0, -Math.sin(a));
    for (const sgn of [1, -1]) {
      const b2 = base.clone().addScaledVector(main.clone().normalize(), h * (sgn > 0 ? 0.42 : 0.6));
      const d2 = V(0, 0.8, 0).addScaledVector(tang, 0.75 * sgn).addScaledVector(out, 0.2);
      g.push(paint(shard(b2, d2, 0.021, h * 0.45, 4), sw, 'y', [CY, CY + CH + h]));
    }
    const tip = base.clone().addScaledVector(main.clone().normalize(), h * 0.98);
    g.push(flat(blob(1, tip, V(0.017, 0.017, 0.017)), SW.pearl));
    (side ? S : C).push(...g);
  };
  branch(0, 0.18, SW.coral, false);
  branch(1.257, 0.15, SW.coralO, true);
  branch(2.513, 0.12, SW.coral, true);
  // pearls on the band between branches + big glowing front pearl
  S.push(flat(blob(1, V(Math.sin(0.628) * (CR + 0.006), CY + CH * 0.5, CZ + Math.cos(0.628) * (CR + 0.006)), V(0.02, 0.02, 0.02)), SW.pearl));
  S.push(flat(blob(1, V(Math.sin(1.885) * (CR + 0.006), CY + CH * 0.5, CZ + Math.cos(1.885) * (CR + 0.006)), V(0.02, 0.02, 0.02)), SW.pearl));
  C.push(flat(blob(1, V(0, CY + CH * 0.5, CZ - CR - 0.006), V(0.02, 0.02, 0.02)), SW.pearl));
  C.push(flat(blob(1, V(0, CY + CH * 0.45, CZ + CR + 0.012), V(0.035, 0.035, 0.024)), SW.glow));

  return assemble(C, S);
}

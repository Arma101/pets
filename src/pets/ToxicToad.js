// Toxic Toad (ROBUX EGG, Mutant Egg): neon green armoured toad, purple toxic spikes, glowing slime drips, glowing eyes.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  skin:   { i: 0, top: '#8CFF4E', bot: '#22B33C' },
  belly:  { i: 1, top: '#F0FFB4', bot: '#B6E866' },
  dark:   { i: 2, top: '#3FC63E', bot: '#178A35' },
  spike:  { i: 3, top: '#E2A6FF', bot: '#7A2AD8' },
  slime:  { i: 4, top: '#EEFF6A', bot: '#7DFF1A', glow: true },
  armor:  { i: 5, top: '#6E4FC0', bot: '#2E1C62' },
  gold:   { i: 6, top: '#FFE46C', bot: '#E39E12' },
  eye:    { i: 7, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 8, top: '#FFFFFF', bot: '#F4FFF0', glow: true },
  mouth:  { i: 9, top: '#2A1240', bot: '#16081F' },
  rune:   { i: 10, top: '#EFFFA0', bot: '#B8FF3A', glow: true },
  gem:    { i: 11, top: '#E6FFB0', bot: '#5CFF4A', glow: true },
  pad:    { i: 12, top: '#E8FF9A', bot: '#A8DC52' },
  glowEye:{ i: 13, top: '#D8FF6A', bot: '#8CFF2A', glow: true },
};
const SW = PALETTE;

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
// rotate a geometry about a vertical axis through pivot
function rollAt(g, pivot, ang) {
  g.translate(-pivot.x, -pivot.y, -pivot.z); g.rotateZ(ang); g.translate(pivot.x, pivot.y, pivot.z);
  return g;
}
function yawAt(g, pivot, ang) {
  g.translate(-pivot.x, -pivot.y, -pivot.z); g.rotateY(ang); g.translate(pivot.x, pivot.y, pivot.z);
  return g;
}

export function buildGeometry() {
  const C = [], S = [];
  const skin = (pts, lo = 0.05, hi = 0.66) => paint(hull(pts), SW.skin, 'y', [lo, hi]);
  const dark = (g) => paint(g, SW.dark, 'y');
  const belly = (g, lo, hi) => paint(g, SW.belly, 'y', [lo, hi]);
  const spike = (g) => paint(g, SW.spike, 'y');
  const slime = (g, mode = 'y') => paint(g, SW.slime, mode);
  const armor = (g, lo, hi) => paint(g, SW.armor, 'y', lo === undefined ? null : [lo, hi]);
  const gold = (g) => paint(g, SW.gold, 'y');
  const goldF = (g) => paint(g, SW.gold, 'flat');
  const rune = (g) => paint(g, SW.rune, 'flat');
  const surf = []; // meshes that slime streaks conform to

  // ================= BODY (squat wide toad barrel, chest low, rump low) =================
  const body = skin([
    ...ring(V(0, 0.22, -0.34), 0.15, 0.1, 10, 'z'),
    ...ring(V(0, 0.24, -0.24), 0.28, 0.16, 10, 'z'),
    ...ring(V(0, 0.25, -0.05), 0.33, 0.19, 10, 'z'),
    ...ring(V(0, 0.26, 0.12), 0.31, 0.18, 10, 'z'),
  ]);
  C.push(body); surf.push(body);
  // pale belly / throat
  C.push(belly(hull([
    ...ring(V(0, 0.15, -0.2), 0.2, 0.07, 8, 'z'),
    ...ring(V(0, 0.13, 0.02), 0.25, 0.075, 8, 'z'),
    ...ring(V(0, 0.19, 0.26), 0.22, 0.07, 8, 'z'),
  ]), 0.06, 0.3));

  // ================= HEAD (big, wide, flat-topped toad head) =================
  const H = { y: 0.41, z: 0.2 };
  const FZ = H.z + 0.17;
  C.push(skin([
    ...cbox(V(0, H.y + 0.03, H.z), 0.3, 0.09, 0.17, 0.035),
    ...ring(V(0, H.y + 0.14, H.z - 0.02), 0.2, 0.11, 8, 'y'),
  ], 0.2, 0.6));
  // wide lower jaw: follows the skull's width, only slightly proud, tapering back to the throat
  const JZ = H.z + 0.173; // jaw front plane
  C.push(skin([
    ...cbox(V(0, H.y - 0.085, H.z + 0.003), 0.302, 0.02, 0.17, 0.02),
    ...cbox(V(0, H.y - 0.15, H.z - 0.04), 0.24, 0.01, 0.12, 0.005),
  ], 0.1, 0.55));
  // mouth seam: dark line in the groove between skull and jaw
  C.push(paint(hull(cbox(V(0, H.y - 0.0635, H.z + 0.004), 0.279, 0.0065, 0.155, 0.004)), SW.mouth, 'flat'));
  // frowning corners: the seam turns down at both ends of the front face
  S.push(paint(hull(plate([[0.215, -0.058], [0.235, -0.058], [0.274, -0.078], [0.274, -0.09], [0.264, -0.09], [0.215, -0.066]],
    V(0, H.y, 0), JZ - 0.012, JZ + 0.003)), SW.mouth, 'flat'));
  // nostrils
  S.push(paint(hull(cbox(V(0.045, H.y + 0.08, FZ - 0.001), 0.015, 0.008, 0.01, 0.004)), SW.mouth, 'flat'));

  // eye turrets + fierce glowing eyes (yawed slightly outward)
  const E = V(0.155, H.y + 0.1, 0);
  const EZ = H.z + 0.11;
  const EF = EZ + 0.085;
  const eyeParts = [];
  eyeParts.push(skin([
    ...cbox(V(E.x, E.y, EZ), 0.1, 0.075, 0.085, 0.025),
    ...ring(V(E.x, E.y + 0.1, EZ - 0.01), 0.07, 0.06, 8, 'y'),
  ], 0.2, 0.6));
  eyeParts.push(paint(hull(plate([[-0.06, 0.0], [0.06, 0.042], [0.068, -0.014], [0.027, -0.052], [-0.037, -0.048], [-0.06, -0.02]],
    E, EF - 0.01, EF + 0.006)), SW.glowEye, 'flat'));
  eyeParts.push(paint(hull(plate([[-0.047, 0.002], [0.049, 0.03], [0.055, -0.01], [0.02, -0.041], [-0.03, -0.038], [-0.049, -0.016]],
    E, EF - 0.01, EF + 0.012)), SW.white, 'flat'));
  eyeParts.push(paint(hull(plate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]],
    V(E.x - 0.008, E.y, 0), EF + 0.006, EF + 0.018)), SW.eye, 'flat'));
  eyeParts.push(paint(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.002, E.y + 0.002, 0), EF + 0.014, EF + 0.021)), SW.white, 'flat'));
  eyeParts.push(dark(hull([
    V(E.x - 0.08, E.y + 0.01, EF + 0.03), V(E.x - 0.075, E.y + 0.052, EF + 0.02),
    V(E.x + 0.08, E.y + 0.052, EF - 0.005), V(E.x + 0.08, E.y + 0.092, EF - 0.02),
    V(E.x - 0.08, E.y + 0.01, EF - 0.04), V(E.x - 0.075, E.y + 0.065, EF - 0.05),
    V(E.x + 0.08, E.y + 0.052, EF - 0.06), V(E.x + 0.08, E.y + 0.097, EF - 0.07),
  ])));
  for (const g of eyeParts) S.push(yawAt(g, V(E.x, E.y, EZ), 0.22));

  // ================= LEGS =================
  const digits = (c, n, spread, yaw, len) => {
    S.push(paint(hull(cbox(V(c.x, 0.035, c.z), 0.07, 0.035, 0.065, 0.02)), SW.skin, 'y', [0, 0.14]));
    for (let k = 0; k < n; k++) {
      const a = -spread / 2 + (spread * k) / (n - 1) + yaw;
      const d = V(Math.sin(a), 0, Math.cos(a));
      const tip = add(c, d, len);
      S.push(paint(hull([...cbox(add(V(c.x, 0.028, c.z), d, 0.03), 0.026, 0.028, 0.026, 0.009),
        ...cbox(V(tip.x, 0.022, tip.z), 0.02, 0.022, 0.02, 0.008)]), SW.skin, 'y', [0, 0.14]));
      S.push(paint(hull([...ring(V(tip.x, 0.0, tip.z), 0.026, 0.026, 8, 'y'), ...ring(V(tip.x, 0.03, tip.z), 0.032, 0.032, 8, 'y'),
        ...ring(V(tip.x, 0.05, tip.z), 0.02, 0.02, 8, 'y')]), SW.pad, 'y', [0, 0.06]));
    }
  };
  // front legs: short, thick, splayed props. Sections listed so bands can wrap them exactly.
  const FL = V(0.28, 0, 0.24);
  const legSec = [
    { y: 0.055, x: FL.x, z: FL.z, rx: 0.085, rz: 0.085 },
    { y: 0.14, x: FL.x - 0.012, z: FL.z - 0.01, rx: 0.095, rz: 0.095 },
    { y: 0.24, x: FL.x - 0.07, z: FL.z - 0.04, rx: 0.12, rz: 0.11 },
  ];
  S.push(skin(legSec.flatMap((q) => ring(V(q.x, q.y, q.z), q.rx, q.rz, 8)), 0.0, 0.45));
  const secAt = (y) => {
    let i = 0; while (i < legSec.length - 2 && y > legSec[i + 1].y) i++;
    const a = legSec[i], b = legSec[i + 1], t = (y - a.y) / (b.y - a.y), L = (u, v) => u + (v - u) * t;
    return { y, x: L(a.x, b.x), z: L(a.z, b.z), rx: L(a.rx, b.rx), rz: L(a.rz, b.rz) };
  };
  const band = (y0, y1, extra, sw) => S.push(paint(hull([y0, y1].flatMap((y) => {
    const q = secAt(y); return ring(V(q.x, y, q.z), q.rx + extra, q.rz + extra, 8);
  })), sw, 'flat'));
  digits(FL, 4, 1.7, 0.4, 0.115);
  // hind legs: folded big thigh, shin, long webbed foot
  const thigh = skin([...ring(V(0.2, 0.24, -0.22), 0.09, 0.12, 8, 'x'), ...ring(V(0.33, 0.2, -0.13), 0.1, 0.13, 8, 'x'),
    ...ring(V(0.37, 0.17, 0.0), 0.06, 0.08, 8, 'x')], 0.0, 0.45);
  S.push(thigh); surf.push(thigh);
  S.push(skin([...ring(V(0.37, 0.16, -0.02), 0.065, 0.065, 8), ...ring(V(0.38, 0.07, -0.13), 0.06, 0.06, 8),
    ...ring(V(0.38, 0.04, -0.16), 0.06, 0.045, 8)], 0.0, 0.45));
  const FF = V(0.41, 0, -0.1);
  digits(FF, 3, 1.1, 0.4, 0.14);

  // ================= ARMOR =================
  const AZ = -0.06, SY = -0.03;
  C.push(armor(hull([
    ...ring(V(0, 0.38 + SY, AZ), 0.31, 0.24, 10, 'y'),
    ...ring(V(0, 0.46 + SY, AZ), 0.26, 0.2, 10, 'y'),
    ...ring(V(0, 0.51 + SY, AZ - 0.01), 0.15, 0.12, 10, 'y'),
  ]), 0.36 + SY, 0.52 + SY));
  C.push(gold(hull([...ring(V(0, 0.365 + SY, AZ), 0.325, 0.255, 10, 'y'), ...ring(V(0, 0.4 + SY, AZ), 0.31, 0.24, 10, 'y')])));
  C.push(rune(hull([...ring(V(0, 0.408 + SY, AZ), 0.297, 0.23, 10, 'y'), ...ring(V(0, 0.42 + SY, AZ), 0.29, 0.224, 10, 'y')])));
  for (let k = 0; k < 4; k++) {
    const a = 0.45 + k * 0.62, c = V(Math.sin(a) * 0.318, 0.383 + SY, AZ + Math.cos(a) * 0.25);
    const n = V(Math.sin(a), 0, Math.cos(a) * 0.8).normalize();
    S.push(paint(hull([add(c, n, 0.028), ...ring(add(c, n, 0.004), 0.02, 0.02, 4, 'y', 0), V(c.x, c.y + 0.022, c.z), V(c.x, c.y - 0.022, c.z)]), SW.gem, 'y'));
  }
  // shoulder pauldrons (dome + gold rims), tilted outward over the front legs
  const P = V(0.28, 0.29, 0.17);
  const tilt = (g) => rollAt(g, P, -0.55);
  S.push(tilt(armor(hull([...ring(V(P.x, P.y - 0.02, P.z), 0.11, 0.1, 8, 'y'), ...ring(V(P.x, P.y + 0.04, P.z), 0.09, 0.08, 8, 'y'),
    ...ring(V(P.x, P.y + 0.075, P.z), 0.045, 0.04, 8, 'y')]), P.y - 0.04, P.y + 0.08)));
  S.push(tilt(goldF(hull([...ring(V(P.x, P.y - 0.035, P.z), 0.118, 0.108, 8, 'y'), ...ring(V(P.x, P.y - 0.012, P.z), 0.116, 0.106, 8, 'y')]))));
  S.push(tilt(goldF(hull([...ring(V(P.x, P.y + 0.035, P.z), 0.095, 0.085, 8, 'y'), ...ring(V(P.x, P.y + 0.048, P.z), 0.088, 0.078, 8, 'y')]))));
  // gold arm bands wrapping the whole leg, with a glowing rune ring in the middle
  band(0.08, 0.13, 0.0065, SW.gold);
  band(0.099, 0.111, 0.012, SW.rune);
  // crown: gold band, violet cap, points, big glowing gem front
  const CR = V(0, H.y + 0.15, H.z - 0.02);
  C.push(gold(hull([...ring(CR, 0.11, 0.09, 8, 'y'), ...ring(V(0, CR.y + 0.045, CR.z), 0.12, 0.1, 8, 'y')])));
  C.push(armor(hull([...ring(V(0, CR.y + 0.04, CR.z), 0.105, 0.085, 8, 'y'), ...ring(V(0, CR.y + 0.08, CR.z - 0.005), 0.07, 0.055, 8, 'y'),
    V(0, CR.y + 0.1, CR.z - 0.01)]), CR.y + 0.04, CR.y + 0.1));
  C.push(paint(hull([...ring(V(0, CR.y + 0.095, CR.z - 0.01), 0.022, 0.022, 4, 'y', 0), V(0, CR.y + 0.15, CR.z - 0.01), V(0, CR.y + 0.08, CR.z - 0.01)]), SW.gem, 'y'));
  for (const a of [0.55, -0.55, 1.25, -1.25, Math.PI]) {
    const d = V(Math.sin(a), 0, Math.cos(a));
    C.push(gold(shard(add(V(0, CR.y + 0.035, CR.z), d, 0.105), V(d.x * 0.25, 1, d.z * 0.25), 0.026, 0.07)));
  }
  C.push(gold(hull([V(0, CR.y + 0.12, CR.z + 0.1), V(0.05, CR.y + 0.04, CR.z + 0.105), V(-0.05, CR.y + 0.04, CR.z + 0.105),
    V(0, CR.y - 0.01, CR.z + 0.105), V(0, CR.y + 0.04, CR.z + 0.06), V(0, CR.y + 0.12, CR.z + 0.07)])));
  C.push(paint(hull([V(0, CR.y + 0.095, CR.z + 0.118), V(0.032, CR.y + 0.042, CR.z + 0.122), V(-0.032, CR.y + 0.042, CR.z + 0.122),
    V(0, CR.y + 0.005, CR.z + 0.122), V(0, CR.y + 0.045, CR.z + 0.135), V(0, CR.y + 0.045, CR.z + 0.1)]), SW.gem, 'y'));

  // ================= SPIKES (purple toxic, chunky shards fanning from the shell) =================
  for (const [b, d, w, l] of [
    [V(0, 0.5 + SY, 0.06), V(0, 1, 0.1), 0.05, 0.13],
    [V(0, 0.52 + SY, -0.06), V(0, 1, -0.25), 0.06, 0.17],
    [V(0, 0.48 + SY, -0.19), V(0, 0.8, -0.7), 0.05, 0.14],
    [V(0, 0.3, -0.33), V(0, 0.4, -1), 0.04, 0.09],
  ]) C.push(spike(shard(b, d, w, l)));
  for (const [b, d, w, l] of [
    [V(0.13, 0.49 + SY, 0.02), V(0.45, 1, 0.0), 0.045, 0.12],
    [V(0.15, 0.48 + SY, -0.13), V(0.5, 1, -0.45), 0.05, 0.13],
    [V(0.25, 0.42 + SY, -0.04), V(1, 0.8, -0.2), 0.04, 0.1],
    [V(0.31, P.y + 0.07, P.z), V(1, 1, -0.2), 0.04, 0.1],          // pauldron spike
    [V(0.08, H.y + 0.17, H.z - 0.12), V(0.3, 0.8, -1), 0.035, 0.09], // behind the crown
    [V(0.1, 0.315, -0.3), V(0.3, 0.5, -1), 0.035, 0.08],           // rump
    [V(0.3, 0.27, -0.17), V(1, 0.7, -0.4), 0.035, 0.08],           // thigh
  ]) S.push(spike(shard(b, d, w, l)));

  // ================= SLIME =================
  // a few irregular faceted toxic warts
  for (const [c, sc] of [[V(0.36, 0.25, -0.1), V(0.04, 0.03, 0.035)], [V(0.25, H.y + 0.06, H.z + 0.04), V(0.032, 0.026, 0.03)]])
    S.push(slime(blob(0, c, sc, { jitter: 0.45 })));
  // chunky drip: flat ooze cap stuck to the surface, thick stem, big faceted drop
  const drip = (top, len, r, out) => {
    const parts = [];
    parts.push(slime(hull([...ring(V(top.x, top.y + 0.012, top.z), r * 1.5, r * 1.3, 7, 'y', 0.3), ...ring(V(top.x, top.y - 0.012, top.z), r * 1.3, r * 1.1, 7, 'y', 0.1)])));
    parts.push(slime(hull([...ring(V(top.x, top.y, top.z), r, r, 6, 'y'), ...ring(V(top.x, top.y - len * 0.62, top.z), r * 0.6, r * 0.6, 6, 'y', 0.2)])));
    parts.push(slime(hull([...ring(V(top.x, top.y - len * 0.6, top.z), r * 0.65, r * 0.65, 6, 'y', 0.2),
      ...ring(V(top.x, top.y - len * 0.84, top.z), r * 1.05, r * 1.05, 6, 'y', 0.45), V(top.x, top.y - len, top.z)])));
    out.push(...parts);
  };
  drip(V(0.285, H.y - 0.085, JZ - 0.06), 0.15, 0.034, S);                 // mouth corners
  drip(V(0, H.y - 0.15, H.z + 0.07), 0.12, 0.034, C);                   // chin
  drip(V(Math.sin(1.1) * 0.31, 0.365 + SY, AZ + Math.cos(1.1) * 0.24), 0.13, 0.032, S); // shell rim front
  drip(V(Math.sin(2.3) * 0.3, 0.365 + SY, AZ + Math.cos(2.3) * 0.23), 0.1, 0.028, S);  // shell rim back

  // slime streaks running down from the shell rim, conformed to the body by raycasting
  const meshes = surf.map((g) => new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })));
  const rc = new THREE.Raycaster();
  const hit = (th, y) => {
    const dir = V(Math.sin(th), 0, Math.cos(th));
    rc.set(V(dir.x * 2, y, AZ + dir.z * 2), dir.clone().negate());
    const h = rc.intersectObjects(meshes, false)[0];
    if (!h) return null;
    const n = h.face.normal.clone(); if (n.dot(dir) < 0) n.negate();
    return { p: h.point, n, t: V(Math.cos(th), 0, -Math.sin(th)) };
  };
  const streak = (th, ys, widths, out) => {
    const smp = ys.map((y) => hit(th, y));
    if (smp.some((q) => !q)) return;
    for (let i = 0; i < smp.length - 1; i++) {
      const pts = [];
      for (const [q, w] of [[smp[i], widths[i]], [smp[i + 1], widths[i + 1]]])
        for (const sgn of [-1, 1]) for (const off of [-0.012, 0.009])
          pts.push(add(add(q.p, q.t, sgn * w), q.n, off));
      out.push(slime(hull(pts)));
    }
    const e = smp[smp.length - 1], w = widths[widths.length - 1];
    out.push(slime(blob(0, add(add(e.p, V(0, -1, 0), w * 0.6), e.n, 0.004), V(w * 1.15, w * 1.3, w * 1.15), { jitter: 0.3 })));
  };
  streak(Math.PI, [0.355, 0.32, 0.28, 0.25], [0.05, 0.04, 0.032, 0.026], C);
  streak(2.55, [0.355, 0.31, 0.27], [0.042, 0.032, 0.025], S);
  streak(1.75, [0.36, 0.33, 0.3], [0.04, 0.032, 0.026], S);

  return assemble(C, S);
}

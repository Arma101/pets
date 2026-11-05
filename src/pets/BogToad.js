// Bog Toad (Mythic, Round 6 Swamp Slam): big olive faceted toad, pale warts, mossy back with bog roots,
// glowing green spots and markings, gold-trimmed horns.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  body:   { i: 0, top: '#9DB04A', bot: '#5F7124' },
  belly:  { i: 1, top: '#EDE9B6', bot: '#C9C487' },
  wart:   { i: 2, top: '#E4E8AE', bot: '#BFC983' },
  moss:   { i: 3, top: '#B3C84A', bot: '#55741F' },
  root:   { i: 4, top: '#86603A', bot: '#4C321D' },
  glow:   { i: 5, top: '#B6FF5E', bot: '#3CF03C', glow: true },
  gold:   { i: 6, top: '#FFDF6A', bot: '#D69A1E' },
  horn:   { i: 7, top: '#D9A63E', bot: '#FFEFB8' },
  white:  { i: 8, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:    { i: 9, top: '#1A1416', bot: '#0C0A0B' },
  brow:   { i: 10, top: '#7E9634', bot: '#50641C' },
  mouth:  { i: 11, top: '#3E2A1A', bot: '#26180E' },
  dark:   { i: 12, top: '#6E8530', bot: '#4A5C1A' },
};
const SW = PALETTE;

// ---- surface helpers: raycast a hull to stick warts / spots / markings onto it ----
const RC = new THREE.Raycaster();
const MAT = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
function hit(geo, from, toward) {
  const dir = toward.clone().sub(from).normalize();
  RC.set(from, dir);
  const h = RC.intersectObject(new THREE.Mesh(geo, MAT), false)[0];
  if (!h) return null;
  const n = h.face.normal.clone().normalize();
  if (n.dot(dir) > 0) n.negate();
  return { p: h.point.clone(), n };
}
function frame(n) {
  const up = Math.abs(n.y) > 0.9 ? V(0, 0, 1) : V(0, 1, 0);
  const a = new THREE.Vector3().crossVectors(up, n).normalize();
  const b = new THREE.Vector3().crossVectors(n, a).normalize();
  return [a, b];
}
// polygon disc lying on the surface (sx, sy stretch along tangent axes)
function decal(h, r, sides = 6, lift = 0.007, sx = 1, sy = 1, rot = 0) {
  const [a, b] = frame(h.n), pts = [];
  for (let k = 0; k < sides; k++) {
    const t = rot + (2 * Math.PI * k) / sides;
    const o = a.clone().multiplyScalar(Math.cos(t) * r * sx).addScaledVector(b, Math.sin(t) * r * sy);
    pts.push(h.p.clone().add(o).addScaledVector(h.n, lift), h.p.clone().add(o).addScaledVector(h.n, -0.03));
  }
  return hull(pts);
}
// faceted wart dome
function wart(h, r, ht, sides = 6) {
  const [a, b] = frame(h.n), pts = [];
  for (let k = 0; k < sides; k++) {
    const t = (2 * Math.PI * k) / sides;
    const o = a.clone().multiplyScalar(Math.cos(t)).addScaledVector(b, Math.sin(t));
    pts.push(h.p.clone().addScaledVector(o, r).addScaledVector(h.n, -0.025));
    pts.push(h.p.clone().addScaledVector(o, r * 0.62).addScaledVector(h.n, ht * 0.7));
  }
  pts.push(h.p.clone().addScaledVector(h.n, ht));
  return hull(pts);
}
// direction from spherical angles (az from +z toward +x, el up)
const dirOf = (az, el) => V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
const D = Math.PI / 180;
// cheap bevelled block: bottom rectangle + inset top (10 tris)
const bx = (c, hx, hy, hz, k = 0.6) => hull([
  V(c.x - hx, c.y - hy, c.z - hz), V(c.x + hx, c.y - hy, c.z - hz), V(c.x - hx, c.y - hy, c.z + hz), V(c.x + hx, c.y - hy, c.z + hz),
  V(c.x - hx * k, c.y + hy, c.z - hz * k), V(c.x + hx * k, c.y + hy, c.z - hz * k), V(c.x - hx * k, c.y + hy, c.z + hz * k), V(c.x + hx * k, c.y + hy, c.z + hz * k),
  V(c.x - hx, c.y + hy * 0.3, c.z - hz), V(c.x + hx, c.y + hy * 0.3, c.z - hz), V(c.x - hx, c.y + hy * 0.3, c.z + hz), V(c.x + hx, c.y + hy * 0.3, c.z + hz)]);

export function buildGeometry() {
  const C = [], S = [];
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= BODY (wide squat pear, back sloping to the rump) =================
  const bodyG = hull([
    ...ring(V(0, 0.27, -0.47), 0.15, 0.1, 10, 'z'),
    ...ring(V(0, 0.29, -0.39), 0.3, 0.2, 10, 'z'),
    ...ring(V(0, 0.31, -0.22), 0.38, 0.26, 10, 'z'),
    ...ring(V(0, 0.33, -0.02), 0.4, 0.27, 10, 'z'),
    ...ring(V(0, 0.35, 0.16), 0.36, 0.25, 10, 'z'),
    ...ring(V(0, 0.37, 0.28), 0.3, 0.2, 10, 'z'),
  ]);
  C.push(paint(bodyG, SW.body, 'y', [0.1, 0.62]));
  const BC = V(0, 0.33, -0.1);
  // pale belly plate underneath / chest
  C.push(paint(hull([
    ...ring(V(0, 0.11, -0.25), 0.22, 0.06, 8, 'z'),
    ...ring(V(0, 0.09, 0.0), 0.27, 0.07, 8, 'z'),
    ...ring(V(0, 0.16, 0.24), 0.24, 0.1, 8, 'z'),
    ...ring(V(0, 0.27, 0.36), 0.2, 0.08, 8, 'z'),
  ]), SW.belly, 'y', [0.05, 0.33]));

  // ================= HEAD (big, wide, flat-topped, merges into the body) =================
  const H = { y: 0.51, z: 0.36 };
  const headG = hull([
    ...cbox(V(0, H.y, H.z), 0.31, 0.15, 0.17, 0.07),
    ...ring(V(0, H.y + 0.18, H.z - 0.06), 0.2, 0.12, 8, 'y'),
    V(0.35, H.y - 0.06, H.z + 0.02), V(-0.35, H.y - 0.06, H.z + 0.02),
    V(0.3, H.y + 0.04, H.z - 0.12), V(-0.3, H.y + 0.04, H.z - 0.12),
  ]);
  C.push(paint(headG, SW.body, 'y', [0.29, 0.75]));
  const FZ = H.z + 0.17; // front face plane
  // lower jaw (pale) jutting slightly, wide toad mouth line
  C.push(paint(hull([...cbox(V(0, H.y - 0.15, H.z + 0.02), 0.3, 0.06, 0.165, 0.04),
    V(0.33, H.y - 0.11, H.z + 0.0), V(-0.33, H.y - 0.11, H.z + 0.0)]), SW.dark, 'y', [0.3, 0.46]));
  C.push(flat(hull(cbox(V(0, H.y - 0.09, FZ - 0.01), 0.23, 0.009, 0.03, 0.004)), SW.mouth));
  S.push(flat(hull([V(0.22, H.y - 0.081, FZ + 0.02), V(0.22, H.y - 0.099, FZ + 0.02),
    V(0.33, H.y - 0.081, H.z + 0.02), V(0.33, H.y - 0.099, H.z + 0.02),
    V(0.2, H.y - 0.081, FZ - 0.06), V(0.2, H.y - 0.099, FZ - 0.06), V(0.3, H.y - 0.09, H.z - 0.04)]), SW.mouth));
  // nostrils
  S.push(flat(hull(cbox(V(0.045, H.y - 0.005, FZ + 0.002), 0.016, 0.01, 0.01, 0.004)), SW.mouth));

  // eye turrets (toad eye bumps on top of the head)
  S.push(paint(hull([...ring(V(0.15, H.y + 0.08, H.z + 0.08), 0.09, 0.08, 7, 'y'),
    ...ring(V(0.15, H.y + 0.235, H.z + 0.04), 0.065, 0.055, 7, 'y')]), SW.body, 'y', [0.41, 0.8]));

  // fierce eyes: white almond with angry flat top, big black pupil, catchlight
  const E = V(0.14, H.y + 0.07, 0);
  const es = 1.22, P = (a) => a.map(([u, v]) => [u * es, v * es]);
  S.push(flat(hull(plate(P([[-0.05, 0.004], [0.055, 0.04], [0.062, -0.012], [0.024, -0.048], [-0.036, -0.043], [-0.055, -0.019]]),
    E, FZ - 0.01, FZ + 0.012)), SW.white));
  S.push(flat(hull(plate(P([[-0.036, 0.005], [0.019, 0.024], [0.029, -0.01], [0.007, -0.038], [-0.026, -0.036], [-0.041, -0.014]]),
    V(E.x - 0.006, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye));
  S.push(flat(hull(plate(P([[-0.009, -0.009], [0.009, -0.009], [0.009, 0.009], [-0.009, 0.009]]),
    V(E.x + 0.004, E.y + 0.0, 0), FZ + 0.014, FZ + 0.022)), SW.white));
  // heavy brow slanting down to the centre
  S.push(paint(hull([
    V(0.04, E.y + 0.012, FZ + 0.035), V(0.042, E.y + 0.055, FZ + 0.025),
    V(0.25, E.y + 0.06, FZ - 0.005), V(0.25, E.y + 0.105, FZ - 0.02),
    V(0.04, E.y + 0.012, FZ - 0.04), V(0.042, E.y + 0.065, FZ - 0.05),
    V(0.25, E.y + 0.06, FZ - 0.07), V(0.25, E.y + 0.11, FZ - 0.08),
  ]), SW.brow, 'y'));
  // gold trim along the brow top
  S.push(flat(hull([
    V(0.05, E.y + 0.058, FZ + 0.028), V(0.05, E.y + 0.074, FZ + 0.02), V(0.05, E.y + 0.07, FZ - 0.045),
    V(0.245, E.y + 0.104, FZ - 0.017), V(0.245, E.y + 0.12, FZ - 0.025), V(0.245, E.y + 0.116, FZ - 0.08),
    V(0.05, E.y + 0.056, FZ - 0.045), V(0.245, E.y + 0.1, FZ - 0.08),
  ]), SW.gold));

  // ================= HORNS (big gold horns sweeping up, out and back) =================
  S.push(flat(hull([...ring(V(0.205, H.y + 0.14, H.z - 0.05), 0.088, 0.085, 6, 'y'),
    ...ring(V(0.215, H.y + 0.2, H.z - 0.06), 0.092, 0.088, 6, 'y')]), SW.gold));
  S.push(paint(tube(curveSamples(
    [V(0.215, H.y + 0.18, H.z - 0.06), V(0.27, H.y + 0.265, H.z - 0.08), V(0.32, H.y + 0.325, H.z - 0.13), V(0.345, H.y + 0.36, H.z - 0.2)],
    6, (t) => 0.078 * Math.pow(1 - t, 0.9) + 0.01), { seg: 6, capEnd: 0.03 }), SW.horn, 'len'));
  // small back horns
  S.push(paint(tube(curveSamples(
    [V(0.12, H.y + 0.17, H.z - 0.12), V(0.16, H.y + 0.25, H.z - 0.2), V(0.17, H.y + 0.29, H.z - 0.28)],
    5, (t) => 0.035 * (1 - t) + 0.006), { seg: 5, capEnd: 0.02 }), SW.horn, 'len'));

  // ================= FRONT LEGS (thick, splayed, gold bracers, 4 chunky toes) =================
  const FL = V(0.29, 0, 0.37);
  const legG = hull([...ring(V(0.24, 0.34, 0.27), 0.12, 0.12, 8), ...ring(V(0.28, 0.19, 0.33), 0.1, 0.1, 8),
    ...ring(V(FL.x, 0.07, FL.z), 0.085, 0.085, 8)]);
  S.push(paint(legG, SW.body, 'y', [0.0, 0.5]));
  S.push(flat(hull([...ring(V(FL.x, 0.1, FL.z), 0.097, 0.097, 8), ...ring(V(FL.x - 0.004, 0.145, FL.z - 0.006), 0.104, 0.104, 8)]), SW.gold));
  S.push(paint(hull(cbox(V(FL.x, 0.035, FL.z + 0.015), 0.085, 0.035, 0.08, 0.02)), SW.belly, 'y', [0, 0.08]));
  for (const [ang, len] of [[-30, 0.08], [-5, 0.09], [20, 0.09], [50, 0.075]]) {
    const d = V(Math.sin(ang * D), 0, Math.cos(ang * D));
    const c = FL.clone().addScaledVector(d, 0.05 + len * 0.5);
    S.push(paint(hull([V(c.x - 0.022, 0, c.z - 0.012), V(c.x + 0.022, 0, c.z - 0.012), V(c.x - 0.016, 0.05, c.z - 0.005), V(c.x + 0.016, 0.05, c.z - 0.005),
      V(c.x + d.x * len * 0.6, 0.015, c.z + 0.01 + d.z * len * 0.6), V(c.x + d.x * len * 0.6, 0.035, c.z + 0.01 + d.z * len * 0.6)]),
    SW.belly, 'y', [0, 0.07]));
    const tip = V(c.x + d.x * len * 0.6, 0.0, c.z + 0.01 + d.z * len * 0.6);
    S.push(flat(bx(V(tip.x, 0.02, tip.z), 0.019, 0.02, 0.019, 0.35), SW.gold));
  }

  // ================= HIND LEGS (huge folded haunches, webbed feet planted outward) =================
  const haunchG = hull([...ring(V(0.3, 0.32, -0.24), 0.15, 0.16, 8, 'x'), ...ring(V(0.38, 0.25, -0.15), 0.15, 0.15, 8, 'x'),
    ...ring(V(0.45, 0.15, 0.02), 0.1, 0.1, 8, 'x')]);
  S.push(paint(haunchG, SW.body, 'y', [0.02, 0.55]));
  // shin folding back down to the ankle
  S.push(paint(hull([...ring(V(0.46, 0.13, 0.02), 0.08, 0.07, 8, 'z'), ...ring(V(0.48, 0.07, -0.14), 0.07, 0.06, 8, 'z')]), SW.dark, 'y', [0.0, 0.3]));
  // hind foot: heel block + 4 long webbed toes fanning forward-out
  const HF = V(0.5, 0, -0.12);
  S.push(paint(hull(cbox(V(HF.x, 0.04, HF.z), 0.08, 0.04, 0.08, 0.02)), SW.belly, 'y', [0, 0.09]));
  const toeTips = [];
  for (const [ang, len] of [[5, 0.15], [30, 0.17], [55, 0.16], [80, 0.13]]) {
    const d = V(Math.sin(ang * D), 0, Math.cos(ang * D));
    const a = HF.clone().addScaledVector(d, 0.05), b = HF.clone().addScaledVector(d, 0.05 + len);
    toeTips.push(b);
    S.push(paint(hull([...[[a, 0.026, 0.05], [b, 0.021, 0.042]].flatMap(([q, w, ht]) => [V(q.x - w, 0, q.z - w), V(q.x + w, 0, q.z - w), V(q.x - w, 0, q.z + w), V(q.x + w, 0, q.z + w), V(q.x - w * 0.7, ht, q.z - w * 0.7), V(q.x + w * 0.7, ht, q.z - w * 0.7), V(q.x - w * 0.7, ht, q.z + w * 0.7), V(q.x + w * 0.7, ht, q.z + w * 0.7)])]),
      SW.belly, 'y', [0, 0.06]));
    S.push(flat(bx(V(b.x + d.x * 0.014, 0.02, b.z + d.z * 0.014), 0.02, 0.02, 0.02, 0.35), SW.gold));
  }
  // webbing between toes
  for (let k = 0; k < toeTips.length - 1; k++) {
    const m1 = HF.clone().lerp(toeTips[k], 0.75), m2 = HF.clone().lerp(toeTips[k + 1], 0.75);
    S.push(paint(hull([V(HF.x, 0.004, HF.z), V(HF.x, 0.014, HF.z), V(m1.x, 0.004, m1.z), V(m1.x, 0.012, m1.z),
      V(m2.x, 0.004, m2.z), V(m2.x, 0.012, m2.z)]), SW.wart, 'flat'));
  }

  // ================= WARTS (pale faceted bumps on back, flanks, head and haunches) =================
  const onBody = (az, el, c = BC) => hit(bodyG, c.clone().addScaledVector(dirOf(az * D, el * D), 2), c);
  for (const [az, el, r] of [[40, 28, 0.04], [68, 18, 0.036], [100, 22, 0.04], [128, 30, 0.036], [150, 18, 0.034],
    [55, 48, 0.034], [95, 42, 0.03], [140, 50, 0.036], [170, 35, 0.032], [25, 52, 0.03], [80, 5, 0.034], [115, 2, 0.03]]) {
    const h = onBody(az, el);
    if (h) S.push(paint(wart(h, r, r * 0.85), SW.wart, 'flat'));
  }
  // haunch warts
  const HC2 = V(0.36, 0.25, -0.15);
  for (const [az, el, r] of [[40, 40, 0.032], [130, 28, 0.03], [60, 5, 0.03]]) {
    const h = hit(haunchG, HC2.clone().addScaledVector(dirOf(az * D, el * D), 2), HC2);
    if (h) S.push(paint(wart(h, r, r * 0.85), SW.wart, 'flat'));
  }
  { const LG = legG, LC = V(0.25, 0.25, 0.3);
    { const h = hit(LG, LC.clone().addScaledVector(dirOf(30 * D, 45 * D), 2), LC);
      if (h) { S.push(flat(decal(h, 0.085, 7, 0.006), SW.dark)); S.push(flat(wart(h, 0.06, 0.03, 6), SW.glow)); } }
    for (const [az, el, r] of [[75, 5, 0.028], [70, -25, 0.026]]) {
      const h = hit(LG, LC.clone().addScaledVector(dirOf(az * D, el * D), 2), LC);
      if (h) S.push(paint(wart(h, r, r * 0.8), SW.wart, 'flat'));
    } }
  // glowing green spots ringed with dark skin (bright lime even without emissive)
  for (const [az, el, r] of [[62, 30, 0.07], [118, 30, 0.066], [90, 8, 0.06], [158, 26, 0.05], [35, 10, 0.075]]) {
    const h = onBody(az, el);
    if (!h) continue;
    S.push(flat(decal(h, r * 1.45, 7, 0.006), SW.dark));
    S.push(flat(wart(h, r, r * 0.6, 6), SW.glow));
  }
  { const h = hit(haunchG, HC2.clone().addScaledVector(dirOf(95 * D, 40 * D), 2), HC2);
    if (h) { S.push(flat(decal(h, 0.06, 7, 0.006), SW.dark)); S.push(flat(wart(h, 0.042, 0.025, 6), SW.glow)); } }
  // head warts + glowing cheek spots
  const HC = V(0, H.y, H.z - 0.05);
  const onHead = (az, el) => hit(headG, HC.clone().addScaledVector(dirOf(az * D, el * D), 2), HC);
  for (const [az, el, r] of [[78, 20, 0.03], [112, 8, 0.028], [45, 22, 0.024], [85, 2, 0.026], [20, 62, 0.022]]) {
    const h = onHead(az, el);
    if (h) S.push(paint(wart(h, r, r * 0.8), SW.wart, 'flat'));
  }
  { const h = hit(headG, V(0.8, H.y + 0.13, H.z + 0.07), V(0, H.y + 0.13, H.z + 0.07)); if (h) { S.push(flat(decal(h, 0.07, 7, 0.006), SW.dark)); S.push(flat(wart(h, 0.05, 0.026, 6), SW.glow)); } }
  { const h = onHead(62, 2); if (h) { S.push(flat(decal(h, 0.045, 7, 0.006), SW.dark)); S.push(flat(wart(h, 0.03, 0.02, 6), SW.glow)); } }

  // ================= GLOWING MARKINGS (diamond runes down the spine + forehead gem) =================
  for (const [z, r] of [[0.1, 0.05], [-0.07, 0.056], [-0.24, 0.05], [-0.38, 0.036]]) {
    const h = hit(bodyG, V(0, 2, z), V(0, 0, z));
    if (!h) continue;
    C.push(flat(decal(h, r * 1.35, 4, 0.006, 0.75, 1.15, Math.PI / 2), SW.gold));
    C.push(flat(decal(h, r, 4, 0.016, 0.75, 1.15, Math.PI / 2), SW.glow));
  }
  // forehead: gold diamond setting with a glowing gem
  {
    const h = hit(headG, V(0, H.y + 1.0, H.z + 0.9), V(0, H.y + 0.05, H.z));
    if (h) {
      C.push(flat(decal(h, 0.05, 4, 0.01, 0.8, 1.1, Math.PI / 2), SW.gold));
      C.push(flat(decal(h, 0.03, 4, 0.02, 0.8, 1.1, Math.PI / 2), SW.glow));
    }
  }

  // ================= MOSS (clumps and drooping shards on the back) =================
  const mossAt = (az, el, sc, drip = false) => {
    const h = onBody(az, el);
    if (!h) return;
    const g = blob(0, V(0, 0, 0), V(sc, sc * 0.3, sc * 0.85), { jitter: 0.22 });
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), h.n));
    g.translate(h.p.x + h.n.x * sc * 0.05, h.p.y + h.n.y * sc * 0.05, h.p.z + h.n.z * sc * 0.05);
    g.computeVertexNormals();
    S.push(paint(g, SW.moss, 'y', [h.p.y - sc * 0.6, h.p.y + sc * 0.4]));
    if (drip) { // one short hanging tuft
      const [a] = frame(h.n);
      const down = V(0, -1, 0).addScaledVector(h.n, 0.35);
      S.push(paint(shard(h.p.clone().addScaledVector(h.n, 0.005).addScaledVector(down, sc * 0.45), down, sc * 0.3, sc * 0.55), SW.moss, 'flat'));
    }
  };
  // low carpet hugging the back, beside the glowing spine runes
  for (const [az, el, sc, drip] of [[30, 58, 0.1], [60, 55, 0.11], [95, 56, 0.11], [130, 58, 0.1], [160, 60, 0.09],
    [75, 40, 0.085, true], [112, 42, 0.09, true], [145, 40, 0.08], [45, 40, 0.08]]) mossAt(az, el, sc, drip);

  // ================= BOG ROOTS (draped over the back and down the flanks) =================
  const root = (pts, r0, n = 7) => S.push(paint(tube(curveSamples(pts, n, (t) => r0 * (1 - 0.75 * t)), { seg: 5, capEnd: 0.015 }), SW.root, 'len'));
  const sroot = (ae, r0, n = 8) => root(ae.map(([az, el]) => { const h = onBody(az, el); return h.p.addScaledVector(h.n, r0 * 0.75); }), r0, n);
  // one root per flank, hugging the hull from shoulder to rump
  sroot([[28, 18], [55, 27], [88, 15], [120, 28], [150, 17], [168, 10]], 0.036, 10);
  // short root along the rump behind the spine runes
  { const q = (z) => { const h = hit(bodyG, V(0, 2, z), V(0, 0, z)); return h.p.addScaledVector(h.n, 0.022); };
    C.push(paint(tube([{ p: q(-0.3), rx: 0.03, ry: 0.03 }, { p: q(-0.36), rx: 0.028, ry: 0.028 }, { p: q(-0.43), rx: 0.016, ry: 0.016 }], { seg: 6, phase: Math.PI / 6, capStart: 0.02, capEnd: 0.015 }), SW.root, 'flat')); }

  return assemble(C, S);
}

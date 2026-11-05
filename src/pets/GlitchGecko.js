// Glitch Gecko (ROBUX EGG, Mutant Egg): cyan + magenta gecko with blocky glitch-pixel cubes, magenta spikes,
// toxic neon-lime slime drips and glow, ornate violet + gold armour, glowing eyes.
import { V, THREE, hull, cbox, ring, shard, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  cyan:     { i: 0, top: '#6AF4FF', bot: '#139BC8' },
  belly:    { i: 1, top: '#FF9BEA', bot: '#D93AAE' },
  spike:    { i: 2, top: '#FF5FDC', bot: '#A3108A' },
  magenta:  { i: 3, top: '#FF3FCF', bot: '#C21497' },
  deep:     { i: 4, top: '#4B4DF0', bot: '#2A23A8' },
  pale:     { i: 5, top: '#E4FFFF', bot: '#A8F1FF' },
  white:    { i: 6, top: '#FFFFFF', bot: '#F2FFF8', glow: true },
  eye:      { i: 7, top: '#1A1416', bot: '#0C0A0B' },
  brow:     { i: 8, top: '#3FD6F2', bot: '#0F7FAE' },
  mouth:    { i: 9, top: '#5A1446', bot: '#33082A' },
  slime:    { i: 10, top: '#EEFF6A', bot: '#6CFF2E', glow: true },
  armor:    { i: 11, top: '#7A4BE0', bot: '#35188A' },
  gold:     { i: 12, top: '#FFE66E', bot: '#E39E12' },
  gem:      { i: 13, top: '#F4FF8A', bot: '#7DFF2A', glow: true },
  pad:      { i: 14, top: '#FF8FE6', bot: '#C7259C' },
  cyanDk:   { i: 15, top: '#2FCDEB', bot: '#0B79A8' },
  catch:    { i: 16, top: '#FFFFFF', bot: '#FFFFFF' },
  // tail: cyan for the first ~40%, then shifting to hot magenta at the tip (painted along the tube)
  tail: { i: 17, top: '#5CEFFF', bot: '#FF3FCF', draw(g, x, y) {
    const gr = g.createLinearGradient(0, y + 16 + 96 * 0.35, 0, y + 16 + 96 * 0.85);
    gr.addColorStop(0, '#45DDF5'); gr.addColorStop(0.5, '#9A7CF0'); gr.addColorStop(1, '#F23DC8');
    g.fillStyle = gr; g.fillRect(x, y, 128, 128);
  } },
  // glitch-pixel pattern cells, mapped by world position (see paintPix)
  pixF:  { i: 18, top: '#6AF4FF', bot: '#139BC8', draw(g, x, y) { drawPix(g, x, y, false); } },
  pixT:  { i: 19, top: '#66F2FE', bot: '#66F2FE', draw(g, x, y) { drawPix(g, x, y, true); } },
};
const SW = PALETTE;

// ---------- glitch-pixel pattern: 8px blocks = 0.05 world units ----------
const PX = 8, PW = 0.05, Z0 = -0.42, Y0 = 0.52, X0 = -0.3;
const PCOL = { M: '#FF3FCF', D: '#4B4DF0', P: '#E4FFFF', m: '#C21497' };
// flank cell (col = z, row = height from the top)
const FLANK = [
  [6, 4, 'D'], [7, 4, 'M'], [7, 3, 'M'], [8, 3, 'M'], [8, 2, 'D'], [9, 3, 'P'], [8, 5, 'M'], [9, 5, 'M'], [9, 6, 'D'], [10, 4, 'M'], [10, 5, 'm'],
  [1, 4, 'M'], [2, 4, 'M'], [2, 5, 'D'], [1, 3, 'P'], [3, 5, 'M'],
  [11, 2, 'M'], [12, 2, 'D'], [12, 1, 'M'], [13, 1, 'P'],
];
// top cell (col = z, k = distance band from the spine, mirrored both sides)
const TOP = [
  [1, 0, 'D'], [2, 0, 'M'], [2, 1, 'M'], [3, 1, 'P'],
  [4, 2, 'M'], [5, 2, 'M'], [5, 1, 'D'], [6, 1, 'M'], [6, 0, 'M'], [7, 0, 'P'], [4, 3, 'D'], [7, 1, 'm'],
  [12, 1, 'M'], [13, 1, 'D'], [13, 2, 'M'], [12, 3, 'P'],
];
function drawPix(g, x, y, top) {
  if (top) { g.fillStyle = '#62EEFC'; g.fillRect(x, y, 128, 128); }
  else {
    const gr = g.createLinearGradient(0, y + 4 + PX * ((Y0 - 0.48) / PW), 0, y + 4 + PX * ((Y0 - 0.12) / PW));
    gr.addColorStop(0, '#6AF4FF'); gr.addColorStop(1, '#139BC8');
    g.fillStyle = gr; g.fillRect(x, y, 128, 128);
  }
  const blk = (c, r, col) => { g.fillStyle = PCOL[col]; g.fillRect(x + 4 + c * PX, y + 4 + r * PX, PX, PX); };
  if (top) for (const [c, k, col] of TOP) { blk(c, 6 + k, col); blk(c, 5 - k, col); }
  else for (const [c, r, col] of FLANK) blk(c, r, col);
}
// per-face planar projection onto the pattern cells (flank faces: z/y, top/end faces: z/x)
function paintPix(g) {
  const p = g.attributes.position, uv = [];
  const a = V(0, 0, 0), b = V(0, 0, 0), c = V(0, 0, 0);
  const cl = (v) => Math.min(125, Math.max(3, v));
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    const n = cross(b.clone().sub(a), c.clone().sub(a)).normalize();
    const flank = Math.abs(n.x) >= Math.abs(n.y) && Math.abs(n.x) >= Math.abs(n.z);
    const cell = flank ? SW.pixF : SW.pixT;
    const cx = (cell.i % 8) * 128, cy = Math.floor(cell.i / 8) * 128;
    for (const v of [a, b, c]) {
      const col = (v.z - Z0) / PW, row = flank ? (Y0 - v.y) / PW : (v.x - X0) / PW;
      uv.push((cx + cl(4 + col * PX)) / 1024, (cy + cl(4 + row * PX)) / 1024);
    }
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}

// ---------- small vector helpers ----------
const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);

// n-gon ring around an arbitrary axis
function ringN(c, axis, r1, r2, n, phase = Math.PI / n) {
  const a = nrm(axis);
  const ref = Math.abs(a.y) > 0.9 ? V(0, 0, 1) : V(0, 1, 0);
  const u = nrm(cross(ref, a)), v = nrm(cross(a, u));
  const pts = [];
  for (let k = 0; k < n; k++) {
    const t = phase + (2 * Math.PI * k) / n;
    pts.push(add(add(c, u, Math.cos(t) * r1), v, Math.sin(t) * r2));
  }
  return pts;
}
// oriented box: normal n, tangent hint up
function obox(c, n, up, hn, hu, hv) {
  const N = nrm(n);
  let U = add(up, N, -up.dot(N));
  if (U.lengthSq() < 1e-4) U = add(V(0, 0, 1), N, -N.z);
  U.normalize();
  const W = nrm(cross(N, U));
  const pts = [];
  for (const a of [-1, 1]) for (const b of [-1, 1]) for (const d of [-1, 1])
    pts.push(add(add(add(c, N, a * hn), U, b * hu), W, d * hv));
  return hull(pts);
}

// ---------- surface ray-casting so add-ons always sit ON the body ----------
const RC = new THREE.Raycaster();
const MAT = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
function hit(geos, from, dir) {
  RC.set(from, nrm(dir));
  let best = null;
  for (const g of geos) {
    const h = RC.intersectObject(new THREE.Mesh(g, MAT))[0];
    if (h && (!best || h.distance < best.distance)) best = h;
  }
  if (!best) return null;
  const n = best.face.normal.clone();
  if (n.dot(dir) > 0) n.negate();
  return { p: best.point.clone(), n };
}

export function buildGeometry() {
  const C = [], S = [];
  const FY = 0.045; // feet base height (assemble re-grounds), shortens the legs

  // ================= TORSO (stocky, low barrel) =================
  const torsoRings = [
    [-0.36, 0.27, 0.11, 0.1], [-0.27, 0.285, 0.18, 0.14], [-0.10, 0.305, 0.215, 0.16],
    [0.08, 0.32, 0.215, 0.16], [0.22, 0.35, 0.185, 0.15], [0.31, 0.40, 0.135, 0.125],
  ];
  const torso = hull(torsoRings.flatMap(([z, y, a, b]) => ring(V(0, y, z), a, b, 10, 'z', 0)));
  C.push(paintPix(torso));
  // magenta belly slab underneath
  C.push(paint(hull(torsoRings.slice(1, 5).flatMap(([z, y, a, b]) => ring(V(0, y - 0.03, z), a * 0.78, b * 0.92, 10, 'z', 0))),
    SW.belly, 'y', [0.12, 0.3]));
  // neck
  const neck = hull([...ring(V(0, 0.38, 0.27), 0.135, 0.12, 10, 'z', 0), ...ring(V(0, 0.5, 0.42), 0.15, 0.12, 10, 'z', 0)]);
  C.push(paint(neck, SW.cyan, 'y', [0.25, 0.6]));
  C.push(paint(hull([...ring(V(0, 0.335, 0.28), 0.1, 0.08, 8, 'z'), ...ring(V(0, 0.43, 0.44), 0.11, 0.06, 8, 'z')]), SW.belly, 'y', [0.25, 0.5]));

  // ================= TAIL (fat gecko tail, curling up at the tip) =================
  const tailGeo = tube(curveSamples(
    [V(0, 0.3, -0.26), V(0, 0.25, -0.46), V(0, 0.18, -0.64), V(0, 0.17, -0.8), V(0, 0.23, -0.93), V(0, 0.33, -0.98)],
    11, (t) => 0.115 * (1 - 0.72 * t) + 0.012, (t) => 0.1 * (1 - 0.7 * t) + 0.01),
  { seg: 8, axis: V(1, 0, 0), capEnd: 0.0, phase: Math.PI / 8 });
  C.push(paint(tailGeo, SW.tail, 'len'));
  // tail tip "pixelates" into stepped cubes
  C.push(paint(obox(V(0, 0.35, -0.985), V(0, 1, -0.3), V(0, 0, 1), 0.04, 0.04, 0.04), SW.magenta, 'flat'));
  C.push(paint(obox(V(0, 0.415, -0.995), V(0, 1, -0.1), V(0, 0, 1), 0.028, 0.028, 0.028), SW.deep, 'flat'));
  C.push(paint(obox(V(0, 0.46, -0.99), V(0, 1, 0), V(0, 0, 1), 0.018, 0.018, 0.018), SW.slime, 'flat'));
  // gold band near the tip
  C.push(paint(hull([...ringN(V(0, 0.2, -0.87), V(0, 0.45, -1), 0.062, 0.058, 8), ...ringN(V(0, 0.215, -0.895), V(0, 0.45, -1), 0.06, 0.056, 8)]), SW.gold, 'y'));

  const hc0 = C.length, hs0 = S.length;
  // ================= HEAD (big, wide, flat-topped gecko head) =================
  const H = { y: 0.54, z: 0.47 };
  const FZ = H.z + 0.14; // skull front plane (eyes live here)
  const skull = hull([
    ...cbox(V(0, H.y + 0.02, H.z + 0.04), 0.205, 0.135, 0.1, 0.05),
    ...ringN(V(0, H.y + 0.02, H.z - 0.14), V(0, 0, 1), 0.165, 0.11, 8),
    ...ring(V(0, H.y + 0.165, H.z - 0.02), 0.15, 0.1, 8, 'y'),
    V(0.235, H.y - 0.06, H.z - 0.02), V(-0.235, H.y - 0.06, H.z - 0.02),
  ]);
  C.push(paint(skull, SW.cyan, 'y', [H.y - 0.12, H.y + 0.17]));
  // snout: broad, blunt wedge that sits below the eyes
  const snout = hull([
    ...cbox(V(0, H.y - 0.04, FZ + 0.065), 0.165, 0.06, 0.085, 0.035),
    V(0.13, H.y + 0.025, FZ + 0.0), V(-0.13, H.y + 0.025, FZ + 0.0),
    V(0.19, H.y + 0.02, FZ - 0.07), V(-0.19, H.y + 0.02, FZ - 0.07),
    V(0.19, H.y - 0.1, FZ - 0.07), V(-0.19, H.y - 0.1, FZ - 0.07),
  ]);
  C.push(paint(snout, SW.cyan, 'y', [H.y - 0.12, H.y + 0.17]));
  // dark mouth slab between snout and jaw: a wide closed gecko grin
  C.push(paint(hull(cbox(V(0, H.y - 0.101, H.z + 0.1), 0.149, 0.006, FZ + 0.124 - H.z - 0.1, 0.003)), SW.mouth, 'flat'));
  // lower jaw (magenta)
  const jaw = hull([...cbox(V(0, H.y - 0.135, H.z + 0.1), 0.146, 0.035, FZ + 0.12 - H.z - 0.1, 0.022),
    V(0.17, H.y - 0.07, H.z - 0.09), V(-0.17, H.y - 0.07, H.z - 0.09), V(0.12, H.y - 0.15, H.z - 0.06), V(-0.12, H.y - 0.15, H.z - 0.06)]);
  C.push(paint(jaw, SW.cyanDk, 'y', [H.y - 0.2, H.y - 0.1]));
    // nostrils
  S.push(paint(hull(cbox(V(0.06, H.y + 0.021, FZ + 0.11), 0.018, 0.006, 0.012, 0.003)), SW.mouth, 'flat'));

  // ---- fierce glowing eyes (white almond, angry flat top, big pupil, neon rim) ----
  const E = V(0.1, H.y + 0.085, 0);
  const sc = 1.25;
  const P = (arr) => arr.map(([u, v]) => [u * sc, v * sc]);
  const eyePlate = (pts2d, c, z0, z1) => {
    const out = [];
    for (const [u, v] of pts2d) for (const z of [z0, z1]) out.push(V(c.x + u, c.y + v, z));
    return hull(out);
  };
  S.push(paint(eyePlate(P([[-0.052, 0.008], [0.056, 0.044], [0.064, -0.012], [0.026, -0.05], [-0.036, -0.046], [-0.058, -0.02]]),
    V(E.x, E.y, 0), FZ - 0.01, FZ + 0.006), SW.slime, 'flat'));
  S.push(paint(eyePlate(P([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    V(E.x, E.y, 0), FZ - 0.01, FZ + 0.013), SW.white, 'flat'));
  S.push(paint(eyePlate(P([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.005, E.y, 0), FZ + 0.006, FZ + 0.019), SW.eye, 'flat'));
  S.push(paint(eyePlate([[-0.009, -0.009], [0.009, -0.009], [0.009, 0.009], [-0.009, 0.009]],
    V(E.x + 0.006, E.y + 0.004, 0), FZ + 0.014, FZ + 0.023), SW.catch, 'flat'));
  // heavy brow ridge slanting down toward the centre
  S.push(paint(hull([
    V(0.03, E.y + 0.016, FZ + 0.036), V(0.032, E.y + 0.06, FZ + 0.026),
    V(0.18, E.y + 0.062, FZ - 0.01), V(0.18, E.y + 0.105, FZ - 0.025),
    V(0.03, E.y + 0.016, FZ - 0.03), V(0.032, E.y + 0.07, FZ - 0.04),
    V(0.18, E.y + 0.062, FZ - 0.06), V(0.18, E.y + 0.105, FZ - 0.07),
  ]), SW.brow, 'y'));

  // ---- ornate crown-helmet: violet plate, gold trim, crown points, glowing gem ----
  const helm = hull([
    ...ring(V(0, H.y + 0.15, H.z - 0.01), 0.16, 0.12, 8, 'y'),
    ...ring(V(0, H.y + 0.195, H.z - 0.03), 0.115, 0.085, 8, 'y'),
  ]);
  C.push(paint(helm, SW.armor, 'y'));
  C.push(paint(hull([...ring(V(0, H.y + 0.14, H.z - 0.01), 0.175, 0.132, 8, 'y'), ...ring(V(0, H.y + 0.168, H.z - 0.01), 0.172, 0.13, 8, 'y')]), SW.gold, 'y'));
  C.push(paint(shard(V(0, H.y + 0.16, H.z + 0.06), V(0, 1, 0.25), 0.04, 0.11), SW.gold, 'y'));
  S.push(paint(shard(V(0.085, H.y + 0.16, H.z + 0.04), V(0.35, 1, 0.2), 0.032, 0.08), SW.gold, 'y'));
  S.push(paint(shard(V(0.13, H.y + 0.15, H.z - 0.01), V(0.7, 1, 0), 0.028, 0.065), SW.gold, 'y'));
  { const g = V(0, H.y + 0.205, H.z + 0.085), r = 0.034;
    C.push(paint(hull([add(g, V(0, 1, 0), r * 1.3), add(g, V(0, -1, 0), r * 1.3), add(g, V(1, 0, 0), r), add(g, V(-1, 0, 0), r), add(g, V(0, 0, 1), r * 0.7), add(g, V(0, 0, -1), r * 0.7)]), SW.gem, 'y')); }
  // magenta head spikes running back from the crown
  // magenta shard frill fanned around the back of the head
  C.push(paint(shard(V(0, H.y + 0.12, H.z - 0.1), V(0, 0.75, -1), 0.055, 0.13), SW.spike, 'y'));
  for (const [x, y, d, w, l] of [[0.075, 0.115, V(0.45, 0.65, -1), 0.05, 0.12], [0.135, 0.07, V(0.85, 0.35, -1), 0.048, 0.11],
    [0.165, 0.0, V(1, -0.05, -0.85), 0.045, 0.1], [0.16, -0.07, V(1, -0.4, -0.7), 0.04, 0.085]])
    S.push(paint(shard(V(x, H.y + y, H.z - 0.1), d, w, l), SW.spike, 'y'));

  // scale the whole head up about its back/bottom so it reads big and chunky
  const HSC = 1.2, piv = V(0, H.y - 0.1, H.z - 0.12);
  const hm = new THREE.Matrix4().makeTranslation(piv.x, piv.y, piv.z).multiply(new THREE.Matrix4().makeScale(HSC, HSC, HSC))
    .multiply(new THREE.Matrix4().makeTranslation(-piv.x, -piv.y, -piv.z));
  for (const g of [...C.slice(hc0), ...S.slice(hs0)]) { g.applyMatrix4(hm); g.computeVertexNormals(); }
  for (const g of [skull, snout, jaw]) if (!C.slice(hc0).includes(g)) g.applyMatrix4(hm);

  // ================= LEGS (sprawled gecko legs, short and thick) =================
  const limb = (pts, sw = SW.cyan) => paint(hull(pts), sw, 'y', [0.0, 0.45]);
  // front: shoulder -> elbow (out) -> forearm down
  const FL = { s: V(0.13, 0.31, 0.17), e: V(0.31, 0.23, 0.2), w: V(0.315, FY + 0.075, 0.23) };
  S.push(limb([...ringN(FL.s, V(1, -0.3, 0), 0.085, 0.085, 8), ...ringN(FL.e, V(1, -0.3, 0), 0.07, 0.07, 8)]));
  S.push(limb([...ringN(FL.e, V(0, 1, 0), 0.068, 0.068, 8), ...ringN(FL.w, V(0, 1, 0), 0.058, 0.058, 8)]));
  // back: big haunch -> knee -> shin
  const BL = { s: V(0.13, 0.3, -0.2), e: V(0.3, 0.26, -0.22), w: V(0.32, FY + 0.075, -0.25) };
  S.push(limb([...ringN(BL.s, V(1, -0.2, 0), 0.11, 0.1, 8), ...ringN(BL.e, V(1, -0.3, 0), 0.08, 0.078, 8)]));
  S.push(limb([...ringN(BL.e, V(0, 1, 0), 0.074, 0.074, 8), ...ringN(BL.w, V(0, 1, 0), 0.062, 0.062, 8)]));

  // gecko feet: chunky palm + 4 splayed toes ending in broad magenta sticky pads
  const foot = (c, fwd) => {
    S.push(paint(hull([...cbox(V(c.x, FY + 0.04, c.z), 0.068, 0.04, 0.062, 0.022), ...ringN(V(c.x, FY + 0.085, c.z), V(0, 1, 0), 0.055, 0.055, 8)]), SW.cyan, 'y', [FY, FY + 0.12]));
    for (const ang of [-0.25, 0.25, 0.8, 1.45]) {
      const d = V(Math.sin(ang), 0, Math.cos(ang) * fwd);
      const tip = add(V(c.x, 0, c.z), d, 0.105);
      const b0 = add(V(c.x, FY + 0.03, c.z), d, 0.04), t0 = V(tip.x, FY + 0.024, tip.z);
      S.push(paint(hull([...ringN(b0, d, 0.027, 0.027, 6), ...ringN(t0, d, 0.021, 0.021, 6)]), SW.cyan, 'y', [FY, FY + 0.12]));
      const pc0 = add(V(tip.x, FY, tip.z), d, 0.012);
      S.push(paint(hull([...ringN(pc0, V(0, 1, 0), 0.034, 0.034, 6, 0), ...ringN(add(pc0, V(0, 1, 0), 0.038), V(0, 1, 0), 0.028, 0.028, 6, 0)]), SW.pad, 'y', [FY, FY + 0.05]));
    }
  };
  foot(FL.w, 1);
  foot(BL.w, -0.6);

  // ---- ornate shoulder pauldrons (violet shell, gold rim, glowing stud) ----
  const pc = V(0.2, 0.3, 0.18), pa = nrm(V(1, 0.75, 0));
  S.push(paint(hull([...ringN(pc, pa, 0.105, 0.095, 8), ...ringN(add(pc, pa, 0.05), pa, 0.08, 0.07, 8), add(pc, pa, 0.075)]), SW.armor, 'y'));
  S.push(paint(hull([...ringN(add(pc, pa, -0.006), pa, 0.115, 0.104, 8), ...ringN(add(pc, pa, 0.014), pa, 0.112, 0.1, 8)]), SW.gold, 'y'));
  S.push(paint(shard(add(pc, pa, 0.06), pa, 0.035, 0.085), SW.gold, 'y'));

  // ================= BACK ARMOUR (segmented saddle plates with gold edges) =================
  const bodyGeos = [torso, neck, tailGeo];
  const arc = (z, off, a0 = 1.0) => {
    const pts = [];
    for (let k = -4; k <= 4; k++) {
      const t = (k / 4) * a0;
      const dir = V(-Math.sin(t), -Math.cos(t), 0);
      const from = V(Math.sin(t) * 1.5, 0.3 + Math.cos(t) * 1.5, z);
      const h = hit(bodyGeos, from, dir);
      if (h) pts.push(add(h.p, h.n, off));
    }
    return pts;
  };
  for (const [z0, z1] of [[-0.02, 0.16]]) {
    C.push(paint(hull([...arc(z0 + 0.01, 0.03), ...arc(z1 - 0.01, 0.03), ...arc(z0 - 0.01, -0.03), ...arc(z1 + 0.01, -0.03)]), SW.armor, 'y', [0.3, 0.5]));
    { // glowing toxic gem studs on each plate's flanks
      const zm = (z0 + z1) / 2, t = 0.55;
      const h = hit(bodyGeos, V(Math.sin(t) * 1.5, 0.3 + Math.cos(t) * 1.5, zm), V(-Math.sin(t), -Math.cos(t), 0));
      if (h) {
        const g = add(h.p, h.n, 0.035), n = h.n, u = nrm(cross(n, V(0, 0, 1))), r = 0.026;
        S.push(paint(hull([add(g, n, r * 0.9), add(g, n, -r), add(g, V(0, 0, 1), r * 1.4), add(g, V(0, 0, -1), r * 1.4), add(g, u, r), add(g, u, -r)]), SW.gem, 'y'));
      }
    }
    for (const z of [z0, z1]) C.push(paint(hull([...arc(z - 0.012, 0.04, 1.05), ...arc(z + 0.012, 0.04, 1.05), ...arc(z, -0.03, 1.05)]), SW.gold, 'y', [0.3, 0.52]));
  }

  // ================= SPINE SPIKES (fewer, chunkier, graduated) =================
  for (const [z, l, w] of [[0.3, 0.12, 0.065], [0.07, 0.165, 0.08], [-0.17, 0.17, 0.08], [-0.4, 0.14, 0.07],
    [-0.6, 0.11, 0.058], [-0.77, 0.08, 0.045]]) {
    const h = hit(bodyGeos, V(0, 2, z), V(0, -1, 0));
    if (!h) continue;
    C.push(paint(shard(add(h.p, h.n, -0.015), add(h.n, V(0, 0, -0.5)), w, l), SW.spike, 'y', [h.p.y - 0.02, h.p.y + l]));
  }

  // ================= GLITCH PIXEL CLUSTERS (few, big, half-sunk stepped cubes) =================
  const cube = (geos, from, dir, s, sw, up) => {
    const h = hit(geos, from, dir);
    if (h) S.push(paint(obox(add(h.p, h.n, 0.0), h.n, up, s, s, s), sw, 'flat'));
  };
  const COL = { M: SW.magenta, D: SW.deep, P: SW.pale };
  // flank cluster: cells (dz, dy) stepped on the side
  const flankCl = (geos, y, z, s, cells) => { for (const [dz, dy, c] of cells) cube(geos, V(1.5, y + dy * s * 2, z + dz * s * 2), V(-1, 0, 0), s, COL[c], V(0, 1, 0)); };
  const topCl = (geos, x, z, s, cells) => { for (const [dz, dx, c] of cells) cube(geos, V(x + dx * s * 2, 2, z + dz * s * 2), V(0, -1, 0), s, COL[c], V(0, 0, 1)); };
  flankCl(bodyGeos, 0.235, 0.0, 0.026, [[0, 0, 'M'], [-1, 0, 'D'], [-1, 1, 'M']]);
  topCl(bodyGeos, 0.11, -0.29, 0.027, [[0, 0, 'M'], [1, 0, 'P'], [0, 1, 'D']]);
  flankCl(bodyGeos, 0.22, -0.52, 0.025, [[0, 0, 'M'], [-1, 0, 'D'], [0, 1, 'P']]);
  topCl(bodyGeos, 0.05, -0.69, 0.021, [[0, 0, 'D'], [-1, 0, 'M']]);
  flankCl([skull], H.y + 0.04, H.z - 0.03, 0.024, [[0, 0, 'M'], [-1, 0, 'D'], [-1, 1, 'M']]);

  // ---- ornate forearm / shin bracers (violet with gold rims) ----
  for (const [L, rE, rW] of [[FL, 0.068, 0.058], [BL, 0.074, 0.062]]) {
    const m = add(L.e, add(L.w, L.e, -1), 0.55), ax = nrm(add(L.w, L.e, -1)), r = rE + (rW - rE) * 0.55;
    S.push(paint(hull([...ringN(add(m, ax, -0.03), ax, r + 0.008, r + 0.008, 8), ...ringN(add(m, ax, 0.03), ax, r + 0.007, r + 0.007, 8)]), SW.armor, 'y'));
    for (const o of [-0.035, 0.035])
      S.push(paint(hull([...ringN(add(m, ax, o - 0.006), ax, r + 0.014, r + 0.014, 8), ...ringN(add(m, ax, o + 0.006), ax, r + 0.014, r + 0.014, 8)]), SW.gold, 'y'));
  }

  // ================= TOXIC SLIME (glowing drips; each starts inside the surface) =================
  const drip = (geos, from, dir, len, r) => {
    const h = hit(geos, from, dir);
    if (!h) return;
    const top = add(h.p, h.n, -0.012); len *= 1.35; r *= 1.35;
    const pts = [
      ...ringN(add(h.p, h.n, -0.01), h.n, r * 1.6, r * 1.6, 6),
      ...ringN(add(h.p, h.n, 0.006), h.n, r * 1.3, r * 1.3, 6),
      ...ringN(add(top, V(0, -1, 0), len * 0.6), V(0, 1, 0), r * 0.8, r * 0.8, 6),
      ...ringN(add(top, V(0, -1, 0), len * 0.85), V(0, 1, 0), r, r, 6),
      add(top, V(0, -1, 0), len),
    ];
    S.push(paint(hull(pts), SW.slime, 'y'));
  };
  // from the jaw / mouth corners
  drip([jaw], V(1.5, H.y - 0.13, H.z + 0.2), V(-1, 0, 0), 0.075, 0.016);
  drip([jaw], V(1.5, H.y - 0.135, H.z + 0.07), V(-1, 0, 0), 0.05, 0.013);
  // from the pauldrons, back armour, belly and tail
  drip(bodyGeos, V(1.5, 0.27, 0.06), V(-1, 0, 0), 0.07, 0.016);
  drip(bodyGeos, V(1.5, 0.255, -0.14), V(-1, 0, 0), 0.06, 0.014);
  drip(bodyGeos, V(1.5, 0.2, -0.62), V(-1, 0, 0), 0.055, 0.013);
  drip([skull], V(1.5, H.y - 0.07, H.z - 0.08), V(-1, 0, 0), 0.05, 0.013);

  return assemble(C, S);
}

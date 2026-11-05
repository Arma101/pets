// DaGoat Pup (ADMIN): orange & white puppy with small gold goat horns, crown, floating halo,
// little radiant wings, glowing gold armour and royal purple + gold trim.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  orange:  { i: 0, top: '#FFA545', bot: '#E8640E' },
  white:   { i: 1, top: '#FFFFFF', bot: '#EDE5DC' },
  ear:     { i: 2, top: '#F07A1E', bot: '#B4470C' },
  nose:    { i: 3, top: '#3A3438', bot: '#141114' },
  eye:     { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  eyeW:    { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  muzzle:  { i: 6, top: '#FFFFFF', bot: '#F2E6D8' },
  tail:    { i: 7, draw(g, x, y) { // orange for most of the length, then a white tip
    const gr = g.createLinearGradient(0, y + 16, 0, y + 84); gr.addColorStop(0, '#FF9E3E'); gr.addColorStop(1, '#EE7418');
    g.fillStyle = gr; g.fillRect(x, y, 128, 88); g.fillStyle = '#FFFFFF'; g.fillRect(x, y + 88, 128, 40); } },
  brow:    { i: 8, top: '#F08A30', bot: '#C25810' },
  paw:     { i: 9, top: '#FFFFFF', bot: '#E8DDD0' },
  mouth:   { i: 10, top: '#5A2E1A', bot: '#3E1E10' },
  armor:   { i: 11, top: '#FFE95C', bot: '#FFA60A', glow: true },
  gold:    { i: 12, top: '#FFF07A', bot: '#FFB812', glow: true },
  halo:    { i: 13, top: '#FFFBCB', bot: '#FFD23A', glow: true },
  purple:  { i: 14, top: '#9446E0', bot: '#55209F' },
  gem:     { i: 15, top: '#A955FF', bot: '#5E14B8' },
  feather: { i: 16, top: '#FFFFFF', bot: '#EDE6D6' },
  wingGold:{ i: 17, top: '#FFEE70', bot: '#FFB000', glow: true },
  horn:    { i: 18, top: '#FFE07A', bot: '#E6950E' },
};
const SW = PALETTE;

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const sub = (a, b) => a.clone().sub(b);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);

// flat feather blade lying in the plane with normal n, pointing along dir
function blade(base, dir, n, L, w, th = 0.016, shape = null) {
  const d = nrm(dir);
  const nn = nrm(add(n, d, -n.dot(d)));
  const v = nrm(cross(nn, d));
  const pts2 = shape || [[0, -0.3], [0, 0.3], [0.2, 0.5], [0.8, 0.5], [1, 0.05], [0.8, -0.5], [0.2, -0.5]];
  const pts = [];
  for (const [u, s] of pts2) {
    const p = add(add(base, d, u * L), v, s * w);
    const t = th * (u > 0.9 ? 0.6 : 1);
    pts.push(add(p, nn, t / 2), add(p, nn, -t / 2));
  }
  return hull(pts);
}

// closed faceted ring (torus) around the y axis, built from hull segments
function torus(c0, R, r, n = 14, tiltX = 0) {
  const parts = [];
  const q = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), tiltX);
  for (let k = 0; k < n; k++) {
    const pts = [];
    for (const a of [(2 * Math.PI * k) / n, (2 * Math.PI * (k + 1)) / n]) {
      const dir = V(Math.sin(a), 0, Math.cos(a));
      for (const [u, v] of [[-1, 0], [0, 1], [1, 0], [0, -1]]) {
        const p = dir.clone().multiplyScalar(R + u * r).add(V(0, v * r * 0.8, 0));
        pts.push(p.applyQuaternion(q).add(c0));
      }
    }
    parts.push(hull(pts));
  }
  return parts;
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const org = (pts, lo = 0.0, hi = 0.95) => paint(hull(pts), SW.orange, 'y', [lo, hi]);
  const wht = (g) => paint(g, SW.white, 'flat');
  const armor = (g) => paint(g, SW.armor, 'y');
  const armorF = (g) => paint(g, SW.armor, 'flat');
  const purple = (g) => paint(g, SW.purple, 'y');

  // ================= BODY =================
  C.push(org([
    ...ring(V(0, 0.35, -0.29), 0.09, 0.08, 10, 'z'),
    ...ring(V(0, 0.36, -0.23), 0.16, 0.155, 10, 'z'),
    ...ring(V(0, 0.37, -0.08), 0.18, 0.175, 10, 'z'),
    ...ring(V(0, 0.39, 0.08), 0.185, 0.18, 10, 'z'),
    ...ring(V(0, 0.42, 0.2), 0.165, 0.165, 10, 'z'),
    ...ring(V(0, 0.44, 0.26), 0.1, 0.1, 10, 'z'),
  ], 0.15, 0.6));
  // white belly
  C.push(paint(hull([...cbox(V(0, 0.26, 0.02), 0.12, 0.05, 0.2, 0.04)]), SW.white, 'y', [0.2, 0.32]));
  // neck
  C.push(org([...ring(V(0, 0.44, 0.15), 0.125, 0.12, 10, 'y'), ...ring(V(0, 0.62, 0.2), 0.13, 0.12, 10, 'y')], 0.3, 0.8));

  // ================= LEGS =================
  S.push(org([...ring(V(0.155, 0.06, 0.215), 0.07, 0.07, 8), ...ring(V(0.148, 0.2, 0.205), 0.078, 0.08, 8),
    ...ring(V(0.132, 0.33, 0.18), 0.092, 0.1, 8), ...ring(V(0.11, 0.42, 0.15), 0.07, 0.085, 8)], 0.0, 0.55));
  S.push(org([...ring(V(0.13, 0.43, -0.17), 0.07, 0.1, 8), ...ring(V(0.158, 0.32, -0.16), 0.1, 0.145, 8),
    ...ring(V(0.158, 0.2, -0.15), 0.08, 0.1, 8)], 0.0, 0.55));
  S.push(org([...ring(V(0.16, 0.22, -0.16), 0.074, 0.08, 8), ...ring(V(0.165, 0.13, -0.2), 0.07, 0.07, 8),
    ...ring(V(0.166, 0.06, -0.19), 0.068, 0.068, 8)], 0.0, 0.55));
  // white paws with toes
  const paw = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.042, z - 0.005), 0.074, 0.042, 0.066, 0.022)), SW.paw, 'y', [0, 0.09]));
    for (const dx of [-0.047, 0, 0.047])
      S.push(paint(hull(cbox(V(x + dx, 0.034, z + 0.062), 0.025, 0.034, 0.032, 0.012)), SW.paw, 'y', [0, 0.09]));
  };
  paw(0.158, 0.215);
  paw(0.166, -0.17);
  // glowing gold greaves (leg bands) just above the paws
  S.push(armor(hull([...ring(V(0.155, 0.1, 0.212), 0.083, 0.083, 8), ...ring(V(0.152, 0.16, 0.208), 0.087, 0.087, 8)])));
  S.push(armor(hull([...ring(V(0.165, 0.1, -0.192), 0.08, 0.08, 8), ...ring(V(0.166, 0.155, -0.198), 0.085, 0.085, 8)])));
  // purple gem studs on the greaves
  S.push(paint(hull(cbox(V(0.155, 0.13, 0.302), 0.018, 0.018, 0.008, 0.006)), SW.gem, 'flat'));

  // ================= ARMOUR: pauldrons, back plate, purple caparison =================
  // shoulder pauldrons: layered gold plates over the front-leg tops
  S.push(armor(hull([...ring(V(0.14, 0.5, 0.165), 0.06, 0.07, 6, 'y', 0), ...ring(V(0.175, 0.44, 0.175), 0.085, 0.1, 6, 'y', 0)])));
  S.push(armor(hull([...ring(V(0.185, 0.43, 0.178), 0.08, 0.104, 6, 'y', 0), ...ring(V(0.205, 0.38, 0.18), 0.07, 0.1, 6, 'y', 0)])));
  S.push(armor(hull([...ring(V(0.2, 0.37, 0.18), 0.062, 0.094, 6, 'y', 0), ...ring(V(0.21, 0.33, 0.182), 0.05, 0.085, 6, 'y', 0)])));
  S.push(paint(shard(V(0.19, 0.48, 0.17), V(0.5, 1, 0), 0.03, 0.06), SW.armor, 'flat'));
  S.push(paint(hull(cbox(V(0.283, 0.405, 0.18), 0.008, 0.02, 0.02, 0.008)), SW.gem, 'flat'));
  // purple caparison draped over the back, gold trim along its lower hem
  C.push(purple(hull([
    ...plate([[-0.19, 0.0], [0.19, 0.0], [0.15, 0.08], [-0.15, 0.08]], V(0, 0.47, 0), -0.16, 0.09),
    V(0.2, 0.36, 0.08), V(-0.2, 0.36, 0.08), V(0.2, 0.36, -0.15), V(-0.2, 0.36, -0.15),
    V(0.2, 0.3, 0.04), V(-0.2, 0.3, 0.04), V(0.2, 0.3, -0.11), V(-0.2, 0.3, -0.11),
  ])));
  S.push(armor(hull([V(0.185, 0.305, 0.05), V(0.21, 0.305, 0.05), V(0.185, 0.305, -0.12), V(0.21, 0.305, -0.12),
    V(0.185, 0.275, 0.04), V(0.207, 0.275, 0.04), V(0.185, 0.275, -0.11), V(0.207, 0.275, -0.11)])));
  // gold edging up the front and back of the drape
  for (const [z0, z1] of [[0.04, 0.08], [-0.11, -0.15]])
    S.push(armor(hull([V(0.19, 0.29, z0), V(0.212, 0.29, z0), V(0.19, 0.36, z1), V(0.212, 0.36, z1),
      V(0.17, 0.47, z1), V(0.19, 0.47, z1), V(0.19, 0.29, z0 * 0.7), V(0.19, 0.36, z1 * 0.82)])));
  // hem points hanging off the trim
  for (const z of [0.03, -0.035, -0.1])
    S.push(armorF(shard(V(0.195, 0.28, z), V(0.15, -1, 0), 0.024, 0.05)));
  // gold back plate (saddle armour) on top of the caparison with a purple gem
  C.push(armor(hull([
    ...plate([[-0.13, 0.0], [0.13, 0.0], [0.1, 0.05], [-0.1, 0.05]], V(0, 0.535, 0), -0.13, 0.07),
    V(0.15, 0.5, 0.0), V(-0.15, 0.5, 0.0), V(0.15, 0.5, -0.1), V(-0.15, 0.5, -0.1),
  ])));
  C.push(paint(hull(cbox(V(0, 0.592, -0.03), 0.03, 0.012, 0.03, 0.01)), SW.gem, 'flat'));

  // ================= CHEST: white ruff + gold breastplate =================
  C.push(paint(blob(1, V(0, 0.44, 0.255), V(0.14, 0.15, 0.09), { jitter: 0.18 }), SW.white, 'y', [0.26, 0.62]));
  C.push(wht(shard(V(0, 0.32, 0.27), V(0, -1, 0.35), 0.055, 0.11)));
  for (const [b, d, w, l] of [
    [V(0.055, 0.32, 0.27), V(0.25, -1, 0.35), 0.05, 0.1],
    [V(0.105, 0.35, 0.25), V(0.6, -1, 0.3), 0.05, 0.09],
    [V(0.135, 0.42, 0.26), V(0.9, -0.7, 0.6), 0.045, 0.065],
  ]) S.push(wht(shard(b, d, w, l)));
  // breastplate: faceted gold shield on the chest
  C.push(armor(hull([
    V(0, 0.52, 0.34), V(0.1, 0.5, 0.315), V(-0.1, 0.5, 0.315), V(0.11, 0.42, 0.315), V(-0.11, 0.42, 0.315),
    V(0, 0.34, 0.33), V(0.06, 0.37, 0.32),  V(-0.06, 0.37, 0.32),
    V(0, 0.5, 0.29), V(0.09, 0.48, 0.27), V(-0.09, 0.48, 0.27), V(0, 0.36, 0.28), V(0.1, 0.42, 0.27), V(-0.1, 0.42, 0.27),
  ])));
  // purple gem in the centre of the breastplate
  C.push(paint(hull([V(0, 0.475, 0.345), V(0.03, 0.445, 0.34), V(-0.03, 0.445, 0.34), V(0, 0.405, 0.34),
    V(0, 0.445, 0.36), V(0, 0.47, 0.33), V(0, 0.41, 0.33)]), SW.gem, 'flat'));
  // royal purple collar with gold trim rings
  C.push(purple(hull([...ring(V(0, 0.55, 0.205), 0.15, 0.14, 12, 'y', 0), ...ring(V(0, 0.62, 0.225), 0.145, 0.135, 12, 'y', 0)])));
  C.push(armor(hull([...ring(V(0, 0.535, 0.2), 0.155, 0.145, 12, 'y', 0), ...ring(V(0, 0.555, 0.205), 0.158, 0.148, 12, 'y', 0)])));
  C.push(armor(hull([...ring(V(0, 0.615, 0.225), 0.15, 0.14, 12, 'y', 0), ...ring(V(0, 0.635, 0.23), 0.148, 0.138, 12, 'y', 0)])));

  // ================= HEAD =================
  const hc0 = C.length, hs0 = S.length;
  const H = { y: 0.74, z: 0.22 };
  C.push(org([
    ...cbox(V(0, H.y, H.z), 0.2, 0.155, 0.165, 0.065),
    ...ring(V(0, H.y + 0.175, H.z), 0.12, 0.1, 8, 'y'),
    V(0.215, H.y - 0.075, H.z + 0.06), V(-0.215, H.y - 0.075, H.z + 0.06),
  ], 0.55, 0.95));
  const FZ = H.z + 0.165;

  // white forehead blaze
  C.push(paint(hull([V(0, H.y + 0.16, FZ - 0.07), V(0.035, H.y + 0.14, FZ - 0.05), V(-0.035, H.y + 0.14, FZ - 0.05),
    V(0.03, H.y + 0.02, FZ + 0.006), V(-0.03, H.y + 0.02, FZ + 0.006), V(0, H.y - 0.01, FZ + 0.01),
    V(0, H.y + 0.15, FZ - 0.09), V(0, H.y + 0.04, FZ - 0.03)]), SW.white, 'flat'));
  // cheek fluff (white)
  S.push(wht(shard(V(0.19, H.y - 0.07, H.z + 0.06), V(1, -0.6, 0.2), 0.045, 0.075)));
  S.push(wht(shard(V(0.18, H.y - 0.11, H.z - 0.02), V(0.8, -0.9, -0.2), 0.04, 0.07)));

  // muzzle, jaw, nose, mouth
  C.push(paint(hull([...cbox(V(0, H.y - 0.075, FZ + 0.035), 0.105, 0.062, 0.075, 0.03),
    V(0.07, H.y - 0.01, FZ - 0.03), V(-0.07, H.y - 0.01, FZ - 0.03)]), SW.muzzle, 'y', [H.y - 0.14, H.y]));
  C.push(paint(hull(cbox(V(0, H.y - 0.135, FZ + 0.0), 0.08, 0.03, 0.07, 0.015)), SW.white, 'flat'));
  C.push(paint(hull([...cbox(V(0, H.y - 0.035, FZ + 0.108), 0.045, 0.022, 0.02, 0.01),
    V(0, H.y - 0.07, FZ + 0.1), V(0.02, H.y - 0.062, FZ + 0.1), V(-0.02, H.y - 0.062, FZ + 0.1)]), SW.nose, 'y'));
  C.push(paint(hull(cbox(V(0, H.y - 0.09, FZ + 0.105), 0.006, 0.022, 0.006, 0.002)), SW.mouth, 'flat'));
  S.push(paint(hull([V(0, H.y - 0.112, FZ + 0.11), V(0, H.y - 0.1, FZ + 0.11), V(0.055, H.y - 0.122, FZ + 0.098),
    V(0.055, H.y - 0.112, FZ + 0.098), V(0, H.y - 0.112, FZ + 0.1), V(0.055, H.y - 0.118, FZ + 0.085)]), SW.mouth, 'flat'));

  // fierce eyes
  const E = V(0.088, H.y + 0.03, 0);
  S.push(paint(hull(plate([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]],
    E, FZ - 0.01, FZ + 0.012)), SW.eyeW, 'flat'));
  S.push(paint(hull(plate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]],
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.014, FZ + 0.021)), SW.eyeW, 'flat'));
  // heavy brow
  S.push(paint(hull([
    V(0.028, E.y + 0.012, FZ + 0.03), V(0.03, E.y + 0.05, FZ + 0.02),
    V(0.15, E.y + 0.05, FZ - 0.01), V(0.15, E.y + 0.088, FZ - 0.025),
    V(0.028, E.y + 0.012, FZ - 0.03), V(0.03, E.y + 0.06, FZ - 0.04),
    V(0.15, E.y + 0.05, FZ - 0.06), V(0.15, E.y + 0.09, FZ - 0.07),
  ]), SW.brow, 'y'));

  // floppy ears, set low on the sides so horns and crown read clearly on top
  S.push(paint(tube(curveSamples(
    [V(0.16, H.y + 0.12, H.z - 0.03), V(0.225, H.y + 0.12, H.z - 0.02), V(0.265, H.y + 0.04, H.z - 0.005),
      V(0.275, H.y - 0.06, H.z + 0.01), V(0.26, H.y - 0.15, H.z + 0.02)],
    8, (t) => 0.065 + 0.04 * Math.sin(Math.PI * Math.min(1, t * 1.05)), (t) => 0.04 - 0.012 * t),
    { seg: 6, axis: V(0.35, 0, 1), capStart: 0.0, capEnd: 0.055, phase: Math.PI / 6 }), SW.ear, 'len'));

  // small golden goat horns: from the top of the skull, curving up, back and down
  S.push(paint(tube(curveSamples(
    [V(0.105, H.y + 0.13, H.z - 0.05), V(0.14, H.y + 0.205, H.z - 0.07), V(0.18, H.y + 0.24, H.z - 0.13),
      V(0.21, H.y + 0.215, H.z - 0.19), V(0.22, H.y + 0.165, H.z - 0.21)],
    8, (t) => 0.036 * (1 - 0.82 * t)), { seg: 6, ref: V(1, 0, 0), capEnd: 0.012, scale: (i) => (i % 2 ? 1.12 : 0.94) }), SW.horn, 'len'));

  // crown: gold band with purple base, 5 points, gems
  const CY = H.y + 0.165, CZ = H.z + 0.04;
  C.push(purple(hull([...ring(V(0, CY - 0.01, CZ), 0.085, 0.075, 10, 'y'), ...ring(V(0, CY + 0.02, CZ), 0.088, 0.078, 10, 'y')])));
  C.push(paint(hull([...ring(V(0, CY + 0.015, CZ), 0.095, 0.085, 10, 'y'), ...ring(V(0, CY + 0.06, CZ), 0.1, 0.09, 10, 'y')]), SW.gold, 'y'));
  C.push(paint(shard(V(0, CY + 0.05, CZ + 0.08), V(0, 1, 0.1), 0.032, 0.09), SW.gold, 'flat'));
  S.push(paint(shard(V(0.065, CY + 0.05, CZ + 0.055), V(0.25, 1, 0.1), 0.028, 0.075), SW.gold, 'flat'));
  S.push(paint(shard(V(0.09, CY + 0.05, CZ - 0.02), V(0.3, 1, -0.1), 0.026, 0.065), SW.gold, 'flat'));
  C.push(paint(shard(V(0, CY + 0.05, CZ - 0.08), V(0, 1, -0.1), 0.026, 0.065), SW.gold, 'flat'));
  C.push(paint(hull(cbox(V(0, CY + 0.037, CZ + 0.095), 0.02, 0.018, 0.008, 0.006)), SW.gem, 'flat'));
  S.push(paint(hull([V(0.066, CY + 0.055, CZ + 0.072), V(0.082, CY + 0.04, CZ + 0.064), V(0.066, CY + 0.022, CZ + 0.072),
    V(0.05, CY + 0.04, CZ + 0.08), V(0.07, CY + 0.04, CZ + 0.06)]), SW.gem, 'flat'));

  // scale the head group up about the neck for the big-head look
  const HS = 1.12, piv = V(0, 0.6, 0.25);
  for (const g of [...C.slice(hc0), ...S.slice(hs0)]) {
    g.translate(-piv.x, -piv.y, -piv.z); g.scale(HS, HS, HS); g.translate(piv.x, piv.y, piv.z);
  }

  // ================= HALO (floating, glowing gold) =================
  const HY = piv.y + (CY + 0.2 - piv.y) * HS;
  for (const g of torus(V(0, HY, H.z - 0.01), 0.15, 0.022, 14, -0.22)) C.push(paint(g, SW.halo, 'y'));

  // ================= WINGS (little, radiant: white flight feathers, gold leading edge + gold shard coverts) =================
  const SHd = V(0.12, 0.56, -0.02), WR = V(0.34, 0.85, -0.08), TP = V(0.52, 1.0, -0.24);
  const armDir = nrm(sub(WR, SHd));
  const wingN = (dir) => { const n = nrm(cross(armDir, dir)); if (n.x < 0) n.multiplyScalar(-1); return n; };
  const edgePts = [SHd, add(SHd, sub(WR, SHd), 0.5), WR, add(WR, V(0.06, 0.06, -0.08), 1), TP];
  S.push(paint(tube(curveSamples(edgePts, 8, (t) => 0.036 - 0.018 * t, (t) => 0.028 - 0.012 * t),
    { seg: 6, ref: V(1, 0, 0.2), capEnd: 0.035, capStart: 0.01 }), SW.wingGold, 'len'));
  const featherShape = [[0, -0.3], [0, 0.3], [0.25, 0.5], [0.7, 0.45], [1, 0], [0.7, -0.45], [0.25, -0.5]];
  // secondaries: wide fan along the arm, low ones droop back-down, upper ones sweep back
  const NF = 6;
  for (let i = 0; i < NF; i++) {
    const t = 0.12 + 0.88 * i / (NF - 1);
    const p = add(SHd, sub(WR, SHd), t);
    const ang = -0.75 + 1.25 * t;
    const dir = nrm(V(0.45, Math.sin(ang), -Math.cos(ang)));
    const n = wingN(dir);
    const L = 0.2 + 0.26 * t;
    S.push(paint(blade(add(p, n, -0.012 + (NF - i) * 0.004), dir, n, L, 0.105, 0.016, featherShape), SW.feather, 'flat'));
  }
  // primaries off the hand, fanning from back to up-back
  for (let i = 0; i < 4; i++) {
    const p = add(WR, sub(TP, WR), 0.1 + i * 0.3);
    const ang = 0.45 + 0.25 * i;
    const dir = nrm(V(0.45, Math.sin(ang), -Math.cos(ang)));
    const n = wingN(V(0.4, 1, -1));
    S.push(paint(blade(add(p, n, -0.018 - i * 0.004), dir, n, 0.29 - i * 0.035, 0.1, 0.016, featherShape), SW.feather, 'flat'));
  }
  // gold coverts: two layered rows of pointed shards fanned off the leading edge
  const edge = new THREE.CatmullRomCurve3(edgePts, false, 'centripetal');
  const coverShape = [[0, -0.35], [0, 0.35], [0.3, 0.5], [1, 0], [0.3, -0.5]];
  for (const [row, NC, Lc, off] of [[0, 7, 0.17, 0.03], [1, 5, 0.1, 0.05]]) {
    for (let i = 0; i < NC; i++) {
      const t = 0.12 + 0.8 * i / (NC - 1) + row * 0.04;
      const p = edge.getPoint(t);
      const ang = -0.6 + 1.2 * t;
      const dir = nrm(V(0.4, Math.sin(ang), -Math.cos(ang)));
      const n = wingN(dir);
      S.push(paint(blade(add(p, n, off + i * 0.003), dir, n, Lc + 0.05 * t, 0.075, 0.014, coverShape), SW.wingGold, 'flat'));
    }
  }

  // ================= TAIL (upward shard curl, white tip, gold band at the base) =================
  const tailPts = [V(0, 0.42, -0.27), V(0, 0.54, -0.42), V(0, 0.7, -0.53), V(0, 0.84, -0.56), V(0, 0.95, -0.52)];
  const tc = new THREE.CatmullRomCurve3(tailPts, false, 'centripetal');
  C.push(paint(tube(curveSamples(tailPts, 9, (t) => 0.065 + 0.025 * Math.sin(Math.PI * t) - 0.035 * t * t),
    { seg: 7, axis: X, capEnd: 0.03 }), SW.tail, 'len'));
  const curlC = V(0, 0.68, -0.4);
  for (let k = 0; k < 6; k++) {
    const t = 0.18 + 0.13 * k;
    const p = tc.getPoint(t);
    const out = nrm(sub(p, curlC));
    const sw = t > 0.7 ? SW.white : SW.orange;
    C.push(paint(shard(add(p, out, 0.04), nrm(add(out, tc.getTangent(t), -0.4)), 0.068, 0.11 - 0.005 * k), sw, 'flat'));
    S.push(paint(shard(add(add(p, out, 0.01), X, 0.045), nrm(add(add(out, X, 0.9), tc.getTangent(t), -0.4)), 0.06, 0.095 - 0.005 * k), sw, 'flat'));
  }
  // white tip tuft
  const tipP = tc.getPoint(1), tipT = nrm(tc.getTangent(1));
  C.push(paint(shard(tipP, tipT, 0.055, 0.1), SW.white, 'flat'));
  C.push(paint(shard(add(tipP, tipT, -0.02), nrm(add(tipT, V(0, 1, 0), 0.8)), 0.04, 0.08), SW.white, 'flat'));
  S.push(paint(shard(add(add(tipP, tipT, -0.03), X, 0.02), nrm(add(tipT, X, 0.8)), 0.035, 0.075), SW.white, 'flat'));
  // gold band at the tail base
  C.push(armor(hull([...ring(tc.getPoint(0.1), 0.075, 0.075, 8, 'y'), ...ring(add(tc.getPoint(0.1), nrm(tc.getTangent(0.1)), 0.04), 0.072, 0.072, 8, 'y')])));

  // gold trim along the drape's rear edge
  C.push(armor(hull([V(0.195, 0.47, -0.155), V(-0.195, 0.47, -0.155), V(0.155, 0.555, -0.135), V(-0.155, 0.555, -0.135),
    V(0.195, 0.47, -0.18), V(-0.195, 0.47, -0.18), V(0.155, 0.555, -0.16), V(-0.155, 0.555, -0.16)])));

  return assemble(C, S);
}

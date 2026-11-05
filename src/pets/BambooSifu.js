// Bamboo Sifu (Godly): stout old white panda kung-fu master in jade robes, long shard beard,
// horizontal bamboo staff held in both paws, gold armour, cherry blossoms, silk ribbons, glowing runes.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  fur:    { i: 0, top: '#FFFFFF', bot: '#F2F3F6' },
  dark:   { i: 1, top: '#45434E', bot: '#1E1D24' },
  jade:   { i: 2, top: '#3FD08E', bot: '#13895A' },
  jadeDk: { i: 3, top: '#1FA06C', bot: '#0D6142' },
  eye:    { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  gold:   { i: 6, top: '#FFE27A', bot: '#D9961C' },
  silk:   { i: 7, top: '#FFB8D2', bot: '#EE6596' },
  petal:  { i: 8, top: '#FFE3EE', bot: '#FF94BD' },
  rune:   { i: 9, top: '#B8FFF8', bot: '#2EDCFF', glow: true },
  bamboo: { i: 10, top: '#B6E05A', bot: '#5FA82E' },
  node:   { i: 11, top: '#E3F59A', bot: '#9CCB4A' },
  leaf:   { i: 12, top: '#7EDB4E', bot: '#2E9A3A' },
  brow:   { i: 13, top: '#F6F7FA', bot: '#C9CDD6' },
  nose:   { i: 14, top: '#3A3438', bot: '#141114' },
  mouth:  { i: 15, top: '#5A2E3A', bot: '#3A1A22' },
  gem:    { i: 16, top: '#9DFFD0', bot: '#22C487', glow: true },
  pistil: { i: 17, top: '#FFF2A0', bot: '#F2B83A' },
};
const SW = PALETTE;

// ring of n points around centre c perpendicular to dir
function ringDir(c, dir, rA, rB, n, phase = Math.PI / n) {
  const d = dir.clone().normalize();
  const up = Math.abs(d.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
  const a = new THREE.Vector3().crossVectors(d, up).normalize();
  const b = new THREE.Vector3().crossVectors(a, d).normalize();
  const pts = [];
  for (let k = 0; k < n; k++) {
    const t = phase + (2 * Math.PI * k) / n;
    pts.push(c.clone().addScaledVector(a, Math.cos(t) * rA).addScaledVector(b, Math.sin(t) * rB));
  }
  return pts;
}

// thin bar between 2D points (u,v) on a surface z = zAt(v) (+ off), thickness th, half-width w
function bar(p0, p1, w, zAt, off = 0.004, th = 0.008, sign = 1) {
  const [u0, v0] = p0, [u1, v1] = p1;
  const dx = u1 - u0, dy = v1 - v0, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L * w, ny = dx / L * w;
  const pts = [];
  for (const [u, v] of [[u0 + nx, v0 + ny], [u0 - nx, v0 - ny], [u1 + nx, v1 + ny], [u1 - nx, v1 - ny]]) {
    const z = zAt(v);
    pts.push(V(u, v, sign * (z + off)), V(u, v, sign * (z - th)));
  }
  return hull(pts);
}

// five-petal cherry blossom facing along n
function blossom(out, c, n, r) {
  const d = n.clone().normalize();
  const up = Math.abs(d.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
  const a = new THREE.Vector3().crossVectors(d, up).normalize();
  const b = new THREE.Vector3().crossVectors(a, d).normalize();
  for (let k = 0; k < 5; k++) {
    const t = Math.PI / 2 + (2 * Math.PI * k) / 5;
    const dir = a.clone().multiplyScalar(Math.cos(t)).addScaledVector(b, Math.sin(t));
    const side = a.clone().multiplyScalar(Math.cos(t + Math.PI / 2)).addScaledVector(b, Math.sin(t + Math.PI / 2));
    const pts = [];
    for (const h of [-0.006, 0.006]) {
      const o = c.clone().addScaledVector(d, h + 0.004);
      pts.push(o.clone().addScaledVector(dir, r * 0.15),
        o.clone().addScaledVector(dir, r * 0.7).addScaledVector(side, r * 0.42),
        o.clone().addScaledVector(dir, r * 0.7).addScaledVector(side, -r * 0.42),
        o.clone().addScaledVector(dir, r * 1.05).addScaledVector(side, r * 0.18),
        o.clone().addScaledVector(dir, r * 1.05).addScaledVector(side, -r * 0.18));
    }
    out.push(paint(hull(pts), SW.petal, 'flat'));
  }
  out.push(paint(hull(ringDir(c.clone().addScaledVector(d, 0.01), d, r * 0.28, r * 0.28, 5)
    .concat([c.clone().addScaledVector(d, 0.022)])), SW.pistil, 'flat'));
}

export function buildGeometry() {
  const C = [], S = [];
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= FEET + LEGS (black panda paws peeking under the robe) =================
  S.push(paint(hull([...ring(V(0.11, 0.05, 0.05), 0.065, 0.065, 8), ...ring(V(0.11, 0.16, 0.03), 0.07, 0.07, 8)]), SW.dark, 'y', [0, 0.2]));
  S.push(paint(hull([...cbox(V(0.115, 0.04, 0.1), 0.075, 0.04, 0.095, 0.025)]), SW.dark, 'y', [0, 0.12]));
  for (const dx of [-0.045, 0, 0.045])
    S.push(paint(hull(cbox(V(0.115 + dx, 0.03, 0.19), 0.023, 0.03, 0.03, 0.01)), SW.dark, 'y', [0, 0.12]));
  for (const dx of [-0.045, 0, 0.045])
    S.push(flat(shard(V(0.115 + dx, 0.012, 0.215), V(0, -0.2, 1), 0.012, 0.03), SW.brow));

  // ================= ROBE (jade, flared skirt) =================
  const RB = [[0.085, 0.25, 0.215], [0.46, 0.23, 0.175], [0.575, 0.18, 0.125]]; // [y, rA, rB]
  C.push(paint(hull(RB.flatMap(([y, a, b]) => ring(V(0, y, 0), a, b, 8, 'y'))), SW.jade, 'y', [0.05, 0.6]));
  const rBat = (y) => {
    if (y <= RB[0][0]) return RB[0][2];
    for (let k = 0; k < RB.length - 1; k++) if (y <= RB[k + 1][0])
      return RB[k][2] + (RB[k + 1][2] - RB[k][2]) * (y - RB[k][0]) / (RB[k + 1][0] - RB[k][0]);
    return RB[RB.length - 1][2];
  };
  const zF = (y) => 0.924 * rBat(y); // front (and back) facet plane
  // gold hem band
  C.push(flat(hull([...ring(V(0, 0.08, 0), 0.258, 0.222, 8, 'y'), ...ring(V(0, 0.13, 0), 0.253, 0.217, 8, 'y')]), SW.gold));
  // pink silk sash with gold edges
  C.push(paint(hull([...ring(V(0, 0.31, 0), 0.236, 0.196, 8, 'y'), ...ring(V(0, 0.375, 0), 0.232, 0.191, 8, 'y')]), SW.silk, 'y', [0.3, 0.38]));
  for (const y of [0.305, 0.38])
    C.push(flat(hull([...ring(V(0, y - 0.008, 0), 0.24, 0.2, 8, 'y'), ...ring(V(0, y + 0.008, 0), 0.24, 0.2, 8, 'y')]), SW.gold));
  // front apron panel (dark jade, gold border, runes)
  const apZ = (y) => zF(y) + 0.012;
  C.push(paint(hull([
    V(-0.075, 0.3, zF(0.3) - 0.01), V(0.075, 0.3, zF(0.3) - 0.01), V(-0.085, 0.1, zF(0.1) - 0.01), V(0.085, 0.1, zF(0.1) - 0.01),
    V(-0.075, 0.3, apZ(0.3)), V(0.075, 0.3, apZ(0.3)), V(-0.085, 0.1, apZ(0.1)), V(0.085, 0.1, apZ(0.1)),
  ]), SW.jadeDk, 'y', [0.1, 0.3]));
  // apron gold border (sides)
  S.push(flat(bar([0.078, 0.3], [0.088, 0.1], 0.008, (v) => apZ(v), 0.006, 0.02), SW.gold));
  // apron runes (glowing glyphs)
  const runeAp = (v) => apZ(v);
  const glyphs = [
    // diamond outline + inner cross, with bars above and below
    [[0, 0.255], [0.045, 0.205]], [[0.045, 0.205], [0, 0.155]], [[0, 0.155], [-0.045, 0.205]], [[-0.045, 0.205], [0, 0.255]],
    [[0, 0.232], [0, 0.178]], [[-0.022, 0.205], [0.022, 0.205]],
    [[-0.05, 0.28], [0.05, 0.28]], [[-0.055, 0.13], [0.055, 0.13]],
  ];
  for (const [a, b] of glyphs) C.push(flat(bar(a, b, 0.006, runeAp, 0.005, 0.01), SW.rune));
  // belt buckle: gold disc with jade gem (front)
  const bz = zF(0.345) + 0.02;
  C.push(flat(hull(ringDir(V(0, 0.345, bz - 0.01), V(0, 0, 1), 0.045, 0.045, 8).concat(ringDir(V(0, 0.345, bz + 0.012), V(0, 0, 1), 0.04, 0.04, 8))), SW.gold));
  C.push(flat(hull(ringDir(V(0, 0.345, bz + 0.012), V(0, 0, 1), 0.024, 0.024, 6).concat([V(0, 0.345, bz + 0.026)])), SW.gem));

  // back sash knot + flowing silk ribbon tails
  const kz = -zF(0.345) - 0.02;
  C.push(paint(hull([...cbox(V(0, 0.345, kz), 0.05, 0.04, 0.025, 0.014)]), SW.silk, 'y', [0.3, 0.39]));
  S.push(paint(hull([V(0.03, 0.345, kz), V(0.11, 0.39, kz - 0.01), V(0.11, 0.31, kz - 0.01), V(0.03, 0.345, kz - 0.02),
    V(0.11, 0.39, kz + 0.01), V(0.11, 0.31, kz + 0.01)]), SW.silk, 'y', [0.3, 0.4]));
  S.push(paint(tube(curveSamples([V(0.03, 0.33, kz), V(0.05, 0.25, -zF(0.25) - 0.03), V(0.075, 0.16, -zF(0.16) - 0.04),
    V(0.1, 0.07, -zF(0.07) - 0.05)], 6, (t) => 0.028 + 0.008 * t, () => 0.006),
    { seg: 4, axis: V(0, 0, 1), phase: Math.PI / 4 }), SW.silk, 'len'));

  // back rune circle
  {
    const bk = (v) => zF(v);
    const cy = 0.47, R = 0.055, n = 8;
    for (let k = 0; k < n; k++) {
      const a0 = (2 * Math.PI * k) / n, a1 = (2 * Math.PI * (k + 1)) / n;
      C.push(flat(bar([Math.cos(a0) * R, cy + Math.sin(a0) * R], [Math.cos(a1) * R, cy + Math.sin(a1) * R], 0.006, bk, 0.005, 0.012, -1), SW.rune));
    }
    C.push(flat(bar([0, cy + 0.035], [0, cy - 0.035], 0.006, bk, 0.005, 0.012, -1), SW.rune));
    C.push(flat(bar([-0.03, cy], [0.03, cy], 0.006, bk, 0.005, 0.012, -1), SW.rune));
    for (const y of [0.2, 0.25]) C.push(flat(bar([-0.04, y], [0.04, y], 0.005, bk, 0.005, 0.012, -1), SW.rune));
  }

  // cherry blossoms + loose petals on the skirt's front-side facets
  blossom(S, V(0.158, 0.19, 0.134), V(0.65, 0.08, 0.76), 0.04);
  for (const [x, y, z, r] of [[0.19, 0.27, 0.112, 0.6], [0.125, 0.13, 0.166, -0.4]]) {
    const c = V(x, y, z), n = V(0.65, 0.08, 0.76).normalize(), t = V(Math.cos(r), Math.sin(r), 0).sub(n.clone().multiplyScalar(Math.cos(r) * n.x)).normalize();
    const b = new THREE.Vector3().crossVectors(n, t);
    const pts = [];
    for (const h of [-0.004, 0.006]) { const o = c.clone().addScaledVector(n, h);
      pts.push(o.clone().addScaledVector(t, 0.022), o.clone().addScaledVector(t, -0.018), o.clone().addScaledVector(b, 0.012), o.clone().addScaledVector(b, -0.012)); }
    S.push(flat(hull(pts), SW.petal));
  }

  // ================= GOLD COLLAR TRIM (V crossover on the chest) =================
  S.push(flat(bar([0.1, 0.57], [0.0, 0.39], 0.012, (v) => zF(v) + (v > 0.46 ? -0.02 * (v - 0.46) / 0.115 : 0), 0.006, 0.02), SW.gold));

  // ================= ARMS: jade bell sleeves, gold pauldrons + bracers, black paws on staff =================
  const SH = V(0.23, 0.5, 0.0), EL = V(0.27, 0.42, 0.09), CU = V(0.2, 0.41, 0.19), HA = V(0.12, 0.4, 0.265);
  S.push(paint(hull([...ringDir(SH, V(0.3, -0.6, 0.4), 0.075, 0.075, 8), ...ringDir(EL, V(0, -0.3, 1), 0.07, 0.07, 8)]), SW.jade, 'y', [0.3, 0.6]));
  S.push(paint(hull([...ringDir(EL, V(-0.5, 0, 1), 0.07, 0.07, 8), ...ringDir(CU, V(-0.6, 0, 1), 0.085, 0.08, 8)]), SW.jade, 'y', [0.3, 0.6]));
  // gold cuff band just behind the sleeve opening, dark sleeve interior on the end face
  S.push(flat(hull([...ringDir(CU.clone().add(V(0.02, 0, -0.034)), V(-0.6, 0, 1), 0.088, 0.083, 8), ...ringDir(CU.clone().add(V(0.006, 0, -0.01)), V(-0.6, 0, 1), 0.091, 0.086, 8)]), SW.gold));
  S.push(flat(hull([...ringDir(CU.clone().add(V(-0.002, 0, 0.003)), V(-0.6, 0, 1), 0.066, 0.062, 8), ...ringDir(CU.clone().add(V(0.004, 0, -0.006)), V(-0.6, 0, 1), 0.066, 0.062, 8)]), SW.dark));
  // drooping bell-sleeve flap under the forearm
  S.push(paint(hull([...ringDir(CU.clone().add(V(0.02, 0, -0.04)), V(-0.6, 0, 1), 0.08, 0.075, 8),
    CU.clone().add(V(0.0, -0.14, -0.02)), CU.clone().add(V(0.05, -0.13, -0.06)), CU.clone().add(V(-0.04, -0.12, 0.0))]), SW.jade, 'y', [0.22, 0.5]));
  S.push(flat(hull([CU.clone().add(V(0.0, -0.14, -0.02)), CU.clone().add(V(0.05, -0.13, -0.06)), CU.clone().add(V(-0.04, -0.12, 0.0)),
    CU.clone().add(V(0.0, -0.155, -0.02)), CU.clone().add(V(0.055, -0.145, -0.065)), CU.clone().add(V(-0.045, -0.135, 0.002))]), SW.gold));
  // forearm + paw (black)
  S.push(paint(hull([...ringDir(CU, V(-0.6, 0, 1), 0.05, 0.05, 6), ...cbox(HA, 0.042, 0.048, 0.045, 0.018)]), SW.dark, 'y', [0.33, 0.47]));
  // pauldron: domed gold cap + two stepped lames, jade gem, rune line, flared spike
  const PD = V(0.45, 1, 0);
  S.push(paint(hull([...ringDir(V(0.275, 0.6, 0.0), PD, 0.06, 0.07, 8), ...ringDir(V(0.255, 0.565, 0.0), PD, 0.115, 0.125, 8)]), SW.gold, 'y', [0.5, 0.64]));
  for (const [dy, dx, s] of [[-0.045, 0.025, 0.95], [-0.085, 0.045, 0.85]]) {
    const c = V(0.265 + dx, 0.555 + dy, 0.0);
    S.push(paint(hull([...ringDir(c, PD, 0.1 * s, 0.115 * s, 8), ...ringDir(c.clone().add(V(0.015, -0.03, 0)), PD, 0.115 * s, 0.13 * s, 8)]), SW.gold, 'y', [0.38, 0.6]));
  }
  S.push(flat(hull(ringDir(V(0.282, 0.607, 0.0), PD, 0.03, 0.03, 6).concat([V(0.295, 0.632, 0.0)])), SW.gem));
  S.push(flat(shard(V(0.33, 0.55, 0.0), V(1, 0.7, 0), 0.035, 0.08), SW.gold));
  // jade bead mala around the collar
  for (let k = 0; k < 5; k++) {
    const a = 0.25 + k * 0.32;
    const c = V(Math.sin(a) * 0.15, 0.575 - 0.02 * Math.cos(a), Math.cos(a) * 0.125);
    S.push(flat(hull(ringDir(c, V(0, 1, 0), 0.022, 0.022, 6).concat([c.clone().add(V(0, 0.024, 0)), c.clone().add(V(0, -0.024, 0))])), SW.gem));
  }
  blossom(S, V(0.25, 0.585, 0.09), V(0.2, 0.5, 1), 0.035);

  // ================= BAMBOO STAFF (horizontal, both paws) =================
  const SY = 0.4, SZ = 0.265, SL = 0.44, SR = 0.024;
  C.push(paint(tube([{ p: V(-SL, SY, SZ), rx: SR, ry: SR }, { p: V(SL, SY, SZ), rx: SR, ry: SR }],
    { seg: 6, axis: V(0, 0, 1), capStart: 0.006, capEnd: 0.006, phase: Math.PI / 6 }), SW.bamboo, 'y', [SY - SR, SY + SR]));
  for (const x of [0.04, 0.2, 0.33]) S.push(paint(hull([...ringDir(V(x - 0.01, SY, SZ), V(1, 0, 0), SR * 1.25, SR * 1.25, 6, Math.PI / 6),
    ...ringDir(V(x + 0.01, SY, SZ), V(1, 0, 0), SR * 1.25, SR * 1.25, 6, Math.PI / 6)]), SW.node, 'y', [SY - SR, SY + SR]));
  // gold end caps
  S.push(flat(hull([...ringDir(V(SL - 0.03, SY, SZ), V(1, 0, 0), SR * 1.3, SR * 1.3, 6, Math.PI / 6), ...ringDir(V(SL + 0.012, SY, SZ), V(1, 0, 0), SR * 1.15, SR * 1.15, 6, Math.PI / 6)]), SW.gold));
  // leaves sprouting from the outer node
  S.push(flat(hull([V(0.33, SY + 0.02, SZ), V(0.36, SY + 0.07, SZ + 0.02), V(0.34, SY + 0.11, SZ + 0.035), V(0.4, SY + 0.12, SZ + 0.04),
    V(0.335, SY + 0.02, SZ + 0.008), V(0.355, SY + 0.07, SZ + 0.03)]), SW.leaf));
  S.push(flat(hull([V(0.33, SY + 0.02, SZ - 0.01), V(0.28, SY + 0.07, SZ - 0.03), V(0.27, SY + 0.11, SZ - 0.04), V(0.24, SY + 0.09, SZ - 0.04),
    V(0.33, SY + 0.02, SZ - 0.02)]), SW.leaf));
  // silk ribbon tied near each end, hanging down
  S.push(paint(hull([...ringDir(V(0.27, SY, SZ), V(1, 0, 0), SR * 1.2, SR * 1.2, 6, Math.PI / 6), ...ringDir(V(0.29, SY, SZ), V(1, 0, 0), SR * 1.2, SR * 1.2, 6, Math.PI / 6)]), SW.silk, 'flat'));
  S.push(paint(tube(curveSamples([V(0.28, SY - 0.02, SZ + 0.01), V(0.285, SY - 0.09, SZ + 0.03), V(0.3, SY - 0.17, SZ + 0.02)], 5,
    (t) => 0.018 + 0.006 * t, () => 0.005), { seg: 4, axis: V(0, 0, 1), phase: Math.PI / 4 }), SW.silk, 'len'));
  blossom(S, V(0.36, SY + 0.03, SZ + 0.02), V(0.2, 0.5, 1), 0.03);

  // ================= HEAD =================
  const c0 = C.length, s0 = S.length;
  const H = { y: 0.75, z: 0.03 };
  C.push(paint(hull([
    ...cbox(V(0, H.y, H.z), 0.19, 0.145, 0.16, 0.07),
    ...ring(V(0, H.y - 0.02, H.z), 0.205, 0.17, 8, 'y'),
    ...ring(V(0, H.y + 0.165, H.z - 0.01), 0.14, 0.115, 8, 'y'),
    V(0.205, H.y - 0.06, H.z + 0.05), V(-0.205, H.y - 0.06, H.z + 0.05),
  ]), SW.fur, 'y', [0.52, 0.92]));
  const FZ = H.z + 0.16;
  // ears (black, rounded)
  S.push(paint(hull([...ringDir(V(0.15, H.y + 0.15, H.z - 0.02), V(0.5, 0.2, 0.25), 0.07, 0.065, 8),
    ...ringDir(V(0.17, H.y + 0.17, H.z - 0.01), V(0.5, 0.2, 0.25), 0.055, 0.05, 8)]), SW.dark, 'y', [0.8, 1.0]));
  // muzzle, nose, mouth
  C.push(paint(hull([...cbox(V(0, H.y - 0.07, FZ + 0.03), 0.09, 0.055, 0.06, 0.025),
    V(0.06, H.y - 0.01, FZ - 0.02), V(-0.06, H.y - 0.01, FZ - 0.02)]), SW.fur, 'y', [0.6, 0.75]));
  C.push(paint(hull([...cbox(V(0, H.y - 0.035, FZ + 0.093), 0.04, 0.02, 0.015, 0.008),
    V(0, H.y - 0.065, FZ + 0.085), V(0.02, H.y - 0.058, FZ + 0.085), V(-0.02, H.y - 0.058, FZ + 0.085)]), SW.nose, 'y'));
  // eye patches (dark, drooping teardrops), eyes, catchlight
  const E = V(0.085, H.y + 0.01, 0);
  S.push(flat(hull(plate([[-0.055, 0.03], [0.045, 0.055], [0.085, 0.015], [0.085, -0.06], [0.045, -0.09], [-0.03, -0.06], [-0.06, -0.015]],
    E, FZ - 0.012, FZ + 0.006, 0.35)), SW.dark));
  S.push(flat(hull(plate([[-0.038, 0.002], [0.044, 0.03], [0.05, -0.008], [0.02, -0.036], [-0.026, -0.033], [-0.042, -0.014]],
    E, FZ - 0.002, FZ + 0.013, 0.35)), SW.white));
  S.push(flat(hull(plate([[-0.025, 0.004], [0.014, 0.017], [0.021, -0.006], [0.006, -0.028], [-0.018, -0.026], [-0.029, -0.01]],
    V(E.x - 0.003, E.y - 0.002, 0), FZ + 0.006, FZ + 0.018, 0.35)), SW.eye));
  S.push(flat(hull(plate([[-0.006, -0.006], [0.006, -0.006], [0.006, 0.006], [-0.006, 0.006]],
    V(E.x + 0.005, E.y + 0.002, 0), FZ + 0.013, FZ + 0.022, 0.35)), SW.white));
  // heavy brow ridge
  S.push(paint(hull([
    V(0.025, E.y + 0.012, FZ + 0.03), V(0.028, E.y + 0.05, FZ + 0.02),
    V(0.15, E.y + 0.048, FZ - 0.015), V(0.15, E.y + 0.088, FZ - 0.03),
    V(0.025, E.y + 0.012, FZ - 0.03), V(0.028, E.y + 0.06, FZ - 0.04),
    V(0.15, E.y + 0.048, FZ - 0.06), V(0.15, E.y + 0.09, FZ - 0.07),
  ]), SW.brow, 'y', [E.y + 0.01, E.y + 0.09]));
  // bushy white eyebrow shards sweeping out and down
  S.push(flat(shard(V(0.13, E.y + 0.07, FZ - 0.03), V(1, -0.25, 0.1), 0.03, 0.09), SW.fur));
  S.push(flat(shard(V(0.12, E.y + 0.05, FZ - 0.02), V(1, -0.7, 0.2), 0.026, 0.085), SW.fur));
  // mustache drooping from under the nose
  S.push(flat(hull([V(0.01, H.y - 0.068, FZ + 0.09), V(0.01, H.y - 0.09, FZ + 0.088), V(0.06, H.y - 0.09, FZ + 0.075),
    V(0.11, H.y - 0.17, FZ + 0.06), V(0.03, H.y - 0.075, FZ + 0.07), V(0.06, H.y - 0.1, FZ + 0.05)]), SW.fur));
  // long shard beard from the chin over the chest
  C.push(flat(shard(V(0, H.y - 0.12, FZ + 0.04), V(0, -1, 0.12), 0.07, 0.29), SW.fur));
  C.push(flat(shard(V(0, H.y - 0.11, FZ + 0.06), V(0, -1, 0.3), 0.05, 0.2), SW.brow));
  S.push(flat(shard(V(0.05, H.y - 0.11, FZ + 0.03), V(0.25, -1, 0.15), 0.055, 0.22), SW.fur));
  S.push(flat(shard(V(0.1, H.y - 0.09, FZ + 0.0), V(0.5, -1, 0.1), 0.05, 0.16), SW.brow));
  S.push(flat(shard(V(0.15, H.y - 0.07, FZ - 0.04), V(0.8, -1, 0.0), 0.045, 0.11), SW.fur));
  // cherry blossom tucked by the ear
  blossom(S, V(0.13, H.y + 0.12, FZ - 0.04), V(0.4, 0.5, 1), 0.038);
  // jade topknot with gold pin
  C.push(paint(hull([...ring(V(0, H.y + 0.16, H.z - 0.03), 0.045, 0.045, 6, 'y'), ...ring(V(0, H.y + 0.215, H.z - 0.03), 0.035, 0.035, 6, 'y')]), SW.fur, 'y', [0.9, 1.0]));
  C.push(flat(hull([...ring(V(0, H.y + 0.2, H.z - 0.03), 0.042, 0.042, 6, 'y'), ...ring(V(0, H.y + 0.225, H.z - 0.03), 0.04, 0.04, 6, 'y')]), SW.gold));
  C.push(flat(hull(cbox(V(0, H.y + 0.212, H.z - 0.03), 0.06, 0.006, 0.006, 0.002)), SW.gold));

  // white fur shards at the nape so the back of the head isn't a plain box
  C.push(flat(shard(V(0, H.y - 0.06, H.z - 0.15), V(0, -0.8, -0.7), 0.05, 0.09), SW.fur));
  S.push(flat(shard(V(0.08, H.y - 0.05, H.z - 0.14), V(0.4, -0.8, -0.6), 0.045, 0.085), SW.fur));
  S.push(flat(shard(V(0.15, H.y - 0.04, H.z - 0.1), V(0.8, -0.7, -0.4), 0.04, 0.075), SW.fur));
  S.push(flat(shard(V(0.05, H.y + 0.05, H.z - 0.165), V(0.2, -0.3, -1), 0.04, 0.06), SW.fur));
  // scale the whole head (with beard, ears, blossoms, topknot) up 8% about the neck
  const HP = V(0, 0.6, 0.03), HSC = 1.08;
  for (const g of [...C.slice(c0), ...S.slice(s0)]) { g.translate(-HP.x, -HP.y, -HP.z); g.scale(HSC, HSC, HSC); g.translate(HP.x, HP.y, HP.z); }

  // ================= RUNE HALO (gold ring floating behind the upper head) =================
  const HR = 0.165, HY = 0.87, HZ = -0.235;
  const hp = [];
  for (let k = 0; k <= 24; k++) { const a = (2 * Math.PI * k) / 24; hp.push({ p: V(Math.cos(a) * HR, HY + Math.sin(a) * HR, HZ), rx: 0.016, ry: 0.016 }); }
  C.push(flat(tube(hp, { seg: 4, axis: V(0, 0, 1), phase: Math.PI / 4 }), SW.gold));
  for (let k = 0; k < 8; k++) {
    const a = Math.PI / 2 + (2 * Math.PI * k) / 8;
    const c = V(Math.cos(a) * HR, HY + Math.sin(a) * HR, HZ + 0.012);
    C.push(flat(hull([...ringDir(c, V(0, 0, 1), 0.022, 0.022, 4, a), c.clone().add(V(0, 0, 0.012)), c.clone().add(V(0, 0, -0.03))]), SW.rune));
  }

  return assemble(C, S);
}

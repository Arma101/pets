// Glitch Phoenix (ADMIN): cyan + magenta phoenix with glitching pixel feathers, flaming crest,
// floating gold halo, spread radiant wings, glowing gold armour with royal purple trim.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// pixel-grid swatch: a glitchy 8x8 grid of cyan / magenta / white / purple cells
const pixDraw = (cols, seed) => (g, x, y) => {
  g.fillStyle = cols[0]; g.fillRect(x, y, 128, 128);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const h = Math.abs(Math.sin((r * 8 + c + 1) * 12.9898 + seed) * 43758.5453) % 1;
    g.fillStyle = cols[Math.floor(h * cols.length)];
    g.fillRect(x + c * 16, y + r * 16, 16, 16);
  }
};

// two-tone cell: gradient a over the first `f` of the length, then a hard stepped edge into b
const split = (a, b, f) => (g, x, y) => {
  const cut = 16 + 96 * f;
  let gr = g.createLinearGradient(0, y + 16, 0, y + cut);
  gr.addColorStop(0, a[0]); gr.addColorStop(1, a[1]);
  g.fillStyle = gr; g.fillRect(x, y, 128, cut);
  gr = g.createLinearGradient(0, y + cut, 0, y + 112);
  gr.addColorStop(0, b[0]); gr.addColorStop(1, b[1]);
  g.fillStyle = gr; g.fillRect(x, y + cut, 128, 128 - cut);
};

export const PALETTE = {
  cyan:    { i: 0, top: '#5FF3FF', bot: '#13A9D8' },
  cyanD:   { i: 1, top: '#2BD3F2', bot: '#0B7FB8' },
  greave:  { i: 22, top: '#FFD54A', bot: '#E0A000' },        // deeper matte gold armour
  cyanL:   { i: 21, top: '#9AF8FF', bot: '#2CC6EC' },
  mag:     { i: 2, top: '#FF5FE0', bot: '#C21A9E' },
  wingG:   { i: 3, draw: split(['#6AF5FF', '#1FB4E0'], ['#FF5FE0', '#D21FAE'], 0.6) }, // cyan, hard pixel step to magenta tip
  tailG:   { i: 4, draw: split(['#FF5FE0', '#C81A9E'], ['#5FF3FF', '#1AA8DA'], 0.62) }, // magenta, step to cyan tip
  gold:    { i: 5, top: '#FFDC4A', bot: '#F59A00', glow: true },
  goldM:   { i: 6, top: '#FFE16A', bot: '#E89A12' },        // matte gold (beak, feet)
  purple:  { i: 7, top: '#9B5BF0', bot: '#4E1FA8' },
  gem:     { i: 8, top: '#E2B3FF', bot: '#9B3BF0', glow: true },
  flame:   { i: 9, top: '#FF2FC8', bot: '#FFD23A', glow: true }, // magenta base -> yellow-white tip
  flameC:  { i: 10, top: '#22D8FF', bot: '#C8FFFF', glow: true },
  halo:    { i: 11, top: '#FFEE7A', bot: '#FFB000', glow: true },
  eye:     { i: 12, top: '#1A1416', bot: '#0C0A0B' },
  eyeW:    { i: 13, top: '#FFFFFF', bot: '#F1F1F4' },
  brow:    { i: 14, top: '#8A4BE8', bot: '#4A1C9E' },
  pxC:     { i: 15, top: '#7FFBFF', bot: '#7FFBFF', glow: true }, // glitch voxel colours
  pxM:     { i: 16, top: '#FF6BE6', bot: '#FF6BE6', glow: true },
  pxW:     { i: 17, top: '#FFFFFF', bot: '#E8FDFF', glow: true },
  pxP:     { i: 18, top: '#B07CFF', bot: '#9A5CFA', glow: true },
  grid:    { i: 19, glow: true, draw: pixDraw(['#4FF0FF', '#FF4FDC', '#FFFFFF', '#9B5BF0', '#22B8E8', '#FF4FDC'], 1.7) },
  talon:   { i: 20, top: '#7A3FD0', bot: '#3E1688' },
};
const P = PALETTE;

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const sub = (a, b) => a.clone().sub(b);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);

function cellUV(sw, t, u = 0.5) {
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  return [(x + 24 + THREE.MathUtils.clamp(u, 0, 1) * 80) / 1024, (y + 16 + THREE.MathUtils.clamp(t, 0, 1) * 96) / 1024];
}
// gradient along a direction (t = 0 at origin -> 1 at origin + d*L)
function paintAlong(g, sw, o, d, L) {
  const p = g.attributes.position, uv = [], dd = nrm(d);
  for (let i = 0; i < p.count; i++) {
    const t = (p.getX(i) - o.x) * dd.x + (p.getY(i) - o.y) * dd.y + (p.getZ(i) - o.z) * dd.z;
    uv.push(...cellUV(sw, t / L));
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
// planar projection of a full swatch cell (for the pixel-grid panels)
function paintPlanar(g, sw, o, ax, ay, sx, sy) {
  const p = g.attributes.position, uv = [];
  for (let i = 0; i < p.count; i++) {
    const q = V(p.getX(i) - o.x, p.getY(i) - o.y, p.getZ(i) - o.z);
    uv.push(...cellUV(sw, 0.5 - q.dot(ay) / sy, 0.5 + q.dot(ax) / sx));
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
// flat feather blade: convex polygon prism in the plane spanned by dir and side (normal n)
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
// axis-aligned voxel cube (12 tris)
function vox(c, s, sy = s, sz = s) {
  const pts = [];
  for (const a of [-1, 1]) for (const b of [-1, 1]) for (const k of [-1, 1]) pts.push(V(c.x + a * s, c.y + b * sy, c.z + k * sz));
  return hull(pts);
}

// oriented voxel: centre c, axes d (along), sd (side), n (normal) with half sizes
function obox(c, d, sd, n, hd, hs, hn) {
  const pts = [];
  for (const a of [-1, 1]) for (const b of [-1, 1]) for (const k of [-1, 1])
    pts.push(add(add(add(c, d, a * hd), sd, b * hs), n, k * hn));
  return hull(pts);
}

export function buildGeometry() {
  const C = [], S = [];
  const flat = (g, sw) => paint(g, sw, 'flat');
  const px = (c, s, sw) => S.push(flat(vox(c, s), sw));

  // ================= BODY (cyan egg, chest forward) =================
  C.push(paint(hull([
    ...ring(V(0, 0.36, -0.27), 0.09, 0.08, 10, 'z'),
    ...ring(V(0, 0.36, -0.17), 0.17, 0.15, 10, 'z'),
    ...ring(V(0, 0.39, -0.03), 0.2, 0.17, 10, 'z'),
    ...ring(V(0, 0.43, 0.09), 0.195, 0.18, 10, 'z'),
    ...ring(V(0, 0.5, 0.17), 0.155, 0.16, 10, 'z'),
    ...ring(V(0, 0.56, 0.2), 0.1, 0.1, 10, 'z'),
  ]), P.cyan, 'y', [0.2, 0.66]));
  // neck
  C.push(paint(hull([...ring(V(0, 0.5, 0.06), 0.15, 0.14, 8, 'y'), ...ring(V(0, 0.7, 0.1), 0.14, 0.13, 8, 'y')]), P.cyan, 'y', [0.4, 0.85]));

  // ---- glowing gold breastplate with purple trim + gem ----
  C.push(paint(hull([
    ...plate([[-0.13, 0.1], [0.13, 0.1], [0.15, 0.0], [0.1, -0.12], [0, -0.17], [-0.1, -0.12], [-0.15, 0.0]], V(0, 0.48, 0), 0.22, 0.26),
    V(0.185, 0.49, 0.1), V(-0.185, 0.49, 0.1), V(0.13, 0.37, 0.13), V(-0.13, 0.37, 0.13),
  ]), P.gold, 'y', [0.3, 0.6]));
  C.push(paint(hull(plate([[-0.03, 0.04], [0.03, 0.04], [0.045, 0], [0, -0.06], [-0.045, 0]], V(0, 0.47, 0), 0.265, 0.283)), P.gem, 'y', [0.41, 0.52]));
  C.push(paint(hull(plate([[-0.06, 0.07], [0.06, 0.07], [0.075, 0], [0, -0.1], [-0.075, 0]], V(0, 0.47, 0), 0.255, 0.27)), P.purple, 'flat'));
  // purple royal collar (mantle shards around the neck) with gold rim
  for (let k = 0; k <= 4; k++) {
    const a = -0.15 + k * 0.48; // 0 = front
    const dir = V(Math.sin(a) * 0.9, -0.8, Math.cos(a) * 0.9);
    const b = V(Math.sin(a) * 0.13, 0.6, 0.08 + Math.cos(a) * 0.13);
    if (k === 0) C.push(flat(shard(V(0, 0.6, 0.23), V(0, -0.8, 0.9), 0.06, 0.1, 4, 0.6), P.purple));
    if (k > 0) S.push(flat(shard(b, dir, 0.06, 0.11, 4, 0.6), P.purple));
  }
  C.push(paint(hull([...ring(V(0, 0.6, 0.08), 0.15, 0.15, 10, 'y'), ...ring(V(0, 0.64, 0.085), 0.14, 0.14, 10, 'y')]), P.gold, 'flat'));

  // ================= HEAD (big, cyan) =================
  const hc0 = C.length, hs0 = S.length;
  const H = { y: 0.82, z: 0.11 };
  C.push(paint(hull([
    ...cbox(V(0, H.y, H.z), 0.175, 0.15, 0.15, 0.075),
    ...ring(V(0, H.y + 0.165, H.z - 0.01), 0.1, 0.085, 8, 'y'),
    V(0.17, H.y - 0.085, H.z + 0.03), V(-0.17, H.y - 0.085, H.z + 0.03),
  ]), P.cyan, 'y', [0.66, 1.0]));
  const FZ = H.z + 0.15;
  // magenta cheek feathers flaring back
  S.push(flat(shard(V(0.145, H.y - 0.05, H.z + 0.0), V(0.5, -0.4, -1), 0.06, 0.1, 4, 0.75), P.mag));
  S.push(flat(shard(V(0.14, H.y + 0.04, H.z - 0.06), V(0.45, 0.1, -1), 0.06, 0.1, 4, 0.75), P.mag));
  S.push(flat(shard(V(0.12, H.y - 0.1, H.z - 0.07), V(0.4, -0.8, -0.8), 0.055, 0.09, 4, 0.75), P.cyanD));

  // beak: gold, hooked
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.04, FZ + 0.005), 0.065, 0.045, 0.02, 0.014),
    V(0.03, H.y - 0.015, FZ + 0.075), V(-0.03, H.y - 0.015, FZ + 0.075),
    V(0, H.y - 0.1, FZ + 0.15), V(0.013, H.y - 0.07, FZ + 0.14), V(-0.013, H.y - 0.07, FZ + 0.14),
    V(0.028, H.y - 0.08, FZ + 0.065), V(-0.028, H.y - 0.08, FZ + 0.065),
  ]), P.goldM, 'y', [H.y - 0.1, H.y + 0.0]));
  C.push(paint(hull([...cbox(V(0, H.y - 0.09, FZ + 0.02), 0.042, 0.016, 0.02, 0.007),
    V(0, H.y - 0.097, FZ + 0.09), V(0.012, H.y - 0.09, FZ + 0.08), V(-0.012, H.y - 0.09, FZ + 0.08)]), P.purple, 'flat'));

  // fierce eyes
  const E = V(0.088, H.y + 0.035, 0), ek = 1.25;
  const K = (a) => a.map(([u, v]) => [u * ek, v * ek]);
  S.push(flat(hull(plate(K([[-0.036, 0.004], [0.04, 0.03], [0.045, -0.01], [0.018, -0.036], [-0.026, -0.032], [-0.04, -0.014]]),
    E, FZ - 0.01, FZ + 0.01)), P.eyeW));
  S.push(flat(hull(plate(K([[-0.022, 0.004], [0.011, 0.016], [0.017, -0.007], [0.004, -0.024], [-0.016, -0.022], [-0.025, -0.009]]),
    V(E.x - 0.008, E.y - 0.002, 0), FZ + 0.005, FZ + 0.016)), P.eye));
  S.push(flat(hull(plate(K([[-0.006, -0.006], [0.006, -0.006], [0.006, 0.006], [-0.006, 0.006]]),
    V(E.x - 0.001, E.y + 0.002, 0), FZ + 0.012, FZ + 0.019)), P.eyeW));
  S.push(paint(hull([
    V(0.02, E.y + 0.01, FZ + 0.03), V(0.022, E.y + 0.05, FZ + 0.02),
    V(0.165, E.y + 0.05, FZ - 0.01), V(0.165, E.y + 0.09, FZ - 0.025),
    V(0.02, E.y + 0.01, FZ - 0.03), V(0.022, E.y + 0.06, FZ - 0.04),
    V(0.165, E.y + 0.05, FZ - 0.06), V(0.165, E.y + 0.095, FZ - 0.07),
  ]), P.brow, 'y'));
  // gold circlet band on the forehead with a purple gem
  C.push(paint(hull(plate([[-0.03, 0.03], [0.03, 0.03], [0.04, 0], [0, -0.035], [-0.04, 0]], V(0, H.y + 0.115, 0), FZ - 0.03, FZ - 0.005)), P.gold, 'flat'));
  C.push(paint(hull(plate([[-0.015, 0.015], [0.015, 0.015], [0.02, 0], [0, -0.02], [-0.02, 0]], V(0, H.y + 0.113, 0), FZ - 0.01, FZ + 0.002)), P.gem, 'flat'));

  // ================= FLAMING CREST (shard flames sweeping up and back) =================
  const flame = (b, d, w, l, sw = P.flame, fl = 0.55) => paintAlong(shard(b, d, w, l, 4, fl), sw, b, d, l);
  for (const [z, y, dz, l, w] of [
    [0.09, 0.11, 0.6, 0.16, 0.055],
    [0.03, 0.15, 0.12, 0.215, 0.07],
    [-0.05, 0.15, -0.5, 0.25, 0.072],
    [-0.12, 0.11, -1.1, 0.26, 0.066],
    [-0.16, 0.04, -2.4, 0.2, 0.055],
  ]) C.push(flame(V(0, H.y + y, H.z + z), V(0, 1, dz), w, l, P.flame, 0.6));
  for (const [z, y, dz, l, w, sw] of [
    [0.05, 0.13, 0.3, 0.17, 0.045, P.flameC],
    [-0.02, 0.14, -0.3, 0.2, 0.05, P.flame],
    [-0.1, 0.11, -0.9, 0.19, 0.048, P.flameC],
    [-0.15, 0.05, -2.0, 0.15, 0.042, P.flame],
  ]) S.push(flame(V(0.055, H.y + y, H.z + z), V(0.6, 1, dz), w, l, sw, 0.6));

  // scale the whole head group up around the neck
  const HS = 1.14, piv = V(0, 0.66, 0.12);
  for (const g of [...C.slice(hc0), ...S.slice(hs0)]) {
    g.translate(-piv.x, -piv.y, -piv.z); g.scale(HS, HS, HS); g.translate(piv.x, piv.y, piv.z);
  }
  // ================= HALO (floating above the head) =================
  // solid gold ring: 7-sided faceted cross-section, tilted back so the opening shows from the front
  const HY = piv.y + (H.y + 0.485 - piv.y) * HS, HZ = H.z - 0.05, HR = 0.17, NH = 12, TR = 0.032, TILT = 0.31;
  const cT = Math.cos(TILT), sT = Math.sin(TILT);
  const haloPt = (a, phi) => {
    const r = HR + Math.cos(phi) * TR, h = Math.sin(phi) * TR;
    const lz = Math.cos(a) * r; // local front-back
    return { p: V(Math.sin(a) * r, HY + h * cT - lz * sT, HZ + lz * cT + h * sT), h };
  };
  for (let k = 0; k < NH; k++) {
    const a0 = (2 * Math.PI * k) / NH, a1 = (2 * Math.PI * (k + 1)) / NH;
    if (Math.sin(a0) < -1e-6 || Math.sin(a1) < -1e-6) continue; // right half only (mirrored)
    const pts = [];
    for (const a of [a0, a1]) for (let j = 0; j < 7; j++) pts.push(haloPt(a, Math.PI / 2 + (2 * Math.PI * j) / 7).p);
    const g = hull(pts);
    // shade by local height on the ring (light on top, deep gold underneath)
    const pp = g.attributes.position, uv = [];
    for (let v = 0; v < pp.count; v++) {
      const q = V(pp.getX(v), pp.getY(v) - HY, pp.getZ(v) - HZ);
      const hl = q.y * cT + q.z * sT;
      uv.push(...cellUV(P.halo, 0.5 - hl / (2 * TR)));
    }
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    S.push(g);
  }

  // ================= LEGS (thick cyan thigh, glowing gold greaves, gold feet, purple talons) =================
  const legX = 0.112;
  S.push(paint(blob(1, V(legX, 0.285, -0.01), V(0.105, 0.105, 0.115), { jitter: 0.15 }), P.cyanD, 'y', [0.15, 0.37]));
  // faceted greave: flared cuff, waist, flared ankle
  S.push(paint(hull([...ring(V(legX, 0.205, -0.004), 0.08, 0.08, 6, 'y', 0), ...ring(V(legX + 0.002, 0.14, 0.004), 0.068, 0.068, 6, 'y', 0),
    ...ring(V(legX + 0.003, 0.09, 0.01), 0.074, 0.074, 6, 'y', 0)]), P.greave, 'y', [0.08, 0.21]));
  S.push(paint(hull([...ring(V(legX + 0.004, 0.09, 0.012), 0.058, 0.058, 6), ...ring(V(legX + 0.005, 0.03, 0.022), 0.056, 0.056, 6)]), P.goldM, 'y', [0, 0.1]));
  // purple rims (top cuff + ankle)
  S.push(paint(hull([...ring(V(legX, 0.188, -0.004), 0.09, 0.09, 6, "y", 0), ...ring(V(legX, 0.212, -0.004), 0.086, 0.086, 6, "y", 0)]), P.purple, 'flat'));
  S.push(paint(hull([...ring(V(legX + 0.003, 0.082, 0.01), 0.082, 0.082, 6, 'y', 0), ...ring(V(legX + 0.003, 0.1, 0.01), 0.082, 0.082, 6, 'y', 0)]), P.purple, 'flat'));
  const foot = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.03, z), 0.06, 0.03, 0.058, 0.014)), P.goldM, 'y', [0, 0.07]));
    for (const [dx, dz] of [[-0.055, 0.085], [0, 0.105], [0.055, 0.085]]) {
      S.push(paint(hull([...cbox(V(x + dx * 0.45, 0.025, z + dz * 0.45), 0.022, 0.025, 0.022, 0.008),
        ...cbox(V(x + dx, 0.021, z + dz), 0.02, 0.021, 0.016, 0.007)]), P.goldM, 'y', [0, 0.07]));
      S.push(flat(shard(V(x + dx * 1.08, 0.02, z + dz + 0.012), V(dx, -0.45, 0.8), 0.017, 0.042), P.talon));
    }
    S.push(paint(hull(cbox(V(x, 0.021, z - 0.055), 0.018, 0.021, 0.03, 0.006)), P.goldM, 'y', [0, 0.07]));
    S.push(flat(shard(V(x, 0.016, z - 0.085), V(0, -0.4, -1), 0.015, 0.035), P.talon));
  };
  foot(legX + 0.005, 0.03);

  // ================= WINGS (spread, radiant fan; gold armoured leading edge; pixel glitch tips) =================
  const SH = V(0.16, 0.56, -0.04), WR = V(0.47, 0.86, -0.13), TP = V(0.74, 1.08, -0.22);
  const armDir = nrm(sub(TP, SH));
  const downB = nrm(V(0.1, -1, -0.45));
  const wn = (() => { const n = nrm(cross(armDir, downB)); if (n.z < 0) n.multiplyScalar(-1); return n; })(); // wing front normal
  // shoulder pauldron: glowing gold with purple rim
  S.push(paint(hull([...ring(V(0.19, 0.6, -0.02), 0.07, 0.09, 8, 'x'), ...ring(V(0.24, 0.62, -0.03), 0.06, 0.07, 8, 'x'), V(0.27, 0.66, -0.03)]), P.gold, 'y', [0.5, 0.7]));
  S.push(paint(hull([...ring(V(0.2, 0.58, -0.02), 0.075, 0.095, 8, 'x'), ...ring(V(0.215, 0.58, -0.02), 0.075, 0.095, 8, 'x')]), P.purple, 'flat'));
  // arm (gold armoured leading edge)
  const edgePts = [SH, add(SH, sub(WR, SH), 0.5), WR, add(WR, sub(TP, WR), 0.5), TP];
  S.push(paint(tube(curveSamples(edgePts, 9, (t) => 0.05 - 0.022 * t, (t) => 0.04 - 0.014 * t),
    { seg: 6, ref: V(0, 0, 1), capEnd: 0.04, capStart: 0.01 }), P.gold, 'len'));
  const edge = new THREE.CatmullRomCurve3(edgePts, false, 'centripetal');
  // radiant fan of flight feathers
  const NF = 8;
  for (let i = 0; i < NF; i++) {
    const t = 0.12 + 0.86 * i / (NF - 1);
    const p = edge.getPoint(t);
    const th = 0.15 + 1.25 * t; // 0 = straight down, ~pi/2 = along arm
    const dir = nrm(add(downB.clone().multiplyScalar(Math.cos(th)), armDir, Math.sin(th)));
    const L = 0.3 + 0.22 * Math.sin(Math.PI * (0.35 + 0.6 * t));
    const off = -0.012 - (NF - i) * 0.004;
    const b0 = add(p, wn, off);
    const Lb = L * 0.8;
    S.push(paintAlong(blade(b0, dir, wn, Lb, 0.13, 0.016,
      [[0, -0.3], [0, 0.3], [0.2, 0.5], [1, 0.5], [1, -0.5], [0.2, -0.5]]), P.wingG, b0, dir, Lb));
    // glitch: the feather tip breaks into stepped pixel voxels, shifted sideways
    const sd = nrm(cross(wn, dir));
    const g = (i % 2 ? 1 : -1) * 0.018, q = 0.033;
    const vx = (u, v, sw, k = 1, hn = 0.02 * k) => S.push(flat(obox(add(add(b0, dir, u), sd, v), dir, sd, wn, q * k, q * k, hn), sw));
    vx(Lb + 0.01, -0.033, P.pxM); vx(Lb + 0.01, 0.033, P.pxM);
    vx(Lb + 0.06, g, i % 2 ? P.pxP : P.pxC, 1, 0.027);
    vx(Lb + 0.088, g - 0.022 * Math.sign(g), P.pxC, 0.6);
    if (i === 3) vx(Lb * 0.55, 0.068 * Math.sign(g), P.pxM, 0.7); // chunk chipping off the edge
  }
  // magenta coverts (shorter, in front) along the arm
  const NC = 7;
  for (let i = 0; i < NC; i++) {
    const t = 0.12 + 0.8 * i / (NC - 1);
    const p = edge.getPoint(t);
    const th = 0.2 + 1.2 * t;
    const dir = nrm(add(downB.clone().multiplyScalar(Math.cos(th)), armDir, Math.sin(th)));
    const L = 0.14 + 0.04 * t;
    const b1 = add(p, wn, 0.012 + i * 0.004);
    S.push(paintAlong(blade(b1, dir, wn, L, 0.1, 0.016,
      [[0, -0.4], [0, 0.4], [0.2, 0.5], [0.75, 0.5], [1, 0], [0.75, -0.5], [0.2, -0.5]]), P.cyanL, b1, dir, L));
  }
  // pixel-grid glitch panel on the wing
  {
    const t = 0.45, p = edge.getPoint(t);
    const dir = nrm(add(downB.clone().multiplyScalar(Math.cos(0.9)), armDir, Math.sin(0.9)));
    const side = nrm(cross(wn, dir));
    const c = add(add(p, wn, 0.045), dir, 0.08);
    const pts = [];
    for (const [u, v] of [[-0.065, -0.065], [0.065, -0.065], [0.065, 0.065], [-0.065, 0.065]]) for (const h of [-0.008, 0.008])
      pts.push(add(add(add(c, side, u), dir, v), wn, h));
    S.push(paintPlanar(hull(pts), P.grid, c, side, nrm(dir).multiplyScalar(-1), 0.13, 0.13));
  }

  // ================= TAIL (long phoenix plumes sweeping back and down) =================
  const X = V(1, 0, 0);
  const plume = (pts, w, thick) => paint(tube(curveSamples(pts, 10,
    (t) => thick * (1 - 0.5 * t), (t) => w * Math.sin(Math.PI * (0.15 + 0.8 * t)) + 0.01),
    { seg: 4, axis: X, capEnd: 0.0, capStart: 0.0 }), P.tailG, 'len');
  const tails = [
    { x: [0, 0], w: 0.095, pts: [[0.4, -0.22], [0.34, -0.44], [0.22, -0.64], [0.12, -0.84], [0.085, -1.02]] },
    { x: [0.05, 0.17], w: 0.085, pts: [[0.42, -0.22], [0.42, -0.44], [0.34, -0.64], [0.25, -0.82], [0.2, -0.96]] },
    { x: [0.08, 0.32], w: 0.075, pts: [[0.43, -0.2], [0.5, -0.4], [0.5, -0.58], [0.45, -0.74], [0.42, -0.86]] },
    { x: [0.09, 0.42], w: 0.06, pts: [[0.45, -0.18], [0.58, -0.32], [0.65, -0.46], [0.66, -0.6], [0.62, -0.7]] },
  ];
  for (const t of tails) {
    const n = t.pts.length;
    const pts = t.pts.map(([y, z], i) => V(t.x[0] + (t.x[1] - t.x[0]) * i / (n - 1), y, z));
    (t.x[1] === 0 ? C : S).push(plume(pts, t.w, 0.045));
    // gold flame tip + glitch voxels at the end
    const a = pts[n - 1], d = nrm(sub(pts[n - 1], pts[n - 2]));
    const g = paintAlong(shard(add(a, d, -0.02), d, 0.04, 0.1, 4, 0.5), P.gold, a, d, 0.1);
    (t.x[1] === 0 ? C : S).push(g);
    // glitch voxels breaking off the plume edges at the magenta -> cyan step
    const cv = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    for (const [tt, sgn, sw, sz] of [[0.6, 1, P.pxC, 0.03], [0.7, -1, P.pxM, 0.026], [0.82, 1, P.pxM, 0.022]]) {
      const q = cv.getPoint(tt), T = cv.getTangent(tt);
      const B = nrm(cross(T, X)); if (B.y < 0) B.multiplyScalar(-1);
      const wv = t.w * Math.sin(Math.PI * (0.15 + 0.8 * tt)) + 0.01;
      const c = add(q, B, sgn * (wv - sz * 0.6));
      (t.x[1] === 0 ? C : S).push(flat(vox(c, sz), sw));
      if (sgn > 0) (t.x[1] === 0 ? C : S).push(flat(vox(add(add(c, B, sz * 1.25), T, -sz * 0.8), sz * 0.6), sw === P.pxC ? P.pxM : P.pxC));
    }
  }

  // glowing gold back plate with a purple gem (armour between the wings)
  {
    const pts = [];
    for (const [x, y, z] of [[0.1, 0.57, 0.02], [0.13, 0.54, -0.1], [0.07, 0.5, -0.19], [0, 0.585, 0.03], [0, 0.515, -0.2]])
      for (const sx of x ? [-1, 1] : [1]) pts.push(V(sx * x, y, z), V(sx * x * 0.9, y - 0.05, z));
    C.push(paint(hull(pts), P.gold, 'y', [0.45, 0.6]));
    C.push(paint(hull([V(0, 0.598, -0.02), V(0.035, 0.585, -0.06), V(-0.035, 0.585, -0.06), V(0, 0.565, -0.11),
      V(0, 0.56, -0.02), V(0.03, 0.55, -0.06), V(-0.03, 0.55, -0.06), V(0, 0.53, -0.11)]), P.gem, 'flat'));
  }
  // pixel-grid glitch panel on the rump, over the tail root
  {
    const c = V(0, 0.47, -0.24), ax = V(1, 0, 0), ay = nrm(V(0, 0.45, 1)), nn = nrm(V(0, 1, -0.45));
    const pts = [];
    for (const [u, v] of [[-0.075, -0.06], [0.075, -0.06], [0.075, 0.06], [-0.075, 0.06]]) for (const h of [-0.01, 0.01])
      pts.push(add(add(add(c, ax, u), ay, v), nn, h));
    C.push(paintPlanar(hull(pts), P.grid, c, ax, ay, 0.15, 0.12));
  }
  return assemble(C, S);
}

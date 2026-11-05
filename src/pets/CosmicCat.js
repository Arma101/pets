// Cosmic Cat (Robux egg / Ultimate Egg): deep indigo cat with a cyan glowing starfield in its fur,
// pointy ears, glowing gold armour, radiant cyan-and-gold wings and a floating golden halo.
// The starfield is painted into the atlas and mapped by world position (per-facet planar projection),
// so the stars sit on the fur with no overlay geometry.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// ---------------- colours ----------------
const IN_TOP = [92, 76, 214], IN_BOT = [36, 26, 112];   // deep indigo (light top -> dark bottom)
const STAR = [150, 250, 255], STAR_CORE = [235, 255, 255], HALO_IN = [70, 120, 220];
const lerp3 = (a, b, t) => [0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * Math.min(1, Math.max(0, t)));
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const indigo = (y) => lerp3(IN_TOP, IN_BOT, (1.12 - y) / 0.95);

// ---------------- starfield ----------------
const ih = (i, j, k) => { const s = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return s - Math.floor(s); };
// returns 0 = fur, 1 = soft glow halo, 2 = star, 3 = star core
function starAt(a, b) {
  const cell = 0.072;
  const ci = Math.floor(a / cell), cj = Math.floor(b / cell);
  let best = 0;
  for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
    const i = ci + di, j = cj + dj;
    if (ih(i, j, 1) > 0.62) continue;
    const cx = (i + 0.2 + 0.6 * ih(i, j, 2)) * cell, cy = (j + 0.2 + 0.6 * ih(i, j, 3)) * cell;
    const big = ih(i, j, 4) > 0.55;
    const r = big ? 0.016 + 0.012 * ih(i, j, 5) : 0.006 + 0.003 * ih(i, j, 5);
    const dx = Math.abs(a - cx), dy = Math.abs(b - cy);
    let v = 0;
    if (big) {
      const d = Math.pow(Math.sqrt(dx) + Math.sqrt(dy), 2); // 4-point sparkle
      if (Math.hypot(dx, dy) < r * 0.28) v = 3; else if (d < r) v = 2; else if (Math.hypot(dx, dy) < r * 0.75) v = 1;
    } else {
      const d = Math.hypot(dx, dy);
      if (d < r) v = 2;
    }
    best = Math.max(best, v);
  }
  return best;
}
const furCol = (base, s) => (s === 3 ? STAR_CORE : s === 2 ? STAR : s === 1 ? lerp3(base, HALO_IN, 0.45) : base);

// atlas regions (absolute pixel rects), a = horizontal coord, b = vertical coord
const REG = {
  side: { x: 0, y: 256, w: 1024, h: 448, a: [-0.98, 0.78], b: [1.25, 0.0], sym: false, col: (z, y) => indigo(y) },
  front: { x: 0, y: 704, w: 512, h: 320, a: [-0.42, 0.42], b: [1.25, 0.0], sym: true, col: (x, y) => indigo(y) },
  top: { x: 512, y: 704, w: 512, h: 320, a: [-0.42, 0.42], b: [-0.98, 0.78], sym: true, col: () => indigo(1.05) },
};
function regionPass(g, starsOnly) {
  for (const r of Object.values(REG)) {
    const img = starsOnly ? g.getImageData(r.x, r.y, r.w, r.h) : g.createImageData(r.w, r.h);
    for (let py = 0; py < r.h; py++) for (let px = 0; px < r.w; px++) {
      let a = r.a[0] + ((px + 0.5) / r.w) * (r.a[1] - r.a[0]);
      const b = r.b[0] + ((py + 0.5) / r.h) * (r.b[1] - r.b[0]);
      if (r.sym) a = Math.abs(a);
      const s = starAt(a, b);
      const o = (py * r.w + px) * 4;
      if (starsOnly) {
        if (s < 2) continue;
        const c = s === 3 ? STAR_CORE : STAR;
        img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
      } else {
        const c = furCol(r.col(a, b), s);
        img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
      }
    }
    g.putImageData(img, r.x, r.y);
  }
}
const regUV = (r, a, b) => {
  const fa = clamp01((a - r.a[0]) / (r.a[1] - r.a[0])), fb = clamp01((b - r.b[0]) / (r.b[1] - r.b[0]));
  return [(r.x + 2 + fa * (r.w - 4)) / 1024, (r.y + 2 + fb * (r.h - 4)) / 1024];
};

export const PALETTE = {
  muzzle: { i: 0, top: '#C9C2FF', bot: '#8F86E8' },
  lav: { i: 1, top: '#B4ABFA', bot: '#6E62D6' },
  nose: { i: 2, top: '#FFA6D6', bot: '#D9649F' },
  eye: { i: 3, top: '#1A1416', bot: '#0C0A0B' },
  white: { i: 4, top: '#FFFFFF', bot: '#F1F1F4' },
  mouth: { i: 5, top: '#2A1E5A', bot: '#160F36' },
  brow: { i: 6, top: '#7464F0', bot: '#3A2DA8' },
  gold: { i: 7, top: '#FFE470', bot: '#EBA51C' },
  goldGlow: { i: 8, top: '#FFE24A', bot: '#FFAA00', glow: true },
  cyan: { i: 9, top: '#D2FEFF', bot: '#3FD8FF', glow: true },
  wing: { i: 10, top: '#F0FEFF', bot: '#5CE0FF', glow: true },
  goldW: { i: 12, top: '#FFEA6A', bot: '#FFBE12' },
  paw: { i: 11, top: '#B9B1FB', bot: '#7568DA' },
  cosmic: { i: 16, draw: (g) => regionPass(g, false) },          // rows 2..7 of the atlas
  stars: { i: 17, glow: true, draw: (g) => regionPass(g, true) }, // star pixels only (emissive)
};
const SW = PALETTE;

// per-facet planar projection of the starfield
function cosmic(g) {
  const p = g.attributes.position, uv = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    n.subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
    for (const v of [a, b, c]) {
      if (n.y > 0 && ay >= ax && ay >= az) uv.push(...regUV(REG.top, Math.abs(v.x), v.z));
      else if (ax >= az) uv.push(...regUV(REG.side, v.z, v.y));
      else uv.push(...regUV(REG.front, Math.abs(v.x), v.y));
    }
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const sub = (a, b) => a.clone().sub(b);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);
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
// 4-point star made of two crossed diamonds lying on the plane with normal n
function star4(c, n, r, th = 0.012, up = V(0, 1, 0)) {
  const nn = nrm(n);
  let u = nrm(add(up, nn, -up.dot(nn)));
  const w = nrm(cross(nn, u));
  const out = [];
  for (const [A, B] of [[u, w], [w, u]]) {
    const pts = [];
    for (const [s, k] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const p = add(add(c, A, s * r), B, k * r * 0.28);
      pts.push(add(p, nn, th / 2), add(p, nn, -th / 2));
    }
    pts.push(add(c, nn, th * 1.3));
    out.push(hull(pts));
  }
  return out;
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const gold = (g) => paint(g, SW.gold, 'y');
  const goldG = (g) => paint(g, SW.goldGlow, 'y');
  const cyan = (g) => paint(g, SW.cyan, 'y');

  // ================= TORSO =================
  C.push(cosmic(hull([
    ...ring(V(0, 0.43, -0.45), 0.11, 0.11, 10, 'z'),
    ...ring(V(0, 0.42, -0.39), 0.185, 0.19, 10, 'z'),
    ...ring(V(0, 0.41, -0.2), 0.2, 0.2, 10, 'z'),
    ...ring(V(0, 0.41, 0.0), 0.2, 0.205, 10, 'z'),
    ...ring(V(0, 0.43, 0.15), 0.205, 0.21, 10, 'z'),
    ...ring(V(0, 0.46, 0.26), 0.15, 0.15, 10, 'z'),
  ])));
  // neck
  C.push(cosmic(hull([...ring(V(0, 0.46, 0.2), 0.16, 0.15, 10, 'y'), ...ring(V(0, 0.64, 0.3), 0.16, 0.13, 10, 'y')])));

  // ================= LEGS =================
  const FL = { x: 0.15, z: 0.17 };
  S.push(cosmic(hull([...ring(V(FL.x, 0.06, FL.z + 0.01), 0.086, 0.084, 8), ...ring(V(FL.x - 0.002, 0.2, FL.z), 0.094, 0.094, 8),
    ...ring(V(FL.x - 0.015, 0.36, FL.z - 0.02), 0.118, 0.13, 8), ...ring(V(FL.x - 0.03, 0.48, FL.z - 0.03), 0.09, 0.11, 8)])));
  const BL = { x: 0.155, z: -0.29 };
  S.push(cosmic(hull([...ring(V(BL.x - 0.02, 0.43, BL.z + 0.02), 0.165, 0.16, 8, 'x'),
    ...ring(V(BL.x + 0.02, 0.43, BL.z + 0.02), 0.14, 0.135, 8, 'x'),
    ...ring(V(BL.x + 0.005, 0.2, BL.z - 0.03), 0.094, 0.098, 8)])));
  S.push(cosmic(hull([...ring(V(BL.x + 0.005, 0.22, BL.z - 0.03), 0.092, 0.094, 8), ...ring(V(BL.x + 0.008, 0.06, BL.z + 0.0), 0.085, 0.083, 8)])));
  // paws: lavender block + 4 toes
  const paw = (x, z, s = 1) => {
    S.push(paint(hull(cbox(V(x, 0.043, z), 0.074 * s, 0.043, 0.07 * s, 0.024)), SW.paw, 'y', [0, 0.1]));
    for (const dx of [-0.051, -0.017, 0.017, 0.051])
      S.push(paint(hull(cbox(V(x + dx * s, 0.034, z + 0.066 * s), 0.019 * s, 0.034, 0.028, 0.01)), SW.paw, 'y', [0, 0.1]));
  };
  paw(FL.x, FL.z + 0.02, 1.25);
  paw(BL.x + 0.008, BL.z + 0.02, 1.2);
  // gold armour cuffs above each paw
  S.push(gold(hull([...ring(V(FL.x - 0.001, 0.1, FL.z + 0.006), 0.1, 0.1, 8), ...ring(V(FL.x - 0.002, 0.17, FL.z + 0.002), 0.106, 0.106, 8)])));
  S.push(gold(hull([...ring(V(BL.x + 0.008, 0.1, BL.z - 0.008), 0.098, 0.098, 8), ...ring(V(BL.x + 0.007, 0.17, BL.z - 0.02), 0.104, 0.107, 8)])));

  // ================= CHEST RUFF (lavender shards) + GOLD GORGET =================
  C.push(paint(blob(1, V(0, 0.44, 0.28), V(0.13, 0.13, 0.08), { jitter: 0.18 }), SW.lav, 'y', [0.28, 0.6]));
  C.push(paint(shard(V(0, 0.34, 0.29), V(0, -1, 0.35), 0.055, 0.11), SW.lav, 'y', [0.22, 0.4]));
  for (const [b, d, w, l] of [
    [V(0.055, 0.34, 0.29), V(0.25, -1, 0.35), 0.05, 0.1],
    [V(0.1, 0.37, 0.27), V(0.6, -1, 0.3), 0.045, 0.09],
    [V(0.12, 0.44, 0.27), V(0.9, -0.8, 0.4), 0.045, 0.075],
  ]) S.push(paint(shard(b, d, w, l), SW.lav, 'y', [0.22, 0.48]));
  // gorget: gold collar band around the neck with a hanging plate and cyan gem
  C.push(gold(hull([...ring(V(0, 0.52, 0.24), 0.165, 0.15, 12, 'y', 0), ...ring(V(0, 0.585, 0.265), 0.16, 0.14, 12, 'y', 0)])));
  C.push(gold(hull(plate([[-0.075, 0.03], [0.075, 0.03], [0.06, -0.04], [0, -0.09], [-0.06, -0.04]], V(0, 0.52, 0), 0.36, 0.39))));
  C.push(cyan(hull([V(0, 0.53, 0.41), V(0.03, 0.5, 0.395), V(-0.03, 0.5, 0.395), V(0, 0.455, 0.395), V(0, 0.5, 0.375)])));
  // pauldrons: layered gold shoulder plates
  S.push(gold(hull([...ring(V(0.24, 0.47, 0.15), 0.1, 0.085, 8, 'x'), ...ring(V(0.17, 0.54, 0.15), 0.125, 0.105, 8, 'x')])));
  for (const [y, z] of [[0.46, 0.22], [0.44, 0.15], [0.46, 0.08]]) S.push(goldG(shard(V(0.25, y, z), V(0.5, -1, 0), 0.03, 0.07)));
  // back saddle plate (wing mount)
  C.push(gold(hull(cbox(V(0, 0.61, 0.0), 0.15, 0.022, 0.15, 0.03))));
  C.push(goldG(hull(cbox(V(0, 0.635, 0.0), 0.04, 0.012, 0.13, 0.012))));
  // big glowing stars on the haunches
  for (const g of star4(V(0.204, 0.45, BL.z + 0.02), V(1, 0.22, 0), 0.065, 0.014)) S.push(cyan(g));

  // ================= HEAD =================
  const hc0 = C.length, hs0 = S.length;
  const H = { y: 0.72, z: 0.35, hx: 0.21, hy: 0.15, hz: 0.15 };
  C.push(cosmic(hull([
    ...cbox(V(0, H.y - 0.01, H.z), H.hx, H.hy - 0.01, H.hz, 0.07),
    ...ring(V(0, H.y + 0.17, H.z - 0.01), 0.15, 0.12, 10, 'y'),
    ...ring(V(0, H.y + 0.02, H.z - 0.19), 0.15, 0.12, 10, 'z'),
    ...ring(V(0, H.y + 0.06, H.z - 0.15), 0.2, 0.14, 10, 'z'),
    V(0.24, H.y - 0.07, H.z + 0.05), V(-0.24, H.y - 0.07, H.z + 0.05),
    V(0.21, H.y - 0.12, H.z + 0.02), V(-0.21, H.y - 0.12, H.z + 0.02),
  ])));
  const FZ = H.z + H.hz;

  // cheek fur: indigo shards sweeping out & down
  for (const [b, d, w, l] of [
    [V(0.225, H.y - 0.07, H.z + 0.04), V(1, -0.25, 0.0), 0.04, 0.075],
    [V(0.21, H.y - 0.12, H.z + 0.05), V(0.8, -0.8, 0.05), 0.04, 0.075],
    [V(0.15, H.y - 0.15, H.z + 0.08), V(0.4, -1, 0.1), 0.038, 0.06],
  ]) S.push(cosmic(shard(b, d, w, l)));

  // muzzle (lavender), chin, nose, mouth
  // cat muzzle: two puffy whisker pads + small chin, short snout
  S.push(paint(hull(cbox(V(0.042, H.y - 0.085, FZ + 0.012), 0.05, 0.04, 0.04, 0.02)), SW.muzzle, 'y', [H.y - 0.13, H.y - 0.04]));
  C.push(paint(hull([...cbox(V(0, H.y - 0.06, FZ + 0.015), 0.035, 0.03, 0.035, 0.012), V(0, H.y - 0.01, FZ - 0.01)]), SW.muzzle, 'y', [H.y - 0.1, H.y]));
  C.push(paint(hull(cbox(V(0, H.y - 0.13, FZ - 0.005), 0.05, 0.022, 0.04, 0.012)), SW.muzzle, 'flat'));
  C.push(paint(hull([V(0.026, H.y - 0.042, FZ + 0.052), V(-0.026, H.y - 0.042, FZ + 0.052), V(0, H.y - 0.07, FZ + 0.05),
    V(0.026, H.y - 0.042, FZ + 0.03), V(-0.026, H.y - 0.042, FZ + 0.03), V(0, H.y - 0.07, FZ + 0.03), V(0, H.y - 0.05, FZ + 0.062)]), SW.nose, 'y'));
  C.push(paint(hull(cbox(V(0, H.y - 0.088, FZ + 0.052), 0.005, 0.016, 0.004, 0.002)), SW.mouth, 'flat'));
  S.push(paint(hull([V(0, H.y - 0.104, FZ + 0.054), V(0, H.y - 0.096, FZ + 0.054), V(0.04, H.y - 0.112, FZ + 0.048),
    V(0.04, H.y - 0.106, FZ + 0.048), V(0, H.y - 0.104, FZ + 0.045), V(0.04, H.y - 0.11, FZ + 0.04)]), SW.mouth, 'flat'));

  // fierce eyes
  const E = V(0.092, H.y + 0.03, 0);
  S.push(paint(hull(plate([[-0.044, 0.004], [0.048, 0.034], [0.056, -0.008], [0.022, -0.04], [-0.03, -0.036], [-0.048, -0.016]],
    E, FZ - 0.01, FZ + 0.012)), SW.white, 'flat'));
  S.push(paint(hull(plate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]],
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.014, FZ + 0.021)), SW.white, 'flat'));
  // heavy brow
  S.push(paint(hull([
    V(0.022, E.y + 0.002, FZ + 0.05), V(0.024, E.y + 0.06, FZ + 0.04),
    V(0.17, E.y + 0.04, FZ + 0.015), V(0.17, E.y + 0.1, FZ - 0.005),
    V(0.022, E.y + 0.002, FZ - 0.03), V(0.024, E.y + 0.07, FZ - 0.04),
    V(0.17, E.y + 0.04, FZ - 0.06), V(0.17, E.y + 0.105, FZ - 0.07),
  ]), SW.brow, 'y'));
  // gold diadem on the forehead with a cyan star gem
  C.push(gold(hull([V(0, H.y + 0.1, FZ + 0.0), V(0, H.y + 0.19, FZ - 0.05), V(0.05, H.y + 0.15, FZ - 0.03), V(-0.05, H.y + 0.15, FZ - 0.03),
    V(0, H.y + 0.1, FZ - 0.05), V(0, H.y + 0.19, FZ - 0.1), V(0.05, H.y + 0.15, FZ - 0.08), V(-0.05, H.y + 0.15, FZ - 0.08)])));
  for (const g of star4(V(0, H.y + 0.145, FZ - 0.018), V(0, 0.45, 1), 0.032, 0.01)) C.push(cyan(g));

  // pointy ears with glowing cyan inners
  const ET = V(0.175, H.y + 0.33, H.z - 0.05);
  S.push(cosmic(hull([V(0.05, H.y + 0.15, H.z + 0.02), V(0.22, H.y + 0.09, H.z + 0.02),
    V(0.05, H.y + 0.15, H.z - 0.09), V(0.22, H.y + 0.09, H.z - 0.09), ET])));
  S.push(cyan(hull([V(0.085, H.y + 0.16, H.z + 0.024), V(0.195, H.y + 0.12, H.z + 0.024), V(0.165, H.y + 0.27, H.z - 0.02),
    V(0.085, H.y + 0.16, H.z + 0.0), V(0.195, H.y + 0.12, H.z + 0.0), V(0.165, H.y + 0.27, H.z - 0.04)])));
  // ear tufts / crown fur
  C.push(cosmic(shard(V(0, H.y + 0.16, H.z - 0.06), V(0, 0.6, -1), 0.045, 0.08)));

  // ================= HALO (floating gold ring above the head) =================
  {
    const tor = new THREE.TorusGeometry(0.115, 0.02, 4, 14).toNonIndexed();
    tor.deleteAttribute('normal'); tor.deleteAttribute('uv');
    tor.rotateX(Math.PI / 2 - 0.25);
    tor.rotateZ(Math.PI / 14);
    tor.translate(0, H.y + 0.37, H.z - 0.06);
    tor.computeVertexNormals();
    C.push(paint(tor, SW.goldGlow, 'flat'));
  }

  // scale the whole head (and its halo) up about the neck for the big-head look
  {
    const HS = 1.12, piv = V(0, 0.6, 0.3);
    for (const g of [...C.slice(hc0), ...S.slice(hs0)]) {
      g.translate(-piv.x, -piv.y, -piv.z); g.scale(HS, HS, HS); g.translate(piv.x, piv.y, piv.z);
    }
  }

  // ================= TAIL (long, starry, curling up; gold band + glowing tip) =================
  const tailPts = [V(0, 0.46, -0.42), V(0, 0.5, -0.56), V(0, 0.64, -0.66), V(0, 0.82, -0.66), V(0, 0.93, -0.58), V(0, 0.955, -0.5)];
  C.push(cosmic(tube(curveSamples(tailPts, 11, (t) => 0.07 + 0.012 * t), { seg: 7, axis: X, capStart: 0, capEnd: 0.0, phase: Math.PI / 2,
    twist: (i) => (i % 2) * Math.PI / 7, scale: (i) => (i % 2 ? 1.12 : 0.96) })));
  // indigo shard tufts along the outer curve of the tail
  const tc = new THREE.CatmullRomCurve3(tailPts, false, 'centripetal');
  for (const t of [0.22, 0.42, 0.62, 0.8]) {
    const p = tc.getPoint(t), T = tc.getTangent(t);
    const out = V(0, -T.z, T.y).normalize(); if (out.z > 0 && t < 0.5) out.multiplyScalar(-1);
    const o = nrm(add(out, T, -0.6));
    C.push(cosmic(shard(add(p, o, 0.05), o, 0.045, 0.09)));
    S.push(cosmic(shard(add(add(p, o, 0.02), X, 0.05), nrm(add(add(o, X, 0.9), T, -0.4)), 0.035, 0.07)));
  }
  C.push(gold(hull([...ring(V(0, 0.95, -0.525), 0.09, 0.09, 8, 'z'), ...ring(V(0, 0.958, -0.485), 0.094, 0.094, 8, 'z')])));
  // glowing tuft tip: a cluster of cyan shards flaring forward/up
  C.push(cyan(hull([...ring(V(0, 0.958, -0.49), 0.072, 0.072, 8, 'z'), V(0, 1.03, -0.32)])));
  S.push(cyan(shard(V(0.03, 0.96, -0.47), V(0.5, 0.5, 0.8), 0.03, 0.07)));
  C.push(cyan(shard(V(0, 0.99, -0.47), V(0, 1, 0.3), 0.032, 0.08)));
  C.push(cyan(shard(V(0, 0.93, -0.47), V(0, -0.5, 0.8), 0.03, 0.06)));

  // ================= WINGS (radiant: gold leading edge, glowing cyan feathers) =================
  const SH = V(0.11, 0.62, 0.02), WR = V(0.42, 0.9, -0.1), TP = V(0.6, 1.0, -0.4);
  const armDir = nrm(sub(WR, SH));
  const wingN = (dir) => { const n = nrm(cross(armDir, dir)); if (n.x < 0) n.multiplyScalar(-1); return n; };
  S.push(paint(tube(curveSamples([SH, add(SH, sub(WR, SH), 0.5), WR, TP], 9,
    (t) => 0.04 - 0.015 * t, (t) => 0.03 - 0.01 * t), { seg: 6, ref: V(1, 0, 0.2), capEnd: 0.03, capStart: 0.01 }), SW.goldGlow, 'len'));
  const NF = 6;
  for (let i = 0; i < NF; i++) {
    const t = 0.15 + 0.85 * i / (NF - 1);
    const p = add(SH, sub(WR, SH), t);
    const ang = -0.7 + 0.6 * t;
    const dir = nrm(V(0.4, Math.sin(ang), -Math.cos(ang)));
    const n = wingN(dir);
    const L = 0.2 + 0.28 * Math.pow(t, 1.2);
    S.push(paint(blade(add(p, n, -0.012 + (NF - i) * 0.004), dir, n, L, 0.11), SW.wing, 'y'));
  }
  for (let i = 0; i < 3; i++) {
    const p = add(WR, sub(TP, WR), 0.2 + i * 0.3);
    const dir = nrm(V(0.35, -0.45 - 0.2 * i, -1));
    const n = wingN(V(0.35, -0.3, -1));
    S.push(paint(blade(add(p, n, -0.018 - i * 0.004), dir, n, 0.26 - i * 0.04, 0.1), SW.wing, 'y'));
  }
  // gold coverts along the upper edge
  for (let i = 0; i < 4; i++) {
    const t = 0.2 + 0.75 * i / 3;
    const p = add(SH, sub(WR, SH), t);
    const dir = nrm(V(0.38, -0.55, -1));
    const n = wingN(V(0.38, -0.3, -1));
    S.push(paint(blade(add(p, n, 0.026 + i * 0.004), dir, n, 0.17 + 0.05 * t, 0.085, 0.014,
      [[0, -0.4], [0, 0.4], [0.3, 0.5], [0.6, 0.35], [1, 0], [0.6, -0.35], [0.3, -0.5]]), SW.goldW, 'y'));
  }

  // crouch: compress the legs so the body sits lower (UVs already set, so stars stay put)
  for (const g of [...C, ...S]) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setY(i, y - 0.075 * clamp01((y - 0.12) / 0.2)); }
    g.computeVertexNormals();
  }
  return assemble(C, S);
}

// Cosmic Tiger (Celestial): deep indigo tiger with glowing pink stripes, star speckles and nebula haze,
// a floating gold crown and glowing markings. Fur pattern is painted into the atlas and mapped by world
// position with a per-facet planar projection (no overlay geometry => no z-fighting).
// Glow: patterned swatches detect the emissive pass (canvas pre-filled black) and then paint only the
// glowing pixels, so stripes/stars glow while the indigo fur stays matte.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// ---------------- colours ----------------
const IN_TOP = [74, 62, 178], IN_BOT = [34, 26, 104];      // deep indigo fur
const NEB = [146, 62, 200];                                  // violet nebula haze
const PK_TOP = [255, 128, 226], PK_BOT = [255, 72, 188];     // glowing pink stripes
const STAR = [255, 246, 200];                                // star speckles
const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const lerp3 = (a, b, t) => [0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * clamp01(t));
const indigo = (t) => lerp3(IN_TOP, IN_BOT, t);
const pink = (t) => lerp3(PK_TOP, PK_BOT, t);
const dim = (c, k) => c.map((v) => v * k);

// ---------------- layout ----------------
const H = { y: 0.71, z: 0.37, hx: 0.215, hy: 0.165, hz: 0.165 }; // head centre & half sizes
const SPINE = 0.585;

// deterministic hash (mirror-safe when given |x|)
const hsh = (a, b) => { let h = Math.imul((a | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul((b | 0) + 0x632be5ab, 0xc2b2ae35);
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15; return (h >>> 0) / 4294967296; };
// four-point star speckles on a jittered grid (tapered "sparkle" shape)
function starAt(a, b, cell = 0.075, r = 0.011, seed = 0) {
  const ia = Math.floor(a / cell), ib = Math.floor(b / cell);
  for (let da = -1; da <= 1; da++) for (let db = -1; db <= 1; db++) {
    const ca = ia + da, cb = ib + db;
    if (hsh(ca * 7 + seed * 131, cb * 13 + 5) > 0.5) continue;           // not every cell has a star
    const pa = (ca + 0.2 + 0.6 * hsh(ca * 3 + 11, cb * 5 + seed * 17)) * cell;
    const pb = (cb + 0.2 + 0.6 * hsh(ca * 11 + 3, cb * 7 + seed * 29)) * cell;
    const rr = r * (0.7 + 0.9 * hsh(ca * 17 + seed, cb * 19 + 1));
    const dx = Math.abs(a - pa) / rr, dy = Math.abs(b - pb) / rr;
    if (dx < 1 && dy < 1 && Math.sqrt(dx) + Math.sqrt(dy) < 1) return 1;
  }
  return 0;
}
// soft nebula haze weight (0..1), symmetric inputs
function nebula(a, b) {
  const v = Math.sin(a * 9.0 + 1.3) * Math.sin(b * 11.0 - 0.7) + 0.6 * Math.sin(a * 17.0 + b * 6.0);
  return clamp01((v - 0.35) * 0.9);
}

// ---- stripe patterns (all symmetric in x) ----
// flank stripes: [z at spine, y end, half-width at top, slant, forked?]
const FLANK = [
  [-0.37, 0.27, 0.042, 0.08, 0],
  [-0.2, 0.2, 0.046, 0.15, 1],
  [-0.03, 0.22, 0.046, 0.22, 0],
  [0.135, 0.3, 0.04, 0.28, 1],
];
function bodyStripe(z, y, top = false) {
  for (const [zi, yEnd, w, sl, fork] of FLANK) {
    if (top) { if (Math.abs(z - zi) < w) return true; continue; }
    if (y < yEnd) continue;
    const d = clamp01((SPINE - y) / (SPINE - yEnd));
    const zc = zi + sl * (SPINE - y) + 0.012 * Math.sin(d * 5);
    const wd = w * Math.pow(1 - d, 0.7) + 0.003;
    if (fork && d > 0.45) { // stripe splits into two prongs (lightning fork)
      const sp = (d - 0.45) * 0.09;
      const w2 = wd * 0.75;
      if (Math.abs(z - zc - sp) < w2 || Math.abs(z - zc + sp * 0.6) < w2 * 0.8) return true;
    } else if (Math.abs(z - zc) < wd) return true;
  }
  return false;
}
function headFront(lx, ly) {
  const ax = Math.abs(lx);
  // glowing four-point star on the forehead
  const sx = ax, sy = ly - 0.125;
  if ((sx < 0.008 * (1 - Math.abs(sy) / 0.05) * 2 && Math.abs(sy) < 0.05) || (Math.abs(sy) < 0.008 * (1 - sx / 0.04) * 2 && sx < 0.04)) return 2;
  // wedges coming in from the sides of the face (forehead, beside the eyes)
  for (const [y0, len, w] of [[0.15, 0.09, 0.016], [0.07, 0.06, 0.013], [-0.025, 0.125, 0.02], [-0.085, 0.11, 0.017]]) {
    const d = clamp01((0.235 - ax) / len);
    if (ax > 0.235 - len && Math.abs(ly - y0 + 0.1 * (0.235 - ax)) < w * (1 - 0.8 * d * d) + 0.002) return 1;
  }
  // bars running down the forehead toward the brow (tapering downward)
  if (ly > 0.1 && ly < 0.3) {
    const d = (ly - 0.1) / 0.1;
    const c = 0.085 + 0.035 * Math.min(d, 1.5);
    if (Math.abs(ax - c) < 0.003 + 0.012 * Math.min(d, 1.2)) return 1;
  }
  // centre forehead chevron above the star
  if (ly > 0.18 && ly < 0.3 && Math.abs(ly - 0.19 - 0.6 * ax) < 0.012 * (1 - ax / 0.07) && ax < 0.07) return 1;
  return 0;
}
function headSide(lz, ly) {
  for (const [y0, z1] of [[0.1, -0.02], [0.035, 0.035], [-0.035, 0.17], [-0.1, 0.15]]) {
    const d = clamp01((lz + 0.22) / (z1 + 0.22));
    if (lz < z1 && Math.abs(ly - y0 - 0.08 * (lz + 0.22)) < 0.02 * (1 - d) + 0.002) return 1;
  }
  return 0;
}
function headTop(lx, lz) {
  const ax = Math.abs(lx);
  if (lz > -0.17 && lz < 0.1) {
    const d = clamp01((0.1 - lz) / 0.27);
    const c = 0.085 + 0.03 * d;
    if (Math.abs(ax - c) < 0.016 * (1 - d) + 0.003) return 1;
  }
  if (Math.abs(lz + 0.14) < 0.016 * (1 - ax / 0.25)) return 1;
  return 0;
}
function legStripe(lu, y, bands) {
  const au = Math.abs(lu);
  for (const [y0, w] of bands) if (Math.abs(y - y0 - 0.25 * au) < w * (1 - au / 0.11)) return true;
  return false;
}
const FRONT_BANDS = [[0.35, 0.026]];
const BACK_BANDS = [[0.42, 0.028], [0.29, 0.024]];

// colour of fur at (a,b) given stripe flag s (0 none, 1 pink, 2 star mark) and gradient t
// returns [rgb, glowRgb|null]
function fur(s, t, a, b, seed, starCell = 0.075) {
  if (s === 2) return [[255, 236, 160], [235, 190, 110]];
  if (s === 3) return [lerp3(indigo(t), NEB, nebula(a, b) * 0.8), null]; // plain fur, no stars
  if (s) return [pink(t), dim(pink(t), 0.42)];
  if (starAt(a, b, starCell * 1.12, 0.021, seed)) return [STAR, dim(STAR, 0.5)];
  const base = lerp3(indigo(t), NEB, nebula(a, b) * 0.8);
  return [base, null];
}

// ---------------- atlas regions ----------------
const REG = {
  bodySide: { x: 0, y: 256, w: 512, h: 256, a: [-0.52, 0.38], b: [0.68, 0.12],
    col: (z, y) => fur(bodyStripe(z, y) ? 1 : 0, (0.62 - y) / 0.46, z, y, 1) },
  bodyTop: { x: 512, y: 256, w: 512, h: 256, a: [-0.52, 0.38], b: [-0.26, 0.26],
    col: (z, x) => fur(bodyStripe(z, SPINE, true) ? 1 : 0, 0, z, Math.abs(x), 2) },
  headFront: { x: 0, y: 512, w: 256, h: 256, a: [-0.28, 0.28], b: [0.28, -0.24],
    col: (x, ly) => fur(headFront(x, ly) || (Math.abs(x) < 0.07 ? 3 : 0), (0.2 - ly) / 0.42 * 0.8, Math.abs(x) + 0.31, ly, 3, 0.08) },
  headSide: { x: 256, y: 512, w: 256, h: 256, a: [-0.26, 0.26], b: [0.28, -0.24],
    col: (lz, ly) => fur(headSide(lz, ly), (0.2 - ly) / 0.42 * 0.8, lz, ly, 4, 0.065) },
  headTop: { x: 512, y: 512, w: 256, h: 256, a: [-0.28, 0.28], b: [-0.26, 0.26],
    col: (x, lz) => fur(headTop(x, lz), 0, Math.abs(x) + 0.31, lz, 5, 0.065) },
  legF: { x: 768, y: 512, w: 128, h: 256, a: [-0.13, 0.13], b: [0.62, 0.0],
    col: (u, y) => fur(legStripe(u, y, FRONT_BANDS) ? 1 : 0, (0.5 - y) / 0.5, Math.abs(u) + 0.4, y, 6, 0.07) },
  legB: { x: 896, y: 512, w: 128, h: 256, a: [-0.16, 0.16], b: [0.62, 0.0],
    col: (u, y) => fur(legStripe(u, y, BACK_BANDS) ? 1 : 0, (0.5 - y) / 0.5, Math.abs(u) + 0.4, y, 7, 0.07) },
};
// true when makeAtlas is building the emissive map (canvas pre-filled black, only glow swatches drawn)
const isGlowPass = (g, x, y) => g.getImageData(x + 1, y + 1, 1, 1).data[0] === 0;
function drawRegions(g) {
  const glowPass = isGlowPass(g, REG.bodySide.x, REG.bodySide.y);
  for (const r of Object.values(REG)) {
    const img = g.createImageData(r.w, r.h);
    for (let py = 0; py < r.h; py++) for (let px = 0; px < r.w; px++) {
      const acc = [0, 0, 0];
      for (const [ox, oy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
        const a = r.a[0] + ((px + ox) / r.w) * (r.a[1] - r.a[0]);
        const b = r.b[0] + ((py + oy) / r.h) * (r.b[1] - r.b[0]);
        const [c, gl] = r.col(a, b);
        const use = glowPass ? (gl || [0, 0, 0]) : c;
        for (let k = 0; k < 3; k++) acc[k] += use[k] / 4;
      }
      const o = (py * r.w + px) * 4;
      img.data[o] = acc[0]; img.data[o + 1] = acc[1]; img.data[o + 2] = acc[2]; img.data[o + 3] = 255;
    }
    g.putImageData(img, r.x, r.y);
  }
}
const regUV = (r, a, b) => {
  const fa = clamp01((a - r.a[0]) / (r.a[1] - r.a[0])), fb = clamp01((b - r.b[0]) / (r.b[1] - r.b[0]));
  return [(r.x + 3 + fa * (r.w - 6)) / 1024, (r.y + 3 + fb * (r.h - 6)) / 1024];
};

// tail: indigo with glowing pink bands, pink glowing tip
function drawTail(g, x, y) {
  const glowPass = isGlowPass(g, x, y);
  for (let py = 0; py < 128; py++) {
    const t = clamp01((py - 16) / 96);
    const band = t > 0.84 || [0.14, 0.3, 0.45, 0.59, 0.72].some((c) => Math.abs(t - c) < 0.034 + 0.01 * t);
    const c = band ? pink(0.2) : lerp3(indigo(0.25 + 0.4 * t), NEB, 0.25 * Math.sin(t * 9) ** 2);
    g.fillStyle = hex(glowPass ? (band ? dim(pink(0.2), 0.42) : [0, 0, 0]) : c);
    g.fillRect(x, y + py, 128, 1);
  }
}
// solid gradient swatch that glows at a reduced strength (k) in the emissive map
const glowCell = (i, top, bot, k) => ({ i, glow: true, draw(g, x, y) {
  const gp = isGlowPass(g, x, y);
  const T = top.match(/\w\w/g).map((h) => parseInt(h, 16)), B = bot.match(/\w\w/g).map((h) => parseInt(h, 16));
  for (let py = 0; py < 128; py++) {
    const c = lerp3(T, B, (py - 16) / 96);
    g.fillStyle = hex(gp ? dim(c, k) : c); g.fillRect(x, y + py, 128, 1);
  }
} });

export const PALETTE = {
  indigo: { i: 0, top: hex(IN_TOP), bot: hex(IN_BOT) },
  lav: { i: 1, top: '#E4DAFF', bot: '#A99BEA' },        // pale lavender chest / cheek shards
  muzzle: { i: 2, top: '#EEE6FF', bot: '#BDB0F0' },
  nose: { i: 3, top: '#2E2450', bot: '#120C26' },
  eye: { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white: { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  mouth: { i: 6, top: '#2A1A44', bot: '#160C28' },
  earIn: glowCell(7, '#FF9BE6', '#E85BC4', 0.35),
  brow: { i: 8, top: '#5A4AD0', bot: '#30249A' },
  paw: { i: 9, top: '#E2D8FF', bot: '#9A8AE0' },
  gold: { i: 10, top: '#FFE27A', bot: '#E09A1C' },
  tail: { i: 11, glow: true, draw: drawTail },
  gem: glowCell(12, '#FFB0EE', '#FF3FB4', 0.55),
  pinkGlow: glowCell(13, '#FF9AE8', '#FF52C4', 0.45),
  stripes: { i: 16, glow: true, draw: drawRegions }, // paints every REG rect (rows 2..5)
};
const SW = PALETTE;

function project(g, pick) {
  const p = g.attributes.position, uv = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    n.subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const [r, f] = pick(n);
    for (const v of [a, b, c]) uv.push(...regUV(r, ...f(v)));
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
const bodyPaint = (g) => project(g, (n) =>
  n.y > 0.8 ? [REG.bodyTop, (v) => [v.z, v.x]] : [REG.bodySide, (v) => [v.z, v.y]]);
const headPaint = (g) => project(g, (n) => {
  const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
  if (n.y > 0 && ay >= ax && ay >= az * 0.8) return [REG.headTop, (v) => [v.x, v.z - H.z]];
  if (az >= ax) return [REG.headFront, (v) => [v.x, v.y - H.y]];
  return [REG.headSide, (v) => [v.z - H.z, v.y - H.y]];
});
const legPaint = (g, reg, cx, cz) => project(g, (n) =>
  Math.abs(n.z) > Math.abs(n.x) ? [reg, (v) => [v.x - cx, v.y]] : [reg, (v) => [v.z - cz, v.y]]);

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const lav = (g, lo, hi) => paint(g, SW.lav, lo === undefined ? 'flat' : 'y', lo === undefined ? null : [lo, hi]);
  const gold = (g, lo, hi) => paint(g, SW.gold, 'y', lo === undefined ? null : [lo, hi]);

  // ================= TORSO =================
  C.push(bodyPaint(hull([
    ...ring(V(0, 0.41, -0.46), 0.11, 0.1, 10, 'z'),
    ...ring(V(0, 0.4, -0.4), 0.18, 0.165, 10, 'z'),
    ...ring(V(0, 0.39, -0.22), 0.195, 0.18, 10, 'z'),
    ...ring(V(0, 0.39, -0.02), 0.2, 0.185, 10, 'z'),
    ...ring(V(0, 0.41, 0.16), 0.205, 0.19, 10, 'z'),
    ...ring(V(0, 0.45, 0.27), 0.155, 0.145, 10, 'z'),
  ])));
  C.push(headPaint(hull([...ring(V(0, 0.46, 0.2), 0.15, 0.14, 10, 'y'), ...ring(V(0, 0.64, 0.3), 0.16, 0.12, 10, 'y')])));

  // ================= LEGS =================
  const FL = { x: 0.16, z: 0.2 };
  S.push(legPaint(hull([...ring(V(FL.x, 0.06, FL.z + 0.01), 0.084, 0.082, 8), ...ring(V(FL.x - 0.004, 0.2, FL.z), 0.09, 0.09, 8),
    ...ring(V(FL.x - 0.02, 0.38, FL.z - 0.02), 0.104, 0.118, 8), ...ring(V(FL.x - 0.03, 0.48, FL.z - 0.03), 0.072, 0.092, 8)]), REG.legF, FL.x, FL.z));
  const BL = { x: 0.165, z: -0.3 };
  S.push(legPaint(hull([...ring(V(BL.x - 0.015, 0.45, BL.z + 0.02), 0.14, 0.14, 8, 'x'),
    ...ring(V(BL.x + 0.005, 0.45, BL.z + 0.02), 0.12, 0.12, 8, 'x'),
    ...ring(V(BL.x + 0.005, 0.2, BL.z - 0.03), 0.086, 0.09, 8)]), REG.legB, BL.x, BL.z));
  S.push(legPaint(hull([...ring(V(BL.x + 0.005, 0.22, BL.z - 0.03), 0.083, 0.088, 8), ...ring(V(BL.x + 0.008, 0.06, BL.z + 0.0), 0.08, 0.078, 8)]),
    REG.legB, BL.x, BL.z));
  // paws: lavender block + 4 toes with little gold claws
  const paw = (x, z, s = 1) => {
    S.push(paint(hull(cbox(V(x, 0.045, z), 0.08 * s, 0.045, 0.074 * s, 0.024)), SW.paw, 'y', [0, 0.1]));
    for (const dx of [-0.054, -0.018, 0.018, 0.054]) {
      S.push(paint(hull(cbox(V(x + dx * s, 0.036, z + 0.068 * s), 0.02 * s, 0.036, 0.03, 0.01)), SW.paw, 'y', [0, 0.1]));
      S.push(gold(hull([V(x + dx * s - 0.011, 0.004, z + 0.09 * s), V(x + dx * s + 0.011, 0.004, z + 0.09 * s),
        V(x + dx * s - 0.009, 0.026, z + 0.088 * s), V(x + dx * s + 0.009, 0.026, z + 0.088 * s),
        V(x + dx * s, 0.004, z + 0.09 * s + 0.026), V(x + dx * s, 0.016, z + 0.09 * s + 0.022)]), 0, 0.03));
    }
  };
  paw(FL.x, FL.z + 0.02, 1.18);
  paw(BL.x + 0.008, BL.z + 0.02, 1.12);
  // gold cuffs with a pink gem on the front legs
  const cuff = (cx, cy, cz, r) => {
    S.push(gold(hull([...ring(V(cx, cy - 0.022, cz), r, r, 8), ...ring(V(cx, cy + 0.022, cz), r, r, 8),
      ...ring(V(cx, cy, cz), r + 0.012, r + 0.012, 8)]), cy - 0.03, cy + 0.03));
    S.push(paint(hull([V(cx, cy + 0.022, cz + r + 0.01), V(cx, cy - 0.022, cz + r + 0.01), V(cx + 0.018, cy, cz + r + 0.01),
      V(cx - 0.018, cy, cz + r + 0.01), V(cx, cy, cz + r + 0.026)]), SW.gem, 'y'));
  };
  cuff(FL.x - 0.002, 0.15, FL.z + 0.005, 0.094);

  // ================= CHEST RUFF (lavender shards with pink-glow tips) =================
  C.push(paint(blob(1, V(0, 0.48, 0.29), V(0.15, 0.15, 0.09), { jitter: 0.18 }), SW.lav, 'y', [0.28, 0.66]));
  C.push(lav(shard(V(0, 0.37, 0.3), V(0, -1, 0.35), 0.06, 0.12)));
  C.push(lav(shard(V(0, 0.47, 0.35), V(0, -0.7, 1), 0.065, 0.085)));
  for (const [b, d, w, l] of [
    [V(0.06, 0.36, 0.3), V(0.25, -1, 0.35), 0.055, 0.11],
    [V(0.115, 0.39, 0.28), V(0.6, -1, 0.3), 0.05, 0.1],
    [V(0.065, 0.47, 0.34), V(0.35, -0.7, 1), 0.055, 0.08],
    [V(0.13, 0.47, 0.3), V(0.8, -0.9, 0.5), 0.055, 0.08],
  ]) S.push(lav(shard(b, d, w, l)));

  // gold four-point star medallion with a glowing pink gem, pinned on the chest ruff
  {
    const M = V(0, 0.45, 0.425);
    const dia = (hx, hy) => gold(hull([V(0, M.y + hy, M.z), V(0, M.y - hy, M.z), V(hx, M.y, M.z), V(-hx, M.y, M.z),
      V(0, M.y + hy, M.z - 0.02), V(0, M.y - hy, M.z - 0.02), V(hx, M.y, M.z - 0.02), V(-hx, M.y, M.z - 0.02),
      V(0, M.y, M.z + 0.016)]), M.y - 0.06, M.y + 0.06);
    C.push(dia(0.03, 0.08), dia(0.072, 0.03));
    C.push(paint(blob(0, V(0, M.y, M.z + 0.012), V(0.024, 0.024, 0.014)), SW.gem, 'y'));
  }

  // ================= HEAD (scaled up about the neck joint at the end) =================
  const c0 = C.length, s0 = S.length;
  C.push(headPaint(hull([
    ...cbox(V(0, H.y - 0.01, H.z), H.hx, H.hy - 0.01, H.hz, 0.07),
    ...ring(V(0, H.y + 0.205, H.z - 0.01), 0.15, 0.12, 10, 'y'),
    ...ring(V(0, H.y + 0.02, H.z - 0.2), 0.15, 0.12, 10, 'z'),
    ...ring(V(0, H.y + 0.06, H.z - 0.16), 0.2, 0.15, 10, 'z'),
    V(0.245, H.y - 0.07, H.z + 0.05), V(-0.245, H.y - 0.07, H.z + 0.05),
    V(0.225, H.y - 0.12, H.z + 0.02), V(-0.225, H.y - 0.12, H.z + 0.02),
  ])));
  const FZ = H.z + H.hz;

  // lavender jowls with shards sweeping out & down
  S.push(paint(hull([
    V(0.1, H.y - 0.09, FZ + 0.01), V(0.19, H.y - 0.075, FZ - 0.035), V(0.25, H.y - 0.1, H.z + 0.05),
    V(0.23, H.y - 0.16, H.z + 0.05), V(0.14, H.y - 0.18, FZ - 0.03), V(0.09, H.y - 0.165, FZ + 0.01),
    V(0.215, H.y - 0.08, H.z - 0.0), V(0.205, H.y - 0.15, H.z - 0.0), V(0.12, H.y - 0.16, H.z + 0.02),
  ]), SW.lav, 'y', [H.y - 0.18, H.y - 0.06]));
  for (const [b, d, w, l] of [
    [V(0.24, H.y - 0.095, H.z + 0.05), V(1, -0.25, 0.05), 0.042, 0.075],
    [V(0.22, H.y - 0.15, H.z + 0.06), V(0.8, -0.8, 0.05), 0.04, 0.075],
    [V(0.16, H.y - 0.175, H.z + 0.09), V(0.4, -1, 0.1), 0.04, 0.065],
    [V(0.215, H.y - 0.12, H.z - 0.0), V(0.9, -0.5, -0.4), 0.036, 0.065],
    // big fanned cheek ruff, sweeping out and back like a tiger's
    [V(0.225, H.y - 0.06, H.z + 0.01), V(1, 0.05, -0.35), 0.066, 0.11],
    [V(0.23, H.y - 0.115, H.z + 0.03), V(1, -0.45, -0.25), 0.07, 0.12],
    [V(0.195, H.y - 0.16, H.z + 0.04), V(0.75, -1, -0.2), 0.064, 0.11],
    [V(0.205, H.y - 0.02, H.z - 0.06), V(0.85, 0.2, -0.7), 0.055, 0.095],
  ]) S.push(lav(shard(b, d, w, l)));

  // muzzle, chin, nose, mouth
  C.push(paint(hull([...cbox(V(0, H.y - 0.08, FZ + 0.035), 0.115, 0.065, 0.075, 0.03),
    V(0.075, H.y - 0.01, FZ - 0.03), V(-0.075, H.y - 0.01, FZ - 0.03)]), SW.muzzle, 'y', [H.y - 0.15, H.y]));
  C.push(paint(hull(cbox(V(0, H.y - 0.142, FZ + 0.005), 0.085, 0.03, 0.07, 0.015)), SW.lav, 'flat'));
  C.push(paint(hull([...cbox(V(0, H.y - 0.035, FZ + 0.108), 0.05, 0.022, 0.02, 0.01),
    V(0, H.y - 0.075, FZ + 0.1), V(0.02, H.y - 0.065, FZ + 0.1), V(-0.02, H.y - 0.065, FZ + 0.1)]), SW.nose, 'y'));
  C.push(paint(hull(cbox(V(0, H.y - 0.095, FZ + 0.105), 0.006, 0.022, 0.006, 0.002)), SW.mouth, 'flat'));
  S.push(paint(hull([V(0, H.y - 0.117, FZ + 0.11), V(0, H.y - 0.105, FZ + 0.11), V(0.06, H.y - 0.127, FZ + 0.098),
    V(0.06, H.y - 0.117, FZ + 0.098), V(0, H.y - 0.117, FZ + 0.1), V(0.06, H.y - 0.123, FZ + 0.085)]), SW.mouth, 'flat'));

  // fierce eyes
  const E = V(0.094, H.y + 0.03, 0);
  S.push(paint(hull(plate([[-0.044, 0.004], [0.048, 0.034], [0.054, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.048, -0.016]],
    E, FZ - 0.01, FZ + 0.012)), SW.white, 'flat'));
  S.push(paint(hull(plate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]],
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.014, FZ + 0.021)), SW.white, 'flat'));
  // heavy brow
  S.push(paint(hull([
    V(0.03, E.y + 0.012, FZ + 0.03), V(0.032, E.y + 0.05, FZ + 0.02),
    V(0.165, E.y + 0.05, FZ - 0.01), V(0.165, E.y + 0.09, FZ - 0.025),
    V(0.03, E.y + 0.012, FZ - 0.03), V(0.032, E.y + 0.06, FZ - 0.04),
    V(0.165, E.y + 0.05, FZ - 0.06), V(0.165, E.y + 0.092, FZ - 0.07),
  ]), SW.brow, 'y'));

  // rounded tiger ears with glowing pink inners
  const EA = V(0.158, H.y + 0.172, H.z - 0.05);
  S.push(paint(hull([...ring(EA, 0.08, 0.08, 7, 'z', -Math.PI / 2 + 0.2), ...ring(V(EA.x + 0.005, EA.y - 0.01, EA.z - 0.05), 0.085, 0.08, 7, 'z', -Math.PI / 2 + 0.2),
    V(EA.x + 0.02, EA.y + 0.088, EA.z - 0.02)]), SW.indigo, 'y', [EA.y - 0.08, EA.y + 0.1]));
  S.push(paint(hull([...ring(V(EA.x, EA.y - 0.005, EA.z + 0.012), 0.05, 0.05, 7, 'z', -Math.PI / 2 + 0.2),
    ...ring(V(EA.x, EA.y - 0.005, EA.z - 0.01), 0.05, 0.05, 7, 'z', -Math.PI / 2 + 0.2), V(EA.x + 0.015, EA.y + 0.07, EA.z + 0.0)]),
  SW.earIn, 'y', [EA.y - 0.05, EA.y + 0.07]));

  // ================= FLOATING GOLD CROWN =================
  const CR = V(0, H.y + 0.315, H.z - 0.01), R = 0.122, NS = 10;
  for (let k = 0; k < NS; k++) {
    const a0 = (2 * Math.PI * k) / NS, a1 = (2 * Math.PI * (k + 1)) / NS;
    const pts = [];
    for (const a of [a0, a1]) for (const rr of [R - 0.018, R]) for (const dy of [-0.022, 0.022])
      pts.push(V(CR.x + Math.sin(a) * rr, CR.y + dy, CR.z + Math.cos(a) * rr));
    C.push(gold(hull(pts), CR.y - 0.03, CR.y + 0.09));
  }
  // crown points (5: front, two front-sides, two back-sides) with star tips
  for (let k = 0; k < 5; k++) {
    const a = (2 * Math.PI * k) / 5, big = k === 0;
    const bx = Math.sin(a) * (R - 0.009), bz = Math.cos(a) * (R - 0.009);
    const h = big ? 0.095 : 0.07, w = big ? 0.038 : 0.03;
    const tx = Math.cos(a), tz = -Math.sin(a); // tangent
    const g = gold(hull([
      V(CR.x + bx + tx * w, CR.y + 0.015, CR.z + bz + tz * w), V(CR.x + bx - tx * w, CR.y + 0.015, CR.z + bz - tz * w),
      V(CR.x + bx + tx * w + Math.sin(a) * 0.012, CR.y + 0.015, CR.z + bz + tz * w + Math.cos(a) * 0.012),
      V(CR.x + bx - tx * w + Math.sin(a) * 0.012, CR.y + 0.015, CR.z + bz - tz * w + Math.cos(a) * 0.012),
      V(CR.x + bx * 1.08, CR.y + 0.015 + h, CR.z + bz * 1.08),
      V(CR.x + bx * 1.08 + Math.sin(a) * 0.012, CR.y + 0.015 + h, CR.z + bz * 1.08 + Math.cos(a) * 0.012),
    ]), CR.y - 0.03, CR.y + 0.11);
    // gem orb on the tip
    const gm = paint(blob(0, V(CR.x + bx * 1.1, CR.y + 0.025 + h, CR.z + bz * 1.1), V(1, 1, 1).multiplyScalar(big ? 0.022 : 0.016)), SW.gem, 'y');
    if (k === 0) { C.push(g, gm); }
    else if (k < 3) { S.push(g, gm); }
  }
  // glowing orbit-halo ring around the crown (tilted, like a planet's ring)
  {
    const NR = 16, RR = 0.195, tilt = -0.1, cy = CR.y - 0.008;
    const P = (a, r, dy) => { const x = Math.sin(a) * r, z = Math.cos(a) * r;
      return V(CR.x + x, cy + dy + z * Math.sin(tilt), CR.z + z * Math.cos(tilt)); };
    const seg = (ac) => { const q = [];
      for (const a of [ac - Math.PI / NR, ac + Math.PI / NR]) for (const [r, dy] of [[RR - 0.026, 0], [RR, 0.011], [RR, -0.011], [RR + 0.012, 0]]) q.push(P(a, r, dy));
      return paint(hull(q), SW.pinkGlow, 'y'); };
    C.push(seg(0), seg(Math.PI));                                   // segments on the centre line
    for (let k = 1; k < NR / 2; k++) S.push(seg((2 * Math.PI * k) / NR)); // right side, auto-mirrored
  }
  // big front gem on the band
  C.push(paint(hull([V(0, CR.y + 0.03, CR.z + R + 0.004), V(0, CR.y - 0.03, CR.z + R + 0.004), V(0.022, CR.y, CR.z + R + 0.004),
    V(-0.022, CR.y, CR.z + R + 0.004), V(0, CR.y, CR.z + R + 0.024)]), SW.gem, 'y'));

  // big head: scale skull, face, ears, ruff and crown/halo about the neck joint
  {
    const PV = V(0, 0.56, 0.3), K = 1.13;
    for (const g of [...C.slice(c0), ...S.slice(s0)]) {
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) p.setXYZ(i, PV.x + (p.getX(i) - PV.x) * K, PV.y + (p.getY(i) - PV.y) * K, PV.z + (p.getZ(i) - PV.z) * K);
    }
  }

  // ================= TAIL (long, pink-banded, S-curl up, glowing tuft) =================
  const tailPts = [V(0, 0.47, -0.42), V(0, 0.53, -0.55), V(0, 0.65, -0.62), V(0, 0.77, -0.62), V(0, 0.84, -0.67), V(0, 0.87, -0.75)];
  C.push(paint(tube(curveSamples(tailPts, 12, (t) => 0.08 + 0.012 * t), { seg: 6, axis: X, phase: 0, capStart: 0, capEnd: 0.03 }), SW.tail, 'len'));
  // glowing pink flame-tuft at the tip, fanning back and up
  const TT = V(0, 0.875, -0.77);
  C.push(paint(shard(TT, V(0, 0.3, -1), 0.065, 0.12, 4), SW.pinkGlow, 'flat'));
  C.push(paint(shard(V(0, 0.87, -0.75), V(0, 1, -0.4), 0.06, 0.1, 4), SW.pinkGlow, 'flat'));
  S.push(paint(shard(V(0.03, 0.865, -0.76), V(0.8, 0.5, -0.5), 0.055, 0.09, 4), SW.pinkGlow, 'flat'));

  // crouch: compress the legs a little so the body sits lower
  for (const g of [...C, ...S]) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      p.setY(i, y - 0.05 * clamp01((y - 0.09) / 0.22));
    }
    g.computeVertexNormals();
  }
  return assemble(C, S);
}

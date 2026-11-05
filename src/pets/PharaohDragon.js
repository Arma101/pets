// Pharaoh Dragon (LEGENDARY): chunky faceted gold dragon with royal-blue back stripes, nemes headdress,
// gold crown with uraeus, gold-boned lapis wings, ornate gold armour with lapis gems, glowing eyes.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

const GOLD_T = '#FFD84E', GOLD_B = '#DE9E1C';     // body gold
const BLUE_T = '#3D6CF0', BLUE_B = '#1A3699';     // royal blue / lapis
const TRIM_T = '#FFF4A6', TRIM_B = '#EDB22C';     // bright metallic gold trim
const SAND_T = '#F7E2B5', SAND_B = '#D9B479';     // sandstone

const cellXY = (i) => [(i % 8) * 128, Math.floor(i / 8) * 128];
function vgrad(g, x, y, top, bot) {
  const gr = g.createLinearGradient(0, y + 8, 0, y + 120);
  gr.addColorStop(0, top); gr.addColorStop(1, bot);
  return gr;
}
// body: gold gradient with blue chevron stripes (u = position along the body, v = height)
const BODY_STRIPES = [0.14, 0.38, 0.62, 0.86];
function drawBodyStripes(g, x, y) {
  g.fillStyle = vgrad(g, x, y, GOLD_T, GOLD_B); g.fillRect(x, y, 128, 128);
  g.fillStyle = vgrad(g, x, y, BLUE_T, BLUE_B);
  for (const u of BODY_STRIPES) {
    const cx = x + 8 + u * 112, hw = 8.5;
    g.beginPath();
    g.moveTo(cx - hw, y); g.lineTo(cx + hw, y); g.lineTo(cx + hw, y + 8);
    g.lineTo(cx + 3.5, y + 8 + 0.86 * 112); g.lineTo(cx - 3.5, y + 8 + 0.86 * 112); g.lineTo(cx - hw, y + 8);
    g.closePath(); g.fill();
  }
}
// tail: full bands
const TAIL_BANDS = [0.2, 0.5, 0.8];
function drawTailBands(g, x, y) {
  g.fillStyle = vgrad(g, x, y, GOLD_T, GOLD_B); g.fillRect(x, y, 128, 128);
  g.fillStyle = vgrad(g, x, y, BLUE_T, BLUE_B);
  for (const u of TAIL_BANDS) { const cx = x + 8 + u * 112; g.fillRect(Math.round(cx - 9), y, 18, 128); }
}
// nemes cloth: horizontal blue / gold stripes
const NEMES_N = 7;
function drawNemes(g, x, y) {
  for (let k = 0; k < NEMES_N; k++) {
    const y0 = y + 8 + (k * 112) / NEMES_N, y1 = y + 8 + ((k + 1) * 112) / NEMES_N;
    const gr = g.createLinearGradient(0, y0, 0, y1);
    if (k % 2) { gr.addColorStop(0, BLUE_T); gr.addColorStop(1, '#244BC4'); }
    else { gr.addColorStop(0, TRIM_T); gr.addColorStop(1, '#F2BE3A'); }
    g.fillStyle = gr;
    g.fillRect(x, k === 0 ? y : y0, 128, (k === NEMES_N - 1 ? y + 128 : y1) - (k === 0 ? y : y0));
  }
}
// broad collar (usekh): concentric bands gold / lapis / sandstone / lapis / gold
const COLLAR = [TRIM_T, BLUE_T, SAND_T, '#2C55D6', '#F2BE3A'];
function drawCollar(g, x, y) {
  COLLAR.forEach((c, k) => {
    const y0 = y + 8 + (k * 112) / COLLAR.length, y1 = y + 8 + ((k + 1) * 112) / COLLAR.length;
    g.fillStyle = c;
    g.fillRect(x, k === 0 ? y : y0, 128, (k === COLLAR.length - 1 ? y + 128 : y1) - (k === 0 ? y : y0));
  });
}

export const PALETTE = {
  gold:    { i: 0, top: GOLD_T, bot: GOLD_B },
  goldDk:  { i: 1, top: '#F7C23A', bot: '#C98810' },
  trim:    { i: 2, top: TRIM_T, bot: TRIM_B },
  memb:    { i: 3, top: '#4F7DF5', bot: '#2346B8' },
  sand:    { i: 4, top: SAND_T, bot: SAND_B },
  lapis:   { i: 5, top: '#5C8BFF', bot: '#1C3AA6' },
  pupil:   { i: 6, top: '#0E2466', bot: '#081640' },
  nose:    { i: 7, top: '#6A3A10', bot: '#3E2008' },
  brow:    { i: 8, top: '#E38B1C', bot: '#A65508' },
  trimT:   { i: 9, top: TRIM_B, bot: TRIM_T },
  glow:    { i: 10, top: '#BFFBFF', bot: '#1FC8FF', glow: true },
  white:   { i: 11, top: '#FFFFFF', bot: '#F1F1F4' },
  stripes: { i: 16, draw: drawBodyStripes },
  bands:   { i: 17, draw: drawTailBands },
  nemes:   { i: 18, draw: drawNemes },
  collar:  { i: 19, draw: drawCollar },
};
const P = PALETTE;
const DROP = 0.035;

// custom UVs into a whole 128px cell (u, v in 0..1)
function cellUV(sw, u, v) {
  const [x, y] = cellXY(sw.i);
  const c = (a) => Math.min(1, Math.max(0, a));
  return [(x + 8 + c(u) * 112) / 1024, (y + 8 + c(v) * 112) / 1024];
}
function paintUV(g, sw, fn) {
  const p = g.attributes.position, uv = [];
  for (let i = 0; i < p.count; i++) uv.push(...cellUV(sw, ...fn(p.getX(i), p.getY(i), p.getZ(i), g.userData.t ? g.userData.t[i] : 0)));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const gold = (pts, lo = 0, hi = 1.0) => paint(hull(pts), P.gold, 'y', [lo, hi]);
  const trim = (g) => paint(g, P.trim, 'flat');
  const lapis = (g) => paint(g, P.lapis, 'y');
  // faceted gem: hexagonal cabochon sitting on a surface, facing n
  const gem = (c, n, r, h = 0.6) => {
    n = n.clone().normalize();
    const up = Math.abs(n.y) > 0.9 ? V(0, 0, 1) : V(0, 1, 0);
    const a = new THREE.Vector3().crossVectors(up, n).normalize(), b = new THREE.Vector3().crossVectors(n, a);
    const pts = [c.clone().addScaledVector(n, r * h)];
    for (let k = 0; k < 6; k++) {
      const t = (k / 6) * Math.PI * 2 + Math.PI / 6;
      const d = a.clone().multiplyScalar(Math.cos(t)).addScaledVector(b, Math.sin(t));
      pts.push(c.clone().addScaledVector(d, r));
      pts.push(c.clone().addScaledVector(d, r * 0.55).addScaledVector(n, r * h * 0.75));
      pts.push(c.clone().addScaledVector(d, r * 0.9).addScaledVector(n, -r * 0.6));
    }
    return lapis(hull(pts));
  };
  const stripeUV = (lo, hi) => (x, y, z) => [(0.27 - z) / 0.72, 1 - (y - lo) / (hi - lo)];

  // ================= BODY (striped) =================
  C.push(paintUV(hull([
    ...ring(V(0, 0.34, -0.4), 0.12, 0.12, 10, 'z'),
    ...ring(V(0, 0.34, -0.28), 0.2, 0.19, 10, 'z'),
    ...ring(V(0, 0.355, -0.12), 0.225, 0.215, 10, 'z'),
    ...ring(V(0, 0.38, 0.04), 0.225, 0.225, 10, 'z'),
    ...ring(V(0, 0.41, 0.16), 0.2, 0.21, 10, 'z'),
    ...ring(V(0, 0.44, 0.25), 0.13, 0.14, 10, 'z'),
  ]), P.stripes, stripeUV(0.16, 0.6)));
  // neck
  C.push(gold([...ring(V(0, 0.46, 0.15), 0.15, 0.14, 10, 'y'), ...ring(V(0, 0.68, 0.24), 0.13, 0.12, 10, 'y')], 0.35, 0.85));

  // ================= LEGS (short, thick) =================
  S.push(gold([...ring(V(0.17, 0.08, 0.22), 0.088, 0.088, 8), ...ring(V(0.17, 0.2, 0.2), 0.095, 0.098, 8),
    ...ring(V(0.15, 0.34, 0.14), 0.11, 0.12, 8)], 0.0, 0.6));
  S.push(paint(blob(0, V(0.165, 0.33, 0.14), V(0.12, 0.15, 0.135), { jitter: 0.1 }), P.gold, 'y', [0.0, 0.6]));
  S.push(paintUV(blob(1, V(0.175, 0.26, -0.17), V(0.13, 0.155, 0.17), { jitter: 0.12 }), P.stripes, stripeUV(0.16, 0.6)));
  S.push(gold([...ring(V(0.18, 0.24, -0.16), 0.09, 0.095, 8), ...ring(V(0.19, 0.13, -0.19), 0.08, 0.08, 8),
    ...ring(V(0.19, 0.08, -0.18), 0.078, 0.078, 8)], 0.0, 0.6));
  // feet: gold block + 3 bright gold claws
  const foot = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.055, z + 0.01), 0.09, 0.055, 0.08, 0.028)), P.goldDk, 'y', [0, 0.3]));
    for (const dx of [-0.056, 0, 0.056]) {
      const b = V(x + dx, 0.0, z + 0.08);
      S.push(trim(hull([
        V(b.x - 0.026, 0.0, b.z - 0.02), V(b.x + 0.026, 0.0, b.z - 0.02),
        V(b.x - 0.022, 0.055, b.z - 0.02), V(b.x + 0.022, 0.055, b.z - 0.02),
        V(b.x, 0.062, b.z + 0.0), V(b.x + dx * 0.15, 0.0, b.z + 0.075),
        V(b.x - 0.018, 0.0, b.z + 0.035), V(b.x + 0.018, 0.0, b.z + 0.035),
      ])));
    }
  };
  foot(0.175, 0.23);
  foot(0.195, -0.17);
  // armour cuffs (trim + lapis band)
  const cuff = (x, y, z, r) => {
    S.push(paint(hull([...ring(V(x, y - 0.03, z), r, r, 8), ...ring(V(x, y + 0.03, z), r + 0.004, r + 0.004, 8)]), P.trim, 'y', [y - 0.04, y + 0.04]));
    S.push(paint(hull([...ring(V(x, y - 0.012, z), r + 0.01, r + 0.01, 8), ...ring(V(x, y + 0.012, z), r + 0.01, r + 0.01, 8)]), P.lapis, 'flat'));
  };
  cuff(0.17, 0.15, 0.21, 0.1);
  cuff(0.19, 0.15, -0.19, 0.088);
  const nC = C.length, nS = S.length; // everything after this sits lower (shorter legs)

  // ================= BELLY PLATES (sandstone) =================
  const belly = [
    [0.52, 0.34, 0.105, 0.034, -0.15],
    [0.45, 0.335, 0.115, 0.034, 0.0],
    [0.38, 0.32, 0.115, 0.034, 0.2],
    [0.31, 0.29, 0.11, 0.034, 0.45],
    [0.25, 0.235, 0.105, 0.034, 0.85],
  ];
  for (const [y, z, w, l, t] of belly) {
    const up = V(0, Math.cos(t), -Math.sin(t)), n = V(0, Math.sin(t), Math.cos(t));
    const pts = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const c = V(0, y, z).addScaledVector(up, sy * l);
      pts.push(c.clone().addScaledVector(X, sx * w).addScaledVector(n, -0.07));
      pts.push(c.clone().addScaledVector(X, sx * (w - 0.01)).addScaledVector(n, -0.005));
      pts.push(c.clone().addScaledVector(X, sx * (w - 0.035)).addScaledVector(n, 0.012).addScaledVector(up, -sy * 0.006));
    }
    C.push(paint(hull(pts), P.sand, 'y', [0.2, 0.75]));
  }
  {
    const pts = [];
    for (const [y, z, w, l, t] of belly.slice(0, 4)) {
      const up = V(0, Math.cos(t), -Math.sin(t)), n = V(0, Math.sin(t), Math.cos(t));
      for (const sy of [-1, 1]) {
        const c = V(0, y, z).addScaledVector(up, sy * l);
        for (const sx of [-1, 1]) pts.push(c.clone().addScaledVector(X, sx * (w + 0.035)).addScaledVector(n, -0.04));
        pts.push(c.clone().addScaledVector(n, -0.16));
      }
    }
    C.push(gold(pts, 0.15, 0.85));
  }

  // ================= BROAD COLLAR (usekh) =================
  {
    const yT = 0.66, yB = 0.53;
    C.push(paintUV(hull([...ring(V(0, yT, 0.23), 0.15, 0.14, 12, 'y', 0), ...ring(V(0, yB, 0.2), 0.25, 0.22, 12, 'y', 0)]),
      P.collar, (x, y) => [0.5, (yT - y) / (yT - yB)]));
    // teardrop pendants along the lower front edge
    for (const a of [0, 0.42, 0.84]) {
      const px = Math.sin(a) * 0.245, pz = 0.2 + Math.cos(a) * 0.218;
      const g = hull([V(px - 0.022, yB + 0.012, pz - 0.01), V(px + 0.022, yB + 0.012, pz - 0.01), V(px, yB + 0.012, pz + 0.004),
        V(px - 0.016, yB - 0.03, pz + 0.008), V(px + 0.016, yB - 0.03, pz + 0.008), V(px, yB - 0.055, pz + 0.004), V(px, yB - 0.03, pz - 0.01)]);
      if (a === 0) C.push(trim(g)); else S.push(trim(g));
    }
    C.push(gem(V(0, yB + 0.035, 0.405), V(0, 0.4, 1), 0.03));
  }

  // ================= HEAD =================
  const H = { y: 0.81, z: 0.3 };
  C.push(gold([
    ...cbox(V(0, H.y, H.z), 0.205, 0.16, 0.16, 0.07),
    ...ring(V(0, H.y + 0.18, H.z - 0.03), 0.11, 0.1, 8, 'y'),
    V(0.215, H.y - 0.065, H.z + 0.02), V(-0.215, H.y - 0.065, H.z + 0.02),
  ], 0.55, 1.0));
  const FZ = H.z + 0.16;
  // snout: longer, stronger dragon muzzle
  C.push(gold([
    ...cbox(V(0, H.y - 0.085, FZ + 0.11), 0.115, 0.06, 0.13, 0.03),
    V(0.09, H.y - 0.02, FZ - 0.02), V(-0.09, H.y - 0.02, FZ - 0.02),
    V(0.065, H.y - 0.03, FZ + 0.22), V(-0.065, H.y - 0.03, FZ + 0.22),
  ], 0.6, 0.9));
  // lower jaw (sandstone)
  C.push(paint(hull(cbox(V(0, H.y - 0.155, FZ + 0.07), 0.095, 0.035, 0.125, 0.02)), P.sand, 'y', [0.6, 0.72]));
  // nostrils + mouth
  const NZ = 0.05, NY = -0.017, MY = -0.015;
  S.push(paint(hull([V(0.028, H.y - 0.008 + NY, FZ + 0.155 + NZ), V(0.062, H.y - 0.008 + NY, FZ + 0.15 + NZ), V(0.028, H.y - 0.022 + NY, FZ + 0.197 + NZ),
    V(0.062, H.y - 0.022 + NY, FZ + 0.195 + NZ), V(0.045, H.y - 0.03 + NY, FZ + 0.15 + NZ), V(0.045, H.y - 0.04 + NY, FZ + 0.19 + NZ)]), P.nose, 'flat'));
  S.push(paint(hull([V(0, H.y - 0.098 + MY, FZ + 0.197 + NZ), V(0, H.y - 0.088 + MY, FZ + 0.197 + NZ), V(0.08, H.y - 0.098 + MY, FZ + 0.197 + NZ),
    V(0.08, H.y - 0.088 + MY, FZ + 0.197 + NZ), V(0, H.y - 0.093 + MY, FZ + 0.18 + NZ), V(0.08, H.y - 0.093 + MY, FZ + 0.18 + NZ)]), P.nose, 'flat'));
  S.push(paint(hull([V(0.1, H.y - 0.098 + MY, FZ + 0.185 + NZ), V(0.1, H.y - 0.088 + MY, FZ + 0.185 + NZ), V(0.12, H.y - 0.098 + MY, FZ + 0.16 + NZ),
    V(0.12, H.y - 0.088 + MY, FZ + 0.16 + NZ), V(0.12, H.y - 0.118 + MY, FZ + 0.05), V(0.12, H.y - 0.108 + MY, FZ + 0.05),
    V(0.105, H.y - 0.1 + MY, FZ + 0.06), V(0.09, H.y - 0.093 + MY, FZ + 0.18 + NZ)]), P.nose, 'flat'));

  // glowing fierce eyes (25% bigger): almond with angry flat top, dark slit pupil, white-hot glint.
  // Tilted back toward the outer corner so they follow the head's chamfered front.
  const E = V(0.095, H.y + 0.04, 0), ES = 1.25, TL = 0.4;
  const sc = (a) => a.map(([u, v]) => [u * ES, v * ES]);
  S.push(paint(hull(plate(sc([[-0.05, 0.0], [0.052, 0.038], [0.06, -0.012], [0.022, -0.046], [-0.034, -0.042], [-0.052, -0.018]]),
    E, FZ - 0.03, FZ + 0.01, TL)), P.glow, 'y', [E.y - 0.06, E.y + 0.05]));
  S.push(paint(hull(plate(sc([[-0.012, 0.012], [0.012, 0.016], [0.014, -0.012], [0.004, -0.036], [-0.006, -0.036], [-0.014, -0.012]]),
    V(E.x - 0.002, E.y, 0), FZ + 0.0, FZ + 0.016, TL)), P.pupil, 'flat'));
  S.push(paint(hull(plate([[-0.0075, -0.0075], [0.0075, -0.0075], [0.0075, 0.0075], [-0.0075, 0.0075]],
    V(E.x + 0.022, E.y + 0.012, 0), FZ + 0.0 - TL * 0.02, FZ + 0.016 - TL * 0.02, TL)), P.white, 'flat'));
  // heavy brow (darker gold-orange)
  S.push(paint(hull([
    V(0.022, E.y + 0.012, FZ + 0.035), V(0.024, E.y + 0.065, FZ + 0.025),
    V(0.19, E.y + 0.065, FZ - 0.025), V(0.19, E.y + 0.115, FZ - 0.04),
    V(0.022, E.y + 0.012, FZ - 0.03), V(0.024, E.y + 0.075, FZ - 0.04),
    V(0.19, E.y + 0.065, FZ - 0.075), V(0.19, E.y + 0.115, FZ - 0.085),
  ]), P.brow, 'y'));

  // ================= NEMES HEADDRESS =================
  const NT = H.y + 0.26, NSPAN = 0.62;
  const nemes = (g) => paintUV(g, P.nemes, (x, y) => [0.5, (NT - y) / NSPAN]);
  C.push(nemes(hull([
    V(0.15, H.y + 0.155, FZ + 0.0), V(-0.15, H.y + 0.155, FZ + 0.0), V(0.07, H.y + 0.16, FZ + 0.012), V(-0.07, H.y + 0.16, FZ + 0.012),
    ...ring(V(0, H.y + 0.25, H.z - 0.03), 0.16, 0.15, 8, 'y'),
    V(0.235, H.y + 0.12, H.z + 0.08), V(-0.235, H.y + 0.12, H.z + 0.08),
    V(0.275, H.y - 0.03, H.z + 0.05), V(-0.275, H.y - 0.03, H.z + 0.05),
    V(0.27, H.y - 0.05, H.z - 0.14), V(-0.27, H.y - 0.05, H.z - 0.14),
    V(0.22, H.y + 0.15, H.z - 0.18), V(-0.22, H.y + 0.15, H.z - 0.18),
    V(0.13, H.y - 0.09, H.z - 0.21), V(-0.13, H.y - 0.09, H.z - 0.21),
    V(0.14, H.y + 0.19, H.z - 0.2), V(-0.14, H.y + 0.19, H.z - 0.2),
  ])));
  // lappets falling in front of the shoulders
  S.push(nemes(hull([
    V(0.18, H.y - 0.0, H.z - 0.03), V(0.27, H.y - 0.0, H.z - 0.03), V(0.18, H.y - 0.0, H.z + 0.05), V(0.27, H.y - 0.0, H.z + 0.05),
    V(0.14, 0.54, 0.27), V(0.275, 0.54, 0.25), V(0.14, 0.54, 0.325), V(0.275, 0.54, 0.305),
  ])));
  // queue (braided tail of the cloth) behind the head
  C.push(nemes(hull([...cbox(V(0, H.y - 0.04, H.z - 0.19), 0.13, 0.09, 0.035, 0.012),
    ...cbox(V(0, H.y - 0.25, H.z - 0.25), 0.08, 0.03, 0.03, 0.01)])));

  // forehead band (gold) with lapis gem
  {
    const pts = [];
    for (const [x, z] of [[0, FZ + 0.03], [0.09, FZ + 0.022], [0.16, FZ + 0.0], [0.215, FZ - 0.06], [0.245, H.z + 0.02]])
      for (const sx of [-1, 1]) for (const [dy, dz] of [[0.0, 0], [0.05, -0.005], [0.0, -0.04], [0.05, -0.045]])
        pts.push(V(sx * x, H.y + 0.135 + dy - (x > 0.2 ? 0.02 : 0), z + dz));
    C.push(paint(hull(pts), P.trim, 'y', [H.y + 0.12, H.y + 0.2]));
    C.push(gem(V(0, H.y + 0.16, FZ + 0.03), V(0, 0.1, 1), 0.026));
  }
  // crown: one bold faceted gold block crown with a lapis band, uraeus cobra at the front
  {
    const cy = H.y + 0.25, cz = H.z - 0.03;
    C.push(paint(hull([...ring(V(0, cy - 0.02, cz), 0.14, 0.13, 8, 'y'), ...ring(V(0, cy + 0.06, cz), 0.155, 0.145, 8, 'y'),
      ...ring(V(0, cy + 0.13, cz - 0.005), 0.12, 0.11, 8, 'y'), V(0, cy + 0.15, cz - 0.005)]), P.trim, 'y', [cy - 0.03, cy + 0.15]));
    C.push(paint(hull([...ring(V(0, cy + 0.005, cz), 0.152, 0.142, 8, 'y'), ...ring(V(0, cy + 0.04, cz), 0.158, 0.148, 8, 'y')]), P.lapis, 'flat'));
    // chunky crown points on the rim (one mirrored pair)
    for (const a of [1.15]) {
      const d = V(Math.sin(a), 0, Math.cos(a));
      S.push(trim(hull([V(d.x * 0.1, cy + 0.11, cz + d.z * 0.09), V(d.x * 0.135, cy + 0.07, cz + d.z * 0.125),
        V(d.x * 0.1 + d.z * 0.05, cy + 0.1, cz + d.z * 0.09 - d.x * 0.05), V(d.x * 0.1 - d.z * 0.05, cy + 0.1, cz + d.z * 0.09 + d.x * 0.05),
        V(d.x * 0.14 + d.z * 0.05, cy + 0.06, cz + d.z * 0.13 - d.x * 0.05), V(d.x * 0.14 - d.z * 0.05, cy + 0.06, cz + d.z * 0.13 + d.x * 0.05),
        V(d.x * 0.15, cy + 0.2, cz + d.z * 0.12)])));
    }
    // uraeus: rearing cobra on the crown front
    C.push(paint(tube(curveSamples([V(0, cy - 0.01, cz + 0.14), V(0, cy + 0.05, cz + 0.17), V(0, cy + 0.13, cz + 0.16)], 4,
      (t) => 0.034 - 0.008 * t), { seg: 6, axis: X, capEnd: 0.0 }), P.trim, 'flat'));
    C.push(paint(hull([V(0.075, cy + 0.08, cz + 0.165), V(-0.075, cy + 0.08, cz + 0.165), V(0.055, cy + 0.18, cz + 0.17), V(-0.055, cy + 0.18, cz + 0.17),
      V(0, cy + 0.21, cz + 0.165), V(0, cy + 0.03, cz + 0.17), V(0.05, cy + 0.12, cz + 0.13), V(-0.05, cy + 0.12, cz + 0.13),
      V(0, cy + 0.14, cz + 0.12)]), P.trim, 'y', [cy + 0.03, cy + 0.21]));
    C.push(paint(hull([...cbox(V(0, cy + 0.21, cz + 0.175), 0.026, 0.022, 0.024, 0.008), V(0, cy + 0.2, cz + 0.22), V(0.014, cy + 0.21, cz + 0.21), V(-0.014, cy + 0.21, cz + 0.21)]), P.trim, 'flat'));
    C.push(gem(V(0, cy + 0.125, cz + 0.173), V(0, 0, 1), 0.03, 0.5));
  }

  // horns: two bold gold pairs sweeping back from the headdress sides, clear of the crown
  S.push(paint(tube(curveSamples(
    [V(0.17, H.y + 0.12, H.z - 0.08), V(0.28, H.y + 0.19, H.z - 0.19), V(0.36, H.y + 0.28, H.z - 0.33)],
    5, (t) => 0.066 * (1 - t) + 0.005), { seg: 6, capEnd: 0.0 }), P.trimT, 'len'));
  S.push(paint(tube(curveSamples(
    [V(0.22, H.y + 0.0, H.z - 0.08), V(0.32, H.y + 0.02, H.z - 0.19), V(0.42, H.y + 0.07, H.z - 0.31)],
    4, (t) => 0.048 * (1 - t) + 0.004), { seg: 5 }), P.trimT, 'len'));

  // ================= BACK SPIKES =================
  for (const [y, z, s] of [[0.6, 0.11, 1.0], [0.58, 0.0, 1.25], [0.57, -0.12, 1.25], [0.55, -0.24, 1.05], [0.49, -0.34, 0.8]])
    C.push(trim(shard(V(0, y, z), V(0, 1, -0.55), 0.05 * s, 0.1 * s)));

  // ================= SHOULDER ARMOUR (pauldrons with lapis gems) =================
  {
    const ang = 0.85; // outward tilt
    const nrm = V(Math.sin(ang), Math.cos(ang), 0);
    const along = V(Math.cos(ang), -Math.sin(ang), 0);
    const c0 = V(0.235, 0.465, 0.13);
    const slab = (c, hl, hw, th, sw) => {
      const pts = [];
      for (const sa of [-1, 1]) for (const sz of [-1, 1]) for (const sn of [-1, 1]) {
        const k = sn > 0 ? 0.82 : 1;
        pts.push(c.clone().addScaledVector(along, sa * hl * k).addScaledVector(V(0, 0, 1), sz * hw * k).addScaledVector(nrm, sn * th));
      }
      return paint(hull(pts), sw, 'y', [c.y - 0.12, c.y + 0.08]);
    };
    S.push(slab(c0, 0.12, 0.13, 0.024, P.trim));
    S.push(slab(c0.clone().addScaledVector(along, 0.075).addScaledVector(nrm, -0.01), 0.055, 0.105, 0.022, P.goldDk));
    S.push(slab(c0.clone().addScaledVector(along, 0.115).addScaledVector(nrm, -0.02), 0.035, 0.09, 0.02, P.trim));
    S.push(gem(c0.clone().addScaledVector(along, -0.01).addScaledVector(nrm, 0.02), nrm, 0.032));
    S.push(trim(shard(c0.clone().addScaledVector(along, -0.06).addScaledVector(nrm, 0.01), V(0.3, 1, -0.2), 0.035, 0.08)));
  }

  // ================= TAIL (banded) =================
  const tailPts = [V(0, 0.34, -0.3), V(0, 0.22, -0.5), V(0, 0.12, -0.7), V(0, 0.12, -0.9), V(0, 0.24, -1.04), V(0, 0.44, -1.06)];
  C.push(paintUV(tube(curveSamples(tailPts, 12, (t) => 0.11 * (1 - t) + 0.026), { seg: 8, axis: X, capEnd: 0.02 }),
    P.bands, (x, y, z, t) => [t, 0.35]));
  const tc = new THREE.CatmullRomCurve3(tailPts, false, 'centripetal');
  for (const t of [0.2, 0.38, 0.56, 0.74]) {
    const p = tc.getPoint(t), T = tc.getTangent(t);
    const n = V(0, T.z, -T.y).normalize(); if (n.y + n.z * 0.3 < 0) n.negate();
    const r = 0.11 * (1 - t) + 0.026;
    const k = 1.1 - t * 0.6;
    C.push(trim(shard(p.clone().addScaledVector(n, r * 0.75), n.clone().addScaledVector(T, -0.6), 0.042 * k, 0.085 * k)));
  }
  for (const t of [0.08, 0.2, 0.32, 0.44, 0.56]) {
    const p = tc.getPoint(t), T = tc.getTangent(t);
    const n = V(0, T.z, -T.y).normalize(); if (n.y + n.z * 0.3 < 0) n.negate();
    const r = 0.11 * (1 - t) + 0.026, w = r * 0.62, l = 0.045 * (1 - t * 0.5);
    const pts = [];
    for (const sx of [-1, 1]) for (const sl of [-1, 1]) {
      const c = p.clone().addScaledVector(T, sl * l);
      pts.push(c.clone().addScaledVector(X, sx * w).addScaledVector(n, -r * 0.55));
      pts.push(c.clone().addScaledVector(X, sx * w * 0.7).addScaledVector(n, -r * 0.92));
      pts.push(c.clone().addScaledVector(X, sx * w * 0.5).addScaledVector(n, -r * 1.06).addScaledVector(T, -sl * 0.006));
    }
    C.push(paint(hull(pts), P.sand, 'flat'));
  }
  // ornate spade tip: gold blade + side barbs + lapis gem, gold ring at the base
  const tip = tc.getPoint(1), tT = tc.getTangent(1);
  C.push(trim(hull([tip.clone().addScaledVector(tT, 0.24), tip.clone().addScaledVector(tT, -0.02),
    V(0.11, tip.y + 0.06, tip.z), V(-0.11, tip.y + 0.06, tip.z),
    V(0, tip.y + 0.06, tip.z - 0.035), V(0, tip.y + 0.06, tip.z + 0.035)])));
  S.push(trim(shard(V(0.06, tip.y + 0.045, tip.z), V(1, -0.7, 0), 0.035, 0.11)));
  C.push(trim(shard(V(0, tip.y + 0.03, tip.z - 0.02), V(0, -0.4, -1), 0.03, 0.1)));
  C.push(gem(V(0, tip.y + 0.09, tip.z + 0.03), V(0, 0, 1), 0.03, 0.5));
  C.push(gem(V(0, tip.y + 0.09, tip.z - 0.03), V(0, 0, -1), 0.03, 0.5));
  C.push(paint(hull([...ring(V(0, tip.y - 0.03, tip.z), 0.04, 0.04, 8, 'y'), ...ring(V(0, tip.y + 0.0, tip.z), 0.04, 0.04, 8, 'y')]), P.lapis, 'flat'));

  // ================= WINGS (gold bones, lapis membrane) =================
  const Sh = V(0.13, 0.55, 0.0), El = V(0.35, 0.84, -0.08), Wr = V(0.47, 1.2, -0.14);
  const tips = [V(1.06, 0.74, -0.3), V(0.9, 0.3, -0.36), V(0.55, 0.22, -0.32)];
  const Bd = V(0.14, 0.5, -0.2);
  S.push(paint(tube(curveSamples([Sh, El, Wr], 6, (t) => 0.062 - 0.02 * t), { seg: 6, capEnd: 0.02 }), P.trim, 'y', [0.4, 1.25]));
  S.push(paint(blob(0, Wr, V(0.055, 0.055, 0.055), { jitter: 0.1 }), P.trim, 'y', [0.9, 1.3]));
  S.push(gem(Wr.clone().add(V(0, 0, 0.045)), V(0, 0.2, 1), 0.026));
  tips.forEach((T) => {
    S.push(paint(tube(curveSamples([Wr, Wr.clone().lerp(T, 0.5).add(V(0, 0.03, 0)), T], 4, (t) => 0.032 * (1 - t) + 0.016),
      { seg: 5, capEnd: 0.0 }), P.trim, 'y', [0.2, 1.25]));
  });
  S.push(trim(shard(Wr.clone().add(V(0, 0.03, 0.02)), V(-0.1, 1, 0.5), 0.035, 0.11)));
  const th = 0.006;
  const panel = (a, b, c) => {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const pts = [];
    for (const p of [a, b, c]) { pts.push(p.clone().addScaledVector(n, th)); pts.push(p.clone().addScaledVector(n, -th)); }
    S.push(paint(hull(pts), P.memb, 'y', [0.2, 1.15]));
  };
  const back = V(0, 0, -0.002);
  const W0 = Wr.clone().add(back);
  const edge = [tips[0], tips[1], tips[2], Bd];
  for (let i = 0; i < edge.length - 1; i++) {
    const a = edge[i].clone().add(back), b = edge[i + 1].clone().add(back);
    const m = a.clone().lerp(b, 0.5).lerp(Wr, 0.2).add(V(0, 0, -0.015));
    const mi = W0.clone().lerp(m, 0.5).add(V(0, 0, 0.012));
    panel(W0, a, mi); panel(a, m, mi); panel(mi, m, b); panel(W0, mi, b);
  }
  panel(W0, Bd.clone().add(back), El.clone().add(back));
  panel(El.clone().add(back), Bd.clone().add(back), Sh.clone().add(back));

  for (const g of C.slice(nC)) g.translate(0, -DROP, 0);
  for (const g of S.slice(nS)) g.translate(0, -DROP, 0);
  return assemble(C, S);
}

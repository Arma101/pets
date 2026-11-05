// Black Hole Bull: pitch-black cosmic bull with glowing violet cracks, starfield specks,
// swirling violet/indigo horns, glowing gold armour, radiant violet wings and a floating golden halo.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// ---------- deterministic random ----------
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const clamp01 = (t) => Math.min(1, Math.max(0, t));
// is this the emissive pass? (the atlas is pre-filled black for the glow map, white for the colour map)
const isGlowPass = (g, x, y) => g.getImageData(x + 2, y + 2, 1, 1).data[0] < 128;

// ---------- big texture regions ----------
// BODY: rows 4..7 (1024 x 512). Charcoal gradient by height + violet cracks + faint star specks.
const BODY = { x: 0, y: 512, w: 1024, h: 512, u: [-0.8, 0.8], v: [1.05, 0.0] };
// STARS: rows 2..3 (1024 x 256). Deep cosmic indigo starfield for the saddle blanket and wing panels.
const STARS = { x: 0, y: 256, w: 1024, h: 256, u: [-0.8, 0.8], v: [1.3, 0.2] };

function drawCrack(g, r, x0, y0, len, ang, w) {
  // jagged tapered crack as a chain of polygons, with a short branch
  let x = x0, y = y0, a = ang;
  const segs = 4 + Math.floor(r() * 3);
  for (let s = 0; s < segs; s++) {
    a += (r() - 0.5) * 1.3;
    const l = len / segs;
    const nx = x + Math.cos(a) * l, ny = y + Math.sin(a) * l * 0.75;
    const w0 = w * (1 - s / segs), w1 = w * (1 - (s + 1) / segs) + 0.6;
    const px = -Math.sin(a), py = Math.cos(a);
    g.beginPath();
    g.moveTo(x + px * w0, y + py * w0); g.lineTo(nx + px * w1, ny + py * w1);
    g.lineTo(nx - px * w1, ny - py * w1); g.lineTo(x - px * w0, y - py * w0); g.closePath(); g.fill();
    if (s === 1 && r() < 0.8) drawCrack(g, r, x, y, len * 0.45, a + (r() < 0.5 ? 1 : -1) * (0.7 + r() * 0.5), w * 0.6);
    x = nx; y = ny;
  }
}
function drawStar(g, x, y, s) {
  g.beginPath();
  g.moveTo(x, y - s * 2.2); g.lineTo(x + s * 0.5, y - s * 0.5); g.lineTo(x + s * 2.2, y); g.lineTo(x + s * 0.5, y + s * 0.5);
  g.lineTo(x, y + s * 2.2); g.lineTo(x - s * 0.5, y + s * 0.5); g.lineTo(x - s * 2.2, y); g.lineTo(x - s * 0.5, y - s * 0.5);
  g.closePath(); g.fill();
}
function drawBody(g) {
  const { x, y, w, h } = BODY, glow = isGlowPass(g, x, y);
  if (!glow) {
    const gr = g.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, '#5E5876'); gr.addColorStop(0.35, '#3E3A50'); gr.addColorStop(1, '#16141C');
    g.fillStyle = gr; g.fillRect(x, y, w, h);
  }
  const r = rng(7);
  // star specks (small)
  for (let k = 0; k < 170; k++) {
    const sx = x + 6 + r() * (w - 12), sy = y + 6 + r() * (h - 12), big = r();
    g.fillStyle = glow ? (big > 0.7 ? '#B0A0D0' : '#605478') : (big > 0.7 ? '#FFFFFF' : '#D2C6F5');
    if (big > 0.7) drawStar(g, sx, sy, 2.6); else g.fillRect(sx - 2, sy - 2, 4, 4);
  }
  // violet cracks: soft outer glow + bright core
  const cracks = [];
  for (let k = 0; k < 24; k++) cracks.push([x + 20 + r() * (w * 0.76 - 40), y + 20 + r() * (h - 40), 70 + r() * 70, r() * Math.PI * 2]);
  for (const [cx, cy, l, a] of cracks) { g.fillStyle = glow ? '#5A1E9A' : '#8E3DF0'; drawCrack(g, rng(cx * 13 + cy), cx, cy, l, a, 6.5); }
  for (const [cx, cy, l, a] of cracks) { g.fillStyle = glow ? '#E9C6FF' : '#E2B6FF'; drawCrack(g, rng(cx * 13 + cy), cx, cy, l, a, 3.2); }
}
function drawStars(g) {
  const { x, y, w, h } = STARS, glow = isGlowPass(g, x, y);
  if (!glow) {
    const gr = g.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, '#5B3FB8'); gr.addColorStop(0.5, '#33237A'); gr.addColorStop(1, '#1A1348');
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    // nebula blotches
    const r0 = rng(3);
    for (let k = 0; k < 18; k++) {
      g.fillStyle = r0() < 0.5 ? 'rgba(190,90,255,0.28)' : 'rgba(80,140,255,0.22)';
      g.beginPath(); g.ellipse(x + r0() * w, y + r0() * h, 30 + r0() * 50, 12 + r0() * 20, r0() * 3, 0, Math.PI * 2); g.fill();
    }
  }
  const r = rng(11);
  for (let k = 0; k < 170; k++) {
    const sx = x + 6 + r() * (w - 12), sy = y + 6 + r() * (h - 12), big = r();
    g.fillStyle = glow ? (big > 0.75 ? '#ffffff' : '#9a90c0') : (big > 0.75 ? '#FFFFFF' : '#D9CCFF');
    if (big > 0.75) drawStar(g, sx, sy, 1.8 + r() * 1.2); else g.fillRect(sx - 1.2, sy - 1.2, 2.6, 2.6);
  }
}

// glowing swatch: full colour in the colour map, a dimmer copy in the emissive map (so it glows without washing out)
function gsw(i, top, bot, gTop, gBot) {
  return { i, top, bot, glow: true, draw(g, x, y) {
    const glow = isGlowPass(g, x, y);
    const a = glow ? gTop : top, b = glow ? gBot : bot;
    const grad = g.createLinearGradient(0, y + 16, 0, y + 112);
    grad.addColorStop(0, a); grad.addColorStop(1, b);
    g.fillStyle = a; g.fillRect(x, y, 128, 16);
    g.fillStyle = grad; g.fillRect(x, y + 16, 128, 96);
    g.fillStyle = b; g.fillRect(x, y + 112, 128, 16);
  } };
}

export const PALETTE = {
  gold:    gsw(0, '#FFE070', '#F0A010', '#4A3A10', '#3A2400'),   // glowing gold armour
  goldDk:  { i: 1, top: '#F7C64A', bot: '#B87A10' },                // matte gold trim / hooves
  violet:  gsw(2, '#F1D6FF', '#B46BFF', '#5A3A80', '#4A1A90'),   // glowing violet (gems, horn bands, wings)
  hornDk:  { i: 3, top: '#4A3A8C', bot: '#1F1748' },                // dark cosmic horn band
  white:   { i: 4, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:     { i: 5, top: '#1A1416', bot: '#0C0A0B' },
  brow:    { i: 6, top: '#6F6788', bot: '#36314A' },
  muzzle:  { i: 7, top: '#7A7194', bot: '#4A4360' },
  nostril: { i: 8, top: '#211C2C', bot: '#120F18' },
  mane:    { i: 9, top: '#57516C', bot: '#1F1C28' },
  hornTip: gsw(10, '#FFFFFF', '#E2C2FF', '#504060', '#504060'),
  wing:    gsw(11, '#C48EFF', '#9150F5', '#40206A', '#3A1870'),  // front feather layer: violet
  lilac:   gsw(13, '#FBF3FF', '#D4B0FF', '#5A5068', '#4A3A68'),  // back feather layer: pale lilac
  halo:    gsw(12, '#FFF6B8', '#FFC926', '#5A5020', '#5A4010'),
  body:    { i: 32, draw: drawBody, glow: true },   // glow pass paints only the cracks/stars
  stars:   { i: 16, draw: drawStars, glow: true },  // glow pass paints only the stars
};
const SW = PALETTE;

// ---------- UV helpers ----------
function swUV(sw, t) {
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  return [(x + 64) / 1024, (y + 16 + clamp01(t) * 96) / 1024];
}
function regUV(R, a, b) {
  const fa = clamp01((a - R.u[0]) / (R.u[1] - R.u[0])), fb = clamp01((b - R.v[0]) / (R.v[1] - R.v[0]));
  return [(R.x + 4 + fa * (R.w - 8)) / 1024, (R.y + 4 + fb * (R.h - 8)) / 1024];
}
// per-facet planar projection onto a region (mirror-safe: uses |x|)
function cosmic(g, R = BODY, off = 0, frontOff = off) {
  const p = g.attributes.position, uv = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    n.subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
    for (const v of [a, b, c]) {
      let U, W;
      if (ay > ax && ay > az) { U = v.z; W = v.y - Math.sign(n.y) * Math.abs(v.x) * 0.6; }
      else if (az > ax) { U = Math.abs(v.x) * 1.3 - 0.3 * Math.sign(n.z) + frontOff - off; W = v.y; }
      else { U = v.z; W = v.y; }
      uv.push(...regUV(R, U + off, W));
    }
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
// per-triangle swatch choice: f(triIndex) -> [swatch, t]
function paintTris(g, f, tAttr = null) {
  const p = g.attributes.position, uv = [];
  const tv = g.userData.t;
  for (let i = 0; i < p.count; i += 3) {
    const [sw, tt] = f(i / 3);
    for (let k = 0; k < 3; k++) uv.push(...swUV(sw, tt === null ? (tv ? tv[i + k] : 0.3) : tt));
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}

const HEAD_OFF = 0.2, HEAD_SC = 1.13;
export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const B = (pts) => cosmic(hull(pts));
  const flat = (g, sw) => paint(g, sw, 'flat');
  const gold = (g, lo, hi) => paint(g, SW.gold, lo === undefined ? 'flat' : 'y', lo === undefined ? null : [lo, hi]);

  // ================= TORSO (heavy front, shoulder hump, tighter hips) =================
  C.push(B([
    ...ring(V(0, 0.42, -0.46), 0.12, 0.11, 10, 'z'),
    ...ring(V(0, 0.41, -0.39), 0.2, 0.175, 10, 'z'),
    ...ring(V(0, 0.41, -0.2), 0.22, 0.185, 10, 'z'),
    ...ring(V(0, 0.43, 0.0), 0.255, 0.22, 10, 'z'),
    ...ring(V(0, 0.45, 0.16), 0.265, 0.23, 10, 'z'),
    ...ring(V(0, 0.46, 0.27), 0.21, 0.19, 10, 'z'),
  ]));
  C.push(B(cbox(V(0, 0.61, 0.08), 0.18, 0.08, 0.17, 0.05)));          // shoulder hump
  C.push(B([...ring(V(0, 0.47, 0.25), 0.18, 0.18, 8, 'z'), ...ring(V(0, 0.5, 0.38), 0.16, 0.16, 8, 'z')])); // neck

  // ================= LEGS (short, thick) =================
  S.push(cosmic(blob(0, V(0.2, 0.41, 0.14), V(0.12, 0.15, 0.14), { jitter: 0.1 })));
  S.push(B([...ring(V(0.215, 0.1, 0.18), 0.082, 0.084, 8), ...ring(V(0.218, 0.23, 0.17), 0.108, 0.105, 8),
    ...ring(V(0.195, 0.35, 0.14), 0.115, 0.12, 8)]));
  S.push(cosmic(blob(1, V(0.165, 0.38, -0.29), V(0.115, 0.155, 0.145), { jitter: 0.12 })));
  S.push(B([...ring(V(0.175, 0.31, -0.28), 0.095, 0.1, 8), ...ring(V(0.188, 0.19, -0.33), 0.09, 0.09, 8),
    ...ring(V(0.185, 0.1, -0.31), 0.08, 0.08, 8)]));
  // cloven gold hooves + glowing gold cuffs
  const hoof = (x, z, r) => {
    for (const dx of [-0.044, 0.044])
      S.push(paint(hull([...cbox(V(x + dx, 0.04, z + 0.01), 0.043, 0.04, 0.07, 0.016),
        V(x + dx, 0.0, z + 0.088), V(x + dx, 0.055, z + 0.082)]), SW.goldDk, 'y', [0, 0.09]));
    S.push(gold(hull([...ring(V(x, 0.075, z), r + 0.012, r + 0.012, 8, 'y'), ...ring(V(x, 0.135, z), r + 0.004, r + 0.004, 8, 'y')]), 0.07, 0.14));
  };
  hoof(0.215, 0.18, 0.085);
  hoof(0.185, -0.31, 0.083);

  // ================= SHARD FUR (dark mane over neck and shoulders, a few violet crystal shards) =================
  const maneSh = (b, d, w, l, fl = 0.7) => paint(shard(b, d, w, l, 4, fl), SW.mane, 'y', [0.25, 0.85]);
  const crySh = (b, d, w, l, fl = 0.7) => paint(shard(b, d, w, l, 4, fl), SW.violet, 'y', [0.3, 0.95]);
  C.push(paint(hull([
    ...ring(V(0, 0.51, 0.33), 0.2, 0.22, 10, 'z', Math.PI / 10),
    ...ring(V(0, 0.51, 0.16), 0.255, 0.25, 10, 'z', 0),
    ...ring(V(0, 0.48, -0.02), 0.225, 0.2, 10, 'z', Math.PI / 10),
  ]), SW.mane, 'y', [0.25, 0.8]));
  for (const [z, cy, rx, ry, w, l, degs] of [
    [0.3, 0.51, 0.2, 0.23, 0.1, 0.15, [62, 30, -4]],
    [0.16, 0.51, 0.255, 0.25, 0.11, 0.16, [90, 72, 44, 14]],
    [0.02, 0.48, 0.23, 0.21, 0.1, 0.15, [90, 58, 28]],
  ]) {
    for (const deg of degs) {
      const th = (deg * Math.PI) / 180;
      const n = V(Math.cos(th), Math.sin(th), 0);
      const base = V(n.x * rx, cy + n.y * ry, z);
      const lift = deg >= 70 ? 0.55 : deg >= 40 ? 0.25 : 0;
      const dir = n.clone().multiplyScalar(0.55).add(V(0, lift - 0.2 - 0.6 * (1 - Math.sin(th)) / 2, -1));
      const cry = (deg === 44 || deg === 58);
      const g = cry ? crySh(base, dir, w * 0.8, l * 0.95, 0.8) : maneSh(base, dir, w, l, 0.8);
      if (deg === 90) C.push(g); else S.push(g);
    }
  }
  // shaggy dewlap under the chin (behind the breastplate)
  S.push(maneSh(V(0.2, 0.38, 0.3), V(0.6, -1, 0.0), 0.07, 0.11, 0.7));

  // ================= GOLD ARMOUR =================
  // breastplate: V-shaped shield on the chest under the head, violet gem
  {
    const sh = [[-0.17, 0.08], [0.17, 0.08], [0.2, -0.02], [0.09, -0.15], [0, -0.19], [-0.09, -0.15], [-0.2, -0.02]];
    const pts = [];
    for (const [u, v] of sh) {
      pts.push(V(u, 0.36 + v, 0.41 - 0.12 * Math.abs(u) + 0.03 * v));          // front face, curving back at the sides
      pts.push(V(u * 1.12, 0.36 + v * 0.9 + 0.02, 0.27 - 0.2 * Math.abs(u)));    // back face sinks into the chest
    }
    C.push(gold(hull(pts), 0.16, 0.46));
  }
  C.push(paint(hull(plate([[-0.035, 0], [0, 0.04], [0.035, 0], [0, -0.05]], V(0, 0.3, 0), 0.395, 0.428)), SW.violet, 'y', [0.25, 0.35]));
  // shoulder pauldrons: two layered plates + gem
  S.push(gold(hull([...cbox(V(0.255, 0.56, 0.14), 0.07, 0.075, 0.12, 0.04), V(0.2, 0.66, 0.12), V(0.2, 0.62, 0.24), V(0.2, 0.62, 0.02)]), 0.45, 0.68));
  S.push(gold(hull([...cbox(V(0.29, 0.47, 0.14), 0.05, 0.05, 0.11, 0.03), V(0.25, 0.53, 0.14)]), 0.4, 0.6));
  S.push(paint(hull([V(0.33, 0.585, 0.14), V(0.33, 0.55, 0.175), V(0.33, 0.52, 0.14), V(0.33, 0.55, 0.105), V(0.348, 0.55, 0.14)]), SW.violet, 'y', [0.52, 0.59]));
  // spine armour ridge with fins + starfield saddle blanket
  C.push(cosmic(hull([
    ...ring(V(0, 0.45, 0.0), 0.27, 0.235, 10, 'z', Math.PI / 10),
    ...ring(V(0, 0.44, -0.33), 0.235, 0.2, 10, 'z', Math.PI / 10),
    V(0, 0.33, 0.0), V(0, 0.33, -0.33),
  ]), STARS));
  // gold trim bands at blanket edges
  for (const z of [0.005, -0.335]) {
    const rr = z > 0 ? [0.278, 0.243] : [0.243, 0.208];
    const cy = z > 0 ? 0.45 : 0.44;
    C.push(gold(hull([...ring(V(0, cy, z - 0.02), rr[0], rr[1], 10, 'z', Math.PI / 10), ...ring(V(0, cy, z + 0.02), rr[0], rr[1], 10, 'z', Math.PI / 10)]), 0.3, 0.7));
  }
  C.push(gold(hull(cbox(V(0, 0.68, -0.16), 0.08, 0.02, 0.15, 0.015)), 0.6, 0.72));
  C.push(gold(shard(V(0, 0.69, -0.06), V(0, 1, -0.6), 0.05, 0.09, 4, 0.5), 0.66, 0.78));
  C.push(gold(shard(V(0, 0.69, -0.2), V(0, 1, -0.6), 0.045, 0.08, 4, 0.5), 0.66, 0.78));

  // ================= HEAD (big, boxy, low and forward) =================
  const H = { y: 0.58, z: 0.44 };
  const c0 = C.length, s0 = S.length;
  C.push(cosmic(hull([
    ...cbox(V(0, H.y, H.z), 0.19, 0.16, 0.17, 0.055),
    ...ring(V(0, H.y + 0.18, H.z - 0.01), 0.14, 0.11, 8, 'y'),
  ]), BODY, HEAD_OFF, 0.92));
  const FZ = H.z + 0.17;
  // slate muzzle block
  C.push(paint(hull([...cbox(V(0, H.y - 0.085, FZ + 0.04), 0.145, 0.08, 0.07, 0.03),
    V(0.1, H.y + 0.0, FZ - 0.02), V(-0.1, H.y + 0.0, FZ - 0.02)]), SW.muzzle, 'y', [H.y - 0.16, H.y]));
  S.push(flat(hull(plate([[-0.022, 0.008], [-0.008, 0.018], [0.018, 0.016], [0.026, 0.0], [0.016, -0.016], [-0.016, -0.016]],
    V(0.062, H.y - 0.07, 0), FZ + 0.1, FZ + 0.115)), SW.nostril));
  C.push(flat(hull(cbox(V(0, H.y - 0.135, FZ + 0.111), 0.04, 0.006, 0.004, 0.002)), SW.nostril));
  // gold nose ring hanging below the nostrils (attached through the septum)
  {
    const cy = H.y - 0.12, cz = FZ + 0.1, R0 = 0.04, N = 8;
    for (let k = 0; k < N; k++) {
      const a0 = Math.PI * 0.5 + (k / N) * Math.PI * 2, a1 = a0 + (Math.PI * 2) / N;
      if (k === 0 || k === N - 1) continue; // gap at the top: ring enters the muzzle
      // ring lies in the x-y plane
      const pp = [];
      for (const a of [a0, a1]) for (const dz of [-0.009, 0.009]) for (const dr of [-0.009, 0.009])
        pp.push(V(Math.cos(a) * (R0 + dr), cy + Math.sin(a) * (R0 + dr), cz + 0.012 + dz));
      C.push(gold(hull(pp)));
    }
  }
  // fierce eyes
  const E = V(0.102, H.y + 0.05, 0), k = 1.3;
  const sc = (pts) => pts.map(([u, v]) => [u * k, v * k]);
  S.push(flat(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.01, FZ + 0.012)), SW.white));
  S.push(flat(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.006, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye));
  S.push(flat(hull(plate([[-0.009, -0.009], [0.009, -0.009], [0.009, 0.009], [-0.009, 0.009]],
    V(E.x + 0.006, E.y + 0.004, 0), FZ + 0.014, FZ + 0.022)), SW.white));
  // heavy brow
  S.push(paint(hull([
    V(0.02, E.y + 0.012, FZ + 0.045), V(0.022, E.y + 0.058, FZ + 0.03),
    V(0.185, E.y + 0.07, FZ + 0.0), V(0.185, E.y + 0.112, FZ - 0.02),
    V(0.02, E.y + 0.012, FZ - 0.03), V(0.022, E.y + 0.07, FZ - 0.04),
    V(0.185, E.y + 0.07, FZ - 0.06), V(0.185, E.y + 0.112, FZ - 0.07),
  ]), SW.brow, 'y'));
  // cheek / jaw shard fur
  S.push(paint(shard(V(0.17, H.y - 0.06, H.z + 0.08), V(1, -0.5, -0.2), 0.05, 0.09, 4, 0.6), SW.mane, 'y', [H.y - 0.15, H.y]));
  S.push(paint(shard(V(0.15, H.y - 0.11, H.z + 0.0), V(0.8, -0.9, -0.4), 0.045, 0.08, 4, 0.6), SW.mane, 'y', [H.y - 0.2, H.y - 0.05]));
  // ears
  S.push(cosmic(hull([V(0.17, H.y + 0.06, H.z - 0.0), V(0.17, H.y - 0.01, H.z - 0.03), V(0.17, H.y + 0.05, H.z - 0.09),
    V(0.33, H.y - 0.01, H.z - 0.04), V(0.33, H.y + 0.02, H.z - 0.02), V(0.3, H.y + 0.03, H.z - 0.06)])));
  // gold helmet crest on the crown with a violet gem
  C.push(gold(hull([...cbox(V(0, H.y + 0.175, H.z - 0.01), 0.13, 0.03, 0.1, 0.022)]), H.y + 0.14, H.y + 0.21));
  C.push(gold(hull(plate([[-0.06, 0.02], [0.06, 0.02], [0.03, -0.05], [0, -0.07], [-0.03, -0.05]], V(0, H.y + 0.175, 0), FZ - 0.03, FZ + 0.0))));
  C.push(paint(hull(plate([[-0.022, 0], [0, 0.026], [0.022, 0], [0, -0.03]], V(0, H.y + 0.168, 0), FZ - 0.0, FZ + 0.016)), SW.violet, 'y', [H.y + 0.13, H.y + 0.2]));

  // ================= SWIRLING COSMIC HORNS =================
  const hornSeg = 7, hornN = 10;
  const hornPts = [V(0.14, H.y + 0.13, H.z - 0.02), V(0.28, H.y + 0.15, H.z - 0.01), V(0.4, H.y + 0.2, H.z + 0.0), V(0.45, H.y + 0.3, H.z + 0.0),
    V(0.45, H.y + 0.42, H.z + 0.02), V(0.42, H.y + 0.5, H.z + 0.05)];
  const hrx = (t) => 0.1 - 0.078 * Math.pow(t, 0.85), hry = (t) => 0.092 - 0.072 * Math.pow(t, 0.85);
  const horn = tube(curveSamples(hornPts, hornN, hrx, hry),
    { seg: hornSeg, axis: V(0, 0, 1), capStart: 0, capEnd: 0.04, phase: Math.PI / 6, twist: (i) => i * 0.22 });
  paintTris(horn, (j) => {
    const q = Math.floor(j / 2), i = Math.floor(q / hornSeg);
    if (q >= (hornN - 1) * hornSeg || i >= hornN - 3) return [SW.hornTip, 0.5];
    return [SW.hornDk, 0.1 + 0.8 * i / (hornN - 3)];
  });
  // glowing violet spiral ridges winding around each horn
  {
    const curve = new THREE.CatmullRomCurve3(hornPts, false, 'centripetal');
    for (const ph of [0, Math.PI]) {
      const smp = [], n = 20, tEnd = 0.74;
      for (let k = 0; k < n; k++) {
        const t = (k / (n - 1)) * tEnd;
        const P = curve.getPoint(t), T = curve.getTangent(t).normalize();
        const N = V(0, 0, 1).addScaledVector(T, -T.z).normalize(), Bv = new THREE.Vector3().crossVectors(T, N);
        const f = ph + t * Math.PI * 2 * 2.0, r = Math.min(hrx(t), hry(t)) * 0.97;
        smp.push({ p: P.clone().addScaledVector(N, Math.cos(f) * r).addScaledVector(Bv, Math.sin(f) * r),
          rx: 0.02 * (1 - 0.55 * t / tEnd), ry: 0.02 * (1 - 0.55 * t / tEnd) });
      }
      S.push(paint(tube(smp, { seg: 4, capStart: 0.0, capEnd: 0.01 }), SW.violet, 'len'));
    }
  }
  S.push(horn);
  S.push(gold(hull([...ring(V(0.15, H.y + 0.13, H.z - 0.02), 0.1, 0.1, 6, 'x', 0),
    ...ring(V(0.215, H.y + 0.14, H.z - 0.02), 0.1, 0.1, 6, 'x', 0)])));

  // scale the whole head group (face, horns, helmet) up about the head centre: big-head proportions
  for (const g of [...C.slice(c0), ...S.slice(s0)]) {
    g.translate(0, -H.y, -H.z); g.scale(HEAD_SC, HEAD_SC, HEAD_SC); g.translate(0, H.y, H.z); g.computeVertexNormals();
  }

  // ================= GOLDEN HALO (floating above the head on the centre line) =================
  {
    const N = 14, R = 0.13, tw = 0.026, th = 0.016, tilt = -0.32;
    const cy = H.y + 0.36, cz = H.z - 0.04;
    const q = new THREE.Quaternion().setFromAxisAngle(X, tilt);
    for (let k = 0; k < N; k++) {
      const pts = [];
      for (const a of [(k / N) * Math.PI * 2, ((k + 1) / N) * Math.PI * 2])
        for (const rr of [R - tw, R + tw]) for (const dy of [-th, th])
          pts.push(V(Math.sin(a) * rr, dy, Math.cos(a) * rr).applyQuaternion(q).add(V(0, cy, cz)));
      C.push(paint(hull(pts), SW.halo, 'y', [cy - 0.05, cy + 0.05]));
    }
  }

  // ================= RADIANT WINGS (gold bone, starfield membrane, 2 layers of broad glowing feathers) =================
  {
    const P0 = V(0.2, 0.64, -0.04), P1 = V(0.5, 0.82, -0.12), P2 = V(0.8, 0.95, -0.2);
    // gold bones
    S.push(gold(hull([...ring(P0, 0.05, 0.05, 6, 'x'), ...ring(P1, 0.045, 0.045, 6, 'x')])));
    S.push(gold(hull([...ring(P1, 0.045, 0.045, 6, 'x'), ...ring(P2, 0.02, 0.02, 4, 'x')])));
    S.push(gold(shard(P2.clone(), V(0.6, 0.35, -0.35), 0.032, 0.1, 4, 0.6)));
    const armN = new THREE.Vector3().subVectors(P2, P0).cross(V(0.25, -0.8, -0.32)).normalize();
    const along = (t) => t < 0.5 ? P0.clone().lerp(P1, t * 2) : P1.clone().lerp(P2, (t - 0.5) * 2);
    const slab = (pts2, th) => { const pts = []; for (const sg of [-1, 1]) for (const q of pts2) pts.push(q.clone().addScaledVector(armN, sg * th)); return hull(pts); };
    // broad feather: wide base, shoulders, pointed tip
    const feather = (t0, t1, dir, len, sw, th) => {
      const pa = along(t0), pb = along(t1), d = dir.clone().normalize();
      const span = new THREE.Vector3().subVectors(pb, pa);
      const mid = pa.clone().add(pb).multiplyScalar(0.5);
      const sa = pa.clone().addScaledVector(d, len * 0.62).addScaledVector(span, -0.12);
      const sb = pb.clone().addScaledVector(d, len * 0.62).addScaledVector(span, 0.12);
      const tip = mid.clone().addScaledVector(d, len);
      const g = slab([pa, pb, sa, sb, tip], th);
      return paint(g, sw, 'y', [tip.y, Math.max(pa.y, pb.y)]);
    };
    // feather directions fan from out-back (tip) to straight down (root)
    const fdir = (t) => V(0.32 * t - 0.05, -1 + 0.72 * t * t, -0.25 - 0.22 * t);
    // back layer: long pale-lilac primaries
    for (let k = 0; k < 7; k++) {
      const t = 0.24 + k * 0.125;
      S.push(feather(t - 0.12, t + 0.06, fdir(t), 0.2 + 0.2 * t, SW.lilac, 0.007));
    }
    // front layer: shorter violet coverts, offset half a step
    for (let k = 0; k < 6; k++) {
      const t = 0.3 + k * 0.125;
      S.push(feather(t - 0.11, t + 0.06, fdir(t), 0.13 + 0.17 * t, SW.wing, 0.013));
    }
    // starfield membrane filling between the bone and the feather rows (two panels following the bend)
    const lowEdge = (t, f) => along(t).addScaledVector(fdir(t).normalize(), f);
    S.push(cosmic(slab([P0.clone(), P1.clone(), lowEdge(0.12, 0.06), lowEdge(0.3, 0.11), lowEdge(0.5, 0.12)], 0.019), STARS));
    S.push(cosmic(slab([P1.clone(), P2.clone(), lowEdge(0.5, 0.12), lowEdge(0.75, 0.12), lowEdge(0.95, 0.08)], 0.019), STARS));
  }

  // ================= TAIL (rope with violet comet tuft) =================
  C.push(cosmic(tube(curveSamples(
    [V(0, 0.48, -0.44), V(0, 0.45, -0.57), V(0, 0.5, -0.69), V(0, 0.62, -0.73), V(0, 0.71, -0.68)],
    8, (t) => 0.058 - 0.022 * t), { seg: 6, axis: X, twist: (i) => (i % 2) * Math.PI / 6 })));
  const T = V(0, 0.71, -0.68);
  const tp = (x, y, z) => V(T.x + x, T.y + y, T.z + z);
  C.push(paint(hull([tp(0, -0.04, -0.01), ...ring(tp(0, 0.07, 0.02), 0.055, 0.075, 6, 'y', 0), tp(0, 0.2, 0.06),
    tp(0, 0.13, 0.1), tp(0, 0.12, -0.06)]), SW.violet, 'y', [T.y - 0.05, T.y + 0.2]));
  S.push(paint(shard(tp(0.03, 0.06, 0.02), V(0.8, 0.6, 0), 0.03, 0.085, 4, 0.6), SW.violet, 'y', [T.y - 0.05, T.y + 0.2]));
  C.push(paint(shard(tp(0, 0.06, -0.02), V(0, 0.4, -1), 0.035, 0.09, 4, 0.6), SW.violet, 'y', [T.y - 0.05, T.y + 0.2]));

  return assemble(C, S);
}

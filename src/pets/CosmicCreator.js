// Cosmic Creator (DIVINE): dark starry dragon with white constellation lines, gold crown, floating golden halo,
// pearl horns, giant star-pointed constellation wings and glowing gold armour.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// ---------- texture helpers ----------
// The glow (emissive) atlas is drawn on black; the colour atlas on white. Cell 63 is never used, so its
// pixel tells a custom draw() which pass it is painting.
function glowPass(ctx) { return ctx.getImageData(7 * 128 + 64, 7 * 128 + 64, 1, 1).data[0] < 10; }
function grad(ctx, x, y, w, h, top, bot) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, top); g.addColorStop(1, bot);
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
}
function rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
// standard kit-style gradient cell; in the glow pass paint it at `glowK` brightness (soft glow, keeps facets)
function cell(top, bot, glowK = 1) {
  return (ctx, x, y) => {
    const gp = glowPass(ctx);
    ctx.fillStyle = top; ctx.fillRect(x, y, 128, 16);
    grad(ctx, x, y + 16, 128, 96, top, bot);
    ctx.fillStyle = bot; ctx.fillRect(x, y + 112, 128, 16);
    if (gp && glowK < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - glowK})`; ctx.fillRect(x, y, 128, 128); }
  };
}
// starry block (n x n cells): navy gradient + nebula + star speckles + white constellations.
// The pattern is mirror-symmetric about the block's vertical centre line (so x-projected centre parts stay symmetric).
function starBlock(n, { top, bot, neb, seed, lineW, dotR, cons, stars, small = false }) {
  return (ctx, x0, y0) => {
    const gp = glowPass(ctx), S = n * 128, R = rng(seed);
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, S, S); ctx.clip();
    if (!gp) grad(ctx, x0, y0, S, S, top, bot);
    const both = (f) => { f((u) => x0 + u * S); f((u) => x0 + (1 - u) * S); };
    // nebula clouds
    for (const [u, v, r, col, a] of neb) both((X) => {
      const g = ctx.createRadialGradient(X(u), y0 + v * S, 0, X(u), y0 + v * S, r * S);
      g.addColorStop(0, col.replace('A', String(gp ? a * 0.5 : a))); g.addColorStop(1, col.replace('A', '0'));
      ctx.fillStyle = g; ctx.fillRect(x0, y0, S, S);
    });
    // star speckles
    for (let k = 0; k < stars; k++) {
      const u = R() * 0.5, v = R(), s = R(), big = !small && s > 0.86;
      const c = s > 0.55 ? '#FFFFFF' : s > 0.25 ? '#BFD6FF' : '#FFE9A8';
      both((X) => {
        ctx.fillStyle = c;
        const px = X(u), py = y0 + v * S;
        if (big) { ctx.fillRect(px - 1, py - 4, 2, 8); ctx.fillRect(px - 4, py - 1, 8, 2); ctx.fillRect(px - 1.5, py - 1.5, 3, 3); }
        else { const r = s > 0.5 ? 1.6 : 1.1; ctx.fillRect(px - r, py - r, 2 * r, 2 * r); }
      });
    }
    // constellations: dots joined by lines
    for (const pts of cons) both((X) => {
      ctx.strokeStyle = gp ? '#CFE0FF' : '#FFFFFF'; ctx.lineWidth = lineW; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); pts.forEach(([u, v], i) => (i ? ctx.lineTo(X(u), y0 + v * S) : ctx.moveTo(X(u), y0 + v * S))); ctx.stroke();
      for (const [u, v] of pts) {
        ctx.fillStyle = gp ? '#9FC4FF' : '#BFD8FF'; ctx.beginPath(); ctx.arc(X(u), y0 + v * S, dotR * 1.6, 0, 7); ctx.fill();
        ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(X(u), y0 + v * S, dotR, 0, 7); ctx.fill();
      }
    });
    ctx.restore();
  };
}

export const PALETTE = {
  // 3x3 block, cells 0-2 / 8-10 / 16-18
  star: { i: 0, n: 3, glow: true, draw: starBlock(3, {
    top: '#212C6C', bot: '#070A1E', seed: 7, lineW: 4, dotR: 4.5, stars: 150,
    neb: [[0.18, 0.3, 0.22, 'rgba(70,90,210,A)', 0.35], [0.35, 0.7, 0.2, 'rgba(40,140,230,A)', 0.3], [0.08, 0.85, 0.18, 'rgba(120,70,190,A)', 0.2]],
    cons: [
      [[0.06, 0.12], [0.16, 0.2], [0.13, 0.33], [0.27, 0.36], [0.35, 0.26]],
      [[0.42, 0.08], [0.47, 0.18], [0.38, 0.17]],
      [[0.05, 0.5], [0.18, 0.55], [0.26, 0.48], [0.36, 0.56], [0.33, 0.68], [0.22, 0.7]],
      [[0.08, 0.78], [0.12, 0.9], [0.27, 0.86], [0.4, 0.94]],
      [[0.44, 0.38], [0.46, 0.5]],
    ] }) },
  // 3x3 block, cells 3-5 / 11-13 / 19-21
  wing: { i: 3, n: 3, glow: true, draw: starBlock(3, {
    top: '#24317E', bot: '#080C26', seed: 31, lineW: 5, dotR: 6, stars: 170,
    neb: [[0.25, 0.35, 0.3, 'rgba(60,110,230,A)', 0.4], [0.4, 0.75, 0.25, 'rgba(50,190,240,A)', 0.35], [0.1, 0.6, 0.18, 'rgba(150,90,220,A)', 0.25]],
    cons: [
      [[0.05, 0.1], [0.14, 0.18], [0.24, 0.12], [0.34, 0.2], [0.3, 0.32], [0.18, 0.3], [0.14, 0.18]],
      [[0.06, 0.45], [0.16, 0.5], [0.2, 0.62], [0.32, 0.6], [0.42, 0.48]],
      [[0.08, 0.72], [0.18, 0.82], [0.12, 0.93], [0.3, 0.9], [0.4, 0.78]],
      [[0.42, 0.06], [0.47, 0.28]],
    ] }) },
  // calm starry block for the face and feet (2x2 cells 6,7 / 14,15): small stars only, no lines
  calm: { i: 6, n: 2, glow: true, draw: starBlock(2, {
    top: '#212C6C', bot: '#070A1E', seed: 11, lineW: 0, dotR: 0, stars: 55, small: true, cons: [],
    neb: [[0.2, 0.35, 0.3, 'rgba(70,90,210,A)', 0.25], [0.35, 0.75, 0.25, 'rgba(40,140,230,A)', 0.2]] }) },
  gold:   { i: 24, glow: true, draw: cell('#FFEC8A', '#E6A01C', 0.35) },
  goldT:  { i: 25, glow: true, draw: cell('#E6A01C', '#FFF2A8', 0.35) },
  halo:   { i: 26, glow: true, draw: cell('#FFF8C4', '#FFC93A', 0.9) },
  white:  { i: 27, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:    { i: 28, top: '#1A1416', bot: '#0C0A0B' },
  horn:   { i: 29, top: '#FFFFFF', bot: '#BFC6F0' },
  brow:   { i: 30, top: '#141A4A', bot: '#05071A' },
  belly:  { i: 31, top: '#4A5BB8', bot: '#26307A' },
  nose:   { i: 32, top: '#0A0C22', bot: '#05060F' },
  gem:    { i: 33, glow: true, top: '#E6FFFF', bot: '#46D8FF' },
  crystal:{ i: 34, glow: true, draw: cell('#FFFFFF', '#BFE8FF', 0.45) },
  dark:   { i: 35, top: '#1E2864', bot: '#0C1030' },
};
const P = PALETTE;

// per-triangle planar projection into a starry block (world-space, wraps per triangle)
function starPaint(g, sw, L, o) {
  const p = g.attributes.position, uv = [];
  const col = sw.i % 8, row = Math.floor(sw.i / 8), m = 6, span = sw.n * 128 - 2 * m;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
    const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
    const proj = (v) => (az >= ax && az >= ay) ? [(v.x - o.x) / L, (v.y - o.y) / L]
      : (ax >= ay) ? [(v.z - o.z) / L, (v.y - o.y) / L] : [(v.x - o.x) / L, (v.z - o.z) / L];
    const q = [a, b, c].map(proj);
    const fu = Math.floor((q[0][0] + q[1][0] + q[2][0]) / 3), fv = Math.floor((q[0][1] + q[1][1] + q[2][1]) / 3);
    for (const [u, v] of q) {
      const uu = THREE.MathUtils.clamp(u - fu, 0, 1), vv = THREE.MathUtils.clamp(v - fv, 0, 1);
      uv.push((col * 128 + m + uu * span) / 1024, (row * 128 + m + (1 - vv) * span) / 1024);
    }
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}
const BODY_L = 1.1, BODY_O = V(-BODY_L / 2, 0.0, -0.4);
const sky = (g) => starPaint(g, P.star, BODY_L, BODY_O);
const calm = (g) => starPaint(g, P.calm, BODY_L, BODY_O);
const DROP = 0.035;

// flat 4-point star ornament centred at c, in the plane spanned by unit vectors a (up) and b (side)
function star4(c, a, b, r, th) {
  const nrm = new THREE.Vector3().crossVectors(a, b).normalize();
  const parts = [];
  for (const [d1, d2, l1, l2] of [[a, b, r, r * 0.3], [b, a, r * 0.8, r * 0.3]]) {
    parts.push(hull([
      c.clone().addScaledVector(d1, l1), c.clone().addScaledVector(d1, -l1),
      c.clone().addScaledVector(d2, l2).addScaledVector(nrm, 0), c.clone().addScaledVector(d2, -l2),
      c.clone().addScaledVector(nrm, th), c.clone().addScaledVector(nrm, -th),
    ]));
  }
  return parts;
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const body = (pts) => sky(hull(pts));
  const gold = (g) => paint(g, P.gold, 'flat');
  const goldY = (g, lo, hi) => paint(g, P.gold, 'y', [lo, hi]);

  // ================= BODY =================
  C.push(body([
    ...ring(V(0, 0.34, -0.38), 0.12, 0.12, 10, 'z'),
    ...ring(V(0, 0.34, -0.28), 0.19, 0.18, 10, 'z'),
    ...ring(V(0, 0.35, -0.12), 0.22, 0.21, 10, 'z'),
    ...ring(V(0, 0.38, 0.04), 0.22, 0.22, 10, 'z'),
    ...ring(V(0, 0.41, 0.16), 0.2, 0.21, 10, 'z'),
    ...ring(V(0, 0.44, 0.25), 0.13, 0.14, 10, 'z'),
  ]));
  C.push(body([...ring(V(0, 0.46, 0.15), 0.15, 0.14, 10, 'y'), ...ring(V(0, 0.68, 0.24), 0.13, 0.12, 10, 'y')]));

  // ================= LEGS =================
  S.push(body([...ring(V(0.17, 0.08, 0.22), 0.088, 0.088, 8), ...ring(V(0.17, 0.2, 0.2), 0.095, 0.098, 8),
    ...ring(V(0.15, 0.34, 0.14), 0.11, 0.12, 8)]));
  S.push(sky(blob(0, V(0.175, 0.26, -0.17), V(0.13, 0.155, 0.17), { jitter: 0.12 })));
  S.push(body([...ring(V(0.18, 0.24, -0.16), 0.09, 0.095, 8), ...ring(V(0.19, 0.13, -0.19), 0.08, 0.08, 8),
    ...ring(V(0.19, 0.08, -0.18), 0.078, 0.078, 8)]));
  // gold leg cuffs (armour bands)
  S.push(goldY(hull([...ring(V(0.17, 0.12, 0.215), 0.1, 0.1, 8), ...ring(V(0.17, 0.19, 0.205), 0.107, 0.11, 8)]), 0.1, 0.2));
  S.push(goldY(hull([...ring(V(0.19, 0.11, -0.187), 0.092, 0.092, 8), ...ring(V(0.19, 0.18, -0.19), 0.097, 0.1, 8)]), 0.1, 0.2));
  // shoulder pauldrons: layered gold plates + spike
  S.push(goldY(hull([...ring(V(0.2, 0.35, 0.15), 0.1, 0.12, 8), ...ring(V(0.19, 0.45, 0.14), 0.08, 0.1, 8),
    V(0.15, 0.5, 0.14), V(0.27, 0.32, 0.15)]), 0.3, 0.52));
  S.push(gold(shard(V(0.24, 0.45, 0.13), V(0.7, 1, -0.2), 0.04, 0.1)));
  // hip plates
  S.push(goldY(hull([...ring(V(0.22, 0.3, -0.17), 0.09, 0.15, 8), ...ring(V(0.2, 0.39, -0.17), 0.07, 0.11, 8), V(0.16, 0.43, -0.17)]), 0.25, 0.45));
  // feet: dark block + 3 big gold claws
  const foot = (x, z) => {
    S.push(calm(hull(cbox(V(x, 0.055, z + 0.01), 0.09, 0.055, 0.08, 0.028))));
    for (const dx of [-0.056, 0, 0.056]) {
      const b = V(x + dx, 0.0, z + 0.08);
      S.push(gold(hull([
        V(b.x - 0.026, 0.0, b.z - 0.02), V(b.x + 0.026, 0.0, b.z - 0.02),
        V(b.x - 0.022, 0.055, b.z - 0.02), V(b.x + 0.022, 0.055, b.z - 0.02),
        V(b.x, 0.062, b.z + 0.0), V(b.x + dx * 0.15, 0.0, b.z + 0.075),
        V(b.x - 0.018, 0.0, b.z + 0.035), V(b.x + 0.018, 0.0, b.z + 0.035),
      ])));
    }
  };
  foot(0.175, 0.23);
  foot(0.195, -0.17);
  const nC = C.length, nS = S.length;

  // ================= GOLD CHEST ARMOUR (segmented plates) =================
  const chest = [
    [0.66, 0.355, 0.09, 0.034, -0.35],
    [0.59, 0.345, 0.1, 0.034, -0.28],
    [0.52, 0.34, 0.11, 0.034, -0.15],
    [0.45, 0.335, 0.12, 0.034, 0.0],
    [0.38, 0.32, 0.12, 0.034, 0.2],
    [0.31, 0.29, 0.115, 0.034, 0.45],
    [0.25, 0.235, 0.105, 0.034, 0.85],
  ];
  chest.forEach(([y, z, w, l, t], idx) => {
    const up = V(0, Math.cos(t), -Math.sin(t)), n = V(0, Math.sin(t), Math.cos(t));
    const pts = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const c = V(0, y, z).addScaledVector(up, sy * l);
      pts.push(c.clone().addScaledVector(X, sx * w).addScaledVector(n, -0.07));
      pts.push(c.clone().addScaledVector(X, sx * (w - 0.01)).addScaledVector(n, -0.005));
      pts.push(c.clone().addScaledVector(X, sx * (w - 0.035)).addScaledVector(n, 0.014).addScaledVector(up, -sy * 0.006));
    }
    C.push(idx > 4 ? paint(hull(pts), P.belly, 'y', [0.15, 0.4]) : goldY(hull(pts), 0.3, 0.72));
  });
  {
    const pts = [];
    for (const [y, z, w, l, t] of chest.slice(0, 6)) {
      const up = V(0, Math.cos(t), -Math.sin(t)), n = V(0, Math.sin(t), Math.cos(t));
      for (const sy of [-1, 1]) {
        const c = V(0, y, z).addScaledVector(up, sy * l);
        for (const sx of [-1, 1]) pts.push(c.clone().addScaledVector(X, sx * (w + 0.035)).addScaledVector(n, -0.04));
        pts.push(c.clone().addScaledVector(n, -0.16));
      }
    }
    C.push(body(pts));
  }
  // glowing star gem on the chest
  for (const g of star4(V(0, 0.49, 0.372), V(0, 1, 0), V(1, 0, 0), 0.06, 0.018)) C.push(paint(g, P.gem, 'y', [0.43, 0.55]));

  // ================= HEAD =================
  const H = { y: 0.81, z: 0.3 };
  const hC0 = C.length, hS0 = S.length;
  C.push(calm(hull([
    ...cbox(V(0, H.y, H.z), 0.205, 0.16, 0.16, 0.07),
    ...ring(V(0, H.y + 0.18, H.z - 0.03), 0.11, 0.1, 8, 'y'),
    V(0.22, H.y - 0.07, H.z + 0.02), V(-0.22, H.y - 0.07, H.z + 0.02),
  ])));
  const FZ = H.z + 0.16;
  C.push(calm(hull([
    ...cbox(V(0, H.y - 0.07, FZ + 0.085), 0.115, 0.06, 0.105, 0.03),
    V(0.09, H.y - 0.0, FZ - 0.02), V(-0.09, H.y - 0.0, FZ - 0.02),
    V(0.065, H.y - 0.015, FZ + 0.17), V(-0.065, H.y - 0.015, FZ + 0.17),
  ])));
  C.push(paint(hull(cbox(V(0, H.y - 0.14, FZ + 0.045), 0.095, 0.035, 0.1, 0.02)), P.belly, 'y', [0.6, 0.72]));
  // gold snout tip plate
  C.push(goldY(hull([V(0.05, H.y - 0.008, FZ + 0.12), V(-0.05, H.y - 0.008, FZ + 0.12), V(0, H.y - 0.004, FZ + 0.06),
    V(0.05, H.y - 0.022, FZ + 0.12), V(-0.05, H.y - 0.022, FZ + 0.12), V(0, H.y - 0.02, FZ + 0.06)]), H.y - 0.03, H.y));
  S.push(paint(hull([V(0.028, H.y - 0.008, FZ + 0.155), V(0.062, H.y - 0.008, FZ + 0.15), V(0.028, H.y - 0.022, FZ + 0.197),
    V(0.062, H.y - 0.022, FZ + 0.195), V(0.045, H.y - 0.03, FZ + 0.15), V(0.045, H.y - 0.04, FZ + 0.19)]), P.nose, 'flat'));
  S.push(paint(hull([V(0, H.y - 0.098, FZ + 0.197), V(0, H.y - 0.088, FZ + 0.197), V(0.08, H.y - 0.098, FZ + 0.197),
    V(0.08, H.y - 0.088, FZ + 0.197), V(0, H.y - 0.093, FZ + 0.18), V(0.08, H.y - 0.093, FZ + 0.18)]), P.nose, 'flat'));
  S.push(paint(hull([V(0.1, H.y - 0.098, FZ + 0.185), V(0.1, H.y - 0.088, FZ + 0.185), V(0.12, H.y - 0.098, FZ + 0.16),
    V(0.12, H.y - 0.088, FZ + 0.16), V(0.12, H.y - 0.115, FZ + 0.05), V(0.12, H.y - 0.105, FZ + 0.05),
    V(0.105, H.y - 0.1, FZ + 0.06), V(0.09, H.y - 0.093, FZ + 0.18)]), P.nose, 'flat'));
  // small white fangs
  S.push(paint(shard(V(0.07, H.y - 0.1, FZ + 0.17), V(0, -1, 0.1), 0.012, 0.035, 3), P.white, 'flat'));

  // fierce eyes
  const E = V(0.092, H.y + 0.045, 0);
  S.push(paint(hull(plate([[-0.05, 0.0], [0.052, 0.038], [0.06, -0.012], [0.022, -0.046], [-0.034, -0.042], [-0.052, -0.018]],
    E, FZ - 0.01, FZ + 0.01)), P.white, 'flat'));
  S.push(paint(hull(plate([[-0.03, 0.002], [0.018, 0.022], [0.025, -0.01], [0.005, -0.038], [-0.025, -0.036], [-0.036, -0.015]],
    V(E.x - 0.002, E.y, 0), FZ + 0.004, FZ + 0.016)), P.eye, 'flat'));
  S.push(paint(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.012, FZ + 0.02)), P.white, 'flat'));
  // heavy dark brow, jutting out over the eye and slanting down to the nose
  S.push(paint(hull([
    V(0.02, E.y + 0.008, FZ + 0.045), V(0.022, E.y + 0.07, FZ + 0.032),
    V(0.172, E.y + 0.052, FZ + 0.0), V(0.172, E.y + 0.118, FZ - 0.02),
    V(0.02, E.y + 0.008, FZ - 0.03), V(0.022, E.y + 0.08, FZ - 0.045),
    V(0.172, E.y + 0.052, FZ - 0.06), V(0.172, E.y + 0.118, FZ - 0.075),
  ]), P.brow, 'y', [E.y, E.y + 0.12]));

  // horns: big pearl horns sweeping back + small lower pair
  S.push(paint(tube(curveSamples(
    [V(0.1, H.y + 0.12, H.z - 0.04), V(0.17, H.y + 0.24, H.z - 0.14), V(0.21, H.y + 0.34, H.z - 0.3)],
    5, (t) => 0.06 * (1 - t) + 0.004), { seg: 6 }), P.horn, 'len'));
  S.push(paint(tube(curveSamples(
    [V(0.16, H.y + 0.05, H.z - 0.08), V(0.24, H.y + 0.08, H.z - 0.16), V(0.29, H.y + 0.12, H.z - 0.27)],
    4, (t) => 0.04 * (1 - t) + 0.003), { seg: 5 }), P.horn, 'len'));
  // cheek blades (dark) and jaw spikes
  for (const [b, d, w, l] of [
    [V(0.19, H.y - 0.05, H.z - 0.02), V(1, -0.2, -0.9), 0.045, 0.13],
    [V(0.17, H.y - 0.11, H.z + 0.02), V(0.8, -0.7, -0.6), 0.035, 0.1],
  ]) S.push(calm(shard(b, d, w, l, 4, 0.5)));

  // ================= CROWN (gold band + points) and floating HALO =================
  const CR = V(0, H.y + 0.16, H.z - 0.03);
  {
    const n = 8, r0 = 0.122, r1 = 0.098, h0 = 0.0, h1 = 0.06;
    for (let k = 0; k < n; k++) {
      const a0 = Math.PI / 8 + (2 * Math.PI * k) / n, a1 = a0 + (2 * Math.PI) / n;
      const pts = [];
      for (const a of [a0, a1]) for (const r of [r0, r1]) for (const h of [h0, h1])
        pts.push(V(CR.x + Math.cos(a) * r * 1.05, CR.y + h - (r === r0 ? 0.008 : 0), CR.z + Math.sin(a) * r * 0.95));
      C.push(goldY(hull(pts), CR.y - 0.01, CR.y + 0.07));
    }
    // crown points: tall front, mirrored sides, back
    const pt = (a, hgt, w) => {
      const c = V(CR.x + Math.cos(a) * 0.112, CR.y + 0.05, CR.z + Math.sin(a) * 0.104);
      return gold(hull([c.clone().add(V(0, hgt, 0)),
        c.clone().add(V(-Math.sin(a) * w, 0, Math.cos(a) * w)), c.clone().add(V(Math.sin(a) * w, 0, -Math.cos(a) * w)),
        c.clone().add(V(Math.cos(a) * 0.012, 0, Math.sin(a) * 0.012)), c.clone().add(V(-Math.cos(a) * 0.012, 0, -Math.sin(a) * 0.012))]));
    };
    C.push(pt(Math.PI / 2, 0.135, 0.045));
    C.push(pt(-Math.PI / 2, 0.08, 0.04));
    S.push(pt(Math.PI / 2 - 0.8, 0.105, 0.04));
    S.push(pt(-Math.PI / 2 + 1.0, 0.085, 0.04));
    S.push(pt(0.1, 0.07, 0.035));
    // gem on the crown front
    C.push(paint(hull([V(0, CR.y + 0.055, CR.z + 0.122), V(0, CR.y + 0.005, CR.z + 0.122),
      V(0.02, CR.y + 0.03, CR.z + 0.118), V(-0.02, CR.y + 0.03, CR.z + 0.118), V(0, CR.y + 0.03, CR.z + 0.14)]), P.gem, 'y', [CR.y, CR.y + 0.06]));
  }
  {
    const hc = V(0, H.y + 0.43, H.z - 0.07), R0 = 0.17, n = 14, w = 0.024, hh = 0.016, tilt = 0.42;
    const q = new THREE.Quaternion().setFromAxisAngle(X, tilt);
    for (let k = 0; k < n; k++) {
      const a0 = (2 * Math.PI * k) / n + Math.PI / n, a1 = a0 + (2 * Math.PI) / n;
      const pts = [];
      for (const a of [a0, a1]) for (const r of [R0 - w, R0 + w]) for (const h of [-hh, hh])
        pts.push(V(Math.cos(a) * r, h, Math.sin(a) * r).applyQuaternion(q).add(hc));
      C.push(paint(hull(pts), P.halo, 'y', [hc.y - 0.1, hc.y + 0.1]));
    }
  }
  C.push(paint(shard(V(0, H.y + 0.02, H.z - 0.16), V(0, 0.6, -1), 0.03, 0.08), P.crystal, 'flat'));
  // scale the whole head group (incl. horns, crown, halo) up around the neck joint
  {
    const piv = V(0, 0.66, 0.22), k = 1.19;
    for (const g of [...C.slice(hC0), ...S.slice(hS0)]) {
      g.translate(-piv.x, -piv.y, -piv.z); g.scale(k, k, k); g.translate(piv.x, piv.y, piv.z);
    }
  }

  // gold neck collar (gorget)
  C.push(goldY(hull([...ring(V(0, 0.57, 0.2), 0.165, 0.155, 10, 'y'), ...ring(V(0, 0.63, 0.22), 0.15, 0.14, 10, 'y')]), 0.55, 0.65));

  // gold back saddle plate between the wing roots
  {
    const pts = [];
    for (const [z, r, cy] of [[0.06, 0.235, 0.38 + DROP], [-0.14, 0.225, 0.355 + DROP]])
      for (const th of [-1.0, -0.5, 0, 0.5, 1.0]) for (const dr of [0.016, -0.05])
        pts.push(V(Math.sin(th) * (r + dr), cy + Math.cos(th) * (r + dr), z));
    C.push(goldY(hull(pts), 0.45, 0.62));
  }

  // ================= DORSAL CRYSTAL SPIKES =================
  for (const [y, z, s] of [[0.6, 0.13, 1.0], [0.58, 0.02, 1.25], [0.57, -0.1, 1.2], [0.55, -0.22, 1.0], [0.49, -0.32, 0.8]])
    C.push(paint(shard(V(0, y, z), V(0, 1, -0.55), 0.05 * s, 0.11 * s), P.crystal, 'y', [y, y + 0.12 * s]));

  // ================= TAIL (starry, gold star tip) =================
  const tailPts = [V(0, 0.34, -0.3), V(0, 0.22, -0.5), V(0, 0.12, -0.7), V(0, 0.12, -0.9), V(0, 0.24, -1.02), V(0, 0.42, -1.04)];
  C.push(sky(tube(curveSamples(tailPts, 12, (t) => 0.11 * (1 - t) + 0.026), { seg: 8, axis: X, capEnd: 0.02 })));
  const tc = new THREE.CatmullRomCurve3(tailPts, false, 'centripetal');
  for (const t of [0.14, 0.3, 0.46, 0.62, 0.78]) {
    const p = tc.getPoint(t), T = tc.getTangent(t);
    const n = V(0, T.z, -T.y).normalize(); if (n.y + n.z * 0.3 < 0) n.negate();
    const r = 0.11 * (1 - t) + 0.026, k = 1.1 - t * 0.6;
    C.push(paint(shard(p.clone().addScaledVector(n, r * 0.75), n.clone().addScaledVector(T, -0.6), 0.042 * k, 0.085 * k), P.crystal, 'flat'));
  }
  // gold tail rings
  for (const t of [0.22, 0.5]) {
    const p = tc.getPoint(t), T = tc.getTangent(t), r = (0.11 * (1 - t) + 0.026) * 1.12;
    C.push(goldY(tube([{ p: p.clone().addScaledVector(T, -0.02), rx: r, ry: r }, { p: p.clone().addScaledVector(T, 0.02), rx: r, ry: r }],
      { seg: 8, axis: X }), 0, 0.4));
  }
  const tip = tc.getPoint(1), tT = tc.getTangent(1);
  { const sc = tip.clone().addScaledVector(tT, 0.1), sd = new THREE.Vector3().crossVectors(X, tT).normalize();
    for (const g of [...star4(sc, tT, sd, 0.12, 0.03), ...star4(sc, tT, X, 0.1, 0.03)]) C.push(goldY(g, tip.y, tip.y + 0.2)); }

  // ================= GIANT STAR WINGS =================
  const Sh = V(0.14, 0.55, 0.0), El = V(0.3, 0.8, -0.08), Wr = V(0.44, 1.06, -0.14);
  // five rays fanning out from the wrist like half a star
  const tips = [V(0.5, 1.48, -0.22), V(0.92, 1.36, -0.3), V(1.12, 0.98, -0.34), V(1.05, 0.58, -0.34), V(0.76, 0.32, -0.3)];
  const Bd = V(0.15, 0.5, -0.2);
  S.push(paint(tube(curveSamples([Sh, El, Wr], 6, (t) => 0.062 - 0.02 * t), { seg: 6, capEnd: 0.02 }), P.goldT, 'len'));
  S.push(gold(blob(0, Wr, V(0.055, 0.055, 0.055), { jitter: 0.1 })));
  // elbow armour plate + wrist spike
  S.push(gold(shard(El.clone().add(V(0.02, 0.0, 0.0)), V(0.6, -0.2, -0.3), 0.045, 0.1)));
  S.push(gold(shard(Wr.clone().add(V(0, 0.03, 0.02)), V(-0.15, 1, 0.4), 0.035, 0.1)));
  tips.forEach((T) => {
    S.push(paint(tube(curveSamples([Wr, Wr.clone().lerp(T, 0.5).add(V(0, 0.02, 0.01)), T], 4, (t) => 0.02 * (1 - t) + 0.009),
      { seg: 5 }), P.goldT, 'len'));
    // gold star ornament on each point
    const d = T.clone().sub(Wr).normalize(), nrm = V(0.1, 0.05, 1).normalize();
    const sd = new THREE.Vector3().crossVectors(nrm, d).normalize();
    for (const g of star4(T.clone().addScaledVector(d, 0.02), d, sd, 0.07, 0.016)) S.push(paint(g, P.halo, 'flat'));
  });
  const th = 0.006;
  const WL = 1.15, WO = V(0.05, 0.2, -0.6);
  const panel = (a, b, c) => {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const pts = [];
    for (const p of [a, b, c]) { pts.push(p.clone().addScaledVector(n, th)); pts.push(p.clone().addScaledVector(n, -th)); }
    S.push(starPaint(hull(pts), P.wing, WL, WO));
  };
  const back = V(0, 0, -0.002);
  const W0 = Wr.clone().add(back);
  const edge = [...tips, Bd];
  for (let i = 0; i < edge.length - 1; i++) {
    const a = edge[i].clone().add(back), b = edge[i + 1].clone().add(back);
    const deep = i === edge.length - 2 ? 0.25 : 0.42; // star notches between the points
    const m = a.clone().lerp(b, 0.5).lerp(Wr, deep).add(V(0, 0, -0.01));
    panel(W0, a, m); panel(W0, m, b);
  }
  panel(W0, Bd.clone().add(back), El.clone().add(back));
  panel(El.clone().add(back), Bd.clone().add(back), Sh.clone().add(back));

  for (const g of C.slice(nC)) g.translate(0, -DROP, 0);
  for (const g of S.slice(nS)) g.translate(0, -DROP, 0);
  return assemble(C, S);
}

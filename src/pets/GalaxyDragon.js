// Galaxy Dragon (CELESTIAL): chunky faceted purple dragon, cyan glowing crystal spikes and markings,
// galaxy-patterned wings and horns, floating gold crown above the head.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// deterministic pseudo random for the star field
function rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

// galaxy swatch: deep blue/purple base, pink + violet + blue nebula clouds, swirl bands and star dots
function drawGalaxy(g, x, y) {
  g.save();
  g.beginPath(); g.rect(x, y, 128, 128); g.clip();
  g.fillStyle = '#4C40B8'; g.fillRect(x, y, 128, 128);
  const cloud = (cx, cy, r, col) => {
    const gr = g.createRadialGradient(x + cx, y + cy, 0, x + cx, y + cy, r);
    gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(76,64,184,0)');
    g.fillStyle = gr; g.fillRect(x, y, 128, 128);
  };
  cloud(30, 34, 52, 'rgba(150,96,255,0.95)');
  cloud(96, 30, 40, 'rgba(90,150,255,0.9)');
  cloud(78, 78, 50, 'rgba(255,110,215,0.95)');
  cloud(28, 100, 44, 'rgba(190,100,255,0.9)');
  cloud(108, 112, 36, 'rgba(110,225,255,0.75)');
  cloud(60, 56, 26, 'rgba(255,190,240,0.85)');
  // swirl arms
  g.lineCap = 'round';
  for (const [r, a0, col, w] of [[30, 0.3, 'rgba(255,150,230,0.55)', 7], [46, 2.2, 'rgba(140,120,255,0.5)', 8], [62, 4.0, 'rgba(255,110,200,0.4)', 9]]) {
    g.strokeStyle = col; g.lineWidth = w; g.beginPath();
    for (let k = 0; k <= 30; k++) {
      const a = a0 + k * 0.08, rr = r * (0.55 + k / 60);
      const px = x + 62 + Math.cos(a) * rr, py = y + 60 + Math.sin(a) * rr * 0.8;
      k ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.stroke();
  }
  // stars
  const R = rng(12345);
  for (let k = 0; k < 95; k++) {
    const sx = x + R() * 128, sy = y + R() * 128, s = R();
    g.fillStyle = s > 0.85 ? '#BFFBFF' : '#FFFFFF';
    const r = s > 0.9 ? 3 : s > 0.6 ? 2 : 1.3;
    g.fillRect(sx - r / 2, sy - r / 2, r, r);
    if (s > 0.93) { g.fillRect(sx - 4, sy - 0.6, 8, 1.2); g.fillRect(sx - 0.6, sy - 4, 1.2, 8); }
  }
  g.restore();
}

export const PALETTE = {
  purple: { i: 0, top: '#A060FF', bot: '#5A28B4' },
  purDk:  { i: 1, top: '#7A3CDC', bot: '#40188C' },
  belly:  { i: 2, top: '#F1E4FF', bot: '#BFA2F0' },
  cyan:   { i: 3, top: '#7FF5FF', bot: '#14C4F2', glow: true },
  gold:   { i: 4, top: '#FFE680', bot: '#E09A1E' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:    { i: 6, top: '#1A1416', bot: '#0C0A0B' },
  nose:   { i: 7, top: '#3A1660', bot: '#22093E' },
  brow:   { i: 8, top: '#8A48F0', bot: '#5424B0' },
  galaxy: { i: 9, draw: drawGalaxy, glow: true },
  cyanT:  { i: 10, top: '#38D6FF', bot: '#D8FEFF', glow: true },
};
const P = PALETTE;
const HEAD_SCALE = 1.14;

// UVs spanning the whole 128px cell; f(p) -> [u, v] in 0..1
function cellUV(g, sw, f) {
  const p = g.attributes.position, uv = [];
  const cx = (sw.i % 8) * 128, cy = Math.floor(sw.i / 8) * 128;
  const cl = (t) => Math.min(1, Math.max(0, t));
  for (let k = 0; k < p.count; k++) {
    const [u, v] = f(V(p.getX(k), p.getY(k), p.getZ(k)));
    uv.push((cx + 4 + cl(u) * 120) / 1024, (cy + 4 + cl(v) * 120) / 1024);
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const pur = (pts, lo = 0, hi = 1.0) => paint(hull(pts), P.purple, 'y', [lo, hi]);
  const gold = (g) => paint(g, P.gold, 'flat');
  const cyan = (g) => paint(g, P.cyan, 'flat');
  const galaxy = (g, f) => cellUV(g, P.galaxy, f);

  // ================= BODY =================
  C.push(pur([
    ...ring(V(0, 0.33, -0.36), 0.12, 0.12, 10, 'z'),
    ...ring(V(0, 0.33, -0.26), 0.2, 0.18, 10, 'z'),
    ...ring(V(0, 0.34, -0.1), 0.225, 0.21, 10, 'z'),
    ...ring(V(0, 0.37, 0.05), 0.23, 0.22, 10, 'z'),
    ...ring(V(0, 0.4, 0.17), 0.21, 0.21, 10, 'z'),
    ...ring(V(0, 0.43, 0.26), 0.14, 0.14, 10, 'z'),
  ], 0.12, 0.62));
  C.push(pur([...ring(V(0, 0.45, 0.15), 0.155, 0.14, 10, 'y'), ...ring(V(0, 0.68, 0.25), 0.135, 0.12, 10, 'y')], 0.35, 0.85));

  // ================= LEGS =================
  S.push(pur([...ring(V(0.19, 0.08, 0.22), 0.09, 0.09, 8), ...ring(V(0.188, 0.2, 0.2), 0.097, 0.1, 8),
    ...ring(V(0.155, 0.34, 0.14), 0.115, 0.125, 8)], 0.0, 0.6));
  S.push(paint(blob(0, V(0.17, 0.34, 0.14), V(0.125, 0.155, 0.14), { jitter: 0.1 }), P.purple, 'y', [0.0, 0.6]));
  S.push(paint(blob(1, V(0.18, 0.27, -0.17), V(0.135, 0.16, 0.175), { jitter: 0.12 }), P.purple, 'y', [0.0, 0.6]));
  S.push(pur([...ring(V(0.185, 0.24, -0.16), 0.093, 0.097, 8), ...ring(V(0.205, 0.13, -0.19), 0.083, 0.083, 8),
    ...ring(V(0.208, 0.08, -0.18), 0.08, 0.08, 8)], 0.0, 0.6));
  const foot = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.055, z + 0.01), 0.093, 0.055, 0.082, 0.028)), P.purDk, 'y', [0, 0.3]));
    for (const dx of [-0.058, 0, 0.058]) {
      const b = V(x + dx, 0.0, z + 0.082);
      S.push(gold(hull([
        V(b.x - 0.026, 0.0, b.z - 0.02), V(b.x + 0.026, 0.0, b.z - 0.02),
        V(b.x - 0.022, 0.055, b.z - 0.02), V(b.x + 0.022, 0.055, b.z - 0.02),
        V(b.x, 0.062, b.z + 0.0), V(b.x + dx * 0.15, 0.0, b.z + 0.075),
        V(b.x - 0.018, 0.0, b.z + 0.035), V(b.x + 0.018, 0.0, b.z + 0.035),
      ])));
    }
  };
  foot(0.193, 0.23);
  foot(0.21, -0.17);

  // glowing markings: cyan chevrons on haunch and shoulder
  const chevron = (c, nrm, s) => { // V shape lying on a surface with normal nrm (side-facing), pointing forward
    const n = nrm.clone().normalize();
    const up = V(0, 1, 0).addScaledVector(n, -n.y).normalize();
    const fw = new THREE.Vector3().crossVectors(up, n).normalize(); if (fw.z < 0) fw.negate();
    const bar = (a, b) => {
      const pts = [];
      for (const p of [a, b]) for (const d of [-1, 1]) {
        const q = p.clone().addScaledVector(up, d * 0.012 * s);
        pts.push(q.clone().addScaledVector(n, -0.02), q.clone().addScaledVector(n, 0.008));
      }
      return cyan(hull(pts));
    };
    S.push(bar(c.clone().addScaledVector(fw, 0.03 * s).addScaledVector(up, 0.0), c.clone().addScaledVector(fw, -0.03 * s).addScaledVector(up, 0.045 * s)));
    S.push(bar(c.clone().addScaledVector(fw, 0.03 * s).addScaledVector(up, 0.0), c.clone().addScaledVector(fw, -0.03 * s).addScaledVector(up, -0.045 * s)));
  };
  {
    const hc = V(0.18, 0.27, -0.17), hs = V(0.135, 0.16, 0.175);
    for (const [dy, dz] of [[0.04, -0.02], [-0.03, 0.04]]) {
      const local = V(0.9, dy / hs.y, dz / hs.z);
      local.x = Math.sqrt(Math.max(0.05, 1 - local.y * local.y - local.z * local.z));
      const p = V(hc.x + local.x * hs.x, hc.y + local.y * hs.y, hc.z + local.z * hs.z);
      chevron(p, V(local.x / hs.x, local.y / hs.y, local.z / hs.z), 1.0);
    }
  }

  {
    const hc = V(0.17, 0.34, 0.14), hs = V(0.125, 0.155, 0.14);
    for (const [dy, dz] of [[0.0, 0.0]]) {
      const local = V(0, dy / hs.y, dz / hs.z);
      local.x = Math.sqrt(Math.max(0.05, 1 - local.y * local.y - local.z * local.z));
      const p = V(hc.x + local.x * hs.x, hc.y + local.y * hs.y, hc.z + local.z * hs.z);
      chevron(p, V(local.x / hs.x, local.y / hs.y, local.z / hs.z), 0.85);
    }
  }
  const DROP = 0.03;
  const nC = C.length, nS = S.length;

  // ================= BELLY PLATES =================
  const belly = [
    [0.66, 0.36, 0.085, 0.034, -0.35],
    [0.59, 0.35, 0.095, 0.034, -0.28],
    [0.52, 0.345, 0.105, 0.034, -0.15],
    [0.45, 0.34, 0.115, 0.034, 0.0],
    [0.38, 0.325, 0.115, 0.034, 0.2],
    [0.31, 0.295, 0.11, 0.034, 0.45],
    [0.25, 0.24, 0.105, 0.034, 0.85],
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
    C.push(paint(hull(pts), P.belly, 'y', [0.2, 0.75]));
  }
  {
    const pts = [];
    for (const [y, z, w, l, t] of belly.slice(0, 6)) {
      const up = V(0, Math.cos(t), -Math.sin(t)), n = V(0, Math.sin(t), Math.cos(t));
      for (const sy of [-1, 1]) {
        const c = V(0, y, z).addScaledVector(up, sy * l);
        for (const sx of [-1, 1]) pts.push(c.clone().addScaledVector(X, sx * (w + 0.035)).addScaledVector(n, -0.04));
        pts.push(c.clone().addScaledVector(n, -0.16));
      }
    }
    C.push(pur(pts, 0.15, 0.85));
  }

  // ================= HEAD =================
  const hC = C.length, hS = S.length;
  const H = { y: 0.82, z: 0.31 };
  C.push(pur([
    ...cbox(V(0, H.y, H.z), 0.2, 0.155, 0.16, 0.07),
    ...ring(V(0, H.y + 0.175, H.z - 0.03), 0.11, 0.1, 8, 'y'),
    V(0.215, H.y - 0.06, H.z + 0.02), V(-0.215, H.y - 0.06, H.z + 0.02),
  ], 0.55, 1.0));
  const FZ = H.z + 0.16;
  // snout: wedge, narrowing to an angular nose plate
  C.push(pur([
    ...cbox(V(0, H.y - 0.07, FZ + 0.09), 0.112, 0.06, 0.11, 0.03),
    V(0.09, H.y + 0.0, FZ - 0.02), V(-0.09, H.y + 0.0, FZ - 0.02),
    V(0.06, H.y - 0.02, FZ + 0.175), V(-0.06, H.y - 0.02, FZ + 0.175),
    V(0, H.y + 0.005, FZ + 0.12),
  ], 0.6, 0.9));
  C.push(paint(hull(cbox(V(0, H.y - 0.128, FZ + 0.06), 0.092, 0.032, 0.105, 0.02)), P.belly, 'y', [0.6, 0.72]));
  // nostrils
  S.push(paint(hull([V(0.026, H.y - 0.012, FZ + 0.15), V(0.06, H.y - 0.012, FZ + 0.145), V(0.026, H.y - 0.026, FZ + 0.18),
    V(0.058, H.y - 0.026, FZ + 0.178), V(0.042, H.y - 0.034, FZ + 0.15), V(0.042, H.y - 0.042, FZ + 0.176)]), P.nose, 'flat'));
  // mouth line
  S.push(paint(hull([V(0, H.y - 0.1, FZ + 0.183), V(0, H.y - 0.09, FZ + 0.183), V(0.075, H.y - 0.1, FZ + 0.18),
    V(0.075, H.y - 0.09, FZ + 0.18), V(0, H.y - 0.095, FZ + 0.165), V(0.075, H.y - 0.095, FZ + 0.165)]), P.nose, 'flat'));
  S.push(paint(hull([V(0.1, H.y - 0.1, FZ + 0.17), V(0.1, H.y - 0.09, FZ + 0.17), V(0.118, H.y - 0.1, FZ + 0.15),
    V(0.118, H.y - 0.09, FZ + 0.15), V(0.118, H.y - 0.115, FZ + 0.05), V(0.118, H.y - 0.105, FZ + 0.05),
    V(0.103, H.y - 0.1, FZ + 0.06), V(0.088, H.y - 0.093, FZ + 0.17)]), P.nose, 'flat'));

  // fierce eyes
  const E = V(0.092, H.y + 0.045, 0);
  S.push(paint(hull(plate([[-0.05, 0.0], [0.052, 0.038], [0.06, -0.012], [0.022, -0.046], [-0.034, -0.042], [-0.052, -0.018]],
    E, FZ - 0.01, FZ + 0.01)), P.white, 'flat'));
  S.push(paint(hull(plate([[-0.03, 0.002], [0.018, 0.022], [0.025, -0.01], [0.005, -0.038], [-0.025, -0.036], [-0.036, -0.015]],
    V(E.x - 0.002, E.y, 0), FZ + 0.004, FZ + 0.016)), P.eye, 'flat'));
  S.push(paint(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.012, FZ + 0.02)), P.white, 'flat'));
  S.push(paint(hull([
    V(0.022, E.y + 0.01, FZ + 0.035), V(0.024, E.y + 0.055, FZ + 0.025),
    V(0.165, E.y + 0.055, FZ - 0.01), V(0.165, E.y + 0.1, FZ - 0.025),
    V(0.022, E.y + 0.01, FZ - 0.03), V(0.024, E.y + 0.065, FZ - 0.04),
    V(0.165, E.y + 0.055, FZ - 0.06), V(0.165, E.y + 0.1, FZ - 0.07),
  ]), P.brow, 'y'));
  // forehead rune: glowing diamond between the brows
  {
    const n = V(0, 1, 1).normalize(), u = V(0, 1, -1).normalize();
    const c = V(0, H.y + 0.152, FZ - 0.067).addScaledVector(n, 0.006);
    C.push(cyan(hull([c.clone().addScaledVector(u, 0.034), c.clone().addScaledVector(u, -0.026),
      c.clone().add(V(0.022, 0, 0)), c.clone().add(V(-0.022, 0, 0)),
      c.clone().addScaledVector(n, 0.008), c.clone().addScaledVector(n, -0.02)])));
  }
  // cheek crystal spikes (cyan), fanning back
  for (const [b, d, w, l] of [
    [V(0.19, H.y - 0.02, H.z + 0.02), V(1, 0.15, -0.8), 0.04, 0.15],
    [V(0.18, H.y - 0.09, H.z + 0.05), V(1, -0.45, -0.7), 0.035, 0.12],
  ]) S.push(cyan(shard(b, d, w, l)));

  // horns: big galaxy horns sweeping back and up
  const hornUV = (p) => [0.2 + (p.x - 0.05) / 0.4 + (H.z - p.z) * 0.6, 0.15 + (H.y + 0.42 - p.y) / 0.6];
  S.push(galaxy(tube(curveSamples(
    [V(0.09, H.y + 0.13, H.z - 0.02), V(0.15, H.y + 0.24, H.z - 0.1), V(0.2, H.y + 0.3, H.z - 0.24), V(0.21, H.y + 0.4, H.z - 0.34)],
    6, (t) => 0.062 * (1 - t) + 0.005), { seg: 6, capEnd: 0.0 }), hornUV));
  S.push(galaxy(tube(curveSamples(
    [V(0.15, H.y + 0.08, H.z - 0.08), V(0.22, H.y + 0.12, H.z - 0.17), V(0.27, H.y + 0.17, H.z - 0.27)],
    4, (t) => 0.04 * (1 - t) + 0.004), { seg: 5 }), hornUV));

  // head crest crystals
  C.push(cyan(shard(V(0, H.y + 0.15, H.z - 0.06), V(0, 1, -0.9), 0.035, 0.09)));

  // ================= FLOATING CROWN =================
  {
    const cy = H.y + 0.28, cz = H.z - 0.01, R0 = 0.13, R1 = 0.1, n = 8;
    for (let k = 0; k < n; k++) {
      const a0 = Math.PI / 8 + (2 * Math.PI * k) / n, a1 = a0 + (2 * Math.PI) / n;
      const pts = [];
      for (const a of [a0, a1]) for (const r of [R0, R1]) for (const dy of [-0.026, 0.026])
        pts.push(V(Math.cos(a) * r * 1.0, cy + dy, cz + Math.sin(a) * r * 0.9));
      C.push(paint(hull(pts), P.gold, 'y', [cy - 0.03, cy + 0.03]));
      // point at each segment middle
      const am = (a0 + a1) / 2, rm = (R0 + R1) / 2 * Math.cos(Math.PI / 8);
      const front = Math.abs(am - Math.PI / 2 - 2 * Math.PI) < 0.01 || Math.abs(am - Math.PI / 2) < 0.01;
      const h = front ? 0.12 : (Math.sin(am) > 0.1 ? 0.085 : 0.07);
      C.push(gold(hull([
        V(Math.cos(am - 0.3) * rm, cy + 0.02, cz + Math.sin(am - 0.3) * rm * 0.9),
        V(Math.cos(am + 0.3) * rm, cy + 0.02, cz + Math.sin(am + 0.3) * rm * 0.9),
        V(Math.cos(am) * (rm + 0.015), cy + 0.02, cz + Math.sin(am) * (rm + 0.015) * 0.9),
        V(Math.cos(am) * (rm - 0.015), cy + 0.02, cz + Math.sin(am) * (rm - 0.015) * 0.9),
        V(Math.cos(am) * rm, cy + 0.02 + h, cz + Math.sin(am) * rm * 0.9),
      ])));
    }
    // gems on the band: front centre + mirrored pair at the front corners
    const gem = (a, sz) => {
      const rr = R0 * Math.cos(Math.PI / 8) + 0.004;
      const c = V(Math.cos(a) * rr, cy, cz + Math.sin(a) * rr * 0.9);
      const o = V(Math.cos(a), 0, Math.sin(a) * 0.9).normalize(), t = V(-o.z, 0, o.x);
      return cyan(hull([c.clone().add(V(0, sz * 1.3, 0)), c.clone().add(V(0, -sz * 1.3, 0)),
        c.clone().addScaledVector(t, sz), c.clone().addScaledVector(t, -sz), c.clone().addScaledVector(o, sz * 0.9),
        c.clone().addScaledVector(o, -0.01)]));
    };
    C.push(gem(Math.PI / 2, 0.022));
    S.push(gem(Math.PI / 4, 0.016));
  }

  // big head: scale head, horns, face and crown about the neck joint
  {
    const k = HEAD_SCALE, piv = V(0, 0.69, 0.27);
    const m = new THREE.Matrix4().makeTranslation(piv.x, piv.y, piv.z)
      .multiply(new THREE.Matrix4().makeScale(k, k, k))
      .multiply(new THREE.Matrix4().makeTranslation(-piv.x, -piv.y, -piv.z));
    for (const g of [...C.slice(hC), ...S.slice(hS)]) { g.applyMatrix4(m); g.computeVertexNormals(); }
  }

  // ================= DORSAL ROW (one chunky cyan crystal row on the centre line) =================
  // blade crystal: diamond base (long along fw, narrow in x), tip leaning back
  const blade = (base, up, fw, sc) => {
    const u = up.clone().normalize(), f = fw.clone().normalize();
    const L = 0.058 * sc, W = 0.042 * sc, Hh = 0.17 * sc;
    const b0 = base.clone().addScaledVector(u, -0.03);
    return cyan(hull([
      b0.clone().addScaledVector(f, L), b0.clone().addScaledVector(f, -L * 1.1),
      b0.clone().add(V(W, 0, 0)), b0.clone().add(V(-W, 0, 0)),
      base.clone().addScaledVector(u, Hh * 0.35).addScaledVector(f, L * 0.5),
      base.clone().addScaledVector(u, Hh).addScaledVector(f, -L * 1.1),
    ]));
  };
  for (const [y, z, s] of [[0.66, 0.12, 0.8], [0.6, 0.03, 1.0], [0.6, -0.08, 1.2], [0.58, -0.2, 1.15], [0.54, -0.3, 0.98], [0.47, -0.38, 0.82]])
    C.push(blade(V(0, y, z), V(0, 1, -0.15), V(0, 0, 1), s));

  // ================= TAIL =================
  const tailPts = [V(0, 0.33, -0.3), V(0, 0.2, -0.5), V(0, 0.11, -0.7), V(0, 0.12, -0.9), V(0, 0.25, -1.02), V(0, 0.42, -1.02)];
  C.push(paint(tube(curveSamples(tailPts, 12, (t) => 0.11 * (1 - t) + 0.026), { seg: 8, axis: X, capEnd: 0.02 }), P.purple, 'len'));
  const tc = new THREE.CatmullRomCurve3(tailPts, false, 'centripetal');
  for (const t of [0.12, 0.27, 0.42, 0.57, 0.72, 0.85]) {
    const p = tc.getPoint(t), T = tc.getTangent(t);
    const n = V(0, T.z, -T.y).normalize(); if (n.y + n.z * 0.3 < 0) n.negate();
    const r = 0.11 * (1 - t) + 0.026;
    const k = 0.8 - t * 0.45;
    C.push(blade(p.clone().addScaledVector(n, r * 0.92), n.clone().addScaledVector(T, -0.25), T.clone().negate(), k));
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
    C.push(paint(hull(pts), P.belly, 'flat'));
  }
  // tail tip: four-point cyan star crystal
  {
    const tip = tc.getPoint(1), tT = tc.getTangent(1);
    const c = tip.clone().addScaledVector(tT, 0.05);
    C.push(cyan(hull([c.clone().addScaledVector(tT, 0.16), c.clone().addScaledVector(tT, -0.07),
      V(0.07, c.y, c.z), V(-0.07, c.y, c.z), V(0, c.y, c.z - 0.035), V(0, c.y, c.z + 0.035)])));
    S.push(cyan(shard(V(0.03, c.y, c.z), V(1, 0.15, 0), 0.03, 0.08)));
  }

  // ================= WINGS (galaxy membrane) =================
  const Sh = V(0.13, 0.55, 0.0), El = V(0.34, 0.84, -0.08), Wr = V(0.46, 1.18, -0.14);
  const tips = [V(1.02, 0.86, -0.3), V(0.96, 0.46, -0.36), V(0.74, 0.26, -0.36), V(0.48, 0.3, -0.3)];
  const Bd = V(0.14, 0.5, -0.2);
  S.push(paint(tube(curveSamples([Sh, El, Wr], 6, (t) => 0.056 - 0.02 * t), { seg: 6, capEnd: 0.02 }), P.purDk, 'y', [0.4, 1.2]));
  S.push(paint(blob(0, Wr, V(0.052, 0.052, 0.052), { jitter: 0.1 }), P.purDk, 'y', [0.9, 1.25]));
  tips.forEach((T) => {
    S.push(paint(tube(curveSamples([Wr, Wr.clone().lerp(T, 0.5).add(V(0, 0.03, 0)), T], 4, (t) => 0.024 * (1 - t) + 0.011),
      { seg: 5, capEnd: 0.0 }), P.purDk, 'y', [0.2, 1.2]));
  });
  S.push(cyan(shard(Wr.clone().add(V(0, 0.03, 0.02)), V(-0.1, 1, 0.4), 0.034, 0.11)));
  // finger-tip crystal points
  tips.slice(0, 3).forEach((T) => {
    const d = T.clone().sub(Wr).normalize();
    S.push(cyan(shard(T.clone().addScaledVector(d, -0.02), d, 0.018, 0.06)));
  });
  const wingUV = (p) => [(p.x - 0.1) / 0.95, (1.22 - p.y) / 1.0];
  const th = 0.006;
  const panel = (a, b, c) => {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const pts = [];
    for (const p of [a, b, c]) { pts.push(p.clone().addScaledVector(n, th)); pts.push(p.clone().addScaledVector(n, -th)); }
    S.push(galaxy(hull(pts), wingUV));
  };
  const back = V(0, 0, -0.002);
  const W0 = Wr.clone().add(back);
  const edge = [...tips, Bd];
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

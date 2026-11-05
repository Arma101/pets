// Volcano Dragon (GODLY): huge obsidian dragon with glowing lava cracks, big lava-tipped horns,
// spiked back, ember wings, glowing runes and ornate gold armour (crown, chest plate, pauldrons, cuffs).
import { V, THREE, hull, cbox, ring, plate, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// ---------- custom-drawn cells ----------
// In the emissive pass the kit fills the atlas black first; cell 63 is never used, so its pixel tells us
// which pass we are in. In the glow pass only the lava/rune strokes are drawn (obsidian stays dark/matte).
const isGlowPass = (ctx) => ctx.getImageData(1020, 1020, 1, 1).data[0] < 128;
const OBS_TOP = '#5A4D6B', OBS_BOT = '#1C1726';

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function lavaStroke(g, paths, wide = 1) {
  g.lineJoin = 'miter'; g.lineCap = 'round';
  for (const [col, w] of [['#E8420A', 5.2 * wide], ['#FF8A1E', 3.2 * wide], ['#FFE58F', 1.4 * wide]]) {
    g.strokeStyle = col; g.lineWidth = w;
    for (const p of paths) { g.beginPath(); g.moveTo(p[0][0], p[0][1]); for (const q of p.slice(1)) g.lineTo(q[0], q[1]); g.stroke(); }
  }
}

// obsidian gradient + random jagged branching lava cracks
function crackCell(i, seed, n = 6) {
  return {
    i, glow: true,
    draw(g, x, y) {
      const glow = isGlowPass(g);
      g.save(); g.beginPath(); g.rect(x, y, 128, 128); g.clip();
      if (!glow) {
        const gr = g.createLinearGradient(0, y + 4, 0, y + 124);
        gr.addColorStop(0, OBS_TOP); gr.addColorStop(1, OBS_BOT);
        g.fillStyle = gr; g.fillRect(x, y, 128, 128);
      }
      const r = rng(seed), paths = [];
      const walk = (px, py, ang, steps, depth) => {
        const pts = [[px, py]];
        for (let k = 0; k < steps; k++) {
          ang += (r() - 0.5) * 1.3;
          px += Math.cos(ang) * (7 + r() * 7); py += Math.sin(ang) * (7 + r() * 7);
          pts.push([px, py]);
          if (depth < 1 && r() < 0.28) walk(px, py, ang + (r() < 0.5 ? 1 : -1) * (0.7 + r() * 0.6), 2 + Math.floor(r() * 3), depth + 1);
        }
        paths.push(pts);
      };
      for (let k = 0; k < n; k++) walk(x + 10 + r() * 108, y + 10 + r() * 108, r() * Math.PI * 2, 4 + Math.floor(r() * 4), 0);
      lavaStroke(g, paths);
      g.restore();
    },
  };
}

// banded cell along v: stops [[v0, v1, colTop, colBot, glows]]
function bandCell(i, stops) {
  return {
    i, glow: stops.some((s) => s[4]),
    draw(g, x, y) {
      const glow = isGlowPass(g);
      for (const [v0, v1, a, b, gl] of stops) {
        if (glow && !gl) continue;
        const y0 = y + 4 + v0 * 120, y1 = y + 4 + v1 * 120;
        const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, a); gr.addColorStop(1, b);
        g.fillStyle = gr;
        g.fillRect(x, v0 === 0 ? y : y0, 128, (v1 === 1 ? y + 128 : y1) - (v0 === 0 ? y : y0));
      }
    },
  };
}

// glowing rune glyph tile
const GLYPHS = [
  [[[64, 18], [64, 110]], [[64, 62], [32, 28]], [[64, 62], [96, 28]], [[44, 110], [64, 90], [84, 110]]],
  [[[64, 16], [104, 64], [64, 112], [24, 64], [64, 16]], [[64, 38], [64, 90]], [[46, 64], [82, 64]]],
  [[[38, 112], [64, 74], [90, 112]], [[64, 74], [92, 46], [64, 18], [36, 46], [64, 74]]],
  [[[64, 16], [108, 104], [20, 104], [64, 16]], [[64, 50], [64, 84]], [[50, 70], [78, 70]]],
];
function runeCell(i, gi) {
  return {
    i, glow: true,
    draw(g, x, y) {
      const glow = isGlowPass(g);
      if (!glow) { g.fillStyle = '#2A1A22'; g.fillRect(x, y, 128, 128); }
      const paths = GLYPHS[gi].map((p) => p.map(([u, v]) => [x + u, y + v]));
      lavaStroke(g, paths, 2.6);
    },
  };
}

export const PALETTE = {
  crHead: crackCell(0, 7, 5),
  crBody: crackCell(1, 23, 7),
  crLeg: crackCell(2, 37, 5),
  crTail: crackCell(3, 51, 7),
  obs: { i: 4, top: OBS_TOP, bot: OBS_BOT },
  brow: { i: 7, top: '#76688C', bot: '#2E263C' },
  obsDk: { i: 5, top: '#3E3450', bot: '#17131F' },
  gold: { i: 6, top: '#FFE07A', bot: '#D79A1E' },
  white: { i: 8, top: '#FFFFFF', bot: '#F1F1F4' },
  eye: { i: 9, top: '#1A1416', bot: '#0C0A0B' },
  lava: { i: 10, top: '#FFE08A', bot: '#FF6A00', glow: true },
  ember: {
    i: 11, glow: true,
    draw(g, x, y) { // v: 0 = wrist (hot yellow) -> 1 = trailing edge (deep ember red); bright vein lines along v
      const gr = g.createLinearGradient(0, y + 4, 0, y + 124);
      gr.addColorStop(0, '#FFE88F'); gr.addColorStop(0.45, '#FFB838'); gr.addColorStop(0.72, '#FF7A12');
      gr.addColorStop(0.8, '#F0480C'); gr.addColorStop(1, '#C8300A');
      g.fillStyle = gr; g.fillRect(x, y, 128, 128);
      g.lineCap = 'round';
      for (const [col, w] of [['#FFD45A', 5], ['#FFF4C0', 2.2]]) {
        g.strokeStyle = col; g.lineWidth = w;
        for (const u of [0.13, 0.27, 0.42, 0.57, 0.71, 0.86]) {
          const px = x + 4 + u * 120;
          g.beginPath(); g.moveTo(px, y + 14); g.lineTo(px + 3, y + 50); g.lineTo(px - 2, y + 86); g.lineTo(px + 1, y + 100); g.stroke();
        }
      }
    },
  },
  belly: { i: 12, top: '#F2A050', bot: '#B0582A' },
  spike: bandCell(13, [[0, 0.5, OBS_TOP, '#2A2236'], [0.5, 0.64, '#C2300A', '#FF6A00', true], [0.64, 1, '#FF8A1E', '#FFE58F', true]]),
  horn: bandCell(14, [[0, 0.5, OBS_TOP, '#2A2236'], [0.5, 0.6, '#FF6A00', '#FFB347', true], [0.6, 1, '#FFE07A', '#D79A1E']]),
  rune0: runeCell(15, 0), rune1: runeCell(16, 1), rune2: runeCell(17, 2), rune3: runeCell(18, 3),
};
const P = PALETTE;
const K = 1.2; // global scale: a big Godly dragon

// ---------- UV helpers ----------
const cellUV = (sw, u, v) => {
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  return [(x + 4 + THREE.MathUtils.clamp(u, 0, 1) * 120) / 1024, (y + 4 + THREE.MathUtils.clamp(v, 0, 1) * 120) / 1024];
};
// per-face planar projection (dominant axis) onto a crack cell; v follows height so tops read lighter
function crackPaint(g, sw, yr = null) {
  const p = g.attributes.position; g.computeBoundingBox();
  const bb = g.boundingBox;
  const ylo = yr ? yr[0] : bb.min.y, yhi = yr ? yr[1] : bb.max.y;
  let ax0 = Infinity, ax1 = 0;
  for (let i = 0; i < p.count; i++) { const a = Math.abs(p.getX(i)); ax0 = Math.min(ax0, a); ax1 = Math.max(ax1, a); }
  if (bb.min.x < 0 && bb.max.x > 0) ax0 = 0;
  const sc = Math.max(ax1 - ax0, bb.max.z - bb.min.z, yhi - ylo, 1e-6);
  const xs = sc, zs = sc, ys = Math.max(1e-6, yhi - ylo);
  const uv = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    n.subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
    for (const q of [a, b, c]) {
      const xf = (Math.abs(q.x) - ax0) / xs, zf = (q.z - bb.min.z) / zs, yf = (yhi - q.y) / ys;
      if (ay > ax && ay > az) uv.push(...cellUV(sw, xf, n.y > 0 ? 0.02 + 0.6 * zf : 0.6 + 0.4 * zf));
      else if (ax >= az) uv.push(...cellUV(sw, zf, 0.1 + 0.9 * yf));
      else uv.push(...cellUV(sw, n.z < 0 ? 1 - xf : xf, 0.1 + 0.9 * yf));
    }
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
// v = progress from base along dir (0..len)
function alongPaint(g, sw, base, dir, len) {
  const p = g.attributes.position, d = dir.clone().normalize(), uv = [], q = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { q.fromBufferAttribute(p, i).sub(base); uv.push(...cellUV(sw, 0.5, q.dot(d) / len)); }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
function lenPaint(g, sw) {
  const t = g.userData.t, uv = [];
  for (let i = 0; i < t.length; i++) uv.push(...cellUV(sw, 0.5, t[i]));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); delete g.userData.t;
  return g;
}
// pyramid shard (kit's shard, local copy so we keep base for along-painting)
function shardPts(base, dir, w, len, sides = 4, flat = 1) {
  const d = dir.clone().normalize();
  const up = Math.abs(d.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
  const a = new THREE.Vector3().crossVectors(d, up).normalize();
  const b = new THREE.Vector3().crossVectors(a, d).normalize();
  const pts = [base.clone().addScaledVector(d, len)];
  for (let k = 0; k < sides; k++) {
    const t = (2 * Math.PI * k) / sides + Math.PI / sides;
    pts.push(base.clone().addScaledVector(a, Math.cos(t) * w).addScaledVector(b, Math.sin(t) * w * flat).addScaledVector(d, -w * 0.3));
  }
  return pts;
}
const lavaSpike = (base, dir, w, len, sides = 4, flat = 1) => alongPaint(hull(shardPts(base, dir, w, len, sides, flat)), P.spike, base, dir, len);
const goldShard = (base, dir, w, len, sides = 4, flat = 1) => paint(hull(shardPts(base, dir, w, len, sides, flat)), P.gold, 'flat');

// gold hex boss with a glowing rune tile on its face. c = face centre, n = outward normal.
function runeBoss(out, c, n, up, size, sw, depth = 0.045) {
  n = n.clone().normalize();
  const r = new THREE.Vector3().crossVectors(up, n).normalize(), u = new THREE.Vector3().crossVectors(n, r).normalize();
  const hex = (cc, rad, k0) => { const pts = []; for (let k = 0; k < 6; k++) { const a = Math.PI / 2 + k * Math.PI / 3; pts.push(cc.clone().addScaledVector(r, Math.cos(a) * rad * 0.9).addScaledVector(u, Math.sin(a) * rad)); } return pts; };
  // gold boss: bevelled hex
  out.push(paint(hull([...hex(c.clone().addScaledVector(n, -depth), size * 1.12), ...hex(c.clone().addScaledVector(n, -0.012), size * 1.12), ...hex(c, size * 0.95)]), P.gold, 'y'));
  // rune tile
  const tc = c.clone().addScaledVector(n, 0.004), ts = size * 0.78;
  const g = hull([...hex(tc, ts), ...hex(tc.clone().addScaledVector(n, 0.008), ts)]);
  const p = g.attributes.position, uv = [];
  const A = new THREE.Vector3(), B = new THREE.Vector3(), Cc = new THREE.Vector3(), fn = new THREE.Vector3(), q = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    A.fromBufferAttribute(p, i); B.fromBufferAttribute(p, i + 1); Cc.fromBufferAttribute(p, i + 2);
    fn.subVectors(B, A).cross(new THREE.Vector3().subVectors(Cc, A)).normalize();
    for (const v of [A, B, Cc]) {
      if (fn.dot(n) > 0.8) { q.subVectors(v, tc); uv.push(...cellUV(sw, 0.5 + q.dot(r) / (ts * 2.1), 0.5 - q.dot(u) / (ts * 2.1))); }
      else uv.push(...cellUV(sw, 0.0, 0.0));
    }
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.push(g);
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0), UP = V(0, 1, 0);
  const crack = (pts, sw, yr) => crackPaint(hull(pts), sw, yr);
  const gold = (g, yr) => paint(g, P.gold, yr ? 'y' : 'flat', yr || null);

  // ================= BODY (big obsidian barrel) =================
  C.push(crack([
    ...ring(V(0, 0.37, -0.42), 0.13, 0.13, 10, 'z'),
    ...ring(V(0, 0.37, -0.3), 0.21, 0.2, 10, 'z'),
    ...ring(V(0, 0.38, -0.13), 0.245, 0.235, 10, 'z'),
    ...ring(V(0, 0.41, 0.03), 0.25, 0.245, 10, 'z'),
    ...ring(V(0, 0.44, 0.17), 0.225, 0.235, 10, 'z'),
    ...ring(V(0, 0.47, 0.27), 0.14, 0.15, 10, 'z'),
  ], P.crBody, [0.12, 0.68]));
  // thick neck
  C.push(crack([...ring(V(0, 0.48, 0.15), 0.17, 0.16, 10, 'y'), ...ring(V(0, 0.72, 0.25), 0.145, 0.135, 10, 'y')], P.crBody, [0.4, 0.9]));

  // ================= LEGS (short, thick) =================
  const FL = { x: 0.2, z: 0.25 }, BL = { x: 0.25, z: -0.19 };
  S.push(crack([...ring(V(FL.x, 0.08, FL.z), 0.098, 0.098, 8), ...ring(V(FL.x, 0.22, FL.z - 0.02), 0.106, 0.11, 8),
    ...ring(V(FL.x - 0.025, 0.37, FL.z - 0.09), 0.125, 0.135, 8)], P.crLeg, [0.0, 0.6]));
  S.push(crackPaint(blob(0, V(FL.x - 0.01, 0.37, FL.z - 0.1), V(0.135, 0.165, 0.15), { jitter: 0.1 }), P.crLeg, [0.0, 0.6]));
  S.push(crackPaint(blob(1, V(BL.x - 0.005, 0.29, BL.z + 0.01), V(0.145, 0.175, 0.19), { jitter: 0.12 }), P.crLeg, [0.0, 0.6]));
  S.push(crack([...ring(V(BL.x, 0.26, BL.z + 0.02), 0.1, 0.105, 8), ...ring(V(BL.x + 0.005, 0.14, BL.z - 0.02), 0.09, 0.09, 8),
    ...ring(V(BL.x + 0.005, 0.08, BL.z - 0.01), 0.088, 0.088, 8)], P.crLeg, [0.0, 0.6]));
  // feet: obsidian block + 3 big gold claws + ornate gold cuff
  const foot = (x, z, r) => {
    S.push(paint(hull(cbox(V(x, 0.06, z + 0.012), 0.1, 0.06, 0.09, 0.03)), P.obs, 'y', [0, 0.35]));
    for (const dx of [-0.062, 0, 0.062]) {
      const b = V(x + dx, 0.0, z + 0.088);
      S.push(gold(hull([
        V(b.x - 0.029, 0.0, b.z - 0.02), V(b.x + 0.029, 0.0, b.z - 0.02),
        V(b.x - 0.024, 0.06, b.z - 0.02), V(b.x + 0.024, 0.06, b.z - 0.02),
        V(b.x, 0.068, b.z + 0.0), V(b.x + dx * 0.15, 0.0, b.z + 0.085),
        V(b.x - 0.02, 0.0, b.z + 0.04), V(b.x + 0.02, 0.0, b.z + 0.04),
      ]), [0, 0.07]));
    }
    // cuff: chunky octagonal gold band with a lip
    S.push(gold(hull([...ring(V(x, 0.115, z), r + 0.02, r + 0.02, 8), ...ring(V(x, 0.135, z), r + 0.028, r + 0.028, 8),
      ...ring(V(x, 0.175, z - 0.004), r + 0.016, r + 0.016, 8)]), [0.1, 0.18]));
  };
  foot(FL.x, FL.z, 0.1);
  foot(BL.x + 0.005, BL.z - 0.012, 0.09);

  // ================= BELLY (warm plates over a lava seam) =================
  const belly = [
    // [y, z, halfWidth, halfLen, tilt]
    [0.48, 0.357, 0.13, 0.023, -0.05],
    [0.42, 0.348, 0.132, 0.023, 0.12],
    [0.36, 0.33, 0.128, 0.023, 0.3],
    [0.305, 0.3, 0.12, 0.023, 0.55],
    [0.255, 0.255, 0.108, 0.023, 0.9],
  ];
  const bandPts = (y, z, w, l, t, nOut, nIn, wIn) => {
    const up = V(0, Math.cos(t), -Math.sin(t)), n = V(0, Math.sin(t), Math.cos(t)), pts = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const c = V(0, y, z).addScaledVector(up, sy * l);
      pts.push(c.clone().addScaledVector(X, sx * wIn).addScaledVector(n, nIn));
      pts.push(c.clone().addScaledVector(X, sx * (w - 0.01)).addScaledVector(n, nOut - 0.017));
      pts.push(c.clone().addScaledVector(X, sx * (w - 0.035)).addScaledVector(n, nOut).addScaledVector(up, -sy * 0.006));
      pts.push(c.clone().addScaledVector(X, sx * 0.03).addScaledVector(n, nOut + 0.014).addScaledVector(up, -sy * 0.008));
    }
    return pts;
  };
  for (const [y, z, w, l, t] of belly) C.push(paint(hull(bandPts(y, z, w, l, t, 0.012, -0.07, w)), P.belly, 'y', [0.2, 0.55]));
  // lava seam under the plates (shows in the gaps)
  {
    const pts = [];
    for (const [y, z, w, l, t] of belly) {
      const up = V(0, Math.cos(t), -Math.sin(t)), n = V(0, Math.sin(t), Math.cos(t));
      for (const sy of [-0.85, 0.85]) for (const sx of [-1, 1]) {
        const c = V(0, y, z).addScaledVector(up, sy * l);
        pts.push(c.clone().addScaledVector(X, sx * (w - 0.04)).addScaledVector(n, -0.012));
        pts.push(c.clone().addScaledVector(X, sx * (w - 0.04)).addScaledVector(n, -0.08));
      }
    }
    C.push(paint(hull(pts), P.lava, 'y', [0.2, 0.55]));
  }
  // obsidian chest mass behind belly + chest plate
  {
    const rows = [[0.68, 0.375, 0.12, 0.03, -0.35], [0.6, 0.37, 0.14, 0.03, -0.2], ...belly.slice(0, 4)];
    const pts = [];
    for (const [y, z, w, l, t] of rows) {
      const up = V(0, Math.cos(t), -Math.sin(t)), n = V(0, Math.sin(t), Math.cos(t));
      for (const sy of [-1, 1]) {
        const c = V(0, y, z).addScaledVector(up, sy * l);
        for (const sx of [-1, 1]) pts.push(c.clone().addScaledVector(X, sx * (w + 0.04)).addScaledVector(n, -0.045));
        pts.push(c.clone().addScaledVector(n, -0.18));
      }
    }
    C.push(crackPaint(hull(pts), P.crBody, [0.15, 0.85]));
  }

  // ================= ORNATE GOLD CHEST PLATE + RUNE =================
  {
    const rows = [[0.715, 0.375, 0.115, -0.4], [0.64, 0.378, 0.15, -0.22], [0.56, 0.38, 0.14, -0.05], [0.5, 0.38, 0.07, 0.05], [0.465, 0.378, 0.012, 0.1]];
    const pts = [];
    for (const [y, z, w, t] of rows) {
      const n = V(0, Math.sin(t), Math.cos(t));
      for (const sx of [-1, 1]) {
        pts.push(V(sx * w, y, z).addScaledVector(n, 0.012));
        pts.push(V(sx * (w * 0.8), y, z).addScaledVector(n, 0.03));
        pts.push(V(sx * (w + 0.01), y, z).addScaledVector(n, -0.07));
      }
    }
    C.push(gold(hull(pts), [0.45, 0.75]));
    runeBoss(C, V(0, 0.595, 0.432), V(0, 0.12, 1), UP, 0.05, P.rune1);
    // gold collar flanges sweeping to the shoulders
    S.push(gold(hull([V(0.1, 0.7, 0.38), V(0.15, 0.62, 0.39), V(0.2, 0.55, 0.33), V(0.23, 0.6, 0.27),
      V(0.1, 0.72, 0.33), V(0.15, 0.64, 0.33), V(0.19, 0.56, 0.29)]), [0.5, 0.75]));
  }

  // ================= GOLD PAULDRONS (layered) + RUNES =================
  {
    const a = V(0.75, 0.62, 0.15).normalize();
    const c0 = V(0.24, 0.53, 0.14);
    const rr = (c, r1, r2) => { // ring around axis a
      const t1 = new THREE.Vector3().crossVectors(a, V(0, 0, 1)).normalize(), t2 = new THREE.Vector3().crossVectors(a, t1).normalize(), pts = [];
      for (let k = 0; k < 8; k++) { const th = Math.PI / 8 + k * Math.PI / 4; pts.push(c.clone().addScaledVector(t1, Math.cos(th) * r1).addScaledVector(t2, Math.sin(th) * r2)); }
      return pts;
    };
    S.push(gold(hull([...rr(c0.clone().addScaledVector(a, -0.05), 0.12, 0.125), ...rr(c0.clone().addScaledVector(a, 0.0), 0.12, 0.13),
      ...rr(c0.clone().addScaledVector(a, 0.028), 0.095, 0.1)]), [0.35, 0.62]));
    const c1 = c0.clone().addScaledVector(a, 0.03);
    S.push(gold(hull([...rr(c1, 0.085, 0.09), ...rr(c1.clone().addScaledVector(a, 0.03), 0.068, 0.074)]), [0.45, 0.7]));
    runeBoss(S, c1.clone().addScaledVector(a, 0.045), a, V(0, 0, 1).addScaledVector(UP, 0.3), 0.04, P.rune0, 0.03);
    // pauldron spikes (lava tipped)
    S.push(lavaSpike(c1.clone().addScaledVector(a, 0.02).add(V(-0.03, 0.03, -0.06)), V(0.45, 1, -0.45), 0.036, 0.12));
  }

  // gold hip guard with a big rune
  runeBoss(S, V(0.388, 0.335, -0.202), V(0.95, 0.285, -0.14), UP, 0.075, P.rune3, 0.06);

  // ================= HEAD (big, boxy) =================
  const hC = C.length, hS = S.length;
  const H = { y: 0.85, z: 0.31 };
  C.push(crack([
    ...cbox(V(0, H.y, H.z), 0.235, 0.178, 0.175, 0.05),
    ...ring(V(0, H.y + 0.19, H.z - 0.03), 0.12, 0.11, 8, 'y'),
    V(0.23, H.y - 0.07, H.z + 0.02), V(-0.23, H.y - 0.07, H.z + 0.02),
  ], P.crHead, [0.62, 1.06]));
  const FZ = H.z + 0.175;
  // blocky snout
  C.push(crack([
    ...cbox(V(0, H.y - 0.075, FZ + 0.09), 0.125, 0.064, 0.11, 0.032),
    V(0.1, H.y + 0.0, FZ - 0.02), V(-0.1, H.y + 0.0, FZ - 0.02),
    V(0.07, H.y - 0.016, FZ + 0.18), V(-0.07, H.y - 0.016, FZ + 0.18),
  ], P.crHead, [0.66, 0.92]));
  // lower jaw
  C.push(paint(hull(cbox(V(0, H.y - 0.15, FZ + 0.07), 0.1, 0.036, 0.11, 0.02)), P.obs, 'y', [H.y - 0.2, H.y - 0.08]));
  // glowing nostrils
  S.push(paint(hull([V(0.03, H.y - 0.008, FZ + 0.165), V(0.066, H.y - 0.008, FZ + 0.16), V(0.03, H.y - 0.023, FZ + 0.208),
    V(0.066, H.y - 0.023, FZ + 0.206), V(0.048, H.y - 0.032, FZ + 0.16), V(0.048, H.y - 0.043, FZ + 0.2)]), P.lava, 'flat'));
  // glowing mouth line
  S.push(paint(hull([V(0, H.y - 0.106, FZ + 0.208), V(0, H.y - 0.094, FZ + 0.208), V(0.085, H.y - 0.106, FZ + 0.208),
    V(0.085, H.y - 0.094, FZ + 0.208), V(0, H.y - 0.1, FZ + 0.19), V(0.085, H.y - 0.1, FZ + 0.19)]), P.lava, 'flat'));
  S.push(paint(hull([V(0.106, H.y - 0.106, FZ + 0.196), V(0.106, H.y - 0.094, FZ + 0.196), V(0.13, H.y - 0.106, FZ + 0.17),
    V(0.13, H.y - 0.094, FZ + 0.17), V(0.13, H.y - 0.124, FZ + 0.05), V(0.13, H.y - 0.112, FZ + 0.05),
    V(0.112, H.y - 0.107, FZ + 0.06), V(0.095, H.y - 0.1, FZ + 0.19)]), P.lava, 'flat'));
  // small white fangs
  S.push(paint(hull([V(0.07, H.y - 0.1, FZ + 0.196), V(0.095, H.y - 0.1, FZ + 0.19), V(0.083, H.y - 0.1, FZ + 0.175),
    V(0.082, H.y - 0.142, FZ + 0.19)]), P.white, 'flat'));

  // fierce eyes
  const E = V(0.1, H.y + 0.055, 0), es = 1.3, sc2 = (pts) => pts.map(([u, v]) => [u * es, v * es]);
  S.push(paint(hull(plate(sc2([[-0.054, 0.0], [0.056, 0.04], [0.064, -0.012], [0.024, -0.05], [-0.036, -0.045], [-0.056, -0.02]]),
    E, FZ - 0.012, FZ + 0.01)), P.white, 'flat'));
  S.push(paint(hull(plate(sc2([[-0.032, 0.002], [0.02, 0.024], [0.027, -0.01], [0.005, -0.04], [-0.027, -0.038], [-0.038, -0.016]]),
    V(E.x - 0.003, E.y, 0), FZ + 0.004, FZ + 0.016)), P.eye, 'flat'));
  S.push(paint(hull(plate([[-0.01, -0.01], [0.01, -0.01], [0.01, 0.01], [-0.01, 0.01]],
    V(E.x + 0.009, E.y + 0.006, 0), FZ + 0.012, FZ + 0.021)), P.white, 'flat'));
  // heavy brow (dark obsidian, protruding)
  S.push(paint(hull([
    V(0.016, E.y + 0.01, FZ + 0.062), V(0.018, E.y + 0.08, FZ + 0.052),
    V(0.2, E.y + 0.066, FZ + 0.03), V(0.2, E.y + 0.135, FZ + 0.005),
    V(0.11, E.y + 0.034, FZ + 0.052),
    V(0.018, E.y + 0.01, FZ - 0.03), V(0.02, E.y + 0.09, FZ - 0.04),
    V(0.2, E.y + 0.066, FZ - 0.06), V(0.2, E.y + 0.135, FZ - 0.075),
  ]), P.brow, 'y', [E.y, E.y + 0.13]));

  // ================= GOLD CROWN / FOREHEAD PLATE =================
  {
    const cy = H.y + 0.2, cz = H.z + 0.09;
    // band following the top-front chamfer
    C.push(gold(hull([
      V(-0.13, cy - 0.035, cz + 0.06), V(0.13, cy - 0.035, cz + 0.06), V(-0.15, cy + 0.0, cz + 0.02), V(0.15, cy + 0.0, cz + 0.02),
      V(-0.13, cy + 0.035, cz - 0.03), V(0.13, cy + 0.035, cz - 0.03),
      V(-0.12, cy - 0.06, cz + 0.0), V(0.12, cy - 0.06, cz + 0.0), V(-0.12, cy + 0.0, cz - 0.07), V(0.12, cy + 0.0, cz - 0.07),
      V(0, cy - 0.065, cz + 0.07),
    ]), [cy - 0.07, cy + 0.12]));
    runeBoss(C, V(0, cy + 0.0, cz + 0.06), V(0, 0.75, 1), UP, 0.04, P.rune3, 0.035);
    // crown points
    C.push(goldShard(V(0, cy + 0.03, cz - 0.0), V(0, 1, 0.18), 0.045, 0.16));
    S.push(goldShard(V(0.075, cy + 0.025, cz - 0.01), V(0.25, 1, 0.1), 0.034, 0.1));
    S.push(goldShard(V(0.135, cy + 0.0, cz - 0.03), V(0.6, 1, 0.0), 0.028, 0.075));
  }

  // ================= HORNS (big, swept back, obsidian -> lava -> gold tip) =================
  S.push(lenPaint(tube(curveSamples(
    [V(0.1, H.y + 0.15, H.z - 0.05), V(0.17, H.y + 0.27, H.z - 0.16), V(0.21, H.y + 0.37, H.z - 0.32), V(0.21, H.y + 0.42, H.z - 0.46)],
    7, (t) => 0.072 * (1 - t) + 0.004), { seg: 6, capEnd: 0.0 }), P.horn));
  S.push(lenPaint(tube(curveSamples(
    [V(0.16, H.y + 0.06, H.z - 0.08), V(0.24, H.y + 0.09, H.z - 0.18), V(0.3, H.y + 0.1, H.z - 0.3)],
    5, (t) => 0.045 * (1 - t) + 0.003), { seg: 5 }), P.horn));
  // obsidian cheek frills with lava tips
  for (const [b, d, w, l] of [
    [V(0.2, H.y - 0.05, H.z - 0.02), V(1, -0.05, -1), 0.05, 0.15],
    [V(0.18, H.y - 0.12, H.z + 0.02), V(0.8, -0.6, -0.8), 0.04, 0.12],
  ]) S.push(lavaSpike(b, d, w, l, 4, 0.45));
  // head-back spikes
  C.push(lavaSpike(V(0, H.y + 0.13, H.z - 0.12), V(0, 1, -1), 0.04, 0.1));
  C.push(lavaSpike(V(0, H.y + 0.02, H.z - 0.17), V(0, 0.6, -1), 0.038, 0.1));
  // scale the whole head up about the neck joint
  for (const g of [...C.slice(hC), ...S.slice(hS)]) { g.translate(0, -0.74, -0.27); g.scale(1.15, 1.15, 1.15); g.translate(0, 0.74, 0.27); }

  // ================= BACK SPIKES (big, lava tipped) =================
  const spine = [[0.72, 0.11, 1.15], [0.67, 0.03, 1.4], [0.645, -0.06, 1.5], [0.625, -0.16, 1.6], [0.6, -0.26, 1.7], [0.555, -0.35, 1.5], [0.5, -0.43, 1.1]];
  for (const [y, z, s] of spine) C.push(lavaSpike(V(0, y, z), V(0, 1, -0.65), 0.05 * s, 0.19 * s, 4, 1.5));
  // layered side shards flanking the spine
  for (const [y, z, s] of spine.slice(1, 6)) S.push(lavaSpike(V(0.055, y - 0.03, z - 0.02), V(0.45, 1, -0.6), 0.035 * s, 0.1 * s, 4, 1.4));
  // flank spikes
  S.push(lavaSpike(V(0.16, 0.57, -0.06), V(0.6, 1, -0.4), 0.045, 0.11));
  S.push(lavaSpike(V(0.16, 0.53, -0.22), V(0.6, 1, -0.7), 0.042, 0.1));

  // ================= TAIL =================
  const tailPts = [V(0, 0.36, -0.32), V(0, 0.24, -0.52), V(0, 0.13, -0.74), V(0, 0.13, -0.95), V(0, 0.26, -1.1), V(0, 0.46, -1.13)];
  C.push(crackPaint(tube(curveSamples(tailPts, 12, (t) => 0.125 * (1 - t) + 0.03), { seg: 8, axis: X, capEnd: 0.02 }), P.crTail));
  const tc = new THREE.CatmullRomCurve3(tailPts, false, 'centripetal');
  for (const t of [0.13, 0.29, 0.45, 0.61, 0.77]) {
    const p = tc.getPoint(t), T = tc.getTangent(t);
    const n = V(0, T.z, -T.y).normalize(); if (n.y + n.z * 0.3 < 0) n.negate();
    const r = 0.125 * (1 - t) + 0.03, k = 0.95 - t * 0.45;
    C.push(lavaSpike(p.clone().addScaledVector(n, r * 0.75), n.clone().addScaledVector(T, -0.6), 0.05 * k, 0.1 * k));
  }
  // tail blade: gold cuff + obsidian/lava spade
  {
    const tip = tc.getPoint(1), tT = tc.getTangent(1);
    C.push(gold(hull([...ring(tc.getPoint(0.93), 0.046, 0.046, 8, 'y'), ...ring(tc.getPoint(0.97), 0.05, 0.05, 8, 'y')]), [0.3, 0.5]));
    const base = tip.clone().addScaledVector(tT, -0.03);
    C.push(alongPaint(hull([tip.clone().addScaledVector(tT, 0.24), base,
      V(0.11, tip.y + 0.04, tip.z), V(-0.11, tip.y + 0.04, tip.z),
      V(0, tip.y + 0.05, tip.z - 0.035), V(0, tip.y + 0.05, tip.z + 0.035)]), P.spike, base, tT, 0.27));
    S.push(lavaSpike(V(0.06, tip.y + 0.03, tip.z), V(1, -0.7, 0), 0.035, 0.12));
  }

  // ================= WINGS (obsidian bones, ember membrane) =================
  const Sh = V(0.14, 0.6, 0.0), El = V(0.37, 0.9, -0.08), Wr = V(0.5, 1.26, -0.15);
  const tips = [V(1.1, 0.8, -0.32), V(0.93, 0.34, -0.38), V(0.58, 0.26, -0.34)];
  const Bd = V(0.15, 0.54, -0.22);
  S.push(paint(tube(curveSamples([Sh, El, Wr], 6, (t) => 0.068 - 0.024 * t), { seg: 6, capEnd: 0.02 }), P.obs, 'y', [0.4, 1.3]));
  S.push(paint(blob(0, Wr, V(0.058, 0.058, 0.058), { jitter: 0.1 }), P.obs, 'y', [0.9, 1.35]));
  S.push(paint(blob(0, El, V(0.07, 0.07, 0.07), { jitter: 0.1 }), P.obs, 'y', [0.6, 1.2]));
  tips.forEach((T) => {
    S.push(paint(tube(curveSamples([Wr, Wr.clone().lerp(T, 0.5).add(V(0, 0.03, 0)), T], 4, (t) => 0.036 * (1 - t) + 0.017),
      { seg: 5, capEnd: 0.0 }), P.obsDk, 'y', [0.2, 1.3]));
    const d = T.clone().sub(Wr).normalize();
    S.push(goldShard(T.clone().addScaledVector(d, -0.01), d, 0.022, 0.07));
  });
  // wrist claw (gold hook)
  S.push(goldShard(Wr.clone().add(V(0, 0.035, 0.02)), V(-0.1, 1, 0.5), 0.04, 0.12));
  // gold wing-arm bracer + rune
  {
    const mid = El.clone().lerp(Wr, 0.5), d = Wr.clone().sub(El).normalize();
    const b0 = mid.clone().addScaledVector(d, -0.07), b1 = mid.clone().addScaledVector(d, 0.07);
    S.push(gold(tube([{ p: b0, rx: 0.062, ry: 0.062 }, { p: b0.clone().addScaledVector(d, 0.02), rx: 0.068, ry: 0.068 }, { p: b1, rx: 0.058, ry: 0.058 }], { seg: 6 }), [0.9, 1.2]));
    runeBoss(S, mid.clone().add(V(0, 0, 0.072)), V(0, 0, 1), d, 0.034, P.rune2, 0.03);
  }
  // membranes: flat faceted panels (closed thin solids)
  const th = 0.007;
  // each corner carries a [u, v] (v: 0 wrist .. 1 trailing edge; u spreads the vein lines across the wing)
  const panel = (a, b, c, ta, tb, tcv) => {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const pts = [];
    for (const p of [a, b, c]) { pts.push(p.clone().addScaledVector(n, th)); pts.push(p.clone().addScaledVector(n, -th)); }
    const g = hull(pts), pa = g.attributes.position, uv = [], q = new THREE.Vector3();
    for (let i = 0; i < pa.count; i++) {
      q.fromBufferAttribute(pa, i);
      const ds = [a, b, c].map((p) => p.distanceToSquared(q)), k = ds.indexOf(Math.min(...ds)), t = [ta, tb, tcv][k];
      uv.push(...cellUV(P.ember, t[0], t[1]));
    }
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    S.push(g);
  };
  const back = V(0, 0, -0.002);
  const W0 = Wr.clone().add(back);
  const edge = [tips[0], tips[1], tips[2], Bd];
  const eu = [0.04, 0.36, 0.66, 0.96], tW = [0.5, 0.0];
  for (let i = 0; i < edge.length - 1; i++) {
    const a = edge[i].clone().add(back), b = edge[i + 1].clone().add(back);
    const m = a.clone().lerp(b, 0.5).lerp(Wr, 0.2).add(V(0, 0, -0.015));
    const mi = W0.clone().lerp(m, 0.5).add(V(0, 0, 0.012));
    const ta = [eu[i], 1], tb = [eu[i + 1], 1], tm = [(eu[i] + eu[i + 1]) / 2, 0.97], tmi = [(0.5 + tm[0]) / 2, 0.5];
    panel(W0, a, mi, tW, ta, tmi); panel(a, m, mi, ta, tm, tmi); panel(mi, m, b, tmi, tm, tb); panel(W0, mi, b, tW, tmi, tb);
  }
  panel(W0, Bd.clone().add(back), El.clone().add(back), tW, [0.96, 1], [0.92, 0.3]);
  panel(El.clone().add(back), Bd.clone().add(back), Sh.clone().add(back), [0.92, 0.3], [0.96, 1], [0.97, 0.6]);

  const geo = assemble(C, S);
  geo.scale(K, K, K);
  geo.computeBoundingBox();
  return geo;
}

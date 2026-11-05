// Red Panda Rush (Secret, Round 7 – Blossom Brawl): chunky faceted red panda with a cream face mask,
// ringed tail, pink silk scarf, jade pendant & bangles, cherry blossoms, glowing mint runes and floating petals.
// Body patterns are painted into the atlas and mapped with a per-facet planar projection (no overlay geometry).
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// ---------------- colours ----------------
const RU_TOP = [232, 110, 46], RU_BOT = [178, 62, 26];      // rusty red-orange
const DK_TOP = [86, 46, 34], DK_BOT = [40, 22, 18];         // dark brown legs/belly
const CR_TOP = [255, 244, 222], CR_BOT = [236, 208, 164];   // cream
const GL_TOP = [160, 255, 225], GL_BOT = [30, 222, 165];    // glowing mint-jade runes
const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const lerp3 = (a, b, t) => [0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * clamp01(t));
const rust = (t) => lerp3(RU_TOP, RU_BOT, t);
const dark = (t) => lerp3(DK_TOP, DK_BOT, t);
const glow = (t) => lerp3(GL_TOP, GL_BOT, t);
const cream = (t) => lerp3(CR_TOP, CR_BOT, t);

// ---------------- layout ----------------
const H = { y: 0.68, z: 0.36, hx: 0.215, hy: 0.15, hz: 0.15 }; // head centre & half sizes
const FZ = H.z + H.hz;                                            // front face plane
const BELLY_Y = 0.3;                                              // dark belly line on the torso

// ---- glowing rune patterns ----
// flank: a five-petal blossom glyph with swooshes running fore & aft (z = horizontal, y = up)
const BG = { z: -0.06, y: 0.43, r: 0.062 };
function flankGlow(z, y) {
  const dz = z - BG.z, dy = y - BG.y, r = Math.hypot(dz, dy), th = Math.atan2(dy, dz) - Math.PI / 2;
  const rp = BG.r * (0.45 + 0.55 * Math.abs(Math.cos(2.5 * th)));
  if (r < BG.r * 1.05 && Math.abs(r - rp) < 0.0075) return true;
  if (r < 0.013) return true;
  // rear swoosh (tapering towards the hip)
  if (z < BG.z - BG.r * 0.9 && z > -0.25) {
    const d = (BG.z - BG.r * 0.9 - z) / 0.14;
    const yc = BG.y - 0.005 + 0.035 * Math.sin(d * Math.PI * 1.2);
    if (Math.abs(y - yc) < 0.009 * (1 - d) + 0.002) return true;
  }
  // front swoosh (towards the shoulder)
  if (z > BG.z + BG.r * 0.9 && z < 0.12) {
    const d = (z - BG.z - BG.r * 0.9) / 0.12;
    const yc = BG.y + 0.005 - 0.03 * Math.sin(d * Math.PI * 1.2);
    if (Math.abs(y - yc) < 0.009 * (1 - d) + 0.002) return true;
  }
  return false;
}
// spine: a chain of glowing diamonds (z along the back, x across)
function spineGlow(z, x) {
  for (const zc of [-0.3, -0.18, -0.06, 0.06]) {
    const s = zc === -0.06 ? 0.034 : 0.026;
    if (Math.abs(x) / (s * 0.7) + Math.abs(z - zc) / s < 1) return true;
  }
  return Math.abs(x) < 0.005 && z > -0.32 && z < 0.08;
}
// body colour at (z,y) on the sides
const sideCol = (z, y) => (y < BELLY_Y ? dark((BELLY_Y - y) / 0.12) : rust((0.6 - y) / 0.32));

// ---------------- atlas regions (rows 4..7 of the atlas) ----------------
const REG = {
  bodySide: { x: 0, y: 512, w: 512, h: 256, a: [-0.5, 0.36], b: [0.64, 0.14],
    col: (z, y) => (flankGlow(z, y) ? glow((0.5 - y) / 0.15) : sideCol(z, y)),
    glow: (z, y) => flankGlow(z, y) },
  bodyTop: { x: 512, y: 512, w: 512, h: 256, a: [-0.5, 0.36], b: [-0.26, 0.26],
    col: (z, x) => (spineGlow(z, x) ? glow(0.2) : rust(0.05)),
    glow: (z, x) => spineGlow(z, x) },
  bodyFront: { x: 0, y: 768, w: 256, h: 256, a: [-0.26, 0.26], b: [0.64, 0.14],
    col: (x, y) => sideCol(0, y), glow: () => false },
};
function drawRegions(g, glowPass) {
  for (const r of Object.values(REG)) {
    const img = g.getImageData(r.x, r.y, r.w, r.h);
    for (let py = 0; py < r.h; py++) for (let px = 0; px < r.w; px++) {
      const acc = [0, 0, 0];
      let hit = 0;
      for (const [ox, oy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
        const a = r.a[0] + ((px + ox) / r.w) * (r.a[1] - r.a[0]);
        const b = r.b[0] + ((py + oy) / r.h) * (r.b[1] - r.b[0]);
        const isG = r.glow(a, b);
        hit += isG ? 1 : 0;
        const c = glowPass ? (isG ? r.col(a, b) : [0, 0, 0]) : r.col(a, b);
        for (let k = 0; k < 3; k++) acc[k] += c[k] / 4;
      }
      if (glowPass && !hit) continue;
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

// ringed tail: rust with pale cream bands, darker rust tip
const TAIL_BANDS = [0.14, 0.3, 0.46, 0.61, 0.75];
function drawTail(g, x, y) {
  for (let py = 0; py < 128; py++) {
    const t = clamp01((py - 16) / 96);
    const band = TAIL_BANDS.some((c) => Math.abs(t - c) < 0.045);
    const col = t > 0.88 ? lerp3(RU_BOT, DK_TOP, 0.55) : band ? cream(0.25 + 0.4 * t) : rust(0.1 + 0.5 * t);
    g.fillStyle = hex(col);
    g.fillRect(x, y + py, 128, 1);
  }
}
// legs: rust shoulders/haunches turning sharply to dark brown below
function drawLeg(g, x, y) {
  for (let py = 0; py < 128; py++) {
    const t = clamp01((py - 16) / 96);
    g.fillStyle = hex(t < 0.3 ? rust(0.35 + t) : dark((t - 0.3) / 0.7));
    g.fillRect(x, y + py, 128, 1);
  }
}

export const PALETTE = {
  rust: { i: 0, top: hex(RU_TOP), bot: hex(RU_BOT) },
  cream: { i: 1, top: hex(CR_TOP), bot: hex(CR_BOT) },
  muzzle: { i: 2, top: '#FFF6E6', bot: '#EBCFA3' },
  nose: { i: 3, top: '#3A3236', bot: '#151113' },
  eye: { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white: { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  mouth: { i: 6, top: '#4A2A22', bot: '#2E1A14' },
  dark: { i: 7, top: hex(DK_TOP), bot: hex(DK_BOT) },
  brow: { i: 8, top: '#C4532A', bot: '#7E2C14' },
  tear: { i: 9, top: '#B9461E', bot: '#8E3014' },
  earIn: { i: 10, top: '#4A2A22', bot: '#2A1814' },
  paw: { i: 11, top: '#5A3428', bot: '#2A1814' },
  claw: { i: 12, top: '#FFF3DE', bot: '#D9C3A0' },
  silk: { i: 13, top: '#FF8FC0', bot: '#D9387A' },
  silkDk: { i: 14, top: '#E2558F', bot: '#A82460' },
  jade: { i: 15, top: '#7FE8B8', bot: '#1E9A6C' },
  petal: { i: 16, top: '#FFE4F0', bot: '#FF9CC6' },
  petalC: { i: 17, top: '#FFE27A', bot: '#F2A93B' },
  glowMint: { i: 18, top: hex(GL_TOP), bot: hex(GL_BOT), glow: true },
  glowPink: { i: 19, top: '#FFC2DE', bot: '#FF4F9E', glow: true },
  glowJade: { i: 20, top: '#C8FFE8', bot: '#3BE6A6', glow: true },
  tail: { i: 21, draw: drawTail },
  leg: { i: 22, draw: drawLeg },
  regions: { i: 32, draw: (g) => drawRegions(g, false) },        // rows 4..7
  regionsGlow: { i: 40, glow: true, draw: (g) => drawRegions(g, true) }, // same rects; only glow pixels
};
const SW = PALETTE;

// per-facet planar projection
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
const bodyPaint = (g) => project(g, (n) => {
  if (n.y > 0.75) return [REG.bodyTop, (v) => [v.z, v.x]];
  if (Math.abs(n.z) > 0.8) return [REG.bodyFront, (v) => [v.x, v.y]];
  return [REG.bodySide, (v) => [v.z, v.y]];
});

// ---------------- small builders ----------------
// ringed tail: every tube segment gets one solid band colour (crisp faceted rings), shaded by height
const TAIL_PAT = 'rrccrrccrrccrrcdd';
function cellUV(sw, t) {
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  return [(x + 64) / 1024, (y + 16 + clamp01(t) * 96) / 1024];
}
function bandTail(g, nSeg) {
  const tArr = g.userData.t, p = g.attributes.position, uv = [];
  for (let i = 0; i < p.count; i += 3) {
    const tm = (tArr[i] + tArr[i + 1] + tArr[i + 2]) / 3;
    const k = Math.min(nSeg - 1, Math.floor(tm * nSeg));
    const ch = TAIL_PAT[k] || 'd';
    const sw = ch === 'c' ? SW.cream : ch === 'r' ? SW.rust : SW.brow;
    for (let j = 0; j < 3; j++) uv.push(...cellUV(sw, 0.15 + 0.7 * (1 - clamp01((p.getY(i + j) - 0.4) / 0.6))));
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}
// petal: flat, faceted teardrop lying in the plane spanned by u (length) and n x u
function petal(c, u, n, len, wid, th = 0.012) {
  u = u.clone().normalize(); n = n.clone().normalize();
  const b = new THREE.Vector3().crossVectors(n, u).normalize();
  const pts = [];
  const P = (s, w, h) => c.clone().addScaledVector(u, s).addScaledVector(b, w).addScaledVector(n, h);
  for (const h of [-th / 2, th / 2]) {
    const hh = h * 0.6;
    pts.push(P(0, 0, h * 0.4), P(len * 0.45, wid, h), P(len * 0.45, -wid, h), P(len * 0.85, wid * 0.7, hh),
      P(len * 0.85, -wid * 0.7, hh), P(len, wid * 0.22, hh * 0.5), P(len, -wid * 0.22, hh * 0.5));
  }
  pts.push(P(len * 0.5, 0, th * 0.9)); // slight cup
  return hull(pts);
}
// five-petal blossom facing n; `up` sets the first petal's direction (petal 0 points along up)
function blossom(out, c, n, up, R, { sw = SW.petal, center = SW.petalC, th = 0.012 } = {}) {
  n = n.clone().normalize();
  const u0 = up.clone().addScaledVector(n, -up.dot(n)).normalize();
  for (let k = 0; k < 5; k++) {
    const u = u0.clone().applyAxisAngle(n, (2 * Math.PI * k) / 5);
    out.push(paint(petal(c.clone().addScaledVector(u, R * 0.12), u, n, R, R * 0.42, th), sw, 'flat'));
  }
  out.push(paint(blob(0, c.clone().addScaledVector(n, th * 0.6), V(R * 0.26, R * 0.26, R * 0.26)), center, 'flat'));
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const rustP = (g, lo, hi) => paint(g, SW.rust, 'y', [lo, hi]);
  const creamF = (g) => paint(g, SW.cream, 'flat');

  // ================= TORSO =================
  C.push(bodyPaint(hull([
    ...ring(V(0, 0.4, -0.42), 0.11, 0.1, 10, 'z'),
    ...ring(V(0, 0.39, -0.36), 0.175, 0.16, 10, 'z'),
    ...ring(V(0, 0.38, -0.2), 0.19, 0.175, 10, 'z'),
    ...ring(V(0, 0.38, -0.02), 0.195, 0.18, 10, 'z'),
    ...ring(V(0, 0.4, 0.14), 0.19, 0.18, 10, 'z'),
    ...ring(V(0, 0.44, 0.25), 0.14, 0.135, 10, 'z'),
  ])));
  // neck into head
  C.push(rustP(hull([...ring(V(0, 0.46, 0.2), 0.145, 0.135, 10, 'y'), ...ring(V(0, 0.62, 0.3), 0.155, 0.12, 10, 'y')]), 0.3, 0.8));
  // dark chest panel under the scarf
  C.push(paint(hull([...ring(V(0, 0.3, 0.22), 0.11, 0.08, 8, 'y'), ...ring(V(0, 0.46, 0.29), 0.12, 0.07, 8, 'y')]), SW.dark, 'y', [0.2, 0.5]));

  // ================= LEGS (dark brown, short and thick) =================
  const thick = (g, cx, cz, k = 1.12) => {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { p.setX(i, cx + (p.getX(i) - cx) * k); p.setZ(i, cz + (p.getZ(i) - cz) * k); }
    g.computeVertexNormals();
    return g;
  };
  const FL = { x: 0.15, z: 0.17 };
  S.push(paint(hull([...ring(V(FL.x, 0.06, FL.z + 0.01), 0.075, 0.075, 8), ...ring(V(FL.x - 0.004, 0.2, FL.z), 0.082, 0.082, 8),
    ...ring(V(FL.x - 0.02, 0.36, FL.z - 0.02), 0.095, 0.11, 8), ...ring(V(FL.x - 0.035, 0.46, FL.z - 0.03), 0.065, 0.085, 8)]),
  SW.leg, 'y', [0, 0.6]));
  thick(S[S.length - 1], FL.x, FL.z);
  const BL = { x: 0.155, z: -0.27 };
  S.push(paint(hull([...ring(V(BL.x - 0.015, 0.43, BL.z + 0.02), 0.135, 0.135, 8, 'x'),
    ...ring(V(BL.x + 0.005, 0.43, BL.z + 0.02), 0.115, 0.115, 8, 'x'),
    ...ring(V(BL.x + 0.005, 0.2, BL.z - 0.03), 0.082, 0.088, 8)]), SW.leg, 'y', [0, 0.6]));
  thick(S[S.length - 1], BL.x, BL.z, 1.06);
  S.push(paint(hull([...ring(V(BL.x + 0.005, 0.22, BL.z - 0.03), 0.078, 0.084, 8), ...ring(V(BL.x + 0.008, 0.06, BL.z), 0.074, 0.072, 8)]),
    SW.leg, 'y', [0, 0.6]));
  thick(S[S.length - 1], BL.x, BL.z - 0.015);
  // paws: dark block + 4 toes with pale claw tips
  const paw = (x, z, s = 1) => {
    S.push(paint(hull(cbox(V(x, 0.042, z), 0.076 * s, 0.042, 0.07 * s, 0.022)), SW.paw, 'y', [0, 0.1]));
    for (const dx of [-0.054, -0.018, 0.018, 0.054]) {
      S.push(paint(hull(cbox(V(x + dx * s, 0.034, z + 0.064 * s), 0.019 * s, 0.034, 0.03, 0.01)), SW.paw, 'y', [0, 0.1]));
      S.push(paint(hull([V(x + dx * s - 0.008, 0.004, z + 0.064 * s + 0.026), V(x + dx * s + 0.008, 0.004, z + 0.064 * s + 0.026),
        V(x + dx * s - 0.008, 0.022, z + 0.064 * s + 0.026), V(x + dx * s + 0.008, 0.022, z + 0.064 * s + 0.026),
        V(x + dx * s, 0.004, z + 0.064 * s + 0.05), V(x + dx * s, 0.014, z + 0.064 * s + 0.044)]), SW.claw, 'flat'));
    }
  };
  paw(FL.x, FL.z + 0.02, 1.2);
  paw(BL.x + 0.008, BL.z + 0.02, 1.16);
  // jade bangles on the forelegs (with a glowing rim)
  S.push(paint(hull([...ring(V(FL.x - 0.003, 0.15, FL.z + 0.004), 0.104, 0.104, 10), ...ring(V(FL.x - 0.003, 0.19, FL.z + 0.002), 0.106, 0.106, 10)]),
    SW.jade, 'y', [0.14, 0.2]));
  S.push(paint(hull([...ring(V(FL.x - 0.003, 0.165, FL.z + 0.004), 0.111, 0.111, 10), ...ring(V(FL.x - 0.003, 0.175, FL.z + 0.003), 0.111, 0.111, 10)]),
    SW.glowJade, 'flat'));
  // rust fur tufts at shoulder & hip
  S.push(rustP(shard(V(0.17, 0.45, 0.1), V(0.6, -0.4, -1), 0.045, 0.075), 0.35, 0.5));
  S.push(rustP(shard(V(0.2, 0.48, -0.2), V(0.5, 0.1, -1), 0.045, 0.08), 0.4, 0.55));

  // ================= SILK SCARF (pink, knotted at the front) + JADE PENDANT =================
  C.push(paint(hull([...ring(V(0, 0.5, 0.235), 0.172, 0.15, 12, 'y', 0), ...ring(V(0, 0.575, 0.27), 0.17, 0.14, 12, 'y', 0)]),
    SW.silk, 'y', [0.48, 0.6]));
  // knot
  C.push(paint(hull(cbox(V(0, 0.52, 0.41), 0.05, 0.045, 0.03, 0.015)), SW.silkDk, 'y', [0.47, 0.57]));
  // ribbon tails hanging down & out
  S.push(paint(hull([V(0.02, 0.52, 0.41), V(0.05, 0.53, 0.405), V(0.02, 0.5, 0.425), V(0.05, 0.505, 0.42),
    V(0.07, 0.36, 0.39), V(0.12, 0.35, 0.37), V(0.075, 0.36, 0.375), V(0.125, 0.35, 0.355), V(0.11, 0.33, 0.38)]), SW.silk, 'y', [0.33, 0.53]));
  S.push(paint(hull([V(0.03, 0.53, 0.41), V(0.04, 0.55, 0.4), V(0.03, 0.51, 0.43),
    V(0.12, 0.6, 0.36), V(0.13, 0.565, 0.36), V(0.12, 0.6, 0.34), V(0.13, 0.565, 0.34)]), SW.silkDk, 'y', [0.5, 0.6]));
  // jade disc pendant with a glowing core
  C.push(paint(hull([...ring(V(0, 0.455, 0.418), 0.045, 0.045, 8, 'z', 0), ...ring(V(0, 0.455, 0.442), 0.04, 0.04, 8, 'z', 0)]), SW.jade, 'y', [0.41, 0.5]));
  C.push(paint(hull([...ring(V(0, 0.455, 0.44), 0.02, 0.02, 4, 'z', 0), V(0, 0.455, 0.452)]), SW.glowJade, 'flat'));

  // cherry blossoms pinned to the scarf sides
  blossom(S, V(0.185, 0.565, 0.25), V(1, 0.2, 0.25), V(0, 1, 0), 0.05);

  // ================= HEAD =================
  C.push(rustP(hull([
    ...cbox(V(0, H.y - 0.01, H.z), H.hx, H.hy - 0.01, H.hz, 0.07),
    ...ring(V(0, H.y + 0.175, H.z - 0.01), 0.15, 0.12, 10, 'y'),
    ...ring(V(0, H.y + 0.02, H.z - 0.19), 0.15, 0.12, 10, 'z'),
    ...ring(V(0, H.y + 0.06, H.z - 0.15), 0.2, 0.15, 10, 'z'),
    V(0.245, H.y - 0.07, H.z + 0.04), V(-0.245, H.y - 0.07, H.z + 0.04),
    V(0.22, H.y - 0.12, H.z + 0.02), V(-0.22, H.y - 0.12, H.z + 0.02),
  ]), H.y - 0.2, H.y + 0.2));

  // cream cheek patches (wide, fluffy) with shards fanning out & down
  S.push(paint(hull([
    V(0.14, H.y - 0.025, FZ + 0.014), V(0.18, H.y - 0.025, FZ - 0.006), V(0.2, H.y - 0.08, FZ - 0.025),
    V(0.185, H.y - 0.155, FZ - 0.02), V(0.155, H.y - 0.172, FZ + 0.002), V(0.138, H.y - 0.15, FZ + 0.018),
    V(0.16, H.y - 0.05, FZ - 0.035), V(0.16, H.y - 0.14, FZ - 0.035),
  ]), SW.cream, 'y', [H.y - 0.18, H.y - 0.02]));
  // cheek ruff: layered cream shards hugging the jaw, fanning out & down
  for (const [b, d, w, l] of [
    [V(0.21, H.y - 0.065, H.z + 0.06), V(0.8, -0.55, -0.25), 0.03, 0.05],
    [V(0.215, H.y - 0.11, H.z + 0.08), V(0.75, -0.7, -0.05), 0.036, 0.065],
    [V(0.185, H.y - 0.15, H.z + 0.1), V(0.45, -1, 0.05), 0.034, 0.06],
    [V(0.2, H.y - 0.13, H.z + 0.02), V(0.7, -0.6, -0.5), 0.032, 0.055],
  ]) S.push(creamF(shard(b, d, w, l)));
  // rust "tear" stripes running from under the eye down to the jaw
  S.push(paint(hull([V(0.085, H.y - 0.005, FZ + 0.006), V(0.135, H.y - 0.005, FZ + 0.006), V(0.11, H.y - 0.17, FZ - 0.01),
    V(0.13, H.y - 0.17, FZ - 0.015), V(0.085, H.y - 0.005, FZ - 0.02), V(0.135, H.y - 0.005, FZ - 0.02)]), SW.tear, 'y', [H.y - 0.17, H.y]));

  // muzzle (cream), chin, nose, mouth
  C.push(paint(hull([...cbox(V(0, H.y - 0.085, FZ + 0.032), 0.1, 0.062, 0.07, 0.03),
    V(0.07, H.y - 0.015, FZ - 0.03), V(-0.07, H.y - 0.015, FZ - 0.03)]), SW.muzzle, 'y', [H.y - 0.15, H.y]));
  C.push(paint(hull(cbox(V(0, H.y - 0.145, FZ + 0.005), 0.08, 0.03, 0.065, 0.015)), SW.cream, 'flat'));
  C.push(paint(hull([...cbox(V(0, H.y - 0.04, FZ + 0.1), 0.046, 0.021, 0.02, 0.01),
    V(0, H.y - 0.078, FZ + 0.093), V(0.02, H.y - 0.068, FZ + 0.093), V(-0.02, H.y - 0.068, FZ + 0.093)]), SW.nose, 'y'));
  C.push(paint(hull(cbox(V(0, H.y - 0.098, FZ + 0.098), 0.006, 0.02, 0.006, 0.002)), SW.mouth, 'flat'));
  S.push(paint(hull([V(0, H.y - 0.118, FZ + 0.103), V(0, H.y - 0.106, FZ + 0.103), V(0.055, H.y - 0.128, FZ + 0.09),
    V(0.055, H.y - 0.118, FZ + 0.09), V(0, H.y - 0.118, FZ + 0.093), V(0.055, H.y - 0.124, FZ + 0.078)]), SW.mouth, 'flat'));

  // fierce eyes
  const E = V(0.092, H.y + 0.03, 0);
  S.push(paint(hull(plate([[-0.044, 0.004], [0.048, 0.034], [0.054, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.048, -0.016]],
    E, FZ - 0.01, FZ + 0.012)), SW.white, 'flat'));
  S.push(paint(hull(plate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]],
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.014, FZ + 0.021)), SW.white, 'flat'));
  // heavy brow (deep rust)
  S.push(paint(hull([
    V(0.03, E.y + 0.012, FZ + 0.03), V(0.032, E.y + 0.05, FZ + 0.02),
    V(0.16, E.y + 0.05, FZ - 0.01), V(0.16, E.y + 0.09, FZ - 0.025),
    V(0.03, E.y + 0.012, FZ - 0.03), V(0.032, E.y + 0.06, FZ - 0.04),
    V(0.16, E.y + 0.05, FZ - 0.06), V(0.16, E.y + 0.092, FZ - 0.07),
  ]), SW.brow, 'y'));
  // cream eyebrow spots above the brow
  S.push(paint(hull(plate([[-0.03, -0.008], [0.0, -0.014], [0.03, 0.0], [0.024, 0.018], [-0.01, 0.02], [-0.032, 0.008]],
    V(0.105, E.y + 0.105, 0), FZ - 0.03, FZ + 0.004, 0.0)), SW.cream, 'flat'));
  // glowing forehead rune (diamond) between the brows
  C.push(paint(hull(plate([[0, 0.04], [0.022, 0.0], [0, -0.03], [-0.022, 0.0]], V(0, E.y + 0.085, 0), FZ - 0.02, FZ + 0.006)),
    SW.glowMint, 'y', [E.y + 0.05, E.y + 0.13]));

  // glowing rune on the back of the head
  C.push(paint(hull(plate([[0, 0.05], [0.032, 0.0], [0, -0.04], [-0.032, 0.0]], V(0, H.y + 0.03, 0), H.z - 0.196, H.z - 0.18)),
    SW.glowMint, 'y', [H.y - 0.02, H.y + 0.08]));
  // pointy ears: rust prism, cream rim, dark inner
  const EZ = H.z - 0.04;
  const earTri = (s, dz0, dz1, dy = 0) => {
    const cx = 0.16, by = H.y + 0.1;
    const tri = [[0.07, by + dy * 0.5], [0.255, by + 0.02 + dy * 0.5], [0.205, H.y + 0.33 - dy]];
    const ctr = [(tri[0][0] + tri[1][0] + tri[2][0]) / 3, (tri[0][1] + tri[1][1] + tri[2][1]) / 3];
    const pts = [];
    for (const [x, y] of tri) for (const z of [dz0, dz1])
      pts.push(V(ctr[0] + (x - ctr[0]) * s, ctr[1] + (y - ctr[1]) * s, EZ + z - 0.12 * (x - cx)));
    return pts;
  };
  S.push(rustP(hull([...earTri(1, -0.035, 0.02)]), H.y + 0.1, H.y + 0.34));
  S.push(paint(hull(earTri(0.86, 0.016, 0.03)), SW.cream, 'flat'));
  S.push(paint(hull(earTri(0.56, 0.026, 0.037, 0.01)), SW.earIn, 'flat'));
  // cream fluff shard at the ear base
  S.push(creamF(shard(V(0.13, H.y + 0.12, EZ + 0.03), V(0.2, 1, 0.6), 0.03, 0.06)));
  // cherry blossom at each ear base
  blossom(S, V(0.245, H.y + 0.13, H.z + 0.02), V(0.6, 0.3, 0.75), V(0, 1, 0), 0.05);


  // ================= RINGED TAIL (big, fluffy, curling up) =================
  C.push(bandTail(tube(curveSamples(
    [V(0, 0.44, -0.4), V(0, 0.48, -0.53), V(0, 0.62, -0.64), V(0, 0.8, -0.66), V(0, 0.92, -0.58), V(0, 0.93, -0.47), V(0, 0.87, -0.43)],
    18, (t) => (0.085 + 0.045 * Math.sin(Math.PI * Math.min(1, 0.25 + t))) * (t > 0.88 ? 1 - (t - 0.88) * 3 : 1)),
  { seg: 8, axis: X, capStart: 0, capEnd: 0.03, twist: (i) => (i % 2) * Math.PI / 8, scale: (i) => (i % 2 ? 1.14 : 0.96) }),
  17));

  // ================= FLOATING DETAILS (glowing petals + jade orbs, mirrored) =================
  S.push(paint(petal(V(0.32, 0.8, 0.3), V(0.3, 1, 0.2), V(1, -0.1, 0.6), 0.1, 0.05, 0.011), SW.glowPink, 'flat'));
  S.push(paint(petal(V(0.31, 0.52, -0.02), V(0.5, 0.8, -0.4), V(1, 0.3, 0.4), 0.09, 0.045, 0.011), SW.glowPink, 'flat'));
  S.push(paint(petal(V(0.2, 0.86, -0.33), V(0.2, 1, -0.4), V(1, 0.1, -0.2), 0.09, 0.045, 0.011), SW.glowPink, 'flat'));
  S.push(paint(blob(1, V(0.31, 0.64, 0.14), V(0.034, 0.034, 0.034)), SW.glowJade, 'y'));

  // crouch: compress the legs a little so the body sits lower and sturdier (UVs already set)
  for (const g of [...C, ...S]) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      p.setY(i, y - 0.085 * clamp01((y - 0.08) / 0.22));
    }
    g.computeVertexNormals();
  }
  return assemble(C, S);
}

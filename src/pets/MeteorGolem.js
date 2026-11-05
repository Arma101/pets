// Meteor Golem (Secret, Round 9 – Galaxy Colosseum): dark purple meteor-rock golem with glowing orange
// crater cracks, starry/nebula speckles, nebula crystals and small orbiting meteor chunks.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// ---------- deterministic rng ----------
function rng(seed) {
  return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---------- big projected rock texture: bottom half of the atlas (cells 32..63) ----------
// region A (px 0..511) = front/back/top projection (|x|, y); region B (px 512..1023) = side projection (z, y)
const RX0 = 12, RW = 488, Y0 = 512 + 12;
const XMAX = 0.6, YMAX = 1.2, ZMIN = -0.6, ZSPAN = 1.2;
// region C (x 0..511, y 256..511) = top-facing faces, projected (|x|, z)
const REGIONS = [[0, 512, 512, 512], [512, 512, 512, 512], [0, 256, 512, 256]];
const ROCK_TOP = '#7A4FB8', ROCK_MID = '#4E2E86', ROCK_BOT = '#2C1850';

function crackPaths(seed) {
  const r = rng(seed), paths = [];
  for (const [rx, ry, rw, rh] of REGIONS) {
    for (let c = 0; c < Math.round(rw * rh / 13000); c++) {
      let x = rx + 30 + r() * (rw - 60), y = ry + 30 + r() * (rh - 60), a = r() * Math.PI * 2;
      const pts = [[x, y]];
      const n = 3 + Math.floor(r() * 4);
      for (let k = 0; k < n; k++) {
        a += (r() - 0.5) * 1.6; const l = 22 + r() * 30;
        x += Math.cos(a) * l; y += Math.sin(a) * l; pts.push([x, y]);
        if (r() < 0.3) { // branch
          const b = a + (r() < 0.5 ? 1 : -1) * (0.8 + r() * 0.6), bl = 16 + r() * 18;
          paths.push([[x, y], [x + Math.cos(b) * bl, y + Math.sin(b) * bl]]);
        }
      }
      paths.push(pts);
    }
  }
  return paths;
}
const CRACKS = crackPaths(9137);
function clipRegions(g, fn) {
  for (const rc of REGIONS) { g.save(); g.beginPath(); g.rect(...rc); g.clip(); fn(...rc); g.restore(); }
}
function drawCracks(g) {
  clipRegions(g, () => {
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const [w, col] of [[15, '#FF5A0A'], [9, '#FF9A2E'], [4, '#FFE7A0']]) {
      g.strokeStyle = col; g.lineWidth = w;
      for (const p of CRACKS) { g.beginPath(); g.moveTo(...p[0]); for (const q of p.slice(1)) g.lineTo(...q); g.stroke(); }
    }
    // stars: tiny glowing dots and 4-point sparkles
    const r = rng(4242);
    for (let k = 0; k < 220; k++) {
      const x = r() * 1024, y = 256 + r() * 768, s = r(); if (y < 512 && x > 512) continue;
      g.fillStyle = s < 0.6 ? '#FFFFFF' : (s < 0.8 ? '#BFF3FF' : '#FFD6FB');
      if (s < 0.82) { g.beginPath(); g.arc(x, y, 1.6 + r() * 1.6, 0, 7); g.fill(); }
      else { const L = 6 + r() * 6, w = 1.6; g.beginPath();
        g.moveTo(x, y - L); g.lineTo(x + w, y - w); g.lineTo(x + L, y); g.lineTo(x + w, y + w);
        g.lineTo(x, y + L); g.lineTo(x - w, y + w); g.lineTo(x - L, y); g.lineTo(x - w, y - w); g.fill(); }
    }
  });
}
function drawRock(g) {
  clipRegions(g, (x0, y0, w, h) => {
    if (y0 === 512) {
      const grad = g.createLinearGradient(0, Y0, 0, Y0 + RW);
      grad.addColorStop(0, ROCK_TOP); grad.addColorStop(0.45, ROCK_MID); grad.addColorStop(1, ROCK_BOT);
      g.fillStyle = grad;
    } else g.fillStyle = '#6E46AA';
    g.fillRect(x0, y0, w, h);
    // nebula blotches (magenta / blue haze)
    const r = rng(77 + x0 + y0);
    for (let k = 0; k < Math.round(w * h / 29000); k++) {
      const x = x0 + r() * w, y = y0 + r() * h, rad = 40 + r() * 70;
      const col = r() < 0.5 ? '255,90,220' : '80,140,255';
      const rg = g.createRadialGradient(x, y, 0, x, y, rad);
      rg.addColorStop(0, `rgba(${col},0.32)`); rg.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = rg; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    // darker speckle facets for rocky texture
    for (let k = 0; k < 60; k++) {
      g.fillStyle = 'rgba(20,8,40,0.18)';
      const x = x0 + r() * w, y = y0 + r() * h, s = 6 + r() * 14;
      g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s, y); g.lineTo(x, y + s * 0.7); g.lineTo(x - s * 0.8, y); g.fill();
    }
    // orange under-glow halo around cracks
    g.save(); g.globalAlpha = 0.35; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#FF6A1A'; g.lineWidth = 30;
    g.filter = 'blur(6px)';
    for (const p of CRACKS) { g.beginPath(); g.moveTo(...p[0]); for (const q of p.slice(1)) g.lineTo(...q); g.stroke(); }
    g.restore();
  });
}

export const PALETTE = {
  rock:    { i: 32, draw: (g) => drawRock(g) },                 // must come before `crack`
  crack:   { i: 33, glow: true, draw: (g) => drawCracks(g) },   // overlays cracks+stars (and is the only emissive there)
  stone:   { i: 0, top: '#5E3994', bot: '#2E1A52' },
  brow:    { i: 1, top: '#4A2B7A', bot: '#2A1648' },
  lava:    { i: 2, top: '#FFB347', bot: '#FF6A00', glow: true },
  core:    { i: 3, top: '#FFF2B8', bot: '#FF9A2E', glow: true },
  eye:     { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white:   { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  nebula:  { i: 6, top: '#FF8CEB', bot: '#A63DFF', glow: true },
  nebula2: { i: 7, top: '#8CEBFF', bot: '#3D7BFF', glow: true },
  star:    { i: 8, top: '#FFF6B0', bot: '#FFC93D', glow: true },
  face:    { i: 10, top: '#8457C4', bot: '#4A2B80' },
  rim:     { i: 9, top: '#6E45AA', bot: '#3A2166' },
};
const SW = PALETTE;

// ---------- projected UVs for the rock parts ----------
function rockUV(g, center = false, du = 0, plainFront = null) {
  const p = g.attributes.position, uv = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  const cl = (v) => Math.min(1, Math.max(0, v));
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    n.subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const side = Math.abs(n.x) > Math.abs(n.z) && Math.abs(n.x) > Math.abs(n.y) * 0.8;
    const span = center && Math.min(a.x, b.x, c.x) < -1e-4 && Math.max(a.x, b.x, c.x) > 1e-4;
    if (plainFront && n.z > 0.45) { // plain gradient facets (keeps the face clean)
      const [lo, hi] = plainFront.range, sw = plainFront.sw, cx = (sw.i % 8) * 128, cy = Math.floor(sw.i / 8) * 128;
      for (const v of [a, b, c]) uv.push((cx + 64) / 1024, (cy + 16 + cl(1 - (v.y - lo) / (hi - lo)) * 96) / 1024);
      continue;
    }
    for (const v of [a, b, c]) {
      const x = center ? (span ? v.x + 0.12 : Math.abs(v.x)) : v.x;
      let u, t;
      if (side) { u = 512 + RX0 + cl((v.z - ZMIN) / ZSPAN) * RW; t = v.y; }
      else if (Math.abs(n.y) > Math.abs(n.z)) { u = RX0 + cl(x / XMAX) * RW; uv.push(u / 1024, (256 + 6 + cl((v.z - ZMIN) / ZSPAN) * 244) / 1024); continue; }
      else if (n.z >= 0) { u = RX0 + cl(x / XMAX) * RW; t = v.y; }
      else { u = RX0 + cl((XMAX - x + du) / XMAX) * RW; t = v.y; }
      const vv = Y0 + cl(1 - t / YMAX) * RW;
      uv.push(u / 1024, vv / 1024);
    }
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}

// ---------- surface helpers ----------
const _mesh = new THREE.Mesh();
function surf(geo, from, dir) {
  _mesh.geometry = geo; geo.computeBoundingSphere();
  const h = new THREE.Raycaster(from, dir.clone().normalize()).intersectObject(_mesh)[0];
  if (!h) throw new Error('surf miss ' + from.toArray());
  return { p: h.point.clone(), n: h.face.normal.clone() };
}
function frame(n) {
  const up = Math.abs(n.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
  const a = new THREE.Vector3().crossVectors(up, n).normalize();
  const b = new THREE.Vector3().crossVectors(n, a).normalize();
  return [a, b];
}
// glowing crater: rim of rock wedges around a glowing lava disc, sitting on the surface
function crater(out, s, r, seed = 0) {
  const { p, n } = s; const [a, b] = frame(n);
  const P = (u, v, h) => p.clone().addScaledVector(a, u).addScaledVector(b, v).addScaledVector(n, h);
  const K = 7, O = Math.PI / 2, sk = (k) => Math.min(((k % K) + K) % K, (K - (k % K)) % K), J = (k) => 0.85 + 0.3 * hashK(sk(k) + seed * 3);
  const disc = hull([...Array.from({ length: K }, (_, k) => {
    const t = O + (k / K) * Math.PI * 2, j = J(k); return [P(Math.cos(t) * r * 0.8 * j, Math.sin(t) * r * 0.8 * j, -0.02), P(Math.cos(t) * r * 0.72 * j, Math.sin(t) * r * 0.72 * j, -0.002)];
  }).flat(), P(0, 0, 0.004)]);
  out.push(paint(disc, SW.lava, 'flat'));
  out.push(paint(hull([P(-r * 0.3, -r * 0.25, -0.01), P(r * 0.3, -r * 0.2, -0.01), P(0, r * 0.32, -0.01), P(0, 0, 0.009)]), SW.core, 'flat'));
  for (let k = 0; k < K; k++) {
    const t0 = O + (k / K) * Math.PI * 2 - 0.04, t1 = O + ((k + 1) / K) * Math.PI * 2 + 0.04, j = Math.min(J(k), J((k + 1) % K));
    const ri = r * 0.7 * j, ro = r * 1.15 * j, hh = 0.014 + 0.016 * hashK(Math.min(k, K - 1 - k) * 7 + seed);
    out.push(paint(hull([
      P(Math.cos(t0) * ri, Math.sin(t0) * ri, -0.015), P(Math.cos(t1) * ri, Math.sin(t1) * ri, -0.015),
      P(Math.cos(t0) * ro, Math.sin(t0) * ro, -0.02), P(Math.cos(t1) * ro, Math.sin(t1) * ro, -0.02),
      P(Math.cos(t0) * ri, Math.sin(t0) * ri, hh), P(Math.cos(t1) * ri, Math.sin(t1) * ri, hh),
      P(Math.cos(t0) * (ro - 0.008), Math.sin(t0) * (ro - 0.008), hh * 0.35), P(Math.cos(t1) * (ro - 0.008), Math.sin(t1) * (ro - 0.008), hh * 0.35),
    ]), SW.rim, 'y'));
  }
}
const hashK = (k) => { const s = Math.sin(k * 91.7 + 13.1) * 43758.5; return s - Math.floor(s); };
// irregular rocky ring (symmetric if centred on x = 0 and n even)
function rr(c0, rA, rB, n, axis, jit, seed) {
  const pts = ring(c0, rA, rB, n, axis);
  const ph = Math.PI / 8;
  return pts.map((q, k) => { const a = ph + (2 * Math.PI * k) / n;
    const f = 1 + jit * 0.5 * Math.sin(seed * 12.9 + 7.3 * Math.round(Math.abs(Math.cos(a)) * 100) / 100 + 3.1 * Math.sin(a));
    return c0.clone().add(q.clone().sub(c0).multiplyScalar(f)); });
}

export function buildGeometry() {
  const C = [], S = [];
  const rockC = (pts) => rockUV(hull(pts), true);
  const rockS = (pts) => rockUV(hull(pts), false);
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= LEGS + FEET =================
  const LX = 0.15;
  const legPts = [...ring(V(LX, 0.09, 0.0), 0.085, 0.085, 7, 'y'), ...ring(V(LX + 0.005, 0.2, -0.005), 0.1, 0.095, 7, 'y'),
    ...ring(V(LX - 0.005, 0.34, -0.01), 0.115, 0.105, 7, 'y')];
  const leg = rockS(legPts); S.push(leg);
  // knee plate
  S.push(rockS([...rr(V(LX, 0.21, 0.07), 0.07, 0.06, 6, 'z', 0.3, 9), V(LX + 0.01, 0.2, 0.115), V(LX - 0.02, 0.23, 0.11)]));
  // foot: broad boulder block + 3 chunky rock toes
  S.push(rockS([...cbox(V(LX + 0.005, 0.05, 0.02), 0.11, 0.05, 0.125, 0.03), V(LX, 0.11, -0.04)]));
  for (const [dx, w] of [[-0.065, 0.034], [0, 0.04], [0.068, 0.034]])
    S.push(paint(hull([...cbox(V(LX + dx, 0.035, 0.155), w, 0.035, 0.035, 0.014), V(LX + dx, 0.0, 0.2), V(LX + dx, 0.02, 0.198)]), SW.stone, 'y', [0, 0.1]));

  // ================= PELVIS + TORSO (wide boulder chest) =================
  C.push(rockC([...rr(V(0, 0.33, -0.02), 0.19, 0.13, 8, 'y', 0.15, 21), ...rr(V(0, 0.41, -0.02), 0.21, 0.14, 8, 'y', 0.15, 22)]));
  const torso = rockC([
    ...rr(V(0, 0.36, -0.01), 0.17, 0.13, 8, 'y', 0.1, 1),
    ...rr(V(0, 0.48, 0.0), 0.25, 0.17, 8, 'y', 0.12, 2),
    ...rr(V(0, 0.62, -0.01), 0.3, 0.19, 8, 'y', 0.1, 3),
    ...rr(V(0, 0.73, -0.03), 0.22, 0.15, 8, 'y', 0.1, 4),
  ]);
  C.push(torso);
  // chest plates: two slabs forming pecs
  S.push(rockS([V(0.03, 0.67, 0.14), V(0.2, 0.68, 0.11), V(0.23, 0.56, 0.1), V(0.06, 0.51, 0.15),
    V(0.04, 0.65, 0.185), V(0.18, 0.66, 0.16), V(0.2, 0.57, 0.15), V(0.07, 0.53, 0.18), V(0.12, 0.6, 0.2)]));
  // abdomen: stacked rock plates
  C.push(rockC([...rr(V(0, 0.445, 0.1), 0.13, 0.06, 8, 'z', 0.2, 3), ...rr(V(0, 0.445, 0.155), 0.11, 0.05, 8, 'z', 0.2, 4)]));
  // back boulder hump
  const hump = rockC([...rr(V(0, 0.63, -0.12), 0.21, 0.13, 8, 'z', 0.15, 6), ...rr(V(0, 0.61, -0.23), 0.14, 0.09, 8, 'z', 0.2, 8)]);
  C.push(hump);
  // glowing meteor core in the chest centre: rock frame + glowing gem
  C.push(paint(hull([...ring(V(0, 0.585, 0.2), 0.062, 0.062, 6, 'z', Math.PI / 2), ...ring(V(0, 0.585, 0.23), 0.058, 0.058, 6, 'z', Math.PI / 2)]), SW.rim, 'flat'));
  C.push(paint(hull([...ring(V(0, 0.585, 0.225), 0.042, 0.042, 6, 'z', Math.PI / 2), V(0, 0.585, 0.262)]), SW.core, 'y', [0.55, 0.63]));

  // ================= HEAD (big boulder, set forward and low between the shoulders) =================
  const H = { y: 0.8, z: 0.09 };
  const FZ = H.z + 0.145;
  const hp = [];
  for (const sx of [1, -1]) hp.push(
    V(sx * 0.15, H.y + 0.09, FZ), V(sx * 0.165, H.y - 0.06, FZ), V(sx * 0.1, H.y - 0.11, FZ),       // flat face
    V(sx * 0.11, H.y + 0.15, FZ - 0.045), V(sx * 0.195, H.y + 0.02, FZ - 0.06),                      // front bevels
    V(sx * 0.2, H.y - 0.05, H.z + 0.02), V(sx * 0.15, H.y - 0.13, H.z + 0.05),                        // cheeks / jaw corner
    V(sx * 0.1, H.y + 0.18, H.z + 0.0), V(sx * 0.15, H.y + 0.15, H.z - 0.09),                         // cranium
    V(sx * 0.18, H.y + 0.02, H.z - 0.12), V(sx * 0.13, H.y - 0.1, H.z - 0.12), V(sx * 0.07, H.y + 0.12, H.z - 0.16));
  hp.push(V(0, H.y + 0.2, H.z - 0.04), V(0, H.y - 0.02, H.z - 0.17));
  const head = rockUV(hull(hp), true, -0.17, { sw: SW.face, range: [H.y - 0.14, H.y + 0.2] });
  C.push(head);
  // rocky lumps on the cranium
  S.push(rockS([...rr(V(0.12, H.y + 0.15, H.z - 0.05), 0.06, 0.05, 6, 'y', 0.3, 7), V(0.13, H.y + 0.21, H.z - 0.06), V(0.08, H.y + 0.12, H.z - 0.04)]));
  // jaw: heavy squared chin
  C.push(rockC([...cbox(V(0, H.y - 0.12, H.z + 0.07), 0.13, 0.045, 0.09, 0.03)]));
  // glowing mouth slit (stern, straight)
  C.push(flat(hull(plate([[-0.06, 0.006], [0.06, 0.006], [0.05, -0.008], [-0.05, -0.008]], V(0, H.y - 0.105, 0), FZ + 0.0, FZ + 0.021)), SW.lava));

  // fierce eyes (punch_pup pattern, scaled up)
  const E = V(0.075, H.y + 0.02, 0), es = 1.15;
  const sc = (pts) => pts.map(([u, v]) => [u * es, v * es]);
  S.push(paint(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.01, FZ + 0.012)), SW.white, 'flat'));
  S.push(paint(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.006, E.y + 0.003, 0), FZ + 0.014, FZ + 0.022)), SW.white, 'flat'));
  // heavy rock brow slanting down to the centre
  S.push(paint(hull([
    V(0.0, E.y + 0.018, FZ + 0.04), V(0.0, E.y + 0.06, FZ + 0.03),
    V(0.17, E.y + 0.06, FZ - 0.005), V(0.17, E.y + 0.105, FZ - 0.02),
    V(0.0, E.y + 0.018, FZ - 0.03), V(0.0, E.y + 0.07, FZ - 0.04),
    V(0.17, E.y + 0.06, FZ - 0.06), V(0.17, E.y + 0.105, FZ - 0.07),
  ]), SW.brow, 'y', [E.y + 0.01, E.y + 0.1]));

  // nebula crystal crown on the head: centre spike + mirrored pair, on a rock base
  C.push(flat(shard(V(0, H.y + 0.15, H.z - 0.03), V(0, 1, -0.15), 0.035, 0.12), SW.nebula));
  S.push(flat(shard(V(0.06, H.y + 0.14, H.z - 0.05), V(0.45, 1, -0.2), 0.028, 0.085), SW.nebula));
  S.push(flat(shard(V(0.11, H.y + 0.12, H.z - 0.06), V(0.9, 0.8, -0.2), 0.022, 0.06), SW.nebula2));

  // ================= SHOULDERS + ARMS + HUGE FISTS =================
  // boulder pauldrons
  const paul = rockS([...rr(V(0.3, 0.66, -0.02), 0.13, 0.12, 8, 'y', 0.12, 5), V(0.3, 0.79, -0.03), V(0.33, 0.57, -0.02), V(0.42, 0.68, -0.02)]);
  S.push(paul);
  // upper arm
  S.push(rockS([...ring(V(0.36, 0.6, -0.01), 0.085, 0.085, 7, 'y'), ...ring(V(0.385, 0.44, 0.02), 0.08, 0.08, 7, 'y')]));
  // forearm widening to the fist
  S.push(rockS([...rr(V(0.385, 0.48, 0.02), 0.085, 0.082, 7, 'y', 0.25, 11), ...rr(V(0.395, 0.38, 0.03), 0.1, 0.095, 7, 'y', 0.3, 12), V(0.37, 0.36, 0.1)]));
  S.push(rockS([...rr(V(0.425, 0.36, 0.055), 0.1, 0.1, 6, 'y', 0.35, 14), ...rr(V(0.415, 0.27, 0.06), 0.118, 0.112, 6, 'y', 0.3, 15), V(0.47, 0.32, 0.12), V(0.5, 0.31, 0.02)]));
  // fist: big chamfered block + knuckle row + thumb
  const FX = 0.415, FY = 0.2, FZf = 0.065;
  const fist = rockS([...cbox(V(FX, FY, FZf), 0.12, 0.1, 0.115, 0.04)]);
  S.push(fist);
  for (const [dx, dy] of [[-0.075, 0], [-0.025, 0.004], [0.025, 0.004], [0.075, 0]])
    S.push(paint(hull(cbox(V(FX + dx, FY + 0.035 + dy, FZf + 0.115), 0.026, 0.03, 0.02, 0.01)), SW.stone, 'y', [FY, FY + 0.08]));
  S.push(paint(hull(cbox(V(FX - 0.1, FY - 0.03, FZf + 0.07), 0.04, 0.035, 0.05, 0.015)), SW.stone, 'y', [FY - 0.08, FY + 0.03]));
  // nebula crystals on the shoulders and back
  S.push(flat(shard(V(0.3, 0.77, -0.05), V(0.2, 1, -0.3), 0.04, 0.13), SW.nebula));
  S.push(flat(shard(V(0.36, 0.73, -0.08), V(0.8, 0.8, -0.4), 0.03, 0.09), SW.nebula2));
  S.push(flat(shard(V(0.22, 0.75, -0.1), V(0.1, 1, -0.6), 0.03, 0.09), SW.nebula));
  S.push(flat(shard(V(0.1, 0.68, -0.16), V(0.3, 0.6, -1), 0.035, 0.1), SW.nebula));
  C.push(flat(shard(V(0, 0.58, -0.19), V(0, 0.4, -1), 0.04, 0.12), SW.nebula2));
  S.push(flat(shard(V(0.12, 0.5, -0.16), V(0.4, 0.2, -1), 0.03, 0.08), SW.nebula2));

  // ================= GLOWING CRATERS (raycast onto the rock) =================
  crater(S, surf(torso, V(0.2, 0.47, 1), V(0, 0, -1)), 0.05, 1);
  crater(S, surf(torso, V(1, 0.5, -0.05), V(-1, 0, 0)), 0.055, 0);
  crater(C, surf(torso, V(0, 0.44, -1), V(0, 0, 1)), 0.06, 0);
  crater(S, surf(hump, V(0.1, 0.66, -1), V(0, 0, 1)), 0.05, 1);
  crater(S, surf(paul, V(0.3, 2, 0.02), V(0, -1, 0)), 0.05, 0);
  crater(S, surf(fist, V(1, FY + 0.01, FZf - 0.02), V(-1, 0, 0)), 0.05, 1);
  crater(S, surf(head, V(1, H.y + 0.03, H.z - 0.04), V(-1, 0, 0)), 0.042, 1);
  crater(S, surf(leg, V(1, 0.25, -0.01), V(-1, 0, 0)), 0.04, 0);

  // ================= FLOATING DETAILS: a deliberate trio of mini meteors with ember faces + tails =================
  // chunky faceted meteor: hull of two jittered rings + caps
  const meteorGeo = (c, s, center) => {
    const pts = [...rr(V(c.x, c.y + s * 0.35, c.z), s * 0.8, s * 0.75, 6, 'y', 0.35, 31), ...rr(V(c.x, c.y - s * 0.35, c.z), s * 0.85, s * 0.8, 6, 'y', 0.35, 32),
      V(c.x, c.y + s, c.z - s * 0.1), V(c.x, c.y - s * 0.95, c.z + s * 0.1)];
    return rockUV(hull(pts), center);
  };
  const meteor = (out, c, s, face, tailDir, center) => {
    const g = meteorGeo(c, s, center); out.push(g);
    crater(out, surf(g, c.clone().addScaledVector(face, 1), face.clone().negate()), s * 0.62, 1);
    const td = tailDir.clone().normalize();
    out.push(paint(shard(c.clone().addScaledVector(td, s * 0.55), td, s * 0.5, s * 2.1, 4), SW.lava, 'y'));
    out.push(paint(shard(c.clone().addScaledVector(td, s * 0.55).add(V(center ? 0 : 0.02, s * 0.35, 0)), td.clone().add(V(0, 0.25, 0)), s * 0.28, s * 1.3, 4), SW.core, 'flat'));
  };
  meteor(C, V(0, 1.11, -0.03), 0.06, V(0, 0.35, 1).normalize(), V(0, -0.35, -1), true);
  meteor(S, V(0.46, 0.9, -0.02), 0.055, V(0.45, 0.3, 1).normalize(), V(0.25, -0.45, -1), false);

  return assemble(C, S);
}

// Jaguar Jabber (Rare, Round 2 - Jungle Gym): chunky faceted golden jaguar with dark rosettes,
// carved-jade spine spikes, jade collar + shoulder guards and a leafy jungle vine.
// Rosettes are painted into the atlas and mapped by world position with a per-facet planar projection
// (same technique as thunder_tiger: no overlay geometry => no z-fighting).
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble, hash3 } from '../kit.js';

// ---------------- colours ----------------
const GD_TOP = [255, 200, 74], GD_BOT = [226, 138, 30];     // golden coat
const CN_TOP = [226, 142, 38], CN_BOT = [196, 108, 24];     // darker-gold rosette centre
const DK_TOP = [56, 38, 32], DK_BOT = [32, 22, 20];         // rosette ring
const CR_TOP = [255, 242, 208], CR_BOT = [238, 208, 152];   // cream belly
const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const lerp3 = (a, b, t) => [0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * clamp01(t));
const gold = (t) => lerp3(GD_TOP, GD_BOT, t);
const cen = (t) => lerp3(CN_TOP, CN_BOT, t);
const dark = (t) => lerp3(DK_TOP, DK_BOT, t);
const creamC = (t) => lerp3(CR_TOP, CR_BOT, t);

// ---------------- layout ----------------
const H = { y: 0.7, z: 0.37, hx: 0.235, hy: 0.15, hz: 0.15 };
const SPINE = 0.585;

// ---------------- spot patterns ----------------
// jittered hex grid of spots [a, b, r, phase]
function spotGrid(a0, a1, b0, b1, step, r, seed, keep = () => true) {
  const out = [];
  let row = 0;
  for (let b = b0; b <= b1; b += step * 0.87, row++) {
    for (let a = a0 + (row % 2) * step * 0.5; a <= a1; a += step) {
      const ja = (hash3(a * 3.1 + seed, b * 1.7, seed) - 0.5) * step * 0.35;
      const jb = (hash3(b * 2.3, a * 4.1 + seed, seed + 1) - 0.5) * step * 0.3;
      const rr = r * (0.82 + 0.36 * hash3(a + seed, b, 7));
      const s = [a + ja, b + jb, rr, hash3(a, b + seed, 3)];
      if (keep(s[0], s[1])) out.push(s);
    }
  }
  return out;
}
// returns 0 = coat, 1 = rosette centre, 2 = dark
function rosetteAt(spots, a, b, solid = false) {
  for (const [sa, sb, r, ph] of spots) {
    const da = a - sa, db = b - sb, d = Math.hypot(da, db);
    if (d > r) continue;
    if (solid) return 2;
    const ang = Math.atan2(db, da) / (2 * Math.PI) + ph;
    // irregular inner edge: ring made of 4 chunky blotches of varying thickness
    const f = ang * 4 - Math.floor(ang * 4), seg = Math.floor(ang * 4 + 8) % 4;
    const inner = r * (0.5 + 0.12 * Math.sin(f * Math.PI) * (seg % 2 ? 1 : -0.6));
    if (d < inner) return 1;
    if (f < 0.1 || f > 0.96) return 1; // narrow gaps -> broken jaguar rosette ring
    return 2;
  }
  return 0;
}
const BODY_SPOTS = spotGrid(-0.52, 0.4, 0.2, 0.62, 0.135, 0.05, 1.3, (a, b) => b > 0.3 && b < 0.585);
const TOP_SPOTS = spotGrid(-0.5, 0.36, -0.3, 0.3, 0.135, 0.046, 2.1, (a, b) => Math.abs(b) > 0.045);
const HEAD_DOTS = spotGrid(-0.28, 0.28, -0.24, 0.26, 0.062, 0.014, 4.2);
const LEG_SPOTS = spotGrid(-0.16, 0.16, 0.08, 0.6, 0.085, 0.032, 5.5, (a, b) => b > 0.12);
const LEG_DOTS = spotGrid(-0.16, 0.16, 0.08, 0.6, 0.05, 0.013, 6.1);
const TAIL_SPOTS = spotGrid(-0.2, 0.2, 0.0, 0.45, 0.1, 0.038, 7.7);

function coatCol(kind, t) { return kind === 2 ? dark(t) : kind === 1 ? cen(t) : gold(t); }

// head: mostly small solid dots, kept off the eye / muzzle area
function headFrontK(lx, ly) {
  const ax = Math.abs(lx);
  if (ly > 0.13 && ax < 0.16) return rosetteAt(HEAD_DOTS, lx, ly, true);
  if (ax > 0.19 && ly > -0.05 && ly < 0.06) return rosetteAt(HEAD_DOTS, lx, ly, true);
  return 0;
}
function headSideK(lz, ly) {
  if (lz < 0.02 && ly > -0.06) return rosetteAt(HEAD_DOTS, lz, ly, true);
  return 0;
}
function headTopK(lx, lz) {
  if (lz > -0.2 && Math.abs(lx) > 0.02) return rosetteAt(HEAD_DOTS, Math.abs(lx), lz, true);
  return 0;
}

// ---------------- atlas regions ----------------
const REG = {
  bodySide: { x: 0, y: 256, w: 512, h: 256, a: [-0.55, 0.4], b: [0.66, 0.14],
    col: (z, y) => {
      const t = (0.62 - y) / 0.44;
      if (y < 0.27) return lerp3(gold(t), creamC(0.3), clamp01((0.3 - y) / 0.06));
      return coatCol(rosetteAt(BODY_SPOTS, z, y), t);
    } },
  bodyTop: { x: 512, y: 256, w: 512, h: 256, a: [-0.55, 0.4], b: [-0.3, 0.3],
    col: (z, x) => coatCol(rosetteAt(TOP_SPOTS, z, Math.abs(x)), 0.04) },
  headFront: { x: 0, y: 512, w: 256, h: 256, a: [-0.28, 0.28], b: [0.26, -0.24],
    col: (x, ly) => coatCol(headFrontK(x, ly), (0.2 - ly) / 0.42 * 0.8) },
  headSide: { x: 256, y: 512, w: 256, h: 256, a: [-0.24, 0.24], b: [0.26, -0.24],
    col: (lz, ly) => coatCol(headSideK(lz, ly), (0.2 - ly) / 0.42 * 0.8) },
  headTop: { x: 512, y: 512, w: 256, h: 256, a: [-0.28, 0.28], b: [-0.24, 0.24],
    col: (x, lz) => coatCol(headTopK(x, lz), 0) },
  leg: { x: 768, y: 512, w: 256, h: 256, a: [-0.16, 0.16], b: [0.62, 0.0],
    col: (u, y) => {
      const t = (0.5 - y) / 0.5;
      const k = y > 0.24 ? rosetteAt(LEG_SPOTS, u, y) : rosetteAt(LEG_DOTS, u, y, true);
      return coatCol(k, t);
    } },
};
function drawRegions(g) {
  for (const r of Object.values(REG)) {
    const img = g.createImageData(r.w, r.h);
    for (let py = 0; py < r.h; py++) for (let px = 0; px < r.w; px++) {
      const acc = [0, 0, 0];
      for (const [ox, oy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
        const a = r.a[0] + ((px + ox) / r.w) * (r.a[1] - r.a[0]);
        const b = r.b[0] + ((py + oy) / r.h) * (r.b[1] - r.b[0]);
        const c = r.col(a, b);
        for (let k = 0; k < 3; k++) acc[k] += c[k] / 4;
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

// tail cell: u = angle around tube (folded 0..1), v = length t. World-ish scale: u*0.2, t*0.62.
const TAIL_CELL = { i: 48 }; // 128px cell in row 6 (rows 2..5 hold the REG rects)
function tailCol(u, t) {
  const tt = 0.1 + 0.3 * t;
  if (t > 0.86) return dark(0.25);
  if (t > 0.5) { // broken rings toward the tip
    for (const c of [0.56, 0.665, 0.765]) {
      if (Math.abs(t - c) < 0.026 && !(u > 0.42 && u < 0.52)) return dark(0.3);
    }
    return gold(tt);
  }
  return coatCol(rosetteAt(TAIL_SPOTS, u * 0.2, t * 0.62), tt);
}
function drawTail(g, x, y) {
  for (let py = 0; py < 128; py++) for (let px = 0; px < 128; px++) {
    const c = tailCol(clamp01((px - 4) / 120), clamp01((py - 4) / 120));
    g.fillStyle = hex(c); g.fillRect(x + px, y + py, 1, 1);
  }
}

export const PALETTE = {
  gold: { i: 0, top: hex(GD_TOP), bot: hex(GD_BOT) },
  cream: { i: 1, top: hex(CR_TOP), bot: hex(CR_BOT) },
  muzzle: { i: 2, top: '#FFF4DC', bot: '#EBCB98' },
  nose: { i: 3, top: '#8A4A44', bot: '#4A2422' },
  eye: { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white: { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  mouth: { i: 6, top: '#4A2A22', bot: '#2E1A14' },
  earIn: { i: 7, top: '#FFE9C8', bot: '#EBC48E' },
  dark: { i: 8, top: hex(DK_TOP), bot: hex(DK_BOT) },
  brow: { i: 9, top: '#F0A436', bot: '#B8661A' },
  paw: { i: 10, top: '#FFF0D2', bot: '#DDB57C' },
  jade: { i: 11, top: '#8DF2C2', bot: '#17905F' },
  jadeDk: { i: 12, top: '#3FC98E', bot: '#0F6B47' },
  vine: { i: 13, top: '#5C9A34', bot: '#2F5E1E' },
  leaf: { i: 14, top: '#8FDB4A', bot: '#3E9A2A' },
  goldTrim: { i: 15, top: '#FFE27A', bot: '#D99A1E' },
  coat: { i: 16, draw: drawRegions }, // paints every REG rect (rows 2..5 of the atlas)
  tail: { i: TAIL_CELL.i, draw: drawTail },
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
const bodyPaint = (g) => project(g, (n) =>
  n.y > 0.6 ? [REG.bodyTop, (v) => [v.z, v.x]]
    : Math.abs(n.z) > 0.7 ? [REG.bodySide, (v) => [-0.05 + Math.abs(v.x) * 0.9, v.y]]
      : [REG.bodySide, (v) => [v.z, v.y]]);
const headPaint = (g) => project(g, (n) => {
  const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
  if (n.y > 0 && ay >= ax && ay >= az * 0.8) return [REG.headTop, (v) => [v.x, v.z - H.z]];
  if (az >= ax && n.z < 0) return [REG.headTop, (v) => [v.x, (v.y - H.y) * 0.9 - 0.02]];
  if (az >= ax) return [REG.headFront, (v) => [v.x, v.y - H.y]];
  return [REG.headSide, (v) => [v.z - H.z, v.y - H.y]];
});
const legPaint = (g, cx, cz) => project(g, (n) =>
  n.y > 0.6 ? [REG.bodyTop, (v) => [v.z, v.x]]
    : Math.abs(n.z) > Math.abs(n.x) ? [REG.leg, (v) => [v.x - cx, v.y]] : [REG.leg, (v) => [v.z - cz, v.y]]);

// tail: custom UV (angle around the tube folded to 0..1, t along length)
function tailPaint(g, samples) {
  const p = g.attributes.position, tArr = g.userData.t, n = samples.length, uv = [];
  const X = V(1, 0, 0);
  for (let i = 0; i < p.count; i++) {
    const t = tArr[i];
    const f = t * (n - 1), i0 = Math.min(n - 2, Math.floor(f)), w = f - i0;
    const c = samples[i0].p.clone().lerp(samples[i0 + 1].p, w);
    const T = samples[i0 + 1].p.clone().sub(samples[i0].p).normalize();
    const N = new THREE.Vector3().crossVectors(X, T).normalize(); // in yz plane, "outer" side
    const o = V(p.getX(i), p.getY(i), p.getZ(i)).sub(c);
    const u = Math.abs(Math.atan2(o.dot(X), o.dot(N))) / Math.PI;
    const x = (TAIL_CELL.i % 8) * 128, y = Math.floor(TAIL_CELL.i / 8) * 128;
    uv.push((x + 4 + u * 120) / 1024, (y + 4 + clamp01(t) * 120) / 1024);
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}

// carved jade spike: blade thin in x, long in z, leaning back
function jadeSpike(base, len, lean = 0.4, wz = 0.03, wx = 0.016) {
  return paint(hull([
    V(base.x, base.y + len, base.z - lean * len),
    V(base.x, base.y + len * 0.35, base.z + wz * 0.9),
    V(base.x, base.y - 0.02, base.z + wz), V(base.x, base.y - 0.02, base.z - wz * 1.2),
    V(base.x + wx, base.y + 0.005, base.z), V(base.x - wx, base.y + 0.005, base.z),
    V(base.x + wx * 0.5, base.y - 0.02, base.z), V(base.x - wx * 0.5, base.y - 0.02, base.z),
  ]), SW.jade, 'y', [base.y - 0.02, base.y + len]);
}
// leaf: flat diamond with a slight fold
function leaf(base, dir, nrm, len, w) {
  const d = dir.clone().normalize(), nn = nrm.clone().normalize();
  const side = new THREE.Vector3().crossVectors(d, nn).normalize();
  const mid = base.clone().addScaledVector(d, len * 0.45);
  return paint(hull([
    base.clone(), base.clone().addScaledVector(d, len),
    mid.clone().addScaledVector(side, w), mid.clone().addScaledVector(side, -w),
    mid.clone().addScaledVector(nn, 0.012), mid.clone().addScaledVector(nn, -0.004),
  ]), SW.leaf, 'flat');
}

// radius of a ring(...) polygon (n sides, phase, half-axes rA/rB) along direction angle a
function polyR(rA, rB, n, phase, a) {
  const dx = Math.cos(a), dz = Math.sin(a);
  let best = Math.max(rA, rB);
  for (let k = 0; k < n; k++) {
    const a0 = phase + (2 * Math.PI * k) / n, a1 = phase + (2 * Math.PI * (k + 1)) / n;
    const p0 = [Math.cos(a0) * rA, Math.sin(a0) * rB], p1 = [Math.cos(a1) * rA, Math.sin(a1) * rB];
    const ex = p1[0] - p0[0], ez = p1[1] - p0[1];
    const den = dx * ez - dz * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = (p0[0] * ez - p0[1] * ex) / den, u = (p0[0] * dz - p0[1] * dx) / den;
    if (t > 0 && u >= -1e-6 && u <= 1 + 1e-6) best = Math.min(best, t);
  }
  return best;
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const cream = (g, lo, hi) => paint(g, SW.cream, lo === undefined ? 'flat' : 'y', lo === undefined ? null : [lo, hi]);

  // ================= TORSO (shorter, deeper barrel) =================
  C.push(bodyPaint(hull([
    ...ring(V(0, 0.42, -0.41), 0.12, 0.11, 10, 'z'),
    ...ring(V(0, 0.4, -0.35), 0.2, 0.19, 10, 'z'),
    ...ring(V(0, 0.39, -0.18), 0.218, 0.205, 10, 'z'),
    ...ring(V(0, 0.39, 0.0), 0.222, 0.208, 10, 'z'),
    ...ring(V(0, 0.41, 0.15), 0.222, 0.2, 10, 'z'),
    ...ring(V(0, 0.45, 0.26), 0.165, 0.15, 10, 'z'),
  ])));
  C.push(headPaint(hull([...ring(V(0, 0.47, 0.2), 0.16, 0.15, 10, 'y'), ...ring(V(0, 0.64, 0.3), 0.17, 0.13, 10, 'y')])));

  // ================= LEGS (thicker, muscular shoulders & haunches) =================
  const FL = { x: 0.168, z: 0.19 };
  const FRINGS = [ // [y, cx, cz, rA(x), rB(z)]
    [0.06, FL.x, FL.z + 0.01, 0.095, 0.093], [0.2, FL.x - 0.004, FL.z, 0.1, 0.1],
    [0.36, FL.x - 0.014, FL.z - 0.012, 0.115, 0.128], [0.44, FL.x - 0.02, FL.z - 0.022, 0.125, 0.142],
    [0.54, FL.x - 0.04, FL.z - 0.03, 0.075, 0.1],
  ];
  S.push(legPaint(hull(FRINGS.flatMap(([y, cx, cz, a, b]) => ring(V(cx, y, cz), a, b, 8))), FL.x, FL.z));
  const BL = { x: 0.172, z: -0.25 };
  S.push(legPaint(hull([...ring(V(BL.x - 0.02, 0.45, BL.z + 0.02), 0.165, 0.165, 8, 'x'),
    ...ring(V(BL.x + 0.008, 0.45, BL.z + 0.02), 0.14, 0.14, 8, 'x'),
    ...ring(V(BL.x + 0.006, 0.2, BL.z - 0.03), 0.098, 0.104, 8)]), BL.x, BL.z));
  S.push(legPaint(hull([...ring(V(BL.x + 0.006, 0.22, BL.z - 0.03), 0.095, 0.1, 8), ...ring(V(BL.x + 0.008, 0.06, BL.z + 0.0), 0.09, 0.088, 8)]),
    BL.x, BL.z));
  const paw = (x, z, s = 1) => {
    S.push(paint(hull(cbox(V(x, 0.045, z), 0.078 * s, 0.045, 0.072 * s, 0.024)), SW.paw, 'y', [0, 0.1]));
    for (const dx of [-0.054, -0.018, 0.018, 0.054])
      S.push(paint(hull(cbox(V(x + dx * s, 0.036, z + 0.068 * s), 0.02 * s, 0.036, 0.03, 0.01)), SW.paw, 'y', [0, 0.1]));
  };
  paw(FL.x, FL.z + 0.02, 1.3);
  paw(BL.x + 0.008, BL.z + 0.02, 1.24);

  // ================= CHEST (cream bib, small shards) =================
  // flat fur shard: wide across `side`, thin along `nrm`, pointing along `dir`
  const flatShard = (b, dir, nrm, w, len, th = 0.016) => {
    const d = dir.clone().normalize(), n = nrm.clone().normalize();
    const sd = new THREE.Vector3().crossVectors(d, n).normalize();
    const nn = new THREE.Vector3().crossVectors(sd, d).normalize();
    return hull([b.clone().addScaledVector(d, len), b.clone().addScaledVector(sd, w), b.clone().addScaledVector(sd, -w),
      b.clone().addScaledVector(nn, th).addScaledVector(d, len * 0.25), b.clone().addScaledVector(nn, -th * 0.6).addScaledVector(d, -0.01)]);
  };
  C.push(paint(blob(1, V(0, 0.45, 0.285), V(0.135, 0.14, 0.075), { jitter: 0.1 }), SW.cream, 'y', [0.28, 0.62]));
  const CN = V(0, 0.15, 1); // chest normal (forward, tipped up)
  // upper layer (behind the amulet's edges) and lower layer, all pointing down
  C.push(cream(flatShard(V(0, 0.4, 0.345), V(0, -1, 0.12), CN, 0.05, 0.13), 0.24, 0.42));
  S.push(cream(flatShard(V(0.085, 0.42, 0.33), V(0.2, -1, 0.1), CN.clone().add(V(0.35, 0, 0)), 0.05, 0.12), 0.26, 0.44));
  S.push(cream(flatShard(V(0.05, 0.34, 0.33), V(0.12, -1, 0.15), CN, 0.045, 0.11), 0.2, 0.36));
  S.push(cream(flatShard(V(0.125, 0.355, 0.3), V(0.35, -1, 0.1), CN.clone().add(V(0.6, 0, 0)), 0.042, 0.1), 0.22, 0.37));

  // ================= HEAD (wide, flat big-cat skull) =================
  C.push(headPaint(hull([
    ...cbox(V(0, H.y - 0.01, H.z), H.hx, H.hy - 0.01, H.hz, 0.07),
    ...ring(V(0, H.y + 0.16, H.z - 0.01), 0.17, 0.11, 10, 'y'),
    ...ring(V(0, H.y + 0.02, H.z - 0.19), 0.16, 0.11, 10, 'z'),
    ...ring(V(0, H.y + 0.05, H.z - 0.15), 0.215, 0.14, 10, 'z'),
    V(0.27, H.y - 0.06, H.z + 0.03), V(-0.27, H.y - 0.06, H.z + 0.03),
    V(0.25, H.y - 0.12, H.z + 0.01), V(-0.25, H.y - 0.12, H.z + 0.01),
  ])));
  const FZ = H.z + H.hz;

  // cream jowls + broad cheek ruff flaring out at the sides
  S.push(paint(hull([
    V(0.1, H.y - 0.09, FZ + 0.01), V(0.2, H.y - 0.07, FZ - 0.035), V(0.27, H.y - 0.09, H.z + 0.05),
    V(0.25, H.y - 0.16, H.z + 0.05), V(0.14, H.y - 0.175, FZ - 0.03), V(0.09, H.y - 0.16, FZ + 0.01),
    V(0.23, H.y - 0.07, H.z - 0.0), V(0.22, H.y - 0.15, H.z - 0.0), V(0.12, H.y - 0.16, H.z + 0.02),
  ]), SW.cream, 'y', [H.y - 0.18, H.y - 0.06]));
  for (const [b, d, w, l, sw] of [
    [V(0.25, H.y - 0.03, H.z + 0.02), V(1, -0.05, -0.55), 0.042, 0.1, SW.cream],
    [V(0.25, H.y - 0.1, H.z + 0.03), V(0.9, -0.45, -0.5), 0.042, 0.1, SW.cream],
    [V(0.2, H.y - 0.155, H.z + 0.05), V(0.6, -0.8, -0.45), 0.038, 0.085, SW.cream],
  ]) S.push(paint(flatShard(b, d, V(0.7, 0.25, 0.8), w * 1.15, l, 0.022), sw, 'flat'));

  // short muzzle: bridge + split whisker pads (cat "W" lip), small triangular nose
  C.push(paint(hull([...cbox(V(0, H.y - 0.07, FZ + 0.02), 0.1, 0.058, 0.045, 0.025),
    V(0.06, H.y + 0.0, FZ - 0.02), V(-0.06, H.y + 0.0, FZ - 0.02)]), SW.muzzle, 'y', [H.y - 0.15, H.y]));
  S.push(paint(hull(cbox(V(0.043, H.y - 0.088, FZ + 0.058), 0.043, 0.034, 0.028, 0.014)), SW.muzzle, 'y', [H.y - 0.13, H.y - 0.05]));
  C.push(paint(hull([V(-0.036, H.y - 0.028, FZ + 0.078), V(0.036, H.y - 0.028, FZ + 0.078), V(0, H.y - 0.066, FZ + 0.091),
    V(-0.032, H.y - 0.026, FZ + 0.045), V(0.032, H.y - 0.026, FZ + 0.045), V(0, H.y - 0.07, FZ + 0.06), V(0, H.y - 0.02, FZ + 0.068)]),
  SW.nose, 'y', [H.y - 0.07, H.y - 0.02]));
  C.push(paint(hull(cbox(V(0, H.y - 0.088, FZ + 0.083), 0.005, 0.022, 0.007, 0.002)), SW.mouth, 'flat'));
  C.push(paint(hull(cbox(V(0, H.y - 0.138, FZ + 0.025), 0.05, 0.022, 0.03, 0.012)), SW.cream, 'flat'));
  S.push(paint(hull([V(0, H.y - 0.118, FZ + 0.066), V(0, H.y - 0.126, FZ + 0.066), V(0.07, H.y - 0.114, FZ + 0.05),
    V(0.07, H.y - 0.12, FZ + 0.05), V(0, H.y - 0.122, FZ + 0.04), V(0.06, H.y - 0.117, FZ + 0.03)]), SW.mouth, 'flat'));

  // fierce eyes
  const E = V(0.1, H.y + 0.03, 0);
  S.push(paint(hull(plate([[-0.044, 0.004], [0.048, 0.034], [0.054, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.048, -0.016]],
    E, FZ - 0.01, FZ + 0.012)), SW.white, 'flat'));
  S.push(paint(hull(plate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]],
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.014, FZ + 0.021)), SW.white, 'flat'));
  S.push(paint(hull([
    V(0.035, E.y + 0.012, FZ + 0.03), V(0.037, E.y + 0.05, FZ + 0.02),
    V(0.175, E.y + 0.05, FZ - 0.01), V(0.175, E.y + 0.09, FZ - 0.025),
    V(0.035, E.y + 0.012, FZ - 0.03), V(0.037, E.y + 0.06, FZ - 0.04),
    V(0.175, E.y + 0.05, FZ - 0.06), V(0.175, E.y + 0.092, FZ - 0.07),
  ]), SW.brow, 'y'));

  // round ears set out on the sides of the skull: dark backs, gold rim, cream inner
  {
    const EA = V(0.205, H.y + 0.14, H.z - 0.07);
    const tilt = (pts) => pts.map((p) => { // lean the ear outward ~25 deg about its base
      const dx = p.x - EA.x, dy = p.y - (EA.y - 0.05), c = Math.cos(-0.42), sn = Math.sin(-0.42);
      return V(EA.x + dx * c - dy * sn, EA.y - 0.05 + dx * sn + dy * c, p.z);
    });
    S.push(paint(hull(tilt([...ring(EA, 0.07, 0.07, 10, 'z', 0), ...ring(V(EA.x, EA.y - 0.008, EA.z - 0.05), 0.076, 0.074, 10, 'z', 0)])),
      SW.gold, 'y', [H.y + 0.08, H.y + 0.24]));
    S.push(paint(hull(tilt([...ring(V(EA.x, EA.y - 0.006, EA.z + 0.012), 0.045, 0.045, 10, 'z', 0),
      ...ring(V(EA.x, EA.y - 0.006, EA.z - 0.01), 0.045, 0.045, 10, 'z', 0)])), SW.earIn, 'y', [EA.y - 0.05, EA.y + 0.05]));
    S.push(paint(hull(tilt([...ring(V(EA.x, EA.y - 0.01, EA.z - 0.058), 0.06, 0.057, 10, 'z', 0),
      ...ring(V(EA.x, EA.y - 0.01, EA.z - 0.045), 0.06, 0.057, 10, 'z', 0)])), SW.dark, 'flat'));
  }

  // ================= TAIL (low off the rump, sweeps back, hooks up) =================
  const tailS = curveSamples(
    [V(0, 0.43, -0.36), V(0, 0.38, -0.5), V(0, 0.39, -0.64), V(0, 0.47, -0.77), V(0, 0.6, -0.85), V(0, 0.73, -0.83), V(0, 0.79, -0.73)],
    18, (t) => 0.062 - 0.016 * t);
  C.push(tailPaint(tube(tailS, { seg: 8, axis: X, capStart: 0, capEnd: 0.035 }), tailS));

  // ================= JADE SPINE SPIKES (head -> back -> tail) =================
  C.push(jadeSpike(V(0, H.y + 0.165, H.z + 0.0), 0.07, 0.35, 0.03, 0.018));
  C.push(jadeSpike(V(0, H.y + 0.155, H.z - 0.1), 0.085, 0.45, 0.034, 0.02));
  C.push(jadeSpike(V(0, H.y + 0.11, H.z - 0.18), 0.075, 0.6, 0.032, 0.018));
  for (const [z, l] of [[0.13, 0.09], [0.02, 0.105], [-0.09, 0.1], [-0.2, 0.09], [-0.3, 0.075]]) {
    C.push(jadeSpike(V(0, z > 0.1 ? 0.6 : 0.585, z), l, 0.45, 0.038, 0.022));
  }
  // dorsal row continues onto the first (horizontal) stretch of the tail
  for (const t of [0.1, 0.22, 0.34]) {
    const k = Math.round(t * (tailS.length - 1));
    const s = tailS[k], T = tailS[k + 1].p.clone().sub(s.p).normalize();
    const N = new THREE.Vector3().crossVectors(X, T).normalize(); // dorsal (up while the tail runs back)
    const base = s.p.clone().addScaledVector(N, s.rx * 0.82);
    const len = 0.065 - 0.04 * t;
    C.push(paint(hull([
      base.clone().addScaledVector(N, len).addScaledVector(T, len * 0.5),
      base.clone().addScaledVector(T, 0.028), base.clone().addScaledVector(T, -0.028),
      base.clone().add(V(0.017, 0, 0)), base.clone().add(V(-0.017, 0, 0)),
      base.clone().addScaledVector(N, -0.02),
    ]), SW.jade, 'y', [base.y - 0.02, base.y + len]));
  }

  // ================= JADE COLLAR + AMULET =================
  {
    const c0 = V(0, 0.53, 0.255), axis = V(0, 0.9, 0.42).normalize();
    const v = new THREE.Vector3().crossVectors(X, axis).normalize();
    const pts = [];
    for (let k = 0; k < 12; k++) {
      const a = (2 * Math.PI * k) / 12 + Math.PI / 12;
      for (const [h, e] of [[-0.018, 0], [0.018, 0], [0, 0.012]]) pts.push(c0.clone().addScaledVector(X, Math.cos(a) * (0.172 + e)).addScaledVector(v, Math.sin(a) * (0.148 + e)).addScaledVector(axis, h));
    }
    C.push(paint(hull(pts), SW.jadeDk, 'y', [0.48, 0.6]));
    const A = V(0, 0.42, 0.405);
    C.push(paint(hull([V(0, A.y + 0.07, A.z - 0.02), V(0, A.y - 0.07, A.z - 0.02), V(0.058, A.y, A.z - 0.02), V(-0.058, A.y, A.z - 0.02),
      V(0, A.y + 0.065, A.z - 0.06), V(0, A.y - 0.065, A.z - 0.06), V(0.052, A.y, A.z - 0.06), V(-0.052, A.y, A.z - 0.06)]), SW.goldTrim, 'flat'));
    C.push(paint(hull([V(0, A.y + 0.052, A.z - 0.014), V(0, A.y - 0.052, A.z - 0.014), V(0.042, A.y, A.z - 0.014), V(-0.042, A.y, A.z - 0.014),
      V(0, A.y + 0.01, A.z + 0.016), V(0, A.y - 0.01, A.z + 0.016)]), SW.jade, 'y', [A.y - 0.05, A.y + 0.05]));
    C.push(paint(hull(cbox(V(0, A.y + 0.075, A.z - 0.04), 0.014, 0.018, 0.016, 0.005)), SW.goldTrim, 'flat'));
  }

  // ================= JADE PAULDRONS (two thin curved plates hugging the shoulder, gold-trimmed) =================
  {
    const sc = V(FL.x - 0.03, 0, FL.z - 0.025); // shoulder axis (vertical)
    const T = 0.02; // plate thickness
    // [yTop, yBot, rTop, rBot, swatch]  (radii measured from the shoulder axis, outer side +x)
    for (const [yT, yB, rT, rB, sw] of [[0.515, 0.462, 0.095, 0.158, SW.jade], [0.475, 0.425, 0.148, 0.176, SW.jadeDk]]) {
      const NS = 5, A0 = -0.9, A1 = 0.9;
      for (let j = 0; j < NS; j++) {
        const angs = [A0 + ((A1 - A0) * j) / NS, A0 + ((A1 - A0) * (j + 1)) / NS];
        const pts = [], trim = [];
        for (const a of angs) {
          const dx = Math.cos(a), dz = Math.sin(a) * 1.05;
          const sag = 0.035 * (a / A1) * (a / A1);
          const P = (r, y) => V(sc.x + dx * r, y - sag, sc.z + dz * r);
          pts.push(P(rT, yT), P(rT + T, yT), P(rB, yB), P(rB + T, yB));
          trim.push(P(rB - 0.002, yB - 0.006), P(rB + T + 0.007, yB - 0.006), P(rB - 0.002 + (rT - rB) * 0.2, yB + 0.018), P(rB + T + 0.007 + (rT - rB) * 0.2, yB + 0.018));
        }
        S.push(paint(hull(pts), sw, 'y', [yB - 0.02, yT]));
        S.push(paint(hull(trim), SW.goldTrim, 'y', [yB - 0.01, yB + 0.02]));
      }
    }
  }

  // ================= VINE wound tightly around each front leg, leaves lying along the leg =================
  {
    const legAt = (y) => { // interpolate the leg's ring definition at height y
      for (let k = 0; k < FRINGS.length - 1; k++) {
        const r0 = FRINGS[k], r1 = FRINGS[k + 1];
        if (y <= r1[0] || k === FRINGS.length - 2) {
          const t = clamp01((y - r0[0]) / (r1[0] - r0[0]));
          return r0.map((v, i) => v + (r1[i] - v) * t);
        }
      }
    };
    const VR = 0.0115, GAP = -0.005; // tube sunk ~40% into the leg so it hugs the surface
    const surf = (y, a, off) => {
      const [, cx, cz, rA, rB] = legAt(y);
      const r = polyR(rA, rB, 8, Math.PI / 8, a) + off;
      return V(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r);
    };
    const N = 26, y0 = 0.12, y1 = 0.36, A0 = -0.3, TURN = Math.PI * 3.0;
    const pts = [];
    for (let k = 0; k < N; k++) {
      const s = k / (N - 1);
      const a = A0 + s * TURN;
      const y = y0 + (y1 - y0) * s + 0.02 * Math.sin(a); // tilted turns
      const e = Math.min(1, Math.min(s, 1 - s) / 0.06); // 0 at the ends -> tuck into the leg
      pts.push({ p: surf(y, a, (VR + GAP) * (0.2 + 0.8 * e)), r: VR * (0.55 + 0.45 * e) });
    }
    S.push(paint(tube(pts.map(({ p, r }) => ({ p, rx: r, ry: r })), { seg: 6, capStart: 0, capEnd: 0 }), SW.vine, 'flat'));
    for (const s of [0.12, 0.45, 0.8]) {
      const a = A0 + s * TURN, y = y0 + (y1 - y0) * s + 0.02 * Math.sin(a);
      const out = V(Math.cos(a), 0, Math.sin(a));
      const base = surf(y, a, VR * 1.2 + GAP);
      const tip = surf(y - 0.075, a + 0.35, 0.012);
      S.push(leaf(base, tip.clone().sub(base), out, base.distanceTo(tip), 0.032));
    }
  }

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

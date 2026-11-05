// Sand Viper: sand-coloured horned viper resting on a stacked symmetric coil, head raised in an S-curve,
// brown zigzag pattern, cream belly plates, gold-tipped horns, gold collar with a lapis gem.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// ---- painted zigzag regions (hi-res, crisp): each spans the full atlas width, 3 cell rows tall ----
// coil region: i = 16 (y 256..640). u: one period = ZW px around x = 512; v = cross-section angle.
const ZW = 256, A_MIN = -0.35 * Math.PI, A_MAX = 1.0 * Math.PI, RH = 384;
const vOfA = (a) => (a - A_MIN) / (A_MAX - A_MIN);
const ZIG_DARK = '#4A220A', ZIG_MID = '#9A5424';
function zigPath(g, x0, y0, x1, step, vA, vB) {
  g.beginPath();
  let k = 0;
  for (let px = x0; px <= x1 + step; px += step, k++) {
    const v = k % 2 ? vB : vA;
    k === 0 ? g.moveTo(px, y0 + v * RH) : g.lineTo(px, y0 + v * RH);
  }
}
function drawZig(g, x, y) {
  const grd = g.createLinearGradient(0, y, 0, y + RH);
  grd.addColorStop(0, '#D8A65E'); grd.addColorStop(vOfA(Math.PI / 2), '#F6D896'); grd.addColorStop(1, '#E2B46C');
  g.fillStyle = grd; g.fillRect(0, y, 1024, RH);
  g.save(); g.beginPath(); g.rect(0, y, 1024, RH); g.clip();
  g.lineJoin = 'miter'; g.miterLimit = 10;
  const vc = vOfA(0.25 * Math.PI), amp = 0.21;
  for (const [lw, col] of [[66, ZIG_DARK], [38, ZIG_MID]]) {
    g.strokeStyle = col; g.lineWidth = lw;
    zigPath(g, 512 - 3 * ZW, y, 1024, ZW / 2, vc + amp, vc - amp); g.stroke();   // valley (outer) at u = 0
  }
  g.restore();
}
// neck region: i = 40 (y 640..1024). u: along the neck, NP rings per period = NPX px; v = |angle from spine| / pi.
const NP = 3, NPX = 192;
function drawDia(g, x, y) {
  const grd = g.createLinearGradient(0, y, 0, y + RH);
  grd.addColorStop(0, '#E4B872'); grd.addColorStop(0.55, '#F4D594'); grd.addColorStop(1, '#F8E2AE');
  g.fillStyle = grd; g.fillRect(0, y, 1024, RH);
  g.save(); g.beginPath(); g.rect(0, y, 1024, RH); g.clip();
  g.lineJoin = 'miter'; g.miterLimit = 10;
  for (const [lw, col] of [[60, ZIG_DARK], [36, ZIG_MID]]) {
    g.strokeStyle = col; g.lineWidth = lw;
    zigPath(g, 512 - 3 * NPX, y, 1024, NPX / 2, 0.05, 0.4); g.stroke();
  }
  g.restore();
}

export const PALETTE = {
  sand:   { i: 0, top: '#F2CF8A', bot: '#D29F55' },
  sandS:  { i: 1, top: '#E8C07A', bot: '#C58F47' },
  brown:  { i: 2, top: '#9A5A2A', bot: '#6B3815' },
  brownD: { i: 3, top: '#7A4420', bot: '#4E260E' },
  belly:  { i: 4, top: '#FFEDB0', bot: '#F2CB7C' },
  bellyD: { i: 15, top: '#F6DC9A', bot: '#DDB063' },
  gold:   { i: 5, top: '#FFD83D', bot: '#E39A12' },
  lapis:  { i: 6, top: '#3E7BFF', bot: '#1A3BB8' },
  eye:    { i: 7, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 8, top: '#FFFFFF', bot: '#F1F1F4' },
  mouth:  { i: 9, top: '#3A1E14', bot: '#22100A' },
  brow:   { i: 10, top: '#B9783F', bot: '#7E4A20' },
  tongue: { i: 11, top: '#F2434A', bot: '#B3141F' },
  stone:  { i: 12, top: '#E0A866', bot: '#B9773E' },
  zig:    { i: 16, draw: drawZig },   // paints atlas rows 2..4
  dia:    { i: 40, draw: drawDia },   // paints atlas rows 5..7
};
const P = PALETTE;

// ---------- local helpers ----------
function swUV(sw, t) {
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  return [(x + 64) / 1024, (y + 16 + THREE.MathUtils.clamp(t, 0, 1) * 96) / 1024];
}
function finish(pos, meta) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.userData.meta = meta;
  g.computeVertexNormals();
  return g;
}
function tri(pos, meta, a, b, c, out, m) {
  const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
  if (n.dot(out) < 0) [b, c] = [c, b];
  pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  meta.push(m);
}
function paintTris(g, pick, lo, hi) {
  const p = g.attributes.position, uv = [];
  const meta = g.userData.meta || [];
  const a = V(0, 0, 0), b = V(0, 0, 0), c = V(0, 0, 0);
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    const cen = a.clone().add(b).add(c).divideScalar(3);
    const sw = pick(cen, meta[i / 3] || {});
    for (const v of [a, b, c]) uv.push(...swUV(sw, 1 - (v.y - lo) / Math.max(1e-6, hi - lo)));
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.meta;
  return g;
}
// even triangle wave in [0,1]: 0 at x = 0 (mod 1), 1 at x = 0.5
const triW = (x) => { const f = x - Math.floor(x); return 1 - Math.abs(1 - 2 * f); };

// Closed coil ring (antiprism grid). prof = [[dr, dy], ...] (even count) around the cross-section.
function coil(cy, R, prof, N) {
  const M = prof.length;
  const P_ = (i, k) => {
    const kk = ((k % M) + M) % M;
    const phi = (2 * Math.PI * (i + 0.5 * (kk % 2))) / N;
    const rad = R + prof[kk][0];
    return V(Math.sin(phi) * rad, cy + prof[kk][1], Math.cos(phi) * rad);
  };
  const pos = [], meta = [];
  for (let k = 0; k < M; k++) {
    for (let i = 0; i < N; i++) {
      let A, B;
      if (k % 2 === 0) {
        A = [P_(i, k), P_(i + 1, k), P_(i, k + 1)];
        B = [P_(i, k + 1), P_(i + 1, k + 1), P_(i + 1, k)];
      } else {
        A = [P_(i, k), P_(i + 1, k), P_(i + 1, k + 1)];
        B = [P_(i, k + 1), P_(i + 1, k + 1), P_(i, k)];
      }
      for (const [t, apex] of [[A, 'up'], [B, 'down']]) {
        const cen = t[0].clone().add(t[1]).add(t[2]).divideScalar(3);
        const phi = Math.atan2(cen.x, cen.z);
        const h = V(Math.sin(phi) * R, cy, Math.cos(phi) * R);
        const o = cen.clone().sub(h);
        const dr = Math.hypot(cen.x, cen.z) - R, dy = cen.y - cy;
        tri(pos, meta, ...t, o, { k, apex, phi, a: Math.atan2(dy, dr) });
      }
    }
  }
  return finish(pos, meta);
}
// rounded cross-section profile with a flattened underside
function profile(M, rOut, rUp, rIn, rDown, flat) {
  const out = [];
  for (let k = 0; k < M; k++) {
    const a = (2 * Math.PI * k) / M;
    const c = Math.cos(a), s = Math.sin(a);
    out.push([c * (c > 0 ? rOut : rIn), Math.max(s * (s > 0 ? rUp : rDown), -flat)]);
  }
  return out;
}

// Tube with antiprism rings along samples; frame A = -x for curves in the YZ plane.
function scaleTube(samples, seg, phase, { capStart = 0, capEnd = 0 } = {}) {
  const n = samples.length, rings = [], frames = [], vmap = new Map();
  const X = V(1, 0, 0);
  for (let i = 0; i < n; i++) {
    const p = samples[i].p;
    const T = new THREE.Vector3().subVectors(samples[Math.min(i + 1, n - 1)].p, samples[Math.max(i - 1, 0)].p).normalize();
    const B = new THREE.Vector3().crossVectors(T, X).normalize();
    const A = new THREE.Vector3().crossVectors(T, B).normalize();
    const r = [];
    for (let k = 0; k < seg; k++) {
      const th = phase + (2 * Math.PI * (k + 0.5 * (i % 2))) / seg;
      const q = p.clone().addScaledVector(A, Math.cos(th) * samples[i].rx).addScaledVector(B, Math.sin(th) * samples[i].ry);
      const o = q.clone().sub(p);
      vmap.set(vkey(q), { i, th: Math.atan2(Math.abs(o.x), o.dot(B)) });
      r.push(q);
    }
    rings.push(r); frames.push({ p, T, B });
  }
  const pos = [], meta = [];
  for (let i = 0; i < n - 1; i++) {
    const mid = frames[i].p.clone().add(frames[i + 1].p).multiplyScalar(0.5);
    const front = frames[i].B.clone().add(frames[i + 1].B).multiplyScalar(-0.5).normalize();
    for (let k = 0; k < seg; k++) {
      const k1 = (k + 1) % seg;
      let A, Bt;
      if (i % 2 === 0) {
        A = [rings[i][k], rings[i][k1], rings[i + 1][k]];
        Bt = [rings[i + 1][k], rings[i + 1][k1], rings[i][k1]];
      } else {
        A = [rings[i][k], rings[i][k1], rings[i + 1][k1]];
        Bt = [rings[i + 1][k], rings[i + 1][k1], rings[i][k]];
      }
      for (const [t, apex] of [[A, 'up'], [Bt, 'down']]) {
        const cen = t[0].clone().add(t[1]).add(t[2]).divideScalar(3);
        const o = cen.clone().sub(mid).normalize();
        const fr = o.dot(front);
        // angle around the tube measured from the back (0 = spine, pi = belly), signed by x
        const th = Math.atan2(Math.abs(o.x), -fr);
        tri(pos, meta, ...t, o, { i, apex, front: fr, th, side: o.x });
      }
    }
  }
  const cap = (i, bulge, s) => {
    const { p, T } = frames[i];
    const tip = p.clone().addScaledVector(T, bulge * s), o = T.clone().multiplyScalar(s);
    for (let k = 0; k < seg; k++) tri(pos, meta, rings[i][k], rings[i][(k + 1) % seg], tip, o, { i, front: 0, th: 0, cap: true });
  };
  cap(0, capStart, -1); cap(n - 1, capEnd, 1);
  const g = finish(pos, meta);
  g.userData.vmap = vmap;
  return g;
}
const vkey = (q) => `${q.x.toFixed(4)},${q.y.toFixed(4)},${q.z.toFixed(4)}`;
// neck painter: belly tris solid, the rest uses the painted diamond/zigzag cell
function paintNeck(g) {
  const p = g.attributes.position, meta = g.userData.meta, vmap = g.userData.vmap, uv = [];
  const cy = 640;
  const vs = [V(0, 0, 0), V(0, 0, 0), V(0, 0, 0)];
  for (let t = 0; t < p.count; t += 3) {
    for (let j = 0; j < 3; j++) vs[j].fromBufferAttribute(p, t + j);
    const m = meta[t / 3];
    const info = vs.map((v) => vmap.get(vkey(v)));
    if (m.front > 0.6 || info.some((x) => !x)) { for (const v of vs) uv.push(...swUV(PALETTE.belly, 0.3)); continue; }
    const ic = (info[0].i + info[1].i + info[2].i) / 3, base = NP * Math.round(ic / NP);
    for (const x of info) uv.push((512 + (x.i - base) * NPX / NP) / 1024, (cy + THREE.MathUtils.clamp(x.th / Math.PI, 0.01, 0.99) * RH) / 1024);
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.meta; delete g.userData.vmap;
  return g;
}

// coil painter: strips 3,4 (inner-lower, bottom) cream; strip 5 (outer-lower) cream scale teeth; the rest zigzag texture
function paintCoil(g, cy, R, periods) {
  const p = g.attributes.position, meta = g.userData.meta, uv = [];
  const ang = (v) => { let a = Math.atan2(v.y - cy, Math.hypot(v.x, v.z) - R); if (a < -0.5 * Math.PI) a += 2 * Math.PI; return a; };
  const uOf = (v) => (Math.atan2(v.x, v.z) / (2 * Math.PI)) * periods;
  const vs = [V(0, 0, 0), V(0, 0, 0), V(0, 0, 0)];
  for (let i = 0; i < p.count; i += 3) {
    for (let j = 0; j < 3; j++) vs[j].fromBufferAttribute(p, i + j);
    const m = meta[i / 3];
    if (m.k === 3 || m.k === 4 || (m.k === 5 && m.apex === 'up')) {
      const sw = m.k === 5 ? PALETTE.belly : PALETTE.bellyD;
      for (const v of vs) uv.push(...swUV(sw, 1 - (v.y - (cy - 0.12)) / 0.14));
      continue;
    }
    const cen = vs[0].clone().add(vs[1]).add(vs[2]).divideScalar(3);
    const u0 = Math.round(uOf(cen));
    for (const v of vs) {
      let du = uOf(v) - u0; if (du > periods / 2) du -= periods; if (du < -periods / 2) du += periods;
      uv.push((512 + du * ZW) / 1024, (256 + THREE.MathUtils.clamp(vOfA(ang(v)), 0.003, 0.997) * RH) / 1024);
    }
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.meta;
  return g;
}

export function buildGeometry() {
  const C = [], S = [];
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= COIL BASE: two stacked chunky rings (12 / 10 segments, hexagonal cross-section) =================
  const hex = (o, u, i, b, h, f) => [[o, 0], [u, h], [-i * 0.45, h], [-i, 0], [-i * 0.5, -f], [u, -f]];
  C.push(paintCoil(coil(0.125, 0.3, hex(0.165, 0.085, 0.14, 0, 0.125, 0.125), 12), 0.125, 0.3, 6));
  C.push(paintCoil(coil(0.335, 0.17, hex(0.135, 0.07, 0.12, 0, 0.105, 0.1), 10), 0.335, 0.17, 5));

  // tail tip poking out at the back on the centre line, resting on the ground, gold cuff
  {
    const tp = [V(0, 0.16, -0.36), V(0, 0.1, -0.46), V(0, 0.05, -0.54), V(0, 0.03, -0.62)];
    const ts = curveSamples(tp, 5, (t) => 0.075 * (1 - t) + 0.014);
    C.push(paintTris(scaleTube(ts, 6, Math.PI / 2, { capEnd: 0.035 }), (c, m) => (m.apex === 'up' ? P.sand : P.sandS), 0, 0.2));
    C.push(paint(hull([...ring(V(0, 0.09, -0.48), 0.058, 0.058, 8, 'z'), ...ring(V(0, 0.072, -0.51), 0.054, 0.054, 8, 'z')]), P.gold, 'y'));
  }

  // ================= NECK: thick S-curve (rises forward, arches back, then thrusts the head forward) =================
  const neckPts = [V(0, 0.27, -0.02), V(0, 0.42, 0.075), V(0, 0.56, 0.02), V(0, 0.67, -0.085), V(0, 0.78, -0.08), V(0, 0.845, 0.0)];
  const nr = (t) => 0.172 - 0.03 * t;
  C.push(paintNeck(scaleTube(curveSamples(neckPts, 13, nr), 8, Math.PI / 2)));
  // cream belly plates on the front of the neck
  {
    const N = 24, fine = curveSamples(neckPts, N, nr), X = V(1, 0, 0);
    const fr = (i) => {
      const T = new THREE.Vector3().subVectors(fine[Math.min(i + 1, N - 1)].p, fine[Math.max(i - 1, 0)].p).normalize();
      return new THREE.Vector3().crossVectors(T, X).normalize().negate();
    };
    for (let i = 2; i < 19; i += 2) {
      if (Math.abs((i + 1) / (N - 1) - 10 / 30) < 0.05) continue; // leave room for the collar
      const pts = [];
      for (const j of [i, i + 2]) {
        const s0 = fine[Math.min(j, N - 1)], F = fr(Math.min(j, N - 1)), r = s0.rx, w = r * 0.58;
        for (const sx of [-1, 1]) {
          pts.push(s0.p.clone().addScaledVector(X, sx * w).addScaledVector(F, r * 0.8));
          pts.push(s0.p.clone().addScaledVector(X, sx * w * 0.72).addScaledVector(F, r * 1.06));
          pts.push(s0.p.clone().addScaledVector(X, sx * w).addScaledVector(F, r * 0.35));
        }
      }
      const cen = pts.reduce((a, b) => a.add(b), V(0, 0, 0)).divideScalar(pts.length);
      const T = fine[i + 1].p.clone().sub(fine[i].p).normalize();
      for (const q of pts) { const d = q.clone().sub(cen).dot(T); q.addScaledVector(T, -d * 0.14); }
      C.push(paint(hull(pts), P.belly, 'y', [0.2, 0.9]));
    }
  }
  // gold collar with a lapis gem at the front and lapis studs on the sides
  {
    const s = curveSamples(neckPts, 31, nr), j = 10, p = s[j].p, r = s[j].rx;
    const T = s[j + 1].p.clone().sub(s[j - 1].p).normalize(), X = V(1, 0, 0);
    const B = new THREE.Vector3().crossVectors(T, X).normalize(), F = B.clone().negate();
    const pts = [];
    for (let k = 0; k < 10; k++) {
      const a = Math.PI / 10 + (2 * Math.PI * k) / 10;
      for (const dt of [-0.028, 0.028]) {
        const rr = r * 1.2;
        pts.push(p.clone().addScaledVector(X, Math.cos(a) * rr * 1.02).addScaledVector(B, Math.sin(a) * rr).addScaledVector(T, dt));
      }
    }
    C.push(paint(hull(pts), P.gold, 'y'));
    const g0 = p.clone().addScaledVector(F, r * 1.2 + 0.005);
    C.push(paint(hull([
      g0.clone().addScaledVector(F, 0.04),
      g0.clone().addScaledVector(T, 0.05), g0.clone().addScaledVector(T, -0.05),
      g0.clone().addScaledVector(X, 0.036), g0.clone().addScaledVector(X, -0.036),
      g0.clone().addScaledVector(F, -0.01),
    ]), P.lapis, 'y'));
    C.push(paint(hull([
      g0.clone().addScaledVector(F, 0.012),
      g0.clone().addScaledVector(T, 0.064).addScaledVector(F, -0.005), g0.clone().addScaledVector(T, -0.064).addScaledVector(F, -0.005),
      g0.clone().addScaledVector(X, 0.05).addScaledVector(F, -0.005), g0.clone().addScaledVector(X, -0.05).addScaledVector(F, -0.005),
      g0.clone().addScaledVector(F, -0.02),
    ]), P.gold, 'y'));
    const sd = p.clone().addScaledVector(X, r * 1.2 * 1.02 + 0.002);
    S.push(paint(hull([sd.clone().addScaledVector(X, 0.018), sd.clone().addScaledVector(T, 0.022), sd.clone().addScaledVector(T, -0.022),
      sd.clone().addScaledVector(B, 0.022), sd.clone().addScaledVector(B, -0.022), sd.clone().addScaledVector(X, -0.012)]), P.lapis, 'y'));
  }

  // ================= HEAD: one chunky viper wedge (built at the origin, then scaled, tilted and placed) =================
  const HC = [], HS = [];
  { const C = HC, S = HS;
  const FZ = 0.1; // eye plane
  const sym = (pts) => pts.flatMap(([x, y, z]) => (x === 0 ? [V(0, y, z)] : [V(x, y, z), V(-x, y, z)]));
  // skull: wide triangular back at the jaw hinges, flat top, tapering to the eye block
  C.push(paint(hull(sym([
    [0.235, -0.035, -0.1], [0.215, 0.055, -0.1],     // jaw hinge (widest)
    [0.15, -0.035, -0.2], [0.1, 0.075, -0.19], [0, 0.0, -0.235], [0, 0.085, -0.2],   // tapered back
    [0.12, 0.13, -0.06], [0.15, 0.13, FZ], [0.18, 0.05, FZ], [0.2, -0.035, FZ - 0.03],  // flat top + eye block front
  ])), P.sand, 'y', [-0.06, 0.14]));
  // snout: broad, tapering forward
  C.push(paint(hull(sym([
    [0.18, 0.055, FZ - 0.04], [0.2, -0.035, FZ - 0.04],
    [0.115, 0.05, FZ + 0.1], [0.125, -0.035, FZ + 0.1], [0.065, 0.035, FZ + 0.135], [0.075, -0.035, FZ + 0.135],
  ])), P.sand, 'y', [-0.06, 0.14]));
  // mouth interior (dark), set in between the jaws
  C.push(flat(hull(sym([[0.2, -0.03, -0.08], [0.06, -0.03, FZ + 0.12], [0.18, -0.058, -0.08], [0.05, -0.058, FZ + 0.1]])), P.mouth));
  // lower jaw: thick wedge, slightly open, sand sides + cream throat
  C.push(paint(hull(sym([
    [0.225, -0.03, -0.1], [0.14, -0.03, -0.185], [0.115, -0.055, FZ + 0.08], [0.06, -0.055, FZ + 0.115],
    [0.17, -0.12, -0.11], [0.1, -0.13, -0.15], [0.085, -0.115, FZ + 0.05], [0.045, -0.1, FZ + 0.09],
  ])), P.sand, 'y', [-0.15, 0.0]));
  C.push(paint(hull(sym([
    [0.15, -0.127, -0.11], [0.09, -0.137, -0.14], [0.075, -0.12, FZ + 0.04], [0.035, -0.106, FZ + 0.085],
    [0.13, -0.11, -0.11], [0.06, -0.1, FZ + 0.04],
  ])), P.belly, 'y', [-0.15, -0.09]));
  // fangs (upper jaw, hanging into the gap)
  S.push(flat(hull([V(0.05, -0.028, FZ + 0.115), V(0.078, -0.028, FZ + 0.1), V(0.062, -0.028, FZ + 0.085), V(0.062, -0.085, FZ + 0.105)]), P.white));
  // nostrils
  S.push(flat(hull(cbox(V(0.036, 0.012, FZ + 0.135), 0.013, 0.009, 0.006, 0.003)), P.mouth));
  // brown markings: stripe from the eye back to the jaw hinge, chevron on the back of the skull
  {
    const band = (pts, out) => hull(pts.flatMap((q) => [q.clone().addScaledVector(out, 0.007), q.clone().addScaledVector(out, -0.03)]));
    const side = (t, y) => V(0.18 + (0.215 - 0.18) * t, y, FZ + (-0.1 - FZ) * t); // along the side face top edge-ish
    S.push(paint(band([side(0.05, 0.055), side(0.05, 0.03), side(0.95, 0.045), side(0.95, 0.02)], V(1, 0, 0.17).normalize()), P.brown, 'flat'));
    S.push(paint(band([V(0, 0.09, -0.19), V(0, 0.11, -0.15), V(0.1, 0.13, -0.08), V(0.12, 0.13, -0.1), V(0.11, 0.09, -0.16)], V(0, 1, -0.6).normalize()), P.brown, 'flat'));
  }
  // fierce eyes
  const E = V(0.083, 0.088, 0), es = 1.12;
  const sc = (pts) => pts.map(([u, v]) => [u * es, v * es]);
  S.push(flat(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.02, FZ + 0.012)), P.white));
  S.push(flat(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), P.eye));
  S.push(flat(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.007, E.y + 0.003, 0), FZ + 0.014, FZ + 0.021)), P.white));
  // heavy brow slanting down to the centre
  S.push(paint(hull([
    V(0.02, E.y + 0.006, FZ + 0.035), V(0.022, E.y + 0.045, FZ + 0.025),
    V(0.175, E.y + 0.046, FZ - 0.0), V(0.175, E.y + 0.072, FZ - 0.015),
    V(0.02, E.y + 0.006, FZ - 0.06), V(0.022, E.y + 0.05, FZ - 0.07),
    V(0.175, E.y + 0.04, FZ - 0.09), V(0.175, E.y + 0.064, FZ - 0.1),
  ]), P.brow, 'y'));
  // horns over the eyes: brown base, gold tip
  {
    const hb = V(0.128, E.y + 0.06, FZ - 0.055), hd = V(0.4, 1, -0.4).normalize();
    S.push(paint(shard(hb, hd, 0.036, 0.07, 5, 1), P.brow, 'flat'));
    S.push(paint(shard(hb.clone().addScaledVector(hd, 0.05), hd, 0.025, 0.07, 5, 1), P.gold, 'flat'));
  }
  // armour bit: sandstone crown plate with a gold rim and lapis gem
  C.push(paint(hull([...cbox(V(0, 0.132, -0.07), 0.07, 0.014, 0.06, 0.02)]), P.gold, 'y'));
  C.push(paint(hull([...cbox(V(0, 0.144, -0.07), 0.055, 0.012, 0.047, 0.016)]), P.stone, 'y'));
  C.push(paint(hull([V(0, 0.185, -0.065), ...ring(V(0, 0.155, -0.065), 0.03, 0.03, 6, 'y', 0), V(0, 0.15, -0.065)]), P.lapis, 'y'));
  }
  // place the head: scale up, tilt the nose slightly down, set on the neck end
  const HSC = 1.15, TILT = 0.14, HP = V(0, 0.86, 0.075);
  for (const g of [...HC, ...HS]) { g.scale(HSC, HSC, HSC); g.rotateX(TILT); g.translate(HP.x, HP.y, HP.z); }
  return assemble([...C, ...HC], [...S, ...HS]);
}

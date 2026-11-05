// Supernova Serpent: deep indigo cosmic cobra on a chunky coil. Cyan glowing star hood, gold ornate armour,
// glowing eyes, comet-trail streaks on the coil and a meteor-rock tail club. Robux egg tier.
import { V, THREE, hash3, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  indigo:  { i: 0, top: '#4639BD', bot: '#1D1467' },
  indigoS: { i: 1, top: '#372BA4', bot: '#170F57' },
  indigoD: { i: 2, top: '#2E2494', bot: '#140E4E' },
  belly:   { i: 3, top: '#8E86F2', bot: '#5B50CC' },
  gold:    { i: 4, top: '#FFE15A', bot: '#E39A12' },
  cyan:    { i: 5, top: '#B8FBFF', bot: '#3FD8FF', glow: true },
  cyanD:   { i: 6, top: '#7FF1FF', bot: '#22B8F0', glow: true },
  eye:     { i: 7, top: '#1A1416', bot: '#0C0A0B' },
  white:   { i: 8, top: '#FFFFFF', bot: '#F1F1F4' },
  eyeGlow: { i: 9, top: '#FFFFFF', bot: '#D8FDFF', glow: true },
  rock:    { i: 10, top: '#7A6E86', bot: '#3E3548' },
  star:    { i: 11, top: '#FFFFFF', bot: '#C9FBFF', glow: true },
  mouth:   { i: 12, top: '#24103A', bot: '#120820' },
  lava:    { i: 14, top: '#FFB347', bot: '#FF6A00', glow: true },
  brow:    { i: 13, top: '#3B30B4', bot: '#1C1468' },
};
const P = PALETTE;

// ---------- local helpers (adapted from the faceted snake pattern) ----------
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
// closed coil ring with antiprism diamond scales; prof = [[dr, dy], ...]
function coil(cy, R, prof, N) {
  const M = prof.length;
  const Pt = (i, k) => {
    const kk = ((k % M) + M) % M;
    const phi = (2 * Math.PI * (i + 0.5 * (kk % 2))) / N;
    const rad = R + prof[kk][0];
    return V(Math.sin(phi) * rad, cy + prof[kk][1], Math.cos(phi) * rad);
  };
  const pos = [], meta = [];
  const outOf = (a, b, c) => {
    const cen = a.clone().add(b).add(c).divideScalar(3);
    const h = V(cen.x, 0, cen.z).normalize().multiplyScalar(R);
    return cen.sub(V(h.x, cy, h.z));
  };
  for (let k = 0; k < M; k++) for (let i = 0; i < N; i++) {
    let A, B;
    if (k % 2 === 0) { A = [Pt(i, k), Pt(i + 1, k), Pt(i, k + 1)]; B = [Pt(i, k + 1), Pt(i + 1, k + 1), Pt(i + 1, k)]; }
    else { A = [Pt(i, k), Pt(i + 1, k), Pt(i + 1, k + 1)]; B = [Pt(i, k + 1), Pt(i + 1, k + 1), Pt(i, k)]; }
    tri(pos, meta, ...A, outOf(...A), { k, i, apex: 'up' });
    tri(pos, meta, ...B, outOf(...B), { k, i, apex: 'down' });
  }
  return finish(pos, meta);
}
// tube with antiprism rings, frame from +x (curves in the YZ plane)
function scaleTube(samples, seg, phase) {
  const n = samples.length, rings = [], frames = [];
  const X = V(1, 0, 0);
  for (let i = 0; i < n; i++) {
    const p = samples[i].p;
    const T = new THREE.Vector3().subVectors(samples[Math.min(i + 1, n - 1)].p, samples[Math.max(i - 1, 0)].p).normalize();
    const B = new THREE.Vector3().crossVectors(T, X).normalize();
    const A = new THREE.Vector3().crossVectors(T, B).normalize();
    const r = [];
    for (let k = 0; k < seg; k++) {
      const th = phase + (2 * Math.PI * (k + 0.5 * (i % 2))) / seg;
      r.push(p.clone().addScaledVector(A, Math.cos(th) * samples[i].rx).addScaledVector(B, Math.sin(th) * samples[i].ry));
    }
    rings.push(r); frames.push({ p, T });
  }
  const pos = [], meta = [];
  for (let i = 0; i < n - 1; i++) {
    const mid = frames[i].p.clone().add(frames[i + 1].p).multiplyScalar(0.5);
    for (let k = 0; k < seg; k++) {
      const k1 = (k + 1) % seg;
      const tris = i % 2 === 0
        ? [[rings[i][k], rings[i][k1], rings[i + 1][k]], [rings[i + 1][k], rings[i + 1][k1], rings[i][k1]]]
        : [[rings[i][k], rings[i][k1], rings[i + 1][k1]], [rings[i + 1][k], rings[i + 1][k1], rings[i][k]]];
      for (const t of tris) {
        const cen = t[0].clone().add(t[1]).add(t[2]).divideScalar(3);
        tri(pos, meta, ...t, cen.clone().sub(mid), { i, k, up: k % 2 });
      }
    }
  }
  for (const [i, s] of [[0, -1], [n - 1, 1]]) {
    const { p, T } = frames[i];
    for (let k = 0; k < seg; k++) tri(pos, meta, rings[i][k], rings[i][(k + 1) % seg], p.clone(), T.clone().multiplyScalar(s), { i, k });
  }
  return finish(pos, meta);
}
// flat 4/5-point star plate facing dir (+z by default) centred at c
function starPlate(c, r, rIn, pts, thick, rot = 0) {
  const P2 = [];
  for (let k = 0; k < pts * 2; k++) {
    const a = rot + Math.PI / 2 + (Math.PI * k) / pts, rr = k % 2 ? rIn : r;
    P2.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  // star is concave: build each point as its own convex hull (tip + two inner corners + centre)
  const out = [];
  for (let k = 0; k < pts; k++) {
    const tip = P2[2 * k], a = P2[(2 * k + 2 * pts - 1) % (2 * pts)], b = P2[2 * k + 1];
    out.push(hull(plate([[0, 0], tip, a, b], c, c.z - thick, c.z + thick)));
  }
  return out;
}

export function buildGeometry() {
  const C = [], S = [];
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= COIL BASE (two stacked rings) =================
  // k7 -> k0 strip = cyan glowing zigzag band; k4..k6 = lilac belly underside
  const prof0 = [[0.15, 0.035], [0.11, 0.105], [0.02, 0.135], [-0.095, 0.105], [-0.135, 0.01], [-0.1, -0.105], [0.105, -0.135], [0.155, -0.045]];
  C.push(paintTris(coil(0.135, 0.29, prof0, 20), (c, m) => {
    if (m.k === 7) return m.apex === 'up' ? P.cyan : P.indigo;
    if (m.k >= 4 && m.k <= 6) return P.belly;
    if (m.k === 1 && m.apex === 'up' && m.i % 5 === 2) return P.cyanD; // scattered star-scales
    return m.apex === 'up' ? P.indigo : P.indigoS;
  }, 0.0, 0.28));
  const prof1 = [[0.11, 0.025], [0.085, 0.08], [0.01, 0.1], [-0.075, 0.075], [-0.095, 0.0], [-0.065, -0.065], [0.075, -0.085], [0.11, -0.035]];
  C.push(paintTris(coil(0.3, 0.17, prof1, 16), (c, m) => {
    if (m.k === 7 && m.apex === 'up') return P.cyan;
    if (m.k === 6) return P.belly;
    return m.apex === 'up' ? P.indigo : P.indigoS;
  }, 0.18, 0.4));

  // gold armour bands on the lower coil (front-left/right) with cyan gems
  for (const ang of [0.42, 1.85]) {
    const R = 0.29, s = Math.sin(ang), co = Math.cos(ang);
    const rad = (dr, dy, dt) => V(Math.sin(ang + dt) * (R + dr), 0.135 + dy, Math.cos(ang + dt) * (R + dr));
    const pts = [];
    for (const dt of [-0.07, 0.07]) {
      pts.push(rad(0.168, 0.03, dt), rad(0.125, 0.12, dt), rad(0.02, 0.152, dt), rad(-0.06, 0.13, dt), rad(0.16, -0.04, dt));
    }
    S.push(paint(hull(pts), P.gold, 'y', [0.05, 0.29]));
    const g = rad(0.172, 0.03, 0);
    S.push(flat(hull([...cbox(g, 0.024, 0.028, 0.01, 0.006)].map(p => p.sub(g).applyAxisAngle(V(0, 1, 0), ang).add(g))), P.cyan));
  }

  // ================= COMETS lying flat on the lower coil's upper shoulder =================
  {
    const R = 0.29, cy = 0.135;
    // shoulder profile from k0 (outer) to k2 (top); s in [0,1]; lift > 1 pushes off the surface
    const sh = [[0.15, 0.035], [0.11, 0.105], [0.02, 0.135]];
    const surf = (a, s0, lift = 1.08) => {
      const t = THREE.MathUtils.clamp(s0, 0, 1) * 2, k = Math.min(1, Math.floor(t)), f = t - k;
      const dr = (sh[k][0] + (sh[k + 1][0] - sh[k][0]) * f) * lift, dy = (sh[k][1] + (sh[k + 1][1] - sh[k][1]) * f) * lift;
      return V(Math.sin(a) * (R + dr), cy + dy, Math.cos(a) * (R + dr));
    };
    for (const a0 of [0.78, 2.18]) {
      const sm = 0.42;
      // wide fanned trail (two convex halves), tapering away from the head
      const trail = [[0, 0.24], [0.12, 0.36], [0.26, 0.32], [0.42, 0.2], [0.6, 0.02]];
      for (let h = 0; h < 2; h++) {
        const seg = h === 0 ? trail.slice(0, 3) : trail.slice(2);
        const pts = [];
        for (const [da, w] of seg) for (const sg of [-1, 1]) for (const lift of [1.0, 1.1])
          pts.push(surf(a0 + 0.04 + da, sm + sg * w, lift));
        S.push(flat(hull(pts), P.cyanD));
      }
      // bright core streak
      const core = [];
      for (const [da, w] of [[0, 0.12], [0.2, 0.14], [0.45, 0.0]]) for (const sg of [-1, 1]) for (const lift of [1.05, 1.13])
        core.push(surf(a0 + 0.04 + da, sm + 0.02 + sg * w, lift));
      S.push(flat(hull(core), P.cyan));
      // comet head: 8-point white star gem standing proud
      const c0 = surf(a0, sm, 1.14), n = c0.clone().sub(V(Math.sin(a0) * R, cy, Math.cos(a0) * R)).normalize();
      const T = V(Math.cos(a0), 0, -Math.sin(a0)), Bv = new THREE.Vector3().crossVectors(n, T).normalize();
      for (const [rot, arm] of [[0, 0.07], [Math.PI / 4, 0.042]]) {
        const u = T.clone().multiplyScalar(Math.cos(rot)).addScaledVector(Bv, Math.sin(rot));
        const v = Bv.clone().multiplyScalar(Math.cos(rot)).addScaledVector(T, -Math.sin(rot));
        S.push(flat(hull([c0.clone().addScaledVector(u, arm), c0.clone().addScaledVector(u, -arm), c0.clone().addScaledVector(v, arm),
          c0.clone().addScaledVector(v, -arm), c0.clone().addScaledVector(n, 0.03), c0.clone().addScaledVector(n, -0.035)]), P.star));
      }
    }
  }

  // ================= TAIL rising at the back to a big meteor-rock club =================
  const tailPts = [V(0, 0.12, -0.36), V(0, 0.15, -0.48), V(0, 0.27, -0.56), V(0, 0.4, -0.58)];
  C.push(paintTris(scaleTube(curveSamples(tailPts, 7, (t) => 0.1 - 0.025 * t), 8, Math.PI / 2), (c, m) => m.up ? P.indigo : P.indigoS, 0.1, 0.45));
  {
    const M0 = V(0, 0.52, -0.6), MR = 0.17;
    // rock split into 8 chunky octant pieces, pushed apart so a glowing lava core shows through the cracks
    C.push(flat(blob(0, M0, V(MR * 0.88, MR * 0.86, MR * 0.88)), P.lava));
    const dirs = [];
    const NS = 46, ga = Math.PI * (3 - Math.sqrt(5));
    for (let k = 0; k < NS; k++) {
      const y = 1 - (2 * (k + 0.5)) / NS, r = Math.sqrt(1 - y * y), th = ga * k;
      dirs.push(V(Math.cos(th) * r, y, Math.sin(th) * r));
    }
    const SY = 0.08, SZ = -0.1; // split planes slightly off-centre (y, z); x split stays at 0 for symmetry
    const rj = (d) => MR * (0.9 + 0.2 * hash3(Math.abs(d.x).toFixed(2), d.y.toFixed(2), d.z.toFixed(2)));
    for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
      const inOct = (d) => d.x >= -1e-6 && (d.y - SY) * sy >= -1e-6 && (d.z - SZ) * sz >= -1e-6;
      const pts = [];
      const add = (d) => { d = d.clone().normalize(); if (inOct(d)) pts.push(M0.clone().addScaledVector(d, rj(d))); };
      for (const d of dirs) {
        if (!inOct(d)) continue;
        add(d);
        if (d.x < 0.45) add(V(0, d.y, d.z));
        if (Math.abs(d.y - SY) < 0.45) add(V(d.x, SY, d.z));
        if (Math.abs(d.z - SZ) < 0.45) add(V(d.x, d.y, SZ));
      }
      pts.push(M0.clone().add(V(0, SY * MR, SZ * MR)));
      const g = hull(pts);
      const push = V(1, sy, sz).normalize().multiplyScalar(0.03);
      g.translate(push.x, push.y, push.z);
      S.push(paint(g, P.rock, 'y', [0.36, 0.68]));
    }
    // comet flames: wide flat shards streaming back and up from the meteor
    C.push(flat(shard(V(0, 0.6, -0.68), V(0, 0.75, -1), 0.13, 0.32, 4, 0.45), P.cyan));
    S.push(flat(shard(V(0.08, 0.53, -0.7), V(0.55, 0.3, -1), 0.11, 0.26, 4, 0.45), P.cyanD));
    S.push(flat(shard(V(0.07, 0.64, -0.62), V(0.45, 1, -0.5), 0.1, 0.21, 4, 0.45), P.cyanD));
    C.push(flat(shard(V(0, 0.56, -0.7), V(0, 0.3, -1), 0.07, 0.22, 4, 0.45), P.lava));
  }

  // ================= NECK (S-curve) with gold armour belly plates =================
  const neckPts = [V(0, 0.24, -0.05), V(0, 0.4, 0.0), V(0, 0.54, 0.06), V(0, 0.67, 0.02), V(0, 0.78, -0.01), V(0, 0.86, 0.02)];
  const nr = (t) => 0.185 - 0.045 * t;
  C.push(paintTris(scaleTube(curveSamples(neckPts, 12, nr), 10, Math.PI / 2), (c, m) => m.up ? P.indigo : P.indigoS, 0.2, 0.86));
  {
    const fine = curveSamples(neckPts, 26, nr), X = V(1, 0, 0);
    const fr = (i) => {
      const T = new THREE.Vector3().subVectors(fine[Math.min(i + 1, 25)].p, fine[Math.max(i - 1, 0)].p).normalize();
      return new THREE.Vector3().crossVectors(T, X).normalize().negate();
    };
    let n = 0;
    for (let i = 3; i < 22; i += 2, n++) {
      const pts = [];
      for (const j of [i, i + 2]) {
        const s0 = fine[Math.min(j, 25)], F = fr(Math.min(j, 25)), r = s0.rx, w = r * 0.64;
        for (const sx of [-1, 1]) {
          pts.push(s0.p.clone().addScaledVector(X, sx * w).addScaledVector(F, r * 0.8));
          pts.push(s0.p.clone().addScaledVector(X, sx * w * 0.7).addScaledVector(F, r * 1.12));
          pts.push(s0.p.clone().addScaledVector(X, sx * w).addScaledVector(F, r * 0.35));
        }
      }
      const cen = pts.reduce((a, b) => a.add(b), V(0, 0, 0)).divideScalar(pts.length);
      const T = fine[i + 1].p.clone().sub(fine[i].p).normalize();
      for (const q of pts) { const d = q.clone().sub(cen).dot(T); q.addScaledVector(T, -d * 0.14); }
      C.push(paint(hull(pts), n % 3 === 1 ? P.gold : P.belly, 'y', [0.2, 0.85]));
    }
  }

  // ================= STAR HOOD (cobra hood flaring from the neck sides, cupped forward, star outline) =================
  {
    // half-outline stations [x, yTop, yBot]: widest at neck/jaw height, tapering up behind the head
    const st = [[0, 0.99, 0.38], [0.12, 0.97, 0.4], [0.23, 0.9, 0.44], [0.32, 0.8, 0.5], [0.39, 0.71, 0.56], [0.425, 0.645, 0.615]];
    const zc = (x) => -0.11 + 1.15 * x * x;   // cupped forward toward the edges
    const TH = 0.07;
    const strip = (k, z0, z1, inset = 0) => {
      const pts = [];
      for (const [x, yt, yb] of [st[k], st[k + 1]]) {
        const ym = (yt + yb) / 2, xx = x * (1 - inset);
        for (const y of [yt, yb]) for (const dz of [z0, z1])
          pts.push(V(xx, ym + (y - ym) * (1 - inset * 1.4), zc(xx) + dz));
      }
      return hull(pts);
    };
    for (let k = 0; k < st.length - 1; k++) {
      S.push(paint(strip(k, -TH, 0), P.indigoD, 'y', [0.4, 1.0]));
      S.push(paint(strip(k, -0.01, 0.012, 0.1), P.cyan, 'y', [0.42, 1.0]));
    }
    // gold rim along top and bottom edges
    for (let k = 0; k < st.length - 1; k++) for (const e of [1, 2]) {
      const pts = [];
      for (const s0 of [st[k], st[k + 1]]) {
        const x = s0[0], y = s0[e], ym = (s0[1] + s0[2]) / 2, sg = e === 1 ? 1 : -1;
        for (const [ins, dy] of [[0, 0.008], [0.04, -0.03]]) for (const dz of [-TH - 0.006, 0.016])
          pts.push(V(x * (1 - ins * 0.5), y + sg * dy, zc(x * (1 - ins * 0.5)) + dz));
      }
      S.push(paint(hull(pts), P.gold, 'y', [0.4, 1.0]));
    }
    // big star points on the hood edge: flat thick triangular rays (glowing cyan, gold base)
    const ray = (bx, by, dir, w, l, cen) => {
      const d = dir.clone().normalize(), p = V(-d.y, d.x, 0);
      const pts = [];
      for (const dz of [-TH + 0.008, 0.004]) {
        for (const sg of [-1, 1]) { const q = V(bx, by, 0).addScaledVector(p, sg * w); pts.push(V(q.x, q.y, zc(Math.abs(q.x)) + dz)); }
        const t = V(bx, by, 0).addScaledVector(d, l); pts.push(V(t.x, t.y, zc(Math.min(Math.abs(t.x), 0.38)) + dz * 0.4 - 0.01));
      }
      const g = hull(pts); (cen ? C : S).push(flat(g, P.cyanD));
    };
    ray(0, 0.95, V(0, 1, 0), 0.07, 0.17, true);
    ray(0.24, 0.87, V(0.6, 1, 0), 0.075, 0.17);
    ray(0.4, 0.635, V(1, 0.0, 0), 0.085, 0.18);
    ray(0.28, 0.47, V(0.6, -1, 0), 0.07, 0.14);
    // white sparkle stars on the cyan front, cyan stars on the back
    for (const [x, y, r] of [[0.3, 0.66, 0.065], [0.23, 0.83, 0.042], [0.24, 0.5, 0.042], [0.37, 0.7, 0.028]])
      for (const g of starPlate(V(x, y, zc(x) + 0.021), r, r * 0.32, 4, 0.006)) S.push(flat(g, P.star));
    for (const [x, y, r] of [[0.22, 0.67, 0.065], [0.1, 0.85, 0.04], [0.14, 0.48, 0.045], [0.34, 0.62, 0.03]])
      for (const g of starPlate(V(x, y, zc(x) - TH - 0.01), r, r * 0.32, 4, 0.006)) S.push(flat(g, P.cyanD));
    // gold spine ridge down the hood back
    C.push(paint(hull([...cbox(V(0, 0.69, zc(0) - TH - 0.008), 0.03, 0.27, 0.022, 0.01), V(0, 0.92, zc(0) - TH - 0.045), V(0, 0.46, zc(0) - TH - 0.045)]), P.gold, 'y', [0.4, 1.0]));
  }

  // ================= HEAD (big blocky cobra head) =================
  const HCp = [], HSp = [];
  { const C = HCp, S = HSp;
    const H = { y: 0.86, z: 0.04 };
    const FZ = H.z + 0.13;
    C.push(paint(hull([
      ...cbox(V(0, H.y + 0.01, H.z), 0.17, 0.1, 0.13, 0.045),
      ...ring(V(0, H.y + 0.125, H.z - 0.02), 0.12, 0.1, 8, 'y'),
      V(0.14, H.y + 0.11, FZ - 0.012), V(-0.14, H.y + 0.11, FZ - 0.012),
      V(0.185, H.y - 0.06, H.z + 0.02), V(-0.185, H.y - 0.06, H.z + 0.02),
    ]), P.indigo, 'y', [H.y - 0.1, H.y + 0.13]));
    // snout
    C.push(paint(hull([
      ...cbox(V(0, H.y - 0.035, H.z + 0.12), 0.15, 0.05, 0.08, 0.03),
      ...cbox(V(0, H.y - 0.04, H.z + 0.26), 0.11, 0.045, 0.035, 0.025),
    ]), P.indigo, 'y', [H.y - 0.1, H.y + 0.13]));
    // lower jaw (lilac)
    C.push(paint(hull([
      ...cbox(V(0, H.y - 0.115, H.z + 0.06), 0.13, 0.035, 0.1, 0.02),
      ...cbox(V(0, H.y - 0.105, H.z + 0.23), 0.095, 0.03, 0.045, 0.02),
      ...cbox(V(0, H.y - 0.155, H.z + 0.06), 0.09, 0.02, 0.08, 0.015),
    ]), P.belly, 'y', [H.y - 0.16, H.y - 0.08]));
    // mouth line + nostrils
    S.push(flat(hull([V(0, H.y - 0.083, H.z + 0.297), V(0, H.y - 0.075, H.z + 0.297), V(0.1, H.y - 0.08, H.z + 0.255),
      V(0.1, H.y - 0.088, H.z + 0.255), V(0.0, H.y - 0.08, H.z + 0.285)]), P.mouth));
    S.push(flat(hull(cbox(V(0.045, H.y + 0.008, H.z + 0.265), 0.014, 0.006, 0.012, 0.003)), P.mouth));

    // glowing eyes: cyan rim, glowing white almond, black pupil, catchlight
    const E = V(0.085, H.y + 0.06, 0), es = 1.15;
    const sc = (pts, k = es) => pts.map(([u, v]) => [u * k, v * k]);
    const alm = [[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]];
    S.push(flat(hull(plate(sc(alm, 1.38), V(E.x + 0.002, E.y - 0.004, 0), FZ - 0.02, FZ + 0.006)), P.cyan));
    S.push(flat(hull(plate(sc(alm), E, FZ - 0.01, FZ + 0.012)), P.eyeGlow));
    S.push(flat(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
      V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), P.eye));
    S.push(flat(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
      V(E.x + 0.007, E.y + 0.003, 0), FZ + 0.014, FZ + 0.021)), P.white));
    // heavy brow
    S.push(paint(hull([
      V(0.02, E.y + 0.006, FZ + 0.035), V(0.022, E.y + 0.045, FZ + 0.025),
      V(0.16, E.y + 0.044, FZ - 0.0), V(0.16, E.y + 0.068, FZ - 0.015),
      V(0.02, E.y + 0.006, FZ - 0.05), V(0.022, E.y + 0.05, FZ - 0.06),
      V(0.16, E.y + 0.04, FZ - 0.08), V(0.16, E.y + 0.06, FZ - 0.09),
    ]), P.brow, 'y'));
    // ornate gold head armour: crown plate over the cranium with a cyan star gem
    C.push(paint(hull([
      ...cbox(V(0, H.y + 0.128, H.z - 0.01), 0.075, 0.012, 0.1, 0.01),
      V(0, H.y + 0.15, H.z + 0.11), V(0.03, H.y + 0.115, FZ + 0.0), V(-0.03, H.y + 0.115, FZ + 0.0),
    ]), P.gold, 'y', [H.y + 0.1, H.y + 0.16]));
    C.push(flat(hull([V(0, H.y + 0.205, H.z + 0.03), V(0.03, H.y + 0.15, H.z + 0.05), V(-0.03, H.y + 0.15, H.z + 0.05),
      V(0, H.y + 0.15, H.z + 0.08), V(0, H.y + 0.15, H.z + 0.0), V(0, H.y + 0.13, H.z + 0.04)]), P.cyan));
    // gold cheek guards
    S.push(paint(hull([V(0.17, H.y - 0.02, H.z + 0.08), V(0.19, H.y - 0.07, H.z + 0.05), V(0.17, H.y - 0.09, H.z - 0.06),
      V(0.15, H.y + 0.03, H.z - 0.08), V(0.14, H.y - 0.02, H.z + 0.08), V(0.15, H.y - 0.08, H.z - 0.06)]), P.gold, 'y', [H.y - 0.1, H.y + 0.04]));
    // swept-back crest horns (gold)
    for (const [x, y, z, d, l] of [[0.07, 0.12, -0.06, V(0.35, 0.7, -1), 0.13], [0.13, 0.08, -0.07, V(0.7, 0.4, -1), 0.11]])
      S.push(paint(shard(V(x, H.y + y, H.z + z), d, 0.035, l, 4, 0.6), P.gold, 'y', [H.y, H.y + 0.25]));
  }
  const piv = V(0, 0.82, 0.02), HSC = 1.3;
  for (const g of [...HCp, ...HSp]) { g.translate(-piv.x, -piv.y, -piv.z); g.scale(HSC, HSC, HSC); g.translate(piv.x, piv.y, piv.z); }
  return assemble([...C, ...HCp], [...S, ...HSp]);
}

// Comet Cobra (Secret): bright blue faceted cobra standing on a starry coil, wide white comet-patterned hood,
// fierce blocky head, glowing starry/nebula scale patterns, a sparkling comet tail and floating stars.
import { V, THREE, hull, cbox, ring, plate, shard, tube, curveSamples, paint, assemble, hash3 } from '../kit.js';

export const PALETTE = {
  blue:   { i: 0, top: '#52B6FF', bot: '#1663E2' },
  blueD:  { i: 1, top: '#3A93F6', bot: '#0F4AC0' },
  belly:  { i: 2, top: '#F4FBFF', bot: '#C4E2FF' },
  hood:   { i: 3, top: '#FFFFFF', bot: '#E8F0FF' },
  rim:    { i: 4, top: '#2F7FF4', bot: '#1840B4' },
  gold:   { i: 5, top: '#FFF7B8', bot: '#FFC93A', glow: true },
  cyan:   { i: 6, top: '#9FF7FF', bot: '#2FB4FF', glow: true },
  nebula: { i: 7, top: '#E59BFF', bot: '#8A45FF', glow: true },
  star:   { i: 8, top: '#FFFFFF', bot: '#D4F6FF', glow: true },
  eye:    { i: 9, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 10, top: '#FFFFFF', bot: '#F1F1F4' },
  mouth:  { i: 11, top: '#13204A', bot: '#0A1230' },
  brow:   { i: 12, top: '#2A78EE', bot: '#1145B8' },
  tongue: { i: 13, top: '#FF6FA8', bot: '#D82E70' },
  bellyN: { i: 16, top: '#EEF0FF', bot: '#B4B4F2' },
  cometB: { i: 17, top: '#6FE0FF', bot: '#2E9CFF', glow: true },
  goldS:  { i: 18, top: '#FFE04A', bot: '#FFAE1A', glow: true },
  jaw:    { i: 14, top: '#E6F4FF', bot: '#A9D2FF' },
  trail:  { i: 15, top: '#E8FDFF', bot: '#5BC8FF', glow: true },
};
const P = PALETTE;

// ---------- local helpers (copied/adapted from sparring_snake) ----------
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
function coil(cy, R, prof, N) {
  const M = prof.length;
  const P_ = (i, k) => {
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
  for (let k = 0; k < M; k++) {
    for (let i = 0; i < N; i++) {
      let A, B;
      if (k % 2 === 0) { A = [P_(i, k), P_(i + 1, k), P_(i, k + 1)]; B = [P_(i, k + 1), P_(i + 1, k + 1), P_(i + 1, k)]; }
      else { A = [P_(i, k), P_(i + 1, k), P_(i + 1, k + 1)]; B = [P_(i, k + 1), P_(i + 1, k + 1), P_(i, k)]; }
      tri(pos, meta, ...A, outOf(...A), { k, apex: 'up' });
      tri(pos, meta, ...B, outOf(...B), { k, apex: 'down' });
    }
  }
  return finish(pos, meta);
}
function scaleTube(samples, seg, phase, { capStart = 0, capEnd = 0 } = {}) {
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
    rings.push(r); frames.push({ p, T, B });
  }
  const pos = [], meta = [];
  for (let i = 0; i < n - 1; i++) {
    const mid = frames[i].p.clone().add(frames[i + 1].p).multiplyScalar(0.5);
    const front = frames[i].B.clone().add(frames[i + 1].B).multiplyScalar(-0.5).normalize();
    for (let k = 0; k < seg; k++) {
      const k1 = (k + 1) % seg;
      let A, Bt;
      if (i % 2 === 0) { A = [rings[i][k], rings[i][k1], rings[i + 1][k]]; Bt = [rings[i + 1][k], rings[i + 1][k1], rings[i][k1]]; }
      else { A = [rings[i][k], rings[i][k1], rings[i + 1][k1]]; Bt = [rings[i + 1][k], rings[i + 1][k1], rings[i][k]]; }
      for (const t of [A, Bt]) {
        const cen = t[0].clone().add(t[1]).add(t[2]).divideScalar(3);
        const o = cen.clone().sub(mid);
        tri(pos, meta, ...t, o, { i, front: o.clone().normalize().dot(front), side: Math.abs(o.x) / o.length() });
      }
    }
  }
  const cap = (i, bulge, s) => {
    const { p, T } = frames[i];
    const tip = p.clone().addScaledVector(T, bulge * s), o = T.clone().multiplyScalar(s);
    for (let k = 0; k < seg; k++) tri(pos, meta, rings[i][k], rings[i][(k + 1) % seg], tip, o, { i, front: 0, cap: true });
  };
  cap(0, capStart, -1); cap(n - 1, capEnd, 1);
  return finish(pos, meta);
}

// 4-point sparkle star (two crossed diamonds) facing +z in a plane tilted by `tilt` (z -= tilt*x around c.x=0 frame)
function star4(c, r, th, sw, tilt = 0, rot = 0) {
  const out = [];
  const zz = (x) => -tilt * x;
  for (const [a, b] of [[r, r * 0.3], [r * 0.3, r]]) {
    const pts = [];
    for (let k = 0; k < 4; k++) {
      const an = rot + (k * Math.PI) / 2;
      const rr = k % 2 === 0 ? a : b;
      const x = c.x + Math.cos(an) * rr, y = c.y + Math.sin(an) * rr;
      pts.push(V(x, y, c.z + zz(x)));
    }
    const cen = V(c.x, c.y, c.z + zz(c.x));
    pts.push(cen.clone().add(V(0, 0, th)), cen.clone().add(V(0, 0, -th)));
    out.push(paint(hull(pts), sw, 'flat'));
  }
  return out;
}
// 3D floating sparkle (three crossed bipyramids)
function star3(c, r, sw) {
  const out = [];
  const t = r * 0.28;
  out.push(paint(hull([c.clone().add(V(0, r, 0)), c.clone().add(V(0, -r, 0)), c.clone().add(V(t, 0, 0)), c.clone().add(V(-t, 0, 0)), c.clone().add(V(0, 0, t)), c.clone().add(V(0, 0, -t))]), sw, 'y'));
  out.push(paint(hull([c.clone().add(V(r * 0.8, 0, 0)), c.clone().add(V(-r * 0.8, 0, 0)), c.clone().add(V(0, t, 0)), c.clone().add(V(0, -t, 0)), c.clone().add(V(0, 0, t)), c.clone().add(V(0, 0, -t))]), sw, 'y'));
  out.push(paint(hull([c.clone().add(V(0, 0, r * 0.8)), c.clone().add(V(0, 0, -r * 0.8)), c.clone().add(V(0, t, 0)), c.clone().add(V(0, -t, 0)), c.clone().add(V(t, 0, 0)), c.clone().add(V(-t, 0, 0))]), sw, 'y'));
  return out;
}

export function buildGeometry() {
  const C = [], S = [];
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= COIL BASE: starry blue scales, nebula glow teeth, pale belly band =================
  const starry = (c, m, base) => {
    const h = hash3(c.x.toFixed(2), (c.y * 3).toFixed(2), c.z.toFixed(2));
    if (m.apex === 'up' && h > 0.965) return P.cyan;
    if (m.apex === 'down' && h < 0.03) return P.nebula;
    return base;
  };
  const prof0 = [[0.14, 0.035], [0.105, 0.1], [0.02, 0.13], [-0.09, 0.1], [-0.13, 0.01], [-0.1, -0.1], [0.1, -0.13], [0.145, -0.045]];
  C.push(paintTris(coil(0.13, 0.28, prof0, 20), (c, m) => {
    if (m.k === 7) return m.apex === 'up' ? P.nebula : P.blueD;
    if (m.k >= 4 && m.k <= 6) return P.bellyN;
    return starry(c, m, m.apex === 'up' ? P.blue : P.blueD);
  }, 0.0, 0.27));
  const prof1 = [[0.105, 0.025], [0.08, 0.075], [0.01, 0.095], [-0.07, 0.07], [-0.09, 0.0], [-0.06, -0.06], [0.07, -0.08], [0.105, -0.035]];
  C.push(paintTris(coil(0.29, 0.165, prof1, 16), (c, m) => {
    if (m.k === 7 && m.apex === 'up') return P.nebula;
    if (m.k === 6) return P.bellyN;
    return starry(c, m, m.apex === 'up' ? P.blue : P.blueD);
  }, 0.18, 0.39));

  // ================= NECK (upright, cobra-straight) with pale belly plates =================
  const neckPts = [V(0, 0.22, -0.05), V(0, 0.38, 0.0), V(0, 0.52, 0.03), V(0, 0.66, 0.02), V(0, 0.78, 0.0), V(0, 0.86, 0.02)];
  const nr = (t) => 0.13 - 0.025 * t;
  C.push(paintTris(scaleTube(curveSamples(neckPts, 12, nr), 10, Math.PI / 2), (c, m) => {
    if (m.front < -0.75 && m.i % 3 === 1) return P.gold; // glowing dorsal star spots
    return m.i % 2 ? P.blue : P.blueD;
  }, 0.2, 0.85));
  {
    const fine = curveSamples(neckPts, 26, nr), X = V(1, 0, 0);
    const fr = (i) => {
      const T = new THREE.Vector3().subVectors(fine[Math.min(i + 1, 25)].p, fine[Math.max(i - 1, 0)].p).normalize();
      return new THREE.Vector3().crossVectors(T, X).normalize().negate();
    };
    for (let i = 3; i < 22; i += 2) {
      const pts = [];
      for (const [j] of [[i], [i + 2]]) {
        const s0 = fine[Math.min(j, 25)], F = fr(Math.min(j, 25)), r = s0.rx, w = r * 0.62;
        const p = s0.p.clone();
        for (const sx of [-1, 1]) {
          pts.push(p.clone().addScaledVector(X, sx * w).addScaledVector(F, r * 0.82));
          pts.push(p.clone().addScaledVector(X, sx * w * 0.72).addScaledVector(F, r * 1.1));
          pts.push(p.clone().addScaledVector(X, sx * w).addScaledVector(F, r * 0.35));
        }
      }
      const cen = pts.reduce((a, b) => a.add(b), V(0, 0, 0)).divideScalar(pts.length);
      const T = fine[i + 1].p.clone().sub(fine[i].p).normalize();
      for (const q of pts) { const d = q.clone().sub(cen).dot(T); q.addScaledVector(T, -d * 0.14); }
      C.push(paint(hull(pts), P.belly, 'y', [0.2, 0.85]));
    }
  }

  // ================= HOOD: wide flared cobra hood, edges curving forward to frame the neck =================
  // Hood space: u = arc length outward from the centre line, v = height above HC.y, d = offset along the front normal.
  const HC = V(0, 0.655, -0.075);
  const SEG = [0.12, 0.12, 0.11, 0.11], ANG = [0, 0.22, 0.48, 0.85];
  const knots = [{ u: 0, x: 0, z: 0 }];
  for (let j = 0; j < SEG.length; j++) {
    const k = knots[j];
    knots.push({ u: k.u + SEG[j], x: k.x + SEG[j] * Math.cos(ANG[j]), z: k.z + SEG[j] * Math.sin(ANG[j]) });
  }
  const nrm = knots.map((_, j) => {
    const a0 = ANG[Math.max(0, j - 1)], a1 = ANG[Math.min(ANG.length - 1, j)], an = (a0 + a1) / 2;
    const m = 1 / Math.cos((a1 - a0) / 2); // miter so panel thickness stays even
    return [-Math.sin(an) * m, Math.cos(an) * m];
  });
  const map = (u, v, d) => {
    let j = 0; while (j < SEG.length - 1 && u > knots[j + 1].u) j++;
    const t = (u - knots[j].u) / SEG[j];
    const L = (q0, q1) => q0 + (q1 - q0) * t;
    return V(L(knots[j].x, knots[j + 1].x) + d * L(nrm[j][0], nrm[j + 1][0]), HC.y + v,
      HC.z + L(knots[j].z, knots[j + 1].z) + d * L(nrm[j][1], nrm[j + 1][1]));
  };
  // convex clip (Sutherland-Hodgman) of poly against half-plane a*u + b*v <= c
  const clipHP = (poly, a, b, c) => {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const P0 = poly[i], P1 = poly[(i + 1) % poly.length];
      const f0 = a * P0[0] + b * P0[1] - c, f1 = a * P1[0] + b * P1[1] - c;
      if (f0 <= 0) out.push(P0);
      if ((f0 < 0 && f1 > 0) || (f0 > 0 && f1 < 0)) { const t = f0 / (f0 - f1); out.push([P0[0] + (P1[0] - P0[0]) * t, P0[1] + (P1[1] - P0[1]) * t]); }
    }
    return out;
  };
  const clipPoly = (poly, by) => { // by: convex CCW-or-CW polygon
    const cx = by.reduce((s, q) => s + q[0], 0) / by.length, cy = by.reduce((s, q) => s + q[1], 0) / by.length;
    let r = poly;
    for (let i = 0; i < by.length && r.length; i++) {
      const A = by[i], B = by[(i + 1) % by.length];
      let a = B[1] - A[1], b = -(B[0] - A[0]), c = a * A[0] + b * A[1];
      if (a * cx + b * cy - c > 0) { a = -a; b = -b; c = -c; }
      r = clipHP(r, a, b, c);
    }
    return r;
  };
  // emit a hood-space polygon as flat-faced prisms (one per hood panel) between offsets d0..d1
  const hoodPiece = (poly, d0, d1, sw, mode = 'y', clipTo = null, dst = S) => {
    if (clipTo) poly = clipPoly(poly, clipTo);
    for (let j = 0; j < SEG.length; j++) {
      const q = clipHP(clipHP(poly, -1, 0, -knots[j].u), 1, 0, knots[j + 1].u);
      if (q.length < 3) continue;
      const pts = [];
      for (const [u, v] of q) { pts.push(map(u, v, d0)); pts.push(map(u, v, d1)); }
      try { dst.push(paint(hull(pts), sw, mode, [0.33, 0.95])); } catch (e) { /* degenerate sliver */ }
    }
  };
  const hoodOutline = [[0, 0.25], [0.17, 0.25], [0.32, 0.2], [0.42, 0.08], [0.46, -0.04], [0.41, -0.17], [0.24, -0.29], [0, -0.33]];
  const face = hoodOutline.map(([u, v]) => [u * 0.93, v * 0.92 - 0.006]);
  hoodPiece(hoodOutline, -0.05, 0, P.rim);                    // blue rim core / blue back
  hoodPiece(face, -0.008, 0.012, P.hood);                     // white front face
  // comets: glowing gold 4-point head + long tapering streak sweeping outward and up
  const star2d = (u, v, r, w) => [[[u + r, v], [u, v + w], [u - r, v], [u, v - w]], [[u + w, v], [u, v + r], [u - w, v], [u, v - r]]];
  const comet = (u, v, s, dir, len, front) => {
    const d = new THREE.Vector2(dir[0], dir[1]).normalize(), n = new THREE.Vector2(-d.y, d.x);
    const at = (k, w) => [u + d.x * k + n.x * w, v + d.y * k + n.y * w];
    const streakOut = [at(-s * 0.3, s * 0.95), at(len * 0.45, s * 0.7), at(len, s * 0.1), at(len, -s * 0.1), at(len * 0.45, -s * 0.7), at(-s * 0.3, -s * 0.95)];
    const streakIn = [at(0, s * 0.5), at(len * 0.55, s * 0.26), at(len * 0.85, 0), at(len * 0.55, -s * 0.26), at(0, -s * 0.5)];
    if (front) {
      hoodPiece(streakOut, 0.016, 0.024, P.cometB, 'flat', face);
      hoodPiece(streakIn, 0.02, 0.03, P.cyan, 'flat', face);
      for (const sp of star2d(u, v, s * 1.3, s * 0.4)) hoodPiece(sp, 0.026, 0.04, P.goldS, 'flat', face);
    } else {
      hoodPiece(streakOut.map(([a, b]) => [a, b]), -0.062, -0.054, P.cyan, 'flat', hoodOutline.map(([a, b]) => [a * 0.92, b * 0.92]));
      for (const sp of star2d(u, v, s * 1.15, s * 0.36)) hoodPiece(sp, -0.07, -0.058, P.gold, 'flat');
    }
  };
  for (const f of [true, false]) {
    comet(0.2, -0.21, 0.06, [0.5, 1], 0.24, f);
    comet(0.29, -0.02, 0.065, [0.42, 1], 0.22, f);
    comet(0.37, -0.19, 0.038, [0.3, 1], 0.12, f);
  }
  // big centre star on the hood back (spectacle mark), centre line
  for (const sp of star2d(0, 0.06, 0.09, 0.03)) hoodPiece(clipHP(sp, -1, 0, 0), -0.074, -0.056, P.gold, 'flat');
  // tiny dot stars on the hood
  for (const [u, v, r] of [[0.15, -0.27, 0.022], [0.37, 0.1, 0.02], [0.27, -0.12, 0.016], [0.26, 0.17, 0.018]])
    for (const sp of star2d(u, v, r, r * 0.33)) hoodPiece(sp, 0.016, 0.026, P.star, 'flat', face);
  for (const [u, v, r] of [[0.1, -0.15, 0.022], [0.3, 0.14, 0.02], [0.13, 0.2, 0.02], [0.27, -0.13, 0.016]])
    for (const sp of star2d(u, v, r, r * 0.33)) hoodPiece(sp, -0.064, -0.054, P.star, 'flat');

  // ================= HEAD (big, wide, blocky cobra head) =================
  const c0 = C.length, s0 = S.length;
  const H = { y: 0.93, z: 0.06 };
  const FZ = H.z + 0.15;
  C.push(paint(hull([
    ...cbox(V(0, H.y + 0.01, H.z), 0.2, 0.11, 0.15, 0.05),
    ...ring(V(0, H.y + 0.13, H.z - 0.02), 0.14, 0.11, 8, 'y'),
    V(0.165, H.y + 0.12, FZ - 0.012), V(-0.165, H.y + 0.12, FZ - 0.012),
    V(0.21, H.y - 0.06, H.z + 0.02), V(-0.21, H.y - 0.06, H.z + 0.02),
  ]), P.blue, 'y', [H.y - 0.1, H.y + 0.14]));
  // snout
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.035, H.z + 0.13), 0.17, 0.055, 0.09, 0.03),
    ...cbox(V(0, H.y - 0.04, H.z + 0.28), 0.13, 0.048, 0.04, 0.025),
  ]), P.blue, 'y', [H.y - 0.1, H.y + 0.14]));
  // lower jaw (pale)
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.12, H.z + 0.06), 0.15, 0.035, 0.11, 0.02),
    ...cbox(V(0, H.y - 0.11, H.z + 0.25), 0.11, 0.03, 0.05, 0.02),
    ...cbox(V(0, H.y - 0.16, H.z + 0.06), 0.1, 0.02, 0.09, 0.015),
  ]), P.jaw, 'y', [H.y - 0.17, H.y - 0.08]));
  // forked tongue
  C.push(flat(hull([...cbox(V(0, H.y - 0.09, H.z + 0.29), 0.02, 0.007, 0.03, 0.003),
    ...cbox(V(0, H.y - 0.115, H.z + 0.36), 0.018, 0.007, 0.015, 0.003)]), P.tongue));
  S.push(flat(hull([...cbox(V(0.01, H.y - 0.115, H.z + 0.36), 0.01, 0.006, 0.012, 0.002),
    ...cbox(V(0.03, H.y - 0.15, H.z + 0.41), 0.008, 0.006, 0.01, 0.002)]), P.tongue));
  // nostrils
  S.push(flat(hull(cbox(V(0.05, H.y + 0.01, H.z + 0.32), 0.015, 0.006, 0.006, 0.003)), P.mouth));
  // fierce eyes
  const E = V(0.095, H.y + 0.065, 0), es = 1.2;
  const sc = (pts) => pts.map(([u, v]) => [u * es, v * es]);
  S.push(flat(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.01, FZ + 0.012)), P.white));
  S.push(flat(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), P.eye));
  S.push(flat(hull(plate([[-0.009, -0.009], [0.009, -0.009], [0.009, 0.009], [-0.009, 0.009]],
    V(E.x + 0.008, E.y + 0.004, 0), FZ + 0.014, FZ + 0.021)), P.white));
  // heavy brow slanting down to the centre
  S.push(paint(hull([
    V(0.02, E.y + 0.006, FZ + 0.035), V(0.022, E.y + 0.048, FZ + 0.025),
    V(0.18, E.y + 0.046, FZ - 0.0), V(0.18, E.y + 0.072, FZ - 0.015),
    V(0.02, E.y + 0.006, FZ - 0.05), V(0.022, E.y + 0.052, FZ - 0.06),
    V(0.18, E.y + 0.042, FZ - 0.08), V(0.18, E.y + 0.064, FZ - 0.09),
  ]), P.brow, 'y'));
  // glowing star crest on the crown
  C.push(...star4(V(0, 0, 0), 0.075, 0.016, P.gold, 0).map((g) => {
    g.rotateX(-Math.PI / 2 + 0.3); g.translate(0, H.y + 0.145, H.z - 0.01); return g;
  }));

  { const piv = V(0, 0.84, 0.04), K = 1.13;
    for (const g of [...C.slice(c0), ...S.slice(s0)]) { g.translate(0, -piv.y, -piv.z); g.scale(K, K, K); g.translate(0, piv.y, piv.z); } }

  // ================= COMET TAIL: rising from the back of the coil, glowing nucleus + trailing shards =================
  const tailPts = [V(0, 0.1, -0.3), V(0, 0.14, -0.5), V(0, 0.3, -0.64), V(0, 0.52, -0.68), V(0, 0.7, -0.64)];
  C.push(paintTris(scaleTube(curveSamples(tailPts, 9, (t) => 0.112 - 0.06 * t), 8, Math.PI / 2, { capEnd: 0.02 }),
    (c, m) => (m.front > 0.5 ? P.belly : (m.i % 2 ? P.blue : P.blueD)), 0.05, 0.6));
  const N0 = V(0, 0.77, -0.62);
  C.push(paint(hull([...ring(N0, 0.1, 0.1, 8, 'y'), N0.clone().add(V(0, 0.12, 0.0)), N0.clone().add(V(0, -0.11, 0.0)),
    ...ring(N0.clone().add(V(0, 0.055, 0)), 0.072, 0.072, 8, 'y', 0), ...ring(N0.clone().add(V(0, -0.055, 0)), 0.072, 0.072, 8, 'y', 0)]), P.gold, 'y', [N0.y - 0.1, N0.y + 0.1]));
  // trailing comet shards streaming back and up (comet diving forward)
  C.push(flat(shard(N0.clone().add(V(0, 0.01, -0.05)), V(0, 0.5, -1), 0.065, 0.3, 4, 0.8), P.trail));
  S.push(flat(shard(N0.clone().add(V(0.04, 0.03, -0.03)), V(0.55, 0.75, -0.9), 0.05, 0.22, 4, 0.8), P.trail));
  S.push(flat(shard(N0.clone().add(V(0.045, -0.01, -0.03)), V(0.65, 0.05, -1), 0.045, 0.19, 4, 0.8), P.cyan));
  C.push(flat(shard(N0.clone().add(V(0, 0.06, -0.02)), V(0, 1, -0.4), 0.05, 0.22, 4, 0.8), P.cyan));
  C.push(flat(shard(N0.clone().add(V(0, -0.04, -0.05)), V(0, 0.0, -1), 0.045, 0.2, 4, 0.8), P.nebula));
  S.push(flat(shard(N0.clone().add(V(0.03, 0.05, -0.04)), V(0.25, 1, -0.7), 0.035, 0.17, 4, 0.8), P.nebula));
  // sparkle points on the nucleus
  C.push(flat(shard(N0.clone().add(V(0, -0.05, 0.02)), V(0, -0.4, 1), 0.018, 0.06), P.star));
  S.push(flat(shard(N0.clone().add(V(0.05, 0, 0.01)), V(1, -0.2, 0.4), 0.016, 0.05), P.star));
  // floating sparkles along the comet trail
  C.push(...star3(V(0, 1.12, -0.86), 0.045, P.star));
  S.push(...star3(V(0.2, 0.98, -0.86), 0.034, P.cyan));
  S.push(...star3(V(0.12, 0.74, -0.95), 0.03, P.gold));

  // ================= FLOATING STARS around the hood =================
  S.push(...star3(V(0.47, 0.92, 0.12), 0.055, P.gold));
  S.push(...star3(V(0.46, 0.46, 0.14), 0.04, P.star));

  return assemble(C, S);
}

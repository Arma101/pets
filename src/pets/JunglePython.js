// Jungle Python: heavy dark-green python on a thick symmetric coil, neck raised, broad blocky head,
// bold yellow diamond pattern along the back, cream belly, leafy vine wound over the coil, carved jade forehead gem.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  green:  { i: 0, top: '#3A8431', bot: '#1E4D1A' },
  greenS: { i: 1, top: '#31742A', bot: '#194216' },
  greenD: { i: 2, top: '#2F6B2A', bot: '#1A4217' },
  dia:    { i: 3, top: '#FFE14A', bot: '#E6AA16' },
  diaRim: { i: 4, top: '#1D3A19', bot: '#122811' },
  belly:  { i: 5, top: '#FFF3C4', bot: '#EBCF82' },
  jade:   { i: 6, top: '#8DF5C8', bot: '#1FA877' },
  jadeD:  { i: 7, top: '#3FCB98', bot: '#0F7656' },
  leaf:   { i: 8, top: '#9BE04E', bot: '#3F9E2A' },
  vine:   { i: 9, top: '#7E8A35', bot: '#4C5520' },
  tongue: { i: 10, top: '#F2434A', bot: '#B3141F' },
  eye:    { i: 11, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 12, top: '#FFFFFF', bot: '#F1F1F4' },
  mouth:  { i: 13, top: '#3A1E14', bot: '#22100A' },
  brow:   { i: 14, top: '#2C6627', bot: '#1A4517' },
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

// elliptical cross-section profile (even count); angle 0 = outward, PI/2 = up. Bottom flattened.
function ellProf(M, rh, rv, a0, floor) {
  const out = [];
  for (let k = 0; k < M; k++) {
    const a = a0 + (2 * Math.PI * k) / M;
    out.push([Math.cos(a) * rh, Math.max(-floor, Math.sin(a) * rv)]);
  }
  return out;
}

// Coil ring with a diamond (antiprism) scale grid. Diamond(i,k) = strip k 'down' i + strip k+1 'up' i.
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
      if (k % 2 === 0) {
        A = [P_(i, k), P_(i + 1, k), P_(i, k + 1)];
        B = [P_(i, k + 1), P_(i + 1, k + 1), P_(i + 1, k)];
      } else {
        A = [P_(i, k), P_(i + 1, k), P_(i + 1, k + 1)];
        B = [P_(i, k + 1), P_(i + 1, k + 1), P_(i, k)];
      }
      tri(pos, meta, ...A, outOf(...A), { k, i, apex: 'up' });
      tri(pos, meta, ...B, outOf(...B), { k, i, apex: 'down' });
    }
  }
  return finish(pos, meta);
}

// Tube with antiprism rings. Diamond(i,k) = strip i 'B' k + strip i+1 'A' k.
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
      if (i % 2 === 0) {
        A = [rings[i][k], rings[i][k1], rings[i + 1][k]];
        Bt = [rings[i + 1][k], rings[i + 1][k1], rings[i][k1]];
      } else {
        A = [rings[i][k], rings[i][k1], rings[i + 1][k1]];
        Bt = [rings[i + 1][k], rings[i + 1][k1], rings[i][k]];
      }
      for (const [t, ty] of [[A, 'A'], [Bt, 'B']]) {
        const cen = t[0].clone().add(t[1]).add(t[2]).divideScalar(3);
        const o = cen.clone().sub(mid);
        tri(pos, meta, ...t, o, { i, k, ty, front: o.clone().normalize().dot(front) });
      }
    }
  }
  const cap = (i, bulge, s) => {
    const { p, T } = frames[i];
    const tip = p.clone().addScaledVector(T, bulge * s), o = T.clone().multiplyScalar(s);
    for (let k = 0; k < seg; k++) tri(pos, meta, rings[i][k], rings[i][(k + 1) % seg], tip, o, { i, k: -1, front: 0 });
  };
  cap(0, capStart, -1); cap(n - 1, capEnd, 1);
  return finish(pos, meta);
}

// faceted leaf lying on a surface: base, direction (in tangent plane), surface normal
function leaf(base, dir, nrm, len, w) {
  const d = dir.clone().normalize();
  const n = nrm.clone().addScaledVector(d, -nrm.dot(d)).normalize();
  const s = new THREE.Vector3().crossVectors(d, n).normalize();
  const at = (u, v, h) => base.clone().addScaledVector(d, u * len).addScaledVector(s, v * w).addScaledVector(n, h);
  return hull([
    at(0, 0, 0.004), at(1, 0, 0.03),
    at(0.4, 1, 0.012), at(0.4, -1, 0.012), at(0.72, 0.6, 0.022), at(0.72, -0.6, 0.022),
    at(0.45, 0, 0.026), at(0.45, 0, -0.002),
  ]);
}

export function buildGeometry() {
  const C = [], S = [];
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= COIL BASE: two thick stacked rings =================
  const L = { cy: 0.135, R: 0.3, rh: 0.17, rv: 0.15, floor: 0.12, N: 20 };
  const profL = ellProf(10, L.rh, L.rv, -0.35, L.floor);
  const isDia = (m, k0, par) =>
    ((m.k === k0 && m.apex === 'down') || (m.k === k0 + 1 && m.apex === 'up')) && ((m.i + 1) % 2 === par);
  C.push(paintTris(coil(L.cy, L.R, profL, L.N), (c, m) => {
    if (isDia(m, 0, 0) || isDia(m, 2, 1)) return P.dia;
    if (m.k >= 5 && m.k <= 8) return P.belly;
    if (m.k === 9) return m.apex === 'up' ? P.greenS : P.belly;
    return m.apex === 'up' ? P.green : P.greenS;
  }, 0.0, 0.29));

  const U = { cy: 0.335, R: 0.18, rh: 0.13, rv: 0.11, floor: 0.11, N: 16 };
  const profU = ellProf(10, U.rh, U.rv, -0.35, U.floor);
  C.push(paintTris(coil(U.cy, U.R, profU, U.N), (c, m) => {
    if (isDia(m, 0, 0) || isDia(m, 2, 1)) return P.dia;
    if (m.k >= 5 && m.k <= 8) return P.belly;
    return m.apex === 'up' ? P.green : P.greenS;
  }, 0.22, 0.45));

  // ================= VINE wound over the lower coil (S half, mirrored) =================
  {
    const surf = (phi, psi, off) => {
      const rad = L.R + Math.cos(psi) * (L.rh + off);
      return V(Math.sin(phi) * rad, L.cy + Math.sin(psi) * (L.rv + off), Math.cos(phi) * rad);
    };
    const normal = (phi, psi) => {
      const nr = Math.cos(psi) / L.rh, ny = Math.sin(psi) / L.rv;
      return V(Math.sin(phi) * nr, ny, Math.cos(phi) * nr).normalize();
    };
    const psiOf = (phi) => 0.74 + 0.46 * Math.cos(5 * phi);
    const pts = [];
    const NS = 34;
    for (let j = 0; j < NS; j++) {
      const phi = (Math.PI * j) / (NS - 1);
      pts.push({ p: surf(phi, psiOf(phi), 0.006), rx: 0.016, ry: 0.016 });
    }
    S.push(paint(tube(pts, { seg: 6, ref: V(0, 1, 0), phase: Math.PI / 2 }), P.vine, 'y', [0.1, 0.3]));
    // leaf clusters at the low turns of the vine, single leaves at the high turns
    const L_ = (phi, dirF, ln, w, lift = 0.012) => {
      const psi = psiOf(phi), b = surf(phi, psi, lift), n = normal(phi, psi);
      const tang = V(Math.cos(phi), 0, -Math.sin(phi));
      const down = V(-Math.sin(phi) * Math.sin(psi), Math.cos(psi), -Math.cos(phi) * Math.sin(psi)).negate();
      S.push(paint(leaf(b, dirF(tang, down), n, ln, w), P.leaf, 'y', [0.02, 0.3]));
    };
    for (const phi of [Math.PI / 5, 3 * Math.PI / 5, Math.PI]) {
      L_(phi, (t, d) => t.clone().multiplyScalar(0.9).add(d.clone().multiplyScalar(0.6)), 0.15, 0.055);
      if (phi < 3) L_(phi, (t, d) => t.clone().multiplyScalar(-0.9).add(d.clone().multiplyScalar(0.6)), 0.13, 0.05, 0.016);
      L_(phi, (t, d) => d.clone().add(t.clone().multiplyScalar(phi > 3 ? 0.55 : 0.15)), 0.11, 0.045, 0.02);
    }
    for (const phi of [2 * Math.PI / 5, 4 * Math.PI / 5]) {
      L_(phi, (t, d) => t.clone().add(d.clone().multiplyScalar(-0.2)), 0.12, 0.045);
    }
    L_(0.0, (t, d) => t.clone().add(d.clone().multiplyScalar(0.3)), 0.12, 0.045);
  }

  // ================= NECK (S-curve) with dorsal + flank diamonds and cream belly plates =================
  const neckPts = [V(0, 0.24, -0.13), V(0, 0.38, -0.115), V(0, 0.5, -0.05), V(0, 0.6, 0.05), V(0, 0.7, 0.11), V(0, 0.79, 0.11), V(0, 0.86, 0.1)];
  const nr = (t) => 0.19 - 0.045 * t, nry = (t) => 0.165 - 0.035 * t;
  const NN = 14;
  const neckS = curveSamples(neckPts, NN, nr, nry);
  C.push(paintTris(scaleTube(neckS, 12, Math.PI / 2), (c, m) => {
    const d = (k, r) => m.k === k && ((m.ty === 'B' && m.i % 4 === r && m.i < NN - 2) || (m.ty === 'A' && (m.i - 1) % 4 === r && m.i > 0));
    if (d(11, 2)) return P.dia;
    if (d(2, 0) || d(8, 0)) return P.dia;
    return P.green;
  }, 0.2, 0.86));
  {
    const fine = curveSamples(neckPts, 26, nr, nry), X = V(1, 0, 0);
    const fr = (i) => {
      const T = new THREE.Vector3().subVectors(fine[Math.min(i + 1, 25)].p, fine[Math.max(i - 1, 0)].p).normalize();
      return new THREE.Vector3().crossVectors(T, X).normalize().negate();
    };
    // jade band (dark-jade rims, proud jade centre) where the neck leaves the coil
    let bi = 0;
    for (let i = 0; i < 26; i++) if (Math.abs(fine[i].p.y - 0.455) < Math.abs(fine[bi].p.y - 0.455)) bi = i;
    {
      const s0 = fine[bi], T = fine[bi + 1].p.clone().sub(fine[bi - 1].p).normalize();
      const B = new THREE.Vector3().crossVectors(T, X).normalize(), A = new THREE.Vector3().crossVectors(T, B).normalize();
      const band = (off, h, n) => {
        const pts = [];
        for (const dt of [-h, h]) for (let k = 0; k < n; k++) {
          const th = Math.PI / 2 + (2 * Math.PI * k) / n;
          pts.push(s0.p.clone().addScaledVector(T, dt).addScaledVector(A, Math.cos(th) * (s0.rx + off)).addScaledVector(B, Math.sin(th) * (s0.ry + off)));
        }
        return hull(pts);
      };
      C.push(paint(band(0.008, 0.026, 12), P.jadeD, 'y'));
      C.push(paint(band(0.013, 0.014, 12), P.jade, 'y'));
    }
    // 5 chunky shingled belly scutes following the curve, narrower going up, small green gaps between
    const FN = 101, f2 = curveSamples(neckPts, FN, nr, nry);
    const fr2 = (j) => {
      const T = new THREE.Vector3().subVectors(f2[Math.min(j + 1, FN - 1)].p, f2[Math.max(j - 1, 0)].p).normalize();
      return { T, F: new THREE.Vector3().crossVectors(T, X).normalize().negate() };
    };
    const a0 = Math.round(((bi + 4.2) / 25) * (FN - 1)), a1 = 97, step = (a1 - a0) / 5;
    for (let n = 0; n < 5; n++) {
      const i0 = Math.round(a0 + n * step), i1 = Math.round(a0 + (n + 1) * step) - 2;
      const im = Math.round((i0 + i1) / 2);
      const pts = [];
      for (const [j, th, wl] of [[i0, 1.17, 1.0], [im, 1.11, 0.96], [i1, 1.03, 0.9]]) {
        const s0 = f2[j], { F } = fr2(j), r = s0.ry, w = s0.rx * (0.68 - 0.05 * n) * wl;
        const p = s0.p.clone();
        for (const sx of [-1, 1]) {
          pts.push(p.clone().addScaledVector(X, sx * w).addScaledVector(F, r * (th - 0.28)));
          pts.push(p.clone().addScaledVector(X, sx * w * 0.7).addScaledVector(F, r * th));
          pts.push(p.clone().addScaledVector(X, sx * w * 0.95).addScaledVector(F, r * 0.3));
        }
      }
      C.push(paint(hull(pts), P.belly, 'y', [0.3, 0.86]));
    }
  }

  // ================= HEAD: broad, blocky python head =================
  const HC = [], HS = [];
  { const C = HC, S = HS;
  const H = { y: 0.86, z: 0.04 };
  const FZ = H.z + 0.13;
  // cranium: wide at the back (jaw muscles), flat top
  C.push(paint(hull([
    ...cbox(V(0, H.y + 0.0, H.z - 0.01), 0.2, 0.1, 0.13, 0.05),
    ...ring(V(0, H.y + 0.115, H.z - 0.02), 0.14, 0.11, 8, 'y'),
    V(0.15, H.y + 0.1, FZ - 0.01), V(-0.15, H.y + 0.1, FZ - 0.01),
    V(0.21, H.y - 0.05, H.z - 0.04), V(-0.21, H.y - 0.05, H.z - 0.04),
    V(0.195, H.y - 0.1, H.z + 0.0), V(-0.195, H.y - 0.1, H.z + 0.0),
  ]), P.green, 'y', [H.y - 0.1, H.y + 0.12]));
  // broad blunt snout
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.03, H.z + 0.12), 0.17, 0.055, 0.08, 0.03),
    ...cbox(V(0, H.y - 0.04, H.z + 0.265), 0.13, 0.045, 0.04, 0.028),
    V(0.165, H.y - 0.09, H.z + 0.1), V(-0.165, H.y - 0.09, H.z + 0.1),
    V(0.12, H.y - 0.088, H.z + 0.27), V(-0.12, H.y - 0.088, H.z + 0.27),
  ]), P.green, 'y', [H.y - 0.1, H.y + 0.12]));
  // lower jaw (cream)
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.115, H.z + 0.04), 0.14, 0.035, 0.11, 0.02),
    ...cbox(V(0, H.y - 0.105, H.z + 0.235), 0.092, 0.03, 0.045, 0.02),
    ...cbox(V(0, H.y - 0.155, H.z + 0.05), 0.09, 0.02, 0.08, 0.015),
  ]), P.belly, 'y', [H.y - 0.16, H.y - 0.08]));
  // forked tongue
  C.push(flat(hull([...cbox(V(0, H.y - 0.085, H.z + 0.27), 0.02, 0.007, 0.03, 0.003),
    ...cbox(V(0, H.y - 0.11, H.z + 0.35), 0.018, 0.007, 0.015, 0.003)]), P.tongue));
  S.push(flat(hull([...cbox(V(0.01, H.y - 0.11, H.z + 0.35), 0.009, 0.006, 0.011, 0.002),
    ...cbox(V(0.03, H.y - 0.145, H.z + 0.395), 0.008, 0.006, 0.01, 0.002)]), P.tongue));
  // nostrils
  S.push(flat(hull(cbox(V(0.05, H.y + 0.007, H.z + 0.265), 0.015, 0.006, 0.013, 0.003)), P.mouth));
  // heat pits along the upper lip (python detail)
  for (const z of [0.2, 0.15, 0.1]) {
    const x = z > 0.18 ? 0.135 : 0.172;
    S.push(flat(hull(cbox(V(x, H.y - 0.06, H.z + z), 0.006, 0.01, 0.012, 0.003)), P.mouth));
  }

  // fierce eyes
  const E = V(0.092, H.y + 0.055, 0), es = 1.15;
  const sc = (pts) => pts.map(([u, v]) => [u * es, v * es]);
  S.push(flat(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.01, FZ + 0.012)), P.white));
  S.push(flat(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), P.eye));
  S.push(flat(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.007, E.y + 0.003, 0), FZ + 0.014, FZ + 0.021)), P.white));
  // heavy brow
  S.push(paint(hull([
    V(0.022, E.y + 0.006, FZ + 0.038), V(0.024, E.y + 0.048, FZ + 0.028),
    V(0.175, E.y + 0.046, FZ - 0.0), V(0.175, E.y + 0.072, FZ - 0.015),
    V(0.022, E.y + 0.006, FZ - 0.05), V(0.024, E.y + 0.052, FZ - 0.06),
    V(0.175, E.y + 0.042, FZ - 0.08), V(0.175, E.y + 0.064, FZ - 0.09),
  ]), P.brow, 'y'));

  // carved jade gem on the forehead (bevelled hexagon in a darker jade setting), tilted to face forward
  {
    const gc = V(0, H.y + 0.118, H.z + 0.07), O = V(0, 0, 0);
    const rim = hull([...ring(V(0, -0.02, 0), 0.07, 0.06, 6, 'y', 0), ...ring(V(0, 0.012, 0), 0.066, 0.056, 6, 'y', 0)]);
    const gem = hull([...ring(V(0, 0.01, 0), 0.054, 0.045, 6, 'y', 0), ...ring(V(0, 0.036, 0), 0.03, 0.025, 6, 'y', 0), V(0, 0.043, 0.003)]);
    for (const [g, sw] of [[rim, P.jadeD], [gem, P.jade]]) {
      g.rotateX(0.5); g.translate(gc.x, gc.y, gc.z);
      C.push(paint(g, sw, 'y'));
    }
  }
  // yellow diamond plates on the crown and the back of the head
  {
    const dia = (c0, up, fwd, a, b) => {
      const side = new THREE.Vector3().crossVectors(up, fwd).normalize();
      const at = (u, v, h) => c0.clone().addScaledVector(fwd, u).addScaledVector(side, v).addScaledVector(up, h);
      return flat(hull([at(a, 0, 0), at(-a, 0, 0), at(0, b, 0), at(0, -b, 0),
        at(a * 0.8, 0, -0.02), at(-a * 0.8, 0, -0.02), at(0, b * 0.8, -0.02), at(0, -b * 0.8, -0.02),
        at(a * 0.55, 0, 0.007), at(-a * 0.55, 0, 0.007), at(0, b * 0.55, 0.007), at(0, -b * 0.55, 0.007)]), P.dia);
    };
    C.push(dia(V(0, H.y + 0.119, H.z - 0.075), V(0, 1, 0), V(0, 0, 1), 0.045, 0.04));
    C.push(dia(V(0, H.y + 0.035, H.z - 0.144), V(0, 0, -1), V(0, 1, 0), 0.045, 0.04));
  }
  }
  const piv = V(0, 0.8, 0.02), HSC = 1.22;
  for (const g of [...HC, ...HS]) { g.translate(-piv.x, -piv.y, -piv.z); g.scale(HSC, HSC, HSC); g.translate(piv.x, piv.y, piv.z + 0.08); }
  return assemble([...C, ...HC], [...S, ...HS]);
}

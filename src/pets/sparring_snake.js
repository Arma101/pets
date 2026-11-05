// Sparring Snake: chunky faceted green snake resting on a symmetric coil, S-curved neck, blocky fierce head.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  green:  { i: 0, top: '#43D46C', bot: '#0E8A3C' },
  greenD: { i: 1, top: '#2FBF5A', bot: '#0A6E31' },
  cream:  { i: 2, top: '#FFF4B8', bot: '#FFE07A' },
  greenS: { i: 10, top: '#3CC864', bot: '#0C7F37' },
  belly:  { i: 3, top: '#FFE680', bot: '#EDBB3A' },
  gold:   { i: 4, top: '#FFD83D', bot: '#E39A12' },
  tongue: { i: 5, top: '#F2434A', bot: '#B3141F' },
  eye:    { i: 6, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 7, top: '#FFFFFF', bot: '#F1F1F4' },
  mouth:  { i: 8, top: '#3A1E14', bot: '#22100A' },
  brow:   { i: 9, top: '#2CB556', bot: '#0D7434' },
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
// per-triangle swatch choice; gradient by world height inside [lo, hi]
function paintTris(g, pick, lo, hi) {
  const p = g.attributes.position, uv = [];
  const meta = g.userData.meta || [];
  const a = V(0, 0, 0), b = V(0, 0, 0), c = V(0, 0, 0);
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    const cen = a.clone().add(b).add(c).divideScalar(3);
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const sw = pick(cen, n, meta[i / 3] || {});
    for (const v of [a, b, c]) uv.push(...swUV(sw, 1 - (v.y - lo) / Math.max(1e-6, hi - lo)));
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.meta;
  return g;
}

// Coil ring with a diamond (antiprism) scale grid: cross-section profile [[dr, dy], ...] (even count),
// odd levels are shifted half a step around so strips form up/down pointing triangles.
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
        A = [P_(i, k), P_(i + 1, k), P_(i, k + 1)];          // two on k, apex on k+1
        B = [P_(i, k + 1), P_(i + 1, k + 1), P_(i + 1, k)];  // two on k+1, apex on k
      } else {
        A = [P_(i, k), P_(i + 1, k), P_(i + 1, k + 1)];
        B = [P_(i, k + 1), P_(i + 1, k + 1), P_(i, k)];
      }
      tri(pos, meta, ...A, outOf(...A), { k, apex: 'up' });
      tri(pos, meta, ...B, outOf(...B), { k, apex: 'down' });
    }
  }
  return finish(pos, meta);
}

// Tube with antiprism rings (odd rings shifted half a step) along samples; frame A = -x for curves in the YZ plane.
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
    const front = frames[i].B.clone().add(frames[i + 1].B).multiplyScalar(-0.5).normalize(); // -B = belly side
    for (let k = 0; k < seg; k++) {
      const k1 = (k + 1) % seg;
      let A, Bt;
      if (i % 2 === 0) { // ring i unshifted, ring i+1 shifted +half
        A = [rings[i][k], rings[i][k1], rings[i + 1][k]];
        Bt = [rings[i + 1][k], rings[i + 1][k1], rings[i][k1]];
      } else {
        A = [rings[i][k], rings[i][k1], rings[i + 1][k1]];
        Bt = [rings[i + 1][k], rings[i + 1][k1], rings[i][k]];
      }
      for (const t of [A, Bt]) {
        const cen = t[0].clone().add(t[1]).add(t[2]).divideScalar(3);
        const o = cen.clone().sub(mid);
        tri(pos, meta, ...t, o, { i, front: o.clone().normalize().dot(front) });
      }
    }
  }
  const cap = (i, bulge, s) => {
    const { p, T } = frames[i];
    const tip = p.clone().addScaledVector(T, bulge * s), o = T.clone().multiplyScalar(s);
    for (let k = 0; k < seg; k++) tri(pos, meta, rings[i][k], rings[i][(k + 1) % seg], tip, o, { i, front: 0 });
  };
  cap(0, capStart, -1); cap(n - 1, capEnd, 1);
  return finish(pos, meta);
}

export function buildGeometry() {
  const C = [], S = [];
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= COIL BASE (two stacked closed rings) =================
  // profile: k0 outer-upper ... k7 outer-lower; strip k7->k0 = gold teeth, k6->k7 = cream band
  const prof0 = [[0.14, 0.035], [0.105, 0.1], [0.02, 0.13], [-0.09, 0.1], [-0.13, 0.01], [-0.1, -0.1], [0.1, -0.13], [0.145, -0.045]];
  C.push(paintTris(coil(0.13, 0.28, prof0, 20), (c, n, m) => {
    if (m.k === 7) return m.apex === 'up' ? P.gold : P.green;
    if (m.k >= 4 && m.k <= 6) return P.cream;
    return m.apex === 'up' ? P.green : P.greenS;
  }, 0.0, 0.27));
  const prof1 = [[0.105, 0.025], [0.08, 0.075], [0.01, 0.095], [-0.07, 0.07], [-0.09, 0.0], [-0.06, -0.06], [0.07, -0.08], [0.105, -0.035]];
  C.push(paintTris(coil(0.29, 0.165, prof1, 16), (c, n, m) => {
    if (m.k === 7 && m.apex === 'up') return P.gold;
    if (m.k === 6) return P.cream;
    return m.apex === 'up' ? P.green : P.greenS;
  }, 0.18, 0.39));

  // ================= NECK (S-curve in the YZ plane) with raised belly plates =================
  const neckPts = [V(0, 0.22, -0.06), V(0, 0.38, 0.0), V(0, 0.52, 0.065), V(0, 0.65, 0.01), V(0, 0.76, -0.02), V(0, 0.84, 0.02)];
  const nr = (t) => 0.128 - 0.03 * t;
  const neckS = curveSamples(neckPts, 12, nr);
  C.push(paintTris(scaleTube(neckS, 10, Math.PI / 2), () => P.green, 0.2, 0.85));
  {
    const fine = curveSamples(neckPts, 26, nr), X = V(1, 0, 0);
    const fr = (i) => {
      const T = new THREE.Vector3().subVectors(fine[Math.min(i + 1, 25)].p, fine[Math.max(i - 1, 0)].p).normalize();
      return new THREE.Vector3().crossVectors(T, X).normalize().negate(); // belly direction (+z-ish)
    };
    for (let i = 3; i < 24; i += 2) {
      const pts = [];
      for (const [j, sh] of [[i, 0.004], [i + 2, -0.004]]) {
        const s0 = fine[Math.min(j, 25)], F = fr(Math.min(j, 25)), r = s0.rx, w = r * 0.62;
        const p = s0.p.clone();
        for (const sx of [-1, 1]) {
          pts.push(p.clone().addScaledVector(X, sx * w).addScaledVector(F, r * 0.82));
          pts.push(p.clone().addScaledVector(X, sx * w * 0.72).addScaledVector(F, r * 1.1));
          pts.push(p.clone().addScaledVector(X, sx * w).addScaledVector(F, r * 0.35));
        }
      }
      // shrink each plate a touch along the neck so the segments read
      const cen = pts.reduce((a, b) => a.add(b), V(0, 0, 0)).divideScalar(pts.length);
      const T = fine[i + 1].p.clone().sub(fine[i].p).normalize();
      for (const q of pts) { const d = q.clone().sub(cen).dot(T); q.addScaledVector(T, -d * 0.14); }
      C.push(paint(hull(pts), P.belly, 'y', [0.2, 0.85]));
    }
  }

  // ================= HEAD (big, blocky: cranium + long snout + yellow underjaw) =================
  const C0 = C, S0 = S; const HC = [], HS = [];
  { const C = HC, S = HS;
  const H = { y: 0.84, z: 0.04 };
  const FZ = H.z + 0.13; // front face of the cranium (eye plane)
  C.push(paint(hull([
    ...cbox(V(0, H.y + 0.01, H.z), 0.17, 0.1, 0.13, 0.045),
    ...ring(V(0, H.y + 0.125, H.z - 0.02), 0.12, 0.1, 8, 'y'),
    V(0.14, H.y + 0.11, FZ - 0.012), V(-0.14, H.y + 0.11, FZ - 0.012),
    V(0.18, H.y - 0.06, H.z + 0.02), V(-0.18, H.y - 0.06, H.z + 0.02),
  ]), P.green, 'y', [H.y - 0.1, H.y + 0.13]));
  // snout
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.035, H.z + 0.12), 0.15, 0.05, 0.08, 0.03),
    ...cbox(V(0, H.y - 0.04, H.z + 0.27), 0.115, 0.045, 0.035, 0.025),
  ]), P.green, 'y', [H.y - 0.1, H.y + 0.13]));
  // lower jaw (yellow)
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.115, H.z + 0.06), 0.13, 0.035, 0.1, 0.02),
    ...cbox(V(0, H.y - 0.105, H.z + 0.24), 0.095, 0.03, 0.045, 0.02),
    ...cbox(V(0, H.y - 0.155, H.z + 0.06), 0.09, 0.02, 0.08, 0.015),
  ]), P.belly, 'y', [H.y - 0.15, H.y - 0.08]));

  // tongue: forked, red, sticking out forward and down
  C.push(flat(hull([...cbox(V(0, H.y - 0.085, H.z + 0.28), 0.022, 0.007, 0.03, 0.003),
    ...cbox(V(0, H.y - 0.115, H.z + 0.36), 0.02, 0.007, 0.015, 0.003)]), P.tongue));
  S.push(flat(hull([...cbox(V(0.01, H.y - 0.115, H.z + 0.36), 0.01, 0.006, 0.012, 0.002),
    ...cbox(V(0.032, H.y - 0.155, H.z + 0.41), 0.008, 0.006, 0.01, 0.002)]), P.tongue));

  // nostrils
  S.push(flat(hull(cbox(V(0.045, H.y + 0.008, H.z + 0.27), 0.014, 0.006, 0.012, 0.003)), P.mouth));

  // fierce eyes on the cranium front, above the snout
  const E = V(0.085, H.y + 0.06, 0), es = 1.15;
  const sc = (pts) => pts.map(([u, v]) => [u * es, v * es]);
  S.push(flat(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.01, FZ + 0.012)), P.white));
  S.push(flat(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), P.eye));
  S.push(flat(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.007, E.y + 0.003, 0), FZ + 0.014, FZ + 0.021)), P.white));
  // heavy brow slanting down to the centre
  S.push(paint(hull([
    V(0.02, E.y + 0.006, FZ + 0.035), V(0.022, E.y + 0.045, FZ + 0.025),
    V(0.16, E.y + 0.044, FZ - 0.0), V(0.16, E.y + 0.068, FZ - 0.015),
    V(0.02, E.y + 0.006, FZ - 0.05), V(0.022, E.y + 0.05, FZ - 0.06),
    V(0.16, E.y + 0.04, FZ - 0.08), V(0.16, E.y + 0.06, FZ - 0.09),
  ]), P.brow, 'y'));

  // crest scales: layered shards along the crown, fanning back
  const g = (b, d, w, l) => flat(shard(b, d, w * 1.3, l * 0.9, 4, 0.4), P.greenD);
  for (const [z, y, dz, l] of [[0.06, 0.12, -0.4, 0.09], [-0.02, 0.13, -0.6, 0.11], [-0.1, 0.1, -0.9, 0.12], [-0.15, 0.03, -1.2, 0.11]])
    C.push(g(V(0, H.y + y, H.z + z), V(0, 1, dz), 0.05, l));
  for (const [x, z, y, d, l] of [
    [0.08, 0.04, 0.115, V(0.5, 1, -0.5), 0.08],
    [0.09, -0.06, 0.1, V(0.6, 0.9, -0.8), 0.09],
    [0.14, -0.04, 0.04, V(1, 0.5, -0.8), 0.09],
    [0.14, -0.06, -0.04, V(1, -0.1, -0.8), 0.08],
  ]) S.push(g(V(x, H.y + y, H.z + z), d, 0.045, l));

  }
  // scale the whole head up about the neck top
  const piv = V(0, 0.8, 0.02), HSC = 1.18;
  for (const g of [...HC, ...HS]) { g.translate(-piv.x, -piv.y, -piv.z); g.scale(HSC, HSC, HSC); g.translate(piv.x, piv.y, piv.z); }
  return assemble([...C0, ...HC], [...S0, ...HS]);
}

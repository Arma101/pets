// Frost Cobra (Epic, Round 4 – Frozen Peaks): ice-blue cobra on a banded coil, wide white frost-patterned hood,
// crystal fangs, ice armour plates and crystal shards.
import { V, THREE, hull, cbox, ring, plate, shard, curveSamples, paint, assemble } from '../kit.js';

// frost pattern cell: white with pale-blue snowflake / frost-fern lines (mapped planar onto the hood front)
function drawFrost(g, x, y) {
  const grd = g.createRadialGradient(x + 64, y + 70, 10, x + 64, y + 64, 92);
  grd.addColorStop(0, '#FFFFFF'); grd.addColorStop(0.6, '#F4FAFE'); grd.addColorStop(1, '#BFE5F8');
  g.fillStyle = grd; g.fillRect(x, y, 128, 128);
}

export const PALETTE = {
  ice:    { i: 0, top: '#86D8FA', bot: '#2F8FD6' },
  iceS:   { i: 1, top: '#74CDF6', bot: '#2580C8' },
  band:   { i: 2, top: '#2D6FC9', bot: '#173F86' },
  belly:  { i: 3, top: '#FFFFFF', bot: '#D4ECFA' },
  under:  { i: 11, top: '#EEFBFF', bot: '#B6EBFF' },
  rim:    { i: 12, top: '#FFFFFF', bot: '#DDF2FD' },
  crys:   { i: 4, top: '#F2FEFF', bot: '#6FDCFF' },
  crysD:  { i: 5, top: '#B8F0FF', bot: '#3FB9F0' },
  eye:    { i: 6, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 7, top: '#FFFFFF', bot: '#F1F1F4' },
  mouth:  { i: 8, top: '#2A1E3A', bot: '#140E20' },
  brow:   { i: 9, top: '#4FAEE8', bot: '#1F6FB8' },
  frost:  { i: 10, draw: drawFrost },
};
const P = PALETTE;

// ---------- local helpers (adapted from sparring_snake) ----------
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
// per-triangle swatch choice; pick may return a swatch or a function(v) -> uv (planar maps)
function paintTris(g, pick, lo, hi) {
  const p = g.attributes.position, uv = [];
  const meta = g.userData.meta || [];
  const a = V(0, 0, 0), b = V(0, 0, 0), c = V(0, 0, 0);
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    const cen = a.clone().add(b).add(c).divideScalar(3);
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const sw = pick(cen, n, meta[i / 3] || {});
    for (const v of [a, b, c]) uv.push(...(typeof sw === 'function' ? sw(v) : swUV(sw, 1 - (v.y - lo) / Math.max(1e-6, hi - lo))));
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.meta;
  return g;
}
// planar (x,y) map of a rect onto a draw-cell
function planar(sw, x0, x1, y0, y1) {
  const cx = (sw.i % 8) * 128, cy = Math.floor(sw.i / 8) * 128;
  return (v) => {
    const u = THREE.MathUtils.clamp((v.x - x0) / (x1 - x0), 0, 1), w = THREE.MathUtils.clamp((v.y - y0) / (y1 - y0), 0, 1);
    return [(cx + 3 + u * 122) / 1024, (cy + 3 + (1 - w) * 122) / 1024];
  };
}

// coil ring with a diamond (antiprism) grid
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
      for (const t of [A, Bt]) {
        const cen = t[0].clone().add(t[1]).add(t[2]).divideScalar(3);
        tri(pos, meta, ...t, cen.clone().sub(mid), { i });
      }
    }
  }
  const cap = (i, bulge, s) => {
    const { p, T } = frames[i];
    const tip = p.clone().addScaledVector(T, bulge * s), o = T.clone().multiplyScalar(s);
    for (let k = 0; k < seg; k++) tri(pos, meta, rings[i][k], rings[i][(k + 1) % seg], tip, o, { i });
  };
  cap(0, capStart, -1); cap(n - 1, capEnd, 1);
  return finish(pos, meta);
}

export function buildGeometry() {
  const C = [], S = [];
  const flat = (g, sw) => paint(g, sw, 'flat');
  const crystal = (b, d, w, l, sw = P.crys) => paint(shard(b, d, w, l, 4, 0.75), sw, 'y');

  // band markings by angle around the coil (mirror-safe: uses |x|)
  const banded = (c, N, every, off) => {
    const ang = Math.atan2(Math.abs(c.x), c.z); // 0 front .. PI back
    const step = Math.PI / every, d = ((ang + off * step) % step + step) % step;
    return Math.min(d, step - d) < Math.PI / N * 0.75;
  };

  // ================= COIL BASE =================
  const prof0 = [[0.14, 0.035], [0.105, 0.1], [0.02, 0.13], [-0.09, 0.1], [-0.13, 0.01], [-0.1, -0.1], [0.125, -0.13], [0.152, -0.05]];
  C.push(paintTris(coil(0.13, 0.28, prof0, 14), (c, n, m) => {
    if (m.k === 7) return m.apex === 'up' ? P.crysD : P.ice;
    if (m.k >= 4 && m.k <= 6) return P.under;
    if (banded(c, 14, 3, 0)) return P.band;
    return m.apex === 'up' ? P.ice : P.iceS;
  }, 0.0, 0.27));
  const prof1 = [[0.105, 0.025], [0.08, 0.075], [0.01, 0.095], [-0.07, 0.07], [-0.09, 0.0], [-0.06, -0.06], [0.09, -0.08], [0.11, -0.035]];
  C.push(paintTris(coil(0.29, 0.165, prof1, 11), (c, n, m) => {
    if (m.k === 7 && m.apex === 'up') return P.crysD;
    if (m.k === 6) return P.under;
    if (banded(c, 11, 3, 0.5)) return P.band;
    return m.apex === 'up' ? P.ice : P.iceS;
  }, 0.18, 0.39));

  // ================= NECK (rises straight up, slight forward lean) =================
  const neckPts = [V(0, 0.22, -0.07), V(0, 0.38, -0.04), V(0, 0.54, -0.01), V(0, 0.68, 0.0), V(0, 0.8, 0.02)];
  const nr = (t) => 0.15 - 0.032 * t;
  C.push(paintTris(scaleTube(curveSamples(neckPts, 10, nr), 10, Math.PI / 2), (c) => (c.z < -0.02 && Math.floor(c.y / 0.08) % 2 === 0 ? P.band : P.ice), 0.2, 0.85));

  // ================= HOOD (wide, flat, faceted; white frost front, ice-blue back) =================
  const HZ = -0.02;
  const HW = 0.38;
  const outline = [[0.07, 0.4], [0.2, 0.46], [0.31, 0.54], [0.37, 0.63], [0.38, 0.71], [0.34, 0.79], [0.25, 0.86], [0.12, 0.9], [0.0, 0.91]];
  const hoodPts = [];
  for (const [x, y] of outline) for (const sx of [-1, 1]) {
    const f = x / HW;
    hoodPts.push(V(sx * x, y, HZ + 0.035 + 0.04 * f), V(sx * x, y, HZ - 0.035 + 0.04 * f));
  }
  for (const y of [0.42, 0.6, 0.78]) for (const sx of [-1, 1]) hoodPts.push(V(sx * 0.08, y, -0.15));
  const fmap = planar(P.frost, -0.39, 0.39, 0.39, 0.92);
  const hoodG = hull(hoodPts); hoodG.userData.hood = 1;
  C.push(paintTris(hoodG, (c, n) => (n.z > 0.5 ? fmap : (n.z < -0.5 ? P.ice : P.rim)), 0.4, 0.88));
  // back markings: dark chevrons on the hood back (raised)

  // bold back markings: dark chevron bands + ice plates on the hood back (projected onto the hood surface)
  {
    const hoodMesh = new THREE.Mesh(C.find((g) => g.userData.hood)); hoodMesh.updateMatrixWorld();
    const rc = new THREE.Raycaster();
    const zb = (x, y) => { rc.set(V(x, y, -1), V(0, 0, 1)); const h = rc.intersectObject(hoodMesh); return h.length ? h[0].point.z : -0.1; };
    const quad = (corners, sw) => {
      const pts = [];
      const n = corners.length;
      for (let e = 0; e < n; e++) {
        const [x0, y0] = corners[e], [x1, y1] = corners[(e + 1) % n];
        for (const t of [0, 0.33, 0.66]) {
          const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
          pts.push(V(x, y, zb(x, y) - 0.009), V(x, y, zb(x, y) + 0.03));
        }
      }
      S.push(flat(hull(pts), sw));
    };
    for (const [y, w] of [[0.49, 0.22], [0.62, 0.31], [0.75, 0.28]])
      quad([[0.0, y], [w, y + 0.06], [w - 0.025, y + 0.1], [0.0, y + 0.045]], P.band);
    // ice armour scales between the bands
    for (const [x, y, r] of [[0.13, 0.6, 0.032], [0.22, 0.715, 0.034], [0.11, 0.725, 0.03]])
      quad([0, 1, 2, 3, 4, 5].map((k) => [x + Math.cos(k * Math.PI / 3) * r, y + Math.sin(k * Math.PI / 3) * r * 0.8]), P.crysD);
  }
  // raised frost snowflakes on the hood front (pale-blue bars projected onto the surface)
  {
    const hoodMesh = new THREE.Mesh(C.find((g) => g.userData.hood)); hoodMesh.updateMatrixWorld();
    const rc = new THREE.Raycaster();
    const zf = (x, y) => { rc.set(V(x, y, 1), V(0, 0, -1)); const h = rc.intersectObject(hoodMesh); return h.length ? h[0].point.z : 0.02; };
    const bar = (cx, cy, ang, len, w, sw) => {
      const dx = Math.cos(ang), dy = Math.sin(ang), pts = [];
      for (const t of [-1, -0.5, 0, 0.5, 1]) for (const sd of [-1, 1]) {
        const x = cx + dx * len * t - dy * w * sd, y = cy + dy * len * t + dx * w * sd;
        pts.push(V(x, y, zf(x, y) + 0.007), V(x, y, zf(x, y) - 0.02));
      }
      S.push(flat(hull(pts), sw));
    };
    const flake = (cx, cy, r, w) => {
      for (const a of [0, Math.PI / 3, 2 * Math.PI / 3]) bar(cx, cy, Math.PI / 2 + a, r, w, P.crysD);
      for (let k = 0; k < 6; k++) {
        const a = Math.PI / 2 + k * Math.PI / 3, bx = cx + Math.cos(a) * r * 0.6, by = cy + Math.sin(a) * r * 0.6;
        for (const sdir of [-1, 1]) {
          const b = a + sdir * 0.9;
          bar(bx + Math.cos(b) * r * 0.16, by + Math.sin(b) * r * 0.16, b, r * 0.16, w * 0.8, P.crysD);
        }
      }
    };
    flake(0.21, 0.665, 0.085, 0.012);
    flake(0.16, 0.5, 0.045, 0.009);
    flake(0.28, 0.785, 0.04, 0.009);
  }
  // frost crystal edging along the hood rim (pale blue shards fanning outwards)
  for (const [x, y, d, l] of [[0.33, 0.58, V(1, -0.4, 0.2), 0.06], [0.37, 0.7, V(1, 0.1, 0.2), 0.07], [0.3, 0.82, V(0.7, 0.7, 0.1), 0.06]])
    S.push(crystal(V(x, y, HZ + 0.025), d, 0.028, l, P.crysD));

  // belly armour plates down the neck front (crystal-tinted)
  {
    const fine = curveSamples(neckPts, 22, nr), X = V(1, 0, 0);
    const fr = (i) => {
      const T = new THREE.Vector3().subVectors(fine[Math.min(i + 1, 21)].p, fine[Math.max(i - 1, 0)].p).normalize();
      return new THREE.Vector3().crossVectors(T, X).normalize().negate();
    };
    for (let i = 3; i < 19; i += 2) {
      const pts = [];
      for (const [j] of [[i], [i + 2]]) {
        const s0 = fine[Math.min(j, 21)], F = fr(Math.min(j, 21)), r = s0.rx, w = r * 0.62;
        for (const sx of [-1, 1]) {
          pts.push(s0.p.clone().addScaledVector(X, sx * w).addScaledVector(F, r * 0.82));
          pts.push(s0.p.clone().addScaledVector(X, sx * w * 0.7).addScaledVector(F, r * 1.12));
          pts.push(s0.p.clone().addScaledVector(X, sx * w).addScaledVector(F, r * 0.35));
        }
      }
      const cen = pts.reduce((a, b) => a.add(b), V(0, 0, 0)).divideScalar(pts.length);
      const T = fine[i + 1].p.clone().sub(fine[i].p).normalize();
      for (const q of pts) { const d = q.clone().sub(cen).dot(T); q.addScaledVector(T, -d * 0.14); }
      C.push(paint(hull(pts), P.belly, 'y', [0.2, 0.85]));
    }
  }

  // ================= HEAD =================
  const HC = [], HS = [];
  {
    const C = HC, S = HS;
    const H = { y: 0.88, z: 0.05 };
    const FZ = H.z + 0.13;
    // cranium (wide, flat cobra skull)
    C.push(paint(hull([
      ...cbox(V(0, H.y + 0.01, H.z), 0.18, 0.09, 0.13, 0.045),
      ...ring(V(0, H.y + 0.11, H.z - 0.02), 0.13, 0.1, 8, 'y'),
      V(0.15, H.y + 0.1, FZ - 0.012), V(-0.15, H.y + 0.1, FZ - 0.012),
      V(0.19, H.y - 0.05, H.z + 0.02), V(-0.19, H.y - 0.05, H.z + 0.02),
    ]), P.ice, 'y', [H.y - 0.1, H.y + 0.12]));
    // upper snout
    C.push(paint(hull([
      ...cbox(V(0, H.y - 0.03, H.z + 0.12), 0.155, 0.05, 0.08, 0.03),
      ...cbox(V(0, H.y - 0.035, H.z + 0.22), 0.12, 0.042, 0.04, 0.025),
    ]), P.ice, 'y', [H.y - 0.1, H.y + 0.12]));
    // dark mouth gap (slightly open)
    C.push(flat(hull([...cbox(V(0, H.y - 0.09, H.z + 0.12), 0.115, 0.02, 0.1, 0.01),
      ...cbox(V(0, H.y - 0.09, H.z + 0.2), 0.09, 0.018, 0.035, 0.01)]), P.mouth));
    // lower jaw (white)
    C.push(paint(hull([
      ...cbox(V(0, H.y - 0.125, H.z + 0.06), 0.135, 0.032, 0.1, 0.02),
      ...cbox(V(0, H.y - 0.118, H.z + 0.2), 0.095, 0.028, 0.04, 0.02),
      ...cbox(V(0, H.y - 0.162, H.z + 0.06), 0.09, 0.02, 0.08, 0.015),
    ]), P.belly, 'y', [H.y - 0.17, H.y - 0.09]));
    // crystal fangs hanging from the upper jaw front
    S.push(paint(hull([V(0.045, H.y - 0.07, H.z + 0.235), V(0.09, H.y - 0.07, H.z + 0.235), V(0.068, H.y - 0.07, H.z + 0.275),
      V(0.068, H.y - 0.06, H.z + 0.25), V(0.06, H.y - 0.175, H.z + 0.262)]), P.crys, 'y', [H.y - 0.18, H.y - 0.06]));
    // nostrils
    S.push(flat(hull(cbox(V(0.045, H.y + 0.008, H.z + 0.262), 0.014, 0.006, 0.006, 0.003)), P.mouth));

    // fierce eyes
    const E = V(0.088, H.y + 0.05, 0), es = 1.15;
    const sc = (pts) => pts.map(([u, v]) => [u * es, v * es]);
    S.push(flat(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
      E, FZ - 0.01, FZ + 0.012)), P.white));
    S.push(flat(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
      V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), P.eye));
    S.push(flat(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
      V(E.x + 0.007, E.y + 0.003, 0), FZ + 0.014, FZ + 0.021)), P.white));
    // heavy brow
    S.push(paint(hull([
      V(0.02, E.y + 0.006, FZ + 0.035), V(0.022, E.y + 0.045, FZ + 0.025),
      V(0.17, E.y + 0.044, FZ - 0.0), V(0.17, E.y + 0.068, FZ - 0.015),
      V(0.02, E.y + 0.006, FZ - 0.05), V(0.022, E.y + 0.05, FZ - 0.06),
      V(0.17, E.y + 0.04, FZ - 0.08), V(0.17, E.y + 0.06, FZ - 0.09),
    ]), P.brow, 'y'));

    // ice armour plates on the crown: centre hex plate + side plates, and a short crystal crest
    C.push(paint(hull([...ring(V(0, H.y + 0.115, H.z + 0.0), 0.07, 0.085, 6, 'y', 0), ...ring(V(0, H.y + 0.14, H.z - 0.01), 0.05, 0.065, 6, 'y', 0)]), P.crys, 'y'));
    S.push(paint(hull([V(0.08, H.y + 0.108, H.z + 0.07), V(0.14, H.y + 0.09, H.z + 0.05), V(0.15, H.y + 0.085, H.z - 0.04),
      V(0.09, H.y + 0.1, H.z - 0.07), V(0.1, H.y + 0.122, H.z + 0.0), V(0.13, H.y + 0.108, H.z + 0.0)]), P.crysD, 'y'));
    C.push(crystal(V(0, H.y + 0.15, H.z - 0.04), V(0, 1, -0.8), 0.035, 0.08, P.crysD));
    S.push(crystal(V(0.06, H.y + 0.13, H.z - 0.07), V(0.4, 0.8, -1), 0.03, 0.07, P.crysD));
  }
  const piv = V(0, 0.82, 0.02), HSC = 1.22;
  for (const g of [...HC, ...HS]) { g.translate(-piv.x, -piv.y, -piv.z); g.scale(HSC, HSC, HSC); g.translate(piv.x, piv.y, piv.z); }

  // ================= ICE CRYSTAL CLUSTERS on the coil (tasteful) =================
  for (const [b, d, w, l] of [
    [V(0.3, 0.2, -0.2), V(0.35, 1, -0.25), 0.05, 0.15],
    [V(0.36, 0.17, -0.13), V(0.9, 0.7, 0.1), 0.038, 0.1],
    [V(0.24, 0.21, -0.28), V(0.0, 1, -0.7), 0.035, 0.1],
  ]) S.push(paint(shard(b, d, w, l, 5, 0.85), P.crysD, 'y'));
  // tail tip crystal at the back, centre
  C.push(paint(shard(V(0, 0.18, -0.39), V(0, 0.8, -1), 0.05, 0.14, 5, 0.85), P.crysD, 'y'));

  return assemble([...C, ...HC], [...S, ...HS]);
}

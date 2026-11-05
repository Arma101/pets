// Seraph Serpent (Secret): cream serpent with gold scales resting on a coil, raised fierce head,
// six small feathered wings (three mirrored pairs), floating golden halo, white marble belly plates
// with gold trim, glowing sky-blue rune patterns and floating glowing crystals.
import { V, THREE, hull, cbox, ring, plate, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// marble swatch: white with soft grey-lilac veins (u is mapped from world position, see marbleUV)
function drawMarble(g, x, y) {
  const grad = g.createLinearGradient(0, y, 0, y + 128);
  grad.addColorStop(0, '#FFFCF2'); grad.addColorStop(1, '#EFE5D0');
  g.fillStyle = grad; g.fillRect(x, y, 128, 128);
  g.save(); g.beginPath(); g.rect(x, y, 128, 128); g.clip();
  g.strokeStyle = 'rgba(170,160,185,0.4)'; g.lineWidth = 3;
  for (const [a, b, c, d] of [[0, 20, 128, 70], [10, 128, 90, 0], [0, 95, 128, 110], [60, 128, 128, 40]]) {
    g.beginPath(); g.moveTo(x + a, y + b); g.lineTo(x + (a + c) / 2 + 12, y + (b + d) / 2 - 8); g.lineTo(x + c, y + d); g.stroke();
  }
  g.strokeStyle = 'rgba(214,170,60,0.55)'; g.lineWidth = 2; // faint gold vein
  g.beginPath(); g.moveTo(x, y + 60); g.lineTo(x + 50, y + 45); g.lineTo(x + 128, y + 85); g.stroke();
  g.restore();
}

function drawFeather(g, x, y) {
  const glowPass = g.getImageData(x + 64, y + 64, 1, 1).data[0] < 8;
  if (glowPass) { g.fillStyle = '#2E2E33'; g.fillRect(x, y, 128, 128); return; } // soft inner light so shaded sides stay white
  const grad = g.createLinearGradient(0, y + 16, 0, y + 112);
  grad.addColorStop(0, '#F3F6FF'); grad.addColorStop(1, '#C8D3EC');
  g.fillStyle = grad; g.fillRect(x, y, 128, 128);
}

export const PALETTE = {
  cream:  { i: 0, top: '#FFF6DF', bot: '#EBD3A2' },
  creamS: { i: 1, top: '#F8E9C6', bot: '#DCBE86' },
  gold:   { i: 2, top: '#FFE15A', bot: '#E09A14' },
  goldD:  { i: 3, top: '#F4C537', bot: '#B9760C' },
  marble: { i: 4, top: '#FFFFFF', bot: '#E6E4EE', draw: drawMarble },
  feather:{ i: 5, top: '#FFFFFF', bot: '#FFFFFF', glow: true, draw: drawFeather },
  rune:   { i: 6, top: '#A8F8FF', bot: '#2CC9F2', glow: true },
  halo:   { i: 7, top: '#FFEB80', bot: '#FFBE1A', glow: true },
  eye:    { i: 8, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 9, top: '#FFFFFF', bot: '#F1F1F4' },
  mouth:  { i: 10, top: '#5A2E1A', bot: '#3E1E10' },
  brow:   { i: 11, top: '#EED39A', bot: '#C9A161' },
  tongue: { i: 12, top: '#F2707A', bot: '#C23446' },
};
const P = PALETTE;

// ---------- local helpers (copied/adapted from sparring_snake) ----------
function swUV(sw, t, u = 0.5) {
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  return [(x + 24 + THREE.MathUtils.clamp(u, 0, 1) * 80) / 1024, (y + 16 + THREE.MathUtils.clamp(t, 0, 1) * 96) / 1024];
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
// per-triangle swatch choice; gradient by world height; marble gets world-mapped u
function paintTris(g, pick, lo, hi) {
  const p = g.attributes.position, uv = [];
  const meta = g.userData.meta || [];
  const a = V(0, 0, 0), b = V(0, 0, 0), c = V(0, 0, 0);
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    const cen = a.clone().add(b).add(c).divideScalar(3);
    const sw = pick(cen, meta[i / 3] || {});
    for (const v of [a, b, c]) {
      const t = 1 - (v.y - lo) / Math.max(1e-6, hi - lo);
      if (sw === P.marble) uv.push(...marbleCoord(sw, v, cen));
      else uv.push(...swUV(sw, t));
    }
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.meta;
  return g;
}
function marbleCoord(sw, v, cen) {
  const f = (q) => Math.abs(q.x) * 2.3 + q.z * 1.7 + q.y * 2.9;
  const base = Math.floor(f(cen) * 2) / 2;
  const u = (f(v) - base) * 1.2, t = ((v.y * 3.1 + Math.abs(v.x) * 1.3) % 1 + 1) % 1;
  return swUV(sw, t, u);
}
function marble(g) { // whole-geometry marble paint
  const p = g.attributes.position, uv = [];
  const a = V(0, 0, 0), b = V(0, 0, 0), c = V(0, 0, 0);
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    const cen = a.clone().add(b).add(c).divideScalar(3);
    for (const v of [a, b, c]) uv.push(...marbleCoord(P.marble, v, cen));
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

// coil ring with a diamond (antiprism) scale grid
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
      // index around the ring folded so the pattern is mirror-symmetric
      const ii = Math.min(i, N - 1 - i);
      tri(pos, meta, ...A, outOf(...A), { k, i, ii, apex: 'up' });
      tri(pos, meta, ...B, outOf(...B), { k, i, ii, apex: 'down' });
    }
  }
  return finish(pos, meta);
}

// antiprism tube along a YZ-plane curve
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
      tri(pos, meta, ...A, A[0].clone().add(A[1]).add(A[2]).divideScalar(3).sub(mid), { i, apex: 'up' });
      tri(pos, meta, ...Bt, Bt[0].clone().add(Bt[1]).add(Bt[2]).divideScalar(3).sub(mid), { i, apex: 'down' });
    }
  }
  const cap = (i, bulge, s) => {
    const { p, T } = frames[i];
    const tip = p.clone().addScaledVector(T, bulge * s), o = T.clone().multiplyScalar(s);
    for (let k = 0; k < seg; k++) tri(pos, meta, rings[i][k], rings[i][(k + 1) % seg], tip, o, { i, cap: 1 });
  };
  cap(0, capStart, -1); cap(n - 1, capEnd, 1);
  return finish(pos, meta);
}

// flat faceted feather blade: base, direction, in-plane normal, half width, length, thickness
function feather(base, dir, nrm, w, len, th = 0.012) {
  const d = dir.clone().normalize();
  const s = new THREE.Vector3().crossVectors(nrm, d).normalize();
  const pts = [];
  for (const o of [-th, th]) {
    const N = nrm.clone().multiplyScalar(o);
    pts.push(base.clone().addScaledVector(s, w * 0.55).add(N), base.clone().addScaledVector(s, -w * 0.55).add(N));
    pts.push(base.clone().addScaledVector(d, len * 0.55).addScaledVector(s, w).add(N));
    pts.push(base.clone().addScaledVector(d, len * 0.55).addScaledVector(s, -w).add(N));
    pts.push(base.clone().addScaledVector(d, len * 0.85).addScaledVector(s, w * 0.6).add(N.clone().multiplyScalar(0.7)));
  }
  pts.push(base.clone().addScaledVector(d, len));
  return hull(pts);
}

// feather split into a white body and a gold tip (both chunky faceted hulls)
function featherParts(base, dir, nrm, w, len, th) {
  const d = dir.clone().normalize();
  const sv = new THREE.Vector3().crossVectors(nrm, d).normalize();
  const P0 = (along, half, k) => base.clone().addScaledVector(d, len * along).addScaledVector(sv, w * half).addScaledVector(nrm, th * k);
  const body = [], tip = [];
  for (const k of [-1, 1]) {
    body.push(P0(0, 0.6, k), P0(0, -0.6, k), P0(0.5, 1, k), P0(0.5, -1, k), P0(0.77, 0.82, k * 0.85), P0(0.77, -0.82, k * 0.85));
    tip.push(P0(0.75, 0.84, k * 0.85), P0(0.75, -0.84, k * 0.85), P0(0.9, 0.5, k * 0.6), P0(0.9, -0.5, k * 0.6));
  }
  tip.push(P0(1, 0, 0.3), P0(1, 0, -0.3));
  return [hull(body), hull(tip)];
}

export function buildGeometry() {
  const C = [], S = [];
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= COIL BASE =================
  const prof0 = [[0.15, 0.035], [0.11, 0.105], [0.02, 0.135], [-0.095, 0.105], [-0.135, 0.01], [-0.105, -0.1], [0.105, -0.13], [0.155, -0.045]];
  C.push(paintTris(coil(0.13, 0.29, prof0, 22), (c, m) => {
    if (m.k === 7) return m.apex === 'up' ? P.gold : P.cream;          // gold teeth band
    if (m.k === 6) return P.goldD;                                     // gold trim line
    if (m.k >= 4 && m.k <= 5) return P.marble;                         // marble underside
    if (m.k === 0 && m.apex === 'down' && m.ii % 2 === 0) return P.rune; // glowing rune diamonds
    if (m.k === 1 && m.apex === 'up' && m.ii % 2 === 1) return P.gold;   // gold scales
    return m.apex === 'up' ? P.cream : P.creamS;
  }, 0.0, 0.27));
  const prof1 = [[0.11, 0.025], [0.085, 0.08], [0.01, 0.1], [-0.075, 0.075], [-0.095, 0.0], [-0.065, -0.065], [0.075, -0.085], [0.11, -0.035]];
  C.push(paintTris(coil(0.3, 0.17, prof1, 16), (c, m) => {
    if (m.k === 7) return m.apex === 'up' ? P.gold : P.cream;
    if (m.k === 6) return P.goldD;
    if (m.k === 0 && m.apex === 'down' && m.ii % 2 === 1) return P.rune;
    if (m.k === 1 && m.apex === 'up' && m.ii % 2 === 0) return P.gold;
    return m.apex === 'up' ? P.cream : P.creamS;
  }, 0.18, 0.4));

  // ================= TAIL TIP (pokes out the back of the coil, curls up, gold feather fin) =================
  C.push(paint(tube(curveSamples([V(0, 0.13, -0.33), V(0, 0.11, -0.45), V(0, 0.14, -0.53), V(0, 0.22, -0.575)], 7,
    (t) => 0.095 * (1 - 0.6 * t), (t) => 0.085 * (1 - 0.6 * t)), { seg: 6, axis: V(1, 0, 0), capEnd: 0.03 }), P.cream, 'y', [0.0, 0.3]));
  C.push(flat(feather(V(0, 0.22, -0.575), V(0, 1, -0.35), V(1, 0, 0), 0.04, 0.14, 0.014), P.gold));
  S.push(flat(feather(V(0.012, 0.21, -0.57), V(0.7, 0.75, -0.4), V(0, 0, 1).cross(V(0.7, 0.75, -0.4)).normalize().cross(V(0.7, 0.75, -0.4)).normalize(), 0.032, 0.12, 0.012), P.feather));

  // ================= NECK (S-curve) cream with gold scale diamonds on the back =================
  const neckPts = [V(0, 0.24, -0.06), V(0, 0.4, 0.0), V(0, 0.54, 0.06), V(0, 0.67, 0.01), V(0, 0.77, -0.02), V(0, 0.85, 0.02)];
  const nr = (t) => 0.13 - 0.03 * t;
  const neckS = curveSamples(neckPts, 12, nr);
  C.push(paintTris(scaleTube(neckS, 10, Math.PI / 2), (c, m) => {
    if (m.cap) return P.cream;
    const back = c.z < neckS[Math.min(11, m.i)].p.z - 0.07;
    if (back && m.apex === 'up' && m.i % 2 === 0) return P.gold;
    return m.apex === 'up' ? P.cream : P.creamS;
  }, 0.2, 0.86));
  // belly scutes: wide, flat chevron plates hugging the neck front, cream-white marble on a thin gold edge
  {
    const NF = 30, fine = curveSamples(neckPts, NF, nr), X = V(1, 0, 0);
    const fr = (i) => {
      const j = Math.min(Math.max(i, 0), NF - 1);
      const T = new THREE.Vector3().subVectors(fine[Math.min(j + 1, NF - 1)].p, fine[Math.max(j - 1, 0)].p).normalize();
      return { T, F: new THREE.Vector3().crossVectors(T, X).normalize().negate() };
    };
    const scute = (i0, i1, ang, rad, drop, extra) => {
      const pts = [];
      for (const [j, isLow] of [[i0, 0], [i1, 1]]) {
        const s0 = fine[j], { T, F } = fr(j), r = s0.rx;
        for (const th of [-ang, -ang * 0.5, 0, ang * 0.5, ang]) {
          const p = s0.p.clone().addScaledVector(F, Math.cos(th) * r * rad).addScaledVector(X, Math.sin(th) * r * rad);
          // chevron: the lower edge dips in the middle (points down the neck)
          if (isLow) p.addScaledVector(T, -(drop * (1 - Math.abs(th) / ang) + extra));
          else p.addScaledVector(T, extra * 0.3);
          pts.push(p, s0.p.clone().addScaledVector(F, Math.cos(th) * r * 0.55).addScaledVector(X, Math.sin(th) * r * 0.55));
        }
      }
      return hull(pts);
    };
    for (let i = 2; i < NF - 4; i += 3) {
      C.push(paint(scute(i, i + 2, 1.22, 1.04, 0.024, 0.013), P.gold, 'flat'));   // thin gold edge
      C.push(marble(scute(i, i + 2, 1.1, 1.075, 0.02, 0.0)));                   // marble scute face
    }
  }

  // ================= HEAD =================
  const HC = [], HS = [];
  const H = { y: 0.85, z: 0.04 };
  {
    const C = HC, S = HS;
    const FZ = H.z + 0.13;
    C.push(paint(hull([
      ...cbox(V(0, H.y + 0.01, H.z), 0.17, 0.1, 0.13, 0.045),
      ...ring(V(0, H.y + 0.125, H.z - 0.02), 0.12, 0.1, 8, 'y'),
      V(0.14, H.y + 0.11, FZ - 0.012), V(-0.14, H.y + 0.11, FZ - 0.012),
      V(0.18, H.y - 0.06, H.z + 0.02), V(-0.18, H.y - 0.06, H.z + 0.02),
    ]), P.cream, 'y', [H.y - 0.1, H.y + 0.13]));
    // snout
    C.push(paint(hull([
      ...cbox(V(0, H.y - 0.035, H.z + 0.12), 0.15, 0.05, 0.08, 0.03),
      ...cbox(V(0, H.y - 0.04, H.z + 0.26), 0.115, 0.045, 0.035, 0.025),
    ]), P.cream, 'y', [H.y - 0.1, H.y + 0.13]));
    // gold nose-plate on the snout top
    C.push(flat(hull([...cbox(V(0, H.y + 0.012, H.z + 0.2), 0.045, 0.008, 0.06, 0.004),
      V(0, H.y + 0.012, H.z + 0.27)]), P.gold));
    // lower jaw: marble with gold trim
    C.push(marble(hull([
      ...cbox(V(0, H.y - 0.115, H.z + 0.06), 0.13, 0.035, 0.1, 0.02),
      ...cbox(V(0, H.y - 0.105, H.z + 0.23), 0.095, 0.03, 0.045, 0.02),
      ...cbox(V(0, H.y - 0.155, H.z + 0.06), 0.09, 0.02, 0.08, 0.015),
    ])));
    C.push(flat(hull([...cbox(V(0, H.y - 0.082, H.z + 0.07), 0.14, 0.007, 0.105, 0.004),
      ...cbox(V(0, H.y - 0.077, H.z + 0.23), 0.1, 0.007, 0.05, 0.004)]), P.goldD));
    // small forked tongue
    C.push(flat(hull([...cbox(V(0, H.y - 0.085, H.z + 0.27), 0.02, 0.006, 0.03, 0.003),
      ...cbox(V(0, H.y - 0.098, H.z + 0.305), 0.016, 0.006, 0.01, 0.003)]), P.tongue));
    S.push(flat(hull([...cbox(V(0.008, H.y - 0.098, H.z + 0.305), 0.008, 0.005, 0.008, 0.002),
      ...cbox(V(0.02, H.y - 0.115, H.z + 0.33), 0.006, 0.005, 0.006, 0.002)]), P.tongue));
    // nostrils
    S.push(flat(hull(cbox(V(0.045, H.y + 0.008, H.z + 0.265), 0.014, 0.006, 0.012, 0.003)), P.mouth));

    // fierce eyes
    const E = V(0.085, H.y + 0.06, 0), es = 1.15;
    const sc = (pts) => pts.map(([u, v]) => [u * es, v * es]);
    S.push(flat(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
      E, FZ - 0.01, FZ + 0.012)), P.white));
    S.push(flat(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
      V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), P.eye));
    S.push(flat(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
      V(E.x + 0.007, E.y + 0.003, 0), FZ + 0.014, FZ + 0.021)), P.white));
    // heavy gold-trimmed brow
    S.push(paint(hull([
      V(0.02, E.y + 0.006, FZ + 0.035), V(0.022, E.y + 0.045, FZ + 0.025),
      V(0.16, E.y + 0.044, FZ - 0.0), V(0.16, E.y + 0.068, FZ - 0.015),
      V(0.02, E.y + 0.006, FZ - 0.05), V(0.022, E.y + 0.05, FZ - 0.06),
      V(0.16, E.y + 0.04, FZ - 0.08), V(0.16, E.y + 0.06, FZ - 0.09),
    ]), P.gold, 'y'));
    // glowing forehead gem (diamond) set in gold
    C.push(flat(hull([...ring(V(0, H.y + 0.13, FZ - 0.02), 0.035, 0.04, 4, 'z', 0).map(p => p),
      V(0, H.y + 0.13, FZ - 0.05)].map((p, k) => k < 4 ? V(p.x, p.y, FZ - 0.005) : p)), P.goldD));
    C.push(flat(hull([...ring(V(0, H.y + 0.13, 0), 0.024, 0.03, 4, 'z', 0).map(p => V(p.x, p.y, FZ + 0.004)),
      V(0, H.y + 0.13, FZ + 0.02), V(0, H.y + 0.13, FZ - 0.02)]), P.rune));
    // glowing rune chevrons on the head sides
    for (const [dz, dy] of [[0.0, 0.0], [-0.065, -0.005]])
      S.push(flat(hull([V(0.168, H.y + 0.045 + dy, H.z - 0.01 + dz), V(0.168, H.y + 0.015 + dy, H.z + 0.025 + dz),
        V(0.168, H.y - 0.02 + dy, H.z - 0.01 + dz), V(0.168, H.y + 0.012 + dy, H.z + 0.0 + dz),
        V(0.181, H.y + 0.045 + dy, H.z - 0.01 + dz), V(0.181, H.y + 0.015 + dy, H.z + 0.025 + dz),
        V(0.181, H.y - 0.02 + dy, H.z - 0.01 + dz)]), P.rune));
    // white crown feathers fanning back from the crown
    const up = V(1, 0, 0);
    for (const [z, y, dz, l] of [[0.0, 0.13, -0.5, 0.1], [-0.08, 0.12, -0.9, 0.12], [-0.14, 0.05, -1.4, 0.11]])
      C.push(flat(feather(V(0, H.y + y, H.z + z), V(0, 1, dz), up, 0.035, l, 0.012), P.feather));
  }
  const piv = V(0, 0.8, 0.02), HSC = 1.28;
  for (const g of [...HC, ...HS]) { g.translate(-piv.x, -piv.y, -piv.z); g.scale(HSC, HSC, HSC); g.translate(piv.x, piv.y, piv.z); }
  const headTop = piv.y + (H.y + 0.15 - piv.y) * HSC;

  // ================= HALO (floating gold ring above the head) =================
  {
    const hc = V(0, headTop + 0.1, -0.03), R = 0.13, pts = [];
    const tilt = -0.35; // tip it back a little
    for (let k = -1; k <= 17; k++) {
      const a = (2 * Math.PI * k) / 16;
      const x = Math.sin(a) * R, z0 = Math.cos(a) * R;
      pts.push({ p: V(hc.x + x, hc.y + z0 * Math.sin(-tilt), hc.z + z0 * Math.cos(tilt)), rx: 0.022, ry: 0.016 });
    }
    // close the ring: duplicate first ring position at end -> tube with flat caps meeting
    C.push(paint(tube(pts, { seg: 6, axis: null, ref: V(0, 1, 0) }), P.halo, 'flat'));
  }

  // ================= SIX FEATHERED WINGS (three mirrored pairs: big, medium, small) =================
  const wing = (root, lead, trail, nF, len, w) => {
    const a = lead.clone().normalize(), b = trail.clone().normalize();
    const nrm = new THREE.Vector3().crossVectors(a, b).normalize();
    const th = 0.022 + len * 0.04;
    // gold socket joint sunk into the body
    S.push(flat(blob(0, root, V(0.042 + len * 0.05, 0.042 + len * 0.05, 0.042 + len * 0.05)), P.goldD));
    // gold arm along the leading edge
    const tip = root.clone().addScaledVector(a, len * 0.9);
    S.push(flat(hull([...ring(root, 0.026, 0.026, 6, 'x'), ...ring(root, 0.026, 0.026, 6, 'y'),
      tip.clone().addScaledVector(nrm, 0.014), tip.clone().addScaledVector(nrm, -0.014),
      root.clone().addScaledVector(a, len * 0.5).addScaledVector(b, 0.03).addScaledVector(nrm, 0.02),
      root.clone().addScaledVector(a, len * 0.5).addScaledVector(b, 0.03).addScaledVector(nrm, -0.02)]), P.gold));
    // covert panel: solid white base so the wing reads as one shape
    const mid = a.clone().lerp(b, 0.5).normalize();
    const cv = [];
    for (const [d, l] of [[a, 0.6], [mid, 0.5], [b, 0.34]]) for (const o of [-1, 1]) cv.push(root.clone().addScaledVector(d, len * l).addScaledVector(nrm, o * th));
    for (const o of [-1, 1]) cv.push(root.clone().addScaledVector(nrm, o * th * 1.3));
    const fy = (g) => paint(g, P.feather, 'y', [root.y - len * 0.6, root.y + len * 0.8]);
    S.push(fy(hull(cv)));
    // chunky feathers fanning from leading to trailing direction, each with a gold tip
    for (let f = 0; f < nF; f++) {
      const t = f / (nF - 1);
      const d = a.clone().lerp(b, t).normalize();
      const base = root.clone().addScaledVector(a, len * 0.36 * (1 - t) + 0.02).addScaledVector(nrm, (f % 2 ? 1 : -1) * th * 0.35);
      const l = len * (0.92 - 0.36 * t);
      const [body, gtip] = featherParts(base, d, nrm, w, l, th);
      S.push(fy(body), flat(gtip, P.gold));
    }
  };
  // top pair (biggest): from the back of the head, swept up and out
  wing(V(0.15, 0.97, -0.07), V(0.65, 0.85, -0.25), V(1, 0.1, -0.3), 5, 0.36, 0.068);
  // middle pair: from the neck, out and up
  wing(V(0.09, 0.61, 0.0), V(0.8, 0.6, -0.3), V(1, -0.15, -0.3), 5, 0.28, 0.058);
  // lower pair (smallest): from the top coil, out and slightly up
  wing(V(0.215, 0.39, -0.06), V(0.85, 0.5, -0.35), V(1, -0.05, -0.35), 4, 0.2, 0.05);

  // ================= FLOATING GLOWING CRYSTALS (mirrored) =================
  const crystal = (c, r, h) => {
    S.push(flat(hull([...ring(c, r, r, 4, 'y', 0), V(c.x, c.y + h, c.z), V(c.x, c.y - h, c.z)]), P.rune));
  };
  crystal(V(0.44, 0.52, 0.14), 0.045, 0.08);
  crystal(V(0.4, 0.84, 0.16), 0.032, 0.058);
  crystal(V(0.43, 0.2, 0.3), 0.03, 0.05);
  return assemble([...C, ...HC], [...S, ...HS]);
}

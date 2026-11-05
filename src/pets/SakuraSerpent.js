// Sakura Serpent (Secret): pink faceted serpent on a symmetric coil, white five-petal blossom hood,
// petal shards along the spine, jade gem + scales, silk ribbon bow, glowing jade patterns, floating petals and jade orbs.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  pink:   { i: 0, top: '#FF94C2', bot: '#DE4A86' },
  pinkS:  { i: 1, top: '#FA84B6', bot: '#C93A75' },
  belly:  { i: 2, top: '#FFEFF4', bot: '#FBC3D7' },
  hood:   { i: 3, top: '#FFFFFF', bot: '#F3E6EE' },
  tip:    { i: 4, top: '#FFA6CC', bot: '#FF5C9E' },
  glow:   { i: 5, top: '#DFFFF4', bot: '#45F2BD', glow: true },
  jade:   { i: 6, top: '#6EE8B2', bot: '#12895A' },
  ribbon: { i: 7, top: '#7CF0BE', bot: '#159C66' },
  eye:    { i: 8, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 9, top: '#FFFFFF', bot: '#F1F1F4' },
  mouth:  { i: 10, top: '#5A1830', bot: '#3A0E1E' },
  brow:   { i: 11, top: '#E8609A', bot: '#B32E66' },
  tongue: { i: 12, top: '#F2434A', bot: '#B3141F' },
  gold:   { i: 13, top: '#FFE27A', bot: '#E8A51C' },
  petal:  { i: 14, top: '#FFD6E7', bot: '#FF9CC6' },
  petalB: { i: 15, top: '#FF7AB6', bot: '#E4669E' },
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

// flat faceted petal: base point, radial dir d, thickness normal n; profile [[u, halfWidth]] in fractions of L/W
function petal(base, d, n, L, W, th, prof = [[0, 0.25], [0.4, 1], [0.78, 0.9], [1, 0.35]]) {
  d = d.clone().normalize(); n = n.clone().normalize();
  const s = new THREE.Vector3().crossVectors(d, n).normalize();
  const pts = [];
  for (const [u, w] of prof) for (const sx of [-1, 1]) for (const sn of [-1, 1]) {
    pts.push(base.clone().addScaledVector(d, u * L).addScaledVector(s, sx * w * W).addScaledVector(n, sn * th * (1 - 0.5 * u)));
  }
  return hull(pts);
}

// overlapping body-scale petal: body + two notched pink tip lobes; d = pointing dir, n = surface normal
function scalePetal(base, d, n, L, W, th, swBody, swTip, tipW = 1) {
  d = d.clone().normalize(); n = n.clone().normalize();
  const s = new THREE.Vector3().crossVectors(d, n).normalize();
  const at = (u, v, h) => base.clone().addScaledVector(d, u * L).addScaledVector(s, v * W).addScaledVector(n, h);
  const body = [];
  for (const [u, w] of [[0, 0.3], [0.35, 0.95], [0.62, 1], [0.75, 0.9]]) for (const sx of [-1, 1]) for (const h of [-th, th]) body.push(at(u, sx * w, h));
  const out = [paint(hull(body), swBody, 'flat')];
  for (const sx of [-1, 1]) {
    const q = [];
    for (const [u, a, b] of [[0.75, 0.04, 0.9], [0.9, 0.08 * tipW, 0.78 * (0.6 + 0.4 * tipW)], [1, 0.25 * tipW, 0.55 * tipW], [0.94, 0.04, 0.1]])
      for (const h of [-th * 0.8, th * 0.8]) { q.push(at(u, sx * a, h)); q.push(at(u, sx * b, h)); }
    out.push(paint(hull(q), swTip, 'flat'));
  }
  return out;
}

// one hood petal in the (roughly) XY plane, cupped forward. returns [white body, two pink notched tip lobes]
function hoodPetal(c, ang, R0, L, W, th, cup) {
  const d = V(Math.sin(ang), Math.cos(ang), 0), s = V(Math.cos(ang), -Math.sin(ang), 0);
  const at = (u, v, dz) => c.clone().addScaledVector(d, R0 + u).addScaledVector(s, v).add(V(0, 0, dz + cup * (u / L) * (u / L)));
  const body = [], back = [];
  for (const [u, w] of [[0, 0.3], [0.3 * L, 0.85], [0.55 * L, 1], [0.74 * L, 0.92]])
    for (const sx of [-1, 1]) { body.push(at(u, sx * w * W, th), at(u, sx * w * W, 0)); back.push(at(u, sx * w * W, -th), at(u, sx * w * W, 0)); }
  const lobes = [];
  for (const sx of [-1, 1]) {
    const q = [];
    for (const [u, a, b] of [[0.74 * L, 0.04, 0.92], [0.9 * L, 0.1, 0.8], [L, 0.28, 0.55], [0.93 * L, 0.04, 0.1]])
      for (const sz of [-1, 1]) { q.push(at(u, sx * a * W, sz * th * 0.85)); q.push(at(u, sx * b * W, sz * th * 0.85)); }
    lobes.push(hull(q));
  }
  // glowing veins on front and back faces
  const veins = [];
  for (const sz of [1, -1]) {
    const q = [];
    for (const [u, w] of [[0.12 * L, 0.012], [0.62 * L, 0.02]]) for (const sx of [-1, 1]) {
      q.push(at(u, sx * w, sz * (th + 0.009))); q.push(at(u, sx * w, sz * (th - 0.004)));
    }
    q.push(at(0.7 * L, 0, sz * (th + 0.006)));
    veins.push(paint(hull(q), P.glow, 'flat'));
  }
  return [paint(hull(body), P.hood, 'y', [-10, -9]), paint(hull(back), P.petalB, 'y', [-10, -9]), ...lobes.map((g) => paint(g, P.tip, 'flat')), ...veins];
}

export function buildGeometry() {
  const C = [], S = [];
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= COIL BASE (two stacked concentric rings: chunky 6-sided cross-section, mirror-symmetric) =================
  // profile k0 outer-upper, k1 top-outer, k2 top-inner, k3 inner, k4 bottom-inner, k5 bottom-outer; strip k5->k0 = outer side
  const prof0 = [[0.135, 0.055], [0.0, 0.125], [-0.125, 0.065], [-0.13, -0.06], [0.0, -0.12], [0.145, -0.055]];
  C.push(paintTris(coil(0.12, 0.29, prof0, 12), (c, n, m) => {
    if (m.k === 5) return m.apex === 'up' ? P.glow : P.pink;
    if (m.k === 4 || m.k === 3) return P.belly;
    return m.apex === 'up' ? P.pink : P.pinkS;
  }, 0.0, 0.25));
  const prof1 = [[0.1, 0.04], [0.0, 0.095], [-0.09, 0.05], [-0.095, -0.045], [0.0, -0.09], [0.105, -0.04]];
  C.push(paintTris(coil(0.3, 0.175, prof1, 10), (c, n, m) => {
    if (m.k === 5) return m.apex === 'up' ? P.glow : P.pink;
    if (m.k === 4 || m.k === 3) return P.belly;
    return m.apex === 'up' ? P.pink : P.pinkS;
  }, 0.2, 0.4));

  // petal scales lying along the coil, pointing back (toward the tail) and slightly outward
  const coilPetals = (R, y, n, L, W, out, phase = 0.5) => {
    for (let k = 0; k < n; k++) {
      const phi = (2 * Math.PI * (k + phase)) / n;
      if (Math.sin(phi) <= 0.01) continue; // right side only, mirrored
      const radial = V(Math.sin(phi), 0, Math.cos(phi));
      const tang = V(Math.cos(phi), 0, -Math.sin(phi)); // runs toward the back on the right side
      const nrm = radial.clone().multiplyScalar(out).add(V(0, 1, 0)).normalize();
      const base = radial.clone().multiplyScalar(R).add(V(0, y, 0));
      const d = tang.clone().addScaledVector(radial, 0.25).addScaledVector(nrm, 0.22);
      S.push(...scalePetal(base, d, nrm, L, W, 0.014, k % 2 ? P.petalB : P.hood, P.tip, 0.5));
    }
  };
  coilPetals(0.355, 0.21, 8, 0.2, 0.065, 1.0);
  coilPetals(0.215, 0.38, 6, 0.16, 0.055, 0.9, 0.0);

  // jade scales on the outer side of the coil (mirrored pairs)
  for (const phi of [Math.PI / 2, (Math.PI * 5) / 6, Math.PI / 6]) {
    const r = V(Math.sin(phi), 0, Math.cos(phi)), t = V(Math.cos(phi), 0, -Math.sin(phi));
    const c = r.clone().multiplyScalar(0.445).add(V(0, 0.16, 0));
    S.push(flat(hull([c.clone().addScaledVector(r, 0.025), c.clone().addScaledVector(t, 0.04), c.clone().addScaledVector(t, -0.04),
      c.clone().add(V(0, 0.04, 0)), c.clone().add(V(0, -0.04, 0)), c.clone().addScaledVector(r, -0.03)]), P.jade));
  }

  // ================= NECK: thick low-segment tube rising out of the back of the inner coil into the head =================
  const neckPts = [V(0, 0.28, -0.17), V(0, 0.38, -0.12), V(0, 0.5, -0.02), V(0, 0.62, 0.02), V(0, 0.73, -0.0), V(0, 0.84, 0.02)];
  const nr = (t) => 0.135 - 0.03 * t;
  const neckS = curveSamples(neckPts, 10, nr, (t) => (0.135 - 0.03 * t) * 0.95);
  C.push(paintTris(scaleTube(neckS, 8, Math.PI / 2), (c, n, m) => {
    if (m.front > 0.45) return P.belly;
    if (Math.abs(m.front) < 0.45 && m.i % 3 === 1 && m.i >= 2 && m.i < 8) return P.glow;
    return P.pink;
  }, 0.2, 0.85));
  const fine = curveSamples(neckPts, 26, nr), X = V(1, 0, 0);
  const tanAt = (i) => new THREE.Vector3().subVectors(fine[Math.min(i + 1, 25)].p, fine[Math.max(i - 1, 0)].p).normalize();
  const backAt = (i) => new THREE.Vector3().crossVectors(tanAt(i), X).normalize(); // dorsal direction (-z-ish)
  // petal scales down the spine of the neck, pointing toward the tail
  for (const [i, L, sw] of [[19, 0.13, P.hood], [14, 0.14, P.petalB], [9, 0.15, P.hood], [4, 0.15, P.petalB]]) {
    const s0 = fine[i], B = backAt(i), T = tanAt(i);
    const base = s0.p.clone().addScaledVector(B, s0.rx * 0.82);
    C.push(...scalePetal(base, T.clone().negate().addScaledVector(B, 0.3), B, L, 0.06, 0.014, sw, P.tip));
  }

  // silk ribbon around the neck with a bow at the front
  {
    const i = 13, s0 = fine[i], T = tanAt(i), Fw = backAt(i).negate();
    const r = s0.rx + 0.02;
    const band = [];
    for (const off of [-0.03, 0.03]) for (let k = 0; k < 10; k++) {
      const a = (2 * Math.PI * (k + 0.5)) / 10;
      band.push(s0.p.clone().addScaledVector(T, off).addScaledVector(X, Math.sin(a) * r).addScaledVector(Fw, Math.cos(a) * (r + (Math.cos(a) > 0 ? 0.035 : 0.0))));
    }
    C.push(flat(hull(band), P.ribbon));
    const K = s0.p.clone().addScaledVector(Fw, r + 0.05);
    C.push(flat(hull(cbox(K, 0.026, 0.024, 0.02, 0.008)), P.gold));
    // bow loops (fanned sideways, slightly forward)
    S.push(flat(hull([K.clone().add(V(0.015, 0.012, -0.012)), K.clone().add(V(0.015, -0.012, 0.012)), K.clone().add(V(0.015, 0.012, 0.012)),
      K.clone().add(V(0.13, 0.075, -0.035)), K.clone().add(V(0.14, 0.04, -0.02)), K.clone().add(V(0.12, 0.08, -0.06)),
      K.clone().add(V(0.13, -0.015, -0.04)), K.clone().add(V(0.11, -0.02, -0.02))]), P.ribbon));
    // trailing tails
    S.push(flat(hull([K.clone().add(V(0.01, -0.015, -0.005)), K.clone().add(V(0.01, -0.015, 0.012)),
      K.clone().add(V(0.06, -0.13, 0.0)), K.clone().add(V(0.085, -0.115, -0.01)), K.clone().add(V(0.075, -0.13, 0.012))]), P.ribbon));
  }

  // ================= HEAD =================
  const C0 = C, S0 = S; const HC = [], HS = [];
  { const C = HC, S = HS;
  const H = { y: 0.84, z: 0.04 };
  const FZ = H.z + 0.13;
  C.push(paint(hull([
    ...cbox(V(0, H.y + 0.01, H.z), 0.17, 0.1, 0.13, 0.045),
    ...ring(V(0, H.y + 0.125, H.z - 0.02), 0.12, 0.1, 8, 'y'),
    V(0.14, H.y + 0.11, FZ - 0.012), V(-0.14, H.y + 0.11, FZ - 0.012),
    V(0.18, H.y - 0.06, H.z + 0.02), V(-0.18, H.y - 0.06, H.z + 0.02),
  ]), P.pink, 'y', [H.y - 0.1, H.y + 0.13]));
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.035, H.z + 0.12), 0.15, 0.05, 0.08, 0.03),
    ...cbox(V(0, H.y - 0.04, H.z + 0.27), 0.115, 0.045, 0.035, 0.025),
  ]), P.pink, 'y', [H.y - 0.1, H.y + 0.13]));
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.115, H.z + 0.06), 0.13, 0.035, 0.1, 0.02),
    ...cbox(V(0, H.y - 0.105, H.z + 0.24), 0.095, 0.03, 0.045, 0.02),
    ...cbox(V(0, H.y - 0.155, H.z + 0.06), 0.09, 0.02, 0.08, 0.015),
  ]), P.belly, 'y', [H.y - 0.15, H.y - 0.08]));
  // tongue
  C.push(flat(hull([...cbox(V(0, H.y - 0.085, H.z + 0.28), 0.022, 0.007, 0.03, 0.003),
    ...cbox(V(0, H.y - 0.1, H.z + 0.33), 0.02, 0.007, 0.015, 0.003)]), P.tongue));
  S.push(flat(hull([...cbox(V(0.01, H.y - 0.1, H.z + 0.33), 0.01, 0.006, 0.012, 0.002),
    ...cbox(V(0.028, H.y - 0.112, H.z + 0.37), 0.008, 0.006, 0.01, 0.002)]), P.tongue));
  S.push(flat(hull(cbox(V(0.045, H.y + 0.008, H.z + 0.27), 0.014, 0.006, 0.012, 0.003)), P.mouth));
  // glowing cheek marks
  S.push(flat(hull(plate([[0, 0.012], [0.05, -0.004], [0.04, -0.016], [0, -0.006]], V(0.155, H.y - 0.03, 0), H.z + 0.05, H.z + 0.12)), P.glow));

  // fierce eyes
  const E = V(0.085, H.y + 0.06, 0), es = 1.15;
  const sc = (pts) => pts.map(([u, v]) => [u * es, v * es]);
  S.push(flat(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.01, FZ + 0.012)), P.white));
  S.push(flat(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), P.eye));
  S.push(flat(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.007, E.y + 0.003, 0), FZ + 0.014, FZ + 0.021)), P.white));
  S.push(paint(hull([
    V(0.02, E.y + 0.006, FZ + 0.035), V(0.022, E.y + 0.045, FZ + 0.025),
    V(0.16, E.y + 0.044, FZ - 0.0), V(0.16, E.y + 0.068, FZ - 0.015),
    V(0.02, E.y + 0.006, FZ - 0.05), V(0.022, E.y + 0.05, FZ - 0.06),
    V(0.16, E.y + 0.04, FZ - 0.08), V(0.16, E.y + 0.06, FZ - 0.09),
  ]), P.brow, 'y'));
  // jade gem on the forehead (gold setting)
  const G = V(0, H.y + 0.118, FZ - 0.02);
  C.push(flat(hull([G.clone().add(V(0, 0.035, -0.01)), G.clone().add(V(0, -0.02, 0.02)), G.clone().add(V(0.028, 0.01, 0.0)),
    G.clone().add(V(-0.028, 0.01, 0.0)), G.clone().add(V(0, 0.01, 0.03)), G.clone().add(V(0, 0.005, -0.03))]), P.jade));

  // blossom hood: five white petals fanned behind the head, cupped forward, pink notched tips
  const HCn = V(0, H.y + 0.02, H.z - 0.14);
  for (const k of [0, 1, 2]) {
    const ang = (k * 2 * Math.PI) / 5;
    const parts = hoodPetal(HCn, ang, 0.07, 0.28, 0.15, 0.018, 0.06);
    (k === 0 ? C : S).push(...parts);
  }
  C.push(paint(hull(ring(HCn, 0.13, 0.13, 10, 'z').flatMap((p) => [p.clone().add(V(0, 0, 0.02)), p.clone().add(V(0, 0, -0.025))])), P.petalB, 'y', [-10, -9]));
  C.push(flat(hull([HCn.clone().add(V(0, 0, -0.07)), ...ring(HCn.clone().add(V(0, 0, -0.03)), 0.045, 0.045, 6, 'z', 0)]), P.jade));
  }
  const piv = V(0, 0.8, 0.02), HSC = 1.18;
  for (const g of [...HC, ...HS]) { g.translate(-piv.x, -piv.y, -piv.z); g.scale(HSC, HSC, HSC); g.translate(piv.x, piv.y, piv.z); }

  // ================= FLOATING DETAILS (mirrored): petals and jade orbs =================
  const fl = [];
  fl.push(flat(petal(V(0.4, 0.62, 0.12), V(0.3, 1, 0.2), V(0.6, -0.2, 1), 0.1, 0.05, 0.012), P.tip));
  fl.push(flat(petal(V(0.47, 0.36, -0.02), V(-0.2, 1, -0.4), V(1, 0.1, 0.4), 0.09, 0.045, 0.012), P.petal));
  fl.push(paint(blob(0, V(0.5, 1.04, 0.06), V(0.032, 0.032, 0.032)), P.glow, 'flat'));
  fl.push(paint(blob(0, V(0.43, 0.82, -0.04), V(0.026, 0.026, 0.026)), P.jade, 'flat'));
  S0.push(...fl);

  return assemble([...C0, ...HC], [...S0, ...HS]);
}

// Hydra Hook (Mythic, Swamp Slam): dark green three-headed swamp serpent resting on a chunky coil.
// Lime glowing spots and markings, gold horns and trim, moss clumps and bog roots.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble, mirrorX, hash3 } from '../kit.js';

export const PALETTE = {
  green:  { i: 0, top: '#2B834A', bot: '#0F3A20' },
  greenS: { i: 1, top: '#24753F', bot: '#0C321B' },
  greenD: { i: 2, top: '#1F6A3A', bot: '#0B2A17' },
  belly:  { i: 3, top: '#CFE58A', bot: '#8FAE45' },
  bellyD: { i: 13, top: '#B9D274', bot: '#7E9B3A' },
  lime:   { i: 4, top: '#E8FF7A', bot: '#8CFF2E', glow: true },
  gold:   { i: 5, top: '#FFE04A', bot: '#D98A0C' },
  eye:    { i: 6, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 7, top: '#FFFFFF', bot: '#F1F1F4' },
  mouth:  { i: 8, top: '#3A1E14', bot: '#22100A' },
  brow:   { i: 9, top: '#246F3E', bot: '#0E3A20' },
  moss:   { i: 10, top: '#9CC243', bot: '#557A1E' },
  root:   { i: 11, top: '#8A6440', bot: '#4A311C' },
  horn:   { i: 12, top: '#FFF0B0', bot: '#E2A21A' },
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
// closed coil ring with a diamond scale grid
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
  for (let k = 0; k < M; k++) for (let i = 0; i < N; i++) {
    let A, B;
    if (k % 2 === 0) { A = [P_(i, k), P_(i + 1, k), P_(i, k + 1)]; B = [P_(i, k + 1), P_(i + 1, k + 1), P_(i + 1, k)]; }
    else { A = [P_(i, k), P_(i + 1, k), P_(i + 1, k + 1)]; B = [P_(i, k + 1), P_(i + 1, k + 1), P_(i, k)]; }
    tri(pos, meta, ...A, outOf(...A), { k, i, apex: 'up' });
    tri(pos, meta, ...B, outOf(...B), { k, i, apex: 'down' });
  }
  return finish(pos, meta);
}
// antiprism tube along samples; `side` = lateral axis of the neck (belly faces -B)
function scaleTube(samples, seg, phase, side, { capStart = 0, capEnd = 0, shift = 0.5 } = {}) {
  const n = samples.length, rings = [], frames = [];
  for (let i = 0; i < n; i++) {
    const p = samples[i].p;
    const T = new THREE.Vector3().subVectors(samples[Math.min(i + 1, n - 1)].p, samples[Math.max(i - 1, 0)].p).normalize();
    const B = new THREE.Vector3().crossVectors(T, side).normalize();
    const A = new THREE.Vector3().crossVectors(T, B).normalize();
    const r = [];
    for (let k = 0; k < seg; k++) {
      const th = phase + (2 * Math.PI * (k + shift * (i % 2))) / seg;
      r.push(p.clone().addScaledVector(A, Math.cos(th) * samples[i].rx).addScaledVector(B, Math.sin(th) * samples[i].ry));
    }
    rings.push(r); frames.push({ p, T, A, B });
  }
  const pos = [], meta = [];
  for (let i = 0; i < n - 1; i++) {
    const mid = frames[i].p.clone().add(frames[i + 1].p).multiplyScalar(0.5);
    for (let k = 0; k < seg; k++) {
      const k1 = (k + 1) % seg;
      let A, Bt;
      if (i % 2 === 0) { A = [rings[i][k], rings[i][k1], rings[i + 1][k]]; Bt = [rings[i + 1][k], rings[i + 1][k1], rings[i][k1]]; }
      else { A = [rings[i][k], rings[i][k1], rings[i + 1][k1]]; Bt = [rings[i + 1][k], rings[i + 1][k1], rings[i][k]]; }
      for (const t of [A, Bt]) {
        const cen = t[0].clone().add(t[1]).add(t[2]).divideScalar(3);
        tri(pos, meta, ...t, cen.clone().sub(mid), { i, k });
      }
    }
  }
  const cap = (i, bulge, s) => {
    const { p, T } = frames[i];
    const tip = p.clone().addScaledVector(T, bulge * s), o = T.clone().multiplyScalar(s);
    for (let k = 0; k < seg; k++) tri(pos, meta, rings[i][k], rings[i][(k + 1) % seg], tip, o, { i, cap: true });
  };
  cap(0, capStart, -1); cap(n - 1, capEnd, 1);
  const g = finish(pos, meta);
  g.userData.frames = frames;
  return g;
}
// a raised faceted disc (glow spot / scale) lying on a surface at p with normal n
function disc(p, n, r, h, sides = 6, lift = 0.0) {
  n = n.clone().normalize();
  const up = Math.abs(n.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
  const a = new THREE.Vector3().crossVectors(n, up).normalize(), b = new THREE.Vector3().crossVectors(a, n).normalize();
  const pts = [];
  for (let k = 0; k < sides; k++) {
    const t = (2 * Math.PI * k) / sides;
    const d = a.clone().multiplyScalar(Math.cos(t)).addScaledVector(b, Math.sin(t));
    pts.push(p.clone().addScaledVector(n, -h + lift).addScaledVector(d, r));
    pts.push(p.clone().addScaledVector(n, h + lift).addScaledVector(d, r * 0.72));
  }
  return hull(pts);
}

// ---------- one head, local coords: neck top at origin, facing +Z; returns {C, S} ----------
function buildHead() {
  const C = [], S = [];
  const flat = (g, sw) => paint(g, sw, 'flat');
  const H = { y: 0.0, z: 0.0 };
  const FZ = H.z + 0.13;
  const yr = [H.y - 0.1, H.y + 0.14];
  // cranium
  C.push(paint(hull([
    ...cbox(V(0, H.y + 0.01, H.z), 0.17, 0.1, 0.13, 0.045),
    ...ring(V(0, H.y + 0.125, H.z - 0.02), 0.12, 0.1, 8, 'y'),
    V(0.14, H.y + 0.11, FZ - 0.012), V(-0.14, H.y + 0.11, FZ - 0.012),
    V(0.185, H.y - 0.06, H.z + 0.02), V(-0.185, H.y - 0.06, H.z + 0.02),
  ]), P.green, 'y', yr));
  // snout
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.035, H.z + 0.12), 0.15, 0.05, 0.08, 0.03),
    ...cbox(V(0, H.y - 0.045, H.z + 0.26), 0.115, 0.045, 0.035, 0.025),
  ]), P.green, 'y', yr));
  // snout bump: raised bridge running down the muzzle
  C.push(paint(hull([
    ...cbox(V(0, H.y + 0.012, H.z + 0.15), 0.075, 0.03, 0.05, 0.02),
    ...cbox(V(0, H.y + 0.004, H.z + 0.245), 0.06, 0.022, 0.03, 0.015),
  ]), P.green, 'y', yr));
  // lower jaw (pale belly colour)
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.115, H.z + 0.06), 0.13, 0.035, 0.1, 0.02),
    ...cbox(V(0, H.y - 0.11, H.z + 0.23), 0.095, 0.03, 0.045, 0.02),
    ...cbox(V(0, H.y - 0.155, H.z + 0.06), 0.09, 0.02, 0.08, 0.015),
  ]), P.belly, 'y', [H.y - 0.17, H.y - 0.08]));
  // mouth line + small gold fangs
  C.push(flat(hull(box8(V(0, H.y - 0.083, H.z + 0.2), 0.105, 0.006, 0.075)), P.mouth));
  S.push(flat(shard(V(0.075, H.y - 0.08, H.z + 0.255), V(0, -1, 0.15), 0.014, 0.04, 4), P.white));
  // nostrils
  S.push(flat(hull(box8(V(0.045, H.y + 0.003, H.z + 0.273), 0.014, 0.006, 0.012)), P.mouth));
  // eyes
  const E = V(0.087, H.y + 0.058, 0), es = 1.22;
  const sc = (pts) => pts.map(([u, v]) => [u * es, v * es]);
  S.push(flat(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.01, FZ + 0.012)), P.white));
  S.push(flat(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), P.eye));
  S.push(flat(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.007, E.y + 0.003, 0), FZ + 0.014, FZ + 0.021)), P.white));
  // heavy protruding brow slanting down to the centre
  S.push(paint(hull([
    V(0.018, E.y + 0.008, FZ + 0.05), V(0.02, E.y + 0.056, FZ + 0.038),
    V(0.175, E.y + 0.05, FZ + 0.012), V(0.175, E.y + 0.09, FZ - 0.006),
    V(0.018, E.y + 0.008, FZ - 0.05), V(0.02, E.y + 0.065, FZ - 0.06),
    V(0.175, E.y + 0.046, FZ - 0.08), V(0.175, E.y + 0.08, FZ - 0.09),
  ]), P.brow, 'y'));
  // big swept-back horns (ivory -> gold), gold collar ring at the base
  S.push(paint(tube(curveSamples(
    [V(0.1, H.y + 0.1, H.z - 0.02), V(0.15, H.y + 0.19, H.z - 0.07), V(0.19, H.y + 0.26, H.z - 0.16), V(0.2, H.y + 0.29, H.z - 0.27)],
    5, (t) => 0.05 * (1 - t) + 0.006), { seg: 6, capEnd: 0.03 }), P.horn, 'len'));
  S.push(flat(disc(V(0.103, H.y + 0.1, H.z - 0.02), V(0.35, 1, -0.2), 0.058, 0.012, 6), P.gold));
  // small back horns
  S.push(paint(tube(curveSamples(
    [V(0.15, H.y + 0.0, H.z - 0.08), V(0.2, H.y + 0.04, H.z - 0.15), V(0.22, H.y + 0.06, H.z - 0.22)],
    4, (t) => 0.03 * (1 - t) + 0.005), { seg: 5, capEnd: 0.02 }), P.horn, 'len'));
  // glowing markings: forehead chevron + crown spots
  C.push(flat(hull([
    V(0, H.y + 0.118, H.z + 0.075), V(0, H.y + 0.14, H.z + 0.07),
    V(0.058, H.y + 0.122, H.z - 0.015), V(0.054, H.y + 0.145, H.z - 0.015),
    V(-0.058, H.y + 0.122, H.z - 0.015), V(-0.054, H.y + 0.145, H.z - 0.015),
    V(0, H.y + 0.122, H.z - 0.105), V(0, H.y + 0.145, H.z - 0.1),
  ]), P.lime));
  S.push(flat(disc(V(0.16, H.y + 0.04, H.z - 0.02), V(1, 0.25, 0), 0.026, 0.008, 6), P.lime));
  S.push(flat(disc(V(0.13, H.y - 0.04, H.z + 0.12), V(1, 0, 0.3), 0.018, 0.006, 6), P.lime));
  // crest shards down the back of the head
  for (const [z, y, dz, l] of [[-0.06, 0.12, -0.8, 0.1], [-0.13, 0.06, -1.2, 0.1]])
    C.push(flat(shard(V(0, H.y + y, H.z + z), V(0, 1, dz), 0.055, l, 4, 0.4), P.greenD));
  return { C, S };
}

function box8(c, hx, hy, hz) {
  const pts = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) pts.push(V(c.x + sx * hx, c.y + sy * hy, c.z + sz * hz));
  return pts;
}
function xform(g, yaw, s, t) {
  g.scale(s, s, s);
  g.applyMatrix4(new THREE.Matrix4().makeRotationY(yaw));
  g.translate(t.x, t.y, t.z);
  return g;
}

export function buildGeometry() {
  const C = [], S = [];
  const flat = (g, sw) => paint(g, sw, 'flat');
  const spotHash = (c) => hash3(Math.abs(c.x).toFixed(2), (c.y * 3).toFixed(2), c.z.toFixed(2));

  // ================= COIL BASE =================
  const prof0 = [[0.15, 0.035], [0.11, 0.105], [0.02, 0.14], [-0.09, 0.105], [-0.135, 0.01], [-0.1, -0.1], [0.1, -0.14], [0.155, -0.045]];
  C.push(paintTris(coil(0.14, 0.3, prof0, 20), (c, n, m) => {
    if (m.k === 7) return m.apex === 'up' ? P.gold : P.green;
    if (m.k >= 4 && m.k <= 6) return P.belly;
    return m.apex === 'up' ? P.green : P.greenS;
  }, 0.0, 0.29));
  const prof1 = [[0.11, 0.025], [0.085, 0.08], [0.01, 0.1], [-0.075, 0.075], [-0.095, 0.0], [-0.06, -0.06], [0.075, -0.085], [0.11, -0.035]];
  C.push(paintTris(coil(0.31, 0.175, prof1, 16), (c, n, m) => {
    if (m.k === 7 && m.apex === 'up') return P.gold;
    if (m.k === 6) return P.belly;
    return m.apex === 'up' ? P.green : P.greenS;
  }, 0.2, 0.41));

  // glowing spots on the coils (raised hex discs)
  const coilSpot = (phi, R, cy, dr, dy, r, side) => {
    const p = V(Math.sin(phi) * (R + dr), cy + dy, Math.cos(phi) * (R + dr));
    const n = V(Math.sin(phi) * dr, dy, Math.cos(phi) * dr).normalize();
    (side ? S : C).push(flat(disc(p, n, r, 0.012, 6), P.lime));
  };
  coilSpot(0, 0.3, 0.14, 0.135, 0.075, 0.04, false);
  coilSpot(Math.PI, 0.3, 0.14, 0.135, 0.075, 0.04, false);
  for (const a of [0.55, 1.25, 1.95, 2.6]) coilSpot(a, 0.3, 0.14, 0.135, 0.075, 0.04, true);
  for (const a of [0.9, 1.6, 2.3]) coilSpot(a, 0.3, 0.14, 0.152, -0.015, 0.03, true);
  coilSpot(0, 0.175, 0.31, 0.1, 0.05, 0.03, false);
  for (const a of [0.8, 1.7, 2.5]) coilSpot(a, 0.175, 0.31, 0.1, 0.05, 0.03, true);

  // ================= NECKS + HEADS =================
  const neck = (pts, side, front, r0, r1, target) => {
    const ss = curveSamples(pts, 12, (t) => r0 + (r1 - r0) * t);
    const g = scaleTube(ss, 8, Math.PI / 2, side, { shift: 0 });
    const frames = g.userData.frames;
    paintTris(g, (c, n, m) => ((m.k === 3 || m.k === 4) && !m.cap ? (m.i % 2 ? P.bellyD : P.belly) : (m.k === 0 || m.k === 7 ? P.greenS : P.green)), 0.25, 1.0);
    target.push(g);
    // glowing spots along both flanks of the neck
    for (const i of [4, 8]) {
      const f = frames[i];
      for (const sgn of [1, -1]) {
        const dir = f.A.clone().multiplyScalar(sgn * 0.8).addScaledVector(f.B, 0.6).normalize(); // back-flank
        const p = f.p.clone().addScaledVector(dir, ss[i].rx * 0.97);
        target.push(flat(disc(p, dir, 0.026 - i * 0.001, 0.01, 6), P.lime));
      }
    }
    // dorsal ridge shards down the back of the neck
    for (const i of [3, 6, 9]) {
      const f = frames[i];
      target.push(flat(shard(f.p.clone().addScaledVector(f.B, ss[i].rx * 0.85), f.B.clone().addScaledVector(f.T, -0.5), 0.055, 0.12, 4, 0.45), P.greenD));
    }
    { const f = frames[9]; target.push(flat(disc(f.p, f.T, ss[9].rx * 1.12, 0.018, 8), P.gold)); }
    return { top: ss[ss.length - 1].p };
  };
  // centre neck
  neck([V(0, 0.24, -0.06), V(0, 0.42, 0.0), V(0, 0.58, 0.05), V(0, 0.74, 0.0), V(0, 0.88, -0.02), V(0, 0.98, 0.02)],
    V(1, 0, 0), V(0, 0, 1), 0.13, 0.1, C);
  const hc = buildHead();
  const HS = 1.08, HP = V(0, 1.02, 0.04);
  for (const g of hc.C) C.push(xform(g, 0, HS, HP));
  for (const g of hc.S) S.push(xform(g, 0, HS, HP));
  // side necks (right side; mirrored automatically)
  const yaw = 0.42;
  neck([V(0.05, 0.24, -0.05), V(0.15, 0.42, 0.0), V(0.27, 0.57, 0.04), V(0.38, 0.68, 0.03), V(0.44, 0.79, 0.02), V(0.47, 0.87, 0.05)],
    V(Math.cos(yaw), 0, -Math.sin(yaw)), V(Math.sin(yaw), 0, Math.cos(yaw)), 0.12, 0.095, S);
  const hs = buildHead();
  const SS = 0.97, SP = V(0.48, 0.9, 0.07);
  for (const g of [...hs.C, ...hs.S, ...hs.S.map((q) => mirrorX(q))]) S.push(xform(g, yaw, SS, SP));

  // ================= SWAMP DETAILS =================
  const at = (phi, d, y) => V(Math.sin(phi) * d, y, Math.cos(phi) * d);
  // moss patches: flattened clump on the coil top + drapes hanging over the outer face
  const moss = (phi, R, cy, w, side) => {
    const T = side ? S : C;
    T.push(paint(blob(0, at(phi, R + 0.06, cy + 0.12), V(w, 0.045, w * 0.9), { jitter: 0.3 }), P.moss, 'y'));
    for (const [dp, l] of [[-0.12, 0.09], [0.0, 0.12], [0.12, 0.08]]) {
      if (!side && dp !== 0) continue;
      const b = at(phi + dp, R + 0.13, cy + 0.09), d = at(phi + dp, 0.5, 0).add(V(0, -1, 0));
      T.push(paint(shard(b, d, 0.045, l, 4, 0.45), P.moss, 'y'));
    }
  };
  moss(Math.PI, 0.3, 0.14, 0.12, false);
  moss(0.75, 0.3, 0.14, 0.1, true);
  moss(2.1, 0.3, 0.14, 0.11, true);
  moss(1.4, 0.175, 0.31, 0.075, true);
  // bog roots: gnarled roots wrapped tight over the lower coil, gripping the ground at its base
  const root = (phi, r, sway) => {
    const prof = [[-0.04, 0.14, 0, 1], [0.05, 0.136, 0.3, 1], [0.115, 0.1, 0.72, 0.7], [0.155, 0.03, 1, 0.12],
      [0.155, -0.045, 1, -0.28], [0.125, -0.115, 0.75, -0.66]];
    const pts = prof.map(([dr, dy, nx, ny], j) => {
      const nl = Math.hypot(nx, ny), off = r * 0.72;
      return at(phi + sway * (j / (prof.length - 1)), 0.3 + dr + (nx / nl) * off, Math.max(r * 0.8, 0.14 + dy + (ny / nl) * off));
    });
    S.push(paint(tube(curveSamples(pts, 8, (t) => r * (1 - 0.25 * t)), { seg: 5, capEnd: 0.02, scale: (i) => (i % 2 ? 1.14 : 0.92) }),
      P.root, 'len'));
    // short gnarled tips splayed flat at the coil's foot
    const e = pts[pts.length - 1], ph = phi + sway;
    for (const dp of [-0.25, 0.25]) {
      const d = at(ph + dp, 1, 0).add(V(0, -0.35, 0));
      S.push(paint(shard(V(e.x, Math.max(e.y, 0.03), e.z), d, 0.026, 0.065, 4, 0.6), P.root, 'flat'));
    }
  };
  root(1.2, 0.036, 0.16);
  root(2.45, 0.034, -0.14);

  return assemble(C, S);
}

// Ember Hydra (Godly, Round 5 – Volcano Crater): orange three-headed serpent on a faceted coil,
// yellow belly plates, flame manes up each neck, obsidian plates with glowing lava seams,
// gold collar/crowns/trim and glowing rune tablets.
import { V, THREE, hull, cbox, ring, plate, shard, tube, curveSamples, paint, assemble, mirrorX } from '../kit.js';

export const PALETTE = {
  orange:  { i: 0, top: '#FFA247', bot: '#D9551A' },
  orangeS: { i: 1, top: '#F38C34', bot: '#C44A14' },
  belly:   { i: 2, top: '#FFF09A', bot: '#FFCF4A' },
  gold:    { i: 3, top: '#FFD95A', bot: '#C7850F' },
  obsid:   { i: 4, top: '#3A3248', bot: '#15121C' },
  lava:    { i: 5, top: '#FFD25A', bot: '#FF6A00', glow: true },
  rune:    { i: 6, top: '#FFE45A', bot: '#FF8A12', glow: true },
  eye:     { i: 7, top: '#1A1416', bot: '#0C0A0B' },
  white:   { i: 8, top: '#FFFFFF', bot: '#F1F1F4' },
  mouth:   { i: 9, top: '#5A1E10', bot: '#3A120A' },
  brow:    { i: 10, top: '#E8742A', bot: '#B8441A' },
  flame:   {
    i: 11, glow: true,
    draw(g, x, y) {
      const gr = g.createLinearGradient(0, y + 16, 0, y + 112);
      gr.addColorStop(0, '#FFF29A'); gr.addColorStop(0.35, '#FFC233');
      gr.addColorStop(0.7, '#FF7A12'); gr.addColorStop(1, '#E8300F');
      g.fillStyle = '#FFF29A'; g.fillRect(x, y, 128, 16);
      g.fillStyle = gr; g.fillRect(x, y + 16, 128, 96);
      g.fillStyle = '#E8300F'; g.fillRect(x, y + 112, 128, 16);
    },
  },
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
// gradient along a direction (t=0 at base, 1 at base+dir*len): used for flames
function paintAlong(g, sw, base, dir, len) {
  const p = g.attributes.position, uv = [], d = dir.clone().normalize(), v = V(0, 0, 0);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    uv.push(...swUV(sw, v.clone().sub(base).dot(d) / len));
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
const flat = (g, sw) => paint(g, sw, 'flat');
// flame blade: wide along wdir, thin along tdir, tip hooked toward +wdir
function blade(b, dir, wdir, tdir, w, len, th) {
  const d = dir.clone().normalize(), W = wdir.clone().normalize(), Tn = tdir.clone().normalize();
  const pts = [];
  for (const sw of [-1, 1]) for (const st of [-1, 1]) pts.push(b.clone().addScaledVector(W, sw * w).addScaledVector(Tn, st * th));
  for (const st of [-1, 1]) pts.push(b.clone().addScaledVector(d, len * 0.55).addScaledVector(W, w * 0.75).addScaledVector(Tn, st * th * 0.6));
  pts.push(b.clone().addScaledVector(d, len).addScaledVector(W, w * 0.9));
  return hull(pts);
}
// thin bar (rune stroke) in local xy plane, extruded along +z from z0 to z1
function bar(x0, y0, x1, y1, w, z0, z1) {
  const d = V(x1 - x0, y1 - y0, 0).normalize(), n = V(-d.y, d.x, 0).multiplyScalar(w);
  const pts = [];
  for (const [x, y] of [[x0 - d.x * w * 0.5, y0 - d.y * w * 0.5], [x1 + d.x * w * 0.5, y1 + d.y * w * 0.5]])
    for (const s of [-1, 1]) for (const z of [z0, z1]) pts.push(V(x + n.x * s, y + n.y * s, z));
  return hull(pts);
}
// apply a rotation (yaw about Y, then pitch about X first) + uniform scale + translation to geometries
function place(gs, pos, yaw = 0, sc = 1, pitch = 0) {
  const m = new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ')), V(sc, sc, sc));
  for (const g of gs) { g.applyMatrix4(m); g.computeVertexNormals(); }
  return gs;
}

// Coil ring with a diamond (antiprism) scale grid. prof = [[dr, dy], ...]
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
      tri(pos, meta, ...A, outOf(...A), { k, apex: 'up', i });
      tri(pos, meta, ...B, outOf(...B), { k, apex: 'down', i });
    }
  }
  return finish(pos, meta);
}

// neck frame: T tangent, F belly (front) direction = +z projected off T, A side = F x T
function frameAt(samples, i) {
  const n = samples.length;
  const T = new THREE.Vector3().subVectors(samples[Math.min(i + 1, n - 1)].p, samples[Math.max(i - 1, 0)].p).normalize();
  const F = V(0, 0, 1).addScaledVector(T, -T.z).normalize();
  const A = new THREE.Vector3().crossVectors(T, F).normalize();
  return { T, F, A };
}
// antiprism tube (odd rings shifted half a step)
function scaleTube(samples, seg, phase, { capStart = 0, capEnd = 0 } = {}) {
  const n = samples.length, rings = [], frames = [];
  for (let i = 0; i < n; i++) {
    const p = samples[i].p, { T, F, A } = frameAt(samples, i);
    const r = [];
    for (let k = 0; k < seg; k++) {
      const th = phase + (2 * Math.PI * (k + 0.5 * (i % 2))) / seg;
      r.push(p.clone().addScaledVector(A, Math.cos(th) * samples[i].rx).addScaledVector(F, Math.sin(th) * samples[i].ry));
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
      tris.forEach((t, j) => {
        const cen = t[0].clone().add(t[1]).add(t[2]).divideScalar(3);
        tri(pos, meta, ...t, cen.sub(mid), { i, alt: (k + j) % 2 });
      });
    }
  }
  const cap = (i, bulge, s) => {
    const { p, T } = frames[i];
    const tip = p.clone().addScaledVector(T, bulge * s), o = T.clone().multiplyScalar(s);
    for (let k = 0; k < seg; k++) tri(pos, meta, rings[i][k], rings[i][(k + 1) % seg], tip, o, { i, alt: 0 });
  };
  cap(0, capStart, -1); cap(n - 1, capEnd, 1);
  return finish(pos, meta);
}

// ---------- neck: scaled tube + belly plates + flame mane ----------
function neck(out, pts, r0, r1, nPlates, nFlames, flameScale, { nTube = 11, flameFrom = 3, plateFrom = 4, N = 30 } = {}) {
  const nr = (t) => r0 + (r1 - r0) * t;
  const ss = curveSamples(pts, nTube, nr);
  out.push(paintTris(scaleTube(ss, 9, Math.PI / 2), () => P.orange, 0.0, 1.0));
  const fine = curveSamples(pts, N, nr);
  // segmented yellow belly plates down the front
  const step = Math.floor((N - 3 - plateFrom) / nPlates);
  for (let q = 0; q < nPlates; q++) {
    const i = plateFrom + q * step, pp = [];
    for (const [j] of [[i], [i + step]]) {
      const jj = Math.min(j, N - 1), s0 = fine[jj], { F, A } = frameAt(fine, jj), r = s0.rx, w = r * 0.66;
      for (const sx of [-1, 1]) {
        pp.push(s0.p.clone().addScaledVector(A, sx * w).addScaledVector(F, r * 0.8));
        pp.push(s0.p.clone().addScaledVector(A, sx * w * 0.7).addScaledVector(F, r * 1.1));
        pp.push(s0.p.clone().addScaledVector(A, sx * w).addScaledVector(F, r * 0.3));
      }
    }
    const cen = pp.reduce((a, b) => a.add(b), V(0, 0, 0)).divideScalar(pp.length);
    const T = fine[Math.min(i + step, N - 1)].p.clone().sub(fine[i].p).normalize();
    for (const v of pp) { const d = v.clone().sub(cen).dot(T); v.addScaledVector(T, -d * 0.16); }
    out.push(paint(hull(pp), P.belly, 'y'));
  }
  // ornate gold neck band just below the head
  {
    const bp = [];
    for (const j of [N - 11, N - 9]) {
      const s0 = fine[j], { F, A } = frameAt(fine, j), r = s0.rx * 1.14;
      for (let k = 0; k < 9; k++) {
        const th = (2 * Math.PI * k) / 9 + Math.PI / 2;
        bp.push(s0.p.clone().addScaledVector(A, Math.cos(th) * r).addScaledVector(F, Math.sin(th) * r));
      }
    }
    out.push(paint(hull(bp), P.gold, 'y'));
    const s0 = fine[N - 10], { F } = frameAt(fine, N - 10);
    const gp = s0.p.clone().addScaledVector(F, s0.rx * 1.14 + 0.004);
    out.push(flat(hull([gp.clone().add(V(0, 0.022, 0)), gp.clone().add(V(0, -0.022, 0)), gp.clone().addScaledVector(V(F.z, 0, -F.x), 0.016),
      gp.clone().addScaledVector(V(F.z, 0, -F.x), -0.016), gp.clone().addScaledVector(F, 0.014)]), P.rune));
  }
  // flame mane up the back: wide flat flame blades (thin sideways), hooked upward; side licks fan out
  for (let q = 0; q < nFlames; q++) {
    const i = flameFrom + Math.round(q * (N - 4 - flameFrom) / Math.max(1, nFlames - 1));
    const s0 = fine[Math.min(i, N - 1)], { T, F, A } = frameAt(fine, Math.min(i, N - 1)), r = s0.rx;
    const k = flameScale * (0.8 + 0.3 * Math.sin(Math.PI * (q + 0.5) / nFlames));
    const back = s0.p.clone().addScaledVector(F, -r * 0.7);
    const d0 = F.clone().multiplyScalar(-0.85).addScaledVector(T, 0.45);
    out.push(paintAlong(blade(back, d0, T, A, 0.06 * k, 0.17 * k, 0.018), P.flame, back, d0, 0.17 * k));
    // flame licks growing up both outer sides (visible from the front)
    for (const s of [-1, 1]) {
      const b = s0.p.clone().addScaledVector(F, -r * 0.15).addScaledVector(A, s * r * 0.8);
      const d = F.clone().multiplyScalar(-0.25).addScaledVector(T, 0.75).addScaledVector(A, s * 0.75);
      const th = new THREE.Vector3().crossVectors(d, T).normalize();
      out.push(paintAlong(blade(b, d, T, th, 0.05 * k, 0.14 * k, 0.014), P.flame, b, d, 0.14 * k));
    }
  }
  return fine;
}

// ---------- head (local: centre at origin, faces +z), returns full symmetric part list ----------
function head() {
  const C = [], S = [];
  const lo = -0.16, hi = 0.14;
  C.push(paint(hull([
    ...cbox(V(0, 0.01, 0), 0.17, 0.1, 0.13, 0.045),
    ...ring(V(0, 0.125, -0.02), 0.12, 0.1, 8, 'y'),
    V(0.14, 0.11, 0.118), V(-0.14, 0.11, 0.118),
    V(0.185, -0.06, 0.02), V(-0.185, -0.06, 0.02),
  ]), P.orange, 'y', [lo, hi]));
  // snout
  C.push(paint(hull([
    ...cbox(V(0, -0.035, 0.12), 0.15, 0.05, 0.08, 0.03),
    ...cbox(V(0, -0.04, 0.27), 0.115, 0.045, 0.035, 0.025),
  ]), P.orange, 'y', [lo, hi]));
  // lower jaw (yellow belly colour)
  C.push(paint(hull([
    ...cbox(V(0, -0.115, 0.06), 0.13, 0.035, 0.1, 0.02),
    ...cbox(V(0, -0.105, 0.24), 0.095, 0.03, 0.045, 0.02),
    ...cbox(V(0, -0.155, 0.06), 0.09, 0.02, 0.08, 0.015),
  ]), P.belly, 'y', [-0.17, -0.08]));
  // mouth seam + nostrils
  S.push(flat(hull([V(0.1, -0.082, 0.3), V(0.1, -0.09, 0.3), V(0.152, -0.08, 0.1), V(0.152, -0.09, 0.1),
    V(0.09, -0.086, 0.27), V(0.14, -0.085, 0.09)]), P.mouth));
  S.push(flat(hull(cbox(V(0.045, 0.006, 0.307), 0.016, 0.007, 0.006, 0.003)), P.mouth));
  // fierce eyes on the cranium front
  const FZ = 0.13, E = V(0.085, 0.06, 0), es = 1.15;
  const sc = (pts) => pts.map(([u, v]) => [u * es, v * es]);
  S.push(flat(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.01, FZ + 0.012)), P.white));
  S.push(flat(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), P.eye));
  S.push(flat(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.007, E.y + 0.003, 0), FZ + 0.014, FZ + 0.021)), P.white));
  // heavy brow
  S.push(paint(hull([
    V(0.02, E.y + 0.006, FZ + 0.038), V(0.022, E.y + 0.048, FZ + 0.028),
    V(0.165, E.y + 0.044, FZ + 0.0), V(0.165, E.y + 0.07, FZ - 0.015),
    V(0.02, E.y + 0.006, FZ - 0.05), V(0.022, E.y + 0.05, FZ - 0.06),
    V(0.165, E.y + 0.04, FZ - 0.08), V(0.165, E.y + 0.06, FZ - 0.09),
  ]), P.brow, 'y'));
  // gold crown: band + three points, rune gem in front
  C.push(paint(hull([...ring(V(0, 0.115, -0.02), 0.115, 0.095, 8, 'y'), ...ring(V(0, 0.165, -0.025), 0.105, 0.085, 8, 'y')]), P.gold, 'y', [0.11, 0.17]));
  C.push(paint(shard(V(0, 0.15, 0.06), V(0, 1, 0.15), 0.035, 0.1, 4, 0.5), P.gold, 'y'));
  S.push(paint(shard(V(0.07, 0.15, 0.035), V(0.25, 1, 0.05), 0.03, 0.075, 4, 0.5), P.gold, 'y'));
  C.push(flat(hull([V(0, 0.155, 0.081), V(0.016, 0.14, 0.078), V(-0.016, 0.14, 0.078), V(0, 0.125, 0.079),
    V(0, 0.14, 0.092)]), P.rune));
  // obsidian horns sweeping back
  S.push(paint(shard(V(0.11, 0.11, -0.05), V(0.45, 0.55, -1), 0.035, 0.16, 4, 0.8), P.obsid, 'y'));
  // flame crest at the back of the skull (continues the neck mane)
  for (const [b, d, w, l] of [
    [V(0, 0.14, -0.06), V(0, 0.35, -1), 0.05, 0.15],
    [V(0, 0.06, -0.11), V(0, 0.1, -1), 0.05, 0.14],
  ]) C.push(paintAlong(blade(b, d, V(0, 1, 0), V(1, 0, 0), w, l, 0.018), P.flame, b, d, l));
  // flame tuft rising behind the crown
  { const b = V(0, 0.15, -0.07), d = V(0, 1, -0.3); C.push(paintAlong(blade(b, d, V(0, 0, -1), V(1, 0, 0), 0.045, 0.125, 0.016), P.flame, b, d, 0.125)); }
  { const b = V(0.055, 0.14, -0.06), d = V(0.45, 1, -0.3), th = new THREE.Vector3().crossVectors(d, V(0, 0, -1)).normalize();
    S.push(paintAlong(blade(b, d, V(0, 0, -1), th, 0.035, 0.11, 0.014), P.flame, b, d, 0.11)); }
  return [...C, ...S, ...S.map(mirrorX)];
}

// rune tablet (local, faces +z, centre origin): gold frame, obsidian face, glowing glyph
function tablet(w, h, glyph) {
  const out = [];
  out.push(paint(hull(plate([[-w, -h], [w, -h], [w * 1.1, h * 0.6], [0, h * 1.2], [-w * 1.1, h * 0.6]], V(0, 0, 0), -0.03, 0.012)), P.gold, 'y'));
  const iw = w * 0.78, ih = h * 0.8;
  out.push(paint(hull(plate([[-iw, -ih], [iw, -ih], [iw * 1.1, ih * 0.6], [0, ih * 1.2], [-iw * 1.1, ih * 0.6]], V(0, 0, 0), 0.0, 0.019)), P.obsid, 'y'));
  const sw = 0.009;
  for (const [x0, y0, x1, y1] of glyph(iw, ih)) out.push(flat(bar(x0, y0, x1, y1, sw, 0.015, 0.025), P.rune));
  return out;
}
const algiz = (w, h) => [[0, -h * 0.7, 0, h * 0.8], [0, h * 0.05, -w * 0.6, h * 0.65], [0, h * 0.05, w * 0.6, h * 0.65], [-w * 0.45, -h * 0.55, w * 0.45, -h * 0.55]];
const dagaz = (w, h) => [[-w * 0.55, -h * 0.6, -w * 0.55, h * 0.6], [w * 0.55, -h * 0.6, w * 0.55, h * 0.6], [-w * 0.55, h * 0.6, w * 0.55, -h * 0.6], [-w * 0.55, -h * 0.6, w * 0.55, h * 0.6]];

export function buildGeometry() {
  const C = [], S = [];

  // ================= COIL BASE: one body ring, plain faceted orange, yellow belly underneath =================
  const R0 = 0.255, CY0 = 0.11, PS = 0.85;
  const prof0 = [[0.14, 0.035], [0.105, 0.1], [0.02, 0.13], [-0.09, 0.1], [-0.13, 0.01], [-0.1, -0.1], [0.1, -0.13], [0.145, -0.045]]
    .map(([a, b]) => [a * PS, b * PS]);
  C.push(paintTris(coil(CY0, R0, prof0, 16), (c, m) => (m.k >= 4 && m.k <= 6 ? P.belly : P.orange), 0.0, 0.23));
  // inner, higher coil loop stacked inside the ring, hugging the body base (fills the centre)
  {
    const prof1 = [[0.105, 0.025], [0.08, 0.075], [0.01, 0.095], [-0.07, 0.07], [-0.09, 0.0], [-0.06, -0.06], [0.07, -0.08], [0.105, -0.035]]
      .map(([a, b]) => [a * 0.88, b * 0.88]);
    C.push(paintTris(coil(0.205, 0.135, prof1, 14), (c, m) => (m.k === 6 ? P.belly : P.orange), 0.1, 0.3));
  }

  // tail tip tucking out at the back, curling up, with a flame tip
  {
    const tp = [V(0, 0.075, -0.27), V(0, 0.06, -0.38), V(0, 0.055, -0.47), V(0, 0.08, -0.54), V(0, 0.13, -0.56)];
    const ts = curveSamples(tp, 7, (t) => 0.075 * (1 - 0.72 * t), (t) => 0.06 * (1 - 0.7 * t) + 0.004);
    C.push(paint(tube(ts, { seg: 8, ref: V(0, 1, 0), capEnd: 0.03, phase: Math.PI / 8 }), P.orange, 'y', [0.0, 0.2]));
    const b = V(0, 0.13, -0.56), d = V(0, 1, -0.35);
    C.push(paintAlong(blade(b, d, V(0, 0, -1), V(1, 0, 0), 0.04, 0.12, 0.014), P.flame, b, d, 0.12));
  }

  // obsidian scale plates: few, big, irregular, each on a molten lava rim, with jagged lava cracks
  {
    const surf = (phi, s, off) => { // s in [0..3] along profile k0->k3 (outer shoulder over the top)
      const k = Math.max(0, Math.min(2, Math.floor(s))), f = s - k;
      const dr = prof0[k][0] + (prof0[k + 1][0] - prof0[k][0]) * f, dy = prof0[k][1] + (prof0[k + 1][1] - prof0[k][1]) * f;
      const nx = dr - (-0.0), ny = dy - 0.0, nl = Math.hypot(nx, ny);
      const rr = R0 + dr + (nx / nl) * off, yy = CY0 + dy + (ny / nl) * off;
      return V(Math.sin(phi) * rr, yy, Math.cos(phi) * rr);
    };
    // [phi centre, half-angle, s centre, s half, height, twist]
    const plates = [
      [0.55, 0.2, 1.35, 1.0, 0.03, 0.12],
      [1.42, 0.27, 1.15, 1.15, 0.04, -0.1],
      [2.2, 0.22, 1.45, 0.95, 0.033, 0.14],
      [2.78, 0.17, 1.2, 1.0, 0.028, -0.08],
    ];
    const shape = [[-1, 0.3], [-0.45, -1], [0.55, -0.85], [1, -0.1], [0.7, 0.9], [-0.35, 1]];
    for (const [ph, ha, sc, sh, h, tw] of plates) {
      const at = (u, v, off) => surf(ph + u * ha + v * tw, sc + v * sh, off);
      const lava = [], ob = [];
      for (const [u, v] of shape) {
        lava.push(at(u * 1.22, v * 1.18, -0.012), at(u * 1.22, v * 1.18, 0.008));
        ob.push(at(u, v, 0.002), at(u * 0.78, v * 0.78, h));
      }
      ob.push(at(0.12, 0.05, h * 1.45));
      S.push(flat(hull(lava), P.lava));
      S.push(paint(hull(ob), P.obsid, 'y', [0.05, 0.3]));
      // jagged crack: from edge through the peak to the far edge
      const topAt = (u, v) => { const f = Math.min(1, Math.hypot(u, v)); return h * 1.45 * (1 - f) + h * f * 0.95; };
      const path = [[-0.7, 0.55], [-0.25, 0.2], [0.12, 0.05], [0.3, -0.35], [0.62, -0.5]];
      for (let q = 0; q < path.length - 1; q++) {
        const [u0, v0] = path[q], [u1, v1] = path[q + 1];
        const p0 = at(u0, v0, topAt(u0 - 0.12, v0 - 0.05) + 0.006), p1 = at(u1, v1, topAt(u1 - 0.12, v1 - 0.05) + 0.006);
        const n = at(0, 0, 1).sub(at(0, 0, 0)).normalize();
        const side = new THREE.Vector3().subVectors(p1, p0).cross(n).normalize().multiplyScalar(0.0065);
        S.push(flat(hull([p0.clone().add(side), p0.clone().sub(side), p1.clone().add(side), p1.clone().sub(side),
          p0.clone().addScaledVector(n, -0.02), p1.clone().addScaledVector(n, -0.02)]), P.lava));
      }
    }
  }

  // rune tablets on the coil's outer wall (front centre + mirrored pair)
  {
    const rr = R0 + 0.145 * PS, y = CY0 - 0.004;
    C.push(...place(tablet(0.056, 0.056, algiz), V(0, y, rr + 0.004), 0, 1, 0.05));
    S.push(...place(tablet(0.052, 0.052, dagaz), V(Math.sin(0.98) * (rr + 0.004), y, Math.cos(0.98) * (rr + 0.004)), 0.98, 1, 0.05));
  }

  // ================= GOLD COLLAR at the neck split =================
  C.push(paint(hull([...ring(V(0, 0.425, -0.05), 0.2, 0.16, 12, 'y', 0), ...ring(V(0, 0.48, -0.05), 0.195, 0.155, 12, 'y', 0),
    ...ring(V(0, 0.505, -0.05), 0.17, 0.13, 12, 'y', 0)]), P.gold, 'y', [0.42, 0.51]));
  for (const [a, l] of [[0.6, 0.06], [1.3, 0.065], [2.1, 0.06], [2.8, 0.055]]) {
    const b = V(Math.sin(a) * 0.19, 0.465, -0.05 + Math.cos(a) * 0.15);
    S.push(paint(shard(b, V(Math.sin(a), 0.15, Math.cos(a)), 0.025, l, 4, 0.6), P.gold, 'y'));
  }
  // rune medallion on the collar front
  C.push(...place(tablet(0.04, 0.04, algiz), V(0, 0.462, 0.112), 0, 0.95, 0.0));

  // ================= BODY + NECKS =================
  const HC = V(0, 0.92, 0.07), HSd = V(0.4, 0.795, -0.04), YAW = 0.42;
  // centre: one continuous serpent body rising out of the back of the coil and up into the centre head
  neck(C, [V(0, 0.06, -0.01), V(0, 0.22, -0.05), V(0, 0.4, -0.04), V(0, 0.58, 0.04), V(0, 0.76, 0.06), V(0, HC.y - 0.04, HC.z - 0.03)],
    0.15, 0.082, 10, 6, 1.0, { nTube: 14, flameFrom: 16, plateFrom: 5, N: 40 });
  neck(S, [V(0.04, 0.36, -0.06), V(0.13, 0.47, -0.06), V(0.25, 0.54, -0.05), V(0.33, 0.64, -0.05), V(HSd.x - 0.02, HSd.y - 0.04, HSd.z - 0.03)],
    0.095, 0.078, 5, 5, 0.9);

  // ================= HEADS =================
  C.push(...place(head(), HC, 0, 1.0));
  S.push(...place(head(), HSd, YAW, 0.9));

  return assemble(C, S);
}

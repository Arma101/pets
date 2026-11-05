// Aurora Serpent (Mythic, Round 4 – Frozen Peaks): mint-green sea serpent resting on a faceted coil,
// purple fin-hood around a chunky head, swept-back gold horns, small feathered aurora wings,
// glowing aurora star/diamond markings, finned tail tip, ice crystals.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  mint:    { i: 0, top: '#7DEBB8', bot: '#1FA277' },
  mintS:   { i: 1, top: '#6CDDAA', bot: '#178E68' },
  belly:   { i: 2, top: '#EAFFF8', bot: '#9FE3D6' },
  purple:  { i: 3, top: '#C58BFF', bot: '#6A2FD1' },
  purpleD: { i: 4, top: '#9A5CF0', bot: '#4A1C9E' },
  gold:    { i: 5, top: '#FFE15A', bot: '#E39A12' },
  ice:     { i: 6, top: '#E6FCFF', bot: '#5CC8F0' },
  eye:     { i: 7, top: '#1A1416', bot: '#0C0A0B' },
  white:   { i: 8, top: '#FFFFFF', bot: '#F1F1F4' },
  mouth:   { i: 9, top: '#2E3A44', bot: '#18202A' },
  brow:    { i: 10, top: '#5CD9A6', bot: '#1E8F68' },
  // aurora glow markings (bright even without emissive)
  aTeal:   { i: 11, top: '#5CF0FF', bot: '#12B4E8', glow: true },
  aViolet: { i: 12, top: '#C48CFF', bot: '#8A3CFF', glow: true },
  aPink:   { i: 13, top: '#FF85D8', bot: '#FF2FB0', glow: true },
  aLime:   { i: 14, top: '#B8FF5C', bot: '#62E83A', glow: true },
  // feathers: white root -> aurora tip
  fTeal:   { i: 15, top: '#FFFFFF', bot: '#3FD3F2' },
  fViolet: { i: 16, top: '#FFFFFF', bot: '#A673FF' },
  fPink:   { i: 17, top: '#FFFFFF', bot: '#FF73CF' },
  cBelly:  { i: 19, top: '#F2FFFB', bot: '#DCFCF1' },
  fin:     { i: 18, top: '#D9B0FF', bot: '#7E3FE0' },
};
const P = PALETTE;
const AUR = [P.aTeal, P.aViolet, P.aPink, P.aLime];

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
// gradient along a direction (0 at base, 1 at base+dir*len)
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
// surface hit (point, normal) of geometry g along a ray
function surf(g, origin, dir) {
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  const hit = new THREE.Raycaster(origin, dir.clone().normalize()).intersectObject(m)[0];
  if (!hit) return null;
  const n = hit.face.normal.clone();
  if (n.dot(dir) > 0) n.negate();
  return { p: hit.point, n };
}

// coil ring with antiprism (diamond) scale grid
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

// antiprism tube along samples (curves in the YZ plane); -B = belly side
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

// thick triangular fin plate: root edge r1-r2, tip t, thickness th along the plate normal
function fin(r1, r2, t, th, extra = []) {
  const n = new THREE.Vector3().subVectors(r2, r1).cross(new THREE.Vector3().subVectors(t, r1)).normalize();
  const pts = [];
  for (const q of [r1, r2, ...extra]) for (const s of [-1, 1]) pts.push(q.clone().addScaledVector(n, s * th));
  for (const s of [-1, 1]) pts.push(t.clone().addScaledVector(n, s * th * 0.3));
  return hull(pts);
}
// mirror-safe aurora colour choice from a world position
const aurOf = (c, s = 7.3) => AUR[Math.floor(Math.abs(Math.sin(Math.abs(c.x) * 3.1 * s + c.y * 5.7 * s + c.z * 2.3 * s)) * 4) % 4];

// 4-point star overlay: two crossed thin diamonds on the plane (u, v) at c, lifted along n
function star(c, n, u, size, sw) {
  n = n.clone().normalize();
  u = u.clone().addScaledVector(n, -u.dot(n)).normalize();
  const v = new THREE.Vector3().crossVectors(n, u);
  const o = c.clone().addScaledVector(n, 0.006);
  const out = [];
  for (const [a, b] of [[u, v], [v, u]]) {
    const pts = [];
    for (const h of [0, 0.006]) {
      const q = o.clone().addScaledVector(n, h);
      pts.push(q.clone().addScaledVector(a, size), q.clone().addScaledVector(a, -size),
        q.clone().addScaledVector(b, size * 0.3), q.clone().addScaledVector(b, -size * 0.3));
    }
    out.push(flat(hull(pts), sw));
  }
  return out;
}

export function buildGeometry() {
  const C = [], S = [];

  // ================= COIL BASE =================
  const prof1 = [[0.105, 0.025], [0.08, 0.075], [0.01, 0.095], [-0.07, 0.07], [-0.09, 0.0], [-0.06, -0.06], [0.07, -0.08], [0.105, -0.035]];
  const prof0 = [[0.14, 0.035], [0.105, 0.1], [0.02, 0.13], [-0.09, 0.1], [-0.13, 0.01], [-0.1, -0.1], [0.1, -0.13], [0.145, -0.045]];
  const coilPick = (lowK) => (c, m) => {
    if (m.k === 7) return m.apex === 'up' ? P.ice : P.cBelly;
    if (m.k >= 4 && m.k <= 6) return P.cBelly;
    if (m.k === 0 || m.k === 1) {
      // aurora diamonds: pairs of triangles on the upper outer strips, spaced around
      const a = Math.atan2(Math.abs(c.x), c.z);
      const j = Math.round(a / (Math.PI / 5));
      if (Math.abs(a - j * Math.PI / 5) < 0.09) return AUR[j % 4];
    }
    return m.apex === 'up' ? P.mint : P.mintS;
  };
  const coil0 = coil(0.13, 0.28, prof0, 20);
  const coil1 = coil(0.29, 0.165, prof1, 16);
  // 4-point aurora stars between the diamonds on the upper outer coil (raycast onto the facets)
  const coilStars = (g, cy, R, fr, sz, el) => {
    fr.forEach((f, n) => {
      const phi = f * Math.PI, out = V(Math.sin(phi), 0, Math.cos(phi));
      const c = V(0, cy, 0).addScaledVector(out, R);
      const dir = out.clone().multiplyScalar(-Math.cos(el)).add(V(0, -Math.sin(el), 0));
      const h = surf(g, c.clone().addScaledVector(dir, -0.6), dir);
      if (!h) return;
      const parts = star(h.p, h.n, V(0, 1, 0), sz, { 1: P.aPink, 3: P.aLime, 5: P.aTeal, 7: P.aViolet, 9: P.aPink }[Math.round(f * 10)]);
      (Math.abs(h.p.x) < 1e-3 ? C : S).push(...parts);
    });
  };
  coilStars(coil0, 0.13, 0.28, [0.1, 0.5, 0.7, 0.9], 0.05, 0.75);
  coilStars(coil1, 0.29, 0.165, [0.1, 0.3, 0.5, 0.9], 0.035, 0.8);
  C.push(paintTris(coil0, coilPick(0), 0.0, 0.27));
  C.push(paintTris(coil1, coilPick(1), 0.18, 0.39));

  // ================= NECK (S-curve) with icy belly plates =================
  const neckPts = [V(0, 0.22, -0.06), V(0, 0.38, 0.0), V(0, 0.52, 0.065), V(0, 0.65, 0.01), V(0, 0.76, -0.02), V(0, 0.84, 0.02)];
  const nr = (t) => 0.128 - 0.03 * t;
  const neckS = curveSamples(neckPts, 12, nr);
  C.push(paintTris(scaleTube(neckS, 10, Math.PI / 2), () => P.mint, 0.2, 0.85));
  const fine = curveSamples(neckPts, 26, nr), X = V(1, 0, 0);
  const frT = (i) => new THREE.Vector3().subVectors(fine[Math.min(i + 1, 25)].p, fine[Math.max(i - 1, 0)].p).normalize();
  const frF = (i) => new THREE.Vector3().crossVectors(frT(i), X).normalize().negate(); // belly dir
  for (let i = 3; i < 24; i += 2) {
    const pts = [];
    for (const j of [i, i + 2]) {
      const s0 = fine[Math.min(j, 25)], F = frF(Math.min(j, 25)), r = s0.rx, w = r * 0.62;
      for (const sx of [-1, 1]) {
        pts.push(s0.p.clone().addScaledVector(X, sx * w).addScaledVector(F, r * 0.82));
        pts.push(s0.p.clone().addScaledVector(X, sx * w * 0.72).addScaledVector(F, r * 1.1));
        pts.push(s0.p.clone().addScaledVector(X, sx * w).addScaledVector(F, r * 0.35));
      }
    }
    const cen = pts.reduce((a, b) => a.add(b), V(0, 0, 0)).divideScalar(pts.length);
    const T = fine[i + 1].p.clone().sub(fine[i].p).normalize();
    for (const q of pts) { const d = q.clone().sub(cen).dot(T); q.addScaledVector(T, -d * 0.14); }
    C.push(paint(hull(pts), P.belly, 'y', [0.2, 0.85]));
  }
  // dorsal fin along the back of the neck (purple fin plates)
  for (const j of [5, 9, 13, 17]) {
    const s0 = fine[j], F = frF(j).negate(), T = frT(j);
    const base = s0.p.clone().addScaledVector(F, s0.rx * 0.8);
    const r1 = base.clone().addScaledVector(T, 0.05), r2 = base.clone().addScaledVector(T, -0.05);
    const tp = base.clone().addScaledVector(F, 0.08).addScaledVector(T, -0.06);
    C.push(paintAlong(fin(r1, r2, tp, 0.012), P.fin, base, F, 0.09));
  }
  // aurora star markings on the neck sides
  for (const [j, ang, sz] of [[6, 0.9, 0.024], [11, 1.1, 0.02], [16, 0.8, 0.018]]) {
    const s0 = fine[j], F = frF(j), T = frT(j);
    const n = X.clone().multiplyScalar(Math.sin(ang)).addScaledVector(F, -Math.cos(ang) * 0.4).normalize();
    const c = s0.p.clone().addScaledVector(n, s0.rx * 0.97);
    S.push(...star(c, n, T, sz, AUR[j % 4]));
  }

  // ================= SMALL FEATHERED WINGS (mid neck, swept back) =================
  {
    // root sits in the side of the neck; hidden by a covert-feather cluster
    const root = V(0.1, 0.52, -0.01);
    // wing plane: spread outward and slightly up, a little swept back
    const ou = V(1, 0.12, -0.28).normalize(), up = V(0, 1, -0.12).normalize();
    const nrm = new THREE.Vector3().crossVectors(ou, up).normalize(); // faces front
    const dirOf = (deg) => { const a = deg * Math.PI / 180; return ou.clone().multiplyScalar(Math.cos(a)).addScaledVector(up, Math.sin(a)); };
    // broad flat primaries fanned in the plane (degrees from out toward up), layered front-to-back
    const feathers = [
      [58, 0.27, P.fViolet], [36, 0.33, P.fTeal], [14, 0.35, P.fPink], [-8, 0.31, P.fViolet], [-30, 0.24, P.fTeal],
    ];
    feathers.forEach(([deg, l, sw], k) => {
      const d = dirOf(deg);
      const p = new THREE.Vector3().crossVectors(nrm, d).normalize();
      const b = root.clone().addScaledVector(nrm, -0.014 * k);
      const w = 0.054;
      const g = fin(b.clone().addScaledVector(p, w * 0.55), b.clone().addScaledVector(p, -w * 0.55), b.clone().addScaledVector(d, l), 0.014, [
        b.clone().addScaledVector(d, l * 0.55).addScaledVector(p, w), b.clone().addScaledVector(d, l * 0.55).addScaledVector(p, -w),
        b.clone().addScaledVector(d, l * 0.85).addScaledVector(p, w * 0.75)]);
      S.push(paintAlong(g, sw, b, d, l));
    });
    // covert cluster: short white feathers radiating from the root, in front of the primaries
    for (const [deg, l, off] of [[70, 0.12, 0.02], [40, 0.15, 0.03], [10, 0.16, 0.03], [-20, 0.14, 0.025], [-50, 0.1, 0.02]]) {
      const d = dirOf(deg);
      const p = new THREE.Vector3().crossVectors(nrm, d).normalize();
      const b = root.clone().addScaledVector(nrm, off);
      S.push(paint(fin(b.clone().addScaledVector(p, 0.035), b.clone().addScaledVector(p, -0.035), b.clone().addScaledVector(d, l), 0.014,
        [b.clone().addScaledVector(d, l * 0.6).addScaledVector(p, 0.045), b.clone().addScaledVector(d, l * 0.6).addScaledVector(p, -0.045)]), P.white, 'y'));
    }
    // root knot: white faceted blob covering where the feathers meet the neck
    S.push(paint(hull([...cbox(root.clone().add(V(0.0, 0.0, 0.0)), 0.035, 0.04, 0.04, 0.014)]), P.white, 'y'));
  }

  // ================= TAIL with fin fan, rising from the back of the coil =================
  {
    const tp = [V(0, 0.1, -0.33), V(0, 0.14, -0.45), V(0, 0.26, -0.52), V(0, 0.38, -0.5)];
    const ts = curveSamples(tp, 7, (t) => 0.07 - 0.04 * t);
    C.push(paintTris(scaleTube(ts, 8, Math.PI / 2, { capEnd: 0.02 }), () => P.mint, 0.0, 0.45));
    const tip = V(0, 0.38, -0.5);
    C.push(paintAlong(fin(V(0, 0.33, -0.46), V(0, 0.36, -0.55), V(0, 0.58, -0.62), 0.014, [V(0, 0.5, -0.52)]), P.fin, tip, V(0, 1, -0.4), 0.2));
    S.push(paintAlong(fin(V(0.0, 0.34, -0.47), V(0.0, 0.39, -0.53), V(0.15, 0.52, -0.6), 0.014, [V(0.1, 0.5, -0.52)]), P.fin, tip, V(0.5, 0.6, -0.3), 0.18));
    S.push(paintAlong(fin(V(0.0, 0.33, -0.47), V(0.0, 0.36, -0.54), V(0.17, 0.36, -0.62), 0.014, [V(0.12, 0.42, -0.55)]), P.fin, tip, V(0.7, 0, -0.5), 0.17));
  }

  // ================= ICE CRYSTALS on the coil =================
  for (const [b, d, w, l] of [
    [V(0.3, 0.2, 0.2), V(0.4, 1, 0.3), 0.04, 0.16],
    [V(0.34, 0.18, 0.15), V(0.9, 0.8, 0.0), 0.03, 0.11],
    [V(0.27, 0.2, 0.25), V(0.1, 1, 0.9), 0.028, 0.1],
    [V(0.2, 0.33, -0.1), V(0.5, 1, -0.3), 0.03, 0.12],
    [V(0.23, 0.31, -0.06), V(1, 0.6, 0.1), 0.022, 0.08],
  ]) S.push(paint(shard(b, d, w, l, 6, 1), P.ice, 'y'));

  // ================= HEAD =================
  const C0 = C, S0 = S; const HC = [], HS = [];
  { const C = HC, S = HS;
  const H = { y: 0.84, z: 0.04 };
  const FZ = H.z + 0.13;
  const cran = paint(hull([
    ...cbox(V(0, H.y + 0.01, H.z), 0.17, 0.1, 0.13, 0.045),
    ...ring(V(0, H.y + 0.125, H.z - 0.02), 0.12, 0.1, 8, 'y'),
    V(0.14, H.y + 0.11, FZ - 0.012), V(-0.14, H.y + 0.11, FZ - 0.012),
    V(0.18, H.y - 0.06, H.z + 0.02), V(-0.18, H.y - 0.06, H.z + 0.02),
  ]), P.mint, 'y', [H.y - 0.1, H.y + 0.13]);
  C.push(cran);
  // glowing aurora stars on the cranium sides
  for (const [y, z, sz, sw] of [[0.02, -0.03, 0.032, P.aTeal], [-0.03, 0.05, 0.022, P.aPink], [0.07, -0.08, 0.02, P.aLime]]) {
    const h = surf(cran, V(0.5, H.y + y, H.z + z), V(-1, 0, 0));
    if (h) S.push(...star(h.p, h.n, V(0, 0.4, 1), sz, sw));
  }
  // snout (dragon-like, blocky)
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.03, H.z + 0.12), 0.15, 0.055, 0.08, 0.03),
    ...cbox(V(0, H.y - 0.04, H.z + 0.27), 0.12, 0.045, 0.035, 0.025),
  ]), P.mint, 'y', [H.y - 0.1, H.y + 0.13]));
  // lower jaw (pale)
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.115, H.z + 0.06), 0.13, 0.035, 0.1, 0.02),
    ...cbox(V(0, H.y - 0.105, H.z + 0.24), 0.1, 0.03, 0.045, 0.02),
    ...cbox(V(0, H.y - 0.155, H.z + 0.06), 0.09, 0.02, 0.08, 0.015),
  ]), P.belly, 'y', [H.y - 0.17, H.y - 0.08]));
  // mouth line + nostrils
  S.push(flat(hull([V(0.0, H.y - 0.087, H.z + 0.306), V(0.11, H.y - 0.085, H.z + 0.29), V(0.11, H.y - 0.075, H.z + 0.29), V(0.0, H.y - 0.077, H.z + 0.306),
    V(0.0, H.y - 0.087, H.z + 0.29), V(0.11, H.y - 0.085, H.z + 0.27)]), P.mouth));
  S.push(flat(hull(cbox(V(0.05, H.y + 0.01, H.z + 0.275), 0.016, 0.007, 0.014, 0.003)), P.mouth));
  // aurora star on the nose bridge
  C.push(...star(V(0, H.y + 0.015, H.z + 0.16), V(0, 1, 0.15), V(0, 0, 1), 0.042, P.aPink));

  // eyes
  const E = V(0.085, H.y + 0.06, 0), es = 1.15;
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
    V(0.16, E.y + 0.044, FZ - 0.0), V(0.16, E.y + 0.068, FZ - 0.015),
    V(0.02, E.y + 0.006, FZ - 0.05), V(0.022, E.y + 0.05, FZ - 0.06),
    V(0.16, E.y + 0.04, FZ - 0.08), V(0.16, E.y + 0.06, FZ - 0.09),
  ]), P.brow, 'y'));

  // swept-back gold horns
  S.push(paint(tube(curveSamples([V(0.08, H.y + 0.1, H.z - 0.0), V(0.12, H.y + 0.18, H.z - 0.07), V(0.16, H.y + 0.24, H.z - 0.2), V(0.18, H.y + 0.24, H.z - 0.34)],
    8, (t) => 0.048 * (1 - t * 0.85)), { seg: 6, capEnd: 0.035 }), P.gold, 'len'));
  // small secondary horns below
  S.push(paint(tube(curveSamples([V(0.14, H.y + 0.04, H.z - 0.04), V(0.2, H.y + 0.07, H.z - 0.1), V(0.24, H.y + 0.08, H.z - 0.18)],
    6, (t) => 0.028 * (1 - t * 0.8)), { seg: 6, capEnd: 0.025 }), P.gold, 'len'));

  // purple hood: fanned fin plates around the back of the head
  const hc = V(0, H.y + 0.0, H.z - 0.08);
  // solid membrane behind the fins so it reads as one hood
  {
    const pts = [];
    for (let k = 0; k <= 8; k++) {
      const a = 0.15 + (2.45 - 0.15) * k / 8;
      for (const sx of [1, -1]) {
        pts.push(hc.clone().add(V(sx * Math.sin(a) * 0.27, Math.cos(a) * 0.25, -0.08)));
        pts.push(hc.clone().add(V(sx * Math.sin(a) * 0.21, Math.cos(a) * 0.19, -0.12)));
      }
    }
    C.push(paint(hull(pts), P.purpleD, 'y'));
    // glowing aurora stars on the back of the hood
    const hb = (x, y, sz, sw) => S.push(...star(hc.clone().add(V(x, y, -0.12)), V(0, 0, -1), V(0, 1, 0), sz, sw));
    C.push(...star(hc.clone().add(V(0, 0.08, -0.125)), V(0, 0, -1), V(0, 1, 0), 0.04, P.aTeal));
    hb(0.1, 0.02, 0.03, P.aPink); hb(0.07, -0.09, 0.025, P.aViolet); hb(0.13, 0.12, 0.022, P.aLime);
  }
  const hoodFins = [
    // [angle from up (rad), length, width]
    [0.32, 0.21, 0.11], [0.95, 0.23, 0.12], [1.58, 0.22, 0.12], [2.2, 0.18, 0.1],
  ];
  for (const [a, l, w] of hoodFins) {
    const d = V(Math.sin(a), Math.cos(a), -0.35).normalize();
    const perp = V(Math.cos(a), -Math.sin(a), 0);
    const base = hc.clone().addScaledVector(d, 0.1);
    const r1 = base.clone().addScaledVector(perp, w), r2 = base.clone().addScaledVector(perp, -w);
    const tp = base.clone().addScaledVector(d, l);
    const m1 = base.clone().addScaledVector(d, l * 0.62).addScaledVector(perp, w * 0.95), m2 = base.clone().addScaledVector(d, l * 0.62).addScaledVector(perp, -w * 0.95);
    S.push(paintAlong(fin(r1, r2, tp, 0.02, [m1, m2]), P.purple, base, d, l));
    // gold rib
    S.push(paint(fin(base.clone().addScaledVector(perp, 0.012).addScaledVector(V(0, 0, 1), 0.02), base.clone().addScaledVector(perp, -0.012).addScaledVector(V(0, 0, 1), 0.02),
      tp.clone().addScaledVector(V(0, 0, 1), 0.024).addScaledVector(d, -0.02), 0.008), P.gold, 'flat'));
  }
  // centre crest fin
  C.push(paintAlong(fin(V(0, H.y + 0.13, H.z + 0.02), V(0, H.y + 0.1, H.z - 0.12), V(0, H.y + 0.3, H.z - 0.16), 0.016), P.purple, V(0, H.y + 0.1, 0), V(0, 1, -0.4), 0.2));
  // cheek fins
  S.push(paintAlong(fin(V(0.15, H.y - 0.06, H.z + 0.06), V(0.15, H.y - 0.1, H.z - 0.02), V(0.27, H.y - 0.12, H.z - 0.06), 0.012), P.fin, V(0.15, 0, 0), V(1, 0, 0), 0.12));
  }
  const piv = V(0, 0.8, 0.02), HSC = 1.2;
  for (const g of [...HC, ...HS]) { g.translate(-piv.x, -piv.y, -piv.z); g.scale(HSC, HSC, HSC); g.translate(piv.x, piv.y, piv.z); }
  return assemble([...C0, ...HC], [...S0, ...HS]);
}

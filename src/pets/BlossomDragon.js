// Blossom Dragon (CELESTIAL): pink eastern (lung) dragon, mint branching antlers, cherry-petal wings,
// 5-petal blossoms along the spine, jade + silk ribbon details, glowing mint markings, floating halo.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  pink:    { i: 0, top: '#FF9CC6', bot: '#E2508E' },
  pinkDk:  { i: 1, top: '#F06AA6', bot: '#C23574' },
  belly:   { i: 2, top: '#FFF4EA', bot: '#F5CFC4' },
  horn:    { i: 3, top: '#C9FFE0', bot: '#52C98E' },
  hornT:   { i: 4, top: '#4DBF86', bot: '#D8FFEA' },
  white:   { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:     { i: 6, top: '#1A1416', bot: '#0C0A0B' },
  nose:    { i: 7, top: '#8A2450', bot: '#5C1234' },
  brow:    { i: 8, top: '#F2639F', bot: '#B92D69' },
  petal:   { i: 9, top: '#FFF2F8', bot: '#FF5CA2' },
  petal2:  { i: 10, top: '#FFF6FA', bot: '#FF8DC0' },
  bloom:   { i: 11, top: '#FFFFFF', bot: '#FFC4DE' },
  stamen:  { i: 12, top: '#FFF0A0', bot: '#FFB43A' },
  jade:    { i: 13, top: '#6FE0A8', bot: '#1F9566' },
  ribbon:  { i: 14, top: '#FF5F93', bot: '#D11E5E' },
  mane:    { i: 15, top: '#FFFFFF', bot: '#FFB0D2' },
  glow:    { i: 16, top: '#B8FFF0', bot: '#2EE8C8', glow: true },
  halo:    { i: 17, top: '#FFE680', bot: '#FFB020', glow: true },
  claw:    { i: 18, top: '#F4FFF8', bot: '#A8E8C8' },
  gold:    { i: 19, top: '#FFE680', bot: '#E89A10' },
  rim:     { i: 20, top: '#FFFBE0', bot: '#FFE36E', glow: true },
  petalB:  { i: 21, top: '#FFB2D6', bot: '#EC64A0' },
};
const P = PALETTE;

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);

// swatch uv (same convention as kit.paint)
function swUV(sw, t, u = 0.5) {
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  return [(x + 24 + u * 80) / 1024, (y + 16 + Math.min(1, Math.max(0, t)) * 96) / 1024];
}
// gradient along a direction: t = 0 at o, 1 at o + d*L (t = top colour at 0)
function paintAlong(g, sw, o, d, L, flip = false) {
  const p = g.attributes.position, uv = [], dd = nrm(d);
  for (let i = 0; i < p.count; i++) {
    let t = (V(p.getX(i), p.getY(i), p.getZ(i)).sub(o).dot(dd)) / L;
    if (flip) t = 1 - t;
    uv.push(...swUV(sw, t));
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

// raycast decal: cast each origin along dir onto target meshes, build a thin conformal hull
const rc = new THREE.Raycaster();
function decal(targets, origins, dir, out = 0.007, inn = 0.012) {
  const pts = [], d = nrm(dir);
  for (const o of origins) {
    rc.set(o, d);
    const hits = rc.intersectObjects(targets, false);
    if (!hits.length) continue;
    const h = hits[0];
    const n = h.face.normal.clone();
    pts.push(add(h.point, n, out), add(h.point, n, -inn));
  }
  return pts.length >= 6 ? hull(pts) : null;
}
const meshOf = (g) => { const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })); m.updateMatrixWorld(); return m; };

// cherry petal (notched tip) as two convex halves. base, dir, plane normal n.
function petal(base, dir, n, L, W, th = 0.014, notch = true) {
  const d = nrm(dir), nn = nrm(add(n, d, -n.dot(d))), v = nrm(cross(nn, d));
  const half = notch
    ? [[0, 0], [0.14, 0.26], [0.45, 0.5], [0.78, 0.46], [1, 0.24], [0.88, 0.0]]
    : [[0, 0], [0.3, 0.46], [0.78, 0.4], [1, 0.0]];
  const out = [];
  if (!notch) {
    const pts = [];
    for (const s of [1, -1]) for (const [u, w] of half) {
      const p = add(add(base, d, u * L), v, s * w * W);
      const t = th * (1 - 0.5 * u);
      pts.push(add(p, nn, t / 2), add(p, nn, -t / 2));
    }
    return [hull(pts)];
  }
  for (const s of [1, -1]) {
    const pts = [];
    for (const [u, w] of half) {
      const p = add(add(base, d, u * L), v, s * w * W);
      const t = th * (1 - 0.5 * u);
      pts.push(add(p, nn, t / 2), add(p, nn, -t / 2));
    }
    out.push(hull(pts));
  }
  return out;
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const pink = (pts, lo = 0.1, hi = 0.75) => paint(hull(pts), P.pink, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= BODY (long chunky barrel) =================
  const bodyG = pink([
    ...ring(V(0, 0.4, -0.47), 0.1, 0.1, 10, 'z'),
    ...ring(V(0, 0.39, -0.38), 0.16, 0.155, 10, 'z'),
    ...ring(V(0, 0.38, -0.22), 0.185, 0.17, 10, 'z'),
    ...ring(V(0, 0.385, -0.02), 0.18, 0.17, 10, 'z'),
    ...ring(V(0, 0.41, 0.13), 0.18, 0.18, 10, 'z'),
    ...ring(V(0, 0.44, 0.23), 0.12, 0.13, 10, 'z'),
  ]);
  C.push(bodyG);
  const neckG = pink([...ring(V(0, 0.46, 0.14), 0.14, 0.13, 10, 'y'), ...ring(V(0, 0.7, 0.27), 0.12, 0.11, 10, 'y')], 0.3, 0.9);
  C.push(neckG);
  const bodyM = meshOf(bodyG), neckM = meshOf(neckG);

  // ================= LEGS (short, thick, clawed) =================
  const legs = [];
  legs.push(pink([...ring(V(0.168, 0.08, 0.2), 0.084, 0.086, 8), ...ring(V(0.168, 0.2, 0.18), 0.092, 0.096, 8),
    ...ring(V(0.15, 0.34, 0.12), 0.11, 0.12, 8)], 0.0, 0.6));
  legs.push(paint(blob(0, V(0.16, 0.33, 0.13), V(0.105, 0.13, 0.12), { jitter: 0.1 }), P.pink, 'y', [0.0, 0.6]));
  legs.push(paint(blob(1, V(0.17, 0.3, -0.3), V(0.115, 0.15, 0.16), { jitter: 0.12 }), P.pink, 'y', [0.0, 0.6]));
  legs.push(pink([...ring(V(0.185, 0.25, -0.3), 0.09, 0.095, 8), ...ring(V(0.188, 0.14, -0.33), 0.082, 0.082, 8),
    ...ring(V(0.188, 0.08, -0.32), 0.08, 0.08, 8)], 0.0, 0.6));
  S.push(...legs);
  const legM = legs.map(meshOf);
  const foot = (x, z) => {
    const fb = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      fb.push(V(x + sx * 0.088, 0, z + 0.01 + sz * 0.08), V(x + sx * 0.088, 0.06, z + 0.01 + sz * 0.08 - (sz > 0 ? 0.02 : 0)));
      fb.push(V(x + sx * 0.07, 0.1, z + 0.01 + sz * 0.06));
    }
    S.push(paint(hull(fb), P.pink, 'y', [0, 0.3]));
    for (const dx of [-0.05, 0, 0.05]) {
      const b = V(x + dx, 0.0, z + 0.07);
      S.push(paint(hull([V(b.x - 0.026, 0, b.z - 0.035), V(b.x + 0.026, 0, b.z - 0.035), V(b.x - 0.024, 0, b.z + 0.025), V(b.x + 0.024, 0, b.z + 0.025),
        V(b.x - 0.02, 0.07, b.z - 0.035), V(b.x + 0.02, 0.07, b.z - 0.035), V(b.x - 0.018, 0.05, b.z + 0.02), V(b.x + 0.018, 0.05, b.z + 0.02)]), P.pink, 'y', [0, 0.3]));
      S.push(flat(hull([
        V(b.x - 0.02, 0.0, b.z + 0.0), V(b.x + 0.02, 0.0, b.z + 0.0),
        V(b.x - 0.017, 0.045, b.z + 0.0), V(b.x + 0.017, 0.045, b.z + 0.0),
        V(b.x, 0.05, b.z + 0.02), V(b.x + dx * 0.12, 0.0, b.z + 0.065),
        V(b.x - 0.014, 0.0, b.z + 0.035), V(b.x + 0.014, 0.0, b.z + 0.035),
      ]), P.claw));
    }
  };
  foot(0.168, 0.2);
  foot(0.188, -0.33);
  // elbow / heel flame tufts (mane colour)
  for (const [b, d, w, l] of [
    [V(0.215, 0.26, 0.1), V(0.5, -0.2, -1), 0.035, 0.1],
    [V(0.235, 0.3, -0.38), V(0.4, -0.1, -1), 0.035, 0.09],
  ]) S.push(paintAlong(shard(b, d, w, l), P.mane, b, d, l));

  // ================= BELLY (cream segmented underside + chest plates) =================
  for (let z = -0.36; z <= 0.14; z += 0.1) {
    const o = [];
    for (const x of [-0.1, 0, 0.1]) for (const dz of [-0.042, 0.042]) o.push(V(x, -0.5, z + dz));
    const g = decal([bodyM], o, V(0, 1, 0), 0.006, 0.02);
    if (g) C.push(paint(g, P.belly, 'flat'));
  }
  for (let y = 0.45; y <= 0.7; y += 0.062) {
    const o = [];
    for (const x of [-0.085, 0, 0.085]) for (const dy of [-0.026, 0.026]) o.push(V(x, y + dy, 1.0));
    const g = decal([neckM, bodyM], o, V(0, -0.15, -1), 0.006, 0.02);
    if (g) C.push(paint(g, P.belly, 'y', [0.35, 0.8]));
  }

  // ================= GLOWING MARKINGS (mint runes on flanks, legs) =================
  const glowS = (g) => g && S.push(paint(g, P.glow, 'flat'));
  // flank chevrons pointing forward (two thick strokes each), cast from the side
  const stroke = (tg, a, b, w) => {
    const d = V(0, b.y - a.y, b.z - a.z).normalize(), q = V(0, -d.z, d.y).multiplyScalar(w);
    return decal(tg, [add(a, q), add(a, q, -1), add(b, q), add(b, q, -1), a.clone().lerp(b, 0.5).add(q), a.clone().lerp(b, 0.5).sub(q)], V(-1, 0, 0));
  };
  const chevron = (tg, y, z, s, w = 0.019) => {
    const tip = V(1, y, z + 0.045 * s);
    glowS(stroke(tg, V(1, y + 0.07 * s, z - 0.035 * s), tip, w));
    glowS(stroke(tg, tip, V(1, y - 0.07 * s, z - 0.035 * s), w));
  };
  // one bold chevron on each shoulder and haunch
  chevron([legM[1]], 0.33, 0.14, 1.0, 0.024);
  chevron([legM[2]], 0.31, -0.28, 1.2, 0.026);
  // dotted line of glowing diamonds down the spine (raised gems)
  for (const [z, w] of [[0.05, 0.04], [-0.055, 0.034], [-0.155, 0.044], [-0.255, 0.034], [-0.345, 0.04], [-0.43, 0.03]]) {
    const g = decal([bodyM, neckM], [V(0, 2, z + w * 1.4), V(0, 2, z - w * 1.4), V(w, 2, z), V(-w, 2, z), V(0, 2, z)], V(0, -1, 0), 0.0, 0.015);
    if (g) {
      // lift the centre into a little pyramid gem
      rc.set(V(0, 2, z), V(0, -1, 0));
      const h = rc.intersectObjects([bodyM, neckM], false)[0];
      const pts = [];
      const pa = g.attributes.position;
      for (let i = 0; i < pa.count; i++) pts.push(V(pa.getX(i), pa.getY(i), pa.getZ(i)));
      if (h) pts.push(add(h.point, V(0, 1, 0), 0.034));
      C.push(paint(hull(pts), P.glow, 'flat'));
    }
  }

  // ================= HEAD (big, boxy, long snout) =================
  const H = { y: 0.81, z: 0.36 };
  const headG = pink([
    ...cbox(V(0, H.y, H.z), 0.19, 0.155, 0.145, 0.06),
    ...ring(V(0, H.y + 0.165, H.z - 0.03), 0.1, 0.09, 8, 'y'),
    V(0.2, H.y - 0.06, H.z + 0.0), V(-0.2, H.y - 0.06, H.z + 0.0),
  ], 0.55, 1.0);
  C.push(headG);
  const FZ = H.z + 0.145;
  // long snout
  const snoutG = pink([
    ...cbox(V(0, H.y - 0.07, FZ + 0.1), 0.105, 0.065, 0.115, 0.03),
    V(0.085, H.y + 0.0, FZ - 0.03), V(-0.085, H.y + 0.0, FZ - 0.03),
    V(0.06, H.y - 0.012, FZ + 0.2), V(-0.06, H.y - 0.012, FZ + 0.2),
  ], 0.6, 0.92);
  C.push(snoutG);
  // nose pad (pink dark) bump
  C.push(paint(hull(cbox(V(0, H.y - 0.02, FZ + 0.19), 0.07, 0.025, 0.035, 0.012)), P.pinkDk, 'flat'));
  // lower jaw
  C.push(paint(hull(cbox(V(0, H.y - 0.135, FZ + 0.06), 0.088, 0.03, 0.1, 0.016)), P.belly, 'y', [0.6, 0.72]));
  // nostrils
  S.push(paint(hull([V(0.026, H.y + 0.002, FZ + 0.19), V(0.056, H.y + 0.002, FZ + 0.185), V(0.026, H.y - 0.012, FZ + 0.228),
    V(0.056, H.y - 0.012, FZ + 0.226), V(0.041, H.y - 0.02, FZ + 0.19), V(0.041, H.y - 0.028, FZ + 0.222)]), P.nose, 'flat'));
  // mouth line
  S.push(paint(hull([V(0, H.y - 0.098, FZ + 0.218), V(0, H.y - 0.09, FZ + 0.218), V(0.075, H.y - 0.098, FZ + 0.216),
    V(0.075, H.y - 0.09, FZ + 0.216), V(0, H.y - 0.094, FZ + 0.2), V(0.075, H.y - 0.094, FZ + 0.2)]), P.nose, 'flat'));
  S.push(paint(hull([V(0.09, H.y - 0.098, FZ + 0.2), V(0.09, H.y - 0.09, FZ + 0.2), V(0.105, H.y - 0.098, FZ + 0.17),
    V(0.105, H.y - 0.09, FZ + 0.17), V(0.105, H.y - 0.112, FZ + 0.03), V(0.105, H.y - 0.104, FZ + 0.03),
    V(0.09, H.y - 0.1, FZ + 0.05), V(0.08, H.y - 0.094, FZ + 0.19)]), P.nose, 'flat'));
  // small fang
  S.push(paint(shard(V(0.06, H.y - 0.1, FZ + 0.2), V(0, -1, 0.15), 0.012, 0.03), P.white, 'flat'));

  // fierce eyes
  const E = V(0.088, H.y + 0.045, 0);
  S.push(paint(hull(plate([[-0.048, 0.0], [0.05, 0.036], [0.058, -0.012], [0.022, -0.044], [-0.032, -0.04], [-0.05, -0.018]],
    E, FZ - 0.01, FZ + 0.01)), P.white, 'flat'));
  S.push(paint(hull(plate([[-0.029, 0.002], [0.017, 0.021], [0.024, -0.01], [0.005, -0.036], [-0.024, -0.034], [-0.035, -0.014]],
    V(E.x - 0.002, E.y, 0), FZ + 0.004, FZ + 0.016)), P.eye, 'flat'));
  S.push(paint(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.012, FZ + 0.02)), P.white, 'flat'));
  // heavy brow
  S.push(paint(hull([
    V(0.022, E.y + 0.01, FZ + 0.035), V(0.024, E.y + 0.055, FZ + 0.025),
    V(0.16, E.y + 0.052, FZ - 0.01), V(0.16, E.y + 0.095, FZ - 0.025),
    V(0.022, E.y + 0.01, FZ - 0.03), V(0.024, E.y + 0.065, FZ - 0.04),
    V(0.16, E.y + 0.052, FZ - 0.06), V(0.16, E.y + 0.095, FZ - 0.07),
  ]), P.brow, 'y'));
  // forehead jade gem + glow mark
  C.push(paint(hull([V(0, H.y + 0.15, FZ - 0.02), V(0, H.y + 0.1, FZ + 0.005), V(0.025, H.y + 0.125, FZ - 0.0),
    V(-0.025, H.y + 0.125, FZ - 0.0), V(0, H.y + 0.13, FZ - 0.05), V(0.02, H.y + 0.125, FZ - 0.04), V(-0.02, H.y + 0.125, FZ - 0.04)]), P.jade, 'y'));

  // ---- branching mint antlers ----
  const antler = (pts, r0, seg = 5) => paint(tube(curveSamples(pts, pts.length + 1, (t) => r0 * (1 - t) + 0.006), { seg, capEnd: 0.012 }), P.hornT, 'len');
  const A0 = V(0.075, H.y + 0.13, H.z - 0.02), A1 = V(0.12, H.y + 0.24, H.z - 0.09), A2 = V(0.15, H.y + 0.32, H.z - 0.2), A3 = V(0.16, H.y + 0.36, H.z - 0.32);
  S.push(antler([A0, A1, A2, A3], 0.042));
  S.push(antler([A1.clone().add(V(0.005, 0, 0)), V(0.2, H.y + 0.27, H.z - 0.08), V(0.27, H.y + 0.3, H.z - 0.06)], 0.024, 5));
  S.push(antler([A2.clone().add(V(0.0, -0.01, 0)), V(0.22, H.y + 0.36, H.z - 0.2), V(0.26, H.y + 0.41, H.z - 0.21)], 0.022, 5));
  S.push(antler([V(0.155, H.y + 0.34, H.z - 0.27), V(0.2, H.y + 0.31, H.z - 0.36), V(0.22, H.y + 0.32, H.z - 0.43)], 0.018, 5));

  // ---- flowing mane (layered shards behind head and down neck) ----
  const maneS = (b, d, w, l) => S.push(paintAlong(shard(b, d, w, l), P.mane, b, d, l));
  const maneC = (b, d, w, l) => C.push(paintAlong(shard(b, d, w, l), P.mane, b, d, l));
  for (const [b, d, w, l] of [
    [V(0.17, H.y + 0.02, H.z - 0.06), V(0.35, 0.1, -1), 0.05, 0.16],
    [V(0.18, H.y - 0.07, H.z - 0.03), V(0.4, -0.35, -1), 0.05, 0.15],
    [V(0.15, H.y - 0.13, H.z + 0.02), V(0.6, -0.9, -0.6), 0.045, 0.13],
    [V(0.1, H.y + 0.1, H.z - 0.12), V(0.25, 0.5, -1), 0.05, 0.15],
    [V(0.08, H.y + 0.0, H.z - 0.16), V(0.3, -0.15, -1), 0.05, 0.17],
    [V(0.1, H.y - 0.12, H.z - 0.12), V(0.5, -0.7, -1), 0.05, 0.15],
    [V(0.08, 0.66, 0.2), V(0.5, -0.4, -1), 0.045, 0.14],
    [V(0.07, 0.58, 0.14), V(0.6, -0.6, -1), 0.04, 0.12],
  ]) maneS(b, d, w, l);
  // chin beard
  maneC(V(0, H.y - 0.15, FZ + 0.06), V(0, -1, -0.3), 0.035, 0.09);
  maneS(V(0.04, H.y - 0.15, FZ + 0.04), V(0.3, -1, -0.4), 0.03, 0.08);
  // centre mane crest down the neck
  for (const [y, z, s] of [[H.y + 0.06, H.z - 0.15, 1.2], [0.7, 0.2, 1.1], [0.6, 0.12, 1.0]])
    maneC(V(0, y, z), V(0, 0.35, -1), 0.05 * s, 0.13 * s);

  // ---- long whiskers ----
  S.push(paint(tube(curveSamples([V(0.07, H.y - 0.04, FZ + 0.17), V(0.17, H.y - 0.02, FZ + 0.16), V(0.28, H.y - 0.07, FZ + 0.08),
    V(0.34, H.y - 0.17, FZ - 0.04), V(0.35, H.y - 0.26, FZ - 0.1)], 6, (t) => 0.014 * (1 - t) + 0.004), { seg: 5, capEnd: 0.004 }), P.hornT, 'len'));

  // ================= SILK RIBBON + JADE (collar at neck base) =================
  {
    const cy = 0.57, cz = 0.21, rx = 0.15, rz = 0.135, n = 10;
    const pt = (k, dy) => { const a = (2 * Math.PI * k) / n; return V(Math.sin(a) * rx, cy + dy - Math.cos(a) * 0.04, cz + Math.cos(a) * rz); };
    for (let k = 0; k < n; k++) {
      const pts = [];
      for (const kk of [k, k + 1]) for (const dy of [-0.024, 0.024]) {
        const p = pt(kk, dy), o = V(p.x, 0, p.z - cz).normalize();
        pts.push(p, add(p, o, 0.018));
      }
      C.push(paint(hull(pts), P.ribbon, 'flat'));
    }
    // bow loops at front + jade knot
    const fr = pt(0, 0).add(V(0, 0, 0.018));
    S.push(paint(hull([add(fr, V(0.01, 0, 0.01)), add(fr, V(0.1, 0.06, -0.01)), add(fr, V(0.1, -0.02, -0.01)),
      add(fr, V(0.01, 0, 0.03)), add(fr, V(0.085, 0.05, 0.02)), add(fr, V(0.085, -0.01, 0.02))]), P.ribbon, 'flat'));
    // trailing streamers
    for (const sgn of [1]) {
      const pts = [add(fr, V(0.03, -0.01, 0.02)), add(fr, V(0.07, -0.08, 0.01)), add(fr, V(0.06, -0.15, 0.0)), add(fr, V(0.09, -0.21, -0.02))];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        S.push(paint(hull([add(a, V(-0.018, 0, 0)), add(a, V(0.018, 0, 0)), add(a, V(-0.018, 0, -0.012)), add(a, V(0.018, 0, -0.012)),
          add(b, V(-0.02, 0, 0)), add(b, V(0.02, 0, 0)), add(b, V(-0.02, 0, -0.012)), add(b, V(0.02, 0, -0.012))]), P.ribbon, 'y', [0.3, 0.6]));
      }
      const e = pts[3];
      S.push(paint(hull([add(e, V(-0.02, 0, 0)), add(e, V(0.02, 0, 0)), add(e, V(0, -0.035, 0.0)), add(e, V(-0.02, 0, -0.012)), add(e, V(0.02, 0, -0.012)), add(e, V(0, -0.035, -0.012))]), P.ribbon, 'flat'));
    }
    C.push(paint(blob(0, add(fr, V(0, 0, 0.012)), V(0.035, 0.035, 0.025), {}), P.jade, 'y'));
  }

  // ================= TAIL (straight back on x=0, up-down wave) =================
  const tailPts = [V(0, 0.42, -0.36), V(0, 0.36, -0.56), V(0, 0.4, -0.76), V(0, 0.32, -0.94), V(0, 0.36, -1.1), V(0, 0.46, -1.2)];
  const tr = (t) => 0.105 * (1 - t) + 0.028;
  const tailG = paint(tube(curveSamples(tailPts, 13, tr), { seg: 8, axis: X, capEnd: 0.02 }), P.pink, 'y', [0.2, 0.6]);
  C.push(tailG);
  const tc = new THREE.CatmullRomCurve3(tailPts, false, 'centripetal');
  // jade bands
  for (const t of [0.3, 0.62]) {
    const p = tc.getPoint(t), T = tc.getTangent(t), r = tr(t) * 1.06 + 0.008;
    C.push(paint(tube([{ p: add(p, T, -0.018), rx: r, ry: r }, { p: add(p, T, 0.018), rx: r, ry: r }], { seg: 8, axis: X }), P.jade, 'y'));
  }
  // petal shards along tail top
  for (const t of [0.12, 0.5, 0.72, 0.86]) {
    const p = tc.getPoint(t), T = tc.getTangent(t);
    const n = V(0, T.z, -T.y).normalize(); if (n.y < 0) n.negate();
    const r = tr(t), k = 1.1 - t * 0.5;
    const b = add(p, n, r * 0.8), d = add(n, T, -0.9);
    C.push(paintAlong(shard(b, d, 0.04 * k, 0.08 * k), P.mane, b, d, 0.08 * k));
  }
  // petal tuft at tip
  {
    const tip = tc.getPoint(1), tT = tc.getTangent(1);
    for (const [d, L, W] of [
      [V(0, 0.55, -1), 0.24, 0.12], [V(0.45, 0.6, -1), 0.2, 0.1], [V(0.6, 0.15, -1), 0.18, 0.09],
      [V(0.3, 1, -0.4), 0.17, 0.09],
    ]) {
      const b = add(tip, tT, -0.03);
      const n = nrm(cross(nrm(d), V(1, 0, 0))).lengthSq() > 0.01 ? (Math.abs(d.x) > 0.01 ? nrm(cross(d, V(0, 1, 0))) : V(1, 0, 0)) : V(1, 0, 0);
      const parts = petal(b, d, n, L, W, 0.018, false);
      const tgt = d.x > 0.01 ? S : C;
      for (const g of parts) tgt.push(paintAlong(g, P.petal, b, d, L, true));
    }
  }

  // ================= BLOSSOMS ALONG THE SPINE =================
  const blossom = (c, up, fwd, r, tgt) => {
    const u = nrm(up), f = nrm(add(fwd, u, -fwd.dot(u))), s = cross(u, f);
    for (let k = 0; k < 5; k++) {
      const a = (2 * Math.PI * k) / 5;
      const d = add(f.clone().multiplyScalar(Math.cos(a)), s, Math.sin(a));
      const b = add(c, d, r * 0.15);
      const dd = add(d, u, 0.5);
      for (const g of petal(b, dd, u, r, r * 0.95, 0.014, false)) tgt.push(paintAlong(g, P.bloom, b, dd, r, true));
    }
    tgt.push(paint(blob(0, add(c, u, 0.012), V(r * 0.28, r * 0.22, r * 0.28), {}), P.stamen, 'y'));
  };
  {
    const bm = [bodyM, neckM];
    for (const [z, r] of [[0.14, 0.1], [-0.42, 0.095]]) {
      rc.set(V(0, 2, z), V(0, -1, 0));
      const h = rc.intersectObjects(bm, false)[0];
      if (h) blossom(add(h.point, V(0, 1, 0), 0.004), V(0, 1, z > 0 ? 0.5 : -0.5), V(0, 0, 1), r, C);
    }
    // paired blossoms along both sides of the spine, tilted outward so they read from the side
    for (const [z, r] of [[-0.1, 0.095], [-0.29, 0.1]]) {
      rc.set(V(0.105, 2, z), V(0, -1, 0));
      const h = rc.intersectObjects(bm, false)[0];
      if (h) blossom(add(h.point, h.face.normal, 0.004), V(0.7, 1, 0), V(0, 0, 1), r, S);
    }
    // blossom on tail
    const p = tc.getPoint(0.36), T = tc.getTangent(0.36), n = V(0, T.z, -T.y).normalize();
    if (n.y < 0) n.negate();
    blossom(add(p, n, tr(0.36) * 0.95), n, T.clone().negate(), 0.07, C);
  }

  // ================= PETAL WINGS =================
  {
    const R = V(0.12, 0.58, -0.04);
    const yaw = 0.6; // swing the fan outward/back ~35 deg
    const rot = (v) => v.clone().applyAxisAngle(V(0, 1, 0), yaw);
    const wn = rot(V(0, 0.45, 1));
    // two-sided petal paint: front faces petal swatch, back faces saturated pink
    const paintPetal = (g, sw, b, d, L) => {
      const p = g.attributes.position, uv = [], dd = nrm(d);
      for (let i = 0; i < p.count; i += 3) {
        const a = V(p.getX(i), p.getY(i), p.getZ(i)), b2 = V(p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1)), c = V(p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2));
        const fn = cross(b2.clone().sub(a), c.clone().sub(a));
        const use = fn.dot(wn) < 0 ? P.petalB : sw;
        for (const q of [a, b2, c]) uv.push(...swUV(use, 1 - q.clone().sub(b).dot(dd) / L));
      }
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      return g;
    };
    // jade root ornament
    S.push(paint(blob(0, add(R, V(0.02, 0.0, 0.0)), V(0.05, 0.05, 0.045), { jitter: 0.1 }), P.jade, 'y'));
    const big = [[12, 0.5], [32, 0.62], [52, 0.66], [72, 0.6], [92, 0.48]];
    for (const [deg, L] of big) {
      const a = (deg * Math.PI) / 180;
      const d = rot(V(Math.cos(a), Math.sin(a), -0.05));
      const b = add(R, V(0.02, 0.0, -0.03));
      for (const g of petal(b, d, wn, L, L * 0.42, 0.018)) S.push(paintPetal(g, P.petal, b, d, L));
    }
    const mid = [[22, 0.4], [42, 0.44], [62, 0.42], [82, 0.36]];
    for (const [deg, L] of mid) {
      const a = (deg * Math.PI) / 180;
      const d = rot(V(Math.cos(a), Math.sin(a), 0.08));
      const b = add(R, V(0.03, 0.0, 0.0));
      for (const g of petal(b, d, wn, L, L * 0.42, 0.018, false)) S.push(paintPetal(g, P.petal2, b, d, L));
    }
  }

  // ================= FLOATING HALO (chunky gold ring + glowing inner rim + petal sun-points) =================
  {
    const hc = V(0, H.y + 0.45, H.z - 0.02), hr = 0.135, n = 10, tilt = -0.28;
    const ax = (k) => (2 * Math.PI * k) / n;
    // point on ring: radius r, height offset dy along the ring's own normal
    const up = nrm(V(0, 1, -tilt));
    const pt = (a, r, dy) => V(Math.sin(a) * r, hc.y + Math.cos(a) * r * tilt, hc.z + Math.cos(a) * r).addScaledVector(up, dy);
    const lo = hc.y - 0.08, hi = hc.y + 0.08;
    for (let k = 0; k < n; k++) {
      const pts = [];
      for (const a of [ax(k), ax(k + 1)]) {
        pts.push(pt(a, hr + 0.032, 0.0), pt(a, hr + 0.02, 0.026), pt(a, hr + 0.02, -0.026),
          pt(a, hr - 0.016, 0.026), pt(a, hr - 0.016, -0.026));
      }
      C.push(paint(hull(pts), P.gold, 'y', [lo, hi]));
      // glowing inner rim strip
      const rp = [];
      for (const a of [ax(k), ax(k + 1)]) rp.push(pt(a, hr - 0.012, 0.016), pt(a, hr - 0.012, -0.016), pt(a, hr - 0.03, 0.0));
      C.push(paint(hull(rp), P.rim, 'flat'));
    }
    // cherry-petal sun points radiating outward around the ring
    for (let k = 0; k < 8; k++) {
      const a = (2 * Math.PI * k) / 8;
      if (Math.sin(a) < -1e-6) continue; // left side comes from the mirror
      const b = pt(a, hr + 0.02, 0), out = pt(a, hr + 1, 0).sub(pt(a, hr, 0)).normalize();
      const d = add(out, up, 0.35);
      const L = k === 0 ? 0.13 : (k === 4 ? 0.11 : 0.11);
      const tgt = (k === 0 || k === 4) ? C : S;
      for (const g of petal(b, d, up, L, L * 0.6, 0.018, false)) tgt.push(paintAlong(g, P.petal, b, d, L, true));
    }
  }

  return assemble(C, S);
}

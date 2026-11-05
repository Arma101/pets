// Inferno Phoenix (MYTHIC, Round 5 – Volcano Crater): chunky red-orange phoenix with gold-tipped shard feathers,
// a tall glowing flame crest, big raised gold-edged wings, a long burning flame tail, and obsidian legs/talons and
// breastplate split by glowing lava cracks.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, assemble } from '../kit.js';

// ---------- custom swatch painters ----------
const isGlowPass = (g, x, y) => g.getImageData(x + 64, y + 64, 1, 1).data[0] < 128; // glow atlas starts black
// red-orange feather that turns gold for the last ~32% (tip)
const tipDraw = (a, b, ga, gb, at = 0.6) => (g, x, y) => {
  const grad = g.createLinearGradient(0, y + 16, 0, y + 112);
  grad.addColorStop(0, a); grad.addColorStop(at, b); grad.addColorStop(at + 0.04, ga); grad.addColorStop(1, gb);
  g.fillStyle = a; g.fillRect(x, y, 128, 16);
  g.fillStyle = grad; g.fillRect(x, y + 16, 128, 96);
  g.fillStyle = gb; g.fillRect(x, y + 112, 128, 16);
};
// multi-stop vertical gradient (t=0 at top)
const stopsDraw = (stops) => (g, x, y) => {
  const grad = g.createLinearGradient(0, y + 16, 0, y + 112);
  for (const [t, c] of stops) grad.addColorStop(t, c);
  g.fillStyle = stops[0][1]; g.fillRect(x, y, 128, 16);
  g.fillStyle = grad; g.fillRect(x, y + 16, 128, 96);
  g.fillStyle = stops[stops.length - 1][1]; g.fillRect(x, y + 112, 128, 16);
};
// obsidian with glowing lava cracks (glow pass: only the cracks)
const crackDraw = (g, x, y) => {
  const glow = isGlowPass(g, x, y);
  if (!glow) {
    const grad = g.createLinearGradient(0, y, 0, y + 128);
    grad.addColorStop(0, '#463C58'); grad.addColorStop(1, '#17131F');
    g.fillStyle = grad; g.fillRect(x, y, 128, 128);
  }
  const lines = [
    [[24, 18], [44, 40], [38, 62], [58, 84], [52, 112]],
    [[44, 40], [76, 34], [100, 18]],
    [[38, 62], [20, 78]],
    [[58, 84], [86, 76], [104, 96]],
    [[86, 76], [92, 52], [106, 44]],
    [[70, 112], [76, 98]],
  ];
  for (const [w, c] of [[7, '#FF5A00'], [4, '#FFA024'], [1.6, '#FFE98A']]) {
    g.strokeStyle = c; g.lineWidth = w; g.lineJoin = 'miter'; g.lineCap = 'round';
    for (const L of lines) {
      g.beginPath(); g.moveTo(x + L[0][0], y + L[0][1]);
      for (const [u, v] of L.slice(1)) g.lineTo(x + u, y + v);
      g.stroke();
    }
  }
};

export const PALETTE = {
  body:    { i: 0, top: '#FF7A2C', bot: '#D9361A' },
  fTip:    { i: 1, draw: tipDraw('#FF6E28', '#E9421C', '#FFE07A', '#E0A22A') },
  fTipD:   { i: 2, draw: tipDraw('#E8461E', '#B92418', '#FFD866', '#D79A1E') },
  gold:    { i: 3, top: '#FFE07A', bot: '#D79A1E' },
  goldDk:  { i: 4, top: '#F6C431', bot: '#B9780C' },
  flame:   { i: 5, glow: true, draw: stopsDraw([[0, '#FFF6B0'], [0.2, '#FFD23A'], [0.5, '#FF9216'], [0.8, '#FF5A10'], [1, '#F2380C']]) },
  core:    { i: 6, glow: true, top: '#FFFBD8', bot: '#FFD84A' },
  obs:     { i: 7, top: '#3A3248', bot: '#15121C' },
  obsLava: { i: 8, glow: true, draw: crackDraw },
  lava:    { i: 9, glow: true, top: '#FFE27A', bot: '#FF6A00' },
  eyeW:    { i: 10, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:     { i: 11, top: '#1A1416', bot: '#0C0A0B' },
  brow:    { i: 12, top: '#C8341C', bot: '#86190F' },
  face:    { i: 13, top: '#FFA050', bot: '#F2662A' },
  mouth:   { i: 14, top: '#6A2A12', bot: '#3E160A' },
  wingIn:  { i: 15, top: '#FF8A3A', bot: '#E2481E' },
  wTip:    { i: 16, draw: tipDraw('#FF7A2C', '#E23C1A', '#FFE07A', '#E0A22A', 0.74) },
  wTipD:   { i: 17, draw: tipDraw('#E8461E', '#B02218', '#FFD866', '#D79A1E', 0.8) },
};
const P = PALETTE;

// ---------- uv helpers (same atlas layout as kit) ----------
function uvOf(sw, t, u = 0.5) {
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  return [(x + 24 + THREE.MathUtils.clamp(u, 0, 1) * 80) / 1024, (y + 16 + THREE.MathUtils.clamp(t, 0, 1) * 96) / 1024];
}
function paintFn(g, sw, fn) {
  const p = g.attributes.position, uv = [];
  for (let i = 0; i < p.count; i++) uv.push(...uvOf(sw, ...fn(V(p.getX(i), p.getY(i), p.getZ(i)))));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}
const paintY = (g, sw, lo, hi) => {
  if (lo === undefined) { g.computeBoundingBox(); lo = g.boundingBox.min.y; hi = g.boundingBox.max.y; }
  return paintFn(g, sw, (p) => [1 - (p.y - lo) / Math.max(1e-6, hi - lo)]);
};
const paintFlat = (g, sw) => paintFn(g, sw, () => [0.3]);
// gradient along a direction: t = 0 at base, 1 at base + d*L
const paintAlong = (g, sw, b, d, L) => { const dn = d.clone().normalize(); return paintFn(g, sw, (p) => [p.clone().sub(b).dot(dn) / L]); };
const paintLen = (g, sw) => { const t = g.userData.t; let k = 0; return paintFn(g, sw, () => [t[k++]]); };
// per-face planar projection over the part's bounding box (for the crack texture)
function paintTri(g, sw) {
  g.computeBoundingBox();
  const bb = g.boundingBox, sz = bb.getSize(V(0, 0, 0)), p = g.attributes.position, uv = [];
  const n01 = (v, a) => (v - bb.min[a]) / Math.max(1e-6, sz[a]);
  for (let i = 0; i < p.count; i += 3) {
    const a = V(p.getX(i), p.getY(i), p.getZ(i)), b = V(p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1)), c = V(p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2));
    const n = b.clone().sub(a).cross(c.clone().sub(a));
    const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
    for (const q of [a, b, c]) {
      if (ay >= ax && ay >= az) uv.push(...uvOf(sw, n01(q.z, 'z'), n01(q.x, 'x')));
      else if (ax >= az) uv.push(...uvOf(sw, 1 - n01(q.y, 'y'), n01(q.z, 'z')));
      else uv.push(...uvOf(sw, 1 - n01(q.y, 'y'), n01(q.x, 'x')));
    }
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const sub = (a, b) => a.clone().sub(b);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);

// flat faceted blade: convex polygon (u along dir 0..1, s across -1..1) given thickness, lying across normal n
function blade(base, dir, n, L, w, th = 0.016, shape = null) {
  const d = nrm(dir);
  const nn = nrm(add(n, d, -n.dot(d)));
  const v = nrm(cross(nn, d));
  const pts2 = shape || [[0, -0.3], [0, 0.3], [0.2, 0.5], [0.8, 0.5], [1, 0.05], [0.8, -0.5], [0.2, -0.5]];
  const pts = [];
  for (const [u, s] of pts2) {
    const p = add(add(base, d, u * L), v, s * w);
    const t = th * (u > 0.9 ? 0.6 : 1);
    pts.push(add(p, nn, t / 2), add(p, nn, -t / 2));
  }
  return hull(pts);
}
const KITE = [[0, -0.3], [0, 0.3], [0.35, 0.5], [1, 0], [0.35, -0.5]];
const FLAME = [[0, -0.35], [0, 0.35], [0.3, 0.5], [0.62, 0.32], [1, 0], [0.55, -0.42], [0.25, -0.5]];
// gold-tipped feather blade
const feather = (b, d, n, L, w, sw = P.fTip, th = 0.018, shape = KITE) => paintAlong(blade(b, d, n, L, w, th, shape), sw, b, d, L);

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);

  // ================= BODY (stocky egg, chest pushed forward) =================
  C.push(paintY(hull([
    ...ring(V(0, 0.36, -0.27), 0.1, 0.09, 10, 'z'),
    ...ring(V(0, 0.37, -0.17), 0.18, 0.16, 10, 'z'),
    ...ring(V(0, 0.39, -0.04), 0.215, 0.18, 10, 'z'),
    ...ring(V(0, 0.43, 0.08), 0.21, 0.19, 10, 'z'),
    ...ring(V(0, 0.49, 0.16), 0.17, 0.17, 10, 'z'),
    ...ring(V(0, 0.55, 0.2), 0.1, 0.1, 10, 'z'),
  ]), P.body, 0.2, 0.68));
  C.push(paintY(hull([...ring(V(0, 0.5, 0.06), 0.16, 0.15, 8, 'y'), ...ring(V(0, 0.7, 0.1), 0.14, 0.13, 8, 'y')]), P.body, 0.4, 0.85));

  // obsidian breastplate with glowing lava cracks
  const BP = [[-0.13, 0.08], [0.13, 0.08], [0.145, -0.02], [0.08, -0.13], [0, -0.165], [-0.08, -0.13], [-0.145, -0.02]];
  const bp = (k, z, dy = 0) => plate(BP.map(([u, v]) => [u * k, v * k]), V(0, 0.5 + dy, 0), z, z + 0.001);
  C.push(paintTri(hull([...bp(1, 0.12), ...bp(0.86, 0.215, 0.005), ...bp(0.55, 0.252, 0.01), V(0, 0.51, 0.262)]), P.obsLava));
  // gold rim pieces on the top edge of the plate
  S.push(paintY(hull([V(0.0, 0.6, 0.2), V(0.0, 0.62, 0.17), V(0.16, 0.6, 0.13), V(0.15, 0.625, 0.11), V(0.0, 0.585, 0.22), V(0.15, 0.585, 0.15)]), P.gold));

  // belly / flank feathers (gold-tipped plates fanning down)
  for (const [x, y, z, w, l] of [[0, 0.32, 0.2, 0.12, 0.13], [0.11, 0.33, 0.17, 0.11, 0.13], [0.19, 0.4, 0.07, 0.1, 0.13]]) {
    const n = V(x * 3.5, 0.25, 1);
    const g = feather(V(x, y, z), V(x * 1.2, -1, 0.25), n, l, w, P.fTip, 0.016, [[0, -0.42], [0, 0.42], [0.62, 0.5], [1, 0.0], [0.62, -0.5]]);
    (x === 0 ? C : S).push(g);
  }

  // back saddle feathers sweeping to the tail
  for (const [x, y, z, l] of [[0, 0.6, 0.0, 0.17], [0, 0.55, -0.12, 0.16], [0.09, 0.58, -0.02, 0.16], [0.085, 0.52, -0.14, 0.15]]) {
    const g = feather(V(x, y, z), V(x * 3, -0.45, -1), V(x * 5, 1, -0.35), l, 0.075, P.fTipD, 0.014);
    (x === 0 ? C : S).push(g);
  }
  // neck ruff (gold-tipped plates draping over the shoulders)
  C.push(feather(V(0, 0.73, -0.03), V(0, -1, -0.45), V(0, 0.1, -1), 0.17, 0.08, P.fTip, 0.014));
  for (const [x, z, n] of [[0.08, 0.0, V(0.6, 0.1, -0.8)], [0.13, 0.07, V(1, 0.1, -0.2)], [0.12, 0.15, V(1, 0.1, 0.5)]])
    S.push(feather(V(x, 0.72, z), V(n.x * 0.3, -1, n.z * 0.4), n, 0.17, 0.075, P.fTip, 0.014));

  // ================= LEGS (feathered thigh, obsidian shin w/ lava cracks, gold band, obsidian talons) =================
  const legX = 0.1;
  S.push(paintY(blob(1, V(legX, 0.25, -0.01), V(0.09, 0.095, 0.105), { jitter: 0.15 }), P.body, 0.15, 0.4));
  for (const [dx, dz, d, n] of [[0.06, 0.04, V(0.3, -1, 0.2), V(1, 0, 0.6)], [0.06, -0.06, V(0.3, -1, -0.3), V(1, 0, -0.5)], [0, 0.075, V(0, -1, 0.3), V(0, 0, 1)]])
    S.push(feather(V(legX + dx, 0.27, dz), d, n, 0.1, 0.046, P.fTip, 0.011));
  S.push(paintTri(hull([...ring(V(legX, 0.2, -0.005), 0.054, 0.054, 6), ...ring(V(legX + 0.003, 0.12, 0.005), 0.05, 0.05, 6),
    ...ring(V(legX + 0.005, 0.04, 0.02), 0.047, 0.047, 6)]), P.obsLava));
  S.push(paintY(hull([...ring(V(legX + 0.004, 0.105, 0.007), 0.06, 0.06, 6, 'y'), ...ring(V(legX + 0.004, 0.135, 0.004), 0.062, 0.062, 6, 'y')]), P.gold));
  S.push(paintFlat(shard(V(legX + 0.003, 0.08, -0.04), V(0, -0.2, -1), 0.016, 0.045), P.obs)); // spur
  const foot = (x, z) => {
    S.push(paintY(hull(cbox(V(x, 0.034, z), 0.056, 0.034, 0.054, 0.016)), P.obs, 0, 0.08));
    for (const [dx, dz] of [[-0.062, 0.09], [0, 0.112], [0.062, 0.09]]) {
      S.push(paintY(hull([...cbox(V(x + dx * 0.45, 0.028, z + dz * 0.45), 0.024, 0.028, 0.024, 0.008),
        ...cbox(V(x + dx, 0.024, z + dz), 0.022, 0.024, 0.018, 0.007)]), P.obs, 0, 0.08));
      S.push(paintFlat(shard(V(x + dx * 1.08, 0.022, z + dz + 0.014), V(dx, -0.5, 0.8), 0.018, 0.05), P.obs));
      // glowing knuckle seam
      S.push(paintFlat(hull(cbox(V(x + dx * 0.72, 0.03, z + dz * 0.72 + 0.0), 0.02, 0.006, 0.006, 0.002)
        .map((p) => p.add(V(0, 0.026, 0)))), P.lava));
    }
    S.push(paintY(hull([...cbox(V(x, 0.024, z - 0.06), 0.02, 0.024, 0.032, 0.006)]), P.obs, 0, 0.08));
    S.push(paintFlat(shard(V(x, 0.018, z - 0.092), V(0, -0.4, -1), 0.016, 0.04), P.obs));
  };
  foot(legX + 0.005, 0.03);

  // ================= HEAD =================
  const hc0 = C.length, hs0 = S.length;
  const H = { y: 0.82, z: 0.13 };
  C.push(paintY(hull([
    ...cbox(V(0, H.y, H.z), 0.165, 0.14, 0.145, 0.07),
    ...ring(V(0, H.y + 0.155, H.z - 0.01), 0.1, 0.09, 8, 'y'),
    V(0.175, H.y - 0.075, H.z + 0.02), V(-0.175, H.y - 0.075, H.z + 0.02),
  ]), P.body, 0.62, 1.0));
  const FZ = H.z + 0.145;
  // lighter face mask around the eyes
  C.push(paintY(hull([
    ...plate([[-0.15, 0.06], [0.15, 0.06], [0.16, -0.04], [0.1, -0.1], [-0.1, -0.1], [-0.16, -0.04]], V(0, H.y, 0), FZ - 0.06, FZ - 0.02),
    ...plate([[-0.12, 0.05], [0.12, 0.05], [0.13, -0.03], [0.08, -0.08], [-0.08, -0.08], [-0.13, -0.03]], V(0, H.y, 0), FZ + 0.004, FZ + 0.006),
  ]), P.face, H.y - 0.1, H.y + 0.06));
  // cheek / nape feather plates
  S.push(feather(V(0.16, H.y - 0.05, H.z + 0.05), V(0.5, -0.8, -0.5), V(1, 0, 0.3), 0.11, 0.052, P.fTip, 0.014));
  S.push(feather(V(0.16, H.y - 0.0, H.z - 0.05), V(0.4, -0.4, -1), V(1, 0.2, -0.2), 0.12, 0.056, P.fTip, 0.014));
  S.push(feather(V(0.13, H.y - 0.09, H.z - 0.07), V(0.4, -1, -0.5), V(1, 0, -0.3), 0.11, 0.055, P.fTipD, 0.014));
  S.push(feather(V(0.09, H.y + 0.05, H.z - 0.13), V(0.3, -0.5, -1), V(0.5, 0.3, -1), 0.11, 0.06, P.fTipD, 0.014));
  C.push(feather(V(0, H.y + 0.0, H.z - 0.145), V(0, -0.6, -1), V(0, 0.3, -1), 0.12, 0.065, P.fTipD, 0.014));

  // beak: big gold hook
  const BY = H.y - 0.035;
  const beakPaint = (g) => paintY(g, P.gold, BY - 0.16, BY + 0.04);
  C.push(beakPaint(hull([
    ...plate([[-0.085, 0.035], [0.085, 0.035], [0.09, -0.06], [0.06, -0.1], [-0.06, -0.1], [-0.09, -0.06]], V(0, BY, 0), FZ - 0.05, FZ - 0.02),
    V(0.05, BY + 0.022, FZ + 0.055), V(-0.05, BY + 0.022, FZ + 0.055),
    V(0.034, BY + 0.0, FZ + 0.13), V(-0.034, BY + 0.0, FZ + 0.13),
    V(0.046, BY - 0.07, FZ + 0.08), V(-0.046, BY - 0.07, FZ + 0.08),
    V(0.024, BY - 0.05, FZ + 0.158), V(-0.024, BY - 0.05, FZ + 0.158),
  ])));
  C.push(beakPaint(hull([
    V(0.024, BY - 0.04, FZ + 0.158), V(-0.024, BY - 0.04, FZ + 0.158),
    V(0.034, BY - 0.07, FZ + 0.1), V(-0.034, BY - 0.07, FZ + 0.1),
    V(0.0, BY - 0.155, FZ + 0.145), V(0.012, BY - 0.122, FZ + 0.122), V(-0.012, BY - 0.122, FZ + 0.122),
  ])));
  C.push(paintFlat(hull([
    ...plate([[-0.06, 0], [0.06, 0], [0.05, -0.036], [-0.05, -0.036]], V(0, BY - 0.085, 0), FZ - 0.035, FZ - 0.01),
    V(0.03, BY - 0.095, FZ + 0.08), V(-0.03, BY - 0.095, FZ + 0.08), V(0, BY - 0.115, FZ + 0.06),
  ]), P.goldDk));

  // fierce eyes: white almond with angry flat top, big pupil, catchlight
  const E = V(0.088, H.y + 0.035, 0), es = 1.22;
  const sc = (arr) => arr.map(([u, v]) => [u * es, v * es]);
  S.push(paintFlat(hull(plate(sc([[-0.036, 0.0], [0.044, 0.03], [0.05, -0.008], [0.02, -0.036], [-0.026, -0.032], [-0.04, -0.016]]),
    E, FZ - 0.01, FZ + 0.018, 0.3)), P.eyeW));
  S.push(paintFlat(hull(plate(sc([[-0.026, 0.0], [0.014, 0.017], [0.022, -0.008], [0.006, -0.03], [-0.02, -0.028], [-0.03, -0.012]]),
    V(E.x - 0.004, E.y, 0), FZ + 0.01, FZ + 0.025, 0.3)), P.eye));
  S.push(paintFlat(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.018, FZ + 0.03, 0.3)), P.eyeW));
  // heavy brow slanting down toward the beak
  S.push(paintY(hull([
    V(0.022, E.y + 0.008, FZ + 0.034), V(0.025, E.y + 0.05, FZ + 0.022),
    V(0.17, E.y + 0.06, FZ - 0.04), V(0.17, E.y + 0.1, FZ - 0.055),
    V(0.022, E.y + 0.008, FZ - 0.03), V(0.025, E.y + 0.06, FZ - 0.04),
    V(0.17, E.y + 0.06, FZ - 0.1), V(0.17, E.y + 0.1, FZ - 0.11),
  ]), P.brow));
  // glowing marking under each eye

  // flame crest: layered glowing flame blades fanning up and back
  const flameBlade = (b, d, n, L, w, sw = P.flame, th = 0.03) => paintAlong(blade(b, d, n, L, w, th, FLAME), sw, b, d, L);
  for (const [z, y, dz, L, w] of [[0.1, 0.12, 0.35, 0.16, 0.07], [0.04, 0.14, -0.15, 0.26, 0.085], [-0.03, 0.14, -0.6, 0.32, 0.09],
    [-0.1, 0.12, -1.1, 0.3, 0.085], [-0.15, 0.06, -1.8, 0.22, 0.07]]) {
    C.push(flameBlade(V(0, H.y + y, H.z + z), V(0, 1, dz), X, L, w, P.flame, 0.04));
  }
  for (const [z, y, dz, L, w] of [[0.06, 0.12, -0.05, 0.17, 0.065], [-0.04, 0.12, -0.7, 0.22, 0.07], [-0.12, 0.08, -1.3, 0.18, 0.06]])
    S.push(flameBlade(V(0.045, H.y + y, H.z + z), V(0.35, 1, dz), V(1, 0, 0), L, w, P.flame, 0.03));
  for (const [z, y, dz, L, w] of [[0.02, 0.1, -0.2, 0.15, 0.06], [-0.08, 0.09, -0.9, 0.16, 0.06]])
    S.push(flameBlade(V(0.08, H.y + y, H.z + z), V(0.9, 1, dz), V(1, -0.6, 0), L, w, P.flame, 0.03));
  // hot cores in front of the central flames
  for (const [z, y, dz, L] of [[0.07, 0.15, 0.0, 0.14], [-0.01, 0.16, -0.5, 0.18]])
    C.push(paintAlong(blade(V(0, H.y + y, H.z + z), V(0, 1, dz), X, L, 0.045, 0.06, KITE), P.core, V(0, H.y + y, H.z + z), V(0, 1, dz), L * 1.6));

  // scale the head up about the neck for the big-head look
  const HS = 1.34, piv = V(0, 0.62, 0.1);
  for (const g of [...C.slice(hc0), ...S.slice(hs0)]) {
    g.translate(-piv.x, -piv.y, -piv.z); g.scale(HS, HS, HS); g.translate(piv.x, piv.y, piv.z);
  }

  // ================= WINGS (big, raised & spread out: 3 layered rows of broad gold-tipped feathers) =================
  const SH = V(0.15, 0.6, 0.0), WR = V(0.43, 1.06, -0.1), TP = V(0.64, 1.36, -0.36);
  const edgePts = [SH, add(SH, sub(WR, SH), 0.5), WR, add(WR, sub(TP, WR), 0.5).add(V(0, 0.04, 0)), TP];
  const edge = new THREE.CatmullRomCurve3(edgePts, false, 'centripetal');
  // chunky tapered gold leading edge (thick at the shoulder/wrist, tapering to the tip)
  S.push(paintLen(tube(curveSamples(edgePts, 9, (t) => 0.07 - 0.04 * t, (t) => 0.052 - 0.026 * t),
    { seg: 6, ref: V(0, 0, 1), capEnd: 0.05, capStart: 0.0, phase: Math.PI / 6 }), P.gold));
  S.push(paintY(blob(0, add(WR, V(0, 0.005, 0)), V(0.075, 0.065, 0.065)), P.gold));
  // fan direction: inner feathers hang down-back, outer ones sweep out toward the tip
  const fanDir = (u) => nrm(V(0.12 + 0.62 * u, -1 + 0.72 * u, -0.6 - 0.15 * u));
  const frame = (u) => {
    const T = edge.getTangentAt(Math.min(0.999, u)), d = fanDir(u);
    const n = nrm(cross(T, d)); if (n.z < 0) n.multiplyScalar(-1); // front face of the wing
    return { p: edge.getPointAt(u), d, n };
  };
  const BROAD = [[0, -0.36], [0, 0.36], [0.3, 0.5], [0.72, 0.38], [1, 0.06], [0.88, -0.2], [0.38, -0.48]]; // tapered feather, angled tip
  const row = (N, u0, u1, Lf, W, sw, dn, th = 0.018, streak = false) => {
    for (let i = 0; i < N; i++) {
      const u = u0 + (u1 - u0) * i / (N - 1);
      const { p, d, n } = frame(u);
      const L = Lf(u);
      const b = add(add(p, n, dn - i * 0.002), d, 0.01);
      S.push(paintAlong(blade(b, d, n, L, W, th, BROAD), sw, b, d, L));
      // thin glowing streak set into the feather (base sunk inside, top 0.005 proud), following the feather axis
      if (streak && i % 2 === 1) S.push(paintAlong(blade(add(add(b, n, th * 0.5 - 0.001), d, L * 0.22), d, n, L * 0.56, W * 0.16, 0.012,
        [[0, -0.15], [0, 0.15], [0.3, 0.5], [1, 0], [0.3, -0.5]]), P.lava, add(b, d, L * 0.22), d, L * 0.7));
    }
  };
  row(8, 0.04, 1.0, (u) => 0.32 + 0.14 * Math.sin(Math.PI * Math.min(1, u * 0.8 + 0.1)), 0.19, P.wTip, -0.03);   // primaries
  row(7, 0.06, 0.92, (u) => 0.25 + 0.08 * u, 0.18, P.wTipD, 0.0, 0.018, true);                                    // secondaries + lava streaks
  row(6, 0.08, 0.86, (u) => 0.13 + 0.04 * u, 0.15, P.wTip, 0.028);                                               // coverts

  // ================= TAIL (long burning tail of layered flame blades sweeping back) =================
  const flameTube = (pts, w, thick, sw) => paintLen(tube(curveSamples(pts, 9,
    (t) => thick * (1 - 0.6 * t), (t) => w * Math.sin(Math.PI * (0.15 + 0.85 * t)) + 0.006),
    { seg: 4, axis: X }), sw);
  const tails = [
    { x: [0, 0], w: 0.11, pts: [[0.42, -0.24], [0.48, -0.45], [0.5, -0.68], [0.6, -0.88], [0.76, -0.98]] },
    { x: [0.04, 0.26], w: 0.1, pts: [[0.4, -0.24], [0.43, -0.44], [0.44, -0.64], [0.52, -0.82], [0.68, -0.92]] },
    { x: [0.05, 0.44], w: 0.09, pts: [[0.38, -0.22], [0.36, -0.38], [0.36, -0.52], [0.44, -0.64], [0.6, -0.7]] },
    { x: [0.08, 0.5], w: 0.08, pts: [[0.36, -0.2], [0.31, -0.33], [0.29, -0.46], [0.33, -0.57], [0.45, -0.62]] },
    { x: [0.03, 0.1], w: 0.09, pts: [[0.45, -0.22], [0.58, -0.38], [0.66, -0.56], [0.78, -0.7], [0.92, -0.74]] },
  ];
  for (const t of tails) {
    const n = t.pts.length;
    const pts = t.pts.map(([y, z], i) => V(t.x[0] + (t.x[1] - t.x[0]) * i / (n - 1), y, z));
    (t.x[0] === 0 && t.x[1] === 0 ? C : S).push(flameTube(pts, t.w, 0.042, P.flame));
  }
  // layered flame licks rising off the tail + hot cores at the root
  const lick = (b, d, n, L, w, sw = P.flame) => paintAlong(blade(b, d, n, L, w, 0.03, FLAME), sw, b, d, L);
  C.push(lick(V(0, 0.5, -0.5), V(0, 0.9, -1), X, 0.24, 0.07));
  C.push(lick(V(0, 0.52, -0.72), V(0, 1, -0.7), X, 0.22, 0.065));
  S.push(lick(V(0.1, 0.44, -0.55), V(0.3, 0.8, -1), V(1, 0, 0.2), 0.2, 0.06));
  S.push(lick(V(0.18, 0.36, -0.6), V(0.5, 0.5, -1), V(1, 0, 0.4), 0.2, 0.06));
  C.push(paintAlong(blade(V(0, 0.44, -0.3), V(0, 0.15, -1), X, 0.32, 0.06, 0.05, KITE), P.core, V(0, 0.44, -0.3), V(0, 0.15, -1), 0.5));
  S.push(paintAlong(blade(V(0.06, 0.42, -0.3), V(0.3, 0.0, -1), V(1, 0, 0.2), 0.26, 0.05, 0.04, KITE), P.core, V(0.06, 0.42, -0.3), V(0.3, 0, -1), 0.45));
  // tail covert feathers over the root
  C.push(feather(V(0, 0.48, -0.2), V(0, -0.1, -1), V(0, 1, -0.1), 0.22, 0.08, P.fTipD, 0.016));
  S.push(feather(V(0.07, 0.46, -0.2), V(0.35, -0.2, -1), V(0.3, 1, -0.1), 0.2, 0.07, P.fTipD, 0.016));
  S.push(feather(V(0.1, 0.4, -0.18), V(0.5, -0.4, -1), V(0.6, 1, -0.1), 0.18, 0.065, P.fTip, 0.016));

  return assemble(C, S);
}

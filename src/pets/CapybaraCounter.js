// Capybara Counter: calm, tough brown capybara with tan fur, a big leaf on its head,
// a leafy vine collar and a carved jade pendant + anklets (Round 2 - Jungle Gym, Uncommon).
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, paint, assemble } from '../kit.js';

export const PALETTE = {
  body:   { i: 0, top: '#A8693A', bot: '#6E4020' },
  tan:    { i: 1, top: '#EDC892', bot: '#C99A5E' },
  dark:   { i: 2, top: '#6A3F22', bot: '#3E2311' },
  nose:   { i: 3, top: '#3A2C26', bot: '#17110E' },
  eye:    { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  brow:   { i: 6, top: '#8E552C', bot: '#5E3417' },
  leaf:   { i: 7, top: '#8BD446', bot: '#3E9A24' },
  rib:    { i: 8, top: '#C9EE7E', bot: '#9AD24E' },
  vine:   { i: 9, top: '#5E9A2E', bot: '#2F6418' },
  jade:   { i: 10, top: '#7FF0C4', bot: '#1FA77E' },
  jadeDk: { i: 11, top: '#2FB88A', bot: '#0E7A58' },
  mouth:  { i: 12, top: '#4A2A18', bot: '#2E180C' },
  leafUn: { i: 14, top: '#A6E866', bot: '#6CC23A' }, // leaf underside (seen when the tip lifts)
  head:   { i: 13, top: '#A8693A', bot: '#E6BF86' }, // brown crown -> tan muzzle (blended on one wedge)
};
const SW = PALETTE;

// uv into a swatch at gradient position t (same mapping as kit.paint)
function swatchUV(g, sw0, tf, pick = null) {
  const p = g.attributes.position, uv = [];
  for (let i = 0; i < p.count; i++) {
    const sw = pick ? pick(p.getX(i), p.getY(i), p.getZ(i)) : sw0;
    const cx = (sw.i % 8) * 128, cy = Math.floor(sw.i / 8) * 128;
    const t = THREE.MathUtils.clamp(tf(p.getX(i), p.getY(i), p.getZ(i)), 0, 1);
    uv.push((cx + 24 + 40) / 1024, (cy + 16 + t * 96) / 1024);
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

// flat leaf blade: diamond with a little thickness
function leafBlade(base, dir, normal, w, len, th = 0.008) {
  const d = dir.clone().normalize();
  const s = new THREE.Vector3().crossVectors(d, normal).normalize();
  const n = new THREE.Vector3().crossVectors(s, d).normalize();
  const pts = [];
  const prof = [[0, 0], [0.35, w], [0.7, w * 0.75], [1, 0], [0.35, -w], [0.7, -w * 0.75]];
  for (const [t, o] of prof) for (const k of [-1, 1])
    pts.push(base.clone().addScaledVector(d, t * len).addScaledVector(s, o).addScaledVector(n, k * th * (t === 1 ? 0.3 : 1)));
  return hull(pts);
}

export function buildGeometry() {
  const C = [], S = [];   // upper parts (lowered by DY at the end)
  const CL = [], SL = []; // legs / feet (stay on the ground)
  const DY = -0.055;      // squat: barrel sits closer to the ground
  const body = (pts, lo = 0.12, hi = 0.62) => paint(hull(pts), SW.body, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= BODY (long heavy barrel, rump slightly higher) =================
  C.push(body([
    ...ring(V(0, 0.4, -0.44), 0.12, 0.12, 10, 'z'),
    ...ring(V(0, 0.4, -0.38), 0.195, 0.19, 10, 'z'),
    ...ring(V(0, 0.39, -0.22), 0.235, 0.215, 10, 'z'),
    ...ring(V(0, 0.38, 0.0), 0.235, 0.205, 10, 'z'),
    ...ring(V(0, 0.4, 0.16), 0.2, 0.19, 10, 'z'),
    ...ring(V(0, 0.43, 0.24), 0.14, 0.15, 10, 'z'),
  ]));
  // thick neck joining the head
  C.push(body([...ring(V(0, 0.48, 0.16), 0.17, 0.16, 10, 'z'), ...ring(V(0, 0.56, 0.3), 0.15, 0.13, 10, 'z')], 0.3, 0.7));
  // tan belly slab underneath
  C.push(paint(hull([
    ...cbox(V(0, 0.225, -0.08), 0.11, 0.04, 0.24, 0.04),
    V(0, 0.18, 0.02), V(0, 0.185, -0.2),
  ]), SW.tan, 'y', [0.16, 0.28]));
  // tan chest
  C.push(paint(hull([...ring(V(0, 0.36, 0.16), 0.16, 0.13, 8, 'z'), ...ring(V(0, 0.4, 0.29), 0.11, 0.11, 8, 'z')]), SW.tan, 'y', [0.24, 0.5]));

  // ================= LEGS (short, thick, dark feet with toes) =================
  S.push(paint(blob(0, V(0.165, 0.37, 0.13), V(0.105, 0.12, 0.11), { jitter: 0.1 }), SW.body, 'y', [0.1, 0.6]));
  S.push(paint(blob(1, V(0.16, 0.37, -0.28), V(0.115, 0.15, 0.15), { jitter: 0.1 }), SW.body, 'y', [0.1, 0.62]));
  SL.push(body([...ring(V(0.165, 0.06, 0.155), 0.074, 0.076, 8), ...ring(V(0.168, 0.15, 0.15), 0.084, 0.086, 8),
    ...ring(V(0.165, 0.26, 0.13), 0.098, 0.1, 8)], 0.02, 0.5));
  SL.push(body([...ring(V(0.172, 0.24, -0.29), 0.096, 0.104, 8), ...ring(V(0.178, 0.14, -0.3), 0.086, 0.09, 8),
    ...ring(V(0.175, 0.06, -0.28), 0.074, 0.076, 8)], 0.02, 0.5));
  // feet: dark pad block + chunky toes, flat on the ground
  const foot = (x, z, toes) => {
    SL.push(paint(hull(cbox(V(x, 0.04, z), 0.082, 0.04, 0.074, 0.022)), SW.dark, 'y', [0, 0.09]));
    for (const dx of toes)
      SL.push(paint(hull([...cbox(V(x + dx, 0.03, z + 0.07), 0.023, 0.03, 0.03, 0.011), V(x + dx, 0.012, z + 0.103)]),
        SW.dark, 'y', [0, 0.07]));
  };
  foot(0.168, 0.16, [-0.054, -0.018, 0.018, 0.054]);
  foot(0.178, -0.275, [-0.048, 0, 0.048]);
  // jade anklets on the front legs
  SL.push(paint(hull([...ring(V(0.165, 0.088, 0.155), 0.086, 0.087, 8, 'y'), ...ring(V(0.165, 0.114, 0.155), 0.088, 0.089, 8, 'y')]), SW.jade, 'y', [0.08, 0.12]));

  // ================= SHARD FUR =================
  const bodySh = (b, d, w, l) => paint(shard(b, d, w, l, 4, 0.5), SW.body, 'y', [0.15, 0.62]);
  const tanSh = (b, d, w, l) => paint(shard(b, d, w, l, 4, 0.6), SW.tan, 'y', [0.15, 0.6]);
  S.push(bodySh(V(0.22, 0.43, 0.08), V(0.5, -0.5, -1), 0.05, 0.075));
  S.push(bodySh(V(0.24, 0.38, -0.08), V(0.5, -0.4, -1), 0.05, 0.075));
  S.push(bodySh(V(0.245, 0.42, -0.24), V(0.45, -0.3, -1), 0.055, 0.085));
  C.push(bodySh(V(0, 0.585, -0.04), V(0, 0.3, -1), 0.06, 0.09));
  C.push(bodySh(V(0, 0.59, -0.22), V(0, 0.25, -1), 0.06, 0.09));
  S.push(bodySh(V(0.1, 0.57, -0.13), V(0.4, 0.25, -1), 0.05, 0.08));
  C.push(bodySh(V(0, 0.44, -0.44), V(0, -0.2, -1), 0.06, 0.065));

  // ================= HEAD: one long, tall, blocky wedge =================
  // sections along z: [z, [[halfWidth, y], ...]]  (cranium flows into a deep squared-off muzzle)
  const secs = [
    [0.16, [[0.11, 0.865], [0.15, 0.845], [0.155, 0.63], [0.1, 0.6]]],
    [0.22, [[0.12, 0.9], [0.162, 0.875], [0.172, 0.62], [0.11, 0.575]]],
    [0.39, [[0.14, 0.902], [0.163, 0.884], [0.165, 0.6], [0.105, 0.56]]],
    [0.46, [[0.1, 0.792], [0.138, 0.776], [0.145, 0.585], [0.095, 0.555]]],
    [0.54, [[0.115, 0.797], [0.135, 0.78], [0.135, 0.585], [0.09, 0.56]]],
    [0.615, [[0.088, 0.778], [0.122, 0.76], [0.124, 0.598], [0.082, 0.572]]],
  ];
  const hp = [];
  for (const [z, pts] of secs) for (const [w, y] of pts) hp.push(V(w, y, z), V(-w, y, z));
  C.push(swatchUV(hull(hp), SW.head, (x, y, z) => (0.79 - y) / 0.14 + (z - 0.5) / 0.22));
  const MZ = 0.615;

  // broad flat nose pad over the TOP-front edge of the snout
  C.push(paint(hull([
    V(0.07, 0.785, 0.575), V(-0.07, 0.785, 0.575), V(0.075, 0.773, 0.6), V(-0.075, 0.773, 0.6),
    V(0.08, 0.758, 0.627), V(-0.08, 0.758, 0.627), V(0.07, 0.72, 0.627), V(-0.07, 0.72, 0.627),
    V(0.06, 0.712, 0.612), V(-0.06, 0.712, 0.612), V(0.07, 0.765, 0.56), V(-0.07, 0.765, 0.56),
  ]), SW.nose, 'y'));
  // mouth: split lip + flat line on the blunt front
  C.push(flat(hull(cbox(V(0, 0.675, MZ + 0.006), 0.005, 0.03, 0.006, 0.002)), SW.mouth));
  C.push(flat(hull(cbox(V(0, 0.643, MZ + 0.004), 0.075, 0.005, 0.006, 0.002)), SW.mouth));
  // small soft fur tufts on the cheeks, pointing back
  S.push(paint(shard(V(0.16, 0.66, 0.3), V(0.45, -0.35, -1), 0.032, 0.05, 4, 0.5), SW.body, 'y', [0.55, 0.75]));
  S.push(paint(shard(V(0.15, 0.62, 0.36), V(0.4, -0.5, -1), 0.028, 0.045, 4, 0.5), SW.tan, 'y', [0.55, 0.75]));
  // small chin ruff
  C.push(tanSh(V(0, 0.565, 0.42), V(0, -1, -0.5), 0.04, 0.05));
  S.push(tanSh(V(0.06, 0.565, 0.4), V(0.4, -1, -0.5), 0.035, 0.045));

  // ---- raised capybara eye bumps on the crown: front-facing panel for the eyes ----
  const FZ = 0.49; // front plane of the eye bumps
  S.push(swatchUV(hull([0.022, 0.152].flatMap((x) => [V(x, 0.84, FZ), V(x, 0.916, FZ), V(x, 0.928, FZ - 0.014),
    V(x, 0.928, 0.33), V(x, 0.896, 0.26), V(x, 0.83, 0.43)])), SW.head, (x, y, z) => (0.79 - y) / 0.14 + (z - 0.5) / 0.22));
  // eyes: white almond, big pupil, catchlight (punch_pup pattern)
  const E = V(0.087, 0.884, 0);
  const sc = (pts, f = 1) => pts.map(([u, v]) => [u * f, v * f]);
  S.push(flat(hull(plate(sc([[-0.042, 0.004], [0.046, 0.03], [0.052, -0.01], [0.02, -0.036], [-0.03, -0.032], [-0.046, -0.014]], 1.08),
    E, FZ - 0.01, FZ + 0.008)), SW.white));
  S.push(flat(hull(plate(sc([[-0.03, 0.004], [0.016, 0.016], [0.024, -0.008], [0.006, -0.03], [-0.022, -0.028], [-0.034, -0.012]], 0.95),
    V(E.x - 0.003, E.y - 0.002, 0), FZ + 0.004, FZ + 0.014)), SW.eye));
  S.push(flat(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.008, E.y - 0.009, 0), FZ + 0.01, FZ + 0.018)), SW.white));
  // calm half-lid over the top of the almond
  S.push(paint(hull(plate([[-0.056, 0.006], [0.062, 0.016], [0.064, 0.044], [-0.056, 0.04]], E, FZ - 0.012, FZ + 0.02)),
    SW.brow, 'y', [E.y, E.y + 0.05]));
  // heavy brow ridge slanting down toward the centre
  S.push(paint(hull([
    V(0.026, E.y + 0.012, FZ + 0.034), V(0.028, E.y + 0.04, FZ + 0.024),
    V(0.162, E.y + 0.036, FZ + 0.006), V(0.162, E.y + 0.062, FZ - 0.01),
    V(0.026, E.y + 0.012, FZ - 0.03), V(0.028, E.y + 0.048, FZ - 0.04),
    V(0.162, E.y + 0.036, FZ - 0.06), V(0.162, E.y + 0.064, FZ - 0.07),
  ]), SW.brow, 'y'));

  // small round ears at the top-back corners
  const EA = V(0.135, 0.9, 0.23);
  S.push(paint(hull([...ring(EA, 0.042, 0.042, 8, 'z', 0),
    ...ring(V(EA.x - 0.012, EA.y - 0.02, EA.z - 0.045), 0.04, 0.04, 8, 'z', 0)]), SW.dark, 'y', [EA.y - 0.05, EA.y + 0.05]));
  S.push(paint(hull(ring(V(EA.x, EA.y - 0.004, EA.z + 0.006), 0.025, 0.025, 8, 'z', 0)
    .concat(ring(V(EA.x, EA.y - 0.004, EA.z + 0.001), 0.025, 0.025, 8, 'z', 0))), SW.mouth, 'flat'));

  // ================= BIG LEAF lying centred on the crown =================
  // rests on the head top (z~0.22) and the eye bumps (z~0.35), tip lifts forward-up over the brow
  const LZ0 = 0.2, LZ1 = 0.5, LW = 0.086;
  const yc = (z) => 0.932 + (z - 0.35) * 0.194 + Math.max(0, z - 0.36) ** 2 * 1.5; // centre line (underside)
  const fold = 0.42, LT = 0.012;                                                       // V-fold, thickness
  const wOf = (t) => LW * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.12 > 1 ? 1 : t)), 0.75) * (t < 0.42 ? 1 : 1 - 0.15 * (t - 0.42));
  const lp = [];
  for (const t of [0, 0.08, 0.2, 0.32, 0.45, 0.58, 0.7, 0.82, 0.92, 1]) {
    const z = LZ0 + t * (LZ1 - LZ0);
    const w = t === 0 || t === 1 ? 0 : wOf(t);
    for (const x of [0, w * 0.55, w]) { const y = yc(z) + x * fold; lp.push(V(x, y, z), V(x, y + LT, z)); }
  }
  // two-tone: bright upper face fading darker to the edge, deep green underside
  const isTop = (x, y, z) => y - (yc(z) + x * fold) > LT * 0.5;
  S.push(swatchUV(hull(lp), SW.leaf, (x, y, z) => (isTop(x, y, z) ? 0.0 + (x / LW) * 0.4 : (x / LW) * 0.9),
    (x, y, z) => (isTop(x, y, z) ? SW.leaf : SW.leafUn)));
  // lighter raised midrib along the fold
  const mr = [];
  for (const z of [LZ0 + 0.01, 0.26, 0.33, 0.4, 0.46, LZ1 - 0.015]) {
    const y = yc(z) + LT; mr.push(V(0.008, y - 0.002, z), V(-0.008, y - 0.002, z), V(0, y + 0.007, z));
  }
  C.push(paint(hull(mr), SW.rib, 'flat'));
  const mu = [];
  for (const z of [0.4, 0.45, LZ1 - 0.012]) { const y = yc(z); mu.push(V(0.007, y + 0.002, z), V(-0.007, y + 0.002, z), V(0, y - 0.005, z)); }
  C.push(paint(hull(mu), SW.rib, 'flat'));
  // side veins (lighter), lying on the upper face
  for (const z of [0.27, 0.35, 0.42]) {
    const z2 = z + 0.045, x2 = wOf((z2 - LZ0) / (LZ1 - LZ0)) * 0.75;
    const y0 = yc(z) + LT + 0.002, y1 = yc(z2) + x2 * fold + LT + 0.002;
    S.push(paint(hull([V(0.006, y0, z), V(0.006, y0 + 0.004, z), V(0.006, y0, z + 0.016),
      V(x2, y1, z2), V(x2, y1 + 0.003, z2), V(x2 - 0.01, y1 - 0.003 * fold, z2 - 0.004)]), SW.rib, 'flat'));
  }
  // stem curling up at the back
  C.push(paint(tube([
    { p: V(0, yc(LZ0) + 0.006, LZ0 + 0.012), rx: 0.009, ry: 0.009 },
    { p: V(0, 0.9, 0.175), rx: 0.009, ry: 0.009 },
    { p: V(0, 0.912, 0.148), rx: 0.0085, ry: 0.0085 },
    { p: V(0, 0.937, 0.14), rx: 0.008, ry: 0.008 },
    { p: V(0, 0.955, 0.155), rx: 0.007, ry: 0.007 },
    { p: V(0, 0.958, 0.172), rx: 0.006, ry: 0.006 },
  ], { seg: 5, axis: V(1, 0, 0), capEnd: 0.006 }), SW.vine, 'flat'));

  // ================= VINE COLLAR + LEAVES =================
  const NC = V(0, 0.5, 0.25);
  const vs = [];
  const NV = 9;
  for (let i = 0; i < NV; i++) {
    const a = Math.PI / 2 - (Math.PI * i) / (NV - 1); // top .. bottom
    vs.push({ p: V(Math.cos(a) * 0.178, NC.y + Math.sin(a) * 0.135, NC.z - 0.075 * Math.sin(a)), rx: 0.02, ry: 0.02 });
  }
  S.push(paint(tube(vs, { seg: 6, axis: V(0, 0, 1), twist: (i) => (i % 2) * Math.PI / 6, scale: (i) => (i % 2 ? 1.15 : 0.9) }), SW.vine, 'y', [0.35, 0.7]));
  const vleaf = (b, d, nrm, w, l) => S.push(paint(leafBlade(b, d, nrm, w, l), SW.leaf, 'y', [0.3, 0.75]));
  vleaf(V(0.165, 0.57, 0.2), V(0.6, 0.6, 0.6), V(1, -0.2, 0.3), 0.034, 0.1);
  vleaf(V(0.185, 0.49, 0.25), V(0.5, -0.4, 0.8), V(1, 0, 0.2), 0.032, 0.095);
  vleaf(V(0.12, 0.41, 0.3), V(0.4, -0.7, 0.6), V(0.3, 0, 1), 0.03, 0.085);
  // carved jade pendant hanging from the vine at the chest
  const P = V(0, 0.33, 0.335);
  C.push(paint(hull(plate([[-0.045, 0.02], [-0.02, 0.045], [0.02, 0.045], [0.045, 0.02], [0.045, -0.02], [0.02, -0.05], [-0.02, -0.05], [-0.045, -0.02]],
    P, P.z - 0.012, P.z + 0.01)), SW.jade, 'y', [P.y - 0.05, P.y + 0.05]));
  C.push(paint(hull(plate([[0, 0.03], [0.022, 0], [0, -0.032], [-0.022, 0]], P, P.z + 0.006, P.z + 0.02)), SW.jadeDk, 'flat'));
  C.push(paint(hull(plate([[0, 0.012], [0.009, 0], [0, -0.014], [-0.009, 0]], P, P.z + 0.016, P.z + 0.026)), SW.jade, 'flat'));

  for (const g of [...C, ...S]) g.translate(0, DY, 0);
  return assemble([...C, ...CL], [...S, ...SL]);
}

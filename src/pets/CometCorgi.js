// Comet Corgi (ROBUX EGG): orange & white corgi, pointy ears, glowing comet tail,
// ornate cosmic armour with gold trim, meteor-rock gems, glowing eyes and comet-trail runes.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  orange:  { i: 0, top: '#FFA545', bot: '#D9621A' },
  white:   { i: 1, top: '#FFFFFF', bot: '#EDE3D6' },
  ear:     { i: 2, top: '#FFB4A6', bot: '#E8857A' },
  nose:    { i: 3, top: '#3A3438', bot: '#141114' },
  eye:     { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  eyeW:    { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  brow:    { i: 6, top: '#F49238', bot: '#BE5418' },
  armor:   { i: 7, top: '#5A4BD0', bot: '#2A1F78' },
  gold:    { i: 8, top: '#FFE46C', bot: '#E39E12' },
  goldDk:  { i: 9, top: '#F6C431', bot: '#B9780C' },
  rock:    { i: 10, top: '#9C8294', bot: '#4E3A52' },
  cyan:    { i: 11, top: '#9FF7FF', bot: '#1FB8FF', glow: true },
  comet:   { i: 12, top: '#FFFBE0', bot: '#FFB23A', glow: true },
  fire:    { i: 13, top: '#FFD86B', bot: '#FF7A1A', glow: true },
  iris:    { i: 14, top: '#9FF7FF', bot: '#22C8F5', glow: true },
  mouth:   { i: 15, top: '#5A2E1A', bot: '#3E1E10' },
  paw:     { i: 16, top: '#FFFFFF', bot: '#E2D6C6' },
  plume:   { i: 17, top: '#B8FBFF', bot: '#2AA8FF', glow: true },
};
const SW = PALETTE;

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);

// uv of a swatch at gradient t (same mapping as kit's paint)
function uvAt(sw, t) {
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  return [(x + 24 + 40) / 1024, (y + 16 + THREE.MathUtils.clamp(t, 0, 1) * 96) / 1024];
}
// per-facet two-tone paint: each triangle gets swatch B if test(centroid, normal) else A (crisp facet markings)
function paint2(g, A, B, test, lo, hi) {
  const p = g.attributes.position, uv = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    const cen = a.clone().add(b).add(c).divideScalar(3);
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const sw = test(cen, n) ? B : A;
    for (const v of [a, b, c]) uv.push(...uvAt(sw, 1 - (v.y - lo) / (hi - lo)));
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const flat = (g, sw) => paint(g, sw, 'flat');
  const grad = (g, sw, lo, hi) => paint(g, sw, 'y', lo === undefined ? null : [lo, hi]);
  const rigid = new Set(), legs = new Set(), wideExtra = [];
  const R = (g) => (rigid.add(g), g);   // body detail that moves outward with the widened torso but keeps its shape
  const L = (g) => (legs.add(g), g);    // leg parts: thickened front-to-back

  // ================= BODY (long corgi barrel, white belly facets) =================
  const bellyTest = (c, n) => c.y < 0.25 || (n.y < -0.35 && c.z > -0.2) || (c.z > 0.2 && c.y < 0.36 && n.z > 0.3);
  C.push(paint2(hull([
    ...ring(V(0, 0.36, -0.36), 0.09, 0.085, 10, 'z'),
    ...ring(V(0, 0.35, -0.3), 0.155, 0.135, 10, 'z'),
    ...ring(V(0, 0.34, -0.12), 0.17, 0.145, 10, 'z'),
    ...ring(V(0, 0.35, 0.06), 0.175, 0.15, 10, 'z'),
    ...ring(V(0, 0.38, 0.2), 0.16, 0.15, 10, 'z'),
    ...ring(V(0, 0.41, 0.27), 0.1, 0.11, 10, 'z'),
  ]), SW.orange, SW.white, bellyTest, 0.15, 0.55));
  // neck
  C.push(paint2(hull([...ring(V(0, 0.42, 0.17), 0.13, 0.12, 10, 'y'), ...ring(V(0, 0.6, 0.24), 0.13, 0.12, 10, 'y')]),
    SW.orange, SW.white, (c, n) => n.z > 0.5, 0.3, 0.8));

  // ================= LEGS (short, thick; orange top, white socks, chunky paws) =================
  // front leg: orange upper column, white sock below (seam hidden by the gold bracer)
  S.push(L(grad(hull([...ring(V(0.118, 0.16, 0.195), 0.07, 0.072, 8), ...ring(V(0.108, 0.3, 0.17), 0.09, 0.097, 8),
    ...ring(V(0.09, 0.4, 0.15), 0.07, 0.08, 8)]), SW.orange, 0.1, 0.5)));
  S.push(L(grad(hull([...ring(V(0.12, 0.05, 0.2), 0.064, 0.064, 8), ...ring(V(0.118, 0.18, 0.196), 0.068, 0.07, 8)]), SW.white, 0.0, 0.2)));
  // back leg: haunch + short shin + white sock
  S.push(L(grad(hull([...ring(V(0.11, 0.42, -0.2), 0.07, 0.1, 8), ...ring(V(0.13, 0.3, -0.2), 0.097, 0.135, 8),
    ...ring(V(0.13, 0.2, -0.19), 0.08, 0.092, 8)]), SW.orange, 0.1, 0.55)));
  S.push(L(grad(hull([...ring(V(0.132, 0.24, -0.2), 0.07, 0.075, 8), ...ring(V(0.135, 0.15, -0.225), 0.067, 0.067, 8)]), SW.orange, 0.1, 0.5)));
  S.push(L(grad(hull([...ring(V(0.135, 0.16, -0.224), 0.066, 0.066, 8), ...ring(V(0.136, 0.05, -0.22), 0.064, 0.064, 8)]), SW.white, 0.0, 0.2)));
  const paw = (x, z) => {
    S.push(L(grad(hull(cbox(V(x, 0.04, z - 0.005), 0.068, 0.04, 0.062, 0.02)), SW.paw, 0, 0.09)));
    for (const dx of [-0.043, 0, 0.043])
      S.push(L(grad(hull(cbox(V(x + dx, 0.032, z + 0.056), 0.024, 0.032, 0.03, 0.011)), SW.paw, 0, 0.09)));
  };
  paw(0.122, 0.205);
  paw(0.136, -0.205);
  // gold bracers with glowing comet gem on the front legs
  S.push(L(grad(hull([...ring(V(0.119, 0.15, 0.196), 0.074, 0.076, 8, 'y'), ...ring(V(0.119, 0.2, 0.192), 0.079, 0.081, 8, 'y')]), SW.gold)));
  S.push(flat(hull(plate([[-0.018, 0], [0, 0.024], [0.018, 0], [0, -0.024]], V(0.119, 0.175, 0), 0.272, 0.298)), SW.cyan));
  // gold anklets on the back legs
  S.push(L(grad(hull([...ring(V(0.135, 0.14, -0.225), 0.07, 0.07, 8, 'y'), ...ring(V(0.135, 0.18, -0.218), 0.075, 0.075, 8, 'y')]), SW.gold)));

  // ================= WHITE CHEST RUFF (shards) =================
  C.push(paint(blob(1, V(0, 0.45, 0.26), V(0.13, 0.15, 0.09), { jitter: 0.18 }), SW.white, 'y', [0.26, 0.62]));
  C.push(flat(shard(V(0, 0.3, 0.27), V(0, -1, 0.35), 0.05, 0.1), SW.white));
  for (const [b, d, w, l] of [
    [V(0.05, 0.31, 0.27), V(0.25, -1, 0.35), 0.045, 0.09],
    [V(0.1, 0.34, 0.25), V(0.6, -1, 0.3), 0.045, 0.08],
    [V(0.13, 0.44, 0.26), V(0.9, -0.7, 0.6), 0.045, 0.07],
    [V(0.14, 0.53, 0.24), V(1, -0.4, 0.5), 0.045, 0.06],
  ]) S.push(flat(shard(b, d, w, l), SW.white));

  // ================= ARMOUR (cosmic indigo plates, gold trim, meteor gems, glowing runes) =================
  // chest plate with a meteor-rock gem
  C.push(grad(hull([
    ...plate([[-0.1, 0.06], [0.1, 0.06], [0.12, 0.0], [0.06, -0.09], [0, -0.115], [-0.06, -0.09], [-0.12, 0.0]], V(0, 0.47, 0), 0.31, 0.35, 0),
    V(0, 0.45, 0.375),
  ]), SW.armor, 0.33, 0.55));
  C.push(grad(hull([
    ...plate([[-0.115, 0.075], [0.115, 0.075], [0.135, 0.0], [0.07, -0.1], [0, -0.13], [-0.07, -0.1], [-0.135, 0.0]], V(0, 0.47, 0), 0.3, 0.335, 0),
  ]), SW.gold));
  // gold bezel + meteor rock with a blazing glowing core
  C.push(R(grad(hull([...ring(V(0, 0.46, 0.355), 0.062, 0.066, 8, 'z'), ...ring(V(0, 0.46, 0.38), 0.056, 0.06, 8, 'z')]), SW.goldDk)));
  C.push(R(grad(hull([...ring(V(0, 0.46, 0.375), 0.048, 0.052, 6, 'z', 0), ...ring(V(0, 0.462, 0.4), 0.034, 0.038, 6, 'z', 0.3), V(0, 0.47, 0.412)]), SW.rock, 0.41, 0.51)));
  C.push(R(flat(hull(plate([[0, 0.026], [0.02, 0], [0, -0.026], [-0.02, 0]], V(0, 0.462, 0), 0.4, 0.418)), SW.fire)));
  S.push(R(flat(hull(plate([[0, 0.006], [0.036, 0.004], [0.044, 0], [0.036, -0.004], [0, -0.006]], V(0, 0.462, 0), 0.392, 0.41)), SW.fire)));
  // gold star points radiating from the bezel
  for (const [dx, dy] of [[0, 1], [0.7, 0.7], [0.7, -0.7], [0, -1]]) {
    const g = flat(shard(V(0.06 * dx, 0.46 + 0.064 * dy, 0.37), V(dx, dy, 0.15), 0.016, 0.035), SW.gold);
    (dx === 0 ? C : S).push(R(g));
  }

  // gold collar
  C.push(grad(hull([...ring(V(0, 0.55, 0.22), 0.14, 0.13, 10, 'y'), ...ring(V(0, 0.6, 0.235), 0.142, 0.132, 10, 'y')]), SW.gold));

  // back saddle armour: shell over the top of the torso
  const shell = (z, rx, ry, cy) => {
    const pts = [];
    for (let k = 0; k <= 8; k++) {
      const a = (Math.PI * (0.08 + 0.84 * k / 8));
      pts.push(V(Math.cos(a) * rx, cy + Math.sin(a) * ry, z));
    }
    return pts;
  };
  C.push(grad(hull([
    ...shell(-0.25, 0.165, 0.15, 0.345), ...shell(-0.1, 0.185, 0.165, 0.34),
    ...shell(0.04, 0.19, 0.168, 0.35), ...shell(0.12, 0.178, 0.16, 0.37),
  ]), SW.armor, 0.3, 0.53));
  // gold trim bands front and back of the saddle
  for (const [z, rx, ry, cy] of [[0.12, 0.186, 0.168, 0.37], [-0.25, 0.173, 0.158, 0.345]])
    C.push(grad(hull([...shell(z - 0.018, rx, ry, cy), ...shell(z + 0.018, rx, ry, cy)]), SW.gold));
  // gold spine ridge with crest shards
  C.push(grad(hull([...cbox(V(0, 0.515, -0.08), 0.025, 0.012, 0.13, 0.008)]), SW.gold));
  for (const [z, l] of [[0.06, 0.07], [-0.04, 0.085], [-0.14, 0.07]])
    C.push(grad(shard(V(0, 0.525, z), V(0, 1, -0.45), 0.032, l, 4, 0.45), SW.goldDk));
  // glowing comet-trail runes on the saddle flanks: a star head + streaks trailing backward
  // side plate: 2D polygon in (z, y), extruded along x between x0 and x1
  const sidePlate = (pts, x0, x1) => pts.flatMap(([z, y]) => [V(x0, y, z), V(x1, y, z)]);
  // 4-point star head of the comet
  const star = (z, y, r) => [[z + r, y], [z + r * 0.3, y + r * 0.3], [z, y + r], [z - r * 0.3, y + r * 0.3], [z - r, y],
    [z - r * 0.3, y - r * 0.3], [z, y - r], [z + r * 0.3, y - r * 0.3]];
  // star on flank (outward-leaning saddle surface is around x=0.19 at y=0.4)
  S.push(flat(hull(sidePlate(star(0.0, 0.42, 0.034), 0.17, 0.198)), SW.cyan));
  // trailing streaks behind the star
  for (const [y0, y1, z0, z1, x] of [[0.43, 0.445, -0.03, -0.17, 0.197], [0.405, 0.415, -0.035, -0.13, 0.196]])
    S.push(flat(hull(sidePlate([[z0, y0 - 0.01], [z0, y1 + 0.006], [z1, (y0 + y1) / 2]], x - 0.03, x)), SW.cyan));

  // shoulder pauldrons
  S.push(grad(hull([
    ...ring(V(0.165, 0.43, 0.15), 0.07, 0.08, 8, 'x'), ...ring(V(0.2, 0.42, 0.15), 0.055, 0.065, 8, 'x'), V(0.13, 0.5, 0.15),
  ]), SW.armor, 0.33, 0.52));
  S.push(grad(hull([...ring(V(0.2, 0.42, 0.15), 0.06, 0.07, 8, 'x'), ...ring(V(0.215, 0.42, 0.15), 0.052, 0.062, 8, 'x')]), SW.gold));
  S.push(grad(shard(V(0.19, 0.47, 0.15), V(0.6, 1, 0), 0.026, 0.07), SW.goldDk));
  S.push(R(grad(hull([...ring(V(0.215, 0.42, 0.15), 0.036, 0.04, 6, 'x', 0), ...ring(V(0.238, 0.422, 0.15), 0.024, 0.028, 6, 'x', 0.3)]), SW.rock, 0.38, 0.46)));
  S.push(R(flat(hull(plate([[0, 0.018], [0.014, 0], [0, -0.018], [-0.014, 0]], V(0, 0, 0), 0, 0.001).map((v) => V(0.236 + v.z * 8, 0.422 + v.y, 0.15 + v.x))), SW.fire)));

  // white corgi rump fluff under the tail
  C.push(paint(blob(1, V(0, 0.31, -0.3), V(0.12, 0.085, 0.07), { jitter: 0.2 }), SW.white, 'y', [0.2, 0.4]));
  C.push(flat(shard(V(0, 0.27, -0.34), V(0, -0.8, -1), 0.06, 0.09), SW.white));
  for (const [b, d] of [[V(0.07, 0.28, -0.33), V(0.4, -0.8, -1)], [V(0.11, 0.33, -0.3), V(0.9, -0.5, -0.8)]])
    S.push(flat(shard(b, d, 0.055, 0.085), SW.white));
  const bodyC = C.slice(), bodyS = S.slice();

  // ================= HEAD (big, wide foxy corgi head, bevelled crown and back) =================
  const H = { y: 0.69, z: 0.28 };
  const faceWhite = (c, n) => (c.y < H.y - 0.06 && n.z > -0.2);
  C.push(paint2(hull([
    ...cbox(V(0, H.y - 0.01, H.z + 0.02), 0.215, 0.12, 0.13, 0.045),
    ...ring(V(0, H.y + 0.14, H.z - 0.01), 0.16, 0.115, 10, 'y'),        // bevelled crown
    ...ring(V(0, H.y + 0.165, H.z - 0.02), 0.09, 0.065, 8, 'y'),
    ...ring(V(0, H.y + 0.0, H.z - 0.15), 0.17, 0.115, 10, 'z'),         // rounded back of skull
    ...ring(V(0, H.y + 0.01, H.z - 0.175), 0.1, 0.07, 8, 'z'),
    V(0.245, H.y - 0.07, H.z + 0.03), V(-0.245, H.y - 0.07, H.z + 0.03), // cheeks
  ]), SW.orange, SW.white, faceWhite, 0.5, 0.88));
  const FZ = H.z + 0.15;

  // white blaze up the forehead
  C.push(flat(hull([V(0.034, H.y - 0.02, FZ + 0.006), V(-0.034, H.y - 0.02, FZ + 0.006), V(0.016, H.y + 0.09, FZ - 0.003),
    V(-0.016, H.y + 0.09, FZ - 0.003), V(0.03, H.y - 0.02, FZ - 0.03), V(-0.03, H.y - 0.02, FZ - 0.03),
    V(0.014, H.y + 0.09, FZ - 0.03), V(-0.014, H.y + 0.09, FZ - 0.03)]), SW.white));
  // cheek fluff shards (white)
  S.push(flat(shard(V(0.215, H.y - 0.07, H.z + 0.04), V(1, -0.45, 0.25), 0.055, 0.09), SW.white));
  S.push(flat(shard(V(0.2, H.y - 0.11, H.z - 0.03), V(0.85, -0.8, -0.2), 0.05, 0.085), SW.white));
  S.push(flat(shard(V(0.215, H.y - 0.02, H.z - 0.05), V(1, -0.15, -0.4), 0.05, 0.08), SW.orange));
  S.push(flat(shard(V(0.15, H.y - 0.12, H.z + 0.07), V(0.5, -1, 0.3), 0.045, 0.07), SW.white));
  // nape tuft: shards fanning down-back where the skull meets the neck
  C.push(flat(shard(V(0, H.y - 0.03, H.z - 0.16), V(0, -0.7, -0.8), 0.06, 0.1), SW.orange));
  S.push(flat(shard(V(0.08, H.y - 0.045, H.z - 0.15), V(0.4, -0.75, -0.7), 0.055, 0.09), SW.orange));
  S.push(flat(shard(V(0.145, H.y - 0.07, H.z - 0.1), V(0.8, -0.8, -0.5), 0.05, 0.08), SW.brow));
  // forehead tuft
  C.push(flat(shard(V(0, H.y + 0.15, H.z - 0.04), V(0, 1, -0.6), 0.035, 0.06), SW.orange));

  // foxy white muzzle, jaw, nose, mouth
  C.push(paint(hull([...cbox(V(0, H.y - 0.07, FZ + 0.070), 0.088, 0.055, 0.075, 0.028),
    V(0.06, H.y - 0.005, FZ - 0.01), V(-0.06, H.y - 0.005, FZ - 0.01), V(0, H.y - 0.025, FZ + 0.105)]), SW.white, 'y', [0.58, 0.72]));
  C.push(paint(hull(cbox(V(0, H.y - 0.125, FZ + 0.035), 0.068, 0.028, 0.07, 0.014)), SW.white, 'flat'));
  C.push(paint(hull([...cbox(V(0, H.y - 0.035, FZ + 0.148), 0.04, 0.02, 0.018, 0.009),
    V(0, H.y - 0.066, FZ + 0.140), V(0.018, H.y - 0.058, FZ + 0.140), V(-0.018, H.y - 0.058, FZ + 0.140)]), SW.nose, 'y'));
  C.push(paint(hull(cbox(V(0, H.y - 0.085, FZ + 0.144), 0.005, 0.02, 0.005, 0.002)), SW.mouth, 'flat'));
  S.push(paint(hull([V(0, H.y - 0.105, FZ + 0.149), V(0, H.y - 0.094, FZ + 0.149), V(0.048, H.y - 0.113, FZ + 0.137),
    V(0.048, H.y - 0.104, FZ + 0.137), V(0, H.y - 0.105, FZ + 0.139), V(0.048, H.y - 0.11, FZ + 0.125)]), SW.mouth, 'flat'));

  // fierce glowing eyes: big white almond, big black pupil inside a thin glowing cyan rim, cyan catchlight
  const E = V(0.092, H.y + 0.025, 0);
  const sc = (pts, k) => pts.map(([u, v]) => [u * k, v * k]);
  const pupil = [[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]];
  S.push(flat(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]], 1.2),
    E, FZ - 0.01, FZ + 0.012)), SW.eyeW));
  S.push(flat(hull(plate(sc(pupil, 1.3), V(E.x - 0.004, E.y - 0.002, 0), FZ + 0.005, FZ + 0.016)), SW.iris));
  S.push(flat(hull(plate(sc(pupil, 1.06), V(E.x - 0.004, E.y - 0.004, 0), FZ + 0.01, FZ + 0.021)), SW.eye));
  S.push(flat(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.016, FZ + 0.025)), SW.iris));
  // heavy brow ridge slanting down to the centre
  S.push(grad(hull([
    V(0.026, E.y + 0.016, FZ + 0.032), V(0.028, E.y + 0.056, FZ + 0.022),
    V(0.175, E.y + 0.056, FZ - 0.01), V(0.175, E.y + 0.096, FZ - 0.025),
    V(0.026, E.y + 0.016, FZ - 0.03), V(0.028, E.y + 0.066, FZ - 0.04),
    V(0.175, E.y + 0.056, FZ - 0.06), V(0.175, E.y + 0.098, FZ - 0.07),
  ]), SW.brow));

  // big pointy corgi ears (orange outer, pink inner, gold tip cuff)
  const earBase = V(0.115, H.y + 0.1, H.z - 0.03), earTip = V(0.21, H.y + 0.36, H.z - 0.04);
  S.push(grad(hull([
    V(0.05, H.y + 0.13, H.z + 0.02), V(0.2, H.y + 0.08, H.z + 0.02),
    V(0.06, H.y + 0.12, H.z - 0.08), V(0.21, H.y + 0.06, H.z - 0.08),
    earTip,
  ]), SW.orange, H.y, H.y + 0.36));
  S.push(grad(hull([
    V(0.085, H.y + 0.14, H.z + 0.024), V(0.18, H.y + 0.105, H.z + 0.024),
    V(0.09, H.y + 0.14, H.z + 0.0), V(0.18, H.y + 0.105, H.z + 0.0),
    V(0.202, H.y + 0.31, H.z - 0.025),
  ]), SW.ear, H.y + 0.1, H.y + 0.32));

  // forehead armour crest: gold chevron with a meteor gem
  C.push(grad(hull([
    V(0, H.y + 0.1, FZ + 0.012), V(0.05, H.y + 0.13, FZ - 0.008), V(-0.05, H.y + 0.13, FZ - 0.008),
    V(0, H.y + 0.16, FZ - 0.02), V(0, H.y + 0.1, FZ - 0.03), V(0.05, H.y + 0.135, FZ - 0.05), V(-0.05, H.y + 0.135, FZ - 0.05),
  ]), SW.gold));
  C.push(flat(shard(V(0, H.y + 0.13, FZ - 0.005), V(0, 0.2, 1), 0.02, 0.024), SW.cyan));

  // ================= COMET TAIL (short fluffy orange base -> blazing comet head + wide flame trails) =================
  C.push(paint(tube(curveSamples([V(0, 0.4, -0.32), V(0, 0.47, -0.4), V(0, 0.54, -0.46)], 4, (t) => 0.07 + 0.015 * t),
    { seg: 8, axis: X, capEnd: 0.0, phase: Math.PI / 8 }), SW.orange, 'len'));
  for (const [b, d] of [[V(0.05, 0.52, -0.43), V(0.8, 0.3, 0.2)], [V(0.04, 0.48, -0.46), V(0.6, -0.5, -0.4)]])
    S.push(flat(shard(b, d, 0.035, 0.06), SW.orange));
  C.push(flat(shard(V(0, 0.46, -0.47), V(0, -0.6, -1), 0.035, 0.06), SW.orange));
  // comet head: big bright faceted core
  const CH = V(0, 0.64, -0.53);
  C.push(paint(blob(1, CH, V(0.125, 0.12, 0.125), { jitter: 0.18 }), SW.comet, 'y', [CH.y - 0.12, CH.y + 0.12]));
  // meteor rock nucleus set into the front of the comet head, with glowing orange cracks
  const MR = add(CH, V(0, 0.01, 0.115));
  C.push(paint(blob(0, MR, V(0.095, 0.088, 0.08), { jitter: 0.3 }), SW.rock, 'y', [MR.y - 0.07, MR.y + 0.07]));
  const crack = (pts) => paint(hull(pts.flatMap((q) => { const n = q.clone().sub(MR).normalize(); return [add(MR, n, 0.075), add(MR, n, 0.1)]; })), SW.fire, 'y', [MR.y + 0.2, MR.y + 0.21]); // deep orange end of the fire swatch
  // glowing cracks: a vertical seam down the front and a forked seam across each side
  C.push(crack([add(MR, V(-0.012, -0.045, 0.06)), add(MR, V(0.012, -0.045, 0.06)), add(MR, V(0.01, 0.055, 0.052)), add(MR, V(-0.01, 0.055, 0.052))]));
  S.push(crack([add(MR, V(0.006, 0.005, 0.07)), add(MR, V(0.006, -0.012, 0.07)), add(MR, V(0.075, -0.02, 0.02)), add(MR, V(0.078, 0.0, 0.016))]));
  S.push(flat(shard(add(MR, V(0.06, 0.04, 0.03)), V(0.7, 0.6, 0.4), 0.018, 0.045), SW.fire));
  S.push(flat(shard(add(MR, V(0.05, -0.05, 0.03)), V(0.7, -0.6, 0.5), 0.016, 0.04), SW.fire));
  // flame collar where the fur ignites
  for (const [b, d] of [[V(0.055, 0.54, -0.46), V(0.8, 0.5, 0.3)], [V(0.06, 0.55, -0.52), V(0.8, 0.3, -0.5)]])
    S.push(flat(shard(b, d, 0.035, 0.075), SW.fire));

  // wide flat flame blades fanning back from the comet head (colour runs base -> tip)
  const blade = (base, dir, wdir, Lb, w, th, sw) => {
    const d = dir.clone().normalize();
    const v = wdir.clone().addScaledVector(d, -wdir.dot(d)).normalize();
    const nn = new THREE.Vector3().crossVectors(d, v);
    const shape = [[0, -0.55], [0, 0.55], [0.3, 0.7], [0.62, 0.5], [1, 0], [0.62, -0.5], [0.3, -0.7]];
    const pts = [];
    for (const [u, k] of shape) {
      const q = add(add(base, d, u * Lb), v, k * w);
      const t = th * (1 - 0.7 * u);
      pts.push(add(q, nn, t / 2), add(q, nn, -t / 2));
    }
    const g = hull(pts), pp = g.attributes.position, uv = [];
    for (let i = 0; i < pp.count; i++) {
      const q = V(pp.getX(i), pp.getY(i), pp.getZ(i));
      uv.push(...uvAt(sw, 0.1 + 0.9 * q.sub(base).dot(d) / Lb));
    }
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return g;
  };
  // centre: big golden fire blade, wide side-to-side
  C.push(blade(add(CH, V(0, 0.03, -0.05)), V(0, 0.72, -0.7), X, 0.5, 0.13, 0.075, SW.fire));
  // upper cyan pair, wide in the vertical plane, splaying out
  S.push(blade(add(CH, V(0.05, 0.02, -0.05)), V(0.42, 0.5, -0.76), V(0, 1, 0.3), 0.46, 0.11, 0.05, SW.plume));
  // lower cyan pair streaming straight back
  S.push(blade(add(CH, V(0.05, -0.04, -0.04)), V(0.38, 0.05, -0.92), V(0, 1, 0), 0.42, 0.09, 0.045, SW.plume));

  // stocky corgi loaf: widen the torso ~20%; armour gems move out but keep their shape; legs thicken front-to-back
  for (const g of [...bodyC, ...bodyS]) {
    const p = g.attributes.position;
    g.computeBoundingBox();
    const bb = g.boundingBox, cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2;
    for (let i = 0; i < p.count; i++) {
      if (rigid.has(g)) p.setX(i, p.getX(i) + cx * 0.2);
      else p.setX(i, p.getX(i) * 1.2);
      if (legs.has(g)) p.setZ(i, cz + (p.getZ(i) - cz) * 1.12);
    }
  }
  // corgi legs: compress the lower legs so the long body sits low
  for (const g of [...C, ...S]) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      p.setY(i, y - 0.045 * THREE.MathUtils.clamp((y - 0.08) / 0.14, 0, 1));
    }
    g.computeVertexNormals();
  }
  return assemble(C, S);
}

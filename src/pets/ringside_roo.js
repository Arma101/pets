// Ringside Roo: chunky faceted boxing kangaroo, upright on big hind legs, leaning on its tail.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  fur:    { i: 0, top: '#F4A95E', bot: '#C9732F' },
  cream:  { i: 1, top: '#FFF3DC', bot: '#F0D3A4' },
  earIn:  { i: 2, top: '#F7AEB8', bot: '#E28494' },
  nose:   { i: 3, top: '#3A3438', bot: '#141114' },
  eye:    { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  muzzle: { i: 6, top: '#FBE6C2', bot: '#E7C38E' },
  tail:   { i: 7, top: '#EC9E52', bot: '#C46E2D' },
  brow:   { i: 8, top: '#E69445', bot: '#B8682A' },
  paw:    { i: 9, top: '#3B302C', bot: '#1C1614' },
  mouth:  { i: 10, top: '#5A2E1A', bot: '#3E1E10' },
  toe:    { i: 11, top: '#FCEBC6', bot: '#DDB57C' },
};
const SW = PALETTE;

// uv for a swatch (copy of kit's private helper)
function swUV(sw, t, u = 0.5) {
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  return [(x + 24 + u * 80) / 1024, (y + 16 + Math.min(1, Math.max(0, t)) * 96) / 1024];
}
// per-face painter: fn(normal, centroid, vertexY) -> [swatch, t]
function paintFaces(g, fn) {
  const p = g.attributes.position, uv = [];
  const a = V(0, 0, 0), b = V(0, 0, 0), c = V(0, 0, 0);
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const cen = a.clone().add(b).add(c).divideScalar(3);
    for (const v of [a, b, c]) { const [sw, t] = fn(n, cen, v); uv.push(...swUV(sw, t)); }
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const fur = (pts, lo = 0.0, hi = 1.0) => paint(hull(pts), SW.fur, 'y', [lo, hi]);
  const cream = (g, lo, hi) => paint(g, SW.cream, lo === undefined ? 'flat' : 'y', lo === undefined ? null : [lo, hi]);
  const tuft = (b, d, w, l) => paint(shard(b, d, w, l), SW.fur, 'y', [0.1, 0.9]);

  // ================= TORSO (pear shape, leaning forward) =================
  C.push(fur([
    ...ring(V(0, 0.17, -0.14), 0.1, 0.1, 12, 'y'),
    ...ring(V(0, 0.27, -0.11), 0.155, 0.15, 12, 'y'),
    ...ring(V(0, 0.38, -0.01), 0.155, 0.15, 12, 'y'),
    ...ring(V(0, 0.49, 0.1), 0.135, 0.125, 12, 'y'),
    ...ring(V(0, 0.57, 0.17), 0.1, 0.095, 12, 'y'),
  ], 0.1, 0.75));
  // cream belly / chest plate
  C.push(cream(hull([
    ...ring(V(0, 0.2, -0.02), 0.07, 0.05, 8, 'y'),
    ...ring(V(0, 0.32, 0.08), 0.1, 0.06, 8, 'y'),
    ...ring(V(0, 0.46, 0.17), 0.105, 0.055, 8, 'y'),
    ...ring(V(0, 0.58, 0.24), 0.07, 0.05, 8, 'y'),
    ...ring(V(0, 0.68, 0.3), 0.065, 0.035, 8, 'y'),
  ]), 0.0, 0.75));
  // neck
  C.push(fur([...ring(V(0, 0.52, 0.14), 0.11, 0.105, 10, 'y'), ...ring(V(0, 0.69, 0.23), 0.105, 0.1, 10, 'y')], 0.4, 0.85));
  // back fur shards: low, flat, lying back along the spine
  const flatTuft = (b, d, w, l) => paint(shard(b, d, w, l, 4, 0.45), SW.fur, 'y', [0.1, 0.9]);
  C.push(flatTuft(V(0, 0.625, 0.11), V(0, -0.6, -1), 0.06, 0.06));
  C.push(flatTuft(V(0, 0.535, 0.01), V(0, -0.65, -1), 0.06, 0.06));
  S.push(flatTuft(V(0.055, 0.585, 0.065), V(0.4, -0.6, -1), 0.05, 0.055));
  // ================= HIND LEGS =================
  // huge haunch
  S.push(fur([
    ...ring(V(0.05, 0.27, -0.06), 0.15, 0.13, 12, 'x'),
    ...ring(V(0.11, 0.255, -0.035), 0.185, 0.155, 12, 'x', 0.1),
    ...ring(V(0.165, 0.245, -0.02), 0.175, 0.145, 12, 'x'),
    ...ring(V(0.21, 0.24, 0.0), 0.11, 0.09, 12, 'x', 0.1),
  ], 0.05, 0.45));
  // shin: from knee down/back to the heel
  S.push(fur([...ring(V(0.13, 0.2, 0.1), 0.055, 0.06, 8), ...ring(V(0.13, 0.06, -0.06), 0.05, 0.045, 8)], 0.0, 0.4));
  // long flat foot
  S.push(paint(hull([
    ...cbox(V(0.13, 0.038, 0.07), 0.056, 0.038, 0.15, 0.018),
    V(0.13, 0.08, -0.04), V(0.1, 0.07, -0.06), V(0.16, 0.07, -0.06),
  ]), SW.fur, 'y', [0.0, 0.14]));
  // cream toes
  for (const [dx, l] of [[-0.035, 0.035], [0.0, 0.045], [0.035, 0.035]])
    S.push(paint(hull(cbox(V(0.13 + dx, 0.026, 0.21 + l * 0.5), 0.019, 0.026, l, 0.008)), SW.toe, 'y', [0, 0.06]));

  // ================= ARMS (short, raised guard, dark paws) =================
  const sh = V(0.12, 0.55, 0.17), el = V(0.135, 0.43, 0.22), wr = V(0.1, 0.46, 0.31);
  S.push(fur([...ring(sh, 0.05, 0.05, 8), ...ring(el, 0.04, 0.04, 8)], 0.3, 0.7));
  S.push(fur([...ring(el, 0.04, 0.04, 8, 'z'), ...ring(wr, 0.034, 0.034, 8, 'z')], 0.3, 0.7));
  // dark paw: tapered palm + three chunky claws curling down
  S.push(paint(hull([...cbox(V(wr.x, wr.y + 0.002, wr.z + 0.012), 0.032, 0.022, 0.026, 0.01),
    ...cbox(V(wr.x, wr.y - 0.03, wr.z + 0.022), 0.026, 0.012, 0.022, 0.006)]), SW.paw, 'y', [0.4, 0.5]));
  for (const dx of [-0.017, 0, 0.017])
    S.push(paint(shard(V(wr.x + dx, wr.y - 0.035, wr.z + 0.03), V(0, -1, 0.7), 0.011, 0.032), SW.paw, 'flat'));

  // ================= TAIL (long, thick, resting on ground) =================
  C.push(paintFaces(tube(curveSamples(
    [V(0, 0.26, -0.18), V(0, 0.16, -0.36), V(0, 0.07, -0.55), V(0, 0.05, -0.72), V(0, 0.09, -0.88)],
    15, (t) => 0.1 * (1 - t * 0.8) + 0.012, (t) => 0.085 * (1 - t * 0.8) + 0.01),
    { seg: 10, axis: X, capEnd: 0.03 }), (n) => (n.y < -0.35 ? [SW.cream, 0.4] : [SW.tail, 0.3])));

  // ================= HEAD =================
  const H = { y: 0.77, z: 0.27 };
  C.push(fur([
    ...cbox(V(0, H.y, H.z + 0.04), 0.14, 0.105, 0.08, 0.04),
    ...cbox(V(0, H.y + 0.01, H.z - 0.06), 0.12, 0.085, 0.06, 0.04),
    ...ring(V(0, H.y + 0.125, H.z - 0.0), 0.095, 0.08, 8, 'y'),
    V(0.15, H.y - 0.05, H.z + 0.02), V(-0.15, H.y - 0.05, H.z + 0.02),
  ], 0.6, 0.97));
  const FZ = H.z + 0.12;
  // cheek fluff and back-of-head shards
  S.push(flatTuft(V(0.13, H.y - 0.06, H.z - 0.01), V(0.6, -0.5, -1), 0.04, 0.06));
  C.push(flatTuft(V(0, H.y + 0.06, H.z - 0.11), V(0, -0.2, -1), 0.05, 0.06));
  S.push(flatTuft(V(0.135, H.y - 0.075, H.z + 0.06), V(0.7, -0.7, -0.3), 0.035, 0.05));
  // cream throat ruff shards
  C.push(cream(shard(V(0, 0.6, 0.27), V(0, -1, 0.12), 0.045, 0.07, 4, 0.5)));
  S.push(cream(shard(V(0.05, 0.61, 0.255), V(0.4, -1, 0.1), 0.04, 0.06, 4, 0.5)));
  S.push(cream(shard(V(0.065, 0.53, 0.22), V(0.5, -1, 0.05), 0.04, 0.05, 4, 0.5)));
  // long muzzle tapering forward
  C.push(fur([
    ...cbox(V(0, H.y - 0.04, FZ - 0.02), 0.075, 0.055, 0.03, 0.02),
    V(0.03, H.y + 0.03, FZ - 0.03), V(-0.03, H.y + 0.03, FZ - 0.03),
    ...cbox(V(0, H.y - 0.03, FZ + 0.125), 0.056, 0.052, 0.02, 0.018),
  ], 0.62, 0.86));
  // cream lower jaw / chin
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.08, FZ - 0.03), 0.075, 0.032, 0.045, 0.012),
    ...cbox(V(0, H.y - 0.074, FZ + 0.115), 0.048, 0.022, 0.02, 0.008),
  ]), SW.muzzle, 'y', [0.62, 0.74]));
  // nose
  C.push(paint(hull([...cbox(V(0, H.y - 0.012, FZ + 0.152), 0.036, 0.022, 0.013, 0.006),
    V(0, H.y - 0.038, FZ + 0.146), ...cbox(V(0, H.y + 0.0, FZ + 0.13), 0.026, 0.012, 0.01, 0.004)]), SW.nose, 'y'));
  // mouth line
  C.push(paint(hull(cbox(V(0, H.y - 0.056, FZ + 0.132), 0.03, 0.004, 0.008, 0.002)), SW.mouth, 'flat'));
  S.push(paint(hull([V(0.02, H.y - 0.06, FZ + 0.142), V(0.02, H.y - 0.052, FZ + 0.142), V(0.058, H.y - 0.06, FZ + 0.08),
    V(0.058, H.y - 0.054, FZ + 0.08), V(0.02, H.y - 0.056, FZ + 0.13), V(0.052, H.y - 0.058, FZ + 0.075)]), SW.mouth, 'flat'));

  // eyes
  const E = V(0.074, H.y + 0.026, 0);
  S.push(paint(hull(plate([[-0.0414, 0.0023], [0.0414, 0.0322], [0.0483, -0.0092], [0.0196, -0.0368], [-0.0287, -0.0345], [-0.0437, -0.0149]],
    E, FZ - 0.01, FZ + 0.008, 0.35)), SW.white, 'flat'));
  S.push(paint(hull(plate([[-0.0264, 0.0023], [0.0149, 0.0184], [0.0218, -0.0069], [0.0046, -0.0287], [-0.0196, -0.0264], [-0.0299, -0.0092]],
    V(E.x - 0.004, E.y, 0), FZ + 0.004, FZ + 0.014, 0.35)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.0057, -0.0057], [0.0057, -0.0057], [0.0057, 0.0057], [-0.0057, 0.0057]],
    V(E.x + 0.004, E.y + 0.002, 0), FZ + 0.012 - 0.0014, FZ + 0.018 - 0.0014, 0.35)), SW.white, 'flat'));
  // brow
  S.push(paint(hull([
    V(0.02, E.y + 0.01, FZ + 0.028), V(0.02, E.y + 0.042, FZ + 0.018),
    V(0.125, E.y + 0.042, FZ - 0.01), V(0.125, E.y + 0.07, FZ - 0.02),
    V(0.02, E.y + 0.01, FZ - 0.02), V(0.02, E.y + 0.047, FZ - 0.03),
    V(0.115, E.y + 0.042, FZ - 0.05), V(0.115, E.y + 0.07, FZ - 0.055),
  ]), SW.brow, 'y'));

  // ears: tall broad leaves with pink inners, tilted outward
  const earBase = V(0.08, H.y + 0.1, H.z - 0.04);
  const up = V(0.45, 1, -0.18).normalize();
  const side = V(1, -0.45, 0).normalize();
  const nrm = new THREE.Vector3().crossVectors(side, up).normalize(); // faces forward-ish
  const EP = (u, v, w) => earBase.clone().addScaledVector(side, u).addScaledVector(up, v).addScaledVector(nrm, w);
  const outline = [[-0.05, 0], [0.05, 0], [0.08, 0.1], [0.065, 0.2], [0.005, 0.3], [-0.055, 0.2], [-0.075, 0.09]];
  S.push(fur(outline.flatMap(([u, v]) => [EP(u, v, -0.022), EP(u, v, 0.012)]), 0.8, 1.15));
  const inner = [[-0.03, 0.04], [0.035, 0.04], [0.058, 0.11], [0.044, 0.195], [0.004, 0.265], [-0.038, 0.19], [-0.054, 0.1]];
  S.push(paint(hull(inner.flatMap(([u, v]) => [EP(u, v, 0.008), EP(u, v, 0.018)])), SW.earIn, 'y'));

  return assemble(C, S);
}

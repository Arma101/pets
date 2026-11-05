// Witch Raven (Godly, Round 6 Swamp Slam): dark purple-black raven, glowing green eyes, shard crest,
// bone charm on a cord, swamp moss / bog roots / glowing spots, glowing runes and ornate gold armour.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  body:   { i: 0, top: '#6A4C92', bot: '#2E1F45' },
  feath:  { i: 1, top: '#5C3F84', bot: '#2A1B3F' },
  featD:  { i: 2, top: '#47306A', bot: '#1F1430' },
  belly:  { i: 3, top: '#7E62A6', bot: '#4A3468' },
  beak:   { i: 4, top: '#4A4458', bot: '#1C1824' },
  leg:    { i: 5, top: '#4B4060', bot: '#231C30' },
  gold:   { i: 6, top: '#FFE07A', bot: '#D99A1C' },
  goldD:  { i: 7, top: '#F2C445', bot: '#A86E0E' },
  eyeG:   { i: 8, top: '#A8FF4E', bot: '#46F02A', glow: true },
  pupil:  { i: 9, top: '#1A1416', bot: '#0C0A0B' },
  rune:   { i: 10, top: '#9CFF6A', bot: '#2EE85A', glow: true },
  spot:   { i: 11, top: '#B4FF5C', bot: '#3EEA6A', glow: true },
  moss:   { i: 12, top: '#9BD448', bot: '#5E9A2A' },
  mossD:  { i: 19, top: '#5E9A2A', bot: '#2F5E16' },
  root:   { i: 13, top: '#7A5A3A', bot: '#4A3220' },
  bone:   { i: 14, top: '#FFF6DE', bot: '#D8C9A0' },
  cord:   { i: 15, top: '#6B4A2E', bot: '#3E2A18' },
  brow:   { i: 16, top: '#5A3E80', bot: '#2C1D42' },
  white:  { i: 17, top: '#FFFFFF', bot: '#F1F1F4' },
  claw:   { i: 18, top: '#FFE07A', bot: '#C8890F' },
};
const P = PALETTE;

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const flat = (g, sw) => paint(g, sw, 'flat');
  const body = (g, lo, hi) => paint(g, P.body, 'y', [lo, hi]);
  // flat faceted feather blade: base b, direction d, outward normal n, half-width w, length l
  const fplate = (b, d, n, w, l, th = 0.014, sw = P.feath, mode = 'flat') => {
    d = d.clone().normalize(); n = n.clone().normalize();
    const sd = new THREE.Vector3().crossVectors(d, n).normalize();
    n = new THREE.Vector3().crossVectors(sd, d).normalize();
    const pts = [];
    const at = (u, v, h) => b.clone().addScaledVector(d, u).addScaledVector(sd, v).addScaledVector(n, h);
    for (const h of [-th, th * 0.3]) pts.push(at(0, w * 0.8, h), at(0, -w * 0.8, h), at(l * 0.3, w, h * 0.8), at(l * 0.3, -w, h * 0.8));
    pts.push(at(l, 0, -th * 0.3), at(l * 0.3, 0, th * 1.1), at(0, 0, th * 1.0));
    return paint(hull(pts), sw, mode);
  };
  // small flat decal plate lying on a surface: centre c, normal n, 2D outline pts, thickness
  const decal = (c, n, pts2d, th, sw, up = V(0, 1, 0)) => {
    n = n.clone().normalize();
    const u = new THREE.Vector3().crossVectors(up, n).normalize();
    const v = new THREE.Vector3().crossVectors(n, u).normalize();
    const out = [];
    for (const [a, b] of pts2d) for (const h of [-th, th]) out.push(c.clone().addScaledVector(u, a).addScaledVector(v, b).addScaledVector(n, h));
    return paint(hull(out), sw, 'flat');
  };

  // ================= BODY (round egg, chest puffed) =================
  C.push(body(hull([
    ...ring(V(0, 0.36, -0.26), 0.09, 0.08, 10, 'z'),
    ...ring(V(0, 0.36, -0.16), 0.17, 0.15, 10, 'z'),
    ...ring(V(0, 0.38, -0.03), 0.2, 0.17, 10, 'z'),
    ...ring(V(0, 0.42, 0.08), 0.195, 0.18, 10, 'z'),
    ...ring(V(0, 0.48, 0.16), 0.16, 0.16, 10, 'z'),
    ...ring(V(0, 0.54, 0.2), 0.1, 0.1, 10, 'z'),
  ]), 0.2, 0.66));
  C.push(body(hull([...ring(V(0, 0.5, 0.06), 0.15, 0.14, 8, 'y'), ...ring(V(0, 0.68, 0.09), 0.135, 0.13, 8, 'y')]), 0.4, 0.85));
  // lighter purple chest feather rows
  for (const [y, z, w, l] of [[0.6, 0.235, 0.075, 0.12], [0.48, 0.24, 0.08, 0.095]]) {
    C.push(fplate(V(0, y, z), V(0, -1, 0.3), V(0, 0.25, 1), w, l, 0.012, P.belly));
    S.push(fplate(V(0.1, y - 0.025, z - 0.04), V(0.15, -1, 0.25), V(0.6, 0.25, 1), w, l, 0.012, P.belly));
  }
  // back feather plates
  C.push(fplate(V(0, 0.6, 0.0), V(0, -0.35, -1), V(0, 1, -0.3), 0.08, 0.17, 0.012, P.featD));
  C.push(fplate(V(0, 0.54, -0.12), V(0, -0.45, -1), V(0, 1, -0.4), 0.075, 0.16, 0.012, P.feath));

  // ================= HEAD =================
  const H = { y: 0.8, z: 0.11 };
  C.push(paint(hull([
    ...cbox(V(0, H.y, H.z), 0.165, 0.14, 0.145, 0.075),
    ...ring(V(0, H.y + 0.15, H.z - 0.01), 0.09, 0.08, 8, 'y'),
    V(0.16, H.y - 0.08, H.z + 0.02), V(-0.16, H.y - 0.08, H.z + 0.02),
  ]), P.body, 'y', [0.62, 1.0]));
  const FZ = H.z + 0.145;
  // cheek / nape plates
  S.push(fplate(V(0.155, H.y - 0.05, H.z + 0.05), V(0.5, -0.8, -0.5), V(1, 0, 0.3), 0.05, 0.1, 0.012));
  S.push(fplate(V(0.15, H.y - 0.01, H.z - 0.05), V(0.4, -0.5, -1), V(1, 0.2, -0.2), 0.055, 0.11, 0.012));
  S.push(fplate(V(0.12, H.y - 0.1, H.z - 0.07), V(0.4, -1, -0.5), V(1, 0, -0.3), 0.055, 0.11, 0.012, P.featD));
  C.push(fplate(V(0, H.y - 0.02, H.z - 0.14), V(0, -0.6, -1), V(0, 0.3, -1), 0.07, 0.12, 0.012, P.featD));

  // nape shards breaking up the back of the head
  for (const [x, y, l] of [[0.06, 0.06, 0.1], [0.1, -0.03, 0.09]]) S.push(paint(shard(V(x, H.y + y, H.z - 0.13), V(x * 3, -0.5, -1), 0.045, l, 4, 0.5), P.featD, 'flat'));
  C.push(paint(shard(V(0, H.y + 0.08, H.z - 0.13), V(0, -0.3, -1), 0.05, 0.11, 4, 0.5), P.feath, 'flat'));
  // beak: big, thick raven beak with hooked tip
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.035, FZ + 0.005), 0.075, 0.055, 0.02, 0.015),
    V(0.038, H.y - 0.0, FZ + 0.09), V(-0.038, H.y - 0.0, FZ + 0.09),
    V(0, H.y + 0.005, FZ + 0.12),
    V(0, H.y - 0.07, FZ + 0.215), V(0.012, H.y - 0.045, FZ + 0.2), V(-0.012, H.y - 0.045, FZ + 0.2),
    V(0.035, H.y - 0.07, FZ + 0.09), V(-0.035, H.y - 0.07, FZ + 0.09),
  ]), P.beak, 'y', [H.y - 0.09, H.y + 0.02]));
  C.push(paint(hull([...cbox(V(0, H.y - 0.088, FZ + 0.025), 0.05, 0.016, 0.022, 0.007),
    V(0, H.y - 0.09, FZ + 0.15), V(0.012, H.y - 0.082, FZ + 0.14), V(-0.012, H.y - 0.082, FZ + 0.14)]), P.beak, 'flat'));

  // eyes: glowing green almond, dark pupil, catchlight, heavy brow
  const E = V(0.086, H.y + 0.04, 0), ek = 1.2;
  const K = (a) => a.map(([u, v]) => [u * ek, v * ek]);
  S.push(flat(hull(plate(K([[-0.036, 0.004], [0.04, 0.03], [0.045, -0.01], [0.018, -0.036], [-0.026, -0.032], [-0.04, -0.014]]),
    E, FZ - 0.01, FZ + 0.01)), P.eyeG));
  S.push(flat(hull(plate(K([[-0.02, 0.004], [0.01, 0.014], [0.015, -0.007], [0.004, -0.022], [-0.014, -0.02], [-0.023, -0.009]]),
    V(E.x - 0.008, E.y - 0.002, 0), FZ + 0.005, FZ + 0.016)), P.pupil));
  S.push(flat(hull(plate(K([[-0.006, -0.006], [0.006, -0.006], [0.006, 0.006], [-0.006, 0.006]]),
    V(E.x - 0.001, E.y + 0.002, 0), FZ + 0.012, FZ + 0.019)), P.white));
  S.push(paint(hull([
    V(0.02, E.y + 0.01, FZ + 0.03), V(0.022, E.y + 0.05, FZ + 0.02),
    V(0.138, E.y + 0.045, FZ - 0.02), V(0.135, E.y + 0.08, FZ - 0.035),
    V(0.02, E.y + 0.01, FZ - 0.03), V(0.022, E.y + 0.06, FZ - 0.04),
    V(0.13, E.y + 0.045, FZ - 0.08), V(0.125, E.y + 0.08, FZ - 0.09),
  ]), P.body, 'y', [0.62, 1.0]));

  // feathered crest: shards fanning up and back
  for (const [z, dz, len, w] of [[0.08, 0.3, 0.13, 0.045], [0.02, -0.25, 0.19, 0.05], [-0.05, -0.8, 0.21, 0.05], [-0.11, -1.4, 0.17, 0.045]])
    C.push(paint(shard(V(0, H.y + 0.12, H.z + z), V(0, 1, dz), w * 1.3, len * 1.05, 4, 0.55), P.feath, 'y', [H.y + 0.12, H.y + 0.34]));
  for (const [z, dz, len] of [[0.02, -0.1, 0.14], [-0.07, -0.9, 0.15]])
    S.push(paint(shard(V(0.05, H.y + 0.11, H.z + z), V(0.4, 1, dz), 0.055, len, 4, 0.55), P.featD, 'y', [H.y + 0.1, H.y + 0.3]));
  // gold crown ringing the crest base, with points and a glowing rune gem at the front
  C.push(paint(hull([...ring(V(0, H.y + 0.13, H.z - 0.01), 0.125, 0.115, 10, 'y'), ...ring(V(0, H.y + 0.165, H.z - 0.01), 0.117, 0.107, 10, 'y')]), P.gold, 'y', [H.y + 0.12, H.y + 0.17]));
  C.push(paint(hull([...ring(V(0, H.y + 0.16, H.z - 0.01), 0.108, 0.098, 10, 'y'), ...ring(V(0, H.y + 0.19, H.z - 0.015), 0.07, 0.062, 8, 'y')]), P.feath, 'flat'));
  C.push(paint(hull([V(0, H.y + 0.27, H.z + 0.11), V(0.035, H.y + 0.15, H.z + 0.12), V(-0.035, H.y + 0.15, H.z + 0.12),
    V(0, H.y + 0.13, H.z + 0.125), V(0, H.y + 0.18, H.z + 0.08), V(0.03, H.y + 0.15, H.z + 0.09), V(-0.03, H.y + 0.15, H.z + 0.09)]), P.gold, 'flat'));
  C.push(paint(hull([V(0, H.y + 0.23, H.z + 0.123), V(0.017, H.y + 0.19, H.z + 0.131), V(-0.017, H.y + 0.19, H.z + 0.131),
    V(0, H.y + 0.155, H.z + 0.134), V(0, H.y + 0.19, H.z + 0.11)]), P.rune, 'flat'));
  for (const [ang, h] of [[0.75, 0.07], [1.45, 0.075], [2.2, 0.065]]) {
    const x = Math.sin(ang) * 0.11, z = Math.cos(ang) * 0.1 + H.z - 0.01;
    S.push(paint(hull([V(x, H.y + 0.17 + h, z), ...ring(V(x, H.y + 0.165, z), 0.02, 0.02, 4, 'y', 0.0)]), P.gold, 'flat'));
  }
  // ================= NECK GORGET + BONE CHARM =================
  C.push(paint(hull([...ring(V(0, 0.655, 0.11), 0.158, 0.145, 10, 'y'), ...ring(V(0, 0.62, 0.125), 0.168, 0.152, 10, 'y')]), P.gold, 'y', [0.6, 0.67]));
  // gorget points hanging over the chest
  for (const [x, z, l] of [[0.12, 0.215, 0.06], [0.155, 0.16, 0.05]]) (x ? S : C).push(paint(hull([
    V(x - 0.03, 0.635, z - 0.02), V(x + 0.03, 0.635, z - 0.02), V(x - 0.03, 0.635, z + 0.004), V(x + 0.03, 0.635, z + 0.004),
    V(x, 0.635 - l, z + 0.012), V(x, 0.635 - l, z - 0.004)]), P.goldD, 'flat'));
  S.push(decal(V(0.105, 0.638, 0.236), V(0.5, 0.2, 1), [[0, 0.016], [0.009, 0], [0, -0.016], [-0.009, 0]], 0.004, P.rune));
  // cord hanging down to the charm (V shape on the chest)
  S.push(paint(tube(curveSamples([V(0.06, 0.63, 0.255), V(0.036, 0.57, 0.268), V(0.012, 0.515, 0.27)], 4, () => 0.009),
    { seg: 5 }), P.cord, 'flat'));
  // chest feather plate the charm rests on
  C.push(fplate(V(0, 0.5, 0.258), V(0, -1, 0.02), V(0, 0, 1), 0.07, 0.15, 0.012, P.belly));
  // bone charm: shaft with knobbed ends, hanging vertically
  const BZ = 0.272, BY = 0.45;
  C.push(paint(hull(cbox(V(0, BY, BZ), 0.018, 0.05, 0.016, 0.006)), P.bone, 'y', [BY - 0.07, BY + 0.07]));
  for (const dy of [-0.055, 0.055]) S.push(paint(blob(0, V(0.019, BY + dy, BZ), V(0.024, 0.024, 0.022)), P.bone, 'y', [BY - 0.08, BY + 0.08]));
  C.push(paint(hull(ring(V(0, 0.52, 0.272), 0.022, 0.018, 6, 'y').concat(ring(V(0, 0.5, 0.274), 0.016, 0.014, 6, 'y'))), P.cord, 'flat'));

  // ================= ORNATE GOLD CHEST ARMOUR (breastplate over the lower chest) =================
  // shield-shaped plate on the belly: rim + raised centre + glowing rune
  const shield = (z, k) => [[0, 0.37 + 0.0 * k], [0.12 * k, 0.375], [0.13 * k, 0.33], [0.07 * k, 0.26], [0, 0.235 + 0.02 * (1 - k)],
    [-0.07 * k, 0.26], [-0.13 * k, 0.33], [-0.12 * k, 0.375]].map(([x, y]) => V(x, y, z - Math.abs(x) * 0.35));
  C.push(paint(hull([...shield(0.228, 1), ...shield(0.268, 1)]), P.goldD, 'y', [0.23, 0.38]));
  C.push(paint(hull([...shield(0.262, 0.72).map((p) => p.setY(p.y + 0.012)), ...shield(0.286, 0.72).map((p) => p.setY(p.y + 0.012))]), P.gold, 'y', [0.24, 0.38]));
  C.push(decal(V(0, 0.32, 0.29), V(0, 0, 1), [[0, 0.04], [0.022, 0.0], [0, -0.04], [-0.022, 0]], 0.004, P.rune));
  S.push(decal(V(0.06, 0.335, 0.27), V(0.3, 0, 1), [[0, 0.018], [0.008, 0], [0, -0.018], [-0.008, 0]], 0.004, P.rune));
  S.push(paint(shard(V(0.125, 0.37, 0.225), V(0.6, 0.6, 0.2), 0.022, 0.06), P.gold, 'flat'));

  // ================= WINGS (half-spread, angled out-back; feathers hang from a gold-trimmed arm) =================
  const WA = [V(0.19, 0.55, 0.03), V(0.32, 0.7, -0.06), V(0.43, 0.76, -0.2)];
  const WN = V(1, 0, 0.75).normalize();
  const wpt = (t) => (t < 0.5 ? WA[0].clone().lerp(WA[1], t * 2) : WA[1].clone().lerp(WA[2], (t - 0.5) * 2));
  // wing arm (thick feathered bone)
  S.push(paint(tube(curveSamples(WA, 5, (t) => 0.05 - 0.02 * t, (t) => 0.06 - 0.025 * t), { seg: 6, capEnd: 0.03 }), P.feath, 'len'));
  // gold leading-edge trim
  S.push(paint(tube(curveSamples([WA[0].clone().add(V(0.02, 0.045, 0.01)), WA[1].clone().add(V(0, 0.05, 0.0)), WA[2].clone().add(V(0.0, 0.035, -0.0))], 5,
    (t) => 0.026 - 0.008 * t, (t) => 0.02 - 0.006 * t), { seg: 6, capEnd: 0.03 }), P.gold, 'len'));
  S.push(paint(shard(WA[2].clone().add(V(0, 0.03, -0.02)), V(0.3, 0.1, -1), 0.02, 0.08), P.gold, 'flat'));
  // primaries (long), secondaries, then covert row on top
  for (const [t, l, w, sw] of [[1.0, 0.42, 0.06, P.featD], [0.88, 0.44, 0.065, P.featD], [0.74, 0.42, 0.065, P.featD], [0.6, 0.38, 0.065, P.featD],
    [0.45, 0.34, 0.065, P.featD], [0.3, 0.29, 0.065, P.featD], [0.15, 0.25, 0.06, P.featD]]) {
    const b = wpt(t).addScaledVector(WN, -0.012);
    S.push(fplate(b, V(0.06 + 0.12 * t, -1, -0.25 - 0.75 * t), WN, w, l, 0.013, sw));
  }
  for (const [t, l, w] of [[0.95, 0.2, 0.06], [0.78, 0.21, 0.065], [0.6, 0.2, 0.065], [0.42, 0.18, 0.065], [0.24, 0.16, 0.06]]) {
    const b = wpt(t).addScaledVector(WN, 0.02).add(V(0, -0.01, 0));
    S.push(fplate(b, V(0.06 + 0.1 * t, -1, -0.2 - 0.6 * t), WN, w, l, 0.013, P.feath));
  }
  // glowing rune marks along the long feathers
  for (const [t, dl] of [[0.88, 0.32], [0.6, 0.28], [0.3, 0.2]]) {
    const d = V(0.06 + 0.12 * t, -1, -0.25 - 0.75 * t).normalize();
    S.push(decal(wpt(t).addScaledVector(d, dl).addScaledVector(WN, 0.006), WN, [[0, 0.028], [0.011, 0], [0, -0.028], [-0.011, 0]], 0.004, P.rune, d.clone().negate()));
  }
  S.push(paint(hull([...ring(V(0.17, 0.5, 0.0), 0.04, 0.09, 8, 'x'), ...ring(V(0.19, 0.46, -0.1), 0.035, 0.08, 8, 'x')]), P.feath, 'y', [0.38, 0.6]));
  // gold pauldron on the wing shoulder with a glowing rune
  S.push(paint(hull([
    ...ring(V(0.215, 0.56, 0.09), 0.06, 0.07, 8, 'x'),
    ...ring(V(0.25, 0.53, 0.08), 0.07, 0.085, 8, 'x'),
    V(0.24, 0.47, 0.03), V(0.2, 0.62, 0.06),
  ]), P.gold, 'y', [0.46, 0.63]));
  S.push(paint(shard(V(0.235, 0.6, 0.07), V(0.4, 1, -0.3), 0.025, 0.08), P.goldD, 'flat'));
  S.push(decal(V(0.258, 0.53, 0.08), V(1, 0.1, 0.05), [[0, 0.03], [0.012, 0], [0, -0.03], [-0.012, 0]], 0.006, P.rune));
  // glowing swamp spots on the body and head
  for (const [c, n] of [[V(0.15, 0.3, 0.12), V(0.8, -0.2, 0.6)], [V(0.12, 0.88, 0.05), V(1, 0.3, 0)], [V(0.16, 0.36, -0.16), V(0.6, 0, -0.6)]])
    S.push(decal(c.clone().addScaledVector(n.clone().normalize(), 0.0), n, [[-0.014, 0], [0, 0.02], [0.014, 0], [0, -0.02]], 0.006, P.spot));
  // moss clumps draped over shoulders / back, with hanging strands
  const moss = (arr, c, sc, tufts) => {
    arr.push(paint(blob(1, c, sc, { jitter: 0.25 }), P.mossD, 'y', [c.y - sc.y, c.y + sc.y]));
    arr.push(paint(blob(0, c.clone().add(V(sc.x * 0.25, sc.y * 0.45, sc.z * 0.15)), sc.clone().multiplyScalar(0.7), { jitter: 0.3 }), P.moss, 'y', [c.y, c.y + sc.y * 1.3]));
    for (const [dx, dz, l] of tufts) arr.push(paint(shard(V(c.x + dx, c.y + sc.y * 0.4, c.z + dz), V(dx * 3, 1, dz * 3), 0.016, l, 3), P.moss, 'flat'));
  };
  moss(S, V(0.14, 0.615, -0.03), V(0.065, 0.032, 0.06), [[0.03, -0.03, 0.035], [-0.02, 0.025, 0.03]]);
  moss(C, V(0, 0.572, -0.155), V(0.07, 0.03, 0.06), [[0, -0.04, 0.035]]);

  // ================= LEGS (short, thick) with gold greaves and bog roots =================
  const legX = 0.1;
  S.push(paint(blob(1, V(legX, 0.25, -0.01), V(0.09, 0.09, 0.1), { jitter: 0.15 }), P.feath, 'y', [0.15, 0.36]));
  S.push(fplate(V(legX + 0.06, 0.27, 0.04), V(0.3, -1, 0.2), V(1, 0, 0.6), 0.045, 0.1, 0.011, P.featD));
  S.push(fplate(V(legX + 0.06, 0.27, -0.06), V(0.3, -1, -0.3), V(1, 0, -0.5), 0.045, 0.1, 0.011, P.featD));
  S.push(paint(hull([...ring(V(legX, 0.2, -0.005), 0.054, 0.054, 6), ...ring(V(legX + 0.003, 0.12, 0.005), 0.052, 0.052, 6),
    ...ring(V(legX + 0.005, 0.04, 0.02), 0.047, 0.047, 6)]), P.leg, 'y', [0, 0.22]));
  // gold greave cuff
  S.push(paint(hull([...ring(V(legX + 0.003, 0.17, 0.0), 0.066, 0.066, 8), ...ring(V(legX + 0.004, 0.11, 0.008), 0.064, 0.064, 8)]), P.gold, 'y', [0.1, 0.18]));
  S.push(decal(V(legX + 0.005, 0.14, 0.072), V(0, 0, 1), [[0, 0.022], [0.01, 0], [0, -0.022], [-0.01, 0]], 0.005, P.rune));
  // bog root wrapping the shin
  S.push(paint(tube(curveSamples([V(legX + 0.06, 0.04, -0.04), V(legX + 0.06, 0.08, 0.03), V(legX, 0.095, 0.065), V(legX - 0.055, 0.075, 0.03)], 6, (t) => 0.014 - 0.006 * t),
    { seg: 5, capEnd: 0.01 }), P.root, 'len'));
  const foot = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.032, z), 0.052, 0.032, 0.05, 0.014)), P.leg, 'y', [0, 0.07]));
    for (const [dx, dz] of [[-0.06, 0.085], [0, 0.11], [0.06, 0.085]]) {
      S.push(paint(hull([...cbox(V(x + dx * 0.45, 0.026, z + dz * 0.45), 0.023, 0.026, 0.022, 0.008),
        ...cbox(V(x + dx, 0.022, z + dz), 0.021, 0.022, 0.016, 0.007)]), P.leg, 'y', [0, 0.07]));
      S.push(paint(shard(V(x + dx * 1.08, 0.02, z + dz + 0.012), V(dx, -0.45, 0.8), 0.016, 0.042), P.claw, 'flat'));
    }
    S.push(paint(hull([...cbox(V(x, 0.022, z - 0.055), 0.018, 0.022, 0.03, 0.006)]), P.leg, 'y', [0, 0.07]));
    S.push(paint(shard(V(x, 0.016, z - 0.085), V(0, -0.4, -1), 0.014, 0.035), P.claw, 'flat'));
  };
  foot(legX + 0.005, 0.03);

  // ================= TAIL (fan of long dark blades) =================
  const blade = (pts, w, thick, sw) => paint(tube(curveSamples(pts, 7,
    (t) => thick * (1 - 0.5 * t), (t) => w * Math.sin(Math.PI * (0.2 + 0.75 * t)) + 0.01),
    { seg: 4, axis: X }), sw, 'len');
  C.push(blade([V(0, 0.42, -0.2), V(0, 0.36, -0.36), V(0, 0.3, -0.5)], 0.075, 0.03, P.featD));
  S.push(blade([V(0.04, 0.43, -0.2), V(0.09, 0.38, -0.34), V(0.13, 0.33, -0.46)], 0.07, 0.03, P.feath));
  S.push(blade([V(0.06, 0.44, -0.18), V(0.15, 0.41, -0.28), V(0.21, 0.37, -0.38)], 0.06, 0.028, P.featD));
  // glowing spots on the tail
  C.push(decal(V(0, 0.36, -0.44), V(0, 1, -0.4), [[-0.02, 0], [0, 0.025], [0.02, 0], [0, -0.025]], 0.006, P.spot, V(0, 0, -1)));

  return assemble(C, S);
}

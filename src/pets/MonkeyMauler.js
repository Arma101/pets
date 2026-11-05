// Monkey Mauler: chunky faceted brown monkey, knuckle-walking stance on taped fists,
// tan heart-shaped face and chest, curled tail, vine wraps with leaves and a carved jade belt plaque.
import { V, THREE, hull, cbox, ring, plate, shard, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  fur:    { i: 0, top: '#9A5E34', bot: '#5E3419' },
  face:   { i: 1, top: '#F3CFA0', bot: '#D7A36E' },
  tape:   { i: 2, top: '#FFFBF0', bot: '#E9DDC6' },
  nose:   { i: 3, top: '#4A2C1C', bot: '#24140C' },
  eye:    { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  tape2:  { i: 6, top: '#EDE0C6', bot: '#D6C4A2' },
  tail:   { i: 7, top: '#8E5530', bot: '#5A3117' },
  brow:   { i: 8, top: '#6E3F1E', bot: '#47260F' },
  vine:   { i: 9, top: '#5FB236', bot: '#2F6E1C' },
  mouth:  { i: 10, top: '#5A2E1A', bot: '#3E1E10' },
  leaf:   { i: 11, top: '#9BE04E', bot: '#47A52C' },
  jade:   { i: 12, top: '#6FF0B8', bot: '#22A673' },
  jadeDk: { i: 13, top: '#1E8C5E', bot: '#0F5E3D' },
  skin:   { i: 14, top: '#E2B07C', bot: '#B9824F' },
};
const SW = PALETTE;

// loft a convex hull between consecutive rings (chunky limb segment)
const seg = (a, ra, b, rb, n = 8) => hull([...ring(a, ra, ra * 0.95, n), ...ring(b, rb, rb * 0.95, n)]);

// flat diamond leaf with a centre crease: base, direction, half-width, length, face normal hint
function leaf(base, dir, w, len, nrm = V(0, 1, 0)) {
  const d = dir.clone().normalize();
  const side = new THREE.Vector3().crossVectors(d, nrm).normalize();
  const n = new THREE.Vector3().crossVectors(side, d).normalize();
  const mid = base.clone().addScaledVector(d, len * 0.42);
  return hull([
    base.clone().addScaledVector(n, 0.004), base.clone().addScaledVector(n, -0.004),
    base.clone().addScaledVector(d, len),
    mid.clone().addScaledVector(side, w).addScaledVector(n, -0.004), mid.clone().addScaledVector(side, -w).addScaledVector(n, -0.004),
    mid.clone().addScaledVector(n, 0.012),
  ]);
}

export function buildGeometry() {
  const C = [], S = [];
  const fur = (g, lo = 0.0, hi = 0.95) => paint(g, SW.fur, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= TORSO (stocky, leaning forward) =================
  const torsoRings = [
    [V(0, 0.27, -0.13), 0.14, 0.12],
    [V(0, 0.36, -0.08), 0.175, 0.15],
    [V(0, 0.48, -0.01), 0.19, 0.16],
    [V(0, 0.58, 0.05), 0.18, 0.14],
    [V(0, 0.66, 0.08), 0.13, 0.1],
  ];
  C.push(fur(hull(torsoRings.flatMap(([c, a, b]) => ring(c, a, b, 10, 'y'))), 0.2, 0.7));
  // tan chest plate (same rings, pushed forward + narrowed so only the front shows)
  C.push(paint(hull(torsoRings.slice(1, 4).map(([c, a, b], k) => ring(V(0, c.y + (k === 0 ? 0.03 : 0), c.z + 0.035), a * [0.42, 0.62, 0.74][k], b * 0.92, 10, 'y')).flat()),
    SW.face, 'y', [0.35, 0.62]));

  // ================= LEGS (short, thick, bowed) =================
  S.push(fur(seg(V(0.115, 0.3, -0.12), 0.108, V(0.16, 0.18, -0.07), 0.098)));
  S.push(fur(seg(V(0.16, 0.19, -0.07), 0.092, V(0.165, 0.07, -0.1), 0.077)));
  // feet: skin sole block + 3 front toes + inner thumb-toe
  S.push(paint(hull(cbox(V(0.165, 0.035, -0.07), 0.076, 0.035, 0.092, 0.02)), SW.skin, 'y', [0, 0.08]));
  for (const dx of [-0.04, 0, 0.04])
    S.push(paint(hull(cbox(V(0.17 + dx * 1.1, 0.026, 0.033), 0.023, 0.026, 0.028, 0.01)), SW.skin, 'y', [0, 0.08]));
  S.push(paint(hull(cbox(V(0.088, 0.024, -0.02), 0.025, 0.024, 0.03, 0.01)), SW.skin, 'y', [0, 0.08]));

  // ================= ARMS (long, knuckles planted) =================
  const SH = V(0.19, 0.6, 0.08), EL = V(0.275, 0.36, 0.15), WR = V(0.27, 0.16, 0.22), FA = 0.077;
  S.push(fur(hull([...cbox(SH, 0.098, 0.086, 0.092, 0.038), ...ring(V(0.24, 0.47, 0.11), 0.098, 0.092, 8)]), 0.3, 0.75)); // shoulder
  S.push(fur(seg(V(0.235, 0.5, 0.11), 0.088, EL, 0.076)));
  S.push(fur(seg(EL, FA, WR, FA), 0.1, 0.5));
  // wrist wrap (tape) and fist
  const F = V(0.27, 0.075, 0.245);
  S.push(flat(hull([...ring(V(WR.x, WR.y + 0.01, WR.z), FA + 0.01, FA * 0.95 + 0.01, 8), ...ring(V(F.x, F.y + 0.05, F.z - 0.005), FA + 0.01, FA * 0.95 + 0.01, 8)]), SW.tape2));
  S.push(paint(hull(cbox(F, 0.082, 0.075, 0.086, 0.027)), SW.tape, 'y', [0, 0.14]));
  // tape bands across the fist
  S.push(flat(hull(cbox(V(F.x, F.y + 0.024, F.z), 0.087, 0.015, 0.091, 0.013)), SW.tape2));
  // knuckle bumps (front)
  for (const dx of [-0.051, -0.017, 0.017, 0.051])
    S.push(paint(hull(cbox(V(F.x + dx, F.y + 0.035, F.z + 0.078), 0.014, 0.022, 0.016, 0.007)), SW.tape, 'y', [0, 0.14]));
  // thumb (inner side)
  S.push(paint(hull(cbox(V(F.x - 0.08, F.y + 0.02, F.z + 0.035), 0.02, 0.027, 0.038, 0.008)), SW.tape, 'y', [0, 0.14]));

  // vine wraps: three octagonal rings parallel to the forearm faces, linked by short straight runs
  {
    const d = (WR.y - EL.y);
    const at = (y) => EL.clone().lerp(WR, (y - EL.y) / d);                // forearm centre at height y
    const VR = 0.013, GAP = 0.006;
    const off = (VR + GAP) / Math.cos(Math.PI / 8);                         // clear the octagon flats
    const vtx = (y, k) => { const c = at(y), a = Math.PI / 8 + k * Math.PI / 4;
      return V(c.x + Math.cos(a) * (FA + off), y, c.z + Math.sin(a) * (FA * 0.95 + off)); };
    const loop = (y) => {
      const smp = [];
      const m0 = vtx(y, 4).lerp(vtx(y, 5), 0.5);                            // start mid-edge on the inner side
      smp.push({ p: m0, rx: VR, ry: VR });
      for (let k = 5; k <= 12; k++) smp.push({ p: vtx(y, k), rx: VR, ry: VR });
      smp.push({ p: vtx(y, 12).lerp(vtx(y, 13), 0.5), rx: VR, ry: VR });
      return paint(tube(smp, { seg: 6 }), SW.vine, 'flat');
    };
    const ys = [0.335, 0.268, 0.2];
    for (const y of ys) S.push(loop(y));
    // straight links along the outer-front and outer-back edges
    const link = (p, q) => paint(tube([{ p, rx: VR, ry: VR }, { p: q, rx: VR, ry: VR }], { seg: 6 }), SW.vine, 'flat');
    S.push(link(vtx(ys[0], 0), vtx(ys[1], 1)));
    S.push(link(vtx(ys[1], 7), vtx(ys[2], 0)));
    // leaves sprouting from the top ring + one off the bottom ring, jade bead on the front
    S.push(flat(leaf(vtx(ys[0], 0), V(0.8, 0.45, 0.35), 0.034, 0.1, V(0, 0.4, 1)), SW.leaf));
    S.push(flat(leaf(vtx(ys[0], 7), V(0.6, 0.5, -0.6), 0.03, 0.09, V(1, 0.3, 0)), SW.leaf));
    S.push(flat(leaf(vtx(ys[2], 0), V(0.9, -0.1, 0.4), 0.028, 0.085, V(0, 1, 0)), SW.leaf));
    const bp = vtx(ys[1], 2), bc = at(ys[1]);
    const bo = bp.clone().sub(bc).setY(0).normalize();
    S.push(paint(hull(cbox(bp.clone().addScaledVector(bo, 0.008), 0.019, 0.019, 0.019, 0.007)), SW.jade, 'flat'));
  }

  // ================= VINE BELT + CARVED JADE PLAQUE =================
  {
    const pts = [];
    const bc = V(0, 0.35, -0.085), rx = 0.182, rz = 0.158;
    for (let k = 0; k <= 16; k++) {
      const a = (k / 16) * Math.PI * 2 + Math.PI / 2;
      pts.push(V(Math.cos(a) * rx, bc.y + 0.012 * Math.sin(a * 3), bc.z + Math.sin(a) * rz));
    }
    const s = curveSamples(pts, 32, () => 0.016);
    C.push(paint(tube(s, { seg: 6 }), SW.vine, 'y'));
    // leaves fanning off the hips
    S.push(flat(leaf(V(0.13, 0.345, 0.03), V(0.6, -0.8, 0.5), 0.036, 0.11, V(0.3, 0, 1)), SW.leaf));
    S.push(flat(leaf(V(0.165, 0.35, -0.05), V(0.9, -0.6, -0.2), 0.032, 0.1, V(1, 0, 0)), SW.leaf));
    // plaque
    const PZ = bc.z + rz + 0.012;
    C.push(paint(hull(plate([[0, 0.06], [0.05, 0.03], [0.05, -0.03], [0, -0.06], [-0.05, -0.03], [-0.05, 0.03]],
      V(0, 0.35, 0), PZ - 0.02, PZ + 0.018)), SW.jade, 'y', [0.29, 0.41]));
    C.push(flat(hull(plate([[0, 0.034], [0.026, 0], [0, -0.034], [-0.026, 0]], V(0, 0.35, 0), PZ + 0.012, PZ + 0.024)), SW.jadeDk));
    C.push(paint(hull(plate([[0, 0.016], [0.012, 0], [0, -0.016], [-0.012, 0]], V(0, 0.35, 0), PZ + 0.02, PZ + 0.03)), SW.jade, 'y', [0.33, 0.37]));
  }

  // fur shards: shoulders, back, hips
  S.push(flat(shard(V(0.2, 0.66, 0.03), V(0.5, 0.5, -1), 0.05, 0.08), SW.fur));
  S.push(flat(shard(V(0.26, 0.55, 0.06), V(1, -0.2, -0.4), 0.045, 0.07), SW.fur));
  S.push(flat(shard(V(0.08, 0.6, -0.05), V(0.3, 0.3, -1), 0.05, 0.08), SW.fur));
  S.push(flat(shard(V(0.12, 0.42, -0.17), V(0.5, -0.3, -1), 0.045, 0.07), SW.fur));
  C.push(flat(shard(V(0, 0.52, -0.12), V(0, 0.2, -1), 0.05, 0.08), SW.fur));

  // ================= HEAD =================
  const H = { y: 0.83, z: 0.16 }; const nC0 = C.length, nS0 = S.length; const K = 1.1; // head scale
  C.push(fur(hull([
    ...cbox(V(0, H.y, H.z), 0.165 * K, 0.14 * K, 0.145 * K, 0.06 * K),
    ...ring(V(0, H.y + 0.165 * K, H.z - 0.01), 0.11 * K, 0.1 * K, 8, 'y'),
    V(0.19 * K, H.y - 0.05 * K, H.z + 0.03), V(-0.19 * K, H.y - 0.05 * K, H.z + 0.03),
  ]), 0.6, 0.98));
  const FZ = H.z + 0.145 * K;
  const k2 = (a) => a.map(([u, v]) => [u * K, v * K]);
  // heart-shaped tan face mask (two lobes meeting at the centre, point at chin)
  S.push(paint(hull(plate(k2([[0, 0.05], [0.04, 0.085], [0.095, 0.08], [0.135, 0.035], [0.13, -0.04], [0.08, -0.11], [0, -0.15]]),
    V(0, H.y, 0), FZ - 0.04, FZ + 0.012)), SW.face, 'y', [H.y - 0.15, H.y + 0.1]));
  // muzzle
  C.push(paint(hull([...cbox(V(0, H.y - 0.072, FZ + 0.035), 0.092, 0.058, 0.05, 0.025),
    V(0.06, H.y - 0.02, FZ), V(-0.06, H.y - 0.02, FZ)]), SW.face, 'y', [H.y - 0.13, H.y]));
  // nostrils + mouth
  S.push(flat(hull(cbox(V(0.018, H.y - 0.045, FZ + 0.086), 0.01, 0.007, 0.004, 0.002)), SW.nose));
  S.push(flat(hull([V(0, H.y - 0.09, FZ + 0.08), V(0, H.y - 0.099, FZ + 0.08), V(0, H.y - 0.09, FZ + 0.091), V(0, H.y - 0.099, FZ + 0.091),
    V(0.042, H.y - 0.099, FZ + 0.078), V(0.042, H.y - 0.107, FZ + 0.078), V(0.042, H.y - 0.099, FZ + 0.089), V(0.042, H.y - 0.107, FZ + 0.089)]), SW.mouth));
  // fierce eyes (punch_pup pattern), sitting on the mask
  const MZ = FZ + 0.012;
  const E = V(0.07, H.y + 0.022, 0);
  S.push(flat(hull(plate([[-0.036, 0.002], [0.04, 0.03], [0.046, -0.01], [0.018, -0.036], [-0.026, -0.032], [-0.04, -0.014]],
    E, MZ - 0.01, MZ + 0.006)), SW.white));
  S.push(flat(hull(plate([[-0.026, 0.002], [0.014, 0.017], [0.02, -0.007], [0.005, -0.028], [-0.019, -0.026], [-0.029, -0.011]],
    V(E.x - 0.004, E.y, 0), MZ, MZ + 0.012)), SW.eye));
  S.push(flat(hull(plate([[-0.006, -0.006], [0.006, -0.006], [0.006, 0.006], [-0.006, 0.006]],
    V(E.x + 0.004, E.y + 0.002, 0), MZ + 0.008, MZ + 0.016)), SW.white));
  // heavy brow ridge slanting down toward the nose
  S.push(paint(hull([
    V(0.012, E.y + 0.008, MZ + 0.024), V(0.014, E.y + 0.045, MZ + 0.016),
    V(0.13, E.y + 0.045, MZ - 0.01), V(0.13, E.y + 0.082, MZ - 0.022),
    V(0.012, E.y + 0.008, MZ - 0.03), V(0.014, E.y + 0.055, MZ - 0.04),
    V(0.13, E.y + 0.045, MZ - 0.06), V(0.13, E.y + 0.085, MZ - 0.07),
  ]), SW.brow, 'y'));
  // round ears with tan inner
  const EA = V(0.2, H.y + 0.04, H.z - 0.035), EN = V(1, 0.1, 0.75).normalize();
  const disc = (c, r, n = 8) => {
    const a = new THREE.Vector3().crossVectors(EN, V(0, 1, 0)).normalize(), b = new THREE.Vector3().crossVectors(a, EN).normalize();
    const pts = [];
    for (let k = 0; k < n; k++) { const t = Math.PI / 8 + 2 * Math.PI * k / n; pts.push(c.clone().addScaledVector(a, Math.cos(t) * r).addScaledVector(b, Math.sin(t) * r)); }
    return pts;
  };
  const ep = (d) => EA.clone().addScaledVector(EN, d);
  S.push(fur(hull([...disc(ep(-0.03), 0.07), ...disc(ep(0.012), 0.074), ...disc(ep(0.022), 0.064)]), 0.7, 0.95));
  S.push(paint(hull([...disc(ep(0.018), 0.046), ...disc(ep(0.028), 0.042)]), SW.face, 'flat'));
  // head fur tufts
  C.push(flat(shard(V(0, H.y + 0.165 * K - 0.005, H.z + 0.02), V(0, 1, 0.25), 0.042, 0.085), SW.fur));
  S.push(flat(shard(V(0.05, H.y + 0.165 * K - 0.01, H.z), V(0.4, 1, 0.1), 0.037, 0.072), SW.fur));
  S.push(flat(shard(V(0.17, H.y - 0.07, H.z + 0.04), V(1, -0.5, 0.1), 0.04, 0.065), SW.fur));

  // scale the whole head block ~8% about its centre
  for (const g of [...C.slice(nC0), ...S.slice(nS0)]) {
    g.translate(0, -H.y, -H.z); g.scale(1.08, 1.08, 1.08); g.translate(0, H.y, H.z); g.computeVertexNormals();
  }

  // ================= CURLED TAIL =================
  C.push(paint(tube(curveSamples([
    V(0, 0.3, -0.22), V(0, 0.32, -0.33), V(0, 0.45, -0.42), V(0, 0.62, -0.43),
    V(0, 0.74, -0.37), V(0, 0.75, -0.28), V(0, 0.67, -0.25), V(0, 0.62, -0.31), V(0, 0.66, -0.35),
  ], 20, (t) => 0.036 - 0.016 * t), { seg: 6, axis: V(1, 0, 0), capStart: 0, capEnd: 0.015 }), SW.tail, 'len'));

  return assemble(C, S);
}

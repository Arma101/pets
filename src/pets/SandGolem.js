// Sand Golem (Epic, Round 3 - Desert Dojo): stocky sandstone-block golem with glowing yellow cracks,
// huge block fists, gold armour plates (pauldrons, chest plate, cuffs) set with lapis gems.
import { V, THREE, hull, cbox, ring, plate, shard, paint, assemble } from '../kit.js';

export const PALETTE = {
  sandA:  { i: 0, top: '#F8E2AE', bot: '#E2BC7E' }, // light sandstone
  sandB:  { i: 1, top: '#E6B978', bot: '#C38C4E' }, // mid sandstone
  sandC:  { i: 2, top: '#C98A52', bot: '#93603A' }, // dark sandstone
  gold:   { i: 3, top: '#FFE27A', bot: '#D99A1E' },
  lapis:  { i: 4, top: '#4F7DF0', bot: '#1C2F94' },
  glow:   { i: 5, top: '#FFF27A', bot: '#FFC400', glow: true },
  white:  { i: 6, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:    { i: 7, top: '#1A1416', bot: '#0C0A0B' },
  brow:   { i: 8, top: '#C99558', bot: '#94653A' },
  mouth:  { i: 9, top: '#5A3A20', bot: '#3A2412' },
};
const SW = PALETTE;

export function buildGeometry() {
  const C = [], S = [];
  const sand = (sw, pts, lo, hi) => paint(hull(pts), sw, 'y', [lo, hi]);
  const A = (pts, lo = 0, hi = 1) => sand(SW.sandA, pts, lo, hi);
  const B = (pts, lo = 0, hi = 1) => sand(SW.sandB, pts, lo, hi);
  const Cc = (pts, lo = 0, hi = 1) => sand(SW.sandC, pts, lo, hi);
  const flat = (g, sw) => paint(g, sw, 'flat');
  const gold = (pts, lo, hi) => paint(hull(pts), SW.gold, 'y', [lo, hi]);

  // glowing crack: raised strip along a polyline lying on a surface with outward normal n
  const crack = (pts, n, w = 0.009, raise = 0.008, sink = 0.012) => {
    const out = [];
    n = n.clone().normalize();
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const side = new THREE.Vector3().subVectors(b, a).cross(n).normalize().multiplyScalar(w);
      const ext = new THREE.Vector3().subVectors(b, a).normalize().multiplyScalar(w * 0.6);
      const a2 = a.clone().sub(ext), b2 = b.clone().add(ext);
      const P = [];
      for (const p of [a2, b2]) for (const s of [1, -1]) for (const d of [raise, -sink])
        P.push(p.clone().addScaledVector(side, s).addScaledVector(n, d));
      out.push(paint(hull(P), SW.glow, 'y', [0, 1]));
    }
    return out;
  };
  // crack on a plane z = zf (front), given 2D points (x, y)
  const crackZ = (arr, zf, sgn = 1) => crack(arr.map(([x, y]) => V(x, y, zf)), V(0, 0, sgn));
  const crackX = (arr, xf) => crack(arr.map(([z, y]) => V(xf, y, z)), V(1, 0, 0));
  const crackY = (arr, yf) => crack(arr.map(([x, z]) => V(x, yf, z)), V(0, 1, 0));

  // ================= LEGS (short, thick block columns, planted, slightly apart) =================
  const LX = 0.125;
  S.push(Cc(cbox(V(LX + 0.005, 0.045, 0.03), 0.1, 0.045, 0.125, 0.02), 0, 0.1));       // foot slab
  for (const dx of [-0.05, 0.05])                                                       // two blunt toes
    S.push(B(cbox(V(LX + 0.005 + dx, 0.035, 0.165), 0.045, 0.035, 0.03, 0.012), 0, 0.08));
  S.push(B(cbox(V(LX, 0.16, 0.01), 0.085, 0.075, 0.095, 0.022), 0.05, 0.3));           // shin block
  S.push(Cc(cbox(V(LX - 0.005, 0.29, 0.0), 0.095, 0.065, 0.105, 0.025), 0.2, 0.4));    // thigh block

  // ================= TORSO (stacked sandstone blocks, wider at the shoulders) =================
  C.push(Cc(cbox(V(0, 0.34, -0.02), 0.2, 0.06, 0.165, 0.025), 0.25, 0.42));            // hip block
  C.push(B(cbox(V(0, 0.455, -0.01), 0.215, 0.07, 0.185, 0.03), 0.36, 0.54));           // belly block
  C.push(A([...cbox(V(0, 0.555, 0.0), 0.235, 0.04, 0.2, 0.03),                          // chest block
    ...cbox(V(0, 0.69, -0.01), 0.3, 0.05, 0.205, 0.045)], 0.5, 0.76));
  C.push(B(cbox(V(0, 0.68, -0.09), 0.25, 0.085, 0.15, 0.04), 0.55, 0.78));            // back/shoulder hump

  // ================= HEAD (block sunk into the shoulders) =================
  const H = { y: 0.835, z: 0.1 };
  C.push(A([...cbox(V(0, H.y + 0.01, H.z), 0.18, 0.115, 0.14, 0.035),
    ...cbox(V(0, H.y + 0.135, H.z - 0.01), 0.14, 0.012, 0.115, 0.01)], 0.7, 0.98));
  const FZ = H.z + 0.14;
  // chunky jaw/chin block, as wide as the face, mouth slit on its front
  C.push(B(cbox(V(0, H.y - 0.1, H.z + 0.01), 0.182, 0.05, 0.142, 0.025), 0.68, 0.84));
  C.push(flat(hull(cbox(V(0, H.y - 0.095, FZ + 0.012 + 0.004), 0.06, 0.008, 0.006, 0.002)), SW.mouth));
  S.push(flat(hull([V(0.055, H.y - 0.087, FZ + 0.012), V(0.055, H.y - 0.103, FZ + 0.012), V(0.085, H.y - 0.112, FZ + 0.012),
    V(0.085, H.y - 0.1, FZ + 0.012), V(0.055, H.y - 0.087, FZ + 0.024), V(0.055, H.y - 0.103, FZ + 0.024),
    V(0.085, H.y - 0.112, FZ + 0.02), V(0.085, H.y - 0.1, FZ + 0.02)]), SW.mouth));

  // eyes: white almond, angry flat top sloping to centre, big pupil, catchlight
  const E = V(0.08, H.y + 0.015, 0), k = 1.05;
  const sc = (a) => a.map(([u, v]) => [u * k, v * k]);
  S.push(flat(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.01, FZ + 0.006)), SW.white));
  S.push(flat(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.003, E.y, 0), FZ + 0.001, FZ + 0.011)), SW.eye));
  S.push(flat(hull(plate([[-0.006, -0.006], [0.006, -0.006], [0.006, 0.006], [-0.006, 0.006]],
    V(E.x + 0.005, E.y + 0.002, 0), FZ + 0.008, FZ + 0.015)), SW.white));
  // heavy stone brow slab slanting down to the centre
  S.push(paint(hull([
    V(0.012, E.y + 0.008, FZ + 0.035), V(0.012, E.y + 0.048, FZ + 0.03),
    V(0.19, E.y + 0.05, FZ + 0.005), V(0.19, E.y + 0.09, FZ - 0.005),
    V(0.012, E.y + 0.008, FZ - 0.03), V(0.012, E.y + 0.06, FZ - 0.04),
    V(0.19, E.y + 0.05, FZ - 0.05), V(0.19, E.y + 0.093, FZ - 0.06),
  ]), SW.brow, 'y'));
  // gold circlet with lapis gem on the forehead
  C.push(gold([...cbox(V(0, H.y + 0.115, H.z), 0.186, 0.018, 0.146, 0.008)], H.y + 0.09, H.y + 0.14));
  C.push(gold(plate([[0, 0.05], [0.04, 0.012], [0.03, -0.012], [-0.03, -0.012], [-0.04, 0.012]],
    V(0, H.y + 0.127, 0), FZ - 0.01, FZ + 0.014), H.y + 0.1, H.y + 0.18));
  C.push(flat(hull(plate([[0, 0.022], [0.016, 0], [0, -0.014], [-0.016, 0]], V(0, H.y + 0.135, 0), FZ + 0.005, FZ + 0.024)), SW.lapis));

  // ================= ARMS (massive blocks) + BIG FISTS near the ground =================
  S.push(B(cbox(V(0.32, 0.64, -0.01), 0.1, 0.08, 0.13, 0.03), 0.5, 0.78));         // shoulder block
  S.push(A(cbox(V(0.37, 0.505, 0.0), 0.09, 0.08, 0.095, 0.025), 0.35, 0.62));         // upper arm
  S.push(B([...cbox(V(0.385, 0.375, 0.015), 0.085, 0.04, 0.09, 0.02),                   // forearm, flaring
    ...cbox(V(0.395, 0.29, 0.025), 0.095, 0.03, 0.1, 0.02)], 0.22, 0.5));
  const F = V(0.405, 0.15, 0.035);                                                      // fist
  S.push(A(cbox(F, 0.12, 0.11, 0.125, 0.035), 0.03, 0.27));
  for (const dx of [-0.081, -0.027, 0.027, 0.081]) // four curled finger blocks across the front
    S.push(B(cbox(V(F.x + dx, F.y + 0.035, F.z + 0.125 + 0.01), 0.025, 0.06, 0.02, 0.01), 0.03, 0.27));
  S.push(A(cbox(V(F.x - 0.045, F.y - 0.06, F.z + 0.13), 0.075, 0.028, 0.028, 0.012), 0.03, 0.27)); // thumb across the front
  // gold cuff with lapis gem
  S.push(gold([...ring(V(0.395, 0.255, 0.025), 0.112, 0.118, 8, 'y'), ...ring(V(0.395, 0.3, 0.025), 0.108, 0.114, 8, 'y')], 0.24, 0.31));
  S.push(flat(hull(plate([[0, 0.02], [0.02, 0], [0, -0.02], [-0.02, 0]], V(0.395, 0.278, 0), 0.14, 0.158)), SW.lapis));

  // ================= GOLD ARMOUR =================
  // chunky faceted shoulder cap sitting on the shoulder, slightly overhanging, with a gold rim plate
  const PC = V(0.35, 0.69, -0.01);
  S.push(gold([...ring(V(PC.x, PC.y + 0.02, PC.z), 0.145, 0.16, 8, 'y'), ...ring(V(PC.x + 0.005, PC.y + 0.075, PC.z), 0.13, 0.145, 8, 'y'),
    ...ring(V(PC.x + 0.008, PC.y + 0.12, PC.z), 0.075, 0.088, 8, 'y')], PC.y, PC.y + 0.12));
  S.push(gold([...ring(V(PC.x, PC.y - 0.012, PC.z), 0.165, 0.18, 8, 'y'), ...ring(V(PC.x, PC.y + 0.022, PC.z), 0.165, 0.18, 8, 'y')], PC.y - 0.12, PC.y + 0.03));
  { // lapis gem on the top-front slope of the cap
    const r1 = 0.145 * 0.924, r2 = 0.088 * 0.924, y1 = PC.y + 0.075, y2 = PC.y + 0.12;
    const c = V(PC.x + 0.007, (y1 + y2) / 2, PC.z + (r1 + r2) / 2);
    const n = V(0, r1 - r2, y2 - y1).normalize(), t = V(0, -(y2 - y1), r1 - r2).normalize(), X = V(1, 0, 0);
    const P = [];
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (const d of [-0.006, 0.012])
      P.push(c.clone().addScaledVector(X, a * 0.032).addScaledVector(t, b * 0.028).addScaledVector(n, d));
    P.push(c.clone().addScaledVector(n, 0.018));
    S.push(flat(hull(P), SW.lapis));
  }
  // chest plate (shield shape) with a big lapis gem
  C.push(gold(plate([[-0.1, 0.07], [0.1, 0.07], [0.12, 0.0], [0.07, -0.075], [0, -0.1], [-0.07, -0.075], [-0.12, 0.0]],
    V(0, 0.59, 0), 0.18, 0.218), 0.48, 0.67));
  C.push(flat(hull(plate([[0, 0.04], [0.035, 0.0], [0, -0.045], [-0.035, 0]], V(0, 0.585, 0), 0.21, 0.235)), SW.lapis));
  // belt: gold band on the hip block with a lapis buckle
  C.push(gold(cbox(V(0, 0.36, -0.02), 0.207, 0.024, 0.172, 0.012), 0.33, 0.39));
  C.push(flat(hull(cbox(V(0, 0.36, 0.157), 0.032, 0.03, 0.012, 0.006)), SW.lapis));

  // knee plates: gold with lapis gem
  S.push(gold(plate([[-0.06, 0.04], [0.06, 0.04], [0.07, -0.01], [0, -0.06], [-0.07, -0.01]], V(LX, 0.245, 0), 0.098, 0.125), 0.18, 0.3));
  S.push(flat(hull(plate([[0, 0.02], [0.018, 0], [0, -0.024], [-0.018, 0]], V(LX, 0.24, 0), 0.115, 0.135)), SW.lapis));
  // bold lapis marking bands on the upper arms
  for (const y of [0.545, 0.48])
    S.push(paint(hull(cbox(V(0.37, y, 0.0), 0.097, 0.013, 0.102, 0.02)), SW.lapis, 'flat'));

  // extra packed blocks: offset back slabs and side bricks
  C.push(Cc(cbox(V(0, 0.575, -0.19), 0.15, 0.04, 0.03, 0.015), 0.5, 0.66));
  S.push(A(cbox(V(0.2, 0.47, -0.02), 0.03, 0.045, 0.1, 0.015), 0.4, 0.54));
  S.push(Cc(cbox(V(0.22, 0.6, 0.01), 0.03, 0.05, 0.11, 0.015), 0.52, 0.7));

  // ================= GLOWING CRACKS =================
  // chest, beside the plate
  S.push(...crackZ([[0.13, 0.69], [0.16, 0.63], [0.2, 0.6], [0.215, 0.55]], 0.197));
  // belly
  S.push(...crackZ([[0.04, 0.5], [0.08, 0.46], [0.12, 0.47], [0.17, 0.42]], 0.175));
  // thigh / shin
  S.push(...crackZ([[0.06, 0.33], [0.075, 0.3], [0.06, 0.27]], 0.105));
  S.push(...crackZ([[0.15, 0.21], [0.12, 0.16], [0.105, 0.11]], 0.105));
  // upper arm & forearm outer faces
  S.push(...crackX([[-0.06, 0.46], [-0.02, 0.44], [0.03, 0.45], [0.07, 0.43]], 0.46));
  S.push(...crackX([[0.06, 0.39], [0.01, 0.35], [-0.05, 0.33]], 0.47));
  // fist outer face and top
  S.push(...crackX([[0.1, 0.22], [0.04, 0.16], [0.07, 0.1], [0.0, 0.08]], 0.525));
  S.push(...crackY([[0.34, 0.0], [0.4, 0.06], [0.46, 0.04]], 0.26));
  // shoulder block outer face (below the pauldrons) and head side
  S.push(...crackX([[0.07, 0.6], [0.02, 0.62], [-0.04, 0.58]], 0.42));
  S.push(...crackX([[0.19, 0.86], [0.14, 0.8], [0.08, 0.83]], 0.18));
  // back: big crack across the hump and belly
  S.push(...crackZ([[0.04, 0.72], [0.1, 0.67], [0.17, 0.69], [0.22, 0.64]], -0.24, -1));
  S.push(...crackZ([[0.0, 0.48], [0.07, 0.44], [0.14, 0.47]], -0.195, -1));

  // back of head
  S.push(...crackZ([[0.0, 0.88], [0.06, 0.83], [0.12, 0.85]], H.z - 0.14, -1));
  return assemble(C, S);
}

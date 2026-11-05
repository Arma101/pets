// Title Belt Bear: big upright brown champion bear with a huge gold title belt, gold armour plates and bold markings.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  fur:     { i: 0, top: '#A8673A', bot: '#6A3A1C' },
  tan:     { i: 1, top: '#F2C78E', bot: '#C98F52' },
  dark:    { i: 2, top: '#55301A', bot: '#2E170B' },
  gold:    { i: 3, top: '#FFDA4A', bot: '#D08612' },
  goldHi:  { i: 4, top: '#FFF6C2', bot: '#F5C842' },
  strap:   { i: 5, top: '#C42A33', bot: '#7A1018' },
  gem:     { i: 6, top: '#FF7070', bot: '#F01434', glow: true },
  white:   { i: 7, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:     { i: 8, top: '#1A1416', bot: '#0C0A0B' },
  nose:    { i: 9, top: '#3A2A24', bot: '#140D0A' },
  claw:    { i: 10, top: '#FFF0C8', bot: '#E2BE78' },
  brow:    { i: 11, top: '#7A4422', bot: '#4A2511' },
  mouth:   { i: 12, top: '#4A2414', bot: '#2E140A' },
};
const SW = PALETTE;

export function buildGeometry() {
  const C = [], S = [];
  const fur = (pts, lo = 0.05, hi = 1.0) => paint(hull(pts), SW.fur, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');
  const gold = (g, lo, hi) => paint(g, SW.gold, 'y', [lo, hi]);

  // ================= TORSO (big upright pear-shaped barrel) =================
  C.push(fur([
    ...ring(V(0, 0.17, -0.01), 0.17, 0.15, 10, 'y'),
    ...ring(V(0, 0.22, 0), 0.215, 0.185, 10, 'y'),
    ...ring(V(0, 0.33, 0), 0.25, 0.21, 10, 'y'),
    ...ring(V(0, 0.46, 0.0), 0.255, 0.21, 10, 'y'),
    ...ring(V(0, 0.58, 0.0), 0.225, 0.18, 10, 'y'),
    ...ring(V(0, 0.68, 0.01), 0.15, 0.13, 10, 'y'),
  ], 0.1, 0.8));

  const TR = [[0.17, 0.17, 0.15], [0.22, 0.215, 0.185], [0.33, 0.25, 0.21], [0.46, 0.255, 0.21], [0.58, 0.225, 0.18], [0.68, 0.15, 0.13]];
  const torsoR = (y) => { for (let i = 0; i < TR.length - 1; i++) if (y <= TR[i + 1][0]) { const t = (y - TR[i][0]) / (TR[i + 1][0] - TR[i][0]);
    return [TR[i][1] + t * (TR[i + 1][1] - TR[i][1]), TR[i][2] + t * (TR[i + 1][2] - TR[i][2])]; } return [TR[5][1], TR[5][2]]; };
  const onChest = (x, y, d) => { const [rx, rz] = torsoR(y); return V(x, y, rz * Math.sqrt(Math.max(0, 1 - (x / rx) ** 2)) + d); };
  // chest marking: bold tan V-shaped crescent on the chest above the belt
  const chestPts = [];
  for (const [x, y] of [[0, 0.41], [0.08, 0.47], [0.17, 0.585], [0.12, 0.625], [0, 0.53]])
    for (const sx of [1, -1]) { chestPts.push(onChest(sx * x, y, 0.03 - 0.06 * Math.abs(x))); chestPts.push(onChest(sx * x, y, -0.04)); }
  C.push(paint(hull(chestPts), SW.tan, 'y', [0.4, 0.62]));

  // ================= LEGS (short thick columns, slightly apart) =================
  S.push(fur([...ring(V(0.135, 0.05, 0.02), 0.095, 0.1, 8), ...ring(V(0.14, 0.16, 0.01), 0.115, 0.12, 8),
    ...ring(V(0.125, 0.28, 0.0), 0.12, 0.12, 8)], 0.0, 0.5));
  // big feet with tan pads and gold-cream claws
  S.push(paint(hull(cbox(V(0.14, 0.04, 0.05), 0.095, 0.04, 0.115, 0.025)), SW.fur, 'y', [0, 0.2]));
  for (const dx of [-0.055, 0, 0.055])
    S.push(flat(hull([...cbox(V(0.14 + dx, 0.018, 0.17), 0.016, 0.018, 0.012, 0.006), V(0.14 + dx, 0.0, 0.205)]), SW.claw));

  // ================= BELT (huge gold title belt around the waist) =================
  const BY = 0.31; // belt centre height
  C.push(paint(hull([...ring(V(0, BY - 0.06, 0), 0.268, 0.228, 12, 'y', 0), ...ring(V(0, BY + 0.06, 0), 0.275, 0.232, 12, 'y', 0)]),
    SW.strap, 'y', [BY - 0.06, BY + 0.06]));
  // gold edge trims top and bottom
  for (const y of [BY - 0.06, BY + 0.06])
    C.push(gold(hull([...ring(V(0, y - 0.012, 0), 0.282, 0.24, 12, 'y', 0), ...ring(V(0, y + 0.012, 0), 0.284, 0.242, 12, 'y', 0)]), y - 0.02, y + 0.02));
  // huge centre plate (front)
  const FP = 0.24;
  C.push(gold(hull([...plate([[-0.2, 0.065], [-0.14, 0.125], [-0.06, 0.135], [0, 0.185], [0.06, 0.135], [0.14, 0.125], [0.2, 0.065], [0.2, -0.065], [0.14, -0.125], [0.06, -0.135], [0, -0.165], [-0.06, -0.135], [-0.14, -0.125], [-0.2, -0.065]],
    V(0, BY, 0), 0.12, FP + 0.035), ...plate([[-0.15, 0.05], [0.15, 0.05], [0.15, -0.05], [-0.15, -0.05]], V(0, BY, 0), 0.12, FP + 0.045)]), BY - 0.17, BY + 0.19));
  // corner studs
  for (const [x, y] of [[0.155, 0.085], [0.155, -0.085]]) S.push(paint(hull(cbox(V(x, BY + y, FP + 0.04), 0.018, 0.018, 0.012, 0.007)), SW.goldHi, 'flat'));
  // raised inner plate (pale gold)
  C.push(paint(hull(plate([[-0.1, 0.04], [-0.06, 0.085], [0.06, 0.085], [0.1, 0.04], [0.1, -0.04], [0.06, -0.085], [-0.06, -0.085], [-0.1, -0.04]],
    V(0, BY, 0), FP, FP + 0.065)), SW.goldHi, 'y', [BY - 0.09, BY + 0.09]));
  // big ruby gem
  C.push(paint(hull([...plate([[-0.045, 0], [0, 0.05], [0.045, 0], [0, -0.05]], V(0, BY, 0), FP + 0.05, FP + 0.075),
    V(0, BY, FP + 0.095)]), SW.gem, 'y', [BY - 0.05, BY + 0.05]));
  // side wing points on the plate
  S.push(gold(shard(V(0.19, BY, FP - 0.01), V(1, 0, -0.6), 0.055, 0.075, 4, 0.5), BY - 0.06, BY + 0.06));
  // hip side plates
  S.push(gold(hull([...cbox(V(0.258, BY, -0.08), 0.035, 0.095, 0.1, 0.03)]), BY - 0.1, BY + 0.1));
  S.push(paint(hull([...cbox(V(0.296, BY, -0.08), 0.012, 0.035, 0.035, 0.012)]), SW.gem, 'y', [BY - 0.04, BY + 0.04]));
  // back plate
  C.push(gold(hull(cbox(V(0, BY, -0.235), 0.1, 0.075, 0.03, 0.025)), BY - 0.08, BY + 0.08));
  // studs between plates
  for (const a of [0.55, 1.0]) {
    const x = 0.28 * Math.sin(a + 0.6), z = 0.235 * Math.cos(a + 0.6);
    S.push(paint(blob(0, V(x, BY, z), V(0.02, 0.02, 0.02)), SW.goldHi, 'flat'));
  }

  // tiny stub tail
  C.push(fur([...cbox(V(0, 0.19, -0.19), 0.05, 0.045, 0.05, 0.02)], 0.1, 0.3));

  // ================= ARMS (thick, hanging slightly out) =================
  S.push(fur([...ring(V(0.23, 0.6, 0.0), 0.105, 0.105, 8, 'y'), ...ring(V(0.31, 0.47, 0.03), 0.098, 0.098, 8, 'y'),
    ...ring(V(0.325, 0.42, 0.04), 0.092, 0.092, 8, 'y')], 0.3, 0.8));
  S.push(fur([...ring(V(0.325, 0.44, 0.04), 0.09, 0.09, 8, 'y'), ...ring(V(0.365, 0.3, 0.08), 0.082, 0.082, 8, 'y')], 0.2, 0.7));
  // paw + claws
  S.push(fur([...cbox(V(0.37, 0.26, 0.09), 0.078, 0.062, 0.078, 0.03)], 0.15, 0.4));
  for (const dz of [-0.04, 0, 0.04])
    S.push(flat(shard(V(0.375, 0.21, 0.125 + dz), V(0.15, -1, 0.5), 0.016, 0.035), SW.claw));
  // gold bracer on forearm with ruby stud
  S.push(gold(hull([...ring(V(0.338, 0.4, 0.05), 0.1, 0.1, 8, 'y'), ...ring(V(0.358, 0.33, 0.07), 0.095, 0.095, 8, 'y')]), 0.32, 0.41));
  S.push(paint(hull(cbox(V(0.448, 0.365, 0.06), 0.012, 0.022, 0.022, 0.008)), SW.gem, 'y', [0.34, 0.39]));
  // dark bold markings: chevrons laid along the outer upper arm
  S.push(paint(shard(V(0.33, 0.53, 0.02), V(0.35, -1, 0.05), 0.045, 0.07, 4, 0.25), SW.dark, 'flat'));
  S.push(paint(shard(V(0.3, 0.6, 0.02), V(0.45, -1, 0.05), 0.04, 0.06, 4, 0.25), SW.dark, 'flat'));

  // ================= SHOULDER ARMOUR PLATES =================
  S.push(gold(hull([...ring(V(0.25, 0.66, 0.0), 0.1, 0.11, 8, 'y'), V(0.34, 0.58, 0.0), V(0.33, 0.56, 0.1), V(0.33, 0.56, -0.1),
    V(0.2, 0.7, 0)]), 0.55, 0.72));
  S.push(paint(hull([...ring(V(0.31, 0.56, 0.0), 0.06, 0.1, 8, 'y'), V(0.37, 0.53, 0), V(0.35, 0.5, 0.08), V(0.35, 0.5, -0.08)]), SW.goldHi, 'y', [0.48, 0.6]));

  // ================= HEAD (big, boxy, bear) =================
  const H = { y: 0.835, z: 0.05 };
  C.push(fur([
    ...cbox(V(0, H.y, H.z), 0.215, 0.16, 0.18, 0.065),
    ...ring(V(0, H.y + 0.18, H.z - 0.01), 0.14, 0.12, 8, 'y'),
    V(0.24, H.y - 0.075, H.z + 0.05), V(-0.24, H.y - 0.075, H.z + 0.05),
  ], 0.65, 1.0));
  const FZ = H.z + 0.18;
  // cheek fur shards
  S.push(paint(shard(V(0.225, H.y - 0.06, H.z + 0.05), V(1, -0.5, 0.15), 0.055, 0.09, 4, 0.6), SW.fur, 'flat'));
  S.push(paint(shard(V(0.215, H.y - 0.11, H.z - 0.03), V(0.8, -0.9, -0.2), 0.05, 0.085, 4, 0.6), SW.fur, 'flat'));
  S.push(paint(shard(V(0.2, H.y + 0.02, H.z - 0.08), V(1, -0.2, -0.5), 0.045, 0.07, 4, 0.6), SW.fur, 'flat'));
  S.push(paint(shard(V(0.12, H.y - 0.15, H.z + 0.1), V(0.4, -1, 0.3), 0.045, 0.07, 4, 0.6), SW.fur, 'flat'));
  C.push(paint(shard(V(0, H.y + 0.16, H.z + 0.04), V(0, 1, 0.4), 0.045, 0.06), SW.fur, 'flat'));

  // muzzle
  C.push(paint(hull([...cbox(V(0, H.y - 0.07, FZ + 0.04), 0.11, 0.065, 0.07, 0.03),
    V(0.08, H.y - 0.0, FZ - 0.02), V(-0.08, H.y - 0.0, FZ - 0.02)]), SW.tan, 'y', [H.y - 0.14, H.y]));
  // nose
  C.push(paint(hull([...cbox(V(0, H.y - 0.03, FZ + 0.108), 0.05, 0.025, 0.02, 0.01),
    V(0, H.y - 0.07, FZ + 0.1), V(0.02, H.y - 0.062, FZ + 0.1), V(-0.02, H.y - 0.062, FZ + 0.1)]), SW.nose, 'y'));
  C.push(flat(hull(cbox(V(0, H.y - 0.085, FZ + 0.107), 0.006, 0.02, 0.006, 0.002)), SW.mouth));
  S.push(flat(hull([V(0, H.y - 0.105, FZ + 0.112), V(0, H.y - 0.095, FZ + 0.112), V(0.05, H.y - 0.118, FZ + 0.1),
    V(0.05, H.y - 0.108, FZ + 0.1), V(0, H.y - 0.105, FZ + 0.1), V(0.05, H.y - 0.114, FZ + 0.088)]), SW.mouth));

  // fierce eyes
  const E = V(0.095, H.y + 0.04, 0), k = 1.2;
  const sc = (pts) => pts.map(([u, v]) => [u * k, v * k]);
  S.push(flat(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.01, FZ + 0.012)), SW.white));
  S.push(flat(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.005, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye));
  S.push(flat(hull(plate([[-0.009, -0.009], [0.009, -0.009], [0.009, 0.009], [-0.009, 0.009]],
    V(E.x + 0.006, E.y + 0.003, 0), FZ + 0.014, FZ + 0.022)), SW.white));
  // heavy brow
  S.push(paint(hull([
    V(0.02, E.y + 0.012, FZ + 0.045), V(0.022, E.y + 0.058, FZ + 0.03),
    V(0.18, E.y + 0.065, FZ + 0.0), V(0.18, E.y + 0.105, FZ - 0.02),
    V(0.02, E.y + 0.012, FZ - 0.03), V(0.022, E.y + 0.07, FZ - 0.04),
    V(0.18, E.y + 0.065, FZ - 0.06), V(0.18, E.y + 0.105, FZ - 0.07),
  ]), SW.brow, 'y'));
  // gold champion forehead crest
  // small gold champion crown on top of the head
  C.push(gold(hull([...ring(V(0, H.y + 0.165, H.z - 0.01), 0.1, 0.09, 8, 'y'), ...ring(V(0, H.y + 0.215, H.z - 0.01), 0.105, 0.095, 8, 'y')]), H.y + 0.16, H.y + 0.22));
  C.push(gold(shard(V(0, H.y + 0.21, H.z + 0.075), V(0, 1, 0.15), 0.035, 0.08, 4, 0.5), H.y + 0.2, H.y + 0.3));
  S.push(gold(shard(V(0.07, H.y + 0.21, H.z + 0.045), V(0.3, 1, 0.1), 0.03, 0.065, 4, 0.5), H.y + 0.2, H.y + 0.3));
  C.push(paint(hull(plate([[-0.016, 0], [0, 0.02], [0.016, 0], [0, -0.02]], V(0, H.y + 0.19, 0), H.z + 0.08, H.z + 0.098)), SW.gem, 'y', [H.y + 0.17, H.y + 0.21]));

  // round bear ears with tan inner
  S.push(fur([...ring(V(0.155, H.y + 0.17, H.z - 0.035), 0.068, 0.068, 8, 'z', 0), ...ring(V(0.15, H.y + 0.15, H.z - 0.1), 0.066, 0.066, 8, 'z', 0)], H.y + 0.1, H.y + 0.25));
  S.push(paint(hull([...ring(V(0.155, H.y + 0.175, H.z - 0.02), 0.04, 0.04, 8, 'z', 0), ...ring(V(0.155, H.y + 0.175, H.z - 0.04), 0.04, 0.038, 8, 'z', 0)]), SW.tan, 'flat'));

  // nape fur shards on the back of the head
  C.push(paint(shard(V(0, H.y - 0.02, H.z - 0.17), V(0, -0.7, -1), 0.06, 0.09, 4, 0.5), SW.fur, 'y', [0.6, 1.0]));
  S.push(paint(shard(V(0.1, H.y - 0.0, H.z - 0.16), V(0.4, -0.6, -1), 0.055, 0.085, 4, 0.5), SW.fur, 'y', [0.6, 1.0]));
  S.push(paint(shard(V(0.06, H.y + 0.09, H.z - 0.17), V(0.2, -0.3, -1), 0.05, 0.075, 4, 0.5), SW.fur, 'y', [0.6, 1.0]));

  // ================= BOLD MARKINGS (dark brown chevrons on shoulders/thighs) =================
  // back: dark chevron markings laid on the surface + fur shard ruff
  for (const [y0, h] of [[0.6, 0.04], [0.5, 0.045], [0.41, 0.04]]) {
    const pts = [];
    for (let k = 0; k <= 4; k++) {
      const th = (k / 4) * 1.05, yy = y0 + 0.07 * Math.sin(th);
      for (const [dy, f] of [[0.01, 1.0], [h - 0.01, 1.0], [0, 0.965], [h, 0.965], [0, 0.88], [h, 0.88]]) {
        const [rx, rz] = torsoR(yy + dy);
        pts.push(V(Math.sin(th) * rx * f, yy + dy, -Math.cos(th) * rz * f));
      }
    }
    S.push(paint(hull(pts), SW.dark, 'flat'));
  }
  // shard fur around the neck / shoulders / back
  for (const [b, d, w, l] of [
    [V(0.12, 0.68, -0.1), V(0.4, -0.3, -1), 0.05, 0.08],
    [V(0.04, 0.7, -0.12), V(0.15, -0.2, -1), 0.05, 0.08],
    [V(0.2, 0.47, -0.15), V(0.6, -0.6, -0.8), 0.045, 0.07],
    [V(0.24, 0.42, 0.05), V(1, -0.5, 0.2), 0.04, 0.06],
    [V(0.18, 0.22, 0.12), V(0.6, -0.8, 0.5), 0.04, 0.06],
  ]) S.push(paint(shard(b, d, w, l, 4, 0.6), SW.fur, 'y', [0.2, 0.8]));

  return assemble(C, S);
}

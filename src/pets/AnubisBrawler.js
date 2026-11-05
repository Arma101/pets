// Anubis Brawler (Epic, Round 3 - Desert Dojo): upright black jackal warrior with tall pointy ears,
// gold/lapis usekh collar, gold arm bands and bracers, gold shoulder plates, sandstone kilt with a
// gold/lapis apron, small gold crown and bold gold eye markings.
import { V, THREE, hull, cbox, ring, plate, shard, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  fur:    { i: 0, top: '#4E4A5A', bot: '#24222B' },
  furLt:  { i: 1, top: '#5C5869', bot: '#36333F' },
  gold:   { i: 2, top: '#FFDD63', bot: '#D9981C' },
  lapis:  { i: 3, top: '#4C7FF0', bot: '#1F3E9E' },
  sand:   { i: 4, top: '#F3DCA8', bot: '#CFA466' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:    { i: 6, top: '#1A1416', bot: '#0C0A0B' },
  brow:   { i: 7, top: '#77728A', bot: '#3A3744' },
  nose:   { i: 8, top: '#1E1B20', bot: '#0B0A0C' },
  mouth:  { i: 9, top: '#5A2E1A', bot: '#3E1E10' },
  claw:   { i: 10, top: '#FFE9A6', bot: '#D7AA5E' },
};
const SW = PALETTE;

export function buildGeometry() {
  const C = [], S = [];
  const fur = (pts, lo = 0.0, hi = 1.0) => paint(hull(pts), SW.fur, 'y', [lo, hi]);
  const gold = (pts, lo, hi) => paint(hull(pts), SW.gold, lo === undefined ? 'flat' : 'y', lo === undefined ? null : [lo, hi]);
  const lapis = (pts) => paint(hull(pts), SW.lapis, 'flat');
  // band: a short frustum ring around an axis-aligned limb
  const band = (c, r0, r1, h, n = 8, rz = null) => [
    ...ring(V(c.x, c.y + h / 2, c.z), r0, rz ? rz * r0 / r1 : r0, n, 'y'),
    ...ring(V(c.x, c.y - h / 2, c.z), r1, rz || r1, n, 'y')];

  // ================= TORSO (upright, broad chest, narrower waist) =================
  C.push(fur([
    ...ring(V(0, 0.27, -0.01), 0.12, 0.1, 10, 'y'),
    ...ring(V(0, 0.36, 0.0), 0.13, 0.105, 10, 'y'),
    ...ring(V(0, 0.47, 0.025), 0.18, 0.157, 10, 'y'),
    ...ring(V(0, 0.56, 0.02), 0.19, 0.152, 10, 'y'),
    ...ring(V(0, 0.63, -0.01), 0.12, 0.09, 10, 'y'),
  ], 0.25, 0.7));
  // neck
  C.push(fur([...ring(V(0, 0.6, 0.0), 0.085, 0.075, 8, 'y'), ...ring(V(0, 0.74, 0.03), 0.08, 0.07, 8, 'y')], 0.5, 0.85));

  // ================= USEKH COLLAR (stepped gold / lapis / gold tiers) =================
  C.push(gold([...ring(V(0, 0.672, 0.01), 0.098, 0.088, 10, 'y'), ...ring(V(0, 0.635, 0.02), 0.142, 0.13, 10, 'y')]));
  C.push(lapis([...ring(V(0, 0.64, 0.02), 0.137, 0.125, 10, 'y'), ...ring(V(0, 0.595, 0.025), 0.182, 0.162, 10, 'y')]));
  C.push(gold([...ring(V(0, 0.6, 0.025), 0.177, 0.157, 10, 'y'), ...ring(V(0, 0.55, 0.03), 0.212, 0.18, 10, 'y')]));

  // scarab / sun-disc medallion hanging from the collar
  C.push(gold([...ring(V(0, 0.505, 0.15), 0.05, 0.05, 8, 'z', Math.PI / 8).map((p) => p.add(V(0, 0, 0))),
    ...ring(V(0, 0.505, 0.175), 0.042, 0.042, 8, 'z', Math.PI / 8)]));
  C.push(lapis([...ring(V(0, 0.505, 0.17), 0.026, 0.026, 8, 'z', Math.PI / 8), ...ring(V(0, 0.505, 0.182), 0.022, 0.022, 8, 'z', Math.PI / 8)]));
  // bold gold chevron markings on the belly
  for (const [y, w, dz] of [[0.425, 0.085, 0.024], [0.385, 0.07, 0.012]])
    S.push(gold([V(0.0, y, 0.152 + dz), V(w, y + 0.04, 0.142 + dz), V(0.0, y + 0.022, 0.154 + dz), V(w, y + 0.062, 0.144 + dz),
      V(0.0, y, 0.12), V(w, y + 0.04, 0.1), V(0.0, y + 0.022, 0.12), V(w, y + 0.062, 0.1)]));
  // neck ruff: layered dark shards at the back of the neck, lying over the collar
  const ruff = (b, d, w, l) => paint(shard(b, d, w, l, 4, 0.5), SW.fur, 'y', [0.6, 0.78]);
  C.push(ruff(V(0, 0.715, -0.075), V(0, -0.55, -1), 0.06, 0.08));
  S.push(ruff(V(0.055, 0.712, -0.065), V(0.55, -0.55, -0.9), 0.05, 0.075));
  S.push(ruff(V(0.09, 0.705, -0.02), V(1, -0.5, -0.4), 0.045, 0.065));

  // gold diamond marking on the upper back
  C.push(gold([V(0, 0.535, -0.142), V(0, 0.425, -0.144), V(0.05, 0.48, -0.136), V(-0.05, 0.48, -0.136),
    V(0, 0.53, -0.11), V(0, 0.43, -0.112), V(0.045, 0.48, -0.105), V(-0.045, 0.48, -0.105)]));
  C.push(lapis([V(0, 0.508, -0.149), V(0, 0.452, -0.15), V(0.024, 0.48, -0.146), V(-0.024, 0.48, -0.146),
    V(0, 0.508, -0.12), V(0, 0.452, -0.12), V(0.024, 0.48, -0.12), V(-0.024, 0.48, -0.12)]));

  // ================= BELT + KILT (sandstone shendyt, gold belt, gold/lapis apron) =================
  C.push(paint(hull([...ring(V(0, 0.35, 0.0), 0.138, 0.108, 10, 'y'), ...ring(V(0, 0.2, 0.0), 0.168, 0.13, 10, 'y')]), SW.sand, 'y', [0.18, 0.36]));
  C.push(gold(band(V(0, 0.355, 0.0), 0.142, 0.146, 0.04, 10, 0.114)));
  // apron: gold frame + lapis inset, hanging in front of the kilt
  C.push(gold([V(-0.06, 0.34, 0.112), V(0.06, 0.34, 0.112), V(-0.075, 0.19, 0.138), V(0.075, 0.19, 0.138),
    V(-0.06, 0.34, 0.128), V(0.06, 0.34, 0.128), V(-0.075, 0.19, 0.156), V(0.075, 0.19, 0.156)]));
  C.push(lapis([V(-0.038, 0.32, 0.128), V(0.038, 0.32, 0.128), V(-0.05, 0.21, 0.152), V(0.05, 0.21, 0.152),
    V(-0.038, 0.32, 0.134), V(0.038, 0.32, 0.134), V(-0.05, 0.21, 0.161), V(0.05, 0.21, 0.161)]));

  // ================= LEGS (short, thick, planted slightly apart) =================
  S.push(fur([...ring(V(0.072, 0.28, 0.005), 0.066, 0.066, 8, 'y'), ...ring(V(0.095, 0.16, 0.025), 0.066, 0.066, 8, 'y')], 0.0, 0.45));
  S.push(fur([...ring(V(0.095, 0.17, 0.025), 0.062, 0.062, 8, 'y'), ...ring(V(0.1, 0.06, 0.0), 0.056, 0.056, 8, 'y')], 0.0, 0.45));
  // gold knee plate
  S.push(gold([...plate([[-0.03, 0.025], [0.03, 0.025], [0.034, -0.005], [0.0, -0.035], [-0.034, -0.005]], V(0.095, 0.165, 0), 0.075, 0.097)]));
  // gold anklet
  S.push(gold(band(V(0.1, 0.095, 0.0), 0.06, 0.064, 0.03)));
  // foot: dark paw block + three toes + gold claws
  S.push(paint(hull(cbox(V(0.1, 0.035, 0.03), 0.065, 0.035, 0.075, 0.022)), SW.fur, 'y', [0.0, 0.2]));
  for (const dx of [-0.04, 0, 0.04]) {
    S.push(paint(hull(cbox(V(0.1 + dx, 0.028, 0.1), 0.022, 0.028, 0.03, 0.01)), SW.furLt, 'y', [0.0, 0.1]));
    S.push(paint(shard(V(0.1 + dx, 0.018, 0.125), V(0, -0.35, 1), 0.012, 0.03), SW.claw, 'flat'));
  }

  // ================= ARMS (chunky, fists forward) =================
  const sh = V(0.22, 0.575, 0.0), el = V(0.255, 0.43, -0.01), wr = V(0.26, 0.33, 0.07);
  const fa0 = (t) => el.clone().lerp(wr, t);
  S.push(fur([...ring(sh, 0.08, 0.08, 8, 'y'), ...ring(sh.clone().lerp(el, 0.5), 0.078, 0.078, 8, 'y'), ...ring(el, 0.066, 0.066, 8, 'y')], 0.3, 0.65));
  S.push(fur([...ring(el, 0.066, 0.066, 8, 'y'), ...ring(fa0(0.5), 0.07, 0.07, 8, 'y'), ...ring(wr, 0.062, 0.062, 8, 'y')], 0.3, 0.65));
  // gold arm band on upper arm
  S.push(gold(band(sh.clone().lerp(el, 0.52), 0.083, 0.083, 0.04)));
  // gold bracer with lapis stripe on forearm
  const fa = (t) => el.clone().lerp(wr, t);
  S.push(gold([...ring(fa(0.38), 0.076, 0.076, 8, 'y'), ...ring(fa(0.92), 0.07, 0.07, 8, 'y')]));
  S.push(lapis([...ring(fa(0.58), 0.08, 0.08, 8, 'y'), ...ring(fa(0.72), 0.078, 0.078, 8, 'y')]));
  // fist: chunky block + knuckle row
  const F = V(0.262, 0.262, 0.1);
  S.push(paint(hull(cbox(F, 0.074, 0.07, 0.076, 0.026)), SW.fur, 'y', [0.18, 0.34]));
  // knuckle row across the front-top of the fist, and a folded thumb bar below it
  for (const dx of [-0.047, -0.016, 0.016, 0.047])
    S.push(paint(hull(cbox(V(F.x + dx, F.y + 0.026, F.z + 0.074), 0.016, 0.03, 0.014, 0.007)), SW.furLt, 'y', [0.18, 0.34]));
  S.push(paint(hull(cbox(V(F.x - 0.012, F.y - 0.03, F.z + 0.072), 0.052, 0.017, 0.012, 0.007)), SW.furLt, 'y', [0.18, 0.34]));
  // gold shoulder plates (pauldron) with lapis rim
  S.push(gold([...ring(V(0.215, 0.645, 0.0), 0.065, 0.075, 8, 'y'), ...ring(V(0.245, 0.565, 0.0), 0.105, 0.105, 8, 'y')]));
  S.push(lapis([...ring(V(0.246, 0.567, 0.0), 0.109, 0.109, 8, 'y'), ...ring(V(0.248, 0.548, 0.0), 0.111, 0.111, 8, 'y')]));

  // ================= TAIL (short, bushy, gold tip band) =================
  const tailPts = [V(0, 0.32, -0.08), V(0, 0.26, -0.18), V(0, 0.2, -0.26), V(0, 0.16, -0.32)];
  C.push(paint(tube(curveSamples(tailPts, 6, (t) => 0.04 + 0.018 * Math.sin(Math.PI * t)),
    { seg: 6, axis: V(1, 0, 0), capEnd: 0.03 }), SW.fur, 'len'));
  const tc = new THREE.CatmullRomCurve3(tailPts);
  const tailShard = (b, d, w, l) => paint(shard(b, d, w, l, 4, 0.55), SW.fur, 'y', [0.08, 0.4]);
  for (const [t, w, l] of [[0.3, 0.062, 0.085], [0.55, 0.068, 0.095], [0.8, 0.062, 0.095]]) {
    const p = tc.getPoint(t), d = tc.getTangent(t);
    C.push(tailShard(p.clone().add(V(0, 0.03, 0)), d.clone().add(V(0, 0.45, 0)), w, l));
    S.push(tailShard(p.clone().add(V(0.03, 0, 0)), d.clone().add(V(0.55, 0.1, 0)), w * 0.9, l * 0.9));
    C.push(tailShard(p.clone().add(V(0, -0.03, 0)), d.clone().add(V(0, -0.35, 0)), w * 0.85, l * 0.85));
  }
  C.push(tailShard(tc.getPoint(0.95), tc.getTangent(1), 0.055, 0.09));

  // ================= HEAD (cranium + long jackal snout) =================
  const C0 = C.length, S0 = S.length;
  const H = { y: 0.83, z: 0.02 };
  C.push(fur([
    ...cbox(V(0, H.y, H.z), 0.12, 0.105, 0.11, 0.04),
    ...ring(V(0, H.y + 0.12, H.z - 0.01), 0.08, 0.07, 8, 'y'),
    V(0.13, H.y - 0.06, H.z + 0.05), V(-0.13, H.y - 0.06, H.z + 0.05),
  ], 0.65, 1.0));
  const FZ = H.z + 0.11;
  // snout: long tapering wedge
  C.push(fur([
    ...cbox(V(0, 0.776, FZ + 0.0), 0.068, 0.056, 0.03, 0.02),
    V(0.03, 0.83, FZ + 0.06), V(-0.03, 0.83, FZ + 0.06),
    ...cbox(V(0, 0.76, FZ + 0.175), 0.022, 0.022, 0.016, 0.008),
  ], 0.7, 0.86));
  // lower jaw
  C.push(paint(hull([...cbox(V(0, 0.715, FZ + 0.01), 0.066, 0.025, 0.04, 0.01),
    ...cbox(V(0, 0.728, FZ + 0.145), 0.022, 0.015, 0.02, 0.007)]), SW.furLt, 'y', [0.69, 0.76]));
  // nose
  C.push(paint(hull([...cbox(V(0, 0.778, FZ + 0.19), 0.026, 0.016, 0.012, 0.005), V(0, 0.758, FZ + 0.19)]), SW.nose, 'y'));
  // mouth line
  S.push(paint(hull([V(0, 0.739, FZ + 0.19), V(0, 0.745, FZ + 0.19), V(0.05, 0.742, FZ + 0.04),
    V(0.05, 0.748, FZ + 0.04), V(0.024, 0.742, FZ + 0.16), V(0.07, 0.744, FZ + 0.015)]), SW.mouth, 'flat'));
  // cheek fur tufts behind the jaw
  const cheek = (b, d, w, l) => paint(shard(b, d, w, l, 4, 0.55), SW.fur, 'y', [0.68, 0.84]);
  S.push(cheek(V(0.115, 0.765, FZ - 0.07), V(0.8, -0.45, -0.35), 0.045, 0.075));
  S.push(cheek(V(0.105, 0.735, FZ - 0.12), V(0.6, -0.7, -0.6), 0.04, 0.07));

  // eyes: white almond, angry top slanting toward the nose
  const E = V(0.07, 0.875, 0);
  S.push(paint(hull(plate([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]],
    E, FZ - 0.01, FZ + 0.01, 0.25)), SW.white, 'flat'));
  S.push(paint(hull(plate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]],
    V(E.x - 0.004, E.y, 0), FZ + 0.004, FZ + 0.016, 0.25)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.012, FZ + 0.02, 0.25)), SW.white, 'flat'));
  // gold eye-liner wing sweeping back along the cheek
  S.push(gold([V(E.x + 0.045, E.y - 0.03, FZ + 0.004), V(E.x + 0.055, E.y - 0.005, FZ + 0.0),
    V(0.128, E.y - 0.055, FZ - 0.08), V(0.128, E.y - 0.03, FZ - 0.08),
    V(E.x + 0.035, E.y - 0.03, FZ - 0.02), V(0.115, E.y - 0.055, FZ - 0.08), V(0.115, E.y - 0.03, FZ - 0.08)]));
  // heavy brow ridge
  S.push(paint(hull([
    V(0.018, E.y + 0.008, FZ + 0.042), V(0.02, E.y + 0.05, FZ + 0.03),
    V(0.135, E.y + 0.046, FZ + 0.008), V(0.135, E.y + 0.085, FZ - 0.008),
    V(0.022, E.y + 0.012, FZ - 0.03), V(0.024, E.y + 0.06, FZ - 0.04),
    V(0.13, E.y + 0.05, FZ - 0.06), V(0.13, E.y + 0.09, FZ - 0.07),
  ]), SW.brow, 'y'));

  // tall pointy ears with lapis inners
  const earBase = V(0.075, H.y + 0.09, H.z - 0.035);
  const up = V(0.22, 1, -0.1).normalize();
  const side = V(1, -0.22, 0).normalize();
  const nrm = new THREE.Vector3().crossVectors(side, up).normalize();
  const EP = (u, v, w) => earBase.clone().addScaledVector(side, u).addScaledVector(up, v).addScaledVector(nrm, w);
  const outline = [[-0.05, 0], [0.055, 0], [0.045, 0.12], [0.004, 0.27], [-0.035, 0.12]];
  S.push(fur([...outline.flatMap(([u, v]) => [EP(u, v, -0.05), EP(u, v, 0.012)]), EP(0.005, 0.08, -0.09)], 0.85, 1.25));
  const inner = [[-0.025, 0.04], [0.032, 0.04], [0.027, 0.12], [0.004, 0.22], [-0.018, 0.12]];
  S.push(lapis(inner.flatMap(([u, v]) => [EP(u, v, 0.008), EP(u, v, 0.019)])));

  // small gold crown: band + points + lapis gem
  const CR = V(0, H.y + 0.12, H.z + 0.035);
  C.push(gold(band(V(CR.x, CR.y + 0.012, CR.z), 0.058, 0.062, 0.035, 8, 0.052)));
  C.push(gold([V(0, CR.y + 0.08, CR.z + 0.045), ...cbox(V(0, CR.y + 0.02, CR.z + 0.045), 0.022, 0.012, 0.01, 0.004)]));
  S.push(gold([V(0.04, CR.y + 0.06, CR.z + 0.03), ...cbox(V(0.04, CR.y + 0.02, CR.z + 0.03), 0.018, 0.012, 0.01, 0.004)]));
  C.push(lapis(cbox(V(0, CR.y + 0.012, CR.z + 0.058), 0.014, 0.014, 0.006, 0.004)));

  // enlarge the whole head around the neck top (big head per the style)
  const HP = V(0, 0.74, 0.04), HS = 1.22;
  for (const g of [...C.slice(C0), ...S.slice(S0)]) {
    g.translate(-HP.x, -HP.y, -HP.z); g.scale(HS, HS, HS); g.translate(HP.x, HP.y - 0.025, HP.z);
  }
  return assemble(C, S);
}

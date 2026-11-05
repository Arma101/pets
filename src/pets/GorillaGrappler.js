// Gorilla Grappler (Rare, Round 2 - Jungle Gym): knuckle-walking charcoal gorilla with a silver back saddle,
// huge forearms and knuckle fists, vines + leaves wrapped around the wrists, carved jade shoulder plates and
// bracers with gold trim.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  body:   { i: 0, top: '#5E5D6B', bot: '#33323C' }, // charcoal
  fur:    { i: 1, top: '#55545F', bot: '#2C2B33' }, // darker shard fur
  silver: { i: 2, top: '#EEF0F4', bot: '#AEB2BD' }, // silverback saddle
  skin:   { i: 3, top: '#9C99A6', bot: '#66636F' }, // grey face / chest / knuckles
  white:  { i: 4, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:    { i: 5, top: '#1A1416', bot: '#0C0A0B' },
  brow:   { i: 6, top: '#4C4B57', bot: '#2A2930' },
  mouth:  { i: 7, top: '#3A2E34', bot: '#221A1F' },
  vine:   { i: 8, top: '#5DB043', bot: '#2E6E24' },
  leaf:   { i: 9, top: '#9BDB54', bot: '#3F9A2E' },
  jade:   { i: 10, top: '#7FEBC0', bot: '#1F9E78' },
  jadeDk: { i: 11, top: '#3FC495', bot: '#137A5C' },
  gold:   { i: 12, top: '#FFD95A', bot: '#D69A1E' },
  nostril:{ i: 13, top: '#3E3A42', bot: '#25222A' },
};
const SW = PALETTE;

export function buildGeometry() {
  const C = [], S = [];
  const body = (pts, lo = 0.1, hi = 0.85) => paint(hull(pts), SW.body, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');
  // flat faceted leaf: diamond with a little thickness
  const leaf = (base, dir, len, w) => {
    const d = dir.clone().normalize();
    const side = new THREE.Vector3().crossVectors(d, V(0, 1, 0));
    if (side.length() < 0.2) side.set(1, 0, 0);
    side.normalize();
    const n = new THREE.Vector3().crossVectors(d, side).normalize();
    const mid = base.clone().addScaledVector(d, len * 0.45);
    const pts = [];
    for (const t of [-0.007, 0.007]) {
      pts.push(base.clone().addScaledVector(n, t), base.clone().addScaledVector(d, len).addScaledVector(n, t * 0.4),
        mid.clone().addScaledVector(side, w).addScaledVector(n, t), mid.clone().addScaledVector(side, -w).addScaledVector(n, t));
    }
    return paint(hull(pts), SW.leaf, 'flat');
  };

  // ================= TORSO (wedge: high broad shoulders, low narrow hips) =================
  const torsoRings = [
    [V(0, 0.36, -0.33), 0.11, 0.1],
    [V(0, 0.38, -0.26), 0.19, 0.16],
    [V(0, 0.45, -0.1), 0.23, 0.2],
    [V(0, 0.53, 0.05), 0.27, 0.22],
    [V(0, 0.57, 0.17), 0.24, 0.19],
    [V(0, 0.56, 0.24), 0.16, 0.14],
  ];
  C.push(body(torsoRings.flatMap(([c, a, b]) => ring(c, a, b, 10, 'z', 0)), 0.2, 0.8));

  // silver saddle: same ring vertices pushed outward, upper part only (rear two thirds of the back)
  const sad = [];
  torsoRings.slice(0, 5).forEach(([c, a, b], j) => {
    const g = j === 4 ? 0.6 : 1; // fade toward the shoulders
    const cc = j === 0 ? V(c.x, c.y + 0.004, c.z - 0.012) : c;
    for (const p of ring(cc, a * 1.03 + 0.006, b * 1.03 + 0.006, 10, 'z', 0)) if (p.y > c.y - 0.04 * g) sad.push(p);
  });
  C.push(paint(hull(sad), SW.silver, 'y', [0.3, 0.72]));
  // low silver fur ridges layered down the back
  for (const [z, y] of [[0.03, 0.74], [-0.1, 0.645], [-0.22, 0.57]]) {
    C.push(paint(shard(V(0, y, z), V(0, -0.45, -1), 0.065, 0.12, 4, 0.35), SW.silver, 'y', [0.3, 0.75]));
    S.push(paint(shard(V(0.12, y - 0.03, z - 0.01), V(0.35, -0.5, -1), 0.06, 0.11, 4, 0.35), SW.silver, 'y', [0.3, 0.75]));
  }
  // silver fur fringe along the saddle's side edges and front edge
  for (const [b, d, w, l] of [
    [V(0.215, 0.45, -0.2), V(0.6, -0.8, -0.3), 0.05, 0.09],
    [V(0.245, 0.5, -0.06), V(0.6, -0.8, -0.2), 0.055, 0.1],
    [V(0.25, 0.56, 0.06), V(0.5, -0.6, -0.4), 0.05, 0.08],
  ]) S.push(paint(shard(b, d, w, l, 4, 0.5), SW.silver, 'y', [0.3, 0.72]));

  // grey chest/belly skin: torso vertices of the front cap + lower belly strip, pushed 0.006 out,
  // so the skin is part of the torso surface (its hull sinks into the torso at the sides)
  const skin = [];
  const push = (c, p, dz = 0) => { const r = V(p.x - c.x, p.y - c.y, 0).normalize(); return p.clone().addScaledVector(r, 0.006).add(V(0, 0, dz)); };
  for (const [idx, filt, dz] of [[5, () => true, 0.006], [4, (p, c) => p.y < c.y - 0.05 && Math.abs(p.x) < 0.1, 0],
    [3, (p, c) => p.y < c.y - 0.1 && Math.abs(p.x) < 0.1, 0]]) {
    const [c, a, b] = torsoRings[idx];
    for (const p of ring(c, a, b, 10, 'z', 0)) if (filt(p, c)) skin.push(push(c, p, dz));
  }
  C.push(paint(hull(skin), SW.skin, 'y', [0.18, 0.62]));
  // two broad pec plates sitting on the chest skin, bevelled all round (stronger at the lower edge)
  const CZ = torsoRings[5][0].z + 0.006;
  const pec = [[-0.06, 0.04], [0.05, 0.045], [0.066, 0.0], [0.035, -0.042], [-0.06, -0.04]].map(([u, v]) => [u * 1.1, v * 1.1]);
  const pecS = (k, dy) => pec.map(([u, v]) => [u * k, v * k + dy]);
  S.push(paint(hull([
    ...plate(pec, V(0.066, 0.515, 0), CZ - 0.003, CZ + 0.001),
    ...plate(pecS(0.9, 0.003), V(0.066, 0.515, 0), CZ + 0.009, CZ + 0.009),
    ...plate(pecS(0.68, 0.008), V(0.066, 0.515, 0), CZ + 0.015, CZ + 0.015),
  ]), SW.skin, 'y', [0.44, 0.6]));

  // ================= ARMS (big shoulders, huge forearms, knuckle fists planted) =================
  const AX = 0.3;
  // shoulder / deltoid
  S.push(paint(blob(1, V(0.25, 0.6, 0.12), V(0.13, 0.11, 0.13), { jitter: 0.1 }), SW.body, 'y', [0.2, 0.8]));
  // upper arm
  S.push(body([...ring(V(0.27, 0.58, 0.13), 0.09, 0.09, 8), ...ring(V(AX, 0.42, 0.17), 0.085, 0.085, 8)], 0.2, 0.8));
  // forearm: big bulging club
  S.push(body([
    ...ring(V(AX, 0.44, 0.17), 0.08, 0.08, 8),
    ...ring(V(AX + 0.005, 0.34, 0.19), 0.125, 0.12, 8),
    ...ring(V(AX + 0.005, 0.25, 0.2), 0.13, 0.125, 8),
    ...ring(V(AX, 0.16, 0.21), 0.085, 0.085, 8),
  ], 0.05, 0.6));
  // fist: chunky grey block, knuckles forward/down
  const F = V(AX, 0.07, 0.225);
  S.push(paint(hull([...cbox(F, 0.088, 0.07, 0.08, 0.03), V(AX, 0.15, 0.21)]), SW.skin, 'y', [0, 0.16]));
  for (const dx of [-0.06, -0.02, 0.02, 0.06])
    S.push(paint(hull(cbox(V(F.x + dx, 0.035, F.z + 0.07), 0.021, 0.035, 0.028, 0.01)), SW.skin, 'y', [0, 0.1]));
  // thumb on the inner side
  S.push(paint(hull(cbox(V(F.x - 0.085, 0.05, F.z + 0.035), 0.02, 0.03, 0.035, 0.01)), SW.skin, 'y', [0, 0.1]));

  // vine wrapped around the wrist (helix) + leaf shards
  const helix = [];
  const vr = (y) => 0.085 + 0.5 * Math.max(0, y - 0.16) + 0.012;
  const hp = (t) => { const th = t * Math.PI * 3.3 + 0.3, y = 0.15 + t * 0.12;
    return V(AX + Math.cos(th) * vr(y), y, 0.21 - (y - 0.16) * 0.11 + Math.sin(th) * vr(y)); };
  for (let i = 0; i <= 16; i++) helix.push(hp(i / 16));
  S.push(paint(tube(curveSamples(helix, 28, () => 0.018), { seg: 5, ref: V(0, 1, 0) }), SW.vine, 'y', [0.12, 0.25]));
  // leaves sprouting off the vine
  for (const [t, up] of [[0.06, -0.2], [0.33, 0.5], [0.55, 0.1], [0.8, 0.6]]) {
    const p = hp(t), out = V(p.x - AX, 0, p.z - 0.2).normalize();
    S.push(leaf(p.clone().addScaledVector(out, -0.006), V(out.x * 0.8, up + 0.35, out.z * 0.8 + 0.25), 0.085, 0.034));
  }

  // carved jade bracer on upper forearm with gold trim
  S.push(paint(hull([...ring(V(AX + 0.005, 0.295, 0.195), 0.142, 0.137, 8), ...ring(V(AX + 0.005, 0.365, 0.185), 0.13, 0.125, 8)]),
    SW.jade, 'y', [0.29, 0.37]));
  S.push(paint(hull([...ring(V(AX + 0.005, 0.362, 0.185), 0.138, 0.133, 8), ...ring(V(AX + 0.005, 0.38, 0.183), 0.125, 0.12, 8)]),
    SW.gold, 'flat'));
  S.push(paint(hull([...ring(V(AX + 0.005, 0.28, 0.197), 0.138, 0.133, 8), ...ring(V(AX + 0.005, 0.298, 0.195), 0.149, 0.144, 8)]),
    SW.gold, 'flat'));

  // forearm hair shards
  S.push(paint(shard(V(AX + 0.1, 0.38, 0.15), V(0.5, -0.6, -0.6), 0.04, 0.08, 4, 0.5), SW.fur, 'flat'));
  S.push(paint(shard(V(AX + 0.04, 0.42, 0.08), V(0.2, -0.6, -1), 0.04, 0.08, 4, 0.5), SW.fur, 'flat'));

  // jade pauldron tilted over the shoulder, gold rim, small jade horn-spike
  const tring = (c, r, n, a, off = 0, ph = 0) => {
    const nrm = V(Math.sin(a), Math.cos(a), 0), u = V(Math.cos(a), -Math.sin(a), 0), w = V(0, 0, 1);
    const out = [];
    for (let k = 0; k < n; k++) {
      const t = ph + (2 * Math.PI * k) / n;
      out.push(c.clone().addScaledVector(nrm, off).addScaledVector(u, Math.cos(t) * r).addScaledVector(w, Math.sin(t) * r));
    }
    return out;
  };
  const PA = 0.75, PC = V(0.305, 0.66, 0.12);
  S.push(paint(hull([...tring(PC, 0.118, 8, PA, 0, Math.PI / 8), ...tring(PC, 0.08, 8, PA, 0.05, Math.PI / 8)]), SW.jade, 'y', [0.6, 0.76]));
  S.push(paint(hull([...tring(PC, 0.126, 8, PA, -0.004, Math.PI / 8), ...tring(PC, 0.119, 8, PA, -0.024, Math.PI / 8)]), SW.gold, 'flat'));
  const pn = V(Math.sin(PA), Math.cos(PA), 0);
  S.push(paint(shard(PC.clone().addScaledVector(pn, 0.045), V(pn.x * 0.6, 1, -0.2), 0.035, 0.08, 4, 1), SW.jadeDk, 'y', [0.68, 0.82]));
  // carved jade knuckle studs on the fist top
  // carved diamond inlays on the bracer (front + outer side), dark jade in a gold setting
  for (const [ang, ins] of [[Math.PI / 2, 0], [0, 1]]) {
    const n = V(Math.cos(ang), 0, Math.sin(ang)), bc = V(AX + 0.005, 0.33, 0.19);
    const t = V(-n.z, 0, n.x), face = 0.126;
    const dia = (r, d0, d1) => { const out = []; for (const [u, v] of [[0, r], [r * 0.8, 0], [0, -r], [-r * 0.8, 0]])
      for (const d of [d0, d1]) out.push(bc.clone().addScaledVector(n, d).addScaledVector(t, u).add(V(0, v, 0))); return out; };
    S.push(paint(hull(dia(0.034, face - 0.01, face + 0.008)), SW.gold, 'flat'));
    S.push(paint(hull(dia(0.022, face, face + 0.014)), SW.jadeDk, 'flat'));
  }

  // shaggy shoulder / nape fur shards (charcoal), elbow tufts
  for (const [b, d, w, l] of [
    [V(0.36, 0.42, 0.13), V(0.5, -0.4, -1), 0.045, 0.09],
    [V(0.29, 0.42, 0.1), V(0.0, -0.4, -1), 0.045, 0.09],
  ]) S.push(paint(shard(b, d, w, l, 4, 0.5), SW.fur, 'y', [0.35, 0.75]));

  // ================= LEGS (short, thick, planted behind) =================
  S.push(paint(blob(1, V(0.15, 0.36, -0.22), V(0.11, 0.13, 0.13), { jitter: 0.1 }), SW.body, 'y', [0.1, 0.7]));
  S.push(body([...ring(V(0.17, 0.32, -0.21), 0.09, 0.1, 8), ...ring(V(0.19, 0.18, -0.2), 0.085, 0.085, 8),
    ...ring(V(0.19, 0.08, -0.19), 0.075, 0.075, 8)], 0.04, 0.6));
  // feet: grey skin block + toes
  const FX = 0.19, FZ0 = -0.17;
  S.push(paint(hull(cbox(V(FX, 0.04, FZ0), 0.075, 0.04, 0.085, 0.022)), SW.skin, 'y', [0, 0.09]));
  for (const dx of [-0.045, 0, 0.045])
    S.push(paint(hull(cbox(V(FX + dx, 0.03, FZ0 + 0.085), 0.022, 0.03, 0.028, 0.01)), SW.skin, 'y', [0, 0.09]));
  S.push(paint(hull(cbox(V(FX - 0.08, 0.025, FZ0 + 0.05), 0.02, 0.025, 0.03, 0.01)), SW.skin, 'y', [0, 0.09]));

  // ================= HEAD (big, forward, sagittal crest) =================
  const H = { y: 0.72, z: 0.3 };
  C.push(body([
    ...cbox(V(0, H.y, H.z), 0.165, 0.125, 0.135, 0.05),
    ...ring(V(0, H.y + 0.16, H.z - 0.03), 0.11, 0.1, 8, 'y'),
    V(0, H.y + 0.215, H.z - 0.05), V(0.035, H.y + 0.2, H.z + 0.01), V(-0.035, H.y + 0.2, H.z + 0.01),
    V(0.035, H.y + 0.19, H.z - 0.12), V(-0.035, H.y + 0.19, H.z - 0.12),
    V(0.17, H.y - 0.06, H.z + 0.03), V(-0.17, H.y - 0.06, H.z + 0.03),
  ], 0.5, 0.95));
  const FZ = H.z + 0.135;

  // grey face mask + protruding muzzle
  C.push(paint(hull([
    ...plate([[-0.12, 0.06], [0.12, 0.06], [0.135, -0.02], [0.1, -0.11], [-0.1, -0.11], [-0.135, -0.02]], V(0, H.y, 0), FZ - 0.04, FZ + 0.012),
  ]), SW.skin, 'y', [H.y - 0.12, H.y + 0.07]));
  C.push(paint(hull([...cbox(V(0, H.y - 0.075, FZ + 0.04), 0.1, 0.06, 0.05, 0.03),
    V(0.07, H.y - 0.02, FZ), V(-0.07, H.y - 0.02, FZ)]), SW.skin, 'y', [H.y - 0.14, H.y]));
  // nostrils & mouth
  S.push(flat(hull(plate([[-0.016, 0.006], [0.0, 0.014], [0.02, 0.008], [0.02, -0.008], [-0.012, -0.012]],
    V(0.03, H.y - 0.045, 0), FZ + 0.08, FZ + 0.094)), SW.nostril));
  C.push(flat(hull(cbox(V(0, H.y - 0.11, FZ + 0.091), 0.05, 0.006, 0.004, 0.002)), SW.mouth));

  // fierce eyes (punch_pup block, scaled)
  const E = V(0.07, H.y + 0.025, 0), k = 1.0;
  const sc = (pts) => pts.map(([u, v]) => [u * k, v * k]);
  S.push(flat(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.01, FZ + 0.018)), SW.white));
  S.push(flat(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.004, E.y, 0), FZ + 0.012, FZ + 0.024)), SW.eye));
  S.push(flat(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.02, FZ + 0.028)), SW.white));
  // heavy protruding brow
  S.push(paint(hull([
    V(0.0, E.y + 0.012, FZ + 0.055), V(0.0, E.y + 0.05, FZ + 0.045),
    V(0.145, E.y + 0.05, FZ + 0.0), V(0.145, E.y + 0.08, FZ - 0.015),
    V(0.0, E.y + 0.012, FZ - 0.02), V(0.0, E.y + 0.06, FZ - 0.03),
    V(0.14, E.y + 0.055, FZ - 0.07), V(0.14, E.y + 0.085, FZ - 0.08),
  ]), SW.brow, 'y'));

  // small ears
  S.push(paint(hull([...ring(V(0.165, H.y + 0.01, H.z - 0.01), 0.03, 0.04, 6, 'x', 0), ...ring(V(0.185, H.y + 0.01, H.z - 0.01), 0.025, 0.033, 6, 'x', 0)]),
    SW.skin, 'flat'));

  // cheek / crest fur shards
  S.push(paint(shard(V(0.15, H.y - 0.05, H.z + 0.02), V(1, -0.5, -0.3), 0.04, 0.07, 4, 0.5), SW.fur, 'flat'));
  C.push(paint(shard(V(0, H.y + 0.2, H.z - 0.12), V(0, 0.3, -1), 0.04, 0.08, 4, 0.6), SW.fur, 'flat'));

  return assemble(C, S);
}

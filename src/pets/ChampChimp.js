// Champ Chimp: brown chimp champion with a small gold crown and a gold title belt (Robux egg, Champion Egg).
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  fur:     { i: 0, top: '#8E5530', bot: '#5A3118' },
  furDark: { i: 1, top: '#5C321B', bot: '#381C0E' },
  skin:    { i: 2, top: '#F4CDA0', bot: '#D29A68' },
  chest:   { i: 3, top: '#C68B57', bot: '#9C6236' },
  gold:    { i: 4, top: '#FFE56B', bot: '#E7A51C' },
  goldDk:  { i: 5, top: '#F0B93A', bot: '#B47A12' },
  ruby:    { i: 6, top: '#FF6478', bot: '#E0102E', glow: true },
  white:   { i: 7, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:     { i: 8, top: '#1A1416', bot: '#0C0A0B' },
  brow:    { i: 9, top: '#6E3D20', bot: '#4A2612' },
  mouth:   { i: 10, top: '#5A2E1A', bot: '#3E1E10' },
  skinDk:  { i: 11, top: '#D9A274', bot: '#B57A4C' },
};
const SW = PALETTE;

export function buildGeometry() {
  const C = [], S = [];
  const fur = (pts, lo = 0.0, hi = 1.0) => paint(hull(pts), SW.fur, 'y', [lo, hi]);
  const P = (g, sw, mode = 'flat', r = null) => paint(g, sw, mode, r);

  // ================= LEGS + FEET =================
  const LX = 0.14;
  S.push(fur([...ring(V(0.095, 0.37, -0.01), 0.11, 0.11, 8), ...ring(V(LX, 0.2, 0.01), 0.095, 0.1, 8)], 0.0, 0.6));
  S.push(fur([...ring(V(LX, 0.21, 0.01), 0.09, 0.095, 8), ...ring(V(LX + 0.005, 0.06, 0.02), 0.08, 0.085, 8)], 0.0, 0.6));
  // knee guard (armor plate)
  S.push(P(hull(plate([[-0.05, 0.04], [0.05, 0.04], [0.06, 0.0], [0.04, -0.05], [-0.04, -0.05], [-0.06, 0.0]],
    V(LX, 0.19, 0), 0.075, 0.122)), SW.gold, 'y', [0.13, 0.24]));
  // feet: chimp hand-feet, skin coloured block + toes + big inner toe
  const foot = (x, z) => {
    S.push(P(hull(cbox(V(x, 0.036, z), 0.075, 0.036, 0.085, 0.02)), SW.skin, 'y', [0, 0.08]));
    for (const dx of [-0.035, 0.0, 0.035])
      S.push(P(hull(cbox(V(x + dx + 0.01, 0.028, z + 0.09), 0.019, 0.028, 0.03, 0.01)), SW.skinDk, 'y', [0, 0.07]));
    S.push(P(hull(cbox(V(x - 0.07, 0.024, z + 0.05), 0.022, 0.024, 0.03, 0.01)), SW.skinDk, 'y', [0, 0.07]));
  };
  foot(LX + 0.01, 0.05);

  // ================= TORSO =================
  C.push(fur([
    ...ring(V(0, 0.29, -0.01), 0.15, 0.12, 10),
    ...ring(V(0, 0.42, 0.0), 0.19, 0.145, 10),
    ...ring(V(0, 0.56, 0.005), 0.235, 0.17, 10),
    ...ring(V(0, 0.665, 0.0), 0.2, 0.15, 10),
    ...ring(V(0, 0.72, 0.01), 0.12, 0.11, 10),
  ], 0.25, 0.75));
  // lighter chest / belly marking
  C.push(P(hull([...cbox(V(0, 0.585, 0.12), 0.15, 0.06, 0.06, 0.03), ...cbox(V(0, 0.49, 0.11), 0.095, 0.05, 0.05, 0.03)]),
    SW.chest, 'y', [0.44, 0.66]));
  C.push(P(hull(cbox(V(0, 0.565, 0.178), 0.006, 0.05, 0.006, 0.002)), SW.skinDk, 'flat'));

  // ================= TITLE BELT =================
  const BY = 0.4;
  C.push(P(hull([...ring(V(0, BY - 0.045, 0), 0.205, 0.158, 14), ...ring(V(0, BY + 0.045, 0), 0.212, 0.165, 14)]),
    SW.goldDk, 'y', [BY - 0.05, BY + 0.05]));
  // big front plate (octagon) with crest peaks top and bottom + raised centre + ruby
  const oct = (w, h, c) => [[-w + c, h], [w - c, h], [w, h - c], [w, -h + c], [w - c, -h], [-w + c, -h], [-w, -h + c], [-w, h - c]];
  C.push(P(hull(plate([...oct(0.125, 0.09, 0.035), [0, 0.135], [0, -0.125]], V(0, BY, 0), 0.13, 0.185)), SW.gold, 'y', [BY - 0.12, BY + 0.12]));
  C.push(P(hull(plate(oct(0.08, 0.06, 0.024), V(0, BY, 0), 0.17, 0.198)), SW.goldDk, 'y', [BY - 0.06, BY + 0.06]));
  C.push(P(hull([V(0, BY + 0.035, 0.2), V(0.03, BY, 0.2), V(0, BY - 0.035, 0.2), V(-0.03, BY, 0.2), V(0, BY, 0.222)]), SW.ruby, 'y', [BY - 0.04, BY + 0.04]));
  // back plate on the strap
  C.push(P(hull(plate(oct(0.075, 0.06, 0.02), V(0, BY, 0), -0.185, -0.15)), SW.gold, 'y', [BY - 0.06, BY + 0.06]));
  // side plates on the strap
  const beltPlate = (ang, hw, hh, gem) => {
    const rx = 0.212, rz = 0.165;
    const c = V(Math.sin(ang) * rx, BY, Math.cos(ang) * rz);
    const n = V(Math.sin(ang) / rx, 0, Math.cos(ang) / rz).normalize();
    const t = V(n.z, 0, -n.x);
    const pts = [];
    for (const su of [-1, 1]) for (const sv of [-1, 1]) for (const d of [-0.01, 0.018]) {
      const k = d > 0 ? 0.8 : 1;
      pts.push(c.clone().addScaledVector(t, su * hw * k).add(V(0, sv * hh * k, 0)).addScaledVector(n, d));
    }
    S.push(P(hull(pts), SW.gold, 'y', [BY - hh, BY + hh]));
    if (gem) {
      const g = c.clone().addScaledVector(n, 0.018);
      S.push(P(hull([g.clone().add(V(0, 0.018, 0)), g.clone().add(V(0, -0.018, 0)), g.clone().addScaledVector(t, 0.016),
        g.clone().addScaledVector(t, -0.016), g.clone().addScaledVector(n, 0.014)]), SW.ruby, 'flat'));
    }
  };
  beltPlate(0.95, 0.05, 0.06, true);
  beltPlate(1.75, 0.045, 0.055, false);
  beltPlate(2.55, 0.045, 0.055, false);

  // ================= ARMS =================
  const SH = V(0.235, 0.6, -0.01), EL = V(0.3, 0.42, 0.02), WR = V(0.315, 0.26, 0.05);
  S.push(fur([...ring(SH, 0.085, 0.085, 8), ...ring(EL, 0.072, 0.072, 8)], 0.2, 0.7));
  S.push(fur([...ring(EL, 0.07, 0.07, 8), ...ring(WR, 0.078, 0.078, 8)], 0.2, 0.7));
  // bracer
  S.push(P(hull([...ring(V(WR.x - 0.002, 0.33, WR.z - 0.01), 0.088, 0.088, 8), ...ring(V(WR.x, 0.255, WR.z), 0.09, 0.09, 8)]),
    SW.gold, 'y', [0.24, 0.34]));
  // fist: skin block, curled finger rows on the front, thumb on the inside
  S.push(P(hull(cbox(V(WR.x, 0.185, WR.z), 0.066, 0.07, 0.066, 0.025)), SW.skin, 'y', [0.12, 0.26]));
  for (const [dy, dz] of [[0.035, 0.0], [-0.005, 0.006], [-0.045, 0.0]])
    S.push(P(hull(cbox(V(WR.x, 0.185 + dy, WR.z + 0.062 + dz), 0.06, 0.017, 0.016, 0.008)), SW.skinDk, 'y', [0.12, 0.24]));
  S.push(P(hull(cbox(V(WR.x - 0.062, 0.2, WR.z + 0.035), 0.016, 0.035, 0.024, 0.008)), SW.skinDk, 'y', [0.15, 0.24]));
  // shoulder pauldron: two stacked gold plates
  S.push(P(hull([...ring(V(0.24, 0.66, -0.01), 0.07, 0.08, 8), ...ring(V(0.27, 0.6, -0.01), 0.115, 0.115, 8),
    ...ring(V(0.285, 0.55, -0.01), 0.11, 0.11, 8)]), SW.gold, 'y', [0.52, 0.7]));
  S.push(P(hull([...ring(V(0.29, 0.555, -0.01), 0.112, 0.112, 8), ...ring(V(0.3, 0.51, -0.01), 0.1, 0.1, 8)]), SW.goldDk, 'y', [0.5, 0.56]));
  { const g = V(0.3, 0.6, 0.098), n = V(0.35, 0.25, 1).normalize(), t = V(1, 0, -0.35).normalize(), u = new THREE.Vector3().crossVectors(n, t);
    S.push(P(hull([g.clone().addScaledVector(u, 0.028), g.clone().addScaledVector(u, -0.028), g.clone().addScaledVector(t, 0.022),
      g.clone().addScaledVector(t, -0.022), g.clone().addScaledVector(n, 0.016)]), SW.ruby, 'flat')); }
  // elbow fur
  S.push(P(shard(V(0.31, 0.43, -0.03), V(0.3, -0.5, -1), 0.04, 0.07), SW.fur, 'flat'));
  S.push(P(shard(V(0.33, 0.48, -0.02), V(0.8, -0.4, -0.6), 0.035, 0.06), SW.fur, 'flat'));

  // ================= HEAD =================
  const hc0 = C.length, hs0 = S.length;
  const H = { y: 0.85, z: 0.07 };
  C.push(fur([
    ...cbox(V(0, H.y, H.z), 0.165, 0.14, 0.15, 0.06),
    ...ring(V(0, H.y + 0.165, H.z - 0.01), 0.1, 0.09, 8, 'y'),
    ...ring(V(0, H.y + 0.205, H.z - 0.01), 0.07, 0.065, 8, 'y'), V(0, H.y + 0.222, H.z - 0.01),
  ], 0.65, 1.02));
  // face mask
  const FZ = H.z + 0.17;
  C.push(P(hull([...cbox(V(0, H.y + 0.01, H.z + 0.12), 0.125, 0.07, 0.05, 0.03),
    V(0.09, H.y - 0.08, H.z + 0.13), V(-0.09, H.y - 0.08, H.z + 0.13)]), SW.skin, 'y', [H.y - 0.1, H.y + 0.08]));
  // muzzle
  C.push(P(hull([...cbox(V(0, H.y - 0.085, H.z + 0.17), 0.1, 0.065, 0.06, 0.03),
    V(0.06, H.y - 0.02, FZ - 0.02), V(-0.06, H.y - 0.02, FZ - 0.02)]), SW.skin, 'y', [H.y - 0.16, H.y]));
  const MZ = H.z + 0.23;
  // nostrils + mouth
  S.push(P(hull(plate([[-0.01, 0.006], [0.01, 0.006], [0.01, -0.006], [-0.01, -0.006]], V(0.022, H.y - 0.045, 0), MZ - 0.012, MZ + 0.003)), SW.mouth, 'flat'));
  C.push(P(hull(plate([[-0.06, 0.006], [0.06, 0.006], [0.07, -0.004], [-0.07, -0.004]], V(0, H.y - 0.105, 0), MZ - 0.01, MZ + 0.004)), SW.mouth, 'flat'));

  // downturned frown corners
  S.push(P(hull([V(0.055, H.y - 0.099, MZ - 0.01), V(0.055, H.y - 0.099, MZ + 0.004), V(0.075, H.y - 0.106, MZ - 0.01),
    V(0.09, H.y - 0.13, MZ - 0.025), V(0.08, H.y - 0.13, MZ - 0.02), V(0.07, H.y - 0.1, MZ + 0.002)]), SW.mouth, 'flat'));
  // fierce eyes
  const E = V(0.06, H.y + 0.02, 0);
  S.push(P(hull(plate([[-0.036, 0.004], [0.04, 0.03], [0.046, -0.008], [0.018, -0.034], [-0.026, -0.03], [-0.04, -0.014]],
    E, FZ - 0.012, FZ + 0.008)), SW.white, 'flat'));
  S.push(P(hull(plate([[-0.026, 0.004], [0.014, 0.018], [0.02, -0.006], [0.005, -0.028], [-0.02, -0.026], [-0.03, -0.01]],
    V(E.x - 0.004, E.y, 0), FZ + 0.004, FZ + 0.014)), SW.eye, 'flat'));
  S.push(P(hull(plate([[-0.006, -0.006], [0.006, -0.006], [0.006, 0.006], [-0.006, 0.006]],
    V(E.x + 0.004, E.y + 0.002, 0), FZ + 0.01, FZ + 0.018)), SW.white, 'flat'));
  // heavy brow ridge
  S.push(P(hull([
    V(0.0, E.y + 0.012, FZ + 0.03), V(0.0, E.y + 0.05, FZ + 0.02),
    V(0.125, E.y + 0.05, FZ - 0.0), V(0.125, E.y + 0.085, FZ - 0.02),
    V(0.0, E.y + 0.012, FZ - 0.03), V(0.0, E.y + 0.06, FZ - 0.04),
    V(0.13, E.y + 0.05, FZ - 0.06), V(0.13, E.y + 0.09, FZ - 0.07),
  ]), SW.brow, 'y', [E.y, E.y + 0.09]));

  // ears
  S.push(P(hull([...ring(V(0.17, H.y + 0.01, H.z - 0.01), 0.07, 0.065, 8, 'x').map(p => p), ...ring(V(0.2, H.y + 0.01, H.z - 0.02), 0.075, 0.07, 8, 'x')]), SW.skinDk, 'y', [H.y - 0.07, H.y + 0.08]));
  S.push(P(hull([...ring(V(0.205, H.y + 0.01, H.z - 0.01), 0.05, 0.045, 8, 'x'), ...ring(V(0.212, H.y + 0.01, H.z - 0.01), 0.045, 0.04, 8, 'x')]), SW.skin, 'flat'));

  // cheek whiskers & head fur
  S.push(P(shard(V(0.15, H.y - 0.06, H.z + 0.06), V(1, -0.4, 0.2), 0.045, 0.085), SW.fur, 'flat'));
  S.push(P(shard(V(0.13, H.y - 0.12, H.z + 0.07), V(0.8, -1, 0.3), 0.04, 0.07), SW.fur, 'flat'));
  S.push(P(shard(V(0.14, H.y - 0.11, H.z + 0.02), V(0.8, -1, 0), 0.038, 0.065), SW.fur, 'flat'));
  C.push(P(shard(V(0, H.y + 0.15, H.z - 0.11), V(0, 0.6, -1), 0.045, 0.08), SW.furDark, 'flat'));
  S.push(P(shard(V(0.07, H.y + 0.14, H.z - 0.11), V(0.5, 0.5, -1), 0.04, 0.07), SW.furDark, 'flat'));


  // back-of-head shard fur
  C.push(P(shard(V(0, H.y + 0.08, H.z - 0.14), V(0, -0.3, -1), 0.06, 0.07), SW.fur, 'flat'));
  C.push(P(shard(V(0, H.y - 0.02, H.z - 0.145), V(0, -0.5, -1), 0.06, 0.07), SW.fur, 'flat'));
  S.push(P(shard(V(0.085, H.y + 0.04, H.z - 0.14), V(0.4, -0.4, -1), 0.055, 0.065), SW.fur, 'flat'));
  S.push(P(shard(V(0.09, H.y - 0.07, H.z - 0.14), V(0.4, -0.6, -1), 0.05, 0.065), SW.fur, 'flat'));
  S.push(P(shard(V(0.15, H.y + 0.06, H.z - 0.1), V(0.7, -0.2, -1), 0.045, 0.06), SW.fur, 'flat'));
  const hc1 = C.length, hs1 = S.length;
  // ================= SHARD FUR (mantle, markings, tufts) =================
  const F = (b, d, w, l, sw = SW.fur) => S.push(P(shard(b, d, w, l), sw, 'flat'));
  const FC = (b, d, w, l, sw = SW.fur) => C.push(P(shard(b, d, w, l), sw, 'flat'));
  // dark back mantle: bold chevron marking down the spine
  FC(V(0, 0.72, -0.1), V(0, -0.6, -1), 0.07, 0.11, SW.furDark);
  FC(V(0, 0.62, -0.15), V(0, -0.7, -1), 0.07, 0.1, SW.furDark);
  FC(V(0, 0.52, -0.155), V(0, -0.8, -1), 0.06, 0.09, SW.furDark);
  F(V(0.08, 0.7, -0.11), V(0.5, -0.6, -1), 0.06, 0.1, SW.furDark);
  F(V(0.09, 0.6, -0.15), V(0.5, -0.7, -1), 0.06, 0.09, SW.furDark);
  F(V(0.15, 0.68, -0.08), V(0.9, -0.5, -0.7), 0.055, 0.09, SW.furDark);
  F(V(0.1, 0.5, -0.14), V(0.6, -0.8, -0.8), 0.05, 0.08, SW.furDark);
  // nape + shoulder fur
  F(V(0.11, H.y - 0.12, H.z - 0.1), V(0.6, -0.4, -1), 0.05, 0.08);
  FC(V(0, H.y - 0.1, H.z - 0.14), V(0, -0.3, -1), 0.055, 0.08);
  // hip fur skirt under the belt
  F(V(0.18, 0.34, 0.03), V(0.6, -1, 0.1), 0.045, 0.07);
  F(V(0.15, 0.33, -0.08), V(0.5, -1, -0.5), 0.045, 0.07);
  F(V(0.06, 0.32, -0.12), V(0.2, -1, -0.6), 0.045, 0.07);
  // forearm + upper-arm outer fur
  F(V(0.37, 0.36, 0.0), V(1, -0.6, -0.2), 0.035, 0.06);
  F(V(0.35, 0.47, -0.02), V(1, -0.5, -0.3), 0.035, 0.055);
  // thigh outer fur
  F(V(0.21, 0.27, 0.0), V(1, -0.7, 0), 0.04, 0.06);
  F(V(0.2, 0.2, -0.05), V(0.8, -0.8, -0.4), 0.035, 0.055);
  // forehead dark V marking + tuft

  // forehead fringe belongs to the head
  const hc2 = C.length, hs2 = S.length;
  FC(V(0, H.y + 0.135, H.z + 0.06), V(0, 0.3, 1), 0.05, 0.07);
  F(V(0.065, H.y + 0.135, H.z + 0.05), V(0.4, 0.3, 1), 0.045, 0.06);
  F(V(0.13, H.y + 0.12, H.z + 0.01), V(1, 0.4, 0.4), 0.045, 0.06);
  // ================= CROWN =================
  const CY = H.y + 0.15;
  C.push(P(hull([...ring(V(0, CY, H.z - 0.01), 0.1, 0.095, 10, 'y'), ...ring(V(0, CY + 0.05, H.z - 0.01), 0.11, 0.105, 10, 'y')]),
    SW.gold, 'y', [CY, CY + 0.05]));
  const pts5 = [0, 0.4 * Math.PI, 0.8 * Math.PI];
  for (const a of pts5) {
    const base = V(Math.sin(a) * 0.098, CY + 0.045, H.z - 0.01 + Math.cos(a) * 0.093);
    const g = shard(base, V(Math.sin(a) * 0.25, 1, Math.cos(a) * 0.25), 0.035, 0.06);
    if (a === 0) C.push(P(g, SW.gold, 'y', [CY, CY + 0.12])); else S.push(P(g, SW.gold, 'y', [CY, CY + 0.12]));
  }
  C.push(P(hull([V(0, CY + 0.042, H.z + 0.11), V(0.02, CY + 0.025, H.z + 0.11), V(0, CY + 0.008, H.z + 0.11),
    V(-0.02, CY + 0.025, H.z + 0.11), V(0, CY + 0.025, H.z + 0.125)]), SW.ruby, 'flat'));

  // enlarge the head (+ crown) about the neck for the sheet's big-head proportion
  const HS = 1.15, piv = V(0, 0.7, H.z);
  const scaleHead = (g) => { g.translate(-piv.x, -piv.y, -piv.z); g.scale(HS, HS, HS); g.translate(piv.x, piv.y, piv.z); };
  [...C.slice(hc0, hc1), ...C.slice(hc2)].forEach(scaleHead);
  [...S.slice(hs0, hs1), ...S.slice(hs2)].forEach(scaleHead);
  // shorten the legs slightly: compress 0.06..0.36 and drop everything above
  for (const g of [...C, ...S]) {
    const a = g.attributes.position;
    for (let i = 0; i < a.count; i++) {
      const y = a.getY(i);
      a.setY(i, y - 0.05 * Math.min(1, Math.max(0, (y - 0.06) / 0.3)));
    }
    g.computeVertexNormals();
  }
  return assemble(C, S);
}

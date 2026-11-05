// Ancient Ape King: huge dark-brown knuckle-walking gorilla king with carved stone pauldrons,
// gold crown, floating gold halo, glowing eyes, jungle vines, leaves and carved jade.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  fur:      { i: 0, top: '#76503A', bot: '#3C2619' },
  furDark:  { i: 1, top: '#5A3A28', bot: '#2E1C12' },
  face:     { i: 2, top: '#D2A57A', bot: '#A0734E' },
  chest:    { i: 3, top: '#B98C66', bot: '#8A6043' },
  skin:     { i: 4, top: '#6A5048', bot: '#3E2E2A' },
  stone:    { i: 5, top: '#C4C0B4', bot: '#8A867C' },
  groove:   { i: 6, top: '#7A766E', bot: '#55524C' },
  gold:     { i: 7, top: '#FFDD63', bot: '#D69A1E' },
  jade:     { i: 8, top: '#6FE8AE', bot: '#1F9A63' },
  rune:     { i: 9, top: '#6BFFC0', bot: '#14D38A', glow: true },
  eyeGlow:  { i: 10, top: '#FFF58A', bot: '#FFBE2E', glow: true },
  eye:      { i: 11, top: '#1A1416', bot: '#0C0A0B' },
  white:    { i: 12, top: '#FFFFFF', bot: '#F1F1F4' },
  nose:     { i: 13, top: '#3A2A26', bot: '#1A1210' },
  vine:     { i: 14, top: '#4FA83A', bot: '#2A6A22' },
  leaf:     { i: 15, top: '#86DF5A', bot: '#3C9A2E' },
  brow:     { i: 16, top: '#80573F', bot: '#4A2E1F' },
};
const SW = PALETTE;

// points of a helix wrapped around the segment a->b
function helix(a, b, r, turns, n, phase = 0, r1 = r) {
  const ax = new THREE.Vector3().subVectors(b, a);
  const d = ax.clone().normalize();
  const up = Math.abs(d.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
  const u = new THREE.Vector3().crossVectors(d, up).normalize();
  const w = new THREE.Vector3().crossVectors(u, d).normalize();
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), th = phase + t * turns * 2 * Math.PI;
    pts.push(a.clone().addScaledVector(ax, t).addScaledVector(u, Math.cos(th) * (r + (r1 - r) * t)).addScaledVector(w, Math.sin(th) * (r + (r1 - r) * t)));
  }
  return pts;
}

export function buildGeometry() {
  const C = [], S = [];
  const fur = (pts, lo = 0.0, hi = 1.0) => paint(hull(pts), SW.fur, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');
  const furSh = (b, d, w, l, fl = 0.6) => paint(shard(b, d, w, l, 4, fl), SW.furDark, 'y', [0.2, 1.1]);
  // flat diamond leaf lying in the plane facing `n`, with a fold along its midrib
  const leaf = (b, d, w, l, n = V(0, 0, 1)) => {
    const dd = d.clone().normalize(), sd = new THREE.Vector3().crossVectors(n, dd).normalize();
    const nn = new THREE.Vector3().crossVectors(dd, sd).normalize();
    const pts = [b.clone(), b.clone().addScaledVector(dd, l)];
    const mid = b.clone().addScaledVector(dd, l * 0.42);
    for (const sg of [-1, 1]) pts.push(mid.clone().addScaledVector(sd, sg * w).addScaledVector(nn, -0.01));
    pts.push(mid.clone().addScaledVector(nn, 0.012));
    return paint(hull(pts), SW.leaf, 'y', [b.y - l, b.y + l]);
  };
  const vine = (pts, r = 0.016, n = 14) => paint(tube(curveSamples(pts, n, () => r), { seg: 5 }), SW.vine, 'flat');

  // ================= TORSO (huge hunched barrel, big back hump) =================
  C.push(fur([
    ...ring(V(0, 0.42, -0.22), 0.2, 0.14, 10, 'y'),
    ...ring(V(0, 0.36, -0.12), 0.21, 0.17, 10, 'y'),
    ...ring(V(0, 0.56, -0.06), 0.27, 0.22, 10, 'y'),
    ...ring(V(0, 0.72, 0.04), 0.3, 0.2, 10, 'y'),
    ...ring(V(0, 0.765, -0.07), 0.2, 0.13, 10, 'y'),
  ], 0.3, 0.9));
  // tan chest plate (front of torso, between the arms)
  C.push(paint(hull([
    ...ring(V(0, 0.45, 0.13), 0.12, 0.05, 8, 'y'),
    ...ring(V(0, 0.62, 0.2), 0.17, 0.05, 8, 'y'),
    ...ring(V(0, 0.73, 0.21), 0.15, 0.04, 8, 'y'),
  ]), SW.chest, 'y', [0.42, 0.76]));
  // pec split groove shards (chest facets)
  S.push(paint(hull([V(0.01, 0.68, 0.22), V(0.15, 0.7, 0.2), V(0.16, 0.6, 0.2), V(0.1, 0.55, 0.205), V(0.01, 0.57, 0.22),
    V(0.03, 0.665, 0.245), V(0.13, 0.675, 0.23), V(0.12, 0.6, 0.232), V(0.03, 0.59, 0.245)]), SW.chest, 'y', [0.5, 0.74]));

  // ================= LEGS (short, thick, planted behind) =================
  S.push(fur([...ring(V(0.16, 0.46, -0.16), 0.12, 0.12, 8), ...ring(V(0.22, 0.3, -0.12), 0.11, 0.12, 8),
    ...ring(V(0.23, 0.2, -0.13), 0.085, 0.09, 8)], 0.0, 0.8));
  S.push(fur([...ring(V(0.23, 0.22, -0.13), 0.08, 0.085, 8), ...ring(V(0.225, 0.08, -0.15), 0.075, 0.075, 8)], 0.0, 0.8));
  // foot: dark-skin sole block + chunky toes + inward thumb toe
  const foot = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.04, z), 0.075, 0.04, 0.085, 0.022)), SW.skin, 'y', [0, 0.1]));
    for (const dx of [-0.03, 0.01, 0.048])
      S.push(paint(hull(cbox(V(x + dx, 0.028, z + 0.085), 0.02, 0.028, 0.028, 0.01)), SW.skin, 'y', [0, 0.08]));
    S.push(paint(hull(cbox(V(x - 0.07, 0.025, z + 0.05), 0.022, 0.025, 0.026, 0.01)), SW.skin, 'y', [0, 0.08]));
  };
  foot(0.225, -0.1);

  // ================= ARMS (huge, fists planted in front) =================
  const SH = V(0.33, 0.7, 0.06), EL = V(0.4, 0.42, 0.17), WR = V(0.38, 0.15, 0.25);
  S.push(fur([...ring(SH, 0.13, 0.13, 8, 'y'), ...ring(V(0.33, 0.78, 0.04), 0.1, 0.1, 8, 'y'),
    ...ring(EL, 0.105, 0.105, 8, 'y')], 0.2, 0.9));
  // forearm: thicker toward the top (gorilla)
  S.push(fur([...ring(EL, 0.115, 0.115, 8, 'y'), ...ring(V(0.395, 0.33, 0.2), 0.12, 0.115, 8, 'y'),
    ...ring(WR, 0.09, 0.09, 8, 'y')], 0.0, 0.8));
  // fist: knuckles planted, dark skin
  const FI = V(0.38, 0.07, 0.27);
  S.push(paint(hull(cbox(FI, 0.095, 0.07, 0.085, 0.03)), SW.skin, 'y', [0, 0.15]));
  for (const dx of [-0.06, -0.02, 0.02, 0.06])
    S.push(paint(hull(cbox(V(FI.x + dx, 0.035, FI.z + 0.075), 0.02, 0.035, 0.022, 0.009)), SW.skin, 'y', [0, 0.1]));
  S.push(paint(hull(cbox(V(FI.x - 0.085, 0.06, FI.z + 0.03), 0.022, 0.03, 0.035, 0.01)), SW.skin, 'y', [0, 0.1])); // thumb
  // gold wrist cuff with jade gem
  S.push(paint(hull([...ring(V(WR.x, 0.16, WR.z), 0.1, 0.1, 8, 'y'), ...ring(V(WR.x, 0.22, WR.z - 0.02), 0.105, 0.105, 8, 'y')]), SW.gold, 'y', [0.14, 0.24]));
  S.push(flat(hull(plate([[-0.025, 0], [0, 0.028], [0.025, 0], [0, -0.028]], V(WR.x, 0.19, 0), WR.z + 0.08, WR.z + 0.11)), SW.jade));
  S.push(furSh(V(0.48, 0.25, 0.22), V(1, -0.8, 0.1), 0.04, 0.07));
  // fur tufts: elbow & forearm
  S.push(furSh(V(0.46, 0.44, 0.1), V(0.6, -0.5, -0.8), 0.05, 0.09));
  S.push(furSh(V(0.47, 0.32, 0.18), V(1, -0.6, -0.2), 0.045, 0.08));

  // ================= STONE PAULDRONS (sloped carved slabs, 2 tiers, rim blocks, gold trim, jade, glyph) =================
  // local frame: u = outward (tilted down), v = slab normal, w = +z; slab tilts down toward the outside
  const P = V(0.39, 0.79, 0.06), TH = 0.55, cT = Math.cos(TH), sT = Math.sin(TH);
  const L = (u, v, w) => V(P.x + u * cT + v * sT, P.y - u * sT + v * cT, P.z + w);
  const slab = (u0, u1, v0, v1, w0, w1, ch = 0.015) => {
    const pts = [];
    for (const u of [u0, u1]) for (const w of [w0, w1]) {
      pts.push(L(u, v0, w), L(u, v1, w - Math.sign(w) * ch), L(u - Math.sign(u - (u0 + u1) / 2) * ch, v1, w));
    }
    return hull(pts);
  };
  const stoneY = [P.y - 0.15, P.y + 0.12];
  // gold trim lip under the bottom tier, showing past the rim blocks
  S.push(paint(slab(-0.15, 0.25, -0.07, -0.045, -0.185, 0.25, 0.012), SW.gold, 'y', [P.y - 0.2, P.y]));
  // bottom tier: broad slab
  S.push(paint(slab(-0.15, 0.2, -0.045, 0.03, -0.17, 0.2, 0.02), SW.stone, 'y', stoneY));
  // top tier: smaller stepped slab
  S.push(paint(slab(-0.12, 0.1, 0.03, 0.085, -0.12, 0.13, 0.018), SW.stone, 'y', stoneY));
  // chunky carved rim blocks jutting from the outer and front edges, with carved gaps between
  for (const w of [-0.11, 0.0, 0.11])
    S.push(paint(slab(0.19, 0.235, -0.05, 0.045, w - 0.04, w + 0.04, 0.012), SW.stone, 'y', stoneY));
  for (const u of [-0.08, 0.04])
    S.push(paint(slab(u - 0.045, u + 0.045, -0.05, 0.045, 0.19, 0.235, 0.012), SW.stone, 'y', stoneY));
  S.push(paint(slab(0.15, 0.235, -0.05, 0.045, 0.15, 0.235, 0.012), SW.stone, 'y', stoneY)); // corner block
  // dark carved groove line across the bottom tier top, around the top tier
  S.push(flat(slab(-0.165, 0.125, 0.026, 0.036, -0.145, 0.155, 0.006), SW.groove));
  // jade gem on the top tier's outer slope, in a gold setting
  S.push(paint(hull([L(0.1, 0.02, -0.04), L(0.1, 0.02, 0.04), L(0.1, 0.07, 0), L(0.1, -0.0, 0),
    L(0.13, 0.03, -0.022), L(0.13, 0.03, 0.022), L(0.12, 0.06, 0), L(0.13, 0.015, 0)]), SW.jade, 'y', [P.y - 0.06, P.y + 0.06]));
  // glowing stepped-diamond glyph on the top tier front face, set in a dark carved square
  const box3 = (u0, u1, v0, v1, w0, w1) => { const pts = []; for (const u of [u0, u1]) for (const v of [v0, v1]) for (const w of [w0, w1]) pts.push(L(u, v, w)); return hull(pts); };
  S.push(flat(box3(-0.065, 0.045, 0.034, 0.081, 0.118, 0.137), SW.groove));
  for (const [dv, hw] of [[-0.018, 0.012], [-0.009, 0.026], [0, 0.04], [0.009, 0.026], [0.018, 0.012]])
    S.push(flat(box3(-0.01 - hw, -0.01 + hw, 0.0575 + dv - 0.0045, 0.0575 + dv + 0.0045, 0.125, 0.143), SW.rune));
  // small jade gem on the top tier centre top
  S.push(paint(hull([L(-0.03, 0.08, -0.03), L(-0.03, 0.08, 0.03), L(0.03, 0.08, -0.03), L(0.03, 0.08, 0.03), L(0, 0.11, 0)]), SW.jade, 'y', [P.y, P.y + 0.12]));

  // ================= HEAD =================
  const c0 = C.length, s0 = S.length;
  const H = V(0, 0.88, 0.25);
  C.push(fur([
    ...cbox(H, 0.18, 0.15, 0.16, 0.06),
    ...ring(V(0, H.y + 0.18, H.z - 0.04), 0.11, 0.1, 8, 'y'), ...ring(V(0, H.y + 0.205, H.z - 0.04), 0.07, 0.06, 8, 'y'),   // crest dome
    V(0.2, H.y - 0.06, H.z + 0.02), V(-0.2, H.y - 0.06, H.z + 0.02),
  ], 0.6, 1.1));
  const FZ = H.z + 0.16;
  // tan face plate
  C.push(paint(hull([
    ...plate([[-0.13, 0.08], [0.13, 0.08], [0.15, 0.0], [0.12, -0.12], [-0.12, -0.12], [-0.15, 0.0]], V(0, H.y, 0), FZ - 0.06, FZ + 0.008),
  ]), SW.face, 'y', [H.y - 0.12, H.y + 0.1]));
  // muzzle
  C.push(paint(hull([...cbox(V(0, H.y - 0.085, FZ + 0.04), 0.11, 0.07, 0.06, 0.03),
    V(0.06, H.y - 0.01, FZ + 0.0), V(-0.06, H.y - 0.01, FZ + 0.0)]), SW.face, 'y', [H.y - 0.16, H.y]));
  // nostrils & mouth
  S.push(flat(hull(plate([[-0.016, 0.006], [0.0, 0.016], [0.018, 0.008], [0.016, -0.01], [-0.012, -0.012]],
    V(0.03, H.y - 0.045, 0), FZ + 0.093, FZ + 0.105)), SW.nose));
  C.push(flat(hull(cbox(V(0, H.y - 0.12, FZ + 0.1), 0.06, 0.006, 0.004, 0.002)), SW.nose));

  // glowing fierce eyes
  const E = V(0.075, H.y + 0.035, 0), k = 1.1;
  const sc = (pts) => pts.map(([u, v]) => [u * k, v * k]);
  S.push(flat(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.01, FZ + 0.016)), SW.eyeGlow));
  S.push(flat(hull(plate(sc([[-0.024, 0.004], [0.012, 0.016], [0.018, -0.006], [0.004, -0.026], [-0.018, -0.024], [-0.027, -0.01]]),
    V(E.x - 0.004, E.y - 0.002, 0), FZ + 0.01, FZ + 0.022)), SW.eye));
  S.push(flat(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.004, E.y + 0.002, 0), FZ + 0.018, FZ + 0.026)), SW.white));
  // heavy brow ridge
  S.push(paint(hull([
    V(0.0, E.y + 0.01, FZ + 0.06), V(0.0, E.y + 0.065, FZ + 0.045),
    V(0.175, E.y + 0.055, FZ + 0.02), V(0.175, E.y + 0.105, FZ - 0.0),
    V(0.0, E.y + 0.012, FZ - 0.03), V(0.0, E.y + 0.07, FZ - 0.04),
    V(0.17, E.y + 0.06, FZ - 0.06), V(0.17, E.y + 0.1, FZ - 0.07),
  ]), SW.brow, 'y'));
  // ears
  S.push(paint(hull(cbox(V(0.19, H.y + 0.0, H.z - 0.03), 0.02, 0.04, 0.035, 0.012)), SW.skin, 'flat'));
  // head fur shards
  S.push(furSh(V(0.16, H.y + 0.09, H.z - 0.05), V(0.9, 0.5, -0.3), 0.045, 0.07));
  S.push(furSh(V(0.19, H.y - 0.08, H.z), V(1, -0.6, -0.2), 0.045, 0.07));

  // ================= GOLD CROWN (band, points, jade gems) =================
  const CR = V(0, H.y + 0.15, H.z - 0.02);
  // band built from 10 segments so it is an open ring (fur crest shows through the top)
  for (let kk = 0; kk < 10; kk++) {
    const a0 = (2 * Math.PI * (kk - 0.5)) / 10, a1 = (2 * Math.PI * (kk + 0.5)) / 10;
    const pts = [];
    for (const a of [a0, a1]) for (const [r, y] of [[0.155, CR.y + 0.065], [0.15, CR.y], [0.12, CR.y], [0.125, CR.y + 0.065]])
      pts.push(V(Math.cos(a) * r * 1.0, y, CR.z + Math.sin(a) * r * 0.9));
    const g = paint(hull(pts), SW.gold, 'y', [CR.y, CR.y + 0.07]);
    const mid = Math.cos((a0 + a1) / 2);
    if (Math.abs(mid) < 1e-6) C.push(g); else if (mid > 0) S.push(g);
  }
  const crownPt = (a, w, h) => {
    const rx = 0.15, rz = 0.135, y0 = CR.y + 0.055;
    const at = (aa, r = 1) => V(Math.cos(aa) * rx * r, y0, CR.z + Math.sin(aa) * rz * r);
    const da = w / 0.14;
    const pts = [at(a - da, 0.9), at(a - da, 1.04), at(a + da, 0.9), at(a + da, 1.04)];
    const tip = at(a, 0.97); tip.y += h; const tip2 = at(a, 0.88); tip2.y += h * 0.9;
    pts.push(tip, tip2);
    return paint(hull(pts), SW.gold, 'y', [CR.y, CR.y + 0.18]);
  };
  C.push(crownPt(Math.PI / 2, 0.05, 0.12));
  C.push(crownPt(-Math.PI / 2, 0.045, 0.09));
  for (const [a, w, h] of [[Math.PI / 2 - 0.75, 0.045, 0.095], [0.1, 0.045, 0.085], [-0.75, 0.045, 0.085]]) S.push(crownPt(a, w, h));
  C.push(flat(hull(plate([[-0.025, 0], [0, 0.03], [0.025, 0], [0, -0.025]], V(0, CR.y + 0.03, 0), CR.z + 0.13, CR.z + 0.155)), SW.jade));
  S.push(flat(hull(plate([[-0.016, 0], [0, 0.02], [0.016, 0], [0, -0.02]], V(0.085, CR.y + 0.03, 0), CR.z + 0.105, CR.z + 0.13)), SW.jade));

  // scale the whole head group (head, face, crown, halo) up for a bigger, bolder head
  const HK = 1.22;
  for (const [arr, from] of [[C, c0], [S, s0]]) for (let q = from; q < arr.length; q++) {
    arr[q].translate(-H.x, -H.y, -H.z); arr[q].scale(HK, HK, HK); arr[q].translate(H.x, H.y + 0.01, H.z + 0.04);
  }

  // ================= GOLD HALO (clean ring close behind the skull, centred on the head) =================
  const HC = V(0, 1.075, 0.005), HR = 0.27, NSEG = 20;
  for (let kk = 0; kk < NSEG; kk++) {
    const a0 = (2 * Math.PI * (kk - 0.5)) / NSEG, a1 = (2 * Math.PI * (kk + 0.5)) / NSEG;
    const pts = [];
    for (const a of [a0, a1]) {
      const c = V(Math.cos(a) * HR, HC.y + Math.sin(a) * HR, HC.z), r = V(Math.cos(a), Math.sin(a), 0);
      for (const [dr, dz] of [[-0.026, -0.018], [0.026, -0.018], [0.026, 0.018], [-0.026, 0.018]])
        pts.push(c.clone().addScaledVector(r, dr).add(V(0, 0, dz)));
    }
    const g = paint(hull(pts), SW.gold, 'y', [HC.y - HR, HC.y + HR]);
    const mx = Math.cos(kk * 2 * Math.PI / NSEG);
    if (Math.abs(mx) < 1e-6) C.push(g); else if (mx > 0) S.push(g);
  }
  // jade gems set into the ring's front face
  for (const deg of [90, 30, -30]) {
    const a = deg * Math.PI / 180, c = V(Math.cos(a) * HR, HC.y + Math.sin(a) * HR, HC.z);
    const gem = paint(hull(plate([[-0.022, 0], [0, 0.026], [0.022, 0], [0, -0.026]], V(c.x, c.y, 0), HC.z + 0.008, HC.z + 0.026)), SW.jade, 'y', [c.y - 0.03, c.y + 0.03]);
    (deg === 90 ? C : S).push(gem);
  }

  // ================= JADE AMULET on a vine necklace =================
  C.push(paint(tube(curveSamples([V(0.2, 0.74, 0.18), V(0.1, 0.62, 0.25), V(0, 0.58, 0.262), V(-0.1, 0.62, 0.25), V(-0.2, 0.74, 0.18)], 12, () => 0.014), { seg: 5 }), SW.vine, 'flat'));
  C.push(paint(hull(plate([[-0.05, 0.03], [0.05, 0.03], [0.06, -0.01], [0, -0.07], [-0.06, -0.01]], V(0, 0.55, 0), 0.25, 0.28)), SW.gold, 'y', [0.48, 0.58]));
  C.push(paint(hull(plate([[-0.038, 0.022], [0.038, 0.022], [0.046, -0.008], [0, -0.055], [-0.046, -0.008]], V(0, 0.55, 0), 0.27, 0.295)), SW.jade, 'y', [0.49, 0.58]));
  C.push(flat(hull(plate([[-0.012, 0.0], [0, 0.012], [0.012, 0], [0, -0.022]], V(0, 0.55, 0), 0.29, 0.302)), SW.rune));

  // ================= VINES & LEAVES (draped over pauldron, wrapped round forearm) =================
  // forearm wraps: two tilted closed rings joined by a short diagonal (continuous, no stubs)
  const fa = V(0.4, 0.42, 0.17), fb = WR.clone(), fd = new THREE.Vector3().subVectors(fb, fa).normalize();
  const wrapRing = (t, r, tilt) => {
    const c = fa.clone().lerp(fb, t);
    const n = fd.clone().applyAxisAngle(V(0, 0, 1), tilt).applyAxisAngle(V(1, 0, 0), tilt * 0.6).normalize();
    const u = new THREE.Vector3().crossVectors(n, V(0, 0, 1)).normalize(), w = new THREE.Vector3().crossVectors(u, n).normalize();
    const at = (a) => c.clone().addScaledVector(u, Math.cos(a) * r).addScaledVector(w, Math.sin(a) * r);
    const NS = 12;
    for (let kk = 0; kk < NS; kk++) {
      const pts = [];
      for (const a of [(2 * Math.PI * kk) / NS, (2 * Math.PI * (kk + 1)) / NS]) {
        const p = at(a), rad = p.clone().sub(c).normalize();
        for (const [dr, dn] of [[-0.015, -0.015], [0.015, -0.015], [0.015, 0.015], [-0.015, 0.015]])
          pts.push(p.clone().addScaledVector(rad, dr).addScaledVector(n, dn));
      }
      S.push(flat(hull(pts), SW.vine));
    }
    return { at, c };
  };
  const R1 = wrapRing(0.32, 0.126, 0.3), R2 = wrapRing(0.66, 0.112, -0.28);
  // pick ring points facing outward-front for the diagonal joint
  const best = (R, dir) => { let bp = null, bs = -1e9; for (let kk = 0; kk < 24; kk++) { const p = R.at(kk * Math.PI / 12); const sc = p.clone().sub(R.c).dot(dir); if (sc > bs) { bs = sc; bp = p; } } return bp; };
  const j1 = best(R1, V(0.9, 0, 0.45).normalize()), j2 = best(R2, V(0.2, 0, 1).normalize());
  const jm = j1.clone().add(j2).multiplyScalar(0.5); jm.add(jm.clone().sub(fa.clone().lerp(fb, 0.48)).setY(0).normalize().multiplyScalar(0.012));
  S.push(vine([j1, jm, j2], 0.015, 6));
  S.push(leaf(best(R1, V(1, 0, -0.3).normalize()), V(1, -0.2, -0.3), 0.04, 0.09, V(0, 0, 1)));
  S.push(leaf(best(R2, V(-0.5, 0, 1).normalize()), V(-0.6, -0.5, 0.6), 0.038, 0.085, V(0, 0, 1)));
  // vine draped over the pauldron (behind the top tier) and down the outer arm
  S.push(vine([L(-0.16, 0.045, -0.15), L(0.0, 0.048, -0.15), L(0.17, 0.045, -0.12), L(0.24, -0.02, -0.08), V(0.5, 0.62, 0.08), V(0.49, 0.53, 0.11)], 0.016, 14));
  S.push(leaf(V(0.49, 0.53, 0.11), V(0.3, -1, 0.4), 0.045, 0.11, V(1, 0, 0.3)));
  S.push(leaf(L(0.05, 0.05, -0.15), V(-0.1, 0.7, -1), 0.04, 0.09, V(0, 1, 0.3)));
  S.push(leaf(V(0.505, 0.63, 0.08), V(1, -0.3, 0.5), 0.04, 0.09, V(0, 0.3, 1)));

  // ================= BACK FUR (shards on the hump) =================
  C.push(furSh(V(0, 0.75, -0.15), V(0, 0.1, -1), 0.07, 0.11));
  S.push(furSh(V(0.14, 0.75, -0.12), V(0.4, 0.1, -1), 0.065, 0.11));
  S.push(furSh(V(0.2, 0.6, -0.2), V(0.6, -0.3, -1), 0.06, 0.1));
  C.push(furSh(V(0, 0.6, -0.24), V(0, -0.3, -1), 0.065, 0.1));

  C.push(paint(tube(curveSamples([V(0.25, 0.84, -0.1), V(0.13, 0.77, -0.18), V(0, 0.745, -0.2), V(-0.13, 0.77, -0.18), V(-0.25, 0.84, -0.1)], 12, () => 0.015), { seg: 5 }), SW.vine, 'flat'));
  C.push(leaf(V(0, 0.745, -0.205), V(0, -1, -0.4), 0.045, 0.1, V(0, 0.3, -1)));
  S.push(leaf(V(0.13, 0.77, -0.185), V(0.5, -1, -0.4), 0.04, 0.085, V(0, 0.3, -1)));
  S.push(furSh(V(0.22, 0.45, -0.24), V(0.5, -0.5, -1), 0.055, 0.09));
  S.push(furSh(V(0.08, 0.48, -0.3), V(0.2, -0.6, -1), 0.055, 0.09));

  return assemble(C, S);
}

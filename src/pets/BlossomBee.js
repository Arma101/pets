// Blossom Bee (GODLY, Round 7 - Blossom Brawl): chunky faceted golden bumblebee with black stripe bands,
// shard fur ruff, cherry blossoms, jade gems, a silk ribbon, ornate gold armour with glowing runes,
// shimmering faceted wings and a gold stinger. Six short thick legs, all planted.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  body:   { i: 0, top: '#FFC83A', bot: '#E0861A' },
  black:  { i: 1, top: '#3C3340', bot: '#18131C' },
  fur:    { i: 2, top: '#FFE89A', bot: '#F2B23C' },
  gold:   { i: 3, top: '#FFF4B8', bot: '#D29A14' },
  white:  { i: 4, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:    { i: 5, top: '#1A1416', bot: '#0C0A0B' },
  jade:   { i: 6, top: '#7EE8B0', bot: '#1E8F5E' },
  rune:   { i: 7, top: '#A8FFF0', bot: '#1FE0C4', glow: true },
  petal:  { i: 8, top: '#FFE6F0', bot: '#FF8EBE' },
  bloomC: { i: 9, top: '#FF5FA0', bot: '#D61F6E' },
  silk:   { i: 10, top: '#FF6F8E', bot: '#C81E4E' },
  wingA:  { i: 11, top: '#C8ECFF', bot: '#62B0FF' },
  wingB:  { i: 12, top: '#FFD2EE', bot: '#FF7CC6' },
  muzzle: { i: 13, top: '#FFE7A8', bot: '#F0B848' },
  mouth:  { i: 14, top: '#4A2414', bot: '#2E140A' },
  goldT:  { i: 15, top: '#D29A14', bot: '#FFF4B8' },
  armor:  { i: 16, top: '#FFE27A', bot: '#C98A12' },
  trim:   { i: 17, top: '#FFFBE6', bot: '#FFE590' },
};
const P = PALETTE;

// helpers ------------------------------------------------------------
const nrm = (v) => v.clone().normalize();
function basis(dir) {
  const d = nrm(dir);
  const up = Math.abs(d.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
  const a = new THREE.Vector3().crossVectors(d, up).normalize();
  const b = new THREE.Vector3().crossVectors(a, d).normalize();
  return [d, a, b];
}
// ring of n points around c, perpendicular to dir
function dring(c, dir, rA, rB, n, phase = Math.PI / n) {
  const [, a, b] = basis(dir);
  const pts = [];
  for (let k = 0; k < n; k++) {
    const t = phase + (2 * Math.PI * k) / n;
    pts.push(c.clone().addScaledVector(a, Math.cos(t) * rA).addScaledVector(b, Math.sin(t) * rB));
  }
  return pts;
}
// limb segment: hull of two rings
const limb = (p0, p1, r0, r1, n = 7) => {
  const d = new THREE.Vector3().subVectors(p1, p0);
  return hull([...dring(p0, d, r0, r0, n), ...dring(p1, d, r1, r1, n)]);
};

export function buildGeometry() {
  const C = [], S = [];
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= ABDOMEN (striped bands: gold / black) =================
  const AB = [
    { z: 0.0, r: 0.14, y: 0.42 },
    { z: -0.07, r: 0.21, y: 0.425 },
    { z: -0.17, r: 0.25, y: 0.425 },
    { z: -0.28, r: 0.26, y: 0.42 },
    { z: -0.38, r: 0.235, y: 0.41 },
    { z: -0.465, r: 0.18, y: 0.4 },
    { z: -0.525, r: 0.11, y: 0.39 },
    { z: -0.56, r: 0.05, y: 0.388 },
  ];
  const abRing = (s, k = 1) => ring(V(0, s.y, s.z), s.r * k, s.r * 0.94 * k, 10, 'z', Math.PI / 10);
  const bandSw = [P.body, P.black, P.body, P.black, P.body, P.black, P.black];
  for (let i = 0; i < AB.length - 1; i++) {
    const k = bandSw[i] === P.black ? 1.025 : 1.0; // black bands bulge a hair -> crisp ridges
    C.push(paint(hull([...abRing(AB[i], k), ...abRing(AB[i + 1], k)]), bandSw[i], 'y', [0.17, 0.66]));
  }
  // stinger
  C.push(paint(hull([...ring(V(0, 0.388, -0.55), 0.045, 0.04, 6, 'z'), V(0, 0.37, -0.69)]), P.goldT, 'y', [0.35, 0.43]));

  // ================= THORAX =================
  C.push(paint(hull([
    ...ring(V(0, 0.43, 0.2), 0.12, 0.12, 10, 'z'),
    ...ring(V(0, 0.43, 0.12), 0.185, 0.18, 10, 'z'),
    ...ring(V(0, 0.43, -0.02), 0.19, 0.18, 10, 'z'),
    ...ring(V(0, 0.43, -0.08), 0.13, 0.13, 10, 'z'),
  ]), P.body, 'y', [0.22, 0.62]));

  // ================= LEGS (6 short thick, black with gold greaves + claws) =================
  const leg = (hip, knee, ankle) => {
    S.push(paint(limb(hip, knee, 0.058, 0.055), P.black, 'y', [0.0, 0.5]));
    S.push(paint(blob(0, knee, V(0.062, 0.062, 0.062)), P.black, 'y', [0.0, 0.5]));
    S.push(paint(limb(knee, ankle, 0.054, 0.05), P.black, 'y', [0.0, 0.5]));
    // gold greave on the shin
    const m = knee.clone().lerp(ankle, 0.45), d = new THREE.Vector3().subVectors(ankle, knee);
    S.push(paint(hull([...dring(m.clone().addScaledVector(nrm(d), -0.04), d, 0.064, 0.064, 7),
      ...dring(m.clone().addScaledVector(nrm(d), 0.04), d, 0.06, 0.06, 7)]), P.armor, 'y', [0.05, 0.3]));
    // foot: chunky black pad + 2 gold claws
    const f = V(ankle.x, 0, ankle.z);
    S.push(paint(hull(cbox(V(f.x, 0.035, f.z + 0.01), 0.062, 0.035, 0.068, 0.018)), P.black, 'y', [0, 0.12]));
    for (const dx of [-0.025, 0.025]) {
      const b = V(f.x + dx * 1.2, 0, f.z + 0.065);
      S.push(flat(hull([V(b.x - 0.02, 0, b.z - 0.02), V(b.x + 0.02, 0, b.z - 0.02), V(b.x - 0.017, 0.042, b.z - 0.02),
        V(b.x + 0.017, 0.042, b.z - 0.02), V(b.x, 0.045, b.z), V(b.x + dx * 0.4, 0, b.z + 0.05)]), P.gold));
    }
  };
  const nC0 = C.length, nS0 = S.length;
  leg(V(0.1, 0.31, 0.16), V(0.215, 0.26, 0.2), V(0.235, 0.075, 0.25));
  leg(V(0.12, 0.3, 0.03), V(0.25, 0.25, 0.02), V(0.28, 0.075, 0.015));
  leg(V(0.1, 0.31, -0.08), V(0.225, 0.26, -0.13), V(0.25, 0.075, -0.21));
  const nC1 = C.length, nS1 = S.length;

  // ================= HEAD =================
  const H = { y: 0.66, z: 0.28 };
  C.push(paint(hull([
    ...cbox(V(0, H.y, H.z), 0.2, 0.15, 0.145, 0.065),
    ...ring(V(0, H.y + 0.17, H.z - 0.01), 0.12, 0.095, 8, 'y'),
    V(0.215, H.y - 0.06, H.z + 0.05), V(-0.215, H.y - 0.06, H.z + 0.05),
  ]), P.body, 'y', [0.5, 0.86]));
  const FZ = H.z + 0.145;

  // muzzle + mandibles + mouth
  // lighter lower-face plate (flush mask, not a snout), mouth, small gold mandibles
  C.push(paint(hull(plate([[-0.075, 0.0], [-0.04, 0.03], [0.04, 0.03], [0.075, 0.0], [0.05, -0.06], [-0.05, -0.06]],
    V(0, H.y - 0.06, 0), FZ - 0.03, FZ + 0.008)), P.muzzle, 'y', [H.y - 0.13, H.y - 0.02]));
  C.push(flat(hull(cbox(V(0, H.y - 0.085, FZ + 0.01), 0.03, 0.006, 0.006, 0.002)), P.mouth));
  S.push(flat(hull([V(0.03, H.y - 0.105, FZ + 0.0), V(0.06, H.y - 0.1, FZ - 0.005), V(0.055, H.y - 0.11, FZ - 0.03),
    V(0.025, H.y - 0.14, FZ + 0.012), V(0.045, H.y - 0.135, FZ - 0.01)]), P.gold));

  // fierce eyes
  const E = V(0.088, H.y + 0.025, 0);
  S.push(flat(hull(plate([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]],
    E, FZ - 0.01, FZ + 0.012)), P.white));
  S.push(flat(hull(plate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]],
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), P.eye));
  S.push(flat(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.014, FZ + 0.021)), P.white));
  // heavy black brow
  S.push(paint(hull([
    V(0.028, E.y + 0.012, FZ + 0.03), V(0.03, E.y + 0.05, FZ + 0.02),
    V(0.15, E.y + 0.05, FZ - 0.01), V(0.15, E.y + 0.088, FZ - 0.025),
    V(0.028, E.y + 0.012, FZ - 0.03), V(0.03, E.y + 0.06, FZ - 0.04),
    V(0.15, E.y + 0.05, FZ - 0.06), V(0.15, E.y + 0.09, FZ - 0.07),
  ]), P.black, 'y'));

  // forehead gold circlet with jade gem + rune
  const CIRC = [[-0.06, 0.0], [0.06, 0.0], [0.03, 0.05], [0, 0.065], [-0.03, 0.05]];
  C.push(paint(hull(plate(CIRC.map(([u, v]) => [u * 1.3, v * 1.3 - 0.01]), V(0, E.y + 0.07, 0), FZ - 0.05, FZ - 0.012)), P.trim, 'y', [E.y + 0.05, E.y + 0.15]));
  C.push(paint(hull(plate(CIRC, V(0, E.y + 0.07, 0), FZ - 0.05, FZ + 0.0)), P.armor, 'y', [E.y + 0.06, E.y + 0.14]));
  C.push(flat(hull(plate([[-0.02, 0], [0, -0.022], [0.02, 0], [0, 0.022]], V(0, E.y + 0.1, 0), FZ - 0.02, FZ + 0.012)), P.jade));
  // crown on the dome
  const CR = V(0, H.y + 0.165, H.z - 0.01);
  C.push(paint(hull([...ring(CR, 0.105, 0.085, 8, 'y'), ...ring(V(0, CR.y + 0.04, CR.z), 0.11, 0.09, 8, 'y')]), P.gold, 'y', [CR.y, CR.y + 0.05]));
  C.push(paint(hull([V(-0.03, CR.y + 0.03, CR.z + 0.08), V(0.03, CR.y + 0.03, CR.z + 0.08), V(0, CR.y + 0.03, CR.z + 0.06),
    V(0, CR.y + 0.13, CR.z + 0.075), V(-0.02, CR.y + 0.03, CR.z + 0.1), V(0.02, CR.y + 0.03, CR.z + 0.1)]), P.gold, 'y', [CR.y, CR.y + 0.13]));
  for (const [x, z, h] of [[0.07, 0.055, 0.09], [0.098, -0.02, 0.07], [0.06, -0.075, 0.07]])
    S.push(paint(hull([V(x - 0.022, CR.y + 0.03, CR.z + z), V(x + 0.022, CR.y + 0.03, CR.z + z), V(x, CR.y + 0.03, CR.z + z - 0.02),
      V(x, CR.y + 0.03, CR.z + z + 0.02), V(x, CR.y + 0.03 + h, CR.z + z)]), P.gold, 'y', [CR.y, CR.y + 0.12]));
  C.push(flat(blob(0, V(0, CR.y + 0.05, CR.z), V(0.045, 0.03, 0.045)), P.jade));
  C.push(flat(blob(0, V(0, CR.y + 0.025, CR.z + 0.09), V(0.024, 0.024, 0.016)), P.rune));

  // antennae: black, elbowed, jade bead tips
  S.push(paint(tube(curveSamples([V(0.07, H.y + 0.15, H.z + 0.05), V(0.1, H.y + 0.26, H.z + 0.06),
    V(0.14, H.y + 0.33, H.z + 0.1), V(0.18, H.y + 0.35, H.z + 0.17)], 6, (t) => 0.022 - 0.006 * t),
  { seg: 6, capEnd: 0.01 }), P.black, 'len'));
  S.push(flat(blob(0, V(0.185, H.y + 0.352, H.z + 0.18), V(0.032, 0.032, 0.032)), P.jade));

  // head fur tufts (cheeks)
  S.push(paint(shard(V(0.19, H.y - 0.06, H.z + 0.04), V(1, -0.5, 0.2), 0.045, 0.07), P.fur, 'flat'));
  S.push(paint(shard(V(0.18, H.y - 0.1, H.z - 0.04), V(0.8, -0.9, -0.2), 0.04, 0.065), P.fur, 'flat'));

  // ================= FUR RUFF (collar of shards between head and thorax) =================
  const ruff = [
    [0.0, 0.5, 0.31, V(0, -0.8, 1), 0.06, 0.1, true],
    [0.07, 0.48, 0.3, V(0.3, -0.9, 1), 0.055, 0.1],
    [0.13, 0.5, 0.26, V(0.8, -0.7, 0.6), 0.055, 0.1],
    [0.18, 0.53, 0.2, V(1, -0.5, 0.2), 0.055, 0.1],
    [0.19, 0.56, 0.12, V(1, -0.3, -0.3), 0.055, 0.1],
    [0.16, 0.6, 0.06, V(0.8, 0.1, -0.7), 0.055, 0.09],
    [0.08, 0.64, 0.05, V(0.4, 0.4, -1), 0.055, 0.09],
    [0.0, 0.66, 0.05, V(0, 0.5, -1), 0.055, 0.09, true],
    [0.05, 0.4, 0.3, V(0.2, -1, 0.5), 0.05, 0.09],
    [0.0, 0.39, 0.29, V(0, -1, 0.4), 0.05, 0.08, true],
    [0.15, 0.42, 0.24, V(0.6, -1, 0.4), 0.05, 0.08],
  ];
  for (const [x, y, z, d, w, l, ctr] of ruff) (ctr ? C : S).push(paint(shard(V(x, y, z), d, w, l), P.fur, 'flat'));
  // thorax side fuzz
  S.push(paint(shard(V(0.18, 0.4, 0.0), V(1, -0.4, -0.3), 0.05, 0.07), P.fur, 'flat'));
  S.push(paint(shard(V(0.17, 0.36, 0.12), V(1, -0.6, 0.3), 0.045, 0.065), P.fur, 'flat'));

  // abdomen surface helper (pre-drop coordinates)
  const abAt = (z) => {
    for (let i = 0; i < AB.length - 1; i++) if (z <= AB[i].z && z >= AB[i + 1].z) {
      const t = (AB[i].z - z) / (AB[i].z - AB[i + 1].z);
      return { r: AB[i].r + (AB[i + 1].r - AB[i].r) * t, y: AB[i].y + (AB[i + 1].y - AB[i].y) * t };
    }
    return AB[0];
  };
  const abPt = (ang, z, k = 1, off = 0) => {
    const q = abAt(z), n = nrm(V(Math.cos(ang), Math.sin(ang) * 0.94, 0));
    return V(Math.cos(ang) * q.r * k, q.y + Math.sin(ang) * q.r * 0.94 * k, z).addScaledVector(n, off);
  };

  // ---- RUNE GLYPHS: strokes in a local 2D frame (u, v), embedded through the surface ----
  // F(u, v, depth) -> world point. Each stroke is a thin box (8-point hull).
  const HW = 0.0062;
  const drawGlyph = (list, F, strokes, sc) => {
    for (const [u0, v0, u1, v1, wMul = 1] of strokes) {
      const du = u1 - u0, dv = v1 - v0, L = Math.hypot(du, dv) || 1;
      const pu = (-dv / L) * HW * wMul, pv = (du / L) * HW * wMul;
      const eu = (du / L) * HW * 0.6, ev = (dv / L) * HW * 0.6; // small overlap at the ends
      const pts = [];
      const [su, sv] = Array.isArray(sc) ? sc : [sc, sc];
      for (const [uu, vv, e] of [[u0 * su, v0 * sv, -1], [u1 * su, v1 * sv, 1]])
        for (const sgn of [-1, 1]) for (const dpt of [-0.011, 0.008])
          pts.push(F(uu + e * eu + sgn * pu, vv + e * ev + sgn * pv, dpt));
      list.push(paint(hull(pts), P.rune, 'flat'));
    }
  };
  const HEX = [];
  for (let k = 0; k < 6; k++) {
    const t0 = (Math.PI / 3) * k + Math.PI / 6, t1 = t0 + Math.PI / 3;
    HEX.push([Math.cos(t0), Math.sin(t0), Math.cos(t1), Math.sin(t1)]);
  }
  const RUNE = {
    diamond: [[0, 1, 1, 0], [1, 0, 0, -1], [0, -1, -1, 0], [-1, 0, 0, 1], [-1.3, 0, 1.3, 0], [0, -1.25, 0, 1.25]],
    trident: [[0, -1.25, 0, 1.25], [-0.85, 0.05, 0.85, 0.05], [-0.85, 0.05, -0.85, 1.05], [0.85, 0.05, 0.85, 1.05]],
    circle: [...HEX, [-0.12, 0, 0.12, 0, 2.6]],
  };
  // on the abdomen: u runs around the body (radians * r), v runs along z
  // upright=true (flank runes): glyph 'up' runs around the body toward the back, glyph 'across' runs along z
  const abGlyph = (list, ang, zc, name, sc, k = 1.025, upright = false) => {
    const q = abAt(zc), r = q.r * k;
    drawGlyph(list, upright ? (u, v, d) => abPt(ang + v / r, zc - u, k, d) : (u, v, d) => abPt(ang + u / r, zc + v, k, d), RUNE[name], sc);
  };
  // on a flat surface: centre c, normal n, axes U (u) and W (v)
  const flatGlyph = (list, c, n, U, W, name, sc) =>
    drawGlyph(list, (u, v, d) => c.clone().addScaledVector(U, u).addScaledVector(W, v).addScaledVector(n, d), RUNE[name], sc);

  // black band 1 (z -0.07..-0.17) and black band 3 (z -0.28..-0.38): matching rune sets
  abGlyph(C, Math.PI / 2, -0.12, 'diamond', [0.042, 0.034]);
  abGlyph(S, 0.3, -0.12, 'trident', [0.034, 0.044], 1.025, true);
  abGlyph(C, Math.PI / 2, -0.33, 'trident', [0.042, 0.034]);
  abGlyph(S, 0.3, -0.33, 'diamond', [0.034, 0.044], 1.025, true);
  abGlyph(S, -0.38, -0.33, 'circle', [0.036, 0.034]);
  abGlyph(S, -0.38, -0.12, 'circle', [0.036, 0.034]);
  abGlyph(C, Math.PI / 2, -0.495, 'circle', [0.024, 0.022]);

  // ================= ORNATE ARMOUR: rich gold panels framed by a bright trim, with runes =================
  // thorax saddle: bright trim base + raised rich-gold panel + circle rune
  C.push(paint(hull([
    ...ring(V(0, 0.57, 0.1), 0.13, 0.07, 8, 'y'), ...ring(V(0, 0.625, 0.03), 0.12, 0.08, 8, 'y'),
    ...ring(V(0, 0.57, -0.06), 0.12, 0.06, 8, 'y'),
  ]), P.trim, 'y', [0.55, 0.64]));
  C.push(paint(hull([
    ...ring(V(0, 0.585, 0.09), 0.105, 0.055, 8, 'y'), ...ring(V(0, 0.638, 0.03), 0.1, 0.066, 8, 'y'),
    ...ring(V(0, 0.585, -0.045), 0.1, 0.045, 8, 'y'),
  ]), P.armor, 'y', [0.57, 0.645]));
  flatGlyph(C, V(0, 0.638, 0.03), V(0, 1, 0), V(1, 0, 0), V(0, 0, -1), 'circle', 0.036);
  // pauldrons: trim slab, raised armour panel, jade gem
  S.push(paint(hull([...ring(V(0.17, 0.5, 0.1), 0.06, 0.07, 6, 'x'), ...ring(V(0.205, 0.45, 0.1), 0.055, 0.07, 6, 'x'),
    V(0.12, 0.55, 0.1)]), P.trim, 'y', [0.4, 0.56]));
  S.push(paint(hull([...ring(V(0.2, 0.452, 0.1), 0.042, 0.054, 6, 'x'), ...ring(V(0.215, 0.452, 0.1), 0.038, 0.05, 6, 'x')]), P.armor, 'y', [0.4, 0.51]));
  S.push(flat(hull([V(0.213, 0.452, 0.122), V(0.213, 0.452, 0.078), V(0.213, 0.476, 0.1), V(0.213, 0.428, 0.1), V(0.232, 0.452, 0.1)]), P.jade));

  // abdomen plate over gold band 2: trim frame + raised armour panel + jade gem + flank runes
  {
    const shell = (a0, a1, z0, z1, k0, k1) => {
      const pts = [];
      for (const z of [z0, z1]) for (let i = 0; i <= 4; i++) {
        const a = a0 + (a1 - a0) * i / 4;
        for (const k of [k0, k1]) pts.push(abPt(a, z, k));
      }
      return hull(pts);
    };
    const M = Math.PI / 2;
    C.push(paint(shell(M - 0.75, M + 0.75, -0.183, -0.267, 0.97, 1.06), P.trim, 'y', [0.55, 0.7]));
    C.push(paint(shell(M - 0.62, M + 0.62, -0.193, -0.257, 0.97, 1.095), P.armor, 'y', [0.55, 0.7]));
    const ty = abPt(M, -0.225, 1.095).y;
    C.push(flat(hull([V(0, ty - 0.01, -0.197), V(0, ty - 0.01, -0.253), V(0.028, ty - 0.01, -0.225), V(-0.028, ty - 0.01, -0.225),
      V(0, ty + 0.02, -0.225), V(0.018, ty + 0.008, -0.225), V(-0.018, ty + 0.008, -0.225), V(0, ty + 0.008, -0.207), V(0, ty + 0.008, -0.243)]), P.jade));
    abGlyph(S, M - 0.36, -0.225, 'diamond', [0.03, 0.022], 1.09);
    // trim knobs at the plate's lower corners
    const kn = abPt(M - 0.85, -0.225, 1.0), kd = nrm(V(Math.cos(M - 0.85), Math.sin(M - 0.85), 0));
    S.push(paint(hull([...dring(kn, kd, 0.03, 0.03, 6), kn.clone().addScaledVector(kd, 0.03)]), P.trim, 'flat'));
  }

  // ================= SILK RIBBON (sash at the waist + bow on the back + long draping tails) =================
  C.push(paint(hull([...ring(V(0, 0.425, -0.02), 0.17, 0.165, 10, 'z', Math.PI / 10),
    ...ring(V(0, 0.425, -0.06), 0.205, 0.195, 10, 'z', Math.PI / 10)]), P.silk, 'y', [0.25, 0.62]));
  const BW = abPt(Math.PI / 2, -0.1, 1, 0.02);
  C.push(flat(hull(cbox(BW, 0.032, 0.03, 0.03, 0.01)), P.silk));
  S.push(paint(hull([V(0.02, BW.y, BW.z), V(0.02, BW.y + 0.025, BW.z + 0.01), V(0.02, BW.y - 0.02, BW.z - 0.01),
    V(0.12, BW.y + 0.07, BW.z + 0.035), V(0.13, BW.y - 0.005, BW.z - 0.02), V(0.115, BW.y + 0.05, BW.z - 0.035)]), P.silk, 'y', [BW.y - 0.03, BW.y + 0.07]));
  // tail drapes from the bow, over the armour trim, down the flank to below the waistline
  const tailCtl = [[1.48, -0.11, 0.012], [1.25, -0.19, 0.034], [1.0, -0.3, 0.016], [0.55, -0.4, 0.016], [0.1, -0.42, 0.016], [-0.3, -0.42, 0.016]]
    .map(([ang, z, off]) => abPt(ang, z, 1.0, off));
  S.push(paint(tube(curveSamples(tailCtl, 9, () => 0.007, (t) => 0.026 + 0.01 * t),
    { seg: 4, phase: Math.PI / 4, axis: V(0.75, 0.66, 0) }), P.silk, 'len'));
  // swallow-tail end
  const te = tailCtl[5], tn = nrm(V(Math.cos(-0.3), Math.sin(-0.3), 0));
  const tz = V(0, 0, -1), tt = new THREE.Vector3().crossVectors(tn, tz);
  const TE = (a2, b2, o) => te.clone().addScaledVector(tt, a2).addScaledVector(tz, b2).addScaledVector(tn, o);
  S.push(paint(hull([TE(0.0, -0.03, 0), TE(0.0, 0.03, 0), TE(-0.07, -0.05, -0.004), TE(-0.07, 0.04, -0.004), TE(-0.045, 0.0, 0),
    TE(0.0, -0.03, 0.01), TE(0.0, 0.03, 0.01), TE(-0.07, -0.05, 0.006), TE(-0.07, 0.04, 0.006)]), P.silk, 'y', [0.2, 0.4]));

  // ================= CHERRY BLOSSOMS (5-petal, pink, jade-free centre) =================
  const flower = (list, c, n, s) => {
    const [d, a, b] = basis(n);
    for (let k = 0; k < 5; k++) {
      const th = (2 * Math.PI * k) / 5 + Math.PI / 2;
      const u = a.clone().multiplyScalar(Math.cos(th)).addScaledVector(b, Math.sin(th));
      const v = new THREE.Vector3().crossVectors(d, u);
      const pts = [];
      for (const o of [-0.006, 0.006]) {
        const base = c.clone().addScaledVector(d, o + 0.004);
        pts.push(base.clone().addScaledVector(u, s * 0.1),
          base.clone().addScaledVector(u, s * 0.6).addScaledVector(v, s * 0.42),
          base.clone().addScaledVector(u, s * 0.6).addScaledVector(v, -s * 0.42),
          base.clone().addScaledVector(u, s * 1.05).addScaledVector(v, s * 0.22).addScaledVector(d, 0.006),
          base.clone().addScaledVector(u, s * 1.05).addScaledVector(v, -s * 0.22).addScaledVector(d, 0.006),
          base.clone().addScaledVector(u, s * 0.9).addScaledVector(d, 0.004));
      }
      list.push(paint(hull(pts), P.petal, 'flat'));
    }
    list.push(flat(hull([...dring(c.clone().addScaledVector(d, 0.006), d, s * 0.28, s * 0.28, 5),
      c.clone().addScaledVector(d, 0.022)]), P.bloomC));
  };
  flower(S, V(0.13, H.y + 0.15, H.z + 0.02), V(0.6, 1, 0.2), 0.05);       // on the head beside the crown
  flower(S, V(0.17, 0.555, 0.17), V(0.8, 0.6, 0.6), 0.05);                 // in the fur ruff
  { const q = abAt(-0.225); flower(S, V(q.r + 0.008, q.y, -0.225), V(1, 0.15, 0), 0.05); }      // abdomen side (gold band)
  { const q = abAt(-0.42); flower(C, V(0, q.y + q.r * 0.94 + 0.01, -0.42), V(0, 1, -0.2), 0.05); } // abdomen top (gold band)
  // a loose petal on the forehead side

  // ================= WINGS (faceted shimmering cells, gold spar) =================
  const wing = (root, span, chord, outline, cols) => {
    const sp = nrm(span);
    const ch = nrm(chord.clone().addScaledVector(sp, -chord.dot(sp)));
    const nn = new THREE.Vector3().crossVectors(sp, ch).normalize();
    const P3 = (u, v, o = 0) => root.clone().addScaledVector(sp, u).addScaledVector(ch, v).addScaledVector(nn, o);
    const th = 0.006;
    const c0 = [outline[0][0] * 0.3 + 0.03, 0];
    for (let i = 0; i < outline.length - 1; i++) {
      const a = outline[i], b = outline[i + 1];
      const pts = [];
      for (const o of [-th, th]) pts.push(P3(c0[0], c0[1], o), P3(a[0], a[1], o), P3(b[0], b[1], o));
      const g = paint(hull(pts), cols[i % cols.length], 'y');
      // shimmering membrane: custom up-facing normals per cell (lit from above on both faces, slight per-cell variation)
      for (const sx of [1, -1]) {
        const m = g.clone();
        const pa = m.attributes.position, ua = m.attributes.uv;
        if (sx < 0) {
          for (let j = 0; j < pa.count; j++) pa.setX(j, -pa.getX(j));
          for (let j = 0; j < pa.count; j += 3) for (const at of [pa, ua]) for (let c = 0; c < at.itemSize; c++) {
            const t = at.getComponent(j + 1, c); at.setComponent(j + 1, c, at.getComponent(j + 2, c)); at.setComponent(j + 2, c, t);
          }
        }
        const nv = V(sx * (0.45 + 0.15 * (i % 3)), 1, 0.05 + 0.2 * (i % 2)).normalize();
        const na = [];
        for (let j = 0; j < pa.count; j++) na.push(nv.x, nv.y, nv.z);
        m.setAttribute('normal', new THREE.Float32BufferAttribute(na, 3));
        C.push(m);
      }
    }
    // gold spar along the leading edge
    const lead = outline.slice(0, 4).map(([u, v]) => P3(u, v + 0.008, 0));
    S.push(paint(tube(curveSamples([P3(0, 0.0, 0), ...lead], 7, (t) => 0.016 - 0.008 * t), { seg: 5, capEnd: 0.01 }), P.gold, 'len'));
  };
  const fore = [[0.0, 0.04], [0.14, 0.1], [0.32, 0.12], [0.48, 0.08], [0.55, 0.0], [0.5, -0.08], [0.36, -0.13], [0.18, -0.11], [0.03, -0.05]].map(([u, v]) => [u * 1.25, v * 1.22]);
  wing(V(0.08, 0.6, 0.02), V(0.85, 0.62, -0.45), V(0, 0.3, 1), fore, [P.wingA, P.wingB]);
  const hind = [[0.0, 0.035], [0.12, 0.07], [0.26, 0.065], [0.36, 0.0], [0.32, -0.07], [0.18, -0.09], [0.03, -0.04]].map(([u, v]) => [u * 1.15, v * 1.15]);
  wing(V(0.08, 0.57, -0.05), V(0.8, 0.3, -0.75), V(0, 0.45, 1), hind, [P.wingB, P.wingA]);

  // drop everything except the legs so the stance is low and sturdy
  const DROP = 0.05;
  C.forEach((g, i) => { if (i < nC0 || i >= nC1) g.translate(0, -DROP, 0); });
  S.forEach((g, i) => { if (i < nS0 || i >= nS1) g.translate(0, -DROP, 0); });
  return assemble(C, S);
}

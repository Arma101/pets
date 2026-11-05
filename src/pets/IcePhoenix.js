// Ice Phoenix (LEGENDARY): light-blue phoenix, white ice-crystal shard feathers, frosty crest,
// icy-flame tail, glowing ice eyes, gold-trimmed blue armour (chest plate + wing-shoulder guards).
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// 3-stop vertical gradient cell (white -> cyan -> blue) for the icy flames
const grad3 = (c0, c1, c2) => (g, x, y) => {
  const gr = g.createLinearGradient(0, y + 16, 0, y + 112);
  gr.addColorStop(0, c0); gr.addColorStop(0.5, c1); gr.addColorStop(1, c2);
  g.fillStyle = c0; g.fillRect(x, y, 128, 16);
  g.fillStyle = gr; g.fillRect(x, y + 16, 128, 96);
  g.fillStyle = c2; g.fillRect(x, y + 112, 128, 16);
};

export const PALETTE = {
  body:   { i: 0, top: '#B2E8FF', bot: '#4AACF2' },
  bodyD:  { i: 1, top: '#8CD6FF', bot: '#3C96E6' },
  ice:    { i: 2, top: '#F4FCFF', bot: '#8ED2F8' },
  iceC:   { i: 3, top: '#EEFBFF', bot: '#8CD4FA' },
  wingF:  { i: 18, top: '#CFF4FF', bot: '#3FA6EE' },
  frost:  { i: 19, top: '#B4EEFF', bot: '#52BCF2' },
  armor:  { i: 4, top: '#6AA8EC', bot: '#2E5FB4' },
  gold:   { i: 5, top: '#FFE46C', bot: '#E39E12' },
  goldDk: { i: 6, top: '#F6C431', bot: '#B9780C' },
  beak:   { i: 7, top: '#FFE14E', bot: '#EE9710' },
  eyeG:   { i: 8, top: '#EFFFFF', bot: '#A6F4FF', glow: true },
  iris:   { i: 17, top: '#BFFBFF', bot: '#3FD8FF', glow: true },
  eye:    { i: 9, top: '#14202C', bot: '#0A0F16' },
  brow:   { i: 10, top: '#F4FCFF', bot: '#A0D8F6' },
  flame:  { i: 11, draw: grad3('#FFFFFF', '#8AEBFF', '#3A96F0'), glow: true },
  flame2: { i: 12, draw: grad3('#F2FDFF', '#6FD9FF', '#2C78E0') },
  gem:    { i: 13, top: '#E8FFFF', bot: '#46DCFF', glow: true },
  leg:    { i: 14, top: '#B8D4F0', bot: '#6F92C2' },
  white:  { i: 15, top: '#FFFFFF', bot: '#F1F6FA' },
  mouth:  { i: 16, top: '#B0640E', bot: '#7A4208' },
};
const P = PALETTE;

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const sub = (a, b) => a.clone().sub(b);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);

// flat faceted blade: convex polygon prism in the plane of dir with normal n
function blade(base, dir, n, L, w, th = 0.016, shape = null) {
  const d = nrm(dir);
  const nn = nrm(add(n, d, -n.dot(d)));
  const v = nrm(cross(nn, d));
  const pts2 = shape || [[0, -0.3], [0, 0.3], [0.2, 0.5], [0.8, 0.5], [1, 0.05], [0.8, -0.5], [0.2, -0.5]];
  const pts = [];
  for (const [u, s] of pts2) {
    const p = add(add(base, d, u * L), v, s * w);
    const t = th * (u > 0.9 ? 0.6 : 1);
    pts.push(add(p, nn, t / 2), add(p, nn, -t / 2));
  }
  return hull(pts);
}
// crystal shard (pointed kite) shape
const KITE = [[0, -0.25], [0, 0.25], [0.35, 0.5], [1, 0], [0.35, -0.5]];
const CRYS = [[0, -0.3], [0, 0.3], [0.55, 0.5], [1, 0], [0.55, -0.5]];

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const pt = (g, sw, lo, hi) => paint(g, sw, lo === undefined ? 'flat' : 'y', lo === undefined ? null : [lo, hi]);

  // ================= BODY (upright egg, puffed chest) =================
  C.push(pt(hull([
    ...ring(V(0, 0.36, -0.25), 0.09, 0.08, 10, 'z'),
    ...ring(V(0, 0.37, -0.16), 0.17, 0.15, 10, 'z'),
    ...ring(V(0, 0.4, -0.03), 0.205, 0.18, 10, 'z'),
    ...ring(V(0, 0.45, 0.09), 0.2, 0.19, 10, 'z'),
    ...ring(V(0, 0.52, 0.17), 0.16, 0.17, 10, 'z'),
    ...ring(V(0, 0.58, 0.21), 0.1, 0.1, 10, 'z'),
  ]), P.body, 0.2, 0.7));
  // neck
  C.push(pt(hull([...ring(V(0, 0.52, 0.06), 0.15, 0.14, 8, 'y'), ...ring(V(0, 0.72, 0.1), 0.13, 0.125, 8, 'y')]), P.body, 0.4, 0.9));

  // belly: white ice-crystal feather shards under the chest plate
  for (const [x, y, z, w, l, sw] of [[0, 0.3, 0.19, 0.085, 0.12, P.ice], [0.085, 0.3, 0.165, 0.08, 0.12, P.iceC], [0.15, 0.32, 0.1, 0.075, 0.12, P.ice],
    [0.18, 0.4, 0.02, 0.07, 0.12, P.iceC]]) {
    const g = blade(V(x, y, z), V(x * 1.0, -1, 0.05), V(x * 5, 0.2, 1), l, w, 0.03, KITE);
    (x === 0 ? C : S).push(paint(g, sw, 'y', [y - l, y]));
  }
  // back feathers sweeping toward the tail
  C.push(pt(blade(V(0, 0.62, 0.0), V(0, -0.35, -1), V(0, 1, -0.3), 0.18, 0.16, 0.022, KITE), P.ice));
  S.push(pt(blade(V(0.1, 0.58, -0.02), V(0.3, -0.45, -1), V(0.5, 1, -0.3), 0.16, 0.14, 0.022, KITE), P.iceC));
  C.push(pt(blade(V(0, 0.55, -0.13), V(0, -0.4, -1), V(0, 1, -0.4), 0.17, 0.15, 0.022, KITE), P.iceC));

  // ================= CHEST ARMOUR (blue plate, gold rim, glowing gem) =================
  // curved breastplate hugging the chest: points on an ellipsoid cap
  const EC = V(0, 0.54, 0.0), ER = V(0.205, 0.21, 0.255);
  const cap = (k, p0, p1, t0, t1, n = 5) => {
    const pts = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < 4; j++) {
      const ph = p0 + (p1 - p0) * i / (n - 1), th = t0 + (t1 - t0) * j / 3;
      // narrow toward the bottom (shield-like)
      const nar = 1 - 0.75 * Math.max(0, -th) / Math.abs(t0);
      const phh = ph * nar;
      pts.push(V(EC.x + ER.x * k * Math.sin(phh) * Math.cos(th), EC.y + ER.y * k * Math.sin(th), EC.z + ER.z * k * Math.cos(phh) * Math.cos(th)));
    }
    pts.push(V(0, EC.y + ER.y * k * Math.sin(t0 - 0.2), EC.z + ER.z * k * Math.cos(t0 - 0.2)));
    return hull(pts);
  };
  C.push(paint(cap(1.03, -1.15, 1.15, -0.72, 0.6, 4), P.gold, 'y', [0.36, 0.7]));
  C.push(paint(cap(1.075, -0.98, 0.98, -0.6, 0.47, 4), P.armor, 'y', [0.38, 0.68]));
  const CP = V(0, 0.54, EC.z + ER.z * 1.07 * Math.cos(0.02) + 0.0);
  // gold setting + glowing gem in the middle
  C.push(pt(hull([...ring(V(0, CP.y, CP.z - 0.03), 0.055, 0.06, 6, 'z', Math.PI / 2), ...ring(V(0, CP.y, CP.z + 0.012), 0.045, 0.05, 6, 'z', Math.PI / 2)]), P.gold));
  C.push(pt(hull([...ring(V(0, CP.y, CP.z + 0.006), 0.03, 0.036, 6, 'z', Math.PI / 2), V(0, CP.y, CP.z + 0.045)]), P.gem, CP.y - 0.04, CP.y + 0.04));
  // gold filigree wings on the plate
  S.push(paint(blade(V(0.04, CP.y + 0.035, CP.z - 0.012), V(1, 0.35, -0.35), V(0.2, 0, 1), 0.11, 0.035, 0.02, KITE), P.gold, 'flat'));

  // ================= HEAD =================
  const hc0 = C.length, hs0 = S.length;
  const H = { y: 0.86, z: 0.14 };
  C.push(pt(hull([
    ...cbox(V(0, H.y, H.z), 0.165, 0.145, 0.145, 0.07),
    ...ring(V(0, H.y + 0.16, H.z - 0.01), 0.095, 0.085, 8, 'y'),
    V(0.17, H.y - 0.08, H.z + 0.01), V(-0.17, H.y - 0.08, H.z + 0.01),
  ]), P.body, 0.68, 1.06));
  const FZ = H.z + 0.145;
  // white cheek / nape crystal feathers
  S.push(pt(blade(V(0.15, H.y - 0.05, H.z + 0.05), V(0.5, -0.8, -0.5), V(1, 0, 0.3), 0.12, 0.1, 0.022, KITE), P.ice));
  S.push(pt(blade(V(0.15, H.y - 0.0, H.z - 0.05), V(0.45, -0.4, -1), V(1, 0.2, -0.2), 0.13, 0.1, 0.022, KITE), P.ice));
  S.push(pt(blade(V(0.12, H.y - 0.1, H.z - 0.07), V(0.4, -1, -0.5), V(1, 0, -0.3), 0.12, 0.1, 0.022, KITE), P.iceC));
  C.push(pt(blade(V(0, H.y - 0.02, H.z - 0.14), V(0, -0.7, -1), V(0, 0.3, -1), 0.13, 0.12, 0.022, KITE), P.iceC));

  // beak: chunky gold hook
  const BY = H.y - 0.04;
  const bk = (g) => paint(g, P.beak, 'y', [BY - 0.14, BY + 0.04]);
  C.push(bk(hull([
    ...plate([[-0.075, 0.03], [0.075, 0.03], [0.08, -0.05], [0.05, -0.085], [-0.05, -0.085], [-0.08, -0.05]], V(0, BY, 0), FZ - 0.04, FZ - 0.01),
    V(0.042, BY + 0.018, FZ + 0.05), V(-0.042, BY + 0.018, FZ + 0.05),
    V(0.026, BY - 0.005, FZ + 0.115), V(-0.026, BY - 0.005, FZ + 0.115),
    V(0.038, BY - 0.065, FZ + 0.07), V(-0.038, BY - 0.065, FZ + 0.07),
    V(0, BY - 0.12, FZ + 0.135), V(0.012, BY - 0.09, FZ + 0.14), V(-0.012, BY - 0.09, FZ + 0.14),
  ])));
  C.push(paint(hull([
    ...plate([[-0.05, 0], [0.05, 0], [0.04, -0.03], [-0.04, -0.03]], V(0, BY - 0.075, 0), FZ - 0.03, FZ - 0.005),
    V(0.025, BY - 0.085, FZ + 0.07), V(-0.025, BY - 0.085, FZ + 0.07), V(0, BY - 0.1, FZ + 0.05),
  ]), P.goldDk, 'flat'));

  // glowing fierce eyes: bright ice-white almond, black pupil, square catchlight
  const E = V(0.088, H.y + 0.035, 0), es = 1.22;
  const K = (a) => a.map(([u, v]) => [u * es, v * es]);
  S.push(pt(hull(plate(K([[-0.036, 0.0], [0.044, 0.03], [0.05, -0.008], [0.02, -0.036], [-0.026, -0.032], [-0.04, -0.016]]),
    E, FZ - 0.014, FZ + 0.008, 0.3)), P.eyeG, E.y - 0.045, E.y + 0.04));
  const PUP = [[-0.02, 0.0], [0.01, 0.013], [0.016, -0.007], [0.004, -0.024], [-0.015, -0.022], [-0.024, -0.01]];
  // ice-cyan glowing iris ring around the pupil
  S.push(pt(hull(plate(K(PUP.map(([u, v]) => [u * 1.4, v * 1.35])), V(E.x - 0.005, E.y - 0.001, 0), FZ - 0.006, FZ + 0.012, 0.3)),
    P.iris, E.y - 0.04, E.y + 0.03));
  S.push(pt(hull(plate(K(PUP.map(([u, v]) => [u * 0.9, v * 0.9])),
    V(E.x - 0.005, E.y - 0.003, 0), FZ + 0.0, FZ + 0.017, 0.3)), P.eye));
  S.push(pt(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.001, E.y + 0.002, 0), FZ + 0.01, FZ + 0.023, 0.3)), P.white));
  // heavy frosty brow slanting down to the beak
  S.push(paint(hull([
    V(0.022, E.y + 0.008, FZ + 0.03), V(0.025, E.y + 0.05, FZ + 0.018),
    V(0.165, E.y + 0.058, FZ - 0.04), V(0.165, E.y + 0.1, FZ - 0.055),
    V(0.022, E.y + 0.008, FZ - 0.03), V(0.025, E.y + 0.06, FZ - 0.04),
    V(0.165, E.y + 0.058, FZ - 0.1), V(0.165, E.y + 0.1, FZ - 0.11),
  ]), P.brow, 'y'));

  // frosty crest: tall fan of ice shard feathers sweeping up and back
  const CR = H.y + 0.12;
  for (const [z, dz, len, w, x, dx, sw] of [
    [0.07, 0.35, 0.2, 0.06, 0, 0, P.iceC],
    [0.02, -0.15, 0.3, 0.07, 0, 0, P.iceC],
    [-0.05, -0.75, 0.32, 0.07, 0, 0, P.iceC],
    [-0.1, -1.4, 0.26, 0.065, 0, 0, P.ice],
    [0.04, 0.05, 0.22, 0.055, 0.045, 0.35, P.ice],
    [-0.03, -0.5, 0.26, 0.06, 0.05, 0.4, P.iceC],
    [-0.09, -1.1, 0.22, 0.055, 0.06, 0.5, P.ice],
  ]) {
    const d = V(dx, 1, dz).normalize();
    const g = blade(V(x, CR, H.z + z), d, V(1, 0, 0), len, w, 0.035, CRYS);
    (x === 0 ? C : S).push(paint(g, P.wingF, 'y', [CR, CR + 0.32]));
  }
  // glowing crystal tip at the top of the crest
  C.push(paint(blade(V(0, CR + 0.2, H.z - 0.02), V(0, 1, -0.25), V(1, 0, 0), 0.12, 0.045, 0.03, CRYS), P.gem, 'y', [CR + 0.2, CR + 0.32]));

  // scale the head group up about the neck (big-head look)
  const HS = 1.1, piv = V(0, 0.7, 0.12);
  for (const g of [...C.slice(hc0), ...S.slice(hs0)]) {
    g.translate(-piv.x, -piv.y, -piv.z); g.scale(HS, HS, HS); g.translate(piv.x, piv.y, piv.z);
  }

  // ================= WINGS (spread out to the sides, broad overlapping ice-blue crystal feathers) =================
  const SH = V(0.18, 0.6, 0.0), WR = V(0.42, 0.84, -0.12), TP = V(0.6, 0.94, -0.28);
  const armDir = nrm(sub(WR, SH));
  const DOWN = nrm(V(0.2, -1, -0.3));
  const wingN = (dir) => { const n = nrm(cross(armDir, dir)); if (n.z < 0) n.multiplyScalar(-1); return n; };
  const nW = wingN(DOWN);
  const edgePts = [SH, add(SH, sub(WR, SH), 0.5), WR, add(WR, sub(TP, WR), 0.5), TP];
  const edge = new THREE.CatmullRomCurve3(edgePts, false, 'centripetal');
  const FSH = [[0, -0.35], [0, 0.35], [0.25, 0.5], [0.78, 0.45], [1, 0], [0.7, -0.5], [0.2, -0.5]];
  // secondaries: 4 broad feathers hanging from the arm, shingled (outer ones in front)
  for (let i = 0; i < 4; i++) {
    const t = 0.12 + 0.26 * i;
    const p = add(SH, sub(WR, SH), t);
    const dir = nrm(V(0.12 + 0.2 * t, -1, -0.4));
    const L = 0.3 + 0.05 * t;
    S.push(paint(blade(add(p, nW, -0.03 + i * 0.008), dir, nW, L, 0.165, 0.028, FSH), P.wingF, 'y', [p.y - L, p.y]));
  }
  // primaries: 5 broad feathers fanning from the hand, down -> outward
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const p = edge.getPoint(0.5 + 0.48 * t);
    const dir = nrm(V(0.3 + 0.55 * t, -1 + 0.5 * t, -0.45));
    const L = [0.35, 0.36, 0.33, 0.29, 0.24][i];
    S.push(paint(blade(add(p, nW, 0.002 + i * 0.008), dir, nW, L, 0.135, 0.028, FSH), P.wingF, 'y', [0.5, 1.0]));
  }
  // coverts: two thick faceted rows over the feather roots (light blue on top, frost below)
  const covert = (t0, t1, d0, d1, th, off) => {
    const pts = [];
    for (let k = 0; k <= 4; k++) {
      const t = t0 + (t1 - t0) * k / 4, q = edge.getPoint(t), d = d0 + (d1 - d0) * k / 4;
      for (const h of [-th, th]) {
        pts.push(add(add(q, nW, off + h), V(0, 0.015, 0)));
        pts.push(add(add(q, DOWN, d), nW, off + h * 0.5));
      }
    }
    return hull(pts);
  };
  S.push(paint(covert(0.02, 0.5, 0.2, 0.17, 0.02, 0.04), P.frost, 'y', [0.4, 0.85]));
  S.push(paint(covert(0.48, 0.98, 0.16, 0.06, 0.018, 0.05), P.frost, 'y', [0.65, 1.0]));
  S.push(paint(covert(0.0, 0.5, 0.11, 0.1, 0.03, 0.05), P.body, 'y', [0.5, 0.95]));
  S.push(paint(covert(0.48, 0.98, 0.09, 0.035, 0.024, 0.058), P.body, 'y', [0.7, 1.05]));
  // light-blue armoured leading edge with a gold wrist cuff
  S.push(paint(tube(curveSamples(edgePts, 9, (t) => 0.05 - 0.02 * t, (t) => 0.042 - 0.014 * t),
    { seg: 6, ref: V(0, 0, 1), capEnd: 0.035, capStart: 0.01 }), P.bodyD, 'len'));
  { const wd = nrm(sub(TP, WR));
    S.push(pt(tube([{ p: add(WR, wd, -0.03), rx: 0.056, ry: 0.05 }, { p: add(WR, wd, 0.03), rx: 0.053, ry: 0.046 }],
      { seg: 6, ref: V(0, 0, 1) }), P.gold)); }
  // gold-trimmed wing-shoulder guard (pauldron) + frost crystal
  S.push(pt(hull([...ring(V(0.2, 0.62, 0.03), 0.075, 0.085, 8, 'x'), ...ring(V(0.25, 0.64, 0.03), 0.06, 0.07, 8, 'x'), V(0.22, 0.73, 0.02)]), P.gold, 0.52, 0.74));
  S.push(pt(hull([...ring(V(0.215, 0.625, 0.03), 0.065, 0.075, 8, 'x'), ...ring(V(0.27, 0.645, 0.03), 0.045, 0.055, 8, 'x'), V(0.235, 0.72, 0.02)]), P.armor, 0.55, 0.72));
  S.push(paint(blade(V(0.25, 0.68, 0.03), V(0.5, 1, -0.2), V(0, 0, 1), 0.1, 0.035, 0.03, CRYS), P.gem, 'y', [0.68, 0.78]));

  // ================= LEGS (feathered thigh, steel-blue shin, gold greave + talons) =================
  const legX = 0.1;
  S.push(pt(blob(1, V(legX, 0.27, -0.01), V(0.09, 0.1, 0.105), { jitter: 0.15 }), P.body, 0.17, 0.4));
  S.push(pt(blade(V(legX + 0.065, 0.28, 0.03), V(0.3, -1, 0.0), V(1, 0, 0.5), 0.11, 0.08, 0.02, KITE), P.ice));
  S.push(pt(blade(V(legX + 0.06, 0.28, -0.07), V(0.3, -1, -0.3), V(1, 0, -0.5), 0.1, 0.075, 0.02, KITE), P.iceC));
  S.push(pt(blade(V(legX, 0.28, 0.07), V(0, -1, 0.05), V(0, 0, 1), 0.09, 0.08, 0.02, KITE), P.ice));
  S.push(pt(hull([...ring(V(legX, 0.2, -0.005), 0.052, 0.052, 6), ...ring(V(legX + 0.003, 0.12, 0.005), 0.05, 0.05, 6),
    ...ring(V(legX + 0.005, 0.04, 0.02), 0.045, 0.045, 6)]), P.leg, 0, 0.22));
  S.push(pt(hull([...ring(V(legX + 0.003, 0.1, 0.005), 0.062, 0.062, 6, 'y', 0), ...ring(V(legX + 0.003, 0.15, 0.003), 0.066, 0.066, 6, 'y', 0)]), P.gold, 0.08, 0.16));
  const foot = (x, z) => {
    S.push(pt(hull(cbox(V(x, 0.032, z), 0.052, 0.032, 0.05, 0.014)), P.leg, 0, 0.07));
    for (const [dx, dz] of [[-0.058, 0.088], [0, 0.11], [0.058, 0.088]]) {
      S.push(pt(hull([...cbox(V(x + dx * 0.45, 0.028, z + dz * 0.45), 0.023, 0.028, 0.023, 0.008),
        ...cbox(V(x + dx, 0.023, z + dz), 0.021, 0.023, 0.017, 0.007)]), P.leg, 0, 0.07));
      S.push(pt(shard(V(x + dx * 1.08, 0.02, z + dz + 0.012), V(dx, -0.45, 0.8), 0.017, 0.045), P.gold));
    }
    S.push(pt(hull(cbox(V(x, 0.022, z - 0.055), 0.018, 0.022, 0.03, 0.006)), P.leg, 0, 0.07));
    S.push(pt(shard(V(x, 0.016, z - 0.085), V(0, -0.4, -1), 0.015, 0.04), P.gold));
  };
  foot(legX + 0.005, 0.03);

  // ================= ICY FLAME TAIL (sweeping flame-shaped shards, white -> cyan -> blue) =================
  const flame = (pts, w, thick, sw) => paint(tube(curveSamples(pts, 9,
    (t) => thick * (1 - 0.5 * t), (t) => w * Math.pow(Math.sin(Math.PI * (0.12 + 0.88 * t)), 0.8) + 0.004),
    { seg: 4, axis: X, capEnd: 0.0, capStart: 0.0 }), sw, 'len');
  const tails = [
    { x: [0, 0], c: P.flame, w: 0.11, pts: [[0.42, -0.22], [0.58, -0.42], [0.82, -0.56], [1.02, -0.6], [1.12, -0.52]] },
    { x: [0.04, 0.14], c: P.flame2, w: 0.1, pts: [[0.41, -0.23], [0.52, -0.45], [0.72, -0.64], [0.9, -0.74], [1.0, -0.7]] },
    { x: [0.05, 0.22], c: P.flame, w: 0.095, pts: [[0.4, -0.24], [0.46, -0.48], [0.6, -0.7], [0.74, -0.84], [0.84, -0.84]] },
    { x: [0.06, 0.28], c: P.flame2, w: 0.09, pts: [[0.38, -0.24], [0.38, -0.48], [0.44, -0.72], [0.54, -0.88], [0.64, -0.94]] },
    { x: [0.05, 0.24], c: P.flame, w: 0.08, pts: [[0.36, -0.23], [0.3, -0.44], [0.28, -0.66], [0.33, -0.82], [0.42, -0.9]] },
  ];
  const curve3 = (pts) => new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  for (const t of tails) {
    const n = t.pts.length;
    const pts = t.pts.map(([y, z], i) => V(t.x[0] + (t.x[1] - t.x[0]) * i / (n - 1), y, z));
    const centre = t.x[0] === 0 && t.x[1] === 0;
    (centre ? C : S).push(flame(pts, t.w, 0.03, t.c));
    // flickering side tongue: smaller flame branching off and licking upward
    const cv = curve3(pts);
    const b0 = cv.getPoint(0.42), b1 = cv.getPoint(0.6);
    const up = V(0, 1, 0);
    const tp = [b0, add(b1, up, 0.05), add(add(b1, up, 0.17), V(0, 0, -1), 0.06), add(add(b1, up, 0.26), V(0, 0, -1), 0.02)];
    if (centre) tp.forEach((p) => { p.x = 0; });
    (centre ? C : S).push(flame(tp, t.w * 0.7, 0.026, t.c === P.flame ? P.flame2 : P.flame));
  }

  return assemble(C, S);
}

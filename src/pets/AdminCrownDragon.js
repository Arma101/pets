// Admin Crown Dragon (ADMIN): chunky faceted gold dragon, royal purple spread wings, horns,
// a big jewelled crown, a floating golden halo ringed with stars, glowing gold armor plates.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  gold:   { i: 0, top: '#FFCB3A', bot: '#D08A12' },              // body: deep amber gold
  goldDk: { i: 1, top: '#E9A526', bot: '#A9650C' },              // brow / jaw
  armor:  { i: 2, top: '#FFF07A', bot: '#E8A800', glow: true },  // glowing pale armor gold
  purple: { i: 3, top: '#9A4DE6', bot: '#5A1FA6' },              // royal purple
  memb:   { i: 4, top: '#8C42E0', bot: '#C394FF' },              // wing membrane
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:    { i: 6, top: '#1A1416', bot: '#0C0A0B' },
  nose:   { i: 7, top: '#4A1F3A', bot: '#2A0E22' },
  halo:   { i: 8, top: '#FFE45C', bot: '#FFB800', glow: true },  // halo + stars
  gem:    { i: 9, top: '#D79BFF', bot: '#7A2BD0', glow: true },  // glowing amethyst gems
  purpDk: { i: 10, top: '#7A34C8', bot: '#3F1280' },
  armorT: { i: 11, top: '#E8A800', bot: '#FFF07A', glow: true },
  plate:  { i: 12, top: '#FFF6A8', bot: '#F0C030' },              // bright gold armor plates (matte, faceted), // armor gradient reversed (tube tips light)
};
const P = PALETTE;
const DROP = 0.035;

// flat 5-point star prism: centre c, facing n, "up" u
function star(c, n, u, R, r, t) {
  n = n.clone().normalize();
  u = u.clone().addScaledVector(n, -u.dot(n)).normalize();
  const s = new THREE.Vector3().crossVectors(u, n).normalize();
  const at = (a, rad) => c.clone().addScaledVector(u, Math.cos(a) * rad).addScaledVector(s, Math.sin(a) * rad);
  const out = [];
  for (let k = 0; k < 5; k++) {
    const a = (2 * Math.PI * k) / 5;
    const tip = at(a, R), i1 = at(a - Math.PI / 5, r), i2 = at(a + Math.PI / 5, r);
    out.push(hull([
      c.clone().addScaledVector(n, t), c.clone().addScaledVector(n, -t),
      i1.clone().addScaledVector(n, t * 0.6), i1.clone().addScaledVector(n, -t * 0.6),
      i2.clone().addScaledVector(n, t * 0.6), i2.clone().addScaledVector(n, -t * 0.6),
      tip.clone().addScaledVector(n, t * 0.25), tip.clone().addScaledVector(n, -t * 0.25),
    ]));
  }
  return out;
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const gold = (pts, lo = 0, hi = 1.0) => paint(hull(pts), P.gold, 'y', [lo, hi]);
  const armor = (g, lo, hi) => paint(g, P.armor, lo === undefined ? 'flat' : 'y', lo === undefined ? null : [lo, hi]);
  const armP = (g, lo, hi) => paint(g, P.plate, lo === undefined ? 'flat' : 'y', lo === undefined ? null : [lo, hi]);
  const purp = (g) => paint(g, P.purple, 'flat');

  // ================= BODY =================
  C.push(gold([
    ...ring(V(0, 0.34, -0.38), 0.12, 0.12, 10, 'z'),
    ...ring(V(0, 0.34, -0.28), 0.19, 0.18, 10, 'z'),
    ...ring(V(0, 0.35, -0.12), 0.22, 0.21, 10, 'z'),
    ...ring(V(0, 0.38, 0.04), 0.22, 0.22, 10, 'z'),
    ...ring(V(0, 0.41, 0.16), 0.2, 0.21, 10, 'z'),
    ...ring(V(0, 0.45, 0.26), 0.16, 0.16, 10, 'z'),
  ], 0.12, 0.6));
  C.push(gold([...ring(V(0, 0.44, 0.15), 0.19, 0.17, 10, 'y'), ...ring(V(0, 0.57, 0.17), 0.19, 0.2, 10, 'y'), ...ring(V(0, 0.7, 0.23), 0.165, 0.16, 10, 'y')], 0.35, 0.85));

  // ================= LEGS =================
  S.push(gold([...ring(V(0.17, 0.08, 0.22), 0.088, 0.088, 8), ...ring(V(0.17, 0.2, 0.2), 0.095, 0.098, 8),
    ...ring(V(0.15, 0.34, 0.14), 0.11, 0.12, 8)], 0.0, 0.6));
  S.push(paint(blob(0, V(0.165, 0.33, 0.14), V(0.12, 0.15, 0.135), { jitter: 0.1 }), P.gold, 'y', [0.0, 0.6]));
  S.push(paint(blob(1, V(0.175, 0.26, -0.17), V(0.13, 0.155, 0.17), { jitter: 0.12 }), P.gold, 'y', [0.0, 0.6]));
  S.push(gold([...ring(V(0.18, 0.24, -0.16), 0.09, 0.095, 8), ...ring(V(0.19, 0.13, -0.19), 0.08, 0.08, 8),
    ...ring(V(0.19, 0.08, -0.18), 0.078, 0.078, 8)], 0.0, 0.6));
  // armor bracers (glowing gold band with purple rim)
  const bracer = (x, y, z, r) => {
    S.push(armP(hull([...ring(V(x, y - 0.035, z), r, r, 8), ...ring(V(x, y + 0.035, z), r * 1.02, r * 1.02, 8)])));
    S.push(paint(hull([...ring(V(x, y + 0.035, z), r * 1.06, r * 1.06, 8), ...ring(V(x, y + 0.052, z), r * 1.0, r * 1.0, 8)]), P.purple, 'flat'));
  };
  bracer(0.17, 0.155, 0.21, 0.104);
  bracer(0.19, 0.145, -0.185, 0.092);
  // feet: gold block + 3 big armor-gold claws
  const foot = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.055, z + 0.01), 0.09, 0.055, 0.08, 0.028)), P.gold, 'y', [0, 0.3]));
    for (const dx of [-0.056, 0, 0.056]) {
      const b = V(x + dx, 0.0, z + 0.08);
      S.push(paint(hull([
        V(b.x - 0.026, 0.0, b.z - 0.02), V(b.x + 0.026, 0.0, b.z - 0.02),
        V(b.x - 0.022, 0.055, b.z - 0.02), V(b.x + 0.022, 0.055, b.z - 0.02),
        V(b.x, 0.062, b.z + 0.0), V(b.x + dx * 0.15, 0.0, b.z + 0.075),
        V(b.x - 0.018, 0.0, b.z + 0.035), V(b.x + 0.018, 0.0, b.z + 0.035),
      ]), P.purpDk, 'flat'));
    }
  };
  foot(0.175, 0.23);
  foot(0.195, -0.17);
  const nC = C.length, nS = S.length;

  // ================= CHEST ARMOR (segmented glowing gold plates) =================
  const belly = [
    [0.66, 0.355, 0.085, 0.034, -0.35],
    [0.59, 0.345, 0.095, 0.034, -0.28],
    [0.52, 0.34, 0.105, 0.034, -0.15],
    [0.45, 0.335, 0.115, 0.034, 0.0],
    [0.38, 0.32, 0.115, 0.034, 0.2],
    [0.31, 0.29, 0.11, 0.034, 0.45],
    [0.25, 0.235, 0.105, 0.034, 0.85],
  ];
  for (const [y, z, w, l, t] of belly) {
    const up = V(0, Math.cos(t), -Math.sin(t)), n = V(0, Math.sin(t), Math.cos(t));
    const pts = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const c = V(0, y, z).addScaledVector(up, sy * l);
      pts.push(c.clone().addScaledVector(X, sx * w).addScaledVector(n, -0.07));
      pts.push(c.clone().addScaledVector(X, sx * (w - 0.01)).addScaledVector(n, -0.005));
      pts.push(c.clone().addScaledVector(X, sx * (w - 0.035)).addScaledVector(n, 0.012).addScaledVector(up, -sy * 0.006));
    }
    C.push(armP(hull(pts), 0.2, 0.75));
  }
  {
    const pts = [];
    for (const [y, z, w, l, t] of belly.slice(0, 6)) {
      const up = V(0, Math.cos(t), -Math.sin(t)), n = V(0, Math.sin(t), Math.cos(t));
      for (const sy of [-1, 1]) {
        const c = V(0, y, z).addScaledVector(up, sy * l);
        for (const sx of [-1, 1]) pts.push(c.clone().addScaledVector(X, sx * (w + 0.035)).addScaledVector(n, -0.04));
        pts.push(c.clone().addScaledVector(n, -0.16));
      }
    }
    C.push(paint(hull(pts), P.purple, 'y', [0.15, 0.85]));
  }
  // chest medallion gem
  C.push(paint(hull([V(0, 0.565, 0.4), V(0, 0.475, 0.405), V(0.042, 0.52, 0.395), V(-0.042, 0.52, 0.395),
    V(0, 0.52, 0.425), V(0, 0.58, 0.37), V(0, 0.46, 0.375), V(0.055, 0.52, 0.37), V(-0.055, 0.52, 0.37)]).translate(0, 0, -0.025), P.gem, 'y', [0.47, 0.57]));

  // shoulder pauldrons: domed armor caps with a purple rim
  for (const [c, s] of [[V(0.2, 0.5, 0.14), 1.0]]) {
    S.push(paint(hull([
      ...ring(V(c.x + 0.005, c.y - 0.065 * s, c.z), 0.098 * s, 0.112 * s, 7, 'y'),
      ...ring(V(c.x + 0.005, c.y - 0.045 * s, c.z), 0.1 * s, 0.114 * s, 7, 'y'),
    ]), P.purple, 'flat'));
    S.push(armP(hull([
      ...ring(V(c.x - 0.01, c.y + 0.045 * s, c.z), 0.05 * s, 0.06 * s, 7, 'y'),
      ...ring(V(c.x + 0.0, c.y + 0.0, c.z), 0.088 * s, 0.1 * s, 7, 'y'),
      ...ring(V(c.x + 0.005, c.y - 0.05 * s, c.z), 0.095 * s, 0.108 * s, 7, 'y'),
    ]), c.y - 0.06, c.y + 0.05));
    S.push(armP(shard(V(c.x + 0.02, c.y + 0.02, c.z), V(0.7, 1, 0.0), 0.035, 0.09)));
  }
  // back armor saddle between the wings
  C.push(armP(hull([
    ...ring(V(0, 0.56, 0.06), 0.16, 0.05, 8, 'y'), ...ring(V(0, 0.6, -0.02), 0.12, 0.08, 8, 'y'),
    ...ring(V(0, 0.52, -0.16), 0.17, 0.06, 8, 'y'),
  ]), 0.5, 0.62));

  // ================= HEAD =================
  const H = { y: 0.81, z: 0.3 };
  C.push(gold([
    ...cbox(V(0, H.y, H.z), 0.205, 0.16, 0.16, 0.07),
    ...ring(V(0, H.y + 0.18, H.z - 0.03), 0.11, 0.1, 8, 'y'),
    V(0.215, H.y - 0.065, H.z + 0.02), V(-0.215, H.y - 0.065, H.z + 0.02),
  ], 0.55, 1.0));
  const FZ = H.z + 0.16;
  C.push(gold([
    ...cbox(V(0, H.y - 0.07, FZ + 0.085), 0.115, 0.06, 0.105, 0.03),
    V(0.09, H.y - 0.0, FZ - 0.02), V(-0.09, H.y - 0.0, FZ - 0.02),
    V(0.065, H.y - 0.015, FZ + 0.17), V(-0.065, H.y - 0.015, FZ + 0.17),
  ], 0.6, 0.9));
  C.push(paint(hull(cbox(V(0, H.y - 0.14, FZ + 0.045), 0.095, 0.035, 0.1, 0.02)), P.goldDk, 'y', [0.6, 0.72]));
  // armor nose guard
  C.push(armP(hull([V(0, H.y + 0.0, FZ + 0.04), V(0.05, H.y - 0.008, FZ + 0.03), V(-0.05, H.y - 0.008, FZ + 0.03),
    V(0, H.y - 0.01, FZ + 0.15), V(0.03, H.y - 0.02, FZ + 0.15), V(-0.03, H.y - 0.02, FZ + 0.15),
    V(0, H.y - 0.025, FZ + 0.04)])));
  S.push(paint(hull([V(0.028, H.y - 0.008, FZ + 0.155), V(0.062, H.y - 0.008, FZ + 0.15), V(0.028, H.y - 0.022, FZ + 0.197),
    V(0.062, H.y - 0.022, FZ + 0.195), V(0.045, H.y - 0.03, FZ + 0.15), V(0.045, H.y - 0.04, FZ + 0.19)]), P.nose, 'flat'));
  S.push(paint(hull([V(0, H.y - 0.098, FZ + 0.197), V(0, H.y - 0.088, FZ + 0.197), V(0.08, H.y - 0.098, FZ + 0.197),
    V(0.08, H.y - 0.088, FZ + 0.197), V(0, H.y - 0.093, FZ + 0.18), V(0.08, H.y - 0.093, FZ + 0.18)]), P.nose, 'flat'));
  S.push(paint(hull([V(0.1, H.y - 0.098, FZ + 0.185), V(0.1, H.y - 0.088, FZ + 0.185), V(0.12, H.y - 0.098, FZ + 0.16),
    V(0.12, H.y - 0.088, FZ + 0.16), V(0.12, H.y - 0.115, FZ + 0.05), V(0.12, H.y - 0.105, FZ + 0.05),
    V(0.105, H.y - 0.1, FZ + 0.06), V(0.09, H.y - 0.093, FZ + 0.18)]), P.nose, 'flat'));

  // fierce eyes
  const E = V(0.092, H.y + 0.045, 0);
  S.push(paint(hull(plate([[-0.05, 0.0], [0.052, 0.038], [0.06, -0.012], [0.022, -0.046], [-0.034, -0.042], [-0.052, -0.018]],
    E, FZ - 0.01, FZ + 0.01)), P.white, 'flat'));
  S.push(paint(hull(plate([[-0.03, 0.002], [0.018, 0.022], [0.025, -0.01], [0.005, -0.038], [-0.025, -0.036], [-0.036, -0.015]],
    V(E.x - 0.002, E.y, 0), FZ + 0.004, FZ + 0.016)), P.eye, 'flat'));
  S.push(paint(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.012, FZ + 0.02)), P.white, 'flat'));
  S.push(paint(hull([
    V(0.022, E.y + 0.01, FZ + 0.035), V(0.024, E.y + 0.055, FZ + 0.025),
    V(0.165, E.y + 0.055, FZ - 0.01), V(0.165, E.y + 0.1, FZ - 0.025),
    V(0.022, E.y + 0.01, FZ - 0.03), V(0.024, E.y + 0.065, FZ - 0.04),
    V(0.165, E.y + 0.055, FZ - 0.06), V(0.165, E.y + 0.1, FZ - 0.07),
  ]), P.goldDk, 'y'));

  // horns: big purple sweeping back from the head sides, small lower pair
  S.push(paint(tube(curveSamples(
    [V(0.15, H.y + 0.1, H.z - 0.06), V(0.22, H.y + 0.2, H.z - 0.15), V(0.26, H.y + 0.3, H.z - 0.3)],
    5, (t) => 0.055 * (1 - t) + 0.004), { seg: 6, capEnd: 0.0 }), P.purple, 'len'));
  S.push(paint(tube(curveSamples(
    [V(0.16, H.y + 0.03, H.z - 0.1), V(0.24, H.y + 0.06, H.z - 0.18), V(0.3, H.y + 0.09, H.z - 0.28)],
    4, (t) => 0.038 * (1 - t) + 0.003), { seg: 5 }), P.purple, 'len'));
  // purple frill fins
  const fin = (b, tip, h, th, up = V(0, 1, 0)) => hull([
    b.clone().addScaledVector(up, h).add(V(th, 0, 0)), b.clone().addScaledVector(up, h).add(V(-th, 0, 0)),
    b.clone().addScaledVector(up, -h).add(V(th, 0, 0)), b.clone().addScaledVector(up, -h).add(V(-th, 0, 0)),
    b.clone().add(V(th * 1.6, 0, 0.02)), tip,
  ]);
  for (const [b, tip, h] of [
    [V(0.19, H.y - 0.05, H.z - 0.02), V(0.32, H.y - 0.06, H.z - 0.17), 0.045],
    [V(0.17, H.y - 0.11, H.z + 0.02), V(0.27, H.y - 0.19, H.z - 0.1), 0.035],
  ]) S.push(paint(fin(b, tip, h, 0.022), P.purpDk, 'y', [H.y - 0.2, H.y + 0.2]));
  C.push(paint(shard(V(0, H.y + 0.02, H.z - 0.16), V(0, 0.6, -1), 0.03, 0.08), P.purple, 'flat'));

  // ================= BIG CROWN =================
  const Cy = H.y + 0.165, Cz = H.z - 0.01, CR = 0.18;
  // band
  C.push(armor(hull([...ring(V(0, Cy, Cz), CR * 0.94, CR * 0.94, 8, 'y', Math.PI / 8),
    ...ring(V(0, Cy + 0.085, Cz), CR, CR, 8, 'y', Math.PI / 8)]), Cy, Cy + 0.09));
  // purple rim at base
  C.push(paint(hull([...ring(V(0, Cy - 0.012, Cz), CR * 0.97, CR * 0.97, 8, 'y', Math.PI / 8),
    ...ring(V(0, Cy + 0.016, Cz), CR * 0.99, CR * 0.99, 8, 'y', Math.PI / 8)]), P.purple, 'flat'));
  // velvet cap
  C.push(paint(hull([...ring(V(0, Cy + 0.08, Cz), CR * 0.82, CR * 0.82, 8, 'y', Math.PI / 8),
    ...ring(V(0, Cy + 0.15, Cz), CR * 0.5, CR * 0.5, 8, 'y', Math.PI / 8)]), P.purple, 'y', [Cy + 0.08, Cy + 0.16]));
  C.push(armor(blob(0, V(0, Cy + 0.17, Cz), V(0.03, 0.03, 0.03))));
  // crown points at 8 directions (front/back on centre line; 3 mirrored sides)
  const pt = (a, big) => {
    const d = V(Math.cos(a), 0, Math.sin(a));
    const b = V(0, Cy + 0.08, Cz).addScaledVector(d, CR * 0.96);
    const h = big ? 0.18 : 0.125, w = big ? 0.055 : 0.045;
    const side = V(-d.z, 0, d.x);
    return hull([b.clone().addScaledVector(side, w).addScaledVector(d, 0.012), b.clone().addScaledVector(side, -w).addScaledVector(d, 0.012),
      b.clone().addScaledVector(side, w).addScaledVector(d, -0.02), b.clone().addScaledVector(side, -w).addScaledVector(d, -0.02),
      b.clone().add(V(0, h, 0)).addScaledVector(d, 0.02), b.clone().add(V(0, h, 0)).addScaledVector(d, -0.004)]);
  };
  C.push(armor(pt(Math.PI / 2, true), Cy, Cy + 0.22));
  C.push(armor(pt(-Math.PI / 2, true), Cy, Cy + 0.22));
  for (const a of [Math.PI / 4, 0, -Math.PI / 4]) S.push(armor(pt(a, a === 0), Cy, Cy + 0.22));
  // gems: front big diamond, side gems
  const gem = (a, s) => {
    const d = V(Math.cos(a), 0, Math.sin(a)), side = V(-d.z, 0, d.x);
    const c = V(0, Cy + 0.045, Cz).addScaledVector(d, CR + 0.004);
    return paint(hull([c.clone().add(V(0, 0.032 * s, 0)), c.clone().add(V(0, -0.032 * s, 0)),
      c.clone().addScaledVector(side, 0.026 * s), c.clone().addScaledVector(side, -0.026 * s),
      c.clone().addScaledVector(d, 0.018 * s), c.clone().addScaledVector(d, -0.01)]), P.gem, 'y', [Cy + 0.01, Cy + 0.08]);
  };
  C.push(gem(Math.PI / 2, 1.2));
  C.push(gem(-Math.PI / 2, 1.0));
  for (const a of [Math.PI / 4, 0, -Math.PI / 4]) S.push(gem(a, 0.85));

  // ================= HALO + STARS (floating close above the crown) =================
  const Hc = V(0, Cy + 0.38, Cz - 0.03), HR = 0.22, tilt = 0.28; // back edge higher
  const hp = (a) => V(Math.cos(a) * HR, -Math.sin(a) * HR * Math.sin(tilt), Math.sin(a) * HR * Math.cos(tilt)).add(Hc);
  const NS = 16;
  for (let k = 0; k < NS; k++) {
    const a0 = (2 * Math.PI * k) / NS, a1 = (2 * Math.PI * (k + 1)) / NS;
    const p0 = hp(a0), p1 = hp(a1);
    const pts = [];
    for (const p of [p0, p1]) {
      const r = p.clone().sub(Hc).normalize();
      const up = V(0, Math.cos(tilt), Math.sin(tilt));
      for (const [dr, du] of [[0.034, 0], [0, 0.024], [-0.034, 0], [0, -0.024]]) pts.push(p.clone().addScaledVector(r, dr).addScaledVector(up, du));
    }
    const g = paint(hull(pts), P.halo, 'flat');
    // only build the right half (+ centre-crossing pieces) once: mirror handles x<0
    if (k < NS / 4 || k >= (3 * NS) / 4) S.push(g);
  }
  // stars on the halo, facing outward
  const starAt = (a, R, list) => {
    const p = hp(a), n = p.clone().sub(Hc); n.y = 0; n.normalize(); n.z += Math.sign(n.z) * 0.9;
    for (const g of star(p, n, V(0, 1, 0), R, R * 0.48, 0.026)) list.push(paint(g, P.halo, 'flat'));
  };
  starAt(Math.PI / 2 - 0.66, 0.12, S);   // 5 stars: front pair, side-back pair, back centre
  starAt(Math.PI / 2 - 2.0, 0.11, S);
  starAt(-Math.PI / 2, 0.11, C);

  // ================= BACK SPIKES (purple) =================
  for (const [y, z, s] of [[0.62, 0.13, 1.0], [0.62, 0.0, 1.2], [0.6, -0.12, 1.2], [0.56, -0.24, 1.0], [0.49, -0.33, 0.8]])
    C.push(purp(shard(V(0, y, z), V(0, 1, -0.55), 0.055 * s, 0.11 * s)));

  // ================= TAIL =================
  const tailPts = [V(0, 0.34, -0.3), V(0, 0.22, -0.5), V(0, 0.12, -0.7), V(0, 0.12, -0.9), V(0, 0.24, -1.04), V(0, 0.44, -1.06)];
  C.push(paint(tube(curveSamples(tailPts, 12, (t) => 0.11 * (1 - t) + 0.026), { seg: 8, axis: X, capEnd: 0.02 }), P.gold, 'len'));
  const tc = new THREE.CatmullRomCurve3(tailPts, false, 'centripetal');
  for (const t of [0.14, 0.3, 0.46, 0.62, 0.78]) {
    const p = tc.getPoint(t), T = tc.getTangent(t);
    const n = V(0, T.z, -T.y).normalize(); if (n.y + n.z * 0.3 < 0) n.negate();
    const r = 0.11 * (1 - t) + 0.026, k = 1.15 - t * 0.6;
    C.push(purp(shard(p.clone().addScaledVector(n, r * 0.75), n.clone().addScaledVector(T, -0.6), 0.045 * k, 0.09 * k)));
  }
  for (const t of [0.08, 0.2, 0.32, 0.44, 0.56]) {
    const p = tc.getPoint(t), T = tc.getTangent(t);
    const n = V(0, T.z, -T.y).normalize(); if (n.y + n.z * 0.3 < 0) n.negate();
    const r = 0.11 * (1 - t) + 0.026, w = r * 0.62, l = 0.045 * (1 - t * 0.5);
    const pts = [];
    for (const sx of [-1, 1]) for (const sl of [-1, 1]) {
      const c = p.clone().addScaledVector(T, sl * l);
      pts.push(c.clone().addScaledVector(X, sx * w).addScaledVector(n, -r * 0.55));
      pts.push(c.clone().addScaledVector(X, sx * w * 0.7).addScaledVector(n, -r * 0.92));
      pts.push(c.clone().addScaledVector(X, sx * w * 0.5).addScaledVector(n, -r * 1.06).addScaledVector(T, -sl * 0.006));
    }
    C.push(armP(hull(pts)));
  }
  const tip = tc.getPoint(1), tT = tc.getTangent(1);
  C.push(armP(hull([tip.clone().addScaledVector(tT, 0.22), tip.clone().addScaledVector(tT, -0.02),
    V(0.1, tip.y + 0.05, tip.z), V(-0.1, tip.y + 0.05, tip.z),
    V(0, tip.y + 0.05, tip.z - 0.03), V(0, tip.y + 0.05, tip.z + 0.03)])));
  S.push(purp(shard(V(0.06, tip.y + 0.04, tip.z), V(1, -0.7, 0), 0.035, 0.11)));
  C.push(purp(shard(V(0, tip.y + 0.03, tip.z - 0.02), V(0, -0.4, -1), 0.03, 0.1)));

  // ================= WINGS (royal purple, gold bones) =================
  const Sh = V(0.13, 0.55, 0.0), El = V(0.35, 0.84, -0.08), Wr = V(0.47, 1.2, -0.14);
  const tips = [V(1.08, 0.78, -0.3), V(0.92, 0.32, -0.36), V(0.56, 0.24, -0.32)];
  const Bd = V(0.14, 0.5, -0.2);
  S.push(paint(tube(curveSamples([Sh, El, Wr], 6, (t) => 0.062 - 0.022 * t), { seg: 6, capEnd: 0.02 }), P.gold, 'y', [0.4, 1.2]));
  S.push(armor(blob(0, Wr, V(0.055, 0.055, 0.055), { jitter: 0.1 })));
  tips.forEach((T) => {
    S.push(paint(tube(curveSamples([Wr, Wr.clone().lerp(T, 0.5).add(V(0, 0.03, 0)), T], 4, (t) => 0.032 * (1 - t) + 0.016),
      { seg: 5, capEnd: 0.0 }), P.armorT, 'len'));
  });
  S.push(armor(shard(Wr.clone().add(V(0, 0.03, 0.02)), V(-0.1, 1, 0.5), 0.035, 0.1)));
  const th = 0.006;
  const panel = (a, b, c) => {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const pts = [];
    for (const p of [a, b, c]) { pts.push(p.clone().addScaledVector(n, th)); pts.push(p.clone().addScaledVector(n, -th)); }
    S.push(paint(hull(pts), P.memb, 'y', [0.2, 1.15]));
  };
  const back = V(0, 0, -0.002);
  const W0 = Wr.clone().add(back);
  const edge = [tips[0], tips[1], tips[2], Bd];
  for (let i = 0; i < edge.length - 1; i++) {
    const a = edge[i].clone().add(back), b = edge[i + 1].clone().add(back);
    const m = a.clone().lerp(b, 0.5).lerp(Wr, 0.2).add(V(0, 0, -0.015));
    const mi = W0.clone().lerp(m, 0.5).add(V(0, 0, 0.012));
    panel(W0, a, mi); panel(a, m, mi); panel(mi, m, b); panel(W0, mi, b);
  }
  panel(W0, Bd.clone().add(back), El.clone().add(back));
  panel(El.clone().add(back), Bd.clone().add(back), Sh.clone().add(back));

  for (const g of C.slice(nC)) g.translate(0, -DROP, 0);
  for (const g of S.slice(nS)) g.translate(0, -DROP, 0);
  return assemble(C, S);
}

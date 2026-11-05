// Leviathan (DIVINE): huge deep-blue faceted sea dragon, cyan glowing fins, spiked back,
// glowing gold armor, floating golden halo, radiant fin-wings, coral and pearls.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  blue:   { i: 0, top: '#4A9BFF', bot: '#0F2E86' },   // glossy deep blue (bright wet top)
  blueDk: { i: 1, top: '#2A63CC', bot: '#0B2066' },
  gold:   { i: 2, top: '#FFE27A', bot: '#E09A00' },
  goldG:  { i: 13, top: '#FFEA8A', bot: '#FFB300', glow: true },  // halo only: emissive gold,
  fin:    { i: 3, top: '#9FF7FF', bot: '#1CC6F5', glow: true },
  belly:  { i: 4, top: '#EAFBFF', bot: '#8CD2F2' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:    { i: 6, top: '#1A1416', bot: '#0C0A0B' },
  nose:   { i: 7, top: '#0E1A44', bot: '#060C26' },
  brow:   { i: 8, top: '#2D74E0', bot: '#123A9A' },
  goldT:  { i: 9, top: '#E09A00', bot: '#FFE27A' },
  coral:  { i: 10, top: '#FF8FA8', bot: '#E8506E' },
  pearl:  { i: 11, top: '#FFFFFF', bot: '#E2DCF4' },
  finT:   { i: 12, top: '#26CDF8', bot: '#A8F6FF', glow: true },
};
const P = PALETTE;

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const blue = (pts, lo = 0, hi = 1.0) => paint(hull(pts), P.blue, 'y', [lo, hi]);
  const gold = (g) => paint(g, P.gold, 'y');
  const goldG = (g) => paint(g, P.goldG, 'y');
  const finP = (g, lo, hi) => paint(g, P.fin, 'y', [lo, hi]);
  const pearl = (c, r) => paint(blob(1, c, V(r, r, r)), P.pearl, 'y', [c.y - r, c.y + r]);

  // ================= BODY (big barrel) =================
  C.push(blue([
    ...ring(V(0, 0.37, -0.42), 0.13, 0.13, 10, 'z'),
    ...ring(V(0, 0.37, -0.31), 0.21, 0.2, 10, 'z'),
    ...ring(V(0, 0.38, -0.14), 0.24, 0.23, 10, 'z'),
    ...ring(V(0, 0.41, 0.03), 0.245, 0.24, 10, 'z'),
    ...ring(V(0, 0.44, 0.16), 0.22, 0.23, 10, 'z'),
    ...ring(V(0, 0.47, 0.26), 0.14, 0.15, 10, 'z'),
  ], 0.14, 0.66));
  // neck (thick)
  C.push(blue([...ring(V(0, 0.5, 0.16), 0.165, 0.15, 10, 'y'), ...ring(V(0, 0.74, 0.27), 0.14, 0.13, 10, 'y')], 0.4, 0.9));

  // ================= LEGS (thick, planted, slightly apart) =================
  S.push(blue([...ring(V(0.19, 0.08, 0.25), 0.095, 0.095, 8), ...ring(V(0.19, 0.21, 0.23), 0.1, 0.104, 8),
    ...ring(V(0.17, 0.36, 0.16), 0.12, 0.13, 8)], 0.0, 0.66));
  S.push(paint(blob(0, V(0.185, 0.36, 0.16), V(0.13, 0.16, 0.145), { jitter: 0.1 }), P.blue, 'y', [0.0, 0.66]));
  S.push(paint(blob(1, V(0.195, 0.28, -0.19), V(0.14, 0.17, 0.185), { jitter: 0.12 }), P.blue, 'y', [0.0, 0.66]));
  S.push(blue([...ring(V(0.2, 0.26, -0.18), 0.095, 0.1, 8), ...ring(V(0.21, 0.14, -0.21), 0.086, 0.086, 8),
    ...ring(V(0.21, 0.08, -0.2), 0.084, 0.084, 8)], 0.0, 0.66));
  // feet: blue block + 3 big gold claws
  const foot = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.058, z + 0.01), 0.097, 0.058, 0.085, 0.03)), P.blueDk, 'y', [0, 0.3]));
    for (const dx of [-0.06, 0, 0.06]) {
      const b = V(x + dx, 0.0, z + 0.085);
      S.push(gold(hull([
        V(b.x - 0.028, 0.0, b.z - 0.02), V(b.x + 0.028, 0.0, b.z - 0.02),
        V(b.x - 0.024, 0.058, b.z - 0.02), V(b.x + 0.024, 0.058, b.z - 0.02),
        V(b.x, 0.066, b.z + 0.0), V(b.x + dx * 0.15, 0.0, b.z + 0.08),
        V(b.x - 0.02, 0.0, b.z + 0.038), V(b.x + 0.02, 0.0, b.z + 0.038),
      ])));
    }
  };
  foot(0.195, 0.265);
  foot(0.215, -0.19);

  // gold greaves (armor bands) on fore legs
  S.push(gold(hull([...ring(V(0.19, 0.15, 0.24), 0.108, 0.11, 8), ...ring(V(0.188, 0.22, 0.228), 0.112, 0.116, 8)])));
  S.push(gold(hull([...ring(V(0.21, 0.15, -0.205), 0.095, 0.095, 8), ...ring(V(0.208, 0.2, -0.195), 0.1, 0.1, 8)])));
  // cyan elbow fins (back of fore legs)
  for (const [b, d, w, l] of [
    [V(0.23, 0.3, 0.1), V(0.3, -0.2, -1), 0.05, 0.15],
    [V(0.235, 0.24, 0.14), V(0.35, -0.6, -1), 0.04, 0.12],
  ]) S.push(finP(shard(b, d, w, l, 4, 0.35), 0.15, 0.4));

  // ================= BELLY PLATES (pale, segmented) =================
  const belly = [
    [0.7, 0.385, 0.09, 0.036, -0.35],
    [0.63, 0.375, 0.1, 0.036, -0.28],
    [0.555, 0.37, 0.11, 0.036, -0.15],
    [0.48, 0.365, 0.12, 0.036, 0.0],
    [0.405, 0.35, 0.12, 0.036, 0.2],
    [0.33, 0.315, 0.115, 0.036, 0.45],
    [0.265, 0.255, 0.11, 0.036, 0.85],
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
    C.push(paint(hull(pts), P.belly, 'y', [0.2, 0.8]));
  }
  {
    const pts = [];
    for (const [y, z, w, l, t] of belly.slice(0, 6)) {
      const up = V(0, Math.cos(t), -Math.sin(t)), n = V(0, Math.sin(t), Math.cos(t));
      for (const sy of [-1, 1]) {
        const c = V(0, y, z).addScaledVector(up, sy * l);
        for (const sx of [-1, 1]) pts.push(c.clone().addScaledVector(X, sx * (w + 0.035)).addScaledVector(n, -0.04));
        pts.push(c.clone().addScaledVector(n, -0.17));
      }
    }
    C.push(blue(pts, 0.15, 0.9));
  }

  // ================= GOLD ARMOR: collar gorget + shoulder pauldrons =================
  // collar: V-shaped plate band around the neck base, with a pearl
  {
    const pts = [];
    for (let k = 0; k <= 8; k++) {
      const a = -Math.PI / 2 + (Math.PI * k) / 8; // front half
      const x = Math.sin(a) * 0.215, z = 0.2 + Math.cos(a) * 0.215;
      const yb = 0.6 - Math.cos(a) * 0.05;
      pts.push(V(x, yb - 0.01, z), V(x, yb + 0.08, z - 0.01));
      pts.push(V(x * 0.84, yb - 0.005, z - Math.cos(a) * 0.05), V(x * 0.84, yb + 0.075, z - Math.cos(a) * 0.05));
    }
    pts.push(V(0, 0.47, 0.44), V(0, 0.5, 0.39)); // V point down the chest
    C.push(gold(hull(pts)));
  }
  C.push(pearl(V(0, 0.545, 0.445), 0.038));
  // pauldrons: layered gold plates over the shoulders
  const pauld = (y, out, w, l) => {
    const pts = [];
    for (const dz of [-l, l]) for (const [u, v] of [[-0.02, 0.05], [0.04, 0.04], [0.09, 0.0], [0.11, -0.06], [0.085, -0.06], [0.06, -0.01], [0.0, 0.015]])
      pts.push(V(0.17 + out + u * w, y + v * w, 0.16 + dz * (1 - Math.max(0, u) * 2)));
    S.push(gold(hull(pts)));
  };
  pauld(0.56, 0.0, 1.25, 0.11);
  pauld(0.5, 0.045, 1.1, 0.095);
  pauld(0.445, 0.08, 0.9, 0.08);
  S.push(gold(shard(V(0.2, 0.6, 0.16), V(0.5, 1, 0.0), 0.04, 0.11)));
  S.push(pearl(V(0.27, 0.56, 0.24), 0.026));
  // hind-leg gold hip plates (pointed, layered)
  S.push(gold(hull([V(0.3, 0.42, -0.08), V(0.32, 0.4, -0.2), V(0.3, 0.42, -0.3), V(0.335, 0.26, -0.2),
    V(0.27, 0.44, -0.08), V(0.27, 0.44, -0.3), V(0.3, 0.28, -0.2)])));

  // ================= CORAL + PEARLS on the hips =================
  const coral = (base, branches) => {
    for (const [d, l, r] of branches) {
      const e = base.clone().addScaledVector(d.clone().normalize(), l);
      S.push(paint(tube(curveSamples([base, base.clone().lerp(e, 0.5).add(V(0, 0.01, 0)), e], 3, (t) => r * (1 - 0.45 * t)),
        { seg: 5, capEnd: r * 0.7, capStart: 0 }), P.coral, 'y', [base.y - 0.02, base.y + l]));
    }
  };
  // hip coral: chunky branching cluster (main limbs + sub-branches)
  coral(V(0.2, 0.5, -0.2), [[V(0.3, 1, 0.1), 0.24, 0.048], [V(0.9, 0.7, -0.1), 0.2, 0.042], [V(0.25, 0.7, -0.7), 0.19, 0.04]]);
  coral(V(0.25, 0.66, -0.18), [[V(0.8, 0.8, 0.2), 0.09, 0.026], [V(-0.1, 1, -0.4), 0.08, 0.024]]);
  coral(V(0.36, 0.62, -0.22), [[V(0.6, 1, -0.3), 0.09, 0.025]]);
  coral(V(0.22, 0.46, -0.16), [[V(1, 0.5, 0.4), 0.14, 0.032], [V(0.6, 1, 0.5), 0.12, 0.028]]);
  // shoulder coral tucked behind the pauldrons
  coral(V(0.19, 0.58, 0.06), [[V(0.6, 1, -0.4), 0.16, 0.036], [V(1, 0.5, -0.6), 0.12, 0.03]]);
  S.push(pearl(V(0.25, 0.47, -0.12), 0.026));

  // ================= HEAD (big, boxy) =================
  const H = { y: 0.88, z: 0.33 };
  C.push(blue([
    ...cbox(V(0, H.y, H.z), 0.21, 0.165, 0.165, 0.07),
    ...ring(V(0, H.y + 0.185, H.z - 0.03), 0.115, 0.1, 8, 'y'),
    V(0.22, H.y - 0.065, H.z + 0.02), V(-0.22, H.y - 0.065, H.z + 0.02),
  ], 0.6, 1.08));
  const FZ = H.z + 0.165;
  // long snout
  C.push(blue([
    ...cbox(V(0, H.y - 0.07, FZ + 0.09), 0.12, 0.062, 0.11, 0.03),
    V(0.095, H.y, FZ - 0.02), V(-0.095, H.y, FZ - 0.02),
    V(0.068, H.y - 0.012, FZ + 0.18), V(-0.068, H.y - 0.012, FZ + 0.18),
  ], 0.66, 0.97));
  // lower jaw (pale)
  C.push(paint(hull(cbox(V(0, H.y - 0.142, FZ + 0.05), 0.1, 0.036, 0.105, 0.02)), P.belly, 'y', [0.68, 0.8]));
  // nostrils
  S.push(paint(hull([V(0.03, H.y - 0.006, FZ + 0.165), V(0.064, H.y - 0.006, FZ + 0.16), V(0.03, H.y - 0.02, FZ + 0.207),
    V(0.064, H.y - 0.02, FZ + 0.205), V(0.047, H.y - 0.03, FZ + 0.16), V(0.047, H.y - 0.04, FZ + 0.2)]), P.nose, 'flat'));
  // mouth line
  S.push(paint(hull([V(0, H.y - 0.1, FZ + 0.207), V(0, H.y - 0.09, FZ + 0.207), V(0.085, H.y - 0.1, FZ + 0.207),
    V(0.085, H.y - 0.09, FZ + 0.207), V(0, H.y - 0.095, FZ + 0.19), V(0.085, H.y - 0.095, FZ + 0.19)]), P.nose, 'flat'));
  S.push(paint(hull([V(0.105, H.y - 0.1, FZ + 0.195), V(0.105, H.y - 0.09, FZ + 0.195), V(0.125, H.y - 0.1, FZ + 0.17),
    V(0.125, H.y - 0.09, FZ + 0.17), V(0.125, H.y - 0.117, FZ + 0.05), V(0.125, H.y - 0.107, FZ + 0.05),
    V(0.11, H.y - 0.102, FZ + 0.06), V(0.095, H.y - 0.095, FZ + 0.19)]), P.nose, 'flat'));

  // fierce eyes
  const E = V(0.097, H.y + 0.056, 0);
  const es = (pts) => pts.map(([u, v]) => [u * 1.28, v * 1.28]);
  S.push(paint(hull(plate(es([[-0.05, 0.0], [0.054, 0.038], [0.062, -0.012], [0.022, -0.046], [-0.034, -0.042], [-0.052, -0.018]]),
    E, FZ - 0.01, FZ + 0.01, 0.25)), P.white, 'flat'));
  S.push(paint(hull(plate(es([[-0.03, 0.002], [0.018, 0.022], [0.025, -0.01], [0.005, -0.038], [-0.025, -0.036], [-0.036, -0.015]]),
    V(E.x - 0.003, E.y, 0), FZ + 0.004, FZ + 0.016, 0.25)), P.eye, 'flat'));
  S.push(paint(hull(plate(es([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]]),
    V(E.x + 0.006, E.y + 0.003, 0), FZ + 0.012, FZ + 0.021, 0.25)), P.white, 'flat'));
  // heavy brow
  S.push(paint(hull([
    V(0.022, E.y + 0.01, FZ + 0.035), V(0.024, E.y + 0.055, FZ + 0.025),
    V(0.17, E.y + 0.055, FZ - 0.01), V(0.17, E.y + 0.1, FZ - 0.025),
    V(0.022, E.y + 0.01, FZ - 0.03), V(0.024, E.y + 0.065, FZ - 0.04),
    V(0.17, E.y + 0.055, FZ - 0.06), V(0.17, E.y + 0.1, FZ - 0.07),
  ]), P.brow, 'y'));
  // gold forehead armor plate (between brows, up over the crown) + pearl
  C.push(gold(hull([
    V(0, E.y + 0.07, FZ + 0.03), V(0.045, E.y + 0.08, FZ + 0.0), V(-0.045, E.y + 0.08, FZ + 0.0),
    V(0.06, H.y + 0.19, H.z + 0.05), V(-0.06, H.y + 0.19, H.z + 0.05), V(0, H.y + 0.2, H.z + 0.06),
    V(0.03, E.y + 0.06, FZ - 0.04), V(-0.03, E.y + 0.06, FZ - 0.04), V(0, H.y + 0.15, H.z + 0.0),
  ])));
  C.push(pearl(V(0, E.y + 0.105, FZ + 0.0), 0.022));

  // horns: big gold sweeping back + small lower pair
  S.push(paint(tube(curveSamples(
    [V(0.085, H.y + 0.15, H.z - 0.03), V(0.14, H.y + 0.26, H.z - 0.13), V(0.18, H.y + 0.33, H.z - 0.29)],
    5, (t) => 0.062 * (1 - t) + 0.004), { seg: 6, capEnd: 0.0 }), P.goldT, 'len'));
  S.push(paint(tube(curveSamples(
    [V(0.14, H.y + 0.08, H.z - 0.08), V(0.21, H.y + 0.12, H.z - 0.17), V(0.26, H.y + 0.15, H.z - 0.27)],
    4, (t) => 0.04 * (1 - t) + 0.003), { seg: 5 }), P.goldT, 'len'));

  // cyan cheek fin-frills (flat faceted blades fanning back)
  const fin = (b, tip, h, th, up = V(0, 1, 0)) => hull([
    b.clone().addScaledVector(up, h).add(V(th, 0, 0)), b.clone().addScaledVector(up, h).add(V(-th, 0, 0)),
    b.clone().addScaledVector(up, -h).add(V(th, 0, 0)), b.clone().addScaledVector(up, -h).add(V(-th, 0, 0)),
    b.clone().add(V(th * 1.6, 0, 0.02)), tip,
  ]);
  for (const [b, tip, h] of [
    [V(0.19, H.y + 0.03, H.z - 0.02), V(0.42, H.y + 0.12, H.z - 0.16), 0.065],
    [V(0.2, H.y - 0.05, H.z + 0.02), V(0.45, H.y - 0.06, H.z - 0.1), 0.06],
    [V(0.18, H.y - 0.12, H.z + 0.05), V(0.37, H.y - 0.25, H.z - 0.04), 0.05],
  ]) S.push(finP(fin(b, tip, h, 0.02), H.y - 0.2, H.y + 0.1));

  // head crest spikes (cyan) leading into the spine row
  C.push(finP(shard(V(0, H.y + 0.15, H.z - 0.1), V(0, 1, -1), 0.05, 0.14, 4, 0.6), H.y + 0.1, H.y + 0.25));
  C.push(finP(shard(V(0, H.y + 0.02, H.z - 0.165), V(0, 0.6, -1), 0.05, 0.14, 4, 0.6), H.y, H.y + 0.1));
  C.push(finP(shard(V(0, 0.76, 0.17), V(0, 0.8, -1), 0.06, 0.15, 4, 0.6), 0.75, 0.85));

  // ================= BACK SPIKES (big angular shards down the spine) =================
  for (const [y, z, s] of [[0.66, 0.12, 1.7], [0.645, 0.0, 2.3], [0.635, -0.13, 2.4], [0.6, -0.26, 2.0], [0.54, -0.37, 1.4]])
    C.push(finP(shard(V(0, y, z), V(0, 1, -0.35), 0.06 * s, 0.15 * s, 4, 0.6), y, y + 0.14 * s));

  // side spike rows over shoulders and hips (read past the wings)
  for (const [b, d, w, l] of [
    [V(0.1, 0.66, 0.08), V(0.35, 1, -0.25), 0.05, 0.2],
    [V(0.12, 0.65, -0.06), V(0.4, 1, -0.35), 0.055, 0.22],
    [V(0.13, 0.62, -0.2), V(0.45, 1, -0.45), 0.055, 0.21],
    [V(0.11, 0.57, -0.33), V(0.4, 1, -0.6), 0.045, 0.16],
  ]) S.push(finP(shard(b, d, w, l, 4, 0.6), b.y, b.y + l));

  // ================= TAIL =================
  const tailPts = [V(0, 0.37, -0.35), V(0, 0.24, -0.56), V(0, 0.12, -0.78), V(0, 0.12, -0.99), V(0, 0.25, -1.14), V(0, 0.45, -1.17)];
  C.push(paint(tube(curveSamples(tailPts, 12, (t) => 0.125 * (1 - t) + 0.028), { seg: 8, axis: X, capEnd: 0.02 }), P.blue, 'len'));
  const tc = new THREE.CatmullRomCurve3(tailPts, false, 'centripetal');
  for (const t of [0.12, 0.27, 0.42, 0.57, 0.72]) {
    const p = tc.getPoint(t), T = tc.getTangent(t);
    const n = V(0, T.z, -T.y).normalize(); if (n.y + n.z * 0.3 < 0) n.negate();
    const r = 0.125 * (1 - t) + 0.028;
    const k = 1.2 - t * 0.6;
    C.push(finP(shard(p.clone().addScaledVector(n, r * 0.75), n.clone().addScaledVector(T, -0.5), 0.058 * k, 0.13 * k, 4, 0.6), 0, 1.2));
  }
  for (const t of [0.07, 0.19, 0.31, 0.43, 0.55]) {
    const p = tc.getPoint(t), T = tc.getTangent(t);
    const n = V(0, T.z, -T.y).normalize(); if (n.y + n.z * 0.3 < 0) n.negate();
    const r = 0.125 * (1 - t) + 0.028, w = r * 0.62, l = 0.048 * (1 - t * 0.5);
    const pts = [];
    for (const sx of [-1, 1]) for (const sl of [-1, 1]) {
      const c = p.clone().addScaledVector(T, sl * l);
      pts.push(c.clone().addScaledVector(X, sx * w).addScaledVector(n, -r * 0.55));
      pts.push(c.clone().addScaledVector(X, sx * w * 0.7).addScaledVector(n, -r * 0.92));
      pts.push(c.clone().addScaledVector(X, sx * w * 0.5).addScaledVector(n, -r * 1.06).addScaledVector(T, -sl * 0.006));
    }
    C.push(paint(hull(pts), P.belly, 'flat'));
  }
  // finned tail tip: cyan fan of blades (side pairs + centre)
  const tip = tc.getPoint(1), tT = tc.getTangent(1);
  const leaf = (b, d, side, len, w, th) => {
    d = d.clone().normalize();
    const m = b.clone().addScaledVector(d, len * 0.5);
    const n = new THREE.Vector3().crossVectors(d, side).normalize();
    return hull([b.clone().addScaledVector(side, th), b.clone().addScaledVector(side, -th),
      b.clone().addScaledVector(n, w * 0.4), b.clone().addScaledVector(n, -w * 0.4),
      m.clone().addScaledVector(n, w).addScaledVector(side, th * 0.7), m.clone().addScaledVector(n, w).addScaledVector(side, -th * 0.7),
      m.clone().addScaledVector(n, -w).addScaledVector(side, th * 0.7), m.clone().addScaledVector(n, -w).addScaledVector(side, -th * 0.7),
      b.clone().addScaledVector(d, len)]);
  };
  const tb = tip.clone().addScaledVector(tT, -0.03);
  for (const [a, len, w] of [[-1.25, 0.22, 0.05], [-0.62, 0.3, 0.065], [0.0, 0.27, 0.06], [0.6, 0.19, 0.048]])
    C.push(finP(leaf(tb, V(0, Math.cos(a), Math.sin(a)), X, len, w, 0.014), tip.y - 0.05, tip.y + 0.28));
  for (const [a, len, w] of [[0.55, 0.2, 0.05], [1.15, 0.15, 0.04]])
    S.push(finP(leaf(tb.clone().add(V(0.01, 0, 0)), V(Math.sin(a), Math.cos(a), -0.15), V(0, 0, 1), len, w, 0.012), tip.y - 0.05, tip.y + 0.25));
  // gold armor bands along the tail
  for (const t of [0.35, 0.62]) {
    const p = tc.getPoint(t), T = tc.getTangent(t), r = 0.125 * (1 - t) + 0.028 + 0.012;
    const pts = [];
    for (const dl of [-0.025, 0.025]) for (let k = 0; k < 8; k++) {
      const a = Math.PI / 8 + (2 * Math.PI * k) / 8, nn = V(0, T.z, -T.y).normalize();
      pts.push(p.clone().addScaledVector(T, dl).addScaledVector(X, Math.cos(a) * r).addScaledVector(nn, Math.sin(a) * r));
    }
    C.push(gold(hull(pts)));
  }
  C.push(gold(hull([...ring(tip.clone().addScaledVector(tT, -0.06), 0.04, 0.04, 8, 'y'), ...ring(tip.clone().addScaledVector(tT, -0.0), 0.045, 0.045, 8, 'y')])));

  // ================= RADIANT FIN-WINGS (gold bones, glowing cyan membranes) =================
  const Sh = V(0.14, 0.6, 0.0), El = V(0.42, 0.86, -0.1), Wr = V(0.6, 1.17, -0.16);
  const tips = [V(1.14, 0.8, -0.3), V(0.96, 0.36, -0.36), V(0.6, 0.28, -0.32)];
  const Bd = V(0.15, 0.55, -0.2);
  S.push(paint(tube(curveSamples([Sh, El, Wr], 6, (t) => 0.062 - 0.022 * t), { seg: 6, capEnd: 0.02 }), P.blueDk, 'y', [0.4, 1.25]));
  S.push(gold(blob(0, Wr, V(0.055, 0.055, 0.055), { jitter: 0.1 })));
  tips.forEach((T) => {
    S.push(gold(tube(curveSamples([Wr, Wr.clone().lerp(T, 0.5).add(V(0, 0.03, 0)), T], 4, (t) => 0.03 * (1 - t) + 0.014),
      { seg: 5, capEnd: 0.0 })));
  });
  S.push(gold(shard(Wr.clone().add(V(0, 0.03, 0.02)), V(-0.1, 1, 0.5), 0.037, 0.11)));
  const th = 0.006;
  const panel = (a, b, c) => {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const pts = [];
    for (const p of [a, b, c]) { pts.push(p.clone().addScaledVector(n, th)); pts.push(p.clone().addScaledVector(n, -th)); }
    S.push(paint(hull(pts), P.finT, 'y', [0.25, 1.2]));
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

  // ================= GOLDEN HALO (floating above/behind the head) =================
  {
    const hc = V(0, H.y + 0.4, H.z - 0.12), R = 0.17, tilt = -0.35;
    const q = new THREE.Quaternion().setFromAxisAngle(X, tilt);
    const N = 16, rt = 0.022, rh = 0.016;
    const at = (a, dr, dy) => V(Math.cos(a) * (R + dr), dy, Math.sin(a) * (R + dr)).applyQuaternion(q).add(hc);
    for (let k = 0; k < N; k++) {
      const a0 = (2 * Math.PI * k) / N, a1 = (2 * Math.PI * (k + 1)) / N;
      const pts = [];
      for (const a of [a0, a1]) for (const dr of [-rt, rt]) for (const dy of [-rh, rh]) pts.push(at(a, dr, dy));
      C.push(goldG(hull(pts)));
    }
    // radiant points on the halo
    for (let k = 0; k < 8; k++) {
      const a = (2 * Math.PI * k) / 8 + Math.PI / 8;
      const b = at(a, rt * 0.5, 0), d = b.clone().sub(hc).normalize();
      C.push(goldG(shard(b, d, 0.02, 0.06, 4, 0.5)));
    }
  }

  return assemble(C, S);
}

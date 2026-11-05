// Rookie Dragon (RARE): chunky faceted red dragon, gold horns/claws/spikes, spread faceted wings.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  red:    { i: 0, top: '#F2463C', bot: '#B3162A' },
  redDk:  { i: 1, top: '#E0303A', bot: '#9C1322' },
  gold:   { i: 2, top: '#FFE27A', bot: '#D9931C' },
  memb:   { i: 3, top: '#F49A22', bot: '#FFD24C' },
  cream:  { i: 4, top: '#FFEBC0', bot: '#E2B77A' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:    { i: 6, top: '#1A1416', bot: '#0C0A0B' },
  nose:   { i: 7, top: '#5A1A1E', bot: '#3A0E12' },
  brow:   { i: 8, top: '#E8363A', bot: '#B01A26' },
  goldT:  { i: 9, top: '#D9931C', bot: '#FFE68A' },
};
const P = PALETTE;
const DROP = 0.035;

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const red = (pts, lo = 0, hi = 1.0) => paint(hull(pts), P.red, 'y', [lo, hi]);
  const gold = (g) => paint(g, P.gold, 'flat');

  // ================= BODY =================
  C.push(red([
    ...ring(V(0, 0.34, -0.38), 0.12, 0.12, 10, 'z'),
    ...ring(V(0, 0.34, -0.28), 0.19, 0.18, 10, 'z'),
    ...ring(V(0, 0.35, -0.12), 0.22, 0.21, 10, 'z'),
    ...ring(V(0, 0.38, 0.04), 0.22, 0.22, 10, 'z'),
    ...ring(V(0, 0.41, 0.16), 0.2, 0.21, 10, 'z'),
    ...ring(V(0, 0.44, 0.25), 0.13, 0.14, 10, 'z'),
  ], 0.12, 0.6));
  // neck (thick)
  C.push(red([...ring(V(0, 0.46, 0.15), 0.15, 0.14, 10, 'y'), ...ring(V(0, 0.68, 0.24), 0.13, 0.12, 10, 'y')], 0.35, 0.85));

  // ================= LEGS (short, thick) =================
  S.push(red([...ring(V(0.17, 0.08, 0.22), 0.088, 0.088, 8), ...ring(V(0.17, 0.2, 0.2), 0.095, 0.098, 8),
    ...ring(V(0.15, 0.34, 0.14), 0.11, 0.12, 8)], 0.0, 0.6));
  S.push(paint(blob(0, V(0.165, 0.33, 0.14), V(0.12, 0.15, 0.135), { jitter: 0.1 }), P.red, 'y', [0.0, 0.6]));
  S.push(paint(blob(1, V(0.175, 0.26, -0.17), V(0.13, 0.155, 0.17), { jitter: 0.12 }), P.red, 'y', [0.0, 0.6]));
  S.push(red([...ring(V(0.18, 0.24, -0.16), 0.09, 0.095, 8), ...ring(V(0.19, 0.13, -0.19), 0.08, 0.08, 8),
    ...ring(V(0.19, 0.08, -0.18), 0.078, 0.078, 8)], 0.0, 0.6));
  // feet: red block + 3 big gold claws
  const foot = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.055, z + 0.01), 0.09, 0.055, 0.08, 0.028)), P.red, 'y', [0, 0.3]));
    for (const dx of [-0.056, 0, 0.056]) {
      const b = V(x + dx, 0.0, z + 0.08);
      S.push(gold(hull([
        V(b.x - 0.026, 0.0, b.z - 0.02), V(b.x + 0.026, 0.0, b.z - 0.02),
        V(b.x - 0.022, 0.055, b.z - 0.02), V(b.x + 0.022, 0.055, b.z - 0.02),
        V(b.x, 0.062, b.z + 0.0), V(b.x + dx * 0.15, 0.0, b.z + 0.075),
        V(b.x - 0.018, 0.0, b.z + 0.035), V(b.x + 0.018, 0.0, b.z + 0.035),
      ])));
    }
  };
  foot(0.175, 0.23);
  foot(0.195, -0.17);
  const nC = C.length, nS = S.length; // everything after this sits lower (shorter legs)

  // ================= BELLY PLATE (segmented cream, flush bands) =================
  const belly = [
    // [y, z, halfWidth, halfLen, tilt]
    [0.66, 0.355, 0.085, 0.034, -0.35],
    [0.59, 0.345, 0.095, 0.034, -0.28],
    [0.52, 0.34, 0.105, 0.034, -0.15],
    [0.45, 0.335, 0.115, 0.034, 0.0],
    [0.38, 0.32, 0.115, 0.034, 0.2],
    [0.31, 0.29, 0.11, 0.034, 0.45],
    [0.25, 0.235, 0.105, 0.034, 0.85],
    [0.205, 0.165, 0.1, 0.036, 1.25],
    [0.175, 0.08, 0.1, 0.038, 1.5],
    [0.165, -0.01, 0.1, 0.038, 1.57],
    [0.165, -0.1, 0.095, 0.038, 1.62],
  ];
  for (const [y, z, w, l, t] of belly) {
    const up = V(0, Math.cos(t), Math.sin(t)), n = V(0, -Math.sin(t), Math.cos(t));
    const pts = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const c = V(0, y, z).addScaledVector(up, sy * l);
      pts.push(c.clone().addScaledVector(X, sx * w).addScaledVector(n, -0.07));
      pts.push(c.clone().addScaledVector(X, sx * (w - 0.01)).addScaledVector(n, -0.005));
      pts.push(c.clone().addScaledVector(X, sx * (w - 0.035)).addScaledVector(n, 0.012).addScaledVector(up, -sy * 0.006));
    }
    C.push(paint(hull(pts), P.cream, 'y', [0.2, 0.75]));
  }
  // red chest mass the plates sit on (so the bands read flush, not stacked)
  {
    const pts = [];
    for (const [y, z, w, l, t] of belly.slice(0, 6)) {
      const up = V(0, Math.cos(t), Math.sin(t)), n = V(0, -Math.sin(t), Math.cos(t));
      for (const sy of [-1, 1]) {
        const c = V(0, y, z).addScaledVector(up, sy * l);
        for (const sx of [-1, 1]) pts.push(c.clone().addScaledVector(X, sx * (w + 0.035)).addScaledVector(n, -0.04));
        pts.push(c.clone().addScaledVector(n, -0.16));
      }
    }
    C.push(red(pts, 0.15, 0.85));
  }

  // ================= HEAD (big, boxy) =================
  const H = { y: 0.81, z: 0.3 };
  C.push(red([
    ...cbox(V(0, H.y, H.z), 0.205, 0.16, 0.16, 0.07),
    ...ring(V(0, H.y + 0.18, H.z - 0.03), 0.11, 0.1, 8, 'y'),
    V(0.215, H.y - 0.065, H.z + 0.02), V(-0.215, H.y - 0.065, H.z + 0.02),
  ], 0.55, 1.0));
  const FZ = H.z + 0.16;
  // blocky snout, nose bump up top
  C.push(red([
    ...cbox(V(0, H.y - 0.07, FZ + 0.085), 0.115, 0.06, 0.105, 0.03),
    V(0.09, H.y - 0.0, FZ - 0.02), V(-0.09, H.y - 0.0, FZ - 0.02),
    V(0.065, H.y - 0.015, FZ + 0.17), V(-0.065, H.y - 0.015, FZ + 0.17),
  ], 0.6, 0.9));
  // lower jaw
  C.push(paint(hull(cbox(V(0, H.y - 0.14, FZ + 0.045), 0.095, 0.035, 0.1, 0.02)), P.brow, 'y', [0.6, 0.72]));
  // nostrils on top-front of nose
  S.push(paint(hull([V(0.028, H.y - 0.008, FZ + 0.155), V(0.062, H.y - 0.008, FZ + 0.15), V(0.028, H.y - 0.022, FZ + 0.197),
    V(0.062, H.y - 0.022, FZ + 0.195), V(0.045, H.y - 0.03, FZ + 0.15), V(0.045, H.y - 0.04, FZ + 0.19)]), P.nose, 'flat'));
  // mouth line
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
  // heavy brow
  S.push(paint(hull([
    V(0.022, E.y + 0.01, FZ + 0.035), V(0.024, E.y + 0.055, FZ + 0.025),
    V(0.165, E.y + 0.055, FZ - 0.01), V(0.165, E.y + 0.1, FZ - 0.025),
    V(0.022, E.y + 0.01, FZ - 0.03), V(0.024, E.y + 0.065, FZ - 0.04),
    V(0.165, E.y + 0.055, FZ - 0.06), V(0.165, E.y + 0.1, FZ - 0.07),
  ]), P.brow, 'y'));

  // horns: big gold sweeping back + small lower pair
  S.push(paint(tube(curveSamples(
    [V(0.08, H.y + 0.14, H.z - 0.02), V(0.13, H.y + 0.25, H.z - 0.12), V(0.17, H.y + 0.33, H.z - 0.27)],
    5, (t) => 0.06 * (1 - t) + 0.004), { seg: 6, capEnd: 0.0 }), P.goldT, 'len'));
  S.push(paint(tube(curveSamples(
    [V(0.13, H.y + 0.07, H.z - 0.08), V(0.2, H.y + 0.11, H.z - 0.16), V(0.25, H.y + 0.15, H.z - 0.26)],
    4, (t) => 0.04 * (1 - t) + 0.003), { seg: 5 }), P.goldT, 'len'));
  // red layered frill fins on the head sides / back (flat faceted blades)
  const fin = (b, tip, h, th, up = V(0, 1, 0)) => hull([
    b.clone().addScaledVector(up, h).add(V(th, 0, 0)), b.clone().addScaledVector(up, h).add(V(-th, 0, 0)),
    b.clone().addScaledVector(up, -h).add(V(th, 0, 0)), b.clone().addScaledVector(up, -h).add(V(-th, 0, 0)),
    b.clone().add(V(th * 1.6, 0, 0.02)), tip,
  ]);
  for (const [b, tip, h] of [
    [V(0.18, H.y + 0.03, H.z - 0.06), V(0.3, H.y + 0.1, H.z - 0.22), 0.05],
    [V(0.19, H.y - 0.05, H.z - 0.02), V(0.32, H.y - 0.06, H.z - 0.17), 0.045],
    [V(0.17, H.y - 0.11, H.z + 0.02), V(0.27, H.y - 0.19, H.z - 0.1), 0.035],
    [V(0.12, H.y + 0.11, H.z - 0.1), V(0.21, H.y + 0.23, H.z - 0.25), 0.045],
  ]) S.push(paint(fin(b, tip, h, 0.022), P.redDk, 'y', [H.y - 0.2, H.y + 0.2]));
  // head crest spikes (gold)
  C.push(gold(shard(V(0, H.y + 0.16, H.z + 0.03), V(0, 1, -0.4), 0.032, 0.07)));
  C.push(gold(shard(V(0, H.y + 0.13, H.z - 0.1), V(0, 1, -1), 0.032, 0.08)));
  C.push(gold(shard(V(0, H.y + 0.02, H.z - 0.16), V(0, 0.6, -1), 0.03, 0.08)));

  // ================= BACK SPIKES (big gold) =================
  for (const [y, z, s] of [[0.6, 0.13, 1.1], [0.58, 0.02, 1.35], [0.57, -0.1, 1.3], [0.55, -0.22, 1.1], [0.49, -0.32, 0.85]])
    C.push(gold(shard(V(0, y, z), V(0, 1, -0.55), 0.055 * s, 0.11 * s)));
  // shoulder spikes
  S.push(gold(shard(V(0.11, 0.57, 0.11), V(0.45, 1, 0.15), 0.065, 0.16)));
  S.push(gold(shard(V(0.16, 0.52, -0.05), V(0.7, 1, -0.3), 0.06, 0.15)));
  S.push(gold(shard(V(0.14, 0.47, -0.2), V(0.6, 1, -0.6), 0.045, 0.1)));

  // ================= TAIL =================
  const tailPts = [V(0, 0.34, -0.3), V(0, 0.22, -0.5), V(0, 0.12, -0.7), V(0, 0.12, -0.9), V(0, 0.24, -1.04), V(0, 0.44, -1.06)];
  C.push(paint(tube(curveSamples(tailPts, 12, (t) => 0.11 * (1 - t) + 0.026), { seg: 8, axis: X, capEnd: 0.02 }), P.red, 'len'));
  const tc = new THREE.CatmullRomCurve3(tailPts, false, 'centripetal');
  for (const t of [0.14, 0.3, 0.46, 0.62, 0.78]) {
    const p = tc.getPoint(t), T = tc.getTangent(t);
    const n = V(0, T.z, -T.y).normalize(); if (n.y + n.z * 0.3 < 0) n.negate();
    const r = 0.11 * (1 - t) + 0.026;
    const k = 1.15 - t * 0.6;
    C.push(gold(shard(p.clone().addScaledVector(n, r * 0.75), n.clone().addScaledVector(T, -0.6), 0.045 * k, 0.09 * k)));
  }
  // cream underside keel (segmented by its own facets)
  {
    const sm = [];
    for (let k = 0; k <= 9; k++) {
      const t = 0.03 + k * 0.075, p = tc.getPoint(t), T = tc.getTangent(t);
      const n = V(0, T.z, -T.y).normalize(); if (n.y + n.z * 0.3 < 0) n.negate();
      const r = 0.11 * (1 - t) + 0.026;
      sm.push({ p: p.clone().addScaledVector(n, -r * 0.5), rx: r * 0.68, ry: r * 0.68 });
    }
    C.push(paint(tube(sm, { seg: 6, axis: X, phase: Math.PI / 6 }), P.cream, 'flat'));
  }
  // spade tip: centre blade + side barbs
  const tip = tc.getPoint(1), tT = tc.getTangent(1);
  C.push(gold(hull([tip.clone().addScaledVector(tT, 0.22), tip.clone().addScaledVector(tT, -0.02),
    V(0.1, tip.y + 0.05, tip.z), V(-0.1, tip.y + 0.05, tip.z),
    V(0, tip.y + 0.05, tip.z - 0.075), V(0, tip.y + 0.05, tip.z + 0.075)])));
  C.push(gold(shard(V(0, tip.y + 0.03, tip.z + 0.02), V(0, -0.4, 1), 0.03, 0.1)));
  S.push(gold(shard(V(0.06, tip.y + 0.04, tip.z), V(1, -0.7, 0), 0.035, 0.11)));
  C.push(gold(shard(V(0, tip.y + 0.03, tip.z - 0.02), V(0, -0.4, -1), 0.03, 0.1)));

  // ================= WINGS =================
  const Sh = V(0.13, 0.55, 0.0), El = V(0.33, 0.82, -0.08), Wr = V(0.44, 1.16, -0.14);
  const tips = [V(1.0, 0.72, -0.3), V(0.84, 0.3, -0.36), V(0.52, 0.24, -0.32)];
  const Bd = V(0.14, 0.5, -0.2);
  // arm (chunky) + wrist knuckle
  S.push(paint(tube(curveSamples([Sh, El, Wr], 6, (t) => 0.06 - 0.022 * t), { seg: 6, capEnd: 0.02 }), P.red, 'y', [0.4, 1.2]));
  S.push(paint(blob(0, Wr, V(0.05, 0.05, 0.05), { jitter: 0.1 }), P.red, 'y', [0.9, 1.25]));
  // fingers
  tips.forEach((T, i) => {
    S.push(paint(tube(curveSamples([Wr, Wr.clone().lerp(T, 0.5).add(V(0, 0.03, 0)), T], 4, (t) => 0.032 * (1 - t) + 0.016),
      { seg: 5, capEnd: 0.0 }), P.redDk, 'y', [0.2, 1.2]));
  });
  // wrist claw (gold hook)
  S.push(gold(shard(Wr.clone().add(V(0, 0.03, 0.02)), V(-0.1, 1, 0.5), 0.035, 0.1)));
  // membranes: flat faceted panels
  const th = 0.006;
  const panel = (a, b, c) => {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const pts = [];
    for (const p of [a, b, c]) { pts.push(p.clone().addScaledVector(n, th)); pts.push(p.clone().addScaledVector(n, -th)); }
    S.push(paint(hull(pts), P.memb, 'y', [0.2, 1.1]));
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

// Game name: MeshPart name in Roblox and the export file name
export const NAME = 'RookieDragon';

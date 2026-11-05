// Haymaker Hydra (Robux egg, Legends Egg): green three-headed hydra, gold spikes, armored necks,
// ornate gold armor with glowing cyan runes, battle scars. Chunky faceted style.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble, mirrorX } from '../kit.js';

export const PALETTE = {
  green:  { i: 0, top: '#4FCB4A', bot: '#1E8A3A' },
  greenDk:{ i: 1, top: '#3BAF45', bot: '#17702F' },
  belly:  { i: 2, top: '#E6F29A', bot: '#B9D25E' },
  gold:   { i: 3, top: '#FFE25C', bot: '#E8A317' },
  goldT:  { i: 4, top: '#D9931C', bot: '#FFE68A' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:    { i: 6, top: '#1A1416', bot: '#0C0A0B' },
  nose:   { i: 7, top: '#1F4A22', bot: '#0F2A12' },
  brow:   { i: 8, top: '#3DB443', bot: '#1C7A33' },
  scale:  { i: 12, top: '#C8E668', bot: '#86BD3C' },
  rune:   { i: 9, top: '#B8FFFF', bot: '#3FE0FF', glow: true },
  scar:   { i: 10, top: '#F6E2BE', bot: '#DDBF94' },
  goldDk: { i: 11, top: '#F2B230', bot: '#C47F12' },
};
const P = PALETTE;

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0), Y = V(0, 1, 0);
  const green = (pts, lo = 0, hi = 1) => paint(hull(pts), P.green, 'y', [lo, hi]);
  const gold = (g) => paint(g, P.gold, 'flat');

  // thin bar between 2D points (u,v) on a surface frame (origin o, axes ax/ay, normal n)
  const bar = (o, ax, ay, n, u0, v0, u1, v1, w = 0.009, d0 = -0.01, d1 = 0.006) => {
    const a = o.clone().addScaledVector(ax, u0).addScaledVector(ay, v0);
    const b = o.clone().addScaledVector(ax, u1).addScaledVector(ay, v1);
    const dir = b.clone().sub(a).normalize();
    const side = new THREE.Vector3().crossVectors(n, dir).normalize().multiplyScalar(w);
    const pts = [];
    for (const p of [a.clone().addScaledVector(dir, -w * 0.6), b.clone().addScaledVector(dir, w * 0.6)])
      for (const s of [-1, 1]) for (const d of [d0, d1]) pts.push(p.clone().addScaledVector(side, s).addScaledVector(n, d));
    return hull(pts);
  };
  const frame = (n, upHint = Y) => {
    n = n.clone().normalize();
    const ax = new THREE.Vector3().crossVectors(upHint, n).normalize();
    const ay = new THREE.Vector3().crossVectors(n, ax).normalize();
    return { n, ax, ay };
  };

  // ================= BODY (stocky barrel) =================
  C.push(green([
    ...ring(V(0, 0.36, -0.36), 0.12, 0.11, 10, 'z'),
    ...ring(V(0, 0.36, -0.27), 0.2, 0.18, 10, 'z'),
    ...ring(V(0, 0.38, -0.1), 0.235, 0.21, 10, 'z'),
    ...ring(V(0, 0.4, 0.05), 0.235, 0.215, 10, 'z'),
    ...ring(V(0, 0.43, 0.17), 0.2, 0.2, 10, 'z'),
    ...ring(V(0, 0.46, 0.25), 0.13, 0.13, 10, 'z'),
  ], 0.15, 0.62));
  // belly underside
  C.push(paint(hull([...cbox(V(0, 0.22, -0.03), 0.15, 0.04, 0.22, 0.03)]), P.belly, 'flat'));

  // ================= LEGS =================
  S.push(green([...ring(V(0.19, 0.08, 0.2), 0.1, 0.1, 8), ...ring(V(0.19, 0.19, 0.19), 0.11, 0.11, 8),
    ...ring(V(0.18, 0.3, 0.15), 0.12, 0.125, 8), ...ring(V(0.16, 0.39, 0.12), 0.09, 0.1, 8)], 0.0, 0.58));
  S.push(paint(blob(1, V(0.195, 0.26, -0.2), V(0.145, 0.15, 0.17), { jitter: 0.12 }), P.green, 'y', [0, 0.58]));
  S.push(green([...ring(V(0.2, 0.22, -0.19), 0.105, 0.11, 8), ...ring(V(0.205, 0.13, -0.21), 0.098, 0.098, 8),
    ...ring(V(0.205, 0.08, -0.2), 0.096, 0.096, 8)], 0, 0.58));
  const foot = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.05, z + 0.01), 0.104, 0.05, 0.09, 0.028)), P.greenDk, 'y', [0, 0.3]));
    for (const dx of [-0.062, 0, 0.062]) {
      const b = V(x + dx, 0.0, z + 0.088);
      S.push(gold(hull([
        V(b.x - 0.026, 0.0, b.z - 0.02), V(b.x + 0.026, 0.0, b.z - 0.02),
        V(b.x - 0.022, 0.05, b.z - 0.02), V(b.x + 0.022, 0.05, b.z - 0.02),
        V(b.x, 0.056, b.z), V(b.x + dx * 0.15, 0.0, b.z + 0.07),
        V(b.x - 0.018, 0.0, b.z + 0.035), V(b.x + 0.018, 0.0, b.z + 0.035),
      ])));
    }
    // gold ankle cuff
    S.push(paint(hull([...ring(V(x, 0.095, z), 0.112, 0.112, 8), ...ring(V(x, 0.13, z), 0.114, 0.114, 8)]), P.goldDk, 'flat'));
  };
  foot(0.19, 0.205);
  foot(0.205, -0.2);
  const nC = C.length, nS = S.length; // everything after this sits lower (shorter legs)

  // ================= TAIL =================
  const tailPts = [V(0, 0.36, -0.32), V(0, 0.26, -0.5), V(0, 0.16, -0.66), V(0, 0.15, -0.82), V(0, 0.24, -0.94)];
  C.push(paint(tube(curveSamples(tailPts, 10, (t) => 0.1 * (1 - t) + 0.025), { seg: 8, axis: X, capEnd: 0.02 }), P.green, 'len'));
  const tc = new THREE.CatmullRomCurve3(tailPts, false, 'centripetal');
  for (const t of [0.12, 0.3, 0.48, 0.66, 0.84]) {
    const p = tc.getPoint(t), T = tc.getTangent(t);
    const n = V(0, T.z, -T.y).normalize(); if (n.y + n.z * 0.3 < 0) n.negate();
    const r = 0.1 * (1 - t) + 0.025, k = 1.1 - t * 0.55;
    C.push(gold(shard(p.clone().addScaledVector(n, r * 0.75), n.clone().addScaledVector(T, -0.6), 0.045 * k, 0.09 * k)));
  }
  { const tip = tc.getPoint(1), tT = tc.getTangent(1);
    C.push(gold(shard(tip.clone().addScaledVector(tT, -0.01), tT, 0.05, 0.13)));
    S.push(gold(shard(tip.clone().add(V(0.015, -0.01, 0.0)), V(1, 0.2, -0.6), 0.03, 0.08))); }

  // ================= GOLD ARMOR =================
  // chest plate (centre, under the necks)
  C.push(gold(hull([
    ...ring(V(0, 0.41, 0.335), 0.15, 0.115, 8, 'z'),
    ...ring(V(0, 0.4, 0.2), 0.215, 0.18, 8, 'z'),
  ])));
  // runes on chest plate
  { const n = V(0, 0, 1), ax = X, ay = Y;
    const o = V(0, 0.405, 0.335);
    for (const s of [[0, -0.085, 0, 0.085], [0, 0.065, -0.055, 0], [0, 0.065, 0.055, 0], [-0.055, 0, 0, -0.065], [0.055, 0, 0, -0.065]])
      C.push(paint(bar(o, ax, ay, n, ...s, 0.011), P.rune, 'flat'));
  }
  // back saddle armour with rune
  C.push(gold(hull([...cbox(V(0, 0.6, -0.08), 0.16, 0.035, 0.16, 0.03), ...ring(V(0, 0.565, -0.08), 0.2, 0.2, 8, 'y')])));
  { const n = Y, ax = X, ay = V(0, 0, 1), o = V(0, 0.64, -0.08);
    for (const s of [[0, -0.09, 0, 0.09], [-0.07, 0, 0.07, 0], [-0.05, -0.06, 0.05, 0.06]])
      C.push(paint(bar(o, ax, ay, n, ...s, 0.012, -0.01, 0.006), P.rune, 'flat'));
  }
  // shoulder pauldrons
  S.push(gold(hull([...ring(V(0.21, 0.52, 0.1), 0.1, 0.11, 8, 'x'), ...ring(V(0.27, 0.43, 0.11), 0.11, 0.12, 8, 'x'),
    V(0.15, 0.6, 0.08)])));
  { const { n, ax, ay } = frame(V(1, 0.6, 0.1));
    const o = V(0.28, 0.51, 0.11).addScaledVector(n, 0.0);
    for (const s of [[0, -0.05, 0, 0.05], [-0.035, 0.0, 0.035, 0.0]])
      S.push(paint(bar(o, ax, ay, n, ...s, 0.01, -0.015, 0.007), P.rune, 'flat'));
  }
  S.push(gold(shard(V(0.25, 0.55, 0.1), V(0.6, 1, 0), 0.05, 0.12)));
  // hip plates
  S.push(gold(hull([...ring(V(0.25, 0.44, -0.2), 0.09, 0.1, 8, 'x'), ...ring(V(0.29, 0.36, -0.2), 0.1, 0.11, 8, 'x'),
    V(0.18, 0.52, -0.2)])));
  { const { n, ax, ay } = frame(V(1, 0.5, 0));
    const o = V(0.285, 0.41, -0.2);
    for (const sg of [[-0.04, 0.03, 0.0, -0.03], [0.0, -0.03, 0.04, 0.03]])
      S.push(paint(bar(o, ax, ay, n, ...sg, 0.009, -0.015, 0.007), P.rune, 'flat'));
  }
  S.push(gold(shard(V(0.26, 0.47, -0.22), V(0.6, 1, -0.3), 0.045, 0.1)));

  // battle scars on the flanks (three claw slashes)
  { const { n, ax, ay } = frame(V(1, 0.15, 0));
    const o = V(0.235, 0.36, -0.03);
    for (const k of [-1, 0, 1])
      S.push(paint(bar(o, ax, ay, n, -0.05 + k * 0.035, 0.055, 0.04 + k * 0.035, -0.05, 0.008, -0.02, 0.005), P.scar, 'flat'));
  }

  // back spikes (gold shards)
  for (const [y, z, s] of [[0.58, -0.27, 1.0], [0.47, -0.36, 0.8]])
    C.push(gold(shard(V(0, y, z), V(0, 1, -0.6), 0.05 * s, 0.11 * s)));

  // ================= NECKS + HEADS =================
  const neckR = (t) => 0.112 - 0.02 * t;
  const neck = (pts, out) => {
    out.push(paint(tube(curveSamples(pts, 8, neckR), { seg: 8, capStart: 0.0, capEnd: 0.0, phase: Math.PI / 8 }),
      P.green, 'len'));
    const c = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    // gold armour bands with a rune dot
    for (const t of [0.32, 0.78]) {
      const p = c.getPoint(t), T = c.getTangent(t), r = neckR(t) * 1.17;
      const B = Math.abs(T.y) > 0.95 ? X.clone() : new THREE.Vector3().crossVectors(T, Y).normalize();
      const A = new THREE.Vector3().crossVectors(B, T).normalize();
      const pts2 = [];
      for (const o of [-0.03, 0.03]) for (let k = 0; k < 8; k++) {
        const th = Math.PI / 8 + (k * Math.PI) / 4;
        pts2.push(p.clone().addScaledVector(T, o).addScaledVector(A, Math.cos(th) * r).addScaledVector(B, Math.sin(th) * r));
      }
      out.push(gold(hull(pts2)));
      // glowing rune gem on the front of the band
      let fr = A.clone(); if (fr.z < 0) fr.negate();
      const gc = p.clone().addScaledVector(fr, r * 0.93);
      const gs = [];
      for (const [u, v] of [[0, 0.022], [0.016, 0], [0, -0.022], [-0.016, 0]]) for (const d of [-0.01, 0.014])
        gs.push(gc.clone().addScaledVector(B, u).addScaledVector(T, v).addScaledVector(fr, d));
      out.push(paint(hull(gs), P.rune, 'flat'));
    }
    // gold spikes along the back of the neck (A side = up/back)
    for (const t of [0.15, 0.46, 0.76]) {
      const p = c.getPoint(t), T = c.getTangent(t);
      const B = new THREE.Vector3().crossVectors(T, Y).normalize();
      let back = new THREE.Vector3().crossVectors(T, B).normalize(); // perpendicular
      if (back.z > 0) back.negate();
      out.push(gold(shard(p.clone().addScaledVector(back, neckR(t) * 0.8), back.clone().addScaledVector(Y, 0.3), 0.04, 0.09)));
    }
    // yellow-green chevron scales down the front of the neck, overlapping like shingles
    for (const t of [0.12, 0.55, 0.98]) {
      const p = c.getPoint(t), T = c.getTangent(t);
      const B = new THREE.Vector3().crossVectors(T, Y).normalize();
      let fr = new THREE.Vector3().crossVectors(T, B).normalize(); if (fr.z < 0) fr.negate();
      const r = neckR(t);
      const top = p.clone().addScaledVector(T, 0.05);
      out.push(paint(hull([
        top.clone().addScaledVector(B, r * 0.62).addScaledVector(fr, r * 0.7),
        top.clone().addScaledVector(B, -r * 0.62).addScaledVector(fr, r * 0.7),
        top.clone().addScaledVector(B, r * 0.5).addScaledVector(fr, r * 0.97),
        top.clone().addScaledVector(B, -r * 0.5).addScaledVector(fr, r * 0.97),
        top.clone().addScaledVector(fr, r * 1.06),
        p.clone().addScaledVector(T, -0.045).addScaledVector(fr, r * 1.04),
        p.clone().addScaledVector(T, -0.045).addScaledVector(fr, r * 0.8),
      ]), P.scale, 'y', [p.y - 0.06, p.y + 0.06]));
    }
  };

  const head = (out, pos, yaw, sc, crown) => {
    const L = [], LS = [];
    const g = (pts, lo, hi) => paint(hull(pts), P.green, 'y', [lo, hi]);
    // cranium
    L.push(g([...cbox(V(0, 0, 0), 0.13, 0.105, 0.115, 0.048), ...ring(V(0, 0.115, -0.01), 0.08, 0.075, 8, 'y'),
      V(0.138, -0.055, 0.03), V(-0.138, -0.055, 0.03),
      V(0.128, 0.105, 0.075), V(-0.128, 0.105, 0.075), V(0.124, 0.1, -0.04), V(-0.124, 0.1, -0.04)], -0.12, 0.13));
    const FZ = 0.115;
    // snout
    L.push(g([...cbox(V(0, -0.045, FZ + 0.065), 0.09, 0.05, 0.085, 0.026),
      V(0.075, 0.012, FZ - 0.02), V(-0.075, 0.012, FZ - 0.02), V(0.055, -0.0, FZ + 0.135), V(-0.055, -0.0, FZ + 0.135)], -0.12, 0.05));
    // lower jaw
    L.push(paint(hull(cbox(V(0, -0.108, FZ + 0.035), 0.08, 0.03, 0.09, 0.016)), P.belly, 'y', [-0.14, -0.08]));
    // nostrils + mouth
    LS.push(paint(hull([V(0.022, -0.0, FZ + 0.128), V(0.05, -0.0, FZ + 0.124), V(0.022, -0.013, FZ + 0.152),
      V(0.05, -0.013, FZ + 0.15), V(0.036, -0.02, FZ + 0.12), V(0.036, -0.028, FZ + 0.148)]), P.nose, 'flat'));
    LS.push(paint(hull([V(0, -0.083, FZ + 0.153), V(0, -0.074, FZ + 0.153), V(0.07, -0.083, FZ + 0.15),
      V(0.07, -0.074, FZ + 0.15), V(0, -0.078, FZ + 0.138), V(0.07, -0.078, FZ + 0.135),
      V(0.093, -0.088, FZ + 0.1), V(0.093, -0.079, FZ + 0.1), V(0.085, -0.084, FZ + 0.09)]), P.nose, 'flat'));
    // fang
    LS.push(paint(shard(V(0.06, -0.08, FZ + 0.142), V(0, -1, 0.15), 0.011, 0.03, 3), P.white, 'flat'));
    // fierce eyes
    const E = V(0.064, 0.035, 0);
    LS.push(paint(hull(plate([[-0.042, 0.0], [0.044, 0.032], [0.05, -0.01], [0.018, -0.038], [-0.028, -0.035], [-0.044, -0.015]],
      E, FZ - 0.01, FZ + 0.01)), P.white, 'flat'));
    LS.push(paint(hull(plate([[-0.026, 0.002], [0.015, 0.019], [0.021, -0.008], [0.004, -0.032], [-0.021, -0.03], [-0.03, -0.013]],
      V(E.x - 0.002, E.y, 0), FZ + 0.004, FZ + 0.016)), P.eye, 'flat'));
    LS.push(paint(hull(plate([[-0.006, -0.006], [0.006, -0.006], [0.006, 0.006], [-0.006, 0.006]],
      V(E.x + 0.005, E.y + 0.002, 0), FZ + 0.012, FZ + 0.02)), P.white, 'flat'));
    // heavy brow
    LS.push(paint(hull([
      V(0.016, E.y + 0.008, FZ + 0.032), V(0.018, E.y + 0.048, FZ + 0.022),
      V(0.122, E.y + 0.048, FZ - 0.01), V(0.12, E.y + 0.076, FZ - 0.022),
      V(0.016, E.y + 0.008, FZ - 0.03), V(0.018, E.y + 0.058, FZ - 0.04),
      V(0.122, E.y + 0.048, FZ - 0.045), V(0.12, E.y + 0.076, FZ - 0.05),
    ]), P.brow, 'y', [0.0, 0.14]));
    // gold horns sweeping back
    LS.push(paint(tube(curveSamples([V(0.075, 0.1, -0.03), V(0.11, 0.18, -0.11), V(0.13, 0.22, -0.22)],
      4, (t) => 0.042 * (1 - t) + 0.004), { seg: 5 }), P.goldT, 'len'));
    LS.push(gold(shard(V(0.13, 0.0, -0.04), V(1, 0.3, -0.9), 0.035, 0.1)));
    LS.push(gold(shard(V(0.12, -0.07, 0.0), V(0.9, -0.3, -0.8), 0.028, 0.08)));
    // ornate gold helm plate on the forehead with a glowing rune gem
    L.push(gold(hull([V(0, 0.122, 0.03), V(0.06, 0.112, 0.0), V(-0.06, 0.112, 0.0), V(0, 0.125, -0.08),
      V(0.05, 0.1, -0.07), V(-0.05, 0.1, -0.07), V(0, 0.09, 0.105), V(0.03, 0.085, 0.09), V(-0.03, 0.085, 0.09),
      V(0, 0.07, 0.11)])));
    L.push(paint(hull([V(0, 0.118, 0.085), V(0.02, 0.11, 0.07), V(-0.02, 0.11, 0.07), V(0, 0.122, 0.04),
      V(0, 0.096, 0.112), V(0, 0.1, 0.07)]), P.rune, 'flat'));
    if (crown) {
      L.push(gold(shard(V(0, 0.12, -0.03), V(0, 1, -0.2), 0.04, 0.11)));
      LS.push(gold(shard(V(0.045, 0.11, -0.04), V(0.5, 1, -0.2), 0.032, 0.085)));
    } else {
      L.push(gold(shard(V(0, 0.12, -0.04), V(0, 1, -0.5), 0.036, 0.085)));
      // battle scar across the brow/cheek (mirrored on both side heads)
      L.push(paint(bar(V(0.134, -0.03, 0.0), V(0, 0, -1), Y, X, -0.04, 0.035, 0.035, -0.035, 0.007, -0.03, 0.008), P.scar, 'flat'));
    }
    const all = [...L, ...LS, ...LS.map((m) => mirrorX(m))];
    const M = new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromAxisAngle(Y, yaw), V(sc, sc, sc));
    for (const m of all) { m.applyMatrix4(M); m.computeVertexNormals(); out.push(m); }
  };

  // centre neck + head
  neck([V(0, 0.46, 0.2), V(0, 0.6, 0.27), V(0, 0.73, 0.29), V(0, 0.82, 0.3)], C);
  head(C, V(0, 0.96, 0.33), 0, 1.37, true);
  // side necks + heads (right side, mirrored)
  neck([V(0.11, 0.46, 0.17), V(0.23, 0.55, 0.2), V(0.34, 0.63, 0.22), V(0.4, 0.69, 0.24)], S);
  head(S, V(0.43, 0.79, 0.27), 0.25, 1.2, false);
  const DROP = 0.04;
  for (const g of [...C.slice(nC), ...S.slice(nS)]) g.translate(0, -DROP, 0);

  return assemble(C, S);
}

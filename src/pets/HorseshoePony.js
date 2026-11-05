// Horseshoe Pony (ROBUX EGG, Lucky Egg): chunky faceted golden pony with a white shard mane, lucky golden
// horseshoes on every hoof, clover + gold-coin charms, small gold horns, gold armour bits and glowing clover runes.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  body:    { i: 0, top: '#F7C443', bot: '#C98F22' },
  muzzle:  { i: 1, top: '#FFF3CF', bot: '#EED08E' },
  mane:    { i: 2, top: '#FFFFFF', bot: '#D9E0EE' },
  gold:    { i: 3, top: '#FFE27A', bot: '#E0A82A' },
  eye:     { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white:   { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  brow:    { i: 6, top: '#E3AE3A', bot: '#A87418' },
  clover:  { i: 7, top: '#8CFF6E', bot: '#22D04E', glow: true },
  cloth:   { i: 8, top: '#2FBF5E', bot: '#15803A' },
  coin:    { i: 9, top: '#FFEC9A', bot: '#E8B232' },
  coinIn:  { i: 10, top: '#F2CC56', bot: '#C99422' },
  nostril: { i: 11, top: '#9A5A1E', bot: '#6A3A10' },
  hoof:    { i: 12, top: '#FFF6E6', bot: '#E6D6BE' },
  inner:   { i: 13, top: '#F7A86A', bot: '#D9783A' },
  stem:    { i: 14, top: '#3CCB5E', bot: '#1E9A40' },
};
const SW = PALETTE;

// rotate points about pivot by yaw (around Y)
function yaw(pts, pivot, a) {
  const q = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), a);
  return pts.map((p) => p.clone().sub(pivot).applyQuaternion(q).add(pivot));
}

// segmented arc band. frame: centre c, in-plane unit axes u, v, thickness axis w.
// angles a0..a1 (radians), radius r, band width bw (radial), thickness th (along w)
function arcBand(out, sw, c, u, v, w, r, bw, th, a0, a1, n, flare = 0, mode = 'flat') {
  const P = (a, rr, tt) => c.clone().addScaledVector(u, Math.cos(a) * rr).addScaledVector(v, Math.sin(a) * rr).addScaledVector(w, tt);
  for (let k = 0; k < n; k++) {
    const aa = a0 + (a1 - a0) * k / n, ab = a0 + (a1 - a0) * (k + 1) / n;
    const fa = (k === 0 ? flare : 0), fb = (k === n - 1 ? flare : 0);
    const pts = [];
    for (const [a, f] of [[aa, fa], [ab, fb]]) for (const rr of [r - bw / 2 - f, r + bw / 2 + f]) for (const tt of [-th / 2, th / 2]) pts.push(P(a, rr, tt));
    out.push(paint(hull(pts), sw, mode, mode === 'y' ? [c.y - th / 2 - 0.01, c.y + th / 2] : null));
  }
}

// flat disc (n-gon prism) centre c, normal w
function disc(c, w, r, th, n = 8) {
  w = w.clone().normalize();
  const u = Math.abs(w.y) > 0.9 ? V(1, 0, 0) : new THREE.Vector3().crossVectors(V(0, 1, 0), w).normalize();
  const v = new THREE.Vector3().crossVectors(w, u).normalize();
  const pts = [];
  for (let k = 0; k < n; k++) {
    const a = Math.PI / n + 2 * Math.PI * k / n;
    for (const t of [-th / 2, th / 2]) pts.push(c.clone().addScaledVector(u, Math.cos(a) * r).addScaledVector(v, Math.sin(a) * r).addScaledVector(w, t));
  }
  return hull(pts);
}

// four-leaf clover in the plane (u, v) facing w; leaf = two round lobes (heart)
function clover(out, c, u, v, w, s, th, sw = SW.clover, rot = Math.PI / 4) {
  for (let L = 0; L < 4; L++) {
    const a = rot + L * Math.PI / 2;
    const d = u.clone().multiplyScalar(Math.cos(a)).addScaledVector(v, Math.sin(a));
    const pe = u.clone().multiplyScalar(-Math.sin(a)).addScaledVector(v, Math.cos(a));
    for (const sg of [-1, 1]) {
      const lc = c.clone().addScaledVector(d, s * 0.66).addScaledVector(pe, sg * s * 0.27);
      // lobe: hull of an n-gon around lc, plus the leaf point at the centre (heart tip)
      const pts = [];
      for (let k = 0; k < 5; k++) {
        const b = 2 * Math.PI * k / 5 + Math.PI / 2;
        for (const t of [-th / 2, th / 2])
          pts.push(lc.clone().addScaledVector(d, Math.cos(b) * s * 0.3).addScaledVector(pe, Math.sin(b) * s * 0.3).addScaledVector(w, t));
      }
      for (const t of [-th / 2, th / 2]) pts.push(c.clone().addScaledVector(d, s * 0.08).addScaledVector(w, t));
      out.push(paint(hull(pts), sw, 'flat'));
    }
  }
}

export function buildGeometry() {
  const C = [], S = [];
  const body = (pts, lo = 0.0, hi = 1.0) => paint(hull(pts), SW.body, 'y', [lo, hi]);
  const gold = (g) => paint(g, SW.gold, 'y');
  const goldF = (g) => paint(g, SW.gold, 'flat');
  const mane = (g) => paint(g, SW.mane, 'y');

  // ================= TORSO (stocky barrel) =================
  C.push(body([
    ...ring(V(0, 0.43, -0.32), 0.1, 0.1, 10, 'z'),
    ...ring(V(0, 0.425, -0.26), 0.175, 0.17, 10, 'z'),
    ...ring(V(0, 0.42, -0.1), 0.19, 0.185, 10, 'z'),
    ...ring(V(0, 0.43, 0.06), 0.19, 0.19, 10, 'z'),
    ...ring(V(0, 0.45, 0.18), 0.17, 0.18, 10, 'z'),
    ...ring(V(0, 0.48, 0.25), 0.115, 0.13, 10, 'z'),
  ], 0.22, 0.72));
  // chest bulge
  C.push(paint(blob(1, V(0, 0.5, 0.2), V(0.15, 0.15, 0.115), { jitter: 0.08 }), SW.body, 'y', [0.3, 0.75]));
  // neck (short, thick)
  C.push(body([
    ...ring(V(0, 0.5, 0.15), 0.14, 0.14, 8, 'y'),
    ...ring(V(0, 0.68, 0.22), 0.12, 0.12, 8, 'y'),
    ...ring(V(0, 0.76, 0.25), 0.118, 0.118, 8, 'y'),
  ], 0.4, 1.0));

  // ================= LEGS + LUCKY HORSESHOES =================
  const LS = [];
  const leg = (x, z, top, thick, kz) => {
    const f = 1.12;
    const S = LS;
    // tapered pony leg: slim cannon, faceted knee/hock bulge, thick forearm/gaskin
    S.push(body([...ring(V(x, 0.1, z), 0.064 * f, 0.064 * f, 8), ...ring(V(x, 0.15, z), 0.066 * f, 0.068 * f, 8),
      ...ring(V(x, 0.205, z + kz), 0.084 * f, 0.09 * f, 6, 'y', 0),
      ...ring(V(x - 0.005, 0.27, z), thick * 0.95, thick * 1.0, 8),
      ...ring(V(x - 0.01, top, z), thick * 1.06, thick * 1.16, 8)], 0.0, 0.5));
    // white fetlock feathering (shards) over the hoof top
    S.push(paint(hull([...ring(V(x, 0.085, z), 0.082 * f, 0.085 * f, 8), ...ring(V(x, 0.14, z), 0.072 * f, 0.074 * f, 8)]), SW.mane, 'y', [0.07, 0.15]));
    for (let k = 0; k < 5; k++) {
      const a = k * 2 * Math.PI / 5;
      const d = V(Math.sin(a), -0.9, Math.cos(a));
      S.push(mane(shard(V(x + Math.sin(a) * 0.065 * f, 0.11, z + Math.cos(a) * 0.065 * f), d, 0.032, 0.052)));
    }
    // cream hoof
    S.push(paint(hull([...ring(V(x, 0.0, z + 0.008), 0.08 * f, 0.086 * f, 8), ...ring(V(x, 0.075, z), 0.07 * f, 0.072 * f, 8)]), SW.hoof, 'y', [0, 0.08]));
    // golden horseshoe wrapped around the hoof base (open at the back) + nail studs
    const hc = V(x, 0.024, z + 0.008);
    const R = 0.088 * f;
    arcBand(S, SW.gold, hc, V(0, 0, 1), V(1, 0, 0), V(0, 1, 0), R, 0.024, 0.048,
      -Math.PI * 0.78, Math.PI * 0.78, 7, 0.006, 'y');
    for (const a of [-1.6, -0.75, 0.75, 1.6]) {
      S.push(paint(disc(V(x + Math.sin(a) * (R + 0.01), 0.026, z + 0.008 + Math.cos(a) * (R + 0.01)), V(Math.sin(a), 0, Math.cos(a)), 0.008, 0.008, 4), SW.nostril, 'flat'));
    }
  };
  leg(0.13, 0.16, 0.38, 0.092, 0.016);
  leg(0.135, -0.23, 0.34, 0.09, -0.024);
  // shoulders / haunches
  S.push(paint(blob(1, V(0.115, 0.4, 0.14), V(0.088, 0.115, 0.1), { jitter: 0.04 }), SW.body, 'y', [0.2, 0.7]));
  S.push(paint(blob(1, V(0.12, 0.41, -0.21), V(0.092, 0.135, 0.13), { jitter: 0.05 }), SW.body, 'y', [0.2, 0.7]));

  // ================= HEAD (big, boxy) =================
  const H = { y: 0.85, z: 0.3 };
  C.push(body([
    ...cbox(V(0, H.y + 0.03, H.z), 0.165, 0.11, 0.14, 0.05),
    ...cbox(V(0, H.y - 0.06, H.z + 0.035), 0.15, 0.08, 0.105, 0.04),
    ...ring(V(0, H.y + 0.155, H.z - 0.01), 0.1, 0.09, 8, 'y'),
    V(0.17, H.y - 0.08, H.z + 0.03), V(-0.17, H.y - 0.08, H.z + 0.03),
  ], 0.6, 1.1));
  const FZ = H.z + 0.14;
  // snout
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.075, FZ - 0.02), 0.112, 0.07, 0.04, 0.025),
    ...cbox(V(0, H.y - 0.09, FZ + 0.1), 0.096, 0.068, 0.04, 0.03),
  ]), SW.muzzle, 'y', [0.68, 0.92]));
  S.push(paint(hull(plate([[-0.015, -0.011], [0.015, -0.005], [0.015, 0.013], [-0.011, 0.011]],
    V(0.047, H.y - 0.075, 0), FZ + 0.137, FZ + 0.146)), SW.nostril, 'flat'));
  C.push(paint(hull(cbox(V(0, H.y - 0.145, FZ + 0.1), 0.065, 0.004, 0.038, 0.002)), SW.nostril, 'flat'));

  // fierce eyes (yawed outward)
  const E = V(0.104, H.y + 0.03, FZ);
  const ey = 0.3;
  const eyeP = (pts, z0, z1, c = E) => yaw(plate(pts, c, z0, z1), V(E.x, E.y, FZ), ey);
  S.push(paint(hull(eyeP([[-0.042, 0.0], [0.044, 0.032], [0.05, -0.008], [0.019, -0.04], [-0.029, -0.036], [-0.046, -0.016]],
    FZ - 0.01, FZ + 0.012)), SW.white, 'flat'));
  S.push(paint(hull(eyeP([[-0.027, 0.004], [0.017, 0.019], [0.023, -0.006], [0.004, -0.031], [-0.021, -0.029], [-0.031, -0.01]],
    FZ + 0.006, FZ + 0.018)), SW.eye, 'flat'));
  S.push(paint(hull(eyeP([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    FZ + 0.014, FZ + 0.021, V(E.x + 0.007, E.y + 0.003, 0))), SW.white, 'flat'));
  S.push(paint(hull(yaw([
    V(0.036, E.y + 0.012, FZ + 0.03), V(0.038, E.y + 0.052, FZ + 0.022),
    V(0.165, E.y + 0.048, FZ - 0.0), V(0.165, E.y + 0.09, FZ - 0.016),
    V(0.036, E.y + 0.012, FZ - 0.03), V(0.038, E.y + 0.062, FZ - 0.04),
    V(0.165, E.y + 0.048, FZ - 0.05), V(0.165, E.y + 0.092, FZ - 0.06),
  ], V(E.x, E.y, FZ), ey)), SW.brow, 'y'));

  // ears
  S.push(paint(hull([V(0.065, H.y + 0.11, H.z - 0.03), V(0.145, H.y + 0.11, H.z - 0.03), V(0.07, H.y + 0.11, H.z - 0.1),
    V(0.14, H.y + 0.11, H.z - 0.1), V(0.13, H.y + 0.29, H.z - 0.06)]), SW.body, 'y', [0.95, 1.25]));
  S.push(paint(hull([V(0.08, H.y + 0.14, H.z - 0.022), V(0.13, H.y + 0.14, H.z - 0.022), V(0.124, H.y + 0.26, H.z - 0.046),
    V(0.106, H.y + 0.15, H.z - 0.05)]), SW.inner, 'flat'));

  // small gold horns curving up/back from the forehead
  S.push(gold(tube(curveSamples([V(0.075, H.y + 0.11, FZ - 0.06), V(0.11, H.y + 0.2, FZ - 0.05), V(0.13, H.y + 0.25, FZ - 0.09)],
    6, (t) => 0.034 * (1 - 0.8 * t)), { seg: 6, capEnd: 0.03 })));
  // gold chamfron (face armour plate) with clover gem
  C.push(gold(hull([
    ...plate([[-0.06, 0.06], [0.06, 0.06], [0.075, 0.0], [0.03, -0.07], [-0.03, -0.07], [-0.075, 0.0]], V(0, H.y + 0.085, 0), FZ - 0.03, FZ + 0.024),
  ])));
  clover(C, V(0, H.y + 0.085, FZ + 0.03), V(1, 0, 0), V(0, 1, 0), V(0, 0, 1), 0.038, 0.012);

  // gold bridle: noseband, cheek straps and lucky coin rosettes
  C.push(gold(hull(cbox(V(0, H.y - 0.083, FZ + 0.045), 0.114, 0.078, 0.016, 0.026))));
  {
    const cc = V(0.17, H.y - 0.01, H.z + 0.02);
    S.push(goldF(hull([...cbox(V(0.162, H.y + 0.06, H.z + 0.03), 0.01, 0.06, 0.014, 0.004), cc.clone().add(V(0, 0, 0.012))])));
    S.push(paint(disc(cc, V(1, 0, 0.15), 0.036, 0.014, 10), SW.coin, 'flat'));
    S.push(paint(disc(cc.clone().add(V(0.008, 0, 0.001)), V(1, 0, 0.15), 0.022, 0.008), SW.coinIn, 'flat'));
  }

  // ================= MANE (chunky white locks) =================
  const lock = (b, d, w, l, n = V(1, 0.15, 0), out = S) => {
    d = d.clone().normalize(); n = n.clone().normalize();
    const sd = new THREE.Vector3().crossVectors(d, n).normalize();
    const nn = new THREE.Vector3().crossVectors(sd, d).normalize();
    const pts = [b.clone().addScaledVector(d, l)];
    for (const [t, wf, th] of [[-0.05, 0.8, 0.03], [0.3, 1, 0.032], [0.65, 0.55, 0.02]])
      for (const sg of [-1, 1]) for (const k of [-1, 1])
        pts.push(b.clone().addScaledVector(d, t * l).addScaledVector(sd, sg * wf * w).addScaledVector(nn, k * th));
    out.push(mane(hull(pts)));
  };
  // forelock between the ears, hanging over the top of the forehead plate (clover stays clear)
  C.push(mane(shard(V(0, H.y + 0.175, FZ - 0.04), V(0, -0.4, 1), 0.055, 0.1)));
  S.push(mane(shard(V(0.05, H.y + 0.17, FZ - 0.05), V(0.6, -0.45, 0.8), 0.048, 0.095)));
  C.push(mane(shard(V(0, H.y + 0.17, FZ - 0.12), V(0, 0.2, 1), 0.06, 0.1)));
  // neck crest: big layered shards fanned evenly down the crest
  const P0 = V(0, H.y + 0.16, H.z - 0.09), P1 = V(0, 0.6, 0.06);
  for (let i = 0; i < 5; i++) {
    const t = i / 4, b = P0.clone().lerp(P1, t);
    lock(b, V(0, 0.3 - 0.55 * t, -1), 0.075, 0.27 - 0.03 * t, V(1, 0, 0), C);
  }
  for (let i = 0; i < 5; i++) {
    const t = (i + 0.5) / 5, b = P0.clone().lerp(P1, t).add(V(0.07, -0.01, 0.02));
    lock(b, V(0.85, -0.35 - 0.5 * t, -0.65), 0.07, 0.25 - 0.03 * t);
  }

  // ================= TAIL (white flowing) =================
  const tailStrand = (pts, r) => paint(tube(curveSamples(pts, 9, (t) => r * (1 - 0.85 * t) + 0.02 * Math.sin(Math.PI * t)),
    { seg: 6, axis: V(1, 0, 0), capEnd: 0.025 }), SW.mane, 'len');
  C.push(tailStrand([V(0, 0.5, -0.3), V(0, 0.54, -0.44), V(0, 0.42, -0.58), V(0, 0.22, -0.64), V(0, 0.07, -0.6)], 0.07));
  S.push(tailStrand([V(0.02, 0.5, -0.31), V(0.06, 0.48, -0.44), V(0.09, 0.32, -0.54), V(0.1, 0.16, -0.55), V(0.09, 0.05, -0.48)], 0.055));
  lock(V(0.03, 0.53, -0.3), V(0.25, -0.15, -1), 0.06, 0.24, V(1, 0.3, 0));
  lock(V(0.06, 0.5, -0.33), V(0.4, -0.8, -0.6), 0.055, 0.24, V(1, 0, 0.2));
  // gold tail cuff
  C.push(gold(hull([...ring(V(0, 0.525, -0.4), 0.075, 0.075, 8, 'z'), ...ring(V(0, 0.53, -0.36), 0.075, 0.075, 8, 'z')])));

  // ================= LUCKY CHEST PIECE =================
  const collar = (r) => ring(V(0, 0, 0.17), r * 1.02, r, 12, 'y').map((p) => V(p.x, 0.66 - 0.55 * (p.z - 0.17), p.z));
  C.push(gold(hull([...collar(0.148), ...collar(0.148).map((p) => V(p.x, p.y - 0.035, p.z))])));
  for (const [c, n] of [[V(0.085, 0.55, 0.3), V(0.5, 0, 1)], [V(0.135, 0.565, 0.235), V(1, 0, 0.6)]]) {
    S.push(paint(disc(c, n, 0.028, 0.012), SW.coin, 'flat'));
    S.push(paint(disc(c.clone().addScaledVector(n.clone().normalize(), 0.008), n, 0.017, 0.006, 6), SW.coinIn, 'flat'));
  }
  // big lucky horseshoe medallion (opening up), clover inside
  const MC = V(0, 0.5, 0.326);
  arcBand(C, SW.gold, MC, V(1, 0, 0), V(0, 1, 0), V(0, 0, 1), 0.075, 0.034, 0.036, Math.PI * 0.8, Math.PI * 2.2, 8, 0.008);
  clover(C, MC.clone().add(V(0, 0.0, 0.01)), V(1, 0, 0), V(0, 1, 0), V(0, 0, 1), 0.05, 0.018);

  // ================= SADDLE CLOTH WITH COINS =================
  const sc = [];
  for (const z of [-0.17, 0.05]) for (let k = 0; k <= 8; k++) {
    const a = -0.15 + (Math.PI + 0.3) * k / 8;
    sc.push(V(Math.cos(a) * 0.205, 0.425 + Math.sin(a) * 0.2, z));
  }
  C.push(paint(hull(sc), SW.cloth, 'y', [0.35, 0.64]));
  // gold trim along each side's bottom edge
  S.push(goldF(hull([...cbox(V(0.2, 0.39, -0.06), 0.012, 0.016, 0.12, 0.005)])));
  // coin dangles
  for (const z of [-0.14, -0.06, 0.02]) {
    S.push(paint(disc(V(0.21, 0.35, z), V(1, 0, 0.0), 0.028, 0.012), SW.coin, 'flat'));
    S.push(paint(disc(V(0.218, 0.35, z), V(1, 0, 0.0), 0.017, 0.006, 6), SW.coinIn, 'flat'));
  }
  // glowing clover rune on the saddle side
  clover(S, V(0.2, 0.49, -0.06), V(0, 0, 1), V(0, 1, 0), V(1, 0.15, 0), 0.048, 0.014);

  // glowing lucky clover rune on each haunch
  {
    const n = V(1, 0, -0.35).normalize();
    const u = new THREE.Vector3().crossVectors(V(0, 1, 0), n).normalize();
    clover(S, V(0.2, 0.405, -0.275), u, V(0, 1, 0), n, 0.036, 0.016);
  }
  // gold shoulder armour bits
  S.push(gold(hull([V(0.15, 0.555, 0.09), V(0.15, 0.555, 0.2), V(0.135, 0.545, 0.145),
    V(0.215, 0.44, 0.08), V(0.215, 0.44, 0.215), V(0.232, 0.46, 0.08), V(0.232, 0.46, 0.215), V(0.18, 0.53, 0.145)])));
  S.push(paint(hull(cbox(V(0.205, 0.43, 0.148), 0.024, 0.012, 0.072, 0.004)), SW.coinIn, 'flat'));

  // drop the body onto the shorter legs
  for (const g of [...C, ...S]) g.translate(0, -0.035, 0);
  S.push(...LS);
  return assemble(C, S);
}

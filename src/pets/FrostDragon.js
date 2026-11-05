// Frost Dragon (MYTHIC, Round 4 - Frozen Peaks): pale blue faceted dragon, ice-crystal scales,
// big frosted wings, big white horns + back spikes, glowing cyan rune markings.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  ice:    { i: 0, top: '#A8DCFF', bot: '#3F86D0' },   // pale blue body
  iceDk:  { i: 1, top: '#4D8FD6', bot: '#2A62A8' },   // fingers, darker accents
  horn:   { i: 2, top: '#FFFFFF', bot: '#7FC2F0' },   // white horns (tube: tip = bot)
  memb:   { i: 3, top: '#FBFEFF', bot: '#55AEEA' },   // wing membrane white -> icy blue
  belly:  { i: 4, top: '#FFFFFF', bot: '#D3EAF8' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:    { i: 6, top: '#141A26', bot: '#0A0D14' },
  nose:   { i: 7, top: '#2D4E78', bot: '#1B3354' },
  brow:   { i: 8, top: '#6FA9E6', bot: '#2C5E9E' },
  spike:  { i: 9, top: '#FFFFFF', bot: '#D6EBF8' },
  xtal:   { i: 10, top: '#F4FEFF', bot: '#9FE8FB' },  // ice crystals
  glow:   { i: 11, top: '#7CF6FF', bot: '#2FCBFF', glow: true }, // glowing runes
};
const P = PALETTE;
const DROP = 0.035;

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const ice = (pts, lo = 0, hi = 1.0) => paint(hull(pts), P.ice, 'y', [lo, hi]);
  const spk = (g) => paint(g, P.spike, 'y');
  const xtal = (g) => paint(g, P.xtal, 'y');
  const glow = (g) => paint(g, P.glow, 'flat');

  // surface probe (for decals / markings that must hug the body)
  const probeMeshes = [];
  const probe = (g) => { probeMeshes.push(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }))); return g; };
  const rc = new THREE.Raycaster();
  const hit = (from, dir) => {
    rc.set(from, dir.clone().normalize());
    const h = rc.intersectObjects(probeMeshes, false)[0];
    if (!h) return null;
    const n = h.face.normal.clone();
    if (n.dot(dir) > 0) n.negate();
    return { p: h.point, n };
  };
  // a glowing bar hugging the surface between two probed points
  const bar = (a, b, w = 0.016, out = 0.009, into = 0.03) => {
    const n = a.n.clone().add(b.n).normalize();
    const side = new THREE.Vector3().subVectors(b.p, a.p).cross(n).normalize();
    const pts = [];
    for (const q of [a, b]) for (const s of [-1, 1]) {
      pts.push(q.p.clone().addScaledVector(side, s * w).addScaledVector(q.n, out));
      pts.push(q.p.clone().addScaledVector(side, s * w).addScaledVector(q.n, -into));
    }
    return glow(hull(pts));
  };

  // ================= BODY =================
  C.push(probe(ice([
    ...ring(V(0, 0.34, -0.4), 0.12, 0.12, 10, 'z'),
    ...ring(V(0, 0.34, -0.29), 0.2, 0.19, 10, 'z'),
    ...ring(V(0, 0.355, -0.12), 0.23, 0.22, 10, 'z'),
    ...ring(V(0, 0.38, 0.04), 0.23, 0.23, 10, 'z'),
    ...ring(V(0, 0.41, 0.16), 0.21, 0.22, 10, 'z'),
    ...ring(V(0, 0.44, 0.25), 0.13, 0.14, 10, 'z'),
  ], 0.12, 0.62)));
  // neck (thick)
  C.push(ice([...ring(V(0, 0.46, 0.15), 0.16, 0.15, 10, 'y'), ...ring(V(0, 0.7, 0.24), 0.135, 0.125, 10, 'y')], 0.35, 0.85));

  // ================= LEGS (short, thick) =================
  S.push(ice([...ring(V(0.175, 0.08, 0.22), 0.09, 0.09, 8), ...ring(V(0.175, 0.2, 0.2), 0.098, 0.1, 8),
    ...ring(V(0.155, 0.34, 0.14), 0.115, 0.125, 8)], 0.0, 0.6));
  S.push(probe(paint(blob(0, V(0.17, 0.33, 0.14), V(0.125, 0.155, 0.14), { jitter: 0.1 }), P.ice, 'y', [0.0, 0.6])));
  S.push(probe(paint(blob(1, V(0.18, 0.26, -0.17), V(0.135, 0.16, 0.175), { jitter: 0.12 }), P.ice, 'y', [0.0, 0.6])));
  S.push(ice([...ring(V(0.185, 0.24, -0.16), 0.092, 0.097, 8), ...ring(V(0.195, 0.13, -0.19), 0.082, 0.082, 8),
    ...ring(V(0.195, 0.08, -0.18), 0.08, 0.08, 8)], 0.0, 0.6));
  // feet: ice block + 3 white claws, frost crystal on the ankle
  const foot = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.055, z + 0.01), 0.095, 0.055, 0.085, 0.028)), P.iceDk, 'y', [0, 0.3]));
    for (const dx of [-0.058, 0, 0.058]) {
      const b = V(x + dx, 0.0, z + 0.085);
      S.push(paint(hull([
        V(b.x - 0.026, 0.0, b.z - 0.02), V(b.x + 0.026, 0.0, b.z - 0.02),
        V(b.x - 0.022, 0.055, b.z - 0.02), V(b.x + 0.022, 0.055, b.z - 0.02),
        V(b.x, 0.062, b.z + 0.0), V(b.x + dx * 0.15, 0.0, b.z + 0.075),
        V(b.x - 0.018, 0.0, b.z + 0.035), V(b.x + 0.018, 0.0, b.z + 0.035),
      ]), P.spike, 'flat'));
    }
  };
  foot(0.18, 0.23);
  foot(0.2, -0.17);
  const nC = C.length, nS = S.length; // everything after this sits lower (shorter legs)

  // ================= BELLY PLATES (light icy bands) =================
  const belly = [
    [0.68, 0.36, 0.085, 0.034, -0.35],
    [0.61, 0.35, 0.095, 0.034, -0.28],
    [0.54, 0.345, 0.105, 0.034, -0.15],
    [0.47, 0.34, 0.115, 0.034, 0.0],
    [0.40, 0.325, 0.118, 0.034, 0.2],
    [0.33, 0.295, 0.112, 0.034, 0.45],
    [0.265, 0.24, 0.105, 0.034, 0.85],
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
    C.push(paint(hull(pts), P.belly, 'y', [0.2, 0.75]));
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
    C.push(ice(pts, 0.15, 0.85));
  }

  // faceted ice-crystal scale gems over the back and haunches (hug the body surface)
  const gemG = (h, r, ht, sw = P.xtal) => {
    // pointed hexagonal ice prism standing out of the surface, leaning back
    const n = h.n, dir = n.clone().add(V(0, 0, -0.55)).normalize();
    const a = new THREE.Vector3().crossVectors(dir, Math.abs(dir.y) > 0.9 ? V(0, 0, 1) : V(0, 1, 0)).normalize();
    const b = new THREE.Vector3().crossVectors(dir, a).normalize();
    const w = r * 0.62, len = ht * 2.6;
    const pts = [h.p.clone().addScaledVector(dir, len)];
    for (let k = 0; k < 6; k++) {
      const th = (k / 6) * Math.PI * 2, d = a.clone().multiplyScalar(Math.cos(th) * w).addScaledVector(b, Math.sin(th) * w * 0.8);
      pts.push(h.p.clone().add(d).addScaledVector(n, -0.03), h.p.clone().add(d).addScaledVector(dir, len * 0.5));
    }
    return paint(hull(pts), sw, 'y');
  };

  // ================= HEAD (big, boxy) =================
  const hC0 = C.length, hS0 = S.length;
  const H = { y: 0.83, z: 0.3 };
  C.push(probe(ice([
    ...cbox(V(0, H.y, H.z), 0.21, 0.16, 0.16, 0.07),
    ...ring(V(0, H.y + 0.18, H.z - 0.03), 0.11, 0.1, 8, 'y'),
    V(0.22, H.y - 0.065, H.z + 0.02), V(-0.22, H.y - 0.065, H.z + 0.02),
  ], 0.55, 1.02)));
  const FZ = H.z + 0.16;
  C.push(ice([
    ...cbox(V(0, H.y - 0.072, FZ + 0.085), 0.13, 0.068, 0.108, 0.03),
    V(0.09, H.y - 0.0, FZ - 0.02), V(-0.09, H.y - 0.0, FZ - 0.02),
    V(0.065, H.y - 0.015, FZ + 0.17), V(-0.065, H.y - 0.015, FZ + 0.17),
  ], 0.6, 0.92));
  C.push(paint(hull(cbox(V(0, H.y - 0.145, FZ + 0.045), 0.11, 0.038, 0.1, 0.02)), P.belly, 'y', [0.6, 0.75]));
  // nostrils
  S.push(paint(hull([V(0.028, H.y - 0.008, FZ + 0.155), V(0.062, H.y - 0.008, FZ + 0.15), V(0.028, H.y - 0.022, FZ + 0.197),
    V(0.062, H.y - 0.022, FZ + 0.195), V(0.045, H.y - 0.03, FZ + 0.15), V(0.045, H.y - 0.04, FZ + 0.19)]), P.nose, 'flat'));
  // mouth line
  S.push(paint(hull([V(0, H.y - 0.098, FZ + 0.197), V(0, H.y - 0.088, FZ + 0.197), V(0.08, H.y - 0.098, FZ + 0.197),
    V(0.08, H.y - 0.088, FZ + 0.197), V(0, H.y - 0.093, FZ + 0.18), V(0.08, H.y - 0.093, FZ + 0.18)]), P.nose, 'flat'));
  S.push(paint(hull([V(0.1, H.y - 0.098, FZ + 0.185), V(0.1, H.y - 0.088, FZ + 0.185), V(0.12, H.y - 0.098, FZ + 0.16),
    V(0.12, H.y - 0.088, FZ + 0.16), V(0.12, H.y - 0.115, FZ + 0.05), V(0.12, H.y - 0.105, FZ + 0.05),
    V(0.105, H.y - 0.1, FZ + 0.06), V(0.09, H.y - 0.093, FZ + 0.18)]), P.nose, 'flat'));
  // small white fangs
  S.push(paint(shard(V(0.075, H.y - 0.1, FZ + 0.175), V(0, -1, 0.15), 0.012, 0.035, 3), P.white, 'flat'));

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
    V(0.17, E.y + 0.055, FZ - 0.01), V(0.17, E.y + 0.1, FZ - 0.025),
    V(0.022, E.y + 0.01, FZ - 0.03), V(0.024, E.y + 0.065, FZ - 0.04),
    V(0.17, E.y + 0.055, FZ - 0.06), V(0.17, E.y + 0.1, FZ - 0.07),
  ]), P.brow, 'y'));

  // horns: BIG white sweeping back + lower pair
  S.push(paint(tube(curveSamples(
    [V(0.085, H.y + 0.11, H.z - 0.01), V(0.14, H.y + 0.22, H.z - 0.09), V(0.21, H.y + 0.31, H.z - 0.22), V(0.27, H.y + 0.37, H.z - 0.36)],
    8, (t) => 0.072 * Math.pow(1 - t, 1.1) + 0.006), { seg: 8, capEnd: 0.0 }), P.horn, 'len'));
  S.push(paint(tube(curveSamples(
    [V(0.14, H.y + 0.06, H.z - 0.08), V(0.23, H.y + 0.1, H.z - 0.17), V(0.3, H.y + 0.15, H.z - 0.3)],
    5, (t) => 0.06 * (1 - t) + 0.004), { seg: 5 }), P.horn, 'len'));
  // ice-crystal frill blades on the head sides
  const fin = (b, tip, h, th, up = V(0, 1, 0)) => hull([
    b.clone().addScaledVector(up, h).add(V(th, 0, 0)), b.clone().addScaledVector(up, h).add(V(-th, 0, 0)),
    b.clone().addScaledVector(up, -h).add(V(th, 0, 0)), b.clone().addScaledVector(up, -h).add(V(-th, 0, 0)),
    b.clone().add(V(th * 1.6, 0, 0.02)), tip,
  ]);
  for (const [b, tip, h] of [
    [V(0.19, H.y - 0.04, H.z - 0.02), V(0.34, H.y - 0.05, H.z - 0.18), 0.045],
    [V(0.17, H.y - 0.11, H.z + 0.02), V(0.28, H.y - 0.2, H.z - 0.1), 0.035],
  ]) S.push(paint(fin(b, tip, h, 0.022), P.xtal, 'y', [H.y - 0.22, H.y + 0.05]));
  // head crest spikes (white)
  C.push(spk(shard(V(0, H.y + 0.16, H.z + 0.03), V(0, 1, -0.4), 0.034, 0.08)));
  C.push(spk(shard(V(0, H.y + 0.13, H.z - 0.1), V(0, 1, -1), 0.034, 0.09)));
  C.push(spk(shard(V(0, H.y + 0.02, H.z - 0.16), V(0, 0.6, -1), 0.032, 0.09)));
  // glowing forehead rune (diamond between brows)
  C.push(glow(hull(plate([[0, 0.03], [0.018, 0.0], [0, -0.022], [-0.018, 0]], V(0, H.y + 0.115, 0), FZ - 0.03, FZ + 0.006))));

  // crystal scale plates on the head (crown and cheeks)
  for (const [o, d, r] of [[V(0.0, 1.5, H.z + 0.02), V(0, -1, 0), 0.05], [V(0.11, 1.5, H.z - 0.06), V(0, -1, 0), 0.042],
    [V(0.6, H.y - 0.02, H.z - 0.04), V(-1, 0, 0), 0.045]]) {
    const h = hit(o, d); if (h) (o.x === 0 ? C : S).push(gemG(h, r, 0.035));
  }
  { // scale the whole head group up (big-head style), pivot at the neck joint
    const piv = V(0, 0.66, 0.22), k = 1.2;
    for (const g of [...C.slice(hC0), ...S.slice(hS0)]) { g.translate(-piv.x, -piv.y, -piv.z); g.scale(k, k, k); g.translate(piv.x, piv.y, piv.z); }
  }

  // ================= BACK SPIKES (white) + ICE CRYSTAL SCALES =================
  for (const [y, z, s] of [[0.62, 0.13, 1.1], [0.6, 0.02, 1.35], [0.59, -0.1, 1.3], [0.57, -0.22, 1.1], [0.51, -0.32, 0.85]])
    C.push(spk(shard(V(0, y, z), V(0, 1, -0.55), 0.055 * s, 0.12 * s)));
  // crystal clusters on shoulders and hips (hexagonal ice shards)
  for (const [b, d, w, l] of [
    [V(0.13, 0.56, 0.1), V(0.5, 1, 0.15), 0.05, 0.15],
    [V(0.17, 0.52, 0.03), V(0.9, 0.8, 0.1), 0.04, 0.11],
    [V(0.09, 0.58, 0.0), V(0.3, 1, -0.2), 0.035, 0.1],
    [V(0.15, 0.53, -0.17), V(0.6, 1, -0.5), 0.045, 0.12],
    [V(0.19, 0.47, -0.25), V(0.9, 0.7, -0.4), 0.035, 0.09],
  ]) S.push(xtal(shard(b, d, w, l, 6, 0.7)));

  const gem = gemG;
  for (const [x, z, r] of [[0.1, 0.06, 0.07], [0.1, -0.09, 0.075], [0.1, -0.24, 0.065], [0.19, -0.02, 0.06], [0.19, -0.16, 0.06], [0.08, -0.36, 0.05]]) {
    const h = hit(V(x, 1.2, z), V(0, -1, 0));
    if (h) S.push(gem(h, r, 0.05).translate(0, DROP, 0)); // body is not dropped
  }
  // crystal plates on the upper legs (shoulder + haunch), above the glow chevrons
  for (const [t, d, r] of [[V(0.17, 0.45, 0.13), V(-1, -0.7, -0.1), 0.06], [V(0.19, 0.39, -0.2), V(-1, -0.8, 0.1), 0.065],
    [V(0.2, 0.39, -0.06), V(-1, -0.5, 0), 0.05]]) {
    const dn = d.clone().normalize(), h = hit(t.clone().addScaledVector(dn, -0.8), dn);
    if (h) S.push(gem(h, r, 0.045).translate(0, DROP, 0));
  }
  // ================= TAIL =================
  const tailPts = [V(0, 0.34, -0.3), V(0, 0.22, -0.5), V(0, 0.12, -0.72), V(0, 0.12, -0.94), V(0, 0.25, -1.08), V(0, 0.46, -1.1)];
  const tailR = (t) => 0.15 * Math.pow(1 - t, 1.25) + 0.03;
  C.push(probe(paint(tube(curveSamples(tailPts, 12, tailR), { seg: 8, axis: X, capEnd: 0.02 }), P.ice, 'len')));
  const tc = new THREE.CatmullRomCurve3(tailPts, false, 'centripetal');
  for (const t of [0.14, 0.3, 0.46, 0.62, 0.78]) {
    const p = tc.getPoint(t), T = tc.getTangent(t);
    const n = V(0, T.z, -T.y).normalize(); if (n.y + n.z * 0.3 < 0) n.negate();
    const k = 1.15 - t * 0.6;
    C.push(spk(shard(p.clone().addScaledVector(n, tailR(t) * 0.75), n.clone().addScaledVector(T, -0.6), 0.045 * k, 0.1 * k)));
  }
  for (const t of [0.08, 0.2, 0.32, 0.44, 0.56]) {
    const p = tc.getPoint(t), T = tc.getTangent(t);
    const n = V(0, T.z, -T.y).normalize(); if (n.y + n.z * 0.3 < 0) n.negate();
    const r = tailR(t), w = r * 0.62, l = 0.045 * (1 - t * 0.5);
    const pts = [];
    for (const sx of [-1, 1]) for (const sl of [-1, 1]) {
      const c = p.clone().addScaledVector(T, sl * l);
      pts.push(c.clone().addScaledVector(X, sx * w).addScaledVector(n, -r * 0.55));
      pts.push(c.clone().addScaledVector(X, sx * w * 0.7).addScaledVector(n, -r * 0.92));
      pts.push(c.clone().addScaledVector(X, sx * w * 0.5).addScaledVector(n, -r * 1.06).addScaledVector(T, -sl * 0.006));
    }
    C.push(paint(hull(pts), P.belly, 'flat'));
  }
  // ice-crystal spade tip
  const tip = tc.getPoint(1), tT = tc.getTangent(1);
  C.push(xtal(hull([tip.clone().addScaledVector(tT, 0.24), tip.clone().addScaledVector(tT, -0.02),
    V(0.1, tip.y + 0.05, tip.z), V(-0.1, tip.y + 0.05, tip.z),
    V(0, tip.y + 0.05, tip.z - 0.035), V(0, tip.y + 0.05, tip.z + 0.035)])));
  S.push(xtal(shard(V(0.06, tip.y + 0.04, tip.z), V(1, -0.7, 0), 0.035, 0.12)));
  C.push(xtal(shard(V(0, tip.y + 0.03, tip.z - 0.02), V(0, -0.4, -1), 0.03, 0.11)));

  // ================= GLOWING MARKINGS (body flanks, tail) =================
  {
    const dd = V(-1, -0.15, 0).normalize();
    const sideHit = (y, z) => hit(V(0, y, z).addScaledVector(dd, -0.8), dd);
    // chevron runes along the upper flank, pointing forward
    for (const [y, z, s] of [[0.35, 0.16, 0.8], [0.28, -0.15, 1.0], [0.47, -0.02, 0.55]]) {
      const a = sideHit(y + 0.07 * s, z - 0.045 * s), m = sideHit(y, z + 0.03 * s), c = sideHit(y - 0.07 * s, z - 0.045 * s);
      if (a && m && c) { S.push(bar(a, m, 0.017, 0.013).translate(0, DROP, 0)); S.push(bar(m, c, 0.017, 0.013).translate(0, DROP, 0)); } // body is not dropped
    }
    // tail stripes: diagonal glowing bands wrapped on the upper sides of the tail
    for (const t of [0.17, 0.3, 0.43, 0.56]) {
      const pts = [];
      for (let k = 0; k <= 3; k++) {
        const ang = 0.25 + k * 0.33, tt = t - 0.012 + k * 0.012; // angle from side (0) toward top
        const p = tc.getPoint(tt), T = tc.getTangent(tt);
        const n = V(0, T.z, -T.y).normalize(); if (n.y + n.z * 0.3 < 0) n.negate();
        const r = tailR(tt), d = X.clone().multiplyScalar(Math.cos(ang)).addScaledVector(n, Math.sin(ang));
        for (const sl of [-1, 1]) {
          const q = p.clone().addScaledVector(T, sl * 0.013);
          pts.push(q.clone().addScaledVector(d, r * 1.04), q.clone().addScaledVector(d, r * 0.75));
        }
      }
      // split in two convex halves to follow the curve
      S.push(glow(hull(pts.slice(0, 8)))); S.push(glow(hull(pts.slice(4, 12)))); S.push(glow(hull(pts.slice(8, 16))));
    }
  }

  // ================= WINGS (BIG, frosted) =================
  const wS0 = S.length;
  const Sh = V(0.13, 0.57, 0.0), El = V(0.36, 0.9, -0.08), Wr = V(0.5, 1.3, -0.16);
  const tips = [V(1.22, 0.88, -0.32), V(1.06, 0.44, -0.38), V(0.76, 0.26, -0.37), V(0.46, 0.26, -0.33)];
  const Bd = V(0.14, 0.5, -0.22);
  S.push(paint(tube(curveSamples([Sh, El, Wr], 6, (t) => 0.068 - 0.024 * t), { seg: 6, capEnd: 0.02 }), P.ice, 'y', [0.4, 1.3]));
  S.push(paint(blob(0, Wr, V(0.055, 0.055, 0.055), { jitter: 0.1 }), P.ice, 'y', [0.9, 1.35]));
  tips.forEach((T, i) => {
    S.push(paint(tube(curveSamples([Wr, Wr.clone().lerp(T, 0.5).add(V(0, 0.035, 0)), T], 4, (t) => 0.034 * (1 - t) + 0.015),
      { seg: 5, capEnd: 0.0 }), P.iceDk, 'y', [0.2, 1.3]));
  });
  // icicle crystals capping the finger tips (frosted wing edge)
  tips.forEach((T) => S.push(xtal(shard(T.clone().lerp(Wr, 0.04), new THREE.Vector3().subVectors(T, Wr), 0.026, 0.1, 5))));
  // wrist claw (white ice hook) + crystal at the elbow
  S.push(spk(shard(Wr.clone().add(V(0, 0.03, 0.02)), V(-0.1, 1, 0.5), 0.038, 0.12)));
  S.push(xtal(shard(El.clone().add(V(0.0, 0.03, 0.0)), V(0.2, 1, 0.3), 0.032, 0.09, 6, 0.7)));
  // membranes
  const th = 0.006;
  const panel = (a, b, c) => {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const pts = [];
    for (const p of [a, b, c]) { pts.push(p.clone().addScaledVector(n, th)); pts.push(p.clone().addScaledVector(n, -th)); }
    S.push(paint(hull(pts), P.memb, 'y', [0.2, 1.25]));
  };
  // glowing line across a membrane sector (pokes through both faces)
  const wline = (a, b, n, w = 0.009) => {
    const side = new THREE.Vector3().subVectors(b, a).cross(n).normalize();
    const pts = [];
    for (const q of [a, b]) for (const s of [-1, 1]) for (const o of [-1, 1])
      pts.push(q.clone().addScaledVector(side, s * w).addScaledVector(n, o * (th + 0.006)));
    S.push(glow(hull(pts)));
  };
  const back = V(0, 0, -0.002);
  const W0 = Wr.clone().add(back);
  const edge = [tips[0], tips[1], tips[2], tips[3], Bd];
  for (let i = 0; i < edge.length - 1; i++) {
    const a = edge[i].clone().add(back), b = edge[i + 1].clone().add(back);
    const m = a.clone().lerp(b, 0.5).lerp(Wr, 0.18).add(V(0, 0, -0.015));
    const mi = W0.clone().lerp(m, 0.5).add(V(0, 0, 0.012));
    panel(W0, a, mi); panel(a, m, mi); panel(mi, m, b); panel(W0, mi, b);
    if (i < 3) {
      // rune line: short spine from mid-sector toward the trailing edge
      const n = new THREE.Vector3().subVectors(a, W0).cross(new THREE.Vector3().subVectors(b, W0)).normalize();
      const n2 = new THREE.Vector3().subVectors(m, mi).cross(new THREE.Vector3().subVectors(a, mi)).normalize();
      const p0 = W0.clone().lerp(mi, 0.45), p1 = mi.clone().lerp(m, 0.6);
      wline(p0, mi, n); wline(mi, p1, n2.dot(n) < 0 ? n2.negate() : n2);
    }
  }
  panel(W0, Bd.clone().add(back), El.clone().add(back));
  panel(El.clone().add(back), Bd.clone().add(back), Sh.clone().add(back));

  { // wings scaled relative to the body so the body + head dominate
    const k = 0.76;
    for (const g of S.slice(wS0)) { g.translate(-Sh.x, -Sh.y, -Sh.z); g.scale(k, k, k); g.translate(Sh.x, Sh.y, Sh.z); }
  }
  for (const g of C.slice(nC)) g.translate(0, -DROP, 0);
  for (const g of S.slice(nS)) g.translate(0, -DROP, 0);
  return assemble(C, S);
}

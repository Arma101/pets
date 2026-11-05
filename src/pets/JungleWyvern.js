// Jungle Wyvern (EPIC): green wyvern standing on two thick hind legs, yellow segmented belly,
// leafy wing membranes, ivory curved horns + spikes, dark chevron markings, carved jade armour with gold trim,
// vine collar with leaves and a jade amulet, leaf-blade tail tip.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  body:   { i: 0, top: '#2FBF5A', bot: '#167A3A' },
  mark:   { i: 1, top: '#125A30', bot: '#0B3F21' },
  belly:  { i: 2, top: '#FFE866', bot: '#EDB52A' },
  leaf:   { i: 3, top: '#B8F05A', bot: '#6CC12E' },
  vein:   { i: 4, top: '#2C7A2C', bot: '#1E5C22' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:    { i: 6, top: '#1A1416', bot: '#0C0A0B' },
  nose:   { i: 7, top: '#1E4A22', bot: '#0F2E14' },
  brow:   { i: 8, top: '#3DB847', bot: '#1F7A30' },
  bone:   { i: 9, top: '#FFF4D6', bot: '#D9BE86' },
  boneT:  { i: 10, top: '#D9BE86', bot: '#FFF6DE' },
  jade:   { i: 11, top: '#7DF0C4', bot: '#1FA77E' },
  jadeDk: { i: 12, top: '#2BB58A', bot: '#137A5C' },
  gold:   { i: 13, top: '#FFE27A', bot: '#D9931C' },
  wingB:  { i: 14, top: '#1E6E5A', bot: '#0E4236' },
  memb:   { i: 15, top: '#5DA83A', bot: '#3F8A26' },
  vine:   { i: 16, top: '#5E8F2C', bot: '#3A6219' },
  mouth:  { i: 17, top: '#5A1E1E', bot: '#3A0E10' },
};
const P = PALETTE;
const X = V(1, 0, 0);

// dorsal direction for a centre-line axis tangent T (in the yz plane), pointing "up/back"
const dorsalOf = (T) => { const D = V(0, T.z, -T.y).normalize(); if (D.y < 0) D.negate(); return D; };
// ellipse ring around an arbitrary centre-line axis
function ringAx(p, T, rx, ry, n = 10, phase = Math.PI / 10) {
  const D = dorsalOf(T), pts = [];
  for (let k = 0; k < n; k++) {
    const a = phase + (2 * Math.PI * k) / n;
    pts.push(p.clone().addScaledVector(X, Math.cos(a) * rx).addScaledVector(D, Math.sin(a) * ry));
  }
  return pts;
}

// a leaf: folded faceted blade from B toward Tp, plus a raised dark midrib bar (both visible on both faces)
function leaf(B, Tp, w, N0, e = 0.006, rg = 0.015) {
  const dir = new THREE.Vector3().subVectors(Tp, B), L = dir.length(), d = dir.clone().normalize();
  const N = N0.clone().addScaledVector(d, -N0.dot(d)).normalize();
  const Pp = new THREE.Vector3().crossVectors(N, d).normalize();
  const prof = [[0, 0.2], [0.18, 0.74], [0.42, 1], [0.66, 0.8], [0.85, 0.42], [1, 0]];
  const pts = [];
  for (const [s, wf] of prof) {
    const c = B.clone().addScaledVector(d, s * L);
    for (const sd of wf ? [-1, 1] : [0]) {
      const q = c.clone().addScaledVector(Pp, sd * wf * w);
      pts.push(q.clone().addScaledVector(N, e), q.clone().addScaledVector(N, -e));
    }
  }
  for (const s of [0.03, 0.45, 0.8]) {
    const c = B.clone().addScaledVector(d, s * L);
    pts.push(c.clone().addScaledVector(N, rg), c.clone().addScaledVector(N, -rg));
  }
  const rib = [];
  for (const [s, hw] of [[0.0, 0.017], [0.8, 0.007]]) {
    const c = B.clone().addScaledVector(d, s * L);
    for (const sd of [-1, 1]) for (const sn of [-1, 1])
      rib.push(c.clone().addScaledVector(Pp, sd * hw).addScaledVector(N, sn * (rg + 0.006)));
  }
  return [paint(hull(pts), P.leaf, 'y', [B.y - 0.1, Tp.y + 0.1]), paint(hull(rib), P.vein, 'flat')];
}

// convex shell cap of an ellipsoid (centre c, radii r) facing `dir`, keeping points with dot > cut
function cap(c, r, dir, cut = 0.35, det = 1) {
  const g = new THREE.IcosahedronGeometry(1, det), p = g.attributes.position, pts = [];
  const dn = dir.clone().normalize();
  for (let i = 0; i < p.count; i++) {
    const u = V(p.getX(i), p.getY(i), p.getZ(i));
    if (u.dot(dn) > cut) pts.push(V(c.x + u.x * r.x, c.y + u.y * r.y, c.z + u.z * r.z));
  }
  pts.push(c.clone().addScaledVector(dn, -0.01));
  return hull(pts);
}

export function buildGeometry() {
  const C = [], S = [];
  const green = (pts, lo = 0, hi = 1.1) => paint(hull(pts), P.body, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= SPINE: hips -> chest -> neck (tilted up) =================
  const spinePts = [V(0, 0.4, -0.27), V(0, 0.5, -0.08), V(0, 0.64, 0.07), V(0, 0.78, 0.15), V(0, 0.9, 0.2)];
  const spine = new THREE.CatmullRomCurve3(spinePts, false, 'centripetal');
  const rad = (t) => { // [rx, ry] along the spine
    const K = [[0, 0.13, 0.12], [0.12, 0.175, 0.17], [0.32, 0.195, 0.185], [0.52, 0.175, 0.165], [0.66, 0.14, 0.13], [0.8, 0.125, 0.12], [1, 0.12, 0.115]];
    for (let k = 0; k < K.length - 1; k++) if (t <= K[k + 1][0]) {
      const f = (t - K[k][0]) / (K[k + 1][0] - K[k][0]);
      return [K[k][1] + (K[k + 1][1] - K[k][1]) * f, K[k][2] + (K[k + 1][2] - K[k][2]) * f];
    }
    return [K[K.length - 1][1], K[K.length - 1][2]];
  };
  const sp = (t) => ({ p: spine.getPoint(t), T: spine.getTangent(t), r: rad(t) });
  // torso
  {
    const pts = [];
    for (const t of [0, 0.12, 0.25, 0.4, 0.55, 0.66]) { const s = sp(t); pts.push(...ringAx(s.p, s.T, s.r[0], s.r[1])); }
    C.push(green(pts, 0.2, 1.0));
  }
  // neck
  {
    const pts = [];
    for (const t of [0.6, 0.8, 1]) { const s = sp(t); pts.push(...ringAx(s.p, s.T, s.r[0], s.r[1])); }
    C.push(green(pts, 0.4, 1.1));
  }

  // ================= BELLY: yellow segmented scale plates =================
  for (let t = 0.13; t <= 0.97; t += 0.075) {
    const s = sp(t), D = dorsalOf(s.T), n = D.clone().negate(), up = s.T.clone();
    const w = s.r[0] * 0.66, l = 0.03, base = s.p.clone().addScaledVector(n, s.r[1] * 0.96);
    const pts = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const c = base.clone().addScaledVector(up, sy * l);
      pts.push(c.clone().addScaledVector(X, sx * w).addScaledVector(n, -0.07));
      pts.push(c.clone().addScaledVector(X, sx * (w - 0.012)).addScaledVector(n, 0.002));
      pts.push(c.clone().addScaledVector(X, sx * (w - 0.04)).addScaledVector(n, 0.016).addScaledVector(up, -sy * 0.007));
    }
    C.push(paint(hull(pts), P.belly, 'y', [0.2, 0.95]));
  }

  // ================= MARKINGS: dark chevrons on the back (right halves, mirrored) =================
  const chevron = (p, T, rx, ry, fwd, sweep = 0.07, hw = 0.022, swatch = P.mark, angs = [Math.PI / 2, Math.PI / 3, Math.PI / 6, 0.05]) => {
    const D = dorsalOf(T), pts = [];
    for (const a of angs) {
      const back = -(Math.PI / 2 - a) * sweep;
      for (const sl of [-1, 1]) {
        const c = p.clone().addScaledVector(fwd, back + sl * hw);
        for (const f of [0.8, 1.13]) pts.push(c.clone().addScaledVector(X, Math.cos(a) * rx * f).addScaledVector(D, Math.sin(a) * ry * f));
      }
    }
    return paint(hull(pts), swatch, 'y', [0.0, 1.0]);
  };
  for (const t of [0.14, 0.3, 0.46, 0.6]) { const s = sp(t); S.push(chevron(s.p, s.T, s.r[0], s.r[1], s.T, 0.06, 0.024, P.mark, [Math.PI / 2, Math.PI / 3, Math.PI / 6, -0.1, -0.5, -0.8])); }

  // ================= LEGS: thick thighs, chunky planted feet =================
  S.push(paint(blob(1, V(0.18, 0.37, -0.12), V(0.125, 0.175, 0.18), { jitter: 0.08 }), P.body, 'y', [0.05, 0.65]));
  // bold dark stripes across the front/outer thigh
  const band = (c, r, path, wv, fo = 1.1) => {
    const pts = [];
    for (const u0 of path) {
      const u = u0.clone().normalize();
      for (const sd of [-1, 1]) {
        const q = u.clone().addScaledVector(wv, sd * 0.13).normalize();
        for (const f of [0.78, fo]) pts.push(V(c.x + q.x * r.x * f, c.y + q.y * r.y * f, c.z + q.z * r.z * f));
      }
    }
    return paint(hull(pts), P.mark, 'flat');
  };
  {
    const c = V(0.18, 0.37, -0.12), r = V(0.125, 0.175, 0.18);
    S.push(band(c, r, [V(-0.05, 0.62, 0.78), V(0.4, 0.5, 0.77), V(0.78, 0.35, 0.52)], V(0, 1, -0.3)));
    S.push(band(c, r, [V(0.0, 0.05, 1), V(0.45, -0.05, 0.89), V(0.8, -0.18, 0.57)], V(0, 1, -0.2)));
  }
  S.push(green([...ring(V(0.2, 0.29, -0.05), 0.1, 0.105, 8), ...ring(V(0.205, 0.13, -0.11), 0.088, 0.088, 8)], 0.0, 0.65));
  S.push(green([...ring(V(0.205, 0.15, -0.105), 0.085, 0.085, 8), ...cbox(V(0.205, 0.05, -0.06), 0.105, 0.05, 0.1, 0.03),
    ...cbox(V(0.205, 0.035, 0.03), 0.1, 0.035, 0.03, 0.015)], 0.0, 0.65));
  const claw = (x, z, w, h, len, dx = 0) => hull([
    V(x - w, 0, z), V(x + w, 0, z), V(x - w, h, z), V(x + w, h, z),
    V(x - w * 0.8, 0, z - 0.03), V(x + w * 0.8, 0, z - 0.03), V(x - w * 0.8, h, z - 0.03), V(x + w * 0.8, h, z - 0.03),
    V(x + dx - w * 0.3, 0, z + len), V(x + dx + w * 0.3, 0, z + len), V(x + dx, h * 0.3, z + len),
  ]);
  for (const dx of [-0.058, 0, 0.058]) S.push(flat(claw(0.205 + dx, 0.05, 0.026, 0.05, 0.075, dx * 0.3), P.bone));
  S.push(flat(claw(0.205, -0.15, 0.022, 0.035, -0.05), P.bone));
  // carved jade thigh plate with gold trim
  {
    const hex = (s) => [[0, 0.075 * s], [0.06 * s, 0.035 * s], [0.06 * s, -0.04 * s], [0, -0.08 * s], [-0.06 * s, -0.04 * s], [-0.06 * s, 0.035 * s]];
    const mk = (s, x0, x1) => hex(s).flatMap(([u, v]) => [V(x0, 0.39 + v, -0.11 + u), V(x1, 0.39 + v, -0.11 + u)]);
    S.push(flat(hull(mk(1.0, 0.25, 0.312)), P.gold));
    S.push(paint(hull(mk(0.8, 0.26, 0.322)), P.jade, 'y', [0.3, 0.48]));
    S.push(paint(hull(mk(0.38, 0.28, 0.329)), P.jadeDk, 'y', [0.33, 0.45]));
  }

  // ================= TAIL: sweeps down to rest on the ground, leaf-blade tip =================
  const tailPts = [V(0, 0.38, -0.3), V(0, 0.24, -0.47), V(0, 0.116, -0.66), V(0, 0.081, -0.86), V(0, 0.082, -1.03), V(0, 0.14, -1.16)];
  const tc = new THREE.CatmullRomCurve3(tailPts, false, 'centripetal');
  const tR = (t) => 0.12 * (1 - t) + 0.03;
  C.push(paint(tube(curveSamples(tailPts, 12, tR), { seg: 8, axis: X, capEnd: 0.02 }), P.body, 'len'));
  for (const t of [0.2, 0.38, 0.56, 0.74]) {
    const p = tc.getPoint(t), T = tc.getTangent(t);
    S.push(chevron(p, T, tR(t) * 0.97, tR(t) * 0.97, T.clone().negate(), 0.05, 0.016));
  }
  // tail spikes
  for (const t of [0.1, 0.29, 0.47, 0.65, 0.83]) {
    const p = tc.getPoint(t), T = tc.getTangent(t), n = dorsalOf(T), r = tR(t), k = 1.1 - t * 0.55;
    C.push(flat(shard(p.clone().addScaledVector(n, r * 0.78), n.clone().addScaledVector(T, 0.6), 0.045 * k, 0.11 * k), P.bone));
  }
  // leaf blade at the tip (vertical, pointing back/up)
  {
    const tip = tc.getPoint(1), tT = tc.getTangent(1);
    const [lg, rb] = leaf(tip.clone().addScaledVector(tT, -0.04), tip.clone().addScaledVector(tT, 0.22).add(V(0, 0.04, 0)), 0.075, X, 0.008, 0.02);
    C.push(lg, rb);
  }

  // ================= HEAD =================
  const hC = C.length, hS = S.length;
  const H = { y: 0.99, z: 0.27 };
  C.push(green([
    ...cbox(V(0, H.y, H.z), 0.175, 0.135, 0.145, 0.06),
    ...ring(V(0, H.y + 0.155, H.z - 0.03), 0.1, 0.09, 8, 'y'),
    V(0.19, H.y - 0.05, H.z + 0.02), V(-0.19, H.y - 0.05, H.z + 0.02),
  ], 0.75, 1.15));
  const FZ = H.z + 0.145;
  // snout
  C.push(green([
    ...cbox(V(0, H.y - 0.065, FZ + 0.09), 0.11, 0.058, 0.11, 0.03),
    V(0.085, H.y + 0.0, FZ - 0.02), V(-0.085, H.y + 0.0, FZ - 0.02),
    V(0.06, H.y - 0.012, FZ + 0.18), V(-0.06, H.y - 0.012, FZ + 0.18),
  ], 0.8, 1.05));
  // lower jaw (yellow underside)
  C.push(paint(hull([...cbox(V(0, H.y - 0.135, FZ + 0.04), 0.092, 0.034, 0.105, 0.02),
    V(0.13, H.y - 0.1, H.z - 0.05), V(-0.13, H.y - 0.1, H.z - 0.05)]), P.belly, 'y', [H.y - 0.18, H.y - 0.08]));
  // nostrils
  S.push(flat(hull([V(0.03, H.y - 0.006, FZ + 0.175), V(0.054, H.y - 0.006, FZ + 0.172), V(0.03, H.y - 0.017, FZ + 0.207),
    V(0.054, H.y - 0.017, FZ + 0.205), V(0.042, H.y - 0.026, FZ + 0.175), V(0.042, H.y - 0.034, FZ + 0.2)]), P.nose));
  // dark chevron marking on the snout bridge
  S.push(flat(hull([V(0, H.y + 0.007, FZ + 0.03), V(0, H.y + 0.007, FZ + 0.075), V(0.075, H.y + 0.0, FZ - 0.01), V(0.075, H.y + 0.0, FZ + 0.025),
    V(0, H.y - 0.03, FZ + 0.03), V(0, H.y - 0.03, FZ + 0.075), V(0.075, H.y - 0.03, FZ - 0.01), V(0.075, H.y - 0.03, FZ + 0.025)]), P.mark));
  // mouth line
  S.push(flat(hull([V(0, H.y - 0.098, FZ + 0.205), V(0, H.y - 0.088, FZ + 0.205), V(0.075, H.y - 0.098, FZ + 0.205),
    V(0.075, H.y - 0.088, FZ + 0.205), V(0, H.y - 0.093, FZ + 0.19), V(0.075, H.y - 0.093, FZ + 0.19)]), P.nose));
  S.push(flat(hull([V(0.095, H.y - 0.098, FZ + 0.19), V(0.095, H.y - 0.088, FZ + 0.19), V(0.115, H.y - 0.098, FZ + 0.16),
    V(0.115, H.y - 0.088, FZ + 0.16), V(0.115, H.y - 0.112, FZ + 0.05), V(0.115, H.y - 0.102, FZ + 0.05),
    V(0.1, H.y - 0.098, FZ + 0.06), V(0.085, H.y - 0.093, FZ + 0.185)]), P.nose));
  // small fangs
  S.push(flat(hull([V(0.062, H.y - 0.1, FZ + 0.19), V(0.082, H.y - 0.1, FZ + 0.185), V(0.072, H.y - 0.1, FZ + 0.17),
    V(0.072, H.y - 0.135, FZ + 0.185)]), P.bone));

  // fierce eyes (white almond slanting toward the nose, big pupil, square catchlight)
  const E = V(0.088, H.y + 0.04, 0);
  S.push(flat(hull(plate([[-0.048, 0.0], [0.05, 0.036], [0.058, -0.012], [0.021, -0.044], [-0.032, -0.04], [-0.05, -0.017]],
    E, FZ - 0.01, FZ + 0.01)), P.white));
  S.push(flat(hull(plate([[-0.029, 0.002], [0.017, 0.021], [0.024, -0.01], [0.005, -0.036], [-0.024, -0.034], [-0.034, -0.014]],
    V(E.x - 0.002, E.y, 0), FZ + 0.004, FZ + 0.016)), P.eye));
  S.push(flat(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.012, FZ + 0.02)), P.white));
  // heavy brow
  S.push(paint(hull([
    V(0.02, E.y + 0.008, FZ + 0.035), V(0.022, E.y + 0.052, FZ + 0.025),
    V(0.16, E.y + 0.052, FZ - 0.01), V(0.16, E.y + 0.095, FZ - 0.025),
    V(0.02, E.y + 0.008, FZ - 0.03), V(0.022, E.y + 0.062, FZ - 0.04),
    V(0.16, E.y + 0.052, FZ - 0.06), V(0.16, E.y + 0.095, FZ - 0.07),
  ]), P.mark, 'y', [E.y, E.y + 0.1]));

  // dark stripes sweeping back over the crown from the brows
  S.push(flat(hull([
    V(0.07, H.y + 0.145, FZ - 0.085), V(0.13, H.y + 0.13, FZ - 0.095), V(0.075, H.y + 0.152, H.z - 0.13), V(0.125, H.y + 0.135, H.z - 0.14),
    V(0.07, H.y + 0.1, FZ - 0.085), V(0.13, H.y + 0.09, FZ - 0.095), V(0.075, H.y + 0.1, H.z - 0.11), V(0.125, H.y + 0.09, H.z - 0.12),
  ]), P.mark));
  // carved jade head plate with gold trim (on the crown, tilted toward the front)
  {
    const pc = V(0, H.y + 0.145, H.z + 0.02), up = V(0, 0.93, 0.36).normalize(), fw = V(0, -0.36, 0.93);
    const mk = (s, n0, n1) => {
      const out = [];
      for (const [u, v] of [[0, 0.09], [0.075, 0.04], [0.06, -0.06], [0, -0.09], [-0.06, -0.06], [-0.075, 0.04]])
        for (const n of [n0, n1]) out.push(pc.clone().addScaledVector(X, u * s).addScaledVector(fw, v * s).addScaledVector(up, n));
      return out;
    };
    C.push(flat(hull(mk(1.0, -0.04, 0.012)), P.gold));
    C.push(paint(hull(mk(0.8, -0.03, 0.024)), P.jade, 'y', [H.y + 0.1, H.y + 0.2]));
    C.push(paint(hull(mk(0.36, -0.02, 0.032)), P.jadeDk, 'y', [H.y + 0.1, H.y + 0.2]));
  }

  // curved ivory horns (sweep back, tips curl up)
  S.push(paint(tube(curveSamples(
    [V(0.09, H.y + 0.12, H.z - 0.04), V(0.15, H.y + 0.2, H.z - 0.15), V(0.19, H.y + 0.22, H.z - 0.3), V(0.2, H.y + 0.31, H.z - 0.4)],
    6, (t) => 0.055 * (1 - t) + 0.006), { seg: 6 }), P.boneT, 'len'));
  S.push(paint(tube(curveSamples(
    [V(0.15, H.y + 0.04, H.z - 0.08), V(0.22, H.y + 0.06, H.z - 0.17), V(0.26, H.y + 0.12, H.z - 0.24)],
    4, (t) => 0.035 * (1 - t) + 0.004), { seg: 5 }), P.boneT, 'len'));
  // cheek frills (layered shard fins)
  const fin = (b, tip, h, th) => hull([
    b.clone().add(V(th, h, 0)), b.clone().add(V(-th, h, 0)), b.clone().add(V(th, -h, 0)), b.clone().add(V(-th, -h, 0)),
    b.clone().add(V(th * 1.6, 0, 0.02)), tip,
  ]);
  for (const [b, tip, h] of [
    [V(0.165, H.y - 0.06, H.z - 0.02), V(0.27, H.y - 0.07, H.z - 0.16), 0.04],
    [V(0.15, H.y - 0.11, H.z + 0.02), V(0.23, H.y - 0.18, H.z - 0.09), 0.03],
  ]) S.push(paint(fin(b, tip, h, 0.02), P.mark, 'y', [H.y - 0.2, H.y]));
  // crest spikes
  C.push(flat(shard(V(0, H.y + 0.11, H.z - 0.11), V(0, 1, -1), 0.03, 0.08), P.bone));
  C.push(flat(shard(V(0, H.y + 0.0, H.z - 0.155), V(0, 0.5, -1), 0.028, 0.075), P.bone));

  // big-head proportions: scale the whole head about the neck joint
  {
    const HP = V(0, 0.9, 0.2), HSC = 1.12;
    for (const g of [...C.slice(hC), ...S.slice(hS)]) {
      g.translate(-HP.x, -HP.y, -HP.z); g.scale(HSC, HSC, HSC); g.translate(HP.x, HP.y - 0.01, HP.z + 0.01);
    }
  }

  // ================= BACK SPIKES =================
  for (const [t, s] of [[0.86, 0.75], [0.7, 0.9], [0.54, 1.15], [0.38, 1.3], [0.22, 1.2], [0.06, 1.0]]) {
    const q = sp(t), D = dorsalOf(q.T);
    C.push(flat(shard(q.p.clone().addScaledVector(D, q.r[1] * 0.8), D.clone().addScaledVector(q.T, -0.5), 0.058 * s, 0.15 * s), P.bone));
  }

  // ================= VINE COLLAR + JADE AMULET =================
  {
    const s = sp(0.66), D = dorsalOf(s.T), n = D.clone().negate();
    const pts = [];
    const NV = 14;
    for (let k = 0; k <= NV; k++) {
      const a = (2 * Math.PI * k) / NV;
      const wob = 1.0 + 0.04 * Math.cos(3 * a);
      pts.push({ p: s.p.clone().addScaledVector(X, Math.sin(a) * (s.r[0] + 0.035) * wob)
        .addScaledVector(n, Math.cos(a) * (s.r[1] + 0.035) * wob).addScaledVector(s.T, 0.02 * Math.cos(2 * a)), rx: 0.026, ry: 0.026 });
    }
    C.push(paint(tube(pts, { seg: 5, axis: s.T }), P.vine, 'flat'));
    // leaves on the vine (sides)
    for (const a of [1.0, 2.2]) {
      const b = s.p.clone().addScaledVector(X, Math.sin(a) * (s.r[0] + 0.04)).addScaledVector(n, Math.cos(a) * (s.r[1] + 0.04));
      const out = V(Math.sin(a), 0, 0).addScaledVector(n, Math.cos(a)).normalize();
      const tipP = b.clone().addScaledVector(out, 0.06).addScaledVector(s.T, a < 2 ? -0.14 : 0.12);
      const [lg, rb] = leaf(b, tipP, 0.05, out, 0.005, 0.012);
      S.push(lg, rb);
    }
    // amulet: gold bezel + carved jade disc hanging at the chest
    const ac = s.p.clone().addScaledVector(n, s.r[1] + 0.065).addScaledVector(s.T, -0.08);
    const nf = n.clone();
    const disc = (r, d0, d1) => {
      const out = [];
      for (let k = 0; k < 8; k++) {
        const a = Math.PI / 8 + (2 * Math.PI * k) / 8;
        const q = ac.clone().addScaledVector(X, Math.cos(a) * r).addScaledVector(s.T, Math.sin(a) * r * 1.15);
        out.push(q.clone().addScaledVector(nf, d0), q.clone().addScaledVector(nf, d1));
      }
      return out;
    };
    C.push(flat(hull(disc(0.058, -0.03, 0.006)), P.gold));
    C.push(paint(hull(disc(0.045, -0.02, 0.018)), P.jade, 'y', [ac.y - 0.06, ac.y + 0.06]));
    C.push(paint(hull(disc(0.02, -0.01, 0.026)), P.jadeDk, 'flat'));
  }

  // ================= WINGS (leafy membranes) =================
  const Sh = V(0.13, 0.7, -0.1), El = V(0.36, 0.95, -0.17), Wr = V(0.5, 1.2, -0.23);
  const tips = [V(1.04, 0.86, -0.36), V(0.92, 0.44, -0.4), V(0.6, 0.3, -0.34)];
  const Bd = V(0.15, 0.5, -0.24);
  // shoulder pauldron: carved jade cap with gold trim
  S.push(flat(cap(V(0.17, 0.68, -0.07), V(0.14, 0.11, 0.14), V(0.8, 1, 0.45), 0.42), P.gold));
  S.push(paint(cap(V(0.17, 0.69, -0.07), V(0.125, 0.12, 0.125), V(0.8, 1, 0.45), 0.28), P.jade, 'y', [0.65, 0.85]));
  S.push(paint(shard(V(0.24, 0.76, -0.03), V(0.8, 1, 0.3), 0.035, 0.06), P.jadeDk, 'flat'));
  // arm + wrist
  S.push(paint(tube(curveSamples([Sh, Sh.clone().lerp(El, 0.5), El], 4, (t) => 0.062 - 0.012 * t), { seg: 6, capEnd: 0.03 }), P.body, 'y', [0.55, 1.05]));
  S.push(paint(tube(curveSamples([El, El.clone().lerp(Wr, 0.5), Wr], 4, (t) => 0.048 - 0.01 * t), { seg: 6, capEnd: 0.02 }), P.wingB, 'y', [0.8, 1.25]));
  S.push(paint(blob(0, El, V(0.052, 0.052, 0.052)), P.wingB, 'y', [0.8, 1.1]));
  for (const f of [0.5, 0.78]) {
    const a = Sh.clone().lerp(El, f - 0.06), b = Sh.clone().lerp(El, f + 0.06), r = (0.062 - 0.012 * f) * 1.16;
    S.push(paint(tube([{ p: a, rx: r, ry: r }, { p: b, rx: r, ry: r }], { seg: 6 }), P.mark, 'flat'));
  }
  S.push(paint(blob(0, Wr, V(0.048, 0.048, 0.048), { jitter: 0.1 }), P.wingB, 'y', [1.0, 1.3]));
  S.push(flat(shard(Wr.clone().add(V(0, 0.03, 0.01)), V(-0.1, 1, 0.4), 0.032, 0.09), P.bone));
  tips.forEach((T) => {
    S.push(paint(tube(curveSamples([Wr, Wr.clone().lerp(T, 0.5).add(V(0, 0.03, 0)), T], 4, (t) => 0.028 * (1 - t) + 0.012),
      { seg: 5 }), P.wingB, 'y', [0.2, 1.3]));
  });
  // wing plane normal
  const Nw = new THREE.Vector3().subVectors(tips[0], Wr).cross(new THREE.Vector3().subVectors(tips[2], Wr)).normalize();
  if (Nw.z < 0) Nw.negate();
  // base membrane (darker green, thin)
  const th = 0.002;
  const panel = (a, b, c) => {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const pts = [];
    for (const p of [a, b, c]) { pts.push(p.clone().addScaledVector(n, th)); pts.push(p.clone().addScaledVector(n, -th)); }
    S.push(paint(hull(pts), P.memb, 'y', [0.2, 1.2]));
  };
  const edge = [tips[0], tips[1], tips[2], Bd];
  for (let i = 0; i < edge.length - 1; i++) {
    const a = edge[i], b = edge[i + 1];
    const m = a.clone().lerp(b, 0.5).lerp(Wr, 0.18);
    panel(Wr, a, m); panel(Wr, m, b);
  }
  panel(Wr, Bd, El); panel(El, Bd, Sh);
  // leaves: an outer row of broad leaves whose tips poke past the membrane edge (scalloped leaf edge)
  // plus an inner row radiating from the wrist
  const lv = [];
  for (let i = 0; i < edge.length - 1; i++) {
    for (const f of [0.25, 0.75]) {
      const e = edge[i].clone().lerp(edge[i + 1], f);
      const ln = Wr.distanceTo(e);
      lv.push([Wr.clone().lerp(e, 0.4), Wr.clone().lerp(e, 1.1), ln * 0.2]);
    }
  }
  lv.push([El.clone().lerp(Bd, 0.1), El.clone().lerp(Bd, 1.0).add(V(0.07, -0.05, 0)), 0.09]);
  for (const [B, Tp, w] of lv) { const [lg, rb] = leaf(B, Tp, w, Nw); S.push(lg, rb); }

  const g = assemble(C, S);
  g.scale(0.88, 0.88, 0.88); g.computeBoundingBox();
  return g;
}

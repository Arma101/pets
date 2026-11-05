// Panda Pummeler (Godly, Round 7 - Blossom Brawl): burly four-legged panda brawler with a red silk headband,
// cloth-wrapped paws, ornate gold pauldrons + girth belt with glowing runes, jade medallions and cherry blossoms.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

const stripes = (a, b, n) => (ctx, x, y) => {
  ctx.fillStyle = a; ctx.fillRect(x, y, 128, 128);
  ctx.fillStyle = b;
  const h = 96 / n;
  for (let k = 0; k < n; k++) if (k % 2) ctx.fillRect(x, y + 16 + k * h, 128, h);
  ctx.fillRect(x, y, 128, 16); // top margin row matches first band colour? keep light
  ctx.fillStyle = a; ctx.fillRect(x, y, 128, 16);
};

export const PALETTE = {
  fur:    { i: 0, top: '#FFFFFF', bot: '#DEDEE3' },
  black:  { i: 1, top: '#3E3C45', bot: '#1B1A1F' },
  patch:  { i: 2, top: '#2A282E', bot: '#141317' },
  white:  { i: 3, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:    { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  brow:   { i: 5, top: '#FFFFFF', bot: '#D2D3DA' },
  muzzle: { i: 6, top: '#FFFFFF', bot: '#E4E2DE' },
  nose:   { i: 7, top: '#3A3438', bot: '#141114' },
  silk:   { i: 8, top: '#FF5A72', bot: '#C81E3E' },
  ribbon: { i: 9, top: '#FF4E6A', bot: '#FF9AB5' },
  gold:   { i: 10, top: '#FFE27A', bot: '#D6951C' },
  jade:   { i: 11, top: '#7BF0B4', bot: '#17955A' },
  rune:   { i: 12, top: '#E8FFFF', bot: '#38E2FF', glow: true },
  petal:  { i: 13, top: '#FFE3EE', bot: '#FF8FBC' },
  bloom:  { i: 14, top: '#FFF27A', bot: '#FFB02E' },
  wrap:   { i: 15, top: '#D8BE96', bot: '#C4A57A' },
  inset:  { i: 18, top: '#1D3550', bot: '#0F1D2E' },
  wrapf:  { i: 16, top: '#FFF6E6', bot: '#E6D2B2' },
  mouth:  { i: 17, top: '#3A2A2E', bot: '#241A1C' },
};
const SW = PALETTE;

// ---- local helpers ----
// frame from a normal: a (u axis) and b (v axis) perpendicular to n
function frame(n, upHint = V(0, 1, 0)) {
  n = n.clone().normalize();
  let a = new THREE.Vector3().crossVectors(upHint, n);
  if (a.lengthSq() < 1e-6) a = new THREE.Vector3().crossVectors(V(0, 0, 1), n);
  a.normalize();
  const b = new THREE.Vector3().crossVectors(n, a).normalize();
  return { n, a, b };
}
// 2D convex polygon on a surface (centre c, normal n), extruded from t0 to t1 along n
function oplate(c, n, pts2d, t0, t1, upHint) {
  const f = frame(n, upHint), out = [];
  for (const [u, v] of pts2d) for (const t of [t0, t1])
    out.push(c.clone().addScaledVector(f.a, u).addScaledVector(f.b, v).addScaledVector(f.n, t));
  return hull(out);
}
// thin bar (rune stroke) from (u0,v0) to (u1,v1) in the frame
function bar(c, n, u0, v0, u1, v1, w, t0, t1, upHint) {
  const du = u1 - u0, dv = v1 - v0, L = Math.hypot(du, dv) || 1;
  const pu = (-dv / L) * w, pv = (du / L) * w;
  const eu = (du / L) * w * 0.6, ev = (dv / L) * w * 0.6;
  return oplate(c, n, [[u0 + pu - eu, v0 + pv - ev], [u0 - pu - eu, v0 - pv - ev], [u1 - pu + eu, v1 - pv + ev], [u1 + pu + eu, v1 + pv + ev]], t0, t1, upHint);
}
// a rune glyph: list of strokes in [-1,1] units scaled by s
// glyph strokes sit on a darker inset plaque so they read as glowing glyphs
function rune(out, c, n, s, strokes, upHint, w = 0.011, t0 = -0.004, t1 = 0.007, sv = s) {
  const pad = w * 1.9, ins = [];
  for (let k = 0; k < 8; k++) {
    const th = Math.PI / 8 + (k * Math.PI) / 4;
    ins.push([Math.cos(th) * (s + pad) * 1.08, Math.sin(th) * (sv + pad) * 1.08]);
  }
  out.push(paint(oplate(c, n, ins, t0, t1, upHint), SW.inset, 'flat'));
  for (const [u0, v0, u1, v1] of strokes) out.push(paint(bar(c, n, u0 * s, v0 * sv, u1 * s, v1 * sv, w, t0, t1 + 0.005, upHint), SW.rune, 'flat'));
}
// cherry blossom: 5 faceted petals lying on a surface + gold centre
function blossom(out, c, n, r, rot = 0, upHint) {
  const f = frame(n, upHint);
  for (let k = 0; k < 5; k++) {
    const th = rot + (2 * Math.PI * k) / 5;
    const d = f.a.clone().multiplyScalar(Math.cos(th)).addScaledVector(f.b, Math.sin(th));
    const s = new THREE.Vector3().crossVectors(f.n, d);
    const P = (dd, ss, nn) => c.clone().addScaledVector(d, dd * r).addScaledVector(s, ss * r).addScaledVector(f.n, nn);
    out.push(paint(hull([P(0.1, 0, -0.006), P(0.1, 0, 0.004), P(0.55, 0.38, 0.0), P(0.55, -0.38, 0.0), P(1, 0.18, 0.006), P(1, -0.18, 0.006),
      P(0.55, 0, 0.016), P(0.6, 0, -0.006)]), SW.petal, 'flat'));
  }
  out.push(paint(hull([...[0, 1, 2, 3, 4].map((k) => {
    const th = rot + Math.PI / 5 + (2 * Math.PI * k) / 5;
    return c.clone().addScaledVector(f.a, Math.cos(th) * r * 0.22).addScaledVector(f.b, Math.sin(th) * r * 0.22).addScaledVector(f.n, 0.004);
  }), c.clone().addScaledVector(f.n, 0.022)]), SW.bloom, 'flat'));
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const fur = (pts, lo = 0.2, hi = 0.75) => paint(hull(pts), SW.fur, 'y', [lo, hi]);
  const blk = (pts, lo = 0.0, hi = 0.75) => paint(hull(pts), SW.black, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= BODY (white barrel) =================
  C.push(fur([
    ...ring(V(0, 0.42, -0.37), 0.13, 0.12, 10, 'z'),
    ...ring(V(0, 0.42, -0.31), 0.21, 0.19, 10, 'z'),
    ...ring(V(0, 0.42, -0.12), 0.235, 0.21, 10, 'z'),
    ...ring(V(0, 0.44, 0.05), 0.25, 0.225, 10, 'z'),
    ...ring(V(0, 0.46, 0.2), 0.24, 0.22, 10, 'z'),
    ...ring(V(0, 0.48, 0.3), 0.17, 0.17, 10, 'z'),
  ], 0.05, 0.7));
  // black shoulder band
  C.push(blk([
    ...ring(V(0, 0.44, -0.02), 0.258, 0.236, 10, 'z'),
    ...ring(V(0, 0.46, 0.2), 0.252, 0.232, 10, 'z'),
    ...ring(V(0, 0.48, 0.315), 0.18, 0.18, 10, 'z'),
  ], 0.2, 0.72));
  // white neck
  C.push(fur([...ring(V(0, 0.56, 0.24), 0.16, 0.15, 10, 'z'), ...ring(V(0, 0.6, 0.4), 0.16, 0.15, 10, 'z')], 0.4, 0.8));
  // black fur shards along the band's back edge
  for (const deg of [90, 62, 34]) {
    const th = (deg * Math.PI) / 180, nn = V(Math.cos(th), Math.sin(th), 0);
    const g = paint(shard(V(nn.x * 0.245, 0.44 + nn.y * 0.225, -0.0), nn.clone().multiplyScalar(0.25).add(V(0, -0.2, -1)), 0.065, 0.075, 4, 0.45), SW.black, 'flat');
    if (deg === 90) C.push(g); else S.push(g);
  }
  // stub tail
  C.push(fur([...cbox(V(0, 0.52, -0.38), 0.06, 0.06, 0.05, 0.025), V(0, 0.55, -0.45)], 0.4, 0.62));

  // ================= LEGS (black, short and thick; cloth-wrapped paws) =================
  const FL = { x: 0.215, z: 0.17 }, BL = { x: 0.19, z: -0.27 };
  S.push(paint(blob(1, V(0.2, 0.44, 0.16), V(0.13, 0.16, 0.14), { jitter: 0.1 }), SW.black, 'y', [0.0, 0.7]));
  S.push(blk([...ring(V(FL.x, 0.115, FL.z), 0.092, 0.092, 8), ...ring(V(FL.x, 0.26, FL.z - 0.005), 0.11, 0.11, 8),
    ...ring(V(FL.x - 0.01, 0.38, FL.z - 0.01), 0.125, 0.125, 8)], 0.0, 0.7));
  S.push(paint(blob(1, V(0.17, 0.41, -0.24), V(0.11, 0.16, 0.15), { jitter: 0.12 }), SW.black, 'y', [0.0, 0.7]));
  S.push(blk([...ring(V(BL.x, 0.115, BL.z), 0.09, 0.09, 8), ...ring(V(BL.x - 0.005, 0.27, BL.z + 0.01), 0.097, 0.097, 8),
    ...ring(V(BL.x - 0.01, 0.36, BL.z + 0.02), 0.102, 0.102, 8)], 0.0, 0.7));
  const paw = (L) => {
    // short wrap: three thick bands, cloth / darker cloth / cloth, slightly stepped
    for (const [y0, y1, r, sw] of [[0.06, 0.088, 0.104, SW.wrapf], [0.088, 0.112, 0.099, SW.wrap], [0.112, 0.14, 0.104, SW.wrapf]])
      S.push(paint(hull([...ring(V(L.x, y0, L.z), r, r, 8), ...ring(V(L.x, y1, L.z), r, r, 8)]), sw, 'y', [y0 - 0.01, y1 + 0.02]));
    // wrapped foot block + toes
    S.push(paint(hull(cbox(V(L.x, 0.045, L.z + 0.015), 0.09, 0.045, 0.085, 0.022)), SW.wrapf, 'y', [0, 0.09]));
    for (const dx of [-0.055, 0, 0.055])
      S.push(paint(hull(cbox(V(L.x + dx, 0.036, L.z + 0.095), 0.028, 0.036, 0.034, 0.012)), SW.wrapf, 'y', [0, 0.08]));
  };
  paw(FL); paw(BL);

  // ================= ARMOUR: gold pauldrons with runes =================
  const P = V(0.2, 0.47, 0.16);
  const arc = (Pc, R, a0, a1, n, z0, z1) => {
    const pts = [];
    for (let k = 0; k <= n; k++) {
      const th = ((a0 + ((a1 - a0) * k) / n) * Math.PI) / 180;
      for (const z of [z0, z1]) pts.push(V(Pc.x + Math.cos(th) * R, Pc.y + Math.sin(th) * R, Pc.z + z));
    }
    return pts;
  };
  S.push(paint(hull([...arc(P, 0.155, -5, 115, 6, -0.11, 0.11), ...arc(P, 0.12, -5, 115, 6, -0.12, 0.12)]), SW.gold, 'y', [0.42, 0.66]));
  S.push(paint(hull([...arc(V(P.x + 0.02, P.y - 0.06, P.z), 0.15, -30, 30, 3, -0.095, 0.095), ...arc(V(P.x + 0.02, P.y - 0.06, P.z), 0.115, -30, 30, 3, -0.1, 0.1)]), SW.gold, 'y', [0.3, 0.5]));
  // gold ridge fins on the pauldron
  for (const [deg, l] of [[88, 0.075]]) {
    const th = (deg * Math.PI) / 180, n = V(Math.cos(th), Math.sin(th), 0);
    S.push(paint(shard(P.clone().addScaledVector(n, 0.14).add(V(0, 0, -0.06)), n.clone().add(V(0, 0.2, -0.5)), 0.035, l, 4, 0.4), SW.gold, 'y', [0.55, 0.72]));
  }
  // jade stud + rune on the pauldron
  {
    const th = (45 * Math.PI) / 180, n = V(Math.cos(th), Math.sin(th), 0);
    const c = P.clone().addScaledVector(n, 0.152);
    rune(S, c, n, 0.036, [[-1, -1, -1, 1], [1, -1, 1, 1], [-1, 1, 1, -1], [-1, -1, 1, 1]], V(0, 0, 1), 0.011, -0.016, 0.006, 0.058);
  }
  blossom(S, P.clone().add(V(0.02, 0.15, -0.07)), V(0.25, 1, 0), 0.05, 0.3);

  rune(S, V(0.27, 0.43, -0.25), V(1, 0.1, 0), 0.044, [[0, -1, 0, 1], [0, 0.3, 0.8, 0.95], [0, 0.3, -0.8, 0.95], [-0.65, -0.45, 0.65, -0.45]], V(0, 1, 0), 0.013, -0.035, 0.004, 0.058);
  // ================= ARMOUR: gold girth belt with jade + runes =================
  C.push(paint(hull([...ring(V(0, 0.42, -0.08), 0.249, 0.224, 10, 'z'), ...ring(V(0, 0.42, -0.17), 0.244, 0.217, 10, 'z')]), SW.gold, 'y', [0.2, 0.66]));
  rune(S, V(0.204, 0.548, -0.125), V(3.29, 2.56, 0), 0.026, [[0, -1, 0, 1], [0, 1, 0.9, 0.3], [0, -0.1, -0.9, -0.7]], V(0, 0, 1), 0.009, -0.008, 0.005, 0.03);
  // jade medallion on top of belt
  C.push(paint(hull([...ring(V(0, 0.644, -0.125), 0.05, 0.05, 8, 'y'), ...ring(V(0, 0.665, -0.125), 0.045, 0.045, 8, 'y')]), SW.gold, 'y', [0.63, 0.67]));
  C.push(paint(hull([...ring(V(0, 0.665, -0.125), 0.034, 0.034, 8, 'y'), V(0, 0.69, -0.125)]), SW.jade, 'y', [0.66, 0.69]));
  // chest plate with jade bead
  C.push(paint(oplate(V(0, 0.4, 0.315), V(0, -0.15, 1), [[-0.09, 0.07], [0.09, 0.07], [0.11, 0.0], [0.05, -0.08], [-0.05, -0.08], [-0.11, 0.0]], -0.01, 0.022), SW.gold, 'y', [0.3, 0.48]));
  C.push(paint(oplate(V(0, 0.4, 0.34), V(0, -0.15, 1), [[0, 0.04], [0.035, 0.0], [0, -0.045], [-0.035, 0.0]], -0.005, 0.02), SW.jade, 'y', [0.35, 0.45]));

  // ================= HEAD =================
  const H = { y: 0.7, z: 0.34 };
  C.push(fur([
    ...cbox(V(0, H.y, H.z), 0.21, 0.17, 0.18, 0.075),
    ...ring(V(0, H.y + 0.19, H.z - 0.01), 0.15, 0.125, 8, 'y'),
    V(0, H.y - 0.02, H.z - 0.215),
    V(0.228, H.y - 0.07, H.z + 0.05), V(-0.228, H.y - 0.07, H.z + 0.05),
  ], 0.5, 0.9));
  const FZ = H.z + 0.18;
  // cheek fluff shards
  S.push(paint(shard(V(0.2, H.y - 0.09, H.z + 0.05), V(0.55, -1, -0.1), 0.05, 0.075, 4, 0.5), SW.fur, 'flat'));
  S.push(paint(shard(V(0.18, H.y - 0.12, H.z - 0.06), V(0.45, -1, -0.45), 0.045, 0.07, 4, 0.5), SW.fur, 'flat'));

  // muzzle, nose, mouth
  C.push(paint(hull([...cbox(V(0, H.y - 0.085, FZ + 0.035), 0.1, 0.055, 0.06, 0.03),
    V(0.07, H.y - 0.02, FZ - 0.03), V(-0.07, H.y - 0.02, FZ - 0.03)]), SW.muzzle, 'y', [H.y - 0.14, H.y - 0.02]));
  C.push(paint(hull([...cbox(V(0, H.y - 0.048, FZ + 0.09), 0.045, 0.022, 0.012, 0.008),
    V(0, H.y - 0.08, FZ + 0.09), V(0.02, H.y - 0.07, FZ + 0.09), V(-0.02, H.y - 0.07, FZ + 0.09)]), SW.nose, 'y'));
  C.push(flat(hull(cbox(V(0, H.y - 0.098, FZ + 0.096), 0.005, 0.02, 0.004, 0.002)), SW.mouth));
  S.push(flat(hull([V(0, H.y - 0.118, FZ + 0.098), V(0, H.y - 0.108, FZ + 0.098), V(0.05, H.y - 0.128, FZ + 0.09),
    V(0.05, H.y - 0.12, FZ + 0.09), V(0, H.y - 0.118, FZ + 0.088), V(0.05, H.y - 0.125, FZ + 0.08)]), SW.mouth));

  // black eye patch, angry eye inside it, heavy white brow
  const E = V(0.085, H.y + 0.012, 0), k = 1.2;
  const sc = (pts) => pts.map(([u, v]) => [u * k, v * k]);
  S.push(flat(hull(plate([[-0.066, 0.03], [-0.03, 0.06], [0.03, 0.07], [0.075, 0.045], [0.08, -0.03], [0.06, -0.075], [0.01, -0.09], [-0.04, -0.07], [-0.068, -0.025]],
    E, FZ - 0.035, FZ + 0.006)), SW.patch));
  S.push(flat(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.0, FZ + 0.014)), SW.white));
  S.push(flat(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.005, E.y, 0), FZ + 0.01, FZ + 0.022)), SW.eye));
  S.push(flat(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.006, E.y + 0.004, 0), FZ + 0.018, FZ + 0.026)), SW.white));
  S.push(paint(hull([
    V(0.022, E.y + 0.016, FZ + 0.042), V(0.024, E.y + 0.05, FZ + 0.03),
    V(0.17, E.y + 0.06, FZ + 0.0), V(0.17, E.y + 0.088, FZ - 0.02),
    V(0.022, E.y + 0.016, FZ - 0.03), V(0.024, E.y + 0.06, FZ - 0.04),
    V(0.17, E.y + 0.06, FZ - 0.06), V(0.17, E.y + 0.088, FZ - 0.07),
  ]), SW.brow, 'y'));

  // round black ears
  S.push(blk([...ring(V(0.165, H.y + 0.19, H.z - 0.075), 0.062, 0.058, 8, 'z', 0), ...ring(V(0.165, H.y + 0.195, H.z - 0.04), 0.07, 0.066, 8, 'z', 0), ...ring(V(0.165, H.y + 0.185, H.z - 0.0), 0.058, 0.054, 8, 'z', 0)], H.y + 0.1, H.y + 0.26));

  // ================= SILK HEADBAND + jade medallion + knot ribbons =================
  const BY = H.y + 0.117, BN = V(0, 0.59, 0.81);
  const rr = (y, hx, hz, ch) => [V(hx, y, hz - ch), V(hx - ch, y, hz), V(-hx + ch, y, hz), V(-hx, y, hz - ch),
    V(-hx, y, -hz + ch), V(-hx + ch, y, -hz), V(hx - ch, y, -hz), V(hx, y, -hz + ch)].map((p) => p.add(V(0, 0, H.z)));
  C.push(paint(hull([...rr(H.y + 0.088, 0.222, 0.192, 0.07), ...rr(H.y + 0.146, 0.182, 0.152, 0.05)]),
    SW.silk, 'y', [H.y + 0.08, H.y + 0.15]));
  const oct = (r) => [0, 1, 2, 3, 4, 5, 6, 7].map((k) => [Math.cos(Math.PI / 8 + k * Math.PI / 4) * r, Math.sin(Math.PI / 8 + k * Math.PI / 4) * r]);
  const MC = V(0, BY, FZ - 0.006), MF = frame(BN);
  C.push(paint(oplate(MC, BN, oct(0.052), -0.01, 0.016), SW.gold, 'y', [BY - 0.05, BY + 0.05]));
  C.push(paint(hull([...oct(0.036).map(([u, v]) => MC.clone().addScaledVector(MF.a, u).addScaledVector(MF.b, v).addScaledVector(MF.n, 0.024)),
    MC.clone().addScaledVector(MF.n, 0.042), MC.clone().addScaledVector(MF.n, 0.005)]), SW.jade, 'y', [BY - 0.035, BY + 0.035]));
  // knot at the back + loops
  C.push(paint(hull(cbox(V(0, BY, H.z - 0.195), 0.038, 0.034, 0.03, 0.012)), SW.silk, 'y', [BY - 0.03, BY + 0.03]));
  S.push(paint(hull([V(0.02, BY + 0.02, H.z - 0.21), V(0.02, BY - 0.02, H.z - 0.21), V(0.02, BY, H.z - 0.19),
    V(0.09, BY + 0.045, H.z - 0.225), V(0.09, BY + 0.0, H.z - 0.235), V(0.1, BY + 0.03, H.z - 0.205)]), SW.silk, 'flat'));
  // ribbon tails hanging free from the knot, back and down, V-cut ends
  for (const [pts, w] of [
    [[V(0.03, BY - 0.005, H.z - 0.215), V(0.075, BY - 0.04, H.z - 0.255), V(0.11, BY - 0.08, H.z - 0.29), V(0.15, BY - 0.11, H.z - 0.32)], 0.038],
    [[V(0.018, BY - 0.015, H.z - 0.215), V(0.035, BY - 0.07, H.z - 0.24), V(0.045, BY - 0.115, H.z - 0.27), V(0.06, BY - 0.15, H.z - 0.29)], 0.034],
  ]) S.push(paint(tube(curveSamples(pts, 6, (t) => w * (1 + 0.15 * t), () => 0.01), { seg: 4, axis: X, phase: 0, capEnd: -0.035 }), SW.ribbon, 'len'));

  // blossom on the headband side, petals on the back
  blossom(S, V(0.205, BY - 0.005, H.z + 0.07), V(0.8, 0.55, 0.25), 0.065, 0.2);
  blossom(C, V(0, 0.625, -0.3), V(0, 1, -0.35), 0.07, Math.PI / 2);
  for (const [b, r] of [[V(0.11, 0.6, -0.33), 0.9], [V(0.14, 0.62, -0.03), 2.2]])
    S.push(paint(hull([b.clone().add(V(0, 0.012, 0)), b.clone().add(V(Math.cos(r) * 0.045, 0.01, Math.sin(r) * 0.045)), b.clone().add(V(Math.cos(r + 1.2) * 0.03, 0.006, Math.sin(r + 1.2) * 0.03)),
      b.clone().add(V(Math.cos(r - 1.2) * 0.03, 0.006, Math.sin(r - 1.2) * 0.03)), b.clone().add(V(0, -0.012, 0))]), SW.petal, 'flat'));

  // ================= RUNES on the forehead band sides =================
  rune(S, V(0.2, BY, H.z - 0.07), V(0.81, 0.59, 0), 0.02, [[0, -1, 0, 1], [0, 1, 0.9, 0], [0, 0, 0.9, -1]], V(0, 1, 0), 0.0065, -0.004, 0.004, 0.021);

  return assemble(C, S);
}

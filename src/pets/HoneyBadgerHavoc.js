// Honey Badger Havoc (Epic, Desert Dojo): low, broad, fearless charcoal badger with one flowing silver-white
// shard mantle from brow to tail, gold claws, gold + lapis shoulder plates, studded collar and sandstone hip plates.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  body:    { i: 0, top: '#524E5B', bot: '#1F1D24' },
  dark:    { i: 1, top: '#38353F', bot: '#18161B' },
  silver:  { i: 2, top: '#FFFFFF', bot: '#B9BEC6' },
  shard:   { i: 3, top: '#F7F8FB', bot: '#AEB4BE' },
  muzzle:  { i: 4, top: '#5C5864', bot: '#36333C' },
  nose:    { i: 5, top: '#1A1719', bot: '#0B0A0B' },
  white:   { i: 6, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:     { i: 7, top: '#1A1416', bot: '#0C0A0B' },
  brow:    { i: 8, top: '#45414C', bot: '#232127' },
  gold:    { i: 9, top: '#FFDB5E', bot: '#D69A1E' },
  claw:    { i: 10, top: '#F2B93A', bot: '#FFF0B8' }, // 'len': base gold -> pale tip
  lapis:   { i: 11, top: '#4C7BFF', bot: '#1B2E9C' },
  sand:    { i: 12, top: '#F0D29C', bot: '#C99A5A' },
  tail:    { i: 13, top: '#E6E9EF', bot: '#2C2A32' }, // 'len': silver base -> dark tip
  mouth:   { i: 14, top: '#2A1E22', bot: '#140E10' },
  ear:     { i: 15, top: '#3E3A45', bot: '#25222A' },
};
const SW = PALETTE;

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const flat = (g, sw) => paint(g, sw, 'flat');
  const body = (pts, lo = 0.06, hi = 0.6) => paint(hull(pts), SW.body, 'y', [lo, hi]);
  const ell = (z, cy, rx, ry, n = 10) => ring(V(0, cy, z), rx, ry, n, 'z', Math.PI / 10);

  // ================= BODY (broad, low, slightly arched barrel) =================
  const R = [ // z, cy, rx, ry
    [-0.36, 0.33, 0.11, 0.09],
    [-0.31, 0.335, 0.19, 0.15],
    [-0.18, 0.355, 0.235, 0.17],
    [-0.02, 0.37, 0.245, 0.18],
    [0.1, 0.37, 0.24, 0.175],
    [0.2, 0.375, 0.2, 0.165],
  ];
  C.push(body(R.flatMap(([z, y, rx, ry]) => ell(z, y, rx, ry))));

  // ================= HEAD (big, broad, rounded wedge; joined by a thick neck) =================
  const H = { y: 0.44, z: 0.38 };
  const FZ = H.z + 0.14;
  const HS = [ // head sections: z, cy, rx, ry
    [H.z - 0.14, H.y + 0.01, 0.175, 0.15],
    [H.z - 0.05, H.y, 0.218, 0.17],
    [H.z + 0.07, H.y, 0.218, 0.165],
    [FZ, H.y - 0.025, 0.215, 0.135],
  ];
  C.push(body(HS.flatMap(([z, y, rx, ry]) => ell(z, y, rx, ry)), 0.25, 0.65));
  // thick neck bridging body and head back
  C.push(body([...ell(0.12, 0.37, 0.235, 0.175), ...ell(H.z - 0.1, H.y + 0.005, 0.2, 0.16)], 0.2, 0.62));

  // ================= SILVER-WHITE MANTLE: one band, brow -> head -> neck -> back -> tail =================
  const arc = (z, cy, rx, ry, a0, s = 1.045) => {
    const pts = [];
    for (let k = 0; k <= 6; k++) {
      const a = ((a0 + (180 - 2 * a0) * k / 6) * Math.PI) / 180;
      pts.push(V(Math.cos(a) * rx * s, cy + Math.sin(a) * ry * s, z));
    }
    return pts;
  };
  const band = [
    [FZ + 0.006, H.y - 0.025, 0.215, 0.135, 38, 1.06],
    [H.z + 0.07, H.y, 0.218, 0.165, 38, 1.055],
    [H.z - 0.05, H.y, 0.218, 0.17, 40, 1.05],
    [H.z - 0.12, H.y + 0.01, 0.2, 0.158, 36],
    [0.12, 0.37, 0.235, 0.175, 36],
    ...R.slice(1).reverse().slice(1).map(([z, y, rx, ry]) => [z, y, rx, ry, 38]),
    [-0.36, 0.33, 0.11, 0.09, 45],
  ];
  for (let i = 0; i < band.length - 1; i++) {
    const [a, b] = [band[i], band[i + 1]];
    C.push(paint(hull([...arc(...a), ...arc(...b)]), SW.silver, 'y', [0.3, 0.64]));
  }

  // broad flat leaf shards lying down on the mantle, sweeping back; side rows make a jagged edge
  const leaf = (base, n, w, l, back = V(0, 0, -1), th = 0.016, sw = SW.shard) => {
    const t = new THREE.Vector3().crossVectors(n, back).normalize();
    const b2 = back.clone().addScaledVector(n, -back.dot(n)).normalize();
    return paint(hull([
      base.clone().addScaledVector(t, w).addScaledVector(b2, -0.02), base.clone().addScaledVector(t, -w).addScaledVector(b2, -0.02),
      base.clone().addScaledVector(n, th).addScaledVector(b2, -l * 0.1), base.clone().addScaledVector(n, -th * 1.5).addScaledVector(b2, -l * 0.3),
      base.clone().addScaledVector(b2, l).addScaledVector(n, th * 0.2).addScaledVector(t, w * 0.3),
      base.clone().addScaledVector(b2, l * 0.9).addScaledVector(n, th * 0.2).addScaledVector(t, -w * 0.3),
    ]), sw, 'y', [0.3, 0.64]);
  };
  const rowsAt = (z, cy, rx, ry, w, l, degs, dn = 0) => {
    for (const deg of degs) {
      const a = (deg * Math.PI) / 180;
      const n = V(Math.cos(a) * ry, Math.sin(a) * rx, 0).normalize();
      const base = V(Math.cos(a) * rx * 1.05, cy + Math.sin(a) * ry * 1.05, z);
      const back = V(Math.cos(a) * 0.35, -0.1 - dn - (deg < 60 ? 0.45 : 0), -1).normalize();
      const g = leaf(base, n, w, l, back);
      if (deg === 90) C.push(g); else S.push(g);
    }
  };
  rowsAt(H.z - 0.11, H.y + 0.01, 0.2, 0.158, 0.06, 0.1, [90, 66]);
  rowsAt(0.16, 0.38, 0.23, 0.172, 0.085, 0.12, [90, 64, 42]);
  rowsAt(0.04, 0.37, 0.245, 0.18, 0.09, 0.13, [90, 64, 40]);
  rowsAt(-0.09, 0.365, 0.24, 0.176, 0.09, 0.13, [90, 64, 40]);
  rowsAt(-0.21, 0.35, 0.23, 0.166, 0.085, 0.12, [90, 64, 40]);
  rowsAt(-0.31, 0.335, 0.19, 0.15, 0.07, 0.1, [90, 58]);

  // ================= FACE =================
  // dark tapered muzzle, nose, mouth, lower jaw
  C.push(paint(hull([...cbox(V(0, H.y - 0.085, FZ + 0.065), 0.088, 0.05, 0.05, 0.022),
    ...cbox(V(0, H.y - 0.1, FZ + 0.0), 0.13, 0.05, 0.02, 0.02)]), SW.muzzle, 'y', [H.y - 0.14, H.y - 0.03]));
  C.push(paint(hull([...cbox(V(0, H.y - 0.048, FZ + 0.118), 0.05, 0.024, 0.02, 0.01),
    V(0, H.y - 0.08, FZ + 0.108), V(0.022, H.y - 0.074, FZ + 0.108), V(-0.022, H.y - 0.074, FZ + 0.108)]), SW.nose, 'y'));
  C.push(flat(hull(cbox(V(0, H.y - 0.1, FZ + 0.118), 0.006, 0.018, 0.004, 0.002)), SW.mouth));
  S.push(flat(hull([V(0, H.y - 0.12, FZ + 0.122), V(0, H.y - 0.108, FZ + 0.122), V(0.06, H.y - 0.126, FZ + 0.106),
    V(0.06, H.y - 0.116, FZ + 0.106), V(0, H.y - 0.12, FZ + 0.11), V(0.06, H.y - 0.123, FZ + 0.094)]), SW.mouth));
  C.push(paint(hull(cbox(V(0, H.y - 0.145, FZ + 0.03), 0.085, 0.025, 0.065, 0.012)), SW.dark, 'flat'));

  // big fierce eyes: white almond, angry slanted top, pupil, catchlight
  const E = V(0.096, H.y - 0.002, 0), k = 1.4;
  const sc = (pts, kk = k) => pts.map(([u, v]) => [u * kk, v * kk]);
  S.push(flat(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.01, FZ + 0.012)), SW.white));
  S.push(flat(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.008, E.y - 0.002, 0), FZ + 0.006, FZ + 0.018)), SW.eye));
  S.push(flat(hull(plate([[-0.01, -0.01], [0.01, -0.01], [0.01, 0.01], [-0.01, 0.01]],
    V(E.x + 0.004, E.y + 0.004, 0), FZ + 0.014, FZ + 0.023)), SW.white));
  // heavy brow sitting just above the eye's slanted top
  S.push(paint(hull([
    V(0.026, E.y + 0.012, FZ + 0.04), V(0.028, E.y + 0.056, FZ + 0.028),
    V(0.16, E.y + 0.056, FZ + 0.012), V(0.16, E.y + 0.088, FZ - 0.004),
    V(0.026, E.y + 0.012, FZ - 0.03), V(0.028, E.y + 0.066, FZ - 0.04),
    V(0.16, E.y + 0.056, FZ - 0.05), V(0.16, E.y + 0.088, FZ - 0.055),
  ]), SW.brow, 'y'));

  // small round ears low on the sides of the head (in the black zone)
  S.push(paint(hull([...ring(V(0.19, H.y + 0.075, H.z - 0.08), 0.045, 0.04, 7, 'x', 0),
    ...ring(V(0.235, H.y + 0.08, H.z - 0.085), 0.036, 0.032, 7, 'x', 0)]), SW.ear, 'y'));

  // forehead emblem on the mantle: gold diamond with lapis centre
  const EM = V(0, H.y + 0.098, FZ + 0.006), eu = V(0, 1, 0), en = V(0, 0, 1);
  const diamond = (c, sz, d0, d1) => [eu, eu.clone().negate(), X, X.clone().negate()].flatMap((dv) =>
    [c.clone().addScaledVector(dv, sz * (dv.x ? 0.85 : 1)).addScaledVector(en, d0), c.clone().addScaledVector(dv, sz * (dv.x ? 0.85 : 1)).addScaledVector(en, d1)]);
  C.push(paint(hull(diamond(EM, 0.026, -0.004, 0.01)), SW.gold, 'flat'));
  C.push(paint(hull(diamond(EM, 0.013, 0.0, 0.016)), SW.lapis, 'flat'));

  // ================= LEGS (massive shoulders/haunches, short thick forearms, chunky paws) =================
  const FL = { x: 0.215, z: 0.19 }, BL = { x: 0.205, z: -0.22 };
  const L = []; // lower legs + paws (not lowered with the body)
  // front shoulder: big faceted deltoid wedge blending out of the body
  S.push(body([
    V(0.13, 0.5, 0.24), V(0.13, 0.5, 0.06), V(0.2, 0.46, 0.27), V(0.21, 0.46, 0.04),
    V(0.265, 0.37, 0.26), V(0.27, 0.37, 0.09), V(0.272, 0.26, 0.24), V(0.27, 0.26, 0.12),
    V(0.16, 0.25, 0.26), V(0.16, 0.25, 0.1), V(0.21, 0.3, 0.29),
  ]));
  // front forearm: short, thick, tapering from a heavy elbow to the wrist
  L.push(body([...ring(V(FL.x - 0.01, 0.34, FL.z - 0.03), 0.095, 0.11, 8), ...ring(V(FL.x + 0.008, 0.2, FL.z - 0.01), 0.108, 0.112, 8),
    ...ring(V(FL.x, 0.085, FL.z + 0.008), 0.084, 0.086, 8)], 0.0, 0.6));
  // back haunch: big rounded faceted thigh
  S.push(paint(blob(1, V(0.19, 0.33, -0.21), V(0.095, 0.15, 0.15), { jitter: 0.1 }), SW.body, 'y', [0.06, 0.6]));
  S.push(body([V(0.12, 0.47, -0.12), V(0.12, 0.47, -0.3), V(0.24, 0.4, -0.16), V(0.24, 0.4, -0.29),
    V(0.27, 0.3, -0.18), V(0.27, 0.3, -0.27), V(0.2, 0.22, -0.13), V(0.2, 0.22, -0.3)]));
  L.push(body([...ring(V(BL.x - 0.01, 0.33, BL.z - 0.03), 0.09, 0.11, 8), ...ring(V(BL.x + 0.006, 0.18, BL.z - 0.015), 0.1, 0.108, 8),
    ...ring(V(BL.x, 0.085, BL.z + 0.005), 0.082, 0.084, 8)], 0.0, 0.6));
  // paws: chunky dark blocks with 3 toes and long gold claws; one slim gold band
  const paw = (x, z, cl) => {
    L.push(paint(hull(cbox(V(x, 0.045, z + 0.015), 0.095, 0.045, 0.09, 0.026)), SW.dark, 'y', [0, 0.1]));
    for (const dx of [-0.055, 0, 0.055]) {
      L.push(paint(hull(cbox(V(x + dx, 0.038, z + 0.085), 0.029, 0.038, 0.034, 0.013)), SW.dark, 'y', [0, 0.1]));
      L.push(paint(tube([{ p: V(x + dx, 0.036, z + 0.112), rx: 0.019, ry: 0.016 },
        { p: V(x + dx, 0.029, z + 0.112 + cl * 0.6), rx: 0.013, ry: 0.012 },
        { p: V(x + dx, 0.004, z + 0.112 + cl), rx: 0.002, ry: 0.002 }], { seg: 4, ref: V(0, 1, 0), phase: Math.PI / 4 }), SW.claw, 'len'));
    }
    L.push(paint(hull([...ring(V(x, 0.1, z + 0.006), 0.096, 0.098, 8), ...ring(V(x, 0.122, z + 0.004), 0.098, 0.1, 8)]), SW.gold, 'y', [0.09, 0.13]));
  };
  paw(FL.x, FL.z, 0.08);
  paw(BL.x, BL.z, 0.055);

  // ================= ARMOUR =================
  // gold collar (sides + underside, leaving the mantle unbroken) with lapis studs
  const collarArc = (z, cy, rx, ry) => {
    const pts = [];
    for (let kk = 0; kk <= 10; kk++) {
      const a = ((-200 + 220 * kk / 10) * Math.PI) / 180;
      pts.push(V(Math.cos(a) * rx, cy + Math.sin(a) * ry, z));
    }
    return pts;
  };
  C.push(paint(hull([...collarArc(0.21, 0.395, 0.228, 0.178), ...collarArc(0.27, 0.41, 0.222, 0.175)]), SW.gold, 'y', [0.22, 0.5]));
  for (const deg of [-90, -55, -20, 12]) {
    const a = (deg * Math.PI) / 180, n = V(Math.cos(a), Math.sin(a), 0);
    const p = V(n.x * 0.226, 0.402 + n.y * 0.177, 0.24);
    const g = paint(hull([p.clone().addScaledVector(n, 0.022), ...ring(p, 0.017, 0.017, 4, 'z', 0),
      ...ring(p.clone().addScaledVector(n, -0.01), 0.017, 0.017, 4, 'z', 0).map((q) => q.add(V(0, 0, 0.02)))]), SW.lapis, 'y');
    if (deg === -90) C.push(g); else S.push(g);
  }
  // shell helpers for plates
  const shell = (c, r0, r1, dirs) => hull(dirs.flatMap((d) => [c.clone().addScaledVector(d, r0), c.clone().addScaledVector(d, r1)]));
  const capDirs = (c0, sa = 1, sb = 1) => {
    const out = [];
    for (const [a, b] of [[0, 0], [35, 0], [-35, 0], [0, 40], [0, -40], [30, 35], [30, -35], [-30, 35], [-30, -35]]) {
      const d = c0.clone();
      d.applyAxisAngle(V(0, 0, 1), (a * sa * Math.PI) / 180).applyAxisAngle(V(0, 1, 0), (b * sb * Math.PI) / 180);
      out.push(d.normalize());
    }
    return out;
  };
  const gem = (c, d, r, size, sw = SW.lapis) => {
    const u = new THREE.Vector3().crossVectors(d, V(0, 0, 1)).normalize(), v = V(0, 0, 1);
    const p = c.clone().addScaledVector(d, r - 0.01);
    const pts = [c.clone().addScaledVector(d, r + 0.02)];
    for (const [du, dv, h] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0.7, 0, 0.014], [-0.7, 0, 0.014], [0, 0.7, 0.014], [0, -0.7, 0.014]])
      pts.push(p.clone().addScaledVector(u, du * size).addScaledVector(v, dv * size).addScaledVector(d, h));
    return paint(hull(pts), sw, 'y');
  };
  // shoulder plate: gold pauldron with a bold lapis band and a gold boss
  const SC = V(0.17, 0.36, 0.17), sdir = V(0.82, 0.55, 0.08).normalize();
  S.push(paint(shell(SC, 0.105, 0.132, capDirs(sdir, 1.1, 1.05)), SW.gold, 'y', [0.3, 0.55]));
  S.push(paint(shell(SC, 0.12, 0.139, capDirs(sdir, 1.15, 0.38)), SW.lapis, 'y', [0.3, 0.55]));
  S.push(gem(SC, sdir, 0.139, 0.026, SW.gold));
  // hip plate: sandstone with gold rim and lapis gem
  const HC = V(0.17, 0.33, -0.21), hdir = V(0.85, 0.45, -0.15).normalize();
  S.push(paint(shell(HC, 0.1, 0.128, capDirs(hdir, 1.1, 1.0).map((d) => d.clone().lerp(hdir, -0.12).normalize())), SW.gold, 'y', [0.25, 0.5]));
  S.push(paint(shell(HC, 0.11, 0.136, capDirs(hdir, 0.95, 0.9)), SW.sand, 'y', [0.25, 0.5]));
  S.push(gem(HC, hdir, 0.136, 0.03));

  // ================= TAIL (short, thick, raised; silver base -> dark) =================
  C.push(paint(tube(curveSamples([V(0, 0.36, -0.32), V(0, 0.44, -0.43), V(0, 0.55, -0.49), V(0, 0.63, -0.5)], 5,
    (t) => 0.078 - 0.035 * t), { seg: 6, axis: X, capEnd: 0.045, phase: Math.PI / 6 }), SW.tail, 'len'));
  const tdk = (b, n, w, l, back) => leaf(b, n.normalize(), w, l, back.normalize(), 0.02, SW.dark);
  C.push(tdk(V(0, 0.6, -0.53), V(0, 0.2, -1), 0.045, 0.1, V(0, 1, -0.35)));
  S.push(tdk(V(0.045, 0.56, -0.5), V(1, 0, -0.4), 0.04, 0.09, V(0.35, 1, -0.4)));
  S.push(tdk(V(0.05, 0.5, -0.47), V(1, 0, -0.3), 0.04, 0.09, V(0.4, 0.7, -0.6)));

  // lower the whole upper body for a low, grounded stance
  for (const g of [...C, ...S]) g.translate(0, -0.035, 0);
  S.push(...L);
  return assemble(C, S);
}

// Egg King Dragon (DIVINE): golden dragon king, purple wings with white feather coverts, jeweled crown,
// egg-shaped glowing gold chest gem, floating golden halo + radiant aura rays, glowing gold armour, white marble plates.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// Glow swatch whose emissive contribution is scaled by k (modest glow). makeAtlas paints the emissive atlas on a
// black canvas, so an untouched corner pixel tells the two passes apart.
const scaleHex = (h, k) => '#' + [1, 3, 5].map((o) => Math.round(parseInt(h.slice(o, o + 2), 16) * k).toString(16).padStart(2, '0')).join('');
const glowSw = (i, top, bot, k) => ({
  i, top, bot, glow: true,
  draw(g, x, y) {
    const em = g.getImageData(1020, 1020, 1, 1).data[0] < 128;
    const t = em ? scaleHex(top, k) : top, b = em ? scaleHex(bot, k) : bot;
    const grad = g.createLinearGradient(0, y + 16, 0, y + 112);
    grad.addColorStop(0, t); grad.addColorStop(1, b);
    g.fillStyle = t; g.fillRect(x, y, 128, 16);
    g.fillStyle = grad; g.fillRect(x, y + 16, 128, 96);
    g.fillStyle = b; g.fillRect(x, y + 112, 128, 16);
  },
});

export const PALETTE = {
  gold:    { i: 0, top: '#F5BC40', bot: '#C47512' },          // body scales
  goldDk:  { i: 1, top: '#E6A232', bot: '#A9620C' },          // brow, jaw, frills
  armor:   glowSw(2, '#FFC83A', '#E09A10', 0.22),            // glowing gold armour (modest emissive)
  marble:  { i: 3, top: '#FFFFFF', bot: '#DAD5E6' },          // white marble
  memb:    { i: 4, top: '#C995FF', bot: '#7A3CDB' },          // purple membrane
  purple:  { i: 5, top: '#A15CF0', bot: '#5B22AE' },          // purple wing arms
  feather: { i: 6, top: '#FFFFFF', bot: '#EAE2FF' },          // light feathers
  white:   { i: 7, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:     { i: 8, top: '#1A1416', bot: '#0C0A0B' },
  nose:    { i: 9, top: '#7A3A12', bot: '#4A1E08' },
  gemR:    glowSw(10, '#FF7A9C', '#D4164A', 0.45),
  gemB:    glowSw(11, '#9FF2FF', '#2FA8F2', 0.45),
  gemP:    glowSw(12, '#E7B8FF', '#A64DFF', 0.45),
  egg:     glowSw(13, '#FFF5B0', '#E8A010', 0.5),            // egg gem (faceted light/dark planes)
  eggHi:   { i: 17, top: '#FFFFFF', bot: '#FFF8DC', glow: true },  // egg highlight facet
  halo:    { i: 14, top: '#FFF08A', bot: '#FFC21A', glow: true },
  goldT:   { i: 15, top: '#E8A420', bot: '#FFF0A0' },          // horns (tip light)
  trim:    { i: 16, top: '#FFD84A', bot: '#C98208' },          // gold trim (matte)
};
const P = PALETTE;
const DROP = 0.035;
const FEATH = [[0, -0.35], [0, 0.35], [0.25, 0.5], [0.7, 0.42], [1, 0], [0.7, -0.42], [0.25, -0.5]];
const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const sub = (a, b) => a.clone().sub(b);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);

// flat blade (feather / ray) lying in the plane with normal n
function blade(base, dir, n, L, w, th = 0.016, shape = null) {
  const d = nrm(dir);
  const nn = nrm(add(n, d, -n.dot(d)));
  const v = nrm(cross(nn, d));
  const pts2 = shape || [[0, -0.3], [0, 0.3], [0.2, 0.5], [0.8, 0.5], [1, 0.05], [0.8, -0.5], [0.2, -0.5]];
  const pts = [];
  for (const [u, s] of pts2) {
    const p = add(add(base, d, u * L), v, s * w);
    pts.push(add(p, nn, th / 2), add(p, nn, -th / 2));
  }
  return hull(pts);
}

function torus(c, R, r, radial, tubular, tilt = 0) {
  const g = new THREE.TorusGeometry(R, r, radial, tubular).toNonIndexed();
  g.rotateX(Math.PI / 2 + tilt);
  g.rotateY(Math.PI / tubular); // symmetric about x = 0
  g.translate(c.x, c.y, c.z);
  g.deleteAttribute('normal'); g.deleteAttribute('uv');
  g.computeVertexNormals();
  return g;
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const gold = (pts, lo = 0, hi = 1.0) => paint(hull(pts), P.gold, 'y', [lo, hi]);
  const arm = (g, lo, hi) => paint(g, P.armor, lo === undefined ? 'flat' : 'y', lo === undefined ? null : [lo, hi]);
  const marble = (g, lo, hi) => paint(g, P.marble, lo === undefined ? 'flat' : 'y', lo === undefined ? null : [lo, hi]);

  // ================= BODY =================
  C.push(gold([
    ...ring(V(0, 0.34, -0.38), 0.12, 0.12, 10, 'z'),
    ...ring(V(0, 0.34, -0.28), 0.19, 0.18, 10, 'z'),
    ...ring(V(0, 0.35, -0.12), 0.22, 0.21, 10, 'z'),
    ...ring(V(0, 0.38, 0.04), 0.22, 0.22, 10, 'z'),
    ...ring(V(0, 0.41, 0.16), 0.2, 0.21, 10, 'z'),
    ...ring(V(0, 0.44, 0.25), 0.13, 0.14, 10, 'z'),
  ], 0.12, 0.6));
  C.push(gold([...ring(V(0, 0.46, 0.15), 0.15, 0.14, 10, 'y'), ...ring(V(0, 0.68, 0.24), 0.13, 0.12, 10, 'y')], 0.35, 0.85));

  // ================= LEGS =================
  S.push(gold([...ring(V(0.17, 0.08, 0.22), 0.088, 0.088, 8), ...ring(V(0.17, 0.2, 0.2), 0.095, 0.098, 8),
    ...ring(V(0.15, 0.34, 0.14), 0.11, 0.12, 8)], 0.0, 0.6));
  S.push(paint(blob(0, V(0.165, 0.33, 0.14), V(0.12, 0.15, 0.135), { jitter: 0.1 }), P.gold, 'y', [0.0, 0.6]));
  S.push(paint(blob(1, V(0.175, 0.26, -0.17), V(0.13, 0.155, 0.17), { jitter: 0.12 }), P.gold, 'y', [0.0, 0.6]));
  S.push(gold([...ring(V(0.18, 0.24, -0.16), 0.09, 0.095, 8), ...ring(V(0.19, 0.13, -0.19), 0.08, 0.08, 8),
    ...ring(V(0.19, 0.08, -0.18), 0.078, 0.078, 8)], 0.0, 0.6));
  // armour greaves (glowing gold bands with marble cuff) on each leg
  const greave = (c, r) => {
    S.push(arm(hull([...ring(add(c, V(0, -0.035, 0)), r, r, 8), ...ring(add(c, V(0, 0.035, 0)), r * 1.06, r * 1.06, 8)])));
    S.push(marble(hull([...ring(add(c, V(0, 0.04, 0)), r * 0.98, r * 0.98, 8), ...ring(add(c, V(0, 0.06, 0)), r * 0.92, r * 0.92, 8)])));
  };
  greave(V(0.17, 0.155, 0.21), 0.104);
  greave(V(0.19, 0.145, -0.185), 0.092);
  // feet: gold block + 3 marble-white claws
  const foot = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.055, z + 0.01), 0.09, 0.055, 0.08, 0.028)), P.gold, 'y', [0, 0.3]));
    for (const dx of [-0.056, 0, 0.056]) {
      const b = V(x + dx, 0.0, z + 0.08);
      S.push(marble(hull([
        V(b.x - 0.026, 0.0, b.z - 0.02), V(b.x + 0.026, 0.0, b.z - 0.02),
        V(b.x - 0.022, 0.055, b.z - 0.02), V(b.x + 0.022, 0.055, b.z - 0.02),
        V(b.x, 0.062, b.z + 0.0), V(b.x + dx * 0.15, 0.0, b.z + 0.075),
        V(b.x - 0.018, 0.0, b.z + 0.035), V(b.x + 0.018, 0.0, b.z + 0.035),
      ]), 0, 0.07));
    }
  };
  foot(0.175, 0.23);
  foot(0.195, -0.17);
  const nC = C.length, nS = S.length;

  // ================= BELLY: white marble plates =================
  const belly = [
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
    C.push(marble(hull(pts), 0.2, 0.6));
  }
  // chest armour plate (gold trim) with marble rim, egg gem in the middle
  const EY = 0.5, EZ = 0.375;
  C.push(paint(hull([
    ...plate([[-0.15, 0.13], [0.15, 0.13], [0.175, 0.0], [0.13, -0.12], [0, -0.17], [-0.13, -0.12], [-0.175, 0.0]], V(0, EY, 0), 0.22, 0.33),
    ...plate([[-0.125, 0.11], [0.125, 0.11], [0.15, 0.0], [0.11, -0.1], [0, -0.145], [-0.11, -0.1], [-0.15, 0.0]], V(0, EY, 0), 0.22, EZ),
  ]), P.trim, 'y', [EY - 0.15, EY + 0.14]));
  // marble setting (egg-shaped oval rim) + 4 gold prongs
  {
    const rim = (z, s) => { const pts = []; for (let k = 0; k < 10; k++) { const a = (2 * Math.PI * k) / 10;
      const yy = Math.sin(a); pts.push(V(Math.cos(a) * 0.09 * s * (yy > 0 ? 1 - 0.3 * yy : 1), EY + 0.005 + yy * 0.13 * s, z)); } return pts; };
    C.push(marble(hull([...rim(EZ - 0.01, 1.08), ...rim(EZ + 0.014, 1.0)])));
    for (const [px, py] of [[0.068, 0.06], [0.078, -0.06]])
      S.push(arm(hull(cbox(V(px, EY + py, EZ + 0.03), 0.016, 0.02, 0.018, 0.006))));
  }
  {
    // egg-shaped gem: tall, pointed top, wide bottom, faceted (6 sides x 5 rings)
    const pts = [];
    const prof = [[-0.115, 0.0], [-0.098, 0.058], [-0.05, 0.084], [0.01, 0.079], [0.065, 0.054], [0.11, 0.02], [0.138, 0.0]];
    const ex = (y0, r, k, off) => { const a = off + (2 * Math.PI * k) / 6, sn = Math.sin(a); return V(Math.cos(a) * r, EY + y0, EZ + 0.012 + (sn > 0 ? sn * r * 1.05 : sn * r * 0.15)); };
    prof.forEach(([dy, r], j) => {
      if (r === 0) { pts.push(V(0, EY + dy, EZ + 0.02 + (j ? 0.012 : 0.01))); return; }
      for (let k = 0; k < 6; k++) pts.push(ex(dy, r, k, j % 2 ? 0 : Math.PI / 6));
    });
    const g = hull(pts);
    // per-facet colour: upward/front facets light, side/downward facets dark gold, one bright highlight pair
    const pos = g.attributes.position, uv = [];
    const cell = (sw, t) => { const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128; return [(x + 64) / 1024, (y + 16 + Math.min(1, Math.max(0, t)) * 96) / 1024]; };
    const nT = nrm(V(0.42, 0.42, 0.8)), faces = [];
    for (let f = 0; f < pos.count; f += 3) {
      const a = V(pos.getX(f), pos.getY(f), pos.getZ(f)), b = V(pos.getX(f + 1), pos.getY(f + 1), pos.getZ(f + 1)), c = V(pos.getX(f + 2), pos.getY(f + 2), pos.getZ(f + 2));
      const n = nrm(cross(sub(b, a), sub(c, a)));
      faces.push({ n, s: V(Math.abs(n.x), n.y, n.z).dot(nT) });
    }
    const best = Math.max(...faces.map((q) => q.s));
    for (const { n, s: sc } of faces) {
      const hi = sc > best - 0.01;
      const t = 0.55 - 0.45 * n.y + 0.45 * Math.abs(n.x) - 0.25 * n.z;
      const u = hi ? cell(P.eggHi, 0.2) : cell(P.egg, t);
      uv.push(...u, ...u, ...u);
    }
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    C.push(g);
  }

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
  // snout armour ridge (gold plate on nose bridge)
  C.push(arm(hull([V(0.035, H.y + 0.0, FZ - 0.0), V(-0.035, H.y + 0.0, FZ - 0.0), V(0.03, H.y - 0.003, FZ + 0.13), V(-0.03, H.y - 0.003, FZ + 0.13),
    V(0, H.y + 0.03, FZ - 0.0), V(0, H.y + 0.016, FZ + 0.12), V(0.04, H.y - 0.02, FZ + 0.0), V(-0.04, H.y - 0.02, FZ + 0.0)])));
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

  // horns: sweeping back
  S.push(paint(tube(curveSamples(
    [V(0.1, H.y + 0.12, H.z - 0.04), V(0.16, H.y + 0.22, H.z - 0.14), V(0.2, H.y + 0.3, H.z - 0.29)],
    5, (t) => 0.055 * (1 - t) + 0.004), { seg: 6, capEnd: 0.0 }), P.goldT, 'len'));
  // white feather frills on head sides (light feathers)
  for (const [b, d, L, w] of [
    [V(0.17, H.y + 0.04, H.z - 0.1), V(0.3, 0.6, -1), 0.21, 0.1],
    [V(0.19, H.y - 0.04, H.z - 0.06), V(0.4, 0.1, -1), 0.2, 0.1],
    [V(0.18, H.y - 0.11, H.z - 0.02), V(0.45, -0.4, -1), 0.16, 0.085],
  ]) S.push(paint(blade(b, d, V(1, 0, 0.25), L, w, 0.022, FEATH), P.feather, 'y', [H.y - 0.25, H.y + 0.1]));

  // ================= JEWELED CROWN =================
  const CY = H.y + 0.165, CZ = H.z - 0.01;
  C.push(arm(hull([...ring(V(0, CY, CZ), 0.13, 0.12, 10, 'y'), ...ring(V(0, CY + 0.07, CZ), 0.145, 0.135, 10, 'y')]), CY - 0.03, CY + 0.2));
  // crown points
  const crownPts = [[0, 0.11, 1.25], [0.4, 0.09, 1.0], [0.8, 0.075, 0.9]]; // angle from front, height, scale
  for (const [a, h, s] of crownPts) {
    const x = Math.sin(a) * 0.14, z = CZ + Math.cos(a) * 0.13;
    const g = hull([V(x - 0.035 * s * Math.cos(a), CY + 0.06, z + 0.035 * s * Math.sin(a)), V(x + 0.035 * s * Math.cos(a), CY + 0.06, z - 0.035 * s * Math.sin(a)),
      V(x - 0.008 * Math.sin(a), CY + 0.06, z - 0.008 * Math.cos(a)), V(x + 0.012 * Math.sin(a), CY + 0.06, z + 0.012 * Math.cos(a)),
      V(x, CY + 0.06 + h * s, z)]);
    arm(g);
    if (a === 0) C.push(g); else S.push(g);
  }
  // back points
  for (const a of [1.5, 2.3]) {
    const x = Math.sin(a) * 0.14, z = CZ + Math.cos(a) * 0.13;
    S.push(arm(shard(V(x, CY + 0.06, z), V(Math.sin(a) * 0.2, 1, Math.cos(a) * 0.2), 0.03, 0.08)));
  }
  C.push(arm(shard(V(0, CY + 0.06, CZ - 0.13), V(0, 1, -0.2), 0.03, 0.08)));
  // jewels on the band: big red centre, blue sides, purple further back
  const jewel = (x, y, z, r, sw, a) => {
    const n = V(Math.sin(a), 0, Math.cos(a));
    const t = V(Math.cos(a), 0, -Math.sin(a));
    const c = V(x, y, z);
    const pts = [];
    for (let k = 0; k < 6; k++) {
      const th = (2 * Math.PI * k) / 6 + Math.PI / 6;
      pts.push(add(add(add(c, t, Math.cos(th) * r), V(0, 1, 0), Math.sin(th) * r), n, -0.01));
    }
    pts.push(add(c, n, r * 0.7));
    return paint(hull(pts), sw, 'y', [y - r, y + r]);
  };
  C.push(jewel(0, CY + 0.035, CZ + 0.14, 0.038, P.gemR, 0));
  S.push(jewel(Math.sin(0.62) * 0.14, CY + 0.035, CZ + Math.cos(0.62) * 0.13, 0.028, P.gemB, 0.62));
  S.push(jewel(Math.sin(1.3) * 0.143, CY + 0.035, CZ + Math.cos(1.3) * 0.133, 0.025, P.gemP, 1.3));
  C.push(jewel(0, CY + 0.06 + 0.07, CZ + 0.135, 0.018, P.gemB, 0));

  // ================= FLOATING HALO + RADIANT AURA =================
  const HC = V(0, H.y + 0.48, H.z - 0.06);
  C.push(paint(torus(HC, 0.19, 0.028, 5, 16, -0.25), P.halo, 'flat'));
  // radiant aura: one solid sunburst fan behind the head (wedges share edges -> reads as a single plate)
  {
    const AC = V(0, H.y + 0.03, -0.05), r1 = 0.2, r2 = 0.3, r3 = 0.39, N = 9, A0 = 0.98, th = 0.012;
    for (let k = 0; k < N; k++) {
      const a0 = -A0 + (2 * A0 * k) / N, a1 = -A0 + (2 * A0 * (k + 1)) / N, am = (a0 + a1) / 2;
      const P2 = (a, r) => V(Math.sin(a) * r, AC.y + Math.cos(a) * r, AC.z);
      const tipR = k % 2 === 0 ? r3 : r3 - 0.05;
      const pts = [];
      for (const q of [P2(a0, r1), P2(a1, r1), P2(a0, r2), P2(a1, r2), P2(am, tipR)]) pts.push(add(q, V(0, 0, 1), th), add(q, V(0, 0, 1), -th));
      const g = paint(hull(pts), P.halo, 'y', [AC.y, AC.y + r3]);
      if (k === (N - 1) / 2) C.push(g); else if (am > 0) S.push(g);
    }
  }

  // ================= BACK: armour spine plates + gold spikes =================
  // back saddle: two glowing gold armour plates with marble trim edges (coords pre-drop, hence +DROP)
  const saddle = (z0, z1, y0, y1, R, sw, a0 = 1.05) => {
    const pts = [];
    for (const [z, y] of [[z0, y0], [z1, y1]]) for (let k = 0; k <= 6; k++) {
      const a = -a0 + 2 * a0 * k / 6;
      for (const r of [R, R - 0.05]) pts.push(V(Math.sin(a) * r, y + DROP + Math.cos(a) * r, z));
    }
    return paint(hull(pts), sw, 'y', [0.4, 0.7]);
  };
  C.push(saddle(0.1, -0.06, 0.385, 0.365, 0.245, P.armor));
  C.push(saddle(-0.07, -0.1, 0.362, 0.36, 0.25, P.marble, 1.1));
  C.push(saddle(-0.11, -0.26, 0.355, 0.345, 0.235, P.armor));
  for (const [y, z, s] of [[0.66, 0.15, 0.9], [0.66, 0.03, 1.25], [0.64, -0.17, 1.25], [0.58, -0.3, 0.95]])
    C.push(arm(shard(V(0, y, z), V(0, 1, -0.5), 0.06 * s, 0.13 * s)));
  // shoulder pauldrons (glowing gold, marble trim)
  S.push(arm(hull([...ring(V(0.17, 0.57, 0.15), 0.06, 0.07, 8, 'y'), ...ring(V(0.22, 0.5, 0.15), 0.11, 0.12, 8, 'y'),
    ...ring(V(0.24, 0.43, 0.15), 0.11, 0.125, 8, 'y')]), 0.38, 0.6));
  S.push(marble(hull([...ring(V(0.245, 0.425, 0.15), 0.118, 0.132, 8, 'y'), ...ring(V(0.245, 0.4, 0.15), 0.112, 0.126, 8, 'y')])));
  S.push(arm(shard(V(0.25, 0.52, 0.15), V(0.7, 1, 0.1), 0.045, 0.1)));

  // ================= TAIL =================
  const tailPts = [V(0, 0.34, -0.3), V(0, 0.22, -0.5), V(0, 0.12, -0.7), V(0, 0.12, -0.9), V(0, 0.24, -1.04), V(0, 0.44, -1.06)];
  C.push(paint(tube(curveSamples(tailPts, 12, (t) => 0.11 * (1 - t) + 0.026), { seg: 8, axis: X, capEnd: 0.02 }), P.gold, 'len'));
  const tc = new THREE.CatmullRomCurve3(tailPts, false, 'centripetal');
  for (const t of [0.14, 0.3, 0.46, 0.62, 0.78]) {
    const p = tc.getPoint(t), T = tc.getTangent(t);
    const n = V(0, T.z, -T.y).normalize(); if (n.y + n.z * 0.3 < 0) n.negate();
    const r = 0.11 * (1 - t) + 0.026;
    const k = 1.15 - t * 0.6;
    C.push(arm(shard(p.clone().addScaledVector(n, r * 0.75), n.clone().addScaledVector(T, -0.6), 0.045 * k, 0.09 * k)));
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
    C.push(marble(hull(pts)));
  }
  // glowing armour bands with marble edge around the tail
  for (const t of [0.38, 0.7]) {
    const p = tc.getPoint(t), T = tc.getTangent(t), r = (0.11 * (1 - t) + 0.026) * 1.14;
    const A = X, B = nrm(cross(T, X));
    const band = (off, rr) => { const pts = []; for (let k = 0; k < 8; k++) { const a = Math.PI / 8 + k * Math.PI / 4;
      for (const o of off) pts.push(add(add(add(p, T, o), A, Math.cos(a) * rr), B, Math.sin(a) * rr)); } return pts; };
    C.push(arm(hull(band([-0.022, 0.022], r))));
    C.push(marble(hull(band([0.024, 0.034], r * 0.96))));
  }
  // tail tip: gold spade blade + side barbs, two small white feathers
  const tip = tc.getPoint(1), tT = tc.getTangent(1);
  const tB = add(tip, tT, 0.03);
  C.push(arm(hull([add(tB, tT, 0.24), add(tip, tT, -0.03),
    add(add(tB, tT, 0.07), X, 0.11), add(add(tB, tT, 0.07), X, -0.11),
    add(add(tB, tT, 0.06), V(0, 0, 1), 0.035), add(add(tB, tT, 0.06), V(0, 0, 1), -0.035)])));
  S.push(arm(shard(add(add(tB, tT, 0.03), X, 0.06), nrm(add(X, tT, -0.5)), 0.03, 0.1)));
  S.push(paint(blade(add(add(tip, X, 0.03), tT, 0.02), V(0.35, -0.35, -1), V(1, 0, 0.3), 0.14, 0.065, 0.016, FEATH), P.feather, 'flat'));

  // ================= WINGS (purple membrane, purple arms, gold claws, white feather coverts) =================
  const Sh = V(0.13, 0.55, 0.0), El = V(0.3, 0.88, -0.1), Wr = V(0.4, 1.24, -0.17);
  const tips = [V(0.83, 1.14, -0.33), V(0.8, 0.62, -0.38), V(0.52, 0.34, -0.34)];
  const Bd = V(0.14, 0.5, -0.2);
  S.push(paint(tube(curveSamples([Sh, El, Wr], 6, (t) => 0.062 - 0.022 * t), { seg: 6, capEnd: 0.02 }), P.trim, 'y', [0.4, 1.2]));
  S.push(arm(blob(0, Wr, V(0.055, 0.055, 0.055), { jitter: 0.1 })));
  tips.forEach((T) => {
    S.push(paint(tube(curveSamples([Wr, Wr.clone().lerp(T, 0.5).add(V(0, 0.03, 0)), T], 4, (t) => 0.032 * (1 - t) + 0.016),
      { seg: 5, capEnd: 0.0 }), P.purple, 'y', [0.2, 1.2]));
    S.push(arm(shard(T, nrm(sub(T, Wr)), 0.02, 0.06)));
  });
  S.push(arm(shard(Wr.clone().add(V(0, 0.03, 0.02)), V(-0.1, 1, 0.5), 0.035, 0.1)));
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
  // white feather coverts hanging off the arm (front side of wing)
  const wn = nrm(cross(sub(El, Sh), sub(tips[2], Sh))); if (wn.z < 0) wn.negate();
  const armPt = (t) => (t < 0.5 ? Sh.clone().lerp(El, t * 2) : El.clone().lerp(Wr, (t - 0.5) * 2));
  for (let i = 0; i < 8; i++) {
    const t = 0.12 + i * 0.115;
    const dir = nrm(V(0.1 + 0.35 * t, -1, -0.15 - 0.2 * t));
    S.push(paint(blade(add(armPt(t), wn, 0.02 + 0.003 * i), dir, wn, 0.2 + 0.05 * Math.sin(Math.PI * t), 0.1, 0.018, FEATH), P.feather, 'y', [0.3, 1.2]));
  }
  for (let i = 0; i < 6; i++) {
    const t = 0.18 + i * 0.13;
    const dir = nrm(V(0.1 + 0.3 * t, -1, -0.1));
    S.push(paint(blade(add(armPt(t), wn, 0.045 + 0.003 * i), dir, wn, 0.12, 0.085, 0.018, FEATH), P.feather, 'y', [0.3, 1.2]));
  }

  for (const g of C.slice(nC)) g.translate(0, -DROP, 0);
  for (const g of S.slice(nS)) g.translate(0, -DROP, 0);
  return assemble(C, S);
}

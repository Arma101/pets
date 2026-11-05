// Thunder Unicorn (SECRET): chunky faceted white-marble unicorn with a purple lightning-bolt mane,
// glowing spiral horn, gold trim, light feathers, glowing lightning markings and floating halo + crystals.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// white marble: soft vertical shading + lavender/grey veins + one thin gold vein
function drawMarble(g, x, y) {
  const grad = g.createLinearGradient(0, y + 8, 0, y + 120);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.55, '#F4F0FA');
  grad.addColorStop(1, '#E2DAEE');
  g.fillStyle = grad; g.fillRect(x, y, 128, 128);
  g.save();
  g.beginPath(); g.rect(x, y, 128, 128); g.clip();
  g.lineCap = 'round'; g.lineJoin = 'round';
  const vein = (pts, col, w) => {
    g.strokeStyle = col; g.lineWidth = w; g.beginPath();
    pts.forEach(([u, v], k) => (k ? g.lineTo(x + u, y + v) : g.moveTo(x + u, y + v)));
    g.stroke();
  };
  vein([[10, 30], [30, 38], [44, 30], [62, 46], [80, 42], [104, 60], [124, 58]], 'rgba(185,170,220,0.35)', 1.6);
  vein([[44, 30], [52, 18], [70, 12]], 'rgba(175,160,210,0.3)', 1.2);
  vein([[4, 76], [24, 70], [40, 84], [60, 80], [74, 96], [98, 92], [122, 104]], 'rgba(185,170,220,0.3)', 1.4);
  vein([[60, 80], [66, 64], [84, 62]], 'rgba(175,160,210,0.3)', 1.2);
  vein([[14, 108], [36, 100], [52, 114], [76, 112]], 'rgba(175,160,210,0.35)', 1.4);
  vein([[18, 54], [40, 58], [54, 50], [76, 60], [100, 76], [118, 80]], 'rgba(224,176,50,0.3)', 1.2);
  g.restore();
}

export const PALETTE = {
  body:    { i: 0, draw: drawMarble },
  muzzle:  { i: 1, top: '#FDFBFF', bot: '#E6DDF0' },
  mane:    { i: 2, top: '#7438F0', bot: '#3A1498' },
  bolt:    { i: 3, top: '#B08AFF', bot: '#7C3CFF', glow: true },
  gold:    { i: 4, top: '#FFE680', bot: '#D69A12' },
  eye:     { i: 5, top: '#1A1416', bot: '#0C0A0B' },
  white:   { i: 6, top: '#FFFFFF', bot: '#F1F1F4' },
  brow:    { i: 7, top: '#EEE6F8', bot: '#BFB0DA' },
  horn:    { i: 8, top: '#FFFBE0', bot: '#FFC93C', glow: true },
  feather: { i: 9, top: '#FFFFFF', bot: '#E4D8F4' }
  , featherTip: { i: 14, top: '#FFF2B8', bot: '#F2C94C' },
  gem:     { i: 10, top: '#CDB8FF', bot: '#7A40FF', glow: true },
  nostril: { i: 11, top: '#8A7896', bot: '#5E4E6E' },
  ear:     { i: 12, top: '#E2C8FF', bot: '#B98CF0' },
  tail:    { i: 13, top: '#7E44F4', bot: '#3A1498' },
  head:    { i: 15, top: '#FFFFFF', bot: '#E4DCEE' },
};
const SW = PALETTE;

// marble UV: map world (y, z) across the marble cell so veins sweep across the body
function paintMarble(g) {
  const p = g.attributes.position, uv = [];
  const sw = SW.body, cx = (sw.i % 8) * 128, cy = Math.floor(sw.i / 8) * 128;
  for (let k = 0; k < p.count; k++) {
    const x = Math.abs(p.getX(k)), y = p.getY(k), z = p.getZ(k);
    const u = THREE.MathUtils.clamp((z + 0.62) / 1.25 + 0.3 * y + 0.4 * x - 0.15, 0, 1);
    const v = THREE.MathUtils.clamp(1 - (y + 0.02) / 1.25 + 0.3 * z + 0.2 * x, 0, 1);
    uv.push((cx + 8 + u * 112) / 1024, (cy + 8 + v * 112) / 1024);
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}

// flat feather blade: base b, direction d, plane normal n
function blade(b, d, n, w, len, th = 0.012) {
  d = d.clone().normalize();
  const s = new THREE.Vector3().crossVectors(d, n).normalize();
  const nn = new THREE.Vector3().crossVectors(s, d).normalize();
  const pts = [];
  const prof = [[0, 0.55], [0.3, 1], [0.75, 0.75], [1, 0]];
  for (const [t, wf] of prof) for (const sg of [-1, 1]) for (const k of [-1, 1]) {
    if (wf === 0 && sg === 1) continue;
    pts.push(b.clone().addScaledVector(d, t * len).addScaledVector(s, sg * wf * w).addScaledVector(nn, k * th * (wf === 0 ? 0.3 : 1)));
  }
  return hull(pts);
}

// lightning bolt: zig-zag of 3 convex strips in the plane spanned by d (length) and s = d x n (side).
// w = half stroke width; the bolt drifts sideways, jogs back, then stabs to a point.
function bolt(b, d, n, len, w, th = 0.02, flip = 1) {
  d = d.clone().normalize(); n = n.clone().normalize();
  const s = new THREE.Vector3().crossVectors(d, n).normalize().multiplyScalar(flip);
  const nn = new THREE.Vector3().crossVectors(s, d).normalize();
  const P = (a, c) => b.clone().addScaledVector(d, a * len).addScaledVector(s, c);
  const slab = (pts2, thick) => {
    const out = [];
    for (const [a, c] of pts2) for (const k of [-1, 1]) out.push(P(a, c).addScaledVector(nn, k * thick));
    return hull(out);
  };
  const d1 = 0.2 * len, d2 = -0.1 * len;
  return [
    slab([[-0.04, -w], [-0.04, w], [0.5, d1 + w], [0.5, d1 - w]], th),
    slab([[0.4, d1 + w], [0.56, d1 + w], [0.58, d2 - w], [0.44, d2 - w]], th * 0.95),
    slab([[0.46, d2 - w], [0.5, d2 + w * 1.2], [1.0, 0.12 * len]], th * 0.85),
  ];
}

function yaw(pts, pivot, a) {
  const q = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), a);
  return pts.map((p) => p.clone().sub(pivot).applyQuaternion(q).add(pivot));
}

export function buildGeometry() {
  const C = [], S = [];
  const body = (pts) => paintMarble(hull(pts));
  const plain = (g, lo = 0, hi = 0.6) => paint(g, SW.head, 'y', [lo, hi]);
  const gold = (g) => paint(g, SW.gold, 'y');
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= TORSO (8-sided so each flank has a flat panel for the inlay) =================
  C.push(body([
    ...ring(V(0, 0.44, -0.34), 0.1, 0.1, 8, 'z'),
    ...ring(V(0, 0.435, -0.27), 0.18, 0.17, 8, 'z'),
    ...ring(V(0, 0.43, -0.1), 0.19, 0.185, 8, 'z'),
    ...ring(V(0, 0.44, 0.08), 0.19, 0.19, 8, 'z'),
    ...ring(V(0, 0.46, 0.2), 0.17, 0.18, 8, 'z'),
    ...ring(V(0, 0.49, 0.27), 0.11, 0.13, 8, 'z'),
  ]));
  C.push(paintMarble(blob(1, V(0, 0.5, 0.22), V(0.15, 0.155, 0.115), { jitter: 0.08 })));
  // neck (shorter, thicker)
  C.push(body([
    ...ring(V(0, 0.5, 0.17), 0.145, 0.14, 8, 'y'),
    ...ring(V(0, 0.65, 0.23), 0.135, 0.13, 8, 'y'),
    ...ring(V(0, 0.75, 0.26), 0.128, 0.125, 8, 'y'),
  ]));

  // ================= LEGS (short, thick, slightly apart) =================
  const leg = (x, z, top, thick, kz) => {
    S.push(plain(hull([...ring(V(x, 0.08, z), 0.074, 0.074, 8), ...ring(V(x - 0.004, 0.2, z + kz), 0.08, 0.084, 8),
      ...ring(V(x - 0.018, top, z), thick, thick * 1.1, 8)])));
    // gold hoof + anklet
    S.push(gold(hull([...ring(V(x, 0.0, z + 0.008), 0.098, 0.103, 8), ...ring(V(x, 0.075, z), 0.084, 0.086, 8)])));
    S.push(gold(hull([...ring(V(x, 0.083, z), 0.086, 0.088, 8), ...ring(V(x, 0.118, z), 0.082, 0.084, 8)])));
    // light feathers: little ankle wings on the outside of each anklet, sweeping up and back
    for (const [dy, dz, up, l] of [[0.0, 0.0, 0.9, 0.13], [-0.012, -0.015, 0.45, 0.12], [-0.024, -0.03, 0.1, 0.1]]) {
      const base = V(x + 0.078, 0.11 + dy, z + 0.01 + dz);
      S.push(paint(blade(base, V(0.25, up, -1), V(1, 0, 0.1), 0.03, l, 0.009), SW.feather, 'y'));
    }
  };
  leg(0.125, 0.17, 0.38, 0.09, 0.012);
  leg(0.13, -0.24, 0.35, 0.087, -0.018);
  S.push(plain(blob(1, V(0.105, 0.41, 0.15), V(0.088, 0.115, 0.098), { jitter: 0.04 }), 0.1, 0.7));
  S.push(plain(blob(1, V(0.11, 0.42, -0.22), V(0.09, 0.135, 0.128), { jitter: 0.05 }), 0.1, 0.7));

  // ================= HEAD (bigger) =================
  const H = { y: 0.88, z: 0.315 };
  C.push(paint(hull([
    ...cbox(V(0, H.y, H.z), 0.194, 0.161, 0.158, 0.06),
    ...ring(V(0, H.y + 0.163, H.z - 0.01), 0.11, 0.093, 8, 'y'),
    V(0.185, H.y - 0.087, H.z + 0.033), V(-0.185, H.y - 0.087, H.z + 0.033),
  ]), SW.head, 'y', [0.72, 1.1]));
  const FZ = H.z + 0.158;
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.076, FZ - 0.02), 0.12, 0.078, 0.044, 0.027),
    ...cbox(V(0, H.y - 0.095, FZ + 0.105), 0.105, 0.078, 0.044, 0.032),
  ]), SW.muzzle, 'y', [0.66, 0.9]));
  S.push(flat(hull(plate([[-0.015, -0.011], [0.015, -0.005], [0.015, 0.013], [-0.011, 0.011]],
    V(0.05, H.y - 0.075, 0), FZ + 0.146, FZ + 0.156)), SW.nostril));
  C.push(flat(hull(cbox(V(0, H.y - 0.147, FZ + 0.105), 0.065, 0.004, 0.042, 0.002)), SW.nostril));

  // eyes (scaled with the head)
  const K = 1.09;
  const sc = (pts) => pts.map(([u, v]) => [u * K, v * K]);
  const E = V(0.113, H.y + 0.033, FZ);
  const ey = 0.3;
  const eyeP = (pts, z0, z1, c = E) => yaw(plate(sc(pts), c, z0, z1), V(E.x, E.y, FZ), ey);
  S.push(flat(hull(eyeP([[-0.04, 0.0], [0.042, 0.03], [0.048, -0.008], [0.018, -0.038], [-0.028, -0.034], [-0.044, -0.015]],
    FZ - 0.01, FZ + 0.012)), SW.white));
  S.push(flat(hull(eyeP([[-0.026, 0.004], [0.016, 0.018], [0.022, -0.006], [0.004, -0.03], [-0.02, -0.028], [-0.03, -0.01]],
    FZ + 0.006, FZ + 0.018)), SW.eye));
  S.push(flat(hull(eyeP([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    FZ + 0.014, FZ + 0.021, V(E.x + 0.008, E.y + 0.003, 0))), SW.white));
  S.push(paint(hull(yaw([
    V(0.038, E.y + 0.013, FZ + 0.032), V(0.04, E.y + 0.055, FZ + 0.024),
    V(0.17, E.y + 0.05, FZ - 0.0), V(0.17, E.y + 0.094, FZ - 0.017),
    V(0.038, E.y + 0.013, FZ - 0.032), V(0.04, E.y + 0.065, FZ - 0.043),
    V(0.17, E.y + 0.05, FZ - 0.055), V(0.17, E.y + 0.096, FZ - 0.065),
  ], V(E.x, E.y, FZ), ey)), SW.brow, 'y'));

  // ears
  S.push(paint(hull([V(0.065, H.y + 0.11, H.z - 0.02), V(0.152, H.y + 0.11, H.z - 0.02), V(0.07, H.y + 0.11, H.z - 0.097),
    V(0.147, H.y + 0.11, H.z - 0.097), V(0.136, H.y + 0.31, H.z - 0.055)]), SW.head, 'y'));
  S.push(flat(hull([V(0.082, H.y + 0.14, H.z - 0.012), V(0.136, H.y + 0.14, H.z - 0.012), V(0.128, H.y + 0.265, H.z - 0.04),
    V(0.109, H.y + 0.15, H.z - 0.044)]), SW.ear));

  // ================= HORN (glowing spiral) =================
  const hb = V(0, H.y + 0.13, FZ - 0.045), hd = V(0, 1, 0.5).normalize(), HL = 0.34;
  const hornGold = (pts) => C.push(gold(hull(pts)));
  hornGold([...cbox(V(0, H.y + 0.128, FZ - 0.045), 0.098, 0.019, 0.026, 0.008)]);
  hornGold([...ring(V(0, H.y + 0.14, FZ - 0.045), 0.052, 0.047, 8, 'y'), ...ring(V(0, H.y + 0.17, FZ - 0.035), 0.048, 0.044, 8, 'y')]);
  const NS = 6;
  const hq = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), hd);
  const hr = (t) => 0.047 * (1 - t) + 0.004;
  const hRing = (t, ph) => ring(V(0, 0, 0), hr(t), hr(t), 5, 'y', ph).map((p) => p.applyQuaternion(hq).add(hb.clone().addScaledVector(hd, 0.03 + t * HL)));
  for (let i = 0; i < NS; i++) {
    const t0 = i / NS, t1 = (i + 1) / NS;
    const pts = [...hRing(t0, i * 0.6), ...hRing(t1 * 0.999, i * 0.6 + 0.6)];
    if (i === NS - 1) pts.push(hb.clone().addScaledVector(hd, 0.03 + HL + 0.03));
    C.push(paint(hull(pts), SW.horn, 'y'));
  }
  const hel = [];
  for (let k = 0; k <= 22; k++) {
    const t = k / 22 * 0.86, a = t * Math.PI * 2 * 2.6;
    const r = hr(t) + 0.004;
    hel.push(hb.clone().addScaledVector(hd, 0.03 + t * HL).add(V(Math.cos(a) * r, 0, Math.sin(a) * r).applyQuaternion(hq)));
  }
  C.push(paint(tube(hel.map((p, k) => ({ p, rx: 0.012 * (1 - k / 30), ry: 0.012 * (1 - k / 30) })), { seg: 4, ref: hd }), SW.bolt, 'flat'));

  // ================= MANE: solid deep-purple locks + bright lightning-bolt tips =================
  // chunky swept lock (as Star Pegasus); returns its tip so a bolt can continue from it
  const lock = (b, d, w, l, n = V(1, 0.15, 0), sw = SW.mane, out = S) => {
    d = d.clone().normalize(); n = n.clone().normalize();
    const sd = new THREE.Vector3().crossVectors(d, n).normalize();
    const nn = new THREE.Vector3().crossVectors(sd, d).normalize();
    const pts = [b.clone().addScaledVector(d, l)];
    for (const [t, wf, th] of [[-0.05, 0.8, 0.04], [0.3, 1, 0.042], [0.68, 0.6, 0.026]])
      for (const sg of [-1, 1]) for (const k of [-1, 1])
        pts.push(b.clone().addScaledVector(d, t * l).addScaledVector(sd, sg * wf * w).addScaledVector(nn, k * th));
    out.push(flat(hull(pts), sw));
    return b.clone().addScaledVector(d, l * 0.72);
  };
  const boltTip = (b, d, n, len, w, out = S) => {
    for (const g of bolt(b, d, n, len, w, 0.022)) out.push(flat(g, SW.bolt));
  };
  // solid crest along the top/back of the neck
  const crestPts = [];
  for (const [y, z, hx] of [[1.06, 0.25, 0.065], [1.055, 0.15, 0.07], [0.96, 0.08, 0.075], [0.78, 0.04, 0.075],
    [0.62, -0.01, 0.07], [0.55, -0.03, 0.055], [0.6, 0.1, 0.065], [0.82, 0.18, 0.065], [0.96, 0.22, 0.065]])
    crestPts.push(V(hx, y, z), V(-hx, y, z));
  C.push(paint(hull(crestPts), SW.mane, 'y'));
  // forelock sweeping forward/out over the brow
  lock(V(0.025, H.y + 0.165, H.z + 0.0), V(0.55, -0.25, 1), 0.06, 0.2, V(0, 1, 0.25));
  lock(V(0.09, H.y + 0.14, H.z - 0.03), V(1, -0.55, 0.4), 0.055, 0.18, V(0.4, 1, 0));
  // big swept-back locks; the flagged ones end in a lightning bolt
  const locks = [
    [V(0.0, H.y + 0.17, H.z - 0.06), V(0.12, 0.4, -1), 0.07, 0.26, true],
    [V(0.08, H.y + 0.11, H.z - 0.09), V(0.5, -0.1, -1), 0.07, 0.28, false],
    [V(0.04, H.y + 0.04, H.z - 0.13), V(0.25, 0.1, -1), 0.075, 0.3, true],
    [V(0.1, 0.84, 0.17), V(0.5, -0.45, -0.9), 0.07, 0.26, false],
    [V(0.04, 0.78, 0.13), V(0.25, -0.15, -1), 0.075, 0.3, true],
    [V(0.11, 0.72, 0.14), V(0.5, -0.8, -0.7), 0.065, 0.22, false],
    [V(0.05, 0.68, 0.09), V(0.3, -0.35, -1), 0.075, 0.27, true],
    [V(0.11, 0.64, 0.1), V(0.45, -1, -0.5), 0.06, 0.14, false],
    [V(0.05, 0.62, 0.04), V(0.3, -0.25, -1), 0.065, 0.18, false],
  ];
  for (const [b, d, w, l, tip] of locks) {
    const t = lock(b, d, w, l);
    if (tip) boltTip(t, d.clone().normalize().add(V(0, -0.15, 0)), V(1, 0.15, 0), 0.2, 0.034);
  }

  // ================= TAIL: solid purple with bolt-shaped tips =================
  const tailStrand = (pts, r) => paint(tube(curveSamples(pts, 8, (t) => r * (1 - 0.6 * t) + 0.025 * Math.sin(Math.PI * t)),
    { seg: 6, axis: V(1, 0, 0), capEnd: 0.03 }), SW.tail, 'len');
  C.push(tailStrand([V(0, 0.5, -0.3), V(0, 0.56, -0.42), V(0, 0.48, -0.55), V(0, 0.34, -0.61), V(0, 0.22, -0.6)], 0.08));
  S.push(tailStrand([V(0.02, 0.5, -0.31), V(0.06, 0.5, -0.43), V(0.09, 0.38, -0.52), V(0.1, 0.25, -0.53)], 0.065));
  lock(V(0.03, 0.54, -0.32), V(0.25, -0.1, -1), 0.07, 0.24, V(1, 0.3, 0));
  lock(V(0.06, 0.5, -0.36), V(0.4, -0.8, -0.6), 0.065, 0.24, V(1, 0, 0.2));
  // bolt tips continuing the strands downward
  for (const g of bolt(V(0, 0.27, -0.6), V(0, -1, 0.05), V(1, 0, 0), 0.2, 0.036, 0.024)) C.push(flat(g, SW.bolt));
  boltTip(V(0.1, 0.3, -0.53), V(0.12, -1, 0.1), V(1, 0, 0.2), 0.18, 0.032);

  // ================= GOLD COLLAR + GEM =================
  const collar = (r) => ring(V(0, 0, 0.19), r * 1.02, r, 12, 'y').map((p) => V(p.x, 0.66 - 0.55 * (p.z - 0.19), p.z));
  C.push(gold(hull([...collar(0.15), ...collar(0.15).map((p) => V(p.x, p.y - 0.035, p.z))])));
  C.push(gold(hull(plate([[0, 0.08], [0.065, 0], [0, -0.085], [-0.065, 0]], V(0, 0.53, 0), 0.31, 0.36))));
  C.push(paint(hull([V(0, 0.595, 0.36), V(0.04, 0.53, 0.36), V(0, 0.46, 0.36), V(-0.04, 0.53, 0.36), V(0, 0.53, 0.392)]), SW.gem, 'y'));

  // ================= LIGHT FEATHERS: small folded winglets at the shoulders =================
  const wb = V(0.15, 0.6, 0.06);
  const wn = V(1, 0.0, 0.15).normalize();
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const d = V(0.18, 1.0 - 1.0 * t, -0.75 - 0.25 * t);
    S.push(paint(blade(wb.clone().add(V(0.0, -0.02 * t, -0.03 * t)), d, wn, 0.05, 0.3 - 0.07 * t, 0.012), SW.feather, 'y'));
  }
  for (let i = 0; i < 3; i++) {
    const t = i / 2;
    const d = V(0.2, 0.9 - 0.9 * t, -0.8);
    S.push(paint(blade(wb.clone().add(V(0.016, 0.0, 0.0)), d, wn, 0.045, 0.15, 0.012), SW.feather, 'y'));
  }
  S.push(gold(hull([...cbox(V(0.158, 0.6, 0.062), 0.018, 0.032, 0.032, 0.012)])));

  // ================= GLOWING PATTERN: one bold bolt inlaid flush on each flank panel =================
  // torso side face is the plane x = 0.19*cos(22.5deg) between z -0.1 and 0.08
  const FX = 0.19 * Math.cos(Math.PI / 8);
  const inlay = (pts2) => {
    const out = [];
    for (const [z, y] of pts2) for (const x of [FX - 0.004, FX + 0.006]) out.push(V(x, 0.433 + (y - 0.435) * 0.95, -0.012 + z));
    S.push(flat(hull(out), SW.bolt));
  };
  const P = { 1: [0.09, 0.505], 2: [0.005, 0.505], 3: [-0.06, 0.427], 4: [0.0, 0.427], 5: [-0.09, 0.362], 6: [0.075, 0.449], 7: [0.03, 0.449] };
  inlay([P[1], P[2], P[3], P[7]]);
  inlay([P[3], P[4], P[6], P[7]]);
  inlay([P[4], P[5], P[6]]);

  // ================= FLOATING DETAILS: glowing crystals =================
  const crystal = (c, r, h) => S.push(paint(hull([V(c.x, c.y + h, c.z), V(c.x, c.y - h, c.z),
    ...ring(c, r, r, 4, 'y', 0)]), SW.gem, 'y'));
  crystal(V(0.3, 0.78, 0.0), 0.042, 0.075);
  crystal(V(0.29, 0.55, -0.42), 0.034, 0.058);

  return assemble(C, S);
}

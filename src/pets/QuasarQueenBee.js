// Quasar Queen Bee (ULTIMATE / Robux egg): golden queen bee, bold black starfield stripes, starry cosmic wings,
// pale-gold armour and crown, stinger, and a glowing golden halo floating above the crown.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// deterministic PRNG for the star patterns
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function star(g, x, y, r, col) { // 4-point sparkle
  g.fillStyle = col;
  g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r * 0.3, y - r * 0.3); g.lineTo(x + r, y); g.lineTo(x + r * 0.3, y + r * 0.3);
  g.lineTo(x, y + r); g.lineTo(x - r * 0.3, y + r * 0.3); g.lineTo(x - r, y); g.lineTo(x - r * 0.3, y - r * 0.3); g.closePath(); g.fill();
}
function starfield(top, bot, seed, nBig, nDots, cols) {
  return (g, x, y) => {
    const gr = g.createLinearGradient(0, y, 0, y + 128);
    gr.addColorStop(0, top); gr.addColorStop(1, bot);
    g.fillStyle = gr; g.fillRect(x, y, 128, 128);
    const r = rng(seed);
    for (let k = 0; k < nDots; k++) { g.fillStyle = cols[k % cols.length]; const s = 1.5 + r() * 2; g.fillRect(x + 4 + r() * 118, y + 4 + r() * 118, s, s); }
    for (let k = 0; k < nBig; k++) star(g, x + 10 + r() * 108, y + 10 + r() * 108, 4 + r() * 5, cols[k % cols.length]);
  };
}

export const PALETTE = {
  honey:   { i: 0, top: '#FFCE4A', bot: '#E59A1C' },   // warm honey body gold
  black:   { i: 1, top: '#3A3046', bot: '#151019' },
  armor:   { i: 2, top: '#FFF6C4', bot: '#E2B42A' },   // pale metallic armour gold
  armorDk: { i: 3, top: '#FBE58A', bot: '#C99418' },
  glow:    { i: 4, top: '#FFFDE6', bot: '#FFD84A', glow: true }, // halo / glowing trim
  eye:     { i: 5, top: '#1A1416', bot: '#0C0A0B' },
  white:   { i: 6, top: '#FFFFFF', bot: '#F1F1F4' },
  gem:     { i: 7, top: '#C9F4FF', bot: '#4FB8FF', glow: true },
  fuzz:    { i: 8, top: '#FFE07A', bot: '#F0AE2E' },
  brow:    { i: 12, top: '#4A3A30', bot: '#1E1612' },
  mouth:   { i: 9, top: '#4A2A18', bot: '#2A160C' },
  wingSky: { i: 10, draw: starfield('#7C6CFF', '#2A1E78', 7, 9, 26, ['#FFFFFF', '#FFF0A0', '#BFE8FF']) },
  stripe:  { i: 11, draw: starfield('#2E2540', '#120E1A', 3, 5, 20, ['#FFF2A8', '#FFFFFF', '#B9A8FF']) },
};
const SW = PALETTE;

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const sub = (a, b) => a.clone().sub(b);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);

// custom UV: map each vertex to (s, t) in [0,1] across a whole 128px cell (for pattern cells)
function paintProj(g, sw, f) {
  const p = g.attributes.position, uv = [];
  const cx = (sw.i % 8) * 128, cy = Math.floor(sw.i / 8) * 128;
  for (let k = 0; k < p.count; k++) {
    let [s, t] = f(V(p.getX(k), p.getY(k), p.getZ(k)));
    s = THREE.MathUtils.clamp(s, 0, 1); t = THREE.MathUtils.clamp(t, 0, 1);
    uv.push((cx + 6 + s * 116) / 1024, (cy + 6 + t * 116) / 1024);
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}

// flat convex panel lying in the plane of dir and (perp to n)
function blade(base, dir, n, L, w, th, shape) {
  const d = nrm(dir);
  const nn = nrm(add(n, d, -n.dot(d)));
  const v = nrm(cross(nn, d));
  const pts = [];
  for (const [u, s] of shape) {
    const p = add(add(base, d, u * L), v, s * w);
    pts.push(add(p, nn, th / 2), add(p, nn, -th / 2));
  }
  const g = hull(pts);
  g.userData.frame = { base, d, v, nn, L, w };
  return g;
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const honey = (g, lo = 0.1, hi = 0.95) => paint(g, SW.honey, 'y', [lo, hi]);
  const black = (g, lo = 0.0, hi = 0.5) => paint(g, SW.black, 'y', [lo, hi]);
  const armor = (g, lo, hi) => paint(g, SW.armor, lo === undefined ? 'y' : 'y', lo === undefined ? null : [lo, hi]);
  const armorF = (g) => paint(g, SW.armor, 'flat');
  const armorDk = (g) => paint(g, SW.armorDk, 'y');
  const glow = (g) => paint(g, SW.glow, 'y');
  const fuzz = (g) => paint(g, SW.fuzz, 'flat');
  const starProj = (g) => paintProj(g, SW.stripe, (p) => [p.x * 2.2 + 0.5, 1 - (p.y - 0.15) * 2.2]);

  // ================= THORAX (fuzzy honey barrel) =================
  const T = V(0, 0.42, 0.0);
  C.push(honey(hull([
    ...ring(V(0, 0.42, -0.16), 0.12, 0.12, 10, 'z'),
    ...ring(V(0, 0.42, -0.08), 0.18, 0.17, 10, 'z'),
    ...ring(V(0, 0.43, 0.06), 0.19, 0.18, 10, 'z'),
    ...ring(V(0, 0.46, 0.16), 0.15, 0.15, 10, 'z'),
  ])));
  // fuzzy collar shards around the neck
  for (const [b, d, w, l] of [
    [V(0, 0.6, 0.06), V(0, 1, -0.5), 0.06, 0.08],
  ]) C.push(fuzz(shard(b, d, w, l)));
  for (const [b, d, w, l] of [
    [V(0.08, 0.58, 0.04), V(0.5, 1, -0.4), 0.055, 0.08],
    [V(0.15, 0.53, 0.02), V(1, 0.6, -0.3), 0.055, 0.08],
    [V(0.19, 0.44, 0.04), V(1, -0.1, -0.2), 0.05, 0.07],
    [V(0.12, 0.56, -0.08), V(0.6, 0.8, -0.8), 0.05, 0.07],
  ]) S.push(fuzz(shard(b, d, w, l)));
  // gold chest armour plate
  C.push(armor(hull([
    ...plate([[-0.13, 0.08], [0.13, 0.08], [0.15, -0.02], [0.09, -0.12], [-0.09, -0.12], [-0.15, -0.02]], V(0, 0.43, 0), 0.14, 0.2, -0.0),
    V(0, 0.33, 0.215), V(0.06, 0.5, 0.21), V(-0.06, 0.5, 0.21),
  ]), 0.3, 0.55));
  // glowing trim peeking out around the chest plate
  C.push(paint(hull([
    ...plate([[-0.145, 0.09], [0.145, 0.09], [0.165, -0.02], [0.1, -0.135], [-0.1, -0.135], [-0.165, -0.02]], V(0, 0.43, 0), 0.13, 0.185, -0.0),
    V(0, 0.315, 0.2)]), SW.glow, 'flat'));
  C.push(paint(blob(0, V(0, 0.44, 0.225), V(0.035, 0.045, 0.025)), SW.gem, 'y'));
  // dorsal armour saddle on the thorax
  C.push(armor(hull([...ring(V(0, 0.585, 0.0), 0.11, 0.1, 8, 'y'), ...ring(V(0, 0.55, 0.0), 0.15, 0.14, 8, 'y'),
    V(0, 0.6, 0.0)]), 0.5, 0.62));
  C.push(paint(blob(0, V(0, 0.6, 0.0), V(0.04, 0.03, 0.04)), SW.gem, 'y'));
  // shoulder pauldrons
  S.push(armor(hull([...ring(V(0.17, 0.5, 0.06), 0.07, 0.09, 6, 'x'), ...ring(V(0.21, 0.47, 0.06), 0.05, 0.07, 6, 'x')]), 0.4, 0.58));
  S.push(armorF(shard(V(0.2, 0.52, 0.06), V(0.6, 0.8, 0), 0.04, 0.07)));

  // ================= ABDOMEN (big striped, bold black starfield bands) =================
  const AB = [ // z, y, rx, ry, colour
    [-0.1, 0.44, 0.1, 0.1],
    [-0.17, 0.445, 0.17, 0.18],
    [-0.25, 0.44, 0.215, 0.215],
    [-0.31, 0.43, 0.232, 0.228],
    [-0.39, 0.415, 0.235, 0.225],
    [-0.46, 0.4, 0.215, 0.205],
    [-0.53, 0.385, 0.175, 0.165],
    [-0.6, 0.37, 0.12, 0.11],
    [-0.65, 0.36, 0.055, 0.05],
  ];
  const abCol = ['b', 'g', 'b', 'g', 'b', 'g', 'b', 'b'];
  for (let k = 0; k < AB.length - 1; k++) {
    const [z0, y0, a0, b0] = AB[k], [z1, y1, a1, b1] = AB[k + 1];
    const g = hull([...ring(V(0, y0, z0), a0, b0, 10, 'z', 0), ...ring(V(0, y1, z1), a1, b1, 10, 'z', 0)]);
    C.push(abCol[k] === 'g' ? honey(g, 0.18, 0.66) : starProj(g));
  }
  // pale-gold armour plates riding on the gold bands (dorsal), with a glowing spine shard
  for (const [z, y, r] of [[-0.21, 0.445, 0.19], [-0.355, 0.42, 0.232], [-0.495, 0.392, 0.195]]) {
    const pts = [];
    for (let k = 0; k <= 6; k++) {
      const a = Math.PI * (0.18 + 0.64 * k / 6);
      for (const dz of [-0.032, 0.032]) {
        pts.push(V(Math.cos(a) * (r + 0.012), y + Math.sin(a) * (r + 0.012), z + dz));
        pts.push(V(Math.cos(a) * (r - 0.03), y + Math.sin(a) * (r - 0.03), z + dz));
      }
    }
    C.push(armor(hull(pts), y + r * 0.4, y + r + 0.02));
    C.push(paint(shard(V(0, y + r + 0.005, z), V(0, 1, -0.6), 0.03, 0.06), SW.glow, 'flat'));
  }
  // stinger: armour-gold collar + dark sharp point
  C.push(armorDk(hull([...ring(V(0, 0.36, -0.64), 0.06, 0.055, 8, 'z'), ...ring(V(0, 0.355, -0.68), 0.045, 0.04, 8, 'z')])));
  C.push(black(shard(V(0, 0.355, -0.67), V(0, -0.25, -1), 0.038, 0.16, 6), 0.25, 0.4));

  // ================= LEGS (6 short thick black legs, gold greaves, all planted) =================
  const leg = (hz, kz, fz, fx) => {
    const hip = V(0.11, 0.26, hz), knee = V(0.21, 0.21, kz), ank = V(fx, 0.06, fz);
    S.push(black(hull([...ring(hip, 0.06, 0.06, 6, 'x'), ...ring(knee, 0.058, 0.058, 6, 'x')]), 0.0, 0.45));
    S.push(black(hull([...ring(knee, 0.056, 0.056, 6, 'y'), ...ring(ank, 0.048, 0.048, 6, 'y')]), 0.0, 0.45));
    // gold greave
    S.push(armor(hull([...ring(add(knee, sub(ank, knee), 0.3), 0.068, 0.068, 6, 'y'),
      ...ring(add(knee, sub(ank, knee), 0.75), 0.06, 0.06, 6, 'y')]), 0.06, 0.2));
    // foot: block + two toes + gold claws
    S.push(black(hull(cbox(V(fx, 0.035, fz + 0.01), 0.055, 0.035, 0.055, 0.018)), 0.0, 0.2));
    for (const dx of [-0.026, 0.026]) {
      S.push(black(hull(cbox(V(fx + dx, 0.026, fz + 0.065), 0.022, 0.026, 0.026, 0.01)), 0.0, 0.2));
      S.push(armorDk(shard(V(fx + dx, 0.02, fz + 0.09), V(0, -0.5, 1), 0.014, 0.035)));
    }
  };

  // ================= HEAD (big, sculpted, angular facets) =================
  const H = { y: 0.7, z: 0.22 };
  const FZ = H.z + 0.155;
  const head = [];
  for (const sx of [-1, 1]) head.push(
    V(sx * 0.15, H.y + 0.1, FZ - 0.012), V(sx * 0.06, H.y + 0.15, FZ - 0.035),   // forehead plane
    V(sx * 0.175, H.y - 0.005, FZ), V(sx * 0.12, H.y - 0.1, FZ - 0.005),          // flat face
    V(sx * 0.225, H.y - 0.05, H.z + 0.03),                                        // cheekbone
    V(sx * 0.21, H.y + 0.07, H.z - 0.03),                                         // temple
    V(sx * 0.065, H.y - 0.175, FZ - 0.04), V(sx * 0.1, H.y - 0.16, H.z - 0.04),   // chin / jaw
    V(sx * 0.17, H.y + 0.04, H.z - 0.15), V(sx * 0.13, H.y - 0.1, H.z - 0.13),    // back
    V(sx * 0.1, H.y + 0.15, H.z - 0.13), V(sx * 0.11, H.y + 0.19, H.z - 0.01));   // crown top
  head.push(V(0, H.y + 0.2, H.z + 0.03), V(0, H.y + 0.18, H.z - 0.1));
  C.push(honey(hull(head), 0.5, 0.92));
  // cheek blocks (paler fuzz gold) jutting forward under the eyes
  S.push(paint(hull([V(0.1, H.y - 0.06, FZ + 0.012), V(0.19, H.y - 0.03, FZ - 0.03), V(0.205, H.y - 0.09, H.z + 0.06),
    V(0.11, H.y - 0.13, FZ - 0.0), V(0.08, H.y - 0.1, FZ - 0.03), V(0.16, H.y - 0.13, H.z + 0.05), V(0.17, H.y - 0.02, H.z + 0.06)]),
    SW.fuzz, 'y', [H.y - 0.13, H.y - 0.02]));
  // fuzzy ruff of honey/gold shards around the cheeks and the back of the head
  for (let k = 0; k < 6; k++) {
    const a = -0.45 + k * 0.38; // from below the cheek up over the temple
    const r = V(Math.cos(a), Math.sin(a), 0);
    S.push(paint(shard(V(0.17 * r.x + 0.02, H.y - 0.02 + 0.17 * r.y, H.z - 0.07 + (k % 2) * 0.03),
      add(r, V(0, 0, -0.9), 1), 0.05, 0.085 + (k % 2) * 0.015), k % 2 ? SW.fuzz : SW.honey, 'flat'));
  }
  for (let k = 0; k < 4; k++) { // back-of-head collar, lower ring
    const a = -0.7 + k * 0.55;
    const r = V(Math.cos(a), Math.sin(a), 0);
    S.push(paint(shard(V(0.13 * r.x + 0.02, H.y - 0.03 + 0.13 * r.y, H.z - 0.13), add(r, V(0, 0, -1.3), 1), 0.05, 0.08), SW.fuzz, 'flat'));
  }
  C.push(paint(shard(V(0, H.y + 0.12, H.z - 0.13), V(0, 0.7, -1), 0.05, 0.09), SW.fuzz, 'flat'));
  C.push(paint(shard(V(0, H.y - 0.13, H.z - 0.11), V(0, -0.6, -1), 0.05, 0.08), SW.fuzz, 'flat'));
  // big gold mandibles framing a short stern mouth
  S.push(armor(hull([V(0.105, H.y - 0.105, FZ - 0.012), V(0.06, H.y - 0.112, FZ + 0.028), V(0.115, H.y - 0.14, FZ - 0.04),
    V(0.03, H.y - 0.165, FZ + 0.045), V(0.012, H.y - 0.19, FZ + 0.035), V(0.05, H.y - 0.185, FZ - 0.01),
    V(0.07, H.y - 0.14, FZ + 0.035)]), H.y - 0.2, H.y - 0.1));
  C.push(paint(hull(cbox(V(0, H.y - 0.098, FZ - 0.0), 0.036, 0.009, 0.012, 0.003)), SW.mouth, 'flat'));

  // fierce eyes (punch_pup pattern, scaled up)
  const E = V(0.094, H.y + 0.03, 0), es = 1.28;
  const sc = (arr) => arr.map(([u, v]) => [u * es, v * es]);
  S.push(paint(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.012, FZ + 0.012, 0.3)), SW.white, 'flat'));
  S.push(paint(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.004, E.y, 0), FZ + 0.004, FZ + 0.018, 0.3)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.007, E.y + 0.003, 0), FZ + 0.012, FZ + 0.023, 0.3)), SW.white, 'flat'));
  // heavy protruding brow block slanting down to the centre
  S.push(paint(hull([
    V(0.02, E.y - 0.002, FZ + 0.05), V(0.022, E.y + 0.045, FZ + 0.04),
    V(0.165, E.y + 0.056, FZ - 0.0), V(0.165, E.y + 0.104, FZ - 0.012),
    V(0.02, E.y - 0.002, FZ - 0.025), V(0.022, E.y + 0.052, FZ - 0.035),
    V(0.165, E.y + 0.053, FZ - 0.05), V(0.165, E.y + 0.104, FZ - 0.06),
    V(0.095, E.y + 0.03, FZ + 0.034), V(0.095, E.y + 0.078, FZ + 0.024),
  ]), SW.brow, 'y', [E.y, E.y + 0.1]));

  // antennae: thick black stalks curving up/out, glowing star-gold tips
  S.push(black(tube(curveSamples([V(0.06, H.y + 0.13, FZ - 0.04), V(0.085, H.y + 0.2, FZ - 0.0), V(0.13, H.y + 0.25, FZ + 0.05),
    V(0.17, H.y + 0.27, FZ + 0.1)], 6, (t) => 0.026 - 0.006 * t), { seg: 6, capEnd: 0.0 }), H.y + 0.1, H.y + 0.3));
  S.push(paint(blob(0, V(0.18, H.y + 0.275, FZ + 0.115), V(0.034, 0.034, 0.034)), SW.glow, 'y'));

  // crown: pale gold band + points + gems
  const CY = H.y + 0.15, CZ = H.z - 0.02;
  C.push(armor(hull([...ring(V(0, CY, CZ), 0.11, 0.1, 10, 'y'), ...ring(V(0, CY + 0.06, CZ), 0.125, 0.115, 10, 'y')]), CY, CY + 0.06));
  C.push(armorF(shard(V(0, CY + 0.05, CZ + 0.1), V(0, 1, 0.15), 0.04, 0.12)));
  S.push(armorF(shard(V(0.075, CY + 0.05, CZ + 0.075), V(0.25, 1, 0.15), 0.034, 0.1)));
  S.push(armorF(shard(V(0.11, CY + 0.05, CZ - 0.03), V(0.3, 1, -0.1), 0.032, 0.09)));
  S.push(armorF(shard(V(0.06, CY + 0.05, CZ - 0.095), V(0.2, 1, -0.3), 0.032, 0.085)));
  C.push(paint(blob(0, V(0, CY + 0.03, CZ + 0.12), V(0.026, 0.026, 0.015)), SW.gem, 'y'));
  const CTOP = CY + 0.05 + 0.12;

  // ================= HALO (floating, centre line, clear of the crown) =================
  const HC = V(0, CTOP + 0.09, CZ), HR = 0.155, HW = 0.022, HH = 0.028, NSEG = 12, tilt = 0.32;
  const hp = (ang, dr, dy) => { // point on the ring frame, tilted about x (front edge raised)
    const r = HR + dr, x = Math.sin(ang) * r, z = Math.cos(ang) * r;
    return V(x, dy * Math.cos(tilt) + z * Math.sin(tilt), z * Math.cos(tilt) - dy * Math.sin(tilt)).add(HC);
  };
  for (let k = 0; k < NSEG; k++) {
    const pts = [];
    for (const ang of [(k + 0.5) * 2 * Math.PI / NSEG - Math.PI / NSEG, (k + 0.5) * 2 * Math.PI / NSEG + Math.PI / NSEG])
      for (const dr of [-HW, HW]) for (const dy of [-HH, HH]) pts.push(hp(ang, dr, dy));
    // segments k=0..5 cover angles 0..180deg on the +x side; mirroring closes the ring
    const mid = (k + 0.5) * 2 * Math.PI / NSEG;
    if (Math.sin(mid) > 0.01) S.push(glow(hull(pts)));
  }
  // radiant gold rays fanning out-and-up from the halo
  for (const ang of [Math.PI / 6, Math.PI / 2, 5 * Math.PI / 6]) {
    const base = hp(ang, HW * 0.6, 0), tip = hp(ang, 0.1, 0.07);
    S.push(glow(shard(base, sub(tip, base), 0.022, 0.085)));
  }
  C.push(glow(shard(hp(Math.PI, HW * 0.6, 0), sub(hp(Math.PI, 0.1, 0.09), hp(Math.PI, HW * 0.6, 0)), 0.022, 0.09)));

  // ================= WINGS (starry cosmic forewing + hindwing, glowing gold rims) =================
  const wingShape = [[0, -0.12], [0, 0.12], [0.25, 0.4], [0.6, 0.5], [0.88, 0.4], [1, 0.1], [0.95, -0.2], [0.75, -0.42], [0.4, -0.4], [0.15, -0.22]];
  const rimShape = wingShape.map(([u, s]) => [u * 1.04 - 0.01, s * 1.12]);
  const wing = (base, dir, side, L, w) => {
    const n = nrm(cross(dir, side));
    const g = blade(base, dir, n, L, w, 0.022, wingShape);
    const { d, v } = g.userData.frame;
    S.push(paintProj(g, SW.wingSky, (p) => { const q = sub(p, base); return [q.dot(d) / L, q.dot(v) / w + 0.5]; }));
    S.push(paint(blade(add(base, d, -0.005), dir, n, L, w, 0.012, rimShape), SW.glow, 'flat'));
    // gold veins on both faces
    for (const sgn of [1, -1]) {
      const nn = nrm(n).multiplyScalar(sgn);
      S.push(armorF(blade(add(add(base, nn, 0.0135), d, 0.04), add(d, v, 0.12), nn, L * 0.6, 0.022, 0.006,
        [[0, -0.5], [0, 0.5], [1, 0.2], [1, -0.2]])));
    }
  };
  wing(V(0.09, 0.56, -0.04), nrm(V(0.7, 0.72, -0.3)), nrm(V(0.2, -0.55, -1)), 0.64, 0.3);
  wing(V(0.1, 0.5, -0.12), nrm(V(0.85, 0.15, -0.55)), nrm(V(0.1, -0.9, -0.6)), 0.44, 0.22);

  // lower the whole body onto the short legs
  for (const g of [...C, ...S]) g.translate(0, -0.08, 0);
  leg(0.12, 0.16, 0.19, 0.225);
  leg(0.0, 0.0, 0.0, 0.255);
  leg(-0.12, -0.16, -0.19, 0.235);

  return assemble(C, S);
}

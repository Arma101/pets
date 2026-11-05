// Moon Rabbit (Celestial): silver-white faceted rabbit with glowing pale-blue moon markings,
// a floating golden crescent halo, jade accents, a cherry silk neck bow and cherry-blossom petals.
import { V, THREE, hull, cbox, ring, plate, shard, blob, paint, assemble } from '../kit.js';

export const PALETTE = {
  body:   { i: 0, top: '#FFFFFF', bot: '#CDD7EA' },
  cream:  { i: 1, top: '#FFFFFF', bot: '#DCE3F0' },
  pink:   { i: 2, top: '#FFC4D6', bot: '#F28BAE' },
  nose:   { i: 3, top: '#FF9FB6', bot: '#E26A8C' },
  eye:    { i: 4, top: '#1A1622', bot: '#0B0A10' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F4F6FA' },
  muzzle: { i: 6, top: '#FFFFFF', bot: '#DCE3EE' },
  rim:    { i: 7, top: '#B2BED3', bot: '#9AA8C0' },          // thin soft eye surround so the eyes read on white fur
  brow:   { i: 8, top: '#F0F4FA', bot: '#BCC8DC' },
  mouth:  { i: 10, top: '#6A4A5A', bot: '#4A2E3C' },
  moon:   { i: 11, top: '#C8F3FF', bot: '#4FC0FF', glow: true }, // glowing moon markings
  halo:   { i: 12, top: '#FFF3A8', bot: '#FFBA2E', glow: true }, // glowing crescent halo
  jade:   { i: 13, top: '#8CF0BE', bot: '#1E9A6C' },
  petal:  { i: 14, top: '#FFE6EF', bot: '#FF9CC0' },
  ribbon: { i: 15, top: '#FF6F98', bot: '#C42A5C' },
  petalD: { i: 16, top: '#FFC7DA', bot: '#F2779F' },
};
const SW = PALETTE;

// broad leaf-like shard with real thickness (from jab_bunny)
function petal(base, dir, w, len, th = null, roll = 0) {
  const d = dir.clone().normalize();
  const up = Math.abs(d.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
  let a = new THREE.Vector3().crossVectors(d, up).normalize();
  let b = new THREE.Vector3().crossVectors(a, d).normalize();
  if (roll) { const q = new THREE.Quaternion().setFromAxisAngle(d, roll); a.applyQuaternion(q); b.applyQuaternion(q); }
  const t = th === null ? w * 0.45 : th;
  const P = (along, ac, bc) => base.clone().addScaledVector(d, along).addScaledVector(a, ac).addScaledVector(b, bc);
  return hull([
    P(-0.15 * len, w * 0.45, t), P(-0.15 * len, -w * 0.45, t), P(-0.15 * len, w * 0.45, -t), P(-0.15 * len, -w * 0.45, -t),
    P(0.4 * len, w, t * 0.7), P(0.4 * len, -w, t * 0.7), P(0.4 * len, w, -t * 0.7), P(0.4 * len, -w, -t * 0.7),
    P(len, 0, t * 0.15), P(len, 0, -t * 0.15),
  ]);
}

// cherry-blossom petal: rounded wide end with a notch (two lobes), thin, lying on a plane
function blossomPetal(base, dir, nrm, w, len, th) {
  const d = dir.clone().normalize();
  const n = nrm.clone().addScaledVector(d, -nrm.dot(d)).normalize();
  const a = new THREE.Vector3().crossVectors(d, n).normalize();
  const P = (al, ac, nc) => base.clone().addScaledVector(d, al).addScaledVector(a, ac).addScaledVector(n, nc);
  const pts = [];
  for (const s of [-1, 1]) {
    pts.push(P(0, s * w * 0.2, th * 0.5));
    pts.push(P(len * 0.55, s * w, th), P(len * 0.55, s * w, -th * 0.5));
    pts.push(P(len, s * w * 0.55, th * 0.8), P(len, s * w * 0.55, -th * 0.5));
  }
  pts.push(P(0, 0, -th * 0.5), P(len * 0.88, 0, th * 1.2));
  return hull(pts);
}
// five-petal blossom facing `nrm`
function blossom(out, c, nrm, r, sw, swC) {
  const n = nrm.clone().normalize();
  const up = Math.abs(n.y) > 0.9 ? V(0, 0, 1) : V(0, 1, 0);
  const a = new THREE.Vector3().crossVectors(up, n).normalize();
  const b = new THREE.Vector3().crossVectors(n, a).normalize();
  for (let k = 0; k < 5; k++) {
    const t = (k / 5) * Math.PI * 2 + Math.PI / 2;
    const d = a.clone().multiplyScalar(Math.cos(t)).addScaledVector(b, Math.sin(t));
    out.push(paint(blossomPetal(c.clone().addScaledVector(d, r * 0.15), d, n, r * 0.42, r, r * 0.12), sw, 'flat'));
  }
  out.push(paint(hull([...ring(V(0, 0, 0), r * 0.22, r * 0.22, 5, 'y')].map((p) =>
    c.clone().addScaledVector(a, p.x).addScaledVector(b, p.z).addScaledVector(n, r * 0.12)).concat([c.clone().addScaledVector(n, r * 0.3), c.clone().addScaledVector(n, -r * 0.05)])), swC, 'flat'));
}

// faceted crescent strip in 2D: centre radius rm, max width W, arc centred at angle `mid` spanning `span`.
// map(u, v, depth) -> Vector3. Returns array of hulls (one per segment).
function crescent(map, { rm, W, mid = -Math.PI / 2, span = 3.6, n = 8, ridge = 0.012, back = 0.02, both = false }) {
  const parts = [];
  const pt = (t, s, dpt) => {
    const a = mid - span / 2 + span * t;
    const w = W * Math.pow(Math.sin(Math.PI * t), 0.8) * 0.5;
    const r = rm + s * w;
    return map(Math.cos(a) * r, Math.sin(a) * r, dpt);
  };
  for (let i = 0; i < n; i++) {
    const pts = [];
    for (const t of [i / n, (i + 1) / n]) {
      pts.push(pt(t, 1, both ? ridge * 0.35 : 0), pt(t, -1, both ? ridge * 0.35 : 0), pt(t, 0, ridge));
      if (both) pts.push(pt(t, 1, -ridge * 0.35), pt(t, -1, -ridge * 0.35), pt(t, 0, -ridge));
      else pts.push(pt(t, 1, -back), pt(t, -1, -back));
    }
    parts.push(hull(pts));
  }
  return parts;
}

export function buildGeometry() {
  const C = [], S = [];
  const body = (pts, lo = -0.3, hi = 0.85) => paint(hull(pts), SW.body, 'y', [lo, hi]);
  const cream = (g, lo, hi) => paint(g, SW.cream, lo === undefined ? 'flat' : 'y', lo === undefined ? null : [lo, hi]);
  const moon = (g) => paint(g, SW.moon, 'y');

  // ================= BODY =================
  C.push(body([
    ...ring(V(0, 0.27, -0.32), 0.09, 0.08, 10, 'z'),
    ...ring(V(0, 0.3, -0.22), 0.16, 0.16, 10, 'z'),
    ...ring(V(0, 0.32, -0.08), 0.165, 0.17, 10, 'z'),
    ...ring(V(0, 0.315, 0.08), 0.15, 0.15, 10, 'z'),
    ...ring(V(0, 0.335, 0.17), 0.12, 0.12, 10, 'z'),
  ], -0.05, 0.6));
  C.push(body([...ring(V(0, 0.3, 0.13), 0.11, 0.1, 10, 'y'), ...ring(V(0, 0.5, 0.18), 0.12, 0.11, 10, 'y')], 0.3, 0.7));
  C.push(paint(blob(1, V(0, 0.3, 0.2), V(0.1, 0.1, 0.07), { jitter: 0.15 }), SW.cream, 'y', [0.2, 0.5]));

  // ================= LEGS =================
  S.push(body([...ring(V(0.1, 0.06, 0.21), 0.066, 0.066, 8), ...ring(V(0.1, 0.14, 0.2), 0.072, 0.074, 8),
    ...ring(V(0.098, 0.25, 0.165), 0.088, 0.092, 8)], 0.0, 0.5));
  S.push(paint(blob(0, V(0.105, 0.25, 0.15), V(0.088, 0.1, 0.1), { jitter: 0.1 }), SW.body, 'y', [0.0, 0.5]));
  // jade anklets
  S.push(paint(hull([...ring(V(0.1, 0.1, 0.205), 0.082, 0.082, 8, 'y', 0), ...ring(V(0.1, 0.13, 0.203), 0.084, 0.084, 8, 'y', 0)]), SW.jade, 'y'));
  const frontPaw = (x, z) => {
    S.push(cream(hull(cbox(V(x, 0.04, z), 0.07, 0.04, 0.062, 0.02)), 0, 0.08));
    for (const dx of [-0.044, 0, 0.044])
      S.push(cream(hull(cbox(V(x + dx, 0.032, z + 0.058), 0.024, 0.032, 0.032, 0.01)), 0, 0.08));
  };
  frontPaw(0.105, 0.22);
  // hind: big haunch + long flat foot
  const HC = V(0.135, 0.21, -0.15), HR = V(0.1, 0.15, 0.16);
  S.push(paint(blob(1, HC, HR, { jitter: 0.1 }), SW.body, 'y', [-0.3, 0.5]));
  // chunky tapered hind foot (body-tinted) with 3 faceted toe bumps
  const footC = (g) => paint(g, SW.body, 'y', [-0.25, 0.3]);
  S.push(footC(hull([...cbox(V(0.165, 0.045, -0.14), 0.068, 0.045, 0.075, 0.026), ...ring(V(0.165, 0.035, 0.0), 0.06, 0.034, 8, 'z'),
    ...ring(V(0.165, 0.1, -0.18), 0.06, 0.05, 8, 'y'), V(0.165, 0.075, -0.06)])));
  for (const dx of [-0.038, 0, 0.038])
    S.push(footC(hull([...ring(V(0.165 + dx, 0.03, -0.005), 0.023, 0.028, 6, 'z'), ...ring(V(0.165 + dx, 0.026, 0.04), 0.017, 0.022, 6, 'z'), V(0.165 + dx, 0.022, 0.056)])));

  // glowing moon markings on the haunch (projected onto the haunch ellipsoid, pushed past the jittered facets)
  {
    const k = 1.1;
    const map = (u, v, dpt) => {
      const z = HC.z + u, y = HC.y + v;
      const q = 1 - (u / (HR.z * k)) ** 2 - (v / (HR.y * k)) ** 2;
      return V(HC.x + HR.x * k * Math.sqrt(Math.max(0, q)) + dpt, y, z);
    };
    // crescent opening toward the front-top
    for (const g of crescent((u, v, d) => map(u + 0.0, v + 0.01, d), { rm: 0.068, W: 0.05, mid: Math.PI * 0.2, span: 3.6, n: 8, ridge: 0.012, back: 0.045 }))
      S.push(moon(g));
    // dots
    for (const [u, v, r] of [[0.085, 0.075, 0.016], [0.115, 0.03, 0.012]]) {
      const c = map(u, v, 0.004);
      S.push(moon(hull([...ring(V(0, 0, 0), r, r, 6, 'x').map((p) => p.add(c)), ...ring(V(0, 0, 0), r, r, 6, 'x').map((p) => p.add(c).add(V(-0.03, 0, 0)))])));
    }
  }

  // ================= HEAD =================
  const H = { y: 0.57, z: 0.22 };
  C.push(body([
    ...cbox(V(0, H.y, H.z), 0.195, 0.155, 0.155, 0.07),
    ...ring(V(0, H.y + 0.175, H.z - 0.01), 0.12, 0.1, 8, 'y'),
    ...ring(V(0, H.y + 0.02, H.z - 0.18), 0.13, 0.1, 8, 'z'),
    V(0.215, H.y - 0.07, H.z + 0.04), V(-0.215, H.y - 0.07, H.z + 0.04),
    V(0.1, H.y + 0.15, H.z + 0.135), V(-0.1, H.y + 0.15, H.z + 0.135),
  ], 0.1, 0.9));
  const FZ = H.z + 0.155;

  // cheek fluff + nape fur
  S.push(cream(petal(V(0.17, H.y - 0.07, H.z + 0.07), V(1, -0.35, 0.3), 0.05, 0.11, 0.025)));
  S.push(cream(petal(V(0.16, H.y - 0.095, H.z + 0.08), V(1, -0.55, 0.35), 0.035, 0.07, 0.018)));
  S.push(paint(petal(V(0.08, H.y - 0.02, H.z - 0.13), V(0.4, -0.5, -1), 0.05, 0.09, 0.022), SW.body, 'y', [0.4, 0.7]));
  C.push(paint(petal(V(0, H.y + 0.03, H.z - 0.14), V(0, -0.3, -1), 0.055, 0.09, 0.022), SW.body, 'y', [0.4, 0.7]));

  // muzzle, nose, mouth
  C.push(paint(hull([...cbox(V(0, H.y - 0.075, FZ + 0.0), 0.1, 0.055, 0.045, 0.028),
    V(0.05, H.y - 0.015, FZ - 0.01), V(-0.05, H.y - 0.015, FZ - 0.01), V(0, H.y - 0.03, FZ + 0.05)]), SW.muzzle, 'y', [0.5, 0.64]));
  C.push(paint(hull([V(-0.034, H.y - 0.022, FZ + 0.052), V(0.034, H.y - 0.022, FZ + 0.052), V(0, H.y - 0.058, FZ + 0.056),
    V(-0.034, H.y - 0.022, FZ + 0.02), V(0.034, H.y - 0.022, FZ + 0.02), V(0, H.y - 0.058, FZ + 0.03)]), SW.nose, 'y'));
  C.push(paint(hull(cbox(V(0, H.y - 0.075, FZ + 0.048), 0.005, 0.018, 0.005, 0.002)), SW.mouth, 'flat'));
  S.push(paint(hull([V(0, H.y - 0.095, FZ + 0.05), V(0, H.y - 0.085, FZ + 0.05), V(0.04, H.y - 0.1, FZ + 0.048),
    V(0.04, H.y - 0.092, FZ + 0.048), V(0, H.y - 0.09, FZ + 0.035), V(0.04, H.y - 0.097, FZ + 0.035)]), SW.mouth, 'flat'));

  // fierce eyes with a dark grey-blue rim so they read on white fur
  const E = V(0.088, H.y + 0.03, 0);
  const ek = 1.15, sc = (a, k = ek) => a.map(([u, v]) => [u * k, v * k]);
  const almond = [[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]];
  S.push(paint(hull(plate(sc(almond, ek * 1.08), V(E.x + 0.006, E.y + 0.004, 0), FZ - 0.016, FZ + 0.004)), SW.rim, 'flat'));
  S.push(paint(hull(plate(sc(almond), E, FZ - 0.01, FZ + 0.012)), SW.white, 'flat'));
  S.push(paint(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.005, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.006, E.y + 0.003, 0), FZ + 0.014, FZ + 0.021)), SW.white, 'flat'));
  // heavy brow
  S.push(paint(hull([
    V(0.026, E.y + 0.012, FZ + 0.03), V(0.028, E.y + 0.05, FZ + 0.02),
    V(0.14, E.y + 0.05, FZ - 0.01), V(0.14, E.y + 0.088, FZ - 0.025),
    V(0.026, E.y + 0.012, FZ - 0.03), V(0.028, E.y + 0.06, FZ - 0.04),
    V(0.14, E.y + 0.05, FZ - 0.06), V(0.14, E.y + 0.09, FZ - 0.07),
  ]), SW.brow, 'y'));

  // glowing crescent on the forehead (horns up), following the top chamfer of the head
  {
    const surfZ = (y) => FZ - Math.max(0, y - (H.y + 0.085)) * 0.31;
    const fy = H.y + 0.14;
    for (const g of crescent((u, v, d) => V(u, fy + v, surfZ(fy + v) + d + 0.005), { rm: 0.05, W: 0.034, mid: -Math.PI / 2, span: 3.5, n: 7, ridge: 0.012, back: 0.035 }))
      C.push(moon(g));
  }
  // glowing crescent on the back of the head
  {
    const z0 = H.z - 0.18 - 0.004, cy = H.y + 0.07;
    for (const g of crescent((u, v, d) => V(u, cy + v, z0 - d), { rm: 0.036, W: 0.026, mid: -Math.PI / 2, span: 3.5, n: 6, ridge: 0.01, back: 0.03 }))
      C.push(moon(g));
  }

  // ================= EARS (long, upright, pink inner) =================
  {
    const base = V(0.095, H.y + 0.12, H.z - 0.03);
    const up = V(0.5, 1, -0.1).normalize();
    const nrm = V(0.25, 0, 1); nrm.addScaledVector(up, -nrm.dot(up)).normalize();
    const acr = new THREE.Vector3().crossVectors(up, nrm).normalize();
    const P = (u, v, w) => base.clone().addScaledVector(acr, u).addScaledVector(up, v).addScaledVector(nrm, w);
    const prof = [[0.0, 0.055], [0.1, 0.088], [0.26, 0.094], [0.4, 0.068], [0.5, 0.012]];
    const th = 0.03;
    const outer = [];
    for (const [v, hw] of prof) for (const s of [-1, 1]) for (const w of [-th, th]) outer.push(P(s * hw, v, w * (v > 0.46 ? 0.6 : 1)));
    S.push(paint(hull(outer), SW.body, 'y', [0.35, 1.25]));
    const inner = [];
    for (const [v, hw] of prof.slice(0, 4)) for (const s of [-1, 1]) for (const w of [th - 0.006, th + 0.007])
      inner.push(P(s * hw * 0.66, v * 0.95 + 0.03, w));
    inner.push(P(0, 0.47, th - 0.006), P(0, 0.47, th + 0.004));
    S.push(paint(hull(inner), SW.pink, 'y', [0.7, 1.25]));
    const tip = [];
    for (const [v, hw] of [[0.4, 0.071], [0.5, 0.014]]) for (const s2 of [-1, 1]) for (const w of [-th - 0.004, th + 0.004]) tip.push(P(s2 * (hw + 0.004), v + (v > 0.45 ? 0.006 : 0), w * (v > 0.46 ? 0.65 : 1)));
    S.push(paint(hull(tip), SW.moon, 'y'));
    // jade ear cuff at the base
    S.push(paint(hull([P(-0.07, 0.04, -th - 0.008), P(0.07, 0.04, -th - 0.008), P(-0.07, 0.04, th + 0.012), P(0.07, 0.04, th + 0.012),
      P(-0.072, 0.075, -th - 0.008), P(0.072, 0.075, -th - 0.008), P(-0.072, 0.075, th + 0.012), P(0.072, 0.075, th + 0.012)]), SW.jade, 'y'));
  }

  // ================= CRESCENT HALO (floating, centre line) =================
  {
    // just behind the ears' plane, above the head (ear clearance checked >= 0.03)
    const hc = V(0, H.y + 0.5, H.z - 0.15);
    for (const g of crescent((u, v, d) => V(u, hc.y + v, hc.z + d), { rm: 0.16, W: 0.09, mid: -Math.PI / 2, span: 3.9, n: 12, ridge: 0.032, both: true }))
      C.push(paint(g, SW.halo, 'y', [hc.y - 0.22, hc.y + 0.08]));
    // glowing moon gem resting in the crescent's cup
    const gc = V(0, hc.y - 0.07, hc.z);
    C.push(paint(hull([V(0, gc.y + 0.055, gc.z), V(0, gc.y - 0.05, gc.z), ...ring(gc, 0.036, 0.024, 6, 'y', 0)]), SW.moon, 'y'));
    // four-point glowing stars on the horn tips + two small floating sparkles
    const star = (c, r, dp, sw) => {
      C.push(paint(hull([c.clone().add(V(0, r, 0)), c.clone().add(V(0, -r, 0)), c.clone().add(V(r * 0.28, 0, 0)), c.clone().add(V(-r * 0.28, 0, 0)), c.clone().add(V(0, 0, dp)), c.clone().add(V(0, 0, -dp))]), sw, 'y'));
      C.push(paint(hull([c.clone().add(V(r, 0, 0)), c.clone().add(V(-r, 0, 0)), c.clone().add(V(0, r * 0.28, 0)), c.clone().add(V(0, -r * 0.28, 0)), c.clone().add(V(0, 0, dp)), c.clone().add(V(0, 0, -dp))]), sw, 'y'));
    };
    const ta = -Math.PI / 2 + 3.9 / 2;
    for (const sx of [1, -1]) star(V(sx * 0.16 * Math.cos(ta), hc.y + 0.16 * Math.sin(ta) + 0.01, hc.z), 0.042, 0.016, SW.halo);
    star(V(0, hc.y + 0.06, hc.z), 0.03, 0.012, SW.moon);
  }

  // ================= COLLAR RUFF (silver shards + cherry petals) =================
  const NK = { y: 0.41, z: 0.17 };
  const nRing = 12;
  for (let k = 0; k < nRing; k++) {
    const a = (k / nRing) * Math.PI * 2 + Math.PI / nRing;
    const cx = Math.cos(a), cz = Math.sin(a);
    if (cx < -0.01 || k === 2) continue; // front centre left open for the bow
    const b = V(cx * 0.12, NK.y, NK.z + cz * 0.11);
    S.push(paint(petal(b, V(cx, -0.55, cz), 0.055, 0.13, 0.02), k % 2 ? SW.cream : SW.body, 'y', [NK.y - 0.14, NK.y + 0.05]));
  }
  for (let k = 0; k < nRing; k++) {
    const a = ((k + 0.5) / nRing) * Math.PI * 2;
    const cx = Math.cos(a), cz = Math.sin(a);
    if (cx < 0.05 || cz < -0.3 || k === 2) continue;
    const b = V(cx * 0.12, NK.y - 0.05, NK.z + cz * 0.12);
    S.push(paint(petal(b, V(cx, -0.9, cz), 0.05, 0.12, 0.02), k % 2 ? SW.cream : SW.body, 'y', [NK.y - 0.2, NK.y + 0.02]));
  }
  // blossoms on the collar sides
  blossom(S, V(0.125, NK.y - 0.045, NK.z + 0.14), V(0.55, 0.15, 1), 0.065, SW.petalD, SW.halo);
  blossom(S, V(0.15, NK.y - 0.01, NK.z + 0.0), V(1, 0.3, 0.2), 0.055, SW.petal, SW.halo);

  // silk ribbon bow at the throat with a jade knot and two tails
  {
    const K = V(0, NK.y - 0.03, NK.z + 0.165);
    const rb = (pts) => paint(hull(pts), SW.ribbon, 'y', [0.18, K.y + 0.06]);
    S.push(rb([V(0.01, K.y + 0.012, K.z + 0.01), V(0.01, K.y - 0.012, K.z + 0.01), V(0.01, K.y, K.z - 0.02),
      V(0.085, K.y + 0.045, K.z - 0.005), V(0.095, K.y - 0.03, K.z - 0.005), V(0.088, K.y + 0.01, K.z - 0.025),
      V(0.07, K.y + 0.04, K.z + 0.012), V(0.075, K.y - 0.025, K.z + 0.012)]));
    // long silk tails hanging down the chest, below the ruff, with slanted cut ends
    const tailPts = [];
    for (const dz of [0.006, -0.006]) tailPts.push(
      V(0.006, K.y - 0.012, K.z - 0.004 + dz), V(0.03, K.y - 0.012, K.z - 0.012 + dz),
      V(0.05, 0.205, 0.302 + dz), V(0.092, 0.225, 0.292 + dz));
    S.push(rb(tailPts));
    C.push(paint(hull(cbox(V(0, K.y, K.z + 0.008), 0.024, 0.024, 0.02, 0.008)), SW.jade, 'y'));
  }

  // ================= TAIL (silver shard tuft with cherry petals and a jade bead) =================
  const tl = (b, d, w, l, sw, lo = 0.16, hi = 0.5) => paint(petal(b, d, w * 0.9, l, w * 0.32), sw, 'y', [lo, hi]);
  const TC = V(0, 0.32, -0.37);
  C.push(paint(blob(1, TC, V(0.11, 0.11, 0.09), { jitter: 0.18 }), SW.cream, 'y', [0.2, 0.44]));
  // radiating petal-shards (fluffy pom), alternating silver / cherry
  const nT = 8;
  for (let k = 0; k < nT; k++) {
    const a = (k / nT) * Math.PI * 2 + Math.PI / nT; // around the z axis; 0 = +x
    const cx = Math.cos(a), cy = Math.sin(a);
    if (cx < -0.01) continue;
    const bpt = V(cx * 0.07, TC.y + cy * 0.07, TC.z - 0.03);
    S.push(tl(bpt, V(cx, cy, -0.75), 0.07, 0.12, k % 2 ? SW.petal : SW.cream));
  }
  C.push(tl(V(0, TC.y + 0.07, TC.z - 0.02), V(0, 1, -0.6), 0.075, 0.13, SW.cream));
  // blossom on the back of the pom with a jade centre
  blossom(C, V(0, TC.y + 0.0, TC.z - 0.085), V(0, 0.15, -1), 0.06, SW.petalD, SW.jade);

  // glowing moon dots along the spine
  for (const [z, y, r] of [[0.07, 0.485, 0.018], [-0.04, 0.5, 0.024], [-0.15, 0.49, 0.018]])
    C.push(moon(hull([V(0, y + 0.006, z + r * 1.4), V(0, y + 0.006, z - r * 1.4), V(r, y + 0.006, z), V(-r, y + 0.006, z),
      V(0, y - 0.05, z + r * 1.4), V(0, y - 0.05, z - r * 1.4), V(r, y - 0.05, z), V(-r, y - 0.05, z)])));

  return assemble(C, S);
}

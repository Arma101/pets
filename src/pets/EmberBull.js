// Ember Bull (Legendary, Round 5 – Volcano Crater): dark red-brown bull with glowing lava horns,
// ember sparks in a shard mane, glowing lava cracks, obsidian hooves and ornate obsidian + gold armour.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  body:    { i: 0, top: '#8C3C26', bot: '#3E1A14' },
  mane:    { i: 1, top: '#6E2E1C', bot: '#2C120C' },
  horn:    { i: 2, top: '#FF6A00', bot: '#FFE27A', glow: true }, // 'len': hot orange base -> yellow tip
  gold:    { i: 3, top: '#FFDB62', bot: '#C98A16' },
  muzzle:  { i: 4, top: '#C98262', bot: '#8A4630' },
  obsid:   { i: 5, top: '#4A4060', bot: '#15121C' },
  eyeGlow: { i: 6, top: '#FFFFFF', bot: '#FFF0B8', glow: true },
  eye:     { i: 7, top: '#1A1416', bot: '#0C0A0B' },
  brow:    { i: 8, top: '#9A4630', bot: '#56221A' },
  nostril: { i: 9, top: '#3A1A12', bot: '#22100A' },
  lava:    { i: 10, top: '#FFD27A', bot: '#FF6A00', glow: true },
  spark:   { i: 11, top: '#FFF2A0', bot: '#FF9A1A', glow: true },
  tail:    { i: 12, top: '#6A2C1C', bot: '#3E1A14' },
  white:   { i: 13, top: '#FFFFFF', bot: '#F1F1F4' },
  crackC:  { i: 14, top: '#FF9A2A', bot: '#E84A00', glow: true },
  rim:     { i: 15, top: '#FF9A2A', bot: '#FF5A00', glow: true },
};
const SW = PALETTE;

// ---- surface projection (raycast onto already-built hulls) for lava cracks and sparks ----
function makeProjector(geos) {
  const meshes = geos.map((g) => new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.FrontSide })));
  const rc = new THREE.Raycaster();
  return (p, n) => {
    const d = n.clone().normalize();
    rc.set(p.clone().addScaledVector(d, 0.6), d.clone().negate());
    rc.far = 1.2;
    const hit = rc.intersectObjects(meshes, false)[0];
    if (!hit) return null;
    const nn = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    return { p: hit.point.clone(), n: nn };
  };
}

// jagged glowing seam: zig-zag polyline projected onto the surface, built from short thick slabs
function crack(out, proj, a, b, nGuess, { segs = 5, amp = 0.018, w0 = 0.016, seed = 1, sw = SW.crackC } = {}) {
  const d = b.clone().sub(a);
  const side = new THREE.Vector3().crossVectors(d, nGuess).normalize();
  const pts = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const r = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453; const h = r - Math.floor(r);
    const off = i === 0 || i === segs ? 0 : amp * (h * 2 - 1);
    const hit = proj(a.clone().addScaledVector(d, t).addScaledVector(side, off), nGuess);
    if (hit) pts.push(hit);
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i].p, p1 = pts[i + 1].p;
    const m = pts[i].n.clone().add(pts[i + 1].n).normalize();
    const dir = p1.clone().sub(p0); const L = dir.length(); dir.normalize();
    const wv = new THREE.Vector3().crossVectors(dir, m).normalize();
    const tA = i / (pts.length - 1), tB = (i + 1) / (pts.length - 1);
    const wa = w0 * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, tA * 1.0 + 0.08)));
    const wb = w0 * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(0.92, tB)));
    const e0 = p0.clone().addScaledVector(dir, -Math.min(wa, L * 0.3)), e1 = p1.clone().addScaledVector(dir, Math.min(wb, L * 0.3));
    const P = [];
    for (const [e, w] of [[e0, wa], [e1, wb]]) for (const s of [-1, 1]) {
      P.push(e.clone().addScaledVector(wv, s * w).addScaledVector(m, 0.0065));
      P.push(e.clone().addScaledVector(wv, s * w).addScaledVector(m, -0.012));
    }
    out.push(paint(hull(P), sw, 'flat'));
  }
}

// convex armour cap: dome around `axis` from `c`, radius R, opening half-angle `ang`
function capPts(c, axis, R, ang, thick, n = 8, rings = 2, squash = 1) {
  const a = axis.clone().normalize();
  const up = Math.abs(a.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
  const u = new THREE.Vector3().crossVectors(a, up).normalize();
  const v = new THREE.Vector3().crossVectors(u, a).normalize();
  const pts = [c.clone().addScaledVector(a, R)];
  for (let j = 1; j <= rings; j++) {
    const th = (ang * j) / rings;
    for (let k = 0; k < n; k++) {
      const ph = (2 * Math.PI * k) / n + (j % 2) * Math.PI / n;
      const dir = a.clone().multiplyScalar(Math.cos(th))
        .addScaledVector(u, Math.sin(th) * Math.cos(ph)).addScaledVector(v, Math.sin(th) * Math.sin(ph) * squash);
      const p = c.clone().addScaledVector(dir, R);
      pts.push(p);
      if (j === rings) pts.push(p.clone().addScaledVector(a, -thick));
    }
  }
  return pts;
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const body = (pts, lo = 0.1, hi = 0.75) => paint(hull(pts), SW.body, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');
  const crackTargets = [];   // body/leg hulls lava cracks are projected onto

  // ================= BODY (massive front, hump at shoulders, smaller hips) =================
  const torso = body([
    ...ring(V(0, 0.4, -0.45), 0.12, 0.11, 10, 'z'),
    ...ring(V(0, 0.4, -0.38), 0.2, 0.17, 10, 'z'),
    ...ring(V(0, 0.41, -0.2), 0.225, 0.185, 10, 'z'),
    ...ring(V(0, 0.43, 0.0), 0.27, 0.225, 10, 'z'),
    ...ring(V(0, 0.45, 0.16), 0.28, 0.235, 10, 'z'),
    ...ring(V(0, 0.46, 0.27), 0.22, 0.2, 10, 'z'),
  ], 0.18, 0.7);
  C.push(torso); crackTargets.push(torso);
  C.push(body([...cbox(V(0, 0.61, 0.1), 0.19, 0.085, 0.18, 0.05)], 0.3, 0.72));
  C.push(body([...ring(V(0, 0.47, 0.25), 0.18, 0.18, 8, 'z'), ...ring(V(0, 0.49, 0.38), 0.16, 0.16, 8, 'z')], 0.3, 0.72));

  // ================= LEGS =================
  S.push(paint(blob(0, V(0.205, 0.4, 0.15), V(0.125, 0.15, 0.14), { jitter: 0.1 }), SW.body, 'y', [0.08, 0.7]));
  const fLeg = body([...ring(V(0.22, 0.08, 0.18), 0.082, 0.084, 8), ...ring(V(0.222, 0.22, 0.17), 0.11, 0.107, 8),
    ...ring(V(0.2, 0.34, 0.14), 0.118, 0.122, 8)], 0.04, 0.7);
  S.push(fLeg); crackTargets.push(fLeg);
  const thigh = paint(blob(1, V(0.17, 0.37, -0.29), V(0.115, 0.155, 0.145), { jitter: 0.12 }), SW.body, 'y', [0.08, 0.7]);
  S.push(thigh); crackTargets.push(thigh);
  const bLeg = body([...ring(V(0.178, 0.31, -0.28), 0.097, 0.102, 8), ...ring(V(0.19, 0.18, -0.335), 0.092, 0.092, 8),
    ...ring(V(0.188, 0.08, -0.31), 0.08, 0.08, 8)], 0.04, 0.7);
  S.push(bLeg); crackTargets.push(bLeg);

  // obsidian cloven hooves with a gold cuff
  const hoof = (x, z) => {
    for (const dx of [-0.044, 0.044])
      S.push(paint(hull([...cbox(V(x + dx, 0.04, z + 0.01), 0.043, 0.04, 0.07, 0.016),
        V(x + dx, 0.0, z + 0.088), V(x + dx, 0.055, z + 0.082)]), SW.obsid, 'y', [0, 0.1]));
    S.push(paint(hull(ring(V(x, 0.082, z), 0.098, 0.096, 8, 'y').concat(ring(V(x, 0.106, z), 0.094, 0.092, 8, 'y'))), SW.gold, 'y', [0.07, 0.12]));
  };
  hoof(0.22, 0.18);
  hoof(0.188, -0.31);

  // ================= MANE (layered dark shards, ember sparks embedded) =================
  const maneSh = (b, d, w, l, fl = 0.55) => paint(shard(b, d, w, l, 4, fl), SW.mane, 'y', [0.2, 0.85]);
  const maneMass = paint(hull([
    ...ring(V(0, 0.51, 0.33), 0.2, 0.22, 10, 'z', Math.PI / 10),
    ...ring(V(0, 0.51, 0.16), 0.265, 0.26, 10, 'z', 0),
    ...ring(V(0, 0.48, -0.03), 0.235, 0.215, 10, 'z', Math.PI / 10),
  ]), SW.mane, 'y', [0.25, 0.8]);
  C.push(maneMass);
  for (const [z, cy, rx, ry, w, l, degs, idx] of [
    [0.31, 0.51, 0.2, 0.23, 0.1, 0.15, [60, 28, -4, -36]],
    [0.18, 0.51, 0.265, 0.26, 0.11, 0.17, [90, 74, 44, 14, -18]],
    [0.04, 0.48, 0.245, 0.225, 0.1, 0.16, [90, 58, 28, -4, -36]],
    [-0.09, 0.46, 0.215, 0.205, 0.085, 0.13, [74, 42, 10]],
  ].map((r, idx) => [...r, idx])) {
    const row = idx;
    for (const deg of degs) {
      const th = (deg * Math.PI) / 180;
      const n = V(Math.cos(th), Math.sin(th), 0);
      const base = V(n.x * rx, cy + n.y * ry, z);
      const lift = deg >= 70 ? 0.55 : deg >= 40 ? 0.25 : 0;
      const dir = n.clone().multiplyScalar(0.55).add(V(0, lift - 0.2 - 0.6 * (1 - Math.sin(th)) / 2, -1));
      const g = maneSh(base, dir, w, l, 0.8);
      if (deg === 90) C.push(g); else S.push(g);
    }
    // ember sparks: small glowing shards tucked between the fur shards of this row
    for (let j = 0; j < degs.length - 1; j++) {
      const th = ((degs[j] + degs[j + 1]) / 2 * Math.PI) / 180;
      const n = V(Math.cos(th), Math.sin(th), 0);
      const base = V(n.x * rx * 0.97, cy + n.y * ry * 0.97, z - 0.03 - 0.02 * ((j + row) % 2));
      const dir = n.clone().multiplyScalar(1.0).add(V(0, 0.15 - 0.5 * (1 - Math.sin(th)) / 2, -0.6));
      const big = (j + row) % 2 ? 0.8 : 1;
      const g = paint(shard(base, dir, w * 0.34 * big, l * 0.75 * big, 4, 0.75), SW.spark, 'y', [0.3, 0.85]);
      if (Math.abs(n.x) < 0.02) C.push(g); else S.push(g);
    }
  }
  C.push(maneSh(V(0, 0.37, 0.42), V(0, -1, 0.25), 0.08, 0.13, 0.7));
  S.push(maneSh(V(0.09, 0.37, 0.4), V(0.35, -1, 0.2), 0.075, 0.12, 0.7));
  S.push(maneSh(V(0.17, 0.39, 0.34), V(0.6, -1, 0.0), 0.075, 0.12, 0.7));
  // ember sparks on the hump top (projected onto the mane mass) and between the shoulder tufts
  const projM = makeProjector([maneMass]);
  const spark = (p, d, w, l) => S.push(paint(shard(p, d, w, l, 4, 0.75), SW.spark, 'y', [0.3, 0.85]));
  for (const [x, z, w, l] of [[0.05, 0.25, 0.026, 0.085], [0.11, 0.1, 0.026, 0.09], [0.04, -0.02, 0.024, 0.08], [0.15, 0.3, 0.022, 0.075]]) {
    const hit = projM(V(x, 0.7, z), V(x * 1.5, 1, 0.1));
    if (hit) spark(hit.p.clone().addScaledVector(hit.n, -0.012), hit.n.clone().add(V(0, 0.3, -0.5)), w, l);
  }
  // shoulder fur tufts below the pauldron, with sparks between them
  S.push(maneSh(V(0.27, 0.36, 0.2), V(0.5, -1, 0.15), 0.07, 0.12, 0.6));
  S.push(maneSh(V(0.29, 0.37, 0.08), V(0.5, -1, -0.3), 0.07, 0.12, 0.6));
  spark(V(0.29, 0.37, 0.15), V(0.7, -0.8, 0.1), 0.022, 0.08);
  spark(V(0.24, 0.42, 0.27), V(0.5, -0.6, 0.7), 0.022, 0.075);

  // ================= ARMOUR: obsidian pauldrons with gold trim and a lava seam =================
  const PC = V(0.2, 0.46, 0.13), PA = V(1, 0.75, 0.15);
  const PAn0 = PA.clone().normalize();
  S.push(paint(hull(capPts(PC.clone().addScaledVector(PAn0, -0.1), PA, 0.25, 0.62, 0.06, 7, 2, 0.95)), SW.gold, 'y', [0.38, 0.66]));
  const paul = paint(hull(capPts(PC.clone().addScaledVector(PAn0, -0.08), PA, 0.25, 0.5, 0.06, 7, 2, 0.95)), SW.obsid, 'y', [0.42, 0.68]);
  S.push(paul);
  // gold spike on top of the pauldron
  const PAn = PA.clone().normalize();
  S.push(paint(shard(PC.clone().addScaledVector(PAn, 0.17), V(0.6, 1, -0.3), 0.04, 0.09, 4, 0.7), SW.gold, 'y', [0.55, 0.75]));

  // ================= HEAD (big, boxy, low and forward) =================
  const H = { y: 0.57, z: 0.43 };
  C.push(body([
    ...cbox(V(0, H.y, H.z), 0.21, 0.172, 0.175, 0.058),
    ...ring(V(0, H.y + 0.185, H.z - 0.01), 0.145, 0.11, 8, 'y'),
  ], 0.4, 0.8));
  const FZ = H.z + 0.175;

  // lighter muzzle
  const mz = [];
  for (const sx of [-1, 1]) mz.push(
    V(sx * 0.1, H.y + 0.0, FZ - 0.02), V(sx * 0.12, H.y - 0.012, FZ + 0.03),      // top, back
    V(sx * 0.115, H.y - 0.024, FZ + 0.085), V(sx * 0.13, H.y - 0.045, FZ + 0.11), // chamfered top-front edge
    V(sx * 0.158, H.y - 0.075, FZ + 0.1), V(sx * 0.165, H.y - 0.08, FZ + 0.05),   // wide at the nostrils
    V(sx * 0.145, H.y - 0.128, FZ + 0.11), V(sx * 0.15, H.y - 0.15, FZ + 0.08),   // lower front + chamfer
    V(sx * 0.14, H.y - 0.168, FZ + 0.02), V(sx * 0.13, H.y - 0.16, FZ - 0.02));   // chin underside
  C.push(paint(hull(mz), SW.muzzle, 'y', [H.y - 0.17, H.y]));
  S.push(flat(hull(plate([[-0.022, 0.008], [-0.008, 0.018], [0.018, 0.016], [0.026, 0.0], [0.016, -0.016], [-0.016, -0.016]],
    V(0.064, H.y - 0.07, 0), FZ + 0.1, FZ + 0.115)), SW.nostril));
  C.push(flat(hull(cbox(V(0, H.y - 0.137, FZ + 0.111), 0.04, 0.006, 0.004, 0.002)), SW.nostril));
  // gold nose ring
  C.push(paint(tube(curveSamples(
    [V(0.03, H.y - 0.075, FZ + 0.09), V(0.04, H.y - 0.11, FZ + 0.125), V(0, H.y - 0.135, FZ + 0.135), V(-0.04, H.y - 0.11, FZ + 0.125), V(-0.03, H.y - 0.075, FZ + 0.09)],
    7, () => 0.011), { seg: 6, ref: V(0, 0, 1) }), SW.gold, 'flat'));

  // glowing fierce eyes: orange glow rim, warm white almond, black pupil, catchlight
  const E = V(0.108, H.y + 0.05, 0), k = 1.32;
  const sc = (pts, kk = k) => pts.map(([u, v]) => [u * kk, v * kk]);
  const almond = [[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]];
  S.push(flat(hull(plate(sc(almond, 1.45), V(E.x, E.y - 0.004, 0), FZ - 0.02, FZ + 0.004)), SW.rim));
  S.push(flat(hull(plate(sc(almond), E, FZ - 0.01, FZ + 0.012)), SW.eyeGlow));
  S.push(flat(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.006, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye));
  S.push(flat(hull(plate([[-0.009, -0.009], [0.009, -0.009], [0.009, 0.009], [-0.009, 0.009]],
    V(E.x + 0.006, E.y + 0.004, 0), FZ + 0.014, FZ + 0.022)), SW.white));
  // heavy protruding brow slab, overhanging the eyes and slanting down to the centre
  S.push(paint(hull([
    V(0.012, E.y - 0.002, FZ + 0.062), V(0.012, E.y + 0.03, FZ + 0.07), V(0.012, E.y + 0.07, FZ + 0.05),
    V(0.205, E.y + 0.055, FZ + 0.028), V(0.205, E.y + 0.085, FZ + 0.034), V(0.205, E.y + 0.125, FZ + 0.005),
    V(0.012, E.y - 0.002, FZ - 0.03), V(0.012, E.y + 0.08, FZ - 0.04),
    V(0.205, E.y + 0.05, FZ - 0.05), V(0.205, E.y + 0.13, FZ - 0.07),
  ]), SW.brow, 'y'));

  // ears
  S.push(paint(hull([V(0.17, H.y + 0.06, H.z), V(0.17, H.y - 0.01, H.z - 0.03), V(0.17, H.y + 0.05, H.z - 0.09),
    V(0.33, H.y - 0.01, H.z - 0.04), V(0.33, H.y + 0.02, H.z - 0.02), V(0.3, H.y + 0.03, H.z - 0.06)]), SW.mane, 'flat'));

  // ================= HORNS (glowing lava, out then up and forward) =================
  S.push(paint(tube(curveSamples(
    [V(0.14, H.y + 0.13, H.z - 0.02), V(0.28, H.y + 0.15, H.z - 0.01), V(0.4, H.y + 0.21, H.z + 0.01), V(0.44, H.y + 0.31, H.z + 0.03),
      V(0.43, H.y + 0.42, H.z + 0.06), V(0.39, H.y + 0.5, H.z + 0.1)],
    8, (t) => 0.1 - 0.078 * Math.pow(t, 0.85), (t) => 0.09 - 0.07 * Math.pow(t, 0.85)),
    { seg: 6, axis: V(0, 0, 1), capStart: 0, capEnd: 0.04, phase: Math.PI / 6 }), SW.horn, 'len'));
  // obsidian + gold horn base
  S.push(paint(hull([...ring(V(0.15, H.y + 0.13, H.z - 0.02), 0.1, 0.1, 6, 'x', 0),
    ...ring(V(0.2, H.y + 0.14, H.z - 0.02), 0.1, 0.1, 6, 'x', 0)]), SW.obsid, 'y'));
  S.push(paint(hull([...ring(V(0.215, H.y + 0.142, H.z - 0.02), 0.095, 0.095, 6, 'x', 0),
    ...ring(V(0.235, H.y + 0.145, H.z - 0.02), 0.092, 0.092, 6, 'x', 0)]), SW.gold, 'y'));

  // ornate forehead plate: obsidian shield standing on the brow, gold border, glowing gem
  const pz = (y) => FZ + 0.035 - (y - (H.y + 0.11)) * 0.55; // plate front plane, leaning back
  const fh = (s, dz) => {
    const cy = H.y + 0.18, pts = [];
    for (const [x, y] of [[0, H.y + 0.095], [0.07, H.y + 0.15], [0.085, H.y + 0.215], [0.04, H.y + 0.245], [0, H.y + 0.258]])
      for (const sx of x ? [-1, 1] : [1]) {
        const yy = cy + (y - cy) * s;
        pts.push(V(sx * x * s, yy, pz(yy) + dz), V(sx * x * s, Math.min(yy, H.y + 0.17) - 0.03, pz(yy) + dz - 0.055));
      }
    return pts;
  };
  C.push(paint(hull(fh(1.17, -0.008)), SW.gold, 'y', [H.y + 0.08, H.y + 0.3]));
  C.push(paint(hull(fh(1.0, 0.0)), SW.obsid, 'y', [H.y + 0.08, H.y + 0.3]));
  const gy = H.y + 0.185;
  C.push(flat(hull([...[[0, 0.042], [0.03, 0], [0, -0.042], [-0.03, 0]].map(([x, y]) => V(x, gy + y, pz(gy + y) + 0.006)),
    V(0, gy, pz(gy) + 0.03)]), SW.lava));
  // obsidian crest shards on top of the head
  S.push(paint(shard(V(0.06, H.y + 0.19, H.z + 0.02), V(0.5, 1, -0.5), 0.04, 0.08, 4, 0.6), SW.gold, 'y', [H.y + 0.17, H.y + 0.3]));
  // shaggy forelock tufts behind the forehead shield, with embers smouldering in them
  for (const [x, z, dx, w, l] of [[0.05, H.z - 0.06, 0.25, 0.055, 0.11], [0.11, H.z - 0.03, 0.8, 0.05, 0.095]])
    S.push(paint(shard(V(x, H.y + 0.18, z), V(dx, 1, -0.7), w, l, 4, 0.7), SW.mane, 'y', [H.y + 0.1, H.y + 0.32]));
  C.push(paint(shard(V(0, H.y + 0.18, H.z - 0.09), V(0, 1, -0.9), 0.06, 0.12, 4, 0.7), SW.mane, 'y', [H.y + 0.1, H.y + 0.32]));
  S.push(paint(shard(V(0.08, H.y + 0.19, H.z - 0.02), V(0.5, 1, -0.3), 0.022, 0.085, 4, 0.75), SW.spark, 'y', [H.y + 0.15, H.y + 0.3]));
  S.push(paint(shard(V(0.03, H.y + 0.19, H.z - 0.1), V(0.2, 1, -0.6), 0.02, 0.08, 4, 0.75), SW.spark, 'y', [H.y + 0.15, H.y + 0.3]));
  // obsidian crystal spikes along the spine behind the mane
  C.push(paint(shard(V(0, 0.585, -0.17), V(0, 1, -0.7), 0.055, 0.12, 4, 0.7), SW.obsid, 'y', [0.55, 0.72]));
  C.push(paint(shard(V(0, 0.56, -0.31), V(0, 1, -0.9), 0.045, 0.09, 4, 0.7), SW.obsid, 'y', [0.52, 0.66]));

  // ================= TAIL (rope, obsidian tuft with ember core) =================
  C.push(paint(tube(curveSamples(
    [V(0, 0.48, -0.43), V(0, 0.45, -0.57), V(0, 0.5, -0.69), V(0, 0.62, -0.73), V(0, 0.71, -0.68)],
    7, (t) => 0.034 - 0.01 * t),
    { seg: 6, axis: X }), SW.tail, 'y', [0.4, 0.9]));
  const T = V(0, 0.71, -0.68);
  const tp = (x, y, z) => V(T.x + x, T.y + y, T.z + z);
  C.push(paint(hull([tp(0, -0.04, -0.01), ...ring(tp(0, 0.07, 0.02), 0.055, 0.075, 6, 'y', 0), tp(0, 0.2, 0.06),
    tp(0, 0.13, 0.1), tp(0, 0.12, -0.06)]), SW.obsid, 'y', [T.y - 0.05, T.y + 0.2]));
  S.push(paint(shard(tp(0.03, 0.06, 0.02), V(0.8, 0.6, 0), 0.03, 0.085, 4, 0.6), SW.spark, 'y', [T.y - 0.05, T.y + 0.2]));
  C.push(paint(shard(tp(0, 0.06, -0.02), V(0, 0.4, -1), 0.035, 0.09, 4, 0.6), SW.spark, 'y', [T.y - 0.05, T.y + 0.2]));

  // ================= LAVA CRACKS on legs and flanks =================
  const proj = makeProjector(crackTargets);
  const crk = (a, b, n, o) => crack(S, proj, a, b, n, o);
  crk(V(0.3, 0.32, 0.2), V(0.31, 0.12, 0.16), V(1, 0, 0.2), { segs: 6, amp: 0.026, seed: 1 });      // front leg outer
  crk(V(0.305, 0.24, 0.18), V(0.3, 0.2, 0.25), V(1, 0, 0.5), { segs: 2, amp: 0.01, seed: 11, w0: 0.01 });
  crk(V(0.25, 0.3, 0.28), V(0.23, 0.13, 0.27), V(0.3, 0, 1), { segs: 6, amp: 0.026, seed: 2, w0: 0.012 }); // front leg front
  crk(V(0.245, 0.23, 0.29), V(0.19, 0.19, 0.28), V(0, 0, 1), { segs: 2, amp: 0.01, seed: 12, w0: 0.009 });
  crk(V(0.24, 0.17, 0.28), V(0.28, 0.12, 0.26), V(0.4, 0, 1), { segs: 2, amp: 0.008, seed: 13, w0: 0.008 });
  crk(V(0.28, 0.45, -0.2), V(0.29, 0.25, -0.31), V(1, 0, 0), { segs: 5, amp: 0.022, seed: 3 });  // thigh
  crk(V(0.28, 0.2, -0.33), V(0.27, 0.12, -0.3), V(1, 0, 0), { segs: 2, amp: 0.012, seed: 4, w0: 0.009 }); // shin
  crk(V(0.25, 0.5, -0.05), V(0.25, 0.32, -0.12), V(1, 0.1, 0), { segs: 5, amp: 0.024, seed: 5 }); // flank
  crk(V(0.2, 0.62, -0.18), V(0.24, 0.48, -0.26), V(0.7, 0.7, 0), { segs: 4, amp: 0.02, seed: 6, w0: 0.01 }); // back/hip

  crk(V(0.31, 0.22, 0.19), V(0.3, 0.19, 0.12), V(1, 0, 0), { segs: 2, amp: 0.008, seed: 7, w0: 0.01 });
  crk(V(0.29, 0.36, -0.26), V(0.27, 0.42, -0.36), V(1, 0, -0.3), { segs: 2, amp: 0.01, seed: 8, w0: 0.01 });
  crk(V(0.26, 0.41, -0.09), V(0.24, 0.45, -0.17), V(1, 0.1, 0), { segs: 2, amp: 0.008, seed: 9, w0: 0.01 });

  // shard fur tufts in body colour: elbows, chest underside, hocks
  const furT = (b, d, w, l) => S.push(paint(shard(b, d, w, l, 4, 0.6), SW.body, 'y', [0.05, 0.7]));
  furT(V(0.22, 0.3, 0.06), V(0.3, -0.6, -1), 0.06, 0.1);
  furT(V(0.27, 0.28, 0.1), V(0.7, -0.6, -0.6), 0.05, 0.085);
  furT(V(0.1, 0.27, 0.27), V(0.2, -1, 0.1), 0.06, 0.09);
  furT(V(0.07, 0.25, 0.1), V(0.1, -1, -0.3), 0.06, 0.08);
  furT(V(0.19, 0.2, -0.39), V(0.2, -0.5, -1), 0.05, 0.08);
  furT(V(0.25, 0.42, -0.36), V(0.6, -0.3, -1), 0.05, 0.08);

  return assemble(C, S);
}

// Kitsune Knuckles (Secret, Round 7 - Blossom Brawl): white fox spirit with glowing pink kitsune markings,
// five fanned flame-tipped tails, shimenawa rope collar with a jade bead, silk ribbons, cherry blossoms,
// floating foxfire and petals, gold knuckle bands on the front paws.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  body: { i: 0, top: '#FFFFFF', bot: '#E4E0EE' },
  ruff: { i: 1, top: '#FFFFFF', bot: '#E2DDF0' },
  paw: { i: 2, top: '#FFFFFF', bot: '#DCD7E8' },
  white: { i: 3, top: '#FFFFFF', bot: '#F1F1F4' },
  eye: { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  nose: { i: 5, top: '#3A3438', bot: '#141114' },
  mouth: { i: 6, top: '#5A2A3A', bot: '#3A1626' },
  brow: { i: 7, top: '#F6F3FC', bot: '#CFC8E2' },
  liner: { i: 8, top: '#F0479A', bot: '#C21E6E' },
  earIn: { i: 9, top: '#FFB6D9', bot: '#F27DB5' },
  mark: { i: 10, top: '#FFA6DA', bot: '#FF4FB2', glow: true },
  flame: { i: 11, top: '#FFF4FB', bot: '#FF3DAA', glow: true },
  tail: { i: 12, top: '#FFFFFF', bot: '#FFA8D8' },
  rope: { i: 13, top: '#F6DA8A', bot: '#C99B3C' },
  jade: { i: 14, top: '#8EF0C0', bot: '#1F9E6C' },
  silk: { i: 15, top: '#FF5C8A', bot: '#C81E4E' },
  gold: { i: 16, top: '#FFE27A', bot: '#E0A21E' },
  petal: { i: 17, top: '#FFE1EF', bot: '#FF94C6' },
  petalC: { i: 18, top: '#FFE680', bot: '#F2B53A' },
};
const SW = PALETTE;

// colour by distance along a direction (t = 1 at origin -> 0 at origin + dir*len), i.e. base = bot, tip = top
function paintAlong(g, sw, o, d, len) {
  const p = g.attributes.position, uv = [];
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  for (let i = 0; i < p.count; i++) {
    const s = (p.getX(i) - o.x) * d.x + (p.getY(i) - o.y) * d.y + (p.getZ(i) - o.z) * d.z;
    const t = THREE.MathUtils.clamp(1 - s / len, 0, 1);
    uv.push((x + 64) / 1024, (y + 16 + t * 96) / 1024);
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

// raised decal: convex 2D polygon projected onto target hulls along an axis, lifted off the surface
const MAT = new THREE.MeshBasicMaterial();
function decal(targets, poly, axis, { lift = 0.006, depth = 0.012, step = 0.016 } = {}) {
  const meshes = targets.map((g) => new THREE.Mesh(g, MAT));
  const rc = new THREE.Raycaster();
  const inside = (u, v) => {
    let sgn = 0;
    for (let k = 0; k < poly.length; k++) {
      const [a, b] = poly[k], [c, d] = poly[(k + 1) % poly.length];
      const cr = (c - a) * (v - b) - (d - b) * (u - a);
      if (Math.abs(cr) < 1e-9) continue;
      if (sgn === 0) sgn = Math.sign(cr); else if (Math.sign(cr) !== sgn) return false;
    }
    return true;
  };
  const samples = [];
  for (let k = 0; k < poly.length; k++) {
    const [a, b] = poly[k], [c, d] = poly[(k + 1) % poly.length];
    const n = Math.max(1, Math.ceil(Math.hypot(c - a, d - b) / step));
    for (let j = 0; j < n; j++) samples.push([a + (c - a) * j / n, b + (d - b) * j / n]);
  }
  const us = poly.map((q) => q[0]), vs = poly.map((q) => q[1]);
  for (let u = Math.min(...us) + step / 2; u < Math.max(...us); u += step)
    for (let v = Math.min(...vs) + step / 2; v < Math.max(...vs); v += step) if (inside(u, v)) samples.push([u, v]);
  const pts = [];
  for (const [u, v] of samples) {
    let o, dir;
    if (axis === 'z') { o = V(u, v, 5); dir = V(0, 0, -1); }
    else if (axis === 'x') { o = V(5, v, u); dir = V(-1, 0, 0); }
    else if (axis === '-z') { o = V(u, v, -5); dir = V(0, 0, 1); }
    else { o = V(u, 5, v); dir = V(0, -1, 0); }
    rc.set(o, dir);
    const hit = rc.intersectObjects(meshes, false)[0];
    if (!hit) continue;
    const n = hit.face.normal.clone();
    pts.push(hit.point.clone().addScaledVector(n, lift), hit.point.clone().addScaledVector(n, -depth));
  }
  return hull(pts);
}

// 5-petal cherry blossom lying in the plane with normal n
function blossom(out, c, n, size) {
  n = n.clone().normalize();
  const up = Math.abs(n.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
  const a = new THREE.Vector3().crossVectors(up, n).normalize();
  const b = new THREE.Vector3().crossVectors(n, a).normalize();
  for (let k = 0; k < 5; k++) {
    const th = Math.PI / 2 + (2 * Math.PI * k) / 5;
    const r = a.clone().multiplyScalar(Math.cos(th)).addScaledVector(b, Math.sin(th));
    const s = new THREE.Vector3().crossVectors(n, r);
    const pts = [];
    for (const [pr, ps] of [[0.1, 0], [0.5, 0.42], [0.95, 0.26], [0.85, 0], [0.95, -0.26], [0.5, -0.42]])
      for (const h of [-0.12, 0.12 + 0.18 * pr])
        pts.push(c.clone().addScaledVector(r, pr * size).addScaledVector(s, ps * size).addScaledVector(n, h * size));
    out.push(paint(hull(pts), SW.petal, 'flat'));
  }
  out.push(paint(hull(ring(V(0, 0, 0), 0.22 * size, 0.22 * size, 5, 'y').map((p) => c.clone().addScaledVector(a, p.x).addScaledVector(b, p.z)).concat([c.clone().addScaledVector(n, 0.32 * size), c.clone().addScaledVector(n, -0.05 * size)])), SW.petalC, 'flat'));
}

// faceted flame: core shard + 4 licks, coloured magenta at the base to white at the tip
function flame(out, base, dir, w, len, sw = SW.flame) {
  const d = dir.clone().normalize();
  const up = Math.abs(d.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
  const a = new THREE.Vector3().crossVectors(d, up).normalize();
  const b = new THREE.Vector3().crossVectors(a, d).normalize();
  const o = base.clone().addScaledVector(d, -w * 0.5);
  out.push(paintAlong(hull([...[0, 1, 2, 3, 4, 5].map((k) => base.clone().addScaledVector(a, Math.cos(k * Math.PI / 3) * w).addScaledVector(b, Math.sin(k * Math.PI / 3) * w)),
    base.clone().addScaledVector(d, -w * 0.6), base.clone().addScaledVector(d, len)]), sw, o, d, len * 1.05));
  for (const [ca, cb] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const side = a.clone().multiplyScalar(ca).addScaledVector(b, cb);
    const ld = d.clone().addScaledVector(side, 0.55).normalize();
    const g = shard(base.clone().addScaledVector(side, w * 0.55).addScaledVector(d, w * 0.2), ld, w * 0.5, len * 0.62, 4);
    out.push(paintAlong(g, sw, o, d, len * 1.05));
  }
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const wh = (g, lo = 0.0, hi = 0.95) => paint(g, SW.body, 'y', [lo, hi]);

  // ================= BODY =================
  const body = hull([
    ...ring(V(0, 0.37, -0.28), 0.09, 0.085, 10, 'z'),
    ...ring(V(0, 0.37, -0.21), 0.15, 0.14, 10, 'z'),
    ...ring(V(0, 0.38, -0.06), 0.16, 0.15, 10, 'z'),
    ...ring(V(0, 0.4, 0.09), 0.165, 0.16, 10, 'z'),
    ...ring(V(0, 0.43, 0.2), 0.145, 0.15, 10, 'z'),
    ...ring(V(0, 0.45, 0.25), 0.09, 0.1, 10, 'z'),
  ]);
  C.push(wh(body, 0.15, 0.6));
  C.push(wh(hull([...ring(V(0, 0.44, 0.16), 0.12, 0.115, 10, 'y'), ...ring(V(0, 0.62, 0.2), 0.125, 0.115, 10, 'y')]), 0.3, 0.8));

  // ================= LEGS =================
  const FL = { x: 0.135, z: 0.17 }, BL = { x: 0.15, z: -0.18 };
  const fLeg = hull([...ring(V(FL.x, 0.06, FL.z), 0.074, 0.074, 8), ...ring(V(FL.x, 0.2, FL.z - 0.005), 0.08, 0.082, 8),
    ...ring(V(FL.x - 0.01, 0.33, FL.z - 0.02), 0.088, 0.096, 8), ...ring(V(FL.x - 0.03, 0.43, FL.z - 0.04), 0.07, 0.085, 8)]);
  S.push(wh(fLeg, 0, 0.55));
  const haunch = hull([...ring(V(BL.x - 0.02, 0.44, BL.z), 0.07, 0.1, 8), ...ring(V(BL.x + 0.005, 0.33, BL.z + 0.01), 0.1, 0.14, 8),
    ...ring(V(BL.x + 0.005, 0.21, BL.z + 0.01), 0.078, 0.095, 8)]);
  S.push(wh(haunch, 0, 0.55));
  S.push(wh(hull([...ring(V(BL.x + 0.005, 0.23, BL.z), 0.078, 0.084, 8), ...ring(V(BL.x + 0.008, 0.06, BL.z - 0.01), 0.072, 0.074, 8)]), 0, 0.55));
  // glowing pink leg bands
  S.push(paint(hull([...ring(V(FL.x, 0.125, FL.z - 0.0025), 0.084, 0.085, 8), ...ring(V(FL.x, 0.175, FL.z - 0.004), 0.086, 0.088, 8)]), SW.mark, 'y'));
  S.push(paint(hull([...ring(V(BL.x + 0.007, 0.12, BL.z - 0.006), 0.082, 0.084, 8), ...ring(V(BL.x + 0.006, 0.17, BL.z - 0.003), 0.084, 0.088, 8)]), SW.mark, 'y'));

  // paws with toes; front paws get gold knuckle bands with studs
  const paw = (x, z, knuckles) => {
    S.push(paint(hull(cbox(V(x, 0.042, z - 0.005), 0.076, 0.042, 0.066, 0.022)), SW.paw, 'y', [0, 0.09]));
    for (const dx of [-0.05, 0, 0.05])
      S.push(paint(hull(cbox(V(x + dx, 0.033, z + 0.058), 0.026, 0.033, 0.032, 0.012)), SW.paw, 'y', [0, 0.09]));
    if (knuckles) {
      S.push(paint(hull(cbox(V(x, 0.05, z + 0.052), 0.082, 0.022, 0.03, 0.01)), SW.gold, 'y', [0.02, 0.08]));
      for (const dx of [-0.05, 0, 0.05])
        S.push(paint(shard(V(x + dx, 0.06, z + 0.07), V(0, 0.6, 1), 0.014, 0.03), SW.gold, 'flat'));
    }
  };
  paw(FL.x, FL.z + 0.005, true);
  paw(BL.x + 0.008, BL.z, false);

  // ================= CHEST RUFF =================
  const rf = (g) => paint(g, SW.ruff, 'flat');
  C.push(paint(blob(1, V(0, 0.42, 0.26), V(0.13, 0.13, 0.08), { jitter: 0.18 }), SW.ruff, 'y', [0.26, 0.6]));
  C.push(rf(shard(V(0, 0.31, 0.27), V(0, -1, 0.35), 0.05, 0.1)));
  C.push(rf(shard(V(0, 0.4, 0.31), V(0, -0.7, 1), 0.055, 0.08)));
  for (const [b, d, w, l] of [
    [V(0.05, 0.31, 0.27), V(0.25, -1, 0.35), 0.048, 0.1],
    [V(0.1, 0.34, 0.25), V(0.6, -1, 0.3), 0.048, 0.09],
    [V(0.055, 0.41, 0.3), V(0.35, -0.7, 1), 0.05, 0.075],
    [V(0.12, 0.43, 0.27), V(0.9, -0.7, 0.6), 0.048, 0.075],
    [V(0.15, 0.47, 0.2), V(1, -0.8, 0.0), 0.045, 0.06],
  ]) S.push(rf(shard(b, d, w, l)));

  // ================= HEAD =================
  const H = { y: 0.7, z: 0.24 };
  const c0 = C.length, s0 = S.length;
  const head = hull([
    ...cbox(V(0, H.y, H.z), 0.18, 0.14, 0.14, 0.06),
    ...ring(V(0, H.y + 0.16, H.z - 0.01), 0.12, 0.1, 8, 'y'),
    V(0.225, H.y - 0.07, H.z + 0.03), V(-0.225, H.y - 0.07, H.z + 0.03),
    V(0.2, H.y - 0.11, H.z - 0.04), V(-0.2, H.y - 0.11, H.z - 0.04),
  ]);
  C.push(wh(head, 0.5, 0.92));
  const FZ = H.z + 0.14;

  // snout, jaw, nose, mouth
  const snout = hull([...cbox(V(0, H.y - 0.08, FZ + 0.01), 0.085, 0.055, 0.045, 0.025),
    ...cbox(V(0, H.y - 0.08, FZ + 0.1), 0.045, 0.038, 0.022, 0.012), V(0.06, H.y - 0.03, FZ - 0.03), V(-0.06, H.y - 0.03, FZ - 0.03)]);
  C.push(paint(snout, SW.ruff, 'y', [H.y - 0.14, H.y - 0.02]));
  C.push(paint(hull(cbox(V(0, H.y - 0.14, FZ + 0.02), 0.065, 0.025, 0.05, 0.012)), SW.ruff, 'y', [H.y - 0.17, H.y - 0.11]));
  C.push(paint(hull([...cbox(V(0, H.y - 0.05, FZ + 0.12), 0.034, 0.02, 0.016, 0.008),
    V(0, H.y - 0.078, FZ + 0.118), V(0.018, H.y - 0.07, FZ + 0.118), V(-0.018, H.y - 0.07, FZ + 0.118)]), SW.nose, 'y'));
  C.push(paint(hull(cbox(V(0, H.y - 0.097, FZ + 0.121), 0.005, 0.016, 0.005, 0.002)), SW.mouth, 'flat'));
  S.push(paint(hull([V(0, H.y - 0.115, FZ + 0.125), V(0, H.y - 0.105, FZ + 0.125), V(0.045, H.y - 0.124, FZ + 0.1),
    V(0.045, H.y - 0.116, FZ + 0.1), V(0, H.y - 0.115, FZ + 0.112), V(0.045, H.y - 0.12, FZ + 0.09)]), SW.mouth, 'flat'));

  // fierce eyes with pink kitsune liner
  const E = V(0.088, H.y + 0.035, 0);
  S.push(paint(hull(plate([[-0.01, 0.022], [0.05, 0.043], [0.082, 0.036], [0.062, -0.014], [0.034, -0.044], [0.0, -0.01]],
    E, FZ - 0.012, FZ + 0.006)), SW.liner, 'flat'));
  S.push(paint(hull(plate([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]],
    E, FZ - 0.01, FZ + 0.012)), SW.white, 'flat'));
  S.push(paint(hull(plate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]],
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.014, FZ + 0.021)), SW.white, 'flat'));
  const brow = hull([
    V(0.028, E.y + 0.012, FZ + 0.03), V(0.03, E.y + 0.05, FZ + 0.02),
    V(0.15, E.y + 0.05, FZ - 0.01), V(0.15, E.y + 0.088, FZ - 0.025),
    V(0.028, E.y + 0.012, FZ - 0.03), V(0.03, E.y + 0.06, FZ - 0.04),
    V(0.15, E.y + 0.05, FZ - 0.06), V(0.15, E.y + 0.09, FZ - 0.07),
  ]);
  S.push(paint(brow, SW.brow, 'y'));

  // kitsune markings (glowing pink decals)
  const mk = (g) => paint(g, SW.mark, 'y');
  C.push(mk(decal([head], [[0, H.y + 0.075], [0.024, H.y + 0.12], [0, H.y + 0.17], [-0.024, H.y + 0.12]], 'z')));
  S.push(mk(decal([head], [[0.05, H.y + 0.11], [0.07, H.y + 0.125], [0.16, H.y + 0.15], [0.14, H.y + 0.125]], 'z')));
  S.push(mk(decal([head], [[0.235, H.y - 0.04], [0.228, H.y - 0.07], [0.135, H.y - 0.05]], 'z')));
  S.push(mk(decal([head], [[0.215, H.y - 0.085], [0.2, H.y - 0.11], [0.125, H.y - 0.08]], 'z')));

  // cheek fluff shards
  for (const [b, d, w, l] of [
    [V(0.2, H.y - 0.06, H.z + 0.04), V(1, -0.35, 0.1), 0.045, 0.08],
    [V(0.19, H.y - 0.1, H.z - 0.02), V(0.9, -0.8, -0.2), 0.04, 0.07],
    [V(0.18, H.y - 0.02, H.z - 0.04), V(1, 0.1, -0.4), 0.04, 0.06],
  ]) S.push(rf(shard(b, d, w, l)));

  // tall pointy ears with pink inners
  const ear = { A: V(0.055, H.y + 0.12, H.z + 0.03), B: V(0.2, H.y + 0.065, H.z + 0.03), T: V(0.175, H.y + 0.37, H.z - 0.035), K: V(0.13, H.y + 0.09, H.z - 0.08) };
  S.push(wh(hull([ear.A, ear.B, ear.T, ear.K, ear.T.clone().add(V(-0.01, -0.02, -0.02))]), H.y + 0.05, H.y + 0.4));
  {
    const nrm = new THREE.Vector3().subVectors(ear.B, ear.A).cross(new THREE.Vector3().subVectors(ear.T, ear.A)).normalize();
    if (nrm.z < 0) nrm.negate();
    const cen = ear.A.clone().add(ear.B).add(ear.T).divideScalar(3);
    const sh = (p, k) => cen.clone().lerp(p, k);
    const tri = [sh(ear.A, 0.72).add(V(0, 0.03, 0)), sh(ear.B, 0.72).add(V(0, 0.03, 0)), sh(ear.T, 0.8)];
    S.push(paint(hull([...tri.map((p) => p.clone().addScaledVector(nrm, 0.007)), ...tri.map((p) => p.clone().addScaledVector(nrm, -0.012))]), SW.earIn, 'y'));
  }
  // blossom hair ornament at the ear base
  blossom(S, V(0.2, H.y + 0.1, H.z + 0.06), V(0.5, 0.3, 1), 0.045);
  // scale the whole head group up about the chin so it reads big (sheet style)
  for (const g of [...C.slice(c0), ...S.slice(s0)]) {
    g.translate(0, -(H.y - 0.12), -H.z); g.scale(1.1, 1.1, 1.1); g.translate(0, H.y - 0.12, H.z + 0.01);
  }

  // ================= COLLAR: shimenawa rope, jade bead, silk ribbons =================
  {
    const pts = [];
    for (let k = 0; k <= 10; k++) {
      const a = (Math.PI * k) / 10;
      pts.push({ p: V(0.165 * Math.sin(a), 0.525 - 0.05 * Math.cos(a), 0.17 + 0.165 * Math.cos(a)), rx: 0.026, ry: 0.026 });
    }
    S.push(paint(tube(pts, { seg: 6, axis: V(0, 1, 0), scale: (i) => (i % 2 ? 1.2 : 0.9) }), SW.rope, 'y', [0.45, 0.6]));
  }
  C.push(paint(hull([...ring(V(0, 0.425, 0.345), 0.04, 0.04, 8, 'z', 0), V(0, 0.475, 0.345), V(0, 0.37, 0.345), V(0, 0.425, 0.375), V(0, 0.425, 0.315)]), SW.jade, 'y'));
  C.push(paint(hull(cbox(V(0, 0.474, 0.343), 0.018, 0.012, 0.018, 0.005)), SW.gold, 'flat'));
  for (const a of [0.6]) {
    const c = V(0.165 * Math.sin(a), 0.525 - 0.05 * Math.cos(a) - 0.01, 0.17 + 0.165 * Math.cos(a));
    S.push(paint(blob(0, c, V(0.024, 0.024, 0.024)), SW.jade, 'y'));
  }
  // silk ribbon knot + streamers from the collar sides
  {
    const a = 1.05, k = V(0.165 * Math.sin(a), 0.525 - 0.05 * Math.cos(a), 0.17 + 0.165 * Math.cos(a) + 0.01);
    S.push(paint(hull(cbox(k.clone().add(V(0.012, 0, 0)), 0.02, 0.026, 0.026, 0.008)), SW.silk, 'flat'));
    for (const [off, end] of [[V(0, 0, 0.0), V(0.24, 0.33, 0.29)], [V(0, 0, -0.02), V(0.27, 0.35, 0.18)]]) {
      const p0 = k.clone().add(off).add(V(0.02, -0.01, 0));
      S.push(paint(tube(curveSamples([p0, p0.clone().lerp(end, 0.5).add(V(0.015, 0, 0.02)), end], 6, (t) => 0.007, (t) => 0.032 - 0.004 * t),
        { seg: 4, axis: X, phase: Math.PI / 4, capEnd: 0 }), SW.silk, 'y', [0.25, 0.5]));
    }
  }

  // ================= TAILS: five fanned flame-tipped tails =================
  const R = V(0, 0.42, -0.25);
  for (const deg of [0, 37, 72]) {
    const th = (deg * Math.PI) / 180, d = V(Math.sin(th), Math.cos(th), 0);
    const L = deg === 0 ? 0.5 : deg === 37 ? 0.48 : 0.42;
    const cp = [R.clone(), R.clone().add(V(d.x * 0.04, 0.03, -0.08)), R.clone().addScaledVector(d, L * 0.38).add(V(0, 0, -0.19)),
      R.clone().addScaledVector(d, L * 0.72).add(V(0, 0, -0.21)), R.clone().addScaledVector(d, L).add(V(0, 0, -0.15))];
    const samp = curveSamples(cp, 10, (t) => 0.036 + 0.05 * Math.sin(Math.PI * Math.min(1, t * 0.95 + 0.08)) - 0.008 * t);
    const axis = deg === 0 ? X : V(Math.cos(th), -Math.sin(th), 0);
    const g = tube(samp, { seg: 8, axis, capEnd: 0.02, twist: (i) => (i % 2) * Math.PI / 8, scale: (i) => (i % 2 ? 1.16 : 0.96) });
    g.userData.t = g.userData.t.map((t) => Math.pow(t, 3));
    paint(g, SW.tail, 'len');
    const tip = samp[samp.length - 1].p, pre = samp[samp.length - 3].p;
    const td = tip.clone().sub(pre).normalize();
    const out = deg === 0 ? C : S;
    out.push(g);
    flame(out, tip.clone().addScaledVector(td, -0.01), td, 0.06, 0.2);
  }
  // silk bow at the tail root
  C.push(paint(hull(cbox(V(0, 0.47, -0.27), 0.03, 0.03, 0.03, 0.01)), SW.silk, 'flat'));
  S.push(paint(hull([V(0.02, 0.47, -0.27), V(0.02, 0.5, -0.27), V(0.11, 0.53, -0.29), V(0.12, 0.45, -0.29), V(0.02, 0.47, -0.25), V(0.11, 0.5, -0.31)]), SW.silk, 'y'));

  // ================= GLOWING BODY PATTERNS =================
  S.push(mk(decal([haunch, body], [[-0.1, 0.5], [-0.07, 0.48], [-0.2, 0.36], [-0.24, 0.4]], 'x')));
  S.push(mk(decal([haunch, body], [[-0.02, 0.53], [0.01, 0.52], [-0.06, 0.4], [-0.09, 0.42]], 'x')));
  S.push(mk(decal([fLeg, body], [[0.06, 0.48], [0.09, 0.47], [0.11, 0.33], [0.08, 0.34]], 'x')));

  // ================= FLOATING DETAILS: foxfire + blossoms =================
  const foxfire = (c, r) => {
    const lo = c.y - r, hi = c.y + r * 3;
    S.push(paint(hull([...ring(c.clone().add(V(0, -r * 0.55, 0)), r * 0.75, r * 0.75, 6, 'y', Math.PI / 6), ...ring(c, r, r, 6, 'y', 0),
      ...ring(c.clone().add(V(0, r * 0.7, 0)), r * 0.7, r * 0.7, 6, 'y', Math.PI / 6),
      c.clone().add(V(0, -r * 0.95, 0)), c.clone().add(V(-r * 0.3, r * 2.9, -r * 0.2))]), SW.flame, 'y', [lo, hi]));
    for (const [dx, dz, l] of [[1, 0.3, 1.6], [-0.8, -0.5, 1.9], [0.2, 1, 1.4]])
      S.push(paint(shard(c.clone().add(V(dx * r * 0.6, r * 0.5, dz * r * 0.6)), V(dx * 0.5, 1, dz * 0.5), r * 0.42, r * l, 4), SW.flame, 'y', [lo, hi]));
  };
  foxfire(V(0.35, 0.84, 0.12), 0.045);
  foxfire(V(0.39, 0.4, -0.02), 0.038);
  blossom(S, V(0.34, 0.3, 0.34), V(0.5, 0.3, 1), 0.042);
  // drifting single petals
  for (const [c, n] of [[V(0.44, 0.66, -0.1), V(0.3, 1, 0.6)], [V(0.3, 0.95, 0.0), V(-0.4, 1, 0.8)]]) {
    const nn = n.clone().normalize(), r = new THREE.Vector3().crossVectors(nn, V(0, 0, 1)).normalize(), sd = new THREE.Vector3().crossVectors(nn, r);
    const pts = [];
    for (const [pr, ps] of [[-0.5, 0], [0, 0.42], [0.45, 0.3], [0.55, 0], [0.45, -0.3], [0, -0.42]])
      for (const h of [-0.06, 0.06]) pts.push(c.clone().addScaledVector(r, pr * 0.085).addScaledVector(sd, ps * 0.085).addScaledVector(nn, h * 0.085 + 0.02 * pr * pr));
    S.push(paint(hull(pts), SW.petal, 'flat'));
  }

  // crouch: compress the legs so the body sits lower and the limbs read short and thick
  for (const g of [...C, ...S]) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      p.setY(i, y - 0.06 * Math.min(1, Math.max(0, (y - 0.08) / 0.24)));
    }
    g.computeVertexNormals();
  }
  return assemble(C, S);
}

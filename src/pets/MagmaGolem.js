// Magma Golem (Mythic, Round 5 - Volcano Crater): knuckle-walking golem built from craggy black volcanic
// boulders, bright lava glowing through deep gaps between them and in jagged branching veins across them,
// obsidian crystal shards, big obsidian horns with lava tips, and a molten sternum rune.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  rock:     { i: 0, top: '#6C6479', bot: '#24202A' },  // cool charcoal / purple-grey
  rock2:    { i: 1, top: '#625659', bot: '#1F191C' },  // warmer, slightly reddish basalt
  lava:     { i: 2, top: '#FFE08A', bot: '#FF6A00', glow: true },
  lavaCore: { i: 3, top: '#FFB347', bot: '#FF5A00', glow: true },
  obsidian: { i: 4, top: '#5A4C74', bot: '#15121C' },
  horn:     { i: 5, top: '#3A3248', bot: '#1A1622' },  // 'len': base -> tip
  white:    { i: 6, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:      { i: 7, top: '#1A1416', bot: '#0C0A0B' },
  brow:     { i: 8, top: '#7A7186', bot: '#3A3542' },
  rim:      { i: 9, top: '#FFD27A', bot: '#FF7A10', glow: true },
  hot:      { i: 10, top: '#FFF6D0', bot: '#FFD060', glow: true },
};
const SW = PALETTE;

// ---------- deterministic randomness ----------
function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// craggy boulder points: n jittered directions on an ellipsoid (sym = mirrored about x=0 for centre parts)
function cragPts(c, r, n, seed, { sym = false, jag = 0.28, rot = null, floor = null } = {}) {
  const R = rng(seed), pts = [];
  jag *= 0.6; r = r.clone().multiplyScalar(1.22); // hull of few points is smaller than the ellipsoid
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n, rr = Math.sqrt(1 - y * y), th = golden * i + R() * 0.9;
    let d = V(Math.cos(th) * rr, y, Math.sin(th) * rr);
    d.add(V(R() - 0.5, R() - 0.5, R() - 0.5).multiplyScalar(0.35)).normalize();
    if (sym) d.x = Math.abs(d.x);
    const s = 1 - jag * R();
    pts.push(V(d.x * r.x * s, d.y * r.y * s, d.z * r.z * s));
  }
  if (sym) for (const p of pts.slice()) if (p.x > 1e-4) pts.push(V(-p.x, p.y, p.z));
  const q = rot ? new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2])) : null;
  return pts.map((p) => {
    if (q) p.applyQuaternion(q);
    p.add(c);
    if (floor !== null && p.y < floor) p.y = floor;
    return p;
  });
}
// craggy limb segment between a and b
function segPts(a, b, ra, rb, seed, { per = 6, jag = 0.22 } = {}) {
  const R = rng(seed), ax = new THREE.Vector3().subVectors(b, a).normalize();
  const u = new THREE.Vector3().crossVectors(ax, Math.abs(ax.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0)).normalize();
  const w = new THREE.Vector3().crossVectors(ax, u).normalize();
  const pts = [];
  for (const [t, ext] of [[0, -0.15], [0.5, 0], [1, 0.12]]) {
    const r = ra + (rb - ra) * t, base = a.clone().lerp(b, t);
    for (let k = 0; k < per; k++) {
      const th = (k / per) * Math.PI * 2 + R() * 0.8 + t * 1.3, s = r * (1 - jag * R());
      pts.push(base.clone().addScaledVector(u, Math.cos(th) * s).addScaledVector(w, Math.sin(th) * s)
        .addScaledVector(ax, (t === 0 ? -1 : t === 1 ? 1 : 0) * r * (0.2 + 0.4 * R()) + ext * r * 0));
    }
  }
  return pts;
}

export function buildGeometry() {
  const C = [], S = [];
  const tone = (g, sw) => { g.computeBoundingBox(); const b = g.boundingBox; return paint(g, sw, 'y', [b.min.y - 0.03, b.max.y + 0.04]); };
  const rockG = []; // [geometry, side] for vein ray casting
  const add = (pts, side, sw = SW.rock) => { const g = tone(hull(pts), sw); (side ? S : C).push(g); rockG.push(g); return g; };
  const lava = (g) => paint(g, SW.lava, 'flat');
  const coreP = (g) => paint(g, SW.lavaCore, 'y');

  // ---- jagged lava vein laid onto rock surfaces by ray casting; width tapers trunk -> tip ----
  const ray = new THREE.Ray(), tri = [V(0, 0, 0), V(0, 0, 0), V(0, 0, 0)], hit = V(0, 0, 0);
  const project = (p, dir, geos) => {
    ray.origin.copy(p).addScaledVector(dir, -0.4); ray.direction.copy(dir).normalize();
    let best = null;
    for (const g of geos) {
      const pa = g.attributes.position;
      for (let i = 0; i < pa.count; i += 3) {
        tri[0].fromBufferAttribute(pa, i); tri[1].fromBufferAttribute(pa, i + 1); tri[2].fromBufferAttribute(pa, i + 2);
        if (ray.intersectTriangle(tri[0], tri[1], tri[2], false, hit)) {
          const d = hit.distanceTo(ray.origin);
          if (!best || d < best.d) best = { d, p: hit.clone(), n: new THREE.Vector3().subVectors(tri[1], tri[0]).cross(new THREE.Vector3().subVectors(tri[2], tri[0])).normalize() };
        }
      }
    }
    if (best && best.n.dot(dir) > 0) best.n.negate();
    return best;
  };
  const vein = (pts, dirFn, w0, w1, geos, side = true, step = 0.03) => {
    // densify
    const dense = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const n = Math.max(1, Math.ceil(pts[i].distanceTo(pts[i - 1]) / step));
      for (let k = 1; k <= n; k++) dense.push(pts[i - 1].clone().lerp(pts[i], k / n));
    }
    const hits = dense.map((p) => project(p, dirFn(p), geos)).filter(Boolean);
    for (let i = 0; i < hits.length - 1; i++) {
      const A = hits[i], B = hits[i + 1];
      const n = A.n.clone().add(B.n).normalize();
      const along = new THREE.Vector3().subVectors(B.p, A.p);
      const len = along.length(); along.normalize();
      const q = [];
      for (const [P, t] of [[A.p, i / (hits.length - 1)], [B.p, (i + 1) / (hits.length - 1)]]) {
        const w = w0 + (w1 - w0) * t;
        const perp = along.clone().cross(n).normalize().multiplyScalar(w);
        const P2 = P.clone().addScaledVector(along, (P === A.p ? -1 : 1) * Math.min(w, len * 0.3));
        for (const s of [-1, 1]) for (const d of [0.007, -0.022]) q.push(P2.clone().addScaledVector(perp, s).addScaledVector(n, d));
      }
      (side ? S : C).push(lava(hull(q)));
    }
  };

  // ================= LAVA CORES (glow through every gap between the boulders) =================
  C.push(coreP(hull([
    ...ring(V(0, 0.29, -0.07), 0.13, 0.1, 8, 'y'),
    ...ring(V(0, 0.46, 0.0), 0.2, 0.15, 8, 'y'),
    ...ring(V(0, 0.64, 0.03), 0.22, 0.16, 8, 'y'),
    ...ring(V(0, 0.74, 0.06), 0.16, 0.12, 8, 'y'),
  ])));
  // arm and leg cores
  const AS = V(0.3, 0.66, 0.02), AE = V(0.405, 0.42, 0.075), AW = V(0.375, 0.17, 0.16);
  S.push(coreP(tube(curveSamples([AS, AE, AW], 5, () => 0.05), { seg: 6, capStart: 0.02, capEnd: 0.02 })));
  S.push(coreP(blob(0, AE, V(0.07, 0.065, 0.07))));
  S.push(coreP(blob(0, V(0.29, 0.69, 0.0), V(0.11, 0.06, 0.11))));
  const LH = V(0.13, 0.36, -0.09), LK = V(0.155, 0.205, -0.085), LA = V(0.16, 0.08, -0.08);
  S.push(coreP(tube(curveSamples([LH, LK, LA], 4, () => 0.055), { seg: 6, capStart: 0.02, capEnd: 0.02 })));
  S.push(coreP(blob(0, LK, V(0.08, 0.05, 0.08))));

  // ================= TORSO BOULDERS (gaps between them show the lava core) =================
  const pecs = add(cragPts(V(0.115, 0.585, 0.085), V(0.105, 0.09, 0.125), 14, 11, { jag: 0.15 }), true);
  add(cragPts(V(0, 0.42, 0.04), V(0.15, 0.095, 0.12), 12, 12, { sym: true, jag: 0.12, rot: [0.15, 0, 0] }), false, SW.rock2);       // belly stone
  add(cragPts(V(0.17, 0.47, 0.0), V(0.065, 0.08, 0.1), 11, 13, { rot: [0, 0, 0.3] }), true, SW.rock2);       // flank
  add(cragPts(V(0, 0.32, -0.08), V(0.17, 0.07, 0.12), 9, 14, { sym: true, jag: 0.18 }), false);                // pelvis
  const back = add(cragPts(V(0.11, 0.64, -0.1), V(0.11, 0.12, 0.09), 13, 15, { rot: [0.15, 0, -0.1] }), true, SW.rock2);
  add(cragPts(V(0.085, 0.44, -0.12), V(0.085, 0.07, 0.08), 11, 16), true);

  // ================= SHOULDERS (massive tilted boulders, lava between) =================
  const shTop = add(cragPts(V(0.27, 0.78, -0.02), V(0.12, 0.09, 0.13), 14, 21, { rot: [0.1, 0.2, -0.35], jag: 0.2 }), true);
  add(cragPts(V(0.32, 0.625, 0.03), V(0.1, 0.075, 0.1), 12, 22, { rot: [0, 0, -0.5] }), true, SW.rock2);

  // ================= ARMS (bent gorilla arms: out to the elbow, in to the knuckles) =================
  add(segPts(V(0.33, 0.6, 0.035), V(0.4, 0.465, 0.065), 0.075, 0.068, 31), true);                               // upper arm
  const fore = add(segPts(V(0.403, 0.37, 0.09), V(0.375, 0.2, 0.155), 0.08, 0.112, 32, { per: 7, jag: 0.16 }), true, SW.rock2);
  // fist: flat on the knuckles
  const F = V(0.37, 0.0, 0.185);
  add([...cragPts(V(F.x, 0.085, F.z), V(0.12, 0.085, 0.11), 13, 33, { floor: 0, jag: 0.18 }),
    V(F.x - 0.1, 0, F.z - 0.08), V(F.x + 0.1, 0, F.z - 0.08), V(F.x - 0.1, 0, F.z + 0.08), V(F.x + 0.1, 0, F.z + 0.08)], true);
  for (const [i, dx] of [-0.07, -0.024, 0.024, 0.07].entries())
    add(cbox(V(F.x + dx, 0.042 + 0.006 * (i % 2), F.z + 0.1 - 0.008 * (i % 2)), 0.023, 0.042 + 0.006 * (i % 2), 0.028, 0.012), true);

  // ================= LEGS (short and thick) =================
  add(segPts(V(0.13, 0.37, -0.09), V(0.15, 0.245, -0.09), 0.108, 0.098, 51), true, SW.rock2);                    // thigh
  add(segPts(V(0.158, 0.175, -0.085), V(0.16, 0.075, -0.08), 0.09, 0.102, 52), true);                            // shin
  const FT = V(0.163, 0, -0.06);
  add([...cragPts(V(FT.x, 0.04, FT.z), V(0.105, 0.045, 0.115), 11, 53, { floor: 0, jag: 0.15 }),
    V(FT.x - 0.09, 0, FT.z - 0.1), V(FT.x + 0.09, 0, FT.z - 0.1), V(FT.x - 0.09, 0, FT.z + 0.09), V(FT.x + 0.09, 0, FT.z + 0.09)], true, SW.rock2);
  for (const [i, dx] of [-0.058, 0, 0.058].entries())
    add(cbox(V(FT.x + dx, 0.03, FT.z + 0.115), 0.026, 0.03, 0.032, 0.012), true);

  // ================= HEAD (craggy skull, flat face plane, jutting brow, chunky jaw) =================
  const H = { y: 0.775, z: 0.14 }, FZ = H.z + 0.15;
  const hs = [ // right half; mirrored below
    V(0.15, H.y + 0.075, FZ), V(0.16, H.y - 0.06, FZ), V(0.0, H.y + 0.085, FZ), V(0.0, H.y - 0.06, FZ),
    V(0.12, H.y + 0.15, H.z + 0.06), V(0.05, H.y + 0.168, H.z - 0.02), V(0.135, H.y + 0.125, H.z - 0.085), V(0.0, H.y + 0.175, H.z + 0.03),
    V(0.19, H.y + 0.045, H.z + 0.06), V(0.185, H.y - 0.05, H.z - 0.02), V(0.168, H.y + 0.085, H.z - 0.095),
    V(0.115, H.y - 0.02, H.z - 0.15), V(0.0, H.y + 0.07, H.z - 0.15), V(0.06, H.y - 0.09, H.z - 0.13),
    V(0.14, H.y - 0.115, H.z + 0.07), V(0.1, H.y - 0.12, H.z - 0.06),
    V(0.178, H.y + 0.02, FZ - 0.035), V(0.145, H.y + 0.125, FZ - 0.04),
  ];
  const skull = add([...hs, ...hs.filter((p) => p.x > 0).map((p) => V(-p.x, p.y, p.z))], false);
  // craggy skull add-ons: crown boulder and cheek crags break up the cube, with lava glowing between
  C.push(coreP(blob(0, V(0, H.y + 0.155, H.z - 0.04), V(0.06, 0.035, 0.09))));
  add(cragPts(V(0.075, H.y + 0.16, H.z - 0.04), V(0.07, 0.04, 0.095), 10, 72, { rot: [0.1, 0, -0.3], jag: 0.15 }), true, SW.rock2);
  add(cragPts(V(0.165, H.y - 0.06, H.z + 0.04), V(0.045, 0.06, 0.08), 9, 73, { rot: [0, 0, 0.3], jag: 0.15 }), true, SW.rock2);
  // lava mouth glowing out of the gap between skull and jaw
  C.push(paint(hull(cbox(V(0, H.y - 0.078, FZ - 0.06), 0.088, 0.016, 0.04, 0.006)), SW.lavaCore, 'flat'));
  // chunky jutting jaw
  add(cragPts(V(0, H.y - 0.125, FZ - 0.055), V(0.145, 0.05, 0.058), 11, 71, { sym: true, jag: 0.12 }), false, SW.rock2);
  // brow ridge: heavy, jutting, jagged, slanting down to the centre
  const E = V(0.085, H.y + 0.02, 0), k = 1.38;
  S.push(tone(hull([
    V(0.0, E.y + 0.012, FZ + 0.06), V(0.0, E.y + 0.072, FZ + 0.042), V(0.09, E.y + 0.11, FZ + 0.035),
    V(0.182, E.y + 0.07, FZ + 0.018), V(0.188, E.y + 0.12, FZ - 0.01),
    V(0.0, E.y + 0.012, FZ - 0.03), V(0.0, E.y + 0.085, FZ - 0.045),
    V(0.185, E.y + 0.065, FZ - 0.06), V(0.18, E.y + 0.125, FZ - 0.075),
  ]), SW.brow));

  // eyes: white almond with glowing orange rim, big pupil, catchlight
  const sc = (pts, kk = k) => pts.map(([u, v]) => [u * kk, v * kk]);
  const almond = [[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]];
  S.push(paint(hull(plate(sc(almond, 1.56), V(E.x + 0.002, E.y - 0.002, 0), FZ - 0.01, FZ + 0.006)), SW.rim, 'flat'));
  S.push(paint(hull(plate(sc(almond), E, FZ - 0.01, FZ + 0.012)), SW.white, 'flat'));
  S.push(paint(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.005, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.006, E.y + 0.004, 0), FZ + 0.014, FZ + 0.022)), SW.white, 'flat'));

  // ================= HORNS (big curved obsidian, lava tips) =================
  const hornPts = [V(0.13, H.y + 0.1, H.z - 0.02), V(0.24, H.y + 0.11, H.z - 0.03), V(0.31, H.y + 0.16, H.z - 0.02),
    V(0.33, H.y + 0.23, H.z + 0.0), V(0.3, H.y + 0.285, H.z + 0.03)];
  S.push(paint(tube(curveSamples(hornPts, 7, (t) => 0.078 - 0.058 * t, (t) => 0.07 - 0.052 * t), { seg: 6, axis: V(0, 0, 1), capEnd: 0.0, phase: Math.PI / 6 }), SW.horn, 'len'));
  S.push(lava(shard(V(0.302, H.y + 0.28, H.z + 0.03), V(-0.35, 0.8, 0.45), 0.02, 0.065, 4)));

  // ================= OBSIDIAN CRYSTAL SHARDS (shoulders and back) =================
  const obs = (b, d, w, l) => {
    d = d.clone().normalize();
    const up = Math.abs(d.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
    const a = new THREE.Vector3().crossVectors(d, up).normalize(), c = new THREE.Vector3().crossVectors(a, d).normalize();
    const pts = [b.clone().addScaledVector(d, l)];
    for (const [f, r] of [[-0.075, 1], [0.6, 0.95]]) for (let i = 0; i < 6; i++) {
      const t = (i / 6) * Math.PI * 2 + Math.PI / 6;
      pts.push(b.clone().addScaledVector(d, l * f).addScaledVector(a, Math.cos(t) * w * r).addScaledVector(c, Math.sin(t) * w * r));
    }
    const g = hull(pts); g.computeBoundingBox();
    return paint(g, SW.obsidian, 'y', [g.boundingBox.min.y, g.boundingBox.max.y]);
  };
  for (const [b, d, w, l] of [
    [V(0.26, 0.84, -0.04), V(0.15, 1, -0.15), 0.042, 0.17],
    [V(0.31, 0.82, 0.0), V(0.8, 1, 0.15), 0.032, 0.12],
    [V(0.22, 0.83, -0.1), V(0.0, 0.8, -0.7), 0.032, 0.12],
    [V(0.34, 0.77, -0.07), V(1, 0.5, -0.5), 0.028, 0.09],
    [V(0.09, 0.72, -0.17), V(0.3, 0.8, -1), 0.036, 0.14],
  ]) S.push(obs(b, d, w, l));
  C.push(obs(V(0, 0.66, -0.18), V(0, 0.45, -1), 0.04, 0.14));
  C.push(obs(V(0, 0.79, -0.12), V(0, 1, -0.8), 0.036, 0.12));

  // ================= MOLTEN STERNUM RUNE + BRANCHING LAVA VEINS =================
  const PZ = 0.2;
  C.push(paint(hull(plate([[0, 0.06], [0.042, 0], [0, -0.06], [-0.042, 0]], V(0, 0.565, 0), PZ - 0.06, PZ + 0.015)), SW.lava, 'y', [0.53, 0.65]));
  C.push(paint(hull(plate([[0, 0.032], [0.022, 0], [0, -0.032], [-0.022, 0]], V(0, 0.565, 0), PZ, PZ + 0.024)), SW.hot, 'flat'));
  const fwd = () => V(0, 0, -1), bk = () => V(0, 0, 1), down = () => V(0, -1, 0);
  // chest: thick trunks from the gem branching up to the shoulder and down to the flank
  vein([V(0.03, 0.580, 0.3), V(0.075, 0.605, 0.3), V(0.1, 0.590, 0.3), V(0.14, 0.625, 0.3), V(0.18, 0.640, 0.3)], fwd, 0.014, 0.004, [pecs]);
  vein([V(0.1, 0.590, 0.3), V(0.12, 0.555, 0.3), V(0.165, 0.540, 0.3), V(0.19, 0.510, 0.3)], fwd, 0.009, 0.003, [pecs]);
  vein([V(0.03, 0.545, 0.3), V(0.07, 0.525, 0.3), V(0.085, 0.510, 0.3)], fwd, 0.01, 0.003, [pecs]);
  const belly = rockG[1];
  vein([V(0.012, 0.52, 0.3), V(0.035, 0.48, 0.3), V(0.02, 0.44, 0.3), V(0.06, 0.4, 0.3), V(0.05, 0.36, 0.3)], fwd, 0.011, 0.004, [belly]);
  vein([V(0.02, 0.44, 0.3), V(0.1, 0.43, 0.3), V(0.13, 0.4, 0.3)], fwd, 0.007, 0.003, [belly]);
  // back: big branching crack across the back slab
  vein([V(0.03, 0.74, -0.4), V(0.07, 0.69, -0.4), V(0.06, 0.64, -0.4), V(0.11, 0.59, -0.4), V(0.1, 0.54, -0.4)], bk, 0.013, 0.004, [back]);
  vein([V(0.07, 0.69, -0.4), V(0.12, 0.7, -0.4), V(0.17, 0.67, -0.4)], bk, 0.008, 0.003, [back]);
  // shoulder top: crack splitting the boulder
  vein([V(0.2, 0.9, 0.06), V(0.25, 0.9, 0.03), V(0.28, 0.9, -0.01), V(0.33, 0.9, 0.0), V(0.37, 0.9, -0.05)], down, 0.012, 0.004, [shTop]);
  // forearm: thick molten vein running down the front-outer face, with a branch
  const toFore = (p) => {
    const a = V(0.403, 0.37, 0.09), b = V(0.375, 0.2, 0.155), ab = new THREE.Vector3().subVectors(b, a);
    const t = THREE.MathUtils.clamp(new THREE.Vector3().subVectors(p, a).dot(ab) / ab.lengthSq(), 0, 1);
    return a.clone().addScaledVector(ab, t).sub(p);
  };
  vein([V(0.47, 0.37, 0.19), V(0.5, 0.32, 0.21), V(0.47, 0.28, 0.25), V(0.51, 0.24, 0.27), V(0.49, 0.2, 0.3)], toFore, 0.013, 0.005, [fore]);
  vein([V(0.47, 0.28, 0.25), V(0.43, 0.25, 0.3), V(0.4, 0.22, 0.32)], toFore, 0.008, 0.003, [fore]);
  // skull: crack from the crown down the side of the head
  vein([V(0.4, H.y + 0.05, H.z + 0.0), V(0.4, H.y + 0.0, H.z - 0.03), V(0.4, H.y - 0.02, H.z - 0.08), V(0.4, H.y - 0.07, H.z - 0.1)], () => V(-1, 0, 0), 0.01, 0.004, [skull]);

  return assemble(C, S);
}

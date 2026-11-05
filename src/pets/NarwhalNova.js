// Narwhal Nova (DIVINE, Round 8 – Ocean Octagon): pale blue faceted narwhal standing on chunky fin-legs and
// planted tail flukes, glowing spiral horn, white star markings, golden halo, radiant wings, glowing gold armour,
// coral + pearl accents, glossy wet sheen.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  body:   { i: 0, top: '#D8F0FF', bot: '#4F9BE8' },
  belly:  { i: 1, top: '#EAF8FF', bot: '#B8DDF5' },
  sheen:  { i: 2, top: '#F2FBFF', bot: '#DDF2FF' },
  gold:   { i: 3, top: '#FFE27A', bot: '#E09A00' },
  eye:    { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  brow:   { i: 6, top: '#6FB0EA', bot: '#3A78C0' },
  horn:   { i: 7, top: '#FFD95A', bot: '#45D2F2', glow: true },
  star:   { i: 8, top: '#FFFFFF', bot: '#F4FBFF' },
  feather:{ i: 9, top: '#FFE680', bot: '#FFB82E', glow: true },
  aura:   { i: 10, top: '#8FE6FF', bot: '#2FB8E8', glow: true },
  pearl:  { i: 11, top: '#FFFFFF', bot: '#EBD6E8' },
  coral:  { i: 12, top: '#FFA27A', bot: '#FF5468' },
  mouth:  { i: 13, top: '#2C3E62', bot: '#1A2440' },
  goldGl: { i: 14, top: '#FFE680', bot: '#FFB300', glow: true },
  flip:   { i: 15, top: '#B5E0FF', bot: '#4F9BE8' },
};
const SW = PALETTE;

// ---------- helpers ----------
const swUV = (sw, t) => {
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  return [(x + 64) / 1024, (y + 16 + THREE.MathUtils.clamp(t, 0, 1) * 96) / 1024];
};
// per-facet painting: fn(normal, centroid) -> [swatch, t]
function facetPaint(g, fn) {
  const p = g.attributes.position, uv = [];
  const a = V(0, 0, 0), b = V(0, 0, 0), c = V(0, 0, 0);
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const ctr = a.clone().add(b).add(c).divideScalar(3);
    for (const v of [a, b, c]) {
      const [sw, t] = fn(n, ctr, v);
      uv.push(...swUV(sw, t));
    }
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}
const LGT = V(0, 0.82, 0.57).normalize();
// pale-blue skin: paler belly facets, glossy wet sheen on up-facing facets
const skin = (g, lo = 0.1, hi = 0.85, bellyY = -0.6) => facetPaint(g, (n, ctr, v) => {
  if (n.y < bellyY) return [SW.belly, 0.2 + 0.6 * (1 - (v.y - lo) / (hi - lo))];
  if (n.dot(LGT) > 0.88) return [SW.sheen, 0.3];
  return [SW.body, 1 - (v.y - lo) / (hi - lo)];
});

const ray = new THREE.Raycaster();
// surface hit on geometry g from origin along dir -> {p, n}
function hit(g, origin, dir) {
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  ray.set(origin, dir.clone().normalize());
  const h = ray.intersectObject(m)[0];
  if (!h) return null;
  return { p: h.point.clone(), n: h.face.normal.clone() };
}

// basis for a decal plate at p with normal n
function basis(n) {
  const up = Math.abs(n.y) > 0.9 ? V(0, 0, 1) : V(0, 1, 0);
  const u = new THREE.Vector3().crossVectors(up, n).normalize();
  const v = new THREE.Vector3().crossVectors(n, u).normalize();
  return { u, v };
}
// 5-point star plate on the surface (back embedded, face >= 0.006 off the surface)
function star(out, p, n, r, rot = 0) {
  const { u, v } = basis(n);
  const P = (x, y, d) => p.clone().addScaledVector(u, x).addScaledVector(v, y).addScaledVector(n, d);
  const ri = r * 0.45, d0 = -0.012, d1 = 0.008;
  const inner = [], outer = [];
  for (let k = 0; k < 5; k++) {
    const ao = rot + Math.PI / 2 + (2 * Math.PI * k) / 5, ai = ao + Math.PI / 5;
    outer.push([Math.cos(ao) * r, Math.sin(ao) * r]);
    inner.push([Math.cos(ai) * ri, Math.sin(ai) * ri]);
  }
  const ctrPts = [];
  for (const [x, y] of inner) { ctrPts.push(P(x, y, d0), P(x, y, d1)); }
  out.push(paint(hull(ctrPts), SW.star, 'flat'));
  for (let k = 0; k < 5; k++) {
    const a = inner[(k + 4) % 5], b = inner[k], o = outer[k];
    out.push(paint(hull([P(a[0], a[1], d0), P(a[0], a[1], d1), P(b[0], b[1], d0), P(b[0], b[1], d1),
      P(o[0], o[1], d0), P(o[0], o[1], d1 - 0.002)]), SW.star, 'flat'));
  }
}

// flat feather blade (from star_pegasus)
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
function yaw(pts, pivot, a) {
  const q = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), a);
  return pts.map((p) => p.clone().sub(pivot).applyQuaternion(q).add(pivot));
}

export function buildGeometry() {
  const C = [], S = [];
  const gold = (g, mode = 'y') => paint(g, SW.gold, mode);     // shaded armour gold
  const glowG = (g, mode = 'y') => paint(g, SW.goldGl, mode);  // glowing gold trim

  // ================= BODY (round, chunky whale barrel, nose +Z) =================
  const bodyG = hull([
    ...ring(V(0, 0.42, -0.4), 0.13, 0.125, 12, 'z'),
    ...ring(V(0, 0.44, -0.28), 0.225, 0.215, 12, 'z'),
    ...ring(V(0, 0.45, -0.1), 0.27, 0.255, 12, 'z'),
    ...ring(V(0, 0.5, 0.06), 0.275, 0.26, 12, 'z'),
    ...ring(V(0, 0.58, 0.2), 0.25, 0.25, 12, 'z'),
  ]);
  C.push(skin(bodyG, 0.0, 0.9));

  // ================= HEAD (big blunt melon) =================
  const H = { y: 0.93, z: 0.31 };
  const headG = hull([
    ...ring(V(0, H.y - 0.19, H.z - 0.02), 0.17, 0.15, 10, 'y'),
    ...ring(V(0, H.y - 0.08, H.z + 0.01), 0.245, 0.225, 10, 'y'),
    ...ring(V(0, H.y + 0.07, H.z + 0.0), 0.25, 0.225, 10, 'y'),
    ...ring(V(0, H.y + 0.18, H.z - 0.02), 0.2, 0.175, 10, 'y'),
    ...ring(V(0, H.y + 0.235, H.z - 0.03), 0.11, 0.095, 8, 'y'),
    ...ring(V(0, H.y + 0.0, H.z + 0.255), 0.12, 0.13, 10, 'z', 0),
  ]);
  C.push(skin(headG, 0.55, 1.15, -0.75));
  // thick neck filling the head/body seam
  C.push(skin(hull([...ring(V(0, 0.6, 0.12), 0.235, 0.2, 10, 'y'), ...ring(V(0, 0.8, 0.27), 0.2, 0.17, 10, 'y')]), 0.4, 1.1));

  // ---- eyes on the face, yawed to the surface ----
  const eh = hit(headG, V(0.125, H.y + 0.045, 1.5), V(0, 0, -1));
  const FZ = eh.p.z, E = V(0.125, H.y + 0.045, FZ);
  const ey = Math.atan2(eh.n.x, eh.n.z) * 0.85;
  const ES = 1.62;
  const eyeP = (pts, z0, z1, c = E) => yaw(plate(pts.map(([u, v]) => [u * ES, v * ES]), V(E.x + (c.x - E.x) * ES, E.y + (c.y - E.y) * ES, 0), z0, z1), E, ey);
  S.push(paint(hull(eyeP([[-0.042, 0.002], [0.044, 0.032], [0.05, -0.008], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]],
    FZ - 0.045, FZ + 0.012)), SW.white, 'flat'));
  S.push(paint(hull(eyeP([[-0.028, 0.004], [0.016, 0.019], [0.023, -0.006], [0.005, -0.031], [-0.021, -0.029], [-0.032, -0.011]],
    FZ + 0.0, FZ + 0.019, V(E.x - 0.002, E.y, 0))), SW.eye, 'flat'));
  S.push(paint(hull(eyeP([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    FZ + 0.014, FZ + 0.025, V(E.x + 0.006, E.y + 0.003, 0))), SW.white, 'flat'));
  // heavy brow ridge slanting down to the centre
  S.push(paint(hull(yaw([
    V(0.035, E.y + 0.016, FZ + 0.04), V(0.037, E.y + 0.064, FZ + 0.03),
    V(0.225, E.y + 0.074, FZ - 0.01), V(0.225, E.y + 0.122, FZ - 0.025),
    V(0.035, E.y + 0.016, FZ - 0.06), V(0.037, E.y + 0.072, FZ - 0.07),
    V(0.225, E.y + 0.074, FZ - 0.08), V(0.225, E.y + 0.122, FZ - 0.09),
  ], E, ey)), SW.brow, 'y'));
  // mouth: determined flat line with downturned corners
  const mh = hit(headG, V(0, H.y - 0.11, 1.5), V(0, 0, -1));
  const MZ = mh.p.z, MY = H.y - 0.11;
  C.push(paint(hull(cbox(V(0, MY, MZ - 0.004), 0.06, 0.006, 0.012, 0.002)), SW.mouth, 'flat'));
  S.push(paint(hull([V(0.055, MY + 0.004, MZ + 0.004), V(0.055, MY - 0.006, MZ + 0.004),
    V(0.1, MY - 0.016, MZ - 0.03), V(0.1, MY - 0.024, MZ - 0.03),
    V(0.055, MY - 0.001, MZ - 0.02), V(0.1, MY - 0.02, MZ - 0.05)]), SW.mouth, 'flat'));

  // ================= SPIRAL HORN (glowing, centre line, forward/up) =================
  const hb = V(0, H.y + 0.15, H.z + 0.17), hd = V(0, 0.62, 0.78).normalize(), HL = 0.7;
  const NB = 11, hu = V(1, 0, 0), hv = new THREE.Vector3().crossVectors(hd, hu).normalize();
  const hRing = (c, r, rot) => {
    const pts = [];
    for (let k = 0; k < 5; k++) {
      const a = rot + (2 * Math.PI * k) / 5;
      const rr = r * (k === 0 ? 1.18 : 1); // raised ridge corner that spirals up
      pts.push(c.clone().addScaledVector(hu, Math.cos(a) * rr).addScaledVector(hv, Math.sin(a) * rr));
    }
    return pts;
  };
  for (let i = 0; i < NB; i++) {
    const t0 = i / NB, t1 = (i + 1) / NB;
    const r0 = 0.07 * (1 - t0) + 0.006, r1 = 0.07 * (1 - t1) + 0.006;
    const c0 = hb.clone().addScaledVector(hd, t0 * HL), c1 = hb.clone().addScaledVector(hd, t1 * HL + 0.012);
    const pts = i === NB - 1
      ? [...hRing(c0, r0, i * 0.62), hb.clone().addScaledVector(hd, HL + 0.06)]
      : [...hRing(c0, r0, i * 0.62), ...hRing(c1, r1 * 0.82, i * 0.62 + 0.45)];
    const tt = (i + 0.5) / NB;
    C.push(facetPaint(hull(pts), () => [SW.horn, tt]));
  }
  // glowing gold horn collar + forehead crest
  C.push(glowG(hull([...ring(hb.clone().addScaledVector(hd, -0.02), 0.082, 0.082, 8, 'y', 0),
    ...ring(hb.clone().addScaledVector(hd, 0.045), 0.074, 0.074, 8, 'y', 0)])));
  C.push(gold(hull([V(0, H.y + 0.1, H.z + 0.235), V(0.085, H.y + 0.14, H.z + 0.15), V(-0.085, H.y + 0.14, H.z + 0.15),
    V(0, H.y + 0.225, H.z + 0.06), V(0, H.y + 0.18, H.z + 0.08),
    V(0.07, H.y + 0.1, H.z + 0.15), V(-0.07, H.y + 0.1, H.z + 0.15)])));

  // ================= HALO (big floating gold ring above the head) =================
  const HC = V(0, H.y + 0.45, H.z - 0.1), HR = 0.21, NHalo = 18;
  const tilt = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), 0.42);
  const hp = (a, dr, dy) => V(Math.sin(a) * (HR + dr), dy, Math.cos(a) * (HR + dr)).applyQuaternion(tilt).add(HC);
  for (let k = 0; k < NHalo; k++) {
    const a0 = (2 * Math.PI * k) / NHalo, a1 = (2 * Math.PI * (k + 1)) / NHalo;
    const pts = [];
    for (const a of [a0, a1]) pts.push(hp(a, -0.027, 0), hp(a, 0.027, 0), hp(a, 0, 0.024), hp(a, 0, -0.024));
    C.push(glowG(hull(pts), 'flat'));
  }
  C.push(paint(blob(0, hp(0, 0, 0.028), V(0.026, 0.026, 0.026)), SW.pearl, 'y'));
  S.push(paint(blob(0, hp(Math.PI / 2, 0, 0.028), V(0.022, 0.022, 0.022)), SW.pearl, 'y'));
  C.push(paint(blob(0, hp(Math.PI, 0, 0.028), V(0.022, 0.022, 0.022)), SW.pearl, 'y'));

  // ================= GOLD ARMOUR =================
  // gorget: one faceted V-pointed gold plate wrapping the upper chest under the jaw
  const gF = [[0, 0.73, 0.4], [0.13, 0.74, 0.36], [0.225, 0.7, 0.25], [0.205, 0.58, 0.29], [0.1, 0.5, 0.35], [0, 0.42, 0.38]];
  const gPts = [];
  for (const [x, y, z] of gF) for (const sx of x ? [1, -1] : [1]) {
    gPts.push(V(sx * x, y, z), V(sx * x * 0.85, y + 0.01, z - 0.1));
  }
  C.push(gold(hull(gPts)));
  C.push(paint(blob(0, V(0, 0.575, 0.392), V(0.036, 0.036, 0.026)), SW.pearl, 'y'));
  // thin glowing trim along the V edge
  const trim = (a, b) => {
    const pts = [];
    for (const q of [a, b]) for (const dy of [-0.018, 0.008]) for (const dz of [-0.04, 0.012]) pts.push(V(q[0], q[1] + dy, q[2] + dz));
    S.push(glowG(hull(pts)));
  };
  trim([0.21, 0.575, 0.288], [0.1, 0.495, 0.352]);
  trim([0.1, 0.495, 0.352], [0, 0.415, 0.382]);
  // dorsal ridge plates along the spine
  for (const [z, w, h] of [[0.04, 0.11, 0.05], [-0.13, 0.1, 0.045], [-0.29, 0.08, 0.036]]) {
    const top = hit(bodyG, V(0, 2, z), V(0, -1, 0)).p.y;
    C.push(gold(hull([
      ...cbox(V(0, top - 0.02, z), w, 0.03, 0.065, 0.012),
      V(0, top + h, z + 0.03), V(0, top + h, z - 0.065),
    ])));
  }

  // ================= STAR MARKINGS (white, mirrored) =================
  for (const [y, z, r, rot] of [[0.58, -0.04, 0.075, 0.2], [0.44, -0.21, 0.062, -0.3], [0.66, -0.2, 0.05, 0.5],
    [0.42, 0.04, 0.05, 0.0], [0.52, -0.36, 0.045, 0.4]]) {
    const h = hit(bodyG, V(1, y, z), V(-1, 0, 0));
    if (h) star(S, h.p, h.n, r, rot);
  }
  for (const [y, z, r, rot] of [[H.y - 0.04, H.z + 0.07, 0.05, 0.1], [H.y + 0.13, H.z - 0.06, 0.042, -0.25]]) {
    const h = hit(headG, V(1, y, z), V(-1, 0, 0));
    star(S, h.p, h.n, r, rot);
  }

  // ================= FIN-LEGS (short stout flippers, paddles planted) =================
  S.push(skin(hull([
    ...ring(V(0.19, 0.44, 0.13), 0.155, 0.18, 8),
    ...ring(V(0.2, 0.22, 0.145), 0.13, 0.15, 8),
    ...ring(V(0.205, 0.06, 0.155), 0.115, 0.13, 8),
  ]), 0, 0.6));
  // paddle: leaf-shaped flipper lying flat, pointing forward/out
  const fa = V(0.22, 0, 1).normalize(), fbv = V(fa.z, 0, -fa.x), F0 = V(0.205, 0, 0.15);
  const fp = (u, v, y) => F0.clone().addScaledVector(fa, u).addScaledVector(fbv, v).setY(y);
  const leaf = [[-0.12, 0], [-0.08, 0.13], [0.06, 0.155], [0.19, 0.11], [0.27, 0.0], [0.19, -0.11], [0.06, -0.155], [-0.08, -0.13]];
  const fpts = [];
  for (const [u, v] of leaf) fpts.push(fp(u, v, 0), fp(u, v, 0.03));
  fpts.push(fp(0, 0, 0.08), fp(0.1, 0, 0.06), fp(0.0, 0.08, 0.065), fp(0.0, -0.08, 0.065));
  S.push(facetPaint(hull(fpts), (n, c) => [SW.flip, n.y > 0.8 ? 0.15 : 0.6]));
  // glowing gold wrist cuff + armour pauldron
  S.push(glowG(hull([...ring(V(0.205, 0.085, 0.155), 0.128, 0.143, 8), ...ring(V(0.204, 0.145, 0.152), 0.133, 0.148, 8)])));
  S.push(gold(hull([
    ...ring(V(0.2, 0.5, 0.13), 0.15, 0.17, 8),
    ...ring(V(0.21, 0.38, 0.14), 0.168, 0.19, 8),
    V(0.3, 0.52, 0.13),
  ])));
  S.push(gold(shard(V(0.31, 0.5, 0.13), V(1, 0.7, -0.15), 0.04, 0.09)));
  S.push(paint(blob(0, V(0.385, 0.4, 0.15), V(0.027, 0.027, 0.027)), SW.pearl, 'y'));
  // coral branches growing from the shoulder
  const coral = (b, d, r, l) => {
    const e = b.clone().addScaledVector(d.clone().normalize(), l);
    S.push(paint(tube(curveSamples([b, e], 3, (t) => r * (1 - 0.4 * t)), { seg: 5, capEnd: r * 0.9 }), SW.coral, 'len'));
    return e;
  };
  const cb = V(0.26, 0.52, 0.0);
  const c1 = coral(cb, V(0.35, 1, -0.3), 0.038, 0.17);
  coral(c1.clone().add(V(0, -0.02, 0)), V(0.9, 0.7, -0.1), 0.022, 0.09);
  coral(c1.clone().add(V(0, -0.02, 0)), V(-0.3, 1, -0.5), 0.02, 0.09);
  const c2 = coral(cb.clone().add(V(0.02, 0.0, 0.02)), V(1, 0.5, -0.15), 0.03, 0.15);
  coral(c2.clone().add(V(-0.01, 0, 0)), V(0.6, 1, 0.3), 0.019, 0.08);
  coral(cb.clone().add(V(0.0, 0.03, -0.03)), V(0.4, 0.8, -1), 0.026, 0.12);

  // ================= TAIL + FLUKES (thick base sweeping back/down to planted flukes) =================
  C.push(skin(tube(curveSamples([V(0, 0.45, -0.28), V(0, 0.39, -0.5), V(0, 0.25, -0.67), V(0, 0.1, -0.77)], 8,
    (t) => 0.2 - 0.135 * t, (t) => 0.19 - 0.125 * t), { seg: 10, axis: V(1, 0, 0), capEnd: 0.02 }), -0.35, 0.8));
  C.push(glowG(hull([...ring(V(0, 0.1, -0.755), 0.083, 0.075, 8, 'y'), ...ring(V(0, 0.165, -0.735), 0.088, 0.08, 8, 'y')])));
  const FK = -0.08;
  S.push(skin(hull([
    V(0.02, 0, -0.66 + FK), V(0.02, 0.08, -0.68 + FK), V(0.02, 0, -0.8 + FK), V(0.02, 0.065, -0.78 + FK),
    V(0.18, 0, -0.69 + FK), V(0.18, 0.045, -0.71 + FK),
    V(0.33, 0, -0.81 + FK), V(0.33, 0.028, -0.81 + FK),
    V(0.3, 0, -0.9 + FK), V(0.3, 0.024, -0.895 + FK),
    V(0.13, 0, -0.88 + FK), V(0.13, 0.038, -0.87 + FK),
  ]), 0, 0.3));
  S.push(glowG(hull([V(0.03, 0, -0.79 + FK), V(0.03, 0.055, -0.79 + FK), V(0.13, 0, -0.88 + FK), V(0.13, 0.042, -0.875 + FK),
    V(0.3, 0, -0.905 + FK), V(0.3, 0.03, -0.9 + FK), V(0.03, 0, -0.815 + FK), V(0.13, 0, -0.905 + FK), V(0.3, 0, -0.925 + FK),
    V(0.03, 0.045, -0.81 + FK), V(0.13, 0.032, -0.9 + FK), V(0.3, 0.02, -0.92 + FK)])));

  // ================= RADIANT WINGS (broad fans swept back/out) =================
  const L0 = V(0.15, 0.66, -0.14), L1 = V(0.36, 0.87, -0.26), L2 = V(0.82, 1.02, -0.52);
  const wN = new THREE.Vector3().crossVectors(L2.clone().sub(L0), V(0.2, -0.5, -1)).normalize();
  if (wN.y < 0) wN.negate();
  const bN = wN.clone().add(V(0, 0.2, 0.25)).normalize();
  S.push(paint(tube(curveSamples([L0, L1, L2], 7, (t) => 0.07 - 0.03 * t, (t) => 0.04 - 0.015 * t),
    { seg: 6, ref: wN, capEnd: 0.05 }), SW.goldGl, 'y'));
  S.push(glowG(shard(L1.clone().add(V(0, 0.03, 0)), V(0.1, 1, 0.2), 0.035, 0.1)));
  S.push(glowG(shard(L2.clone(), V(0.8, 0.4, -0.3), 0.03, 0.1)));
  const edge = (t) => t < 0.35 ? L0.clone().lerp(L1, t / 0.35) : L1.clone().lerp(L2, (t - 0.35) / 0.65);
  const fdir = (t) => V(0.08 + 0.6 * t, -0.75 + 0.45 * t, -1 + 0.3 * t);
  const NP = 7;
  for (let i = 0; i < NP; i++) {
    const t = 0.12 + 0.88 * i / (NP - 1);
    S.push(paint(blade(edge(t).addScaledVector(wN, -0.016), fdir(t), bN, 0.11, 0.3 + 0.24 * t, 0.014), SW.feather, 'flat'));
  }
  const NC = 6;
  for (let i = 0; i < NC; i++) {
    const t = 0.1 + 0.85 * i / (NC - 1);
    S.push(paint(blade(edge(t).addScaledVector(wN, 0.012).addScaledVector(fdir(t).normalize(), 0.01), fdir(t), bN, 0.1,
      0.18 + 0.14 * t, 0.013), SW.aura, 'flat'));
    S.push(paint(blade(edge(t).addScaledVector(wN, -0.04).addScaledVector(fdir(t).normalize(), 0.01), fdir(t), bN, 0.1,
      0.2 + 0.16 * t, 0.013), SW.aura, 'flat'));
  }
  // gold scallop coverts along the arm
  for (let i = 0; i < 5; i++) {
    const t = 0.15 + 0.75 * i / 4;
    S.push(paint(blade(edge(t).addScaledVector(wN, 0.03), fdir(t), bN, 0.06, 0.09 + 0.04 * t, 0.012), SW.goldGl, 'flat'));
  }

  return assemble(C, S);
}

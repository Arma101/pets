// Spirit Frog (Secret, Round 6 - Swamp Slam): ghostly pale mint frog, purple glowing spots,
// floating spirit halo, moss + bog roots, floating spirit wisps.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  skin:   { i: 0, top: '#DDFCEC', bot: '#9FE2C6' },
  belly:  { i: 1, top: '#F6FFF9', bot: '#CBEFDD' },
  brow:   { i: 2, top: '#62B999', bot: '#3A8569' },
  rim:    { i: 3, top: '#2E6B58', bot: '#22503F' },
  eye:    { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  mouth:  { i: 6, top: '#2E5A4A', bot: '#1E3F33' },
  purple: { i: 7, top: '#A65CFF', bot: '#7A2EE8', glow: true },
  green:  { i: 8, top: '#86F24E', bot: '#3CC83C', glow: true },
  halo:   { i: 9, top: '#BC8CFF', bot: '#8A4BFF', glow: true },
  wisp:   { i: 10, top: '#62F0C8', bot: '#1FC79A', glow: true },
  moss:   { i: 11, top: '#93C452', bot: '#4E7E2C' },
  root:   { i: 12, top: '#8E6A45', bot: '#573C24' },
  toe:    { i: 13, top: '#C7F3DE', bot: '#86CFB0' },
};
const SW = PALETTE;

// ray-cast helper: find a point + face normal on a hull
const _rc = new THREE.Raycaster();
function surf(geo, origin, target) {
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  m.updateMatrixWorld();
  const dir = target.clone().sub(origin).normalize();
  _rc.set(origin, dir);
  const hit = _rc.intersectObject(m, false)[0];
  if (!hit) return null;
  return { p: hit.point.clone(), n: hit.face.normal.clone().normalize() };
}
// thin plate spot conforming to a hull face: each rim vertex is ray-cast back onto the surface
function spot(geo, h, r, sides = 6, rot = 0, out = 0.006) {
  if (!h) return null;
  const n = h.n;
  const up = Math.abs(n.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
  const a = new THREE.Vector3().crossVectors(n, up).normalize();
  const b = new THREE.Vector3().crossVectors(a, n).normalize();
  const pts = [h.p.clone().addScaledVector(n, out), h.p.clone().addScaledVector(n, -0.01)];
  for (let k = 0; k < sides; k++) {
    const t = rot + (2 * Math.PI * k) / sides;
    const q = h.p.clone().addScaledVector(a, Math.cos(t) * r).addScaledVector(b, Math.sin(t) * r);
    const hh = surf(geo, q.clone().addScaledVector(n, 0.1), q) || { p: q, n };
    pts.push(hh.p.clone().addScaledVector(hh.n, out), hh.p.clone().addScaledVector(n, -0.01));
  }
  return hull(pts);
}
// convex-hull inside test (geometry = non-indexed hull)
function inside(geo, p, eps = 0.003) {
  const pos = geo.attributes.position, A = V(0, 0, 0), B = V(0, 0, 0), Cc = V(0, 0, 0);
  for (let i = 0; i < pos.count; i += 3) {
    A.fromBufferAttribute(pos, i); B.fromBufferAttribute(pos, i + 1); Cc.fromBufferAttribute(pos, i + 2);
    const nn = new THREE.Vector3().subVectors(B, A).cross(new THREE.Vector3().subVectors(Cc, A));
    if (nn.lengthSq() < 1e-12) continue;
    nn.normalize();
    if (nn.dot(new THREE.Vector3().subVectors(p, A)) > -eps) return false;
  }
  return true;
}
// ring of curve points around an axis (for wrapping roots)
function loopAround(c, dir, r, n = 8, wob = 0) {
  const d = dir.clone().normalize();
  const a = new THREE.Vector3().crossVectors(d, Math.abs(d.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0)).normalize();
  const b = new THREE.Vector3().crossVectors(d, a).normalize();
  const out = [];
  for (let k = 0; k <= n; k++) {
    const t = (2 * Math.PI * k) / n;
    out.push(c.clone().addScaledVector(a, Math.cos(t) * r).addScaledVector(b, Math.sin(t) * r).addScaledVector(d, wob * Math.sin(t)));
  }
  return out;
}

export function buildGeometry() {
  const C = [], S = [];
  const skin = (pts, lo = 0.0, hi = 0.75) => paint(hull(pts), SW.skin, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= BODY (sitting frog: rear low, chest raised) =================
  const bodyPts = [
    ...ring(V(0, 0.18, -0.335), 0.08, 0.06, 10, 'z'),
    ...ring(V(0, 0.17, -0.29), 0.15, 0.1, 10, 'z'),
    ...ring(V(0, 0.19, -0.21), 0.19, 0.14, 10, 'z'),
    ...ring(V(0, 0.24, -0.06), 0.23, 0.18, 10, 'z'),
    ...ring(V(0, 0.27, 0.07), 0.22, 0.17, 10, 'z'),
    ...ring(V(0, 0.3, 0.15), 0.17, 0.13, 10, 'z'),
  ];
  const body = skin(bodyPts, 0.08, 0.6);
  C.push(body);
  // pale belly / throat plate
  C.push(paint(hull([
    ...ring(V(0, 0.2, 0.19), 0.12, 0.085, 8, 'z'),
    ...ring(V(0, 0.15, 0.1), 0.14, 0.085, 8, 'z'),
    V(0, 0.32, 0.25), V(0.08, 0.32, 0.23), V(-0.08, 0.32, 0.23),
  ]), SW.belly, 'y', [0.12, 0.42]));

  // ================= HEAD (big, wide, flat-topped frog head) =================
  const H = { y: 0.41, z: 0.17 };
  const head = skin([
    ...cbox(V(0, H.y, H.z), 0.25, 0.1, 0.15, 0.06),
    V(0.17, H.y - 0.06, H.z + 0.19), V(-0.17, H.y - 0.06, H.z + 0.19),
    V(0.15, H.y + 0.05, H.z + 0.17), V(-0.15, H.y + 0.05, H.z + 0.17),
    V(0.06, H.y + 0.085, H.z + 0.13), V(-0.06, H.y + 0.085, H.z + 0.13),
    V(0.22, H.y - 0.09, H.z + 0.08), V(-0.22, H.y - 0.09, H.z + 0.08),
  ], 0.3, 0.75);
  C.push(head);
  // lighter lower jaw / chin
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.085, H.z + 0.06), 0.15, 0.03, 0.1, 0.02),
    V(0.1, H.y - 0.075, H.z + 0.16), V(-0.1, H.y - 0.075, H.z + 0.16),
  ]), SW.belly, 'y', [0.3, 0.4]));
  // wide mouth line: slight frown across the front
  const MZ = H.z + 0.185;
  C.push(flat(hull([V(-0.06, H.y - 0.05, MZ + 0.01), V(0.06, H.y - 0.05, MZ + 0.01), V(-0.06, H.y - 0.062, MZ + 0.01), V(0.06, H.y - 0.062, MZ + 0.01),
    V(-0.06, H.y - 0.05, MZ - 0.02), V(0.06, H.y - 0.05, MZ - 0.02), V(-0.06, H.y - 0.062, MZ - 0.02), V(0.06, H.y - 0.062, MZ - 0.02)]), SW.mouth));
  S.push(flat(hull([V(0.055, H.y - 0.05, MZ + 0.01), V(0.055, H.y - 0.062, MZ + 0.01), V(0.16, H.y - 0.07, MZ - 0.012), V(0.16, H.y - 0.082, MZ - 0.012),
    V(0.055, H.y - 0.05, MZ - 0.02), V(0.055, H.y - 0.062, MZ - 0.02), V(0.16, H.y - 0.07, MZ - 0.04), V(0.16, H.y - 0.082, MZ - 0.04)]), SW.mouth));
  // nostrils
  S.push(flat(hull(cbox(V(0.035, H.y + 0.045, H.z + 0.17), 0.012, 0.007, 0.012, 0.003)), SW.rim));

  // ================= EYE DOMES (bulging on top of the head) =================
  const D = V(0.14, H.y + 0.1, H.z + 0.06);
  S.push(skin([
    ...ring(V(D.x, D.y - 0.06, D.z), 0.1, 0.095, 8, 'y'),
    ...ring(V(D.x, D.y + 0.03, D.z), 0.092, 0.088, 8, 'y'),
    ...ring(V(D.x, D.y + 0.085, D.z - 0.005), 0.05, 0.05, 8, 'y'),
  ], 0.3, 0.75));
  // eyes: dark rim, white almond with angry flat top, pupil, catchlight
  const FZ = D.z + 0.088 * Math.cos(Math.PI / 8) + 0.004;
  const E = V(D.x + 0.004, D.y + 0.01, 0);
  const eyeShape = [[-0.044, 0.006], [0.046, 0.036], [0.054, -0.01], [0.022, -0.042], [-0.03, -0.038], [-0.048, -0.016]];
  S.push(flat(hull(plate(eyeShape.map(([u, v]) => [u * 1.25, v * 1.25 - 0.002]), E, FZ - 0.03, FZ + 0.004)), SW.rim));
  S.push(flat(hull(plate(eyeShape, E, FZ - 0.02, FZ + 0.012)), SW.white));
  S.push(flat(hull(plate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]],
    V(E.x - 0.006, E.y - 0.002, 0), FZ + 0.004, FZ + 0.018)), SW.eye));
  S.push(flat(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.004, E.y + 0.0, 0), FZ + 0.012, FZ + 0.022)), SW.white));
  // heavy brow slanting down toward the centre
  S.push(paint(hull([
    V(0.06, E.y + 0.01, FZ + 0.03), V(0.062, E.y + 0.05, FZ + 0.02),
    V(0.21, E.y + 0.05, FZ - 0.0), V(0.21, E.y + 0.09, FZ - 0.02),
    V(0.06, E.y + 0.01, FZ - 0.04), V(0.062, E.y + 0.06, FZ - 0.05),
    V(0.21, E.y + 0.05, FZ - 0.07), V(0.21, E.y + 0.09, FZ - 0.08),
  ]), SW.brow, 'y'));

  // ================= FRONT LEGS (crouched: elbows out, wrists splayed) =================
  const SH = V(0.15, 0.25, 0.16), EL = V(0.25, 0.14, 0.19), WR = V(0.25, 0.045, 0.26);
  const upper = skin([...ring(SH, 0.075, 0.075, 8), ...ring(V(EL.x, EL.y + 0.02, EL.z), 0.062, 0.062, 8),
    ...cbox(EL, 0.055, 0.04, 0.055, 0.02)], 0.0, 0.6);
  const arm = skin([...cbox(EL, 0.056, 0.04, 0.056, 0.02), ...ring(WR, 0.052, 0.052, 8)], 0.0, 0.6);
  S.push(upper, arm);
  const hand = (x, z, dirs, len, pw = 0.06) => {
    S.push(paint(hull(cbox(V(x, 0.025, z), pw, 0.025, 0.05, 0.015)), SW.toe, 'y', [0, 0.06]));
    for (const a of dirs) {
      const d = V(Math.sin(a), 0, Math.cos(a));
      const tip = V(x + d.x * len, 0.0, z + d.z * len);
      S.push(paint(hull([...cbox(V(x + d.x * 0.03, 0.02, z + d.z * 0.03), 0.022, 0.02, 0.022, 0.008),
        ...cbox(V(tip.x, 0.017, tip.z), 0.016, 0.017, 0.016, 0.006)]), SW.toe, 'y', [0, 0.06]));
      S.push(flat(hull(cbox(V(tip.x + d.x * 0.012, 0.02, tip.z + d.z * 0.012), 0.024, 0.02, 0.024, 0.009)), SW.green));
    }
  };
  hand(0.26, 0.28, [-0.55, 0.15, 0.85], 0.095);

  // ================= BACK LEGS (one folded thigh + tucked shin per side) =================
  const thigh = skin([
    ...ring(V(0.13, 0.22, -0.25), 0.055, 0.065, 8, 'z'),
    ...ring(V(0.15, 0.23, -0.17), 0.1, 0.115, 8, 'z'),
    ...ring(V(0.2, 0.19, -0.05), 0.095, 0.11, 8, 'z'),
    ...ring(V(0.27, 0.12, 0.06), 0.06, 0.065, 8, 'z'),
  ], 0.0, 0.6);
  S.push(thigh);
  const shin = skin([...ring(V(0.3, 0.07, 0.07), 0.045, 0.045, 8, 'z'), ...ring(V(0.32, 0.045, -0.12), 0.042, 0.042, 8, 'z')], 0.0, 0.6);
  S.push(shin);
  hand(0.35, -0.08, [0.1, 0.55, 1.0], 0.12, 0.05);

  // ================= GLOWING SPOTS (thin plates hugging the surface) =================
  const parts = [body, head, upper, arm, thigh, shin];
  const bc = V(0, 0.2, -0.05), hc = V(0, 0.44, 0.15), tc = V(0.21, 0.17, -0.07);
  const P = (geo, from, to, r, sides = 6, rot = 0, sw = SW.purple) => {
    const g = spot(geo, surf(geo, from, to), r, sides, rot);
    if (!g) return null;
    const pos = g.attributes.position, q = V(0, 0, 0);
    for (let i = 0; i < pos.count; i++) {   // reject spots buried inside another part
      q.fromBufferAttribute(pos, i);
      for (const o of parts) if (o !== geo && inside(o, q, 0.002)) return null;
    }
    const c = g.boundingSphere ? g.boundingSphere.center : (g.computeBoundingSphere(), g.boundingSphere.center);
    if (c.x > 0.001 && c.x < r + 0.006) return null;           // would collide with its mirror
    for (const o of placed) if (o.c.distanceTo(c) < o.r + r + 0.008) return null;
    placed.push({ c: c.clone(), r });
    return flat(g, sw);
  };
  const placed = [];
  const pS = (g) => { if (g) S.push(g); }, pC = (g) => { if (g) C.push(g); };
  // signature pattern: big centre spots down the spine, flanking pairs, 3 sizes
  const Bz = (dx, dy, z, r, sides = 6, rot = 0, sw = SW.purple) => P(body, V(dx, 0.2 + dy, z), V(0, 0.2, z), r, sides, rot, sw);
  pC(Bz(0, 1, -0.1, 0.065));
  pC(P(body, V(0, 0.6, -0.6), V(0, 0.2, -0.22), 0.045, 6, 0));
  pS(Bz(0.7, 0.7, -0.03, 0.042, 6, 0.3));
  pS(Bz(0.5, 0.9, -0.2, 0.028, 5, 0.1));
  pC(P(head, V(0, 1, 0.22), V(0, 0.4, 0.22), 0.042, 6, 0));
  pC(P(head, V(0, 1, 0.06), V(0, 0.4, 0.06), 0.03, 6, 0));
  pS(P(head, V(0.35, 1, 0.05), hc, 0.03, 6, 0.2));
  pS(P(head, V(0.7, 0.45, 0.3), hc, 0.03, 5, 0.4));
  pS(P(head, V(0.7, 0.3, 0.05), hc, 0.022, 5, 0.1));
  pS(P(thigh, V(0.6, 0.35, -0.11), V(0.18, 0.2, -0.11), 0.05, 6, 0.2));
  pS(P(thigh, V(0.6, 0.25, 0.03), V(0.2, 0.17, 0.03), 0.03, 6, 0.5));
  pS(P(thigh, V(0.4, 0.7, -0.21), V(0.15, 0.22, -0.21), 0.026, 5, 0.1));
  pS(P(upper, V(0.4, 0.4, 0.5), V(0.19, 0.2, 0.17), 0.03, 6, 0.0));
  // small green spots
  pS(Bz(0.9, 0.4, 0.06, 0.02, 5, 0.0, SW.green));
  pS(P(thigh, V(0.6, 0.08, -0.17), V(0.15, 0.18, -0.17), 0.018, 5, 0.0, SW.green));
  pS(P(thigh, V(0.5, 0.7, -0.03), V(0.2, 0.19, -0.03), 0.016, 5, 0.4, SW.green));
  pS(P(head, V(0.3, 1, 0.28), V(0.1, 0.4, 0.28), 0.016, 5, 0.0, SW.green));
  pS(Bz(0.6, 0.8, 0.07, 0.016, 5, 0.6, SW.green));
  pS(P(head, V(0.8, 0.2, 0.2), hc, 0.016, 5, 0.2, SW.green));
  pS(P(arm, V(0.6, 0.1, 0.5), V(0.25, 0.09, 0.22), 0.016, 5, 0.0, SW.green));

  // ================= MOSS (clumps on the back) + BOG ROOTS =================
  const mossAt = (geo, from, to, r, n = 3) => {
    const h = surf(geo, from, to);
    if (!h) return [];
    const out = [flat(spot(geo, h, r, 7, 0.2, 0.018), SW.moss)];
    for (let k = 0; k < n; k++) {
      const a = (2 * Math.PI * k) / n + 0.4;
      const up = Math.abs(h.n.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
      const ta = new THREE.Vector3().crossVectors(h.n, up).normalize(), tb = new THREE.Vector3().crossVectors(ta, h.n).normalize();
      const base = h.p.clone().addScaledVector(ta, Math.cos(a) * r * 0.5).addScaledVector(tb, Math.sin(a) * r * 0.5);
      const dir = h.n.clone().addScaledVector(ta, Math.cos(a) * 0.6).addScaledVector(tb, Math.sin(a) * 0.6);
      out.push(paint(shard(base, dir, r * 0.35, r * 0.9), SW.moss, 'flat'));
    }
    return out;
  };
  S.push(...mossAt(body, V(0.4, 0.9, 0.1), bc, 0.07));
  S.push(...mossAt(head, V(0.45, 0.9, -0.05), hc, 0.045, 2));
  // bog root wrapped around each forearm
  const fa = EL.clone().lerp(WR, 0.55);
  S.push(paint(tube(curveSamples(loopAround(fa, WR.clone().sub(EL), 0.064, 8, 0.012), 12, () => 0.015),
    { seg: 5, capStart: 0.005, capEnd: 0.005 }), SW.root, 'len'));
  // root draping over the thigh, ray-cast onto its surface
  const rp = [];
  for (const [o, t] of [[V(0.3, 0.8, -0.3), V(0.18, 0.2, -0.15)], [V(0.4, 0.7, -0.12), tc], [V(0.6, 0.35, -0.08), tc],
    [V(0.6, 0.1, 0.02), V(0.24, 0.14, 0.0)], [V(0.6, 0.0, 0.1), V(0.27, 0.1, 0.07)]]) {
    const h = surf(thigh, o, t); if (h) rp.push(h.p.clone().addScaledVector(h.n, 0.008));
  }
  if (rp.length > 2) S.push(paint(tube(curveSamples(rp, 9, (t) => 0.009 + 0.012 * Math.sin(Math.PI * Math.min(1, 0.15 + t))), { seg: 5, capStart: 0.01, capEnd: 0.015 }), SW.root, 'len'));

  // ================= SPIRIT HALO (floating, centred, chunky ring + gems) =================
  const HY = H.y + 0.305, HZ = H.z + 0.02, HR = 0.172;
  const hp = [];
  const TL = 0.22; // ~12.5 deg tilt: front edge down, back edge up
  const hpt = (x, dz) => V(x, HY - dz * Math.sin(TL), HZ + dz * Math.cos(TL));
  for (let k = 0; k <= 16; k++) { const a = (2 * Math.PI * k) / 16 - Math.PI / 2; hp.push({ p: hpt(Math.cos(a) * HR, Math.sin(a) * HR), rx: 0.02, ry: 0.0225 }); }
  C.push(paint(tube(hp, { seg: 6, ref: V(0, 1, 0), phase: Math.PI / 6 }), SW.halo, 'flat'));
  // purple diamond gem set on the front of the halo
  { const G = hpt(0, HR + 0.018);
    C.push(flat(hull([V(0, G.y + 0.055, G.z), V(0, G.y - 0.05, G.z), V(0.032, G.y + 0.005, G.z), V(-0.032, G.y + 0.005, G.z),
      V(0, G.y + 0.005, G.z + 0.022), V(0, G.y + 0.005, G.z - 0.02)]), SW.purple)); }
  // paired spirit wisps orbiting the halo at its sides (mint orb + flame tip)
  const W = hpt(HR + 0.065, -0.01);
  S.push(flat(blob(0, W, V(0.032, 0.04, 0.032)), SW.wisp));
  S.push(flat(shard(V(W.x, W.y + 0.025, W.z), V(0.1, 1, -0.25), 0.022, 0.06), SW.wisp));

  return assemble(C, S);
}

// Mud Golem (Godly, Round 6 - Swamp Slam): dripping mud + roots, glowing green cracks,
// moss, bog roots, glowing spots, glowing runes and ornate gold armour.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  mud:   { i: 0, top: '#B07A48', bot: '#6A4021' },
  dark:  { i: 1, top: '#7A4E2C', bot: '#4A2C16' },  // drips, deep mud
  root:  { i: 2, top: '#5A4630', bot: '#2E2216' },
  moss:  { i: 3, top: '#8FD14F', bot: '#3E8E2E' },
  glow:  { i: 4, top: '#B8FF6E', bot: '#45F03A', glow: true },  // cracks / spots
  rune:  { i: 5, top: '#A8FFE0', bot: '#2EF0A0', glow: true },  // runes on gold
  gold:  { i: 6, top: '#FFE36E', bot: '#D9961C' },
  goldD: { i: 7, top: '#E9B636', bot: '#A86A10' },
  white: { i: 8, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:   { i: 9, top: '#1A1416', bot: '#0C0A0B' },
  brow:  { i: 10, top: '#8E5E34', bot: '#5A361A' },
  mouth: { i: 11, top: '#3A2010', bot: '#22120A' },
};
const SW = PALETTE;

// ---------- surface projection helpers (decals that hug a hull) ----------
const _mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
function hitter(g) { return new THREE.Mesh(g, _mat); }
// cast from `pt - dir*0.6` along dir; returns {p, n}
function proj(mesh, pt, dir) {
  const d = dir.clone().normalize();
  const rc = new THREE.Raycaster(pt.clone().addScaledVector(d, -0.6), d, 0, 2);
  const h = rc.intersectObject(mesh, false)[0];
  if (!h) throw new Error('proj miss at ' + pt.toArray().map((v) => v.toFixed(2)).join(','));
  const n = h.face.normal.clone();
  if (n.dot(d) > 0) n.negate();
  return { p: h.point, n };
}
// raised slab polyline following a surface (cracks, rune strokes)
function strokes(mesh, pts, dir, w0, w1 = w0, up = 0.008, down = 0.02) {
  const P = pts.map((q) => proj(mesh, q, dir));
  const out = [];
  for (let k = 0; k < P.length - 1; k++) {
    const a = P[k], b = P[k + 1];
    const wa = w0 + (w1 - w0) * (k / (P.length - 1)), wb = w0 + (w1 - w0) * ((k + 1) / (P.length - 1));
    const t = b.p.clone().sub(a.p);
    const pts8 = [];
    for (const [q, w] of [[a, wa], [b, wb]]) {
      const s = new THREE.Vector3().crossVectors(q.n, t).normalize();
      const ext = t.clone().normalize().multiplyScalar(w * 0.5 * (q === a ? -1 : 1));
      for (const sg of [-1, 1]) {
        pts8.push(q.p.clone().addScaledVector(s, sg * w).add(ext).addScaledVector(q.n, up));
        pts8.push(q.p.clone().addScaledVector(s, sg * w).add(ext).addScaledVector(q.n, -down));
      }
    }
    out.push(hull(pts8));
  }
  return out;
}
// round raised spot on a surface
function spot(mesh, pt, dir, r, sides = 6, up = 0.01) {
  const { p, n } = proj(mesh, pt, dir);
  const a = new THREE.Vector3().crossVectors(n, Math.abs(n.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0)).normalize();
  const b = new THREE.Vector3().crossVectors(n, a).normalize();
  const pts = [];
  for (let k = 0; k < sides; k++) {
    const th = (2 * Math.PI * k) / sides;
    const o = a.clone().multiplyScalar(Math.cos(th)).addScaledVector(b, Math.sin(th));
    pts.push(p.clone().addScaledVector(o, r).addScaledVector(n, up * 0.5));
    pts.push(p.clone().addScaledVector(o, r * 0.6).addScaledVector(n, up));
    pts.push(p.clone().addScaledVector(o, r * 1.05).addScaledVector(n, -0.025));
  }
  return hull(pts);
}
// flat mud runnel lying on a surface: thin at the top, wider bulb at the bottom, <= ~0.02 proud
function sdrip(mesh, pt, dir, len, r) {
  const prof = [[0, 0.7, 0.006], [0.4, 0.65, 0.008], [0.68, 1.35, 0.013], [0.86, 1.45, 0.015], [1, 0.7, 0.009]];
  const P = prof.map(([t]) => proj(mesh, pt.clone().add(V(0, -len * t, 0)), dir));
  const out = [];
  for (let k = 0; k < P.length; k++) {
    const q = P[k], [, w, up] = prof[k];
    const s = new THREE.Vector3().crossVectors(q.n, V(0, 1, 0)).normalize();
    for (const sg of [-1, 1]) {
      out.push(q.p.clone().addScaledVector(s, sg * r * w).addScaledVector(q.n, up));
      out.push(q.p.clone().addScaledVector(s, sg * r * w * 1.1).addScaledVector(q.n, -0.02));
    }
  }
  return hull(out);
}
// moss patch that conforms to a surface: each outline point projected on its own, ragged edge
function mossPatch(mesh, pt, dir, r, sides = 8, up = 0.016) {
  const d = dir.clone().normalize();
  const a = new THREE.Vector3().crossVectors(d, Math.abs(d.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0)).normalize();
  const b = new THREE.Vector3().crossVectors(d, a).normalize();
  const c = proj(mesh, pt, d);
  const out = [c.p.clone().addScaledVector(c.n, up * 1.2)];
  for (let k = 0; k < sides; k++) {
    const th = (2 * Math.PI * k) / sides;
    const rr = r * (0.8 + 0.4 * ((k * 7) % 5) / 4);
    const at = (f) => { try { return proj(mesh, pt.clone().addScaledVector(a, Math.cos(th) * rr * f).addScaledVector(b, Math.sin(th) * rr * f), d); } catch (e) { return null; } };
    const q = at(1), qi = at(0.55);
    if (q) out.push(q.p.clone().addScaledVector(q.n, up * 0.4), q.p.clone().addScaledVector(q.n, -0.02));
    if (qi) out.push(qi.p.clone().addScaledVector(qi.n, up));
  }
  return hull(out);
}
// hanging mud drip (teardrop chunk)
function drip(top, len, r) {
  return hull([
    ...ring(top, r * 0.8, r * 0.8, 6, 'y'),
    ...ring(top.clone().add(V(0, -len * 0.72, 0)), r * 1.25, r * 1.25, 6, 'y', 0),
    top.clone().add(V(0, -len, 0)),
  ]);
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const mud = (pts, lo = 0.0, hi = 1.0) => paint(hull(pts), SW.mud, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');
  const gold = (g, lo, hi) => paint(g, SW.gold, 'y', [lo, hi]);

  // ================= TORSO (top-heavy barrel) =================
  const torso = mud([
    ...ring(V(0, 0.25, 0.0), 0.17, 0.14, 8, 'y'),
    ...ring(V(0, 0.4, 0.01), 0.23, 0.2, 8, 'y'),
    ...ring(V(0, 0.55, 0.0), 0.28, 0.215, 8, 'y'),
    ...ring(V(0, 0.67, -0.02), 0.22, 0.165, 8, 'y'),
  ], 0.1, 0.8);
  C.push(torso);
  const torsoM = hitter(torso);

  // ================= LEGS + FEET =================
  const leg = mud([...ring(V(0.12, 0.32, 0.0), 0.1, 0.115, 8), ...ring(V(0.145, 0.16, 0.01), 0.1, 0.115, 8),
    ...ring(V(0.15, 0.07, 0.02), 0.095, 0.11, 8)], 0.0, 0.7);
  S.push(leg);
  const legM = hitter(leg);
  // foot slab + toe nubs, flat on the ground
  S.push(paint(hull(cbox(V(0.155, 0.045, 0.025), 0.11, 0.045, 0.135, 0.03)), SW.dark, 'y', [0, 0.12]));
  for (const dx of [-0.06, 0, 0.06])
    S.push(paint(hull(cbox(V(0.155 + dx, 0.035, 0.155), 0.035, 0.035, 0.035, 0.014)), SW.dark, 'y', [0, 0.12]));

  // ================= ARMS + BIG FISTS =================
  const upper = mud([...ring(V(0.29, 0.6, -0.01), 0.09, 0.09, 8), ...ring(V(0.34, 0.43, 0.01), 0.085, 0.085, 8)], 0.1, 0.8);
  const fore = mud([...ring(V(0.34, 0.45, 0.01), 0.088, 0.088, 8), ...ring(V(0.37, 0.3, 0.04), 0.1, 0.1, 8)], 0.1, 0.8);
  const fist = mud([...cbox(V(0.375, 0.2, 0.05), 0.1, 0.095, 0.1, 0.04)], 0.05, 0.6);
  S.push(upper, fore, fist);
  const foreM = hitter(fore), fistM = hitter(fist), upperM = hitter(upper);
  // knuckle ridge
  for (const dz of [-0.06, -0.02, 0.02, 0.06])
    S.push(paint(hull(cbox(V(0.4, 0.125, 0.05 + dz), 0.06, 0.02, 0.018, 0.008)), SW.mud, 'y', [0.05, 0.6]));

  // ================= HEAD (big, sunk into shoulders) =================
  const H = { y: 0.79, z: 0.055 };
  const head = mud([
    ...cbox(V(0, H.y + 0.01, H.z), 0.185, 0.125, 0.165, 0.055),
    ...ring(V(0, H.y + 0.15, H.z - 0.01), 0.12, 0.12, 8, 'y'),
    // heavy jaw block jutting forward
    V(0.15, H.y - 0.14, H.z + 0.125), V(-0.15, H.y - 0.14, H.z + 0.125),
    V(0.12, H.y - 0.155, H.z + 0.02), V(-0.12, H.y - 0.155, H.z + 0.02),
  ], 0.55, 1.0);
  C.push(head);
  const headM = hitter(head);
  const FZ = H.z + 0.165;

  // eyes + heavy brow
  const E = V(0.08, H.y + 0.012, 0);
  const es = (a, k = 1.3) => a.map(([u, v]) => [u * k, v * k]);
  S.push(flat(hull(plate(es([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.01, FZ + 0.012)), SW.white));
  S.push(flat(hull(plate(es([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.006, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye));
  S.push(flat(hull(plate(es([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]]),
    V(E.x + 0.006, E.y + 0.004, 0), FZ + 0.014, FZ + 0.021)), SW.white));
  S.push(paint(hull([
    V(0.0, E.y + 0.012, FZ + 0.035), V(0.0, E.y + 0.055, FZ + 0.025),
    V(0.17, E.y + 0.055, FZ - 0.01), V(0.17, E.y + 0.095, FZ - 0.025),
    V(0.0, E.y + 0.012, FZ - 0.03), V(0.0, E.y + 0.065, FZ - 0.04),
    V(0.17, E.y + 0.055, FZ - 0.06), V(0.17, E.y + 0.095, FZ - 0.07),
  ]), SW.brow, 'y', [0.8, 0.92]));
  // mouth slit
  C.push(flat(hull(cbox(V(0, H.y - 0.085, FZ + 0.008), 0.035, 0.0065, 0.01, 0.003)), SW.mouth));
  S.push(flat(hull([V(0.03, H.y - 0.0785, FZ + 0.018), V(0.03, H.y - 0.0915, FZ + 0.018), V(0.03, H.y - 0.0785, FZ - 0.002), V(0.03, H.y - 0.0915, FZ - 0.002),
    V(0.06, H.y - 0.092, FZ + 0.013), V(0.06, H.y - 0.102, FZ + 0.013), V(0.06, H.y - 0.092, FZ - 0.007), V(0.06, H.y - 0.102, FZ - 0.007)]), SW.mouth));

  // ================= GOLD ARMOUR =================
  // crown band around the head top
  C.push(gold(hull([...ring(V(0, H.y + 0.1, H.z), 0.185, 0.18, 8, 'y'), ...ring(V(0, H.y + 0.15, H.z - 0.005), 0.165, 0.165, 8, 'y')]), H.y + 0.08, H.y + 0.16));
  C.push(gold(shard(V(0, H.y + 0.14, FZ + 0.005), V(0, 1, 0.15), 0.04, 0.11), H.y + 0.1, H.y + 0.26));
  S.push(gold(shard(V(0.11, H.y + 0.14, FZ - 0.03), V(0.25, 1, 0.1), 0.032, 0.08), H.y + 0.1, H.y + 0.24));
  S.push(gold(shard(V(0.17, H.y + 0.14, H.z - 0.02), V(0.5, 1, 0), 0.03, 0.07), H.y + 0.1, H.y + 0.24));
  // pauldrons
  const paul = gold(hull([...ring(V(0.3, 0.6, -0.01), 0.15, 0.14, 8, 'y'), ...ring(V(0.28, 0.7, -0.01), 0.11, 0.1, 8, 'y'),
    V(0.25, 0.74, -0.01)]), 0.56, 0.76);
  S.push(paul);
  S.push(paint(hull([...ring(V(0.31, 0.56, -0.01), 0.16, 0.15, 8, 'y'), ...ring(V(0.31, 0.6, -0.01), 0.155, 0.145, 8, 'y')]), SW.goldD, 'flat'));
  S.push(gold(shard(V(0.32, 0.7, -0.01), V(0.5, 1, 0), 0.04, 0.09), 0.68, 0.8));
  const paulM = hitter(paul);
  // belt + buckle + front tasset
  C.push(gold(hull([...ring(V(0, 0.25, 0.0), 0.185, 0.155, 8, 'y'), ...ring(V(0, 0.32, 0.005), 0.21, 0.185, 8, 'y')]), 0.24, 0.33));
  const buckle = gold(hull(cbox(V(0, 0.285, 0.18), 0.065, 0.05, 0.02, 0.015)), 0.23, 0.34);
  C.push(buckle);
  C.push(gold(hull([V(0.07, 0.25, 0.14), V(-0.07, 0.25, 0.14), V(0.05, 0.13, 0.14), V(-0.05, 0.13, 0.14), V(0, 0.1, 0.14),
    V(0.07, 0.25, 0.172), V(-0.07, 0.25, 0.172), V(0.05, 0.13, 0.17), V(-0.05, 0.13, 0.17), V(0, 0.1, 0.17)]), 0.08, 0.3));
  // chest emblem (diamond)
  const chest = gold(hull(plate([[0, 0.085], [0.075, 0], [0, -0.085], [-0.075, 0]], V(0, 0.5, 0), 0.17, 0.225)), 0.4, 0.6);
  C.push(chest);
  // forearm bracers
  S.push(gold(hull([...ring(V(0.355, 0.36, 0.025), 0.11, 0.11, 8), ...ring(V(0.365, 0.31, 0.035), 0.113, 0.113, 8)]), 0.28, 0.4));

  // ================= GLOWING RUNES (on gold) =================
  const chestM = hitter(chest);
  const ZD = V(0, 0, -1);
  for (const g of strokes(chestM, [V(0, 0.55, 0.3), V(0, 0.45, 0.3)], ZD, 0.008)) C.push(flat(g, SW.rune));
  for (const g of strokes(chestM, [V(-0.03, 0.52, 0.3), V(0, 0.5, 0.3), V(0.03, 0.52, 0.3)], ZD, 0.007)) C.push(flat(g, SW.rune));
  C.push(flat(hull(plate([[0, 0.022], [0.016, 0], [0, -0.022], [-0.016, 0]], V(0, 0.285, 0), 0.195, 0.207)), SW.rune));
  C.push(flat(hull(plate([[0, 0.02], [0.016, 0], [0, -0.02], [-0.016, 0]], V(0, H.y + 0.13, 0), FZ + 0.01, FZ + 0.03)), SW.rune));
  for (const g of strokes(paulM, [V(0.48, 0.68, -0.05), V(0.48, 0.62, -0.01), V(0.48, 0.68, 0.03)], V(-1, 0, 0), 0.008)) S.push(flat(g, SW.rune));

  // ================= GLOWING GREEN CRACKS + SPOTS =================
  const glowS = (arr, tgt) => { for (const g of arr) tgt.push(flat(g, SW.glow)); };
  glowS(strokes(torsoM, [V(0.1, 0.62, 0.3), V(0.13, 0.55, 0.3), V(0.11, 0.48, 0.3), V(0.15, 0.4, 0.3)], ZD, 0.011, 0.005), S);
  glowS(strokes(torsoM, [V(0.13, 0.55, 0.3), V(0.19, 0.52, 0.3)], ZD, 0.008, 0.004), S);
  glowS(strokes(torsoM, [V(-0.05, 0.42, 0.3), V(-0.02, 0.37, 0.3), V(-0.06, 0.33, 0.3)], ZD, 0.009, 0.004), S);
  glowS(strokes(legM, [V(0.5, 0.3, 0.04), V(0.5, 0.23, 0.0), V(0.5, 0.15, 0.05), V(0.5, 0.1, 0.02)], V(-1, 0, 0), 0.01, 0.004), S);
  glowS(strokes(foreM, [V(0.6, 0.44, 0.02), V(0.6, 0.39, 0.05), V(0.6, 0.34, 0.03)], V(-1, 0, 0), 0.009, 0.004), S);
  glowS(strokes(upperM, [V(0.32, 0.58, 0.3), V(0.34, 0.5, 0.3), V(0.32, 0.45, 0.3)], ZD, 0.008, 0.004), S);
  glowS(strokes(headM, [V(0.13, H.y + 0.08, 0.4), V(0.15, H.y - 0.02, 0.4)], ZD, 0.008, 0.004), S);
  glowS(strokes(torsoM, [V(0.14, 0.62, -0.4), V(0.19, 0.53, -0.4), V(0.16, 0.45, -0.4), V(0.18, 0.38, -0.4)], V(0, 0, 1), 0.012, 0.005), S);
  // big glowing rune on the back: spine line + chevrons
  for (const g of strokes(torsoM, [V(0, 0.6, -0.4), V(0, 0.38, -0.4)], V(0, 0, 1), 0.012)) C.push(flat(g, SW.rune));
  for (const y of [0.56, 0.46]) for (const g of strokes(torsoM, [V(0.0, y, -0.4), V(0.06, y - 0.05, -0.4)], V(0, 0, 1), 0.01)) S.push(flat(g, SW.rune));
  S.push(flat(spot(torsoM, V(0.2, 0.42, 0.3), ZD, 0.022), SW.glow));
  S.push(flat(spot(fistM, V(0.6, 0.22, 0.06), V(-1, 0, 0), 0.025), SW.glow));
  glowS(strokes(fistM, [V(0.33, 0.27, 0.4), V(0.36, 0.22, 0.4), V(0.34, 0.17, 0.4), V(0.38, 0.13, 0.4)], ZD, 0.01, 0.005), S);
  glowS(strokes(fistM, [V(0.36, 0.22, 0.4), V(0.41, 0.2, 0.4)], ZD, 0.007, 0.004), S);
  S.push(flat(spot(torsoM, V(0.26, 0.45, -0.3), V(-0.5, 0, 1), 0.02), SW.glow));

  // ================= MOSS =================
  const moss = (c, s, j = 0.3) => paint(blob(0, c, s, { jitter: j }), SW.moss, 'y', [c.y - s.y, c.y + s.y]);
  C.push(moss(V(0, H.y + 0.155, H.z - 0.02), V(0.12, 0.045, 0.12)));
  // draped moss: flat patches over the pauldrons and upper back
  const mp = (m, pt, d, r) => paint(mossPatch(m, pt, d, r), SW.moss, 'y', [pt.y - r, pt.y + r]);
  S.push(mp(paulM, V(0.3, 0.67, -0.08), V(0, -1, 0.55), 0.08));
  S.push(mp(paulM, V(0.4, 0.65, 0.0), V(-0.8, -1, 0), 0.06));
  S.push(mp(torsoM, V(0.12, 0.7, -0.1), V(0, -1, 0.6), 0.065));
  S.push(moss(V(0.375, 0.29, 0.03), V(0.075, 0.03, 0.065)));
  S.push(moss(V(0.2, 0.09, 0.0), V(0.05, 0.022, 0.06)));
  // gold knee guards with a glowing rune gem
  const knee = gold(hull([...plate([[0, 0.05], [0.05, 0.025], [0.045, -0.03], [0, -0.06], [-0.045, -0.03], [-0.05, 0.025]],
    V(0.145, 0.17, 0), 0.085, 0.14)]), 0.11, 0.23);
  S.push(knee);
  S.push(flat(hull(plate([[0, 0.022], [0.016, 0], [0, -0.022], [-0.016, 0]], V(0.145, 0.17, 0), 0.133, 0.148)), SW.rune));
  S.push(mp(torsoM, V(0.18, 0.6, -0.4), V(-0.2, 0, 1), 0.055));
  S.push(mp(torsoM, V(0.12, 0.36, -0.4), V(0, 0, 1), 0.04));
  // hanging moss strands
  const strand = (b, d, w, l) => paint(shard(b, d, w, l), SW.moss, 'flat');
  for (const [b, d] of [[V(0.44, 0.565, 0.0), V(0.3, -1, 0)], [V(0.42, 0.565, -0.08), V(0.2, -1, -0.15)],
    [V(0.3, 0.565, -0.155), V(0, -1, -0.25)], [V(0.36, 0.565, -0.135), V(0.1, -1, -0.25)]])
    S.push(strand(b, d, 0.018, 0.045));

  // ================= MUD DRIPS =================
  const dr = (p, l, r) => paint(drip(p, l, r), SW.dark, 'y', [p.y - l, p.y]);
  const sd = (m, pt, dir, l, r) => paint(sdrip(m, pt, dir, l, r), SW.dark, 'y', [pt.y - l - 0.1, pt.y + 0.05]);
  // from the crown band down the head front corners, one under the chin, two down the back of the head
  S.push(sd(headM, V(0.168, H.y + 0.09, 0.6), ZD, 0.1, 0.022));
  C.push(sd(headM, V(0, H.y - 0.105, 0.6), ZD, 0.05, 0.02));
  S.push(sd(headM, V(0.07, H.y + 0.09, -0.5), V(0, 0, 1), 0.12, 0.024));
  S.push(sd(torsoM, V(0.21, 0.52, 0.5), ZD, 0.12, 0.026));
  S.push(sd(torsoM, V(0.065, 0.62, 0.5), ZD, 0.1, 0.022));
  S.push(sd(torsoM, V(0.17, 0.57, -0.5), V(0, 0, 1), 0.14, 0.028));
  S.push(sd(foreM, V(0.6, 0.44, 0.03), V(-1, 0, 0), 0.1, 0.024));
  S.push(sd(legM, V(0.4, 0.3, 0.06), V(-1, 0, 0), 0.12, 0.024));

  // ================= BOG ROOTS (hug the surfaces, end on the body / feet) =================
  // pts: [mesh, point, ray dir]; tube runs along the projected points, half sunk in
  const sroot = (pts, r0, r1) => {
    const P = pts.map(([m, q, d], k) => {
      const h = proj(m, q, d), r = r0 + (r1 - r0) * k / (pts.length - 1);
      return h.p.addScaledVector(h.n, r * 0.35);
    });
    return paint(tube(curveSamples(P, Math.max(6, pts.length * 2), (t) => r0 + (r1 - r0) * t),
      { seg: 5, ref: V(0.6, 0.2, 0.77), capStart: 0.0, capEnd: 0.005 }), SW.root, 'len');
  };
  const OX = V(-1, 0, 0), BZ = V(0, 0, 1);
  // outer leg: from under the belt down to the top of the foot
  S.push(sroot([[legM, V(0.5, 0.3, 0.0), OX], [legM, V(0.5, 0.22, 0.04), OX], [legM, V(0.5, 0.14, 0.0), OX],
    [legM, V(0.5, 0.08, -0.04), OX]], 0.022, 0.014));
  S.push(sroot([[legM, V(0.5, 0.2, -0.06), OX], [legM, V(0.21, 0.13, -0.4), BZ], [legM, V(0.15, 0.08, -0.4), BZ]], 0.016, 0.01));
  // back: from the shoulder diagonally across the back, ending on the side of the torso
  S.push(sroot([[torsoM, V(0.12, 0.66, -0.5), BZ], [torsoM, V(0.2, 0.55, -0.5), BZ], [torsoM, V(0.22, 0.45, -0.5), BZ],
    [torsoM, V(0.5, 0.38, -0.08), OX]], 0.024, 0.014));
  // arm: over the outer upper arm, wrapping to the front of the forearm, ending at the bracer
  S.push(sroot([[upperM, V(0.7, 0.56, -0.02), OX], [upperM, V(0.7, 0.49, 0.02), OX], [foreM, V(0.37, 0.42, 0.6), ZD],
    [foreM, V(0.33, 0.38, 0.6), ZD]], 0.02, 0.012));
  return assemble(C, S);
}

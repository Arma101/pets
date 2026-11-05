// Koi Kicker (Godly, Round 7 Blossom Brawl): a chunky upright fighter koi on fin legs,
// white with bold orange koi patches, flowing faceted fins, long barbels, ornate gold armour,
// jade gems, silk sash ribbons, cherry-blossom petals and glowing runes.
import { V, THREE, hull, cbox, ring, plate, shard, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  white:  { i: 0, top: '#FFFFFF', bot: '#E4DDD6' },
  orange: { i: 1, top: '#FF8E2B', bot: '#E2501A' },
  fin:    { i: 2, top: '#FF9A5A', bot: '#FFF4E6' },
  ray:    { i: 14, top: '#F0702A', bot: '#F6A060' },   // fin base orange -> pale tip
  gold:   { i: 3, top: '#FFE066', bot: '#D9950F' },
  jade:   { i: 4, top: '#6FF0B8', bot: '#16956A' },
  silk:   { i: 5, top: '#FF5E8E', bot: '#C21E4E' },
  petal:  { i: 6, top: '#FFD3E4', bot: '#FF8DB8' },
  rune:   { i: 7, top: '#B4FBFF', bot: '#3FD8FF', glow: true },
  eye:    { i: 8, top: '#1A1416', bot: '#0C0A0B' },
  eyeW:   { i: 9, top: '#FFFFFF', bot: '#F1F1F4' },
  lip:    { i: 10, top: '#FFA36B', bot: '#E0603A' },
  mouth:  { i: 11, top: '#5A1E1A', bot: '#2E0E0C' },
  brow:   { i: 12, top: '#D8401C', bot: '#8E220C' },
  goldD:  { i: 13, top: '#E8B030', bot: '#A86A08' },
};
const P = PALETTE;

// uv inside a swatch cell (copy of kit's private helper)
function swUV(sw, t, u = 0.5) {
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  return [(x + 24 + u * 80) / 1024, (y + 16 + THREE.MathUtils.clamp(t, 0, 1) * 96) / 1024];
}

// orange koi patches (ellipsoids, mirrored by |x|): [cx, cy, cz, rx, ry, rz]
const PATCHES = [
  [0.0, 0.93, 0.13, 0.115, 0.115, 0.17],  // tancho cap between/above the eyes
  [0.0, 0.95, -0.03, 0.09, 0.09, 0.09],  // cap trailing back
  [0.13, 0.84, -0.1, 0.1, 0.1, 0.07],    // patches behind the gills
  [0.0, 0.52, -0.17, 0.15, 0.13, 0.12],  // back saddle
  [0.19, 0.38, 0.02, 0.07, 0.07, 0.08],  // side spot
  [0.17, 0.5, -0.12, 0.07, 0.06, 0.06],  // upper flank spot
  [0.0, 0.33, -0.33, 0.12, 0.1, 0.08],   // tail band
  [0.115, 0.215, 0.0, 0.12, 0.065, 0.13], // thighs
];
const inPatch = (c) => PATCHES.some(([x, y, z, rx, ry, rz]) =>
  ((Math.abs(c.x) - x) / rx) ** 2 + ((c.y - y) / ry) ** 2 + ((c.z - z) / rz) ** 2 < 1);

// per-triangle koi painting: each facet is either white or orange (crisp faceted patches)
function koi(g, lo, hi) {
  const p = g.attributes.position, uv = [];
  for (let i = 0; i < p.count; i += 3) {
    const c = V(0, 0, 0);
    for (let k = 0; k < 3; k++) c.add(V(p.getX(i + k), p.getY(i + k), p.getZ(i + k)));
    c.divideScalar(3);
    const sw = inPatch(c) ? P.orange : P.white;
    for (let k = 0; k < 3; k++) uv.push(...swUV(sw, 1 - (p.getY(i + k) - lo) / (hi - lo)));
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
// gradient by distance from a base point (fins: orange base -> pale flowing tips)
function radial(g, sw, base, len) {
  const p = g.attributes.position, uv = [];
  for (let i = 0; i < p.count; i++) uv.push(...swUV(sw, V(p.getX(i), p.getY(i), p.getZ(i)).distanceTo(base) / len));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

export function buildGeometry() {
  const C = [], S = [];
  const flat = (g, sw) => paint(g, sw, 'flat');

  // symmetric faceted blade: base b, dir d, plane normal n, half-width w, length l, half-thickness th.
  // bends toward d2 for the last part of its length (flowing tip)
  const blade = (b, d, n, w, l, th = 0.012, d2 = null, bend = 0.4) => {
    d = d.clone().normalize(); n = n.clone().normalize();
    const sd = new THREE.Vector3().crossVectors(d, n).normalize();
    n = new THREE.Vector3().crossVectors(sd, d).normalize();
    const at = (o, u, v, h, dd = d) => o.clone().addScaledVector(dd, u).addScaledVector(sd, v).addScaledVector(n, h);
    const l1 = d2 ? l * (1 - bend) : l;
    const pts1 = [];
    for (const h of [-th, th]) pts1.push(at(b, 0, w * 0.7, h), at(b, 0, -w * 0.7, h), at(b, l1 * 0.45, w, h), at(b, l1 * 0.45, -w, h));
    const parts = [];
    if (!d2) { pts1.push(at(b, l, 0, 0)); parts.push(hull(pts1)); return parts; }
    const m = b.clone().addScaledVector(d, l1);
    for (const h of [-th, th]) pts1.push(at(m, 0, w * 0.6, h * 0.8), at(m, 0, -w * 0.6, h * 0.8));
    parts.push(hull(pts1));
    d2 = d2.clone().normalize();
    const pts2 = [];
    for (const h of [-th * 0.8, th * 0.8]) pts2.push(at(m, -0.01, w * 0.6, h, d), at(m, -0.01, -w * 0.6, h, d));
    pts2.push(m.clone().addScaledVector(d2, l - l1));
    pts2.push(m.clone().addScaledVector(d2, (l - l1) * 0.5).addScaledVector(sd, w * 0.35));
    parts.push(hull(pts2));
    return parts;
  };
  const finTo = (arr, b, d, n, w, l, th, d2, bend, sw = P.fin, rays = false) => {
    for (const g of blade(b, d, n, w, l, th, d2, bend)) arr.push(radial(g, sw, b, l));
    if (!rays) return;
    // thin darker ray ridges along the blade (both faces)
    const dn = d.clone().normalize(), nn = n.clone().normalize();
    const sd = new THREE.Vector3().crossVectors(dn, nn).normalize(), nf = new THREE.Vector3().crossVectors(sd, dn).normalize();
    const l1 = d2 ? l * (1 - bend) : l * 0.8;
    const m = b.clone().addScaledVector(dn, l1);
    const tip = d2 ? m.clone().addScaledVector(d2.clone().normalize(), (l - l1) * 0.8) : m;
    for (const off of [-0.45, 0.45]) {
      const o = sd.clone().multiplyScalar(w * off);
      const a0 = b.clone().add(o).addScaledVector(dn, 0.02), a1 = m.clone().add(o.clone().multiplyScalar(0.55));
      const rid = (p, q, k) => hull([p, q].flatMap((x, j) => [-1, 1].flatMap((sg) => [-1, 1].map((sh) =>
        x.clone().addScaledVector(sd, sg * 0.004 * (j ? k : 1)).addScaledVector(nf, sh * (th + 0.004) * (j ? k : 1))))));
      arr.push(paint(rid(a0, a1, 0.8), P.ray, 'y', [Math.min(a0.y, a1.y) - 0.01, Math.max(a0.y, a1.y) + 0.01]));
      if (d2) arr.push(paint(rid(a1, tip.clone().add(o.clone().multiplyScalar(0.2)), 0.5), P.ray, 'flat'));
    }
  };

  // ================= BODY (plump upright fish body, tapering back into the tail stem) =================
  const BODY = [
    [0.17, 0.11, 0.1, -0.02],
    [0.25, 0.172, 0.172, 0.0],
    [0.35, 0.2, 0.2, 0.02],
    [0.46, 0.2, 0.19, 0.02],
    [0.56, 0.18, 0.17, 0.02],
    [0.64, 0.155, 0.15, 0.03],
  ];
  C.push(koi(hull([
    ...BODY.flatMap(([y, rx, rz, z]) => ring(V(0, y, z), rx, rz, 12, 'y', Math.PI / 12)),
    ...ring(V(0, 0.38, -0.24), 0.1, 0.12, 8, 'z'),
  ]), 0.15, 0.7));
  const sec = (y) => {
    for (let i = 0; i < BODY.length - 1; i++) if (y <= BODY[i + 1][0]) {
      const t = (y - BODY[i][0]) / (BODY[i + 1][0] - BODY[i][0]);
      return BODY[i].map((v, k) => v + (BODY[i + 1][k] - v) * t);
    }
    return BODY[BODY.length - 1];
  };
  // big shallow scale plates on the flanks (2 overlapping rows): U-shaped shells proud of the body
  const scale = (a, y1, y0, da, sOut) => {
    const pts = [];
    const at = (ang, y, s) => { const [, rx, rz, z] = sec(y); return V(Math.cos(ang) * rx * s, y, z + Math.sin(ang) * rz * s); };
    for (const [ang, y, k] of [[a - da, y1, 1], [a + da, y1, 1], [a - da * 1.05, (y1 + y0) / 2 + 0.01, 1.03],
      [a + da * 1.05, (y1 + y0) / 2 + 0.01, 1.03], [a - da * 0.55, y0 + 0.012, 1.07], [a + da * 0.55, y0 + 0.012, 1.07], [a, y0, 1.09]]) {
      pts.push(at(ang, y, sOut * k), at(ang, y, 0.9));
    }
    return koi(hull(pts), y0 - 0.03, y1 + 0.02);
  };
  for (const [a, y1, y0] of [[0.12, 0.52, 0.42], [-0.42, 0.52, 0.42], [-0.15, 0.43, 0.33], [0.38, 0.43, 0.33], [-0.68, 0.43, 0.34]])
    S.push(scale(a, y1, y0, 0.24, 1.065));

  // ================= TAIL (thick peduncle curving back, big split tail fin) =================
  C.push(koi(tube(curveSamples(
    [V(0, 0.37, -0.12), V(0, 0.34, -0.24), V(0, 0.345, -0.35), V(0, 0.38, -0.44)],
    6, (t) => 0.1 - 0.055 * t, (t) => 0.12 - 0.06 * t),
    { seg: 8, axis: V(1, 0, 0), capEnd: 0.03 }), 0.2, 0.55));
  const TB = V(0, 0.385, -0.45), XN = V(1, 0, 0);
  // upper lobe
  finTo(C, TB.clone(), V(0, 0.75, -1), XN, 0.075, 0.38, 0.014, V(0, 0.2, -1), 0.4, P.fin, true);
  finTo(C, TB.clone().add(V(0, 0.01, 0.01)), V(0, 1.4, -0.6), XN, 0.06, 0.32, 0.012, V(0, 0.6, -1), 0.4, P.fin, true);
  // lower lobe
  finTo(C, TB.clone(), V(0, -0.75, -1), XN, 0.075, 0.34, 0.014, V(0, -0.2, -1), 0.4, P.fin, true);
  finTo(C, TB.clone().add(V(0, -0.01, 0.01)), V(0, -1.1, -0.75), XN, 0.06, 0.26, 0.012, V(0, -0.6, -1), 0.4, P.fin, true);
  // centre notch filler
  finTo(C, TB.clone(), V(0, 0.05, -1), XN, 0.06, 0.15, 0.013);

  // ventral (anal) fin under the tail root
  finTo(C, V(0, 0.29, -0.2), V(0, -0.8, -0.8), XN, 0.045, 0.13, 0.011, V(0, -0.3, -1), 0.4);

  // ================= HEAD (big faceted bullet tapering forward to a round snout) =================
  const H = { y: 0.8, z: 0.07 };
  const headPts = [
    ...ring(V(0, 0.79, -0.12), 0.165, 0.155, 12, 'z', 0),
    ...ring(V(0, 0.8, -0.02), 0.205, 0.19, 12, 'z', 0),
    ...ring(V(0, 0.8, 0.09), 0.2, 0.18, 12, 'z', 0),
    ...ring(V(0, 0.78, 0.18), 0.162, 0.142, 12, 'z', 0),
    ...ring(V(0, 0.75, 0.25), 0.112, 0.1, 10, 'z', 0),
    ...ring(V(0, 0.73, 0.295), 0.068, 0.062, 8, 'z', Math.PI / 8),
  ];
  C.push(koi(hull(headPts), 0.6, 1.0));
  const SN = V(0, 0.725, 0.3); // snout tip
  // round koi lips at the very front tip, with a dark round mouth
  C.push(paint(hull([...ring(V(0, SN.y - 0.005, SN.z - 0.01), 0.058, 0.045, 8, 'z', Math.PI / 8),
    ...ring(V(0, SN.y - 0.008, SN.z + 0.035), 0.047, 0.034, 8, 'z', Math.PI / 8)]), P.lip, 'y', [SN.y - 0.05, SN.y + 0.04]));
  C.push(paint(hull([...ring(V(0, SN.y - 0.008, SN.z + 0.03), 0.03, 0.017, 8, 'z', Math.PI / 8),
    ...ring(V(0, SN.y - 0.008, SN.z + 0.039), 0.026, 0.013, 8, 'z', Math.PI / 8)]), P.mouth, 'flat'));

  // barbels: from the lip corners, sweeping outward and back to frame the face, flowing tips
  S.push(paint(tube(curveSamples(
    [V(0.045, SN.y - 0.012, SN.z + 0.012), V(0.11, SN.y - 0.022, SN.z + 0.02), V(0.19, SN.y - 0.05, SN.z - 0.01),
      V(0.25, SN.y - 0.1, SN.z - 0.07), V(0.3, SN.y - 0.13, SN.z - 0.12), V(0.335, SN.y - 0.165, SN.z - 0.16)],
    10, (t) => 0.022 - 0.016 * t), { seg: 5, capEnd: 0.012 }), P.lip, 'len'));

  // eyes on the upper front-sides, seated on flattened eye-patch facets angled slightly forward
  const EN = V(0.56, 0.2, 0.8).normalize();
  const EU = new THREE.Vector3().crossVectors(V(0, 1, 0), EN).normalize();   // outward along the face
  const EV = new THREE.Vector3().crossVectors(EN, EU).normalize();           // up along the face
  const ED = Math.max(...headPts.filter((p) => p.x >= 0).map((p) => p.dot(EN)));
  const EQ = V(0.105, 0.815, 0.17);
  const EC = EQ.clone().addScaledVector(EN, ED - EQ.dot(EN)); // eye centre on the tangent plane
  const eplate = (pts2d, c, h0, h1, k = 1) => hull(pts2d.flatMap(([u, v]) => [h0, h1].map((h) =>
    c.clone().addScaledVector(EU, u * k).addScaledVector(EV, v * k).addScaledVector(EN, h))));
  const ek = 1.22;
  // eye-patch facet (body white), sinking back into the head
  S.push(koi(eplate([[-0.065, 0.025], [0.06, 0.06], [0.08, -0.0], [0.045, -0.065], [-0.04, -0.065], [-0.075, -0.02]], EC, -0.06, 0.003), 0.6, 1.0));
  S.push(flat(eplate([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]], EC, -0.004, 0.012, ek), P.eyeW));
  S.push(flat(eplate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]],
    EC.clone().addScaledVector(EU, -0.006), 0.006, 0.018, ek), P.eye));
  S.push(flat(eplate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    EC.clone().addScaledVector(EU, 0.003).addScaledVector(EV, 0.004), 0.014, 0.022, ek), P.eyeW));
  // heavy brow ridge slanting down toward the snout
  {
    const bp = [];
    for (const [u, v0, v1] of [[-0.05, 0.02, 0.048], [0.0, 0.034, 0.064], [0.032, 0.042, 0.068]])
      for (const [v, h] of [[v0, u < 0 ? 0.016 : u > 0.01 ? 0.004 : 0.011], [v1, u < 0 ? 0.006 : u > 0.01 ? -0.004 : 0.003], [v0, -0.04], [v1, -0.045]])
        bp.push(EC.clone().addScaledVector(EU, u * ek).addScaledVector(EV, v * ek).addScaledVector(EN, h));
    S.push(paint(hull(bp), P.brow, 'y'));
  }

  // gold gill guards (cheek armour) with rune
  S.push(paint(hull([
    V(0.198, H.y + 0.07, -0.0), V(0.216, H.y - 0.03, 0.05), V(0.19, H.y - 0.13, 0.02),
    V(0.208, H.y - 0.02, -0.08), V(0.15, H.y + 0.08, -0.07), V(0.16, H.y - 0.12, -0.06),
    V(0.15, H.y + 0.07, 0.03),
  ]), P.gold, 'y', [H.y - 0.14, H.y + 0.08]));
  S.push(flat(hull([V(0.216, H.y + 0.02, -0.03), V(0.223, H.y - 0.05, 0.0), V(0.216, H.y - 0.05, -0.05),
    V(0.2, H.y + 0.02, -0.03), V(0.2, H.y - 0.05, 0.0), V(0.2, H.y - 0.05, -0.05)]), P.rune));

  // gold crest rising from the tancho cap, with jade gem
  C.push(paint(hull([
    ...plate([[-0.05, 0.0], [0.05, 0.0], [0.03, 0.06], [0, 0.1], [-0.03, 0.06]], V(0, 0.955, 0), 0.115, 0.14),
    V(0, 0.95, 0.075),
  ]), P.gold, 'y', [0.95, 1.06]));
  C.push(paint(hull([V(0, 1.03, 0.148), V(0.022, 1.003, 0.146), V(-0.022, 1.003, 0.146),
    V(0, 0.976, 0.148), V(0, 1.003, 0.16), V(0, 1.003, 0.13)]), P.jade, 'y'));

  // dorsal fin: flowing faceted rays along the back of head and body
  const DORSAL = [
    [0.94, 0.01, 1, -0.3, 0.17, 0.05],
    [0.89, -0.06, 0.75, -0.75, 0.21, 0.055],
    [0.76, -0.08, 0.4, -1, 0.22, 0.055],
    [0.62, -0.1, 0.25, -1, 0.2, 0.05],
    [0.49, -0.155, 0.1, -1, 0.16, 0.045],
  ];
  for (const [y, z, dy, dz, l, w] of DORSAL)
    finTo(C, V(0, y, z), V(0, dy, dz), XN, w, l, 0.013, V(0, dy - 0.6, dz - 0.3), 0.35, P.fin, true);
  // webbing between the rays
  for (let i = 0; i < DORSAL.length - 1; i++) {
    const pts = [];
    for (const [y, z, dy, dz] of [DORSAL[i], DORSAL[i + 1]]) {
      const d = V(0, dy, dz).normalize();
      for (const x of [-0.009, 0.009]) pts.push(V(x, y, z), V(x, y, z).addScaledVector(d, 0.1));
    }
    C.push(radial(hull(pts), P.fin, V(0, DORSAL[i][0], DORSAL[i][1]), 0.22));
  }

  // ================= PECTORAL FINS (arms) with gold pauldrons =================
  const SH = V(0.18, 0.53, 0.03);
  for (const [d, d2, l, w] of [
    [V(1, -0.3, 0.35), V(0.6, -1, 0.3), 0.26, 0.06],
    [V(1, -0.75, 0.0), V(0.4, -1, -0.1), 0.3, 0.06],
    [V(0.7, -1, -0.45), V(0.2, -1, -0.5), 0.25, 0.055],
  ]) finTo(S, SH.clone(), d, V(0, 0.4, 1).cross(d).cross(d).negate(), w, l, 0.013, d2, 0.4);
  S.push(paint(hull([
    ...ring(V(0.17, 0.6, 0.03), 0.07, 0.08, 6, 'y'), ...ring(V(0.21, 0.55, 0.03), 0.075, 0.09, 6, 'y'),
    V(0.25, 0.5, 0.03),
  ]), P.gold, 'y', [0.48, 0.64]));
  S.push(flat(hull([V(0.235, 0.575, 0.12), V(0.25, 0.55, 0.12), V(0.235, 0.575, 0.1), V(0.25, 0.55, 0.1), V(0.248, 0.6, 0.02), V(0.265, 0.56, 0.02)]), P.rune));

  // ================= ARMOUR: breastplate, jade gem, runes =================
  const shell = (y0, y1, a0, a1, s = 1.06, n = 6) => {
    const pts = [];
    for (const y of [y0, y1]) {
      const [, rx, rz, z] = sec(y);
      for (let k = 0; k <= n; k++) {
        const a = a0 + (a1 - a0) * k / n;
        pts.push(V(Math.cos(a) * rx * s, y, z + Math.sin(a) * rz * s));
        pts.push(V(Math.cos(a) * rx * 0.85, y, z + Math.sin(a) * rz * 0.85));
      }
    }
    return hull(pts);
  };
  C.push(paint(shell(0.4, 0.6, Math.PI * 0.26, Math.PI * 0.74, 1.07), P.gold, 'y', [0.38, 0.62]));
  C.push(paint(shell(0.385, 0.415, Math.PI * 0.22, Math.PI * 0.78, 1.1), P.goldD, 'flat'));
  const BZ = 0.213; // breastplate front
  const GY = 0.5;
  C.push(paint(hull([V(0, GY + 0.035, BZ + 0.028), V(0.028, GY, BZ + 0.024), V(-0.028, GY, BZ + 0.024), V(0, GY - 0.035, BZ + 0.028),
    V(0, GY, BZ + 0.048), V(0, GY + 0.035, BZ), V(0.028, GY, BZ), V(-0.028, GY, BZ), V(0, GY - 0.035, BZ)]), P.jade, 'y', [GY - 0.035, GY + 0.035]));
  // glowing rune diamond framing the gem + rune ticks
  const bar = (a, b, w, z0, z1) => {
    const d = b.clone().sub(a), n = V(-d.y, d.x, 0).normalize().multiplyScalar(w);
    return hull([a, b].flatMap((p) => [-1, 1].flatMap((s) => [z0, z1].map((z) => V(p.x + n.x * s, p.y + n.y * s, z)))));
  };
  S.push(flat(bar(V(0.0, GY + 0.065, 0), V(0.06, GY, 0), 0.007, BZ + 0.025, BZ - 0.01), P.rune));
  S.push(flat(bar(V(0.06, GY, 0), V(0.0, GY - 0.065, 0), 0.007, BZ + 0.025, BZ - 0.01), P.rune));
  S.push(flat(bar(V(0.09, GY + 0.05, 0), V(0.105, GY - 0.03, 0), 0.006, BZ + 0.004, BZ - 0.02), P.rune));
  C.push(flat(bar(V(0, GY - 0.08, 0), V(0, GY - 0.075, 0), 0.006, BZ + 0.03, BZ), P.rune));
  // rune chevrons on the thighs
  S.push(flat(bar(V(0.08, 0.215, 0), V(0.105, 0.19, 0), 0.006, 0.105, 0.075), P.rune));
  S.push(flat(bar(V(0.105, 0.19, 0), V(0.13, 0.215, 0), 0.006, 0.105, 0.075), P.rune));

  // ================= SILK SASH (waist band, front knot, flowing tails) =================
  C.push(paint(hull([...ring(V(0, 0.26, 0.002), 0.182, 0.182, 12, 'y', Math.PI / 12), ...ring(V(0, 0.32, 0.015), 0.202, 0.202, 12, 'y', Math.PI / 12)]),
    P.silk, 'y', [0.24, 0.34]));
  C.push(paint(hull(cbox(V(0, 0.29, 0.205), 0.04, 0.035, 0.025, 0.012)), P.silk, 'flat'));
  const ribbon = (pts, w, th, n, side = V(0.7, 0, -0.3), lo = 0.0, hi = 0.34) => {
    side = side.clone().normalize();
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], wa = w * (1 - 0.25 * i / pts.length), wb = w * (1 - 0.25 * (i + 1) / pts.length);
      const q = [];
      for (const [p, ww] of [[a, wa], [b, wb]]) for (const s of [-1, 1]) for (const h of [-th, th])
        q.push(p.clone().addScaledVector(n, h).addScaledVector(side, s * ww));
      out.push(paint(hull(q), P.silk, 'y', [lo, hi]));
    }
    return out;
  };
  // bow loops
  S.push(paint(hull([V(0.03, 0.29, 0.22), V(0.03, 0.3, 0.195), V(0.1, 0.33, 0.2), V(0.11, 0.3, 0.195), V(0.1, 0.33, 0.18), V(0.11, 0.3, 0.18)]), P.silk, 'y', [0.26, 0.34]));
  S.push(...ribbon([V(0.03, 0.28, 0.225), V(0.07, 0.21, 0.235), V(0.09, 0.14, 0.235), V(0.115, 0.08, 0.215)], 0.024, 0.006, V(0, 0, 1)));

  // hachimaki-style silk ribbons tied at the back of the head, streaming back
  C.push(paint(hull(cbox(V(0, H.y + 0.08, H.z - 0.195), 0.035, 0.03, 0.025, 0.01)), P.silk, 'y', [H.y + 0.04, H.y + 0.12]));
  S.push(...ribbon([V(0.02, H.y + 0.08, H.z - 0.21), V(0.05, H.y + 0.04, H.z - 0.28), V(0.07, H.y - 0.04, H.z - 0.34),
    V(0.1, H.y - 0.13, H.z - 0.37)], 0.034, 0.007, V(1, 0, 0.2), V(0, 0.4, 1), H.y - 0.2, H.y + 0.1));
  S.push(paint(hull([V(0.02, H.y + 0.085, H.z - 0.205), V(0.02, H.y + 0.085, H.z - 0.225), V(0.02, H.y + 0.07, H.z - 0.215),
    V(0.09, H.y + 0.12, H.z - 0.22), V(0.1, H.y + 0.06, H.z - 0.23), V(0.09, H.y + 0.12, H.z - 0.24), V(0.1, H.y + 0.06, H.z - 0.25)]),
    P.silk, 'y', [H.y + 0.04, H.y + 0.13]));

  // ================= FIN LEGS (thick fin-shaped columns, flared fan feet) =================
  const LX = 0.115;
  S.push(koi(hull([
    ...ring(V(LX - 0.01, 0.27, 0.0), 0.085, 0.09, 8, 'y'),
    ...ring(V(LX + 0.005, 0.16, 0.01), 0.07, 0.075, 8, 'y'),
    ...ring(V(LX + 0.015, 0.075, 0.02), 0.055, 0.06, 8, 'y'),
  ]), 0.05, 0.3));
  // gold ankle cuff with jade
  S.push(paint(hull([...ring(V(LX + 0.015, 0.075, 0.02), 0.065, 0.07, 8, 'y'), ...ring(V(LX + 0.012, 0.11, 0.017), 0.068, 0.073, 8, 'y')]),
    P.gold, 'y', [0.07, 0.12]));
  S.push(paint(hull([V(LX + 0.015, 0.105, 0.098), V(LX + 0.03, 0.093, 0.094), V(LX, 0.093, 0.094), V(LX + 0.015, 0.08, 0.094),
    V(LX + 0.015, 0.093, 0.105), V(LX + 0.015, 0.093, 0.08)]), P.jade, 'y'));
  // outer leg fins flaring out and back (fin legs)
  finTo(S, V(LX + 0.07, 0.22, -0.01), V(1, -0.25, -0.55), V(0.2, 1, 0.1).cross(V(1, -0.25, -0.55)), 0.045, 0.14, 0.011, V(0.5, -0.6, -1), 0.4);
  finTo(S, V(LX + 0.06, 0.16, -0.02), V(0.9, -0.6, -0.6), V(0.2, 1, 0.1).cross(V(0.9, -0.6, -0.6)), 0.04, 0.12, 0.011, V(0.4, -1, -0.7), 0.4);
  // calf fin flaring back
  finTo(S, V(LX + 0.04, 0.2, -0.04), V(0.5, -0.3, -1), V(1, 0.1, 0.3), 0.045, 0.13, 0.011, V(0.3, -0.8, -1), 0.4);
  // fan foot: a flat flared fin plate with raised rays
  const FC = V(LX + 0.02, 0, 0.04);
  const fan = [];
  for (let k = -3; k <= 3; k++) {
    const a = k * 0.32, r = 0.115 + (k % 2 === 0 ? 0.012 : 0);
    const p = V(FC.x + Math.sin(a) * r, 0, FC.z + Math.cos(a) * r);
    fan.push(p, p.clone().setY(0.022));
  }
  fan.push(...ring(V(FC.x, 0, FC.z - 0.04), 0.05, 0.04, 6, 'y'), ...ring(V(FC.x, 0.075, FC.z - 0.02), 0.05, 0.05, 6, 'y'));
  S.push(radial(hull(fan), P.fin, V(FC.x, 0.08, FC.z - 0.03), 0.17));
  for (const k of [-2, 0, 2]) {
    const a = k * 0.32, d = V(Math.sin(a), 0, Math.cos(a));
    S.push(paint(hull([
      V(FC.x, 0.06, FC.z).addScaledVector(d, 0.02), V(FC.x, 0.0, FC.z).addScaledVector(d, 0.137),
      V(FC.x, 0.03, FC.z).addScaledVector(d, 0.13),
      V(FC.x, 0.0, FC.z).addScaledVector(d, 0.03).add(V(d.z * 0.012, 0, -d.x * 0.012)),
      V(FC.x, 0.0, FC.z).addScaledVector(d, 0.03).add(V(-d.z * 0.012, 0, d.x * 0.012)),
      V(FC.x, 0.04, FC.z).addScaledVector(d, 0.03).add(V(d.z * 0.012, 0, -d.x * 0.012)),
      V(FC.x, 0.04, FC.z).addScaledVector(d, 0.03).add(V(-d.z * 0.012, 0, d.x * 0.012)),
    ]), P.gold, 'y', [0, 0.06]));
  }

  // ================= CHERRY BLOSSOMS =================
  const blossom = (arr, c, n, r = 0.045) => {
    n = n.clone().normalize();
    const u = new THREE.Vector3().crossVectors(n, Math.abs(n.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0)).normalize();
    const v = new THREE.Vector3().crossVectors(n, u).normalize();
    for (let k = 0; k < 5; k++) {
      const a = (2 * Math.PI * k) / 5 + Math.PI / 2, a1 = a - 0.42, a2 = a + 0.42;
      const dir = (ang, rr) => c.clone().addScaledVector(u, Math.cos(ang) * rr).addScaledVector(v, Math.sin(ang) * rr);
      const pts = [];
      for (const h of [-0.005, 0.006]) {
        const o = n.clone().multiplyScalar(h);
        pts.push(c.clone().add(o), dir(a1, r * 0.75).add(o), dir(a2, r * 0.75).add(o),
          dir(a - 0.14, r).add(o).addScaledVector(n, 0.006), dir(a + 0.14, r).add(o).addScaledVector(n, 0.006), dir(a, r * 0.86).add(o));
      }
      arr.push(paint(hull(pts), P.petal, 'flat'));
    }
    arr.push(paint(hull([c.clone().addScaledVector(n, 0.016), ...[0, 1, 2, 3, 4].map((k) =>
      c.clone().addScaledVector(n, 0.004).addScaledVector(u, Math.cos(k * 1.2566) * r * 0.28).addScaledVector(v, Math.sin(k * 1.2566) * r * 0.28))]), P.gold, 'flat'));
  };
  // hair-ornament blossoms beside the crest
  blossom(S, V(0.145, 0.93, 0.0), V(0.65, 0.75, 0.0), 0.05);
  // blossom on each pauldron
  blossom(S, V(0.215, 0.61, 0.075), V(0.4, 0.7, 0.7), 0.04);
  // blossom at the sash knot
  blossom(C, V(0, 0.29, 0.233), V(0, 0.1, 1), 0.04);
  // blossom at the tail-fin base
  blossom(S, V(0.022, 0.39, -0.44), V(1, 0, 0), 0.04);

  return assemble(C, S);
}

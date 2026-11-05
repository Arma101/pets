// Mammoth Masher (Legendary, Frozen Peaks): brown woolly mammoth with long ivory tusks, round ears,
// shaggy frost-tipped shard fur, ornate ice-steel armour with gold trim, ice crystals and glowing ice-cyan eyes.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// woolly fur swatch: brown -> warm tan -> cream -> pale frosty blue at the very tip (soft gradient)
const frostFur = (stops) => (g, x, y) => {
  const gr = g.createLinearGradient(0, y + 16, 0, y + 112);
  for (const [t, c] of stops) gr.addColorStop(t, c);
  g.fillStyle = stops[0][1]; g.fillRect(x, y, 128, 16);
  g.fillStyle = gr; g.fillRect(x, y + 16, 128, 96);
  g.fillStyle = stops[stops.length - 1][1]; g.fillRect(x, y + 112, 128, 16);
};

export const PALETTE = {
  body:    { i: 0, top: '#9A643A', bot: '#5E3A20' },
  fur:     { i: 1, draw: frostFur([[0, '#8A5832'], [0.5, '#6E4426'], [0.72, '#A87A52'], [0.86, '#E2CFB2'], [1, '#CDEBF7']]) },
  furD:    { i: 2, top: '#7A4D2B', bot: '#4E2F19' },
  tusk:    { i: 3, top: '#F3E7CC', bot: '#FFFFFF' },      // 'len': warm ivory base -> white tip
  gold:    { i: 4, top: '#FFDA5C', bot: '#D69A1E' },
  armor:   { i: 5, top: '#6CCBFF', bot: '#1F63C8' },
  white:   { i: 6, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:     { i: 7, top: '#1A1416', bot: '#0C0A0B' },
  glow:    { i: 8, top: '#A8F8FF', bot: '#3FD8FF', glow: true },
  brow:    { i: 9, top: '#7E5030', bot: '#4A2C17' },
  ice:     { i: 10, top: '#F4FEFF', bot: '#7AD8F7' },
  nail:    { i: 11, top: '#F6E9CC', bot: '#D2B98C' },
  pad:     { i: 12, top: '#6D4A33', bot: '#4A3122' },
  ear:     { i: 13, top: '#865330', bot: '#58351D' },
  earIn:   { i: 14, top: '#B07A55', bot: '#8A5A3A' },
  trunk:   { i: 15, top: '#94603A', bot: '#6E4428' },
  mouth:   { i: 16, top: '#4A2616', bot: '#2E160C' },
};
const SW = PALETTE;

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const body = (pts, lo = 0.1, hi = 0.85) => paint(hull(pts), SW.body, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');
  const fur = (b, d, w, l, fl = 0.55) => {
    const g = shard(b, d, w, l, 4, fl);
    return paint(g, SW.fur, 'y');
  };
  // broad hanging wool lock: a chunky drape lying on the surface (outward n), hanging along d
  const lock = (p, n, d, w, l, { flare = 0.04, th = 0.03 } = {}) => {
    n = n.clone().normalize(); d = d.clone().normalize();
    const u = new THREE.Vector3().crossVectors(d, n).normalize();
    const at = (a, b, o) => p.clone().addScaledVector(d, a).addScaledVector(u, b).addScaledVector(n, o);
    return paint(hull([
      at(0, w, -0.02), at(0, -w, -0.02), at(0, w * 0.9, th), at(0, -w * 0.9, th),
      at(l * 0.55, w * 0.95, flare * 0.6), at(l * 0.55, -w * 0.95, flare * 0.6),
      at(l * 0.55, w * 0.85, flare * 0.6 + th), at(l * 0.55, -w * 0.85, flare * 0.6 + th),
      at(l * 0.92, w * 0.45, flare), at(l * 0.92, -w * 0.45, flare), at(l * 1.08, 0, flare + th * 0.5),
      at(l * 0.85, 0, flare + th),
    ]), SW.fur, 'y');
  };

  // ================= BODY (massive barrel, high shoulders sloping to the hips) =================
  const BR = [ // [z, cy, rx, ry]
    [-0.37, 0.44, 0.14, 0.13], [-0.3, 0.45, 0.23, 0.22], [-0.14, 0.48, 0.28, 0.26],
    [0.02, 0.52, 0.3, 0.29], [0.16, 0.55, 0.28, 0.29], [0.27, 0.57, 0.2, 0.21]];
  C.push(body(BR.flatMap(([z, cy, rx, ry]) => ring(V(0, cy, z), rx, ry, 10, 'z')), 0.18, 0.84));
  const bodyAt = (z) => { // interpolated cross-section
    for (let i = 0; i < BR.length - 1; i++) if (z <= BR[i + 1][0]) {
      const a = BR[i], b = BR[i + 1], t = (z - a[0]) / (b[0] - a[0]);
      return a.map((v, j) => v + (b[j] - v) * t);
    }
    return BR[BR.length - 1];
  };
  const onBody = (z, deg, off = 0) => {
    const [, cy, rx, ry] = bodyAt(z), th = (deg * Math.PI) / 180;
    return { p: V(Math.cos(th) * (rx + off), cy + Math.sin(th) * (ry + off), z), n: V(Math.cos(th), Math.sin(th), 0) };
  };

  const H = { y: 0.67, z: 0.37 };
  // ================= LEGS (short thick pillars) =================
  const LF = V(0.19, 0, 0.17), LB = V(0.185, 0, -0.235);
  for (const L of [LF, LB]) {
    S.push(body([...ring(V(L.x, 0.07, L.z), 0.1, 0.1, 8), ...ring(V(L.x, 0.2, L.z), 0.105, 0.105, 8),
      ...ring(V(L.x - 0.01, 0.4, L.z), 0.13, 0.135, 8)], 0.02, 0.7));
    // round elephant foot pad + 3 ivory toenails
    S.push(paint(hull([...ring(V(L.x, 0.0, L.z), 0.114, 0.114, 10, 'y'), ...ring(V(L.x, 0.075, L.z), 0.11, 0.11, 10, 'y')]), SW.pad, 'y', [0, 0.08]));
    S.push(paint(hull([...ring(V(L.x, 0.07, L.z), 0.12, 0.12, 10, 'y'), ...ring(V(L.x, 0.105, L.z), 0.117, 0.117, 10, 'y')]), SW.gold, 'y', [0.06, 0.11]));
    for (const [dx, dz] of [[-0.062, 0.088], [0, 0.108], [0.062, 0.088]])
      S.push(paint(hull(cbox(V(L.x + dx, 0.032, L.z + dz), 0.03, 0.032, 0.02, 0.01)), SW.nail, 'y', [0, 0.065]));
    // shaggy fringe around the knee hanging down
    for (const a of [0, 72, 144, 216, 288]) {
      const th = (a * Math.PI) / 180, n = V(Math.sin(th), 0, Math.cos(th));
      S.push(lock(V(L.x + n.x * 0.11, 0.33, L.z + n.z * 0.11), n, V(0, -1, 0), 0.075, 0.15, { flare: 0.03 }));
    }
  }

  // ================= SHAGGY BODY FUR (overlapping curtains of broad wool locks) =================
  // tiers from the back (under the saddle edge) down to the belly; lower tiers longer and in front
  for (const [deg, zs, w, l, off] of [
    [30, [0.2, 0.06, -0.08, -0.22], 0.085, 0.17, -0.03],
    [2, [0.24, 0.13, -0.01, -0.15, -0.27], 0.09, 0.2, -0.015],
    [-34, [0.2, 0.06, -0.08, -0.21], 0.1, 0.2, 0.0],
  ]) {
    for (const z of zs) {
      const { p, n } = onBody(z, deg, off);
      const back = z < -0.24 ? -0.5 : 0;
      S.push(lock(p, n, V(n.x * 0.12, -1, -0.08 + back), w, l, { flare: 0.05 }));
    }
  }
  // belly curtain hanging straight down
  for (const z of [0.15, 0.0, -0.15]) {
    const { p } = onBody(z, -62, -0.02);
    S.push(lock(p, V(1, -0.3, 0), V(0, -1, 0), 0.09, 0.12, { flare: 0.02 }));
  }
  // thick shoulder / neck wool cascading down behind the head
  for (const deg of [75, 45]) {
    const { p, n } = onBody(0.22, deg, -0.02);
    S.push(lock(p, n, V(n.x * 0.3, -1, -0.35), 0.09, 0.2, { flare: 0.05 }));
  }
  // shaggy beard hanging under the head / jaw
  S.push(lock(V(0.12, H.y - 0.1, H.z + 0.06), V(0.4, 0, 1), V(0.1, -1, 0), 0.075, 0.2, { flare: 0.03 }));
  S.push(lock(V(0.2, H.y - 0.02, H.z - 0.04), V(1, 0, 0.3), V(0.1, -1, -0.1), 0.08, 0.22, { flare: 0.04 }));
  // chest / throat fringe
  C.push(lock(V(0, 0.42, 0.3), V(0, 0, 1), V(0, -1, 0.1), 0.085, 0.22, { flare: 0.04 }));
  S.push(lock(V(0.13, 0.42, 0.28), V(0.6, 0, 1), V(0.1, -1, 0.1), 0.085, 0.22, { flare: 0.04 }));
  // rump fringe
  for (const [deg, z, l] of [[90, -0.3, 0.2], [58, -0.3, 0.22], [25, -0.3, 0.22], [-10, -0.32, 0.18]]) {
    const { p, n } = onBody(z, deg, -0.01);
    const nn = n.clone().multiplyScalar(0.7).add(V(0, 0, -1));
    const g = lock(p, nn, V(n.x * 0.15, -1, -0.15), 0.085, l, { flare: 0.04 });
    if (deg === 90) C.push(g); else S.push(g);
  }

  // ================= ARMOUR SADDLE (ice-steel with gold trim + ice crystals) =================
  const arc = (z, off, a0 = 32, a1 = 148, n = 8) => {
    const pts = [];
    for (let k = 0; k <= n; k++) pts.push(onBody(z, a0 + ((a1 - a0) * k) / n, off).p);
    return pts;
  };
  const z0 = -0.17, z1 = 0.09;
  C.push(paint(hull([...arc(z0, 0.035), ...arc(z1, 0.035), ...arc(z0, -0.09), ...arc(z1, -0.09)]), SW.armor, 'y', [0.6, 0.86]));
  // bold gold rims front and back
  for (const z of [z0, z1])
    C.push(paint(hull([...arc(z - 0.024, 0.06, 26, 154), ...arc(z + 0.024, 0.06, 26, 154), ...arc(z, -0.06, 26, 154)]), SW.gold, 'y', [0.6, 0.9]));
  // gold trim along the lower edges
  S.push(paint(hull([...[z0, z1].flatMap((z) => [onBody(z, 24, 0.055).p, onBody(z, 38, 0.055).p, onBody(z, 24, -0.04).p, onBody(z, 38, -0.04).p])]), SW.gold, 'y', [0.6, 0.9]));
  // gold studs along the edges
  for (const z of [z0, z1]) for (const d of [56, 78]) S.push(paint(blob(0, onBody(z, d, 0.07).p, V(0.024, 0.024, 0.024)), SW.gold, 'flat'));
  // ornate side emblem: gold diamond filigree with an ice gem
  {
    const { p, n } = onBody(-0.04, 54, 0.035);
    const tz = V(0, 0, 1), tv = new THREE.Vector3().crossVectors(n, tz).normalize();
    const pt = (a, b, o) => p.clone().addScaledVector(tz, a).addScaledVector(tv, b).addScaledVector(n, o);
    S.push(paint(hull([pt(0.085, 0, 0.012), pt(-0.085, 0, 0.012), pt(0, 0.075, 0.012), pt(0, -0.075, 0.012),
      pt(0.085, 0, -0.03), pt(-0.085, 0, -0.03), pt(0, 0.075, -0.03), pt(0, -0.075, -0.03)]), SW.gold, 'y'));
    S.push(paint(hull([pt(0.04, 0, 0.02), pt(-0.04, 0, 0.02), pt(0, 0.036, 0.02), pt(0, -0.036, 0.02), pt(0, 0, 0.04)]), SW.ice, 'y'));
  }
  // gold spine crest
  for (const z of [-0.13, 0.05]) C.push(paint(shard(onBody(z, 90, 0.03).p, V(0, 1, z < 0 ? -0.6 : 0.6), 0.03, 0.06, 4, 0.6), SW.gold, 'y'));
  // ice crystals bursting from the saddle (bigger cluster)
  const ice = (b, d, w, l) => paint(shard(b, d, w, l, 5, 1), SW.ice, 'y');
  C.push(ice(onBody(-0.05, 90, 0.03).p, V(0, 1, -0.2), 0.065, 0.22));
  C.push(ice(onBody(0.05, 90, 0.03).p, V(0, 1, 0.3), 0.045, 0.13));
  S.push(ice(onBody(-0.09, 74, 0.03).p, V(0.6, 1, -0.3), 0.05, 0.16));
  S.push(ice(onBody(0.01, 74, 0.03).p, V(0.7, 1, 0.15), 0.042, 0.12));
  S.push(ice(onBody(-0.03, 82, 0.03).p, V(0.35, 1, 0), 0.035, 0.1));

  // ================= HEAD (big domed skull) =================
  C.push(body([
    ...cbox(V(0, H.y, H.z), 0.225, 0.17, 0.16, 0.065),
    ...ring(V(0, H.y + 0.22, H.z - 0.03), 0.16, 0.13, 8, 'y'),
    ...ring(V(0, H.y + 0.29, H.z - 0.05), 0.08, 0.07, 6, 'y'),
  ], 0.4, 0.97));
  const FZ = H.z + 0.16;

  // fierce glowing eyes (almond shape filled with ice-cyan glow)
  const E = V(0.115, H.y + 0.045, 0), k = 1.2;
  const sc = (pts) => pts.map(([u, v]) => [u * k, v * k]);
  S.push(flat(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.02, FZ + 0.012)), SW.glow));
  S.push(flat(hull(plate(sc([[-0.024, 0.004], [0.01, 0.018], [0.018, -0.008], [0.004, -0.026], [-0.018, -0.024], [-0.028, -0.01]]),
    V(E.x - 0.006, E.y - 0.002, 0), FZ + 0.006, FZ + 0.018)), SW.eye));
  S.push(flat(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.0, E.y + 0.004, 0), FZ + 0.014, FZ + 0.022)), SW.white));
  // heavy brow
  S.push(paint(hull([
    V(0.025, E.y + 0.014, FZ + 0.045), V(0.027, E.y + 0.064, FZ + 0.03),
    V(0.21, E.y + 0.072, FZ + 0.0), V(0.21, E.y + 0.116, FZ - 0.02),
    V(0.025, E.y + 0.014, FZ - 0.03), V(0.027, E.y + 0.074, FZ - 0.04),
    V(0.21, E.y + 0.072, FZ - 0.06), V(0.21, E.y + 0.116, FZ - 0.07),
  ]), SW.brow, 'y'));

  // forehead armour plate (chamfron) with gold rim and an ice gem
  const fp = (dz, s) => [
    V(0, H.y + 0.13, H.z + 0.152 + dz),
    V(0.075 * s, H.y + 0.14, H.z + 0.14 + dz), V(-0.075 * s, H.y + 0.14, H.z + 0.14 + dz),
    V(0.13 * s, H.y + 0.2, H.z + 0.088 + dz), V(-0.13 * s, H.y + 0.2, H.z + 0.088 + dz),
    V(0.085 * s, H.y + 0.26, H.z + 0.045 + dz), V(-0.085 * s, H.y + 0.26, H.z + 0.045 + dz),
    V(0, H.y + 0.285, H.z + 0.032 + dz)];
  const back = (pts) => pts.map((p) => V(p.x * 0.8, p.y - 0.01, p.z - 0.07));
  C.push(paint(hull([...fp(0.012, 1), ...back(fp(0, 1))]), SW.armor, 'y', [H.y + 0.13, H.y + 0.29]));
  C.push(paint(hull([...fp(0.002, 1.14).map((p) => V(p.x, p.y + (p.y > H.y + 0.2 ? 0.01 : -0.014), p.z)), ...back(fp(0, 1))]), SW.gold, 'y', [H.y + 0.13, H.y + 0.29]));
  C.push(paint(hull([...plate([[0, 0.036], [0.028, 0], [0, -0.036], [-0.028, 0]], V(0, H.y + 0.195, 0), H.z + 0.08, H.z + 0.122)]), SW.ice, 'y'));

  // ================= TRUNK (segmented, hanging and curling forward) =================
  C.push(paint(tube(curveSamples(
    [V(0, H.y - 0.02, FZ - 0.04), V(0, H.y - 0.1, FZ + 0.04), V(0, H.y - 0.26, FZ + 0.08), V(0, H.y - 0.42, FZ + 0.07),
      V(0, 0.14, FZ + 0.11), V(0, 0.14, FZ + 0.19), V(0, 0.19, FZ + 0.2)],
    13, (t) => 0.092 - 0.055 * t, (t) => 0.08 - 0.045 * t),
    { seg: 8, axis: X, capEnd: 0.01, phase: Math.PI / 8, scale: (i) => (i % 2 ? 1.1 : 0.94) }), SW.trunk, 'y', [0.1, H.y]));
  // mouth under trunk
  C.push(paint(hull(cbox(V(0, H.y - 0.14, FZ - 0.02), 0.07, 0.03, 0.05, 0.015)), SW.mouth, 'flat'));

  // ================= TUSKS (long ivory, curving down, forward and up) =================
  const tuskPts = [V(0.095, H.y - 0.1, FZ - 0.05), V(0.15, H.y - 0.22, FZ + 0.03), V(0.2, H.y - 0.33, FZ + 0.16),
    V(0.23, H.y - 0.31, FZ + 0.3), V(0.24, H.y - 0.2, FZ + 0.4), V(0.225, H.y - 0.07, FZ + 0.43), V(0.2, H.y + 0.0, FZ + 0.4)];
  S.push(paint(tube(curveSamples(tuskPts, 12, (t) => 0.058 - 0.05 * Math.pow(t, 1.1)),
    { seg: 7, axis: X, capEnd: 0.02, phase: Math.PI / 7 }), SW.tusk, 'len'));
  const tc = new THREE.CatmullRomCurve3(tuskPts, false, 'centripetal');
  for (const [t, r] of [[0.1, 0.07], [0.27, 0.063]]) {
    const p = tc.getPoint(t), T = tc.getTangent(t);
    S.push(paint(tube([{ p: p.clone().addScaledVector(T, -0.018), rx: r, ry: r }, { p: p.clone().addScaledVector(T, 0.018), rx: r, ry: r }],
      { seg: 8, axis: X }), SW.gold, 'flat'));
  }

  // ================= EARS (round flaps) =================
  S.push(paint(hull([...ring(V(0.22, H.y + 0.05, H.z - 0.07), 0.1, 0.105, 9, 'x', 0),
    ...ring(V(0.255, H.y + 0.04, H.z - 0.08), 0.095, 0.1, 9, 'x', 0)]), SW.ear, 'y'));
  S.push(paint(hull([...ring(V(0.26, H.y + 0.04, H.z - 0.075), 0.065, 0.07, 9, 'x', 0),
    ...ring(V(0.262, H.y + 0.04, H.z - 0.075), 0.06, 0.065, 9, 'x', 0)]), SW.earIn, 'flat'));

  // head top fur tuft (frosted)
  C.push(fur(V(0, H.y + 0.28, H.z - 0.08), V(0, 0.35, -1), 0.065, 0.11, 0.6));
  S.push(fur(V(0.08, H.y + 0.25, H.z - 0.1), V(0.6, 0.2, -1), 0.06, 0.1, 0.6));
  // cheek fur
  S.push(fur(V(0.19, H.y - 0.08, H.z + 0.05), V(0.6, -1, 0.1), 0.06, 0.13, 0.5));

  // ================= TAIL (short rope + frosted tuft) =================
  C.push(paint(tube(curveSamples([V(0, 0.55, -0.35), V(0, 0.48, -0.42), V(0, 0.38, -0.45)], 4, (t) => 0.03 - 0.008 * t),
    { seg: 6, axis: X }), SW.furD, 'flat'));
  C.push(fur(V(0, 0.38, -0.45), V(0, -1, -0.15), 0.045, 0.1, 0.8));

  return assemble(C, S);
}

// Radioactive Rex: neon-green mutant T-rex with black tiger stripes, glowing crystal spikes,
// toxic flames, slime drips, ornate gunmetal + gold armour and a glowing radiation emblem.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

const STRIPE = '#141B17';
// striped body cell: u (x) = along the body, v (y) = height (top light -> bottom dark).
function stripeCell(top, bot, stripes) {
  return (g, x, y) => {
    const grad = g.createLinearGradient(0, y + 4, 0, y + 124);
    grad.addColorStop(0, top); grad.addColorStop(1, bot);
    g.fillStyle = grad; g.fillRect(x, y, 128, 128);
    g.fillStyle = STRIPE;
    const P = (u, v) => [x + 4 + u * 120, y + 4 + v * 120];
    for (const [u, w, depth, slant] of stripes) {
      g.beginPath();
      const pts = [P(u - w, -0.05), P(u + w, -0.05), P(u + w * 0.35 + slant, depth), P(u + slant, depth + 0.06), P(u - w * 0.35 + slant, depth)];
      g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.closePath(); g.fill();
    }
  };
}

export const PALETTE = {
  body:   { i: 0, draw: stripeCell('#7DFF4E', '#1FB43C', [[0.1, 0.045, 0.55, 0.02], [0.28, 0.05, 0.62, 0.03], [0.47, 0.05, 0.64, 0.03], [0.66, 0.048, 0.6, 0.03], [0.85, 0.042, 0.5, 0.02]]) },
  plain:  { i: 1, top: '#7DFF4E', bot: '#1FB43C' },
  belly:  { i: 2, top: '#F6FFC0', bot: '#CDF27A' },
  spike:  { i: 3, top: '#FFFF80', bot: '#D8FF1A', glow: true },
  flame:  { i: 4, top: '#E4FFA0', bot: '#2BD42B', glow: true },
  slime:  { i: 5, top: '#9CFF3A', bot: '#2BD42B', glow: true },
  eyeW:   { i: 6, top: '#FBFFE0', bot: '#E6FF9A', glow: true },
  pupil:  { i: 7, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 8, top: '#FFFFFF', bot: '#F1F1F4' },
  armor:  { i: 9, top: '#6E7690', bot: '#2C3140' },
  gold:   { i: 10, top: '#FFE36A', bot: '#E09A1C' },
  mouth:  { i: 11, top: '#C8FF5A', bot: '#3FD23A', glow: true },
  teeth:  { i: 12, top: '#FFFBEA', bot: '#EAD9A8' },
  brow:   { i: 13, top: '#22962F', bot: '#0E5520' },
  dark:   { i: 14, top: '#1E2A22', bot: '#0E1410' },
  tail:   { i: 15, draw: stripeCell('#7DFF4E', '#1FB43C', [[0.12, 0.05, 0.75, 0], [0.32, 0.05, 0.75, 0], [0.52, 0.05, 0.75, 0], [0.72, 0.045, 0.75, 0]]) },
};
const SW = PALETTE;

// custom UV: map each vertex through fn(p) -> [u, v] into a full 128px cell
function cellUV(g, sw, fn) {
  const p = g.attributes.position, uv = [];
  const cx = (sw.i % 8) * 128, cy = Math.floor(sw.i / 8) * 128;
  for (let k = 0; k < p.count; k++) {
    let [u, v] = fn(V(p.getX(k), p.getY(k), p.getZ(k)), k);
    u = THREE.MathUtils.clamp(u, 0, 1); v = THREE.MathUtils.clamp(v, 0, 1);
    uv.push((cx + 4 + u * 120) / 1024, (cy + 4 + v * 120) / 1024);
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}
// stripes in a frame: s along dirS (u), h along dirH (v, high = top)
function striped(g, o, dirS, dirH, s0, s1, h0, h1, sw = SW.body) {
  return cellUV(g, sw, (p) => {
    const d = p.clone().sub(o);
    return [(d.dot(dirS) - s0) / (s1 - s0), 1 - (d.dot(dirH) - h0) / (h1 - h0)];
  });
}
// ring perpendicular to a direction in the y/z plane
function ringD(c, a, b, n, dir, phase = Math.PI / 8) {
  const d = dir.clone().normalize(), A = V(1, 0, 0), B = new THREE.Vector3().crossVectors(d, A).normalize();
  const pts = [];
  for (let k = 0; k < n; k++) {
    const t = phase + (2 * Math.PI * k) / n;
    pts.push(c.clone().addScaledVector(A, Math.cos(t) * a).addScaledVector(B, Math.sin(t) * b));
  }
  return pts;
}
// local frame on a surface: x stays world x, N = normal, up = N x X
function frame(c, normal) {
  const N = normal.clone().normalize(), X = V(1, 0, 0), U = new THREE.Vector3().crossVectors(N, X).normalize();
  return (x, y, w) => c.clone().addScaledVector(X, x).addScaledVector(U, y).addScaledVector(N, w);
}
// slime drip hanging from `top` (tucked into the surface), teardrop bulb at the bottom
function drip(top, len, r) {
  return hull([
    ...ring(V(top.x, top.y + 0.01, top.z), r * 1.1, r * 1.1, 6, 'y'),
    ...ring(V(top.x, top.y - len * 0.55, top.z), r * 0.75, r * 0.75, 6, 'y', 0),
    ...ring(V(top.x, top.y - len * 0.85, top.z), r * 1.25, r * 1.25, 6, 'y'),
    V(top.x, top.y - len, top.z),
  ]);
}
// flame tongue: base ring, narrower mid, curling tip
function tongue(base, dir, w, len, curl) {
  const d = dir.clone().normalize();
  const mid = base.clone().addScaledVector(d, len * 0.45).add(curl.clone().multiplyScalar(0.3));
  const tip = base.clone().addScaledVector(d, len).add(curl);
  return hull([...ringD(base, w, w, 6, d.y > 0.99 ? V(0, 1, 0.001) : d), ...ringD(mid, w * 0.7, w * 0.7, 5, d), tip]);
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const flat = (g, sw) => paint(g, sw, 'flat');
  const ys = (g, sw, lo, hi) => paint(g, sw, 'y', [lo, hi]);

  // ================= TORSO (upright powerful barrel along an inclined spine) =================
  const P0 = V(0, 0.44, -0.25), P1 = V(0, 0.9, 0.13);
  const D = P1.clone().sub(P0).normalize();            // spine direction (up + forward)
  const N = V(0, D.z, -D.y);                            // back normal (up + backward)
  const tor = (t) => P0.clone().lerp(P1, t);
  const torsoRings = [
    [0.0, 0.14, 0.12, 0], [0.18, 0.215, 0.175, 0], [0.42, 0.25, 0.205, -0.01], [0.66, 0.23, 0.185, -0.01], [0.86, 0.18, 0.15, 0], [1.0, 0.14, 0.12, 0],
  ];
  const torsoPts = torsoRings.flatMap(([t, a, b, off]) => ringD(tor(t).addScaledVector(N, off), a, b, 10, D));
  const TO = P0.clone(), Slen = P1.distanceTo(P0);
  const bodyStripe = (g) => striped(g, TO, D, N, -0.12, Slen + 0.32, -0.22, 0.22);
  C.push(bodyStripe(hull(torsoPts)));
  // pale belly: narrower copy pushed to the front-underside
  C.push(ys(hull(torsoRings.slice(1, 5).flatMap(([t, a, b]) => ringD(tor(t).addScaledVector(N, -0.035), a * 0.6, b, 10, D))), SW.belly, 0.35, 0.85));
  // neck
  C.push(bodyStripe(hull([...ring(V(0, 0.84, 0.11), 0.15, 0.13, 10, 'y'), ...ring(V(0, 0.97, 0.23), 0.14, 0.115, 10, 'y')])));
  C.push(ys(hull([...ring(V(0, 0.78, 0.18), 0.1, 0.08, 8, 'y'), ...ring(V(0, 0.92, 0.29), 0.095, 0.07, 8, 'y')]), SW.belly, 0.6, 0.95));

  // ================= LEGS (huge thighs, thick shins, armoured feet, gold claws) =================
  S.push(striped(blob(1, V(0.225, 0.37, -0.1), V(0.15, 0.2, 0.2), { jitter: 0.1 }), V(0.225, 0.37, -0.1), V(0, 0, 1), V(0, 1, 0), -0.35, 0.95, -0.2, 0.2));
  S.push(ys(hull([...ring(V(0.24, 0.27, -0.02), 0.115, 0.11, 8), ...ring(V(0.245, 0.13, -0.08), 0.1, 0.092, 8)]), SW.plain, 0.0, 0.5));
  S.push(ys(hull([...ring(V(0.245, 0.15, -0.075), 0.097, 0.09, 8), ...cbox(V(0.245, 0.05, -0.03), 0.118, 0.05, 0.105, 0.03),
    ...cbox(V(0.245, 0.035, 0.065), 0.112, 0.035, 0.03, 0.015)]), SW.plain, 0.0, 0.5));
  // knee guard: gunmetal shield on a gold backing, glowing toxic gem
  {
    const f = frame(V(0.25, 0.29, 0.075), V(0.2, 0.1, 1));
    const sh = (s, w) => [[-0.065, 0.06], [0.065, 0.06], [0.075, 0.0], [0.04, -0.06], [0, -0.085], [-0.04, -0.06], [-0.075, 0.0]].map(([x, y]) => f(x * s, y * s, w));
    S.push(flat(hull([...sh(1.12, -0.03), ...sh(1.12, 0.012)]), SW.gold));
    S.push(ys(hull([...sh(0.95, 0.0), ...sh(0.78, 0.035)]), SW.armor, 0.22, 0.36));
    S.push(flat(hull([f(0, 0.03, 0.03), f(0.022, 0, 0.03), f(-0.022, 0, 0.03), f(0, -0.035, 0.03), f(0, 0, 0.052)]), SW.spike));
  }
  // claws: chunky gold talons on the ground
  const claw = (x, z, w, h, len, dx = 0) => hull([
    V(x - w, 0, z), V(x + w, 0, z), V(x - w, h, z), V(x + w, h, z),
    V(x - w * 0.8, 0, z - 0.03), V(x + w * 0.8, 0, z - 0.03), V(x - w * 0.8, h, z - 0.03), V(x + w * 0.8, h, z - 0.03),
    V(x + dx - w * 0.3, 0, z + len), V(x + dx + w * 0.3, 0, z + len), V(x + dx, h * 0.3, z + len)]);
  for (const dx of [-0.066, 0, 0.066]) S.push(ys(claw(0.243 + dx, 0.085, 0.026, 0.05, 0.075, dx * 0.3), SW.gold, 0, 0.06));
  S.push(ys(claw(0.245, -0.125, 0.022, 0.035, -0.05), SW.gold, 0, 0.06));

  // ================= ARMS (small, gold-banded, with claws) + PAULDRONS =================
  S.push(ys(hull([...ring(V(0.17, 0.72, 0.13), 0.06, 0.06, 6), ...ring(V(0.22, 0.62, 0.21), 0.05, 0.05, 6)]), SW.plain, 0.5, 0.8));
  S.push(ys(hull([...ring(V(0.22, 0.62, 0.21), 0.047, 0.047, 6, 'z'), ...ring(V(0.215, 0.6, 0.31), 0.043, 0.04, 6, 'z')]), SW.plain, 0.5, 0.8));
  S.push(flat(hull([...ring(V(0.218, 0.61, 0.26), 0.054, 0.052, 6, 'z'), ...ring(V(0.217, 0.605, 0.29), 0.052, 0.05, 6, 'z')]), SW.gold));
  for (const dx of [-0.024, 0, 0.024])
    S.push(flat(shard(V(0.215 + dx, 0.59, 0.325), V(dx * 1.5, -0.9, 0.55), 0.016, 0.06), SW.gold));
  // pauldron: domed gunmetal shell over the shoulder, gold rim, glowing stud
  {
    const c = V(0.195, 0.75, 0.1);
    S.push(ys(hull([...ring(c.clone().add(V(0, -0.03, 0)), 0.095, 0.1, 8, 'y'), ...ring(c.clone().add(V(-0.01, 0.04, 0)), 0.07, 0.075, 8, 'y'),
      c.clone().add(V(-0.02, 0.07, 0))]), SW.armor, 0.7, 0.83));
    S.push(flat(hull([...ring(c.clone().add(V(0, -0.045, 0)), 0.1, 0.105, 8, 'y'), ...ring(c.clone().add(V(0, -0.02, 0)), 0.1, 0.105, 8, 'y')]), SW.gold));
    for (const [o, d, w, l, cu] of [
      [V(0.0, 0.04, -0.01), V(0.25, 1, -0.25), 0.055, 0.26, V(0, 0, -0.06)],
      [V(0.04, 0.02, 0.035), V(0.7, 1, 0.3), 0.042, 0.17, V(0.03, 0, 0.01)],
      [V(0.03, 0.02, -0.05), V(0.5, 0.8, -0.8), 0.042, 0.17, V(0, 0.03, -0.03)],
      [V(-0.03, 0.03, 0.02), V(-0.2, 1, 0.3), 0.038, 0.15, V(0, 0, 0.02)]])
      S.push(ys(tongue(c.clone().add(o), d, w, l, cu), SW.flame, c.y, c.y + 0.27));
    S.push(ys(drip(V(0.235, 0.718, 0.185), 0.075, 0.014), SW.slime, 0.63, 0.72));
    S.push(ys(drip(V(0.285, 0.718, 0.08), 0.05, 0.012), SW.slime, 0.65, 0.72));
  }

  // ================= CHEST PLATE with glowing radiation trefoil =================
  {
    const f = frame(V(0, 0.62, 0.175), V(0, -0.5, 1));
    const oct = (r, w) => { const o = []; for (let k = 0; k < 8; k++) { const a = Math.PI / 8 + k * Math.PI / 4; o.push(f(Math.cos(a) * r, Math.sin(a) * r * 1.05, w)); } return o; };
    C.push(flat(hull([...oct(0.1, -0.04), ...oct(0.105, 0.0), ...oct(0.085, 0.022)]), SW.gold));
    C.push(ys(hull([...oct(0.085, 0.0), ...oct(0.075, 0.03)]), SW.armor, 0.66, 0.82));
    for (const c of [Math.PI / 6, (5 * Math.PI) / 6, (3 * Math.PI) / 2]) {
      const pts = [];
      for (const a of [c - 0.5, c - 0.25, c, c + 0.25, c + 0.5]) pts.push(f(Math.cos(a) * 0.062, Math.sin(a) * 0.062, 0.03), f(Math.cos(a) * 0.062, Math.sin(a) * 0.062, 0.038));
      for (const a of [c - 0.5, c + 0.5]) pts.push(f(Math.cos(a) * 0.018, Math.sin(a) * 0.018, 0.03), f(Math.cos(a) * 0.018, Math.sin(a) * 0.018, 0.038));
      C.push(flat(hull(pts), SW.spike));
    }
    C.push(flat(hull([...ringPts(f, 0.011, 0.03), ...ringPts(f, 0.011, 0.04)]), SW.spike));
    // slime dripping off the plate's lower edge
    C.push(ys(drip(f(0, -0.1, 0.0), 0.07, 0.014), SW.slime, 0.6, 0.7));
    S.push(ys(drip(f(0.07, -0.075, -0.005), 0.05, 0.012), SW.slime, 0.6, 0.7));
  }

  // ================= TAIL (thick, striped, curling up into a toxic flame) =================
  const tailPts = [V(0, 0.47, -0.2), V(0, 0.38, -0.4), V(0, 0.26, -0.58), V(0, 0.18, -0.74), V(0, 0.2, -0.88), V(0, 0.3, -0.96)];
  const tRX = (t) => 0.13 * (1 - t) + 0.035, tRY = (t) => 0.125 * (1 - t) + 0.033;
  const tailCurve = new THREE.CatmullRomCurve3(tailPts, false, 'centripetal');
  const TN = 10;
  {
    const g = tube(curveSamples(tailPts, TN, tRX, tRY), { seg: 8, axis: X, capEnd: 0.02, phase: Math.PI / 8 });
    const tArr = g.userData.t;
    C.push(cellUV(g, SW.tail, (p, k) => {
      const t = tArr[k], c = tailCurve.getPoint(t);
      return [t, 0.5 - (p.y - c.y) / (2 * tRY(t))];
    }));
  }
  // flame burst at the tail tip
  {
    const tip = tailCurve.getPoint(1);
    const FH = 0.42;
    const fl = [
      [V(0, -0.02, 0), V(0, 1, -0.15), 0.085, 0.42, V(0, 0, -0.08)],
      [V(0, -0.02, 0.05), V(0, 1, 0.4), 0.06, 0.26, V(0, 0, 0.05)],
      [V(0, -0.02, -0.07), V(0, 0.6, -1), 0.06, 0.25, V(0, 0.08, 0)],
    ];
    for (const [o, d, w, l, cu] of fl) C.push(ys(tongue(tip.clone().add(o), d, w, l, cu), SW.flame, tip.y - 0.04, tip.y + FH));
    for (const [o, d, w, l, cu] of [[V(0.04, -0.02, -0.01), V(0.5, 1, -0.2), 0.055, 0.28, V(0.04, 0, -0.04)],
      [V(0.035, -0.03, 0.03), V(0.8, 0.6, 0.4), 0.045, 0.17, V(0.03, 0.04, 0)]])
      S.push(ys(tongue(tip.clone().add(o), d, w, l, cu), SW.flame, tip.y - 0.04, tip.y + FH));
  }

  // ================= HEAD (big armoured skull, snout, glowing toxic maw) =================
  const HC = [], HS = [];
  const SK = { y: 1.0, z: 0.27 };
  const headStripe = (g) => striped(g, V(0, SK.y, SK.z), V(0, 0, 1), V(0, 1, 0), -0.838, 0.423, -0.02, 0.14);
  HC.push(headStripe(hull(cbox(V(0, SK.y, SK.z), 0.175, 0.15, 0.145, 0.04))));
  const FZ = SK.z + 0.145;
  // upper jaw / snout
  HC.push(ys(hull([...cbox(V(0, 0.93, 0.5), 0.13, 0.06, 0.13, 0.03), V(0.12, 0.972, 0.4), V(-0.12, 0.972, 0.4)]), SW.plain, 0.75, 1.05));
  HC.push(ys(hull(cbox(V(0, 0.983, 0.585), 0.072, 0.018, 0.035, 0.012)), SW.plain, 0.75, 1.05));
  for (const x of [-0.035, 0.035]) HC.push(flat(hull(cbox(V(x, 1.003, 0.615), 0.009, 0.004, 0.008, 0.002)), SW.dark));
  // glowing toxic maw
  HC.push(flat(hull(cbox(V(0, 0.84, 0.42), 0.1, 0.045, 0.125, 0.01)), SW.mouth));
  // lower jaw: green, wide at the back, with a pale underside
  HC.push(ys(hull([...cbox(V(0, 0.775, 0.45), 0.1, 0.035, 0.13, 0.02),
    V(0.13, 0.86, 0.24), V(-0.13, 0.86, 0.24), V(0.12, 0.75, 0.24), V(-0.12, 0.75, 0.24)]), SW.plain, 0.7, 0.9));
  HC.push(ys(hull([...cbox(V(0, 0.746, 0.43), 0.075, 0.012, 0.13, 0.008), V(0.09, 0.738, 0.26), V(-0.09, 0.738, 0.26),
    V(0.09, 0.755, 0.26), V(-0.09, 0.755, 0.26)]), SW.belly, 0.72, 0.76));
  const tooth = (x, y, z, dy) => flat(hull([V(x - 0.013, y, z - 0.012), V(x + 0.013, y, z - 0.012), V(x - 0.013, y, z + 0.012),
    V(x + 0.013, y, z + 0.012), V(x, y + dy, z)]), SW.teeth);
  for (const x of [0.03, 0.078]) HS.push(tooth(x, 0.877, 0.6, -0.045));
  for (const z of [0.53, 0.46, 0.39]) HS.push(tooth(0.105, 0.877, z, -0.045));
  for (const x of [0.024, 0.068]) HS.push(tooth(x, 0.808, 0.565, 0.038));
  for (const z of [0.5, 0.43]) HS.push(tooth(0.09, 0.808, z, 0.038));
  // slime dribbling from the jaw
  HS.push(ys(drip(V(0.075, 0.74, 0.5), 0.07, 0.013), SW.slime, 0.66, 0.75));
  HS.push(ys(drip(V(0.11, 0.75, 0.33), 0.05, 0.011), SW.slime, 0.68, 0.76));

  // glowing almond eyes + black pupils, heavy brow
  const E = V(0.088, 1.068, 0), ES = 1.4;
  const EYE = [[-0.042, 0.004], [0.046, 0.034], [0.052, -0.008], [0.022, -0.04], [-0.03, -0.038], [-0.047, -0.016]].map(([u, v]) => [u * ES, v * ES]);
  HS.push(flat(hull(plate(EYE.map(([u, v]) => [u * 1.15, v * 1.2 - 0.003]), E, FZ - 0.012, FZ + 0.005, 0.45)), SW.spike));
  HS.push(flat(hull(plate(EYE, E, FZ - 0.01, FZ + 0.01, 0.45)), SW.eyeW));
  HS.push(flat(hull(plate([[-0.026, 0.002], [0.014, 0.017], [0.021, -0.006], [0.006, -0.029], [-0.019, -0.027], [-0.03, -0.01]].map(([u, v]) => [u * 1.45, v * 1.45]),
    V(E.x - 0.004, E.y - 0.002, 0), FZ + 0.004, FZ + 0.016, 0.45)), SW.pupil));
  HS.push(flat(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.008, E.y + 0.006, 0), FZ + 0.012, FZ + 0.021, 0.45)), SW.white));
  // heavy protruding brow: low at the nose, high at the temple
  HS.push(ys(hull([
    V(0.018, E.y + 0.01, FZ + 0.055), V(0.02, E.y + 0.05, FZ + 0.045),
    V(0.168, E.y + 0.048, FZ + 0.0), V(0.168, E.y + 0.078, FZ - 0.01),
    V(0.018, E.y + 0.01, FZ - 0.03), V(0.02, E.y + 0.055, FZ - 0.04),
    V(0.168, E.y + 0.048, FZ - 0.07), V(0.168, E.y + 0.078, FZ - 0.08),
  ]), SW.brow, E.y, E.y + 0.085));

  // armoured head plate: fits inside the skull's top outline, V-peak dipping to the brow, flush gold rim, crystal crest
  const loop = [[0, 1.118, 0.405], [0.125, 1.128, 0.385], [0.158, 1.124, 0.345], [0.158, 1.124, 0.195], [0.12, 1.124, 0.152], [0, 1.124, 0.146]];
  const L = loop.map(([x, y, z]) => V(x, y, z));
  HC.push(ys(hull([...L, ...L.map((p) => V(-p.x, p.y, p.z)), ...L.map((p) => V(p.x * 0.8, p.y - 0.03, p.z + (0.27 - p.z) * 0.15)),
    ...[[0.1, 1.168, 0.2], [0.1, 1.163, 0.34]].flatMap(([x, y, z]) => [V(x, y, z), V(-x, y, z)]),
    V(0.024, 1.188, 0.18), V(-0.024, 1.188, 0.18), V(0.02, 1.178, 0.38), V(-0.02, 1.178, 0.38), V(0, 1.155, 0.425),
  ]), SW.armor, 1.12, 1.19));
  // gold rim, flush (~0.006 proud) along the plate's lower edge
  const out = (p, d) => { const o = V(p.x, 0, (p.z - 0.27) * 1.2); if (o.length() < 1e-4) o.set(0, 0, 1); o.normalize(); return p.clone().addScaledVector(o, d); };
  for (let k = 0; k < L.length - 1; k++) {
    const pts = [];
    for (const p of [L[k], L[k + 1]]) for (const d of [0.006, -0.01]) for (const dy of [0.014, -0.006]) pts.push(out(p, d).add(V(0, dy, 0)));
    HS.push(flat(hull(pts), SW.gold));
  }
  // gold ridge strip from the crown down to the V-peak
  HC.push(flat(hull([V(0.03, 1.182, 0.17), V(-0.03, 1.182, 0.17), V(0.026, 1.172, 0.39), V(-0.026, 1.172, 0.39),
    V(0.018, 1.196, 0.18), V(-0.018, 1.196, 0.18), V(0.014, 1.186, 0.385), V(-0.014, 1.186, 0.385), V(0, 1.16, 0.432)]), SW.gold));
  // glowing gem set in the V-peak
  HC.push(flat(hull([V(0, 1.166, 0.418), V(0.016, 1.148, 0.418), V(-0.016, 1.148, 0.418), V(0, 1.13, 0.414),
    V(0, 1.148, 0.432), V(0, 1.148, 0.4)]), SW.spike));
  // crystal crest bursting from the ridge
  HC.push(ys(shard(V(0, 1.185, 0.27), V(0, 1, -0.3), 0.05, 0.16), SW.spike, 1.17, 1.35));
  HC.push(ys(shard(V(0, 1.18, 0.18), V(0, 0.8, -0.6), 0.04, 0.12), SW.spike, 1.17, 1.35));
  HS.push(ys(shard(V(0.075, 1.16, 0.24), V(0.6, 1, -0.35), 0.035, 0.12), SW.spike, 1.17, 1.35));

  // scale the head up about the neck joint (big-head proportions)
  const HP = V(0, 0.9, 0.24), HSC = 1.25;
  for (const g of [...HC, ...HS]) { g.translate(-HP.x, -HP.y, -HP.z); g.scale(HSC, HSC, HSC); g.translate(HP.x, HP.y, HP.z); }
  C.push(...HC); S.push(...HS);

  // ================= GLOWING CRYSTAL SPIKES (spine -> tail) =================
  const backY = (z) => { // top of torso/neck along the spine (approx)
    const t = (z - P0.z) / (P1.z - P0.z), c = tor(THREE.MathUtils.clamp(t, 0, 1));
    return c.y + 0.12 * N.y + 0.06;
  };
  // [t along spine, length, width] — fewer, chunkier, graduated
  const crystals = [[1.05, 0.15, 0.06], [0.8, 0.22, 0.075], [0.52, 0.25, 0.08], [0.24, 0.21, 0.075], [-0.02, 0.16, 0.065]];
  crystals.forEach(([t, l, w], k) => {
    const c = tor(Math.min(t, 1)).addScaledVector(D, Math.max(0, t - 1) * Slen), r = t > 1 ? 0.11 : 0.15 + 0.05 * Math.sin(Math.PI * t);
    const base = c.clone().addScaledVector(N, r * 0.9);
    C.push(ys(shard(base, N.clone().add(V(0, 0.35, -0.3)), w, l), SW.spike, base.y - 0.02, base.y + l));
  });
  for (const t of [0.2, 0.45, 0.68]) {
    const c = tailCurve.getPoint(t), h = 0.15 * (1 - t) + 0.06;
    const base = c.clone().add(V(0, tRY(t) * 0.8, 0));
    C.push(ys(shard(base, V(0, 1, -0.45), 0.055 * (1 - t * 0.45), h), SW.spike, base.y - 0.02, base.y + h));
  }
  void backY;

  const geo = assemble(C, S);
  geo.scale(0.86, 0.86, 0.86);
  geo.computeBoundingBox();
  return geo;
}

function ringPts(f, r, w) { const o = []; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; o.push(f(Math.cos(a) * r, Math.sin(a) * r, w)); } return o; }

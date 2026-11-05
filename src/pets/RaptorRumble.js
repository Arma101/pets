// Raptor Rumble (Rare, Round 2 Jungle Gym): teal velociraptor with gold stripes, feathered crest,
// sickle claws, jade armour bits and a jungle vine collar. Chunky faceted sheet style.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// ---- gold stripe cell: u = body shading (light -> dark), v = position along the body (stripe param s) ----
const TEAL_TOP = [0x3c, 0xd6, 0xc4], TEAL_BOT = [0x0f, 0x86, 0x7c];
const GOLD_TOP = [0xff, 0xd8, 0x4a], GOLD_BOT = [0xd9, 0x8a, 0x12];
const S_MIN = -1.35, S_MAX = 0.75; // stripe param range s = z + SLANT * y
const SLANT = 0.45;
// gold bands in s-space (head end -> tail tip), narrower toward the tail
const BANDS = [[0.47, 0.53], [0.33, 0.39], [0.18, 0.235], [0.02, 0.075], [-0.13, -0.075], [-0.29, -0.23], [-0.45, -0.395], [-0.61, -0.56], [-0.77, -0.725], [-0.92, -0.885], [-1.06, -1.03]];
const lerpC = (a, b, t) => `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * t)).join(',')})`;
const sToPy = (s) => 4 + (S_MAX - s) / (S_MAX - S_MIN) * 504; // cell column 2, 4 cells tall (i 2,10,18,26)
function drawStripes(g, x, y) {
  for (let px = 0; px < 128; px += 2) {
    const t = Math.min(1, Math.max(0, (px - 4) / 120));
    g.fillStyle = lerpC(TEAL_TOP, TEAL_BOT, t); g.fillRect(x + px, y, 2, 512);
    g.fillStyle = lerpC(GOLD_TOP, GOLD_BOT, t);
    for (const [a, b] of BANDS) { const p0 = sToPy(b), p1 = sToPy(a); g.fillRect(x + px, y + p0, 2, p1 - p0); }
  }
}

export const PALETTE = {
  body:   { i: 0, top: '#3CD6C4', bot: '#0F867C' },
  belly:  { i: 1, top: '#E6FFF2', bot: '#9CDCC6' },
  stripe: { i: 2, draw: drawStripes }, // also covers cells 10, 18, 26 (keep them free)
  claw:   { i: 3, top: '#FFF4DC', bot: '#D9BE8A' },
  eye:    { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  mouth:  { i: 6, top: '#6A1E1E', bot: '#3A0E10' },
  brow:   { i: 7, top: '#169C8E', bot: '#0B6A61' },
  teeth:  { i: 8, top: '#FFF8E2', bot: '#EBD5A2' },
  dark:   { i: 9, top: '#0E5E57', bot: '#083F3A' },
  crest:  { i: 17, top: '#FF7A1E', bot: '#FFC83A' },   // orange tips, gold base
  crest2: { i: 11, top: '#7FF2E2', bot: '#22B3A3' },   // teal under-feathers
  gold:   { i: 12, top: '#FFE066', bot: '#E09A14' },
  jade:   { i: 13, top: '#8CF5B0', bot: '#2FAE68' },
  jadeDk: { i: 14, top: '#1E8A52', bot: '#14653B' },
  vine:   { i: 15, top: '#5A9E2E', bot: '#2F6418' },
  leaf:   { i: 16, top: '#9BE04A', bot: '#4E9E22' },
};
const SW = PALETTE;

// custom UV for striped parts: shade by world y in [lo, hi], stripes by s = z + SLANT * y
function stripe(g, lo, hi) {
  const p = g.attributes.position, uv = [];
  const cx = (SW.stripe.i % 8) * 128, cy = Math.floor(SW.stripe.i / 8) * 128;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), s = p.getZ(i) + SLANT * y;
    const tu = THREE.MathUtils.clamp(1 - (y - lo) / (hi - lo), 0, 1);
    const pv = THREE.MathUtils.clamp(sToPy(s), 4, 508);
    uv.push((cx + 4 + tu * 120) / 1024, (cy + pv) / 1024);
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}

// chunky claw with a flat bottom on y = y0, pointing along +z
function claw(x, y0, z, w, h, len, dx = 0) {
  return hull([
    V(x - w, y0, z), V(x + w, y0, z), V(x - w, y0 + h, z), V(x + w, y0 + h, z),
    V(x - w * 0.8, y0, z - 0.03), V(x + w * 0.8, y0, z - 0.03), V(x - w * 0.8, y0 + h, z - 0.03), V(x + w * 0.8, y0 + h, z - 0.03),
    V(x + dx - w * 0.3, y0, z + len), V(x + dx + w * 0.3, y0, z + len), V(x + dx, y0 + h * 0.3, z + len),
  ]);
}

// closed loop vine (centre-symmetric when the loop is symmetric about x = 0)
function loop(c, rx, rz, tiltY, n = 12) {
  const pts = [];
  for (let k = 0; k <= n; k++) {
    const a = (2 * Math.PI * k) / n + Math.PI / 2; // start/end at the front (+z)
    pts.push(V(c.x + Math.cos(a) * rx, c.y + Math.sin(a) * tiltY, c.z + Math.sin(a) * rz));
  }
  return pts;
}

// distance from o along unit dir d to the far surface of geometry g (Moller-Trumbore, farthest hit)
function surfDist(g, o, d) {
  const p = g.attributes.position, a = V(0, 0, 0), b = V(0, 0, 0), c = V(0, 0, 0);
  const e1 = V(0, 0, 0), e2 = V(0, 0, 0), h = V(0, 0, 0), sv = V(0, 0, 0), q = V(0, 0, 0);
  let best = 0;
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    e1.subVectors(b, a); e2.subVectors(c, a); h.crossVectors(d, e2);
    const det = e1.dot(h); if (Math.abs(det) < 1e-9) continue;
    const f = 1 / det; sv.subVectors(o, a);
    const u = f * sv.dot(h); if (u < 0 || u > 1) continue;
    q.crossVectors(sv, e1); const v = f * d.dot(q); if (v < 0 || u + v > 1) continue;
    const t = f * e2.dot(q); if (t > best) best = t;
  }
  return best;
}

export function buildGeometry() {
  const C = [], S = [], L = []; // L = lower legs (not lowered with the body)
  const X = V(1, 0, 0);
  const teal = (pts, lo = 0.1, hi = 1.0) => paint(hull(pts), SW.body, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');
  const leaf = (b, d, w, l) => paint(shard(b, d, w, l, 4, 0.22), SW.leaf, 'flat');

  // ================= TORSO (lean, leaning forward, gold-striped) =================
  const torso = [
    [-0.3, 0.5, 0.1, 0.105],
    [-0.17, 0.49, 0.14, 0.14],
    [-0.02, 0.51, 0.155, 0.15],
    [0.1, 0.56, 0.14, 0.14],
    [0.19, 0.62, 0.11, 0.115],
  ].map(([z, y, a, b], k) => (k ? [z, y - 0.01, a * 1.16, b * 1.12] : [z, y, a * 1.08, b * 1.05])); // bulked chest
  C.push(stripe(hull(torso.flatMap(([z, y, a, b]) => ring(V(0, y, z), a, b, 10, 'z'))), 0.35, 0.68));
  // light belly underneath
  C.push(paint(hull(torso.slice(1).flatMap(([z, y, a, b]) => ring(V(0, y - 0.024, z + 0.022), a * 0.6, b * 0.97, 10, 'z'))),
    SW.belly, 'y', [0.33, 0.7]));
  // neck rising to the head
  C.push(teal([...ring(V(0, 0.6, 0.15), 0.125, 0.122, 10, 'y'), ...ring(V(0, 0.8, 0.255), 0.092, 0.086, 10, 'y')], 0.45, 1.0));
  C.push(paint(hull([...ring(V(0, 0.6, 0.2), 0.08, 0.085, 8, 'y'), ...ring(V(0, 0.78, 0.295), 0.068, 0.062, 8, 'y')]),
    SW.belly, 'y', [0.5, 0.85]));

  // ================= TAIL (long, stiff, held out back, striped) =================
  const tailPts = [V(0, 0.52, -0.2), V(0, 0.55, -0.45), V(0, 0.575, -0.72), V(0, 0.57, -0.98)];
  const tRX = (t) => 0.105 * (1 - t) + 0.02, tRY = (t) => 0.1 * (1 - t) + 0.02;
  C.push(stripe(tube(curveSamples(tailPts, 8, tRX, tRY), { seg: 8, axis: X, capEnd: 0.03, phase: Math.PI / 8 }), 0.42, 0.66));
  // feathered tail tip: fan of shards
  C.push(paint(shard(V(0, 0.575, -0.96), V(0, 0.05, -1), 0.04, 0.12), SW.crest, 'flat'));
  for (const [x, dy] of [[0.025, 0.25], [0.03, -0.25]])
    S.push(paint(shard(V(x, 0.57 + dy * 0.04, -0.93), V(0.5, dy, -1), 0.032, 0.1), SW.crest2, 'flat'));

  // ================= LEGS (strong thighs, backward shin, raised sickle claw) =================
  const thigh = paint(blob(1, V(0.165, 0.43, -0.07), V(0.118, 0.165, 0.15), { jitter: 0.1 }), SW.body, 'y', [0.2, 0.6]);
  S.push(thigh);
  // knee -> ankle (shin angles back)
  L.push(teal([...ring(V(0.17, 0.3, 0.0), 0.08, 0.085, 8), ...ring(V(0.175, 0.16, -0.07), 0.064, 0.064, 8)], 0.0, 0.6));
  // ankle -> foot (metatarsus angles forward)
  L.push(teal([...ring(V(0.175, 0.17, -0.07), 0.06, 0.06, 8), ...cbox(V(0.175, 0.05, 0.005), 0.088, 0.05, 0.085, 0.028)], 0.0, 0.6));
  // two chunky forward toes with ivory claws
  for (const dx of [-0.018, 0.045]) {
    L.push(teal(cbox(V(0.175 + dx, 0.036, 0.085), 0.033, 0.036, 0.055, 0.012), 0.0, 0.6));
    L.push(flat(claw(0.175 + dx, 0, 0.125, 0.027, 0.048, 0.065, dx * 0.2), SW.claw));
  }
  // raised inner toe + big sickle claw held off the ground
  L.push(teal([...cbox(V(0.115, 0.065, 0.03), 0.026, 0.034, 0.04, 0.008), V(0.11, 0.115, 0.07), V(0.125, 0.11, 0.07)], 0.0, 0.6));
  L.push(paint(tube(curveSamples([V(0.115, 0.1, 0.06), V(0.115, 0.15, 0.1), V(0.115, 0.14, 0.16), V(0.115, 0.095, 0.19)], 6,
    (t) => 0.023 * (1 - t) + 0.003, (t) => 0.027 * (1 - t) + 0.003), { seg: 4, axis: X, capEnd: 0.0 }), SW.claw, 'len'));
  // small heel claw
  L.push(flat(claw(0.175, 0, -0.07, 0.02, 0.03, -0.04), SW.claw));

  // ================= ARMS (small, folded, sharp claws, jade bands) =================
  const A = [];
  A.push(teal([...ring(V(0.1, 0.6, 0.18), 0.05, 0.05, 6), ...ring(V(0.14, 0.51, 0.21), 0.04, 0.04, 6)], 0.4, 0.75));
  A.push(teal([...ring(V(0.14, 0.51, 0.21), 0.038, 0.038, 6, 'z'), ...ring(V(0.14, 0.5, 0.31), 0.032, 0.03, 6, 'z')], 0.4, 0.75));
  // jade armband on the forearm with gold rim
  A.push(paint(hull([...ring(V(0.14, 0.505, 0.255), 0.046, 0.044, 8, 'z'), ...ring(V(0.14, 0.502, 0.285), 0.044, 0.042, 8, 'z')]), SW.jade, 'y', [0.45, 0.56]));
  A.push(flat(hull([...ring(V(0.14, 0.505, 0.247), 0.049, 0.047, 8, 'z'), ...ring(V(0.14, 0.505, 0.253), 0.049, 0.047, 8, 'z')]), SW.gold));
  // arm feathers
  A.push(paint(shard(V(0.165, 0.52, 0.22), V(0.4, -0.3, -1), 0.03, 0.07), SW.crest2, 'flat'));
  // claws: three sharp hooks
  for (const dx of [-0.02, 0, 0.02])
    A.push(flat(shard(V(0.14 + dx, 0.49, 0.325), V(dx, -0.9, 0.6), 0.013, 0.065), SW.claw));

  for (const g of A) g.translate(0.02, 0, 0.012);
  S.push(...A);

  // ================= JUNGLE: vine collar + carved jade amulet, vine round each thigh =================
  C.push(paint(tube(loop(V(0, 0.665, 0.19), 0.134, 0.118, -0.04, 14).map((p) => ({ p, rx: 0.016, ry: 0.016 })),
    { seg: 6, phase: Math.PI / 6 }), SW.vine, 'flat'));
  S.push(leaf(V(0.115, 0.65, 0.25), V(0.8, -0.6, 0.5), 0.03, 0.085));
  S.push(leaf(V(0.132, 0.68, 0.14), V(1, 0.2, -0.3), 0.028, 0.075));
  // amulet: gold bezel + carved jade disc with a dark carved rune
  C.push(flat(hull(plate([[0, 0.055], [0.04, 0.03], [0.04, -0.025], [0, -0.05], [-0.04, -0.025], [-0.04, 0.03]], V(0, 0.585, 0), 0.305, 0.325)), SW.gold));
  C.push(paint(hull(plate([[0, 0.045], [0.032, 0.025], [0.032, -0.02], [0, -0.04], [-0.032, -0.02], [-0.032, 0.025]], V(0, 0.585, 0), 0.315, 0.337)), SW.jade, 'y', [0.55, 0.63]));
  C.push(flat(hull(plate([[0, 0.022], [0.016, 0], [0, -0.022], [-0.016, 0]], V(0, 0.585, 0), 0.333, 0.342)), SW.jadeDk));
  // thigh vine: hugs the thigh surface (raycast), tilted (front lower), leaves tucked against it
  {
    const c = V(0.165, 0.41, -0.07), tilt = 0.32, n = 14;
    const v = V(0, -Math.sin(tilt), Math.cos(tilt));
    const ringPt = (ang) => {
      const d = X.clone().multiplyScalar(Math.cos(ang)).addScaledVector(v, Math.sin(ang)).normalize();
      return { d, p: c.clone().addScaledVector(d, surfDist(thigh, c, d) + 0.008) };
    };
    const pts = [];
    for (let k = 0; k <= n; k++) pts.push({ p: ringPt((2 * Math.PI * k) / n).p, rx: 0.015, ry: 0.015 });
    S.push(paint(tube(pts, { seg: 6, phase: Math.PI / 6 }), SW.vine, 'flat'));
    for (const [ang, w, l] of [[0.55, 0.026, 0.075], [-0.25, 0.028, 0.08], [-1.0, 0.025, 0.068]]) {
      const { d, p } = ringPt(ang);
      S.push(leaf(p.clone().addScaledVector(d, 0.006), d.clone().multiplyScalar(0.45).add(V(0, -1, 0)), w, l));
    }
  }

  // ================= HEAD (boxy skull + long snout, closed toothy grin) =================
  const HC = [], HS = [];
  const SK = { y: 0.88, z: 0.29 };
  HC.push(teal([...cbox(V(0, SK.y, SK.z), 0.15, 0.1, 0.12, 0.03), V(0.1, SK.y + 0.1, SK.z - 0.1), V(-0.1, SK.y + 0.1, SK.z - 0.1)], 0.7, 1.0));
  const FZ = SK.z + 0.12;
  // snout (long, slightly tapering)
  HC.push(teal([...cbox(V(0, 0.835, 0.47), 0.095, 0.045, 0.11, 0.028), V(0.08, 0.875, 0.39), V(-0.08, 0.875, 0.39)], 0.7, 0.95));
  // lower jaw (light)
  HC.push(paint(hull([...cbox(V(0, 0.765, 0.43), 0.08, 0.028, 0.12, 0.016), V(0.095, 0.8, 0.27), V(-0.095, 0.8, 0.27), V(0.08, 0.74, 0.27), V(-0.08, 0.74, 0.27)]),
    SW.body, 'y', [0.7, 0.9]));
  HC.push(paint(hull([...cbox(V(0, 0.732, 0.385), 0.058, 0.007, 0.095, 0.004), V(0.06, 0.735, 0.29), V(-0.06, 0.735, 0.29)]), SW.belly, 'flat'));
  // mouth line
  HC.push(flat(hull(cbox(V(0, 0.79, 0.43), 0.084, 0.008, 0.115, 0.004)), SW.mouth));
  for (const x of [-0.03, 0.03]) HC.push(flat(hull(cbox(V(x, 0.866, 0.567), 0.009, 0.006, 0.008, 0.002)), SW.dark)); // nostrils
  // small gold nose horn
  HC.push(paint(hull([...cbox(V(0, 0.876, 0.53), 0.018, 0.006, 0.026, 0.004), V(0, 0.915, 0.52)]), SW.gold, 'y', [0.87, 0.93]));
  // teeth peeking down from the upper jaw
  const tooth = (x, y, z, dy) => flat(hull([V(x - 0.011, y, z - 0.01), V(x + 0.011, y, z - 0.01), V(x - 0.011, y, z + 0.01),
    V(x + 0.011, y, z + 0.01), V(x, y + dy, z)]), SW.teeth);
  for (const z of [0.53, 0.47, 0.41, 0.35]) HS.push(tooth(0.082, 0.795, z, -0.03));
  HS.push(tooth(0.045, 0.795, 0.565, -0.03));

  // fierce eyes on the skull front, heavy brow
  const E = V(0.066, 0.905, 0);
  HS.push(flat(hull(plate([[-0.04, 0.004], [0.044, 0.034], [0.05, -0.008], [0.022, -0.038], [-0.028, -0.036], [-0.045, -0.016]],
    E, FZ - 0.01, FZ + 0.01, 0)), SW.white));
  HS.push(flat(hull(plate([[-0.024, 0.002], [0.014, 0.016], [0.02, -0.006], [0.006, -0.027], [-0.018, -0.025], [-0.028, -0.01]],
    V(E.x - 0.002, E.y, 0), FZ + 0.004, FZ + 0.016, 0)), SW.eye));
  HS.push(flat(hull(plate([[-0.006, -0.006], [0.006, -0.006], [0.006, 0.006], [-0.006, 0.006]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.012, FZ + 0.02, 0)), SW.white));
  HS.push(paint(hull([
    V(0.022, E.y + 0.01, FZ + 0.025), V(0.025, E.y + 0.045, FZ + 0.015),
    V(0.145, E.y + 0.045, FZ - 0.03), V(0.145, E.y + 0.08, FZ - 0.04),
    V(0.022, E.y + 0.01, FZ - 0.03), V(0.025, E.y + 0.055, FZ - 0.04),
    V(0.145, E.y + 0.045, FZ - 0.07), V(0.145, E.y + 0.08, FZ - 0.08),
  ]), SW.brow, 'y', [0.9, 1.0]));
  // carved jade brow plate + small gold horn at the outer brow
  HS.push(paint(hull([
    V(0.06, E.y + 0.074, FZ - 0.012), V(0.15, E.y + 0.094, FZ - 0.045), V(0.06, E.y + 0.074, FZ - 0.07), V(0.15, E.y + 0.094, FZ - 0.095),
    V(0.06, E.y + 0.045, FZ - 0.012), V(0.15, E.y + 0.065, FZ - 0.045), V(0.06, E.y + 0.045, FZ - 0.07), V(0.15, E.y + 0.065, FZ - 0.095),
  ]), SW.jade, 'y', [0.95, 1.0]));
  HS.push(paint(hull([...ring(V(0.125, E.y + 0.09, FZ - 0.07), 0.02, 0.02, 5, 'y'), V(0.15, E.y + 0.15, FZ - 0.12)]), SW.gold, 'y', [0.97, 1.05]));
  // feathered crest: layered shards sweeping up and back
  // broad flat feather: wide in the plane of the sweep, thin across it
  const crest = (b, d0, w, l, sw = SW.crest) => {
    const d = d0.clone().normalize();
    const n = new THREE.Vector3().crossVectors(d, X).normalize();          // broad axis (mostly in y/z)
    const t = new THREE.Vector3().crossVectors(n, d).normalize();          // thin axis
    const W = w * 2.6, T = w * 0.75, pts = [b.clone().addScaledVector(d, l)];
    for (const [k, sc] of [[-0.25, 0.8], [0.35, 1.0]])
      for (const sn of [-1, 1]) for (const st of [-1, 1])
        pts.push(b.clone().addScaledVector(d, k * l).addScaledVector(n, sn * W * sc).addScaledVector(t, st * T * sc));
    return paint(hull(pts), sw, 'y', [b.y - 0.02, b.y + l * 0.85]);
  };
  HC.push(crest(V(0, 0.975, 0.36), V(0, 1, -0.3), 0.017, 0.1));
  HC.push(crest(V(0, 0.98, 0.29), V(0, 1, -0.6), 0.019, 0.15));
  HC.push(crest(V(0, 0.97, 0.22), V(0, 0.75, -1), 0.019, 0.17));
  HC.push(crest(V(0, 0.94, 0.17), V(0, 0.35, -1), 0.018, 0.15));
  HS.push(crest(V(0.045, 0.975, 0.31), V(0.3, 1, -0.5), 0.016, 0.11, SW.crest2));
  HS.push(crest(V(0.055, 0.965, 0.24), V(0.35, 0.8, -0.9), 0.017, 0.13));
  HS.push(crest(V(0.07, 0.94, 0.18), V(0.45, 0.4, -1), 0.016, 0.11, SW.crest2));
  HS.push(crest(V(0.06, 0.9, 0.16), V(0.4, 0.05, -1), 0.015, 0.09));
  HS.push(crest(V(0.025, 0.985, 0.35), V(0.15, 1, -0.1), 0.014, 0.065, SW.crest2));

  // scale the whole head up about the neck joint (big-head proportions)
  const HP = V(0, 0.78, 0.25), HSC = 1.3;
  for (const g of [...HC, ...HS]) {
    g.translate(-HP.x, -HP.y, -HP.z); g.scale(HSC, HSC, HSC); g.translate(HP.x, HP.y - 0.005, HP.z + 0.01);
  }
  C.push(...HC); S.push(...HS);

  // ================= BACK FEATHER SPIKES (small teal shards down the spine) =================
  for (const [z, y, l] of [[0.12, 0.7, 0.07], [0.0, 0.665, 0.07], [-0.13, 0.645, 0.065], [-0.27, 0.615, 0.06]])
    C.push(paint(shard(V(0, y, z), V(0, 0.8, -1), 0.035, l), SW.crest2, 'flat'));

  // lower everything above the knees for sturdier, shorter legs
  for (const g of [...C, ...S]) g.translate(0, -0.05, 0);
  for (const g of L) g.translate(0.012, 0, 0);
  S.push(...L);
  const out = assemble(C, S);
  out.scale(0.9, 0.9, 0.9); out.computeBoundingBox();
  return out;
}

// Hellhound Hook (Mythic, Round 5 – Volcano Crater): stocky faceted hell-hound in Punch Pup's style.
// Dark red-black body, glowing orange eyes, tall pointy ears with lava inners, hooked obsidian horns
// with gold tips, a layered flaming mane, a spiked obsidian collar and glowing lava cracks.
import { V, THREE, hull, cbox, ring, plate, shard, tube, curveSamples, paint, assemble } from '../kit.js';

// horn: obsidian along its length, gold hook tip (t >= 0.74 in 'len' space)
function drawHorn(g, x, y) {
  const grad = g.createLinearGradient(0, y + 16, 0, y + 16 + 96 * 0.74);
  grad.addColorStop(0, '#4A4060'); grad.addColorStop(1, '#1C1726');
  g.fillStyle = '#4A4060'; g.fillRect(x, y, 128, 16);
  g.fillStyle = grad; g.fillRect(x, y + 16, 128, Math.round(96 * 0.74));
  g.fillStyle = '#FFD24A'; g.fillRect(x, y + 16 + Math.round(96 * 0.74), 128, 128 - 16 - Math.round(96 * 0.74));
}
// tail: dark body colour, then a hot flame tip
function drawTail(g, x, y) {
  const k = Math.round(96 * 0.62);
  const grad = g.createLinearGradient(0, y + 16, 0, y + 16 + k);
  grad.addColorStop(0, '#4E1C22'); grad.addColorStop(1, '#2A1015');
  g.fillStyle = '#4E1C22'; g.fillRect(x, y, 128, 16);
  g.fillStyle = grad; g.fillRect(x, y + 16, 128, k);
  const g2 = g.createLinearGradient(0, y + 16 + k, 0, y + 112);
  g2.addColorStop(0, '#FF5A1A'); g2.addColorStop(1, '#FFD45A');
  g.fillStyle = g2; g.fillRect(x, y + 16 + k, 128, 128 - 16 - k);
}

export const PALETTE = {
  body:    { i: 0, top: '#66222A', bot: '#1E0E12' },
  muzzle:  { i: 1, top: '#93403F', bot: '#5E2428' },
  brow:    { i: 2, top: '#9A3E44', bot: '#4A1A20' },
  obsid:   { i: 3, top: '#3A3248', bot: '#15121C' },
  nose:    { i: 4, top: '#2E2836', bot: '#0E0B12' },
  pupil:   { i: 5, top: '#1A0A0A', bot: '#0C0606' },
  white:   { i: 6, top: '#FFFFFF', bot: '#F4F0EC' },
  eyeGlow: { i: 7, top: '#FFD24A', bot: '#FF7A10', glow: true },
  flameR:  { i: 8, top: '#FFB347', bot: '#E8361A', glow: true },
  flameY:  { i: 9, top: '#FFF3A0', bot: '#FF8A1A', glow: true },
  lava:    { i: 10, top: '#FFA43A', bot: '#FF4A00', glow: true },
  gold:    { i: 11, top: '#FFE07A', bot: '#D99A1E' },
  horn:    { i: 12, draw: drawHorn },
  tail:    { i: 13, draw: drawTail },
  paw:     { i: 14, top: '#4A1A20', bot: '#24100F' },
  mouth:   { i: 15, top: '#2A0E10', bot: '#160708' },
  flameO:  { i: 16, top: '#FFD25A', bot: '#FF5A12', glow: true },
  flameDn: { i: 17, top: '#FF5A12', bot: '#FFE070', glow: true }, // for down/sideways tongues: hot red base, yellow tip
};
const SW = PALETTE;

// ---------- surface-hugging overlays (lava cracks) ----------
const _rc = new THREE.Raycaster();
const _mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
function hit(geo, from, dir) {
  const m = new THREE.Mesh(geo, _mat);
  _rc.set(from, dir.clone().normalize());
  const h = _rc.intersectObject(m, false)[0];
  if (!h) return null;
  return { p: h.point, n: h.face.normal.clone() };
}
// crack: path of [a, b] coords projected along `dir` onto geo; `toWorld(a,b)` gives the ray origin.
// returns thin glowing plates hugging the surface, width tapering toward the path ends.
function crack(out, geo, path, toWorld, dir, w = 0.012, step = 0.022) {
  const pts = [];
  for (let i = 0; i < path.length - 1; i++) {
    const [a0, b0] = path[i], [a1, b1] = path[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(a1 - a0, b1 - b0) / step));
    for (let k = 0; k < n; k++) pts.push([a0 + (a1 - a0) * k / n, b0 + (b1 - b0) * k / n]);
  }
  pts.push(path[path.length - 1]);
  const hits = pts.map(([a, b]) => hit(geo, toWorld(a, b), dir)).filter(Boolean);
  for (let i = 0; i < hits.length - 1; i++) {
    const A = hits[i], B = hits[i + 1];
    const t0 = i / (hits.length - 1), t1 = (i + 1) / (hits.length - 1);
    const wa = 1.3 * w * (0.45 + 0.55 * Math.sin(Math.PI * t0)), wb = 1.3 * w * (0.45 + 0.55 * Math.sin(Math.PI * t1));
    const nA = A.n, nB = B.n;
    const d = B.p.clone().sub(A.p).normalize();
    const sA = new THREE.Vector3().crossVectors(nA, d).normalize(), sB = new THREE.Vector3().crossVectors(nB, d).normalize();
    const ext = d.clone().multiplyScalar(0.004);
    const pa = A.p.clone().sub(ext), pb = B.p.clone().add(ext);
    out.push(paint(hull([
      pa.clone().addScaledVector(sA, wa).addScaledVector(nA, 0.004), pa.clone().addScaledVector(sA, -wa).addScaledVector(nA, 0.004),
      pa.clone().addScaledVector(nA, 0.011),
      pb.clone().addScaledVector(sB, wb).addScaledVector(nB, 0.004), pb.clone().addScaledVector(sB, -wb).addScaledVector(nB, 0.004),
      pb.clone().addScaledVector(nB, 0.011),
    ]), SW.lava, 'flat'));
  }
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const body = (pts, lo = 0.0, hi = 0.95) => paint(hull(pts), SW.body, 'y', [lo, hi]);
  const flame = (b, d, w0, l, sw = SW.flameR, sides = 4, flat = 0.7) => paint(shard(b, d, w0 * 1.15, l, sides, flat), sw, 'y');

  // ================= BODY =================
  const torso = body([
    ...ring(V(0, 0.35, -0.31), 0.11, 0.1, 10, 'z'),
    ...ring(V(0, 0.355, -0.25), 0.18, 0.185, 10, 'z'),
    ...ring(V(0, 0.365, -0.08), 0.195, 0.2, 10, 'z'),
    ...ring(V(0, 0.385, 0.08), 0.205, 0.21, 10, 'z'),
    ...ring(V(0, 0.415, 0.2), 0.185, 0.19, 10, 'z'),
    ...ring(V(0, 0.44, 0.275), 0.12, 0.12, 10, 'z'),
  ], 0.18, 0.62);
  C.push(torso);
  C.push(body([...ring(V(0, 0.44, 0.16), 0.13, 0.125, 10, 'y'), ...ring(V(0, 0.63, 0.21), 0.135, 0.125, 10, 'y')], 0.3, 0.8));

  // ================= LEGS =================
  const FL = { x: 0.158, z: 0.205 }, BL = { x: 0.166, z: -0.18 };
  const fLeg = body([...ring(V(FL.x, 0.06, FL.z), 0.084, 0.084, 8), ...ring(V(FL.x - 0.004, 0.2, FL.z - 0.01), 0.094, 0.096, 8),
    ...ring(V(FL.x - 0.02, 0.33, FL.z - 0.035), 0.108, 0.118, 8), ...ring(V(FL.x - 0.045, 0.43, FL.z - 0.06), 0.08, 0.098, 8)], 0.0, 0.6);
  S.push(fLeg);
  const haunch = body([...ring(V(BL.x - 0.035, 0.44, BL.z), 0.08, 0.11, 8), ...ring(V(BL.x - 0.004, 0.33, BL.z + 0.01), 0.118, 0.165, 8),
    ...ring(V(BL.x - 0.004, 0.2, BL.z + 0.02), 0.094, 0.112, 8)], 0.0, 0.6);
  S.push(haunch);
  const shin = body([...ring(V(BL.x - 0.002, 0.22, BL.z + 0.01), 0.088, 0.094, 8), ...ring(V(BL.x, 0.13, BL.z - 0.03), 0.082, 0.082, 8),
    ...ring(V(BL.x, 0.06, BL.z - 0.02), 0.08, 0.08, 8)], 0.0, 0.6);
  S.push(shin);
  // paws: dark pad block + 3 chunky toes + obsidian claws, flat on the ground
  const paw = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.042, z - 0.005), 0.086, 0.042, 0.072, 0.022)), SW.paw, 'y', [0, 0.09]));
    for (const dx of [-0.054, 0, 0.054]) {
      S.push(paint(hull(cbox(V(x + dx, 0.034, z + 0.064), 0.029, 0.034, 0.034, 0.012)), SW.paw, 'y', [0, 0.09]));
      S.push(paint(hull([V(x + dx - 0.014, 0.0, z + 0.088), V(x + dx + 0.014, 0.0, z + 0.088), V(x + dx - 0.012, 0.034, z + 0.09),
        V(x + dx + 0.012, 0.034, z + 0.09), V(x + dx, 0.0, z + 0.122), V(x + dx, 0.016, z + 0.118)]), SW.obsid, 'y', [0, 0.04]));
    }
  };
  paw(FL.x, FL.z);
  paw(BL.x, BL.z - 0.01);

  // ================= LAVA CRACKS (legs + flanks) =================
  const fromX = (y, z) => V(0.6, y, z), mX = V(-1, 0, 0);
  crack(S, fLeg, [[0.38, FL.z - 0.04], [0.31, FL.z - 0.01], [0.26, FL.z - 0.035], [0.18, FL.z - 0.005], [0.11, FL.z - 0.03]], fromX, mX, 0.011);
  crack(S, fLeg, [[0.26, FL.z - 0.035], [0.22, FL.z - 0.07]], fromX, mX, 0.008);
  crack(S, haunch, [[0.42, BL.z + 0.06], [0.37, BL.z + 0.02], [0.33, BL.z + 0.05], [0.27, BL.z + 0.0], [0.22, BL.z + 0.03]], fromX, mX, 0.012);
  crack(S, haunch, [[0.37, BL.z + 0.02], [0.33, BL.z - 0.05], [0.3, BL.z - 0.09]], fromX, mX, 0.009);
  crack(S, torso, [[0.52, 0.0], [0.46, -0.03], [0.42, 0.005], [0.36, -0.035], [0.31, -0.01]], fromX, mX, 0.012);
  crack(S, torso, [[0.42, 0.005], [0.38, 0.06], [0.33, 0.08]], fromX, mX, 0.009);
  crack(S, torso, [[0.5, -0.17], [0.45, -0.14], [0.41, -0.17]], fromX, mX, 0.009);

  // front-of-leg cracks (projected along -z)
  const fromZ = (x, y) => V(x, y, 0.8), mZ = V(0, 0, -1);
  crack(S, fLeg, [[FL.x + 0.02, 0.4], [FL.x - 0.012, 0.34], [FL.x + 0.018, 0.29], [FL.x - 0.014, 0.23], [FL.x + 0.01, 0.16], [FL.x - 0.005, 0.11]], fromZ, mZ, 0.011);
  crack(S, fLeg, [[FL.x + 0.018, 0.29], [FL.x + 0.05, 0.25], [FL.x + 0.045, 0.21]], fromZ, mZ, 0.007);

  // ================= HEAD =================
  const hc0 = C.length, hs0 = S.length;
  const H = { y: 0.73, z: 0.24 };
  const head = body([
    ...cbox(V(0, H.y, H.z), 0.195, 0.15, 0.16, 0.06),
    ...ring(V(0, H.y + 0.17, H.z - 0.01), 0.115, 0.095, 8, 'y'),
    V(0.205, H.y - 0.075, H.z + 0.06), V(-0.205, H.y - 0.075, H.z + 0.06),
  ], 0.5, 0.95);
  C.push(head);
  const FZ = H.z + 0.16;

  // muzzle (lighter dark red, a touch longer for a hound), jaw, nose, mouth
  const muzzleG = paint(hull([...cbox(V(0, H.y - 0.075, FZ + 0.045), 0.1, 0.06, 0.085, 0.03),
    V(0.07, H.y - 0.01, FZ - 0.03), V(-0.07, H.y - 0.01, FZ - 0.03), V(0, H.y - 0.005, FZ + 0.06)]), SW.muzzle, 'y', [0.58, 0.72]);
  C.push(muzzleG);
  C.push(paint(hull(cbox(V(0, H.y - 0.135, FZ + 0.01), 0.078, 0.03, 0.075, 0.015)), SW.muzzle, 'y', [0.55, 0.65]));
  C.push(paint(hull([...cbox(V(0, H.y - 0.035, FZ + 0.128), 0.046, 0.022, 0.02, 0.01),
    V(0, H.y - 0.07, FZ + 0.12), V(0.02, H.y - 0.062, FZ + 0.12), V(-0.02, H.y - 0.062, FZ + 0.12)]), SW.nose, 'y'));
  C.push(paint(hull(cbox(V(0, H.y - 0.09, FZ + 0.125), 0.006, 0.022, 0.006, 0.002)), SW.mouth, 'flat'));
  S.push(paint(hull([V(0, H.y - 0.112, FZ + 0.131), V(0, H.y - 0.1, FZ + 0.131), V(0.055, H.y - 0.122, FZ + 0.118),
    V(0.055, H.y - 0.112, FZ + 0.118), V(0, H.y - 0.112, FZ + 0.12), V(0.055, H.y - 0.118, FZ + 0.105)]), SW.mouth, 'flat'));

  // glowing orange almond eyes: angry flat top, big dark pupil, square catchlight
  const E = V(0.094, H.y + 0.022, 0);
  const sc = (arr, k) => arr.map(([u, v]) => [u * k, v * k]);
  S.push(paint(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]], 1.3),
    E, FZ - 0.012, FZ + 0.012)), SW.eyeGlow, 'y'));
  S.push(paint(hull(plate(sc([[-0.031, 0.005], [0.018, 0.022], [0.027, -0.008], [0.008, -0.033], [-0.022, -0.031], [-0.035, -0.012]], 1.3),
    V(E.x - 0.005, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.pupil, 'flat'));
  S.push(paint(hull(plate(sc([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]], 1.25),
    V(E.x + 0.008, E.y + 0.003, 0), FZ + 0.014, FZ + 0.023)), SW.white, 'flat'));
  // heavy brow
  S.push(paint(hull([
    V(0.022, E.y + 0.01, FZ + 0.058), V(0.024, E.y + 0.072, FZ + 0.046),
    V(0.172, E.y + 0.056, FZ + 0.014), V(0.172, E.y + 0.112, FZ - 0.006),
    V(0.022, E.y + 0.01, FZ - 0.03), V(0.024, E.y + 0.08, FZ - 0.04),
    V(0.168, E.y + 0.056, FZ - 0.06), V(0.168, E.y + 0.112, FZ - 0.07),
  ]), SW.brow, 'y'));
  // glowing forehead marking: a small flame/chevron above the brows
  C.push(paint(hull([V(0, H.y + 0.1, FZ - 0.004), V(0.022, H.y + 0.135, FZ - 0.014), V(-0.022, H.y + 0.135, FZ - 0.014),
    V(0, H.y + 0.17, FZ - 0.03), V(0, H.y + 0.13, FZ - 0.03)]), SW.lava, 'y'));

  // tall pointy ears: triangular prisms, lava-glow inner
  {
    const y0 = H.y + 0.12, zf = H.z + 0.005;
    const b1 = V(0.06, y0 + 0.04, zf), b2 = V(0.19, y0 - 0.02, zf), t = V(0.178, y0 + 0.23, zf - 0.05);
    const back = (p, dz) => V(p.x, p.y, p.z - dz);
    S.push(paint(hull([b1, b2, t, back(b1, 0.085), back(b2, 0.085), back(t, 0.02), V(0.12, y0 + 0.02, zf + 0.012)]), SW.body, 'y', [y0 - 0.02, y0 + 0.28]));
    const n = new THREE.Vector3().crossVectors(b2.clone().sub(b1), t.clone().sub(b1)).normalize();
    if (n.z < 0) n.negate();
    const cen = b1.clone().add(b2).add(t).multiplyScalar(1 / 3);
    const sh = (p, k) => p.clone().lerp(cen, k);
    const i1 = sh(b1, 0.35), i2 = sh(b2, 0.35), i3 = sh(t, 0.3);
    S.push(paint(hull([i1, i2, i3].flatMap((p) => [p.clone().addScaledVector(n, 0.012), p.clone().addScaledVector(n, 0.005)])),
      SW.lava, 'y'));
  }

  // big hooked obsidian horns with gold tips (Mythic)
  S.push(paint(tube(curveSamples(
    [V(0.13, H.y + 0.095, H.z + 0.07), V(0.23, H.y + 0.12, H.z + 0.03), V(0.315, H.y + 0.18, H.z - 0.03),
      V(0.34, H.y + 0.26, H.z - 0.04), V(0.305, H.y + 0.33, H.z + 0.02)],
    8, (t) => 0.052 * (1 - 0.8 * t) + 0.004),
    { seg: 6, axis: V(1, 0.2, 0.3), capEnd: 0.018, twist: (i) => (i % 2) * Math.PI / 6 }), SW.horn, 'len'));

  // lava cracks on the head sides and muzzle sides
  crack(S, head, [[H.y + 0.075, H.z - 0.11], [H.y + 0.04, H.z - 0.065], [H.y + 0.015, H.z - 0.095], [H.y - 0.02, H.z - 0.055]], fromX, mX, 0.009);
  crack(S, head, [[H.y + 0.04, H.z - 0.065], [H.y + 0.06, H.z - 0.025]], fromX, mX, 0.007);
  crack(S, muzzleG, [[H.y - 0.06, FZ + 0.035], [H.y - 0.085, FZ + 0.065], [H.y - 0.07, FZ + 0.1]], fromX, mX, 0.007);
  // cheek ruff flames framing the jaw
  for (const [b, d, w, l] of [
    [V(0.19, H.y - 0.05, H.z + 0.07), V(1, -0.15, -0.2), 0.05, 0.13],
    [V(0.19, H.y - 0.1, H.z + 0.03), V(1, -0.6, -0.3), 0.052, 0.14],
    [V(0.165, H.y - 0.135, H.z + 0.09), V(0.6, -1, 0.15), 0.045, 0.11],
  ]) S.push(paint(shard(b, d, w * 1.15, l, 4, 0.7), SW.flameDn, 'y'));
  S.push(paint(shard(V(0.205, H.y - 0.075, H.z + 0.04), V(1, -0.35, -0.1), 0.032, 0.085, 4, 0.7), SW.flameY, 'y'));

  // enlarge the whole head group a touch (big-head style) about the neck joint
  for (const g of [...C.slice(hc0), ...S.slice(hs0)]) { g.translate(0, -0.58, -0.2); g.scale(1.1, 1.1, 1.1); g.translate(0, 0.58, 0.2); }

  // ================= SPIKED COLLAR =================
  const CY = 0.535, CZ = 0.2, CR = 0.158;
  C.push(paint(hull([...ring(V(0, CY - 0.034, CZ + 0.008), CR, CR - 0.008, 12, 'y', 0), ...ring(V(0, CY + 0.034, CZ - 0.004), CR - 0.004, CR - 0.012, 12, 'y', 0)]),
    SW.obsid, 'y', [CY - 0.04, CY + 0.04]));
  const spikeAt = (ang, len, out) => {
    const dx = Math.sin(ang), dz = Math.cos(ang);
    const base = V(dx * (CR - 0.006), CY, CZ + dz * (CR - 0.006));
    out.push(paint(shard(base, V(dx, 0.1, dz), 0.026, len, 4, 1), SW.gold, 'y'));
  };
  spikeAt(0, 0.07, C);
  for (const a of [0.55, 1.1, 1.65]) spikeAt(a, 0.065, S);

  // ================= FLAMING MANE =================
  // layered flame shards in rings around the neck, framing the face and covering the back of the head.
  const NC = V(0, 0, 0.15);
  const ringFlames = (y, r, a0, a1, n, l, w, up, out, sw, back = 0.25) => {
    for (let k = 0; k < n; k++) {
      const ang = a0 + (a1 - a0) * (n === 1 ? 0.5 : k / (n - 1));
      const dx = Math.sin(ang), dz = Math.cos(ang);
      const ll = l * (0.88 + 0.24 * ((k * 7) % 3) / 2);
      S.push(flame(V(dx * r, y, NC.z + dz * r), V(dx * out, up, dz * out - back), w, ll, sw));
    }
  };
  // outer, big red-orange tongues (low collar ring, mid ring beside the cheeks, high ring behind the crown)
  ringFlames(0.55, 0.165, 0.9, 2.85, 7, 0.19, 0.068, 0.7, 1.0, SW.flameR);
  ringFlames(0.69, 0.175, 1.0, 2.75, 6, 0.21, 0.07, 0.95, 1.0, SW.flameR);
  ringFlames(0.82, 0.15, 1.4, 2.6, 3, 0.16, 0.064, 1.3, 0.8, SW.flameR);
  // mid orange layer, shorter and more upright, offset between the outer ones
  ringFlames(0.6, 0.175, 1.05, 2.7, 5, 0.15, 0.056, 1.15, 0.8, SW.flameO);
  ringFlames(0.76, 0.17, 1.2, 2.55, 4, 0.15, 0.054, 1.5, 0.7, SW.flameO);
  
  // bright yellow inner tongues
  ringFlames(0.66, 0.185, 1.15, 2.4, 3, 0.11, 0.04, 1.6, 0.7, SW.flameY);
  ringFlames(0.9, 0.13, 1.6, 2.4, 2, 0.11, 0.04, 2.0, 0.5, SW.flameY);
  // centre-back flames (on x = 0)
  for (const [y, z, l, w, up, sw] of [[0.55, -0.02, 0.15, 0.06, 0.9, SW.flameR], [0.7, 0.0, 0.15, 0.062, 1.3, SW.flameR],
    [0.85, 0.07, 0.14, 0.058, 1.8, SW.flameR], [0.78, 0.0, 0.12, 0.04, 2.0, SW.flameY]])
    C.push(flame(V(0, y, z), V(0, up, -1), w, l, sw));
  // flames trailing down the spine
  for (const [z, y, l, w] of [[-0.07, 0.55, 0.12, 0.05], [-0.17, 0.53, 0.09, 0.04]])
    C.push(flame(V(0, y, z), V(0, 1.2, -1), w, l, SW.flameO));

  // ================= CHEST FLAME RUFF (below the collar) + BODY SHARD FUR =================
  const fl = (b, d, w, l, sw = SW.flameDn) => paint(shard(b, d, w * 1.15, l, 4, 0.7), sw, 'y');
  C.push(fl(V(0, 0.47, 0.32), V(0, -0.75, 1), 0.06, 0.14));
  S.push(fl(V(0.065, 0.475, 0.31), V(0.35, -0.7, 1), 0.055, 0.13));
  S.push(fl(V(0.12, 0.48, 0.28), V(0.8, -0.6, 0.7), 0.055, 0.13));
  S.push(fl(V(0.035, 0.44, 0.33), V(0.15, -1, 0.6), 0.04, 0.1, SW.flameY));
  S.push(fl(V(0.165, 0.49, 0.22), V(1, -0.4, 0.2), 0.05, 0.12));
  const fur = (b, d, w, l) => paint(shard(b, d, w, l, 4, 0.8), SW.body, 'flat');
  C.push(fur(V(0, 0.36, 0.3), V(0, -1, 0.4), 0.055, 0.1));
  S.push(fur(V(0.06, 0.36, 0.29), V(0.3, -1, 0.35), 0.05, 0.09));
  S.push(fur(V(0.11, 0.39, 0.27), V(0.7, -1, 0.3), 0.045, 0.08));
  S.push(fur(V(FL.x + 0.02, 0.31, FL.z - 0.09), V(0.3, -0.6, -1), 0.045, 0.08));   // elbow
  S.push(fur(V(0.2, 0.42, 0.06), V(0.7, -0.4, -1), 0.045, 0.075));               // shoulder
  S.push(fur(V(BL.x + 0.07, 0.36, BL.z + 0.11), V(0.5, -0.5, 1), 0.045, 0.06));  // haunch front
  S.push(fur(V(BL.x + 0.05, 0.3, BL.z - 0.14), V(0.4, -0.8, -1), 0.045, 0.06));  // haunch back
  S.push(fur(V(0.2, 0.25, -0.03), V(0.5, -1, 0.1), 0.04, 0.065));                 // belly

  // ================= OBSIDIAN CRYSTALS (volcanic glass jutting from the haunches & shoulders) =================
  const obs = (b, d, w, l) => S.push(paint(shard(b, d, w, l, 4, 0.8), SW.obsid, 'y'));
  obs(V(0.15, 0.46, -0.2), V(0.5, 1, -0.3), 0.042, 0.1);
  obs(V(0.11, 0.48, -0.12), V(0.25, 1, 0.15), 0.034, 0.075);
  obs(V(0.175, 0.43, -0.27), V(0.75, 0.8, -0.6), 0.03, 0.07);

  // ================= TAIL (short, thick, ending in flame) =================
  C.push(paint(tube(curveSamples(
    [V(0, 0.42, -0.27), V(0, 0.48, -0.36), V(0, 0.56, -0.42), V(0, 0.64, -0.45)],
    6, (t) => 0.06 - 0.018 * t),
    { seg: 6, axis: X, capEnd: 0.02, twist: (i) => (i % 2) * Math.PI / 6 }), SW.tail, 'len'));
  C.push(flame(V(0, 0.64, -0.45), V(0, 1, -0.35), 0.055, 0.16, SW.flameR));
  C.push(flame(V(0, 0.66, -0.44), V(0, 1, -0.1), 0.035, 0.11, SW.flameY));
  S.push(flame(V(0.03, 0.63, -0.45), V(0.5, 1, -0.4), 0.04, 0.12, SW.flameO));

  // shorten the legs: pull everything above the paws down by D, ramping through the leg zone
  const D = 0.07, Y0 = 0.08, Y1 = 0.32;
  for (const g of [...C, ...S]) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      p.setXYZ(i, p.getX(i) * 0.95, (y - D * Math.min(1, Math.max(0, (y - Y0) / (Y1 - Y0)))) * 0.95, p.getZ(i) * 0.95);
    }
    g.computeVertexNormals();
  }
  return assemble(C, S);
}

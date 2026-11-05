// THE ULTIMATE CHAMP (Robux egg): white-and-gold champion titan. Stocky biped lion-titan with
// glowing gold armour, starfield panels, radiant wings, crown, floating halo and flaming gold fists.
import { V, THREE, hull, cbox, ring, plate, shard, tube, curveSamples, paint, assemble } from '../kit.js';

// starfield cell: deep cosmic navy with gold / white four-point stars
function drawStars(g, x, y) {
  const grad = g.createLinearGradient(0, y, 0, y + 128);
  grad.addColorStop(0, '#3A3FA8'); grad.addColorStop(1, '#171A5C');
  g.fillStyle = grad; g.fillRect(x, y, 128, 128);
  let s = 7;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const star = (cx, cy, r, col) => {
    g.fillStyle = col; g.beginPath();
    g.moveTo(cx, cy - r); g.lineTo(cx + r * 0.3, cy - r * 0.3); g.lineTo(cx + r, cy); g.lineTo(cx + r * 0.3, cy + r * 0.3);
    g.lineTo(cx, cy + r); g.lineTo(cx - r * 0.3, cy + r * 0.3); g.lineTo(cx - r, cy); g.lineTo(cx - r * 0.3, cy - r * 0.3);
    g.closePath(); g.fill();
  };
  for (let k = 0; k < 40; k++) {
    const px = x + 4 + rnd() * 120, py = y + 4 + rnd() * 120;
    g.fillStyle = rnd() > 0.5 ? '#FFFFFF' : '#FFE47A'; g.fillRect(px, py, 2, 2);
  }
  for (let k = 0; k < 9; k++) star(x + 12 + rnd() * 104, y + 12 + rnd() * 104, 5 + rnd() * 6, k % 2 ? '#FFFFFF' : '#FFE066');
}

export const PALETTE = {
  white:   { i: 0, top: '#FFFFFF', bot: '#D6DCEA' },
  fur:     { i: 1, top: '#FFFFFF', bot: '#E9ECF4' },
  gold:    { i: 2, top: '#FFE980', bot: '#E8A514' },
  goldDk:  { i: 3, top: '#F7C83A', bot: '#B87A0A' },
  eye:     { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  eyeW:    { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  mask:    { i: 6, top: '#C4C2E4', bot: '#A3A0CC' },
  nose:    { i: 7, top: '#3A3448', bot: '#16121C' },
  mouth:   { i: 8, top: '#4A2E3A', bot: '#2E1A22' },
  flame:   { i: 9, top: '#FFF7B0', bot: '#FFB000', glow: true },
  flameO:  { i: 10, top: '#FFD54A', bot: '#FF7A00', glow: true },
  halo:    { i: 11, top: '#FFF8C4', bot: '#FFD02A', glow: true },
  gem:     { i: 12, top: '#B8F4FF', bot: '#3FB8FF', glow: true },
  stars:   { i: 13, draw: drawStars },
  feather: { i: 14, top: '#FFFFFF', bot: '#F3DE96' },
  brow:    { i: 15, top: '#F2C744', bot: '#B07A10' },
};
const SW = PALETTE;

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);

// planar UV into the starfield cell: u from |x| (mirror-safe), v from y (or z)
function starUV(g, ox, oy, size, useZ = false) {
  const p = g.attributes.position, sw = SW.stars;
  const cx = (sw.i % 8) * 128, cy = Math.floor(sw.i / 8) * 128;
  const uv = [];
  const cl = (t) => Math.min(1, Math.max(0, t));
  for (let i = 0; i < p.count; i++) {
    const u = cl((Math.abs(p.getX(i)) - ox) / size);
    const v = cl((oy - (useZ ? p.getZ(i) : p.getY(i))) / size);
    uv.push((cx + 6 + u * 116) / 1024, (cy + 6 + v * 116) / 1024);
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

// flat blade (feather / plate) lying in a plane with normal n
function blade(base, dir, n, L, w, th = 0.018, shape = null) {
  const d = nrm(dir);
  const nn = nrm(add(n, d, -n.dot(d)));
  const v = nrm(cross(nn, d));
  const pts2 = shape || [[0, -0.45], [0, 0.45], [0.25, 0.55], [0.8, 0.45], [1, 0], [0.8, -0.45], [0.25, -0.55]];
  const pts = [];
  for (const [u, s] of pts2) {
    const p = add(add(base, d, u * L), v, s * w);
    pts.push(add(p, nn, th / 2), add(p, nn, -th / 2));
  }
  return hull(pts);
}

export function buildGeometry() {
  const C = [], S = [];
  const white = (pts, lo = 0.05, hi = 0.75) => paint(hull(pts), SW.white, 'y', [lo, hi]);
  const gold = (g, r) => paint(g, SW.gold, 'y', r || null);
  const goldF = (g) => paint(g, SW.gold, 'flat');
  const goldDk = (g, r) => paint(g, SW.goldDk, 'y', r || null);

  // ================= LEGS (short, thick columns, gold greaves, clawed feet) =================
  const LX = 0.13;
  S.push(white([...ring(V(0.105, 0.36, -0.01), 0.11, 0.12, 8), ...ring(V(LX, 0.24, 0.0), 0.105, 0.11, 8),
    ...ring(V(LX + 0.01, 0.1, 0.01), 0.085, 0.09, 8), ...ring(V(LX + 0.01, 0.06, 0.01), 0.08, 0.085, 8)], 0.0, 0.5));
  // gold greave on the shin front + knee cap
  S.push(gold(hull([...plate([[-0.07, 0.06], [0.07, 0.06], [0.075, -0.02], [0.05, -0.08], [-0.05, -0.08], [-0.075, -0.02]],
    V(LX + 0.01, 0.15, 0), 0.03, 0.105)]), [0.06, 0.22]));
  S.push(gold(hull(cbox(V(LX + 0.005, 0.235, 0.085), 0.06, 0.04, 0.035, 0.018))));
  // feet: broad block + 3 toes with gold claws
  const foot = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.04, z), 0.092, 0.04, 0.09, 0.022)), SW.white, 'y', [0, 0.1]));
    for (const dx of [-0.055, 0, 0.055]) {
      S.push(paint(hull(cbox(V(x + dx, 0.032, z + 0.085), 0.027, 0.032, 0.035, 0.012)), SW.white, 'y', [0, 0.1]));
      S.push(goldDk(shard(V(x + dx, 0.022, z + 0.115), V(0, -0.5, 1), 0.017, 0.045)));
    }
  };
  foot(LX + 0.015, 0.02);

  // ================= TORSO (titan chest, narrow waist) =================
  C.push(white([
    ...ring(V(0, 0.3, -0.01), 0.17, 0.13, 10, 'y'),
    ...ring(V(0, 0.4, 0.0), 0.2, 0.15, 10, 'y'),
    ...ring(V(0, 0.52, 0.0), 0.25, 0.17, 10, 'y'),
    ...ring(V(0, 0.62, -0.01), 0.21, 0.15, 10, 'y'),
  ], 0.25, 0.7));
  // gold belt + gem buckle
  C.push(gold(hull([...ring(V(0, 0.3, -0.01), 0.182, 0.142, 10, 'y'), ...ring(V(0, 0.36, -0.005), 0.195, 0.152, 10, 'y')])));
  C.push(paint(hull(plate([[0, 0.032], [0.03, 0], [0, -0.032], [-0.03, 0]], V(0, 0.33, 0), 0.13, 0.172)), SW.gem, 'y', [0.3, 0.36]));
  // starfield tabard hanging in front between the legs, gold trimmed
  const tab = hull(plate([[0, 0.0], [0.065, 0.0], [0.06, -0.12], [0, -0.16]], V(0, 0.31, 0), 0.1, 0.13));
  S.push(starUV(tab, 0.0, 0.33, 0.22));
  C.push(gold(hull(plate([[-0.075, 0.0], [0.075, 0.0], [0.07, -0.13], [0, -0.175], [-0.07, -0.13]], V(0, 0.31, 0), 0.095, 0.12))));
  // breastplate: glowing gold armour with starfield emblem
  C.push(gold(hull([
    ...plate([[-0.2, 0.08], [0.2, 0.08], [0.22, 0.0], [0.16, -0.1], [0.0, -0.14], [-0.16, -0.1], [-0.22, 0.0]], V(0, 0.54, 0), 0.06, 0.155),
    ...plate([[-0.16, 0.08], [0.16, 0.08], [0.18, 0.0], [0.12, -0.09], [0.0, -0.12], [-0.12, -0.09], [-0.18, 0.0]], V(0, 0.54, 0), 0.155, 0.18),
  ]), [0.4, 0.63]));
  const emb = hull(plate([[0, 0.065], [0.055, 0], [0, -0.075]], V(0, 0.52, 0), 0.17, 0.188));
  S.push(starUV(emb, 0.0, 0.6, 0.18));
  C.push(paint(hull(plate([[0, 0.03], [0.022, 0], [0, -0.03], [-0.022, 0]], V(0, 0.52, 0), 0.18, 0.197)), SW.gem, 'flat'));
  // abs plates under the breastplate (white faceted)
  for (const [x, y] of [[0.055, 0.42], [0.055, 0.37]])
    S.push(white(cbox(V(x, y, 0.13), 0.045, 0.022, 0.025, 0.01), 0.3, 0.5));

  // ================= ARMS (short thick, gold pauldrons, flaming gold fists) =================
  S.push(white([...ring(V(0.24, 0.6, -0.01), 0.075, 0.08, 8, 'y'), ...ring(V(0.3, 0.46, 0.01), 0.075, 0.075, 8, 'y'),
    ...ring(V(0.32, 0.38, 0.03), 0.07, 0.07, 8, 'y')], 0.3, 0.7));
  // pauldron: layered gold plates + spikes
  S.push(gold(hull([...ring(V(0.26, 0.64, -0.01), 0.1, 0.1, 8, 'y'), ...ring(V(0.31, 0.58, -0.01), 0.11, 0.11, 8, 'y'),
    V(0.27, 0.7, -0.01)]), [0.55, 0.72]));
  S.push(goldDk(shard(V(0.3, 0.66, -0.01), V(0.6, 1, -0.1), 0.035, 0.09)));
  S.push(goldDk(shard(V(0.34, 0.62, 0.04), V(1, 0.5, 0.3), 0.03, 0.07)));
  S.push(goldDk(shard(V(0.34, 0.62, -0.06), V(1, 0.5, -0.4), 0.03, 0.07)));
  // gauntlet forearm
  S.push(gold(hull([...ring(V(0.315, 0.41, 0.03), 0.085, 0.085, 8, 'y'), ...ring(V(0.35, 0.31, 0.09), 0.1, 0.1, 8, 'y')]), [0.25, 0.42]));
  // giant fist (pushed forward)
  const F = V(0.36, 0.23, 0.12);
  S.push(gold(hull([...cbox(F, 0.112, 0.1, 0.118, 0.035)]), [0.13, 0.33]));
  // knuckles
  for (const dy of [-0.056, -0.019, 0.019, 0.056])
    S.push(goldDk(hull(cbox(V(F.x - 0.015, F.y + dy * 0.9 + 0.012, F.z + 0.118), 0.088, 0.018, 0.02, 0.009))));
  S.push(goldDk(hull(cbox(V(F.x - 0.094, F.y - 0.012, F.z + 0.05), 0.035, 0.055, 0.05, 0.014))));
  // flames: tall layered tongues angled up and back; outer orange-gold, inner pale-yellow core
  for (const [b, d, w, l, sw] of [
    [V(F.x + 0.07, F.y + 0.05, F.z - 0.06), V(0.45, 1, -0.45), 0.075, 0.3, SW.flameO],
    [V(F.x + 0.0, F.y + 0.06, F.z - 0.08), V(0.1, 1, -0.6), 0.075, 0.32, SW.flameO],
    [V(F.x + 0.1, F.y - 0.02, F.z - 0.02), V(1, 0.7, -0.4), 0.06, 0.22, SW.flameO],
    [V(F.x + 0.09, F.y - 0.05, F.z + 0.07), V(0.9, 0.6, -0.1), 0.055, 0.18, SW.flameO],
    [V(F.x + 0.03, F.y + 0.08, F.z + 0.06), V(0.2, 1, -0.2), 0.06, 0.24, SW.flameO],
    [V(F.x - 0.07, F.y + 0.07, F.z + 0.02), V(-0.25, 1, -0.4), 0.05, 0.2, SW.flameO],
    [V(F.x + 0.08, F.y - 0.09, F.z - 0.04), V(1, -0.1, -0.6), 0.05, 0.14, SW.flameO],
    [V(F.x + 0.06, F.y + 0.08, F.z + 0.0), V(0.35, 1, -0.4), 0.05, 0.27, SW.flame],
    [V(F.x - 0.01, F.y + 0.09, F.z + 0.03), V(0.0, 1, -0.35), 0.05, 0.25, SW.flame],
    [V(F.x + 0.11, F.y + 0.02, F.z + 0.04), V(0.8, 1, -0.2), 0.04, 0.18, SW.flame],
    [V(F.x - 0.05, F.y + 0.09, F.z + 0.08), V(-0.1, 1, 0.0), 0.035, 0.14, SW.flame],
  ]) S.push(paint(shard(b, d, w, l, 4, 0.75), sw, 'y', [b.y - 0.02, b.y + l * 0.85]));

  // ================= HEAD (big, boxy lion-titan) =================
  const H = { y: 0.85, z: 0.06 };
  C.push(white([
    ...cbox(V(0, H.y, H.z), 0.22, 0.17, 0.17, 0.07),
    ...ring(V(0, H.y + 0.185, H.z - 0.01), 0.14, 0.11, 8, 'y'),
    V(0.232, H.y - 0.08, H.z + 0.07), V(-0.232, H.y - 0.08, H.z + 0.07),
  ], 0.6, 0.98));
  const FZ = H.z + 0.17;
  // neck
  C.push(white([...ring(V(0, 0.6, -0.01), 0.13, 0.11, 8, 'y'), ...ring(V(0, 0.7, 0.02), 0.13, 0.11, 8, 'y')], 0.4, 0.8));
  // full lion mane: layered big gold (back) and white (front) shards framing the face
  const MC = H.y - 0.02;
  for (const [ang, L, w] of [[78, 0.17, 0.08], [55, 0.21, 0.09], [30, 0.23, 0.095], [5, 0.24, 0.095], [-20, 0.23, 0.095], [-45, 0.21, 0.09], [-68, 0.19, 0.085]]) {
    const r = ang * Math.PI / 180, d = V(Math.cos(r), Math.sin(r), -0.35);
    S.push(gold(shard(V(Math.cos(r) * 0.2, MC + Math.sin(r) * 0.16, H.z - 0.03), d, w * 0.8, L * 1.1, 4, 1.5), [H.y - 0.35, H.y + 0.3]));
  }
  for (const [ang, L, w] of [[66, 0.13, 0.07], [42, 0.15, 0.075], [17, 0.16, 0.08], [-8, 0.16, 0.08], [-33, 0.15, 0.075], [-57, 0.14, 0.07], [-78, 0.13, 0.07]]) {
    const r = ang * Math.PI / 180, d = V(Math.cos(r), Math.sin(r), -0.12);
    S.push(paint(shard(V(Math.cos(r) * 0.205, MC + Math.sin(r) * 0.165, H.z + 0.08), d, w * 0.75, L * 1.05, 4, 1.5), SW.fur, 'y', [H.y - 0.3, H.y + 0.25]));
  }
  // chin beard: gold behind, white in front
  C.push(gold(shard(V(0, MC - 0.15, H.z + 0.0), V(0, -1, -0.15), 0.09, 0.19, 4, 0.55), [H.y - 0.4, H.y]));
  C.push(paint(shard(V(0, MC - 0.15, H.z + 0.1), V(0, -1, 0.05), 0.075, 0.13, 4, 0.55), SW.fur, 'y', [H.y - 0.35, H.y]));
  // top tufts under the crown
  S.push(paint(shard(V(0.1, H.y + 0.15, H.z + 0.08), V(0.4, 1, 0.3), 0.05, 0.08, 4, 0.6), SW.fur, 'y', [H.y, H.y + 0.25]));
  // back of the mane: big layered gold shards covering the back of the head
  for (const [ang, L, w] of [[70, 0.18, 0.07], [38, 0.2, 0.075], [5, 0.21, 0.075], [-28, 0.2, 0.075], [-60, 0.18, 0.07]]) {
    const r = ang * Math.PI / 180, d = V(Math.cos(r) * 0.7, Math.sin(r) * 0.7, -1);
    S.push(goldDk(shard(V(Math.cos(r) * 0.13, MC + Math.sin(r) * 0.11, H.z - 0.13), d, w, L, 4, 1.4), [H.y - 0.3, H.y + 0.25]));
  }
  for (const [y, dy] of [[0.1, 0.5], [-0.02, 0.0], [-0.13, -0.5]])
    C.push(gold(shard(V(0, MC + y, H.z - 0.14), V(0, dy, -1), 0.075, 0.19, 4, 1.4), [H.y - 0.3, H.y + 0.25]));

  // muzzle (broad square white block), white jaw, nose, stern mouth line
  C.push(paint(hull([...cbox(V(0, H.y - 0.088, FZ + 0.035), 0.13, 0.068, 0.075, 0.025),
    V(0.09, H.y - 0.01, FZ - 0.03), V(-0.09, H.y - 0.01, FZ - 0.03)]), SW.fur, 'y', [H.y - 0.16, H.y]));
  C.push(paint(hull(cbox(V(0, H.y - 0.168, FZ + 0.02), 0.095, 0.03, 0.065, 0.014)), SW.fur, 'y', [H.y - 0.2, H.y - 0.13]));
  C.push(paint(hull([...cbox(V(0, H.y - 0.036, FZ + 0.112), 0.055, 0.024, 0.02, 0.01),
    V(0, H.y - 0.074, FZ + 0.106), V(0.025, H.y - 0.064, FZ + 0.106), V(-0.025, H.y - 0.064, FZ + 0.106)]), SW.nose, 'y'));
  C.push(paint(hull(cbox(V(0, H.y - 0.098, FZ + 0.111), 0.006, 0.026, 0.006, 0.002)), SW.mouth, 'flat'));
  C.push(paint(hull(cbox(V(0, H.y - 0.128, FZ + 0.111), 0.075, 0.007, 0.006, 0.002)), SW.mouth, 'flat'));
  S.push(paint(hull([V(0.07, H.y - 0.121, FZ + 0.117), V(0.07, H.y - 0.135, FZ + 0.117), V(0.098, H.y - 0.142, FZ + 0.112),
    V(0.07, H.y - 0.121, FZ + 0.105), V(0.07, H.y - 0.135, FZ + 0.105), V(0.098, H.y - 0.142, FZ + 0.1)]), SW.mouth, 'flat'));

  // fierce eyes: soft lavender shadow socket so the white eye reads on the white face
  const E = V(0.098, H.y + 0.035, 0);
  S.push(paint(hull(plate([[-0.052, 0.014], [0.06, 0.05], [0.072, -0.016], [0.04, -0.06], [-0.03, -0.062], [-0.06, -0.03]],
    E, FZ - 0.02, FZ + 0.005)), SW.mask, 'y', [E.y - 0.06, E.y + 0.05]));
  S.push(paint(hull(plate([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]],
    E, FZ - 0.01, FZ + 0.014)), SW.eyeW, 'flat'));
  S.push(paint(hull(plate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]],
    V(E.x - 0.004, E.y, 0), FZ + 0.008, FZ + 0.02)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.016, FZ + 0.024)), SW.eyeW, 'flat'));
  // heavy gold brow ridge slanting down toward the nose
  S.push(paint(hull([
    V(0.024, E.y + 0.01, FZ + 0.034), V(0.026, E.y + 0.052, FZ + 0.024),
    V(0.18, E.y + 0.056, FZ - 0.01), V(0.18, E.y + 0.096, FZ - 0.025),
    V(0.024, E.y + 0.01, FZ - 0.03), V(0.026, E.y + 0.062, FZ - 0.04),
    V(0.18, E.y + 0.056, FZ - 0.06), V(0.18, E.y + 0.096, FZ - 0.07),
  ]), SW.brow, 'y'));

  // ================= CROWN (gold band with spikes and gems) =================
  const CY = H.y + 0.17;
  C.push(gold(hull([...ring(V(0, CY, H.z - 0.01), 0.165, 0.14, 10, 'y'), ...ring(V(0, CY + 0.055, H.z - 0.01), 0.175, 0.15, 10, 'y')]), [CY, CY + 0.05]));
  C.push(gold(shard(V(0, CY + 0.045, H.z + 0.13), V(0, 1, 0.12), 0.05, 0.13), [CY, CY + 0.16]));
  C.push(gold(shard(V(0, CY + 0.045, H.z - 0.15), V(0, 1, -0.15), 0.04, 0.09), [CY, CY + 0.16]));
  for (const [x, z, h] of [[0.095, 0.1, 0.1], [0.16, 0.0, 0.085], [0.11, -0.11, 0.08]])
    S.push(gold(shard(V(x, CY + 0.04, H.z + z), V(x * 1.4, 1, z * 1.2), 0.038, h), [CY, CY + 0.16]));
  C.push(paint(hull(plate([[0, 0.025], [0.02, 0], [0, -0.025], [-0.02, 0]], V(0, CY + 0.025, 0), H.z + 0.142, H.z + 0.162)), SW.gem, 'flat'));
  for (const x of [0.085]) S.push(paint(hull(cbox(V(x, CY + 0.028, H.z + 0.125), 0.016, 0.016, 0.012, 0.006)), SW.gem, 'flat'));

  // ================= HALO (floating gold ring above the crown) =================
  const HY = CY + 0.275, HR = 0.165, hh = 0.019, NSEG = 12, TILT = 22 * Math.PI / 180, HZ = H.z - 0.04;
  const ct = Math.cos(TILT), st = Math.sin(TILT);
  for (let k = 0; k < NSEG; k++) {
    const pts = [];
    for (const a of [(2 * Math.PI * k) / NSEG, (2 * Math.PI * (k + 1)) / NSEG]) {
      const cx = Math.cos(a), cz = Math.sin(a);
      for (const [dr, dy] of [[-hh, -hh], [-hh, hh], [hh, -hh], [hh, hh]]) {
        const lx = cx * (HR + dr), lz = cz * (HR + dr), ly = dy;
        // tilt back about X: front edge dips, back edge rises, so the ring faces the viewer
        pts.push(V(lx, HY + ly * ct - lz * st, HZ + lz * ct + ly * st));
      }
    }
    C.push(paint(hull(pts), SW.halo, 'y', [HY - 0.08, HY + 0.08]));
  }

  // ================= WINGS (radiant: gold arm, white feathers, starfield inner panel) =================
  const WN = V(0, 0.15, 1); // wing plane normal (roughly facing forward)
  const W = [V(0.1, 0.62, -0.17), V(0.26, 0.74, -0.24), V(0.44, 0.9, -0.28), V(0.6, 1.02, -0.3)];
  S.push(gold(tube(curveSamples(W, 6, (t) => 0.04 - 0.02 * t), { seg: 6, axis: V(0, 0, 1), capEnd: 0.03 }), [0.6, 1.05]));
  S.push(goldDk(shard(W[3], V(1, 0.6, -0.1), 0.025, 0.08)));
  // primaries: wide angular overlapping white feathers with pale-gold tips
  const prim = [];
  for (let k = 0; k < 9; k++) {
    const t = 0.08 + k * 0.112, ang = -1.5 + k * 0.135;
    prim.push([Math.min(t, 0.98), V(Math.cos(ang) + 0.08, Math.sin(ang), -0.04), 0.22 + 0.12 * Math.sin(Math.PI * Math.min(1, k / 7)), k]);
  }
  const wc = new THREE.CatmullRomCurve3(W);
  // starfield membrane fanned behind the feathers (starry from behind)
  const pp = [V(0.1, 0.6, -0.17), V(0.12, 0.5, -0.17)];
  for (const [t, d, L] of prim) { const b = wc.getPoint(t); pp.push(b, add(b, nrm(d), L * 0.7)); }
  S.push(starUV(hull(pp.flatMap((p) => [add(p, WN, -0.012), add(p, WN, -0.032)])), 0.08, 1.0, 0.62));
  const fshape = [[0, -0.6], [0, 0.6], [0.55, 0.75], [1, 0.1], [0.85, -0.45], [0.4, -0.75]];
  for (const [t, d, L, k] of prim) {
    const b = wc.getPoint(t);
    S.push(paint(blade(add(b, WN, 0.004 + k * 0.006), d, WN, L, 0.1, 0.018, fshape), SW.feather, 'y', [b.y - L * 0.95, b.y - L * 0.45]));
  }
  // coverts: gold overlapping shard feathers over the primaries
  for (let k = 0; k < 7; k++) {
    const t = 0.06 + k * 0.14, b = wc.getPoint(Math.min(t, 0.95));
    const d = V(0.25 + t * 0.7, -1, -0.02), L = 0.13 + 0.05 * Math.sin(Math.PI * t);
    S.push(gold(blade(add(b, WN, 0.064 + k * 0.006), d, WN, L, 0.075, 0.018, fshape), [b.y - L, b.y + 0.02]));
  }
  // lion tail: white, curling down behind, ending in a flaming gold tuft
  C.push(paint(tube(curveSamples([V(0, 0.36, -0.12), V(0, 0.28, -0.24), V(0, 0.2, -0.32), V(0, 0.22, -0.42), V(0, 0.3, -0.47)],
    8, (t) => 0.06 - 0.02 * t), { seg: 6, axis: V(1, 0, 0), capEnd: 0.02 }), SW.white, 'y', [0.1, 0.5]));
  C.push(paint(shard(V(0, 0.3, -0.47), V(0, 1, -0.45), 0.055, 0.14, 4, 1), SW.flameO, 'y', [0.28, 0.42]));
  S.push(paint(shard(V(0.01, 0.3, -0.47), V(0.6, 0.8, -0.6), 0.04, 0.11), SW.flameO, 'y', [0.28, 0.4]));
  C.push(paint(shard(V(0, 0.29, -0.46), V(0, 0.3, -1), 0.04, 0.11), SW.flame, 'y', [0.26, 0.36]));
  // back armour plate joining the wings, with a starfield inset
  S.push(starUV(hull(plate([[0, 0.05], [0.09, 0.03], [0.08, -0.04], [0, -0.1]], V(0, 0.58, 0), -0.205, -0.18)), 0.0, 0.63, 0.2));
  C.push(gold(hull([...plate([[-0.16, 0.08], [0.16, 0.08], [0.18, -0.04], [0.0, -0.14], [-0.18, -0.04]], V(0, 0.58, 0), -0.19, -0.13)]), [0.44, 0.66]));

  return assemble(C, S);
}

// Zeus Thunderbird (DIVINE): white-marble & sky-blue thunderbird, gold laurel crown, floating golden halo,
// storm wings with lightning-bolt feathers, radiant sunburst aura, glowing gold armour.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// marble cell: soft white->cool grey gradient with blue-grey veins (sampled with a custom u/v mapping)
function drawMarble(g, x, y) {
  const grad = g.createLinearGradient(0, y, 0, y + 128);
  grad.addColorStop(0, '#FFFFFF'); grad.addColorStop(1, '#E6EDF6');
  g.fillStyle = grad; g.fillRect(x, y, 128, 128);
  g.save(); g.beginPath(); g.rect(x, y, 128, 128); g.clip();
  g.lineCap = 'round';
  const vein = (pts, w, c) => {
    g.strokeStyle = c; g.lineWidth = w; g.beginPath();
    pts.forEach(([u, v], k) => (k ? g.lineTo(x + u, y + v) : g.moveTo(x + u, y + v)));
    g.stroke();
  };
  vein([[10, 0], [30, 30], [24, 52], [52, 86], [46, 128]], 2.2, '#8EA6CC');
  vein([[30, 30], [62, 40], [80, 22], [104, 30]], 1.4, '#BBCBE0');
  vein([[128, 50], [96, 70], [88, 100], [70, 128]], 2.0, '#8EA6CC');
  vein([[52, 86], [76, 78], [96, 70]], 1.2, '#C2D0E3');
  vein([[0, 96], [20, 110], [40, 104]], 1.2, '#C2D0E3');
  g.restore();
}

// gradient cell whose emissive (glow-pass) colours differ from its base colours, so the glow stays modest.
// makeAtlas fills the glow pass with black first, so the cell's background tells which pass is drawing.
function dualCell(top, bot, gTop, gBot) {
  return (g, x, y) => {
    const glowPass = g.getImageData(x + 64, y + 64, 1, 1).data[0] < 128;
    const [a, b] = glowPass ? [gTop, gBot] : [top, bot];
    const grad = g.createLinearGradient(0, y + 16, 0, y + 112);
    grad.addColorStop(0, a); grad.addColorStop(1, b);
    g.fillStyle = a; g.fillRect(x, y, 128, 16);
    g.fillStyle = grad; g.fillRect(x, y + 16, 128, 96);
    g.fillStyle = b; g.fillRect(x, y + 112, 128, 16);
  };
}

export const PALETTE = {
  marble:  { i: 0, draw: drawMarble },
  white:   { i: 1, glow: true, draw: dualCell('#FFFFFF', '#F7FAFE', '#2C2E32', '#2C2E32') },   // head: faint lift keeps shade white
  feath:   { i: 2, glow: true, draw: dualCell('#FFFFFF', '#F2F6FB', '#26282C', '#26282C') },
  sky:     { i: 3, top: '#A6E2FF', bot: '#3DA8F2' },
  storm:   { i: 4, top: '#5C8CD6', bot: '#233F86' },
  gold:    { i: 5, glow: true, draw: dualCell('#FFDE6E', '#E39A10', '#5C3E06', '#3A2502') },  // rich gold armour, modest glow
  goldDk:  { i: 6, top: '#F7C64E', bot: '#BE7C0C' },                                          // trim, laurel shading (matte)
  bolt:    { i: 7, glow: true, draw: dualCell('#FFF38A', '#FFC21E', '#9A8420', '#7A5A0A') },  // lightning feathers
  aura:    { i: 8, glow: true, draw: dualCell('#FFEDA6', '#F6BE3C', '#6A5418', '#4A3206') },  // radiant fan
  beak:    { i: 9, top: '#FFD04A', bot: '#E08E12' },
  eye:     { i: 10, top: '#1A1416', bot: '#0C0A0B' },
  eyeW:    { i: 11, top: '#FFFFFF', bot: '#F1F1F4' },
  brow:    { i: 12, top: '#8ED8FF', bot: '#2F90DE' },
  gem:     { i: 13, top: '#D8F8FF', bot: '#3FD0FF', glow: true },
  mouth:   { i: 14, top: '#6A3A1A', bot: '#3E1E10' },
  halo:    { i: 15, top: '#FFF4A8', bot: '#FFC62E', glow: true },                             // brightest gold
};
const P = PALETTE;

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const sub = (a, b) => a.clone().sub(b);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);

// marble UVs: u from world z (+ a bit of y), v from height
function paintMarble(g, ylo, yhi) {
  const p = g.attributes.position, uv = [];
  const sw = P.marble, cx = (sw.i % 8) * 128, cy = Math.floor(sw.i / 8) * 128;
  for (let i = 0; i < p.count; i++) {
    const u = THREE.MathUtils.clamp(0.5 + p.getZ(i) * 1.1 + Math.abs(p.getX(i)) * 0.6, 0, 1);
    const t = THREE.MathUtils.clamp(1 - (p.getY(i) - ylo) / (yhi - ylo), 0, 1);
    uv.push((cx + 8 + u * 112) / 1024, (cy + 8 + t * 112) / 1024);
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}

// flat prism from a convex 2D polygon in (d, v) coordinates, thickness th along n
function slab(base, d, v, n, pts2, th) {
  const pts = [];
  for (const [a, b] of pts2) {
    const q = add(add(base, d, a), v, b);
    pts.push(add(q, n, th / 2), add(q, n, -th / 2));
  }
  return hull(pts);
}
// frame (d, v, n) from a direction and a rough plane normal
function frame(dir, n0) {
  const d = nrm(dir);
  const n = nrm(add(n0, d, -n0.dot(d)));
  const v = nrm(cross(n, d));
  return { d, v, n };
}
// feather blade (kite-ish)
function blade(base, dir, n0, L, w, th = 0.018, shape = null) {
  const { d, v, n } = frame(dir, n0);
  const s = shape || [[0, -0.3], [0, 0.3], [0.2, 0.5], [0.8, 0.5], [1, 0.05], [0.8, -0.5], [0.2, -0.5]];
  return slab(base, d, v, n, s.map(([a, b]) => [a * L, b * w]), th);
}
// tapered feather: widest near the base, long taper to a pointed tip
const FEATHER = [[0, -0.28], [0, 0.28], [0.18, 0.5], [0.5, 0.46], [1, 0.02], [0.55, -0.4], [0.18, -0.48]];
const LEAF = [[0, 0], [0.12, 0.3], [0.4, 0.5], [0.72, 0.36], [1, 0], [0.72, -0.36], [0.4, -0.5], [0.12, -0.3]];
// lightning-bolt feather: three convex prisms forming a zig-zag
function bolt(base, dir, n0, L, w, th = 0.022) {
  const { d, v, n } = frame(dir, n0);
  const W = w;
  return [
    slab(base, d, v, n, [[0, -W * 0.55], [0, W * 0.55], [L * 0.5, W * 0.95], [L * 0.5, W * 0.05]], th),
    slab(base, d, v, n, [[L * 0.4, W * 0.95], [L * 0.5, W * 0.95], [L * 0.6, -W * 0.85], [L * 0.48, -W * 0.85]], th * 1.05),
    slab(base, d, v, n, [[L * 0.46, -W * 0.85], [L * 0.6, -W * 0.05], [L, -W * 0.5]], th),
  ];
}

export function buildGeometry() {
  const C = [], S = [];
  const flat = (g, sw) => paint(g, sw, 'flat');
  const ypaint = (g, sw, lo, hi) => paint(g, sw, 'y', lo === undefined ? null : [lo, hi]);

  // ================= BODY (marble egg, chest puffed up/forward) =================
  C.push(paintMarble(hull([
    ...ring(V(0, 0.36, -0.27), 0.09, 0.08, 10, 'z'),
    ...ring(V(0, 0.37, -0.17), 0.17, 0.15, 10, 'z'),
    ...ring(V(0, 0.39, -0.04), 0.205, 0.175, 10, 'z'),
    ...ring(V(0, 0.43, 0.08), 0.2, 0.185, 10, 'z'),
    ...ring(V(0, 0.5, 0.16), 0.16, 0.16, 10, 'z'),
    ...ring(V(0, 0.56, 0.2), 0.1, 0.1, 10, 'z'),
  ]), 0.2, 0.65));
  // neck
  C.push(paintMarble(hull([...ring(V(0, 0.52, 0.06), 0.15, 0.14, 8, 'y'), ...ring(V(0, 0.7, 0.1), 0.135, 0.13, 8, 'y')]), 0.4, 0.85));

  // ================= GLOWING GOLD BREASTPLATE (with sky gem + trim) =================
  // curved plate: back shell sits on the chest, front face bulges; darker trim rim just behind
  // curved convex plate: z pulled back by k*|u| (keeps x-symmetry), y centred at 0.5
  const cpl = (pts2, z, th, k) => pts2.flatMap(([u, v]) => [V(u, 0.5 + v, z - k * Math.abs(u) + 0.1 * v), V(u, 0.5 + v, z + th - k * Math.abs(u) + 0.1 * v)]);
  const BP = (sc, z0, z1, dz) => hull([
    ...cpl([[-0.15, 0.06], [0.15, 0.06], [0.185, -0.04], [0.13, -0.15], [0, -0.2], [-0.13, -0.15], [-0.185, -0.04]].map(([u, v]) => [u * sc, v * sc]), z0, 0.03, 0.55),
    ...cpl([[-0.1, 0.04], [0.1, 0.04], [0.13, -0.04], [0.085, -0.12], [0, -0.16], [-0.085, -0.12], [-0.13, -0.04]].map(([u, v]) => [u * sc, v * sc]), z1, dz, 0.35),
  ]);
  C.push(flat(BP(1.1, 0.165, 0.215, 0.02), P.goldDk));
  C.push(ypaint(BP(1.0, 0.18, 0.235, 0.022), P.gold, 0.3, 0.58));
  // central gem (faceted diamond) + sky rune wings either side
  C.push(ypaint(hull([V(0, 0.55, 0.255), V(0, 0.41, 0.255), V(0.045, 0.48, 0.255), V(-0.045, 0.48, 0.255),
    V(0, 0.48, 0.29), V(0.02, 0.5, 0.282), V(-0.02, 0.5, 0.282)]), P.gem));
  S.push(flat(hull(plate([[0.06, 0.02], [0.14, 0.035], [0.12, 0.005], [0.06, -0.01]], V(0, 0.48, 0), 0.245, 0.262, 0.3)), P.gem));
  S.push(flat(hull(plate([[0.055, -0.04], [0.11, -0.065], [0.09, -0.085], [0.05, -0.06]], V(0, 0.48, 0), 0.245, 0.262, 0.3)), P.gem));

  // feather ruff around the neck base (hides the neck seam): white front, sky sides
  const wide = [[0, -0.5], [0, 0.5], [0.5, 0.6], [1, 0], [0.5, -0.6]];
  C.push(flat(blade(V(0, 0.68, 0.19), V(0, -1, 0.35), V(0, 0.3, 1), 0.13, 0.085, 0.024, wide), P.feath));
  for (const [b, d, n, sw] of [
    [V(0.08, 0.675, 0.17), V(0.35, -1, 0.3), V(0.5, 0.3, 1), P.feath], [V(0.13, 0.67, 0.1), V(0.6, -1, 0.1), V(1, 0.3, 0.6), P.sky],
    [V(0.15, 0.68, 0.0), V(0.7, -1, -0.3), V(1, 0.3, -0.2), P.sky], [V(0.09, 0.69, -0.08), V(0.4, -1, -0.7), V(0.6, 0.3, -1), P.feath],
  ]) S.push(paint(blade(b, d, n, 0.13, 0.08, 0.024, wide), sw, 'flat'));
  C.push(flat(blade(V(0, 0.7, -0.09), V(0, -1, -0.6), V(0, 0.3, -1), 0.13, 0.085, 0.024, wide), P.feath));

  // ================= RADIANT FAN (solid disc + 7 chunky rays rising behind the shoulders) =================
  const AC = V(0, 0.72, -0.1);
  C.push(ypaint(hull([...ring(AC, 0.16, 0.16, 12, 'z', 0), ...ring(add(AC, V(0, 0, -0.045)), 0.16, 0.16, 12, 'z', 0)]), P.aura, 0.55, 0.9));
  const rayShape = [[0, -0.5], [0, 0.5], [0.4, 0.42], [1, 0], [0.4, -0.42]];
  for (const [a, L] of [[Math.PI / 2, 0.42], [1.13, 0.38], [0.7, 0.34], [0.27, 0.28]]) {
    const dir = V(Math.cos(a), Math.sin(a), 0);
    const g = blade(add(add(AC, dir, 0.06), V(0, 0, -0.0225)), dir, V(0, 0, 1), L, 0.15, 0.04, rayShape);
    (a === Math.PI / 2 ? C : S).push(ypaint(g, P.aura, 0.6, 1.2));
  }

  // ================= HEAD =================
  const hc0 = C.length, hs0 = S.length;
  const H = { y: 0.86, z: 0.15 };
  C.push(ypaint(hull([
    ...cbox(V(0, H.y, H.z), 0.165, 0.145, 0.15, 0.07),
    ...ring(V(0, H.y + 0.16, H.z - 0.01), 0.1, 0.09, 8, 'y'),
    V(0.17, H.y - 0.08, H.z + 0.01), V(-0.17, H.y - 0.08, H.z + 0.01),
  ]), P.white, 0.7, 1.05));
  const FZ = H.z + 0.15;
  // sky-blue lightning crest swept back from the crown
  for (const [x, y, z, d, L] of [[0, 0.11, -0.1, V(0, 0.45, -1), 0.24]]) {
    const n0 = x === 0 ? V(1, 0, 0) : V(0, 1, 0.2);
    const parts = bolt(V(x, H.y + y, H.z + z), d, n0, L, 0.06, 0.032);
    for (const g of parts) (x === 0 ? C : S).push(flat(g, P.sky));
  }
  // cheek feathers
  S.push(flat(blade(V(0.15, H.y - 0.06, H.z + 0.02), V(0.5, -0.5, -1), V(1, 0, 0.2), 0.12, 0.06, 0.025), P.feath));
  S.push(flat(blade(V(0.13, H.y - 0.11, H.z - 0.03), V(0.4, -1, -0.6), V(1, 0, 0), 0.12, 0.06, 0.025), P.sky));

  // beak: chunky gold hook
  const BY = H.y - 0.035;
  const bp = (g) => paint(g, P.beak, 'y', [BY - 0.15, BY + 0.04]);
  C.push(bp(hull([
    ...plate([[-0.08, 0.03], [0.08, 0.03], [0.085, -0.055], [0.05, -0.09], [-0.05, -0.09], [-0.085, -0.055]], V(0, BY, 0), FZ - 0.05, FZ - 0.02),
    V(0.045, BY + 0.02, FZ + 0.06), V(-0.045, BY + 0.02, FZ + 0.06),
    V(0.03, BY - 0.005, FZ + 0.125), V(-0.03, BY - 0.005, FZ + 0.125),
    V(0.04, BY - 0.065, FZ + 0.08), V(-0.04, BY - 0.065, FZ + 0.08),
    V(0.02, BY - 0.05, FZ + 0.15), V(-0.02, BY - 0.05, FZ + 0.15),
  ])));
  C.push(bp(hull([V(0.02, BY - 0.04, FZ + 0.15), V(-0.02, BY - 0.04, FZ + 0.15), V(0.03, BY - 0.065, FZ + 0.1), V(-0.03, BY - 0.065, FZ + 0.1),
    V(0, BY - 0.145, FZ + 0.14), V(0.01, BY - 0.115, FZ + 0.12), V(-0.01, BY - 0.115, FZ + 0.12)])));
  C.push(flat(hull([...plate([[-0.055, 0], [0.055, 0], [0.045, -0.035], [-0.045, -0.035]], V(0, BY - 0.08, 0), FZ - 0.035, FZ - 0.01),
    V(0.026, BY - 0.088, FZ + 0.08), V(-0.026, BY - 0.088, FZ + 0.08), V(0, BY - 0.108, FZ + 0.06)]), P.goldDk));
  S.push(flat(hull(cbox(V(0.03, BY + 0.014, FZ + 0.055), 0.01, 0.005, 0.012, 0.003)), P.mouth));

  // fierce eyes
  const E = V(0.09, H.y + 0.04, 0), es = 1.25;
  const sc = (arr) => arr.map(([u, v]) => [u * es, v * es]);
  S.push(flat(hull(plate(sc([[-0.036, 0.0], [0.044, 0.03], [0.05, -0.008], [0.02, -0.036], [-0.026, -0.032], [-0.04, -0.016]]),
    E, FZ - 0.014, FZ + 0.008, 0.35)), P.eyeW));
  S.push(flat(hull(plate(sc([[-0.026, 0.0], [0.014, 0.017], [0.022, -0.008], [0.006, -0.03], [-0.02, -0.028], [-0.03, -0.012]]),
    V(E.x - 0.004, E.y, 0), FZ + 0.0, FZ + 0.014, 0.35)), P.eye));
  S.push(flat(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.008, FZ + 0.019, 0.35)), P.eyeW));
  // heavy sky-blue brow: thick block jutting out over the eye, slanting down to the beak
  S.push(ypaint(hull([
    V(0.02, E.y + 0.005, FZ + 0.045), V(0.022, E.y + 0.06, FZ + 0.03),
    V(0.175, E.y + 0.065, FZ - 0.035), V(0.18, E.y + 0.12, FZ - 0.055),
    V(0.02, E.y + 0.005, FZ - 0.03), V(0.022, E.y + 0.07, FZ - 0.04),
    V(0.18, E.y + 0.065, FZ - 0.1), V(0.18, E.y + 0.12, FZ - 0.11),
  ]), P.brow));

  // gold laurel crown: band + two rows of leaves sweeping back to the nape
  // band sits high on the brow at the front and slopes down toward the nape so it hugs the head all round
  const CY = H.y + 0.1, CZ = H.z - 0.005;
  const bandAt = (a, dy, grow = 0) => V(Math.sin(a) * (0.182 + grow), CY + dy - 0.06 * (1 - Math.cos(a)) / 2, CZ + Math.cos(a) * (0.17 + grow));
  const bandPts = [];
  for (let k = 0; k < 14; k++) { const a = (2 * Math.PI * k) / 14; bandPts.push(bandAt(a, 0), bandAt(a, 0.038)); }
  C.push(ypaint(hull(bandPts), P.goldDk));
  // two neat rows of leaves per side, starting at the front gem and angled back toward the nape
  for (const [dy, tilt, sw] of [[0.032, 0.22, P.gold], [0.004, -0.22, P.goldDk]]) {
    for (let i = 0; i < 5; i++) {
      const a = 0.26 + i * 0.4;
      const p = bandAt(a, dy, 0.012);
      const tang = V(Math.cos(a), 0, -Math.sin(a));
      const out = V(Math.sin(a), 0, Math.cos(a));
      S.push(paint(blade(p, add(add(tang, V(0, 1, 0), tilt), out, 0.05), out, 0.13, 0.05, 0.016, LEAF), sw, 'flat'));
    }
  }
  const GZ = CZ + 0.17;
  C.push(ypaint(hull([V(0, CY + 0.075, GZ), V(0, CY - 0.01, GZ), V(0.032, CY + 0.032, GZ),
    V(-0.032, CY + 0.032, GZ), V(0, CY + 0.032, GZ + 0.028)]), P.gem));

  // scale the head (and crown) up about the neck for the big-head look
  const HS = 1.12, piv = V(0, 0.66, 0.12);
  for (const g of [...C.slice(hc0), ...S.slice(hs0)]) { g.translate(-piv.x, -piv.y, -piv.z); g.scale(HS, HS, HS); g.translate(piv.x, piv.y, piv.z); }

  // ================= FLOATING GOLDEN HALO =================
  const HC = V(0, H.y + 0.4, H.z - 0.06), HR = 0.17, NH = 16, tilt = 0.18;
  const hp = (k, r, dy) => {
    const a = (2 * Math.PI * k) / NH;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    return V(x, HC.y + dy + z * Math.sin(tilt), HC.z + z * Math.cos(tilt));
  };
  const halo = [];
  for (let k = 0; k < NH; k++) {
    const pts = [];
    for (const kk of [k, k + 1]) for (const [r, dy] of [[HR - 0.025, -0.014], [HR + 0.025, -0.014], [HR - 0.025, 0.014], [HR + 0.025, 0.014]]) pts.push(hp(kk, r, dy));
    halo.push(ypaint(hull(pts), P.halo, HC.y - 0.05, HC.y + 0.05));
  }
  C.push(...halo);

  // ================= STORM WINGS (spread & raised: storm-blue feathers, lightning-bolt primaries, gold edge) =================
  // tall heroic V: wings rise steeply, tips up and back. Built at final scale (the bird's body is scaled by BS below).
  const BS = 1.13;
  const wc0 = C.length, ws0 = S.length;
  const SH = V(0.16, 0.6, 0.0).multiplyScalar(BS), WR = V(0.41, 1.14, -0.08), TP = V(0.57, 1.48, -0.4);
  const armDir = nrm(sub(WR, SH));
  const wingN = (dir) => { const n = nrm(cross(armDir, dir)); if (n.x < 0) n.multiplyScalar(-1); return n; };
  const edgePts = [SH, add(SH, sub(WR, SH), 0.5), WR, add(WR, V(0.08, 0.2, -0.17), 1), TP];
  S.push(paint(tube(curveSamples(edgePts, 10, (t) => 0.055 - 0.022 * t, (t) => 0.04 - 0.014 * t),
    { seg: 6, ref: V(1, 0, 0.2), capEnd: 0.035, capStart: 0.01 }), P.gold, 'len'));
  // gold pauldron on the wing root
  S.push(ypaint(hull([...ring(V(0.17, 0.6, 0.02), 0.09, 0.09, 8, 'x'), ...ring(V(0.22, 0.62, 0.02), 0.065, 0.065, 8, 'x'), V(0.2, 0.71, 0.02)]).scale(BS, BS, BS), P.gold, 0.5 * BS, 0.72 * BS));
  // arm: deep storm-blue flight feathers, sky secondaries layered on top, white coverts along the edge
  const NF = 7;
  for (let i = 0; i < NF; i++) {
    const t = 0.12 + 0.88 * i / (NF - 1);
    const p = add(SH, sub(WR, SH), t);
    const ang = -0.8 + 0.65 * t;
    const dir = nrm(V(0.38, Math.sin(ang), -Math.cos(ang)));
    const n = wingN(dir);
    const k = NF - i;
    const L = 0.28 + 0.36 * Math.pow(t, 1.2);
    S.push(paint(blade(add(p, n, -0.014 + k * 0.005), dir, n, L, 0.15, 0.018, FEATHER), P.storm, 'y', [0.3, 1.2]));
    S.push(paint(blade(add(add(p, n, 0.016 + k * 0.005), dir, 0.01), dir, n, L * 0.66, 0.13, 0.018, FEATHER), P.sky, 'y', [0.45, 1.15]));
  }
  // hand: storm-blue primaries, each ending in a glowing zig-zag lightning tip
  const hn = wingN(V(0.36, -0.3, -1));
  for (let i = 0; i < 4; i++) {
    const t = 0.04 + i * 0.3;
    const p = add(WR, sub(TP, WR), t);
    const dir = nrm(V(0.28, -0.55 + 0.3 * i, -1));
    const L = 0.34 + 0.03 * i;
    S.push(paint(blade(add(p, hn, -0.02 - i * 0.004), dir, hn, L, 0.15, 0.018, FEATHER), P.storm, 'y', [0.5, 1.2]));
    if (i > 0) for (const g of bolt(add(add(p, dir, L * 0.55), hn, 0.0 - i * 0.004), dir, hn, 0.4, 0.1, 0.034)) S.push(ypaint(g, P.bolt));
  }
  // white coverts along the upper edge
  const edge = new THREE.CatmullRomCurve3(edgePts, false, 'centripetal');
  const NC = 8;
  for (let i = 0; i < NC; i++) {
    const t = 0.16 + 0.74 * i / (NC - 1);
    const p = edge.getPoint(t);
    const dir = nrm(V(0.36, -0.45 - 0.2 * Math.max(0, t - 0.55), -1));
    const n = wingN(V(0.36, -0.3, -1));
    S.push(paint(blade(add(p, n, 0.04 + i * 0.005), dir, n, 0.2 + 0.05 * t, 0.11, 0.018, FEATHER), P.feath, 'y', [0.6, 1.2]));
  }

  const wc1 = C.length, ws1 = S.length;

  // ================= TAIL (fan of white + sky feathers with a bolt centre) =================
  const TB = V(0, 0.42, -0.26);
  for (const g of bolt(add(TB, V(0, 0.03, 0)), V(0, 0.2, -1), V(0, 1, 0.3), 0.46, 0.1, 0.034)) C.push(ypaint(g, P.bolt));
  for (const [x, dx, dy, L, sw, w] of [[0.03, 0.22, 0.3, 0.42, P.sky, 0.19], [0.05, 0.55, 0.15, 0.38, P.storm, 0.19],
    [0.06, 0.95, -0.05, 0.32, P.sky, 0.17]])
    S.push(paint(blade(add(TB, V(x, 0, 0)), V(dx, dy, -1), V(0, 1, 0.8), L, w, 0.03), sw, 'y', [0.2, 0.75]));

  // ================= LEGS (white feathered thighs, glowing gold greaves & talons) =================
  const legX = 0.105;
  S.push(paintMarble(blob(1, V(legX, 0.25, -0.01), V(0.09, 0.1, 0.11), { jitter: 0.15 }), 0.15, 0.4));
  S.push(flat(blade(V(legX + 0.055, 0.29, 0.04), V(0.25, -1, 0.25), V(1, 0, 0.6), 0.12, 0.065, 0.024, wide), P.feath));
  S.push(flat(blade(V(legX + 0.055, 0.29, -0.05), V(0.25, -1, -0.3), V(1, 0, -0.5), 0.12, 0.065, 0.024, wide), P.sky));
  S.push(flat(blade(V(legX, 0.29, 0.08), V(0, -1, 0.3), V(0, 0, 1), 0.11, 0.06, 0.024, wide), P.feath));
  S.push(ypaint(hull([...ring(V(legX, 0.2, -0.005), 0.058, 0.058, 8), ...ring(V(legX + 0.003, 0.12, 0.005), 0.054, 0.054, 8),
    ...ring(V(legX + 0.005, 0.045, 0.02), 0.05, 0.05, 8)]), P.gold, 0, 0.22));
  S.push(flat(hull([...ring(V(legX + 0.003, 0.15, 0.0), 0.066, 0.066, 8), ...ring(V(legX + 0.003, 0.18, 0.0), 0.068, 0.068, 8)]), P.goldDk));
  const foot = (x, z) => {
    S.push(ypaint(hull(cbox(V(x, 0.034, z), 0.055, 0.034, 0.055, 0.015)), P.gold, 0, 0.07));
    for (const [dx, dz] of [[-0.06, 0.09], [0, 0.11], [0.06, 0.09]]) {
      S.push(ypaint(hull([...cbox(V(x + dx * 0.45, 0.028, z + dz * 0.45), 0.024, 0.028, 0.024, 0.008),
        ...cbox(V(x + dx, 0.024, z + dz), 0.022, 0.024, 0.018, 0.007)]), P.gold, 0, 0.07));
      S.push(flat(shard(V(x + dx * 1.08, 0.02, z + dz + 0.014), V(dx, -0.45, 0.8), 0.017, 0.045), P.goldDk));
    }
    S.push(ypaint(hull(cbox(V(x, 0.024, z - 0.06), 0.02, 0.024, 0.03, 0.006)), P.gold, 0, 0.07));
    S.push(flat(shard(V(x, 0.018, z - 0.09), V(0, -0.4, -1), 0.015, 0.04), P.goldDk));
  };
  foot(legX + 0.005, 0.03);

  // scale the bird itself (everything except the wings) up about the ground origin so it holds the frame
  const inWing = (arr, i) => (arr === C ? i >= wc0 && i < wc1 : i >= ws0 && i < ws1);
  for (const arr of [C, S]) arr.forEach((g, i) => { if (!inWing(arr, i)) g.scale(BS, BS, BS); });

  return assemble(C, S);
}

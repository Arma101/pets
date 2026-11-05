// Halo Hawk (SECRET): cream-white marble hawk, gold-tipped feathers, gold trim, floating glowing halo + crystals.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// custom swatch painters
const cellFill = (g, x, y, top, bot) => {
  const gr = g.createLinearGradient(0, y + 16, 0, y + 112);
  gr.addColorStop(0, top); gr.addColorStop(1, bot);
  g.fillStyle = top; g.fillRect(x, y, 128, 16);
  g.fillStyle = gr; g.fillRect(x, y + 16, 128, 96);
  g.fillStyle = bot; g.fillRect(x, y + 112, 128, 16);
};
// feather: cream base, crisp gold tip from t = 0.62
const featherDraw = (cTop, cBot) => (g, x, y) => {
  const split = y + 16 + 0.7 * 96;
  let gr = g.createLinearGradient(0, y, 0, split);
  gr.addColorStop(0, cTop); gr.addColorStop(1, cBot);
  g.fillStyle = gr; g.fillRect(x, y, 128, split - y);
  gr = g.createLinearGradient(0, split, 0, y + 128);
  gr.addColorStop(0, '#FFE470'); gr.addColorStop(1, '#E9A216');
  g.fillStyle = gr; g.fillRect(x, split, 128, y + 128 - split);
};
// marble: warm white with soft grey-blue veins
const marbleDraw = (g, x, y) => {
  cellFill(g, x, y, '#FFFEFB', '#F1ECE2');
  g.save(); g.beginPath(); g.rect(x, y, 128, 128); g.clip();
  g.lineCap = 'round';
  const vein = (pts, w, col) => {
    g.strokeStyle = col; g.lineWidth = w; g.beginPath();
    g.moveTo(x + pts[0][0], y + pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(x + pts[i][0], y + pts[i][1]);
    g.stroke();
  };
  vein([[0, 30], [30, 42], [52, 36], [80, 62], [128, 70]], 3.5, '#A8A6BC');
  vein([[10, 128], [34, 96], [40, 70], [64, 52], [90, 20], [104, 0]], 3, '#B2B0C4');
  vein([[60, 128], [76, 104], [110, 96], [128, 84]], 2.4, '#BDBBCC');
  vein([[40, 70], [20, 84], [0, 86]], 1.2, '#CFCDD8');
  g.restore();
};

export const PALETTE = {
  body:    { i: 0, top: '#FFFCF4', bot: '#F2E5CB' },
  cream:   { i: 1, top: '#FFF8E8', bot: '#EDDDBE' },
  feather: { i: 2, draw: featherDraw('#FFFEFA', '#F8F0DE') },
  featherD:{ i: 3, draw: featherDraw('#FFFAF0', '#F3E8D2') },
  marble:  { i: 4, draw: marbleDraw },
  gold:    { i: 5, top: '#FFE66E', bot: '#E39E12' },
  goldDk:  { i: 6, top: '#F6C431', bot: '#B9780C' },
  beak:    { i: 7, top: '#FFE14E', bot: '#EE9710' },
  talon:   { i: 8, top: '#E0A626', bot: '#9A6408' },
  eye:     { i: 9, top: '#1A1416', bot: '#0C0A0B' },
  white:   { i: 10, top: '#FFFFFF', bot: '#F2EEE8' },
  brow:    { i: 11, top: '#FFFFFF', bot: '#D9C9AC' },
  halo:    { i: 12, top: '#FFF7B0', bot: '#FFCB2E', glow: true },
  rune:    { i: 13, top: '#E6FDFF', bot: '#62DBFF', glow: true },
  head:    { i: 15, top: '#FFFFFF', bot: '#F8EEDA' },
  mouth:   { i: 14, top: '#6A3A1A', bot: '#3E1E10' },
};
const P = PALETTE;

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);

function swUV(sw, t, u = 0.5) {
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  return [(x + 24 + u * 80) / 1024, (y + 16 + THREE.MathUtils.clamp(t, 0, 1) * 96) / 1024];
}
// gradient along a direction (t = 0 at base, 1 at base + dir*len)
function paintAlong(g, sw, base, dir, len) {
  const p = g.attributes.position, d = nrm(dir), uv = [];
  for (let i = 0; i < p.count; i++) {
    const t = (V(p.getX(i), p.getY(i), p.getZ(i)).sub(base)).dot(d) / len;
    uv.push(...swUV(sw, t));
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
// marble: u by (z, x), t by height => veins wander across facets
function paintMarble(g, lo, hi, k = 1.4) {
  const p = g.attributes.position, uv = [];
  for (let i = 0; i < p.count; i++) {
    const x = Math.abs(p.getX(i)), y = p.getY(i), z = p.getZ(i);
    uv.push(...swUV(P.marble, 1 - (y - lo) / (hi - lo), THREE.MathUtils.clamp(0.5 + (z * 0.9 + x * 0.6) * k, 0, 1)));
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

// flat feather blade (kite / leaf prism): base b, direction d, plane normal n
function blade(b, dir, n, L, w, th = 0.018, shape = null) {
  const d = nrm(dir);
  const nn = nrm(add(n, d, -n.dot(d)));
  const v = nrm(cross(nn, d));
  const pts2 = shape || [[0, -0.32], [0, 0.32], [0.25, 0.5], [0.78, 0.46], [1, 0], [0.78, -0.46], [0.25, -0.5]];
  const pts = [];
  for (const [u, s] of pts2) {
    const p = add(add(b, d, u * L), v, s * w);
    const t = th * (u > 0.9 ? 0.5 : 1);
    pts.push(add(p, nn, t / 2), add(p, nn, -t / 2));
  }
  return hull(pts);
}
const gfeather = (b, dir, n, L, w, sw = P.feather, th = 0.018, shape = null) =>
  paintAlong(blade(b, dir, n, L, w, th, shape), sw, b, dir, L);

export function buildGeometry() {
  const C = [], S = [];
  const body = (g, lo, hi) => paint(g, P.body, 'y', [lo, hi]);
  const cream = (g, lo, hi) => paint(g, P.cream, lo === undefined ? 'flat' : 'y', lo === undefined ? null : [lo, hi]);
  const gold = (g) => paint(g, P.gold, 'y');
  const goldF = (g) => paint(g, P.gold, 'flat');
  const goldDk = (g) => paint(g, P.goldDk, 'y');
  const glow = (g) => paint(g, P.rune, 'y');

  // ================= BODY (upright egg, chest puffed) =================
  C.push(body(hull([
    ...ring(V(0, 0.33, -0.22), 0.09, 0.08, 10, 'z'),
    ...ring(V(0, 0.33, -0.14), 0.17, 0.15, 10, 'z'),
    ...ring(V(0, 0.37, -0.02), 0.205, 0.18, 10, 'z'),
    ...ring(V(0, 0.44, 0.09), 0.2, 0.19, 10, 'z'),
    ...ring(V(0, 0.52, 0.16), 0.16, 0.16, 10, 'z'),
    ...ring(V(0, 0.6, 0.18), 0.1, 0.1, 10, 'z'),
  ]), 0.15, 0.7));
  C.push(body(hull([...ring(V(0, 0.52, 0.04), 0.15, 0.14, 8, 'y'), ...ring(V(0, 0.7, 0.08), 0.14, 0.13, 8, 'y')]), 0.4, 0.85));

  // chest feather rows (cream shards with gold tips)
  for (const [y, z, w, l] of [[0.62, 0.235, 0.07, 0.12], [0.5, 0.25, 0.075, 0.13], [0.38, 0.225, 0.075, 0.13]]) {
    C.push(gfeather(V(0, y, z), V(0, -1, 0.3), V(0, 0.25, 1), l, w));
    for (const [x, dz] of [[0.1, -0.035], [0.17, -0.1]]) {
      if (y > 0.6 && x > 0.12) continue;
      S.push(gfeather(V(x, y - 0.02, z + dz), V(x * 1.5, -1, 0.25), V(x * 6, 0.25, 1), l, w));
    }
  }

  // ================= HEAD =================
  const hc0 = C.length, hs0 = S.length;
  const H = { y: 0.84, z: 0.12 };
  C.push(paint(hull([
    ...cbox(V(0, H.y, H.z + 0.04), 0.17, 0.14, 0.11, 0.075),
    ...ring(V(0, H.y + 0.01, H.z - 0.1), 0.15, 0.12, 8, 'z'),
    ...ring(V(0, H.y - 0.0, H.z - 0.15), 0.1, 0.085, 8, 'z'),
    ...ring(V(0, H.y + 0.15, H.z - 0.0), 0.1, 0.08, 8, 'y'),
    V(0.17, H.y - 0.07, H.z + 0.0), V(-0.17, H.y - 0.07, H.z + 0.0),
  ]), P.head, 'y', [0.2, 1.02]));
  const FZ = H.z + 0.15;
  // nape: a few broad swept-back shards lying against the head
  const nape = (b, d, n, L, w) => gfeather(b, d, n, L, w, P.feather, 0.034, [[0, -0.4], [0, 0.4], [0.35, 0.5], [0.8, 0.35], [1, 0], [0.8, -0.35], [0.35, -0.5]]);
  C.push(nape(V(0, H.y + 0.12, H.z - 0.04), V(0, -0.3, -1), V(0, 1, -0.25), 0.19, 0.1));
  C.push(nape(V(0, H.y + 0.02, H.z - 0.1), V(0, -0.65, -1), V(0, 0.55, -1), 0.17, 0.1));
  S.push(nape(V(0.08, H.y + 0.08, H.z - 0.08), V(0.2, -0.45, -1), V(0.6, 0.8, -0.35), 0.17, 0.09));
  S.push(nape(V(0.11, H.y - 0.03, H.z - 0.08), V(0.18, -0.75, -1), V(1, 0.3, -0.35), 0.15, 0.09));
  S.push(nape(V(0.14, H.y - 0.08, H.z + 0.03), V(0.25, -0.85, -0.6), V(1, 0, 0.15), 0.12, 0.075));

  // glowing streak behind each eye (hawk eye-stripe as a rune)
  S.push(glow(hull([
    V(0.168, H.y + 0.055, H.z + 0.1), V(0.168, H.y + 0.02, H.z + 0.1), V(0.168, H.y + 0.01, H.z - 0.06), V(0.168, H.y - 0.03, H.z - 0.1),
    V(0.181, H.y + 0.045, H.z + 0.08), V(0.181, H.y + 0.025, H.z + 0.08), V(0.181, H.y + 0.0, H.z - 0.06), V(0.181, H.y - 0.025, H.z - 0.09),
  ])));
  // beak: gold hook
  const BY = H.y - 0.02;
  const beakPaint = (g) => paint(g, P.beak, 'y', [BY - 0.15, BY + 0.04]);
  C.push(beakPaint(hull([
    ...plate([[-0.075, 0.03], [0.075, 0.03], [0.08, -0.055], [0.05, -0.09], [-0.05, -0.09], [-0.08, -0.055]], V(0, BY, 0), FZ - 0.04, FZ - 0.015),
    V(0.045, BY + 0.02, FZ + 0.05), V(-0.045, BY + 0.02, FZ + 0.05),
    V(0.03, BY + 0.0, FZ + 0.12), V(-0.03, BY + 0.0, FZ + 0.12),
    V(0.04, BY - 0.06, FZ + 0.075), V(-0.04, BY - 0.06, FZ + 0.075),
    V(0.022, BY - 0.045, FZ + 0.145), V(-0.022, BY - 0.045, FZ + 0.145),
  ])));
  C.push(beakPaint(hull([
    V(0.022, BY - 0.035, FZ + 0.145), V(-0.022, BY - 0.035, FZ + 0.145),
    V(0.03, BY - 0.06, FZ + 0.09), V(-0.03, BY - 0.06, FZ + 0.09),
    V(0.0, BY - 0.14, FZ + 0.13), V(0.011, BY - 0.11, FZ + 0.11), V(-0.011, BY - 0.11, FZ + 0.11),
  ])));
  C.push(paint(hull([
    ...plate([[-0.05, 0], [0.05, 0], [0.045, -0.03], [-0.045, -0.03]], V(0, BY - 0.075, 0), FZ - 0.03, FZ - 0.01),
    V(0.026, BY - 0.085, FZ + 0.075), V(-0.026, BY - 0.085, FZ + 0.075), V(0, BY - 0.1, FZ + 0.055),
  ]), P.goldDk, 'flat'));
  S.push(paint(hull(cbox(V(0.028, BY + 0.014, FZ + 0.05), 0.009, 0.005, 0.011, 0.003)), P.mouth, 'flat'));

  // fierce eyes
  const E = V(0.088, H.y + 0.045, 0), es = 1.25;
  const sc = (arr) => arr.map(([u, v]) => [u * es, v * es]);
  S.push(paint(hull(plate(sc([[-0.036, 0.0], [0.044, 0.03], [0.05, -0.008], [0.02, -0.036], [-0.026, -0.032], [-0.04, -0.016]]),
    E, FZ - 0.014, FZ + 0.008, 0.35)), P.white, 'flat'));
  S.push(paint(hull(plate(sc([[-0.026, 0.0], [0.014, 0.017], [0.022, -0.008], [0.006, -0.03], [-0.02, -0.028], [-0.03, -0.012]]),
    V(E.x - 0.004, E.y, 0), FZ + 0.0, FZ + 0.014, 0.35)), P.eye, 'flat'));
  S.push(paint(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.008, FZ + 0.019, 0.35)), P.white, 'flat'));
  // heavy brow, gold trimmed edge
  S.push(paint(hull([
    V(0.022, E.y + 0.01, FZ + 0.03), V(0.025, E.y + 0.05, FZ + 0.018),
    V(0.16, E.y + 0.05, FZ - 0.045), V(0.155, E.y + 0.08, FZ - 0.06),
    V(0.022, E.y + 0.01, FZ - 0.03), V(0.025, E.y + 0.06, FZ - 0.04),
    V(0.15, E.y + 0.05, FZ - 0.075), V(0.145, E.y + 0.075, FZ - 0.08),
  ]), P.brow, 'y'));
  // glowing forehead diamond
  C.push(glow(hull([V(0, E.y + 0.1, FZ - 0.005), V(0, E.y + 0.045, FZ + 0.012), V(0.02, E.y + 0.072, FZ + 0.004), V(-0.02, E.y + 0.072, FZ + 0.004),
    V(0, E.y + 0.072, FZ - 0.03)])));

  // ================= HALO (floating, tilted gold ring) =================
  const HC = V(0, H.y + 0.29, H.z - 0.05), HR = 0.15, NH = 14;
  const tilt = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), -0.3);
  const sect = (a) => {
    const r = V(Math.cos(a), 0, Math.sin(a));
    const c = add(V(0, 0, 0), r, HR);
    const pts = [];
    for (let k = 0; k < 6; k++) {
      const b = (2 * Math.PI * k) / 6 + Math.PI / 6;
      pts.push(add(add(c, r, Math.cos(b) * 0.03), V(0, 1, 0), Math.sin(b) * 0.022));
    }
    return pts.map((p) => p.applyQuaternion(tilt).add(HC));
  };
  for (let k = 0; k < NH; k++) {
    const a0 = (2 * Math.PI * k) / NH + Math.PI / 2, a1 = (2 * Math.PI * (k + 1)) / NH + Math.PI / 2;
    C.push(paint(hull([...sect(a0), ...sect(a1)]), P.halo, 'y'));
  }

  // scale the head (and its halo) up about the neck for the big-head look
  const HS = 1.12, piv = V(0, 0.7, 0.1);
  for (const g of [...C.slice(hc0), ...S.slice(hs0)]) {
    g.translate(-piv.x, -piv.y, -piv.z); g.scale(HS, HS, HS); g.translate(piv.x, piv.y, piv.z);
  }

  // ================= WINGS (half-raised hawk wings: bent arm, 3 layered feather rows) =================
  const armPts = [V(0.15, 0.56, 0.02), V(0.29, 0.76, 0.01), V(0.42, 0.92, -0.06), V(0.5, 0.97, -0.18), V(0.54, 0.97, -0.31)];
  const arm = new THREE.CatmullRomCurve3(armPts, false, 'centripetal');
  S.push(paint(tube(curveSamples(armPts, 9, (t) => 0.06 - 0.03 * t, (t) => 0.045 - 0.02 * t),
    { seg: 6, ref: V(1, 0, 0.2), capEnd: 0.03, capStart: 0.0 }), P.body, 'y', [0.5, 1.0]));
  // gold trim along the leading edge
  S.push(paint(tube(curveSamples(armPts.slice(1).map((p) => add(p, V(-0.008, 0.04, 0.012))), 8, (t) => 0.02 - 0.008 * t),
    { seg: 6, ref: V(1, 0, 0.2), capEnd: 0.02, capStart: 0.01 }), P.gold, 'y'));
  const wingAt = (t) => {
    const p = arm.getPoint(t), T = arm.getTangent(t);
    const ang = -1.25 + 0.8 * Math.pow(t, 0.9);
    const dir = nrm(V(0.18 + 0.1 * t, Math.sin(ang), -Math.cos(ang)));
    let n = nrm(cross(T, dir)); if (n.x < 0) n.multiplyScalar(-1);
    return { p, dir, n };
  };
  // row 1: long flight feathers (secondaries -> primaries), cream with gold tips
  const NF = 8;
  for (let i = 0; i < NF; i++) {
    const t = 0.06 + 0.94 * i / (NF - 1);
    const { p, dir, n } = wingAt(t);
    S.push(gfeather(add(p, n, -0.016 + (NF - i) * 0.003), dir, n, 0.28 + 0.14 * t, 0.105, P.featherD, 0.02));
  }
  // row 2: secondary coverts
  const NM = 7;
  for (let i = 0; i < NM; i++) {
    const t = 0.04 + 0.86 * i / (NM - 1);
    const { p, dir, n } = wingAt(t);
    S.push(gfeather(add(p, n, 0.014 + (NM - i) * 0.003), dir, n, 0.17 + 0.08 * t, 0.1, P.feather, 0.02));
  }
  // row 3: marble coverts along the arm, glowing chevrons on alternate ones
  const NC = 6;
  for (let i = 0; i < NC; i++) {
    const t = 0.04 + 0.78 * i / (NC - 1);
    const { p, dir, n } = wingAt(t);
    const b0 = add(add(p, n, 0.04 + (NC - i) * 0.003), V(0, 0.015, 0));
    S.push(paintMarble(blade(b0, dir, n, 0.13, 0.09, 0.022,
      [[0, -0.45], [0, 0.45], [0.7, 0.5], [1, 0], [0.7, -0.5]]), 0.55, 1.0, 2.5));
    if (i % 2 === 1) S.push(glow(blade(add(add(b0, n, 0.014), dir, 0.035), dir, n, 0.07, 0.035, 0.012,
      [[0, -0.5], [0, 0.5], [1, 0]])));
  }
  // marble shoulder plate with gold trim and glowing rune
  const SP = V(0.21, 0.5, 0.06);
  S.push(paintMarble(hull([
    ...plate([[-0.06, 0.07], [0.06, 0.07], [0.075, -0.0], [0.0, -0.1], [-0.075, -0.0]], V(0, SP.y, 0), SP.z - 0.04, SP.z + 0.04).map((p) => V(SP.x - 0.015, p.y, p.x + p.z)),
    ...plate([[-0.05, 0.06], [0.05, 0.06], [0.064, -0.0], [0.0, -0.085], [-0.064, -0.0]], V(0, SP.y, 0), SP.z - 0.04, SP.z + 0.04).map((p) => V(SP.x + 0.02, p.y, p.x + p.z)),
  ]), 0.4, 0.62, 3));
  S.push(gold(hull([...cbox(V(SP.x - 0.005, SP.y + 0.075, SP.z), 0.035, 0.014, 0.075, 0.008)])));
  S.push(glow(hull([V(SP.x + 0.027, SP.y + 0.03, SP.z), V(SP.x + 0.027, SP.y - 0.06, SP.z), V(SP.x + 0.027, SP.y - 0.01, SP.z + 0.025),
    V(SP.x + 0.027, SP.y - 0.01, SP.z - 0.025), V(SP.x + 0.015, SP.y - 0.01, SP.z)])));
  // back cape: rows of broad gold-tipped feathers with glowing rune chevrons on the centre line
  for (const [y, z, L] of [[0.68, -0.07, 0.18], [0.58, -0.12, 0.18], [0.48, -0.17, 0.17]]) {
    for (const x of [0, 0.1]) {
      const d = V(x * 1.6, -0.6, -1), n = V(x * 4, 1, -0.55);
      (x === 0 ? C : S).push(gfeather(V(x, y, z + (x ? 0.02 : 0)), d, n, L, 0.09));
      if (x === 0) C.push(glow(blade(add(V(0, y, z), nrm(n), 0.022), d, n, L * 0.5, 0.04, 0.012, [[0, -0.5], [0, 0.5], [1, 0]])));
    }
  }
  // flank feathers below the wing
  for (const [y, z] of [[0.44, -0.0], [0.4, -0.1], [0.32, -0.05], [0.33, -0.15]])
    S.push(gfeather(V(0.17, y, z), V(0.25, -1, -0.35), V(1, 0, -0.1), 0.13, 0.06));
  // gold collar
  C.push(gold(hull([...ring(V(0, 0.66, 0.085), 0.155, 0.145, 10, 'y'), ...ring(V(0, 0.7, 0.09), 0.16, 0.15, 10, 'y')])));

  // ================= TAIL (fan of broad gold-tipped feathers) =================
  for (const [x, dx, L, w, sw] of [[0, 0, 0.4, 0.11, P.feather], [0.035, 0.3, 0.39, 0.105, P.featherD],
    [0.065, 0.62, 0.37, 0.1, P.feather], [0.09, 0.98, 0.34, 0.095, P.featherD], [0.11, 1.5, 0.32, 0.095, P.feather]]) {
    const g = gfeather(V(x, 0.38 - x * 0.2, -0.19 + x * 0.35), V(dx, -0.7, -1), V(dx * 0.5, 1, -0.7), L, w, sw, 0.026);
    (x === 0 ? C : S).push(g);
  }

  // ================= LEGS (feathered thighs, gold legs, gold trim cuffs) =================
  const legX = 0.1;
  S.push(cream(blob(1, V(legX, 0.25, -0.0), V(0.09, 0.1, 0.105), { jitter: 0.15 }), 0.15, 0.4));
  S.push(gfeather(V(legX + 0.06, 0.27, 0.04), V(0.3, -1, 0.2), V(1, 0, 0.6), 0.1, 0.045));
  S.push(gfeather(V(legX + 0.06, 0.27, -0.06), V(0.3, -1, -0.3), V(1, 0, -0.5), 0.1, 0.045));
  S.push(gfeather(V(legX, 0.27, 0.075), V(0, -1, 0.3), V(0, 0, 1), 0.09, 0.045));
  S.push(paint(hull([...ring(V(legX, 0.2, -0.005), 0.05, 0.05, 6), ...ring(V(legX + 0.003, 0.12, 0.005), 0.048, 0.048, 6),
    ...ring(V(legX + 0.005, 0.04, 0.02), 0.045, 0.045, 6)]), P.beak, 'y', [0, 0.22]));
  // marble cuff with gold rims and glowing band
  S.push(paintMarble(hull([...ring(V(legX + 0.003, 0.11, 0.005), 0.062, 0.062, 8), ...ring(V(legX + 0.003, 0.16, 0.0), 0.062, 0.062, 8)]), 0.1, 0.17, 3));
  S.push(gold(hull([...ring(V(legX + 0.003, 0.1, 0.005), 0.068, 0.068, 8), ...ring(V(legX + 0.003, 0.115, 0.005), 0.068, 0.068, 8)])));
  S.push(gold(hull([...ring(V(legX + 0.003, 0.155, 0.0), 0.068, 0.068, 8), ...ring(V(legX + 0.003, 0.17, 0.0), 0.068, 0.068, 8)])));
  S.push(glow(hull([...ring(V(legX + 0.003, 0.128, 0.003), 0.066, 0.066, 8), ...ring(V(legX + 0.003, 0.142, 0.002), 0.066, 0.066, 8)])));
  const foot = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.032, z), 0.05, 0.032, 0.05, 0.014)), P.beak, 'y', [0, 0.07]));
    for (const [dx, dz] of [[-0.06, 0.085], [0, 0.11], [0.06, 0.085]]) {
      S.push(paint(hull([...cbox(V(x + dx * 0.45, 0.026, z + dz * 0.45), 0.023, 0.026, 0.023, 0.008),
        ...cbox(V(x + dx, 0.022, z + dz), 0.021, 0.022, 0.017, 0.007)]), P.beak, 'y', [0, 0.07]));
      S.push(paint(shard(V(x + dx * 1.08, 0.022, z + dz + 0.014), V(dx, -0.5, 0.8), 0.017, 0.045), P.talon, 'flat'));
    }
    S.push(paint(hull([...cbox(V(x, 0.022, z - 0.055), 0.018, 0.022, 0.03, 0.006)]), P.beak, 'y', [0, 0.07]));
    S.push(paint(shard(V(x, 0.018, z - 0.085), V(0, -0.4, -1), 0.015, 0.04), P.talon, 'flat'));
  };
  foot(legX + 0.005, 0.03);

  // ================= CHEST MEDALLION (gold-trimmed marble with glowing gem) =================
  const MY = 0.52, MZ = 0.3;
  C.push(gold(hull(plate([[-0.075, 0.06], [0.075, 0.06], [0.09, 0.0], [0.0, -0.1], [-0.09, 0.0]], V(0, MY, 0), MZ - 0.03, MZ + 0.005, 0))));
  C.push(paintMarble(hull(plate([[-0.06, 0.048], [0.06, 0.048], [0.072, 0.0], [0.0, -0.08], [-0.072, 0.0]], V(0, MY, 0), MZ - 0.02, MZ + 0.018, 0)), MY - 0.08, MY + 0.05, 3));
  C.push(glow(hull([V(0, MY + 0.03, MZ + 0.022), V(0, MY - 0.05, MZ + 0.022), V(0.025, MY - 0.005, MZ + 0.022), V(-0.025, MY - 0.005, MZ + 0.022),
    V(0, MY - 0.005, MZ + 0.042)])));

  // ================= FLOATING CRYSTALS (mirrored, glowing) =================
  const crystal = (c, r, h) => hull([V(c.x, c.y + h, c.z), V(c.x, c.y - h, c.z), ...ring(c, r, r, 4, 'y', 0)]);
  S.push(paint(crystal(V(0.29, 1.06, 0.1), 0.04, 0.075), P.halo, 'y'));

  return assemble(C, S);
}

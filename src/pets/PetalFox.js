// Petal Fox (Godly, Round 7 – Blossom Brawl): chunky faceted pink fox with white tips, a tail of
// cherry-blossom petal shards, jade pendant, silk ribbon, ornate gold armour and glowing jade runes.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// two-tone swatch: `split` (0..1 down the gradient) separates the top colour band from the bottom gradient
const twoTone = (i, aTop, aBot, split, bTop, bBot, invert = false) => ({
  i, top: aTop, bot: bBot,
  draw(g, x, y) {
    const sp = 16 + Math.round(96 * split);
    const fill = (y0, y1, c0, c1) => {
      const gr = g.createLinearGradient(0, y + y0, 0, y + y1);
      gr.addColorStop(0, c0); gr.addColorStop(1, c1);
      g.fillStyle = gr; g.fillRect(x, y + y0, 128, y1 - y0);
    };
    if (!invert) { fill(0, sp, aTop, aBot); fill(sp, 128, bTop, bBot); }
    else { fill(0, sp, aTop, aBot); fill(sp, 128, bTop, bBot); }
  },
});

export const PALETTE = {
  fur: { i: 0, top: '#FFA6CB', bot: '#EC6FA6' },
  white: { i: 1, top: '#FFFFFF', bot: '#F4E8EF' },
  // ears: white tip on top, pink below
  earC: twoTone(2, '#FFFFFF', '#F7EEF3', 0.3, '#FFA0C8', '#E86CA2'),
  // legs: pink above, white socks below
  legC: twoTone(3, '#FFA6CB', '#F27DB0', 0.62, '#FFFFFF', '#F3E6EE'),
  eye: { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  eyeW: { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  nose: { i: 6, top: '#4A3040', bot: '#1E1219' },
  earIn: { i: 7, top: '#D9578F', bot: '#B83A72' },
  brow: { i: 8, top: '#F07FB2', bot: '#C9548A' },
  petalA: { i: 9, top: '#FFDCEA', bot: '#F38DB6' },   // pale tip -> pink base
  petalB: { i: 10, top: '#FFC2DA', bot: '#F06AA4' },  // deeper
  petalW: { i: 11, top: '#FFFFFF', bot: '#FFC4DC' },  // white-tipped
  gold: { i: 12, top: '#FFE681', bot: '#DDA024' },
  goldD: { i: 13, top: '#F2C445', bot: '#B87A12' },
  jade: { i: 14, top: '#8FF2BE', bot: '#159A64' },
  silk: { i: 15, top: '#FF5C79', bot: '#C21E4A' },
  rune: { i: 16, top: '#A8FFE4', bot: '#22E8B0', glow: true },
  mouth: { i: 17, top: '#5A2A3A', bot: '#3A1626' },
  stamen: { i: 18, top: '#FFF4A8', bot: '#FFC93C', glow: true },
  core: { i: 19, top: '#F57AAE', bot: '#FFE6F0' },
};
const SW = PALETTE;

// ---------- local helpers ----------
const N = (x, y, z) => V(x, y, z).normalize();
// 2D polygon in the (u, v) plane at c, extruded along n between t0 and t1
function slab(c, u, v, n, poly, t0, t1) {
  const pts = [];
  for (const [a, b] of poly) for (const t of [t0, t1])
    pts.push(c.clone().addScaledVector(u, a).addScaledVector(v, b).addScaledVector(n, t));
  return pts;
}
// orthonormal frame from a direction and a hint normal
function frame(dir, nHint) {
  const u = dir.clone().normalize();
  const v = new THREE.Vector3().crossVectors(nHint, u).normalize();
  const n = new THREE.Vector3().crossVectors(u, v).normalize();
  return { u, v, n };
}
// UVs: gradient along a direction (t = 0 at `from` side uses `top` colour when invert=false)
function paintAlong(g, sw, origin, dir, len, invert = false) {
  const p = g.attributes.position, uv = [];
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  for (let i = 0; i < p.count; i++) {
    let t = (V(p.getX(i), p.getY(i), p.getZ(i)).sub(origin).dot(dir)) / len;
    t = THREE.MathUtils.clamp(t, 0, 1);
    if (!invert) t = 1 - t; // tip = light top colour
    uv.push((x + 64) / 1024, (y + 16 + t * 96) / 1024);
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
// one cherry petal: broad, flat, faceted, with a flattened notched-looking tip and a ridge
function petal(base, dir, nHint, len, wid, thick, sw) {
  const { u, v, n } = frame(dir, nHint);
  const pts = slab(base, u, v, n, [
    [0, -wid * 0.16], [0, wid * 0.16], [len * 0.45, wid * 0.5], [len * 0.45, -wid * 0.5],
    [len, wid * 0.32], [len, -wid * 0.32],
  ], -thick, thick);
  return paintAlong(hull(pts), sw, base, u, len);
}
// shingle petal: thin pointed plate (5-sided outline), ~0.024 thick
function shingle(base, dir, nHint, len, wid, sw) {
  const { u, v, n } = frame(dir, nHint);
  const pts = slab(base, u, v, n, [[0, -wid * 0.2], [0, wid * 0.2], [len * 0.5, wid * 0.5], [len * 0.5, -wid * 0.5], [len, 0]], -0.012, 0.012);
  return paintAlong(hull(pts), sw, base, u, len);
}
// a 5-petal blossom facing `nrm`, first petal pointing along `up0`
function blossom(out, c, nrm, up0, r, sw, cup = 0.35) {
  const nn = nrm.clone().normalize();
  const a = up0.clone().addScaledVector(nn, -up0.dot(nn)).normalize();
  const b = new THREE.Vector3().crossVectors(nn, a);
  for (let k = 0; k < 5; k++) {
    const th = (2 * Math.PI * k) / 5;
    const d = a.clone().multiplyScalar(Math.cos(th)).addScaledVector(b, Math.sin(th));
    const dir = d.clone().addScaledVector(nn, cup).normalize();
    out.push(petal(c.clone().addScaledVector(d, r * 0.12), dir, nn, r, r * 0.95, 0.008, sw));
  }
  out.push(paint(hull([...ringAround(c.clone().addScaledVector(nn, r * 0.05), nn, a, r * 0.2, 5),
    c.clone().addScaledVector(nn, r * 0.32), c.clone().addScaledVector(nn, -r * 0.05)]), SW.stamen, 'flat'));
}
function ringAround(c, nrm, a, r, n) {
  const b = new THREE.Vector3().crossVectors(nrm, a).normalize();
  const pts = [];
  for (let k = 0; k < n; k++) {
    const th = (2 * Math.PI * k) / n + Math.PI / n;
    pts.push(c.clone().addScaledVector(a, Math.cos(th) * r).addScaledVector(b, Math.sin(th) * r));
  }
  return pts;
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0), Y = V(0, 1, 0), Z = V(0, 0, 1);
  const fur = (pts, lo = 0.1, hi = 0.95) => paint(hull(pts), SW.fur, 'y', [lo, hi]);
  const white = (g) => paint(g, SW.white, 'flat');
  const gold = (g, lo, hi) => paint(g, SW.gold, lo === undefined ? 'flat' : 'y', lo === undefined ? null : [lo, hi]);

  // ================= BODY =================
  C.push(fur([
    ...ring(V(0, 0.36, -0.27), 0.085, 0.08, 10, 'z'),
    ...ring(V(0, 0.37, -0.21), 0.14, 0.135, 10, 'z'),
    ...ring(V(0, 0.37, -0.06), 0.155, 0.15, 10, 'z'),
    ...ring(V(0, 0.39, 0.08), 0.16, 0.16, 10, 'z'),
    ...ring(V(0, 0.42, 0.19), 0.145, 0.15, 10, 'z'),
    ...ring(V(0, 0.44, 0.25), 0.09, 0.1, 10, 'z'),
  ], 0.2, 0.56));
  // white belly underside
  C.push(white(hull([...cbox(V(0, 0.27, 0.0), 0.1, 0.035, 0.2, 0.03)])));
  // neck
  C.push(fur([...ring(V(0, 0.44, 0.17), 0.115, 0.11, 10, 'y'), ...ring(V(0, 0.6, 0.22), 0.12, 0.11, 10, 'y')], 0.3, 0.8));

  // ================= LEGS =================
  const legPaint = (g) => paint(g, SW.legC, 'y', [0.0, 0.46]);
  S.push(legPaint(hull([...ring(V(0.135, 0.06, 0.2), 0.062, 0.062, 8), ...ring(V(0.13, 0.2, 0.195), 0.068, 0.07, 8),
    ...ring(V(0.12, 0.33, 0.17), 0.085, 0.095, 8), ...ring(V(0.1, 0.42, 0.14), 0.065, 0.08, 8)])));
  S.push(legPaint(hull([...ring(V(0.115, 0.43, -0.16), 0.065, 0.095, 8), ...ring(V(0.14, 0.32, -0.15), 0.095, 0.135, 8),
    ...ring(V(0.14, 0.21, -0.145), 0.075, 0.095, 8)])));
  S.push(legPaint(hull([...ring(V(0.143, 0.23, -0.155), 0.068, 0.075, 8), ...ring(V(0.146, 0.13, -0.19), 0.064, 0.064, 8),
    ...ring(V(0.147, 0.06, -0.18), 0.062, 0.062, 8)])));
  const paw = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.04, z - 0.005), 0.066, 0.04, 0.062, 0.02)), SW.white, 'y', [0, 0.09]));
    for (const dx of [-0.042, 0, 0.042])
      S.push(paint(hull([[0, 0.023, 0.03], [0.042, 0.023, 0.03], [0.064, 0.014, 0.018]].flatMap(([y, hx, hz]) =>
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => V(x + dx + a * hx, y, z + 0.056 + b * hz)))), SW.white, 'y', [0, 0.09]));
  };
  paw(0.137, 0.2);
  paw(0.147, -0.16);
  // gold anklet cuffs with a rune bar
  const cuff = (x, y, z, r) => {
    S.push(gold(hull([...ring(V(x, y - 0.022, z), r, r, 8), ...ring(V(x, y + 0.022, z), r * 1.03, r * 1.03, 8)]), y - 0.03, y + 0.03));
    S.push(paint(hull([...[-1, 1].flatMap((a) => [-1, 1].flatMap((b) => [V(x + r - 0.01, y + a * 0.009, z + b * 0.024), V(x + r + 0.007, y + a * 0.009, z + b * 0.024)]))]), SW.rune, 'flat'));
  };
  cuff(0.135, 0.13, 0.198, 0.071);
  cuff(0.146, 0.135, -0.188, 0.07);

  // ================= CHEST RUFF (white shards) =================
  C.push(paint(blob(1, V(0, 0.44, 0.245), V(0.13, 0.14, 0.085), { jitter: 0.18 }), SW.white, 'y', [0.26, 0.62]));
  C.push(white(shard(V(0, 0.32, 0.26), V(0, -1, 0.35), 0.05, 0.1)));
  for (const [b, d, w, l] of [
    [V(0.05, 0.32, 0.26), V(0.25, -1, 0.35), 0.046, 0.09],
    [V(0.095, 0.35, 0.24), V(0.6, -1, 0.3), 0.045, 0.08],
    [V(0.115, 0.45, 0.26), V(0.9, -0.7, 0.6), 0.045, 0.07],
  ]) S.push(white(shard(b, d, w, l)));
  // pink fur tufts at hip
  S.push(paint(shard(V(0.16, 0.37, -0.1), V(0.6, -0.5, -1), 0.04, 0.06), SW.fur, 'flat'));

  // ================= ARMOUR: pauldrons (front shoulders) and hip plates =================
  const armourPlate = (c, out, up, w, h, layers, rune) => {
    // layered curved gold plates; out = outward normal
    const { u, v, n } = frame(up, out); // u = up along plate, v sideways, n ~ out
    for (let k = 0; k < layers; k++) {
      const cc = c.clone().addScaledVector(u, -k * h * 0.42).addScaledVector(n, k * 0.014);
      const s = 1 - k * 0.08;
      const g = hull([
        ...slab(cc, u, v, n, [[h * 0.5, -w * 0.35 * s], [h * 0.5, w * 0.35 * s], [h * 0.1, w * 0.55 * s], [-h * 0.5, w * 0.48 * s],
          [-h * 0.5, -w * 0.48 * s], [h * 0.1, -w * 0.55 * s]], -0.012, 0.012),
        cc.clone().addScaledVector(n, 0.03 + 0.004 * k),
      ]);
      S.push(paint(g, k === 0 ? SW.gold : SW.goldD, 'y', [cc.y - h * 0.6, cc.y + h * 0.6]));
      // raised trim lip along the lower edge of the last layer
      if (k === layers - 1) S.push(paint(hull(slab(cc, u, v, n, [[-h * 0.36, -w * 0.5 * s], [-h * 0.36, w * 0.5 * s], [-h * 0.55, w * 0.5 * s], [-h * 0.55, -w * 0.5 * s]], -0.012, 0.03)), SW.gold, 'flat'));
    }
    if (rune) {
      // glowing rune glyph on the top plate: vertical bar + two chevron strokes
      const rc = c.clone().addScaledVector(n, 0.02);
      const bar = (a0, b0, a1, b1, wd) => {
        const p0 = rc.clone().addScaledVector(u, a0).addScaledVector(v, b0), p1 = rc.clone().addScaledVector(u, a1).addScaledVector(v, b1);
        const d = p1.clone().sub(p0).normalize(), side = new THREE.Vector3().crossVectors(n, d).normalize();
        const pts = [];
        for (const p of [p0, p1]) for (const s of [-1, 1]) for (const t of [0.0, 0.012])
          pts.push(p.clone().addScaledVector(side, s * wd).addScaledVector(n, t));
        S.push(paint(hull(pts), SW.rune, 'flat'));
      };
      bar(h * 0.4, 0, -h * 0.3, 0, 0.011);
      bar(h * 0.2, -w * 0.3, -h * 0.08, 0, 0.0095);
      bar(h * 0.2, w * 0.3, -h * 0.08, 0, 0.0095);
    }
  };
  armourPlate(V(0.195, 0.415, 0.15), N(1, 0.5, 0.15), N(-0.35, 1, 0.05), 0.2, 0.14, 2, true);
  armourPlate(V(0.2, 0.375, -0.16), N(1, 0.35, -0.1), N(-0.25, 1, 0.1), 0.17, 0.12, 2, true);
  // gold saddle plate along the spine with a big glowing rune
  {
    const pts = [];
    for (const [z, rx, ry, yc] of [[-0.17, 0.152, 0.147, 0.37], [-0.06, 0.155, 0.15, 0.37], [0.05, 0.158, 0.157, 0.385]])
      for (const a of [0.27, 0.4, 0.6, 0.73].map((f) => f * Math.PI))
        for (const k of [0.92, 1.1]) pts.push(V(Math.cos(a) * rx * k, yc + Math.sin(a) * ry * k, z));
    C.push(gold(hull(pts), 0.45, 0.56));
    const top = 0.37 + 0.15 * 1.1;
    const rb = (x0, z0, x1, z1, w) => {
      const d = V(x1 - x0, 0, z1 - z0).normalize(), sd = V(d.z, 0, -d.x);
      const q = [];
      for (const [x, z] of [[x0, z0], [x1, z1]]) for (const sg of [-1, 1]) for (const y of [top - 0.02, top + 0.008])
        q.push(V(x + sd.x * w * sg, y, z + sd.z * w * sg));
      return paint(hull(q), SW.rune, 'flat');
    };
    C.push(rb(0, -0.14, 0, 0.03, 0.011));
    S.push(rb(0.004, -0.02, 0.05, -0.07, 0.009));
    S.push(rb(0.004, -0.085, 0.045, -0.13, 0.009));
      }
  // gold spikes on pauldrons
  S.push(gold(shard(V(0.19, 0.46, 0.15), N(0.6, 1, -0.2), 0.03, 0.09)));

  // ================= HEAD =================
  const H = { y: 0.68, z: 0.24 };
  C.push(fur([
    ...cbox(V(0, H.y, H.z), 0.18, 0.14, 0.145, 0.06),
    ...ring(V(0, H.y + 0.16, H.z - 0.01), 0.11, 0.09, 8, 'y'),
    V(0.225, H.y - 0.06, H.z + 0.02), V(-0.225, H.y - 0.06, H.z + 0.02),
  ], 0.52, 0.9));
  const FZ = H.z + 0.145;
  // white cheeks / lower face
  C.push(white(hull([
    ...cbox(V(0, H.y - 0.085, H.z + 0.04), 0.17, 0.055, 0.12, 0.04),
    V(0.235, H.y - 0.065, H.z + 0.02), V(-0.235, H.y - 0.065, H.z + 0.02),
  ])));
  // cheek fluff shards pointing out (fox cheeks)
  S.push(white(shard(V(0.2, H.y - 0.07, H.z + 0.02), N(1, -0.35, -0.1), 0.045, 0.085)));
  S.push(white(shard(V(0.18, H.y - 0.11, H.z - 0.03), N(0.8, -0.8, -0.3), 0.04, 0.07)));
  S.push(paint(shard(V(0.17, H.y + 0.02, H.z - 0.08), N(0.9, -0.1, -0.6), 0.04, 0.07), SW.fur, 'flat'));
  // forehead tufts
  C.push(paint(shard(V(0, H.y + 0.15, H.z - 0.04), N(0, 0.6, -1), 0.04, 0.08), SW.fur, 'flat'));

  // muzzle: fox wedge, white with a pink bridge on top
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.075, FZ - 0.01), 0.095, 0.055, 0.03, 0.02),
    ...cbox(V(0, H.y - 0.085, FZ + 0.1), 0.042, 0.032, 0.02, 0.012),
  ]), SW.white, 'y', [0.55, 0.7]));
  C.push(fur([
    ...cbox(V(0, H.y - 0.005, FZ - 0.03), 0.05, 0.035, 0.03, 0.015),
    ...cbox(V(0, H.y - 0.045, FZ + 0.09), 0.032, 0.014, 0.02, 0.008),
  ], 0.6, 0.75));
  // jaw
  C.push(white(hull(cbox(V(0, H.y - 0.135, FZ + 0.03), 0.06, 0.022, 0.06, 0.012))));
  // nose
  C.push(paint(hull([...cbox(V(0, H.y - 0.055, FZ + 0.125), 0.032, 0.02, 0.016, 0.008),
    V(0, H.y - 0.082, FZ + 0.115)]), SW.nose, 'y'));
  // mouth line
  S.push(paint(hull([V(0, H.y - 0.118, FZ + 0.12), V(0, H.y - 0.108, FZ + 0.12), V(0.04, H.y - 0.124, FZ + 0.098),
    V(0.04, H.y - 0.116, FZ + 0.098), V(0, H.y - 0.118, FZ + 0.105), V(0.04, H.y - 0.12, FZ + 0.085)]), SW.mouth, 'flat'));

  // fierce eyes
  const E = V(0.088, H.y + 0.03, 0);
  S.push(paint(hull(plate([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]],
    E, FZ - 0.01, FZ + 0.012)), SW.eyeW, 'flat'));
  S.push(paint(hull(plate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]],
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.014, FZ + 0.021)), SW.eyeW, 'flat'));
  // heavy brow
  S.push(paint(hull([
    V(0.028, E.y + 0.012, FZ + 0.03), V(0.03, E.y + 0.05, FZ + 0.02),
    V(0.15, E.y + 0.05, FZ - 0.01), V(0.15, E.y + 0.088, FZ - 0.025),
    V(0.028, E.y + 0.012, FZ - 0.03), V(0.03, E.y + 0.06, FZ - 0.04),
    V(0.15, E.y + 0.05, FZ - 0.06), V(0.15, E.y + 0.09, FZ - 0.07),
  ]), SW.brow, 'y'));

  // gold forehead crest with jade gem and rune
  C.push(gold(hull([
    V(0, E.y + 0.065, FZ + 0.008), V(0, E.y + 0.19, FZ - 0.035),
    V(0.055, E.y + 0.11, FZ - 0.016), V(-0.055, E.y + 0.11, FZ - 0.016),
    V(0, E.y + 0.065, FZ - 0.04), V(0, E.y + 0.2, FZ - 0.08),
  ])));
  // crest wing flares: two gold feathers per side sweeping up and out
  const feather = (b, tip, w) => {
    const d = tip.clone().sub(b), L = d.length();
    const { u, v, n } = frame(d, N(0, 0.25, 1));
    return paint(hull(slab(b, u, v, n, [[0, -w * 0.45], [0, w * 0.45], [L * 0.65, w * 0.5], [L, 0], [L * 0.55, -w * 0.3]], -0.009, 0.009)), SW.gold, 'y', [b.y - 0.02, tip.y]);
  };
  S.push(feather(V(0.035, E.y + 0.12, FZ - 0.03), V(0.15, E.y + 0.2, FZ - 0.06), 0.05));
  S.push(feather(V(0.035, E.y + 0.1, FZ - 0.025), V(0.14, E.y + 0.13, FZ - 0.05), 0.04));
  C.push(paint(hull([V(0, E.y + 0.085, FZ + 0.012), V(0, E.y + 0.135, FZ - 0.006),
    V(0.02, E.y + 0.108, FZ + 0.006), V(-0.02, E.y + 0.108, FZ + 0.006), V(0, E.y + 0.108, FZ - 0.02)]), SW.jade, 'y'));

  // pointy ears: tall pyramids, white tips, dark pink inner
  const EB = V(0.105, H.y + 0.1, H.z - 0.02);
  const earTip = V(0.175, H.y + 0.34, H.z - 0.025);
  const EF = H.z + 0.03; // ear front plane
  S.push(paint(hull([
    V(EB.x - 0.06, EB.y, EF), V(EB.x + 0.07, EB.y - 0.01, EF),
    V(EB.x - 0.06, EB.y, H.z - 0.09), V(EB.x + 0.07, EB.y - 0.01, H.z - 0.09),
    V(earTip.x, earTip.y, EF - 0.01), V(earTip.x, earTip.y, EF - 0.035),
  ]), SW.earC, 'y', [EB.y + 0.02, earTip.y]));
  S.push(paint(hull([
    V(EB.x - 0.035, EB.y + 0.02, EF + 0.002), V(EB.x + 0.045, EB.y + 0.015, EF + 0.002),
    V(earTip.x - 0.012, earTip.y - 0.1, EF + 0.0), V(EB.x - 0.035, EB.y + 0.02, EF + 0.012),
    V(EB.x + 0.045, EB.y + 0.015, EF + 0.012), V(earTip.x - 0.012, earTip.y - 0.1, EF + 0.008),
  ]), SW.earIn, 'flat'));
  // white inner-ear fluff
  S.push(white(shard(V(EB.x + 0.0, EB.y + 0.01, EF + 0.0), N(0.1, 1, 0.5), 0.022, 0.06)));
  // gold ear cuff
  S.push(gold(hull([...ring(V(EB.x + 0.015, EB.y + 0.07, H.z - 0.03), 0.052, 0.055, 6)
    .map((p) => p), ...ring(V(EB.x + 0.02, EB.y + 0.1, H.z - 0.03), 0.046, 0.05, 6)]), EB.y + 0.06, EB.y + 0.11));

  // ================= SILK RIBBON round the neck, bow at the back, trailing ends =================
  const NK = { y: 0.5, z: 0.2 };
  const neckPts = [];
  for (let k = 0; k <= 6; k++) {
    const a = Math.PI * (k / 6); // 0 = back, PI = front
    neckPts.push(V(Math.sin(a) * 0.132, NK.y + 0.035 * Math.cos(a) - 0.0, NK.z - Math.cos(a) * 0.12 + 0.01));
  }
  S.push(paint(tube(curveSamples(neckPts, 9, () => 0.012, () => 0.03), { seg: 4, axis: null, ref: Y, phase: Math.PI / 4 }), SW.silk, 'y', [NK.y - 0.06, NK.y + 0.06]));
  // bow at the back of the neck
  const BW = V(0, NK.y + 0.045, NK.z - 0.12);
  C.push(paint(hull(cbox(BW, 0.022, 0.024, 0.02, 0.008)), SW.silk, 'flat'));
  S.push(paint(hull([V(0.015, BW.y + 0.012, BW.z), V(0.015, BW.y - 0.012, BW.z), V(0.015, BW.y, BW.z - 0.01),
    V(0.085, BW.y + 0.045, BW.z - 0.01), V(0.09, BW.y - 0.01, BW.z - 0.015), V(0.08, BW.y + 0.02, BW.z - 0.03),
    V(0.085, BW.y + 0.045, BW.z + 0.01), V(0.09, BW.y - 0.01, BW.z + 0.005)]), SW.silk, 'y', [BW.y - 0.03, BW.y + 0.05]));
  // trailing ends: flat ribbons flowing down over the back
  S.push(paint(tube(curveSamples([V(0.012, BW.y - 0.01, BW.z - 0.01), V(0.05, BW.y - 0.02, BW.z - 0.09),
    V(0.09, BW.y - 0.0, BW.z - 0.19), V(0.12, BW.y - 0.05, BW.z - 0.28)], 7, (t) => 0.024 + 0.006 * t, () => 0.006),
    { seg: 4, axis: Y, phase: Math.PI / 4, capEnd: 0.03 }), SW.silk, 'len'));
  // gold chest/collar plate under the ruff, framing the jade pendant (trim layer behind)
  {
    const shape = (e) => [[0, 0.47 + e], [0.1 + e, 0.47 + e], [0.125 + e, 0.42], [0.08 + e, 0.35 - e * 0.6], [0, 0.315 - e], [-0.08 - e, 0.35 - e * 0.6], [-0.125 - e, 0.42], [-0.1 - e, 0.47 + e]];
    const pl = (e, z0, z1) => { const pts = []; for (const [x, y] of shape(e)) for (const z of [z0, z1]) pts.push(V(x, y, z - (0.47 - y) * 0.25)); return hull(pts); };
    C.push(paint(pl(0.016, 0.318, 0.332), SW.goldD, 'flat'));
    C.push(paint(pl(0, 0.33, 0.345), SW.gold, 'y', [0.31, 0.48]));
    for (const [x0, y0, x1, y1] of [[0.088, 0.455, 0.088, 0.385], [0.06, 0.42, 0.03, 0.345]]) {
      const pts = [];
      for (const [x, y] of [[x0, y0], [x1, y1]]) for (const dx of [-0.008, 0.008]) for (const dz of [0, 0.01])
        pts.push(V(x + dx, y, 0.343 - (0.47 - y) * 0.25 + dz));
      S.push(paint(hull(pts), SW.rune, 'flat'));
    }
  }
  // gold clasp + jade pendant at the front
  C.push(gold(hull(cbox(V(0, NK.y - 0.025, NK.z + 0.135), 0.03, 0.03, 0.014, 0.01))));
  C.push(paint(hull([V(0, NK.y - 0.045, NK.z + 0.16), V(0.04, NK.y - 0.09, NK.z + 0.16), V(-0.04, NK.y - 0.09, NK.z + 0.16),
    V(0, NK.y - 0.15, NK.z + 0.155), V(0, NK.y - 0.09, NK.z + 0.18),
    V(0.03, NK.y - 0.09, NK.z + 0.13), V(-0.03, NK.y - 0.09, NK.z + 0.13), V(0, NK.y - 0.05, NK.z + 0.13)]), SW.jade, 'y'));
  // gold frame bars around the jade
  S.push(gold(hull([V(0.008, NK.y - 0.04, NK.z + 0.16), V(0.046, NK.y - 0.09, NK.z + 0.158), V(0.008, NK.y - 0.04, NK.z + 0.14),
    V(0.046, NK.y - 0.09, NK.z + 0.138), V(0.04, NK.y - 0.09, NK.z + 0.17)])));

  // ================= TAIL: fluffy fox brush shingled with cherry-blossom petals =================
  const tailPts = [V(0, 0.37, -0.25), V(0, 0.43, -0.4), V(0, 0.57, -0.53), V(0, 0.76, -0.6), V(0, 0.93, -0.58), V(0, 1.03, -0.5)];
  const curve = new THREE.CatmullRomCurve3(tailPts, false, 'centripetal');
  const tR = (t) => 0.022 + 0.128 * Math.pow(Math.sin(Math.PI * (0.12 + 0.88 * t)), 1.1);
  C.push(paint(tube(curveSamples(tailPts, 9, (t) => tR(t) * 0.82), { seg: 8, axis: X, capEnd: 0.02 }), SW.core, 'len'));
  // gold tail cuff at the root
  {
    const p = curve.getPoint(0.06), T = curve.getTangent(0.06).normalize();
    const B = new THREE.Vector3().crossVectors(T, X).normalize();
    const pts = [];
    for (const s of [-0.022, 0.022]) for (let k = 0; k < 8; k++) {
      const th = (2 * Math.PI * k) / 8 + Math.PI / 8, r = tR(0.06) * 0.95;
      pts.push(p.clone().addScaledVector(T, s).addScaledVector(X, Math.cos(th) * r).addScaledVector(B, Math.sin(th) * r));
    }
    C.push(gold(hull(pts)));
  }
  // shingle rows: 8 petals around each ring, alternate rows offset, fanned outward and pointing to the tip
  const rows = [0.08, 0.2, 0.32, 0.44, 0.56, 0.68, 0.8];
  rows.forEach((t, j) => {
    const p = curve.getPoint(t), T = curve.getTangent(t).normalize();
    const B = new THREE.Vector3().crossVectors(T, X).normalize();
    if (B.y < 0 && B.z > 0) B.negate();
    const r = tR(t);
    const len = 0.07 + 0.75 * r, wid = len * 0.78;
    const sw = j < 3 ? SW.petalB : j < 5 ? SW.petalA : SW.petalW;
    const fan = 0.6 - 0.4 * t;
    const off = j % 2 ? Math.PI / 8 : 0;
    for (let k = 0; k < 8; k++) {
      const th = off + (k * Math.PI) / 4;
      const sx = Math.sin(th);
      if (sx < -1e-6) continue;
      const R = B.clone().multiplyScalar(Math.cos(th)).addScaledVector(X, sx);
      const g = shingle(p.clone().addScaledVector(R, r * 0.7), T.clone().addScaledVector(R, fan).normalize(), R, len, wid, sw);
      (sx < 1e-6 ? C : S).push(g);
    }
  });
  // pointed white tip
  {
    const p = curve.getPoint(1), T = curve.getTangent(1).normalize();
    C.push(paint(hull([...ring(V(0, 0, 0), 0.06, 0.06, 6, 'y').map((q) => p.clone().addScaledVector(T, -0.1).addScaledVector(X, q.x).addScaledVector(new THREE.Vector3().crossVectors(T, X).normalize(), q.z)),
      p.clone().addScaledVector(T, 0.1)]), SW.petalW, 'y'));
  }
  // 5-petal blossoms sitting on the brush's sides
  for (const [t, rb, R] of [[0.36, 0.095, N(1, 0.1, 0.05)], [0.66, 0.085, N(1, 0.3, 0.25)]]) {
    const p = curve.getPoint(t), T = curve.getTangent(t).normalize();
    blossom(S, p.clone().addScaledVector(R, tR(t) * 1.08 + 0.01), R, T, rb, SW.petalW, 0.1);
  }

  return assemble(C, S);
}

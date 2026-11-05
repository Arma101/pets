// Thunder Tiger: chunky faceted tiger. Stripes are painted into the atlas and mapped by world
// position with a per-facet planar projection (no overlay geometry => no z-fighting).
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// ---------------- colours ----------------
const OR_TOP = [252, 160, 58], OR_BOT = [222, 102, 22];
const BK_TOP = [58, 48, 52], BK_BOT = [30, 25, 28];
const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const lerp3 = (a, b, t) => [0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * Math.min(1, Math.max(0, t)));
const orange = (t) => lerp3(OR_TOP, OR_BOT, t);
const black = (t) => lerp3(BK_TOP, BK_BOT, t);
const clamp01 = (t) => Math.min(1, Math.max(0, t));

// ---------------- body / head layout constants ----------------
const H = { y: 0.7, z: 0.37, hx: 0.21, hy: 0.16, hz: 0.16 }; // head centre & half sizes
const SPINE = 0.585;                                           // top of back

// ---- stripe patterns (all symmetric in x) ----
// flank stripes: [z at spine, y where it ends, half-width at top, slant (dz per unit drop)]
const FLANK = [
  [-0.385, 0.33, 0.026, 0.05],
  [-0.29, 0.22, 0.034, 0.12],
  [-0.185, 0.27, 0.032, 0.2],
  [-0.075, 0.21, 0.034, 0.22],
  [0.035, 0.27, 0.032, 0.26],
  [0.135, 0.34, 0.026, 0.3],
];
// short stripes rising from the belly: [z at belly, y top, half-width]
const BELLY = [[-0.235, 0.35, 0.022], [-0.125, 0.32, 0.02], [-0.02, 0.36, 0.022]];
function bodyStripe(z, y, top = false) {
  for (const [zi, yEnd, w, sl] of FLANK) {
    if (top) { if (Math.abs(z - zi) < w) return true; continue; }
    if (y < yEnd) continue;
    const d = clamp01((SPINE - y) / (SPINE - yEnd));
    const zc = zi + sl * (SPINE - y) + 0.012 * Math.sin(d * 5);
    if (Math.abs(z - zc) < w * Math.pow(1 - d, 0.75) + 0.003) return true;
  }
  if (!top) for (const [zi, yTop, w] of BELLY) {
    if (y > yTop) continue;
    const d = clamp01((y - 0.2) / (yTop - 0.2));
    if (Math.abs(z - zi + 0.15 * (y - 0.2)) < w * (1 - d)) return true;
  }
  return false;
}
// head: lx = x, ly = y - H.y, lz = z - H.z
function headFront(lx, ly) {
  const ax = Math.abs(lx);
  // forehead: centre bar + two diverging bars (tapering downward)
  if (ly > 0.075 && ly < 0.2) {
    const d = (ly - 0.075) / 0.12;
    if (ax < 0.006 + 0.016 * d) return true;
    const c = 0.07 + 0.03 * d;
    if (Math.abs(ax - c) < 0.004 + 0.014 * d && ly > 0.09) return true;
  }
  // cheek wedges coming in from the sides
  for (const [y0, len] of [[0.02, 0.07], [-0.045, 0.085], [-0.105, 0.06]]) {
    const d = clamp01((0.235 - ax) / len); // 0 at edge -> 1 at tip
    if (ax > 0.235 - len && Math.abs(ly - y0 + 0.08 * (0.235 - ax)) < 0.014 * (1 - d) + 0.002) return true;
  }
  return false;
}
function headSide(lz, ly) {
  for (const [y0, z1] of [[0.1, -0.02], [0.035, 0.03], [-0.03, 0.06], [-0.09, 0.0]]) {
    const d = clamp01((lz + 0.22) / (z1 + 0.22));
    if (lz < z1 && Math.abs(ly - y0 - 0.08 * (lz + 0.22)) < 0.02 * (1 - d) + 0.002) return true;
  }
  return false;
}
function headTop(lx, lz) {
  const ax = Math.abs(lx);
  if (lz > -0.17) {
    const d = clamp01((0.2 - lz) / 0.37);
    if (ax < 0.022 * (1 - d) + 0.004) return true;
    const c = 0.1 + 0.02 * d;
    if (Math.abs(ax - c) < 0.018 * (1 - d) + 0.003) return true;
  }
  // transverse bands across the back of the skull
  if (Math.abs(lz + 0.13) < 0.016 * (1 - ax / 0.25)) return true;
  return false;
}
// legs: lu = local horizontal (signed), y = world height
function legStripe(lu, y, bands) {
  const au = Math.abs(lu);
  for (const [y0, w] of bands) {
    if (Math.abs(y - y0 - 0.25 * au) < w * (1 - au / 0.11)) return true;
  }
  return false;
}
const FRONT_BANDS = [[0.33, 0.022], [0.255, 0.02], [0.18, 0.017]];
const BACK_BANDS = [[0.42, 0.024], [0.34, 0.022], [0.255, 0.02], [0.175, 0.016]];

// ---------------- atlas regions (absolute pixel rects, a = horizontal coord, b = vertical coord) ----------------
const REG = {
  bodySide: { x: 0, y: 256, w: 512, h: 256, a: [-0.5, 0.36], b: [0.66, 0.14],
    col: (z, y) => (bodyStripe(z, y) ? black((0.62 - y) / 0.44) : orange((0.62 - y) / 0.44)) },
  bodyTop: { x: 512, y: 256, w: 512, h: 256, a: [-0.5, 0.36], b: [-0.26, 0.26],
    col: (z) => (bodyStripe(z, SPINE, true) ? black(0) : orange(0.02)) },
  headFront: { x: 0, y: 512, w: 256, h: 256, a: [-0.28, 0.28], b: [0.26, -0.24],
    col: (x, ly) => (headFront(x, ly) ? black((0.2 - ly) / 0.42) : orange((0.2 - ly) / 0.42 * 0.8)) },
  headSide: { x: 256, y: 512, w: 256, h: 256, a: [-0.24, 0.24], b: [0.26, -0.24],
    col: (lz, ly) => (headSide(lz, ly) ? black((0.2 - ly) / 0.42) : orange((0.2 - ly) / 0.42 * 0.8)) },
  headTop: { x: 512, y: 512, w: 256, h: 256, a: [-0.28, 0.28], b: [-0.24, 0.24],
    col: (x, lz) => (headTop(x, lz) ? black(0) : orange(0)) },
  legF: { x: 768, y: 512, w: 128, h: 256, a: [-0.13, 0.13], b: [0.62, 0.0],
    col: (u, y) => (legStripe(u, y, FRONT_BANDS) ? black((0.5 - y) / 0.5) : orange((0.5 - y) / 0.5)) },
  legB: { x: 896, y: 512, w: 128, h: 256, a: [-0.16, 0.16], b: [0.62, 0.0],
    col: (u, y) => (legStripe(u, y, BACK_BANDS) ? black((0.5 - y) / 0.5) : orange((0.5 - y) / 0.5)) },
};
function drawRegions(g) {
  for (const r of Object.values(REG)) {
    const img = g.createImageData(r.w, r.h);
    for (let py = 0; py < r.h; py++) for (let px = 0; px < r.w; px++) {
      const acc = [0, 0, 0];
      for (const [ox, oy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
        const a = r.a[0] + ((px + ox) / r.w) * (r.a[1] - r.a[0]);
        const b = r.b[0] + ((py + oy) / r.h) * (r.b[1] - r.b[0]);
        const c = r.col(a, b);
        for (let k = 0; k < 3; k++) acc[k] += c[k] / 4;
      }
      const o = (py * r.w + px) * 4;
      img.data[o] = acc[0]; img.data[o + 1] = acc[1]; img.data[o + 2] = acc[2]; img.data[o + 3] = 255;
    }
    g.putImageData(img, r.x, r.y);
  }
}
const regUV = (r, a, b) => {
  const fa = clamp01((a - r.a[0]) / (r.a[1] - r.a[0])), fb = clamp01((b - r.b[0]) / (r.b[1] - r.b[0]));
  return [(r.x + 3 + fa * (r.w - 6)) / 1024, (r.y + 3 + fb * (r.h - 6)) / 1024];
};

// tail: orange with black bands along its length, black curled tip
function drawTail(g, x, y) {
  for (let py = 0; py < 128; py++) {
    const t = clamp01((py - 16) / 96);
    const band = t > 0.8 || [0.12, 0.27, 0.41, 0.54, 0.67].some((c) => Math.abs(t - c) < 0.038 + 0.012 * t);
    g.fillStyle = hex(band ? black(0.3) : orange(0.15 + 0.3 * t));
    g.fillRect(x, y + py, 128, 1);
  }
}

export const PALETTE = {
  orange: { i: 0, top: hex(OR_TOP), bot: hex(OR_BOT) },
  cream: { i: 1, top: '#FFF3DA', bot: '#E9CB9C' },
  muzzle: { i: 2, top: '#FFF0D4', bot: '#E8C795' },
  nose: { i: 3, top: '#3A3236', bot: '#151113' },
  eye: { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white: { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  mouth: { i: 6, top: '#4A2A22', bot: '#2E1A14' },
  earIn: { i: 7, top: '#F7C3B0', bot: '#E7A08E' },
  black: { i: 8, top: hex(BK_TOP), bot: hex(BK_BOT) },
  brow: { i: 9, top: '#F59A3A', bot: '#C9601A' },
  paw: { i: 10, top: '#FFF0D2', bot: '#DDB57C' },
  tail: { i: 11, draw: drawTail },
  stripes: { i: 16, draw: drawRegions }, // paints every REG rect (rows 2..5 of the atlas)
};
const SW = PALETTE;

// per-facet planar projection: pick(n) -> [region, (p) => [a, b]]
function project(g, pick) {
  const p = g.attributes.position, uv = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    n.subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const [r, f] = pick(n);
    for (const v of [a, b, c]) uv.push(...regUV(r, ...f(v)));
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
const bodyPaint = (g) => project(g, (n) =>
  Math.abs(n.y) > 0.8 && n.y > 0 ? [REG.bodyTop, (v) => [v.z, v.x]] : [REG.bodySide, (v) => [v.z, v.y]]);
const headPaint = (g) => project(g, (n) => {
  const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
  if (n.y > 0 && ay >= ax && ay >= az * 0.8) return [REG.headTop, (v) => [v.x, v.z - H.z]];
  if (az >= ax) return [REG.headFront, (v) => [v.x, v.y - H.y]];
  return [REG.headSide, (v) => [v.z - H.z, v.y - H.y]];
});
const legPaint = (g, reg, cx, cz) => project(g, (n) =>
  Math.abs(n.z) > Math.abs(n.x) ? [reg, (v) => [v.x - cx, v.y]] : [reg, (v) => [v.z - cz, v.y]]);

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const cream = (g, lo, hi) => paint(g, SW.cream, lo === undefined ? 'flat' : 'y', lo === undefined ? null : [lo, hi]);
  const org = (g, lo = 0, hi = 1) => paint(g, SW.orange, 'y', [lo, hi]);

  // ================= TORSO (long, powerful barrel) =================
  C.push(bodyPaint(hull([
    ...ring(V(0, 0.4, -0.46), 0.11, 0.1, 10, 'z'),
    ...ring(V(0, 0.39, -0.4), 0.18, 0.165, 10, 'z'),
    ...ring(V(0, 0.38, -0.22), 0.195, 0.18, 10, 'z'),
    ...ring(V(0, 0.38, -0.02), 0.2, 0.185, 10, 'z'),
    ...ring(V(0, 0.4, 0.16), 0.2, 0.185, 10, 'z'),
    ...ring(V(0, 0.44, 0.27), 0.15, 0.14, 10, 'z'),
  ])));
  // neck into head
  C.push(headPaint(hull([...ring(V(0, 0.46, 0.2), 0.15, 0.14, 10, 'y'), ...ring(V(0, 0.64, 0.3), 0.16, 0.12, 10, 'y')])));

  // ================= LEGS =================
  // front legs (thick, straight) + shoulder mass
  const FL = { x: 0.155, z: 0.2 };
  S.push(legPaint(hull([...ring(V(FL.x, 0.06, FL.z + 0.01), 0.082, 0.08, 8), ...ring(V(FL.x - 0.004, 0.2, FL.z), 0.088, 0.088, 8),
    ...ring(V(FL.x - 0.02, 0.38, FL.z - 0.02), 0.1, 0.115, 8), ...ring(V(FL.x - 0.03, 0.47, FL.z - 0.03), 0.07, 0.09, 8)]), REG.legF, FL.x, FL.z));
  // back legs: big haunch + shin
  const BL = { x: 0.16, z: -0.3 };
  S.push(legPaint(hull([...ring(V(BL.x - 0.015, 0.44, BL.z + 0.02), 0.14, 0.14, 8, 'x'),
    ...ring(V(BL.x + 0.005, 0.44, BL.z + 0.02), 0.12, 0.12, 8, 'x'),
    ...ring(V(BL.x + 0.005, 0.2, BL.z - 0.03), 0.085, 0.09, 8)]),
  REG.legB, BL.x, BL.z));
  S.push(legPaint(hull([...ring(V(BL.x + 0.005, 0.22, BL.z - 0.03), 0.082, 0.088, 8), ...ring(V(BL.x + 0.008, 0.06, BL.z + 0.0), 0.078, 0.076, 8)]),
    REG.legB, BL.x, BL.z));
  // paws: cream block + 4 toes
  const paw = (x, z, s = 1) => {
    S.push(paint(hull(cbox(V(x, 0.045, z), 0.078 * s, 0.045, 0.072 * s, 0.024)), SW.paw, 'y', [0, 0.1]));
    for (const dx of [-0.054, -0.018, 0.018, 0.054])
      S.push(paint(hull(cbox(V(x + dx * s, 0.036, z + 0.068 * s), 0.02 * s, 0.036, 0.03, 0.01)), SW.paw, 'y', [0, 0.1]));
  };
  paw(FL.x, FL.z + 0.02, 1.18);
  paw(BL.x + 0.008, BL.z + 0.02, 1.12);

  // ================= CHEST RUFF (cream shards) =================
  C.push(paint(blob(1, V(0, 0.47, 0.29), V(0.15, 0.15, 0.09), { jitter: 0.18 }), SW.cream, 'y', [0.28, 0.66]));
  C.push(cream(shard(V(0, 0.36, 0.3), V(0, -1, 0.35), 0.06, 0.12)));
  C.push(cream(shard(V(0, 0.46, 0.35), V(0, -0.7, 1), 0.065, 0.085)));
  for (const [b, d, w, l] of [
    [V(0.06, 0.35, 0.3), V(0.25, -1, 0.35), 0.055, 0.11],
    [V(0.115, 0.38, 0.28), V(0.6, -1, 0.3), 0.05, 0.1],
    [V(0.065, 0.46, 0.34), V(0.35, -0.7, 1), 0.055, 0.08],
    [V(0.13, 0.46, 0.3), V(0.8, -0.9, 0.5), 0.055, 0.08],
  ]) S.push(cream(shard(b, d, w, l)));

  // ================= HEAD =================
  C.push(headPaint(hull([
    ...cbox(V(0, H.y - 0.01, H.z), H.hx, H.hy - 0.01, H.hz, 0.07),
    ...ring(V(0, H.y + 0.185, H.z - 0.01), 0.15, 0.12, 10, 'y'),
    ...ring(V(0, H.y + 0.02, H.z - 0.2), 0.15, 0.12, 10, 'z'),
    ...ring(V(0, H.y + 0.06, H.z - 0.16), 0.2, 0.15, 10, 'z'),
    V(0.24, H.y - 0.07, H.z + 0.05), V(-0.24, H.y - 0.07, H.z + 0.05),
    V(0.22, H.y - 0.12, H.z + 0.02), V(-0.22, H.y - 0.12, H.z + 0.02),
  ])));
  const FZ = H.z + H.hz;

  // cheek fluff: cream shards sweeping out & down
  const wedge = (b, d, wv, tv, len) => {
    const dn = d.clone().normalize();
    return hull([b.clone().addScaledVector(dn, len), b.clone().add(wv), b.clone().sub(wv),
      b.clone().add(tv).addScaledVector(dn, -0.02), b.clone().sub(tv).addScaledVector(dn, -0.02)]);
  };
  // puffy cream jowls on the lower sides of the face, with chunky shards fanning out & down
  S.push(paint(hull([
    V(0.1, H.y - 0.09, FZ + 0.01), V(0.19, H.y - 0.075, FZ - 0.035), V(0.245, H.y - 0.1, H.z + 0.05),
    V(0.225, H.y - 0.16, H.z + 0.05), V(0.14, H.y - 0.18, FZ - 0.03), V(0.09, H.y - 0.165, FZ + 0.01),
    V(0.21, H.y - 0.08, H.z - 0.0), V(0.2, H.y - 0.15, H.z - 0.0), V(0.12, H.y - 0.16, H.z + 0.02),
  ]), SW.cream, 'y', [H.y - 0.18, H.y - 0.06]));
  for (const [b, d, w, l] of [
    [V(0.235, H.y - 0.1, H.z + 0.05), V(1, -0.35, 0.05), 0.04, 0.065],
    [V(0.215, H.y - 0.15, H.z + 0.06), V(0.8, -0.8, 0.05), 0.04, 0.07],
    [V(0.16, H.y - 0.175, H.z + 0.09), V(0.4, -1, 0.1), 0.04, 0.065],
    [V(0.21, H.y - 0.12, H.z - 0.0), V(0.9, -0.5, -0.4), 0.036, 0.06],
  ]) S.push(cream(shard(b, d, w, l)));

  // muzzle (broad cream block), chin, nose, mouth
  C.push(paint(hull([...cbox(V(0, H.y - 0.08, FZ + 0.035), 0.115, 0.065, 0.075, 0.03),
    V(0.075, H.y - 0.01, FZ - 0.03), V(-0.075, H.y - 0.01, FZ - 0.03)]), SW.muzzle, 'y', [H.y - 0.15, H.y]));
  C.push(paint(hull(cbox(V(0, H.y - 0.142, FZ + 0.005), 0.085, 0.03, 0.07, 0.015)), SW.cream, 'flat'));
  C.push(paint(hull([...cbox(V(0, H.y - 0.035, FZ + 0.108), 0.05, 0.022, 0.02, 0.01),
    V(0, H.y - 0.075, FZ + 0.1), V(0.02, H.y - 0.065, FZ + 0.1), V(-0.02, H.y - 0.065, FZ + 0.1)]), SW.nose, 'y'));
  C.push(paint(hull(cbox(V(0, H.y - 0.095, FZ + 0.105), 0.006, 0.022, 0.006, 0.002)), SW.mouth, 'flat'));
  S.push(paint(hull([V(0, H.y - 0.117, FZ + 0.11), V(0, H.y - 0.105, FZ + 0.11), V(0.06, H.y - 0.127, FZ + 0.098),
    V(0.06, H.y - 0.117, FZ + 0.098), V(0, H.y - 0.117, FZ + 0.1), V(0.06, H.y - 0.123, FZ + 0.085)]), SW.mouth, 'flat'));

  // fierce eyes
  const E = V(0.092, H.y + 0.03, 0);
  S.push(paint(hull(plate([[-0.044, 0.004], [0.048, 0.034], [0.054, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.048, -0.016]],
    E, FZ - 0.01, FZ + 0.012)), SW.white, 'flat'));
  S.push(paint(hull(plate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]],
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.014, FZ + 0.021)), SW.white, 'flat'));
  // heavy brow
  S.push(paint(hull([
    V(0.03, E.y + 0.012, FZ + 0.03), V(0.032, E.y + 0.05, FZ + 0.02),
    V(0.16, E.y + 0.05, FZ - 0.01), V(0.16, E.y + 0.09, FZ - 0.025),
    V(0.03, E.y + 0.012, FZ - 0.03), V(0.032, E.y + 0.06, FZ - 0.04),
    V(0.16, E.y + 0.05, FZ - 0.06), V(0.16, E.y + 0.092, FZ - 0.07),
  ]), SW.brow, 'y'));

  // round ears with cream-pink inners
  const EA = V(0.155, H.y + 0.18, H.z - 0.05);
  S.push(org(hull([...ring(EA, 0.08, 0.08, 10, 'z', 0), ...ring(V(EA.x + 0.005, EA.y - 0.01, EA.z - 0.05), 0.085, 0.08, 10, 'z', 0)]),
    H.y + 0.1, H.y + 0.26));
  S.push(paint(hull([...ring(V(EA.x, EA.y - 0.008, EA.z + 0.012), 0.052, 0.052, 10, 'z', 0),
    ...ring(V(EA.x, EA.y - 0.008, EA.z - 0.01), 0.052, 0.052, 10, 'z', 0)]), SW.earIn, 'y', [EA.y - 0.05, EA.y + 0.05]));

  // ================= TAIL (long, striped, curling up) =================
  C.push(paint(tube(curveSamples(
    [V(0, 0.46, -0.43), V(0, 0.5, -0.56), V(0, 0.64, -0.66), V(0, 0.82, -0.66), V(0, 0.93, -0.57), V(0, 0.92, -0.47), V(0, 0.85, -0.44)],
    18, (t) => 0.06 + 0.014 * t), { seg: 8, axis: X, capStart: 0, capEnd: 0.035 }), SW.tail, 'len'));

  // crouch: compress the legs a little so the body sits lower (UVs are already set, so stripes stay put)
  for (const g of [...C, ...S]) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      p.setY(i, y - 0.05 * clamp01((y - 0.09) / 0.22));
    }
    g.computeVertexNormals();
  }
  return assemble(C, S);
}

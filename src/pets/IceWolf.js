// Ice Wolf (Epic, Round 4 - Frozen Peaks): pale icy-blue faceted wolf with bold darker-blue
// markings (projected into the atlas per facet, like thunder_tiger), glacier armour plates,
// ice crystal clusters and shard fur with icicle-white tips.
import { V, THREE, hull, cbox, ring, plate, shard, tube, curveSamples, paint, assemble } from '../kit.js';

// ---------------- colours ----------------
const ICE_TOP = [214, 236, 255], ICE_BOT = [124, 176, 236];
const MK_TOP = [72, 124, 210], MK_BOT = [34, 72, 150];
const PALE_TOP = [248, 252, 255], PALE_BOT = [204, 230, 255];
const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const lerp3 = (a, b, t) => [0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * clamp01(t));
const ice = (t) => lerp3(ICE_TOP, ICE_BOT, t);
const mark = (t) => lerp3(MK_TOP, MK_BOT, t);
const pale = (t) => lerp3(PALE_TOP, PALE_BOT, t);
const JAW = [168, 214, 255]; // pale icy blue for the jaw, cheek undersides and throat
const zig = (x) => 2 * Math.abs(2 * (x - Math.floor(x + 0.5))) - 1; // triangle wave in [-1, 1]

// ---------------- layout ----------------
const H = { y: 0.71, z: 0.34, hx: 0.205, hy: 0.165, hz: 0.16 }; // head centre & half sizes
const FZ = H.z + H.hz;                                           // face plane
const SPINE = 0.585;
const HS = 1.1; // head group scale

// ---------------- marking patterns ----------------
// body side, (z, y): jagged saddle + backward-slanting lightning streaks on the flank
// saddle blanket: a clean lower edge with three big soft points hanging down the flank
function saddleEdge(z) {
  let e = 0.47 + 0.035 * zig((z + 0.02) * 4.2);
  if (z > 0.04) e += (z - 0.04) * 1.6;
  if (z < -0.38) e += (-0.38 - z) * 2.0;
  return e;
}
function bodyMark(z, y) {
  if (y > saddleEdge(z)) return true;
  // two bold slashes per flank, slanting back and tapering to a point
  for (const [z0, yEnd, w] of [[-0.03, 0.27, 0.05], [-0.21, 0.3, 0.045]]) {
    const top = saddleEdge(z0) + 0.02;
    if (y > top || y < yEnd) continue;
    const d = clamp01((top - y) / (top - yEnd));
    const zc = z0 - 0.35 * (top - y);
    if (Math.abs(z - zc) < w * (1 - d) + 0.003) return true;
  }
  return false;
}
const bodyCol = (z, y) => {
  if (bodyMark(z, y)) return mark((0.62 - y) / 0.3);
  if (y < 0.29) return lerp3(ice(0.6), pale(0.2), (0.29 - y) / 0.08);
  return ice((0.6 - y) / 0.36);
};
// head front, (x, ly): dark cap with a widow's peak, tear streaks from the eye corners, pale cheeks
function headFrontMark(x, ly) {
  const ax = Math.abs(x);
  if (ly > Math.min(0.105, 0.05 + 0.8 * ax)) return true;
  return false;
}
const headFrontCol = (x, ly) => {
  if (headFrontMark(x, ly)) return mark((0.2 - ly) / 0.3);
  if (ly < -0.1) return JAW;
  return ice((0.18 - ly) / 0.4);
};
const headSideCol = (lz, ly) => {
  if (ly > 0.065 + 0.03 * zig(lz * 10)) return mark((0.2 - ly) / 0.3);
  if (lz > -0.05 && Math.abs(ly - 0.0 - 0.5 * (lz - 0.1)) < 0.016 * clamp01((lz + 0.05) / 0.12)) return mark(0.3);
  if (ly < -0.08) return JAW;
  return ice((0.18 - ly) / 0.4);
};
const headTopCol = () => mark(0);
// legs, (u, y): saddle continues on the hips/shoulders, plus a bold chevron
function legMark(u, y, top, sock) {
  if (y > top) return true;
  if (y > 0.085 && y < sock + 0.025 * (1 - Math.min(1, Math.abs(u) / 0.1))) return true; // sock band with a soft V
  return false;
}
const legCol = (top, chev) => (u, y) => (legMark(u, y, top, chev) ? mark((0.55 - y) / 0.4) : ice(0.15 + (0.5 - y) / 0.5 * 0.5));

const REG = {
  bodySide: { x: 0, y: 256, w: 512, h: 256, a: [-0.5, 0.36], b: [0.66, 0.14], col: bodyCol },
  bodyTop: { x: 512, y: 256, w: 512, h: 256, a: [-0.5, 0.36], b: [-0.26, 0.26],
    col: (z) => (z < 0.1 ? mark(0.05) : ice(0)) },
  headFront: { x: 0, y: 512, w: 256, h: 256, a: [-0.28, 0.28], b: [0.26, -0.24], col: headFrontCol },
  headSide: { x: 256, y: 512, w: 256, h: 256, a: [-0.26, 0.26], b: [0.26, -0.24], col: headSideCol },
  headTop: { x: 512, y: 512, w: 256, h: 256, a: [-0.28, 0.28], b: [-0.26, 0.26], col: headTopCol },
  legF: { x: 768, y: 512, w: 128, h: 256, a: [-0.14, 0.14], b: [0.62, 0.0], col: legCol(0.43, 0.16) },
  legB: { x: 896, y: 512, w: 128, h: 256, a: [-0.17, 0.17], b: [0.62, 0.0], col: legCol(0.47, 0.16) },
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

// tail: ice base -> dark blue band -> frosty white icicle tip
function drawTail(g, x, y) {
  for (let py = 0; py < 128; py++) {
    const t = clamp01((py - 16) / 96);
    let c;
    if (t < 0.3) c = ice(0.2 + t);
    else if (t < 0.72) c = mark(0.1 + (t - 0.3));
    else c = lerp3([200, 236, 255], [250, 254, 255], (t - 0.72) / 0.28);
    g.fillStyle = hex(c);
    g.fillRect(x, y + py, 128, 1);
  }
}

export const PALETTE = {
  ice: { i: 0, top: hex(ICE_TOP), bot: hex(ICE_BOT) },
  pale: { i: 1, top: hex(PALE_TOP), bot: hex(PALE_BOT) },
  mark: { i: 2, top: hex(MK_TOP), bot: hex(MK_BOT) },
  nose: { i: 3, top: '#2E3A5E', bot: '#121A2E' },
  eye: { i: 4, top: '#141823', bot: '#0A0C12' },
  white: { i: 5, top: '#FFFFFF', bot: '#F1F4F8' },
  mouth: { i: 6, top: '#2A3558', bot: '#18203A' },
  earIn: { i: 7, top: '#EAF5FF', bot: '#B6D4F0' },
  furIce: { i: 8, top: '#E4F4FF', bot: '#A8ECFF' },   // base -> icicle tip
  furDark: { i: 9, top: '#DCEFFF', bot: '#9EE6FF' },  // dark blue base -> icicle tip
  furPale: { i: 10, top: '#FFFFFF', bot: '#AEEDFF' }, // white base -> icy cyan tip
  crystal: { i: 11, top: '#F4FEFF', bot: '#55BDEE' },
  armor: { i: 12, top: '#A6E6FF', bot: '#2C86D2' },
  paw: { i: 13, top: '#F8FCFF', bot: '#C6DCF0' },
  tail: { i: 14, draw: drawTail },
  regions: { i: 16, draw: drawRegions }, // paints every REG rect (rows 2..5)
};
const SW = PALETTE;

// ---------------- painters ----------------
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
  n.y > 0.8 ? [REG.bodyTop, (v) => [v.z, v.x]] : [REG.bodySide, (v) => [v.z, v.y]]);
const headPaint = (g) => project(g, (n) => {
  const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
  if (n.y > 0 && ay >= ax && ay >= az * 0.8) return [REG.headTop, (v) => [v.x, v.z - H.z]];
  if (az >= ax && n.z > 0) return [REG.headFront, (v) => [v.x, v.y - H.y]];
  return [REG.headSide, (v) => [v.z - H.z, v.y - H.y]];
});
const legPaint = (g, reg, cx, cz) => project(g, (n) =>
  Math.abs(n.z) > Math.abs(n.x) ? [reg, (v) => [v.x - cx, v.y]] : [reg, (v) => [v.z - cz, v.y]]);
// gradient along an axis (t = 0 at base -> 1 at tip); kit swatch top = base colour, bot = tip colour
function paintAxis(g, sw, base, dir, len) {
  const d = dir.clone().normalize(), p = g.attributes.position, uv = [];
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  for (let i = 0; i < p.count; i++) {
    const t = clamp01(V(p.getX(i), p.getY(i), p.getZ(i)).sub(base).dot(d) / len);
    uv.push((x + 64) / 1024, (y + 16 + t * 96) / 1024);
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
const fur = (sw, b, d, w, len, sides = 4, flat = 1) => paintAxis(shard(b, d, w, len, sides, flat), sw, b, d, len);
// hexagonal ice crystal: prism with a pointed tip, base sunk into the surface
function crystal(base, dir, r, len) {
  const d = dir.clone().normalize();
  const up = Math.abs(d.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
  const a = new THREE.Vector3().crossVectors(d, up).normalize(), b = new THREE.Vector3().crossVectors(a, d).normalize();
  const pts = [base.clone().addScaledVector(d, len)];
  for (const [s, rr] of [[-0.25, 0.85], [0.62, 1]]) {
    for (let k = 0; k < 6; k++) {
      const th = (Math.PI * 2 * k) / 6;
      pts.push(base.clone().addScaledVector(d, s * len).addScaledVector(a, Math.cos(th) * r * rr).addScaledVector(b, Math.sin(th) * r * rr));
    }
  }
  return paintAxis(hull(pts), SW.crystal, base, d, len * 1.0);
}
// beveled armour slab: polygon in the (t, u) plane, raised along n; base sunk below the surface
function slab(c, n, t, poly, thick, sink = 0.03, bevel = 0.75) {
  const nn = n.clone().normalize(), tt = t.clone().addScaledVector(nn, -t.dot(nn)).normalize();
  const uu = new THREE.Vector3().crossVectors(nn, tt);
  const pts = [];
  for (const [pu, pv] of poly) {
    pts.push(c.clone().addScaledVector(tt, pu).addScaledVector(uu, pv).addScaledVector(nn, -sink));
    pts.push(c.clone().addScaledVector(tt, pu).addScaledVector(uu, pv).addScaledVector(nn, thick * 0.55));
    pts.push(c.clone().addScaledVector(tt, pu * bevel).addScaledVector(uu, pv * bevel).addScaledVector(nn, thick));
  }
  return hull(pts);
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const armorY = (g, lo, hi) => paint(g, SW.armor, 'y', [lo, hi]);

  // ================= TORSO =================
  C.push(bodyPaint(hull([
    ...ring(V(0, 0.41, -0.45), 0.11, 0.1, 10, 'z'),
    ...ring(V(0, 0.4, -0.39), 0.175, 0.165, 10, 'z'),
    ...ring(V(0, 0.39, -0.22), 0.19, 0.175, 10, 'z'),
    ...ring(V(0, 0.39, -0.03), 0.195, 0.18, 10, 'z'),
    ...ring(V(0, 0.41, 0.14), 0.2, 0.19, 10, 'z'),
    ...ring(V(0, 0.45, 0.25), 0.15, 0.14, 10, 'z'),
  ])));
  // neck
  C.push(headPaint(hull([...ring(V(0, 0.46, 0.19), 0.15, 0.14, 10, 'y'), ...ring(V(0, 0.64, 0.29), 0.155, 0.12, 10, 'y')])));

  // ================= LEGS =================
  const FL = { x: 0.16, z: 0.18 };
  S.push(legPaint(hull([...ring(V(FL.x, 0.06, FL.z + 0.01), 0.1, 0.098, 8), ...ring(V(FL.x - 0.004, 0.2, FL.z), 0.108, 0.106, 8),
    ...ring(V(FL.x - 0.02, 0.38, FL.z - 0.02), 0.115, 0.125, 8), ...ring(V(FL.x - 0.03, 0.48, FL.z - 0.03), 0.08, 0.1, 8)]), REG.legF, FL.x, FL.z));
  const BL = { x: 0.16, z: -0.29 };
  S.push(legPaint(hull([...ring(V(BL.x - 0.015, 0.45, BL.z + 0.02), 0.145, 0.145, 8, 'x'),
    ...ring(V(BL.x + 0.005, 0.45, BL.z + 0.02), 0.125, 0.125, 8, 'x'),
    ...ring(V(BL.x + 0.005, 0.2, BL.z - 0.03), 0.1, 0.105, 8)]), REG.legB, BL.x, BL.z));
  S.push(legPaint(hull([...ring(V(BL.x + 0.005, 0.22, BL.z - 0.03), 0.104, 0.108, 8), ...ring(V(BL.x + 0.008, 0.06, BL.z - 0.005), 0.098, 0.096, 8)]),
    REG.legB, BL.x, BL.z));
  // frosted paws: block + 4 toes + small ice claws
  const paw = (x, z, s = 1) => {
    S.push(paint(hull(cbox(V(x, 0.043, z), 0.074 * s, 0.043, 0.07 * s, 0.022)), SW.paw, 'y', [0, 0.1]));
    for (const dx of [-0.054, -0.018, 0.018, 0.054]) {
      S.push(paint(hull(cbox(V(x + dx * s, 0.034, z + 0.066 * s), 0.019 * s, 0.034, 0.03, 0.01)), SW.paw, 'y', [0, 0.1]));
      S.push(crystal(V(x + dx * s, 0.022, z + 0.088 * s), V(0, -0.35, 1), 0.011, 0.03));
    }
  };
  paw(FL.x, FL.z + 0.025, 1.38);
  paw(BL.x + 0.008, BL.z + 0.02, 1.32);

  // ================= CHEST RUFF + MANE (shards with icicle tips) =================
  C.push(paint(hull([...ring(V(0, 0.52, 0.31), 0.12, 0.1, 8, 'z'), ...ring(V(0, 0.42, 0.27), 0.1, 0.08, 8, 'z'), V(0, 0.36, 0.3)]),
    SW.pale, 'y', [0.3, 0.62]));
  C.push(fur(SW.furPale, V(0, 0.36, 0.3), V(0, -1, 0.35), 0.06, 0.12));
  C.push(fur(SW.furPale, V(0, 0.46, 0.35), V(0, -0.7, 1), 0.065, 0.09));
  for (const [b, d, w, l] of [
    [V(0.06, 0.35, 0.3), V(0.25, -1, 0.35), 0.055, 0.11],
    [V(0.115, 0.38, 0.28), V(0.6, -1, 0.3), 0.05, 0.1],
    [V(0.065, 0.46, 0.34), V(0.35, -0.7, 1), 0.055, 0.085],
    [V(0.13, 0.47, 0.3), V(0.8, -0.9, 0.5), 0.055, 0.08],
  ]) S.push(fur(SW.furPale, b, d, w, l));
  // mane collar around the neck: dark-based shards sweeping back with frosty tips
  for (const [b, d, w, l] of [
    [V(0.16, 0.57, 0.15), V(1, -0.3, -0.6), 0.06, 0.12],
    [V(0.16, 0.48, 0.17), V(1, -0.8, -0.4), 0.055, 0.1],
    [V(0.12, 0.64, 0.1), V(0.6, -0.2, -1), 0.06, 0.13],
    [V(0.05, 0.67, 0.08), V(0.2, 0.02, -1), 0.055, 0.13],
  ]) S.push(fur(SW.furDark, b, d, w, l));
  C.push(fur(SW.furDark, V(0, 0.66, 0.07), V(0, 0.08, -1), 0.055, 0.14));
  // thin icicle points poking out of the back fur
  S.push(crystal(V(0.09, 0.66, 0.06), V(0.4, -0.05, -1), 0.012, 0.11));
  S.push(crystal(V(0.15, 0.6, 0.1), V(0.8, -0.3, -0.8), 0.012, 0.09));
  C.push(crystal(V(0, 0.69, 0.05), V(0, 0.22, -1), 0.014, 0.12));

  // ================= HEAD =================
  const c0 = C.length, s0 = S.length;
  C.push(headPaint(hull([
    ...cbox(V(0, H.y - 0.005, H.z), H.hx, H.hy - 0.01, H.hz, 0.065),
    ...ring(V(0, H.y + 0.17, H.z - 0.01), 0.13, 0.11, 10, 'y'),
    ...ring(V(0, H.y + 0.03, H.z - 0.19), 0.14, 0.11, 10, 'z'),
    V(0.25, H.y - 0.06, H.z + 0.05), V(-0.25, H.y - 0.06, H.z + 0.05),
    V(0.22, H.y - 0.13, H.z + 0.03), V(-0.22, H.y - 0.13, H.z + 0.03),
  ])));
  // cheek fur: pale shards sweeping out & back, icy tips
  for (const [b, d, w, l] of [
    [V(0.24, H.y - 0.06, H.z + 0.04), V(1, -0.2, -0.4), 0.04, 0.08],
    [V(0.215, H.y - 0.13, H.z + 0.03), V(0.8, -0.7, -0.4), 0.04, 0.08],
    [V(0.14, H.y - 0.15, H.z + 0.06), V(0.4, -1, -0.2), 0.038, 0.07],
  ]) S.push(fur(SW.furPale, b, d, w, l));

  // wolf muzzle: tapered wedge, pale, with jaw, nose, mouth
  const MZ = FZ + 0.13; // muzzle tip z
  C.push(paint(hull([
    ...plate([[-0.1, -0.15], [0.1, -0.15], [0.105, -0.06], [0.07, 0.0], [-0.07, 0.0], [-0.105, -0.06]], V(0, H.y, 0), FZ - 0.05, FZ - 0.04),
    ...plate([[-0.066, -0.13], [0.066, -0.13], [0.07, -0.08], [0.05, -0.05], [-0.05, -0.05], [-0.07, -0.08]], V(0, H.y, 0), MZ - 0.01, MZ),
  ]), SW.pale, 'y', [H.y - 0.15, H.y]));
  // dark bridge stripe down the muzzle top
  C.push(paint(hull([
    ...plate([[-0.035, -0.006], [0.035, -0.006], [0.025, 0.004], [-0.025, 0.004]], V(0, H.y + 0.003, 0), FZ - 0.045, FZ - 0.03),
    ...plate([[-0.03, -0.05], [0.03, -0.05], [0.022, -0.042], [-0.022, -0.042]], V(0, H.y + 0.004, 0), MZ - 0.04, MZ - 0.03),
  ]), SW.mark, 'flat'));
  C.push(paint(hull([
    ...plate([[-0.08, -0.03], [0.08, -0.03], [0.07, 0.0], [-0.07, 0.0]], V(0, H.y - 0.15, 0), FZ - 0.05, FZ - 0.03),
    ...plate([[-0.05, -0.02], [0.05, -0.02], [0.05, 0.0], [-0.05, 0.0]], V(0, H.y - 0.13, 0), MZ - 0.03, MZ - 0.015),
  ]), SW.pale, 'flat'));
  C.push(paint(hull([...cbox(V(0, H.y - 0.06, MZ + 0.008), 0.042, 0.022, 0.022, 0.01),
    V(0, H.y - 0.095, MZ + 0.004), V(0.02, H.y - 0.085, MZ + 0.004), V(-0.02, H.y - 0.085, MZ + 0.004)]), SW.nose, 'y'));
  S.push(paint(hull([V(0, H.y - 0.124, MZ + 0.006), V(0, H.y - 0.114, MZ + 0.006), V(0.06, H.y - 0.134, MZ - 0.012),
    V(0.06, H.y - 0.126, MZ - 0.012), V(0, H.y - 0.124, MZ - 0.004), V(0.06, H.y - 0.13, MZ - 0.024)]), SW.mouth, 'flat'));

  // fierce eyes
  const E = V(0.097, H.y + 0.045, 0);
  S.push(paint(hull(plate([[-0.044, 0.004], [0.048, 0.034], [0.054, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.048, -0.016]],
    E, FZ - 0.01, FZ + 0.012)), SW.white, 'flat'));
  S.push(paint(hull(plate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]],
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.014, FZ + 0.021)), SW.white, 'flat'));
  // heavy brow (dark blue)
  S.push(paint(hull([
    V(0.03, E.y + 0.012, FZ + 0.03), V(0.032, E.y + 0.05, FZ + 0.02),
    V(0.175, E.y + 0.05, FZ - 0.01), V(0.175, E.y + 0.095, FZ - 0.025),
    V(0.03, E.y + 0.012, FZ - 0.03), V(0.032, E.y + 0.06, FZ - 0.04),
    V(0.175, E.y + 0.05, FZ - 0.06), V(0.175, E.y + 0.097, FZ - 0.07),
  ]), SW.mark, 'y'));

  // tall pointy ears: thick triangular plates, pale inner with an icy tip
  const EZ = H.z - 0.02;
  const earTri = [[0.075, H.y + 0.11], [0.205, H.y + 0.11], [0.17, H.y + 0.37]];
  const earFront = (y) => EZ + 0.02 - 0.03 * (y - H.y - 0.11) / 0.26; // front face leans back toward the tip
  S.push(paint(hull([
    ...earTri.slice(0, 2).map(([x, y]) => V(x, y, EZ + 0.02)), ...earTri.slice(0, 2).map(([x, y]) => V(x, y, EZ - 0.06)),
    V(0.17, H.y + 0.37, EZ - 0.01), V(0.17, H.y + 0.37, EZ - 0.03), V(0.14, H.y + 0.12, EZ - 0.08),
  ]), SW.mark, 'y', [H.y + 0.1, H.y + 0.36]));
  const inTri = [[0.103, H.y + 0.145], [0.187, H.y + 0.145], [0.166, H.y + 0.31]];
  S.push(paint(hull([...inTri.map(([x, y]) => V(x, y, earFront(y) + 0.006)), ...inTri.map(([x, y]) => V(x, y, earFront(y) - 0.02))]),
    SW.earIn, 'y', [H.y + 0.13, H.y + 0.3]));
  S.push(fur(SW.furDark, V(0.168, H.y + 0.33, EZ - 0.02), V(0.05, 1, -0.05), 0.02, 0.06));

  // forehead ice plate (armour) + crown crystal
  C.push(armorY(slab(V(0, H.y + 0.15, FZ - 0.04), V(0, 0.75, 0.66), V(0, 0, 1),
    [[-0.05, 0], [0, 0.045], [0.06, 0], [0, -0.045]], 0.03, 0.03, 0.7), H.y + 0.1, H.y + 0.2));
  C.push(crystal(V(0, H.y + 0.17, FZ - 0.07), V(0, 1, 0.25), 0.022, 0.09));

  // enlarge the whole head group about the neck joint
  for (const g of [...C.slice(c0), ...S.slice(s0)]) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      p.setXYZ(i, p.getX(i) * HS, 0.56 + (p.getY(i) - 0.56) * HS, 0.3 + (p.getZ(i) - 0.3) * HS);
    }
    g.computeVertexNormals();
  }

  // ================= ARMOUR PLATES =================
  // shoulder pauldrons (two overlapping beveled slabs) + crystal cluster
  S.push(armorY(slab(V(0.19, 0.47, 0.15), V(0.85, 0.52, 0.06), V(0, 0, 1),
    [[-0.12, 0.0], [-0.07, 0.09], [0.07, 0.09], [0.12, 0.0], [0.07, -0.1], [-0.07, -0.1]], 0.05, 0.05, 0.72), 0.36, 0.6));
  S.push(paint(slab(V(0.188, 0.468, 0.15), V(0.85, 0.52, 0.06), V(0, 0, 1),
    [[-0.135, 0.0], [-0.08, 0.105], [0.08, 0.105], [0.135, 0.0], [0.08, -0.115], [-0.08, -0.115]], 0.03, 0.05, 0.9), SW.mark, 'flat'));
  S.push(crystal(V(0.2, 0.53, 0.17), V(0.45, 1, -0.2), 0.026, 0.12));
  S.push(crystal(V(0.22, 0.51, 0.09), V(0.7, 0.8, -0.6), 0.02, 0.09));
  S.push(crystal(V(0.19, 0.54, 0.23), V(0.5, 0.9, 0.35), 0.017, 0.07));
  // back plates: overlapping arched bands along the spine, each with a ridge crystal
  for (const [zc, len, sc] of [[0.03, 0.15, 1.0], [-0.13, 0.15, 1.0], [-0.29, 0.13, 0.94]]) {
    const pts = [];
    for (let k = -3; k <= 3; k++) {
      const a = (k / 3) * 1.0; // radians from the top
      for (const [z, r] of [[zc + len / 2, 1.0], [zc - len / 2, 0.97]]) {
        pts.push(V(Math.sin(a) * 0.215 * sc * r, 0.39 + Math.cos(a) * 0.21 * sc * r, z));
        pts.push(V(Math.sin(a) * 0.15 * sc, 0.39 + Math.cos(a) * 0.14 * sc, z));
      }
    }
    pts.push(V(0, 0.39 + 0.235 * sc, zc), V(0, 0.39 + 0.225 * sc, zc + len / 2 - 0.01));
    C.push(armorY(hull(pts), 0.45, 0.63));
    C.push(crystal(V(0, 0.39 + 0.215 * sc, zc - 0.01), V(0, 1, -0.5), 0.022, 0.07 + 0.02 * sc));
  }
  // hip crystals
  S.push(crystal(V(0.17, 0.52, -0.26), V(0.6, 1, -0.4), 0.02, 0.08));

  // ================= TAIL (bushy plume, dark band, icicle tip) =================
  C.push(paint(tube(curveSamples(
    [V(0, 0.47, -0.42), V(0, 0.52, -0.55), V(0, 0.62, -0.65), V(0, 0.75, -0.7), V(0, 0.86, -0.68)],
    11, (t) => (0.05 + 0.06 * Math.sin(Math.PI * Math.min(1, 0.25 + t * 0.85))) * (t > 0.85 ? 1 - (t - 0.85) * 3.5 : 1)),
    { seg: 8, axis: X, capEnd: 0.06, twist: (i) => (i % 2) * Math.PI / 8, scale: (i) => (i % 2 ? 1.16 : 0.97) }),
    SW.tail, 'len'));
  // icicle fur tips on the tail
  for (const [b, d, w, l] of [
    [V(0.05, 0.84, -0.69), V(0.4, 0.6, -0.5), 0.03, 0.08],
    [V(0.06, 0.74, -0.74), V(0.5, -0.2, -1), 0.032, 0.08],
    [V(0.06, 0.62, -0.7), V(0.5, -0.6, -1), 0.032, 0.07],
  ]) S.push(fur(SW.furIce, b, d, w, l));
  C.push(fur(SW.furIce, V(0, 0.88, -0.68), V(0, 1, -0.15), 0.035, 0.08));
  C.push(crystal(V(0, 0.9, -0.69), V(0, 1, -0.25), 0.014, 0.11));
  S.push(crystal(V(0.03, 0.87, -0.7), V(0.45, 0.7, -0.5), 0.012, 0.09));
  S.push(crystal(V(0.04, 0.8, -0.74), V(0.4, 0.1, -1), 0.012, 0.08));

  // crouch: compress the legs a little so the body sits lower and sturdier (UVs already set)
  for (const g of [...C, ...S]) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      p.setY(i, y - 0.085 * clamp01((y - 0.09) / 0.24));
    }
    g.computeVertexNormals();
  }
  return assemble(C, S);
}

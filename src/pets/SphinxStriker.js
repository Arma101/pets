// Sphinx Striker (Epic, Round 3 Desert Dojo): golden lion-sphinx with a royal-blue & gold striped
// nemes headdress, thick amber shard mane, gold + lapis armour (collar, shoulder plates, back plates,
// paw bands), bold lapis markings and a tufted tail. Stripes are a painted swatch mapped by world height.
import { V, THREE, hull, cbox, ring, plate, shard, tube, curveSamples, paint, assemble } from '../kit.js';

// flank markings: bold dark-amber flame stripes painted into a body region, projected along x
const BODY_TOP = [242, 176, 72], BODY_BOT = [196, 122, 38], MARK_TOP = [176, 84, 26], MARK_BOT = [130, 58, 18];
const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const lerp3 = (a, b, t) => [0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * clamp01(t));
const MARKS = [[-0.11, 0.27, 0.036], [-0.02, 0.24, 0.04], [0.07, 0.3, 0.034]]; // [z at spine, y end, half width]
function marked(z, y) {
  for (const [zi, yEnd, w] of MARKS) {
    if (y < yEnd) continue;
    const d = clamp01((0.6 - y) / (0.6 - yEnd));
    const zc = zi + 0.07 * (0.6 - y);
    if (Math.abs(z - zc) < w * Math.pow(1 - d, 0.8) + 0.003) return true;
  }
  return false;
}
const BREG = { x: 0, y: 256, w: 512, h: 256, a: [-0.5, 0.35], b: [0.66, 0.16] };
function drawBody(g) {
  const r = BREG, img = g.createImageData(r.w, r.h);
  for (let py = 0; py < r.h; py++) for (let px = 0; px < r.w; px++) {
    const acc = [0, 0, 0];
    for (const [ox, oy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
      const a = r.a[0] + ((px + ox) / r.w) * (r.a[1] - r.a[0]);
      const b = r.b[0] + ((py + oy) / r.h) * (r.b[1] - r.b[0]);
      const t = (0.62 - b) / 0.44;
      const c = marked(a, b) ? lerp3(MARK_TOP, MARK_BOT, t) : lerp3(BODY_TOP, BODY_BOT, t);
      for (let k = 0; k < 3; k++) acc[k] += c[k] / 4;
    }
    const o = (py * r.w + px) * 4;
    img.data[o] = acc[0]; img.data[o + 1] = acc[1]; img.data[o + 2] = acc[2]; img.data[o + 3] = 255;
  }
  g.putImageData(img, r.x, r.y);
}
function bodyPaint(g) {
  const p = g.attributes.position, uv = [], r = BREG;
  for (let i = 0; i < p.count; i++) {
    const fa = clamp01((p.getZ(i) - r.a[0]) / (r.a[1] - r.a[0])), fb = clamp01((p.getY(i) - r.b[0]) / (r.b[1] - r.b[0]));
    uv.push((r.x + 3 + fa * (r.w - 6)) / 1024, (r.y + 3 + fb * (r.h - 6)) / 1024);
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

export const PALETTE = {
  body:   { i: 0, top: hex(BODY_TOP), bot: hex(BODY_BOT) },
  marks:  { i: 16, draw: drawBody },
  mane:   { i: 1, top: '#D9792A', bot: '#9A4716' },
  muzzle: { i: 2, top: '#FFF2D6', bot: '#EBCB97' },
  nose:   { i: 3, top: '#5A3326', bot: '#2E1812' },
  eye:    { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  mouth:  { i: 6, top: '#4A2A22', bot: '#2E1A14' },
  gold:   { i: 7, top: '#FFEC8A', bot: '#EDB516' },
  lapis:  { i: 8, top: '#3F6BEA', bot: '#1A2C8C' },
  brow:   { i: 9, top: '#F2B241', bot: '#C27A1E' },
  sand:   { i: 10, top: '#F4DFAE', bot: '#D2AE72' },
  nBlue:  { i: 11, top: '#3A66EE', bot: '#1F3AA6' },
  nGold:  { i: 13, top: '#FFDA4C', bot: '#E0A010' },
  tail:   { i: 12, top: '#F2B048', bot: '#C47A26' },
};
const SW = PALETTE;

// world-height range the stripe swatch spans (keeps stripes continuous across headdress pieces)
const CROWN = { y: 0.955, z: 0.335 }, BAND = 0.058;

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const body = (pts, lo = 0, hi = 0.95) => paint(hull(pts), SW.body, 'y', [lo, hi]);
  const gold = (g, lo, hi) => paint(g, SW.gold, lo === undefined ? 'flat' : 'y', lo === undefined ? null : [lo, hi]);
  const lapis = (g) => paint(g, SW.lapis, 'y');
  const mane = (g) => paint(g, SW.mane, 'flat');
  // Headdress stripes are cut into the geometry: every triangle is clipped along iso-lines of s and each
  // piece gets a solid blue or gold swatch (soft height gradient) => perfectly crisp band edges.
  // s = drop below the crown top + "square" distance from the crown axis (concentric squares on the flat top,
  // horizontal bands down the sides); rFix fixes that distance for the flares, lappets and queue.
  const sOf = (v, rFix) => CROWN.y - v.y + (rFix !== null ? rFix : Math.max(Math.abs(v.x), Math.abs(v.z - CROWN.z) * 0.95));
  const swUV = (sw, y) => {
    const t = clamp01((1.0 - y) / 0.6);
    return [((sw.i % 8) * 128 + 64) / 1024, (Math.floor(sw.i / 8) * 128 + 16 + t * 96) / 1024];
  };
  const stripes = (g, rFix = null) => {
    const p = g.attributes.position, pos = [], uv = [];
    const lerpV = (a, b, t) => ({ v: a.v.clone().lerp(b.v, t), s: a.s + (b.s - a.s) * t });
    const clip = (poly, lim, keepAbove) => {
      const out = [];
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        const ina = keepAbove ? a.s >= lim : a.s <= lim, inb = keepAbove ? b.s >= lim : b.s <= lim;
        if (ina) out.push(a);
        if (ina !== inb) out.push(lerpV(a, b, (lim - a.s) / (b.s - a.s)));
      }
      return out;
    };
    for (let i = 0; i < p.count; i += 3) {
      const tri = [0, 1, 2].map((k) => { const v = new THREE.Vector3().fromBufferAttribute(p, i + k); return { v, s: sOf(v, rFix) }; });
      const lo = Math.min(...tri.map((q) => q.s)), hi = Math.max(...tri.map((q) => q.s));
      for (let k = Math.floor(lo / BAND); k * BAND < hi; k++) {
        const poly = clip(clip(tri, k * BAND, true), (k + 1) * BAND, false);
        if (poly.length < 3) continue;
        const sw = ((k % 2) + 2) % 2 ? SW.nGold : SW.nBlue;
        for (let j = 1; j < poly.length - 1; j++) for (const q of [poly[0], poly[j], poly[j + 1]]) {
          pos.push(q.v.x, q.v.y, q.v.z); uv.push(...swUV(sw, q.v.y));
        }
      }
    }
    const ng = new THREE.BufferGeometry();
    ng.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    ng.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    ng.computeVertexNormals();
    return ng;
  };
  const gem = (c, r, dir = V(0, 0, 1), depth = 0.6) => { // faceted lapis cabochon
    const d = dir.clone().normalize();
    const pts = [];
    const up = Math.abs(d.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
    const a = new THREE.Vector3().crossVectors(d, up).normalize(), b = new THREE.Vector3().crossVectors(a, d).normalize();
    for (let k = 0; k < 6; k++) {
      const th = (Math.PI * 2 * k) / 6 + Math.PI / 6;
      pts.push(c.clone().addScaledVector(a, Math.cos(th) * r).addScaledVector(b, Math.sin(th) * r));
      pts.push(c.clone().addScaledVector(a, Math.cos(th) * r * 0.55).addScaledVector(b, Math.sin(th) * r * 0.55).addScaledVector(d, r * depth));
    }
    pts.push(c.clone().addScaledVector(d, -r * 0.4));
    return lapis(hull(pts));
  };

  // ================= TORSO =================
  C.push(bodyPaint(hull([
    ...ring(V(0, 0.4, -0.37), 0.11, 0.1, 10, 'z'),
    ...ring(V(0, 0.39, -0.31), 0.185, 0.17, 10, 'z'),
    ...ring(V(0, 0.38, -0.15), 0.2, 0.185, 10, 'z'),
    ...ring(V(0, 0.4, 0.02), 0.205, 0.19, 10, 'z'),
    ...ring(V(0, 0.43, 0.17), 0.21, 0.2, 10, 'z'),
    ...ring(V(0, 0.47, 0.29), 0.165, 0.155, 10, 'z'),
  ])));
  // belly (sandstone underside)
  C.push(paint(hull([...ring(V(0, 0.25, -0.2), 0.13, 0.04, 8, 'z'), ...ring(V(0, 0.255, 0.12), 0.14, 0.04, 8, 'z')]), SW.sand, 'flat'));
  // neck
  C.push(body([...ring(V(0, 0.46, 0.2), 0.15, 0.14, 10, 'y'), ...ring(V(0, 0.66, 0.3), 0.15, 0.12, 10, 'y')], 0.3, 0.8));

  // ================= LEGS =================
  const FL = { x: 0.16, z: 0.19 };
  S.push(body([...ring(V(FL.x, 0.06, FL.z + 0.01), 0.09, 0.088, 8), ...ring(V(FL.x - 0.004, 0.2, FL.z), 0.097, 0.097, 8),
    ...ring(V(FL.x - 0.02, 0.38, FL.z - 0.02), 0.11, 0.125, 8), ...ring(V(FL.x - 0.03, 0.48, FL.z - 0.03), 0.07, 0.09, 8)], 0, 0.6));
  const BL = { x: 0.165, z: -0.22 };
  S.push(body([...ring(V(BL.x - 0.015, 0.44, BL.z + 0.02), 0.14, 0.14, 8, 'x'),
    ...ring(V(BL.x + 0.005, 0.44, BL.z + 0.02), 0.12, 0.12, 8, 'x'),
    ...ring(V(BL.x + 0.005, 0.2, BL.z - 0.03), 0.093, 0.098, 8)], 0, 0.62));
  S.push(body([...ring(V(BL.x + 0.005, 0.22, BL.z - 0.03), 0.09, 0.096, 8), ...ring(V(BL.x + 0.008, 0.06, BL.z + 0.0), 0.086, 0.084, 8)], 0, 0.6));
  // paws: sandstone block + 4 toes, gold claws peeking out
  const paw = (x, z, s = 1) => {
    S.push(paint(hull(cbox(V(x, 0.045, z), 0.08 * s, 0.045, 0.074 * s, 0.024)), SW.sand, 'y', [0, 0.1]));
    for (const dx of [-0.054, -0.018, 0.018, 0.054]) {
      S.push(paint(hull(cbox(V(x + dx * s, 0.036, z + 0.07 * s), 0.02 * s, 0.036, 0.03, 0.01)), SW.sand, 'y', [0, 0.1]));
      S.push(gold(hull([V(x + dx * s - 0.011, 0.004, z + 0.07 * s + 0.024), V(x + dx * s + 0.011, 0.004, z + 0.07 * s + 0.024),
        V(x + dx * s - 0.009, 0.03, z + 0.07 * s + 0.024), V(x + dx * s + 0.009, 0.03, z + 0.07 * s + 0.024),
        V(x + dx * s, 0.006, z + 0.07 * s + 0.058), V(x + dx * s, 0.016, z + 0.07 * s + 0.05)])));
    }
  };
  paw(FL.x, FL.z + 0.02, 1.24);
  paw(BL.x + 0.008, BL.z + 0.02, 1.18);
  // gold paw bands with lapis inlay
  const band = (x, z, r, y) => {
    S.push(gold(hull([...ring(V(x, y - 0.03, z), r, r, 8), ...ring(V(x, y + 0.03, z), r * 0.97, r * 0.97, 8)]), y - 0.04, y + 0.04));
    S.push(lapis(hull([...ring(V(x, y - 0.011, z), r + 0.008, r + 0.008, 8), ...ring(V(x, y + 0.011, z), r + 0.008, r + 0.008, 8)])));
  };
  band(FL.x - 0.003, FL.z + 0.004, 0.106, 0.135);
  band(BL.x + 0.007, BL.z - 0.012, 0.104, 0.135);

  // ================= ARMOUR =================
  // shoulder plates (gold pauldrons) with a lapis gem
  S.push(gold(hull([
    ...ring(V(FL.x - 0.01, 0.5, FL.z - 0.02), 0.085, 0.1, 8),
    ...ring(V(FL.x + 0.005, 0.4, FL.z - 0.02), 0.115, 0.13, 8),
    ...ring(V(FL.x + 0.0, 0.34, FL.z - 0.02), 0.108, 0.122, 8),
  ]), 0.3, 0.52));
  S.push(gem(V(FL.x + 0.112, 0.4, FL.z - 0.02), 0.035, V(1, 0.15, 0.1)));
  // hip plates on the haunches
  S.push(gold(hull([
    ...ring(V(BL.x + 0.005, 0.5, BL.z + 0.02), 0.1, 0.11, 8, 'x'),
    ...ring(V(BL.x + 0.03, 0.47, BL.z + 0.02), 0.12, 0.13, 8, 'x'),
  ]), 0.38, 0.6));
  S.push(gem(V(BL.x + 0.04, 0.47, BL.z + 0.02), 0.036, V(1, 0.1, 0)));
  // back plates along the spine (overlapping gold segments with lapis ridge)
  for (const [z, w] of [[-0.29, 0.155], [-0.15, 0.17], [-0.01, 0.17]]) {
    C.push(gold(hull([
      ...ring(V(0, 0.535, z), w, 0.085, 8, 'z', 0), ...ring(V(0, 0.525, z + 0.13), w * 0.95, 0.08, 8, 'z', 0),
    ]).translate(0, 0, 0), 0.45, 0.6));
    C.push(gem(V(0, 0.612, z + 0.065), 0.03, V(0, 1, 0.15)));
  }

  // ================= MANE (thick amber shards) =================
  // mane mass around neck
  C.push(mane(hull([...ring(V(0, 0.52, 0.22), 0.2, 0.16, 10, 'y'), ...ring(V(0, 0.72, 0.24), 0.21, 0.17, 10, 'y')])));
  const maneShards = [
    // sides, fanning out & down under the headdress flares
    [V(0.19, 0.66, 0.25), V(1, -0.2, -0.2), 0.06, 0.1],
    [V(0.2, 0.58, 0.22), V(1, -0.6, -0.3), 0.06, 0.1],
    [V(0.18, 0.5, 0.2), V(0.8, -1, -0.3), 0.055, 0.09],
    [V(0.17, 0.68, 0.16), V(0.8, -0.1, -1), 0.06, 0.11],
    [V(0.15, 0.58, 0.12), V(0.7, -0.5, -1), 0.06, 0.1],
    [V(0.08, 0.72, 0.13), V(0.3, 0.2, -1), 0.06, 0.11],
    [V(0.1, 0.62, 0.1), V(0.4, -0.3, -1), 0.06, 0.1],
    // big outer mane tufts behind the headdress flares
    [V(0.24, 0.62, 0.3), V(1, -0.5, -0.3), 0.07, 0.13],
    [V(0.22, 0.52, 0.26), V(0.8, -1, -0.4), 0.065, 0.12],
    [V(0.23, 0.7, 0.24), V(1, 0.1, -0.6), 0.065, 0.12],
    [V(0.18, 0.78, 0.2), V(0.6, 0.6, -0.8), 0.06, 0.11],
    [V(0.08, 0.84, 0.17), V(0.25, 0.7, -1), 0.06, 0.11],
    [V(0.16, 0.46, 0.27), V(0.5, -1, 0.1), 0.06, 0.1],
    // chest, below the collar
    [V(0.06, 0.4, 0.36), V(0.25, -1, 0.4), 0.05, 0.09],
    [V(0.12, 0.41, 0.33), V(0.6, -1, 0.3), 0.05, 0.09],
    // face-framing ruff: under the chin and along the cheeks, in front of the lappets
    [V(0.065, 0.6, 0.47), V(0.25, -1, 0.55), 0.05, 0.1],
    [V(0.125, 0.61, 0.45), V(0.55, -1, 0.45), 0.05, 0.1],
    [V(0.175, 0.64, 0.46), V(0.9, -0.8, 0.35), 0.045, 0.09],
    [V(0.2, 0.69, 0.47), V(1, -0.35, 0.3), 0.042, 0.085],
    [V(0.05, 0.54, 0.44), V(0.35, -1, 0.6), 0.05, 0.09],
    [V(0.115, 0.55, 0.42), V(0.6, -1, 0.5), 0.045, 0.085],
  ];
  for (const [b, d, w, l] of maneShards) S.push(mane(shard(b, d, w, l)));
  C.push(mane(shard(V(0, 0.39, 0.37), V(0, -1, 0.4), 0.055, 0.1)));
  C.push(mane(shard(V(0, 0.59, 0.48), V(0, -1, 0.55), 0.055, 0.11)));
  C.push(mane(shard(V(0, 0.53, 0.45), V(0, -1, 0.6), 0.05, 0.09)));
  // ruff mass under the chin between the lappets
  C.push(mane(hull([...ring(V(0, 0.61, 0.4), 0.17, 0.1, 10, 'y'), ...ring(V(0, 0.5, 0.37), 0.14, 0.09, 10, 'y')])));
  C.push(mane(shard(V(0, 0.72, 0.12), V(0, 0.1, -1), 0.06, 0.12)));
  C.push(mane(shard(V(0, 0.84, 0.16), V(0, 0.6, -1), 0.065, 0.12)));

  // broad gold collar (usekh) across the chest with lapis bands and centre gem
  const collar = (r0, r1, y0, y1, zc, col) => hull([
    ...[-1, -0.6, -0.2, 0.2, 0.6, 1].map((s) => V(Math.sin(s * 1.1) * r0, y0, zc + Math.cos(s * 1.1) * r0 * 0.8)),
    ...[-1, -0.6, -0.2, 0.2, 0.6, 1].map((s) => V(Math.sin(s * 1.1) * r1, y1, zc + Math.cos(s * 1.1) * r1 * 0.8)),
  ]);
  C.push(gold(collar(0.175, 0.215, 0.56, 0.42, 0.265), 0.4, 0.58));
  C.push(lapis(collar(0.188, 0.2, 0.515, 0.48, 0.268)));
  C.push(gem(V(0, 0.455, 0.437), 0.046, V(0, -0.3, 1)));

  // ================= HEAD =================
  const H = { y: 0.74, z: 0.37, hx: 0.2, hy: 0.155, hz: 0.155 };
  C.push(body([
    ...cbox(V(0, H.y - 0.01, H.z), H.hx, H.hy - 0.01, H.hz, 0.07),
    ...ring(V(0, H.y + 0.17, H.z - 0.01), 0.15, 0.12, 10, 'y'),
    ...ring(V(0, H.y + 0.02, H.z - 0.19), 0.15, 0.12, 10, 'z'),
    V(0.225, H.y - 0.07, H.z + 0.05), V(-0.225, H.y - 0.07, H.z + 0.05),
    V(0.2, H.y - 0.12, H.z + 0.02), V(-0.2, H.y - 0.12, H.z + 0.02),
  ], H.y - 0.15, H.y + 0.18));
  const FZ = H.z + H.hz;

  // muzzle, chin, nose, mouth
  C.push(paint(hull([...cbox(V(0, H.y - 0.08, FZ + 0.035), 0.112, 0.065, 0.075, 0.03),
    V(0.075, H.y - 0.01, FZ - 0.03), V(-0.075, H.y - 0.01, FZ - 0.03)]), SW.muzzle, 'y', [H.y - 0.15, H.y]));
  C.push(paint(hull(cbox(V(0, H.y - 0.142, FZ + 0.005), 0.085, 0.03, 0.07, 0.015)), SW.muzzle, 'flat'));
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
  // lapis kohl marking sweeping back from the outer eye corner
  S.push(lapis(hull(plate([[0.0, -0.03], [0.055, -0.038], [0.068, -0.03], [0.048, -0.019], [0.0, -0.014]],
    V(E.x + 0.03, E.y, 0), FZ - 0.034, FZ - 0.006, 0.5))));
  // heavy brow
  S.push(paint(hull([
    V(0.03, E.y + 0.012, FZ + 0.03), V(0.032, E.y + 0.05, FZ + 0.02),
    V(0.16, E.y + 0.05, FZ - 0.01), V(0.16, E.y + 0.09, FZ - 0.025),
    V(0.03, E.y + 0.012, FZ - 0.03), V(0.032, E.y + 0.06, FZ - 0.04),
    V(0.16, E.y + 0.05, FZ - 0.06), V(0.16, E.y + 0.092, FZ - 0.07),
  ]), SW.brow, 'y'));

  // ================= NEMES HEADDRESS =================
  const HY = H.y + 0.11; // lower edge of the headcloth on the forehead
  // crown cap over the skull
  C.push(stripes(hull([
    // flat top plateau
    V(0.14, CROWN.y, H.z + 0.12), V(-0.14, CROWN.y, H.z + 0.12), V(0.16, CROWN.y, H.z - 0.17), V(-0.16, CROWN.y, H.z - 0.17),
    // crisp front edge over the brow, then straight down to the band
    V(0.17, CROWN.y - 0.03, H.z + 0.175), V(-0.17, CROWN.y - 0.03, H.z + 0.175),
    V(0.205, HY + 0.01, H.z + 0.185), V(-0.205, HY + 0.01, H.z + 0.185),
    // sloped sides
    V(0.225, CROWN.y - 0.045, H.z + 0.1), V(-0.225, CROWN.y - 0.045, H.z + 0.1),
    V(0.23, CROWN.y - 0.045, H.z - 0.16), V(-0.23, CROWN.y - 0.045, H.z - 0.16),
    V(0.24, HY + 0.0, H.z + 0.12), V(-0.24, HY + 0.0, H.z + 0.12),
    V(0.24, HY + 0.0, H.z - 0.18), V(-0.24, HY + 0.0, H.z - 0.18),
    ...ring(V(0, H.y + 0.02, H.z - 0.19), 0.2, 0.15, 10, 'z'),
  ])));
  // gold forehead band
  C.push(gold(hull([
    ...[-1, -0.6, 0, 0.6, 1].map((s) => V(s * 0.212, HY + 0.035, H.z + 0.193 - (Math.abs(s) > 0.8 ? 0.06 : 0))),
    ...[-1, -0.6, 0, 0.6, 1].map((s) => V(s * 0.212, HY - 0.012, H.z + 0.193 - (Math.abs(s) > 0.8 ? 0.06 : 0))),
    V(0.2, HY + 0.01, H.z + 0.05), V(-0.2, HY + 0.01, H.z + 0.05),
  ]), HY - 0.02, HY + 0.04));
  const UZ = H.z + 0.2; // front face of the forehead band
  // uraeus: raised gold crest + lapis gem at the brow centre
  C.push(gold(hull([
    V(-0.032, HY - 0.01, UZ + 0.02), V(0.032, HY - 0.01, UZ + 0.02), V(-0.028, HY - 0.01, UZ - 0.03), V(0.028, HY - 0.01, UZ - 0.03),
    V(-0.024, HY + 0.08, UZ - 0.005), V(0.024, HY + 0.08, UZ - 0.005), V(0, HY + 0.115, UZ - 0.025), V(0, HY + 0.07, UZ + 0.02),
  ]), HY, HY + 0.11));
  C.push(gem(V(0, HY + 0.035, UZ + 0.022), 0.024, V(0, 0.15, 1)));

  // side flares: the cloth widens out behind the face
  S.push(stripes(hull([
    V(0.12, H.y + 0.19, H.z - 0.03), V(0.2, HY + 0.02, H.z + 0.11), V(0.2, HY + 0.02, H.z - 0.17),
    V(0.29, H.y - 0.03, H.z + 0.07), V(0.29, H.y - 0.03, H.z - 0.08),
    V(0.25, H.y - 0.13, H.z + 0.08), V(0.25, H.y - 0.13, H.z - 0.06),
    V(0.16, H.y - 0.13, H.z + 0.06), V(0.16, H.y - 0.1, H.z - 0.12), V(0.14, H.y + 0.1, H.z - 0.15),
  ]), 0.235));
  // lappets: striped flaps hanging down in front of the shoulders
  S.push(stripes(hull([
    V(0.17, H.y - 0.11, H.z + 0.07), V(0.255, H.y - 0.11, H.z + 0.05), V(0.17, H.y - 0.11, H.z - 0.04), V(0.255, H.y - 0.11, H.z - 0.04),
    V(0.15, 0.42, H.z + 0.06), V(0.25, 0.42, H.z + 0.04), V(0.15, 0.42, H.z - 0.02), V(0.25, 0.42, H.z - 0.02),
  ]), 0.235));
  // gold end caps on the lappets
  S.push(gold(hull(cbox(V(0.2, 0.415, H.z + 0.015), 0.058, 0.02, 0.046, 0.008)), 0.39, 0.44));
  // back of the headcloth gathered into a queue
  C.push(stripes(hull([
    ...ring(V(0, H.y + 0.1, H.z - 0.2), 0.16, 0.11, 8, 'z'),
    ...ring(V(0, H.y - 0.06, H.z - 0.26), 0.11, 0.07, 8, 'z'),
    ...ring(V(0, 0.56, H.z - 0.28), 0.07, 0.04, 8, 'z'),
  ]), 0.235));
  C.push(gold(hull([...ring(V(0, 0.555, H.z - 0.28), 0.078, 0.048, 8, 'z'), ...ring(V(0, 0.53, H.z - 0.275), 0.07, 0.042, 8, 'z')]), 0.5, 0.58));

  // ================= TAIL (golden, gold band, amber tuft) =================
  const tailPts = [V(0, 0.46, -0.35), V(0, 0.5, -0.48), V(0, 0.62, -0.57), V(0, 0.78, -0.59), V(0, 0.88, -0.53)];
  C.push(paint(tube(curveSamples(tailPts, 12, (t) => 0.05 - 0.014 * t), { seg: 8, axis: X, capStart: 0, capEnd: 0.02 }), SW.tail, 'len'));
  const tip = V(0, 0.88, -0.53);
  C.push(gold(hull([...ring(V(0, 0.84, -0.565), 0.05, 0.05, 8, 'y'), ...ring(V(0, 0.87, -0.545), 0.048, 0.048, 8, 'y')])));
  C.push(mane(shard(tip.clone(), V(0, 1, 0.35), 0.06, 0.13)));
  for (const [d, l] of [[V(0.6, 0.8, 0.2), 0.1], [V(0.5, 0.7, -0.6), 0.1], [V(0.3, 0.4, 0.9), 0.09]])
    S.push(mane(shard(tip.clone().add(V(0.01, 0, 0)), d, 0.05, l)));

  // stockier stance: compress the legs a little (UVs already set)
  for (const g of [...C, ...S]) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setY(i, y - 0.04 * clamp01((y - 0.09) / 0.2)); }
    g.computeVertexNormals();
  }
  return assemble(C, S);
}

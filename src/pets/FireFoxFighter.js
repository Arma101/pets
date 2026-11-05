// Fire Fox Fighter (Legendary, Round 5 - Volcano Crater): stocky faceted fox in obsidian + gold armour,
// glowing lava-crack seams, glowing eyes and a bushy tail that ends in a layered flame.
import { V, THREE, hull, cbox, ring, plate, shard, blob, paint, assemble } from '../kit.js';

// ---------- helpers for custom cells ----------
const vgrad = (g, x, y, y0, y1, c0, c1) => {
  const gr = g.createLinearGradient(0, y + y0, 0, y + y1);
  gr.addColorStop(0, c0); gr.addColorStop(1, c1);
  g.fillStyle = gr; g.fillRect(x, y + y0, 128, y1 - y0);
};

// obsidian with lava cracks (projected planar, so the cracks are crisp). Not emissive: the cracks are drawn
// bright yellow/orange so they read as glowing in plain colour.
const CRACKS = [
  [[0, 46], [20, 52], [36, 40], [58, 62], [80, 54], [100, 74], [128, 68]],
  [[36, 40], [44, 18], [60, 0]],
  [[58, 62], [52, 88], [70, 106], [62, 128]],
  [[80, 54], [98, 32], [120, 26]],
  [[100, 74], [110, 98], [128, 108]],
  [[0, 96], [22, 92], [30, 112], [26, 128]],
];
function drawObsLava(g, x, y) {
  vgrad(g, x, y, 0, 128, '#4A4060', '#17131F');
  g.save();
  g.beginPath(); g.rect(x, y, 128, 128); g.clip();
  g.lineJoin = 'miter'; g.lineCap = 'square';
  for (const [w, col] of [[8, '#FF6A00'], [4.5, '#FFB238'], [2, '#FFF0A0']]) {
    g.strokeStyle = col; g.lineWidth = w;
    for (const l of CRACKS) {
      g.beginPath(); l.forEach(([px, py], k) => (k ? g.lineTo(x + px, y + py) : g.moveTo(x + px, y + py))); g.stroke();
    }
  }
  g.restore();
}
// legs: orange upper, dark brown sock below (mapped by world height)
function drawLeg(g, x, y) {
  vgrad(g, x, y, 0, 70, '#F58430', '#D9571C');
  vgrad(g, x, y, 70, 128, '#4A2A20', '#2A1712');
}

export const PALETTE = {
  fur: { i: 0, top: '#F8892E', bot: '#CF5418' },
  pale: { i: 1, top: '#FFF6C2', bot: '#F2D47E' },
  dark: { i: 2, top: '#4A2A20', bot: '#24140F' },
  nose: { i: 3, top: '#3A3438', bot: '#141114' },
  pupil: { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white: { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  eyeW: { i: 6, top: '#FFFFF4', bot: '#FFF4C4', glow: true },
  iris: { i: 7, top: '#FFE45A', bot: '#FF9A10', glow: true },
  brow: { i: 8, top: '#E06A22', bot: '#A9400F' },
  mouth: { i: 9, top: '#4A2A22', bot: '#2E1A14' },
  obsidian: { i: 10, top: '#4A4060', bot: '#15121C' },
  gold: { i: 11, top: '#FFE58A', bot: '#D2921E' },
  lava: { i: 12, top: '#FFE27A', bot: '#FF6A00', glow: true },
  flame: { i: 13, top: '#FF4A10', bot: '#FF9A20', glow: true },
  core: { i: 14, top: '#FFF2A8', bot: '#FFFFF0', glow: true },
  earIn: { i: 15, top: '#5A3224', bot: '#2E1A12' },
  obsLava: { i: 16, draw: drawObsLava },
  flameMid: { i: 17, top: '#FFB020', bot: '#FFE24A', glow: true },
  band: { i: 19, top: '#FFF2B4', bot: '#F6CF6A' },
  leg: { i: 18, draw: drawLeg },
};
const SW = PALETTE;

// planar projection of an obsidian part onto the lava-crack cell (side faces), plain obsidian tops/bottoms
function obsUV(g, cx, cy, cz, span = 0.2, absX = false) {
  const p = g.attributes.position, uv = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  const cell = (s, t) => [((s.i % 8) * 128 + 4 + t[0] * 120) / 1024, (Math.floor(s.i / 8) * 128 + 4 + t[1] * 120) / 1024];
  const cl = (v) => Math.min(1, Math.max(0, v));
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    n.subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    for (const v of [a, b, c]) {
      if (n.y > 0.72) uv.push(...cell(SW.obsidian, [0.5, 0.08]));
      else if (n.y < -0.72) uv.push(...cell(SW.obsidian, [0.5, 0.95]));
      else {
        const h = Math.abs(n.x) > Math.abs(n.z) ? v.z - cz : (absX ? Math.abs(v.x) : v.x) - cx;
        uv.push(...cell(SW.obsLava, [cl(0.5 + h / span), cl(0.5 - (v.y - cy) / span)]));
      }
    }
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const fur = (pts, lo = 0.15, hi = 0.95) => paint(hull(pts), SW.fur, 'y', [lo, hi]);
  const pale = (g, lo, hi) => paint(g, SW.pale, lo === undefined ? 'flat' : 'y', lo === undefined ? null : [lo, hi]);
  const gold = (g, lo, hi) => paint(g, SW.gold, lo === undefined ? 'flat' : 'y', lo === undefined ? null : [lo, hi]);

  // ================= BODY =================
  C.push(fur([
    ...ring(V(0, 0.36, -0.3), 0.09, 0.08, 10, 'z'),
    ...ring(V(0, 0.37, -0.24), 0.155, 0.15, 10, 'z'),
    ...ring(V(0, 0.38, -0.08), 0.175, 0.17, 10, 'z'),
    ...ring(V(0, 0.4, 0.08), 0.18, 0.175, 10, 'z'),
    ...ring(V(0, 0.43, 0.2), 0.16, 0.16, 10, 'z'),
    ...ring(V(0, 0.45, 0.26), 0.1, 0.1, 10, 'z'),
  ], 0.15, 0.6));
  C.push(fur([...ring(V(0, 0.45, 0.15), 0.125, 0.12, 10, 'y'), ...ring(V(0, 0.62, 0.2), 0.13, 0.12, 10, 'y')], 0.3, 0.8));

  // ================= LEGS (orange with dark socks) =================
  const leg = (g) => paint(g, SW.leg, 'y', [0.0, 0.46]);
  const FL = { x: 0.152, z: 0.2 }, BL = { x: 0.16, z: -0.17 };
  S.push(leg(hull([...ring(V(FL.x, 0.06, FL.z + 0.01), 0.07, 0.07, 8), ...ring(V(FL.x - 0.006, 0.2, FL.z), 0.078, 0.08, 8),
    ...ring(V(FL.x - 0.022, 0.33, FL.z - 0.025), 0.092, 0.1, 8), ...ring(V(FL.x - 0.042, 0.43, FL.z - 0.05), 0.07, 0.085, 8)])));
  S.push(leg(hull([...ring(V(BL.x - 0.03, 0.44, BL.z), 0.07, 0.1, 8), ...ring(V(BL.x - 0.005, 0.33, BL.z + 0.01), 0.1, 0.145, 8),
    ...ring(V(BL.x - 0.005, 0.2, BL.z + 0.02), 0.08, 0.1, 8)])));
  S.push(leg(hull([...ring(V(BL.x - 0.002, 0.22, BL.z + 0.01), 0.074, 0.08, 8), ...ring(V(BL.x + 0.002, 0.13, BL.z - 0.03), 0.07, 0.07, 8),
    ...ring(V(BL.x + 0.003, 0.06, BL.z - 0.02), 0.068, 0.068, 8)])));
  // dark paws with chunky toes
  const paw = (x, z, s = 1) => {
    S.push(paint(hull(cbox(V(x, 0.042, z - 0.005), 0.072 * s, 0.042, 0.065 * s, 0.022)), SW.dark, 'y', [0, 0.09]));
    for (const dx of [-0.046, 0, 0.046])
      S.push(paint(hull(cbox(V(x + dx * s, 0.034, z + 0.06 * s), 0.025 * s, 0.034, 0.032, 0.012)), SW.dark, 'y', [0, 0.09]));
  };
  paw(FL.x, FL.z + 0.01, 1.05);
  paw(BL.x + 0.003, BL.z, 1.02);

  // fighter gauntlets on the front legs: obsidian cuff with lava cracks, gold rims, gold knuckle studs
  {
    const cuff = hull([...ring(V(FL.x, 0.1, FL.z + 0.01), 0.088, 0.088, 8), ...ring(V(FL.x - 0.003, 0.215, FL.z + 0.002), 0.094, 0.096, 8)]);
    S.push(obsUV(cuff, FL.x, 0.16, FL.z, 0.2));
    for (const yy of [0.098, 0.212])
      S.push(gold(hull([...ring(V(FL.x - 0.0015 * (yy > 0.15), yy - 0.011, FL.z + 0.01), 0.104, 0.104, 8), ...ring(V(FL.x - 0.0015 * (yy > 0.15), yy + 0.011, FL.z + 0.01), 0.104, 0.104, 8)]), yy - 0.01, yy + 0.01));
    // hind greaves: shorter obsidian cuff with lava cracks and a gold rim
    const bx = BL.x + 0.002, bz = BL.z - 0.025;
    S.push(obsUV(hull([...ring(V(bx, 0.095, bz), 0.084, 0.084, 8), ...ring(V(bx, 0.175, bz - 0.01), 0.086, 0.086, 8)]), bx, 0.14, bz, 0.2));
    S.push(gold(hull([...ring(V(bx, 0.165, bz - 0.009), 0.094, 0.094, 8), ...ring(V(bx, 0.185, bz - 0.011), 0.094, 0.094, 8)]), 0.16, 0.19));
    // knuckle wrap across the toes
    S.push(obsUV(hull(cbox(V(FL.x, 0.055, FL.z + 0.085), 0.083, 0.024, 0.03, 0.012)), FL.x, 0.06, FL.z + 0.09, 0.2));
    for (const dx of [-0.048, 0, 0.048])
      S.push(gold(shard(V(FL.x + dx, 0.06, FL.z + 0.113), V(0, 0.1, 1), 0.012, 0.022)));
  }

  // ================= CHEST RUFF (pale yellow shards) =================
  C.push(paint(blob(1, V(0, 0.44, 0.255), V(0.14, 0.15, 0.09), { jitter: 0.18 }), SW.pale, 'y', [0.26, 0.62]));
  C.push(pale(shard(V(0, 0.32, 0.27), V(0, -1, 0.35), 0.055, 0.11)));
  C.push(pale(shard(V(0, 0.4, 0.32), V(0, -0.7, 1), 0.06, 0.085)));
  for (const [b, d, w, l] of [
    [V(0.055, 0.32, 0.27), V(0.25, -1, 0.35), 0.05, 0.1],
    [V(0.105, 0.35, 0.25), V(0.6, -1, 0.3), 0.05, 0.09],
    [V(0.06, 0.41, 0.31), V(0.35, -0.7, 1), 0.055, 0.075],
    [V(0.125, 0.43, 0.27), V(0.9, -0.7, 0.6), 0.05, 0.07],
  ]) S.push(pale(shard(b, d, w, l)));

  // ================= ARMOUR: obsidian collar + pauldrons with gold trim =================
  {
    const colPts = (rx, rz, y0, h, dz = 0) => {
      const pts = [];
      for (let k = 0; k < 12; k++) {
        const an = (2 * Math.PI * k) / 12 + Math.PI / 12, s = Math.sin(an);
        const yy = y0 - 0.05 * Math.max(0, s);
        pts.push(V(Math.cos(an) * rx, yy, 0.18 + dz + s * rz), V(Math.cos(an) * rx * 0.94, yy + h, 0.18 + dz + s * rz * 0.94));
      }
      return pts;
    };
    C.push(obsUV(hull(colPts(0.17, 0.155, 0.52, 0.06)), 0, 0.52, 0.3, 0.24, true));
    C.push(gold(hull(colPts(0.178, 0.163, 0.512, 0.018)), 0.45, 0.53));
    // gold medallion with glowing lava gem at the throat
    const M = V(0, 0.475, 0.345);
    C.push(gold(hull([...ring(V(0, M.y, M.z - 0.01), 0.05, 0.05, 8, 'z', 0), ...ring(V(0, M.y, M.z + 0.012), 0.042, 0.042, 8, 'z', 0)])));
    C.push(paint(hull([...ring(V(0, M.y, M.z + 0.016), 0.026, 0.026, 4, 'z', 0), V(0, M.y, M.z + 0.036)]), SW.lava, 'y', [M.y - 0.03, M.y + 0.03]));

    // pauldrons
    const P = V(0.15, 0.48, 0.14);
    const pd = hull([...ring(V(P.x, P.y, P.z), 0.115, 0.125, 8, 'x'), ...ring(V(P.x + 0.06, P.y + 0.01, P.z), 0.085, 0.095, 8, 'x'),
      V(P.x + 0.08, P.y + 0.03, P.z)]);
    S.push(obsUV(pd, P.z, P.y, P.z, 0.26));
    S.push(gold(hull([...ring(V(P.x + 0.012, P.y - 0.002, P.z), 0.122, 0.132, 8, 'x'), ...ring(V(P.x + 0.03, P.y - 0.002, P.z), 0.118, 0.128, 8, 'x')])));
    // gold stud + obsidian spikes on top
    S.push(gold(shard(V(P.x + 0.075, P.y + 0.012, P.z), V(1, 0.15, 0), 0.03, 0.04)));
    S.push(paint(shard(V(P.x + 0.035, P.y + 0.09, P.z - 0.02), V(0.35, 1, -0.25), 0.03, 0.075), SW.obsidian, 'y'));
    S.push(paint(shard(V(P.x + 0.035, P.y + 0.08, P.z + 0.05), V(0.35, 1, 0.3), 0.026, 0.06), SW.obsidian, 'y'));
  }

  // ================= HEAD =================
  const c0 = C.length, s0 = S.length;
  const H = { y: 0.725, z: 0.215 };
  C.push(fur([
    ...cbox(V(0, H.y, H.z), 0.195, 0.15, 0.16, 0.06),
    ...ring(V(0, H.y + 0.165, H.z - 0.01), 0.12, 0.1, 8, 'y'),
    V(0.235, H.y - 0.07, H.z + 0.03), V(-0.235, H.y - 0.07, H.z + 0.03),
    ...ring(V(0, H.y + 0.03, H.z - 0.19), 0.14, 0.11, 8, 'z'),
  ], 0.5, 0.95));
  const FZ = H.z + 0.16;

  // pale cheek fluff (fox cheeks) with shards sweeping out and down
  S.push(paint(hull([
    V(0.1, H.y - 0.07, FZ + 0.012), V(0.19, H.y - 0.06, FZ - 0.03), V(0.25, H.y - 0.09, H.z + 0.04),
    V(0.23, H.y - 0.15, H.z + 0.04), V(0.14, H.y - 0.165, FZ - 0.03), V(0.09, H.y - 0.15, FZ + 0.01),
    V(0.21, H.y - 0.07, H.z - 0.01), V(0.2, H.y - 0.14, H.z - 0.01), V(0.12, H.y - 0.15, H.z + 0.02),
  ]), SW.pale, 'y', [H.y - 0.17, H.y - 0.05]));
  for (const [b, d, w, l] of [
    [V(0.245, H.y - 0.09, H.z + 0.04), V(1, -0.3, -0.1), 0.04, 0.08],
    [V(0.225, H.y - 0.14, H.z + 0.05), V(0.8, -0.8, -0.1), 0.04, 0.075],
    [V(0.16, H.y - 0.16, H.z + 0.08), V(0.4, -1, 0.05), 0.038, 0.06],
  ]) S.push(pale(shard(b, d, w, l)));
  // nape tufts on the back of the head
  const nape = (b, d, w, l) => paint(shard(b, d, w, l, 4, 0.45), SW.fur, 'y', [0.5, 0.95]);
  C.push(nape(V(0, H.y + 0.11, H.z - 0.17), V(0, -0.35, -1), 0.085, 0.12));
  S.push(nape(V(0.09, H.y + 0.1, H.z - 0.165), V(0.45, -0.35, -1), 0.075, 0.11));
  C.push(nape(V(0, H.y + 0.0, H.z - 0.185), V(0, -0.7, -1), 0.09, 0.12));
  S.push(nape(V(0.1, H.y - 0.01, H.z - 0.175), V(0.5, -0.7, -1), 0.08, 0.11));
  S.push(nape(V(0.17, H.y + 0.04, H.z - 0.13), V(0.8, -0.3, -0.8), 0.06, 0.09));
  // forehead fur tufts
  C.push(paint(shard(V(0, H.y + 0.16, H.z + 0.04), V(0, 1, 0.6), 0.04, 0.065), SW.fur, 'flat'));

  // pointed fox muzzle: pale snout, orange bridge, black nose
  C.push(paint(hull([...cbox(V(0, H.y - 0.085, FZ + 0.0), 0.1, 0.06, 0.04, 0.02),
    ...cbox(V(0, H.y - 0.09, FZ + 0.108), 0.045, 0.035, 0.02, 0.012)]), SW.pale, 'y', [H.y - 0.15, H.y - 0.02]));
  C.push(fur([...cbox(V(0, H.y - 0.015, FZ - 0.01), 0.055, 0.03, 0.04, 0.012),
    ...cbox(V(0, H.y - 0.05, FZ + 0.106), 0.034, 0.018, 0.022, 0.008)], H.y - 0.1, H.y + 0.05));
  C.push(paint(hull([...cbox(V(0, H.y - 0.055, FZ + 0.130), 0.034, 0.02, 0.016, 0.008),
    V(0, H.y - 0.082, FZ + 0.126), V(0.015, H.y - 0.075, FZ + 0.126), V(-0.015, H.y - 0.075, FZ + 0.126)]), SW.nose, 'y'));
  C.push(paint(hull(cbox(V(0, H.y - 0.1, FZ + 0.129), 0.005, 0.016, 0.006, 0.002)), SW.mouth, 'flat'));
  S.push(paint(hull([V(0, H.y - 0.118, FZ + 0.132), V(0, H.y - 0.108, FZ + 0.132), V(0.045, H.y - 0.128, FZ + 0.108),
    V(0.045, H.y - 0.12, FZ + 0.108), V(0, H.y - 0.118, FZ + 0.118), V(0.045, H.y - 0.124, FZ + 0.096)]), SW.mouth, 'flat'));

  // glowing fierce eyes: big white almond, thin glowing amber ring, big black pupil, catchlight
  const E = V(0.09, H.y + 0.04, 0);
  const eyeShape = [[-0.042, 0.004], [0.048, 0.034], [0.054, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]];
  const pup = [[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]];
  const sc = (pts, s, ox = -0.005, oy = -0.006) => pts.map(([u, v]) => [ox + (u - ox) * s, oy + (v - oy) * s]);
  S.push(paint(hull(plate(sc(eyeShape, 1.25, 0, 0), E, FZ - 0.01, FZ + 0.012)), SW.eyeW, 'flat'));
  S.push(paint(hull(plate(sc(pup, 1.13), V(E.x - 0.004, E.y, 0), FZ + 0.004, FZ + 0.017)), SW.iris, 'y', [E.y - 0.04, E.y + 0.03]));
  S.push(paint(hull(plate(sc(pup, 0.98), V(E.x - 0.004, E.y, 0), FZ + 0.01, FZ + 0.022)), SW.pupil, 'flat'));
  S.push(paint(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.004, E.y + 0.0, 0), FZ + 0.018, FZ + 0.027)), SW.white, 'flat'));
  // heavy brow ridge, protruding well past the eye
  S.push(paint(hull([
    V(0.026, E.y + 0.006, FZ + 0.048), V(0.028, E.y + 0.056, FZ + 0.036),
    V(0.165, E.y + 0.046, FZ + 0.004), V(0.165, E.y + 0.098, FZ - 0.014),
    V(0.026, E.y + 0.006, FZ - 0.03), V(0.028, E.y + 0.066, FZ - 0.04),
    V(0.165, E.y + 0.046, FZ - 0.06), V(0.165, E.y + 0.1, FZ - 0.07),
  ]), SW.brow, 'y'));

  // tall pointy ears: orange outer, dark inner, dark tips, pale inner tuft
  {
    const yb = H.y + 0.1, zf = H.z + 0.02;
    const A = V(0.06, yb, zf), B = V(0.2, yb, zf - 0.01), T = V(0.165, H.y + 0.355, zf - 0.04);
    const back = [V(0.06, yb - 0.01, zf - 0.09), V(0.2, yb - 0.01, zf - 0.1), V(0.13, yb, zf - 0.11)];
    S.push(paint(hull([A, B, T, ...back]), SW.fur, 'y', [yb, T.y]));
    // dark tip: hull over the top 38%
    const lerp = (P, t) => P.clone().lerp(T, t);
    const tt = 0.6, cen = A.clone().add(B).add(back[0]).add(back[1]).multiplyScalar(0.25);
    const grow = (P) => lerp(P, tt).sub(lerp(cen, tt)).multiplyScalar(1.12).add(lerp(cen, tt));
    S.push(paint(hull([grow(A), grow(B), grow(back[0]), grow(back[1]), grow(back[2]),
      T.clone().add(V(0.004, 0.012, 0.002))]), SW.dark, 'y', [yb + 0.12, T.y]));
    // inner ear: shrunk front triangle pushed slightly out of the front face
    const n = new THREE.Vector3().subVectors(B, A).cross(new THREE.Vector3().subVectors(T, A)).normalize();
    if (n.z < 0) n.negate();
    const ctr = A.clone().add(B).add(T).multiplyScalar(1 / 3);
    const sh = (P, s) => P.clone().sub(ctr).multiplyScalar(s).add(ctr);
    const inner = [sh(A, 0.74), sh(B, 0.74), sh(T, 0.74)].map((P) => P.add(V(0, -0.012, 0)));
    S.push(paint(hull([...inner.map((P) => P.clone().addScaledVector(n, 0.007)), ...inner.map((P) => P.clone().addScaledVector(n, -0.02))]),
      SW.earIn, 'y', [yb, T.y]));
    // pale tuft at the base of the inner ear
    S.push(pale(shard(V(0.11, yb + 0.02, zf + 0.0), V(0.15, 1, 0.35), 0.03, 0.08)));
  }

  // enlarge the whole head group a touch (big-head sheet proportions)
  for (const g of [...C.slice(c0), ...S.slice(s0)]) {
    g.translate(0, -(H.y - 0.13), -H.z); g.scale(1.09, 1.09, 1.09); g.translate(0, H.y - 0.13, H.z); g.computeVertexNormals();
  }

  // ================= TAIL (bushy fox brush: faceted segments, layered fur shards, pale band, flame plume) =================
  {
    const curve = new THREE.CatmullRomCurve3([V(0, 0.4, -0.27), V(0, 0.47, -0.42), V(0, 0.6, -0.53), V(0, 0.76, -0.56),
      V(0, 0.9, -0.52), V(0, 0.98, -0.47)], false, 'centripetal');
    const TS = [0, 0.17, 0.37, 0.57, 0.74, 0.92];
    const TR = [0.05, 0.095, 0.13, 0.13, 0.125, 0.095];
    const frame = (t) => {
      const T = curve.getTangent(t).normalize(), A = V(1, 0, 0), B = new THREE.Vector3().crossVectors(T, A).normalize();
      return { p: curve.getPoint(t), T, A, B };
    };
    const tring = (t, r, ph, sx = 1) => {
      const { p, A, B } = frame(t), pts = [];
      for (let k = 0; k < 8; k++) {
        const an = ph + (k * Math.PI) / 4;
        pts.push(p.clone().addScaledVector(A, Math.cos(an) * r * sx).addScaledVector(B, Math.sin(an) * r * 0.92));
      }
      return pts;
    };
    for (let k = 0; k < 5; k++) {
      const ph = (k % 2) * Math.PI / 8;
      const g = hull([...tring(TS[k], TR[k] * (k ? 0.95 : 1), ph), ...tring((TS[k] + TS[k + 1]) / 2, (TR[k] + TR[k + 1]) / 2 * 1.08, ph + Math.PI / 8),
        ...tring(Math.min(1, TS[k + 1] + 0.02), TR[k + 1], ph)]);
      C.push(k < 4 ? paint(g, SW.fur, 'y', [0.35, 1.0]) : paint(g, SW.band, 'y', [0.82, 1.0]));
    }
    // layered fur shards fanning outward and sweeping toward the tip
    const furSh = (t, r, w, len, sw, ph) => {
      const { p, T, A, B } = frame(t);
      for (const an of [ph, ph + Math.PI / 2.6, ph - Math.PI / 2.6, Math.PI / 2, -Math.PI / 2]) {
        const rad = A.clone().multiplyScalar(Math.cos(an)).addScaledVector(B, Math.sin(an)).normalize();
        const base = p.clone().addScaledVector(rad, r * 0.72);
        const g = paint(shard(base, rad.clone().addScaledVector(T, 1.5), w, len, 4, 0.42), sw, 'y', sw === SW.band ? [0.82, 1.0] : [0.35, 1.0]);
        (Math.abs(Math.cos(an)) < 1e-6 ? C : S).push(g);
      }
    };
    furSh(0.24, 0.11, 0.085, 0.11, SW.fur, 0);
    furSh(0.44, 0.13, 0.095, 0.12, SW.fur, Math.PI / 5);
    furSh(0.6, 0.13, 0.085, 0.085, SW.fur, 0);
    furSh(0.79, 0.125, 0.085, 0.1, SW.band, Math.PI / 5);

    // flame plume growing out of the tail tip: red-orange outer tongues, yellow middle, pale-white core
    const { p: F } = frame(0.97);
    const outer = (g) => paint(g, SW.flame, 'y', [F.y - 0.08, F.y + 0.42]);
    const mid = (g) => paint(g, SW.flameMid, 'y', [F.y - 0.05, F.y + 0.36]);
    const core = (g) => paint(g, SW.core, 'y', [F.y - 0.02, F.y + 0.3]);
    // tongues licking down over the pale band (fur -> fire transition)
    for (const [b, d, w, l] of [
      [V(0.07, F.y - 0.06, F.z - 0.01), V(0.6, 0.9, -0.2), 0.045, 0.16],
      [V(0.05, F.y - 0.07, F.z - 0.07), V(0.4, 0.6, -0.9), 0.045, 0.15],
      [V(0.05, F.y - 0.05, F.z + 0.06), V(0.4, 0.9, 0.5), 0.04, 0.13],
    ]) S.push(outer(shard(b, d, w, l, 4, 0.6)));
    C.push(outer(shard(V(0, F.y - 0.07, F.z - 0.08), V(0, 0.5, -1), 0.055, 0.18, 4, 0.6)));
    // main plume
    C.push(outer(shard(V(0, F.y - 0.03, F.z - 0.02), V(0, 1, -0.3), 0.115, 0.44)));
    C.push(outer(shard(V(0, F.y - 0.05, F.z - 0.07), V(0, 0.75, -1), 0.075, 0.26)));
    C.push(outer(shard(V(0, F.y - 0.04, F.z + 0.06), V(0, 1, 0.45), 0.065, 0.22)));
    S.push(outer(shard(V(0.05, F.y - 0.03, F.z - 0.01), V(0.45, 1, -0.2), 0.075, 0.33)));
    S.push(outer(shard(V(0.07, F.y - 0.05, F.z - 0.05), V(0.9, 0.75, -0.5), 0.055, 0.21)));
    S.push(outer(shard(V(0.065, F.y - 0.05, F.z + 0.04), V(0.8, 0.8, 0.45), 0.05, 0.18)));
    // yellow middle layer
    C.push(mid(shard(V(0, F.y + 0.0, F.z + 0.02), V(0, 1, -0.15), 0.085, 0.36)));
    S.push(mid(shard(V(0.04, F.y - 0.01, F.z + 0.02), V(0.4, 1, 0.05), 0.06, 0.25)));
    S.push(mid(shard(V(0.045, F.y - 0.02, F.z - 0.05), V(0.45, 0.9, -0.7), 0.05, 0.2)));
    C.push(mid(shard(V(0, F.y - 0.01, F.z + 0.07), V(0, 0.9, 0.6), 0.05, 0.17)));
    // pale core
    C.push(core(shard(V(0, F.y + 0.03, F.z + 0.05), V(0, 1, 0.1), 0.055, 0.27)));
    S.push(core(shard(V(0.03, F.y + 0.02, F.z + 0.07), V(0.4, 1, 0.4), 0.035, 0.16)));
    C.push(core(blob(0, V(0, F.y + 0.04, F.z + 0.04), V(0.07, 0.08, 0.08))));
  }

  // stance: settle the body a little lower on its short legs (UVs already set)
  for (const g of [...C, ...S]) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      p.setY(i, y - 0.04 * Math.min(1, Math.max(0, (y - 0.23) / 0.12)));
    }
    g.computeVertexNormals();
  }
  return assemble(C, S);
}

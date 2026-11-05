// Nebula Narwhal (Robux egg / Ultimate Egg): chunky faceted purple narwhal with a painted pink nebula + starfield
// (one big custom atlas block, mapped cylindrically from world position so swirls flow across facets), a starlit
// spiral horn, glowing gold armour, a tilted floating golden halo and radiant gold wings (gold coverts over
// overlapping pink/lilac primaries). Propped up on its planted front flippers like a seal, body sloping to planted flukes.
import { V, THREE, hull, ring, plate, shard, tube, curveSamples, assemble } from '../kit.js';

// ---------- swatch painters ----------
function sparkle(g, cx, cy, rx, ry, col) {
  const wx = rx * 0.28, wy = ry * 0.28;
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(cx, cy - ry); g.lineTo(cx + wx, cy - wy); g.lineTo(cx + rx, cy); g.lineTo(cx + wx, cy + wy);
  g.lineTo(cx, cy + ry); g.lineTo(cx - wx, cy + wy); g.lineTo(cx - rx, cy); g.lineTo(cx - wx, cy - wy);
  g.closePath(); g.fill();
}
function rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
// small gradient cell with sparkles (flippers / flukes / horn), kept inside the sampled u-band
function starCell(top, bot, big, small, seed = 7) {
  return (g, x, y) => {
    const gr = g.createLinearGradient(0, y + 14, 0, y + 114);
    gr.addColorStop(0, top); gr.addColorStop(1, bot);
    g.fillStyle = gr; g.fillRect(x, y, 128, 128);
    const rnd = rng(seed);
    for (let k = 0; k < small; k++) {
      g.fillStyle = rnd() < 0.3 ? '#FFE9A0' : '#F4EEFF';
      g.fillRect(x + 36 + rnd() * 56 - 1, y + 18 + rnd() * 92 - 1, 2, 2);
    }
    for (let k = 0; k < big; k++) {
      const r = 4 + rnd() * 3.5;
      sparkle(g, x + 40 + rnd() * 48, y + 22 + rnd() * 84, r, r, rnd() < 0.3 ? '#FFE27A' : '#FFFFFF');
    }
  };
}
// THE NEBULA: one 256x256 block (atlas cells 16,17,24,25). U = along body (tail -> head), V = around the body
// (top centre -> belly). Purple base, soft curving pink/magenta swirls, lavender belly, white/gold 4-point sparkles.
const NB = { x: 0, y: 256, s: 256 };
function drawNebula(g) {
  const { x, y, s } = NB;
  g.save();
  g.beginPath(); g.rect(x, y, s, s); g.clip();
  const base = g.createLinearGradient(0, y, 0, y + s);
  base.addColorStop(0, '#9A58F2'); base.addColorStop(0.45, '#6F33D4'); base.addColorStop(0.66, '#5524AE');
  base.addColorStop(0.76, '#B48BEE'); base.addColorStop(0.84, '#E4CCFF'); base.addColorStop(1, '#D2B2F7');
  g.fillStyle = base; g.fillRect(x, y, s, s);
  // soft swirl glows (radial blobs)
  const blob = (cx, cy, r, col, a) => {
    const rg = g.createRadialGradient(x + cx, y + cy, 0, x + cx, y + cy, r);
    rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(255,120,220,0)');
    g.globalAlpha = a; g.fillStyle = rg; g.fillRect(x, y, s, s); g.globalAlpha = 1;
  };
  blob(70, 70, 75, '#FF7FDD', 0.85); blob(175, 105, 85, '#FF5CCF', 0.8); blob(235, 40, 60, '#FF8FE3', 0.85);
  blob(25, 150, 55, '#E04BCB', 0.7);
  // sweeping swirl arcs: wide soft stroke under a bold core stroke
  g.lineCap = 'round';
  const arc = (pts, w, col, a) => {
    g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = w;
    g.beginPath(); g.moveTo(x + pts[0], y + pts[1]);
    g.bezierCurveTo(x + pts[2], y + pts[3], x + pts[4], y + pts[5], x + pts[6], y + pts[7]); g.stroke();
    g.globalAlpha = 1;
  };
  for (const p of [
    [-10, 30, 40, 0, 90, 60, 70, 170],
    [100, -10, 170, 20, 200, 110, 140, 175],
    [190, 0, 240, 30, 270, 80, 230, 150],
  ]) { arc(p, 56, '#FF7FDD', 0.55); arc(p, 30, '#FF5ACF', 1); arc(p, 10, '#FFD0F4', 0.9); }
  arc([30, 120, 60, 95, 110, 120, 120, 165], 16, '#D94AC4', 0.8);
  // starfield: sparkles (narrower in U because U has ~half the px per world unit of V)
  const rnd = rng(13);
  for (let k = 0; k < 70; k++) {
    g.fillStyle = rnd() < 0.3 ? '#FFE9A0' : '#FFFFFF';
    g.fillRect(x + rnd() * s, y + rnd() * s * 0.74, 1.6, 2.4);
  }
  for (let k = 0; k < 26; k++) {
    const ry = 6 + rnd() * 6;
    sparkle(g, x + 6 + rnd() * (s - 12), y + 8 + rnd() * s * 0.66, ry * 0.55, ry, rnd() < 0.3 ? '#FFE27A' : '#FFFFFF');
  }
  g.restore();
}

export const PALETTE = {
  purple:  { i: 0, draw: starCell('#9C5EF2', '#5226B0', 5, 8, 7) },
  pink:    { i: 1, draw: starCell('#FF9BE4', '#E04CC0', 4, 6, 11) },
  belly:   { i: 2, draw: starCell('#EFD4FF', '#BE98F2', 2, 4, 23) },
  pinkD:   { i: 3, top: '#F57AD8', bot: '#C93AAE' },
  gold:    { i: 4, top: '#FFE36A', bot: '#E89A12', glow: true },
  goldD:   { i: 5, top: '#FFD23D', bot: '#C97A0A' },
  horn:    { i: 6, draw: starCell('#B4F2FF', '#5A8CFF', 4, 10, 5), glow: true },
  face:    { i: 7, top: '#9A5CF0', bot: '#6E36D0' },
  aura:    { i: 8, top: '#FFD0F6', bot: '#FF5FD2', glow: true },
  auraB:   { i: 9, top: '#E6D2FF', bot: '#A066FF', glow: true },
  gem:     { i: 10, top: '#9FF7FF', bot: '#3FD8FF', glow: true },
  eye:     { i: 11, top: '#1A1416', bot: '#0C0A0B' },
  white:   { i: 12, top: '#FFFFFF', bot: '#F1F1F4' },
  brow:    { i: 13, top: '#6E30CC', bot: '#3F168A' },
  mouth:   { i: 14, top: '#3A1240', bot: '#22082A' },
  halo:    { i: 15, top: '#FFE45C', bot: '#FFB000', glow: true },
  nebula:  { i: 16, draw: drawNebula }, // covers cells 16, 17, 24, 25
};
const P = PALETTE;

// ---------- local UV helpers ----------
function swUV(sw, t, u) {
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  return [(x + 22 + THREE.MathUtils.clamp(u, 0, 1) * 84) / 1024, (y + 14 + THREE.MathUtils.clamp(t, 0, 1) * 100) / 1024];
}
function paint(g, sw, mode = 'y', range = null) { return paintPick(g, () => sw, range, mode); }
// per-triangle swatch; per-facet planar UVs so sparkles keep their shape; colour gradient by height
function paintPick(g, pick, range = null, mode = 'y') {
  const p = g.attributes.position;
  g.computeBoundingBox();
  const lo = range ? range[0] : g.boundingBox.min.y, hi = range ? range[1] : g.boundingBox.max.y;
  const uv = [];
  const a = V(0, 0, 0), b = V(0, 0, 0), c = V(0, 0, 0);
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    const cen = a.clone().add(b).add(c).divideScalar(3);
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const sw = pick(cen, n);
    const tA = Math.abs(n.y) > 0.9 ? V(1, 0, 0) : new THREE.Vector3().crossVectors(V(0, 1, 0), n).normalize();
    const tB = new THREE.Vector3().crossVectors(n, tA).normalize();
    if (tB.y < 0 || (Math.abs(tB.y) < 1e-3 && tB.z > 0)) tB.negate();
    const sx = cen.x < 0 ? -1 : 1;
    const u0 = 0.3 + 0.4 * (((Math.abs(cen.x) * 7.3 + cen.z * 5.1 + cen.y * 3.7) % 1 + 1) % 1);
    const tc = mode === 'flat' ? 0.3 : 1 - (cen.y - lo) / Math.max(1e-6, hi - lo);
    for (const v of [a, b, c]) {
      const d = v.clone().sub(cen);
      const t = mode === 'flat' ? 0.3 : tc - d.dot(tB) / Math.max(0.25, hi - lo);
      uv.push(...swUV(sw, t, u0 + d.dot(tA) * sx * 2.0));
    }
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}
// cylindrical nebula mapping: U from z (tail -> head), V from the angle around the centre line (top -> belly).
// Uses |x| so both mirrored halves share the same paint. Front-facing face facets get the clean face swatch.
const Z0 = -1.08, Z1 = 0.92;
function paintNebula(g, cyOf, faceLo = 0, faceHi = 1) {
  const p = g.attributes.position, uv = [];
  const a = V(0, 0, 0), b = V(0, 0, 0), c = V(0, 0, 0);
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    for (const v of [a, b, c]) {
      if (n.z > 0.85) { uv.push(...swUV(P.face, 1 - (v.y - faceLo) / (faceHi - faceLo), 0.5)); continue; }
      const u = THREE.MathUtils.clamp((v.z - Z0) / (Z1 - Z0), 0, 1);
      const ang = Math.atan2(v.y - cyOf(v.z), Math.abs(v.x) + 1e-4); // +pi/2 top, -pi/2 belly
      const w = THREE.MathUtils.clamp(0.5 - ang / Math.PI, 0, 1);
      uv.push((NB.x + 4 + u * (NB.s - 8)) / 1024, (NB.y + 4 + w * (NB.s - 8)) / 1024);
    }
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
// loft through equal-size rings, with flat fan caps
function loft(rings, { capStart = true, capEnd = true } = {}) {
  const pos = [];
  const cen = rings.map((r) => r.reduce((s, p) => s.add(p), V(0, 0, 0)).divideScalar(r.length));
  const tri = (a, b, c, out) => {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
    if (n.dot(out) < 0) [b, c] = [c, b];
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  };
  const N = rings[0].length;
  for (let i = 0; i < rings.length - 1; i++) {
    const mid = cen[i].clone().add(cen[i + 1]).multiplyScalar(0.5);
    for (let k = 0; k < N; k++) {
      const a = rings[i][k], b = rings[i][(k + 1) % N], c = rings[i + 1][k], d = rings[i + 1][(k + 1) % N];
      const out = a.clone().add(b).add(c).add(d).multiplyScalar(0.25).sub(mid);
      tri(a, b, c, out); tri(b, d, c, out);
    }
  }
  const capAt = (i, j) => { const o = cen[i].clone().sub(cen[j]); for (let k = 0; k < N; k++) tri(rings[i][k], rings[i][(k + 1) % N], cen[i], o); };
  if (capStart) capAt(0, 1);
  if (capEnd) capAt(rings.length - 1, rings.length - 2);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const clampY = (pts, y0) => pts.map((p) => (p.y < y0 ? V(p.x, y0, p.z) : p));
  const oct = (z, cy, rx, ry, y0) => clampY(ring(V(0, cy, z), rx, ry, 8, 'z', 0), y0);

  // ================= BODY: chunky 8-sided loft, chest propped up, sloping down to the tail =================
  // [z, centreY, rx, ry]
  const prof = [
    [0.27, 0.47, 0.23, 0.23],
    [0.1, 0.45, 0.3, 0.31],
    [-0.15, 0.39, 0.3, 0.3],
    [-0.42, 0.28, 0.24, 0.24],
    [-0.65, 0.18, 0.155, 0.15],
    [-0.84, 0.11, 0.088, 0.08],
    [-0.96, 0.075, 0.055, 0.045],
  ];
  const lerpProf = (z, j) => {
    if (z >= prof[0][0]) return prof[0][j];
    for (let k = 0; k < prof.length - 1; k++) {
      const A = prof[k], B = prof[k + 1];
      if (z <= A[0] && z >= B[0]) return A[j] + (B[j] - A[j]) * (A[0] - z) / (A[0] - B[0]);
    }
    return prof[prof.length - 1][j];
  };
  const topY = (z) => lerpProf(z, 1) + lerpProf(z, 3);
  const bodyCy = (z) => lerpProf(z, 1);
  C.push(paintNebula(loft(prof.map(([z, cy, rx, ry]) => oct(z, cy, rx, ry, 0.03))), bodyCy));

  // ================= HEAD: big blunt faceted melon, raised (chin off the ground) =================
  const H = { y: 0.6, z: 0.46 };
  const FZ = 0.82; // front face plane
  C.push(paintNebula(loft([
    [0.22, H.y - 0.02, 0.27, 0.29], [0.44, H.y, 0.33, 0.345], [0.66, H.y, 0.31, 0.325], [FZ, H.y - 0.01, 0.25, 0.25],
  ].map(([z, cy, rx, ry]) => oct(z, cy, rx, ry, 0.03))), () => H.y, H.y - 0.26, H.y + 0.25));
  // straight stern mouth line
  C.push(paint(hull([...ring(V(0, H.y - 0.15, FZ + 0.004), 0.085, 0.009, 4, 'z', 0), ...ring(V(0, H.y - 0.15, FZ - 0.006), 0.085, 0.009, 4, 'z', 0)]), P.mouth, 'flat'));

  // fierce eyes
  const E = V(0.12, H.y + 0.04, 0), es = 1.45;
  const sc = (arr) => arr.map(([u, v]) => [u * es, v * es]);
  S.push(paint(hull(plate(sc([[-0.046, 0.004], [0.05, 0.036], [0.056, -0.01], [0.022, -0.044], [-0.032, -0.04], [-0.05, -0.018]]),
    E, FZ - 0.012, FZ + 0.012)), P.white, 'flat'));
  S.push(paint(hull(plate(sc([[-0.032, 0.004], [0.018, 0.022], [0.026, -0.008], [0.006, -0.035], [-0.024, -0.033], [-0.036, -0.013]]),
    V(E.x - 0.008, E.y, 0), FZ + 0.006, FZ + 0.018)), P.eye, 'flat'));
  S.push(paint(hull(plate([[-0.012, -0.012], [0.012, -0.012], [0.012, 0.012], [-0.012, 0.012]],
    V(E.x + 0.006, E.y + 0.006, 0), FZ + 0.014, FZ + 0.023)), P.white, 'flat'));
  // heavy protruding brow block slanting down to the centre
  S.push(paint(hull([
    V(0.028, E.y + 0.02, FZ + 0.05), V(0.03, E.y + 0.085, FZ + 0.04),
    V(0.205, E.y + 0.08, FZ + 0.0), V(0.205, E.y + 0.15, FZ - 0.02),
    V(0.028, E.y + 0.02, FZ - 0.04), V(0.03, E.y + 0.095, FZ - 0.05),
    V(0.205, E.y + 0.075, FZ - 0.1), V(0.205, E.y + 0.15, FZ - 0.11),
  ]), P.brow, 'y'));

  // ================= GOLD HELM + STARLIT HORN =================
  C.push(paint(hull([
    ...ring(V(0, H.y + 0.19, FZ - 0.005), 0.07, 0.05, 6, 'z', Math.PI / 2),
    V(0, H.y + 0.31, FZ - 0.09), V(0.09, H.y + 0.26, FZ - 0.08), V(-0.09, H.y + 0.26, FZ - 0.08),
    V(0, H.y + 0.15, FZ + 0.035),
  ]), P.gold, 'y'));
  C.push(paint(hull(plate([[0, 0.03], [0.023, 0], [0, -0.03], [-0.023, 0]], V(0, H.y + 0.155, 0), FZ + 0.02, FZ + 0.05)), P.gem, 'flat'));
  const hb = V(0, H.y + 0.22, FZ - 0.02), hd = V(0, 0.62, 1).normalize(), HL = 0.64;
  const hornPts = [0, 0.33, 0.66, 1].map((t) => hb.clone().addScaledVector(hd, t * HL));
  C.push(paint(tube(curveSamples(hornPts, 9, (t) => 0.062 * (1 - t) + 0.006),
    { seg: 6, axis: X, capEnd: 0.03, twist: (i) => i * Math.PI / 6, scale: (i) => (i % 2 ? 1.18 : 0.92) }), P.horn, 'y'));
  for (const t of [0.1, 0.38]) {
    const c = hb.clone().addScaledVector(hd, t * HL), r = 0.062 * (1 - t) + 0.018;
    C.push(paint(tube([{ p: c.clone().addScaledVector(hd, -0.014), rx: r, ry: r }, { p: c.clone().addScaledVector(hd, 0.014), rx: r, ry: r }],
      { seg: 6, axis: X, phase: Math.PI / 6 }), P.gold, 'flat'));
  }

  // ================= HALO: chunky square-section ring, tilted ~20deg toward the viewer =================
  {
    const hc = V(0, H.y + 0.47, 0.4), R = 0.18, N = 12, h = 0.018, tilt = 20 * Math.PI / 180;
    const ct = Math.cos(tilt), st = Math.sin(tilt);
    const ptAt = (a, dr, dy) => {
      const lx = Math.sin(a) * (R + dr), lz = Math.cos(a) * (R + dr);
      return V(lx, hc.y + dy * ct - lz * st, hc.z + lz * ct + dy * st);
    };
    for (let k = 0; k < N; k++) {
      const pts = [];
      for (const a of [(2 * Math.PI * k) / N, (2 * Math.PI * (k + 1)) / N])
        for (const dr of [-h, h]) for (const dy of [-h, h]) pts.push(ptAt(a, dr, dy));
      C.push(paint(hull(pts), P.halo, 'y', [hc.y - 0.08, hc.y + 0.06]));
    }
  }

  // ================= GOLD ARMOUR ON THE BODY =================
  // chest band in the neck behind the head
  C.push(paint(hull([...oct(0.24, 0.465, 0.255, 0.255, 0.035), ...oct(0.15, 0.46, 0.285, 0.29, 0.035)]), P.gold, 'y', [0.15, 0.76]));
  // back saddle plate
  C.push(paint(hull([
    ...ring(V(0, topY(0.02) - 0.05, 0.02), 0.2, 0.09, 8, 'z'),
    ...ring(V(0, topY(-0.15) - 0.04, -0.15), 0.21, 0.09, 8, 'z'),
    ...ring(V(0, topY(-0.33) - 0.04, -0.33), 0.15, 0.08, 8, 'z'),
  ]), P.goldD, 'y', [0.5, 0.8]));
  // dorsal ridge: gold shards on the saddle, pink shards down the tail
  for (const [z, l, sw] of [[0.0, 0.085, P.gold], [-0.12, 0.105, P.gold], [-0.24, 0.095, P.gold], [-0.36, 0.085, P.gold],
    [-0.48, 0.08, P.pinkD], [-0.6, 0.07, P.pinkD], [-0.71, 0.06, P.pinkD]])
    C.push(paint(shard(V(0, topY(z) + (z > -0.4 ? 0.035 : -0.005), z), V(0, 1, -0.5), 0.045, l), sw, 'y'));
  // tail band
  C.push(paint(hull([...oct(-0.74, bodyCy(-0.74), 0.13, 0.125, 0.03), ...oct(-0.79, bodyCy(-0.79), 0.115, 0.11, 0.03)]), P.gold, 'flat'));

  // ================= FRONT FLIPPERS: prop the chest up, planted, with gold cuffs =================
  S.push(paintPick(hull([
    ...ring(V(0.24, 0.27, 0.08), 0.13, 0.075, 6, 'x', 0),
    V(0.36, 0.0, 0.17), V(0.36, 0.08, 0.15), V(0.63, 0.0, 0.1), V(0.62, 0.04, 0.09),
    V(0.62, 0.0, -0.06), V(0.61, 0.035, -0.05), V(0.36, 0.0, -0.12), V(0.36, 0.07, -0.1),
  ]), (c) => (c.y < 0.025 ? P.belly : P.purple), [0, 0.3]));
  S.push(paint(hull([...ring(V(0.31, 0.14, 0.06), 0.14, 0.075, 6, 'x', 0), ...ring(V(0.355, 0.1, 0.06), 0.135, 0.07, 6, 'x', 0)]), P.gold, 'y', [0.03, 0.22]));
  S.push(paint(hull([V(0.62, 0.0, 0.11), V(0.63, 0.045, 0.1), V(0.71, 0.0, 0.06), V(0.63, 0.0, -0.07), V(0.62, 0.035, -0.06), V(0.7, 0.0, -0.03)]), P.gold, 'y'));

  // ================= TAIL STOCK + FLUKES (planted) =================
  C.push(paintNebula(hull([...oct(-0.94, 0.08, 0.06, 0.05, 0.0), ...oct(-1.04, 0.055, 0.045, 0.04, 0.0)]), bodyCy));
  S.push(paintPick(hull([
    V(0.0, 0.0, -0.96), V(0.0, 0.09, -0.98), V(0.0, 0.0, -1.09), V(0.0, 0.06, -1.08),
    V(0.21, 0.0, -1.06), V(0.21, 0.05, -1.05),
    V(0.4, 0.0, -1.2), V(0.39, 0.035, -1.19),
    V(0.18, 0.0, -1.18), V(0.17, 0.035, -1.16),
  ]), (c) => (Math.abs(c.x) > 0.17 ? P.pink : P.purple), [0, 0.1]));
  S.push(paint(hull([V(0.39, 0.0, -1.2), V(0.4, 0.04, -1.2), V(0.47, 0.0, -1.26), V(0.28, 0.0, -1.15), V(0.3, 0.035, -1.15)]), P.gold, 'flat'));

  // ================= RADIANT WINGS: thick gold spar, gold coverts over wide overlapping primaries =================
  const ry0 = topY(-0.1);
  const root = V(0.15, ry0 - 0.06, -0.1), sparTip = V(0.72, ry0 + 0.42, -0.3);
  const sparCtl = [root, V(0.35, ry0 + 0.17, -0.16), V(0.55, ry0 + 0.33, -0.23), sparTip];
  S.push(paint(tube(curveSamples(sparCtl, 6, (t) => 0.08 - 0.035 * t, (t) => 0.06 - 0.025 * t),
    { seg: 6, axis: V(0, 0, 1), capEnd: 0.08 }), P.gold, 'y', [ry0, ry0 + 0.45]));
  const spar = new THREE.CatmullRomCurve3(sparCtl, false, 'centripetal');
  const wn = V(0.55, -0.15, 0.82).normalize();
  const blade = (b0, b1, tip, w, th, off, sw) => {
    const base = b0.clone().lerp(b1, 0.5);
    const d = tip.clone().sub(base).normalize();
    const side = new THREE.Vector3().crossVectors(d, wn).normalize().multiplyScalar(w);
    const T = wn.clone().multiplyScalar(th), O = wn.clone().multiplyScalar(off);
    const mid = base.clone().lerp(tip, 0.42);
    const pts = [];
    for (const q of [b0, b1, mid.clone().add(side), mid.clone().sub(side), tip]) pts.push(q.clone().add(O).add(T), q.clone().add(O).sub(T));
    return paint(hull(pts), sw, 'y');
  };
  // primaries (long, wide, overlapping; staggered depth so neighbours never z-fight)
  const W = (x, dy, z) => V(x, ry0 + dy, z);
  [
    [0.95, W(0.9, 0.34, -0.38), 0.1, P.aura],
    [0.8, W(0.93, 0.15, -0.42), 0.115, P.auraB],
    [0.64, W(0.85, -0.03, -0.44), 0.115, P.aura],
    [0.48, W(0.72, -0.16, -0.42), 0.11, P.auraB],
    [0.32, W(0.55, -0.24, -0.36), 0.095, P.aura],
  ].forEach(([u, tip, w, sw], k) =>
    S.push(blade(spar.getPoint(Math.max(0, u - 0.16)), spar.getPoint(Math.min(1, u + 0.08)), tip, w, 0.011, -0.006 - 0.024 * (k % 2), sw)));
  // coverts (short angular gold shards layered over the primary roots)
  for (const [u, len, w] of [[0.9, 0.19, 0.06], [0.72, 0.19, 0.065], [0.54, 0.18, 0.065], [0.36, 0.16, 0.06], [0.2, 0.12, 0.05]]) {
    const b0 = spar.getPoint(Math.max(0, u - 0.1)), b1 = spar.getPoint(Math.min(1, u + 0.06));
    const base = b0.clone().lerp(b1, 0.5);
    S.push(blade(b0, b1, base.clone().addScaledVector(V(0.35, -1, -0.45).normalize(), len), w, 0.012, 0.024, P.gold));
  }

  return assemble(C, S);
}

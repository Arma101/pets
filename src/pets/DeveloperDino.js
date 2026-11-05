// Developer Dino (ADMIN): blue & white faceted dino with glowing code-pattern back plates, small gold crown,
// floating golden halo, radiant gold wings, glowing gold armour with royal-purple trim.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// custom "code" cell: dark navy-purple panel with bright glyph + code lines
const codeCell = (glyph, col, col2) => (g, x, y) => {
  g.fillStyle = '#16123A'; g.fillRect(x, y, 128, 128);
  // faint code lines
  g.fillStyle = col2;
  const lines = [[10, 14, 40], [58, 14, 50], [10, 26, 22], [38, 26, 70], [16, 104, 46], [68, 104, 36], [10, 116, 30], [46, 116, 60]];
  for (const [lx, ly, lw] of lines) g.fillRect(x + lx, y + ly, lw, 6);
  // pentagon outline matching the fin profile
  g.strokeStyle = col; g.lineWidth = 7; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(x + 64, y + 8); g.lineTo(x + 122, y + 62); g.lineTo(x + 122, y + 124); g.lineTo(x + 6, y + 124);
  g.lineTo(x + 6, y + 62); g.closePath(); g.stroke();
  g.fillStyle = col;
  g.font = 'bold 50px monospace';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(glyph, x + 64, y + 70);
};

export const PALETTE = {
  body:   { i: 0, top: '#4FA8FF', bot: '#1F5FD0' },
  belly:  { i: 1, top: '#FFFFFF', bot: '#E6EEFA' },
  dark:   { i: 2, top: '#1C4BA8', bot: '#123578' },
  claw:   { i: 3, top: '#FFE680', bot: '#F2B21E' },
  eye:    { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  mouth:  { i: 6, top: '#2A1840', bot: '#1A0E2A' },
  brow:   { i: 7, top: '#3B8EF0', bot: '#1C56B8' },
  gold:   { i: 8, top: '#FFD23A', bot: '#D88A0C', glow: true },
  purple: { i: 9, top: '#A54BF0', bot: '#5A1AA8' },
  gem:    { i: 10, top: '#C77DFF', bot: '#8424E0' },
  halo:   { i: 11, top: '#FFD84A', bot: '#F0A010', glow: true },
  radiant:{ i: 12, top: '#FFDF55', bot: '#EE9A0E', glow: true },
  code0:  { i: 16, glow: true, draw: codeCell('</>', '#5CFFF0', '#2D7FA8') },
  code1:  { i: 17, glow: true, draw: codeCell('{ }', '#7CFF6A', '#3A8A55') },
  code2:  { i: 18, glow: true, draw: codeCell('01', '#5CFFF0', '#2D7FA8') },
  code3:  { i: 19, glow: true, draw: codeCell('=>', '#7CFF6A', '#3A8A55') },
};
const SW = PALETTE;
const CODE = [SW.code0, SW.code1, SW.code2, SW.code3];

// planar side-projection of a code cell onto a centre-line fin, readable from both sides
function codeUV(g, sw) {
  const p = g.attributes.position;
  g.computeBoundingBox();
  const bb = g.boundingBox;
  const cx = (sw.i % 8) * 128, cy = Math.floor(sw.i / 8) * 128;
  const uv = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    const nx = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).x;
    for (const q of [a, b, c]) {
      let u = (q.z - bb.min.z) / (bb.max.z - bb.min.z);
      if (nx > 0) u = 1 - u; // +x face: screen-right is -z
      const v = (bb.max.y - q.y) / (bb.max.y - bb.min.y);
      uv.push((cx + 4 + u * 120) / 1024, (cy + 4 + v * 120) / 1024);
    }
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}

// flat fin in the y/z plane: profile [[z,y],...], half-thickness t (last point thinner)
function fin(cx, prof, t, tipT = 0.006) {
  const pts = [];
  prof.forEach(([z, y], k) => {
    const th = k === prof.length - 1 ? tipT : t;
    pts.push(V(cx - th, y, z), V(cx + th, y, z));
  });
  return hull(pts);
}

function claw(x, y0, z, w, h, len, dx = 0) {
  return hull([
    V(x - w, y0, z), V(x + w, y0, z), V(x - w, y0 + h, z), V(x + w, y0 + h, z),
    V(x - w * 0.8, y0, z - 0.03), V(x + w * 0.8, y0, z - 0.03), V(x - w * 0.8, y0 + h, z - 0.03), V(x + w * 0.8, y0 + h, z - 0.03),
    V(x + dx - w * 0.3, y0, z + len), V(x + dx + w * 0.3, y0, z + len), V(x + dx, y0 + h * 0.3, z + len),
  ]);
}

// closed ring of chunky hull segments (halo)
function hoop(c0, R, w, h, n, tiltX = 0) {
  const parts = [];
  const q = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), tiltX);
  const pt = (k, dr, dy) => {
    const a = (2 * Math.PI * k) / n + Math.PI / n;
    return V(Math.cos(a) * (R + dr), dy, Math.sin(a) * (R + dr)).applyQuaternion(q).add(c0);
  };
  for (let k = 0; k < n; k++) {
    const pts = [];
    for (const kk of [k, k + 1]) for (let j = 0; j < 8; j++) {
      const t = (2 * Math.PI * j) / 8 + Math.PI / 8;
      pts.push(pt(kk, Math.cos(t) * w, Math.sin(t) * h));
    }
    parts.push(hull(pts));
  }
  return parts;
}

// flat blade (feather) from base p along dir, in plane with normal n
function blade(p, dir, n, L, W, th = 0.012) {
  const d = dir.clone().normalize(), s = new THREE.Vector3().crossVectors(n, d).normalize();
  const pts = [];
  for (const [u, v] of [[0, -0.5], [0, 0.5], [0.7, 0.5], [1, 0], [0.7, -0.5]])
    for (const o of [-th, th]) pts.push(p.clone().addScaledVector(d, u * L).addScaledVector(s, v * W).addScaledVector(n, o));
  return hull(pts);
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const blue = (pts, lo = 0.1, hi = 1.0) => paint(hull(pts), SW.body, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');
  const gold = (g, lo, hi) => paint(g, SW.gold, lo === undefined ? 'flat' : 'y', lo === undefined ? null : [lo, hi]);

  // ================= TORSO =================
  const torso = [
    [-0.3, 0.47, 0.14, 0.13],
    [-0.18, 0.47, 0.175, 0.165],
    [-0.04, 0.49, 0.2, 0.19],
    [0.09, 0.56, 0.185, 0.175],
    [0.17, 0.66, 0.15, 0.14],
  ];
  const SPINE = [[0.2, 0.9], [0.11, 0.86], [0.02, 0.78], [-0.1, 0.71], [-0.22, 0.655], [-0.32, 0.61]];
  const ySpine = (z) => {
    for (let k = 0; k < SPINE.length - 1; k++) {
      const [z0, y0] = SPINE[k], [z1, y1] = SPINE[k + 1];
      if (z <= z0 && z >= z1) return y0 + (y1 - y0) * (z - z0) / (z1 - z0);
    }
    return SPINE[SPINE.length - 1][1];
  };
  const ridge = (lo, hi) => SPINE.filter(([z]) => z >= lo && z <= hi).flatMap(([z, y]) => [V(0.06, y, z), V(-0.06, y, z), V(0, y + 0.008, z)]);
  C.push(blue([...torso.flatMap(([z, y, a, b]) => ring(V(0, y, z), a, b, 10, 'z')), ...ridge(-0.33, 0.03)]));
  C.push(paint(hull(torso.slice(1).flatMap(([z, y, a, b]) => ring(V(0, y - 0.022, z + 0.03), a * 0.64, b, 10, 'z'))),
    SW.belly, 'y', [0.3, 0.8]));
  // neck
  C.push(blue([...ring(V(0, 0.6, 0.15), 0.14, 0.13, 10, 'y'), ...ring(V(0, 0.82, 0.24), 0.125, 0.115, 10, 'y'),
    ...ridge(0.0, 0.21)], 0.3, 1.0));
  C.push(paint(hull([...ring(V(0, 0.6, 0.19), 0.09, 0.095, 8, 'y'), ...ring(V(0, 0.78, 0.29), 0.088, 0.072, 8, 'y')]),
    SW.belly, 'y', [0.4, 0.85]));
  // gold collar / gorget at the base of the neck with a purple gem
  C.push(gold(hull([...ring(V(0, 0.62, 0.16), 0.165, 0.135, 10, 'y', 0), ...ring(V(0, 0.685, 0.19), 0.15, 0.12, 10, 'y', 0)]), 0.6, 0.7));
  C.push(flat(hull([...cbox(V(0, 0.655, 0.3), 0.032, 0.035, 0.014, 0.012), V(0, 0.655, 0.322)]), SW.gem));

  // ================= LEGS =================
  S.push(paint(blob(1, V(0.185, 0.38, -0.06), V(0.125, 0.18, 0.185), { jitter: 0.1 }), SW.body, 'y', [0.05, 0.6]));
  S.push(blue([...ring(V(0.2, 0.28, 0.01), 0.1, 0.105, 8), ...ring(V(0.205, 0.13, -0.07), 0.09, 0.09, 8)], 0.0, 0.6));
  S.push(blue([...ring(V(0.205, 0.15, -0.065), 0.086, 0.086, 8), ...cbox(V(0.205, 0.05, -0.02), 0.108, 0.05, 0.1, 0.03),
    ...cbox(V(0.205, 0.035, 0.07), 0.102, 0.035, 0.03, 0.015)], 0.0, 0.6));
  for (const dx of [-0.06, 0, 0.06]) S.push(flat(claw(0.2 + dx, 0, 0.09, 0.026, 0.05, 0.075, dx * 0.3), SW.claw));
  S.push(flat(claw(0.2, 0, -0.11, 0.022, 0.035, -0.05), SW.claw));
  // gold thigh plate (outer) with purple trim
  S.push(flat(hull([...plate([[-0.09, 0.08], [0.08, 0.1], [0.1, -0.05], [0.0, -0.12], [-0.1, -0.06]],
    V(0, 0.4, 0), 0, 0)].map((p) => V(0.31, p.y, -0.06 + p.x)).flatMap((p) => [p, V(0.285, p.y, p.z)])), SW.purple));
  S.push(gold(hull([...plate([[-0.075, 0.07], [0.065, 0.085], [0.085, -0.04], [0.0, -0.1], [-0.085, -0.05]],
    V(0, 0.4, 0), 0, 0)].map((p) => V(0.322, p.y, -0.06 + p.x)).flatMap((p) => [p, V(0.29, p.y, p.z)])), 0.3, 0.5));
  // gold shin guard
  S.push(gold(hull([V(0.14, 0.27, 0.105), V(0.26, 0.27, 0.105), V(0.15, 0.13, 0.03), V(0.255, 0.13, 0.03), V(0.2, 0.09, 0.03),
    V(0.14, 0.27, 0.07), V(0.26, 0.27, 0.07), V(0.15, 0.13, 0.0), V(0.255, 0.13, 0.0)]), 0.1, 0.3));

  // ================= ARMS =================
  S.push(blue([...ring(V(0.14, 0.62, 0.17), 0.06, 0.06, 6), ...ring(V(0.18, 0.52, 0.23), 0.052, 0.052, 6)], 0.3, 0.8));
  S.push(blue([...ring(V(0.18, 0.52, 0.23), 0.048, 0.048, 6, 'z'), ...ring(V(0.175, 0.5, 0.32), 0.044, 0.04, 6, 'z')], 0.3, 0.8));
  S.push(gold(hull([...ring(V(0.178, 0.515, 0.25), 0.058, 0.056, 6, 'z'), ...ring(V(0.176, 0.505, 0.3), 0.054, 0.05, 6, 'z')])));
  for (const dx of [-0.024, 0, 0.024])
    S.push(flat(shard(V(0.175 + dx, 0.49, 0.335), V(dx * 1.5, -0.9, 0.55), 0.016, 0.06), SW.claw));
  // shoulder pauldron: purple under-layer + gold shell
  S.push(flat(hull([...ring(V(0.165, 0.63, 0.15), 0.085, 0.09, 6, 'x', 0), ...ring(V(0.215, 0.6, 0.15), 0.08, 0.085, 6, 'x', 0)]), SW.purple));
  S.push(gold(hull([...ring(V(0.15, 0.68, 0.15), 0.075, 0.08, 6, 'x', 0), ...ring(V(0.225, 0.63, 0.15), 0.07, 0.075, 6, 'x', 0),
    V(0.2, 0.71, 0.15)]), 0.6, 0.72));

  // ================= TAIL =================
  const tailRX = (t) => 0.135 * (1 - t) + 0.02, tailRY = (t) => 0.13 * (1 - t) + 0.018;
  const tailPts = [V(0, 0.49, -0.22), V(0, 0.42, -0.45), V(0, 0.31, -0.63), V(0, 0.18, -0.8), V(0, 0.07, -0.93)];
  const tc = new THREE.CatmullRomCurve3(tailPts, false, 'centripetal');
  C.push(paint(tube(curveSamples(tailPts, 9, tailRX, tailRY),
    { seg: 8, axis: X, capEnd: 0.03, phase: Math.PI / 8 }), SW.body, 'len'));
  C.push(paint(tube(curveSamples(tailPts.slice(0, 4).map((p) => p.clone().add(V(0, -0.04, 0))), 6,
    (t) => tailRX(0.75 * t) * 0.6 * (1 - 0.35 * t), (t) => tailRY(0.75 * t) * 0.85 * (1 - 0.35 * t)),
    { seg: 6, axis: X, capEnd: 0.05 }), SW.belly, 'flat'));
  // gold tail band
  {
    const t = 0.62, p = tc.getPoint(t), T = tc.getTangent(t);
    const g = tube([{ p: p.clone().addScaledVector(T, -0.022), rx: tailRX(t) * 1.12, ry: tailRY(t) * 1.12 },
      { p: p.clone().addScaledVector(T, 0.022), rx: tailRX(t) * 1.1, ry: tailRY(t) * 1.1 }], { seg: 8, axis: X, phase: Math.PI / 8 });
    C.push(gold(g));
  }

  // ================= HEAD =================
  const HC = [], HS = [];
  const SK = { y: 0.89, z: 0.27 };
  HC.push(blue([...cbox(V(0, SK.y, SK.z), 0.155, 0.12, 0.13, 0.045)], 0.6, 1.02));
  const FZ = SK.z + 0.13;
  // upper snout
  HC.push(blue([...cbox(V(0, 0.845, 0.47), 0.118, 0.055, 0.125, 0.03), V(0.1, 0.9, 0.38), V(-0.1, 0.9, 0.38)], 0.6, 1.0));
  HC.push(blue(cbox(V(0, 0.898, 0.555), 0.07, 0.018, 0.035, 0.012), 0.6, 1.0));
  for (const x of [-0.035, 0.035]) HC.push(flat(hull(cbox(V(x, 0.912, 0.585), 0.01, 0.004, 0.008, 0.002)), SW.dark));
  // white muzzle / lower jaw (closed mouth)
  HC.push(paint(hull([
    ...cbox(V(0, 0.77, 0.415), 0.098, 0.027, 0.15, 0.016),
    V(0.12, 0.795, 0.25), V(-0.12, 0.795, 0.25), V(0.11, 0.738, 0.25), V(-0.11, 0.738, 0.25),
  ]), SW.belly, 'y', [0.72, 0.8]));
  // mouth line (dark seam between snout and jaw) + small fangs
  HC.push(flat(hull([...cbox(V(0, 0.792, 0.455), 0.106, 0.006, 0.112, 0.003)]), SW.mouth));
  for (const x of [0.07]) HS.push(flat(hull([V(x - 0.012, 0.795, 0.572), V(x + 0.012, 0.795, 0.572), V(x - 0.012, 0.795, 0.587),
    V(x + 0.012, 0.795, 0.587), V(x, 0.762, 0.584)]), SW.white));

  // fierce eyes + heavy brow
  const E = V(0.066, 0.932, 0);
  const es = (pts) => pts.map(([u, v]) => [u * 1.15, v * 1.15]);
  HS.push(flat(hull(plate(es([[-0.04, 0.004], [0.044, 0.034], [0.05, -0.008], [0.022, -0.038], [-0.028, -0.036], [-0.045, -0.016]]),
    E, FZ - 0.01, FZ + 0.01, 0.5)), SW.white));
  HS.push(flat(hull(plate(es([[-0.025, 0.002], [0.014, 0.016], [0.02, -0.006], [0.006, -0.028], [-0.018, -0.026], [-0.029, -0.01]]),
    V(E.x - 0.002, E.y, 0), FZ + 0.004, FZ + 0.016, 0.5)), SW.eye));
  HS.push(flat(hull(plate([[-0.006, -0.006], [0.006, -0.006], [0.006, 0.006], [-0.006, 0.006]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.012, FZ + 0.02, 0.5)), SW.white));
  HS.push(paint(hull([
    V(0.025, E.y + 0.01, FZ + 0.028), V(0.028, E.y + 0.048, FZ + 0.018),
    V(0.155, E.y + 0.048, FZ - 0.03), V(0.155, E.y + 0.085, FZ - 0.04),
    V(0.025, E.y + 0.01, FZ - 0.03), V(0.028, E.y + 0.058, FZ - 0.04),
    V(0.155, E.y + 0.048, FZ - 0.07), V(0.155, E.y + 0.085, FZ - 0.08),
  ]), SW.brow, 'y', [0.9, 1.05]));

  // small gold crown on top of the skull, purple gem
  const CR = V(0, 1.0, 0.27);
  HC.push(gold(hull([...ring(V(CR.x, CR.y, CR.z), 0.072, 0.065, 8, 'y'), ...ring(V(CR.x, CR.y + 0.04, CR.z), 0.078, 0.07, 8, 'y')]), 1.0, 1.05));
  HC.push(gold(shard(V(0, CR.y + 0.035, CR.z + 0.066), V(0, 1, 0.12), 0.024, 0.06)));
  HS.push(gold(shard(V(0.055, CR.y + 0.035, CR.z + 0.04), V(0.25, 1, 0.1), 0.022, 0.05)));
  HS.push(gold(shard(V(0.06, CR.y + 0.035, CR.z - 0.035), V(0.25, 1, -0.1), 0.022, 0.045)));
  HC.push(gold(shard(V(0, CR.y + 0.035, CR.z - 0.066), V(0, 1, -0.12), 0.022, 0.045)));
  HC.push(flat(hull([...cbox(V(0, CR.y + 0.02, CR.z + 0.074), 0.016, 0.016, 0.006, 0.006), V(0, CR.y + 0.02, CR.z + 0.086)]), SW.gem));

  // golden halo floating above the head
  for (const g of hoop(V(0, 1.125, 0.26), 0.12, 0.024, 0.024, 16, -0.12)) HC.push(paint(g, SW.halo, 'flat'));

  const HP = V(0, 0.78, 0.24), HSC = 1.3;
  for (const g of [...HC, ...HS]) {
    g.translate(-HP.x, -HP.y, -HP.z); g.scale(HSC, HSC, HSC); g.translate(HP.x, HP.y - 0.01, HP.z + 0.02);
  }
  C.push(...HC); S.push(...HS);

  // ================= CODE BACK PLATES (big pentagon fins with glowing code) =================
  const spikes = [
    // [z, y base, height, half-length]
    [0.05, 0.8, 0.28, 0.072],
    [-0.1, 0.72, 0.32, 0.074],
    [-0.25, 0.66, 0.3, 0.074],
    [-0.4, 0.58, 0.25, 0.07],
    [-0.55, 0.48, 0.2, 0.064],
    [-0.69, 0.36, 0.15, 0.056],
    [-0.82, 0.25, 0.11, 0.048],
  ];
  for (const s of spikes) if (s[0] >= -0.33 && s[0] < 0.2) s[1] = ySpine(s[0]) + 0.01;
  for (const s of spikes) if (s[0] < -0.33) {
    let bt = 0, bd = 9;
    for (let i = 0; i <= 100; i++) { const d = Math.abs(tc.getPoint(i / 100).z - s[0]); if (d < bd) { bd = d; bt = i / 100; } }
    s[1] = tc.getPoint(bt).y + tailRY(bt) * 0.85;
  }
  spikes.forEach(([z, y, h, l], k) => {
    const g = fin(0, [[z - l, y - 0.04], [z + l, y - 0.04], [z + l, y + h * 0.5], [z - l, y + h * 0.5],
      [z, y + h]], k % 2 ? 0.027 : 0.022, 0.01);
    C.push(codeUV(g, CODE[k % 4]));
  });
  // splayed side code plates over the shoulders (built per side so glyphs read correctly on both)
  for (const [z, h, l, sw] of [[-0.03, 0.25, 0.075, SW.code1], [-0.175, 0.22, 0.07, SW.code0]]) {
    const y = ySpine(z) - 0.05;
    for (const sg of [1, -1]) {
      const g = codeUV(fin(0, [[-l, -0.04], [l, -0.04], [l, h * 0.5], [-l, h * 0.5], [0, h]], 0.018, 0.008), sw);
      g.rotateY(-0.4 * sg); g.rotateZ(-0.5 * sg); g.translate(0.05 * sg, y, z);
      C.push(g);
    }
  }

  // ================= RADIANT WINGS (fanned, layered faceted shard feathers) =================
  const R0 = V(0.13, 0.75, -0.19);
  const ax = V(1, 0, -0.35).normalize(), ay = V(0, 1, -0.15).normalize();
  const n = new THREE.Vector3().crossVectors(ax, ay).normalize(); // front face (+z, out)
  const fdir = (deg) => { const t = (deg * Math.PI) / 180; return ax.clone().multiplyScalar(Math.cos(t)).addScaledVector(ay, Math.sin(t)).normalize(); };
  // faceted feather: lozenge with a raised centre ridge on both faces
  const feather = (p, d, L, W, th) => {
    const sv = new THREE.Vector3().crossVectors(n, d).normalize();
    const pts = [];
    const at = (u, v, o) => p.clone().addScaledVector(d, u * L).addScaledVector(sv, v * W).addScaledVector(n, o);
    for (const o of [-th, th]) pts.push(at(0, -0.35, o), at(0, 0.35, o), at(0.55, -0.5, o), at(0.55, 0.5, o));
    pts.push(at(1, 0, 0), at(0.45, 0, th * 2.4), at(0.45, 0, -th * 2.4), at(0.05, 0, th * 2));
    return hull(pts);
  };
  // root knuckle (gold)
  S.push(gold(hull([...ring(R0, 0.05, 0.05, 6, 'y'), ...ring(R0.clone().add(V(0.02, 0.06, -0.01)), 0.04, 0.04, 6, 'y')])));
  // primaries (radiant gold, back layer)
  const prim = [[-18, 0.25], [0, 0.31], [17, 0.36], [33, 0.38], [48, 0.37], [62, 0.33], [76, 0.27]];
  prim.forEach(([deg, L], k) => {
    const d = fdir(deg);
    S.push(paint(feather(R0.clone().addScaledVector(d, 0.04).addScaledVector(n, -0.012 * (k % 2)), d, L, 0.11, 0.01), SW.radiant, 'y'));
  });
  // secondaries (gold, middle layer, between primaries)
  for (let k = 0; k < prim.length - 1; k++) {
    const deg = (prim[k][0] + prim[k + 1][0]) / 2, L = (prim[k][1] + prim[k + 1][1]) / 2 * 0.68, d = fdir(deg);
    S.push(gold(feather(R0.clone().addScaledVector(d, 0.04).addScaledVector(n, 0.022 + 0.005 * (k % 2)), d, L, 0.1, 0.009)));
  }
  // royal-purple coverts along the top / leading edge
  for (const [deg, L, k] of [[30, 0.15, 0], [48, 0.17, 1], [64, 0.17, 2], [80, 0.14, 3]]) {
    const d = fdir(deg);
    S.push(flat(feather(R0.clone().addScaledVector(d, 0.03).addScaledVector(n, 0.045 + 0.005 * (k % 2)), d, L, 0.09, 0.008), SW.purple));
  }

  return assemble(C, S);
}

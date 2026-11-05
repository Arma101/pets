// Angel Pup (SECRET, Round 10 Champion's Heaven): chunky faceted white marble puppy with small gold-tipped
// feathered wings, a floating gold halo, gold trim, glowing light-gold runes and floating gold diamonds.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// marble cell: soft white gradient with faint lilac-grey and gold veins
function drawMarble(veins, gold, bot = '#D9D7E6', mid = '#F3F2F8') {
  return (g, x, y) => {
    const grad = g.createLinearGradient(0, y, 0, y + 128);
    grad.addColorStop(0, '#FFFFFF'); grad.addColorStop(0.55, mid); grad.addColorStop(1, bot);
    g.fillStyle = grad; g.fillRect(x, y, 128, 128);
    g.save(); g.beginPath(); g.rect(x, y, 128, 128); g.clip();
    g.lineCap = 'round';
    const line = (pts, col, w) => {
      g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x + pts[0][0], y + pts[0][1]);
      for (let i = 1; i < pts.length; i++) g.lineTo(x + pts[i][0], y + pts[i][1]);
      g.stroke();
    };
    line([[0, 30], [22, 38], [40, 30], [64, 52], [90, 48], [128, 70]], veins, 2.2);
    line([[10, 128], [30, 96], [52, 88], [70, 100], [100, 84], [128, 90]], veins, 1.6);
    line([[40, 0], [48, 18], [44, 30]], veins, 1.4);
    line([[64, 52], [70, 72], [62, 92]], veins, 1.2);
    line([[0, 64], [18, 60], [30, 70], [46, 66]], gold, 1.8);
    line([[90, 48], [100, 26], [118, 18], [128, 4]], gold, 1.8);
    g.restore();
  };
}
// two-tone cell: white for the first 68% (t), gold for the tip
function drawGoldTip(g, x, y) {
  const a = g.createLinearGradient(0, y, 0, y + 90);
  a.addColorStop(0, '#FFFFFF'); a.addColorStop(1, '#F1EFF7');
  g.fillStyle = a; g.fillRect(x, y, 128, 90);
  const b = g.createLinearGradient(0, y + 90, 0, y + 128);
  b.addColorStop(0, '#FFE57A'); b.addColorStop(1, '#E3A51C');
  g.fillStyle = b; g.fillRect(x, y + 90, 128, 38);
}

export const PALETTE = {
  body:    { i: 0, draw: drawMarble('#F2F0F7', '#F4F1E8', '#F4F3F9', '#FDFDFF') },
  marble:  { i: 1, draw: drawMarble('#B9B4CF', '#D9A520') },
  gold:    { i: 2, top: '#FFE680', bot: '#D99A12' },
  eye:     { i: 3, top: '#1A1416', bot: '#0C0A0B' },
  white:   { i: 4, top: '#FFFFFF', bot: '#F1F1F4' },
  nose:    { i: 5, top: '#3A3438', bot: '#141114' },
  muzzle:  { i: 6, top: '#FFFFFF', bot: '#EDE9F3' },
  brow:    { i: 7, top: '#F4F1FA', bot: '#B7B0CE' },
  tip:     { i: 8, draw: drawGoldTip },
  glow:    { i: 9, top: '#B8FBFF', bot: '#35CFFF', glow: true },
  halo:    { i: 10, top: '#FFF6B0', bot: '#FFC928', glow: true },
  mouth:   { i: 11, top: '#5A4A60', bot: '#3E3046' },
  paw:     { i: 12, top: '#FFFFFF', bot: '#E4E0EE' },
  shade:   { i: 13, top: '#FAF9FD', bot: '#E2DFEC' },
  feather: { i: 14, top: '#FFFFFF', bot: '#F1EFF7' },
};
const SW = PALETTE;

// ---- local UV helpers (copy of kit's swatch mapping, with custom u/t) ----
function swUV(sw, t, u = 0.5) {
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  const c = (v) => Math.min(1, Math.max(0, v));
  return [(x + 8 + c(u) * 112) / 1024, (y + 8 + c(t) * 112) / 1024];
}
// marble projection: veins wrap the body by world position
function marble(g, sw = SW.body, lo = 0, hi = 1.0) {
  const p = g.attributes.position, uv = [];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const u = 0.5 + Math.abs(x) * 0.9 - z * 0.75;
    const t = 1 - (y - lo) / (hi - lo);
    uv.push(...swUV(sw, t, u));
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}
// gradient along a direction (t = 0 at base, 1 at base + d*len)
function along(g, sw, b, d, len) {
  d = d.clone().normalize();
  const p = g.attributes.position, uv = [], q = V(0, 0, 0);
  for (let i = 0; i < p.count; i++) {
    q.set(p.getX(i), p.getY(i), p.getZ(i)).sub(b);
    uv.push(...swUV(sw, q.dot(d) / len));
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}

// flat feather blade: base b, direction d, plane normal n
function bladePts(b, d, n, w, len, th = 0.012) {
  d = d.clone().normalize();
  const s = new THREE.Vector3().crossVectors(d, n).normalize();
  const nn = new THREE.Vector3().crossVectors(s, d).normalize();
  const pts = [];
  for (const [t, wf] of [[0, 0.55], [0.35, 1], [0.78, 0.7], [1, 0]]) for (const sg of [-1, 1]) for (const k of [-1, 1]) {
    if (wf === 0 && sg === 1) continue;
    pts.push(b.clone().addScaledVector(d, t * len).addScaledVector(s, sg * wf * w).addScaledVector(nn, k * th * (wf === 0 ? 0.3 : 1)));
  }
  return pts;
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const body = (pts, lo = 0.0, hi = 1.0) => marble(hull(pts), SW.body, lo, hi);
  const gold = (g) => paint(g, SW.gold, 'y');
  const glow = (g) => paint(g, SW.glow, 'y');

  // ================= BODY =================
  C.push(body([
    ...ring(V(0, 0.35, -0.29), 0.09, 0.08, 10, 'z'),
    ...ring(V(0, 0.36, -0.23), 0.155, 0.15, 10, 'z'),
    ...ring(V(0, 0.37, -0.08), 0.175, 0.17, 10, 'z'),
    ...ring(V(0, 0.39, 0.08), 0.18, 0.175, 10, 'z'),
    ...ring(V(0, 0.42, 0.2), 0.16, 0.16, 10, 'z'),
    ...ring(V(0, 0.44, 0.26), 0.1, 0.1, 10, 'z'),
  ], 0.15, 0.62));
  C.push(body([...ring(V(0, 0.44, 0.15), 0.125, 0.12, 10, 'y'), ...ring(V(0, 0.62, 0.2), 0.13, 0.12, 10, 'y')], 0.3, 0.85));

  // ================= LEGS =================
  S.push(body([...ring(V(0.152, 0.06, 0.215), 0.07, 0.07, 8), ...ring(V(0.146, 0.2, 0.205), 0.078, 0.08, 8),
    ...ring(V(0.13, 0.33, 0.18), 0.092, 0.1, 8), ...ring(V(0.11, 0.42, 0.15), 0.07, 0.085, 8)], 0.0, 0.6));
  S.push(body([...ring(V(0.13, 0.43, -0.17), 0.07, 0.1, 8), ...ring(V(0.155, 0.32, -0.16), 0.1, 0.145, 8),
    ...ring(V(0.155, 0.2, -0.15), 0.08, 0.1, 8)], 0.0, 0.6));
  S.push(body([...ring(V(0.158, 0.22, -0.16), 0.074, 0.08, 8), ...ring(V(0.162, 0.13, -0.2), 0.07, 0.07, 8),
    ...ring(V(0.163, 0.06, -0.19), 0.068, 0.068, 8)], 0.0, 0.6));
  // paws (white marble) + gold trim cuff
  const paw = (x, z) => {
    S.push(marble(hull(cbox(V(x, 0.042, z - 0.005), 0.072, 0.042, 0.065, 0.022)), SW.marble, 0, 0.12));
    for (const dx of [-0.046, 0, 0.046])
      S.push(paint(hull(cbox(V(x + dx, 0.034, z + 0.06), 0.025, 0.034, 0.032, 0.012)), SW.paw, 'y', [0, 0.09]));
    S.push(gold(hull([...ring(V(x, 0.082, z - 0.004), 0.086, 0.084, 8), ...ring(V(x, 0.112, z - 0.004), 0.084, 0.082, 8)])));
  };
  paw(0.155, 0.215);
  paw(0.163, -0.17);

  // ================= CHEST RUFF (light feather shards) =================
  C.push(marble(blob(1, V(0, 0.44, 0.255), V(0.14, 0.15, 0.09), { jitter: 0.18 }), SW.body, 0.26, 0.7));
  const fluff = (b, d, w, l) => paint(shard(b, d, w, l), SW.shade, 'flat');
  C.push(fluff(V(0, 0.32, 0.27), V(0, -1, 0.35), 0.055, 0.11));
  for (const [b, d, w, l] of [
    [V(0.055, 0.32, 0.27), V(0.25, -1, 0.35), 0.05, 0.1],
    [V(0.105, 0.35, 0.25), V(0.6, -1, 0.3), 0.05, 0.09],
    [V(0.125, 0.45, 0.27), V(0.9, -0.7, 0.6), 0.05, 0.075],
    [V(0.15, 0.48, 0.2), V(1, -0.8, 0.0), 0.045, 0.06],
  ]) S.push(fluff(b, d, w, l));
  S.push(fluff(V(0.17, 0.36, -0.1), V(0.6, -0.5, -1), 0.04, 0.06));

  // gold collar dipping to the chest + marble medallion + glowing gem
  const collar = (r) => ring(V(0, 0, 0.2), r * 1.04, r, 12, 'y').map((p) => V(p.x, 0.6 - 0.5 * (p.z - 0.2), p.z));
  C.push(gold(hull([...collar(0.142), ...collar(0.142).map((p) => V(p.x, p.y - 0.035, p.z))])));
  C.push(gold(hull(plate([[0, 0.07], [0.062, 0.0], [0, -0.075], [-0.062, 0]], V(0, 0.48, 0), 0.315, 0.35))));
  C.push(marble(hull(plate([[0, 0.052], [0.046, 0.0], [0, -0.056], [-0.046, 0]], V(0, 0.48, 0), 0.34, 0.358)), SW.marble, 0.42, 0.54));
  C.push(glow(hull([V(0, 0.51, 0.357), V(0.022, 0.48, 0.357), V(0, 0.45, 0.357), V(-0.022, 0.48, 0.357), V(0, 0.48, 0.375)])));

  // ================= HEAD =================
  const H = { y: 0.72, z: 0.21 };
  C.push(body([
    ...cbox(V(0, H.y, H.z), 0.2, 0.155, 0.165, 0.065),
    ...ring(V(0, H.y + 0.175, H.z), 0.12, 0.1, 8, 'y'),
    V(0.215, H.y - 0.075, H.z + 0.06), V(-0.215, H.y - 0.075, H.z + 0.06),
  ], 0.5, 0.95));
  const FZ = H.z + 0.165;

  // light feather tufts on crown and cheeks
  C.push(paint(shard(V(0, H.y + 0.15, H.z + 0.06), V(0, 0.8, 1), 0.04, 0.04), SW.shade, 'flat'));
  S.push(paint(shard(V(0.05, H.y + 0.155, H.z + 0.04), V(0.5, 0.8, 0.6), 0.035, 0.035), SW.shade, 'flat'));
  S.push(paint(shard(V(0.19, H.y - 0.07, H.z + 0.06), V(1, -0.6, 0.2), 0.045, 0.075), SW.shade, 'flat'));
  S.push(paint(shard(V(0.18, H.y - 0.11, H.z - 0.02), V(0.8, -0.9, -0.2), 0.04, 0.07), SW.shade, 'flat'));

  // muzzle, jaw, nose, mouth
  C.push(paint(hull([...cbox(V(0, H.y - 0.075, FZ + 0.035), 0.105, 0.062, 0.075, 0.03),
    V(0.07, H.y - 0.01, FZ - 0.03), V(-0.07, H.y - 0.01, FZ - 0.03)]), SW.muzzle, 'y', [0.58, 0.72]));
  C.push(paint(hull(cbox(V(0, H.y - 0.135, FZ + 0.0), 0.08, 0.03, 0.07, 0.015)), SW.shade, 'flat'));
  C.push(paint(hull([...cbox(V(0, H.y - 0.035, FZ + 0.108), 0.045, 0.022, 0.02, 0.01),
    V(0, H.y - 0.07, FZ + 0.1), V(0.02, H.y - 0.062, FZ + 0.1), V(-0.02, H.y - 0.062, FZ + 0.1)]), SW.nose, 'y'));
  C.push(paint(hull(cbox(V(0, H.y - 0.09, FZ + 0.105), 0.006, 0.022, 0.006, 0.002)), SW.mouth, 'flat'));
  S.push(paint(hull([V(0, H.y - 0.112, FZ + 0.11), V(0, H.y - 0.1, FZ + 0.11), V(0.055, H.y - 0.122, FZ + 0.098),
    V(0.055, H.y - 0.112, FZ + 0.098), V(0, H.y - 0.112, FZ + 0.1), V(0.055, H.y - 0.118, FZ + 0.085)]), SW.mouth, 'flat'));

  // fierce eyes
  const E = V(0.088, H.y + 0.03, 0);
  S.push(paint(hull(plate([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]],
    E, FZ - 0.01, FZ + 0.012)), SW.white, 'flat'));
  S.push(paint(hull(plate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]],
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.014, FZ + 0.021)), SW.white, 'flat'));
  // heavy brow
  S.push(paint(hull([
    V(0.028, E.y + 0.012, FZ + 0.03), V(0.03, E.y + 0.05, FZ + 0.02),
    V(0.15, E.y + 0.05, FZ - 0.01), V(0.15, E.y + 0.088, FZ - 0.025),
    V(0.028, E.y + 0.012, FZ - 0.03), V(0.03, E.y + 0.06, FZ - 0.04),
    V(0.15, E.y + 0.05, FZ - 0.06), V(0.15, E.y + 0.09, FZ - 0.07),
  ]), SW.brow, 'y'));
  // glowing forehead rune (diamond + chevrons)
  C.push(glow(hull(plate([[0, 0.03], [0.018, 0], [0, -0.022], [-0.018, 0]], V(0, H.y + 0.115, 0), FZ - 0.012, FZ + 0.006))));

  // floppy ears with gold tips
  const ear = tube(curveSamples(
    [V(0.12, H.y + 0.15, H.z - 0.02), V(0.205, H.y + 0.16, H.z - 0.015), V(0.26, H.y + 0.08, H.z - 0.005),
      V(0.275, H.y - 0.03, H.z + 0.01), V(0.262, H.y - 0.12, H.z + 0.02)],
    8, (t) => 0.065 + 0.04 * Math.sin(Math.PI * Math.min(1, t * 1.05)), (t) => 0.038 - 0.01 * t),
    { seg: 6, axis: V(0.35, 0, 1), capStart: 0.0, capEnd: 0.05, phase: Math.PI / 6 });
  S.push(paint(ear, SW.tip, 'len'));

  // ================= HALO (floating, gold, glowing) =================
  const HC = V(0, H.y + 0.3, H.z - 0.03), HR = 0.135, NH = 12, tilt = 0.28;
  const hq = new THREE.Quaternion().setFromAxisAngle(X, tilt);
  const hp = (a, r, dy) => V(Math.sin(a) * r, dy, Math.cos(a) * r).applyQuaternion(hq).add(HC);
  for (let k = 0; k < NH; k++) {
    const a0 = (2 * Math.PI * k) / NH, a1 = (2 * Math.PI * (k + 1)) / NH;
    const pts = [];
    for (const a of [a0, a1]) for (const r of [HR - 0.024, HR + 0.024]) for (const dy of [-0.017, 0.017]) pts.push(hp(a, r, dy));
    C.push(paint(hull(pts), SW.halo, 'y', [HC.y - 0.06, HC.y + 0.06]));
  }

  // ================= WINGS (small swept-back fans, white feathers with gold tips) =================
  // local wing frame: u = outward-and-back, v = up, n = facing out/forward (the visible side)
  const WR = V(0.1, 0.56, -0.02);
  const wu = V(0.72, 0.0, -0.7).normalize(), wv = V(0, 1, 0.12).normalize();
  const wn = new THREE.Vector3().crossVectors(wu, wv).normalize();
  const W = (a, b, o = 0) => WR.clone().addScaledVector(wu, a).addScaledVector(wv, b).addScaledVector(wn, o);
  const D2 = (deg) => { const r = deg * Math.PI / 180; return wu.clone().multiplyScalar(Math.cos(r)).addScaledVector(wv, Math.sin(r)); };
  // curved gold arm: shoulder -> elbow -> wrist (raised up and back)
  const arm = [[0, 0], [0.09, 0.13], [0.2, 0.21], [0.3, 0.25]];
  S.push(gold(tube(curveSamples(arm.map(([x, y]) => W(x, y, 0.006)), 7, (t) => 0.042 - 0.016 * t, (t) => 0.026 - 0.008 * t),
    { seg: 6, ref: wn, capStart: 0.01, capEnd: 0.03 })));
  const armAt = (t) => { // piecewise-linear along arm, t in 0..1
    const f = t * (arm.length - 1), i = Math.min(arm.length - 2, Math.floor(f)), k = f - i;
    return [arm[i][0] + (arm[i + 1][0] - arm[i][0]) * k, arm[i][1] + (arm[i + 1][1] - arm[i][1]) * k];
  };
  const wingFeather = (t, ang, len, w, off, sw) => {
    const [x, y] = armAt(t);
    const b = W(x, y, off), d = D2(ang);
    const g = hull(bladePts(b, d, wn, w, len, 0.01));
    S.push(sw ? paint(g, sw, 'flat') : along(g, SW.tip, b, d, len));
  };
  // primaries: long, fanning from down-out (root) to up-out (wrist)
  const NPr = 8;
  for (let i = 0; i < NPr; i++) {
    const t = 0.25 + 0.75 * i / (NPr - 1);
    wingFeather(t, -80 + 100 * i / (NPr - 1), 0.18 + 0.1 * i / (NPr - 1), 0.068, -0.016);
  }
  // secondaries: medium, closer to the arm
  const NSe = 6;
  for (let i = 0; i < NSe; i++) {
    const t = 0.08 + 0.82 * i / (NSe - 1);
    wingFeather(t, -95 + 105 * i / (NSe - 1), 0.12 + 0.04 * i / (NSe - 1), 0.06, -0.002);
  }
  // coverts: short white overlapping row on the front face
  const NCo = 5;
  for (let i = 0; i < NCo; i++) {
    const t = 0.05 + 0.85 * i / (NCo - 1);
    wingFeather(t, -90 + 80 * i / (NCo - 1), 0.08, 0.055, 0.012, SW.feather);
  }

  // ================= TAIL (fluffy curl, gold tip) =================
  C.push(paint(tube(curveSamples(
    [V(0, 0.4, -0.27), V(0, 0.5, -0.38), V(0, 0.64, -0.42), V(0, 0.75, -0.36), V(0, 0.77, -0.27), V(0, 0.7, -0.23), V(0, 0.66, -0.27)],
    14, (t) => (0.05 + 0.04 * Math.sin(Math.PI * Math.min(1, t * 1.25))) * (t > 0.85 ? 1 - (t - 0.85) * 3 : 1)),
    { seg: 8, axis: X, capEnd: 0.04, twist: (i) => (i % 2) * Math.PI / 8, scale: (i) => (i % 2 ? 1.32 : 0.95) }),
    SW.tip, 'len'));

  // ================= GLOWING RUNES (flat inlays projected onto the surface) =================
  const rc = new THREE.Raycaster();
  const targets = [C[0], S[0], S[1]].map((g) => new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })));
  const proj = (o, dir) => {
    rc.set(o, dir.clone().normalize());
    const h = rc.intersectObjects(targets, false)[0];
    if (!h) return null;
    const n = h.face.normal.clone();
    if (n.dot(dir) > 0) n.negate();
    return { p: h.point, n };
  };
  // inlay: 2D polygon (in plane coords) projected along -dir from far away; sits 0.005 above, sinks 0.01 below
  const inlay = (pts2, frame, list) => {
    const out = [];
    for (const [a, b] of pts2) {
      const o = frame.o.clone().addScaledVector(frame.a, a).addScaledVector(frame.b, b).addScaledVector(frame.d, -1);
      const h = proj(o, frame.d);
      if (!h) continue;
      out.push(h.p.clone().addScaledVector(h.n, 0.005), h.p.clone().addScaledVector(h.n, -0.01));
    }
    if (out.length >= 6) list.push(glow(hull(out)));
  };
  // pattern: centre diamond + two open chevrons + small dots, s = scale
  const pattern = (frame, s, list) => {
    inlay([[0, 0.048 * s], [0.03 * s, 0], [0, -0.048 * s], [-0.03 * s, 0]], frame, list);
    for (const sg of [-1, 1])
      inlay([[sg * 0.044 * s, 0.036 * s], [sg * 0.082 * s, 0], [sg * 0.044 * s, -0.036 * s], [sg * 0.056 * s, 0]], frame, list);
  };
  const side = (y, z) => ({ o: V(0, y, z), a: V(0, 0, 1), b: V(0, 1, 0), d: V(-1, 0, 0) });
  const sideFrame = (y, z) => { const f = side(y, z); f.o.x = 1; return f; };
  pattern(sideFrame(0.43, 0.0), 1.25, S);      // flank
  pattern(sideFrame(0.31, -0.155), 0.95, S);   // haunch
  // spine: diamond chain on the back (centre line)
  const top = (z) => ({ o: V(0, 1.5, z), a: V(1, 0, 0), b: V(0, 0, 1), d: V(0, -1, 0) });
  for (const [z, r] of [[-0.17, 0.03], [-0.075, 0.04], [0.02, 0.028]])
    inlay([[0, r * 1.4], [r, 0], [0, -r * 1.4], [-r, 0]], top(z), C);

  // ================= FLOATING DIAMONDS =================
  const gem = (c, r) => S.push(paint(hull([V(c.x, c.y + r * 1.5, c.z), V(c.x, c.y - r * 1.5, c.z),
    V(c.x + r, c.y, c.z), V(c.x - r, c.y, c.z), V(c.x, c.y, c.z + r), V(c.x, c.y, c.z - r)]), SW.halo, 'y'));
  gem(V(0.29, 0.44, 0.14), 0.032);
  gem(V(0.31, 0.5, -0.27), 0.027);

  return assemble(C, S);
}

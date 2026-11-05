// Star Pup (SECRET, Round 9 - Galaxy Colosseum): pale golden faceted puppy with white star markings,
// round ears, a glowing forehead star, nebula-glow saddle and floating stars on an orbit halo.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// nebula cell: bright violet/pink/cyan clouds with white star dots (looks glowing even without emissive)
function drawNebula(g, x, y) {
  g.save();
  g.beginPath(); g.rect(x, y, 128, 128); g.clip();
  g.fillStyle = '#9C7BFF'; g.fillRect(x, y, 128, 128);
  const blot = (cx, cy, r, c0, c1) => {
    const gr = g.createRadialGradient(x + cx, y + cy, 0, x + cx, y + cy, r);
    gr.addColorStop(0, c0); gr.addColorStop(1, c1);
    g.fillStyle = gr; g.fillRect(x, y, 128, 128);
  };
  blot(30, 40, 60, 'rgba(255,150,230,1)', 'rgba(255,150,230,0)');
  blot(95, 85, 60, 'rgba(110,220,255,1)', 'rgba(110,220,255,0)');
  blot(70, 20, 40, 'rgba(200,170,255,1)', 'rgba(200,170,255,0)');
  blot(25, 105, 45, 'rgba(140,200,255,0.9)', 'rgba(140,200,255,0)');
  blot(105, 30, 35, 'rgba(255,180,240,0.9)', 'rgba(255,180,240,0)');
  g.fillStyle = '#FFFFFF';
  const dots = [[12, 18, 3], [44, 12, 2], [60, 50, 3], [88, 22, 2], [110, 58, 3], [20, 70, 2], [50, 92, 3],
    [80, 110, 2], [100, 96, 2], [118, 116, 3], [36, 120, 2], [72, 74, 2], [8, 44, 2], [120, 8, 2]];
  for (const [dx, dy, s] of dots) g.fillRect(x + dx - s / 2, y + dy - s / 2, s, s);
  g.restore();
}

export const PALETTE = {
  body:   { i: 0, top: '#FFE49A', bot: '#DCA54C' },
  cream:  { i: 1, top: '#FFFFFF', bot: '#F3EEDF' },
  ear:    { i: 2, top: '#F2C66A', bot: '#C99238' },
  nose:   { i: 3, top: '#3A3248', bot: '#16121C' },
  eye:    { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  muzzle: { i: 6, top: '#FFF8E4', bot: '#F1DFB4' },
  tail:   { i: 7, top: '#EDB955', bot: '#FFF6DE' },
  brow:   { i: 8, top: '#F4CF7C', bot: '#D29D45' },
  paw:    { i: 9, top: '#FFFFFF', bot: '#EDE6D6' },
  mouth:  { i: 10, top: '#5A3A2A', bot: '#3E2418' },
  starW:  { i: 11, top: '#FFFFFF', bot: '#EAF6FF' },
  rim:    { i: 16, top: '#A8F8FF', bot: '#3FD0FF', glow: true },
  glowS:  { i: 12, top: '#FFF27A', bot: '#FFB81C', glow: true },
  nebula: { i: 13, draw: drawNebula, glow: true },
  orbit:  { i: 14, top: '#B89BFF', bot: '#6E4BFF', glow: true },
  backS:  { i: 15, top: '#7A52E8', bot: '#4A2BB0' },
};
const SW = PALETTE;

// planar UV projection into a custom-drawn cell (axis pair from world coords)
function paintProj(g, sw, f) {
  const p = g.attributes.position, uv = [];
  const x0 = (sw.i % 8) * 128, y0 = Math.floor(sw.i / 8) * 128;
  for (let i = 0; i < p.count; i++) {
    let [u, v] = f(p.getX(i), p.getY(i), p.getZ(i));
    u = THREE.MathUtils.clamp(u, 0, 1); v = THREE.MathUtils.clamp(v, 0, 1);
    uv.push((x0 + 6 + u * 116) / 1024, (y0 + 6 + v * 116) / 1024);
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}

// faceted 5-point star: centre c, facing n, point toward up. Each arm is a convex kite with a raised ridge.
function star(c, n, up, R, th = 0.012, ri = 0.45, pts = 5) {
  n = n.clone().normalize();
  const u = up.clone().addScaledVector(n, -up.dot(n)).normalize();
  const v = new THREE.Vector3().crossVectors(n, u).normalize();
  const P = (a, r, h) => c.clone().addScaledVector(u, Math.cos(a) * r).addScaledVector(v, Math.sin(a) * r).addScaledVector(n, h);
  const out = [];
  const step = (2 * Math.PI) / pts;
  for (let k = 0; k < pts; k++) {
    const a = k * step;
    out.push(hull([P(a, R, th * 0.6), P(a, R, -th), P(a - step / 2, R * ri, th * 0.8), P(a - step / 2, R * ri, -th),
      P(a + step / 2, R * ri, th * 0.8), P(a + step / 2, R * ri, -th), c.clone().addScaledVector(n, th * 1.9), c.clone().addScaledVector(n, -th)]));
  }
  return out;
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0), Y = V(0, 1, 0), Z = V(0, 0, 1);
  const gold = (pts, lo = 0.0, hi = 0.95) => paint(hull(pts), SW.body, 'y', [lo, hi]);
  const cream = (g, lo, hi) => paint(g, SW.cream, lo === undefined ? 'flat' : 'y', lo === undefined ? null : [lo, hi]);
  const pushStar = (arr, g, sw = SW.starW) => { for (const s of g) arr.push(paint(s, sw, 'flat')); };
  // glowing gold star with a violet outline star behind it (reads on white bg and on pale gold fur)
  const glowStar = (arr, c, n, up, R, th) => {
    const nn = n.clone().normalize();
    pushStar(arr, star(c.clone().addScaledVector(nn, -th * 0.9), nn, up, R * 1.32, th * 0.9, 0.5), SW.backS);
    pushStar(arr, star(c.clone().addScaledVector(nn, th * 0.35), nn, up, R, th), SW.glowS);
  };
  // white star marking on a thin glowing cyan backing plate
  const markStar = (c, n, up, R, th = 0.012) => {
    const nn = n.clone().normalize();
    pushStar(S, star(c.clone().addScaledVector(nn, -0.003), nn, up, R * 1.22, th * 0.8, 0.5), SW.rim);
    pushStar(S, star(c.clone().addScaledVector(nn, th * 0.55), nn, up, R, th), SW.starW);
  };
  // thick floating star (about 0.03+ deep): gold both faces, violet rim between
  const thickStar = (arr, c, n, up, R) => {
    const nn = n.clone().normalize();
    pushStar(arr, star(c, nn, up, R * 1.28, 0.009, 0.5), SW.backS);
    pushStar(arr, star(c, nn, up, R, 0.015), SW.glowS);
    pushStar(arr, star(c, nn.clone().negate(), up, R, 0.015), SW.glowS);
  };
  // free-floating star seen from both sides: gold faces front and back, violet rim between
  const floatStar = (arr, c, n, up, R, th) => {
    const nn = n.clone().normalize();
    pushStar(arr, star(c, nn, up, R * 1.3, th * 0.8, 0.5), SW.backS);
    pushStar(arr, star(c.clone().addScaledVector(nn, th * 0.6), nn, up, R, th), SW.glowS);
    pushStar(arr, star(c.clone().addScaledVector(nn, -th * 0.6), nn.clone().negate(), up, R, th), SW.glowS);
  };

  // ================= BODY =================
  const bodyRings = [
    [V(0, 0.36, -0.29), 0.09, 0.08], [V(0, 0.37, -0.23), 0.155, 0.15], [V(0, 0.38, -0.08), 0.175, 0.17],
    [V(0, 0.40, 0.08), 0.18, 0.175], [V(0, 0.43, 0.2), 0.16, 0.16], [V(0, 0.45, 0.26), 0.1, 0.1],
  ];
  C.push(gold(bodyRings.flatMap(([c, a, b]) => ring(c, a, b, 10, 'z')), 0.15, 0.6));
  // neck
  C.push(gold([...ring(V(0, 0.45, 0.15), 0.125, 0.12, 10, 'y'), ...ring(V(0, 0.63, 0.2), 0.13, 0.12, 10, 'y')], 0.3, 0.8));

  // nebula saddle: a raised cosmic panel over the back (top arc of the body rings, pushed out)
  {
    const pts = [];
    for (const [c, a, b] of bodyRings.slice(1, 5)) {
      for (let k = 0; k <= 6; k++) {
        const ang = Math.PI * (0.18 + 0.64 * (k / 6));
        pts.push(V(c.x + Math.cos(ang) * a * 0.93, c.y + Math.sin(ang) * b * 0.93 + 0.022, c.z));
        pts.push(V(c.x + Math.cos(ang) * a * 0.7, c.y + Math.sin(ang) * b * 0.55, c.z));
      }
    }
    C.push(paintProj(hull(pts), SW.nebula, (x, y, z) => [(x + 0.18) / 0.36, (z + 0.25) / 0.48]));
  }

  // ================= LEGS =================
  S.push(gold([...ring(V(0.152, 0.06, 0.215), 0.07, 0.07, 8), ...ring(V(0.146, 0.2, 0.205), 0.078, 0.08, 8),
    ...ring(V(0.13, 0.33, 0.18), 0.092, 0.1, 8), ...ring(V(0.11, 0.43, 0.15), 0.07, 0.085, 8)], 0.0, 0.55));
  S.push(gold([...ring(V(0.13, 0.44, -0.17), 0.07, 0.1, 8), ...ring(V(0.155, 0.33, -0.16), 0.1, 0.145, 8),
    ...ring(V(0.155, 0.2, -0.15), 0.08, 0.1, 8)], 0.0, 0.55));
  S.push(gold([...ring(V(0.158, 0.22, -0.16), 0.074, 0.08, 8), ...ring(V(0.162, 0.13, -0.2), 0.07, 0.07, 8),
    ...ring(V(0.163, 0.06, -0.19), 0.068, 0.068, 8)], 0.0, 0.55));
  // white socks + paws with toes
  const paw = (x, z) => {
    S.push(paint(hull([...ring(V(x, 0.06, z - 0.005), 0.076, 0.076, 8), ...ring(V(x, 0.12, z - 0.005), 0.074, 0.074, 8)]), SW.paw, 'y', [0, 0.14]));
    S.push(paint(hull(cbox(V(x, 0.042, z - 0.005), 0.076, 0.042, 0.068, 0.022)), SW.paw, 'y', [0, 0.1]));
    for (const dx of [-0.048, 0, 0.048])
      S.push(paint(hull(cbox(V(x + dx, 0.034, z + 0.062), 0.026, 0.034, 0.033, 0.012)), SW.paw, 'y', [0, 0.09]));
  };
  paw(0.155, 0.215);
  paw(0.163, -0.17);

  // ================= STAR MARKINGS (white, on flanks and haunches) =================
  markStar(V(0.181, 0.405, 0.0), V(1, 0.12, 0), Y, 0.088, 0.008);           // flank
  markStar(V(0.252, 0.33, -0.165), V(1, 0.05, -0.1), V(-0.2, 1, 0), 0.068, 0.008); // haunch
  markStar(V(0.214, 0.34, 0.19), V(1, 0, 0.3), Y, 0.05, 0.007);          // shoulder

  // ================= CHEST RUFF (white shards) =================
  C.push(paint(blob(1, V(0, 0.45, 0.255), V(0.14, 0.15, 0.09), { jitter: 0.18 }), SW.cream, 'y', [0.26, 0.62]));
  C.push(cream(shard(V(0, 0.33, 0.27), V(0, -1, 0.35), 0.055, 0.11)));
  C.push(cream(shard(V(0, 0.43, 0.32), V(0, -0.7, 1), 0.06, 0.08)));
  C.push(cream(shard(V(0, 0.54, 0.31), V(0, -0.4, 1), 0.06, 0.07)));
  for (const [b, d, w, l] of [
    [V(0.055, 0.33, 0.27), V(0.25, -1, 0.35), 0.05, 0.1],
    [V(0.105, 0.36, 0.25), V(0.6, -1, 0.3), 0.05, 0.09],
    [V(0.06, 0.44, 0.31), V(0.35, -0.7, 1), 0.055, 0.075],
    [V(0.125, 0.46, 0.27), V(0.9, -0.7, 0.6), 0.05, 0.075],
    [V(0.065, 0.54, 0.3), V(0.45, -0.4, 1), 0.05, 0.065],
    [V(0.13, 0.56, 0.25), V(1, -0.4, 0.5), 0.05, 0.065],
    [V(0.15, 0.49, 0.2), V(1, -0.8, 0.0), 0.045, 0.06],
  ]) S.push(cream(shard(b, d, w, l)));
  S.push(paint(shard(V(0.165, 0.44, 0.08), V(0.6, -0.4, -1), 0.045, 0.07), SW.body, 'flat'));
  S.push(paint(shard(V(0.17, 0.37, -0.1), V(0.6, -0.5, -1), 0.04, 0.06), SW.body, 'flat'));

  // ================= HEAD =================
  const H = { y: 0.73, z: 0.21 };
  C.push(gold([
    ...cbox(V(0, H.y, H.z), 0.2, 0.155, 0.165, 0.065),
    ...ring(V(0, H.y + 0.175, H.z), 0.12, 0.1, 8, 'y'),
    V(0.215, H.y - 0.075, H.z + 0.06), V(-0.215, H.y - 0.075, H.z + 0.06),
  ], 0.5, 0.92));
  const FZ = H.z + 0.165;

  // cheek fluff (white)
  S.push(cream(shard(V(0.19, H.y - 0.07, H.z + 0.06), V(1, -0.6, 0.2), 0.045, 0.075)));
  S.push(cream(shard(V(0.18, H.y - 0.11, H.z - 0.02), V(0.8, -0.9, -0.2), 0.04, 0.07)));

  // muzzle, jaw, nose, mouth
  const MZ = FZ + 0.03; // longer snout
  C.push(paint(hull([...cbox(V(0, H.y - 0.078, MZ + 0.035), 0.088, 0.058, 0.085, 0.028),
    V(0.07, H.y - 0.01, FZ - 0.03), V(-0.07, H.y - 0.01, FZ - 0.03)]), SW.muzzle, 'y', [H.y - 0.14, H.y]));
  C.push(paint(hull(cbox(V(0, H.y - 0.135, MZ + 0.0), 0.068, 0.028, 0.075, 0.014)), SW.cream, 'flat'));
  C.push(paint(hull([...cbox(V(0, H.y - 0.04, MZ + 0.118), 0.042, 0.022, 0.02, 0.01),
    V(0, H.y - 0.075, MZ + 0.11), V(0.02, H.y - 0.066, MZ + 0.11), V(-0.02, H.y - 0.066, MZ + 0.11)]), SW.nose, 'y'));
  C.push(paint(hull(cbox(V(0, H.y - 0.095, MZ + 0.115), 0.006, 0.022, 0.006, 0.002)), SW.mouth, 'flat'));
  S.push(paint(hull([V(0, H.y - 0.117, MZ + 0.12), V(0, H.y - 0.105, MZ + 0.12), V(0.05, H.y - 0.127, MZ + 0.108),
    V(0.05, H.y - 0.117, MZ + 0.108), V(0, H.y - 0.117, MZ + 0.11), V(0.05, H.y - 0.123, MZ + 0.095)]), SW.mouth, 'flat'));

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

  // glowing forehead star (above the brows, on the front face)
  glowStar(C, V(0, H.y + 0.124 + 0.007, FZ - 0.034 + 0.007), V(0, 1, 1), V(0, 1, -1), 0.045, 0.01);

  // round ears: thick faceted discs on top-sides of the head, nebula inner
  {
    const ec = V(0.178, H.y + 0.17, H.z - 0.02), en = V(0.3, 0.05, 1).normalize();
    const eu = V(0.75, 1, 0).normalize();
    const ev = new THREE.Vector3().crossVectors(en, eu).normalize();
    const disc = (r, h0, h1, n = 8) => {
      const pts = [];
      for (let k = 0; k < n; k++) {
        const a = (2 * Math.PI * k) / n + Math.PI / 8;
        for (const h of [h0, h1]) pts.push(ec.clone().addScaledVector(eu, Math.sin(a) * r).addScaledVector(ev, Math.cos(a) * r).addScaledVector(en, h));
      }
      return pts;
    };
    S.push(paint(hull([...disc(0.085, -0.035, 0.022), ...ring(V(0.13, H.y + 0.12, H.z - 0.03), 0.045, 0.04, 6, 'y')]), SW.ear, 'y', [H.y + 0.1, H.y + 0.29]));
    S.push(paintProj(hull(disc(0.058, 0.0, 0.03)), SW.nebula, (x, y, z) => [(x - 0.11) / 0.14, (H.y + 0.25 - y) / 0.16]));
  }

  // ================= TAIL (upright chunky curl, gold to white tip) + tip star =================
  // faceted chain of 6-sided hull segments, each flaring then pinching like stacked fur tufts
  {
    const curve = new THREE.CatmullRomCurve3([V(0, 0.4, -0.26), V(0, 0.5, -0.36), V(0, 0.62, -0.41), V(0, 0.72, -0.38), V(0, 0.78, -0.31)]);
    const N = 6, rad = [0.055, 0.075, 0.085, 0.08, 0.068, 0.05, 0.035];
    const hex = (p, T, r, ph) => {
      const B = new THREE.Vector3().crossVectors(T, X).normalize();
      const out = [];
      for (let k = 0; k < 6; k++) { const a = ph + (Math.PI * k) / 3; out.push(p.clone().addScaledVector(X, Math.cos(a) * r).addScaledVector(B, Math.sin(a) * r)); }
      return out;
    };
    for (let i = 0; i < N; i++) {
      const t0 = i / N, t1 = (i + 1) / N;
      const p0 = curve.getPoint(t0), p1 = curve.getPoint(t1);
      const T0 = curve.getTangent(t0), T1 = curve.getTangent(t1);
      const ph = i % 2 ? 0 : Math.PI / 6;
      const g = hull([...hex(p0, T0, rad[i] * 0.85, ph), ...hex(p0.clone().lerp(p1, 0.45), T0.clone().lerp(T1, 0.5).normalize(), rad[i] * 1.12, ph + Math.PI / 6),
        ...hex(p1, T1, rad[i + 1] * 0.8, ph)]);
      const sw = SW.tail, x0 = (sw.i % 8) * 128, y0 = Math.floor(sw.i / 8) * 128, tt = Math.min(1, i / (N - 1));
      const uv = [];
      for (let k = 0; k < g.attributes.position.count; k++) uv.push((x0 + 64) / 1024, (y0 + 16 + tt * 96) / 1024);
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      C.push(g);
    }
  }

  // ================= FLOATING DETAILS =================
  // floating orbit ring above the head (slightly tipped toward the viewer) carrying glowing stars
  {
    const hc = V(0, H.y + 0.297, H.z - 0.02), R = 0.17, n = 14;
    const tilt = new THREE.Quaternion().setFromAxisAngle(X, -0.2);
    const nrm = Y.clone().applyQuaternion(tilt);
    const at = (a, r = R) => V(Math.cos(a) * r, 0, Math.sin(a) * r).applyQuaternion(tilt).add(hc);
    for (let k = 0; k < n; k++) {
      const seg = [];
      for (const a of [(2 * Math.PI * k) / n, (2 * Math.PI * (k + 1)) / n]) {
        const p = at(a), rad = p.clone().sub(hc).normalize();
        for (const [dr, dn] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) seg.push(p.clone().addScaledVector(rad, dr * 0.02).addScaledVector(nrm, dn * 0.013));
      }
      C.push(paint(hull(seg), SW.orbit, 'y', [hc.y - 0.08, hc.y + 0.08]));
    }
    // stars standing on the ring: front centre, mirrored side pair, back centre
    thickStar(C, at(Math.PI / 2).addScaledVector(nrm, 0.022), Z, Y, 0.048);
    thickStar(C, at(-Math.PI / 2).addScaledVector(nrm, 0.022), Z.clone().negate(), Y, 0.04);
    const a2 = 0.6;
    thickStar(S, at(a2).addScaledVector(nrm, 0.022), V(Math.cos(a2), 0, Math.sin(a2)), Y, 0.042);
  }
  // nebula-glow tuft at the tail tip
  for (const [b, d, w, l] of [[V(0, 0.77, -0.31), V(0, 1, 0.25), 0.055, 0.11], [V(0, 0.76, -0.34), V(0, 0.6, -0.9), 0.045, 0.085]])
    C.push(paintProj(shard(b, d, w, l), SW.nebula, (x, y, z) => [(z + 0.4) / 0.2, (0.88 - y) / 0.14]));
  for (const [b, d] of [[V(0.02, 0.77, -0.3), V(0.7, 0.8, 0.2)], [V(0.02, 0.75, -0.33), V(0.6, 0.3, -0.7)]])
    S.push(paintProj(shard(b, d, 0.04, 0.075), SW.nebula, (x, y, z) => [(z + 0.4) / 0.2, (0.88 - y) / 0.14]));
  // glowing constellation dots on the flanks
  for (const [p, r] of [[V(0.187, 0.47, 0.11), 0.018], [V(0.19, 0.45, -0.07), 0.016], [V(0.172, 0.3, 0.08), 0.014], [V(0.18, 0.31, -0.04), 0.013]])
    S.push(paint(hull([p.clone().add(V(0.012, 0, 0)), p.clone().add(V(-0.03, 0, 0)), p.clone().add(V(0, r, 0)), p.clone().add(V(0, -r, 0)), p.clone().add(V(0, 0, r)), p.clone().add(V(0, 0, -r))]), SW.glowS, 'flat'));

  const g = assemble(C, S);
  g.scale(0.95, 0.95, 0.95);
  g.computeBoundingBox();
  return g;
}

// Knockout Kraken (Robux egg, Legends Egg): crimson kraken with gold armour rings on its tentacles,
// a gold crown, ornate gold collar armour, battle scars and glowing cyan runes. Stands on 8 tentacle tips.
import { V, THREE, hull, cbox, ring, plate, shard, tube, paint, assemble } from '../kit.js';

export const PALETTE = {
  red:    { i: 0, top: '#E0283C', bot: '#8E1020' },
  redD:   { i: 1, top: '#B81830', bot: '#660816' },
  sucker: { i: 2, top: '#FFC7AE', bot: '#F2967E' },
  gold:   { i: 3, top: '#FFE36E', bot: '#E39A12' },
  goldD:  { i: 4, top: '#F5C33B', bot: '#B9740B' },
  eye:    { i: 5, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 6, top: '#FFFFFF', bot: '#F1F1F4' },
  rune:   { i: 7, top: '#C8FDFF', bot: '#3FD8FF', glow: true },
  scar:   { i: 8, top: '#6E0A1A', bot: '#4A0610' },
  mouth:  { i: 9, top: '#4A1218', bot: '#2A080C' },
};
const P = PALETTE;

// ---------- local helpers ----------
function swUV(sw, t) {
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  return [(x + 64) / 1024, (y + 16 + THREE.MathUtils.clamp(t, 0, 1) * 96) / 1024];
}
// per-triangle swatch pick, gradient by world height in [lo, hi]
function paintTris(g, pick, lo, hi) {
  const p = g.attributes.position, uv = [];
  const a = V(0, 0, 0), b = V(0, 0, 0), c = V(0, 0, 0);
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    const cen = a.clone().add(b).add(c).divideScalar(3);
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const sw = pick(cen, n);
    for (const v of [a, b, c]) uv.push(...swUV(sw, 1 - (v.y - lo) / Math.max(1e-6, hi - lo)));
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}
// samples along an existing curve between t0..t1
function sub(curve, t0, t1, n, rf) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = t0 + (t1 - t0) * (i / (n - 1));
    const r = rf(t, i);
    out.push({ p: curve.getPoint(t), rx: r, ry: r * 0.92 });
  }
  return out;
}
// thin raised bar from a to b lying on a surface with outward normal n
function bar(a, b, n, w, dOut = 0.012, dIn = 0.03) {
  const d = b.clone().sub(a).normalize();
  const s = new THREE.Vector3().crossVectors(d, n).normalize().multiplyScalar(w);
  const pts = [];
  for (const e of [a, b]) for (const sg of [-1, 1]) for (const k of [dOut, -dIn])
    pts.push(e.clone().addScaledVector(s, sg).addScaledVector(n, k));
  return hull(pts);
}

// mantle cross-section levels: [y, rx, rz, zOff]
const M = [
  [0.27, 0.15, 0.14, 0.0],
  [0.34, 0.235, 0.22, 0.0],
  [0.47, 0.29, 0.255, -0.01],
  [0.62, 0.285, 0.25, -0.03],
  [0.76, 0.24, 0.215, -0.055],
  [0.87, 0.17, 0.15, -0.075],
  [0.965, 0.1, 0.09, -0.085],
];
// approx point on the mantle surface at height y, angle phi (0 = +z front, +pi/2 = +x)
function mantlePt(y, phi, k = 0.965) {
  let i = 0;
  while (i < M.length - 2 && M[i + 1][0] < y) i++;
  const [y0, ax0, az0, o0] = M[i], [y1, ax1, az1, o1] = M[i + 1];
  const t = THREE.MathUtils.clamp((y - y0) / (y1 - y0), 0, 1);
  const rx = ax0 + (ax1 - ax0) * t, rz = az0 + (az1 - az0) * t, o = o0 + (o1 - o0) * t;
  return V(Math.sin(phi) * rx * k, y, o + Math.cos(phi) * rz * k);
}
function mantleN(y, phi) { return V(Math.sin(phi), 0.25, Math.cos(phi)).normalize(); }

export function buildGeometry() {
  const C = [], S = [];
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= MANTLE / HEAD (big faceted dome, flat-ish face front) =================
  const FZ = 0.272; // face plane
  const mpts = [];
  for (const [y, rx, rz, o] of M) mpts.push(...ring(V(0, y, o), rx, rz, 10, 'y', Math.PI / 10));
  // flat face panel
  for (const [x, y] of [[0.17, 0.4], [0.2, 0.52], [0.18, 0.63], [0.1, 0.69]]) {
    mpts.push(V(x, y, FZ), V(-x, y, FZ));
  }
  mpts.push(V(0, 0.7, FZ - 0.005), V(0, 0.39, FZ - 0.005));
  mpts.push(V(0, 1.06, -0.15), V(0.05, 1.0, -0.12), V(-0.05, 1.0, -0.12));
  C.push(paint(hull(mpts), P.red, 'y', [0.3, 0.95]));

  // ================= FACE =================
  const E = V(0.105, 0.53, 0);
  const es = 1.55;
  const sc = (arr) => arr.map(([u, v]) => [u * es, v * es]);
  S.push(flat(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.02, FZ + 0.012)), P.white));
  S.push(flat(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.008, E.y - 0.002, 0), FZ + 0.006, FZ + 0.019)), P.eye));
  S.push(flat(hull(plate([[-0.009, -0.009], [0.009, -0.009], [0.009, 0.009], [-0.009, 0.009]],
    V(E.x + 0.006, E.y + 0.004, 0), FZ + 0.015, FZ + 0.023)), P.white));
  // heavy brow slanting down to the centre
  S.push(paint(hull([
    V(0.026, E.y + 0.004, FZ + 0.062), V(0.028, E.y + 0.07, FZ + 0.05),
    V(0.19, E.y + 0.072, FZ + 0.004), V(0.19, E.y + 0.138, FZ - 0.012),
    V(0.026, E.y + 0.004, FZ - 0.03), V(0.028, E.y + 0.08, FZ - 0.04),
    V(0.19, E.y + 0.072, FZ - 0.07), V(0.19, E.y + 0.142, FZ - 0.08),
  ]), P.redD, 'y'));
  // determined frown mouth
  C.push(flat(hull(cbox(V(0, 0.425, FZ + 0.004), 0.03, 0.008, 0.012, 0.003)), P.mouth));
  S.push(flat(hull([V(0.02, 0.417, FZ - 0.008), V(0.02, 0.433, FZ - 0.008), V(0.02, 0.417, FZ + 0.016), V(0.02, 0.433, FZ + 0.016),
    V(0.06, 0.403, FZ - 0.01), V(0.06, 0.415, FZ - 0.01), V(0.06, 0.403, FZ + 0.012), V(0.06, 0.415, FZ + 0.012)]), P.mouth));

  // ---- surface sampling on the mantle hull (raycast toward the axis) ----
  const mantleMesh = new THREE.Mesh(C[0], new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  mantleMesh.updateMatrixWorld();
  const rc = new THREE.Raycaster();
  const surf = (y, phi) => {
    const o = V(Math.sin(phi) * 1.5, y, -0.04 + Math.cos(phi) * 1.5);
    rc.set(o, V(0, y, -0.04).sub(o).normalize());
    const h = rc.intersectObject(mantleMesh, false)[0];
    const n = h.face.normal.clone();
    return { p: h.point.clone(), n };
  };
  // stroke between two surface coords, split into pieces so it hugs the curve
  const stroke = (arr, sw, a, b, w, pieces = 2, out = 0.011) => {
    for (let k = 0; k < pieces; k++) {
      const lerp = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      const s0 = surf(...lerp(k / pieces)), s1 = surf(...lerp((k + 1) / pieces));
      const n = s0.n.clone().add(s1.n).normalize();
      arr.push(flat(bar(s0.p, s1.p, n, w, out, 0.035), sw));
    }
  };

  // ================= BATTLE SCARS (pale slashes with stitches on the upper mantle) =================
  // tapered slash hugging the surface (pieces, width ~ sin), nearly flush
  const slash = (a, b, w, pieces = 5, out = 0.005) => {
    const L = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    for (let k = 0; k < pieces; k++) {
      const t0 = k / pieces, t1 = (k + 1) / pieces;
      const s0 = surf(...L(t0)), s1 = surf(...L(t1));
      const n = s0.n.clone().add(s1.n).normalize();
      const d = s1.p.clone().sub(s0.p).normalize();
      const sd = new THREE.Vector3().crossVectors(d, n).normalize();
      const pts = [];
      for (const [pp, t] of [[s0.p, t0], [s1.p, t1]]) {
        const ww = w * (0.15 + 0.85 * Math.sin(Math.PI * t));
        for (const sg of [-1, 1]) for (const kk of [out, -0.03]) pts.push(pp.clone().addScaledVector(sd, sg * ww).addScaledVector(n, kk));
      }
      S.push(flat(hull(pts), P.scar));
    }
  };
  for (const off of [-0.045, 0, 0.045]) slash([0.84 + off, 0.5], [0.66 + off, 1.0], 0.011);

  // ================= GLOWING RUNES on the mantle =================
  const rune = (y, phi, h) => {
    stroke(S, P.rune, [y - h, phi], [y + h, phi], 0.01, 2);
    stroke(S, P.rune, [y + h * 0.3, phi], [y + h * 0.9, phi + 0.2], 0.009, 1);
    stroke(S, P.rune, [y - h * 0.2, phi], [y + h * 0.4, phi - 0.2], 0.009, 1);
  };
  rune(0.53, 1.6, 0.075);
  rune(0.5, 2.55, 0.065);
  // forehead rune: vertical stroke through a diamond
  stroke(C, P.rune, [0.67, 0], [0.81, 0], 0.011, 2);
  stroke(S, P.rune, [0.785, 0.0], [0.74, 0.2], 0.009, 1);
  stroke(S, P.rune, [0.74, 0.2], [0.695, 0.0], 0.009, 1);
  // centre-back rune
  stroke(C, P.rune, [0.5, Math.PI], [0.7, Math.PI], 0.011, 2);
  stroke(S, P.rune, [0.67, Math.PI - 0.0], [0.6, Math.PI - 0.22], 0.009, 1);
  stroke(S, P.rune, [0.6, Math.PI - 0.22], [0.53, Math.PI], 0.009, 1);


  // ================= FIN FLAPS (upper back sides) =================
  {
    // compact faceted fin hugging the upper back: thick root, thinner trailing edge, swept back
    const fn = V(0.97, 0.0, 0.25).normalize();
    const pts = [];
    for (const [p, th] of [[V(0.175, 0.58, -0.15), 0.02], [V(0.15, 0.79, -0.19), 0.02], [V(0.2, 0.77, -0.3), 0.012],
      [V(0.235, 0.71, -0.36), 0.008], [V(0.225, 0.62, -0.3), 0.012], [V(0.205, 0.68, -0.25), 0.02]])
      pts.push(p.clone().addScaledVector(fn, th), p.clone().addScaledVector(fn, -th));
    S.push(paint(hull(pts), P.red, 'y', [0.55, 0.85]));
    S.push(paint(shard(V(0.215, 0.74, -0.31), V(0.25, 0.25, -1), 0.022, 0.05, 4, 0.55), P.redD, 'y', [0.68, 0.82]));
    S.push(paint(shard(V(0.22, 0.65, -0.3), V(0.3, -0.35, -0.9), 0.02, 0.045, 4, 0.55), P.redD, 'y', [0.58, 0.72]));
  }

  // ================= GOLD COLLAR ARMOUR (where the tentacles meet the mantle) =================
  C.push(paint(hull([...ring(V(0, 0.25, 0), 0.2, 0.19, 12, 'y', Math.PI / 12),
    ...ring(V(0, 0.3, 0), 0.275, 0.26, 12, 'y', Math.PI / 12),
    ...ring(V(0, 0.37, 0), 0.285, 0.265, 12, 'y', Math.PI / 12),
    ...ring(V(0, 0.4, 0), 0.26, 0.24, 12, 'y', Math.PI / 12)]), P.gold, 'y', [0.24, 0.4]));
  // ornate scalloped plates hanging off the collar + rune gems
  for (const phi of [0.0, 0.52, 1.05, 1.57, 2.1, 2.62, 3.14]) {
    const d = V(Math.sin(phi), 0, Math.cos(phi));
    const base = V(d.x * 0.27, 0.31, d.z * 0.252);
    const g = shard(base, V(d.x * 0.6, -1, d.z * 0.6), 0.04, 0.085, 4, 0.5);
    const gem = hull([...ring(V(0, 0, 0), 0.018, 0.018, 4, 'z', Math.PI / 4).map(p => p),
      V(0, 0, 0.012), V(0, 0, -0.01)]);
    gem.applyMatrix4(new THREE.Matrix4().makeRotationY(phi));
    gem.translate(d.x * 0.283, 0.345, d.z * 0.263);
    const target = (phi === 0 || phi === 3.14) ? C : S;
    target.push(paint(g, P.goldD, 'y', [0.24, 0.34]));
    target.push(flat(gem, P.rune));
  }

  // ================= TENTACLES (4 per side, arched, tips planted) =================
  const tR = (t) => 0.036 + 0.072 * Math.pow(1 - t, 1.15);
  const tentacle = (theta, reach = 1) => {
    const d = V(Math.sin(theta), 0, Math.cos(theta)), s = V(Math.cos(theta), 0, -Math.sin(theta));
    const Pp = (r, y, sw) => d.clone().multiplyScalar(r * reach).addScaledVector(s, sw).add(V(0, y, 0));
    const curve = new THREE.CatmullRomCurve3([
      Pp(0.07, 0.37, 0), Pp(0.2, 0.32, 0), Pp(0.31, 0.21, 0.012), Pp(0.38, 0.1, 0.03),
      Pp(0.44, 0.045, 0.045), Pp(0.51, 0.045, 0.06), Pp(0.565, 0.08, 0.07), Pp(0.585, 0.125, 0.075), Pp(0.56, 0.155, 0.078),
    ], false, 'centripetal');
    const N = 13;
    const smp = sub(curve, 0, 1, N, (t) => tR(t));
    const g = tube(smp, { seg: 7, axis: s, phase: Math.PI / 7, capEnd: 0.022 });
    const Ts = smp.map((q, i) => smp[Math.min(i + 1, N - 1)].p.clone().sub(smp[Math.max(i - 1, 0)].p).normalize());
    S.push(paintTris(g, (c, n) => {
      let bi = 0, bd = 1e9;
      smp.forEach((q, i) => { const dd = q.p.distanceToSquared(c); if (dd < bd) { bd = dd; bi = i; } });
      const down = new THREE.Vector3().crossVectors(s, Ts[bi]).normalize();
      return n.dot(down) > 0.45 ? P.sucker : P.red;
    }, 0.0, 0.4));
    // gold armour rings
    for (const [t0, t1] of [[0.2, 0.28], [0.38, 0.45]]) {
      const band = tube(sub(curve, t0, t1, 3, (t, i) => tR(t) * (i === 1 ? 1.27 : 1.15)), { seg: 7, axis: s, phase: Math.PI / 7 });
      S.push(paint(band, P.gold, 'y'));
      const tm = (t0 + t1) / 2, pc = curve.getPoint(tm), tg = curve.getTangent(tm);
      const up = new THREE.Vector3().crossVectors(tg, s).normalize();
      if (up.y < 0) up.negate();
      S.push(flat(shard(pc.clone().addScaledVector(up, tR(tm) * 1.2), up, 0.016, 0.022, 4), P.rune));
    }
    // sucker pads on the outside of the curl
    for (const t of [0.66, 0.77, 0.88]) {
      const pc = curve.getPoint(t), tg = curve.getTangent(t);
      const down = new THREE.Vector3().crossVectors(s, tg).normalize();
      const r = tR(t), pr = 0.026 - (t - 0.7) * 0.04;
      const cpos = pc.clone().addScaledVector(down, r * 0.86);
      const pts = [];
      for (let k = 0; k < 6; k++) {
        const an = (2 * Math.PI * k) / 6;
        const off = s.clone().multiplyScalar(Math.cos(an) * pr).addScaledVector(tg, Math.sin(an) * pr);
        pts.push(cpos.clone().add(off).addScaledVector(down, 0.006 + 0.004 * Math.abs(Math.cos(an))), cpos.clone().add(off).addScaledVector(down, -0.02));
      }
      S.push(paint(hull(pts), P.sucker, 'flat'));
    }
  };
  for (const th of [0.48, 1.2, 1.95, 2.7]) tentacle(th);

  // ================= GOLD CROWN =================
  const CY = 0.84;
  C.push(paint(hull([...ring(V(0, CY, -0.075), 0.185, 0.165, 12, 'y', Math.PI / 12),
    ...ring(V(0, CY + 0.075, -0.08), 0.2, 0.18, 12, 'y', Math.PI / 12)]), P.gold, 'y', [CY, CY + 0.08]));
  // rim band
  C.push(paint(hull([...ring(V(0, CY + 0.005, -0.075), 0.198, 0.177, 12, 'y', Math.PI / 12),
    ...ring(V(0, CY + 0.03, -0.075), 0.205, 0.184, 12, 'y', Math.PI / 12)]), P.goldD, 'y', [CY, CY + 0.03]));
  const spike = (phi, h, w) => {
    const d = V(Math.sin(phi), 0, Math.cos(phi));
    const b = V(d.x * 0.17, CY + 0.07, -0.08 + d.z * 0.155);
    return paint(shard(b, V(d.x * 0.25, 1, d.z * 0.25), w, h, 4, 0.55), P.gold, 'y', [CY, CY + 0.07 + h]);
  };
  C.push(spike(0, 0.115, 0.06));
  C.push(spike(Math.PI, 0.09, 0.05));
  for (const [phi, h] of [[0.8, 0.1], [1.6, 0.105], [2.4, 0.09]]) S.push(spike(phi, h, 0.05));
  // side gems on the crown band
  for (const phi of [0.8, 1.6]) {
    const gem = hull([V(0, 0.022, 0), V(0.018, 0, 0), V(-0.018, 0, 0), V(0, -0.022, 0), V(0, 0, 0.012), V(0, 0, -0.01)]);
    gem.applyMatrix4(new THREE.Matrix4().makeRotationY(phi));
    gem.translate(Math.sin(phi) * 0.198, CY + 0.045, -0.08 + Math.cos(phi) * 0.178);
    S.push(flat(gem, P.rune));
  }
  // front crown gem
  C.push(flat(hull([V(0, CY + 0.075, 0.098), V(0.028, CY + 0.045, 0.092), V(-0.028, CY + 0.045, 0.092), V(0, CY + 0.015, 0.088),
    V(0, CY + 0.045, 0.115), V(0, CY + 0.045, 0.07)]), P.rune));

  return assemble(C, S);
}

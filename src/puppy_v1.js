// Procedural low-poly puppy. Faces +Z, Y up, symmetric across X=0, feet at Y=0.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- Texture atlas (1024², 8x8 swatches of 128px) ----------
const SW = {
  tan:     { i: 0, top: '#E2A865', bot: '#B87A3E' },
  cream:   { i: 1, top: '#FFF6E2', bot: '#E9D0A6' },
  ear:     { i: 2, top: '#6E3F20', bot: '#40220F' },
  nose:    { i: 3, top: '#3A2A22', bot: '#140C08' },
  eye:     { i: 4, top: '#2A1408', bot: '#120804' },
  white:   { i: 5, top: '#FFFFFF', bot: '#F2F2F2' },
  muzzle:  { i: 6, top: '#F2D2A0', bot: '#D9AE76' },
  tail:    { i: 7, top: '#C88A4A', bot: '#FFF3DC' }, // along length: tan -> cream tip
  brow:    { i: 8, top: '#9B5E2E', bot: '#7A4520' },
  paw:     { i: 9, top: '#D9A061', bot: '#A86E37' },
  iris:    { i: 10, top: '#B5651D', bot: '#7A3E10' },
};

export function makeAtlas() {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 1024, 1024);
  for (const s of Object.values(SW)) {
    const x = (s.i % 8) * 128, y = Math.floor(s.i / 8) * 128;
    const grad = g.createLinearGradient(0, y + 16, 0, y + 112);
    grad.addColorStop(0, s.top);
    grad.addColorStop(1, s.bot);
    g.fillStyle = s.top; g.fillRect(x, y, 128, 16);
    g.fillStyle = grad; g.fillRect(x, y + 16, 128, 96);
    g.fillStyle = s.bot; g.fillRect(x, y + 112, 128, 16);
  }
  return c;
}

// uv for a swatch; t in [0,1] (0 = top/light colour)
function swUV(sw, t, u = 0.5) {
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  return [(x + 24 + u * 80) / 1024, (y + 16 + THREE.MathUtils.clamp(t, 0, 1) * 96) / 1024];
}

// ---------- geometry helpers ----------
function finish(pos, tArr) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.userData.t = tArr;
  g.computeVertexNormals(); // non-indexed => flat facets
  return g;
}

function pushTri(out, tOut, a, b, c, ta, tb, tc, outward) {
  const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
  if (outward && n.dot(outward) < 0) { [b, c] = [c, b]; [tb, tc] = [tc, tb]; }
  out.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  tOut.push(ta, tb, tc);
}

/**
 * Loft a tube through samples [{p, rx, ry}] with `seg` sides.
 * B axis = ref projected off the tangent (ry), A = T x B (rx).
 * opts: capStart/capEnd bulge distance (0 = flat cap), twist(i) extra angle, scale(i,k)
 */
function tube(samples, { seg = 12, ref = V(0, 1, 0), axis = null, capStart = 0, capEnd = 0, phase = 0, twist = null, scale = null } = {}) {
  const n = samples.length;
  const rings = [], centers = [];
  for (let i = 0; i < n; i++) {
    const p = samples[i].p;
    const T = new THREE.Vector3().subVectors(samples[Math.min(i + 1, n - 1)].p, samples[Math.max(i - 1, 0)].p).normalize();
    let B = axis ? new THREE.Vector3().crossVectors(T, axis) : ref.clone().addScaledVector(T, -ref.dot(T));
    B.normalize();
    const A = new THREE.Vector3().crossVectors(T, B).normalize();
    const ring = [];
    const tw = twist ? twist(i) : 0;
    for (let k = 0; k < seg; k++) {
      const th = phase + tw + (2 * Math.PI * k) / seg;
      const s = scale ? scale(i, k) : 1;
      ring.push(p.clone()
        .addScaledVector(A, Math.cos(th) * samples[i].rx * s)
        .addScaledVector(B, Math.sin(th) * samples[i].ry * s));
    }
    rings.push(ring);
    centers.push({ p, T });
  }
  const pos = [], tv = [];
  const tOf = (i) => i / (n - 1);
  for (let i = 0; i < n - 1; i++) {
    const axis = centers[i].p.clone().add(centers[i + 1].p).multiplyScalar(0.5);
    for (let k = 0; k < seg; k++) {
      const a = rings[i][k], b = rings[i][(k + 1) % seg], c = rings[i + 1][k], d = rings[i + 1][(k + 1) % seg];
      const out1 = a.clone().add(b).add(c).divideScalar(3).sub(axis);
      pushTri(pos, tv, a, b, c, tOf(i), tOf(i), tOf(i + 1), out1);
      const out2 = b.clone().add(d).add(c).divideScalar(3).sub(axis);
      pushTri(pos, tv, b, d, c, tOf(i), tOf(i + 1), tOf(i + 1), out2);
    }
  }
  const cap = (i, bulge, dirSign) => {
    const { p, T } = centers[i];
    const tip = p.clone().addScaledVector(T, bulge * dirSign);
    const out = T.clone().multiplyScalar(dirSign);
    for (let k = 0; k < seg; k++) {
      pushTri(pos, tv, rings[i][k], rings[i][(k + 1) % seg], tip, tOf(i), tOf(i), tOf(i), out);
    }
  };
  cap(0, capStart, -1);
  cap(n - 1, capEnd, 1);
  return finish(pos, tv);
}

// samples along a CatmullRom curve with radius functions of t
function curveSamples(points, n, rxf, ryf) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    out.push({ p: curve.getPoint(t), rx: rxf(t), ry: ryf ? ryf(t) : rxf(t) });
  }
  return out;
}

// deterministic, mirror-safe hash jitter
function hash3(x, y, z) {
  const s = Math.sin(Math.abs(x) * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

function blob(detail, center, sc, { jitter = 0, flatBottom = null, rot = null } = {}) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (jitter) {
      const r = 1 + (hash3(x.toFixed(3), y.toFixed(3), z.toFixed(3)) - 0.5) * jitter;
      x *= r; y *= r; z *= r;
    }
    p.setXYZ(i, x * sc.x, y * sc.y, z * sc.z);
  }
  if (rot) g.applyQuaternion(rot);
  g.translate(center.x, center.y, center.z);
  if (flatBottom !== null) {
    for (let i = 0; i < p.count; i++) if (p.getY(i) < flatBottom) p.setY(i, flatBottom);
  }
  const ng = g.index ? g.toNonIndexed() : g;
  ng.deleteAttribute('normal'); ng.deleteAttribute('uv');
  ng.computeVertexNormals();
  return ng;
}

function spike(base, dir, radius, length, sides = 4) {
  const g = new THREE.ConeGeometry(radius, length, sides, 1, false).toNonIndexed();
  g.translate(0, length / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir.clone().normalize()));
  g.translate(base.x, base.y, base.z);
  g.deleteAttribute('normal'); g.deleteAttribute('uv');
  g.computeVertexNormals();
  return g;
}

// colour by world height (mode 'y') or by tube length param (mode 'len')
function paint(g, sw, mode = 'y', range = null) {
  const p = g.attributes.position;
  g.computeBoundingBox();
  const lo = range ? range[0] : g.boundingBox.min.y, hi = range ? range[1] : g.boundingBox.max.y;
  const uv = [];
  for (let i = 0; i < p.count; i++) {
    let t;
    if (mode === 'len') t = g.userData.t[i];
    else if (mode === 'flat') t = 0.3;
    else t = 1 - (p.getY(i) - lo) / Math.max(1e-6, hi - lo);
    uv.push(...swUV(sw, t));
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}

function mirrorX(g) {
  const m = g.clone();
  const p = m.attributes.position, uv = m.attributes.uv;
  for (let i = 0; i < p.count; i++) p.setX(i, -p.getX(i));
  for (let i = 0; i < p.count; i += 3) { // fix winding
    for (const a of [p, uv]) {
      const tmp = [];
      for (let c = 0; c < a.itemSize; c++) tmp.push(a.getComponent(i + 1, c));
      for (let c = 0; c < a.itemSize; c++) a.setComponent(i + 1, c, a.getComponent(i + 2, c));
      for (let c = 0; c < a.itemSize; c++) a.setComponent(i + 2, c, tmp[c]);
    }
  }
  m.computeVertexNormals();
  return m;
}

// ---------- the puppy ----------
export function buildPuppyGeometry() {
  const center = [], side = [];          // body parts
  const headC = [], headS = [];          // head parts (transformed as a group)
  const smooth = (t) => Math.sin(Math.PI * t);
  const X = V(1, 0, 0), Z = V(0, 0, 1);

  // ===== Body =====
  center.push(paint(tube(
    Array.from({ length: 15 }, (_, i) => {
      const t = i / 14, s = Math.pow(smooth(0.06 + t * 0.88), 0.42);
      return { p: V(0, 0.41 + 0.05 * t, -0.27 + t * 0.48), rx: 0.172 * s, ry: 0.172 * s };
    }), { seg: 22, capStart: 0.05, capEnd: 0.04 }), SW.tan, 'y', [0.24, 0.62]));

  // Neck
  center.push(paint(tube(curveSamples([V(0, 0.48, 0.12), V(0, 0.6, 0.2), V(0, 0.73, 0.27)], 5,
    (t) => 0.13 - 0.012 * t), { seg: 16, axis: X }), SW.tan, 'y', [0.35, 0.9]));

  // Chest ruff: lumpy base + soft wide tufts
  center.push(paint(blob(1, V(0, 0.5, 0.235), V(0.15, 0.16, 0.11), { jitter: 0.2 }), SW.cream, 'y', [0.32, 0.68]));
  const tuft = (b, d, r, l) => paint(spike(b, d, r * 1.12, l * 0.78, 6), SW.cream, 'flat');
  center.push(tuft(V(0, 0.4, 0.27), V(0, -1, 0.7), 0.06, 0.08));
  center.push(tuft(V(0, 0.52, 0.32), V(0, -0.5, 1), 0.06, 0.06));
  center.push(tuft(V(0, 0.62, 0.3), V(0, 0, 1), 0.055, 0.05));
  for (const [b, d, r, l] of [
    [V(0.07, 0.39, 0.26), V(0.3, -1, 0.6), 0.055, 0.075],
    [V(0.115, 0.42, 0.23), V(0.5, -1, 0.5), 0.055, 0.07],
    [V(0.065, 0.5, 0.31), V(0.4, -0.6, 1), 0.055, 0.06],
    [V(0.125, 0.54, 0.26), V(0.7, -0.5, 0.8), 0.055, 0.06],
    [V(0.07, 0.6, 0.3), V(0.5, -0.1, 1), 0.05, 0.05],
    [V(0.115, 0.63, 0.25), V(0.7, -0.1, 0.8), 0.05, 0.05],
  ]) side.push(tuft(b, d, r, l));

  // Tail: fluffy curl over the back, tan -> cream tip
  center.push(paint(tube(curveSamples(
    [V(0, 0.47, -0.27), V(0, 0.59, -0.38), V(0, 0.73, -0.41), V(0, 0.84, -0.35), V(0, 0.85, -0.26), V(0, 0.78, -0.22), V(0, 0.73, -0.26)],
    20, (t) => (0.052 + 0.034 * Math.sin(Math.PI * Math.min(1, t * 1.3))) * (t > 0.85 ? 1 - (t - 0.85) * 3 : 1)),
    { seg: 12, axis: X, capEnd: 0.035, twist: (i) => (i % 2) * Math.PI / 12, scale: (i) => (i % 2 ? 1.15 : 1.0) }),
    SW.tail, 'len'));

  // Front leg + paw (sturdy, slightly splayed)
  side.push(paint(tube(curveSamples([V(0.105, 0.42, 0.14), V(0.135, 0.25, 0.16), V(0.152, 0.1, 0.172), V(0.158, 0.045, 0.176)], 10,
    (t) => 0.094 - 0.026 * t), { seg: 14, axis: X }), SW.tan, 'y', [0.0, 0.55]));
  side.push(paint(blob(1, V(0.158, 0.042, 0.2), V(0.08, 0.052, 0.094), { flatBottom: 0 }), SW.paw, 'y'));

  // Back leg: thigh + stifle -> hock -> paw
  side.push(paint(blob(1, V(0.12, 0.37, -0.165), V(0.092, 0.135, 0.13), { jitter: 0.05 }), SW.tan, 'y', [0.0, 0.55]));
  side.push(paint(tube(curveSamples([V(0.13, 0.38, -0.17), V(0.148, 0.24, -0.12), V(0.158, 0.13, -0.195), V(0.163, 0.045, -0.188)], 10,
    (t) => 0.09 - 0.026 * t), { seg: 14, axis: X }), SW.tan, 'y', [0.0, 0.55]));
  side.push(paint(blob(1, V(0.163, 0.042, -0.16), V(0.078, 0.052, 0.09), { flatBottom: 0 }), SW.paw, 'y'));

  // ===== Head (modelled around (0, 0.875, 0.36), then scaled into place) =====
  headC.push(paint(tube(
    Array.from({ length: 13 }, (_, i) => {
      const t = i / 12, s = Math.pow(smooth(0.05 + t * 0.9), 0.5);
      return { p: V(0, 0.875 + 0.01 * t, 0.2 + t * 0.32), rx: 0.172 * s, ry: 0.158 * s };
    }), { seg: 22, capStart: 0.03, capEnd: 0.02 }), SW.tan, 'y', [0.7, 1.05]));

  // Short puppy muzzle
  headC.push(paint(tube(
    Array.from({ length: 6 }, (_, i) => {
      const t = i / 5;
      return { p: V(0, 0.82 - 0.03 * t, 0.45 + t * 0.15), rx: 0.102 - 0.022 * t, ry: 0.08 - 0.016 * t };
    }), { seg: 16, capEnd: 0.028 }), SW.muzzle, 'y', [0.72, 0.9]));
  headC.push(paint(blob(1, V(0, 0.752, 0.52), V(0.064, 0.035, 0.07)), SW.cream, 'y'));
  headC.push(paint(blob(1, V(0, 0.812, 0.618), V(0.044, 0.031, 0.03)), SW.nose, 'y'));

  // Cheek fluff
  headS.push(paint(spike(V(0.14, 0.81, 0.36), V(1, -0.6, -0.2), 0.035, 0.055, 5), SW.tan, 'flat'));

  // Fierce eyes: amber rim, dark pupil, catchlight
  const eyeRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.05, 0.42, -0.25));
  headS.push(paint(blob(1, V(0.078, 0.905, 0.498), V(0.036, 0.031, 0.02), { rot: eyeRot }), SW.iris, 'flat'));
  headS.push(paint(blob(1, V(0.081, 0.903, 0.506), V(0.026, 0.024, 0.016), { rot: eyeRot }), SW.eye, 'flat'));
  headS.push(paint(blob(0, V(0.074, 0.913, 0.52), V(0.008, 0.008, 0.005)), SW.white, 'flat'));

  // Thick brow, slanting down toward the centre
  headS.push(paint(tube(curveSamples([V(0.035, 0.93, 0.515), V(0.085, 0.95, 0.498), V(0.13, 0.96, 0.455)], 4,
    (t) => 0.026 - 0.006 * t, (t) => 0.018 - 0.004 * t),
    { seg: 6, ref: V(0, 1, 0.3), capStart: 0.012, capEnd: 0.01 }), SW.brow, 'flat'));

  // Big floppy ear hugging the side of the head (wide axis ~Z, thin axis = sheet normal)
  headS.push(paint(tube(curveSamples(
    [V(0.08, 1.0, 0.33), V(0.155, 1.0, 0.338), V(0.192, 0.91, 0.345), V(0.198, 0.77, 0.36), V(0.185, 0.665, 0.375)],
    12, (t) => 0.06 + 0.042 * Math.sin(Math.PI * Math.min(1, t * 1.1)), (t) => 0.026 - 0.008 * t),
    { seg: 10, axis: V(0.45, 0, 1), capStart: 0.01, capEnd: 0.045 }), SW.ear, 'len'));

  const headXf = new THREE.Matrix4()
    .makeTranslation(0, 0.8, 0.31)
    .multiply(new THREE.Matrix4().makeScale(1.12, 1.12, 1.12))
    .multiply(new THREE.Matrix4().makeTranslation(0, -0.875, -0.36));
  for (const g of [...headC, ...headS]) g.applyMatrix4(headXf);
  center.push(...headC); side.push(...headS);

  const parts = [...center];
  for (const g of side) { parts.push(g); parts.push(mirrorX(g)); }
  for (const g of parts) for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
  const merged = mergeGeometries(parts, false);
  merged.computeBoundingBox();
  merged.translate(0, -merged.boundingBox.min.y, 0);
  merged.computeBoundingBox();
  return merged;
}

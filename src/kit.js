// Faceted low-poly creature kit. Faces +Z, Y up, symmetric across X=0, feet at Y=0.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- Texture atlas (1024², 8x8 swatches of 128px) ----------
export const SW = {
  tan:     { i: 0, top: '#EFA453', bot: '#C06F2A' },
  cream:   { i: 1, top: '#FFF1D2', bot: '#E8C995' },
  ear:     { i: 2, top: '#9A532A', bot: '#5E2C14' },
  nose:    { i: 3, top: '#3A3438', bot: '#141114' },
  eye:     { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white:   { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  muzzle:  { i: 6, top: '#FBE6BD', bot: '#E4C08A' },
  tail:    { i: 7, top: '#D98536', bot: '#FFF0CF' },
  brow:    { i: 8, top: '#E39444', bot: '#B5672A' },
  paw:     { i: 9, top: '#FCEBC6', bot: '#DDB57C' },
  mouth:   { i: 10, top: '#5A2E1A', bot: '#3E1E10' },
};

// glowOnly: build the emissive map (black except swatches flagged `glow: true`)
export function makeAtlas(pal = SW, glowOnly = false) {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const g = c.getContext('2d');
  g.fillStyle = glowOnly ? '#000000' : '#ffffff';
  g.fillRect(0, 0, 1024, 1024);
  for (const s of Object.values(pal)) {
    if (glowOnly && !s.glow) continue;
    if (s.draw) { s.draw(g, (s.i % 8) * 128, Math.floor(s.i / 8) * 128); continue; }
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
export function tube(samples, { seg = 12, ref = V(0, 1, 0), axis = null, capStart = 0, capEnd = 0, phase = 0, twist = null, scale = null } = {}) {
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
export function curveSamples(points, n, rxf, ryf) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    out.push({ p: curve.getPoint(t), rx: rxf(t), ry: ryf ? ryf(t) : rxf(t) });
  }
  return out;
}

// deterministic, mirror-safe hash jitter
export function hash3(x, y, z) {
  const s = Math.sin(Math.abs(x) * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

export function blob(detail, center, sc, { jitter = 0, flatBottom = null, rot = null } = {}) {
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

export function spike(base, dir, radius, length, sides = 4) {
  const g = new THREE.ConeGeometry(radius, length, sides, 1, false).toNonIndexed();
  g.translate(0, length / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir.clone().normalize()));
  g.translate(base.x, base.y, base.z);
  g.deleteAttribute('normal'); g.deleteAttribute('uv');
  g.computeVertexNormals();
  return g;
}

// colour by world height (mode 'y') or by tube length param (mode 'len')
export function paint(g, sw, mode = 'y', range = null) {
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

export function mirrorX(g) {
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

// ---- convex-hull primitives: the core of the chunky faceted look ----
export function hull(points) {
  const g = new ConvexGeometry(points);
  const ng = g.index ? g.toNonIndexed() : g;
  ng.deleteAttribute('normal'); if (ng.attributes.uv) ng.deleteAttribute('uv');
  ng.computeVertexNormals();
  return ng;
}
// box with chamfered corners (c = chamfer size)
export function cbox(c0, hx, hy, hz, c = 0.02) {
  const pts = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    pts.push(V(c0.x + sx * (hx - c), c0.y + sy * hy, c0.z + sz * (hz - c)));
    pts.push(V(c0.x + sx * hx, c0.y + sy * (hy - c), c0.z + sz * (hz - c)));
    pts.push(V(c0.x + sx * (hx - c), c0.y + sy * (hy - c), c0.z + sz * hz));
  }
  return pts;
}
// n-gon ring in the plane perpendicular to `axis` ('x' | 'y' | 'z')
export function ring(c0, rA, rB, n, axis = 'y', phase = Math.PI / 8) {
  const pts = [];
  for (let k = 0; k < n; k++) {
    const a = phase + (2 * Math.PI * k) / n, u = Math.cos(a) * rA, v = Math.sin(a) * rB;
    if (axis === 'y') pts.push(V(c0.x + u, c0.y, c0.z + v));
    else if (axis === 'z') pts.push(V(c0.x + u, c0.y + v, c0.z));
    else pts.push(V(c0.x, c0.y + v, c0.z + u));
  }
  return pts;
}
// convex 2D polygon (u = +x, v = +y) extruded along z between z0 and z1
export function plate(pts2d, c0, z0, z1, tiltY = 0) {
  const pts = [];
  for (const [u, v] of pts2d) for (const z of [z0, z1]) pts.push(V(c0.x + u, c0.y + v, z - tiltY * u));
  return pts;
}
// pyramid shard: base square of half-width w, pointing along dir
export function shard(base, dir, w, len, sides = 4, flat = 1) {
  const d = dir.clone().normalize();
  const up = Math.abs(d.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
  const a = new THREE.Vector3().crossVectors(d, up).normalize();
  const b = new THREE.Vector3().crossVectors(a, d).normalize();
  const pts = [base.clone().addScaledVector(d, len)];
  for (let k = 0; k < sides; k++) {
    const t = (2 * Math.PI * k) / sides + Math.PI / sides;
    pts.push(base.clone().addScaledVector(a, Math.cos(t) * w).addScaledVector(b, Math.sin(t) * w * flat).addScaledVector(d, -w * 0.3));
  }
  return hull(pts);
}

// assemble: centre parts + right-side parts (mirrored), grounded at y=0
export function assemble(center, side) {
  const parts = [...center];
  for (const g of side) { parts.push(g); parts.push(mirrorX(g)); }
  for (const g of parts) for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
  const merged = mergeGeometries(parts, false);
  merged.computeBoundingBox();
  merged.translate(0, -merged.boundingBox.min.y, 0);
  merged.computeBoundingBox();
  return merged;
}
export { V, THREE };

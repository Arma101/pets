// Bog Behemoth (Celestial, Round 6 - Swamp Slam): giant chunky swamp kraken.
// Big faceted mantle-head with fierce eyes + heavy brow, 8 mossy tentacles (4 mirrored pairs) planted on the ground,
// glowing lime spots and runes, a crown of twisted gold-tipped bog roots and a floating gold halo.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// root swatch: bark brown fading into a gold tip (used with 'len' painting)
function rootDraw(g, x, y) {
  const gr = g.createLinearGradient(0, y + 16, 0, y + 112);
  gr.addColorStop(0, '#A8743F'); gr.addColorStop(0.62, '#6B4423');
  gr.addColorStop(0.66, '#FFD83D'); gr.addColorStop(1, '#F0A818');
  g.fillStyle = '#A8743F'; g.fillRect(x, y, 128, 16);
  g.fillStyle = gr; g.fillRect(x, y + 16, 128, 96);
  g.fillStyle = '#F0A818'; g.fillRect(x, y + 112, 128, 16);
}

export const PALETTE = {
  body:   { i: 0, top: '#6E9038', bot: '#22584A' },
  tent:   { i: 1, top: '#62883A', bot: '#2C604A' },
  belly:  { i: 2, top: '#D3E4AE', bot: '#A3C084' },
  moss:   { i: 3, top: '#B0D84A', bot: '#6E9E28' },
  lime:   { i: 4, top: '#F4FF8C', bot: '#B8FF2E', glow: true },
  root:   { i: 5, draw: rootDraw },
  bark:   { i: 6, top: '#A8743F', bot: '#5E3B1D' },
  gold:   { i: 7, top: '#FFE15A', bot: '#E39A12' },
  halo:   { i: 8, top: '#FFE45A', bot: '#F2A814', glow: true },
  eye:    { i: 9, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 10, top: '#FFFFFF', bot: '#F1F1F4' },
  brow:   { i: 11, top: '#56782E', bot: '#2C4C24' },
  mouth:  { i: 12, top: '#1E2E18', bot: '#121C0E' },
  mossD:  { i: 13, top: '#8CB838', bot: '#4E7A1E' },
};
const P = PALETTE;

// ---------- local helpers ----------
function swUV(sw, t) {
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  return [(x + 64) / 1024, (y + 16 + THREE.MathUtils.clamp(t, 0, 1) * 96) / 1024];
}
// tentacle paint: per triangle, downward-facing facets get the pale sucker colour; t along the tube
function paintTent(g, tipT = 0.9) {
  const p = g.attributes.position, tv = g.userData.t, uv = [];
  const a = V(0, 0, 0), b = V(0, 0, 0), c = V(0, 0, 0);
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const tm = Math.min(tv[i], tv[i + 1], tv[i + 2]);
    const sw = tm > tipT ? P.lime : n.y < -0.35 ? P.belly : P.tent;
    for (let k = 0; k < 3; k++) uv.push(...swUV(sw, sw === P.tent ? tv[i + k] * 0.9 : 0.3));
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}
const rc = new THREE.Raycaster();
const castMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
// ray-cast onto a geometry; returns {p, n} or null
function hit(geo, origin, dir) {
  const m = new THREE.Mesh(geo, castMat);
  rc.set(origin, dir.clone().normalize());
  const h = rc.intersectObject(m, false)[0];
  if (!h) return null;
  const n = h.face.normal.clone();
  if (n.dot(dir) > 0) n.negate();
  return { p: h.point, n };
}
// faceted disc decal (hex button) sitting on a surface point
function decal(p, n, r, sides = 6, h = 0.012, spin = 0) {
  const up = Math.abs(n.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
  const a = new THREE.Vector3().crossVectors(n, up).normalize();
  const b = new THREE.Vector3().crossVectors(a, n).normalize();
  const pts = [];
  for (let k = 0; k < sides; k++) {
    const th = spin + (2 * Math.PI * k) / sides;
    const d = a.clone().multiplyScalar(Math.cos(th)).addScaledVector(b, Math.sin(th));
    pts.push(p.clone().addScaledVector(n, -0.02).addScaledVector(d, r));
    pts.push(p.clone().addScaledVector(n, h).addScaledVector(d, r * 0.72));
  }
  return hull(pts);
}

// project a 2D rune (list of bar segments in u/v) onto a surface by ray casting along `dir`
function rune(geo, O, dir, uA, vA, bars, w, lift = 0.012) {
  const out = [];
  for (const [u0, v0, u1, v1] of bars) {
    const du = u1 - u0, dv = v1 - v0, L = Math.hypot(du, dv);
    const pu = (-dv / L) * w, pv = (du / L) * w;
    const pts = [];
    for (const [u, v] of [[u0 + pu, v0 + pv], [u0 - pu, v0 - pv], [u1 + pu, v1 + pv], [u1 - pu, v1 - pv]]) {
      const o = O.clone().addScaledVector(uA, u).addScaledVector(vA, v).addScaledVector(dir, -1);
      const h = hit(geo, o, dir);
      if (!h) return out;
      pts.push(h.p.clone().addScaledVector(h.n, -0.02), h.p.clone().addScaledVector(h.n, lift));
    }
    out.push(hull(pts));
  }
  return out;
}

export function buildGeometry() {
  const C = [], S = [];

  // ================= MANTLE / HEAD (tall faceted head sweeping back into a pointed mantle) =================
  const FZ = 0.33; // front face plane
  const ph = Math.PI / 2 + Math.PI / 10;
  const mantlePts = [
    ...ring(V(0, 0.17, 0.0), 0.2, 0.19, 10, 'y', ph),
    ...ring(V(0, 0.27, 0.0), 0.31, 0.29, 10, 'y', ph),
    ...cbox(V(0, 0.47, 0.03), 0.3, 0.17, 0.3, 0.08),
    ...ring(V(0, 0.64, -0.03), 0.3, 0.29, 10, 'y', ph),
    ...ring(V(0, 0.8, -0.08), 0.25, 0.25, 10, 'y', ph),
    ...ring(V(0, 0.93, -0.13), 0.16, 0.17, 10, 'y', ph),
    ...ring(V(0, 1.0, -0.16), 0.07, 0.08, 6, 'y', Math.PI / 2 + Math.PI / 6),
    ...ring(V(0, 0.72, -0.46), 0.08, 0.07, 6, 'z', Math.PI / 2),
    V(0, 0.74, -0.58),
  ];
  const mantle = hull(mantlePts);
  C.push(paint(mantle.clone(), P.body, 'y', [0.2, 1.0]));

  // side fin flaps (mirrored) near the mantle tip, with gold rims
  {
    const h = hit(mantle, V(1, 0.66, -0.36), V(-1, 0, 0));
    const p = h.p;
    // broad chunky flap: long base hugging the mantle, tip swept back and a little out
    const A = p.clone().add(V(-0.04, 0.13, 0.1)), D = p.clone().add(V(-0.04, -0.11, -0.08));
    const T = p.clone().add(V(0.17, 0.06, -0.2));
    const nrm = new THREE.Vector3().subVectors(T, A).cross(new THREE.Vector3().subVectors(D, A)).normalize();
    if (nrm.x < 0) nrm.negate();
    const th = (q, a, b) => [q.clone().addScaledVector(nrm, a), q.clone().addScaledVector(nrm, -b)];
    const M = A.clone().lerp(D, 0.5).lerp(T, 0.4);
    S.push(paint(hull([...th(A, 0.02, 0.04), ...th(D, 0.02, 0.04), ...th(T, 0.012, 0.012), ...th(M, 0.045, 0.03)]), P.body, 'y', [0.4, 1.0]));
    // gold tip + glowing lime vein along the fin
    const tdir = new THREE.Vector3().subVectors(T, A.clone().lerp(D, 0.5)).normalize();
    S.push(paint(shard(T.clone().addScaledVector(tdir, -0.05), tdir, 0.035, 0.08, 4, 0.6), P.gold, 'y'));
    const B0 = A.clone().lerp(D, 0.5).addScaledVector(tdir, 0.03), B1 = T.clone().addScaledVector(tdir, -0.07);
    const up = new THREE.Vector3().crossVectors(nrm, tdir).normalize();
    S.push(paint(hull([B0, B1].flatMap((q, i) => [-1, 1].flatMap((sg) => [0.03, 0.05].map((dn) =>
      q.clone().addScaledVector(up, sg * (i ? 0.008 : 0.014)).addScaledVector(nrm, i ? dn * 0.4 : dn))))), P.lime, 'y'));
  }

  // ================= TENTACLES (4 mirrored pairs, planted) =================
  const tents = [
    { a: 27, reach: 0.6, curl: 0.3, r: 0.105 },
    { a: 70, reach: 0.56, curl: 1.0, r: 0.105 },
    { a: 114, reach: 0.6, curl: 0.35, r: 0.1 },
    { a: 155, reach: 0.54, curl: 0.9, r: 0.095 },
  ];
  const tentGeos = [];
  for (const T of tents) {
    const th = (T.a * Math.PI) / 180;
    const d = V(Math.sin(th), 0, Math.cos(th));
    const side = V(Math.cos(th), 0, -Math.sin(th));
    const at = (s, h, w = 0) => V(0, h, 0).addScaledVector(d, s).addScaledVector(side, w);
    const R = T.r;
    const curled = T.curl > 0.6;
    const rad = curled ? (t) => R * Math.max(0.2, 1 - 0.95 * t) + 0.01 : (t) => R * (1 - 0.7 * t) + 0.012;
    const ctrl = [
      at(0.1, 0.34),
      at(0.24, 0.2, 0.01),
      at(0.36, rad(0.32) * 0.96, 0.02),
      at(0.48, rad(0.5) * 0.96, 0.0),
      at(T.reach - 0.04, rad(0.68) * 0.96, -0.02),
    ];
    if (curled) {
      ctrl.push(at(T.reach + 0.07, 0.07, -0.02));
      ctrl.push(at(T.reach + 0.13, 0.15, -0.01));
      ctrl.push(at(T.reach + 0.12, 0.25, 0.0));
      ctrl.push(at(T.reach + 0.05, 0.29, 0.0));
      ctrl.push(at(T.reach + 0.01, 0.24, 0.0));
    } else {
      ctrl.push(at(T.reach + 0.06, rad(0.85) * 0.96 + 0.01, 0.0));
      ctrl.push(at(T.reach + 0.13, 0.05 + 0.08 * T.curl, 0.03));
    }
    const g = tube(curveSamples(ctrl, curled ? 13 : 9, rad), {
      seg: 7, capEnd: 0.03, phase: -Math.PI / 2, axis: side,
      scale: (i) => (i % 2 && i < 8 ? 1.06 : 0.96),
    });
    tentGeos.push({ g, d });
    // gold cuff just before the glowing tip
    {
      const cv = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal');
      const tb = curled ? 0.8 : 0.77;
      const p = cv.getPoint(tb), tg = cv.getTangent(tb);
      const a1 = new THREE.Vector3().crossVectors(tg, side).normalize(), a2 = side.clone();
      const r = rad(tb) * 1.18, pts = [];
      for (const [off, rr] of [[-0.022, r * 0.92], [0, r], [0.022, r * 0.92]])
        for (let k = 0; k < 7; k++) {
          const a = (2 * Math.PI * k) / 7;
          pts.push(p.clone().addScaledVector(tg, off).addScaledVector(a1, Math.cos(a) * rr).addScaledVector(a2, Math.sin(a) * rr));
        }
      S.push(paint(hull(pts), P.gold, 'y'));
    }
    S.push(paintTent(g, curled ? 0.86 : 0.83));
  }

  // bold glowing spots on each tentacle, moss on top
  for (const { g, d } of tentGeos) {
    const sideV = V(d.z, 0, -d.x);
    [[0.33, 0.044], [0.5, 0.036]].forEach(([s, r], k) => {
      const h = hit(g, V(0, 0.6, 0).addScaledVector(d, s), V(0, -1, 0));
      if (h) S.push(paint(decal(h.p, h.n, r, 6, 0.011, k * 0.5), P.lime, 'y'));
    });
    for (const [s, w, sz, lump] of [[0.42, 0.0, 0.055, 1], [0.25, -0.02, 0.05, 0], [0.58, 0.03, 0.04, 0]]) {
      const h = hit(g, V(0, 0.8, 0).addScaledVector(d, s).addScaledVector(sideV, w), V(0, -1, 0));
      if (!h) continue;
      if (lump) S.push(paint(blob(0, h.p.clone().addScaledVector(h.n, 0.004), V(sz * 1.2, sz * 0.55, sz * 1.0), { jitter: 0.3, rot: new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), h.n) }), P.moss, 'y'));
      else S.push(paint(decal(h.p, h.n, sz, 7, 0.014, s * 9), P.moss, 'y'));
    }
    const h2 = hit(g, V(0, 0.16, 0).addScaledVector(d, 0.33).addScaledVector(sideV, 0.3), sideV.clone().negate());
    if (h2) S.push(paint(shard(h2.p.clone().addScaledVector(h2.n, -0.01), h2.n.clone().add(V(0, -0.8, 0)), 0.035, 0.07), P.mossD, 'flat'));
  }

  // ================= FACE: fierce eyes + heavy brow shelf =================
  const k = 1.9;
  const E = V(0.13, 0.5, 0);
  const pl = (arr) => arr.map(([u, v]) => [u * k, v * k]);
  S.push(paint(hull(plate(pl([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.02, FZ + 0.005)), P.white, 'flat'));
  S.push(paint(hull(plate(pl([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.006, E.y, 0), FZ + 0.0, FZ + 0.011)), P.eye, 'flat'));
  S.push(paint(hull(plate(pl([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]]),
    V(E.x + 0.009, E.y + 0.004, 0), FZ + 0.007, FZ + 0.016)), P.white, 'flat'));
  // heavy brow shelf, protruding and slanting down to the centre
  S.push(paint(hull([
    V(0.025, E.y + 0.03, FZ + 0.08), V(0.027, E.y + 0.115, FZ + 0.06),
    V(0.235, E.y + 0.095, FZ - 0.01), V(0.235, E.y + 0.17, FZ - 0.04),
    V(0.025, E.y + 0.03, FZ - 0.04), V(0.027, E.y + 0.125, FZ - 0.05),
    V(0.235, E.y + 0.095, FZ - 0.09), V(0.235, E.y + 0.17, FZ - 0.1),
  ]), P.brow, 'y'));
  // stern little mouth (slight frown)
  C.push(paint(hull(cbox(V(0, 0.37, FZ + 0.003), 0.03, 0.009, 0.012, 0.003)), P.mouth, 'flat'));
  S.push(paint(hull([V(0.025, 0.378, FZ + 0.012), V(0.025, 0.362, FZ + 0.012), V(0.07, 0.355, FZ + 0.008),
    V(0.07, 0.365, FZ + 0.008), V(0.025, 0.37, FZ - 0.01), V(0.07, 0.36, FZ - 0.01)]), P.mouth, 'flat'));

  // ================= GOLD FOREHEAD PLATE + RUNES =================
  const Zf = V(0, 0, -1);
  {
    const pts = [];
    for (const [u, v] of [[0, 0.82], [0.1, 0.73], [0.05, 0.655], [-0.05, 0.655], [-0.1, 0.73]]) {
      const h = hit(mantle, V(u, v, 1), Zf);
      pts.push(h.p.clone().addScaledVector(h.n, -0.02), h.p.clone().addScaledVector(h.n, 0.014));
    }
    C.push(paint(hull(pts), P.gold, 'y'));
    // lime chevron + dot on the plate
    for (const g of rune(mantle, V(0, 0, 0.5), V(0, 0, -1), V(1, 0, 0), V(0, 1, 0), [[0.008, 0.685, 0.06, 0.725]], 0.012, 0.024))
      S.push(paint(g, P.lime, 'y'));
    for (const g of rune(mantle, V(0, 0, 0.5), V(0, 0, -1), V(1, 0, 0), V(0, 1, 0), [[-0.016, 0.77, 0.016, 0.77]], 0.016, 0.024))
      C.push(paint(g, P.lime, 'y'));
    // cheek glow marks under the eyes
    for (const g of rune(mantle, V(0, 0, 0.5), V(0, 0, -1), V(1, 0, 0), V(0, 1, 0), [[0.17, 0.39, 0.235, 0.405]], 0.011))
      S.push(paint(g, P.lime, 'y'));
  }
  // rune band: chevrons around the mantle below the crown
  const chev = [[-0.04, 0.025, 0, -0.02], [0, -0.02, 0.04, 0.025]];
  for (const deg of [55, 100]) {
    const a = (deg * Math.PI) / 180;
    const dir = V(-Math.sin(a), 0, -Math.cos(a));
    const O = V(0, 0.74, -0.08);
    const uA = V(Math.cos(a), 0, -Math.sin(a));
    for (const g of rune(mantle, O, dir, uA, V(0, 1, 0), chev, 0.011)) S.push(paint(g, P.lime, 'y'));
  }
  // rune lines down the back of the mantle: a spine of chevrons pointing down + mirrored side strokes
  {
    const dir = V(0, 0, 1), vA = V(0, 1, 0), O = V(0, 0, -0.3);
    for (const [y, sz] of [[0.66, 1.15], [0.52, 1.0], [0.39, 0.85]]) {
      const bars = [[-0.055 * sz, y + 0.03 * sz, 0, y - 0.025 * sz], [0, y - 0.025 * sz, 0.055 * sz, y + 0.03 * sz]];
      const gs = rune(mantle, O, dir, V(1, 0, 0), vA, bars, 0.013);
      if (gs.length === 2) { C.push(paint(gs[0], P.lime, 'y')); C.push(paint(gs[1], P.lime, 'y')); }
    }
  }
  // a few bold glowing spots on the mantle sides
  for (const [o, r] of [[V(0.3, 0.42, 0.0), 0.045], [V(0.26, 0.57, -0.2), 0.04], [V(0.27, 0.3, 0.2), 0.03]]) {
    const dir = V(-o.x, 0, -o.z).normalize();
    const h = hit(mantle, o.clone().addScaledVector(dir, -0.6), dir);
    if (h) S.push(paint(decal(h.p, h.n, r, 6, 0.012, 0.3), P.lime, 'y'));
  }
  // moss drapes on the mantle shoulders
  for (const [o, sz] of [[V(0.31, 0.62, 0.0), 0.06], [V(0.24, 0.8, -0.2), 0.05]]) {
    const dir = V(-o.x, -0.3, -o.z).normalize();
    const h = hit(mantle, o.clone().addScaledVector(dir, -0.4), dir);
    if (h) {
      S.push(paint(decal(h.p, h.n, sz * 1.15, 7, 0.007, 0.2), P.mossD, 'y'));
    }
  }

  // ================= ROOT CROWN =================
  const CY = 0.86, CZ = -0.11, CR = 0.215;
  const band = [];
  const NB = 14;
  for (let j = 0; j <= NB; j++) {
    const a = Math.PI + (2 * Math.PI * j) / NB;
    band.push(V(Math.sin(a) * CR, CY + 0.018 * Math.cos(3 * a), CZ + Math.cos(a) * CR));
  }
  C.push(paint(tube(band.map((p, j) => ({ p, rx: 0.03, ry: j % 2 ? 0.036 : 0.027 })), { seg: 5 }), P.bark, 'y', [CY - 0.05, CY + 0.06]));
  const rootAt = (aDeg, hgt, lean) => {
    const a = (aDeg * Math.PI) / 180;
    const o = V(Math.sin(a), 0, Math.cos(a));
    const s = V(Math.cos(a), 0, -Math.sin(a));
    const b = V(0, CY - 0.02, CZ).addScaledVector(o, CR - 0.01);
    return tube(curveSamples([
      b,
      b.clone().add(V(0, hgt * 0.35, 0)).addScaledVector(o, 0.035 * lean).addScaledVector(s, 0.02),
      b.clone().add(V(0, hgt * 0.65, 0)).addScaledVector(o, 0.05 * lean).addScaledVector(s, -0.02),
      b.clone().add(V(0, hgt, 0)).addScaledVector(o, 0.09 * lean),
    ], 6, (t) => 0.038 * (1 - 0.65 * t)), { seg: 5, capEnd: 0.05, twist: (i) => i * 0.5 });
  };
  C.push(paint(rootAt(0, 0.17, 1.0), P.root, 'len'));
  S.push(paint(rootAt(48, 0.2, 1.0), P.root, 'len'));
  S.push(paint(rootAt(98, 0.17, 1.1), P.root, 'len'));
  S.push(paint(rootAt(140, 0.17, 1.0), P.root, 'len'));
  // crown jewel: gold setting + glowing lime gem at the front of the band
  C.push(paint(hull([
    ...ring(V(0, CY + 0.005, CZ + CR + 0.02), 0.05, 0.065, 4, 'z', Math.PI / 2),
    ...ring(V(0, CY + 0.005, CZ + CR + 0.055), 0.035, 0.05, 4, 'z', Math.PI / 2),
  ]), P.gold, 'y'));
  C.push(paint(hull([
    ...ring(V(0, CY + 0.005, CZ + CR + 0.05), 0.028, 0.04, 4, 'z', Math.PI / 2),
    V(0, CY + 0.005, CZ + CR + 0.08),
  ]), P.lime, 'y'));
  // low moss tufts on the crown of the head (inside the roots)
  for (const [x, z, sz] of [[0, -0.06, 0.055], [0.09, -0.13, 0.045], [0.0, -0.2, 0.05]]) {
    const h = hit(mantle, V(x, 2, z), V(0, -1, 0));
    if (!h) continue;
    const g1 = paint(decal(h.p, h.n, sz, 7, 0.014, x * 20), P.moss, 'y');
    const g2 = paint(shard(h.p.clone(), h.n.clone().add(V(x * 3, 0.2, 0.3)), sz * 0.45, sz * 0.9), P.mossD, 'flat');
    if (x === 0) { C.push(g1); } else { S.push(g1); S.push(g2); }
  }

  // ================= HALO (chunky floating gold ring with gem points) =================
  const HY = 1.17, HZ = -0.11, HR = 0.25;
  const hp = (a) => V(Math.sin(a) * HR, HY - 0.06 * Math.cos(a), HZ + Math.cos(a) * HR * 0.95);
  const halo = [];
  const NH = 12;
  for (let j = 0; j <= NH; j++) halo.push(hp(Math.PI + (2 * Math.PI * j) / NH));
  C.push(paint(tube(halo.map((p) => ({ p, rx: 0.042, ry: 0.036 })), { seg: 6, phase: Math.PI / 6 }), P.halo, 'y', [HY - 0.09, HY + 0.07]));
  const gem = (a) => {
    const p = hp(a), rO = V(Math.sin(a), 0, Math.cos(a)), tg = V(Math.cos(a), 0, -Math.sin(a));
    return hull([p.clone().add(V(0, 0.06, 0)), p.clone().add(V(0, -0.045, 0)),
      p.clone().addScaledVector(rO, 0.065), p.clone().addScaledVector(rO, -0.03),
      p.clone().addScaledVector(tg, 0.04), p.clone().addScaledVector(tg, -0.04)]);
  };
  C.push(paint(gem(Math.PI), P.lime, 'y'));
  S.push(paint(gem(Math.PI / 4), P.lime, 'y'));
  S.push(paint(gem((3 * Math.PI) / 4), P.lime, 'y'));

  return assemble(C, S);
}

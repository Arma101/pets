// Golden Phoenix (CELESTIAL): gold bird, red-orange flame feathers, floating crown of golden flames,
// white-marble breastplate with gold trim, light feathers, glowing markings.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  gold:   { i: 0, top: '#FFD95A', bot: '#D38C12' },
  goldD:  { i: 1, top: '#F2B42A', bot: '#A8650A' },
  trim:   { i: 2, top: '#FFF0A0', bot: '#F0AE1E' },
  marble: {
    i: 3, draw(g, x, y) {
      const gr = g.createLinearGradient(0, y, 0, y + 128);
      gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(1, '#E3E1EA');
      g.fillStyle = gr; g.fillRect(x, y, 128, 128);
      g.strokeStyle = 'rgba(150,150,170,0.55)'; g.lineWidth = 3;
      for (const [a, b] of [[30, 44], [58, 66], [86, 80], [100, 112]]) {
        g.beginPath(); g.moveTo(x, y + a); g.lineTo(x + 64, y + (a + b) / 2 + 4); g.lineTo(x + 128, y + b); g.stroke();
      }
    },
  },
  flame:  { i: 4, top: '#FFD040', bot: '#F2380E', glow: true },
  flameR: { i: 5, top: '#FF9A2E', bot: '#D61A10' },
  crown:  { i: 6, top: '#FFF59A', bot: '#FFB000', glow: true },
  light:  { i: 7, top: '#FFFEF6', bot: '#F8E6BE' },
  eye:    { i: 8, top: '#1A1416', bot: '#0C0A0B' },
  eyeW:   { i: 9, top: '#FFFFFF', bot: '#F1F1F4' },
  beak:   { i: 10, top: '#FFB23A', bot: '#D0600E' },
  rune:   { i: 11, top: '#FFFBD8', bot: '#FF8A00', glow: true },
  outl:   { i: 14, top: '#B8700A', bot: '#7A4206' },
  wingG:  { i: 13, top: '#FFD02A', bot: '#FFB000' },
  claw:   { i: 12, top: '#E8A21A', bot: '#8A4E08' },
};
const P = PALETTE;

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const sub = (a, b) => a.clone().sub(b);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);

function swUV(sw, t) {
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  return [(x + 64) / 1024, (y + 16 + THREE.MathUtils.clamp(t, 0, 1) * 96) / 1024];
}
// gradient along a direction (t=0 at base, 1 at base + dir*L)
function along(g, sw, base, dir, L) {
  const p = g.attributes.position, d = nrm(dir), uv = [];
  for (let i = 0; i < p.count; i++) {
    const t = ((p.getX(i) - base.x) * d.x + (p.getY(i) - base.y) * d.y + (p.getZ(i) - base.z) * d.z) / L;
    uv.push(...swUV(sw, t));
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
// flat feather blade lying in plane (dir, normal-ish n)
function blade(base, dir, n, L, w, th = 0.016, shape = null) {
  const d = nrm(dir);
  const nn = nrm(add(n, d, -n.dot(d)));
  const v = nrm(cross(nn, d));
  const pts2 = shape || [[0, -0.3], [0, 0.3], [0.2, 0.5], [0.8, 0.5], [1, 0.05], [0.8, -0.5], [0.2, -0.5]];
  const pts = [];
  for (const [u, s] of pts2) {
    const p = add(add(base, d, u * L), v, s * w);
    const t = th * (u > 0.9 ? 0.6 : 1);
    pts.push(add(p, nn, t / 2), add(p, nn, -t / 2));
  }
  return hull(pts);
}
const FLAME = [[0, -0.35], [0, 0.35], [0.25, 0.55], [0.6, 0.4], [1, -0.15], [0.55, -0.45], [0.2, -0.5]];

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const gold = (g, lo, hi) => paint(g, P.gold, 'y', lo === undefined ? null : [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');
  const flameBlade = (b, d, n, L, w, sw = P.flame, th = 0.02) => along(blade(b, d, n, L, w, th, FLAME), sw, b, d, L);

  // ================= BODY =================
  C.push(gold(hull([
    ...ring(V(0, 0.36, -0.26), 0.09, 0.08, 10, 'z'),
    ...ring(V(0, 0.37, -0.17), 0.17, 0.15, 10, 'z'),
    ...ring(V(0, 0.39, -0.04), 0.205, 0.175, 10, 'z'),
    ...ring(V(0, 0.43, 0.08), 0.2, 0.18, 10, 'z'),
    ...ring(V(0, 0.49, 0.16), 0.16, 0.16, 10, 'z'),
    ...ring(V(0, 0.55, 0.19), 0.1, 0.1, 10, 'z'),
  ]), 0.2, 0.68));
  C.push(gold(hull([...ring(V(0, 0.5, 0.06), 0.15, 0.14, 8, 'y'), ...ring(V(0, 0.7, 0.1), 0.135, 0.13, 8, 'y')]), 0.4, 0.85));

  // marble breastplate with gold trim + glowing rune
  const shieldPts = (s) => [[-0.13 * s, 0.11 * s], [0.13 * s, 0.11 * s], [0.15 * s, -0.02 * s], [0, -0.17 * s], [-0.15 * s, -0.02 * s]];
  const shield = (s, c, zf, depth, lean) => {
    const pts = [];
    for (const [u, v] of shieldPts(s)) {
      const bulge = 0.02 * (1 - Math.abs(u) / 0.15);
      pts.push(V(u, c.y + v, zf - lean * v + bulge - Math.abs(u) * 0.35), V(u, c.y + v, zf - lean * v - depth - Math.abs(u) * 0.35));
    }
    return hull(pts);
  };
  const SC = V(0, 0.5, 0);
  C.push(paint(shield(0.78, SC, 0.25, 0.12, 0.45), P.trim, 'y'));
  C.push(paint(shield(0.68, SC, 0.262, 0.12, 0.45), P.marble, 'y'));
  // rune: glowing diamond + chevron
  C.push(flat(hull([V(0, 0.55, 0.27), V(0.03, 0.5, 0.29), V(0, 0.44, 0.305), V(-0.03, 0.5, 0.29),
    V(0, 0.55, 0.25), V(0.03, 0.5, 0.27), V(0, 0.44, 0.285), V(-0.03, 0.5, 0.27)]), P.rune));

  // soft cream belly feathers: two overlapping rows hugging the belly, tapering into the legs
  const SOFT = [[0, -0.45], [0, 0.45], [0.35, 0.55], [0.75, 0.42], [1, 0], [0.75, -0.42], [0.35, -0.55]];
  const cream = (b, d, n, L, w) => along(blade(b, d, n, L, w, 0.03, SOFT), P.light, b, d, L);
  // lower row first (sits underneath), upper row overlaps it
  C.push(cream(V(0, 0.33, 0.175), V(0, -1, -0.5), V(0, -0.3, 1), 0.14, 0.11));
  S.push(cream(V(0.09, 0.32, 0.15), V(0.15, -1, -0.45), V(0.5, -0.3, 1), 0.13, 0.09));
  C.push(cream(V(0, 0.41, 0.225), V(0, -1, -0.3), V(0, -0.15, 1), 0.15, 0.12));
  S.push(cream(V(0.1, 0.4, 0.2), V(0.2, -1, -0.3), V(0.6, -0.15, 1), 0.14, 0.1));
  S.push(cream(V(0.165, 0.42, 0.13), V(0.3, -1, -0.15), V(1, -0.1, 0.5), 0.13, 0.085));
  // glowing flame markings on the flanks: flush decals with a dark-gold outline
  const bodyMesh = new THREE.Mesh(C[0], new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  const rc = new THREE.Raycaster();
  const decal = (y, z, sc, tilt) => {
    rc.set(V(0.6, y, z), V(-1, 0, 0));
    const hit = rc.intersectObject(bodyMesh)[0];
    const n = hit.face.normal.clone();
    const up = nrm(add(V(0, Math.cos(tilt), Math.sin(tilt)), n, -n.dot(V(0, Math.cos(tilt), Math.sin(tilt)))));
    const side = nrm(cross(up, n));
    const shape = [[0, 1], [0.32, 0.35], [0.42, -0.3], [0.2, -0.75], [-0.2, -0.75], [-0.42, -0.3], [-0.32, 0.35]];
    const mk = (k, off, th) => {
      const pts = [];
      for (const [u, v] of shape) for (const h of [off - th, off])
        pts.push(add(add(add(hit.point, side, u * sc * k), up, v * sc * k), n, h));
      return hull(pts);
    };
    S.push(paint(mk(1.3, 0.005, 0.012), P.outl, 'flat'));
    S.push(paint(mk(1.0, 0.01, 0.012), P.rune, 'y'));
  };
  decal(0.44, 0.02, 0.05, -0.35);
  decal(0.42, -0.1, 0.038, -0.5);

  // neck ruff: red-orange flame feathers around the neck, gold in front
  for (let k = 0; k < 6; k++) {
    const a = 0.55 + k * 0.48; // from front-side round to the back
    const r = V(Math.sin(a), 0, Math.cos(a));
    const b = V(r.x * 0.13, 0.66, 0.1 + r.z * 0.12);
    const d = nrm(V(r.x, -0.9, r.z));
    const g = along(blade(b, d, r, 0.17, 0.065, 0.03, FLAME), k < 2 ? P.flame : P.flameR, b, d, 0.17);
    if (Math.abs(r.x) < 0.05) C.push(g); else S.push(g);
  }
  C.push(along(blade(V(0, 0.66, -0.03), V(0, -0.9, -1), V(0, 0.3, -1), 0.18, 0.07, 0.03, FLAME), P.flameR, V(0, 0.66, -0.03), V(0, -0.9, -1), 0.18));

  // ================= HEAD =================
  const H = { y: 0.8, z: 0.13 };
  C.push(gold(hull([
    ...cbox(V(0, H.y, H.z), 0.165, 0.145, 0.145, 0.075),
    ...ring(V(0, H.y + 0.155, H.z - 0.01), 0.095, 0.085, 8, 'y'),
    V(0.16, H.y - 0.085, H.z + 0.02), V(-0.16, H.y - 0.085, H.z + 0.02),
  ]), 0.66, 1.02));
  const FZ = H.z + 0.145;
  // cheek feathers (light) and nape flame feathers
  S.push(paint(shard(V(0.15, H.y - 0.07, H.z + 0.04), V(0.6, -0.8, -0.4), 0.045, 0.09, 4, 0.6), P.goldD, 'flat'));
  S.push(paint(blade(V(0.15, H.y - 0.02, H.z - 0.05), V(0.5, -0.4, -1), V(1, 0.2, -0.2), 0.12, 0.055, 0.02), P.gold, 'flat'));
  // flame crest sweeping up and back from the crown of the head
  for (const [x, y, z, d, L, w] of [
    [0, 0.11, 0.0, V(0, 0.15, -1), 0.2, 0.06],
    [0, 0.1, -0.06, V(0, 0.35, -1), 0.24, 0.065],
    [0, 0.03, -0.13, V(0, 0.0, -1), 0.22, 0.06],
  ]) C.push(flameBlade(V(x, H.y + y, H.z + z), d, V(1, 0, 0), L * 1.25, w * 1.2, P.flameR, 0.035));
  for (const [x, y, z, d, L, w] of [
    [0.06, 0.11, 0.0, V(0.45, 0.2, -0.9), 0.2, 0.055],
    [0.1, 0.06, -0.08, V(0.45, 0.2, -1), 0.2, 0.055],
    [0.1, -0.03, -0.11, V(0.45, -0.3, -1), 0.17, 0.05],
  ]) S.push(flameBlade(V(x, H.y + y, H.z + z), d, V(1, 0.2, 0.2), L, w, P.flameR, 0.03));

  // beak: chunky hooked (scaled ~0.87 about its root)
  const bk0 = C.length;
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.045, FZ + 0.005), 0.085, 0.055, 0.02, 0.016),
    V(0.04, H.y - 0.01, FZ + 0.09), V(-0.04, H.y - 0.01, FZ + 0.09),
    V(0.022, H.y - 0.03, FZ + 0.15), V(-0.022, H.y - 0.03, FZ + 0.15),
    V(0, H.y - 0.14, FZ + 0.165), V(0.016, H.y - 0.1, FZ + 0.175), V(-0.016, H.y - 0.1, FZ + 0.175),
    V(0.036, H.y - 0.095, FZ + 0.08), V(-0.036, H.y - 0.095, FZ + 0.08),
  ]), P.beak, 'y', [H.y - 0.14, H.y + 0.0]));
  C.push(paint(hull([...cbox(V(0, H.y - 0.102, FZ + 0.02), 0.045, 0.016, 0.02, 0.007),
    V(0, H.y - 0.108, FZ + 0.08), V(0.012, H.y - 0.1, FZ + 0.075), V(-0.012, H.y - 0.1, FZ + 0.075)]), P.claw, 'flat'));
  for (const g of C.slice(bk0)) { g.translate(0, -(H.y - 0.04), -FZ); g.scale(0.87, 0.87, 0.87); g.translate(0, H.y - 0.04, FZ); }

  // eyes
  const E = V(0.086, H.y + 0.03, 0), ek = 1.2;
  const K = (a) => a.map(([u, v]) => [u * ek, v * ek]);
  S.push(flat(hull(plate(K([[-0.036, 0.004], [0.04, 0.03], [0.045, -0.01], [0.018, -0.036], [-0.026, -0.032], [-0.04, -0.014]]),
    E, FZ - 0.01, FZ + 0.01)), P.eyeW));
  S.push(flat(hull(plate(K([[-0.022, 0.004], [0.011, 0.016], [0.017, -0.007], [0.004, -0.024], [-0.016, -0.022], [-0.025, -0.009]]),
    V(E.x - 0.008, E.y - 0.002, 0), FZ + 0.005, FZ + 0.016)), P.eye));
  S.push(flat(hull(plate(K([[-0.006, -0.006], [0.006, -0.006], [0.006, 0.006], [-0.006, 0.006]]),
    V(E.x - 0.001, E.y + 0.002, 0), FZ + 0.012, FZ + 0.019)), P.eyeW));
  S.push(paint(hull([
    V(0.02, E.y + 0.01, FZ + 0.028), V(0.022, E.y + 0.048, FZ + 0.018),
    V(0.145, E.y + 0.035, FZ - 0.01), V(0.145, E.y + 0.07, FZ - 0.025),
    V(0.02, E.y + 0.01, FZ - 0.03), V(0.022, E.y + 0.058, FZ - 0.04),
    V(0.145, E.y + 0.035, FZ - 0.06), V(0.145, E.y + 0.07, FZ - 0.07),
  ]), P.goldD, 'y'));
  // glowing forehead mark (dark-gold outline behind)
  C.push(flat(hull([V(0, E.y + 0.115, FZ - 0.016), V(0.03, E.y + 0.07, FZ - 0.008), V(0, E.y + 0.032, FZ - 0.0), V(-0.03, E.y + 0.07, FZ - 0.008),
    V(0, E.y + 0.115, FZ - 0.05), V(0, E.y + 0.032, FZ - 0.04)]), P.outl));
  C.push(flat(hull([V(0, E.y + 0.1, FZ - 0.01), V(0.02, E.y + 0.07, FZ - 0.003), V(0, E.y + 0.045, FZ + 0.004), V(-0.02, E.y + 0.07, FZ - 0.003),
    V(0, E.y + 0.1, FZ - 0.04), V(0, E.y + 0.045, FZ - 0.03)]), P.rune));

  // ================= FLOATING CROWN OF GOLDEN FLAMES =================
  const CY = H.y + 0.215, CZ = H.z - 0.01, CR = 0.13, NB = 12;
  for (let k = 0; k < NB; k++) {
    const a0 = (2 * Math.PI * k) / NB, a1 = (2 * Math.PI * (k + 1)) / NB;
    const pts = [];
    for (const a of [a0, a1]) for (const r of [CR - 0.022, CR + 0.012]) for (const h of [0, 0.04])
      pts.push(V(Math.sin(a) * r, CY + h, CZ + Math.cos(a) * r));
    C.push(paint(hull(pts), P.trim, 'y', [CY, CY + 0.04]));
  }
  const crownFlame = (a, L, w, side) => {
    const r = V(Math.sin(a), 0, Math.cos(a));
    const b = V(r.x * (CR - 0.005), CY + 0.03, CZ + r.z * (CR - 0.005));
    const d = nrm(V(r.x * 0.25, 1, r.z * 0.25));
    const g = along(blade(b, d, r, L, w, 0.03, FLAME), P.crown, b, d, L);
    (side ? S : C).push(g);
  };
  crownFlame(0, 0.17, 0.06, false);
  crownFlame(Math.PI, 0.11, 0.05, false);
  crownFlame(Math.PI / 4, 0.13, 0.05, true);
  crownFlame(Math.PI / 2, 0.12, 0.05, true);
  crownFlame((3 * Math.PI) / 4, 0.1, 0.045, true);

  // ================= WINGS (half-raised; gold arm, light coverts, flame flight feathers) =================
  const SH = V(0.16, 0.56, 0.02), WR = V(0.42, 0.86, -0.12), TP = V(0.6, 0.98, -0.55);
  const armDir = nrm(sub(WR, SH));
  const wingN = (dir) => { const n = nrm(cross(armDir, dir)); if (n.x < 0) n.multiplyScalar(-1); return n; };
  const edgePts = [SH, add(SH, sub(WR, SH), 0.5), WR, add(WR, V(0.06, 0.07, -0.22), 1), TP];
  S.push(paint(tube(curveSamples(edgePts, 9, (t) => 0.055 - 0.022 * t, (t) => 0.04 - 0.014 * t),
    { seg: 6, ref: V(1, 0, 0.2), capEnd: 0.035, capStart: 0.01 }), P.trim, 'len'));
  const NF = 7;
  for (let i = 0; i < NF; i++) {
    const t = 0.1 + 0.9 * i / (NF - 1);
    const p = add(SH, sub(WR, SH), t);
    const ang = -0.8 + 0.6 * t;
    const dir = nrm(V(0.42, Math.sin(ang), -Math.cos(ang)));
    const n = wingN(dir);
    const k = NF - i;
    const L = 0.28 + 0.34 * Math.pow(t, 1.2);
    S.push(flameBlade(add(p, n, -0.014 + k * 0.005), dir, n, L, 0.12, i % 2 ? P.flameR : P.flame, 0.016));
  }
  for (let i = 0; i < 3; i++) {
    const t = 0.15 + i * 0.3;
    const p = add(WR, sub(TP, WR), t);
    const dir = nrm(V(0.35, -0.45 - 0.2 * i, -1));
    const n = wingN(V(0.35, -0.3, -1));
    S.push(flameBlade(add(p, n, -0.02 - i * 0.005), dir, n, 0.32 - i * 0.05, 0.12, P.flame, 0.016));
  }
  const edge = new THREE.CatmullRomCurve3(edgePts, false, 'centripetal');
  const NC = 9;
  for (let i = 0; i < NC; i++) {
    const t = 0.15 + 0.75 * i / (NC - 1);
    const p = edge.getPoint(t);
    const dir = nrm(V(0.38, -0.45 - 0.35 * Math.max(0, t - 0.55), -1));
    const n = wingN(V(0.38, -0.3, -1));
    S.push(paint(blade(add(p, n, 0.035 + i * 0.004), dir, n, 0.2 + 0.06 * t, 0.085, 0.02,
      [[0, -0.4], [0, 0.4], [0.4, 0.55], [1, 0], [0.4, -0.55]]), P.wingG, 'flat'));
  }
  // glowing rune dots along the gold edge
  for (const t of [0.3, 0.55, 0.8]) {
    const p = edge.getPoint(t);
    S.push(flat(blob(0, add(p, V(0.02, 0.0, 0.0)), V(0.022, 0.022, 0.022)), P.rune));
  }

  // ================= TAIL (big fan of flame plumes) =================
  const plume = (pts, w, thick, sw) => paint(tube(curveSamples(pts, 9,
    (t) => thick * (1 - 0.6 * t), (t) => w * Math.sin(Math.PI * (0.18 + 0.82 * t)) + 0.006),
    { seg: 4, axis: X }), sw, 'len');
  const tails = [
    { x: [0, 0], c: P.flame, w: 0.1, pts: [[0.42, -0.22], [0.55, -0.42], [0.72, -0.6], [0.88, -0.66], [0.98, -0.6]] },
    { x: [0.05, 0.16], c: P.flameR, w: 0.095, pts: [[0.41, -0.22], [0.5, -0.42], [0.62, -0.62], [0.74, -0.74], [0.82, -0.72]] },
    { x: [0.06, 0.24], c: P.flame, w: 0.09, pts: [[0.4, -0.22], [0.42, -0.44], [0.47, -0.64], [0.55, -0.78], [0.6, -0.84]] },
    { x: [0.05, 0.2], c: P.flameR, w: 0.085, pts: [[0.38, -0.22], [0.33, -0.42], [0.3, -0.6], [0.32, -0.76], [0.36, -0.84]] },
  ];
  for (const t of tails) {
    const n = t.pts.length;
    const pts = t.pts.map(([y, z], i) => V(t.x[0] + (t.x[1] - t.x[0]) * i / (n - 1), y, z));
    (t.x[0] === 0 && t.x[1] === 0 ? C : S).push(plume(pts, t.w, 0.03, t.c));
  }
  // gold trim covert over the tail base
  C.push(paint(blade(V(0, 0.5, -0.12), V(0, -0.3, -1), V(0, 1, -0.2), 0.2, 0.09, 0.025), P.gold, 'flat'));
  S.push(paint(blade(V(0.07, 0.49, -0.12), V(0.35, -0.35, -1), V(0.3, 1, -0.2), 0.18, 0.08, 0.025), P.gold, 'flat'));

  // ================= LEGS =================
  const legX = 0.1;
  S.push(gold(blob(1, V(legX, 0.25, -0.0), V(0.09, 0.095, 0.105), { jitter: 0.15 }), 0.15, 0.4));
  for (const [b, d] of [[V(legX + 0.07, 0.27, 0.04), V(0.4, -1, 0.3)], [V(legX + 0.07, 0.27, -0.05), V(0.4, -1, -0.4)],
    [V(legX + 0.01, 0.26, 0.08), V(0.1, -1, 0.5)]]) S.push(paint(shard(b, d, 0.05, 0.09, 4, 0.6), P.gold, 'flat'));
  S.push(paint(hull([...ring(V(legX, 0.2, -0.005), 0.054, 0.054, 6), ...ring(V(legX + 0.003, 0.12, 0.005), 0.052, 0.052, 6),
    ...ring(V(legX + 0.005, 0.04, 0.02), 0.047, 0.047, 6)]), P.goldD, 'y', [0, 0.22]));
  // marble cuff with gold trim rims
  S.push(paint(hull([...ring(V(legX + 0.003, 0.1, 0.008), 0.066, 0.066, 8), ...ring(V(legX + 0.003, 0.15, 0.003), 0.066, 0.066, 8)]), P.marble, 'y', [0.08, 0.17]));
  for (const y of [0.095, 0.155])
    S.push(paint(hull([...ring(V(legX + 0.003, y - 0.008, 0.006), 0.072, 0.072, 8), ...ring(V(legX + 0.003, y + 0.008, 0.006), 0.072, 0.072, 8)]), P.trim, 'flat'));
  const foot = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.032, z), 0.052, 0.032, 0.052, 0.014)), P.goldD, 'y', [0, 0.07]));
    for (const [dx, dz] of [[-0.058, 0.088], [0, 0.11], [0.058, 0.088]]) {
      S.push(paint(hull([...cbox(V(x + dx * 0.45, 0.026, z + dz * 0.45), 0.023, 0.026, 0.023, 0.008),
        ...cbox(V(x + dx, 0.022, z + dz), 0.021, 0.022, 0.017, 0.007)]), P.goldD, 'y', [0, 0.07]));
      S.push(paint(shard(V(x + dx * 1.08, 0.02, z + dz + 0.013), V(dx, -0.45, 0.8), 0.017, 0.042), P.claw, 'flat'));
    }
    S.push(paint(hull([...cbox(V(x, 0.022, z - 0.058), 0.019, 0.022, 0.03, 0.006)]), P.goldD, 'y', [0, 0.07]));
    S.push(paint(shard(V(x, 0.016, z - 0.088), V(0, -0.4, -1), 0.015, 0.036), P.claw, 'flat'));
  };
  foot(legX + 0.005, 0.03);

  return assemble(C, S);
}

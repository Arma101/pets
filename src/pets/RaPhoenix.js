// Ra Phoenix (MYTHIC, Desert Dojo): golden phoenix, flame feathers, sun-disc crown, fiery crest,
// glowing halo ring behind the head, gold/lapis/sandstone ornaments, glowing markings, big spread wings.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// 3-stop gradient cell (gold -> orange -> red)
const grad3 = (c0, c1, c2) => (g, x, y) => {
  const gr = g.createLinearGradient(0, y + 16, 0, y + 112);
  gr.addColorStop(0, c0); gr.addColorStop(0.5, c1); gr.addColorStop(1, c2);
  g.fillStyle = c0; g.fillRect(x, y, 128, 16);
  g.fillStyle = gr; g.fillRect(x, y + 16, 128, 96);
  g.fillStyle = c2; g.fillRect(x, y + 112, 128, 16);
};

export const PALETTE = {
  gold:    { i: 0, top: '#FFE15A', bot: '#F2A51E' },   // body
  goldDk:  { i: 1, top: '#FFCB35', bot: '#C9780C' },   // trim, talons
  flame:   { i: 2, draw: grad3('#FFE04A', '#FF8A1A', '#E3301A') },
  flameO:  { i: 3, draw: grad3('#FFC23A', '#FF7A18', '#D92A16') },
  beak:    { i: 4, top: '#FFAA2A', bot: '#D9480C' },
  eye:     { i: 5, top: '#1A1416', bot: '#0C0A0B' },
  white:   { i: 6, top: '#FFFFFF', bot: '#F1F1F4' },
  brow:    { i: 7, top: '#F2742A', bot: '#B83A14' },
  lapis:   { i: 8, top: '#3D6BE8', bot: '#1A2F9A' },
  sand:    { i: 9, top: '#F2D8A4', bot: '#C9A267' },
  sun:     { i: 10, top: '#FF6A2A', bot: '#D4241A' },
  halo:    { i: 11, top: '#FFF6A0', bot: '#FFB000', glow: true },
  rune:    { i: 12, top: '#FFF8B8', bot: '#FFC21A', glow: true },
  mouth:   { i: 13, top: '#7A3A12', bot: '#4A1E08' },
  claw:    { i: 14, top: '#F6C431', bot: '#A86208' },
  head:    { i: 15, top: '#FFF0A0', bot: '#F6B83A' },
  bib:     { i: 16, draw: grad3('#FFF4B8', '#FFD860', '#FFA52A') },
  flameL:  { i: 17, draw: grad3('#FFB43A', '#FF8A22', '#F2501A') },
  beakDk:  { i: 18, top: '#C24A10', bot: '#7E2A08' },
};
const P = PALETTE;

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const sub = (a, b) => a.clone().sub(b);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);

function uvT(sw, t) {
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  return [(x + 64) / 1024, (y + 16 + THREE.MathUtils.clamp(t, 0, 1) * 96) / 1024];
}
// gradient along a direction: t0 at origin -> t1 at origin + dir*len
function paintDir(g, sw, o, d, len, t0 = 0, t1 = 1) {
  const p = g.attributes.position, dn = nrm(d), uv = [];
  for (let i = 0; i < p.count; i++) {
    const k = (V(p.getX(i), p.getY(i), p.getZ(i)).sub(o).dot(dn)) / len;
    uv.push(...uvT(sw, t0 + (t1 - t0) * k));
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}

// flat feather blade lying in plane (dir, side), normal n
function blade(base, dir, n, L, w, th = 0.018, shape = null) {
  const d = nrm(dir);
  const nn = nrm(add(n, d, -n.dot(d)));
  const v = nrm(cross(nn, d));
  const pts2 = shape || [[0, -0.3], [0, 0.3], [0.2, 0.5], [0.75, 0.42], [1, 0.0], [0.7, -0.3], [0.2, -0.5]];
  const pts = [];
  for (const [u, s] of pts2) {
    const p = add(add(base, d, u * L), v, s * w);
    const t = th * (u > 0.9 ? 0.6 : 1);
    pts.push(add(p, nn, t / 2), add(p, nn, -t / 2));
  }
  return hull(pts);
}
const FLAME_SHAPE = [[0, -0.35], [0, 0.35], [0.25, 0.5], [0.6, 0.3], [0.68, 0.45], [1, 0.0], [0.55, -0.4], [0.2, -0.5]];

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const gold = (g, lo, hi) => paint(g, P.gold, 'y', lo === undefined ? null : [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');
  const fshard = (b, d, w, l, sw = P.flame, t0 = 0, t1 = 1, fl = 0.6) => paintDir(shard(b, d, w, l, 4, fl), sw, b, d, l, t0, t1);
  const fblade = (b, d, n, L, w, sw = P.flame, t0 = 0, t1 = 1, th = 0.018, shape = FLAME_SHAPE) =>
    paintDir(blade(b, d, n, L, w, th, shape), sw, b, d, L, t0, t1);

  // ================= BODY (golden egg, chest puffed forward) =================
  C.push(gold(hull([
    ...ring(V(0, 0.36, -0.26), 0.11, 0.09, 10, 'z'),
    ...ring(V(0, 0.37, -0.17), 0.2, 0.165, 10, 'z'),
    ...ring(V(0, 0.39, -0.03), 0.235, 0.185, 10, 'z'),
    ...ring(V(0, 0.43, 0.08), 0.23, 0.195, 10, 'z'),
    ...ring(V(0, 0.49, 0.15), 0.19, 0.17, 10, 'z'),
    ...ring(V(0, 0.55, 0.19), 0.12, 0.11, 10, 'z'),
  ]), 0.2, 0.66));
  C.push(gold(hull([...ring(V(0, 0.5, 0.06), 0.17, 0.15, 8, 'y'), ...ring(V(0, 0.7, 0.1), 0.14, 0.13, 8, 'y')]), 0.4, 0.85));

  // pale-gold chest bib: a puffed plate + 3 rows of broad layered feather shards (gold -> orange tips)
  C.push(paint(blob(1, V(0, 0.44, 0.18), V(0.17, 0.18, 0.1), { jitter: 0.12 }), P.bib, 'y', [0.26, 0.64]));
  const bibS = (b, d, w, l) => fshard(b, d, w, l, P.bib, 0.15, 1.0, 0.8);
  C.push(bibS(V(0, 0.33, 0.25), V(0, -1, 0.4), 0.07, 0.11));
  for (const [b, d, w, l] of [
    [V(0.075, 0.33, 0.24), V(0.3, -1, 0.4), 0.065, 0.105],
    [V(0.14, 0.35, 0.2), V(0.7, -1, 0.3), 0.06, 0.1],
    [V(0.11, 0.45, 0.25), V(0.5, -0.8, 0.8), 0.065, 0.095],
    [V(0.17, 0.46, 0.19), V(1, -0.7, 0.4), 0.06, 0.09],
    [V(0.12, 0.56, 0.22), V(0.6, -0.6, 0.8), 0.06, 0.085],
  ]) S.push(bibS(b, d, w, l));

  // ================= DESERT COLLAR (gold band, sandstone beads, lapis drops) =================
  C.push(paint(hull([...ring(V(0, 0.6, 0.11), 0.16, 0.16, 12, 'y', 0), ...ring(V(0, 0.65, 0.11), 0.145, 0.14, 12, 'y', 0)]), P.goldDk, 'y'));
  for (let k = 0; k < 4; k++) {
    const a = 0.32 * k; // 0 = front
    const sw = k % 2 ? P.sand : P.lapis;
    const pt = V(Math.sin(a) * 0.165, 0.6, 0.11 + Math.cos(a) * 0.165);
    const g = paintDir(shard(pt, V(Math.sin(a) * 0.3, -1, Math.cos(a) * 0.5), 0.028, 0.065, 4, 0.7), sw, pt, V(0, -1, 0), 0.065, 0, 0.8);
    (k === 0 ? C : S).push(g);
  }

  // ================= LAPIS PECTORAL with glowing sun rune (hangs from the collar) =================
  const PC = V(0, 0.5, 0), pk = 1.3;
  const pk2 = (arr) => arr.map(([u, v]) => [u * pk, v * pk]);
  C.push(paint(hull([...plate(pk2([[-0.075, 0.06], [0.075, 0.06], [0.07, -0.04], [0, -0.09], [-0.07, -0.04]]), PC, 0.2, 0.29)]), P.goldDk, 'y'));
  C.push(paint(hull([...plate(pk2([[-0.058, 0.045], [0.058, 0.045], [0.054, -0.032], [0, -0.072], [-0.054, -0.032]]), PC, 0.275, 0.302)]), P.lapis, 'y'));
  const RC = V(0, 0.505, 0);
  C.push(paint(hull(plate(ring(V(0, 0, 0), 0.026, 0.026, 8, 'z').map((p) => [p.x, p.y]), RC, 0.292, 0.316)), P.rune, 'flat'));
  const ray = (a) => { const d = V(Math.cos(a), Math.sin(a), 0);
    return paint(hull(plate([[0.034, -0.008], [0.06, 0], [0.034, 0.008]].map(([u, v]) => [u * d.x - v * d.y, u * d.y + v * d.x]), RC, 0.292, 0.312)), P.rune, 'flat'); };
  C.push(ray(Math.PI / 2)); C.push(ray(-Math.PI / 2));
  for (const a of [0.0, 0.75, -0.75]) S.push(ray(a));

  // ================= HEAD (big, golden) =================
  const hc0 = C.length, hs0 = S.length;
  const H = { y: 0.82, z: 0.13 };
  C.push(paint(hull([
    ...cbox(V(0, H.y, H.z), 0.17, 0.15, 0.15, 0.075),
    ...ring(V(0, H.y + 0.16, H.z - 0.01), 0.1, 0.09, 8, 'y'),
    V(0.17, H.y - 0.085, H.z + 0.02), V(-0.17, H.y - 0.085, H.z + 0.02),
  ]), P.head, 'y', [0.64, 1.0]));
  const FZ = H.z + 0.15;
  // cheek flame feathers sweeping back
  S.push(fshard(V(0.15, H.y - 0.04, H.z + 0.02), V(0.55, -0.45, -1), 0.075, 0.13, P.flameO, 0, 0.85, 0.7));
  S.push(fshard(V(0.12, H.y - 0.1, H.z - 0.06), V(0.4, -0.9, -0.7), 0.07, 0.12, P.flameO, 0, 0.85, 0.7));
  C.push(fshard(V(0, H.y - 0.04, H.z - 0.13), V(0, -0.8, -0.6), 0.08, 0.1, P.flameO, 0, 0.85, 0.7));
  // back-of-head flame feathers lying flat, pointing down (stay in front of the halo plane)
  C.push(fshard(V(0, H.y + 0.1, H.z - 0.13), V(0, -1, -0.25), 0.085, 0.13, P.flameO, 0, 0.85, 0.5));
  S.push(fshard(V(0.09, H.y + 0.08, H.z - 0.12), V(0.25, -1, -0.25), 0.075, 0.13, P.flameO, 0, 0.85, 0.5));

  // beak: gold -> orange hooked
  const BY = H.y - 0.04;
  const beakP = (g) => paint(g, P.beak, 'y', [BY - 0.15, BY + 0.04]);
  C.push(beakP(hull([
    ...plate([[-0.08, 0.035], [0.08, 0.035], [0.085, -0.055], [0.055, -0.09], [-0.055, -0.09], [-0.085, -0.055]], V(0, BY, 0), FZ - 0.05, FZ - 0.02),
    V(0.045, BY + 0.02, FZ + 0.06), V(-0.045, BY + 0.02, FZ + 0.06),
    V(0.032, BY, FZ + 0.13), V(-0.032, BY, FZ + 0.13),
    V(0.042, BY - 0.065, FZ + 0.08), V(-0.042, BY - 0.065, FZ + 0.08),
    V(0.024, BY - 0.05, FZ + 0.165), V(-0.024, BY - 0.05, FZ + 0.165),
  ])));
  C.push(beakP(hull([
    V(0.024, BY - 0.04, FZ + 0.165), V(-0.024, BY - 0.04, FZ + 0.165),
    V(0.032, BY - 0.065, FZ + 0.1), V(-0.032, BY - 0.065, FZ + 0.1),
    V(0, BY - 0.16, FZ + 0.15), V(0.012, BY - 0.13, FZ + 0.13), V(-0.012, BY - 0.13, FZ + 0.13),
  ])));
  C.push(paint(hull([
    ...plate([[-0.055, 0], [0.055, 0], [0.045, -0.035], [-0.045, -0.035]], V(0, BY - 0.08, 0), FZ - 0.035, FZ - 0.01),
    V(0.024, BY - 0.085, FZ + 0.06), V(-0.024, BY - 0.085, FZ + 0.06), V(0, BY - 0.1, FZ + 0.045),
  ]), P.beakDk, 'y'));
  S.push(paint(hull(cbox(V(0.03, BY + 0.012, FZ + 0.055), 0.01, 0.006, 0.012, 0.003)), P.mouth, 'flat'));

  // fierce eyes
  const E = V(0.09, H.y + 0.035, 0), es = 1.65;
  const sc = (arr) => arr.map(([u, v]) => [u * es, v * es]);
  S.push(flat(hull(plate(sc([[-0.036, 0.0], [0.044, 0.03], [0.05, -0.008], [0.02, -0.036], [-0.026, -0.032], [-0.04, -0.016]]),
    E, FZ - 0.014, FZ + 0.008, 0.35)), P.white));
  S.push(flat(hull(plate(sc([[-0.026, 0.0], [0.014, 0.017], [0.022, -0.008], [0.006, -0.03], [-0.02, -0.028], [-0.03, -0.012]]),
    V(E.x - 0.006, E.y, 0), FZ + 0.0, FZ + 0.014, 0.35)), P.eye));
  S.push(flat(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.004, E.y + 0.004, 0), FZ + 0.006, FZ + 0.019, 0.35)), P.white));
  // heavy brow (flame orange), slanting down to the beak
  S.push(paint(hull([
    V(0.02, E.y + 0.016, FZ + 0.034), V(0.023, E.y + 0.062, FZ + 0.02),
    V(0.18, E.y + 0.07, FZ - 0.05), V(0.18, E.y + 0.112, FZ - 0.066),
    V(0.02, E.y + 0.016, FZ - 0.03), V(0.023, E.y + 0.072, FZ - 0.04),
    V(0.18, E.y + 0.07, FZ - 0.1), V(0.18, E.y + 0.112, FZ - 0.11),
  ]), P.brow, 'y'));
  // glowing forehead mark
  C.push(paint(hull(plate([[0, 0.03], [0.02, 0], [0, -0.025], [-0.02, 0]], V(0, H.y + 0.115, 0), FZ - 0.075, FZ - 0.05, 0.0).map((p) => p)), P.rune, 'flat'));

  // ================= SUN-DISC CROWN (gold rim, red sun, lapis base) =================
  const SD = V(0, H.y + 0.27, H.z - 0.02);
  C.push(paint(hull([...ring(V(0, H.y + 0.15, H.z - 0.01), 0.09, 0.08, 8, 'y'), ...ring(V(0, H.y + 0.19, H.z - 0.01), 0.07, 0.06, 8, 'y')]), P.lapis, 'y'));
  C.push(paint(hull([...ring(SD, 0.11, 0.11, 12, 'z', 0).map((p) => add(p, V(0, 0, 0.022))), ...ring(SD, 0.11, 0.11, 12, 'z', 0).map((p) => add(p, V(0, 0, -0.022)))]), P.goldDk, 'y'));
  C.push(paint(hull([...ring(SD, 0.075, 0.075, 12, 'z', 0).map((p) => add(p, V(0, 0, 0.034))), ...ring(SD, 0.075, 0.075, 12, 'z', 0).map((p) => add(p, V(0, 0, -0.034)))]), P.sun, 'y'));
  // uraeus-style gold horns cradling the disc
  S.push(paint(tube(curveSamples([V(0.05, H.y + 0.17, H.z - 0.01), V(0.12, H.y + 0.22, H.z - 0.01), V(0.135, H.y + 0.32, H.z - 0.01), V(0.1, H.y + 0.4, H.z - 0.01)], 6,
    (t) => 0.03 - 0.022 * t), { seg: 6, axis: V(0, 0, 1), capEnd: 0.02 }), P.goldDk, 'len'));

  // ================= FIERY CREST (flame shards up and back, behind the disc) =================
  // tall centre flame behind the disc + side flames fanning out like a fiery mohawk
  C.push(fshard(V(0, H.y + 0.12, H.z - 0.07), V(0, 1, -0.2), 0.08, 0.34, P.flame, 0.0, 1, 0.7));
  C.push(fshard(V(0, H.y + 0.1, H.z - 0.1), V(0, 0.8, -0.45), 0.075, 0.16, P.flame, 0.0, 1, 0.7));
  for (const [x, y, z, d, w, l] of [
    [0.05, 0.13, -0.06, V(0.45, 1, -0.2), 0.07, 0.3],
    [0.08, 0.11, -0.08, V(0.85, 0.8, -0.25), 0.065, 0.24],
    [0.11, 0.09, -0.01, V(1, 0.55, -0.05), 0.06, 0.18],
  ]) S.push(fshard(V(x, H.y + y, H.z + z), d, w, l, P.flame, 0.0, 1, 0.7));

  // ================= GLOWING HALO RING (floating behind the head) =================
  const HC = V(0, H.y + 0.15, H.z - 0.29), R0 = 0.31, R1 = 0.38, NH = 16, TH = 0.03;
  for (let k = 0; k < NH; k++) {
    const a0 = (2 * Math.PI * k) / NH, a1 = (2 * Math.PI * (k + 1)) / NH;
    const pts = [];
    for (const a of [a0, a1]) for (const r of [R0, R1]) for (const z of [-TH, TH])
      pts.push(V(HC.x + Math.cos(a) * r, HC.y + Math.sin(a) * r, HC.z + z));
    const g = paint(hull(pts), P.halo, 'y', [HC.y - R1, HC.y + R1]);
    // keep it exactly symmetric: centre-line segments only for those spanning x=0, others mirrored
    const cx = Math.cos((a0 + a1) / 2);
    if (cx > 1e-6) S.push(g); else if (Math.abs(cx) < 1e-6) C.push(g);
  }

  {
    const HS = 1.15, piv = V(0, 0.64, 0.12);
    for (const g of [...C.slice(hc0), ...S.slice(hs0)]) {
      g.translate(-piv.x, -piv.y, -piv.z); g.scale(HS, HS, HS); g.translate(piv.x, piv.y, piv.z);
    }
  }

  // ================= LEGS (sturdy, flame-feathered thighs, gold shanks & talons) =================
  const legX = 0.1;
  S.push(gold(blob(1, V(legX + 0.01, 0.26, -0.01), V(0.1, 0.105, 0.11), { jitter: 0.15 }), 0.15, 0.4));
  for (const [b, d] of [
    [V(legX + 0.07, 0.27, 0.035), V(0.35, -1, 0.3)],
    [V(legX + 0.075, 0.27, -0.06), V(0.35, -1, -0.3)],
    [V(legX + 0.01, 0.27, 0.085), V(0, -1, 0.4)],
  ]) S.push(fshard(b, d, 0.07, 0.11, P.flameO, 0, 0.8, 0.75));
  S.push(paint(hull([...ring(V(legX, 0.2, -0.005), 0.055, 0.055, 6), ...ring(V(legX + 0.003, 0.12, 0.005), 0.052, 0.052, 6),
    ...ring(V(legX + 0.005, 0.04, 0.02), 0.047, 0.047, 6)]), P.goldDk, 'y', [0, 0.22]));
  // sandstone + lapis ankle cuff
  S.push(paint(hull([...ring(V(legX + 0.003, 0.115, 0.006), 0.064, 0.064, 6, 'y', 0), ...ring(V(legX + 0.003, 0.155, 0.0), 0.064, 0.064, 6, 'y', 0)]), P.sand, 'y'));
  S.push(paint(hull(cbox(V(legX + 0.003, 0.135, 0.07), 0.018, 0.018, 0.008, 0.005)), P.lapis, 'flat'));
  const foot = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.032, z), 0.052, 0.032, 0.052, 0.014)), P.goldDk, 'y', [0, 0.07]));
    for (const [dx, dz] of [[-0.06, 0.085], [0, 0.11], [0.06, 0.085]]) {
      S.push(paint(hull([...cbox(V(x + dx * 0.45, 0.026, z + dz * 0.45), 0.023, 0.026, 0.023, 0.008),
        ...cbox(V(x + dx, 0.022, z + dz), 0.021, 0.022, 0.017, 0.007)]), P.goldDk, 'y', [0, 0.07]));
      S.push(paint(shard(V(x + dx * 1.08, 0.02, z + dz + 0.012), V(dx, -0.45, 0.8), 0.017, 0.045), P.claw, 'flat'));
    }
    S.push(paint(hull(cbox(V(x, 0.022, z - 0.055), 0.019, 0.022, 0.03, 0.006)), P.goldDk, 'y', [0, 0.07]));
    S.push(paint(shard(V(x, 0.016, z - 0.085), V(0, -0.4, -1), 0.015, 0.035), P.claw, 'flat'));
  };
  foot(legX + 0.005, 0.03);

  // ================= WINGS (big, spread, flame feathers, gold edge, lapis gems, glowing lines) =================
  const SH = V(0.19, 0.56, -0.02), EL = V(0.32, 0.8, -0.1), WR = V(0.47, 1.04, -0.16), TP = V(0.66, 1.22, -0.26);
  const edgePts = [SH, EL, WR, TP];
  const edge = new THREE.CatmullRomCurve3(edgePts, false, 'centripetal');
  const WN = nrm(V(0.15, -0.05, 1)); // wing plane normal (mostly facing forward)
  S.push(paint(tube(curveSamples(edgePts, 10, (t) => 0.055 - 0.025 * t, (t) => 0.04 - 0.015 * t),
    { seg: 6, ref: V(0, 0, 1), capEnd: 0.04, capStart: 0.01 }), P.goldDk, 'len'));
  // flight feathers: fan from hanging down (inner) to pointing out (tip)
  const NF = 6, FW = 0.15;
  const WIDE = [[0, -0.42], [0, 0.42], [0.3, 0.5], [0.62, 0.34], [0.7, 0.42], [1, 0.0], [0.6, -0.38], [0.25, -0.5]];
  for (let i = 0; i < NF; i++) {
    const t = 0.12 + 0.88 * i / (NF - 1);
    const p = edge.getPoint(t);
    const a = -1.5 + 1.55 * Math.pow(t, 1.25); // angle in wing plane: -pi/2 = down, 0 = out
    const dir = nrm(V(Math.cos(a), Math.sin(a), -0.35));
    const L = 0.32 + 0.2 * t;
    S.push(fblade(add(p, WN, -0.03 - i * 0.004), dir, WN, L, FW, P.flame, 0.0, 1, 0.02, WIDE));
    // shorter orange secondaries layered in front
    S.push(fblade(add(p, WN, 0.0 - i * 0.004), dir, WN, L * 0.6, FW * 0.85, P.flameO, 0.0, 0.7, 0.02, WIDE));
    // back-side layer (lighter orange-gold) so the rear view stays bright
    S.push(fblade(add(p, WN, -0.06 - i * 0.004), dir, WN, L * 0.7, FW * 0.85, P.flameL, 0.0, 0.8, 0.02));
  }
  // extra wingtip primary
  S.push(fblade(add(TP, WN, -0.02), nrm(V(1, 0.35, -0.3)), WN, 0.3, 0.1, P.flame, 0.0, 1, 0.02, WIDE));
  // gold coverts on the back of the wing
  for (let i = 0; i < 5; i++) {
    const t = 0.15 + 0.75 * i / 4;
    const p = edge.getPoint(t);
    const a = -1.4 + 1.1 * t;
    const dir = nrm(V(Math.cos(a), Math.sin(a), -0.2));
    S.push(paintDir(blade(add(p, WN, -0.085 + i * 0.003), dir, WN, 0.17, 0.085, 0.02), P.flameL, p, dir, 0.17, 0.0, 0.5));
  }
  // gold coverts along the leading edge with glowing marking lines
  const NC = 6;
  for (let i = 0; i < NC; i++) {
    const t = 0.15 + 0.78 * i / (NC - 1);
    const p = edge.getPoint(t);
    const a = -1.4 + 1.1 * t;
    const dir = nrm(V(Math.cos(a), Math.sin(a), -0.2));
    S.push(paint(blade(add(p, WN, 0.022 - i * 0.003), dir, WN, 0.17, 0.08, 0.02), P.gold, 'flat'));
  }
  // glowing marking: a line running along the coverts + chevrons
  {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const t = 0.2 + 0.7 * i / 8;
      const p = edge.getPoint(t);
      const a = -1.4 + 1.1 * t;
      pts.push(add(add(p, V(Math.cos(a), Math.sin(a), 0), 0.085), WN, 0.038 - t * 0.024));
    }
    S.push(paint(tube(curveSamples(pts, 9, () => 0.012, () => 0.006), { seg: 4, ref: WN }), P.rune, 'flat'));
  }
  // lapis gems at the wrist and shoulder
  for (const [t, r] of [[0.66, 0.035], [0.05, 0.03]]) {
    const p = add(edge.getPoint(t), WN, 0.04);
    S.push(paint(hull([...ring(p, r, r, 6, 'z', 0), add(p, WN, 0.03), add(p, WN, -0.02)]), P.lapis, 'y'));
  }

  // ================= TAIL (long flowing flame plumes) =================
  const tblade = (pts, w, thick) => paint(tube(curveSamples(pts, 9,
    (t) => thick * (1 - 0.6 * t), (t) => w * Math.sin(Math.PI * (0.15 + 0.85 * t)) + 0.006),
    { seg: 4, axis: X }), P.flame, 'len');
  C.push(tblade([V(0, 0.4, -0.22), V(0, 0.36, -0.45), V(0, 0.3, -0.7), V(0, 0.32, -0.92), V(0, 0.42, -1.05)], 0.1, 0.03));
  S.push(tblade([V(0.04, 0.4, -0.22), V(0.1, 0.36, -0.42), V(0.17, 0.27, -0.62), V(0.22, 0.25, -0.82), V(0.25, 0.33, -0.95)], 0.09, 0.028));
  S.push(tblade([V(0.05, 0.42, -0.2), V(0.12, 0.44, -0.38), V(0.2, 0.46, -0.55), V(0.26, 0.54, -0.7), V(0.27, 0.66, -0.78)], 0.08, 0.026));
  C.push(tblade([V(0, 0.44, -0.2), V(0, 0.5, -0.38), V(0, 0.58, -0.55), V(0, 0.7, -0.66), V(0, 0.82, -0.68)], 0.085, 0.028));
  // tail base gold covert shards
  C.push(fshard(V(0, 0.45, -0.2), V(0, -0.2, -1), 0.06, 0.16, P.flameO, 0, 0.7));
  S.push(fshard(V(0.06, 0.43, -0.19), V(0.4, -0.3, -1), 0.055, 0.15, P.flameO, 0, 0.7));

  return assemble(C, S);
}

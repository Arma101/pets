// Lucky Ladybug (Robux egg, Lucky Egg): glossy red armoured ladybug with black clover-shaped spots,
// gold coins (shell crest, chest medallion, knee caps), gold horns, glowing four-leaf clover charms.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  shell:   { i: 0, top: '#FF7466', bot: '#BE101A' },
  shellHi: { i: 1, top: '#FFD2CC', bot: '#FF8A80' },
  black:   { i: 2, top: '#3E3946', bot: '#17141B' },
  spot:    { i: 3, top: '#1E1A22', bot: '#0E0C10' },
  gold:    { i: 4, top: '#FFE66E', bot: '#E09A12' },
  goldDk:  { i: 5, top: '#F6C431', bot: '#A86A08' },
  clover:  { i: 6, top: '#B8FF8A', bot: '#2FD34A', glow: true },
  white:   { i: 7, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:     { i: 8, top: '#1A1416', bot: '#0C0A0B' },
  cream:   { i: 9, top: '#FFF6E2', bot: '#E9D6B4' },
  helmet:  { i: 10, top: '#FF4A40', bot: '#A80E18' },
  mouth:   { i: 11, top: '#6A2A2A', bot: '#3A1414' },
};
const SW = PALETTE;

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);
const DEG = Math.PI / 180;

// ---------- shell ellipsoid ----------
const SH = { c: V(0, 0.37, -0.07), a: 0.35, b: 0.33, cz: 0.43 };
// th: angle from the top toward +x (0..~100deg), ph: along the body (-90 back .. +90 front)
const shellPt = (th, ph, grow = 0) => V(
  SH.c.x + (SH.a + grow) * Math.cos(ph) * Math.sin(th),
  SH.c.y + (SH.b + grow) * Math.cos(ph) * Math.cos(th),
  SH.c.z + (SH.cz + grow) * Math.sin(ph));
const shellN = (th, ph) => {
  const p = shellPt(th, ph).sub(SH.c);
  return nrm(V(p.x / (SH.a * SH.a), p.y / (SH.b * SH.b), p.z / (SH.cz * SH.cz)));
};

// flat decal prism in the tangent plane at p (normal n): pts2d in (t1, t2) coords
function decalFlat(p, n, pts2d, lo = -0.016, hi = 0.007, rot = 0) {
  const up = Math.abs(n.y) > 0.95 ? V(0, 0, 1) : V(0, 1, 0);
  let t1 = nrm(cross(up, n)), t2 = nrm(cross(n, t1));
  const c = Math.cos(rot), s = Math.sin(rot);
  const r1 = add(t1.clone().multiplyScalar(c), t2, s), r2 = add(t2.clone().multiplyScalar(c), t1, -s);
  const pts = [];
  for (const [u, v] of pts2d) for (const h of [lo, hi]) pts.push(add(add(add(p, r1, u), r2, v), n, h));
  return hull(pts);
}
// decal conformed to the shell: tangent-plane points projected onto the ellipsoid, then pushed along its normal
const projShell = (q) => {
  const d = q.clone().sub(SH.c);
  const k = 1 / Math.sqrt((d.x / SH.a) ** 2 + (d.y / SH.b) ** 2 + (d.z / SH.cz) ** 2);
  return add(SH.c, d, k);
};
const normAt = (p) => { const d = p.clone().sub(SH.c); return nrm(V(d.x / (SH.a * SH.a), d.y / (SH.b * SH.b), d.z / (SH.cz * SH.cz))); };
let SHELL_MESH = null; // set once the faceted shell hull exists
const RC = new THREE.Raycaster();
function onFacets(q) {
  const d = nrm(q.clone().sub(SH.c));
  if (SHELL_MESH) {
    RC.set(SH.c, d);
    const hits = RC.intersectObject(SHELL_MESH, false);
    const hit = hits[hits.length - 1]; // the outer (exit) facet; the ray starts outside the inner seam wall
    if (hit) return { q: hit.point.clone(), m: hit.face.normal.clone() };
  }
  const pq = projShell(q); return { q: pq, m: normAt(pq) };
}
function shellDecal(p, n, pts2d, lo = -0.016, hi = 0.005) {
  const up = Math.abs(n.y) > 0.95 ? V(0, 0, 1) : V(0, 1, 0);
  const t1 = nrm(cross(up, n)), t2 = nrm(cross(n, t1));
  const pts = [];
  for (const [u, v] of pts2d) {
    const { q, m } = onFacets(add(add(p, t1, u), t2, v));
    pts.push(add(q, m, lo), add(q, m, hi));
  }
  return hull(pts);
}
const decal = decalFlat;
const ngon = (cx, cy, r, k, ph = 0) => Array.from({ length: k }, (_, i) =>
  [cx + Math.cos(ph + (2 * Math.PI * i) / k) * r, cy + Math.sin(ph + (2 * Math.PI * i) / k) * r]);

// four-leaf clover: four heart leaves (two notched lobes each) meeting at the centre, plus a short stem
function clover(p, n, R, sw, lo, hi, rot = Math.PI / 4, stem = true, decal = decalFlat) {
  const out = [];
  for (let k = 0; k < 4; k++) {
    const a = rot + (k * Math.PI) / 2;
    for (const side of [-1, 1]) {
      const b = a + side * 0.3;
      const cx = Math.cos(b) * R * 0.6, cy = Math.sin(b) * R * 0.6;
      out.push(paint(decal(p, n, [...ngon(cx, cy, R * 0.25, 6, b), [Math.cos(a) * R * 0.05, Math.sin(a) * R * 0.05]], lo, hi), sw, 'flat'));
    }
  }
  if (stem) {
    const a = rot + Math.PI / 4 + Math.PI, w = R * 0.07, l = R * 0.95;
    const ca = Math.cos(a), sa = Math.sin(a);
    out.push(paint(decal(p, n, [[-sa * w, ca * w], [sa * w, -ca * w], [ca * l + sa * w * 0.6, sa * l - ca * w * 0.6], [ca * l - sa * w * 0.6, sa * l + ca * w * 0.6]], lo, hi), sw, 'flat'));
  }
  return out;
}

// coin: faceted gold disk facing direction n, with a raised rim and a glowing clover emboss
function coin(c0, n, r, th, C_or_S, withClover = true) {
  const pts = [];
  const up = Math.abs(n.y) > 0.95 ? V(0, 0, 1) : V(0, 1, 0);
  const t1 = nrm(cross(up, n)), t2 = nrm(cross(n, t1));
  for (let k = 0; k < 10; k++) {
    const a = (2 * Math.PI * k) / 10 + Math.PI / 10;
    const rim = add(add(c0, t1, Math.cos(a) * r), t2, Math.sin(a) * r);
    pts.push(add(rim, n, -th), add(rim, n, th * 0.6));
    pts.push(add(add(add(c0, t1, Math.cos(a) * r * 0.82), t2, Math.sin(a) * r * 0.82), n, th));
  }
  C_or_S.push(paint(hull(pts), SW.gold, 'flat'));
  // inner face slightly darker disc
  C_or_S.push(paint(decal(add(c0, n, th), n, ngon(0, 0, r * 0.7, 10, Math.PI / 10), -0.004, 0.003), SW.goldDk, 'flat'));
  if (withClover) for (const g of clover(add(c0, n, th + 0.003), n, r * 0.55, SW.clover, -0.004, 0.004, 0)) C_or_S.push(g);
}

export function buildGeometry() {
  const C = [], S = [];
  const DY = -0.075; // body parts are modelled high, then dropped by DY onto the short legs

  // ================= UNDERBODY (black, hidden mostly under the shell) =================
  C.push(paint(hull([
    ...ring(V(0, 0.27, -0.42), 0.12, 0.09, 8, 'z'),
    ...ring(V(0, 0.25, -0.25), 0.25, 0.12, 8, 'z'),
    ...ring(V(0, 0.25, 0.05), 0.26, 0.12, 8, 'z'),
    ...ring(V(0, 0.28, 0.27), 0.2, 0.11, 8, 'z'),
  ]), SW.black, 'y', [0.12, 0.42]));

  // ================= ELYTRA (glossy split red shell, right half mirrored) =================
  const ths = [0.5, 18, 36, 54, 72, 90, 104].map((d) => d * DEG);
  const phs = [-90, -64, -38, -12, 14, 40, 62].map((d) => d * DEG);
  const shellPts = [];
  for (const th of ths) for (const ph of phs) {
    const p = shellPt(th, ph);
    p.x = Math.max(p.x, 0.008);
    shellPts.push(p);
  }
  const shellGeo = paint(hull(shellPts), SW.shell, 'y', [0.3, 0.72]);
  S.push(shellGeo);
  SHELL_MESH = new THREE.Mesh(shellGeo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  // dark seam filler between the elytra (no see-through gap)
  {
    const pts = [];
    for (const ph of [-88, -64, -38, -12, 14, 40, 62]) for (const x of [-0.009, 0.009]) {
      const p = shellPt(0, ph * DEG, -0.006); p.x = x; pts.push(p, V(x, SH.c.y - 0.04, SH.c.z + (p.z - SH.c.z) * 0.8));
    }
    C.push(paint(hull(pts), SW.spot, 'flat'));
  }
  // gold trim along the lower shell edge
  const rimPath = phs.map((ph) => shellPt(101 * DEG, ph, 0.004));
  S.push(paint(tube(rimPath.map((p) => ({ p, rx: 0.02, ry: 0.016 })), { seg: 5, axis: V(0, 1, 0), capStart: 0.0, capEnd: 0.01 }), SW.gold, 'flat'));
  // glowing clover-green gem studs set into the gold rim
  for (const ph of [-60, 34]) {
    const p = shellPt(100 * DEG, ph * DEG, 0.022);
    S.push(paint(blob(0, p, V(0.022, 0.022, 0.022)), SW.clover, 'y'));
  }
  // glowing four-leaf clover charm on each half's gold trim (mid side, facing out)
  {
    const ph = -12 * DEG, p = shellPt(97 * DEG, ph, 0.02), n = nrm(add(shellN(97 * DEG, ph), V(0, 0.25, 0)));
    for (const g of clover(p, n, 0.062, SW.clover, -0.03, 0.008, Math.PI / 4, false)) S.push(g);
  }
  // clover spots conformed to the dome: front, outer-mid, rear (kept off the rim)
  for (const [th, ph, R, r] of [[46, 22, 0.1, 0.2], [64, -14, 0.09, 0.5], [36, -42, 0.1, -0.1]]) {
    const p = shellPt(th * DEG, ph * DEG), n = shellN(th * DEG, ph * DEG);
    for (const g of clover(p, n, R, SW.spot, -0.02, 0.006, Math.PI / 4 + r, true, shellDecal)) S.push(g);
  }
  // scutellum crest: gold coin at the front of the seam
  {
    const th = 0, ph = 46 * DEG;
    const p = shellPt(th, ph, 0.012), n = shellN(th, ph);
    coin(p, n, 0.075, 0.016, C);
  }

  // ================= PRONOTUM (black collar) =================
  C.push(paint(hull([
    ...ring(V(0, 0.42, 0.22), 0.25, 0.16, 10, 'z'),
    ...ring(V(0, 0.44, 0.31), 0.22, 0.15, 10, 'z'),
    ...ring(V(0, 0.42, 0.36), 0.15, 0.11, 10, 'z'),
  ]), SW.black, 'y', [0.28, 0.6]));

  const c0 = C.length, s0 = S.length;
  // ================= HEAD (big, black, red armoured helmet) =================
  const H = { y: 0.45, z: 0.42 };
  const hx = 0.215, hy = 0.162, hz = 0.145;
  C.push(paint(hull([
    ...cbox(V(0, H.y, H.z), hx, hy, hz, 0.06),
    ...ring(V(0, H.y + hy + 0.0, H.z - 0.01), 0.12, 0.09, 8, 'y'),
    V(0.21, H.y - 0.08, H.z + 0.07), V(-0.21, H.y - 0.08, H.z + 0.07),
  ]), SW.black, 'y', [0.28, 0.66]));
  const FZ = H.z + hz;
  // muzzle plate, mouth line, small gold mandibles
  C.push(paint(hull([...cbox(V(0, H.y - 0.09, FZ - 0.002), 0.11, 0.05, 0.03, 0.024),
    V(0.06, H.y - 0.035, FZ - 0.01), V(-0.06, H.y - 0.035, FZ - 0.01)]), SW.black, 'y', [0.3, 0.5]));
  C.push(paint(hull(cbox(V(0, H.y - 0.1, FZ + 0.031), 0.05, 0.005, 0.004, 0.002)), SW.mouth, 'flat'));
  S.push(paint(hull([V(0.03, H.y - 0.115, FZ + 0.04), V(0.075, H.y - 0.11, FZ + 0.02), V(0.07, H.y - 0.135, FZ + 0.02),
    V(0.03, H.y - 0.15, FZ + 0.045), V(0.05, H.y - 0.125, FZ + 0.0)]), SW.gold, 'flat'));

  // fierce eyes: white almond with angry flat top, big black pupil, catchlight
  const E = V(0.1, H.y + 0.02, 0);
  const es = 1.32;
  const sc = (arr) => arr.map(([u, v]) => [u * es, v * es]);
  S.push(paint(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.01, FZ + 0.012)), SW.white, 'flat'));
  S.push(paint(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.008, E.y + 0.003, 0), FZ + 0.014, FZ + 0.021)), SW.white, 'flat'));

  // red helmet: cap over the crown with heavy V brow over the eyes
  C.push(paint(hull([
    ...ring(V(0, H.y + hy + 0.045, H.z - 0.02), 0.13, 0.1, 8, 'y'),
    ...ring(V(0, H.y + hy - 0.01, H.z - 0.04), 0.225, 0.155, 10, 'y'),
    ...ring(V(0, H.y + hy + 0.012, H.z + 0.01), 0.205, 0.14, 10, 'y'),
    V(0, E.y + 0.04, FZ + 0.03), V(0.03, E.y + 0.048, FZ + 0.03), V(-0.03, E.y + 0.048, FZ + 0.03),
    V(0.18, E.y + 0.085, FZ + 0.012), V(-0.18, E.y + 0.085, FZ + 0.012),
    V(0.225, E.y + 0.075, FZ - 0.04), V(-0.225, E.y + 0.075, FZ - 0.04),
    V(0, E.y + 0.06, FZ - 0.03),
    // cheek guards wrapping down the sides of the head
    V(hx + 0.014, H.y - 0.03, FZ - 0.07), V(-hx - 0.014, H.y - 0.03, FZ - 0.07),
    V(hx + 0.014, H.y - 0.03, H.z - 0.11), V(-hx - 0.014, H.y - 0.03, H.z - 0.11),
  ]), SW.helmet, 'y', [0.48, 0.68]));
  // gold brow trim strip along the brow edge
  S.push(paint(hull([
    V(0.0, E.y + 0.03, FZ + 0.036), V(0.0, E.y + 0.05, FZ + 0.04),
    V(0.19, E.y + 0.074, FZ + 0.016), V(0.19, E.y + 0.096, FZ + 0.02),
    V(0.0, E.y + 0.03, FZ + 0.012), V(0.19, E.y + 0.074, FZ - 0.01),
  ]), SW.gold, 'flat'));
  // gold coin crest with a glowing clover on the forehead
  coin(V(0, E.y + 0.114, FZ + 0.022), nrm(V(0, 0.5, 1)), 0.05, 0.014, C);
  // chunky gold horns on the helmet
  S.push(paint(tube(curveSamples([V(0.1, H.y + hy - 0.035, H.z + 0.03), V(0.15, H.y + hy + 0.06, H.z + 0.05), V(0.18, H.y + hy + 0.12, H.z + 0.02)],
    5, (t) => 0.048 * (1 - t) + 0.004), { seg: 6, capEnd: 0.014 }), SW.gold, 'len'));
  // antennae: short segmented, gold club tips
  S.push(paint(tube(curveSamples([V(0.05, H.y + hy + 0.03, H.z + 0.08), V(0.065, H.y + hy + 0.1, H.z + 0.14), V(0.095, H.y + hy + 0.145, H.z + 0.2)],
    5, () => 0.014), { seg: 5 }), SW.black, 'y'));
  S.push(paint(blob(0, V(0.1, H.y + hy + 0.16, H.z + 0.215), V(0.032, 0.03, 0.032)), SW.gold, 'y'));

  // ================= CHEST MEDALLION (gold coin under the chin) =================
  coin(V(0, H.y - hy - 0.035, FZ - 0.05), nrm(V(0, 0.2, 1)), 0.06, 0.014, C);
  C.push(paint(hull([...cbox(V(0, H.y - hy + 0.0, FZ - 0.08), 0.03, 0.04, 0.03, 0.01)]), SW.goldDk, 'flat'));

  // big head: scale the whole head group up ~15% about its lower back
  const HP = V(0, H.y - hy, H.z - 0.05), HK = 1.15;
  for (const g of [...C.slice(c0), ...S.slice(s0)]) { g.translate(-HP.x, -HP.y, -HP.z); g.scale(HK, HK, HK); g.translate(HP.x, HP.y, HP.z); }
  for (const g of [...C, ...S]) g.translate(0, DY, 0);

  // ================= LEGS (6 short thick black legs, gold coin knee caps, gold claws) =================
  const legs = [
    { root: V(0.15, 0.19, 0.22), knee: V(0.31, 0.2, 0.32), foot: V(0.33, 0.0, 0.4) },
    { root: V(0.17, 0.18, 0.0), knee: V(0.35, 0.19, 0.02), foot: V(0.4, 0.0, 0.03) },
    { root: V(0.15, 0.19, -0.22), knee: V(0.32, 0.2, -0.3), foot: V(0.35, 0.0, -0.37) },
  ];
  for (const L of legs) {
    S.push(paint(tube([{ p: L.root, rx: 0.06, ry: 0.06 }, { p: L.knee, rx: 0.064, ry: 0.064 }], { seg: 6, capEnd: 0.035 }), SW.black, 'y', [0.05, 0.3]));
    const ankle = V(L.foot.x, 0.06, L.foot.z);
    S.push(paint(tube([{ p: L.knee, rx: 0.058, ry: 0.058 }, { p: ankle, rx: 0.048, ry: 0.048 }], { seg: 6, capStart: 0.02 }), SW.black, 'y', [0.0, 0.3]));
    // knee coin cap
    const out = nrm(V(L.knee.x, 0.3, L.knee.z * 0.6));
    coin(add(L.knee, out, 0.058), out, 0.045, 0.012, S, false);
    // foot: gold claw block + two toes
    const fwd = nrm(V(L.foot.x * 0.4, 0, L.foot.z >= 0 ? 1 : -0.3));
    S.push(paint(hull(cbox(V(ankle.x, 0.032, ankle.z), 0.054, 0.032, 0.054, 0.016)), SW.gold, 'y', [0, 0.07]));
    const side = cross(V(0, 1, 0), fwd);
    for (const s of [-1, 1]) {
      S.push(paint(shard(add(add(V(ankle.x, 0.022, ankle.z), side, s * 0.026), fwd, 0.035), add(fwd, V(0, -0.2, 0)), 0.02, 0.05), SW.goldDk, 'flat'));
    }
  }

  return assemble(C, S);
}

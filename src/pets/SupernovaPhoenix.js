// Supernova Phoenix (DIVINE): magenta/cyan cosmic phoenix, star-tipped exploding wings, radiant crest, gold halo + armor.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// ---- custom swatch painters (starry nebula cells) ----
function rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
function star4(g, x, y, r, col) {
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(x, y - r); g.lineTo(x + r * 0.28, y - r * 0.28); g.lineTo(x + r, y); g.lineTo(x + r * 0.28, y + r * 0.28);
  g.lineTo(x, y + r); g.lineTo(x - r * 0.28, y + r * 0.28); g.lineTo(x - r, y); g.lineTo(x - r * 0.28, y - r * 0.28);
  g.closePath(); g.fill();
}
function nebulaCell(stops, blobs, seed, nStars) {
  return (g, x, y) => {
    const grad = g.createLinearGradient(0, y + 16, 0, y + 112);
    stops.forEach(([o, c]) => grad.addColorStop(o, c));
    g.fillStyle = stops[0][1]; g.fillRect(x, y, 128, 16);
    g.fillStyle = grad; g.fillRect(x, y + 16, 128, 96);
    g.fillStyle = stops[stops.length - 1][1]; g.fillRect(x, y + 112, 128, 16);
    for (const [bx, by, br, col] of blobs) {
      const rg = g.createRadialGradient(x + bx, y + by, 0, x + bx, y + by, br);
      rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg; g.fillRect(x, y, 128, 128);
    }
    const r = rng(seed);
    for (let k = 0; k < nStars; k++) {
      const sx = x + 26 + r() * 76, sy = y + 18 + r() * 92, big = r() < 0.3;
      star4(g, sx, sy, big ? 5.5 : 2.8, r() < 0.25 ? '#FFF2A0' : '#FFFFFF');
    }
  };
}

export const PALETTE = {
  body:   { i: 0, top: '#FF5CCF', bot: '#A01A9A', draw: nebulaCell(
    [[0, '#FF6AD5'], [0.55, '#D42AB4'], [1, '#8E1E9E']],
    [[45, 50, 26, 'rgba(120,90,255,0.45)'], [92, 86, 24, 'rgba(60,220,255,0.35)'], [70, 30, 18, 'rgba(255,170,240,0.4)']], 7, 26) },
  plume:  { i: 1, top: '#FF5AD2', bot: '#3FE6FF', draw: nebulaCell(
    [[0, '#FF3FC8'], [0.3, '#B048F0'], [0.58, '#28C8FF'], [1, '#A8FAFF']],
    [[64, 64, 30, 'rgba(255,255,255,0.15)']], 11, 12) },
  belly:  { i: 2, top: '#FFC2F0', bot: '#F27ACD' },
  gold:   { i: 3, top: '#FFEC80', bot: '#E09A12' },
  goldG:  { i: 4, top: '#FFE04A', bot: '#FFA800', glow: true },
  goldDk: { i: 5, top: '#F2B526', bot: '#A86A08' },
  cyan:   { i: 6, top: '#7DF4FF', bot: '#10BEF5', glow: true },
  star:   { i: 7, top: '#FFFFFF', bot: '#FFF1A6', glow: true },
  crest:  { i: 8, top: '#14C8FF', bot: '#9CFFFF', glow: true },
  beak:   { i: 9, top: '#FFE66A', bot: '#EE9414' },
  eye:    { i: 10, top: '#1A1416', bot: '#0C0A0B' },
  eyeW:   { i: 11, top: '#FFFFFF', bot: '#F1F1F4' },
  brow:   { i: 12, top: '#9A3BE6', bot: '#5A1696' },
  head:   { i: 13, top: '#FF7ADB', bot: '#C21FA6' },
  halo:   { i: 14, top: '#FFEA5A', bot: '#D98200', glow: true },
};
const P = PALETTE;

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);
const clamp = (v) => Math.min(1, Math.max(0, v));
const cellUV = (sw, u, t) => [((sw.i % 8) * 128 + 24 + clamp(u) * 80) / 1024, (Math.floor(sw.i / 8) * 128 + 16 + clamp(t) * 96) / 1024];
// per-vertex painter: f(p) -> [u, t]
function paintF(g, sw, f) {
  const p = g.attributes.position, uv = [];
  for (let i = 0; i < p.count; i++) uv.push(...cellUV(sw, ...f(V(p.getX(i), p.getY(i), p.getZ(i)))));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
// starry body mapping: gradient by height, u sweeps over the surface (mirror-safe through |x|)
const starry = (g, lo, hi, sw = P.body) => paintF(g, sw, (p) => [0.1 + Math.abs(p.x) * 1.6 + (p.z + 0.3) * 0.7, 1 - (p.y - lo) / (hi - lo)]);

// flat faceted feather blade in the plane spanned by dir and side (normal n)
const FSHAPE = [[0, -0.35], [0, 0.35], [0.25, 0.5], [0.72, 0.45], [1, 0], [0.72, -0.45], [0.25, -0.5]];
function feather(base, dir, n, L, w, th, sw, t0 = 0, t1 = 1, shape = FSHAPE) {
  const d = nrm(dir);
  const nn = nrm(add(n, d, -n.dot(d)));
  const s = nrm(cross(nn, d));
  const pts = [];
  for (const [u, v] of shape) {
    const p = add(add(base, d, u * L), s, v * w);
    const t = th * (u > 0.9 ? 0.5 : 1);
    pts.push(add(p, nn, t / 2), add(p, nn, -t / 2));
  }
  return paintF(hull(pts), sw, (p) => {
    const q = p.clone().sub(base);
    return [0.5 + q.dot(s) / (2 * w), t0 + (t1 - t0) * q.dot(d) / L];
  });
}

export function buildGeometry() {
  const C = [], S = [];
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= BODY (stocky egg, chest puffed) =================
  C.push(starry(hull([
    ...ring(V(0, 0.36, -0.26), 0.09, 0.08, 10, 'z'),
    ...ring(V(0, 0.37, -0.17), 0.175, 0.155, 10, 'z'),
    ...ring(V(0, 0.39, -0.04), 0.21, 0.18, 10, 'z'),
    ...ring(V(0, 0.43, 0.08), 0.205, 0.185, 10, 'z'),
    ...ring(V(0, 0.49, 0.16), 0.165, 0.165, 10, 'z'),
    ...ring(V(0, 0.55, 0.2), 0.1, 0.1, 10, 'z'),
  ]), 0.2, 0.68));
  // puffed chest
  C.push(paint(blob(1, V(0, 0.47, 0.14), V(0.155, 0.17, 0.13), { jitter: 0.1 }), P.belly, 'y', [0.3, 0.64]));
  // neck
  C.push(starry(hull([...ring(V(0, 0.5, 0.07), 0.15, 0.14, 8, 'y'), ...ring(V(0, 0.68, 0.1), 0.14, 0.13, 8, 'y')]), 0.4, 0.9));

  // ================= GOLD CHEST ARMOR =================
  const plateShape = [[-0.11, 0.1], [0.11, 0.1], [0.135, -0.0], [0.07, -0.11], [0, -0.155], [-0.07, -0.11], [-0.135, -0.0]];
  const chestPts = [];
  for (const [u, v] of plateShape) for (const dz of [0, 0.032]) chestPts.push(V(u, 0.47 + v, 0.255 + dz - 2.2 * u * u + 0.12 * v));
  C.push(paint(hull(chestPts), P.gold, 'y', [0.3, 0.6]));
  // glowing inner rim + cyan star gem
  const rimPts = [];
  for (const [u, v] of plateShape) for (const dz of [0.032, 0.042]) rimPts.push(V(u * 0.62, 0.47 + v * 0.62 + 0.005, 0.255 + dz - 2.2 * u * u * 0.62 + 0.12 * v * 0.62));
  C.push(flat(hull(rimPts), P.goldG));
  const gem = [];
  const gc = V(0, 0.478, 0.31);
  for (let k = 0; k < 8; k++) {
    const a = Math.PI / 2 + k * Math.PI / 4, r = k % 2 ? 0.022 : 0.058;
    gem.push(V(Math.cos(a) * r, gc.y + Math.sin(a) * r, gc.z), V(Math.cos(a) * r, gc.y + Math.sin(a) * r, gc.z - 0.02));
  }
  gem.push(V(0, gc.y, gc.z + 0.03));
  C.push(paint(hull(gem), P.cyan, 'y'));
  // gold gorget band at neck base
  const collar = (r, dy) => ring(V(0, 0, 0.09), r * 1.05, r, 12, 'y').map((p) => V(p.x, 0.62 + dy - 0.45 * (p.z - 0.09), p.z));
  C.push(paint(hull([...collar(0.15, 0), ...collar(0.15, -0.035)]), P.goldG, 'flat'));

  // ================= LEGS (magenta feather thighs, gold-armored shins, gold talons) =================
  const legX = 0.105, fz = 0.03;
  S.push(starry(blob(1, V(legX + 0.01, 0.26, -0.0), V(0.095, 0.1, 0.11), { jitter: 0.15 }), 0.15, 0.4));
  for (const [b, d] of [[V(legX + 0.07, 0.25, 0.04), V(0.3, -1, 0.25)], [V(legX + 0.07, 0.25, -0.06), V(0.3, -1, -0.3)],
    [V(legX + 0.01, 0.25, 0.09), V(0, -1, 0.35)]])
    S.push(feather(b, d, V(d.x * 3 + 0.4, 0, d.z * 3), 0.1, 0.05, 0.012, P.plume, 0.15, 0.55));
  S.push(paint(hull([...ring(V(legX, 0.19, fz - 0.01), 0.056, 0.056, 6), ...ring(V(legX + 0.003, 0.11, fz), 0.052, 0.052, 6),
    ...ring(V(legX + 0.005, 0.04, fz + 0.01), 0.048, 0.048, 6)]), P.gold, 'y', [0, 0.22]));
  // glowing leg bands
  S.push(flat(hull([...ring(V(legX + 0.001, 0.15, fz - 0.005), 0.066, 0.066, 6), ...ring(V(legX + 0.001, 0.18, fz - 0.008), 0.068, 0.068, 6)]), P.goldG));
  S.push(flat(hull([...ring(V(legX + 0.004, 0.07, fz + 0.006), 0.06, 0.06, 6), ...ring(V(legX + 0.004, 0.095, fz + 0.004), 0.062, 0.062, 6)]), P.goldG));
  S.push(paint(shard(V(legX + 0.003, 0.11, fz - 0.045), V(0, -0.2, -1), 0.016, 0.045), P.goldDk, 'flat')); // spur
  const foot = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.034, z), 0.056, 0.034, 0.055, 0.015)), P.gold, 'y', [0, 0.08]));
    for (const [dx, dz] of [[-0.062, 0.09], [0, 0.115], [0.062, 0.09]]) {
      S.push(paint(hull([...cbox(V(x + dx * 0.45, 0.028, z + dz * 0.45), 0.025, 0.028, 0.025, 0.009),
        ...cbox(V(x + dx, 0.024, z + dz), 0.022, 0.024, 0.018, 0.008)]), P.gold, 'y', [0, 0.08]));
      S.push(paint(shard(V(x + dx * 1.08, 0.022, z + dz + 0.014), V(dx, -0.45, 0.8), 0.018, 0.048), P.goldDk, 'flat'));
    }
    S.push(paint(hull(cbox(V(x, 0.024, z - 0.06), 0.02, 0.024, 0.032, 0.007)), P.gold, 'y', [0, 0.08]));
    S.push(paint(shard(V(x, 0.018, z - 0.092), V(0, -0.4, -1), 0.016, 0.04), P.goldDk, 'flat'));
  };
  foot(legX + 0.005, fz + 0.01);

  // ================= HEAD =================
  const c0 = C.length, s0 = S.length; // head parts (incl. crest + halo) get scaled up below
  const H = { y: 0.79, z: 0.13 };
  C.push(paint(hull([
    ...cbox(V(0, H.y, H.z), 0.168, 0.148, 0.148, 0.075),
    ...ring(V(0, H.y + 0.155, H.z - 0.01), 0.095, 0.085, 8, 'y'),
    V(0.165, H.y - 0.085, H.z + 0.02), V(-0.165, H.y - 0.085, H.z + 0.02),
  ]), P.head, 'y', [0.62, 1.0]));
  const FZ = H.z + 0.148;
  // cheek / nape feather plates
  for (const [b, d, n] of [
    [V(0.155, H.y - 0.05, H.z + 0.06), V(0.5, -0.8, -0.5), V(1, 0, 0.3)],
    [V(0.155, H.y - 0.01, H.z - 0.05), V(0.45, -0.45, -1), V(1, 0.2, -0.2)],
    [V(0.13, H.y - 0.1, H.z - 0.07), V(0.4, -1, -0.5), V(1, 0, -0.3)],
    [V(0.09, H.y + 0.05, H.z - 0.14), V(0.3, -0.5, -1), V(0.5, 0.3, -1)],
  ]) S.push(feather(b, d, n, 0.13, 0.058, 0.013, P.plume, 0.1, 0.8));
  C.push(feather(V(0, H.y + 0.0, H.z - 0.15), V(0, -0.6, -1), V(0, 0.3, -1), 0.13, 0.065, 0.013, P.plume, 0.05, 0.5));

  // hooked beak
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.035, FZ + 0.005), 0.078, 0.05, 0.022, 0.015),
    V(0.04, H.y + 0.0, FZ + 0.06), V(-0.04, H.y + 0.0, FZ + 0.06),
    V(0.026, H.y - 0.02, FZ + 0.13), V(-0.026, H.y - 0.02, FZ + 0.13),
    V(0.04, H.y - 0.075, FZ + 0.06), V(-0.04, H.y - 0.075, FZ + 0.06),
    V(0.024, H.y - 0.07, FZ + 0.13), V(-0.024, H.y - 0.07, FZ + 0.13),
  ]), P.beak, 'y', [H.y - 0.14, H.y + 0.0]));
  // hook: curls down over the lower mandible
  C.push(paint(hull([
    V(0.024, H.y - 0.022, FZ + 0.12), V(-0.024, H.y - 0.022, FZ + 0.12),
    V(0.016, H.y - 0.04, FZ + 0.175), V(-0.016, H.y - 0.04, FZ + 0.175),
    V(0.022, H.y - 0.075, FZ + 0.12), V(-0.022, H.y - 0.075, FZ + 0.12),
    V(0.008, H.y - 0.09, FZ + 0.17), V(-0.008, H.y - 0.09, FZ + 0.17),
    V(0, H.y - 0.14, FZ + 0.15),
  ]), P.beak, 'y', [H.y - 0.14, H.y + 0.0]));
  C.push(paint(hull([...cbox(V(0, H.y - 0.09, FZ + 0.02), 0.05, 0.02, 0.024, 0.008),
    V(0, H.y - 0.1, FZ + 0.11), V(0.014, H.y - 0.088, FZ + 0.1), V(-0.014, H.y - 0.088, FZ + 0.1)]), P.goldDk, 'flat'));

  // fierce eyes
  const E = V(0.088, H.y + 0.04, 0), ek = 1.25;
  const K = (a) => a.map(([u, v]) => [u * ek, v * ek]);
  S.push(flat(hull(plate(K([[-0.036, 0.004], [0.04, 0.03], [0.045, -0.01], [0.018, -0.036], [-0.026, -0.032], [-0.04, -0.014]]),
    E, FZ - 0.01, FZ + 0.01)), P.eyeW));
  S.push(flat(hull(plate(K([[-0.022, 0.004], [0.011, 0.016], [0.017, -0.007], [0.004, -0.024], [-0.016, -0.022], [-0.025, -0.009]]),
    V(E.x - 0.008, E.y - 0.002, 0), FZ + 0.005, FZ + 0.016)), P.eye));
  S.push(flat(hull(plate(K([[-0.006, -0.006], [0.006, -0.006], [0.006, 0.006], [-0.006, 0.006]]),
    V(E.x - 0.001, E.y + 0.003, 0), FZ + 0.012, FZ + 0.019)), P.eyeW));
  S.push(paint(hull([
    V(0.02, E.y + 0.012, FZ + 0.03), V(0.022, E.y + 0.05, FZ + 0.02),
    V(0.165, E.y + 0.052, FZ - 0.012), V(0.165, E.y + 0.092, FZ - 0.027),
    V(0.02, E.y + 0.012, FZ - 0.03), V(0.022, E.y + 0.06, FZ - 0.04),
    V(0.165, E.y + 0.052, FZ - 0.062), V(0.165, E.y + 0.097, FZ - 0.072),
  ]), P.brow, 'y'));

  // glowing cyan streaks flaring back from the eyes
  S.push(feather(V(0.158, E.y + 0.0, FZ - 0.05), V(0.45, 0.3, -1), V(1, 0, 0.15), 0.15, 0.03, 0.016, P.crest, 0, 1,
    [[0, -0.6], [0, 0.6], [0.5, 0.7], [1, 0], [0.5, -0.5]]));
  // ================= RADIANT CREST (fanned glowing shards) =================
  const X = V(1, 0, 0);
  const CSH = [[0, -0.6], [0, 0.6], [0.45, 0.8], [1, 0], [0.45, -0.8]];
  for (const [z, ang, L, w] of [[0.11, 0.7, 0.15, 0.05], [0.06, 0.3, 0.23, 0.06], [-0.01, -0.1, 0.29, 0.065],
    [-0.08, -0.55, 0.27, 0.062], [-0.13, -1.0, 0.22, 0.055]]) {
    const d = V(0, Math.cos(ang), Math.sin(ang));
    C.push(feather(V(0, H.y + 0.11, H.z + z), d, X, L, w, 0.055, P.crest, 0, 1, CSH));
  }
  for (const [z, ang, L, w, sp] of [[0.07, 0.4, 0.19, 0.055, 0.8], [-0.02, -0.15, 0.24, 0.06, 0.75], [-0.11, -0.7, 0.2, 0.055, 0.7],
    [0.0, 0.1, 0.17, 0.045, 1.1], [-0.08, -0.45, 0.16, 0.045, 1.1]]) {
    const d = V(sp, Math.cos(ang), Math.sin(ang));
    S.push(feather(V(0.04, H.y + 0.11, H.z + z), d, V(1, -sp * 0.8, 0), L, w, 0.026, sp > 1 ? P.plume : P.crest, 0, sp > 1 ? 0.95 : 1, CSH));
  }
  // gold diadem at the crest base
  C.push(paint(hull(cbox(V(0, H.y + 0.135, H.z - 0.0), 0.05, 0.03, 0.13, 0.015)), P.gold, 'flat'));

  // ================= GOLDEN HALO (floating, centre line, tilted back so the opening reads) =================
  const HC = V(0, H.y + 0.36, H.z - 0.06), HR = 0.14, HN = 16, tilt = -0.31;
  const ca = Math.cos(tilt), sa = Math.sin(tilt);
  for (let k = 0; k < HN; k++) {
    const pts = [];
    for (const a of [k * 2 * Math.PI / HN, (k + 1) * 2 * Math.PI / HN]) {
      const cx = Math.cos(a), cz = Math.sin(a);
      for (let j = 0; j < 6; j++) {
        const b = j * Math.PI / 3, r = HR + Math.cos(b) * 0.02, dy = Math.sin(b) * 0.022;
        const x = cx * r, y = dy, z = cz * r;
        pts.push(V(HC.x + x, HC.y + y * ca - z * sa, HC.z + y * sa + z * ca));
      }
    }
    C.push(paint(hull(pts), P.halo, 'y', [HC.y - 0.07, HC.y + 0.07]));
  }
  // scale the whole head group up ~11% about the neck joint
  {
    const piv = V(0, H.y - 0.15, H.z), k = 1.11;
    const grp = [...C.slice(c0), ...S.slice(s0)];
    for (const g of grp) {
      const q = g.attributes.position;
      for (let i = 0; i < q.count; i++)
        q.setXYZ(i, piv.x + (q.getX(i) - piv.x) * k, piv.y + (q.getY(i) - piv.y) * k, piv.z + (q.getZ(i) - piv.z) * k);
      g.computeVertexNormals();
    }
  }

  // ================= WINGS (raised, spread, exploding star-tipped feathers) =================
  const S0 = V(0.16, 0.56, -0.04), S1 = V(0.33, 0.78, -0.1), S2 = V(0.56, 0.98, -0.18);
  const armDir = nrm(S2.clone().sub(S0));
  const edge = (t) => t < 0.4 ? S0.clone().lerp(S1, t / 0.4) : S1.clone().lerp(S2, (t - 0.4) / 0.6);
  const fdir = (t) => nrm(V(0.12 + 0.95 * t, -1 + 1.25 * t, -0.3 - 0.05 * t));
  const wingN = (d) => { const n = nrm(cross(armDir, d)); if (n.z < 0) n.negate(); return n; };
  // pauldron + gold wing bone
  S.push(paint(hull([...ring(V(0.17, 0.6, -0.02), 0.075, 0.075, 7, 'x'), ...ring(V(0.23, 0.62, -0.03), 0.06, 0.06, 7, 'x'),
    V(0.2, 0.7, -0.03)]), P.gold, 'y', [0.5, 0.72]));
  S.push(paint(tube(curveSamples([S0, S1, S2], 8, (t) => 0.05 - 0.02 * t, (t) => 0.036 - 0.012 * t),
    { seg: 6, ref: V(0, 0, 1), capEnd: 0.045, capStart: 0.01 }), P.goldG, 'len'));
  S.push(paint(shard(add(S1, V(0, 0.02, 0)), V(-0.2, 1, 0.1), 0.028, 0.09), P.gold, 'flat'));
  S.push(paint(shard(add(S2, V(0.0, 0.01, 0)), V(0.6, 0.8, 0.0), 0.024, 0.08), P.gold, 'flat'));
  // primaries: magenta -> violet -> cyan, with star-coloured burst tips
  const NP = 11;
  const tipSw = [P.star, P.cyan, P.goldG];
  for (let i = 0; i < NP; i++) {
    const t = 0.05 + 0.95 * i / (NP - 1), d = fdir(t), n = wingN(d);
    const L = 0.24 + 0.24 * Math.sin(Math.PI * (0.25 + 0.6 * t));
    const b = add(edge(t), n, -0.02);
    S.push(feather(b, d, n, L, 0.068, 0.014, P.plume, 0.05, 0.92));
    S.push(paint(shard(add(b, d, L * 0.94), d, 0.03, 0.09, 4, 0.5), tipSw[i % 3], 'flat'));
  }
  // secondaries (violet-magenta)
  const NS = 9;
  for (let i = 0; i < NS; i++) {
    const t = 0.04 + 0.9 * i / (NS - 1), d = fdir(t), n = wingN(d);
    S.push(feather(add(add(edge(t), n, 0.018), d, 0.02), d, n, 0.2 + 0.1 * t, 0.066, 0.013, P.plume, 0.0, 0.55));
  }
  // coverts (starry magenta, shingled on top)
  const NC = 8;
  for (let i = 0; i < NC; i++) {
    const t = 0.04 + 0.9 * i / (NC - 1), d = fdir(t), n = wingN(d);
    const dc = add(d, n, 0.3); // lift the coverts off the feather plane for depth
    S.push(starry(feather(add(edge(t), n, 0.045), dc, n, 0.13 + 0.05 * t, 0.062, 0.02, P.plume), 0.4, 1.1));
  }

  // ================= TAIL (long flamboyant plumes trailing onto the ground) =================
  // 'len' gradient with u spread per vertex so the starry cell scatters over the plume (no stripe)
  const lenU = (g, sw) => { const tt = g.userData.t; let k = 0; delete g.userData.t;
    return paintF(g, sw, () => { const i = k++; return [0.5 + 0.45 * Math.cos(i * 1.7), tt[i]]; }); };
  const plume = (pts, w, thick) => lenU(tube(curveSamples(pts, 10,
    (t) => thick * (1 - 0.5 * t), (t) => w * Math.sin(Math.PI * (0.15 + 0.7 * t)) + 0.012),
    { seg: 4, axis: V(0, 1, 0), capEnd: 0.0, capStart: 0.0 }), P.plume);
  const tails = [
    { x: [0, 0, 0, 0, 0], w: 0.11, pts: [[0.4, -0.24], [0.3, -0.4], [0.14, -0.56], [0.045, -0.74], [0.07, -0.9]] },
    { x: [0.03, 0.08, 0.15, 0.22, 0.28], w: 0.1, pts: [[0.4, -0.23], [0.3, -0.37], [0.15, -0.5], [0.045, -0.64], [0.07, -0.78]] },
    { x: [0.05, 0.13, 0.24, 0.35, 0.44], w: 0.09, pts: [[0.42, -0.2], [0.32, -0.3], [0.17, -0.38], [0.05, -0.46], [0.075, -0.56]] },
  ];
  for (const tl of tails) {
    const pts = tl.pts.map(([y, z], i) => V(tl.x[i], y, z));
    const g = plume(pts, tl.w, 0.022);
    const last = pts[4], prev = pts[3];
    const tip = paint(shard(add(last, V(0, 0.01, 0)), nrm(last.clone().sub(prev).setY(0).normalize().add(V(0, 0.9, 0))), 0.055, 0.14, 4, 0.55), P.halo, 'y');
    if (tl.x[4] === 0) { C.push(g, tip); } else { S.push(g, tip); }
  }
  // upper tail coverts fanning from the rump
  C.push(feather(V(0, 0.5, -0.22), V(0, -0.3, -1), V(0, 1, -0.3), 0.2, 0.075, 0.014, P.plume, 0.0, 0.6));
  S.push(feather(V(0.07, 0.48, -0.2), V(0.5, -0.35, -1), V(0.3, 1, -0.3), 0.19, 0.07, 0.014, P.plume, 0.0, 0.6));

  return assemble(C, S);
}

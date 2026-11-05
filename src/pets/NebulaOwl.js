// Nebula Owl (SECRET): stocky purple owl, pink nebula feathers, big glowing eyes, starry wings, floating stars.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// starry nebula cell: deep violet sky, pink nebula clouds, white/gold stars. In the emissive pass
// (canvas pre-filled black, detected via the unused last cell) only the stars + faint nebula are drawn.
function starCell(g, x, y) {
  const glowPass = g.getImageData(1023, 1023, 1, 1).data[0] < 128;
  const rnd = (() => { let s = 7; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  if (!glowPass) {
    const gr = g.createLinearGradient(0, y, 0, y + 128);
    gr.addColorStop(0, '#6A45E0'); gr.addColorStop(1, '#2C1880');
    g.fillStyle = gr; g.fillRect(x, y, 128, 128);
  }
  for (const [cx, cy, r, a] of [[40, 30, 34, 0.75], [92, 70, 38, 0.7], [50, 100, 30, 0.6], [100, 20, 22, 0.55]]) {
    const rg = g.createRadialGradient(x + cx, y + cy, 0, x + cx, y + cy, r);
    rg.addColorStop(0, `rgba(255,110,230,${glowPass ? a * 0.35 : a})`); rg.addColorStop(1, 'rgba(255,110,230,0)');
    g.fillStyle = rg; g.fillRect(x, y, 128, 128);
  }
  for (let k = 0; k < 34; k++) {
    const sx = x + 24 + rnd() * 80, sy = y + 14 + rnd() * 100, s = rnd() < 0.25 ? 3 : 2;
    g.fillStyle = rnd() < 0.3 ? '#FFF2A0' : '#FFFFFF';
    g.fillRect(sx - s / 2, sy - s / 2, s, s);
  }
  for (const [cx, cy] of [[46, 40], [86, 88], [70, 24], [40, 92], [98, 52]]) { // 4-point sparkles
    g.fillStyle = '#FFFFFF';
    g.fillRect(x + cx - 1, y + cy - 6, 3, 13); g.fillRect(x + cx - 6, y + cy - 1, 13, 3);
  }
}

export const PALETTE = {
  body:   { i: 0, top: '#A066FF', bot: '#5A2BB8' },
  bodyD:  { i: 1, top: '#7A45E0', bot: '#3E1C8C' },
  belly:  { i: 2, top: '#F0D6FF', bot: '#C29AF5' },
  disc:   { i: 3, top: '#F7C8F2', bot: '#D99BEA' },
  pinkG:  { i: 4, top: '#FF9BE8', bot: '#FF2FB8', glow: true },
  pink:   { i: 5, top: '#FF86DE', bot: '#C8379F' },
  iris:   { i: 6, top: '#D8FFFF', bot: '#3FE6FF', glow: true },
  eye:    { i: 7, top: '#1A1030', bot: '#0A0614' },
  white:  { i: 8, top: '#FFFFFF', bot: '#F4F0FF' },
  brow:   { i: 9, top: '#6B3AD0', bot: '#33137A' },
  gold:   { i: 10, top: '#FFE46C', bot: '#E39E12' },
  goldDk: { i: 11, top: '#F6C431', bot: '#B9780C' },
  star:   { i: 12, top: '#FFFBD0', bot: '#FFD23C', glow: true },
  rim:    { i: 13, top: '#24104F', bot: '#120830' },
  sky:    { i: 14, draw: starCell, glow: true },
  claw:   { i: 15, top: '#3A2A5A', bot: '#1C1230' },
};
const P = PALETTE;

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const sub = (a, b) => a.clone().sub(b);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);

// planar UV into a swatch cell: f(p) -> [u, t] in 0..1
function paintPlanar(g, sw, f) {
  const p = g.attributes.position, uv = [];
  const x0 = (sw.i % 8) * 128, y0 = Math.floor(sw.i / 8) * 128;
  const a = V(0, 0, 0), b = V(0, 0, 0), c = V(0, 0, 0);
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    const n = sub(b, a).cross(sub(c, a)).normalize();
    for (const q of [a, b, c]) {
      if (Math.abs(n.x) < 0.55) { uv.push((x0 + 10) / 1024, (y0 + 118) / 1024); continue; } // edge faces: plain dark sky
      let [u, t] = f(q);
      u = THREE.MathUtils.clamp(u, 0, 1); t = THREE.MathUtils.clamp(t, 0, 1);
      uv.push((x0 + 24 + u * 80) / 1024, (y0 + 16 + t * 96) / 1024);
    }
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
// wing sky mapping: by z (back) and y (down), scaled so stars stay chunky
const skyUV = (p) => [(0.25 - p.z) / 0.55, (0.62 - p.y) / 0.6];

// flat feather blade (polygon prism) lying in plane with normal n
function blade(base, dir, n, L, w, th = 0.02, shape = null) {
  const d = nrm(dir);
  const nn = nrm(add(n, d, -n.dot(d)));
  const v = nrm(cross(nn, d));
  const pts2 = shape || [[0, -0.35], [0, 0.35], [0.25, 0.5], [0.75, 0.45], [1, 0], [0.75, -0.45], [0.25, -0.5]];
  const pts = [];
  for (const [u, s] of pts2) {
    const p = add(add(base, d, u * L), v, s * w);
    const t = th * (u > 0.9 ? 0.6 : 1);
    pts.push(add(p, nn, t / 2), add(p, nn, -t / 2));
  }
  return hull(pts);
}

// chunky 3D star: `pts` arms, facing normal n, radius r, inner ratio ri, half-depth d
function starN(c, n, r, pts = 5, ri = 0.45, d = 0.3, sw = P.star, out = []) {
  n = nrm(n);
  let up = add(V(0, 1, 0), n, -n.y); if (up.length() < 1e-3) up = V(0, 0, -1); up.normalize();
  const rt = nrm(cross(up, n));
  const at = (a, rad) => add(add(c, rt, Math.cos(a) * rad), up, Math.sin(a) * rad);
  const dd = r * d;
  for (let k = 0; k < pts; k++) {
    const a = Math.PI / 2 + (2 * Math.PI * k) / pts, h = Math.PI / pts;
    const L = at(a - h, r * ri), R = at(a + h, r * ri);
    out.push(paint(hull([at(a, r), add(L, n, dd), add(L, n, -dd), add(R, n, dd), add(R, n, -dd), add(c, n, dd * 1.3), add(c, n, -dd * 1.3)]), sw, 'y'));
  }
  return out;
}

// 4-point star (front-facing, slight depth), centre c, radius r
function star4(c, r, sw = P.star, out = []) {
  const k = r * 0.32;
  out.push(paint(hull([
    add(c, V(0, r, 0)), add(c, V(0, -r, 0)), add(c, V(r * 0.75, 0, 0)), add(c, V(-r * 0.75, 0, 0)),
    add(c, V(k, k, 0)), add(c, V(-k, k, 0)), add(c, V(k, -k, 0)), add(c, V(-k, -k, 0)),
    add(c, V(0, 0, r * 0.35)), add(c, V(0, 0, -r * 0.35)),
  ]), sw, 'y'));
  return out;
}

export function buildGeometry() {
  const C = [], S = [];
  const bodyY = (g, lo = 0.05, hi = 0.62) => paint(g, P.body, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= BODY (stocky egg, chest forward) =================
  C.push(bodyY(hull([
    ...ring(V(0, 0.1, -0.0), 0.13, 0.12, 10, 'y'),
    ...ring(V(0, 0.17, 0.0), 0.2, 0.18, 10, 'y'),
    ...ring(V(0, 0.3, 0.01), 0.235, 0.205, 10, 'y'),
    ...ring(V(0, 0.44, 0.0), 0.23, 0.2, 10, 'y'),
    ...ring(V(0, 0.56, -0.01), 0.21, 0.185, 10, 'y'),
    ...ring(V(0, 0.63, -0.01), 0.17, 0.15, 10, 'y'),
  ])));

  // belly shell (light lavender) hugging the body front
  {
    const pts = [];
    for (const [y, rx, rz] of [[0.14, 0.17, 0.155], [0.22, 0.215, 0.195], [0.32, 0.237, 0.212], [0.44, 0.232, 0.207], [0.54, 0.205, 0.188]]) {
      for (let k = -3; k <= 3; k++) {
        const a = k * 0.27;
        pts.push(V(Math.sin(a) * (rx + 0.012), y, 0.01 + Math.cos(a) * (rz + 0.014)));
        pts.push(V(Math.sin(a) * rx * 0.55, y, 0.01 + Math.cos(a) * rz * 0.55));
      }
    }
    C.push(paint(hull(pts), P.belly, 'y', [0.12, 0.56]));
  }
  const fplate = (b, d, n, w, l, sw, th = 0.014) => {
    d = nrm(d); n = nrm(n);
    const sd = nrm(cross(d, n)); n = nrm(cross(sd, d));
    const at = (u, v, h) => add(add(add(b, d, u), sd, v), n, h);
    const pts = [];
    for (const h of [-th, th * 0.3]) pts.push(at(0, w * 0.8, h), at(0, -w * 0.8, h), at(l * 0.3, w, h * 0.8), at(l * 0.3, -w, h * 0.8));
    pts.push(at(l, 0, -th * 0.3), at(l * 0.3, 0, th * 1.1), at(0, 0, th));
    return paint(hull(pts), sw, 'flat');
  };
  // rows of chest feathers: centre + mirrored, alternating pink-glow / lavender
  const rows = [[0.5, 0.222, P.belly], [0.41, 0.245, P.pinkG], [0.32, 0.252, P.belly], [0.23, 0.235, P.pinkG]];
  rows.forEach(([y, z, sw], r) => {
    C.push(fplate(V(0, y, z), V(0, -1, 0.25), V(0, 0.2, 1), 0.05, 0.1, sw));
    S.push(fplate(V(0.085, y - 0.015, z - 0.025), V(0.25, -1, 0.2), V(0.45, 0.2, 1), 0.048, 0.095, sw));
    if (r > 0 && r < 3) S.push(fplate(V(0.15, y - 0.03, z - 0.08), V(0.4, -1, 0.1), V(0.85, 0.2, 0.7), 0.044, 0.09, sw === P.pinkG ? P.pinkG : P.body));
  });

  // ================= LEGS + TALONED FEET =================
  const lx = 0.1, lz = 0.03;
  S.push(bodyY(hull([...ring(V(lx, 0.16, lz - 0.01), 0.065, 0.065, 8), ...ring(V(lx, 0.06, lz + 0.01), 0.05, 0.05, 8)]), 0, 0.2));
  // feather pants
  S.push(paint(shard(V(lx + 0.03, 0.13, lz + 0.04), V(0.3, -1, 0.4), 0.04, 0.07), P.body, 'flat'));
  S.push(paint(shard(V(lx + 0.05, 0.13, lz - 0.02), V(0.6, -1, -0.1), 0.04, 0.07), P.bodyD, 'flat'));
  const foot = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.03, z), 0.05, 0.03, 0.045, 0.014)), P.gold, 'y', [0, 0.07]));
    for (const a of [-0.45, 0, 0.45]) {
      const d = V(Math.sin(a), 0, Math.cos(a));
      const k = add(V(x, 0.024, z), d, 0.085);
      S.push(paint(hull([...cbox(add(V(x, 0.03, z), d, 0.03), 0.022, 0.03, 0.022, 0.008), ...cbox(k, 0.02, 0.024, 0.02, 0.007)]), P.gold, 'y', [0, 0.07]));
      S.push(paint(shard(add(k, d, 0.012), add(d, V(0, -0.9, 0)), 0.017, 0.05), P.claw, 'y'));
    }
    S.push(paint(hull([...cbox(V(x, 0.022, z - 0.05), 0.018, 0.022, 0.025, 0.006)]), P.gold, 'y', [0, 0.07]));
    S.push(paint(shard(V(x, 0.018, z - 0.078), V(0, -0.5, -1), 0.016, 0.045), P.claw, 'y'));
  };
  foot(lx + 0.005, lz + 0.02);

  // ================= TAIL (short fan, pink nebula tips) =================
  C.push(fplate(V(0, 0.24, -0.16), V(0, -0.55, -1), V(0, 1, -0.4), 0.06, 0.16, P.bodyD, 0.02));
  S.push(fplate(V(0.06, 0.24, -0.15), V(0.35, -0.55, -1), V(0.3, 1, -0.4), 0.055, 0.15, P.pink, 0.02));

  // ================= HEAD (big, wide, owl-flat face) =================
  const H = { y: 0.76, z: 0.02 };
  C.push(bodyY(hull([
    ...cbox(V(0, H.y, H.z), 0.24, 0.16, 0.17, 0.075),
    ...ring(V(0, H.y + 0.18, H.z - 0.01), 0.15, 0.12, 8, 'y'),
    V(0.205, H.y - 0.14, H.z + 0.05), V(-0.205, H.y - 0.14, H.z + 0.05),
  ]), 0.45, 0.95));
  const FZ = H.z + 0.17, Fd = FZ + 0.032, rec = 0.22;
  const discZ = (x) => Fd - rec * Math.max(0, Math.abs(x) - 0.03);
  // heart-shaped facial disc (pink lavender), receding toward the sides
  {
    const pts = [];
    for (const [u, v] of [[0, 0.075], [0.1, 0.105], [0.18, 0.08], [0.21, -0.01], [0.165, -0.11], [0.08, -0.15], [0, -0.16]])
      for (const sx of [-1, 1]) {
        const x = sx * u, z = discZ(x);
        pts.push(V(x, H.y + v, z), V(x, H.y + v, z - 0.05));
      }
    C.push(paint(hull(pts), P.disc, 'y', [H.y - 0.16, H.y + 0.1]));
  }
  // big glowing eyes: dark rim almond (angry flat top), glowing iris, big pupil, catchlight
  const E = V(0.103, H.y - 0.01, 0), eZ = discZ(E.x);
  const eyeShape = [[-0.074, 0.0], [-0.055, -0.054], [0.0, -0.077], [0.056, -0.056], [0.08, -0.002], [0.07, 0.05]].map(([u, v]) => [u * 1.2, v * 1.2]);
  const sc = (arr, s, dx = 0, dy = 0) => arr.map(([u, v]) => [u * s + dx, v * s + dy]);
  S.push(flat(hull(plate(sc(eyeShape, 1.0), E, eZ - 0.01, eZ + 0.006, rec)), P.rim));
  S.push(paint(hull(plate(sc(eyeShape, 0.86, 0.0, -0.002), E, eZ - 0.006, eZ + 0.012, rec)), P.iris, 'y', [E.y - 0.07, E.y + 0.04]));
  S.push(flat(hull(plate(sc(eyeShape, 0.5, -0.005, -0.01), E, eZ - 0.002, eZ + 0.019, rec)), P.eye));
  S.push(flat(hull(plate([[-0.01, -0.01], [0.01, -0.01], [0.01, 0.01], [-0.01, 0.01]].map(([u, v]) => [u + 0.016, v + 0.006]),
    E, eZ + 0.004, eZ + 0.025, rec)), P.white));
  // heavy feathered brow slanting down to the beak
  S.push(paint(hull([
    V(0.008, E.y - 0.004, Fd + 0.045), V(0.01, E.y + 0.048, Fd + 0.036),
    V(0.205, E.y + 0.062, Fd - 0.04), V(0.205, E.y + 0.118, Fd - 0.055),
    V(0.008, E.y - 0.004, Fd - 0.04), V(0.01, E.y + 0.056, Fd - 0.05),
    V(0.205, E.y + 0.062, Fd - 0.12), V(0.205, E.y + 0.118, Fd - 0.13),
  ]), P.brow, 'y'));
  // ear tufts: big chunky purple horn-feathers with a glowing pink nebula front blade
  const tuft = (b, d, w, L, th, sw, mode = 'y') => S.push(paint(blade(b, d, V(0, 0, 1), L, w, th,
    [[0, -0.5], [0, 0.5], [0.45, 0.42], [1, 0], [0.45, -0.3]]), sw, mode));
  tuft(V(0.15, H.y + 0.12, H.z + 0.0), V(0.42, 1, 0), 0.075, 0.24, 0.07, P.bodyD);
  tuft(V(0.13, H.y + 0.13, H.z + 0.045), V(0.32, 1, 0), 0.05, 0.17, 0.03, P.pinkG, 'flat');
  // pink nebula feathers lying on the crown, sweeping back
  C.push(fplate(V(0, H.y + 0.19, H.z + 0.09), V(0, 0.25, -1), V(0, 1, 0.25), 0.075, 0.19, P.pinkG, 0.022));
  C.push(paint(shard(V(0, H.y + 0.2, H.z + 0.04), V(0, 1, -0.35), 0.05, 0.12, 4, 0.6), P.pinkG, 'flat'));
  S.push(fplate(V(0.075, H.y + 0.185, H.z + 0.07), V(0.25, 0.2, -1), V(0.2, 1, 0.2), 0.065, 0.17, P.pink, 0.02));
  // glowing star mark on the forehead
  star4(V(0, E.y + 0.09, Fd + 0.012), 0.028, P.star, C);
  // cheek ruff shards
  S.push(paint(shard(V(0.22, H.y - 0.07, H.z + 0.02), V(1, -0.6, 0.1), 0.05, 0.09), P.body, 'flat'));
  S.push(paint(shard(V(0.19, H.y - 0.13, H.z + 0.07), V(0.7, -1, 0.3), 0.045, 0.08), P.pinkG, 'flat'));
  // nape mantle: feathers hanging from the back of the head over the neck join
  C.push(fplate(V(0, H.y - 0.06, H.z - 0.175), V(0, -1, -0.35), V(0, 0.3, -1), 0.08, 0.16, P.bodyD, 0.022));
  S.push(fplate(V(0.1, H.y - 0.06, H.z - 0.16), V(0.35, -1, -0.3), V(0.5, 0.3, -1), 0.075, 0.15, P.bodyD, 0.022));
  S.push(fplate(V(0.18, H.y - 0.07, H.z - 0.1), V(0.6, -1, -0.1), V(1, 0.3, -0.5), 0.065, 0.13, P.body, 0.022));
  // glowing nebula streaks on the back of the head and temples
  C.push(fplate(V(0, H.y + 0.13, H.z - 0.16), V(0, -1, -0.3), V(0, 0.3, -1), 0.06, 0.15, P.pinkG, 0.018));
  S.push(fplate(V(0.09, H.y + 0.12, H.z - 0.15), V(0.3, -1, -0.3), V(0.3, 0.3, -1), 0.05, 0.13, P.pink, 0.018));
  S.push(fplate(V(0.235, H.y + 0.06, H.z + 0.02), V(0.1, -0.5, -1), V(1, 0.1, 0), 0.045, 0.15, P.pinkG, 0.018));

  // beak: small gold hook between the eyes
  const BY = E.y - 0.035;
  C.push(paint(hull([
    ...plate([[-0.035, 0.03], [0.035, 0.03], [0.03, -0.02], [-0.03, -0.02]], V(0, BY, 0), Fd - 0.02, Fd + 0.01),
    V(0.022, BY + 0.0, Fd + 0.055), V(-0.022, BY + 0.0, Fd + 0.055),
    V(0, BY - 0.095, Fd + 0.05), V(0.013, BY - 0.065, Fd + 0.065), V(-0.013, BY - 0.065, Fd + 0.065),
  ]), P.gold, 'y', [BY - 0.09, BY + 0.03]));

  // ================= WINGS (folded on the flanks, chunky starry shards, pink nebula coverts) =================
  const sky = (g) => paintPlanar(g, P.sky, skyUV);
  const wn = nrm(V(1, 0.12, 0.1));
  const w0 = S.length;
  // wing base slab hugging the side
  S.push(sky(hull([
    ...ring(V(0.215, 0.57, 0.04), 0.035, 0.07, 8, 'x'),
    ...ring(V(0.25, 0.42, 0.0), 0.05, 0.14, 8, 'x'),
    ...ring(V(0.255, 0.28, -0.04), 0.045, 0.11, 8, 'x'),
    V(0.25, 0.17, -0.16),
  ])));
  // flight feathers: base -> tip, back layer longest, then front layer, then pink coverts on top
  const feather = (b, t, w, th, paintFn) => {
    const d = sub(t, b);
    S.push(paintFn(blade(b, d, wn, d.length(), w, th)));
  };
  for (const [ty, tz] of [[0.14, -0.05], [0.14, -0.15], [0.2, -0.23], [0.3, -0.27]])
    feather(V(0.27, 0.5, -0.02), V(0.285, ty, tz), 0.075, 0.03, sky);
  for (const [ty, tz] of [[0.21, 0.07], [0.19, -0.01], [0.23, -0.1], [0.31, -0.17]])
    feather(V(0.285, 0.54, 0.05), V(0.3, ty, tz), 0.07, 0.03, sky);
  for (const [ty, tz] of [[0.42, 0.11], [0.41, 0.03], [0.45, -0.05]])
    feather(V(0.29, 0.59, 0.09), V(0.305, ty, tz), 0.06, 0.03, (g) => paint(g, P.pinkG, 'flat'));
  // glowing stars set on the wing
  for (const [y, z, r] of [[0.33, -0.08, 0.032], [0.24, -0.16, 0.024], [0.3, 0.03, 0.022]]) {
    const c = V(0.322, y, z);
    S.push(paint(hull([
      add(c, V(0, r, 0)), add(c, V(0, -r, 0)), add(c, V(0, 0, r * 0.8)), add(c, V(0, 0, -r * 0.8)),
      add(c, V(0, r * 0.3, r * 0.3)), add(c, V(0, -r * 0.3, r * 0.3)), add(c, V(0, r * 0.3, -r * 0.3)), add(c, V(0, -r * 0.3, -r * 0.3)),
      add(c, V(r * 0.4, 0, 0)), add(c, V(-r * 0.3, 0, 0)),
    ]), P.star, 'y'));
  }
  // open the wings: swing the leading edge out ~22 deg about a hinge at the wing's rear root, slight outward roll
  {
    const piv = V(0.235, 0.45, -0.1);
    const m = new THREE.Matrix4().makeTranslation(piv.x, piv.y, piv.z)
      .multiply(new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(22)))
      .multiply(new THREE.Matrix4().makeRotationZ(THREE.MathUtils.degToRad(5)))
      .multiply(new THREE.Matrix4().makeTranslation(-piv.x, -piv.y, -piv.z));
    for (const g of S.slice(w0)) { g.applyMatrix4(m); g.computeVertexNormals(); }
  }

  // ================= FLOATING DETAILS (constellation arc behind the head + nebula orbs) =================
  const HC = V(0, H.y + 0.02, H.z - 0.1), HR = 0.34;
  const arc = [[0, 0.05], [0.7, 0.04], [1.35, 0.032]].map(([a, r]) => ({ p: V(Math.sin(a) * HR, HC.y + Math.cos(a) * HR, HC.z), r }));
  starN(arc[0].p, V(0, 0, 1), arc[0].r * 1.35, 5, 0.45, 0.35, P.star, C);
  for (const s of arc.slice(1)) starN(s.p, V(0, 0, 1), s.r * 1.35, 5, 0.45, 0.35, P.star, S);
  const rod = (a, b) => { // thin glowing constellation link
    const d = sub(b, a), L = d.length(); d.normalize();
    return paint(tube([{ p: add(a, d, 0.045), rx: 0.018, ry: 0.018 }, { p: add(b, d, -0.035), rx: 0.018, ry: 0.018 }], { seg: 6, axis: V(0, 0, 1) }), P.star, 'flat');
  };
  S.push(rod(arc[0].p, arc[1].p), rod(arc[1].p, arc[2].p));
  // two mirrored pairs of floating stars beside the wings (gold high, pink low)
  starN(V(0.43, 0.6, 0.1), V(0.3, 0, 1), 0.045, 5, 0.45, 0.35, P.star, S);
  starN(V(0.42, 0.3, 0.06), V(0.3, 0, 1), 0.038, 5, 0.45, 0.35, P.pinkG, S);
  // starry specks on body and head (chunky 4-point glints sitting just off the surface)
  const speck = (c, n, r) => starN(add(c, nrm(n), 0.012), n, r, 4, 0.38, 0.28, P.star, S);
  for (const [y, phi, rx, rz] of [[0.22, 2.4, 0.215, 0.19], [0.5, 2.6, 0.222, 0.195], [0.36, 2.05, 0.236, 0.206], [0.24, 1.05, 0.22, 0.195]]) {
    const x = Math.sin(phi) * rx, z = 0.0 + Math.cos(phi) * rz;
    speck(V(x, y, z), V(x / (rx * rx), 0, z / (rz * rz)), 0.022);
  }
  speck(V(0.16, H.y - 0.02, H.z - 0.17), V(0.2, 0, -1), 0.024);
  speck(V(0.19, H.y + 0.1, H.z - 0.15), V(0.3, 0.2, -1), 0.018);
  speck(V(0.243, H.y - 0.04, H.z - 0.06), V(1, 0, 0), 0.02);
  // nebula feathers on the back: neat chevron rows
  for (const [y, z, sw] of [[0.52, -0.185, P.pinkG], [0.4, -0.21, P.pink], [0.28, -0.205, P.pinkG]]) {
    C.push(fplate(V(0, y, z), V(0, -1, -0.25), V(0, 0.2, -1), 0.06, 0.13, sw, 0.018));
    S.push(fplate(V(0.09, y - 0.03, z + 0.02), V(0.3, -1, -0.2), V(0.45, 0.2, -1), 0.055, 0.12, sw, 0.018));
  }

  const geo = assemble(C, S);
  geo.scale(0.9, 0.9, 0.9); // owl body+tufts ~0.96 tall; constellation floats above
  geo.computeBoundingBox();
  return geo;
}

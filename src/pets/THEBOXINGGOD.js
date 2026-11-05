// THE PUNCH GOD (DIVINE): towering golden god-warrior in white-marble and gold armour, huge gold gauntlet fists,
// spread wings of light, a floating radiant halo and a sunburst aura. Final boss pet of the game.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// white marble: soft white->pearl gradient with faint grey-gold veins (mapped with world-space u, see marble())
function drawMarble(g, x, y) {
  const grad = g.createLinearGradient(0, y, 0, y + 128);
  grad.addColorStop(0, '#FFFFFF'); grad.addColorStop(1, '#FBFAFD');
  g.fillStyle = grad; g.fillRect(x, y, 128, 128);
  g.save(); g.beginPath(); g.rect(x, y, 128, 128); g.clip();
  g.lineCap = 'round';
  const veins = [[[-10, 20], [30, 40], [55, 30], [90, 70], [140, 80]], [[-10, 95], [25, 80], [60, 100], [100, 92], [140, 120]],
    [[20, -10], [40, 25], [35, 60], [70, 90], [80, 140]]];
  for (const [k, v] of veins.entries()) {
    g.strokeStyle = k === 1 ? 'rgba(215,180,100,0.5)' : 'rgba(190,190,210,0.45)';
    g.lineWidth = k === 2 ? 1.5 : 2.2;
    g.beginPath(); g.moveTo(x + v[0][0], y + v[0][1]);
    for (const [u, w] of v.slice(1)) g.lineTo(x + u, y + w);
    g.stroke();
  }
  g.restore();
}

export const PALETTE = {
  marble:  { i: 0, draw: drawMarble },
  white:   { i: 1, top: '#FFFFFF', bot: '#F7F6FA' },
  gold:    { i: 2, top: '#FFE36A', bot: '#E39A12' },
  goldDk:  { i: 3, top: '#F7C231', bot: '#B6740A' },
  skin:    { i: 4, top: '#FFE9A8', bot: '#F2B455' },
  eye:     { i: 5, top: '#1A1416', bot: '#0C0A0B' },
  eyeW:    { i: 6, top: '#FFFFFF', bot: '#F1F1F4' },
  brow:    { i: 7, top: '#9A5E1C', bot: '#5E340C' },
  nose:    { i: 15, top: '#E9A74C', bot: '#C88430' },
  mouth:   { i: 8, top: '#7A3A1A', bot: '#4A200E' },
  halo:    { i: 9, top: '#FFFBD8', bot: '#FFD437', glow: true },
  light:   { i: 10, top: '#FFFBE2', bot: '#FFBE2A', glow: true },
  rune:    { i: 11, top: '#FFFCE0', bot: '#FFD84A', glow: true },
  gem:     { i: 12, top: '#C9F6FF', bot: '#3FB8FF', glow: true },
  feather: { i: 13, top: '#FFFFFF', bot: '#EBDDBE' },
  ray:     { i: 14, top: '#FFF6C4', bot: '#FFC93A', glow: true },
};
const SW = PALETTE;

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);

// custom marble UV: gradient by height, vein pattern spread by world x+z so veins run across faces
function marble(g, lo, hi) {
  const p = g.attributes.position, sw = SW.marble, uv = [];
  const x0 = (sw.i % 8) * 128, y0 = Math.floor(sw.i / 8) * 128;
  for (let i = 0; i < p.count; i++) {
    const t = THREE.MathUtils.clamp(1 - (p.getY(i) - lo) / (hi - lo), 0, 1);
    const u = THREE.MathUtils.clamp(0.5 + (Math.abs(p.getX(i)) * 1.3 + p.getZ(i) * 0.9) * 1.2, 0, 1);
    uv.push((x0 + 8 + u * 112) / 1024, (y0 + 8 + t * 112) / 1024);
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}

// flat blade (feather / plate) in the plane of dir and n
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

// colour a blade from base (t=0, top colour) to tip (t=1, bottom colour)
function along(g, sw, base, dir, L) {
  const p = g.attributes.position, d = nrm(dir), uv = [];
  const x0 = (sw.i % 8) * 128, y0 = Math.floor(sw.i / 8) * 128;
  for (let i = 0; i < p.count; i++) {
    const t = THREE.MathUtils.clamp(V(p.getX(i), p.getY(i), p.getZ(i)).sub(base).dot(d) / L, 0, 1);
    uv.push((x0 + 64) / 1024, (y0 + 16 + t * 96) / 1024);
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

// closed ring made of hull segments (symmetric about x = 0). axis 'y' = horizontal ring, 'z' = ring facing front
function hoop(c0, R, r, n, axis = 'y') {
  const out = [];
  const pt = (a, dr, dh) => axis === 'y'
    ? V(c0.x + Math.sin(a) * (R + dr), c0.y + dh, c0.z + Math.cos(a) * (R + dr))
    : V(c0.x + Math.sin(a) * (R + dr), c0.y + Math.cos(a) * (R + dr), c0.z + dh);
  for (let k = 0; k < n; k++) {
    const a0 = (2 * Math.PI * k) / n, a1 = (2 * Math.PI * (k + 1)) / n, pts = [];
    for (const a of [a0, a1]) for (const [dr, dh] of [[-r, 0], [0, r], [r, 0], [0, -r]]) pts.push(pt(a, dr, dh));
    out.push(hull(pts));
  }
  return out;
}

export function buildGeometry() {
  const C = [], S = [];
  const gold = (g, lo, hi) => paint(g, SW.gold, lo === undefined ? 'y' : 'y', lo === undefined ? null : [lo, hi]);
  const goldF = (g) => paint(g, SW.gold, 'flat');
  const goldDk = (g) => paint(g, SW.goldDk, 'y');
  const flat = (g, sw) => paint(g, sw, 'flat');
  const mar = (pts, lo = 0.0, hi = 1.1) => marble(hull(pts), lo, hi);

  // ================= FEET (gold armoured sabatons, planted apart) =================
  const FX = 0.155;
  S.push(gold(hull([...cbox(V(FX, 0.045, 0.02), 0.088, 0.045, 0.12, 0.025), ...cbox(V(FX, 0.035, 0.13), 0.07, 0.035, 0.03, 0.015)]), 0, 0.1));
  S.push(goldDk(hull(cbox(V(FX, 0.1, -0.005), 0.075, 0.025, 0.09, 0.02))));
  // toe plate ridge
  S.push(paint(hull(cbox(V(FX, 0.07, 0.11), 0.05, 0.02, 0.05, 0.012)), SW.gold, 'flat'));

  // ================= LEGS (short, thick marble greaves, gold knee guards) =================
  S.push(mar([...ring(V(FX, 0.1, 0.0), 0.075, 0.08, 8), ...ring(V(0.15, 0.2, 0.0), 0.088, 0.09, 8),
    ...ring(V(0.135, 0.3, -0.01), 0.105, 0.1, 8), ...ring(V(0.12, 0.38, -0.01), 0.1, 0.1, 8)]));
  // gold greave cuffs
  S.push(gold(hull([...ring(V(FX, 0.115, 0.0), 0.085, 0.09, 8), ...ring(V(FX, 0.145, 0.0), 0.088, 0.093, 8)])));
  // knee guard
  S.push(gold(hull([...cbox(V(0.148, 0.225, 0.08), 0.06, 0.05, 0.025, 0.015), V(0.148, 0.29, 0.07), V(0.148, 0.17, 0.075)])));
  S.push(flat(hull(plate([[-0.016, 0], [0, 0.022], [0.016, 0], [0, -0.022]], V(0.148, 0.225, 0), 0.1, 0.112)), SW.gem));

  // ================= PELVIS / BELT / TASSETS =================
  C.push(mar([...cbox(V(0, 0.38, -0.01), 0.2, 0.07, 0.14, 0.04)]));
  C.push(gold(hull([...ring(V(0, 0.415, -0.005), 0.215, 0.165, 12, 'y', 0), ...ring(V(0, 0.465, -0.005), 0.215, 0.165, 12, 'y', 0)])));
  // belt buckle: gold sun plate with blue gem
  C.push(gold(hull(plate([[-0.055, 0], [-0.035, 0.045], [0.035, 0.045], [0.055, 0], [0.035, -0.045], [-0.035, -0.045]], V(0, 0.44, 0), 0.14, 0.185))));
  C.push(flat(hull(plate([[-0.022, 0], [0, 0.028], [0.022, 0], [0, -0.028]], V(0, 0.44, 0), 0.17, 0.195)), SW.gem));
  // front tasset (marble with gold trim) + side tassets
  const tasset = (cx, cz, rotY, w, top, bot, arr) => {
    const r = new THREE.Matrix4().makeRotationY(rotY);
    const P = (u, y, d) => V(u, y, d).applyMatrix4(r).add(V(cx, 0, cz));
    arr.push(marble(hull([P(-w, top, 0), P(w, top, 0), P(-w * 0.85, bot, 0.03), P(w * 0.85, bot, 0.03),
      P(-w, top, -0.03), P(w, top, -0.03), P(-w * 0.85, bot, 0.0), P(w * 0.85, bot, 0.0)]), 0, 1.1));
    arr.push(gold(hull([P(-w * 0.87, bot + 0.025, 0.036), P(w * 0.87, bot + 0.025, 0.036), P(-w * 0.85, bot - 0.005, 0.04), P(w * 0.85, bot - 0.005, 0.04),
      P(-w * 0.87, bot + 0.025, -0.004), P(w * 0.87, bot + 0.025, -0.004), P(-w * 0.85, bot - 0.005, -0.004), P(w * 0.85, bot - 0.005, -0.004)])));
  };
  tasset(0, 0.14, 0, 0.075, 0.42, 0.27, C);
  tasset(0.13, 0.11, 0.55, 0.06, 0.42, 0.29, S);
  tasset(0.2, -0.0, Math.PI / 2, 0.065, 0.42, 0.3, S);
  tasset(0, -0.15, Math.PI, 0.1, 0.42, 0.3, C);
  // gold calf plates on the back of the legs
  S.push(gold(hull([...cbox(V(0.15, 0.22, -0.08), 0.055, 0.06, 0.02, 0.012), V(0.15, 0.3, -0.1), V(0.15, 0.155, -0.075)])));

  // ================= TORSO (broad marble chest, gold trim + glowing sun emblem) =================
  C.push(mar([...ring(V(0, 0.45, -0.01), 0.19, 0.14, 10, 'y'), ...ring(V(0, 0.56, -0.005), 0.25, 0.165, 10, 'y'),
    ...ring(V(0, 0.67, -0.01), 0.27, 0.165, 10, 'y'), ...ring(V(0, 0.72, -0.02), 0.2, 0.13, 10, 'y')]));
  // gold pectoral plates
  S.push(gold(hull([V(0.015, 0.68, 0.16), V(0.2, 0.68, 0.13), V(0.22, 0.6, 0.14), V(0.13, 0.535, 0.168), V(0.015, 0.55, 0.168),
    V(0.015, 0.68, 0.13), V(0.2, 0.68, 0.1), V(0.22, 0.6, 0.11), V(0.13, 0.535, 0.135), V(0.015, 0.55, 0.135)])));
  // marble pec inlay inside the gold plate (trim look)
  S.push(marble(hull([V(0.035, 0.665, 0.172), V(0.185, 0.665, 0.142), V(0.2, 0.605, 0.152), V(0.125, 0.552, 0.178), V(0.035, 0.565, 0.178),
    V(0.035, 0.665, 0.15), V(0.185, 0.665, 0.12), V(0.2, 0.605, 0.13), V(0.125, 0.552, 0.155), V(0.035, 0.565, 0.155)]), 0, 1.1));
  // central sun emblem (glowing) between the pecs
  C.push(flat(hull(plate([[0, 0.06], [0.03, 0.02], [0.05, 0], [0.03, -0.025], [0, -0.06], [-0.03, -0.025], [-0.05, 0], [-0.03, 0.02]],
    V(0, 0.6, 0), 0.15, 0.192)), SW.rune));
  // abdominal gold bands
  C.push(gold(hull([...ring(V(0, 0.5, 0.0), 0.215, 0.152, 10, 'y'), ...ring(V(0, 0.515, 0.0), 0.225, 0.158, 10, 'y')])));
  // gorget / collar
  C.push(gold(hull([...ring(V(0, 0.7, -0.015), 0.2, 0.14, 10, 'y'), ...ring(V(0, 0.755, -0.015), 0.15, 0.11, 10, 'y')])));

  // gold back plate between the wing roots with a glowing rune
  C.push(gold(hull([...plate([[-0.12, 0.08], [0.12, 0.08], [0.15, 0.0], [0.09, -0.1], [0, -0.13], [-0.09, -0.1], [-0.15, 0.0]],
    V(0, 0.6, 0), -0.19, -0.16)])));
  C.push(flat(hull(plate([[0, 0.05], [0.035, 0], [0, -0.06], [-0.035, 0]], V(0, 0.6, 0), -0.205, -0.18)), SW.rune));
  // ================= SHOULDERS (layered gold pauldrons) =================
  const SH = V(0.29, 0.69, -0.01);
  S.push(gold(blob(1, SH, V(0.11, 0.09, 0.115), { jitter: 0.08 })));
  for (const [dy, s] of [[-0.06, 1.0], [-0.11, 0.9]]) {
    S.push(gold(hull([...ring(V(SH.x + 0.03, SH.y + dy + 0.04, SH.z), 0.1 * s, 0.11 * s, 8, 'y'),
      ...ring(V(SH.x + 0.06, SH.y + dy, SH.z), 0.12 * s, 0.13 * s, 8, 'y')])));
  }
  S.push(flat(hull(plate([[-0.02, 0], [0, 0.026], [0.02, 0], [0, -0.026]], V(SH.x + 0.02, SH.y + 0.01, 0), 0.095, 0.112)), SW.gem));
  // pauldron feather spikes (light feathers)
  S.push(paint(shard(V(SH.x + 0.02, SH.y + 0.06, SH.z - 0.03), V(0.5, 1, -0.3), 0.04, 0.1), SW.feather, 'flat'));
  S.push(paint(shard(V(SH.x + 0.07, SH.y + 0.03, SH.z - 0.03), V(1, 0.6, -0.3), 0.038, 0.09), SW.feather, 'flat'));

  // ================= ARMS (thick marble upper arm, gold bracer) =================
  S.push(mar([...ring(V(0.31, 0.64, 0.0), 0.08, 0.085, 8), ...ring(V(0.39, 0.48, 0.03), 0.075, 0.08, 8)]));
  S.push(gold(hull([...ring(V(0.395, 0.49, 0.03), 0.08, 0.082, 8), ...ring(V(0.465, 0.35, 0.05), 0.1, 0.1, 8)]), 0.3, 0.5));
  S.push(paint(hull([...ring(V(0.405, 0.455, 0.033), 0.087, 0.09, 8), ...ring(V(0.415, 0.435, 0.035), 0.09, 0.093, 8)]), SW.rune, 'flat'));

  // ================= HUGE GOLD GAUNTLET FISTS (boxing-glove chunky) =================
  const fs0 = S.length;
  const F = V(0.4, 0.235, 0.075);
  // white cuff with gold trim
  S.push(paint(hull([...ring(V(F.x - 0.008, 0.37, F.z - 0.02), 0.1, 0.1, 10), ...ring(V(F.x - 0.005, 0.33, F.z - 0.015), 0.11, 0.11, 10)]), SW.white, 'y'));
  S.push(gold(hull([...ring(V(F.x - 0.005, 0.322, F.z - 0.015), 0.115, 0.115, 10), ...ring(V(F.x - 0.005, 0.305, F.z - 0.015), 0.117, 0.117, 10)])));
  // glove mass
  S.push(gold(hull([...cbox(V(F.x, F.y, F.z), 0.13, 0.12, 0.13, 0.055), ...ring(V(F.x, F.y + 0.11, F.z - 0.01), 0.1, 0.1, 8, 'y'),
    V(F.x, F.y - 0.14, F.z + 0.02)]), 0.1, 0.36));
  // knuckle ridge (front), four big knuckles
  for (const dx of [-0.075, -0.025, 0.025, 0.075]) {
    S.push(goldDk(hull(cbox(V(F.x + dx, F.y + 0.025, F.z + 0.135), 0.026, 0.035, 0.022, 0.01))));
  }
  // thumb wrapped across the front (inner side)
  S.push(gold(hull([...cbox(V(F.x - 0.08, F.y - 0.06, F.z + 0.115), 0.05, 0.035, 0.03, 0.012), ...cbox(V(F.x - 0.125, F.y - 0.02, F.z + 0.07), 0.03, 0.04, 0.04, 0.012)]), 0.1, 0.36));
  // outer gold flare plate + glowing rune line
  S.push(goldDk(hull([...cbox(V(F.x + 0.13, F.y + 0.02, F.z), 0.012, 0.075, 0.09, 0.006)])));
  { const c = V(F.x + 0.146, F.y + 0.02, F.z);
    S.push(flat(hull([add(c, V(-0.01, 0.045, 0)), add(c, V(-0.01, -0.045, 0)), add(c, V(-0.01, 0, 0.045)), add(c, V(-0.01, 0, -0.045)),
      add(c, V(0.002, 0.035, 0)), add(c, V(0.002, -0.035, 0)), add(c, V(0.002, 0, 0.035)), add(c, V(0.002, 0, -0.035))]), SW.gem)); }

  { // scale the fists up and set them near the ground beside the legs
    const k = 1.28, T = V(0.485, 0.2, 0.07);
    for (const g of S.slice(fs0)) { g.translate(-F.x, -F.y, -F.z); g.scale(k, k, k); g.translate(T.x, T.y, T.z); }
  }

  // ================= HEAD (big, golden-skinned, helmed) =================
  const hc0 = C.length, hs0 = S.length;
  const H = { y: 0.9, z: 0.02 };
  C.push(paint(hull([...ring(V(0, 0.72, -0.01), 0.1, 0.09, 8, 'y'), ...ring(V(0, 0.8, 0.0), 0.11, 0.1, 8, 'y')]), SW.skin, 'y', [0.7, 1.0]));
  C.push(paint(hull([
    ...cbox(V(0, H.y, H.z), 0.185, 0.16, 0.16, 0.065),
    V(0.12, H.y - 0.19, H.z + 0.08), V(-0.12, H.y - 0.19, H.z + 0.08), // strong jaw
    V(0.06, H.y - 0.205, H.z + 0.13), V(-0.06, H.y - 0.205, H.z + 0.13),
  ]), SW.skin, 'y', [0.7, 1.06]));
  const FZ = H.z + 0.16;
  // helmet: marble dome with gold rim, gold crest and a white feather plume
  C.push(mar([...ring(V(0, H.y + 0.06, H.z - 0.01), 0.205, 0.185, 10, 'y'), ...ring(V(0, H.y + 0.16, H.z - 0.01), 0.19, 0.17, 10, 'y'),
    ...ring(V(0, H.y + 0.22, H.z - 0.02), 0.12, 0.11, 10, 'y'), V(0, H.y - 0.06, H.z - 0.18), V(0.15, H.y - 0.06, H.z - 0.13), V(-0.15, H.y - 0.06, H.z - 0.13)]));
  C.push(gold(hull([...ring(V(0, H.y + 0.055, H.z - 0.008), 0.213, 0.192, 10, 'y'), ...ring(V(0, H.y + 0.095, H.z - 0.008), 0.21, 0.19, 10, 'y')])));
  // gold crest ridge front-to-back (low) + forehead peak
  C.push(gold(hull([V(0.03, H.y + 0.2, H.z + 0.12), V(-0.03, H.y + 0.2, H.z + 0.12), V(0.03, H.y + 0.245, H.z + 0.04), V(-0.03, H.y + 0.245, H.z + 0.04),
    V(0.03, H.y + 0.245, H.z - 0.08), V(-0.03, H.y + 0.245, H.z - 0.08), V(0.03, H.y + 0.18, H.z - 0.19), V(-0.03, H.y + 0.18, H.z - 0.19),
    V(0.035, H.y + 0.1, H.z + 0.175), V(-0.035, H.y + 0.1, H.z + 0.175)])));
  const X1 = V(1, 0, 0);
  // chunky feather plume: centre feather + a fanned pair, gold-tipped back feather
  C.push(paint(shard(V(0, H.y + 0.24, H.z - 0.02), V(0, 1, -0.55), 0.06, 0.17), SW.feather, 'y'));
  C.push(paint(shard(V(0, H.y + 0.22, H.z - 0.13), V(0, 0.5, -1), 0.05, 0.14), SW.gold, 'y'));
  S.push(paint(shard(V(0.045, H.y + 0.23, H.z - 0.03), V(0.55, 1, -0.45), 0.05, 0.14), SW.feather, 'y'));
  S.push(paint(shard(V(0.04, H.y + 0.235, H.z + 0.05), V(0.3, 1, 0.05), 0.04, 0.09), SW.gold, 'y'));
  // helmet back guard (covers the back of the head and nape)
  C.push(mar([...cbox(V(0, H.y - 0.02, H.z - 0.1), 0.197, 0.12, 0.085, 0.04), V(0, H.y - 0.17, H.z - 0.16), V(0.13, H.y - 0.15, H.z - 0.13), V(-0.13, H.y - 0.15, H.z - 0.13)]));
  C.push(gold(hull([...cbox(V(0, H.y - 0.135, H.z - 0.115), 0.17, 0.018, 0.08, 0.012)])));
  C.push(gold(hull(plate([[-0.03, 0.1], [0.03, 0.1], [0.03, -0.12], [0, -0.15], [-0.03, -0.12]], V(0, H.y + 0.0, 0), H.z - 0.2, H.z - 0.15))));
  // forehead gem
  C.push(flat(hull(plate([[-0.024, 0], [0, 0.032], [0.024, 0], [0, -0.032]], V(0, H.y + 0.078, 0), FZ + 0.0, FZ + 0.042)), SW.gem));
  // helmet side wings (light feathers, gold root)
  S.push(gold(hull(cbox(V(0.205, H.y + 0.07, H.z - 0.02), 0.025, 0.045, 0.045, 0.012))));
  S.push(paint(blade(V(0.215, H.y + 0.08, H.z - 0.0), V(0.55, 1, -0.25), V(1, 0, 0.3), 0.17, 0.06, 0.022), SW.feather, 'y'));
  S.push(paint(blade(V(0.215, H.y + 0.06, H.z - 0.03), V(0.8, 0.6, -0.5), V(1, 0, 0.3), 0.15, 0.055, 0.022), SW.feather, 'y'));
  S.push(paint(blade(V(0.215, H.y + 0.04, H.z - 0.06), V(0.8, 0.25, -0.8), V(1, 0, 0.3), 0.12, 0.05, 0.022), SW.feather, 'y'));
  // cheek guards (gold)
  S.push(gold(hull([V(0.185, H.y + 0.07, H.z + 0.11), V(0.2, H.y + 0.07, H.z - 0.07), V(0.165, H.y - 0.12, H.z + 0.06), V(0.185, H.y - 0.1, H.z - 0.07),
    V(0.155, H.y + 0.07, H.z + 0.11), V(0.17, H.y + 0.07, H.z - 0.07), V(0.135, H.y - 0.12, H.z + 0.06), V(0.155, H.y - 0.1, H.z - 0.07)])));

  // nose, mouth
  C.push(paint(hull([V(0, H.y - 0.01, FZ + 0.01), V(0.022, H.y - 0.065, FZ + 0.02), V(-0.022, H.y - 0.065, FZ + 0.02), V(0, H.y - 0.07, FZ + 0.045),
    V(0.02, H.y - 0.06, FZ - 0.01), V(-0.02, H.y - 0.06, FZ - 0.01)]), SW.nose, 'flat'));
  S.push(flat(hull([V(0, H.y - 0.112, FZ + 0.012), V(0, H.y - 0.1, FZ + 0.012), V(0.042, H.y - 0.118, FZ + 0.006), V(0.042, H.y - 0.108, FZ + 0.006),
    V(0, H.y - 0.112, FZ - 0.004), V(0.042, H.y - 0.114, FZ - 0.006)]), SW.mouth));
  // strong chin block + cheekbones
  C.push(paint(hull(cbox(V(0, H.y - 0.17, H.z + 0.125), 0.07, 0.035, 0.035, 0.015)), SW.skin, 'y', [0.6, 1.0]));

  // fierce eyes: white almond, angry flat top, black pupil, catchlight
  const E = V(0.075, H.y + 0.0, 0);
  S.push(flat(hull(plate([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]],
    E, FZ - 0.01, FZ + 0.012)), SW.eyeW));
  S.push(flat(hull(plate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]],
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye));
  S.push(flat(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.014, FZ + 0.021)), SW.eyeW));
  // heavy brow
  S.push(paint(hull([
    V(0.014, E.y + 0.008, FZ + 0.042), V(0.016, E.y + 0.058, FZ + 0.032),
    V(0.15, E.y + 0.046, FZ + 0.012), V(0.15, E.y + 0.1, FZ - 0.008),
    V(0.014, E.y + 0.008, FZ - 0.03), V(0.016, E.y + 0.07, FZ - 0.04),
    V(0.15, E.y + 0.046, FZ - 0.05), V(0.15, E.y + 0.1, FZ - 0.06),
  ]), SW.brow, 'y'));

  // ================= FLOATING HALO + SUNBURST =================
  const HY = H.y + 0.4, HZ = H.z - 0.05;
  const tilt = new THREE.Matrix4().makeRotationX(-0.4);
  const hc = V(0, HY, HZ);
  const tiltG = (g) => { g.translate(-hc.x, -hc.y, -hc.z); g.applyMatrix4(tilt); g.translate(hc.x, hc.y, hc.z); return g; };
  for (const g of hoop(hc, 0.17, 0.028, 16, 'y')) C.push(paint(tiltG(g), SW.halo, 'y'));
  // radiant rays around the halo (in the halo plane)
  for (let k = 0; k < 16; k++) {
    const a = (2 * Math.PI * (k + 0.5)) / 16, L = k % 2 ? 0.05 : 0.085;
    const d = V(Math.sin(a), 0, Math.cos(a));
    const g = hull([add(add(hc, d, 0.19), V(Math.cos(a), 0, -Math.sin(a)), 0.022), add(add(hc, d, 0.19), V(Math.cos(a), 0, -Math.sin(a)), -0.022),
      add(add(hc, d, 0.19), V(0, 0.012, 0)), add(add(hc, d, 0.19), V(0, -0.012, 0)), add(hc, d, 0.19 + L)]);
    C.push(paint(tiltG(g), SW.ray, 'flat'));
  }

  { // scale the whole head group (and halo) up from the neck
    const P = V(0, 0.74, 0.02), k = 1.15;
    for (const g of [...C.slice(hc0), ...S.slice(hs0)]) { g.translate(-P.x, -P.y, -P.z); g.scale(k, k, k); g.translate(P.x, P.y, P.z); }
  }

  // ================= WINGS OF LIGHT (gold arm, fanned glowing feather blades) =================
  const root = V(0.1, 0.68, -0.17);
  const wingPts = [root, V(0.2, 0.92, -0.25), V(0.31, 1.17, -0.31), V(0.4, 1.45, -0.36)];
  S.push(gold(tube(curveSamples(wingPts, 7, (t) => 0.05 - 0.022 * t), { seg: 6, phase: Math.PI / 6, capEnd: 0.04 }), 0.6, 1.2));
  const wcurve = new THREE.CatmullRomCurve3(wingPts, false, 'centripetal');
  const wn = V(0.3, 0, 1);
  const fan = (n, t0, t1, a0, a1, Lf, w, dz, sw, th) => {
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), t = t0 + (t1 - t0) * u;
      const b = wcurve.getPoint(t).add(V(0, 0, dz));
      const ang = a0 + (a1 - a0) * u;
      const d = V(Math.cos(ang), Math.sin(ang), -0.05);
      S.push(along(blade(b, d, wn, Lf(u), w, th), sw, b, d, Lf(u)));
    }
  };
  // primaries: long light blades fanning from straight down (root) to outward (tip)
  fan(8, 0.14, 1.0, -1.45, 0.75, (u) => 0.26 + 0.1 * Math.sin(Math.PI * Math.min(1, u * 1.3)), 0.085, -0.014, SW.light, 0.034);
  // secondaries: white feathers over them
  fan(6, 0.1, 0.9, -1.35, 0.1, (u) => 0.17 + 0.07 * Math.sin(Math.PI * u), 0.075, 0.014, SW.feather, 0.034);
  // tip plumes rising above the halo (radiant silhouette)
  fan(3, 0.86, 1.0, 1.2, 1.5, (u) => 0.13 + 0.03 * u, 0.055, -0.004, SW.light, 0.03);
  // gold coverts along the arm
  fan(4, 0.08, 0.8, -1.2, -0.2, () => 0.1, 0.06, 0.034, SW.gold, 0.034);

  return assemble(C, S);
}

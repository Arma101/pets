// Ban Hammer Golem (ADMIN): dark steel golem with red glowing cracks, leaning on a giant ban hammer planted
// head-down between its feet (both hands on the pommel), gold crown, floating golden halo, glowing gold armour,
// royal purple cape / tabard, radiant gold aura blades fanning behind the shoulders.
import { V, THREE, hull, cbox, ring, plate, shard, paint, assemble } from '../kit.js';

export const PALETTE = {
  steel:    { i: 0, top: '#6B7486', bot: '#2E3340' },
  steelDk:  { i: 1, top: '#4A5162', bot: '#22262F' },
  crack:    { i: 2, top: '#FF5530', bot: '#FF2A1A', glow: true },
  gold:     { i: 3, top: '#FFE66E', bot: '#E39E12' },
  goldGlow: { i: 4, top: '#FFE04A', bot: '#FFA510', glow: true },
  purple:   { i: 5, top: '#A24DFF', bot: '#5A1FA6' },
  purpleDk: { i: 6, top: '#7A2FD0', bot: '#3E137A' },
  white:    { i: 7, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:      { i: 8, top: '#1A1416', bot: '#0C0A0B' },
  gem:      { i: 9, top: '#E2B8FF', bot: '#8A2BE2' },
  ban: {
    i: 10, glow: false,
    draw(g, x, y) {
      g.fillStyle = '#5A1FA6'; g.fillRect(x, y, 128, 128);
      g.fillStyle = '#7A2FD0'; g.fillRect(x + 6, y + 6, 116, 116);
      g.strokeStyle = '#FFD23A'; g.lineWidth = 8; g.strokeRect(x + 10, y + 12, 108, 104);
      g.save();
      g.translate(x + 64, y + 66);
      g.scale(0.62, 1.05);
      g.font = 'bold 74px Arial Black, Arial, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 8; g.strokeStyle = '#3E137A'; g.strokeText('BAN', 0, 0);
      g.fillStyle = '#FFE66E'; g.fillText('BAN', 0, 0);
      g.restore();
    },
  },
};
const SW = PALETTE;

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);

// a glowing crack: chain of thin raised slabs along points pts, lying on a surface with normal n
function crack(pts, n, w = 0.014, th = 0.014) {
  const out = [];
  const nn = nrm(n);
  for (let k = 0; k < pts.length - 1; k++) {
    const a = pts[k], b = pts[k + 1];
    const side = nrm(cross(b.clone().sub(a), nn));
    const ww = w * (1 - 0.35 * (k / Math.max(1, pts.length - 2)));
    const q = [];
    for (const p of [a, b]) for (const s of [-1, 1]) for (const t of [-0.5, 0.5]) q.push(add(add(p, side, s * ww), nn, t * th));
    out.push(paint(hull(q), SW.crack, 'flat'));
  }
  return out;
}

// flat blade (aura ray / wing feather) in plane with normal n
function blade(base, dir, n, L, w, th = 0.018) {
  const d = nrm(dir);
  const nn = nrm(add(n, d, -n.dot(d)));
  const v = nrm(cross(nn, d));
  const shape = [[0, -0.35], [0, 0.35], [0.25, 0.5], [0.75, 0.32], [1, 0], [0.75, -0.32], [0.25, -0.5]];
  const pts = [];
  for (const [u, s] of shape) {
    const p = add(add(base, d, u * L), v, s * w);
    pts.push(add(p, nn, th / 2), add(p, nn, -th / 2));
  }
  return hull(pts);
}

// custom UVs mapping a world rectangle onto a whole atlas cell (for the BAN plate)
function cellUV(g, sw, uOf, vOf) {
  const p = g.attributes.position, uv = [];
  const x0 = (sw.i % 8) * 128, y0 = Math.floor(sw.i / 8) * 128;
  for (let k = 0; k < p.count; k++) {
    const u = THREE.MathUtils.clamp(uOf(p.getX(k), p.getY(k), p.getZ(k)), 0, 1);
    const v = THREE.MathUtils.clamp(vOf(p.getX(k), p.getY(k), p.getZ(k)), 0, 1);
    uv.push((x0 + 4 + u * 120) / 1024, (y0 + 4 + v * 120) / 1024);
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

export function buildGeometry() {
  const C = [], S = [];
  const steel = (pts, lo = 0.0, hi = 1.0) => paint(hull(pts), SW.steel, 'y', [lo, hi]);
  const steelDk = (pts, lo = 0.0, hi = 1.0) => paint(hull(pts), SW.steelDk, 'y', [lo, hi]);
  const gold = (g, r) => paint(g, SW.gold, 'y', r || null);
  const goldG = (g) => paint(g, SW.goldGlow, 'y');
  const purple = (g, r) => paint(g, SW.purple, 'y', r || null);

  // ================= LEGS (short thick columns, wide stance) =================
  const LX = 0.22;
  // feet: chunky block + 2 toes + gold toe caps
  S.push(steelDk(cbox(V(LX, 0.042, 0.02), 0.085, 0.042, 0.1, 0.022)));
  for (const dx of [-0.04, 0.04]) {
    S.push(steelDk(cbox(V(LX + dx, 0.034, 0.125), 0.036, 0.034, 0.035, 0.012)));
    S.push(gold(hull(cbox(V(LX + dx, 0.03, 0.158), 0.03, 0.026, 0.012, 0.008))));
  }
  // shin + thigh
  S.push(steel([...ring(V(LX, 0.06, 0.0), 0.085, 0.085, 8), ...ring(V(LX, 0.19, 0.0), 0.095, 0.095, 8)], 0.0, 0.5));
  S.push(steel([...ring(V(LX - 0.005, 0.18, 0.0), 0.1, 0.1, 8), ...ring(V(LX - 0.02, 0.33, -0.01), 0.115, 0.11, 8)], 0.0, 0.6));
  // gold knee guard
  S.push(gold(hull([...plate([[-0.06, -0.035], [0.06, -0.035], [0.065, 0.02], [0, 0.06], [-0.065, 0.02]],
    V(LX, 0.19, 0), 0.08, 0.11)])));
  S.push(paint(hull(plate([[-0.016, 0], [0, 0.02], [0.016, 0], [0, -0.02]], V(LX, 0.2, 0), 0.108, 0.118)), SW.gem, 'y'));
  // leg cracks
  S.push(...crack([V(LX + 0.03, 0.075, 0.087), V(LX + 0.005, 0.105, 0.09), V(LX + 0.03, 0.135, 0.091)], V(0, 0, 1)));
  S.push(...crack([V(LX + 0.1, 0.3, 0.0), V(LX + 0.096, 0.26, 0.03), V(LX + 0.1, 0.22, 0.0)], V(1, 0, 0)));

  // ================= PELVIS + TORSO (broad V-shaped chest) =================
  C.push(steel([...cbox(V(0, 0.33, -0.005), 0.2, 0.05, 0.12, 0.03)], 0.2, 0.7));
  C.push(steel([
    ...cbox(V(0, 0.38, 0), 0.17, 0.04, 0.12, 0.03),
    ...cbox(V(0, 0.585, -0.005), 0.25, 0.065, 0.15, 0.045),
    ...ring(V(0, 0.68, -0.01), 0.16, 0.11, 8, 'y'),
  ], 0.25, 0.75));
  // gold belt + purple gem buckle
  C.push(gold(hull(cbox(V(0, 0.34, -0.005), 0.208, 0.026, 0.128, 0.012))));
  C.push(paint(hull(plate([[-0.035, 0], [0, 0.035], [0.035, 0], [0, -0.035]], V(0, 0.34, 0), 0.12, 0.145)), SW.gem, 'y'));
  // purple tabard hanging in front of the hips
  C.push(purple(hull(plate([[-0.08, 0.0], [0.08, 0.0], [0.07, -0.13], [0, -0.17], [-0.07, -0.13]], V(0, 0.32, 0), 0.115, 0.135)), [0.14, 0.33]));
  C.push(gold(hull(plate([[-0.03, 0], [0.03, 0], [0, -0.045]], V(0, 0.2, 0), 0.13, 0.142))));

  // belly cracks (steel visible between belt and chest plate)
  C.push(...crack([V(0, 0.37, 0.124), V(-0.02, 0.4, 0.127), V(0.015, 0.43, 0.13), V(0, 0.465, 0.134)], V(0, 0, 1)));
  S.push(...crack([V(0.09, 0.37, 0.124), V(0.115, 0.4, 0.127), V(0.1, 0.44, 0.131)], V(0, 0, 1)));

  // chest armour: glowing gold breastplate with a purple royal emblem
  C.push(gold(hull([
    ...plate([[-0.19, 0.03], [0.19, 0.03], [0.2, -0.05], [0.12, -0.11], [0, -0.13], [-0.12, -0.11], [-0.2, -0.05]],
      V(0, 0.6, 0), 0.1, 0.165),
    V(0.16, 0.66, 0.08), V(-0.16, 0.66, 0.08),
  ]), [0.46, 0.66]));
  C.push(goldG(hull(plate([[-0.2, 0.03], [0.2, 0.03], [0.2, 0.015], [-0.2, 0.015]], V(0, 0.6, 0), 0.12, 0.172))));
  C.push(purple(hull(plate([[-0.05, 0.0], [0, 0.04], [0.05, 0.0], [0, -0.07]], V(0, 0.565, 0), 0.15, 0.178))));
  C.push(paint(hull(plate([[-0.022, 0.0], [0, 0.02], [0.022, 0.0], [0, -0.035]], V(0, 0.565, 0), 0.17, 0.186)), SW.gem, 'y'));

  // purple royal cape down the back, gold clasp trim at the top
  C.push(purple(hull([
    ...plate([[-0.22, 0.0], [0.22, 0.0], [0.24, -0.2], [0.22, -0.46], [-0.22, -0.46], [-0.24, -0.2]], V(0, 0.66, 0), -0.17, -0.105),
  ]), [0.2, 0.66]));
  C.push(gold(hull(plate([[-0.235, 0.0], [0.235, 0.0], [0.24, -0.04], [-0.24, -0.04]], V(0, 0.672, 0), -0.18, -0.12))));
  C.push(purple(hull(plate([[-0.235, 0.0], [0.235, 0.0], [0.24, -0.04], [-0.24, -0.04]], V(0, 0.21, 0), -0.177, -0.105))));

  // cape: gold side trims and a gold + purple crest
  S.push(gold(hull(plate([[0.2, 0.0], [0.24, 0.0], [0.26, -0.2], [0.24, -0.46], [0.2, -0.46], [0.22, -0.2]], V(0, 0.66, 0), -0.176, -0.105))));
  C.push(gold(hull(plate([[-0.07, 0.0], [0.07, 0.0], [0.07, -0.07], [0, -0.12], [-0.07, -0.07]], V(0, 0.5, 0), -0.18, -0.165))));
  C.push(paint(hull(plate([[-0.035, 0.0], [0, 0.035], [0.035, 0.0], [0, -0.05]], V(0, 0.46, 0), -0.19, -0.175)), SW.gem, 'y'));
  // chest/torso side cracks
  S.push(...crack([V(0.245, 0.62, 0.06), V(0.255, 0.58, 0.02), V(0.25, 0.54, 0.07), V(0.24, 0.49, 0.03)], V(1, 0, 0.2)));
  S.push(...crack([V(0.13, 0.48, 0.138), V(0.16, 0.45, 0.136), V(0.15, 0.41, 0.13)], V(0, 0, 1)));

  // ================= RADIANT AURA (gold blades fanning behind the shoulders) =================
  const back = V(0, 0, -1);
  for (const [bx, by, ang, L, w] of [
    [0.08, 0.72, 0.28, 0.26, 0.06],
    [0.15, 0.7, 0.62, 0.3, 0.065],
    [0.2, 0.66, 0.98, 0.3, 0.065],
    [0.22, 0.6, 1.32, 0.25, 0.06],
    [0.22, 0.54, 1.66, 0.19, 0.05],
  ]) {
    const dir = V(Math.sin(ang), Math.cos(ang), -0.18);
    S.push(goldG(blade(V(bx, by, -0.2), dir, back, L, w)));
  }

  // ================= ARMS (big gold pauldrons, thick steel arms reaching to the pommel) =================
  const SH = V(0.28, 0.6, 0.0), EL = V(0.3, 0.47, 0.16), HA = V(0.075, 0.53, 0.4);
  S.push(steel([...ring(SH, 0.085, 0.085, 8, 'y'), ...ring(add(EL, V(0, 0.02, 0)), 0.075, 0.075, 8, 'y')], 0.35, 0.7));
  S.push(steel([...ring(EL, 0.075, 0.075, 8, 'x'), ...ring(add(HA, V(0.04, 0, -0.03)), 0.06, 0.06, 8, 'x')], 0.35, 0.6));
  // gold glowing bracer on forearm
  S.push(gold(hull([...ring(V(0.225, 0.49, 0.245), 0.072, 0.072, 8, 'x'), ...ring(V(0.165, 0.505, 0.305), 0.068, 0.068, 8, 'x')])));
  // pauldron: layered gold dome + purple trim + spike
  S.push(gold(hull([...ring(V(0.29, 0.62, 0.0), 0.12, 0.12, 8, 'y'), ...ring(V(0.27, 0.71, 0.0), 0.08, 0.08, 8, 'y'),
    V(0.32, 0.56, 0.0), V(0.36, 0.58, 0.06), V(0.36, 0.58, -0.06)]), [0.54, 0.74]));
  S.push(purple(hull([...ring(V(0.295, 0.615, 0.0), 0.125, 0.125, 8, 'y'), ...ring(V(0.3, 0.575, 0.0), 0.118, 0.118, 8, 'y')])));
  S.push(goldG(shard(V(0.3, 0.7, 0.0), V(0.35, 1, 0), 0.035, 0.08)));
  // fists wrapped around the hammer pommel
  S.push(steelDk(cbox(V(0.075, 0.53, 0.4), 0.05, 0.058, 0.062, 0.02)));
  for (const dy of [-0.03, 0.0, 0.03])
    S.push(steelDk(cbox(V(0.045, 0.53 + dy, 0.455), 0.035, 0.014, 0.014, 0.005)));
  // dark steel rock shards on the forearms and upper back
  S.push(paint(shard(V(0.27, 0.53, 0.21), V(0.3, 1, -0.3), 0.03, 0.06), SW.steelDk, 'y'));
  S.push(paint(shard(V(0.21, 0.545, 0.27), V(0.2, 1, -0.2), 0.026, 0.05), SW.steelDk, 'y'));
  S.push(paint(shard(V(0.08, 0.7, -0.1), V(0.2, 1, -0.6), 0.035, 0.07), SW.steelDk, 'y'));
  S.push(paint(shard(V(0.2, 0.18, -0.07), V(0.4, 0.2, -1), 0.03, 0.05), SW.steelDk, 'y'));
  // arm cracks
  S.push(...crack([V(0.36, 0.55, 0.02), V(0.37, 0.51, 0.06), V(0.36, 0.48, 0.09)], V(1, 0, 0.2)));

  // ================= GIANT BAN HAMMER (head planted on the ground, long axis along z) =================
  const HZ = 0.39, HY = 0.18, hx = 0.14, hy = 0.18, hz = 0.27;
  C.push(steelDk(cbox(V(0, HY, HZ), hx, hy, hz, 0.035), 0.0, 0.36));
  // gold collars near each end
  for (const z of [HZ - hz + 0.055, HZ + hz - 0.055])
    C.push(gold(hull(cbox(V(0, HY, z), hx + 0.016, hy + 0.016, 0.03, 0.016))));
  // striking faces: gold rim frame, then a bevelled raised red glowing face
  for (const s of [1, -1]) {
    const z0 = HZ + s * hz;
    C.push(gold(hull(cbox(V(0, HY, z0 + s * 0.006), hx - 0.008, hy - 0.008, 0.008, 0.01))));
    C.push(steelDk(cbox(V(0, HY, z0 + s * 0.012), hx - 0.026, hy - 0.026, 0.006, 0.006)));
    const f = [];
    for (const [w, h, dz] of [[hx - 0.042, hy - 0.042, 0.014], [hx - 0.072, hy - 0.072, 0.04]])
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) f.push(V(sx * w, HY + sy * h, z0 + s * dz));
    for (const [w, h] of [[hx - 0.042, hy - 0.042]])
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) f.push(V(sx * w, HY + sy * h, z0 + s * 0.004));
    C.push(paint(hull(f), SW.crack, 'y', [HY - hy, HY + hy]));
  }
  // BAN panels on both sides (centre parts with their own text UVs so both read correctly)
  for (const s of [1, -1]) {
    const pz0 = HZ - 0.175, pz1 = HZ + 0.175, py0 = HY - 0.125, py1 = HY + 0.125;
    const g = hull([
      V(s * (hx + 0.002), py0, pz0), V(s * (hx + 0.002), py1, pz0), V(s * (hx + 0.002), py0, pz1), V(s * (hx + 0.002), py1, pz1),
      V(s * (hx + 0.012), py0, pz0), V(s * (hx + 0.012), py1, pz0), V(s * (hx + 0.012), py0, pz1), V(s * (hx + 0.012), py1, pz1),
    ]);
    C.push(cellUV(g, SW.ban, (x, y, z) => s > 0 ? (pz1 - z) / (pz1 - pz0) : (z - pz0) / (pz1 - pz0), (x, y) => (py1 - y) / (py1 - py0)));
  }
  // top gold cap where the handle enters
  C.push(gold(hull([...ring(V(0, HY + hy, HZ), 0.085, 0.085, 8, 'y'), ...ring(V(0, HY + hy + 0.04, HZ), 0.058, 0.058, 8, 'y')])));
  // handle: thick purple wrap with gold bands, gold pommel gem on top
  C.push(purple(hull([...ring(V(0, HY + hy + 0.02, HZ), 0.046, 0.046, 8, 'y'), ...ring(V(0, 0.59, HZ), 0.042, 0.042, 8, 'y')]), [0.36, 0.59]));
  C.push(gold(hull([...ring(V(0, 0.42, HZ), 0.054, 0.054, 8, 'y'), ...ring(V(0, 0.444, HZ), 0.054, 0.054, 8, 'y')])));
  C.push(gold(hull([...ring(V(0, 0.585, HZ), 0.052, 0.052, 8, 'y'), ...ring(V(0, 0.615, HZ), 0.058, 0.058, 8, 'y')])));
  C.push(paint(hull([V(0, 0.685, HZ), ...ring(V(0, 0.64, HZ), 0.042, 0.042, 6, 'y', 0), V(0, 0.61, HZ)]), SW.gem, 'y'));

  // ================= HEAD (big boxy steel head) =================
  const H = { y: 0.85, z: 0.02 };
  C.push(steel([
    ...cbox(V(0, H.y, H.z), 0.195, 0.145, 0.155, 0.05),
    ...ring(V(0, H.y + 0.165, H.z - 0.01), 0.13, 0.11, 8, 'y'),
    V(0.19, H.y - 0.11, H.z + 0.08), V(-0.19, H.y - 0.11, H.z + 0.08),
  ], 0.68, 1.0));
  const FZ = H.z + 0.155;
  // jaw block (dark) with glowing mouth slit
  C.push(steelDk(cbox(V(0, H.y - 0.1, FZ - 0.005), 0.13, 0.05, 0.03, 0.015), 0.68, 0.8));
  C.push(paint(hull(plate([[-0.05, 0.008], [0.05, 0.008], [0.05, -0.008], [-0.05, -0.008]], V(0, H.y - 0.09, 0), FZ + 0.02, FZ + 0.03)), SW.crack, 'flat'));
  S.push(paint(hull(plate([[0.045, 0.008], [0.078, 0.004], [0.078, -0.01], [0.045, -0.008]], V(0, H.y - 0.09, 0), FZ + 0.02, FZ + 0.03)), SW.crack, 'flat'));
  // fierce eyes: white almond with angry flat top, big black pupil, catchlight
  const E = V(0.084, H.y + 0.015, 0);
  S.push(paint(hull(plate([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]],
    E, FZ - 0.01, FZ + 0.012)), SW.white, 'flat'));
  S.push(paint(hull(plate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]],
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.014, FZ + 0.021)), SW.white, 'flat'));
  // heavy steel brow slanting down to the centre
  S.push(paint(hull([
    V(0.018, E.y + 0.012, FZ + 0.035), V(0.02, E.y + 0.055, FZ + 0.025),
    V(0.16, E.y + 0.05, FZ - 0.005), V(0.16, E.y + 0.092, FZ - 0.02),
    V(0.018, E.y + 0.012, FZ - 0.03), V(0.02, E.y + 0.065, FZ - 0.04),
    V(0.16, E.y + 0.05, FZ - 0.06), V(0.16, E.y + 0.095, FZ - 0.07),
  ]), SW.steelDk, 'y'));
  // face / head cracks (long jagged glowing seams)
  S.push(...crack([V(0.13, H.y + 0.135, FZ - 0.03), V(0.15, H.y + 0.11, FZ - 0.012), V(0.14, H.y + 0.095, FZ - 0.005)], V(0.2, 0.4, 1), 0.01));
  S.push(...crack([V(0.165, H.y - 0.03, FZ - 0.002), V(0.14, H.y - 0.06, FZ + 0.003), V(0.16, H.y - 0.085, FZ + 0.006)], V(0.3, 0, 1), 0.01));
  S.push(...crack([V(0.198, H.y + 0.1, H.z + 0.05), V(0.2, H.y + 0.05, H.z + 0.0), V(0.2, H.y + 0.01, H.z + 0.06),
    V(0.2, H.y - 0.04, H.z + 0.02), V(0.198, H.y - 0.09, H.z + 0.07)], V(1, 0, 0), 0.013));
  C.push(...crack([V(0, H.y + 0.12, H.z - 0.158), V(0.03, H.y + 0.07, H.z - 0.158), V(-0.02, H.y + 0.02, H.z - 0.158),
    V(0.02, H.y - 0.04, H.z - 0.158), V(0, H.y - 0.09, H.z - 0.158)], V(0, 0, -1), 0.013));
  // ================= CROWN (gold band, five points, purple gems) =================
  const CY = H.y + 0.16;
  C.push(gold(hull([...ring(V(0, CY - 0.02, H.z - 0.01), 0.145, 0.13, 8, 'y'), ...ring(V(0, CY + 0.045, H.z - 0.01), 0.158, 0.14, 8, 'y')])));
  // royal purple velvet cap inside the crown, gold orb on top
  C.push(purple(hull([...ring(V(0, CY + 0.03, H.z - 0.01), 0.14, 0.125, 8, 'y'), ...ring(V(0, CY + 0.085, H.z - 0.01), 0.09, 0.08, 8, 'y')])));
  C.push(goldG(hull([...ring(V(0, CY + 0.08, H.z - 0.01), 0.03, 0.03, 6, 'y', 0), V(0, CY + 0.125, H.z - 0.01)])));
  C.push(gold(shard(V(0, CY + 0.03, H.z + 0.125), V(0, 1, 0.12), 0.045, 0.1)));
  S.push(gold(shard(V(0.095, CY + 0.03, H.z + 0.085), V(0.2, 1, 0.12), 0.04, 0.085)));
  S.push(gold(shard(V(0.145, CY + 0.03, H.z - 0.02), V(0.3, 1, 0), 0.038, 0.075)));
  S.push(gold(shard(V(0.085, CY + 0.03, H.z - 0.12), V(0.15, 1, -0.15), 0.036, 0.07)));
  C.push(gold(shard(V(0, CY + 0.03, H.z - 0.145), V(0, 1, -0.15), 0.036, 0.07)));
  C.push(paint(hull(plate([[-0.025, 0], [0, 0.028], [0.025, 0], [0, -0.028]], V(0, CY + 0.012, 0), H.z + 0.142, H.z + 0.162)), SW.gem, 'y'));
  S.push(paint(hull(plate([[-0.016, 0], [0, 0.018], [0.016, 0], [0, -0.018]], V(0.1, CY + 0.012, 0), H.z + 0.112, H.z + 0.132)), SW.gem, 'y'));

  // ================= HALO (floating gold ring above the crown) =================
  const HAY = CY + 0.175, R = 0.165, n = 12;
  for (let k = 0; k < n; k++) {
    const a0 = (2 * Math.PI * k) / n, a1 = (2 * Math.PI * (k + 1)) / n;
    const pts = [];
    for (const a of [a0, a1]) for (const [dr, dy] of [[-0.03, 0], [-0.015, 0.027], [0.015, 0.027], [0.03, 0], [0.015, -0.027], [-0.015, -0.027]])
      pts.push(V(Math.cos(a) * (R + dr), HAY + dy, H.z - 0.01 + Math.sin(a) * (R + dr)));
    C.push(goldG(hull(pts)));
  }

  return assemble(C, S);
}

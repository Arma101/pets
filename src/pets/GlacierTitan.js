// Glacier Titan (GODLY): bipedal glacier-ice golem with glowing cracks and runes, ornate gold armour,
// a jagged ice crown and a floating frost halo.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  ice:     { i: 0, top: '#D2F3FF', bot: '#4796E6' },
  iceDk:   { i: 1, top: '#86C8F8', bot: '#2F6FCC' },
  crystal: { i: 2, top: '#EAFBFF', bot: '#62BDFF' },
  glow:    { i: 3, top: '#9FF7FF', bot: '#2ECFFF', glow: true },
  gold:    { i: 4, top: '#FFE46C', bot: '#E39E12' },
  goldDk:  { i: 5, top: '#F6C431', bot: '#B9780C' },
  white:   { i: 6, top: '#FFFFFF', bot: '#EEF8FF' },
  eye:     { i: 7, top: '#1A1416', bot: '#0C0A0B' },
  brow:    { i: 8, top: '#A9DDFB', bot: '#3F84D6' },
  mouth:   { i: 9, top: '#1D3F86', bot: '#122A5E' },
  halo:    { i: 10, top: '#8FF4FF', bot: '#1FB8F2', glow: true },
};
const SW = PALETTE;
const GS = 0.84; // global scale

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const sub = (a, b) => a.clone().sub(b);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);

// chamfered octagonal section in the xz plane at height y (flat front face at z = zF)
function sec(y, hx, zF, zB, c, x0 = 0) {
  return [V(x0 - hx + c, y, zF), V(x0 + hx - c, y, zF), V(x0 + hx, y, zF - c), V(x0 + hx, y, zB + c),
    V(x0 + hx - c, y, zB), V(x0 - hx + c, y, zB), V(x0 - hx, y, zB + c), V(x0 - hx, y, zF - c)];
}

// raised strip from a to b lying on a surface with outward normal n (sunk `inD`, raised `outD`)
function strip(a, b, n, w = 0.009, outD = 0.007, inD = 0.016) {
  const nn = nrm(n), side = nrm(cross(sub(b, a), nn));
  const ext = nrm(sub(b, a)).multiplyScalar(w * 0.5);
  const pts = [];
  for (const p of [add(a, ext, -1), add(b, ext, 1)]) for (const s of [-1, 1]) for (const d of [outD, -inD])
    pts.push(add(add(p, side, s * w), nn, d));
  return hull(pts);
}
// polyline of strips
function crack(pts, n, w, outD, inD) { const out = []; for (let k = 0; k < pts.length - 1; k++) out.push(strip(pts[k], pts[k + 1], n, w, outD, inD)); return out; }

export function buildGeometry() {
  const C = [], S = [];
  const ice = (pts, lo, hi) => paint(hull(pts), SW.ice, 'y', [lo, hi]);
  const iceDk = (pts, lo, hi) => paint(hull(pts), SW.iceDk, 'y', [lo, hi]);
  const gold = (g) => paint(g, SW.gold, 'y');
  const goldDk = (g) => paint(g, SW.goldDk, 'y');
  const flat = (g, sw) => paint(g, sw, 'flat');
  const glow = (arr, C_or_S) => { for (const g of arr) C_or_S.push(paint(g, SW.glow, 'flat')); };
  const cry = (g) => paint(g, SW.crystal, 'y');

  // ================= FEET + LEGS (short, thick, planted slightly apart) =================
  const LX = 0.16;
  S.push(iceDk([...cbox(V(LX, 0.045, 0.03), 0.1, 0.045, 0.125, 0.03), ...cbox(V(LX, 0.08, 0.0), 0.08, 0.03, 0.08, 0.02)], 0.0, 0.14));
  for (const dx of [-0.055, 0.0, 0.055])
    S.push(paint(hull(cbox(V(LX + dx, 0.032, 0.16), 0.03, 0.032, 0.03, 0.012)), SW.crystal, 'y', [0, 0.07]));
  S.push(ice([...sec(0.08, 0.085, 0.09, -0.08, 0.03, LX), ...sec(0.2, 0.095, 0.1, -0.09, 0.035, LX)], 0.0, 0.45));
  S.push(ice([...sec(0.19, 0.1, 0.105, -0.095, 0.035, LX + 0.005), ...sec(0.34, 0.115, 0.11, -0.11, 0.04, LX - 0.005),
    ...sec(0.42, 0.1, 0.09, -0.1, 0.04, LX - 0.03)], 0.0, 0.5));
  // gold knee guard
  S.push(gold(hull([...plate([[-0.07, 0.05], [0.07, 0.05], [0.08, -0.01], [0.0, -0.065], [-0.08, -0.01]], V(LX, 0.21, 0), 0.085, 0.125)])));
  S.push(flat(hull(plate([[-0.02, 0.02], [0.02, 0.02], [0.02, -0.02], [-0.02, -0.02]], V(LX, 0.215, 0), 0.12, 0.133)), SW.glow));
  // thigh crack (outer side)
  glow(crack([V(LX + 0.115, 0.38, 0.02), V(LX + 0.117, 0.33, -0.01), V(LX + 0.117, 0.29, 0.03), V(LX + 0.112, 0.25, 0.0)], V(1, 0, 0), 0.007), S);
  // shin crack (front)
  glow(crack([V(LX - 0.03, 0.17, 0.1), V(LX + 0.0, 0.13, 0.095), V(LX - 0.02, 0.09, 0.092)], V(0, 0, 1), 0.007), S);

  // ================= TORSO (broad chest, narrower waist) =================
  const torso = [sec(0.36, 0.2, 0.13, -0.13, 0.05), sec(0.5, 0.21, 0.15, -0.14, 0.05), sec(0.62, 0.28, 0.18, -0.15, 0.07),
    sec(0.77, 0.28, 0.18, -0.16, 0.07), sec(0.85, 0.19, 0.11, -0.13, 0.05)];
  C.push(ice(torso.flat(), 0.3, 0.9));
  // ice-blue abdomen block (lighter facets)
  // gold belt + buckle with glowing rune
  C.push(gold(hull([...sec(0.39, 0.215, 0.16, -0.15, 0.06), ...sec(0.45, 0.22, 0.17, -0.155, 0.06)])));
  C.push(goldDk(hull([...sec(0.375, 0.205, 0.15, -0.14, 0.055), ...sec(0.395, 0.21, 0.155, -0.145, 0.055)])));
  C.push(gold(hull(plate([[-0.06, 0.045], [0.06, 0.045], [0.075, 0.0], [0.06, -0.045], [-0.06, -0.045], [-0.075, 0.0]], V(0, 0.42, 0), 0.15, 0.19))));
  glow(crack([V(0, 0.448, 0.19), V(0, 0.392, 0.19)], V(0, 0, 1), 0.008, 0.008, 0.01), C);
  glow(crack([V(-0.03, 0.44, 0.19), V(0, 0.415, 0.19), V(0.03, 0.44, 0.19)], V(0, 0, 1), 0.007, 0.008, 0.01), C);
  // gold tassets hanging from the belt
  S.push(gold(hull(plate([[-0.045, 0.02], [0.045, 0.02], [0.04, -0.06], [0.0, -0.085], [-0.04, -0.06]], V(0.11, 0.37, 0), 0.155, 0.18))));

  // gold gorget / collar with medallion
  C.push(gold(hull([...sec(0.8, 0.24, 0.17, -0.15, 0.07), ...sec(0.86, 0.19, 0.13, -0.13, 0.05)])));
  C.push(goldDk(hull(sec(0.785, 0.245, 0.175, -0.155, 0.07).concat(sec(0.8, 0.245, 0.175, -0.155, 0.07)))));
  // chest rune medallion: gold hex with glowing rune
  const MZ = 0.18, MY = 0.67;
  C.push(gold(hull(plate([[0, 0.075], [0.065, 0.04], [0.065, -0.04], [0, -0.075], [-0.065, -0.04], [-0.065, 0.04]], V(0, MY, 0), MZ - 0.02, MZ + 0.022))));
  C.push(paint(hull(plate([[0, 0.055], [0.048, 0.03], [0.048, -0.03], [0, -0.055], [-0.048, -0.03], [-0.048, 0.03]], V(0, MY, 0), MZ, MZ + 0.03)), SW.iceDk, 'flat'));
  const RZ = MZ + 0.03;
  glow([strip(V(0, MY + 0.042, RZ), V(0, MY - 0.042, RZ), V(0, 0, 1), 0.007, 0.007, 0.01)], C);
  glow(crack([V(-0.03, MY + 0.03, RZ), V(0, MY + 0.005, RZ), V(0.03, MY + 0.03, RZ)], V(0, 0, 1), 0.006, 0.007, 0.01), C);
  glow(crack([V(-0.03, MY - 0.035, RZ), V(0, MY - 0.012, RZ), V(0.03, MY - 0.035, RZ)], V(0, 0, 1), 0.006, 0.007, 0.01), C);
  // chest cracks branching from the medallion
  glow(crack([V(0.065, 0.66, 0.18), V(0.12, 0.7, 0.18), V(0.15, 0.66, 0.18), V(0.205, 0.71, 0.18)], V(0, 0, 1), 0.008), S);
  glow(crack([V(0.12, 0.7, 0.18), V(0.13, 0.75, 0.18)], V(0, 0, 1), 0.007), S);
  glow(crack([V(0.04, 0.6, 0.178), V(0.08, 0.56, 0.168), V(0.07, 0.51, 0.155)], V(0, 0.25, 1), 0.007), S);
  // back cracks
  glow(crack([V(0.0, 0.76, -0.16), V(0.06, 0.7, -0.16), V(0.04, 0.63, -0.155), V(0.11, 0.57, -0.145)], V(0, 0, -1), 0.008), S);

  // ================= ARMS (massive, hanging, huge blocky fists) =================
  const SHX = 0.33;
  S.push(ice([...ring(V(SHX - 0.01, 0.78, -0.01), 0.1, 0.1, 8, 'y'), ...ring(V(SHX + 0.03, 0.56, 0.0), 0.085, 0.09, 8, 'y')], 0.4, 0.9));
  S.push(iceDk([...ring(V(SHX + 0.035, 0.57, 0.0), 0.075, 0.08, 8, 'y'), ...ring(V(SHX + 0.045, 0.49, 0.02), 0.075, 0.08, 8, 'y')], 0.4, 0.65));
  S.push(ice([...ring(V(SHX + 0.045, 0.52, 0.02), 0.095, 0.095, 8, 'y'), ...ring(V(SHX + 0.06, 0.3, 0.05), 0.115, 0.11, 8, 'y')], 0.2, 0.6));
  // fist: big chamfered block + knuckle row
  const FX = SHX + 0.065, FY = 0.2, FZ = 0.06;
  S.push(ice([...cbox(V(FX, FY, FZ), 0.115, 0.1, 0.115, 0.04)], 0.08, 0.32));
  for (const dy of [-0.06, -0.02, 0.02, 0.06])
    S.push(paint(hull(cbox(V(FX - 0.005, FY + 0.045 - (Math.abs(dy) > 0.05 ? 0.012 : 0), FZ + 0.1 + 0), 0.022, 0.035, 0.03, 0.01).map((p) => p.add(V(dy * 1.4, 0, 0)))), SW.ice, 'y', [0.1, 0.3]));
  S.push(paint(hull(cbox(V(FX - 0.03, FY - 0.035, FZ + 0.1), 0.07, 0.03, 0.03, 0.012)), SW.iceDk, 'y', [0.1, 0.25])); // curled fingers
  // thumb on the inner side
  S.push(paint(hull(cbox(V(FX - 0.11, FY + 0.01, FZ + 0.07), 0.025, 0.045, 0.04, 0.012)), SW.ice, 'y', [0.1, 0.3]));
  // fist crack (outer side)
  glow(crack([V(FX + 0.116, FY + 0.06, FZ - 0.03), V(FX + 0.116, FY + 0.01, FZ + 0.02), V(FX + 0.116, FY - 0.05, FZ - 0.01)], V(1, 0, 0), 0.007), S);
  // gold bracer with rune
  S.push(gold(hull([...ring(V(SHX + 0.05, 0.43, 0.03), 0.112, 0.112, 8, 'y'), ...ring(V(SHX + 0.058, 0.33, 0.045), 0.128, 0.122, 8, 'y')])));
  S.push(goldDk(hull([...ring(V(SHX + 0.058, 0.335, 0.045), 0.134, 0.128, 8, 'y'), ...ring(V(SHX + 0.058, 0.31, 0.047), 0.13, 0.124, 8, 'y')])));
  S.push(goldDk(hull([...ring(V(SHX + 0.05, 0.445, 0.03), 0.115, 0.115, 8, 'y'), ...ring(V(SHX + 0.05, 0.425, 0.032), 0.12, 0.118, 8, 'y')])));
  {
    const bx = SHX + 0.058 + 0.125, by = 0.38, bz = 0.04, n = V(1, 0, 0);
    glow([strip(V(bx, by + 0.035, bz), V(bx, by - 0.035, bz), n, 0.006, 0.008, 0.02)], S);
    glow(crack([V(bx, by + 0.02, bz - 0.03), V(bx, by, bz), V(bx, by + 0.02, bz + 0.03)], n, 0.005, 0.008, 0.02), S);
    glow(crack([V(bx, by - 0.03, bz - 0.025), V(bx, by - 0.012, bz), V(bx, by - 0.03, bz + 0.025)], n, 0.005, 0.008, 0.02), S);
  }
  // frost spikes jutting back from the elbow and forearm
  S.push(cry(shard(V(SHX + 0.06, 0.53, -0.05), V(0.35, 0.15, -1), 0.04, 0.13)));
  S.push(cry(shard(V(SHX + 0.1, 0.5, -0.03), V(0.9, 0.25, -0.6), 0.03, 0.09)));
  S.push(cry(shard(V(SHX + 0.08, 0.27, -0.03), V(0.5, 0.1, -1), 0.03, 0.08)));
  // hip frost crystals
  S.push(cry(shard(V(0.2, 0.5, -0.04), V(1, 0.5, -0.4), 0.035, 0.09)));
  // upper-arm crack + rune
  glow(crack([V(SHX + 0.1, 0.72, 0.0), V(SHX + 0.105, 0.66, 0.03), V(SHX + 0.11, 0.6, -0.0)], V(1, -0.15, 0), 0.007), S);

  // ornate gold pauldron (layered) + glowing rune gem
  const PC = V(SHX + 0.01, 0.8, -0.01);
  S.push(gold(hull([...ring(add(PC, V(0.0, -0.08, 0)), 0.165, 0.165, 10, 'y'), ...ring(add(PC, V(-0.01, 0.0, 0)), 0.15, 0.15, 10, 'y'),
    ...ring(add(PC, V(-0.03, 0.06, 0)), 0.09, 0.1, 10, 'y')])));
  S.push(goldDk(hull([...ring(add(PC, V(0.01, -0.085, 0)), 0.172, 0.172, 10, 'y'), ...ring(add(PC, V(0.01, -0.115, 0)), 0.162, 0.162, 10, 'y')])));
  S.push(goldDk(hull([...ring(add(PC, V(0.02, -0.13, 0)), 0.15, 0.15, 10, 'y'), ...ring(add(PC, V(0.02, -0.165, 0)), 0.138, 0.138, 10, 'y')])));
  S.push(paint(hull([V(PC.x + 0.165, PC.y - 0.04, PC.z), ...[[0, 0.035], [0.035, 0], [0, -0.035], [-0.035, 0]].map(([dz, dy]) => V(PC.x + 0.13, PC.y - 0.04 + dy, PC.z + dz))]), SW.glow, 'flat'));
  S.push(paint(hull([V(PC.x + 0.14, PC.y - 0.04, PC.z + 0.0), ...[[0, 0.05], [0.05, 0], [0, -0.05], [-0.05, 0]].map(([dz, dy]) => V(PC.x + 0.115, PC.y - 0.04 + dy, PC.z + dz))]), SW.gold, 'flat'));
  // scalloped gold points hanging from the pauldron rim
  for (const a of [-0.9, -0.3, 0.3, 0.9]) {
    const d = V(Math.cos(a), 0, Math.sin(a));
    S.push(goldDk(shard(add(add(PC, d, 0.13), V(0, -0.16, 0)), add(d, V(0, -2.2, 0)), 0.03, 0.07)));
  }
  // ice crystal cluster on the pauldron
  S.push(cry(shard(V(PC.x - 0.02, PC.y + 0.04, PC.z - 0.01), V(0.25, 1, -0.15), 0.045, 0.2)));
  S.push(cry(shard(V(PC.x + 0.05, PC.y + 0.02, PC.z + 0.03), V(0.75, 1, 0.15), 0.035, 0.14)));
  S.push(cry(shard(V(PC.x - 0.06, PC.y + 0.03, PC.z - 0.05), V(-0.1, 1, -0.6), 0.035, 0.13)));
  S.push(cry(shard(V(PC.x + 0.04, PC.y + 0.01, PC.z - 0.07), V(0.6, 0.8, -0.6), 0.03, 0.11)));
  // back crystal clusters
  S.push(cry(shard(V(0.11, 0.78, -0.13), V(0.2, 1, -0.7), 0.05, 0.2)));
  S.push(cry(shard(V(0.15, 0.68, -0.14), V(0.5, 0.6, -1), 0.04, 0.14)));
  C.push(cry(shard(V(0, 0.72, -0.15), V(0, 0.7, -1), 0.05, 0.17)));
  C.push(cry(shard(V(0, 0.58, -0.135), V(0, 0.4, -1), 0.04, 0.11)));
  S.push(cry(shard(V(0.08, 0.6, -0.135), V(0.4, 0.4, -1), 0.035, 0.1)));

  // ================= HEAD (big blocky glacier skull) =================
  const hc0 = C.length, hs0 = S.length;
  const HZ = 0.06;
  const HFZ = HZ + 0.16; // front face plane
  C.push(ice([...sec(0.84, 0.13, HFZ - 0.03, HZ - 0.12, 0.04), ...sec(0.92, 0.165, HFZ, HZ - 0.14, 0.035),
    ...sec(1.05, 0.165, HFZ, HZ - 0.14, 0.035), ...sec(1.11, 0.125, HFZ - 0.04, HZ - 0.1, 0.04)], 0.82, 1.12));
  // heavy jaw block
  C.push(ice([...cbox(V(0, 0.862, HZ + 0.035), 0.14, 0.042, 0.11, 0.03)], 0.7, 1.12));
  // mouth: grim downturned line
  C.push(flat(hull(cbox(V(0, 0.885, HZ + 0.15), 0.035, 0.007, 0.01, 0.003)), SW.mouth));
  S.push(flat(hull([V(0.03, 0.878, HZ + 0.16), V(0.03, 0.892, HZ + 0.16), V(0.06, 0.875, HZ + 0.157), V(0.06, 0.887, HZ + 0.157),
    V(0.03, 0.878, HZ + 0.14), V(0.03, 0.892, HZ + 0.14), V(0.06, 0.875, HZ + 0.135), V(0.06, 0.887, HZ + 0.135)]), SW.mouth));
  // cheek cracks
  // jagged side-of-head crack with a branch
  glow(crack([V(0.166, 1.075, HZ + 0.02), V(0.166, 1.04, HZ + 0.06), V(0.166, 1.0, HZ + 0.03), V(0.166, 0.965, HZ + 0.08), V(0.166, 0.925, HZ + 0.05)], V(1, 0, 0), 0.006), S);
  glow(crack([V(0.166, 1.0, HZ + 0.03), V(0.166, 0.975, HZ - 0.01), V(0.166, 0.94, HZ + 0.0)], V(1, 0, 0), 0.005), S);
  glow(crack([V(0.166, 1.04, HZ + 0.06), V(0.166, 1.055, HZ + 0.1)], V(1, 0, 0), 0.005), S);
  glow(crack([V(0.115, 0.935, HFZ), V(0.14, 0.905, HFZ - 0.01)], V(0, 0, 1), 0.006), S);

  // fierce eyes (white glow almond, black pupil, catchlight)
  const E = V(0.073, 0.99, 0), ES = 1.2;
  const ep = (pts) => pts.map(([u, v]) => [u * ES, v * ES]);
  S.push(flat(hull(plate(ep([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.038], [-0.03, -0.034], [-0.046, -0.016]]),
    E, HFZ - 0.01, HFZ + 0.008)), SW.white));
  // glowing ice-cyan iris ring around the pupil
  S.push(flat(hull(plate(ep([[-0.033, 0.006], [0.018, 0.024], [0.027, -0.008], [0.008, -0.035], [-0.024, -0.033], [-0.037, -0.013]]),
    V(E.x - 0.004, E.y, 0), HFZ + 0.0, HFZ + 0.013)), SW.glow));
  S.push(flat(hull(plate(ep([[-0.024, 0.003], [0.01, 0.015], [0.017, -0.007], [0.004, -0.025], [-0.017, -0.024], [-0.027, -0.01]]),
    V(E.x - 0.004, E.y - 0.002, 0), HFZ + 0.005, HFZ + 0.018)), SW.eye));
  S.push(flat(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.002, E.y + 0.001, 0), HFZ + 0.012, HFZ + 0.023)), SW.white));
  // heavy protruding brow slanting down to the centre
  S.push(paint(hull([
    V(0.008, E.y + 0.012, HFZ + 0.055), V(0.01, E.y + 0.065, HFZ + 0.045),
    V(0.162, E.y + 0.055, HFZ + 0.012), V(0.162, E.y + 0.11, HFZ - 0.005),
    V(0.008, E.y + 0.012, HFZ - 0.03), V(0.01, E.y + 0.075, HFZ - 0.04),
    V(0.162, E.y + 0.055, HFZ - 0.06), V(0.162, E.y + 0.11, HFZ - 0.07),
  ]), SW.brow, 'y', [E.y, E.y + 0.1]));
  C.push(paint(hull(cbox(V(0, E.y + 0.035, HFZ + 0.025), 0.03, 0.03, 0.03, 0.01)), SW.brow, 'y', [E.y, E.y + 0.1]));

  // ice crown: gold circlet with jagged crystal spikes
  const CY = 1.075;
  C.push(gold(hull([...ring(V(0, CY, HZ + 0.005), 0.18, 0.18, 10, 'y', 0), ...ring(V(0, CY + 0.045, HZ + 0.005), 0.175, 0.175, 10, 'y', 0)])));
  C.push(paint(hull([V(0, CY + 0.06, HFZ + 0.03), V(0.03, CY + 0.025, HFZ + 0.02), V(-0.03, CY + 0.025, HFZ + 0.02), V(0, CY - 0.005, HFZ + 0.02),
    V(0, CY + 0.06, HFZ), V(0.03, CY + 0.025, HFZ), V(-0.03, CY + 0.025, HFZ), V(0, CY - 0.005, HFZ)]), SW.glow, 'flat'));
  C.push(cry(shard(V(0, CY + 0.06, HZ + 0.13), V(0, 1, 0.08), 0.042, 0.115)));
  S.push(cry(shard(V(0.08, CY + 0.05, HZ + 0.11), V(0.3, 1, 0.12), 0.036, 0.095)));
  S.push(cry(shard(V(0.135, CY + 0.045, HZ + 0.03), V(0.45, 1, 0.0), 0.034, 0.085)));
  S.push(cry(shard(V(0.12, CY + 0.045, HZ - 0.075), V(0.35, 1, -0.3), 0.03, 0.09)));
  S.push(cry(shard(V(0.05, CY + 0.045, HZ - 0.125), V(0.12, 1, -0.35), 0.03, 0.08)));
  // ice cap filling the crown
  C.push(paint(hull([...ring(V(0, CY + 0.02, HZ), 0.16, 0.16, 10, 'y', 0), ...ring(V(0, CY + 0.07, HZ), 0.11, 0.11, 10, 'y', 0)]), SW.crystal, 'y', [CY, CY + 0.08]));

  // scale the head up about the neck (big-head proportions)
  const HSC = 1.5, piv = V(0, 0.84, 0.06);
  for (const g of [...C.slice(hc0), ...S.slice(hs0)]) { g.translate(-piv.x, -piv.y, -piv.z); g.scale(HSC, HSC, HSC); g.translate(piv.x, piv.y, piv.z); }

  // ================= FROST HALO (floating, tilted, above & behind the head) =================
  const HC = V(0, 0.84 + 0.445 * HSC, 0.06 - 0.085 * HSC), HR = 0.24, tilt = 0.32;
  const hU = V(1, 0, 0), hW = V(0, -Math.sin(tilt), Math.cos(tilt)), hN = nrm(cross(hU, hW)).multiplyScalar(-1);
  const NS = 14;
  const hp = (a, r = HR) => add(add(HC, hU, Math.cos(a) * r), hW, Math.sin(a) * r);
  for (let k = 0; k < NS; k++) {
    const a0 = (2 * Math.PI * k) / NS, a1 = (2 * Math.PI * (k + 1)) / NS;
    const pts = [];
    for (const a of [a0, a1]) {
      const rad = nrm(sub(hp(a), HC));
      for (const [dr, dn] of [[-0.022, 0], [0, 0.016], [0.022, 0], [0, -0.016]]) pts.push(add(add(hp(a), rad, dr), hN, dn));
    }
    C.push(paint(hull(pts), SW.halo, 'y', [HC.y - 0.08, HC.y + 0.08]));
  }
  // frost spikes radiating from the halo (mirror symmetric set)
  for (let k = 0; k < 8; k++) {
    const a = (2 * Math.PI * k) / 8 + Math.PI / 8;
    const p = hp(a), rad = nrm(sub(p, HC));
    const len = (k % 2 ? 0.06 : 0.09);
    const g = paint(shard(add(p, rad, 0.012), rad, 0.022, len), SW.halo, 'y', [HC.y - 0.15, HC.y + 0.15]);
    if (Math.cos(a) > 0.01) S.push(g); else if (Math.abs(Math.cos(a)) <= 0.01) C.push(g);
  }

  const out = assemble(C, S);
  out.scale(GS, GS, GS); out.computeBoundingBox();
  return out;
}

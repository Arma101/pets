// Yeti Brawler (Legendary, Frozen Peaks): tall shaggy white yeti, blue face and fists,
// curled horns, ice-crystal knuckles, ornate gold-trimmed armour, glowing ice eyes.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  fur:    { i: 0, top: '#FFFFFF', bot: '#B9D3EC' },
  furLt:  { i: 1, top: '#FFFFFF', bot: '#DCEAF7' },
  skin:   { i: 2, top: '#5C9BEA', bot: '#2F62C2' },
  skinDk: { i: 3, top: '#3F78D2', bot: '#24509E' },
  eye:    { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  iris:   { i: 6, top: '#9FF7FF', bot: '#22CCFF', glow: true },
  ice:    { i: 7, top: '#F2FEFF', bot: '#8FE6FF' },
  gold:   { i: 8, top: '#FFE27A', bot: '#D7981C' },
  armor:  { i: 9, top: '#4A5DB0', bot: '#283573' },
  horn:   { i: 10, top: '#FFF4D8', bot: '#9ED8F5', draw(g, x, y) { // ivory -> frosted pale-blue tip (no green mix)
    const gr = g.createLinearGradient(0, y + 16, 0, y + 112);
    gr.addColorStop(0, '#FFF4D8'); gr.addColorStop(0.55, '#E2CC98'); gr.addColorStop(0.7, '#F4F8FA');
    gr.addColorStop(0.82, '#D2EEFC'); gr.addColorStop(1, '#8FD2F5');
    g.fillStyle = '#FFF4D8'; g.fillRect(x, y, 128, 16); g.fillStyle = gr; g.fillRect(x, y + 16, 128, 96);
    g.fillStyle = '#8FD2F5'; g.fillRect(x, y + 112, 128, 16); } },
  furBk:  { i: 14, top: '#FFFFFF', bot: '#D4E6F7' },
  mouth:  { i: 11, top: '#1E2E66', bot: '#121C44' },
  muzzle: { i: 12, top: '#8CC0F5', bot: '#5B92DE' },
  gem:    { i: 13, top: '#D8FEFF', bot: '#5ADFFF', glow: true },
};
const SW = PALETTE;

export function buildGeometry() {
  const C = [], S = [];
  const furH = (pts, lo, hi) => paint(hull(pts), SW.fur, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');
  const tuft = (b, d, w, l, f = 0.6, sw = SW.fur) => paint(shard(b, d, w, l, 4, f), sw, 'y', [b.y - l - 0.02, b.y + 0.03]);
  const crystal = (b, d, w, l) => paint(shard(b, d, w, l, 6, 1), SW.ice, 'y', [b.y - 0.02, b.y + l]);

  // ================= TORSO (big barrel, broad gorilla shoulders) =================
  const T = [
    [0.25, 0.0, 0.17, 0.14],
    [0.4, 0.0, 0.22, 0.17],
    [0.56, 0.01, 0.26, 0.19],
    [0.7, -0.01, 0.25, 0.175],
    [0.8, -0.02, 0.15, 0.12],
  ];
  C.push(furH(T.flatMap(([y, z, a, b]) => ring(V(0, y, z), a, b, 10, 'y')), 0.2, 0.85));

  // ================= LEGS (short, thick, shaggy) =================
  S.push(furH([...ring(V(0.13, 0.36, -0.01), 0.1, 0.1, 8), ...ring(V(0.145, 0.2, 0.0), 0.105, 0.105, 8),
    ...ring(V(0.15, 0.07, 0.01), 0.085, 0.085, 8)], 0.0, 0.5));
  // blue feet with 3 chunky toes
  S.push(paint(hull(cbox(V(0.155, 0.04, 0.03), 0.085, 0.04, 0.1, 0.022)), SW.skin, 'y', [0, 0.1]));
  for (const dx of [-0.05, 0, 0.05])
    S.push(paint(hull(cbox(V(0.155 + dx, 0.03, 0.13), 0.026, 0.03, 0.03, 0.012)), SW.skinDk, 'y', [0, 0.08]));
  // shaggy fur hanging over the ankles
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI / 2 + (k / 6) * Math.PI * 2 * 0.999; // around the shin
    const ox = Math.sin(a), oz = Math.cos(a);
    S.push(tuft(V(0.15 + ox * 0.08, 0.13, 0.01 + oz * 0.08), V(ox * 0.6, -1, oz * 0.6), 0.04, 0.07));
  }

  // ================= FUR SKIRT under the belt, and BELT =================
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI + 0.12; // right half (0..PI from front to back)
    const ox = Math.sin(a), oz = Math.cos(a);
    S.push(tuft(V(ox * 0.185, 0.29, oz * 0.15), V(ox * 0.5, -1, oz * 0.5), 0.05, 0.1));
  }
  C.push(tuft(V(0, 0.29, -0.15), V(0, -1, -0.5), 0.05, 0.1));
  // belt: navy band with gold trim rings and a big gold buckle
  C.push(paint(hull([...ring(V(0, 0.28, 0.0), 0.2, 0.165, 12, 'y'), ...ring(V(0, 0.36, 0.0), 0.212, 0.172, 12, 'y')]), SW.armor, 'y', [0.28, 0.36]));
  C.push(paint(hull([...ring(V(0, 0.27, 0.0), 0.207, 0.17, 12, 'y'), ...ring(V(0, 0.29, 0.0), 0.207, 0.17, 12, 'y')]), SW.gold, 'flat'));
  C.push(paint(hull([...ring(V(0, 0.35, 0.0), 0.218, 0.177, 12, 'y'), ...ring(V(0, 0.37, 0.0), 0.218, 0.177, 12, 'y')]), SW.gold, 'flat'));
  C.push(paint(hull(plate([[-0.06, 0.0], [0, 0.055], [0.06, 0.0], [0, -0.055]], V(0, 0.32, 0), 0.15, 0.2)), SW.gold, 'y', [0.27, 0.38]));
  C.push(paint(hull(plate([[-0.028, 0.0], [0, 0.03], [0.028, 0.0], [0, -0.03]], V(0, 0.32, 0), 0.17, 0.212)), SW.gem, 'flat'));

  // ================= CHEST ARMOUR (navy plate, gold rim, ice gem) =================
  const chestPoly = [[-0.15, 0.1], [0.15, 0.1], [0.17, 0.03], [0.12, -0.09], [0, -0.13], [-0.12, -0.09], [-0.17, 0.03]];
  const grow = (pp, s, d) => pp.map(([u, v]) => [u * s, v * s + d]);
  // plate follows the barrel curvature (torso ellipse rx .26 rz .19 at the chest)
  const zs = (u) => 0.01 + 0.19 * Math.sqrt(Math.max(0, 1 - (u / 0.275) ** 2));
  const curved = (pp, cy, off, th) => pp.flatMap(([u, v]) => [V(u, cy + v, zs(u) + off), V(u, cy + v, zs(u) + off - th)]);
  C.push(paint(hull(curved(grow(chestPoly, 1.1, 0), 0.58, 0.02, 0.08)), SW.gold, 'y', [0.44, 0.7]));
  C.push(paint(hull(curved(chestPoly, 0.585, 0.034, 0.08)), SW.armor, 'y', [0.45, 0.69]));
  // emblem: gold diamond with glowing ice gem
  C.push(paint(hull(plate([[-0.055, 0.0], [0, 0.065], [0.055, 0.0], [0, -0.065]], V(0, 0.58, 0), 0.2, 0.245)), SW.gold, 'y', [0.51, 0.65]));
  C.push(paint(hull([...plate([[-0.03, 0.0], [0, 0.038], [0.03, 0.0], [0, -0.038]], V(0, 0.58, 0), 0.24, 0.252), V(0, 0.58, 0.268)]), SW.gem, 'y', [0.54, 0.62]));

  // ================= BACK + SIDE FUR (big staggered shards fanning down) =================
  const ell = (y) => { // torso ellipse radii at height y
    for (let k = 0; k < T.length - 1; k++) if (y >= T[k][0] && y <= T[k + 1][0]) {
      const f = (y - T[k][0]) / (T[k + 1][0] - T[k][0]);
      return [T[k][2] + (T[k + 1][2] - T[k][2]) * f, T[k][3] + (T[k + 1][3] - T[k][3]) * f];
    }
    return [T[0][2], T[0][3]];
  };
  const backTuft = (y, a, w, l, tilt) => {
    const [rx, rz] = ell(y), ox = Math.sin(a), oz = Math.cos(a);
    const b = V(ox * rx * 0.9, y, oz * rz * 0.9);
    const g = shard(b, V(ox * (0.45 + tilt) + Math.cos(a) * 0.0, -1, oz * (0.45 + tilt)), w, l, 4, 0.55);
    return paint(g, SW.furBk, 'y', [y - l - 0.02, y + 0.04]);
  };
  // [y, angles (rad from front, PI = back), base w, base l]; rows offset by half a step
  const rows = [
    [0.77, [1.55, 2.05, 2.6], 0.1, 0.15],
    [0.66, [1.8, 2.35, 2.85], 0.1, 0.16],
    [0.53, [1.5, 2.08, 2.62], 0.095, 0.15],
    [0.42, [1.78, 2.35, 2.88], 0.09, 0.13],
  ];
  rows.forEach(([y, angs, w, l], r) => {
    angs.forEach((a, k) => {
      const v = ((r * 3 + k * 7) % 5) / 4; // deterministic variety 0..1
      S.push(backTuft(y + (v - 0.5) * 0.03, a, w * (0.9 + 0.2 * v), l * (0.85 + 0.35 * v), 0.15 * v));
    });
    if (r % 2 === 0) C.push(backTuft(y - 0.01, Math.PI, w * 1.05, l * 1.1, 0.05));
  });

  // ================= SHOULDER PAULDRONS (navy, gold rim, ice crystals) =================
  const SH = V(0.265, 0.72, -0.005);
  S.push(paint(hull([...ring(V(SH.x, SH.y - 0.02, SH.z), 0.125, 0.135, 8, 'y'), ...ring(V(SH.x + 0.01, SH.y + 0.05, SH.z), 0.1, 0.11, 8, 'y'),
    ...ring(V(SH.x - 0.01, SH.y + 0.085, SH.z), 0.05, 0.06, 8, 'y')]), SW.armor, 'y', [SH.y - 0.03, SH.y + 0.09]));
  S.push(paint(hull([...ring(V(SH.x + 0.005, SH.y - 0.055, SH.z), 0.135, 0.145, 8, 'y'), ...ring(V(SH.x + 0.005, SH.y - 0.02, SH.z), 0.135, 0.145, 8, 'y')]), SW.gold, 'y', [SH.y - 0.06, SH.y - 0.01]));
  S.push(crystal(V(SH.x + 0.01, SH.y + 0.07, SH.z - 0.01), V(0.25, 1, -0.1), 0.028, 0.11));
  S.push(crystal(V(SH.x + 0.06, SH.y + 0.05, SH.z + 0.02), V(0.8, 0.8, 0.1), 0.022, 0.08));
  S.push(crystal(V(SH.x - 0.035, SH.y + 0.06, SH.z - 0.05), V(-0.05, 1, -0.6), 0.02, 0.07));

  // ================= ARMS (long gorilla arms, blue fists, ice knuckles) =================
  const EL = V(0.33, 0.49, 0.0), WR = V(0.35, 0.29, 0.06), FI = V(0.355, 0.19, 0.075);
  S.push(furH([...ring(V(0.27, 0.68, -0.005), 0.09, 0.1, 8, 'y'), ...ring(EL, 0.085, 0.09, 8, 'y')], 0.3, 0.8));
  S.push(furH([...ring(V(EL.x, EL.y + 0.01, EL.z), 0.088, 0.092, 8, 'y'), ...ring(V(0.345, 0.37, 0.035), 0.1, 0.1, 8, 'y'), ...ring(WR, 0.075, 0.075, 8, 'y')], 0.2, 0.6));
  // shaggy elbow + forearm fur
  S.push(tuft(V(EL.x + 0.07, EL.y + 0.02, EL.z - 0.03), V(0.6, -1, -0.5), 0.05, 0.09));
  S.push(tuft(V(EL.x + 0.02, EL.y + 0.02, EL.z - 0.08), V(0.1, -1, -0.8), 0.05, 0.09));
  S.push(tuft(V(0.28, 0.62, -0.08), V(0.2, -1, -0.6), 0.05, 0.09));
  S.push(tuft(V(0.35, 0.63, -0.02), V(0.8, -1, -0.2), 0.05, 0.09));
  // fur cuff at the wrist
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.3;
    const ox = Math.sin(a), oz = Math.cos(a);
    S.push(tuft(V(WR.x + ox * 0.075, WR.y + 0.03, WR.z + oz * 0.075), V(ox * 0.7, -1, oz * 0.7), 0.04, 0.075));
  }
  // gold bracer band
  S.push(paint(hull([...ring(V(0.347, 0.39, 0.03), 0.105, 0.105, 8, 'y'), ...ring(V(0.348, 0.43, 0.025), 0.103, 0.103, 8, 'y')]), SW.gold, 'y', [0.38, 0.44]));
  // big blue fist: palm block + four finger rolls curled forward
  S.push(paint(hull([...cbox(V(FI.x, FI.y + 0.01, FI.z - 0.01), 0.085, 0.075, 0.08, 0.03), ...ring(V(WR.x, WR.y - 0.01, WR.z), 0.065, 0.065, 8, 'y')]), SW.skin, 'y', [FI.y - 0.09, FI.y + 0.1]));
  for (const dx of [-0.054, -0.018, 0.018, 0.054])
    S.push(paint(hull(cbox(V(FI.x + dx, FI.y - 0.005, FI.z + 0.07), 0.019, 0.05, 0.03, 0.012)), SW.skinDk, 'y', [FI.y - 0.06, FI.y + 0.05]));
  // thumb
  S.push(paint(hull(cbox(V(FI.x - 0.075, FI.y - 0.015, FI.z + 0.05), 0.022, 0.03, 0.035, 0.012)), SW.skinDk, 'flat'));
  // ice-crystal knuckles
  for (const dx of [-0.054, -0.018, 0.018, 0.054])
    S.push(crystal(V(FI.x + dx, FI.y + 0.05, FI.z + 0.075), V(dx * 2.5, 1.1, 0.9), 0.03, 0.095));

  const c0 = C.length, s0 = S.length;
  // ================= HEAD (big, white fur hood, blue face) =================
  const H = { y: 0.93, z: 0.06 };
  C.push(furH([...cbox(V(0, H.y, H.z + 0.01), 0.19, 0.155, 0.168, 0.085), ...ring(V(0, H.y + 0.18, H.z - 0.02), 0.12, 0.1, 8, 'y'),
    V(0.2, H.y - 0.09, H.z + 0.05), V(-0.2, H.y - 0.09, H.z + 0.05)], 0.75, 1.15));
  const FZ = H.z + 0.19;
  // blue face plate
  C.push(paint(hull([...cbox(V(0, H.y - 0.02, H.z + 0.1), 0.14, 0.11, 0.09, 0.03), V(0.1, H.y + 0.09, H.z + 0.11), V(-0.1, H.y + 0.09, H.z + 0.11)]), SW.skin, 'y', [H.y - 0.13, H.y + 0.1]));
  // muzzle (lighter blue), nose, mouth
  C.push(paint(hull([...cbox(V(0, H.y - 0.08, FZ + 0.015), 0.09, 0.045, 0.035, 0.022), V(0.05, H.y - 0.02, FZ - 0.01), V(-0.05, H.y - 0.02, FZ - 0.01)]), SW.muzzle, 'y', [H.y - 0.13, H.y - 0.02]));
  C.push(paint(hull([...cbox(V(0, H.y - 0.045, FZ + 0.05), 0.04, 0.018, 0.012, 0.008), V(0, H.y - 0.07, FZ + 0.045), V(0.018, H.y - 0.063, FZ + 0.045), V(-0.018, H.y - 0.063, FZ + 0.045)]), SW.mouth, 'y'));
  S.push(paint(hull([V(0, H.y - 0.1, FZ + 0.054), V(0, H.y - 0.09, FZ + 0.054), V(0.055, H.y - 0.11, FZ + 0.044), V(0.055, H.y - 0.1, FZ + 0.044), V(0, H.y - 0.1, FZ + 0.042), V(0.055, H.y - 0.106, FZ + 0.034)]), SW.mouth, 'flat'));
  // small ivory fangs poking up from the lower lip
  S.push(paint(hull([V(0.04, H.y - 0.112, FZ + 0.036), V(0.06, H.y - 0.112, FZ + 0.036), V(0.05, H.y - 0.112, FZ + 0.05), V(0.05, H.y - 0.08, FZ + 0.042)]), SW.white, 'flat'));
  // white beard under the muzzle
  C.push(tuft(V(0, H.y - 0.115, FZ - 0.01), V(0, -1, 0.35), 0.05, 0.08, 0.6, SW.furLt));
  S.push(tuft(V(0.06, H.y - 0.11, FZ - 0.02), V(0.35, -1, 0.3), 0.045, 0.075, 0.6, SW.furLt));

  // fierce glowing eyes: white almond, glowing ice iris, black pupil, catchlight
  const E = V(0.072, H.y + 0.022, 0);
  const es = (pp) => pp.map(([u, v]) => [u * 1.2, v * 1.2]);
  S.push(flat(hull(plate(es([[-0.042, 0.004], [0.046, 0.032], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]), E, FZ - 0.03, FZ + 0.004)), SW.white));
  S.push(flat(hull(plate(es([[-0.03, 0.006], [0.02, 0.022], [0.028, -0.008], [0.008, -0.034], [-0.022, -0.032], [-0.034, -0.012]]), V(E.x - 0.004, E.y, 0), FZ - 0.01, FZ + 0.01)), SW.iris));
  S.push(flat(hull(plate(es([[-0.012, 0.0], [0.006, 0.008], [0.011, -0.006], [0.003, -0.018], [-0.01, -0.016], [-0.014, -0.006]]), V(E.x - 0.002, E.y - 0.004, 0), FZ - 0.006, FZ + 0.016)), SW.eye));
  S.push(flat(hull(plate(es([[-0.005, -0.005], [0.005, -0.005], [0.005, 0.005], [-0.005, 0.005]]), V(E.x + 0.004, E.y + 0.0, 0), FZ + 0.0, FZ + 0.022)), SW.white));
  // heavy brow ridge, slanting down toward the nose
  S.push(paint(hull([
    V(0.02, E.y + 0.012, FZ + 0.035), V(0.022, E.y + 0.05, FZ + 0.025),
    V(0.15, E.y + 0.05, FZ + 0.0), V(0.15, E.y + 0.09, FZ - 0.015),
    V(0.02, E.y + 0.012, FZ - 0.03), V(0.022, E.y + 0.06, FZ - 0.04),
    V(0.15, E.y + 0.05, FZ - 0.06), V(0.15, E.y + 0.09, FZ - 0.07),
  ]), SW.skinDk, 'y', [E.y, E.y + 0.09]));

  // fur crest on the crown + sideburns framing the face
  C.push(tuft(V(0, H.y + 0.17, H.z + 0.04), V(0, 1, 0.45), 0.075, 0.09));
  S.push(tuft(V(0.075, H.y + 0.16, H.z + 0.03), V(0.4, 1, 0.35), 0.07, 0.08));
  C.push(tuft(V(0, H.y + 0.15, H.z - 0.1), V(0, 0.6, -1), 0.055, 0.08));
  S.push(tuft(V(0.185, H.y - 0.06, H.z + 0.08), V(1, -0.7, 0.25), 0.05, 0.085));
  S.push(tuft(V(0.18, H.y - 0.11, H.z + 0.0), V(0.8, -1, -0.1), 0.05, 0.085));
  S.push(tuft(V(0.16, H.y - 0.12, H.z + 0.1), V(0.5, -1, 0.4), 0.045, 0.075));

  // white fur framing the blue face: forehead bangs and cheek tufts over the face edge
  S.push(tuft(V(0.065, H.y + 0.14, FZ - 0.035), V(0.15, -0.7, 1), 0.06, 0.055, 0.5));
  S.push(tuft(V(0.135, H.y + 0.12, FZ - 0.04), V(0.6, -0.7, 1), 0.055, 0.055, 0.5));
  C.push(tuft(V(0, H.y + 0.145, FZ - 0.035), V(0, -0.7, 1), 0.06, 0.055, 0.5));
  S.push(tuft(V(0.165, H.y + 0.02, FZ - 0.04), V(1, -0.4, 0.5), 0.055, 0.07, 0.5));
  S.push(tuft(V(0.15, H.y - 0.07, FZ - 0.035), V(0.9, -0.8, 0.7), 0.055, 0.075, 0.5));
  S.push(tuft(V(0.11, H.y - 0.13, FZ - 0.04), V(0.5, -1, 0.5), 0.05, 0.07, 0.5));
  // shaggy mane around the sides and back of the head
  for (const [y, n, w, l] of [[H.y + 0.08, 5, 0.075, 0.1], [H.y - 0.05, 6, 0.075, 0.11]]) {
    for (let k = 0; k < n; k++) {
      const a = Math.PI * 0.45 + (k / (n - 1)) * Math.PI * 0.5;
      const ox = Math.sin(a), oz = Math.cos(a);
      if (ox < 0.1) continue;
      S.push(tuft(V(ox * 0.17, y, H.z + oz * 0.14), V(ox * 0.6, -1, oz * 0.7), w, l));
    }
    C.push(tuft(V(0, y, H.z - 0.14), V(0, -1, -0.7), w, l));
  }
  // curled ram horns: out of the crown sides, curling back, down and forward
  S.push(paint(tube(curveSamples(
    [V(0.12, H.y + 0.12, H.z - 0.02), V(0.22, H.y + 0.17, H.z - 0.04), V(0.3, H.y + 0.12, H.z - 0.08),
      V(0.32, H.y + 0.02, H.z - 0.06), V(0.29, H.y - 0.04, H.z + 0.02), V(0.255, H.y + 0.0, H.z + 0.07)],
    10, (t) => 0.05 * (1 - t) + 0.012),
    { seg: 6, axis: V(0, 0, 1), capEnd: 0.02, twist: (i) => (i % 2) * Math.PI / 6 }), SW.horn, 'len'));
  // gold ring at the horn base
  S.push(paint(hull([...ring(V(0.155, H.y + 0.14, H.z - 0.027), 0.058, 0.058, 8, 'x'), ...ring(V(0.175, H.y + 0.15, H.z - 0.032), 0.058, 0.058, 8, 'x')]), SW.gold, 'flat'));

  // scale the whole head up about the neck (big-head proportions)
  const HP = V(0, 0.8, 0.04), HSC = 1.36;
  for (const g of [...C.slice(c0), ...S.slice(s0)]) {
    g.translate(-HP.x, -HP.y, -HP.z); g.scale(HSC, HSC, HSC); g.translate(HP.x, HP.y + 0.035, HP.z + 0.01);
  }
  return assemble(C, S);
}

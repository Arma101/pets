// Penguin Puncher (Epic, Frozen Peaks): sturdy emperor penguin, navy back, white chest,
// tape-wrapped flipper fists, yellow-orange cheek markings, icy armour plates and ice crystals.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  navy:   { i: 0, top: '#34407A', bot: '#161C3E' },
  navyL:  { i: 1, top: '#46549A', bot: '#252E5E' },
  belly:  { i: 2, top: '#FFE49A', bot: '#D9E4EE', draw(g, x, y) {
    const gr = g.createLinearGradient(0, y + 16, 0, y + 112);
    gr.addColorStop(0, '#FFE49A'); gr.addColorStop(0.32, '#FFFFFF'); gr.addColorStop(0.6, '#F7FAFD'); gr.addColorStop(1, '#D9E4EE');
    g.fillStyle = '#FFE49A'; g.fillRect(x, y, 128, 16); g.fillStyle = gr; g.fillRect(x, y + 16, 128, 96);
    g.fillStyle = '#D9E4EE'; g.fillRect(x, y + 112, 128, 16); } },
  white:  { i: 3, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:    { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  gold:   { i: 5, top: '#FFD23A', bot: '#F28A12' },
  beak:   { i: 6, top: '#3A3E4C', bot: '#1A1C24' },
  beakO:  { i: 7, top: '#FFB13A', bot: '#F06A1A' },
  tape:   { i: 8, top: '#FFFFFF', bot: '#F4F8FC' },
  tapeS:  { i: 15, top: '#8FB4DA', bot: '#6E93BD' },
  ice:    { i: 9, top: '#E8FBFF', bot: '#6EC6F0' },
  armor:  { i: 10, top: '#A8E6FF', bot: '#3C8FD0' },
  foot:   { i: 11, top: '#4A4F62', bot: '#22252F' },
  frost:  { i: 12, top: '#FFFFFF', bot: '#CDEFFF' },
  brow:   { i: 13, top: '#5263B4', bot: '#2A3470' },
  steel:  { i: 14, top: '#D9E6F2', bot: '#8197B0' },
};
const P = PALETTE;

export function buildGeometry() {
  const C = [], S = [];
  const flat = (g, sw) => paint(g, sw, 'flat');
  const Y = (g, sw, lo, hi) => paint(g, sw, 'y', lo === undefined ? null : [lo, hi]);

  // ================= BODY (sturdy egg: navy back, white/yellow chest) =================
  C.push(Y(hull([
    ...ring(V(0, 0.07, -0.01), 0.15, 0.13, 10, 'y', Math.PI / 10),
    ...ring(V(0, 0.17, 0.0), 0.25, 0.21, 10, 'y', Math.PI / 10),
    ...ring(V(0, 0.33, 0.0), 0.275, 0.225, 10, 'y', Math.PI / 10),
    ...ring(V(0, 0.49, -0.01), 0.24, 0.2, 10, 'y', Math.PI / 10),
    ...ring(V(0, 0.62, 0.0), 0.175, 0.16, 10, 'y', Math.PI / 10),
  ]), P.navy, 0.05, 0.7));
  // white belly bulging forward
  C.push(Y(hull([
    ...ring(V(0, 0.08, 0.04), 0.13, 0.12, 10, 'y', Math.PI / 10),
    ...ring(V(0, 0.18, 0.06), 0.215, 0.18, 10, 'y', Math.PI / 10),
    ...ring(V(0, 0.34, 0.06), 0.235, 0.195, 10, 'y', Math.PI / 10),
    ...ring(V(0, 0.5, 0.05), 0.195, 0.17, 10, 'y', Math.PI / 10),
    ...ring(V(0, 0.63, 0.06), 0.13, 0.13, 10, 'y', Math.PI / 10),
    ...ring(V(0, 0.69, 0.1), 0.08, 0.08, 10, 'y', Math.PI / 10),
  ]), P.belly, 0.06, 0.7));
  // neck
  C.push(Y(hull([...ring(V(0, 0.58, 0.0), 0.17, 0.16, 10, 'y', Math.PI / 10), ...ring(V(0, 0.72, 0.04), 0.16, 0.13, 10, 'y', Math.PI / 10)]), P.navy, 0.5, 0.9));

  // tail wedge
  C.push(Y(hull([V(0.1, 0.1, -0.14), V(-0.1, 0.1, -0.14), V(0.07, 0.16, -0.14), V(-0.07, 0.16, -0.14),
    V(0.075, 0.035, -0.21), V(-0.075, 0.035, -0.21), V(0.03, 0.03, -0.235), V(-0.03, 0.03, -0.235), V(0, 0.06, -0.23)]), P.navy, 0.04, 0.2));

  // ================= LEGS + FEET (short stubs, wide planted feet with toes) =================
  const lx = 0.11;
  S.push(Y(hull([...ring(V(lx, 0.04, 0.04), 0.06, 0.06, 6), ...ring(V(lx, 0.14, 0.03), 0.07, 0.07, 6)]), P.foot, 0, 0.14));
  S.push(Y(hull(cbox(V(lx + 0.005, 0.03, 0.07), 0.075, 0.03, 0.06, 0.018)), P.foot, 0, 0.07));
  for (const [dx, dz] of [[-0.055, 0.075], [0.0, 0.095], [0.06, 0.075]]) {
    S.push(Y(hull([...cbox(V(lx + dx * 0.5, 0.026, 0.1 + dz * 0.4), 0.026, 0.026, 0.026, 0.009),
      ...cbox(V(lx + dx, 0.02, 0.1 + dz), 0.024, 0.02, 0.02, 0.007)]), P.foot, 0, 0.06));
    S.push(flat(shard(V(lx + dx * 1.05, 0.018, 0.1 + dz + 0.016), V(dx * 0.6, -0.4, 0.8), 0.016, 0.04), P.steel));
  }

  // ================= FLIPPERS (boxing guard, wrapped in tape) =================
  const sh = V(0.245, 0.52, 0.0), el = V(0.31, 0.38, 0.07), wr = V(0.25, 0.5, 0.21);
  S.push(Y(hull([...cbox(sh, 0.05, 0.085, 0.085, 0.03), ...cbox(el, 0.045, 0.06, 0.06, 0.022)]), P.navy, 0.3, 0.6));
  S.push(Y(hull([...cbox(el, 0.045, 0.06, 0.06, 0.022), ...cbox(wr, 0.042, 0.055, 0.05, 0.02)]), P.navy, 0.3, 0.6));
  // tape sleeve over the forearm
  {
    const m = el.clone().lerp(wr, 0.28);
    S.push(Y(hull([...cbox(m, 0.051, 0.066, 0.05, 0.02), ...cbox(wr, 0.05, 0.062, 0.05, 0.02)]), P.tape, 0.36, 0.6));
    for (const t of [0.25, 0.7]) {
      const a = m.clone().lerp(wr, t), b2 = m.clone().lerp(wr, t + 0.05);
      S.push(flat(hull([...cbox(a, 0.056, 0.071, 0.055, 0.022), ...cbox(b2, 0.056, 0.071, 0.055, 0.022)]), P.tapeS));
    }
  }
  // taped fist
  const F = V(0.21, 0.54, 0.285);
  S.push(Y(hull([...cbox(F, 0.08, 0.083, 0.078, 0.03), V(F.x - 0.02, F.y + 0.02, F.z + 0.094)]), P.tape, F.y - 0.09, F.y + 0.09));
  // tape seams (thin raised strips across the fist)
  for (const dy of [-0.04, 0.04]) S.push(flat(hull(cbox(V(F.x, F.y + dy, F.z), 0.087, 0.0065, 0.085, 0.032)), P.tapeS));
  // knuckle ridge
  for (const dy of [-0.052, -0.026, 0.026, 0.052])
    S.push(Y(hull(cbox(V(F.x - 0.025, F.y + dy, F.z + 0.078), 0.04, 0.014, 0.02, 0.006)), P.tape, F.y - 0.09, F.y + 0.09));

  // ================= ARMOUR (icy chest plate + shoulder pauldrons) =================
  // chest plate: faceted shield on the upper chest
  C.push(Y(hull([
    ...plate([[-0.1, 0.07], [0.1, 0.07], [0.13, 0.0], [0.08, -0.09], [0, -0.13], [-0.08, -0.09], [-0.13, 0.0]], V(0, 0.43, 0), 0.222, 0.262),
    V(0, 0.43, 0.277),
  ]), P.armor, 0.3, 0.5));
  C.push(Y(hull(plate([[-0.05, 0.03], [0.05, 0.03], [0.065, 0.0], [0, -0.07], [-0.065, 0.0]], V(0, 0.435, 0), 0.257, 0.283)), P.ice, 0.36, 0.47));
  // pauldrons
  S.push(Y(hull([
    ...ring(V(0.25, 0.62, 0.0), 0.075, 0.1, 8, 'y'),
    ...ring(V(0.29, 0.54, 0.0), 0.1, 0.13, 8, 'y'),
    ...ring(V(0.31, 0.48, 0.0), 0.075, 0.11, 8, 'y'),
  ]), P.armor, 0.46, 0.66));
  // ice crystals on shoulders
  S.push(Y(shard(V(0.27, 0.62, 0.02), V(0.3, 1, 0.1), 0.035, 0.13, 4), P.ice, 0.6, 0.76));
  S.push(Y(shard(V(0.31, 0.58, -0.05), V(0.8, 0.8, -0.3), 0.03, 0.1, 4), P.ice, 0.58, 0.7));
  S.push(Y(shard(V(0.3, 0.59, 0.07), V(0.7, 0.8, 0.4), 0.025, 0.08, 4), P.ice, 0.58, 0.68));

  // ================= HEAD =================
  const H = { y: 0.8, z: 0.05 };
  C.push(Y(hull([
    ...cbox(V(0, H.y, H.z), 0.195, 0.145, 0.15, 0.055),
    V(0.15, H.y - 0.13, H.z - 0.13), V(-0.15, H.y - 0.13, H.z - 0.13),
    ...ring(V(0, H.y + 0.16, H.z - 0.01), 0.12, 0.1, 8, 'y'),
    V(0.17, H.y - 0.12, H.z + 0.04), V(-0.17, H.y - 0.12, H.z + 0.04),
  ]), P.navy, 0.62, 0.98));
  const FZ = H.z + 0.15;

  // bold yellow-orange cheek/ear markings sweeping down the neck
  {
    // teardrop on the flat head side, flush with the head (sits ~0.006 proud)
    const td = [[0.06, -0.01], [0.045, -0.07], [-0.01, -0.09], [-0.07, -0.08], [-0.088, -0.02], [-0.088, 0.05], [-0.04, 0.06], [0.02, 0.03]];
    const pts = [];
    for (const [y, z] of td) {
      pts.push(V(0.185, H.y + y, H.z + z));
      pts.push(V(0.201, H.y + y * 0.9, H.z + z * 0.9));
    }
    S.push(Y(hull(pts), P.gold, H.y - 0.09, H.y + 0.06));
    // strip down the neck, following the neck surface
    const band = [];
    const on = (y, a, rA, rB, cz, off) => V((rA + off) * Math.cos(a), y, cz + (rB + off) * Math.sin(a));
    const d = Math.PI / 180;
    for (const off of [-0.012, 0.007]) {
      band.push(on(0.72, 8 * d, 0.16, 0.13, 0.04, off), on(0.72, 34 * d, 0.16, 0.13, 0.04, off));
      band.push(on(0.665, 28 * d, 0.168, 0.15, 0.02, off), on(0.665, 52 * d, 0.168, 0.15, 0.02, off));
    }
    S.push(Y(hull(band), P.gold, 0.6, 0.73));
  }

  // beak: long, chunky, slightly down-turned, dark with an orange lower stripe
  C.push(Y(hull([
    ...cbox(V(0, H.y - 0.04, FZ + 0.005), 0.055, 0.04, 0.02, 0.012),
    V(0.03, H.y - 0.03, FZ + 0.08), V(-0.03, H.y - 0.03, FZ + 0.08),
    V(0, H.y - 0.075, FZ + 0.16), V(0.012, H.y - 0.06, FZ + 0.15), V(-0.012, H.y - 0.06, FZ + 0.15),
  ]), P.beak, H.y - 0.08, H.y));
  C.push(Y(hull([...cbox(V(0, H.y - 0.085, FZ + 0.0), 0.045, 0.015, 0.02, 0.006),
    V(0.025, H.y - 0.08, FZ + 0.08), V(-0.025, H.y - 0.08, FZ + 0.08), V(0, H.y - 0.082, FZ + 0.13)]), P.beakO, H.y - 0.1, H.y - 0.07));

  // fierce eyes
  const E = V(0.092, H.y + 0.03, 0), ek = 1.18;
  const K = (a) => a.map(([u, v]) => [u * ek, v * ek]);
  S.push(flat(hull(plate(K([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.01, FZ + 0.012)), P.white));
  S.push(flat(hull(plate(K([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.006, E.y, 0), FZ + 0.006, FZ + 0.018)), P.eye));
  S.push(flat(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.002, E.y + 0.004, 0), FZ + 0.014, FZ + 0.021)), P.white));
  // heavy brow
  S.push(Y(hull([
    V(0.026, E.y + 0.012, FZ + 0.032), V(0.028, E.y + 0.052, FZ + 0.022),
    V(0.16, E.y + 0.052, FZ - 0.008), V(0.16, E.y + 0.092, FZ - 0.024),
    V(0.026, E.y + 0.012, FZ - 0.03), V(0.028, E.y + 0.062, FZ - 0.04),
    V(0.16, E.y + 0.052, FZ - 0.06), V(0.16, E.y + 0.094, FZ - 0.07),
  ]), P.brow, E.y, E.y + 0.1));
  // frost rim on the brow
  S.push(Y(hull([
    V(0.04, E.y + 0.058, FZ + 0.02), V(0.15, E.y + 0.094, FZ - 0.016),
    V(0.04, E.y + 0.072, FZ - 0.02), V(0.15, E.y + 0.104, FZ - 0.05),
    V(0.04, E.y + 0.064, FZ - 0.0), V(0.15, E.y + 0.1, FZ - 0.033),
  ]), P.frost, E.y + 0.05, E.y + 0.11));

  // frost cap on the crown
  C.push(Y(hull([...ring(V(0, H.y + 0.168, H.z - 0.01), 0.125, 0.105, 8, 'y'),
    ...ring(V(0, H.y + 0.128, H.z - 0.01), 0.175, 0.14, 8, 'y'), V(0, H.y + 0.14, H.z + 0.16), V(0, H.y + 0.13, H.z - 0.165)]), P.frost, H.y + 0.12, H.y + 0.17));
  // ================= FROST CREST (ice crystal shards on the crown) =================
  C.push(Y(shard(V(0, H.y + 0.15, H.z + 0.02), V(0, 1, -0.2), 0.04, 0.14, 4), P.ice, H.y + 0.12, H.y + 0.3));
  C.push(Y(shard(V(0, H.y + 0.14, H.z - 0.08), V(0, 0.8, -0.7), 0.035, 0.12, 4), P.ice, H.y + 0.1, H.y + 0.26));
  S.push(Y(shard(V(0.06, H.y + 0.145, H.z - 0.01), V(0.5, 1, -0.1), 0.032, 0.11, 4), P.ice, H.y + 0.12, H.y + 0.26));
  S.push(Y(shard(V(0.1, H.y + 0.12, H.z - 0.07), V(0.7, 0.8, -0.5), 0.028, 0.09, 4), P.ice, H.y + 0.1, H.y + 0.22));

  // back armour plate (curved, follows the back) with an ice crystal ridge
  {
    const pts = [];
    const bz = (x, y) => -0.005 - (0.2 + 0.015 * (0.6 - y) / 0.25) * Math.sqrt(Math.max(0, 1 - (x / (0.24 + 0.03 * (0.6 - y) / 0.25)) ** 2));
    for (const [x, y] of [[0, 0.62], [0.09, 0.6], [0.14, 0.52], [0.14, 0.43], [0.08, 0.35], [0, 0.32]])
      for (const sx of [1, -1]) {
        pts.push(V(sx * x, y, bz(x, y) + 0.01));
        pts.push(V(sx * x * 0.9, y + (y > 0.47 ? -0.008 : 0.008), bz(x * 0.9, y) - 0.03));
      }
    C.push(Y(hull(pts), P.armor, 0.32, 0.62));
    C.push(Y(hull([V(0.035, 0.56, -0.2), V(-0.035, 0.56, -0.2), V(0.05, 0.47, -0.21), V(-0.05, 0.47, -0.21),
      V(0, 0.39, -0.21), V(0, 0.48, -0.265), V(0.025, 0.54, -0.25), V(-0.025, 0.54, -0.25)]), P.ice, 0.39, 0.56));
  }
  C.push(Y(shard(V(0, 0.58, -0.22), V(0, 0.6, -1), 0.03, 0.08, 4), P.ice, 0.55, 0.66));
  S.push(Y(shard(V(0.1, 0.55, -0.19), V(0.5, 0.6, -1), 0.026, 0.07, 4), P.ice, 0.52, 0.62));

  return assemble(C, S);
}

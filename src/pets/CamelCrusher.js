// Camel Crusher: chunky sandy camel with one strong hump, lapis saddle cloth with gold trim,
// gold/lapis bridle and sandstone shoulder armour (Round 3 - Desert Dojo, Rare).
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  body:    { i: 0, top: '#E8B66E', bot: '#B9803F' },
  cream:   { i: 1, top: '#FFF1D2', bot: '#E6C893' },
  hump:    { i: 2, top: '#F0C27C', bot: '#C68A45' },
  lapis:   { i: 3, top: '#3F6FE0', bot: '#1F3A9E' },
  gold:    { i: 4, top: '#FFDB5C', bot: '#D59A1E' },
  white:   { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:     { i: 6, top: '#1A1416', bot: '#0C0A0B' },
  brow:    { i: 7, top: '#C98C48', bot: '#9A632C' },
  dark:    { i: 8, top: '#6B4426', bot: '#4A2C16' },
  sand:    { i: 9, top: '#E9A866', bot: '#B8703A' }, // sandstone armour
  hoof:    { i: 10, top: '#FCEBC6', bot: '#D9B37A' },
  red:     { i: 11, top: '#E2483A', bot: '#A92822' },
  gem:     { i: 12, top: '#6FA8FF', bot: '#2346B8' },
  tuft:    { i: 13, top: '#9A6334', bot: '#6A3E1C' },
  horn:    { i: 14, top: '#E9C58A', bot: '#FFF3D6' },
};
const SW = PALETTE;

export function buildGeometry() {
  const C = [], S = [], L = []; // L = right-side leg parts (not lowered)
  const DY = -0.045; // lower the whole upper body so the legs read short and sturdy
  const X = V(1, 0, 0);
  const flat = (g, sw) => paint(g, sw, 'flat');
  const body = (pts, lo = 0.15, hi = 0.85) => paint(hull(pts), SW.body, 'y', [lo, hi]);

  // ================= BODY (stocky barrel) =================
  const BR = [ // z, cy, rx, ry
    [-0.37, 0.45, 0.11, 0.11],
    [-0.31, 0.44, 0.2, 0.19],
    [-0.16, 0.44, 0.225, 0.22],
    [0.02, 0.45, 0.235, 0.225],
    [0.16, 0.46, 0.22, 0.21],
    [0.26, 0.48, 0.155, 0.16],
  ];
  // interpolated body section at z (for drapes that hug the barrel)
  const BA = (z) => {
    for (let i = 0; i < BR.length - 1; i++) {
      const [z0, ...a] = BR[i], [z1, ...b] = BR[i + 1];
      if (z >= z0 && z <= z1) { const t = (z - z0) / (z1 - z0); return [z, ...a.map((v, j) => v + (b[j] - v) * t)]; }
    }
    return BR[0];
  };
  C.push(body(BR.flatMap(([z, y, rx, ry]) => ring(V(0, y, z), rx, ry, 10, 'z', 0)), 0.2, 0.75));

  // ================= HUMP (one strong hump, sandy) =================
  const HZ = -0.06;
  // chunky 8-sided hump: broad base, few big facets, blunt faceted top
  C.push(paint(hull([
    ...ring(V(0, 0.55, HZ), 0.185, 0.175, 8, 'y', Math.PI / 8),
    ...ring(V(0, 0.72, HZ), 0.155, 0.145, 8, 'y', 0),
    ...ring(V(0, 0.83, HZ - 0.005), 0.1, 0.095, 8, 'y', Math.PI / 8),
    ...ring(V(0, 0.88, HZ - 0.01), 0.04, 0.04, 4, 'y', 0),
  ]), SW.hump, 'y', [0.5, 0.88]));

  // ================= SADDLE CLOTH (lapis, gold trim, tassels) =================
  // drape: upper arcs of the body rings, scaled out a bit
  const arc = (z, cy, rx, ry, off, a0, a1, n) => {
    const pts = [];
    for (let k = 0; k <= n; k++) {
      const a = a0 + (a1 - a0) * k / n;
      pts.push(V(Math.cos(a) * (rx + off), cy + Math.sin(a) * (ry + off), z));
    }
    return pts;
  };
  const A0 = -0.42, A1 = Math.PI + 0.42;
  const drapeR = [BA(-0.27), BA(-0.16), BA(0.02), BA(0.15)];
  C.push(paint(hull(drapeR.flatMap(([z, y, rx, ry]) => arc(z, y, rx, ry, 0.022, A0, A1, 12))), SW.lapis, 'y', [0.33, 0.68]));
  // gold trim along the hanging edges (one band per side) and front/back edges
  const edge = (a, off) => [BA(-0.285), BA(-0.16), BA(0.02), BA(0.165)]
    .flatMap(([z, y, rx, ry]) => arc(z, y, rx, ry, off, a, a + 0.14, 2));
  S.push(paint(hull([...edge(A0 - 0.04, 0.032), ...edge(A0 - 0.04, 0.008)]), SW.gold, 'y', [0.3, 0.42]));
  // front and back gold edge bands over the top
  for (const [z0, z1, cy, rx, ry] of [[0.14, 0.17, ...BA(0.14).slice(1)], [-0.295, -0.265, ...BA(-0.265).slice(1)]])
    C.push(paint(hull([...arc(z0, cy, rx, ry, 0.03, A0 - 0.04, A1 + 0.04, 12), ...arc(z1, cy, rx, ry, 0.03, A0 - 0.04, A1 + 0.04, 12),
      ...arc(z0, cy, rx, ry, 0.0, A0 - 0.04, A1 + 0.04, 12), ...arc(z1, cy, rx, ry, 0.0, A0 - 0.04, A1 + 0.04, 12)]), SW.gold, 'y', [0.3, 0.68]));
  // gold collar around the hump base
  C.push(paint(hull([...ring(V(0, 0.6, HZ), 0.205, 0.195, 8, 'y', Math.PI / 8), ...ring(V(0, 0.665, HZ), 0.185, 0.175, 8, 'y', Math.PI / 8)]),
    SW.gold, 'y', [0.58, 0.68]));
  // tassels: gold shards with red tips hanging from the side edges
  const ea = A0 - 0.02;
  [-0.17, -0.11, -0.05, 0.01, 0.07, 0.13].forEach((z, n) => {
    const [, cy, rx, ry] = BA(z);
    const b = V(Math.cos(ea) * (rx + 0.022), cy + Math.sin(ea) * (ry + 0.022), z);
    // chunky gold cap block + short squared tassel (alternating red / lapis)
    S.push(paint(hull(cbox(V(b.x + 0.004, b.y - 0.012, z), 0.022, 0.022, 0.022, 0.008)), SW.gold, 'y', [b.y - 0.04, b.y + 0.01]));
    S.push(paint(hull([...cbox(V(b.x + 0.008, b.y - 0.05, z), 0.019, 0.02, 0.019, 0.006), ...ring(V(b.x + 0.01, b.y - 0.074, z), 0.013, 0.013, 4, 'y', Math.PI / 4)]),
      n % 2 ? SW.lapis : SW.red, 'y', [b.y - 0.08, b.y - 0.03]));
  });
  // side medallion: gold diamond with lapis gem
  {
    const z = HZ, a = 0.15, [, cy, rx, ry] = BA(z);
    const p = V(Math.cos(a) * (rx + 0.02), cy + Math.sin(a) * (ry + 0.02), z);
    S.push(paint(hull([V(p.x - 0.01, p.y + 0.07, z), V(p.x - 0.01, p.y - 0.07, z), V(p.x - 0.01, p.y, z + 0.07), V(p.x - 0.01, p.y, z - 0.07),
      V(p.x + 0.025, p.y + 0.05, z), V(p.x + 0.025, p.y - 0.05, z), V(p.x + 0.025, p.y, z + 0.05), V(p.x + 0.025, p.y, z - 0.05)]), SW.gold, 'y', [p.y - 0.07, p.y + 0.07]));
    S.push(paint(hull([V(p.x + 0.02, p.y + 0.035, z), V(p.x + 0.02, p.y - 0.035, z), V(p.x + 0.02, p.y, z + 0.035), V(p.x + 0.02, p.y, z - 0.035),
      V(p.x + 0.04, p.y, z)]), SW.gem, 'y', [p.y - 0.04, p.y + 0.04]));
  }

  // ================= NECK (short, thick) =================
  C.push(body([...ring(V(0, 0.47, 0.14), 0.17, 0.2, 8, 'z', 0), ...ring(V(0, 0.5, 0.3), 0.13, 0.12, 8, 'y', 0),
    ...ring(V(0, 0.62, 0.3), 0.14, 0.15, 8, 'y', 0), ...ring(V(0, 0.71, 0.35), 0.13, 0.12, 8, 'y', 0)], 0.3, 0.85));
  // cream chest/throat patch
  C.push(paint(hull([...ring(V(0, 0.44, 0.385), 0.09, 0.035, 8, 'y', 0), ...ring(V(0, 0.52, 0.42), 0.11, 0.04, 8, 'y', 0), ...ring(V(0, 0.64, 0.43), 0.09, 0.035, 8, 'y', 0)]), SW.cream, 'y', [0.35, 0.68]));

  // ================= LEGS (short, thick, knobby knees) =================
  const leg = (x, z, zt) => {
    L.push(body([...ring(V(x, 0.07, z), 0.078, 0.08, 8), ...ring(V(x, 0.14, z), 0.088, 0.09, 8),
      ...ring(V(x, 0.2, z + 0.01), 0.1, 0.1, 8), ...ring(V(x - 0.005, 0.26, (z + zt) / 2), 0.104, 0.11, 8),
      ...ring(V(x - 0.03, 0.36, zt), 0.105, 0.115, 8), ...ring(V(x - 0.045, 0.44, zt), 0.085, 0.1, 8)], 0.0, 0.65));
  };
  leg(0.145, 0.17, 0.13);
  leg(0.148, -0.24, -0.21);
  // two-toed cream hooves
  const hoof = (x, z) => {
    L.push(paint(hull(cbox(V(x, 0.04, z - 0.005), 0.088, 0.04, 0.078, 0.02)), SW.hoof, 'y', [0, 0.09]));
    for (const dx of [-0.042, 0.042])
      L.push(paint(hull([...cbox(V(x + dx, 0.036, z + 0.055), 0.042, 0.036, 0.045, 0.014), V(x + dx, 0.0, z + 0.105), V(x + dx, 0.034, z + 0.11)]),
        SW.hoof, 'y', [0, 0.09]));
  };
  hoof(0.145, 0.17);
  hoof(0.148, -0.24);

  // ================= SANDSTONE SHOULDER ARMOUR =================
  // curved sandstone pauldron over each shoulder, gold rim along its lower edge and a gold stud
  {
    const pc = V(0.13, 0.43, 0.2);
    const parc = (r, a0, a1, z0, z1, n) => {
      const pts = [];
      for (let k = 0; k <= n; k++) {
        const a = a0 + (a1 - a0) * k / n;
        for (const z of [z0, z1]) pts.push(V(pc.x + Math.cos(a) * r, pc.y + Math.sin(a) * r, z));
      }
      return pts;
    };
    S.push(paint(hull([...parc(0.135, -0.35, 1.05, pc.z - 0.085, pc.z + 0.085, 5), ...parc(0.105, -0.35, 1.05, pc.z - 0.1, pc.z + 0.1, 5)]),
      SW.sand, 'y', [0.38, 0.6]));
    S.push(paint(hull([...parc(0.14, -0.45, -0.25, pc.z - 0.09, pc.z + 0.09, 1), ...parc(0.11, -0.45, -0.2, pc.z - 0.105, pc.z + 0.105, 1)]),
      SW.gold, 'y', [0.36, 0.44]));
    const st = V(pc.x + Math.cos(0.35) * 0.135, pc.y + Math.sin(0.35) * 0.135, pc.z);
    S.push(paint(shard(st.clone().addScaledVector(V(Math.cos(0.35), Math.sin(0.35), 0), -0.01), V(Math.cos(0.35), Math.sin(0.35) + 0.3, 0), 0.028, 0.06, 4, 1),
      SW.gold, 'y', [st.y - 0.03, st.y + 0.05]));
  }

  // ================= HEAD (big, boxy) =================
  const H = { y: 0.8, z: 0.38 };
  C.push(body([
    ...cbox(V(0, H.y + 0.005, H.z + 0.05), 0.16, 0.13, 0.08, 0.05),
    ...ring(V(0, H.y - 0.01, H.z - 0.11), 0.12, 0.1, 8, 'z', 0),
    ...ring(V(0, H.y + 0.15, H.z - 0.0), 0.1, 0.085, 8, 'y'),
  ], 0.6, 0.98));
  const FZ = H.z + 0.13;

  // long cream muzzle: tapered block with a rounded, slightly drooping upper lip
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.07, FZ + 0.06), 0.115, 0.065, 0.075, 0.03),
    ...ring(V(0, H.y - 0.085, FZ + 0.145), 0.09, 0.055, 8, 'z', 0),
    V(0.105, H.y - 0.005, FZ - 0.04), V(-0.105, H.y - 0.005, FZ - 0.04),
    V(0.07, H.y - 0.02, FZ + 0.12), V(-0.07, H.y - 0.02, FZ + 0.12),
  ]), SW.cream, 'y', [H.y - 0.15, H.y]));
  // lower jaw / chin
  C.push(paint(hull([...cbox(V(0, H.y - 0.145, FZ + 0.05), 0.085, 0.028, 0.075, 0.014), V(0, H.y - 0.155, FZ + 0.11)]), SW.hoof, 'y', [H.y - 0.17, H.y - 0.11]));
  // nostril slits
  S.push(flat(hull(plate([[-0.018, 0.008], [0.006, 0.014], [0.02, 0.004], [0.004, -0.008]],
    V(0.045, H.y - 0.06, 0), FZ + 0.13, FZ + 0.148)), SW.dark));
  // split upper lip + mouth line
  C.push(flat(hull(cbox(V(0, H.y - 0.105, FZ + 0.147), 0.005, 0.026, 0.006, 0.002)), SW.dark));
  S.push(flat(hull([V(0, H.y - 0.128, FZ + 0.152), V(0, H.y - 0.138, FZ + 0.152), V(0.075, H.y - 0.13, FZ + 0.118),
    V(0.075, H.y - 0.12, FZ + 0.118), V(0, H.y - 0.133, FZ + 0.136)]), SW.dark));

  // fierce eyes (punch_pup block, scaled a touch)
  const E = V(0.085, H.y + 0.035, 0), k = 1.22;
  const sc = (pts) => pts.map(([u, v]) => [u * k, v * k]);
  S.push(flat(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.01, FZ + 0.012)), SW.white));
  S.push(flat(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.005, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye));
  S.push(flat(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.006, E.y + 0.003, 0), FZ + 0.014, FZ + 0.022)), SW.white));
  // heavy brow
  S.push(paint(hull([
    V(0.022, E.y + 0.012, FZ + 0.035), V(0.024, E.y + 0.055, FZ + 0.025),
    V(0.165, E.y + 0.055, FZ - 0.005), V(0.165, E.y + 0.095, FZ - 0.02),
    V(0.022, E.y + 0.012, FZ - 0.03), V(0.024, E.y + 0.065, FZ - 0.04),
    V(0.165, E.y + 0.055, FZ - 0.06), V(0.165, E.y + 0.095, FZ - 0.07),
  ]), SW.brow, 'y'));

  // small rounded ears
  S.push(paint(hull([V(0.12, H.y + 0.1, H.z - 0.04), V(0.12, H.y + 0.06, H.z - 0.08), V(0.13, H.y + 0.12, H.z - 0.09),
    V(0.22, H.y + 0.13, H.z - 0.1), V(0.21, H.y + 0.1, H.z - 0.08), V(0.2, H.y + 0.15, H.z - 0.12)]), SW.body, 'y', [H.y + 0.05, H.y + 0.15]));
  S.push(flat(hull([V(0.14, H.y + 0.105, H.z - 0.055), V(0.2, H.y + 0.125, H.z - 0.075), V(0.15, H.y + 0.12, H.z - 0.075),
    V(0.14, H.y + 0.1, H.z - 0.08)]), SW.tuft));

  // small horns (gold tipped) on top of the head
  S.push(paint(tube(curveSamples([V(0.075, H.y + 0.11, H.z - 0.02), V(0.1, H.y + 0.18, H.z - 0.04), V(0.13, H.y + 0.22, H.z - 0.08)],
    4, (t) => 0.045 - 0.038 * t), { seg: 6, axis: X, capEnd: 0.02 }), SW.horn, 'len'));
  // head tuft
  C.push(paint(shard(V(0, H.y + 0.15, H.z + 0.01), V(0, 1, 0.4), 0.04, 0.07, 4, 0.7), SW.tuft, 'flat'));
  S.push(paint(shard(V(0.035, H.y + 0.15, H.z - 0.01), V(0.4, 1, 0.2), 0.035, 0.06, 4, 0.7), SW.tuft, 'flat'));

  // ================= BRIDLE / HEADBAND (gold, lapis gem) =================
  // headband: wraps the top of the head behind the brow
  C.push(paint(hull([...ring(V(0, H.y + 0.1, H.z - 0.02), 0.155, 0.12, 10, 'y', 0), ...ring(V(0, H.y + 0.13, H.z - 0.02), 0.13, 0.105, 10, 'y', 0)]),
    SW.gold, 'y', [H.y + 0.08, H.y + 0.15]));
  // gold noseband around the muzzle
  C.push(paint(hull([...cbox(V(0, H.y - 0.07, FZ + 0.045), 0.125, 0.075, 0.016, 0.03)]),
    SW.gold, 'y', [H.y - 0.15, H.y]));
  // cheek strap from noseband up to the headband
  S.push(paint(hull([...cbox(V(0.135, H.y + 0.0, FZ - 0.015), 0.008, 0.07, 0.014, 0.004), ...cbox(V(0.15, H.y + 0.08, FZ - 0.05), 0.008, 0.02, 0.014, 0.004)]),
    SW.gold, 'y', [H.y - 0.07, H.y + 0.1]));
  // lapis gem on the forehead with gold setting
  C.push(paint(hull(plate([[0, 0.045], [0.035, 0], [0, -0.03], [-0.035, 0]], V(0, H.y + 0.12, 0), FZ - 0.04, FZ - 0.005)), SW.gold, 'y', [H.y + 0.08, H.y + 0.17]));
  C.push(paint(hull([...plate([[0, 0.03], [0.022, 0], [0, -0.018], [-0.022, 0]], V(0, H.y + 0.12, 0), FZ - 0.02, FZ + 0.004), V(0, H.y + 0.12, FZ + 0.014)]),
    SW.gem, 'y', [H.y + 0.09, H.y + 0.15]));
  // cheek rosettes
  S.push(paint(hull([...ring(V(0.12, H.y - 0.06, FZ + 0.035), 0.03, 0.03, 6, 'x', 0), ...ring(V(0.138, H.y - 0.06, FZ + 0.035), 0.022, 0.022, 6, 'x', 0)]),
    SW.gold, 'y', [H.y - 0.07, H.y - 0.01]));
  S.push(paint(hull([...ring(V(0.137, H.y - 0.06, FZ + 0.035), 0.014, 0.014, 4, 'x', 0), V(0.152, H.y - 0.06, FZ + 0.035)]), SW.gem, 'flat'));

  // ================= TAIL (short, tufted) =================
  C.push(paint(tube(curveSamples([V(0, 0.52, -0.34), V(0, 0.48, -0.42), V(0, 0.38, -0.45)], 4, (t) => 0.03 - 0.008 * t),
    { seg: 6, axis: X }), SW.body, 'y', [0.3, 0.6]));
  C.push(paint(shard(V(0, 0.4, -0.45), V(0, -1, -0.15), 0.04, 0.1, 4, 0.7), SW.tuft, 'y', [0.28, 0.42]));
  S.push(paint(shard(V(0.012, 0.4, -0.445), V(0.4, -1, -0.1), 0.03, 0.08, 4, 0.7), SW.tuft, 'y', [0.28, 0.42]));

  for (const g of [...C, ...S]) g.translate(0, DY, 0);
  return assemble(C, [...S, ...L]);
}

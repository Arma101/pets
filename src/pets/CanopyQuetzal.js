// Canopy Quetzal (EPIC, Round 2 – Jungle Gym): chunky emerald quetzal with a red chest, fan crest,
// very long banded streamer tail, faceted carved-jade gorget + shoulder plates with gold trim, vines with leaves.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// helper to paint a 128px atlas cell from a list of [t0, t1, colourTop, colourBot] bands (t = 0 top .. 1 bottom)
const bands = (list) => (g, x, y) => {
  g.fillStyle = list[0][2]; g.fillRect(x, y, 128, 16);
  for (const [t0, t1, c0, c1] of list) {
    const y0 = y + 16 + t0 * 96, y1 = y + 16 + t1 * 96;
    const gr = g.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, c0); gr.addColorStop(1, c1);
    g.fillStyle = gr; g.fillRect(x, Math.floor(y0), 128, Math.ceil(y1 - y0) + 1);
  }
  g.fillStyle = list[list.length - 1][3]; g.fillRect(x, y + 112, 128, 16);
};

export const PALETTE = {
  em:     { i: 0, top: '#3FE08A', bot: '#0B8A4E' },   // emerald body
  emB:    { i: 1, top: '#2CCFA6', bot: '#0A6E78' },   // blue-green iridescent feathers
  emD:    { i: 2, top: '#1FA866', bot: '#07583A' },   // dark emerald (brow, back)
  red:    { i: 3, top: '#FF4A3A', bot: '#C0121E' },   // chest / belly
  beak:   { i: 4, top: '#FFE04A', bot: '#F09A18' },
  leg:    { i: 5, top: '#7A6A5E', bot: '#4A3E36' },
  claw:   { i: 6, top: '#FFD84A', bot: '#C98A0E' },
  eye:    { i: 7, top: '#1A1416', bot: '#0C0A0B' },
  eyeW:   { i: 8, top: '#FFFFFF', bot: '#F1F1F4' },
  gold:   { i: 9, top: '#FFE46C', bot: '#E39E12' },
  jade:   { i: 10, top: '#B6F5DA', bot: '#4FBF95' },
  prim:   { i: 11, top: '#1E8FA0', bot: '#0B4A63' },  // dark teal-blue primaries
  vine:   { i: 12, top: '#5FA83A', bot: '#2F6A22' },
  leaf:   { i: 13, top: '#9BE04A', bot: '#3E9A2A' },
  // tail streamer: emerald with bold gold / teal bands near the tip
  tail:   { i: 14, draw: bands([
    [0, 0.55, '#36D987', '#14A35E'],
    [0.55, 0.6, '#FFE46C', '#F2B624'],
    [0.6, 0.7, '#1FB8B0', '#0C7D8A'],
    [0.7, 0.75, '#FFE46C', '#F2B624'],
    [0.75, 1, '#18A862', '#0A6A40'],
  ]) },
  jadeD:  { i: 15, top: '#8FE6C0', bot: '#2E9C76' },
};
const P = PALETTE;

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const em = (g, lo, hi) => paint(g, P.em, 'y', lo === undefined ? null : [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');
  // flat faceted feather blade: base b, direction d, outward normal n, half-width w, length l, thickness th
  const fplate = (b, d, n, w, l, th = 0.014, sw = P.em, mode = 'flat') => {
    d = d.clone().normalize(); n = n.clone().normalize();
    const sd = new THREE.Vector3().crossVectors(d, n).normalize();
    n = new THREE.Vector3().crossVectors(sd, d).normalize();
    const pts = [];
    const at = (u, v, h) => b.clone().addScaledVector(d, u).addScaledVector(sd, v).addScaledVector(n, h);
    for (const h of [-th, th * 0.3]) {
      pts.push(at(0, w * 0.8, h), at(0, -w * 0.8, h), at(l * 0.3, w, h * 0.8), at(l * 0.3, -w, h * 0.8));
    }
    pts.push(at(l, 0, -th * 0.3), at(l * 0.3, 0, th * 1.1), at(0, 0, th * 1.0));
    return paint(hull(pts), sw, mode);
  };

  // ================= BODY (round egg, chest puffed forward) =================
  C.push(em(hull([
    ...ring(V(0, 0.34, -0.25), 0.09, 0.08, 10, 'z'),
    ...ring(V(0, 0.36, -0.16), 0.17, 0.15, 10, 'z'),
    ...ring(V(0, 0.38, -0.04), 0.205, 0.17, 10, 'z'),
    ...ring(V(0, 0.42, 0.08), 0.2, 0.18, 10, 'z'),
    ...ring(V(0, 0.48, 0.16), 0.16, 0.16, 10, 'z'),
    ...ring(V(0, 0.54, 0.2), 0.1, 0.1, 10, 'z'),
  ]), 0.2, 0.68));
  // red chest / belly: its own faceted hull forming the lower front of the body (green wraps the sides)
  C.push(paint(hull([
    ...ring(V(0, 0.36, -0.02), 0.13, 0.11, 10, 'z'),
    ...ring(V(0, 0.4, 0.08), 0.165, 0.165, 10, 'z'),
    ...ring(V(0, 0.45, 0.2), 0.14, 0.14, 10, 'z'),
    ...ring(V(0, 0.52, 0.25), 0.095, 0.09, 10, 'z'),
  ]), P.red, 'y', [0.24, 0.6]));
  // neck
  C.push(em(hull([...ring(V(0, 0.5, 0.07), 0.15, 0.14, 8, 'y'), ...ring(V(0, 0.68, 0.1), 0.135, 0.13, 8, 'y')]), 0.4, 0.85));

  // red chest feather scales: flat broad blades lying on the red hull in 3 neat overlapping rows, tips down
  const redF = (b, d, n, w, l) => fplate(b, d, n, w, l, 0.011, P.red, 'y');
  for (const [y, z, w, l, sx, sz, dz] of [
    [0.55, 0.322, 0.05, 0.085, 0.07, -0.035, 0.0],
    [0.475, 0.325, 0.055, 0.09, 0.075, -0.035, -0.55],
    [0.395, 0.28, 0.05, 0.085, 0.072, -0.045, -0.85],
  ]) {
    C.push(redF(V(0, y, z), V(0, -1, dz), V(0, -dz * 0.6 + 0.1, 1), w, l));
    S.push(redF(V(sx, y - 0.01, z + sz), V(0.12, -1, dz - 0.05), V(0.55, -dz * 0.6 + 0.1, 1), w, l));
  }
  // edge scales over the green, lying flat and pointing down/back
  S.push(redF(V(0.125, 0.5, 0.2), V(0.15, -1, -0.35), V(1, 0.1, 0.6), 0.045, 0.09));
  S.push(redF(V(0.14, 0.42, 0.14), V(0.15, -1, -0.7), V(1, 0.1, 0.35), 0.045, 0.09));

  // back / saddle feathers sweeping toward the tail (emerald, iridescent alternation)
  C.push(fplate(V(0, 0.62, 0.0), V(0, -0.35, -1), V(0, 1, -0.3), 0.085, 0.18, 0.012, P.em));
  C.push(fplate(V(0, 0.56, -0.12), V(0, -0.45, -1), V(0, 1, -0.4), 0.08, 0.17, 0.012, P.emB));
  C.push(fplate(V(0, 0.49, -0.22), V(0, -0.4, -1), V(0, 1, -0.4), 0.075, 0.15, 0.012, P.em));
  S.push(fplate(V(0.09, 0.59, -0.01), V(0.3, -0.45, -1), V(0.5, 1, -0.3), 0.07, 0.16, 0.012, P.emB));
  S.push(fplate(V(0.08, 0.53, -0.13), V(0.3, -0.55, -1), V(0.5, 1, -0.4), 0.065, 0.15, 0.012, P.em));
  // nape hackles
  C.push(fplate(V(0, 0.72, -0.03), V(0, -1, -0.45), V(0, 0.1, -1), 0.08, 0.17, 0.012, P.em));
  S.push(fplate(V(0.08, 0.72, 0.0), V(0.25, -1, -0.35), V(0.6, 0.1, -0.8), 0.075, 0.16, 0.012, P.emB));

  // ================= HEAD =================
  const H = { y: 0.8, z: 0.13 };
  C.push(em(hull([
    ...cbox(V(0, H.y + 0.01, H.z), 0.15, 0.125, 0.145, 0.06),
    ...ring(V(0, H.y - 0.025, H.z - 0.005), 0.178, 0.14, 10, 'y'),
    ...ring(V(0, H.y + 0.09, H.z - 0.01), 0.16, 0.135, 10, 'y'),
    ...ring(V(0, H.y + 0.16, H.z - 0.02), 0.1, 0.09, 8, 'y'),
    ...ring(V(0, H.y - 0.135, H.z + 0.0), 0.12, 0.11, 8, 'y'),
    V(0.17, H.y - 0.085, H.z + 0.03), V(-0.17, H.y - 0.085, H.z + 0.03),
    V(0, H.y + 0.02, H.z - 0.165), V(0, H.y + 0.1, H.z - 0.15),
  ]), 0.64, 1.0));
  const FZ = H.z + 0.145;
  // cheek / nape feather plates
  S.push(fplate(V(0.155, H.y - 0.05, H.z + 0.06), V(0.5, -0.8, -0.5), V(1, 0, 0.3), 0.05, 0.1, 0.012, P.em));
  S.push(fplate(V(0.155, H.y - 0.01, H.z - 0.04), V(0.4, -0.5, -1), V(1, 0.2, -0.2), 0.055, 0.11, 0.012, P.emB));
  S.push(fplate(V(0.13, H.y - 0.1, H.z - 0.06), V(0.4, -1, -0.5), V(1, 0, -0.3), 0.055, 0.11, 0.012, P.em));

  // beak: short, chunky, yellow, slight hook (scaled 1.2 about its root)
  const BK = V(0, H.y - 0.045, FZ), bk = (x, y, z) => V(x * 1.2, BK.y + (y - BK.y) * 1.2, BK.z + (z - BK.z) * 1.2);
  C.push(paint(hull([
    ...cbox(V(0, H.y - 0.045, FZ + 0.005), 0.06, 0.04, 0.02, 0.012).map((p) => bk(p.x, p.y, p.z)),
    bk(0.026, H.y - 0.03, FZ + 0.06), bk(-0.026, H.y - 0.03, FZ + 0.06),
    bk(0, H.y - 0.09, FZ + 0.105), bk(0.012, H.y - 0.07, FZ + 0.1), bk(-0.012, H.y - 0.07, FZ + 0.1),
    bk(0.026, H.y - 0.075, FZ + 0.05), bk(-0.026, H.y - 0.075, FZ + 0.05),
  ]), P.beak, 'y', [H.y - 0.1, H.y - 0.0]));
  C.push(paint(hull([...cbox(V(0, H.y - 0.088, FZ + 0.015), 0.04, 0.014, 0.02, 0.006).map((p) => bk(p.x, p.y, p.z)),
    bk(0, H.y - 0.094, FZ + 0.07), bk(0.01, H.y - 0.088, FZ + 0.062), bk(-0.01, H.y - 0.088, FZ + 0.062)]), P.claw, 'flat'));
  // feather tuft over the beak base (quetzal bristles)
  C.push(fplate(V(0, H.y + 0.0, FZ + 0.0), V(0, -0.4, 1), V(0, 1, 0.3), 0.04, 0.06, 0.012, P.em));

  // ---- crest: rounded fan of shards from forehead to nape ----
  for (const [z, y, dz, len, w, sw] of [
    [0.12, 0.1, 1.2, 0.12, 0.045, P.em],
    [0.08, 0.125, 0.55, 0.17, 0.05, P.emB],
    [0.03, 0.14, 0.15, 0.2, 0.055, P.em],
    [-0.03, 0.14, -0.25, 0.21, 0.055, P.emB],
    [-0.09, 0.125, -0.7, 0.19, 0.05, P.em],
    [-0.13, 0.09, -1.4, 0.15, 0.045, P.emB],
  ]) {
    const d = V(0, 1, dz).normalize(), b = V(0, H.y + y, H.z + z);
    const side = V(0, -d.z, d.y);
    const tip = b.clone().addScaledVector(d, len);
    C.push(paint(hull([
      ...[-1, 1].flatMap((sx) => [
        V(sx * 0.04, b.y, b.z).addScaledVector(side, w), V(sx * 0.04, b.y, b.z).addScaledVector(side, -w),
        V(sx * 0.032, 0, 0).add(b).addScaledVector(d, len * 0.6).addScaledVector(side, w * 1.15),
        V(sx * 0.032, 0, 0).add(b).addScaledVector(d, len * 0.6).addScaledVector(side, -w * 0.7),
        V(sx * 0.016, 0, 0).add(b).addScaledVector(d, len * 0.9).addScaledVector(side, w * 0.45),
        V(sx * 0.012, tip.y, tip.z),
      ]),
    ]), sw, 'y', [H.y + 0.12, H.y + 0.35]));
  }
  for (const [z, y, dz, len] of [[0.05, 0.12, 0.35, 0.14], [-0.04, 0.12, -0.35, 0.15], [-0.11, 0.1, -1.0, 0.13]])
    S.push(paint(shard(V(0.03, H.y + y, H.z + z), V(0.32, 1, dz), 0.05, len, 4, 0.7), P.em, 'y', [H.y + 0.1, H.y + 0.3]));

  // eyes: white almond, angry flat top slanting to the beak, big pupil, square catchlight
  const E = V(0.088, H.y + 0.045, 0), ek = 1.48;
  const K = (a) => a.map(([u, v]) => [u * ek, v * ek]);
  S.push(flat(hull(plate(K([[-0.036, 0.004], [0.04, 0.03], [0.045, -0.01], [0.018, -0.036], [-0.026, -0.032], [-0.04, -0.014]]),
    E, FZ - 0.01, FZ + 0.01)), P.eyeW));
  S.push(flat(hull(plate(K([[-0.022, 0.004], [0.011, 0.016], [0.017, -0.007], [0.004, -0.024], [-0.016, -0.022], [-0.025, -0.009]]),
    V(E.x - 0.008, E.y - 0.002, 0), FZ + 0.005, FZ + 0.016)), P.eye));
  S.push(flat(hull(plate(K([[-0.006, -0.006], [0.006, -0.006], [0.006, 0.006], [-0.006, 0.006]]),
    V(E.x - 0.001, E.y + 0.002, 0), FZ + 0.012, FZ + 0.019)), P.eyeW));
  // heavy brow
  S.push(paint(hull([
    V(0.02, E.y + 0.01, FZ + 0.028), V(0.022, E.y + 0.048, FZ + 0.018),
    V(0.17, E.y + 0.056, FZ - 0.01), V(0.17, E.y + 0.094, FZ - 0.025),
    V(0.02, E.y + 0.01, FZ - 0.03), V(0.022, E.y + 0.058, FZ - 0.04),
    V(0.17, E.y + 0.056, FZ - 0.06), V(0.17, E.y + 0.099, FZ - 0.07),
  ]), P.emD, 'y'));

  // ================= JADE GORGET: crescent of 5 chunky carved jade segments on a gold band + raised gem =================
  const GY = 0.62, GZ = 0.075;
  const arcPt = (a, r, y) => V(r * Math.sin(a), y, GZ + r * Math.cos(a));
  const yTop = (a) => GY + 0.045 - 0.012 * Math.abs(Math.sin(a));
  const yBot = (a) => GY - 0.045 - 0.04 * Math.cos(a) ** 4;
  // gold backing band (slightly taller, peeks out between and around the segments)
  {
    const pts = [];
    for (let k = 0; k <= 8; k++) {
      const a = -1.2 + 2.4 * k / 8;
      for (const r of [0.15, 0.198]) pts.push(arcPt(a, r, yTop(a) + 0.012), arcPt(a, r, yBot(a) - 0.012));
    }
    C.push(paint(hull(pts), P.gold, 'y', [GY - 0.1, GY + 0.06]));
  }
  // jade segments: beveled blocks, each its own hull (centre one on x = 0, the other two pairs mirrored)
  const seg = (a0, a1) => {
    const pts = [];
    for (const a of [a0, a1]) {
      const yt = yTop(a) + 0.004, yb = yBot(a) - 0.004, ym = (yt + yb) / 2;
      pts.push(arcPt(a, 0.17, yt), arcPt(a, 0.17, yb));
      pts.push(arcPt(a, 0.212, yt - 0.014), arcPt(a, 0.212, yb + 0.014));
      pts.push(arcPt(a, 0.222, ym + 0.008), arcPt(a, 0.222, ym - 0.008));
    }
    return paint(hull(pts), P.jadeD, 'y', [GY - 0.1, GY + 0.06]);
  };
  const sw = 0.4, gap = 0.04;
  C.push(seg(-sw / 2 + gap / 2, sw / 2 - gap / 2));
  S.push(seg(sw / 2 + gap / 2, sw * 1.5 - gap / 2));
  S.push(seg(sw * 1.5 + gap / 2, sw * 2.5 - gap / 2 - 0.05));
  // raised gem on the centre segment: gold bezel + pale faceted jade
  C.push(paint(hull([...ring(V(0, GY - 0.012, GZ + 0.215), 0.042, 0.046, 8, 'z'), ...ring(V(0, GY - 0.012, GZ + 0.236), 0.04, 0.044, 8, 'z')]), P.gold, 'y'));
  C.push(paint(hull([...ring(V(0, GY - 0.012, GZ + 0.236), 0.03, 0.034, 8, 'z', 0), ...ring(V(0, GY - 0.012, GZ + 0.252), 0.02, 0.022, 8, 'z', 0),
    V(0, GY - 0.012, GZ + 0.262)]), P.jade, 'y', [GY - 0.05, GY + 0.03]));
  // small gold studs between the side segments
  for (const a of [sw / 2, sw * 1.5]) S.push(paint(blob(0, arcPt(a, 0.205, GY), V(0.012, 0.014, 0.012)), P.gold, 'flat'));

  // ================= WINGS (folded, emerald coverts, gold band, teal-blue primaries) =================
  S.push(em(hull([
    ...ring(V(0.175, 0.47, 0.05), 0.035, 0.09, 8, 'x'),
    ...ring(V(0.19, 0.44, -0.06), 0.04, 0.1, 8, 'x'),
    V(0.17, 0.38, -0.2), V(0.16, 0.46, -0.18),
  ]), 0.3, 0.6));
  for (const [y, z, dy, w, l, x, sw] of [
    [0.38, 0.02, -0.45, 0.065, 0.3, 0.212, P.prim], [0.44, 0.0, -0.22, 0.07, 0.32, 0.218, P.prim],
    [0.5, -0.02, -0.02, 0.065, 0.28, 0.214, P.prim],
    [0.4, 0.09, -0.55, 0.065, 0.2, 0.226, P.gold], [0.465, 0.08, -0.3, 0.07, 0.21, 0.23, P.gold],
    [0.53, 0.06, -0.1, 0.06, 0.19, 0.226, P.gold],
    [0.41, 0.12, -0.55, 0.065, 0.2, 0.236, P.em], [0.475, 0.11, -0.3, 0.07, 0.2, 0.24, P.emB],
    [0.54, 0.09, -0.1, 0.06, 0.18, 0.236, P.em],
    [0.47, 0.17, -0.6, 0.06, 0.14, 0.246, P.emB], [0.54, 0.16, -0.35, 0.06, 0.12, 0.244, P.em],
  ]) S.push(fplate(V(x, y, z), V(0.1, dy, -1), V(1, 0.1, 0.05), w, l, 0.012, sw));
  // jade shoulder plate with gold trim
  const pauld = (s, c) => {
    const pts = [];
    for (const th of [-0.35, 0.25, 0.85, 1.4]) for (const [z, r] of [[-0.075, 0.075], [0, 0.1], [0.075, 0.08]]) {
      pts.push(c.clone().add(V(Math.sin(th) * r * s, Math.cos(th) * r * s, z * s)));
      pts.push(c.clone().add(V(Math.sin(th) * r * s * 0.55, Math.cos(th) * r * s * 0.55, z * s * 0.8)));
    }
    return pts;
  };
  S.push(paint(hull(pauld(1.12, V(0.17, 0.47, 0.07))), P.gold, 'y', [0.42, 0.6]));
  S.push(paint(hull(pauld(1.0, V(0.186, 0.488, 0.07))), P.jade, 'y', [0.44, 0.6]));
  // carved jade stud on the pauldron
  S.push(paint(shard(V(0.27, 0.53, 0.07), V(1, 0.6, 0), 0.03, 0.03, 4, 1), P.gold, 'flat'));
  // ================= LEGS + FEET =================
  const legX = 0.095;
  S.push(em(blob(1, V(legX, 0.24, -0.01), V(0.085, 0.09, 0.1), { jitter: 0.15 }), 0.15, 0.4));
  S.push(fplate(V(legX + 0.06, 0.26, 0.04), V(0.3, -1, 0.2), V(1, 0, 0.6), 0.045, 0.1, 0.011, P.em));
  S.push(fplate(V(legX + 0.06, 0.26, -0.06), V(0.3, -1, -0.3), V(1, 0, -0.5), 0.045, 0.1, 0.011, P.emB));
  S.push(fplate(V(legX, 0.26, 0.07), V(0, -1, 0.3), V(0, 0, 1), 0.045, 0.09, 0.011, P.red));
  S.push(paint(hull([...ring(V(legX, 0.2, -0.005), 0.07, 0.07, 6), ...ring(V(legX + 0.003, 0.12, 0.005), 0.066, 0.066, 6),
    ...ring(V(legX + 0.005, 0.04, 0.02), 0.062, 0.062, 6)]), P.leg, 'y', [0, 0.22]));
  const foot = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.034, z), 0.06, 0.034, 0.056, 0.016)), P.leg, 'y', [0, 0.07]));
    for (const [dx, dz] of [[-0.062, 0.088], [0, 0.11], [0.062, 0.088]]) {
      S.push(paint(hull([...cbox(V(x + dx * 0.45, 0.03, z + dz * 0.45), 0.029, 0.03, 0.026, 0.01),
        ...cbox(V(x + dx, 0.025, z + dz), 0.026, 0.025, 0.02, 0.009)]), P.leg, 'y', [0, 0.07]));
      S.push(paint(shard(V(x + dx * 1.08, 0.022, z + dz + 0.016), V(dx, -0.45, 0.8), 0.019, 0.045), P.claw, 'flat'));
    }
    S.push(paint(hull([...cbox(V(x, 0.025, z - 0.06), 0.024, 0.025, 0.035, 0.008)]), P.leg, 'y', [0, 0.07]));
    S.push(paint(shard(V(x, 0.02, z - 0.095), V(0, -0.4, -1), 0.017, 0.04), P.claw, 'flat'));
  };
  foot(legX + 0.005, 0.03);

  // ---- vine spiralling up each leg, with leaves ----
  const vpts = [];
  for (let i = 0; i <= 8; i++) {
    const a = -0.6 + i * 0.95, y = 0.07 + i * 0.022, r = 0.076 + (i > 5 ? (i - 5) * 0.012 : 0);
    vpts.push(V(legX + 0.003 + Math.sin(a) * r, y, 0.008 + Math.cos(a) * r));
  }
  S.push(paint(tube(curveSamples(vpts, 22, () => 0.014), { seg: 5, capStart: 0.01, capEnd: 0.01 }), P.vine, 'flat'));
  const leaf = (b, d, n, w, l) => fplate(b, d, n, w, l, 0.01, P.leaf, 'y');
  S.push(leaf(V(legX + 0.07, 0.13, 0.02), V(1, 0.2, 0.5), V(0, 1, 0), 0.04, 0.1));
  S.push(leaf(V(legX - 0.02, 0.1, 0.062), V(-0.2, 0.3, 1), V(0, 1, -0.3), 0.036, 0.09));
  S.push(leaf(V(legX + 0.05, 0.2, -0.05), V(0.8, 0.4, -0.6), V(0, 1, 0), 0.036, 0.095));

  // ================= TAIL: very long streamers sweeping back and down to the ground =================
  const streamer = (pts, w, th, ax, tw = 0) => paint(tube(curveSamples(pts, 16,
    (t) => w * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, 0.12 + t * 1.0))) * (t > 0.9 ? 1 - (t - 0.9) * 7 : 1) + 0.004,
    (t) => th * (1 - 0.35 * t)),
    { seg: 4, axis: ax, capEnd: 0.0, capStart: 0.0, twist: (i) => tw * i / 15 }), P.tail, 'len');
  // pull the tail's rear part down so its lowest point rests exactly on the ground (y = 0, same as the feet)
  const ground = (g, zFrom, zTo) => {
    const p = g.attributes.position;
    let ym = Infinity;
    for (let i = 0; i < p.count; i++) if (p.getZ(i) < zFrom) ym = Math.min(ym, p.getY(i));
    for (let i = 0; i < p.count; i++) {
      const k = THREE.MathUtils.smoothstep(-p.getZ(i), -zFrom, -zTo);
      p.setY(i, p.getY(i) - ym * k);
    }
    g.computeVertexNormals();
    return g;
  };
  // centre streamer (longest): wide flat ribbon with a thick ridge, so it reads from the side and the top
  C.push(ground(streamer([V(0, 0.42, -0.2), V(0, 0.42, -0.42), V(0, 0.33, -0.72), V(0, 0.17, -0.98), V(0, 0.06, -1.24), V(0, 0.035, -1.44), V(0, 0.06, -1.6)],
    0.085, 0.04, V(0.0, 1, 0.0)), -0.7, -1.25));
  // mirrored pair, splaying outward, tilted and twisting so their broad face shows in side and top views
  S.push(ground(streamer([V(0.04, 0.43, -0.19), V(0.08, 0.42, -0.4), V(0.14, 0.32, -0.66), V(0.2, 0.17, -0.9), V(0.25, 0.07, -1.12), V(0.28, 0.04, -1.3), V(0.3, 0.07, -1.44)],
    0.078, 0.038, V(-0.9, 1, 0).normalize(), 0.5), -0.6, -1.1));
  // short uppertail coverts hiding the roots
  C.push(fplate(V(0, 0.46, -0.2), V(0, -0.35, -1), V(0, 1, -0.3), 0.085, 0.2, 0.014, P.emB));
  S.push(fplate(V(0.06, 0.45, -0.19), V(0.25, -0.4, -1), V(0.3, 1, -0.3), 0.07, 0.18, 0.014, P.em));
  // dark undertail fan
  S.push(fplate(V(0.04, 0.34, -0.2), V(0.2, -0.6, -1), V(0.2, -1, -0.3), 0.06, 0.15, 0.012, P.prim));

  return assemble(C, S);
}

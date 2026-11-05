// Dolphin Dasher (Secret, Round 8 – Ocean Octagon): upright chunky faceted dolphin standing on its tail flukes.
import { V, THREE, hull, cbox, ring, plate, shard, blob, paint, assemble } from '../kit.js';

// glossy wet gradient: light top, a bright highlight band, then deep blue
const gloss = (stops) => (g, x, y) => {
  const gr = g.createLinearGradient(0, y + 16, 0, y + 112);
  for (const [t, c] of stops) gr.addColorStop(t, c);
  g.fillStyle = stops[0][1]; g.fillRect(x, y, 128, 16);
  g.fillStyle = gr; g.fillRect(x, y + 16, 128, 96);
  g.fillStyle = stops[stops.length - 1][1]; g.fillRect(x, y + 112, 128, 16);
};

export const PALETTE = {
  blue:   { i: 0, draw: gloss([[0, '#6CC6FF'], [0.12, '#C8EEFF'], [0.22, '#5DB8FF'], [0.6, '#2E86E8'], [1, '#1A56BE']]) },
  belly:  { i: 1, draw: gloss([[0, '#FFFFFF'], [0.5, '#F4FAFF'], [1, '#CFE4F4']]) },
  brow:   { i: 2, top: '#2F86E6', bot: '#1849A8' },
  dark:   { i: 3, top: '#1E5FC8', bot: '#123C8C' },
  eye:    { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  mouth:  { i: 6, top: '#24315A', bot: '#141B36' },
  glow:   { i: 7, top: '#9FF7FF', bot: '#18C4FF', glow: true },
  pearl:  { i: 8, top: '#FFFFFF', bot: '#F7EEF8' },
  coral:  { i: 9, top: '#FF9A85', bot: '#E8435E' },
  fin:    { i: 10, draw: gloss([[0, '#5DB8FF'], [0.15, '#B4E6FF'], [0.3, '#3E9BF0'], [1, '#174FB4']]) },
  gpearl: { i: 11, top: '#DFFFFF', bot: '#5FE4FF', glow: true },
};
const P = PALETTE;

// ring of n points around an arbitrary axis (centre c, direction d), radii ra (side) rb (up-ish)
function aring(c, d, ra, rb, n, phase = Math.PI / n) {
  d = d.clone().normalize();
  const up = Math.abs(d.y) > 0.9 ? V(0, 0, 1) : V(0, 1, 0);
  const a = new THREE.Vector3().crossVectors(up, d).normalize();
  const b = new THREE.Vector3().crossVectors(d, a).normalize();
  const pts = [];
  for (let k = 0; k < n; k++) {
    const t = phase + (2 * Math.PI * k) / n;
    pts.push(c.clone().addScaledVector(a, Math.cos(t) * ra).addScaledVector(b, Math.sin(t) * rb));
  }
  return pts;
}

// torso sections (y, zc, rx, rz) used for both the body hull and surface-hugging glow stripes
const TORSO = [
  [0.22, -0.05, 0.115, 0.115],
  [0.33, -0.03, 0.165, 0.15],
  [0.45, 0.01, 0.18, 0.165],
  [0.57, 0.055, 0.168, 0.155],
  [0.66, 0.09, 0.145, 0.138],
];
// tail stock sections continuing down from the torso's bottom ring, curving back then forward into the flukes
const TAIL = [
  [0.22, -0.05, 0.115, 0.115],
  [0.15, -0.075, 0.11, 0.112],
  [0.095, -0.075, 0.096, 0.1],
  [0.05, -0.05, 0.088, 0.087],
  [0.03, -0.02, 0.078, 0.075],
];
function torsoAt(y) {
  let i = 0;
  while (i < TORSO.length - 2 && y > TORSO[i + 1][0]) i++;
  const a = TORSO[i], b = TORSO[i + 1], t = THREE.MathUtils.clamp((y - a[0]) / (b[0] - a[0]), 0, 1);
  return a.map((v, k) => v + (b[k] - v) * t);
}
// point on the torso surface at angle th (0 = +x side, +pi/2 = front), scaled radially by s
function tp(th, y, s) {
  const [, zc, rx, rz] = torsoAt(y);
  return V(Math.cos(th) * rx * s, y, zc + Math.sin(th) * rz * s);
}
const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

export function buildGeometry() {
  const C = [], S = [];
  const blue = (pts, lo, hi) => paint(hull(pts), P.blue, 'y', [lo, hi]);
  const glow = (pts) => paint(hull(pts), P.glow, 'y');

  // ================= FLUKES: two crescent lobes, notched at the centre, planted flat =================
  const fh = (x) => 0.062 - 0.036 * (x / 0.3);       // lobe thickness, thinning toward the tips
  const LOBES = [
    [[0.0, 0.035], [0.05, 0.085], [0.12, 0.07], [0.165, -0.065], [0.075, -0.075], [0.0, -0.045]],   // inner (root) part
    [[0.12, 0.07], [0.22, 0.025], [0.305, -0.095], [0.27, -0.13], [0.165, -0.065]], // outer swept tip
  ];
  const cen = [0.14, -0.02];
  for (const lobe of LOBES) {
    const pts = [];
    for (const [x, z] of lobe) {
      const [ix, iz] = lerp2([x, z], cen, 0.1);           // bevelled top edge
      pts.push(V(x, 0, z), V(x, fh(x) * 0.6, z), V(ix, fh(x), iz));
    }
    S.push(paint(hull(pts), P.fin, 'y', [0, 0.1]));
  }
  // glowing leading edge + tip of each lobe
  const LEAD = [[0.0, 0.035], [0.05, 0.085], [0.12, 0.07], [0.22, 0.025], [0.305, -0.095], [0.27, -0.13]];
  for (let i = 0; i < LEAD.length - 1; i++) {
    const pts = [];
    for (const q of [LEAD[i], LEAD[i + 1]]) {
      const out = new THREE.Vector2(q[0] - cen[0], q[1] - cen[1]).normalize();
      const h = fh(q[0]);
      pts.push(V(q[0] + out.x * 0.005, h * 0.35, q[1] + out.y * 0.005), V(q[0] + out.x * 0.005, h * 0.6 + 0.004, q[1] + out.y * 0.005),
        V(q[0] - out.x * 0.024, h + 0.005, q[1] - out.y * 0.024), V(q[0] - out.x * 0.024, h * 0.35, q[1] - out.y * 0.024));
    }
    S.push(glow(pts));
  }

  // ================= TAIL STOCK: one thick curved column continuous with the torso =================
  for (let i = 0; i < TAIL.length - 1; i++) {
    const r = (s) => ring(V(0, s[0], s[1]), s[2], s[3], 12, 'y', Math.PI / 12);
    C.push(blue([...r(TAIL[i]), ...r(TAIL[i + 1])], 0, 0.6));
    // white underside running down the front of the stock, tapering out above the flukes
    const w = (s, k) => ring(V(0, s[0], s[1] + 0.024), s[2] * (0.55 - 0.1 * k), s[3], 10, 'y');
    if (i < 3) C.push(paint(hull([...w(TAIL[i], i / 3), ...w(TAIL[i + 1], (i + 1) / 3)]), P.belly, 'y', [0, 0.7]));
  }

  // ================= TORSO (chunky barrel leaning forward) + white belly =================
  C.push(blue(TORSO.flatMap(([y, z, rx, rz]) => ring(V(0, y, z), rx, rz, 12, 'y', Math.PI / 12)), 0.15, 0.75));
  C.push(paint(hull(TORSO.map(([y, z, rx, rz], i) => ring(V(0, y, z + 0.03), rx * 0.62, rz * (i === 4 ? 0.95 : 1), 10, 'y'))
    .flat()), P.belly, 'y', [0.15, 0.75]));

  // bold swept speed-chevrons on the flanks (surface-hugging, split into short spans so they never sink)
  const band = (path, w) => {
    for (let i = 0; i < path.length - 1; i++) {
      const pts = [];
      for (const [th, y, f] of [path[i], path[i + 1]]) for (const s of [0.86, 1.055]) pts.push(tp(th, y - w * f / 2, s), tp(th, y + w * f / 2, s));
      S.push(glow(pts));
    }
  };
  for (const [y0, sp, w] of [[0.52, 0.05, 0.036], [0.39, 0.045, 0.034]]) {
    band([[0.78, y0, 1.1], [0.45, y0 + sp * 0.55, 1], [0.15, y0 + sp, 0.75], [-0.08, y0 + sp * 1.3, 0.35]], w);
    band([[0.78, y0, 1.1], [0.45, y0 - sp * 0.55, 1], [0.15, y0 - sp, 0.75], [-0.08, y0 - sp * 1.3, 0.35]], w * 0.85);
  }

  // glowing diamond spots down the spine below the dorsal fin
  for (const [y, r] of [[0.36, 0.026], [0.28, 0.021]]) {
    const b = tp(-Math.PI / 2, y, 1.0);
    C.push(glow([V(0, y + r * 1.3, b.z + 0.02), V(0, y - r * 1.3, b.z + 0.02), V(r, y, b.z + 0.02), V(-r, y, b.z + 0.02),
      V(0, y, b.z - 0.022)]));
  }
  // ================= DORSAL FIN (swept back) with glowing leading edge =================
  C.push(paint(hull([V(0.03, 0.6, -0.06), V(-0.03, 0.6, -0.06), V(0.03, 0.4, -0.15), V(-0.03, 0.4, -0.15),
    V(0.014, 0.68, -0.2), V(-0.014, 0.68, -0.2), V(0.006, 0.69, -0.34), V(-0.006, 0.69, -0.34)]), P.fin, 'y', [0.4, 0.68]));
  for (const [a, b, wa, wb] of [[V(0, 0.6, -0.06), V(0, 0.68, -0.2), 0.034, 0.02], [V(0, 0.68, -0.2), V(0, 0.69, -0.34), 0.02, 0.011]]) {
    C.push(glow([a.clone().add(V(wa, 0.008, 0.006)), a.clone().add(V(-wa, 0.008, 0.006)), a.clone().add(V(wa, -0.03, -0.012)), a.clone().add(V(-wa, -0.03, -0.012)),
      b.clone().add(V(wb, 0.008, 0.004)), b.clone().add(V(-wb, 0.008, 0.004)), b.clone().add(V(wb, -0.022, 0.006)), b.clone().add(V(-wb, -0.022, 0.006))]));
  }

  // ================= PECTORAL FINS: thick arm + broad flat paddle with swept tip =================
  const sh = V(0.15, 0.55, 0.09), wr = V(0.222, 0.44, 0.125);
  const ad = wr.clone().sub(sh);
  S.push(paint(hull([...aring(sh, ad, 0.052, 0.06, 8), ...aring(wr, ad, 0.048, 0.054, 8)]), P.blue, 'y', [0.3, 0.62]));
  // paddle outline (y, z) with x and half-thickness; normal roughly +x
  const PAD = [[0.238, 0.44, 0.165, 0.03], [0.272, 0.35, 0.135, 0.024], [0.315, 0.255, 0.0, 0.01], [0.262, 0.33, 0.015, 0.02], [0.225, 0.42, 0.075, 0.03]];
  const pad = [...aring(wr, ad, 0.048, 0.054, 8)];
  for (const [x, y, z, t] of PAD) pad.push(V(x + t, y, z), V(x - t, y, z));
  S.push(paint(hull(pad), P.fin, 'y', [0.25, 0.47]));
  // glowing leading edge on the paddle
  {
    const [B, Cc] = [PAD[1], PAD[2]];
    const pts = [];
    for (const t of [0.0, 0.92]) {
      const x = B[0] + (Cc[0] - B[0]) * t, y = B[1] + (Cc[1] - B[1]) * t, z = B[2] + (Cc[2] - B[2]) * t, th = B[3] + (Cc[3] - B[3]) * t;
      pts.push(V(x + th + 0.004, y + 0.006, z + 0.006), V(x - th - 0.004, y + 0.006, z + 0.006),
        V(x + th + 0.004, y + 0.03, z - 0.03), V(x - th - 0.004, y + 0.03, z - 0.03));
    }
    S.push(glow(pts));
  }
  // coral wrist band with pearls and a coral branch
  const adn = ad.clone().normalize();
  const bc = wr.clone().addScaledVector(adn, -0.005);
  S.push(paint(hull([...aring(bc.clone().addScaledVector(adn, -0.02), ad, 0.062, 0.067, 10),
    ...aring(bc.clone().addScaledVector(adn, 0.02), ad, 0.062, 0.067, 10)]), P.coral, 'y', [0.38, 0.47]));
  const bandPts = aring(bc, ad, 0.073, 0.078, 8, 0);
  for (const k of [0, 2, 4]) S.push(paint(blob(1, bandPts[k], V(0.017, 0.017, 0.017)), P.pearl, 'y'));
  const cb = bc.clone().add(V(0.058, 0.0, -0.02));
  S.push(paint(shard(cb, V(1, 0.9, -0.5), 0.016, 0.075), P.coral, 'flat'));
  S.push(paint(shard(cb.clone().add(V(0.02, 0.02, -0.012)), V(0.3, 1, -0.9), 0.011, 0.055), P.coral, 'flat'));
  S.push(paint(shard(cb.clone().add(V(0.028, 0.008, 0.0)), V(1, 0.2, 0.2), 0.01, 0.045), P.coral, 'flat'));

  // ================= HEAD (big, rounded melon, long tapered bottlenose rostrum) =================
  const H = { y: 0.81, z: 0.135 };
  const FZ = H.z + 0.16;
  C.push(blue([
    ...cbox(V(0, H.y - 0.04, H.z), 0.18, 0.11, 0.16, 0.05),
    ...ring(V(0, H.y + 0.12, H.z), 0.162, 0.145, 10, 'y'),
    ...ring(V(0, H.y + 0.18, H.z - 0.01), 0.12, 0.11, 8, 'y'),
    ...ring(V(0, H.y + 0.21, H.z - 0.02), 0.06, 0.055, 6, 'y'),
    V(0.05, H.y + 0.13, FZ + 0.008), V(-0.05, H.y + 0.13, FZ + 0.008), V(0, H.y + 0.155, FZ + 0.01), // melon dome
    V(0.195, H.y - 0.06, H.z + 0.02), V(-0.195, H.y - 0.06, H.z + 0.02), // cheeks
    V(0.07, H.y - 0.112, FZ + 0.0), V(-0.07, H.y - 0.112, FZ + 0.0),      // beak root
  ], 0.62, 1.03));
  // back of head flows into the back (no neck notch)
  C.push(blue([...ring(V(0, 0.56, 0.055), 0.165, 0.153, 12, 'y', Math.PI / 12), ...ring(V(0, H.y - 0.12, H.z - 0.01), 0.17, 0.145, 12, 'y', Math.PI / 12)], 0.4, 1.0));
  // rostrum (upper beak, blue): long tapered bottlenose
  const R0 = V(0, H.y - 0.09, FZ - 0.005), R1 = V(0, H.y - 0.108, FZ + 0.2), rd = R1.clone().sub(R0);
  C.push(blue([...aring(R0, rd, 0.09, 0.05, 8), ...aring(R0.clone().lerp(R1, 0.5), rd, 0.066, 0.04, 8), ...aring(R1, rd, 0.04, 0.025, 8),
    R1.clone().add(V(0, -0.004, 0.022))], 0.62, 1.0));
  // lower beak (white), tucked under the rostrum and blending into the throat
  const J0 = V(0, H.y - 0.152, FZ - 0.03), J1 = V(0, H.y - 0.14, FZ + 0.16), jd = J1.clone().sub(J0);
  C.push(paint(hull([...aring(J0, jd, 0.055, 0.035, 8), ...aring(J1, jd, 0.033, 0.017, 8),
    ...ring(V(0, H.y - 0.175, H.z + 0.06), 0.085, 0.07, 8, 'y')]), P.belly, 'y', [0.6, 0.72]));
  // white throat
  C.push(paint(hull([...ring(V(0, H.y - 0.225, H.z + 0.05), 0.09, 0.085, 8, 'y'), ...ring(V(0, H.y - 0.17, H.z + 0.055), 0.09, 0.075, 8, 'y')]),
    P.belly, 'y', [0.6, 0.75]));
  // mouth: dark line between the beaks, curling up slightly at the corners
  const MY = H.y - 0.13;
  C.push(paint(hull([...aring(V(0, MY, FZ - 0.0), jd, 0.082, 0.007, 8), ...aring(V(0, MY + 0.002, FZ + 0.188), jd, 0.035, 0.006, 8)]), P.mouth, 'flat'));
  S.push(paint(hull([V(0.07, MY - 0.004, FZ + 0.034), V(0.07, MY + 0.005, FZ + 0.034), V(0.114, MY + 0.016, FZ + 0.007), V(0.114, MY + 0.024, FZ + 0.007),
    V(0.07, MY - 0.004, FZ - 0.01), V(0.07, MY + 0.005, FZ - 0.01), V(0.114, MY + 0.016, FZ - 0.03), V(0.114, MY + 0.024, FZ - 0.03)]), P.mouth, 'flat'));

  // fierce eyes: big white almond (angry flat top slanting down to the rostrum), big pupil, square catchlight
  const E = V(0.092, H.y + 0.008, 0), BY = H.y + 0.02;
  const ES = 1.4, sc = (pts) => pts.map(([u, v]) => [u * ES, v * ES]);
  S.push(paint(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.012, FZ + 0.018, 0.2)), P.white, 'flat'));
  S.push(paint(hull(plate(sc([[-0.03, 0.006], [0.018, 0.022], [0.026, -0.008], [0.008, -0.034], [-0.022, -0.032], [-0.034, -0.012]]),
    V(E.x - 0.006, E.y - 0.002, 0), FZ + 0.01, FZ + 0.025, 0.2)), P.eye, 'flat'));
  S.push(paint(hull(plate([[-0.0105, -0.0105], [0.0105, -0.0105], [0.0105, 0.0105], [-0.0105, 0.0105]],
    V(E.x + 0.004, E.y + 0.006, 0), FZ + 0.021, FZ + 0.029, 0.2)), P.white, 'flat'));
  // heavy brow, sitting just above the eye's flat top
  S.push(paint(hull([
    V(0.022, BY + 0.006, FZ + 0.05), V(0.024, BY + 0.05, FZ + 0.042),
    V(0.175, BY + 0.06, FZ - 0.0), V(0.175, BY + 0.1, FZ - 0.02),
    V(0.022, BY + 0.006, FZ - 0.02), V(0.024, BY + 0.06, FZ - 0.03),
    V(0.175, BY + 0.06, FZ - 0.065), V(0.175, BY + 0.1, FZ - 0.075),
  ]), P.brow, 'y'));
  // glowing rune on the melon
  C.push(glow([V(0, H.y + 0.16, FZ + 0.0), V(0.03, H.y + 0.128, FZ + 0.024), V(-0.03, H.y + 0.128, FZ + 0.024),
    V(0, H.y + 0.098, FZ + 0.034), V(0, H.y + 0.125, FZ - 0.03)]));
  // blowhole crest glow line on top of head
  C.push(glow([...cbox(V(0, H.y + 0.213, H.z - 0.025), 0.014, 0.006, 0.042, 0.003)]));

  // ================= PEARL & CORAL NECKLACE with glowing pendant =================
  for (let k = 1; k <= 3; k++) {
    const th = Math.PI / 2 + k * 0.32;
    const p = tp(th, 0.615, 1.0); p.z += Math.max(0, Math.sin(th)) * 0.035;
    if (k === 2) S.push(paint(blob(0, V(Math.abs(p.x), p.y, p.z), V(0.024, 0.026, 0.024)), P.coral, 'y'));
    else S.push(paint(blob(1, V(Math.abs(p.x), p.y, p.z), V(0.02, 0.02, 0.02)), P.pearl, 'y'));
  }
  const pz = tp(Math.PI / 2, 0.575, 1.0).z + 0.03;
  C.push(paint(hull([V(0, 0.618, pz - 0.005), V(0.024, 0.575, pz), V(-0.024, 0.575, pz), V(0, 0.532, pz), V(0, 0.575, pz - 0.03)]), P.coral, 'flat'));
  C.push(paint(blob(1, V(0, 0.575, pz + 0.018), V(0.03, 0.03, 0.03)), P.gpearl, 'y'));

  // ================= FLOATING HALO ARC of pearls and glowing orbs behind/above the head =================
  const AC = V(0, 0.86, -0.1), AR = 0.27;
  C.push(paint(blob(1, V(0, AC.y + AR, AC.z), V(0.032, 0.032, 0.032)), P.gpearl, 'y'));
  for (const [deg, kind, r] of [[68, 'p', 0.02], [46, 'g', 0.026], [24, 'p', 0.02], [2, 'g', 0.022]]) {
    const a = THREE.MathUtils.degToRad(deg);
    S.push(paint(blob(1, V(Math.cos(a) * AR, AC.y + Math.sin(a) * AR, AC.z), V(r, r, r)), kind === 'g' ? P.gpearl : P.pearl, 'y'));
  }

  return assemble(C, S);
}

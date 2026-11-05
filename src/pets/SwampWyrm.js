// Swamp Wyrm (SECRET): mossy green faceted dragon, tattered spread wings, curved bark horns,
// glowing lime markings, moss tufts, bog roots wrapped round the legs, floating glowing runes.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  green:  { i: 0, top: '#78A83E', bot: '#3D6A2B' },
  greenDk:{ i: 1, top: '#557F34', bot: '#2E5025' },
  belly:  { i: 2, top: '#DCE69C', bot: '#A9BC62' },
  memb:   { i: 3, top: '#4E9C86', bot: '#2D6658' },
  moss:   { i: 4, top: '#C4CF55', bot: '#7C8C2E' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:    { i: 6, top: '#1A1416', bot: '#0C0A0B' },
  nose:   { i: 7, top: '#1E3A1E', bot: '#102210' },
  brow:   { i: 8, top: '#5A8836', bot: '#355A26' },
  horn:   { i: 9, top: '#5C4228', bot: '#E2D29A' },
  root:   { i: 10, top: '#7A5A36', bot: '#4A3420' },
  claw:   { i: 11, top: '#F2ECCC', bot: '#C4B582' },
  glow:   { i: 12, top: '#D2FF3E', bot: '#8EF01E', glow: true },
  glowT:  { i: 13, top: '#E4FF7A', bot: '#9CF524', glow: true },
};
const P = PALETTE;
const DROP = 0.035;

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const green = (pts, lo = 0, hi = 1.0) => paint(hull(pts), P.green, 'y', [lo, hi]);
  const claw = (g) => paint(g, P.claw, 'flat');
  const glow = (g) => paint(g, P.glow, 'flat');
  const moss = (g) => paint(g, P.moss, 'y');

  // ---- surface helpers: raycast onto built hulls to lay flush glowing spots / moss ----
  const rc = new THREE.Raycaster();
  const hit = (geos, o, d) => {
    rc.set(o, d.clone().normalize());
    const h = rc.intersectObjects(geos.map((g) => new THREE.Mesh(g)), false)[0];
    return h ? { p: h.point.clone(), n: h.face.normal.clone().normalize() } : null;
  };
  const frame = (n) => {
    const up = Math.abs(n.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
    const a = new THREE.Vector3().crossVectors(n, up).normalize();
    const b = new THREE.Vector3().crossVectors(a, n).normalize();
    return [a, b];
  };
  // flat faceted spot sitting 0.007 proud of the surface, rooted inside it
  const spot = (h, r, sides = 6, sq = 1, rot = 0) => {
    const [a, b] = frame(h.n);
    const pts = [];
    for (let k = 0; k < sides; k++) {
      const t = rot + (2 * Math.PI * k) / sides;
      const off = a.clone().multiplyScalar(Math.cos(t) * r).addScaledVector(b, Math.sin(t) * r * sq);
      pts.push(h.p.clone().addScaledVector(h.n, 0.007).add(off));
      pts.push(h.p.clone().addScaledVector(h.n, -0.03).addScaledVector(off, 0.8));
    }
    return hull(pts);
  };
  // moss clump: jittery low-poly blob half sunk into the surface
  const mossAt = (h, s, flat = 0.55) => {
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), h.n);
    return moss(blob(0, h.p.clone().addScaledVector(h.n, s * 0.15), V(s, s * flat, s), { jitter: 0.35, rot: q }));
  };

  // ================= BODY =================
  const body = green([
    ...ring(V(0, 0.34, -0.38), 0.12, 0.12, 10, 'z'),
    ...ring(V(0, 0.34, -0.28), 0.2, 0.19, 10, 'z'),
    ...ring(V(0, 0.355, -0.12), 0.23, 0.22, 10, 'z'),
    ...ring(V(0, 0.385, 0.04), 0.23, 0.225, 10, 'z'),
    ...ring(V(0, 0.41, 0.16), 0.205, 0.21, 10, 'z'),
    ...ring(V(0, 0.44, 0.25), 0.13, 0.14, 10, 'z'),
  ], 0.12, 0.6);
  C.push(body);
  const neck = green([...ring(V(0, 0.46, 0.15), 0.155, 0.145, 10, 'y'), ...ring(V(0, 0.68, 0.24), 0.135, 0.125, 10, 'y')], 0.35, 0.85);
  C.push(neck);

  // ================= LEGS (short, thick) =================
  const legParts = [];
  legParts.push(green([...ring(V(0.175, 0.08, 0.22), 0.09, 0.09, 8), ...ring(V(0.175, 0.2, 0.2), 0.097, 0.1, 8),
    ...ring(V(0.155, 0.34, 0.14), 0.112, 0.122, 8)], 0.0, 0.6));
  legParts.push(paint(blob(0, V(0.17, 0.33, 0.14), V(0.125, 0.155, 0.14), { jitter: 0.1 }), P.green, 'y', [0.0, 0.6]));
  legParts.push(paint(blob(1, V(0.18, 0.26, -0.17), V(0.135, 0.16, 0.175), { jitter: 0.12 }), P.green, 'y', [0.0, 0.6]));
  legParts.push(green([...ring(V(0.185, 0.24, -0.16), 0.092, 0.097, 8), ...ring(V(0.195, 0.13, -0.19), 0.082, 0.082, 8),
    ...ring(V(0.195, 0.08, -0.18), 0.08, 0.08, 8)], 0.0, 0.6));
  S.push(...legParts);
  // feet: green block + 3 big bone claws
  const foot = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.055, z + 0.01), 0.092, 0.055, 0.082, 0.028)), P.greenDk, 'y', [0, 0.3]));
    for (const dx of [-0.057, 0, 0.057]) {
      const b = V(x + dx, 0.0, z + 0.082);
      S.push(claw(hull([
        V(b.x - 0.026, 0.0, b.z - 0.02), V(b.x + 0.026, 0.0, b.z - 0.02),
        V(b.x - 0.022, 0.055, b.z - 0.02), V(b.x + 0.022, 0.055, b.z - 0.02),
        V(b.x, 0.062, b.z + 0.0), V(b.x + dx * 0.15, 0.0, b.z + 0.075),
        V(b.x - 0.018, 0.0, b.z + 0.035), V(b.x + 0.018, 0.0, b.z + 0.035),
      ])));
    }
  };
  foot(0.18, 0.23);
  foot(0.2, -0.17);
  // bog roots spiralling down the lower legs and fanning onto the ground
  const rootCoil = (cx, cz, a0, turns, y0, y1, r, out) => {
    const pts = [];
    const n = 7;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), a = a0 + t * turns * 2 * Math.PI;
      pts.push(V(cx + Math.cos(a) * r, y0 + (y1 - y0) * t, cz + Math.sin(a) * r));
    }
    pts.push(out);
    S.push(paint(tube(curveSamples(pts, 10, (t) => 0.02 - 0.01 * t), { seg: 5, capEnd: 0.01 }), P.root, 'flat'));
  };
  // vines hugging the leg surface (raycast), then splaying out onto the ground
  const vine = (cx, cz, path, ground, r0 = 0.025) => {
    const pts = [];
    for (const [y, deg] of path) {
      const a = (deg * Math.PI) / 180, o = V(cx + Math.cos(a) * 0.6, y, cz + Math.sin(a) * 0.6);
      const h = hit(legParts, o, V(cx, y, cz).sub(o));
      if (h) pts.push(h.p.addScaledVector(h.n, r0 * 0.55));
    }
    pts.push(...ground);
    S.push(paint(tube(curveSamples(pts, pts.length + 2, (t) => r0 * (1 - 0.45 * t)), { seg: 5, capEnd: 0.008 }), P.root, 'y', [0, 0.4]));
  };
  vine(0.175, 0.21, [[0.34, 45], [0.25, 15], [0.17, -5], [0.115, 0]], [V(0.285, 0.014, 0.2)]);
  vine(0.175, 0.21, [[0.16, 25], [0.115, 40]], [V(0.278, 0.012, 0.28)], 0.018);
  vine(0.195, -0.18, [[0.36, -30], [0.27, 0], [0.18, 20], [0.115, 0]], [V(0.305, 0.014, -0.15)]);
  vine(0.195, -0.18, [[0.16, -30], [0.115, -40]], [V(0.298, 0.012, -0.22)], 0.018);
  const keep = new Set([...C, ...S]); // legs/feet/roots stay put; everything else drops (shorter legs)

  // ================= BELLY PLATE (segmented pale moss bands) =================
  const belly = [
    [0.66, 0.355, 0.085, 0.034, -0.35],
    [0.59, 0.345, 0.095, 0.034, -0.28],
    [0.52, 0.34, 0.105, 0.034, -0.15],
    [0.45, 0.335, 0.115, 0.034, 0.0],
    [0.38, 0.32, 0.115, 0.034, 0.2],
    [0.31, 0.29, 0.11, 0.034, 0.45],
    [0.25, 0.235, 0.105, 0.034, 0.85],
  ];
  for (const [y, z, w, l, t] of belly) {
    const up = V(0, Math.cos(t), -Math.sin(t)), n = V(0, Math.sin(t), Math.cos(t));
    const pts = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const c = V(0, y, z).addScaledVector(up, sy * l);
      pts.push(c.clone().addScaledVector(X, sx * w).addScaledVector(n, -0.07));
      pts.push(c.clone().addScaledVector(X, sx * (w - 0.01)).addScaledVector(n, -0.005));
      pts.push(c.clone().addScaledVector(X, sx * (w - 0.035)).addScaledVector(n, 0.012).addScaledVector(up, -sy * 0.006));
    }
    C.push(paint(hull(pts), P.belly, 'y', [0.2, 0.75]));
  }
  {
    const pts = [];
    for (const [y, z, w, l, t] of belly.slice(0, 6)) {
      const up = V(0, Math.cos(t), -Math.sin(t)), n = V(0, Math.sin(t), Math.cos(t));
      for (const sy of [-1, 1]) {
        const c = V(0, y, z).addScaledVector(up, sy * l);
        for (const sx of [-1, 1]) pts.push(c.clone().addScaledVector(X, sx * (w + 0.035)).addScaledVector(n, -0.04));
        pts.push(c.clone().addScaledVector(n, -0.16));
      }
    }
    C.push(green(pts, 0.15, 0.85));
  }

  // ================= HEAD (big, boxy) =================
  const H = { y: 0.81, z: 0.3 };
  const head = green([
    ...cbox(V(0, H.y, H.z), 0.205, 0.16, 0.16, 0.07),
    ...ring(V(0, H.y + 0.18, H.z - 0.03), 0.11, 0.1, 8, 'y'),
    V(0.22, H.y - 0.065, H.z + 0.02), V(-0.22, H.y - 0.065, H.z + 0.02),
  ], 0.55, 1.0);
  C.push(head);
  const FZ = H.z + 0.16;
  C.push(green([
    ...cbox(V(0, H.y - 0.07, FZ + 0.085), 0.115, 0.06, 0.105, 0.03),
    V(0.09, H.y - 0.0, FZ - 0.02), V(-0.09, H.y - 0.0, FZ - 0.02),
    V(0.065, H.y - 0.015, FZ + 0.17), V(-0.065, H.y - 0.015, FZ + 0.17),
  ], 0.6, 0.9));
  C.push(paint(hull(cbox(V(0, H.y - 0.14, FZ + 0.045), 0.095, 0.035, 0.1, 0.02)), P.belly, 'y', [0.6, 0.72]));
  // nostrils (glowing faintly lime)
  S.push(paint(hull([V(0.028, H.y - 0.008, FZ + 0.155), V(0.062, H.y - 0.008, FZ + 0.15), V(0.028, H.y - 0.022, FZ + 0.197),
    V(0.062, H.y - 0.022, FZ + 0.195), V(0.045, H.y - 0.03, FZ + 0.15), V(0.045, H.y - 0.04, FZ + 0.19)]), P.nose, 'flat'));
  // mouth line
  S.push(paint(hull([V(0, H.y - 0.098, FZ + 0.197), V(0, H.y - 0.088, FZ + 0.197), V(0.08, H.y - 0.098, FZ + 0.197),
    V(0.08, H.y - 0.088, FZ + 0.197), V(0, H.y - 0.093, FZ + 0.18), V(0.08, H.y - 0.093, FZ + 0.18)]), P.nose, 'flat'));
  S.push(paint(hull([V(0.1, H.y - 0.098, FZ + 0.185), V(0.1, H.y - 0.088, FZ + 0.185), V(0.12, H.y - 0.098, FZ + 0.16),
    V(0.12, H.y - 0.088, FZ + 0.16), V(0.12, H.y - 0.115, FZ + 0.05), V(0.12, H.y - 0.105, FZ + 0.05),
    V(0.105, H.y - 0.1, FZ + 0.06), V(0.09, H.y - 0.093, FZ + 0.18)]), P.nose, 'flat'));
  // small bone fang poking up from the jaw
  S.push(claw(shard(V(0.085, H.y - 0.105, FZ + 0.165), V(0, 1, 0.15), 0.014, 0.035, 3)));

  // fierce eyes
  const E = V(0.092, H.y + 0.045, 0);
  S.push(paint(hull(plate([[-0.05, 0.0], [0.052, 0.038], [0.06, -0.012], [0.022, -0.046], [-0.034, -0.042], [-0.052, -0.018]],
    E, FZ - 0.01, FZ + 0.01)), P.white, 'flat'));
  S.push(paint(hull(plate([[-0.03, 0.002], [0.018, 0.022], [0.025, -0.01], [0.005, -0.038], [-0.025, -0.036], [-0.036, -0.015]],
    V(E.x - 0.002, E.y, 0), FZ + 0.004, FZ + 0.016)), P.eye, 'flat'));
  S.push(paint(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.012, FZ + 0.02)), P.white, 'flat'));
  // heavy brow
  S.push(paint(hull([
    V(0.022, E.y + 0.01, FZ + 0.035), V(0.024, E.y + 0.055, FZ + 0.025),
    V(0.165, E.y + 0.055, FZ - 0.01), V(0.165, E.y + 0.1, FZ - 0.025),
    V(0.022, E.y + 0.01, FZ - 0.03), V(0.024, E.y + 0.065, FZ - 0.04),
    V(0.165, E.y + 0.055, FZ - 0.06), V(0.165, E.y + 0.1, FZ - 0.07),
  ]), P.brow, 'y'));

  // curved horns: sweep back, then hook up at the tip (bark brown -> pale bone)
  S.push(paint(tube(curveSamples(
    [V(0.085, H.y + 0.13, H.z - 0.0), V(0.15, H.y + 0.24, H.z - 0.08), V(0.2, H.y + 0.27, H.z - 0.2),
      V(0.23, H.y + 0.22, H.z - 0.31), V(0.26, H.y + 0.27, H.z - 0.4)],
    8, (t) => 0.058 * (1 - t) + 0.005), { seg: 6, capEnd: 0.0 }), P.horn, 'len'));
  S.push(paint(tube(curveSamples(
    [V(0.15, H.y + 0.06, H.z - 0.07), V(0.23, H.y + 0.08, H.z - 0.14), V(0.27, H.y + 0.04, H.z - 0.22), V(0.3, H.y + 0.08, H.z - 0.28)],
    6, (t) => 0.036 * (1 - t) + 0.004), { seg: 5 }), P.horn, 'len'));
  // dark green frill fins on the head sides
  const fin = (b, tip, h, th, up = V(0, 1, 0)) => hull([
    b.clone().addScaledVector(up, h).add(V(th, 0, 0)), b.clone().addScaledVector(up, h).add(V(-th, 0, 0)),
    b.clone().addScaledVector(up, -h).add(V(th, 0, 0)), b.clone().addScaledVector(up, -h).add(V(-th, 0, 0)),
    b.clone().add(V(th * 1.6, 0, 0.02)), tip,
  ]);
  for (const [b, tip, h] of [
    [V(0.19, H.y - 0.05, H.z - 0.02), V(0.32, H.y - 0.07, H.z - 0.16), 0.045],
    [V(0.17, H.y - 0.11, H.z + 0.02), V(0.27, H.y - 0.2, H.z - 0.1), 0.035],
  ]) S.push(paint(fin(b, tip, h, 0.022), P.greenDk, 'y', [H.y - 0.2, H.y + 0.2]));

  // ================= GLOWING LIME MARKINGS (raycast flush onto the hulls) =================
  const torso = [body, neck];
  // forehead rune: diamond + two side dots
  { const h = hit([head], V(0, H.y + 0.13, H.z + 0.4), V(0, -0.35, -1)); if (h) C.push(glow(spot(h, 0.03, 4, 1.4, 0))); }
  { const h = hit([head], V(0.4, H.y + 0.04, H.z - 0.02), V(-1, 0, 0)); if (h) S.push(glow(spot(h, 0.024, 6))); }
  { const h = hit([head], V(0.4, H.y - 0.03, H.z + 0.07), V(-1, 0, 0)); if (h) S.push(glow(spot(h, 0.016, 6))); }
  // flank spot rows
  for (const [y, z, r] of [[0.48, 0.06, 0.03], [0.44, -0.08, 0.036], [0.47, -0.22, 0.026], [0.36, 0.0, 0.022], [0.34, -0.15, 0.024],
    [0.53, -0.1, 0.02], [0.58, 0.18, 0.022]]) {
    const h = hit(torso, V(0.6, y, z), V(-1, 0.1, 0)); if (h) S.push(glow(spot(h, r, 6)));
  }
  // haunch + shoulder spots
  const legKeep = (g) => { keep.add(g); S.push(g); };
  { const h = hit(legParts, V(0.6, 0.3, -0.16), V(-1, 0.1, 0)); if (h) legKeep(glow(spot(h, 0.032, 6))); }
  { const h = hit(legParts, V(0.6, 0.22, -0.2), V(-1, 0.05, 0)); if (h) legKeep(glow(spot(h, 0.018, 6))); }
  { const h = hit(legParts, V(0.6, 0.36, 0.17), V(-1, 0.05, 0)); if (h) legKeep(glow(spot(h, 0.026, 6))); }
  // spine chevrons (centre line) between dorsal plates
  for (const [z, r] of [[0.07, 0.03], [-0.05, 0.034], [-0.17, 0.032], [-0.28, 0.026]]) {
    const h = hit(torso, V(0.09, 1.2, z), V(0, -1, 0)); if (h) S.push(glow(spot(h, r, 4, 1.5, 0.3)));
  }

  // ================= MOSS TUFTS =================
  for (const [o, d, s] of [
    [V(0.3, 0.75, 0.0), V(-1, -0.9, 0.1), 0.09], [V(0.3, 0.75, -0.2), V(-1, -1.2, 0.1), 0.085],
    [V(0.4, 0.5, 0.2), V(-1, -0.3, -0.2), 0.05], [V(0.4, 0.6, -0.3), V(-1, -1, 0.2), 0.045],
    [V(0.15, 1.0, -0.06), V(-0.1, -1, 0), 0.1], [V(0.12, 1.0, -0.24), V(-0.1, -1, 0), 0.095], [V(0.5, 0.9, -0.3), V(-1, -1.3, 0), 0.08],
  ]) { const h = hit(torso, o, d); if (h) S.push(mossAt(h, s)); }
  { const h = hit(legParts, V(0.45, 0.45, -0.15), V(-1, -1, 0)); if (h) legKeep(mossAt(h, 0.075)); }
  { const h = hit(legParts, V(0.45, 0.5, 0.16), V(-1, -1, 0)); if (h) legKeep(mossAt(h, 0.05)); }
  { const h = hit([head], V(0.15, H.y + 0.5, H.z - 0.1), V(-0.3, -1, 0)); if (h) S.push(mossAt(h, 0.05)); }
  C.push(moss(blob(0, V(0, H.y + 0.18, H.z - 0.07), V(0.07, 0.04, 0.06), { jitter: 0.3 })));
  // hanging moss beard under the jaw
  C.push(paint(shard(V(0, H.y - 0.16, FZ + 0.03), V(0, -1, 0.2), 0.04, 0.075), P.moss, 'flat'));
  S.push(paint(shard(V(0.06, H.y - 0.16, FZ + 0.0), V(0.35, -1, 0.1), 0.036, 0.065), P.moss, 'flat'));
  S.push(paint(shard(V(0.1, H.y - 0.15, FZ - 0.05), V(0.6, -1, -0.1), 0.032, 0.055), P.moss, 'flat'));

  // ================= DORSAL PLATES (dark green shards) =================
  for (const [y, z, s] of [[0.6, 0.13, 1.0], [0.58, 0.01, 1.2], [0.57, -0.11, 1.15], [0.55, -0.23, 1.0], [0.49, -0.33, 0.8]])
    C.push(paint(shard(V(0, y, z), V(0, 1, -0.55), 0.055 * s, 0.1 * s), P.greenDk, 'y'));
  C.push(paint(shard(V(0, H.y + 0.12, H.z - 0.12), V(0, 1, -1), 0.03, 0.07), P.greenDk, 'y'));
  C.push(paint(shard(V(0, H.y + 0.01, H.z - 0.16), V(0, 0.6, -1), 0.03, 0.08), P.greenDk, 'y'));

  // ================= TAIL =================
  const tailPts = [V(0, 0.34, -0.3), V(0, 0.23, -0.48), V(0, 0.14, -0.64), V(0, 0.15, -0.8), V(0, 0.26, -0.91), V(0, 0.42, -0.93)];
  const tailG = paint(tube(curveSamples(tailPts, 12, (t) => 0.14 * (1 - t) + 0.034), { seg: 8, axis: X, capEnd: 0.02 }), P.green, 'len');
  C.push(tailG);
  const tc = new THREE.CatmullRomCurve3(tailPts, false, 'centripetal');
  for (const t of [0.14, 0.3, 0.46, 0.62, 0.78]) {
    const p = tc.getPoint(t), T = tc.getTangent(t);
    const n = V(0, T.z, -T.y).normalize(); if (n.y + n.z * 0.3 < 0) n.negate();
    const r = 0.14 * (1 - t) + 0.034;
    const k = 1.1 - t * 0.6;
    C.push(paint(shard(p.clone().addScaledVector(n, r * 0.75), n.clone().addScaledVector(T, -0.6), 0.045 * k, 0.085 * k), P.greenDk, 'y'));
  }
  // glowing spot pairs along the tail sides
  for (const t of [0.22, 0.38, 0.54, 0.7]) {
    const p = tc.getPoint(t), T = tc.getTangent(t);
    const n = V(0, T.z, -T.y).normalize(); if (n.y + n.z * 0.3 < 0) n.negate();
    const h = hit([tailG], p.clone().add(V(0.4, 0, 0)).addScaledVector(n, 0.02), V(-1, 0, 0));
    if (h) S.push(glow(spot(h, 0.024 * (1.1 - t * 0.6), 6)));
  }
  for (const t of [0.08, 0.2, 0.32, 0.44, 0.56]) {
    const p = tc.getPoint(t), T = tc.getTangent(t);
    const n = V(0, T.z, -T.y).normalize(); if (n.y + n.z * 0.3 < 0) n.negate();
    const r = 0.14 * (1 - t) + 0.034, w = r * 0.62, l = 0.045 * (1 - t * 0.5);
    const pts = [];
    for (const sx of [-1, 1]) for (const sl of [-1, 1]) {
      const c = p.clone().addScaledVector(T, sl * l);
      pts.push(c.clone().addScaledVector(X, sx * w).addScaledVector(n, -r * 0.55));
      pts.push(c.clone().addScaledVector(X, sx * w * 0.7).addScaledVector(n, -r * 0.92));
      pts.push(c.clone().addScaledVector(X, sx * w * 0.5).addScaledVector(n, -r * 1.06).addScaledVector(T, -sl * 0.006));
    }
    C.push(paint(hull(pts), P.belly, 'flat'));
  }
  // tail tip: dark leaf spade with a glowing lime core
  const tip = tc.getPoint(1), tT = tc.getTangent(1);
  C.push(paint(hull([tip.clone().addScaledVector(tT, 0.2), tip.clone().addScaledVector(tT, -0.02),
    V(0.09, tip.y + 0.05, tip.z), V(-0.09, tip.y + 0.05, tip.z),
    V(0, tip.y + 0.05, tip.z - 0.03), V(0, tip.y + 0.05, tip.z + 0.03)]), P.greenDk, 'y'));
  C.push(glow(hull([tip.clone().addScaledVector(tT, 0.15), V(0.045, tip.y + 0.06, tip.z), V(-0.045, tip.y + 0.06, tip.z),
    V(0, tip.y + 0.07, tip.z - 0.042), V(0, tip.y + 0.07, tip.z + 0.042)])));
  // root tendril curling round the tail base


  // ================= WINGS (tattered, notched trailing edge) =================
  const Sh = V(0.13, 0.55, 0.0), El = V(0.33, 0.82, -0.08), Wr = V(0.44, 1.16, -0.14);
  const tips = [V(1.0, 0.72, -0.3), V(0.84, 0.3, -0.36), V(0.52, 0.24, -0.32)];
  const Bd = V(0.14, 0.5, -0.2);
  S.push(paint(tube(curveSamples([Sh, El, Wr], 6, (t) => 0.06 - 0.022 * t), { seg: 6, capEnd: 0.02 }), P.green, 'y', [0.4, 1.2]));
  S.push(paint(blob(0, Wr, V(0.05, 0.05, 0.05), { jitter: 0.1 }), P.green, 'y', [0.9, 1.25]));
  tips.forEach((T) => {
    S.push(paint(tube(curveSamples([Wr, Wr.clone().lerp(T, 0.5).add(V(0, 0.03, 0)), T], 4, (t) => 0.032 * (1 - t) + 0.014),
      { seg: 5, capEnd: 0.0 }), P.greenDk, 'y', [0.2, 1.2]));
  });
  S.push(paint(shard(Wr.clone().add(V(0, 0.03, 0.02)), V(-0.1, 1, 0.5), 0.032, 0.09), P.horn, 'y'));
  // moss draped over the wing arm
  S.push(moss(blob(0, El.clone().add(V(0, 0.02, 0)), V(0.06, 0.04, 0.055), { jitter: 0.35 })));
  S.push(moss(shard(El.clone().add(V(0.01, -0.02, 0.0)), V(0.1, -1, 0.05), 0.03, 0.07)));

  const th = 0.006;
  const panelN = (a, b, c) => new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
  const panel = (a, b, c) => {
    const n = panelN(a, b, c);
    const pts = [];
    for (const p of [a, b, c]) { pts.push(p.clone().addScaledVector(n, th)); pts.push(p.clone().addScaledVector(n, -th)); }
    S.push(paint(hull(pts), P.memb, 'y', [0.2, 1.1]));
  };
  const back = V(0, 0, -0.002);
  const W0 = Wr.clone().add(back);
  // tattered edge: between finger tips the membrane is torn into ragged V notches
  const edge = [tips[0], tips[1], tips[2], Bd].map((p) => p.clone().add(back));
  const rag = [];
  const notches = [[0.3, 0.42, 0.55, 0.22, 0.75, 0.38], [0.28, 0.4, 0.6, 0.18, 0.78, 0.34], [0.35, 0.3, 0.7, 0.2]];
  for (let i = 0; i < edge.length - 1; i++) {
    const a = edge[i], b = edge[i + 1];
    rag.push(a);
    const N = notches[i];
    for (let k = 0; k < N.length; k += 2) {
      const p = a.clone().lerp(b, N[k]);
      rag.push(p.lerp(W0, N[k + 1]));
    }
  }
  rag.push(edge[3]);
  for (let i = 0; i < rag.length - 1; i++) panel(W0, rag[i], rag[i + 1]);
  panel(W0, Bd.clone().add(back), El.clone().add(back));
  panel(El.clone().add(back), Bd.clone().add(back), Sh.clone().add(back));
  // glowing lime spots on the membranes (pierce through both faces)
  const wingSpot = (a, b, c, wts, r) => {
    const p = a.clone().multiplyScalar(wts[0]).addScaledVector(b, wts[1]).addScaledVector(c, wts[2]);
    const n = panelN(a, b, c);
    const [u, v] = frame(n);
    const pts = [];
    for (let k = 0; k < 4; k++) {
      const t = (2 * Math.PI * k) / 4;
      const off = u.clone().multiplyScalar(Math.cos(t) * r).addScaledVector(v, Math.sin(t) * r * 1.3);
      pts.push(p.clone().add(off).addScaledVector(n, 0.012), p.clone().add(off).addScaledVector(n, -0.012));
    }
    S.push(glow(hull(pts)));
  };
  wingSpot(W0, edge[0], edge[1], [0.45, 0.33, 0.22], 0.036);
  wingSpot(W0, edge[0], edge[1], [0.72, 0.16, 0.12], 0.022);
  wingSpot(W0, edge[1], edge[2], [0.45, 0.3, 0.25], 0.032);
  wingSpot(W0, edge[1], edge[2], [0.72, 0.14, 0.14], 0.02);
  wingSpot(W0, edge[2], edge[3], [0.5, 0.2, 0.3], 0.028);

  // ================= FLOATING GLOWING RUNES (Secret) =================
  // centre crystal floating above the head, between the horns
  const fc = V(0, H.y + 0.44, H.z - 0.05);
  C.push(paint(hull([fc.clone().add(V(0, 0.095, 0)), fc.clone().add(V(0, -0.095, 0)),
    ...ring(fc, 0.055, 0.055, 4, 'y', Math.PI / 4)]), P.glowT, 'y'));
  // two smaller rune shards flanking it
  { const c = V(0.105, H.y + 0.41, H.z - 0.05);
    S.push(paint(hull([c.clone().add(V(0, 0.05, 0)), c.clone().add(V(0, -0.05, 0)), ...ring(c, 0.03, 0.03, 4, 'y', Math.PI / 4)]), P.glowT, 'y')); }
  // outer orbs closing the crown-of-light arc
  S.push(paint(blob(0, V(0.19, H.y + 0.385, H.z - 0.05), V(0.028, 0.028, 0.028)), P.glowT, 'y'));

  for (const g of [...C, ...S]) if (!keep.has(g)) g.translate(0, -DROP, 0);
  return assemble(C, S);
}

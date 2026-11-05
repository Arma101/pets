// Starforge Dragon (ROBUX EGG / Ultimate Egg): chunky faceted black dragon with molten star-forge cracks,
// fiery horns and wings with starfield membranes, glowing gold armour and a floating golden halo.
import { V, THREE, hull, cbox, ring, plate, shard, tube, curveSamples, paint, assemble } from '../kit.js';

// ---------- custom cells ----------
// deterministic star positions inside a 128 cell
function stars(ctx, x, y, n, seed, cols, sizes) {
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let k = 0; k < n; k++) {
    const px = x + 10 + rnd() * 108, py = y + 10 + rnd() * 108;
    const sz = sizes[Math.floor(rnd() * sizes.length)];
    ctx.fillStyle = cols[Math.floor(rnd() * cols.length)];
    if (sz >= 4) { // little 4-point sparkle
      ctx.fillRect(px - sz / 2, py - 1, sz, 2);
      ctx.fillRect(px - 1, py - sz / 2, 2, sz);
      ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
    } else ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
  }
}

export const PALETTE = {
  // charcoal body with faint starfield (mapped with a custom projection)
  bodyS: { i: 0, draw(ctx, x, y) {
    const g = ctx.createLinearGradient(0, y + 8, 0, y + 120);
    g.addColorStop(0, '#625C70'); g.addColorStop(1, '#22202A');
    ctx.fillStyle = g; ctx.fillRect(x, y, 128, 128);
    stars(ctx, x, y, 34, 7, ['#A69EDA', '#C2BBF0', '#8F88C0', '#E2BE5E'], [2, 2, 3, 3, 5]);
  } },
  body:   { i: 1, top: '#5E5868', bot: '#25232C' },
  bodyDk: { i: 2, top: '#4C4756', bot: '#1E1C24' },
  gold:   { i: 3, top: '#FFE27A', bot: '#D9931C' },
  goldG:  { i: 4, top: '#FFEA8C', bot: '#FFB820', glow: true },  // halo + gems: glowing gold
  lava:   { i: 5, top: '#FFA238', bot: '#FF5A0C', glow: true },  // molten cracks
  fireT:  { i: 6, top: '#FF5A0A', bot: '#FFE680', glow: true },  // 'len': orange base -> yellow tip (horns, flames)
  white:  { i: 7, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:    { i: 8, top: '#1A1416', bot: '#0C0A0B' },
  // wing membrane: deep starfield at the top fading to forge fire at the trailing edge
  memb:   { i: 9, draw(ctx, x, y) {
    const g = ctx.createLinearGradient(0, y + 8, 0, y + 120);
    g.addColorStop(0, '#1C1640'); g.addColorStop(0.45, '#3A2470');
    g.addColorStop(0.72, '#C0361E'); g.addColorStop(0.88, '#FF7A12'); g.addColorStop(1, '#FFC23A');
    ctx.fillStyle = g; ctx.fillRect(x, y, 128, 128);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, 128, 82); ctx.clip();
    stars(ctx, x, y, 46, 31, ['#FFFFFF', '#E8E4FF', '#FFE27A', '#B9D4FF'], [2, 2, 3, 3, 5, 6]);
    ctx.restore();
  } },
  // forged spike: molten tip (top 40%) with a crisp edge into the dark base
  spikeS: { i: 10, draw(ctx, x, y) {
    const g = ctx.createLinearGradient(0, y + 8, 0, y + 60);
    g.addColorStop(0, '#FFD45A'); g.addColorStop(1, '#FF6A10');
    ctx.fillStyle = g; ctx.fillRect(x, y, 128, 60);
    const d = ctx.createLinearGradient(0, y + 60, 0, y + 128);
    d.addColorStop(0, '#5A5464'); d.addColorStop(1, '#25232C');
    ctx.fillStyle = d; ctx.fillRect(x, y + 60, 128, 68);
  } },
  mouth:  { i: 11, top: '#140F12', bot: '#0A0709' },
  goldDk: { i: 12, top: '#F2C452', bot: '#B5741A' },
};
const P = PALETTE;

// UV into a custom-drawn cell, u,v in [0,1]
function cellUV(sw, u, v) {
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  const c = (t) => Math.min(1, Math.max(0, t));
  return [(x + 10 + c(u) * 108) / 1024, (y + 10 + c(v) * 108) / 1024];
}
function paintProj(g, sw, f) {
  const p = g.attributes.position, uv = [];
  for (let i = 0; i < p.count; i++) uv.push(...cellUV(sw, ...f(p.getX(i), p.getY(i), p.getZ(i))));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}

// ---------- surface-hugging molten cracks ----------
const RC = new THREE.Raycaster();
const MAT = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
const meshOf = (g) => { const m = new THREE.Mesh(g, MAT); m.updateMatrixWorld(true); return m; };
function hit(mesh, from, dir) {
  RC.set(from, dir.clone().normalize());
  const h = RC.intersectObject(mesh, false)[0];
  if (!h) return null;
  const n = h.face.normal.clone();
  if (n.dot(dir) > 0) n.negate();
  return { p: h.point.clone(), n };
}
// pts: points outside the surface; each is projected along dir onto mesh. Builds a thin raised glowing strip.
function crack(out, mesh, pts, dir, w = 0.011) {
  const samp = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const steps = Math.max(1, Math.ceil(pts[i].distanceTo(pts[i + 1]) / 0.046));
    for (let s = 0; s < steps; s++) samp.push(pts[i].clone().lerp(pts[i + 1], s / steps));
  }
  samp.push(pts[pts.length - 1].clone());
  const H = samp.map((p) => hit(mesh, p, dir)).filter(Boolean);
  for (let i = 0; i < H.length - 1; i++) {
    const a = H[i], b = H[i + 1];
    const sdir = b.p.clone().sub(a.p); const len = sdir.length(); if (len < 1e-4) continue; sdir.normalize();
    const n = a.n.clone().add(b.n).normalize();
    const side = new THREE.Vector3().crossVectors(n, sdir).normalize();
    const wa = w * (i === 0 ? 0.45 : 1), wb = w * (i === H.length - 2 ? 0.45 : 1);
    const q = [];
    for (const [e, ww, ext] of [[a.p, wa, -0.5], [b.p, wb, 0.5]]) {
      const c = e.clone().addScaledVector(sdir, ext * ww);
      for (const sg of [-1, 1]) {
        q.push(c.clone().addScaledVector(side, sg * ww).addScaledVector(n, 0.007));
        q.push(c.clone().addScaledVector(side, sg * ww * 0.6).addScaledVector(n, -0.022));
      }
    }
    out.push(paint(hull(q), P.lava, 'flat'));
  }
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const dark = (pts, lo = 0, hi = 1.0) => paint(hull(pts), P.body, 'y', [lo, hi]);
  const gold = (g) => paint(g, P.gold, 'y');
  const starBody = (g, lo, hi, z0 = -0.5, z1 = 0.5) => paintProj(g, P.bodyS,
    (x, y, z) => [(z - z0) / (z1 - z0) * 0.8 + Math.abs(x) * 0.6, 1 - (y - lo) / (hi - lo)]);

  // ================= BODY =================
  const torso = hull([
    ...ring(V(0, 0.36, -0.4), 0.12, 0.12, 10, 'z'),
    ...ring(V(0, 0.35, -0.3), 0.2, 0.19, 10, 'z'),
    ...ring(V(0, 0.36, -0.13), 0.23, 0.22, 10, 'z'),
    ...ring(V(0, 0.39, 0.03), 0.235, 0.23, 10, 'z'),
    ...ring(V(0, 0.42, 0.16), 0.21, 0.22, 10, 'z'),
    ...ring(V(0, 0.45, 0.25), 0.14, 0.15, 10, 'z'),
  ]);
  C.push(starBody(torso, 0.12, 0.66));
  const neck = hull([...ring(V(0, 0.47, 0.15), 0.155, 0.145, 10, 'y'), ...ring(V(0, 0.7, 0.25), 0.135, 0.125, 10, 'y')]);
  C.push(starBody(neck, 0.35, 0.9));
  const torsoM = meshOf(torso), neckM = meshOf(neck);

  // molten star-forge cracks across the flanks (right side, mirrored)
  const L = V(-1, 0, 0);
  const side = (y, z) => V(0.6, y, z);
  crack(S, torsoM, [side(0.52, 0.06), side(0.45, 0.0), side(0.43, -0.07), side(0.36, -0.1), side(0.33, -0.18)], L);
  crack(S, torsoM, [side(0.45, 0.0), side(0.38, 0.04)], L, 0.009);
  crack(S, torsoM, [side(0.5, -0.17), side(0.45, -0.24), side(0.47, -0.3)], L, 0.009);
  crack(S, torsoM, [side(0.27, 0.06), side(0.23, -0.02), side(0.24, -0.09)], L, 0.009);
  crack(S, neckM, [V(0.5, 0.62, 0.2), V(0.5, 0.57, 0.17), V(0.5, 0.52, 0.19)], L, 0.009);

  // ================= LEGS (short, thick) =================
  const fLeg = hull([...ring(V(0.175, 0.08, 0.22), 0.09, 0.09, 8), ...ring(V(0.175, 0.2, 0.2), 0.097, 0.1, 8),
    ...ring(V(0.155, 0.34, 0.14), 0.115, 0.125, 8), ...ring(V(0.13, 0.44, 0.12), 0.09, 0.1, 8)]);
  S.push(paint(fLeg, P.body, 'y', [0.0, 0.6]));
  const haunch = hull([...ring(V(0.17, 0.4, -0.16), 0.08, 0.13, 8, 'x'), ...ring(V(0.215, 0.27, -0.17), 0.1, 0.165, 8, 'x'),
    ...ring(V(0.2, 0.15, -0.17), 0.07, 0.11, 8, 'x')]);
  S.push(paint(haunch, P.body, 'y', [0.0, 0.62]));
  S.push(dark([...ring(V(0.2, 0.22, -0.17), 0.09, 0.095, 8), ...ring(V(0.2, 0.08, -0.18), 0.082, 0.082, 8)], 0.0, 0.6));
  crack(S, meshOf(haunch), [V(0.6, 0.36, -0.11), V(0.6, 0.29, -0.15), V(0.6, 0.26, -0.22), V(0.6, 0.2, -0.24)], L, 0.009);
  crack(S, meshOf(fLeg), [V(0.155, 0.32, 0.6), V(0.17, 0.25, 0.6), V(0.165, 0.18, 0.6)], V(0, 0, -1), 0.009);

  // feet: dark block + 3 big gold claws + glowing gold armour cuff
  const foot = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.055, z + 0.01), 0.095, 0.055, 0.085, 0.028)), P.bodyDk, 'y', [0, 0.14]));
    for (const dx of [-0.058, 0, 0.058]) {
      const b = V(x + dx, 0.0, z + 0.085);
      S.push(gold(hull([
        V(b.x - 0.027, 0.0, b.z - 0.02), V(b.x + 0.027, 0.0, b.z - 0.02),
        V(b.x - 0.022, 0.056, b.z - 0.02), V(b.x + 0.022, 0.056, b.z - 0.02),
        V(b.x, 0.064, b.z), V(b.x + dx * 0.15, 0.0, b.z + 0.075),
        V(b.x - 0.018, 0.0, b.z + 0.035), V(b.x + 0.018, 0.0, b.z + 0.035),
      ])));
    }
    // armour cuff (chunky octagonal band)
    S.push(paint(hull([...ring(V(x, 0.115, z), 0.104, 0.104, 8), ...ring(V(x, 0.165, z - 0.005), 0.108, 0.108, 8)]), P.gold, 'y', [0.1, 0.17]));
  };
  foot(0.175, 0.22);
  foot(0.2, -0.18);
  // shoulder pauldrons (layered gold plates) + knee guards
  S.push(paint(hull([...ring(V(0.215, 0.47, 0.13), 0.075, 0.1, 8, 'x'), ...ring(V(0.27, 0.42, 0.14), 0.07, 0.095, 8, 'x'),
    V(0.24, 0.53, 0.12), V(0.3, 0.37, 0.15)]), P.gold, 'y', [0.35, 0.55]));
  S.push(paint(hull([...ring(V(0.25, 0.37, 0.155), 0.05, 0.075, 8, 'x'), ...ring(V(0.29, 0.34, 0.16), 0.045, 0.07, 8, 'x')]),
    P.goldDk, 'y', [0.3, 0.42]));
  S.push(gold(shard(V(0.27, 0.47, 0.12), V(0.6, 1, -0.2), 0.04, 0.09)));
  S.push(paint(hull([...ring(V(0.265, 0.3, -0.15), 0.06, 0.085, 8, 'x'), ...ring(V(0.31, 0.28, -0.15), 0.045, 0.07, 8, 'x')]),
    P.gold, 'y', [0.2, 0.38]));

  // ================= CHEST ARMOUR (segmented gold plates) =================
  const belly = [
    [0.68, 0.365, 0.085, 0.034, -0.35],
    [0.61, 0.355, 0.095, 0.034, -0.28],
    [0.54, 0.35, 0.11, 0.034, -0.15],
    [0.47, 0.345, 0.12, 0.034, 0.0],
    [0.4, 0.33, 0.12, 0.034, 0.2],
    [0.33, 0.3, 0.115, 0.034, 0.45],
    [0.27, 0.245, 0.105, 0.034, 0.85],
  ];
  belly.forEach(([y, z, w, l, t], idx) => {
    const up = V(0, Math.cos(t), -Math.sin(t)), n = V(0, Math.sin(t), Math.cos(t));
    const pts = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const c = V(0, y, z).addScaledVector(up, sy * l);
      pts.push(c.clone().addScaledVector(X, sx * w).addScaledVector(n, -0.07));
      pts.push(c.clone().addScaledVector(X, sx * (w - 0.01)).addScaledVector(n, -0.005));
      pts.push(c.clone().addScaledVector(X, sx * (w - 0.035)).addScaledVector(n, 0.014).addScaledVector(up, -sy * 0.006));
    }
    C.push(paint(hull(pts), idx % 2 ? P.goldDk : P.gold, 'y', [y - 0.04, y + 0.04]));
  });
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
    C.push(starBody(hull(pts), 0.15, 0.85));
  }
  // glowing star gem on the chest (4-point star, faceted)
  {
    const c = V(0, 0.54, 0.4), pts = [];
    for (let k = 0; k < 8; k++) {
      const a = Math.PI / 2 + k * Math.PI / 4, r = k % 2 ? 0.026 : 0.058;
      pts.push(V(Math.cos(a) * r, c.y + Math.sin(a) * r, c.z - 0.012));
    }
    const back = pts.map((p) => p.clone().add(V(0, 0, -0.02)));
    // star is concave: build as two convex diamonds
    C.push(paint(hull([V(0, c.y + 0.062, c.z - 0.03), V(0, c.y - 0.062, c.z - 0.03), V(0.022, c.y, c.z - 0.03), V(-0.022, c.y, c.z - 0.03),
      V(0, c.y + 0.05, c.z), V(0, c.y - 0.05, c.z), V(0, c.y, c.z + 0.022)]), P.goldG, 'y'));
    C.push(paint(hull([V(0.062, c.y, c.z - 0.03), V(-0.062, c.y, c.z - 0.03), V(0, c.y + 0.022, c.z - 0.03), V(0, c.y - 0.022, c.z - 0.03),
      V(0.05, c.y, c.z), V(-0.05, c.y, c.z), V(0, c.y, c.z + 0.022)]), P.goldG, 'y'));
    void back;
  }

  // ================= HEAD (big, boxy) =================
  const hC0 = C.length, hS0 = S.length;
  const H = { y: 0.83, z: 0.31 };
  const head = hull([
    ...cbox(V(0, H.y, H.z), 0.21, 0.165, 0.165, 0.07),
    ...ring(V(0, H.y + 0.185, H.z - 0.03), 0.115, 0.1, 8, 'y'),
    V(0.225, H.y - 0.065, H.z + 0.02), V(-0.225, H.y - 0.065, H.z + 0.02),
  ]);
  C.push(starBody(head, H.y - 0.2, H.y + 0.2, H.z - 0.3, H.z + 0.3));
  const FZ = H.z + 0.165;
  // blocky snout
  const snout = hull([
    ...cbox(V(0, H.y - 0.065, FZ + 0.09), 0.12, 0.07, 0.11, 0.03),
    V(0.09, H.y, FZ - 0.02), V(-0.09, H.y, FZ - 0.02),
    V(0.065, H.y - 0.015, FZ + 0.18), V(-0.065, H.y - 0.015, FZ + 0.18),
  ]);
  C.push(paint(snout, P.body, 'y', [H.y - 0.15, H.y + 0.05]));
  // lower jaw (gold-trimmed)
  C.push(paint(hull(cbox(V(0, H.y - 0.142, FZ + 0.05), 0.098, 0.036, 0.105, 0.02)), P.bodyDk, 'y', [H.y - 0.18, H.y - 0.1]));
  C.push(paint(hull(cbox(V(0, H.y - 0.163, FZ + 0.06), 0.075, 0.016, 0.085, 0.01)), P.gold, 'y'));
  // glowing ember nostrils
  S.push(paint(hull([V(0.03, H.y - 0.009, FZ + 0.16), V(0.064, H.y - 0.009, FZ + 0.155), V(0.03, H.y - 0.023, FZ + 0.207),
    V(0.064, H.y - 0.023, FZ + 0.205), V(0.047, H.y - 0.032, FZ + 0.155), V(0.047, H.y - 0.042, FZ + 0.2)]), P.lava, 'flat'));
  // mouth line + small fangs
  S.push(paint(hull([V(0, H.y - 0.1, FZ + 0.207), V(0, H.y - 0.09, FZ + 0.207), V(0.08, H.y - 0.1, FZ + 0.206),
    V(0.08, H.y - 0.09, FZ + 0.206), V(0, H.y - 0.095, FZ + 0.19), V(0.08, H.y - 0.095, FZ + 0.19)]), P.mouth, 'flat'));
  S.push(paint(hull([V(0.1, H.y - 0.1, FZ + 0.194), V(0.1, H.y - 0.09, FZ + 0.194), V(0.122, H.y - 0.1, FZ + 0.165),
    V(0.122, H.y - 0.09, FZ + 0.165), V(0.122, H.y - 0.117, FZ + 0.05), V(0.122, H.y - 0.107, FZ + 0.05),
    V(0.106, H.y - 0.1, FZ + 0.06), V(0.09, H.y - 0.093, FZ + 0.19)]), P.mouth, 'flat'));
  S.push(paint(hull([V(0.07, H.y - 0.098, FZ + 0.2), V(0.095, H.y - 0.098, FZ + 0.19), V(0.083, H.y - 0.098, FZ + 0.17),
    V(0.084, H.y - 0.135, FZ + 0.19)]), P.white, 'flat'));

  // fierce eyes: glowing-gold socket rim so the white reads on black, white almond, pupil, catchlight
  const E = V(0.094, H.y + 0.045, 0);
  S.push(paint(hull(plate([[-0.058, 0.004], [0.058, 0.046], [0.068, -0.014], [0.026, -0.054], [-0.04, -0.05], [-0.06, -0.022]],
    E, FZ - 0.02, FZ + 0.004)), P.lava, 'flat'));
  S.push(paint(hull(plate([[-0.05, 0.0], [0.052, 0.038], [0.06, -0.012], [0.022, -0.046], [-0.034, -0.042], [-0.052, -0.018]],
    E, FZ - 0.01, FZ + 0.012)), P.white, 'flat'));
  S.push(paint(hull(plate([[-0.03, 0.002], [0.018, 0.022], [0.025, -0.01], [0.005, -0.038], [-0.025, -0.036], [-0.036, -0.015]],
    V(E.x - 0.002, E.y, 0), FZ + 0.006, FZ + 0.018)), P.eye, 'flat'));
  S.push(paint(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.014, FZ + 0.022)), P.white, 'flat'));
  // heavy gold armoured brow slanting down to the centre
  S.push(paint(hull([
    V(0.02, E.y + 0.008, FZ + 0.038), V(0.022, E.y + 0.056, FZ + 0.028),
    V(0.17, E.y + 0.058, FZ - 0.008), V(0.17, E.y + 0.104, FZ - 0.025),
    V(0.02, E.y + 0.008, FZ - 0.03), V(0.022, E.y + 0.066, FZ - 0.04),
    V(0.17, E.y + 0.058, FZ - 0.06), V(0.17, E.y + 0.104, FZ - 0.07),
  ]), P.gold, 'y', [E.y, E.y + 0.11]));
  // forehead crest plate with glowing star gem
  C.push(paint(hull([V(0.03, E.y + 0.06, FZ + 0.02), V(-0.03, E.y + 0.06, FZ + 0.02), V(0, E.y + 0.02, FZ + 0.035),
    V(0.05, E.y + 0.13, FZ - 0.03), V(-0.05, E.y + 0.13, FZ - 0.03), V(0, E.y + 0.17, FZ - 0.07),
    V(0.04, E.y + 0.06, FZ - 0.04), V(-0.04, E.y + 0.06, FZ - 0.04), V(0, E.y + 0.15, FZ - 0.1)]), P.gold, 'y', [E.y, E.y + 0.17]));
  C.push(paint(hull([V(0, E.y + 0.13, FZ + 0.0), V(0.022, E.y + 0.1, FZ + 0.005), V(-0.022, E.y + 0.1, FZ + 0.005),
    V(0, E.y + 0.07, FZ + 0.018), V(0, E.y + 0.1, FZ + 0.03), V(0, E.y + 0.1, FZ - 0.02)]), P.goldG, 'flat'));
  // cheek cracks
  crack(S, meshOf(head), [V(0.6, H.y - 0.02, H.z + 0.06), V(0.6, H.y - 0.06, H.z + 0.0), V(0.6, H.y - 0.05, H.z - 0.07),
    V(0.6, H.y - 0.1, H.z - 0.12)], L, 0.009);

  // fiery horns: big pair sweeping back and out + small lower pair
  S.push(paint(tube(curveSamples(
    [V(0.1, H.y + 0.15, H.z - 0.02), V(0.17, H.y + 0.25, H.z - 0.12), V(0.235, H.y + 0.34, H.z - 0.27)],
    5, (t) => 0.062 * (1 - t) + 0.004), { seg: 6, capEnd: 0.0 }), P.fireT, 'len'));
  S.push(paint(hull([...ring(V(0.1, H.y + 0.15, H.z - 0.02), 0.07, 0.07, 6, 'y'), ...ring(V(0.105, H.y + 0.175, H.z - 0.03), 0.065, 0.065, 6, 'y')]),
    P.gold, 'flat')); // gold horn collar
  S.push(paint(tube(curveSamples(
    [V(0.15, H.y + 0.07, H.z - 0.08), V(0.23, H.y + 0.11, H.z - 0.16), V(0.3, H.y + 0.15, H.z - 0.26)],
    4, (t) => 0.04 * (1 - t) + 0.003), { seg: 5 }), P.fireT, 'len'));
  // dark layered frill fins on the head sides
  const fin = (b, tip, h, th, up = V(0, 1, 0)) => hull([
    b.clone().addScaledVector(up, h).add(V(th, 0, 0)), b.clone().addScaledVector(up, h).add(V(-th, 0, 0)),
    b.clone().addScaledVector(up, -h).add(V(th, 0, 0)), b.clone().addScaledVector(up, -h).add(V(-th, 0, 0)),
    b.clone().add(V(th * 1.6, 0, 0.02)), tip,
  ]);
  for (const [b, tip, h] of [
    [V(0.19, H.y - 0.04, H.z - 0.02), V(0.33, H.y - 0.05, H.z - 0.17), 0.045],
    [V(0.17, H.y - 0.11, H.z + 0.02), V(0.28, H.y - 0.19, H.z - 0.1), 0.035],
  ]) S.push(paint(fin(b, tip, h, 0.022), P.spikeS, 'y', [H.y - 0.15, tip.y + 0.12]));
  // head crest spikes (forged: dark base -> molten tip)
  const fspike = (b, d, w, l) => { const g = shard(b, d, w, l); g.computeBoundingBox(); return paint(g, P.spikeS, 'y', [g.boundingBox.min.y, g.boundingBox.max.y]); };
  C.push(fspike(V(0, H.y + 0.13, H.z - 0.1), V(0, 1, -1), 0.034, 0.085));
  C.push(fspike(V(0, H.y + 0.02, H.z - 0.165), V(0, 0.6, -1), 0.032, 0.09));

  // scale the whole head group up 10% about the neck joint
  {
    const HS = 1.1, pv = V(0, H.y - 0.12, H.z);
    const m = new THREE.Matrix4().makeTranslation(pv.x, pv.y, pv.z)
      .multiply(new THREE.Matrix4().makeScale(HS, HS, HS))
      .multiply(new THREE.Matrix4().makeTranslation(-pv.x, -pv.y, -pv.z));
    for (const g of [...C.slice(hC0), ...S.slice(hS0)]) { g.applyMatrix4(m); g.computeVertexNormals(); }
  }
  // ================= HALO (floating, centre line, above head) =================
  {
    const hc = V(0, H.y + 0.35, H.z - 0.01), R = 0.145, N = 14, tilt = 0.3;
    const rot = (p) => { // tilt back around x
      const y = p.y - hc.y, z = p.z - hc.z;
      return V(p.x, hc.y + y * Math.cos(tilt) - z * Math.sin(tilt), hc.z + y * Math.sin(tilt) + z * Math.cos(tilt));
    };
    const sec = (a) => {
      const d = V(Math.cos(a), 0, Math.sin(a));
      return [[-0.017, -0.016], [0.017, -0.016], [0.017, 0.016], [-0.017, 0.016]]
        .map(([r, h]) => rot(V(hc.x + d.x * (R + r), hc.y + h, hc.z + d.z * (R + r))));
    };
    for (let k = 0; k < N; k++) {
      const a0 = (2 * Math.PI * k) / N + Math.PI / N, a1 = (2 * Math.PI * (k + 1)) / N + Math.PI / N;
      C.push(paint(hull([...sec(a0), ...sec(a1)]), P.goldG, 'y', [hc.y - 0.03, hc.y + 0.03]));
    }
    // four star sparkles set into the halo (front, back, sides)
    for (const a of [0, Math.PI / 2, Math.PI, 1.5 * Math.PI]) {
      const c = V(hc.x + Math.cos(a) * (R + 0.002), hc.y, hc.z + Math.sin(a) * (R + 0.002));
      const o = V(Math.cos(a), 0, Math.sin(a)), t = V(-Math.sin(a), 0, Math.cos(a));
      C.push(paint(hull([c.clone().add(V(0, 0.04, 0)), c.clone().add(V(0, -0.04, 0)),
        c.clone().addScaledVector(t, 0.024), c.clone().addScaledVector(t, -0.024),
        c.clone().addScaledVector(o, 0.022), c.clone().addScaledVector(o, -0.022)].map(rot)), P.goldG, 'y', [hc.y - 0.05, hc.y + 0.05]));
    }
  }

  // ================= BACK SPIKES (forged shards) =================
  for (const [y, z, s] of [[0.62, 0.13, 1.1], [0.6, 0.02, 1.35], [0.59, -0.1, 1.3], [0.57, -0.22, 1.1], [0.51, -0.32, 0.85]])
    C.push(fspike(V(0, y, z), V(0, 1, -0.55), 0.055 * s, 0.12 * s));
  // shoulder spikes
  S.push(fspike(V(0.15, 0.53, -0.06), V(0.7, 1, -0.3), 0.05, 0.12));
  S.push(fspike(V(0.14, 0.48, -0.2), V(0.6, 1, -0.6), 0.045, 0.1));

  // ================= TAIL =================
  const tailPts = [V(0, 0.36, -0.32), V(0, 0.23, -0.52), V(0, 0.13, -0.72), V(0, 0.13, -0.92), V(0, 0.25, -1.06), V(0, 0.45, -1.08)];
  const tailG = tube(curveSamples(tailPts, 12, (t) => 0.115 * (1 - t) + 0.026), { seg: 8, axis: X, capEnd: 0.02 });
  C.push(paint(tailG, P.body, 'len'));
  crack(S, meshOf(tailG), [V(0.6, 0.3, -0.45), V(0.6, 0.24, -0.53), V(0.6, 0.22, -0.62), V(0.6, 0.15, -0.7)], L, 0.009);
  const tc = new THREE.CatmullRomCurve3(tailPts, false, 'centripetal');
  const tailFrame = (t) => {
    const p = tc.getPoint(t), T = tc.getTangent(t);
    const n = V(0, T.z, -T.y).normalize(); if (n.y + n.z * 0.3 < 0) n.negate();
    return { p, T, n, r: 0.115 * (1 - t) + 0.026 };
  };
  for (const t of [0.14, 0.3, 0.46, 0.62, 0.78]) {
    const { p, T, n, r } = tailFrame(t), k = 1.15 - t * 0.6;
    C.push(fspike(p.clone().addScaledVector(n, r * 0.75), n.clone().addScaledVector(T, -0.6), 0.045 * k, 0.095 * k));
  }
  // gold armour bands
  for (const t of [0.22, 0.54]) {
    const { p, T, r } = tailFrame(t);
    const B = new THREE.Vector3().crossVectors(T, X).normalize();
    const pts = [];
    for (const sl of [-1, 1]) for (let k = 0; k < 8; k++) {
      const a = Math.PI / 8 + k * Math.PI / 4;
      pts.push(p.clone().addScaledVector(T, sl * 0.022).addScaledVector(X, Math.cos(a) * r * 1.12).addScaledVector(B, Math.sin(a) * r * 1.12));
    }
    C.push(paint(hull(pts), P.gold, 'y'));
  }
  // flame spade tip (glowing)
  const tip = tc.getPoint(1), tT = tc.getTangent(1);
  C.push(paint(hull([tip.clone().addScaledVector(tT, 0.24), tip.clone().addScaledVector(tT, -0.02),
    V(0.1, tip.y + 0.05, tip.z), V(-0.1, tip.y + 0.05, tip.z),
    V(0, tip.y + 0.05, tip.z - 0.035), V(0, tip.y + 0.05, tip.z + 0.035)]), P.lava, 'y', [tip.y, tip.y + 0.26]));
  S.push(paint(shard(V(0.06, tip.y + 0.06, tip.z), V(1, 0.5, 0), 0.032, 0.11), P.fireT, 'flat'));
  C.push(paint(shard(V(0, tip.y + 0.04, tip.z - 0.02), V(0, 0.2, -1), 0.03, 0.1), P.fireT, 'flat'));

  // ================= WINGS (gold bones, starfield membranes, fiery trailing edge) =================
  const Sh = V(0.13, 0.57, 0.0), El = V(0.36, 0.86, -0.08), Wr = V(0.5, 1.2, -0.15);
  const tips = [V(1.1, 0.76, -0.32), V(0.94, 0.32, -0.38), V(0.58, 0.24, -0.34)];
  const Bd = V(0.14, 0.52, -0.22);
  S.push(paint(tube(curveSamples([Sh, El, Wr], 6, (t) => 0.064 - 0.022 * t), { seg: 6, capEnd: 0.02 }), P.gold, 'y', [0.4, 1.25]));
  S.push(paint(hull(cbox(Wr, 0.055, 0.055, 0.055, 0.02)), P.goldDk, 'y', [1.1, 1.26]));
  S.push(paint(hull(cbox(El, 0.05, 0.05, 0.05, 0.018)), P.goldDk, 'y', [0.8, 0.92]));
  tips.forEach((T) => {
    S.push(paint(tube(curveSamples([Wr, Wr.clone().lerp(T, 0.5).add(V(0, 0.03, 0)), T], 4, (t) => 0.032 * (1 - t) + 0.015),
      { seg: 5, capEnd: 0.0 }), P.gold, 'y', [0.2, 1.25]));
  });
  // wrist claw + radiant gold leading-edge blades
  S.push(gold(shard(Wr.clone().add(V(0, 0.03, 0.02)), V(-0.1, 1, 0.5), 0.038, 0.11)));
  for (const t of [0.35, 0.7]) {
    const p = Sh.clone().lerp(El, 1).lerp(Wr, t);
    S.push(gold(shard(p.clone().add(V(0, 0.02, 0.02)), V(-0.3, 1, 0.6), 0.03, 0.08)));
  }
  // membranes
  const th = 0.006;
  const membUV = (x, y) => [Math.abs(x) * 0.9, 1 - (y - 0.22) / 0.98];
  const panel = (a, b, c) => {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const pts = [];
    for (const p of [a, b, c]) { pts.push(p.clone().addScaledVector(n, th)); pts.push(p.clone().addScaledVector(n, -th)); }
    S.push(paintProj(hull(pts), P.memb, (x, y) => membUV(x, y)));
  };
  const back = V(0, 0, -0.002);
  const W0 = Wr.clone().add(back);
  const edge = [tips[0], tips[1], tips[2], Bd];
  const flames = [];
  for (let i = 0; i < edge.length - 1; i++) {
    const a = edge[i].clone().add(back), b = edge[i + 1].clone().add(back);
    const m = a.clone().lerp(b, 0.5).lerp(Wr, 0.2).add(V(0, 0, -0.015));
    const mi = W0.clone().lerp(m, 0.5).add(V(0, 0, 0.012));
    panel(W0, a, mi); panel(a, m, mi); panel(mi, m, b); panel(W0, mi, b);
    if (i < 2) flames.push([a, m], [m, b]);
  }
  panel(W0, Bd.clone().add(back), El.clone().add(back));
  panel(El.clone().add(back), Bd.clone().add(back), Sh.clone().add(back));
  // fiery flame tongues hanging off the scalloped trailing edge
  for (const [a, b] of flames) {
    const mid = a.clone().lerp(b, 0.5);
    const outD = mid.clone().sub(Wr); outD.z = 0; outD.normalize();
    const along = b.clone().sub(a); const L2 = along.length(); along.normalize();
    for (const [f, len] of [[0.28, 0.1], [0.68, 0.075]]) {
      const base = a.clone().addScaledVector(along, L2 * f);
      const tipP = base.clone().addScaledVector(outD, len).addScaledVector(along, 0.04);
      const nrm = new THREE.Vector3().crossVectors(along, outD).normalize();
      S.push(paint(hull([
        base.clone().addScaledVector(along, -0.045).addScaledVector(outD, -0.02).addScaledVector(nrm, 0.009),
        base.clone().addScaledVector(along, -0.045).addScaledVector(outD, -0.02).addScaledVector(nrm, -0.009),
        base.clone().addScaledVector(along, 0.045).addScaledVector(outD, -0.02).addScaledVector(nrm, 0.009),
        base.clone().addScaledVector(along, 0.045).addScaledVector(outD, -0.02).addScaledVector(nrm, -0.009),
        tipP,
      ]), P.lava, 'y', [tipP.y - 0.02, base.y + 0.03]));
    }
  }

  return assemble(C, S);
}

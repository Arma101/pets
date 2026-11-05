// Kraken KO (Celestial): magenta brawler kraken. Big faceted mantle standing on six splayed, curl-tipped
// tentacles, a raised pair of curled "fist" tentacles in boxer guard, glowing eyes under a heavy brow,
// cyan glowing markings, coral growths, pearls, and a floating gold halo-crown.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  skin:   { i: 0, top: '#FF6FD2', bot: '#A40F78' },   // glossy magenta mantle
  skinT:  { i: 1, top: '#F0389F', bot: '#FF8AD8' },   // tentacles (base darker -> lighter tips)
  brow:   { i: 2, top: '#C81E8C', bot: '#7A0A55' },
  sucker: { i: 3, top: '#FFD0EA', bot: '#FF9CCB' },
  suckIn: { i: 4, top: '#F06AAE', bot: '#D44A92' },
  eyeGlow:{ i: 5, top: '#FFFBC8', bot: '#FFD84A', glow: true },
  pupil:  { i: 6, top: '#2A0A24', bot: '#12040F' },
  white:  { i: 7, top: '#FFFFFF', bot: '#F4F4F8' },
  rune:   { i: 8, top: '#B8FBFF', bot: '#3FD8FF', glow: true },
  gold:   { i: 9, top: '#FFE27A', bot: '#E09A00' },
  pearl:  { i: 10, top: '#FFFFFF', bot: '#FFDDF3' },
  coral:  { i: 11, top: '#FF8FA8', bot: '#E8506E' },
  mouth:  { i: 12, top: '#5A0A3E', bot: '#3A0628' },
  band:   { i: 14, top: '#FFE680', bot: '#E8A817' },
};
const P = PALETTE;

// ---------- local helpers ----------
// ray / mesh intersection (Moller-Trumbore) -> { p, n } nearest hit
function raycast(geo, o, d) {
  const pos = geo.attributes.position;
  const a = V(0, 0, 0), b = V(0, 0, 0), c = V(0, 0, 0), e1 = V(0, 0, 0), e2 = V(0, 0, 0);
  let best = null;
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
    e1.subVectors(b, a); e2.subVectors(c, a);
    const h = new THREE.Vector3().crossVectors(d, e2), det = e1.dot(h);
    if (Math.abs(det) < 1e-9) continue;
    const f = 1 / det, s = new THREE.Vector3().subVectors(o, a), u = f * s.dot(h);
    if (u < 0 || u > 1) continue;
    const q = new THREE.Vector3().crossVectors(s, e1), v = f * d.dot(q);
    if (v < 0 || u + v > 1) continue;
    const t = f * e2.dot(q);
    if (t > 1e-5 && (!best || t < best.t)) {
      const n = new THREE.Vector3().crossVectors(e1, e2).normalize();
      if (n.dot(d) < 0) n.negate();
      best = { t, p: o.clone().addScaledVector(d, t), n };
    }
  }
  return best;
}

export function buildGeometry() {
  const C = [], S = [];
  const UP = V(0, 1, 0);

  // ================= MANTLE (big faceted head) =================
  const mantlePts = [
    ...ring(V(0, 0.22, 0.0), 0.15, 0.14, 10, 'y', Math.PI / 10),
    ...ring(V(0, 0.32, 0.01), 0.27, 0.25, 10, 'y', Math.PI / 10),
    ...ring(V(0, 0.48, 0.0), 0.33, 0.29, 10, 'y', Math.PI / 10),
    ...ring(V(0, 0.64, -0.03), 0.32, 0.28, 10, 'y', Math.PI / 10),
    ...ring(V(0, 0.79, -0.07), 0.26, 0.23, 10, 'y', Math.PI / 10),
    ...ring(V(0, 0.9, -0.1), 0.16, 0.14, 10, 'y', Math.PI / 10),
    ...ring(V(0, 0.955, -0.11), 0.06, 0.055, 10, 'y', Math.PI / 10),
    ...cbox(V(0, 0.5, 0.11), 0.23, 0.13, 0.2, 0.06),                  // flat face plate
  ];
  const mantle = hull(mantlePts);
  C.push(paint(mantle, P.skin, 'y', [0.2, 0.96]));
  const FZ = 0.31; // face plane
  const MC = V(0, 0.55, -0.03); // mantle centre for surface rays

  // decal: convex patch hugging the mantle surface. poly2d in a tangent frame at direction dir from MC
  const decal = (dir, poly2d, sw, h = 0.007, mode = 'flat') => {
    const hit = raycast(mantle, MC, dir.clone().normalize());
    const n = hit.n;
    const u = new THREE.Vector3().crossVectors(UP, n);
    if (u.lengthSq() < 1e-6) u.set(1, 0, 0);
    u.normalize();
    const v = new THREE.Vector3().crossVectors(n, u).normalize();
    const pts = [];
    const cx = poly2d.reduce((s, q) => s + q[0], 0) / poly2d.length, cy = poly2d.reduce((s, q) => s + q[1], 0) / poly2d.length;
    const samp = [];
    for (let i = 0; i < poly2d.length; i++) {
      const [a0, b0] = poly2d[i], [a1, b1] = poly2d[(i + 1) % poly2d.length];
      for (const f of [0, 0.5]) for (const g of [1, 0.5]) {
        const a = a0 + (a1 - a0) * f, b = b0 + (b1 - b0) * f;
        samp.push([cx + (a - cx) * g, cy + (b - cy) * g, g === 1]);
      }
    }
    samp.push([cx, cy, false]);
    for (const [a, b, edge] of samp) {
      const q = hit.p.clone().addScaledVector(u, a).addScaledVector(v, b);
      const hh = raycast(mantle, MC, q.clone().sub(MC).normalize());
      pts.push(hh.p.clone().addScaledVector(n, h));
      if (edge) pts.push(hh.p.clone().addScaledVector(n, -0.02));
    }
    return paint(hull(pts), sw, mode);
  };

  // ================= TENTACLES =================
  // planar tentacle in the plane (d, up) from root; prof = [[u, v], ...]; returns tube + sucker list
  const tentacle = (root, d, prof, n, rf, sw, suckFrom = 0.3, suckSkip = 1, suckDownOk = false) => {
    d = d.clone().normalize();
    const side = new THREE.Vector3().crossVectors(d, UP).normalize();
    const P3 = (u, v) => root.clone().addScaledVector(d, u).addScaledVector(UP, v);
    const sm = curveSamples(prof.map(([u, v]) => P3(u, v)), n, rf);
    const t = tube(sm, { seg: 7, axis: side, capStart: 0, capEnd: 0.012, phase: Math.PI / 2 });
    S.push(paint(t, sw, 'len'));
    // suckers along the underside (convex outer side of the curl)
    for (let i = 1; i < n - 1; i += suckSkip) {
      const tt = i / (n - 1);
      if (tt < suckFrom) continue;
      const T = new THREE.Vector3().subVectors(sm[i + 1].p, sm[i - 1].p).normalize();
      const tu = T.dot(d), tv = T.dot(UP);
      const N = d.clone().multiplyScalar(tv).addScaledVector(UP, -tu).normalize();
      if (!suckDownOk && N.y < -0.55) continue;
      if (sm[i].rx < 0.03) continue;
      sucker(sm[i].p, T, N, sm[i].rx);
    }
    return sm;
  };
  function sucker(c0, T, N, r) {
    {
      const sr = Math.max(0.013, r * 0.5);
      const B = new THREE.Vector3().crossVectors(N, T).normalize();
      const disc = [], cup = [];
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        const w = T.clone().multiplyScalar(Math.cos(a)).addScaledVector(B, Math.sin(a));
        disc.push(c0.clone().addScaledVector(w, sr).addScaledVector(N, r * 0.55));
        disc.push(c0.clone().addScaledVector(w, sr * 0.92).addScaledVector(N, r + 0.007));
        cup.push(c0.clone().addScaledVector(w, sr * 0.5).addScaledVector(N, r + 0.011));
        cup.push(c0.clone().addScaledVector(w, sr * 0.5).addScaledVector(N, r + 0.002));
      }
      S.push(paint(hull(disc), P.sucker, 'flat'));
      S.push(paint(hull(cup), P.suckIn, 'flat'));
    }
  }

  // three planted pairs: splayed out, resting on the ground, tips curling up and back
  const legProf = (s) => [[0.0, 0.3], [0.13 * s, 0.17], [0.25 * s, 0.065], [0.37 * s, 0.05], [0.46 * s, 0.08],
    [0.51 * s, 0.15], [0.48 * s, 0.215], [0.425 * s, 0.205], [0.42 * s, 0.16]];
  const legR = (t) => Math.max(0.016, 0.085 * (1 - t) + 0.012) * (t > 0.9 ? 1 - (t - 0.9) * 4 : 1);
  for (const [az, s] of [[0.75, 0.95], [1.6, 1.0], [2.45, 0.92]]) {
    const d = V(Math.sin(az), 0, Math.cos(az));
    tentacle(V(0, 0, 0).addScaledVector(d, 0.1).setY(0), d, legProf(s), 11, legR, P.skinT, 0.45);
  }

  // raised fist pair: forward from the lower face sides, tips curled into a chunky boxer fist
  {
    // arm reaches forward, then the tip curls up and inward (loop in the x-y plane) into a chunky fist
    const LC = V(0.29, 0.37, 0.34); // loop centre
    const loop = [[0.04, -0.025], [0.06, 0.035], [0.01, 0.075], [-0.05, 0.05], [-0.06, -0.015], [-0.02, -0.045], [0.015, -0.025], [0.02, 0.0]]
      .map(([x, y], i) => V(LC.x + x, LC.y + y, LC.z + 0.005 * (4 - i)));
    const pts = [V(0.14, 0.29, 0.06), V(0.25, 0.25, 0.18), V(0.33, 0.27, 0.29), ...loop.slice(1)];
    const n = 16;
    const rf = (t) => (0.08 - 0.045 * t) * (t > 0.88 ? 1 - (t - 0.88) * 3.5 : 1);
    const sm = curveSamples(pts, n, rf);
    S.push(paint(tube(sm, { seg: 7, ref: V(-0.45, 0, 0.89), capEnd: 0.012, phase: Math.PI / 2 }), P.skinT, 'len'));
    for (let i = 4; i < n - 2; i++) {
      const T = new THREE.Vector3().subVectors(sm[i + 1].p, sm[i - 1].p).normalize();
      const N = sm[i].p.clone().sub(LC); N.addScaledVector(T, -N.dot(T)).normalize();
      sucker(sm[i].p, T, N, sm[i].rx);
    }
    // forward-facing suckers on the knuckle face
    // gold wrist wrap (boxing tape) around the arm before the curl
    const w = sm[3];
    const T = new THREE.Vector3().subVectors(sm[4].p, sm[2].p).normalize();
    const B1 = new THREE.Vector3().crossVectors(T, V(0, 1, 0)).normalize();
    const B2 = new THREE.Vector3().crossVectors(B1, T).normalize();
    const wrap = [];
    for (const off of [-0.025, 0.025]) for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
      wrap.push(w.p.clone().addScaledVector(T, off).addScaledVector(B1, Math.cos(a) * (w.rx + 0.012)).addScaledVector(B2, Math.sin(a) * (w.rx + 0.012)));
    }
    S.push(paint(hull(wrap), P.band, 'flat'));
  }

  // ================= FACE =================
  // glowing almond eyes with angry flat top, dark pupil, catchlight
  const E = V(0.108, 0.55, 0);
  const k = 1.35;
  const sc = (pts) => pts.map(([a, b]) => [a * k, b * k]);
  S.push(paint(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.01, FZ + 0.012)), P.eyeGlow, 'y'));
  S.push(paint(hull(plate(sc([[-0.026, 0.004], [0.012, 0.018], [0.02, -0.008], [0.004, -0.03], [-0.02, -0.028], [-0.03, -0.012]]),
    V(E.x - 0.008, E.y - 0.002, 0), FZ + 0.006, FZ + 0.019)), P.pupil, 'flat'));
  S.push(paint(hull(plate([[-0.009, -0.009], [0.009, -0.009], [0.009, 0.009], [-0.009, 0.009]],
    V(E.x + 0.002, E.y + 0.006, 0), FZ + 0.015, FZ + 0.023)), P.white, 'flat'));
  // heavy brow ridge slanting down toward the centre
  S.push(paint(hull([
    V(0.03, E.y + 0.02, FZ + 0.04), V(0.032, E.y + 0.07, FZ + 0.03),
    V(0.2, E.y + 0.07, FZ - 0.005), V(0.2, E.y + 0.12, FZ - 0.025),
    V(0.03, E.y + 0.02, FZ - 0.04), V(0.032, E.y + 0.08, FZ - 0.05),
    V(0.2, E.y + 0.07, FZ - 0.07), V(0.2, E.y + 0.12, FZ - 0.08),
  ]), P.brow, 'y'));
  // determined mouth: short slanted frown below the eyes
  S.push(paint(hull([V(0, 0.425, FZ + 0.004), V(0, 0.44, FZ + 0.004), V(0.055, 0.415, FZ + 0.004), V(0.055, 0.428, FZ + 0.004),
    V(0, 0.425, FZ - 0.01), V(0, 0.44, FZ - 0.01), V(0.055, 0.415, FZ - 0.01), V(0.055, 0.428, FZ - 0.01)]), P.mouth, 'flat'));

  // ================= GLOWING MARKINGS =================
  // forehead diamond + row of diamonds over the dome
  C.push(decal(V(0, 0.55, 0.62), [[0, 0.06], [0.04, 0], [0, -0.045], [-0.04, 0]], P.rune, 0.009));
  C.push(decal(V(0, 0.95, 0.3), [[0, 0.045], [0.03, 0], [0, -0.045], [-0.03, 0]], P.rune));
  C.push(decal(V(0, 1, -0.25), [[0, 0.04], [0.026, 0], [0, -0.04], [-0.026, 0]], P.rune));
  // side swooshes: slanted bars sweeping back
  // blue-ringed-octopus style glowing hex spots on the sides and back
  const hex = (r) => Array.from({ length: 6 }, (_, k) => [Math.cos(k * Math.PI / 3) * r, Math.sin(k * Math.PI / 3) * r]);
  for (const [dir, r] of [[V(0.8, 0.45, 0.2), 0.038], [V(0.95, 0.05, 0.1), 0.045], [V(0.85, 0.1, -0.5), 0.04],
    [V(0.6, 0.65, -0.45), 0.034], [V(0.75, -0.2, -0.25), 0.03], [V(0.85, 0.75, -0.05), 0.026], [V(0.35, 0.05, -1), 0.034]]) {
    S.push(decal(dir, hex(r), P.rune, 0.009));
  }
  C.push(decal(V(0, 0.3, -1), [[0, 0.07], [0.05, 0], [0, -0.07], [-0.05, 0]], P.rune, 0.009));

  // faceted pearl: white on top, pink/lavender sheen underneath
  const pearl = (c, r) => paint(hull([
    V(c.x, c.y + r, c.z), V(c.x, c.y - r, c.z),
    ...ring(V(c.x, c.y + r * 0.55, c.z), r * 0.835, r * 0.835, 8, 'y', Math.PI / 8),
    ...ring(V(c.x, c.y, c.z), r, r, 8, 'y', 0),
    ...ring(V(c.x, c.y - r * 0.55, c.z), r * 0.835, r * 0.835, 8, 'y', Math.PI / 8),
  ]), P.pearl, 'y', [c.y - r, c.y + r]);

  // ================= CORAL (bushy clusters low on the back sides of the mantle) =================
  const coralCluster = (dir, scale, branches) => {
    const hit = raycast(mantle, MC, dir.clone().normalize());
    const n = hit.n, side = new THREE.Vector3().crossVectors(UP, n).normalize();
    const base = hit.p.clone().addScaledVector(n, -0.02);
    const trunkEnd = hit.p.clone().addScaledVector(n, 0.06 * scale).addScaledVector(UP, 0.03 * scale);
    S.push(paint(tube(curveSamples([base, hit.p.clone().addScaledVector(n, 0.03 * scale), trunkEnd], 3, (t) => 0.042 * scale * (1 - 0.25 * t)),
      { seg: 6, capEnd: 0.02 }), P.coral, 'len'));
    for (const [a, b, c, len] of branches) {
      const dd = n.clone().multiplyScalar(a).addScaledVector(UP, b).addScaledVector(side, c).normalize();
      const mid = trunkEnd.clone().addScaledVector(dd, len * 0.5 * scale).addScaledVector(UP, 0.02 * scale);
      const tip = trunkEnd.clone().addScaledVector(dd, len * scale).addScaledVector(UP, 0.035 * scale);
      const r0 = 0.026 * scale;
      S.push(paint(tube(curveSamples([trunkEnd, mid, tip], 3, (t) => r0 * (1 - 0.3 * t)), { seg: 6, capEnd: 0.01 }), P.coral, 'len'));
      S.push(paint(blob(0, tip, V(r0 * 1.25, r0 * 1.25, r0 * 1.25)), P.coral, 'y'));
    }
    return trunkEnd;
  };
  coralCluster(V(0.75, -0.25, -0.6), 1.35, [[0.4, 1, 0.1, 0.11], [0.8, 0.5, 0.6, 0.1], [0.8, 0.45, -0.6, 0.1], [1, 0.1, 0.05, 0.09], [0.5, 0.9, -0.35, 0.08]]);
  coralCluster(V(0.3, -0.5, -0.85), 1.0, [[0.4, 1, 0.3, 0.1], [0.9, 0.4, -0.5, 0.09], [1, 0.2, 0.5, 0.08]]);
  S.push(pearl(V(0.27, 0.45, -0.25), 0.045));

  // ================= FLOATING CROWN (shaded gold, just above the dome) =================
  const HY = 1.025, HR = 0.215, hz = -0.08;
  for (let i = 0; i < 12; i++) {
    const a0 = (i / 12) * Math.PI * 2, a1 = ((i + 1) / 12) * Math.PI * 2;
    const pts = [];
    for (const a of [a0, a1]) for (const [dr, dy] of [[-0.036, -0.03], [0.036, -0.03], [-0.028, 0.034], [0.028, 0.034]]) {
      pts.push(V(Math.cos(a) * (HR + dr), HY + dy, hz + Math.sin(a) * (HR + dr)));
    }
    C.push(paint(hull(pts), P.gold, 'y', [HY - 0.03, HY + 0.034]));
  }
  // crown points with pearl tips: centre front + back, mirrored pairs
  const point = (a, h, arr) => {
    const bp = V(Math.cos(a) * HR, HY + 0.02, hz + Math.sin(a) * HR);
    arr.push(paint(shard(bp, V(0, 1, 0), 0.05, h, 4, 0.75), P.gold, 'y', [HY, HY + h + 0.02]));
    arr.push(pearl(bp.clone().add(V(0, h + 0.022, 0)), 0.032));
  };
  point(Math.PI / 2, 0.12, C);
  point(-Math.PI / 2, 0.075, C);
  point(Math.PI / 2 - 0.9, 0.09, S);
  point(Math.PI / 2 - 1.95, 0.075, S);
  // glowing cyan gem set in the front of the band
  {
    const g = V(0, HY + 0.002, hz + HR + 0.036);
    C.push(paint(hull([g.clone().add(V(0, 0.046, -0.014)), g.clone().add(V(0, -0.042, -0.014)), g.clone().add(V(0.034, 0, -0.014)),
      g.clone().add(V(-0.034, 0, -0.014)), g.clone().add(V(0, 0, 0.016)), g.clone().add(V(0, 0, -0.03))]), P.rune, 'flat'));
  }

  return assemble(C, S);
}

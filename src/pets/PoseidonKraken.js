// Poseidon Kraken (DIVINE): teal kraken king on splayed tentacles, gold crown + floating halo,
// glowing gold armour, centre-line trident gripped by a mirrored pair of arms, radiant aura rays, coral & pearls.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// glossy wet gradient: colour stops with a bright specular band (stop 3) baked in
function gloss(stops) {
  return (g, x, y) => {
    const grad = g.createLinearGradient(0, y + 16, 0, y + 112);
    const at = [0, 0.22, 0.3, 0.4, 0.75, 1];
    stops.forEach((c, k) => grad.addColorStop(at[k], c));
    g.fillStyle = stops[0]; g.fillRect(x, y, 128, 16);
    g.fillStyle = grad; g.fillRect(x, y + 16, 128, 96);
    g.fillStyle = stops[stops.length - 1]; g.fillRect(x, y + 112, 128, 16);
  };
}

export const PALETTE = {
  teal:     { i: 0, top: '#5FF0E0', bot: '#0F8A93', draw: gloss(['#8FFFF2', '#3FDCD2', '#C8FFF8', '#27BDBB', '#1597A0', '#0E8090']) },
  tealDk:   { i: 1, top: '#2BB8B4', bot: '#0B5E6E' },
  tent:     { i: 2, top: '#2FCFC6', bot: '#9FFFF0', draw: gloss(['#24BDB8', '#3AD8CF', '#B8FFF5', '#5EE8DC', '#8CF8EC', '#A8FFF2']) },
  white:    { i: 3, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:      { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  gold:     { i: 5, top: '#FFE680', bot: '#EFA500' },
  goldDk:   { i: 6, top: '#FFD24A', bot: '#C98200' },
  pearl:    { i: 7, top: '#FFFFFF', bot: '#E8DDF0' },
  coral:    { i: 8, top: '#FFB27A', bot: '#FF5A6E' },
  aura:     { i: 9, top: '#9FF7FF', bot: '#1CC6F5', glow: true },
  brow:     { i: 10, top: '#1EA7A6', bot: '#0B5E6E' },
  mouth:    { i: 11, top: '#0B3E48', bot: '#06272E' },
  sucker:   { i: 12, top: '#C8FFF4', bot: '#8AE6DA' },
  halo:     { i: 13, top: '#FFEB8A', bot: '#E8A200', glow: true },
};
const SW = PALETTE;

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const sub = (a, b) => a.clone().sub(b);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);

// flat blade prism (from the griffin)
function blade(base, dir, n, L, w, th = 0.016, shape = null) {
  const d = nrm(dir);
  const nn = nrm(add(n, d, -n.dot(d)));
  const v = nrm(cross(nn, d));
  const pts2 = shape || [[0, -0.3], [0, 0.3], [0.2, 0.5], [0.8, 0.5], [1, 0.05], [0.8, -0.5], [0.2, -0.5]];
  const pts = [];
  for (const [u, s] of pts2) {
    const p = add(add(base, d, u * L), v, s * w);
    const t = th * (u > 0.9 ? 0.6 : 1);
    pts.push(add(p, nn, t / 2), add(p, nn, -t / 2));
  }
  return hull(pts);
}

// ring of n points around point p perpendicular to tangent T
function perpRing(p, T, r, n = 8, phase = 0) {
  const t = nrm(T);
  const up = Math.abs(t.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
  const a = nrm(cross(t, up)), b = nrm(cross(a, t));
  const out = [];
  for (let k = 0; k < n; k++) {
    const th = phase + (2 * Math.PI * k) / n;
    out.push(add(add(p, a, Math.cos(th) * r), b, Math.sin(th) * r));
  }
  return out;
}

// colour a part by distance from a centre point (t=0 near c, 1 at distance r1)
function radial(g, sw, c, r0, r1) {
  const p = g.attributes.position, uv = [];
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  for (let k = 0; k < p.count; k++) {
    const d = Math.hypot(p.getX(k) - c.x, p.getY(k) - c.y, p.getZ(k) - c.z);
    const t = Math.min(1, Math.max(0, (d - r0) / (r1 - r0)));
    uv.push((x + 64) / 1024, (y + 16 + t * 96) / 1024);
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

export function buildGeometry() {
  const C = [], S = [];
  const gold = (g) => paint(g, SW.gold, 'y');
  const goldF = (g) => paint(g, SW.gold, 'flat');
  const goldDk = (g) => paint(g, SW.goldDk, 'y');
  const pearl = (c, r) => paint(blob(0, c, V(r, r, r)), SW.pearl, 'y');

  // ================= MANTLE / HEAD (big faceted teal dome, tilted back) =================
  const FZ = 0.29; // face plane
  C.push(paint(hull([
    ...ring(V(0, 0.29, 0.0), 0.16, 0.16, 12, 'y', 0),
    ...ring(V(0, 0.42, 0.03), 0.25, 0.24, 12, 'y', 0),
    ...ring(V(0, 0.56, 0.03), 0.275, 0.262, 12, 'y', 0),
    ...ring(V(0, 0.7, 0.0), 0.265, 0.25, 12, 'y', 0),
    ...ring(V(0, 0.84, -0.05), 0.24, 0.225, 12, 'y', 0),
    ...ring(V(0, 0.97, -0.1), 0.2, 0.19, 10, 'y', 0),
    ...ring(V(0, 1.07, -0.14), 0.13, 0.12, 8, 'y', Math.PI / 8),
    V(0, 1.12, -0.16),
    ...cbox(V(0, 0.53, 0.2), 0.23, 0.11, 0.09, 0.06),
  ]), SW.teal, 'y', [0.3, 1.08]));

  // ================= TENTACLES (8 planted, splayed, curling tips) =================
  const tentacle = (azDeg, reach, lift) => {
    const a = (azDeg * Math.PI) / 180;
    const dir = V(Math.sin(a), 0, Math.cos(a));
    const P = (r, y) => V(dir.x * r, y, dir.z * r);
    const pts = [P(0.08, 0.36), P(0.17, 0.24), P(0.27 * reach, 0.1), P(0.37 * reach, 0.045), P(0.46 * reach, 0.04),
      P(0.53 * reach, 0.08 + lift), P(0.54 * reach, 0.15 + lift), P(0.49 * reach, 0.16 + lift)];
    const smp = curveSamples(pts, 10, (t) => 0.086 * (1 - t) + 0.008, (t) => 0.072 * (1 - t) + 0.008);
    S.push(paint(tube(smp, { seg: 6, ref: V(0, 1, 0), capEnd: 0.012, phase: Math.PI / 6 }), SW.tent, 'len'));
    // gold band near the root
    const i = 2, s = smp[i];
    const T = sub(smp[i + 1].p, smp[i - 1].p);
    const r0 = Math.max(s.rx, s.ry) + 0.012;
    // suckers on the inside of the curled tip
    for (const j of [5, 6, 7]) {
      const q = smp[j], Tj = sub(smp[j + 1].p, smp[j - 1].p);
      const inward = nrm(sub(add(smp[j + 1].p, smp[j - 1].p).multiplyScalar(0.5), q.p));
      const rr = Math.min(q.rx, q.ry);
      const c = add(q.p, inward, rr * 0.85);
      S.push(paint(hull([...perpRing(c, inward, rr * 0.5, 6), ...perpRing(add(c, inward, 0.012), inward, rr * 0.38, 6)]), SW.sucker, 'flat'));
    }
    S.push(goldDk(hull([...perpRing(add(s.p, nrm(T), -0.018), T, r0, 8), ...perpRing(add(s.p, nrm(T), 0.018), T, r0, 8)])));
  };
  tentacle(28, 1.0, 0.0);
  tentacle(70, 1.05, 0.01);
  tentacle(112, 1.0, 0.0);
  tentacle(152, 0.95, 0.01);

  // ================= FACE =================
  const E = V(0.12, 0.555, 0), es = 1.85;
  const sc = (arr) => arr.map(([u, v]) => [u * es, v * es]);
  S.push(paint(hull(plate(sc([[-0.036, 0.0], [0.044, 0.03], [0.05, -0.008], [0.02, -0.036], [-0.026, -0.032], [-0.04, -0.016]]),
    E, FZ - 0.012, FZ + 0.008, 0.35)), SW.white, 'flat'));
  S.push(paint(hull(plate(sc([[-0.026, 0.0], [0.014, 0.017], [0.022, -0.008], [0.006, -0.03], [-0.02, -0.028], [-0.03, -0.012]]),
    V(E.x - 0.005, E.y, 0), FZ + 0.0, FZ + 0.014, 0.35)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.009, -0.009], [0.009, -0.009], [0.009, 0.009], [-0.009, 0.009]],
    V(E.x + 0.006, E.y + 0.003, 0), FZ + 0.006, FZ + 0.019, 0.35)), SW.white, 'flat'));
  // heavy brow
  S.push(paint(hull([
    V(0.03, E.y + 0.014, FZ + 0.035), V(0.032, E.y + 0.06, FZ + 0.025),
    V(0.215, E.y + 0.085, FZ - 0.05), V(0.215, E.y + 0.13, FZ - 0.065),
    V(0.03, E.y + 0.014, FZ - 0.03), V(0.032, E.y + 0.07, FZ - 0.04),
    V(0.215, E.y + 0.085, FZ - 0.12), V(0.215, E.y + 0.13, FZ - 0.13),
  ]), SW.brow, 'y'));
  // stern mouth slit
  C.push(paint(hull(cbox(V(0, 0.455, FZ + 0.002), 0.045, 0.008, 0.008, 0.003)), SW.mouth, 'flat'));

  // ================= GOLD ARMOUR =================
  // forehead plate between brow and crown, with a pearl
  C.push(gold(hull([...plate([[-0.08, 0.0], [0.08, 0.0], [0.05, 0.09], [0, 0.12], [-0.05, 0.09]], V(0, 0.665, 0), 0.215, 0.27)])));
  C.push(pearl(V(0, 0.715, 0.272), 0.022));
  // chest gorget: curved plate hugging the mantle front below the mouth
  {
    const pts = [];
    for (let k = -3; k <= 3; k++) {
      const an = (k / 3) * 0.95;
      const dir = V(Math.sin(an), 0, Math.cos(an));
      pts.push(add(V(0, 0.42, 0.03), dir, 0.275));
      if (Math.abs(k) <= 2) pts.push(add(V(0, 0.36, 0.03), dir, 0.255 - 0.0 * Math.abs(k)));
    }
    pts.push(V(0, 0.315, 0.27), V(0, 0.42, 0.1), V(0, 0.34, 0.1));
    C.push(gold(hull(pts)));
  }
  C.push(pearl(V(0, 0.37, 0.287), 0.024));
  // gold collar ring where the mantle meets the tentacles
  C.push(gold(hull([...ring(V(0, 0.285, 0.02), 0.2, 0.2, 12, 'y'), ...ring(V(0, 0.335, 0.02), 0.235, 0.235, 12, 'y')])));
  // back armour plate with pearl
  C.push(gold(hull(plate([[-0.13, 0.1], [0.13, 0.1], [0.15, -0.04], [0, -0.15], [-0.15, -0.04]], V(0, 0.55, 0), -0.265, -0.2))));
  C.push(pearl(V(0, 0.56, -0.272), 0.026));
  // pauldrons (layered shell plates on the shoulders)
  S.push(gold(hull([...ring(V(0.25, 0.52, 0.0), 0.15, 0.13, 8, 'x'), ...ring(V(0.31, 0.53, 0.0), 0.12, 0.1, 8, 'x'), V(0.34, 0.54, 0.0)])));
  S.push(goldDk(hull([...ring(V(0.24, 0.43, 0.0), 0.12, 0.08, 8, 'x'), ...ring(V(0.3, 0.41, 0.0), 0.1, 0.06, 8, 'x')])));
  S.push(pearl(V(0.345, 0.545, 0.0), 0.026));

  // coral sprigs on the shoulders
  const branch = (pts, r) => S.push(paint(tube(curveSamples(pts, 4, (t) => r * (1 - 0.45 * t)), { seg: 5, capEnd: r * 0.6, phase: 0.3 }), SW.coral, 'len'));
  const coral = (base, up, side) => {
    const top = add(base, up, 0.25), mid = add(base, up, 0.1);
    branch([base, mid, top], 0.034);
    branch([mid, add(mid, side, 0.08), add(add(mid, side, 0.11), up, 0.1)], 0.025);
    const m2 = add(base, up, 0.16);
    branch([m2, add(m2, side, -0.07), add(add(m2, side, -0.09), up, 0.09)], 0.022);
    S.push(paint(blob(0, top, V(0.03, 0.03, 0.03)), SW.coral, 'flat'));
  };
  coral(V(0.24, 0.6, -0.1), nrm(V(0.45, 1, -0.25)), nrm(V(0.6, -0.2, 0.5)));

  // ================= CROWN (worn) =================
  const CY = 0.86, CZ = -0.07;
  C.push(gold(hull([...ring(V(0, CY - 0.02, CZ), 0.245, 0.232, 12, 'y'), ...ring(V(0, CY + 0.05, CZ), 0.25, 0.236, 12, 'y')])));
  const pts = [[0, 0.15], [0.35, 0.11], [0.7, 0.13], [1.05, 0.1], [1.4, 0.09], [1.8, 0.08], [2.25, 0.08], [2.7, 0.08], [Math.PI, 0.09]];
  for (const [ang, L] of pts) {
    const b = V(Math.sin(ang) * 0.235, CY + 0.04, CZ + Math.cos(ang) * 0.222);
    const g = gold(shard(b, V(Math.sin(ang) * 0.25, 1, Math.cos(ang) * 0.25), 0.04, L));
    if (ang === 0 || ang === Math.PI) C.push(g); else S.push(g);
    const pp = V(Math.sin(ang) * 0.255, CY + 0.015, CZ + Math.cos(ang) * 0.242);
    if (ang === 0) C.push(pearl(pp, 0.022)); else if (ang < 1.2) S.push(pearl(pp, 0.018));
  }

  // ================= HALO (floating above the head) =================
  const HY = 1.25, HZ = -0.11, HR = 0.2, NH = 16;
  const sec = (k) => {
    const a = (2 * Math.PI * k) / NH + Math.PI / NH;
    const r = V(Math.sin(a), 0, Math.cos(a));
    const c = V(r.x * HR, HY, HZ + r.z * HR);
    return [add(c, r, -0.025), add(c, r, 0.025), add(add(c, r, -0.025), V(0, 0.03, 0)), add(add(c, r, 0.025), V(0, 0.03, 0))];
  };
  for (let k = 0; k < NH; k++) {
    const g = paint(hull([...sec(k), ...sec(k + 1)]), SW.halo, 'y');
    g.translate(0, -HY, -HZ); g.rotateX(0.3); g.translate(0, HY, HZ);
    C.push(g);
  }

  // ================= TRIDENT (centre line, planted BEHIND the mantle, head rising above the halo) =================
  const TZ = -0.38, TB = 1.38;
  C.push(paint(tube([{ p: V(0, 0.02, TZ), rx: 0.022, ry: 0.022 }, { p: V(0, TB, TZ), rx: 0.022, ry: 0.022 }],
    { seg: 6, ref: V(1, 0, 0), phase: Math.PI / 6 }), SW.goldDk, 'y'));
  C.push(gold(hull([...ring(V(0, 0.0, TZ), 0.032, 0.032, 6, 'y'), ...ring(V(0, 0.05, TZ), 0.036, 0.036, 6, 'y')])));
  C.push(gold(hull([...ring(V(0, TB - 0.07, TZ), 0.03, 0.03, 6, 'y'), ...ring(V(0, TB - 0.025, TZ), 0.045, 0.045, 6, 'y')])));
  C.push(gold(hull([...cbox(V(0, TB, TZ), 0.13, 0.025, 0.026, 0.01), V(0, TB - 0.05, TZ)])));
  C.push(gold(shard(V(0, TB + 0.02, TZ), V(0, 1, 0), 0.034, 0.19)));
  S.push(gold(hull(cbox(V(0.11, TB + 0.05, TZ), 0.022, 0.055, 0.022, 0.006))));
  S.push(gold(shard(V(0.11, TB + 0.1, TZ), V(0.12, 1, 0), 0.026, 0.11)));
  S.push(gold(shard(V(0.125, TB + 0.02, TZ), V(1, 0.7, 0), 0.016, 0.06)));
  C.push(pearl(V(0, TB, TZ + 0.03), 0.022));

  // arms reaching from the sides round the back to grip the shaft
  const armPts = [V(0.2, 0.33, -0.04), V(0.29, 0.36, -0.2), V(0.22, 0.47, -0.35), V(0.09, 0.53, -0.425), V(0.0, 0.54, -0.425)];
  S.push(paint(tube(curveSamples(armPts, 10, (t) => 0.058 - 0.026 * t), { seg: 6, capEnd: 0.01, phase: Math.PI / 6 }), SW.tent, 'len'));
  S.push(goldDk(hull([...perpRing(V(0.283, 0.352, -0.16), V(0.15, 0.15, -1), 0.064, 8), ...perpRing(V(0.288, 0.358, -0.2), V(0.15, 0.15, -1), 0.064, 8)])));

  // gold clasp where both arms grip the shaft
  C.push(gold(hull([...ring(V(0, 0.505, -0.4), 0.07, 0.07, 8, 'y'), ...ring(V(0, 0.575, -0.4), 0.07, 0.07, 8, 'y')])));
  C.push(goldDk(hull([...ring(V(0, 0.49, -0.4), 0.055, 0.055, 8, 'y'), ...ring(V(0, 0.59, -0.4), 0.055, 0.055, 8, 'y')])));

  // ================= AURA RAYS (radiant fan behind the mantle) =================
  const AC = V(0, 0.72, -0.24), An = V(0, 0, 1);
  const rays = [];
  for (let k = 0; k < 6; k++) rays.push([0.3 + k * 0.3, k % 2 ? 0.3 : 0.36, k % 2 ? 'aura' : 'gold']);
  const kite = [[0, -0.35], [0, 0.35], [0.4, 0.5], [1, 0], [0.4, -0.5]];
  for (const [a, L, sw] of rays) {
    const d = V(Math.sin(a), Math.cos(a), 0);
    const g = radial(blade(add(AC, d, 0.22), d, An, L, 0.14, 0.025, kite), sw === 'gold' ? SW.gold : SW.aura, AC, 0.22, 0.6);
    if (a === 0) C.push(g); else S.push(g);
  }

  return assemble(C, S);
}

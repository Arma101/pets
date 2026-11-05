// Lotus Dragon King (DIVINE): regal chunky pink dragon, gold lotus crown, golden halo, petal wings,
// glowing gold armour, jade gems, silk ribbons, cherry-blossom details.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  pink:    { i: 0, top: '#F45C9C', bot: '#C1306F' },
  pinkDk:  { i: 1, top: '#E04689', bot: '#A3225C' },
  cream:   { i: 2, top: '#FFF2E2', bot: '#F2CDB4' },
  gold:    { i: 3, top: '#FFE066', bot: '#EE960A', glow: true },
  goldDk:  { i: 4, top: '#FFE070', bot: '#E9A21A' },
  white:   { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:     { i: 6, top: '#1A1416', bot: '#0C0A0B' },
  nose:    { i: 7, top: '#6A1E3A', bot: '#40102A' },
  jade:    { i: 8, top: '#7CF0C0', bot: '#1FA978', glow: true },
  petal:   { i: 9, top: '#FFE0EC', bot: '#FFA3C8' },
  petalW:  { i: 10, top: '#FFFFFF', bot: '#FFE8F1' },
  ribbon:  { i: 11, top: '#6EE6B8', bot: '#249E74' },
  goldT:   { i: 12, top: '#E9A21A', bot: '#FFF3A6' },
  petalBk: { i: 16, top: '#FF8CC8', bot: '#FF4FA2' },
  petalWB: { i: 17, top: '#FFB8DD', bot: '#FF80BE' },
  blossom: { i: 13, top: '#FFFFFF', bot: '#FFB3D1' },
  halo:    { i: 14, top: '#FFF09A', bot: '#FFBE1A', glow: true },
  brow:    { i: 15, top: '#E8508F', bot: '#B02765' },
};
const P = PALETTE;

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const sub = (a, b) => a.clone().sub(b);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);

// flat blade lying in the plane with normal n, pointing along dir
function blade(base, dir, n, L, w, th = 0.016, shape = null) {
  const d = nrm(dir);
  const nn = nrm(add(n, d, -n.dot(d)));
  const v = nrm(cross(nn, d));
  const pts2 = shape || [[0, -0.3], [0, 0.3], [0.35, 0.5], [1, 0], [0.35, -0.5]];
  const pts = [];
  for (const [u, s] of pts2) {
    const p = add(add(base, d, u * L), v, s * w);
    const t = th * (u > 0.9 ? 0.6 : 1);
    pts.push(add(p, nn, t / 2), add(p, nn, -t / 2));
  }
  return hull(pts);
}
const PETAL = [[0, -0.12], [0, 0.12], [0.55, 0.5], [1, 0], [0.55, -0.5]];
const KITE = [[0, -0.25], [0, 0.25], [0.45, 0.5], [1, 0], [0.45, -0.5]];

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const pink = (pts, lo = 0.05, hi = 0.75) => paint(hull(pts), P.pink, 'y', [lo, hi]);
  const gold = (g) => paint(g, P.gold, 'y');
  const goldF = (g) => paint(g, P.gold, 'flat');
  const goldDk = (g) => paint(g, P.goldDk, 'flat');
  const jade = (g) => paint(g, P.jade, 'y');

  // cherry blossom: 5 small petals around a gold centre, facing normal n
  const blossom = (arr, c, n, r = 0.035) => {
    const nn = nrm(n);
    const a = nrm(cross(nn, Math.abs(nn.y) > 0.9 ? X : V(0, 1, 0)));
    const b = cross(nn, a);
    for (let k = 0; k < 5; k++) {
      const t = (2 * Math.PI * k) / 5;
      const d = add(a.clone().multiplyScalar(Math.cos(t)), b, Math.sin(t));
      arr.push(paint(blade(add(c, d, 0.004), d, nn, r, r * 0.95, 0.008, [[0, 0], [0.6, 0.5], [1, 0], [0.6, -0.5]]), P.blossom, 'flat'));
    }
    arr.push(paint(blob(0, add(c, nn, 0.006), V(r * 0.3, r * 0.3, r * 0.3)), P.gold, 'flat'));
  };

  // ================= BODY =================
  C.push(pink([
    ...ring(V(0, 0.34, -0.38), 0.12, 0.12, 10, 'z'),
    ...ring(V(0, 0.34, -0.28), 0.19, 0.18, 10, 'z'),
    ...ring(V(0, 0.35, -0.12), 0.215, 0.205, 10, 'z'),
    ...ring(V(0, 0.38, 0.04), 0.22, 0.215, 10, 'z'),
    ...ring(V(0, 0.41, 0.16), 0.2, 0.205, 10, 'z'),
    ...ring(V(0, 0.44, 0.25), 0.13, 0.14, 10, 'z'),
  ]));
  C.push(pink([...ring(V(0, 0.46, 0.15), 0.15, 0.14, 10, 'y'), ...ring(V(0, 0.68, 0.24), 0.13, 0.12, 10, 'y')], 0.3, 0.9));

  // ================= LEGS =================
  S.push(pink([...ring(V(0.17, 0.08, 0.22), 0.088, 0.088, 8), ...ring(V(0.17, 0.2, 0.2), 0.095, 0.098, 8),
    ...ring(V(0.15, 0.34, 0.14), 0.11, 0.12, 8)], 0.0, 0.6));
  S.push(pink([...ring(V(0.17, 0.4, -0.17), 0.08, 0.12, 8), ...ring(V(0.19, 0.29, -0.17), 0.13, 0.17, 8), ...ring(V(0.185, 0.16, -0.17), 0.1, 0.12, 8)], 0.0, 0.6));
  S.push(pink([...ring(V(0.18, 0.24, -0.16), 0.09, 0.095, 8), ...ring(V(0.19, 0.13, -0.19), 0.08, 0.08, 8),
    ...ring(V(0.19, 0.08, -0.18), 0.078, 0.078, 8)], 0.0, 0.6));
  // gold bracers (armour rings) on all four legs
  S.push(gold(hull([...ring(V(0.17, 0.12, 0.215), 0.1, 0.1, 8, 'y'), ...ring(V(0.17, 0.19, 0.205), 0.106, 0.108, 8, 'y')])));
  S.push(gold(hull([...ring(V(0.19, 0.11, -0.183), 0.09, 0.09, 8, 'y'), ...ring(V(0.19, 0.17, -0.188), 0.095, 0.095, 8, 'y')])));
  S.push(jade(blob(0, V(0.17, 0.155, 0.32), V(0.022, 0.026, 0.014))));
  // feet: pink block + 3 big gold claws
  const foot = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.055, z + 0.01), 0.09, 0.055, 0.08, 0.028)), P.pink, 'y', [0, 0.3]));
    for (const dx of [-0.056, 0, 0.056]) {
      const b = V(x + dx, 0.0, z + 0.08);
      S.push(paint(hull([
        V(b.x - 0.026, 0.0, b.z - 0.02), V(b.x + 0.026, 0.0, b.z - 0.02),
        V(b.x - 0.022, 0.055, b.z - 0.02), V(b.x + 0.022, 0.055, b.z - 0.02),
        V(b.x, 0.062, b.z + 0.0), V(b.x + dx * 0.15, 0.0, b.z + 0.075),
        V(b.x - 0.018, 0.0, b.z + 0.035), V(b.x + 0.018, 0.0, b.z + 0.035),
      ]), P.goldDk, 'y', [0, 0.07]));
    }
  };
  foot(0.175, 0.23);
  foot(0.195, -0.17);

  // ================= BELLY (cream bands) + GOLD CHEST PLATE =================
  // flush cream belly plate: built from the torso's own bottom ring vertices, pushed ~0.005 off the surface
  {
    const rings = [[0.34, -0.28, 0.19, 0.18], [0.35, -0.12, 0.215, 0.205], [0.38, 0.04, 0.22, 0.215], [0.41, 0.16, 0.2, 0.205], [0.44, 0.25, 0.13, 0.14]];
    const pts = [];
    for (const [cy, cz, rx, ry] of rings) {
      const cen = V(0, cy, cz);
      for (const k of [6, 7, 8]) { // 10-gon vertices nearest the bottom (phase pi/8)
        const ang = Math.PI / 8 + (2 * Math.PI * k) / 10;
        const v = V(Math.cos(ang) * rx * 0.8, cy + Math.sin(ang) * ry, cz);
        const d = sub(v, cen);
        pts.push(add(cen, d, 1 + 0.006 / d.length()), add(cen, d, 0.8));
      }
    }
    C.push(paint(hull(pts), P.cream, 'y', [0.12, 0.45]));
  }
  // chest mass under the plate
  C.push(pink([...ring(V(0, 0.36, 0.25), 0.14, 0.1, 8, 'y'), ...ring(V(0, 0.66, 0.31), 0.12, 0.09, 8, 'y')], 0.3, 0.8));
  {
    const pts = [];
    for (const [cy, cz, ra, rb] of [[0.36, 0.25, 0.14, 0.1], [0.51, 0.28, 0.13, 0.095]]) {
      const cen = V(0, cy, cz);
      for (const ang of [Math.PI * 3 / 8, Math.PI * 5 / 8]) {
        const v = V(Math.cos(ang) * ra, cy, cz + Math.sin(ang) * rb);
        const d = sub(v, cen);
        pts.push(add(cen, d, 1 + 0.006 / d.length()), add(cen, d, 0.75));
      }
    }
    C.push(paint(hull(pts), P.cream, 'y', [0.3, 0.55]));
  }
  // gold breastplate: faceted shield over the chest, pointed at the bottom
  const BP = (dz, s) => [
    V(0.13 * s, 0.68, 0.33 + dz), V(-0.13 * s, 0.68, 0.33 + dz),
    V(0.155 * s, 0.56, 0.37 + dz), V(-0.155 * s, 0.56, 0.37 + dz),
    V(0.13 * s, 0.46, 0.375 + dz), V(-0.13 * s, 0.46, 0.375 + dz),
    V(0, 0.4, 0.36 + dz), V(0, 0.6, 0.4 + dz + 0.02 * s),
  ];
  C.push(gold(hull([...BP(0, 1), ...BP(-0.08, 1)])));
  // pink inner panel with jade gem
  C.push(paint(hull([...BP(0.006, 0.62).map((p) => V(p.x, p.y * 0.85 + 0.08, p.z)), ...BP(-0.02, 0.62).map((p) => V(p.x, p.y * 0.85 + 0.08, p.z))]), P.pinkDk, 'flat'));
  C.push(jade(hull([V(0, 0.62, 0.43), V(0.04, 0.575, 0.415), V(-0.04, 0.575, 0.415), V(0, 0.52, 0.415),
    V(0, 0.575, 0.445), V(0, 0.62, 0.4), V(0, 0.52, 0.4)])));
  // gold collar ring at neck base
  C.push(goldDk(hull([...ring(V(0, 0.66, 0.255), 0.155, 0.145, 10, 'y'), ...ring(V(0, 0.71, 0.265), 0.15, 0.14, 10, 'y')])));

  // shoulder pauldrons: layered gold plates over the front legs
  // domed, layered shoulder plates (ring 'y' sections stepping down and outward)
  const pauld = (c, r, h) => paint(hull([...ring(add(c, V(-0.03, 0.02, 0)), r * 0.55, r * 0.6, 8, 'y'),
    ...ring(add(c, V(0.02, -h, 0)), r, r * 1.05, 8, 'y'), ...ring(add(c, V(0.03, -h - 0.025, 0)), r * 0.95, r, 8, 'y')]), P.goldDk, 'y', [c.y - h - 0.03, c.y + 0.03]);
  S.push(pauld(V(0.17, 0.53, 0.17), 0.1, 0.07));
  S.push(pauld(V(0.2, 0.45, 0.17), 0.105, 0.06));
  S.push(goldF(shard(V(0.2, 0.5, 0.14), V(0.5, 1, -0.3), 0.04, 0.1)));
  // gold flank plate along the side
  S.push(gold(hull([V(0.205, 0.46, 0.04), V(0.21, 0.44, -0.18), V(0.22, 0.36, 0.04), V(0.22, 0.36, -0.16),
    V(0.17, 0.48, 0.04), V(0.17, 0.46, -0.18), V(0.18, 0.34, 0.04), V(0.18, 0.34, -0.16)])));

  // ================= HEAD =================
  const hc0 = C.length, hs0 = S.length;
  const H = { y: 0.81, z: 0.3 };
  C.push(pink([
    ...cbox(V(0, H.y, H.z), 0.2, 0.16, 0.16, 0.07),
    ...ring(V(0, H.y + 0.175, H.z - 0.03), 0.12, 0.1, 8, 'y'),
    V(0.215, H.y - 0.065, H.z + 0.02), V(-0.215, H.y - 0.065, H.z + 0.02),
  ], 0.6, 1.0));
  const FZ = H.z + 0.16;
  // snout
  C.push(pink([
    ...cbox(V(0, H.y - 0.07, FZ + 0.085), 0.115, 0.06, 0.105, 0.03),
    V(0.09, H.y - 0.0, FZ - 0.02), V(-0.09, H.y - 0.0, FZ - 0.02),
    V(0.065, H.y - 0.015, FZ + 0.17), V(-0.065, H.y - 0.015, FZ + 0.17),
  ], 0.62, 0.92));
  // cream lower jaw
  C.push(paint(hull(cbox(V(0, H.y - 0.14, FZ + 0.045), 0.095, 0.035, 0.1, 0.02)), P.cream, 'y', [0.6, 0.72]));
  // nostrils
  S.push(paint(hull([V(0.028, H.y - 0.008, FZ + 0.155), V(0.062, H.y - 0.008, FZ + 0.15), V(0.028, H.y - 0.022, FZ + 0.197),
    V(0.062, H.y - 0.022, FZ + 0.195), V(0.045, H.y - 0.03, FZ + 0.15), V(0.045, H.y - 0.04, FZ + 0.19)]), P.nose, 'flat'));
  // mouth line
  S.push(paint(hull([V(0, H.y - 0.098, FZ + 0.197), V(0, H.y - 0.088, FZ + 0.197), V(0.08, H.y - 0.098, FZ + 0.197),
    V(0.08, H.y - 0.088, FZ + 0.197), V(0, H.y - 0.093, FZ + 0.18), V(0.08, H.y - 0.093, FZ + 0.18)]), P.nose, 'flat'));
  S.push(paint(hull([V(0.1, H.y - 0.098, FZ + 0.185), V(0.1, H.y - 0.088, FZ + 0.185), V(0.12, H.y - 0.098, FZ + 0.16),
    V(0.12, H.y - 0.088, FZ + 0.16), V(0.12, H.y - 0.115, FZ + 0.05), V(0.12, H.y - 0.105, FZ + 0.05),
    V(0.105, H.y - 0.1, FZ + 0.06), V(0.09, H.y - 0.093, FZ + 0.18)]), P.nose, 'flat'));
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

  // flowing whiskers: low-segment gold tubes from the snout sides curving out, down and back
  S.push(paint(tube(curveSamples(
    [V(0.1, H.y - 0.035, FZ + 0.14), V(0.22, H.y + 0.0, FZ + 0.13), V(0.36, H.y - 0.03, FZ + 0.07),
      V(0.46, H.y - 0.12, FZ - 0.05), V(0.52, H.y - 0.2, FZ - 0.2)],
    8, (t) => 0.022 * (1 - t) + 0.007), { seg: 5, capEnd: 0.012 }), P.goldT, 'len'));
  S.push(paint(tube(curveSamples(
    [V(0.11, H.y - 0.075, FZ + 0.1), V(0.21, H.y - 0.08, FZ + 0.08), V(0.31, H.y - 0.14, FZ + 0.02), V(0.38, H.y - 0.23, FZ - 0.08)],
    6, (t) => 0.016 * (1 - t) + 0.006), { seg: 5, capEnd: 0.01 }), P.goldT, 'len'));
  // chin beard tuft (cream shards)
  C.push(paint(shard(V(0, H.y - 0.16, FZ + 0.03), V(0, -1, -0.2), 0.04, 0.09), P.cream, 'flat'));
  S.push(paint(shard(V(0.045, H.y - 0.155, FZ + 0.02), V(0.3, -1, -0.3), 0.032, 0.075), P.cream, 'flat'));

  // mane: layered petal-like pink/white shards fanning back from the head sides
  const fin = (b, tip, h, th) => hull([
    add(b, V(th, h, 0)), add(b, V(-th, h, 0)), add(b, V(th, -h, 0)), add(b, V(-th, -h, 0)), add(b, V(th * 1.6, 0, 0.02)), tip,
  ]);
  for (const [b, tip, h, sw] of [
    [V(0.18, H.y + 0.03, H.z - 0.06), V(0.31, H.y + 0.1, H.z - 0.23), 0.05, P.petalW],
    [V(0.19, H.y - 0.05, H.z - 0.02), V(0.33, H.y - 0.07, H.z - 0.18), 0.045, P.pinkDk],
    [V(0.17, H.y - 0.11, H.z + 0.02), V(0.27, H.y - 0.2, H.z - 0.1), 0.035, P.petalW],
    [V(0.1, H.y + 0.06, H.z - 0.15), V(0.18, H.y + 0.04, H.z - 0.33), 0.05, P.pinkDk],
  ]) S.push(paint(fin(b, tip, h, 0.022), sw, 'y', [H.y - 0.2, H.y + 0.2]));
  // back-of-head crest shards
  C.push(paint(shard(V(0, H.y + 0.06, H.z - 0.16), V(0, 0.3, -1), 0.05, 0.13), P.petalW, 'flat'));
  C.push(paint(shard(V(0, H.y - 0.06, H.z - 0.15), V(0, -0.2, -1), 0.045, 0.11), P.pinkDk, 'flat'));
  // small gold horns sweeping back behind the crown
  S.push(paint(tube(curveSamples(
    [V(0.12, H.y + 0.12, H.z - 0.08), V(0.17, H.y + 0.18, H.z - 0.17), V(0.2, H.y + 0.24, H.z - 0.3)],
    5, (t) => 0.04 * (1 - t) + 0.004), { seg: 6 }), P.goldT, 'len'));

  // ---- GOLD LOTUS CROWN ----
  const CY = H.y + 0.165, CZ = H.z - 0.01;
  C.push(gold(hull([...ring(V(0, CY - 0.01, CZ), 0.125, 0.11, 10, 'y'), ...ring(V(0, CY + 0.04, CZ), 0.135, 0.12, 10, 'y')])));
  // outer ring of lotus petals (gold) and inner ring (pink, gold-tipped feel)
  const lotusRing = (n, rad, y, tilt, L, w, sw, a0 = 0) => {
    for (let k = 0; k < n; k++) {
      const a = a0 + (2 * Math.PI * k) / n;
      const r = V(Math.sin(a), 0, Math.cos(a));
      // only add right side + centre ones (mirror handles the rest)
      const x = rad * r.x;
      if (x < -1e-4) continue;
      const base = V(x, y, CZ + rad * 0.9 * r.z);
      const dir = nrm(add(V(0, 1, 0), r, tilt));
      const n2 = r.clone();
      const g = paint(blade(base, dir, n2, L, w, 0.022, KITE), sw, 'y', [y, y + L]);
      if (Math.abs(x) < 1e-4) C.push(g); else S.push(g);
    }
  };
  lotusRing(10, 0.12, CY + 0.02, 0.65, 0.12, 0.085, P.gold);
  lotusRing(10, 0.08, CY + 0.03, 0.3, 0.13, 0.075, P.petal, Math.PI / 10);
  // centre: jade bud gem + gold point
  C.push(jade(hull([...ring(V(0, CY + 0.06, CZ), 0.045, 0.045, 6, 'y'), V(0, CY + 0.14, CZ), V(0, CY + 0.04, CZ)])));
  // front jewel on the band
  C.push(paint(hull([V(0, CY + 0.045, CZ + 0.15), V(0.028, CY + 0.015, CZ + 0.14), V(-0.028, CY + 0.015, CZ + 0.14),
    V(0, CY - 0.015, CZ + 0.14), V(0, CY + 0.015, CZ + 0.158), V(0, CY + 0.015, CZ + 0.12)]), P.pinkDk, 'flat'));

  // ---- GOLDEN HALO (floating above the head, ring + sunburst rays) ----
  const HC = V(0, H.y + 0.38, H.z - 0.1), HR = 0.17, HT = -0.35; // tilt back
  const hq = new THREE.Quaternion().setFromAxisAngle(X, HT);
  const hp = (a, r, dy = 0) => add(HC, V(Math.sin(a) * r, dy, Math.cos(a) * r).applyQuaternion(hq));
  const NH = 12, HW = 0.042, HH = 0.04; // chunky octagonal cross-section
  const oct = [];
  for (let j = 0; j < 8; j++) { const t = Math.PI / 8 + (2 * Math.PI * j) / 8; oct.push([Math.cos(t) * HW, Math.sin(t) * HH]); }
  for (let k = 0; k < NH; k++) {
    const a0 = (2 * Math.PI * k) / NH + Math.PI / NH, a1 = a0 + (2 * Math.PI) / NH;
    const xm = Math.sin((a0 + a1) / 2);
    if (xm < -1e-4) continue;
    const pts = [];
    for (const a of [a0, a1]) for (const [dr, dy] of oct) pts.push(hp(a, HR + dr, dy));
    const g = paint(hull(pts), P.halo, 'y');
    if (Math.abs(xm) < 1e-4) C.push(g); else S.push(g);
  }
  // halo rays: 8 broad, chunky sunburst blades
  for (let k = 0; k < 8; k++) {
    const a = (2 * Math.PI * k) / 8;
    const xs = Math.sin(a);
    if (xs < -1e-4) continue;
    const b = hp(a, HR + 0.025);
    const tip = hp(a, HR + (k % 2 ? 0.1 : 0.14));
    const side = V(Math.cos(a), 0, -Math.sin(a)).applyQuaternion(hq);
    const up = V(0, 1, 0).applyQuaternion(hq);
    const g = paint(hull([add(b, side, 0.055), add(b, side, -0.055), add(b, up, 0.024), add(b, up, -0.024),
      add(tip, up, 0.008), add(tip, up, -0.008)]), P.halo, 'flat');
    if (Math.abs(xs) < 1e-4) C.push(g); else S.push(g);
  }

  // scale the head up about the neck (big-head look)
  const HS = 1.1, piv = V(0, 0.66, 0.28);
  for (const g of [...C.slice(hc0), ...S.slice(hs0)]) {
    g.translate(-piv.x, -piv.y, -piv.z); g.scale(HS, HS, HS); g.translate(piv.x, piv.y, piv.z);
  }

  // ================= BACK SPINES (gold + petal) =================
  for (const [y, z, s, sw] of [[0.6, 0.12, 1.0, P.gold], [0.58, 0.01, 1.2, P.petal], [0.57, -0.11, 1.2, P.gold], [0.55, -0.23, 1.0, P.petal], [0.49, -0.33, 0.8, P.gold]])
    C.push(paint(shard(V(0, y, z), V(0, 1, -0.55), 0.05 * s, 0.1 * s), sw, 'flat'));

  // ================= TAIL =================
  const tailPts = [V(0, 0.34, -0.3), V(0, 0.22, -0.5), V(0, 0.12, -0.7), V(0, 0.12, -0.88), V(0, 0.22, -1.0), V(0, 0.38, -1.04)];
  C.push(paint(tube(curveSamples(tailPts, 12, (t) => 0.11 * (1 - t) + 0.028), { seg: 8, axis: X, capEnd: 0.02 }), P.pink, 'len'));
  const tc = new THREE.CatmullRomCurve3(tailPts, false, 'centripetal');
  for (const t of [0.16, 0.34, 0.52, 0.7]) {
    const p = tc.getPoint(t), T = tc.getTangent(t);
    const n = V(0, T.z, -T.y).normalize(); if (n.y + n.z * 0.3 < 0) n.negate();
    const r = 0.11 * (1 - t) + 0.028, k = 1.1 - t * 0.5;
    C.push(paint(shard(add(p, n, r * 0.75), add(n, T, -0.6), 0.045 * k, 0.09 * k), t > 0.3 && t < 0.4 || t > 0.6 ? P.petal : P.gold, 'flat'));
  }
  // gold tail band with jade gem
  {
    const t = 0.82, p = tc.getPoint(t), T = tc.getTangent(t);
    const r = 0.11 * (1 - t) + 0.028 + 0.012;
    C.push(gold(tube([{ p: add(p, T, -0.025), rx: r, ry: r }, { p: add(p, T, 0.025), rx: r, ry: r }], { seg: 8, axis: X })));
  }
  // lotus-petal tail tip: fan of pink/white petals with gold core
  const tip = tc.getPoint(1), tT = tc.getTangent(1);
  C.push(paint(blade(add(tip, tT, -0.01), add(tT, V(0, 0, -0.3)), X, 0.17, 0.09, 0.024, PETAL), P.petalBk, 'y'));
  S.push(paint(blade(add(tip, V(0.01, -0.01, 0)), V(0.8, 0.6, -0.3), V(0.3, -0.5, 0.8), 0.14, 0.075, 0.02, PETAL), P.petalWB, 'y'));
  S.push(paint(blade(add(tip, V(0.01, -0.03, 0)), V(0.9, -0.1, -0.5), V(0.2, 0.6, -0.6), 0.12, 0.07, 0.02, PETAL), P.petalBk, 'y'));
  C.push(gold(blob(0, add(tip, tT, 0.0), V(0.04, 0.04, 0.04))));
  // silk ribbon tied at the tail band, trailing down
  {
    const p = tc.getPoint(0.82);
    S.push(paint(tube(curveSamples([add(p, V(0.03, -0.02, 0)), add(p, V(0.08, -0.06, 0.05)), add(p, V(0.1, -0.08, 0.13)), add(p, V(0.12, -0.05, 0.2))],
      6, () => 0.024, () => 0.007), { seg: 4, ref: V(1, 0.3, 0) }), P.ribbon, 'len'));
  }

  // ================= SILK RIBBON SASH (jade) at the collar, flowing back =================
  S.push(paint(tube(curveSamples(
    [V(0.12, 0.66, 0.3), V(0.2, 0.62, 0.18), V(0.25, 0.58, 0.04), V(0.27, 0.49, -0.1), V(0.3, 0.45, -0.24), V(0.33, 0.48, -0.36)],
    10, (t) => 0.034 - 0.008 * t, () => 0.008), { seg: 4, ref: V(1, 0.2, 0), capEnd: 0.0 }), P.ribbon, 'len'));
  S.push(paint(tube(curveSamples(
    [V(0.25, 0.58, 0.04), V(0.29, 0.5, 0.0), V(0.31, 0.4, -0.06), V(0.33, 0.33, -0.04)],
    6, (t) => 0.028 - 0.006 * t, () => 0.008), { seg: 4, ref: V(1, 0.1, 0) }), P.ribbon, 'len'));
  blossom(S, V(0.255, 0.6, 0.06), V(1, 0.3, 0.4), 0.04);

  // ================= PETAL WINGS =================
  const SH = V(0.14, 0.56, -0.02), EL = V(0.34, 0.76, -0.1), WR = V(0.5, 0.98, -0.16);
  S.push(paint(tube(curveSamples([SH, EL, WR], 6, (t) => 0.045 - 0.017 * t), { seg: 6, capEnd: 0.03 }), P.goldDk, 'y', [0.5, 1.0]));
  S.push(gold(blob(0, WR, V(0.05, 0.05, 0.05))));
  S.push(jade(blob(0, add(WR, V(0.02, 0.02, 0.04)), V(0.025, 0.03, 0.02))));
  S.push(goldF(shard(add(WR, V(0, 0.03, 0)), V(0.05, 1, 0.2), 0.035, 0.12)));
  // spread fan of petals: gold-backed (gold rim) with pink/white face
  const wingN = V(0.35, 0.0, 1).normalize(); // wing plane faces mostly forward/out
  const fan = [
    // [origin t along arm, angle (rad, 0=out, + up), length, width, colour]
    [1.0, 1.2, 0.38, 0.16, P.petalW],
    [1.0, 0.8, 0.5, 0.19, P.petal],
    [1.0, 0.38, 0.56, 0.2, P.petalW],
    [1.0, -0.04, 0.54, 0.2, P.petal],
    [0.85, -0.45, 0.5, 0.19, P.petalW],
    [0.65, -0.82, 0.42, 0.17, P.petal],
    [0.42, -1.12, 0.33, 0.15, P.petalW],
  ];
  const arm = new THREE.CatmullRomCurve3([SH, EL, WR], false, 'centripetal');
  const out = nrm(cross(wingN, V(0, 1, 0)).negate()); // outward in wing plane
  fan.forEach(([t, ang, L, w, sw], i) => {
    const p = arm.getPoint(t);
    const dir = nrm(add(add(V(0, 0, 0), out, Math.cos(ang)), V(0, 1, 0), Math.sin(ang)).add(V(0, 0, -0.25)));
    const back = -0.02 - i * 0.006;
    // alternate petal tilt around its own axis so rear faces catch the sky light
    const pn = wingN.clone().applyAxisAngle(dir, i % 2 ? 0.35 : -0.35);
    if (pn.y > 0 === (i % 2 === 0)) pn.applyAxisAngle(dir, i % 2 ? -0.7 : 0.7);
    S.push(paint(blade(add(p, wingN, back), dir, pn, L * 1.07, w * 1.18, 0.01, PETAL), P.gold, 'flat'));
    S.push(paint(blade(add(p, pn, back + 0.011), dir, pn, L, w, 0.008, PETAL), sw, 'y', [0.3, 1.5]));
    S.push(paint(blade(add(p, pn, back - 0.011), dir, pn, L, w, 0.008, PETAL), sw === P.petal ? P.petalBk : P.petalWB, 'y', [0.3, 1.5]));
  });
  blossom(S, add(WR, V(0.09, -0.07, 0.02)), wingN, 0.035);

  blossom(S, V(0.31, 0.32, -0.17), V(1, 0.25, 0.1), 0.055);

  const geo = assemble(C, S);
  geo.scale(0.9, 0.9, 0.9);
  geo.computeBoundingBox();
  return geo;
}

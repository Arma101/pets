// Venom Mantis (MYTHIC, Round 6 Swamp Slam): chunky faceted lime-green praying mantis,
// glowing yellow-green markings, raised scythe arms with gold spikes, long antennae, big glowing wings,
// swamp moss + bog roots + glowing green spots, gold horns/trim.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  lime:   { i: 0, top: '#A8EC3E', bot: '#4F9A1C' },
  limeDk: { i: 1, top: '#7CC82E', bot: '#3A7A16' },
  belly:  { i: 2, top: '#D8F78A', bot: '#9CCF48' },
  gold:   { i: 3, top: '#FFE27A', bot: '#D9931C' },
  goldT:  { i: 4, top: '#D9931C', bot: '#FFE68A' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:    { i: 6, top: '#1A1416', bot: '#0C0A0B' },
  brow:   { i: 7, top: '#5FAE22', bot: '#2F6E12' },
  glow:   { i: 8, top: '#F6FF8A', bot: '#C8F53A', glow: true },   // yellow-green markings
  spot:   { i: 9, top: '#C8FF7A', bot: '#62F04A', glow: true },   // glowing green swamp spots
  moss:   { i: 10, top: '#6E8E2A', bot: '#3E5A18' },
  mossLt: { i: 15, top: '#B4DC56', bot: '#7EAA34' },
  root:   { i: 11, top: '#8A5E3A', bot: '#4E301C' },
  wing:   { i: 12, top: '#E2FC9C', bot: '#A6E85A' },
  wingF:  { i: 14, top: '#B6F04E', bot: '#74C02E' },
  mouth:  { i: 13, top: '#2E4A14', bot: '#1A2C0A' },
};
const P = PALETTE;

// hull of two n-gons around the segment a->b (chunky limb section)
function seg(a, b, ra, rb, n = 6, phase = 0) {
  const d = new THREE.Vector3().subVectors(b, a).normalize();
  const up = Math.abs(d.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
  const u = new THREE.Vector3().crossVectors(d, up).normalize();
  const w = new THREE.Vector3().crossVectors(u, d).normalize();
  const pts = [];
  for (const [c, r] of [[a, ra], [b, rb]])
    for (let k = 0; k < n; k++) {
      const t = phase + (2 * Math.PI * k) / n;
      pts.push(c.clone().addScaledVector(u, Math.cos(t) * r).addScaledVector(w, Math.sin(t) * r));
    }
  const g = hull(pts); g.userData.pts = pts;
  return g;
}
// thick flat panel through 3+ coplanar-ish points
function slab(pts, th) {
  const n = new THREE.Vector3().subVectors(pts[1], pts[0]).cross(new THREE.Vector3().subVectors(pts[2], pts[0])).normalize();
  const out = [];
  for (const p of pts) { out.push(p.clone().addScaledVector(n, th)); out.push(p.clone().addScaledVector(n, -th)); }
  return hull(out);
}

export function buildGeometry() {
  const C = [], S = [];
  const lime = (g, lo = 0, hi = 1) => paint(g, P.lime, 'y', [lo, hi]);
  const gold = (g) => paint(g, P.gold, 'flat');
  const glow = (g) => paint(g, P.glow, 'flat');
  const spot = (g) => paint(g, P.spot, 'flat');

  // ================= ABDOMEN (big, chunky, tilted up at the back, segment bands) =================
  const abd = [
    // [y, z, rx, ry]
    [0.33, -0.02, 0.11, 0.1],
    [0.34, -0.12, 0.16, 0.13],
    [0.36, -0.24, 0.185, 0.145],
    [0.39, -0.36, 0.175, 0.135],
    [0.43, -0.47, 0.14, 0.11],
    [0.47, -0.56, 0.08, 0.07],
  ];
  C.push(lime(hull(abd.flatMap(([y, z, a, b]) => ring(V(0, y, z), a, b, 8, 'z'))), 0.22, 0.5));
  // segment ridges (darker bands slightly proud of the body) with gold trim on top
  for (let i = 1; i < abd.length - 1; i++) {
    const [y, z, a, b] = abd[i], [y2, z2] = abd[i + 1];
    const zz = (z + z2) / 2 + 0.02, yy = (y + y2) / 2;
    const ra = (a + abd[i + 1][2]) / 2 + 0.012, rb = (b + abd[i + 1][3]) / 2 + 0.012;
    C.push(paint(hull([...ring(V(0, yy, zz + 0.012), ra, rb, 8, 'z'), ...ring(V(0, yy, zz - 0.012), ra, rb, 8, 'z')]), P.limeDk, 'y', [0.2, 0.5]));
  }
  // pale underside plates
  C.push(paint(hull(abd.slice(0, 5).flatMap(([y, z, rx, ry]) => [V(rx * 0.6, y - ry * 0.78, z), V(-rx * 0.6, y - ry * 0.78, z),
    V(rx * 0.45, y - ry * 0.92 - 0.012, z), V(-rx * 0.45, y - ry * 0.92 - 0.012, z)])), P.belly, 'y', [0.15, 0.35]));
  // glowing chevron markings along the top of the abdomen
  for (const [i, k] of [[1, 1], [3, 1], [4, 0.75]]) {
    const [y, z, a, b] = abd[i];
    const top = y + b + 0.006;
    S.push(glow(hull([V(0, top + 0.004, z + 0.03 * k), V(0, top - 0.01, z + 0.06 * k), V(0.08 * k, top - 0.03 * k, z - 0.02 * k),
      V(0.08 * k, top - 0.045 * k, z + 0.01 * k), V(0, top - 0.03, z + 0.03 * k), V(0.06 * k, top - 0.06 * k, z - 0.01 * k)])));
  }

  // ================= THORAX + PROTHORAX (neck rising to the head) =================
  C.push(lime(hull([...ring(V(0, 0.33, 0.07), 0.1, 0.095, 8, 'z'), ...ring(V(0, 0.34, -0.06), 0.13, 0.115, 8, 'z')]), 0.22, 0.48));
  C.push(lime(hull([...ring(V(0, 0.35, 0.05), 0.09, 0.085, 8, 'y'), ...ring(V(0, 0.56, 0.17), 0.085, 0.08, 8, 'y'),
    ...ring(V(0, 0.46, 0.1), 0.105, 0.095, 8, 'y')]), 0.3, 0.65));
  // glowing stripe down the prothorax
  C.push(glow(hull([V(0.03, 0.56, 0.255), V(-0.03, 0.56, 0.255), V(0.04, 0.41, 0.15), V(-0.04, 0.41, 0.15),
    V(0.02, 0.56, 0.235), V(-0.02, 0.56, 0.235), V(0.025, 0.41, 0.13), V(-0.025, 0.41, 0.13)])));

  // gold collar where the neck meets the head
  C.push(gold(hull([...ring(V(0, 0.5, 0.15), 0.105, 0.1, 8, 'y'), ...ring(V(0, 0.535, 0.165), 0.1, 0.095, 8, 'y')])));
  C.push(glow(hull([...ring(V(0, 0.49, 0.149), 0.095, 0.092, 8, 'y'), ...ring(V(0, 0.505, 0.15), 0.108, 0.103, 8, 'y')])));

  // ================= WALKING LEGS (4, short, thick, planted, slightly apart) =================
  const leg = (hip, knee, foot, r) => {
    // femur: thick, angled up and out from the body, bulging mid-way
    const fm = hip.clone().lerp(knee, 0.5).add(V(0, 0.012, 0));
    S.push(lime(hull([...seg(hip, fm, r * 1.05, r * 1.2, 6).userData.pts, ...seg(fm, knee, r * 1.2, r * 0.95, 6).userData.pts]), 0.05, 0.42));
    // knee joint: chunky dark block with a gold cap
    S.push(paint(blob(0, knee, V(r * 1.2, r * 1.15, r * 1.2), { jitter: 0.08 }), P.limeDk, 'y', [0.25, 0.45]));
    S.push(gold(shard(knee.clone().add(V(0.02, r * 0.85, 0)), V(0.6, 1, 0), r * 0.5, r * 0.75)));
    // tibia: thick, angled down to the planted foot
    S.push(lime(seg(knee, foot.clone().add(V(0, 0.06, 0)), r * 0.95, r * 0.8, 6), 0.0, 0.38));
    // chunky foot pad + two gold claws
    S.push(paint(hull(cbox(V(foot.x, 0.035, foot.z + 0.01), r * 1.15, 0.035, r * 1.35, 0.014)), P.limeDk, 'flat'));
    for (const dx of [-0.6, 0.6]) {
      const b = V(foot.x + dx * r * 0.8, 0, foot.z + 0.01 + r * 1.1);
      S.push(gold(hull([V(b.x - 0.017, 0, b.z - 0.02), V(b.x + 0.017, 0, b.z - 0.02), V(b.x - 0.015, 0.042, b.z - 0.02),
        V(b.x + 0.015, 0.042, b.z - 0.02), V(b.x, 0, b.z + 0.05), V(b.x, 0.012, b.z + 0.04)])));
    }
  };

  // ================= HEAD (big, wide triangular mantis head) =================
  const H = { y: 0.74, z: 0.25 };
  C.push(lime(hull([
    ...cbox(V(0, H.y + 0.02, H.z), 0.19, 0.12, 0.13, 0.055),
    V(0.255, H.y + 0.08, H.z - 0.02), V(-0.255, H.y + 0.08, H.z - 0.02),      // wide compound-eye corners
    V(0.235, H.y + 0.12, H.z - 0.08), V(-0.235, H.y + 0.12, H.z - 0.08),
    V(0.22, H.y - 0.0, H.z + 0.04), V(-0.22, H.y - 0.0, H.z + 0.04),
    ...cbox(V(0, H.y - 0.16, H.z + 0.05), 0.075, 0.04, 0.085, 0.02),          // tapering jaw
  ]), 0.55, 0.95));
  const FZ = H.z + 0.13;
  // compound eye domes on the top corners (glowing yellow-green)
  S.push(spot(blob(0, V(0.225, H.y + 0.09, H.z - 0.025), V(0.06, 0.06, 0.065), { jitter: 0.05 })));
  // lower face plate + gold mandibles + mouth
  // gold mandibles (folded inward) and a small closed, determined mouth line beneath them
  S.push(gold(hull([V(0.018, H.y - 0.152, FZ + 0.02), V(0.075, H.y - 0.128, FZ + 0.012), V(0.075, H.y - 0.158, FZ + 0.008),
    V(0.02, H.y - 0.16, FZ - 0.0), V(0.075, H.y - 0.125, FZ - 0.025), V(0.075, H.y - 0.16, FZ - 0.025)])));
  S.push(paint(hull([V(0, H.y - 0.176, FZ + 0.012), V(0, H.y - 0.168, FZ + 0.012), V(0.03, H.y - 0.18, FZ + 0.01),
    V(0.03, H.y - 0.172, FZ + 0.01), V(0, H.y - 0.172, FZ - 0.01), V(0.03, H.y - 0.176, FZ - 0.01)]), P.mouth, 'flat'));

  // fierce eyes: white almond, angry flat top, big pupil, catchlight
  const E = V(0.095, H.y + 0.035, 0);
  S.push(paint(hull(plate([[-0.052, 0.002], [0.055, 0.042], [0.064, -0.012], [0.024, -0.05], [-0.036, -0.046], [-0.056, -0.02]],
    E, FZ - 0.01, FZ + 0.012)), P.white, 'flat'));
  S.push(paint(hull(plate([[-0.032, 0.002], [0.02, 0.024], [0.027, -0.01], [0.006, -0.041], [-0.027, -0.039], [-0.039, -0.016]],
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), P.eye, 'flat'));
  S.push(paint(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(E.x + 0.006, E.y + 0.003, 0), FZ + 0.014, FZ + 0.022)), P.white, 'flat'));
  // heavy brow slanting down to the centre
  S.push(paint(hull([
    V(0.024, E.y + 0.01, FZ + 0.038), V(0.026, E.y + 0.058, FZ + 0.028),
    V(0.175, E.y + 0.06, FZ - 0.01), V(0.175, E.y + 0.105, FZ - 0.025),
    V(0.024, E.y + 0.01, FZ - 0.03), V(0.026, E.y + 0.068, FZ - 0.04),
    V(0.175, E.y + 0.06, FZ - 0.06), V(0.175, E.y + 0.105, FZ - 0.07),
  ]), P.brow, 'y'));
  // glowing V marking on forehead
  S.push(glow(hull([V(0.0, H.y + 0.105, FZ - 0.0), V(0.0, H.y + 0.135, FZ - 0.012), V(0.055, H.y + 0.14, FZ - 0.025),
    V(0.065, H.y + 0.125, FZ - 0.018), V(0.0, H.y + 0.105, FZ - 0.035), V(0.055, H.y + 0.125, FZ - 0.055)])));
  // gold horns sweeping up and back
  S.push(paint(tube(curveSamples([V(0.1, H.y + 0.11, H.z + 0.0), V(0.13, H.y + 0.2, H.z - 0.05), V(0.18, H.y + 0.27, H.z - 0.14)],
    5, (t) => 0.04 * (1 - t) + 0.004), { seg: 5 }), P.goldT, 'len'));
  // antennae: long, sweeping up and back, glowing tips
  S.push(paint(tube(curveSamples([V(0.04, H.y + 0.1, FZ - 0.02), V(0.08, H.y + 0.32, H.z + 0.08), V(0.19, H.y + 0.48, H.z - 0.06),
    V(0.33, H.y + 0.53, H.z - 0.25)], 9, (t) => 0.018 - 0.008 * t), { seg: 5, capEnd: 0.01 }), P.limeDk, 'len'));
  S.push(glow(blob(0, V(0.33, H.y + 0.53, H.z - 0.25), V(0.022, 0.022, 0.022))));

  // ================= SCYTHE ARMS (raised guard) =================
  const sh = V(0.08, 0.5, 0.18), el = V(0.22, 0.42, 0.31), wr = V(0.25, 0.66, 0.44);
  S.push(lime(seg(sh, el, 0.05, 0.05, 6), 0.3, 0.75));                       // coxa
  S.push(paint(blob(0, el, V(0.055, 0.055, 0.055)), P.limeDk, 'flat'));
  // femur: thick, rising forward
  S.push(lime(seg(el, wr, 0.06, 0.05, 6), 0.35, 0.75));
  // glowing stripe on outer femur
  S.push(glow(seg(el.clone().lerp(wr, 0.22).add(V(0.05, 0, 0)), el.clone().lerp(wr, 0.8).add(V(0.043, 0, 0)), 0.016, 0.014, 4)));
  // gold spikes along the inner/front femur
  for (const t of [0.35, 0.6, 0.85]) {
    const p = el.clone().lerp(wr, t);
    S.push(gold(shard(p.clone().add(V(-0.025, 0, 0.035)), V(-0.3, -0.2, 1), 0.018, 0.055)));
  }
  S.push(paint(blob(0, wr, V(0.05, 0.05, 0.05)), P.gold, 'flat'));
  // tibia blade: big curved scythe folding down in front of the chest
  const bt = V(0.22, 0.42, 0.47), bm = V(0.24, 0.55, 0.52);
  S.push(paint(hull([
    wr.clone().add(V(0.028, 0.03, -0.01)), wr.clone().add(V(-0.028, 0.03, -0.01)), wr.clone().add(V(0.028, 0.0, 0.05)), wr.clone().add(V(-0.028, 0.0, 0.05)),
    bm.clone().add(V(0.022, 0, 0.03)), bm.clone().add(V(-0.022, 0, 0.03)), bm.clone().add(V(0.02, 0, -0.03)), bm.clone().add(V(-0.02, 0, -0.03)),
  ]), P.lime, 'y', [0.4, 0.75]));
  S.push(paint(hull([
    bm.clone().add(V(0.02, 0.02, 0.03)), bm.clone().add(V(-0.02, 0.02, 0.03)), bm.clone().add(V(0.018, 0.02, -0.03)), bm.clone().add(V(-0.018, 0.02, -0.03)),
    bt.clone().add(V(0.01, 0, 0.0)), bt.clone().add(V(-0.01, 0, 0.0)),
  ]), P.lime, 'y', [0.4, 0.75]));
  // gold cutting edge along the back of the blade + hook claw
  S.push(gold(hull([wr.clone().add(V(0.012, -0.03, -0.035)), wr.clone().add(V(-0.012, -0.03, -0.035)),
    bm.clone().add(V(0.012, 0, -0.045)), bm.clone().add(V(-0.012, 0, -0.045)), bm.clone().add(V(0, 0, -0.02)), wr.clone().add(V(0, -0.02, -0.01))])));
  S.push(gold(hull([bm.clone().add(V(0.012, 0.01, -0.045)), bm.clone().add(V(-0.012, 0.01, -0.045)), bm.clone().add(V(0, 0.02, -0.015)),
    bt.clone().add(V(0, -0.02, -0.035)), bt.clone().add(V(0.006, 0.0, -0.01)), bt.clone().add(V(-0.006, 0.0, -0.01))])));
  for (const t of [0.3, 0.7]) S.push(gold(shard(wr.clone().lerp(bm, t).add(V(0, -0.01, -0.05)), V(0, -0.3, -1), 0.013, 0.04)));

  // ================= WINGS (layered faceted blades, slight bend, raised glow veins) =================
  // one blade: two hulls (root->mid, mid->tip) bowed along n, thick ridge down the middle
  const blade = (root, tip, w, n, sw, th = 0.012, bow = 0.03, vein = true) => {
    const d = new THREE.Vector3().subVectors(tip, root);
    const side = new THREE.Vector3().crossVectors(n, d).normalize();
    const mid = root.clone().lerp(tip, 0.5).addScaledVector(n, bow);
    const q1 = root.clone().lerp(tip, 0.82).addScaledVector(n, bow * 0.5);
    const A = [root.clone().addScaledVector(side, w * 0.3), root.clone().addScaledVector(side, -w * 0.3),
      root.clone().addScaledVector(n, th), root.clone().addScaledVector(n, -th)];
    const M = [mid.clone().addScaledVector(side, w), mid.clone().addScaledVector(side, -w * 0.8),
      mid.clone().addScaledVector(n, th * 1.5), mid.clone().addScaledVector(n, -th * 1.5)];
    const B = [q1.clone().addScaledVector(side, w * 0.6), q1.clone().addScaledVector(side, -w * 0.45),
      q1.clone().addScaledVector(n, th), q1.clone().addScaledVector(n, -th), tip.clone()];
    S.push(paint(hull([...A, ...M]), sw, 'y', [0.3, 0.95]));
    S.push(paint(hull([...M, ...B]), sw, 'y', [0.3, 0.95]));
    if (!vein) return;
    // raised glowing vein strips on both faces along the ridge
    const v = (p0, p1, t0, t1) => {
      for (const sg of [1, -1]) S.push(glow(hull([
        p0.clone().addScaledVector(n, sg * (t0 + 0.006)).addScaledVector(side, 0.009), p0.clone().addScaledVector(n, sg * (t0 + 0.006)).addScaledVector(side, -0.009),
        p0.clone().addScaledVector(n, sg * (t0 - 0.004)).addScaledVector(side, 0.011), p0.clone().addScaledVector(n, sg * (t0 - 0.004)).addScaledVector(side, -0.011),
        p1.clone().addScaledVector(n, sg * (t1 + 0.006)).addScaledVector(side, 0.007), p1.clone().addScaledVector(n, sg * (t1 + 0.006)).addScaledVector(side, -0.007),
        p1.clone().addScaledVector(n, sg * (t1 - 0.004)), ])));
    };
    v(root.clone().lerp(mid, 0.3).addScaledVector(n, bow * 0.15), mid, th * 1.15, th * 1.5);
    v(mid, q1, th * 1.5, th);
  };
  const wingFan = (root, tips, ws, sw) => {
    const n = new THREE.Vector3().subVectors(tips[0], root).cross(new THREE.Vector3().subVectors(tips[tips.length - 1], root)).normalize();
    if (n.x < 0) n.negate();
    tips.forEach((t, i) => {
      const ax = new THREE.Vector3().subVectors(t, root).normalize();
      const ni = n.clone().applyAxisAngle(ax, (i - 1) * 0.4);   // twist each blade so the fan never goes fully edge-on
      blade(root.clone().addScaledVector(n, -0.012 * i), t.clone().addScaledVector(n, -0.02 * i), ws[i], ni, sw);
    });
    S.push(gold(hull(cbox(root, 0.035, 0.035, 0.035, 0.012))));   // gold wing joint
  };
  // big pale hindwing behind, lime forewing in front (each 3 overlapping blades)
  wingFan(V(0.07, 0.45, -0.1), [V(0.5, 0.82, -0.42), V(0.44, 0.66, -0.58), V(0.3, 0.52, -0.66)], [0.15, 0.14, 0.11], P.wing);
  wingFan(V(0.07, 0.47, -0.02), [V(0.28, 0.92, -0.24), V(0.3, 0.78, -0.38), V(0.22, 0.62, -0.46)], [0.12, 0.115, 0.09], P.wingF);

  // ================= SWAMP: moss, roots, glowing spots =================
  // moss clumps on the shoulders and head top
  // clump: dark olive base, lighter moss-green cap, a few short shards
  const clump = (c, sc, sideOnly = false) => {
    const push = sideOnly ? (g) => S.push(g) : (g) => C.push(g);
    push(paint(blob(1, c, sc, { jitter: 0.3 }), P.moss, 'y', [c.y - sc.y, c.y + sc.y]));
    push(paint(blob(0, c.clone().add(V(0, sc.y * 0.55, sc.z * 0.1)), V(sc.x * 0.7, sc.y * 0.6, sc.z * 0.7), { jitter: 0.2 }), P.mossLt, 'y', [c.y, c.y + sc.y * 1.2]));
    if (!sideOnly) C.push(paint(shard(c.clone().add(V(0, sc.y * 0.8, -sc.z * 0.3)), V(0, 1, -0.3), 0.022, 0.06), P.mossLt, 'flat'));
    for (const [dx, dz, dir] of [[0.75, 0.2, V(0.8, 0.7, 0.3)], [0.6, -0.6, V(0.6, 0.6, -0.8)], [0.9, -0.1, V(1, -0.6, 0)]])
      S.push(paint(shard(c.clone().add(V(sc.x * dx * (sideOnly ? 1 : 1), sc.y * 0.2, sc.z * dz)), dir, 0.02, 0.05), dir.y < 0 ? P.moss : P.mossLt, 'flat'));
  };
  clump(V(0, 0.47, -0.03), V(0.1, 0.055, 0.085));          // thorax / back between the wing roots
  clump(V(0, 0.515, -0.3), V(0.1, 0.05, 0.1));             // top of the abdomen
  clump(V(0, 0.565, -0.5), V(0.075, 0.045, 0.07));         // rear of the abdomen
  S.push(paint(blob(0, V(0.09, H.y + 0.135, H.z - 0.07), V(0.08, 0.035, 0.065), { jitter: 0.25 }), P.moss, 'flat'));
  S.push(paint(shard(V(0.16, H.y + 0.1, H.z - 0.11), V(0.6, -1, -0.4), 0.03, 0.07), P.moss, 'flat'));
  // moss pad on the outer scythe elbow
  S.push(paint(blob(0, el.clone().add(V(0.04, 0.03, 0.0)), V(0.04, 0.045, 0.05), { jitter: 0.3 }), P.moss, 'flat'));
  S.push(paint(shard(el.clone().add(V(0.06, 0.0, 0.0)), V(0.5, -1, 0), 0.025, 0.06), P.moss, 'flat'));
  // glowing green spots on abdomen sides
  for (const [y, z, r, x] of [[0.34, -0.15, 0.04, 0.166], [0.37, -0.3, 0.036, 0.17], [0.42, -0.44, 0.03, 0.142]])
    S.push(spot(blob(0, V(x, y, z), V(0.014, r, r))));
  // bog roots wrapping the hind and mid shins
  // root spiral hugging a limb segment a->b whose radius goes ra->rb (hexagonal hull: inradius ~0.87r)
  const wrap = (a, b, ra, rb, t0, t1, turns, tr = 0.011) => {
    const d = new THREE.Vector3().subVectors(b, a);
    const dn = d.clone().normalize();
    const u = new THREE.Vector3().crossVectors(dn, V(0, 0, 1)).normalize(), w = new THREE.Vector3().crossVectors(u, dn);
    const smp = [];
    const N = 18;
    for (let i = 0; i < N; i++) {
      const f = i / (N - 1), t = t0 + (t1 - t0) * f, th = f * turns * Math.PI * 2;
      const rr = (ra + (rb - ra) * t) * 0.9 + tr * 0.55;
      smp.push({ p: a.clone().addScaledVector(d, t).addScaledVector(u, Math.cos(th) * rr).addScaledVector(w, Math.sin(th) * rr), rx: tr, ry: tr });
    }
    return paint(tube(smp, { seg: 4 }), P.root, 'flat');
  };
  // bog root band hugging the abdomen (symmetric loop with a lumpy wobble)
  {
    const pts = [];
    for (let k = 0; k <= 16; k++) {
      const a = (k / 16) * Math.PI * 2, wob = 1 + 0.06 * Math.cos(3 * a);
      pts.push(V(Math.sin(a) * 0.168 * wob, 0.41 + Math.cos(a) * 0.132 * wob, -0.42 + 0.025 * Math.cos(a)));
    }
    C.push(paint(tube(pts.map((p) => ({ p, rx: 0.017, ry: 0.017 })), { seg: 5 }), P.root, 'flat'));
  }
  // short root running along the abdomen side from the band
  S.push(paint(tube(curveSamples([V(0.16, 0.36, -0.42), V(0.185, 0.33, -0.3), V(0.18, 0.3, -0.18), V(0.15, 0.28, -0.1)], 6, (t) => 0.016 - 0.008 * t), { seg: 4 }), P.root, 'len'));

  // ---- lower everything onto the shorter legs ----
  const DROP = 0.1;
  for (const g of [...C, ...S]) g.translate(0, -DROP, 0);
  // ================= WALKING LEGS (insect knee: femur up/out, tibia down to the foot) =================
  const legs = [
    [V(0.08, 0.2, 0.03), V(0.29, 0.31, 0.09), V(0.41, 0, 0.17), 0.058],
    [V(0.09, 0.2, -0.1), V(0.3, 0.31, -0.2), V(0.42, 0, -0.31), 0.06],
  ];
  for (const [h, k, f, r] of legs) {
    leg(h, k, f, r);
    S.push(wrap(k, f.clone().add(V(0, 0.06, 0)), r * 0.95, r * 0.8, 0.35, 0.72, 1.1));
  }

  return assemble(C, S);
}

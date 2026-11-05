// Alien Overlord (Celestial): lime-green alien insect warrior, dark purple starry armour,
// four arms with pincer claws, long antennae, glowing runes and a floating gold halo-crown.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

// starry nebula armour cell: purple gradient + soft nebula clouds + star speckles
function drawStars(g, x, y) {
  const grad = g.createLinearGradient(0, y + 16, 0, y + 112);
  grad.addColorStop(0, '#6A34A8'); grad.addColorStop(1, '#2C1252');
  g.fillStyle = '#6A34A8'; g.fillRect(x, y, 128, 16);
  g.fillStyle = grad; g.fillRect(x, y + 16, 128, 96);
  g.fillStyle = '#2C1252'; g.fillRect(x, y + 112, 128, 16);
  const neb = (cx, cy, r, col) => {
    const rg = g.createRadialGradient(x + cx, y + cy, 0, x + cx, y + cy, r);
    rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(x, y, 128, 128);
  };
  neb(40, 40, 34, 'rgba(230,90,255,0.55)');
  neb(92, 78, 36, 'rgba(70,140,255,0.5)');
  neb(54, 100, 26, 'rgba(255,110,210,0.4)');
  const stars = [[30, 24, 2], [70, 30, 1], [100, 22, 2], [50, 52, 1], [88, 50, 2], [36, 74, 2], [64, 66, 1],
    [104, 92, 1], [44, 98, 1], [78, 104, 2], [26, 108, 1], [96, 64, 1], [58, 86, 2], [84, 38, 1]];
  for (const [sx, sy, s] of stars) {
    g.fillStyle = '#FFFFFF';
    g.fillRect(x + sx - s, y + sy - s, s * 2, s * 2);
    if (s === 2) { g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(x + sx - 5, y + sy - 0.5, 10, 1); g.fillRect(x + sx - 0.5, y + sy - 5, 1, 10); }
  }
}

export const PALETTE = {
  body:   { i: 0, top: '#B9F23E', bot: '#5DAA1C' },
  belly:  { i: 1, top: '#E8FF96', bot: '#ABDB44' },
  armor:  { i: 2, draw: drawStars },
  trim:   { i: 3, top: '#5A2C8E', bot: '#2A1148' },
  rune:   { i: 4, top: '#C4FCFF', bot: '#42DCFF', glow: true },
  nebula: { i: 5, top: '#FFC4F6', bot: '#E15CFF', glow: true },
  gold:   { i: 6, top: '#FFE45C', bot: '#FFA800' },
  eye:    { i: 7, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 8, top: '#FFFFFF', bot: '#F1F1F4' },
  claw:   { i: 9, top: '#4A2678', bot: '#1F0C38' },
  mouth:  { i: 10, top: '#3A1440', bot: '#22091F' },
};
const SW = PALETTE;

// planar UVs into a drawn cell (per triangle, by dominant normal), |x| so mirror stays symmetric
function starPaint(g, sw) {
  const p = g.attributes.position;
  g.computeBoundingBox();
  const bb = g.boundingBox;
  const ax = Math.max(Math.abs(bb.min.x), Math.abs(bb.max.x)) || 1;
  const rz = Math.max(1e-6, bb.max.z - bb.min.z), ry = Math.max(1e-6, bb.max.y - bb.min.y);
  const cx = (sw.i % 8) * 128, cy = Math.floor(sw.i / 8) * 128;
  const uv = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    n.subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    for (const v of [a, b, c]) {
      let u, t;
      const fx = Math.abs(v.x) / ax, fz = (v.z - bb.min.z) / rz, fy = 1 - (v.y - bb.min.y) / ry;
      if (Math.abs(n.y) > 0.75) { u = fx; t = fz * 0.6; }
      else if (Math.abs(n.x) > Math.abs(n.z)) { u = fz; t = fy; }
      else { u = fx; t = fy; }
      uv.push((cx + 24 + u * 80) / 1024, (cy + 16 + THREE.MathUtils.clamp(t, 0, 1) * 96) / 1024);
    }
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}

export function buildGeometry() {
  const C = [], S = [];
  const lime = (pts, lo = 0.0, hi = 1.0) => paint(hull(pts), SW.body, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');
  const armor = (pts) => starPaint(hull(pts), SW.armor);
  const trim = (pts, lo, hi) => paint(hull(pts), SW.trim, 'y', [lo, hi]);

  // ================= LEGS (thick, slightly apart, armoured shins) =================
  const LX = 0.14;
  S.push(lime([...ring(V(0.115, 0.42, -0.01), 0.106, 0.112, 8), ...ring(V(LX, 0.27, 0.02), 0.104, 0.11, 8)], 0.0, 0.5));
  S.push(lime([...ring(V(LX, 0.28, 0.02), 0.09, 0.094, 8), ...ring(V(LX + 0.005, 0.08, 0.0), 0.083, 0.088, 8)], 0.0, 0.5));
  // knee pad + shin guard (purple starry, with a glowing rune stripe)
  S.push(armor([...cbox(V(LX, 0.27, 0.1), 0.07, 0.055, 0.04, 0.02), V(LX, 0.34, 0.09), V(LX, 0.25, 0.15)]));
  S.push(armor([...plate([[-0.08, 0.07], [0.08, 0.07], [0.07, -0.08], [0, -0.1], [-0.07, -0.08]], V(LX + 0.005, 0.165, 0), 0.05, 0.108)]));
  S.push(flat(hull(plate([[-0.012, 0.045], [0.012, 0.045], [0.012, -0.05], [0, -0.065], [-0.012, -0.05]], V(LX + 0.005, 0.165, 0), 0.103, 0.114)), SW.rune));
  // foot: chunky block + 3 dark claws + heel spur
  S.push(lime([...cbox(V(LX + 0.01, 0.045, 0.03), 0.098, 0.045, 0.11, 0.025), ...ring(V(LX + 0.005, 0.1, 0.0), 0.083, 0.088, 8)], 0.0, 0.5));
  const toe = (x, z, w, len, dx) => flat(hull([
    V(x - w, 0, z), V(x + w, 0, z), V(x - w, 0.045, z), V(x + w, 0.045, z),
    V(x - w * 0.8, 0, z - 0.03), V(x + w * 0.8, 0, z - 0.03), V(x - w * 0.8, 0.045, z - 0.03), V(x + w * 0.8, 0.045, z - 0.03),
    V(x + dx - w * 0.3, 0, z + len), V(x + dx + w * 0.3, 0, z + len), V(x + dx, 0.015, z + len)]), SW.claw);
  for (const dx of [-0.056, 0, 0.056]) S.push(toe(LX + 0.01 + dx, 0.12, 0.026, 0.06, dx * 0.3));
  S.push(toe(LX + 0.01, -0.07, 0.022, -0.04, 0));

  // ================= PELVIS + BELT =================
  C.push(lime([...ring(V(0, 0.33, 0), 0.13, 0.1, 10), ...ring(V(0, 0.46, 0.0), 0.165, 0.12, 10)], 0.2, 0.6));
  C.push(paint(hull([...ring(V(0, 0.36, 0.03), 0.09, 0.08, 8), ...ring(V(0, 0.44, 0.035), 0.11, 0.09, 8)]), SW.belly, 'y', [0.3, 0.5]));
  C.push(trim([...ring(V(0, 0.425, 0), 0.178, 0.132, 10), ...ring(V(0, 0.475, 0), 0.178, 0.132, 10)], 0.4, 0.5));
  // belt gem
  C.push(flat(hull([V(0, 0.48, 0.14), V(0, 0.42, 0.14), V(0.03, 0.45, 0.14), V(-0.03, 0.45, 0.14), V(0, 0.45, 0.158)]), SW.nebula));

  // ================= INSECT ABDOMEN (segmented, behind) =================
  const abd = [[-0.1, 0.42, 0.12, 0.11], [-0.19, 0.4, 0.13, 0.12], [-0.28, 0.36, 0.11, 0.1], [-0.35, 0.31, 0.07, 0.065], [-0.39, 0.27, 0.025, 0.025]];
  for (let k = 0; k < abd.length - 1; k++) {
    const [z0, y0, a0, b0] = abd[k], [z1, y1, a1, b1] = abd[k + 1];
    const pts = [...ring(V(0, y0, z0), a0, b0, 8, 'z'), ...ring(V(0, y1, z1), a1, b1, 8, 'z')];
    if (k % 2) C.push(armor(pts)); else C.push(lime(pts, 0.2, 0.55));
  }

  // glowing rune stripe along the armoured abdomen band
  C.push(flat(hull([V(0.016, 0.517, -0.19), V(-0.016, 0.517, -0.19), V(0.016, 0.458, -0.28), V(-0.016, 0.458, -0.28),
    V(0.016, 0.505, -0.19), V(-0.016, 0.505, -0.19), V(0.016, 0.446, -0.28), V(-0.016, 0.446, -0.28)]), SW.rune));

  // ================= THORAX + STARRY CHEST ARMOUR =================
  const thor = [[0.44, 0.15, 0.11], [0.55, 0.2, 0.13], [0.65, 0.19, 0.12], [0.71, 0.12, 0.09]];
  C.push(lime(thor.flatMap(([y, a, b]) => ring(V(0, y, -0.01), a, b, 10)), 0.35, 0.8));
  // breastplate: front half of the thorax, pushed out
  C.push(armor([[0.555, 0.2, 0.13], [0.65, 0.19, 0.12]].flatMap(([y, a, b]) => ring(V(0, y, -0.01), a * 1.06, b * 1.12, 10).filter((p) => p.z > -0.03))
    .concat([V(0, 0.6, 0.165), V(0, 0.545, 0.15)])));
  // lower thorax tier: armoured rib band that mounts the lower arm pair
  C.push(trim([...ring(V(0, 0.48, -0.005), 0.2, 0.138, 10), ...ring(V(0, 0.535, -0.005), 0.212, 0.145, 10)], 0.47, 0.54));
  C.push(flat(hull([...ring(V(0, 0.504, -0.005), 0.214, 0.146, 10), ...ring(V(0, 0.514, -0.005), 0.214, 0.146, 10)].filter((p) => p.z > 0.04)), SW.rune));
  // back plate (spine shell)
  C.push(armor(thor.slice(1, 4).flatMap(([y, a, b]) => ring(V(0, y, -0.01), a * 1.0, b * 1.1, 10).filter((p) => p.z < -0.02))
    .concat([V(0, 0.6, -0.17)])));
  // glowing chest runes: centre gem + chevrons
  C.push(flat(hull([V(0, 0.64, 0.17), V(0, 0.54, 0.175), V(0.035, 0.59, 0.17), V(-0.035, 0.59, 0.17), V(0, 0.59, 0.19)]), SW.nebula));
  S.push(flat(hull([V(0.05, 0.62, 0.158), V(0.06, 0.6, 0.158), V(0.13, 0.66, 0.135), V(0.13, 0.69, 0.135),
    V(0.05, 0.62, 0.17), V(0.06, 0.6, 0.17), V(0.13, 0.66, 0.147), V(0.13, 0.69, 0.147)]), SW.rune));
  // neck
  C.push(lime([...ring(V(0, 0.66, 0.0), 0.08, 0.07, 8), ...ring(V(0, 0.76, 0.02), 0.08, 0.07, 8)], 0.5, 0.9));

  // ================= FOUR ARMS (two mirrored pairs, pincer hands) =================
  const arm = (sh, el, wr, r0, hand) => {
    const r = r0 * 1.45, rh = r0 * 1.25; // limb thickness, hand size
    S.push(lime([...ring(sh, r * 1.1, r * 1.1, 8, 'x'), ...ring(el, r, r, 8, 'x')], 0.3, 0.75));
    S.push(lime([...ring(el, r * 0.95, r * 0.95, 8, 'y'), ...ring(wr, r * 0.9, r * 0.9, 8, 'y')], 0.3, 0.75));
    // bracer
    const m = el.clone().lerp(wr, 0.55);
    S.push(armor([...ring(el.clone().lerp(wr, 0.25), r * 1.14, r * 1.14, 8, 'y'), ...ring(el.clone().lerp(wr, 0.85), r * 1.1, r * 1.1, 8, 'y')]));
    S.push(flat(hull(cbox(V(m.x + r * 1.12, m.y, m.z), 0.008, 0.025, 0.015, 0.003)), SW.rune));
    // pincer: palm + upper and lower claw
    const d = hand.clone().normalize();
    const palm = wr.clone().addScaledVector(d, r * 0.8);
    S.push(lime([...cbox(palm, rh * 1.05, rh * 1.0, rh * 1.0, rh * 0.35)], 0.3, 0.75));
    const side = new THREE.Vector3().crossVectors(V(0, 1, 0), d).normalize();
    const pclaw = (sgn) => {
      const up = V(0, sgn, 0), base = palm.clone().addScaledVector(d, rh * 0.7).addScaledVector(up, rh * 0.45);
      const pts = [];
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) pts.push(base.clone().addScaledVector(side, sx * rh * 0.75).addScaledVector(up, sy * rh * 0.45));
      const mid = base.clone().addScaledVector(d, rh * 1.2).addScaledVector(up, rh * 0.55);
      pts.push(mid.clone().addScaledVector(side, rh * 0.5), mid.clone().addScaledVector(side, -rh * 0.5));
      pts.push(base.clone().addScaledVector(d, rh * 2.3).addScaledVector(up, rh * 0.15));
      return flat(hull(pts), SW.claw);
    };
    S.push(pclaw(1)); S.push(pclaw(-1));
  };
  // upper pair (bigger, bent forward)
  arm(V(0.2, 0.655, 0.0), V(0.33, 0.6, -0.02), V(0.39, 0.51, 0.06), 0.058, V(0.25, -0.2, 1));
  // lower pair
  arm(V(0.19, 0.505, 0.02), V(0.29, 0.43, 0.06), V(0.3, 0.37, 0.18), 0.05, V(0.05, -0.15, 1));
  // shoulder pauldrons (upper arms) + small lower pads
  S.push(armor([...cbox(V(0.23, 0.685, 0.0), 0.09, 0.05, 0.095, 0.028), V(0.33, 0.655, 0), V(0.21, 0.75, 0)]));
  S.push(flat(shard(V(0.27, 0.72, 0.0), V(0.6, 1, -0.1), 0.032, 0.085), SW.gold));
  S.push(flat(hull([V(0.28, 0.67, 0.093), V(0.31, 0.662, 0.09), V(0.28, 0.682, 0.096), V(0.31, 0.674, 0.093),
    V(0.18, 0.672, 0.096), V(0.18, 0.684, 0.099)]), SW.rune));
  S.push(armor([...cbox(V(0.215, 0.53, 0.02), 0.07, 0.04, 0.075, 0.022), V(0.28, 0.51, 0.02), V(0.2, 0.585, 0.02)]));
  S.push(flat(shard(V(0.245, 0.56, 0.02), V(0.7, 1, 0), 0.022, 0.055), SW.gold));

  const HC = [], HS = [];
  // ================= HEAD (big, faceted, purple helmet, fierce eyes) =================
  const H = { y: 0.86, z: 0.03 };
  HC.push(lime([...cbox(V(0, H.y, H.z), 0.17, 0.12, 0.14, 0.055),
    ...ring(V(0, H.y - 0.15, H.z + 0.05), 0.09, 0.07, 8, 'y'),     // tapered insect jaw
    V(0.175, H.y - 0.06, H.z + 0.05), V(-0.175, H.y - 0.06, H.z + 0.05)], 0.68, 1.0));
  const FZ = H.z + 0.14;
  // helmet: top/back shell with a front forehead plate and a centre crest
  HC.push(armor([...cbox(V(0, H.y + 0.065, H.z - 0.02), 0.185, 0.09, 0.15, 0.055),
    V(0.15, H.y + 0.06, FZ + 0.005), V(-0.15, H.y + 0.06, FZ + 0.005), V(0.1, H.y + 0.13, FZ - 0.005), V(-0.1, H.y + 0.13, FZ - 0.005),
    V(0.19, H.y - 0.06, H.z - 0.06), V(-0.19, H.y - 0.06, H.z - 0.06), V(0.12, H.y - 0.07, H.z - 0.15), V(-0.12, H.y - 0.07, H.z - 0.15)]));
  HC.push(trim([V(0.025, H.y + 0.15, FZ - 0.03), V(-0.025, H.y + 0.15, FZ - 0.03), V(0.025, H.y + 0.15, H.z - 0.16), V(-0.025, H.y + 0.15, H.z - 0.16),
    V(0, H.y + 0.21, H.z - 0.04), V(0, H.y + 0.18, FZ - 0.04), V(0, H.y + 0.13, H.z - 0.185)], H.y + 0.1, H.y + 0.21));
  // forehead gem (glowing)
  HC.push(flat(hull([V(0, H.y + 0.13, FZ + 0.004), V(0, H.y + 0.065, FZ + 0.012), V(0.025, H.y + 0.1, FZ + 0.008), V(-0.025, H.y + 0.1, FZ + 0.008),
    V(0, H.y + 0.1, FZ + 0.03)]), SW.nebula));
  // glowing helmet side runes
  HS.push(flat(hull([V(0.188, H.y + 0.04, H.z + 0.06), V(0.188, H.y + 0.07, H.z - 0.08), V(0.188, H.y + 0.045, H.z - 0.08),
    V(0.198, H.y + 0.04, H.z + 0.06), V(0.198, H.y + 0.07, H.z - 0.08), V(0.198, H.y + 0.045, H.z - 0.08)]), SW.rune));

  // glowing rune diamond on the helmet back
  HC.push(flat(hull([V(0, H.y + 0.12, H.z - 0.168), V(0, H.y + 0.02, H.z - 0.168), V(0.035, H.y + 0.07, H.z - 0.168), V(-0.035, H.y + 0.07, H.z - 0.168),
    V(0, H.y + 0.07, H.z - 0.185)]), SW.rune));
  // fierce eyes (white almond, angry flat top, big pupil, catchlight)
  const E = V(0.072, H.y + 0.01, 0);
  HS.push(flat(hull(plate([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]],
    E, FZ - 0.01, FZ + 0.012)), SW.white));
  HS.push(flat(hull(plate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]],
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye));
  HS.push(flat(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.014, FZ + 0.021)), SW.white));
  // heavy purple brow, slanting down toward the centre
  HS.push(trim([
    V(0.018, E.y + 0.0, FZ + 0.045), V(0.02, E.y + 0.05, FZ + 0.04),
    V(0.14, E.y + 0.045, FZ + 0.02), V(0.14, E.y + 0.09, FZ + 0.01),
    V(0.018, E.y + 0.0, FZ - 0.02), V(0.02, E.y + 0.06, FZ - 0.03),
    V(0.14, E.y + 0.045, FZ - 0.04), V(0.14, E.y + 0.09, FZ - 0.05),
  ], E.y + 0.02, E.y + 0.09));
  // mouth slit + mandibles
  HC.push(flat(hull(cbox(V(0, H.y - 0.1, FZ - 0.006), 0.056, 0.008, 0.01, 0.002)), SW.mouth));
  HS.push(trim([...cbox(V(0.115, H.y - 0.105, FZ - 0.035), 0.032, 0.03, 0.03, 0.01),
    V(0.09, H.y - 0.155, FZ + 0.005), V(0.07, H.y - 0.17, FZ + 0.015), V(0.06, H.y - 0.165, FZ - 0.005)], H.y - 0.17, H.y - 0.07));
  HS.push(flat(hull([V(0.07, H.y - 0.17, FZ + 0.015), V(0.06, H.y - 0.165, FZ - 0.005), V(0.08, H.y - 0.15, FZ + 0.01),
    V(0.038, H.y - 0.19, FZ + 0.012)]), SW.claw));
  // long antennae: purple segmented stalks sweeping up and out, glowing tips
  const aPts = [V(0.08, H.y + 0.135, FZ - 0.05), V(0.17, H.y + 0.18, FZ - 0.05), V(0.29, H.y + 0.23, H.z + 0.0),
    V(0.39, H.y + 0.265, H.z - 0.09), V(0.44, H.y + 0.27, H.z - 0.2)];
  HS.push(paint(tube(curveSamples(aPts, 9, (t) => 0.026 - 0.012 * t), { seg: 6, capEnd: 0.01 }), SW.trim, 'len'));
  HS.push(flat(blob(0, aPts[4].clone().add(V(0.01, 0, -0.01)), V(0.032, 0.032, 0.032)), SW.nebula));

  // ================= FLOATING HALO-CROWN (gold ring + crown points) =================
  const HY = H.y + 0.27, HZ = H.z - 0.03, HR = 0.138, N = 16;
  for (let k = 0; k < N / 2; k++) {
    // build right half (incl. centre-line segments), mirrored
    const a0 = (2 * Math.PI * k) / N - Math.PI / 2, a1 = (2 * Math.PI * (k + 1)) / N - Math.PI / 2;
    const sec = (a) => {
      const c = Math.cos(a), s = Math.sin(a), pts = [];
      for (const [dr, dy] of [[-0.02, 0.024], [0.02, 0.024], [-0.02, -0.024], [0.02, -0.024]])
        pts.push(V(c * (HR + dr), HY + dy, HZ - s * (HR + dr)));
      return pts;
    };
    HS.push(flat(hull([...sec(a0), ...sec(a1)]), SW.gold));
  }
  // crown points on the ring
  HC.push(flat(shard(V(0, HY + 0.03, HZ + HR), V(0, 1, 0.15), 0.03, 0.1), SW.gold));
  HC.push(flat(shard(V(0, HY + 0.03, HZ - HR), V(0, 1, -0.15), 0.026, 0.08), SW.gold));
  for (const a of [Math.PI / 4, -Math.PI / 4, 0.0]) {
    const p = V(Math.sin(Math.PI / 2 + a) * HR, HY + 0.03, Math.cos(Math.PI / 2 + a) * -HR + HZ);
    HS.push(flat(shard(p, V(p.x * 1.2, 1, (p.z - HZ) * 1.2), 0.024, 0.08), SW.gold));
  }
  // floating star gem at the front of the halo
  HC.push(flat(hull([V(0, HY + 0.15, HZ + HR + 0.025), V(0, HY + 0.06, HZ + HR + 0.025), V(0.034, HY + 0.105, HZ + HR + 0.025), V(-0.034, HY + 0.105, HZ + HR + 0.025),
    V(0, HY + 0.105, HZ + HR + 0.052), V(0, HY + 0.105, HZ + HR - 0.002)]), SW.nebula));

  // big-head proportions: scale the head group about the neck
  const HP = V(0, 0.74, 0.02), HSC = 1.22;
  for (const g of [...HC, ...HS]) {
    g.translate(-HP.x, -HP.y, -HP.z); g.scale(HSC, HSC, HSC); g.translate(HP.x, HP.y, HP.z);
  }
  C.push(...HC); S.push(...HS);

  return assemble(C, S);
}

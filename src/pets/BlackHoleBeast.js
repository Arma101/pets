// Black Hole Beast (Divine): pitch-black cosmic golem with violet glowing cracks, a swirling black hole
// in its chest, star speckles, gold armour, a floating gold halo and radiant nebula aura blades.
import { V, THREE, hull, cbox, ring, plate, shard, paint, assemble } from '../kit.js';

// Gradient swatch whose emissive copy is dimmed by `k` (the glow atlas starts black, the colour atlas white).
function hexMul(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * k));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
function dimGlow(top, bot, k) {
  return (g, x, y) => {
    const isGlow = g.getImageData(x + 64, y + 64, 1, 1).data[0] < 8;
    const s = isGlow ? k : 1;
    if (s <= 0) return;
    const t = hexMul(top, s), b = hexMul(bot, s);
    const grad = g.createLinearGradient(0, y + 16, 0, y + 112);
    grad.addColorStop(0, t); grad.addColorStop(1, b);
    g.fillStyle = t; g.fillRect(x, y, 128, 16);
    g.fillStyle = grad; g.fillRect(x, y + 16, 128, 96);
    g.fillStyle = b; g.fillRect(x, y + 112, 128, 16);
  };
}
// The black hole: black core, bright accretion ring, violet spiral arms swirling out to a deep indigo edge.
function drawHole(g, x, y) {
  const cx = x + 64, cy = y + 64, R = 62;
  g.save();
  g.fillStyle = '#2A1250'; g.fillRect(x, y, 128, 128);
  // outer nebula halo
  const rg = g.createRadialGradient(cx, cy, R * 0.3, cx, cy, R);
  rg.addColorStop(0, '#C77DFF'); rg.addColorStop(0.55, '#7A2FE0'); rg.addColorStop(1, '#2A1250');
  g.fillStyle = rg; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
  // spiral arms
  g.lineCap = 'round';
  for (let k = 0; k < 4; k++) {
    for (const [col, w] of [['#E9B8FF', 7], ['#FFFFFF', 2.5]]) {
      g.strokeStyle = col; g.lineWidth = w; g.beginPath();
      for (let i = 0; i <= 24; i++) {
        const r = 0.34 + 0.62 * (i / 24);
        const th = k * Math.PI / 2 + 2.6 * (i / 24);
        const px = cx + Math.cos(th) * r * R, py = cy + Math.sin(th) * r * R;
        if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
      }
      g.stroke();
    }
  }
  // accretion ring
  g.lineWidth = 9; g.strokeStyle = '#F4DCFF'; g.beginPath(); g.arc(cx, cy, R * 0.42, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 3; g.strokeStyle = '#FFFFFF'; g.beginPath(); g.arc(cx, cy, R * 0.42, 0, Math.PI * 2); g.stroke();
  // event horizon
  g.fillStyle = '#000000'; g.beginPath(); g.arc(cx, cy, R * 0.33, 0, Math.PI * 2); g.fill();
  g.restore();
}

export const PALETTE = {
  body:  { i: 0, top: '#4F4960', bot: '#16141C' },
  crack: { i: 1, top: '#DDA6FF', bot: '#A04CFF', glow: true },
  rim:   { i: 10, top: '#EBC4FF', bot: '#B565FF', glow: true },
  gold:  { i: 2, glow: true, draw: dimGlow('#FFE57A', '#E0A12A', 0.3) },
  hole:  { i: 3, glow: true, draw: drawHole },
  white: { i: 4, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:   { i: 5, top: '#1A1416', bot: '#0C0A0B' },
  aura:  { i: 6, glow: true, draw: dimGlow('#FFC4F4', '#7F5CFF', 0.55) },
  star:  { i: 7, top: '#FFFFFF', bot: '#EADFFF', glow: true },
  brow:  { i: 8, top: '#4E485E', bot: '#211E29' },
  gem:   { i: 9, top: '#E3B4FF', bot: '#9446FF', glow: true },
};
const SW = PALETTE;
// swUV-equivalent for custom-drawn gradient cells
const cellUV = (sw, u, t) => {
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  return [(x + 24 + u * 80) / 1024, (y + 16 + THREE.MathUtils.clamp(t, 0, 1) * 96) / 1024];
};
function paintC(g, sw, range) { // like kit paint 'y' but works for custom-drawn swatches too (same layout)
  const p = g.attributes.position; g.computeBoundingBox();
  const lo = range ? range[0] : g.boundingBox.min.y, hi = range ? range[1] : g.boundingBox.max.y;
  const uv = [];
  for (let i = 0; i < p.count; i++) uv.push(...cellUV(sw, 0.5, range === 'flat' ? 0.3 : 1 - (p.getY(i) - lo) / Math.max(1e-6, hi - lo)));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

export function buildGeometry() {
  const C = [], S = [];
  const body = [];       // raycast targets that are "body"
  const armour = [];     // raycast blockers
  const B = (pts, side = true) => { const g = paint(hull(pts), SW.body, 'y', [0.0, 1.0]); (side ? S : C).push(g); body.push({ g, side }); return g; };
  const gold = (g, side = true, lo, hi) => { paintC(g, SW.gold, lo === undefined ? null : [lo, hi]); (side ? S : C).push(g); armour.push(g); return g; };
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= LEGS + FEET =================
  const LX = 0.155;
  B([...ring(V(LX, 0.07, 0.0), 0.085, 0.085, 8), ...ring(V(LX, 0.19, 0.0), 0.1, 0.1, 8),
    ...ring(V(LX - 0.01, 0.33, -0.01), 0.11, 0.11, 8)]);
  // foot block + 3 stubby toes
  B([...cbox(V(LX, 0.045, 0.02), 0.1, 0.045, 0.115, 0.03)]);
  for (const dx of [-0.058, 0, 0.058]) B([...cbox(V(LX + dx, 0.035, 0.13), 0.03, 0.035, 0.035, 0.014)]);
  // gold knee guard + ankle cuff
  gold(hull([...ring(V(LX, 0.085, 0.0), 0.1, 0.1, 8), ...ring(V(LX, 0.115, 0.0), 0.1, 0.1, 8)]), true, 0.08, 0.12);
  gold(hull([V(LX - 0.07, 0.25, 0.07), V(LX + 0.07, 0.25, 0.07), V(LX, 0.15, 0.1), V(LX, 0.29, 0.1),
    V(LX - 0.06, 0.25, 0.115), V(LX + 0.06, 0.25, 0.115), V(LX, 0.17, 0.125), V(LX, 0.28, 0.125)]), true, 0.15, 0.3);

  // ================= PELVIS + BELT =================
  B([...cbox(V(0, 0.34, -0.005), 0.2, 0.07, 0.14, 0.04)], false);
  gold(hull([...ring(V(0, 0.36, -0.005), 0.235, 0.165, 8, 'y'), ...ring(V(0, 0.41, -0.005), 0.235, 0.165, 8, 'y')]), false, 0.35, 0.42);
  // belt buckle with violet gem
  gold(hull(plate([[-0.06, 0.04], [0.06, 0.04], [0.07, 0], [0.06, -0.045], [0, -0.07], [-0.06, -0.045], [-0.07, 0]],
    V(0, 0.385, 0), 0.13, 0.172)), false, 0.32, 0.43);
  C.push(paint(hull(plate([[0, 0.028], [0.026, 0], [0, -0.034], [-0.026, 0]], V(0, 0.38, 0), 0.165, 0.185)), SW.gem, 'y'));

  // ================= TORSO (broad chest, V taper to waist) =================
  B([
    ...ring(V(0, 0.4, -0.01), 0.2, 0.14, 8, 'y'),
    ...ring(V(0, 0.5, -0.0), 0.27, 0.175, 8, 'y'),
    ...ring(V(0, 0.6, -0.01), 0.29, 0.17, 8, 'y'),
    ...ring(V(0, 0.67, -0.02), 0.2, 0.12, 8, 'y'),
  ], false);

  // ================= BLACK HOLE (chest, centre line) =================
  const HC = V(0, 0.52, 0), HR = 0.1;
  const disc = hull(plate(Array.from({ length: 12 }, (_, k) => {
    const a = (k / 12) * Math.PI * 2 + Math.PI / 12; return [Math.cos(a) * HR, Math.sin(a) * HR];
  }), HC, 0.11, 0.178));
  {
    const p = disc.attributes.position, uv = [];
    const x0 = (SW.hole.i % 8) * 128, y0 = Math.floor(SW.hole.i / 8) * 128;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) / HR, v = (p.getY(i) - HC.y) / HR;
      uv.push((x0 + 64 + u * 61) / 1024, (y0 + 64 - v * 61) / 1024);
    }
    disc.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  }
  C.push(disc);
  // glowing accretion rim around the disc
  for (let k = 0; k < 12; k++) {
    const a0 = (k / 12) * Math.PI * 2 + Math.PI / 12, a1 = ((k + 1) / 12) * Math.PI * 2 + Math.PI / 12;
    const pts = [];
    for (const a of [a0, a1]) for (const r of [HR - 0.004, HR + 0.018]) for (const z of [0.12, 0.186])
      pts.push(V(Math.cos(a) * r, HC.y + Math.sin(a) * r, z));
    C.push(paint(hull(pts), SW.rim, 'y', [HC.y - HR - 0.02, HC.y + HR + 0.02]));
    const gp = [];
    for (const a of [a0, a1]) for (const r of [HR + 0.012, HR + 0.034]) for (const z of [0.12, 0.172])
      gp.push(V(Math.cos(a) * r, HC.y + Math.sin(a) * r, z));
    gold(hull(gp), false, HC.y - HR - 0.04, HC.y + HR + 0.04);
  }

  // ================= HEAD (big, blocky, sunk onto the shoulders) =================
  const H = { y: 0.79, z: 0.03 };
  B([
    ...cbox(V(0, H.y, H.z), 0.175, 0.15, 0.15, 0.055),
    ...ring(V(0, H.y + 0.17, H.z - 0.01), 0.12, 0.1, 8, 'y'),
    V(0.19, H.y - 0.09, H.z + 0.07), V(-0.19, H.y - 0.09, H.z + 0.07), // heavy jaw corners
  ], false);
  const FZ = H.z + 0.15;
  // jaw plate / mouth slit (glowing)
  C.push(paint(hull(cbox(V(0, H.y - 0.095, FZ + 0.004), 0.055, 0.008, 0.006, 0.003)), SW.crack, 'y'));

  // fierce eyes (scaled punch_pup eye block)
  const E = V(0.083, H.y + 0.01, 0), k = 1.35;
  const sc = (pts) => pts.map(([u, v]) => [u * k, v * k]);
  S.push(flat(hull(plate(sc([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    E, FZ - 0.01, FZ + 0.012)), SW.white));
  S.push(flat(hull(plate(sc([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(E.x - 0.006, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye));
  S.push(flat(hull(plate([[-0.009, -0.009], [0.009, -0.009], [0.009, 0.009], [-0.009, 0.009]],
    V(E.x + 0.006, E.y + 0.004, 0), FZ + 0.014, FZ + 0.022)), SW.white));
  // heavy brow
  S.push(paint(hull([
    V(0.012, E.y + 0.014, FZ + 0.045), V(0.014, E.y + 0.06, FZ + 0.03),
    V(0.18, E.y + 0.072, FZ + 0.0), V(0.18, E.y + 0.115, FZ - 0.02),
    V(0.012, E.y + 0.014, FZ - 0.03), V(0.014, E.y + 0.07, FZ - 0.04),
    V(0.18, E.y + 0.072, FZ - 0.06), V(0.18, E.y + 0.115, FZ - 0.07),
  ]), SW.brow, 'y'));
  // obsidian crystal horns on the crown, violet-cracked
  S.push(paint(shard(V(0.11, H.y + 0.13, H.z - 0.03), V(0.45, 1, -0.35), 0.045, 0.11, 4, 0.75), SW.gem, 'y', [H.y + 0.1, H.y + 0.26]));
  S.push(paint(shard(V(0.15, H.y + 0.07, H.z - 0.07), V(1, 0.6, -0.5), 0.035, 0.08, 4, 0.75), SW.gem, 'y', [H.y + 0.05, H.y + 0.2]));
  // gold circlet on the forehead with a violet gem
  gold(hull(plate([[-0.05, 0.0], [0.05, 0.0], [0.03, 0.05], [0, 0.07], [-0.03, 0.05]], V(0, H.y + 0.1, 0), FZ - 0.04, FZ + 0.005)), false, H.y + 0.09, H.y + 0.18);
  C.push(paint(hull(plate([[0, 0.02], [0.016, 0], [0, -0.02], [-0.016, 0]], V(0, H.y + 0.13, 0), FZ - 0.01, FZ + 0.012)), SW.gem, 'y'));

  // ================= ARMS (massive shoulders, thick arms, huge fists) =================
  B([...cbox(V(0.3, 0.6, -0.01), 0.1, 0.1, 0.11, 0.04)]);
  B([...ring(V(0.33, 0.58, 0.0), 0.085, 0.085, 8, 'y'), ...ring(V(0.37, 0.42, 0.02), 0.08, 0.08, 8, 'y')]);
  B([...ring(V(0.37, 0.43, 0.02), 0.085, 0.085, 8, 'y'), ...ring(V(0.385, 0.29, 0.05), 0.1, 0.1, 8, 'y')]);
  // fist
  const F = V(0.39, 0.215, 0.05);
  B([...cbox(F, 0.115, 0.1, 0.115, 0.04)]);
  // knuckle row
  for (const dx of [-0.072, -0.024, 0.024, 0.072]) B([...cbox(V(F.x + dx, F.y + 0.035, F.z + 0.115), 0.025, 0.04, 0.03, 0.012)]);
  B([...cbox(V(F.x - 0.1, F.y + 0.0, F.z + 0.05), 0.03, 0.045, 0.04, 0.014)]); // thumb (inner side)
  // gold bracer
  gold(hull([...ring(V(0.38, 0.3, 0.045), 0.112, 0.112, 8, 'y'), ...ring(V(0.375, 0.38, 0.035), 0.1, 0.1, 8, 'y')]), true, 0.29, 0.39);
  // gold pauldron: layered plates + a spike
  gold(hull([...ring(V(0.31, 0.71, -0.01), 0.1, 0.1, 8, 'y'), ...ring(V(0.33, 0.62, -0.01), 0.15, 0.15, 8, 'y'),
    V(0.46, 0.56, -0.01)]), true, 0.55, 0.75);
  gold(hull([...ring(V(0.36, 0.585, -0.01), 0.14, 0.14, 8, 'y'), ...ring(V(0.37, 0.535, -0.01), 0.13, 0.13, 8, 'y')]), true, 0.5, 0.62);
  gold(shard(V(0.32, 0.72, -0.01), V(0.35, 1, 0), 0.05, 0.1, 4, 0.7), true, 0.7, 0.84);
  S.push(paint(hull(plate([[0, 0.025], [0.02, 0], [0, -0.025], [-0.02, 0]], V(0.35, 0.62, 0), 0.13, 0.16)), SW.gem, 'y'));

  // ================= AURA BLADES (radiant wings behind the shoulders) =================
  const kite = (o, dir, len, w, th) => {
    const d = dir.clone().normalize();
    const side = new THREE.Vector3().crossVectors(d, V(0, 0, 1)).normalize();
    const nrm = new THREE.Vector3().crossVectors(side, d).normalize();
    const mid = o.clone().addScaledVector(d, len * 0.35);
    return hull([o, o.clone().addScaledVector(d, len),
      mid.clone().addScaledVector(side, w), mid.clone().addScaledVector(side, -w),
      mid.clone().addScaledVector(nrm, th), mid.clone().addScaledVector(nrm, -th)]);
  };
  const WO = V(0.12, 0.62, -0.17);
  for (const [deg, len, w] of [[14, 0.4, 0.065], [38, 0.54, 0.08], [62, 0.56, 0.08], [86, 0.46, 0.07], [108, 0.32, 0.055]]) {
    const a = (deg * Math.PI) / 180;
    const d = V(Math.sin(a), Math.cos(a), -0.25);
    S.push(paintC(kite(WO, d, len, w, 0.018), SW.aura, [0.6, 1.1]));
  }
  for (const [deg, len] of [[26, 0.34], [50, 0.42], [74, 0.4], [97, 0.3]]) {
    const a = (deg * Math.PI) / 180;
    gold(kite(V(WO.x, WO.y, WO.z + 0.025), V(Math.sin(a), Math.cos(a), -0.2), len, 0.03, 0.014), true, 0.6, 1.0);
  }
  // gold back emblem joining the blades
  gold(hull(plate([[-0.13, 0.05], [0.13, 0.05], [0.16, -0.02], [0, -0.12], [-0.16, -0.02]], V(0, 0.6, 0), -0.2, -0.15)), false, 0.48, 0.66);

  // ================= HALO (floating gold ring above the head) =================
  {
    const HCn = V(0, 1.06, -0.02), R = 0.15, N = 16, tilt = 0.26;
    const q = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), tilt);
    const pt = (a, dr, dy) => V(Math.cos(a) * (R + dr), dy, Math.sin(a) * (R + dr)).applyQuaternion(q).add(HCn);
    for (let i = 0; i < N; i++) {
      const pts = [];
      for (const a of [(i / N) * Math.PI * 2, ((i + 1) / N) * Math.PI * 2])
        for (const [dr, dy] of [[-0.024, 0], [0.024, 0], [0, 0.02], [0, -0.02]]) pts.push(pt(a, dr, dy));
      const g = hull(pts);
      paintC(g, SW.gold, [1.0, 1.12]);
      C.push(g);
    }
  }

  // ================= CRACKS + STARS (projected onto the body surface) =================
  const tagMesh = (g, tag) => { const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })); m.userData.tag = tag; return m; };
  const targets = [];
  for (const { g, side } of body) { targets.push(tagMesh(g, 'body')); if (side) { const m = tagMesh(g.clone(), 'body'); m.scale.x = -1; m.updateMatrixWorld(); targets.push(m); } }
  for (const g of armour) targets.push(tagMesh(g, 'arm'));
  targets.push(tagMesh(disc, 'arm'));
  const rc = new THREE.Raycaster();
  const hit = (o, d) => {
    rc.set(o, d.clone().normalize());
    const h = rc.intersectObjects(targets, false)[0];
    if (!h || h.object.userData.tag !== 'body') return null;
    const n = h.face.normal.clone().transformDirection(h.object.matrixWorld);
    if (n.dot(d) > 0) n.negate();
    return { p: h.point, n };
  };
  // proj: 'f' front (u=x,v=y), 'b' back, 's' right side (u=z,v=y)
  const ray = (proj, u, v) => proj === 'f' ? [V(u, v, 2), V(0, 0, -1)] : proj === 'b' ? [V(u, v, -2), V(0, 0, 1)] : [V(2, v, u), V(-1, 0, 0)];
  const crack = (proj, pts, w0 = 0.03, side = true) => {
    // subdivide
    const fine = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [a, b] = [pts[i], pts[i + 1]];
      const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.035));
      for (let j = 0; j < n; j++) fine.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]);
    }
    fine.push(pts[pts.length - 1]);
    const hs = fine.map(([u, v]) => hit(...ray(proj, u, v)));
    for (let i = 0; i < hs.length - 1; i++) {
      const A = hs[i], Bh = hs[i + 1];
      if (!A || !Bh) continue;
      const t = Bh.p.clone().sub(A.p); const L = t.length(); t.normalize();
      const wa = w0 * (1 - 0.6 * i / (hs.length - 1)), wb = w0 * (1 - 0.6 * (i + 1) / (hs.length - 1));
      const pts6 = [];
      for (const [H2, w, ext] of [[A, wa, -0.006], [Bh, wb, 0.006]]) {
        const p = H2.p.clone().addScaledVector(t, ext);
        const s = new THREE.Vector3().crossVectors(H2.n, t).normalize();
        pts6.push(p.clone().addScaledVector(H2.n, 0.009));
        pts6.push(p.clone().addScaledVector(s, w / 2).addScaledVector(H2.n, -0.02));
        pts6.push(p.clone().addScaledVector(s, -w / 2).addScaledVector(H2.n, -0.02));
      }
      const g = paint(hull(pts6), SW.crack, 'flat');
      (side ? S : C).push(g);
    }
  };
  const star = (proj, u, v, r = 0.013, side = true) => {
    const h = hit(...ray(proj, u, v)); if (!h) return;
    const a = new THREE.Vector3().crossVectors(h.n, Math.abs(h.n.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0)).normalize();
    const b = new THREE.Vector3().crossVectors(h.n, a).normalize();
    const p = h.p;
    // 4-point sparkle: two crossed thin diamonds
    for (const [ax, bx] of [[a, b], [b, a]]) {
      const g = paint(hull([p.clone().addScaledVector(h.n, 0.007), p.clone().addScaledVector(h.n, -0.012),
        p.clone().addScaledVector(ax, r * 1.5), p.clone().addScaledVector(ax, -r * 1.5),
        p.clone().addScaledVector(bx, r * 0.35), p.clone().addScaledVector(bx, -r * 0.35)]), SW.star, 'flat');
      (side ? S : C).push(g);
    }
  };

  // chest cracks radiating from the black hole
  crack('f', [[0.1, 0.56], [0.15, 0.6], [0.17, 0.66], [0.23, 0.64]]);
  crack('f', [[0.1, 0.47], [0.16, 0.45], [0.2, 0.5], [0.25, 0.47]]);
  crack('f', [[0.05, 0.43], [0.08, 0.4]], 0.018);
  // head
  crack('f', [[0.13, H.y + 0.17], [0.1, H.y + 0.12], [0.14, H.y + 0.09]], 0.018);
  crack('s', [[0.08, H.y + 0.1], [0.03, H.y + 0.05], [0.06, H.y - 0.02], [0.0, H.y - 0.07]], 0.02);
  // shoulder / arms (side view)
  crack('s', [[0.02, 0.5], [-0.02, 0.45], [0.03, 0.4], [0.0, 0.34]], 0.02);
  crack('f', [[0.35, 0.27], [0.4, 0.22], [0.37, 0.17], [0.43, 0.13]], 0.02);
  // legs
  crack('s', [[0.0, 0.32], [0.04, 0.25], [0.0, 0.17], [0.03, 0.13]], 0.018);
  // back
  crack('b', [[0.0, 0.47], [0.08, 0.43], [0.12, 0.47], [0.2, 0.44]], 0.022);
  crack('b', [[0.1, 0.86], [0.06, 0.8], [0.1, 0.74]], 0.018);
  crack('b', [[0.13, 0.3], [0.17, 0.24], [0.14, 0.17], [0.18, 0.12]], 0.02);
  crack('b', [[0.3, 0.56], [0.33, 0.5], [0.3, 0.45]], 0.02);

  // star speckles
  for (const [u, v] of [[0.22, 0.56], [0.13, 0.4], [0.24, 0.43], [0.07, 0.64], [0.15, 0.89], [0.04, 0.92], [0.42, 0.2], [0.17, 0.12], [0.36, 0.44], [0.27, 0.6], [0.11, 0.5], [0.3, 0.23], [0.12, 0.75]]) star('f', u, v);
  for (const [u, v] of [[-0.06, 0.55], [0.06, 0.48], [-0.04, 0.84], [0.08, 0.75], [0.0, 0.22], [0.08, 0.27]]) star('s', u, v);
  for (const [u, v] of [[0.16, 0.55], [0.05, 0.38], [0.22, 0.38], [0.08, 0.92], [0.16, 0.22], [0.14, 0.82], [0.38, 0.22], [0.25, 0.48]]) star('b', u, v);

  return assemble(C, S);
}

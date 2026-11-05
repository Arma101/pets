// Lava Lord (Secret, Round 5 – Volcano Crater): towering craggy black-rock giant with molten veins
// and lava-filled joints, obsidian horns, a flame crown and a bold floating ring of fire behind its head.
import { V, THREE, hull, plate, shard, tube, curveSamples, paint, assemble, hash3 } from '../kit.js';

// custom cell: obsidian horn that turns to molten lava at the tip (for 'len' painting, t=1 = tip)
function hornCell(ctx, x, y) {
  const g = ctx.createLinearGradient(0, y + 16, 0, y + 112);
  g.addColorStop(0, '#4A405C'); g.addColorStop(0.62, '#1A1622');
  g.addColorStop(0.7, '#FF6A00'); g.addColorStop(1, '#FFE08A');
  ctx.fillStyle = '#4A405C'; ctx.fillRect(x, y, 128, 16);
  ctx.fillStyle = g; ctx.fillRect(x, y + 16, 128, 96);
  ctx.fillStyle = '#FFE08A'; ctx.fillRect(x, y + 112, 128, 16);
}

export const PALETTE = {
  rock:     { i: 0, top: '#605870', bot: '#27232F' },   // charcoal / dark purple-grey rock
  rockLt:   { i: 1, top: '#766D84', bot: '#3A3442' },   // lighter rock slabs
  obsid:    { i: 2, top: '#3A3248', bot: '#15121C' },   // glossy obsidian
  lava:     { i: 3, top: '#FFA238', bot: '#F05000', glow: true },
  fireOut:  { i: 4, top: '#FFA030', bot: '#E82E00', glow: true },   // outer flame layer (red-orange)
  rune:     { i: 5, top: '#FFE680', bot: '#FFB020', glow: true },
  gold:     { i: 6, top: '#FFE07A', bot: '#D79A1E' },
  white:    { i: 7, top: '#FFFFFF', bot: '#F1F1F4' },
  pupil:    { i: 8, top: '#1A1416', bot: '#0C0A0B' },
  horn:     { i: 9, draw: hornCell, glow: true },
  fireIn:   { i: 10, top: '#FFF8C8', bot: '#FFB800', glow: true }, // inner flame layer (yellow)
};
const P = PALETTE;

// symmetric n-gon ring (mirror-symmetric about x=0); jit = radial rock jitter, jy = vertical jitter
function sring(c, rA, rB, n, axis = 'y', jit = 0, jy = 0) {
  const pts = [], ph = Math.PI / 2 - Math.PI / n;
  for (let k = 0; k < n; k++) {
    const a = ph + (2 * Math.PI * k) / n;
    const u = Math.cos(a) * rA, v = Math.sin(a) * rB;
    let p;
    if (axis === 'y') p = V(c.x + u, c.y, c.z + v);
    else if (axis === 'z') p = V(c.x + u, c.y + v, c.z);
    else p = V(c.x, c.y + v, c.z + u);
    if (jit || jy) {
      const ax = +Math.abs(p.x).toFixed(3), ay = +p.y.toFixed(3), az = +p.z.toFixed(3);
      const r = 1 + (hash3(ax, ay, az) - 0.5) * jit;
      p.x = c.x + (p.x - c.x) * r; p.z = c.z + (p.z - c.z) * r; p.y = c.y + (p.y - c.y) * r;
      p.y += (hash3(az + 3.1, ax, ay) - 0.5) * jy;
    }
    pts.push(p);
  }
  return pts;
}
// craggy boulder: stacked jittered rings
function boulder(c, levels, n, jit, jy) {
  const pts = [];
  for (const [dy, rA, rB, dx = 0, dz = 0] of levels) pts.push(...sring(V(c.x + dx, c.y + dy, c.z + dz), rA, rB, n, 'y', jit, jy));
  return hull(pts);
}
// simple 8-corner box (12 tris)
const box = (c, hx, hy, hz) => {
  const q = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) q.push(V(c.x + sx * hx, c.y + sy * hy, c.z + sz * hz));
  return q;
};

// ---- surface-hugging glowing seams (raycast onto a part, then raised strips) ----
const _rc = new THREE.Raycaster();
function surf(geo, center, target) {
  const mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const mesh = new THREE.Group();
  for (const g of [].concat(geo)) mesh.add(new THREE.Mesh(g, mat));
  const dir = target.clone().sub(center).normalize();
  _rc.set(center.clone().addScaledVector(dir, 5), dir.clone().negate());
  const hit = _rc.intersectObject(mesh, true)[0];
  if (!hit) return null;
  return { p: hit.point, n: hit.face.normal.clone().normalize() };
}
// jagged crack: zig-zag midpoints, width tapers w0 -> w1
function seam(out, geo, center, path, sw, w0 = 0.018, w1 = 0.007, zig = 0.28) {
  const pts = [path[0]];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1], d = b.clone().sub(a);
    const radial = a.clone().add(b).multiplyScalar(0.5).sub(center).normalize();
    const perp = new THREE.Vector3().crossVectors(d, radial).normalize();
    const sgn = hash3(Math.abs(a.x) * 7.3, a.y * 5.1, a.z * 3.7) > 0.5 ? 1 : -1;
    const mid = a.clone().lerp(b, 0.5).addScaledVector(perp, sgn * zig * d.length());
    for (const [s, e] of [[a, mid], [mid, b]]) {
      const k = Math.max(1, Math.ceil(s.distanceTo(e) / 0.06));
      for (let j = 1; j <= k; j++) pts.push(s.clone().lerp(e, j / k));
    }
  }
  const hs = pts.map((p) => surf(geo, center, p)).filter(Boolean);
  for (let i = 0; i < hs.length - 1; i++) {
    const A = hs[i], B = hs[i + 1];
    const t0 = i / (hs.length - 1), t1 = (i + 1) / (hs.length - 1);
    const n = A.n.clone().add(B.n).normalize();
    const d = B.p.clone().sub(A.p);
    const side = new THREE.Vector3().crossVectors(d, n).normalize();
    const ext = d.clone().normalize().multiplyScalar(0.005);
    const q = [];
    for (const [P0, w] of [[A.p.clone().sub(ext), w0 + (w1 - w0) * t0], [B.p.clone().add(ext), w0 + (w1 - w0) * t1]]) {
      for (const s of [-1, 1]) {
        q.push(P0.clone().addScaledVector(side, s * w).addScaledVector(n, -0.008));
        q.push(P0.clone().addScaledVector(side, s * w * 0.75).addScaledVector(n, 0.009));
      }
    }
    out.push(paint(hull(q), sw, 'flat'));
  }
}

// gradient along a direction (t=0 at base -> top colour, t=1 at tip -> bot colour)
function paintDir(g, sw, base, dir, len) {
  const p = g.attributes.position, d = dir.clone().normalize(), uv = [];
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  for (let i = 0; i < p.count; i++) {
    const t = THREE.MathUtils.clamp(V(p.getX(i), p.getY(i), p.getZ(i)).sub(base).dot(d) / len, 0, 1);
    uv.push((x + 64) / 1024, (y + 16 + t * 96) / 1024);
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
// wide faceted flame tongue: base width w along `tan`, thickness along `dep`, leaning tip
function flame(base, dir, tan, w, len, sw, lean = 0.25) {
  const d = dir.clone().normalize(), t = tan.clone().normalize();
  const dep = new THREE.Vector3().crossVectors(d, t).normalize();
  const q = [];
  for (const s of [-1, 1]) {
    q.push(base.clone().addScaledVector(t, s * w));
    q.push(base.clone().addScaledVector(dep, s * w * 0.4).addScaledVector(d, len * 0.08));
    q.push(base.clone().addScaledVector(d, len * 0.45).addScaledVector(t, s * w * 0.72 + lean * w * 0.5).addScaledVector(dep, s * w * 0.18));
  }
  q.push(base.clone().addScaledVector(d, len).addScaledVector(t, lean * w));
  return paintDir(hull(q), sw, base, d, len);
}
// bar glyph in a local frame: p0/p1 are 2D (u,v), th = thickness, from z0 to z1 along nrm
function bar(o, ua, va, nrm, p0, p1, th, z0, z1) {
  const a = V(p0[0], p0[1], 0), b = V(p1[0], p1[1], 0), d = b.clone().sub(a).normalize();
  const s = V(-d.y, d.x, 0).multiplyScalar(th / 2), e = d.clone().multiplyScalar(th / 2);
  const q = [];
  for (const P0 of [a.clone().sub(e), b.clone().add(e)]) for (const sg of [-1, 1]) for (const z of [z0, z1]) {
    const u = P0.x + sg * s.x, v = P0.y + sg * s.y;
    q.push(o.clone().addScaledVector(ua, u).addScaledVector(va, v).addScaledVector(nrm, z));
  }
  return hull(q);
}


export function buildGeometry() {
  const C = [], S = [];
  const rock = (g, lo, hi, sw = P.rock) => paint(g, sw, 'y', [lo, hi]);
  const obs = (g) => paint(g, P.obsid, 'flat');
  const lava = (g, lo, hi) => paint(g, P.lava, 'y', lo === undefined ? null : [lo, hi]);

  // ================= LEGS (short, thick, planted; lava knee joints) =================
  const shinC = V(0.17, 0.16, 0.01);
  const shin = boulder(shinC, [[-0.085, 0.1, 0.1], [0.0, 0.118, 0.115], [0.085, 0.105, 0.1]], 7, 0.22, 0.02);
  S.push(rock(shin, 0.05, 0.28));
  S.push(lava(hull([...sring(V(0.165, 0.22, 0.01), 0.085, 0.085, 6), ...sring(V(0.165, 0.33, 0.0), 0.085, 0.085, 6)])));
  const thighC = V(0.16, 0.38, 0.0);
  const thigh = boulder(thighC, [[-0.07, 0.105, 0.105], [0.0, 0.125, 0.12], [0.07, 0.11, 0.105]], 7, 0.22, 0.02);
  S.push(rock(thigh, 0.28, 0.46));
  // feet: craggy flat-bottomed block + 3 obsidian claws
  S.push(rock(hull([...sring(V(0.175, 0, 0.035), 0.12, 0.14, 7), ...sring(V(0.175, 0.095, 0.015), 0.1, 0.11, 7, 'y', 0.25, 0.02)]), 0, 0.1, P.rockLt));
  for (const dx of [-0.065, 0, 0.065])
    S.push(obs(shard(V(0.175 + dx, 0.04, 0.15), V(dx * 2, -0.3, 1), 0.03, 0.065, 4)));

  // ================= PELVIS / WAIST (lava core showing between rock masses) =================
  C.push(rock(hull([...sring(V(0, 0.32, 0), 0.2, 0.13, 7, 'y', 0.3, 0.04), ...sring(V(0, 0.385, 0.005), 0.245, 0.16, 7, 'y', 0.3, 0.04), ...sring(V(0, 0.45, 0), 0.22, 0.14, 7, 'y', 0.25, 0.03)]), 0.25, 0.48));
  C.push(lava(hull([...sring(V(0, 0.42, 0), 0.2, 0.13, 8), ...sring(V(0, 0.53, -0.01), 0.2, 0.13, 8)])));

  // ================= TORSO (massive top-heavy boulder + big rock slabs) =================
  const torsoC = V(0, 0.68, 0);
  const torso = boulder(V(0, 0, 0), [
    [0.5, 0.21, 0.15, 0, -0.01], [0.6, 0.27, 0.18], [0.72, 0.31, 0.2], [0.84, 0.3, 0.19, 0, -0.02], [0.93, 0.17, 0.12, 0, -0.03],
  ], 8, 0.22, 0.04);
  C.push(rock(torso, 0.45, 0.94));
  // chest slabs (tilted, craggy)
  const pec = hull([V(0.035, 0.85, 0.15), V(0.2, 0.86, 0.12), V(0.29, 0.75, 0.1), V(0.27, 0.64, 0.14),
    V(0.15, 0.58, 0.2), V(0.035, 0.6, 0.205), V(0.04, 0.76, 0.245), V(0.17, 0.79, 0.225), V(0.21, 0.67, 0.215),
    V(0.035, 0.62, 0.1), V(0.25, 0.64, 0.06)]);
  S.push(rock(pec, 0.56, 0.86, P.rockLt));
  // back slabs (tectonic plates)
  const backSlab = hull([V(0.04, 0.88, -0.14), V(0.22, 0.88, -0.13), V(0.27, 0.72, -0.15), V(0.06, 0.66, -0.2),
    V(0.05, 0.85, -0.235), V(0.19, 0.84, -0.225), V(0.22, 0.73, -0.235), V(0.07, 0.69, -0.255), V(0.15, 0.62, -0.18)]);
  S.push(rock(backSlab, 0.6, 0.9, P.rockLt));

  // ================= SHOULDERS (craggy boulders, obsidian crystals, lava joint) =================
  const shC = V(0.345, 0.84, -0.01);
  const shoulder = boulder(shC, [[-0.1, 0.11, 0.12], [-0.01, 0.16, 0.155, 0.01], [0.09, 0.1, 0.1, -0.01]], 6, 0.32, 0.05);
  S.push(rock(shoulder, 0.7, 0.98, P.rockLt));
  S.push(lava(hull([...sring(V(0.4, 0.66, 0.0), 0.075, 0.075, 6), ...sring(V(0.39, 0.77, 0.0), 0.08, 0.08, 6)])));
  S.push(obs(shard(V(0.35, 0.92, -0.05), V(0.3, 1, -0.3), 0.06, 0.17, 4)));
  S.push(obs(shard(V(0.45, 0.86, -0.03), V(1, 0.6, -0.1), 0.045, 0.12, 4)));

  // ================= ARMS (thick, lava elbows, big craggy fists) =================
  const upperC = V(0.42, 0.6, 0.0);
  const upper = boulder(upperC, [[0.08, 0.085, 0.085, -0.01], [-0.05, 0.082, 0.082, 0.01]], 6, 0.22, 0.02);
  S.push(rock(upper, 0.5, 0.72));
  S.push(lava(hull([...sring(V(0.435, 0.47, 0.01), 0.07, 0.07, 6), ...sring(V(0.43, 0.56, 0.0), 0.07, 0.07, 6)])));
  const foreC = V(0.46, 0.41, 0.02);
  const fore = boulder(foreC, [[0.09, 0.09, 0.09, -0.015, -0.01], [0.0, 0.118, 0.11], [-0.09, 0.1, 0.095, 0.005, 0.01]], 6, 0.25, 0.03);
  S.push(rock(fore, 0.3, 0.52, P.rockLt));
  S.push(obs(shard(V(0.55, 0.43, 0.0), V(1, 0.5, -0.2), 0.04, 0.1, 4)));
  // lava wrist + fist
  S.push(lava(hull([...sring(V(0.465, 0.28, 0.03), 0.075, 0.075, 6), ...sring(V(0.465, 0.33, 0.03), 0.075, 0.075, 6)])));
  const fistC = V(0.47, 0.215, 0.04);
  const fist = boulder(fistC, [[-0.08, 0.085, 0.085], [-0.02, 0.105, 0.105], [0.05, 0.1, 0.1], [0.075, 0.075, 0.08]], 6, 0.25, 0.025);
  S.push(rock(fist, 0.13, 0.3));
  for (const dz of [-0.05, 0.0, 0.05]) S.push(rock(hull(box(V(0.535, 0.2 + Math.abs(dz) * 0.2, 0.05 + dz), 0.04, 0.035, 0.022)), 0.14, 0.26, P.rockLt));

  // ================= HEAD (big, craggy, sunk between the shoulders) =================
  const H = { y: 1.03, z: 0.08 }, HY = 0.19;
  const FZ = H.z + 0.17;
  const headC = V(0, H.y, H.z);
  const head = hull([
    V(0.2, H.y + 0.14, FZ), V(-0.2, H.y + 0.14, FZ), V(0.19, H.y - 0.11, FZ), V(-0.19, H.y - 0.11, FZ),
    V(0.245, H.y + 0.04, FZ - 0.05), V(-0.245, H.y + 0.04, FZ - 0.05),
    ...sring(V(0, H.y + HY, H.z - 0.01), 0.17, 0.13, 7, 'y', 0.25, 0.03),
    ...sring(V(0, H.y + 0.06, H.z - 0.03), 0.245, 0.15, 8, 'y', 0.2, 0.04),
    ...sring(V(0, H.y - 0.15, H.z - 0.03), 0.19, 0.13, 7, 'y', 0.2, 0.02),
  ]);
  C.push(rock(head, 0.86, 1.22));
  // big jutting jaw
  C.push(rock(hull([V(0.16, H.y - 0.085, FZ + 0.04), V(-0.16, H.y - 0.085, FZ + 0.04), V(0.14, H.y - 0.2, FZ + 0.03), V(-0.14, H.y - 0.2, FZ + 0.03),
    V(0, H.y - 0.22, FZ + 0.02), ...sring(V(0, H.y - 0.15, H.z), 0.2, 0.12, 7, 'y', 0.2, 0.02)]), 0.8, 1.0, P.rockLt));
  // determined grimace: flat glowing slot with rock teeth
  const MY = H.y - 0.14;
  C.push(lava(hull(box(V(0, MY, FZ + 0.025), 0.12, 0.016, 0.022))));
  // two short rock tusks jutting up from the lower lip (determined snarl)
  S.push(rock(hull([V(0.058, MY - 0.024, FZ + 0.058), V(0.1, MY - 0.024, FZ + 0.058), V(0.062, MY - 0.024, FZ + 0.03), V(0.1, MY - 0.024, FZ + 0.03),
    V(0.086, MY + 0.04, FZ + 0.05), V(0.09, MY + 0.035, FZ + 0.036)]), MY - 0.03, MY + 0.04, P.rockLt));
  // nose ridge
  C.push(rock(hull([V(0, H.y + 0.04, FZ + 0.05), V(0.035, H.y - 0.055, FZ + 0.03), V(-0.035, H.y - 0.055, FZ + 0.03),
    V(0, H.y - 0.065, FZ + 0.06), V(0.04, H.y - 0.06, FZ - 0.01), V(-0.04, H.y - 0.06, FZ - 0.01), V(0, H.y + 0.05, FZ - 0.01)]), 0.92, 1.08, P.rockLt));
  // fierce eyes: lava rim, white almond with angry flat top, big pupil, square catchlight
  const E = V(0.1, H.y + 0.005, 0);
  const almond = [[-0.054, 0.004], [0.058, 0.042], [0.065, -0.012], [0.026, -0.05], [-0.038, -0.046], [-0.058, -0.02]];
  S.push(lava(hull(plate(almond.map(([u, v]) => [u * 1.22, v * 1.28]), E, FZ - 0.012, FZ + 0.004))));
  S.push(paint(hull(plate(almond, E, FZ - 0.01, FZ + 0.012)), P.white, 'flat'));
  S.push(paint(hull(plate([[-0.038, 0.004], [0.02, 0.025], [0.03, -0.01], [0.008, -0.041], [-0.028, -0.038], [-0.043, -0.015]],
    V(E.x - 0.006, E.y, 0), FZ + 0.006, FZ + 0.019)), P.pupil, 'flat'));
  S.push(paint(hull(plate([[-0.009, -0.009], [0.009, -0.009], [0.009, 0.009], [-0.009, 0.009]],
    V(E.x + 0.003, E.y + 0.003, 0), FZ + 0.015, FZ + 0.023)), P.white, 'flat'));
  // HEAVY jutting brow ridge (two halves meet in a V over the nose)
  S.push(rock(hull([
    V(0.0, E.y + 0.03, FZ + 0.075), V(0.0, E.y + 0.09, FZ + 0.065),
    V(0.245, E.y + 0.075, FZ + 0.015), V(0.25, E.y + 0.14, FZ - 0.005),
    V(0.0, E.y + 0.035, FZ - 0.04), V(0.0, E.y + 0.1, FZ - 0.05),
    V(0.25, E.y + 0.07, FZ - 0.07), V(0.25, E.y + 0.14, FZ - 0.08), V(0.13, E.y + 0.13, FZ + 0.04),
  ]), 0.98, 1.2, P.rockLt));

  // ================= HORNS (obsidian, curving out, up and forward, lava tips) =================
  S.push(paint(tube(curveSamples(
    [V(0.2, H.y + 0.1, H.z - 0.02), V(0.3, H.y + 0.12, H.z - 0.03), V(0.38, H.y + 0.19, H.z - 0.02),
      V(0.39, H.y + 0.3, H.z + 0.02), V(0.33, H.y + 0.38, H.z + 0.09)],
    7, (t) => 0.075 * (1 - t) + 0.008), { seg: 6, capEnd: 0.0 }), P.horn, 'len'));

  // ================= FLAME CROWN (gold band, molten pool, layered flames) =================
  const CY = H.y + HY + 0.01, CZ = H.z - 0.01;
  C.push(paint(hull([...sring(V(0, CY - 0.035, CZ), 0.19, 0.15, 8), ...sring(V(0, CY + 0.045, CZ), 0.18, 0.14, 8)]), P.gold, 'y', [CY - 0.04, CY + 0.05]));
  C.push(lava(hull([...sring(V(0, CY + 0.04, CZ), 0.16, 0.12, 8), ...sring(V(0, CY + 0.053, CZ), 0.15, 0.11, 8)])));
  const crownFlame = (x, z, out, len, w, inC) => {
    const b = V(x, CY + 0.03, z), d = V(out.x * 0.35, 1, out.z * 0.35), tan = V(-out.z, 0, out.x);
    const arr = inC ? C : S;
    arr.push(flame(b, d, tan.lengthSq() ? tan : V(1, 0, 0), w, len, P.fireOut, 0));
    arr.push(flame(b.clone().addScaledVector(out, 0.025), d, tan.lengthSq() ? tan : V(1, 0, 0), w * 0.6, len * 0.62, P.fireIn, 0));
  };
  crownFlame(0, CZ + 0.13, V(0, 0, 1), 0.2, 0.06, true);
  crownFlame(0, CZ - 0.13, V(0, 0, -1), 0.14, 0.05, true);
  crownFlame(0.11, CZ + 0.1, V(0.6, 0, 0.8), 0.15, 0.05, false);
  crownFlame(0.17, CZ, V(1, 0, 0), 0.12, 0.05, false);
  crownFlame(0.11, CZ - 0.1, V(0.6, 0, -0.8), 0.11, 0.045, false);
  C.push(paint(hull(plate([[0, 0.028], [0.022, 0], [0, -0.028], [-0.022, 0]], V(0, CY + 0.005, 0), CZ + 0.14, CZ + 0.165)), P.rune, 'flat'));

  // ================= RING OF FIRE (bold floating halo behind the head) =================
  const R = { y: H.y - 0.04, z: H.z - 0.33 }, r0 = 0.455, r1 = 0.535, nHalf = 9;
  for (let k = 0; k < nHalf; k++) {
    const a0 = -Math.PI / 2 + (Math.PI * k) / nHalf, a1 = a0 + Math.PI / nHalf;
    const q = [];
    for (const a of [a0, a1]) {
      const c = Math.cos(a) + (k === 0 && a === a0 ? 0 : 0), s = Math.sin(a);
      const x = (r) => Math.max(c * r, 0);
      for (const [r, dz] of [[r0, -0.03], [r0, 0.03], [r1, -0.03], [r1, 0.03], [r0 - 0.016, 0], [r1 + 0.016, 0]])
        q.push(V(x(r), R.y + s * r, R.z + dz));
    }
    S.push(lava(hull(q), R.y - r1, R.y + r1));
  }
  // flames: big at the top, smaller toward the bottom; red-orange outer + yellow inner (front) layers
  const ringFlame = (deg, len, arr) => {
    const a = (deg * Math.PI) / 180, out = V(Math.cos(a), Math.sin(a), 0);
    const dir = out.clone().add(V(0, 0.55, 0)).normalize();
    const tan = V(-Math.sin(a), Math.cos(a), 0);
    const b = V(Math.max(0, Math.cos(a) * (r1 - 0.01)), R.y + Math.sin(a) * (r1 - 0.01), R.z);
    const lean = deg === 90 ? 0 : 0.35;
    arr.push(flame(b, dir, tan, len * 0.5, len, P.fireOut, lean));
    arr.push(flame(b.clone().add(V(0, 0, 0.03)), dir, tan, len * 0.32, len * 0.65, P.fireIn, lean));
  };
  ringFlame(90, 0.08, C);
  for (const [deg, len] of [[67, 0.1], [44, 0.115], [21, 0.115], [-2, 0.1], [-25, 0.085], [-48, 0.07]]) ringFlame(deg, len, S);

  // ================= FLOATING OBSIDIAN CRYSTALS (mirrored, near shoulders) =================
  const fc = V(0.64, 0.76, 0.06);
  S.push(obs(hull([...sring(V(fc.x, fc.y, fc.z), 0.05, 0.05, 6), V(fc.x, fc.y + 0.12, fc.z)])));
  S.push(obs(hull([...sring(V(fc.x, fc.y - 0.022, fc.z), 0.05, 0.05, 6), V(fc.x, fc.y - 0.11, fc.z)])));
  S.push(lava(hull([...sring(V(fc.x, fc.y - 0.024, fc.z), 0.058, 0.058, 6), ...sring(V(fc.x, fc.y + 0.002, fc.z), 0.058, 0.058, 6)])));

  // ================= CARVED RUNES (raised glowing glyphs on obsidian plates) =================
  const chest = [torso, pec];
  {
    const hc = surf(chest, V(0.03, 0.73, 0), V(0.03, 0.73, 0.5));
    const PZ = hc.p.z + 0.04, o = V(0, 0.73, PZ), X = V(1, 0, 0), Y = V(0, 1, 0), Z = V(0, 0, 1);
    C.push(paint(hull([...sring(V(0, 0.73, PZ - 0.08), 0.15, 0.15, 6, 'z'), ...sring(V(0, 0.73, PZ), 0.13, 0.13, 6, 'z')]), P.obsid, 'y', [0.6, 0.86]));
    C.push(lava(hull([...sring(V(0, 0.73, PZ - 0.09), 0.172, 0.172, 6, 'z'), ...sring(V(0, 0.73, PZ - 0.016), 0.16, 0.16, 6, 'z')])));
    // volcano glyph: chunky peak + base bar + erupting diamond
    S.push(paint(bar(o, X, Y, Z, [0.0, 0.045], [0.072, -0.055], 0.03, -0.006, 0.014), P.rune, 'flat'));
    C.push(paint(bar(o, X, Y, Z, [-0.085, -0.07], [0.085, -0.07], 0.028, -0.006, 0.014), P.rune, 'flat'));
    C.push(paint(hull(plate([[0, 0.03], [0.02, 0], [0, -0.03], [-0.02, 0]], V(0, 0.73 + 0.085, 0), PZ - 0.006, PZ + 0.014)), P.rune, 'flat'));
  }
  {
    const nrm = V(0.5, 0.5, 0.7).normalize();
    const hit = surf(shoulder, shC, shC.clone().addScaledVector(nrm, 0.4));
    const ua = new THREE.Vector3().crossVectors(V(0, 1, 0), nrm).normalize(), va = new THREE.Vector3().crossVectors(nrm, ua).normalize();
    const o = hit.p.clone().addScaledVector(nrm, 0.02);
    const hex = (r, z) => { const q = []; for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + (k * Math.PI) / 3; q.push(o.clone().addScaledVector(ua, Math.cos(a) * r).addScaledVector(va, Math.sin(a) * r).addScaledVector(nrm, z)); } return q; };
    S.push(obs(hull([...hex(0.085, -0.06), ...hex(0.075, 0)])));
    S.push(lava(hull([...hex(0.102, -0.07), ...hex(0.095, -0.014)])));
    // flame-arrow glyph
    for (const [p0, p1] of [[[0, -0.05], [0, 0.05]], [[-0.038, 0.0], [0.038, 0.0]], [[-0.038, -0.006], [-0.038, 0.04]], [[0.038, -0.006], [0.038, 0.04]]])
      S.push(paint(bar(o, ua, va, nrm, p0, p1, 0.02, -0.006, 0.014), P.rune, 'flat'));
  }

  // ================= MOLTEN VEINS (jagged branching cracks) =================
  const VR = [];
  // pec slab crack running out to the shoulder
  seam(VR, chest, torsoC, [V(0.14, 0.71, 0.3), V(0.21, 0.75, 0.3), V(0.29, 0.73, 0.2)], P.lava, 0.017, 0.006, 0.18);
  seam(VR, chest, torsoC, [V(0.12, 0.83, 0.3), V(0.19, 0.84, 0.25)], P.lava, 0.012, 0.005, 0.15);
  // abdomen: trunk from below the rune down into the waist, with a branch
  seam(VR, torso, torsoC, [V(0.03, 0.6, 0.3), V(0.05, 0.53, 0.3)], P.lava, 0.02, 0.012, 0.2);
  seam(VR, torso, torsoC, [V(0.05, 0.56, 0.3), V(0.16, 0.55, 0.3), V(0.24, 0.6, 0.2)], P.lava, 0.014, 0.005);
  // back: big trunk between slabs + branches
  seam(VR, torso, torsoC, [V(0.015, 0.9, -0.3), V(0.02, 0.76, -0.3), V(0.04, 0.6, -0.3), V(0.08, 0.5, -0.3)], P.lava, 0.024, 0.01, 0.15);
  seam(VR, torso, torsoC, [V(0.04, 0.62, -0.3), V(0.16, 0.6, -0.3), V(0.27, 0.54, -0.15)], P.lava, 0.015, 0.005);
  seam(VR, backSlab, V(0.15, 0.76, 0), [V(0.1, 0.84, -0.3), V(0.17, 0.75, -0.3), V(0.22, 0.7, -0.3)], P.lava, 0.013, 0.005);
  // arms
  seam(VR, fore, foreC, [V(0.45, 0.5, 0.15), V(0.47, 0.4, 0.15), V(0.46, 0.33, 0.15)], P.lava, 0.017, 0.007);
  seam(VR, fore, foreC, [V(0.47, 0.42, 0.15), V(0.58, 0.38, 0.05)], P.lava, 0.011, 0.005);
  seam(VR, upper, upperC, [V(0.52, 0.67, 0.0), V(0.52, 0.56, 0.05)], P.lava, 0.013, 0.006);
  seam(VR, shoulder, shC, [V(0.33, 0.93, -0.1), V(0.45, 0.85, -0.12), V(0.5, 0.76, -0.05)], P.lava, 0.015, 0.006);
  // legs
  seam(VR, thigh, thighC, [V(0.13, 0.44, 0.15), V(0.17, 0.33, 0.15)], P.lava, 0.016, 0.007);
  seam(VR, shin, shinC, [V(0.15, 0.24, 0.15), V(0.18, 0.15, 0.15), V(0.15, 0.08, 0.15)], P.lava, 0.016, 0.006);
  seam(VR, shin, shinC, [V(0.3, 0.23, 0.0), V(0.29, 0.1, 0.03)], P.lava, 0.013, 0.005);
  seam(VR, thigh, thighC, [V(0.18, 0.44, -0.15), V(0.15, 0.33, -0.15)], P.lava, 0.013, 0.005);
  // head: temple crack and back-of-skull crack
  seam(VR, head, headC, [V(0.24, H.y + 0.15, H.z), V(0.25, H.y + 0.03, H.z + 0.03), V(0.22, H.y - 0.1, H.z + 0.05)], P.lava, 0.015, 0.006);
  seam(VR, head, headC, [V(0.012, H.y + 0.17, H.z - 0.3), V(0.02, H.y + 0.06, H.z - 0.3), V(0.1, H.y - 0.02, H.z - 0.3), V(0.17, H.y - 0.12, H.z - 0.25)], P.lava, 0.018, 0.006, 0.15);
  S.push(...VR);

  return assemble(C, S);
}

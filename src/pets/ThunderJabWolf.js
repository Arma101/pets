// Thunder Jab Wolf (Robux egg, Legends Egg): dark navy wolf, yellow lightning mane, electric fur,
// battle scars, ornate gold armour with glowing cyan runes.
import { V, THREE, hull, cbox, ring, plate, shard, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  navy:   { i: 0, top: '#3A5099', bot: '#1C2858' },
  navyD:  { i: 1, top: '#2A3B78', bot: '#141C44' },
  steel:  { i: 2, top: '#A6B4DE', bot: '#6B7BB2' },
  bolt:   { i: 3, top: '#FFF15A', bot: '#FFC000', glow: true },
  gold:   { i: 4, top: '#FFD95E', bot: '#C17E10' },
  rune:   { i: 5, top: '#C8FDFF', bot: '#3FD8FF', glow: true },
  white:  { i: 6, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:    { i: 7, top: '#1A1416', bot: '#0C0A0B' },
  nose:   { i: 8, top: '#30303C', bot: '#121218' },
  mouth:  { i: 9, top: '#3A1F2A', bot: '#24121A' },
  scar:   { i: 10, top: '#E4EAFB', bot: '#BFC9EA' },
  goldD:  { i: 11, top: '#E2A92C', bot: '#9A600A' },
  navyF:  { i: 12, top: '#4A62B0', bot: '#22306A' },
};
const P = PALETTE;

// oriented slab: 2D polygon in (U,Vv) frame at origin o, extruded along N between t0..t1
const slab = (pts2d, o, U, Vv, N, t0, t1) => hull(pts2d.flatMap(([u, v]) => [t0, t1].map((t) =>
  o.clone().addScaledVector(U, u).addScaledVector(Vv, v).addScaledVector(N, t))));
// line-segment glyph (list of [u0,v0,u1,v1] in -1..1) -> list of slabs
function glyph(segs, o, U, Vv, N, s, w, t0, t1, sw) {
  const out = [];
  for (const [u0, v0, u1, v1] of segs) {
    const dx = u1 - u0, dy = v1 - v0, L = Math.hypot(dx, dy);
    const nx = (-dy / L) * w / 2 / s, ny = (dx / L) * w / 2 / s;
    const ex = (dx / L) * w / 2 / s, ey = (dy / L) * w / 2 / s;
    const pts = [[u0 - ex + nx, v0 - ey + ny], [u0 - ex - nx, v0 - ey - ny], [u1 + ex - nx, v1 + ey - ny], [u1 + ex + nx, v1 + ey + ny]]
      .map(([u, v]) => [u * s, v * s]);
    out.push(paint(slab(pts, o, U, Vv, N, t0, t1), sw, 'flat'));
  }
  return out;
}
const RUNES = {
  tiwaz: [[0, -1, 0, 1], [0, 1, -0.65, 0.35], [0, 1, 0.65, 0.35]],
  bolt: [[-0.45, 1, 0.35, 0.12], [0.35, 0.12, -0.35, -0.12], [-0.35, -0.12, 0.45, -1]],
  diamond: [[0, 1, 0.65, 0], [0.65, 0, 0, -1], [0, -1, -0.65, 0], [-0.65, 0, 0, 1]],
  star: [[0, -1, 0, 1], [-0.75, 0.55, 0.75, -0.55], [0.75, 0.55, -0.75, -0.55]],
};

// Decal ribbon: a polyline (u,v) in a projection frame is ray-cast onto target hulls along -N and laid
// as a thin strip `off` above the surface (follows facets, so it stays flush and never floats).
const _rc = new THREE.Raycaster();
const _mat = new THREE.MeshBasicMaterial();
function decal(targets, poly, o, U, Vv, N, width, sw, off = 0.005, step = 0.01) {
  const meshes = targets.map((g) => new THREE.Mesh(g, _mat));
  const cast = (u, v) => {
    const org = o.clone().addScaledVector(U, u).addScaledVector(Vv, v).addScaledVector(N, 0.6);
    _rc.set(org, N.clone().negate());
    const h = _rc.intersectObjects(meshes, false)[0];
    if (!h) return null;
    return { p: h.point.clone().addScaledVector(h.face.normal, off), n: h.face.normal.clone() };
  };
  const pos = [];
  for (let s = 0; s < poly.length - 1; s++) {
    let [u0, v0] = poly[s], [u1, v1] = poly[s + 1];
    const L = Math.hypot(u1 - u0, v1 - v0), tu = (u1 - u0) / L, tv = (v1 - v0) / L;
    const nu = -tv * width / 2, nv = tu * width / 2;
    u0 -= tu * width * 0.4; v0 -= tv * width * 0.4; u1 += tu * width * 0.4; v1 += tv * width * 0.4;
    const n = Math.max(1, Math.ceil((L + width * 0.8) / step));
    let prev = null;
    for (let i = 0; i <= n; i++) {
      const u = u0 + (u1 - u0) * i / n, v = v0 + (v1 - v0) * i / n;
      const a = cast(u + nu, v + nv), b = cast(u - nu, v - nv);
      const cur = a && b ? [a, b] : null;
      if (prev && cur) {
        const [A, B] = prev, [C2, D] = cur;
        const nrm = A.n.clone().add(D.n);
        for (const [p, q, r] of [[A.p, B.p, D.p], [A.p, D.p, C2.p]]) {
          const fn = new THREE.Vector3().subVectors(q, p).cross(new THREE.Vector3().subVectors(r, p));
          if (fn.dot(nrm) >= 0) pos.push(p.x, p.y, p.z, q.x, q.y, q.z, r.x, r.y, r.z);
          else pos.push(p.x, p.y, p.z, r.x, r.y, r.z, q.x, q.y, q.z);
        }
      }
      prev = cur;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return paint(g, sw, 'flat');
}

// Lightning-bolt blade: a flat zigzag blade (two convex pieces) growing from `base` along `dir`,
// lying in the plane spanned by dir and side `a` (thickness along their normal).
function boltBlade(base, dir, aHint, w, L, th, sw = P.bolt) {
  const d = dir.clone().normalize();
  const a = aHint.clone().addScaledVector(d, -aHint.dot(d)).normalize();
  const n = new THREE.Vector3().crossVectors(a, d).normalize();
  const pt = (u, v, t) => base.clone().addScaledVector(a, u * w).addScaledVector(d, v * L).addScaledVector(n, t);
  const A = [[-1, -0.1], [0.55, -0.1], [1.25, 0.56], [-0.3, 0.56]];
  const B = [[-1.15, 0.44], [0.85, 0.44], [-0.75, 1.05]];
  const piece = (poly, tipThin) => hull(poly.flatMap(([u, v], k) => {
    const t = tipThin && k === poly.length - 1 ? th * 0.25 : th;
    return [pt(u, v, t), pt(u, v, -t)];
  }));
  return [paint(piece(A, false), sw, 'y'), paint(piece(B, true), sw, 'y')];
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0), Y = V(0, 1, 0), Z = V(0, 0, 1);
  const navy = (pts, lo = 0.05, hi = 0.75) => paint(hull(pts), P.navy, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');
  const fur = (b, d, w, l) => paint(shard(b, d, w, l), P.navyF, 'y');

  // ================= BODY =================
  const BY = 0.46;
  const body = navy([
    ...ring(V(0, 0.45, -0.34), 0.1, 0.09, 10, 'z'),
    ...ring(V(0, 0.455, -0.27), 0.16, 0.15, 10, 'z'),
    ...ring(V(0, BY, -0.2), 0.18, 0.165, 10, 'z'),
    ...ring(V(0, BY, 0.06), 0.18, 0.165, 10, 'z'),
    ...ring(V(0, 0.48, 0.17), 0.175, 0.17, 10, 'z'),
    ...ring(V(0, 0.52, 0.27), 0.11, 0.12, 10, 'z'),
  ], 0.25, 0.68);
  C.push(body);
  C.push(paint(hull([...ring(V(0, 0.315, -0.2), 0.1, 0.035, 8, 'z'), ...ring(V(0, 0.315, 0.12), 0.11, 0.04, 8, 'z')]), P.steel, 'y', [0.27, 0.36]));
  C.push(navy([...ring(V(0, 0.5, 0.2), 0.13, 0.12, 10, 'y'), ...ring(V(0, 0.7, 0.27), 0.13, 0.12, 10, 'y')], 0.35, 0.85));
  // electric zigzag on each flank (between pauldron and haunch)
  S.push(decal([body], [[0.065, 0.52], [0.0, 0.44], [0.05, 0.425], [-0.015, 0.33]], V(0, 0, 0), Z, Y, X, 0.026, P.bolt));

  // ================= LEGS (built at final height; short and thick) =================
  const c0 = C.length, s0 = S.length;
  const DY = -0.09; // everything above the legs is lowered by this at the end
  const FL = { x: 0.15, z: 0.2 }, BL = { x: 0.158, z: -0.2 };
  S.push(navy([...ring(V(FL.x, 0.06, FL.z), 0.074, 0.074, 8), ...ring(V(FL.x - 0.004, 0.16, FL.z - 0.008), 0.084, 0.086, 8),
    ...ring(V(FL.x - 0.018, 0.27, FL.z - 0.03), 0.105, 0.112, 8), ...ring(V(FL.x - 0.045, 0.37, FL.z - 0.05), 0.085, 0.1, 8)], 0.0, 0.5));
  const haunch = navy([...ring(V(0.13, 0.4, BL.z + 0.02), 0.085, 0.115, 8), ...ring(V(0.165, 0.29, BL.z + 0.02), 0.115, 0.155, 8),
    ...ring(V(0.162, 0.18, BL.z + 0.01), 0.09, 0.11, 8)], 0.0, 0.5);
  S.push(haunch);
  S.push(navy([...ring(V(BL.x, 0.2, BL.z), 0.08, 0.085, 8), ...ring(V(BL.x + 0.003, 0.12, BL.z - 0.025), 0.076, 0.076, 8),
    ...ring(V(BL.x + 0.004, 0.06, BL.z - 0.02), 0.074, 0.074, 8)], 0.0, 0.5));
  // paws: steel pad block + 3 toes + small gold claws
  const paw = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.042, z - 0.005), 0.078, 0.042, 0.068, 0.022)), P.steel, 'y', [0, 0.09]));
    for (const dx of [-0.05, 0, 0.05]) {
      S.push(paint(hull(cbox(V(x + dx, 0.034, z + 0.062), 0.026, 0.034, 0.033, 0.012)), P.steel, 'y', [0, 0.09]));
      S.push(flat(shard(V(x + dx, 0.03, z + 0.09), V(0, -0.35, 1), 0.012, 0.028), P.gold));
    }
  };
  paw(FL.x, FL.z + 0.01);
  paw(BL.x + 0.004, BL.z - 0.02);
  // gold bracers with a rune each
  const bracer = (x, z, y0, y1, r0, r1) => {
    S.push(paint(hull([...ring(V(x, y0, z), r0, r0, 8), ...ring(V(x, y1, z), r1, r1, 8)]), P.gold, 'y', [y0, y1]));
    S.push(paint(hull([...ring(V(x, y1 - 0.005, z), r1 + 0.008, r1 + 0.008, 8), ...ring(V(x, y1 + 0.016, z), r1 + 0.004, r1 + 0.004, 8)]), P.goldD, 'flat'));
    const fx = x + r0 * Math.cos(Math.PI / 8);
    S.push(...glyph(RUNES.diamond, V(fx + 0.006, (y0 + y1) / 2 - 0.004, z), Z, Y, X, 0.02, 0.008, -0.004, 0.004, P.rune));
  };
  bracer(FL.x, FL.z, 0.09, 0.155, 0.092, 0.095);
  bracer(BL.x + 0.003, BL.z - 0.025, 0.09, 0.145, 0.094, 0.096);
  // haunch: lightning zigzag + claw-mark scars, navy fur tufts
  S.push(decal([haunch], [[-0.12, 0.4], [-0.175, 0.31], [-0.125, 0.3], [-0.185, 0.2]], V(0, 0, 0), Z, Y, X, 0.024, P.bolt));
  for (const dz of [0, 0.028, 0.056])
    S.push(decal([haunch], [[-0.235 - dz, 0.33], [-0.21 - dz, 0.25]], V(0, 0, 0), Z, Y, X, 0.011, P.scar));
  S.push(fur(V(0.2, 0.3, -0.31), V(0.35, -0.2, -1), 0.05, 0.1));
  S.push(fur(V(0.2, 0.37, -0.27), V(0.4, 0.3, -1), 0.045, 0.09));
  S.push(fur(V(0.2, 0.21, -0.27), V(0.4, -0.6, -1), 0.04, 0.08));
  // elbow tufts behind the front legs
  S.push(fur(V(FL.x + 0.03, 0.25, FL.z - 0.08), V(0.4, -0.4, -1), 0.045, 0.1));
  S.push(fur(V(FL.x + 0.05, 0.3, FL.z - 0.06), V(0.7, -0.2, -0.8), 0.04, 0.08));
  const c1 = C.length, s1 = S.length;

  // ================= ARMOUR =================
  const PD = V(0.205, 0.52, 0.16);
  S.push(paint(hull([...ring(V(0.11, PD.y + 0.02, PD.z), 0.11, 0.1, 8, 'x'), ...ring(PD, 0.1, 0.09, 8, 'x'),
    ...ring(V(PD.x + 0.03, PD.y, PD.z), 0.07, 0.062, 8, 'x')]), P.gold, 'y', [PD.y - 0.09, PD.y + 0.12]));
  S.push(paint(hull([...ring(V(0.13, PD.y - 0.075, PD.z), 0.115, 0.03, 8, 'x'), ...ring(V(PD.x + 0.01, PD.y - 0.085, PD.z), 0.1, 0.022, 8, 'x')]), P.goldD, 'flat'));
  S.push(...glyph(RUNES.bolt, V(PD.x + 0.03, PD.y, PD.z), Z, Y, X, 0.04, 0.012, 0.0, 0.008, P.rune));
  S.push(flat(shard(V(0.18, PD.y + 0.08, PD.z + 0.03), V(0.5, 1, 0.2), 0.026, 0.07), P.gold));
  S.push(flat(shard(V(0.18, PD.y + 0.075, PD.z - 0.05), V(0.6, 1, -0.3), 0.024, 0.06), P.gold));

  // saddle plate on the mid back (shorter so the spine bolts show behind it)
  const sad = [];
  const rA = 0.18 * 1.09, rB = 0.165 * 1.09, SZ0 = -0.13, SZ1 = 0.0;
  for (const z of [SZ0, SZ1]) for (let k = 0; k < 8; k++) {
    const a = (11.25 + 22.5 * k) * Math.PI / 180;
    sad.push(V(Math.cos(a) * rA, BY + Math.sin(a) * rB, z), V(Math.cos(a) * 0.12, BY + Math.sin(a) * 0.12, z));
  }
  C.push(paint(hull(sad), P.gold, 'y', [0.48, 0.66]));
  const sadTop = BY + Math.sin(78.75 * Math.PI / 180) * rB;
  for (const z of [SZ0 - 0.01, SZ1 + 0.01]) {
    const tr = [];
    for (let k = 0; k < 8; k++) {
      const a = (11.25 + 22.5 * k) * Math.PI / 180;
      tr.push(V(Math.cos(a) * (rA + 0.012), BY + Math.sin(a) * (rB + 0.012), z - 0.012), V(Math.cos(a) * (rA + 0.012), BY + Math.sin(a) * (rB + 0.012), z + 0.012),
        V(Math.cos(a) * 0.12, BY + Math.sin(a) * 0.12, z));
    }
    C.push(paint(hull(tr), P.goldD, 'flat'));
  }
  C.push(...glyph(RUNES.star, V(0, sadTop, -0.065), X, V(0, 0, -1), Y, 0.028, 0.01, 0.0, 0.008, P.rune));
  {
    const a0 = 11.25 * Math.PI / 180, a1 = 33.75 * Math.PI / 180;
    const p0 = V(Math.cos(a0) * rA, BY + Math.sin(a0) * rB, 0), p1 = V(Math.cos(a1) * rA, BY + Math.sin(a1) * rB, 0);
    const ev = p1.clone().sub(p0).normalize(), nv = V(ev.y, -ev.x, 0);
    const mid = p0.clone().add(p1).multiplyScalar(0.5);
    S.push(...glyph(RUNES.tiwaz, V(mid.x, mid.y, -0.065), Z, ev, nv, 0.03, 0.01, 0.0, 0.008, P.rune));
  }
  // chest plate (shield) with central rune
  const CP = V(0, 0.4, 0.3);
  C.push(paint(hull(plate([[-0.085, 0.07], [0.085, 0.07], [0.1, 0.0], [0.0, -0.1], [-0.1, 0.0]], CP, 0.24, 0.32)), P.gold, 'y', [0.3, 0.48]));
  C.push(paint(hull(plate([[-0.06, 0.05], [0.06, 0.05], [0.07, 0.0], [0.0, -0.07], [-0.07, 0.0]], CP, 0.3, 0.335)), P.goldD, 'flat'));
  C.push(...glyph(RUNES.bolt, V(0, CP.y + 0.0, 0.335), X, Y, Z, 0.034, 0.011, 0.0, 0.008, P.rune));

  // ================= MANE (layered lightning-bolt blades) =================
  const H = { y: 0.8, z: 0.31 };
  const NC = V(0, H.y - 0.03, H.z - 0.08);
  // compact hidden core behind the head
  C.push(paint(hull([...ring(NC.clone().add(V(0, 0, 0.0)), 0.17, 0.15, 10, 'z', 0),
    ...ring(NC.clone().add(V(0, -0.03, -0.12)), 0.12, 0.11, 10, 'z', 0)]), P.bolt, 'y', [NC.y - 0.15, NC.y + 0.15]));
  // front sunburst: blades fanned around the head, faces toward the front
  for (const a of [0, 30, 60, 90, 122, 152]) {
    const r = a * Math.PI / 180;
    const rad = V(Math.sin(r), Math.cos(r), 0);
    const d = rad.clone().add(V(0, 0, -0.45));
    const base = NC.clone().addScaledVector(rad, 0.13).add(V(0, 0, 0.01));
    const g = boltBlade(base, d, new THREE.Vector3().crossVectors(d, Z), 0.065, a > 110 ? 0.18 : 0.23, 0.022);
    if (a === 0) C.push(...g); else S.push(...g);
  }
  // swept-back layer: blades raking back along the neck toward the shoulders, side-facing
  for (const [b, d, w, l] of [
    [V(0.1, 0.9, 0.17), V(0.35, 0.55, -1), 0.06, 0.2],
    [V(0.15, 0.8, 0.17), V(0.6, 0.15, -1), 0.06, 0.2],
    [V(0.15, 0.68, 0.17), V(0.6, -0.25, -1), 0.06, 0.19],
    [V(0.12, 0.72, 0.06), V(0.45, 0.2, -1), 0.055, 0.17],
    [V(0.1, 0.62, 0.06), V(0.5, -0.1, -1), 0.05, 0.15],
  ]) S.push(...boltBlade(b, d, V(0, 1, 0).add(V(-0.4, 0, 0)), w, l, 0.02));
  // spine crest: long bolts down the neck and behind the saddle
  for (const [b, d, w, l] of [
    [V(0, 0.89, 0.15), V(0, 0.7, -1), 0.065, 0.21],
    [V(0, 0.76, 0.07), V(0, 0.55, -1), 0.06, 0.2],
    [V(0, 0.64, 0.02), V(0, 0.55, -1), 0.05, 0.14],
    [V(0, 0.6, -0.15), V(0, 0.75, -1), 0.05, 0.15],
    [V(0, 0.58, -0.24), V(0, 0.6, -1), 0.045, 0.13],
  ]) C.push(...boltBlade(b, d, Y, w, l, 0.018));
  // chest ruff (bolt blades pointing down)
  C.push(...boltBlade(V(0, 0.56, 0.35), V(0, -0.7, 1), X, 0.055, 0.12, 0.02));
  for (const [b, d] of [
    [V(0.07, 0.57, 0.34), V(0.4, -0.7, 1)],
    [V(0.13, 0.59, 0.29), V(0.9, -0.6, 0.6)],
  ]) S.push(...boltBlade(b, d, new THREE.Vector3().crossVectors(d, Y).negate(), 0.05, 0.11, 0.02));

  // ================= HEAD =================
  const HX = 0.2, HY = 0.16, HZ = 0.15;
  const head = navy([
    ...cbox(V(0, H.y, H.z), HX, HY, HZ, 0.06),
    ...ring(V(0, H.y + HY + 0.015, H.z - 0.01), 0.12, 0.1, 8, 'y'),
    V(0.215, H.y - 0.07, H.z + 0.05), V(-0.215, H.y - 0.07, H.z + 0.05),
  ], 0.6, 0.98);
  C.push(head);
  const FZ = H.z + HZ;
  // cheek-fur flare: navy shards fanning out and back from the jaw
  S.push(fur(V(0.17, H.y - 0.06, H.z + 0.08), V(0.85, -0.35, -0.75), 0.06, 0.16));
  S.push(fur(V(0.15, H.y - 0.115, H.z + 0.04), V(0.6, -0.75, -0.7), 0.055, 0.15));
  S.push(fur(V(0.17, H.y - 0.0, H.z + 0.02), V(0.8, 0.1, -0.9), 0.05, 0.14));

  // muzzle: longer, tapered wolf snout
  const MY = H.y - 0.075, NZ = FZ + 0.185;
  const muzzle = hull([...cbox(V(0, MY, FZ + 0.03), 0.098, 0.06, 0.04, 0.025),
    ...cbox(V(0, MY - 0.006, NZ - 0.03), 0.064, 0.048, 0.03, 0.02),
    V(0.055, H.y + 0.0, FZ - 0.03), V(-0.055, H.y + 0.0, FZ - 0.03)]);
  C.push(paint(muzzle, P.steel, 'y', [MY - 0.06, H.y]));
  // jaw
  C.push(paint(hull([...cbox(V(0, MY - 0.066, FZ + 0.03), 0.078, 0.024, 0.04, 0.012),
    ...cbox(V(0, MY - 0.06, NZ - 0.05), 0.05, 0.02, 0.025, 0.01)]), P.steel, 'flat'));
  // nose
  C.push(paint(hull([...cbox(V(0, MY + 0.03, NZ + 0.004), 0.04, 0.02, 0.02, 0.01),
    V(0, MY - 0.002, NZ + 0.002), V(0.018, MY + 0.006, NZ), V(-0.018, MY + 0.006, NZ)]), P.nose, 'y'));
  // mouth: centre line + corners on the front of the snout
  C.push(flat(hull(cbox(V(0, MY - 0.018, NZ + 0.001), 0.006, 0.018, 0.006, 0.002)), P.mouth));
  S.push(decal([muzzle], [[0, MY - 0.036], [0.042, MY - 0.044]], V(0, 0, 0), X, Y, Z, 0.008, P.mouth, 0.004, 0.01));
  S.push(decal([muzzle], [[NZ - 0.015, MY - 0.052], [NZ - 0.11, MY - 0.045]], V(0, 0, 0), Z, Y, X, 0.008, P.mouth, 0.004, 0.012));
  // battle scar: an X slashed across the top of the snout
  S.push(decal([muzzle], [[-0.045, FZ + 0.06], [0.045, FZ + 0.14]], V(0, 0, 0), X, Z, Y, 0.012, P.scar));

  // fierce eyes
  const E = V(0.092, H.y + 0.035, 0);
  S.push(flat(hull(plate([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]],
    E, FZ - 0.01, FZ + 0.012)), P.white));
  S.push(flat(hull(plate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]],
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), P.eye));
  S.push(flat(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.014, FZ + 0.021)), P.white));
  // heavy brow
  S.push(paint(hull([
    V(0.028, E.y + 0.012, FZ + 0.03), V(0.03, E.y + 0.052, FZ + 0.02),
    V(0.155, E.y + 0.05, FZ - 0.01), V(0.155, E.y + 0.09, FZ - 0.025),
    V(0.028, E.y + 0.012, FZ - 0.03), V(0.03, E.y + 0.06, FZ - 0.04),
    V(0.155, E.y + 0.05, FZ - 0.06), V(0.155, E.y + 0.09, FZ - 0.07),
  ]), P.navyD, 'y'));

  // gold forehead crest with rune gem
  C.push(paint(hull([
    V(0, E.y + 0.03, FZ + 0.03), V(0.035, E.y + 0.08, FZ + 0.012), V(-0.035, E.y + 0.08, FZ + 0.012),
    V(0.05, H.y + HY + 0.03, FZ - 0.05), V(-0.05, H.y + HY + 0.03, FZ - 0.05), V(0, H.y + HY + 0.07, FZ - 0.06),
    V(0, E.y + 0.03, FZ - 0.03), V(0.04, H.y + HY + 0.02, FZ - 0.12), V(-0.04, H.y + HY + 0.02, FZ - 0.12),
  ]), P.gold, 'y', [E.y, H.y + HY + 0.07]));
  C.push(flat(hull([V(0, E.y + 0.07, FZ + 0.03), V(0.022, E.y + 0.1, FZ + 0.012), V(-0.022, E.y + 0.1, FZ + 0.012),
    V(0, E.y + 0.13, FZ - 0.002), V(0, E.y + 0.1, FZ + 0.0), V(0, E.y + 0.09, FZ - 0.03)]), P.rune));

  // pointed wolf ears with yellow inner
  const EB = H.y + HY - 0.01, EZ = H.z - 0.03;
  S.push(paint(hull([V(0.075, EB, EZ + 0.05), V(0.18, EB - 0.01, EZ + 0.05), V(0.075, EB, EZ - 0.05), V(0.18, EB - 0.01, EZ - 0.05),
    V(0.165, EB + 0.2, EZ - 0.01), V(0.15, EB + 0.2, EZ - 0.015)]), P.navyD, 'y', [EB, EB + 0.2]));
  S.push(flat(hull([V(0.095, EB + 0.02, EZ + 0.052), V(0.165, EB + 0.015, EZ + 0.052), V(0.152, EB + 0.15, EZ + 0.01),
    V(0.095, EB + 0.02, EZ + 0.02), V(0.165, EB + 0.015, EZ + 0.02), V(0.152, EB + 0.15, EZ - 0.005)]), P.bolt));
  S.push(paint(hull([...ring(V(0.128, EB + 0.03, EZ), 0.065, 0.06, 6, 'y'), ...ring(V(0.13, EB + 0.06, EZ - 0.003), 0.058, 0.052, 6, 'y')]), P.gold, 'flat'));

  // ================= TAIL (layered navy shards, lightning tip) =================
  const TP = [V(0, 0.5, -0.3), V(0, 0.58, -0.4), V(0, 0.68, -0.48), V(0, 0.79, -0.53)];
  C.push(paint(tube(curveSamples(TP, 5, (t) => 0.055 + 0.02 * Math.sin(Math.PI * t), (t) => 0.05 + 0.02 * Math.sin(Math.PI * t)),
    { seg: 6, axis: X, capEnd: 0.02, phase: Math.PI / 2 }), P.navy, 'len'));
  const tcurve = new THREE.CatmullRomCurve3(TP, false, 'centripetal');
  for (const [t, w, l] of [[0.12, 0.06, 0.12], [0.4, 0.08, 0.15], [0.68, 0.08, 0.14]]) {
    const p = tcurve.getPoint(t), T = tcurve.getTangent(t).normalize();
    const U = new THREE.Vector3().crossVectors(X, T).normalize(); // "up" perpendicular to tail
    const back = T.clone().negate();
    C.push(fur(p.clone().addScaledVector(U, 0.04), U.clone().multiplyScalar(0.75).addScaledVector(back, 0.25).addScaledVector(T, 0.6), w, l));
    C.push(fur(p.clone().addScaledVector(U, -0.04), U.clone().multiplyScalar(-0.75).addScaledVector(T, 0.6), w * 0.9, l * 0.9));
    S.push(fur(p.clone().addScaledVector(X, 0.035).addScaledVector(U, 0.02), X.clone().multiplyScalar(0.7).addScaledVector(U, 0.35).addScaledVector(T, 0.7), w * 0.95, l));
  }
  // yellow lightning tip
  const tipP = tcurve.getPoint(1), tipT = tcurve.getTangent(1).normalize();
  C.push(...boltBlade(tipP.clone().addScaledVector(tipT, -0.02), tipT, V(0, 0, 1).cross(X).cross(tipT).add(V(0, 0, 0.001)), 0.06, 0.2, 0.026));
  const tU = new THREE.Vector3().crossVectors(X, tipT).normalize();
  S.push(...boltBlade(tipP.clone().addScaledVector(tipT, -0.04).addScaledVector(X, 0.02), tipT.clone().addScaledVector(X, 0.6), tU, 0.045, 0.14, 0.02));
  C.push(...boltBlade(tipP.clone().addScaledVector(tipT, -0.05).addScaledVector(tU, -0.02), tipT.clone().addScaledVector(tU, -0.7), X, 0.045, 0.13, 0.02));
  C.push(...boltBlade(tipP.clone().addScaledVector(tipT, -0.05).addScaledVector(tU, 0.03), tipT.clone().addScaledVector(tU, 0.7), X, 0.045, 0.14, 0.02));

  // lower everything above the legs so the limbs read short and stocky
  C.forEach((g, k) => { if (k < c0 || k >= c1) g.translate(0, DY, 0); });
  S.forEach((g, k) => { if (k < s0 || k >= s1) g.translate(0, DY, 0); });
  return assemble(C, S);
}

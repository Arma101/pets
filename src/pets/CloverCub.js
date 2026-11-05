// Clover Cub (ROBUX EGG, Lucky Egg): chunky green bear cub, white paws, glowing four-leaf clover on a cream
// chest bib, small gold horns with a clover gem, gold coin pauldrons, gold claws and a floating lucky coin halo.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  fur:    { i: 0, top: '#5BD266', bot: '#1F8A3E' },
  furDk:  { i: 1, top: '#3FB252', bot: '#16702F' },
  cream:  { i: 2, top: '#F7FCEA', bot: '#D3E6B6' },
  paw:    { i: 3, top: '#FFFFFF', bot: '#DCE3DA' },
  gold:   { i: 4, top: '#FFE46C', bot: '#E39E12' },
  goldDk: { i: 5, top: '#F6C431', bot: '#B9780C' },
  clover: { i: 6, top: '#B8FF6A', bot: '#3FEA4E', glow: true },
  eye:    { i: 7, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 8, top: '#FFFFFF', bot: '#F1F1F4' },
  nose:   { i: 9, top: '#3A3438', bot: '#141114' },
  mouth:  { i: 10, top: '#3B2A1E', bot: '#22160E' },
  brow:   { i: 11, top: '#38A84D', bot: '#176B2E' },
  earIn:  { i: 12, top: '#E8F6CF', bot: '#BFDA9A' },
  horn:   { i: 13, top: '#F2B52A', bot: '#FFE680' }, // 'len': gold base -> pale tip
};
const SW = PALETTE;

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
const nrm = (v) => v.clone().normalize();
const cross = (a, b) => new THREE.Vector3().crossVectors(a, b);

// points of a thick disc (coin / lobe) centred at c, facing normal n
function disc(c, n, r, th, sides = 8, phase = Math.PI / 8, rB = null) {
  const nn = nrm(n);
  const up = Math.abs(nn.y) > 0.9 ? V(0, 0, 1) : V(0, 1, 0);
  const a = nrm(cross(up, nn)), b = nrm(cross(nn, a));
  const pts = [];
  for (let k = 0; k < sides; k++) {
    const t = phase + (2 * Math.PI * k) / sides;
    const p = add(add(c, a, Math.cos(t) * r), b, Math.sin(t) * (rB ?? r));
    pts.push(add(p, nn, th / 2), add(p, nn, -th / 2));
  }
  return pts;
}
// frame (a = right, b = up) in the plane facing n
function frame(n) {
  const nn = nrm(n);
  const a = nrm(cross(V(0, 1, 0), nn)), b = nrm(cross(nn, a));
  return { n: nn, a, b };
}

// four-leaf clover lying on the plane at c facing n; each leaf = two teardrop lobes (heart)
function clover(out, c, n, s, th, sw, rot = Math.PI / 4) {
  const { a, b, n: nn } = frame(n);
  for (let L = 0; L < 4; L++) {
    const ang = rot + (L * Math.PI) / 2;
    for (const side of [-1, 1]) {
      const la = ang + side * 0.5;
      const dir = add(a.clone().multiplyScalar(Math.cos(la)), b, Math.sin(la));
      const lc = add(c, dir, s * 0.66);
      const pts = disc(lc, nn, s * 0.3, th, 7, la);
      pts.push(add(c, nn, th / 2), add(c, nn, -th / 2));
      out.push(paint(hull(pts), sw, 'flat'));
    }
  }
}

// gold coin: dark rim disc + raised bright face
function coin(out, c, n, r, th = 0.02, both = false) {
  out.push(paint(hull(disc(c, n, r, th, 10, 0)), SW.goldDk, 'flat'));
  out.push(paint(hull(disc(add(c, nrm(n), th * 0.45), n, r * 0.72, th * 0.4, 10, 0)), SW.gold, 'flat'));
  if (both) out.push(paint(hull(disc(add(c, nrm(n), -th * 0.45), n, r * 0.72, th * 0.4, 10, 0)), SW.gold, 'flat'));
}

export function buildGeometry() {
  const C = [], S = [];
  const fur = (pts, lo = 0.0, hi = 0.95) => paint(hull(pts), SW.fur, 'y', [lo, hi]);
  const flat = (g, sw) => paint(g, sw, 'flat');

  // ================= BODY (broad, low barrel) =================
  const body = fur([
    ...ring(V(0, 0.29, -0.34), 0.11, 0.1, 10, 'z'),
    ...ring(V(0, 0.285, -0.27), 0.19, 0.17, 10, 'z'),
    ...ring(V(0, 0.29, -0.1), 0.23, 0.19, 10, 'z'),
    ...ring(V(0, 0.3, 0.07), 0.235, 0.195, 10, 'z'),
    ...ring(V(0, 0.32, 0.2), 0.21, 0.185, 10, 'z'),
    ...ring(V(0, 0.35, 0.28), 0.13, 0.13, 10, 'z'),
  ], 0.1, 0.55);
  C.push(body);
  // neck / shoulder hump
  const neck = fur([...ring(V(0, 0.37, 0.13), 0.18, 0.15, 10, 'y'), ...ring(V(0, 0.55, 0.2), 0.16, 0.13, 10, 'y')], 0.25, 0.8);
  C.push(neck);

  // surface sampler (for flush chest markings)
  const rc = new THREE.Raycaster();
  const meshes = [new THREE.Mesh(body), new THREE.Mesh(neck)];
  const surf = (o, dir) => {
    rc.set(o, nrm(dir));
    const h = rc.intersectObjects(meshes, false)[0];
    const n = h.face.normal.clone();
    return { p: h.point.clone(), n };
  };

  // ================= LEGS (short, thick columns) =================
  S.push(fur([...ring(V(0.165, 0.07, 0.2), 0.092, 0.092, 8), ...ring(V(0.168, 0.15, 0.197), 0.1, 0.1, 8),
    ...ring(V(0.16, 0.25, 0.18), 0.118, 0.12, 8), ...ring(V(0.14, 0.35, 0.15), 0.09, 0.1, 8)], 0.0, 0.5));
  S.push(fur([...ring(V(0.16, 0.39, -0.19), 0.09, 0.12, 8), ...ring(V(0.18, 0.27, -0.18), 0.125, 0.16, 8),
    ...ring(V(0.178, 0.15, -0.18), 0.1, 0.105, 8), ...ring(V(0.175, 0.07, -0.19), 0.092, 0.092, 8)], 0.0, 0.5));
  // white paws: pad block + 3 toes + gold claws
  const paw = (x, z) => {
    S.push(paint(hull(cbox(V(x, 0.05, z - 0.005), 0.098, 0.05, 0.085, 0.028)), SW.paw, 'y', [0, 0.11]));
    for (const dx of [-0.06, 0, 0.06]) {
      S.push(paint(hull(cbox(V(x + dx, 0.038, z + 0.078), 0.031, 0.038, 0.036, 0.013)), SW.paw, 'y', [0, 0.11]));
      S.push(flat(shard(V(x + dx, 0.026, z + 0.107), V(0, -0.35, 1), 0.013, 0.03, 4), SW.gold));
    }
  };
  paw(0.167, 0.2);
  paw(0.176, -0.19);
  // gold wrist cuffs on the front legs, with a coin stud on the front
  S.push(paint(hull([...ring(V(0.167, 0.112, 0.199), 0.104, 0.104, 8), ...ring(V(0.167, 0.152, 0.198), 0.107, 0.107, 8)]), SW.gold, 'y', [0.1, 0.16]));
  coin(S, V(0.167, 0.132, 0.307), V(0, 0, 1), 0.024, 0.012);

  // ================= CHEST: flush cream marking + thin gold rim + big glowing four-leaf clover =================
  const CN = nrm(V(0, 0.22, 1)), CC = V(0, 0.36, 0.3);
  const cu = V(1, 0, 0), cv = nrm(cross(CN, cu));
  // conforming cap: samples the fur surface on a ring and offsets it by [off-th, off]
  const cap = (rx, ry, off, th, sides = 12, cx = 0, cy = 0) => {
    const pts = [];
    const samp = (u, v) => {
      const o = add(add(add(CC, cu, u), cv, v), CN, 0.4);
      const h = surf(o, CN.clone().negate());
      pts.push(add(h.p, h.n, off), add(h.p, h.n, off - th));
    };
    samp(cx, cy);
    for (let k = 0; k < sides; k++) {
      const t = (2 * Math.PI * k) / sides;
      samp(cx + Math.cos(t) * rx, cy + Math.sin(t) * ry);
      samp(cx + Math.cos(t) * rx * 0.55, cy + Math.sin(t) * ry * 0.55);
    }
    return hull(pts);
  };
  C.push(paint(cap(0.13, 0.135, 0.005, 0.03, 12), SW.cream, 'y', [0.2, 0.5]));
  C.push(flat(cap(0.103, 0.103, 0.009, 0.02, 14), SW.goldDk));
  C.push(paint(cap(0.093, 0.093, 0.013, 0.02, 14), SW.furDk, 'y', [0.26, 0.44]));
  // clover leaves: each lobe conforms to the local surface
  {
    const s = 0.088;
    for (let L = 0; L < 4; L++) {
      const ang = Math.PI / 4 + (L * Math.PI) / 2;
      for (const side of [-1, 1]) {
        const la = ang + side * 0.5;
        const u = Math.cos(la) * s * 0.64, v = Math.sin(la) * s * 0.64;
        const h = surf(add(add(add(CC, cu, u), cv, v), CN, 0.4), CN.clone().negate());
        const ctr = surf(add(CC, CN, 0.4), CN.clone().negate());
        const pts = disc(add(h.p, h.n, 0.023), h.n, s * 0.31, 0.01, 7, la);
        pts.push(add(ctr.p, ctr.n, 0.028), add(ctr.p, ctr.n, 0.018));
        C.push(flat(hull(pts), SW.clover));
      }
    }
    // little stem
    const st = [];
    for (const [u, v] of [[0, 0], [0.028, -0.07]]) {
      const h = surf(add(add(add(CC, cu, u), cv, v), CN, 0.4), CN.clone().negate());
      st.push(add(add(h.p, h.n, 0.025), cu, 0.007), add(add(h.p, h.n, 0.025), cu, -0.007), add(h.p, h.n, 0.017));
    }
    C.push(flat(hull(st), SW.clover));
  }
  // cream fur shards fringing the bottom of the marking
  for (const [u, dx, w, l] of [[0, 0, 0.05, 0.075], [0.075, 0.45, 0.045, 0.07], [0.125, 0.85, 0.04, 0.06]]) {
    const h = surf(add(add(add(CC, cu, u), cv, -0.12 + Math.abs(u) * 0.35), CN, 0.4), CN.clone().negate());
    (u === 0 ? C : S).push(flat(shard(add(h.p, h.n, -0.01), V(dx, -1, 0.35), w, l), SW.cream));
  }

  // ================= SHOULDER ARMOUR: gold pauldrons with lucky coins =================
  S.push(paint(hull([...ring(V(0.2, 0.39, 0.13), 0.08, 0.085, 8, 'x'), ...ring(V(0.245, 0.36, 0.13), 0.09, 0.095, 8, 'x'),
    ...ring(V(0.262, 0.3, 0.13), 0.075, 0.08, 8, 'x')]), SW.gold, 'y', [0.29, 0.54]));
  coin(S, V(0.29, 0.345, 0.13), V(1, 0.2, 0.15), 0.048, 0.016);
  clover(S, V(0.3, 0.348, 0.132), V(1, 0.2, 0.15), 0.028, 0.008, SW.clover);

  // nape / back fur shards (flat, swept back)
  C.push(flat(shard(V(0, 0.5, 0.05), V(0, 0.2, -1), 0.065, 0.09, 4, 0.6), SW.fur));
  S.push(flat(shard(V(0.1, 0.48, 0.0), V(0.5, 0.1, -1), 0.055, 0.075, 4, 0.6), SW.fur));
  // fur tufts at shoulders / hips
  S.push(flat(shard(V(0.22, 0.26, 0.04), V(0.6, -0.5, -1), 0.045, 0.07), SW.fur));
  S.push(flat(shard(V(0.23, 0.31, -0.14), V(0.6, -0.4, -1), 0.045, 0.07), SW.fur));

  // ================= HEAD (big, wide bear head) =================
  const H = { y: 0.65, z: 0.23 };
  C.push(fur([
    ...cbox(V(0, H.y, H.z), 0.22, 0.16, 0.165, 0.07),
    ...ring(V(0, H.y + 0.17, H.z - 0.01), 0.13, 0.1, 8, 'y'),
    V(0.225, H.y - 0.07, H.z + 0.05), V(-0.225, H.y - 0.07, H.z + 0.05),
  ], 0.55, 0.97));
  const FZ = H.z + 0.165;

  // cheek fur shards
  S.push(flat(shard(V(0.2, H.y - 0.06, H.z + 0.05), V(1, -0.6, 0.2), 0.045, 0.07), SW.fur));
  S.push(flat(shard(V(0.19, H.y - 0.11, H.z - 0.02), V(0.8, -0.9, -0.2), 0.04, 0.065), SW.fur));
  // back-of-head shard fur: three overlapping rows swept down/back into the nape
  C.push(flat(shard(V(0, H.y + 0.12, H.z - 0.12), V(0, -0.5, -1), 0.065, 0.1, 4, 0.5), SW.fur));
  S.push(flat(shard(V(0.1, H.y + 0.11, H.z - 0.12), V(0.35, -0.5, -1), 0.06, 0.095, 4, 0.5), SW.fur));
  C.push(flat(shard(V(0, H.y + 0.02, H.z - 0.145), V(0, -0.8, -1), 0.07, 0.12, 4, 0.5), SW.fur));
  S.push(flat(shard(V(0.11, H.y + 0.01, H.z - 0.14), V(0.35, -0.8, -1), 0.065, 0.11, 4, 0.5), SW.fur));
  C.push(flat(shard(V(0, H.y - 0.08, H.z - 0.135), V(0, -1, -0.7), 0.07, 0.11, 4, 0.5), SW.fur));
  S.push(flat(shard(V(0.085, H.y - 0.08, H.z - 0.13), V(0.35, -1, -0.7), 0.065, 0.1, 4, 0.5), SW.fur));
  S.push(flat(shard(V(0.17, H.y - 0.06, H.z - 0.11), V(0.6, -1, -0.5), 0.055, 0.09, 4, 0.5), SW.fur));
  // crown tuft
  C.push(flat(shard(V(0, H.y + 0.16, H.z - 0.04), V(0, 1, -0.4), 0.04, 0.06), SW.fur));

  // muzzle (short, rounded cream snout), jaw, nose, mouth
  C.push(paint(hull([...cbox(V(0, H.y - 0.075, FZ + 0.03), 0.095, 0.06, 0.065, 0.03),
    V(0.065, H.y - 0.015, FZ - 0.03), V(-0.065, H.y - 0.015, FZ - 0.03)]), SW.cream, 'y', [H.y - 0.14, H.y]));
  C.push(paint(hull(cbox(V(0, H.y - 0.13, FZ - 0.005), 0.075, 0.028, 0.06, 0.014)), SW.cream, 'flat'));
  C.push(paint(hull([...cbox(V(0, H.y - 0.04, FZ + 0.095), 0.045, 0.022, 0.02, 0.01),
    V(0, H.y - 0.073, FZ + 0.09), V(0.02, H.y - 0.065, FZ + 0.09), V(-0.02, H.y - 0.065, FZ + 0.09)]), SW.nose, 'y'));
  C.push(paint(hull(cbox(V(0, H.y - 0.092, FZ + 0.093), 0.006, 0.02, 0.006, 0.002)), SW.mouth, 'flat'));
  S.push(paint(hull([V(0, H.y - 0.112, FZ + 0.098), V(0, H.y - 0.1, FZ + 0.098), V(0.05, H.y - 0.12, FZ + 0.086),
    V(0.05, H.y - 0.11, FZ + 0.086), V(0, H.y - 0.112, FZ + 0.088), V(0.05, H.y - 0.116, FZ + 0.074)]), SW.mouth, 'flat'));

  // fierce eyes
  const E = V(0.09, H.y + 0.03, 0);
  S.push(paint(hull(plate([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]],
    E, FZ - 0.01, FZ + 0.012)), SW.white, 'flat'));
  S.push(paint(hull(plate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]],
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.014, FZ + 0.021)), SW.white, 'flat'));
  S.push(paint(hull([
    V(0.028, E.y + 0.012, FZ + 0.03), V(0.03, E.y + 0.05, FZ + 0.02),
    V(0.155, E.y + 0.05, FZ - 0.01), V(0.155, E.y + 0.088, FZ - 0.025),
    V(0.028, E.y + 0.012, FZ - 0.03), V(0.03, E.y + 0.06, FZ - 0.04),
    V(0.155, E.y + 0.05, FZ - 0.06), V(0.155, E.y + 0.09, FZ - 0.07),
  ]), SW.brow, 'y'));

  // round bear ears on top corners
  const EC = V(0.155, H.y + 0.155, H.z - 0.04);
  S.push(paint(hull(disc(EC, V(0.25, 0.1, 1), 0.07, 0.05, 8, Math.PI / 8)), SW.fur, 'y', [H.y + 0.08, H.y + 0.24]));
  S.push(paint(hull(disc(add(EC, V(0.004, 0.005, 0.022)), V(0.25, 0.1, 1), 0.044, 0.012, 8, Math.PI / 8)), SW.earIn, 'flat'));

  // small gold horns curving up and back from the brow
  S.push(paint(tube(curveSamples([V(0.07, H.y + 0.13, H.z + 0.08), V(0.085, H.y + 0.2, H.z + 0.07), V(0.09, H.y + 0.25, H.z + 0.03)],
    4, (t) => 0.03 * (1 - 0.7 * t)), { seg: 6, capEnd: 0.03, phase: Math.PI / 6 }), SW.horn, 'len'));
  // forehead gold plate with a glowing clover gem
  C.push(paint(hull([...plate([[-0.045, 0.0], [0, 0.04], [0.045, 0.0], [0, -0.035]], V(0, H.y + 0.11, 0), FZ - 0.03, FZ + 0.004)]),
    SW.gold, 'flat'));
  clover(C, V(0, H.y + 0.112, FZ + 0.008), V(0, 0, 1), 0.026, 0.008, SW.clover);

  // ================= TAIL (short puffy stub) =================
  C.push(paint(hull([...ring(V(0, 0.33, -0.33), 0.065, 0.06, 8, 'z'), ...ring(V(0, 0.36, -0.4), 0.072, 0.066, 8, 'z'),
    ...ring(V(0, 0.38, -0.45), 0.042, 0.038, 8, 'z'), V(0, 0.43, -0.41)]), SW.fur, 'y', [0.25, 0.45]));

  // ================= LUCKY COIN HALO (floating ring behind the head) =================
  const HC = V(0, H.y + 0.1, H.z - 0.2), HR = 0.235;
  const hp = [];
  for (let k = 0; k <= 24; k++) { const t = (2 * Math.PI * k) / 24; hp.push(V(Math.cos(t) * HR, HC.y + Math.sin(t) * HR, HC.z)); }
  // half ring on the right (mirrored), slightly overlapping the centre line top & bottom
  const half = [];
  for (let k = -6; k <= 6; k++) { const t = (Math.PI / 2) * (k / 6) * 1.04; half.push({ p: V(Math.cos(t) * HR, HC.y + Math.sin(t) * HR, HC.z), rx: 0.016, ry: 0.016 }); }
  S.push(paint(tube(half, { seg: 6, axis: V(0, 0, 1), phase: Math.PI / 6 }), SW.gold, 'y', [HC.y - HR, HC.y + HR]));
  for (const deg of [90, 45, 0, -45]) {
    const t = (deg * Math.PI) / 180;
    const p = V(Math.cos(t) * HR, HC.y + Math.sin(t) * HR, HC.z + 0.004);
    if (deg === 90) {
      // top centre: big coin with a glowing clover
      coin(C, V(0, p.y, p.z), V(0, 0, 1), 0.06, 0.022, true);
      clover(C, V(0, p.y, p.z + 0.016), V(0, 0, 1), 0.04, 0.01, SW.clover);
    } else coin(S, p, V(0, 0, 1), 0.042, 0.018, true);
  }
  coin(C, V(0, HC.y - HR, HC.z + 0.004), V(0, 0, 1), 0.042, 0.018);

  return assemble(C, S);
}

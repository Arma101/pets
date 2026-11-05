// Sun Scarab (Legendary, Round 3 - Desert Dojo): metallic blue scarab with a gold sun-disc horn,
// gold-star elytra, gold/lapis pronotum armour, sandstone collar, glowing eyes.
import { V, THREE, hull, cbox, ring, plate, shard, tube, curveSamples, paint, assemble } from '../kit.js';

// 3-stop metallic gradient cell (light highlight -> royal -> deep navy)
const metal = (stops) => (g, x, y) => {
  const grad = g.createLinearGradient(0, y + 16, 0, y + 112);
  stops.forEach(([t, c]) => grad.addColorStop(t, c));
  g.fillStyle = stops[0][1]; g.fillRect(x, y, 128, 16);
  g.fillStyle = grad; g.fillRect(x, y + 16, 128, 96);
  g.fillStyle = stops[stops.length - 1][1]; g.fillRect(x, y + 112, 128, 16);
};

export const PALETTE = {
  shell: { i: 0, draw: metal([[0, '#B8E4FF'], [0.25, '#4C9BFF'], [0.6, '#1F4FD6'], [1, '#0B1E6E']]) },
  body: { i: 1, draw: metal([[0, '#3E4E96'], [0.45, '#1A2258'], [1, '#070A20']]) },
  head: { i: 9, draw: metal([[0, '#7FA6FF'], [0.45, '#2F55D4'], [1, '#14257A']]) },
  lapis: { i: 2, draw: metal([[0, '#5866F5'], [0.5, '#2A2FB8'], [1, '#161670']]) },
  gold: { i: 3, draw: metal([[0, '#FFF3A8'], [0.4, '#FFD23F'], [1, '#C98512']]) },
  sand: { i: 4, top: '#F6DDA8', bot: '#C99A5C' },
  glow: { i: 5, top: '#FFF6A0', bot: '#FFC400', glow: true },
  pupil: { i: 6, top: '#2A1A08', bot: '#140C04' },
  white: { i: 7, top: '#FFFFFF', bot: '#F2F2F2' },
  brow: { i: 8, draw: metal([[0, '#5B8BFF'], [0.5, '#2241B0'], [1, '#101E60']]) },
};
const P = PALETTE;
const D = (deg) => (deg * Math.PI) / 180;

// raised faceted 5-point star on a surface (p = surface point, n = outward normal)
function star(p, n, rOut, rIn, h, up = V(0, 1, 0)) {
  n = n.clone().normalize();
  let a = up.clone().addScaledVector(n, -up.dot(n));
  if (a.lengthSq() < 1e-6) a = V(0, 0, 1).addScaledVector(n, -n.z);
  a.normalize();
  const b = new THREE.Vector3().crossVectors(a, n).normalize();
  const base = p.clone().addScaledVector(n, -0.012), topC = p.clone().addScaledVector(n, h * 1.8);
  const rim = [], rimB = [];
  for (let k = 0; k < 10; k++) {
    const th = (Math.PI * k) / 5, r = k % 2 ? rIn : rOut;
    const d = a.clone().multiplyScalar(Math.cos(th) * r).addScaledVector(b, Math.sin(th) * r);
    rim.push(p.clone().addScaledVector(n, h).add(d));
    rimB.push(base.clone().add(d));
  }
  const pos = [];
  const tri = (A, B, Cc, out) => {
    const nn = new THREE.Vector3().subVectors(B, A).cross(new THREE.Vector3().subVectors(Cc, A));
    if (nn.dot(out) < 0) [B, Cc] = [Cc, B];
    pos.push(A.x, A.y, A.z, B.x, B.y, B.z, Cc.x, Cc.y, Cc.z);
  };
  for (let k = 0; k < 10; k++) {
    const k2 = (k + 1) % 10;
    tri(rim[k], rim[k2], topC, n);
    tri(rimB[k], rimB[k2], base, n.clone().negate());
    const out = rim[k].clone().add(rim[k2]).multiplyScalar(0.5).sub(p);
    tri(rim[k], rimB[k], rim[k2], out);
    tri(rim[k2], rimB[k], rimB[k2], out);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// convex beam between two points (chamfered cubes at each end)
const beam = (p1, r1, p2, r2) => hull([...cbox(p1, r1, r1, r1, r1 * 0.45), ...cbox(p2, r2, r2, r2, r2 * 0.45)]);

export function buildGeometry() {
  const C = [], S = [];

  // ================= ELYTRA (domed shell halves, split down the middle) =================
  const ZC = -0.17, Y0 = 0.25;
  const sOf = (z) => { const L = z > ZC ? 0.42 : 0.31; return Math.sqrt(Math.max(0.06, 1 - ((z - ZC) / L) ** 2)); };
  const W = (z) => 0.31 * sOf(z) ** 0.55, Hh = (z) => 0.31 * sOf(z) ** 0.6;
  const elyZ = [-0.46, -0.36, -0.2, -0.02, 0.1];
  const elyPts = [];
  for (const z of elyZ) {
    const w = W(z), h = Hh(z);
    for (const a of [0, 34, 66, 98]) elyPts.push(V(0.008 + w * Math.sin(D(a)), Y0 + h * Math.cos(D(a)), z));
    elyPts.push(V(0.008, Y0 - 0.05, z));
  }
  const ely = paint(hull(elyPts), P.shell, 'y', [0.2, 0.58]);
  S.push(ely);

  // gold trim skirt along the lower shell edge
  const skirt = [];
  for (const z of [-0.48, ...elyZ.slice(1, -1), 0.085]) {
    const zz = Math.max(z, -0.47);
    const w = W(zz) + 0.018, h = Hh(zz);
    for (const a of [86, 104]) skirt.push(V(0.008 + w * Math.sin(D(a)), Y0 + h * Math.cos(D(a)) - (a > 90 ? 0.012 : 0), zz));
    skirt.push(V(0.06, Y0 - 0.07, zz));
  }
  S.push(paint(hull(skirt), P.gold, 'y', [0.15, 0.32]));

  // centre seam: gold rib along the split
  C.push(paint(tube(curveSamples(elyZ.map((z) => V(0, Y0 + Hh(z) + 0.004, z)), 9, () => 0.026, () => 0.02),
    { seg: 6, axis: V(1, 0, 0), capStart: 0.01, capEnd: 0.0, phase: Math.PI / 2 }), P.gold, 'y', [0.3, 0.6]));

  // seam continues down the rear of the shell
  { const zb = elyZ[0], hb = Hh(zb);
    C.push(paint(hull([...cbox(V(0, Y0 + hb / 2 - 0.035, zb - 0.002), 0.024, hb / 2 + 0.035, 0.016, 0.008),
      V(0, Y0 + hb + 0.02, zb + 0.02)]), P.gold, 'y', [0.2, 0.45])); }
  // raised gold stars on the shell (raycast onto the elytra)
  const mesh = new THREE.Mesh(ely, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  const rc = new THREE.Raycaster();
  const starAt = (aDeg, z, r) => {
    const dir = V(Math.sin(D(aDeg)), Math.cos(D(aDeg)), 0);
    const c = V(0.008, Y0, z);
    rc.set(c.clone().addScaledVector(dir, 2), dir.clone().negate());
    const hit = rc.intersectObject(mesh)[0];
    if (!hit) return;
    S.push(paint(star(hit.point, hit.face.normal, r, r * 0.45, 0.008, V(0, 0, 1)), P.gold, 'flat'));
  };
  for (const [a, z, r] of [
    [18, -0.06, 0.042], [20, -0.29, 0.05], [50, -0.16, 0.044], [52, 0.03, 0.034],
    [55, -0.37, 0.036], [82, -0.26, 0.034], [84, -0.06, 0.032],
  ]) starAt(a, z, r);

  // ================= UNDERBODY (sandstone belly plates) =================
  C.push(paint(hull([...cbox(V(0, 0.2, -0.12), 0.21, 0.075, 0.32, 0.05), ...cbox(V(0, 0.23, 0.18), 0.18, 0.06, 0.12, 0.04)]),
    P.body, 'y', [0.12, 0.3]));

  // ================= PRONOTUM (gold armour base + lapis plate) =================
  const prZ = [[0.04, 0.29, 0.18, 0.37], [0.16, 0.285, 0.17, 0.37], [0.28, 0.23, 0.13, 0.35]];
  C.push(paint(hull(prZ.flatMap(([z, rx, ry, y]) => ring(V(0, y - 0.02, z === 0.28 ? 0.268 : z === 0.04 ? 0.05 : z), rx + 0.02, ry * 0.75, 10, 'z', Math.PI / 10))),
    P.gold, 'y', [0.2, 0.5]));
  C.push(paint(hull(prZ.flatMap(([z, rx, ry, y]) => ring(V(0, y, z), rx - 0.015, ry, 10, 'z', Math.PI / 10))),
    P.lapis, 'y', [0.3, 0.56]));
  // gold emblem ridge on the pronotum + lapis gem
  const prMesh = new THREE.Mesh(C[C.length - 1], new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  const prTop = (x, z) => { rc.set(V(x, 2, z), V(0, -1, 0)); return rc.intersectObject(prMesh)[0].point.y; };
  const MZ = 0.17, MY = prTop(0, MZ);
  C.push(paint(hull([...ring(V(0, MY - 0.02, MZ), 0.075, 0.06, 10, 'y', Math.PI / 10),
    ...ring(V(0, MY + 0.018, MZ), 0.06, 0.047, 10, 'y', Math.PI / 10)]), P.gold, 'y', [MY - 0.02, MY + 0.02]));
  C.push(paint(hull([...ring(V(0, MY + 0.015, MZ), 0.03, 0.03, 8, 'y'), V(0, MY + 0.04, MZ)]), P.lapis, 'flat'));
  for (const [x, z] of [[0.15, 0.1], [0.12, 0.23]]) {
    const y = prTop(x, z);
    S.push(paint(hull([...ring(V(x, y - 0.015, z), 0.032, 0.032, 8, 'y'), ...ring(V(x, y + 0.008, z), 0.022, 0.022, 8, 'y'), V(x, y + 0.016, z)]), P.gold, 'y', [y - 0.015, y + 0.016]));
  }

  // ================= COLLAR (sandstone band) =================
  C.push(paint(hull([...ring(V(0, 0.33, 0.29), 0.21, 0.13, 8, 'z'), ...ring(V(0, 0.33, 0.33), 0.2, 0.125, 8, 'z')]),
    P.sand, 'y', [0.2, 0.46]));

  // ================= HEAD =================
  const H = { y: 0.37, z: 0.44 }, FZ = 0.565;
  C.push(paint(hull([
    ...cbox(V(0, H.y, H.z), 0.23, 0.155, 0.125, 0.055),
  ]), P.head, 'y', [0.22, 0.52]));
  // clypeus: shovel-like lower face plate jutting forward
  C.push(paint(hull([V(0.18, 0.31, 0.53), V(-0.18, 0.31, 0.53), V(0.18, 0.25, 0.575), V(-0.18, 0.25, 0.575),
    V(0.1, 0.235, 0.62), V(-0.1, 0.235, 0.62), V(0.11, 0.305, 0.58), V(-0.11, 0.305, 0.58),
    V(0.14, 0.225, 0.53), V(-0.14, 0.225, 0.53)]), P.gold, 'y', [0.22, 0.31]));
  // clypeus rake teeth (gold)
  C.push(paint(shard(V(0, 0.235, 0.605), V(0, -0.2, 1), 0.024, 0.045), P.gold, 'flat'));
  S.push(paint(shard(V(0.065, 0.235, 0.6), V(0.3, -0.2, 1), 0.022, 0.04), P.gold, 'flat'));
  S.push(paint(shard(V(0.13, 0.24, 0.585), V(0.6, -0.2, 1), 0.022, 0.04), P.gold, 'flat'));

  // big curved gold mandibles (chunky two-segment hooks)
  S.push(paint(hull([...cbox(V(0.14, 0.235, 0.575), 0.035, 0.028, 0.035, 0.012), ...cbox(V(0.115, 0.228, 0.64), 0.022, 0.02, 0.02, 0.008)]),
    P.gold, 'y', [0.2, 0.27]));
  S.push(paint(hull([...cbox(V(0.115, 0.228, 0.64), 0.022, 0.02, 0.02, 0.008), V(0.05, 0.225, 0.69), V(0.055, 0.215, 0.685), V(0.06, 0.232, 0.675)]),
    P.gold, 'y', [0.2, 0.27]));

  // glowing almond eyes, angry flat top slanting down toward the centre
  const E = V(0.105, 0.385, 0);
  const ES = 1.3;
  S.push(paint(hull(plate([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]].map(([u, v]) => [u * ES, v * ES]),
    E, FZ - 0.02, FZ + 0.012)), P.glow, 'y', [E.y - 0.04, E.y + 0.045]));
  S.push(paint(hull(plate([[-0.024, 0.004], [0.014, 0.018], [0.02, -0.01], [0.006, -0.034], [-0.018, -0.032], [-0.028, -0.012]],
    V(E.x - 0.004, E.y - 0.002, 0), FZ + 0.006, FZ + 0.018)), P.pupil, 'flat'));
  S.push(paint(hull(plate([[-0.006, -0.006], [0.006, -0.006], [0.006, 0.006], [-0.006, 0.006]],
    V(E.x + 0.002, E.y + 0.002, 0), FZ + 0.014, FZ + 0.021)), P.white, 'flat'));
  // heavy brow
  S.push(paint(hull([
    V(0.025, E.y + 0.012, FZ + 0.03), V(0.028, E.y + 0.05, FZ + 0.02),
    V(0.16, E.y + 0.05, FZ - 0.0), V(0.16, E.y + 0.088, FZ - 0.02),
    V(0.025, E.y + 0.012, FZ - 0.04), V(0.028, E.y + 0.06, FZ - 0.05),
    V(0.16, E.y + 0.05, FZ - 0.07), V(0.16, E.y + 0.09, FZ - 0.08),
    V(0.2, E.y + 0.045, FZ - 0.03), V(0.2, E.y + 0.08, FZ - 0.05),
  ]), P.gold, 'y', [E.y, E.y + 0.09]));

  // ================= HORN (rhino-style, from the front of the head) + SUN DISC CRADLE =================
  C.push(paint(tube(curveSamples([V(0, 0.46, 0.49), V(0, 0.58, 0.545), V(0, 0.67, 0.54), V(0, 0.73, 0.5)], 6,
    (t) => 0.098 - 0.065 * t, (t) => 0.1 - 0.07 * t), { seg: 6, axis: V(1, 0, 0), phase: Math.PI / 2, capEnd: 0.03 }),
    P.head, 'y', [0.42, 0.76]));
  const SD = V(0, 0.8, 0.455), R = 0.095;
  // two short curved prongs cradling the disc (Egyptian sun-disc crown)
  S.push(paint(tube(curveSamples([V(0.02, 0.69, 0.48), V(0.08, 0.705, 0.465), V(0.115, 0.745, 0.458), V(0.118, 0.79, 0.455)], 5,
    (t) => 0.036 - 0.02 * t), { seg: 6, capEnd: 0.03, axis: V(0, 0, 1) }), P.gold, 'y', [0.68, 0.82]));
  C.push(paint(hull([
    ...ring(V(SD.x, SD.y, SD.z - 0.02), R, R, 12, 'z', Math.PI / 12),
    ...ring(V(SD.x, SD.y, SD.z + 0.02), R, R, 12, 'z', Math.PI / 12),
    ...ring(V(SD.x, SD.y, SD.z + 0.04), R * 0.6, R * 0.6, 12, 'z', Math.PI / 12),
    ...ring(V(SD.x, SD.y, SD.z - 0.036), R * 0.6, R * 0.6, 12, 'z', Math.PI / 12),
  ]), P.gold, 'y', [SD.y - R, SD.y + R]));
  C.push(paint(hull([...ring(V(SD.x, SD.y, SD.z + 0.035), 0.034, 0.034, 8, 'z'), V(SD.x, SD.y, SD.z + 0.058)]), P.lapis, 'y',
    [SD.y - 0.035, SD.y + 0.035]));
  const ray = (deg) => shard(V(SD.x + Math.cos(D(deg)) * (R - 0.01), SD.y + Math.sin(D(deg)) * (R - 0.01), SD.z),
    V(Math.cos(D(deg)), Math.sin(D(deg)), 0), 0.03, 0.05, 4, 0.55);
  C.push(paint(ray(90), P.gold, 'flat'));
  for (const d of [30, 60]) S.push(paint(ray(d), P.gold, 'flat'));

  // lower the whole body so the belly sits near the ground (legs are built in final coordinates)
  for (const g of [...C, ...S]) g.translate(0, -0.07, 0);

  // ================= LEGS (3 pairs: femur up/out, knee joint, tibia down to gold foot) =================
  const leg = (hip, knee, foot, front) => {
    S.push(paint(beam(hip, 0.06, knee, 0.058), P.body, 'y', [0.0, 0.3]));
    S.push(paint(beam(knee, 0.052, V(foot.x, 0.06, foot.z), 0.045), P.body, 'y', [0.0, 0.3]));
    S.push(paint(hull([...cbox(knee, 0.058, 0.058, 0.058, 0.026)]), P.body, 'y', [0.1, 0.32]));
    const kd = V(foot.x, 0.06, foot.z).sub(knee).normalize();
    S.push(paint(beam(knee.clone().addScaledVector(kd, 0.07), 0.056, knee.clone().addScaledVector(kd, 0.085), 0.056), P.gold, 'y', [0, 0.3]));
    const fd = V(foot.x - knee.x, 0, foot.z - knee.z).normalize();
    S.push(paint(hull([...cbox(V(foot.x, 0.034, foot.z), 0.058, 0.034, 0.058, 0.018),
      V(foot.x + fd.x * 0.08, 0.01, foot.z + fd.z * 0.08)]), P.gold, 'y', [0, 0.07]));
    if (front) for (const t of [0.35, 0.7]) {
      const p = knee.clone().lerp(V(foot.x, 0.06, foot.z), t);
      S.push(paint(shard(p.add(V(0.03, 0, 0.012)), V(1, 0.25, 0.4), 0.022, 0.05), P.gold, 'flat'));
    }
  };
  leg(V(0.17, 0.13, 0.27), V(0.36, 0.27, 0.37), V(0.43, 0, 0.45), true);
  leg(V(0.22, 0.12, -0.02), V(0.41, 0.27, 0.0), V(0.48, 0, 0.03), false);
  leg(V(0.2, 0.12, -0.25), V(0.385, 0.27, -0.34), V(0.45, 0, -0.43), false);

  return assemble(C, S);
}

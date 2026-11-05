// Punch Pup: chunky faceted puppy matching the creature sheet style.
import { SW as PALETTE, V, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';
export { PALETTE };
const SW = PALETTE;

export function buildGeometry() {
  const C = [], S = []; // centre parts, right-side parts (auto-mirrored)
  const X = V(1, 0, 0);
  const tan = (pts, lo = 0.0, hi = 0.95) => paint(hull(pts), SW.tan, 'y', [lo, hi]);
  const cream = (g, lo, hi) => paint(g, SW.cream, lo === undefined ? 'flat' : 'y', lo === undefined ? null : [lo, hi]);

  // ================= BODY (stocky barrel, boxy octagonal sections) =================
  C.push(tan([
    ...ring(V(0, 0.35, -0.29), 0.09, 0.08, 10, 'z'),
    ...ring(V(0, 0.36, -0.23), 0.155, 0.15, 10, 'z'),
    ...ring(V(0, 0.37, -0.08), 0.175, 0.17, 10, 'z'),
    ...ring(V(0, 0.39, 0.08), 0.18, 0.175, 10, 'z'),
    ...ring(V(0, 0.42, 0.2), 0.16, 0.16, 10, 'z'),
    ...ring(V(0, 0.44, 0.26), 0.1, 0.1, 10, 'z'),
  ], 0.15, 0.6));
  // neck
  C.push(tan([...ring(V(0, 0.44, 0.15), 0.125, 0.12, 10, 'y'), ...ring(V(0, 0.62, 0.2), 0.13, 0.12, 10, 'y')], 0.3, 0.8));

  // ================= LEGS (short, thick, cream boxy paws with toes) =================
  // front leg: thick tapered column with a broad shoulder top
  S.push(tan([...ring(V(0.152, 0.06, 0.215), 0.07, 0.07, 8), ...ring(V(0.146, 0.2, 0.205), 0.078, 0.08, 8),
    ...ring(V(0.13, 0.33, 0.18), 0.092, 0.1, 8), ...ring(V(0.11, 0.42, 0.15), 0.07, 0.085, 8)], 0.0, 0.55));
  // back leg: angular haunch + short shin
  S.push(tan([...ring(V(0.13, 0.43, -0.17), 0.07, 0.1, 8), ...ring(V(0.155, 0.32, -0.16), 0.1, 0.145, 8),
    ...ring(V(0.155, 0.2, -0.15), 0.08, 0.1, 8)], 0.0, 0.55));
  S.push(tan([...ring(V(0.158, 0.22, -0.16), 0.074, 0.08, 8), ...ring(V(0.162, 0.13, -0.2), 0.07, 0.07, 8),
    ...ring(V(0.163, 0.06, -0.19), 0.068, 0.068, 8)], 0.0, 0.55));
  // paws: heel pad block + 3 chunky toes, flat on the ground
  const paw = (x, z) => {
    S.push(cream(hull(cbox(V(x, 0.042, z - 0.005), 0.072, 0.042, 0.065, 0.022)), 0, 0.09));
    for (const dx of [-0.046, 0, 0.046])
      S.push(cream(hull(cbox(V(x + dx, 0.034, z + 0.06), 0.025, 0.034, 0.032, 0.012)), 0, 0.09));
  };
  paw(0.155, 0.215);
  paw(0.163, -0.17);

  // ================= CHEST RUFF (cream shards fanning down) =================
  C.push(paint(blob(1, V(0, 0.44, 0.255), V(0.14, 0.15, 0.09), { jitter: 0.18 }), SW.cream, 'y', [0.26, 0.62]));
  C.push(cream(shard(V(0, 0.32, 0.27), V(0, -1, 0.35), 0.055, 0.11)));
  C.push(cream(shard(V(0, 0.42, 0.32), V(0, -0.7, 1), 0.06, 0.08)));
  C.push(cream(shard(V(0, 0.53, 0.31), V(0, -0.4, 1), 0.06, 0.07)));
  for (const [b, d, w, l] of [
    [V(0.055, 0.32, 0.27), V(0.25, -1, 0.35), 0.05, 0.1],
    [V(0.105, 0.35, 0.25), V(0.6, -1, 0.3), 0.05, 0.09],
    [V(0.06, 0.43, 0.31), V(0.35, -0.7, 1), 0.055, 0.075],
    [V(0.125, 0.45, 0.27), V(0.9, -0.7, 0.6), 0.05, 0.075],
    [V(0.065, 0.53, 0.3), V(0.45, -0.4, 1), 0.05, 0.065],
    [V(0.13, 0.55, 0.25), V(1, -0.4, 0.5), 0.05, 0.065],
    [V(0.15, 0.48, 0.2), V(1, -0.8, 0.0), 0.045, 0.06],
  ]) S.push(cream(shard(b, d, w, l)));
  // tan fur tufts at shoulder & hip
  S.push(paint(shard(V(0.165, 0.43, 0.08), V(0.6, -0.4, -1), 0.045, 0.07), SW.tan, 'flat'));
  S.push(paint(shard(V(0.17, 0.36, -0.1), V(0.6, -0.5, -1), 0.04, 0.06), SW.tan, 'flat'));

  // ================= HEAD (big, boxy, rounded crown) =================
  const H = { y: 0.72, z: 0.21 }; // head centre
  C.push(tan([
    ...cbox(V(0, H.y, H.z), 0.2, 0.155, 0.165, 0.065),
    ...ring(V(0, H.y + 0.175, H.z), 0.12, 0.1, 8, 'y'),           // domed crown
    V(0.215, H.y - 0.075, H.z + 0.06), V(-0.215, H.y - 0.075, H.z + 0.06), // puffy cheeks
  ], 0.5, 0.92));
  const FZ = H.z + 0.165; // front face plane

  // forehead tuft & cheek fluff
  C.push(paint(shard(V(0, H.y + 0.16, H.z + 0.05), V(0, 1, 0.5), 0.04, 0.07), SW.tan, 'flat'));
  S.push(paint(shard(V(0.045, H.y + 0.165, H.z + 0.03), V(0.4, 1, 0.3), 0.035, 0.055), SW.tan, 'flat'));
  S.push(paint(shard(V(0.19, H.y - 0.07, H.z + 0.06), V(1, -0.6, 0.2), 0.045, 0.075), SW.tan, 'flat'));
  S.push(paint(shard(V(0.18, H.y - 0.11, H.z - 0.02), V(0.8, -0.9, -0.2), 0.04, 0.07), SW.tan, 'flat'));

  // muzzle (cream block), lower jaw, nose, mouth
  C.push(paint(hull([...cbox(V(0, H.y - 0.075, FZ + 0.035), 0.105, 0.062, 0.075, 0.03),
    V(0.07, H.y - 0.01, FZ - 0.03), V(-0.07, H.y - 0.01, FZ - 0.03)]), SW.muzzle, 'y', [0.58, 0.72]));
  C.push(paint(hull(cbox(V(0, H.y - 0.135, FZ + 0.0), 0.08, 0.03, 0.07, 0.015)), SW.cream, 'flat'));
  C.push(paint(hull([...cbox(V(0, H.y - 0.035, FZ + 0.108), 0.045, 0.022, 0.02, 0.01),
    V(0, H.y - 0.07, FZ + 0.1), V(0.02, H.y - 0.062, FZ + 0.1), V(-0.02, H.y - 0.062, FZ + 0.1)]), SW.nose, 'y'));
  C.push(paint(hull(cbox(V(0, H.y - 0.09, FZ + 0.105), 0.006, 0.022, 0.006, 0.002)), SW.mouth, 'flat'));
  S.push(paint(hull([V(0, H.y - 0.112, FZ + 0.11), V(0, H.y - 0.1, FZ + 0.11), V(0.055, H.y - 0.122, FZ + 0.098),
    V(0.055, H.y - 0.112, FZ + 0.098), V(0, H.y - 0.112, FZ + 0.1), V(0.055, H.y - 0.118, FZ + 0.085)]), SW.mouth, 'flat'));

  // fierce eyes: white almond with angry flat top, big black pupil, catchlight
  const E = V(0.088, H.y + 0.03, 0);
  S.push(paint(hull(plate([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]],
    E, FZ - 0.01, FZ + 0.012)), SW.white, 'flat'));
  S.push(paint(hull(plate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]],
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.014, FZ + 0.021)), SW.white, 'flat'));
  // heavy brow ridge slanting down to the centre
  S.push(paint(hull([
    V(0.028, E.y + 0.012, FZ + 0.03), V(0.03, E.y + 0.05, FZ + 0.02),
    V(0.15, E.y + 0.05, FZ - 0.01), V(0.15, E.y + 0.088, FZ - 0.025),
    V(0.028, E.y + 0.012, FZ - 0.03), V(0.03, E.y + 0.06, FZ - 0.04),
    V(0.15, E.y + 0.05, FZ - 0.06), V(0.15, E.y + 0.09, FZ - 0.07),
  ]), SW.brow, 'y'));

  // big floppy ears: thick, wide, hanging out to the sides
  S.push(paint(tube(curveSamples(
    [V(0.12, H.y + 0.15, H.z - 0.02), V(0.215, H.y + 0.165, H.z - 0.015), V(0.275, H.y + 0.08, H.z - 0.005),
      V(0.295, H.y - 0.05, H.z + 0.01), V(0.28, H.y - 0.16, H.z + 0.025)],
    8, (t) => 0.075 + 0.045 * Math.sin(Math.PI * Math.min(1, t * 1.05)), (t) => 0.042 - 0.012 * t),
    { seg: 6, axis: V(0.35, 0, 1), capStart: 0.0, capEnd: 0.06, phase: Math.PI / 6 }), SW.ear, 'len'));

  // ================= TAIL (fluffy curl, tan -> cream tip) =================
  C.push(paint(tube(curveSamples(
    [V(0, 0.4, -0.27), V(0, 0.5, -0.38), V(0, 0.64, -0.42), V(0, 0.75, -0.36), V(0, 0.77, -0.27), V(0, 0.7, -0.23), V(0, 0.66, -0.27)],
    14, (t) => (0.05 + 0.04 * Math.sin(Math.PI * Math.min(1, t * 1.25))) * (t > 0.85 ? 1 - (t - 0.85) * 3 : 1)),
    { seg: 8, axis: X, capEnd: 0.04, twist: (i) => (i % 2) * Math.PI / 8, scale: (i) => (i % 2 ? 1.32 : 0.95) }),
    SW.tail, 'len'));

  return assemble(C, S);
}

// Game name: MeshPart name in Roblox and the export file name
export const NAME = 'PunchPup';

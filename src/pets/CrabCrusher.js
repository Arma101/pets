// Crab Crusher (SECRET): red-orange armoured crab with huge crusher claws, coral-grown shell,
// pearls, glowing cyan runes and floating pearls. Mirror-symmetric (both claws oversized).
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  shell:   { i: 0, top: '#FFA468', bot: '#C42C1A' },
  belly:   { i: 1, top: '#FFE0B8', bot: '#F2A066' },
  leg:     { i: 2, top: '#FF7A40', bot: '#B8301C' },
  claw:    { i: 3, top: '#FFAA6E', bot: '#C42E1A' },
  tip:     { i: 4, top: '#8E2418', bot: '#4E120C' },
  white:   { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  eye:     { i: 6, top: '#1A1416', bot: '#0C0A0B' },
  brow:    { i: 7, top: '#E2462A', bot: '#9E2414' },
  coralP:  { i: 8, top: '#E8508A', bot: '#FFB8D6' },
  coralO:  { i: 9, top: '#F06A2E', bot: '#FFC27A' },
  pearl:   { i: 10, top: '#FFFFFF', bot: '#F8E0F6' },
  glow:    { i: 11, top: '#9FF7FF', bot: '#18C4FF', glow: true },
  mouth:   { i: 12, top: '#7A2A1A', bot: '#4A160C' },
  stalk:   { i: 13, top: '#FF8E50', bot: '#D84426' },
  gold:    { i: 14, top: '#FFE46C', bot: '#E39E12' },
};
const SW = PALETTE;

const add = (a, b, s = 1) => a.clone().addScaledVector(b, s);
// ring of n points around p perpendicular to dir (radii ra along "side", rb along "up-ish")
function segRing(p, dir, ra, rb, n = 6, phase = 0) {
  const d = dir.clone().normalize();
  const up = Math.abs(d.y) > 0.9 ? V(0, 0, 1) : V(0, 1, 0);
  const a = new THREE.Vector3().crossVectors(d, up).normalize();
  const b = new THREE.Vector3().crossVectors(a, d).normalize();
  const pts = [];
  for (let k = 0; k < n; k++) {
    const t = phase + (2 * Math.PI * k) / n;
    pts.push(add(add(p, a, Math.cos(t) * ra), b, Math.sin(t) * rb));
  }
  return pts;
}
// faceted limb segment between p0 and p1
function seg(p0, p1, r0, r1, n = 6, extra = []) {
  const d = p1.clone().sub(p0);
  return hull([...segRing(p0, d, r0, r0, n, Math.PI / n), ...segRing(p1, d, r1, r1, n, Math.PI / n), ...extra]);
}

export function buildGeometry() {
  const C = [], S = [];
  const P10 = Math.PI / 10;

  // ================= CARAPACE (wide armoured shell, wider at the front) =================
  const shellPts = [
    ...ring(V(0, 0.22, 0.0), 0.25, 0.17, 10, 'y', P10),
    ...ring(V(0, 0.31, 0.01), 0.36, 0.25, 10, 'y', P10),
    ...ring(V(0, 0.41, 0.0), 0.355, 0.255, 10, 'y', P10),
    ...ring(V(0, 0.51, -0.01), 0.27, 0.2, 10, 'y', P10),
    ...ring(V(0, 0.565, -0.01), 0.15, 0.115, 10, 'y', P10),
    // front shoulders flare forward
    V(0.27, 0.38, 0.22), V(-0.27, 0.38, 0.22),
  ];
  C.push(paint(hull(shellPts), SW.shell, 'y', [0.2, 0.58]));
  // belly plate underneath
  C.push(paint(hull([...ring(V(0, 0.17, 0.0), 0.2, 0.13, 10, 'y', P10), ...ring(V(0, 0.27, 0.01), 0.3, 0.2, 10, 'y', P10)]),
    SW.belly, 'y', [0.15, 0.3]));

  // raised armour ridge plates on the shell (centre spine + mirrored side plates)
  C.push(paint(hull([...cbox(V(0, 0.575, 0.04), 0.06, 0.012, 0.09, 0.012), V(0, 0.56, 0.17), V(0, 0.55, -0.14)]), SW.brow, 'y', [0.54, 0.6]));
  S.push(paint(hull([V(0.12, 0.57, 0.1), V(0.2, 0.545, 0.12), V(0.28, 0.495, 0.14), V(0.31, 0.45, 0.14),
    V(0.12, 0.56, -0.01), V(0.22, 0.53, -0.01), V(0.32, 0.46, 0.0), V(0.13, 0.5, 0.05), V(0.25, 0.46, 0.06)]), SW.brow, 'y', [0.42, 0.58]));
  // rear armour plate (beefier back shell)
  S.push(paint(hull([V(0.08, 0.56, -0.06), V(0.2, 0.53, -0.07), V(0.3, 0.47, -0.1), V(0.08, 0.53, -0.15), V(0.2, 0.5, -0.17),
    V(0.28, 0.45, -0.18), V(0.1, 0.5, -0.1), V(0.24, 0.45, -0.12)]), SW.brow, 'y', [0.42, 0.58]));
  // spiky front-lateral teeth along the shell rim
  for (const [b, d, w, l] of [
    [V(0.3, 0.4, 0.17), V(0.7, 0.15, 0.5), 0.035, 0.08],
    [V(0.35, 0.4, 0.08), V(1, 0.15, 0.25), 0.035, 0.08],
    [V(0.36, 0.4, -0.04), V(1, 0.15, -0.1), 0.032, 0.07],
  ]) S.push(paint(shard(b, d, w, l), SW.shell, 'flat'));

  // ================= GLOWING RUNE PATTERNS =================
  // centre diamond rune on the top plate
  {
    const dia = [[0, 0.06], [0.04, 0], [0, -0.06], [-0.04, 0]];
    const pts = [];
    for (const [u, v] of dia) pts.push(V(u, 0.592, 0.04 + v), V(u, 0.58, 0.04 + v));
    C.push(paint(hull(pts), SW.glow, 'flat'));
  }
  // glowing spot runes on the shell slopes (gems sit on the facet between the 0.41 and 0.51 rings)
  const shellPt = (th, f = 0.5) => {
    const y = 0.41 + 0.1 * f, rA = 0.355 + (0.27 - 0.355) * f, rB = 0.255 + (0.2 - 0.255) * f;
    return V(Math.cos(th) * rA, y, Math.sin(th) * rB - 0.01 * f);
  };
  for (const [th, f, r] of [[1.2, 0.45, 0.026], [0.75, 0.4, 0.03], [0.3, 0.45, 0.026], [-0.25, 0.4, 0.024], [-0.75, 0.45, 0.026]])
    S.push(paint(blob(0, shellPt(th, f), V(r, r * 0.9, r)), SW.glow, 'flat'));
  // glowing band around the shell rim
  C.push(paint(hull([...ring(V(0, 0.355, 0.005), 0.368, 0.262, 10, 'y', P10), ...ring(V(0, 0.375, 0.005), 0.368, 0.262, 10, 'y', P10)]), SW.glow, 'flat'));

  // ================= CORAL GROWTHS + PEARLS on the back of the shell =================
  const coral = (pts, r, sw, n = 5) => {
    const end = pts[pts.length - 1];
    const knob = blob(0, end, V(r * 1.45, r * 1.45, r * 1.45));
    paint(knob, sw, 'flat');
    const uv = knob.attributes.uv; // knob takes the light tip colour
    const cell = sw.i; const x = (cell % 8) * 128, y = Math.floor(cell / 8) * 128;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (x + 64) / 1024, (y + 100) / 1024);
    (Math.abs(end.x) < 1e-6 ? C : S).push(knob);
    return paint(tube(curveSamples(pts, n, (t) => r * 1.5 * (1 - 0.3 * t)), { seg: 6, capEnd: r * 0.9 }), sw, 'len');
  };
  // central pink coral tree
  C.push(coral([V(0, 0.5, -0.16), V(0, 0.62, -0.19), V(0, 0.72, -0.2)], 0.035, SW.coralP));
  S.push(coral([V(0.0, 0.6, -0.185), V(0.05, 0.67, -0.2), V(0.08, 0.75, -0.21)], 0.024, SW.coralP, 4));
  S.push(coral([V(0.0, 0.56, -0.18), V(0.06, 0.6, -0.17), V(0.1, 0.66, -0.15)], 0.022, SW.coralP, 4));
  // orange coral clusters on the rear shoulders
  S.push(coral([V(0.2, 0.46, -0.13), V(0.25, 0.55, -0.17), V(0.27, 0.63, -0.17)], 0.03, SW.coralO));
  S.push(coral([V(0.22, 0.47, -0.12), V(0.3, 0.52, -0.1), V(0.34, 0.57, -0.08)], 0.022, SW.coralO, 4));
  S.push(paint(shard(V(0.15, 0.5, -0.16), V(0.2, 1, -0.5), 0.025, 0.09), SW.coralP, 'flat'));
  // pearls nestled at the coral bases
  C.push(paint(blob(1, V(0, 0.57, -0.1), V(0.035, 0.035, 0.035)), SW.pearl, 'y', [0.53, 0.61]));
  S.push(paint(blob(1, V(0.15, 0.53, -0.08), V(0.028, 0.028, 0.028)), SW.pearl, 'y', [0.5, 0.56]));
  S.push(paint(blob(0, V(0.27, 0.43, -0.16), V(0.024, 0.024, 0.024)), SW.pearl, 'y', [0.4, 0.46]));

  // ================= EYE STALKS + FIERCE EYES =================
  const E = V(0.125, 0.75, 0.22); // eye pod centre
  S.push(paint(seg(V(0.09, 0.5, 0.16), V(0.12, 0.69, 0.21), 0.052, 0.045, 6), SW.stalk, 'y', [0.5, 0.7]));
  const PH = { x: 0.09, y: 0.078, z: 0.07 };
  S.push(paint(hull([...cbox(E, PH.x, PH.y, PH.z, 0.028), V(E.x, E.y + PH.y + 0.02, E.z - 0.01)]), SW.stalk, 'y', [0.68, 0.84]));
  const FZ = E.z + PH.z; // pod front face
  const EC = V(E.x + 0.004, E.y - 0.008, 0);
  const sc = 1.15;
  const sp = (arr) => arr.map(([u, v]) => [u * sc, v * sc]);
  S.push(paint(hull(plate(sp([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]]),
    EC, FZ - 0.01, FZ + 0.01)), SW.white, 'flat'));
  S.push(paint(hull(plate(sp([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]]),
    V(EC.x - 0.005, EC.y, 0), FZ + 0.004, FZ + 0.016)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.008, -0.008], [0.008, -0.008], [0.008, 0.008], [-0.008, 0.008]],
    V(EC.x + 0.008, EC.y + 0.004, 0), FZ + 0.012, FZ + 0.02)), SW.white, 'flat'));
  // heavy brow: slants down toward the centre line
  S.push(paint(hull([
    V(0.02, EC.y + 0.018, FZ + 0.03), V(0.025, EC.y + 0.06, FZ + 0.02),
    V(0.2, EC.y + 0.06, FZ + 0.0), V(0.2, EC.y + 0.1, FZ - 0.015),
    V(0.02, EC.y + 0.018, FZ - 0.05), V(0.025, EC.y + 0.07, FZ - 0.06),
    V(0.2, EC.y + 0.06, FZ - 0.08), V(0.2, EC.y + 0.1, FZ - 0.08),
  ]), SW.brow, 'y', [0.74, 0.86]));

  // ================= MOUTH PLATES (front of shell) =================
  C.push(paint(hull([...cbox(V(0, 0.29, 0.24), 0.08, 0.045, 0.03, 0.015), V(0, 0.24, 0.25)]), SW.brow, 'y', [0.24, 0.34]));
  C.push(paint(hull(cbox(V(0, 0.3, 0.272), 0.045, 0.006, 0.004, 0.002)), SW.mouth, 'flat'));

  // ---- scale the whole body group up (bigger armoured tank) and sit it low ----
  const KX = 1.18, KY = 1.25, KZ = 1.18;
  for (const g of [...C, ...S]) {
    const pa = g.attributes.position;
    for (let i = 0; i < pa.count; i++) pa.setXYZ(i, pa.getX(i) * KX, 0.15 + (pa.getY(i) - 0.17) * KY, pa.getZ(i) * KZ);
    g.computeVertexNormals();
  }

  // ================= FLOATING DETAILS (pearls + glow crystals close above the shell) =================
  const crystal = (c, h, w) => hull([V(c.x, c.y + h, c.z), V(c.x, c.y - h, c.z), V(c.x + w, c.y, c.z), V(c.x - w, c.y, c.z), V(c.x, c.y, c.z + w), V(c.x, c.y, c.z - w)]);
  C.push(paint(blob(1, V(0, 0.86, 0.0), V(0.056, 0.056, 0.056)), SW.pearl, 'y', [0.81, 0.91]));
  C.push(paint(crystal(V(0, 0.745, 0.0), 0.045, 0.02), SW.glow, 'flat'));
  S.push(paint(blob(1, V(0.24, 0.78, -0.1), V(0.044, 0.044, 0.044)), SW.pearl, 'y', [0.74, 0.82]));
  S.push(paint(crystal(V(0.4, 0.66, 0.02), 0.04, 0.018), SW.glow, 'flat'));

  // ================= WALKING LEGS (3 pairs: short, thick, crab-bent, planted) =================
  const legs = [
    { hip: V(0.3, 0.27, 0.1), knee: V(0.43, 0.45, 0.17), ank: V(0.52, 0.24, 0.25), foot: V(0.55, 0.0, 0.31) },
    { hip: V(0.33, 0.27, -0.04), knee: V(0.46, 0.46, -0.05), ank: V(0.56, 0.24, -0.07), foot: V(0.59, 0.0, -0.08) },
    { hip: V(0.3, 0.27, -0.18), knee: V(0.42, 0.44, -0.27), ank: V(0.51, 0.23, -0.36), foot: V(0.54, 0.0, -0.43) },
  ];
  const joint = (p, r) => hull([...segRing(p, V(0, 1, 0), r, r, 6), ...segRing(p, V(1, 0, 0), r, r, 6)]);
  for (const { hip, knee, ank, foot } of legs) {
    S.push(paint(seg(hip, knee, 0.09, 0.082, 6), SW.leg, 'y', [0.2, 0.56]));
    S.push(paint(joint(knee, 0.086), SW.leg, 'y', [0.3, 0.56]));
    S.push(paint(seg(knee, ank, 0.08, 0.07, 6), SW.leg, 'y', [0.1, 0.56]));
    S.push(paint(joint(ank, 0.07), SW.leg, 'y', [0.1, 0.56]));
    const mid = ank.clone().lerp(foot, 0.55);
    S.push(paint(seg(ank, mid, 0.068, 0.056, 6), SW.leg, 'y', [0.0, 0.56]));
    // blunt dark tip, flat-ish bottom planted at y = 0
    const d = foot.clone().sub(mid);
    S.push(paint(hull([...segRing(mid, d, 0.056, 0.056, 6, Math.PI / 6), ...segRing(foot, d, 0.028, 0.028, 6, Math.PI / 6)]
      .map(q => V(q.x, Math.max(0, q.y), q.z))), SW.tip, 'y', [0.0, 0.14]));
  }

  // ================= CRUSHER CLAWS (both oversized: boxing-glove chunky) =================
  const sh = V(0.27, 0.3, 0.22), el = V(0.41, 0.33, 0.32), wr = V(0.38, 0.3, 0.42);
  S.push(paint(seg(sh, el, 0.055, 0.06, 6), SW.claw, 'y', [0.25, 0.42]));
  S.push(paint(hull([...segRing(el, V(0, 1, 0), 0.065, 0.065, 6), ...segRing(el, V(1, 0, 0), 0.06, 0.06, 6)]), SW.claw, 'y', [0.25, 0.42]));
  S.push(paint(seg(el, wr, 0.06, 0.07, 6), SW.claw, 'y', [0.22, 0.42]));
  // palm: big faceted block
  const PC = V(0.36, 0.29, 0.56);
  S.push(paint(hull([
    ...ring(V(PC.x, PC.y, PC.z - 0.13), 0.085, 0.1, 8, 'z'),
    ...ring(V(PC.x + 0.01, PC.y + 0.01, PC.z - 0.03), 0.13, 0.15, 8, 'z'),
    ...ring(V(PC.x + 0.005, PC.y + 0.005, PC.z + 0.07), 0.12, 0.14, 8, 'z'),
    ...ring(V(PC.x, PC.y, PC.z + 0.12), 0.08, 0.1, 8, 'z'),
  ]), SW.claw, 'y', [0.15, 0.46]));
  // upper movable finger (dactyl), arcing down toward the tip
  S.push(paint(hull([
    ...ring(V(PC.x + 0.01, PC.y + 0.06, PC.z + 0.1), 0.07, 0.06, 6, 'z', 0),
    ...ring(V(PC.x + 0.005, PC.y + 0.06, PC.z + 0.22), 0.05, 0.04, 6, 'z', 0),
    V(PC.x, PC.y + 0.0, PC.z + 0.31),
  ]), SW.claw, 'y', [0.25, 0.42]));
  // lower fixed finger
  S.push(paint(hull([
    ...ring(V(PC.x, PC.y - 0.07, PC.z + 0.1), 0.06, 0.045, 6, 'z', 0),
    ...ring(V(PC.x, PC.y - 0.065, PC.z + 0.2), 0.04, 0.03, 6, 'z', 0),
    V(PC.x, PC.y - 0.035, PC.z + 0.27),
  ]), SW.claw, 'y', [0.15, 0.35]));
  // dark finger tips
  S.push(paint(shard(V(PC.x, PC.y + 0.012, PC.z + 0.29), V(0, -0.6, 1), 0.02, 0.05, 4), SW.tip, 'flat'));
  S.push(paint(shard(V(PC.x, PC.y - 0.04, PC.z + 0.255), V(0, 0.4, 1), 0.016, 0.04, 4), SW.tip, 'flat'));
  // crushing teeth (gold) inside the jaws
  for (const dz of [0.14, 0.19])
    S.push(paint(shard(V(PC.x, PC.y + 0.02, PC.z + dz), V(0, -1, 0.2), 0.016, 0.035, 4), SW.gold, 'flat'));
  for (const dz of [0.12, 0.17])
    S.push(paint(shard(V(PC.x, PC.y - 0.035, PC.z + dz), V(0, 1, 0.2), 0.014, 0.03, 4), SW.gold, 'flat'));
  // knuckle spikes on top of the claw
  for (const [dx, dz] of [[-0.03, -0.06], [0.04, -0.02], [-0.02, 0.04]])
    S.push(paint(shard(V(PC.x + dx, PC.y + 0.15, PC.z + dz), V(dx * 4, 1, 0.3), 0.032, 0.09, 4), SW.brow, 'flat'));
  // glowing rune stripe on the claw's outer face
  S.push(paint(hull([V(PC.x + 0.125, PC.y + 0.06, PC.z - 0.08), V(PC.x + 0.142, PC.y + 0.06, PC.z - 0.03), V(PC.x + 0.142, PC.y - 0.04, PC.z - 0.0),
    V(PC.x + 0.125, PC.y - 0.04, PC.z + 0.05), V(PC.x + 0.1, PC.y + 0.06, PC.z - 0.08), V(PC.x + 0.1, PC.y - 0.04, PC.z + 0.05),
    V(PC.x + 0.142, PC.y + 0.01, PC.z - 0.02), V(PC.x + 0.12, PC.y + 0.0, PC.z - 0.0)]), SW.glow, 'flat'));
  // coral growth + pearl on each claw
  S.push(coral([V(PC.x - 0.04, PC.y + 0.11, PC.z - 0.08), V(PC.x - 0.06, PC.y + 0.2, PC.z - 0.1), V(PC.x - 0.05, PC.y + 0.26, PC.z - 0.13)], 0.022, SW.coralP, 4));
  S.push(paint(blob(0, V(PC.x + 0.05, PC.y + 0.135, PC.z - 0.09), V(0.022, 0.022, 0.022)), SW.pearl, 'y', [0.4, 0.47]));

  return assemble(C, S);
}

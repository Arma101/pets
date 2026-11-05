// Southpaw Otter (Secret, Round 8 - Ocean Octagon): chunky faceted river otter standing upright on its
// webbed hind feet with the thick tail as a third support, clutching a big glowing pearl to its chest.
// Glossy wet brown fur, cream chest/muzzle, coral wristbands + coral crown, glowing cyan runes, floating pearls.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  // glossy wet fur: brown gradient with a soft light sheen band near the top
  fur:    { i: 0, top: '#B9814E', bot: '#6A3C1D', draw(g, x, y) {
    const gr = g.createLinearGradient(0, y + 16, 0, y + 112);
    gr.addColorStop(0, '#BC8450'); gr.addColorStop(0.12, '#D9A472'); gr.addColorStop(0.22, '#E6B686');
    gr.addColorStop(0.34, '#B47B48'); gr.addColorStop(1, '#663A1C');
    g.fillStyle = '#BC8450'; g.fillRect(x, y, 128, 16);
    g.fillStyle = gr; g.fillRect(x, y + 16, 128, 96);
    g.fillStyle = '#663A1C'; g.fillRect(x, y + 112, 128, 16);
  } },
  cream:  { i: 1, top: '#FFF2D8', bot: '#E9CB98' },
  dark:   { i: 2, top: '#5A3520', bot: '#2E1A0E' },
  nose:   { i: 3, top: '#3A3438', bot: '#141114' },
  eye:    { i: 4, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 5, top: '#FFFFFF', bot: '#F1F1F4' },
  muzzle: { i: 6, top: '#FBE8C6', bot: '#E2C08E' },
  wet:    { i: 7, top: '#D59A63', bot: '#7A4523' },   // glossy wet fur shards (light tips)
  brow:   { i: 8, top: '#8E5631', bot: '#5C321A' },
  coral:  { i: 9, top: '#FF8A73', bot: '#E8435A' },
  mouth:  { i: 10, top: '#5A2E1A', bot: '#3E1E10' },
  glow:   { i: 11, top: '#9FF7FF', bot: '#3FD8FF', glow: true },
  pearl:  { i: 12, top: '#FFFFFF', bot: '#CDBDEB', draw(g, x, y) {   // pearly: bright top, pink blush, lavender base
    const gr = g.createLinearGradient(0, y + 16, 0, y + 112);
    gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.25, '#FFF6FB'); gr.addColorStop(0.55, '#F6DDEE');
    gr.addColorStop(0.8, '#DCCDF2'); gr.addColorStop(1, '#C3B2E6');
    g.fillStyle = '#FFFFFF'; g.fillRect(x, y, 128, 16);
    g.fillStyle = gr; g.fillRect(x, y + 16, 128, 96);
    g.fillStyle = '#C3B2E6'; g.fillRect(x, y + 112, 128, 16);
  } },
  orb:    { i: 13, top: '#FBF4FF', bot: '#B9A3E8' },
  tail:   { i: 14, top: '#A06A3C', bot: '#5E3418' },
};
const SW = PALETTE;

function swUV(sw, t, u = 0.5) {
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  return [(x + 24 + u * 80) / 1024, (y + 16 + Math.min(1, Math.max(0, t)) * 96) / 1024];
}
// per-face painter: fn(normal, centroid, vertex) -> [swatch, t]
function paintFaces(g, fn) {
  const p = g.attributes.position, uv = [];
  const a = V(0, 0, 0), b = V(0, 0, 0), c = V(0, 0, 0), T = g.userData.t || [];
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const cen = a.clone().add(b).add(c).divideScalar(3);
    const ft = Math.min(T[i] ?? 0, T[i + 1] ?? 0, T[i + 2] ?? 0);
    for (const v of [a, b, c]) { const [sw, t] = fn(n, cen, v, ft); uv.push(...swUV(sw, t)); }
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  delete g.userData.t;
  return g;
}

export function buildGeometry() {
  const C = [], S = [];
  const X = V(1, 0, 0);
  const fur = (pts, lo = 0.0, hi = 1.0) => paint(hull(pts), SW.fur, 'y', [lo, hi]);
  const wet = (b, d, w, l, flat = 0.5) => paint(shard(b, d, w, l, 4, flat), SW.wet, 'y', [b.y - 0.05, b.y + 0.05]);
  const glowP = (g) => paint(g, SW.glow, 'y');

  // ================= TORSO (upright pear, slight forward lean) =================
  C.push(fur([
    ...ring(V(0, 0.1, -0.03), 0.11, 0.1, 12, 'y'),
    ...ring(V(0, 0.2, -0.02), 0.17, 0.15, 12, 'y'),
    ...ring(V(0, 0.34, 0.0), 0.168, 0.145, 12, 'y'),
    ...ring(V(0, 0.47, 0.02), 0.145, 0.125, 12, 'y'),
    ...ring(V(0, 0.57, 0.04), 0.11, 0.1, 12, 'y'),
  ], 0.05, 0.75));
  // cream chest/belly plate
  C.push(paint(hull([
    ...ring(V(0, 0.13, 0.07), 0.08, 0.06, 8, 'y'),
    ...ring(V(0, 0.26, 0.09), 0.11, 0.065, 8, 'y'),
    ...ring(V(0, 0.4, 0.1), 0.11, 0.06, 8, 'y'),
    ...ring(V(0, 0.55, 0.1), 0.08, 0.05, 8, 'y'),
    ...ring(V(0, 0.64, 0.14), 0.07, 0.04, 8, 'y'),
  ]), SW.cream, 'y', [0.1, 0.7]));
  // neck
  C.push(fur([...ring(V(0, 0.5, 0.03), 0.12, 0.11, 10, 'y'), ...ring(V(0, 0.66, 0.06), 0.12, 0.11, 10, 'y')], 0.4, 0.85));

  // glowing chevron runes down the back: thin plates hugging the faceted back (two convex halves per V)
  const backZ = (y) => { // approx back surface z of the torso hull at height y (x = 0)
    const R = [[0.1, -0.03, 0.1], [0.2, -0.02, 0.15], [0.34, 0.0, 0.145], [0.47, 0.02, 0.125], [0.57, 0.04, 0.1]];
    for (let k = 0; k < R.length - 1; k++) if (y <= R[k + 1][0]) {
      const f = (y - R[k][0]) / (R[k + 1][0] - R[k][0]);
      return (R[k][1] + (R[k + 1][1] - R[k][1]) * f) - (R[k][2] + (R[k + 1][2] - R[k][2]) * f) * 0.965;
    }
  };
  for (const [y, w] of [[0.44, 0.06], [0.33, 0.07], [0.22, 0.07]]) {
    const z0 = backZ(y) - 0.012, z1 = backZ(y + 0.05) - 0.012, curl = (w * w) / 0.4;
    S.push(glowP(hull([
      V(0, y - 0.02, z0), V(0, y + 0.012, z0), V(w, y + 0.04, z1 + curl), V(w, y + 0.068, z1 + curl),
      V(0, y - 0.02, z0 + 0.03), V(0, y + 0.012, z0 + 0.03), V(w, y + 0.04, z1 + curl + 0.03), V(w, y + 0.068, z1 + curl + 0.03),
    ])));
  }

  // ================= HIND LEGS + WEBBED FEET =================
  S.push(fur([
    ...ring(V(0.06, 0.2, -0.02), 0.12, 0.11, 10, 'x'),
    ...ring(V(0.12, 0.18, 0.0), 0.13, 0.115, 10, 'x', 0.1),
    ...ring(V(0.18, 0.17, 0.01), 0.09, 0.08, 10, 'x'),
  ], 0.0, 0.4));
  S.push(fur([...ring(V(0.13, 0.12, 0.03), 0.06, 0.06, 8), ...ring(V(0.13, 0.05, 0.05), 0.055, 0.055, 8)], 0.0, 0.4));
  // dark webbed paddle foot + chunky toes
  S.push(paint(hull([...cbox(V(0.13, 0.03, 0.08), 0.065, 0.03, 0.08, 0.015),
    ...cbox(V(0.13, 0.025, 0.15), 0.08, 0.025, 0.03, 0.012)]), SW.dark, 'y', [0, 0.08]));
  for (const dx of [-0.054, -0.018, 0.018, 0.054])
    S.push(paint(hull(cbox(V(0.13 + dx, 0.022, 0.19), 0.017, 0.022, 0.025, 0.008)), SW.dark, 'y', [0, 0.06]));

  // ================= TAIL (thick, flat, tapering, resting on ground as a third support) =================
  C.push(paintFaces(tube(curveSamples(
    [V(0, 0.2, -0.1), V(0, 0.1, -0.22), V(0, 0.045, -0.38), V(0, 0.04, -0.52), V(0, 0.06, -0.64)],
    23, (t) => 0.1 * (1 - t * 0.78) + 0.01, (t) => 0.075 * (1 - t * 0.7) + 0.008),
    { seg: 8, axis: X, capEnd: 0.03 }), (n, c, v, ft) => {
      const seg = Math.round(ft * 22);
      if (n.y > 0.25 && (seg === 9 || seg === 13 || seg === 17)) return [SW.glow, 0.3];
      return n.y < -0.3 ? [SW.dark, 0.4] : [SW.tail, 0.35];
    }));

  // ================= ARMS (both paws clutch the pearl on the centre line) =================
  const sh = V(0.15, 0.5, 0.04), el = V(0.18, 0.36, 0.12), wr = V(0.095, 0.4, 0.23);
  S.push(fur([...ring(sh, 0.06, 0.06, 8), ...ring(el, 0.05, 0.05, 8)], 0.3, 0.6));
  S.push(fur([...ring(el, 0.05, 0.05, 8, 'z'), ...ring(wr, 0.045, 0.045, 8, 'z')], 0.3, 0.6));
  // coral wristband
  S.push(paint(tube([{ p: el.clone().lerp(wr, 0.55), rx: 0.056, ry: 0.056 }, { p: el.clone().lerp(wr, 0.8), rx: 0.054, ry: 0.054 }],
    { seg: 8 }), SW.coral, 'y'));
  // glowing rune stripe on the upper arm
  S.push(glowP(hull([...cbox(V(0.205, 0.45, 0.06), 0.012, 0.012, 0.03, 0.004), V(0.17, 0.45, 0.06)])));
  // chunky paw wrapping the pearl side + claws
  const pw = V(0.088, 0.4, 0.262);
  S.push(paint(hull([...cbox(pw, 0.03, 0.042, 0.036, 0.013)]), SW.dark, 'y', [0.34, 0.46]));
  // fingers wrapping around the front of the pearl + claw tips
  for (const dy of [-0.028, 0.0, 0.028]) {
    const f0 = V(0.085, 0.4 + dy, 0.31), f1 = V(0.064, 0.4 + dy * 0.9, 0.343);
    S.push(paint(hull([...cbox(f0, 0.016, 0.012, 0.016, 0.005), ...cbox(f1, 0.012, 0.011, 0.012, 0.004)]), SW.dark, 'y', [0.34, 0.46]));
    S.push(paint(shard(f1.clone().add(V(-0.004, 0, 0.006)), V(-0.9, 0, 0.35), 0.008, 0.022), SW.nose, 'flat'));
  }
  // ================= THE PEARL (big, glowing softly, centre line) =================
  C.push(paint(blob(2, V(0, 0.405, 0.275), V(0.09, 0.09, 0.09)), SW.pearl, 'y'));

  // ================= HEAD (big, broad, flat-topped otter head) =================
  const c0 = C.length, s0 = S.length;
  const H = { y: 0.73, z: 0.07 };
  C.push(fur([
    ...cbox(V(0, H.y, H.z + 0.03), 0.175, 0.125, 0.11, 0.055),
    ...ring(V(0, H.y + 0.005, H.z - 0.12), 0.135, 0.1, 8, 'z'),
    ...ring(V(0, H.y + 0.145, H.z - 0.01), 0.12, 0.1, 8, 'y'),
    V(0.19, H.y - 0.06, H.z + 0.04), V(-0.19, H.y - 0.06, H.z + 0.04),
  ], 0.58, 0.9));
  const FZ = H.z + 0.14;
  // muzzle: broad cream whisker-pad block
  C.push(paint(hull([...cbox(V(0, H.y - 0.065, FZ + 0.03), 0.105, 0.055, 0.065, 0.028),
    V(0.07, H.y - 0.005, FZ - 0.03), V(-0.07, H.y - 0.005, FZ - 0.03)]), SW.muzzle, 'y', [0.6, 0.74]));
  C.push(paint(hull(cbox(V(0, H.y - 0.125, FZ + 0.0), 0.075, 0.028, 0.06, 0.014)), SW.cream, 'flat'));
  // big dark otter nose
  C.push(paint(hull([...cbox(V(0, H.y - 0.025, FZ + 0.097), 0.05, 0.022, 0.02, 0.01),
    V(0, H.y - 0.06, FZ + 0.09), V(0.022, H.y - 0.052, FZ + 0.09), V(-0.022, H.y - 0.052, FZ + 0.09)]), SW.nose, 'y'));
  C.push(paint(hull(cbox(V(0, H.y - 0.08, FZ + 0.094), 0.006, 0.02, 0.006, 0.002)), SW.mouth, 'flat'));
  S.push(paint(hull([V(0, H.y - 0.1, FZ + 0.098), V(0, H.y - 0.09, FZ + 0.098), V(0.05, H.y - 0.11, FZ + 0.086),
    V(0.05, H.y - 0.1, FZ + 0.086), V(0, H.y - 0.1, FZ + 0.088), V(0.05, H.y - 0.106, FZ + 0.074)]), SW.mouth, 'flat'));
  // chunky whisker shards
  S.push(paint(shard(V(0.09, H.y - 0.05, FZ + 0.05), V(1, 0.15, 0.1), 0.01, 0.09, 4, 0.5), SW.cream, 'flat'));
  S.push(paint(shard(V(0.09, H.y - 0.075, FZ + 0.045), V(1, -0.2, 0.05), 0.01, 0.08, 4, 0.5), SW.cream, 'flat'));

  // fierce eyes
  const E = V(0.085, H.y + 0.03, 0);
  S.push(paint(hull(plate([[-0.042, 0.004], [0.046, 0.034], [0.052, -0.01], [0.02, -0.04], [-0.03, -0.036], [-0.046, -0.016]],
    E, FZ - 0.01, FZ + 0.012)), SW.white, 'flat'));
  S.push(paint(hull(plate([[-0.03, 0.004], [0.016, 0.02], [0.024, -0.008], [0.006, -0.032], [-0.022, -0.03], [-0.034, -0.012]],
    V(E.x - 0.004, E.y, 0), FZ + 0.006, FZ + 0.018)), SW.eye, 'flat'));
  S.push(paint(hull(plate([[-0.007, -0.007], [0.007, -0.007], [0.007, 0.007], [-0.007, 0.007]],
    V(E.x + 0.006, E.y + 0.002, 0), FZ + 0.014, FZ + 0.021)), SW.white, 'flat'));
  // heavy brow
  S.push(paint(hull([
    V(0.026, E.y + 0.012, FZ + 0.03), V(0.028, E.y + 0.05, FZ + 0.02),
    V(0.15, E.y + 0.05, FZ - 0.01), V(0.15, E.y + 0.088, FZ - 0.025),
    V(0.026, E.y + 0.012, FZ - 0.03), V(0.028, E.y + 0.06, FZ - 0.04),
    V(0.15, E.y + 0.05, FZ - 0.06), V(0.15, E.y + 0.09, FZ - 0.07),
  ]), SW.brow, 'y'));
  // glowing forehead diamond rune
  C.push(glowP(hull([V(0, H.y + 0.15, FZ - 0.02), V(0, H.y + 0.09, FZ + 0.012), V(0.022, H.y + 0.12, FZ - 0.0),
    V(-0.022, H.y + 0.12, FZ - 0.0), V(0, H.y + 0.12, FZ - 0.05)])));
  // sleek glowing streak sweeping from the outer eye corner back along the cheek toward the ear
  {
    const pts = [[H.z + 0.085, H.y - 0.012, 0.004], [H.z + 0.04, H.y + 0.006, 0.009], [H.z - 0.005, H.y + 0.03, 0.008], [H.z - 0.04, H.y + 0.055, 0.002]];
    for (let k = 0; k < pts.length - 1; k++) {
      const [za, ya, wa] = pts[k], [zb, yb, wb] = pts[k + 1];
      S.push(glowP(hull([V(0.168, ya - wa, za), V(0.168, ya + wa, za), V(0.187, ya - wa, za), V(0.187, ya + wa, za),
        V(0.168, yb - wb, zb), V(0.168, yb + wb, zb), V(0.187, yb - wb, zb), V(0.187, yb + wb, zb)])));
    }
  }

  // small round ears
  S.push(fur([...ring(V(0.15, H.y + 0.11, H.z - 0.04), 0.04, 0.04, 6, 'z'), ...ring(V(0.15, H.y + 0.11, H.z - 0.02), 0.04, 0.04, 6, 'z')], 0.7, 0.95));
  S.push(paint(hull(ring(V(0.152, H.y + 0.11, H.z - 0.01), 0.022, 0.022, 6, 'z').flatMap(p => [p, p.clone().add(V(0, 0, -0.008))])), SW.dark, 'flat'));

  // wet spiky fur shards: head top, cheeks, back of head
  C.push(wet(V(0, H.y + 0.13, H.z - 0.06), V(0, 0.6, -1), 0.04, 0.07));
  S.push(wet(V(0.08, H.y + 0.12, H.z - 0.07), V(0.4, 0.5, -1), 0.035, 0.06));
  S.push(wet(V(0.185, H.y - 0.07, H.z + 0.03), V(1, -0.6, 0.1), 0.04, 0.07));
  S.push(wet(V(0.17, H.y - 0.1, H.z - 0.04), V(0.8, -0.8, -0.3), 0.035, 0.06));
  C.push(wet(V(0, H.y - 0.02, H.z - 0.13), V(0, -0.5, -1), 0.05, 0.07));
  // wet shards on shoulders/hips
  S.push(wet(V(0.16, 0.48, -0.02), V(0.6, -0.5, -1), 0.04, 0.06));
  S.push(wet(V(0.15, 0.22, -0.09), V(0.3, -0.5, -1), 0.04, 0.065));
  S.push(wet(V(0.19, 0.34, 0.08), V(0.4, -0.6, -1), 0.035, 0.06));   // elbow
  S.push(wet(V(0.1, 0.6, -0.06), V(0.3, -0.4, -1), 0.04, 0.06));     // nape
  C.push(wet(V(0, 0.58, -0.08), V(0, -0.5, -1), 0.045, 0.065));

  // coral crown on top of the head
  const branch = (pts, r0, r1) => paint(tube(curveSamples(pts, 4, (t) => r0 + (r1 - r0) * t),
    { seg: 6, axis: V(0, 0, 1), capEnd: r1 * 0.9 }), SW.coral, 'y', [H.y + 0.1, H.y + 0.32]);
  const CR = V(0, H.y + 0.13, H.z - 0.01);
  C.push(branch([CR, CR.clone().add(V(0, 0.06, 0)), CR.clone().add(V(0, 0.12, 0.005))], 0.03, 0.02));
  S.push(branch([CR.clone().add(V(0.02, 0.03, 0)), CR.clone().add(V(0.065, 0.055, 0)), CR.clone().add(V(0.08, 0.1, 0))], 0.022, 0.016));
  S.push(branch([CR.clone().add(V(0.015, 0.08, 0)), CR.clone().add(V(0.04, 0.105, 0)), CR.clone().add(V(0.045, 0.14, 0))], 0.015, 0.012));

  // ================= FLOATING PEARL HALO (even arc behind the head, mirrored) =================
  const HC = V(0, H.y + 0.03, H.z - 0.15);
  for (const deg of [17, 42, 67])  {
    const ang = (Math.PI / 180) * (90 - deg);
    S.push(paint(blob(1, V(Math.cos(ang) * 0.285, HC.y + Math.sin(ang) * 0.285, HC.z), V(0.03, 0.03, 0.03)), SW.orb, 'y'));
  }

  // scale the whole head group up around the neck (keeps body/feet untouched)
  const HS = 1.14, piv = V(0, 0.6, 0.06);
  for (const [arr, from] of [[C, c0], [S, s0]]) for (let k = from; k < arr.length; k++) {
    const g = arr[k]; g.computeBoundingBox();
    const cy = (g.boundingBox.min.y + g.boundingBox.max.y) / 2;
    if (cy < 0.62) continue; // body wet shards placed in this section
    g.translate(-piv.x, -piv.y, -piv.z); g.scale(HS, HS, HS); g.translate(piv.x, piv.y, piv.z);
  }

  return assemble(C, S);
}

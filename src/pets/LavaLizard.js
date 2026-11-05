// Lava Lizard (LEGENDARY, Round 5 - Volcano Crater): stocky orange-red faceted lizard, dark-brown shard spikes,
// glowing lava-crack seams, obsidian claws + gold-trimmed obsidian armour, glowing eyes.
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';

export const PALETTE = {
  skin:   { i: 0, top: '#F0602C', bot: '#B52A18' },
  skinDk: { i: 1, top: '#D8461F', bot: '#9A2214' },
  belly:  { i: 2, top: '#FFB46A', bot: '#E9843E' },
  spike:  { i: 3, top: '#6E3C20', bot: '#3A1D0E' },
  spikeT: { i: 14, top: '#B98055', bot: '#8E5A34' },
  obs:    { i: 4, top: '#4A4060', bot: '#16121E' },
  gold:   { i: 5, top: '#FFE27A', bot: '#D9931C' },
  // hot core (#FFE680) -> lava orange (#FF9A1A) -> dark crust at the seam edge
  lava:   { i: 6, glow: true, draw(g, x, y) {
    const gr = g.createLinearGradient(0, y + 16, 0, y + 112);
    gr.addColorStop(0, '#FFE680'); gr.addColorStop(0.3, '#FFC23A'); gr.addColorStop(0.6, '#FF9A1A'); gr.addColorStop(1, '#8E2410');
    g.fillStyle = '#FFE680'; g.fillRect(x, y, 128, 16); g.fillStyle = gr; g.fillRect(x, y + 16, 128, 96);
    g.fillStyle = '#8E2410'; g.fillRect(x, y + 112, 128, 16);
  } },
  eyeW:   { i: 7, top: '#FFFFFF', bot: '#FFF3C8', glow: true },
  iris:   { i: 8, top: '#FFD27A', bot: '#FF7A00', glow: true },
  eye:    { i: 9, top: '#1A1416', bot: '#0C0A0B' },
  white:  { i: 10, top: '#FFFFFF', bot: '#F1F1F4' },
  brow:   { i: 11, top: '#C8401E', bot: '#8E2012' },
  mouth:  { i: 12, top: '#4A1A10', bot: '#2A0E08' },
  gem:    { i: 13, top: '#FFE08A', bot: '#FF5A00', glow: true },
};
const P = PALETTE;
const X = V(1, 0, 0);
const DROP = 0.04, SCALE = 1.15;

// ---------- lava-crack seams projected onto a part's surface ----------
const rc = new THREE.Raycaster();
const matDS = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
function hit(mesh, o, d) {
  rc.set(o, d.clone().normalize()); rc.near = 0; rc.far = 3;
  const h = rc.intersectObject(mesh, false)[0];
  return h ? { p: h.point.clone(), n: h.face.normal.clone().normalize() } : null;
}
// uv into a swatch cell at gradient position t (0 = top colour)
function swT(sw, t) {
  const x = (sw.i % 8) * 128, y = Math.floor(sw.i / 8) * 128;
  return [(x + 64) / 1024, (y + 16 + Math.min(1, Math.max(0, t)) * 96) / 1024];
}
// rays: [[origin, dir], ...] along the crack; returns seam prisms with a raised hot core and darker sloped shoulders
function crack(geo, rays, w = 0.009, step = 0.05) {
  const mesh = new THREE.Mesh(geo, matDS);
  const hits = rays.map(([o, d]) => hit(mesh, o, d));
  const fine = [];
  for (let i = 0; i < rays.length - 1; i++) {
    const a = hits[i], b = hits[i + 1];
    if (!a || !b) continue;
    const n = Math.max(1, Math.ceil(a.p.distanceTo(b.p) / step));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const o = rays[i][0].clone().lerp(rays[i + 1][0], t), d = rays[i][1].clone().lerp(rays[i + 1][1], t);
      const h = hit(mesh, o, d); if (h) fine.push(h);
    }
  }
  if (hits[hits.length - 1]) fine.push(hits[hits.length - 1]);
  const out = [];
  for (let i = 0; i < fine.length - 1; i++) {
    const A = fine[i], B = fine[i + 1];
    const dir = B.p.clone().sub(A.p); if (dir.length() < 1e-4) continue; dir.normalize();
    const t0 = i / (fine.length - 1), t1 = (i + 1) / (fine.length - 1);
    const wf = (t) => w * (0.35 + 0.65 * Math.sin(Math.PI * (0.06 + 0.88 * t)));
    const pts = [], core = [];
    for (const [H, t, sg] of [[A, t0, -1], [B, t1, 1]]) {
      const n = H.n, side = new THREE.Vector3().crossVectors(dir, n).normalize().multiplyScalar(wf(t));
      const c = H.p.clone().addScaledVector(dir, sg * wf(t) * 0.6);
      for (const sx of [-1, 1]) {
        const cp = c.clone().addScaledVector(side, sx * 0.8).addScaledVector(n, 0.011);
        pts.push(cp); core.push(cp);
        pts.push(c.clone().addScaledVector(side, sx * 2.1).addScaledVector(n, 0.005));
      }
      pts.push(c.clone().addScaledVector(n, -0.02));
    }
    const g = hull(pts), p = g.attributes.position, uv = [];
    for (let k = 0; k < p.count; k++) {
      const v = V(p.getX(k), p.getY(k), p.getZ(k));
      uv.push(...swT(P.lava, core.some((q) => q.distanceToSquared(v) < 1e-10) ? 0.12 : 0.95));
    }
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    out.push(g);
  }
  return out;
}

// two-tone spike shard: dark wide base, lighter tip facet (split at `k` of the height, no overlap)
function spikeShard(base, tip, l, w, k = 0.58) {
  const d = tip.clone().sub(base);
  const bp = [
    base.clone().add(V(0, 0, l)), base.clone().add(V(w, 0, l * 0.25)), base.clone().add(V(w * 0.8, 0, -l * 0.6)),
    base.clone().add(V(0, 0, -l)), base.clone().add(V(-w * 0.8, 0, -l * 0.6)), base.clone().add(V(-w, 0, l * 0.25)),
  ];
  const sec = bp.map((q) => q.clone().lerp(tip, k));
  return [
    paint(hull([...bp, ...sec]), P.spike, 'y', [base.y, base.y + d.y * k]),
    paint(hull([...sec, tip]), P.spikeT, 'y', [base.y + d.y * k, tip.y]),
  ];
}

// blade spike: diamond base (half-length l along `along`, half-width w across x), tip
function blade(base, tip, l, w, along = V(0, 0, 1)) {
  const a = along.clone().normalize();
  const d = tip.clone().sub(base).normalize();
  return hull([
    base.clone().addScaledVector(a, l), base.clone().addScaledVector(a, -l),
    base.clone().add(V(w, 0, 0)), base.clone().add(V(-w, 0, 0)),
    base.clone().addScaledVector(a, -l * 0.3).add(V(0, 0, 0)).addScaledVector(d, -0.03),
    tip,
  ]);
}

export function buildGeometry() {
  const C = [], S = [];
  const skin = (pts, lo = 0.0, hi = 0.62) => paint(hull(pts), P.skin, 'y', [lo, hi]);
  const obs = (g) => paint(g, P.obs, 'y');
  const gold = (g) => paint(g, P.gold, 'flat');

  // ================= BODY (low, broad barrel) =================
  const bodyRings = [
    [-0.36, 0.27, 0.12, 0.105], [-0.27, 0.275, 0.18, 0.14], [-0.1, 0.285, 0.205, 0.155],
    [0.06, 0.295, 0.205, 0.158], [0.18, 0.31, 0.18, 0.145], [0.26, 0.33, 0.12, 0.11],
  ];
  const bodyPts = [];
  for (const [z, y, rx, ry] of bodyRings) bodyPts.push(...ring(V(0, y, z), rx, ry, 10, 'z'));
  const bodyG = skin(bodyPts);
  C.push(bodyG);
  // lighter belly slab
  C.push(paint(hull([
    ...cbox(V(0, 0.165, -0.06), 0.16, 0.035, 0.26, 0.03),
    ...ring(V(0, 0.2, 0.2), 0.12, 0.1, 8, 'z'),
  ]), P.belly, 'y', [0.12, 0.3]));
  // neck
  const neckG = skin([...ring(V(0, 0.3, 0.12), 0.15, 0.14, 10, 'z'), ...ring(V(0, 0.44, 0.3), 0.135, 0.12, 10, 'z')]);
  C.push(neckG);
  // throat (belly colour)
  C.push(paint(hull([...ring(V(0, 0.27, 0.22), 0.1, 0.06, 8, 'z'), ...ring(V(0, 0.37, 0.36), 0.1, 0.06, 8, 'z')]),
    P.belly, 'y', [0.2, 0.42]));

  // ================= LEGS (short, thick, splayed) =================
  // front: splayed elbow, short thick forearm
  S.push(skin([...ring(V(0.13, 0.29, 0.15), 0.09, 0.095, 8, 'x'), ...ring(V(0.29, 0.225, 0.17), 0.08, 0.08, 8, 'x')]));
  S.push(paint(blob(0, V(0.295, 0.215, 0.17), V(0.085, 0.085, 0.085), { jitter: 0.1 }), P.skin, 'y', [0, 0.62]));
  const foreG = skin([...ring(V(0.3, 0.215, 0.17), 0.075, 0.075, 8), ...ring(V(0.32, 0.06, 0.19), 0.07, 0.07, 8)]);
  S.push(foreG);
  // back: big haunch, knee out, short shin
  const thighG = skin([...ring(V(0.12, 0.28, -0.22), 0.11, 0.13, 8, 'x'), ...ring(V(0.3, 0.22, -0.2), 0.095, 0.095, 8, 'x')]);
  S.push(thighG);
  S.push(paint(blob(0, V(0.305, 0.21, -0.2), V(0.092, 0.092, 0.092), { jitter: 0.1 }), P.skin, 'y', [0, 0.62]));
  const shinG = skin([...ring(V(0.31, 0.21, -0.2), 0.078, 0.078, 8), ...ring(V(0.33, 0.06, -0.19), 0.072, 0.072, 8)]);
  S.push(shinG);

  // feet: block + 4 splayed toes with obsidian claws, all flat on y=0
  const F = []; // feet: stay on the ground; everything else drops a little
  const foot = (x, z, turn) => {
    F.push(paint(hull([...cbox(V(x, 0.032, z), 0.078, 0.032, 0.07, 0.022), ...ring(V(x, 0.075, z - 0.005), 0.06, 0.055, 8, 'y')]), P.skin, 'y', [0, 0.62]));
    for (const a of [-0.55, -0.18, 0.18, 0.55]) {
      const ang = a + turn;
      const d = V(Math.sin(ang), 0, Math.cos(ang));
      const b = V(x, 0, z).addScaledVector(d, 0.04);
      const tp = b.clone().addScaledVector(d, 0.075);
      const sd = V(d.z, 0, -d.x);
      const tw = 0.022, th = 0.032;
      F.push(paint(hull([
        b.clone().addScaledVector(sd, tw), b.clone().addScaledVector(sd, -tw),
        b.clone().addScaledVector(sd, tw).add(V(0, th * 1.4, 0)), b.clone().addScaledVector(sd, -tw).add(V(0, th * 1.4, 0)),
        tp.clone().addScaledVector(sd, tw * 0.9), tp.clone().addScaledVector(sd, -tw * 0.9),
        tp.clone().addScaledVector(sd, tw * 0.85).add(V(0, th, 0)), tp.clone().addScaledVector(sd, -tw * 0.85).add(V(0, th, 0)),
      ]), P.skin, 'y', [0, 0.62]));
      // obsidian claw
      F.push(obs(hull([
        tp.clone().addScaledVector(sd, tw * 0.8).addScaledVector(d, -0.008), tp.clone().addScaledVector(sd, -tw * 0.8).addScaledVector(d, -0.008),
        tp.clone().addScaledVector(sd, tw * 0.7).add(V(0, th * 1.05, 0)).addScaledVector(d, -0.008),
        tp.clone().addScaledVector(sd, -tw * 0.7).add(V(0, th * 1.05, 0)).addScaledVector(d, -0.008),
        tp.clone().addScaledVector(d, 0.05).add(V(0, 0.004, 0)), tp.clone().addScaledVector(d, 0.04),
      ])));
    }
  };
  foot(0.325, 0.215, 0.3);
  foot(0.335, -0.17, 0.42);

  // ================= TAIL (long, thick, tapering to the ground) =================
  const tailPts = [V(0, 0.29, -0.24), V(0, 0.26, -0.46), V(0, 0.18, -0.68), V(0, 0.115, -0.9), V(0, 0.075, -1.12)];
  const tc = new THREE.CatmullRomCurve3(tailPts, false, 'centripetal');
  const tR = (t) => 0.175 * Math.pow(1 - t, 0.9) + 0.024;
  const tailG = paint(tube(curveSamples(tailPts, 9, tR, (t) => tR(t) * 0.85), { seg: 6, axis: X, capEnd: 0.035, phase: Math.PI / 2,
    twist: (i) => (i % 2) * Math.PI / 6, scale: (i) => (i % 2 ? 1.06 : 0.97) }),
    P.skin, 'y', [0.0, 0.62]);
  C.push(tailG);

  // ================= HEAD (big, blocky, lizard wedge) =================
  const H = { y: 0.52, z: 0.37 };
  const headG = skin([
    ...cbox(V(0, H.y + 0.015, H.z), 0.2, 0.145, 0.14, 0.03),
    ...ring(V(0, H.y + 0.175, H.z - 0.02), 0.125, 0.1, 8, 'y'),
    V(0.215, H.y - 0.07, H.z - 0.05), V(-0.215, H.y - 0.07, H.z - 0.05),
  ], 0.0, 0.75);
  C.push(headG);
  const FZ = H.z + 0.14;
  // wide flat snout
  const snoutG = skin([
    ...cbox(V(0, H.y - 0.06, FZ + 0.095), 0.12, 0.055, 0.11, 0.032),
    V(0.12, H.y - 0.005, FZ - 0.03), V(-0.12, H.y - 0.005, FZ - 0.03),
    V(0.075, H.y - 0.01, FZ + 0.15), V(-0.075, H.y - 0.01, FZ + 0.15),
  ], 0.0, 0.75);
  C.push(snoutG);
  // lower jaw (belly tone), recessed flush under the snout
  C.push(paint(hull(cbox(V(0, H.y - 0.128, FZ + 0.06), 0.104, 0.024, 0.105, 0.016)), P.belly, 'y', [H.y - 0.155, H.y - 0.1]));
  // thin glowing mouth line inset along the snout side and front (a slight downturn toward the back)
  const ML = (x, y, z, nx, nz) => [V(x + nx * 0.005, y + 0.0045, z + nz * 0.005), V(x + nx * 0.005, y - 0.0045, z + nz * 0.005),
    V(x - nx * 0.006, y + 0.0045, z - nz * 0.006), V(x - nx * 0.006, y - 0.0045, z - nz * 0.006)];
  S.push(paint(hull([...ML(0, H.y - 0.072, FZ + 0.205, 0, 1), ...ML(0.088, H.y - 0.072, FZ + 0.205, 0, 1)]), P.lava, 'flat'));
  S.push(paint(hull([...ML(0.086, H.y - 0.072, FZ + 0.205, 0.7, 0.7), ...ML(0.12, H.y - 0.074, FZ + 0.171, 0.7, 0.7)]), P.lava, 'flat'));
  S.push(paint(hull([...ML(0.12, H.y - 0.074, FZ + 0.173, 1, 0), ...ML(0.12, H.y - 0.08, FZ - 0.005, 1, 0)]), P.lava, 'flat'));
  // nostrils on top of the snout tip
  S.push(paint(hull([V(0.03, H.y - 0.007, FZ + 0.135), V(0.068, H.y - 0.007, FZ + 0.13), V(0.03, H.y - 0.007, FZ + 0.16),
    V(0.068, H.y - 0.007, FZ + 0.158), V(0.03, H.y + 0.001, FZ + 0.135), V(0.068, H.y + 0.001, FZ + 0.13), V(0.03, H.y + 0.001, FZ + 0.16),
    V(0.068, H.y + 0.001, FZ + 0.158)]), P.mouth, 'flat'));

  // fierce glowing eyes (big almond, outer side swept back around the face corner)
  const E = V(0.09, H.y + 0.056, 0), TL = 0.42, TX = 0.168;
  const eyePl = (pts, sc, cx, cy, z0, z1, sw) => {
    const q = [];
    for (const [u, v] of pts) for (const z of [z0, z1]) {
      const x = cx + u * sc;
      q.push(V(x, cy + v * sc, z - TL * Math.max(0, x - TX)));
    }
    S.push(paint(hull(q), sw, 'flat'));
  };
  const EW = [[-0.048, 0.0], [0.05, 0.036], [0.058, -0.012], [0.022, -0.044], [-0.032, -0.04], [-0.05, -0.018]];
  const EP = [[-0.034, 0.003], [0.021, 0.024], [0.029, -0.01], [0.007, -0.041], [-0.027, -0.039], [-0.04, -0.016]];
  eyePl(EW, 1.32, E.x, E.y, FZ - 0.012, FZ + 0.008, P.eyeW);
  eyePl(EP, 1.42, E.x - 0.004, E.y - 0.003, FZ, FZ + 0.012, P.iris);
  eyePl(EP, 1.24, E.x - 0.004, E.y - 0.003, FZ + 0.004, FZ + 0.016, P.eye);
  eyePl([[-0.009, -0.009], [0.009, -0.009], [0.009, 0.009], [-0.009, 0.009]], 1, E.x + 0.008, E.y + 0.004, FZ + 0.012, FZ + 0.02, P.white);
  // heavy chunky brow slab overhanging the eye, slanting down to the centre
  {
    const q = [];
    for (const [x, yb, yt, f] of [[0.018, E.y + 0.004, E.y + 0.062, 0.046], [0.1, E.y + 0.036, E.y + 0.098, 0.042], [0.172, E.y + 0.058, E.y + 0.1, 0.022]]) {
      q.push(V(x, yb, FZ + f), V(x, yt, FZ + f - 0.016), V(x, yb + 0.01, FZ - 0.05), V(x, yt, FZ - 0.06));
    }
    S.push(paint(hull(q), P.brow, 'y', [E.y, E.y + 0.12]));
  }

  // ================= ARMOUR (gold-trimmed obsidian) =================
  // head plate: obsidian helm on the crown, V-point between the brows, gold rim, glowing gem, gold horns
  const HT = 0.03;
  const helm = (g, dy0) => { const dy = dy0 - HT; return hull([
    V(0, H.y + 0.105 - dy, FZ + 0.012 + g), V(0.06 + g, H.y + 0.135 - dy, FZ - 0.03), V(-0.06 - g, H.y + 0.135 - dy, FZ - 0.03),
    V(0.1 + g, H.y + 0.16 - dy, H.z - 0.06), V(-0.1 - g, H.y + 0.16 - dy, H.z - 0.06),
    V(0.07 + g, H.y + 0.155 - dy, H.z - 0.13 - g), V(-0.07 - g, H.y + 0.155 - dy, H.z - 0.13 - g),
    V(0, H.y + 0.19 - dy, H.z - 0.03), V(0, H.y + 0.165 - dy, FZ - 0.04),
    V(0.05, H.y + 0.06, H.z), V(-0.05, H.y + 0.06, H.z),
  ]); };
  C.push(obs(helm(0, 0)));
  C.push(gold(helm(0.014, 0.014)));
  C.push(paint(hull([V(0, H.y + 0.22, H.z + 0.03), V(0.026, H.y + 0.208, H.z + 0.0), V(-0.026, H.y + 0.208, H.z + 0.0),
    V(0, H.y + 0.21, H.z - 0.04), V(0, H.y + 0.195, H.z + 0.06), V(0, H.y + 0.235, H.z - 0.005)]), P.gem, 'flat'));
  S.push(paint(tube(curveSamples([V(0.08, H.y + 0.17, H.z - 0.09), V(0.13, H.y + 0.215, H.z - 0.17), V(0.16, H.y + 0.25, H.z - 0.27)],
    4, (t) => 0.035 * (1 - t) + 0.003), { seg: 5 }), P.gold, 'len'));

  // shoulder pauldrons
  const Pd = V(0.175, 0.32, 0.15);
  // lower lame (wide, flared) + gold rim
  S.push(obs(hull([...ring(V(Pd.x + 0.01, Pd.y - 0.025, Pd.z), 0.12, 0.11, 8, 'y'), ...ring(V(Pd.x - 0.005, Pd.y + 0.03, Pd.z - 0.005), 0.1, 0.09, 8, 'y')])));
  S.push(gold(hull([...ring(V(Pd.x + 0.01, Pd.y - 0.035, Pd.z), 0.128, 0.118, 8, 'y'), ...ring(V(Pd.x + 0.01, Pd.y - 0.012, Pd.z), 0.124, 0.114, 8, 'y')])));
  // upper lame (layered cap) + gold rim
  S.push(obs(hull([...ring(V(Pd.x - 0.01, Pd.y + 0.03, Pd.z - 0.005), 0.088, 0.08, 8, 'y'), ...ring(V(Pd.x - 0.025, Pd.y + 0.075, Pd.z - 0.01), 0.055, 0.05, 8, 'y')])));
  S.push(gold(hull([...ring(V(Pd.x - 0.01, Pd.y + 0.022, Pd.z - 0.005), 0.096, 0.088, 8, 'y'), ...ring(V(Pd.x - 0.01, Pd.y + 0.042, Pd.z - 0.005), 0.092, 0.084, 8, 'y')])));
  S.push(gold(shard(V(Pd.x - 0.01, Pd.y + 0.07, Pd.z - 0.01), V(0.7, 1, -0.25), 0.03, 0.075)));
  // chest plate (shield on the chest, gold rim, glowing gem)
  const cp = V(0, 0.3, 0.3);
  C.push(obs(hull([...plate([[-0.1, 0.06], [0.1, 0.06], [0.11, -0.02], [0.05, -0.1], [-0.05, -0.1], [-0.11, -0.02]], cp, cp.z - 0.04, cp.z + 0.015, 0.25)])));
  C.push(gold(hull([...plate([[-0.115, 0.07], [0.115, 0.07], [0.125, -0.025], [0.058, -0.112], [-0.058, -0.112], [-0.125, -0.025]], cp, cp.z - 0.05, cp.z + 0.005, 0.25)])));
  C.push(paint(hull([V(0, cp.y + 0.03, cp.z + 0.03), V(0.03, cp.y - 0.01, cp.z + 0.03), V(-0.03, cp.y - 0.01, cp.z + 0.03),
    V(0, cp.y - 0.05, cp.z + 0.03), V(0, cp.y - 0.01, cp.z + 0.05), V(0, cp.y - 0.01, cp.z + 0.005)]), P.gem, 'flat'));

  // ================= BACK SPIKES (fewer, chunky two-tone shards + smaller flanking row) =================
  const spine = [
    [V(0, H.y + 0.13, H.z - 0.13), 0.8], [V(0, 0.47, 0.19), 1.0],
    [V(0, 0.445, 0.05), 1.2], [V(0, 0.44, -0.1), 1.25], [V(0, 0.42, -0.24), 1.1],
  ];
  for (const t of [0.2, 0.42, 0.63, 0.83]) {
    const p = tc.getPoint(t);
    spine.push([p.clone().add(V(0, tR(t) * 0.78, 0)), 0.95 - t * 0.62]);
  }
  for (const [b, s] of spine) {
    const bb = b.clone().add(V(0, -0.025, 0));
    C.push(...spikeShard(bb, bb.clone().add(V(0, 0.13 * s, -0.075 * s)), 0.075 * s, 0.05 * s));
  }
  // flanking row: between the main spikes, leaning out
  const flank = [];
  for (let i = 1; i < 6; i++) {
    const [a, sa] = spine[i], [b2, sb] = spine[i + 1];
    const m = a.clone().lerp(b2, 0.5), s = (sa + sb) * 0.5 * 0.62;
    flank.push([m.add(V(0.06 * s / 0.62 * 0.7, -0.035, 0)), s]);
  }
  for (const [b, s] of flank) S.push(...spikeShard(b, b.clone().add(V(0.05 * s, 0.11 * s, -0.06 * s)), 0.065 * s, 0.045 * s));

  // ================= LAVA CRACKS (few long jagged branching seams) =================
  const bodyRay = (z, th) => [V(0, 0.28 + 0.06 * z, z), V(Math.sin(th), Math.cos(th), 0)];
  const bodyCracks = [
    [[0.13, 0.42], [0.07, 0.6], [0.1, 0.78], [0.03, 0.95], [0.06, 1.12], [-0.01, 1.3], [0.01, 1.5]],
    [[0.1, 0.78], [0.16, 0.92], [0.13, 1.05]],
    [[-0.07, 0.36], [-0.12, 0.54], [-0.08, 0.72], [-0.15, 0.9], [-0.12, 1.08], [-0.18, 1.26]],
    [[-0.08, 0.72], [-0.02, 0.86], [-0.05, 1.0]],
    [[-0.27, 0.42], [-0.32, 0.62], [-0.28, 0.8]],
  ];
  for (const cl of bodyCracks) S.push(...crack(bodyG, cl.map(([z, th]) => bodyRay(z, th))));
  // tail: one long zigzag seam with two branches
  const tailRay = (t, th) => {
    const p = tc.getPoint(t), T = tc.getTangent(t);
    const up = V(0, T.z, -T.y).normalize(); if (up.y < 0) up.negate();
    return [p, up.multiplyScalar(Math.cos(th)).addScaledVector(X, Math.sin(th))];
  };
  const tailCracks = [
    [[0.06, 0.55], [0.15, 0.95], [0.25, 0.65], [0.35, 1.0], [0.45, 0.7], [0.55, 1.0], [0.66, 0.75]],
    [[0.15, 0.95], [0.2, 1.3]],
    [[0.35, 1.0], [0.4, 1.35]],
  ];
  for (const cl of tailCracks) S.push(...crack(tailG, cl.map(([t, th]) => tailRay(t, th)), 0.0085));
  // skull side seam running down onto the neck
  const headRay = (z, th) => [V(0, H.y, z), V(Math.sin(th), Math.cos(th), 0)];
  S.push(...crack(headG, [[H.z - 0.11, 0.7], [H.z - 0.05, 0.92], [H.z - 0.09, 1.18], [H.z - 0.03, 1.42], [H.z - 0.07, 1.7]].map(([z, th]) => headRay(z, th)), 0.008));
  const neckRay = (u, th) => [V(0, 0.3 + 0.14 * u, 0.12 + 0.18 * u), V(Math.sin(th), Math.cos(th), 0)];
  S.push(...crack(neckG, [[0.2, 0.45], [0.38, 0.75], [0.25, 1.0], [0.45, 1.25]].map(([u, th]) => neckRay(u, th))));
  // haunch seam
  const thc = V(0.2, 0.255, -0.21);
  S.push(...crack(thighG, [[thc, V(0.1, 1, 0.5)], [thc, V(0.45, 1, 0.15)], [thc, V(0.55, 1, -0.4)], [thc, V(0.95, 0.5, -0.5)], [thc, V(1, 0.1, -0.2)]], 0.008));

  for (const g of [...C, ...S]) g.translate(0, -DROP, 0);
  S.push(...F);
  const m = assemble(C, S);
  m.scale(SCALE, SCALE, SCALE); m.computeBoundingBox();
  return m;
}

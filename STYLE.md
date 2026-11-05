# Pet Remake: build guide (read fully before starting)

You are building ONE creature for "Punch & Steal A Pet" as a procedural low-poly 3D model,
matching the style of the Round 1 creature sheet. Several agents work in this folder at the same time,
each on a different creature. Take your time and make yours the best it can be.

## Files
- `refs/_sheet.png`: the full Round 1 sheet (style bible). `refs/<pet>.png`: your creature's crop. LOOK AT BOTH.
- `src/kit.js`: shared helpers. **DO NOT EDIT** (other agents depend on it). Copy a helper into your own file if you need a variant.
- `src/pets/punch_pup.js`: the finished reference implementation. Read it first; copy its patterns (eyes, brow, paws, shards).
- `src/pets/<pet>.js`: **your file, the only file you create or edit.**
- Build + render: `cd /home/user/puppy && node run.cjs <pet>` (about 10 to 30 seconds; the machine is shared, so be patient)
  - Writes `out/<pet>/<pet>.glb`, `preview_{three_quarter,front,side,back,top}.png`, `<pet>_turnaround.png`.
  - Previews are rendered by RELOADING the exported GLB, so what you see is what ships.
  - Prints the triangle count and size. A `[err]` line means your module threw an error, so fix it.

## Module contract (`src/pets/<pet>.js`)
```js
import { V, THREE, hull, cbox, ring, plate, shard, blob, tube, curveSamples, paint, assemble } from '../kit.js';
export const PALETTE = { body: { i: 0, top: '#hex', bot: '#hex' }, ... };  // your own colours
export function buildGeometry() { const C = [], S = []; /* ... */ return assemble(C, S); }
```
- PALETTE: each swatch is a 128px cell `i` (0..63) of the 1024² atlas, a vertical gradient from `top` (light) to `bot` (dark).
  Optionally `{ i, draw(ctx, x, y) }` to paint a custom 128×128 cell yourself (e.g. stripes or a pattern).
- `paint(geo, swatch, mode, [yLo, yHi])` sets UVs: `'y'` = gradient by world height (light on top), `'len'` = along a tube
  (tip = `bot` colour), `'flat'` = solid colour. You may write your own UV function in your file (e.g. map stripes by world z).
- `C` = centre-line parts (must themselves be symmetric about x=0). `S` = right-side parts (x > 0), auto-mirrored.
- `assemble` merges everything into one mesh and drops it so the lowest point sits at y = 0.

## Hard specs
- Y up, creature faces **+Z**, symmetric across X = 0 (Symmetry On), one mesh, one material, one 1024 texture, GLB.
- **Polycount: about 5,000 triangles max.** Aim for 2,500 to 5,000; spend the triangles where the silhouette shows them.
- Size: about 1 unit tall for a standard pet (Punch Pup is 0.94 tall); wings and tails can extend beyond that.
- **Natural standing pose**: all feet (or the coil and base for the snake) resting on the ground plane, legs slightly apart,
  full body readable. Follow the sheet's stance and character (Rex and Rooster stand on two legs, Roo leans on its tail,
  the dragon's wings are spread) but keep every foot planted.
- No floating parts, no holes or torn faces, no inside-out faces, no visible z-fighting (keep overlays at least 0.004 off the surface).

## The style (study the sheet)
- **Chunky and blocky, with crisp, big flat facets.** Build mostly from `hull(...)` of `cbox`/`ring` points (convex hulls, as
  in punch_pup) plus low-segment `tube`s (6 to 10 sides). Avoid smooth, high-segment tube shapes: they look rubbery.
- **Big head** (about 35 to 45% of body height), stocky torso, **short, thick limbs**, chunky feet/paws/claws with toes.
- **Fierce, determined face**: white almond eye with an angry flat top that slants down toward the nose, a big black pupil,
  a small square catchlight, and a **heavy protruding brow** above it (copy punch_pup's eye and brow block and adapt it).
  Not too cartoony, not scary.
- Fur, feathers, mane and spikes are **angular shards** (`shard(...)`), layered and fanned, not thin needles.
- Bold, solid, saturated colours with soft shading. A lighter belly/chest/muzzle is common. **Gold** accents
  (horns, crowns, claws, trim) for the higher-rarity pets as on the sheet.

## Process (do NOT skip)
1. Study `refs/<pet>.png` and the sheet. Write down the 6 to 10 defining features (silhouette, colours, signature parts).
2. Block out the big masses, then build and LOOK at all previews (use Read on the PNGs).
3. Compare side by side with the reference and fix the worst difference. Repeat. Expect **at least 5 to 8 build/look cycles**.
   Check proportions, colours, signature features, the face's attitude, and every view for holes or floating bits.
4. Finish: final build, then confirm the triangle count is under about 5,000 and the size is sensible.

## Report back (short)
Triangle count, size, the file paths, what you matched, and any known compromises versus the reference.

---
## Pets beyond Round 1 (the full 136-pet list)
- Your pet's official prompt, rarity, round and file name are in `pets.json` (find it by `key`). **The prompt is the spec.**
  Follow every detail in it (colours, signature parts, the round's theme details, the rarity's extras).
- Name your module after the key: `src/pets/<Key>.js` (e.g. `src/pets/MonkeyMauler.js`) and build with `node run.cjs <Key>`.
  The game file name is `<Key>.glb`, so this makes it drop straight in.
- There is no crop for these pets. Use `refs/_sheet.png` for STYLE (proportions, faces, facets, colour boldness) and
  the finished Round 1 pets in `src/pets/` and `out/` as more examples of the style.
- Rarity ladder (make higher rarities feel richer, but keep the same chunky, clean style):
  Common/Uncommon = simple and clean · Rare = a few cool bits (small horns, armour) · Epic = bold markings and armour plates ·
  Legendary/Mythic = ornate armour, gold trim, glowing eyes or markings · Godly/Secret/Celestial/Divine/Robux egg/Admin =
  the most impressive, with glowing runes and patterns, crowns and halos.
- **Glow**: add `glow: true` to a PALETTE swatch to make it emissive (lava cracks, runes, glowing eyes and spots). Use it
  only on the parts meant to glow; everything else stays matte.
- **Floating details** (halos, rings behind the head, floating crowns or orbs) ARE allowed when the prompt asks for them.
  Keep them close to the body and on the centre line or mirrored. They are the only parts allowed off the body.
- Non-four-legged pets (golems, bipeds, serpents, birds, insects, hydras, krakens) stand naturally on their own feet,
  base or coil, with every foot planted. Multi-headed or many-legged creatures must still be mirror-symmetric
  (e.g. 3 heads = one centre head plus a mirrored pair).
- Keep it at about 5,000 triangles max even for the big legendary ones. Spend the triangles on silhouette, not tiny noise.

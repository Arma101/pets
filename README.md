# Pets: Punch & Steal A Pet 3D models

Procedural low-poly faceted creature models (GLB) for all 136 pets, built in code with Three.js and
matched to the Round 1 creature sheet.

- `pets.json`: the 136 official prompts, rarities, rounds and file names
- `STYLE.md`: the build guide every pet follows
- `src/kit.js`: shared faceted-geometry kit · `src/pets/<Pet>.js`: one module per pet
- `refs/`: the Round 1 sheet and per-creature crops
- `out/<Pet>/`: built GLB plus preview renders (rendered by reloading the GLB)
- `export/<Key>.glb`: game-ready files under their exact game names (`node export.cjs`)

## Status: all 136 pets done
- `export/`: **136 game-ready GLBs** named exactly as the game expects (`PunchPup.glb` … `THEULTIMATECHAMP.glb`).
- `out/lineups/`: one lineup sheet per round and egg (`python3 lineup.py` regenerates them).
- Every file is audited: 1 mesh, 1 material, 1,312 to 4,982 triangles, texture at most 1024, mesh named after the pet key,
  feet at y = 0, mirror-symmetric.

## Importing into Roblox Studio
1. Avatar or Home tab → **Import 3D** → choose a `.glb`. Each pet comes in as one MeshPart with its texture.
2. Set the size you want in the importer (pets are about 1 unit tall), or resize in Studio.
3. Pets face **+Z**. If one walks backwards in your follow script, rotate it 180° once (or offset the CFrame).
4. For pets: `CanCollide = false`, `CollisionFidelity = Box`, `Massless = true`.
5. Glow parts are bright in the base colour. Roblox may ignore emissive maps, so add a PointLight or Neon accent for real glow.

## Build one pet
```bash
npm install
node run.cjs PunchPup      # needs Playwright + Chromium (preinstalled in Claude cloud sessions)
```
Settings for every pet: about 5,000 tris max · 1024 texture · symmetric · natural standing pose · GLB.

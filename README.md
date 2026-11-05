# Pets: Punch & Steal A Pet 3D models

Procedural low-poly faceted creature models (GLB) for all 136 pets, built in code with Three.js and
matched to the Round 1 creature sheet.

- `pets.json`: the 136 official prompts, rarities, rounds and file names
- `STYLE.md`: the build guide every pet follows
- `src/kit.js`: shared faceted-geometry kit · `src/pets/<Pet>.js`: one module per pet
- `refs/`: the Round 1 sheet and per-creature crops
- `out/<Pet>/`: built GLB plus preview renders (rendered by reloading the GLB)
- `export/<Key>.glb`: game-ready files under their exact game names (`node export.cjs`)

## Build one pet
```bash
npm install
node run.cjs PunchPup      # needs Playwright + Chromium (preinstalled in Claude cloud sessions)
```
Settings for every pet: about 5,000 tris max · 1024 texture · symmetric · natural standing pose · GLB.

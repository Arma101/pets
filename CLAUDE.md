# Pets repo: rules for every session

- This repo builds the 136 "Punch & Steal A Pet" pets as procedural low-poly GLB models. Read `STYLE.md` before any pet work.
- `pets.json` is the source of truth for each pet's prompt, rarity, group and game file name (`<Key>.glb`).
- **Never edit shared files** (`src/kit.js`, `build.html`, `run.cjs`, `export.cjs`, `STYLE.md`, `pets.json`) from a pet session.
  Each pet lives only in `src/pets/<Key>.js` and its outputs `out/<Key>/`.
- Setup once per container: `npm install` (three.js). Playwright + Chromium are preinstalled in Claude cloud sessions.
- Build a pet: `node run.cjs <Key>`. Export game files: `node export.cjs` (writes `export/<Key>.glb`).
- Commit only your own pets' files: `src/pets/<Key>.js`, `out/<Key>/`, `export/<Key>.glb`.

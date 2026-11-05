You are building the pets of **Admin pets** (5 pets) for this repo (Arma101/pets): low-poly faceted 3D pet models (GLB) for the Roblox game "Punch & Steal A Pet". The user wants every pet as good as possible and asked for one agent per pet. Quality matters more than speed.

Your pets:
- AdminCrownDragon: Admin Crown Dragon (Admin)
- BanHammerGolem: Ban Hammer Golem (Admin)
- GlitchPhoenix: Glitch Phoenix (Admin)
- DeveloperDino: Developer Dino (Admin)
- PlayzoPup: DaGoat Pup (Admin)

## Setup
1. `npm install` in the repo root (three.js). Playwright and Chromium are preinstalled.
2. Read CLAUDE.md and STYLE.md fully, then src/pets/punch_pup.js (the reference implementation).
3. Look at refs/_sheet.png (the style bible) and a few finished Round 1 turnarounds (out/*/*_turnaround.png) so you know the target look.
4. Sanity check: `node run.cjs punch_pup` must print a tri count with no `[err]`.

## Build: one subagent per pet
Use the Agent tool to launch ONE background subagent per pet, all at once (general-purpose type). Give each one a self-contained brief:
- its pet key, name, rarity and group;
- the FULL official prompt text copied from pets.json (that prompt is the spec);
- "Read /home/user/pets/STYLE.md fully and src/pets/punch_pup.js, and look at refs/_sheet.png. Your only file is src/pets/<Key>.js; never edit shared files. Build with `node run.cjs <Key>` (outputs out/<Key>/). Do at least 5 to 8 build-then-LOOK cycles (Read the preview PNGs), comparing against the prompt and the sheet's style each time, until it is the best you can make it. Report the tri count, size and known compromises."
(The absolute path is wherever this repo is checked out; give subagents the real path.)

## Review: you are the art director
When each subagent reports, Read its out/<Key>/<Key>_turnaround.png and preview_three_quarter.png yourself. Check:
- Every detail in the prompt is present: colours, signature parts, round theme details, rarity extras.
- The sheet's style: chunky big-facet hulls, big head, short thick limbs, white angry almond eyes with black pupils and a heavy brow, shard fur.
- Natural standing pose with feet planted; mirror-symmetric; no holes or floating bits (except prompt-requested halos and crowns); 5,000 tris max.
- Glow parts also look bright in plain colour (Roblox may ignore emissive).
If anything is off, send that subagent specific fixes with SendMessage (it resumes with its context) and review again. Only accept a pet when you would be proud to ship it.

## Save progress
After each pet is accepted: run `node export.cjs`, then `git add src/pets/<Key>.js out/<Key> export/<Key>.glb`, commit ("Add <Name> pet model"), and push to your branch. Commit only your own pets' files and never edit shared files. Do not open pull requests.

When all 5 are accepted and pushed, finish with a short summary table: pet, tris, one-line verdict.

// Copies every finished out/<module>/<module>.glb to export/<Key>.glb using pets.json names.
const fs = require('fs'), path = require('path');
const pets = require('./pets.json');
const snake = k => k.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/([A-Z])([A-Z][a-z])/g, '$1_$2').toLowerCase();
fs.mkdirSync('export', { recursive: true });
let done = 0; const missing = [];
for (const p of pets) {
  const cands = [p.key, snake(p.key)];
  const mod = cands.find(m => fs.existsSync(path.join('out', m, m + '.glb')));
  if (!mod) { missing.push(p.key); continue; }
  fs.copyFileSync(path.join('out', mod, mod + '.glb'), path.join('export', p.file)); done++;
}
console.log(`exported ${done}/${pets.length}`); if (missing.length) console.log('missing:', missing.length);

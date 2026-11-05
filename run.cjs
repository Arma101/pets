// usage: node run.cjs <pet_name>   -> builds src/pets/<pet>.js into out/<pet>/
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const pet = process.argv[2];
if (!pet || !fs.existsSync(path.join(__dirname, 'src/pets', pet + '.js'))) { console.error('usage: node run.cjs <pet>  (src/pets/<pet>.js)'); process.exit(1); }
const root = __dirname, outDir = path.join(root, 'out', pet);
const types = { '.js': 'text/javascript', '.html': 'text/html', '.glb': 'model/gltf-binary' };
const srv = http.createServer((q, s) => {
  const f = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }); fs.createReadStream(f).pipe(s);
}).listen(0, async () => {
  const port = srv.address().port;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let failed = false;
  try {
    const p = await b.newPage();
    p.on('console', m => console.log('[page]', m.text())); p.on('pageerror', e => { failed = true; console.log('[err]', e.message); });
    await p.goto(`http://localhost:${port}/build.html?pet=${pet}`);
    await p.waitForFunction('window.ready || false', null, { timeout: 60000 });
    const res = await p.evaluate(() => window.buildGLB());
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, `${pet}.glb`), Buffer.from(res.b64, 'base64'));
    console.log(`${pet}: tris ${res.tris}  size ${res.size.map(n => n.toFixed(3)).join(' x ')}`);
    const views = [
      { name: 'three_quarter', az: 0.6, el: 0.18 }, { name: 'front', az: 0, el: 0.08 },
      { name: 'side', az: Math.PI / 2, el: 0.05 }, { name: 'back', az: Math.PI + 0.6, el: 0.25 },
      { name: 'top', az: 0.3, el: 1.2 },
    ];
    const imgs = await p.evaluate(v => window.renderGLB(`/out/${location.search.split('=')[1]}/${location.search.split('=')[1]}.glb`, v), views);
    imgs.forEach((d, i) => fs.writeFileSync(path.join(outDir, `preview_${views[i].name}.png`), Buffer.from(d.split(',')[1], 'base64')));
    // turnaround strip
    const strip = await b.newPage({ viewport: { width: 2048, height: 512 } });
    await strip.setContent('<body style="margin:0;display:flex;background:#fff">' + imgs.slice(0, 4).map(s => `<img src="${s}" width=512 height=512>`).join('') + '</body>');
    await strip.screenshot({ path: path.join(outDir, `${pet}_turnaround.png`) });
  } catch (e) { failed = true; console.error(e.message); }
  await b.close(); srv.close(); process.exit(failed ? 1 : 0);
});

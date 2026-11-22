/* Genera iconos Android, pantallas de carga, icono de 512 px, gráfico destacado y capturas para Google Play.
   Uso: npm run store-assets   (requiere Playwright con Chromium: npx playwright install chromium) */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const APPS = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps/apps.json'), 'utf8'));
const ONLY = process.env.APP;

const TEXT = {
  aparcamiento: {
    tagline: { es: '¡Saca todos los coches sin chocar!', en: 'Get every car out without crashing!' },
    shots: {
      es: ['¡Despeja el\naparcamiento!', 'Cada coche tiene\nsu carácter', '¿Chocas? ¡Pitada!', 'Cientos de niveles'],
      en: ['Clear the\nparking lot!', 'Every car has\na personality', 'Crash? HONK!', 'Hundreds of levels'],
    },
  },
  'cocina-zombi': {
    tagline: { es: 'Cocina de día. Sobrevive de noche.', en: 'Cook by day. Survive by night.' },
    shots: {
      es: ['De día, haz crecer\ntu restaurante', 'Mejora cocinas\ny gana más', 'De noche…\n¡ZOMBIS!', 'Defiende tu cocina'],
      en: ['By day, grow\nyour restaurant', 'Upgrade kitchens,\nearn more', 'At night…\nZOMBIES!', 'Defend your kitchen'],
    },
  },
  tornillos: {
    tagline: { es: 'Desatornilla. Rebobina el tiempo.', en: 'Unscrew. Rewind time.' },
    shots: {
      es: ['Quita los tornillos\nen el orden correcto', 'Clasifícalos\npor colores', '¿Te equivocaste?\n¡Rebobina el tiempo!', 'Puzles cada vez\nmás retorcidos'],
      en: ['Pull the screws in\nthe right order', 'Sort them\nby color', 'Made a mistake?\nRewind time!', 'Ever trickier\npuzzles'],
    },
  },
};

const MIP = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const SPLASH = {
  'drawable': [480, 320], 'drawable-land-mdpi': [480, 320], 'drawable-land-hdpi': [800, 480], 'drawable-land-xhdpi': [1280, 720],
  'drawable-land-xxhdpi': [1600, 960], 'drawable-land-xxxhdpi': [1920, 1280], 'drawable-port-mdpi': [320, 480],
  'drawable-port-hdpi': [480, 800], 'drawable-port-xhdpi': [720, 1280], 'drawable-port-xxhdpi': [960, 1600], 'drawable-port-xxxhdpi': [1280, 1920],
};

function serve() {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png' };
  return new Promise((res) => {
    const s = http.createServer((req, r) => {
      let p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      if (!p.startsWith(ROOT)) { r.writeHead(403); return r.end(); }
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
      fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); });
    }).listen(0, () => res(s));
  });
}
const save = (file, dataUrl) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64')); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Lleva cada juego a estados interesantes y devuelve 4 capturas (PNG en base64). */
async function captureGame(browser, base, a, lang) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, hasTouch: true, locale: lang === 'es' ? 'es-ES' : 'en-US' });
  const shots = [];
  const shot = async (p) => shots.push('data:image/png;base64,' + (await p.screenshot()).toString('base64'));
  const url = `${base}/apps/${a.dir}/www/`;
  const open = async (key, value) => {
    const p = await ctx.newPage();
    await p.addInitScript(([k, v]) => { localStorage.clear(); localStorage.setItem(k, v); }, [key, JSON.stringify(value)]);
    await p.goto(url); await wait(700);
    await p.evaluate(() => document.querySelectorAll('.toast').forEach((t) => t.remove()));
    return p;
  };
  if (a.dir === 'aparcamiento') {
    let p = await open('save:parking', { level: 9, tut: true, coins: 340 });
    await shot(p);
    for (let i = 0; i < 4; i++) {
      const pos = await p.evaluate(() => { const f = __game.freeCars(); return f.length ? __game.screenOf(f[0]) : null; });
      if (pos) await p.mouse.click(pos[0], pos[1]); await wait(250);
    }
    await wait(500); await shot(p);
    const blocked = await p.evaluate(() => { const f = new Set(__game.freeCars()); const c = __game.cars.find((c) => !f.has(c) && c.state === 'idle'); return c ? __game.screenOf(c) : null; });
    if (blocked) { await p.mouse.click(blocked[0], blocked[1]); await wait(170); }
    await shot(p); await p.close();
    p = await open('save:parking', { level: 24, tut: true, coins: 1280 });
    await shot(p); await p.close();
  } else if (a.dir === 'cocina-zombi') {
    const st = { coins: 48200, levels: { burger: 32, fries: 18, soda: 9, taco: 2 }, pan: 6, chef: 4, door: 5, night: 4, nightsWon: 3, lastSeen: Date.now(), dayTimer: 20 };
    let p = await open('save:zombiekitchen', { tut: true, state: st });
    await wait(4000); await shot(p);
    await p.click('#tabD'); await wait(300); await shot(p);
    await p.evaluate(() => __game.startNight()); await wait(9000);
    await p.evaluate(() => document.querySelectorAll('.toast').forEach((t) => t.remove()));
    await shot(p);
    await wait(6000);
    for (let i = 0; i < 4; i++) { await p.mouse.click(200 + i * 30, 640 * 0.6 + 78); await wait(40); }
    await shot(p); await p.close();
  } else {
    let p = await open('save:screws', { level: 14, coins: 410 });
    await shot(p);
    for (let i = 0; i < 6; i++) {
      await p.evaluate(() => { const g = __game; const free = g.screws.filter((s) => g.isFree(s) && g.plates[s.plate].present); if (free.length) g.tapScrew(free[0]); });
      await wait(350);
    }
    await wait(500); await shot(p);
    await p.evaluate(() => { const g = __game; for (let i = 0; i < 3; i++) { const free = g.screws.filter((s) => g.isFree(s) && g.plates[s.plate].present); if (free.length) g.tapScrew(free[free.length - 1]); } });
    await wait(150); await p.click('#bRewind'); await wait(200); await shot(p);
    await p.close();
    p = await open('save:screws', { level: 27, coins: 900 }); await shot(p); await p.close();
  }
  await ctx.close();
  return shots;
}

(async () => {
  const server = await serve();
  const base = `http://localhost:${server.address().port}`;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${base}/scripts/art.js`); // mismo origen
  await page.setContent('<html><body></body></html>');
  await page.addScriptTag({ url: `${base}/scripts/art.js` });
  await page.evaluate(() => document.fonts.ready);

  for (const a of APPS) {
    if (ONLY && ONLY !== a.dir) continue;
    console.log('▶', a.name);
    const res = path.join(ROOT, 'apps', a.dir, 'android/app/src/main/res');
    const store = path.join(ROOT, 'store', a.dir);
    // Iconos Android
    for (const [d, k] of Object.entries(MIP)) {
      save(path.join(res, `mipmap-${d}/ic_launcher.png`), await page.evaluate(([a, s]) => ART.icon(a, s, false), [a, 48 * k]));
      save(path.join(res, `mipmap-${d}/ic_launcher_round.png`), await page.evaluate(([a, s]) => ART.icon(a, s, true), [a, 48 * k]));
      save(path.join(res, `mipmap-${d}/ic_launcher_foreground.png`), await page.evaluate(([a, s]) => ART.foreground(a, s), [a, 108 * k]));
    }
    fs.writeFileSync(path.join(res, 'values/ic_launcher_background.xml'),
      `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${a.accent}</color>\n</resources>\n`);
    for (const [d, [w, h]] of Object.entries(SPLASH)) save(path.join(res, d, 'splash.png'), await page.evaluate(([a, w, h]) => ART.splash(a, w, h), [a, w, h]));
    // Ficha de tienda
    save(path.join(store, 'icon-512.png'), await page.evaluate(([a]) => ART.icon(a, 512, false), [a]));
    for (const lang of ['es', 'en']) {
      const named = Object.assign({}, a, { name: lang === 'es' ? a.name : a.nameEn });
      save(path.join(store, lang, 'feature-graphic-1024x500.png'), await page.evaluate(([a, t]) => ART.feature(a, 1024, 500, t), [named, TEXT[a.dir].tagline[lang]]));
      const raw = await captureGame(browser, base, a, lang);
      for (let i = 0; i < raw.length; i++) {
        const out = await page.evaluate(async ([a, u, h]) => ART.screenshot(a, u, h, 1080, 1920), [a, raw[i], TEXT[a.dir].shots[lang][i]]);
        save(path.join(store, lang, `screenshot-${i + 1}.png`), out);
      }
    }
  }
  await browser.close();
  server.close();
  console.log('✔ Listo: iconos en apps/*/android/.../res y ficha en store/');
})();

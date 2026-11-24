// Capturas reales del juego para las tiendas.
// Uso: node tools/store/capture.js <es|en> <phone|tablet>
// Genera store/raw/<idioma>/<dispositivo>/*.png a partir de Exodo2942.html
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const LANG = process.argv[2] || 'es';
const DEVICE = process.argv[3] || 'phone';
const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(ROOT, 'store', 'raw', LANG, DEVICE) + '/';
fs.mkdirSync(OUT, { recursive: true });
const VIEW = DEVICE === 'tablet' ? { width: 768, height: 1024, dpr: 2 } : { width: 390, height: 780, dpr: 3 };
const L = {
  es: { nora: 'NORA', teo: 'TEO', lia: 'LÍA', console: 'Consola principal', duct: 'Conducto del suelo' },
  en: { nora: 'NORA', teo: 'TEO', lia: 'LÍA', console: 'Main console', duct: 'Floor duct' },
}[LANG];

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: VIEW.width, height: VIEW.height }, deviceScaleFactor: VIEW.dpr, isMobile: true, hasTouch: true, locale: LANG === 'es' ? 'es-ES' : 'en-US' });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERR ' + e.message));
  await page.goto('file://' + path.join(ROOT, 'Exodo2942.html'));
  await page.evaluate(lang => localStorage.setItem('exodo2942.save', JSON.stringify({
    unlocked: 15, tutorialDone: true, roomsDone: [1, 2, 3], files: [1, 2, 3, 4], credits: 6450,
    upgrades: { cannon: 2, shield: 1, drones: 1, magnet: 1 }, shipMode: 'lia', analysis: {},
    ach: { flawless: 1, first_flight: 1, mini_down: 1, lanza: 1, room_any: 1 },
    settings: { lang, langChosen: true, difficulty: 1, sens: 1.25, vibration: true, bigText: false, cbBullets: false, autofire: true },
  })), LANG);
  await page.reload(); await page.waitForTimeout(500);
  const vis = s => page.evaluate(s => document.querySelector(s).classList.contains('show'), s);
  const adv = () => page.evaluate(() => { const d = document.getElementById('dialog'); d.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); d.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
  const drain = async () => { for (let k = 0; k < 30; k++) { await page.waitForTimeout(120); if (await vis('#dialog')) { await adv(); continue; } return; } };
  const clean = () => page.evaluate(() => { document.getElementById('toast').classList.remove('show'); });
  const shot = async n => { await clean(); await page.waitForTimeout(80); await page.screenshot({ path: OUT + n + '.png' }); console.log(LANG, DEVICE, n); };
  const toMenu = () => page.evaluate(() => document.getElementById('btnQuit').click());
  const W = VIEW.width, H = VIEW.height;

  // Super jefe con el núcleo al descubierto
  await page.evaluate(() => { __debug.startDuel(14); }); await page.waitForTimeout(2300);
  await page.evaluate(() => { __G.player.inv = 1e9; __G.player.power = 5; __G.player.drones = 2; });
  await page.waitForFunction(() => __G.boss && !__G.boss.entering, null, { timeout: 20000 });
  await page.evaluate(() => { __G.boss.hp = __G.boss.maxHp * 0.2; __G.player.x = 360; __G.player.y = __G.H - 300; });
  await page.waitForTimeout(4200);
  await page.evaluate(() => { __G.player.inv = 0.0001; __G.banner = null; });
  await shot('superjefe'); await toMenu();

  // Elección de Vex
  await page.evaluate(() => { __debug.startChapter(4); }); await page.waitForTimeout(2900); await drain();
  await page.evaluate(() => { __G.player.inv = 1e9; __G.player.power = 5; __debug.skipLevel(); }); await page.waitForTimeout(3300); await drain();
  await page.waitForTimeout(1500);
  await page.evaluate(() => { __G.boss.hp = 1; });
  for (let i = 0; i < 60; i++) { await page.waitForTimeout(250); if (await page.evaluate(() => document.getElementById('dlgChoices').children.length > 0)) break; if (await vis('#dialog')) await adv(); }
  await page.waitForTimeout(500);
  await shot('decision');
  await page.locator('#dlgChoices button').first().dispatchEvent('pointerdown'); await page.waitForTimeout(300); await drain();
  await page.evaluate(() => document.getElementById('roomMenu').click()); await page.waitForTimeout(300);

  // Estancia: la sonda, con un objeto en el inventario
  await page.evaluate(() => { __debug.runRoom(1); }); await page.waitForTimeout(2900); await drain();
  const act = async (who, hot) => { await page.locator('.char-btn', { hasText: who }).first().tap(); await page.locator('.hot', { hasText: hot }).first().tap(); await page.waitForTimeout(300); await drain(); };
  await act(L.nora, L.console);
  await act(L.teo, L.duct);
  await page.locator('.char-btn', { hasText: L.lia }).first().tap(); await page.waitForTimeout(900);
  await shot('estancias'); await drain();
  await page.evaluate(() => document.getElementById('roomMenu').click()); await page.waitForTimeout(400);

  // Hangar
  await page.tap('#btnHangar'); await page.waitForTimeout(500);
  await shot('hangar'); await page.tap('#hangarBack'); await page.waitForTimeout(300);

  // Acción en el Mar de Cristal con el láser de Lía
  await page.evaluate(() => { __debug.startChapter(6); }); await page.waitForTimeout(2900); await drain();
  await page.evaluate(() => { __G.player.inv = 1e9; __G.player.power = 5; __G.player.drones = 2; __debug.setTime(40); });
  await page.mouse.move(W / 2, H * 0.77); await page.mouse.down();
  for (let i = 0; i < 14; i++) { await page.mouse.move(W * (0.36 + Math.random() * 0.28), H * (0.72 + Math.random() * 0.08), { steps: 4 }); await page.waitForTimeout(500); }
  await page.mouse.up();
  await page.evaluate(() => { __G.player.inv = 0.0001; });
  await shot('accion'); await toMenu();

  // Jefes 1 vs 1: Torre Centinela con sus subnaves
  await page.evaluate(() => { __debug.startDuel(1); }); await page.waitForTimeout(2300);
  await page.evaluate(() => { __G.player.inv = 1e9; });
  await page.waitForFunction(() => __G.boss && !__G.boss.entering, null, { timeout: 20000 });
  await page.waitForTimeout(3500);
  await page.evaluate(() => { __G.player.inv = 0.0001; });
  await shot('jefes'); await toMenu();
  await b.close();
})();

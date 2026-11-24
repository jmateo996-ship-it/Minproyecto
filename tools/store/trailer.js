// Fotogramas del tráiler de 30 s (30 fps, 1080 × 1920) a partir del juego real.
// Uso: node tools/store/trailer.js <es|en>   ->  store/tmp/trailer_<idioma>/00001.jpg …
// Después: tools/store/make_trailer.sh monta el vídeo con la música.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const LANG = process.argv[2] || 'es';
const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(ROOT, 'store', 'tmp', 'trailer_' + LANG); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const TX = {
  es: { ordo: 'NO EXISTE UN CIELO SIN ORDO.', names: ['DARÍO', 'LÍA', 'NORA', 'TEO'], fam1: 'Todas las mentes están en sus mapas.', fam2: 'Todas menos una.',
    montage: '15 MISIONES · 15 JEFES', room: 'TEO ES INVISIBLE PARA ORDO', choice: 'TUS DECISIONES CAMBIAN EL FINAL', boss: 'UN SÚPER JEFE DE 4 FASES',
    logo: 'ÉXODO', tag: 'Una familia. Un universo que no les deja ir.', cta: 'PRUEBA GRATIS EL ACTO I', barrier: 'Barrera de luz' },
  en: { ordo: 'THERE IS NO SKY WITHOUT ORDO.', names: ['DARÍO', 'LÍA', 'NORA', 'TEO'], fam1: 'Every mind is on its maps.', fam2: 'All but one.',
    montage: '15 MISSIONS · 15 BOSSES', room: 'TEO IS INVISIBLE TO ORDO', choice: 'YOUR CHOICES CHANGE THE ENDING', boss: 'A 4-PHASE SUPER BOSS',
    logo: 'EXODUS', tag: "A family. A universe that won't let them go.", cta: 'PLAY ACT I FREE', barrier: 'Light barrier' },
}[LANG];

let frame = 0;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: LANG === 'es' ? 'es-ES' : 'en-US' });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERR ' + e.message));
  const snap = async () => { frame++; await page.screenshot({ path: path.join(OUT, String(frame).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 92 }); };

  // --- Cortinillas (HTML animado fotograma a fotograma)
  const card = async (mode, n, params) => {
    const q = new URLSearchParams(Object.assign({ mode }, params)).toString();
    await page.goto('file://' + path.join(__dirname, 'card.html') + '?' + q); await page.waitForTimeout(200);
    for (let i = 0; i < n; i++) { await page.evaluate(t => window.render(t), i / 30); await snap(); }
  };

  // --- Juego
  const game = async () => {
    await page.goto('file://' + path.join(ROOT, 'Exodo2942.html'));
    await page.evaluate(lang => localStorage.setItem('exodo2942.save', JSON.stringify({
      unlocked: 15, tutorialDone: true, roomsDone: [1, 2, 3], files: [1, 2, 3, 4], shipMode: 'dario', ach: { flawless: 1, first_flight: 1, mini_down: 1, lanza: 1, room_any: 1, squadron: 1, max_power: 1 },
      settings: { lang, langChosen: true, difficulty: 1, sens: 1.25, vibration: true, bigText: false, cbBullets: false, autofire: true },
    })), LANG);
    await page.reload(); await page.waitForTimeout(400);
  };
  const vis = s => page.evaluate(s => document.querySelector(s).classList.contains('show'), s);
  const adv = () => page.evaluate(() => { const d = document.getElementById('dialog'); d.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); d.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
  const drain = async () => { for (let k = 0; k < 30; k++) { await page.waitForTimeout(120); if (await vis('#dialog')) { await adv(); continue; } return; } };
  const caption = (text, color = '#4fd8ff') => page.evaluate(([text, color]) => {
    let el = document.getElementById('promoCap');
    if (!el) { el = document.createElement('div'); el.id = 'promoCap'; document.body.appendChild(el); }
    el.style.cssText = `position:fixed;left:0;right:0;top:18%;z-index:99;text-align:center;padding:10px 12px;font:900 21px system-ui,sans-serif;letter-spacing:.06em;color:#fff;
      background:linear-gradient(90deg,transparent,rgba(5,3,15,.78) 15%,rgba(5,3,15,.78) 85%,transparent);text-shadow:0 0 14px ${color};border-top:1px solid ${color}88;border-bottom:1px solid ${color}88;pointer-events:none`;
    el.textContent = text; el.style.display = text ? '' : 'none';
  }, [text, color]);
  const hideUi = () => page.evaluate(() => { document.getElementById('toast').classList.remove('show'); document.getElementById('comm').classList.remove('show'); });
  // Juego paso a paso: la nave se mueve sola y cada fotograma avanza 1/30 s
  const play = async (n, opts = {}) => {
    await page.evaluate(() => { __G.paused = true; });
    for (let i = 0; i < n; i++) {
      await page.evaluate(([i, o]) => {
        const p = __G.player; p.inv = 1e9;
        p.x = __G.W / 2 + Math.sin(i / 18 + (o.ph || 0)) * 170; p.y = __G.H - 270 + Math.sin(i / 29) * 50;
        if (o.at && o.at[i]) eval(o.at[i]);
        __debug.step(1, 1 / 30);
      }, [i, opts]);
      if (i === 0) await hideUi();
      await snap();
    }
    await page.evaluate(() => { __G.paused = false; });
  };
  const warm = async (setup, ms = 2500) => { await page.evaluate(setup); await page.waitForTimeout(ms); };

  // 0‑3 s · El ojo de ORDO
  await card('eye', 90, { t1: TX.ordo });
  // 3‑7 s · La familia
  await card('family', 120, { t1: TX.fam1, t2: TX.fam2, n1: TX.names[0], n2: TX.names[1], n3: TX.names[2], n4: TX.names[3] });

  // 7‑14 s · Montaje de acción
  await game();
  const mission = async (idx, t, mode, power) => {
    await page.evaluate(([idx, mode]) => { const s = JSON.parse(localStorage.getItem('exodo2942.save')); s.shipMode = mode; localStorage.setItem('exodo2942.save', JSON.stringify(s)); }, [idx, mode]);
    await page.reload(); await page.waitForTimeout(300);
    await page.evaluate(i => { __debug.startChapter(i); }, idx); await page.waitForTimeout(2900); await drain();
    await warm(`__G.player.inv = 1e9; __G.player.power = ${power}; __G.player.drones = ${power >= 4 ? 2 : 1}; __debug.setTime(${t});`, 3500);
  };
  await mission(0, 30, 'dario', 3); await caption(TX.montage); await play(52, { ph: 0 });
  await mission(3, 60, 'nora', 4); await caption(TX.montage); await play(52, { ph: 1 });
  await mission(6, 50, 'lia', 5); await caption(TX.montage); await play(52, { ph: 2 });
  await page.evaluate(() => { __debug.startDuel(9); }); await page.waitForTimeout(2300);
  await page.evaluate(() => { __G.player.inv = 1e9; __G.player.power = 5; __G.player.drones = 2; });
  await page.waitForFunction(() => __G.boss && !__G.boss.entering, null, { timeout: 20000 }); await page.waitForTimeout(1500);
  await caption(TX.montage); await play(54, { ph: 3 });
  await caption('');
  await page.evaluate(() => document.getElementById('btnQuit').click());

  // 14‑18 s · Teo cruza la barrera de ORDO
  await page.evaluate(() => { __debug.runRoom(3); }); await page.waitForTimeout(2900); await drain();
  await page.locator('.char-btn', { hasText: 'TEO' }).first().tap();
  await caption(TX.room, '#ffe066');
  await page.locator('.hot', { hasText: TX.barrier }).first().tap();
  for (let i = 0; i < 120; i++) { if (i === 62) await adv(); await snap(); }
  await caption('');
  await drain(); await page.evaluate(() => document.getElementById('roomMenu').click()); await page.waitForTimeout(300);

  // 18‑22 s · La elección de Vex
  await page.evaluate(() => { __debug.startChapter(4); }); await page.waitForTimeout(2900); await drain();
  await page.evaluate(() => { __G.player.inv = 1e9; __G.player.power = 5; __debug.skipLevel(); }); await page.waitForTimeout(3300); await drain();
  await page.waitForTimeout(1500);
  await page.evaluate(() => { __G.boss.hp = 1; });
  for (let i = 0; i < 60; i++) { await page.waitForTimeout(250); if (await page.evaluate(() => document.getElementById('dlgChoices').children.length > 0)) break; if (await vis('#dialog')) await adv(); }
  await hideUi(); await caption(TX.choice, '#ffb347');
  for (let i = 0; i < 120; i++) await snap();
  await caption('');
  await page.locator('#dlgChoices button').first().dispatchEvent('pointerdown'); await page.waitForTimeout(300); await drain();
  await page.evaluate(() => document.getElementById('roomMenu').click()); await page.waitForTimeout(300);

  // 22‑27 s · ORDO PRIMORDIAL: el núcleo queda al descubierto
  await page.evaluate(() => { __debug.startDuel(14); }); await page.waitForTimeout(2300);
  await page.evaluate(() => { __G.player.inv = 1e9; __G.player.power = 5; __G.player.drones = 2; });
  await page.waitForFunction(() => __G.boss && !__G.boss.entering, null, { timeout: 20000 });
  await page.evaluate(() => { __G.boss.hp = __G.boss.maxHp * 0.3; });
  await page.waitForTimeout(1500);
  await caption(TX.boss, '#ff2a5a');
  await play(150, { ph: 4, at: { 40: '__G.boss.hp = __G.boss.maxHp * 0.249', 39: 'document.getElementById("promoCap").style.display="none"' } });
  await caption('');

  // 27‑30 s · Logo
  await card('logo', 90, { t1: TX.logo, t2: TX.tag, t3: TX.cta });
  console.log(LANG, 'fotogramas:', frame);
  await b.close();
})();

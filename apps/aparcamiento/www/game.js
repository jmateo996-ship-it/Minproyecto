/* Aparcamiento Imposible — puzle de atascos con coches con personalidad. */
(function () {
  'use strict';
  const { sfx, vibrate, ads, modal, toast, roundRect } = G;
  const store = G.makeStore('parking');
  const t = G.makeT({
    level: { es: 'Nivel {n}', en: 'Level {n}' },
    tow: { es: 'Grúa', en: 'Tow' },
    restart: { es: 'Reiniciar', en: 'Restart' },
    win: { es: '¡Aparcamiento despejado!', en: 'Parking lot cleared!' },
    lose: { es: '¡Se acabó la paciencia!', en: 'Out of patience!' },
    loseTxt: { es: 'Demasiados choques. ¿Seguimos?', en: 'Too many crashes. Keep going?' },
    next: { es: 'Siguiente nivel', en: 'Next level' },
    x2: { es: '📺 Monedas x2', en: '📺 Coins x2' },
    cont: { es: '📺 +2 vidas', en: '📺 +2 lives' },
    retry: { es: 'Reintentar', en: 'Retry' },
    towMode: { es: 'Toca un coche para llevártelo', en: 'Tap a car to tow it' },
    towBuy: { es: 'Grúa: 150 🪙 o ver un anuncio', en: 'Tow: 150 🪙 or watch an ad' },
    buy: { es: 'Usar 150 🪙', en: 'Use 150 🪙' },
    watch: { es: '📺 Ver anuncio', en: '📺 Watch ad' },
    cancel: { es: 'Cancelar', en: 'Cancel' },
    tutorial: { es: 'Toca un coche: avanza hacia donde mira la flecha. ¡Saca todos sin chocar!', en: 'Tap a car: it drives where the arrow points. Get them all out without crashing!' },
    earned: { es: '+{n} 🪙', en: '+{n} 🪙' },
  });

  // ---------- Estado ----------
  let level = store.get('level', 1);
  let coins = store.get('coins', 0);
  let cars = [], cols = 5, rows = 5, hearts = 3, mistakes = 0, towMode = false, over = false;
  let particles = [], shake = 0, floatTexts = [];

  // ---------- Aleatorio con semilla (niveles reproducibles) ----------
  function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s + 0x6D2B79F5) >>> 0; let x = Math.imul(s ^ (s >>> 15), 1 | s); x ^= x + Math.imul(x ^ (x >>> 7), 61 | x); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  }

  const COLORS = ['#ff5a5f', '#ffb400', '#00a699', '#5b8def', '#a66bff', '#ff7ac6', '#7ed957', '#ff8a3d', '#3ec5ff', '#f2f2f2'];
  const DIRS = { R: [1, 0], L: [-1, 0], D: [0, 1], U: [0, -1] };

  function carCells(c) {
    const out = [];
    for (let i = 0; i < c.len; i++) out.push(c.h ? [c.x + i, c.y] : [c.x, c.y + i]);
    return out;
  }
  function frontCell(c) {
    const [dx, dy] = DIRS[c.dir];
    if (c.h) return dx > 0 ? [c.x + c.len - 1, c.y] : [c.x, c.y];
    return dy > 0 ? [c.x, c.y + c.len - 1] : [c.x, c.y];
  }
  function buildGrid(list) {
    const g = Array.from({ length: rows }, () => Array(cols).fill(null));
    list.forEach((c) => { if (!c.gone) carCells(c).forEach(([x, y]) => (g[y][x] = c)); });
    return g;
  }
  /** Devuelve {clear:true} o {clear:false, dist, blocker} */
  function probe(c, grid) {
    const [dx, dy] = DIRS[c.dir];
    let [x, y] = frontCell(c), dist = 0;
    for (;;) {
      x += dx; y += dy;
      if (x < 0 || y < 0 || x >= cols || y >= rows) return { clear: true };
      const o = grid[y][x];
      if (o && o !== c) return { clear: false, dist, blocker: o };
      dist++;
    }
  }

  // ---------- Generación de niveles (siempre resolubles) ----------
  function generate(lv) {
    cols = Math.min(4 + Math.floor((lv + 1) / 3), 8);
    rows = Math.min(cols + 1 + Math.floor(lv / 6), 10);
    let best = null;
    for (let attempt = 0; attempt < 12; attempt++) {
      const R = rng(lv * 9973 + attempt * 31 + 7);
      const list = [];
      const occ = Array.from({ length: rows }, () => Array(cols).fill(false));
      const tries = cols * rows * 3;
      const density = Math.min(0.55 + lv * 0.02, 0.86);
      let filled = 0;
      for (let i = 0; i < tries && filled < cols * rows * density; i++) {
        const h = R() < 0.5;
        const len = lv > 4 && R() < 0.18 ? 3 : 2;
        const x = Math.floor(R() * (h ? cols - len + 1 : cols));
        const y = Math.floor(R() * (h ? rows : rows - len + 1));
        let ok = true;
        for (let k = 0; k < len; k++) if (occ[h ? y : y + k][h ? x + k : x]) { ok = false; break; }
        if (!ok) continue;
        for (let k = 0; k < len; k++) occ[h ? y : y + k][h ? x + k : x] = true;
        filled += len;
        const dir = h ? (R() < 0.5 ? 'R' : 'L') : (R() < 0.5 ? 'D' : 'U');
        list.push({ x, y, h, len, dir, color: COLORS[Math.floor(R() * COLORS.length)], mood: Math.floor(R() * 3) });
      }
      // Resolver de forma voraz; si hay bloqueo mutuo, quitamos un coche atascado.
      let alive = list.slice(), depth = 0;
      const R2 = rng(lv * 17 + attempt);
      while (alive.length) {
        const g = buildGrid(alive);
        const free = alive.filter((c) => probe(c, g).clear);
        if (free.length) { depth++; alive = alive.filter((c) => !free.includes(c)); }
        else {
          const victim = alive[Math.floor(R2() * alive.length)];
          list.splice(list.indexOf(victim), 1);
          alive.splice(alive.indexOf(victim), 1);
        }
      }
      const score = depth * 10 + list.length;
      if (!best || score > best.score) best = { list, score };
    }
    return best.list.map((c, i) => Object.assign(c, { id: i, px: c.x, py: c.y, state: 'idle', anim: 0, angry: 0, gone: false }));
  }

  function startLevel() {
    cars = generate(level);
    hearts = 3; mistakes = 0; over = false; towMode = false; particles = []; floatTexts = [];
    updateHud(); layout();
    if (level === 1 && !store.get('tut', false)) { toast(t('tutorial')); store.set('tut', true); setTimeout(() => toast(t('tutorial')), 2200); }
  }

  // ---------- Render ----------
  const canvas = document.getElementById('c');
  const c2 = canvas.getContext('2d');
  let view, cell = 50, ox = 0, oy = 0;
  function layout() {
    if (!view) return;
    const top = 80, bottom = 110;
    cell = Math.floor(Math.min((view.w - 24) / cols, (view.h - top - bottom) / rows));
    ox = Math.floor((view.w - cell * cols) / 2);
    oy = Math.floor(top + (view.h - top - bottom - cell * rows) / 2);
  }
  view = G.fitCanvas(canvas, layout);

  function drawBoard() {
    const pad = cell * 0.25;
    c2.fillStyle = '#3a4060';
    roundRect(c2, ox - pad, oy - pad, cell * cols + pad * 2, cell * rows + pad * 2, cell * 0.4); c2.fill();
    c2.fillStyle = '#454c70';
    roundRect(c2, ox, oy, cell * cols, cell * rows, cell * 0.2); c2.fill();
    c2.strokeStyle = 'rgba(255,255,255,.12)'; c2.lineWidth = Math.max(1, cell * 0.04);
    c2.setLineDash([cell * 0.18, cell * 0.14]);
    for (let x = 1; x < cols; x++) { c2.beginPath(); c2.moveTo(ox + x * cell, oy + 6); c2.lineTo(ox + x * cell, oy + rows * cell - 6); c2.stroke(); }
    for (let y = 1; y < rows; y++) { c2.beginPath(); c2.moveTo(ox + 6, oy + y * cell); c2.lineTo(ox + cols * cell - 6, oy + y * cell); c2.stroke(); }
    c2.setLineDash([]);
  }

  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.min(255, Math.max(0, r * f)); g = Math.min(255, Math.max(0, g * f)); b = Math.min(255, Math.max(0, b * f));
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }

  function drawCar(c) {
    const m = cell * 0.08;
    const w = (c.h ? c.len : 1) * cell - m * 2, h = (c.h ? 1 : c.len) * cell - m * 2;
    const cx = ox + c.px * cell + m + w / 2, cy = oy + c.py * cell + m + h / 2;
    const ang = { R: 0, D: Math.PI / 2, L: Math.PI, U: -Math.PI / 2 }[c.dir];
    const L = c.h ? w : h, W = c.h ? h : w; // largo y ancho en ejes del coche
    c2.save();
    c2.translate(cx, cy);
    if (c.angry > 0) c2.translate((Math.random() - 0.5) * 4 * c.angry, (Math.random() - 0.5) * 4 * c.angry);
    c2.rotate(ang);
    if (towMode && !c.gone) { c2.shadowColor = '#f5a623'; c2.shadowBlur = 18; }
    // sombra
    c2.fillStyle = 'rgba(0,0,0,.28)'; roundRect(c2, -L / 2 + 3, -W / 2 + 5, L, W, W * 0.32); c2.fill();
    c2.shadowBlur = 0;
    // carrocería
    c2.fillStyle = c.color; roundRect(c2, -L / 2, -W / 2, L, W, W * 0.32); c2.fill();
    c2.fillStyle = shade(c.color, 0.8); roundRect(c2, -L / 2, W * 0.18, L, W * 0.32, W * 0.2); c2.fill();
    // ruedas
    c2.fillStyle = '#1d1d26';
    [[-L / 2 + W * 0.25, -W / 2 - 2], [L / 2 - W * 0.55, -W / 2 - 2], [-L / 2 + W * 0.25, W / 2 - W * 0.12], [L / 2 - W * 0.55, W / 2 - W * 0.12]]
      .forEach(([x, y]) => { roundRect(c2, x, y, W * 0.3, W * 0.14, 3); c2.fill(); });
    // techo
    c2.fillStyle = shade(c.color, 1.18); roundRect(c2, -L * 0.28, -W * 0.34, L * 0.5, W * 0.68, W * 0.22); c2.fill();
    // parabrisas con cara (mirando hacia la dirección)
    c2.fillStyle = '#cfe8ff'; roundRect(c2, L * 0.16, -W * 0.32, L * 0.16 + W * 0.05, W * 0.64, W * 0.12); c2.fill();
    // ojos
    const ex = L * 0.25 + W * 0.02;
    c2.fillStyle = '#fff';
    [-1, 1].forEach((s) => { c2.beginPath(); c2.arc(ex, s * W * 0.15, W * 0.1, 0, 7); c2.fill(); });
    c2.fillStyle = '#222';
    const look = c.state === 'exit' ? W * 0.03 : 0;
    [-1, 1].forEach((s) => {
      if (c.mood === 2 && c.angry <= 0 && c.state === 'idle') { c2.fillRect(ex - W * 0.02, s * W * 0.15 - W * 0.07, W * 0.04, W * 0.14); }
      else { c2.beginPath(); c2.arc(ex + look, s * W * 0.15, W * 0.05, 0, 7); c2.fill(); }
    });
    if (c.angry > 0 || c.mood === 1) { // cejas
      c2.strokeStyle = '#222'; c2.lineWidth = W * 0.04;
      [-1, 1].forEach((s) => { c2.beginPath(); c2.moveTo(ex - W * 0.1, s * W * 0.27); c2.lineTo(ex + W * 0.06, s * W * 0.2); c2.stroke(); });
    }
    // flecha de dirección
    c2.fillStyle = 'rgba(255,255,255,.9)';
    c2.beginPath();
    const ax = -L * 0.08;
    c2.moveTo(ax + W * 0.2, 0); c2.lineTo(ax - W * 0.1, -W * 0.2); c2.lineTo(ax - W * 0.1, W * 0.2); c2.closePath(); c2.fill();
    c2.restore();
    if (c.mood === 2 && c.state === 'idle' && c.angry <= 0) { // zZz
      c2.fillStyle = 'rgba(255,255,255,.7)'; c2.font = `bold ${cell * 0.25}px sans-serif`;
      const tt = (performance.now() / 600 + c.id) % 1;
      c2.globalAlpha = 1 - tt; c2.fillText('z', cx + cell * 0.2, cy - cell * 0.3 - tt * cell * 0.3); c2.globalAlpha = 1;
    }
  }

  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 5;
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, color, r: 2 + Math.random() * 4 });
    }
  }

  // ---------- Lógica de toque ----------
  function carAt(px, py) {
    const gx = Math.floor((px - ox) / cell), gy = Math.floor((py - oy) / cell);
    if (gx < 0 || gy < 0 || gx >= cols || gy >= rows) return null;
    const g = buildGrid(cars.filter((c) => c.state !== 'exit'));
    return g[gy][gx];
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (over) return;
    const c = carAt(e.clientX, e.clientY);
    if (!c || c.state !== 'idle') return;
    if (towMode) { tow(c); return; }
    const g = buildGrid(cars.filter((k) => k.state !== 'exit'));
    const p = probe(c, g);
    if (p.clear) {
      c.state = 'exit'; c.speed = 0.05; sfx.whoosh(); vibrate(10);
    } else {
      c.state = 'bump'; c.anim = 0; c.bumpDist = p.dist + 0.25; c.blocker = p.blocker;
    }
  });

  function tow(c) {
    towMode = false; document.getElementById('bTow').classList.remove('active');
    c.state = 'exit'; c.speed = 0.08; c.towed = true;
    sfx.coin(); burst(ox + (c.px + 0.5) * cell, oy + (c.py + 0.5) * cell, '#f5a623', 20);
  }

  function onCrash(c) {
    sfx.honk(); setTimeout(sfx.crash, 60); vibrate([30, 40, 30]);
    shake = 10; c.angry = 1; if (c.blocker) c.blocker.angry = 1;
    const [fx, fy] = frontCell(c), [dx, dy] = DIRS[c.dir];
    burst(ox + (fx + 0.5 + dx * (c.bumpDist + 0.3)) * cell, oy + (fy + 0.5 + dy * (c.bumpDist + 0.3)) * cell, '#ffd447', 14);
    hearts--; mistakes++; updateHud();
    if (hearts <= 0) setTimeout(fail, 450);
  }

  // ---------- Bucle ----------
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt); draw();
    requestAnimationFrame(loop);
  }
  function update(dt) {
    cars.forEach((c) => {
      if (c.angry > 0) c.angry = Math.max(0, c.angry - dt * 1.5);
      const [dx, dy] = DIRS[c.dir];
      if (c.state === 'exit') {
        c.speed = Math.min(c.speed + dt * 1.2, 0.6);
        c.px += dx * c.speed * 60 * dt; c.py += dy * c.speed * 60 * dt;
        if (c.px < -4 || c.py < -4 || c.px > cols + 4 || c.py > rows + 4) { c.gone = true; c.state = 'done'; }
      } else if (c.state === 'bump') {
        c.anim += dt * 3.2;
        const d = c.anim < 0.5 ? (c.anim / 0.5) : Math.max(0, 1 - (c.anim - 0.5) / 0.5);
        const e = 1 - Math.pow(1 - d, 2);
        c.px = c.x + dx * c.bumpDist * e; c.py = c.y + dy * c.bumpDist * e;
        if (c.anim >= 0.5 && !c.crashed) { c.crashed = true; onCrash(c); }
        if (c.anim >= 1) { c.state = 'idle'; c.px = c.x; c.py = c.y; c.crashed = false; }
      }
    });
    const before = cars.length;
    cars = cars.filter((c) => !c.gone);
    if (before !== cars.length) { sfx.pop(); }
    if (!over && cars.length === 0) { over = true; setTimeout(win, 300); }
    particles.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= dt * 1.6; });
    particles = particles.filter((p) => p.life > 0);
    floatTexts.forEach((f) => { f.y -= 40 * dt; f.life -= dt; });
    floatTexts = floatTexts.filter((f) => f.life > 0);
    if (shake > 0) shake = Math.max(0, shake - dt * 40);
  }
  function draw() {
    c2.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    const grd = c2.createLinearGradient(0, 0, 0, view.h);
    grd.addColorStop(0, '#2b3048'); grd.addColorStop(1, '#1d2136');
    c2.fillStyle = grd; c2.fillRect(0, 0, view.w, view.h);
    c2.save();
    if (shake) c2.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    drawBoard();
    cars.filter((c) => c.state !== 'exit').forEach(drawCar);
    cars.filter((c) => c.state === 'exit').forEach(drawCar);
    particles.forEach((p) => { c2.globalAlpha = p.life; c2.fillStyle = p.color; c2.beginPath(); c2.arc(p.x, p.y, p.r, 0, 7); c2.fill(); });
    c2.globalAlpha = 1;
    floatTexts.forEach((f) => { c2.globalAlpha = Math.min(1, f.life); c2.fillStyle = '#ffd447'; c2.font = 'bold 28px sans-serif'; c2.textAlign = 'center'; c2.fillText(f.text, f.x, f.y); });
    c2.globalAlpha = 1; c2.textAlign = 'left';
    c2.restore();
  }

  // ---------- Fin de nivel ----------
  function win() {
    sfx.win(); vibrate(40);
    const stars = mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1;
    const reward = 20 + stars * 10 + Math.floor(level / 2);
    const best = store.get('stars', {});
    best[level] = Math.max(best[level] || 0, stars); store.set('stars', best);
    for (let i = 0; i < 40; i++) burst(view.w / 2, view.h / 2, COLORS[i % COLORS.length], 1);
    const give = (n) => { coins += n; level++; store.set('coins', coins); store.set('level', level); };
    modal(`<h2>${t('win')}</h2><div class="stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div><p>+${reward} 🪙</p>`, [
      { label: t('x2'), cls: 'ad', onClick: async () => { const ok = await ads.rewarded(); give(ok ? reward * 2 : reward); startLevel(); } },
      { label: t('next'), cls: 'primary', onClick: async () => { give(reward); if (level > 3) await ads.interstitial(); startLevel(); } },
    ]);
  }
  function fail() {
    over = true; sfx.lose();
    modal(`<h2>${t('lose')}</h2><p>${t('loseTxt')}</p>`, [
      { label: t('cont'), cls: 'ad', onClick: async () => { if (await ads.rewarded()) { hearts = 2; over = false; updateHud(); } else fail(); } },
      { label: t('retry'), onClick: async () => { await ads.interstitial(); startLevel(); } },
    ]);
  }

  function updateHud() {
    document.getElementById('level').textContent = t('level', { n: level });
    document.getElementById('hearts').textContent = '❤️'.repeat(Math.max(0, hearts)) + '🖤'.repeat(Math.max(0, 3 - hearts));
    document.getElementById('coins').textContent = G.fmt(coins);
  }

  // ---------- Botones ----------
  document.getElementById('tTow').textContent = t('tow');
  document.getElementById('tRestart').textContent = t('restart');
  document.getElementById('bTow').onclick = () => {
    if (over) return;
    sfx.tap();
    if (towMode) { towMode = false; document.getElementById('bTow').classList.remove('active'); return; }
    const activate = () => { towMode = true; document.getElementById('bTow').classList.add('active'); toast(t('towMode')); };
    modal(`<h2>🛻</h2><p>${t('towBuy')}</p>`, [
      { label: t('buy'), cls: 'primary', onClick: () => { if (coins >= 150) { coins -= 150; store.set('coins', coins); updateHud(); activate(); } else toast('🪙 ✖'); } },
      { label: t('watch'), cls: 'ad', onClick: async () => { if (await ads.rewarded()) activate(); } },
      { label: t('cancel') },
    ]);
  };
  document.getElementById('bRestart').onclick = () => { if (!over) { sfx.tap(); startLevel(); } };
  document.getElementById('btnSet').onclick = () => { sfx.tap(); G.settingsModal(t); };
  G.onBack(() => { const m = document.querySelector('.modal'); if (m) m.remove(); });

  // ---------- Arranque ----------
  ads.init(window.GAME_CONFIG);
  window.__game = { // ganchos para pruebas automáticas
    get cars() { return cars; }, get level() { return level; }, get hearts() { return hearts; },
    freeCars() { const g = buildGrid(cars.filter((k) => k.state !== 'exit')); return cars.filter((c) => c.state === 'idle' && probe(c, g).clear); },
    screenOf(c) { return [ox + (c.x + 0.5) * cell, oy + (c.y + 0.5) * cell]; },
  };
  startLevel();
  requestAnimationFrame(loop);
})();

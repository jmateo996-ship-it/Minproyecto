/* Cocina Zombi — restaurante idle de día, defensa contra zombis de noche. */
(function () {
  'use strict';
  const { sfx, vibrate, ads, modal, toast, fmt } = G;
  const store = G.makeStore('zombiekitchen');
  const t = G.makeT({
    kitchen: { es: '🍳 Cocina', en: '🍳 Kitchen' },
    defense: { es: '🛡️ Defensa', en: '🛡️ Defense' },
    night: { es: '🌙 ¡Llegan los zombis!', en: '🌙 Zombies incoming!' },
    nightN: { es: 'Noche {n} · {s}s', en: 'Night {n} · {s}s' },
    unlock: { es: 'Abrir', en: 'Unlock' },
    upgrade: { es: 'Mejorar', en: 'Upgrade' },
    lvl: { es: 'Nv {n}', en: 'Lv {n}' },
    perSec: { es: '{n}/s', en: '{n}/s' },
    pan: { es: 'Sartén de combate', en: 'Battle pan' },
    panSub: { es: 'Daño por toque: {n}', en: 'Damage per tap: {n}' },
    chef: { es: 'Chef lanzacuchillos', en: 'Knife-throwing chef' },
    chefSub: { es: 'Daño automático: {n}/s', en: 'Auto damage: {n}/s' },
    door: { es: 'Puerta reforzada', en: 'Reinforced door' },
    doorSub: { es: 'Resistencia: {n}', en: 'Toughness: {n}' },
    win: { es: '¡Sobreviviste a la noche {n}!', en: 'You survived night {n}!' },
    winTxt: { es: 'Botín: +{c} 🪙 y tus ganancias suben a x{m}', en: 'Loot: +{c} 🪙 and your earnings rise to x{m}' },
    lose: { es: '¡Los zombis entraron!', en: 'The zombies got in!' },
    loseTxt: { es: 'Mejora la defensa y vuelve a intentarlo.', en: 'Upgrade your defense and try again.' },
    revive: { es: '📺 Reparar puerta y seguir', en: '📺 Fix the door and continue' },
    ok: { es: 'Vale', en: 'OK' },
    x2: { es: '📺 Botín x2', en: '📺 Loot x2' },
    take: { es: 'Recoger', en: 'Collect' },
    offline: { es: 'Mientras no estabas', en: 'While you were away' },
    offlineTxt: { es: 'Tu cocina ganó {c} 🪙', en: 'Your kitchen earned {c} 🪙' },
    boost: { es: '📺 Ganancias x2 durante 5 min', en: '📺 x2 earnings for 5 min' },
    boostOn: { es: '⚡ x2 activo: {s}', en: '⚡ x2 active: {s}' },
    tapHint: { es: '¡Toca a los zombis!', en: 'Tap the zombies!' },
    tapServe: { es: 'Toca el mostrador para servir más rápido', en: 'Tap the counter to serve faster' },
  });

  const STATIONS = [
    { id: 'burger', em: '🍔', es: 'Hamburguesas', en: 'Burgers', cost: 0, base: 1 },
    { id: 'fries', em: '🍟', es: 'Patatas fritas', en: 'Fries', cost: 60, base: 4 },
    { id: 'soda', em: '🥤', es: 'Refrescos', en: 'Sodas', cost: 700, base: 22 },
    { id: 'taco', em: '🌮', es: 'Tacos', en: 'Tacos', cost: 8000, base: 120 },
    { id: 'pizza', em: '🍕', es: 'Pizza', en: 'Pizza', cost: 95000, base: 700 },
    { id: 'sushi', em: '🍣', es: 'Sushi', en: 'Sushi', cost: 1.2e6, base: 4200 },
    { id: 'cake', em: '🎂', es: 'Tartas', en: 'Cakes', cost: 1.6e7, base: 26000 },
    { id: 'lobster', em: '🦞', es: 'Marisco', en: 'Seafood', cost: 2.4e8, base: 170000 },
  ];
  const GROW = 1.14;

  // ---------- Estado guardado ----------
  const S = Object.assign({
    coins: 0, levels: { burger: 1 }, pan: 1, chef: 0, door: 1, night: 1, nightsWon: 0,
    lastSeen: Date.now(), boostUntil: 0, dayTimer: 0, total: 0,
  }, store.get('state', {}));
  function save() { S.lastSeen = Date.now(); store.set('state', S); }
  setInterval(save, 5000);
  G.onPause(save);

  const nightMult = () => 1 + S.nightsWon * 0.25;
  const boostMult = () => (Date.now() < S.boostUntil ? 2 : 1);
  function stationIncome(st) {
    const l = S.levels[st.id] || 0; if (!l) return 0;
    const milestones = [10, 25, 50, 100, 200].filter((m) => l >= m).length;
    return st.base * l * Math.pow(2, milestones);
  }
  const rawRate = () => STATIONS.reduce((a, st) => a + stationIncome(st), 0);
  const rate = () => rawRate() * nightMult() * boostMult();
  const upCost = (st) => Math.ceil((st.cost || 10) * Math.pow(GROW, S.levels[st.id] || 0) * (st.cost ? 1 : 1));
  const panDmg = () => Math.round(5 * Math.pow(1.32, S.pan - 1));
  const chefDps = () => (S.chef ? Math.round(4 * Math.pow(1.34, S.chef - 1)) : 0);
  const doorHp = () => Math.round(160 * Math.pow(1.22, S.door - 1));
  const defCost = (k) => Math.ceil({ pan: 40, chef: 70, door: 60 }[k] * Math.pow(1.55, (S[k] || 0)));

  // ---------- Ganancias offline ----------
  (function offline() {
    const secs = Math.min((Date.now() - S.lastSeen) / 1000, 3 * 3600);
    if (secs < 60) return;
    const earned = rawRate() * nightMult() * secs * 0.5;
    if (earned < 1) return;
    setTimeout(() => modal(`<h2>${t('offline')}</h2><p>${t('offlineTxt', { c: fmt(earned) })}</p>`, [
      { label: t('x2'), cls: 'ad', onClick: async () => { addCoins(earned * ((await ads.rewarded()) ? 2 : 1)); } },
      { label: t('take'), cls: 'primary', onClick: () => addCoins(earned) },
    ]), 400);
  })();

  function addCoins(n) { S.coins += n; S.total += n; }

  // ---------- Escena ----------
  const canvas = document.getElementById('c');
  const c2 = canvas.getContext('2d');
  const view = G.fitCanvas(canvas);
  let mode = 'day';
  let customers = [], coinsFx = [], particles = [], zombies = [], knives = [];
  let nightTime = 0, nightLen = 40, door = 0, spawnAcc = 0, spawned = 0, toSpawn = 0, chefAcc = 0, shake = 0, tapBonus = 0;
  const DAY_LEN = 100; // segundos entre noches

  function sceneH() { return mode === 'day' ? view.h * 0.48 : view.h; }
  function groundY() { return mode === 'day' ? sceneH() - 40 : Math.round(view.h * 0.6); }
  function doorX() { return Math.min(110, view.w * 0.24); }

  function drawRestaurant() {
    const H = sceneH(), gy = groundY(), w = view.w;
    // cielo
    const night = mode === 'night';
    const g = c2.createLinearGradient(0, 0, 0, H);
    if (night) { g.addColorStop(0, '#0d0a24'); g.addColorStop(1, '#2b1d4a'); }
    else { const k = Math.min(1, S.dayTimer / DAY_LEN); g.addColorStop(0, lerpC('#7ec8ff', '#ff8f5a', k)); g.addColorStop(1, lerpC('#ffe7b3', '#6b3f7a', k)); }
    c2.fillStyle = g; c2.fillRect(0, 0, w, H);
    if (night) { // luna y estrellas
      c2.fillStyle = '#fff6c9'; c2.beginPath(); c2.arc(w - 60, 120, 26, 0, 7); c2.fill();
      c2.fillStyle = 'rgba(255,255,255,.7)';
      for (let i = 0; i < 40; i++) { const x = (i * 97) % w, y = 80 + (i * 53) % (gy * 0.5); c2.fillRect(x, y, 2, 2); }
    }
    if (!night) { // nubes
      c2.fillStyle = 'rgba(255,255,255,.75)';
      const tt = performance.now() / 1000;
      [[0.3, 0.25, 1], [0.75, 0.4, 0.7], [1.1, 0.18, 0.85]].forEach(([fx, fy, s], i) => {
        const x = ((fx * w + tt * (8 + i * 4)) % (w + 160)) - 80, y = fy * gy;
        c2.beginPath(); c2.arc(x, y, 20 * s, 0, 7); c2.arc(x + 22 * s, y - 8 * s, 24 * s, 0, 7); c2.arc(x + 46 * s, y, 18 * s, 0, 7); c2.fill();
      });
    }
    // farola y valla
    c2.fillStyle = night ? '#444' : '#555';
    c2.fillRect(w - 40, gy - 110, 5, 110);
    c2.fillStyle = night ? 'rgba(255,230,140,.9)' : '#ddd'; c2.beginPath(); c2.arc(w - 37, gy - 112, 9, 0, 7); c2.fill();
    if (night) { const lg = c2.createRadialGradient(w - 37, gy - 112, 5, w - 37, gy - 60, 120); lg.addColorStop(0, 'rgba(255,230,140,.25)'); lg.addColorStop(1, 'rgba(255,230,140,0)'); c2.fillStyle = lg; c2.fillRect(w - 160, gy - 200, 250, 260); }
    // suelo
    c2.fillStyle = night ? '#1f2a1f' : '#6fbf5f'; c2.fillRect(0, gy, w, H - gy);
    c2.fillStyle = night ? '#2c3a2c' : '#8fd47c'; c2.fillRect(0, gy, w, 6);
    // edificio
    const bx = 0, bw = doorX(), bh = Math.min(170, gy - 70);
    c2.fillStyle = '#c0504d'; c2.fillRect(bx, gy - bh, bw, bh);
    c2.fillStyle = '#fff'; for (let i = 0; i < bw; i += 20) { c2.fillStyle = (i / 20) % 2 ? '#fff' : '#e2504c'; c2.fillRect(i, gy - bh - 16, 20, 18); }
    c2.font = `${Math.min(42, bw * 0.4)}px sans-serif`; c2.textAlign = 'center';
    c2.fillText('👨‍🍳', bw * 0.5, gy - bh * 0.45);
    // mostrador / puerta
    c2.fillStyle = night ? '#6b4a2b' : '#8a5a33';
    const dh = Math.min(70, bh * 0.45);
    c2.fillRect(bw - 14, gy - dh, 14, dh);
    if (night) {
      const k = door / doorHp();
      c2.fillStyle = k > 0.5 ? '#5bd16b' : k > 0.25 ? '#ffd447' : '#e2504c';
      c2.fillRect(bw - 14, gy - dh - 10, 14 * Math.max(0, k), 5);
    }
    // estaciones desbloqueadas como letrero
    const unlocked = STATIONS.filter((s) => S.levels[s.id]);
    c2.font = '18px sans-serif';
    unlocked.forEach((s, i) => c2.fillText(s.em, 14 + (i % 4) * ((bw - 20) / 4) + 6, gy - bh + 22 + Math.floor(i / 4) * 22));
    c2.textAlign = 'left';
  }

  function lerpC(a, b, k) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (s) => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k);
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  }

  // ---------- Día ----------
  const CUST = ['🧑', '👩', '👨‍🦱', '👧', '🧔', '👵', '🧑‍🦰', '👦'];
  let custAcc = 0;
  function updateDay(dt) {
    addCoins(rate() * dt);
    S.dayTimer += dt;
    document.getElementById('nightBtn').classList.toggle('show', S.dayTimer >= DAY_LEN);
    custAcc += dt * Math.min(3, 0.5 + Math.log10(1 + rawRate()) * 0.5);
    if (custAcc > 1 && customers.length < 8) {
      custAcc = 0;
      const food = STATIONS.filter((s) => S.levels[s.id]);
      customers.push({ x: view.w + 20, em: CUST[Math.floor(Math.random() * CUST.length)], food: food[Math.floor(Math.random() * food.length)].em, state: 'in', wait: 0 });
    }
    customers.forEach((c, i) => {
      const target = doorX() + 26 + i * 34;
      if (c.state === 'in') { c.x -= 90 * dt; if (c.x <= target) { c.x = target; if (i === 0) { c.wait += dt * (1 + tapBonus); if (c.wait > 1.2) { c.state = 'out'; pay(c); } } } }
      else c.x += 110 * dt;
    });
    customers = customers.filter((c) => c.x < view.w + 40);
    tapBonus = Math.max(0, tapBonus - dt * 2);
  }
  function pay(c) {
    const v = Math.max(1, rate() * 0.5);
    addCoins(v);
    coinsFx.push({ x: c.x, y: groundY() - 60, life: 1, text: '+' + fmt(v) });
    sfx.coin();
  }
  function drawDay() {
    const gy = groundY();
    c2.font = '34px sans-serif'; c2.textAlign = 'center';
    customers.forEach((c, i) => {
      const bob = Math.sin(performance.now() / 120 + i) * (c.state === 'in' && c.x > doorX() + 26 + i * 34 ? 3 : 0);
      c2.fillText(c.em, c.x, gy - 6 + bob);
      if (c.state === 'out') { c2.font = '20px sans-serif'; c2.fillText(c.food, c.x + 14, gy - 36); c2.font = '34px sans-serif'; }
      else if (i === 0 && c.x <= doorX() + 30) { c2.font = '16px sans-serif'; c2.fillText('💭' + c.food, c.x + 6, gy - 44); c2.font = '34px sans-serif'; }
    });
    c2.textAlign = 'left';
  }

  // ---------- Noche ----------
  function startNight() {
    mode = 'night'; document.body.classList.add('night');
    document.getElementById('nightBtn').classList.remove('show');
    customers = [];
    door = doorHp(); nightTime = 0; spawned = 0; spawnAcc = 0; zombies = []; knives = [];
    toSpawn = 7 + S.night * 3;
    nightLen = 38 + Math.min(S.night, 20);
    sfx.lose(); toast(t('tapHint'));
  }
  function zombieHp(type) { return Math.round(10 * Math.pow(1.28, S.night - 1) * { n: 1, f: 0.6, t: 3.5 }[type]); }
  function spawnZombie() {
    const r = Math.random();
    const type = S.night >= 3 && r < 0.15 ? 't' : S.night >= 2 && r < 0.4 ? 'f' : 'n';
    const hp = zombieHp(type);
    zombies.push({ x: view.w + 30, lane: Math.floor(Math.random() * 3), type, hp, max: hp, speed: { n: 34, f: 62, t: 20 }[type] * (1 + S.night * 0.02), hit: 0, atk: 0 });
    spawned++;
  }
  function laneY(l) { return groundY() + 30 + l * 48; }
  function updateNight(dt) {
    nightTime += dt;
    spawnAcc += dt;
    // Llegan en grupos de hasta 3, cada vez más seguidos
    const interval = (nightLen - 8) / toSpawn * 2.5;
    if (spawned < toSpawn && spawnAcc >= interval) {
      spawnAcc = 0;
      const n = Math.min(toSpawn - spawned, 1 + Math.floor(Math.random() * 3));
      for (let i = 0; i < n; i++) { spawnZombie(); zombies[zombies.length - 1].x += i * 38; }
    }
    const dx = doorX();
    zombies.forEach((z) => {
      z.hit = Math.max(0, z.hit - dt * 4);
      if (z.x > dx + 18) z.x -= z.speed * dt;
      else { z.atk += dt; if (z.atk > 0.8) { z.atk = 0; door -= { n: 8, f: 5, t: 20 }[z.type] * (1 + S.night * 0.1); sfx.hit(); shake = 6; vibrate(20); } }
    });
    // chef automático
    if (S.chef) {
      chefAcc += dt;
      if (chefAcc > 0.5 && zombies.length) {
        chefAcc = 0;
        const target = zombies.reduce((a, b) => (a.x < b.x ? a : b));
        knives.push({ x: dx, y: groundY() - 80, tx: target, dmg: chefDps() * 0.5, life: 1 });
      }
    }
    knives.forEach((k) => {
      if (!zombies.includes(k.tx)) { k.life = 0; return; }
      const tx = k.tx.x, ty = laneY(k.tx.lane) - 20;
      const d = Math.hypot(tx - k.x, ty - k.y);
      if (d < 14) { damage(k.tx, k.dmg); k.life = 0; return; }
      k.x += (tx - k.x) / d * 600 * dt; k.y += (ty - k.y) / d * 600 * dt;
    });
    knives = knives.filter((k) => k.life > 0);
    document.getElementById('doorBar').style.width = Math.max(0, door / doorHp() * 100) + '%';
    document.getElementById('nightInfo').textContent = t('nightN', { n: S.night, s: Math.max(0, Math.ceil(nightLen - nightTime)) }) + ' · 🧟 ' + (toSpawn - spawned + zombies.length);
    if (door <= 0) endNight(false);
    else if (spawned >= toSpawn && zombies.length === 0) endNight(true);
    else if (nightTime >= nightLen && zombies.length === 0) endNight(true);
  }
  function damage(z, d) {
    z.hp -= d; z.hit = 1; sfx.hit();
    for (let i = 0; i < 5; i++) particles.push({ x: z.x, y: laneY(z.lane) - 20, vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 5, life: 1, color: '#7ed957' });
    if (z.hp <= 0) {
      zombies.splice(zombies.indexOf(z), 1);
      const loot = Math.max(1, rawRate() * 0.6 * { n: 1, f: 0.8, t: 3 }[z.type]);
      addCoins(loot); coinsFx.push({ x: z.x, y: laneY(z.lane) - 50, life: 1, text: '+' + fmt(loot) });
      sfx.pop();
    }
  }
  function drawNight() {
    zombies.slice().sort((a, b) => a.lane - b.lane).forEach((z) => {
      const y = laneY(z.lane);
      const size = { n: 48, f: 40, t: 68 }[z.type];
      c2.font = size + 'px sans-serif'; c2.textAlign = 'center';
      c2.save(); c2.translate(z.x, y);
      c2.rotate(Math.sin(performance.now() / 200 + z.x) * 0.08);
      if (z.hit) c2.filter = 'brightness(2)';
      c2.scale(-1, 1);
      c2.fillText('🧟', 0, 0);
      c2.restore(); c2.filter = 'none';
      c2.fillStyle = 'rgba(0,0,0,.5)'; c2.fillRect(z.x - 18, y - size - 4, 36, 5);
      c2.fillStyle = '#e2504c'; c2.fillRect(z.x - 18, y - size - 4, 36 * Math.max(0, z.hp / z.max), 5);
    });
    c2.font = '20px sans-serif';
    knives.forEach((k) => c2.fillText('🔪', k.x, k.y));
    c2.textAlign = 'left';
  }
  function endNight(won) {
    if (mode !== 'night') return;
    mode = 'pause';
    if (won) {
      sfx.win();
      const loot = Math.max(50, rawRate() * nightMult() * 45);
      S.nightsWon++; S.night++; S.dayTimer = 0; save();
      modal(`<h2>${t('win', { n: S.night - 1 })}</h2><div class="stars">🏆</div><p>${t('winTxt', { c: fmt(loot), m: nightMult().toFixed(2) })}</p>`, [
        { label: t('x2'), cls: 'ad', onClick: async () => { addCoins(loot * ((await ads.rewarded()) ? 2 : 1)); backToDay(); } },
        { label: t('take'), cls: 'primary', onClick: async () => { addCoins(loot); await ads.interstitial(); backToDay(); } },
      ]);
    } else {
      sfx.lose();
      modal(`<h2>${t('lose')}</h2><p>${t('loseTxt')}</p>`, [
        { label: t('revive'), cls: 'ad', onClick: async () => { if (await ads.rewarded()) { door = doorHp() * 0.6; mode = 'night'; } else { S.dayTimer = DAY_LEN * 0.5; backToDay(); } } },
        { label: t('ok'), onClick: async () => { S.dayTimer = DAY_LEN * 0.5; save(); await ads.interstitial(); backToDay(); } },
      ]);
    }
  }
  function backToDay() { mode = 'day'; document.body.classList.remove('night'); zombies = []; renderList(); }

  // ---------- Entrada ----------
  canvas.addEventListener('pointerdown', (e) => {
    const x = e.clientX, y = e.clientY;
    if (mode === 'night') {
      let best = null, bd = 60;
      zombies.forEach((z) => { const d = Math.hypot(z.x - x, laneY(z.lane) - 20 - y); if (d < bd) { bd = d; best = z; } });
      if (best) { damage(best, panDmg()); vibrate(8); }
      particles.push({ x, y, vx: 0, vy: 0, life: 0.4, color: '#fff', ring: true });
    } else if (mode === 'day' && y < sceneH()) {
      tapBonus = Math.min(tapBonus + 0.8, 6);
      const v = Math.max(1, rate() * 0.05);
      addCoins(v); sfx.tap();
      coinsFx.push({ x, y, life: 0.7, text: '+' + fmt(v) });
    }
  });

  // ---------- Panel ----------
  let tab = 'kitchen';
  const list = document.getElementById('list');
  document.getElementById('tabK').textContent = t('kitchen');
  document.getElementById('tabD').textContent = t('defense');
  document.querySelectorAll('.tab').forEach((b) => (b.onclick = () => {
    tab = b.dataset.tab; sfx.tap();
    document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('on', x === b));
    renderList();
  }));
  function row(em, name, sub, btnLabel, cost, prog, onBuy, cls) {
    const r = document.createElement('div');
    r.className = 'row ' + (cls || '');
    r.innerHTML = `<div class="em">${em}</div><div class="info"><div class="name">${name}</div><div class="sub">${sub}</div>${prog != null ? `<div class="bar"><i style="width:${prog * 100}%"></i></div>` : ''}</div>`;
    const b = document.createElement('button');
    b.className = 'btn primary'; b.innerHTML = `${btnLabel}<br>🪙 ${fmt(cost)}`;
    b.dataset.cost = cost;
    b.onclick = () => { if (S.coins >= cost) { S.coins -= cost; onBuy(); sfx.coin(); vibrate(10); renderList(); save(); } };
    r.appendChild(b); list.appendChild(r);
  }
  function renderList() {
    const scroll = list.scrollTop;
    list.innerHTML = '';
    if (tab === 'kitchen') {
      const b = document.createElement('button');
      b.className = 'btn ad'; b.style.width = '100%'; b.style.marginBottom = '8px';
      b.id = 'boostBtn';
      b.onclick = async () => { if (await ads.rewarded()) { S.boostUntil = Math.max(Date.now(), S.boostUntil) + 5 * 60000; save(); } };
      list.appendChild(b);
      let shownLocked = false;
      STATIONS.forEach((st) => {
        const l = S.levels[st.id] || 0;
        const name = st[G.lang];
        if (!l) {
          if (shownLocked) return; shownLocked = true;
          row(st.em, name, t('perSec', { n: fmt(st.base) }), t('unlock'), st.cost, null, () => (S.levels[st.id] = 1), 'locked');
        } else {
          const next = [10, 25, 50, 100, 200, 1e9].find((m) => m > l);
          const prev = [0, 10, 25, 50, 100, 200].filter((m) => m <= l).pop();
          row(st.em, `${name} · ${t('lvl', { n: l })}`, t('perSec', { n: fmt(stationIncome(st) * nightMult()) }) + (next < 1e9 ? ` · x2 @${next}` : ''),
            t('upgrade'), upCost(st), (l - prev) / (next - prev), () => (S.levels[st.id] = l + 1));
        }
      });
    } else {
      row('🍳', `${t('pan')} · ${t('lvl', { n: S.pan })}`, t('panSub', { n: fmt(panDmg()) }), t('upgrade'), defCost('pan'), null, () => S.pan++);
      row('🔪', `${t('chef')} · ${t('lvl', { n: S.chef })}`, t('chefSub', { n: fmt(chefDps()) }), S.chef ? t('upgrade') : t('unlock'), defCost('chef'), null, () => S.chef++);
      row('🚪', `${t('door')} · ${t('lvl', { n: S.door })}`, t('doorSub', { n: fmt(doorHp()) }), t('upgrade'), defCost('door'), null, () => S.door++);
    }
    list.scrollTop = scroll;
    refreshButtons();
  }
  function refreshButtons() {
    list.querySelectorAll('.btn.primary').forEach((b) => (b.disabled = S.coins < +b.dataset.cost));
    const bb = document.getElementById('boostBtn');
    if (bb) {
      const left = S.boostUntil - Date.now();
      bb.textContent = left > 0 ? t('boostOn', { s: Math.floor(left / 60000) + ':' + String(Math.floor(left / 1000) % 60).padStart(2, '0') }) : t('boost');
    }
  }

  // ---------- Bucle ----------
  let last = performance.now(), uiAcc = 0;
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (mode === 'day') updateDay(dt); else if (mode === 'night') updateNight(dt);
    coinsFx.forEach((f) => { f.y -= 50 * dt; f.life -= dt; });
    coinsFx = coinsFx.filter((f) => f.life > 0);
    particles.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= dt * 2; });
    particles = particles.filter((p) => p.life > 0);
    shake = Math.max(0, shake - dt * 30);
    uiAcc += dt;
    if (uiAcc > 0.25) {
      uiAcc = 0;
      document.getElementById('coins').textContent = fmt(S.coins);
      document.getElementById('rate').textContent = t('perSec', { n: fmt(rate()) });
      document.getElementById('mult').textContent = '🌙 x' + nightMult().toFixed(2) + (boostMult() > 1 ? ' ⚡' : '');
      if (mode === 'day') refreshButtons();
    }
    draw();
    requestAnimationFrame(loop);
  }
  function draw() {
    c2.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    c2.fillStyle = '#2d1b3d'; c2.fillRect(0, 0, view.w, view.h);
    c2.save();
    if (shake) c2.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    drawRestaurant();
    if (mode === 'day') drawDay(); else drawNight();
    particles.forEach((p) => {
      c2.globalAlpha = Math.max(0, p.life);
      if (p.ring) { c2.strokeStyle = p.color; c2.lineWidth = 3; c2.beginPath(); c2.arc(p.x, p.y, 30 * (1 - p.life / 0.4) + 8, 0, 7); c2.stroke(); }
      else { c2.fillStyle = p.color; c2.beginPath(); c2.arc(p.x, p.y, 4, 0, 7); c2.fill(); }
    });
    c2.globalAlpha = 1;
    c2.font = 'bold 20px sans-serif'; c2.textAlign = 'center';
    coinsFx.forEach((f) => { c2.globalAlpha = Math.max(0, Math.min(1, f.life * 2)); c2.fillStyle = '#ffd447'; c2.strokeStyle = 'rgba(0,0,0,.5)'; c2.lineWidth = 3; c2.strokeText(f.text, f.x, f.y); c2.fillText(f.text, f.x, f.y); });
    c2.globalAlpha = 1; c2.textAlign = 'left';
    c2.restore();
  }

  document.getElementById('nightBtn').textContent = t('night');
  document.getElementById('nightBtn').onclick = () => { sfx.tap(); startNight(); };
  document.getElementById('btnSet').onclick = () => { sfx.tap(); G.settingsModal(t); };
  G.onBack(() => { const m = document.querySelector('.modal'); if (m) m.remove(); });
  if (!store.get('tut')) { setTimeout(() => toast(t('tapServe')), 800); store.set('tut', true); }

  ads.init(window.GAME_CONFIG);
  window.__game = { S, startNight };
  renderList();
  requestAnimationFrame(loop);
})();

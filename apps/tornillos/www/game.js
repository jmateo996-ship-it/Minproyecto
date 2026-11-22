/* Tornillos del Tiempo — puzle de desatornillar con rebobinado temporal. */
(function () {
  'use strict';
  const { sfx, vibrate, ads, modal, toast, roundRect } = G;
  const store = G.makeStore('screws');
  const t = G.makeT({
    level: { es: 'Nivel {n}', en: 'Level {n}' },
    rewind: { es: 'Rebobinar', en: 'Rewind' },
    slot: { es: 'Hueco', en: 'Slot' },
    restart: { es: 'Reiniciar', en: 'Restart' },
    win: { es: '¡Todo desmontado!', en: 'All taken apart!' },
    lose: { es: '¡Sin espacio!', en: 'Out of space!' },
    loseTxt: { es: 'La caja de espera está llena. Rebobina el tiempo o pide más espacio.', en: 'The holding tray is full. Rewind time or get more space.' },
    rwAd: { es: '📺 Rebobinar 3 movimientos', en: '📺 Rewind 3 moves' },
    slotAd: { es: '📺 +1 hueco', en: '📺 +1 slot' },
    retry: { es: 'Reintentar', en: 'Retry' },
    next: { es: 'Siguiente nivel', en: 'Next level' },
    x2: { es: '📺 Monedas x2', en: '📺 Coins x2' },
    noMoves: { es: 'Nada que rebobinar', en: 'Nothing to rewind' },
    rwBuy: { es: 'Rebobinar: 100 🪙 o ver un anuncio', en: 'Rewind: 100 🪙 or watch an ad' },
    buy: { es: 'Usar 100 🪙', en: 'Use 100 🪙' },
    watch: { es: '📺 Ver anuncio', en: '📺 Watch ad' },
    cancel: { es: 'Cancelar', en: 'Cancel' },
    tutorial: { es: 'Quita los tornillos libres y llévalos a la caja de su color', en: 'Remove free screws and drop them into the box of their color' },
    maxSlots: { es: 'Máximo de huecos', en: 'Max slots reached' },
  });

  const SCREW_COLORS = ['#ff4d6d', '#ffb703', '#3a86ff', '#2ec4b6', '#9b5de5', '#fb5607', '#80ed99', '#f15bb5'];
  const PLATE_COLORS = ['#e9c46a', '#a8dadc', '#f4a261', '#b5e48c', '#cdb4db', '#ffc8dd', '#bde0fe', '#d4a373'];
  const BW = 100, BH = 130, SR = 3.6; // tablero lógico y radio de tornillo

  let level = store.get('level', 1), coins = store.get('coins', 0);
  let plates = [], screws = [], queue = [], qi = 0, boxes = [], holder = [], holderCap = 5;
  let history = [], freeRewinds = 1, helped = 0, over = false, busy = 0, particles = [];

  function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s + 0x6D2B79F5) >>> 0; let x = Math.imul(s ^ (s >>> 15), 1 | s); x ^= x + Math.imul(x ^ (x >>> 7), 61 | x); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  }

  // ---------- Generación (resoluble por construcción) ----------
  function generate(lv) {
    const R = rng(lv * 7919 + 13);
    const nPlates = Math.min(3 + Math.floor(lv * 0.7), 16);
    const nColors = Math.min(3 + Math.floor(lv / 3), SCREW_COLORS.length);
    const P = [], S = [];
    const farEnough = (x, y) => S.every((s) => Math.hypot(s.gx - x, s.gy - y) > SR * 2.6);
    for (let i = 0, guard = 0; i < nPlates && guard < 500; guard++) {
      const kind = R();
      let w, h;
      if (kind < 0.45) { w = 40 + R() * 34; h = 13; }
      else if (kind < 0.7) { w = 13; h = 40 + R() * 34; }
      else { w = h = 24 + R() * 14; }
      const x = 3 + R() * (BW - w - 6), y = 3 + R() * (BH - h - 6);
      const inset = 6;
      let pts;
      if (w === 13) pts = [[w / 2, inset], [w / 2, h - inset]];
      else if (h === 13) pts = [[inset, h / 2], [w - inset, h / 2]];
      else pts = [[inset, inset], [w - inset, inset], [inset, h - inset], [w - inset, h - inset]].filter(() => R() < 0.85);
      if (pts.length < 2) pts = [[inset, inset], [w - inset, h - inset]];
      const glob = pts.map(([px, py]) => [x + px, y + py]);
      if (!glob.every(([gx, gy]) => farEnough(gx, gy))) continue;
      const plate = { id: P.length, x, y, w, h, layer: P.length, color: PLATE_COLORS[Math.floor(R() * PLATE_COLORS.length)], present: true };
      P.push(plate);
      glob.forEach(([gx, gy]) => S.push({ id: S.length, plate: plate.id, gx, gy }));
      i++;
    }
    // Ajustar a múltiplo de 3 quitando tornillos de placas con más de uno
    while (S.length % 3) {
      const cand = S.filter((s) => S.filter((o) => o.plate === s.plate).length > 1);
      S.splice(S.indexOf(cand[Math.floor(R() * cand.length)]), 1);
    }
    S.forEach((s, i) => (s.id = i));
    // Simular un orden válido de retirada
    const presentP = new Set(P.map((p) => p.id)), presentS = new Set(S.map((s) => s.id)), order = [];
    while (presentS.size) {
      const free = S.filter((s) => presentS.has(s.id) && !coveredBy(s, P, presentP));
      const pick = free[Math.floor(R() * free.length)];
      presentS.delete(pick.id); order.push(pick);
      if (!S.some((s) => s.plate === pick.plate && presentS.has(s.id))) presentP.delete(pick.plate);
    }
    // Asignar colores por tríos en ese orden → cola de cajas
    const Q = [];
    for (let k = 0; k < order.length; k += 3) {
      const col = Math.floor(R() * nColors);
      Q.push(col);
      for (let j = 0; j < 3; j++) order[k + j].color = col;
    }
    return { P, S, Q };
  }
  function coveredBy(s, P, presentSet) {
    const pl = P[s.plate];
    return P.some((q) => q.layer > pl.layer && presentSet.has(q.id) &&
      s.gx > q.x - SR * 0.7 && s.gx < q.x + q.w + SR * 0.7 && s.gy > q.y - SR * 0.7 && s.gy < q.y + q.h + SR * 0.7);
  }
  const presentPlates = () => new Set(plates.filter((p) => p.present).map((p) => p.id));
  const isFree = (s) => s.state === 'board' && !coveredBy(s, plates, presentPlates());

  function startLevel() {
    const g = generate(level);
    plates = g.P.map((p) => Object.assign(p, { fall: null }));
    screws = g.S.map((s) => Object.assign(s, { state: 'board', fly: 0, fx: 0, fy: 0 }));
    queue = g.Q; qi = 0;
    boxes = [newBox(), newBox()];
    holder = []; holderCap = 5; history = []; freeRewinds = 1; helped = 0; over = false; busy = 0; particles = [];
    updateHud(); layout();
    if (level === 1) setTimeout(() => toast(t('tutorial')), 500);
  }
  function newBox() {
    if (qi >= queue.length) return null;
    return { color: queue[qi++], items: [], leave: 0, enter: 1 };
  }

  // ---------- Layout ----------
  const canvas = document.getElementById('c');
  const c2 = canvas.getContext('2d');
  let view, sc = 3, bx0 = 0, by0 = 0, boxY = 0, holdY = 0;
  function layout() {
    if (!view) return;
    boxY = 78 + 38; holdY = boxY + 74;
    const top = holdY + 40, bottom = 105;
    sc = Math.min((view.w - 20) / BW, (view.h - top - bottom) / BH);
    bx0 = (view.w - BW * sc) / 2; by0 = top + (view.h - top - bottom - BH * sc) / 2;
  }
  view = G.fitCanvas(canvas, layout);

  function boxSlotPos(bi, si) {
    const bw = Math.min(150, view.w * 0.42), gap = 16;
    const x0 = view.w / 2 - bw - gap / 2 + bi * (bw + gap);
    return [x0 + bw * (0.2 + si * 0.3), boxY];
  }
  function holdPos(i) {
    const step = Math.min(50, (view.w - 40) / holderCap);
    return [view.w / 2 - (holderCap - 1) * step / 2 + i * step, holdY];
  }
  function screwScreenPos(s) {
    if (s.state === 'board') return [bx0 + s.gx * sc, by0 + s.gy * sc];
    if (s.state === 'box') return boxSlotPos(s.bi, s.si);
    if (s.state === 'hold') return holdPos(holder.indexOf(s));
    return [0, 0];
  }

  // ---------- Dibujo ----------
  function drawScrew(x, y, r, col, dim) {
    c2.fillStyle = 'rgba(0,0,0,.35)'; c2.beginPath(); c2.arc(x + r * 0.15, y + r * 0.25, r, 0, 7); c2.fill();
    const g = c2.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, '#fff'); g.addColorStop(0.35, SCREW_COLORS[col]); g.addColorStop(1, shade(SCREW_COLORS[col], 0.6));
    c2.fillStyle = g; c2.beginPath(); c2.arc(x, y, r, 0, 7); c2.fill();
    c2.strokeStyle = 'rgba(0,0,0,.45)'; c2.lineWidth = Math.max(1.5, r * 0.18);
    c2.beginPath(); c2.moveTo(x - r * 0.5, y); c2.lineTo(x + r * 0.5, y); c2.moveTo(x, y - r * 0.5); c2.lineTo(x, y + r * 0.5); c2.stroke();
    if (dim) { c2.fillStyle = 'rgba(20,30,50,.35)'; c2.beginPath(); c2.arc(x, y, r, 0, 7); c2.fill(); }
  }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    return `rgb(${((n >> 16) & 255) * f | 0},${((n >> 8) & 255) * f | 0},${(n & 255) * f | 0})`;
  }
  function drawGear(x, y, r, a) {
    c2.save(); c2.translate(x, y); c2.rotate(a);
    c2.fillStyle = 'rgba(255,255,255,.04)';
    c2.beginPath();
    for (let i = 0; i < 12; i++) { const an = i / 12 * Math.PI * 2; c2.rect(Math.cos(an) * r - 6, Math.sin(an) * r - 6, 12, 12); }
    c2.fill(); c2.beginPath(); c2.arc(0, 0, r, 0, 7); c2.arc(0, 0, r * 0.4, 0, 7, true); c2.fill();
    c2.restore();
  }
  function draw() {
    c2.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    const bg = c2.createLinearGradient(0, 0, 0, view.h);
    bg.addColorStop(0, '#16324a'); bg.addColorStop(1, '#0c1d2c');
    c2.fillStyle = bg; c2.fillRect(0, 0, view.w, view.h);
    const tm = performance.now() / 4000;
    drawGear(view.w * 0.15, view.h * 0.75, 70, tm); drawGear(view.w * 0.88, view.h * 0.4, 90, -tm * 0.8);

    // Cajas de color
    const bw = Math.min(150, view.w * 0.42), gap = 16;
    boxes.forEach((b, i) => {
      if (!b) return;
      const x0 = view.w / 2 - bw - gap / 2 + i * (bw + gap);
      const dy = -b.leave * 80 + b.enter * -60;
      c2.globalAlpha = 1 - b.leave;
      c2.fillStyle = SCREW_COLORS[b.color];
      roundRect(c2, x0, boxY - 26 + dy, bw, 52, 14); c2.fill();
      c2.fillStyle = 'rgba(0,0,0,.25)';
      for (let k = 0; k < 3; k++) { const [sx] = boxSlotPos(i, k); c2.beginPath(); c2.arc(sx, boxY + dy, 13, 0, 7); c2.fill(); }
      c2.globalAlpha = 1;
    });
    // Bandeja de espera
    c2.fillStyle = 'rgba(0,0,0,.3)';
    const [hx0] = holdPos(0), [hx1] = holdPos(holderCap - 1);
    roundRect(c2, hx0 - 24, holdY - 22, hx1 - hx0 + 48, 44, 22); c2.fill();
    for (let i = 0; i < holderCap; i++) {
      const [x, y] = holdPos(i);
      c2.fillStyle = holder.length >= holderCap - 1 && i >= holder.length ? 'rgba(226,80,76,.35)' : 'rgba(255,255,255,.1)';
      c2.beginPath(); c2.arc(x, y, 13, 0, 7); c2.fill();
    }

    // Placas y tornillos del tablero
    const pres = presentPlates();
    plates.slice().sort((a, b) => a.layer - b.layer).forEach((p) => {
      if (!p.present && !p.fall) return;
      c2.save();
      let x = bx0 + p.x * sc, y = by0 + p.y * sc;
      if (p.fall) { c2.translate(x + p.w * sc / 2, y + p.h * sc / 2 + p.fall.y); c2.rotate(p.fall.r); c2.translate(-p.w * sc / 2, -p.h * sc / 2); x = 0; y = 0; c2.globalAlpha = Math.max(0, 1 - p.fall.t); }
      c2.fillStyle = 'rgba(0,0,0,.3)'; roundRect(c2, x + 3, y + 5, p.w * sc, p.h * sc, 6 * sc / 3); c2.fill();
      c2.fillStyle = p.color; c2.globalAlpha *= 0.88;
      roundRect(c2, x, y, p.w * sc, p.h * sc, 6 * sc / 3); c2.fill();
      c2.globalAlpha = p.fall ? Math.max(0, 1 - p.fall.t) : 1;
      c2.strokeStyle = 'rgba(255,255,255,.5)'; c2.lineWidth = 2; c2.stroke();
      // agujeros
      screws.filter((s) => s.plate === p.id).forEach((s) => {
        c2.fillStyle = 'rgba(0,0,0,.4)';
        c2.beginPath(); c2.arc(x + (s.gx - p.x) * sc, y + (s.gy - p.y) * sc, SR * sc * 0.75, 0, 7); c2.fill();
      });
      c2.restore();
      if (p.present) screws.filter((s) => s.plate === p.id && s.state === 'board').forEach((s) => {
        drawScrew(bx0 + s.gx * sc, by0 + s.gy * sc, SR * sc * 0.85, s.color, coveredBy(s, plates, pres));
      });
    });

    // Tornillos fuera del tablero (cajas, bandeja, volando)
    screws.forEach((s) => {
      if (s.state !== 'box' && s.state !== 'hold') return;
      let [x, y] = screwScreenPos(s);
      if (s.state === 'box') { const b = boxes[s.bi]; if (b) y += -b.leave * 80 + b.enter * -60; }
      if (s.fly < 1) { const e = 1 - Math.pow(1 - s.fly, 3); x = s.fx + (x - s.fx) * e; y = s.fy + (y - s.fy) * e - Math.sin(e * Math.PI) * 40; }
      drawScrew(x, y, 11, s.color, false);
    });
    particles.forEach((p) => { c2.globalAlpha = p.life; c2.fillStyle = p.color; c2.beginPath(); c2.arc(p.x, p.y, p.r, 0, 7); c2.fill(); });
    c2.globalAlpha = 1;
  }

  // ---------- Movimientos ----------
  function snapshot() {
    return {
      screws: screws.map((s) => [s.state, s.bi, s.si]),
      plates: plates.map((p) => p.present),
      boxes: boxes.map((b) => (b ? { color: b.color, items: b.items.map((s) => s.id) } : null)),
      holder: holder.map((s) => s.id), qi,
    };
  }
  function restore(sn) {
    screws.forEach((s, i) => { [s.state, s.bi, s.si] = sn.screws[i]; s.fly = 1; });
    plates.forEach((p, i) => { p.present = sn.plates[i]; p.fall = null; });
    boxes = sn.boxes.map((b) => (b ? { color: b.color, items: b.items.map((id) => screws[id]), leave: 0, enter: 0 } : null));
    holder = sn.holder.map((id) => screws[id]); qi = sn.qi;
  }

  function boxFor(color) { return boxes.findIndex((b) => b && !b.leave && b.color === color && b.items.length < 3); }
  function checkLose() {
    if (over || busy || holder.length < holderCap) return;
    const canMove = screws.some((s) => isFree(s) && plates[s.plate].present && boxFor(s.color) >= 0);
    if (!canMove) { over = true; setTimeout(fail, 500); }
  }
  function tapScrew(s) {
    if (boxFor(s.color) < 0 && holder.length >= holderCap) { sfx.hit(); vibrate(20); return; }
    history.push(snapshot()); if (history.length > 30) history.shift();
    const [fx, fy] = screwScreenPos(s);
    s.fx = fx; s.fy = fy; s.fly = 0;
    sfx.pop(); vibrate(8);
    const bi = boxFor(s.color);
    if (bi >= 0) putInBox(s, bi);
    else { s.state = 'hold'; holder.push(s); }
    // ¿la placa queda suelta?
    const p = plates[s.plate];
    if (!screws.some((o) => o.plate === p.id && o.state === 'board')) {
      p.present = false; p.fall = { y: 0, vy: -2, r: 0, vr: (Math.random() - 0.5) * 0.1, t: 0 };
      sfx.whoosh();
    }
    checkBoxes();
    checkLose();
  }
  function putInBox(s, bi) {
    const b = boxes[bi];
    s.state = 'box'; s.bi = bi; s.si = b.items.length; b.items.push(s);
  }
  function checkBoxes() {
    boxes.forEach((b, i) => {
      if (b && b.items.length === 3 && !b.leave) {
        b.leave = 0.0001; busy++;
        setTimeout(() => {
          sfx.coin();
          const [x, y] = boxSlotPos(i, 1);
          for (let k = 0; k < 18; k++) { const a = Math.random() * 7, v = 2 + Math.random() * 4; particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, r: 3, color: SCREW_COLORS[b.color] }); }
          b.items.forEach((s) => (s.state = 'gone'));
          boxes[i] = newBox();
          // Pasar tornillos de la bandeja a la caja nueva
          const nb = boxes[i];
          if (nb) holder.filter((h) => h.color === nb.color).slice(0, 3).forEach((h) => {
            const [fx, fy] = holdPos(holder.indexOf(h)); h.fx = fx; h.fy = fy; h.fly = 0;
            holder.splice(holder.indexOf(h), 1); putInBox(h, i);
          });
          busy--;
          checkBoxes();
          if (!over && screws.every((s) => s.state === 'gone')) { over = true; setTimeout(win, 400); }
          else checkLose();
        }, 380);
      }
    });
  }

  function rewind() {
    if (!history.length) { toast(t('noMoves')); return false; }
    let sn;
    for (let i = 0; i < 3 && history.length; i++) sn = history.pop();
    restore(sn); over = false; sfx.rewind(); vibrate(30);
    for (let k = 0; k < 30; k++) particles.push({ x: view.w / 2, y: view.h / 2, vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12, life: 1, r: 2, color: '#9cc7ff' });
    return true;
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (over || busy) return;
    const x = e.clientX, y = e.clientY;
    let best = null, bd = SR * sc * 1.6;
    screws.forEach((s) => {
      if (s.state !== 'board' || !plates[s.plate].present) return;
      const d = Math.hypot(bx0 + s.gx * sc - x, by0 + s.gy * sc - y);
      if (d < bd && isFree(s)) { bd = d; best = s; }
    });
    if (best) tapScrew(best);
    else {
      // ¿tocó un tornillo tapado?
      const hidden = screws.some((s) => s.state === 'board' && Math.hypot(bx0 + s.gx * sc - x, by0 + s.gy * sc - y) < SR * sc * 1.4);
      if (hidden) { sfx.hit(); vibrate(15); }
    }
  });

  // ---------- Bucle ----------
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    screws.forEach((s) => { if (s.fly < 1) s.fly = Math.min(1, s.fly + dt * 3.2); });
    plates.forEach((p) => {
      if (!p.fall) return;
      p.fall.vy += 0.6; p.fall.y += p.fall.vy; p.fall.r += p.fall.vr; p.fall.t += dt * 1.1;
      if (p.fall.t >= 1) p.fall = null;
    });
    boxes.forEach((b) => { if (!b) return; if (b.leave) b.leave = Math.min(1, b.leave + dt * 3); if (b.enter) b.enter = Math.max(0, b.enter - dt * 4); });
    particles.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= dt * 1.5; });
    particles = particles.filter((p) => p.life > 0);
    draw();
    requestAnimationFrame(loop);
  }

  // ---------- Fin ----------
  function win() {
    sfx.win(); vibrate(40);
    const stars = helped === 0 ? 3 : helped === 1 ? 2 : 1;
    const reward = 25 + stars * 10 + level;
    const give = (n) => { coins += n; level++; store.set('coins', coins); store.set('level', level); };
    modal(`<h2>${t('win')}</h2><div class="stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div><p>+${reward} 🪙</p>`, [
      { label: t('x2'), cls: 'ad', onClick: async () => { give(reward * ((await ads.rewarded()) ? 2 : 1)); startLevel(); } },
      { label: t('next'), cls: 'primary', onClick: async () => { give(reward); if (level > 3) await ads.interstitial(); startLevel(); } },
    ]);
  }
  function fail() {
    sfx.lose();
    modal(`<h2>${t('lose')}</h2><p>${t('loseTxt')}</p>`, [
      { label: t('rwAd'), cls: 'ad', onClick: async () => { if (await ads.rewarded()) { helped++; rewind(); } else fail(); } },
      { label: t('slotAd'), cls: 'ad', onClick: async () => { if (await ads.rewarded()) { helped++; holderCap++; over = false; checkLose(); } else fail(); } },
      { label: t('retry'), onClick: async () => { await ads.interstitial(); startLevel(); } },
    ]);
  }

  function updateHud() {
    document.getElementById('level').textContent = t('level', { n: level });
    document.getElementById('coins').textContent = G.fmt(coins);
    const b = document.getElementById('rwBadge');
    b.textContent = freeRewinds > 0 ? freeRewinds : '📺'; b.className = 'badge' + (freeRewinds > 0 ? '' : ' ad');
  }

  document.getElementById('tRewind').textContent = t('rewind');
  document.getElementById('tSlot').textContent = t('slot');
  document.getElementById('tRestart').textContent = t('restart');
  document.getElementById('bRewind').onclick = () => {
    if (busy) return; sfx.tap();
    if (!history.length) { toast(t('noMoves')); return; }
    if (freeRewinds > 0) { if (rewind()) { freeRewinds--; updateHud(); } return; }
    modal(`<h2>⏪</h2><p>${t('rwBuy')}</p>`, [
      { label: t('buy'), cls: 'primary', onClick: () => { if (coins >= 100) { coins -= 100; store.set('coins', coins); helped++; rewind(); updateHud(); } else toast('🪙 ✖'); } },
      { label: t('watch'), cls: 'ad', onClick: async () => { if (await ads.rewarded()) { helped++; rewind(); } } },
      { label: t('cancel') },
    ]);
  };
  document.getElementById('bSlot').onclick = async () => {
    if (busy) return; sfx.tap();
    if (holderCap >= 7) { toast(t('maxSlots')); return; }
    if (await ads.rewarded()) { holderCap++; helped++; if (over && !document.querySelector('.modal')) over = false; }
  };
  document.getElementById('bRestart').onclick = () => { if (!busy) { sfx.tap(); startLevel(); } };
  document.getElementById('btnSet').onclick = () => { sfx.tap(); G.settingsModal(t); };
  G.onBack(() => { const m = document.querySelector('.modal'); if (m) m.remove(); });

  ads.init(window.GAME_CONFIG);
  window.__game = { get screws() { return screws; }, get plates() { return plates; }, get boxes() { return boxes; }, get holder() { return holder; }, isFree, tapScrew, get level() { return level; }, generate };
  startLevel();
  requestAnimationFrame(loop);
})();

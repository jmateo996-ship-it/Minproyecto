/* =========================================================================
   ÉXODO 2942 — Motor principal
   Shoot'em up vertical. Resolución lógica 720 x (1000‑1700), renderizado a
   la densidad física de la pantalla (hasta 2160 px de ancho = 4K vertical).
   ========================================================================= */
'use strict';

(() => {
  const { CHARACTERS, PROLOGUE, CHAPTERS, ENDING } = window.STORY;
  const A = window.GameAudio;
  const TAU = Math.PI * 2;
  const $ = id => document.getElementById(id);
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ------------------------------ Guardado ----------------------------- */
  const SAVE_KEY = 'exodo2942.save';
  const save = (() => { try { return Object.assign({ unlocked: 1, hiscore: 0, sound: true, seenPrologue: false }, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); } catch (e) { return { unlocked: 1, hiscore: 0, sound: true }; } })();
  const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* sin almacenamiento */ } };

  /* ------------------------------ Lienzo ------------------------------- */
  const canvas = $('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  const G = {
    W: 720, H: 1280, R: 1, cssScale: 1, dt: 0, time: 0, difficulty: 1,
    mode: 'menu', paused: false,
    player: null, enemies: [], eBullets: [], pBullets: [], items: [], particles: [], texts: [],
    boss: null, bg: null, chapter: null, chapterIdx: 0, levelT: 0, phaseState: 'level',
    score: 0, chapterStartScore: 0, shake: 0, flash: 0, banner: null,
  };

  function resize() {
    const vw = window.innerWidth, vh = window.innerHeight;
    G.H = Math.round(clamp(G.W * vh / vw, 1000, 1700));
    const scale = Math.min(vw / G.W, vh / G.H);
    const dpr = window.devicePixelRatio || 1;
    // Límite 4K: 2160 px de ancho físico en vertical
    const R = Math.min(scale * dpr, 2160 / G.W);
    const changed = Math.abs(R - G.R) > 0.01 || !G.built;
    G.R = R; G.cssScale = scale;
    canvas.style.width = Math.round(G.W * scale) + 'px';
    canvas.style.height = Math.round(G.H * scale) + 'px';
    canvas.width = Math.round(G.W * R); canvas.height = Math.round(G.H * R);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    if (changed) { Sprites.build(R); G.built = true; }
    G.bg = Backgrounds.create(G.chapter ? G.chapter.theme : 'title', G.W, G.H, R);
    if (G.player) { G.player.x = clamp(G.player.x, 30, G.W - 30); G.player.y = clamp(G.player.y, 60, G.H - 50); }
  }
  window.addEventListener('resize', () => { clearTimeout(G._rz); G._rz = setTimeout(resize, 120); });

  /* ------------------------- API para jefes ------------------------- */
  const BULLET_R = { bRed: 6, bViolet: 6, bOrange: 8, bBig: 12, bCyan: 6 };
  G.shot = (x, y, vx, vy, kind = 'bRed') => {
    if (G.eBullets.length > 700) return;
    G.eBullets.push({ x, y, vx, vy, k: kind, r: BULLET_R[kind] || 6 });
  };
  G.aim = (x, y) => Math.atan2(G.player.y - y, G.player.x - x);
  G.ring = (x, y, n, sp, off = 0, kind, gap = 0) => {
    for (let i = 0; i < n; i++) {
      const f = i / n; if (gap && f < gap) continue; // hueco que gira con el desfase
      const a = off + f * TAU; G.shot(x, y, Math.cos(a) * sp, Math.sin(a) * sp, kind);
    }
  };
  G.fan = (x, y, ang, n, spread, sp, kind) => {
    for (let i = 0; i < n; i++) { const a = ang + (i - (n - 1) / 2) * spread; G.shot(x, y, Math.cos(a) * sp, Math.sin(a) * sp, kind); }
  };
  G.spawnEnemy = (type, x, y, opts) => spawnEnemy(type, x, y, opts);

  /* ------------------------------ Jugador ------------------------------ */
  function newPlayer() {
    return { x: G.W / 2, y: G.H - 200, r: 7, shield: 3, maxShield: 3, lives: 3, power: 1, bombs: 3, drones: 0,
      fireT: 0, inv: 2, phaseT: 0, phaseCd: 0, dead: 0, tilt: 0, droneAng: 0 };
  }

  /* ------------------------------ Enemigos ----------------------------- */
  const EDEF = {
    dart:     { hp: 16, r: 18, score: 100, spr: 'dart' },
    weaver:   { hp: 22, r: 20, score: 150, spr: 'weaver' },
    gunship:  { hp: 120, r: 30, score: 600, spr: 'gunship' },
    carrier:  { hp: 520, r: 58, score: 3000, spr: 'carrier' },
    mine:     { hp: 30, r: 16, score: 200, spr: 'mine' },
    kamikaze: { hp: 10, r: 12, score: 120, spr: 'kamikaze' },
    rock:     { hp: 70, r: 28, score: 250, spr: 'rock' },
    rockS:    { hp: 18, r: 14, score: 80, spr: 'rockS' },
    crystal:  { hp: 45, r: 18, score: 300, spr: 'crystal' },
  };
  function spawnEnemy(type, x, y, o = {}) {
    const d = EDEF[type];
    const hpScale = 1 + (G.difficulty - 1) * 0.35;
    const e = Object.assign({ type, x, y, vx: 0, vy: 0, t: 0, hp: d.hp * hpScale, maxHp: d.hp * hpScale, r: d.r, score: d.score,
      spr: d.spr, rot: 0, fireT: rand(0.6, 1.8), flash: 0, group: null }, o);
    if (type === 'rock' || type === 'rockS') { e.spr = d.spr + Math.floor(Math.random() * 4); e.spin = rand(-1.5, 1.5); }
    G.enemies.push(e);
    return e;
  }

  const groups = new Map();
  let groupId = 0;
  function newGroup(n, drop = 'P') { const id = ++groupId; groups.set(id, { left: n, killed: 0, n, drop }); return id; }

  /* Formaciones de oleadas */
  const FORMATIONS = {
    line() { const x0 = rand(120, G.W - 120); for (let i = 0; i < 5; i++) spawnEnemy('dart', x0 + (i - 2) * 50, -40 - i * 40, { ai: 'dive', speed: 330 }); },
    vee() { const x0 = rand(160, G.W - 160); for (let i = 0; i < 7; i++) { const k = i - 3; spawnEnemy('dart', x0 + k * 46, -40 - Math.abs(k) * 44, { ai: 'dive', speed: 300 }); } },
    sweep() {
      const left = Math.random() < 0.5, gid = newGroup(6, Math.random() < 0.3 ? 'D' : 'P');
      for (let i = 0; i < 6; i++) spawnEnemy('weaver', left ? -40 : G.W + 40, 160 + rand(-20, 60), { ai: 'sweep', dir: left ? 1 : -1, delay: i * 0.22, group: gid });
    },
    snake() { const x0 = rand(180, G.W - 180); for (let i = 0; i < 6; i++) spawnEnemy('weaver', x0, -40 - i * 55, { ai: 'sine', base: x0, amp: rand(90, 160), speed: 200 }); },
    loop() {
      const gid = newGroup(5, 'P');
      for (let i = 0; i < 5; i++) spawnEnemy('weaver', G.W / 2 + (Math.random() < 0.5 ? -1 : 1) * 120, -40 - i * 50, { ai: 'loop', delay: i * 0.25, group: gid, side: i % 2 ? 1 : -1 });
    },
    gunship() { const n = G.difficulty > 2 ? 2 : 1; for (let i = 0; i < n; i++) spawnEnemy('gunship', n === 1 ? rand(160, G.W - 160) : (i ? G.W * 0.72 : G.W * 0.28), -50, { ai: 'hover', stopY: rand(170, 300) }); },
    carrier() { spawnEnemy('carrier', rand(200, G.W - 200), -80, { ai: 'carrier', drop: Math.random() < 0.5 ? 'S' : 'B' }); },
    mines() { for (let i = 0; i < 5; i++) spawnEnemy('mine', rand(60, G.W - 60), -30 - i * 70, { ai: 'drift', vy: rand(70, 110), vx: rand(-30, 30) }); },
    kami() { for (let i = 0; i < 4; i++) spawnEnemy('kamikaze', rand(40, G.W - 40), -30 - i * 40, { ai: 'homing', speed: 230 }); },
    rocks() { for (let i = 0; i < 4; i++) { const big = Math.random() < 0.5; spawnEnemy(big ? 'rock' : 'rockS', rand(40, G.W - 40), -60 - i * 90, { ai: 'drift', vy: rand(110, 190), vx: rand(-40, 40) }); } },
    crystals() { for (let i = 0; i < 4; i++) spawnEnemy('crystal', rand(60, G.W - 60), -40 - i * 80, { ai: 'drift', vy: rand(80, 130), vx: rand(-20, 20), spin: rand(-1, 1) }); },
  };
  const WAVE_SETS = {
    city:      ['line', 'vee', 'sweep', 'snake', 'gunship', 'loop', 'kami'],
    asteroids: ['rocks', 'rocks', 'line', 'sweep', 'gunship', 'loop', 'vee', 'carrier'],
    crystal:   ['crystals', 'snake', 'sweep', 'mines', 'gunship', 'loop', 'crystals', 'carrier'],
    forge:     ['gunship', 'mines', 'vee', 'kami', 'sweep', 'carrier', 'loop', 'snake'],
    rift:      ['kami', 'sweep', 'gunship', 'carrier', 'vee', 'mines', 'loop', 'crystals', 'rocks'],
  };

  function enemyAI(e, dt) {
    e.t += dt;
    if (e.delay && e.t < e.delay) return;
    const t = e.t - (e.delay || 0);
    switch (e.ai) {
      case 'dive': {
        if (t < 0.6) { e.vx = 0; e.vy = e.speed * 0.6; }
        else if (!e.locked) { e.locked = true; const a = Math.atan2(G.player.y - e.y, G.player.x - e.x); e.vx = Math.cos(a) * e.speed * 0.35; e.vy = e.speed; }
        e.rot = Math.atan2(e.vy, e.vx) - Math.PI / 2; break;
      }
      case 'sweep': { e.vx = e.dir * 330; e.vy = Math.sin(t * 2.2) * 120 + 40; e.rot = Math.atan2(e.vy, e.vx) - Math.PI / 2; break; }
      case 'sine': { e.vy = e.speed; e.x = e.base + Math.sin(t * 2.4) * e.amp; e.vx = 0; break; }
      case 'loop': {
        // Entra en picado, hace un rizo y sale hacia arriba
        if (t < 1.0) { e.vx = 0; e.vy = 320; }
        else if (t < 2.8) { const a = (t - 1.0) / 1.8 * TAU; e.vx = Math.cos(a) * 260 * e.side; e.vy = Math.sin(a + Math.PI / 2) * 260; }
        else { e.vx = 0; e.vy = 360; }
        e.rot = Math.atan2(e.vy, e.vx) - Math.PI / 2; break;
      }
      case 'hover': {
        if (e.y < e.stopY && t < 5) e.vy = 120; else if (t < 6.5) e.vy = 0; else e.vy = 90;
        e.vx = Math.sin(t) * 40; break;
      }
      case 'carrier': { e.vy = e.y < 230 ? 60 : (t > 12 ? 50 : 0); e.vx = Math.sin(t * 0.5) * 50; break; }
      case 'drift': { e.rot += (e.spin || 0) * dt; break; }
      case 'homing': {
        const a = Math.atan2(G.player.y - e.y, G.player.x - e.x);
        const cur = Math.atan2(e.vy || 1, e.vx || 0);
        let d = a - cur; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
        const na = t < 2.2 ? cur + clamp(d, -2.2 * dt, 2.2 * dt) : cur;
        e.vx = Math.cos(na) * e.speed; e.vy = Math.sin(na) * e.speed; e.rot = na - Math.PI / 2; break;
      }
    }
    e.x += e.vx * dt; e.y += e.vy * dt;

    // Disparo enemigo
    if (e.y > 20 && e.y < G.H * 0.75 && G.player.dead <= 0) {
      e.fireT -= dt;
      if (e.fireT <= 0) {
        const diff = G.difficulty;
        switch (e.type) {
          case 'dart': if (Math.random() < 0.25 + diff * 0.08) G.shot(e.x, e.y + 10, ...vel(G.aim(e.x, e.y), 230 + diff * 15), 'bRed'); e.fireT = 99; break;
          case 'weaver': if (Math.random() < 0.3) G.shot(e.x, e.y, ...vel(G.aim(e.x, e.y), 210 + diff * 15), 'bViolet'); e.fireT = rand(1.5, 2.8); break;
          case 'gunship': G.fan(e.x, e.y + 20, G.aim(e.x, e.y), 3 + Math.min(2, diff - 1), 0.2, 220 + diff * 10, 'bOrange'); e.fireT = rand(1.1, 1.7) / (0.8 + diff * 0.2); break;
          case 'carrier': G.ring(e.x, e.y, 10 + diff * 2, 150, e.t, 'bRed'); G.fan(e.x - 40, e.y, G.aim(e.x, e.y), 3, 0.15, 240, 'bViolet'); G.fan(e.x + 40, e.y, G.aim(e.x, e.y), 3, 0.15, 240, 'bViolet'); e.fireT = 1.8; break;
          case 'crystal': e.fireT = 99; break;
          default: e.fireT = 99;
        }
      }
    }
  }
  const vel = (a, s) => [Math.cos(a) * s, Math.sin(a) * s];

  /* ----------------------------- Partículas ---------------------------- */
  function particle(x, y, vx, vy, life, size, color) {
    if (G.particles.length > 900) return;
    G.particles.push({ x, y, vx, vy, life, max: life, size, key: 'spark' + color });
  }
  function explosion(x, y, size = 1, color = '#ff4a6a') {
    const n = Math.round(14 * size);
    for (let i = 0; i < n; i++) { const a = rand(0, TAU), s = rand(40, 260) * Math.sqrt(size); particle(x, y, Math.cos(a) * s, Math.sin(a) * s, rand(0.3, 0.8), rand(0.6, 1.4) * Math.sqrt(size), i % 3 ? color : '#ffb347'); }
    for (let i = 0; i < 4 * size; i++) particle(x + rand(-10, 10) * size, y + rand(-10, 10) * size, rand(-30, 30), rand(-30, 30), rand(0.4, 0.7), 2.4 * Math.sqrt(size), '#ffffff');
    G.shockwaves = G.shockwaves || [];
    G.shockwaves.push({ x, y, r: 6, max: 40 + 50 * size, life: 0.45, t: 0, color });
  }
  function floatText(x, y, txt, color = '#fff') { G.texts.push({ x, y, txt, color, life: 1 }); }

  /* ------------------------------ Disparos ----------------------------- */
  function firePlayer(p) {
    const lv = p.power, add = (x, y, vx, vy, spr = 'pShot', dmg = 10) => G.pBullets.push({ x, y, vx, vy, spr, dmg, r: 7 });
    add(p.x - 9, p.y - 34, 0, -1250); add(p.x + 9, p.y - 34, 0, -1250);
    if (lv >= 2) { add(p.x - 24, p.y - 14, -160, -1150, 'pWave', 8); add(p.x + 24, p.y - 14, 160, -1150, 'pWave', 8); }
    if (lv >= 3) add(p.x, p.y - 40, 0, -1300, 'pShot2', 14);
    if (lv >= 4) { add(p.x - 30, p.y - 6, -340, -1050, 'pWave', 8); add(p.x + 30, p.y - 6, 340, -1050, 'pWave', 8); }
    if (lv >= 5) { add(p.x - 18, p.y - 30, -60, -1300, 'pShot2', 14); add(p.x + 18, p.y - 30, 60, -1300, 'pShot2', 14); }
    for (let i = 0; i < p.drones; i++) {
      const d = dronePos(p, i);
      let tx = 0, best = 1e9; // los drones apuntan al enemigo más cercano
      for (const e of G.enemies) { const dd = (e.x - d.x) ** 2 + (e.y - d.y) ** 2; if (e.y < d.y && dd < best) { best = dd; tx = Math.atan2(e.y - d.y, e.x - d.x); } }
      const a = best < 1e9 ? tx : -Math.PI / 2;
      add(d.x, d.y, Math.cos(a) * 1000, Math.sin(a) * 1000, 'dShot', 7);
    }
    A.sfx.shoot();
  }
  const dronePos = (p, i) => { const s = i === 0 ? -1 : 1; return { x: p.x + s * 46 + Math.sin(G.time * 3 + i) * 4, y: p.y + 14 + Math.cos(G.time * 3 + i) * 4 }; };

  /* --------------------------- Daño y botín ---------------------------- */
  function killEnemy(e) {
    e.dead = true;
    G.score += e.score;
    const big = e.type === 'carrier' ? 3 : e.type === 'gunship' ? 1.8 : e.type === 'rock' ? 1.4 : 1;
    const col = e.type === 'weaver' ? '#c46bff' : e.type === 'crystal' ? '#4fd8ff' : e.type === 'gunship' ? '#ffb347' : e.type === 'mine' ? '#ffe066' : '#ff4a6a';
    explosion(e.x, e.y, big, col);
    if (big > 1.5) { G.shake = Math.max(G.shake, 8); A.sfx.bigExplode(); } else A.sfx.explode();
    if (e.type === 'rock') for (let i = 0; i < 3; i++) spawnEnemy('rockS', e.x, e.y, { ai: 'drift', vx: rand(-120, 120), vy: rand(60, 180) });
    if (e.type === 'mine') G.ring(e.x, e.y, 10, 150, rand(0, 1), 'bOrange');
    if (e.type === 'crystal') G.ring(e.x, e.y, 8, 170, rand(0, 1), 'bCyan');
    if (e.drop) dropItem(e.x, e.y, e.drop);
    else if (e.group) {
      const g = groups.get(e.group); g.killed++;
      if (g.killed === g.n) { dropItem(e.x, e.y, g.drop); floatText(e.x, e.y - 30, '¡ESCUADRÓN!', '#ffe066'); G.score += 1000; }
    } else if (Math.random() < 0.035) dropItem(e.x, e.y, ['P', 'S', 'B'][Math.floor(Math.random() * 3)]);
    else if (Math.random() < 0.12) dropItem(e.x, e.y, 'M');
  }
  function dropItem(x, y, kind) { G.items.push({ x, y, kind, vy: 70, t: 0 }); }
  function collect(it) {
    const p = G.player; A.sfx.power();
    switch (it.kind) {
      case 'P': if (p.power < 5) { p.power++; floatText(it.x, it.y, 'POTENCIA ' + p.power, '#4fd8ff'); } else { G.score += 2000; floatText(it.x, it.y, '+2000', '#4fd8ff'); } break;
      case 'S': p.shield = p.maxShield; floatText(it.x, it.y, 'ESCUDO', '#9dff6a'); break;
      case 'B': p.bombs = Math.min(5, p.bombs + 1); floatText(it.x, it.y, '+PULSO', '#ffb347'); break;
      case 'D': if (p.drones < 2) { p.drones++; floatText(it.x, it.y, 'DRON', '#e86bff'); } else { G.score += 2000; floatText(it.x, it.y, '+2000', '#e86bff'); } break;
      case 'M': G.score += 500; floatText(it.x, it.y, '+500', '#ffe066'); break;
    }
  }

  function hurtPlayer() {
    const p = G.player;
    if (p.inv > 0 || p.phaseT > 0 || p.dead > 0) return;
    A.sfx.hurt(); vibrate(60);
    G.shake = 10; G.flash = 0.35;
    if (p.shield > 1) { p.shield--; p.inv = 1.4; explosion(p.x, p.y, 0.6, '#4fd8ff'); return; }
    // Pierde una vida
    p.lives--; explosion(p.x, p.y, 2.5, '#4fd8ff'); A.sfx.bigExplode(); vibrate(200);
    G.eBullets.length = 0;
    if (p.lives <= 0) { p.dead = 99; gameOver(); return; }
    p.dead = 1.4; p.power = Math.max(1, p.power - 1); p.drones = Math.max(0, p.drones - 1); p.shield = p.maxShield; p.bombs = Math.max(p.bombs, 2);
  }
  const vibrate = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { } };

  function usePulse() {
    const p = G.player;
    if (G.mode !== 'play' || G.paused || p.bombs <= 0 || p.dead > 0) return;
    p.bombs--; A.sfx.bomb(); vibrate(120);
    G.flash = 0.8; G.shake = 16; p.inv = Math.max(p.inv, 1.5);
    for (const b of G.eBullets) particle(b.x, b.y, 0, -60, 0.4, 0.7, '#ffb347');
    G.eBullets.length = 0;
    G.pulseWave = { r: 0, t: 0, x: p.x, y: p.y };
    for (const e of G.enemies) { e.hp -= 60; e.flash = 0.2; if (e.hp <= 0 && !e.dead) killEnemy(e); }
    if (G.boss && !G.boss.entering) damageBoss({ x: G.boss.x, y: G.boss.y, part: null }, 60);
  }
  function usePhase() {
    const p = G.player;
    if (G.mode !== 'play' || G.paused || p.phaseCd > 0 || p.dead > 0) return;
    p.phaseT = 0.7; p.phaseCd = 2.6; A.sfx.phase(); vibrate(30);
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; particle(p.x, p.y, Math.cos(a) * 200, Math.sin(a) * 200, 0.4, 1, '#4fd8ff'); }
  }

  function damageBoss(hb, dmg) {
    const b = G.boss;
    if (!b || b.dead) return;
    if (hb.part) {
      hb.part.hp -= dmg;
      if (hb.part.hp <= 0 && hb.part.alive) { hb.part.alive = false; explosion(hb.x, hb.y, 2, '#ffb347'); A.sfx.bigExplode(); G.score += 2500; G.shake = 8; b.hp -= b.maxHp * 0.06; }
      b.hp -= dmg * 0.25;
    } else b.hp -= dmg * (hb.armor !== undefined ? hb.armor : 1);
    b.flash = 0.06;
    if (b.hp <= 0) bossDefeated();
  }

  /* ---------------------------- Actualización ---------------------------- */
  const input = { keys: {}, dx: 0, dy: 0, pointer: null };

  function update(dt) {
    G.dt = dt; G.time += dt;
    G.bg.update(dt, G.boss ? 0.6 : 1);
    const p = G.player;

    // Partículas siempre se animan
    for (const q of G.particles) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.96; q.vy *= 0.96; q.life -= dt; }
    G.particles = G.particles.filter(q => q.life > 0);
    if (G.shockwaves) { for (const s of G.shockwaves) s.t += dt; G.shockwaves = G.shockwaves.filter(s => s.t < s.life); }
    for (const t of G.texts) { t.y -= 50 * dt; t.life -= dt * 0.8; }
    G.texts = G.texts.filter(t => t.life > 0);
    G.shake = Math.max(0, G.shake - dt * 30); G.flash = Math.max(0, G.flash - dt * 1.6);
    if (G.pulseWave) { G.pulseWave.t += dt; G.pulseWave.r += 1600 * dt; if (G.pulseWave.t > 0.8) G.pulseWave = null; }
    if (G.banner) { G.banner.t += dt; if (G.banner.t > G.banner.dur) G.banner = null; }

    if (G.mode !== 'play' || !p) return;

    /* --- Movimiento del jugador --- */
    if (p.dead > 0) {
      p.dead -= dt;
      if (p.dead <= 0) { p.x = G.W / 2; p.y = G.H - 160; p.inv = 2.5; }
    } else {
      let mx = 0, my = 0;
      const k = input.keys;
      if (k.ArrowLeft || k.KeyA) mx -= 1; if (k.ArrowRight || k.KeyD) mx += 1;
      if (k.ArrowUp || k.KeyW) my -= 1; if (k.ArrowDown || k.KeyS) my += 1;
      const ox = p.x;
      p.x += mx * 460 * dt + input.dx; p.y += my * 460 * dt + input.dy;
      input.dx = 0; input.dy = 0;
      p.x = clamp(p.x, 28, G.W - 28); p.y = clamp(p.y, 60, G.H - 44);
      p.tilt += (clamp((p.x - ox) / Math.max(dt, 0.001) / 900, -1, 1) - p.tilt) * Math.min(1, dt * 10);
      p.fireT -= dt;
      if (p.fireT <= 0) { firePlayer(p); p.fireT = 0.1; }
      for (let i = 0; i < 2; i++) particle(p.x + (i ? 6 : -6), p.y + 38, rand(-15, 15), rand(160, 260), 0.18, 0.5, '#4fd8ff');
    }
    p.inv = Math.max(0, p.inv - dt); p.phaseT = Math.max(0, p.phaseT - dt); p.phaseCd = Math.max(0, p.phaseCd - dt);

    /* --- Guion del nivel --- */
    if (G.phaseState === 'level') {
      G.levelT += dt;
      G.bg.progress = clamp(G.levelT / G.chapter.duration, 0, 1);
      G.waveT -= dt;
      if (G.waveT <= 0 && G.levelT < G.chapter.duration - 3) {
        const set = WAVE_SETS[G.chapter.theme];
        let f = set[Math.floor(Math.random() * set.length)];
        if (f === 'carrier' && G.levelT < 25) f = 'sweep';
        if (f === 'carrier' && G.enemies.some(e => e.type === 'carrier')) f = 'line';
        FORMATIONS[f]();
        G.waveT = Math.max(1.2, 2.6 - G.difficulty * 0.18 - G.levelT / G.chapter.duration * 0.6) + (f === 'carrier' ? 3 : 0);
        // Mejora garantizada a intervalos para que la progresión sea justa
        if (G.levelT - G.lastFreeDrop > 22) { G.lastFreeDrop = G.levelT; dropItem(rand(100, G.W - 100), -20, p.power < 5 ? 'P' : 'S'); }
      }
      // Comunicaciones de radio
      while (G.commIdx < G.chapter.comms.length && G.chapter.comms[G.commIdx].t <= G.levelT) showComm(G.chapter.comms[G.commIdx++]);
      if (G.levelT >= G.chapter.duration && G.enemies.length === 0) { G.phaseState = 'warning'; startBossSequence(); }
      if (G.levelT >= G.chapter.duration + 8) { for (const e of G.enemies) e.vy += 200; }
    }

    /* --- Enemigos --- */
    for (const e of G.enemies) {
      enemyAI(e, dt);
      e.flash = Math.max(0, e.flash - dt);
      if (e.t > 1 && (e.y > G.H + 90 || e.y < -260 || e.x < -200 || e.x > G.W + 200)) e.gone = true;
      if (p.dead <= 0 && !e.dead && dist2(e, p) < (e.r + p.r + 6) ** 2) { hurtPlayer(); if (e.type !== 'carrier') { e.hp -= 50; if (e.hp <= 0) killEnemy(e); } }
    }
    for (const e of G.enemies) if ((e.gone || e.dead) && e.group && !e.dead && groups.has(e.group)) groups.get(e.group).n = -1;
    G.enemies = G.enemies.filter(e => !e.dead && !e.gone);

    /* --- Jefe --- */
    const b = G.boss;
    if (b && !b.dead) {
      b.update(dt); b.flash = Math.max(0, b.flash - dt);
      if (p.dead <= 0) {
        for (const hb of b.hitboxes()) if (dist2(hb, p) < (hb.r * 0.8 + p.r) ** 2) hurtPlayer();
        if (b.bodyHitboxes) for (const hb of b.bodyHitboxes()) if (dist2(hb, p) < (hb.r + p.r) ** 2) hurtPlayer();
      }
    }

    /* --- Balas del jugador --- */
    for (const s of G.pBullets) {
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.y < -40 || s.x < -40 || s.x > G.W + 40) { s.dead = true; continue; }
      for (const e of G.enemies) {
        if (e.dead || e.y < -10) continue;
        if (dist2(s, e) < (e.r + s.r) ** 2) {
          e.hp -= s.dmg; e.flash = 0.06; s.dead = true; A.sfx.hit();
          particle(s.x, s.y, rand(-80, 80), rand(-40, 60), 0.2, 0.6, '#ffffff');
          if (e.hp <= 0) killEnemy(e);
          break;
        }
      }
      if (!s.dead && b && !b.dead && !b.entering) {
        if (b.shields) for (const sh of b.shields()) if (dist2(s, sh) < (sh.r + s.r) ** 2) { s.dead = true; particle(s.x, s.y, 0, 60, 0.2, 0.7, '#c46bff'); break; }
        if (!s.dead) for (const hb of b.hitboxes()) {
          if (dist2(s, hb) < (hb.r + s.r) ** 2) { s.dead = true; damageBoss(hb, s.dmg); particle(s.x, s.y, rand(-80, 80), rand(-20, 80), 0.2, 0.6, '#ffffff'); A.sfx.hit(); G.score += 5; break; }
        }
        if (!s.dead && b.bodyHitboxes) for (const hb of b.bodyHitboxes()) if (dist2(s, hb) < (hb.r + s.r) ** 2) { s.dead = true; particle(s.x, s.y, 0, 60, 0.15, 0.6, '#4fd8ff'); break; }
      }
    }
    G.pBullets = G.pBullets.filter(s => !s.dead);

    /* --- Balas enemigas --- */
    const pr = p.r;
    for (const s of G.eBullets) {
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.y < -60 || s.y > G.H + 60 || s.x < -60 || s.x > G.W + 60) { s.dead = true; continue; }
      if (p.dead <= 0 && dist2(s, p) < (s.r * 0.75 + pr) ** 2) {
        if (p.phaseT > 0 || p.inv > 0) { if (p.phaseT > 0) { s.dead = true; G.score += 10; } }
        else { s.dead = true; hurtPlayer(); }
      }
    }
    G.eBullets = G.eBullets.filter(s => !s.dead);

    /* --- Objetos --- */
    for (const it of G.items) {
      it.t += dt; it.y += it.vy * dt; it.x += Math.sin(it.t * 2) * 30 * dt;
      // Imán suave hacia la nave
      const d = Math.sqrt(dist2(it, p));
      if (d < 140 && p.dead <= 0) { it.x += (p.x - it.x) * dt * 4; it.y += (p.y - it.y) * dt * 4; }
      if (d < 34 && p.dead <= 0) { it.got = true; collect(it); }
      if (it.y > G.H + 40) it.got = true;
    }
    G.items = G.items.filter(i => !i.got);
  }
  const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

  /* ------------------------------ Dibujado ------------------------------ */
  function draw() {
    ctx.setTransform(G.R, 0, 0, G.R, 0, 0);
    if (G.shake > 0) ctx.translate(rand(-G.shake, G.shake) * 0.6, rand(-G.shake, G.shake) * 0.6);
    G.bg.draw(ctx);
    if (G.mode === 'menu') { drawMenuShip(); return; }

    // Objetos
    for (const it of G.items) Sprites.draw(ctx, 'pw' + it.kind, it.x, it.y, 0, 1 + Math.sin(it.t * 6) * 0.06);
    // Enemigos
    for (const e of G.enemies) {
      Sprites.draw(ctx, e.spr, e.x, e.y, e.rot || 0);
      if (e.flash > 0) { ctx.globalCompositeOperation = 'lighter'; Sprites.draw(ctx, e.spr, e.x, e.y, e.rot || 0, 1, 0.7); ctx.globalCompositeOperation = 'source-over'; }
      if (e.type === 'carrier' && e.hp < e.maxHp) drawBar(e.x - 50, e.y - 62, 100, 5, e.hp / e.maxHp, '#ff5c8a');
    }
    // Jefe
    const b = G.boss;
    if (b && !b.dead) {
      b.draw(ctx);
      if (b.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(0, 0, G.W, G.H); }
    }
    // Jugador
    const p = G.player;
    if (p && p.dead <= 0 && (p.inv <= 0 || Math.floor(G.time * 20) % 2 === 0)) {
      const ph = p.phaseT > 0;
      for (let i = 0; i < p.drones; i++) { const d = dronePos(p, i); Sprites.draw(ctx, 'drone', d.x, d.y, G.time * 3); }
      const fl = 0.9 + Math.random() * 0.25;
      Sprites.draw(ctx, 'flame', p.x - 6, p.y + 44, 0, fl); Sprites.draw(ctx, 'flame', p.x + 6, p.y + 44, 0, fl);
      ctx.save(); ctx.translate(p.x, p.y);
      ctx.scale(1 - Math.abs(p.tilt) * 0.18, 1);
      if (ph) { ctx.globalAlpha = 0.45; ctx.scale(1 + Math.sin(p.phaseT * 30) * 0.08, 1); }
      Sprites.draw(ctx, 'player', 0, 0);
      ctx.restore();
      if (ph) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(79,216,255,${p.phaseT})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(p.x, p.y, 56 - p.phaseT * 20, 0, TAU); ctx.stroke(); ctx.restore();
      }
      // Núcleo (zona de impacto real)
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y - 2, 3.5, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,80,120,0.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y - 2, 6, 0, TAU); ctx.stroke();
    }
    // Balas del jugador y partículas (aditivas)
    ctx.globalCompositeOperation = 'lighter';
    for (const s of G.pBullets) Sprites.draw(ctx, s.spr, s.x, s.y, s.vx ? Math.atan2(s.vy, s.vx) + Math.PI / 2 : 0);
    for (const q of G.particles) Sprites.draw(ctx, q.key, q.x, q.y, 0, q.size * (q.life / q.max), Math.min(1, q.life / q.max * 1.5));
    if (G.shockwaves) for (const s of G.shockwaves) {
      const k = s.t / s.life; ctx.strokeStyle = s.color; ctx.globalAlpha = 1 - k; ctx.lineWidth = 4 * (1 - k) + 1;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r + (s.max - s.r) * k, 0, TAU); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (G.pulseWave) {
      const w = G.pulseWave; ctx.strokeStyle = `rgba(255,179,71,${1 - w.t / 0.8})`; ctx.lineWidth = 30 * (1 - w.t / 0.8) + 4;
      ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, TAU); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    // Balas enemigas por encima de todo para que siempre se lean
    for (const s of G.eBullets) Sprites.draw(ctx, s.k, s.x, s.y);
    // Textos flotantes
    ctx.textAlign = 'center'; ctx.font = '800 20px system-ui, sans-serif';
    for (const t of G.texts) { ctx.globalAlpha = Math.min(1, t.life * 2); ctx.fillStyle = t.color; ctx.fillText(t.txt, t.x, t.y); }
    ctx.globalAlpha = 1;
    if (G.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${G.flash * 0.5})`; ctx.fillRect(-20, -20, G.W + 40, G.H + 40); }
    drawHUD();
  }

  function drawBar(x, y, w, h, f, color) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color; ctx.fillRect(x, y, w * clamp(f, 0, 1), h);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
  }

  function drawHUD() {
    const p = G.player; if (!p) return;
    const top = 18 + (G.safeTop || 0);
    ctx.textBaseline = 'top';
    ctx.font = '800 26px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#e8f4ff';
    ctx.shadowColor = '#4fd8ff'; ctx.shadowBlur = 8 * G.R;
    ctx.fillText(String(G.score).padStart(8, '0'), 20, top);
    ctx.shadowBlur = 0;
    ctx.font = '600 14px system-ui, sans-serif'; ctx.fillStyle = 'rgba(232,244,255,0.6)';
    ctx.fillText('CAP. ' + G.chapter.id + ' · ' + G.chapter.title, 20, top + 32);
    // Vidas
    for (let i = 0; i < p.lives; i++) Sprites.draw(ctx, 'player', 34 + i * 34, top + 74, 0, 0.36);
    // Escudo
    ctx.fillStyle = 'rgba(232,244,255,0.6)'; ctx.font = '700 12px system-ui, sans-serif'; ctx.fillText('ESCUDO', 20, top + 96);
    for (let i = 0; i < p.maxShield; i++) {
      ctx.fillStyle = i < p.shield ? '#9dff6a' : 'rgba(157,255,106,0.15)';
      ctx.fillRect(80 + i * 26, top + 97, 22, 10);
    }
    // Potencia
    ctx.fillStyle = 'rgba(232,244,255,0.6)'; ctx.fillText('POTENCIA', 20, top + 114);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = i < p.power ? '#4fd8ff' : 'rgba(79,216,255,0.15)'; ctx.fillRect(92 + i * 16, top + 115, 12, 10); }
    // Barra del jefe
    const b = G.boss;
    if (b && !b.dead) {
      const y = top + 140;
      ctx.textAlign = 'center'; ctx.font = '800 14px system-ui, sans-serif'; ctx.fillStyle = '#ffd0da';
      ctx.fillText(b.name, G.W / 2, y);
      drawBar(60, y + 20, G.W - 120, 10, b.hp / b.maxHp, '#ff2a5a');
    }
    // Progreso del nivel
    if (G.phaseState === 'level') {
      const f = clamp(G.levelT / G.chapter.duration, 0, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(G.W - 10, 120, 4, G.H - 300);
      ctx.fillStyle = '#ffb347'; ctx.fillRect(G.W - 10, 120 + (G.H - 300) * (1 - f), 4, (G.H - 300) * f);
    }
    // Banner (¡ALERTA!)
    if (G.banner) {
      const bn = G.banner, a = Math.min(1, bn.t * 3, (bn.dur - bn.t) * 3);
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(80,0,20,0.55)'; ctx.fillRect(0, G.H * 0.42, G.W, 110);
      ctx.fillStyle = bn.color; ctx.font = '900 52px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.shadowColor = bn.color; ctx.shadowBlur = 20 * G.R;
      ctx.fillText(bn.text, G.W / 2, G.H * 0.42 + 14);
      ctx.shadowBlur = 0; ctx.font = '700 16px system-ui, sans-serif'; ctx.fillStyle = '#fff';
      ctx.fillText(bn.sub || '', G.W / 2, G.H * 0.42 + 76);
      ctx.globalAlpha = 1;
    }
    ctx.textBaseline = 'alphabetic';
    updateControlsUI();
  }

  let menuT = 0;
  function drawMenuShip() {
    menuT += G.dt || 0.016;
    Sprites.draw(ctx, 'flame', G.W / 2 - 6, G.H * 0.8 + 44 + Math.sin(menuT * 2) * 8, 0, 1.2);
    Sprites.draw(ctx, 'flame', G.W / 2 + 6, G.H * 0.8 + 44 + Math.sin(menuT * 2) * 8, 0, 1.2);
    Sprites.draw(ctx, 'player', G.W / 2, G.H * 0.8 + Math.sin(menuT * 2) * 8, 0, 1.4);
  }

  /* ---------------------------- Controles UI --------------------------- */
  let lastBombs = -1, lastCd = -1;
  function updateControlsUI() {
    const p = G.player; if (!p) return;
    if (p.bombs !== lastBombs) { $('bombCount').textContent = p.bombs; lastBombs = p.bombs; }
    const cd = Math.round(p.phaseCd / 2.6 * 50);
    if (cd !== lastCd) { $('phaseRing').style.strokeDashoffset = (276.5 * cd / 50).toFixed(1); lastCd = cd; }
  }

  /* ------------------------------ Entrada ------------------------------ */
  canvas.addEventListener('pointerdown', e => { A.init(); input.pointer = { id: e.pointerId, x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (!input.pointer || input.pointer.id !== e.pointerId) return;
    const k = 1.25 / G.cssScale; // sensibilidad: el dedo nunca tapa la nave
    input.dx += (e.clientX - input.pointer.x) * k; input.dy += (e.clientY - input.pointer.y) * k;
    input.pointer.x = e.clientX; input.pointer.y = e.clientY;
  });
  const endPointer = e => { if (input.pointer && input.pointer.id === e.pointerId) input.pointer = null; };
  canvas.addEventListener('pointerup', endPointer); canvas.addEventListener('pointercancel', endPointer);
  window.addEventListener('keydown', e => {
    input.keys[e.code] = true;
    if (e.code === 'KeyZ' || e.code === 'ShiftLeft') usePhase();
    if (e.code === 'KeyX' || e.code === 'KeyB') usePulse();
    if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
  });
  window.addEventListener('keyup', e => { input.keys[e.code] = false; });
  const tap = (el, fn) => el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); A.init(); fn(); });
  tap($('btnBomb'), usePulse); tap($('btnPhase'), usePhase); tap($('btnPause'), () => togglePause());

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (G.mode === 'play' && !G.paused) togglePause(true); A.suspend(); }
    else A.resume();
  });

  /* ---------------------------- Pantallas UI --------------------------- */
  const screens = ['title', 'chapters', 'story', 'card', 'pause', 'gameover'];
  function show(id) { for (const s of screens) $(s).classList.toggle('show', s === id); }
  function hideAll() { show(null); }

  function setSoundLabels() { $('btnSound').textContent = $('btnSound2').textContent = 'SONIDO: ' + (save.sound ? 'SÍ' : 'NO'); A.setEnabled(save.sound); }
  function toggleSound() { save.sound = !save.sound; persist(); setSoundLabels(); A.select(); }
  A.select = () => A.sfx.select();

  function togglePause(force) {
    if (G.mode !== 'play') return;
    G.paused = force === true ? true : !G.paused;
    if (G.paused) show('pause'); else { hideAll(); }
  }

  /* Diapositivas de historia */
  function storySlides(slides) {
    return new Promise(resolve => {
      let i = 0, typing = null, full = '';
      const el = $('story'), tEl = $('storyText');
      show('story');
      const render = () => {
        const s = slides[i]; $('storyTitle').textContent = s.title; full = s.text; tEl.textContent = '';
        let n = 0; clearInterval(typing);
        typing = setInterval(() => { n += 2; tEl.textContent = full.slice(0, n); if (n % 6 === 0) A.sfx.blip(); if (n >= full.length) { clearInterval(typing); typing = null; } }, 28);
      };
      const next = () => {
        if (typing) { clearInterval(typing); typing = null; tEl.textContent = full; return; }
        i++; if (i >= slides.length) return done();
        render();
      };
      const done = () => { clearInterval(typing); el.removeEventListener('pointerdown', onTap); $('storySkip').removeEventListener('pointerdown', onSkip); hideAll(); resolve(); };
      const onTap = e => { if (e.target.id === 'storySkip') return; A.init(); next(); };
      const onSkip = e => { e.stopPropagation(); done(); };
      el.addEventListener('pointerdown', onTap); $('storySkip').addEventListener('pointerdown', onSkip);
      render();
    });
  }

  /* Diálogo con retratos */
  function dialog(lines) {
    if (!lines || !lines.length) return Promise.resolve();
    return new Promise(resolve => {
      const prevMode = G.mode;
      G.mode = 'dialog';
      $('controls').classList.remove('show');
      const el = $('dialog'), tEl = $('dlgText');
      el.classList.add('show');
      let i = 0, typing = null, full = '';
      const render = () => {
        const l = lines[i], c = CHARACTERS[l.who];
        $('dlgName').textContent = c.name; $('dlgName').style.color = c.color;
        $('dlgRole').textContent = c.role;
        const pEl = $('dlgPortrait'); pEl.style.setProperty('--pc', c.color); pEl.querySelector('span').textContent = c.initial;
        full = l.text; tEl.textContent = ''; let n = 0;
        clearInterval(typing);
        typing = setInterval(() => { n += 2; tEl.textContent = full.slice(0, n); if (n % 8 === 0) A.sfx.blip(); if (n >= full.length) { clearInterval(typing); typing = null; } }, 22);
      };
      const next = () => {
        if (typing) { clearInterval(typing); typing = null; tEl.textContent = full; return; }
        i++; if (i >= lines.length) return done();
        render();
      };
      const done = () => {
        clearInterval(typing); el.classList.remove('show');
        el.removeEventListener('pointerdown', onTap); $('dlgSkip').removeEventListener('pointerdown', onSkip);
        G.mode = prevMode === 'dialog' ? 'play' : prevMode;
        resolve();
      };
      const onTap = e => { if (e.target.id === 'dlgSkip') return; A.init(); next(); };
      const onSkip = e => { e.stopPropagation(); done(); };
      el.addEventListener('pointerdown', onTap); $('dlgSkip').addEventListener('pointerdown', onSkip);
      render();
    });
  }

  /* Radio en vuelo */
  const commQueue = []; let commBusy = false;
  function showComm(line) { commQueue.push(line); if (!commBusy) nextComm(); }
  async function nextComm() {
    const line = commQueue.shift(); if (!line) { commBusy = false; return; }
    commBusy = true;
    const c = CHARACTERS[line.who], el = $('comm');
    $('commName').textContent = c.name; $('commName').style.color = c.color;
    $('commText').textContent = line.text; el.style.borderLeftColor = c.color;
    const pEl = $('commPortrait'); pEl.style.setProperty('--pc', c.color); pEl.querySelector('span').textContent = c.initial;
    el.classList.add('show'); A.sfx.blip();
    await sleep(Math.max(3200, line.text.length * 55));
    el.classList.remove('show');
    await sleep(350);
    nextComm();
  }
  function clearComms() { commQueue.length = 0; $('comm').classList.remove('show'); }

  /* --------------------------- Flujo de juego --------------------------- */
  let runId = 0;

  function resetField() {
    G.enemies = []; G.eBullets = []; G.pBullets = []; G.items = []; G.particles = []; G.texts = []; G.shockwaves = [];
    G.boss = null; G.banner = null; G.pulseWave = null; groups.clear();
  }

  async function startChapter(idx, keepPlayer) {
    const id = ++runId;
    G.chapterIdx = idx; G.chapter = CHAPTERS[idx]; G.difficulty = 1 + idx * 0.5;
    resetField();
    if (!keepPlayer || !G.player) G.player = newPlayer();
    else { const p = G.player; p.x = G.W / 2; p.y = G.H - 200; p.inv = 2; p.dead = 0; p.lives = Math.max(p.lives, 3); p.shield = p.maxShield; p.bombs = Math.max(p.bombs, 3); }
    G.chapterStartScore = G.score;
    G.bg = Backgrounds.create(G.chapter.theme, G.W, G.H, G.R);
    G.levelT = 0; G.waveT = 3; G.commIdx = 0; G.lastFreeDrop = 0; G.phaseState = 'level';
    G.mode = 'dialog'; G.paused = false;
    A.music(G.chapter.theme);

    // Tarjeta de capítulo
    $('cardNum').textContent = 'CAPÍTULO ' + G.chapter.id;
    $('cardTitle').textContent = G.chapter.title;
    $('cardPlace').textContent = G.chapter.place;
    show('card');
    await sleep(2600);
    if (id !== runId) return;
    hideAll();
    await dialog(G.chapter.intro);
    if (id !== runId) return;
    G.mode = 'play';
    $('controls').classList.add('show');
  }

  async function startBossSequence() {
    const id = runId;
    clearComms();
    G.banner = { text: '¡ALERTA!', sub: G.chapter.boss.name, t: 0, dur: 2.8, color: '#ff2a5a' };
    A.sfx.alarm(); A.music('boss');
    await sleep(2900);
    if (id !== runId) return;
    await dialog(G.chapter.boss.intro);
    if (id !== runId) return;
    $('controls').classList.add('show');
    G.boss = Bosses.create(G, G.chapter.boss);
    G.phaseState = 'boss';
  }

  async function bossDefeated() {
    const b = G.boss; if (b.dead) return;
    b.dead = true; const id = runId;
    G.score += 20000 * G.chapter.id;
    G.eBullets.length = 0; G.phaseState = 'cleared';
    // Cadena de explosiones
    for (let i = 0; i < 12; i++) {
      setTimeout(() => { if (id !== runId) return; explosion(b.x + rand(-120, 120), b.y + rand(-80, 80), rand(1.5, 3), i % 2 ? '#ffb347' : '#ff4a6a'); A.sfx.explode(); G.shake = 12; }, i * 140);
    }
    setTimeout(() => { if (id !== runId) return; explosion(b.x, b.y, 6, '#ffffff'); A.sfx.bigExplode(); G.flash = 1; G.shake = 24; vibrate(300); }, 1800);
    G.player.inv = 99;
    await sleep(3400);
    if (id !== runId) return;
    G.boss = null;
    for (const e of G.enemies) killEnemy(e);
    G.enemies = [];
    floatText(G.W / 2, G.H * 0.45, '+' + (20000 * G.chapter.id), '#ffe066');
    await sleep(1200);
    if (id !== runId) return;
    $('controls').classList.remove('show');
    await dialog(G.chapter.outro);
    if (id !== runId) return;
    G.player.inv = 0;
    save.hiscore = Math.max(save.hiscore, G.score);
    const next = G.chapterIdx + 1;
    save.unlocked = Math.max(save.unlocked, Math.min(CHAPTERS.length, next + 1));
    persist();
    if (next < CHAPTERS.length) startChapter(next, true);
    else ending();
  }

  async function ending() {
    G.mode = 'menu'; $('controls').classList.remove('show');
    G.chapter = null; G.bg = Backgrounds.create('title', G.W, G.H, G.R);
    A.music('ending');
    await storySlides(ENDING);
    save.hiscore = Math.max(save.hiscore, G.score); persist();
    toTitle();
  }

  const QUOTES = [
    '«Somos cuatro o no somos ninguno.» — Lía',
    '«Lo valiente es tener miedo y seguir juntos.» — Darío',
    '«Yo no salgo en tus mapas.» — Teo',
    '«Las paredes tienen grietas.» — Darío',
    '«Cada error es solo un cálculo más.» — Nora',
  ];
  function gameOver() {
    const id = runId;
    clearComms();
    setTimeout(() => {
      if (id !== runId) return;
      G.mode = 'over'; $('controls').classList.remove('show');
      $('goQuote').textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      save.hiscore = Math.max(save.hiscore, G.score); persist();
      show('gameover');
    }, 1600);
  }

  function toTitle() {
    runId++; clearComms();
    G.mode = 'menu'; G.chapter = null; G.player = null; G.paused = false; resetField();
    $('controls').classList.remove('show'); $('dialog').classList.remove('show');
    G.bg = Backgrounds.create('title', G.W, G.H, G.R);
    $('hiscore').textContent = save.hiscore ? 'RÉCORD · ' + String(save.hiscore).padStart(8, '0') : '';
    show('title'); A.music('title');
  }

  async function newGame() {
    A.init(); A.sfx.select(); A.music('title');
    G.score = 0; G.player = null;
    hideAll();
    await storySlides(PROLOGUE);
    save.seenPrologue = true; persist();
    startChapter(0, false);
  }

  function buildChapterList() {
    const list = $('chapterList'); list.innerHTML = '';
    CHAPTERS.forEach((c, i) => {
      const b = document.createElement('button');
      b.className = 'btn' + (i + 1 > save.unlocked ? ' locked' : '');
      b.innerHTML = `${c.id}. ${c.title}<small>${i + 1 > save.unlocked ? 'Bloqueado' : c.place}</small>`;
      b.addEventListener('click', () => { A.init(); A.sfx.select(); G.score = 0; hideAll(); startChapter(i, false); });
      list.appendChild(b);
    });
  }

  $('btnPlay').addEventListener('click', newGame);
  $('btnChapters').addEventListener('click', () => { A.init(); A.sfx.select(); buildChapterList(); show('chapters'); A.music('title'); });
  $('btnBack').addEventListener('click', () => { A.sfx.select(); show('title'); });
  $('btnSound').addEventListener('click', () => { A.init(); toggleSound(); });
  $('btnSound2').addEventListener('click', toggleSound);
  $('btnResume').addEventListener('click', () => { G.paused = false; hideAll(); });
  $('btnQuit').addEventListener('click', toTitle);
  $('btnRetry').addEventListener('click', () => { G.score = G.chapterStartScore; hideAll(); startChapter(G.chapterIdx, false); });
  $('btnMenu').addEventListener('click', toTitle);

  /* ------------------------------- Bucle ------------------------------- */
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(1 / 30, (now - last) / 1000); last = now;
    if (!G.paused) update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  // Área segura superior (notch / Dynamic Island)
  function readSafeArea() {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;top:0;height:env(safe-area-inset-top,0px);visibility:hidden';
    document.body.appendChild(probe);
    G.safeTop = probe.getBoundingClientRect().height / (G.cssScale || 1);
    probe.remove();
  }

  resize(); readSafeArea(); setSoundLabels(); toTitle();
  window.addEventListener('resize', () => setTimeout(readSafeArea, 200));
  requestAnimationFrame(frame);

  // Exponer para depuración / pruebas automáticas
  window.__G = G;
  window.__debug = { startChapter, bossDefeated: () => G.boss && (G.boss.hp = 1), skipLevel: () => { G.levelT = G.chapter.duration; G.enemies = []; } };
})();

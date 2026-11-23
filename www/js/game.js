/* =========================================================================
   ÉXODO 2942 — Motor principal
   Shoot'em up vertical. Resolución lógica 720 x (1000‑1700), renderizado a
   la densidad física de la pantalla (hasta 2160 px de ancho = 4K vertical).
   ========================================================================= */
'use strict';

(() => {
  const { CHARACTERS, PROLOGUE, CHAPTERS, ENDING, ACTS } = window.STORY;
  const A = window.GameAudio;
  const TAU = Math.PI * 2;
  const $ = id => document.getElementById(id);
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ------------------------------ Guardado ----------------------------- */
  const SAVE_KEY = 'exodo2942.save';
  const save = (() => { try { return Object.assign({ unlocked: 1, hiscore: 0, sound: true, seenPrologue: false, analysis: {}, files: [], roomsDone: [] }, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); } catch (e) { return { unlocked: 1, hiscore: 0, sound: true }; } })();
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
  G.explode = (x, y, size, color) => { explosion(x, y, size, color); A.sfx.bigExplode(); G.shake = Math.max(G.shake, 12); };

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
    bomber:   { hp: 110, r: 34, score: 700, spr: 'bomber' },
    sniper:   { hp: 34, r: 16, score: 400, spr: 'sniper' },
    splitter: { hp: 50, r: 22, score: 350, spr: 'splitter' },
    splitling:{ hp: 10, r: 11, score: 80, spr: 'splitling' },
    orbiter:  { hp: 45, r: 22, score: 450, spr: 'orbiter' },
    swarmer:  { hp: 6, r: 9, score: 60, spr: 'swarmer' },
    tank:     { hp: 320, r: 50, score: 2500, spr: 'tank' },
  };
  // Resistencia de los enemigos normales a las balas (1 = original, 3 = aguantan el triple)
  const ENEMY_TOUGHNESS = 3;
  function spawnEnemy(type, x, y, o = {}) {
    const d = EDEF[type];
    const hpScale = ENEMY_TOUGHNESS * (1 + (G.difficulty - 1) * 0.35);
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
    bombers() { const left = Math.random() < 0.5; for (let i = 0; i < 2; i++) spawnEnemy('bomber', left ? -60 - i * 160 : G.W + 60 + i * 160, rand(130, 230), { ai: 'cross', dir: left ? 1 : -1 }); },
    snipers() { for (let i = 0; i < 3; i++) spawnEnemy('sniper', 120 + i * (G.W - 240) / 2, -30 - i * 30, { ai: 'snipe', stopY: rand(120, 260) }); },
    splitters() { for (let i = 0; i < 3; i++) spawnEnemy('splitter', rand(90, G.W - 90), -40 - i * 90, { ai: 'dive', speed: 170 }); },
    orbiters() { const cx = rand(200, G.W - 200); for (let i = 0; i < 4; i++) spawnEnemy('orbiter', cx, -60, { ai: 'orbit', cx, ang: i / 4 * TAU }); },
    swarm() {
      const gid = newGroup(12, 'P'), x0 = rand(160, G.W - 160);
      for (let i = 0; i < 12; i++) spawnEnemy('swarmer', x0, -20 - i * 22, { ai: 'swarm', base: x0, delay: 0, ph: i * 0.35, group: gid });
    },
    tank() { spawnEnemy('tank', rand(150, G.W - 150), -70, { ai: 'hover', stopY: rand(180, 260), drop: 'P' }); },
    crystals() { for (let i = 0; i < 4; i++) spawnEnemy('crystal', rand(60, G.W - 60), -40 - i * 80, { ai: 'drift', vy: rand(80, 130), vx: rand(-20, 20), spin: rand(-1, 1) }); },
  };
  const WAVE_SETS = {
    city:      ['line', 'vee', 'sweep', 'snake', 'gunship', 'loop', 'kami', 'swarm', 'snipers', 'splitters'],
    asteroids: ['rocks', 'rocks', 'line', 'sweep', 'gunship', 'loop', 'vee', 'carrier', 'bombers', 'swarm', 'snipers', 'splitters'],
    crystal:   ['crystals', 'snake', 'sweep', 'mines', 'gunship', 'loop', 'crystals', 'carrier', 'orbiters', 'splitters', 'snipers', 'swarm'],
    forge:     ['gunship', 'mines', 'vee', 'kami', 'sweep', 'carrier', 'loop', 'snake', 'tank', 'bombers', 'orbiters', 'splitters'],
    rift:      ['kami', 'sweep', 'gunship', 'carrier', 'vee', 'mines', 'loop', 'crystals', 'rocks', 'tank', 'bombers', 'orbiters', 'snipers', 'swarm', 'splitters'],
  };
  // Los enemigos nuevos aparecen poco a poco: misión mínima en la que pueden salir
  const UNLOCK = { swarm: 1, snipers: 2, splitters: 3, bombers: 4, orbiters: 6, tank: 8 };

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
      case 'cross': { e.vx = e.dir * 95; e.vy = 12; break; }
      case 'snipe': {
        if (e.y < e.stopY && t < 4) { e.vy = 160; e.vx = 0; }
        else if (t < 7) { e.vy = 0; e.charge = (e.charge || 0) + dt; }
        else { e.vy = -120; }
        e.rot = Math.atan2(G.player.y - e.y, G.player.x - e.x) - Math.PI / 2; break;
      }
      case 'orbit': {
        e.ang += dt * 1.6; e.cy = (e.cy === undefined ? -60 : e.cy) + 55 * dt;
        e.x = e.cx + Math.cos(e.ang) * 90; e.y = e.cy + Math.sin(e.ang) * 90; e.vx = 0; e.vy = 0; break;
      }
      case 'swarm': {
        e.vy = 230; e.x = e.base + Math.sin(t * 3 + e.ph) * 150 + Math.sin(t * 7 + e.ph) * 20; e.vx = 0;
        e.rot = Math.cos(t * 3 + e.ph) * 0.6; break;
      }
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
          case 'bomber': G.shot(e.x, e.y + 20, 0, 120, 'bBig'); G.shot(e.x - 30, e.y + 10, -40, 160, 'bOrange'); G.shot(e.x + 30, e.y + 10, 40, 160, 'bOrange'); e.fireT = rand(1.2, 1.8) / (0.8 + diff * 0.2); break;
          case 'sniper':
            if (e.charge > 0.9 && !e.fired) { e.fired = true; const a = G.aim(e.x, e.y); for (let k = 0; k < 5; k++) G.shot(e.x + Math.cos(a) * k * 14, e.y + Math.sin(a) * k * 14, ...vel(a, 420), 'bCyan'); }
            e.fireT = 0.1; break;
          case 'orbiter': G.ring(e.x, e.y, 6, 140, e.ang, 'bViolet'); e.fireT = rand(2.2, 3.2); break;
          case 'tank': for (const dx of [-36, -16, 16, 36]) G.shot(e.x + dx, e.y + 50, dx * 2, 240, 'bRed'); e.fireT = rand(0.9, 1.3) / (0.8 + diff * 0.2); break;
          case 'splitter': G.shot(e.x, e.y + 10, ...vel(G.aim(e.x, e.y), 220), 'bViolet'); e.fireT = rand(1.8, 2.6); break;
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
    const big = e.type === 'carrier' || e.type === 'tank' ? 3 : e.type === 'gunship' || e.type === 'bomber' ? 1.8 : e.type === 'rock' ? 1.4 : e.type === 'swarmer' || e.type === 'splitling' ? 0.5 : 1;
    const col = e.type === 'splitter' || e.type === 'splitling' ? '#9dff6a' : e.type === 'orbiter' ? '#c46bff' : e.type === 'sniper' ? '#4fd8ff' : e.type === 'swarmer' ? '#ffe066' : e.type === 'weaver' ? '#c46bff' : e.type === 'crystal' ? '#4fd8ff' : e.type === 'gunship' ? '#ffb347' : e.type === 'mine' ? '#ffe066' : '#ff4a6a';
    explosion(e.x, e.y, big, col);
    if (big > 1.5) { G.shake = Math.max(G.shake, 8); A.sfx.bigExplode(); } else A.sfx.explode();
    if (e.type === 'rock') for (let i = 0; i < 3; i++) spawnEnemy('rockS', e.x, e.y, { ai: 'drift', vx: rand(-120, 120), vy: rand(60, 180) });
    if (e.type === 'mine') G.ring(e.x, e.y, 10, 150, rand(0, 1), 'bOrange');
    if (e.type === 'crystal') G.ring(e.x, e.y, 8, 170, rand(0, 1), 'bCyan');
    if (e.type === 'splitter') for (const s of [-1, 1]) spawnEnemy('splitling', e.x + s * 14, e.y, { ai: 'homing', speed: 210, vx: s * 150, vy: -60 });
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
    for (const e of G.enemies) { e.hp -= 150; e.flash = 0.2; if (e.hp <= 0 && !e.dead) killEnemy(e); }
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
    if (b.analyzed) dmg *= 1.35; // punto débil conocido gracias a los objetos de las estancias
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
      // Punto de control a mitad de misión
      if (!G.checkpoint && G.levelT >= checkpointT()) {
        const p0 = G.player;
        G.checkpoint = { score: G.score, power: p0.power, drones: p0.drones, bombs: p0.bombs };
        floatText(G.W / 2, G.H * 0.35, 'PUNTO DE CONTROL', '#9dff6a');
      }
      // Cada minuto, una oleada de asalto (y un respiro justo después)
      const minute = Math.floor(G.levelT / ASSAULT_EVERY);
      if (minute > G.lastAssault && G.levelT < G.chapter.duration - 10) {
        G.lastAssault = minute;
        G.banner = { text: 'OLEADA ' + (minute + 1) + '/' + Math.ceil(G.chapter.duration / ASSAULT_EVERY), sub: 'Tiempo restante ' + fmtTime(G.chapter.duration - G.levelT), t: 0, dur: 2, color: '#ffb347' };
        FORMATIONS[G.chapter.theme === 'asteroids' ? 'rocks' : 'sweep'](); FORMATIONS.carrier();
        G.waveT = 4;
      }
      if (G.waveT <= 0 && G.levelT < G.chapter.duration - 3 && G.enemies.length < 45) {
        const set = WAVE_SETS[G.chapter.theme];
        const avail = set.filter(f => !UNLOCK[f] || G.chapter.id >= UNLOCK[f]);
        let f = avail[Math.floor(Math.random() * avail.length)];
        if (f === 'carrier' && G.levelT < 25) f = 'sweep';
        if (f === 'carrier' && G.enemies.some(e => e.type === 'carrier')) f = 'line';
        FORMATIONS[f]();
        G.waveT = Math.max(1.2, 2.6 - G.difficulty * 0.18 - G.levelT / G.chapter.duration * 0.6) + (f === 'carrier' ? 3 : 0);
        // Mejora garantizada a intervalos para que la progresión sea justa
        if (G.levelT - G.lastFreeDrop > 22) { G.lastFreeDrop = G.levelT; dropItem(rand(100, G.W - 100), -20, p.power < 5 ? 'P' : 'S'); }
      }
      // Comunicaciones de radio
      while (G.commIdx < G.chapter.comms.length && G.chapter.comms[G.commIdx].t <= G.levelT) showComm(G.chapter.comms[G.commIdx++]);
      if (G.levelT >= G.chapter.duration && G.enemies.length === 0) {
        G.phaseState = 'warning';
        if (G.chapter.boss) startBossSequence(); else if (G.chapter.miniboss) startMiniBoss(); else missionComplete();
      }
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
      if (!b.entering) {
        const ph = b.phase();
        if (b.shownPh === undefined) b.shownPh = ph;
        if (ph !== b.shownPh) {
          b.shownPh = ph; G.eBullets.length = 0; G.flash = 0.6; G.shake = 14;
          if (b.isSuper) G.banner = { text: ph === 3 ? '¡NÚCLEO AL DESCUBIERTO!' : 'FASE ' + (ph + 1) + '/4', sub: b.name, t: 0, dur: 2.2, color: '#ff2a5a' };
        }
      }
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
    if (G.mode === 'menu' || G.mode === 'room') { if (G.mode === 'menu') drawMenuShip(); return; }

    // Objetos
    for (const it of G.items) Sprites.draw(ctx, 'pw' + it.kind, it.x, it.y, 0, 1 + Math.sin(it.t * 6) * 0.06);
    // Enemigos
    for (const e of G.enemies) {
      Sprites.draw(ctx, e.spr, e.x, e.y, e.rot || 0);
      if (e.flash > 0) { ctx.globalCompositeOperation = 'lighter'; Sprites.draw(ctx, e.spr, e.x, e.y, e.rot || 0, 1, 0.7); ctx.globalCompositeOperation = 'source-over'; }
      if (e.type === 'sniper' && e.charge > 0 && !e.fired) {
        const a = G.aim(e.x, e.y); ctx.strokeStyle = `rgba(79,216,255,${Math.min(0.8, e.charge)})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(a) * 1400, e.y + Math.sin(a) * 1400); ctx.stroke();
      }
      if (e.type === 'carrier' && e.hp < e.maxHp) drawBar(e.x - 50, e.y - 62, 100, 5, e.hp / e.maxHp, '#ff5c8a');
      else if (e.type === 'tank' && e.hp < e.maxHp) drawBar(e.x - 45, e.y - 66, 90, 5, e.hp / e.maxHp, '#ff5c8a');
      else if ((e.type === 'gunship' || e.type === 'rock' || e.type === 'bomber') && e.hp < e.maxHp) drawBar(e.x - 30, e.y - 44, 60, 4, e.hp / e.maxHp, '#ffb347');
    }
    // Jefe
    const b = G.boss;
    if (b && !b.dead) {
      b.draw(ctx);
      if (b.analyzed && !b.entering) {
        const hb = b.hitboxes()[0], r = hb.r + 10 + Math.sin(G.time * 6) * 4;
        ctx.save(); ctx.strokeStyle = 'rgba(157,255,106,0.75)'; ctx.lineWidth = 2; ctx.setLineDash([10, 8]);
        ctx.beginPath(); ctx.arc(hb.x, hb.y, r, G.time, G.time + TAU); ctx.stroke(); ctx.restore();
      }
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
    ctx.fillText('MISIÓN ' + G.chapter.id + '/' + CHAPTERS.length + ' · ' + G.chapter.title, 20, top + 32);
    if (G.phaseState === 'level') {
      ctx.textAlign = 'right'; ctx.font = '800 22px system-ui, sans-serif'; ctx.fillStyle = '#ffb347';
      ctx.fillText(fmtTime(Math.max(0, G.chapter.duration - G.levelT)), G.W - 76, top + 6);
      ctx.textAlign = 'left';
    }
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
      if (b.analyzed) { ctx.font = '700 11px system-ui, sans-serif'; ctx.fillStyle = '#9dff6a'; ctx.fillText('◆ ANALIZADO · +35 % DAÑO', G.W / 2, y + 38); }
      drawBar(60, y + 20, G.W - 120, b.isSuper ? 14 : 10, b.hp / b.maxHp, b.isSuper ? '#ff2a4f' : '#ff2a5a');
      if (b.phases) { ctx.fillStyle = '#fff'; for (let i = 1; i < b.phases; i++) ctx.fillRect(60 + (G.W - 120) * i / b.phases - 1, y + 17, 2, 20); }
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
      ctx.font = '900 52px system-ui, sans-serif';
      const fs = Math.min(52, Math.floor(52 * (G.W - 60) / ctx.measureText(bn.text).width));
      ctx.fillStyle = bn.color; ctx.font = `900 ${fs}px system-ui, sans-serif`; ctx.textAlign = 'center';
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
    if (document.hidden) { if (G.mode === 'play' && !G.paused) togglePause(true); else if (G.mode === 'room' && !G.paused) { G.paused = true; show('pause'); } A.suspend(); }
    else A.resume();
  });

  /* ---------------------------- Pantallas UI --------------------------- */
  const screens = ['title', 'chapters', 'story', 'card', 'pause', 'gameover', 'found', 'files', 'roomFail'];
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

  /* opts: { keep: conserva la nave de la misión anterior,
             snap: restaura potencia/drones/pulsos guardados,
             fromCheckpoint: empieza a mitad de misión } */
  async function startChapter(idx, opts = {}) {
    const id = ++runId;
    G.chapterIdx = idx; G.chapter = CHAPTERS[idx]; G.difficulty = 1 + idx * 0.15;
    resetField();
    if (!opts.keep || !G.player) G.player = newPlayer();
    else { const p = G.player; p.x = G.W / 2; p.y = G.H - 200; p.inv = 2; p.dead = 0; p.lives = Math.max(p.lives, 3); p.shield = p.maxShield; p.bombs = Math.max(p.bombs, 3); }
    if (opts.snap) Object.assign(G.player, { power: opts.snap.power, drones: opts.snap.drones, bombs: Math.max(3, opts.snap.bombs) });
    const p = G.player;
    if (!opts.fromCheckpoint) { G.chapterStartScore = G.score; G.missionSnap = { power: p.power, drones: p.drones, bombs: p.bombs }; G.checkpoint = null; }
    G.bg = Backgrounds.create(G.chapter.theme, G.W, G.H, G.R);
    G.levelT = opts.fromCheckpoint ? checkpointT() : 0; G.waveT = 3; G.lastFreeDrop = G.levelT;
    G.lastAssault = Math.floor(G.levelT / ASSAULT_EVERY);
    G.commIdx = G.chapter.comms.filter(c => c.t <= G.levelT).length;
    G.phaseState = 'level';
    G.mode = 'dialog'; G.paused = false;
    A.music(G.chapter.theme);

    // Tarjeta de misión
    $('cardNum').textContent = ACTS[G.chapter.act] + ' · MISIÓN ' + G.chapter.id + '/' + CHAPTERS.length;
    $('cardTitle').textContent = G.chapter.title;
    $('cardPlace').textContent = opts.fromCheckpoint ? 'Desde el punto de control · ' + fmtTime(G.chapter.duration - checkpointT()) + ' restantes' : G.chapter.place + (G.chapter.boss ? (G.chapter.boss.super ? ' · SÚPER JEFE' : ' · JEFE FINAL') : '');
    show('card');
    await sleep(2600);
    if (id !== runId) return;
    hideAll();
    if (!opts.fromCheckpoint) await dialog(G.chapter.intro);
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
    G.boss = Bosses.create(G, G.chapter.boss); G.boss.analyzed = isAnalyzed(G.chapter.boss.name);
    G.phaseState = 'boss';
  }

  /* Mini jefe: sin diálogo que pare la acción, solo aviso y radio */
  async function startMiniBoss() {
    const id = runId;
    const def = G.chapter.miniboss;
    G.banner = { text: '¡MINI JEFE!', sub: def.name, t: 0, dur: 2.4, color: '#ffb347' };
    A.sfx.alarm(); A.music('boss');
    clearComms(); if (def.line) showComm(def.line);
    await sleep(2200);
    if (id !== runId) return;
    G.boss = Bosses.create(G, def); G.boss.mini = true; G.boss.analyzed = isAnalyzed(def.name);
    G.phaseState = 'boss';
  }

  async function bossDefeated() {
    const b = G.boss; if (b.dead) return;
    b.dead = true; const id = runId;
    if (b.mini) {
      G.score += 8000 + 1000 * G.chapter.id; G.eBullets.length = 0; G.phaseState = 'cleared';
      for (let i = 0; i < 6; i++) setTimeout(() => { if (id !== runId) return; explosion(b.x + rand(-70, 70), b.y + rand(-50, 50), rand(1.2, 2.2), i % 2 ? '#ffb347' : '#ff4a6a'); A.sfx.explode(); G.shake = 10; }, i * 140);
      setTimeout(() => { if (id !== runId) return; explosion(b.x, b.y, 4, '#ffffff'); A.sfx.bigExplode(); G.flash = 0.7; G.shake = 18; vibrate(200); }, 900);
      G.player.inv = 99;
      floatText(b.x, b.y - 60, '+' + (8000 + 1000 * G.chapter.id), '#ffe066');
      await sleep(1900);
      if (id !== runId) return;
      G.boss = null;
      for (const e of G.enemies) killEnemy(e);
      G.enemies = [];
      missionComplete();
      return;
    }
    const bonus = (b.isSuper ? 50000 : 20000) * Math.ceil(G.chapter.id / 5);
    G.score += bonus;
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
    floatText(G.W / 2, G.H * 0.45, '+' + bonus, '#ffe066');
    await sleep(1200);
    if (id !== runId) return;
    $('controls').classList.remove('show');
    await dialog(G.chapter.outro);
    if (id !== runId) return;
    G.player.inv = 0;
    nextMission();
  }

  function nextMission() {
    save.hiscore = Math.max(save.hiscore, G.score);
    const next = G.chapterIdx + 1;
    save.unlocked = Math.max(save.unlocked, Math.min(CHAPTERS.length, next + 1));
    persist();
    const room = ROOMS.find(r => r.after === G.chapter.id);
    const go = () => { if (next < CHAPTERS.length) startChapter(next, { keep: true }); else ending(); };
    if (room) runRoom(room).then(go); // runRoom solo se resuelve si la familia escapa
    else go();
  }

  /* Misión sin jefe: sobreviviste hasta el final de la cuenta atrás */
  async function missionComplete() {
    const id = runId;
    clearComms();
    const p = G.player, bonus = 5000 + p.shield * 1000 + p.lives * 2000;
    G.score += bonus; p.inv = 99;
    G.banner = { text: 'MISIÓN CUMPLIDA', sub: 'Bonificación +' + bonus, t: 0, dur: 3, color: '#9dff6a' };
    A.sfx.power();
    await sleep(3200);
    if (id !== runId) return;
    $('controls').classList.remove('show');
    await dialog(G.chapter.outro);
    if (id !== runId) return;
    p.inv = 0;
    nextMission();
  }
  const ASSAULT_EVERY = 40; // segundos entre oleadas de asalto
  const checkpointT = () => G.chapter.duration / 2; // punto de control a mitad de misión
  const fmtTime = s => { s = Math.ceil(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

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
      $('btnCheckpoint').style.display = G.checkpoint ? '' : 'none';
      save.hiscore = Math.max(save.hiscore, G.score); persist();
      show('gameover');
    }, 1600);
  }

  function toTitle() {
    runId++; clearComms();
    G.mode = 'menu'; G.chapter = null; G.player = null; G.paused = false; resetField();
    $('controls').classList.remove('show'); $('dialog').classList.remove('show'); closeRoom();
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
    startChapter(0);
  }

  function buildChapterList() {
    const list = $('chapterList'); list.innerHTML = '';
    CHAPTERS.forEach((c, i) => {
      if (i === 0 || CHAPTERS[i - 1].act !== c.act) {
        const h = document.createElement('div'); h.className = 'act-title'; h.textContent = ACTS[c.act]; list.appendChild(h);
      }
      const locked = i + 1 > save.unlocked;
      const b = document.createElement('button');
      b.className = 'btn' + (locked ? ' locked' : '') + (c.boss ? (c.boss.super ? ' super' : ' boss') : '');
      const tag = c.boss ? `<em>${c.boss.super ? 'SÚPER JEFE' : 'JEFE'}</em>` : '';
      b.innerHTML = `${c.id}. ${c.title}${tag}<small>${locked ? 'Bloqueada' : c.place + ' · ' + Math.round(c.duration / 60) + ' min'}</small>`;
      b.addEventListener('click', () => { A.init(); A.sfx.select(); G.score = 0; hideAll(); startChapter(i); });
      list.appendChild(b);
      const room = ROOMS.find(r => r.after === c.id);
      if (room) {
        const rl = save.unlocked <= room.after;
        const rb = document.createElement('button');
        rb.className = 'btn room-entry' + (rl ? ' locked' : '');
        rb.innerHTML = `◆ ${room.title}<em>ESTANCIA</em><small>${rl ? 'Bloqueada' : 'Misión de personajes · puzle'}</small>`;
        rb.addEventListener('click', () => { A.init(); A.sfx.select(); G.score = 0; G.player = newPlayer(); hideAll(); runRoom(room).then(() => startChapter(room.after, { keep: true })); });
        list.appendChild(rb);
      }
    });
  }

  $('btnPlay').addEventListener('click', newGame);
  $('btnChapters').addEventListener('click', () => { A.init(); A.sfx.select(); buildChapterList(); show('chapters'); A.music('title'); });
  $('btnBack').addEventListener('click', () => { A.sfx.select(); show('title'); });
  $('btnSound').addEventListener('click', () => { A.init(); toggleSound(); });
  $('btnSound2').addEventListener('click', toggleSound);
  $('btnResume').addEventListener('click', () => { G.paused = false; hideAll(); });
  $('btnQuit').addEventListener('click', toTitle);
  $('btnRetry').addEventListener('click', () => { G.score = G.chapterStartScore; hideAll(); startChapter(G.chapterIdx, { snap: G.missionSnap }); });
  $('btnCheckpoint').addEventListener('click', () => { G.score = G.checkpoint.score; hideAll(); startChapter(G.chapterIdx, { snap: G.checkpoint, fromCheckpoint: true }); });
  $('btnMenu').addEventListener('click', toTitle);

  /* =========================================================================
     ESTANCIAS: misiones de personajes (puzle). Datos en rooms.js.
     ========================================================================= */
  const ROOMS = window.Rooms.ROOMS;
  const ROOM_CHARS = ['dario', 'lia', 'nora', 'teo'];
  const SKILLS = { dario: 'Fuerza', lia: 'Ingeniería', nora: 'Informática', teo: 'Pequeño · invisible' };
  const isAnalyzed = name => !!(save.analysis && save.analysis[name]);
  const roomCanvas = $('roomCanvas'), rctx = roomCanvas.getContext('2d');
  const R_ = { room: null, S: null, inv: [], who: 'dario', time: 0, busy: false, id: 0, resolve: null, raf: 0, view: null };

  function roomLayout() {
    const st = $('roomStage').getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    roomCanvas.width = Math.round(st.width * dpr); roomCanvas.height = Math.round(st.height * dpr);
    const k = Math.min(st.width / Rooms.W, st.height / Rooms.H);
    R_.view = { k, ox: (st.width - Rooms.W * k) / 2, oy: (st.height - Rooms.H * k) / 2, dpr };
    const hot = $('roomHot'); hot.innerHTML = '';
    for (const h of R_.room.hotspots) {
      const b = document.createElement('button');
      b.className = 'hot';
      b.style.left = (R_.view.ox + h.x * k) + 'px'; b.style.top = (R_.view.oy + h.y * k) + 'px';
      b.style.width = (h.w * k) + 'px'; b.style.height = (h.h * k) + 'px';
      b.innerHTML = `<span>${h.name}</span>`;
      b.addEventListener('click', () => roomAct(h));
      hot.appendChild(b);
    }
  }
  function roomDraw(now) {
    if (!R_.room) return;
    const v = R_.view, t = now / 1000;
    rctx.setTransform(1, 0, 0, 1, 0, 0);
    rctx.fillStyle = '#020306'; rctx.fillRect(0, 0, roomCanvas.width, roomCanvas.height);
    rctx.setTransform(v.k * v.dpr, 0, 0, v.k * v.dpr, v.ox * v.dpr, v.oy * v.dpr);
    rctx.R = v.k * v.dpr;
    rctx.save(); rctx.beginPath(); rctx.rect(0, 0, Rooms.W, Rooms.H); rctx.clip();
    Rooms.base(rctx, R_.room.pal, t);
    for (const h of R_.room.hotspots) { rctx.save(); h.draw(rctx, R_.S, t); rctx.restore(); }
    rctx.restore();
    R_.raf = requestAnimationFrame(roomDraw);
  }
  function roomChars() {
    const box = $('roomChars'); box.innerHTML = '';
    for (const k of ROOM_CHARS) {
      const c = CHARACTERS[k], b = document.createElement('button');
      b.className = 'char-btn' + (R_.who === k ? ' active' : '');
      b.style.setProperty('--pc', c.color);
      b.innerHTML = `<div class="portrait" style="--pc:${c.color}"><span>${c.initial}</span></div>${c.name.split(' ')[0]}<small>${SKILLS[k]}</small>`;
      b.addEventListener('click', () => { R_.who = k; A.sfx.blip(); roomChars(); });
      box.appendChild(b);
    }
  }
  function roomInv() {
    const box = $('roomInv'); box.innerHTML = '';
    for (const it of R_.inv) {
      const d = Rooms.ITEMS[it], b = document.createElement('div');
      b.className = 'inv-item'; b.innerHTML = `<b>${d.icon}</b>${d.name}`;
      box.appendChild(b);
    }
  }
  function roomTimerUI() {
    const el = $('roomTimer'); el.textContent = fmtTime(Math.max(0, R_.time));
    el.classList.toggle('low', R_.time < 60);
  }

  /* Teclado: dígitos, letras o secuencia de colores. Devuelve true si se acierta. */
  function codePad(o) {
    return new Promise(resolve => {
      const pad = $('codePad'), keys = $('codeKeys'), disp = $('codeDisplay');
      $('codeTitle').textContent = o.title; $('codeHint').textContent = o.hint;
      let val = [];
      const COLORS = { ambar: ['ÁMBAR', '#ffb347'], rojo: ['ROJO', '#ff2a5a'], azul: ['AZUL', '#4fd8ff'], verde: ['VERDE', '#9dff6a'] };
      const render = () => {
        disp.innerHTML = '';
        for (let i = 0; i < o.len; i++) {
          const s = document.createElement('i'); const v = val[i];
          if (v !== undefined) { if (o.type === 'colors') s.style.background = COLORS[v][1]; else s.textContent = v; }
          disp.appendChild(s);
        }
      };
      const close = ok => { pad.classList.remove('show'); $('codeCancel').onclick = null; resolve(ok); };
      const check = () => {
        const ok = o.type === 'colors' ? val.join() === o.answer.join() : val.join('') === o.answer;
        if (ok) { A.sfx.power(); setTimeout(() => close(true), 250); return; }
        A.sfx.hurt(); vibrate(80);
        const p = pad.querySelector('.pad'); p.classList.remove('wrong'); void p.offsetWidth; p.classList.add('wrong');
        setTimeout(() => { val = []; render(); }, 350);
      };
      const press = k => {
        if (k === '⌫') { val.pop(); render(); return; }
        if (val.length >= o.len) return;
        val.push(k); A.sfx.blip(); render();
        if (val.length === o.len) check();
      };
      keys.className = 'pad-keys' + (o.type === 'letters' ? ' letters' : o.type === 'colors' ? ' colors' : '');
      keys.innerHTML = '';
      const list = o.type === 'digits' ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0']
        : o.type === 'letters' ? 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('').concat('⌫')
        : Object.keys(COLORS).concat('⌫');
      for (const k of list) {
        const b = document.createElement('button');
        if (o.type === 'colors' && COLORS[k]) { b.textContent = COLORS[k][0]; b.style.background = COLORS[k][1] + '44'; b.style.borderColor = COLORS[k][1]; }
        else b.textContent = k;
        b.addEventListener('click', () => press(k));
        keys.appendChild(b);
      }
      $('codeCancel').onclick = () => close(false);
      render(); pad.classList.add('show');
    });
  }

  function showFound(room) {
    return new Promise(resolve => {
      const o = room.object;
      $('foundName').textContent = o.name; $('foundDesc').textContent = o.desc;
      $('foundBosses').innerHTML = o.bosses.map(b => `<div class="boss-entry"><b>${b.name} · MISIÓN ${b.mission}</b>${b.weak}</div>`).join('');
      save.analysis = save.analysis || {};
      for (const b of o.bosses) save.analysis[b.name] = true;
      save.files = Array.from(new Set([...(save.files || []), room.id])); persist();
      A.sfx.power(); show('found');
      $('foundOk').onclick = () => { $('foundOk').onclick = null; hideAll(); resolve(); };
    });
  }

  async function roomAct(h) {
    if (R_.busy || G.paused || !R_.room) return;
    R_.busy = true;
    const id = R_.id;
    const C = {
      S: R_.S, who: R_.who,
      has: it => R_.inv.includes(it),
      give: it => { R_.inv.push(it); roomInv(); A.sfx.power(); },
      take: it => { R_.inv = R_.inv.filter(x => x !== it); roomInv(); },
      say: (who, text) => dialog([{ who, text }]),
      sfx: n => A.sfx[n] && A.sfx[n](),
      code: o => codePad(o),
      found: async () => { R_.S.found = true; await showFound(R_.room); },
      escape: async () => { R_.S.escaped = true; },
    };
    try { await h.act(C); } finally { R_.busy = false; }
    if (id === R_.id && R_.S.escaped) finishRoom(true);
  }

  async function finishRoom(won) {
    const room = R_.room; if (!room) return;
    clearInterval(R_.timer); cancelAnimationFrame(R_.raf);
    if (won) {
      A.sfx.select();
      await dialog(room.outro);
      $('room').classList.remove('show');
      save.roomsDone = Array.from(new Set([...(save.roomsDone || []), room.id])); persist();
      R_.room = null;
      const r = R_.resolve; R_.resolve = null; r && r();
    } else {
      $('room').classList.remove('show');
      $('roomFailText').textContent = room.id === 4 ? '«EL HERALDO HA DESPERTADO.» — ORDO' : room.id === 3 ? 'La colada de metal fundido ha llegado a la cabina.' : room.id === 2 ? 'El oxígeno de la sonda se ha agotado.' : 'Los Guardianes del Censo han entrado en la sala de control.';
      show('roomFail');
    }
  }

  /* Ejecuta una estancia. Resuelve cuando la familia escapa. */
  function runRoom(room) {
    return new Promise(async resolve => {
      const myRun = runId;
      R_.id++; R_.room = room; R_.S = {}; R_.inv = []; R_.who = 'dario'; R_.time = room.time; R_.busy = true; R_.resolve = resolve;
      G.mode = 'room'; G.paused = false; resetField();
      $('controls').classList.remove('show'); clearComms();
      A.music('room');
      $('cardNum').textContent = 'MISIÓN ESPECIAL · ESTANCIA ' + room.id + '/' + ROOMS.length;
      $('cardTitle').textContent = room.title; $('cardPlace').textContent = room.place;
      show('card');
      await sleep(2600);
      if (myRun !== runId) return;
      hideAll();
      $('roomTitle').textContent = room.title; $('roomPlace').textContent = room.place;
      $('room').classList.add('show');
      roomLayout(); roomChars(); roomInv(); roomTimerUI();
      cancelAnimationFrame(R_.raf); R_.raf = requestAnimationFrame(roomDraw);
      await dialog(room.intro);
      if (myRun !== runId) return;
      R_.busy = false;
      clearInterval(R_.timer);
      R_.timer = setInterval(() => {
        if (myRun !== runId) { clearInterval(R_.timer); return; }
        const blocked = G.paused || $('dialog').classList.contains('show') || $('codePad').classList.contains('show') || $('found').classList.contains('show');
        if (blocked) return;
        R_.time -= 0.25; roomTimerUI();
        if (R_.time <= 0 && !R_.S.escaped) finishRoom(false);
      }, 250);
    });
  }
  function closeRoom() {
    clearInterval(R_.timer); cancelAnimationFrame(R_.raf);
    R_.room = null; R_.resolve = null;
    $('room').classList.remove('show'); $('codePad').classList.remove('show');
  }

  $('roomHint').addEventListener('click', () => {
    if (!R_.room || R_.busy) return;
    const h = R_.room.hints.map(f => f(R_.S)).find(Boolean);
    if (h) { R_.busy = true; dialog([h]).then(() => { R_.busy = false; }); }
  });
  $('roomPause').addEventListener('click', () => { if (!R_.room) return; G.paused = true; show('pause'); });
  $('roomRetry').addEventListener('click', () => {
    const room = R_.room, resolve = R_.resolve; hideAll();
    runId++;
    runRoom(room).then(resolve);
  });
  $('roomMenu').addEventListener('click', toTitle);
  window.addEventListener('resize', () => { if (R_.room) setTimeout(roomLayout, 150); });

  /* Expedientes: objetos encontrados y análisis de jefes */
  function buildFiles() {
    const list = $('filesList'); list.innerHTML = '';
    for (const room of ROOMS) {
      const got = (save.files || []).includes(room.id);
      const h = document.createElement('div'); h.className = 'file-obj';
      h.textContent = got ? room.object.name : `ESTANCIA ${room.id} · ??? (tras la misión ${room.after})`;
      list.appendChild(h);
      for (const b of room.object.bosses) {
        const d = document.createElement('div');
        d.className = 'boss-entry' + (got ? '' : ' locked');
        d.innerHTML = `<b>${got ? b.name : '???'} · MISIÓN ${b.mission}</b>${got ? b.weak : 'Sin analizar.'}`;
        list.appendChild(d);
      }
    }
  }
  $('btnFiles').addEventListener('click', () => { A.init(); A.sfx.select(); buildFiles(); show('files'); });
  $('filesBack').addEventListener('click', () => { A.sfx.select(); show('title'); });

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
  window.__debug = { startChapter, runRoom: i => runRoom(ROOMS[i]), R_, formations: FORMATIONS, bossDefeated: () => G.boss && (G.boss.hp = 1), skipLevel: () => { G.levelT = G.chapter.duration; G.enemies = []; }, setTime: t => { G.levelT = t; } };
})();

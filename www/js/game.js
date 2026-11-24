/* =========================================================================
   ÉXODO 2942 — Motor principal
   Shoot'em up vertical. Resolución lógica 720 x (1000‑1700), renderizado a
   la densidad física de la pantalla (hasta 2160 px de ancho = 4K vertical).
   ========================================================================= */
'use strict';

(() => {
  const { CHARACTERS, PROLOGUE, CHAPTERS, ENDING, ACTS } = window.STORY;
  const A = window.GameAudio;
  const M = window.Meta;
  const T = window.T;
  const TAU = Math.PI * 2;
  const $ = id => document.getElementById(id);
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ------------------------------ Guardado ----------------------------- */
  const SAVE_KEY = (window.GAME_CONFIG && window.GAME_CONFIG.saveKey) || 'exodo2942.save';
  const DEFAULT_SETTINGS = { lang: I18N.detect(), difficulty: 1, sens: 1.25, vibration: true, bigText: false, cbBullets: false, autofire: true };
  const save = (() => {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'); } catch (e) { s = {}; }
    s = Object.assign({ unlocked: 1, hiscore: 0, sound: true, seenPrologue: false, analysis: {}, files: [], roomsDone: [],
      credits: 0, upgrades: {}, shipMode: 'dario', ach: {}, stats: { kills: 0, pulses: 0 }, flags: {}, tutorialDone: false,
      fullGame: false, arcadeBest: 0, arcadeBestTime: 0, rushBest: 0, duels: {} }, s);
    s.settings = Object.assign({}, DEFAULT_SETTINGS, s.settings || {});
    // Si el jugador nunca eligió idioma, se vuelve a detectar (español por defecto)
    if (!s.settings.langChosen) s.settings.lang = I18N.detect();
    return s;
  })();
  const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* sin almacenamiento */ } };

  /* --------------------- Dificultad, mejoras y modos --------------------- */
  const D = () => M.DIFFICULTY[save.settings.difficulty] || M.DIFFICULTY[1];
  const upgLevel = id => save.upgrades[id] || 0;
  const upg = id => { const u = M.UPGRADES.find(x => x.id === id); return u.values[upgLevel(id)]; };
  const modeUnlocked = id => { const m = M.SHIP_MODES.find(x => x.id === id); return !m.unlock || (save.roomsDone || []).includes(m.unlock); };
  const shipMode = () => (modeUnlocked(save.shipMode) ? save.shipMode : 'dario');
  const flag = k => k === 'vexSaved' ? save.flags.vexSaved !== false : !!save.flags[k];
  // Líneas condicionales de la historia: { if: 'vexSaved' } / { ifNot: 'vexSaved' }
  const filterLines = lines => (lines || []).filter(l => (!l.if || flag(l.if)) && (!l.ifNot || !flag(l.ifNot)));
  const isFull = () => !M.CONFIG.demo || save.fullGame;

  /* ------------------------------ Lienzo ------------------------------- */
  const canvas = $('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  const G = {
    W: 720, H: 1280, R: 1, cssScale: 1, dt: 0, time: 0, difficulty: 1,
    mode: 'menu', paused: false,
    player: null, enemies: [], eBullets: [], pBullets: [], items: [], particles: [], texts: [],
    boss: null, bg: null, chapter: null, chapterIdx: 0, levelT: 0, phaseState: 'level',
    score: 0, chapterStartScore: 0, shake: 0, flash: 0, banner: null,
    gameMode: 'story', comms: [], runT: 0, tutorial: null, rushIdx: 0, arcadeLevel: 1,
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
    if (changed) { Sprites.build(R, { colorblind: save.settings.cbBullets }); G.built = true; }
    G.bg = Backgrounds.create(G.chapter ? G.chapter.theme : 'title', G.W, G.H, R);
    if (G.player) { G.player.x = clamp(G.player.x, 30, G.W - 30); G.player.y = clamp(G.player.y, 60, G.H - 50); }
  }
  window.addEventListener('resize', () => { clearTimeout(G._rz); G._rz = setTimeout(resize, 120); });

  /* ------------------------- API para jefes ------------------------- */
  const BULLET_R = { bRed: 6, bViolet: 6, bOrange: 8, bBig: 12, bCyan: 6 };
  G.shot = (x, y, vx, vy, kind = 'bRed') => {
    if (G.eBullets.length > 700) return;
    const k = G.bulletK || 1;
    G.eBullets.push({ x, y, vx: vx * k, vy: vy * k, k: kind, r: BULLET_R[kind] || 6 });
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
    const mode = shipMode(), teo = mode === 'teo';
    const p = { x: G.W / 2, y: G.H - 200, r: teo ? 5 : 7, shield: 0, maxShield: 0, lives: D().lives, power: 1, bombs: 0, drones: 0,
      fireT: 0, inv: 2, phaseT: 0, phaseCd: 0, dead: 0, tilt: 0, droneAng: 0, mode, hits: 0 };
    applyUpgrades(p, true);
    return p;
  }
  // Aplica el hangar a la nave. fresh: nave nueva; si no, solo garantiza los mínimos.
  function applyUpgrades(p, fresh) {
    const teo = p.mode === 'teo';
    p.maxShield = Math.max(1, upg('shield') + (D().shield || 0)); p.maxBombs = upg('pulse') + 2;
    p.phaseDur = teo ? 1.0 : 0.7; p.phaseCdMax = upg('phase') * (teo ? 0.6 : 1);
    p.magnet = upg('magnet'); p.droneDmg = upgLevel('drones') >= 3 ? 10.5 : 7;
    if (fresh) { p.power = upg('cannon'); p.shield = p.maxShield; p.bombs = upg('pulse'); p.drones = upg('drones'); }
    else { p.power = Math.max(p.power, upg('cannon')); p.drones = Math.max(p.drones, upg('drones')); p.bombs = Math.max(p.bombs, upg('pulse')); p.shield = p.maxShield; }
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
  // Daño de los disparos de tu nave (1 = original, 0.7 = un 30 % menos). No afecta al PULSO.
  const PLAYER_DAMAGE = 0.7;
  // Daño del PULSO (1 = original: 150 a enemigos y 60 a jefes; 0.5 = la mitad)
  const PULSE_DAMAGE = 0.5;
  function spawnEnemy(type, x, y, o = {}) {
    const d = EDEF[type];
    const hpScale = ENEMY_TOUGHNESS * D().hp * (1 + (G.difficulty - 1) * 0.35);
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
      e.fireT -= dt * D().fire;
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
  const FIRE_RATE = { dario: 0.1, lia: 0.14, nora: 0.12, teo: 0.11 };
  function firePlayer(p) {
    const lv = p.power, add = (x, y, vx, vy, spr = 'pShot', dmg = 10, extra) => G.pBullets.push(Object.assign({ x, y, vx, vy, spr, dmg: dmg * PLAYER_DAMAGE, r: 7 }, extra));
    if (p.mode === 'lia') {
      // LÁSER: rayos que atraviesan hasta 3 enemigos
      const L = (x, vx = 0) => add(x, p.y - 44, vx, -1500, 'pLaser', 17, { pierce: 3, hit: [], r: 8 });
      if (lv === 1 || lv === 2 || lv >= 5) L(p.x);
      if (lv >= 3) { L(p.x - 12); L(p.x + 12); }
      if (lv >= 2) { add(p.x - 24, p.y - 14, -60, -1250, 'pShot', 9); add(p.x + 24, p.y - 14, 60, -1250, 'pShot', 9); }
      if (lv >= 4) { L(p.x - 30, -120); L(p.x + 30, 120); }
    } else if (p.mode === 'nora') {
      // HACKEO: proyectiles que buscan al enemigo más cercano
      const n = lv + 1;
      for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.32; add(p.x + Math.cos(a) * 18, p.y - 24, Math.cos(a) * 820, Math.sin(a) * 820, 'pHack', 9, { homing: true, r: 8 }); }
    } else if (p.mode === 'teo') {
      // FASE: abanico muy abierto
      const n = [3, 5, 5, 7, 9][lv - 1];
      for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.17; add(p.x, p.y - 30, Math.cos(a) * 1150, Math.sin(a) * 1150, 'pWave', 8); }
      if (lv >= 3) add(p.x, p.y - 40, 0, -1300, 'pShot2', 14);
    } else {
      add(p.x - 9, p.y - 34, 0, -1250); add(p.x + 9, p.y - 34, 0, -1250);
      if (lv >= 2) { add(p.x - 24, p.y - 14, -160, -1150, 'pWave', 8); add(p.x + 24, p.y - 14, 160, -1150, 'pWave', 8); }
      if (lv >= 3) add(p.x, p.y - 40, 0, -1300, 'pShot2', 14);
      if (lv >= 4) { add(p.x - 30, p.y - 6, -340, -1050, 'pWave', 8); add(p.x + 30, p.y - 6, 340, -1050, 'pWave', 8); }
      if (lv >= 5) { add(p.x - 18, p.y - 30, -60, -1300, 'pShot2', 14); add(p.x + 18, p.y - 30, 60, -1300, 'pShot2', 14); }
    }
    for (let i = 0; i < p.drones; i++) {
      const d = dronePos(p, i);
      let tx = 0, best = 1e9; // los drones apuntan al enemigo más cercano
      for (const e of G.enemies) { const dd = (e.x - d.x) ** 2 + (e.y - d.y) ** 2; if (e.y < d.y && dd < best) { best = dd; tx = Math.atan2(e.y - d.y, e.x - d.x); } }
      const a = best < 1e9 ? tx : -Math.PI / 2;
      add(d.x, d.y, Math.cos(a) * 1000, Math.sin(a) * 1000, 'dShot', p.droneDmg);
    }
    A.sfx.shoot();
  }
  const dronePos = (p, i) => { const s = i === 0 ? -1 : 1; return { x: p.x + s * 46 + Math.sin(G.time * 3 + i) * 4, y: p.y + 14 + Math.cos(G.time * 3 + i) * 4 }; };

  /* --------------------------- Daño y botín ---------------------------- */
  function killEnemy(e) {
    e.dead = true;
    G.score += Math.round(e.score * D().reward);
    save.stats.kills = (save.stats.kills || 0) + 1;
    if (save.stats.kills >= 500) unlockAch('kills500');
    if (G.tutorial) G.tutorial.kills = (G.tutorial.kills || 0) + 1;
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
      if (g.killed === g.n) { dropItem(e.x, e.y, g.drop); floatText(e.x, e.y - 30, T('¡ESCUADRÓN!'), '#ffe066'); G.score += 1000; unlockAch('squadron'); }
    } else if (Math.random() < 0.035) dropItem(e.x, e.y, ['P', 'S', 'B'][Math.floor(Math.random() * 3)]);
    else if (Math.random() < 0.12) dropItem(e.x, e.y, 'M');
  }
  function dropItem(x, y, kind) { G.items.push({ x, y, kind, vy: 70, t: 0 }); }
  function collect(it) {
    const p = G.player; A.sfx.power();
    if (G.tutorial) G.tutorial.got = true;
    switch (it.kind) {
      case 'P': if (p.power < 5) { p.power++; floatText(it.x, it.y, T('POTENCIA') + ' ' + p.power, '#4fd8ff'); if (p.power >= 5) unlockAch('max_power'); } else { G.score += 2000; floatText(it.x, it.y, '+2000', '#4fd8ff'); } break;
      case 'S': p.shield = p.maxShield; floatText(it.x, it.y, T('ESCUDO'), '#9dff6a'); break;
      case 'B': p.bombs = Math.min(p.maxBombs, p.bombs + 1); floatText(it.x, it.y, T('+PULSO'), '#ffb347'); break;
      case 'D': if (p.drones < 2) { p.drones++; floatText(it.x, it.y, T('DRON'), '#e86bff'); } else { G.score += 2000; floatText(it.x, it.y, '+2000', '#e86bff'); } break;
      case 'M': G.score += 500; floatText(it.x, it.y, '+500', '#ffe066'); break;
    }
  }

  function hurtPlayer() {
    const p = G.player;
    if (p.inv > 0 || p.phaseT > 0 || p.dead > 0) return;
    if (G.tutorial) { p.inv = 1; G.flash = 0.25; A.sfx.hurt(); return; } // en el tutorial no se pierde nada
    A.sfx.hurt(); vibrate(60); p.hits++;
    G.shake = 10; G.flash = 0.35;
    if (p.shield > 1) { p.shield--; p.inv = 1.4; explosion(p.x, p.y, 0.6, '#4fd8ff'); return; }
    // Pierde una vida
    p.lives--; explosion(p.x, p.y, 2.5, '#4fd8ff'); A.sfx.bigExplode(); vibrate(200);
    G.eBullets.length = 0;
    if (p.lives <= 0) { p.dead = 99; gameOver(); return; }
    p.dead = 1.4; p.power = Math.max(1, p.power - 1); p.drones = Math.max(0, p.drones - 1); p.shield = p.maxShield; p.bombs = Math.max(p.bombs, 2);
  }
  const vibrate = ms => M.haptic(ms);

  function usePulse() {
    const p = G.player;
    if (G.mode !== 'play' || G.paused || p.bombs <= 0 || p.dead > 0) return;
    p.bombs--; A.sfx.bomb(); vibrate(120);
    save.stats.pulses = (save.stats.pulses || 0) + 1; if (save.stats.pulses >= 10) unlockAch('pulse10');
    if (G.tutorial) G.tutorial.pulsed = true;
    G.flash = 0.8; G.shake = 16; p.inv = Math.max(p.inv, 1.5);
    for (const b of G.eBullets) particle(b.x, b.y, 0, -60, 0.4, 0.7, '#ffb347');
    G.eBullets.length = 0;
    G.pulseWave = { r: 0, t: 0, x: p.x, y: p.y };
    for (const e of G.enemies) { e.hp -= 150 * PULSE_DAMAGE; e.flash = 0.2; if (e.hp <= 0 && !e.dead) killEnemy(e); }
    if (G.boss && !G.boss.entering) damageBoss({ x: G.boss.x, y: G.boss.y, part: null }, 60 * PULSE_DAMAGE);
  }
  function usePhase() {
    const p = G.player;
    if (G.mode !== 'play' || G.paused || p.phaseCd > 0 || p.dead > 0) return;
    p.phaseT = p.phaseDur; p.phaseCd = p.phaseCdMax; A.sfx.phase(); vibrate(30);
    if (G.tutorial) G.tutorial.phased = true;
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; particle(p.x, p.y, Math.cos(a) * 200, Math.sin(a) * 200, 0.4, 1, '#4fd8ff'); }
  }

  function damageBoss(hb, dmg) {
    const b = G.boss;
    if (!b || b.dead) return;
    if (b.analyzed) dmg *= 1.35; // punto débil conocido gracias a los objetos de las estancias
    if (hb.part) {
      hb.part.hp -= dmg;
      // Cada jefe decide cuánto le duele perder una pieza (partBonus) y cuánto daño le pasa cada impacto en ella (partShare)
      const bonus = b.partBonus !== undefined ? b.partBonus : 0.06, share = b.partShare !== undefined ? b.partShare : 0.25;
      if (hb.part.hp <= 0 && hb.part.alive) { hb.part.alive = false; explosion(hb.x, hb.y, 2, '#ffb347'); A.sfx.bigExplode(); G.score += 2500; G.shake = 8; b.hp -= b.maxHp * bonus; }
      b.hp -= dmg * share;
    } else b.hp -= dmg * (hb.armor !== undefined ? hb.armor : 1);
    b.flash = 0.06;
    if (b.hp <= 0) bossDefeated();
  }

  /* ---------------------------- Actualización ---------------------------- */
  const input = { keys: {}, dx: 0, dy: 0, pointer: null };

  function update(dt) {
    G.dt = dt; G.time += dt;
    G.bulletK = D().bullet; G.fireDt = dt * D().fire;
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
    if (G.gameMode !== 'story' && G.phaseState !== 'cleared') G.runT += dt;

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
      if (G.tutorial) G.tutorial.moved = (G.tutorial.moved || 0) + Math.abs(input.dx) + Math.abs(input.dy) + (mx || my ? 460 * dt : 0);
      p.x += mx * 460 * dt + input.dx; p.y += my * 460 * dt + input.dy;
      input.dx = 0; input.dy = 0;
      p.x = clamp(p.x, 28, G.W - 28); p.y = clamp(p.y, 60, G.H - 44);
      p.tilt += (clamp((p.x - ox) / Math.max(dt, 0.001) / 900, -1, 1) - p.tilt) * Math.min(1, dt * 10);
      p.fireT -= dt;
      const firing = save.settings.autofire || input.pointer || k.Space;
      if (p.fireT <= 0 && firing) { firePlayer(p); p.fireT = FIRE_RATE[p.mode] || 0.1; }
      for (let i = 0; i < 2; i++) particle(p.x + (i ? 6 : -6), p.y + 38, rand(-15, 15), rand(160, 260), 0.18, 0.5, '#4fd8ff');
    }
    p.inv = Math.max(0, p.inv - dt); p.phaseT = Math.max(0, p.phaseT - dt); p.phaseCd = Math.max(0, p.phaseCd - dt);

    /* --- Tutorial / modos extra --- */
    if (G.phaseState === 'tutorial') updateTutorial(dt);
    if (G.gameMode === 'arcade' && G.phaseState === 'level') updateArcade(dt);

    /* --- Guion del nivel --- */
    if (G.phaseState === 'level' && G.gameMode === 'story') {
      G.levelT += dt;
      G.bg.progress = clamp(G.levelT / G.chapter.duration, 0, 1);
      G.waveT -= dt;
      // Punto de control a mitad de misión
      if (!G.checkpoint && G.levelT >= checkpointT()) {
        const p0 = G.player;
        G.checkpoint = { score: G.score, power: p0.power, drones: p0.drones, bombs: p0.bombs };
        floatText(G.W / 2, G.H * 0.35, T('PUNTO DE CONTROL'), '#9dff6a');
      }
      // Cada minuto, una oleada de asalto (y un respiro justo después)
      const minute = Math.floor(G.levelT / ASSAULT_EVERY);
      if (minute > G.lastAssault && G.levelT < G.chapter.duration - 10) {
        G.lastAssault = minute;
        G.banner = { text: T('OLEADA') + ' ' + (minute + 1) + '/' + Math.ceil(G.chapter.duration / ASSAULT_EVERY), sub: T('Tiempo restante') + ' ' + fmtTime(G.chapter.duration - G.levelT), t: 0, dur: 2, color: '#ffb347' };
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
      while (G.commIdx < G.comms.length && G.comms[G.commIdx].t <= G.levelT) showComm(G.comms[G.commIdx++]);
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
          if (b.isSuper) G.banner = { text: ph === 3 ? T('¡NÚCLEO AL DESCUBIERTO!') : T('FASE') + ' ' + (ph + 1) + '/4', sub: T(b.name), t: 0, dur: 2.2, color: '#ff2a5a' };
        }
      }
      if (p.dead <= 0) {
        for (const hb of b.hitboxes()) if (dist2(hb, p) < (hb.r * 0.8 + p.r) ** 2) hurtPlayer();
        if (b.bodyHitboxes) for (const hb of b.bodyHitboxes()) if (dist2(hb, p) < (hb.r + p.r) ** 2) hurtPlayer();
      }
    }

    /* --- Balas del jugador --- */
    for (const s of G.pBullets) {
      if (s.homing) steerBullet(s, dt);
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.y < -40 || s.y > G.H + 40 || s.x < -40 || s.x > G.W + 40) { s.dead = true; continue; }
      for (const e of G.enemies) {
        if (e.dead || e.y < -10) continue;
        if (s.hit && s.hit.includes(e)) continue;
        if (dist2(s, e) < (e.r + s.r) ** 2) {
          e.hp -= s.dmg; e.flash = 0.06; A.sfx.hit();
          if (s.pierce > 0) { s.pierce--; s.hit.push(e); } else s.dead = true;
          particle(s.x, s.y, rand(-80, 80), rand(-40, 60), 0.2, 0.6, '#ffffff');
          if (e.hp <= 0) killEnemy(e);
          if (s.dead) break;
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

    /* --- Objetos (imán según el hangar) --- */
    for (const it of G.items) {
      it.t += dt; it.y += it.vy * dt; it.x += Math.sin(it.t * 2) * 30 * dt;
      // Imán suave hacia la nave
      const d = Math.sqrt(dist2(it, p));
      if (d < p.magnet && p.dead <= 0) { it.x += (p.x - it.x) * dt * 4; it.y += (p.y - it.y) * dt * 4; }
      if (d < 34 && p.dead <= 0) { it.got = true; collect(it); }
      if (it.y > G.H + 40) it.got = true;
    }
    G.items = G.items.filter(i => !i.got);
  }
  const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
  // Proyectiles de Nora: giran hacia el objetivo más cercano
  function steerBullet(s, dt) {
    let best = null, bd = 1e12;
    for (const e of G.enemies) { if (e.dead || e.y < -10) continue; const d = dist2(s, e); if (d < bd) { bd = d; best = e; } }
    if (G.boss && !G.boss.dead && !G.boss.entering) { const hb = G.boss.hitboxes()[0]; if (hb) { const d = dist2(s, hb); if (d < bd) { bd = d; best = hb; } } }
    if (!best) return;
    const sp = Math.hypot(s.vx, s.vy), cur = Math.atan2(s.vy, s.vx), want = Math.atan2(best.y - s.y, best.x - s.x);
    let d = want - cur; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
    const na = cur + clamp(d, -7 * dt, 7 * dt);
    s.vx = Math.cos(na) * sp; s.vy = Math.sin(na) * sp;
  }

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
      const hb0 = b.hitboxes()[0];
      if (b.analyzed && !b.entering && hb0) {
        const hb = hb0, r = hb.r + 10 + Math.sin(G.time * 6) * 4;
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
      Sprites.draw(ctx, 'player_' + p.mode, 0, 0);
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
    const head = G.gameMode === 'story' ? T('MISIÓN') + ' ' + G.chapter.id + '/' + CHAPTERS.length + ' · ' + T(G.chapter.title)
      : G.gameMode === 'arcade' ? T('ARCADE') + ' · ' + T('NIVEL') + ' ' + G.arcadeLevel
      : G.gameMode === 'duel' ? T('JEFES 1 VS 1') + ' · ' + (G.duelIdx + 1) + '/' + DUELS.length
      : T('MODO JEFES') + ' · ' + (G.rushIdx + 1) + '/' + RUSH.length;
    ctx.fillText(head, 20, top + 32);
    const clock = G.gameMode === 'story' ? (G.phaseState === 'level' ? fmtTime(Math.max(0, G.chapter.duration - G.levelT)) : '') : fmtTime(G.runT || 0);
    if (clock) {
      ctx.textAlign = 'right'; ctx.font = '800 22px system-ui, sans-serif'; ctx.fillStyle = '#ffb347';
      ctx.fillText(clock, G.W - 76, top + 6);
      ctx.textAlign = 'left';
    }
    // Vidas
    for (let i = 0; i < p.lives; i++) Sprites.draw(ctx, 'player_' + p.mode, 34 + i * 34, top + 74, 0, 0.36);
    // Escudo
    ctx.fillStyle = 'rgba(232,244,255,0.6)'; ctx.font = '700 12px system-ui, sans-serif'; ctx.fillText(T('ESCUDO'), 20, top + 96);
    for (let i = 0; i < p.maxShield; i++) {
      ctx.fillStyle = i < p.shield ? '#9dff6a' : 'rgba(157,255,106,0.15)';
      ctx.fillRect(80 + i * 26, top + 97, 22, 10);
    }
    // Potencia
    ctx.fillStyle = 'rgba(232,244,255,0.6)'; ctx.fillText(T('POTENCIA'), 20, top + 114);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = i < p.power ? '#4fd8ff' : 'rgba(79,216,255,0.15)'; ctx.fillRect(92 + i * 16, top + 115, 12, 10); }
    // Barra del jefe
    const b = G.boss;
    if (b && !b.dead) {
      const y = top + 140;
      ctx.textAlign = 'center'; ctx.font = '800 14px system-ui, sans-serif'; ctx.fillStyle = '#ffd0da';
      ctx.fillText(T(b.name), G.W / 2, y);
      if (b.analyzed) { ctx.font = '700 11px system-ui, sans-serif'; ctx.fillStyle = '#9dff6a'; ctx.fillText(T('◆ ANALIZADO · +35 % DAÑO'), G.W / 2, y + 38); }
      drawBar(60, y + 20, G.W - 120, b.isSuper ? 14 : 10, b.hp / b.maxHp, b.isSuper ? '#ff2a4f' : '#ff2a5a');
      if (b.phases) { ctx.fillStyle = '#fff'; for (let i = 1; i < b.phases; i++) ctx.fillRect(60 + (G.W - 120) * i / b.phases - 1, y + 17, 2, 20); }
    }
    // Progreso del nivel
    if (G.phaseState === 'level' && G.gameMode === 'story') {
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
    Sprites.draw(ctx, 'player_' + shipMode(), G.W / 2, G.H * 0.8 + Math.sin(menuT * 2) * 8, 0, 1.4);
  }

  /* ---------------------------- Controles UI --------------------------- */
  let lastBombs = -1, lastCd = -1;
  function updateControlsUI() {
    const p = G.player; if (!p) return;
    if (p.bombs !== lastBombs) { $('bombCount').textContent = p.bombs; lastBombs = p.bombs; }
    const cd = Math.round(p.phaseCd / p.phaseCdMax * 50);
    if (cd !== lastCd) { $('phaseRing').style.strokeDashoffset = (276.5 * cd / 50).toFixed(1); lastCd = cd; }
  }

  /* ------------------------------ Entrada ------------------------------ */
  canvas.addEventListener('pointerdown', e => { A.init(); input.pointer = { id: e.pointerId, x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (!input.pointer || input.pointer.id !== e.pointerId) return;
    const k = save.settings.sens / G.cssScale; // sensibilidad: el dedo nunca tapa la nave
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
  const screens = ['title', 'chapters', 'story', 'card', 'pause', 'gameover', 'found', 'files', 'roomFail', 'modes', 'hangar', 'achievements', 'settings', 'buy', 'duels'];
  function show(id) { for (const s of screens) $(s).classList.toggle('show', s === id); }
  function hideAll() { show(null); }
  A.select = () => A.sfx.select();

  function togglePause(force) {
    if (G.mode !== 'play') return;
    G.paused = force === true ? true : !G.paused;
    if (G.paused) show('pause'); else { hideAll(); }
  }

  /* ------------------------------- Ajustes ------------------------------- */
  function applySettings(rebuildSprites) {
    const st = save.settings;
    I18N.setLang(st.lang); M.setVibration(st.vibration); A.setEnabled(save.sound);
    document.body.classList.toggle('big-text', !!st.bigText);
    document.querySelectorAll('#langSwitch button').forEach(b => b.classList.toggle('on', b.dataset.lang === st.lang));
    $('roomInv').dataset.empty = T('INVENTARIO VACÍO');
    if (rebuildSprites) Sprites.build(G.R, { colorblind: st.cbBullets });
    refreshTitle();
  }
  let settingsBack = () => show('title');
  function buildSettings() {
    const st = save.settings, list = $('settingsList'); list.innerHTML = '';
    const seg = (label, opts, cur, pick) => {
      const row = document.createElement('div'); row.className = 'set-row';
      row.innerHTML = `<span>${label}</span>`;
      const box = document.createElement('div'); box.className = 'seg';
      for (const [v, name] of opts) {
        const b = document.createElement('button'); b.textContent = name; if (v === cur) b.className = 'on';
        b.addEventListener('click', () => { pick(v); persist(); A.sfx.select(); buildSettings(); });
        box.appendChild(b);
      }
      row.appendChild(box); list.appendChild(row);
    };
    const yn = [[true, T('SÍ')], [false, T('NO')]];
    seg(T('DIFICULTAD'), M.DIFFICULTY.map((d, i) => [i, T(d.name)]), st.difficulty, v => { st.difficulty = v; });
    // Ficha del nivel elegido, con sus valores exactos
    const d = D(), pct = v => Math.round(v * 100) + ' %';
    const card = document.createElement('div'); card.className = 'diff-card'; card.style.setProperty('--dc', d.color);
    card.innerHTML = `<b>${T(d.name)}</b><p>${T(d.desc)}</p><ul>
      <li><span>${T('Vida de enemigos y jefes')}</span><em>${pct(d.hp)}</em></li>
      <li><span>${T('Velocidad de sus balas')}</span><em>${pct(d.bullet)}</em></li>
      <li><span>${T('Frecuencia de disparo enemigo')}</span><em>${pct(d.fire)}</em></li>
      <li><span>${T('Tus vidas')}</span><em>${d.lives}</em></li>
      <li><span>${T('Escudo')}</span><em>${d.shield > 0 ? '+' + d.shield : d.shield < 0 ? String(d.shield) : '='}</em></li>
      <li><span>${T('Puntos y créditos')}</span><em>${pct(d.reward)}</em></li></ul>
      <small>${T('Se aplica desde la próxima misión que empieces.')}</small>`;
    list.appendChild(card);
    seg(T('IDIOMA'), I18N.LANGS, st.lang, v => { st.lang = v; st.langChosen = true; applySettings(); });
    seg(T('SONIDO'), yn, save.sound, v => { save.sound = v; applySettings(); });
    seg(T('VIBRACIÓN'), yn, st.vibration, v => { st.vibration = v; applySettings(); M.haptic(80); });
    seg(T('DISPARO AUTOMÁTICO'), yn, st.autofire, v => { st.autofire = v; });
    seg(T('TEXTO GRANDE'), yn, st.bigText, v => { st.bigText = v; applySettings(); });
    seg(T('BALAS DE ALTO CONTRASTE (DALTONISMO)'), yn, st.cbBullets, v => { st.cbBullets = v; applySettings(true); });
    const row = document.createElement('div'); row.className = 'set-row';
    row.innerHTML = `<span>${T('SENSIBILIDAD DEL DEDO')} · ${st.sens.toFixed(2)}</span><input type="range" min="0.8" max="2.2" step="0.05" value="${st.sens}">`;
    row.querySelector('input').addEventListener('input', e => { st.sens = parseFloat(e.target.value); row.querySelector('span').textContent = T('SENSIBILIDAD DEL DEDO') + ' · ' + st.sens.toFixed(2); persist(); });
    list.appendChild(row);
  }
  function openSettings(back) { settingsBack = back; buildSettings(); show('settings'); }

  /* -------------------------------- Logros -------------------------------- */
  const toastQ = []; let toastBusy = false;
  function unlockAch(id) {
    if (save.ach[id]) return;
    const a = M.ACHIEVEMENTS.find(x => x.id === id); if (!a) return;
    save.ach[id] = Date.now(); persist(); M.reportAchievement(id);
    toastQ.push(T(a.name)); if (!toastBusy) nextToast();
  }
  async function nextToast() {
    const txt = toastQ.shift(); if (!txt) { toastBusy = false; return; }
    toastBusy = true; $('toastText').textContent = txt; $('toast').classList.add('show'); A.sfx.power();
    await sleep(2600); $('toast').classList.remove('show'); await sleep(400); nextToast();
  }
  function buildAch() {
    const list = $('achList'); list.innerHTML = '';
    const n = M.ACHIEVEMENTS.filter(a => save.ach[a.id]).length;
    $('achCount').textContent = n + ' / ' + M.ACHIEVEMENTS.length;
    for (const a of M.ACHIEVEMENTS) {
      const d = document.createElement('div'); d.className = 'ach' + (save.ach[a.id] ? ' on' : '');
      d.innerHTML = `<div class="ico">${save.ach[a.id] ? '★' : '☆'}</div><div><b>${T(a.name)}</b><small>${T(a.desc)}</small></div>`;
      list.appendChild(d);
    }
  }

  /* -------------------------------- Hangar -------------------------------- */
  let hangarClose = () => show('title');
  const canBuyAny = () => M.UPGRADES.some(u => upgLevel(u.id) < 3 && save.credits >= M.COSTS[upgLevel(u.id)]);
  function buildHangar() {
    $('creditsVal').textContent = save.credits;
    const modes = $('shipModes'); modes.innerHTML = '';
    for (const m of M.SHIP_MODES) {
      const ok = modeUnlocked(m.id), c = CHARACTERS[m.who];
      const b = document.createElement('button');
      b.className = 'mode-card' + (save.shipMode === m.id && ok ? ' active' : '') + (ok ? '' : ' locked');
      b.style.setProperty('--mc', m.color);
      b.innerHTML = `${save.shipMode === m.id && ok ? `<span class="tag">${T('EN USO')}</span>` : ''}<b>${T(m.name)}</b>${T(c.name)}<br><span style="opacity:.75">${ok ? T(m.desc) : T('Se desbloquea al escapar de la estancia') + ' ' + m.unlock}</span>`;
      if (ok) b.addEventListener('click', () => { save.shipMode = m.id; persist(); A.sfx.select(); buildHangar(); });
      modes.appendChild(b);
    }
    const list = $('upgradeList'); list.innerHTML = '';
    for (const u of M.UPGRADES) {
      const lv = upgLevel(u.id), max = lv >= 3, cost = M.COSTS[lv];
      const d = document.createElement('div'); d.className = 'upg';
      d.innerHTML = `<div><b>${T(u.name)}</b> <span class="pips">${[1, 2, 3].map(i => `<i class="${i <= lv ? 'on' : ''}"></i>`).join('')}</span></div>
        <button ${max || save.credits < cost ? 'disabled' : ''}>${max ? T('MÁXIMO') : cost + ' ¢'}</button>
        <small>${T(u.desc)} · ${u.fmt(u.values[lv], lv)}${max ? '' : ' → ' + u.fmt(u.values[lv + 1], lv + 1)}</small>`;
      d.querySelector('button').addEventListener('click', () => {
        if (max || save.credits < cost) return;
        save.credits -= cost; save.upgrades[u.id] = lv + 1; persist(); A.sfx.power(); M.haptic(40);
        if (lv + 1 >= 3) unlockAch('upgrade_max');
        buildHangar();
      });
      list.appendChild(d);
    }
  }
  function openHangar(onClose, label) {
    hangarClose = onClose || (() => show('title'));
    $('hangarBack').textContent = label || T('VOLVER');
    buildHangar(); show('hangar'); A.music('room');
  }

  /* ------------------------------ Historia ------------------------------ */
  function setPortrait(el, who) {
    // Arte encargado (assets/portraits) si existe; si no, el retrato ilustrado de portraits.js
    const c = CHARACTERS[who], art = M.art.portraits[who] || (window.PORTRAITS && window.PORTRAITS[who]);
    el.style.setProperty('--pc', c.color); el.querySelector('span').textContent = c.initial;
    el.classList.toggle('has-art', !!art); el.style.backgroundImage = art ? `url("${art}")` : '';
  }
  /* Diapositivas de historia */
  function storySlides(slides) {
    slides = filterLines(slides);
    return new Promise(resolve => {
      let i = 0, typing = null, full = '';
      const el = $('story'), tEl = $('storyText');
      show('story');
      const render = () => {
        const s = slides[i]; $('storyTitle').textContent = T(s.title); full = T(s.text); tEl.textContent = '';
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

  /* Diálogo con retratos. Admite líneas condicionales y elecciones:
     { who, text, choice: [{ label, set: { vexSaved: true } }, ...] } */
  function dialog(lines) {
    if (!lines || !lines.length) return Promise.resolve();
    const passes = l => (!l.if || flag(l.if)) && (!l.ifNot || !flag(l.ifNot));
    return new Promise(resolve => {
      const prevMode = G.mode;
      G.mode = 'dialog';
      $('controls').classList.remove('show');
      const el = $('dialog'), tEl = $('dlgText'), chEl = $('dlgChoices');
      let i = 0, typing = null, full = '', choosing = false;
      while (i < lines.length && !passes(lines[i])) i++;
      if (i >= lines.length) { G.mode = prevMode; resolve(); return; }
      el.classList.add('show');
      const showChoices = () => {
        const l = lines[i]; chEl.innerHTML = '';
        if (!l.choice) return;
        choosing = true; $('dlgSkip').style.display = 'none';
        for (const opt of l.choice) {
          const b = document.createElement('button'); b.textContent = '▸ ' + T(opt.label);
          b.addEventListener('pointerdown', e => {
            e.stopPropagation(); Object.assign(save.flags, opt.set); persist(); A.sfx.select();
            choosing = false; $('dlgSkip').style.display = ''; advance();
          });
          chEl.appendChild(b);
        }
      };
      const render = () => {
        const l = lines[i], c = CHARACTERS[l.who];
        $('dlgName').textContent = T(c.name); $('dlgName').style.color = c.color;
        $('dlgRole').textContent = T(c.role);
        setPortrait($('dlgPortrait'), l.who);
        full = T(l.text); tEl.textContent = ''; chEl.innerHTML = ''; choosing = false;
        let n = 0; clearInterval(typing);
        typing = setInterval(() => { n += 2; tEl.textContent = full.slice(0, n); if (n % 8 === 0) A.sfx.blip(); if (n >= full.length) { clearInterval(typing); typing = null; showChoices(); } }, 22);
      };
      const advance = () => {
        i++; while (i < lines.length && !passes(lines[i])) i++;
        if (i >= lines.length) return done();
        render();
      };
      const next = () => {
        if (choosing) return;
        if (typing) { clearInterval(typing); typing = null; tEl.textContent = full; showChoices(); return; }
        advance();
      };
      const done = () => {
        clearInterval(typing); el.classList.remove('show'); chEl.innerHTML = ''; $('dlgSkip').style.display = '';
        el.removeEventListener('pointerdown', onTap); $('dlgSkip').removeEventListener('pointerdown', onSkip);
        G.mode = prevMode === 'dialog' ? 'play' : prevMode;
        resolve();
      };
      const onTap = e => { if (e.target.id === 'dlgSkip' || e.target.closest('#dlgChoices')) return; A.init(); next(); };
      // SALTAR no pasa por encima de una elección: se detiene en ella
      const onSkip = e => {
        e.stopPropagation(); if (choosing) return;
        clearInterval(typing); typing = null;
        let j = i + 1;
        while (j < lines.length && !(passes(lines[j]) && lines[j].choice)) j++;
        if (j >= lines.length) return done();
        i = j; render(); clearInterval(typing); typing = null; tEl.textContent = full; showChoices();
      };
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
    const c = CHARACTERS[line.who], el = $('comm'), text = T(line.text);
    $('commName').textContent = T(c.name); $('commName').style.color = c.color;
    $('commText').textContent = text; el.style.borderLeftColor = c.color;
    setPortrait($('commPortrait'), line.who);
    el.classList.add('show'); A.sfx.blip();
    await sleep(Math.max(3200, text.length * 55));
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
    G.tutorial = null; $('tutorial').classList.remove('show');
    $('btnPhase').classList.remove('hilite'); $('btnBomb').classList.remove('hilite');
  }
  const scaleBoss = b => { b.hp = b.maxHp = Math.round(b.maxHp * D().hp); return b; };

  /* opts: { keep: conserva la nave de la misión anterior,
             snap: restaura potencia/drones/pulsos guardados,
             fromCheckpoint: empieza a mitad de misión } */
  async function startChapter(idx, opts = {}) {
    if (idx >= 5 && !isFull()) { showBuy(idx); return; }
    const id = ++runId;
    G.gameMode = 'story';
    G.chapterIdx = idx; G.chapter = CHAPTERS[idx]; G.difficulty = 1 + idx * 0.15;
    resetField();
    if (!opts.keep || !G.player) G.player = newPlayer();
    else {
      const p = G.player; p.mode = shipMode(); p.r = p.mode === 'teo' ? 5 : 7;
      p.x = G.W / 2; p.y = G.H - 200; p.inv = 2; p.dead = 0; p.lives = Math.max(p.lives, D().lives);
      applyUpgrades(p, false);
    }
    if (opts.snap) Object.assign(G.player, { power: opts.snap.power, drones: opts.snap.drones, bombs: Math.max(upg('pulse'), opts.snap.bombs) });
    const p = G.player; p.hits = 0;
    if (!opts.fromCheckpoint) { G.chapterStartScore = G.score; G.missionSnap = { power: p.power, drones: p.drones, bombs: p.bombs }; G.checkpoint = null; }
    G.bg = Backgrounds.create(G.chapter.theme, G.W, G.H, G.R);
    G.levelT = opts.fromCheckpoint ? checkpointT() : 0; G.waveT = 3; G.lastFreeDrop = G.levelT;
    G.lastAssault = Math.floor(G.levelT / ASSAULT_EVERY);
    G.comms = filterLines(G.chapter.comms);
    G.commIdx = G.comms.filter(c => c.t <= G.levelT).length;
    G.phaseState = 'level';
    G.mode = 'dialog'; G.paused = false;
    A.music(G.chapter.theme);

    // Tarjeta de misión
    $('cardNum').textContent = T(ACTS[G.chapter.act]) + ' · ' + T('MISIÓN') + ' ' + G.chapter.id + '/' + CHAPTERS.length;
    $('cardTitle').textContent = T(G.chapter.title);
    $('cardPlace').textContent = opts.fromCheckpoint ? T('Desde el punto de control') + ' · ' + fmtTime(G.chapter.duration - checkpointT()) + ' ' + T('restantes')
      : T(G.chapter.place) + (G.chapter.boss ? (G.chapter.boss.super ? ' · ' + T('SÚPER JEFE') : ' · ' + T('JEFE FINAL')) : '') + ' · ' + T('Dificultad') + ': ' + T(D().name);
    show('card');
    await sleep(2600);
    if (id !== runId) return;
    hideAll();
    if (!opts.fromCheckpoint) await dialog(G.chapter.intro);
    if (id !== runId) return;
    G.mode = 'play';
    $('controls').classList.add('show');
    if (idx === 0 && !save.tutorialDone && !opts.fromCheckpoint) startTutorial();
  }

  async function startBossSequence() {
    const id = runId;
    clearComms();
    G.banner = { text: T('¡ALERTA!'), sub: T(G.chapter.boss.name), t: 0, dur: 2.8, color: '#ff2a5a' };
    A.sfx.alarm(); A.music('boss');
    await sleep(2900);
    if (id !== runId) return;
    await dialog(G.chapter.boss.intro);
    if (id !== runId) return;
    $('controls').classList.add('show');
    G.boss = scaleBoss(Bosses.create(G, G.chapter.boss)); G.boss.analyzed = isAnalyzed(G.chapter.boss.name);
    G.phaseState = 'boss';
  }

  /* Mini jefe: sin diálogo que pare la acción, solo aviso y radio */
  async function startMiniBoss(defOverride) {
    const id = runId;
    const def = defOverride || G.chapter.miniboss;
    G.banner = { text: T('¡MINI JEFE!'), sub: T(def.name), t: 0, dur: 2.4, color: '#ffb347' };
    A.sfx.alarm(); A.music('boss');
    clearComms(); const ln = filterLines([].concat(def.line || []))[0]; if (ln && G.gameMode === 'story') showComm(ln);
    G.phaseState = 'warning';
    await sleep(2200);
    if (id !== runId) return;
    G.boss = scaleBoss(Bosses.create(G, def)); G.boss.mini = true; G.boss.analyzed = isAnalyzed(def.name);
    G.phaseState = 'boss';
  }

  function blowUp(b, big, id) {
    const n = big ? 12 : 6, spread = big ? 120 : 70;
    for (let i = 0; i < n; i++) setTimeout(() => { if (id !== runId) return; explosion(b.x + rand(-spread, spread), b.y + rand(-spread * 0.7, spread * 0.7), big ? rand(1.5, 3) : rand(1.2, 2.2), i % 2 ? '#ffb347' : '#ff4a6a'); A.sfx.explode(); G.shake = big ? 12 : 10; }, i * 140);
    setTimeout(() => { if (id !== runId) return; explosion(b.x, b.y, big ? 6 : 4, '#ffffff'); A.sfx.bigExplode(); G.flash = big ? 1 : 0.7; G.shake = big ? 24 : 18; vibrate(big ? 300 : 200); }, big ? 1800 : 900);
  }

  async function bossDefeated() {
    const b = G.boss; if (b.dead) return;
    b.dead = true; const id = runId;
    G.eBullets.length = 0; G.phaseState = 'cleared'; G.player.inv = 99;
    const bonus = Math.round((b.isSuper ? 50000 : b.mini ? 8000 + 1000 * (G.chapter.id || 1) : 20000 * Math.ceil(G.chapter.id / 5)) * D().reward);
    G.score += bonus;
    floatText(b.x, b.y - 60, '+' + bonus, '#ffe066');
    blowUp(b, !b.mini, id);
    await sleep(b.mini ? 1900 : 3400);
    if (id !== runId) return;
    G.boss = null;
    for (const e of G.enemies) killEnemy(e);
    G.enemies = [];
    const p = G.player; p.inv = 1.5;

    if (G.gameMode === 'arcade') { p.shield = p.maxShield; G.phaseState = 'level'; A.music(G.chapter.theme); return; }
    if (G.gameMode === 'bossrush') { p.shield = p.maxShield; rushNext(); return; }
    if (G.gameMode === 'duel') { duelWin(); return; }

    if (b.mini) { unlockAch('mini_down'); missionComplete(); return; }
    if (b.name === 'FRAGATA LANZA') unlockAch('lanza');
    if (b.name === 'FORJA MADRE') unlockAch('forja');
    if (b.isSuper) unlockAch('ordo');
    const credits = awardCredits();
    floatText(G.W / 2, G.H * 0.5, '+' + credits + ' ' + T('créditos'), '#ffb347');
    await sleep(1200);
    if (id !== runId) return;
    $('controls').classList.remove('show');
    await dialog(G.chapter.outro);
    if (id !== runId) return;
    p.inv = 0;
    nextMission();
  }

  // Créditos para el hangar según los puntos de la misión
  function awardCredits() {
    const gained = Math.max(0, G.score - G.chapterStartScore);
    const c = 150 + Math.round(gained / 25);
    save.credits += c; persist();
    if (G.player && G.player.hits === 0) unlockAch('flawless');
    if (G.chapter.id === 1) unlockAch('first_flight');
    return c;
  }

  function nextMission() {
    save.hiscore = Math.max(save.hiscore, G.score); M.reportScore('story', G.score);
    const next = G.chapterIdx + 1;
    save.unlocked = Math.max(save.unlocked, Math.min(CHAPTERS.length, next + 1));
    persist();
    const room = ROOMS.find(r => r.after === G.chapter.id);
    const go = () => { if (next < CHAPTERS.length) startChapter(next, { keep: true }); else ending(); };
    // Entre misiones: hangar si hay algo que comprar
    const afterRoom = () => (canBuyAny() ? openHangar(go, T('CONTINUAR')) : go());
    if (room) runRoom(room).then(afterRoom); // runRoom solo se resuelve si la familia escapa
    else afterRoom();
  }

  /* Misión sin jefe: sobreviviste hasta el final de la cuenta atrás */
  async function missionComplete() {
    const id = runId;
    clearComms();
    const p = G.player, bonus = Math.round((5000 + p.shield * 1000 + p.lives * 2000) * D().reward);
    G.score += bonus; p.inv = 99;
    const credits = awardCredits();
    G.banner = { text: T('MISIÓN CUMPLIDA'), sub: T('Bonificación') + ' +' + bonus + ' · +' + credits + ' ' + T('créditos'), t: 0, dur: 3, color: '#9dff6a' };
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
  const fmtTime = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  async function ending() {
    G.mode = 'menu'; $('controls').classList.remove('show');
    unlockAch(flag('vexSaved') ? 'end_vex' : 'end_alone');
    if (save.settings.difficulty === 2) unlockAch('hard_clear');
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
  let goRetry = null;
  function gameOver() {
    const id = runId;
    clearComms();
    setTimeout(() => {
      if (id !== runId) return;
      G.mode = 'over'; $('controls').classList.remove('show');
      const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      $('btnCheckpoint').style.display = G.checkpoint && G.gameMode === 'story' ? '' : 'none';
      $('btnNextDuel').style.display = 'none';
      if (G.gameMode === 'arcade') {
        const t = G.runT || 0, best = G.score > save.arcadeBest;
        save.arcadeBest = Math.max(save.arcadeBest, G.score); save.arcadeBestTime = Math.max(save.arcadeBestTime, t);
        M.reportScore('arcade', G.score);
        $('goTitle').textContent = T('FIN DEL ARCADE');
        $('goQuote').textContent = T('Puntos') + ': ' + G.score + ' · ' + T('Tiempo') + ': ' + fmtTime(t) + (best ? ' · ' + T('¡NUEVO RÉCORD!') : '');
        $('btnRetry').textContent = T('JUGAR OTRA VEZ'); goRetry = startArcade;
      } else if (G.gameMode === 'duel') {
        const b = G.boss, left = b ? Math.max(0, Math.round(b.hp / b.maxHp * 100)) : 0;
        $('goTitle').textContent = T('EL ESPERANZA HA CAÍDO');
        $('goQuote').textContent = T(DUELS[G.duelIdx].def.name) + ' · ' + T('Le quedaba') + ' ' + left + ' % ' + T('de vida');
        $('btnRetry').textContent = T('REINTENTAR'); const i = G.duelIdx; goRetry = () => startDuel(i);
      } else if (G.gameMode === 'bossrush') {
        $('goTitle').textContent = T('EL ESPERANZA HA CAÍDO');
        $('goQuote').textContent = T('Jefes derrotados') + ': ' + G.rushIdx + '/' + RUSH.length;
        $('btnRetry').textContent = T('REINTENTAR'); goRetry = startBossRush;
      } else {
        $('goTitle').textContent = T('EL ESPERANZA HA CAÍDO');
        $('goQuote').textContent = T(quote);
        $('btnRetry').textContent = T('REINICIAR MISIÓN');
        goRetry = () => { G.score = G.chapterStartScore; startChapter(G.chapterIdx, { snap: G.missionSnap }); };
      }
      save.hiscore = Math.max(save.hiscore, G.score); persist();
      show('gameover');
    }, 1600);
  }

  function refreshTitle() {
    const parts = [];
    if (save.hiscore) parts.push(T('RÉCORD') + ' · ' + String(save.hiscore).padStart(8, '0'));
    parts.push('¢ ' + save.credits);
    $('hiscore').textContent = parts.join('   ');
    $('demoBadge').style.display = isFull() ? 'none' : '';
  }
  function toTitle() {
    runId++; clearComms();
    G.mode = 'menu'; G.gameMode = 'story'; G.chapter = null; G.player = null; G.paused = false; resetField();
    $('controls').classList.remove('show'); $('dialog').classList.remove('show'); closeRoom();
    G.bg = Backgrounds.create('title', G.W, G.H, G.R);
    refreshTitle();
    show('title'); A.music('title');
  }

  async function newGame() {
    A.init(); A.sfx.select(); A.music('title');
    G.score = 0; G.player = null; save.flags = {}; persist();
    hideAll();
    await storySlides(PROLOGUE);
    save.seenPrologue = true; persist();
    startChapter(0);
  }

  function buildChapterList() {
    const list = $('chapterList'); list.innerHTML = '';
    CHAPTERS.forEach((c, i) => {
      if (i === 0 || CHAPTERS[i - 1].act !== c.act) {
        const h = document.createElement('div'); h.className = 'act-title'; h.textContent = T(ACTS[c.act]); list.appendChild(h);
      }
      const paywall = i >= 5 && !isFull();
      const locked = i + 1 > save.unlocked;
      const b = document.createElement('button');
      b.className = 'btn' + (locked ? ' locked' : '') + (c.boss ? (c.boss.super ? ' super' : ' boss') : '');
      const tag = c.boss ? `<em>${T(c.boss.super ? 'SÚPER JEFE' : 'JEFE')}</em>` : `<em>${T('MINI JEFE')}</em>`;
      b.innerHTML = `${c.id}. ${T(c.title)}${tag}<small>${locked ? T('Bloqueada') : paywall ? T('Juego completo') : T(c.place) + ' · ' + Math.round(c.duration / 60) + ' min'}</small>`;
      b.addEventListener('click', () => { A.init(); A.sfx.select(); G.score = 0; hideAll(); startChapter(i); });
      list.appendChild(b);
      const room = ROOMS.find(r => r.after === c.id);
      if (room) {
        const rl = save.unlocked <= room.after;
        const rb = document.createElement('button');
        rb.className = 'btn room-entry' + (rl ? ' locked' : '');
        rb.innerHTML = `◆ ${T(room.title)}<em>${T('ESTANCIA')}</em><small>${rl ? T('Bloqueada') : T('Misión de personajes · puzle')}</small>`;
        rb.addEventListener('click', () => {
          A.init(); A.sfx.select();
          if (room.after >= 6 && !isFull()) { showBuy(room.after); return; }
          G.score = 0; G.player = newPlayer(); hideAll(); runRoom(room).then(() => startChapter(room.after, { keep: true }));
        });
        list.appendChild(rb);
      }
    });
  }

  /* ------------------------------ Compra ------------------------------ */
  let buyResume = null;
  function showBuy(idx) {
    buyResume = idx;
    runId++; clearComms(); closeRoom();
    G.mode = 'menu'; $('controls').classList.remove('show');
    $('buyBtn').textContent = T('DESBLOQUEAR JUEGO COMPLETO') + ' · ' + M.Store.price;
    show('buy'); A.music('title');
  }
  function onFullGame() {
    save.fullGame = true; persist();
    if ($('buy').classList.contains('show')) { hideAll(); if (buyResume != null) startChapter(buyResume, { keep: !!G.player }); else toTitle(); }
  }
  $('buyBtn').addEventListener('click', () => { A.sfx.select(); M.Store.purchase(); });
  $('buyRestore').addEventListener('click', () => { A.sfx.select(); M.Store.restore(); });
  $('buyBack').addEventListener('click', toTitle);

  /* ---------------------------- Modo Arcade ---------------------------- */
  const ARCADE_THEMES = ['city', 'asteroids', 'crystal', 'forge', 'rift'];
  const MINI_POOL = CHAPTERS.filter(c => c.miniboss).map(c => c.miniboss);
  const ARCADE_LEVEL_T = 75;
  function startArcade() {
    runId++; A.init(); hideAll(); clearComms();
    G.gameMode = 'arcade'; G.score = 0; resetField();
    G.chapter = { id: 15, title: 'ARCADE', theme: 'city', duration: Infinity, comms: [], act: 0 };
    G.player = newPlayer(); G.runT = 0; G.levelT = 0; G.waveT = 2; G.lastFreeDrop = 0; G.arcadeLevel = 1; G.difficulty = 1;
    G.checkpoint = null; G.comms = []; G.phaseState = 'level'; G.mode = 'play'; G.paused = false;
    G.bg = Backgrounds.create('city', G.W, G.H, G.R); A.music('city');
    $('controls').classList.add('show');
    G.banner = { text: T('ARCADE'), sub: T('Sobrevive todo lo que puedas'), t: 0, dur: 2.4, color: '#4fd8ff' };
  }
  function updateArcade(dt) {
    G.levelT += dt; G.waveT -= dt;
    G.difficulty = 1 + G.runT / 60 * 0.4;
    if (G.runT >= 300) unlockAch('arcade5');
    const lvl = 1 + Math.floor(G.runT / ARCADE_LEVEL_T);
    if (lvl !== G.arcadeLevel) {
      G.arcadeLevel = lvl;
      const def = Object.assign({}, MINI_POOL[(lvl - 2) % MINI_POOL.length]);
      def.hp = Math.round(def.hp * (0.7 + 0.15 * lvl));
      const theme = ARCADE_THEMES[(lvl - 1) % ARCADE_THEMES.length];
      G.chapter.theme = theme; G.bg = Backgrounds.create(theme, G.W, G.H, G.R);
      startMiniBoss(def);
      return;
    }
    if (G.waveT <= 0 && G.enemies.length < 45) {
      const set = WAVE_SETS[G.chapter.theme];
      let f = set[Math.floor(Math.random() * set.length)];
      if (f === 'carrier' && G.enemies.some(e => e.type === 'carrier')) f = 'line';
      FORMATIONS[f]();
      G.waveT = Math.max(0.9, 2.4 - G.difficulty * 0.2) + (f === 'carrier' ? 2 : 0);
    }
    if (G.runT - G.lastFreeDrop > 20) { G.lastFreeDrop = G.runT; dropItem(rand(100, G.W - 100), -20, G.player.power < 5 ? 'P' : ['S', 'B', 'D'][Math.floor(Math.random() * 3)]); }
  }

  /* ---------------------------- Modo Jefes ---------------------------- */
  const RUSH = [CHAPTERS[0].miniboss, CHAPTERS[3].miniboss, CHAPTERS[5].miniboss, CHAPTERS[8].miniboss, CHAPTERS[10].miniboss, CHAPTERS[4].boss, CHAPTERS[9].boss, CHAPTERS[14].boss];
  const RUSH_THEMES = ['city', 'asteroids', 'crystal', 'forge', 'rift', 'asteroids', 'forge', 'rift'];
  function startBossRush() {
    if (!isFull()) { showBuy(null); return; }
    runId++; A.init(); hideAll(); clearComms();
    G.gameMode = 'bossrush'; G.score = 0; resetField();
    G.chapter = { id: 15, title: 'MODO JEFES', theme: 'city', duration: Infinity, comms: [], act: 0 };
    G.player = newPlayer(); G.player.power = Math.max(G.player.power, 4); G.player.drones = Math.max(G.player.drones, 1);
    G.runT = 0; G.rushIdx = -1; G.checkpoint = null; G.comms = []; G.mode = 'play'; G.paused = false;
    $('controls').classList.add('show');
    rushNext();
  }
  async function rushNext() {
    const id = runId;
    G.rushIdx++;
    if (G.rushIdx >= RUSH.length) return rushWin();
    const def = RUSH[G.rushIdx];
    G.difficulty = 1 + G.rushIdx * 0.25; G.chapter.theme = RUSH_THEMES[G.rushIdx];
    G.bg = Backgrounds.create(G.chapter.theme, G.W, G.H, G.R); A.music('boss');
    G.phaseState = 'warning';
    G.banner = { text: T('JEFE') + ' ' + (G.rushIdx + 1) + '/' + RUSH.length, sub: T(def.name), t: 0, dur: 2, color: '#ff2a5a' };
    await sleep(2100);
    if (id !== runId) return;
    G.boss = scaleBoss(Bosses.create(G, def)); G.boss.analyzed = isAnalyzed(def.name);
    G.phaseState = 'boss';
  }
  function rushWin() {
    const t = G.runT, best = !save.rushBest || t < save.rushBest;
    if (best) save.rushBest = t;
    unlockAch('bossrush'); M.reportScore('bossrush', Math.round(t * 1000));
    save.credits += 3000; persist();
    G.mode = 'over'; $('controls').classList.remove('show');
    $('goTitle').textContent = T('¡MODO JEFES COMPLETADO!');
    $('goQuote').textContent = T('Tiempo') + ': ' + fmtTime(t) + (best ? ' · ' + T('¡NUEVO RÉCORD!') : '') + ' · +3000 ' + T('créditos');
    $('btnCheckpoint').style.display = 'none'; $('btnNextDuel').style.display = 'none';
    $('btnRetry').textContent = T('JUGAR OTRA VEZ'); goRetry = startBossRush;
    show('gameover');
  }
  function buildModes() {
    $('arcadeBest').textContent = save.arcadeBest ? T('RÉCORD') + ' ' + save.arcadeBest + ' · ' + fmtTime(save.arcadeBestTime) : '';
    $('rushBest').textContent = !isFull() ? T('Juego completo') : save.rushBest ? T('MEJOR TIEMPO') + ' ' + fmtTime(save.rushBest) : '';
  }

  /* ---------------------------- Jefes 1 vs 1 ----------------------------
     Todos los mini jefes, jefes y el súper jefe, en el orden de la historia.
     Se desbloquean derrotando al anterior o llegando a su misión. */
  const DUELS = CHAPTERS.map((c, i) => ({
    idx: i, mission: c.id, theme: c.theme, def: c.boss || c.miniboss,
    kind: c.boss ? (c.boss.super ? 'SÚPER JEFE' : 'JEFE') : 'MINI JEFE',
  }));
  const duelDone = d => save.duels[d.def.name] !== undefined;
  const duelOpen = i => i === 0 || duelDone(DUELS[i - 1]) || save.unlocked >= DUELS[i].mission;
  function buildDuels() {
    const list = $('duelList'); list.innerHTML = '';
    $('duelCount').textContent = T('Derrotados') + ': ' + DUELS.filter(duelDone).length + ' / ' + DUELS.length;
    DUELS.forEach((d, i) => {
      const open = duelOpen(i), paywall = d.mission >= 6 && !isFull(), best = save.duels[d.def.name];
      const b = document.createElement('button');
      b.className = 'btn duel-entry' + (open ? '' : ' locked') + (d.kind === 'MINI JEFE' ? '' : d.kind === 'JEFE' ? ' boss' : ' super');
      b.innerHTML = `${i + 1}. ${T(d.def.name)}<em>${T(d.kind)}</em><small>${!open ? T('Derrota al anterior para desbloquearlo')
        : paywall ? T('Juego completo') : T('MISIÓN') + ' ' + d.mission + ' · ' + (best !== undefined ? `<span class="ok">✓ ${T('MEJOR TIEMPO')} ${fmtTime(best)}</span>` : T('Sin derrotar'))}</small>`;
      if (open) b.addEventListener('click', () => { A.init(); A.sfx.select(); if (paywall) { showBuy(null); return; } startDuel(i); });
      list.appendChild(b);
    });
  }
  async function startDuel(i) {
    const d = DUELS[i];
    runId++; const id = runId;
    A.init(); hideAll(); clearComms();
    G.gameMode = 'duel'; G.duelIdx = i; G.score = 0; resetField();
    G.chapter = { id: d.mission, title: d.def.name, theme: d.theme, duration: Infinity, comms: [], act: 0 };
    G.difficulty = 1 + i * 0.15;
    // Nave con la potencia típica de ese punto de la historia (o la del hangar si es mayor)
    const p = G.player = newPlayer();
    p.power = Math.max(p.power, Math.min(5, 2 + Math.floor(i / 3))); p.drones = Math.max(p.drones, i >= 6 ? 1 : 0);
    G.runT = 0; G.checkpoint = null; G.comms = []; G.mode = 'play'; G.paused = false; G.phaseState = 'warning';
    G.bg = Backgrounds.create(d.theme, G.W, G.H, G.R); A.music('boss');
    $('controls').classList.add('show');
    G.banner = { text: T(d.kind === 'MINI JEFE' ? '¡MINI JEFE!' : '¡ALERTA!'), sub: T(d.def.name), t: 0, dur: 2.2, color: d.kind === 'MINI JEFE' ? '#ffb347' : '#ff2a5a' };
    A.sfx.alarm();
    await sleep(2200);
    if (id !== runId) return;
    G.boss = scaleBoss(Bosses.create(G, d.def)); G.boss.mini = d.kind === 'MINI JEFE'; G.boss.analyzed = isAnalyzed(d.def.name);
    G.runT = 0; G.phaseState = 'boss';
  }
  function duelWin() {
    const d = DUELS[G.duelIdx], t = G.runT, prev = save.duels[d.def.name], best = prev === undefined || t < prev;
    if (best) save.duels[d.def.name] = t;
    const reward = prev === undefined ? 400 + 150 * G.duelIdx : 100;
    save.credits += reward; persist();
    if (DUELS.every(duelDone)) unlockAch('duels_all');
    G.mode = 'over'; $('controls').classList.remove('show');
    $('goTitle').textContent = T('¡JEFE DERROTADO!');
    $('goQuote').textContent = T(d.def.name) + ' · ' + T('Tiempo') + ': ' + fmtTime(t) + (best && prev !== undefined ? ' · ' + T('¡NUEVO RÉCORD!') : '') + ' · +' + reward + ' ' + T('créditos');
    $('btnCheckpoint').style.display = 'none';
    const next = G.duelIdx + 1;
    $('btnNextDuel').style.display = next < DUELS.length ? '' : 'none';
    $('btnRetry').textContent = T('REPETIR'); const i = G.duelIdx; goRetry = () => startDuel(i);
    show('gameover');
  }
  $('btnDuels').addEventListener('click', () => { A.init(); A.sfx.select(); buildDuels(); show('duels'); A.music('title'); });
  $('duelsBack').addEventListener('click', () => { A.sfx.select(); show('title'); });
  $('btnNextDuel').addEventListener('click', () => {
    const next = G.duelIdx + 1; hideAll();
    if (DUELS[next].mission >= 6 && !isFull()) { showBuy(null); return; }
    startDuel(next);
  });

  /* ------------------------------ Tutorial ------------------------------ */
  const TUT = [
    { text: 'Arrastra el dedo por cualquier parte de la pantalla para mover la nave. No hace falta tocar la nave.', done: t => t.moved > 320 },
    { text: 'Tu nave dispara sola. Derriba 5 enemigos.', manual: 'Mantén el dedo en la pantalla para disparar. Derriba 5 enemigos.',
      tick: () => { if (!G.enemies.length) for (let i = 0; i < 3; i++) spawnEnemy('dart', 200 + i * 160, -40 - i * 30, { ai: 'dive', speed: 160, fireT: 999 }); }, done: t => t.kills >= 5 },
    { text: 'Llueven balas. Toca FASE (a la derecha): durante un instante las balas te atraviesan.', hilite: 'btnPhase',
      tick: dt => rain(dt, 0.18), done: t => t.phased },
    { text: 'Toca PULSO (a la izquierda): borra todas las balas y daña a todos los enemigos. Tienes pocas cargas: úsalas en apuros.', hilite: 'btnBomb',
      start: () => { G.player.bombs = Math.max(1, G.player.bombs); }, tick: dt => rain(dt, 0.12), done: t => t.pulsed },
    { text: 'Recoge la cápsula P: mejora tus cañones. Las cápsulas se acercan solas si pasas cerca.',
      start: () => dropItem(G.player.x, Math.max(80, G.player.y - 420), 'P'), done: t => t.got,
      tick: () => { if (!G.items.length && !G.tutorial.got) dropItem(G.player.x, Math.max(80, G.player.y - 420), 'P'); } },
  ];
  function rain(dt, every) {
    G.tutorial.rainT = (G.tutorial.rainT || 0) - dt;
    if (G.tutorial.rainT <= 0) { G.tutorial.rainT = every; G.shot(rand(30, G.W - 30), -10, rand(-20, 20), 170, 'bRed'); }
  }
  function startTutorial() {
    G.tutorial = { step: -1 }; G.phaseState = 'tutorial';
    $('tutorial').classList.add('show');
    nextTutStep();
  }
  function nextTutStep() {
    const t = G.tutorial; t.step++;
    $('btnPhase').classList.remove('hilite'); $('btnBomb').classList.remove('hilite');
    if (t.step >= TUT.length) return finishTutorial(false);
    const st = TUT[t.step];
    Object.assign(t, { moved: 0, kills: 0, phased: false, pulsed: false, got: false });
    $('tutStep').textContent = T('TUTORIAL') + ' · ' + (t.step + 1) + '/' + TUT.length;
    $('tutText').textContent = T(!save.settings.autofire && st.manual ? st.manual : st.text);
    if (st.hilite) $(st.hilite).classList.add('hilite');
    if (st.start) st.start();
    A.sfx.select();
  }
  function updateTutorial(dt) {
    const t = G.tutorial; if (!t) return;
    const st = TUT[t.step];
    if (st.tick) st.tick(dt);
    if (st.done(t)) { t.doneT = (t.doneT || 0) + dt; if (t.doneT > 0.6) { t.doneT = 0; nextTutStep(); } }
  }
  function finishTutorial(skipped) {
    G.tutorial = null; $('tutorial').classList.remove('show');
    $('btnPhase').classList.remove('hilite'); $('btnBomb').classList.remove('hilite');
    save.tutorialDone = true; persist();
    G.eBullets.length = 0; G.enemies.length = 0;
    G.player.bombs = Math.max(G.player.bombs, upg('pulse'));
    G.phaseState = 'level'; G.levelT = 0; G.waveT = 2; G.lastFreeDrop = 0;
    if (!skipped) G.banner = { text: T('¡LISTO!'), sub: T('Sobrevive hasta que acabe la cuenta atrás'), t: 0, dur: 2.4, color: '#9dff6a' };
  }
  $('tutSkip').addEventListener('click', () => { if (G.tutorial) finishTutorial(true); });

  /* ------------------------------- Botones ------------------------------- */
  $('btnPlay').addEventListener('click', newGame);
  document.querySelectorAll('#langSwitch button').forEach(b => b.addEventListener('click', () => {
    save.settings.lang = b.dataset.lang; save.settings.langChosen = true; persist(); A.init(); A.sfx.select(); applySettings();
  }));
  $('btnChapters').addEventListener('click', () => { A.init(); A.sfx.select(); buildChapterList(); show('chapters'); A.music('title'); });
  $('btnBack').addEventListener('click', () => { A.sfx.select(); show('title'); });
  $('btnHangar').addEventListener('click', () => { A.init(); A.sfx.select(); openHangar(() => { show('title'); A.music('title'); }); });
  $('hangarBack').addEventListener('click', () => { A.sfx.select(); const f = hangarClose; hangarClose = null; f && f(); });
  $('btnModes').addEventListener('click', () => { A.init(); A.sfx.select(); buildModes(); show('modes'); });
  $('modesBack').addEventListener('click', () => { A.sfx.select(); show('title'); });
  $('btnArcade').addEventListener('click', startArcade);
  $('btnBossRush').addEventListener('click', () => { A.init(); startBossRush(); });
  $('btnAch').addEventListener('click', () => { A.init(); A.sfx.select(); buildAch(); show('achievements'); });
  $('achBack').addEventListener('click', () => { A.sfx.select(); show('title'); });
  $('btnSettings').addEventListener('click', () => { A.init(); A.sfx.select(); openSettings(() => show('title')); });
  $('btnSettings2').addEventListener('click', () => { A.sfx.select(); openSettings(() => show('pause')); });
  $('settingsBack').addEventListener('click', () => { A.sfx.select(); settingsBack(); });
  $('btnResume').addEventListener('click', () => { G.paused = false; hideAll(); });
  $('btnQuit').addEventListener('click', toTitle);
  $('btnRetry').addEventListener('click', () => { hideAll(); if (goRetry) goRetry(); });
  $('btnCheckpoint').addEventListener('click', () => { G.score = G.checkpoint.score; hideAll(); startChapter(G.chapterIdx, { snap: G.checkpoint, fromCheckpoint: true }); });
  $('btnGoHangar').addEventListener('click', () => { A.sfx.select(); openHangar(() => show('gameover'), T('VOLVER')); });
  $('btnMenu').addEventListener('click', toTitle);

  /* =========================================================================
     ESTANCIAS: misiones de personajes (puzle). Datos en rooms.js.
     ========================================================================= */
  const ROOMS = window.Rooms.ROOMS;
  const ROOM_CHARS = ['dario', 'lia', 'nora', 'teo'];
  const SKILLS = { dario: 'Fuerza', lia: 'Ingeniería', nora: 'Informática', teo: 'Pequeño · invisible' };
  const ROOM_MODE = { 1: 'lia', 2: 'nora', 3: 'teo' }; // modo de armas que desbloquea cada estancia
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
      b.innerHTML = `<span>${T(h.name)}</span>`;
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
    const art = M.art.rooms[R_.room.id];
    if (art) rctx.drawImage(art, 0, 0, Rooms.W, Rooms.H); else Rooms.base(rctx, R_.room.pal, t);
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
      b.innerHTML = `<div class="portrait" style="--pc:${c.color}"><span>${c.initial}</span></div>${T(c.name).split(' ')[0]}<small>${T(SKILLS[k])}</small>`;
      setPortrait(b.querySelector('.portrait'), k);
      b.addEventListener('click', () => { R_.who = k; A.sfx.blip(); roomChars(); });
      box.appendChild(b);
    }
  }
  function roomInv() {
    const box = $('roomInv'); box.innerHTML = '';
    for (const it of R_.inv) {
      const d = Rooms.ITEMS[it], b = document.createElement('div');
      b.className = 'inv-item'; b.innerHTML = `<b>${d.icon}</b>${T(d.name)}`;
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
      $('codeTitle').textContent = T(o.title); $('codeHint').textContent = T(o.hint);
      let val = [];
      const COLORS = { ambar: [T('ÁMBAR'), '#ffb347'], rojo: [T('ROJO'), '#ff2a5a'], azul: [T('AZUL'), '#4fd8ff'], verde: [T('VERDE'), '#9dff6a'] };
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
      $('foundName').textContent = T(o.name); $('foundDesc').textContent = T(o.desc);
      $('foundBosses').innerHTML = o.bosses.map(b => `<div class="boss-entry"><b>${T(b.name)} · ${T('MISIÓN')} ${b.mission}</b>${T(b.weak)}</div>`).join('');
      // Cada estancia (1-3) desbloquea el modo de armas de un personaje
      const modeId = ROOM_MODE[room.id], mode = M.SHIP_MODES.find(m => m.id === modeId);
      $('foundUnlock').textContent = mode && !(save.roomsDone || []).includes(room.id)
        ? '★ ' + T('Nuevo modo de armas en el HANGAR') + ': ' + T(mode.name) + ' (' + T(CHARACTERS[mode.who].name) + ')' : '';
      save.analysis = save.analysis || {};
      for (const b of o.bosses) save.analysis[b.name] = true;
      save.files = Array.from(new Set([...(save.files || []), room.id])); persist();
      if (save.files.length >= ROOMS.length) unlockAch('files_all');
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
      say: (who, text) => dialog([{ who, text }]),  // dialog() traduce
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
      unlockAch('room_any');
      if (save.roomsDone.length >= ROOMS.length) unlockAch('rooms_all');
      if (M.SHIP_MODES.every(m => modeUnlocked(m.id))) unlockAch('all_modes');
      R_.room = null;
      const r = R_.resolve; R_.resolve = null; r && r();
    } else {
      $('room').classList.remove('show');
      $('roomFailText').textContent = T(room.id === 4 ? '«EL HERALDO HA DESPERTADO.» — ORDO' : room.id === 3 ? 'La colada de metal fundido ha llegado a la cabina.' : room.id === 2 ? 'El oxígeno de la sonda se ha agotado.' : 'Los Guardianes del Censo han entrado en la sala de control.');
      show('roomFail');
    }
  }

  /* Ejecuta una estancia. Resuelve cuando la familia escapa. */
  function runRoom(room) {
    return new Promise(async resolve => {
      const myRun = runId;
      R_.id++; R_.room = room; R_.S = {}; R_.inv = []; R_.who = 'dario'; R_.time = room.time; R_.busy = true; R_.resolve = resolve;
      G.mode = 'room'; G.paused = false; resetField(); G.gameMode = 'story';
      $('controls').classList.remove('show'); clearComms();
      A.music('room');
      $('cardNum').textContent = T('MISIÓN ESPECIAL') + ' · ' + T('ESTANCIA') + ' ' + room.id + '/' + ROOMS.length;
      $('cardTitle').textContent = T(room.title); $('cardPlace').textContent = T(room.place);
      show('card');
      await sleep(2600);
      if (myRun !== runId) return;
      hideAll();
      $('roomTitle').textContent = T(room.title); $('roomPlace').textContent = T(room.place);
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
      h.textContent = got ? T(room.object.name) : `${T('ESTANCIA')} ${room.id} · ??? (${T('tras la misión')} ${room.after})`;
      list.appendChild(h);
      for (const b of room.object.bosses) {
        const d = document.createElement('div');
        d.className = 'boss-entry' + (got ? '' : ' locked');
        d.innerHTML = `<b>${got ? T(b.name) : '???'} · ${T('MISIÓN')} ${b.mission}</b>${got ? T(b.weak) : T('Sin analizar.')}`;
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
    if (!G.paused) for (let k = 0; k < (G.timeScale || 1); k++) update(dt); // timeScale: solo para pruebas automáticas
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

  resize(); readSafeArea();
  M.loadArt(Object.keys(CHARACTERS), ROOMS.map(r => r.id));
  M.Store.init(onFullGame);
  applySettings(); toTitle();
  window.addEventListener('resize', () => setTimeout(readSafeArea, 200));
  requestAnimationFrame(frame);

  // Exponer para depuración / pruebas automáticas
  window.__G = G;
  window.__debug = { startChapter, startDuel: i => startDuel(i), DUELS, step: (n, dt) => { for (let k = 0; k < n; k++) update(dt); draw(); }, runRoom: i => runRoom(ROOMS[i]), R_, formations: FORMATIONS, bossDefeated: () => G.boss && (G.boss.hp = 1), skipLevel: () => { G.levelT = G.chapter.duration; G.enemies = []; }, setTime: t => { G.levelT = t; } };
})();

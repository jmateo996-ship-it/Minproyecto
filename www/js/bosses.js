/* =========================================================================
   Jefes: Fragata Lanza (misión 5) · Forja Madre (misión 10) ·
   súper jefe ORDO PRIMORDIAL (misión 15). Mini jefes al final del resto de
   misiones: Guardián del Censo, Torre Centinela (con subnaves), Excavadora,
   Leviatán, Fundidor y Heraldo.
   ========================================================================= */
'use strict';

const Bosses = (() => {
  const TAU = Math.PI * 2;

  function img(w, h, draw) {
    const R = Sprites.R, pad = 40;
    const c = document.createElement('canvas');
    c.width = Math.ceil((w + pad * 2) * R); c.height = Math.ceil((h + pad * 2) * R);
    const g = c.getContext('2d'); g.scale(R, R); g.translate(pad + w / 2, pad + h / 2);
    const glow = (col, b) => { g.shadowColor = col; g.shadowBlur = b * R; };
    draw(g, glow);
    return { c, w: w + pad * 2, h: h + pad * 2 };
  }
  const put = (ctx, im, x, y, rot = 0, a = 1) => {
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); if (rot) ctx.rotate(rot);
    ctx.drawImage(im.c, -im.w / 2, -im.h / 2, im.w, im.h); ctx.restore();
  };
  const poly = (g, pts) => { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); };
  const lg = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach((s, i) => gr.addColorStop(i / (stops.length - 1), s)); return gr; };

  /* ----------------------------------------------------------------- */
  function base(G, def) {
    const hp = Math.round(def.hp * (0.85 + G.difficulty * 0.15));
    return {
      type: def.type, name: def.name, hp, maxHp: hp, t: 0, x: G.W / 2, y: -220, targetY: 310,
      entering: true, dead: false, flash: 0, parts: [], timers: {},
      phase() { const r = this.hp / this.maxHp; return r > 0.66 ? 0 : r > 0.33 ? 1 : 2; },
      every(name, period, fn) {
        this.timers[name] = (this.timers[name] || 0) + (G.fireDt || G.dt); // la dificultad acelera o frena la cadencia
        if (this.timers[name] >= period) { this.timers[name] -= period; fn(); }
      },
    };
  }

  /* ========================= MISIÓN 5 · FRAGATA LANZA======================== */
  function lanza(G, def) {
    const b = base(G, def);
    b.targetY = 275;
    b.body = img(420, 190, (g, glow) => {
      glow('#ff5c8a', 24);
      g.fillStyle = lg(g, 0, -95, 0, 95, ['#3a3f52', '#1a1d2a', '#0a0c14']);
      poly(g, [-60, -90, 60, -90, 210, -30, 200, 10, 80, 30, 30, 95, -30, 95, -80, 30, -200, 10, -210, -30]); g.fill();
      g.shadowBlur = 0; g.strokeStyle = '#ff5c8a'; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#ff5c8a';
      for (let i = -180; i <= 180; i += 30) g.fillRect(i, -12, 14, 3);
      g.fillStyle = '#12141d'; poly(g, [-30, -60, 30, -60, 20, 40, -20, 40]); g.fill();
      g.strokeStyle = '#8a93b0'; g.lineWidth = 1.5; g.stroke();
      // Emblema de Vex
      glow('#ff5c8a', 14); g.strokeStyle = '#ff9db6'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(-14, -40); g.lineTo(0, -12); g.lineTo(14, -40); g.stroke();
    });
    b.cannon = img(50, 70, (g, glow) => {
      glow('#ff3b6b', 14); g.fillStyle = '#2a2d3d'; g.fillRect(-18, -22, 36, 40);
      g.strokeStyle = '#ff6c8f'; g.lineWidth = 2; g.strokeRect(-18, -22, 36, 40);
      g.fillStyle = '#c8d0e8'; g.fillRect(-12, 18, 7, 20); g.fillRect(5, 18, 7, 20);
    });
    b.parts = [
      { ox: -150, oy: 10, r: 26, hp: 300, max: 300, alive: true },
      { ox: 150, oy: 10, r: 26, hp: 300, max: 300, alive: true },
      { ox: -75, oy: 30, r: 22, hp: 220, max: 220, alive: true },
      { ox: 75, oy: 30, r: 22, hp: 220, max: 220, alive: true },
    ];
    b.dir = 1;
    b.update = function (dt) {
      this.t += dt;
      if (this.entering) { this.y += (this.targetY - this.y) * dt * 1.4; if (Math.abs(this.y - this.targetY) < 2) this.entering = false; return; }
      const ph = this.phase();
      this.x += this.dir * (70 + ph * 30) * dt;
      if (this.x > G.W - 170) this.dir = -1; if (this.x < 170) this.dir = 1;
      this.parts.forEach((p, i) => {
        if (!p.alive) return;
        if (i < 2) this.every('s' + i, 0.12, () => { if ((this.t % 2.2) < 1.1 + ph * 0.3) G.shot(this.x + p.ox - 6, this.y + p.oy + 36, 0, 300, 'bRed'), G.shot(this.x + p.ox + 6, this.y + p.oy + 36, 0, 300, 'bRed'); });
        else this.every('a' + i, 1.6 - ph * 0.3, () => G.fan(this.x + p.ox, this.y + p.oy + 30, G.aim(this.x + p.ox, this.y + p.oy), 3, 0.14, 260, 'bOrange'));
      });
      this.every('fan', ph === 0 ? 3 : 1.8, () => G.fan(this.x, this.y + 80, Math.PI / 2, ph === 2 ? 13 : 9, 0.16, 180, 'bViolet'));
      this.every('call', ph === 2 ? 3.5 : 5, () => { G.spawnEnemy('dart', 60, -30); G.spawnEnemy('dart', G.W - 60, -30); });
    };
    b.hitboxes = function () {
      const hb = [{ x: this.x, y: this.y - 10, r: 46, part: null }, { x: this.x, y: this.y + 50, r: 34, part: null }];
      for (const p of this.parts) if (p.alive) hb.push({ x: this.x + p.ox, y: this.y + p.oy, r: p.r, part: p });
      return hb;
    };
    b.draw = function (ctx) {
      put(ctx, this.body, this.x, this.y);
      for (const p of this.parts) if (p.alive) put(ctx, this.cannon, this.x + p.ox, this.y + p.oy);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const sx of [-170, 170]) { ctx.fillStyle = `rgba(255,92,138,${0.5 + 0.3 * Math.sin(this.t * 10)})`; ctx.fillRect(this.x + sx - 10, this.y - 50, 20, 6); }
      ctx.restore();
    };
    return b;
  }

  /* ========================== MISIÓN 10 · FORJA MADRE========================= */
  function forge(G, def) {
    const b = base(G, def);
    b.targetY = 390;
    b.core = img(140, 140, (g, glow) => {
      glow('#ff7a1a', 30);
      const gr = g.createRadialGradient(0, 0, 4, 0, 0, 62);
      gr.addColorStop(0, '#fff3c0'); gr.addColorStop(0.35, '#ff9a2a'); gr.addColorStop(1, '#3a0a00');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 62, 0, TAU); g.fill();
      g.shadowBlur = 0; g.strokeStyle = '#ffd08a'; g.lineWidth = 3; g.stroke();
    });
    b.ringImg = img(400, 400, (g, glow) => {
      glow('#ff5a1a', 16); g.strokeStyle = '#6a3a24'; g.lineWidth = 26;
      g.beginPath(); g.arc(0, 0, 160, 0, TAU); g.stroke();
      g.strokeStyle = '#ff7a2a'; g.lineWidth = 2;
      g.beginPath(); g.arc(0, 0, 147, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, 173, 0, TAU); g.stroke();
      g.shadowBlur = 0; g.fillStyle = '#2a140c';
      for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; g.fillRect(Math.cos(a) * 160 - 4, Math.sin(a) * 160 - 4, 8, 8); }
    });
    b.emitter = img(56, 56, (g, glow) => {
      glow('#ffb347', 18); g.fillStyle = '#3a1a0a'; poly(g, [0, -24, 24, 0, 0, 24, -24, 0]); g.fill();
      g.strokeStyle = '#ffb347'; g.lineWidth = 3; g.stroke();
      g.fillStyle = '#fff0c8'; g.beginPath(); g.arc(0, 0, 7, 0, TAU); g.fill();
    });
    b.parts = Array.from({ length: 6 }, (_, i) => ({ a: i / 6 * TAU, r: 26, hp: 240, max: 240, alive: true }));
    b.rot = 0;
    b.update = function (dt) {
      this.t += dt;
      if (this.entering) { this.y += (this.targetY - this.y) * dt * 1.4; if (Math.abs(this.y - this.targetY) < 2) this.entering = false; return; }
      const alive = this.parts.filter(p => p.alive).length;
      this.rot += dt * (0.5 + (6 - alive) * 0.12);
      this.x = G.W / 2 + Math.sin(this.t * 0.4) * 60;
      this.parts.forEach((p, i) => {
        if (!p.alive) return;
        const a = p.a + this.rot, ex = this.x + Math.cos(a) * 160, ey = this.y + Math.sin(a) * 160;
        this.every('e' + i, 0.32, () => G.shot(ex, ey, Math.cos(a) * 170, Math.sin(a) * 170, 'bOrange'));
      });
      if (alive === 0) {
        this.every('core', 0.07, () => { const a = this.t * 3.1; G.shot(this.x, this.y, Math.cos(a) * 210, Math.sin(a) * 210, 'bRed'); G.shot(this.x, this.y, Math.cos(-a) * 190, Math.sin(-a) * 190, 'bOrange'); });
        this.every('big', 1.6, () => G.fan(this.x, this.y, G.aim(this.x, this.y), 3, 0.25, 160, 'bBig'));
      } else {
        this.every('ring', 2.6, () => G.ring(this.x, this.y, 16, 150, this.rot, 'bRed'));
      }
    };
    b.hitboxes = function () {
      const shielded = this.parts.some(p => p.alive);
      const hb = [{ x: this.x, y: this.y, r: 58, part: null, armor: shielded ? 0.12 : 1 }];
      for (const p of this.parts) if (p.alive) { const a = p.a + this.rot; hb.push({ x: this.x + Math.cos(a) * 160, y: this.y + Math.sin(a) * 160, r: p.r, part: p }); }
      return hb;
    };
    b.draw = function (ctx) {
      put(ctx, this.ringImg, this.x, this.y, this.rot);
      const shielded = this.parts.some(p => p.alive);
      put(ctx, this.core, this.x, this.y, 0, 1);
      if (shielded) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(255,180,80,${0.4 + 0.2 * Math.sin(this.t * 6)})`; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(this.x, this.y, 76, 0, TAU); ctx.stroke(); ctx.restore();
      }
      for (const p of this.parts) if (p.alive) { const a = p.a + this.rot; put(ctx, this.emitter, this.x + Math.cos(a) * 160, this.y + Math.sin(a) * 160, a); }
    };
    return b;
  }

  /* ================== MISIÓN 15 · SÚPER JEFE: ORDO PRIMORDIAL ==================
     Cuatro fases (75 % / 50 % / 25 %). Seis satélites que bloquean los disparos;
     en la última fase los satélites estallan y el núcleo queda al desnudo. */
  function superordo(G, def) {
    const b = base(G, def);
    b.targetY = 400; b.phases = 4; b.isSuper = true;
    b.phase = function () { const r = this.hp / this.maxHp; return r > 0.75 ? 0 : r > 0.5 ? 1 : r > 0.25 ? 2 : 3; };
    b.eye = img(300, 300, (g, glow) => {
      glow('#ff2a4f', 50);
      const gr = g.createRadialGradient(0, 0, 12, 0, 0, 135);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.18, '#ff6a8a'); gr.addColorStop(0.5, '#7a0a2a'); gr.addColorStop(1, '#14020a');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 135, 0, TAU); g.fill();
      g.shadowBlur = 0; g.strokeStyle = '#ff9db6'; g.lineWidth = 4; g.stroke();
      g.strokeStyle = 'rgba(255,157,182,0.35)'; g.lineWidth = 2;
      for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; g.beginPath(); g.moveTo(Math.cos(a) * 52, Math.sin(a) * 52); g.lineTo(Math.cos(a) * 130, Math.sin(a) * 130); g.stroke(); }
      g.strokeStyle = 'rgba(255,220,230,0.5)'; g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, 100, 0, TAU); g.stroke();
    });
    b.halo = img(620, 620, (g, glow) => {
      glow('#c46bff', 24); g.strokeStyle = 'rgba(196,107,255,0.85)'; g.lineWidth = 4;
      for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(0, 0, 190 + i * 30, i * 0.9, i * 0.9 + TAU * 0.78); g.stroke(); }
      g.fillStyle = '#e8c8ff';
      for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; g.fillRect(Math.cos(a) * 292 - 4, Math.sin(a) * 292 - 4, 8, 8); }
      glow('#ff2a4f', 16); g.strokeStyle = 'rgba(255,42,79,0.6)'; g.lineWidth = 2;
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.beginPath(); g.moveTo(Math.cos(a) * 150, Math.sin(a) * 150); g.lineTo(Math.cos(a) * 280, Math.sin(a) * 280); g.stroke(); }
    });
    b.sat = img(66, 66, (g, glow) => {
      glow('#c46bff', 18); g.fillStyle = '#1a0830'; g.beginPath(); g.arc(0, 0, 26, 0, TAU); g.fill();
      g.strokeStyle = '#d49bff'; g.lineWidth = 3; g.stroke();
      g.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 16, Math.sin(a) * 16); } g.closePath(); g.stroke();
      g.fillStyle = '#ff2a4f'; g.beginPath(); g.arc(0, 0, 7, 0, TAU); g.fill();
    });
    b.rot = 0; b.sats = 6; b.satR = 200; b.lastPh = 0;
    const wall = () => {
      const gx = clampX(G.player.x + (Math.random() - 0.5) * 260);
      for (let x = 18; x < G.W; x += 34) if (Math.abs(x - gx) > 85) G.shot(x, -12, 0, 150, 'bOrange');
    };
    const clampX = x => Math.max(100, Math.min(G.W - 100, x));
    b.update = function (dt) {
      this.t += dt;
      if (this.entering) { this.y += (this.targetY - this.y) * dt * 0.9; if (Math.abs(this.y - this.targetY) < 2) this.entering = false; return; }
      const ph = this.phase();
      if (ph !== this.lastPh) {
        this.lastPh = ph;
        if (ph === 3) { for (const s of this.satPos()) G.explode(s.x, s.y, 2.2, '#c46bff'); this.sats = 0; }
      }
      this.rot += dt * (0.7 + ph * 0.35);
      this.x = G.W / 2 + Math.sin(this.t * (ph === 3 ? 0.8 : 0.35)) * (ph === 3 ? 190 : 100);
      if (ph === 0) {
        this.every('ring', 1.0, () => G.ring(this.x, this.y, 26, 165, this.t * 0.7, 'bRed', 0.25));
        this.every('aim', 1.3, () => G.fan(this.x, this.y + 80, G.aim(this.x, this.y), 5, 0.12, 290, 'bViolet'));
      } else if (ph === 1) {
        this.every('sp', 0.08, () => {
          const a = this.t * 2.3;
          for (let k = 0; k < 3; k++) { const aa = a + k * TAU / 3; G.shot(this.x, this.y, Math.cos(aa) * 200, Math.sin(aa) * 200, 'bViolet'); }
          for (let k = 0; k < 2; k++) { const aa = -a * 0.8 + k * Math.PI; G.shot(this.x, this.y, Math.cos(aa) * 170, Math.sin(aa) * 170, 'bRed'); }
        });
        this.every('kami', 3, () => { G.spawnEnemy('kamikaze', 80, -20); G.spawnEnemy('kamikaze', G.W - 80, -20); });
      } else if (ph === 2) {
        this.every('wall', 2.4, wall);
        this.every('flower', 1.1, () => { for (let k = 0; k < 24; k++) { const a = k / 24 * TAU + this.t; const s = 140 + 50 * Math.sin(k * 3); G.shot(this.x, this.y, Math.cos(a) * s, Math.sin(a) * s, k % 2 ? 'bRed' : 'bViolet'); } });
        this.every('big', 1.6, () => G.fan(this.x, this.y, G.aim(this.x, this.y), 3, 0.3, 200, 'bBig'));
      } else {
        // Núcleo al desnudo: furia final
        this.every('sp4', 0.07, () => {
          const a = this.t * 1.9;
          for (let k = 0; k < 4; k++) { const aa = a + k * TAU / 4; G.shot(this.x, this.y, Math.cos(aa) * 165, Math.sin(aa) * 165, k % 2 ? 'bRed' : 'bViolet'); }
        });
        this.every('burst', 1.3, () => G.fan(this.x, this.y, G.aim(this.x, this.y), 5, 0.22, 230, 'bBig'));
        this.every('ring', 2.2, () => G.ring(this.x, this.y, 20, 130, this.t, 'bCyan', 0.2));
        this.every('kami', 3.5, () => G.spawnEnemy('kamikaze', G.player.x < G.W / 2 ? G.W - 60 : 60, -20));
      }
    };
    b.satPos = function () {
      const out = [];
      for (let i = 0; i < this.sats; i++) { const a = this.rot * 1.3 + i / this.sats * TAU; out.push({ x: this.x + Math.cos(a) * this.satR, y: this.y + Math.sin(a) * this.satR * 0.85 }); }
      return out;
    };
    b.hitboxes = function () { return [{ x: this.x, y: this.y, r: 118, part: null }]; };
    b.shields = function () { return this.satPos().map(p => ({ x: p.x, y: p.y, r: 30 })); };
    b.draw = function (ctx) {
      const ph = this.phase();
      put(ctx, this.halo, this.x, this.y, this.rot * 0.4, ph === 3 ? 0.35 + 0.2 * Math.sin(this.t * 12) : 1);
      const pulse = 1 + 0.05 * Math.sin(this.t * 5) + (ph >= 2 ? 0.05 * Math.sin(this.t * 17) : 0);
      ctx.save(); ctx.translate(this.x, this.y); ctx.scale(pulse, pulse); put(ctx, this.eye, 0, 0); ctx.restore();
      const a = G.aim(this.x, this.y), px = this.x + Math.cos(a) * 42, py = this.y + Math.sin(a) * 42;
      ctx.fillStyle = '#050005'; ctx.beginPath(); ctx.ellipse(px, py, 18, ph === 3 ? 12 : 34, a + Math.PI / 2, 0, TAU); ctx.fill();
      if (ph === 3) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(255,42,79,${0.5 + 0.4 * Math.sin(this.t * 20)})`; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(this.x, this.y, 150 + 10 * Math.sin(this.t * 9), 0, TAU); ctx.stroke(); ctx.restore();
      }
      for (const s of this.satPos()) put(ctx, this.sat, s.x, s.y, this.t * 2);
    };
    return b;
  }

  /* ====================== MINI JEFE · GUARDIÁN DEL CENSO ====================== */
  function censor(G, def) {
    const b = base(G, def);
    b.body = img(300, 150, (g, glow) => {
      glow('#ff2a5a', 26);
      g.fillStyle = lg(g, -150, 0, 150, 0, ['#2a0612', '#6a1430', '#2a0612']);
      poly(g, [-90, -70, 90, -70, 150, -10, 120, 50, 40, 75, -40, 75, -120, 50, -150, -10]); g.fill();
      g.shadowBlur = 0; g.strokeStyle = '#ff6c8f'; g.lineWidth = 2.5; g.stroke();
      g.strokeStyle = 'rgba(255,108,143,0.3)'; g.lineWidth = 1.5;
      for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 30, -60); g.lineTo(i * 22, 66); g.stroke(); }
      g.fillStyle = '#0c0206'; g.beginPath(); g.ellipse(0, 6, 54, 38, 0, 0, TAU); g.fill();
      g.strokeStyle = '#ff2a5a'; g.lineWidth = 3; g.stroke();
    });
    b.turret = img(60, 60, (g, glow) => {
      glow('#ff8a2a', 16); g.fillStyle = '#3a1406'; g.beginPath(); g.arc(0, 0, 26, 0, TAU); g.fill();
      g.strokeStyle = '#ffb36b'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#ffb36b'; g.fillRect(-5, 0, 10, 30);
    });
    // Opciones por misión: turretHp (vida de cada torreta) y escorts (pide cazas de escolta)
    const th = def.turretHp || 260;
    b.parts = [{ ox: -112, oy: 24, r: 28, hp: th, max: th, alive: true }, { ox: 112, oy: 24, r: 28, hp: th, max: th, alive: true }];
    b.spiral = 0;
    b.update = function (dt) {
      this.t += dt;
      if (this.entering) { this.y += (this.targetY - this.y) * dt * 1.6; if (Math.abs(this.y - this.targetY) < 2) this.entering = false; return; }
      this.x = G.W / 2 + Math.sin(this.t * 0.55) * 170;
      const ph = this.phase();
      for (const p of this.parts) if (p.alive) {
        this.every('t' + p.ox, ph === 0 ? 1.4 : 1.0, () => G.fan(this.x + p.ox, this.y + p.oy + 20, G.aim(this.x + p.ox, this.y + p.oy), ph === 0 ? 3 : 5, 0.22, 230, 'bOrange'));
      }
      this.every('ring', ph === 2 ? 1.4 : 2.4, () => G.ring(this.x, this.y + 10, ph === 0 ? 14 : 20, 170, this.t, 'bRed'));
      if (ph >= 1) this.every('spiral', 0.09, () => { this.spiral += 0.37; G.shot(this.x, this.y + 10, Math.cos(this.spiral) * 200, Math.sin(this.spiral) * 200, 'bViolet'); });
      if (def.escorts) this.every('escort', ph === 2 ? 4.5 : 6.5, () => { G.spawnEnemy('dart', this.x - 140, this.y + 20, { ai: 'dive', speed: 300 }); G.spawnEnemy('dart', this.x + 140, this.y + 20, { ai: 'dive', speed: 300 }); });
    };
    b.hitboxes = function () {
      const hb = [{ x: this.x, y: this.y + 6, r: 52, part: null }];
      for (const p of this.parts) if (p.alive) hb.push({ x: this.x + p.ox, y: this.y + p.oy, r: p.r, part: p });
      return hb;
    };
    b.draw = function (ctx) {
      put(ctx, this.body, this.x, this.y);
      for (const p of this.parts) if (p.alive) put(ctx, this.turret, this.x + p.ox, this.y + p.oy, G.aim(this.x + p.ox, this.y + p.oy) - Math.PI / 2);
      // Ojo que escanea
      const ex = this.x + Math.sin(this.t * 2) * 26;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createRadialGradient(ex, this.y + 6, 0, ex, this.y + 6, 30);
      gr.addColorStop(0, '#fff'); gr.addColorStop(0.3, '#ff2a5a'); gr.addColorStop(1, 'rgba(255,0,60,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(ex, this.y + 6, 30, 0, TAU); ctx.fill();
      ctx.restore();
    };
    return b;
  }


  /* ======================== MINI JEFE · LEVIATÁN VÍTREO  ======================= */
  function leviathan(G, def) {
    const b = base(G, def);
    b.y = -100; b.targetY = 380;
    b.head = img(120, 130, (g, glow) => {
      glow('#6ff', 26);
      g.fillStyle = lg(g, -60, -60, 60, 60, ['#d8ffff', '#2a90c0', '#0a2a4a']);
      poly(g, [0, 64, 40, 30, 58, -10, 36, -56, 0, -40, -36, -56, -58, -10, -40, 30]); g.fill();
      g.shadowBlur = 0; g.strokeStyle = '#e0ffff'; g.lineWidth = 2; g.stroke();
      glow('#ff2a5a', 18); g.fillStyle = '#ff2a5a';
      g.beginPath(); g.ellipse(-20, 6, 9, 5, 0.4, 0, TAU); g.ellipse(20, 6, 9, 5, -0.4, 0, TAU); g.fill();
    });
    b.seg = img(70, 70, (g, glow) => {
      glow('#5ff', 18);
      g.fillStyle = lg(g, -30, -30, 30, 30, ['rgba(200,255,255,0.9)', 'rgba(40,140,200,0.85)', 'rgba(10,40,80,0.9)']);
      poly(g, [0, -30, 30, 0, 0, 30, -30, 0]); g.fill();
      g.shadowBlur = 0; g.strokeStyle = '#cff'; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.5)'; poly(g, [0, -18, 10, 0, 0, 18, -10, 0]); g.fill();
    });
    b.trail = []; b.segs = 14; b.ang = Math.PI / 2;
    b.update = function (dt) {
      this.t += dt;
      const ph = this.phase();
      const sp = 0.55 + ph * 0.2;
      const tx = G.W / 2 + Math.sin(this.t * sp) * (G.W * 0.36);
      const ty = (this.entering ? 380 : 370) + Math.sin(this.t * sp * 1.7) * 160;
      const px = this.x, py = this.y;
      this.x += (tx - this.x) * dt * 1.8; this.y += (ty - this.y) * dt * 1.8;
      this.ang = Math.atan2(this.y - py, this.x - px) || this.ang;
      this.trail.unshift({ x: this.x, y: this.y });
      if (this.trail.length > this.segs * 7 + 2) this.trail.pop();
      if (this.t > 2.5) this.entering = false;
      if (this.entering) return;
      this.every('shard', ph === 0 ? 1.3 : 0.8, () => G.fan(this.x, this.y, G.aim(this.x, this.y), ph === 2 ? 7 : 5, 0.18, 240, 'bCyan'));
      this.every('segShot', ph === 0 ? 2.2 : 1.4, () => {
        for (let i = 2; i < this.segs; i += 3) { const p = this.trail[i * 7]; if (p) G.ring(p.x, p.y, 6, 130, this.t + i, 'bViolet'); }
      });
      if (ph === 2) this.every('spray', 0.2, () => G.shot(this.x, this.y, Math.cos(this.ang) * 260 + (Math.random() - 0.5) * 120, Math.sin(this.ang) * 260 + (Math.random() - 0.5) * 120, 'bCyan'));
    };
    b.hitboxes = function () { return [{ x: this.x, y: this.y, r: 46, part: null }]; };
    b.bodyHitboxes = function () {
      const hb = [];
      for (let i = 1; i < this.segs; i++) { const p = this.trail[i * 7]; if (p) hb.push({ x: p.x, y: p.y, r: 22 }); }
      return hb;
    };
    b.draw = function (ctx) {
      for (let i = this.segs - 1; i >= 1; i--) {
        const p = this.trail[i * 7]; if (!p) continue;
        const s = 1 - i / this.segs * 0.45;
        put(ctx, this.seg, p.x, p.y, this.t * 0.6 + i * 0.4, 0.95);
        if (s < 1) { /* escala implícita por el orden */ }
      }
      put(ctx, this.head, this.x, this.y, this.ang - Math.PI / 2);
    };
    return b;
  }


  /* ===================== MINI JEFE · TORRE CENTINELA =====================
     Misión 2. Una torre de mando que dirige una escuadrilla de 4 subnaves.
     Las subnaves la rodean, se lanzan en picado contra el jugador cuando la
     torre lo ordena y vuelven a la formación. Mientras queden 2 o más, la
     torre está blindada. Si caen, la torre lanza relevos desde sus hangares. */
  function sentinel(G, def) {
    const b = base(G, def);
    b.targetY = 300;
    const CY = '#4fd8ff', VI = '#b34dff';
    b.body = img(240, 240, (g, glow) => {
      // Plataforma octogonal
      glow(CY, 22);
      const pts = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + Math.PI / 8; pts.push(Math.cos(a) * 112, Math.sin(a) * 112); }
      g.fillStyle = lg(g, -112, -112, 112, 112, ['#16304a', '#0a1626', '#1c2c48']); poly(g, pts); g.fill();
      g.shadowBlur = 0; g.strokeStyle = '#7fe8ff'; g.lineWidth = 3; g.stroke();
      // Hangares de las subnaves (diagonales)
      for (let i = 0; i < 4; i++) {
        const a = i / 4 * TAU + Math.PI / 4;
        g.save(); g.translate(Math.cos(a) * 80, Math.sin(a) * 80); g.rotate(a);
        g.fillStyle = '#050b14'; g.fillRect(-14, -10, 28, 20);
        glow(VI, 10); g.strokeStyle = VI; g.lineWidth = 2; g.strokeRect(-14, -10, 28, 20); g.shadowBlur = 0;
        g.restore();
      }
      // Anillos interiores y aguja central
      g.strokeStyle = 'rgba(127,232,255,0.35)'; g.lineWidth = 2;
      for (const r of [70, 50]) { g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); }
      g.fillStyle = lg(g, -34, -34, 34, 34, ['#dff6ff', '#3a7fb0', '#0c1c30']);
      poly(g, [0, -40, 30, -12, 22, 30, -22, 30, -30, -12]); g.fill();
      g.strokeStyle = '#e8fbff'; g.lineWidth = 2; g.stroke();
    });
    b.sub = img(54, 54, (g, glow) => {
      glow(CY, 14);
      g.fillStyle = lg(g, -20, 0, 20, 0, ['#1a2a50', '#3a6ab0', '#1a2a50']);
      poly(g, [0, 22, 18, -8, 8, -4, 0, -18, -8, -4, -18, -8]); g.fill();
      g.shadowBlur = 0; g.strokeStyle = '#9ff0ff'; g.lineWidth = 1.5; g.stroke();
      glow(VI, 10); g.fillStyle = '#f0d6ff'; g.beginPath(); g.arc(0, 4, 4, 0, TAU); g.fill();
    });
    const subHp = Math.round(300 * (0.85 + G.difficulty * 0.15));
    b.subs = Array.from({ length: 4 }, (_, i) => ({ i, r: 20, hp: subHp, max: subHp, alive: false, state: 'dock', x: 0, y: 0, ang: 0, t: 0, respawn: 0 }));
    b.relays = 4;           // relevos disponibles
    b.parts = b.subs;       // para que el motor las trate como piezas destructibles
    b.partBonus = 0.04; b.partShare = 0; // derribar subnaves debilita la torre, pero el núcleo es el objetivo
    b.cmdT = 0; b.sweepT = 0;
    const slot = (s, t) => { const a = t * 0.9 + s.i * TAU / 4; return { x: b.x + Math.cos(a) * 160, y: b.y + Math.sin(a) * 100 }; };
    const launch = s => { s.alive = true; s.hp = s.max; s.state = 'launch'; s.t = 0; s.x = b.x; s.y = b.y; };
    b.update = function (dt) {
      this.t += dt;
      if (this.entering) {
        this.y += (this.targetY - this.y) * dt * 1.5;
        if (Math.abs(this.y - this.targetY) < 2) { this.entering = false; this.subs.forEach(launch); }
        return;
      }
      const ph = this.phase();
      this.x = G.W / 2 + Math.sin(this.t * 0.4) * 140;
      // Subnaves
      for (const s of this.subs) {
        if (!s.alive) {
          if (s.state !== 'dock' && this.relays > 0) { s.respawn += dt; if (s.respawn > 4) { s.respawn = 0; this.relays--; launch(s); } }
          continue;
        }
        s.t += dt;
        const home = slot(s, this.t);
        if (s.state === 'launch' || s.state === 'return') {
          // Vuela hacia su puesto en la formación (que se mueve) a velocidad fija
          const dx = home.x - s.x, dy = home.y - s.y, d = Math.hypot(dx, dy) || 1;
          const step = Math.min(d, (s.state === 'launch' ? 380 : 320) * dt);
          s.x += dx / d * step; s.y += dy / d * step;
          s.ang = Math.atan2(dy, dx) - Math.PI / 2;
          if (d < 14) s.state = 'orbit';
        } else if (s.state === 'orbit') {
          s.x = home.x; s.y = home.y; s.ang = G.aim(s.x, s.y) - Math.PI / 2;
          this.every('subfire' + s.i, 1.8 + s.i * 0.15, () => G.shot(s.x, s.y + 10, Math.cos(G.aim(s.x, s.y)) * 230, Math.sin(G.aim(s.x, s.y)) * 230, 'bCyan'));
        } else if (s.state === 'dive') {
          const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy) || 1;
          s.x += dx / d * 430 * dt; s.y += dy / d * 430 * dt; s.ang = Math.atan2(dy, dx) - Math.PI / 2;
          if (d < 20 || s.t > 1.6) { s.state = 'return'; s.t = 0; G.fan(s.x, s.y, -Math.PI / 2 + Math.PI, 3, 0.35, 160, 'bViolet'); }
        }
      }
      // Órdenes de ataque
      this.cmdT += dt;
      const every = [2.4, 1.6, 1.1][ph];
      if (this.cmdT > every) {
        this.cmdT = 0;
        const ready = this.subs.filter(s => s.alive && s.state === 'orbit');
        for (let k = 0; k < (ph === 2 ? 2 : 1) && ready.length; k++) {
          const s = ready.splice(Math.floor(Math.random() * ready.length), 1)[0];
          s.state = 'dive'; s.t = 0; s.tx = G.player.x; s.ty = Math.min(G.player.y, G.H - 120);
          G.fan(s.x, s.y, G.aim(s.x, s.y), 3, 0.2, 260, 'bCyan');
          s.cmdFlash = 0.4;
        }
      }
      for (const s of this.subs) if (s.cmdFlash) s.cmdFlash = Math.max(0, s.cmdFlash - dt);
      // La torre: barrido de reflector y anillos
      this.sweepT = (this.sweepT + dt) % 4;
      if (this.sweepT < 2.4) this.every('sweep', 0.11, () => {
        const a = Math.PI / 2 + Math.sin(this.t * 2.2) * 1.0;
        G.shot(this.x, this.y + 30, Math.cos(a) * 240, Math.sin(a) * 240, 'bViolet');
      });
      if (ph >= 1) this.every('ring', ph === 2 ? 1.8 : 2.8, () => G.ring(this.x, this.y, 12, 150, this.t, 'bCyan', 0.2));
    };
    const armored = () => b.subs.filter(s => s.alive).length >= 2;
    b.hitboxes = function () {
      const hb = [{ x: this.x, y: this.y, r: 60, part: null, armor: armored() ? 0.2 : 1 }];
      for (const s of this.subs) if (s.alive && s.state !== 'launch') hb.push({ x: s.x, y: s.y, r: s.r, part: s });
      return hb;
    };
    b.draw = function (ctx) {
      // Enlaces de mando hacia cada subnave
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const s of this.subs) if (s.alive) {
        const a = s.state === 'dive' ? 0.75 : 0.25 + 0.15 * Math.sin(this.t * 6 + s.i);
        ctx.strokeStyle = `rgba(179,77,255,${a + (s.cmdFlash || 0)})`; ctx.lineWidth = s.state === 'dive' ? 2.5 : 1.5;
        ctx.setLineDash([8, 6]); ctx.lineDashOffset = -this.t * 40;
        ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(s.x, s.y); ctx.stroke();
      }
      ctx.restore();
      put(ctx, this.body, this.x, this.y, Math.sin(this.t * 0.3) * 0.15);
      // Antena giratoria y faro
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.t * 1.6);
      ctx.strokeStyle = 'rgba(127,232,255,0.8)'; ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 0, 92, i * TAU / 3, i * TAU / 3 + 0.7); ctx.stroke(); }
      ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createRadialGradient(this.x, this.y - 6, 0, this.x, this.y - 6, 34);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, CY); gr.addColorStop(1, 'rgba(79,216,255,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(this.x, this.y - 6, 34 + 4 * Math.sin(this.t * 5), 0, TAU); ctx.fill();
      if (armored()) { ctx.strokeStyle = `rgba(79,216,255,${0.35 + 0.2 * Math.sin(this.t * 7)})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(this.x, this.y, 70, 0, TAU); ctx.stroke(); }
      ctx.restore();
      for (const s of this.subs) if (s.alive) put(ctx, this.sub, s.x, s.y, s.ang);
    };
    return b;
  }

  /* ==================== MINI JEFE · GUARDIÁN DE LA CÚPULA ====================
     Misión 3. Un núcleo dorado protegido por un anillo giratorio de placas
     de cristal con tres huecos: hay que disparar por los huecos. Desde el
     borde de la cúpula deja caer cortinas de balas. */
  function domeguard(G, def) {
    const b = base(G, def);
    b.targetY = 280;
    b.core = img(120, 120, (g, glow) => {
      glow('#ffb347', 30);
      const gr = g.createRadialGradient(0, 0, 4, 0, 0, 50);
      gr.addColorStop(0, '#fffbe8'); gr.addColorStop(0.4, '#ffc45a'); gr.addColorStop(1, '#5a3000');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 50, 0, TAU); g.fill();
      g.shadowBlur = 0; g.strokeStyle = '#fff0c0'; g.lineWidth = 3; g.stroke();
      g.strokeStyle = 'rgba(90,48,0,0.6)'; g.lineWidth = 2;
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.beginPath(); g.moveTo(Math.cos(a) * 18, Math.sin(a) * 18); g.lineTo(Math.cos(a) * 46, Math.sin(a) * 46); g.stroke(); }
    });
    b.plate = img(56, 34, (g, glow) => {
      glow('#7fe8ff', 12);
      g.fillStyle = 'rgba(150,235,255,0.55)'; poly(g, [-26, -12, 26, -12, 20, 14, -20, 14]); g.fill();
      g.shadowBlur = 0; g.strokeStyle = '#ffd27a'; g.lineWidth = 3; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-16, -6); g.lineTo(10, -6); g.stroke();
    });
    b.rim = img(600, 300, (g, glow) => {
      glow('#7fe8ff', 18); g.strokeStyle = 'rgba(127,232,255,0.55)'; g.lineWidth = 5;
      g.beginPath(); g.arc(0, 110, 280, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
      g.shadowBlur = 0; g.strokeStyle = 'rgba(255,210,122,0.5)'; g.lineWidth = 2;
      for (let i = 0; i <= 10; i++) { const a = Math.PI * (1.08 + i * 0.084); g.beginPath(); g.moveTo(Math.cos(a) * 280, 110 + Math.sin(a) * 280); g.lineTo(Math.cos(a) * 240, 110 + Math.sin(a) * 240); g.stroke(); }
    });
    const N = 12, GAPS = [0, 3, 6, 9], R = 100;
    b.rot = 0; b.dir = 1;
    const plates = () => { const out = []; for (let i = 0; i < N; i++) if (!GAPS.includes(i)) { const a = b.rot + i / N * TAU; out.push({ x: b.x + Math.cos(a) * R, y: b.y + Math.sin(a) * R, a }); } return out; };
    b.update = function (dt) {
      this.t += dt;
      if (this.entering) { this.y += (this.targetY - this.y) * dt * 1.5; if (Math.abs(this.y - this.targetY) < 2) this.entering = false; return; }
      const ph = this.phase();
      if (Math.floor(this.t / 6) % 2) this.dir = -1; else this.dir = 1;
      this.rot += dt * (0.7 + ph * 0.35) * this.dir;
      this.x = G.W / 2 + Math.sin(this.t * 0.5) * 120;
      // Cortinas desde el borde de la cúpula
      this.every('curtain', [2.6, 2.0, 1.5][ph], () => {
        const off = Math.random() * 60;
        for (let k = 0; k < 8; k++) G.shot(40 + off + k * (G.W - 80) / 8, -8, 0, 165, 'bOrange');
      });
      this.every('aim', 1.6, () => G.fan(this.x, this.y + 40, G.aim(this.x, this.y), ph === 0 ? 3 : 5, 0.18, 250, 'bRed'));
      if (ph >= 1) this.every('gaps', 0.28, () => { for (const gi of GAPS) { const a = this.rot + gi / N * TAU; G.shot(this.x + Math.cos(a) * 60, this.y + Math.sin(a) * 60, Math.cos(a) * 210, Math.sin(a) * 210, 'bCyan'); } });
      if (ph === 2) this.every('plates', 1.5, () => { for (const p of plates()) G.shot(p.x, p.y, Math.cos(p.a) * 150, Math.sin(p.a) * 150, 'bViolet'); });
    };
    b.shields = function () { return plates().map(p => ({ x: p.x, y: p.y, r: 27 })); };
    b.hitboxes = function () { return [{ x: this.x, y: this.y, r: 50, part: null }]; };
    b.draw = function (ctx) {
      put(ctx, this.rim, this.x, this.y - 40, 0, 0.9);
      put(ctx, this.core, this.x, this.y, -this.rot * 0.5);
      for (const p of plates()) put(ctx, this.plate, p.x, p.y, p.a + Math.PI / 2);
    };
    return b;
  }

  /* ==================== MINI JEFE · LEVIATÁN ANCESTRAL ====================
     Misión 7. El sujeto L‑0: una manta colosal de cristal. Sus alas desvían
     los disparos y hacen daño al tocarlas; solo su corazón es vulnerable.
     Canta anillos de cristal y suelta crías de cristal. */
  function manta(G, def) {
    const b = base(G, def);
    b.targetY = 300;
    b.body = img(460, 240, (g, glow) => {
      glow('#9ff', 26);
      const gr = g.createLinearGradient(0, -100, 0, 110);
      gr.addColorStop(0, 'rgba(210,255,255,0.85)'); gr.addColorStop(0.5, 'rgba(90,150,230,0.7)'); gr.addColorStop(1, 'rgba(120,60,200,0.55)');
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(0, -95); g.quadraticCurveTo(120, -60, 225, 25); g.quadraticCurveTo(120, 30, 40, 80); g.lineTo(10, 118); g.lineTo(-10, 118); g.lineTo(-40, 80);
      g.quadraticCurveTo(-120, 30, -225, 25); g.quadraticCurveTo(-120, -60, 0, -95); g.fill();
      g.shadowBlur = 0; g.strokeStyle = 'rgba(230,255,255,0.9)'; g.lineWidth = 2.5; g.stroke();
      g.strokeStyle = 'rgba(230,255,255,0.35)'; g.lineWidth = 1.5;
      for (let k = 1; k <= 4; k++) { g.beginPath(); g.moveTo(0, -60 + k * 8); g.quadraticCurveTo(k * 40, -20, k * 52, 20); g.stroke(); g.beginPath(); g.moveTo(0, -60 + k * 8); g.quadraticCurveTo(-k * 40, -20, -k * 52, 20); g.stroke(); }
      g.fillStyle = 'rgba(20,40,80,0.8)'; g.beginPath(); g.ellipse(-26, -50, 9, 5, -0.3, 0, TAU); g.ellipse(26, -50, 9, 5, 0.3, 0, TAU); g.fill();
    });
    b.update = function (dt) {
      this.t += dt;
      if (this.entering) { this.y += (this.targetY - this.y) * dt * 1.2; if (Math.abs(this.y - this.targetY) < 2) this.entering = false; return; }
      const ph = this.phase();
      this.x = G.W / 2 + Math.sin(this.t * 0.45) * 150;
      this.y = this.targetY + Math.sin(this.t * 0.9) * 40;
      this.every('song', [2.2, 1.6, 1.2][ph], () => G.ring(this.x, this.y + 10, 20, 140, this.t, 'bCyan', 0.15));
      this.every('shard', 1.3, () => { for (const s of [-1, 1]) G.fan(this.x + s * 200, this.y + 25, G.aim(this.x + s * 200, this.y + 25), 3, 0.2, 240, 'bViolet'); });
      if (ph >= 1) this.every('spawn', 5, () => { for (const s of [-1, 1]) G.spawnEnemy('crystal', this.x + s * 180, this.y + 30, { ai: 'drift', vx: s * 40, vy: 110, spin: 1 }); });
      if (ph === 2) this.every('tail', 0.09, () => { const a = Math.PI / 2 + Math.sin(this.t * 3) * 0.9; G.shot(this.x, this.y + 115, Math.cos(a) * 260, Math.sin(a) * 260, 'bCyan'); });
    };
    b.hitboxes = function () { return [{ x: this.x, y: this.y + 5, r: 40, part: null }]; };
    // Alas: desvían los disparos y dañan al contacto
    b.bodyHitboxes = function () {
      const flap = Math.sin(this.t * 3) * 8, out = [];
      for (const k of [1, 2, 3, 4]) for (const s of [-1, 1]) out.push({ x: this.x + s * (k * 50), y: this.y + 15 - k * 4 + flap * k * 0.3, r: 28 });
      return out;
    };
    b.draw = function (ctx) {
      ctx.save(); ctx.translate(this.x, this.y); ctx.scale(1, 1 + 0.07 * Math.sin(this.t * 3)); put(ctx, this.body, 0, 0); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createRadialGradient(this.x, this.y + 5, 0, this.x, this.y + 5, 44);
      gr.addColorStop(0, '#fff'); gr.addColorStop(0.3, '#ff6aa0'); gr.addColorStop(1, 'rgba(255,40,120,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(this.x, this.y + 5, 40 + 5 * Math.sin(this.t * 4), 0, TAU); ctx.fill(); ctx.restore();
    };
    return b;
  }

  /* ===================== MINI JEFE · VIGÍA DEL INSTITUTO =====================
     Misión 8. Un satélite de vigilancia blanco con dos paneles solares que
     absorben disparos y tres cámaras. Las cámaras barren el espacio y,
     cuando fijan una línea (se vuelve roja), disparan una ráfaga por ella. */
  function watcher(G, def) {
    const b = base(G, def);
    b.targetY = 270;
    b.dish = img(150, 150, (g, glow) => {
      glow('#bff', 18);
      g.fillStyle = lg(g, -60, -60, 60, 60, ['#ffffff', '#cfe6ee', '#7c98a8']); g.beginPath(); g.arc(0, 0, 62, 0, TAU); g.fill();
      g.shadowBlur = 0; g.strokeStyle = '#5a7888'; g.lineWidth = 2;
      for (const r of [48, 34, 20]) { g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); }
      for (let i = 0; i < 3; i++) { const a = i / 3 * TAU - Math.PI / 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 62, Math.sin(a) * 62); g.stroke(); }
    });
    b.panel = img(170, 80, (g, glow) => {
      glow('#4fd8ff', 10); g.fillStyle = '#0c2a50'; g.fillRect(-80, -34, 160, 68); g.shadowBlur = 0;
      g.strokeStyle = '#9fd8ff'; g.lineWidth = 2; g.strokeRect(-80, -34, 160, 68);
      g.strokeStyle = 'rgba(160,216,255,0.45)'; g.lineWidth = 1;
      for (let x = -60; x < 80; x += 20) { g.beginPath(); g.moveTo(x, -34); g.lineTo(x, 34); g.stroke(); }
      for (const y of [-11, 11]) { g.beginPath(); g.moveTo(-80, y); g.lineTo(80, y); g.stroke(); }
    });
    b.cam = img(46, 46, (g, glow) => {
      g.fillStyle = '#e8eef2'; g.beginPath(); g.arc(0, 0, 18, 0, TAU); g.fill();
      g.strokeStyle = '#5a7888'; g.lineWidth = 2; g.stroke();
      glow('#4fd8ff', 10); g.fillStyle = '#123'; g.beginPath(); g.arc(0, 6, 9, 0, TAU); g.fill();
    });
    const camHp = Math.round(320 * (0.85 + G.difficulty * 0.15));
    b.parts = [[-80, 70], [0, 98], [80, 70]].map(([ox, oy], k) => ({ ox, oy, k, r: 22, hp: camHp, max: camHp, alive: true, ang: Math.PI / 2, lock: 0, cool: 1 + k * 0.7 }));
    b.partBonus = 0.08; b.partShare = 0.1;
    b.update = function (dt) {
      this.t += dt;
      if (this.entering) { this.y += (this.targetY - this.y) * dt * 1.4; if (Math.abs(this.y - this.targetY) < 2) this.entering = false; return; }
      const ph = this.phase();
      this.x = G.W / 2 + Math.sin(this.t * 0.35) * 110;
      for (const c of this.parts) {
        if (!c.alive) continue;
        const cx = this.x + c.ox, cy = this.y + c.oy;
        if (c.lock > 0) {
          c.lock -= dt;
          if (c.lock <= 0) { for (let n = 0; n < 7; n++) G.shot(cx + Math.cos(c.ang) * n * 16, cy + Math.sin(c.ang) * n * 16, Math.cos(c.ang) * 380, Math.sin(c.ang) * 380, 'bRed'); c.cool = [2.6, 2.0, 1.4][ph]; }
        } else {
          // Barrido hasta que la cámara "fija" al jugador
          c.ang = Math.PI / 2 + Math.sin(this.t * (0.8 + ph * 0.3) + c.k * 2.1) * 0.8;
          c.cool -= dt;
          if (c.cool <= 0) { c.ang = Math.atan2(G.player.y - cy, G.player.x - cx); c.lock = 0.7; }
        }
      }
      if (ph >= 1) this.every('ring', ph === 2 ? 1.8 : 2.6, () => G.ring(this.x, this.y, 14, 150, this.t, 'bCyan', 0.2));
      this.every('spark', 1.9, () => G.fan(this.x, this.y + 40, G.aim(this.x, this.y), 3, 0.22, 230, 'bViolet'));
    };
    const camsAlive = () => b.parts.some(c => c.alive);
    b.shields = function () {
      const out = [];
      for (const s of [-1, 1]) for (const dx of [-55, 0, 55]) out.push({ x: this.x + s * 165 + dx, y: this.y - 5, r: 32 });
      return out;
    };
    b.hitboxes = function () {
      const hb = [{ x: this.x, y: this.y, r: 58, part: null, armor: camsAlive() ? 0.4 : 1 }];
      for (const c of this.parts) if (c.alive) hb.push({ x: this.x + c.ox, y: this.y + c.oy, r: c.r, part: c });
      return hb;
    };
    b.draw = function (ctx) {
      ctx.strokeStyle = '#8aa4b4'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(this.x - 245, this.y - 5); ctx.lineTo(this.x + 245, this.y - 5); ctx.stroke();
      for (const s of [-1, 1]) put(ctx, this.panel, this.x + s * 165, this.y - 5);
      // Líneas de visión de las cámaras
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const c of this.parts) if (c.alive) {
        const cx = this.x + c.ox, cy = this.y + c.oy;
        ctx.strokeStyle = c.lock > 0 ? `rgba(255,42,90,${0.5 + 0.4 * Math.sin(this.t * 30)})` : 'rgba(79,216,255,0.18)';
        ctx.lineWidth = c.lock > 0 ? 3 : 1.5;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(c.ang) * 1500, cy + Math.sin(c.ang) * 1500); ctx.stroke();
      }
      ctx.restore();
      put(ctx, this.dish, this.x, this.y, this.t * 0.4);
      ctx.fillStyle = '#ff2a5a'; ctx.beginPath(); ctx.arc(this.x, this.y, 9 + 2 * Math.sin(this.t * 6), 0, TAU); ctx.fill();
      for (const c of this.parts) if (c.alive) put(ctx, this.cam, this.x + c.ox, this.y + c.oy, c.ang - Math.PI / 2);
    };
    return b;
  }

  /* ======================== MINI JEFE · CRUCERO DE ORDO ========================
     Misión 12. Un crucero negro en forma de tridente. Cada punta carga un
     rayo (aviso: línea roja) y dispara una ráfaga larga. Mientras quede una
     punta, el puente está blindado. Lanza kamikazes desde el hangar. */
  function trident(G, def) {
    const b = base(G, def);
    b.targetY = 230;
    b.body = img(380, 320, (g, glow) => {
      glow('#ff2a4f', 22);
      g.fillStyle = lg(g, -190, 0, 190, 0, ['#14060c', '#2e0c18', '#14060c']);
      // Eje central y travesaño
      poly(g, [-34, -150, 34, -150, 40, -40, 150, -30, 150, 0, 40, 0, 26, 150, -26, 150, -40, 0, -150, 0, -150, -30, -40, -40]); g.fill();
      // Puntas laterales
      poly(g, [-150, -10, -112, -10, -112, 120, -131, 140, -150, 120]); g.fill();
      poly(g, [150, -10, 112, -10, 112, 120, 131, 140, 150, 120]); g.fill();
      g.shadowBlur = 0; g.strokeStyle = '#ff3b5c'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(0, -140); g.lineTo(0, 140); g.moveTo(-131, -5); g.lineTo(-131, 130); g.moveTo(131, -5); g.lineTo(131, 130); g.moveTo(-140, -15); g.lineTo(140, -15); g.stroke();
      g.fillStyle = '#ff2a4f'; for (const y of [-120, -95, -70]) g.fillRect(-12, y, 24, 6);
    });
    b.tip = img(44, 44, (g, glow) => {
      glow('#ff2a4f', 16); g.fillStyle = '#3a0814'; g.beginPath(); g.arc(0, 0, 17, 0, TAU); g.fill();
      g.strokeStyle = '#ff6c8f'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#ffd0dc'; g.beginPath(); g.arc(0, 0, 6, 0, TAU); g.fill();
    });
    const tipHp = Math.round(380 * (0.85 + G.difficulty * 0.15));
    b.parts = [[-131, 140], [0, 152], [131, 140]].map(([ox, oy], k) => ({ ox, oy, k, r: 22, hp: tipHp, max: tipHp, alive: true, state: 'idle', st: 1 + k * 0.8, ang: Math.PI / 2 }));
    b.partBonus = 0.08; b.partShare = 0.1;
    b.update = function (dt) {
      this.t += dt;
      if (this.entering) { this.y += (this.targetY - this.y) * dt * 1.3; if (Math.abs(this.y - this.targetY) < 2) this.entering = false; return; }
      const ph = this.phase();
      this.x = G.W / 2 + Math.sin(this.t * 0.3) * 90;
      for (const p of this.parts) {
        if (!p.alive) continue;
        const px = this.x + p.ox, py = this.y + p.oy;
        p.st -= dt;
        if (p.state === 'idle' && p.st <= 0) { p.state = 'charge'; p.st = 0.9; p.ang = Math.atan2(G.player.y - py, G.player.x - px); }
        else if (p.state === 'charge' && p.st <= 0) { p.state = 'fire'; p.st = 0.75; }
        else if (p.state === 'fire') {
          this.every('beam' + p.k, 0.05, () => G.shot(px, py, Math.cos(p.ang) * 420, Math.sin(p.ang) * 420, 'bRed'));
          if (ph === 2 && p.k === 1) p.ang += Math.sin(this.t * 4) * dt * 1.5;
          if (p.st <= 0) { p.state = 'idle'; p.st = [2.4, 1.8, 1.3][ph] + p.k * 0.3; }
        }
      }
      if (ph >= 1) this.every('kami', 5, () => { G.spawnEnemy('kamikaze', this.x - 60, this.y - 40, { ai: 'homing', speed: 240 }); G.spawnEnemy('kamikaze', this.x + 60, this.y - 40, { ai: 'homing', speed: 240 }); });
      this.every('side', 2.2, () => { for (const s of [-1, 1]) G.fan(this.x + s * 150, this.y - 15, Math.PI / 2 + s * 0.6, 4, 0.12, 200, 'bViolet'); });
    };
    const tipsAlive = () => b.parts.some(p => p.alive);
    b.hitboxes = function () {
      const hb = [{ x: this.x, y: this.y - 70, r: 50, part: null, armor: tipsAlive() ? 0.3 : 1 }];
      for (const p of this.parts) if (p.alive) hb.push({ x: this.x + p.ox, y: this.y + p.oy, r: p.r, part: p });
      return hb;
    };
    b.draw = function (ctx) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const p of this.parts) if (p.alive && p.state === 'charge') {
        const px = this.x + p.ox, py = this.y + p.oy, k = 1 - p.st / 0.9;
        ctx.strokeStyle = `rgba(255,42,79,${0.2 + 0.6 * k})`; ctx.lineWidth = 1 + 4 * k;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(p.ang) * 1500, py + Math.sin(p.ang) * 1500); ctx.stroke();
      }
      ctx.restore();
      put(ctx, this.body, this.x, this.y);
      for (const p of this.parts) if (p.alive) put(ctx, this.tip, this.x + p.ox, this.y + p.oy, this.t * (p.state === 'charge' ? 8 : 1));
      ctx.fillStyle = tipsAlive() ? 'rgba(255,42,79,0.6)' : '#ff2a4f';
      ctx.beginPath(); ctx.arc(this.x, this.y - 70, 14 + (tipsAlive() ? 0 : 3 * Math.sin(this.t * 8)), 0, TAU); ctx.fill();
    };
    return b;
  }

  /* ====================== MINI JEFE · HERALDO DEL UMBRAL ======================
     Misión 13. Un prisma blanco que se desdobla en tres reflejos. Solo el
     auténtico tiene el ojo encendido y recibe daño; cada pocos segundos se
     desvanecen y cambian de sitio. */
  function prism(G, def) {
    const b = base(G, def);
    b.targetY = 270;
    b.body = img(150, 170, (g, glow) => {
      glow('#e8c8ff', 22);
      g.fillStyle = lg(g, -60, -80, 60, 80, ['#ffffff', '#d8c8ff', '#7a5ac8']);
      poly(g, [0, -78, 52, 0, 0, 78, -52, 0]); g.fill();
      g.shadowBlur = 0; g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(0, -78); g.lineTo(0, 78); g.moveTo(-52, 0); g.lineTo(52, 0); g.stroke();
      g.strokeStyle = 'rgba(232,200,255,0.6)'; g.lineWidth = 3;
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 40, -20); g.quadraticCurveTo(s * 90, -50, s * 74, 10); g.stroke(); }
    });
    const SLOTS = [0.22, 0.5, 0.78];
    b.real = 1; b.fade = 1; b.swapT = 0;
    const pos = i => ({ x: G.W * SLOTS[i] + Math.sin(b.t * 0.8 + i) * 30, y: b.y + Math.sin(b.t * 1.3 + i * 2) * 25 });
    b.update = function (dt) {
      this.t += dt;
      if (this.entering) { this.y += (this.targetY - this.y) * dt * 1.4; if (Math.abs(this.y - this.targetY) < 2) this.entering = false; return; }
      const ph = this.phase(), every = [4.5, 3.5, 2.6][ph];
      this.swapT += dt;
      // Desvanecerse, cambiar de sitio y reaparecer
      if (this.swapT > every) { this.fade = Math.max(0, this.fade - dt * 3); if (this.fade === 0) { this.real = Math.floor(Math.random() * 3); this.swapT = 0; } }
      else this.fade = Math.min(1, this.fade + dt * 3);
      this.x = pos(this.real).x;
      if (this.fade < 0.8) return;
      for (let i = 0; i < 3; i++) {
        const p = pos(i);
        this.every('aim' + i, 1.4 + i * 0.2, () => G.shot(p.x, p.y + 40, Math.cos(G.aim(p.x, p.y)) * 230, Math.sin(G.aim(p.x, p.y)) * 230, 'bViolet'));
        if (ph === 2 && i !== this.real) this.every('cring' + i, 2.4, () => G.ring(p.x, p.y, 10, 130, this.t, 'bCyan'));
      }
      const r = pos(this.real);
      this.every('fan', 1.8, () => G.fan(r.x, r.y + 40, G.aim(r.x, r.y), 5, 0.16, 260, 'bRed'));
      if (ph >= 1) this.every('cross', 0.12, () => { const a = this.t * 2.4; for (let k = 0; k < 4; k++) { const aa = a + k * Math.PI / 2; G.shot(r.x, r.y, Math.cos(aa) * 190, Math.sin(aa) * 190, 'bViolet'); } });
    };
    b.hitboxes = function () { if (this.fade < 0.8) return []; const p = pos(this.real); return [{ x: p.x, y: p.y, r: 52, part: null }]; };
    b.draw = function (ctx) {
      for (let i = 0; i < 3; i++) {
        const p = pos(i), real = i === this.real;
        ctx.save(); ctx.globalAlpha = this.fade * (real ? 1 : 0.85);
        put(ctx, this.body, p.x, p.y, Math.sin(this.t + i) * 0.08);
        ctx.restore();
        ctx.globalAlpha = this.fade;
        ctx.fillStyle = real ? '#ff2a4f' : 'rgba(120,90,180,0.8)';
        ctx.beginPath(); ctx.ellipse(p.x, p.y, real ? 11 : 8, real ? 16 : 10, 0, 0, TAU); ctx.fill();
        if (real) { ctx.strokeStyle = `rgba(255,42,79,${0.4 + 0.3 * Math.sin(this.t * 8)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, 24, 0, TAU); ctx.stroke(); }
        ctx.globalAlpha = 1;
      }
    };
    return b;
  }

  /* ===================== MINI JEFE · TALADRO DE LA GRIETA =====================
     Misión 14. Una barrena gigante vista desde arriba: un disco espiral que
     gira con tres cuchillas que se abren y se cierran a su alrededor.
     Mientras queden cuchillas, el eje está blindado. Escupe escombros. */
  function auger(G, def) {
    const b = base(G, def);
    b.targetY = 290;
    b.disc = img(190, 190, (g, glow) => {
      glow('#ffb347', 20);
      const gr = g.createRadialGradient(0, 0, 10, 0, 0, 88);
      gr.addColorStop(0, '#fff2c8'); gr.addColorStop(0.3, '#c89a50'); gr.addColorStop(1, '#3a2a18');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 88, 0, TAU); g.fill();
      g.shadowBlur = 0; g.strokeStyle = '#2a1a08'; g.lineWidth = 5;
      g.beginPath(); for (let a = 0; a < TAU * 3; a += 0.08) { const r = 10 + a * 4.2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.stroke();
      g.strokeStyle = '#ffd27a'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 88, 0, TAU); g.stroke();
    });
    b.blade = img(90, 34, (g, glow) => {
      glow('#ff6a1a', 14);
      g.fillStyle = lg(g, -40, 0, 40, 0, ['#ffb066', '#ffffff', '#c86a2a']);
      poly(g, [-40, -6, 30, -14, 42, 0, 30, 14, -40, 6]); g.fill();
      g.shadowBlur = 0; g.strokeStyle = '#3a1a08'; g.lineWidth = 2; g.stroke();
    });
    const bladeHp = Math.round(420 * (0.85 + G.difficulty * 0.15));
    b.parts = [0, 1, 2].map(k => ({ k, r: 26, hp: bladeHp, max: bladeHp, alive: true }));
    b.partBonus = 0.08; b.partShare = 0.1;
    b.spin = 0;
    const bladeR = () => 130 + Math.sin(b.t * 1.4) * 45 + (b.phase() === 2 ? 30 : 0);
    const bladePos = p => { const a = b.spin * 0.6 + p.k * TAU / 3, r = bladeR(); return { x: b.x + Math.cos(a) * r, y: b.y + Math.sin(a) * r, a }; };
    b.update = function (dt) {
      this.t += dt;
      if (this.entering) { this.y += (this.targetY - this.y) * dt * 1.4; if (Math.abs(this.y - this.targetY) < 2) this.entering = false; return; }
      const ph = this.phase();
      this.spin += dt * (2 + ph * 0.8);
      this.x = G.W / 2 + Math.sin(this.t * 0.5) * 160;
      this.y = this.targetY + Math.sin(this.t * 1.1) * 25;
      this.every('debris', [1.8, 1.4, 1.0][ph], () => G.spawnEnemy('rockS', this.x + (Math.random() - 0.5) * 100, this.y + 60, { ai: 'drift', vx: (Math.random() - 0.5) * 260, vy: 200 }));
      this.every('burst', 2, () => G.fan(this.x, this.y + 60, G.aim(this.x, this.y), 5, 0.18, 250, 'bRed'));
      if (ph >= 1) this.every('spiral', 0.09, () => { for (let k = 0; k < 2; k++) { const a = this.spin + k * Math.PI; G.shot(this.x, this.y, Math.cos(a) * 200, Math.sin(a) * 200, 'bOrange'); } });
    };
    const bladesAlive = () => b.parts.some(p => p.alive);
    b.hitboxes = function () {
      const hb = [{ x: this.x, y: this.y, r: 70, part: null, armor: bladesAlive() ? 0.25 : 1 }];
      for (const p of this.parts) if (p.alive) { const q = bladePos(p); hb.push({ x: q.x, y: q.y, r: p.r, part: p }); }
      return hb;
    };
    b.draw = function (ctx) {
      put(ctx, this.disc, this.x, this.y, this.spin);
      for (const p of this.parts) if (p.alive) { const q = bladePos(p); put(ctx, this.blade, q.x, q.y, q.a); }
      if (bladesAlive()) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,179,71,${0.3 + 0.2 * Math.sin(this.t * 6)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(this.x, this.y, 96, 0, TAU); ctx.stroke(); ctx.restore(); }
    };
    return b;
  }

  /* ======================= MINI JEFE · EXCAVADORA MINERA ======================
     Asteroides. Dos brazos‑taladro destructibles; lanza rocas y abanicos. */
  function driller(G, def) {
    const b = base(G, def);
    b.targetY = 290;
    b.body = img(260, 150, (g, glow) => {
      glow('#ffb347', 20);
      g.fillStyle = lg(g, 0, -70, 0, 70, ['#5a4a3a', '#2a2018', '#120c08']);
      poly(g, [-80, -60, 80, -60, 120, -10, 100, 50, 40, 72, -40, 72, -100, 50, -120, -10]); g.fill();
      g.shadowBlur = 0; g.strokeStyle = '#ffb347'; g.lineWidth = 2.5; g.stroke();
      g.fillStyle = '#ffb347';
      for (let i = -3; i <= 3; i++) g.fillRect(i * 26 - 8, -46, 16, 5);
      g.fillStyle = '#1a120c'; g.beginPath(); g.arc(0, 14, 34, 0, TAU); g.fill();
      g.strokeStyle = '#ffd08a'; g.lineWidth = 3; g.stroke();
    });
    b.drill = img(60, 110, (g, glow) => {
      glow('#ff8a2a', 14);
      g.fillStyle = lg(g, -24, 0, 24, 0, ['#6a6a7a', '#d8d8e8', '#6a6a7a']);
      poly(g, [-24, -40, 24, -40, 0, 54]); g.fill();
      g.shadowBlur = 0; g.strokeStyle = '#2a2a3a'; g.lineWidth = 2;
      for (let y = -30; y < 40; y += 12) { const w = 24 * (1 - (y + 40) / 94); g.beginPath(); g.moveTo(-w, y); g.lineTo(w, y + 8); g.stroke(); }
      g.fillStyle = '#3a2a1a'; g.fillRect(-20, -52, 40, 14);
    });
    b.parts = [{ ox: -100, oy: 50, r: 26, hp: 220, max: 220, alive: true }, { ox: 100, oy: 50, r: 26, hp: 220, max: 220, alive: true }];
    b.update = function (dt) {
      this.t += dt;
      if (this.entering) { this.y += (this.targetY - this.y) * dt * 1.5; if (Math.abs(this.y - this.targetY) < 2) this.entering = false; return; }
      const ph = this.phase();
      this.x = G.W / 2 + Math.sin(this.t * 0.6) * 150;
      for (const p of this.parts) if (p.alive)
        this.every('d' + p.ox, 1.5, () => G.fan(this.x + p.ox, this.y + p.oy + 50, Math.PI / 2, 5, 0.16, 210, 'bOrange'));
      this.every('rock', ph === 0 ? 2.6 : 1.7, () => G.spawnEnemy('rockS', this.x + (Math.random() - 0.5) * 120, this.y + 40, { ai: 'drift', vx: (Math.random() - 0.5) * 200, vy: 220 }));
      this.every('aim', ph === 2 ? 0.9 : 1.6, () => G.fan(this.x, this.y + 20, G.aim(this.x, this.y), 3, 0.18, 250, 'bRed'));
    };
    b.hitboxes = function () {
      const hb = [{ x: this.x, y: this.y + 10, r: 52, part: null }];
      for (const p of this.parts) if (p.alive) hb.push({ x: this.x + p.ox, y: this.y + p.oy, r: p.r, part: p });
      return hb;
    };
    b.draw = function (ctx) {
      for (const p of this.parts) if (p.alive) put(ctx, this.drill, this.x + p.ox, this.y + p.oy, Math.sin(this.t * 30) * 0.05);
      put(ctx, this.body, this.x, this.y);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255,180,80,${0.5 + 0.4 * Math.sin(this.t * 8)})`;
      ctx.beginPath(); ctx.arc(this.x, this.y + 14, 14, 0, TAU); ctx.fill(); ctx.restore();
    };
    return b;
  }

  /* ========================== MINI JEFE · FUNDIDOR ==========================
     La Forja. Un crisol que vierte cortinas de metal fundido. */
  function smelter(G, def) {
    const b = base(G, def);
    b.targetY = 280;
    b.body = img(240, 170, (g, glow) => {
      glow('#ff6a1a', 26);
      g.fillStyle = lg(g, -120, 0, 120, 0, ['#2a140c', '#5a2a14', '#2a140c']);
      poly(g, [-110, -60, 110, -60, 90, 40, 50, 80, -50, 80, -90, 40]); g.fill();
      g.shadowBlur = 0; g.strokeStyle = '#ff9a3b'; g.lineWidth = 3; g.stroke();
      const gr = g.createRadialGradient(0, -50, 4, 0, -50, 90);
      gr.addColorStop(0, '#fff3c0'); gr.addColorStop(0.4, '#ff9a2a'); gr.addColorStop(1, 'rgba(255,60,0,0)');
      g.fillStyle = gr; g.beginPath(); g.ellipse(0, -52, 96, 18, 0, 0, TAU); g.fill();
      g.fillStyle = '#1a0a04'; for (const x of [-60, 0, 60]) g.fillRect(x - 10, 60, 20, 26);
    });
    b.update = function (dt) {
      this.t += dt;
      if (this.entering) { this.y += (this.targetY - this.y) * dt * 1.4; if (Math.abs(this.y - this.targetY) < 2) this.entering = false; return; }
      const ph = this.phase();
      this.x = G.W / 2 + Math.sin(this.t * 0.45) * 170;
      // Cortina de metal fundido desde los tres caños
      this.every('pour', ph === 0 ? 0.16 : 0.12, () => {
        const k = Math.floor(this.t * 6) % 3, x = this.x + (k - 1) * 60;
        G.shot(x, this.y + 86, (Math.random() - 0.5) * 50, 230, 'bOrange');
      });
      this.every('ring', ph === 2 ? 1.6 : 2.6, () => G.ring(this.x, this.y, 14, 150, this.t, 'bRed', 0.2));
      if (ph >= 1) this.every('big', 1.8, () => G.fan(this.x, this.y + 40, G.aim(this.x, this.y), 3, 0.3, 170, 'bBig'));
    };
    b.hitboxes = function () { return [{ x: this.x, y: this.y, r: 72, part: null }]; };
    b.draw = function (ctx) {
      put(ctx, this.body, this.x, this.y);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const dx of [-60, 0, 60]) {
        ctx.fillStyle = `rgba(255,140,40,${0.35 + 0.25 * Math.sin(this.t * 10 + dx)})`;
        ctx.fillRect(this.x + dx - 5, this.y + 86, 10, 26);
      }
      ctx.restore();
    };
    return b;
  }

  /* ======================= MINI JEFE · HERALDO DE ORDO =======================
     La Grieta. Un ojo menor de ORDO con dos satélites que bloquean disparos. */
  function herald(G, def) {
    const b = base(G, def);
    b.targetY = 320;
    b.eye = img(150, 150, (g, glow) => {
      glow('#c46bff', 30);
      const gr = g.createRadialGradient(0, 0, 6, 0, 0, 66);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.25, '#d49bff'); gr.addColorStop(0.6, '#4a0a6a'); gr.addColorStop(1, '#0a0214');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 66, 0, TAU); g.fill();
      g.shadowBlur = 0; g.strokeStyle = '#e8c8ff'; g.lineWidth = 3; g.stroke();
      g.strokeStyle = 'rgba(232,200,255,0.4)'; g.lineWidth = 2;
      g.beginPath(); g.arc(0, 0, 84, -0.6, 0.6); g.stroke(); g.beginPath(); g.arc(0, 0, 84, Math.PI - 0.6, Math.PI + 0.6); g.stroke();
    });
    b.sat = img(50, 50, (g, glow) => {
      glow('#c46bff', 14); g.fillStyle = '#1a0830'; g.beginPath(); g.arc(0, 0, 18, 0, TAU); g.fill();
      g.strokeStyle = '#d49bff'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#ff2a4f'; g.beginPath(); g.arc(0, 0, 5, 0, TAU); g.fill();
    });
    b.rot = 0;
    b.update = function (dt) {
      this.t += dt;
      if (this.entering) { this.y += (this.targetY - this.y) * dt * 1.3; if (Math.abs(this.y - this.targetY) < 2) this.entering = false; return; }
      const ph = this.phase();
      this.rot += dt * (1 + ph * 0.4);
      this.x = G.W / 2 + Math.sin(this.t * 0.7) * 160;
      this.every('sp', ph === 0 ? 0.14 : 0.1, () => { const a = this.t * 2.6; for (let k = 0; k < 2; k++) G.shot(this.x, this.y, Math.cos(a + k * Math.PI) * 190, Math.sin(a + k * Math.PI) * 190, 'bViolet'); });
      this.every('aim', ph === 2 ? 1.0 : 1.7, () => G.fan(this.x, this.y + 40, G.aim(this.x, this.y), 4, 0.15, 270, 'bRed'));
      if (ph >= 1) this.every('kami', 3.5, () => G.spawnEnemy('kamikaze', this.x, this.y + 40, { ai: 'homing', speed: 240 }));
    };
    b.satPos = function () { return [0, 1].map(i => { const a = this.rot + i * Math.PI; return { x: this.x + Math.cos(a) * 110, y: this.y + Math.sin(a) * 70 }; }); };
    b.shields = function () { return this.satPos().map(p => ({ x: p.x, y: p.y, r: 24 })); };
    b.hitboxes = function () { return [{ x: this.x, y: this.y, r: 62, part: null }]; };
    b.draw = function (ctx) {
      put(ctx, this.eye, this.x, this.y, 0);
      const a = G.aim(this.x, this.y);
      ctx.fillStyle = '#050005'; ctx.beginPath(); ctx.ellipse(this.x + Math.cos(a) * 22, this.y + Math.sin(a) * 22, 9, 18, a + Math.PI / 2, 0, TAU); ctx.fill();
      for (const s of this.satPos()) put(ctx, this.sat, s.x, s.y, this.t * 3);
    };
    return b;
  }

  const TYPES = { lanza, forge, superordo, censor, sentinel, domeguard, leviathan, manta, watcher, driller, smelter, herald, trident, prism, auger };
  function create(G, def) { return TYPES[def.type](G, def); }
  return { create };
})();

window.Bosses = Bosses;

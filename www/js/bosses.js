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
    b.parts = [{ ox: -112, oy: 24, r: 28, hp: 260, max: 260, alive: true }, { ox: 112, oy: 24, r: 28, hp: 260, max: 260, alive: true }];
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

  const TYPES = { lanza, forge, superordo, censor, sentinel, leviathan, driller, smelter, herald };
  function create(G, def) { return TYPES[def.type](G, def); }
  return { create };
})();

window.Bosses = Bosses;

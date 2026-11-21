/* =========================================================================
   Jefes: Guardián del Censo · Fragata Lanza · Leviatán Vítreo ·
   Forja Madre · ORDO. Cada uno con fases y patrones de balas propios.
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
        this.timers[name] = (this.timers[name] || 0) + G.dt;
        if (this.timers[name] >= period) { this.timers[name] -= period; fn(); }
      },
    };
  }

  /* ====================== 1 · GUARDIÁN DEL CENSO ====================== */
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

  /* ========================= 2 · FRAGATA LANZA ======================== */
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

  /* ======================== 3 · LEVIATÁN VÍTREO ======================= */
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

  /* ========================== 4 · FORJA MADRE ========================= */
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

  /* ============================== 5 · ORDO ============================ */
  function ordo(G, def) {
    const b = base(G, def);
    b.targetY = 380;
    b.eye = img(220, 220, (g, glow) => {
      glow('#ff2a4f', 40);
      const gr = g.createRadialGradient(0, 0, 10, 0, 0, 100);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.2, '#ff6a8a'); gr.addColorStop(0.55, '#7a0a2a'); gr.addColorStop(1, '#14020a');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 100, 0, TAU); g.fill();
      g.shadowBlur = 0; g.strokeStyle = '#ff9db6'; g.lineWidth = 3; g.stroke();
      g.strokeStyle = 'rgba(255,157,182,0.35)'; g.lineWidth = 1.5;
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(Math.cos(a) * 40, Math.sin(a) * 40); g.lineTo(Math.cos(a) * 96, Math.sin(a) * 96); g.stroke(); }
    });
    b.halo = img(460, 460, (g, glow) => {
      glow('#c46bff', 20); g.strokeStyle = 'rgba(196,107,255,0.8)'; g.lineWidth = 3;
      for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(0, 0, 150 + i * 28, i * 0.7, i * 0.7 + TAU * 0.8); g.stroke(); }
      g.fillStyle = '#e8c8ff';
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; g.fillRect(Math.cos(a) * 206 - 3, Math.sin(a) * 206 - 3, 6, 6); }
    });
    b.sat = img(56, 56, (g, glow) => {
      glow('#c46bff', 16); g.fillStyle = '#1a0830'; g.beginPath(); g.arc(0, 0, 22, 0, TAU); g.fill();
      g.strokeStyle = '#d49bff'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#ff2a4f'; g.beginPath(); g.arc(0, 0, 6, 0, TAU); g.fill();
    });
    b.rot = 0; b.sats = 4;
    b.update = function (dt) {
      this.t += dt;
      if (this.entering) { this.y += (this.targetY - this.y) * dt * 1.2; if (Math.abs(this.y - this.targetY) < 2) this.entering = false; return; }
      const ph = this.phase();
      this.rot += dt * (0.8 + ph * 0.4);
      this.x = G.W / 2 + Math.sin(this.t * 0.35) * 90;
      if (ph === 0) {
        this.every('ring', 1.1, () => G.ring(this.x, this.y, 22, 160, this.t * 0.7, 'bRed', 0.35));
        this.every('aim', 1.5, () => G.fan(this.x, this.y + 60, G.aim(this.x, this.y), 5, 0.12, 280, 'bViolet'));
      } else if (ph === 1) {
        this.every('sp', 0.08, () => {
          const a = this.t * 2.3;
          for (let k = 0; k < 3; k++) { const aa = a + k * TAU / 3; G.shot(this.x, this.y, Math.cos(aa) * 200, Math.sin(aa) * 200, 'bViolet'); }
          for (let k = 0; k < 2; k++) { const aa = -a * 0.8 + k * Math.PI; G.shot(this.x, this.y, Math.cos(aa) * 170, Math.sin(aa) * 170, 'bRed'); }
        });
        this.every('kami', 3.2, () => { G.spawnEnemy('kamikaze', 80, -20); G.spawnEnemy('kamikaze', G.W - 80, -20); });
      } else {
        this.every('flower', 0.6, () => { for (let k = 0; k < 28; k++) { const a = k / 28 * TAU + this.t; const s = 150 + 60 * Math.sin(k * 3); G.shot(this.x, this.y, Math.cos(a) * s, Math.sin(a) * s, k % 2 ? 'bRed' : 'bViolet'); } });
        this.every('big', 1.2, () => G.fan(this.x, this.y, G.aim(this.x, this.y), 3, 0.3, 200, 'bBig'));
        this.every('kami', 4, () => G.spawnEnemy('kamikaze', G.W / 2, -20));
      }
    };
    b.satPos = function () {
      const out = [];
      for (let i = 0; i < this.sats; i++) { const a = this.rot * 1.4 + i / this.sats * TAU; out.push({ x: this.x + Math.cos(a) * 150, y: this.y + Math.sin(a) * 150 }); }
      return out;
    };
    b.hitboxes = function () { return [{ x: this.x, y: this.y, r: 90, part: null }]; };
    b.shields = function () { return this.satPos().map(p => ({ x: p.x, y: p.y, r: 24 })); };
    b.draw = function (ctx) {
      put(ctx, this.halo, this.x, this.y, this.rot * 0.5);
      const pulse = 1 + 0.05 * Math.sin(this.t * 5) + (this.phase() === 2 ? 0.05 * Math.sin(this.t * 17) : 0);
      ctx.save(); ctx.translate(this.x, this.y); ctx.scale(pulse, pulse); put(ctx, this.eye, 0, 0); ctx.restore();
      // Pupila que sigue al jugador
      const a = G.aim(this.x, this.y), px = this.x + Math.cos(a) * 30, py = this.y + Math.sin(a) * 30;
      ctx.fillStyle = '#050005'; ctx.beginPath(); ctx.ellipse(px, py, 14, 26, a + Math.PI / 2, 0, TAU); ctx.fill();
      for (const s of this.satPos()) put(ctx, this.sat, s.x, s.y, this.t * 2);
    };
    return b;
  }

  const TYPES = { censor, lanza, leviathan, forge, ordo };
  function create(G, def) { return TYPES[def.type](G, def); }
  return { create };
})();

window.Bosses = Bosses;

/* =========================================================================
   Jefes: Fragata Lanza (misión 5) · Forja Madre (misión 10) ·
   súper jefe ORDO PRIMORDIAL (misión 15). Cada uno con fases propias.
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

  const TYPES = { lanza, forge, superordo };
  function create(G, def) { return TYPES[def.type](G, def); }
  return { create };
})();

window.Bosses = Bosses;

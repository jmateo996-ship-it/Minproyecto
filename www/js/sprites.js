/* =========================================================================
   Sprites vectoriales pre-renderizados a la resolución física del
   dispositivo (hasta 2160x3840, 4K vertical). El resplandor neón se
   "hornea" una sola vez para que el juego vaya fluido en móviles.
   ========================================================================= */
'use strict';

const Sprites = (() => {
  let R = 1;
  const cache = {};

  function make(key, w, h, draw) {
    const pad = 24;
    const c = document.createElement('canvas');
    c.width = Math.ceil((w + pad * 2) * R);
    c.height = Math.ceil((h + pad * 2) * R);
    const g = c.getContext('2d');
    g.scale(R, R);
    g.translate(pad + w / 2, pad + h / 2);
    draw(g);
    cache[key] = { c, w: w + pad * 2, h: h + pad * 2 };
    return cache[key];
  }

  const glow = (g, color, blur) => { g.shadowColor = color; g.shadowBlur = blur * R; };
  const noGlow = g => { g.shadowBlur = 0; };

  function path(g, pts) {
    g.beginPath(); g.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.closePath();
  }
  function metal(g, x0, y0, x1, y1, a, b) {
    const gr = g.createLinearGradient(x0, y0, x1, y1);
    gr.addColorStop(0, a); gr.addColorStop(0.5, b); gr.addColorStop(1, a);
    return gr;
  }

  /* ---------------- Nave de la familia: el ESPERANZA ---------------- */
  function player(g) {
    // Alas
    glow(g, '#2ad4ff', 18);
    g.fillStyle = metal(g, -40, 0, 40, 0, '#1b3350', '#5d87b3');
    path(g, [0, -10, 38, 18, 40, 30, 12, 24, 0, 30, -12, 24, -40, 30, -38, 18]); g.fill();
    noGlow(g);
    g.strokeStyle = '#7ee8ff'; g.lineWidth = 1.5; g.stroke();
    // Fuselaje
    g.fillStyle = metal(g, -12, 0, 12, 0, '#9fb6cc', '#f1f7ff');
    path(g, [0, -38, 10, -18, 12, 20, 6, 34, -6, 34, -12, 20, -10, -18]); g.fill();
    g.strokeStyle = '#4e6a86'; g.lineWidth = 1; g.stroke();
    // Cabina
    const cg = g.createLinearGradient(0, -30, 0, -6);
    cg.addColorStop(0, '#d6fbff'); cg.addColorStop(1, '#0a7fb0');
    g.fillStyle = cg; glow(g, '#5ff', 10);
    path(g, [0, -30, 6, -16, 4, -6, -4, -6, -6, -16]); g.fill(); noGlow(g);
    // Franjas ámbar (la firma de Lía)
    g.fillStyle = '#ffb347';
    g.fillRect(-30, 20, 14, 3); g.fillRect(16, 20, 14, 3);
    // Cañones
    g.fillStyle = '#cfe9ff'; g.fillRect(-26, 4, 3, 16); g.fillRect(23, 4, 3, 16);
    // Toberas
    glow(g, '#29f', 14); g.fillStyle = '#7fd4ff';
    g.fillRect(-9, 32, 6, 4); g.fillRect(3, 32, 6, 4); noGlow(g);
  }

  function flame(g) {
    const gr = g.createLinearGradient(0, -10, 0, 30);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(80,200,255,0.9)'); gr.addColorStop(1, 'rgba(40,80,255,0)');
    g.fillStyle = gr; glow(g, '#3af', 12);
    path(g, [-6, -10, 6, -10, 2, 30, -2, 30]); g.fill();
  }

  function drone(g) {
    glow(g, '#9dff6a', 14);
    g.fillStyle = '#1f3d22'; g.beginPath(); g.arc(0, 0, 11, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#9dff6a'; g.lineWidth = 2.5; g.stroke();
    g.fillStyle = '#e8ffd9'; g.beginPath(); g.arc(0, 0, 4, 0, Math.PI * 2); g.fill();
  }

  /* ---------------- Enemigos del Dominio ---------------- */
  const RED = '#ff2a5a', VIOLET = '#b34dff', ORANGE = '#ff8a2a';

  function dart(g) {
    glow(g, RED, 16);
    g.fillStyle = metal(g, -20, 0, 20, 0, '#3a0a1a', '#8a1d3c');
    path(g, [0, 22, 20, -14, 8, -8, 0, -20, -8, -8, -20, -14]); g.fill();
    noGlow(g); g.strokeStyle = '#ff6c8f'; g.lineWidth = 1.5; g.stroke();
    glow(g, RED, 10); g.fillStyle = '#ffd0dc';
    path(g, [0, 12, 4, 0, 0, -6, -4, 0]); g.fill();
  }
  function weaver(g) {
    glow(g, VIOLET, 16);
    g.fillStyle = metal(g, -26, 0, 26, 0, '#1d0838', '#5a2299');
    path(g, [0, 18, 26, 0, 14, -4, 0, -18, -14, -4, -26, 0]); g.fill();
    noGlow(g); g.strokeStyle = '#d49bff'; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = '#f0d6ff'; glow(g, VIOLET, 10);
    g.beginPath(); g.arc(0, 2, 5, 0, Math.PI * 2); g.fill();
  }
  function gunship(g) {
    glow(g, ORANGE, 18);
    g.fillStyle = metal(g, -34, 0, 34, 0, '#2c1406', '#7a3d12');
    path(g, [-18, -28, 18, -28, 34, -6, 30, 18, 12, 30, -12, 30, -30, 18, -34, -6]); g.fill();
    noGlow(g); g.strokeStyle = '#ffb36b'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#1a0a04'; g.beginPath(); g.arc(0, 2, 13, 0, Math.PI * 2); g.fill();
    glow(g, ORANGE, 14); g.fillStyle = '#ffd5a8'; g.beginPath(); g.arc(0, 2, 6, 0, Math.PI * 2); g.fill();
    noGlow(g); g.fillStyle = '#ffb36b'; g.fillRect(-26, 14, 6, 14); g.fillRect(20, 14, 6, 14);
  }
  function carrier(g) {
    glow(g, RED, 22);
    g.fillStyle = metal(g, -70, 0, 70, 0, '#1a0610', '#5c1530');
    path(g, [-40, -46, 40, -46, 70, -14, 62, 30, 30, 48, -30, 48, -62, 30, -70, -14]); g.fill();
    noGlow(g); g.strokeStyle = '#ff5c8a'; g.lineWidth = 2; g.stroke();
    g.strokeStyle = 'rgba(255,92,138,0.35)'; g.lineWidth = 1;
    for (let i = -50; i <= 50; i += 20) { g.beginPath(); g.moveTo(i, -36); g.lineTo(i * 0.8, 40); g.stroke(); }
    g.fillStyle = '#0c0206'; g.fillRect(-22, 20, 44, 22);
    glow(g, RED, 16); g.fillStyle = '#ff9db6';
    g.fillRect(-18, 24, 36, 4);
    g.beginPath(); g.arc(-40, -8, 7, 0, Math.PI * 2); g.arc(40, -8, 7, 0, Math.PI * 2); g.fill();
  }
  function mine(g) {
    glow(g, '#ff3', 14);
    g.strokeStyle = '#ffe94a'; g.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      g.beginPath(); g.moveTo(Math.cos(a) * 10, Math.sin(a) * 10); g.lineTo(Math.cos(a) * 20, Math.sin(a) * 20); g.stroke();
    }
    g.fillStyle = '#4a3a00'; g.beginPath(); g.arc(0, 0, 12, 0, Math.PI * 2); g.fill();
    g.stroke(); g.fillStyle = '#fff6b0'; g.beginPath(); g.arc(0, 0, 5, 0, Math.PI * 2); g.fill();
  }
  function kamikaze(g) {
    glow(g, '#ff4a1a', 14);
    g.fillStyle = '#ff6a2a';
    path(g, [0, 16, 13, -12, 0, -6, -13, -12]); g.fill();
    g.fillStyle = '#fff0c8'; g.beginPath(); g.arc(0, 2, 3.5, 0, Math.PI * 2); g.fill();
  }
  function rock(g, seed, r, col) {
    let s = seed;
    const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const pts = [];
    for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2, rr = r * (0.72 + rnd() * 0.3); pts.push(Math.cos(a) * rr, Math.sin(a) * rr); }
    const gr = g.createRadialGradient(-r * 0.4, -r * 0.4, r * 0.1, 0, 0, r);
    gr.addColorStop(0, col[0]); gr.addColorStop(1, col[1]);
    g.fillStyle = gr; path(g, pts); g.fill();
    g.strokeStyle = col[2]; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = 'rgba(0,0,0,0.3)';
    for (let i = 0; i < 4; i++) { g.beginPath(); g.arc((rnd() - 0.5) * r, (rnd() - 0.5) * r, r * 0.12 * (1 + rnd()), 0, Math.PI * 2); g.fill(); }
  }
  function crystal(g) {
    glow(g, '#6ff', 18);
    const gr = g.createLinearGradient(-16, -26, 16, 26);
    gr.addColorStop(0, 'rgba(200,255,255,0.95)'); gr.addColorStop(1, 'rgba(40,120,200,0.7)');
    g.fillStyle = gr; path(g, [0, -28, 16, -6, 10, 26, -10, 26, -16, -6]); g.fill();
    noGlow(g); g.strokeStyle = '#e0ffff'; g.lineWidth = 1.5; g.stroke();
    g.beginPath(); g.moveTo(0, -28); g.lineTo(0, 26); g.stroke();
  }

  /* ---------------- Balas ---------------- */
  function orb(color, r) {
    return g => {
      glow(g, color, r * 2.4);
      g.fillStyle = color; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
      noGlow(g); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, r * 0.5, 0, Math.PI * 2); g.fill();
    };
  }
  function laser(color, w, h) {
    return g => {
      glow(g, color, 12);
      g.fillStyle = color; g.beginPath(); g.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2); g.fill();
      noGlow(g); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(0, 0, w / 4, h / 2.4, 0, 0, Math.PI * 2); g.fill();
    };
  }
  function spark(color) {
    return g => {
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, 16);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 16, 0, Math.PI * 2); g.fill();
    };
  }

  /* ---------------- Mejoras ---------------- */
  const POWER = { P: ['#2ad4ff', 'P'], S: ['#9dff6a', 'S'], B: ['#ffb347', 'B'], D: ['#e86bff', 'D'], M: ['#ffe066', '★'] };
  function power(kind) {
    const [col, ch] = POWER[kind];
    return g => {
      glow(g, col, 18);
      g.fillStyle = 'rgba(10,20,40,0.85)'; g.strokeStyle = col; g.lineWidth = 3;
      g.beginPath();
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 20, Math.sin(a) * 20); }
      g.closePath(); g.fill(); g.stroke();
      noGlow(g); g.fillStyle = '#fff'; g.font = 'bold 20px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      glow(g, col, 8); g.fillText(ch, 0, 1);
    };
  }

  function build(scale) {
    R = scale;
    for (const k in cache) delete cache[k];
    make('player', 84, 80, player);
    make('flame', 14, 42, flame);
    make('drone', 26, 26, drone);
    make('dart', 44, 46, dart);
    make('weaver', 54, 40, weaver);
    make('gunship', 70, 62, gunship);
    make('carrier', 142, 98, carrier);
    make('mine', 42, 42, mine);
    make('kamikaze', 28, 32, kamikaze);
    make('crystal', 34, 56, crystal);
    for (let i = 0; i < 4; i++) {
      make('rock' + i, 70, 70, g => rock(g, 17 + i * 31, 32, ['#7a6a5a', '#2a2018', '#a08870']));
      make('rockS' + i, 36, 36, g => rock(g, 91 + i * 13, 16, ['#8a7a6a', '#2a2018', '#b09880']));
    }
    make('bRed', 16, 16, orb('#ff3b6b', 6));
    make('bViolet', 16, 16, orb('#c46bff', 6));
    make('bOrange', 20, 20, orb('#ff9a3b', 8));
    make('bBig', 30, 30, orb('#ff2a4f', 12));
    make('bCyan', 16, 16, orb('#6ff', 6));
    make('pShot', 9, 28, laser('#3fe0ff', 9, 28));
    make('pShot2', 12, 34, laser('#ffffff', 12, 34));
    make('pWave', 10, 22, laser('#ffb347', 10, 22));
    make('dShot', 8, 18, laser('#9dff6a', 8, 18));
    ['#ffffff', '#ff4a6a', '#ffb347', '#4fd8ff', '#c46bff', '#9dff6a', '#ffe066'].forEach(c => make('spark' + c, 32, 32, spark(c)));
    Object.keys(POWER).forEach(k => make('pw' + k, 44, 44, power(k)));
  }

  function draw(ctx, key, x, y, rot = 0, scale = 1, alpha = 1) {
    const s = cache[key]; if (!s) return;
    if (rot === 0 && scale === 1 && alpha === 1) {
      ctx.drawImage(s.c, x - s.w / 2, y - s.h / 2, s.w, s.h);
      return;
    }
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, y); if (rot) ctx.rotate(rot); if (scale !== 1) ctx.scale(scale, scale);
    ctx.drawImage(s.c, -s.w / 2, -s.h / 2, s.w, s.h);
    ctx.restore();
  }

  return { build, draw, get R() { return R; } };
})();

window.Sprites = Sprites;

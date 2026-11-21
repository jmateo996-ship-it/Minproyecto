/* =========================================================================
   Fondos parallax procedurales para cada capítulo.
   city · asteroids · crystal · forge · rift · title
   ========================================================================= */
'use strict';

const Backgrounds = (() => {
  const rand = (a, b) => a + Math.random() * (b - a);

  function offscreen(w, h, scale, draw) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * scale)); c.height = Math.max(1, Math.ceil(h * scale));
    const g = c.getContext('2d'); g.scale(scale, scale); draw(g);
    return c;
  }

  const PALETTES = {
    title:     { sky: ['#05030f', '#120a2e', '#0a1430'], neb: ['rgba(120,40,200,', 'rgba(20,120,220,', 'rgba(255,40,90,'] },
    city:      { sky: ['#03040c', '#0b0d24', '#140a22'], neb: ['rgba(255,40,120,', 'rgba(40,140,255,', 'rgba(120,40,200,'] },
    asteroids: { sky: ['#020205', '#0d0a12', '#1a0e0a'], neb: ['rgba(255,120,40,', 'rgba(160,60,40,', 'rgba(80,40,120,'] },
    crystal:   { sky: ['#01080c', '#04202a', '#100a2a'], neb: ['rgba(40,255,230,', 'rgba(120,80,255,', 'rgba(40,160,255,'] },
    forge:     { sky: ['#0a0302', '#200804', '#120404'], neb: ['rgba(255,90,20,', 'rgba(255,40,10,', 'rgba(255,180,40,'] },
    rift:      { sky: ['#000000', '#08020f', '#12021a'], neb: ['rgba(255,255,255,', 'rgba(160,60,255,', 'rgba(255,40,90,'] },
  };

  function nebulaTile(W, H, R, pal) {
    const sc = Math.min(1, R * 0.5);
    return offscreen(W, H, sc, g => {
      for (let i = 0; i < 26; i++) {
        const x = rand(0, W), y = rand(0, H), r = rand(80, 320);
        const col = pal.neb[i % pal.neb.length];
        for (const dy of [-H, 0, H]) {
          const gr = g.createRadialGradient(x, y + dy, 0, x, y + dy, r);
          gr.addColorStop(0, col + rand(0.08, 0.2) + ')'); gr.addColorStop(1, col + '0)');
          g.fillStyle = gr; g.fillRect(x - r, y + dy - r, r * 2, r * 2);
        }
      }
    });
  }

  /* -------- Props pre-renderizados por tema -------- */
  function cityRoof(R, w, h, hue) {
    return offscreen(w + 20, h + 20, R, g => {
      g.translate(10, 10);
      g.shadowColor = `hsl(${hue},100%,60%)`; g.shadowBlur = 14 * R;
      g.fillStyle = `hsl(${hue},40%,9%)`; g.fillRect(0, 0, w, h);
      g.shadowBlur = 0;
      g.strokeStyle = `hsla(${hue},100%,65%,0.9)`; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
      g.fillStyle = `hsl(${hue},30%,14%)`; g.fillRect(8, 8, w - 16, h - 16);
      // Ventanas / paneles iluminados
      for (let y = 14; y < h - 14; y += 10) for (let x = 14; x < w - 14; x += 10) {
        if (Math.random() < 0.28) { g.fillStyle = `hsla(${hue + rand(-20, 40)},100%,${rand(50, 80)}%,${rand(0.4, 0.9)})`; g.fillRect(x, y, 5, 4); }
      }
      // Antena / helipuerto
      if (Math.random() < 0.5) {
        g.strokeStyle = '#ffffff55'; g.lineWidth = 2; g.beginPath(); g.arc(w / 2, h / 2, Math.min(w, h) * 0.22, 0, Math.PI * 2); g.stroke();
        g.fillStyle = '#ff2a5a'; g.shadowColor = '#ff2a5a'; g.shadowBlur = 10 * R; g.beginPath(); g.arc(w / 2, h / 2, 3, 0, Math.PI * 2); g.fill();
      }
    });
  }
  function forgePanel(R, w, h) {
    return offscreen(w + 20, h + 20, R, g => {
      g.translate(10, 10);
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2a1a14'); gr.addColorStop(1, '#120a08');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#4a3024'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
      g.shadowColor = '#ff6a1a'; g.shadowBlur = 12 * R; g.strokeStyle = '#ff7a2a'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(10, h * 0.5); g.lineTo(w - 10, h * 0.5); g.stroke();
      if (w > 90) { g.beginPath(); g.moveTo(w * 0.5, 10); g.lineTo(w * 0.5, h - 10); g.stroke(); }
      g.shadowBlur = 0; g.fillStyle = '#5a3a2a';
      for (const [x, y] of [[8, 8], [w - 12, 8], [8, h - 12], [w - 12, h - 12]]) g.fillRect(x, y, 4, 4);
    });
  }
  function crystalSpire(R, s) {
    return offscreen(s + 30, s * 2 + 30, R, g => {
      g.translate(15 + s / 2, 15 + s);
      g.shadowColor = '#5ff'; g.shadowBlur = 20 * R;
      const n = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const a = rand(-0.6, 0.6), len = rand(s * 0.5, s), wd = rand(6, 14);
        g.save(); g.rotate(a);
        const gr = g.createLinearGradient(0, 0, 0, -len);
        gr.addColorStop(0, 'rgba(40,120,200,0.5)'); gr.addColorStop(1, 'rgba(210,255,255,0.85)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(-wd, 0); g.lineTo(0, -len); g.lineTo(wd, 0); g.closePath(); g.fill();
        g.restore();
      }
    });
  }
  function planet(R, r, c1, c2, ring) {
    return offscreen(r * 3, r * 3, Math.min(R, 1.5), g => {
      g.translate(r * 1.5, r * 1.5);
      const gr = g.createRadialGradient(-r * 0.4, -r * 0.4, r * 0.1, 0, 0, r);
      gr.addColorStop(0, c1); gr.addColorStop(1, c2);
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
      g.save(); g.clip();
      for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(255,255,255,${rand(0.02, 0.07)})`; g.fillRect(-r, -r + i * r * 0.23 + rand(0, 10), r * 2, rand(6, 20)); }
      g.restore();
      const at = g.createRadialGradient(0, 0, r * 0.9, 0, 0, r * 1.15);
      at.addColorStop(0, 'rgba(255,180,120,0.35)'); at.addColorStop(1, 'rgba(255,180,120,0)');
      g.fillStyle = at; g.beginPath(); g.arc(0, 0, r * 1.15, 0, Math.PI * 2); g.fill();
      if (ring) { g.strokeStyle = 'rgba(255,210,170,0.35)'; g.lineWidth = r * 0.08; g.beginPath(); g.ellipse(0, 0, r * 1.45, r * 0.35, -0.3, 0, Math.PI * 2); g.stroke(); }
    });
  }

  function create(theme, W, H, R) {
    const pal = PALETTES[theme] || PALETTES.title;
    const bg = { theme, W, H, t: 0, scroll: 0, layers: [], stars: [], progress: 0 };
    bg.neb = nebulaTile(W, H, R, pal);
    bg.nebY = 0;
    for (let l = 0; l < 3; l++) for (let i = 0; i < 55; i++)
      bg.stars.push({ x: rand(0, W), y: rand(0, H), l, s: rand(0.6, 1.6) * (l + 1) * 0.7, a: rand(0.3, 1) });

    const addLayer = (speed, count, makeProp, alpha = 1) => {
      const layer = { speed, alpha, props: [] };
      const protos = Array.from({ length: Math.min(count, 8) }, makeProp);
      for (let i = 0; i < count; i++) {
        const p = protos[i % protos.length];
        layer.props.push({ img: p.img, w: p.w, h: p.h, x: rand(-40, W + 40), y: rand(-H, H), rot: p.rot || 0, spin: p.spin || 0 });
      }
      bg.layers.push(layer);
    };

    if (theme === 'city') {
      addLayer(0.35, 14, () => { const w = rand(70, 130), h = rand(70, 130); return { img: cityRoof(R * 0.6, w, h, rand(190, 320)), w: w + 20, h: h + 20 }; }, 0.55);
      addLayer(0.8, 9, () => { const w = rand(110, 200), h = rand(110, 200); return { img: cityRoof(R * 0.8, w, h, rand(180, 340)), w: w + 20, h: h + 20 }; });
      bg.traffic = Array.from({ length: 26 }, () => ({ x: rand(0, W), y: rand(0, H), v: rand(120, 360) * (Math.random() < 0.5 ? 1 : -1), c: Math.random() < 0.5 ? '#ff3b6b' : '#6ff' }));
    } else if (theme === 'asteroids') {
      bg.planet = { img: planet(R, 260, '#ffb070', '#3a1408', true), x: W * 0.75, y: -200, w: 780, h: 780 };
      addLayer(0.25, 18, () => { const s = rand(10, 30); const k = 'r'; return { img: planet(R * 0.5, s, '#6a5a4a', '#1a1410', false), w: s * 3, h: s * 3, spin: rand(-1, 1) }; }, 0.6);
    } else if (theme === 'crystal') {
      addLayer(0.4, 10, () => { const s = rand(60, 110); return { img: crystalSpire(R * 0.6, s), w: s + 30, h: s * 2 + 30, rot: rand(0, 6.28) }; }, 0.45);
      addLayer(0.9, 6, () => { const s = rand(90, 150); return { img: crystalSpire(R * 0.8, s), w: s + 30, h: s * 2 + 30, rot: rand(0, 6.28) }; }, 0.85);
    } else if (theme === 'forge') {
      addLayer(0.5, 16, () => { const w = rand(60, 120), h = rand(60, 120); return { img: forgePanel(R * 0.6, w, h), w: w + 20, h: h + 20 }; }, 0.6);
      addLayer(1.0, 10, () => { const w = rand(100, 180), h = rand(80, 160); return { img: forgePanel(R * 0.8, w, h), w: w + 20, h: h + 20 }; });
      bg.lava = Array.from({ length: 5 }, (_, i) => ({ x: (i + 0.5) * W / 5 + rand(-30, 30), w: rand(4, 10), ph: rand(0, 6) }));
    } else if (theme === 'rift') {
      bg.streaks = true;
    } else if (theme === 'title') {
      bg.planet = { img: planet(R, 220, '#7fb0ff', '#0a0a3a', true), x: W * 0.2, y: H * 0.78, w: 660, h: 660, fixed: true };
    }

    bg.update = (dt, speed = 1) => {
      bg.t += dt;
      const v = 140 * speed * dt;
      bg.nebY = (bg.nebY + v * 0.15) % H;
      for (const s of bg.stars) { s.y += v * (0.1 + s.l * 0.15) * (theme === 'rift' ? 4 : 1); if (s.y > H) { s.y -= H; s.x = rand(0, W); } }
      for (const L of bg.layers) for (const p of L.props) {
        p.y += v * L.speed; p.rot += p.spin * dt;
        if (p.y - p.h / 2 > H + 20) { p.y = -p.h / 2 - rand(20, 400); p.x = rand(-40, W + 40); }
      }
      if (bg.planet && !bg.planet.fixed) { bg.planet.y += v * 0.05; if (bg.planet.y > H + 500) bg.planet.y = -500; }
      if (bg.traffic) for (const c of bg.traffic) { c.x += c.v * dt; c.y += v * 0.6; if (c.x < -20) c.x = W + 20; if (c.x > W + 20) c.x = -20; if (c.y > H) c.y -= H; }
    };

    bg.draw = (ctx) => {
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, pal.sky[0]); sky.addColorStop(0.55, pal.sky[1]); sky.addColorStop(1, pal.sky[2]);
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(bg.neb, 0, bg.nebY - H, W, H); ctx.drawImage(bg.neb, 0, bg.nebY, W, H);
      // Estrellas
      for (const s of bg.stars) {
        ctx.globalAlpha = s.a * (0.7 + 0.3 * Math.sin(bg.t * 3 + s.x));
        ctx.fillStyle = s.l === 2 ? '#dff' : '#9ab';
        if (theme === 'rift') ctx.fillRect(s.x, s.y, s.s * 0.6, s.s * 10);
        else ctx.fillRect(s.x, s.y, s.s, s.s);
      }
      ctx.globalAlpha = 1;
      if (bg.planet) { const p = bg.planet; ctx.drawImage(p.img, p.x - p.w / 2, p.y - p.h / 2, p.w, p.h); }
      if (bg.lava) {
        ctx.globalCompositeOperation = 'lighter';
        for (const l of bg.lava) {
          const a = 0.25 + 0.15 * Math.sin(bg.t * 2 + l.ph);
          const gr = ctx.createLinearGradient(l.x - l.w * 4, 0, l.x + l.w * 4, 0);
          gr.addColorStop(0, 'rgba(255,80,0,0)'); gr.addColorStop(0.5, `rgba(255,120,20,${a})`); gr.addColorStop(1, 'rgba(255,80,0,0)');
          ctx.fillStyle = gr; ctx.fillRect(l.x - l.w * 4, 0, l.w * 8, H);
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      for (const L of bg.layers) {
        ctx.globalAlpha = L.alpha;
        for (const p of L.props) {
          if (p.y + p.h / 2 < 0) continue;
          if (p.rot) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.drawImage(p.img, -p.w / 2, -p.h / 2, p.w, p.h); ctx.restore(); }
          else ctx.drawImage(p.img, p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
        }
      }
      ctx.globalAlpha = 1;
      if (bg.traffic) {
        ctx.globalCompositeOperation = 'lighter';
        for (const c of bg.traffic) { ctx.fillStyle = c.c; ctx.globalAlpha = 0.6; ctx.fillRect(c.x - 14 * Math.sign(c.v), c.y, 14, 2); }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
      if (theme === 'rift') drawRift(ctx, bg);
      // Viñeta
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    };
    return bg;
  }

  function drawRift(ctx, bg) {
    const { W, H, t } = bg;
    const open = 0.15 + bg.progress * 0.85;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const cx = W / 2;
    const gr = ctx.createRadialGradient(cx, -40, 0, cx, -40, 300 + open * 500);
    gr.addColorStop(0, `rgba(255,255,255,${0.35 + open * 0.4})`); gr.addColorStop(0.3, 'rgba(190,120,255,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#fff'; ctx.shadowColor = '#d8b0ff'; ctx.shadowBlur = 30 * Sprites.R;
    ctx.lineWidth = 2 + open * 8;
    ctx.beginPath();
    const len = H * (0.25 + open * 0.5);
    for (let y = -10; y < len; y += 18) {
      const x = cx + Math.sin(y * 0.05 + t * 4) * 10 * (1 - y / len) + Math.sin(y * 0.21 + t * 9) * 4;
      y < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  return { create };
})();

window.Backgrounds = Backgrounds;

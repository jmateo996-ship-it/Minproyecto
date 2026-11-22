/* Dibujo de iconos y gráficos de tienda. Se ejecuta dentro de Chromium (ver store-assets.cjs). */
window.ART = (function () {
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function shade(hex, f) { const n = parseInt(hex.slice(1), 16); return `rgb(${Math.min(255, ((n >> 16) & 255) * f) | 0},${Math.min(255, ((n >> 8) & 255) * f) | 0},${Math.min(255, (n & 255) * f) | 0})`; }

  function car(c, cx, cy, L, W, color, ang) {
    c.save(); c.translate(cx, cy); c.rotate(ang || 0);
    c.fillStyle = 'rgba(0,0,0,.3)'; rr(c, -L / 2 + W * 0.05, -W / 2 + W * 0.1, L, W, W * 0.32); c.fill();
    c.fillStyle = color; rr(c, -L / 2, -W / 2, L, W, W * 0.32); c.fill();
    c.fillStyle = shade(color, 0.8); rr(c, -L / 2, W * 0.18, L, W * 0.32, W * 0.2); c.fill();
    c.fillStyle = '#1d1d26';
    [[-L / 2 + W * 0.25, -W / 2 - W * 0.04], [L / 2 - W * 0.55, -W / 2 - W * 0.04], [-L / 2 + W * 0.25, W / 2 - W * 0.12], [L / 2 - W * 0.55, W / 2 - W * 0.12]]
      .forEach(([x, y]) => { rr(c, x, y, W * 0.3, W * 0.16, W * 0.05); c.fill(); });
    c.fillStyle = shade(color, 1.18); rr(c, -L * 0.28, -W * 0.34, L * 0.5, W * 0.68, W * 0.22); c.fill();
    c.fillStyle = '#cfe8ff'; rr(c, L * 0.16, -W * 0.32, L * 0.16 + W * 0.05, W * 0.64, W * 0.12); c.fill();
    const ex = L * 0.25 + W * 0.02;
    c.fillStyle = '#fff'; [-1, 1].forEach((s) => { c.beginPath(); c.arc(ex, s * W * 0.15, W * 0.1, 0, 7); c.fill(); });
    c.fillStyle = '#222'; [-1, 1].forEach((s) => { c.beginPath(); c.arc(ex + W * 0.02, s * W * 0.15, W * 0.05, 0, 7); c.fill(); });
    c.strokeStyle = '#222'; c.lineWidth = W * 0.045;
    [-1, 1].forEach((s) => { c.beginPath(); c.moveTo(ex - W * 0.1, s * W * 0.28); c.lineTo(ex + W * 0.06, s * W * 0.2); c.stroke(); });
    c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); const ax = -L * 0.08;
    c.moveTo(ax + W * 0.2, 0); c.lineTo(ax - W * 0.1, -W * 0.2); c.lineTo(ax - W * 0.1, W * 0.2); c.closePath(); c.fill();
    c.restore();
  }
  function screw(c, x, y, r, col) {
    c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(x + r * 0.12, y + r * 0.2, r, 0, 7); c.fill();
    const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, '#fff'); g.addColorStop(0.35, col); g.addColorStop(1, shade(col, 0.6));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = r * 0.18; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - r * 0.5, y); c.lineTo(x + r * 0.5, y); c.moveTo(x, y - r * 0.5); c.lineTo(x, y + r * 0.5); c.stroke();
  }
  function gear(c, x, y, r, col) {
    c.save(); c.translate(x, y); c.fillStyle = col;
    for (let i = 0; i < 10; i++) { c.save(); c.rotate(i / 10 * Math.PI * 2); c.fillRect(-r * 0.13, -r * 1.18, r * 0.26, r * 0.36); c.restore(); }
    c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
    c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(0, 0, r * 0.35, 0, 7); c.fill();
    c.restore();
  }

  /** Arte central de cada juego dentro de un cuadrado de lado s centrado en (0,0). */
  function art(c, kind, s) {
    if (kind === 'aparcamiento') {
      car(c, -s * 0.02, -s * 0.2, s * 0.7, s * 0.34, '#ffb400', 0);
      car(c, s * 0.05, s * 0.2, s * 0.62, s * 0.3, '#ff5a5f', Math.PI);
      c.font = `900 ${s * 0.22}px system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    } else if (kind === 'cocina-zombi') {
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `${s * 0.72}px "Noto Color Emoji", sans-serif`; c.fillText('🧟', -s * 0.06, s * 0.02);
      c.font = `${s * 0.36}px "Noto Color Emoji", sans-serif`; c.fillText('🍔', s * 0.3, s * 0.26);
      c.font = `${s * 0.28}px "Noto Color Emoji", sans-serif`; c.fillText('🍳', -s * 0.34, s * 0.3);
    } else {
      gear(c, s * 0.08, s * 0.02, s * 0.36, 'rgba(255,255,255,.18)');
      screw(c, -s * 0.2, -s * 0.18, s * 0.17, '#ff4d6d');
      screw(c, s * 0.24, -s * 0.12, s * 0.15, '#ffb703');
      screw(c, -s * 0.02, s * 0.24, s * 0.2, '#3a86ff');
    }
  }
  function bgFill(c, w, h, a) {
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, shade(a.accent, 1.15)); g.addColorStop(1, a.bg);
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  }

  function canvas(w, h) { const k = document.createElement('canvas'); k.width = w; k.height = h; return k; }

  return {
    /** Icono completo (cuadrado, con fondo). round=true → recorte circular. */
    icon(a, size, round) {
      const k = canvas(size, size), c = k.getContext('2d');
      c.save();
      if (round) { c.beginPath(); c.arc(size / 2, size / 2, size / 2, 0, 7); c.clip(); }
      bgFill(c, size, size, a);
      c.translate(size / 2, size / 2); art(c, a.dir, size * 0.82);
      c.restore();
      return k.toDataURL('image/png');
    },
    /** Primer plano del icono adaptativo (transparente, arte en la zona segura del 66 %). */
    foreground(a, size) {
      const k = canvas(size, size), c = k.getContext('2d');
      c.translate(size / 2, size / 2); art(c, a.dir, size * 0.56);
      return k.toDataURL('image/png');
    },
    splash(a, w, h) {
      const k = canvas(w, h), c = k.getContext('2d');
      c.fillStyle = a.bg; c.fillRect(0, 0, w, h);
      const s = Math.min(w, h) * 0.42;
      c.save(); c.translate(w / 2, h / 2 - s * 0.15);
      rr(c, -s / 2, -s / 2, s, s, s * 0.22); c.clip();
      c.save(); c.translate(-s / 2, -s / 2); bgFill(c, s, s, a); c.restore();
      art(c, a.dir, s * 0.82);
      c.restore();
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = `800 ${s * 0.13}px system-ui, sans-serif`;
      c.fillText(a.name, w / 2, h / 2 + s * 0.55);
      return k.toDataURL('image/png');
    },
    feature(a, w, h, tagline) {
      const k = canvas(w, h), c = k.getContext('2d');
      bgFill(c, w, h, a);
      c.save(); c.translate(w * 0.8, h * 0.5); art(c, a.dir, h * 0.78); c.restore();
      c.fillStyle = '#fff'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 12;
      c.font = `900 ${h * 0.15}px system-ui, sans-serif`;
      const words = a.name.split(' ');
      const l1 = words.length > 2 ? words.slice(0, 1).join(' ') : words[0], l2 = words.slice(l1.split(' ').length).join(' ');
      c.fillText(l1, w * 0.06, h * 0.42); c.fillText(l2, w * 0.06, h * 0.6);
      c.font = `600 ${h * 0.065}px system-ui, sans-serif`; c.fillText(tagline, w * 0.06, h * 0.78);
      return k.toDataURL('image/png');
    },
    /** Captura de tienda: fondo, titular y la captura del juego en un marco. */
    async screenshot(a, shotUrl, headline, w, h) {
      const img = await new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = shotUrl; });
      const k = canvas(w, h), c = k.getContext('2d');
      bgFill(c, w, h, a);
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = `900 ${w * 0.075}px system-ui, sans-serif`;
      c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 10;
      const lines = headline.split('\n');
      lines.forEach((l, i) => c.fillText(l, w / 2, h * 0.085 + i * w * 0.088));
      c.shadowBlur = 30; c.shadowColor = 'rgba(0,0,0,.45)';
      const fw = w * 0.8, fh = fw * img.height / img.width, fx = (w - fw) / 2, fy = h * 0.075 + lines.length * w * 0.088;
      c.fillStyle = '#111'; rr(c, fx - 14, fy - 14, fw + 28, fh + 28, 48); c.fill(); c.shadowBlur = 0;
      c.save(); rr(c, fx, fy, fw, fh, 36); c.clip(); c.drawImage(img, fx, fy, fw, fh); c.restore();
      return k.toDataURL('image/png');
    },
  };
})();

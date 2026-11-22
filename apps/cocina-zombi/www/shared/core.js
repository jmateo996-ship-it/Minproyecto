/* Núcleo compartido por los tres juegos: guardado, sonido, idioma, anuncios y utilidades.
   Se copia a cada app con `npm run sync-shared`. No requiere bundler. */
(function () {
  'use strict';

  // ---------- Guardado ----------
  function makeStore(ns) {
    const key = 'save:' + ns;
    let data = {};
    try { data = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (e) { data = {}; }
    return {
      get(k, def) { return k in data ? data[k] : def; },
      set(k, v) { data[k] = v; this.flush(); },
      flush() { try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* sin almacenamiento */ } },
      all() { return data; },
    };
  }

  // ---------- Idioma ----------
  const lang = (navigator.language || 'es').slice(0, 2).toLowerCase() === 'es' ? 'es' : 'en';
  function makeT(dict) {
    return function t(id, vars) {
      const entry = dict[id];
      let s = entry ? (entry[lang] || entry.es) : id;
      if (vars) for (const k in vars) s = s.replace('{' + k + '}', vars[k]);
      return s;
    };
  }

  // ---------- Sonido sintetizado (sin archivos de audio) ----------
  let ctx = null;
  const settings = makeStore('settings');
  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type, vol, slide) {
    if (!settings.get('sound', true)) return;
    const a = ac(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, a.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), a.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.15, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g); g.connect(a.destination);
    o.start(); o.stop(a.currentTime + dur + 0.02);
  }
  function noise(dur, vol) {
    if (!settings.get('sound', true)) return;
    const a = ac(); if (!a) return;
    const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = a.createBufferSource(), g = a.createGain();
    s.buffer = buf; g.gain.value = vol || 0.2;
    s.connect(g); g.connect(a.destination); s.start();
  }
  const sfx = {
    tap() { tone(660, 0.06, 'triangle', 0.08); },
    pop() { tone(520, 0.09, 'sine', 0.12, 1.8); },
    coin() { tone(988, 0.07, 'square', 0.06); setTimeout(() => tone(1319, 0.12, 'square', 0.06), 60); },
    honk() { tone(330, 0.18, 'sawtooth', 0.1); setTimeout(() => tone(311, 0.22, 'sawtooth', 0.1), 120); },
    crash() { noise(0.25, 0.25); tone(120, 0.25, 'square', 0.1, 0.5); },
    win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'triangle', 0.12), i * 110)); },
    lose() { [392, 330, 262].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'sawtooth', 0.08), i * 160)); },
    hit() { tone(200, 0.08, 'square', 0.1, 0.6); },
    rewind() { tone(300, 0.35, 'sine', 0.12, 3); },
    whoosh() { noise(0.15, 0.08); },
  };
  function vibrate(ms) { if (settings.get('vibe', true) && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) {} }

  // ---------- Anuncios (AdMob vía Capacitor; simulados en navegador) ----------
  const TEST_IDS = {
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  };
  function plugin() {
    const C = window.Capacitor;
    return C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.AdMob ? C.Plugins.AdMob : null;
  }
  const ads = {
    ids: Object.assign({}, TEST_IDS),
    ready: false,
    noAds: false,
    lastInterstitial: 0,
    async init(cfg) {
      cfg = cfg || {};
      const testing = !cfg.production;
      if (!testing) Object.assign(this.ids, cfg.ids || {});
      this.noAds = makeStore('settings').get('noAds', false);
      const A = plugin(); if (!A) return;
      try {
        await A.initialize({ initializeForTesting: testing });
        // Consentimiento GDPR/UMP (obligatorio en la UE)
        try {
          const info = await A.requestConsentInfo();
          if (info && info.isConsentFormAvailable && info.status === 'REQUIRED') await A.showConsentForm();
        } catch (e) { /* sin formulario configurado */ }
        this.ready = true;
      } catch (e) { console.warn('AdMob init', e); }
    },
    async interstitial(minGapMs) {
      if (this.noAds) return;
      const now = Date.now();
      if (now - this.lastInterstitial < (minGapMs || 90000)) return;
      this.lastInterstitial = now;
      const A = plugin(); if (!A || !this.ready) return;
      try { await A.prepareInterstitial({ adId: this.ids.interstitial }); await A.showInterstitial(); } catch (e) { console.warn(e); }
    },
    /** Devuelve true si el jugador ganó la recompensa. */
    async rewarded() {
      const A = plugin();
      if (!A || !this.ready) return fakeRewarded();
      try {
        await A.prepareRewardVideoAd({ adId: this.ids.rewarded });
        const r = await A.showRewardVideoAd();
        return !!r;
      } catch (e) { console.warn(e); toast(lang === 'es' ? 'Anuncio no disponible' : 'Ad not available'); return false; }
    },
  };
  function fakeRewarded() {
    return new Promise((res) => {
      const d = document.createElement('div');
      d.className = 'fake-ad';
      d.innerHTML = '<div><b>AD</b><br>' + (lang === 'es' ? 'Anuncio de prueba…' : 'Test ad…') + '</div>';
      document.body.appendChild(d);
      setTimeout(() => { d.remove(); res(true); }, 1500);
    });
  }

  // ---------- UI ----------
  function toast(msg) {
    const d = document.createElement('div');
    d.className = 'toast'; d.textContent = msg;
    document.body.appendChild(d);
    setTimeout(() => d.classList.add('out'), 1400);
    setTimeout(() => d.remove(), 1900);
  }
  /** Muestra un panel modal. buttons: [{label, cls, onClick}] */
  function modal(html, buttons) {
    const wrap = document.createElement('div');
    wrap.className = 'modal';
    const box = document.createElement('div');
    box.className = 'modal-box';
    box.innerHTML = html;
    const row = document.createElement('div');
    row.className = 'modal-btns';
    (buttons || []).forEach((b) => {
      const el = document.createElement('button');
      el.className = 'btn ' + (b.cls || '');
      el.innerHTML = b.label;
      el.onclick = () => { sfx.tap(); if (b.keep !== true) wrap.remove(); b.onClick && b.onClick(wrap); };
      row.appendChild(el);
    });
    box.appendChild(row);
    wrap.appendChild(box);
    document.body.appendChild(wrap);
    return wrap;
  }

  /** Ajusta un canvas a pantalla completa con DPR. Devuelve {w,h,dpr} lógico. */
  function fitCanvas(canvas, onResize) {
    const view = { w: 0, h: 0, dpr: 1 };
    function r() {
      view.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      view.w = window.innerWidth; view.h = window.innerHeight;
      canvas.width = Math.round(view.w * view.dpr);
      canvas.height = Math.round(view.h * view.dpr);
      canvas.style.width = view.w + 'px'; canvas.style.height = view.h + 'px';
      onResize && onResize(view);
    }
    window.addEventListener('resize', r);
    r();
    return view;
  }

  function roundRect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function fmt(n) {
    n = Math.floor(n);
    if (n < 1000) return String(n);
    const u = ['K', 'M', 'B', 'T', 'aa', 'ab', 'ac'];
    let i = -1;
    while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
    return (n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : Math.floor(n)) + u[i];
  }

  // Botón atrás de Android
  function onBack(fn) {
    const C = window.Capacitor;
    if (C && C.Plugins && C.Plugins.App) C.Plugins.App.addListener('backButton', fn);
  }

  // Pausa al ir a segundo plano
  function onPause(fn) { document.addEventListener('visibilitychange', () => { if (document.hidden) fn(); }); }

  function settingsModal(t) {
    const s = makeStore('settings');
    const row = (id, label) => `<label class="set-row"><span>${label}</span><input type="checkbox" id="${id}" ${s.get(id, true) ? 'checked' : ''}></label>`;
    const m = modal(`<h2>⚙️</h2>${row('sound', lang === 'es' ? 'Sonido' : 'Sound')}${row('vibe', lang === 'es' ? 'Vibración' : 'Vibration')}
      <p class="small"><a href="privacy.html">${lang === 'es' ? 'Política de privacidad' : 'Privacy policy'}</a></p>`,
      [{ label: 'OK', cls: 'primary' }]);
    m.querySelectorAll('input').forEach((i) => (i.onchange = () => s.set(i.id, i.checked)));
  }

  window.G = { makeStore, makeT, lang, sfx, vibrate, ads, toast, modal, fitCanvas, roundRect, fmt, onBack, onPause, settingsModal };
})();

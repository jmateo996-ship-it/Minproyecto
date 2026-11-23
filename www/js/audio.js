/* =========================================================================
   Audio procedural con WebAudio: efectos y música sintetizada por capítulo.
   No requiere archivos externos (ideal para el tamaño de la app).
   ========================================================================= */
'use strict';

const Audio = (() => {
  let ctx = null, master = null, sfxBus = null, musicBus = null;
  let enabled = true;
  let musicTimer = null, step = 0, nextTime = 0, currentSong = null;
  const last = {};

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
    const comp = ctx.createDynamicsCompressor(); comp.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(comp);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.32; musicBus.connect(comp);
  }

  function throttle(name, ms) {
    const now = performance.now();
    if (last[name] && now - last[name] < ms) return true;
    last[name] = now; return false;
  }

  function tone(freq, dur, type = 'square', vol = 0.2, slide = 0, bus = sfxBus, when = 0) {
    if (!ctx || !enabled) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.02);
  }

  let noiseBuf = null;
  function noise(dur, vol = 0.3, freq = 1200, q = 0.8, when = 0) {
    if (!ctx || !enabled) return;
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = ctx.currentTime + when;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = q;
    f.frequency.setValueAtTime(freq, t); f.frequency.exponentialRampToValueAtTime(60, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t); s.stop(t + dur);
  }

  const sfx = {
    shoot()   { if (throttle('shoot', 90)) return; tone(880, 0.06, 'square', 0.05, 0.5); },
    hit()     { if (throttle('hit', 40)) return; tone(320, 0.05, 'sawtooth', 0.06, 0.6); },
    explode() { if (throttle('exp', 50)) return; noise(0.45, 0.35, 1800); tone(120, 0.3, 'sine', 0.25, 0.3); },
    bigExplode() { noise(1.4, 0.6, 2400, 1.2); tone(70, 1.2, 'sine', 0.5, 0.25); tone(140, 0.8, 'sawtooth', 0.15, 0.2); },
    power()   { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, 'triangle', 0.18, 1, sfxBus, i * 0.06)); },
    phase()   { tone(200, 0.35, 'sine', 0.25, 6); tone(400, 0.35, 'triangle', 0.1, 4); },
    bomb()    { noise(1.6, 0.6, 4000, 2); tone(60, 1.5, 'sine', 0.6, 0.5); tone(1200, 0.8, 'sawtooth', 0.12, 0.05); },
    hurt()    { tone(160, 0.4, 'sawtooth', 0.3, 0.3); noise(0.3, 0.3, 900); },
    alarm()   { for (let i = 0; i < 4; i++) { tone(660, 0.18, 'square', 0.12, 1, sfxBus, i * 0.4); tone(440, 0.18, 'square', 0.12, 1, sfxBus, i * 0.4 + 0.2); } },
    blip()    { tone(1200, 0.04, 'square', 0.05); },
    select()  { tone(660, 0.08, 'triangle', 0.15); tone(990, 0.12, 'triangle', 0.12, 1, sfxBus, 0.06); },
  };

  /* Canciones: escala (semitonos desde la raíz), raíz MIDI, tempo y progresión */
  const SONGS = {
    title:     { root: 45, bpm: 84,  scale: [0, 3, 7, 10, 12, 15], prog: [0, -4, -2, -5], lead: 0.5 },
    city:      { root: 45, bpm: 128, scale: [0, 3, 5, 7, 10, 12], prog: [0, 0, -4, -2], lead: 1 },
    asteroids: { root: 43, bpm: 136, scale: [0, 2, 3, 7, 8, 12],  prog: [0, -2, -4, -5], lead: 1 },
    crystal:   { root: 47, bpm: 112, scale: [0, 2, 4, 7, 9, 12],  prog: [0, -3, -5, -7], lead: 0.8 },
    forge:     { root: 40, bpm: 144, scale: [0, 1, 5, 7, 8, 12],  prog: [0, 0, 1, -2], lead: 1 },
    rift:      { root: 42, bpm: 150, scale: [0, 3, 6, 7, 10, 12], prog: [0, -4, -1, -6], lead: 1 },
    boss:      { root: 41, bpm: 156, scale: [0, 1, 4, 7, 8, 11],  prog: [0, 1, 0, -1], lead: 1 },
    room:      { root: 44, bpm: 96,  scale: [0, 2, 3, 7, 8, 12],  prog: [0, -2, -4, -5], lead: 0.5 },
    ending:    { root: 48, bpm: 76,  scale: [0, 2, 4, 7, 9, 12],  prog: [0, 5, -3, 7], lead: 0.6 },
  };
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function scheduleStep(song, t) {
    const bar = Math.floor(step / 16) % song.prog.length;
    const s16 = step % 16;
    const root = song.root + song.prog[bar];
    const beat = 60 / song.bpm / 4;
    const when = t - ctx.currentTime;
    // Bajo
    if (s16 % 4 === 0 || s16 === 14) tone(mtof(root - 12), beat * 3, 'sawtooth', 0.22, 1, musicBus, when);
    // Arpegio
    const idx = (step * 7 + bar * 3) % song.scale.length;
    if (s16 % 2 === 0) tone(mtof(root + 12 + song.scale[idx]), beat * 1.6, 'square', 0.05, 1, musicBus, when);
    // Melodía lenta
    if (song.lead && s16 % 8 === 0 && ((step >> 3) * 5 + bar) % 3 !== 0) {
      const n = song.scale[((step >> 3) * 3 + bar) % song.scale.length];
      tone(mtof(root + 24 + n), beat * 7, 'triangle', 0.07 * song.lead, 1, musicBus, when);
    }
    // Percusión
    if (song.bpm > 100) {
      if (s16 % 4 === 0) { tone(110, 0.12, 'sine', 0.35, 0.3, musicBus, when); }
      if (s16 % 8 === 4) noiseMusic(0.12, 0.12, when);
      if (s16 % 2 === 1) noiseMusic(0.03, 0.03, when, 8000);
    }
  }
  function noiseMusic(dur, vol, when, freq = 3000) {
    if (!noiseBuf) noise(0.01, 0.0001);
    const t = ctx.currentTime + when;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = freq;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(musicBus); s.start(t); s.stop(t + dur + 0.01);
  }

  function music(name) {
    if (!ctx) return;
    if (currentSong === name) return;
    stopMusic();
    const song = SONGS[name]; if (!song) return;
    currentSong = name; step = 0; nextTime = ctx.currentTime + 0.1;
    musicTimer = setInterval(() => {
      if (!enabled || ctx.state !== 'running') return;
      const beat = 60 / song.bpm / 4;
      while (nextTime < ctx.currentTime + 0.25) { scheduleStep(song, nextTime); nextTime += beat; step++; }
    }, 50);
  }
  function stopMusic() { if (musicTimer) clearInterval(musicTimer); musicTimer = null; currentSong = null; }

  function setEnabled(v) {
    enabled = v;
    if (master) master.gain.value = v ? 0.8 : 0;
  }
  function suspend() { if (ctx && ctx.state === 'running') ctx.suspend(); }
  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

  return { init, sfx, music, stopMusic, setEnabled, get enabled() { return enabled; }, suspend, resume };
})();

window.GameAudio = Audio;

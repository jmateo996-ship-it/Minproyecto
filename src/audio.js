// ============================================================================
// Audio procedural (Web Audio): ambiente, disparos, criaturas y música de alerta
// ============================================================================
const SFX = {
  ctx: null, master: null, amb: null, music: null, musicOn: false, seqTimer: null, seqStep: 0, nb: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC();
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.connect(c.destination);
    this.master = c.createGain(); this.master.gain.value = 0.8; this.master.connect(comp);
    const rev = c.createConvolver(); rev.buffer = this.impulse(2.8); this.rev = c.createGain(); this.rev.gain.value = 0.35; this.rev.connect(rev); rev.connect(this.master);
    this.nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const d = this.nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.musicBus = c.createGain(); this.musicBus.gain.value = 0; this.musicBus.connect(this.master);
    if (this.pendingMood) this.mystery(this.pendingMood);
  },
  impulse(sec) { const c = this.ctx, n = c.sampleRate * sec, b = c.createBuffer(2, n, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); } return b; },
  out(vol = 1, pan = 0, wet = 0.3) {
    const c = this.ctx, g = c.createGain(); g.gain.value = vol;
    let node = g;
    if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); node = p; }
    node.connect(this.master); if (wet > 0) { const w = c.createGain(); w.gain.value = wet; node.connect(w); w.connect(this.rev); }
    return g;
  },
  noise(dst, t, dur, f, q = 1, type = 'bandpass', vol = 1, attack = 0.002) {
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.nb; s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dst); s.start(t, Math.random()); s.stop(t + dur + 0.05); return fl;
  },
  tone(dst, t, dur, f0, f1, type = 'sine', vol = 1) {
    const c = this.ctx, o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(dst); o.start(t); o.stop(t + dur + 0.05);
  },
  ok() { return !!this.ctx; },
  pistol() { if (!this.ok()) return; const t = this.ctx.currentTime, o = this.out(0.55, 0, 0.25); this.noise(o, t, 0.09, 2200, 0.8, 'bandpass', 1); this.noise(o, t, 0.05, 6000, 1, 'highpass', 0.4); this.tone(o, t, 0.06, 180, 60, 'triangle', 0.6); this.noise(o, t + 0.12, 0.03, 3500, 4, 'bandpass', 0.2); },
  shotgun() { if (!this.ok()) return; const t = this.ctx.currentTime, o = this.out(1, 0, 0.5); this.noise(o, t, 0.5, 900, 0.5, 'lowpass', 1.4); this.tone(o, t, 0.3, 120, 40, 'sine', 1.2); this.noise(o, t + 0.35, 0.06, 1800, 3, 'bandpass', 0.35); this.noise(o, t + 0.48, 0.05, 1400, 3, 'bandpass', 0.3); },
  enemyShot(d, pan) { if (!this.ok()) return; const v = Math.max(0.05, 1 - d / 40); const t = this.ctx.currentTime, o = this.out(0.7 * v, pan, 0.5); this.noise(o, t, 0.22, 1400, 0.6, 'lowpass', 1); this.tone(o, t, 0.12, 150, 50, 'triangle', 0.6); },
  explosion(d = 0) { if (!this.ok()) return; const v = Math.max(0.2, 1 - d / 60), t = this.ctx.currentTime, o = this.out(1.3 * v, 0, 0.7); this.noise(o, t, 1.8, 400, 0.4, 'lowpass', 1.6, 0.01); this.tone(o, t, 1.2, 70, 25, 'sine', 1.5); this.noise(o, t, 0.4, 3000, 0.5, 'bandpass', 0.6); },
  step(run, surf = 'hard') { if (!this.ok()) return; const t = this.ctx.currentTime, o = this.out(run ? 0.22 : 0.12, (Math.random() - 0.5) * 0.2, 0.15); this.noise(o, t, run ? 0.09 : 0.07, surf === 'snow' ? 900 : surf === 'wet' ? 1800 : 600, surf === 'snow' ? 0.6 : 1.4, 'bandpass', 1, 0.004); },
  groan(d, pan, pitch = 1) {
    if (!this.ok()) return; const v = Math.max(0, 1 - d / 22); if (v <= 0) return;
    const c = this.ctx, t = c.currentTime, o = this.out(0.35 * v, pan, 0.6), dur = 0.8 + Math.random() * 0.8;
    const osc = c.createOscillator(); osc.type = 'sawtooth'; const f = (70 + Math.random() * 50) * pitch; osc.frequency.setValueAtTime(f, t); osc.frequency.linearRampToValueAtTime(f * (0.7 + Math.random() * 0.5), t + dur);
    const lfo = c.createOscillator(); lfo.frequency.value = 6 + Math.random() * 8; const lg = c.createGain(); lg.gain.value = f * 0.08; lfo.connect(lg); lg.connect(osc.frequency);
    const f1 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 500 + Math.random() * 300; f1.Q.value = 3;
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 0.12); g.gain.linearRampToValueAtTime(0, t + dur);
    osc.connect(f1); f1.connect(g); g.connect(o); osc.start(t); lfo.start(t); osc.stop(t + dur); lfo.stop(t + dur);
    this.noise(o, t, dur, 1200, 2, 'bandpass', 0.25, 0.1);
  },
  screech(d, pan) { if (!this.ok()) return; const v = Math.max(0, 1 - d / 30); const t = this.ctx.currentTime, o = this.out(0.5 * v, pan, 0.6); this.tone(o, t, 0.6, 900, 400, 'sawtooth', 0.4); this.noise(o, t, 0.6, 2500, 2, 'bandpass', 0.7, 0.05); },
  roar() { if (!this.ok()) return; const t = this.ctx.currentTime, o = this.out(1, 0, 0.8); this.tone(o, t, 1.6, 90, 40, 'sawtooth', 0.8); this.noise(o, t, 1.6, 300, 1, 'lowpass', 1.2, 0.1); },
  hit() { if (!this.ok()) return; const t = this.ctx.currentTime, o = this.out(0.35, 0, 0.1); this.noise(o, t, 0.08, 400, 1, 'lowpass', 1); },
  hurt() { if (!this.ok()) return; const t = this.ctx.currentTime, o = this.out(0.5, 0, 0.2); this.tone(o, t, 0.2, 260, 140, 'square', 0.25); this.noise(o, t, 0.15, 700, 1, 'lowpass', 0.8); },
  knife() { if (!this.ok()) return; const t = this.ctx.currentTime, o = this.out(0.4, 0, 0.1); this.noise(o, t, 0.12, 4000, 2, 'bandpass', 1, 0.02); },
  takedown() { if (!this.ok()) return; const t = this.ctx.currentTime, o = this.out(0.5, 0, 0.15); this.noise(o, t, 0.15, 300, 1, 'lowpass', 1); this.tone(o, t + 0.05, 0.12, 120, 60, 'sine', 0.8); },
  reload() { if (!this.ok()) return; const t = this.ctx.currentTime, o = this.out(0.35, 0, 0.1); this.noise(o, t, 0.04, 3000, 5, 'bandpass', 1); this.noise(o, t + 0.35, 0.05, 2200, 5, 'bandpass', 1); this.noise(o, t + 0.55, 0.04, 4000, 5, 'bandpass', 1); },
  empty() { if (!this.ok()) return; const t = this.ctx.currentTime, o = this.out(0.3, 0, 0); this.noise(o, t, 0.03, 5000, 6, 'bandpass', 1); },
  pickup() { if (!this.ok()) return; const t = this.ctx.currentTime, o = this.out(0.25, 0, 0.3); this.tone(o, t, 0.12, 880, 0, 'triangle', 0.7); this.tone(o, t + 0.08, 0.2, 1320, 0, 'triangle', 0.6); },
  objective() { if (!this.ok()) return; const t = this.ctx.currentTime, o = this.out(0.3, 0, 0.5); [523, 659, 784].forEach((f, i) => this.tone(o, t + i * 0.09, 0.5, f, 0, 'triangle', 0.6)); },
  blip() { if (!this.ok()) return; const t = this.ctx.currentTime, o = this.out(0.12, 0, 0); this.tone(o, t, 0.05, 1600, 0, 'square', 0.4); },
  radio() { if (!this.ok()) return; const t = this.ctx.currentTime, o = this.out(0.18, 0, 0); this.tone(o, t, 0.07, 1200, 0, 'sine', 0.8); this.tone(o, t + 0.09, 0.09, 1800, 0, 'sine', 0.8); this.noise(o, t, 0.2, 3000, 0.5, 'bandpass', 0.2); },
  ui() { if (!this.ok()) return; const t = this.ctx.currentTime, o = this.out(0.15, 0, 0); this.tone(o, t, 0.04, 700, 0, 'square', 0.3); },
  alert() {
    if (!this.ok()) return; const t = this.ctx.currentTime, o = this.out(0.6, 0, 0.6);
    [[311, 'sawtooth'], [440, 'square'], [622, 'sawtooth']].forEach(([f, ty]) => this.tone(o, t, 0.7, f, f * 0.98, ty, 0.25));
    this.noise(o, t, 0.25, 5000, 1, 'highpass', 0.5);
  },
  caution() { if (!this.ok()) return; const t = this.ctx.currentTime, o = this.out(0.35, 0, 0.4); this.tone(o, t, 0.35, 660, 640, 'triangle', 0.5); this.tone(o, t + 0.18, 0.35, 495, 480, 'triangle', 0.5); },
  heartbeat() { if (!this.ok()) return; const t = this.ctx.currentTime, o = this.out(0.6, 0, 0); this.tone(o, t, 0.15, 60, 40, 'sine', 1); this.tone(o, t + 0.22, 0.15, 55, 38, 'sine', 0.8); },
  door() { if (!this.ok()) return; const t = this.ctx.currentTime, o = this.out(0.5, 0, 0.5); this.noise(o, t, 1.4, 220, 1, 'lowpass', 0.9, 0.2); this.tone(o, t, 1.3, 90, 70, 'sawtooth', 0.15); this.noise(o, t + 1.3, 0.2, 600, 2, 'bandpass', 0.8); },
  buzz() { if (!this.ok()) return; const t = this.ctx.currentTime, o = this.out(0.4, 0, 0.2); this.tone(o, t, 0.45, 110, 105, 'square', 0.35); this.tone(o, t, 0.45, 116, 110, 'square', 0.3); },
  beep() { if (!this.ok()) return; const t = this.ctx.currentTime, o = this.out(0.25, 0, 0.2); this.tone(o, t, 0.1, 2000, 0, 'square', 0.4); },
  ambient(theme) {
    if (!this.ok()) return; const c = this.ctx;
    if (this.amb) { const old = this.amb; old.g.gain.linearRampToValueAtTime(0, c.currentTime + 1.5); setTimeout(() => old.nodes.forEach(n => { try { n.stop(); } catch (e) { } }), 1800); }
    const g = c.createGain(); g.gain.value = 0; g.connect(this.master); g.gain.linearRampToValueAtTime(1, c.currentTime + 3);
    const nodes = [];
    const outdoor = ['snow', 'docks', 'hangar'].includes(theme);
    // zumbido grave
    [[outdoor ? 48 : 55, 0.035], [outdoor ? 48.7 : 82.5, 0.025]].forEach(([f, v]) => { const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f; const og = c.createGain(); og.gain.value = v; o.connect(og); og.connect(g); o.start(); nodes.push(o); });
    // viento / ventilación
    const s = c.createBufferSource(); s.buffer = this.nb; s.loop = true; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = outdoor ? 500 : 180; f.Q.value = outdoor ? 0.7 : 1.5;
    const sg = c.createGain(); sg.gain.value = outdoor ? 0.05 : 0.028; const l = c.createOscillator(); l.frequency.value = 0.08; const lg = c.createGain(); lg.gain.value = outdoor ? 260 : 60; l.connect(lg); lg.connect(f.frequency);
    s.connect(f); f.connect(sg); sg.connect(g); s.start(); l.start(); nodes.push(s, l);
    if (theme === 'burning' || theme === 'reactor') { const s2 = c.createBufferSource(); s2.buffer = this.nb; s2.loop = true; const f2 = c.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = 300; const g2 = c.createGain(); g2.gain.value = 0.07; s2.connect(f2); f2.connect(g2); g2.connect(g); s2.start(); nodes.push(s2); }
    this.amb = { g, nodes };
    // ecos lejanos aleatorios
    clearInterval(this.creak); this.creak = setInterval(() => { if (!this.ctx || Math.random() < 0.5) return; const t = c.currentTime, o = this.out(0.035, Math.random() * 2 - 1, 0.9); if (outdoor) this.noise(o, t, 2.5, 300 + Math.random() * 300, 3, 'bandpass', 0.6, 0.8); else this.tone(o, t, 1.5, 200 + Math.random() * 400, 150 + Math.random() * 100, 'sine', 0.4); }, 6000);
  },
  setMusic(level) { // 0 nada, 1 tensión, 2 alerta
    if (!this.ok()) return; const c = this.ctx;
    this.musicBus.gain.cancelScheduledValues(c.currentTime);
    this.musicBus.gain.linearRampToValueAtTime(!this.musicEnabled ? 0 : level === 2 ? 0.5 : level === 1 ? 0.22 : 0, c.currentTime + (level ? 0.3 : 3));
    if (this.duck) this.duck(level > 0);
    this.musicLevel = level;
    if (level && !this.seqTimer) {
      const bass = [41.2, 41.2, 43.65, 41.2, 41.2, 49, 46.25, 43.65];
      this.seqTimer = setInterval(() => {
        const t = c.currentTime + 0.02, st = this.seqStep++;
        const fast = this.musicLevel === 2;
        if (!fast && st % 2) return;
        const o = this.musicBus;
        const f = bass[(st >> (fast ? 1 : 2)) % bass.length];
        this.tone(o, t, 0.2, f * 2, f * 2, 'sawtooth', 0.35);
        if (st % 4 === 0) this.tone(o, t, 0.25, 60, 35, 'sine', 0.9);
        if (fast) this.noise(o, t, 0.04, 8000, 1, 'highpass', st % 2 ? 0.08 : 0.16);
        if (fast && st % 8 === 6) this.tone(o, t, 0.4, f * 8, f * 7.6, 'square', 0.06);
      }, 125);
    }
    if (!level && this.seqTimer) { const tm = this.seqTimer; setTimeout(() => { if (!this.musicLevel) { clearInterval(tm); if (this.seqTimer === tm) this.seqTimer = null; } }, 3200); }
  },
};

// ============================================================================
// Banda sonora de misterio (generativa)
// ============================================================================
const MOODS = {
  // acordes en notas MIDI; escala para la melodía; densidad de notas; motivo fijo opcional
  title:   { chords: [[50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52]], scale: [62, 64, 65, 67, 69, 70, 73, 74], dens: 0.0, beat: 0.42, vol: 0.55,
             motif: [74, 77, 81, 79, 77, 76, 73, 74, null, 69, 70, 69, 67, 65, 64, 65, null, null] },
  brief:   { chords: [[50, 57, 64], [46, 53, 62], [43, 50, 58], [45, 52, 61]], scale: [69, 72, 74, 76], dens: 0.12, beat: 0.8, vol: 0.32 },
  explore: { chords: [[50, 53, 57], [51, 55, 58], [50, 53, 57], [49, 52, 55]], scale: [62, 63, 65, 67, 69, 70, 74, 75], dens: 0.22, beat: 0.7, vol: 0.42 },
  lab:     { chords: [[50, 54, 58], [52, 56, 60], [48, 52, 56], [51, 55, 59]], scale: [62, 64, 66, 68, 70, 72, 74, 76], dens: 0.2, beat: 0.62, vol: 0.4 },
  cold:    { chords: [[50, 57, 62], [48, 55, 62], [46, 53, 60], [45, 52, 57]], scale: [69, 72, 74, 76, 77, 81], dens: 0.16, beat: 0.9, vol: 0.4 },
  debrief: { chords: [[50, 53, 57], [53, 57, 60], [46, 50, 53], [45, 50, 54]], scale: [65, 69, 72, 74, 77], dens: 0.25, beat: 0.6, vol: 0.45 },
  fail:    { chords: [[38, 45, 50], [39, 46, 51]], scale: [62, 63], dens: 0.06, beat: 1.1, vol: 0.38 },
};
Object.assign(SFX, {
  musicEnabled: (() => { try { return localStorage.getItem('protocolo-ceniza-music') !== 'off'; } catch (e) { return true; } })(),
  mood: null, mBus: null, mTimer: null, mNext: 0, mBeat: 0, ducked: false,
  midi(m) { return 440 * Math.pow(2, (m - 69) / 12); },
  mysteryInit() {
    if (this.mBus || !this.ctx) return; const c = this.ctx;
    this.mBus = c.createGain(); this.mBus.gain.value = 0; this.mBus.connect(this.master);
    const wet = c.createGain(); wet.gain.value = 0.9; this.mBus.connect(wet); wet.connect(this.rev);
    // eco para la melodía
    this.mDelay = c.createDelay(2); this.mDelay.delayTime.value = 0.48; const fb = c.createGain(); fb.gain.value = 0.42; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    this.mDelay.connect(lp); lp.connect(fb); fb.connect(this.mDelay); lp.connect(this.mBus);
  },
  mystery(mood) {
    this.pendingMood = mood;
    if (!this.ctx) return;
    this.mysteryInit();
    const c = this.ctx, M = MOODS[mood];
    if (mood !== this.mood) { this.mood = mood; this.mBeat = 0; this.mNext = Math.max(this.mNext, c.currentTime + 0.1); }
    this.mBus.gain.cancelScheduledValues(c.currentTime); this.mBus.gain.setValueAtTime(this.mBus.gain.value, c.currentTime);
    this.mBus.gain.linearRampToValueAtTime(this.musicEnabled && !this.ducked && M ? M.vol : 0, c.currentTime + 2.5);
    if (!this.mTimer) this.mTimer = setInterval(() => this.mysteryTick(), 150);
  },
  duck(on) { this.ducked = on; if (this.mood) this.mystery(this.mood); },
  toggleMusic() { this.musicEnabled = !this.musicEnabled; try { localStorage.setItem('protocolo-ceniza-music', this.musicEnabled ? 'on' : 'off'); } catch (e) { } if (this.mood) this.mystery(this.mood); if (this.musicBus) this.musicBus.gain.value = this.musicEnabled ? this.musicBus.gain.value : 0; return this.musicEnabled; },
  mysteryTick() {
    const c = this.ctx, M = MOODS[this.mood]; if (!c || !M) return;
    while (this.mNext < c.currentTime + 0.5) {
      const t = this.mNext, b = this.mBeat++, per = 16, ci = Math.floor(b / per) % M.chords.length, chord = M.chords[ci];
      if (b % per === 0) { this.pad(chord, t, M.beat * per + 2.5); this.bass(chord[0] - 12, t, M.beat * per); }
      if (M.motif) { const n = M.motif[b % M.motif.length]; if (n) this.musicBox(n, t); }
      else if (Math.random() < M.dens && b % 2 === 0) { const n = M.scale[Math.random() * M.scale.length | 0]; this.celesta(n, t, 0.11 + Math.random() * 0.06); }
      if (Math.random() < 0.025 && !M.motif) this.glass(M.scale[M.scale.length - 1] + 12 + (Math.random() < 0.5 ? 1 : 0), t);
      if (b % (per * 2) === per && Math.random() < 0.5) this.swell(chord[2] + 12, t, M.beat * 6);
      this.mNext += M.beat;
    }
  },
  pad(chord, t, dur) {
    const c = this.ctx, out = c.createGain(); out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(0.05, t + 3); out.gain.setValueAtTime(0.05, t + dur - 3); out.gain.linearRampToValueAtTime(0, t + dur);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 650; lp.Q.value = 2;
    const lfo = c.createOscillator(); lfo.frequency.value = 0.07 + Math.random() * 0.05; const lg = c.createGain(); lg.gain.value = 280; lfo.connect(lg); lg.connect(lp.frequency);
    lp.connect(out); out.connect(this.mBus); lfo.start(t); lfo.stop(t + dur);
    chord.forEach(m => [-7, 7].forEach(dt => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = this.midi(m); o.detune.value = dt; const g = c.createGain(); g.gain.value = 0.35; o.connect(g); g.connect(lp); o.start(t); o.stop(t + dur); }));
  },
  bass(m, t, dur) { const c = this.ctx, o = c.createOscillator(); o.type = 'sine'; o.frequency.value = this.midi(m); const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.16, t + 1.5); g.gain.linearRampToValueAtTime(0, t + dur); o.connect(g); g.connect(this.mBus); o.start(t); o.stop(t + dur + 0.1); },
  celesta(m, t, v) {
    const c = this.ctx, f = this.midi(m), g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0005, t + 2.6);
    [[1, 1], [2, 0.25], [4.01, 0.08]].forEach(([k, a]) => { const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f * k; const og = c.createGain(); og.gain.value = a; o.connect(og); og.connect(g); o.start(t); o.stop(t + 2.7); });
    g.connect(this.mBus); g.connect(this.mDelay);
  },
  musicBox(m, t) {
    const c = this.ctx, f = this.midi(m), g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.09, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0005, t + 1.8);
    [[1, 1, 'triangle'], [3, 0.18, 'sine'], [5.4, 0.05, 'sine']].forEach(([k, a, ty]) => { const o = c.createOscillator(); o.type = ty; o.frequency.value = f * k; o.detune.value = (Math.random() - 0.5) * 12; const og = c.createGain(); og.gain.value = a; o.connect(og); og.connect(g); o.start(t); o.stop(t + 1.9); });
    g.connect(this.mBus); g.connect(this.mDelay);
  },
  glass(m, t) { const c = this.ctx, o = c.createOscillator(); o.type = 'sine'; o.frequency.value = this.midi(m); const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = this.midi(m) * 1.007; const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.025, t + 1.2); g.gain.linearRampToValueAtTime(0, t + 4); o.connect(g); o2.connect(g); g.connect(this.mBus); g.connect(this.mDelay); o.start(t); o2.start(t); o.stop(t + 4.1); o2.stop(t + 4.1); },
  swell(m, t, dur) { const c = this.ctx, o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = this.midi(m); const v = c.createOscillator(); v.frequency.value = 5; const vg = c.createGain(); vg.gain.value = 3; v.connect(vg); vg.connect(o.detune); const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200; const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.03, t + dur * 0.6); g.gain.linearRampToValueAtTime(0, t + dur); o.connect(lp); lp.connect(g); g.connect(this.mBus); o.start(t); v.start(t); o.stop(t + dur); v.stop(t + dur); },
});

/* =========================================================================
   ESTANCIAS — misiones de personajes (puzle / escape room)
   Cada 3 misiones, la familia Vega baja de la nave y tiene que escapar de
   una estancia. Cada personaje tiene una habilidad:
     Darío · fuerza        Lía · ingeniería
     Nora  · informática   Teo · es pequeño y ORDO no puede detectarlo
   En cada estancia hay un OBJETO de la historia que desbloquea el ANÁLISIS
   de los jefes y mini jefes de las tres misiones siguientes (+35 % de daño).
   ========================================================================= */
'use strict';

const Rooms = (() => {
  const TAU = Math.PI * 2;
  const W = 720, H = 1000;

  /* ------------------------- Ayudas de dibujo ------------------------- */
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function glow(g, c, b) { g.shadowColor = c; g.shadowBlur = b * (g.R || 1); }
  function noGlow(g) { g.shadowBlur = 0; }
  function base(g, pal, t) {
    const wall = g.createLinearGradient(0, 0, 0, 700);
    wall.addColorStop(0, pal.wall[0]); wall.addColorStop(1, pal.wall[1]);
    g.fillStyle = wall; g.fillRect(0, 0, W, 700);
    // Paneles de pared
    g.strokeStyle = pal.line; g.lineWidth = 2;
    for (let x = 0; x <= W; x += 120) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 700); g.stroke(); }
    g.beginPath(); g.moveTo(0, 120); g.lineTo(W, 120); g.stroke();
    // Suelo en perspectiva
    const fl = g.createLinearGradient(0, 700, 0, H);
    fl.addColorStop(0, pal.floor[0]); fl.addColorStop(1, pal.floor[1]);
    g.fillStyle = fl; g.fillRect(0, 700, W, 300);
    g.strokeStyle = pal.line; g.lineWidth = 1.5;
    for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(W / 2 + i * 60, 700); g.lineTo(W / 2 + i * 190, H); g.stroke(); }
    for (const y of [740, 800, 880, 980]) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    // Luz ambiental parpadeante
    const a = 0.12 + 0.05 * Math.sin(t * 2.3) + (Math.sin(t * 17) > 0.97 ? 0.1 : 0);
    const lg = g.createRadialGradient(W / 2, 0, 0, W / 2, 0, 700);
    lg.addColorStop(0, pal.light.replace('A', a)); lg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = lg; g.fillRect(0, 0, W, H);
  }
  function screen(g, x, y, w, h, color, on, lines = 4, t = 0) {
    g.fillStyle = '#0a0f18'; rr(g, x, y, w, h, 8); g.fill();
    g.strokeStyle = '#3a4a60'; g.lineWidth = 3; g.stroke();
    if (on) {
      glow(g, color, 14); g.fillStyle = color + '33'; rr(g, x + 8, y + 8, w - 16, h - 16, 4); g.fill(); noGlow(g);
      g.fillStyle = color;
      for (let i = 0; i < lines; i++) g.fillRect(x + 18, y + 20 + i * (h - 40) / lines, (w - 36) * (0.4 + 0.5 * Math.abs(Math.sin(i * 1.7 + t))), 4);
    }
  }
  function label(g, txt, x, y, color = '#cfe') {
    g.font = '700 15px system-ui, sans-serif'; g.textAlign = 'center'; g.fillStyle = color; g.fillText(window.T ? window.T(txt) : txt, x, y);
  }

  /* --------------------------- Las estancias --------------------------- */
  const ROOMS = [
    /* =============================== 1 =============================== */
    {
      id: 1, after: 3, title: 'LA ESCLUSA 9', place: 'Sala de control de la cúpula de Nexo‑9', time: 360,
      pal: { wall: ['#17202e', '#0c1220'], floor: ['#121826', '#05080e'], line: 'rgba(120,160,220,0.14)', light: 'rgba(120,180,255,A)' },
      intro: [
        { who: 'lia', text: 'Hay que abrirla a mano desde la sala de control. Todos fuera de la nave.' },
        { who: 'dario', text: 'Los Guardianes llegarán en seis minutos. Cada uno sabe hacer algo: usadlo.' },
        { who: 'sys', text: 'Elige personaje abajo y toca la estancia para investigar. Si te atascas, pulsa PISTA.' },
      ],
      outro: [
        { who: 'dario', text: '¡Compuerta abierta! Todos a bordo.' },
        { who: 'nora', text: 'Ese plano de Vex nos va a salvar la vida. Ya sé dónde golpear a su fragata.' },
        { who: 'teo', text: '¡Estrellas! Nunca las había visto sin el cristal de la cúpula.' },
        { who: 'nora', text: 'Rumbo al Anillo de Ceniza: el único corredor sin balizas de ORDO.' },
      ],
      object: {
        name: 'PLANO DE MANTENIMIENTO DE LA FRAGATA LANZA',
        desc: 'Firmado por la comandante Vex. La Lanza se revisó en esta cúpula hace un mes. En los márgenes, Vex anotó cómo funcionan las máquinas que patrullan la ruta hacia el Anillo… y una nota: «Darío siempre ataca por el flanco».',
        bosses: [
          { name: 'EXCAVADORA MINERA', mission: 4, weak: 'Los dos taladros protegen el motor. Cada taladro destruido le arranca blindaje: rómpelos primero.' },
          { name: 'FRAGATA LANZA', mission: 5, weak: 'Sus cuatro cañones alimentan el casco: cada cañón destruido le quita un 6 % de vida. Después, el puente.' },
          { name: 'LEVIATÁN VÍTREO', mission: 6, weak: '«Si cruzáis la Nebulosa: el cuerpo de cristal desvía los disparos. Solo la cabeza es vulnerable.»' },
        ],
      },
      hotspots: [
        { id: 'window', name: 'Ventanal', x: 230, y: 30, w: 260, h: 120,
          draw(g, S, t) {
            g.fillStyle = '#04060c'; rr(g, 230, 30, 260, 120, 10); g.fill(); g.strokeStyle = '#4a6a90'; g.lineWidth = 4; g.stroke();
            for (let i = 0; i < 4; i++) { g.fillStyle = `rgba(255,42,90,${0.4 + 0.4 * Math.sin(t * 4 + i)})`; g.beginPath(); g.arc(280 + i * 50, 70 + (i % 2) * 30, 4, 0, TAU); g.fill(); }
            g.fillStyle = '#9fb6cc'; g.beginPath(); g.moveTo(420, 125); g.lineTo(445, 95); g.lineTo(470, 125); g.fill();
          },
          async act(C) { await C.say('nora', 'Desde aquí se ve el Esperanza en la esclusa… y luces rojas acercándose. Guardianes.'); } },
        { id: 'board', name: 'Tablón de turnos', x: 270, y: 175, w: 180, h: 140,
          draw(g) {
            g.fillStyle = '#3a2e22'; rr(g, 270, 175, 180, 140, 6); g.fill();
            g.fillStyle = '#e8e0cc'; g.fillRect(285, 190, 70, 50); g.fillRect(365, 195, 70, 40); g.fillRect(290, 250, 140, 50);
            g.fillStyle = '#ff5c8a'; g.fillRect(285, 190, 70, 8);
            g.fillStyle = '#556'; g.fillRect(372, 202, 22, 26); g.fillRect(400, 202, 22, 26);
          },
          async act(C) {
            C.S.sawBoard = true;
            await C.say('sys', 'TABLÓN · «ESCUADRÓN LANZA. Taquilla común: la clave es el año de fundación del escuadrón.» Hay una foto de dos pilotos sonriendo.');
            if (C.who === 'dario') { C.S.knowsYear = true; await C.say('dario', 'Esta foto… Vex y yo, el día que fundamos el escuadrón. Fue en 2931, el año de la gran tormenta solar.'); }
            else await C.say(C.who, C.who === 'teo' ? '¡Ese de la foto es papá! Y la señora… es Vex.' : 'Ese de la foto es Darío, de joven. Él sabrá en qué año fue.');
          } },
        { id: 'panel', name: 'Panel eléctrico', x: 520, y: 270, w: 150, h: 200,
          draw(g, S, t) {
            g.fillStyle = '#1e2836'; rr(g, 520, 270, 150, 200, 8); g.fill(); g.strokeStyle = '#4a5a70'; g.lineWidth = 3; g.stroke();
            for (let i = 0; i < 3; i++) { g.fillStyle = S.power ? (i === 1 ? '#9dff6a' : '#4fd8ff') : '#2a3240'; if (S.power) glow(g, '#4fd8ff', 10); g.fillRect(545 + i * 38, 300, 24, 60); noGlow(g); }
            g.fillStyle = S.power ? '#ffe066' : '#ff2a5a'; g.beginPath(); g.arc(595, 420, 10 + (S.power ? 0 : 2 * Math.sin(t * 6)), 0, TAU); g.fill();
            label(g, S.power ? 'ENERGÍA' : 'SIN FUSIBLE', 595, 455, S.power ? '#9dff6a' : '#ff8aa0');
          },
          async act(C) {
            if (C.S.power) return C.say('lia', 'Corriente estable. La sala entera vuelve a funcionar.');
            if (!C.has('fusible')) return C.say('lia', 'Le falta un fusible de alta tensión. Sin él, nada en esta sala funciona.');
            if (C.who !== 'lia') return C.say(C.who, 'Tengo el fusible, pero no sé conectarlo sin freírme. Esto es cosa de mamá.');
            C.take('fusible'); C.S.power = true; C.sfx('power');
            await C.say('lia', 'Fusible dentro, puentes cerrados… ¡energía! Los teclados ya funcionan.');
          } },
        { id: 'locker', name: 'Taquilla del escuadrón Lanza', x: 50, y: 300, w: 160, h: 360,
          draw(g, S) {
            g.fillStyle = '#2a303c'; rr(g, 50, 300, 160, 360, 6); g.fill(); g.strokeStyle = '#ff5c8a'; g.lineWidth = 2; g.stroke();
            if (S.lockerOpen) { g.fillStyle = '#0a0c12'; g.fillRect(62, 312, 136, 336); g.fillStyle = '#3a3f52'; g.fillRect(62, 312, 30, 336); }
            else { g.fillStyle = '#3a4252'; for (let i = 0; i < 6; i++) g.fillRect(70, 330 + i * 12, 120, 5); g.fillStyle = S.power ? '#4fd8ff' : '#1a1f28'; rr(g, 150, 470, 40, 54, 4); g.fill(); }
            g.strokeStyle = '#ff9db6'; g.lineWidth = 3; g.beginPath(); g.moveTo(115, 560); g.lineTo(130, 590); g.lineTo(145, 560); g.stroke();
          },
          async act(C) {
            if (C.S.lockerOpen) return C.say(C.who, 'Ya está vacía.');
            if (!C.S.power) return C.say(C.who, 'Tiene un teclado numérico, pero está apagado. No hay corriente.');
            const ok = await C.code({ type: 'digits', len: 4, answer: '2931', title: 'TAQUILLA · ESCUADRÓN LANZA', hint: 'Año de fundación del escuadrón' });
            if (!ok) return;
            C.S.lockerOpen = true; C.give('palanca');
            await C.say('dario', 'El uniforme de Vex… y una palanca de emergencia. Debajo hay unos planos.');
            await C.found();
          } },
        { id: 'door', name: 'Compuerta exterior', x: 250, y: 470, w: 230, h: 330,
          draw(g, S, t) {
            g.fillStyle = '#1a222e'; g.fillRect(250, 470, 230, 330);
            g.fillStyle = '#ffb347'; for (let i = 0; i < 8; i++) { g.save(); g.beginPath(); g.rect(250, 470, 230, 20); g.clip(); g.fillRect(240 + i * 34, 470, 16, 20); g.restore(); }
            g.fillStyle = '#2c3646'; g.fillRect(268, 500, 94, 290); g.fillRect(368, 500, 94, 290);
            g.strokeStyle = '#0a0e14'; g.lineWidth = 4; g.beginPath(); g.moveTo(365, 500); g.lineTo(365, 790); g.stroke();
            g.fillStyle = S.card ? '#9dff6a' : (S.power ? '#ff2a5a' : '#222'); rr(g, 440, 610, 26, 40, 4); g.fill();
          },
          async act(C) {
            if (!C.S.power) return C.say(C.who, 'La compuerta está muerta. Primero hay que devolver la corriente a la sala.');
            if (!C.S.card) {
              if (!C.has('tarjeta')) return C.say('nora', 'El lector pide una tarjeta de mantenimiento. Algún técnico tendrá una… o la habrá perdido.');
              C.take('tarjeta'); C.S.card = true; C.sfx('blip');
              return C.say('nora', 'Tarjeta aceptada. Pero el motor de la compuerta está atascado: hay que forzarla.');
            }
            if (!C.has('palanca')) return C.say('dario', 'Está atascada. Con una palanca podría abrirla.');
            if (C.who !== 'dario') return C.say(C.who, 'Tengo la palanca, pero no tengo fuerza para mover esta mole. Papá sí.');
            C.take('palanca'); await C.say('dario', 'Apartaos… ¡aaaah! ¡Cede!');
            return C.escape();
          } },
        { id: 'tools', name: 'Caja de herramientas', x: 60, y: 760, w: 170, h: 100,
          draw(g, S) {
            g.fillStyle = '#b8401a'; rr(g, 60, 780, 170, 80, 6); g.fill(); g.fillStyle = '#8a2a0a'; g.fillRect(60, 800, 170, 8);
            g.strokeStyle = '#ddd'; g.lineWidth = 5; g.beginPath(); g.moveTo(110, 780); g.lineTo(110, 762); g.lineTo(180, 762); g.lineTo(180, 780); g.stroke();
            if (S.toolsOpen) { g.fillStyle = '#222'; g.fillRect(70, 776, 150, 10); }
          },
          async act(C) {
            if (C.S.toolsOpen) return C.say(C.who, 'Solo quedan tornillos sueltos.');
            C.S.toolsOpen = true; C.give('fusible'); await C.say(C.who, 'Llaves, cinta… ¡y un fusible de alta tensión! Lo guardo.');
          } },
        { id: 'vent', name: 'Rejilla de ventilación', x: 540, y: 820, w: 140, h: 80,
          draw(g, S) {
            g.fillStyle = '#0c1018'; rr(g, 540, 820, 140, 80, 6); g.fill(); g.strokeStyle = '#4a5a70'; g.lineWidth = 3; g.stroke();
            if (!S.ventOpen) { g.strokeStyle = '#6a7a90'; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(552, 832 + i * 11); g.lineTo(668, 832 + i * 11); g.stroke(); } }
          },
          async act(C) {
            if (C.S.ventOpen) return C.say(C.who, 'Un conducto estrecho. Ya no hay nada dentro.');
            if (C.who !== 'teo') return C.say(C.who, 'Hay algo brillando al fondo del conducto, pero es demasiado estrecho para mí.');
            C.S.ventOpen = true; C.give('tarjeta');
            await C.say('teo', '¡Quepo! Aquí dentro hay una tarjeta con una franja verde. Pone «MANTENIMIENTO».');
          } },
      ],
      hints: [
        S => !S.toolsOpen && { who: 'lia', text: 'Empecemos por lo básico: busca herramientas.' },
        S => !S.power && { who: 'dario', text: 'Ese fusible tiene que ir en el panel eléctrico. Y conectarlo es trabajo de Lía.' },
        S => !S.knowsYear && !S.lockerOpen && { who: 'nora', text: 'La taquilla pide un año. En el tablón hay una foto: que la mire papá, él estuvo allí.' },
        S => !S.lockerOpen && { who: 'dario', text: 'El escuadrón se fundó en 2931. Prueba en la taquilla.' },
        S => !S.ventOpen && { who: 'nora', text: 'La compuerta pide una tarjeta. ¿Y si alguien pequeño mira en la rejilla?' },
        S => !S.card && { who: 'nora', text: 'Ya tenemos la tarjeta: pásala por el lector de la compuerta.' },
        () => ({ who: 'lia', text: 'Darío, coge la palanca y fuerza la compuerta.' }),
      ],
    },

    /* =============================== 2 =============================== */
    {
      id: 2, after: 6, title: 'LA SONDA ARENAL‑7', place: 'Interior de una sonda muerta del Instituto', time: 360,
      pal: { wall: ['#0a2228', '#041014'], floor: ['#06181c', '#020809'], line: 'rgba(80,220,220,0.14)', light: 'rgba(80,255,230,A)' },
      intro: [
        { who: 'nora', text: 'La sonda está muerta, pero su memoria no. La descarga desde fuera se corta: hay que entrar.' },
        { who: 'lia', text: 'Arenal‑7… le pusieron mi apellido. Es una sonda del Instituto. Conozco este modelo.' },
        { who: 'dario', text: 'El oxígeno de la sonda durará seis minutos. Dentro, y rápido.' },
      ],
      outro: [
        { who: 'lia', text: 'El Proyecto Leviatán… usaron mi Protocolo para dar mente a esas bestias de cristal.' },
        { who: 'nora', text: 'Mamá, aquí está todo: cómo son, cómo piensan… y dónde son débiles.' },
        { who: 'lia', text: 'Entonces mi código, por una vez, servirá para algo bueno. Volvamos a la nave.' },
      ],
      object: {
        name: 'EXPEDIENTE DEL INSTITUTO: PROYECTO LEVIATÁN',
        desc: 'Informes firmados en 2914 por el equipo del Protocolo Cuna. Describen los guardianes que el Instituto creó para ORDO con el código de Lía: leviatanes de cristal, vigías y fundidores.',
        bosses: [
          { name: 'LEVIATÁN ANCESTRAL', mission: 7, weak: 'El sujeto L‑0 no es una serpiente: es una manta de cristal colosal. Sus alas desvían los disparos y queman al tocarlas; solo su corazón, en el centro, recibe daño.' },
          { name: 'VIGÍA DEL INSTITUTO', mission: 8, weak: 'Un satélite de vigilancia. Sus paneles solares absorben los disparos. Cuando una cámara fija su línea en rojo, dispara una ráfaga por ella: apártate. Destruye las tres cámaras y el disco central pierde su blindaje.' },
          { name: 'FUNDIDOR', mission: 9, weak: 'Vierte metal por tres caños por turnos: hay un hueco entre chorros. Muévete con él y dispara al crisol.' },
        ],
      },
      hotspots: [
        { id: 'photo', name: 'Foto del equipo', x: 50, y: 170, w: 150, h: 120,
          draw(g) {
            g.fillStyle = '#c8b890'; rr(g, 50, 170, 150, 120, 4); g.fill(); g.fillStyle = '#2a3a40'; g.fillRect(60, 180, 130, 80);
            g.fillStyle = '#e8d8b8'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(78 + i * 24, 212, 8, 0, TAU); g.fill(); g.fillRect(70 + i * 24, 222, 16, 30); }
            g.fillStyle = '#ffb347'; g.beginPath(); g.arc(126, 212, 8, 0, TAU); g.fill();
            g.fillStyle = '#4a3a20'; g.font = '700 11px system-ui'; g.textAlign = 'center'; g.fillText(window.T('CUNA · 2914'), 125, 280);
          },
          async act(C) {
            C.S.sawPhoto = true;
            await C.say('sys', 'FOTO · «Equipo del Protocolo Cuna, Instituto, 2914.» Cinco científicos. Una joven con el pelo naranja sonríe en el centro.');
            if (C.who === 'lia') { C.S.knowsKey = true; await C.say('lia', 'Esa soy yo, con veintidós años. En el Instituto mi clave de autora era mi apellido de soltera: ARENAL.'); }
            else await C.say(C.who, C.who === 'teo' ? '¡Mamá! ¡Esa eres tú, con el pelo naranja!' : 'Mamá, ¿esta eres tú? Míralo tú: quizá recuerdes algo.');
          } },
        { id: 'console', name: 'Consola principal', x: 220, y: 200, w: 280, h: 210,
          draw(g, S, t) {
            g.fillStyle = '#10262c'; rr(g, 210, 380, 300, 60, 8); g.fill();
            screen(g, 220, 200, 280, 180, '#4fffe6', S.booted, 5, t);
            if (S.booted && !S.done) label(g, S.crystalIn ? 'CLAVE DE AUTORA' : 'INSERTE CRISTAL', 360, 300, '#cffff8');
            if (S.done) label(g, 'ARCHIVO ABIERTO', 360, 300, '#9dff6a');
            g.fillStyle = S.crystalIn ? '#9ffcff' : '#1a2a30'; rr(g, 340, 395, 40, 30, 4); g.fill();
          },
          async act(C) {
            if (C.S.done) return C.say('nora', 'Archivo descargado. Las puertas ya responden.');
            if (!C.S.booted) {
              if (C.who !== 'nora') return C.say(C.who, 'Pantalla negra. Esto necesita a alguien que sepa despertar ordenadores muertos.');
              C.S.booted = true; C.sfx('power');
              return C.say('nora', 'Conecto mi ordenador… ¡arranca! Pide un cristal de memoria y la clave de la autora.');
            }
            if (!C.S.crystalIn) {
              if (!C.has('cristal')) return C.say('nora', 'Falta el cristal de memoria. En la estantería hay un hueco vacío.');
              C.take('cristal'); C.S.crystalIn = true; C.sfx('blip');
              await C.say('nora', 'Cristal dentro. Ahora pide la «clave de autora». Seis letras.');
            }
            const ok = await C.code({ type: 'letters', len: 6, answer: 'ARENAL', title: 'ARCHIVO DEL INSTITUTO', hint: 'Clave de autora (6 letras)' });
            if (!ok) return;
            C.S.done = true;
            await C.say('nora', 'Acceso concedido. Descargando… «Proyecto Leviatán». Y las puertas se desbloquean.');
            await C.found();
          } },
        { id: 'shelf', name: 'Estantería de cristales', x: 530, y: 160, w: 160, h: 330,
          draw(g, S) {
            g.fillStyle = '#0c1c20'; g.fillRect(530, 160, 160, 330); g.strokeStyle = '#2a5a60'; g.lineWidth = 3; g.strokeRect(530, 160, 160, 330);
            for (let r = 0; r < 4; r++) { g.fillStyle = '#1a3a40'; g.fillRect(530, 230 + r * 80, 160, 6);
              for (let i = 0; i < 4; i++) { if (r === 1 && i === 2) continue; g.fillStyle = 'rgba(120,255,240,0.25)'; g.beginPath(); g.moveTo(552 + i * 36, 228 + r * 80); g.lineTo(560 + i * 36, 196 + r * 80); g.lineTo(568 + i * 36, 228 + r * 80); g.fill(); } }
            g.strokeStyle = '#ff5c8a'; g.lineWidth = 2; g.strokeRect(620, 280, 22, 28);
          },
          async act(C) { C.S.sawShelf = true; await C.say(C.who, 'Cristales de memoria, todos rotos. Falta uno en el hueco 7, marcado en rojo. Se habrá caído al apagarse la sonda.'); } },
        { id: 'cryo', name: 'Cápsula criogénica', x: 470, y: 560, w: 210, h: 300,
          draw(g, S, t) {
            g.fillStyle = '#0c2228'; rr(g, 470, 560, 210, 300, 60); g.fill(); g.strokeStyle = '#5ff'; g.lineWidth = 3; g.stroke();
            g.fillStyle = `rgba(190,255,255,${0.15 + 0.05 * Math.sin(t * 2)})`; rr(g, 495, 590, 160, 240, 50); g.fill();
            label(g, 'SUJETO L‑0', 575, 850, '#9ffcff');
          },
          async act(C) {
            await C.say('teo', 'Está vacía y congelada. Pone «Sujeto L‑0: Leviatán». Algo grande dormía aquí.');
            if (C.who === 'lia') await C.say('lia', 'L‑0… el primer Leviatán. Si sigue vivo, será viejísimo y enorme.');
          } },
        { id: 'duct', name: 'Conducto del suelo', x: 40, y: 820, w: 160, h: 80,
          draw(g, S) {
            g.fillStyle = '#020809'; rr(g, 40, 820, 160, 80, 8); g.fill(); g.strokeStyle = '#2a5a60'; g.lineWidth = 3; g.stroke();
            if (!S.ductDone) { g.fillStyle = 'rgba(150,255,250,0.8)'; g.beginPath(); g.arc(150, 870, 4, 0, TAU); g.fill(); }
          },
          async act(C) {
            if (C.S.ductDone) return C.say(C.who, 'Solo hay polvo de cristal.');
            if (C.who !== 'teo') return C.say(C.who, 'Algo brilla dentro del conducto, pero no me cabe ni el brazo.');
            C.S.ductDone = true; C.give('cristal');
            await C.say('teo', '¡Lo tengo! Un cristal entero, con un 7 grabado. Estaba atascado aquí dentro.');
          } },
        { id: 'hatch', name: 'Compuerta de la sonda', x: 220, y: 560, w: 220, h: 330,
          draw(g, S) {
            g.fillStyle = '#0a1a1e'; rr(g, 220, 560, 220, 330, 100); g.fill(); g.strokeStyle = S.done ? '#9dff6a' : '#ff5c8a'; g.lineWidth = 5; g.stroke();
            g.strokeStyle = '#2a4a50'; g.lineWidth = 3; g.beginPath(); g.arc(330, 720, 60, 0, TAU); g.stroke();
            for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.beginPath(); g.moveTo(330 + Math.cos(a) * 20, 720 + Math.sin(a) * 20); g.lineTo(330 + Math.cos(a) * 58, 720 + Math.sin(a) * 58); g.stroke(); }
          },
          async act(C) {
            if (!C.S.done) return C.say(C.who, 'Sellada. Las puertas las controla la consola principal.');
            if (!C.S.found) return C.say('nora', '¡Espera! Primero tenemos que llevarnos el archivo.');
            await C.say('dario', 'Todos fuera. Volvemos al Esperanza.');
            return C.escape();
          } },
      ],
      hints: [
        S => !S.booted && { who: 'lia', text: 'La consola está muerta. Nora sabe despertar cualquier ordenador.' },
        S => !S.ductDone && { who: 'nora', text: 'Falta un cristal de memoria. Mira la estantería… y luego algún sitio donde solo quepa Teo.' },
        S => !S.crystalIn && { who: 'nora', text: 'Ya tenemos el cristal: llévalo a la consola.' },
        S => !S.knowsKey && { who: 'dario', text: 'La clave de la autora… hay una foto del equipo en la pared. Que la mire Lía.' },
        S => !S.done && { who: 'lia', text: 'Mi clave era mi apellido de soltera: ARENAL.' },
        () => ({ who: 'dario', text: 'La compuerta ya está abierta. ¡Salgamos!' }),
      ],
    },

    /* =============================== 3 =============================== */
    {
      id: 3, after: 9, title: 'LA CABINA DEL CAPATAZ', place: 'Estación abandonada en la Forja', time: 360,
      pal: { wall: ['#2a140c', '#140804'], floor: ['#1a0c06', '#080302'], line: 'rgba(255,140,60,0.14)', light: 'rgba(255,120,40,A)' },
      intro: [
        { who: 'sys', text: 'Temperatura del casco: 1.900 grados. Atraque de emergencia en una estación de capataces abandonada.' },
        { who: 'lia', text: 'El casco se enfría mientras esperamos dentro. Pero el ciclo de la Forja inundará esta zona de metal fundido.' },
        { who: 'nora', text: 'Seis minutos para que llegue la colada. La puerta de salida está bloqueada por el sistema de purga.' },
      ],
      outro: [
        { who: 'nora', text: '¡Purga completada! La puerta se abre.' },
        { who: 'lia', text: 'El cuaderno del capataz lo explica: la Forja Madre está protegida por seis emisores. Sin ellos, su núcleo queda desnudo.' },
        { who: 'dario', text: 'Bruno Kael… el último humano de la Forja. Gracias, compañero.' },
        { who: 'nora', text: 'Casco a temperatura segura. Directos al corazón de la Forja.' },
      ],
      object: {
        name: 'CUADERNO DEL ÚLTIMO CAPATAZ',
        desc: 'Notas de Bruno Kael, el último humano que trabajó en la Forja antes de que ORDO lo sustituyera por máquinas. Dibujó cada defensa de la esfera… y a los heraldos que ORDO mandaba a vigilarla.',
        bosses: [
          { name: 'FORJA MADRE', mission: 10, weak: 'Mientras quede un emisor en su anillo, el núcleo recibe solo un 12 % del daño. Rompe los seis emisores primero.' },
          { name: 'HERALDO DE ORDO', mission: 11, weak: 'Dos satélites giran a su alrededor y absorben los disparos. Dispara al ojo cuando los satélites estén a los lados.' },
          { name: 'CRUCERO DE ORDO', mission: 12, weak: 'Un crucero en forma de tridente. Cada punta carga un rayo (verás una línea roja) antes de disparar. Mientras quede una punta, el puente está blindado: destrúyelas primero.' },
        ],
      },
      hotspots: [
        { id: 'valve', name: 'Válvula de refrigeración', x: 290, y: 150, w: 140, h: 140,
          draw(g, S, t) {
            g.fillStyle = '#3a2a24'; g.fillRect(240, 210, 240, 22);
            g.save(); g.translate(360, 220); g.rotate(S.cooled ? t * 0.5 : 0);
            g.strokeStyle = S.cooled ? '#4fd8ff' : '#c86a3a'; g.lineWidth = 10; g.beginPath(); g.arc(0, 0, 50, 0, TAU); g.stroke();
            for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.fillRect(-4, 0, 8, 50); }
            g.restore();
          },
          async act(C) {
            if (C.S.cooled) return C.say('lia', 'El refrigerante corre. El panel de purga ya no quema.');
            if (!C.has('manivela')) return C.say('lia', 'Es la válvula del refrigerante, pero le falta la manivela. Sin ella no gira.');
            if (C.who !== 'lia') return C.say(C.who, 'Si la giro mal, reviento la tubería. Mejor que lo haga mamá.');
            C.take('manivela'); C.S.cooled = true; C.sfx('power');
            await C.say('lia', 'Manivela puesta, presión ajustada… refrigerante fluyendo. El panel de purga se enfría.');
          } },
        { id: 'locker', name: 'Taquilla del capataz', x: 530, y: 300, w: 150, h: 330,
          draw(g, S) {
            g.fillStyle = '#4a3a30'; rr(g, 530, 300, 150, 330, 6); g.fill(); g.strokeStyle = '#7a5a40'; g.lineWidth = 3; g.stroke();
            if (S.lockerOpen) { g.fillStyle = '#100804'; g.fillRect(542, 312, 126, 306); }
            else { g.fillStyle = '#8a5a2a'; rr(g, 640, 450, 26, 34, 6); g.fill(); g.strokeStyle = '#6a4a2a'; g.lineWidth = 4; g.beginPath(); g.arc(653, 450, 9, Math.PI, 0); g.stroke(); }
            label(g, 'B. KAEL', 605, 340, '#e8c8a0');
          },
          async act(C) {
            if (C.S.lockerOpen) return C.say(C.who, 'Vacía, salvo un casco viejo con el nombre de Kael.');
            if (C.who !== 'dario') return C.say(C.who, 'Un candado oxidado. Hará falta fuerza bruta para arrancarlo.');
            C.S.lockerOpen = true; C.give('manivela');
            await C.say('dario', '¡Fuera candado! Dentro hay una manivela de válvula y un casco con el nombre «B. Kael».');
          } },
        { id: 'desk', name: 'Mesa del capataz', x: 50, y: 520, w: 210, h: 150,
          draw(g, S) {
            g.fillStyle = '#3a2418'; g.fillRect(50, 560, 210, 24); g.fillRect(60, 584, 14, 90); g.fillRect(236, 584, 14, 90);
            if (!S.found) { g.fillStyle = '#c8a878'; g.fillRect(110, 530, 80, 30); g.fillStyle = '#8a6a48'; g.fillRect(148, 530, 4, 30); }
            g.fillStyle = '#ff8a2a'; g.beginPath(); g.arc(220, 545, 10, 0, TAU); g.fill();
          },
          async act(C) {
            if (C.S.found) return C.say(C.who, 'Una taza fría y una foto de la Forja cuando aún era de personas.');
            await C.say(C.who, 'Un cuaderno de tapas quemadas. «Bruno Kael, capataz jefe.» Está lleno de dibujos de máquinas.');
            await C.found();
            await C.say('nora', 'En la última página: «Secuencia de purga de emergencia: ÁMBAR · ROJO · AZUL · ÁMBAR».');
            C.S.knowsSeq = true;
          } },
        { id: 'boiler', name: 'Hueco bajo la caldera', x: 40, y: 810, w: 180, h: 90,
          draw(g, S, t) {
            g.fillStyle = '#1a0a04'; rr(g, 40, 810, 180, 90, 6); g.fill();
            g.fillStyle = `rgba(255,120,40,${0.3 + 0.2 * Math.sin(t * 5)})`; g.fillRect(50, 880, 160, 12);
            if (!S.boilerDone) { g.fillStyle = '#e8c070'; g.fillRect(170, 850, 16, 6); }
          },
          async act(C) {
            if (C.S.boilerDone) return C.say(C.who, 'Solo hay calor y hollín.');
            if (C.who !== 'teo') return C.say(C.who, 'Hay una llave pequeña al fondo, pero el hueco es diminuto y quema.');
            C.S.boilerDone = true; C.give('llave');
            await C.say('teo', '¡Uf, qué calor! Pero ya la tengo: una llavecita con una etiqueta: «PANEL».');
          } },
        { id: 'panel', name: 'Panel de purga', x: 470, y: 680, w: 210, h: 210,
          draw(g, S, t) {
            g.fillStyle = '#2a1a14'; rr(g, 470, 680, 210, 210, 8); g.fill(); g.strokeStyle = S.cooled ? '#4fd8ff' : '#ff6a1a'; g.lineWidth = 3; g.stroke();
            if (S.coverOpen) { const cols = ['#ffb347', '#ff2a5a', '#4fd8ff', '#9dff6a']; cols.forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(510 + (i % 2) * 70 + 30, 730 + Math.floor(i / 2) * 70, 24, 0, TAU); g.fill(); }); }
            else { g.fillStyle = '#4a3024'; g.fillRect(490, 700, 170, 170); g.fillStyle = '#c8a060'; g.beginPath(); g.arc(640, 785, 7, 0, TAU); g.fill(); }
            if (!S.cooled) { g.fillStyle = `rgba(255,80,20,${0.2 + 0.1 * Math.sin(t * 6)})`; g.fillRect(470, 680, 210, 210); }
          },
          async act(C) {
            if (C.S.purged) return C.say('nora', 'Purga completada.');
            if (!C.S.cooled) return C.say(C.who, '¡Ay! Está ardiendo. Hay que enfriarlo antes con el refrigerante.');
            if (!C.S.coverOpen) {
              if (!C.has('llave')) return C.say(C.who, 'La tapa del panel está cerrada con llave.');
              C.take('llave'); C.S.coverOpen = true; C.sfx('blip');
              await C.say(C.who, 'Tapa abierta: cuatro botones de colores.');
            }
            if (C.who !== 'nora') return C.say(C.who, 'Esto es un sistema de purga automática. Si me equivoco, se bloquea. Que lo haga Nora.');
            const ok = await C.code({ type: 'colors', len: 4, answer: ['ambar', 'rojo', 'azul', 'ambar'], title: 'PURGA DE EMERGENCIA', hint: 'Secuencia de 4 colores' });
            if (!ok) return;
            C.S.purged = true; C.sfx('power');
            await C.say('nora', 'Secuencia correcta. Purgando… ¡la puerta se libera!');
          } },
        { id: 'door', name: 'Puerta de salida', x: 270, y: 470, w: 180, h: 400,
          draw(g, S) {
            g.fillStyle = '#1c120c'; g.fillRect(270, 470, 180, 400);
            g.fillStyle = S.purged ? '#0c0604' : '#3a2a20'; g.fillRect(285, 490, 150, 370);
            g.fillStyle = S.purged ? '#9dff6a' : '#ff2a5a'; g.fillRect(345, 480, 30, 6);
            if (!S.purged) { g.strokeStyle = '#ffb347'; g.lineWidth = 6; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(285, 520 + i * 70); g.lineTo(435, 560 + i * 70); g.stroke(); } }
          },
          async act(C) {
            if (!C.S.purged) return C.say(C.who, 'Bloqueada por el sistema de purga. El panel de la derecha la controla.');
            if (!C.S.found) return C.say('lia', 'Espera: en la mesa hay un cuaderno. Puede que nos sirva.');
            return C.escape();
          } },
      ],
      hints: [
        S => !S.found && { who: 'nora', text: 'Hay un cuaderno en la mesa del capataz. Puede explicar cómo funciona todo esto.' },
        S => !S.lockerOpen && { who: 'lia', text: 'La válvula necesita una manivela. ¿La taquilla del capataz? El candado necesita la fuerza de Darío.' },
        S => !S.cooled && { who: 'dario', text: 'Ya tenemos la manivela. Lía sabrá manejar la válvula de refrigeración.' },
        S => !S.boilerDone && { who: 'lia', text: 'La tapa del panel tiene cerradura. Bajo la caldera brilla algo… solo Teo cabe ahí.' },
        S => !S.purged && { who: 'lia', text: 'Nora, el panel de purga: ámbar, rojo, azul, ámbar. Lo pone el cuaderno.' },
        () => ({ who: 'dario', text: 'La puerta está libre. ¡Fuera de aquí antes de la colada!' }),
      ],
    },

    /* =============================== 4 =============================== */
    {
      id: 4, after: 12, title: 'EL PECIO DEL HERALDO', place: 'Restos del Heraldo de ORDO, remolcados por la flota libre', time: 360,
      pal: { wall: ['#220814', '#0c0208'], floor: ['#16040c', '#050003'], line: 'rgba(255,60,110,0.14)', light: 'rgba(200,80,255,A)' },
      intro: [
        { if: 'vexSaved', who: 'vex', text: 'Hemos remolcado los restos del Heraldo que derribasteis. Su núcleo aún late: dentro hay datos de ORDO.' },
        { ifNot: 'vexSaved', who: 'oren', text: 'Hemos remolcado los restos del Heraldo que derribasteis. Su núcleo aún late: dentro hay datos de ORDO.' },
        { who: 'dario', text: 'Entramos, cogemos lo que haya y salimos.' },
        { who: 'ordo', text: 'INTRUSOS REGISTRADOS. SALA SELLADA. REACTIVACIÓN DEL HERALDO EN SEIS MINUTOS.' },
        { who: 'nora', text: 'Si este pecio vuelve a la vida con nosotros dentro, estamos perdidos.' },
      ],
      outro: [
        { who: 'lia', text: 'La compuerta se ha abierto con mi Protocolo inverso. Funciona. Cuando llegue el momento, funcionará con la Grieta.' },
        { who: 'nora', text: 'Y el núcleo nos lo cuenta todo sobre ORDO PRIMORDIAL: sus fases, sus satélites… y su núcleo.' },
        { who: 'teo', text: 'ORDO no me vio cruzar la barrera. De verdad no salgo en sus mapas.' },
        { if: 'vexSaved', who: 'vex', text: 'Pues entonces tenéis una ventaja que nadie ha tenido nunca. Volved a la nave.' },
        { ifNot: 'vexSaved', who: 'oren', text: 'Pues entonces tenéis una ventaja que nadie ha tenido nunca. Volved a la nave.' },
      ],
      object: {
        name: 'NÚCLEO DE MEMORIA DE ORDO',
        desc: 'La mente de un Heraldo, con fragmentos de los planes de ORDO para cruzar la Grieta. ORDO concentrará toda su mente en un solo cuerpo: ORDO PRIMORDIAL.',
        bosses: [
          { name: 'HERALDO DEL UMBRAL', mission: 13, weak: 'Se desdobla en tres reflejos. Solo el auténtico tiene el ojo rojo encendido y recibe daño; cada pocos segundos se desvanecen y cambian de sitio.' },
          { name: 'TALADRO DE LA GRIETA', mission: 14, weak: 'Una barrena gigante con tres cuchillas que se abren y se cierran a su alrededor. Mientras quede una, el eje está blindado: rompe las cuchillas.' },
          { name: 'ORDO PRIMORDIAL', mission: 15, weak: 'Cuatro fases. Seis satélites bloquean tus disparos hasta que le queda un 25 %: entonces estallan y el núcleo queda al descubierto. Guarda los PULSOS para esa última fase.' },
        ],
      },
      hotspots: [
        { id: 'eye', name: 'Ojo de ORDO apagado', x: 40, y: 150, w: 160, h: 160,
          draw(g, S, t) {
            const a = 0.3 + 0.2 * Math.sin(t * 1.5);
            g.fillStyle = '#14020a'; g.beginPath(); g.arc(120, 230, 70, 0, TAU); g.fill();
            g.strokeStyle = `rgba(255,42,79,${a})`; g.lineWidth = 4; g.stroke();
            g.fillStyle = `rgba(255,42,79,${a})`; g.beginPath(); g.ellipse(120, 230, 10, 24, 0, 0, TAU); g.fill();
          },
          async act(C) {
            const lines = ['LA FAMILIA VEGA. CUATRO CUERPOS. TRES MENTES REGISTRADAS.', 'EL NIÑO ME ABRIRÁ LA PUERTA. LO QUIERA O NO.', 'FUERA DEL DOMINIO NO HAY ORDEN. OS ESTOY PROTEGIENDO.'];
            C.S.eyeN = ((C.S.eyeN || 0) + 1) % lines.length;
            await C.say('ordo', lines[C.S.eyeN]);
          } },
        { id: 'plate', name: 'Placa suelta', x: 540, y: 300, w: 150, h: 200,
          draw(g, S) {
            if (S.plateOff) {
              g.fillStyle = '#0a0206'; g.fillRect(540, 300, 150, 200);
              g.fillStyle = '#ff9db6'; g.font = '800 30px system-ui'; g.textAlign = 'center'; g.fillText('7·4·1', 615, 400);
              g.font = '600 13px system-ui'; g.fillText(window.T('CUNA'), 615, 430);
            } else {
              g.fillStyle = '#3a1a2a'; g.save(); g.translate(615, 400); g.rotate(0.06); g.fillRect(-75, -100, 150, 200); g.restore();
              g.fillStyle = '#8a5a6a'; for (const [x, y] of [[550, 310], [670, 316], [548, 486], [672, 492]]) { g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill(); }
            }
          },
          async act(C) {
            if (!C.S.plateOff) {
              if (C.who !== 'dario') return C.say(C.who, 'Una placa medio suelta. Detrás hay algo grabado, pero no puedo arrancarla.');
              C.S.plateOff = true;
              return C.say('dario', '¡Arriba! Detrás hay números grabados: 7·4·1. Y una palabra: CUNA.');
            }
            if (C.who === 'lia') { C.S.knowsVer = true; return C.say('lia', '7.4.1 es la versión de mi Protocolo Cuna. ORDO cifra sus datos con ella. Qué ironía.'); }
            return C.say(C.who, 'Dice 7·4·1 y CUNA. ¿Mamá, eso te suena?');
          } },
        { id: 'barrier', name: 'Barrera de luz', x: 160, y: 330, w: 400, h: 90,
          draw(g, S, t) {
            g.save(); g.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 5; i++) { g.strokeStyle = `rgba(255,42,79,${0.35 + 0.25 * Math.sin(t * 8 + i)})`; g.lineWidth = 3; g.beginPath(); g.moveTo(170, 345 + i * 16); g.lineTo(550, 345 + i * 16 + Math.sin(t * 3 + i) * 4); g.stroke(); }
            g.restore();
          },
          async act(C) {
            if (C.S.crossed) return C.say('teo', 'Ya he cruzado. Lo que hay detrás… ya lo tengo yo.');
            if (C.who !== 'teo') { C.sfx('hurt'); await C.say('ordo', 'MENTE CARTOGRAFIADA. ACCESO DENEGADO.'); return C.say(C.who, '¡Ay! Me ha rechazado. Detecta a cualquiera que esté en los mapas de ORDO.'); }
            C.S.crossed = true;
            await C.say('ordo', '…NO DETECTO A NADIE.');
            await C.say('teo', 'Porque no salgo en tus mapas. ¡He pasado!');
          } },
        { id: 'core', name: 'Núcleo del Heraldo', x: 270, y: 150, w: 180, h: 170,
          draw(g, S, t) {
            if (S.coreTaken) { g.strokeStyle = '#3a1a2a'; g.lineWidth = 3; g.beginPath(); g.arc(360, 235, 50, 0, TAU); g.stroke(); return; }
            const gr = g.createRadialGradient(360, 235, 4, 360, 235, 60);
            gr.addColorStop(0, '#fff'); gr.addColorStop(0.3, '#ff6a8a'); gr.addColorStop(1, 'rgba(120,0,40,0)');
            g.fillStyle = gr; g.beginPath(); g.arc(360, 235, 60 + 4 * Math.sin(t * 4), 0, TAU); g.fill();
          },
          async act(C) {
            if (C.S.coreTaken) return C.say(C.who, 'El soporte está vacío.');
            if (!C.S.crossed || C.who !== 'teo') return C.say(C.who, 'El núcleo está al otro lado de la barrera de luz. No llego.');
            C.S.coreTaken = true; C.give('nucleo');
            await C.say('teo', 'Está calentito y late como un corazón. ¡Lo llevo de vuelta!');
          } },
        { id: 'terminal', name: 'Terminal del pecio', x: 40, y: 560, w: 200, h: 200,
          draw(g, S, t) { screen(g, 40, 560, 200, 150, '#ff6a8a', S.coreIn, 4, t); g.fillStyle = '#2a0a16'; g.fillRect(60, 710, 160, 40); },
          async act(C) {
            if (C.S.found) return C.say('nora', 'Datos copiados. Ya sabemos cómo es ORDO PRIMORDIAL.');
            if (!C.S.coreIn) {
              if (!C.has('nucleo')) return C.say('nora', 'Puedo leer la memoria del Heraldo desde aquí… si tuviera su núcleo.');
              if (C.who !== 'nora') return C.say(C.who, 'Esto es una interfaz de ORDO. Solo Nora se atreve con algo así.');
              C.take('nucleo'); C.S.coreIn = true; C.sfx('blip');
              await C.say('nora', 'Núcleo conectado. Está cifrado con un número de versión. Tres cifras.');
            }
            const ok = await C.code({ type: 'digits', len: 3, answer: '741', title: 'MEMORIA DEL HERALDO', hint: 'Versión del cifrado (3 cifras)' });
            if (!ok) return;
            await C.say('nora', '¡Descifrado! Planes de ORDO, diseños… y algo llamado ORDO PRIMORDIAL.');
            await C.found();
          } },
        { id: 'door', name: 'Compuerta del pecio', x: 260, y: 600, w: 220, h: 300,
          draw(g, S) {
            g.fillStyle = '#1a0610'; g.beginPath();
            for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6; g[i ? 'lineTo' : 'moveTo'](370 + Math.cos(a) * 140, 750 + Math.sin(a) * 140); }
            g.closePath(); g.fill(); g.strokeStyle = S.open ? '#9dff6a' : '#ff2a4f'; g.lineWidth = 5; g.stroke();
            if (!S.open) { g.fillStyle = '#ff2a4f'; g.beginPath(); g.arc(370, 750, 14, 0, TAU); g.fill(); }
          },
          async act(C) {
            if (!C.S.found) return C.say('dario', 'Sellada por ORDO. Y no nos vamos sin esos datos.');
            if (C.who !== 'lia') return C.say(C.who, 'Es una cerradura de ORDO. Lía dijo que su Protocolo inverso podría abrirla.');
            await C.say('lia', 'Primera prueba del Protocolo Cuna inverso. Si funciona aquí, funcionará en la Grieta…');
            C.S.open = true; C.sfx('power');
            await C.say('ordo', 'ERROR. ERROR. ESA ORDEN NO EXISTE.');
            return C.escape();
          } },
      ],
      hints: [
        S => !S.crossed && { who: 'nora', text: 'La barrera detecta a quien esté en los mapas de ORDO… ¿y quién no está en ellos?' },
        S => !S.coreTaken && { who: 'dario', text: 'Teo, ya que estás al otro lado, coge el núcleo.' },
        S => !S.coreIn && { who: 'lia', text: 'Nora, conecta el núcleo a la terminal.' },
        S => !S.plateOff && { who: 'nora', text: 'Pide una versión de tres cifras. Esa placa suelta esconde algo: Darío puede arrancarla.' },
        S => !S.found && { who: 'lia', text: 'La versión de mi Protocolo es 7.4.1. Escribe 741 en la terminal.' },
        () => ({ who: 'nora', text: 'Mamá, la compuerta: tu Protocolo inverso.' }),
      ],
    },
  ];

  /* ----------------------- Iconos del inventario ----------------------- */
  const ITEMS = {
    fusible:  { name: 'Fusible', icon: '⚡' },
    tarjeta:  { name: 'Tarjeta de mantenimiento', icon: '💳' },
    palanca:  { name: 'Palanca de emergencia', icon: '🔧' },
    cristal:  { name: 'Cristal de memoria', icon: '💎' },
    manivela: { name: 'Manivela', icon: '⚙️' },
    llave:    { name: 'Llave del panel', icon: '🔑' },
    nucleo:   { name: 'Núcleo del Heraldo', icon: '🔴' },
  };

  return { ROOMS, ITEMS, W, H, base };
})();

window.Rooms = Rooms;

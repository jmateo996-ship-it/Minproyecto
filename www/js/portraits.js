/* =========================================================================
   Retratos ilustrados de los personajes (SVG vectorial, nítido a cualquier
   tamaño). Se usan en diálogos, radio y estancias. Si existe arte encargado
   en assets/portraits/ (config.art = true), tiene prioridad sobre estos.
   ========================================================================= */
'use strict';

const Portraits = (() => {
  // Piezas comunes (viewBox 0 0 100 100)
  const bg = (c1, c2) => `<defs><radialGradient id="bg" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient>
    <linearGradient id="sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient></defs>
    <rect width="100" height="100" fill="url(#bg)"/>`;
  const body = (cloth, trim) => `<path d="M6 100 Q10 80 32 75 L68 75 Q90 80 94 100 Z" fill="${cloth}"/><path d="M6 100 Q10 80 32 75 L68 75 Q90 80 94 100 Z" fill="url(#sh)"/>
    <path d="M32 75 L50 88 L68 75" fill="none" stroke="${trim}" stroke-width="2.5"/>`;
  const neck = skin => `<path d="M42 60 L42 76 Q50 82 58 76 L58 60 Z" fill="${skin}"/><path d="M42 66 Q50 71 58 66 L58 62 L42 62Z" fill="#000" opacity=".15"/>`;
  const head = (skin, rx = 17, ry = 20, cy = 44) => `<ellipse cx="50" cy="${cy}" rx="${rx}" ry="${ry}" fill="${skin}"/>
    <ellipse cx="${50 - rx + 1}" cy="${cy + 2}" rx="3" ry="5" fill="${skin}"/><ellipse cx="${50 + rx - 1}" cy="${cy + 2}" rx="3" ry="5" fill="${skin}"/>
    <ellipse cx="50" cy="${cy + 6}" rx="${rx}" ry="${ry - 6}" fill="#000" opacity=".06"/>`;
  const eyes = (y, iris, size = 2.4, gap = 7) => [50 - gap, 50 + gap].map(x =>
    `<ellipse cx="${x}" cy="${y}" rx="${size + 1.4}" ry="${size}" fill="#fff"/><circle cx="${x}" cy="${y}" r="${size * 0.85}" fill="${iris}"/>
     <circle cx="${x}" cy="${y}" r="${size * 0.4}" fill="#111"/><circle cx="${x + 0.8}" cy="${y - 0.8}" r="${size * 0.3}" fill="#fff"/>`).join('');
  const brows = (y, color, tilt = 0, w = 2) => `<path d="M${40.5} ${y + tilt} Q43.5 ${y - 2} ${47} ${y}" stroke="${color}" stroke-width="${w}" fill="none" stroke-linecap="round"/>
    <path d="M${53} ${y} Q56.5 ${y - 2} ${59.5} ${y + tilt}" stroke="${color}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
  const nose = (y, skinDark) => `<path d="M50 ${y} Q48 ${y + 6} 50.5 ${y + 7}" stroke="${skinDark}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
  const mouth = (y, d = 'smile', color = '#a2524a') => d === 'smile'
    ? `<path d="M45 ${y} Q50 ${y + 3.5} 55 ${y}" stroke="${color}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
    : d === 'firm' ? `<path d="M45.5 ${y + 1} L54.5 ${y + 1}" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>`
    : `<path d="M44.5 ${y} Q50 ${y + 5} 55.5 ${y} Q50 ${y + 2} 44.5 ${y}Z" fill="${color}"/>`;
  const svg = inner => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${inner}</svg>`);

  const P = {};

  // DARÍO · padre, piloto, unos 45 años: pelo corto oscuro, barba de tres días, auriculares de vuelo
  P.dario = svg(bg('#2a6f9a', '#071a2e') + body('#1d3a58', '#4fd8ff') + `<path d="M36 76 L44 90 L50 84 L56 90 L64 76" fill="#25496e"/>`
    + neck('#c08a66') + head('#c99470')
    + `<path d="M35 50 Q37 66 50 67 Q63 66 65 50 Q62 61 50 62 Q38 61 35 50Z" fill="#3a2a20" opacity=".35"/>`
    + `<path d="M32 44 Q30 21 50 21 Q70 21 68 44 Q66 31 58 28 Q50 32 40 30 Q34 33 32 44Z" fill="#2b2220"/>`
    + `<path d="M40 30 Q48 25 58 28" stroke="#4a3a33" stroke-width="1.2" fill="none"/>`
    + eyes(45, '#3f6e8c') + brows(39.5, '#2b2220', 0.5, 2.4) + nose(46, '#9d6c4e') + mouth(56, 'firm', '#8c4b40')
    + `<path d="M31 42 Q31 20 50 19 Q69 20 69 42" fill="none" stroke="#1a1f2a" stroke-width="3"/><rect x="27" y="38" width="7" height="12" rx="3" fill="#1a1f2a"/>
       <rect x="66" y="38" width="7" height="12" rx="3" fill="#1a1f2a"/><path d="M30 49 Q32 58 42 58" fill="none" stroke="#1a1f2a" stroke-width="1.8"/><circle cx="43" cy="58" r="1.8" fill="#4fd8ff"/>`);

  // LÍA · madre, ingeniera: pelo naranja recogido en moño, gafas de taller en la frente, peto ámbar
  P.lia = svg(bg('#a8641c', '#2a1206') + body('#7a4a18', '#ffb347')
    + `<rect x="36" y="76" width="5" height="24" fill="#ffb347"/><rect x="59" y="76" width="5" height="24" fill="#ffb347"/><circle cx="38.5" cy="82" r="1.6" fill="#fff3"/><circle cx="61.5" cy="82" r="1.6" fill="#fff3"/>`
    + neck('#e2b393') + `<path d="M31 46 Q27 62 33 70 L38 54Z" fill="#e0651e"/><path d="M69 46 Q73 62 67 70 L62 54Z" fill="#e0651e"/>`
    + head('#f1c7a6')
    + `<circle cx="50" cy="17" r="8" fill="#e0651e"/><circle cx="48" cy="15" r="3" fill="#ff8a3a" opacity=".6"/>`
    + `<path d="M32 46 Q30 22 50 22 Q70 22 68 46 Q64 33 54 31 Q44 34 36 36 Q33 40 32 46Z" fill="#e0651e"/><path d="M38 30 Q46 27 54 31" stroke="#ff9a52" stroke-width="1.5" fill="none"/>`
    + `<path d="M33 31 L67 31" stroke="#3a2a1a" stroke-width="2.4"/><circle cx="43" cy="30" r="5" fill="#3a2a1a"/><circle cx="57" cy="30" r="5" fill="#3a2a1a"/>
       <circle cx="43" cy="30" r="3.4" fill="#7fe8ff" opacity=".85"/><circle cx="57" cy="30" r="3.4" fill="#7fe8ff" opacity=".85"/><circle cx="42" cy="29" r="1" fill="#fff"/><circle cx="56" cy="29" r="1" fill="#fff"/>`
    + eyes(46, '#4c8a5a') + brows(40.5, '#b8501a', 0, 1.8) + nose(47, '#c99577') + mouth(56.5, 'smile', '#b5544a')
    + `<circle cx="40" cy="52" r="2.4" fill="#ff8a7a" opacity=".25"/><circle cx="60" cy="52" r="2.4" fill="#ff8a7a" opacity=".25"/>`);

  // NORA · 15 años, navegante y hacker: melena oscura con mechón verde, visor de datos, sudadera con capucha
  P.nora = svg(bg('#2f7a3a', '#071808') + `<path d="M4 100 Q6 72 30 68 L70 68 Q94 72 96 100Z" fill="#1d4a26"/>` + body('#2a6a34', '#9dff6a')
    + `<path d="M30 70 Q50 92 70 70" fill="none" stroke="#9dff6a" stroke-width="1.5" opacity=".7"/>`
    + neck('#c99070') + `<path d="M31 40 Q26 64 32 74 L40 60Z" fill="#1c1820"/><path d="M69 40 Q74 64 68 74 L60 60Z" fill="#1c1820"/>`
    + head('#d9a27e')
    + `<path d="M32 46 Q29 21 50 21 Q72 21 69 46 Q66 34 60 31 Q52 38 36 37 Q34 41 32 46Z" fill="#1c1820"/>`
    + `<path d="M58 23 Q66 30 67 44" stroke="#9dff6a" stroke-width="3" fill="none" stroke-linecap="round"/>`
    + eyes(45.5, '#6a4a2a') + `<rect x="35" y="40" width="30" height="11" rx="5.5" fill="#9dff6a" opacity=".32"/><rect x="35" y="40" width="30" height="11" rx="5.5" fill="none" stroke="#c8ffa8" stroke-width="1.4"/>
       <path d="M37 43 L45 43 M55 43 L60 43" stroke="#eaffd8" stroke-width="1" opacity=".8"/><path d="M65 45 L69 45" stroke="#1c1820" stroke-width="2"/>`
    + brows(37.5, '#1c1820', -0.5, 1.8) + nose(48, '#a87458') + mouth(57, 'firm', '#9a4c44'));

  // TEO · 8 años: pelo revuelto, pecas, ojos grandes y un aura dorada (no sale en los mapas de ORDO)
  P.teo = svg(bg('#a88a1a', '#201a04') + `<circle cx="50" cy="48" r="40" fill="none" stroke="#fff3a0" stroke-width="2" opacity=".35"/><circle cx="50" cy="48" r="45" fill="none" stroke="#ffe066" stroke-width="1" opacity=".25" stroke-dasharray="3 4"/>`
    + `<path d="M12 100 Q15 82 34 79 L66 79 Q85 82 88 100Z" fill="#e8b81a"/><path d="M12 100 Q15 82 34 79 L66 79 Q85 82 88 100Z" fill="url(#sh)"/><path d="M40 79 Q50 86 60 79" fill="none" stroke="#fff6c8" stroke-width="2"/>`
    + `<path d="M43 64 L43 80 Q50 84 57 80 L57 64Z" fill="#ecc19e"/>` + head('#f3cfae', 19, 21, 47)
    + `<path d="M30 48 Q27 24 50 23 Q73 24 70 48 Q70 36 63 33 L66 26 L58 31 L57 23 L51 30 L46 22 L43 31 L36 27 L38 34 Q32 38 30 48Z" fill="#9a6a34"/>`
    + eyes(48, '#4a7ab0', 3.2, 7.5) + brows(41.5, '#7a5228', -1, 1.6) + nose(51, '#d8a685') + mouth(59, 'smile', '#c25a4e')
    + [[40, 54], [43, 56], [38, 57], [60, 54], [57, 56], [62, 57]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="#c97a52" opacity=".7"/>`).join('')
    + `<circle cx="39" cy="55" r="3" fill="#ff9a8a" opacity=".22"/><circle cx="61" cy="55" r="3" fill="#ff9a8a" opacity=".22"/>`);

  // VEX · comandante: pelo platino rapado a un lado, cicatriz, uniforme del escuadrón Lanza con la V
  P.vex = svg(bg('#8a1f44', '#1a0410') + body('#3a1426', '#ff5c8a')
    + `<path d="M30 76 L38 74 L36 90Z M70 76 L62 74 L64 90Z" fill="#5a1e38"/><path d="M45 80 L50 88 L55 80" fill="none" stroke="#ff9db6" stroke-width="2.2"/>`
    + neck('#d6ab8c') + head('#e8bfa0', 16.5, 20)
    + `<path d="M33 44 Q32 22 52 21 Q71 22 67 40 Q62 28 52 27 Q44 26 40 30 Q36 34 33 44Z" fill="#e8e4ea"/><path d="M52 21 Q72 24 67 42 L70 36 Q72 26 60 22Z" fill="#c8c0d0"/>`
    + `<path d="M33 44 Q33 34 37 30" stroke="#8a8090" stroke-width="2" fill="none" opacity=".6"/>`
    + eyes(45, '#8a4a6a', 2.3) + brows(39.5, '#b8b0c0', -1.2, 2.2) + nose(46, '#b8876a') + mouth(56, 'firm', '#8a3a44')
    + `<path d="M40 38 L45 52" stroke="#c46b6b" stroke-width="1.3" stroke-linecap="round"/><path d="M41 41 L43 41 M42 45 L44 45 M43 49 L45 49" stroke="#c46b6b" stroke-width=".8"/>`);

  // CAPITÁN ORÉN · flota del norte: mayor, barba gris, gorra de oficial
  P.oren = svg(bg('#2a7a6a', '#04201a') + body('#1f3e3a', '#7fe0c0') + `<circle cx="38" cy="86" r="2" fill="#ffd27a"/><circle cx="44" cy="86" r="2" fill="#ffd27a"/>`
    + neck('#9a6646') + head('#a8714f')
    + `<path d="M34 48 Q35 70 50 71 Q65 70 66 48 Q62 58 56 58 Q50 55 44 58 Q38 58 34 48Z" fill="#c8c4c0"/><path d="M44 60 Q50 57 56 60" stroke="#e8e4e0" stroke-width="2" fill="none"/>`
    + eyes(44.5, '#3a4a3a', 2.2) + brows(38.5, '#d8d4d0', 0.8, 2.6) + nose(45, '#7a4f36')
    + `<path d="M31 33 Q32 18 50 17 Q68 18 69 33Z" fill="#1a3430"/><rect x="29" y="31" width="42" height="5" rx="2" fill="#7fe0c0"/><path d="M33 36 Q50 42 67 36 L70 38 Q50 45 30 38Z" fill="#0c1a18"/>
       <circle cx="50" cy="25" r="3.2" fill="#ffd27a"/>`);

  // ORDO · la mente del Dominio: un ojo rojo sin rostro
  P.ordo = svg(bg('#5a0a1e', '#0a0004') + `<circle cx="50" cy="50" r="38" fill="none" stroke="#c46bff" stroke-width="1.5" stroke-dasharray="6 3" opacity=".7"/>
    <circle cx="50" cy="50" r="30" fill="#14020a" stroke="#ff2a4f" stroke-width="2"/>
    <radialGradient id="ey"><stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="#ff6a8a"/><stop offset=".7" stop-color="#7a0a2a"/><stop offset="1" stop-color="#14020a"/></radialGradient>
    <circle cx="50" cy="50" r="26" fill="url(#ey)"/>`
    + Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return `<path d="M${50 + Math.cos(a) * 11} ${50 + Math.sin(a) * 11} L${50 + Math.cos(a) * 25} ${50 + Math.sin(a) * 25}" stroke="#ff9db6" stroke-width=".7" opacity=".5"/>`; }).join('')
    + `<ellipse cx="50" cy="50" rx="4.5" ry="10" fill="#050005"/><circle cx="46" cy="44" r="2" fill="#fff" opacity=".7"/>`);

  // ESPERANZA · sistema de a bordo: la silueta de la nave dentro de un hexágono, con onda de voz
  P.sys = svg(bg('#3a4a8a', '#060a1c') + `<path d="M50 12 L83 31 L83 69 L50 88 L17 69 L17 31Z" fill="#0c1430" stroke="#b8c7ff" stroke-width="2"/>
    <path d="M50 26 L54 36 L55 52 L64 56 L65 60 L54 59 L52 64 L48 64 L46 59 L35 60 L36 56 L45 52 L46 36Z" fill="#dfe8ff"/>
    <path d="M47 38 L50 33 L53 38 L52 42 L48 42Z" fill="#4fd8ff"/><rect x="38" y="57" width="5" height="1.5" fill="#ffb347"/><rect x="57" y="57" width="5" height="1.5" fill="#ffb347"/>
    <path d="M24 76 L30 76 L33 71 L37 80 L41 68 L45 82 L49 74 L53 76 L76 76" fill="none" stroke="#4fd8ff" stroke-width="1.6" stroke-linejoin="round"/>`);

  return P;
})();

window.PORTRAITS = Portraits;

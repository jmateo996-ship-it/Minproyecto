// Monta las capturas de tienda con su titular a partir de store/raw.
// Uso: node tools/store/compose.js   (genera todos los idiomas y tamaños)
//   store/google-play/<es|en>/          1080 × 1920  + imagen destacada 1024 × 500
//   store/app-store/<es|en>/iphone-6.7/ 1290 × 2796
//   store/app-store/<es|en>/ipad-13/    2064 × 2752
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..', '..');
const RAW = path.join(ROOT, 'store', 'raw');
const TMP = path.join(ROOT, 'store', 'tmp'); fs.mkdirSync(TMP, { recursive: true });

const SHOTS = [
  ['01_accion', 'accion', '#4fd8ff'], ['02_superjefe', 'superjefe', '#ff2a5a'], ['03_decision', 'decision', '#ffb347'],
  ['04_estancias', 'estancias', '#9dff6a'], ['05_jefes', 'jefes', '#c46bff'], ['06_hangar', 'hangar', '#ffe066'],
];
const TEXT = {
  es: { brand: 'ÉXODO 2942', logo: 'ÉXODO', tagline: 'Una familia. Un universo que no les deja ir.', caps: [
    ['15 MISIONES', 'DE ACCIÓN', 'Una familia contra un universo entero'],
    ['UN SÚPER JEFE', 'DE 4 FASES', 'ORDO PRIMORDIAL te espera en la Grieta'],
    ['TUS DECISIONES', 'CAMBIAN EL FINAL', '¿Salvarás a la comandante Vex?'],
    ['ESCAPA CON', 'TODA LA FAMILIA', 'Puzles con las habilidades de cada personaje'],
    ['15 JEFES', 'TODOS DISTINTOS', 'Y el modo Jefes 1 vs 1 para batirlos uno a uno'],
    ['MEJORA', 'TU NAVE', '4 modos de arma, uno por personaje'],
  ] },
  en: { brand: 'EXODUS 2942', logo: 'EXODUS', tagline: "A family. A universe that won't let them go.", caps: [
    ['15 ACTION', 'MISSIONS', 'A family against an entire universe'],
    ['A 4-PHASE', 'SUPER BOSS', 'PRIMORDIAL ORDO awaits at the Rift'],
    ['YOUR CHOICES', 'CHANGE THE ENDING', 'Will you save Commander Vex?'],
    ['ESCAPE WITH', 'THE WHOLE FAMILY', "Puzzles built on each character's skills"],
    ['15 BOSSES', 'ALL DIFFERENT', 'Plus 1 vs 1 Boss mode to beat them one by one'],
    ['UPGRADE', 'YOUR SHIP', '4 weapon modes, one per character'],
  ] },
};
// Maquetación de cada tamaño (en píxeles finales)
const TARGETS = [
  { id: 'play', dir: l => `google-play/${l}`, raw: 'phone', W: 1080, H: 1920, top: 70, k: 30, h: 96, sub: 40, fTop: 520, fW: 690, fH: 1380, rad: 56, pad: 14 },
  { id: 'iphone', dir: l => `app-store/${l}/iphone-6.7`, raw: 'phone', W: 1290, H: 2796, top: 150, k: 38, h: 118, sub: 50, fTop: 760, fW: 960, fH: 1920, rad: 80, pad: 18 },
  { id: 'ipad', dir: l => `app-store/${l}/ipad-13`, raw: 'tablet', W: 2064, H: 2752, top: 120, k: 44, h: 132, sub: 58, fTop: 700, fW: 1500, fH: 2000, rad: 70, pad: 22 },
];

const page = (t, a, img, cap, brand) => `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}
body{width:${t.W}px;height:${t.H}px;overflow:hidden;font-family:'Inter','Segoe UI',system-ui,sans-serif;color:#fff;position:relative;
  background:radial-gradient(ellipse at 50% 0%,#2a1458 0%,#0b0820 45%,#03020a 100%)}
.stars{position:absolute;inset:0;background-image:radial-gradient(2px 2px at 10% 20%,#fff8,transparent),radial-gradient(2px 2px at 80% 12%,#fff6,transparent),radial-gradient(1.5px 1.5px at 30% 70%,#fff5,transparent),radial-gradient(2px 2px at 90% 60%,#fff6,transparent),radial-gradient(1.5px 1.5px at 60% 35%,#fff7,transparent),radial-gradient(1.5px 1.5px at 15% 88%,#fff5,transparent)}
.cap{position:absolute;top:${t.top}px;left:0;right:0;text-align:center}
.k{font-size:${t.k}px;font-weight:800;letter-spacing:.45em;color:${a};margin-bottom:${t.k * 0.6}px}
.h{white-space:nowrap;display:inline-block;font-size:${t.h}px;font-weight:900;letter-spacing:.03em;line-height:1.02;text-shadow:0 0 ${t.h * 0.4}px ${a}}
.h2{color:${a}}
.sub{margin-top:${t.sub * 0.65}px;font-size:${t.sub}px;font-weight:500;opacity:.85}
.frame{position:absolute;left:50%;transform:translateX(-50%);top:${t.fTop}px;width:${t.fW}px;height:${t.fH}px;border-radius:${t.rad}px;padding:${t.pad}px;
  background:linear-gradient(160deg,#3a4a6a,#0c1020);box-shadow:0 0 0 3px ${a},0 0 ${t.W / 12}px color-mix(in srgb,${a} 55%,transparent),0 40px 80px #000}
.frame img{width:100%;height:100%;object-fit:cover;object-position:top;border-radius:${t.rad - t.pad}px;display:block}
</style></head><body><div class="stars"></div>
<div class="cap"><div class="k">${brand}</div><div class="h">${cap[0]}</div><br><div class="h h2">${cap[1]}</div><div class="sub">${cap[2]}</div></div>
<div class="frame"><img src="file://${img}"></div>
<script>/* Encoge cada titular hasta que quepa en una línea */
for (const el of document.querySelectorAll('.h')) { let f = ${t.h}; while (el.scrollWidth > ${t.W} * 0.92 && f > 20) { f -= 2; el.style.fontSize = f + 'px'; } }</script></body></html>`;

const feature = (tx, img) => `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0;box-sizing:border-box}
body{width:1024px;height:500px;overflow:hidden;font-family:'Inter','Segoe UI',system-ui,sans-serif;color:#fff;background:#05030f;position:relative}
.bg{position:absolute;right:-60px;top:-175px;width:660px;height:1320px;background:url("file://${img}") center 0/cover;
  -webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 45%);mask-image:linear-gradient(90deg,transparent 0%,#000 45%)}
.shade{position:absolute;inset:0;background:linear-gradient(90deg,#05030f 0%,#05030fdd 38%,transparent 70%)}
.t{position:absolute;left:64px;top:110px}
.l1{font-size:${tx.logo.length > 5 ? 100 : 118}px;font-weight:900;letter-spacing:.12em;line-height:1;background:linear-gradient(180deg,#fff 10%,#8fe6ff 55%,#2a7dff);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 0 18px #4fd8ffaa)}
.l2{font-size:74px;font-weight:300;letter-spacing:.5em;color:#ffb347;text-shadow:0 0 24px #ffb347aa;margin-top:6px}
.l3{font-size:26px;margin-top:26px;opacity:.9}</style></head><body><div class="bg"></div><div class="shade"></div>
<div class="t"><div class="l1">${tx.logo}</div><div class="l2">2942</div><div class="l3">${tx.tagline}</div></div></body></html>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const lang of ['es', 'en']) {
    const tx = TEXT[lang];
    for (const t of TARGETS) {
      const out = path.join(ROOT, 'store', t.dir(lang)); fs.mkdirSync(out, { recursive: true });
      await p.setViewportSize({ width: t.W, height: t.H });
      for (let i = 0; i < SHOTS.length; i++) {
        const [name, raw, a] = SHOTS[i];
        const f = path.join(TMP, 'c.html');
        fs.writeFileSync(f, page(t, a, path.join(RAW, lang, t.raw, raw + '.png'), tx.caps[i], tx.brand));
        await p.goto('file://' + f); await p.waitForTimeout(200);
        await p.screenshot({ path: path.join(out, name + '.png') });
      }
      console.log('ok', t.dir(lang));
    }
    await p.setViewportSize({ width: 1024, height: 500 });
    const f = path.join(TMP, 'f.html');
    fs.writeFileSync(f, feature(tx, path.join(RAW, lang, 'phone', 'superjefe.png')));
    await p.goto('file://' + f); await p.waitForTimeout(250);
    await p.screenshot({ path: path.join(ROOT, 'store', 'google-play', lang, 'imagen_destacada_1024x500.png') });
    console.log('ok destacada', lang);
  }
  await b.close();
})();

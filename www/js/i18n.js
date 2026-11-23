/* =========================================================================
   Idiomas. El juego está escrito en español; las traducciones son
   diccionarios "texto en español" -> "traducción" (ver lang_en.js).
   Si falta una traducción, se muestra el texto original.
   ========================================================================= */
'use strict';

const I18N = (() => {
  const DICTS = { es: null, en: window.LANG_EN || {} };
  let lang = 'es';

  function detect() {
    const n = (navigator.language || 'es').toLowerCase();
    return n.startsWith('es') ? 'es' : 'en';
  }
  function T(s) {
    if (lang === 'es' || s == null) return s;
    const d = DICTS[lang];
    return (d && d[s]) || s;
  }
  // Elementos con data-i18n: se traduce su texto original
  function applyDom(root = document) {
    root.querySelectorAll('[data-i18n]').forEach(el => {
      if (!el.dataset.i18nSrc) el.dataset.i18nSrc = el.textContent.trim();
      el.textContent = T(el.dataset.i18nSrc);
    });
    document.documentElement.lang = lang;
  }
  function setLang(l) { lang = DICTS[l] !== undefined ? l : 'es'; applyDom(); }
  return { T, setLang, applyDom, detect, get lang() { return lang; }, LANGS: [['es', 'ESPAÑOL'], ['en', 'ENGLISH']] };
})();

window.I18N = I18N;
window.T = I18N.T;

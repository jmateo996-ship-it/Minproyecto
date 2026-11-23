/* =========================================================================
   META: todo lo que rodea al juego y lo hace "producto"
   - Ajustes (idioma, dificultad, sensibilidad, vibración, accesibilidad)
   - Hangar: créditos, mejoras permanentes y modos de arma por personaje
   - Logros
   - Compra única (demo gratis del Acto I + desbloqueo del juego completo)
   - Vibración nativa (Capacitor Haptics) con alternativa web
   - Carga opcional de arte y música encargados (assets/)
   ========================================================================= */
'use strict';

const Meta = (() => {
  const T = s => (window.T ? window.T(s) : s);
  const CONFIG = Object.assign({
    demo: false,                         // true en la versión de tienda: Acto I gratis
    productId: 'exodo2942.full',         // id del producto en App Store Connect / Play Console
    priceFallback: '4,99 €',             // precio que se muestra si la tienda no responde
  }, window.GAME_CONFIG || {});

  /* ------------------------------ Dificultad ------------------------------ */
  // hp: vida de enemigos y jefes · bullet: velocidad de balas enemigas
  // fire: cadencia enemiga · lives: vidas iniciales · reward: puntos y créditos
  // shield: segmentos de escudo extra (o de menos) respecto al hangar
  const DIFFICULTY = [
    { id: 'easy',   name: 'FÁCIL',   color: '#9dff6a', hp: 0.6, bullet: 0.8,  fire: 0.7, lives: 5, shield: 1,  reward: 0.75,
      desc: 'Para disfrutar de la historia sin agobios.' },
    { id: 'normal', name: 'NORMAL',  color: '#4fd8ff', hp: 1.0, bullet: 1.0,  fire: 1.0, lives: 3, shield: 0,  reward: 1.0,
      desc: 'La experiencia equilibrada, tal como se diseñó el juego.' },
    { id: 'hard',   name: 'DIFÍCIL', color: '#ff2a5a', hp: 1.4, bullet: 1.15, fire: 1.3, lives: 2, shield: -1, reward: 1.5,
      desc: 'Para expertos: cada impacto cuenta.' },
  ];

  /* ------------------------------- Mejoras ------------------------------- */
  const COSTS = [800, 2000, 4000];
  const UPGRADES = [
    { id: 'cannon', name: 'CAÑONES',        desc: 'Empiezas cada misión con más potencia de fuego.', values: [1, 2, 3, 4], fmt: v => T('Potencia inicial') + ' ' + v },
    { id: 'shield', name: 'ESCUDO',         desc: 'Más segmentos de escudo antes de perder una vida.', values: [3, 4, 5, 6], fmt: v => v + ' ' + T('segmentos') },
    { id: 'drones', name: 'DRONES',         desc: 'Drones de apoyo desde el principio. El último nivel los hace más letales.', values: [0, 1, 2, 2], fmt: (v, l) => v + ' ' + T('drones') + (l === 3 ? ' · ' + T('+50 % daño') : '') },
    { id: 'pulse',  name: 'REACTOR PULSO',  desc: 'Más cargas de PULSO iniciales y máximas.', values: [3, 4, 5, 6], fmt: v => v + ' ' + T('cargas') },
    { id: 'magnet', name: 'IMÁN',           desc: 'Atrae las cápsulas desde más lejos.', values: [140, 210, 280, 360], fmt: v => T('Radio') + ' ' + v },
    { id: 'phase',  name: 'MOTOR DE FASE',  desc: 'La FASE se recarga antes.', values: [2.6, 2.2, 1.8, 1.4], fmt: v => T('Recarga') + ' ' + v.toFixed(1) + ' s' },
  ];

  /* ---------------------- Modos de arma por personaje ---------------------- */
  // Cada miembro de la familia se pone al mando de las armas del Esperanza.
  const SHIP_MODES = [
    { id: 'dario', name: 'ASALTO',  who: 'dario', color: '#2ad4ff', desc: 'Darío dispara en abanico. Equilibrado y fiable.', unlock: null },
    { id: 'lia',   name: 'LÁSER',   who: 'lia',   color: '#ffb347', desc: 'Lía reconstruye el láser de la Fragata Lanza: rayos que atraviesan varios enemigos.', unlock: 1 },
    { id: 'nora',  name: 'HACKEO',  who: 'nora',  color: '#9dff6a', desc: 'Nora usa el código del Instituto: proyectiles que buscan al enemigo.', unlock: 2 },
    { id: 'teo',   name: 'FASE',    who: 'teo',   color: '#ffe066', desc: 'Teo domina su don: FASE más larga y frecuente, disparo muy abierto y nave más difícil de alcanzar.', unlock: 3 },
  ];

  /* ------------------------------- Logros ------------------------------- */
  const ACHIEVEMENTS = [
    { id: 'first_flight', name: 'Despegue',             desc: 'Completa la misión 1.' },
    { id: 'mini_down',    name: 'Cazador',              desc: 'Derrota a tu primer mini jefe.' },
    { id: 'lanza',        name: 'Alumno aventajado',    desc: 'Derrota a la Fragata Lanza.' },
    { id: 'forja',        name: 'Corazón frío',         desc: 'Derrota a la Forja Madre.' },
    { id: 'ordo',         name: 'Fuera de la jaula',    desc: 'Derrota a ORDO PRIMORDIAL.' },
    { id: 'room_any',     name: 'Trabajo en equipo',    desc: 'Escapa de tu primera estancia.' },
    { id: 'rooms_all',    name: 'Los cuatro Vega',      desc: 'Escapa de las 4 estancias.' },
    { id: 'files_all',    name: 'Archivista',           desc: 'Encuentra los 4 objetos de la historia.' },
    { id: 'flawless',     name: 'Intocable',            desc: 'Completa una misión sin recibir ningún impacto.' },
    { id: 'max_power',    name: 'Potencia máxima',      desc: 'Alcanza la potencia 5.' },
    { id: 'squadron',     name: 'Escuadrón entero',     desc: 'Derriba un escuadrón completo.' },
    { id: 'pulse10',      name: 'Reactor viejo',        desc: 'Usa el PULSO 10 veces.' },
    { id: 'kills500',     name: 'As del Dominio',       desc: 'Derriba 500 enemigos.' },
    { id: 'upgrade_max',  name: 'Mecánica de Lía',      desc: 'Lleva una mejora del hangar al nivel máximo.' },
    { id: 'all_modes',    name: 'Familia al mando',     desc: 'Desbloquea los 4 modos de arma.' },
    { id: 'end_vex',      name: 'Nadie se queda atrás', desc: 'Termina la historia habiendo salvado a Vex.' },
    { id: 'end_alone',    name: 'Solos contra todo',    desc: 'Termina la historia sin salvar a Vex.' },
    { id: 'hard_clear',   name: 'Sin miedo',            desc: 'Termina la historia en dificultad Difícil.' },
    { id: 'arcade5',      name: 'Superviviente',        desc: 'Aguanta 5 minutos en el modo Arcade.' },
    { id: 'bossrush',     name: 'Cazajefes',            desc: 'Completa el modo Jefes.' },
    { id: 'duels_all',    name: 'Duelista',             desc: 'Derrota a los 15 jefes en el modo Jefes 1 vs 1.' },
  ];

  /* ------------------------------ Vibración ------------------------------ */
  let vibrationOn = true;
  function haptic(ms) {
    if (!vibrationOn) return;
    try {
      const H = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics;
      if (H && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
        H.impact({ style: ms >= 150 ? 'HEAVY' : ms >= 60 ? 'MEDIUM' : 'LIGHT' });
        return;
      }
      if (navigator.vibrate) navigator.vibrate(ms);
    } catch (e) { /* sin vibración */ }
  }

  /* ------------------- Servicios de juego (Game Center / Play Games) -------------------
     Punto de enganche: cuando instales un plugin de logros/clasificaciones, conéctalo
     aquí. Sin plugin, los logros solo se guardan en el dispositivo. */
  function reportAchievement(id) {
    try { if (window.GameServices && window.GameServices.unlock) window.GameServices.unlock(id); } catch (e) { }
  }
  function reportScore(board, value) {
    try { if (window.GameServices && window.GameServices.submit) window.GameServices.submit(board, value); } catch (e) { }
  }

  /* --------------------------- Compra única ---------------------------
     Usa cordova-plugin-purchase (CdvPurchase) en iOS y Android. En el navegador
     no hay tienda: se simula la compra para poder probar el flujo. */
  const Store = (() => {
    let onOwned = null, price = CONFIG.priceFallback, ready = false;
    function init(cb) {
      onOwned = cb;
      const C = window.CdvPurchase;
      if (!C) return;
      try {
        const { store, ProductType, Platform } = C;
        store.register([
          { id: CONFIG.productId, type: ProductType.NON_CONSUMABLE, platform: Platform.APPLE_APPSTORE },
          { id: CONFIG.productId, type: ProductType.NON_CONSUMABLE, platform: Platform.GOOGLE_PLAY },
        ]);
        store.when()
          .productUpdated(p => { if (p.id === CONFIG.productId) { if (p.pricing && p.pricing.price) price = p.pricing.price; if (p.owned && onOwned) onOwned(); } })
          .approved(t => t.verify())
          .verified(r => { r.finish(); if (onOwned) onOwned(); });
        store.initialize([Platform.APPLE_APPSTORE, Platform.GOOGLE_PLAY]).then(() => { ready = true; });
      } catch (e) { console.warn('Tienda no disponible', e); }
    }
    function purchase() {
      const C = window.CdvPurchase;
      if (C && ready) {
        const p = C.store.get(CONFIG.productId), offer = p && p.getOffer();
        if (offer) return offer.order().then(() => true).catch(() => false);
        return Promise.resolve(false);
      }
      // Navegador / pruebas: simulación
      const ok = window.confirm(T('Modo de prueba (sin tienda): ¿simular la compra del juego completo?'));
      if (ok && onOwned) onOwned();
      return Promise.resolve(ok);
    }
    function restore() {
      const C = window.CdvPurchase;
      if (C && ready) return C.store.restorePurchases();
      return Promise.resolve();
    }
    return { init, purchase, restore, get price() { return price; } };
  })();

  /* -------------------- Arte y música encargados (opcional) --------------------
     Si existen estos archivos, se usan en lugar del arte generado por código.
     Ver ASSETS.md para la lista completa y los tamaños. */
  const art = { portraits: {}, rooms: {} };
  function loadImage(src, cb) { const img = new Image(); img.onload = () => cb(img); img.src = src; }
  function loadArt(characterIds, roomIds) {
    if (!CONFIG.art) return;
    for (const id of characterIds) loadImage('assets/portraits/' + id + '.webp', img => { art.portraits[id] = img.src; });
    for (const id of roomIds) loadImage('assets/rooms/room' + id + '.webp', img => { art.rooms[id] = img; });
  }

  return {
    CONFIG, DIFFICULTY, UPGRADES, COSTS, SHIP_MODES, ACHIEVEMENTS,
    haptic, setVibration: v => { vibrationOn = v; }, reportAchievement, reportScore,
    Store, art, loadArt,
  };
})();

window.Meta = Meta;

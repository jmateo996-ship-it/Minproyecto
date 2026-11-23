/* Configuración de la versión.
   demo: true  -> versión de tienda: el Acto I es gratis y el resto se
                  desbloquea con una compra única (productId).
   demo: false -> juego completo sin compras (pruebas, versión de pago). */
window.GAME_CONFIG = {
  demo: false,
  productId: 'exodo2942.full',
  priceFallback: '4,99 €',
  art: false,      // true cuando existan los retratos y fondos encargados en www/assets (ver ASSETS.md)
};

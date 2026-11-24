# ÉXODO 2942

Un *shoot'em up* vertical futurista para **iPhone/iPad (App Store)** y **Android (Google Play)**, inspirado en los clásicos arcade de aviones de scroll vertical, con una historia completa en 15 misiones.

> **Una familia. Un universo que no les deja ir.**
> En 2942, la inteligencia ORDO controla cada mente del Dominio. Teo Vega, de 8 años, nació durante los únicos nueve minutos en que su Red estuvo apagada: es la única mente que ORDO no puede ver, y la única capaz de abrir la Grieta, la salida del universo. Su familia tiene que llevarlo hasta ella.

Toda la historia está en [`HISTORIA.md`](HISTORIA.md) y el guion jugable en [`www/js/story.js`](www/js/story.js).

## Características

- **15 misiones de 2 minutos** (unos 30 minutos de juego más los combates finales), repartidas en tres actos: *La Huida*, *La Verdad* y *La Grieta*.
- **15 jefes con diseño y forma de luchar únicos**: ninguno repite aspecto (torre con subnaves, cúpula de placas giratorias, manta de cristal, satélite con cámaras, crucero tridente, prisma que se desdobla, barrena con cuchillas…). Su vida está calibrada para que cada combate dure algo más que el anterior.
- **Cada misión termina con un combate**:
  - **Mini jefe** en 12 misiones: Guardián del Censo, Torre Centinela, Excavadora Minera, Leviatán Vítreo, Fundidor, Heraldo de ORDO… Son más débiles que los jefes.
  - **Jefe** en las misiones 5 (**Fragata Lanza**) y 10 (**Forja Madre**).
  - **Súper jefe** en la misión 15: **ORDO PRIMORDIAL**, con 4 fases, 6 satélites que bloquean tus disparos, muros de balas y una fase final con el núcleo al descubierto.
- **4 estancias de personajes (puzle)**, después de las misiones 3, 6, 9 y 12. La familia baja de la nave y tiene que escapar de una sala en 6 minutos:
  - **La Esclusa 9**, **La Sonda Arenal‑7**, **La Cabina del Capataz** y **El Pecio del Heraldo**.
  - Cada personaje tiene su habilidad: Darío (fuerza), Lía (ingeniería), Nora (informática) y Teo (es pequeño y ORDO no puede detectarlo).
  - Hay objetos de inventario, códigos numéricos, de letras y de colores, y un botón de PISTA.
  - En cada estancia hay un **objeto de la historia** que desbloquea el **análisis** de los jefes y mini jefes de las 3 misiones siguientes, incluido el súper jefe: **+35 % de daño** contra ellos y su punto débil marcado. Todo se consulta en **EXPEDIENTES**.
- **16 tipos de enemigo**, entre ellos bombarderos, francotiradores que avisan con un láser antes de disparar, divisores que se parten en dos, orbitadores, enjambres y acorazados. Los nuevos se van incorporando misión a misión.
- Enemigos resistentes (`ENEMY_TOUGHNESS = 3` en `www/js/game.js`, el triple del valor original), con barra de vida en los más grandes.
- Oleada de asalto cada 40 segundos y **punto de control al minuto 1**: si caes, sigues desde ahí con la potencia que llevabas.
- **Historia narrada**: prólogo, diálogos con retratos al empezar y al acabar cada misión, mensajes de radio durante el vuelo y epílogo.
- 5 escenarios con fondo parallax y música propia: ciudad, cinturón de asteroides, nebulosa de cristal, forja y la Grieta.
- **Gráficos hasta 4K**: todo es vectorial y se dibuja a la densidad física de la pantalla, hasta 2160×3840 px (4K vertical).
- **Controles táctiles**: arrastra en cualquier parte de la pantalla (el dedo nunca tapa la nave), **FASE** te vuelve intangible un instante y **PULSO** limpia la pantalla de balas.
- Mejoras de potencia (5 niveles), escudo, drones de apoyo, escuadrones que dan premio, récord y misiones desbloqueables guardados en el dispositivo.
- **Hangar**: los créditos ganados en cada misión compran 6 mejoras permanentes con 3 niveles: cañones, escudo, drones, reactor de pulso, imán y motor de fase.
- **4 modos de arma, uno por personaje**: Asalto (Darío), Láser que atraviesa enemigos (Lía), proyectiles teledirigidos (Nora) y Fase (Teo). Se desbloquean al escapar de las estancias 1, 2 y 3.
- **Una elección con dos finales**: en la misión 5 decides si salvas a Vex. Cambia diálogos de las misiones 7, 9, 11, 12 y 15, la estancia 4 y el epílogo; en la ruta sin Vex aparece el capitán Orén.
- **Jefes 1 vs 1** (menú principal): los 15 jefes y mini jefes en el orden de la historia, uno contra uno. Se desbloquean derrotando al anterior o llegando a su misión; guardan tu mejor tiempo y dan créditos.
- **Modos extra**: **Arcade** infinito, con un mini jefe y cambio de escenario cada 75 segundos, y **modo Jefes** (8 jefes seguidos contra el reloj).
- **20 logros** con aviso en pantalla y un punto de enganche para Game Center y Google Play Games (`Meta.reportAchievement`).
- **Tutorial jugable** en la misión 1: moverse, disparar, FASE, PULSO y cápsulas.
- **Ajustes**: idioma, 3 dificultades, sensibilidad del dedo, vibración, disparo automático, texto grande y balas de alto contraste para daltonismo.
- **Español e inglés**: el idioma se elige solo según el del móvil y se puede cambiar en Ajustes.
- **Vibración nativa** con `@capacitor/haptics` en iOS y Android, y `navigator.vibrate` en el navegador.
- **Demo gratis y compra única**: con `demo: true`, el Acto I es gratis y el resto se desbloquea con una compra no consumible.
- Música y efectos **sintetizados en tiempo real**: la app no lleva archivos de audio y ocupa muy poco.
- Sin anuncios ni rastreo: la ficha de privacidad de las tiendas es sencilla («no se recopilan datos»).

## Probarlo ahora en el navegador

**En el móvil, sin instalar nada:** abre [`Exodo2942.html`](Exodo2942.html) en el navegador. Es el juego completo en un solo archivo. [`Exodo2942-prueba-estancias.html`](Exodo2942-prueba-estancias.html) es la versión de prueba, con todo desbloqueado y acceso directo a las estancias. [`Exodo2942-demo.html`](Exodo2942-demo.html) es la **demo** tal como la vería quien la descarga gratis: el Acto I completo y, al terminarlo, la pantalla de compra (simulada). Ambos se regeneran con `npm run build:single`.


```bash
npm start            # sirve www/ en http://localhost:8080
```

O abre `www/index.html` directamente. En ordenador: flechas/WASD para mover, **Z** fase, **X** pulso, **P** pausa.

## Generar las apps nativas (Capacitor)

Requisitos: Node 18+, **Xcode** (macOS) para iOS y **Android Studio** para Android.

```bash
npm install
npm run cap:add      # crea los proyectos nativos ios/ y android/
npm run assets       # genera iconos y pantallas de carga para ambas plataformas
npm run ios          # abre el proyecto en Xcode
npm run android      # abre el proyecto en Android Studio
```

Después de cambiar algo en `www/`, ejecuta `npm run sync`.

### Configuración de la versión (`www/js/config.js`)

| Opción | Qué hace |
|---|---|
| `demo` | `true` en la versión de tienda: Acto I gratis y el resto con la compra `productId`. `false`: juego completo. |
| `productId` | Id de la compra no consumible. Créala igual en App Store Connect y en Play Console. |
| `priceFallback` | Precio que se muestra si la tienda aún no ha respondido. |
| `art` | `true` cuando existan los retratos y fondos encargados (ver [`ASSETS.md`](ASSETS.md)). |

### Compra dentro de la app

Usa [`cordova-plugin-purchase`](https://github.com/j3k0/cordova-plugin-purchase), compatible con Capacitor. Ya está en `package.json`.
1. `npm install && npx cap sync`.
2. Crea el producto `exodo2942.full` (no consumible) en las dos tiendas.
3. En iOS, activa la capacidad *In‑App Purchase* en Xcode. En Android, el permiso de facturación lo añade el plugin.
4. Prueba con cuentas *sandbox* (Apple) y de *pruebas de licencias* (Google).

La integración está escrita (`Meta.Store` en `www/js/meta.js`), pero no se ha podido probar en un dispositivo real con las tiendas: revísala en *sandbox* antes de publicar. En el navegador, la compra se simula con un aviso de confirmación.

### Idiomas

Los textos están en español en el código, y la traducción vive en `www/js/lang_en.js` (diccionario de texto en español a inglés). Si añades o cambias textos:
```bash
npm run i18n:missing > faltan.txt            # lista numerada de lo que falta
# traduce en otro archivo con el mismo número: "N<TAB>traducción"
python3 tools/i18n.py build faltan.txt traducido.txt
```

### Bloquear la orientación vertical

- **iOS**: en Xcode → *App* → *General* → *Deployment Info*, deja marcado solo **Portrait** (en iPhone y iPad).
- **Android**: en `android/app/src/main/AndroidManifest.xml`, añade `android:screenOrientation="portrait"` a la `<activity>` principal.

### Publicar en el App Store

1. Cuenta de Apple Developer (99 USD/año).
2. En Xcode: *Signing & Capabilities* → elige tu equipo; el *Bundle Identifier* es `com.minproyecto.exodo2942` (cámbialo en `capacitor.config.json` si quieres otro).
3. *Product → Archive* → *Distribute App* → *App Store Connect*.
4. En App Store Connect: capturas, descripción, categoría, edad y privacidad. Los textos en español e inglés, las palabras clave, el plan de capturas y el guion del tráiler están en [`STORE.md`](STORE.md).

### Publicar en Google Play

1. Cuenta de Google Play Console (25 USD, pago único).
2. Android Studio → *Build → Generate Signed Bundle / APK* → **Android App Bundle (.aab)** con tu clave de subida (guárdala bien: no la subas al repositorio).
3. En Play Console: crea la app, sube el `.aab` a *Pruebas internas* y luego a *Producción*; rellena la ficha, el cuestionario de contenido (IARC) y la sección *Seguridad de los datos* («No se recopilan datos»).

## Estructura

```
www/
  index.html            interfaz: menús, diálogos, HUD y controles táctiles
  css/style.css
  js/config.js          versión: demo/completa, id de la compra, arte encargado
  js/lang_en.js         traducción al inglés
  js/i18n.js            sistema de idiomas
  js/meta.js            ajustes, dificultad, hangar, modos de arma, logros, compra, vibración
  js/story.js           guion completo (personajes, prólogo, 15 misiones, elección y dos finales)
  js/game.js            motor: bucle, jugador, enemigos, oleadas, colisiones, flujo narrativo
  js/rooms.js           las 4 estancias de puzle (escenarios, objetos, códigos, pistas)
  js/bosses.js          mini jefes, jefes de las misiones 5 y 10 y súper jefe de la 15
  js/backgrounds.js     fondos parallax procedurales por capítulo
  js/sprites.js         naves, balas y efectos vectoriales a resolución nativa
  js/audio.js           música y efectos sintetizados
  assets/icon.svg       icono fuente
tools/make-store-assets.js   genera resources/icon.png y resources/splash.png
tools/build_single.py        genera las versiones de un solo archivo para el móvil
tools/i18n.py                extrae textos sin traducir y construye el diccionario
ASSETS.md                    arte, música y voces que encargar (tamaños y rutas)
STORE.md                     ficha de tienda ES/EN, capturas, tráiler y precio
capacitor.config.json
```

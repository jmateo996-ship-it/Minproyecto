# ÉXODO 2942

Un *shoot'em up* vertical futurista para **iPhone/iPad (App Store)** y **Android (Google Play)**, inspirado en los clásicos arcade de aviones de scroll vertical, con una historia completa en 15 misiones.

> **Una familia. Un universo que no les deja ir.**
> En 2942, la inteligencia ORDO controla cada mente del Dominio. Teo Vega, de 8 años, nació durante los únicos nueve minutos en que su Red estuvo apagada: es la única mente que ORDO no puede ver, y la única capaz de abrir la Grieta, la salida del universo. Su familia tiene que llevarlo hasta ella.

Toda la historia está en [`HISTORIA.md`](HISTORIA.md) y el guion jugable en [`www/js/story.js`](www/js/story.js).

## Características

- **15 misiones** (unos 65 minutos de juego), repartidas en tres actos: *La Huida*, *La Verdad* y *La Grieta*. Las 5 primeras duran **3 minutos** y las 10 restantes, **5 minutos**.
- **Jefe final cada 5 misiones**: la **Fragata Lanza** (misión 5) y la **Forja Madre** (misión 10).
- **Súper jefe en la misión 15: ORDO PRIMORDIAL**, con 4 fases, 6 satélites que bloquean tus disparos, muros de balas y una fase final con el núcleo al descubierto.
- Cada misión tiene una oleada de asalto por minuto y un **punto de control a mitad de misión** (1:30 en las de 3 minutos, 2:30 en las de 5): si caes, puedes seguir desde ahí con la potencia que llevabas.
- Las misiones sin jefe terminan con **MISIÓN CUMPLIDA** y una bonificación según el escudo y las vidas que te queden.
- **Historia narrada**: prólogo, diálogos con retratos al empezar y al acabar cada misión, más de 120 mensajes de radio durante el vuelo y epílogo.
- 5 escenarios con fondo parallax y música propia: ciudad, cinturón de asteroides, nebulosa de cristal, forja y la Grieta.
- **Gráficos hasta 4K**: todo es vectorial y se dibuja a la densidad física de la pantalla, hasta 2160×3840 px (4K vertical). El resplandor neón se pre-renderiza para no perder fluidez en móviles.
- **Controles táctiles**: arrastra en cualquier parte de la pantalla (el dedo nunca tapa la nave), **FASE** te vuelve intangible un instante y **PULSO** limpia la pantalla de balas.
- Mejoras de potencia (5 niveles), escudo, drones de apoyo, escuadrones que dan premio, récord y misiones desbloqueables guardados en el dispositivo.
- Música y efectos **sintetizados en tiempo real** (WebAudio): la app no lleva archivos de audio y ocupa muy poco.
- Sin anuncios ni rastreo: la ficha de privacidad de las tiendas es sencilla («no se recopilan datos»).

## Probarlo ahora en el navegador

**En el móvil, sin instalar nada:** abre [`Exodo2942.html`](Exodo2942.html) en el navegador. Es el juego completo en un solo archivo; se regenera con `python3 tools/build_single.py`.


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

### Bloquear la orientación vertical

- **iOS**: en Xcode → *App* → *General* → *Deployment Info*, deja marcado solo **Portrait** (en iPhone y iPad).
- **Android**: en `android/app/src/main/AndroidManifest.xml`, añade `android:screenOrientation="portrait"` a la `<activity>` principal.

### Publicar en el App Store

1. Cuenta de Apple Developer (99 USD/año).
2. En Xcode: *Signing & Capabilities* → elige tu equipo; el *Bundle Identifier* es `com.minproyecto.exodo2942` (cámbialo en `capacitor.config.json` si quieres otro).
3. *Product → Archive* → *Distribute App* → *App Store Connect*.
4. En App Store Connect: capturas (6,7" y 6,5" para iPhone, 13" para iPad), descripción, categoría **Juegos › Arcade**, clasificación por edades (violencia de fantasía leve → 9+) y privacidad «Datos no recopilados».

### Publicar en Google Play

1. Cuenta de Google Play Console (25 USD, pago único).
2. Android Studio → *Build → Generate Signed Bundle / APK* → **Android App Bundle (.aab)** con tu clave de subida (guárdala bien: no la subas al repositorio).
3. En Play Console: crea la app, sube el `.aab` a *Pruebas internas* y luego a *Producción*; rellena la ficha, el cuestionario de contenido (IARC) y la sección *Seguridad de los datos* («No se recopilan datos»).

## Estructura

```
www/
  index.html            interfaz: menús, diálogos, HUD y controles táctiles
  css/style.css
  js/story.js           guion completo (personajes, prólogo, 15 misiones, epílogo)
  js/game.js            motor: bucle, jugador, enemigos, oleadas, colisiones, flujo narrativo
  js/bosses.js          jefes de las misiones 5 y 10 y el súper jefe de la 15
  js/backgrounds.js     fondos parallax procedurales por capítulo
  js/sprites.js         naves, balas y efectos vectoriales a resolución nativa
  js/audio.js           música y efectos sintetizados
  assets/icon.svg       icono fuente
tools/make-store-assets.js   genera resources/icon.png y resources/splash.png
capacitor.config.json
```

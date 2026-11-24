# Ficha de tienda · App Store y Google Play

## Nombre y subtítulo

| | Español | English |
|---|---|---|
| Nombre (máx. 30) | Éxodo 2942: Shoot'em up | Exodus 2942: Shoot 'em up |
| Subtítulo iOS (máx. 30) | Una familia contra un universo | A family against a universe |
| Descripción corta Play (máx. 80) | Pilota la huida de una familia en un shoot'em up con historia, jefes y puzles. | Fly a family's escape in a story‑driven shoot 'em up with bosses and puzzles. |

## Descripción (español)

**En 2942, una inteligencia llamada ORDO controla cada mente del universo. Todas menos una.**

Teo, de 8 años, nació durante los únicos nueve minutos en que la Red de ORDO estuvo apagada. Es invisible para ella… y la única persona capaz de abrir la salida del universo. Pilota el *Esperanza* y lleva a la familia Vega hasta la Grieta.

- **15 misiones de acción vertical** con oleadas, mini jefes, jefes y un súper jefe de cuatro fases.
- **Misiones de personajes**: escapa de estancias resolviendo puzles con las habilidades de cada miembro de la familia.
- **Una historia que cuenta**: tus decisiones cambian el final.
- **Hangar**: mejora el *Esperanza* y desbloquea cuatro modos de arma, uno por personaje.
- **Modo Arcade** infinito y **modo Jefes** contra el reloj.
- Controles táctiles pensados para el móvil: arrastra en cualquier parte y tu dedo nunca tapa la nave.
- Accesible: tres dificultades, texto grande, balas de alto contraste y sensibilidad ajustable.
- En español e inglés. Sin anuncios.

Prueba gratis el Acto I completo. Desbloquea el resto con un único pago.

## Description (English)

**In 2942, an intelligence called ORDO controls every mind in the universe. All but one.**

Eight‑year‑old Teo was born during the only nine minutes ORDO's Net was ever offline. He is invisible to it… and the only person who can open the way out of the universe. Fly the *Esperanza* and take the Vega family to the Rift.

- **15 vertical action missions** with waves, mini‑bosses, bosses and a four‑phase super boss.
- **Character missions**: escape rooms by solving puzzles with each family member's skills.
- **A story that matters**: your choices change the ending.
- **Hangar**: upgrade the *Esperanza* and unlock four weapon modes, one per character.
- Endless **Arcade** mode and a **Boss Rush** against the clock.
- Touch controls built for phones: drag anywhere, your finger never covers the ship.
- Accessible: three difficulty levels, large text, high‑contrast bullets and adjustable sensitivity.
- In English and Spanish. No ads.

Play the whole of Act I for free. Unlock the rest with a single purchase.

## Palabras clave (iOS, máx. 100 caracteres)

- ES: `naves,arcade,shmup,matamarcianos,espacio,historia,jefes,puzle,retro,neon,disparos,familia`
- EN: `shmup,arcade,space,shooter,bullet hell,story,boss,puzzle,retro,neon,spaceship,sci-fi`

## Categoría y clasificación

- **Categoría:** Juegos › Arcade. Secundaria: Acción.
- **Edad:** violencia de fantasía leve, sin sangre → **9+** (Apple) y **PEGI 7** (cuestionario IARC en Play).
- **Privacidad:** el juego no recopila datos; todo se guarda en el dispositivo.
  - Apple: «Datos no recopilados».
  - Google Play: Seguridad de los datos → «No se recopilan ni comparten datos».
  - El pago lo gestiona la propia tienda.

## Precio y compra dentro de la app

- La app es **gratis** y tiene una **compra no consumible**:
  - id `exodo2942.full`
  - precio recomendado: **4,99 €**
  - nombre: «Juego completo / Full game»
- Créala con el **mismo id** en App Store Connect (*In‑App Purchases → Non‑Consumable*) y en Play Console (*Productos → Productos de compra única*).
- En `www/js/config.js`, pon `demo: true` en la versión de tienda.
- Apple exige un botón de **Restaurar compra**. Ya está en la pantalla de compra.

## Material listo para subir (carpeta `store/`)

| Tienda | Carpeta | Tamaño | Contenido |
|---|---|---|---|
| Google Play | `store/google-play/es/` y `en/` | 1080 × 1920 | 6 capturas y la imagen destacada de 1024 × 500 |
| App Store, iPhone 6,7" | `store/app-store/<es\|en>/iphone-6.7/` | 1290 × 2796 | 6 capturas |
| App Store, iPad 13" | `store/app-store/<es\|en>/ipad-13/` | 2064 × 2752 | 6 capturas (obligatorias porque el juego funciona en iPad) |
| Vídeo para Google Play y redes | `store/video/trailer_<es\|en>_1080x1920.mp4` | 1080 × 1920, 30 s | Súbelo a YouTube y pega el enlace en la Play Console |
| Vista previa del App Store | `store/video/app-preview_<es\|en>_886x1920.mp4` | 886 × 1920, 30 s | Para iPhone de 6,5" a 6,9" |

Las capturas son reales del juego. Orden recomendado:

| Archivo | Titular (ES / EN) | Qué muestra |
|---|---|---|
| `01_accion` | 15 MISIONES DE ACCIÓN / 15 ACTION MISSIONS | Oleada en el Mar de Cristal con el láser de Lía |
| `02_superjefe` | UN SÚPER JEFE DE 4 FASES / A 4-PHASE SUPER BOSS | ORDO PRIMORDIAL con el núcleo al descubierto |
| `03_decision` | TUS DECISIONES CAMBIAN EL FINAL / YOUR CHOICES CHANGE THE ENDING | La elección de salvar o no a Vex |
| `04_estancias` | ESCAPA CON TODA LA FAMILIA / ESCAPE WITH THE WHOLE FAMILY | La estancia de la sonda con los 4 personajes |
| `05_jefes` | 15 JEFES, TODOS DISTINTOS / 15 BOSSES, ALL DIFFERENT | Torre Centinela con sus subnaves |
| `06_hangar` | MEJORA TU NAVE / UPGRADE YOUR SHIP | Hangar con los 4 modos de arma |

### Regenerar todo cuando cambie el juego

```bash
npm run build:single                       # versiones de un solo archivo
for l in es en; do for d in phone tablet; do node tools/store/capture.js $l $d; done; done
node tools/store/compose.js                # capturas de Google Play y App Store
rm -rf store/tmp && tools/store/make_trailer.sh   # vídeos (graba, compone la música y monta)
```

## Guion del tráiler (30 segundos, ya montado en `store/video/`)

| Segundos | Imagen | Texto o voz |
|---|---|---|
| 0‑3 | Negro. Un ojo rojo se abre | ORDO: «NO EXISTE UN CIELO SIN ORDO.» |
| 3‑7 | Teo en su retrato, la familia | «Todas las mentes están en sus mapas. Todas menos una.» |
| 7‑14 | Montaje de acción: ciudad, asteroides, cristal y forja | Música en subida |
| 14‑18 | Estancia: Teo cruza la barrera de luz | ORDO: «…NO DETECTO A NADIE.» |
| 18‑22 | Elección de Vex en pantalla | «Tus decisiones cambian el final.» |
| 22‑27 | ORDO PRIMORDIAL: las fases y el núcleo al descubierto | Clímax |
| 27‑30 | Logo ÉXODO 2942 | «Una familia. Un universo que no les deja ir.» |

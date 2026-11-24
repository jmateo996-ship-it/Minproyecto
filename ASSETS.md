# Arte, música y voces que encargar

El juego funciona sin estos archivos, porque dibuja y sintetiza todo por código. Pero lo que más vende un juego en la tienda son las capturas y el vídeo, y ahí el arte hecho a mano marca la diferencia.

El código ya está preparado para usar las imágenes en cuanto existan:
1. Coloca los archivos en las rutas de abajo, dentro de `www/assets/`.
2. Cambia `art: false` por `art: true` en `www/js/config.js`.
3. Ejecuta `npm run sync`.

## 1. Retratos de personajes · prioridad máxima

El juego ya incluye **retratos ilustrados en vector** de los 8 personajes (`www/js/portraits.js`). Si se encargan retratos profesionales, se colocan en las rutas de abajo y sustituyen automáticamente a los ilustrados.

Aparecen en todos los diálogos, en la radio y en las estancias.

| Archivo | Personaje | Notas para el ilustrador |
|---|---|---|
| `assets/portraits/dario.webp` | Darío Vega, el padre, piloto. Unos 45 años | Exmilitar del Dominio, cansado pero firme. Acento cian. |
| `assets/portraits/lia.webp` | Lía Vega, la madre, ingeniera | Pelo naranja (lo dice la historia: la foto de 2914). Acento ámbar. |
| `assets/portraits/nora.webp` | Nora, 15 años, navegante y hacker | Gafas o lentes de datos, gesto concentrado. Acento verde. |
| `assets/portraits/teo.webp` | Teo, 8 años | Mirada curiosa, algo «fuera de lugar». Acento amarillo. |
| `assets/portraits/vex.webp` | Comandante Vex | Uniforme del escuadrón Lanza y emblema en V. Acento rosa. |
| `assets/portraits/ordo.webp` | ORDO | Un ojo rojo, no humano. Acento rojo. |
| `assets/portraits/oren.webp` | Capitán Orén (ruta sin Vex) | Oficial de flota amotinado. Acento turquesa. |
| `assets/portraits/sys.webp` | ESPERANZA, la IA de a bordo | Icono o interfaz, no una cara. |

- **Formato:** cuadrado, de **1024 × 1024 px**, en WebP. El personaje va centrado de hombros arriba, porque el recorte es circular.
- **Siguiente paso, opcional:** tres expresiones por personaje (normal, miedo y alivio). Habría que añadir el campo de expresión a cada línea del guion; puedo hacerlo cuando tengas las imágenes.

## 2. Fondos de las estancias de puzle

| Archivo | Estancia |
|---|---|
| `assets/rooms/room1.webp` | La Esclusa 9: sala de control industrial, ventanal a la cúpula, taquillas del escuadrón Lanza |
| `assets/rooms/room2.webp` | La Sonda Arenal‑7: interior oscuro, luz turquesa de emergencia, cápsula criogénica |
| `assets/rooms/room3.webp` | La Cabina del Capataz: metal oxidado, resplandor naranja de la Forja, caldera |
| `assets/rooms/room4.webp` | El Pecio del Heraldo: arquitectura hexagonal roja, un ojo apagado, barrera de luz |

- **Formato:** **1440 × 2000 px**, en vertical. El escenario lógico es de 720 × 1000, a doble resolución.
- Los objetos interactivos se dibujan por código encima del fondo, porque cambian de estado: taquilla abierta, panel encendido… El fondo debe dejar libre la zona de cada objeto. Las posiciones están en `www/js/rooms.js` (campos `x`, `y`, `w` y `h` de cada `hotspot`, sobre 720 × 1000).

## 3. Naves y jefes (opcional)

Las naves neón generadas por código aguantan bien, pero un artista puede darles personalidad:
- **El Esperanza:** 4 variantes de color, una por modo de arma. 512 × 512 px, vista cenital.
- **Los 5 jefes y 5 mini jefes:** de 1024 a 2048 px, vista cenital y con las piezas destructibles separadas (cañones de la Lanza, emisores de la Forja, satélites de ORDO).

Esta sección necesita cambios en el código (`sprites.js` y `bosses.js`) para cargar imágenes en lugar de vectores.

## 4. Música (prioridad alta)

Ahora la música es sintetizada y suena a prototipo. Se necesitan 9 pistas en bucle, de 2 a 3 minutos, en OGG o M4A:

| Pista | Uso | Ambiente |
|---|---|---|
| `title` | Menú | Melancólica, esperanzadora |
| `city` | Misiones 1‑3 | Synthwave urbano, urgente |
| `asteroids` | Misiones 4‑5 | Tensa, metálica |
| `crystal` | Misiones 6‑8 | Etérea, con coros |
| `forge` | Misiones 9‑10 | Industrial, pesada |
| `rift` | Misiones 11‑15 | Épica, rápida |
| `boss` | Jefes y mini jefes | Agresiva |
| `room` | Estancias y hangar | Suspense, tic‑tac |
| `ending` | Epílogo | Emotiva: tema de la familia |

Para usarlas hay que añadir un reproductor de archivos en `audio.js`. Es un cambio pequeño y lo hago cuando existan las pistas.

## 5. Voces (opcional, mucho impacto)

Bastan las frases clave, en español y en inglés:
- Teo: «¿Es real?» / «Yo no salgo en tus mapas».
- Lía: «Somos cuatro o no somos ninguno».
- Darío: «Lo valiente es tener miedo y seguir juntos».
- ORDO: todas sus líneas, con voz procesada, unas 20.
- Vex: el ultimátum y el «Me debíais una cena».

## 6. Para la tienda

- **Tráiler de 30 segundos:** el guion está en `STORE.md`.
- **Capturas:** el juego tiene un modo de prueba (`Exodo2942-prueba-estancias.html`) que permite ir directo a cualquier misión, estancia o jefe para capturarlo.

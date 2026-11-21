# Protocolo Ceniza

Juego de infiltración y supervivencia en 3D para el navegador, con 20 misiones y una historia continua.

Isla Sólveig, Atlántico Norte, noviembre de 2011. La agente SÍLEX, de una unidad que oficialmente no existe, se infiltra en el Complejo Thule-7 de Halden Biosystems. Allí se ha escapado CENIZA, un hongo que convierte a las personas en huéspedes agresivos. Una compañía militar privada vigila la isla mientras su coronel intenta vender la cepa.

## Cómo jugar

Abre `index.html` en un navegador moderno de escritorio (Chrome, Edge o Firefox). Three.js se carga desde jsDelivr, así que hace falta conexión a internet.

| Acción | Tecla |
| --- | --- |
| Moverse | W A S D |
| Disparar hacia donde mira Sílex (con puntería asistida) | Clic |
| Acción: activar objetivos, neutralizar guardias, cuchillo | E |
| Agacharse (silencio, menos visibilidad) | C |
| Correr · cambiar arma · linterna · pausa · música | Mayús · Q · F · Esc · M |

La recarga y los botiquines funcionan solos cuando hace falta (también con R y H).

En pantallas táctiles aparecen dos joysticks y botones.

## Mecánicas

- **Sigilo:** los guardias ven en un cono (visible en el suelo y en el radar) y reaccionan con sospecha («?») antes de la alerta («!»). La alerta pasa a evasión y después a precaución. Los cuerpos encontrados ponen en guardia al resto.
- **Ruido:** cada disparo, carrera o generador emite un anillo de ruido. La pistola lleva silenciador; la escopeta no.
- **Horror:** los infectados ven poco pero oyen todo, y la linterna los atrae. Hay variantes rápidas y gigantes, y en algunas zonas están latentes hasta que algo los despierta.
- **Facciones:** los mercenarios y los infectados también se atacan entre sí.
- **Misiones variadas:** infiltración, sabotaje, recogida de pruebas, C4, escolta, defensa contra oleadas, jefe final y huida contrarreloj.
- **Música:** banda sonora de misterio generada en tiempo real (cajita de música en el título, temas distintos para exteriores, laboratorios e interiores) que cede el paso a la música de acción durante las alertas.
- **Rangos:** cada misión termina con un rango (S–D) según alertas, bajas, daño y tiempo. El progreso se guarda en el navegador.

## Desarrollo

El código fuente está en `src/` y se compila en un único `index.html`:

```sh
node build.mjs
```

- `src/story.js`: guion, diálogos y diseño de las 20 misiones.
- `src/world.js`: temas visuales, generación de mapas y construcción 3D.
- `src/actors.js`: modelos articulados y animación.
- `src/main.js`: render, IA, combate, objetivos e interfaz.
- `src/textures.js` y `src/audio.js`: texturas y sonido 100 % procedurales (no hay archivos externos).

Los gráficos usan Three.js con sombras dinámicas de la linterna, iluminación por zonas, materiales PBR con mapas normales generados, niebla, partículas, bloom, aberración cromática, grano de película y viñeteado.

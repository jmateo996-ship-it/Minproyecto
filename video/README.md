# Vídeo: GTA 6 — Todo lo que sabemos (fan-made, no oficial)

- `gta6_todo_lo_que_sabemos.mp4` — vídeo final (1920x1080, 30 fps, ~1:38).
- `guion.md` — guion completo, escena a escena, con fuentes.
- `imagenes/` — fondos originales generados por código.
- `build.py` — genera todo desde cero: imágenes, voz, música y montaje.

## Regenerar
```bash
sudo apt-get install -y ffmpeg espeak-ng mbrola mbrola-es2
pip install pillow numpy
python3 video/build.py salida/
```
No tiene relación con Rockstar Games ni con Take-Two. No se usan logotipos, capturas, música ni arte oficial.

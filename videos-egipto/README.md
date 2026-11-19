# Historia del Antiguo Egipto — serie de vídeos narrados

Cinco episodios (≈1,5 min cada uno, 1280×720) con voz en off en español,
subtítulos, ilustraciones y música ambiental.

| Ep. | Título | Contenido |
|-----|--------|-----------|
| 1 | El don del Nilo | El Nilo, Kemet y Deshret, Narmer y la unificación, los jeroglíficos |
| 2 | La era de las pirámides | Zoser e Imhotep, Keops y Guiza, la Esfinge, el Primer Período Intermedio |
| 3 | Faraones guerreros | Imperio Medio, hicsos, Hatshepsut, Akenatón, Tutankamón, Ramsés II |
| 4 | Dioses y vida eterna | Ra, Osiris, Isis, Horus, el juicio de Maat, momificación, vida cotidiana |
| 5 | El ocaso de los faraones | Alejandro Magno, Alejandría, los Ptolomeos, Rosetta, Cleopatra y Roma |

Los vídeos están en `videos/`.

## Regenerarlos

```bash
apt-get install -y ffmpeg espeak-ng mbrola mbrola-es4
pip install pillow
python3 generar.py videos          # todos
python3 generar.py videos 03       # solo el episodio 3
```

- `guion.py` — texto narrado de cada escena (edítalo para cambiar la historia).
- `arte.py` — ilustraciones generadas por código.
- `generar.py` — síntesis de voz (espeak-ng + MBROLA), subtítulos, zoom y montaje con ffmpeg.

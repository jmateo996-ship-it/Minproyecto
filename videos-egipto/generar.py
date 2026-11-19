# -*- coding: utf-8 -*-
"""Genera los vídeos narrados de la serie "Historia del Antiguo Egipto".

Requisitos: ffmpeg, espeak-ng, mbrola y la voz mbrola-es4, Pillow.
    apt-get install -y ffmpeg espeak-ng mbrola mbrola-es4
    pip install pillow

Uso:  python3 generar.py [salida] [ids...]
      python3 generar.py salida 01 03   # solo episodios 1 y 3
"""
import os
import re
import subprocess
import sys
import wave

import arte
from guion import EPISODIOS

VOZ_ESPEAK = "mb-es4"
VOZ_MBROLA = "/usr/share/mbrola/es4/es4"
VELOCIDAD = 135          # palabras por minuto
TONO = 42
PAUSA_FRASE = 0.55       # segundos
PAUSA_ESCENA = 1.0
FPS = 25
RES = (1280, 720)
SR = 16000

# Difonos que la voz es4 no tiene: los sustituimos por equivalentes cercanos.
REEMPLAZOS = {"j": "i", "w": "u", "R2": "rr", ";": None}


def run(cmd, **kw):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, **kw)


def sintetizar(texto, ruta):
    """Texto -> fonemas (espeak-ng) -> corrige -> audio (mbrola)."""
    pho = subprocess.run(
        ["espeak-ng", "-v", VOZ_ESPEAK, "-s", str(VELOCIDAD), "-p", str(TONO), "-q", "--pho", texto],
        check=True, capture_output=True, text=True).stdout
    lineas = []
    for ln in pho.splitlines():
        partes = ln.split("\t")
        if partes and partes[0] in REEMPLAZOS:
            nuevo = REEMPLAZOS[partes[0]]
            if nuevo is None:
                continue
            partes[0] = nuevo
        lineas.append("\t".join(partes))
    pho_path = ruta + ".pho"
    with open(pho_path, "w") as f:
        f.write("\n".join(lineas) + "\n")
    crudo = ruta + ".raw.wav"
    run(["mbrola", "-e", VOZ_MBROLA, pho_path, crudo])
    # normaliza a 16 kHz mono, con un toque de eco de sala para darle cuerpo
    run(["ffmpeg", "-y", "-i", crudo, "-af",
         "highpass=f=70,aecho=0.8:0.5:40:0.12,loudnorm=I=-18:TP=-2",
         "-ar", str(SR), "-ac", "1", ruta])
    os.remove(pho_path)
    os.remove(crudo)
    return duracion(ruta)


def duracion(ruta):
    with wave.open(ruta) as w:
        return w.getnframes() / w.getframerate()


def silencio(ruta, seg):
    run(["ffmpeg", "-y", "-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=mono", "-t", f"{seg:.3f}", ruta])


def ts(s):
    h = int(s // 3600)
    m = int(s % 3600 // 60)
    return f"{h}:{m:02d}:{s % 60:05.2f}"


def partir(texto, max_chars=58):
    """Divide una frase larga en líneas de subtítulo de dos en dos."""
    palabras, lineas, act = texto.split(), [], ""
    for p in palabras:
        if len(act) + len(p) + 1 > max_chars and act:
            lineas.append(act)
            act = p
        else:
            act = (act + " " + p).strip()
    lineas.append(act)
    bloques = []
    for i in range(0, len(lineas), 2):
        bloques.append(lineas[i:i + 2])
    return bloques


def episodio(ep, salida):
    tmp = os.path.join(salida, f"tmp_{ep['id']}")
    os.makedirs(tmp, exist_ok=True)
    audios, subs, escenas_video = [], [], []
    t = 0.0

    def añadir_audio(ruta, d):
        nonlocal t
        audios.append(ruta)
        t += d

    # --- portada ---
    portada = os.path.join(tmp, "portada.jpg")
    arte.portada(ep["titulo"], ep["subtitulo"], ep["id"], portada)
    sil = os.path.join(tmp, "sil_frase.wav")
    silencio(sil, PAUSA_FRASE)
    sil_esc = os.path.join(tmp, "sil_escena.wav")
    silencio(sil_esc, PAUSA_ESCENA)
    sil_ini = os.path.join(tmp, "sil_ini.wav")
    silencio(sil_ini, 1.2)

    inicio = t
    añadir_audio(sil_ini, 1.2)
    intro = f"Historia del Antiguo Egipto. Episodio {int(ep['id'])}. {ep['titulo']}."
    a = os.path.join(tmp, "intro.wav")
    añadir_audio(a, sintetizar(intro, a))
    añadir_audio(sil_esc, PAUSA_ESCENA)
    escenas_video.append((portada, t - inicio))

    # --- escenas ---
    for i, (nombre, frases) in enumerate(ep["escenas"]):
        img = os.path.join(tmp, f"esc_{i:02d}.jpg")
        arte.render(nombre, img)
        inicio = t
        for j, frase in enumerate(frases):
            a = os.path.join(tmp, f"v_{i:02d}_{j:02d}.wav")
            d = sintetizar(frase, a)
            # reparte el tiempo de la frase entre sus bloques de subtítulo
            bloques = partir(frase)
            total = sum(len(" ".join(b)) for b in bloques)
            t0 = t
            for b in bloques:
                dur = d * len(" ".join(b)) / total
                subs.append((t0, t0 + dur, b))
                t0 += dur
            añadir_audio(a, d)
            añadir_audio(sil, PAUSA_FRASE)
        añadir_audio(sil_esc, PAUSA_ESCENA)
        escenas_video.append((img, t - inicio))

    # cierre
    cierre = os.path.join(tmp, "cierre.jpg")
    arte.portada(ep["titulo"], "Gracias por ver este episodio", ep["id"], cierre)
    añadir_audio(sil_esc, 2.5)  # el archivo dura 1 s; el vídeo se alarga con apad
    escenas_video.append((cierre, 2.5))
    total = t

    # --- audio: concatenación de voz ---
    lista = os.path.join(tmp, "audios.txt")
    with open(lista, "w") as f:
        for a in audios:
            f.write(f"file '{os.path.abspath(a)}'\n")
    voz = os.path.join(tmp, "voz.wav")
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", lista, "-c", "copy", voz])

    # --- vídeo: un clip por escena con zoom lento (Ken Burns) ---
    clips = []
    for k, (img, d) in enumerate(escenas_video):
        n = max(1, int(round(d * FPS)))
        clip = os.path.join(tmp, f"clip_{k:02d}.mp4")
        modos = [
            ("1+0.06*on/{n}", "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"),
            ("1.06-0.06*on/{n}", "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"),
            ("1.06", "(iw-iw/zoom)*on/{n}", "ih/2-(ih/zoom/2)"),
            ("1.06", "(iw-iw/zoom)*(1-on/{n})", "ih/2-(ih/zoom/2)"),
        ]
        z, x, y = (s.format(n=n) for s in modos[k % len(modos)])
        vf = (f"scale=2560:1440,zoompan=z='{z}':x='{x}':y='{y}':d={n}:s={RES[0]}x{RES[1]}:fps={FPS},"
              f"fade=t=in:st=0:d=0.5,fade=t=out:st={max(0, n / FPS - 0.5):.2f}:d=0.5,format=yuv420p")
        run(["ffmpeg", "-y", "-i", img, "-vf", vf, "-frames:v", str(n), "-c:v", "libx264",
             "-preset", "veryfast", "-crf", "20", clip])
        clips.append(clip)
    lista_v = os.path.join(tmp, "clips.txt")
    with open(lista_v, "w") as f:
        for c in clips:
            f.write(f"file '{os.path.abspath(c)}'\n")
    mudo = os.path.join(tmp, "mudo.mp4")
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", lista_v, "-c", "copy", mudo])

    # --- subtítulos ASS ---
    ass = os.path.join(tmp, "subs.ass")
    with open(ass, "w", encoding="utf-8") as f:
        f.write(f"""[Script Info]
ScriptType: v4.00+
PlayResX: {RES[0]}
PlayResY: {RES[1]}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,DejaVu Serif,34,&H00E6F5FA,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2.5,1.5,2,60,60,42,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
""")
        for a, b, lineas in subs:
            texto = "\\N".join(lineas)
            f.write(f"Dialogue: 0,{ts(a)},{ts(b)},Default,,0,0,0,,{texto}\n")

    # --- música ambiental sintetizada (drone en modo frigio) ---
    musica = ("0.10*sin(2*PI*73.42*t)*(0.7+0.3*sin(2*PI*0.07*t))"
              "+0.06*sin(2*PI*110*t)*(0.6+0.4*sin(2*PI*0.05*t+1))"
              "+0.04*sin(2*PI*146.83*t)*(0.5+0.5*sin(2*PI*0.11*t+2))"
              "+0.025*sin(2*PI*155.56*t)*(0.5+0.5*sin(2*PI*0.031*t+4))")

    final = os.path.join(salida, f"Egipto_{ep['id']}_{slug(ep['titulo'])}.mp4")
    ass_esc = ass.replace("\\", "/").replace(":", "\\:")
    run(["ffmpeg", "-y", "-i", mudo, "-i", voz,
         "-f", "lavfi", "-t", f"{total:.2f}", "-i", f"aevalsrc={musica}:s=44100",
         "-filter_complex",
         f"[0:v]subtitles='{ass_esc}'[v];"
         f"[1:a]aresample=44100,apad[vz];"
         f"[2:a]lowpass=f=900,afade=t=in:d=3,afade=t=out:st={max(0, total - 4):.2f}:d=4,volume=0.55[m];"
         f"[vz][m]amix=inputs=2:duration=shortest:normalize=0,alimiter=limit=0.95[a]",
         "-map", "[v]", "-map", "[a]", "-t", f"{total:.2f}",
         "-c:v", "libx264", "-preset", "medium", "-crf", "23", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", final])
    return final, total


def slug(s):
    s = s.lower()
    for a, b in zip("áéíóúñü", "aeiounu"):
        s = s.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "_", s).strip("_")


if __name__ == "__main__":
    salida = sys.argv[1] if len(sys.argv) > 1 else "salida"
    ids = sys.argv[2:]
    os.makedirs(salida, exist_ok=True)
    for ep in EPISODIOS:
        if ids and ep["id"] not in ids:
            continue
        ruta, dur = episodio(ep, salida)
        print(f"{ruta}  ({dur / 60:.1f} min)", flush=True)

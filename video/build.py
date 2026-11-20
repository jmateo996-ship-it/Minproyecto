#!/usr/bin/env python3
"""Genera el vídeo "GTA 6: Todo lo que sabemos" (fan-made, no oficial).

Pasos: imágenes originales (PIL/numpy) -> voz (espeak-ng + MBROLA) ->
música sintetizada (numpy) -> montaje con ffmpeg (zoom, fundidos, subtítulos).

Requisitos: python3, pillow, numpy, ffmpeg, espeak-ng, mbrola-es2.
Uso: python3 build.py [directorio_salida]
"""
import math
import random
import subprocess
import sys
import textwrap
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1920, 1080
BW, BH = 2400, 1350  # fondo más grande para el zoom lento
FPS = 30
OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "build")
OUT.mkdir(parents=True, exist_ok=True)

FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def font(size, bold=True):
    return ImageFont.truetype(FB if bold else FR, size)


SCENES = [
    ("intro", "Ha sido la espera más larga de la historia de los videojuegos. "
     "Más de diez años después de su antecesor, por fin hablamos de GTA seis. "
     "Esto es todo lo que tienes que saber."),
    ("fecha", "La fecha marcada en rojo es el diecinueve de noviembre de dos mil veintiséis. "
     "Llega a PlayStation cinco y a Xbox Series equis y ese."),
    ("retrasos", "Pero el camino no ha sido fácil. Primero se anunció para otoño de dos mil veinticinco. "
     "Después se retrasó a mayo de dos mil veintiséis. Y finalmente, a noviembre. "
     "Rockstar pidió más tiempo para pulir cada detalle."),
    ("mapa", "La historia nos lleva al estado de Leonida, una versión ficticia de Florida. "
     "Y en su corazón, una ciudad que los veteranos conocen bien: Vice City. "
     "Playas, pantanos, autopistas y mucho neón."),
    ("duo", "Por primera vez en la saga principal tendremos una pareja protagonista: Lucía y Jasón. "
     "Dos criminales que, tras un golpe que sale mal, se ven atrapados en una conspiración "
     "que recorre todo Leonida."),
    ("trailers", "Sus tráilers han roto récords. El primero, publicado en diciembre de dos mil veintitrés, "
     "superó los noventa millones de visualizaciones en YouTube en solo veinticuatro horas. "
     "El segundo llegó en mayo de dos mil veinticinco y volvió a arrasar."),
    ("pc", "¿Y los jugadores de PC? De momento, no hay fecha confirmada. "
     "Como ya pasó con entregas anteriores, todo apunta a que tendrán que esperar algo más."),
    ("outro", "Vice City vuelve a abrir sus puertas. ¿Lo vas a jugar el primer día? "
     "Déjalo en los comentarios, y nos vemos en Leonida."),
]

# Subtítulos (texto escrito, con cifras) por escena: lista de frases
SUBS = {
    "intro": ["La espera más larga de la historia de los videojuegos.",
              "Más de 10 años después de su antecesor, llega GTA 6.",
              "Esto es todo lo que tienes que saber."],
    "fecha": ["La fecha marcada en rojo: 19 de noviembre de 2026.",
              "Llega a PlayStation 5 y Xbox Series X|S."],
    "retrasos": ["Pero el camino no ha sido fácil.",
                 "Primero: otoño de 2025. Después: mayo de 2026.",
                 "Y finalmente, noviembre.",
                 "Rockstar pidió más tiempo para pulir cada detalle."],
    "mapa": ["El estado de Leonida, una versión ficticia de Florida.",
             "Y en su corazón: Vice City.",
             "Playas, pantanos, autopistas y mucho neón."],
    "duo": ["Por primera vez, una pareja protagonista: Lucía y Jason.",
            "Un golpe que sale mal...",
            "...y una conspiración que recorre todo Leonida."],
    "trailers": ["Sus tráilers han roto récords.",
                 "Tráiler 1 (dic. 2023): +90 millones de vistas en 24 h.",
                 "El tráiler 2 (mayo 2025) volvió a arrasar."],
    "pc": ["¿Y en PC? De momento, sin fecha confirmada.",
           "Todo apunta a que tocará esperar algo más."],
    "outro": ["Vice City vuelve a abrir sus puertas.",
              "¿Lo vas a jugar el primer día? Déjalo en los comentarios.",
              "Nos vemos en Leonida."],
}

# ---------------------------------------------------------------- imágenes
PINK = (255, 60, 150)
ORANGE = (255, 140, 60)
CYAN = (40, 220, 255)
PURPLE = (60, 20, 90)
NIGHT = (10, 6, 30)


def vgrad(w, h, stops):
    """Degradado vertical. stops: lista de (pos 0..1, (r,g,b))."""
    ys = np.linspace(0, 1, h)[:, None]
    img = np.zeros((h, w, 3), np.float32)
    for c in range(3):
        xs = [s[0] for s in stops]
        vs = [s[1][c] for s in stops]
        img[:, :, c] = np.interp(ys, xs, vs)
    return Image.fromarray(img.clip(0, 255).astype(np.uint8))


def sun(img, cx, cy, r, stripes=True):
    sz = r * 2
    g = vgrad(sz, sz, [(0, (255, 230, 120)), (0.55, ORANGE), (1, PINK)])
    mask = Image.new("L", (sz, sz), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse([0, 0, sz - 1, sz - 1], fill=255)
    if stripes:
        for i in range(7):
            y = int(sz * (0.55 + i * 0.065))
            md.rectangle([0, y, sz, y + 4 + i * 2], fill=0)
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([cx - r * 1.5, cy - r * 1.5, cx + r * 1.5, cy + r * 1.5], fill=(255, 90, 140, 90))
    glow = glow.filter(ImageFilter.GaussianBlur(r * 0.4))
    img.alpha_composite(glow)
    img.paste(g, (cx - r, cy - r), mask)


def palm(d, x, base, height, lean, color=(15, 5, 25)):
    pts = []
    top = (x + lean, base - height)
    for i in range(21):
        t = i / 20
        px = x + lean * (t ** 1.6)
        py = base - height * t
        wdt = 22 * (1 - t) + 7
        pts.append((px, py, wdt))
    left = [(p[0] - p[2] / 2, p[1]) for p in pts]
    right = [(p[0] + p[2] / 2, p[1]) for p in reversed(pts)]
    d.polygon(left + right, fill=color)
    tx, ty = top
    for ang in [-170, -140, -110, -70, -40, -10, 20, 200, 160]:
        a = math.radians(ang)
        ln = height * random.uniform(0.32, 0.42)
        frond = []
        for i in range(12):
            t = i / 11
            fx = tx + math.cos(a) * ln * t
            fy = ty + math.sin(a) * ln * t + (ln * 0.45) * t * t
            frond.append((fx, fy))
        upper = [(fx, fy - 14 * math.sin(math.pi * i / 11)) for i, (fx, fy) in enumerate(frond)]
        d.polygon(upper + list(reversed(frond)), fill=color)
        d.line(frond, fill=color, width=6)


def skyline(d, base, rng, color=(20, 8, 40), windows=True, w=BW):
    x = 0
    while x < w:
        bw = rng.randint(60, 170)
        bh = rng.randint(120, 520)
        d.rectangle([x, base - bh, x + bw, base], fill=color)
        if rng.random() < 0.25:
            d.rectangle([x + bw // 2 - 3, base - bh - 60, x + bw // 2 + 3, base - bh], fill=color)
        if windows:
            for wy in range(base - bh + 16, base - 10, 22):
                for wx in range(x + 10, x + bw - 12, 18):
                    if rng.random() < 0.35:
                        c = rng.choice([(255, 210, 120), CYAN, (255, 120, 200)])
                        d.rectangle([wx, wy, wx + 7, wy + 10], fill=c)
        x += bw + rng.randint(4, 20)


def bg_sunset(seed=1, night=False):
    random.seed(seed)
    rng = random.Random(seed)
    if night:
        sky = vgrad(BW, BH, [(0, (5, 3, 20)), (0.5, (40, 10, 70)), (0.7, (120, 30, 110)), (1, (20, 5, 40))])
    else:
        sky = vgrad(BW, BH, [(0, (30, 10, 70)), (0.35, (150, 40, 130)), (0.6, (255, 110, 90)), (1, (40, 10, 60))])
    img = sky.convert("RGBA")
    d = ImageDraw.Draw(img)
    if night:
        for _ in range(250):
            sx, sy = rng.randint(0, BW), rng.randint(0, int(BH * 0.5))
            b = rng.randint(120, 255)
            d.point((sx, sy), fill=(b, b, b))
    horizon = int(BH * 0.66)
    sun(img, BW // 2, horizon - 40, 330 if not night else 260)
    d = ImageDraw.Draw(img)
    skyline(d, horizon, rng, color=(35, 10, 55) if not night else (15, 5, 35), windows=night)
    # mar con reflejos
    sea = vgrad(BW, BH - horizon, [(0, (90, 30, 110)), (1, (10, 5, 30))]).convert("RGBA")
    img.paste(sea, (0, horizon))
    d = ImageDraw.Draw(img)
    for i in range(60):
        y = horizon + 8 + int((i / 60) ** 1.5 * (BH - horizon))
        half = int(300 * (1 - i / 70)) + rng.randint(-40, 40)
        d.line([BW // 2 - half, y, BW // 2 + half, y], fill=(255, 150, 120, 140), width=3)
    # palmeras
    palm(d, 220, BH + 20, 1000, 160)
    palm(d, 420, BH + 40, 760, 90)
    palm(d, BW - 260, BH + 20, 980, -170)
    palm(d, BW - 500, BH + 40, 700, -70)
    return img.convert("RGB")


def bg_grid():
    img = vgrad(BW, BH, [(0, NIGHT), (0.55, PURPLE), (1, (20, 5, 40))]).convert("RGBA")
    d = ImageDraw.Draw(img)
    hor = int(BH * 0.55)
    for i in range(-30, 31):
        d.line([BW / 2 + i * 40, hor, BW / 2 + i * 260, BH], fill=(255, 60, 170, 160), width=2)
    for k in range(1, 22):
        y = hor + (BH - hor) * (k / 21) ** 2
        d.line([0, y, BW, y], fill=(255, 60, 170, 160), width=2)
    sun(img, BW // 2, hor - 10, 200)
    return img.convert("RGB")


def bg_map():
    img = vgrad(BW, BH, [(0, (5, 30, 60)), (1, (5, 10, 35))]).convert("RGBA")
    d = ImageDraw.Draw(img)
    # cuadrícula náutica
    for x in range(0, BW, 80):
        d.line([x, 0, x, BH], fill=(40, 120, 160, 60))
    for y in range(0, BH, 80):
        d.line([0, y, BW, y], fill=(40, 120, 160, 60))
    # península inventada
    rng = random.Random(7)
    cx, cy = BW * 0.5, BH * 0.5
    pts = []
    base_shape = [(0.30, 0.08), (0.62, 0.06), (0.66, 0.30), (0.70, 0.55), (0.64, 0.80),
                  (0.56, 0.93), (0.50, 0.86), (0.46, 0.62), (0.38, 0.40), (0.26, 0.30), (0.24, 0.15)]
    for i in range(len(base_shape)):
        a, b = base_shape[i], base_shape[(i + 1) % len(base_shape)]
        for t in np.linspace(0, 1, 18, endpoint=False):
            x = (a[0] + (b[0] - a[0]) * t) * BW + rng.uniform(-12, 12)
            y = (a[1] + (b[1] - a[1]) * t) * BH + rng.uniform(-12, 12)
            pts.append((x, y))
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(glow).polygon(pts, fill=(40, 220, 255, 120))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(25)))
    d = ImageDraw.Draw(img)
    d.polygon(pts, fill=(30, 70, 60), outline=CYAN)
    d.line(pts + [pts[0]], fill=CYAN, width=5)
    # pantanos
    for _ in range(40):
        x = rng.uniform(0.50, 0.62) * BW
        y = rng.uniform(0.50, 0.80) * BH
        r = rng.uniform(10, 30)
        d.ellipse([x - r, y - r * 0.6, x + r, y + r * 0.6], fill=(40, 110, 80))
    # autopistas
    d.line([(0.40 * BW, 0.15 * BH), (0.52 * BW, 0.45 * BH), (0.60 * BW, 0.78 * BH)], fill=(255, 200, 90), width=6)
    d.line([(0.28 * BW, 0.22 * BH), (0.63 * BW, 0.22 * BH)], fill=(255, 200, 90), width=6)
    # ciudad (punto brillante)
    vx, vy = 0.655 * BW, 0.70 * BH
    for r, a in [(120, 40), (70, 90), (35, 200)]:
        g = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(g).ellipse([vx - r, vy - r, vx + r, vy + r], fill=PINK + (a,))
        img.alpha_composite(g.filter(ImageFilter.GaussianBlur(r / 3)))
    d = ImageDraw.Draw(img)
    d.ellipse([vx - 14, vy - 14, vx + 14, vy + 14], fill=(255, 255, 255))
    d.text((vx + 40, vy - 40), "VICE CITY", font=font(64), fill=(255, 255, 255))
    d.text((0.31 * BW, 0.12 * BH), "LEONIDA", font=font(110), fill=(255, 255, 255, 230))
    return img.convert("RGB")


def silhouette(d, cx, base, scale, color, long_hair=False):
    s = scale
    d.ellipse([cx - 55 * s, base - 520 * s, cx + 55 * s, base - 400 * s], fill=color)  # cabeza
    if long_hair:
        d.polygon([(cx - 60 * s, base - 470 * s), (cx + 60 * s, base - 470 * s),
                   (cx + 75 * s, base - 330 * s), (cx - 75 * s, base - 330 * s)], fill=color)
    d.rectangle([cx - 22 * s, base - 410 * s, cx + 22 * s, base - 370 * s], fill=color)  # cuello
    d.ellipse([cx - 160 * s, base - 390 * s, cx + 160 * s, base - 250 * s], fill=color)  # hombros
    d.polygon([(cx - 160 * s, base - 320 * s), (cx + 160 * s, base - 320 * s),
               (cx + 180 * s, base), (cx - 180 * s, base)], fill=color)  # torso


def bg_duo():
    img = bg_grid().convert("RGBA")
    d = ImageDraw.Draw(img)
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    silhouette(gd, BW * 0.36, BH, 2.0, PINK + (255,), long_hair=True)
    silhouette(gd, BW * 0.64, BH, 2.0, CYAN + (255,))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(28)))
    d = ImageDraw.Draw(img)
    silhouette(d, BW * 0.36, BH, 2.0, (12, 4, 22), long_hair=True)
    silhouette(d, BW * 0.64, BH, 2.0, (12, 4, 22))
    return img.convert("RGB")


def bg_trailers():
    img = vgrad(BW, BH, [(0, (20, 5, 30)), (1, (70, 10, 60))]).convert("RGBA")
    d = ImageDraw.Draw(img)
    rng = random.Random(3)
    for _ in range(90):  # bokeh
        x, y, r = rng.randint(0, BW), rng.randint(0, BH), rng.randint(20, 90)
        c = rng.choice([PINK, CYAN, ORANGE])
        b = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(b).ellipse([x - r, y - r, x + r, y + r], fill=c + (50,))
        img.alpha_composite(b.filter(ImageFilter.GaussianBlur(8)))
    d = ImageDraw.Draw(img)
    cx, cy = BW // 2, int(BH * 0.40)
    g = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(g).ellipse([cx - 190, cy - 190, cx + 190, cy + 190], outline=CYAN + (255,), width=30)
    img.alpha_composite(g.filter(ImageFilter.GaussianBlur(20)))
    d = ImageDraw.Draw(img)
    d.ellipse([cx - 180, cy - 180, cx + 180, cy + 180], outline=(255, 255, 255), width=14)
    d.polygon([(cx - 55, cy - 95), (cx - 55, cy + 95), (cx + 100, cy)], fill=PINK)
    t = "+90.000.000"
    f = font(170)
    tw = d.textlength(t, font=f)
    d.text((cx - tw / 2, cy + 230), t, font=f, fill=(255, 255, 255))
    t2 = "visualizaciones en 24 horas"
    f2 = font(70, False)
    d.text((cx - d.textlength(t2, font=f2) / 2, cy + 430), t2, font=f2, fill=(255, 200, 230))
    return img.convert("RGB")


def card(lines, sub=None, base=None):
    img = (base or bg_grid()).convert("RGBA")
    ov = Image.new("RGBA", img.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    cw, ch = 1300, 720
    x0, y0 = (BW - cw) // 2, (BH - ch) // 2 - 60
    od.rounded_rectangle([x0, y0, x0 + cw, y0 + ch], 50, fill=(10, 5, 25, 215), outline=PINK + (255,), width=8)
    img.alpha_composite(ov)
    d = ImageDraw.Draw(img)
    y = y0 + 70
    for text, size, color in lines:
        f = font(size)
        tw = d.textlength(text, font=f)
        d.text(((BW - tw) / 2, y), text, font=f, fill=color)
        y += int(size * 1.25)
    return img.convert("RGB")


def bg_timeline():
    img = bg_grid().convert("RGBA")
    d = ImageDraw.Draw(img)
    y = int(BH * 0.30)
    x0, x1 = 420, BW - 420
    d.line([x0, y, x1, y], fill=(255, 255, 255), width=10)
    items = [("OTOÑO 2025", "Primer plan", (150, 150, 170), True),
             ("MAYO 2026", "Retraso #1", (150, 150, 170), True),
             ("19 NOV 2026", "Fecha final", PINK, False)]
    for i, (lab, sub, col, crossed) in enumerate(items):
        x = x0 + (x1 - x0) * (i + 0.5) / 3
        d.ellipse([x - 40, y - 40, x + 40, y + 40], fill=col, outline=(255, 255, 255), width=6)
        f = font(64)
        tw = d.textlength(lab, font=f)
        d.text((x - tw / 2, y - 150), lab, font=f, fill=(255, 255, 255))
        if crossed:
            d.line([x - tw / 2 - 10, y - 112, x + tw / 2 + 10, y - 112], fill=(255, 60, 90), width=10)
        f2 = font(56, False)
        d.text((x - d.textlength(sub, font=f2) / 2, y + 80), sub, font=f2, fill=(230, 220, 255))
    return img.convert("RGB")


def make_backgrounds():
    bgs = {
        "intro": bg_sunset(1),
        "fecha": card([("PRÓXIMO LANZAMIENTO", 70, (255, 200, 230)),
                       ("19", 300, (255, 255, 255)),
                       ("NOVIEMBRE 2026", 110, PINK),
                       ("PS5  ·  XBOX SERIES X|S", 64, CYAN)], base=bg_sunset(2)),
        "retrasos": bg_timeline(),
        "mapa": bg_map(),
        "duo": bg_duo(),
        "trailers": bg_trailers(),
        "pc": card([("VERSIÓN PC", 120, (255, 255, 255)),
                    ("SIN FECHA", 170, PINK),
                    ("CONFIRMADA", 120, (255, 255, 255)),
                    ("(todo apunta a más adelante)", 56, CYAN)]),
        "outro": bg_sunset(5, night=True),
    }
    for k, im in bgs.items():
        im.save(OUT / f"bg_{k}.png")


def title_overlay(top, bottom):
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    f1, f2 = font(150), font(60)
    for text, f, y, col in [(top, f1, 250, (255, 255, 255)), (bottom, f2, 440, (255, 220, 240))]:
        tw = d.textlength(text, font=f)
        d.text(((W - tw) / 2 + 6, y + 6), text, font=f, fill=(255, 40, 140, 200))
        d.text(((W - tw) / 2, y), text, font=f, fill=col)
    return ov


def sub_overlay(text, extra=None):
    ov = extra.copy() if extra else Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    f = font(48)
    lines = textwrap.wrap(text, 52)
    lh = 62
    y = H - 70 - lh * len(lines)
    maxw = max(d.textlength(l, font=f) for l in lines)
    d.rounded_rectangle([(W - maxw) / 2 - 30, y - 18, (W + maxw) / 2 + 30, y + lh * len(lines) + 8], 18,
                        fill=(0, 0, 0, 160))
    for l in lines:
        tw = d.textlength(l, font=f)
        d.text(((W - tw) / 2, y), l, font=f, fill=(255, 255, 255), stroke_width=2, stroke_fill=(0, 0, 0))
        y += lh
    # marca de agua discreta
    d.text((40, 30), "FAN-MADE · NO OFICIAL", font=font(26, False), fill=(255, 255, 255, 150))
    return ov


# ---------------------------------------------------------------- audio
SR = 22050


def tts(text, path):
    subprocess.run(["espeak-ng", "-v", "mb-es2", "-s", "155", "-p", "45", "-g", "3", "-w", str(path), text],
                   check=True, stderr=subprocess.DEVNULL)


def wav_dur(path):
    with wave.open(str(path)) as w:
        return w.getnframes() / w.getframerate()


def music(seconds, path):
    """Pista synthwave original: bajo en corcheas, pad, bombo y caja."""
    sr = 44100
    n = int(seconds * sr)
    t = np.arange(n) / sr
    bpm = 100
    beat = 60 / bpm
    out = np.zeros(n)
    prog = [45, 41, 36, 43]  # La, Fa, Do, Sol (MIDI)

    def hz(m):
        return 440 * 2 ** ((m - 69) / 12)

    bar = beat * 4
    for bi in range(int(seconds / bar) + 1):
        root = prog[bi % 4]
        s0 = bi * bar
        # pad (acorde) con envolvente suave
        i0, i1 = int(s0 * sr), min(n, int((s0 + bar) * sr))
        if i0 >= n:
            break
        tt = t[i0:i1] - s0
        env = np.minimum(1, tt / 0.4) * np.minimum(1, (bar - tt) / 0.4)
        for iv in [12, 16 if root in (36, 41) else 15, 19]:
            f = hz(root + iv)
            out[i0:i1] += 0.05 * env * (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 1.005 * tt))
        # bajo en corcheas
        for k in range(8):
            st = s0 + k * beat / 2
            j0, j1 = int(st * sr), min(n, int((st + beat / 2) * sr))
            if j0 >= n:
                break
            tb = t[j0:j1] - st
            f = hz(root + (12 if k % 2 else 0))
            saw = 2 * ((f * tb) % 1) - 1
            out[j0:j1] += 0.12 * saw * np.exp(-tb * 6)
        # batería
        for k in range(4):
            st = s0 + k * beat
            j0 = int(st * sr)
            L = int(0.25 * sr)
            j1 = min(n, j0 + L)
            if j0 >= n:
                break
            tk = t[j0:j1] - st
            kick = np.sin(2 * np.pi * (50 + 120 * np.exp(-tk * 30)) * tk) * np.exp(-tk * 12)
            out[j0:j1] += 0.35 * kick
            if k % 2 == 1:
                noise = np.random.default_rng(bi * 4 + k).uniform(-1, 1, j1 - j0)
                out[j0:j1] += 0.15 * noise * np.exp(-tk * 18)
    fade = int(2.5 * sr)
    out[:fade] *= np.linspace(0, 1, fade)
    out[-fade:] *= np.linspace(1, 0, fade)
    out = out / (np.abs(out).max() + 1e-9) * 0.8
    pcm = (out * 32767).astype(np.int16)
    with wave.open(str(path), "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())


def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


# ---------------------------------------------------------------- montaje
def main():
    print("1/4 Imágenes...")
    make_backgrounds()

    print("2/4 Voz...")
    PAD = 0.6
    durs = {}
    for key, text in SCENES:
        tts(text, OUT / f"vo_{key}.wav")
        durs[key] = wav_dur(OUT / f"vo_{key}.wav") + 2 * PAD

    print("3/4 Clips...")
    XF = 0.8
    clips = []
    for idx, (key, text) in enumerate(SCENES):
        d = durs[key]
        subs = SUBS[key]
        extra = title_overlay("GTA 6", "TODO LO QUE SABEMOS") if key == "intro" else None
        # reparto del tiempo de subtítulos proporcional a su longitud
        total_chars = sum(len(s) for s in subs)
        seg = []
        tcur = PAD
        speak = d - 2 * PAD
        for i, s in enumerate(subs):
            ln = speak * len(s) / total_chars
            p = OUT / f"sub_{key}_{i}.png"
            sub_overlay(s, extra).save(p)
            seg.append((p, tcur if i else 0, tcur + ln if i < len(subs) - 1 else d))
            tcur += ln
        frames = int(d * FPS)
        zin = idx % 2 == 0
        z = f"'min(1+0.0006*on,1.15)'" if zin else f"'max(1.15-0.0006*on,1)'"
        inputs = ["-loop", "1", "-i", str(OUT / f"bg_{key}.png")]
        for p, _, _ in seg:
            inputs += ["-i", str(p)]
        inputs += ["-i", str(OUT / f"vo_{key}.wav")]
        fc = (f"[0:v]scale={BW*2}:{BH*2},zoompan=z={z}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
              f":d={frames}:s={W}x{H}:fps={FPS},format=yuv420p[b0];")
        last = "b0"
        for i, (_, a, b) in enumerate(seg):
            fc += f"[{last}][{i+1}:v]overlay=enable='between(t,{a:.2f},{b:.2f})'[b{i+1}];"
            last = f"b{i+1}"
        ai = len(seg) + 1
        fc += f"[{ai}:a]adelay={int(PAD*1000)},apad,aresample=44100[a]"
        clip = OUT / f"clip_{idx:02d}.mp4"
        run(["ffmpeg", "-y", *inputs, "-filter_complex", fc, "-map", f"[{last}]", "-map", "[a]",
             "-t", f"{d:.3f}", "-r", str(FPS), "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
             "-c:a", "aac", "-ar", "44100", "-ac", "2", str(clip)])
        clips.append((clip, d))
        print(f"   escena {idx+1}/{len(SCENES)} ({key}) {d:.1f}s")

    print("4/4 Montaje final...")
    inputs = []
    for c, _ in clips:
        inputs += ["-i", str(c)]
    fc = ""
    vprev, aprev = "0:v", "0:a"
    offset = 0
    for i in range(1, len(clips)):
        offset += clips[i - 1][1] - XF
        fc += f"[{vprev}][{i}:v]xfade=transition=fade:duration={XF}:offset={offset:.3f}[v{i}];"
        fc += f"[{aprev}][{i}:a]acrossfade=d={XF}[a{i}];"
        vprev, aprev = f"v{i}", f"a{i}"
    total = sum(d for _, d in clips) - XF * (len(clips) - 1)
    music(total + 1, OUT / "music.wav")
    mi = len(clips)
    inputs += ["-i", str(OUT / "music.wav")]
    fc += (f"[{mi}:a]aresample=44100,volume=0.22[m];"
           f"[{aprev}]volume=1.6[vo];[vo][m]amix=inputs=2:duration=first:normalize=0,"
           f"afade=t=out:st={total-1.5:.2f}:d=1.5[aout];"
           f"[{vprev}]fade=t=in:d=0.8,fade=t=out:st={total-1.2:.2f}:d=1.2[vout]")
    final = OUT / "gta6_todo_lo_que_sabemos.mp4"
    run(["ffmpeg", "-y", *inputs, "-filter_complex", fc, "-map", "[vout]", "-map", "[aout]",
         "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(final)])
    print(f"Listo: {final} ({total:.1f}s)")


if __name__ == "__main__":
    main()

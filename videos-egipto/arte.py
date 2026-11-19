# -*- coding: utf-8 -*-
"""Ilustraciones procedurales (PIL) para cada escena de la serie."""
import math
import random

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1920, 1080
SERIF_B = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"

ORO = (222, 176, 74)
ORO_OSC = (150, 105, 35)
ARENA = (226, 186, 120)
ARENA_OSC = (184, 136, 76)
AZUL_NILO = (40, 110, 150)
LAPIS = (30, 60, 130)
TURQ = (40, 160, 160)
NEGRO = (25, 20, 18)
PAPIRO = (232, 214, 170)


def font(size, bold=True):
    return ImageFont.truetype(SERIF_B if bold else SERIF, size)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gradiente(img, top, bottom, y0=0, y1=H):
    d = ImageDraw.Draw(img)
    for y in range(y0, y1):
        d.line([(0, y), (W, y)], fill=lerp(top, bottom, (y - y0) / max(1, y1 - y0)))


def cielo(img, momento="dia"):
    pal = {
        "dia": ((70, 140, 210), (240, 210, 160)),
        "atardecer": ((60, 40, 110), (250, 150, 70)),
        "noche": ((8, 10, 35), (40, 40, 90)),
        "amanecer": ((90, 120, 190), (255, 190, 120)),
    }[momento]
    gradiente(img, pal[0], pal[1], 0, H)
    if momento == "noche":
        d = ImageDraw.Draw(img)
        rnd = random.Random(7)
        for _ in range(300):
            x, y = rnd.randrange(W), rnd.randrange(int(H * 0.7))
            r = rnd.choice([1, 1, 2])
            c = rnd.randrange(170, 255)
            d.ellipse([x, y, x + r, y + r], fill=(c, c, c))


def sol(img, x, y, r, color=(255, 220, 120)):
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)
    for i in range(10, 0, -1):
        rr = r + i * r * 0.25
        g.ellipse([x - rr, y - rr, x + rr, y + rr], fill=color + (int(12 + 4 * (10 - i)),))
    glow = glow.filter(ImageFilter.GaussianBlur(r * 0.4))
    img.alpha_composite(glow) if img.mode == "RGBA" else img.paste(glow, (0, 0), glow)
    ImageDraw.Draw(img).ellipse([x - r, y - r, x + r, y + r], fill=color)


def dunas(img, y, color, amp=40, seed=1):
    d = ImageDraw.Draw(img)
    rnd = random.Random(seed)
    f1, f2 = rnd.uniform(0.002, 0.004), rnd.uniform(0.006, 0.01)
    p1, p2 = rnd.uniform(0, 6), rnd.uniform(0, 6)
    pts = [(x, y + amp * math.sin(x * f1 + p1) + amp * 0.4 * math.sin(x * f2 + p2)) for x in range(0, W + 10, 10)]
    d.polygon(pts + [(W, H), (0, H)], fill=color)


def piramide(img, cx, base_y, ancho, alto, luz=ARENA, sombra=ARENA_OSC, punta_oro=False):
    d = ImageDraw.Draw(img)
    top = (cx, base_y - alto)
    d.polygon([top, (cx - ancho / 2, base_y), (cx + ancho * 0.12, base_y)], fill=luz)
    d.polygon([top, (cx + ancho * 0.12, base_y), (cx + ancho / 2, base_y)], fill=sombra)
    # hiladas de piedra
    for i in range(1, 14):
        t = i / 14
        y = base_y - alto * (1 - t)
        xl = cx - ancho / 2 * t
        xr = cx + ancho / 2 * t
        d.line([(xl, y), (xr, y)], fill=lerp(sombra, NEGRO, 0.2), width=1)
    if punta_oro:
        k = 0.1
        d.polygon([top, (cx - ancho / 2 * k, base_y - alto * (1 - k)), (cx + ancho / 2 * k, base_y - alto * (1 - k))], fill=ORO)


def palmera(img, x, y, h, color=(30, 50, 30)):
    d = ImageDraw.Draw(img)
    for i in range(int(h)):
        xx = x + math.sin(i / h * 1.5) * h * 0.12
        d.ellipse([xx - 7, y - i - 7, xx + 7, y - i + 7], fill=(80, 55, 35))
    tx = x + math.sin(1.5) * h * 0.12
    ty = y - h
    for ang in range(0, 360, 40):
        a = math.radians(ang)
        pts = []
        for j in range(12):
            t = j / 11
            pts.append((tx + math.cos(a) * h * 0.45 * t, ty + math.sin(a) * h * 0.2 * t + (h * 0.25) * t * t))
        d.line(pts, fill=color, width=12)


def rio(img, y0, y1, color=AZUL_NILO):
    d = ImageDraw.Draw(img)
    d.rectangle([0, y0, W, y1], fill=color)
    rnd = random.Random(3)
    for _ in range(140):
        x = rnd.randrange(W)
        y = rnd.randrange(y0 + 5, y1 - 5)
        L = rnd.randrange(30, 120)
        d.line([(x, y), (x + L, y)], fill=lerp(color, (255, 255, 255), 0.35), width=2)


def barca(img, x, y, s=1.0):
    d = ImageDraw.Draw(img)
    d.polygon([(x - 160 * s, y - 40 * s), (x + 160 * s, y - 40 * s), (x + 110 * s, y), (x - 110 * s, y)], fill=(110, 70, 35))
    d.line([(x, y - 40 * s), (x, y - 260 * s)], fill=(80, 50, 25), width=int(8 * s))
    d.polygon([(x + 5 * s, y - 250 * s), (x + 5 * s, y - 60 * s), (x + 130 * s, y - 70 * s)], fill=(240, 230, 205))


def columna(img, x, y_base, alto, ancho, color=(205, 170, 115)):
    d = ImageDraw.Draw(img)
    d.rectangle([x - ancho / 2, y_base - alto, x + ancho / 2, y_base], fill=color)
    for i in range(1, 4):
        xx = x - ancho / 2 + ancho * i / 4
        d.line([(xx, y_base - alto), (xx, y_base)], fill=lerp(color, NEGRO, 0.25), width=3)
    # capitel papiriforme
    d.polygon([(x - ancho * 0.85, y_base - alto - 40), (x + ancho * 0.85, y_base - alto - 40),
               (x + ancho / 2, y_base - alto), (x - ancho / 2, y_base - alto)], fill=lerp(color, ORO, 0.4))
    for k, c in enumerate([LAPIS, ORO, TURQ]):
        yy = y_base - alto * (0.3 + 0.12 * k)
        d.rectangle([x - ancho / 2, yy, x + ancho / 2, yy + 12], fill=c)


def vineta(img, fuerza=0.55):
    m = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(m)
    d.ellipse([-W * 0.15, -H * 0.2, W * 1.15, H * 1.2], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(180))
    negro = Image.new("RGB", (W, H), (0, 0, 0))
    base = img.convert("RGB")
    out = Image.composite(base, negro, m)
    return Image.blend(base, out, fuerza)


# ---------- glifos sencillos ----------

def ankh(d, x, y, s, c):
    d.ellipse([x - 20 * s, y - 60 * s, x + 20 * s, y - 5 * s], outline=c, width=int(9 * s))
    d.rectangle([x - 5 * s, y - 5 * s, x + 5 * s, y + 70 * s], fill=c)
    d.rectangle([x - 35 * s, y - 2 * s, x + 35 * s, y + 8 * s], fill=c)


def ojo(d, x, y, s, c):
    d.chord([x - 60 * s, y - 30 * s, x + 60 * s, y + 30 * s], 180, 360, outline=c, width=int(7 * s))
    d.chord([x - 60 * s, y - 20 * s, x + 60 * s, y + 20 * s], 0, 180, outline=c, width=int(7 * s))
    d.ellipse([x - 16 * s, y - 18 * s, x + 16 * s, y + 14 * s], fill=c)
    d.line([(x - 60 * s, y - 34 * s), (x + 60 * s, y - 44 * s)], fill=c, width=int(7 * s))
    d.line([(x - 10 * s, y + 20 * s), (x - 15 * s, y + 70 * s)], fill=c, width=int(7 * s))
    d.arc([x + 5 * s, y + 10 * s, x + 70 * s, y + 80 * s], 0, 200, fill=c, width=int(7 * s))


def pajaro(d, x, y, s, c):
    d.ellipse([x - 35 * s, y - 20 * s, x + 30 * s, y + 25 * s], fill=c)
    d.ellipse([x + 15 * s, y - 45 * s, x + 45 * s, y - 15 * s], fill=c)
    d.polygon([(x + 45 * s, y - 33 * s), (x + 62 * s, y - 28 * s), (x + 45 * s, y - 24 * s)], fill=c)
    d.polygon([(x - 35 * s, y), (x - 75 * s, y + 25 * s), (x - 30 * s, y + 20 * s)], fill=c)
    d.line([(x, y + 25 * s), (x - 5 * s, y + 55 * s)], fill=c, width=int(5 * s))
    d.line([(x + 12 * s, y + 25 * s), (x + 15 * s, y + 55 * s)], fill=c, width=int(5 * s))


def agua(d, x, y, s, c):
    pts = []
    for i in range(9):
        pts.append((x - 60 * s + i * 15 * s, y + (-12 if i % 2 else 12) * s))
    d.line(pts, fill=c, width=int(7 * s))


def serpiente(d, x, y, s, c):
    pts = [(x - 60 * s + t * 120 * s, y + 18 * s * math.sin(t * 9)) for t in [i / 30 for i in range(31)]]
    d.line(pts, fill=c, width=int(10 * s))
    d.ellipse([x + 52 * s, y - 14 * s, x + 74 * s, y + 8 * s], fill=c)


def junco(d, x, y, s, c):
    d.line([(x, y + 60 * s), (x, y - 40 * s)], fill=c, width=int(7 * s))
    d.ellipse([x - 15 * s, y - 75 * s, x + 15 * s, y - 25 * s], fill=c)
    d.line([(x, y - 30 * s), (x - 20 * s, y + 10 * s)], fill=c, width=int(5 * s))


GLIFOS = [ankh, ojo, pajaro, agua, serpiente, junco]


def cartucho_glifos(d, x0, y0, x1, y1, color, seed=0, s=0.6):
    rnd = random.Random(seed)
    paso = 170 * s
    y = y0 + 90 * s
    while y < y1 - 60 * s:
        x = x0 + 90 * s
        while x < x1 - 60 * s:
            rnd.choice(GLIFOS)(d, x, y, s, color)
            x += paso
        y += paso


def friso(img, y, alto=60):
    d = ImageDraw.Draw(img)
    d.rectangle([0, y, W, y + alto], fill=ORO_OSC)
    cols = [LAPIS, ORO, TURQ, (170, 50, 40)]
    w = 40
    for i in range(0, W // w + 1):
        d.rectangle([i * w + 4, y + 8, i * w + w - 4, y + alto - 8], fill=cols[i % 4])


# ---------- escenas ----------

def esc_nilo(img):
    cielo(img, "amanecer")
    sol(img, 1400, 380, 90)
    dunas(img, 560, (200, 150, 95), 25, 2)
    rio(img, 620, 790)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 790, W, H], fill=(70, 110, 45))
    dunas(img, 830, (50, 90, 35), 15, 5)
    for x, h in [(150, 380), (300, 300), (1650, 420), (1800, 330), (1000, 260)]:
        palmera(img, x, 860 + (x % 3) * 20, h)
    barca(img, 700, 720, 0.9)


def esc_crecida(img):
    cielo(img, "dia")
    sol(img, 300, 250, 70)
    dunas(img, 520, ARENA, 30, 4)
    rio(img, 580, 900, (60, 105, 120))
    d = ImageDraw.Draw(img)
    # campos sumergidos y limo
    for i in range(6):
        x = 120 + i * 300
        d.rectangle([x, 640 + (i % 2) * 60, x + 220, 660 + (i % 2) * 60], fill=(90, 120, 60))
    d.rectangle([0, 900, W, H], fill=(45, 35, 25))
    rnd = random.Random(9)
    for _ in range(400):
        x = rnd.randrange(W)
        y = rnd.randrange(910, H)
        d.line([(x, y), (x + rnd.randrange(-6, 6), y - rnd.randrange(20, 60))], fill=(rnd.randrange(150, 200), rnd.randrange(150, 190), 60), width=3)
    for x in [80, 1750]:
        palmera(img, x, 920, 380)


def esc_mapa(img):
    gradiente(img, PAPIRO, (205, 180, 130))
    d = ImageDraw.Draw(img)
    # Nilo serpenteante de sur (abajo) a norte (arriba) con delta
    pts = [(960 + 120 * math.sin(y / 140), y) for y in range(1050, 330, -10)]
    d.line(pts, fill=AZUL_NILO, width=18)
    x0, y0 = pts[-1]
    for dx in (-220, -110, 0, 110, 220):
        d.line([(x0, y0), (x0 + dx, 150)], fill=AZUL_NILO, width=10)
    d.rectangle([0, 0, W, 130], fill=(70, 120, 170))
    d.text((60, 30), "Mar Mediterráneo", font=font(52), fill=(240, 240, 240))
    d.text((1180, 230), "BAJO EGIPTO", font=font(64), fill=(170, 50, 40))
    d.text((1180, 760), "ALTO EGIPTO", font=font(64), fill=(170, 50, 40))
    d.text((1180, 305), "corona roja", font=font(36, False), fill=NEGRO)
    d.text((1180, 835), "corona blanca", font=font(36, False), fill=NEGRO)
    # coronas estilizadas
    d.polygon([(1760, 380), (1760, 240), (1810, 240), (1810, 300), (1870, 300), (1870, 380)], fill=(190, 40, 30))
    d.ellipse([1770, 820, 1870, 960], fill=(250, 250, 240), outline=NEGRO, width=3)
    d.rectangle([1770, 890, 1870, 960], fill=(250, 250, 240))
    d.text((80, 560), "Menfis", font=font(44), fill=NEGRO)
    d.ellipse([1035, 560, 1060, 585], fill=NEGRO)
    d.line([(270, 590), (1030, 575)], fill=NEGRO, width=2)
    d.text((80, 900), "Tebas", font=font(44), fill=NEGRO)
    d.ellipse([930, 930, 955, 955], fill=NEGRO)
    d.line([(240, 930), (925, 940)], fill=NEGRO, width=2)


def esc_jeroglificos(img):
    gradiente(img, (215, 180, 120), (175, 135, 85))
    d = ImageDraw.Draw(img)
    rnd = random.Random(11)
    for _ in range(3000):
        x, y = rnd.randrange(W), rnd.randrange(H)
        c = rnd.randrange(150, 200)
        d.point((x, y), fill=(c, int(c * 0.8), int(c * 0.55)))
    for i, x in enumerate(range(100, W - 200, 290)):
        d.rectangle([x, 120, x + 240, 960], outline=ORO_OSC, width=6)
        cartucho_glifos(d, x, 120, x + 240, 960, (60, 40, 25) if i % 2 else LAPIS, seed=i, s=0.75)
    friso(img, 0, 70)
    friso(img, H - 70, 70)


def esc_piramide_escalonada(img):
    cielo(img, "dia")
    sol(img, 1550, 220, 70)
    dunas(img, 820, ARENA, 30, 8)
    d = ImageDraw.Draw(img)
    cx, base = 900, 860
    for i in range(6):
        w = 1100 - i * 150
        h = 95
        y = base - i * h
        d.rectangle([cx - w / 2, y - h, cx + w / 2, y], fill=ARENA if i % 2 == 0 else (215, 172, 108))
        d.rectangle([cx + w / 2 - 120, y - h, cx + w / 2, y], fill=ARENA_OSC)
        d.line([(cx - w / 2, y - h), (cx + w / 2, y - h)], fill=ARENA_OSC, width=4)
    dunas(img, 900, (210, 165, 100), 20, 9)


def esc_piramides(img):
    cielo(img, "atardecer")
    sol(img, 960, 640, 130, (255, 190, 90))
    piramide(img, 1500, 800, 600, 380, (200, 130, 80), (120, 70, 50))
    piramide(img, 900, 820, 900, 560, (215, 145, 85), (130, 75, 55), punta_oro=True)
    piramide(img, 400, 840, 700, 450, (205, 135, 80), (125, 72, 52))
    dunas(img, 830, (150, 90, 60), 25, 12)
    dunas(img, 930, (110, 65, 45), 20, 13)
    for x in [1750, 1840]:
        palmera(img, x, 990, 300, (20, 20, 25))


def esc_esfinge(img):
    cielo(img, "dia")
    piramide(img, 1500, 760, 800, 480)
    dunas(img, 760, ARENA, 20, 14)
    d = ImageDraw.Draw(img)
    c, cs = (200, 160, 100), (160, 120, 70)
    # cuerpo de león
    d.rounded_rectangle([300, 640, 1250, 880], 60, fill=c)
    d.rectangle([1150, 820, 1500, 890], fill=c)  # patas delanteras
    d.rectangle([1150, 870, 1520, 895], fill=cs)
    # cabeza con nemes
    d.polygon([(250, 450), (520, 450), (560, 760), (210, 760)], fill=(185, 150, 90))
    for k in range(8):
        y = 470 + k * 35
        d.line([(240 - k * 4, y), (530 + k * 5, y)], fill=cs, width=8)
    d.rounded_rectangle([290, 400, 480, 660], 70, fill=c)
    d.ellipse([320, 480, 360, 500], fill=NEGRO)
    d.ellipse([410, 480, 450, 500], fill=NEGRO)
    d.line([(385, 510), (380, 570)], fill=cs, width=6)
    d.line([(350, 600), (420, 600)], fill=cs, width=6)
    dunas(img, 900, (210, 165, 100), 15, 15)


def esc_desierto(img):
    cielo(img, "atardecer")
    sol(img, 1500, 600, 100, (255, 170, 80))
    dunas(img, 620, (190, 110, 70), 50, 21)
    dunas(img, 740, (160, 90, 60), 60, 22)
    dunas(img, 880, (120, 65, 45), 50, 23)
    d = ImageDraw.Draw(img)
    # ruinas de columnas
    for x, h in [(400, 260), (520, 160), (640, 220)]:
        d.rectangle([x - 35, 860 - h, x + 35, 860], fill=(90, 55, 40))
    d.polygon([(700, 870), (820, 840), (860, 880)], fill=(90, 55, 40))


def esc_templo(img):
    cielo(img, "amanecer")
    sol(img, 960, 330, 80)
    d = ImageDraw.Draw(img)
    # pilono
    d.polygon([(260, 900), (380, 260), (860, 260), (900, 900)], fill=(210, 170, 110))
    d.polygon([(1020, 900), (1060, 260), (1540, 260), (1660, 900)], fill=(195, 155, 100))
    d.rectangle([860, 420, 1060, 900], fill=(120, 80, 50))
    cartucho_glifos(d, 420, 320, 840, 860, (130, 90, 50), seed=3, s=0.5)
    cartucho_glifos(d, 1080, 320, 1500, 860, (120, 80, 45), seed=4, s=0.5)
    # obeliscos
    for x in (180, 1740):
        d.polygon([(x - 40, 900), (x - 25, 260), (x, 210), (x + 25, 260), (x + 40, 900)], fill=(220, 180, 120))
        d.polygon([(x - 25, 260), (x, 210), (x + 25, 260)], fill=ORO)
    d.rectangle([0, 900, W, H], fill=(200, 160, 100))
    for x in range(100, W, 260):
        d.ellipse([x, 960, x + 160, 1000], fill=(180, 140, 85))


def esc_carros(img):
    cielo(img, "dia")
    sol(img, 1600, 200, 60)
    dunas(img, 700, ARENA, 30, 31)
    d = ImageDraw.Draw(img)
    rnd = random.Random(5)
    for k in range(3):
        bx = 300 + k * 520
        by = 780 + (k % 2) * 60
        s = 1.0 - k * 0.1
        # caballo
        d.ellipse([bx + 120 * s, by - 170 * s, bx + 330 * s, by - 80 * s], fill=(70, 45, 30))
        d.polygon([(bx + 300 * s, by - 160 * s), (bx + 370 * s, by - 260 * s), (bx + 400 * s, by - 240 * s), (bx + 330 * s, by - 120 * s)], fill=(70, 45, 30))
        d.ellipse([bx + 360 * s, by - 280 * s, bx + 430 * s, by - 230 * s], fill=(70, 45, 30))
        for lx in (140, 190, 270, 310):
            d.line([(bx + lx * s, by - 100 * s), (bx + (lx + rnd.randrange(-30, 30)) * s, by)], fill=(60, 40, 25), width=int(14 * s))
        d.polygon([(bx + 370 * s, by - 290 * s), (bx + 380 * s, by - 340 * s), (bx + 395 * s, by - 285 * s)], fill=(200, 40, 40))
        # carro
        d.ellipse([bx - 40 * s, by - 110 * s, bx + 90 * s, by + 20 * s], outline=(120, 70, 30), width=int(12 * s))
        for a in range(0, 360, 60):
            r = math.radians(a)
            d.line([(bx + 25 * s, by - 45 * s), (bx + 25 * s + 60 * s * math.cos(r), by - 45 * s + 60 * s * math.sin(r))], fill=(120, 70, 30), width=int(5 * s))
        d.polygon([(bx - 60 * s, by - 60 * s), (bx + 110 * s, by - 60 * s), (bx + 90 * s, by - 170 * s), (bx - 40 * s, by - 170 * s)], fill=ORO_OSC)
        d.line([(bx + 100 * s, by - 100 * s), (bx + 160 * s, by - 120 * s)], fill=(120, 70, 30), width=int(8 * s))
        # auriga
        d.rectangle([bx - 10 * s, by - 290 * s, bx + 50 * s, by - 170 * s], fill=(240, 235, 220))
        d.ellipse([bx - 5 * s, by - 350 * s, bx + 45 * s, by - 290 * s], fill=(150, 95, 60))
        d.line([(bx + 50 * s, by - 260 * s), (bx + 360 * s, by - 250 * s)], fill=(60, 40, 25), width=3)
    # polvo
    for _ in range(60):
        x, y = rnd.randrange(W), rnd.randrange(800, 1000)
        r = rnd.randrange(20, 70)
        d.ellipse([x - r, y - r // 2, x + r, y + r // 2], fill=(215, 180, 125))


def esc_faraon(img):
    gradiente(img, (30, 40, 90), (10, 15, 40))
    d = ImageDraw.Draw(img)
    cx = 960
    # disco solar detrás
    sol(img, cx, 380, 230, (240, 190, 80))
    d = ImageDraw.Draw(img)
    # nemes con rayas
    d.polygon([(cx - 330, 330), (cx + 330, 330), (cx + 420, 900), (cx - 420, 900)], fill=ORO)
    for k in range(14):
        y = 360 + k * 40
        d.line([(cx - 340 - k * 6, y), (cx + 340 + k * 6, y)], fill=LAPIS, width=16)
    d.ellipse([cx - 340, 160, cx + 340, 520], fill=ORO)
    for k in range(6):
        d.arc([cx - 340 + k * 12, 160 + k * 18, cx + 340 - k * 12, 520], 180, 360, fill=LAPIS, width=14)
    # rostro
    d.rounded_rectangle([cx - 190, 300, cx + 190, 760], 150, fill=(170, 110, 70))
    for sx in (-1, 1):
        ex = cx + sx * 85
        d.ellipse([ex - 50, 450, ex + 50, 490], fill=(250, 250, 245))
        d.ellipse([ex - 18, 452, ex + 18, 488], fill=NEGRO)
        d.line([(ex - 60, 470), (ex + 70 * sx if sx > 0 else ex - 70, 480)], fill=NEGRO, width=8)
        d.line([(ex - 60, 425), (ex + 60, 415 if sx > 0 else 425)], fill=NEGRO, width=10)
    d.line([(cx, 480), (cx - 15, 600)], fill=(130, 80, 50), width=8)
    d.line([(cx - 60, 660), (cx + 60, 660)], fill=(120, 50, 40), width=12)
    # barba postiza y uraeus
    d.rectangle([cx - 30, 760, cx + 30, 900], fill=LAPIS)
    for y in range(770, 900, 25):
        d.line([(cx - 30, y), (cx + 30, y)], fill=ORO, width=6)
    d.ellipse([cx - 35, 230, cx + 35, 320], fill=ORO_OSC)
    d.ellipse([cx - 20, 200, cx + 20, 250], fill=ORO_OSC)
    # collar
    for k in range(5):
        d.arc([cx - 480 + k * 10, 640 + k * 30, cx + 480 - k * 10, 1150 + k * 30], 200, 340, fill=[LAPIS, ORO, TURQ, ORO, LAPIS][k], width=30)


def esc_mascara(img):
    gradiente(img, (15, 12, 10), (45, 35, 25))
    esc = Image.new("RGB", (W, H))
    esc_faraon(esc)
    m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).ellipse([360, 80, 1560, 1200], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(60))
    img.paste(esc, (0, 0), m)
    d = ImageDraw.Draw(img)
    rnd = random.Random(2)
    for _ in range(90):
        x, y = rnd.randrange(W), rnd.randrange(H)
        d.ellipse([x, y, x + 4, y + 4], fill=(255, 220, 140))


def esc_abu_simbel(img):
    cielo(img, "amanecer")
    d = ImageDraw.Draw(img)
    d.polygon([(0, 200), (W, 200), (W, H), (0, H)], fill=(205, 150, 95))
    d.rectangle([0, 160, W, 230], fill=(190, 135, 85))
    for i, cx in enumerate([300, 720, 1200, 1620]):
        # estatuas sentadas
        d.rectangle([cx - 150, 560, cx + 150, 980], fill=(215, 160, 105))
        d.rectangle([cx - 150, 740, cx + 150, 790], fill=(180, 125, 80))
        d.polygon([(cx - 120, 300), (cx + 120, 300), (cx + 170, 600), (cx - 170, 600)], fill=(200, 145, 95))
        for k in range(6):
            d.line([(cx - 125 - k * 7, 330 + k * 45), (cx + 125 + k * 7, 330 + k * 45)], fill=(170, 115, 75), width=6)
        d.rounded_rectangle([cx - 80, 260, cx + 80, 470], 60, fill=(220, 165, 110))
        d.polygon([(cx - 70, 260), (cx + 70, 260), (cx + 50, 170), (cx - 50, 170)], fill=(190, 40, 30) if i % 2 else (240, 235, 220))
        d.ellipse([cx - 50, 340, cx - 20, 355], fill=(110, 70, 40))
        d.ellipse([cx + 20, 340, cx + 50, 355], fill=(110, 70, 40))
        d.rectangle([cx - 15, 470, cx + 15, 540], fill=(200, 145, 95))
        if i == 1:
            d.rectangle([cx - 150, 260, cx + 40, 620], fill=(205, 150, 95))  # estatua dañada
    d.rectangle([900, 640, 1020, 980], fill=(40, 25, 20))
    d.rectangle([0, 980, W, H], fill=(190, 140, 90))


def esc_sol(img):
    cielo(img, "atardecer")
    sol(img, 960, 330, 170, (255, 200, 80))
    rio(img, 760, H, (40, 60, 110))
    d = ImageDraw.Draw(img)
    # barca solar
    pts = [(560, 640), (1360, 640), (1300, 700), (620, 700)]
    d.polygon(pts, fill=ORO_OSC)
    d.polygon([(560, 640), (500, 560), (540, 560), (620, 640)], fill=ORO_OSC)
    d.polygon([(1360, 640), (1420, 560), (1380, 560), (1300, 640)], fill=ORO_OSC)
    d.rectangle([880, 560, 1040, 640], fill=ORO)
    d.ellipse([920, 470, 1000, 550], fill=(230, 60, 40))
    # rayos con manos (estilo Atón)
    for a in range(200, 341, 14):
        r = math.radians(a)
        x1, y1 = 960 + math.cos(r) * 190, 330 - math.sin(r) * 190
        x2, y2 = 960 + math.cos(r) * 520, 330 - math.sin(r) * 520
        d.line([(x1, y1), (x2, y2)], fill=(255, 215, 120), width=5)
        d.ellipse([x2 - 10, y2 - 10, x2 + 10, y2 + 10], fill=(255, 215, 120))
    d = ImageDraw.Draw(img)
    rio(img, 760, H, (40, 60, 110))
    ankh(d, 300, 380, 2.2, ORO)
    ojo(d, 1620, 360, 1.8, ORO)


def esc_balanza(img):
    gradiente(img, PAPIRO, (200, 170, 115))
    d = ImageDraw.Draw(img)
    friso(img, 0, 60)
    friso(img, H - 60, 60)
    cx = 960
    d.rectangle([cx - 15, 300, cx + 15, 900], fill=NEGRO)
    d.polygon([(cx - 120, 900), (cx + 120, 900), (cx + 60, 850), (cx - 60, 850)], fill=NEGRO)
    d.line([(cx - 380, 320), (cx + 380, 320)], fill=NEGRO, width=14)
    for sx in (-1, 1):
        px = cx + sx * 380
        d.line([(px, 320), (px - 90, 560)], fill=NEGRO, width=4)
        d.line([(px, 320), (px + 90, 560)], fill=NEGRO, width=4)
        d.chord([px - 120, 500, px + 120, 620], 0, 180, fill=ORO_OSC)
    # corazón (vasija) y pluma
    d.ellipse([cx - 420, 470, cx - 340, 560], fill=(170, 40, 35))
    d.rectangle([cx - 400, 450, cx - 360, 480], fill=(170, 40, 35))
    px = cx + 380
    d.polygon([(px, 330), (px + 40, 420), (px + 30, 560), (px - 10, 560), (px - 25, 420)], fill=(245, 245, 235), outline=NEGRO)
    d.line([(px + 10, 360), (px + 10, 560)], fill=NEGRO, width=3)
    # Anubis estilizado
    ax = 380
    d.rectangle([ax - 60, 520, ax + 60, 900], fill=(240, 235, 220))
    d.rectangle([ax - 70, 420, ax + 70, 540], fill=NEGRO)
    d.polygon([(ax + 40, 360), (ax + 170, 400), (ax + 40, 440)], fill=NEGRO)
    d.polygon([(ax - 50, 420), (ax - 30, 300), (ax - 10, 420)], fill=NEGRO)
    d.polygon([(ax, 420), (ax + 20, 300), (ax + 40, 420)], fill=NEGRO)
    d.ellipse([ax + 60, 395, ax + 80, 410], fill=ORO)
    d.rectangle([ax - 70, 540, ax + 70, 580], fill=ORO)
    d.text((1460, 820), "Maat", font=font(64), fill=(110, 40, 30))
    cartucho_glifos(d, 1450, 100, 1880, 760, (90, 60, 35), seed=8, s=0.45)


def esc_momia(img):
    gradiente(img, (30, 22, 18), (70, 50, 35))
    d = ImageDraw.Draw(img)
    # sarcófago
    cx = 960
    d.rounded_rectangle([cx - 230, 120, cx + 230, 1000], 200, fill=ORO)
    d.rounded_rectangle([cx - 190, 160, cx + 190, 960], 170, fill=LAPIS)
    d.rounded_rectangle([cx - 120, 170, cx + 120, 440], 110, fill=(200, 150, 80))
    d.ellipse([cx - 75, 270, cx - 25, 300], fill=NEGRO)
    d.ellipse([cx + 25, 270, cx + 75, 300], fill=NEGRO)
    for k in range(5):
        d.arc([cx - 200, 380 + k * 28, cx + 200, 700 + k * 28], 200, 340, fill=[ORO, TURQ, (180, 50, 40), ORO, TURQ][k], width=22)
    for y in range(620, 940, 55):
        d.line([(cx - 160, y), (cx + 160, y)], fill=ORO, width=8)
    cartucho_glifos(d, cx - 80, 620, cx + 80, 940, ORO, seed=5, s=0.35)
    # vasos canopos
    for i, x in enumerate([330, 520, 1400, 1590]):
        d.rounded_rectangle([x - 60, 760, x + 60, 980], 40, fill=(225, 210, 175))
        d.ellipse([x - 55, 680, x + 55, 790], fill=[(200, 150, 90), (60, 50, 40), (190, 160, 120), (150, 110, 70)][i])
    # vendas en rollo
    for x in (200, 1720):
        d.ellipse([x - 70, 450, x + 70, 520], fill=(235, 225, 200))
        d.rectangle([x - 70, 485, x + 70, 600], fill=(235, 225, 200))
        d.ellipse([x - 70, 565, x + 70, 635], fill=(215, 200, 170))


def esc_aldea(img):
    cielo(img, "dia")
    sol(img, 1650, 180, 60)
    rio(img, 540, 620)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 620, W, H], fill=(140, 150, 70))
    for i in range(8):
        y = 640 + i * 55
        d.line([(0, y), (W, y + 20)], fill=(170, 160, 70), width=8)
    # casas de adobe
    for i, x in enumerate([200, 560, 940, 1320]):
        y = 800 + (i % 2) * 60
        d.rectangle([x, y - 200, x + 280, y], fill=(190, 145, 95))
        d.rectangle([x, y - 215, x + 280, y - 200], fill=(160, 120, 75))
        d.rectangle([x + 110, y - 110, x + 170, y], fill=(80, 55, 35))
        d.rectangle([x + 30, y - 170, x + 70, y - 140], fill=(80, 55, 35))
        d.rectangle([x + 210, y - 170, x + 250, y - 140], fill=(80, 55, 35))
    palmera(img, 1700, 900, 380)
    palmera(img, 80, 880, 320)
    # tablero de senet en primer plano
    d.rectangle([700, 960, 1220, 1060], fill=(120, 75, 40))
    for k in range(10):
        d.rectangle([710 + k * 51, 970, 755 + k * 51, 1010], fill=(230, 200, 140))
        d.rectangle([710 + k * 51, 1015, 755 + k * 51, 1052], fill=(210, 180, 120))
    for k in (1, 4, 6):
        d.ellipse([718 + k * 51, 975, 748 + k * 51, 1005], fill=NEGRO)
    barca(img, 1150, 590, 0.5)


def esc_faro(img):
    cielo(img, "noche")
    sol(img, 300, 200, 50, (235, 235, 220))
    rio(img, 760, H, (20, 40, 80))
    d = ImageDraw.Draw(img)
    # isla y faro de tres cuerpos
    d.polygon([(900, 760), (1700, 760), (1600, 700), (1000, 700)], fill=(80, 70, 60))
    cx = 1300
    d.rectangle([cx - 200, 380, cx + 200, 700], fill=(200, 190, 170))
    d.polygon([(cx - 130, 380), (cx + 130, 380), (cx + 110, 200), (cx - 110, 200)], fill=(210, 200, 180))
    d.rectangle([cx - 70, 120, cx + 70, 200], fill=(220, 210, 190))
    for y in range(420, 700, 50):
        for x in range(cx - 170, cx + 170, 60):
            d.rectangle([x, y, x + 20, y + 30], fill=(60, 55, 50))
    luz = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g = ImageDraw.Draw(luz)
    g.polygon([(cx, 140), (0, 0), (0, 420)], fill=(255, 220, 120, 70))
    g.polygon([(cx, 140), (W, 60), (W, 340)], fill=(255, 220, 120, 50))
    g.ellipse([cx - 60, 80, cx + 60, 200], fill=(255, 230, 140, 255))
    luz = luz.filter(ImageFilter.GaussianBlur(14))
    img.paste(luz, (0, 0), luz)
    d = ImageDraw.Draw(img)
    # ciudad en la orilla
    for i, x in enumerate(range(0, 800, 90)):
        h = 120 + (i * 37) % 120
        d.rectangle([x, 760 - h, x + 80, 760], fill=(60, 55, 70))
        d.rectangle([x + 30, 760 - h + 30, x + 50, 760 - h + 55], fill=(250, 200, 110))
    barca(img, 700, 900, 0.7)


def esc_cleopatra(img):
    gradiente(img, (80, 20, 40), (20, 10, 30))
    d = ImageDraw.Draw(img)
    friso(img, H - 60, 60)
    cx, cy = 960, 520
    # perfil estilizado
    d.polygon([(cx - 260, 220), (cx + 120, 200), (cx + 200, 320), (cx + 220, 760), (cx - 300, 800)], fill=NEGRO)  # peluca
    d.polygon([(cx + 40, 260), (cx + 170, 300), (cx + 200, 420), (cx + 240, 470), (cx + 195, 500), (cx + 210, 560), (cx + 180, 600), (cx + 120, 640), (cx + 60, 640), (cx + 40, 760), (cx - 60, 760), (cx - 40, 300)], fill=(200, 140, 100))
    d.ellipse([cx + 110, 380, cx + 170, 405], fill=(250, 250, 245))
    d.ellipse([cx + 135, 380, cx + 160, 405], fill=NEGRO)
    d.line([(cx + 100, 393), (cx + 200, 385)], fill=NEGRO, width=6)
    d.line([(cx + 95, 360), (cx + 175, 355)], fill=NEGRO, width=7)
    d.line([(cx + 175, 590), (cx + 205, 585)], fill=(170, 40, 50), width=8)
    # diadema y uraeus
    d.rectangle([cx - 260, 230, cx + 130, 270], fill=ORO)
    d.ellipse([cx + 100, 180, cx + 150, 240], fill=ORO)
    # collar
    for k in range(5):
        d.arc([cx - 330 + k * 10, 650 + k * 28, cx + 330 - k * 10, 1150 + k * 28], 190, 350, fill=[ORO, TURQ, LAPIS, ORO, TURQ][k], width=26)
    for x, c in [(300, ORO), (1650, ORO)]:
        ankh(d, x, 480, 2.0, c)
    d.text((1300, 820), "Cleopatra VII", font=font(56), fill=ORO)


ESCENAS = {k[4:]: v for k, v in globals().items() if k.startswith("esc_")}


def render(nombre, ruta):
    img = Image.new("RGB", (W, H))
    ESCENAS[nombre](img)
    img = vineta(img)
    img.save(ruta, quality=95)


def portada(titulo, subtitulo, ep, ruta):
    img = Image.new("RGB", (W, H))
    esc_piramides(img)
    img = vineta(img, 0.8)
    capa = Image.new("RGBA", (W, H), (0, 0, 0, 120))
    img.paste(capa, (0, 0), capa)
    d = ImageDraw.Draw(img)
    friso(img, 0, 50)
    friso(img, H - 50, 50)

    def centro(texto, f, y, color):
        w = d.textlength(texto, font=f)
        d.text(((W - w) / 2 + 4, y + 4), texto, font=f, fill=(0, 0, 0))
        d.text(((W - w) / 2, y), texto, font=f, fill=color)

    centro("HISTORIA DEL ANTIGUO EGIPTO", font(54), 260, (240, 225, 190))
    centro(f"Episodio {int(ep)}", font(48, False), 370, ORO)
    centro(titulo, font(120), 450, ORO)
    centro(subtitulo, font(56, False), 630, (245, 240, 225))
    ankh(d, W / 2, 820, 1.4, ORO)
    img.save(ruta, quality=95)


if __name__ == "__main__":
    import os
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else "preview"
    os.makedirs(out, exist_ok=True)
    for n in ESCENAS:
        render(n, f"{out}/{n}.jpg")
    portada("El don del Nilo", "Orígenes y unificación", "01", f"{out}/_portada.jpg")

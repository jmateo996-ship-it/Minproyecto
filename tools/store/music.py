"""Banda sonora del tráiler (30 s), sintetizada con numpy y sincronizada con
las escenas de tools/store/trailer.js.
Uso: python3 tools/store/music.py store/tmp/trailer_music.wav
  0‑3 s   el ojo de ORDO: dron grave y golpe
  3‑7 s   la familia: pad cálido y arpegio suave
  7‑14 s  acción: synthwave con batería completa
  14‑22 s estancia y elección: baja la tensión, pulso de bajo
  22‑27 s ORDO PRIMORDIAL: clímax, arpegio rápido y doble bombo
  27‑30 s logo: acorde final con cola
"""
import sys, wave
import numpy as np

SR = 44100
DUR = 30.0
N = int(SR * DUR)
t = np.arange(N) / SR
out = np.zeros(N)
BPM = 112
beat = 60 / BPM
rng = np.random.default_rng(7)


def mtof(m):
    return 440 * 2 ** ((m - 69) / 12)


def env(length, a=0.005, r=0.2):
    n = int(length * SR); e = np.ones(n)
    na = max(1, int(a * SR)); nr = max(1, min(n, int(r * SR)))
    e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr)
    return e


def add(sig, start, gain=1.0):
    i = int(start * SR)
    if i >= N: return
    j = min(N, i + len(sig)); out[i:j] += sig[: j - i] * gain


def osc(kind, f, length):
    tt = np.arange(int(length * SR)) / SR
    ph = (f * tt) % 1.0
    if kind == 'saw': return 2 * ph - 1
    if kind == 'square': return np.where(ph < 0.5, 1.0, -1.0)
    if kind == 'tri': return 4 * np.abs(ph - 0.5) - 1
    return np.sin(2 * np.pi * f * tt)


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR); y = np.zeros_like(x); s = 0.0
    for i in range(len(x)):  # filtro de un polo (suficiente para un bajo)
        s = (1 - a) * x[i] + a * s; y[i] = s
    return y


def kick(start, g=0.9):
    L = 0.35; tt = np.arange(int(L * SR)) / SR
    f = 120 * np.exp(-tt * 18) + 42
    add(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9), start, g)


def snare(start, g=0.35):
    L = 0.25; n = rng.standard_normal(int(L * SR)); tt = np.arange(len(n)) / SR
    add(n * np.exp(-tt * 18) + 0.4 * np.sin(2 * np.pi * 190 * tt) * np.exp(-tt * 25), start, g)


def hat(start, g=0.08):
    L = 0.05; n = rng.standard_normal(int(L * SR)); n = np.diff(n, prepend=0)
    add(n * np.exp(-np.arange(len(n)) / SR * 80), start, g)


def impact(start, g=0.8):
    L = 1.6; tt = np.arange(int(L * SR)) / SR
    boom = np.sin(2 * np.pi * (55 * np.exp(-tt * 2) + 30) * tt) * np.exp(-tt * 2.2)
    noise = rng.standard_normal(len(tt)) * np.exp(-tt * 6) * 0.3
    add(boom + noise, start, g)


# Progresión en La menor: Am – F – C – G (raíces MIDI)
PROG = [45, 41, 48, 43]
CHORD = {45: [57, 60, 64], 41: [53, 57, 60], 48: [55, 60, 64], 43: [55, 59, 62]}

# 0‑3 s: dron y golpe
add(lowpass(osc('saw', mtof(33), 3.2) * env(3.2, 1.5, 0.6), 400), 0, 0.35)
impact(1.4, 0.9)

# 3‑7 s: pad + arpegio suave
for k, root in enumerate(PROG):
    s = 3 + k * 1.0
    for n in CHORD[root]: add(osc('tri', mtof(n), 1.2) * env(1.2, 0.3, 0.5), s, 0.16)
    add(lowpass(osc('saw', mtof(root - 12), 1.0) * env(1.0, 0.05, 0.3), 500), s, 0.25)
for i in range(16):
    root = PROG[(i // 4) % 4]; n = CHORD[root][i % 3] + 12
    add(osc('square', mtof(n), 0.22) * env(0.22, 0.005, 0.15), 3 + i * 0.25, 0.08)

# 7‑14 s y 22‑27 s: synthwave completa
def full(t0, t1, fast=False):
    bar = beat * 4; s = t0; k = 0
    while s < t1 - 0.01:
        root = PROG[k % 4]
        for b8 in range(8):  # bajo en corcheas
            st = s + b8 * beat / 2
            if st < t1: add(lowpass(osc('saw', mtof(root - 12), beat / 2) * env(beat / 2, 0.005, 0.08), 900), st, 0.32)
        steps = 16 if fast else 8
        for a in range(steps):  # arpegio
            st = s + a * bar / steps
            n = CHORD[root][a % 3] + (24 if fast and a % 2 else 12)
            if st < t1: add(osc('square', mtof(n), bar / steps * 0.9) * env(bar / steps * 0.9, 0.003, 0.05), st, 0.045)
        for n in CHORD[root]: add(osc('saw', mtof(n), bar) * env(bar, 0.05, 0.3), s, 0.022)
        for q in range(4):
            st = s + q * beat
            if st >= t1: break
            kick(st)
            if fast: kick(st + beat / 2, 0.6)
            if q % 2 == 1: snare(st)
            for h in range(4 if fast else 2): hat(st + h * beat / (4 if fast else 2))
        s += bar; k += 1

full(7, 14)
impact(7, 0.5)
# 14‑22 s: tensión contenida
for i in range(int(8 / (beat / 2))):
    st = 14 + i * beat / 2
    add(lowpass(osc('saw', mtof(33), beat / 2) * env(beat / 2, 0.005, 0.1), 600), st, 0.28)
    if i % 2 == 0: hat(st, 0.05)
for k, root in enumerate([45, 41, 45, 43, 45, 41, 48, 43]):
    for n in CHORD[root]: add(osc('tri', mtof(n), 1.1) * env(1.1, 0.2, 0.5), 14 + k, 0.05)
impact(18, 0.45)
full(22, 27, fast=True)
impact(22, 0.8)
# 27‑30 s: acorde final
for n in [45, 57, 60, 64, 69, 72]:
    add(osc('saw', mtof(n), 3.0) * env(3.0, 0.01, 2.6), 27, 0.05)
    add(osc('tri', mtof(n), 3.0) * env(3.0, 0.01, 2.6), 27, 0.06)
impact(27, 0.7)

# Reverberación sencilla (ecos) y normalización a -1 dBFS
wet = np.zeros(N)
for d, g in [(0.083, 0.35), (0.131, 0.25), (0.197, 0.18), (0.29, 0.12)]:
    k = int(d * SR); wet[k:] += out[:-k] * g
mix = out + wet * 0.6
mix[-int(0.4 * SR):] *= np.linspace(1, 0, int(0.4 * SR))
mix = mix / np.max(np.abs(mix)) * 10 ** (-1 / 20)
pcm = (mix * 32767).astype(np.int16)
stereo = np.stack([pcm, pcm], axis=1)
path = sys.argv[1] if len(sys.argv) > 1 else 'trailer_music.wav'
with wave.open(path, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(stereo.tobytes())
print('música:', path, f'{DUR:.0f} s')

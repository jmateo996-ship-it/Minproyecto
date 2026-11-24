#!/usr/bin/env bash
# Monta el tráiler a partir de los fotogramas de trailer.js y la música de music.py.
# Uso: tools/store/make_trailer.sh            (requiere ffmpeg, node y python3 con numpy)
#   store/video/trailer_<es|en>_1080x1920.mp4   vertical, para YouTube (Google Play) y redes
#   store/video/app-preview_<es|en>_886x1920.mp4  vista previa del App Store (iPhone 6,5"‑6,9"), sin recortar
set -euo pipefail
cd "$(dirname "$0")/../.."
mkdir -p store/video store/tmp
[ -f store/tmp/trailer_music.wav ] || python3 tools/store/music.py store/tmp/trailer_music.wav
for L in es en; do
  [ -d "store/tmp/trailer_$L" ] || node tools/store/trailer.js "$L"
  ffmpeg -y -loglevel error -framerate 30 -i "store/tmp/trailer_$L/%05d.jpg" -i store/tmp/trailer_music.wav \
    -vf "scale=1080:1920:flags=lanczos,format=yuv420p" -c:v libx264 -preset slow -crf 18 -profile:v high -r 30 \
    -c:a aac -b:a 192k -shortest -movflags +faststart "store/video/trailer_${L}_1080x1920.mp4"
  # App Store: 886 x 1920. El vídeo completo (sin recortar rótulos) sobre una copia desenfocada
  ffmpeg -y -loglevel error -i "store/video/trailer_${L}_1080x1920.mp4" \
    -filter_complex "[0:v]split[a][b];[a]scale=886:1920:force_original_aspect_ratio=increase,crop=886:1920,boxblur=24:2,eq=brightness=-0.25[bg];[b]scale=886:-2[fg];[bg][fg]overlay=0:(H-h)/2,format=yuv420p" \
    -c:v libx264 -preset slow -crf 18 -profile:v high -r 30 \
    -c:a aac -b:a 192k -movflags +faststart "store/video/app-preview_${L}_886x1920.mp4"
  echo "ok $L"
done

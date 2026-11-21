"""Genera Exodo2942.html: el juego completo en un solo archivo para probarlo
en el navegador de cualquier móvil sin instalar nada.
Uso: python3 tools/build_single.py"""
import base64, os, re

root = os.path.join(os.path.dirname(__file__), '..')
w = os.path.join(root, 'www') + '/'
h = open(w + 'index.html', encoding='utf-8').read()
css = open(w + 'css/style.css', encoding='utf-8').read()
h = h.replace('<link rel="stylesheet" href="css/style.css">', '<style>\n' + css + '\n</style>')
h = h.replace('  <link rel="manifest" href="manifest.webmanifest">\n', '')
svg = base64.b64encode(open(w + 'assets/icon.svg', 'rb').read()).decode()
h = h.replace('href="assets/icon.svg"', 'href="data:image/svg+xml;base64,' + svg + '"')
h = re.sub(r'<script src="([^"]+)"></script>',
           lambda m: '<script>\n' + open(w + m.group(1), encoding='utf-8').read().replace('</script', '<\\/script') + '\n</script>', h)
open(os.path.join(root, 'Exodo2942.html'), 'w', encoding='utf-8').write(h)
print('Exodo2942.html generado (%d KB)' % (len(h) // 1024))

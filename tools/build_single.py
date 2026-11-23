"""Genera el juego completo en un solo archivo para probarlo en el navegador
de cualquier móvil sin instalar nada.

Uso:
  python3 tools/build_single.py          -> Exodo2942.html (juego normal)
  python3 tools/build_single.py --test   -> Exodo2942-prueba-estancias.html
      Versión de prueba: botones en la pantalla de inicio para entrar
      directamente en las 4 estancias de personajes y todas las misiones
      desbloqueadas."""
import base64, os, re, sys

TEST = '--test' in sys.argv
root = os.path.join(os.path.dirname(__file__), '..')
w = os.path.join(root, 'www') + '/'
h = open(w + 'index.html', encoding='utf-8').read()
css = open(w + 'css/style.css', encoding='utf-8').read()
h = h.replace('<link rel="stylesheet" href="css/style.css">', '<style>\n' + css + '\n</style>')
h = h.replace('  <link rel="manifest" href="manifest.webmanifest">\n', '')
svg = base64.b64encode(open(w + 'assets/icon.svg', 'rb').read()).decode()
h = h.replace('href="assets/icon.svg"', 'href="data:image/svg+xml;base64,' + svg + '"')

TEST_PRE = """<script>
// MODO PRUEBA: desbloquea todas las misiones antes de que arranque el juego
try { const k = 'exodo2942.save', s = JSON.parse(localStorage.getItem(k) || '{}'); s.unlocked = 15; localStorage.setItem(k, JSON.stringify(s)); } catch (e) {}
</script>
"""
TEST_POST = """<script>
// MODO PRUEBA: acceso directo a las estancias desde la pantalla de inicio
(() => {
  const menu = document.querySelector('#title .menu');
  const head = document.createElement('div');
  head.textContent = 'PRUEBA · ESTANCIAS DE PERSONAJES';
  head.style.cssText = 'margin-top:6px;font-size:11px;letter-spacing:.25em;color:#9dff6a;font-weight:800;text-align:center';
  menu.appendChild(head);
  window.Rooms.ROOMS.forEach((room, i) => {
    const b = document.createElement('button');
    b.className = 'btn small';
    b.style.cssText = 'border-color:#9dff6a;padding:11px 10px';
    b.textContent = room.id + '. ' + room.title;
    b.addEventListener('click', () => {
      window.GameAudio.init();
      // Al escapar se vuelve a la pantalla de inicio
      window.__debug.runRoom(i).then(() => document.getElementById('roomMenu').click());
    });
    menu.appendChild(b);
  });
  document.querySelector('#title .logo').style.marginTop = '0';
  const t = document.getElementById('title'); t.style.justifyContent = 'flex-start'; t.style.overflowY = 'auto'; t.style.touchAction = 'pan-y'; t.style.gap = '16px';
})();
</script>
"""

def inline(m):
    src = m.group(1)
    code = '<script>\n' + open(w + src, encoding='utf-8').read().replace('</script', '<\\/script') + '\n</script>'
    if TEST and src == 'js/story.js':
        code = TEST_PRE + code
    return code

h = re.sub(r'<script src="([^"]+)"></script>', inline, h)
name = 'Exodo2942.html'
if TEST:
    h = h.replace('</body>', TEST_POST + '</body>')
    h = h.replace('<title>Éxodo 2942</title>', '<title>Éxodo 2942 · Prueba de estancias</title>')
    name = 'Exodo2942-prueba-estancias.html'
open(os.path.join(root, name), 'w', encoding='utf-8').write(h)
print('%s generado (%d KB)' % (name, len(h) // 1024))

"""Herramienta de traducción.

  python3 tools/i18n.py extract [lang]
      Lista numerada de los textos en español que aún no están traducidos
      en www/js/lang_<lang>.js (por defecto, en).

  python3 tools/i18n.py build <lista_es.txt> <lista_traducida.txt> [lang]
      Añade al diccionario las traducciones. Ambos ficheros usan el formato
      "N<TAB>texto" con los saltos de línea escritos como \\n.
"""
import json, os, re, sys

ROOT = os.path.join(os.path.dirname(__file__), '..')
JS = os.path.join(ROOT, 'www', 'js')
LIT = re.compile(r"'((?:[^'\\\n]|\\.)*)'")


def unescape(s):
    return s.replace("\\'", "'").replace('\\n', '\n').replace('\\\\', '\\')


def is_text(s):
    if len(s) < 2 or s.startswith('#') or s.startswith('url'):
        return False
    if re.fullmatch(r'[a-z0-9_\-\.\/]+', s):     # identificadores: 'dario', 'city', 'source-over'
        return False
    if re.search(r'\d+px|rgba?\(|system-ui|=>|\bvar\(', s):
        return False
    if not re.search(r'[A-Za-zÁÉÍÓÚÑáéíóúñ]', s):
        return False
    if re.fullmatch(r'[A-Za-z]{1,2}\d*', s):       # iniciales, claves cortas
        return False
    return True


def collect():
    out = []
    def add(s):
        if s not in out:
            out.append(s)
    # Datos: guion, estancias, metajuego
    for f in ['story.js', 'rooms.js', 'meta.js']:
        src = open(os.path.join(JS, f), encoding='utf-8').read()
        src = re.sub(r'^\s*//.*$', '', src, flags=re.M)
        src = re.sub(r'/\*.*?\*/', '', src, flags=re.S)
        for m in LIT.finditer(src):
            s = unescape(m.group(1))
            if is_text(s):
                add(s)
    # Motor: todo lo que se pasa a T(), y bloques de texto (citas, tutorial, fallos)
    src = open(os.path.join(JS, 'game.js'), encoding='utf-8').read()
    for line in src.split('\n'):
        if 'T(' in line or 'SKILLS =' in line or re.search(r"^\s*'«|text: '|manual: '", line):
            for m in LIT.finditer(line):
                s = unescape(m.group(1))
                if line.find("T('" + m.group(1) + "')") >= 0 or is_text(s):
                    add(s)
    # Interfaz: elementos con data-i18n
    html = open(os.path.join(ROOT, 'www', 'index.html'), encoding='utf-8').read()
    for m in re.finditer(r'<(\w+)[^>]*data-i18n[^>]*>(.*?)</\1>', html, re.S):
        s = m.group(2).strip()
        if s and '<' not in s:
            add(s)
    return out


def load_dict(lang):
    path = os.path.join(JS, 'lang_%s.js' % lang)
    if not os.path.exists(path):
        return {}
    src = open(path, encoding='utf-8').read()
    m = re.search(r'=\s*(\{.*\});?\s*$', src, re.S)
    return json.loads(m.group(1)) if m else {}


def save_dict(lang, d):
    path = os.path.join(JS, 'lang_%s.js' % lang)
    body = json.dumps(d, ensure_ascii=False, indent=1)
    open(path, 'w', encoding='utf-8').write(
        '/* Traducción (%s). Clave: texto original en español. Generado con tools/i18n.py. */\n'
        'window.LANG_%s = %s;\n' % (lang, lang.upper(), body))


def read_numbered(path):
    res = {}
    for line in open(path, encoding='utf-8'):
        line = line.rstrip('\n')
        if not line.strip() or '\t' not in line:
            continue
        n, txt = line.split('\t', 1)
        res[int(n)] = txt.replace('\\n', '\n')
    return res


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'extract'
    if cmd == 'extract':
        lang = sys.argv[2] if len(sys.argv) > 2 else 'en'
        d = load_dict(lang)
        missing = [s for s in collect() if s not in d]
        for i, s in enumerate(missing, 1):
            print('%d\t%s' % (i, s.replace('\n', '\\n')))
        print('# %d textos sin traducir' % len(missing), file=sys.stderr)
    elif cmd == 'build':
        es, tr = read_numbered(sys.argv[2]), read_numbered(sys.argv[3])
        lang = sys.argv[4] if len(sys.argv) > 4 else 'en'
        d = load_dict(lang)
        missing = [n for n in es if n not in tr]
        for n, s in es.items():
            if n in tr:
                d[s] = tr[n]
        save_dict(lang, d)
        print('Diccionario: %d entradas. Sin traducir: %s' % (len(d), missing or 'ninguna'))

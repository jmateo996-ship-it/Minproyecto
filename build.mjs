// Compila src/ en un único index.html autónomo (y una versión sin <html>/<head> para publicar).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const V = '0.160.0';
const parts = ['story.js', 'textures.js', 'audio.js', 'world.js', 'actors.js', 'main.js'].map(f => `// ---- ${f}\n` + readFileSync(`src/${f}`, 'utf8')).join('\n');
const head = `import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
`;
const scripts = `<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@${V}/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@${V}/examples/jsm/"}}</script>
<script type="module">
${head}
${parts}
</script>`;
const body = readFileSync('src/shell.html', 'utf8').replace('<!--SCRIPTS-->', () => scripts);
writeFileSync('index.html', `<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n</head>\n<body>\n${body}\n</body>\n</html>\n`);
mkdirSync('dist', { recursive: true });
writeFileSync('dist/artifact.html', body);
console.log('ok', (body.length / 1024).toFixed(0) + ' KB');

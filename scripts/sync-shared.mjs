// Copia shared/ a cada juego y genera su política de privacidad.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const apps = JSON.parse(fs.readFileSync(path.join(root, 'apps/apps.json'), 'utf8'));
// Edita estos valores antes de publicar (o define variables de entorno).
const DEVELOPER = process.env.DEVELOPER_NAME || 'el desarrollador';
const CONTACT = process.env.CONTACT_EMAIL || '[tu-email-de-contacto]';
const tpl = fs.readFileSync(path.join(root, 'shared/privacy.template.html'), 'utf8');
for (const a of apps) {
  const www = path.join(root, 'apps', a.dir, 'www');
  fs.mkdirSync(path.join(www, 'shared'), { recursive: true });
  for (const f of ['core.js', 'core.css']) fs.copyFileSync(path.join(root, 'shared', f), path.join(www, 'shared', f));
  const html = tpl.replaceAll('{{NAME}}', a.name).replaceAll('{{DEVELOPER}}', DEVELOPER)
    .replaceAll('{{CONTACT}}', CONTACT).replaceAll('{{DATE}}', new Date().toISOString().slice(0, 10));
  fs.writeFileSync(path.join(www, 'privacy.html'), html);
  console.log('✔', a.dir);
}

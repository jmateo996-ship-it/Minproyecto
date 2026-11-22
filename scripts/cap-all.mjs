// Ejecuta un comando de Capacitor en cada juego: node scripts/cap-all.mjs sync android
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const apps = JSON.parse(fs.readFileSync(path.join(root, 'apps/apps.json'), 'utf8'));
const only = process.env.APP;
for (const a of apps) {
  if (only && only !== a.dir) continue;
  console.log(`\n=== ${a.name} ===`);
  execSync(`npx cap ${process.argv.slice(2).join(' ')}`, { cwd: path.join(root, 'apps', a.dir), stdio: 'inherit' });
}

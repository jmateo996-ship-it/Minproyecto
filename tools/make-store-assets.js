// Genera resources/icon.png (1024x1024) y resources/splash.png (2732x2732)
// a partir de www/assets/icon.svg, para usarlos con `npx @capacitor/assets generate`.
// Requiere Playwright: npm i -D playwright && npx playwright install chromium
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const root = path.join(__dirname, '..');
  const svg = fs.readFileSync(path.join(root, 'www/assets/icon.svg'), 'utf8');
  fs.mkdirSync(path.join(root, 'resources'), { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1024, height: 1024 });
  await page.setContent(`<style>html,body{margin:0;background:#05030f}</style>${svg.replace('<svg ', '<svg width="1024" height="1024" ')}`);
  await page.screenshot({ path: path.join(root, 'resources/icon.png') });

  await page.setViewportSize({ width: 2732, height: 2732 });
  await page.setContent(`<style>html,body{margin:0;height:100%;background:radial-gradient(#1a1040,#05030f 70%);display:grid;place-items:center;font-family:system-ui;color:#e8f4ff}
    .t{font-size:220px;font-weight:900;letter-spacing:.18em;text-shadow:0 0 60px #4fd8ff}.n{font-size:150px;font-weight:300;letter-spacing:.5em;color:#ffb347;text-align:center;text-shadow:0 0 60px #ffb347}</style>
    <div><div class="t">ÉXODO</div><div class="n">2942</div></div>`);
  await page.screenshot({ path: path.join(root, 'resources/splash.png') });
  await browser.close();
  console.log('resources/icon.png y resources/splash.png generados');
})();

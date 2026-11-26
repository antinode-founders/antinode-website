// Render scripts/og-image.html to site/assets/img/og-image.png (social share image).
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(pathToFileURL(path.join(here, 'og-image.html')).href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(here, '../site/assets/img/og-image.png') });
await browser.close();
console.log('wrote site/assets/img/og-image.png');

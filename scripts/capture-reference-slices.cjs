const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outDir = path.join(process.cwd(), 'reference', 'slices');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://saapilot.framer.website/', { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(2500);

  const points = [
    ['hero', 0], ['about', 900], ['features-heading', 1950], ['features-grid-a', 2450],
    ['features-grid-b', 3250], ['how-heading', 3900], ['how-cards', 4450],
    ['advantage', 6500], ['testimonials', 7550], ['blog', 8550],
    ['cta', 9450], ['faq', 10100], ['footer', 10900],
  ];

  for (const [name, y] of points) {
    await page.evaluate((nextY) => window.scrollTo({ top: nextY, behavior: 'instant' }), y);
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, `${name}.png`) });
  }
  await browser.close();
  console.log(`Captured ${points.length} slices in ${outDir}`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

const { chromium } = require('playwright');

const url = process.argv[2] || 'http://127.0.0.1:4173/';
const screenshotPath = process.argv[3] || 'motion-analysis/local-server-check.png';
const chromePath = process.env.CHROME_EXECUTABLE || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleErrors = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
  await page.screenshot({ path: screenshotPath, fullPage: false });
  const result = await page.evaluate(() => ({
    title: document.title,
    textLength: document.body.innerText.trim().length,
    heading: document.querySelector('h1')?.textContent?.trim() || null,
    interactiveElements: document.querySelectorAll('a,button,input,select,textarea,[tabindex]').length,
    errorOverlay: Boolean(document.querySelector('[data-nextjs-dialog],.vite-error-overlay,#webpack-dev-server-client-overlay')),
    pageWidth: document.body.scrollWidth,
    pageHeight: document.body.scrollHeight,
  }));

  result.status = response?.status() || null;
  result.url = page.url();
  result.consoleErrors = consoleErrors;
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

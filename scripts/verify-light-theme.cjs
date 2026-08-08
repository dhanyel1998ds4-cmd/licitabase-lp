const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const baseUrl = process.argv[2] || 'http://127.0.0.1:4173';
const outputDir = path.resolve('verification/light-theme');
const chromePath = process.env.CHROME_EXECUTABLE || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const widths = [1440, 1024, 768, 430, 390, 320];
fs.mkdirSync(outputDir, { recursive: true });

async function inspect(page, expectedTheme) {
  return page.evaluate((theme) => {
    const localBrokenImages = Array.from(document.images)
      .filter((image) => image.src.startsWith(location.origin) && (!image.complete || image.naturalWidth === 0))
      .map((image) => image.src);
    return {
      theme: document.documentElement.dataset.theme,
      colorScheme: getComputedStyle(document.documentElement).colorScheme,
      themeColor: document.querySelector('meta[name="theme-color"]')?.content,
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      bodyBackground: getComputedStyle(document.body).backgroundColor,
      localBrokenImages,
      themedAssets: Array.from(document.querySelectorAll('[data-light-src]')).map((image) => image.getAttribute('src')),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      expectedTheme: theme,
    };
  }, expectedTheme);
}

async function loadLocalImages(page) {
  await page.evaluate(async () => {
    const images = Array.from(document.images).filter((image) => image.src.startsWith(location.origin));
    images.forEach((image) => { image.loading = 'eager'; });
    await Promise.all(images.map((image) => image.decode().catch(() => null)));
  });
}

async function captureSection(page, selector, filename) {
  const section = page.locator(selector);
  await section.scrollIntoViewIfNeeded();
  await page.evaluate((targetSelector) => {
    document.querySelectorAll(`${targetSelector} .reveal, ${targetSelector}.reveal`).forEach((element) => {
      element.classList.add('is-visible', 'motion-complete');
      element.style.opacity = '1';
      element.style.transform = 'none';
    });
  }, selector);
  await page.waitForTimeout(350);
  await section.screenshot({ path: path.join(outputDir, filename) });
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const results = [];

  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: width <= 430 ? 844 : 900 } });
    const page = await context.newPage();
    const localFailures = [];
    page.on('requestfailed', (request) => {
      if (request.url().startsWith(baseUrl)) localFailures.push(`${request.method()} ${request.url()}`);
    });

    const response = await page.goto(`${baseUrl}/light/`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.evaluate(() => document.fonts?.ready).catch(() => {});
    await loadLocalImages(page);
    await page.waitForTimeout(700);
    const inspection = await inspect(page, 'light');
    const annual = page.locator('[data-pricing-cycle="annual"]');
    await annual.scrollIntoViewIfNeeded();
    await annual.click();
    const comparisonHref = await page.locator('[data-comparison-link]').getAttribute('href');

    if ([1440, 390].includes(width)) {
      await page.screenshot({ path: path.join(outputDir, `landing-${width}.png`), fullPage: true });
      const captures = width === 1440
        ? [['#about', 'about'], ['#features', 'features'], ['.how-sticky', 'workflow'], ['#funcionalidades', 'command'], ['#pricing', 'pricing'], ['#final-cta', 'cta'], ['.faq', 'faq'], ['#footer', 'footer']]
        : [['#features', 'features'], ['#how', 'workflow'], ['#pricing', 'pricing'], ['#final-cta', 'cta']];
      for (const [selector, name] of captures) {
        await captureSection(page, selector, `landing-${width}-${name}.png`);
      }
    }

    results.push({ route: '/light/', width, status: response?.status(), comparisonHref, localFailures, ...inspection });
    await context.close();
  }

  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width <= 430 ? 844 : 900 } });
    const page = await context.newPage();
    const response = await page.goto(`${baseUrl}/light/planos/comparar?ciclo=annual`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.evaluate(() => document.fonts?.ready).catch(() => {});
    await page.waitForTimeout(500);
    const inspection = await inspect(page, 'light');
    const backHref = await page.locator('[data-pricing-back]').getAttribute('href');
    const landingLinks = await page.locator('a[href^="/light/"]').count();
    await page.screenshot({ path: path.join(outputDir, `comparison-${width}.png`), fullPage: true });
    results.push({ route: '/light/planos/comparar', width, status: response?.status(), backHref, landingLinks, ...inspection });
    await context.close();
  }

  const darkContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const darkPage = await darkContext.newPage();
  const darkResponse = await darkPage.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await loadLocalImages(darkPage);
  await darkPage.waitForTimeout(300);
  results.push({ route: '/', width: 1440, status: darkResponse?.status(), ...(await inspect(darkPage, 'dark')) });
  await darkContext.close();

  const failures = results.filter((result) => (
    result.status !== 200
    || result.theme !== result.expectedTheme
    || result.horizontalOverflow
    || result.localBrokenImages.length
    || (result.localFailures && result.localFailures.length)
  ));

  console.log(JSON.stringify({ passed: failures.length === 0, failures, results }, null, 2));
  await browser.close();
  if (failures.length) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

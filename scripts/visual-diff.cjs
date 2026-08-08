const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch').default;
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const referenceUrl = 'https://saapilot.framer.website/';
const localUrl = 'http://127.0.0.1:4173/';
const outputDir = path.join(process.cwd(), 'visual-comparison');

const viewports = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '430x932', width: 430, height: 932 },
  { name: '390x844', width: 390, height: 844 },
  { name: '375x812', width: 375, height: 812 },
  { name: '360x800', width: 360, height: 800 },
];

const sectionTitles = [
  'Build Your AI Chatbots Agent Without Code',
  'What Makes Us Different',
  'How Our AI Agent Works',
  'Why Choose Our AI Agent?',
  'What Our Customers Are Saying',
  'Insights, Tips & AI Trends',
  'Ready to Automate Your Customer Interactions?',
  'Frequently Asked Questions',
];

fs.mkdirSync(outputDir, { recursive: true });
for (const folder of ['reference', 'local', 'diff']) {
  fs.mkdirSync(path.join(outputDir, folder), { recursive: true });
}

async function scrollThrough(page, viewport) {
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = Math.max(500, Math.round(viewport.height * 0.82));
  for (let y = 0; y < pageHeight; y += step) {
    await page.evaluate((nextY) => window.scrollTo({ top: nextY, behavior: 'instant' }), y);
    await page.waitForTimeout(30);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(500);
}

async function inspectPage(page) {
  return page.evaluate((titles) => {
    const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim();
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4'));
    return {
      page: {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      },
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      headings: titles.map((title) => {
        const element = headings.find((candidate) => normalize(candidate.textContent) === title);
        if (!element) return { title, missing: true };
        const bounds = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          title,
          x: Math.round(bounds.x),
          y: Math.round(bounds.y + window.scrollY),
          width: Math.round(bounds.width),
          height: Math.round(bounds.height),
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
          fontWeight: style.fontWeight,
        };
      }),
    };
  }, sectionTitles);
}

async function capture(page, viewport, url, kind) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.evaluate(() => Promise.race([
    document.fonts?.ready || Promise.resolve(),
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ])).catch(() => {});
  await page.waitForFunction(
    () => Array.from(document.images)
      .filter((image) => image.getBoundingClientRect().top < window.innerHeight * 1.2)
      .every((image) => image.complete),
    { timeout: 10000 },
  ).catch(() => {});
  if (kind === 'local') {
    await page.waitForFunction(() => {
      const heroElements = Array.from(document.querySelectorAll('.hero-load'));
      return !heroElements.length || heroElements.every((element) => element.classList.contains('motion-complete'));
    }, { timeout: 4000 }).catch(() => {});
  }
  await page.waitForTimeout(kind === 'reference' ? 2400 : 150);
  const topPath = path.join(outputDir, kind, `${viewport.name}-top.png`);
  await page.screenshot({ path: topPath });
  await scrollThrough(page, viewport);
  const inspection = await inspectPage(page);
  const fullPath = path.join(outputDir, kind, `${viewport.name}-full.png`);
  await page.screenshot({ path: fullPath, fullPage: true });
  return { inspection, fullPath, topPath };
}

async function compareImages(referencePath, localPath, viewport, referenceHeight, localHeight) {
  const compareWidth = Math.min(720, viewport.width);
  const compareHeight = Math.max(1, Math.round(viewport.height * (compareWidth / viewport.width)));

  const normalize = async (filePath) => sharp(filePath)
    .flatten({ background: '#04050e' })
    .resize(compareWidth, compareHeight, { fit: 'fill' })
    .png()
    .toBuffer();

  const [referenceBuffer, localBuffer] = await Promise.all([
    normalize(referencePath),
    normalize(localPath),
  ]);
  const referencePng = PNG.sync.read(referenceBuffer);
  const localPng = PNG.sync.read(localBuffer);
  const diffPng = new PNG({ width: compareWidth, height: compareHeight });
  const differentPixels = pixelmatch(
    referencePng.data,
    localPng.data,
    diffPng.data,
    compareWidth,
    compareHeight,
    { threshold: 0.18, includeAA: false, alpha: 0.42 },
  );
  const totalPixels = compareWidth * compareHeight;
  const similarity = (1 - differentPixels / totalPixels) * 100;
  const diffPath = path.join(outputDir, 'diff', `${viewport.name}.png`);
  fs.writeFileSync(diffPath, PNG.sync.write(diffPng));

  return {
    referenceHeight,
    localHeight,
    heightDifference: localHeight - referenceHeight,
    heightDifferencePercent: Number((((localHeight - referenceHeight) / referenceHeight) * 100).toFixed(2)),
    topViewportPixelSimilarity: Number(similarity.toFixed(2)),
    comparedPixels: totalPixels,
    differentPixels,
    diffPath,
  };
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  const refreshViewport = process.env.LOCAL_REFRESH_VIEWPORT;
  const useExistingReference = process.env.USE_EXISTING_REFERENCE === '1';
  const previousReportPath = path.join(outputDir, 'report.json');
  const previousReport = useExistingReference && fs.existsSync(previousReportPath)
    ? JSON.parse(fs.readFileSync(previousReportPath, 'utf8'))
    : null;
  if (refreshViewport) {
    const viewport = viewports.find((candidate) => candidate.name === refreshViewport);
    if (!viewport) throw new Error(`Unknown viewport: ${refreshViewport}`);
    const local = await capture(page, viewport, localUrl, 'local');
    const reportPath = path.join(outputDir, 'report.json');
    if (fs.existsSync(reportPath)) {
      const prior = JSON.parse(fs.readFileSync(reportPath, 'utf8'))?.results?.[viewport.name];
      if (prior) {
        const comparison = await compareImages(
          path.join(outputDir, 'reference', `${viewport.name}-top.png`),
          local.topPath,
          viewport,
          prior.reference.page.height,
          local.inspection.page.height,
        );
        console.log(JSON.stringify(comparison, null, 2));
      }
    }
    await browser.close();
    console.log(`Refreshed local screenshots for ${refreshViewport}`);
    return;
  }
  const localConsoleErrors = [];
  const localPageErrors = [];
  const failedRequests = [];
  let activeKind = '';

  page.on('console', (message) => {
    if (activeKind === 'local' && message.type() === 'error') localConsoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => {
    if (activeKind === 'local') localPageErrors.push(error.message);
  });
  page.on('requestfailed', (request) => {
    if (activeKind === 'local') failedRequests.push({ url: request.url(), error: request.failure()?.errorText });
  });

  const report = {
    createdAt: new Date().toISOString(),
    referenceUrl,
    localUrl,
    results: {},
    localConsoleErrors,
    localPageErrors,
    failedRequests,
  };

  for (const viewport of viewports) {
    activeKind = 'reference';
    const priorResult = previousReport?.results?.[viewport.name];
    const reference = useExistingReference && priorResult
      ? {
          inspection: priorResult.reference,
          topPath: path.join(outputDir, 'reference', `${viewport.name}-top.png`),
          fullPath: path.join(outputDir, 'reference', `${viewport.name}-full.png`),
        }
      : await capture(page, viewport, referenceUrl, 'reference');
    activeKind = 'local';
    const local = await capture(page, viewport, localUrl, 'local');
    const comparison = await compareImages(
      reference.topPath,
      local.topPath,
      viewport,
      reference.inspection.page.height,
      local.inspection.page.height,
    );
    report.results[viewport.name] = {
      viewport,
      reference: reference.inspection,
      local: local.inspection,
      comparison,
    };
    console.log(`${viewport.name}: ${comparison.topViewportPixelSimilarity}% top similarity, height ${comparison.heightDifference >= 0 ? '+' : ''}${comparison.heightDifference}px`);
  }

  const similarities = Object.values(report.results).map((result) => result.comparison.topViewportPixelSimilarity);
  report.summary = {
    averageTopViewportPixelSimilarity: Number((similarities.reduce((sum, value) => sum + value, 0) / similarities.length).toFixed(2)),
    minimumTopViewportPixelSimilarity: Math.min(...similarities),
    maximumTopViewportPixelSimilarity: Math.max(...similarities),
    viewportsWithHorizontalOverflow: Object.entries(report.results)
      .filter(([, result]) => result.local.horizontalOverflow)
      .map(([name]) => name),
  };

  fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify(report.summary, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

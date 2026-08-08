const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const url = process.argv[2] || 'http://127.0.0.1:4173/?v=animation-proof';
const outputDir = path.resolve('verification');
const chromePath = process.env.CHROME_EXECUTABLE || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
fs.mkdirSync(outputDir, { recursive: true });

async function captureText(page, scrollY, name, settle = 260) {
  await page.evaluate((nextY) => window.scrollTo(0, nextY), scrollY);
  await page.waitForTimeout(settle);
  const locator = page.locator('.about-copy');
  const box = await locator.boundingBox();
  const clip = {
    x: Math.max(0, box.x - 16),
    y: Math.max(0, box.y - 62),
    width: Math.min(1440 - Math.max(0, box.x - 16), box.width + 32),
    height: Math.min(900 - Math.max(0, box.y - 62), box.height + 78),
  };
  await page.screenshot({ path: path.join(outputDir, name), clip });
  return page.evaluate(() => {
    const element = document.querySelector('[data-scroll-letters]');
    const words = Array.from(element.querySelectorAll('.about-word:not(.is-leading)'));
    const whiteWords = words.filter((word) => getComputedStyle(word).color === 'rgb(255, 255, 255)').length;
    return {
      progress: Number(getComputedStyle(element).getPropertyValue('--about-reveal-progress')),
      whiteWords,
      totalWords: words.length,
    };
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: path.join(outputDir, 'proof-01-hero.png') });

  const textTop = await page.evaluate(() => {
    let top = 0;
    let current = document.querySelector('[data-scroll-letters]');
    while (current) {
      top += current.offsetTop;
      current = current.offsetParent;
    }
    return top;
  });
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  const startY = textTop - viewportHeight * 0.78 - 16;
  const middleY = textTop - viewportHeight * 0.49;
  const endY = textTop - viewportHeight * 0.2 + 16;
  const textInitial = await captureText(page, startY, 'proof-02-text-initial.png', 1100);
  const textMiddle = await captureText(page, middleY, 'proof-03-text-middle.png');
  const textComplete = await captureText(page, endY, 'proof-04-text-complete.png');
  const textReturned = await captureText(page, startY, 'proof-05-text-returned.png');

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(500);
  const statsY = await page.evaluate(() => {
    let top = 0;
    let current = document.querySelector('.stats');
    while (current) {
      top += current.offsetTop;
      current = current.offsetParent;
    }
    return top - window.innerHeight * 0.55;
  });
  await page.evaluate((nextY) => window.scrollTo(0, nextY), statsY);
  await page.waitForTimeout(220);
  const statsProgressive = await page.evaluate(() => ({
    values: Array.from(document.querySelectorAll('.stats [data-count]')).map((element) => element.textContent.trim()),
    opacities: Array.from(document.querySelectorAll('.stats article')).map((element) => Number(getComputedStyle(element).opacity)),
  }));
  const progressiveBox = await page.locator('.stats').boundingBox();
  await page.screenshot({ path: path.join(outputDir, 'proof-06-stats-progressive.png'), clip: progressiveBox, animations: 'allow' });
  await page.waitForTimeout(2100);
  const statsComplete = await page.evaluate(() => ({
    values: Array.from(document.querySelectorAll('.stats [data-count]')).map((element) => element.textContent.trim()),
    opacities: Array.from(document.querySelectorAll('.stats article')).map((element) => Number(getComputedStyle(element).opacity)),
  }));
  const completeBox = await page.locator('.stats').boundingBox();
  await page.screenshot({ path: path.join(outputDir, 'proof-07-stats-complete.png'), clip: completeBox, animations: 'allow' });

  const workflowThresholds = await page.evaluate(() => {
    const targets = ['#step-trigger-activate', '#step-trigger-1', '#step-trigger-2']
      .map((selector) => document.querySelector(selector));
    return targets.map((target) => (
      target.getBoundingClientRect().top
      + window.scrollY
      - (window.innerHeight - target.offsetHeight * 0.5)
    ));
  });
  const workflowPositions = [
    workflowThresholds[0] - 60,
    workflowThresholds[0] + 200,
    workflowThresholds[1] + 200,
    workflowThresholds[2] + 250,
  ];
  const workflowStates = [];
  await page.addStyleTag({ content: '.site-header { visibility: hidden !important; }' });
  for (let index = 0; index < workflowPositions.length; index += 1) {
    await page.evaluate((nextY) => window.scrollTo(0, nextY), workflowPositions[index]);
    await page.waitForTimeout(180);
    workflowStates.push(await page.evaluate(() => ({
      scrollY: Math.round(window.scrollY),
      cardOpacity: Array.from(document.querySelectorAll('.how-card'))
        .map((card) => Number(getComputedStyle(card).opacity)),
      activeMarkers: Array.from(document.querySelectorAll('.step-line span'))
        .map((marker) => marker.classList.contains('is-active')),
      lineProgress: Number(
        new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.step-line i')).transform).m11.toFixed(3),
      ),
    })));
    await page.screenshot({
      path: path.join(outputDir, `proof-workflow-0${index}-desktop.png`),
      animations: 'allow',
    });
  }

  const report = {
    url: page.url(),
    title: await page.title(),
    textInitial,
    textMiddle,
    textComplete,
    textReturned,
    statsProgressive,
    statsComplete,
    workflowStates,
    errors,
  };
  fs.writeFileSync(path.join(outputDir, 'animation-proof-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

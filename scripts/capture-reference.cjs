const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const url = 'https://saapilot.framer.website/';
const outDir = path.join(process.cwd(), 'reference');
fs.mkdirSync(outDir, { recursive: true });

const viewports = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  const report = { url, capturedAt: new Date().toISOString(), viewports: {} };

  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(2500);
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < pageHeight; y += Math.max(500, Math.round(viewport.height * 0.72))) {
      await page.evaluate((nextY) => window.scrollTo({ top: nextY, behavior: 'instant' }), y);
      await page.waitForTimeout(90);
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(900);
    await page.screenshot({
      path: path.join(outDir, `${viewport.name}.png`),
      fullPage: true,
    });

    report.viewports[viewport.name] = await page.evaluate(() => {
      const compact = (value) => (value || '').replace(/\s+/g, ' ').trim();
      const rect = (element) => {
        const r = element.getBoundingClientRect();
        return {
          x: Math.round(r.x),
          y: Math.round(r.y + window.scrollY),
          width: Math.round(r.width),
          height: Math.round(r.height),
        };
      };
      const style = (element) => {
        const s = getComputedStyle(element);
        return {
          display: s.display,
          position: s.position,
          color: s.color,
          backgroundColor: s.backgroundColor,
          backgroundImage: s.backgroundImage,
          fontFamily: s.fontFamily,
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
          lineHeight: s.lineHeight,
          letterSpacing: s.letterSpacing,
          borderRadius: s.borderRadius,
          border: s.border,
          boxShadow: s.boxShadow,
          padding: s.padding,
          gap: s.gap,
        };
      };

      const visible = (element) => {
        const r = element.getBoundingClientRect();
        const s = getComputedStyle(element);
        return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
      };

      const nodes = Array.from(document.querySelectorAll('body *')).filter(visible);
      const count = (getter) => {
        const map = new Map();
        for (const node of nodes) {
          const value = getter(getComputedStyle(node));
          if (!value) continue;
          map.set(value, (map.get(value) || 0) + 1);
        }
        return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20);
      };

      const landmarks = Array.from(document.querySelectorAll('header, nav, main, section, footer'))
        .filter(visible)
        .map((element, index) => ({
          index,
          tag: element.tagName.toLowerCase(),
          id: element.id,
          className: typeof element.className === 'string' ? element.className.slice(0, 220) : '',
          bounds: rect(element),
          style: style(element),
          text: compact(element.innerText).slice(0, 500),
        }));

      const textElements = Array.from(document.querySelectorAll('h1,h2,h3,h4,p,a,button'))
        .filter(visible)
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          text: compact(element.innerText).slice(0, 300),
          href: element.href || null,
          bounds: rect(element),
          style: style(element),
        }));

      const images = Array.from(document.images).map((image) => ({
        src: image.currentSrc || image.src,
        alt: image.alt,
        loading: image.loading,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        bounds: rect(image),
        style: style(image),
      }));

      return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content || '',
        page: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
        htmlClass: document.documentElement.className,
        bodyStyle: style(document.body),
        landmarks,
        textElements,
        images,
        stylesheets: Array.from(document.styleSheets).map((sheet) => sheet.href).filter(Boolean),
        colors: count((s) => s.color),
        backgrounds: count((s) => s.backgroundColor),
        fonts: count((s) => `${s.fontFamily}|${s.fontSize}|${s.fontWeight}|${s.lineHeight}`),
      };
    });
    report.viewports[viewport.name].consoleErrors = consoleErrors;
    await context.close();
  }

  fs.writeFileSync(path.join(outDir, 'analysis.json'), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify({
    output: outDir,
    viewports: Object.fromEntries(Object.entries(report.viewports).map(([name, data]) => [name, data.page])),
  }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const url = process.argv[2] || 'https://saapilot.framer.website/';
const output = path.resolve(process.argv[3] || 'motion-analysis/live-inspection.json');
const screenshot = path.resolve('motion-analysis/live-initial-1920x975.png');
const chromePath = process.env.CHROME_EXECUTABLE || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function animationSnapshot(page, label) {
  return page.evaluate((snapshotLabel) => {
    const selectorFor = (element) => {
      if (!element) return null;
      if (element.id) return `#${CSS.escape(element.id)}`;
      const parts = [];
      let node = element;
      for (let depth = 0; node && node.nodeType === 1 && depth < 4; depth += 1) {
        const tag = node.tagName.toLowerCase();
        const classes = [...node.classList].slice(0, 2).map((name) => `.${CSS.escape(name)}`).join('');
        parts.unshift(`${tag}${classes}`);
        node = node.parentElement;
      }
      return parts.join(' > ');
    };
    return {
      label: snapshotLabel,
      timeMs: Math.round(performance.now()),
      animations: document.getAnimations({ subtree: true }).map((animation) => {
        const effect = animation.effect;
        const target = effect && effect.target;
        let keyframes = [];
        let timing = null;
        try {
          keyframes = effect.getKeyframes();
          timing = effect.getComputedTiming();
        } catch {}
        return {
          target: selectorFor(target),
          tag: target?.tagName || null,
          text: target?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 100) || null,
          playState: animation.playState,
          currentTime: typeof animation.currentTime === 'number' ? animation.currentTime : null,
          playbackRate: animation.playbackRate,
          startTime: animation.startTime,
          timeline: animation.timeline?.constructor?.name || null,
          animationType: animation.constructor?.name || null,
          timing,
          keyframes,
        };
      }),
    };
  }, label);
}

(async () => {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const context = await browser.newContext({ viewport: { width: 1920, height: 975 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const consoleMessages = [];
  const pageErrors = [];
  const responses = [];
  page.on('console', (message) => consoleMessages.push({ type: message.type(), text: message.text().slice(0, 500) }));
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  page.on('response', (response) => {
    const type = response.request().resourceType();
    if (['document', 'script', 'stylesheet', 'font'].includes(type)) {
      responses.push({ type, status: response.status(), url: response.url() });
    }
  });

  await page.addInitScript(() => {
    window.__capturedAnimateCalls = [];
    const originalAnimate = Element.prototype.animate;
    Element.prototype.animate = function patchedAnimate(keyframes, options) {
      try {
        window.__capturedAnimateCalls.push({
          atMs: Math.round(performance.now()),
          tag: this.tagName,
          id: this.id || null,
          className: typeof this.className === 'string' ? this.className.slice(0, 220) : null,
          text: this.textContent?.replace(/\s+/g, ' ').trim().slice(0, 100) || null,
          keyframes,
          options,
        });
      } catch {}
      return originalAnimate.call(this, keyframes, options);
    };
  });

  const startedAt = Date.now();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const loadSnapshots = [];
  loadSnapshots.push(await animationSnapshot(page, 'domcontentloaded'));
  await page.waitForTimeout(100);
  loadSnapshots.push(await animationSnapshot(page, 'load+100ms'));
  await page.waitForTimeout(400);
  loadSnapshots.push(await animationSnapshot(page, 'load+500ms'));
  await page.waitForTimeout(700);
  loadSnapshots.push(await animationSnapshot(page, 'load+1200ms'));
  await page.waitForTimeout(1300);
  loadSnapshots.push(await animationSnapshot(page, 'load+2500ms'));
  await page.screenshot({ path: screenshot, fullPage: false });

  const base = await page.evaluate(() => {
    const clean = (value) => value?.replace(/\s+/g, ' ').trim();
    const rect = (element) => {
      const r = element.getBoundingClientRect();
      return { x: +r.x.toFixed(2), y: +r.y.toFixed(2), width: +r.width.toFixed(2), height: +r.height.toFixed(2), top: +r.top.toFixed(2), bottom: +r.bottom.toFixed(2) };
    };
    const selectorFor = (element) => {
      if (element.id) return `#${CSS.escape(element.id)}`;
      const classes = [...element.classList].slice(0, 3).map((name) => `.${CSS.escape(name)}`).join('');
      return `${element.tagName.toLowerCase()}${classes}`;
    };
    const all = [...document.querySelectorAll('*')];
    const animatedStyles = all.map((element) => {
      const style = getComputedStyle(element);
      const hasMotion = style.animationName !== 'none' || style.transitionDuration.split(',').some((v) => parseFloat(v) > 0) || style.position === 'sticky' || style.position === 'fixed' || style.scrollTimelineName !== 'none' || style.viewTimelineName !== 'none';
      if (!hasMotion) return null;
      return {
        selector: selectorFor(element),
        text: clean(element.textContent)?.slice(0, 100) || null,
        rect: rect(element),
        position: style.position,
        animationName: style.animationName,
        animationDuration: style.animationDuration,
        animationDelay: style.animationDelay,
        animationTimingFunction: style.animationTimingFunction,
        animationIterationCount: style.animationIterationCount,
        animationPlayState: style.animationPlayState,
        transitionProperty: style.transitionProperty,
        transitionDuration: style.transitionDuration,
        transitionDelay: style.transitionDelay,
        transitionTimingFunction: style.transitionTimingFunction,
        scrollTimelineName: style.scrollTimelineName,
        viewTimelineName: style.viewTimelineName,
        transform: style.transform,
        opacity: style.opacity,
        overflow: style.overflow,
        backdropFilter: style.backdropFilter,
      };
    }).filter(Boolean);

    const headings = [...document.querySelectorAll('h1,h2,h3')].map((element) => ({
      tag: element.tagName,
      text: clean(element.textContent),
      rect: rect(element),
      selector: selectorFor(element),
    }));

    const interactive = [...document.querySelectorAll('a,button,input,summary,[role="button"]')].map((element) => {
      const style = getComputedStyle(element);
      return {
        tag: element.tagName,
        text: clean(element.textContent)?.slice(0, 120) || null,
        href: element.href || null,
        type: element.type || null,
        ariaLabel: element.getAttribute('aria-label'),
        selector: selectorFor(element),
        rect: rect(element),
        transition: style.transition,
        cursor: style.cursor,
      };
    });

    const styleTexts = [...document.querySelectorAll('style')].map((style, index) => ({ index, text: style.textContent })).filter((item) => /@keyframes|animation|transition|sticky|scroll-timeline|view-timeline/i.test(item.text));
    return {
      title: document.title,
      url: location.href,
      lang: document.documentElement.lang,
      userAgent: navigator.userAgent,
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
      page: { scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight },
      rootComputed: {
        scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
        colorScheme: getComputedStyle(document.documentElement).colorScheme,
      },
      scripts: [...document.scripts].map((script) => ({ src: script.src || null, type: script.type || null, async: script.async, defer: script.defer, textStart: script.src ? null : script.textContent.slice(0, 300) })),
      stylesheets: [...document.styleSheets].map((sheet) => sheet.href || 'inline'),
      styleTexts,
      headings,
      animatedStyles,
      interactive,
      framerMeta: [...document.querySelectorAll('meta')].map((meta) => ({ name: meta.name, property: meta.getAttribute('property'), content: meta.content })).filter((meta) => /framer/i.test(`${meta.name} ${meta.property} ${meta.content}`)),
      htmlClasses: document.documentElement.className,
      bodyClasses: document.body.className,
    };
  });

  const scrollSnapshots = [];
  const scrollMax = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const step = 300;
  for (let y = 0; y <= scrollMax; y += step) {
    await page.evaluate((nextY) => scrollTo(0, nextY), y);
    await page.waitForTimeout(80);
    const state = await page.evaluate(() => {
      const clean = (value) => value?.replace(/\s+/g, ' ').trim();
      const visibleHeadings = [...document.querySelectorAll('h1,h2,h3')].map((element) => {
        const r = element.getBoundingClientRect();
        if (r.bottom < -100 || r.top > innerHeight + 100) return null;
        const s = getComputedStyle(element);
        return { text: clean(element.textContent), top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1), opacity: s.opacity, transform: s.transform };
      }).filter(Boolean);
      const stickyFixed = [...document.querySelectorAll('*')].map((element) => {
        const s = getComputedStyle(element);
        if (!['sticky', 'fixed'].includes(s.position)) return null;
        const r = element.getBoundingClientRect();
        return { tag: element.tagName, text: clean(element.textContent)?.slice(0, 80) || null, position: s.position, topRule: s.top, leftRule: s.left, rect: { x: +r.x.toFixed(1), y: +r.y.toFixed(1), width: +r.width.toFixed(1), height: +r.height.toFixed(1) }, transform: s.transform, opacity: s.opacity };
      }).filter(Boolean);
      const activeAnimations = document.getAnimations({ subtree: true }).filter((animation) => animation.playState !== 'finished').map((animation) => {
        const target = animation.effect?.target;
        const timing = animation.effect?.getComputedTiming?.();
        return { tag: target?.tagName || null, text: clean(target?.textContent)?.slice(0, 80) || null, playState: animation.playState, currentTime: animation.currentTime, duration: timing?.duration, progress: timing?.progress, timeline: animation.timeline?.constructor?.name || null };
      });
      return { y: Math.round(scrollY), visibleHeadings, stickyFixed, activeAnimations };
    });
    scrollSnapshots.push(state);
  }

  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(250);
  const reverseSnapshots = [];
  for (let y = scrollMax; y >= 0; y -= 600) {
    await page.evaluate((nextY) => scrollTo(0, nextY), y);
    await page.waitForTimeout(60);
    reverseSnapshots.push(await page.evaluate(() => ({ y: Math.round(scrollY), animations: document.getAnimations({ subtree: true }).filter((a) => a.playState !== 'finished').length })));
  }

  const capturedAnimateCalls = await page.evaluate(() => window.__capturedAnimateCalls || []);
  const result = {
    capturedAt: new Date().toISOString(),
    url,
    navigationMs: Date.now() - startedAt,
    base,
    loadSnapshots,
    scrollSnapshots,
    reverseSnapshots,
    capturedAnimateCalls,
    responses,
    consoleMessages,
    pageErrors,
  };
  fs.writeFileSync(output, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ output, screenshot, title: base.title, page: base.page, headings: base.headings.length, animatedStyles: base.animatedStyles.length, loadAnimations: loadSnapshots.map((s) => s.animations.length), animateCalls: capturedAnimateCalls.length, resources: responses.length, scrollSnapshots: scrollSnapshots.length, consoleErrors: consoleMessages.filter((m) => m.type === 'error').length, pageErrors: pageErrors.length }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

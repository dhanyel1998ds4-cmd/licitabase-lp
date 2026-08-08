const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const url = process.argv[2] || 'https://saapilot.framer.website/';
const output = path.resolve(process.argv[3] || 'motion-analysis/interaction-inspection.json');
const chromePath = process.env.CHROME_EXECUTABLE || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const round = (value, digits = 2) => Number(Number(value).toFixed(digits));

async function openPage(browser, viewport, options = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: options.reducedMotion || 'no-preference' });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(options.waitMs ?? 2400);
  return { context, page };
}

async function workflowState(page, requestedY) {
  await page.evaluate((y) => scrollTo(0, y), requestedY);
  await page.waitForTimeout(70);
  return page.evaluate(() => {
    const root = document.querySelector('#step-trigger-activate');
    if (!root) return { scrollY, missing: true };
    const box = (element) => {
      const r = element.getBoundingClientRect();
      return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), width: +r.width.toFixed(1), height: +r.height.toFixed(1), bottom: +r.bottom.toFixed(1) };
    };
    const ownText = (element) => [...element.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent).join(' ').replace(/\s+/g, ' ').trim();
    const relevant = [...root.querySelectorAll('[data-framer-name], [id]')].map((element) => {
      const s = getComputedStyle(element);
      return {
        id: element.id || null,
        name: element.getAttribute('data-framer-name'),
        tag: element.tagName,
        ownText: ownText(element).slice(0, 100) || null,
        text: element.children.length <= 2 ? element.textContent.replace(/\s+/g, ' ').trim().slice(0, 110) || null : null,
        rect: box(element),
        opacity: s.opacity,
        transform: s.transform,
        filter: s.filter,
        visibility: s.visibility,
        display: s.display,
        position: s.position,
      };
    }).filter((item) => item.id || item.name || item.ownText);
    const markers = ['01', '02', '03', 'Create and launch Agent', 'Empower Your AI Agent', 'Grow and Scale Your AI Agent'].map((label) => {
      const matches = [...root.querySelectorAll('*')].filter((element) => element.textContent.replace(/\s+/g, ' ').trim() === label);
      const element = matches.sort((a, b) => a.children.length - b.children.length)[0];
      if (!element) return { label, missing: true };
      const s = getComputedStyle(element);
      return { label, tag: element.tagName, name: element.getAttribute('data-framer-name'), rect: box(element), opacity: s.opacity, transform: s.transform, color: s.color };
    });
    return { scrollY: Math.round(scrollY), root: { rect: box(root), position: getComputedStyle(root).position, top: getComputedStyle(root).top }, markers, relevant };
  });
}

async function styleTree(page, locator) {
  return locator.evaluate((root) => {
    const box = (element) => {
      const r = element.getBoundingClientRect();
      return { x: +r.x.toFixed(2), y: +r.y.toFixed(2), width: +r.width.toFixed(2), height: +r.height.toFixed(2) };
    };
    return [root, ...root.querySelectorAll('*')].slice(0, 40).map((element) => {
      const s = getComputedStyle(element);
      return {
        tag: element.tagName,
        name: element.getAttribute('data-framer-name'),
        className: typeof element.className === 'string' ? element.className.slice(0, 160) : null,
        text: element.children.length === 0 ? element.textContent.replace(/\s+/g, ' ').trim().slice(0, 80) || null : null,
        rect: box(element),
        opacity: s.opacity,
        transform: s.transform,
        backgroundColor: s.backgroundColor,
        color: s.color,
        borderColor: s.borderColor,
        boxShadow: s.boxShadow,
        filter: s.filter,
      };
    });
  });
}

async function animationTree(page, locator) {
  return locator.evaluate((root) => document.getAnimations({ subtree: true }).map((animation) => {
    const target = animation.effect?.target;
    if (target !== root && !root.contains(target)) return null;
    const timing = animation.effect?.getComputedTiming?.();
    const keyframes = animation.effect?.getKeyframes?.() || [];
    return {
      targetName: target?.getAttribute?.('data-framer-name') || null,
      targetText: target?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 80) || null,
      playState: animation.playState,
      currentTime: typeof animation.currentTime === 'number' ? animation.currentTime : null,
      timing,
      firstKeyframe: keyframes[0] || null,
      lastKeyframe: keyframes[keyframes.length - 1] || null,
    };
  }).filter(Boolean));
}

async function responsiveState(browser, width, height) {
  const { context, page } = await openPage(browser, { width, height });
  const state = await page.evaluate(() => {
    const rd = (value) => Number(Number(value).toFixed(2));
    const root = document.querySelector('#step-trigger-activate');
    const heading = [...document.querySelectorAll('h1,h2,h3')].find((element) => element.textContent.includes('How Our AI Agent Works'));
    const r = root?.getBoundingClientRect();
    return {
      viewport: { width: innerWidth, height: innerHeight },
      page: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
      breakpointClasses: document.body.className,
      root: root ? { position: getComputedStyle(root).position, top: getComputedStyle(root).top, rect: { x: rd(r.x), y: rd(r.y), width: rd(r.width), height: rd(r.height) } } : null,
      headingTop: heading ? rd(heading.getBoundingClientRect().top + scrollY) : null,
      navLabels: [...document.querySelectorAll('nav a, header a')].map((element) => element.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean),
    };
  });
  if (state.root) {
    const targetY = Math.max(0, state.root.rect.y - 170);
    await page.evaluate((y) => scrollTo(0, y), targetY);
    await page.waitForTimeout(100);
    state.rootAtEntry = await page.evaluate(() => {
      const rd = (value) => Number(Number(value).toFixed(2));
      const root = document.querySelector('#step-trigger-activate');
      const r = root.getBoundingClientRect();
      return { scrollY: Math.round(scrollY), position: getComputedStyle(root).position, top: getComputedStyle(root).top, rect: { x: rd(r.x), y: rd(r.y), width: rd(r.width), height: rd(r.height) } };
    });
  }
  await context.close();
  return state;
}

(async () => {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const result = { capturedAt: new Date().toISOString(), url };

  const { context, page } = await openPage(browser, { width: 1920, height: 975 });
  result.workflow = [];
  for (let y = 3700; y <= 6300; y += 100) result.workflow.push(await workflowState(page, y));

  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(200);
  const primary = page.getByRole('link', { name: 'Start Your Free Trial', exact: true }).first();
  result.primaryHover = [{ ms: 0, tree: await styleTree(page, primary), animations: await animationTree(page, primary) }];
  await primary.hover();
  for (const ms of [40, 100, 200, 400, 700]) {
    await page.waitForTimeout(ms - result.primaryHover[result.primaryHover.length - 1].ms);
    result.primaryHover.push({ ms, tree: await styleTree(page, primary), animations: await animationTree(page, primary) });
  }
  await page.mouse.move(10, 900);
  await page.waitForTimeout(300);
  result.primaryHoverExit = await styleTree(page, primary);

  const faqHeading = page.getByText('Frequently Asked Questions', { exact: true }).first();
  await faqHeading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const question = page.locator('[data-framer-name="Question"]').first();
  const faqRoot = question.locator('..');
  result.faq = [{ ms: 0, tree: await styleTree(page, faqRoot), animations: await animationTree(page, faqRoot) }];
  await question.click();
  for (const ms of [40, 100, 200, 400, 700, 1100]) {
    await page.waitForTimeout(ms - result.faq[result.faq.length - 1].ms);
    result.faq.push({ ms, tree: await styleTree(page, faqRoot), animations: await animationTree(page, faqRoot) });
  }
  await question.click();
  await page.waitForTimeout(700);
  result.faqClosedAgain = await styleTree(page, faqRoot);

  const testimonialHeading = page.getByText('What Our Customers Are Saying', { exact: true }).first();
  await testimonialHeading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  result.testimonials = [];
  for (let second = 0; second <= 8; second += 1) {
    result.testimonials.push(await page.evaluate((s) => {
      const rd = (value) => Number(Number(value).toFixed(2));
      const heading = [...document.querySelectorAll('h1,h2,h3')].find((element) => element.textContent.includes('What Our Customers Are Saying'));
      let root = heading;
      while (root?.parentElement) {
        const next = root.parentElement;
        const r = next.getBoundingClientRect();
        if (r.height > 950) break;
        root = next;
      }
      const elements = [...root.querySelectorAll('[data-framer-name]')].map((element) => {
        const r = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const text = element.textContent.replace(/\s+/g, ' ').trim();
        return { name: element.getAttribute('data-framer-name'), text: element.children.length < 3 ? text.slice(0, 120) : null, rect: { x: rd(r.x), y: rd(r.y), width: rd(r.width), height: rd(r.height) }, opacity: style.opacity, transform: style.transform, zIndex: style.zIndex };
      }).filter((item) => item.name && (item.text || /card|slide|testimonial/i.test(item.name)));
      return { second: s, elements };
    }, second));
    if (second < 8) await page.waitForTimeout(1000);
  }
  await context.close();

  result.responsive = [];
  for (const [width, height] of [[1920, 975], [1200, 800], [1024, 768], [810, 760], [809, 760], [768, 740], [390, 844]]) {
    result.responsive.push(await responsiveState(browser, width, height));
  }

  const reduced = await openPage(browser, { width: 1920, height: 975 }, { reducedMotion: 'reduce', waitMs: 100 });
  result.reducedMotion = await reduced.page.evaluate(() => ({
    mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
    animationsAt100ms: document.getAnimations({ subtree: true }).map((animation) => ({
      text: animation.effect?.target?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 80) || null,
      playState: animation.playState,
      duration: animation.effect?.getComputedTiming?.().duration,
      delay: animation.effect?.getComputedTiming?.().delay,
      timeline: animation.timeline?.constructor?.name || null,
    })),
  }));
  await reduced.page.waitForTimeout(2500);
  result.reducedMotion.after2600ms = await reduced.page.evaluate(() => ({ animations: document.getAnimations({ subtree: true }).map((animation) => ({ playState: animation.playState, duration: animation.effect?.getComputedTiming?.().duration, text: animation.effect?.target?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 50) || null })) }));
  await reduced.context.close();

  fs.writeFileSync(output, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ output, workflowSamples: result.workflow.length, faqSamples: result.faq.length, hoverSamples: result.primaryHover.length, testimonialSamples: result.testimonials.length, responsiveSamples: result.responsive.length, reducedAt100ms: result.reducedMotion.animationsAt100ms.length }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

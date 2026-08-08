const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const url = process.argv[2] || 'http://127.0.0.1:4173/';
const outputDir = path.resolve('verification');
const chromePath = process.env.CHROME_EXECUTABLE || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
fs.mkdirSync(outputDir, { recursive: true });

const errors = { console: [], page: [], failedLocalRequests: [], failedRemoteRequests: [] };

async function waitForSettled(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(2400);
}

async function baseInspection(page) {
  return page.evaluate(() => ({
    title: document.title,
    h1: document.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim(),
    textLength: document.body.innerText.trim().length,
    interactiveElements: document.querySelectorAll('a,button,input,summary,[tabindex]').length,
    errorOverlay: Boolean(document.querySelector('[data-nextjs-dialog],.vite-error-overlay,#webpack-dev-server-client-overlay')),
    pageWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    pageHeight: document.documentElement.scrollHeight,
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
  }));
}

async function captureSection(page, selector, filename) {
  const section = page.locator(selector);
  await section.scrollIntoViewIfNeeded();
  await page.evaluate((targetSelector) => {
    document.querySelectorAll(`${targetSelector} .reveal`).forEach((element) => element.classList.add('is-visible', 'motion-complete'));
    document.querySelector('.site-header')?.setAttribute('data-qa-hidden', 'true');
    document.querySelector('.skip-link')?.setAttribute('data-qa-hidden', 'true');
    document.activeElement?.blur();
  }, selector);
  await page.addStyleTag({ content: '[data-qa-hidden="true"] { visibility: hidden !important; }' });
  await page.waitForTimeout(700);
  await section.screenshot({ path: path.join(outputDir, filename) });
  await page.evaluate(() => document.querySelectorAll('[data-qa-hidden]').forEach((element) => element.removeAttribute('data-qa-hidden')));
}

async function verifyAboutScroll(page) {
  const positions = await page.evaluate(() => {
    const element = document.querySelector('[data-scroll-letters]');
    let documentTop = 0;
    let offsetElement = element;
    while (offsetElement) {
      documentTop += offsetElement.offsetTop;
      offsetElement = offsetElement.offsetParent;
    }
    const start = documentTop - window.innerHeight * 0.78;
    const end = documentTop - window.innerHeight * 0.2;
    return [start - 24, (start + end) / 2, end + 24, start - 24];
  });
  const states = [];
  for (const scrollY of positions) {
    await page.evaluate((nextY) => window.scrollTo(0, nextY), scrollY);
    await page.waitForTimeout(180);
    states.push(await page.evaluate(() => {
      const element = document.querySelector('[data-scroll-letters]');
      const words = Array.from(element.querySelectorAll('.about-word:not(.is-leading)'));
      const leading = Array.from(element.querySelectorAll('.about-word.is-leading'));
      const brightness = (word) => {
        const channels = getComputedStyle(word).color.match(/[\d.]+/g).slice(0, 3).map(Number);
        return channels.reduce((sum, channel) => sum + channel, 0) / 3;
      };
      const values = words.map(brightness);
      const average = values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
      return {
        scrollY: Math.round(window.scrollY),
        progress: Number(getComputedStyle(element).getPropertyValue('--about-reveal-progress')),
        wordCount: words.length,
        whiteWords: values.filter((value) => value >= 250).length,
        averageBrightness: Math.round(average),
        leadingWhite: leading.every((word) => brightness(word) >= 250),
      };
    }));
  }
  return {
    states,
    progressesDown: states[0].averageBrightness < states[1].averageBrightness && states[1].averageBrightness < states[2].averageBrightness,
    reversesUp: states[3].averageBrightness === states[0].averageBrightness,
    fullyWhite: states[2].whiteWords === states[2].wordCount,
    leadingAlwaysWhite: states.every((state) => state.leadingWhite),
  };
}

async function verifyStatsEntrance(page) {
  const readState = () => page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.stats article'));
    return {
      opacities: cards.map((card) => Number(getComputedStyle(card).opacity)),
      filters: cards.map((card) => getComputedStyle(card).filter),
      transforms: cards.map((card) => getComputedStyle(card).transform),
      values: cards.map((card) => card.querySelector('[data-count]')?.textContent.trim()),
      animated: document.querySelector('.stats')?.dataset.statsAnimated === 'true',
    };
  });

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(120);
  const initial = await readState();
  const targetScroll = await page.evaluate(() => {
    const stats = document.querySelector('.stats');
    let documentTop = 0;
    let offsetElement = stats;
    while (offsetElement) {
      documentTop += offsetElement.offsetTop;
      offsetElement = offsetElement.offsetParent;
    }
    return documentTop - window.innerHeight * 0.55;
  });

  await page.evaluate((nextY) => window.scrollTo(0, nextY), targetScroll);
  await page.waitForTimeout(220);
  const staggered = await readState();
  await page.screenshot({ path: path.join(outputDir, 'final-stats-progressive.png') });
  await page.waitForTimeout(2050);
  const complete = await readState();
  await page.screenshot({ path: path.join(outputDir, 'final-stats-complete.png') });

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(180);
  await page.evaluate((nextY) => window.scrollTo(0, nextY), targetScroll);
  await page.waitForTimeout(250);
  const reentry = await readState();
  await page.evaluate(() => window.scrollTo(0, 0));

  const expected = ['963', '27', '15', '400'];
  return {
    initial,
    staggered,
    complete,
    reentry,
    initialHidden: initial.opacities.every((opacity) => opacity === 0),
    initialZero: initial.values.every((value) => value === '0'),
    entersInOrder: staggered.opacities[0] > staggered.opacities[1]
      && staggered.opacities[1] >= staggered.opacities[2]
      && staggered.opacities[2] >= staggered.opacities[3],
    finalVisible: complete.opacities.every((opacity) => opacity === 1),
    finalExact: complete.values.every((value, index) => value === expected[index]),
    runsOnce: reentry.values.every((value, index) => value === expected[index])
      && reentry.opacities.every((opacity) => opacity === 1),
  };
}

async function verifyDesktop(page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForSettled(page);
  const base = await baseInspection(page);
  await page.screenshot({ path: path.join(outputDir, 'final-desktop-top.png') });

  await page.click('.pages-trigger');
  await page.waitForTimeout(500);
  const dropdownOpened = await page.locator('#pages-menu').isVisible();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(220);
  const dropdownClosed = !(await page.locator('#pages-menu').isVisible());
  const statsEntrance = await verifyStatsEntrance(page);
  const aboutScroll = await verifyAboutScroll(page);

  const marqueeBefore = await page.evaluate(() => {
    const track = document.querySelector('.logo-track');
    const sequences = Array.from(track.querySelectorAll('.logo-sequence'));
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    const transform = getComputedStyle(track).transform;
    return {
      sequenceCount: sequences.length,
      itemCounts: sequences.map((sequence) => sequence.children.length),
      sequenceWidths: sequences.map((sequence) => Math.round(sequence.getBoundingClientRect().width)),
      seamError: sequences.length === 2
        ? Math.abs((sequences[1].offsetLeft - sequences[0].offsetLeft) - (sequences[0].offsetWidth + gap))
        : null,
      animationName: getComputedStyle(track).animationName,
      animationDuration: getComputedStyle(track).animationDuration,
      animationPlayState: getComputedStyle(track).animationPlayState,
      translateX: transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m41,
    };
  });
  await page.waitForTimeout(320);
  const marqueeAfterX = await page.evaluate(() => {
    const transform = getComputedStyle(document.querySelector('.logo-track')).transform;
    return transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m41;
  });
  await page.hover('.logo-marquee');
  await page.waitForTimeout(120);
  const marqueeHoverPlayState = await page.evaluate(() => getComputedStyle(document.querySelector('.logo-track')).animationPlayState);
  const marquee = {
    ...marqueeBefore,
    movesContinuously: Math.abs(marqueeAfterX - marqueeBefore.translateX) > 1,
    hoverKeepsRunning: marqueeHoverPlayState === 'running',
  };

  const workflowThresholds = await page.evaluate(() => {
    const targets = ['#step-trigger-activate', '#step-trigger-1', '#step-trigger-2'].map((selector) => document.querySelector(selector));
    return targets.map((target) => target.getBoundingClientRect().top + window.scrollY - (window.innerHeight - target.offsetHeight * 0.5));
  });
  const workflowGeometry = await page.evaluate(() => {
    const line = document.querySelector('.step-line');
    const lineRect = line.getBoundingClientRect();
    const lineCenterY = lineRect.top + 20;
    const markerRects = Array.from(line.querySelectorAll('span')).map((marker) => marker.getBoundingClientRect());
    return {
      markerCenterRatios: markerRects.map((rect) => Number(((rect.left + rect.width / 2 - lineRect.left) / lineRect.width).toFixed(4))),
      markerSizes: markerRects.map((rect) => [Math.round(rect.width), Math.round(rect.height)]),
      markerLineOffsets: markerRects.map((rect) => Number((rect.top + rect.height / 2 - lineCenterY).toFixed(2))),
    };
  });
  const workflowRevealDistances = workflowThresholds.map((threshold, index) => {
    const previousInterval = index > 0 ? threshold - workflowThresholds[index - 1] : 0;
    const nextInterval = index < workflowThresholds.length - 1 ? workflowThresholds[index + 1] - threshold : previousInterval;
    return Math.min(250, Math.max(170, Math.max(previousInterval, nextInterval, 1) * 0.28));
  });
  const workflowStates = [];
  for (const scrollY of [
    workflowThresholds[0],
    workflowThresholds[1],
    workflowThresholds[2],
    workflowThresholds[2] + workflowRevealDistances[2] + 1,
    workflowThresholds[1] - 30,
  ]) {
    await page.evaluate((nextY) => window.scrollTo(0, nextY), scrollY);
    await page.waitForTimeout(720);
    workflowStates.push(await page.evaluate(() => ({
      scrollY: Math.round(window.scrollY),
      cardsY: Array.from(document.querySelectorAll('.how-card')).map((card) => {
        const transform = getComputedStyle(card).transform;
        return transform === 'none' ? 0 : Math.round(new DOMMatrixReadOnly(transform).m42);
      }),
      cardsOpacity: Array.from(document.querySelectorAll('.how-card')).map((card) => Number(getComputedStyle(card).opacity)),
      progressPercent: Math.round(new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.step-line i')).transform).m11 * 100),
      markerActive: Array.from(document.querySelectorAll('.step-line span')).map((marker) => marker.classList.contains('is-active')),
    })));
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  const defaultOpenFaq = await page.locator('details[open]').count();
  const firstFaq = page.locator('.faq-grid details').nth(1);
  const faqBefore = await firstFaq.evaluate((element) => element.getBoundingClientRect().height);
  await firstFaq.locator('summary').click();
  await page.waitForTimeout(650);
  const faqAfter = await firstFaq.evaluate((element) => element.getBoundingClientRect().height);
  const faqOpen = await firstFaq.evaluate((element) => element.open);

  const botSectionHidden = await page.locator('#bot').evaluate((element) => element.hidden);
  let testimonialSecondSelected = null;
  if (!botSectionHidden) {
    const dots = page.locator('.testimonial-dots button');
    await dots.nth(1).click();
    await page.waitForTimeout(800);
    testimonialSecondSelected = await dots.nth(1).getAttribute('aria-pressed');
  }

  await page.locator('.subscribe-form button').click();
  const invalidEmailMessage = await page.locator('.form-status').textContent();
  await page.locator('#email').fill('qa@example.com');
  await page.locator('.subscribe-form button').click();
  const validEmailMessage = await page.locator('.form-status').textContent();
  await captureSection(page, '#pricing', 'final-desktop-pricing.png');
  await captureSection(page, '.faq .container', 'final-desktop-faq.png');
  await captureSection(page, '.company-strip', 'final-desktop-marquee.png');

  return {
    status: response?.status(),
    ...base,
    dropdownOpened,
    dropdownClosed,
    statsEntrance,
    aboutScroll,
    marquee,
    workflowThresholds: workflowThresholds.map(Math.round),
    workflowGeometry,
    workflowStates,
    defaultOpenFaq,
    faqOpen,
    faqOpens: faqOpen && faqAfter > faqBefore + 20,
    faqHeights: { before: Math.round(faqBefore), after: Math.round(faqAfter) },
    botSectionHidden,
    testimonialSecondSelected,
    invalidEmailMessage,
    validEmailMessage,
  };
}

async function verifyResponsive(page, viewport, name) {
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForSettled(page);
  const base = await baseInspection(page);
  const state = await page.evaluate(() => ({
    workflowPosition: getComputedStyle(document.querySelector('.how-sticky')).position,
    workflowTriggersVisible: getComputedStyle(document.querySelector('.workflow-triggers')).display !== 'none',
    workflowCardsY: Array.from(document.querySelectorAll('.how-card')).map((card) => getComputedStyle(card).transform),
    mobileMenuButtonVisible: getComputedStyle(document.querySelector('.menu-button')).display !== 'none',
    testimonialTicker: document.querySelector('.testimonial-track').classList.contains('is-ticker'),
  }));
  if (state.mobileMenuButtonVisible) {
    await page.click('.menu-button');
    await page.waitForTimeout(550);
    state.mobileMenuOpens = await page.locator('#mobile-menu').isVisible();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(550);
  }
  await page.screenshot({ path: path.join(outputDir, `final-${name}-top.png`) });
  if (name === 'mobile') {
    await captureSection(page, '#pricing', 'final-mobile-pricing.png');
    await captureSection(page, '.faq .container', 'final-mobile-faq.png');
  }
  return { ...base, ...state };
}

async function verifyReduced(browser) {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(200);
  const result = await page.evaluate(() => ({
    heroFinal: Array.from(document.querySelectorAll('.hero-load')).every((element) => getComputedStyle(element).opacity === '1' && getComputedStyle(element).transform === 'none'),
    revealsFinal: Array.from(document.querySelectorAll('.reveal')).every((element) => getComputedStyle(element).opacity === '1'),
    marqueeStopped: getComputedStyle(document.querySelector('.logo-track')).animationName === 'none',
    workflowStatic: getComputedStyle(document.querySelector('.how-sticky')).position === 'static',
    workflowCardsStatic: Array.from(document.querySelectorAll('.how-card')).every((card) => getComputedStyle(card).transform === 'none'),
    testimonialAnimations: document.querySelector('.testimonial-track').getAnimations().length,
    aboutWordsFinal: Array.from(document.querySelectorAll('.about-word')).every((word) => getComputedStyle(word).color === 'rgb(255, 255, 255)'),
  }));
  await context.close();
  return result;
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') errors.console.push(message.text()); });
  page.on('pageerror', (error) => errors.page.push(error.message));
  page.on('requestfailed', (request) => {
    const record = { url: request.url(), error: request.failure()?.errorText || 'unknown' };
    if (request.url().startsWith(url)) errors.failedLocalRequests.push(record);
    else errors.failedRemoteRequests.push(record);
  });

  const report = {
    createdAt: new Date().toISOString(),
    story: 'Landing page do Licitabase: navegador → servidor HTTP local → HTML/CSS/JS → interface responsiva e interativa.',
    desktop: await verifyDesktop(page),
    tablet: await verifyResponsive(page, { width: 1024, height: 768 }, 'tablet'),
    mobile: await verifyResponsive(page, { width: 390, height: 844 }, 'mobile'),
    reducedMotion: await verifyReduced(browser),
    errors,
  };
  fs.writeFileSync(path.join(outputDir, 'final-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

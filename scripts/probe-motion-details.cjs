const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const url = process.argv[2] || 'https://saapilot.framer.website/';
const output = path.resolve(process.argv[3] || 'motion-analysis/motion-details.json');
const chromePath = process.env.CHROME_EXECUTABLE || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function launchPage(browser, viewport) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2600);
  return { context, page };
}

async function state(page) {
  return page.evaluate(() => {
    const rd = (v) => +v.toFixed(2);
    const box = (e) => { const r = e.getBoundingClientRect(); return { x: rd(r.x), y: rd(r.y), width: rd(r.width), height: rd(r.height), pageY: rd(r.y + scrollY) }; };
    const clean = (v) => v?.replace(/\s+/g, ' ').trim();
    const highlighted = [...document.querySelectorAll('[data-highlight="true"]')].map((element) => {
      const s = getComputedStyle(element);
      return { tag: element.tagName, name: element.getAttribute('data-framer-name'), text: clean(element.textContent)?.slice(0, 140) || null, href: element.href || null, rect: box(element), cursor: s.cursor, transform: s.transform, opacity: s.opacity, background: s.backgroundColor };
    });
    const triggers = ['step-trigger-activate', 'step-trigger-1', 'step-trigger-2'].map((id) => {
      const element = document.getElementById(id);
      if (!element) return { id, missing: true };
      const s = getComputedStyle(element);
      return { id, name: element.getAttribute('data-framer-name'), rect: box(element), position: s.position, top: s.top, display: s.display, visibility: s.visibility };
    });
    const faq = [...document.querySelectorAll('[data-framer-name="Question"]')].map((question) => {
      const root = question.parentElement;
      const plus = root.querySelector('[data-framer-name="Plus"]');
      const answer = root.querySelector('[data-framer-name="Answer"]');
      return { question: clean(question.textContent), variant: root.getAttribute('data-framer-name'), rect: box(root), plusTransform: plus ? getComputedStyle(plus).transform : null, answer: answer ? clean(answer.textContent)?.slice(0, 180) : null };
    });
    return { viewport: { width: innerWidth, height: innerHeight }, scrollY, htmlClasses: document.documentElement.className, highlighted, triggers, faq };
  });
}

async function subtree(page, locator) {
  return locator.evaluate((root) => {
    const rd = (v) => +v.toFixed(2);
    return [root, ...root.querySelectorAll('*')].slice(0, 60).map((e) => {
      const r = e.getBoundingClientRect();
      const s = getComputedStyle(e);
      return { tag: e.tagName, name: e.getAttribute('data-framer-name'), text: e.children.length === 0 ? e.textContent.replace(/\s+/g, ' ').trim().slice(0, 90) || null : null, rect: { x: rd(r.x), y: rd(r.y), width: rd(r.width), height: rd(r.height) }, color: s.color, background: s.backgroundColor, borderColor: s.borderColor, transform: s.transform, opacity: s.opacity, boxShadow: s.boxShadow, outline: s.outline };
    });
  });
}

async function visibleNamed(page) {
  return page.evaluate(() => [...document.querySelectorAll('[data-framer-name]')].map((e) => {
    const r = e.getBoundingClientRect();
    if (r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) return null;
    const s = getComputedStyle(e);
    if (s.visibility === 'hidden' || s.display === 'none') return null;
    return { name: e.getAttribute('data-framer-name'), text: e.children.length < 3 ? e.textContent.replace(/\s+/g, ' ').trim().slice(0, 100) || null : null, tag: e.tagName, x: +r.x.toFixed(1), y: +r.y.toFixed(1), width: +r.width.toFixed(1), height: +r.height.toFixed(1), position: s.position, opacity: s.opacity, transform: s.transform, zIndex: s.zIndex };
  }).filter(Boolean));
}

(async () => {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const result = { capturedAt: new Date().toISOString(), url };

  const desktop = await launchPage(browser, { width: 2400, height: 1296 });
  result.desktop = await state(desktop.page);

  const allPages = desktop.page.getByText('All Pages', { exact: true }).first();
  await allPages.hover();
  await desktop.page.waitForTimeout(450);
  result.allPagesHover = await visibleNamed(desktop.page);
  await allPages.click();
  await desktop.page.waitForTimeout(450);
  result.allPagesClick = await visibleNamed(desktop.page);
  await desktop.page.keyboard.press('Escape');

  const advantageText = desktop.page.getByText('Boost Sales Conversions', { exact: true }).first();
  await advantageText.scrollIntoViewIfNeeded();
  await desktop.page.waitForTimeout(200);
  const advantage = advantageText.locator('xpath=ancestor::*[@data-framer-name][1]');
  result.advantageHover = [{ ms: 0, tree: await subtree(desktop.page, advantage) }];
  await advantage.hover();
  for (const ms of [80, 200, 450]) {
    await desktop.page.waitForTimeout(ms - result.advantageHover[result.advantageHover.length - 1].ms);
    result.advantageHover.push({ ms, tree: await subtree(desktop.page, advantage) });
  }

  const input = desktop.page.locator('input').first();
  if (await input.count()) {
    await input.scrollIntoViewIfNeeded();
    result.inputFocus = { before: await subtree(desktop.page, input) };
    await input.focus();
    await desktop.page.waitForTimeout(100);
    result.inputFocus.after = await subtree(desktop.page, input);
  }
  await desktop.context.close();

  const tablet = await launchPage(browser, { width: 1024, height: 768 });
  result.tablet = await state(tablet.page);
  const tabletRootY = result.tablet.triggers[0].rect.pageY;
  result.tabletWorkflow = [];
  for (const y of [tabletRootY - 300, tabletRootY, tabletRootY + 500, tabletRootY + 1200, tabletRootY + 1900]) {
    await tablet.page.evaluate((nextY) => scrollTo(0, nextY), y);
    await tablet.page.waitForTimeout(100);
    result.tabletWorkflow.push(await state(tablet.page));
  }
  await tablet.context.close();

  const mobile = await launchPage(browser, { width: 390, height: 844 });
  result.mobile = await state(mobile.page);
  result.mobileTopNamed = await visibleNamed(mobile.page);
  const menuCandidates = mobile.page.locator('[data-highlight="true"]');
  const count = await menuCandidates.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = menuCandidates.nth(index);
    const r = await candidate.boundingBox();
    if (r && r.y < 120 && r.x > 250) {
      result.mobileMenuBefore = await visibleNamed(mobile.page);
      await candidate.click();
      await mobile.page.waitForTimeout(500);
      result.mobileMenuAfter = await visibleNamed(mobile.page);
      break;
    }
  }
  await mobile.context.close();

  fs.writeFileSync(output, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ output, desktopHighlights: result.desktop.highlighted.length, faqRows: result.desktop.faq.length, tabletTriggers: result.tablet.triggers, mobileHighlights: result.mobile.highlighted.length, mobileMenuOpened: !!result.mobileMenuAfter }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

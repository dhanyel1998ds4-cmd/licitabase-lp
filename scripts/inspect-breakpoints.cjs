const { chromium } = require('playwright');

const targets = [
  ['reference', 'https://saapilot.framer.website/'],
  ['local', 'http://127.0.0.1:4173/'],
];
const viewports = [
  { name: '1024x768', width: 1024, height: 768 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '390x844', width: 390, height: 844 },
];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  const page = await browser.newPage();
  const report = {};

  for (const viewport of viewports) {
    report[viewport.name] = {};
    await page.setViewportSize(viewport);
    for (const [kind, url] of targets) {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(2500);
      const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < pageHeight; y += Math.max(500, Math.round(viewport.height * 0.82))) {
        await page.evaluate((nextY) => window.scrollTo(0, nextY), y);
        await page.waitForTimeout(35);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(800);
      report[viewport.name][kind] = await page.evaluate(() => {
        const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim();
        const bounds = (element) => {
          if (!element) return null;
          const r = element.getBoundingClientRect();
          return { x: Math.round(r.x), y: Math.round(r.y + scrollY), width: Math.round(r.width), height: Math.round(r.height) };
        };
        const byText = (text, selector = 'h1,h2,h3,h4,p,a,button,div') => Array.from(document.querySelectorAll(selector))
          .find((element) => normalize(element.textContent) === text);
        const heroImage = Array.from(document.images).find((image) => /hero image|SaaPilot dashboard/i.test(image.alt));
        const blogHeading = byText('Insights, Tips & AI Trends', 'h2,h3');
        const ctaHeading = byText('Ready to Automate Your Customer Interactions?', 'h2,h3');
        const blogStart = blogHeading?.getBoundingClientRect().top + scrollY - 200;
        const ctaEnd = (ctaHeading?.getBoundingClientRect().top + scrollY || Infinity) + 500;
        const lowerImages = Array.from(document.images).map((image) => ({
          src: image.currentSrc.split('/').pop()?.split('?')[0] || '',
          alt: image.alt,
          bounds: bounds(image),
        })).filter((image) => image.bounds && image.bounds.y >= blogStart && image.bounds.y <= ctaEnd);
        const ancestors = (element) => {
          const result = [];
          let current = element;
          for (let depth = 0; current && depth < 8; depth += 1, current = current.parentElement) {
            result.push({
              tag: current.tagName,
              className: typeof current.className === 'string' ? current.className.slice(0, 100) : '',
              bounds: bounds(current),
            });
          }
          return result;
        };
        return {
          page: bounds(document.documentElement),
          header: bounds(document.querySelector('header') || document.querySelector('nav')),
          h1: bounds(document.querySelector('h1')),
          announcement: bounds(byText('We are launching our new features', 'p,div')),
          intro: bounds(byText('Build AI agents in minutes to automate workflows, save time, and grow your business.', 'p')),
          primaryCta: bounds(byText('Start Your Free Trial', 'a,button')),
          secondaryCta: bounds(byText('Book a Demo', 'a,button')),
          trusted: bounds(byText('Trusted by 350k users', 'p,span,div')),
          heroImage: bounds(heroImage),
          companyLabel: bounds(byText('We working with more than 100+ Companies', 'p,div')),
          aboutLabel: bounds(byText('About Us', 'p,div')),
          featuresTitle: bounds(byText('What Makes Us Different', 'h2,h3')),
          howTitle: bounds(byText('How Our AI Agent Works', 'h2,h3')),
          advantagesTitle: bounds(byText('Why Choose Our AI Agent?', 'h2,h3')),
          testimonialsTitle: bounds(byText('What Our Customers Are Saying', 'h2,h3')),
          blogTitle: bounds(byText('Insights, Tips & AI Trends', 'h2,h3')),
          ctaTitle: bounds(byText('Ready to Automate Your Customer Interactions?', 'h2,h3')),
          faqTitle: bounds(byText('Frequently Asked Questions', 'h2,h3')),
          trialTitle: bounds(byText('Start your 7-day free trial', 'h2,h3')),
          lowerImages,
          featureCards: Array.from(document.querySelectorAll('.feature-card')).map(bounds),
          ancestry: {
            blog: ancestors(blogHeading),
            cta: ancestors(ctaHeading),
            faq: ancestors(byText('Frequently Asked Questions', 'h2,h3')),
            trial: ancestors(byText('Start your 7-day free trial', 'h2,h3')),
          },
          sections: Object.fromEntries([
            ['company', '.company-strip'],
            ['about', '.about'],
            ['features', '.features'],
            ['how', '.how-section'],
            ['advantages', '.advantages'],
            ['testimonials', '.testimonials'],
            ['blog', '.blog'],
            ['cta', '.cta-section'],
            ['faq', '.faq'],
          ].map(([name, selector]) => [name, bounds(document.querySelector(selector))])),
          footer: bounds(document.querySelector('footer')),
        };
      });
    }
  }
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

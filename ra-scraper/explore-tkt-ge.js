import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import fs from 'fs';

const URL = 'https://tkt.ge/concerts';

async function exploreTktGe() {
  console.log('Exploring tkt.ge/concerts...\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  console.log('Loading page...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000);

  // Scroll to load all content
  console.log('Scrolling to load all events...');
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
  }

  await page.waitForTimeout(3000);

  const html = await page.content();
  fs.writeFileSync('tkt-ge-page.html', html);
  console.log('✅ Saved HTML to tkt-ge-page.html\n');

  const $ = cheerio.load(html);

  // Look for event containers
  console.log('=== Looking for event containers ===\n');

  const possibleSelectors = [
    'article',
    '[class*="event"]',
    '[class*="concert"]',
    '[class*="card"]',
    '[data-event]',
    'a[href*="/event/"]',
    'a[href*="/concert/"]',
    '.event-card',
    '.concert-item'
  ];

  for (const selector of possibleSelectors) {
    const count = $(selector).length;
    if (count > 0) {
      console.log(`${selector}: ${count} elements`);

      // Show first few hrefs if it's a link
      if (selector.startsWith('a')) {
        $(selector).slice(0, 5).each((i, el) => {
          console.log(`  ${i + 1}. ${$(el).attr('href')}`);
        });
      }
    }
  }

  // Look for all links
  console.log('\n=== All links ===\n');
  const links = new Set();
  $('a').each((_, el) => {
    const href = $(el).attr('href');
    if (href && (href.includes('event') || href.includes('concert'))) {
      links.add(href);
    }
  });

  console.log(`Found ${links.size} event/concert links:`);
  [...links].slice(0, 20).forEach((link, i) => {
    console.log(`${i + 1}. ${link}`);
  });

  await browser.close();
}

exploreTktGe().catch(console.error);

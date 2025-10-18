import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import fs from 'fs';

// Bandsintown usually needs a city - let's try Tbilisi
const URL = 'https://www.bandsintown.com/?came_from=257&page=1&location=Tbilisi,%20Georgia';

async function exploreBandsintown() {
  console.log('Exploring bandsintown.com...\n');

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
  fs.writeFileSync('bandsintown-page.html', html);
  console.log('✅ Saved HTML to bandsintown-page.html\n');

  const $ = cheerio.load(html);

  // Look for event containers
  console.log('=== Looking for event containers ===\n');

  const possibleSelectors = [
    'article',
    '[class*="event"]',
    '[class*="Event"]',
    '[class*="concert"]',
    '[class*="show"]',
    '[data-event]',
    'a[href*="/event/"]',
    'a[href*="/e/"]',
    '.event-card',
    '[data-testid*="event"]'
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

  // Look for all links with event-related paths
  console.log('\n=== Event-related links ===\n');
  const links = new Set();
  $('a').each((_, el) => {
    const href = $(el).attr('href');
    if (href && (href.includes('/e/') || href.includes('/event'))) {
      links.add(href);
    }
  });

  console.log(`Found ${links.size} event links:`);
  [...links].slice(0, 20).forEach((link, i) => {
    console.log(`${i + 1}. ${link}`);
  });

  // Check for JSON data
  console.log('\n=== Looking for JSON data ===\n');
  $('script[type="application/json"]').each((i, el) => {
    const content = $(el).text();
    if (content.includes('event') || content.includes('Event')) {
      console.log(`Found JSON script ${i + 1} (${content.length} chars)`);
    }
  });

  await browser.close();
}

exploreBandsintown().catch(console.error);

import { chromium } from 'playwright';
import dayjs from 'dayjs';
import fs from 'fs';

const URL = 'https://tkt.ge/concerts';

async function scrapeTktGe() {
  console.log('🎯 Scraping tkt.ge/concerts...\n');

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
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(5000);

  // Scroll to load all events
  console.log('Scrolling to load all events...');
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
  }

  await page.waitForTimeout(3000);

  // Extract Next.js data
  const nextData = await page.evaluate(() => {
    const script = document.getElementById('__NEXT_DATA__');
    if (script) {
      return JSON.parse(script.textContent);
    }
    return null;
  });

  console.log('Extracted Next.js data');

  // Also try to get event data from the page
  const events = await page.evaluate(() => {
    const eventElements = [];

    // Try to find event cards or containers
    const possibleSelectors = [
      '[data-event]',
      'article',
      '[class*="event"]',
      '[class*="card"]',
      'a[href*="/event/"]'
    ];

    for (const selector of possibleSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        elements.forEach(el => {
          const title = el.querySelector('[class*="title"]')?.textContent?.trim() ||
                       el.querySelector('h1, h2, h3, h4')?.textContent?.trim() ||
                       el.textContent?.trim().substring(0, 100);

          const link = el.href || el.querySelector('a')?.href;
          const image = el.querySelector('img')?.src;
          const date = el.querySelector('[class*="date"]')?.textContent?.trim();

          if (link || title) {
            eventElements.push({ title, link, image, date, selector });
          }
        });

        if (eventElements.length > 0) break;
      }
    }

    return eventElements;
  });

  console.log(`\nFound ${events.length} events on the page`);

  if (events.length > 0) {
    console.log('\nSample events:');
    events.slice(0, 5).forEach((e, i) => {
      console.log(`${i + 1}. ${e.title?.substring(0, 60)}`);
      if (e.link) console.log(`   URL: ${e.link}`);
    });
  }

  await browser.close();

  // Save the data
  const timestamp = dayjs().format('YYYYMMDDHHmmss');
  const filename = `tkt-ge-events-${timestamp}.json`;
  const output = {
    source: 'tkt.ge',
    url: URL,
    scrapedAt: new Date().toISOString(),
    totalEvents: events.length,
    nextData: nextData,
    events
  };

  fs.writeFileSync(filename, JSON.stringify(output, null, 2));
  console.log(`\n✅ Saved data to ${filename}`);

  return output;
}

scrapeTktGe().catch(console.error);

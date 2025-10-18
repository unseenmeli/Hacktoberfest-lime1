import { chromium } from 'playwright';
import * as cheerio from 'cheerio';

const BASE = 'https://ra.co';
const LISTING = `${BASE}/events/ge/tbilisi?page=1`;

async function checkPageEvents() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  console.log('Loading page...');
  await page.goto(LISTING, { waitUntil: 'domcontentloaded', timeout: 60000 });

  console.log('Waiting for initial content...');
  await page.waitForTimeout(5000);

  // Check for CAPTCHA
  let hasCaptcha = await page.evaluate(() => {
    return document.body.innerHTML.includes('captcha-delivery') ||
           document.body.innerHTML.includes('DataDome');
  });

  if (hasCaptcha) {
    console.log('⚠️  CAPTCHA detected! Please solve it...');
    console.log('Waiting 30 seconds...');
    await page.waitForTimeout(30000);
  }

  // Scroll to load more events
  console.log('Scrolling to load all events...');
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });

  console.log('Waiting for lazy-loaded content...');
  await page.waitForTimeout(3000);

  const html = await page.content();
  const $ = cheerio.load(html);

  // Find all event links
  const eventLinks = new Set();
  $('a[href^="/events/"]').each((_, a) => {
    const href = $(a).attr('href');
    const match = href.match(/^\/events\/(\d+)/);
    if (match) {
      eventLinks.add(match[1]);
    }
  });

  console.log(`\nFound ${eventLinks.size} unique event IDs:`);
  console.log([...eventLinks].join(', '));

  // Also check what the page structure looks like
  console.log('\nChecking page structure...');
  const eventArticles = $('article').length;
  const eventDivs = $('[class*="event" i]').length;

  console.log(`Articles: ${eventArticles}`);
  console.log(`Elements with "event" in class: ${eventDivs}`);

  // Look for event listings in different possible structures
  console.log('\nSearching for event containers...');
  const possibleContainers = [
    'article',
    '[data-event-id]',
    '[class*="EventListItem"]',
    '[class*="event-item"]',
    'li[class*="event"]',
    'ul > li'
  ];

  for (const selector of possibleContainers) {
    const count = $(selector).length;
    if (count > 0) {
      console.log(`  ${selector}: ${count} elements`);
    }
  }

  await browser.close();
}

checkPageEvents().catch(console.error);

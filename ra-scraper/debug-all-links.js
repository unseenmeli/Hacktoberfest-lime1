import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import fs from 'fs';

const BASE = 'https://ra.co';
const LISTING = `${BASE}/events/ge/tbilisi?page=1`;

async function debugLinks() {
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
  await page.goto(LISTING, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(8000);

  // Check CAPTCHA
  let hasCaptcha = await page.evaluate(() => {
    return document.body.innerHTML.includes('captcha-delivery') ||
           document.body.innerHTML.includes('DataDome');
  });

  if (hasCaptcha) {
    console.log('⚠️  CAPTCHA! Please solve it...');
    await page.waitForTimeout(45000);
  }

  // Scroll to load everything
  console.log('\nScrolling...');
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
  }

  await page.waitForTimeout(5000);

  // Save the HTML
  const html = await page.content();
  fs.writeFileSync('page-source.html', html);
  console.log('✅ Saved HTML to page-source.html');

  const $ = cheerio.load(html);

  // Find ALL links with /events/ in them
  console.log('\n=== ALL LINKS WITH /events/ ===\n');
  const allEventLinks = [];
  $('a[href*="/events/"]').each((_, a) => {
    const href = $(a).attr('href');
    const text = $(a).text().trim();
    allEventLinks.push({ href, text });
  });

  console.log(`Found ${allEventLinks.length} links containing "/events/"`);
  allEventLinks.forEach((link, i) => {
    console.log(`${i + 1}. ${link.href} - "${link.text.substring(0, 50)}"`);
  });

  // Extract event IDs
  console.log('\n=== UNIQUE EVENT IDs ===\n');
  const ids = new Set();
  allEventLinks.forEach(link => {
    const match = link.href.match(/\/events\/(\d+)/);
    if (match) {
      ids.add(match[1]);
    }
  });

  console.log(`Unique Event IDs: ${[...ids].join(', ')}`);
  console.log(`\nTotal: ${ids.size} unique events`);

  await browser.close();
}

debugLinks().catch(console.error);

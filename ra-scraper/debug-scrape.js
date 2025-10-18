import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import fs from 'fs';

const BASE = 'https://ra.co';
const LISTING = (page=1) => `${BASE}/events/ge/tbilisi?page=${page}`;

async function debugPage() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
  });

  const page = await context.newPage();

  // Add extra headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
  });

  console.log('Navigating to:', LISTING(1));
  await page.goto(LISTING(1), { waitUntil: 'domcontentloaded', timeout: 60000 });

  console.log('Waiting for content to load...');
  // Wait longer for CAPTCHA to be solved or content to load
  await page.waitForTimeout(10000);

  // Check if we're still on a CAPTCHA page
  const hasCaptcha = await page.evaluate(() => {
    return document.body.innerHTML.includes('captcha-delivery') ||
           document.body.innerHTML.includes('DataDome');
  });

  if (hasCaptcha) {
    console.log('⚠️  CAPTCHA detected! The page is showing anti-bot protection.');
    console.log('Please solve the CAPTCHA manually in the browser window...');
    console.log('Waiting 30 seconds for manual intervention...');
    await page.waitForTimeout(30000);
  }

  const html = await page.content();

  // Save the HTML to inspect
  fs.writeFileSync('debug-page.html', html);
  console.log('Saved HTML to debug-page.html');

  const $ = cheerio.load(html);

  // Try various selectors to find event links
  console.log('\n=== Debugging Selectors ===');

  console.log('\nAll links starting with /events/:');
  $('a[href^="/events/"]').each((i, a) => {
    if (i < 10) console.log('  ', $(a).attr('href'));
  });

  console.log('\nLinks matching /events/\\d+ pattern:');
  $('a[href^="/events/"]').each((i, a) => {
    const href = $(a).attr('href');
    if (/^\/events\/\d+/.test(href)) {
      console.log('  ', href);
    }
  });

  console.log('\nAll links with event in href:');
  $('a[href*="event"]').each((i, a) => {
    if (i < 10) console.log('  ', $(a).attr('href'));
  });

  console.log('\nElements with "event" in class:');
  $('[class*="event" i]').each((i, el) => {
    if (i < 5) console.log('  ', el.attribs.class);
  });

  console.log('\nElements with data-tracking:');
  $('[data-tracking]').each((i, el) => {
    if (i < 5) console.log('  ', el.attribs['data-tracking']);
  });

  console.log('\nAll article elements:');
  $('article').each((i, el) => {
    if (i < 5) console.log('  ', el.attribs);
  });

  await browser.close();
}

debugPage().catch(console.error);

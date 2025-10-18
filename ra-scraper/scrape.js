import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';
import dayjs from 'dayjs';
import fs from 'fs';
import { z } from 'zod';

const EventSchema = z.object({
  id: z.string(),
  title: z.string().optional().nullable(),
  date: z.string().optional().nullable(),       // YYYY-MM-DD
  startTime: z.string().optional().nullable(),  // HH:mm
  endTime: z.string().optional().nullable(),
  venue: z.string().optional().nullable(),
  city: z.string().default('Tbilisi'),
  country: z.string().default('GE'),
  price: z.string().optional().nullable(),
  artists: z.array(z.string()).default([]),
  image: z.string().optional().nullable(),
  raUrl: z.string(),
  description: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([])
});

const BASE = 'https://ra.co';
const LISTING = (page=1) => `${BASE}/events/ge/tbilisi?page=${page}`;

function extractEventId(url) {
  const m = url.match(/\/events\/(\d+)/);
  return m ? `ra-${m[1]}` : url;
}

async function getEventLinks(page, pageNum) {
  await page.goto(LISTING(pageNum), { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wait for content to load (after any CAPTCHA)
  await page.waitForTimeout(5000);

  // Check for CAPTCHA
  let hasCaptcha = await page.evaluate(() => {
    return document.body.innerHTML.includes('captcha-delivery') ||
           document.body.innerHTML.includes('DataDome');
  });

  if (hasCaptcha) {
    console.log('⚠️  CAPTCHA detected on page', pageNum);
    console.log('Please solve the CAPTCHA in the browser window...');
    console.log('Waiting 30 seconds for manual intervention...');
    await page.waitForTimeout(30000);

    // Check again after waiting
    hasCaptcha = await page.evaluate(() => {
      return document.body.innerHTML.includes('captcha-delivery') ||
             document.body.innerHTML.includes('DataDome');
    });

    if (hasCaptcha) {
      console.log('⚠️  Still blocked by CAPTCHA. Exiting...');
      throw new Error('CAPTCHA not solved');
    }
  }

  const html = await page.content();
  const $ = cheerio.load(html);

  // Grab all links that look like "/events/<id>" (with or without anchor tags like #tickets)
  const links = new Set();
  $('a[href^="/events/"]').each((_, a) => {
    const href = $(a).attr('href');
    // Match /events/\d+ with optional hash/query params
    const match = href.match(/^\/events\/(\d+)/);
    if (match) {
      const eventId = match[1];
      links.add(`${BASE}/events/${eventId}`);
    }
  });

  console.log(`Found ${links.size} events on page ${pageNum}`);
  return [...links];
}

function firstJsonLdOfType($, types=['MusicEvent','Event']) {
  const nodes = [];
  $('script[type="application/ld+json"]').each((_, s) => {
    try {
      const obj = JSON.parse($(s).text());
      const arr = Array.isArray(obj) ? obj : [obj];
      for (const item of arr) nodes.push(item);
    } catch {}
  });
  return nodes.find(n => types.includes(n['@type'])) || null;
}

function normalizeFromJsonLd(obj, raUrl) {
  const get = (x) => (Array.isArray(x) ? x[0] : x);
  const name = obj.name || null;

  const start = obj.startDate ? dayjs(obj.startDate) : null;
  const end = obj.endDate ? dayjs(obj.endDate) : null;

  const venue = obj.location?.name || obj.location?.address?.name || null;
  const image = get(obj.image)?.url || get(obj.image) || null;
  const artists = (obj.performer || [])
    .map(p => (typeof p === 'string' ? p : p?.name))
    .filter(Boolean);

  return {
    id: extractEventId(raUrl),
    title: name,
    date: start ? start.format('YYYY-MM-DD') : null,
    startTime: start ? start.format('HH:mm') : null,
    endTime: end ? end.format('HH:mm') : null,
    venue,
    city: 'Tbilisi',
    country: 'GE',
    price: null,
    artists,
    image,
    raUrl,
    description: obj.description || null,
    tags: []
  };
}

function fallbackFromDom($, raUrl) {
  // VERY conservative fallbacks — tweak selectors after inspecting the page once.
  const title = $('h1, h2').first().text().trim() || null;
  const image = $('img').first().attr('src') || null;
  const venue = $('[data-test="venue"], a[href*="/clubs/"]').first().text().trim() || null;

  // Try to detect date text like "Sat, 18 Oct 2025"
  const dateText = $('time').first().attr('datetime') || $('time').first().text();
  const d = dayjs(dateText);
  const date = d.isValid() ? d.format('YYYY-MM-DD') : null;

  const artists = [];
  $('[data-test="artist"], [class*="artist"], a[href*="/dj/"]').each((_, el) => {
    const name = cheerio(el).text().trim();
    if (name) artists.push(name);
  });

  return {
    id: extractEventId(raUrl),
    title, date,
    startTime: null, endTime: null,
    venue,
    city: 'Tbilisi', country: 'GE',
    price: null,
    artists,
    image,
    raUrl,
    description: null,
    tags: []
  };
}

async function scrapeEvent(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000); // Wait for JS to render

  const html = await page.content();
  const $ = cheerio.load(html);

  const ld = firstJsonLdOfType($);
  const raw = ld ? normalizeFromJsonLd(ld, url) : fallbackFromDom($, url);

  // Validate & coerce
  const parsed = EventSchema.parse(raw);
  return parsed;
}

async function main({ fromPage=1, toPage=2, concurrency=3 } = {}) {
  const browser = await chromium.launch({
    headless: false, // Use visible browser to avoid detection
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
  });

  const page = await context.newPage();

  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
  });

  const allLinks = new Set();
  for (let p = fromPage; p <= toPage; p++) {
    const links = await getEventLinks(page, p);
    links.forEach(l => allLinks.add(l));
  }

  const limit = pLimit(concurrency);
  const events = (await Promise.all(
    [...allLinks].map(link => limit(async () => {
      try {
        // Create a new page for each event to avoid conflicts
        const eventPage = await context.newPage();
        const result = await scrapeEvent(eventPage, link);
        await eventPage.close();
        return result;
      }
      catch (e) {
        console.error('Failed:', link, e.message);
        return null;
      }
    }))
  )).filter(Boolean);

  await browser.close();

  const timestamp = dayjs().format('YYYYMMDDHHmmss');
  const filename = `tbilisi-events-${timestamp}.json`;
  const output = {
    source: 'ra',
    city: 'Tbilisi',
    country: 'GE',
    scrapedAt: new Date().toISOString(),
    events
  };
  fs.writeFileSync(filename, JSON.stringify(output, null, 2));
  console.log(`✅ Saved ${events.length} events to ${filename}`);
  return output;
}

main({ fromPage: 1, toPage: 1, concurrency: 1 }).catch(console.error);

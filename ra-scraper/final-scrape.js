import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import dayjs from 'dayjs';
import fs from 'fs';

const BASE = 'https://ra.co';
const LISTING = (page=1) => `${BASE}/events/ge/tbilisi?page=${page}`;
const GRAPHQL_URL = 'https://ra.co/graphql';

const GET_EVENT_QUERY = `
  query GET_EVENT($id: ID!) {
    event(id: $id) {
      id
      title
      date
      startTime
      endTime
      venue {
        id
        name
      }
      artists {
        id
        name
      }
      images {
        filename
      }
      content
    }
  }
`;

async function getEventIds(page, pageNum) {
  console.log(`Fetching event IDs from page ${pageNum}...`);
  await page.goto(LISTING(pageNum), { waitUntil: 'networkidle', timeout: 90000 });

  console.log('Waiting for initial content load...');
  await page.waitForTimeout(8000);

  // Check for CAPTCHA
  let hasCaptcha = await page.evaluate(() => {
    return document.body.innerHTML.includes('captcha-delivery') ||
           document.body.innerHTML.includes('DataDome');
  });

  if (hasCaptcha) {
    console.log('⚠️  CAPTCHA detected! Please solve it in the browser window...');
    console.log('Waiting 45 seconds...');
    await page.waitForTimeout(45000);

    hasCaptcha = await page.evaluate(() => {
      return document.body.innerHTML.includes('captcha-delivery') ||
             document.body.innerHTML.includes('DataDome');
    });

    if (hasCaptcha) {
      throw new Error('CAPTCHA not solved');
    }
  }

  // Scroll to load all lazy-loaded events
  console.log('Scrolling to load all events...');
  let previousCount = 0;
  let stableCount = 0;

  for (let i = 0; i < 10; i++) {
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    // Count current event links
    const currentCount = await page.evaluate(() => {
      return document.querySelectorAll('a[href^="/events/"]').length;
    });

    console.log(`  Scroll ${i + 1}: Found ${currentCount} event links`);

    // If count hasn't changed for 2 scrolls, we've reached the end
    if (currentCount === previousCount) {
      stableCount++;
      if (stableCount >= 2) {
        console.log('  No more events loading, stopping scroll');
        break;
      }
    } else {
      stableCount = 0;
    }

    previousCount = currentCount;
  }

  // Get final HTML after all scrolling
  await page.waitForTimeout(3000);
  const html = await page.content();
  const $ = cheerio.load(html);

  // Extract all event IDs (both relative and absolute URLs)
  const ids = new Set();
  $('a[href*="/events/"]').each((_, a) => {
    const href = $(a).attr('href');
    // Match both /events/123 and https://ra.co/events/123
    const match = href.match(/\/events\/(\d+)/);
    if (match) {
      ids.add(match[1]);
    }
  });

  console.log(`\n✅ Total unique event IDs found: ${ids.size}`);
  return [...ids];
}

async function fetchEventFromAPI(eventId) {
  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        query: GET_EVENT_QUERY,
        variables: { id: eventId }
      })
    });

    const json = await response.json();

    if (json.errors) {
      console.error(`Error fetching event ${eventId}:`, json.errors[0]?.message);
      return null;
    }

    if (!json.data || !json.data.event) {
      return null;
    }

    const event = json.data.event;

    return {
      id: `ra-${event.id}`,
      title: event.title || null,
      date: event.date ? dayjs(event.date).format('YYYY-MM-DD') : null,
      startTime: event.startTime ? dayjs(event.startTime).format('HH:mm') : null,
      endTime: event.endTime ? dayjs(event.endTime).format('HH:mm') : null,
      venue: event.venue?.name || null,
      city: 'Tbilisi',
      country: 'GE',
      artists: event.artists?.map(a => a.name) || [],
      image: event.images?.[0]?.filename || null,
      raUrl: `https://ra.co/events/${event.id}`,
      description: event.content || null
    };

  } catch (error) {
    console.error(`Failed to fetch event ${eventId}:`, error.message);
    return null;
  }
}

async function main({ fromPage = 1, toPage = 1, delayMs = 1000 } = {}) {
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
  });

  const page = await context.newPage();

  // Step 1: Get all event IDs from listing pages
  const allIds = new Set();
  for (let p = fromPage; p <= toPage; p++) {
    const ids = await getEventIds(page, p);
    ids.forEach(id => allIds.add(id));
  }

  await browser.close();

  console.log(`\nTotal unique events found: ${allIds.size}`);
  console.log('Fetching event details from GraphQL API...\n');

  // Step 2: Fetch each event via GraphQL API
  const events = [];
  let count = 0;
  for (const id of allIds) {
    count++;
    console.log(`[${count}/${allIds.size}] Fetching event ${id}...`);

    const event = await fetchEventFromAPI(id);
    if (event) {
      events.push(event);
    }

    // Rate limiting
    if (count < allIds.size) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // Step 3: Save results
  const timestamp = dayjs().format('YYYYMMDDHHmmss');
  const filename = `tbilisi-events-final-${timestamp}.json`;
  const output = {
    source: 'ra-hybrid',
    method: 'Playwright listing + GraphQL API',
    city: 'Tbilisi',
    country: 'GE',
    scrapedAt: new Date().toISOString(),
    totalEvents: events.length,
    events
  };

  fs.writeFileSync(filename, JSON.stringify(output, null, 2));
  console.log(`\n✅ Successfully saved ${events.length} events to ${filename}`);

  return output;
}

main({ fromPage: 1, toPage: 1, delayMs: 500 }).catch(console.error);

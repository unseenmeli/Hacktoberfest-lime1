import { chromium } from 'playwright';
import fetch from 'node-fetch';
import dayjs from 'dayjs';
import fs from 'fs';
import pLimit from 'p-limit';

const limit = pLimit(5);

// ===== RA.CO SCRAPER =====
const RA_LISTING = (page) => `https://ra.co/events/ge/tbilisi?page=${page}`;
const RA_GRAPHQL_URL = 'https://ra.co/graphql';

const GET_EVENT_QUERY = `
  query GetEvent($id: ID!) {
    event(id: $id) {
      id
      title
      date
      startTime
      endTime
      venue {
        id
        name
        contentUrl
      }
      images {
        filename
      }
      artists {
        id
        name
      }
      pick {
        id
      }
      content {
        body
      }
      contentUrl
    }
  }
`;

async function scrapeRAEvents() {
  console.log('🎵 Scraping RA.co events for Tbilisi...\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  // Get event IDs from listing page
  async function getEventIds(pageNum = 1) {
    await page.goto(RA_LISTING(pageNum), { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(8000);

    // Check for CAPTCHA
    let hasCaptcha = await page.evaluate(() => {
      return document.body.innerHTML.includes('captcha-delivery') ||
             document.body.innerHTML.includes('DataDome');
    });

    if (hasCaptcha) {
      console.log('⚠️  CAPTCHA detected! Please solve it in the browser window...');
      await page.waitForTimeout(45000);
    }

    // Scroll to load all events
    let previousCount = 0;
    let stableCount = 0;
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);

      const currentCount = await page.evaluate(() => {
        return document.querySelectorAll('a[href^="/events/"]').length;
      });

      if (currentCount === previousCount) {
        stableCount++;
        if (stableCount >= 2) break;
      } else {
        stableCount = 0;
      }
      previousCount = currentCount;
    }

    // Extract event IDs
    const html = await page.content();
    const ids = new Set();
    const regex = /\/events\/(\d+)/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      ids.add(match[1]);
    }

    return [...ids];
  }

  console.log('Getting event IDs from RA.co...');
  const eventIds = await getEventIds(1);
  console.log(`Found ${eventIds.length} event IDs\n`);

  await browser.close();

  // Fetch full event data via GraphQL
  console.log('Fetching event details from GraphQL API...');

  async function fetchEventFromAPI(eventId) {
    try {
      const response = await fetch(RA_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: GET_EVENT_QUERY,
          variables: { id: eventId }
        })
      });

      const data = await response.json();

      if (data.data?.event) {
        const event = data.data.event;
        return {
          id: `ra-${event.id}`,
          title: event.title,
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          venue: event.venue?.name || null,
          venueUrl: event.venue?.contentUrl ? `https://ra.co${event.venue.contentUrl}` : null,
          artists: event.artists?.map(a => a.name) || [],
          description: event.content?.body || null,
          image: event.images?.[0]?.filename ? `https://ra.co${event.images[0].filename}` : null,
          url: event.contentUrl ? `https://ra.co${event.contentUrl}` : null,
          isPick: !!event.pick,
          source: 'ra.co'
        };
      }
      return null;
    } catch (err) {
      console.error(`Error fetching event ${eventId}:`, err.message);
      return null;
    }
  }

  const raEvents = [];
  const promises = eventIds.map(id => limit(async () => {
    const event = await fetchEventFromAPI(id);
    if (event) {
      raEvents.push(event);
      process.stdout.write('.');
    }
    return event;
  }));

  await Promise.all(promises);
  console.log(`\n✅ Scraped ${raEvents.length} events from RA.co\n`);

  return raEvents;
}

// ===== TKT.GE SCRAPER =====
async function scrapeTKTEvents() {
  console.log('🎫 Scraping TKT.ge concerts...\n');

  const API_KEY = '7d8d34d1-e9af-4897-9f0f-5c36c179be77';
  const BASE_URL = 'https://gateway.tkt.ge';

  try {
    const url = `${BASE_URL}/Shows/List?categoryId=2&api_key=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const shows = data.shows || [];

    console.log(`Found ${shows.length} concerts\n`);

    const events = shows.map(show => {
      const venue = show.venues?.[0];
      const eventInfo = venue?.eventInfos?.[0];

      return {
        id: `tkt-${show.showId}`,
        title: show.name,
        date: show.fromDate || eventInfo?.eventDate || null,
        venue: venue?.name || null,
        description: show.description?.replace(/<[^>]*>/g, '').trim() || null,
        priceMin: show.minPrice || null,
        priceMax: show.maxPrice || null,
        isSoldOut: show.isSoldOut || false,
        image: show.desktopImage ? `https://static.tkt.ge/${show.desktopImage}` : null,
        url: `https://tkt.ge/event/${show.showId}`,
        source: 'tkt.ge'
      };
    });

    console.log(`✅ Scraped ${events.length} events from TKT.ge\n`);
    return events;

  } catch (error) {
    console.error('Error fetching TKT.ge concerts:', error.message);
    return [];
  }
}

// ===== MAIN =====
async function scrapeAllEvents() {
  console.log('====================================');
  console.log('   EVENT SCRAPER - TBILISI, GEORGIA');
  console.log('====================================\n');

  const startTime = Date.now();

  // Scrape from both sources
  const [raEvents, tktEvents] = await Promise.all([
    scrapeRAEvents(),
    scrapeTKTEvents()
  ]);

  // Combine all events
  const allEvents = [...raEvents, ...tktEvents];

  const timestamp = dayjs().format('YYYYMMDDHHmmss');
  const filename = `tbilisi-all-events-${timestamp}.json`;

  const output = {
    location: 'Tbilisi, Georgia',
    scrapedAt: new Date().toISOString(),
    totalEvents: allEvents.length,
    sources: {
      'ra.co': raEvents.length,
      'tkt.ge': tktEvents.length
    },
    events: allEvents
  };

  fs.writeFileSync(filename, JSON.stringify(output, null, 2));

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('====================================');
  console.log('           SCRAPING COMPLETE        ');
  console.log('====================================\n');
  console.log(`✅ Total events scraped: ${allEvents.length}`);
  console.log(`   - RA.co: ${raEvents.length} events`);
  console.log(`   - TKT.ge: ${tktEvents.length} events`);
  console.log(`\n📁 Saved to: ${filename}`);
  console.log(`⏱️  Time taken: ${duration}s\n`);

  // Show sample events from each source
  console.log('Sample events:\n');

  if (raEvents.length > 0) {
    console.log('RA.co events:');
    raEvents.slice(0, 3).forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.title}`);
      console.log(`     Date: ${e.date || 'TBA'} ${e.startTime || ''}`);
      console.log(`     Venue: ${e.venue || 'TBA'}\n`);
    });
  }

  if (tktEvents.length > 0) {
    console.log('TKT.ge events:');
    tktEvents.slice(0, 3).forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.title}`);
      console.log(`     Date: ${e.date || 'TBA'}`);
      console.log(`     Venue: ${e.venue || 'TBA'}`);
      console.log(`     Price: ${e.priceMin}₾ - ${e.priceMax}₾\n`);
    });
  }

  return output;
}

scrapeAllEvents().catch(console.error);

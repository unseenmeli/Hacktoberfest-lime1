import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import dayjs from 'dayjs';
import fs from 'fs';

// Bandsintown events for a location
const LOCATION = 'Tbilisi, Georgia';
const URL = `https://www.bandsintown.com/?came_from=257`;

async function scrapeBandsintown() {
  console.log(`🎯 Scraping Bandsintown events...\n`);

  const browser = await chromium.launch({
    headless: false
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  const page = await context.newPage();

  console.log('Loading page...');
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  // Try to find and use location search if available
  try {
    const searchInput = await page.$('input[type="text"]');
    if (searchInput) {
      console.log(`Searching for ${LOCATION}...\n`);
      await searchInput.fill(LOCATION);
      await page.waitForTimeout(2000);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(5000);
    }
  } catch (e) {
    console.log('Could not use search, continuing...\n');
  }

  // Scroll to load more events
  console.log('Scrolling to load events...');
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
  }

  await page.waitForTimeout(3000);

  // Check for __NEXT_DATA__ (Next.js app)
  const nextData = await page.evaluate(() => {
    const scriptTag = document.getElementById('__NEXT_DATA__');
    if (scriptTag) {
      return JSON.parse(scriptTag.textContent);
    }
    return null;
  });

  let events = [];

  if (nextData) {
    console.log('✅ Found __NEXT_DATA__, extracting events...\n');
    fs.writeFileSync('bandsintown-next-data.json', JSON.stringify(nextData, null, 2));

    // Try to find events in the Next.js data structure
    const dataStr = JSON.stringify(nextData);
    const hasEvents = dataStr.includes('"event') || dataStr.includes('"artist');

    if (hasEvents) {
      // Navigate through the Next.js data structure to find events
      const searchForEvents = (obj, path = '') => {
        if (!obj || typeof obj !== 'object') return;

        if (Array.isArray(obj)) {
          obj.forEach((item, i) => {
            if (item && typeof item === 'object') {
              // Check if this looks like an event
              if ((item.artist || item.lineup || item.title) &&
                  (item.venue || item.location) &&
                  (item.datetime || item.date || item.starts_at)) {
                events.push(item);
              } else {
                searchForEvents(item, `${path}[${i}]`);
              }
            }
          });
        } else {
          Object.keys(obj).forEach(key => {
            if (key.toLowerCase().includes('event') || key.toLowerCase().includes('concert')) {
              if (Array.isArray(obj[key])) {
                obj[key].forEach(item => {
                  if (item && typeof item === 'object') {
                    events.push(item);
                  }
                });
              }
            }
            searchForEvents(obj[key], `${path}.${key}`);
          });
        }
      };

      searchForEvents(nextData);
      console.log(`Found ${events.length} events in __NEXT_DATA__\n`);
    }
  }

  // If no events from Next data, try HTML parsing
  if (events.length === 0) {
    console.log('Trying HTML parsing...\n');

    const html = await page.content();
    const $ = cheerio.load(html);

    // Look for event elements
    const eventSelectors = [
      '[data-event-id]',
      '[data-artist-id]',
      '.event-card',
      '.event-item',
      '[class*="Event"]',
      'article'
    ];

    for (const selector of eventSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements with selector: ${selector}`);

        elements.each((_, el) => {
          const $el = $(el);

          // Try to extract event data
          const event = {
            title: $el.find('[class*="title"], [class*="name"], h1, h2, h3').first().text().trim(),
            artist: $el.find('[class*="artist"]').first().text().trim(),
            venue: $el.find('[class*="venue"], [class*="location"]').first().text().trim(),
            date: $el.find('[class*="date"], [class*="time"], time').first().text().trim(),
            link: $el.find('a').first().attr('href'),
            image: $el.find('img').first().attr('src')
          };

          if (event.title || event.artist) {
            events.push(event);
          }
        });

        if (events.length > 0) break;
      }
    }
  }

  await browser.close();

  if (events.length === 0) {
    console.log('❌ Could not extract events from Bandsintown.');
    console.log('\nPossible issues:');
    console.log('- Bandsintown may require authentication or API keys');
    console.log('- Location might not have events');
    console.log('- Strong bot protection in place');
    console.log('\nNote: Bandsintown has an official API that requires registration:');
    console.log('https://www.bandsintown.com/api/overview');
    return null;
  }

  // Transform to clean format
  const transformedEvents = events.slice(0, 50).map((event, i) => {
    return {
      id: `bandsintown-${event.id || i}`,
      title: event.title || event.name || event.description || null,
      artist: event.artist?.name || event.artist || event.lineup?.join(', ') || null,
      date: event.datetime || event.date || event.starts_at || null,
      venue: event.venue?.name || event.venue || event.location?.name || null,
      city: event.venue?.city || event.city || null,
      country: event.venue?.country || event.country || null,
      description: event.description || null,
      url: event.url || event.facebook_rsvp_url || (event.link && !event.link.startsWith('/') ? event.link : `https://www.bandsintown.com${event.link}`) || null,
      image: event.image_url || event.thumb_url || event.image || null,
      source: 'bandsintown.com'
    };
  });

  // Save to file
  const timestamp = dayjs().format('YYYYMMDDHHmmss');
  const filename = `bandsintown-events-${timestamp}.json`;
  const output = {
    source: 'bandsintown.com',
    location: LOCATION,
    scrapedAt: new Date().toISOString(),
    totalEvents: transformedEvents.length,
    events: transformedEvents
  };

  fs.writeFileSync(filename, JSON.stringify(output, null, 2));

  console.log(`✅ Successfully scraped ${transformedEvents.length} events!`);
  console.log(`📁 Saved to: ${filename}\n`);

  // Show sample
  console.log('Sample events:');
  transformedEvents.slice(0, 5).forEach((e, i) => {
    console.log(`${i + 1}. ${e.title || e.artist || 'Unknown'}`);
    console.log(`   Date: ${e.date || 'TBA'}`);
    console.log(`   Venue: ${e.venue || 'TBA'}\n`);
  });

  return output;
}

scrapeBandsintown().catch(console.error);

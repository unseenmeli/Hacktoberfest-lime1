import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import dayjs from 'dayjs';
import fs from 'fs';

// Bandsintown with city_id
const URL = 'https://www.bandsintown.com/?city_id=611717';

async function scrapeBandsintownCity() {
  console.log('🎯 Scraping Bandsintown for Tbilisi (city_id=611717)...\n');

  const browser = await chromium.launch({
    headless: false
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  const page = await context.newPage();

  const apiCalls = [];

  // Intercept API calls
  page.on('response', async (response) => {
    const url = response.url();
    const request = response.request();

    if (url.includes('bandsintown') &&
        !url.includes('.css') &&
        !url.includes('.js') &&
        !url.includes('.png') &&
        !url.includes('.jpg') &&
        !url.includes('.webp') &&
        !url.includes('.svg') &&
        !url.includes('.woff') &&
        !url.includes('assets.') &&
        !url.includes('media.') &&
        !url.includes('px1.') &&
        !url.includes('px2.') &&
        !url.includes('google') &&
        !url.includes('facebook') &&
        !url.includes('favicon')) {

      const type = request.resourceType();
      if (type === 'xhr' || type === 'fetch') {
        try {
          const contentType = response.headers()['content-type'] || '';
          if (contentType.includes('application/json')) {
            const json = await response.json();
            const jsonStr = JSON.stringify(json);

            // Look for event data
            if (jsonStr.includes('"artist') ||
                jsonStr.includes('"event') ||
                jsonStr.includes('"lineup') ||
                jsonStr.includes('"venue')) {

              console.log(`📡 Found API call: ${url}`);
              apiCalls.push({
                url,
                method: request.method(),
                data: json
              });
            }
          }
        } catch (e) {
          // Not JSON
        }
      }
    }
  });

  console.log('Loading page...');
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log('Page loaded, waiting for content...\n');

  await page.waitForTimeout(5000);

  // Scroll to load more events
  console.log('Scrolling to load more events...');
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
  }

  await page.waitForTimeout(3000);

  // Extract __NEXT_DATA__
  const nextData = await page.evaluate(() => {
    const scriptTag = document.getElementById('__NEXT_DATA__');
    if (scriptTag) {
      return JSON.parse(scriptTag.textContent);
    }
    return null;
  });

  let events = [];

  // Check API calls first
  if (apiCalls.length > 0) {
    console.log(`\n✅ Found ${apiCalls.length} API calls with event data\n`);

    apiCalls.forEach(call => {
      const data = call.data;

      // Try to find events in different structures
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (item && typeof item === 'object' && (item.artist || item.event || item.lineup)) {
            events.push(item);
          }
        });
      } else if (data.events && Array.isArray(data.events)) {
        events.push(...data.events);
      } else if (data.data && Array.isArray(data.data)) {
        events.push(...data.data);
      }
    });

    if (apiCalls.length > 0) {
      fs.writeFileSync('bandsintown-city-api-calls.json', JSON.stringify(apiCalls, null, 2));
      console.log('Saved API calls to bandsintown-city-api-calls.json\n');
    }
  }

  // Check Next.js data
  if (events.length === 0 && nextData) {
    console.log('Checking __NEXT_DATA__ for events...\n');

    const searchForEvents = (obj, depth = 0) => {
      if (depth > 10 || !obj || typeof obj !== 'object') return;

      if (Array.isArray(obj)) {
        obj.forEach(item => {
          if (item && typeof item === 'object') {
            // Check if this looks like an event
            const hasArtist = item.artist || item.lineup || item.artistName;
            const hasVenue = item.venue || item.location || item.venueName;
            const hasDate = item.datetime || item.date || item.starts_at || item.eventDate;

            if ((hasArtist && hasVenue) || (hasArtist && hasDate)) {
              events.push(item);
            } else {
              searchForEvents(item, depth + 1);
            }
          }
        });
      } else {
        Object.keys(obj).forEach(key => {
          if (key.toLowerCase().includes('event') ||
              key.toLowerCase().includes('show') ||
              key.toLowerCase().includes('concert')) {
            if (Array.isArray(obj[key])) {
              obj[key].forEach(item => {
                if (item && typeof item === 'object') {
                  events.push(item);
                }
              });
            }
          }
          searchForEvents(obj[key], depth + 1);
        });
      }
    };

    searchForEvents(nextData);

    if (nextData) {
      fs.writeFileSync('bandsintown-city-next-data.json', JSON.stringify(nextData, null, 2));
      console.log('Saved Next.js data to bandsintown-city-next-data.json\n');
    }
  }

  // Fallback to HTML parsing
  if (events.length === 0) {
    console.log('Trying HTML parsing...\n');

    const html = await page.content();
    fs.writeFileSync('bandsintown-city-page.html', html);

    const $ = cheerio.load(html);

    // Look for any links that might be events
    const eventLinks = new Set();
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (href && (href.includes('/e/') || href.includes('/event/') || href.includes('/concert/'))) {
        eventLinks.add(href);
      }
    });

    console.log(`Found ${eventLinks.size} potential event links`);

    // Try to extract any visible event data
    $('[class*="event"], [class*="Event"], [class*="show"], [class*="Show"], article').each((_, el) => {
      const $el = $(el);
      const text = $el.text();

      // Check if this element has event-like content
      if (text.length > 20 && text.length < 500) {
        const event = {
          title: $el.find('h1, h2, h3, h4, [class*="title"], [class*="name"]').first().text().trim(),
          venue: $el.find('[class*="venue"], [class*="location"]').first().text().trim(),
          date: $el.find('[class*="date"], time, [class*="time"]').first().text().trim(),
          link: $el.find('a').first().attr('href')
        };

        if (event.title && (event.venue || event.date)) {
          events.push(event);
        }
      }
    });
  }

  await browser.close();

  console.log(`\n=== Results ===`);
  console.log(`Total events found: ${events.length}\n`);

  if (events.length === 0) {
    console.log('❌ Could not extract events.');
    console.log('\nThe page might:');
    console.log('- Require authentication');
    console.log('- Load events dynamically after page load');
    console.log('- Use a different data structure than expected');
    return null;
  }

  // Transform to clean format
  const transformedEvents = events.slice(0, 100).map((event, i) => {
    return {
      id: `bandsintown-${event.id || i}`,
      title: event.title || event.name || event.description || null,
      artist: event.artist?.name || event.artist || event.artistName || event.lineup?.join(', ') || null,
      date: event.datetime || event.date || event.starts_at || event.eventDate || null,
      venue: event.venue?.name || event.venue || event.venueName || event.location?.name || null,
      city: event.venue?.city || event.city || null,
      country: event.venue?.country || event.country || null,
      description: event.description || null,
      url: event.url || event.facebook_rsvp_url || (event.link && event.link.startsWith('http') ? event.link : event.link ? `https://www.bandsintown.com${event.link}` : null),
      image: event.image_url || event.thumb_url || event.image || null,
      source: 'bandsintown.com'
    };
  });

  // Save to file
  const timestamp = dayjs().format('YYYYMMDDHHmmss');
  const filename = `bandsintown-tbilisi-${timestamp}.json`;
  const output = {
    source: 'bandsintown.com',
    location: 'Tbilisi, Georgia',
    city_id: '611717',
    scrapedAt: new Date().toISOString(),
    totalEvents: transformedEvents.length,
    events: transformedEvents
  };

  fs.writeFileSync(filename, JSON.stringify(output, null, 2));

  console.log(`✅ Successfully scraped ${transformedEvents.length} events!`);
  console.log(`📁 Saved to: ${filename}\n`);

  // Show sample
  console.log('Sample events:');
  transformedEvents.slice(0, 10).forEach((e, i) => {
    console.log(`${i + 1}. ${e.title || e.artist || 'Unknown'}`);
    console.log(`   Date: ${e.date || 'TBA'}`);
    console.log(`   Venue: ${e.venue || 'TBA'}\n`);
  });

  return output;
}

scrapeBandsintownCity().catch(console.error);

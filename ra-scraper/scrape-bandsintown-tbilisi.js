import { chromium } from 'playwright';
import fs from 'fs';

const URL = 'https://www.bandsintown.com/?city_id=611717';

async function scrapeBandsintownTbilisi() {
  console.log('Starting Bandsintown Tbilisi scraper...\n');
  console.log(`Target URL: ${URL}\n`);

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Track API calls
  const apiCalls = [];
  page.on('response', async (response) => {
    const url = response.url();
    try {
      if ((url.includes('bandsintown') || url.includes('api')) &&
          response.headers()['content-type']?.includes('application/json')) {
        const json = await response.json();
        console.log(`📡 API Call: ${url}`);
        apiCalls.push({ url, data: json });
      }
    } catch (e) {
      // Not JSON
    }
  });

  console.log('Loading page...');
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  console.log('Waiting for dynamic content to load (15 seconds)...');
  await page.waitForTimeout(15000);

  console.log('Scrolling to trigger lazy-loaded content...');
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
  }

  await page.waitForTimeout(3000);

  console.log('\n=== Strategy 1: Extracting window objects ===\n');

  // Extract all window variables that might contain data
  const windowData = await page.evaluate(() => {
    const data = {};

    // Common places apps store initial state
    const possibleKeys = [
      '__INITIAL_STATE__',
      '__STATE__',
      '__NEXT_DATA__',
      '__APOLLO_STATE__',
      '__PRELOADED_STATE__',
      'initialData',
      'initialState',
      '__data',
      'pageProps',
      '__remixContext',
      '__RELAY_STORE__'
    ];

    for (const key of possibleKeys) {
      if (window[key]) {
        data[key] = window[key];
      }
    }

    // Get all window keys that might be relevant
    const allKeys = Object.keys(window).filter(key =>
      !key.startsWith('webkit') &&
      !key.startsWith('chrome') &&
      key.includes('data') || key.includes('state') || key.includes('props')
    );

    data._allRelevantKeys = allKeys;

    return data;
  });

  console.log('Window data keys found:', Object.keys(windowData));
  if (Object.keys(windowData).length > 1) {
    fs.writeFileSync('bandsintown-window-data.json', JSON.stringify(windowData, null, 2));
    console.log('✅ Saved window data to bandsintown-window-data.json');
  }

  console.log('\n=== Strategy 2: Extracting script tags with JSON ===\n');

  const scriptData = await page.evaluate(() => {
    const scripts = [];
    const scriptElements = document.querySelectorAll('script');

    scriptElements.forEach((script, index) => {
      const type = script.getAttribute('type');
      const id = script.getAttribute('id');
      const content = script.textContent || '';

      // Look for JSON-like content or data structures
      if (
        type === 'application/json' ||
        type === 'application/ld+json' ||
        content.includes('{') && content.includes('}') &&
        (content.includes('event') || content.includes('Event') ||
         content.includes('artist') || content.includes('venue'))
      ) {
        scripts.push({
          index,
          type,
          id,
          contentLength: content.length,
          contentPreview: content.substring(0, 200),
          fullContent: content
        });
      }
    });

    return scripts;
  });

  console.log(`Found ${scriptData.length} script tags with potential data:`);
  scriptData.forEach((script, i) => {
    console.log(`  ${i + 1}. Type: ${script.type || 'none'}, ID: ${script.id || 'none'}, Length: ${script.contentLength}`);
  });

  if (scriptData.length > 0) {
    fs.writeFileSync('bandsintown-scripts.json', JSON.stringify(scriptData, null, 2));
    console.log('✅ Saved script data to bandsintown-scripts.json');
  }

  console.log('\n=== Strategy 3: Extracting data attributes from event elements ===\n');

  const eventElements = await page.evaluate(() => {
    const events = [];

    // Try multiple selectors
    const selectors = [
      '[class*="event"]',
      '[class*="Event"]',
      '[data-event]',
      '[data-event-id]',
      'article',
      '[role="article"]',
      'a[href*="/e/"]',
      'a[href*="/event"]',
      '[data-testid*="event"]'
    ];

    const foundElements = new Set();

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (!foundElements.has(el)) {
          foundElements.add(el);

          const eventData = {
            selector,
            tag: el.tagName,
            classes: el.className,
            dataAttributes: {},
            textContent: el.textContent?.substring(0, 200),
            innerHTML: el.innerHTML?.substring(0, 500),
            attributes: {}
          };

          // Get all data-* attributes
          Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith('data-')) {
              eventData.dataAttributes[attr.name] = attr.value;
            } else {
              eventData.attributes[attr.name] = attr.value;
            }
          });

          // Try to find nested event info
          const artistEl = el.querySelector('[class*="artist"], [class*="Artist"], .artist-name, [data-artist]');
          const venueEl = el.querySelector('[class*="venue"], [class*="Venue"], .venue-name, [data-venue]');
          const dateEl = el.querySelector('[class*="date"], [class*="Date"], time, [datetime]');
          const linkEl = el.querySelector('a[href]') || (el.tagName === 'A' ? el : null);

          if (artistEl) eventData.artist = artistEl.textContent?.trim();
          if (venueEl) eventData.venue = venueEl.textContent?.trim();
          if (dateEl) {
            eventData.date = dateEl.textContent?.trim();
            eventData.datetime = dateEl.getAttribute('datetime');
          }
          if (linkEl) eventData.link = linkEl.getAttribute('href');

          events.push(eventData);
        }
      });
    });

    return events;
  });

  console.log(`Found ${eventElements.length} potential event elements`);
  if (eventElements.length > 0) {
    fs.writeFileSync('bandsintown-elements.json', JSON.stringify(eventElements, null, 2));
    console.log('✅ Saved event elements to bandsintown-elements.json');

    // Show preview of first few events
    console.log('\nFirst 3 event elements:');
    eventElements.slice(0, 3).forEach((event, i) => {
      console.log(`\n${i + 1}. ${event.selector} (${event.tag})`);
      console.log(`   Artist: ${event.artist || 'N/A'}`);
      console.log(`   Venue: ${event.venue || 'N/A'}`);
      console.log(`   Date: ${event.date || 'N/A'}`);
      console.log(`   Link: ${event.link || 'N/A'}`);
    });
  }

  console.log('\n=== Strategy 4: Checking for Next.js or React data ===\n');

  const reactData = await page.evaluate(() => {
    // Look for React root
    const roots = document.querySelectorAll('[id*="root"], [id*="__next"]');
    const rootData = [];

    roots.forEach(root => {
      const keys = Object.keys(root);
      const reactKey = keys.find(key => key.startsWith('__react'));

      if (reactKey) {
        rootData.push({
          id: root.id,
          reactKey: reactKey,
          hasData: true
        });
      }
    });

    // Check for Next.js specifically
    const nextData = document.getElementById('__NEXT_DATA__');
    let nextJsonData = null;

    if (nextData) {
      try {
        nextJsonData = JSON.parse(nextData.textContent);
      } catch (e) {
        // Not valid JSON
      }
    }

    return {
      reactRoots: rootData,
      nextData: nextJsonData
    };
  });

  console.log('React roots found:', reactData.reactRoots.length);
  console.log('Next.js data found:', reactData.nextData ? 'Yes' : 'No');

  if (reactData.nextData) {
    fs.writeFileSync('bandsintown-nextjs-data.json', JSON.stringify(reactData.nextData, null, 2));
    console.log('✅ Saved Next.js data');
  }

  console.log('\n=== Strategy 5: Intercepted API calls ===\n');
  console.log(`Total API calls intercepted: ${apiCalls.length}`);

  if (apiCalls.length > 0) {
    fs.writeFileSync('bandsintown-api-calls-tbilisi.json', JSON.stringify(apiCalls, null, 2));
    console.log('✅ Saved API calls to bandsintown-api-calls-tbilisi.json');
  }

  console.log('\n=== Strategy 6: Direct DOM parsing for events ===\n');

  // Take a screenshot for debugging
  await page.screenshot({ path: 'bandsintown-tbilisi-page.png', fullPage: true });
  console.log('✅ Saved screenshot to bandsintown-tbilisi-page.png');

  // Save full HTML
  const html = await page.content();
  fs.writeFileSync('bandsintown-tbilisi-page.html', html);
  console.log('✅ Saved HTML to bandsintown-tbilisi-page.html');

  // Try to parse events from the current page state
  const parsedEvents = await page.evaluate(() => {
    const events = [];

    // Look for any container with multiple event-like children
    const containers = document.querySelectorAll('[class*="container"], [class*="list"], main, section');

    containers.forEach(container => {
      const potentialEvents = container.querySelectorAll('article, [class*="card"], [class*="event"], [class*="Event"]');

      potentialEvents.forEach(eventEl => {
        // Try to extract event data
        const event = {
          artist: null,
          venue: null,
          date: null,
          datetime: null,
          url: null,
          image: null
        };

        // Find artist name - usually in a heading or prominent text
        const headings = eventEl.querySelectorAll('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="name"], [class*="artist"]');
        if (headings.length > 0) {
          event.artist = headings[0].textContent?.trim();
        }

        // Find venue
        const venueEl = eventEl.querySelector('[class*="venue"], [class*="location"], [class*="place"]');
        if (venueEl) {
          event.venue = venueEl.textContent?.trim();
        }

        // Find date
        const timeEl = eventEl.querySelector('time, [datetime], [class*="date"]');
        if (timeEl) {
          event.date = timeEl.textContent?.trim();
          event.datetime = timeEl.getAttribute('datetime');
        }

        // Find link
        const linkEl = eventEl.querySelector('a[href*="/e/"], a[href*="/event"]') ||
                       (eventEl.tagName === 'A' ? eventEl : null);
        if (linkEl) {
          event.url = linkEl.getAttribute('href');
        }

        // Find image
        const imgEl = eventEl.querySelector('img');
        if (imgEl) {
          event.image = imgEl.getAttribute('src') || imgEl.getAttribute('data-src');
        }

        // Only add if we found at least artist or URL
        if (event.artist || event.url) {
          events.push(event);
        }
      });
    });

    return events;
  });

  console.log(`Parsed ${parsedEvents.length} events from DOM`);

  console.log('\n=== Final Results ===\n');

  let finalEvents = [];

  // Priority 1: Use parsed events if we found them
  if (parsedEvents.length > 0) {
    finalEvents = parsedEvents;
    console.log(`Using ${finalEvents.length} events from DOM parsing`);
  }
  // Priority 2: Use event elements if they have data
  else if (eventElements.length > 0 && eventElements.some(e => e.artist || e.link)) {
    finalEvents = eventElements
      .filter(e => e.artist || e.link)
      .map(e => ({
        artist: e.artist,
        venue: e.venue,
        date: e.date,
        datetime: e.datetime,
        url: e.link,
        image: null
      }));
    console.log(`Using ${finalEvents.length} events from element extraction`);
  }
  // Priority 3: Use API data if available
  else if (apiCalls.length > 0) {
    console.log('Using API call data');
    finalEvents = apiCalls;
  }

  if (finalEvents.length > 0) {
    const outputFile = 'bandsintown-tbilisi-events.json';
    fs.writeFileSync(outputFile, JSON.stringify(finalEvents, null, 2));
    console.log(`\n✅ SUCCESS! Saved ${finalEvents.length} events to ${outputFile}`);

    console.log('\nSample events:');
    finalEvents.slice(0, 5).forEach((event, i) => {
      console.log(`\n${i + 1}. Artist: ${event.artist || 'N/A'}`);
      console.log(`   Venue: ${event.venue || 'N/A'}`);
      console.log(`   Date: ${event.date || event.datetime || 'N/A'}`);
      console.log(`   URL: ${event.url || 'N/A'}`);
    });
  } else {
    console.log('⚠️  No events found. Check the generated files for debugging:');
    console.log('   - bandsintown-tbilisi-page.html');
    console.log('   - bandsintown-tbilisi-page.png');
    console.log('   - bandsintown-window-data.json');
    console.log('   - bandsintown-scripts.json');
    console.log('   - bandsintown-elements.json');
  }

  console.log('\n=== Keeping browser open for 30 seconds for inspection ===');
  await page.waitForTimeout(30000);

  await browser.close();
  console.log('\nDone!');
}

scrapeBandsintownTbilisi().catch(console.error);

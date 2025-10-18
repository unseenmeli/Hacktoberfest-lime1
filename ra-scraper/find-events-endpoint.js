import { chromium } from 'playwright';
import fs from 'fs';

// Try a URL with known events
const URL = 'https://www.bandsintown.com/upcoming-concerts?came_from=257';

async function findEventsEndpoint() {
  console.log('🔍 Finding Bandsintown events API endpoint...\n');

  const browser = await chromium.launch({
    headless: false
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  const page = await context.newPage();

  const apiCalls = [];

  // Listen to ALL bandsintown API calls
  page.on('response', async (response) => {
    const url = response.url();
    const request = response.request();

    // Look specifically for bandsintown API calls (not assets, not ads)
    if ((url.includes('bandsintown.com/') || url.includes('api.')) &&
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
        !url.includes('favicon')) {

      try {
        const contentType = response.headers()['content-type'] || '';

        if (contentType.includes('application/json')) {
          const json = await response.json();
          const jsonStr = JSON.stringify(json);

          // Look for actual event objects with more specific checks
          const hasEventObjects = (
            (jsonStr.includes('"artist') || jsonStr.includes('"lineup')) &&
            (jsonStr.includes('"venue') || jsonStr.includes('"location')) &&
            (jsonStr.includes('"datetime') || jsonStr.includes('"date'))
          );

          if (hasEventObjects || jsonStr.match(/"event.*?:\s*\[/)) {
            console.log(`✅ Found events API: ${url}`);

            apiCalls.push({
              url,
              method: request.method(),
              headers: request.headers(),
              postData: request.postData(),
              status: response.status(),
              data: json
            });
          }
        }
      } catch (e) {
        // Not JSON or error
      }
    }
  });

  console.log('Loading upcoming concerts page...\n');

  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('Page loaded, waiting for API calls...\n');

    await page.waitForTimeout(8000);

    // Scroll
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
    }

    await page.waitForTimeout(3000);

  } catch (err) {
    console.log(`Page load error: ${err.message}\n`);
  }

  console.log('=== Summary ===\n');
  console.log(`Total event API calls found: ${apiCalls.length}\n`);

  if (apiCalls.length > 0) {
    fs.writeFileSync('bandsintown-events-api.json', JSON.stringify(apiCalls, null, 2));
    console.log('✅ Saved to bandsintown-events-api.json');

    console.log('\nAPI Endpoints found:');
    apiCalls.forEach((call, i) => {
      console.log(`${i + 1}. [${call.method}] ${call.url}`);

      // Count events in response
      const dataStr = JSON.stringify(call.data);
      const artistMatches = dataStr.match(/"artist.*?name/gi)?.length || 0;
      const venueMatches = dataStr.match(/"venue.*?name/gi)?.length || 0;

      console.log(`   Approx. events: ${Math.max(artistMatches, venueMatches)}`);
    });
  } else {
    console.log('❌ No event API calls captured.');
    console.log('\nPossible reasons:');
    console.log('- Events might be embedded in HTML (server-side rendered)');
    console.log('- API might use different naming conventions');
    console.log('- Strong anti-scraping measures in place');
  }

  console.log('\nKeeping browser open for 20 seconds...');
  await page.waitForTimeout(20000);

  await browser.close();
}

findEventsEndpoint().catch(console.error);

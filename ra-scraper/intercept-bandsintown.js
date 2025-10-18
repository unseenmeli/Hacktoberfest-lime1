import { chromium } from 'playwright';
import fs from 'fs';

const URL = 'https://www.bandsintown.com/?came_from=257';

async function interceptBandsintown() {
  console.log('🔍 Intercepting Bandsintown API calls...\n');

  const browser = await chromium.launch({
    headless: false
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  const apiCalls = [];

  // Listen to ALL requests and responses
  page.on('request', request => {
    const url = request.url();
    // Log requests to bandsintown domains
    if (url.includes('bandsintown') && !url.includes('.css') && !url.includes('.js') && !url.includes('.png') && !url.includes('.jpg')) {
      console.log(`🔵 REQUEST: ${request.method()} ${url}`);
    }
  });

  page.on('response', async (response) => {
    const url = response.url();
    const request = response.request();

    // Only look at bandsintown API calls
    if (url.includes('bandsintown') &&
        !url.includes('.css') &&
        !url.includes('.js') &&
        !url.includes('.png') &&
        !url.includes('.jpg') &&
        !url.includes('.svg') &&
        !url.includes('.woff') &&
        !url.includes('google') &&
        !url.includes('facebook')) {

      const type = request.resourceType();
      console.log(`📡 ${type.toUpperCase()}: ${url}`);
      console.log(`   Status: ${response.status()}`);

      try {
        const contentType = response.headers()['content-type'] || '';

        if (contentType.includes('application/json')) {
          const json = await response.json();
          console.log(`   ✅ JSON response!`);

          // Check if it's events data
          const jsonStr = JSON.stringify(json);
          const hasEvents = jsonStr.includes('"event') ||
                           jsonStr.includes('"artist') ||
                           jsonStr.includes('"venue') ||
                           jsonStr.includes('"lineup');

          if (hasEvents) {
            console.log(`   🎯 Contains event data!`);
            apiCalls.push({
              url,
              method: request.method(),
              headers: request.headers(),
              postData: request.postData(),
              status: response.status(),
              data: json
            });
          }

          console.log(`   Data keys: ${Object.keys(json).slice(0, 10).join(', ')}`);
        }
      } catch (e) {
        // Not JSON or error parsing
      }

      console.log('');
    }
  });

  console.log('Loading page...\n');

  try {
    // Load with a longer timeout and don't wait for networkidle (it might never happen)
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('Page loaded, waiting for content...\n');

    // Wait for the page to render
    await page.waitForTimeout(5000);

    // Try to type in the search box if it exists
    const searchInput = await page.$('input[placeholder*="Search"], input[placeholder*="location"], input[placeholder*="city"]');

    if (searchInput) {
      console.log('Found search input, entering "Tbilisi"...\n');
      await searchInput.fill('Tbilisi, Georgia');
      await page.waitForTimeout(2000);

      // Press Enter or click search button
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
    }

    // Scroll to load more
    console.log('Scrolling...\n');
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
    }

    await page.waitForTimeout(5000);

  } catch (err) {
    console.log(`Page load error: ${err.message}\n`);
    console.log('Continuing to check for API calls...\n');
  }

  console.log('=== Summary ===\n');
  console.log(`Total API calls with event data: ${apiCalls.length}\n`);

  if (apiCalls.length > 0) {
    fs.writeFileSync('bandsintown-intercepted-api.json', JSON.stringify(apiCalls, null, 2));
    console.log('✅ Saved to bandsintown-intercepted-api.json');

    console.log('\nAPI Endpoints found:');
    apiCalls.forEach((call, i) => {
      console.log(`${i + 1}. [${call.method}] ${call.url}`);
      console.log(`   Event count in response: ${JSON.stringify(call.data).match(/"event/gi)?.length || 0}`);
    });
  } else {
    console.log('No event API calls captured. The site might:');
    console.log('- Load data embedded in HTML');
    console.log('- Use WebSocket connections');
    console.log('- Require user interaction to trigger API calls');
    console.log('- Have strong bot protection');
  }

  console.log('\nBrowser will stay open for 30 seconds for inspection...');
  await page.waitForTimeout(30000);

  await browser.close();
}

interceptBandsintown().catch(console.error);

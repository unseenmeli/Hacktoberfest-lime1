import { chromium } from 'playwright';
import fs from 'fs';

// Try Tbilisi
const URL = 'https://www.bandsintown.com/?came_from=257&location=Tbilisi,%20Georgia';

async function findBandsintownApi() {
  console.log('🔍 Finding bandsintown.com API endpoint...\n');

  const browser = await chromium.launch({
    headless: false
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  const apiCalls = [];

  // Listen to all network requests
  page.on('response', async (response) => {
    const url = response.url();
    const type = response.request().resourceType();

    // Look for API calls
    if (type === 'xhr' || type === 'fetch') {
      console.log(`📡 ${url.substring(0, 100)}`);

      try {
        const json = await response.json();

        // Check if it contains events data
        const jsonStr = JSON.stringify(json).toLowerCase();
        if (jsonStr.includes('event') || jsonStr.includes('concert') || jsonStr.includes('venue') || jsonStr.includes('artist')) {
          console.log('   ✅ Contains event data!');
          apiCalls.push({ url, data: json });
        }
      } catch (e) {
        // Not JSON
      }
    }
  });

  console.log('Loading page...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(8000);

  // Scroll
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
  }

  console.log('\n=== API Calls Found ===\n');
  console.log(`Total: ${apiCalls.length} calls with event data`);

  if (apiCalls.length > 0) {
    fs.writeFileSync('bandsintown-api-calls.json', JSON.stringify(apiCalls, null, 2));
    console.log('✅ Saved API calls to bandsintown-api-calls.json');

    console.log('\nAPI URLs:');
    apiCalls.forEach((call, i) => {
      console.log(`${i + 1}. ${call.url}`);
    });
  }

  await browser.close();
}

findBandsintownApi().catch(console.error);

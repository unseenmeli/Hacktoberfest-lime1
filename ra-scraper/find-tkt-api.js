import { chromium } from 'playwright';
import fs from 'fs';

const URL = 'https://tkt.ge/concerts';

async function findTktApi() {
  console.log('🔍 Finding tkt.ge API endpoint...\n');

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

    // Look for API calls (XHR or fetch)
    if (type === 'xhr' || type === 'fetch') {
      try {
        const json = await response.json();
        console.log(`📡 API Call: ${url}`);

        // Check if it contains events/concerts data
        if (JSON.stringify(json).toLowerCase().includes('concert') ||
            JSON.stringify(json).toLowerCase().includes('event')) {
          console.log('   ✅ Contains event/concert data!');
          apiCalls.push({ url, data: json });
        }
      } catch (e) {
        // Not JSON
      }
    }
  });

  console.log('Loading page...');
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  console.log('\n=== API Calls Found ===\n');
  console.log(`Total: ${apiCalls.length} calls with event data`);

  if (apiCalls.length > 0) {
    fs.writeFileSync('tkt-api-calls.json', JSON.stringify(apiCalls, null, 2));
    console.log('✅ Saved API calls to tkt-api-calls.json');
  }

  await browser.close();
}

findTktApi().catch(console.error);

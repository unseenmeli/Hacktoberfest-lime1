import { chromium } from 'playwright';
import { load } from 'cheerio';
import pLimit from 'p-limit';
import dayjs from 'dayjs';
import fs from 'fs';

const BASE = 'https://ra.co';
const LISTING = (page=1) => `${BASE}/events/ge/tbilisi?page=${page}`;

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return (i !== -1 && process.argv[i+1]) ? process.argv[i+1] : fallback;
}

const FROM = parseInt(arg('from', '1'), 10);
const TO = parseInt(arg('to', '1'), 10);
const MAX = parseInt(arg('max', '20'), 10);          // cap for testing
const CONCURRENCY = parseInt(arg('concurrency', '3'), 10);
const OUT = arg('out', `tbilisi-events-${dayjs().format('YYYYMMDD-HHmmss')}.json`);
const HEADLESS = arg('headless', 'false') === 'true'; // run headed first time to see what happens

function extractEventId(url) {
  const m = url.match(/\/events\/(\d+)/);
  return m ? `ra-${m[1]}` : url;
}

// --- little helpers ---------------------------------------------------------

async function ensureCookieAccepted(page) {
  try {
    // Common OneTrust ids/classes:
    // - #onetrust-accept-btn-handler
    // - button[aria-label="Accept all"], button:has-text("Accept"), .ot-sdk-container .accept-btn-handler
    const btn = await Promise.race([
      page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 4000 }).catch(() => null),
      page.waitForSelector('button:has-text("Accept")', { timeout: 4000 }).catch(() => null),
      page.waitForSelector('button[aria-label="Accept all"]', { timeout: 4000 }).catch(() => null),
    ]);
    if (btn) { await btn.click({ delay: 50 }); }
  } catch {}
}

async function scrollToBottom(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let total = 0;
      const step = () => {
        const { scrollTop, scrollHeight, clientHeight } = document.scrollingElement || document.documentElement;
        if (scrollTop + clientHeight >= scrollHeight - 2 || total > 30) return resolve();
        window.scrollBy(0, clientHeight);
        total++;
        setTimeout(step, 150);
      };
      step();
    });
  });
}

async function debugDump(page, prefix) {
  const html = await page.content();
  fs.writeFileSync(`${prefix}.html`, html);
  await page.screenshot({ path: `${prefix}.png`, fullPage: true });
  console.warn(`[debug] Saved ${prefix}.html and ${prefix}.png`);
}

// --- link collection (fixed) ------------------------------------------------

async function getEventLinks(page, pageNum) {
  const url = LISTING(pageNum);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await ensureCookieAccepted(page);
  await page.waitForLoadState('networkidle', { timeout: 15000 }); // let fetches settle
  // if lazy list, scroll a bit
  await scrollToBottom(page);

  // Read live DOM inside the page (more reliable than parsing HTML in Node)
  let links = [];
  try {
    links = await page.$$eval('a[href^="/events/"]', as =>
      as.map(a => a.getAttribute('href'))
        .filter(h => !!h && /^\/events\/\d+$/.test(h))
        .map(h => 'https://ra.co' + h)
    );
  } catch (e) {
    console.warn(`[warn] $$eval failed on page ${pageNum}:`, e.message);
  }

  // If nothing, dump debug artifacts to inspect
  if (!links.length) {
    await debugDump(page, `listing-page${pageNum}`);
  }

  // De-dupe
  return [...new Set(links)];
}

// --- event detail extraction ------------------------------------------------

function pickJsonLdEvent(objs) {
  const arr = Array.isArray(objs) ? objs : [objs];
  return arr.find(x => x && (x['@type'] === 'MusicEvent' || x['@type'] === 'Event')) || null;
}

async function getJsonLdFromPage(page) {
  return await page.$$eval('script[type="application/ld+json"]', nodes => {
    const pick = (objs) => {
      const arr = Array.isArray(objs) ? objs : [objs];
      return arr.find(x => x && (x['@type'] === 'MusicEvent' || x['@type'] === 'Event')) || null;
    };
    for (const s of nodes) {
      try {
        const obj = JSON.parse(s.textContent || '{}');
        const ev = pick(obj);
        if (ev) return ev;
      } catch {}
    }
    return null;
  });
}

function normalizeFromJsonLd(obj, raUrl) {
  const unwrap = (x) => (Array.isArray(x) ? x[0] : x);
  const start = obj.startDate ? dayjs(obj.startDate) : null;
  const end = obj.endDate ? dayjs(obj.endDate) : null;
  const venue = obj.location?.name || obj.location?.address?.name || null;
  const image = unwrap(obj.image)?.url || unwrap(obj.image) || null;
  const performers = obj.performer || [];
  const artists = (Array.isArray(performers) ? performers : [performers])
    .map(p => (typeof p === 'string' ? p : p?.name))
    .filter(Boolean);

  return {
    id: extractEventId(raUrl),
    title: obj.name || null,
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

async function fallbackFromDom(page, raUrl) {
  const html = await page.content();
  const $ = load(html);
  const title = $('h1, h2').first().text().trim() || null;
  const image = $('img').first().attr('src') || null;
  const venue = $('[data-test="venue"], a[href*="/clubs/"]').first().text().trim() || null;

  let date = null;
  const timeEl = $('time').first();
  const dtRaw = timeEl.attr('datetime') || timeEl.text();
  const d = dtRaw ? dayjs(dtRaw) : null;
  if (d && d.isValid()) date = d.format('YYYY-MM-DD');

  const artists = [];
  $('[data-test="artist"], [class*="artist"], a[href*="/dj/"]').each((_, el) => {
    const name = $(el).text().trim();
    if (name) artists.push(name);
  });

  return {
    id: extractEventId(raUrl),
    title, date,
    startTime: null, endTime: null,
    venue, city: 'Tbilisi', country: 'GE',
    price: null,
    artists,
    image,
    raUrl,
    description: null,
    tags: []
  };
}

async function scrapeEvent(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await ensureCookieAccepted(page);
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  const j = await getJsonLdFromPage(page);
  if (!j) {
    await debugDump(page, `event-${extractEventId(url)}`);
  }
  return j ? normalizeFromJsonLd(j, url) : await fallbackFromDom(page, url);
}

// --- main -------------------------------------------------------------------

(async () => {
  const browser = await chromium.launch({
    headless: HEADLESS,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    // a very "normal" browser profile
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    locale: 'en-GB',
    timezoneId: 'Asia/Tbilisi',
    geolocation: { longitude: 44.8, latitude: 41.7 }, permissions: ['geolocation'],
  });

  // hide webdriver
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const page = await context.newPage();

  // 1) collect links
  const allLinks = new Set();
  for (let p = FROM; p <= TO; p++) {
    const links = await getEventLinks(page, p);
    links.forEach(l => allLinks.add(l));
  }

  const linkList = [...allLinks].slice(0, MAX);
  if (!linkList.length) {
    console.error('[error] No event links found. See listing-page*.html/png for clues.');
  } else {
    console.log(`[info] Found ${linkList.length} event links`);
  }

  // 2) visit each event
  const limit = pLimit(CONCURRENCY);
  const events = (await Promise.all(
    linkList.map(link => limit(async () => {
      try { return await scrapeEvent(page, link); }
      catch (e) { console.error('Failed:', link, e.message); return null; }
    }))
  )).filter(Boolean);

  await browser.close();

  const output = { source: 'ra', city: 'Tbilisi', country: 'GE', scrapedAt: dayjs().toISOString(), events };
  fs.writeFileSync(OUT, JSON.stringify(output, null, 2));
  console.log(`Saved ${events.length} events to ${OUT}`);
})();

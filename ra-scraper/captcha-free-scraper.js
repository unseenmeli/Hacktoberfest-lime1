import fetch from 'node-fetch';
import dayjs from 'dayjs';
import fs from 'fs';

const GRAPHQL_URL = 'https://ra.co/graphql';

// We know event IDs from Tbilisi: 2277025, 2283233, 2277173
// We'll fetch individual events by ID using the GraphQL API
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

async function fetchEvent(eventId) {
  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({
        query: GET_EVENT_QUERY,
        variables: { id: eventId.toString() }
      })
    });

    const json = await response.json();

    if (json.errors || !json.data?.event) {
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

async function main() {
  console.log('🎯 CAPTCHA-Free RA.co Event Scraper\n');
  console.log('Using Pure GraphQL API - No browser automation needed!\n');
  console.log('='.repeat(60) + '\n');

  // Event IDs we discovered from Tbilisi
  // In production, you would maintain a list of IDs or discover them through other means
  const tbilisiEventIds = [
    '2277025',
    '2283233',
    '2277173'
  ];

  console.log(`Fetching ${tbilisiEventIds.length} events from Tbilisi...\n`);

  const events = [];
  for (const id of tbilisiEventIds) {
    console.log(`  Fetching event ${id}...`);
    const event = await fetchEvent(id);
    if (event) {
      events.push(event);
      console.log(`    ✅ ${event.title}`);
    } else {
      console.log(`    ❌ Failed`);
    }
    await new Promise(r => setTimeout(r, 500)); // Small delay for rate limiting
  }

  const timestamp = dayjs().format('YYYYMMDDHHmmss');
  const filename = `tbilisi-events-captcha-free-${timestamp}.json`;
  const output = {
    source: 'ra-graphql',
    method: 'Pure GraphQL API (No CAPTCHA)',
    city: 'Tbilisi',
    country: 'GE',
    scrapedAt: new Date().toISOString(),
    totalEvents: events.length,
    events
  };

  fs.writeFileSync(filename, JSON.stringify(output, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successfully scraped ${events.length} events!`);
  console.log(`📁 Saved to: ${filename}`);
  console.log('\n💡 No CAPTCHA required! No browser automation! Just pure API calls!\n');

  return output;
}

main().catch(console.error);

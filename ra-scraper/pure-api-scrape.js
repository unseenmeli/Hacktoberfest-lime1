import fetch from 'node-fetch';
import dayjs from 'dayjs';
import fs from 'fs';

const GRAPHQL_URL = 'https://ra.co/graphql';

// Try the "events" query
const EVENTS_QUERY = `
  query GetEvents($areaId: Int, $limit: Int) {
    events(areaId: $areaId, limit: $limit) {
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

// Try the "eventListings" query
const EVENT_LISTINGS_QUERY = `
  query GetEventListings($filters: EventListingFiltersInput, $page: Int, $pageSize: Int) {
    eventListings(filters: $filters, page: $page, pageSize: $pageSize) {
      data {
        ... on Event {
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
      totalResults
    }
  }
`;

async function tryEventsQuery() {
  console.log('Trying "events" query...\n');

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({
        query: EVENTS_QUERY,
        variables: {
          areaId: 18, // Try Tbilisi area ID (might need to find correct ID)
          limit: 100
        }
      })
    });

    const json = await response.json();

    if (json.errors) {
      console.error('❌ Errors:', json.errors[0]?.message);
      return null;
    }

    if (json.data && json.data.events) {
      console.log(`✅ Success! Found ${json.data.events.length} events`);
      return json.data.events;
    }

  } catch (error) {
    console.error('❌ Failed:', error.message);
  }

  return null;
}

async function tryEventListingsQuery() {
  console.log('\nTrying "eventListings" query...\n');

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({
        query: EVENT_LISTINGS_QUERY,
        variables: {
          filters: {
            areas: { eq: "tbilisi" },
            countries: { eq: "ge" }
          },
          page: 1,
          pageSize: 100
        }
      })
    });

    const json = await response.json();

    if (json.errors) {
      console.error('❌ Errors:', json.errors[0]?.message);
      return null;
    }

    if (json.data && json.data.eventListings) {
      console.log(`✅ Success! Found ${json.data.eventListings.data.length} events`);
      console.log(`Total results: ${json.data.eventListings.totalResults}`);
      return json.data.eventListings.data;
    }

  } catch (error) {
    console.error('❌ Failed:', error.message);
  }

  return null;
}

async function main() {
  console.log('🔍 Testing Pure GraphQL API Approaches (No CAPTCHA!)\n');
  console.log('='.repeat(60) + '\n');

  // Try both queries
  let events = await tryEventsQuery();

  if (!events) {
    events = await tryEventListingsQuery();
  }

  if (events && events.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('✅ SUCCESS! We can scrape without CAPTCHA!\n');

    const formatted = events.map(event => ({
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
    }));

    const timestamp = dayjs().format('YYYYMMDDHHmmss');
    const filename = `tbilisi-events-pure-api-${timestamp}.json`;
    const output = {
      source: 'ra-pure-graphql',
      method: 'Pure GraphQL API - NO CAPTCHA!',
      city: 'Tbilisi',
      country: 'GE',
      scrapedAt: new Date().toISOString(),
      totalEvents: formatted.length,
      events: formatted
    };

    fs.writeFileSync(filename, JSON.stringify(output, null, 2));
    console.log(`📁 Saved ${formatted.length} events to ${filename}`);

    // Show sample
    console.log('\n📋 Sample event:');
    console.log(JSON.stringify(formatted[0], null, 2));
  } else {
    console.log('\n❌ Neither query worked. May need to find correct parameters.');
  }
}

main().catch(console.error);

import fetch from 'node-fetch';
import dayjs from 'dayjs';
import fs from 'fs';

const GRAPHQL_URL = 'https://ra.co/graphql';

// GraphQL query to get events for a location
const EVENTS_QUERY = `
  query GET_EVENTS($filters: [FilterInput], $pageSize: Int, $page: Int) {
    listing(filters: $filters, pageSize: $pageSize, page: $page) {
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

async function fetchEventsGraphQL(area = 'tbilisi', country = 'ge', page = 1, pageSize = 100) {
  const variables = {
    filters: [
      {
        type: "AREA",
        value: area
      },
      {
        type: "COUNTRY",
        value: country
      }
    ],
    page,
    pageSize
  };

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Origin': 'https://ra.co',
    'Referer': `https://ra.co/events/${country}/${area}`
  };

  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: EVENTS_QUERY,
      variables
    })
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  if (json.errors) {
    console.error('GraphQL errors:', json.errors);
    throw new Error('GraphQL query returned errors');
  }

  return json.data;
}

async function main() {
  console.log('Fetching events from RA.co GraphQL API...');

  try {
    const data = await fetchEventsGraphQL('tbilisi', 'ge', 1, 100);

    if (!data || !data.listing) {
      console.error('No data returned from API');
      return;
    }

    const events = data.listing.data.map(event => ({
      id: `ra-${event.id}`,
      title: event.title || null,
      date: event.date || null,
      startTime: event.startTime || null,
      endTime: event.endTime || null,
      venue: event.venue?.name || null,
      city: 'Tbilisi',
      country: 'GE',
      artists: event.artists?.map(a => a.name) || [],
      image: event.images?.[0]?.filename ? `https://images.ra.co/${event.images[0].filename}` : null,
      raUrl: `https://ra.co/events/${event.id}`,
      description: event.content || null
    }));

    const timestamp = dayjs().format('YYYYMMDDHHmmss');
    const filename = `tbilisi-events-graphql-${timestamp}.json`;
    const output = {
      source: 'ra-graphql',
      city: 'Tbilisi',
      country: 'GE',
      scrapedAt: new Date().toISOString(),
      totalResults: data.listing.totalResults,
      events
    };

    fs.writeFileSync(filename, JSON.stringify(output, null, 2));
    console.log(`✅ Successfully saved ${events.length} events to ${filename}`);
    console.log(`Total events available: ${data.listing.totalResults}`);

  } catch (error) {
    console.error('Error fetching events:', error.message);
    console.log('\nThis GraphQL query may need adjustment. Let me try a simpler approach...');
  }
}

main().catch(console.error);

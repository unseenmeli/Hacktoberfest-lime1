import fetch from 'node-fetch';
import dayjs from 'dayjs';
import fs from 'fs';

const GRAPHQL_URL = 'https://ra.co/graphql';

// Simpler query to test the API
const TEST_QUERY = `
  query {
    __schema {
      queryType {
        fields {
          name
        }
      }
    }
  }
`;

// Try a more specific query for events by ID
const GET_EVENT_BY_ID = `
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

async function testGraphQL() {
  console.log('Testing RA.co GraphQL API...\n');

  // Test basic schema introspection
  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({ query: TEST_QUERY })
    });

    const json = await response.json();

    if (json.data) {
      console.log('✅ GraphQL API is accessible!');
      console.log('Available queries:', json.data.__schema.queryType.fields.slice(0, 10).map(f => f.name).join(', '));
    }
  } catch (error) {
    console.error('Schema test failed:', error.message);
  }

  // Test getting a specific event (using one of the IDs we found earlier)
  console.log('\n---\nTrying to fetch event ID 2277173...\n');

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({
        query: GET_EVENT_BY_ID,
        variables: { id: "2277173" }
      })
    });

    const json = await response.json();

    if (json.errors) {
      console.error('Errors:', json.errors);
    }

    if (json.data && json.data.event) {
      console.log('✅ Successfully fetched event!');
      console.log(JSON.stringify(json.data.event, null, 2));

      const filename = 'test-event.json';
      fs.writeFileSync(filename, JSON.stringify(json.data.event, null, 2));
      console.log(`\n✅ Saved event data to ${filename}`);
    }
  } catch (error) {
    console.error('Event fetch failed:', error.message);
  }
}

testGraphQL().catch(console.error);

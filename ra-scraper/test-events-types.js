import fetch from 'node-fetch';
import dayjs from 'dayjs';
import fs from 'fs';

const GRAPHQL_URL = 'https://ra.co/graphql';

const EVENTS_QUERY = `
  query GetEvents($type: EventQueryType!, $areaId: ID, $limit: Int) {
    events(type: $type, areaId: $areaId, limit: $limit) {
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

async function testEventType(typeName, areaId = null) {
  console.log(`\n🔍 Testing type: "${typeName}"${areaId ? ` with areaId: ${areaId}` : ''}...`);

  try {
    const variables = {
      type: typeName,
      limit: 50
    };

    if (areaId) {
      variables.areaId = areaId;
    }

    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({
        query: EVENTS_QUERY,
        variables
      })
    });

    const json = await response.json();

    if (json.errors) {
      console.log(`   ❌ Error: ${json.errors[0]?.message}`);
      return null;
    }

    if (json.data && json.data.events) {
      console.log(`   ✅ Success! Found ${json.data.events.length} events`);
      return json.data.events;
    }

  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
  }

  return null;
}

async function main() {
  console.log('Testing different EventQueryType values...\n');
  console.log('='.repeat(60));

  // Try actual enum values from the API
  const typesToTry = [
    'LATEST',
    'TODAY',
    'FROMDATE',
    'PICKS',
    'POPULAR',
    'FIRST'
  ];

  let successfulEvents = null;

  for (const type of typesToTry) {
    // Try without areaId first
    const events = await testEventType(type);

    if (events && events.length > 0) {
      successfulEvents = events;
      console.log(`\n   🎉 "${type}" works!`);
      break;
    }
  }

  // If nothing works, try with Tbilisi area ID
  if (!successfulEvents) {
    console.log('\n\nTrying with area ID for Tbilisi...\n');

    for (const type of typesToTry) {
      const events = await testEventType(type, '18'); // Common area ID for Tbilisi

      if (events && events.length > 0) {
        successfulEvents = events;
        console.log(`\n   🎉 "${type}" with areaId works!`);
        break;
      }
    }
  }

  if (successfulEvents) {
    console.log('\n' + '='.repeat(60));
    console.log('✅ SUCCESS! Found a working query!\n');

    const formatted = successfulEvents.slice(0, 5).map(event => ({
      id: event.id,
      title: event.title,
      date: event.date,
      venue: event.venue?.name
    }));

    console.log('Sample events:');
    console.log(JSON.stringify(formatted, null, 2));

    // Save all events
    const timestamp = dayjs().format('YYYYMMDDHHmmss');
    const filename = `events-success-${timestamp}.json`;
    fs.writeFileSync(filename, JSON.stringify(successfulEvents, null, 2));
    console.log(`\n📁 Saved ${successfulEvents.length} events to ${filename}`);
  } else {
    console.log('\n❌ No query worked. The API might require authentication or different parameters.');
  }
}

main().catch(console.error);

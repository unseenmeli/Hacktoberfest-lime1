import fetch from 'node-fetch';

const GRAPHQL_URL = 'https://ra.co/graphql';

const GET_ENUM_VALUES = `
  query {
    __type(name: "EventQueryType") {
      name
      enumValues {
        name
        description
      }
    }
  }
`;

async function getEnumValues() {
  console.log('Fetching EventQueryType enum values...\n');

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({ query: GET_ENUM_VALUES })
    });

    const json = await response.json();

    if (json.errors) {
      console.error('Error:', json.errors);
      return;
    }

    if (json.data && json.data.__type) {
      console.log('✅ EventQueryType enum values:\n');
      json.data.__type.enumValues.forEach(val => {
        console.log(`   - ${val.name}${val.description ? ` (${val.description})` : ''}`);
      });

      return json.data.__type.enumValues;
    }

  } catch (error) {
    console.error('Failed:', error.message);
  }
}

getEnumValues().catch(console.error);

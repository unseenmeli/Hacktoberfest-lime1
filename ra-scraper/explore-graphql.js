import fetch from 'node-fetch';
import fs from 'fs';

const GRAPHQL_URL = 'https://ra.co/graphql';

// Introspection query to explore the schema
const INTROSPECTION = `
  query IntrospectSchema {
    __schema {
      queryType {
        fields {
          name
          description
          args {
            name
            type {
              name
              kind
              ofType {
                name
                kind
              }
            }
          }
        }
      }
    }
  }
`;

async function exploreAPI() {
  console.log('Exploring RA.co GraphQL API schema...\n');

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({ query: INTROSPECTION })
    });

    const json = await response.json();

    if (json.data) {
      const queries = json.data.__schema.queryType.fields;

      console.log('Available GraphQL Queries:\n');

      // Look for event-related queries
      const eventQueries = queries.filter(q =>
        q.name.toLowerCase().includes('event') ||
        q.name.toLowerCase().includes('list') ||
        q.name.toLowerCase().includes('search')
      );

      eventQueries.forEach(query => {
        console.log(`📋 ${query.name}`);
        if (query.description) console.log(`   Description: ${query.description}`);
        if (query.args && query.args.length > 0) {
          console.log(`   Arguments: ${query.args.map(a => a.name).join(', ')}`);
        }
        console.log('');
      });

      // Save full schema to file
      fs.writeFileSync('graphql-schema.json', JSON.stringify(json.data, null, 2));
      console.log('✅ Full schema saved to graphql-schema.json');

      // Specifically look for "listing" query
      const listingQuery = queries.find(q => q.name === 'listing');
      if (listingQuery) {
        console.log('\n🔍 Found "listing" query! Details:');
        console.log(JSON.stringify(listingQuery, null, 2));
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

exploreAPI().catch(console.error);

import fetch from 'node-fetch';
import dayjs from 'dayjs';
import fs from 'fs';

// Bandsintown API - they have a public events search endpoint
// Note: This API may require registration, but let's try common endpoints

const APP_ID = 'claude-scraper'; // Required for Bandsintown API

async function searchEventsByLocation(location = 'Tbilisi, Georgia') {
  console.log(`🎯 Fetching events for ${location}...\n`);

  try {
    // Try multiple endpoint approaches
    const endpoints = [
      // Known Bandsintown API endpoints
      `https://rest.bandsintown.com/events/search?location=${encodeURIComponent(location)}&app_id=${APP_ID}`,
      `https://rest.bandsintown.com/events/recommended?location=${encodeURIComponent(location)}&app_id=${APP_ID}`,
      `https://api.bandsintown.com/v4/events?location=${encodeURIComponent(location)}&app_id=${APP_ID}`,
    ];

    let events = [];

    for (const url of endpoints) {
      console.log(`Trying: ${url}\n`);

      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          }
        });

        console.log(`Status: ${response.status}`);

        if (response.ok) {
          const data = await response.json();
          console.log(`Response type: ${Array.isArray(data) ? 'Array' : 'Object'}`);

          if (Array.isArray(data) && data.length > 0) {
            events = data;
            console.log(`✅ Found ${events.length} events!\n`);
            break;
          } else if (data.events) {
            events = data.events;
            console.log(`✅ Found ${events.length} events!\n`);
            break;
          } else {
            console.log('No events in response\n');
          }
        } else {
          const text = await response.text();
          console.log(`Error response: ${text.substring(0, 200)}\n`);
        }
      } catch (err) {
        console.log(`Error: ${err.message}\n`);
      }
    }

    if (events.length === 0) {
      console.log('❌ No events found from API endpoints');
      console.log('\nNote: Bandsintown API might require registration or have changed endpoints.');
      console.log('Visit: https://www.bandsintown.com/api/overview');
      return null;
    }

    // Transform to clean format
    const transformedEvents = events.map(event => {
      return {
        id: `bandsintown-${event.id}`,
        title: event.title || event.description || 'Untitled Event',
        artist: event.lineup?.join(', ') || event.artist?.name || null,
        date: event.datetime || event.starts_at || null,
        venue: event.venue?.name || event.location?.name || null,
        venueLat: event.venue?.latitude || event.location?.latitude || null,
        venueLon: event.venue?.longitude || event.location?.longitude || null,
        city: event.venue?.city || event.location?.city || null,
        country: event.venue?.country || event.location?.country || null,
        description: event.description || null,
        url: event.url || event.facebook_rsvp_url || null,
        ticketUrl: event.offers?.[0]?.url || event.ticket_url || null,
        image: event.image_url || event.thumb_url || null,
        source: 'bandsintown.com'
      };
    });

    // Save to file
    const timestamp = dayjs().format('YYYYMMDDHHmmss');
    const filename = `bandsintown-events-${timestamp}.json`;
    const output = {
      source: 'bandsintown.com',
      location,
      scrapedAt: new Date().toISOString(),
      totalEvents: transformedEvents.length,
      events: transformedEvents
    };

    fs.writeFileSync(filename, JSON.stringify(output, null, 2));

    console.log(`✅ Successfully scraped ${transformedEvents.length} events!`);
    console.log(`📁 Saved to: ${filename}\n`);

    // Show sample
    console.log('Sample events:');
    transformedEvents.slice(0, 5).forEach((e, i) => {
      console.log(`${i + 1}. ${e.title || e.artist}`);
      console.log(`   Date: ${e.date || 'TBA'}`);
      console.log(`   Venue: ${e.venue || 'TBA'}`);
      console.log(`   City: ${e.city || 'TBA'}\n`);
    });

    return output;

  } catch (error) {
    console.error('Error fetching Bandsintown events:', error.message);
    throw error;
  }
}

// Try searching for Tbilisi events
searchEventsByLocation('Tbilisi, Georgia').catch(console.error);

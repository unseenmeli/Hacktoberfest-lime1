import fetch from 'node-fetch';
import dayjs from 'dayjs';
import fs from 'fs';

const API_KEY = '7d8d34d1-e9af-4897-9f0f-5c36c179be77';
const BASE_URL = 'https://gateway.tkt.ge';

async function fetchTktConcerts() {
  console.log('🎯 Fetching concerts from tkt.ge API...\n');

  try {
    // Fetch concerts (categoryId=2)
    const url = `${BASE_URL}/Shows/List?categoryId=2&api_key=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const shows = data.shows || [];

    console.log(`Found ${shows.length} concerts\n`);

    // Transform to clean format
    const events = shows.map(show => {
      const venue = show.venues?.[0];
      const eventInfo = venue?.eventInfos?.[0];

      return {
        id: `tkt-${show.showId}`,
        title: show.name,
        date: show.fromDate || eventInfo?.eventDate || null,
        venue: venue?.name || null,
        description: show.description?.replace(/<[^>]*>/g, '').trim() || null,
        priceMin: show.minPrice || null,
        priceMax: show.maxPrice || null,
        isSoldOut: show.isSoldOut || false,
        image: show.desktopImage ? `https://static.tkt.ge/${show.desktopImage}` : null,
        url: `https://tkt.ge/event/${show.showId}`,
        source: 'tkt.ge'
      };
    });

    // Save to file
    const timestamp = dayjs().format('YYYYMMDDHHmmss');
    const filename = `tkt-ge-concerts-${timestamp}.json`;
    const output = {
      source: 'tkt.ge',
      category: 'concerts',
      scrapedAt: new Date().toISOString(),
      totalEvents: events.length,
      events
    };

    fs.writeFileSync(filename, JSON.stringify(output, null, 2));

    console.log(`✅ Successfully scraped ${events.length} events!`);
    console.log(`📁 Saved to: ${filename}\n`);

    // Show sample
    console.log('Sample events:');
    events.slice(0, 5).forEach((e, i) => {
      console.log(`${i + 1}. ${e.title}`);
      console.log(`   Date: ${e.date || 'TBA'}`);
      console.log(`   Venue: ${e.venue || 'TBA'}`);
      console.log(`   Price: ${e.priceMin}₾ - ${e.priceMax}₾\n`);
    });

    return output;

  } catch (error) {
    console.error('Error fetching tkt.ge concerts:', error.message);
    throw error;
  }
}

fetchTktConcerts().catch(console.error);

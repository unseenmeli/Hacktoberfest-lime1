const { init, id } = require("@instantdb/admin");
const fs = require("fs");
const path = require("path");

// Initialize InstantDB admin
const APP_ID = "ad946104-20ed-4c58-8173-2596cb9a72ad";

// You'll need to get your admin token from the InstantDB dashboard
// Go to your app settings to get this token
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error("Error: INSTANT_ADMIN_TOKEN environment variable not set");
  console.error("Get your admin token from: https://instantdb.com/dash");
  process.exit(1);
}

const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });

async function uploadEvents() {
  try {
    // Read the JSON file
    const jsonPath = path.join(
      __dirname,
      "..",
      "ra-scraper",
      "tbilisi-all-events-20251018222947.json"
    );
    console.log("Reading events from:", jsonPath);

    const rawData = fs.readFileSync(jsonPath, "utf8");
    const data = JSON.parse(rawData);

    console.log(`Found ${data.events.length} events to upload`);
    console.log(`Scraped at: ${data.scrapedAt}`);
    console.log(`Location: ${data.location}`);

    // Upload events in batches to avoid overwhelming the API
    const BATCH_SIZE = 50;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < data.events.length; i += BATCH_SIZE) {
      const batch = data.events.slice(i, i + BATCH_SIZE);
      console.log(`\nUploading batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(data.events.length / BATCH_SIZE)}...`);

      for (const event of batch) {
        try {
          // Transform the event data to match our schema
          const eventData = {
            eventId: event.id,
            title: event.title,
            date: event.date,
            startTime: event.startTime || null,
            endTime: event.endTime || null,
            venue: event.venue,
            city: event.city,
            country: event.country,
            artists: event.artists || [],
            image: event.image,
            raUrl: event.raUrl || null,
            ticketUrl: event.ticketUrl || null,
            description: event.description || null,
          };

          // Use transact to add the event
          await db.transact([
            db.tx.events[id()].create(eventData),
          ]);

          successCount++;
          process.stdout.write(".");
        } catch (error) {
          errorCount++;
          console.error(`\nError uploading event ${event.id}:`, JSON.stringify(error, null, 2));
        }
      }
    }

    console.log(`\n\nUpload complete!`);
    console.log(`Successfully uploaded: ${successCount} events`);
    console.log(`Errors: ${errorCount} events`);

  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

// Run the upload
uploadEvents();

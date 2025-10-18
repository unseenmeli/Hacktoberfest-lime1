import fs from 'fs';
import dayjs from 'dayjs';

console.log('🔗 Combining all events into one file...\n');

// Read RA.co events
const raFile = fs.readdirSync('.').find(f => f.startsWith('tbilisi-events-final-') && f.endsWith('.json'));
const raData = raFile ? JSON.parse(fs.readFileSync(raFile, 'utf-8')) : { events: [] };
const raEvents = raData.events || [];

// Read TKT.ge + RA combined file
const allFile = fs.readdirSync('.').find(f => f.startsWith('tbilisi-all-events-') && f.endsWith('.json'));
const allData = allFile ? JSON.parse(fs.readFileSync(allFile, 'utf-8')) : { events: [] };
const tktEvents = allData.events.filter(e => e.source === 'tkt.ge');

console.log(`Found ${raEvents.length} RA.co events`);
console.log(`Found ${tktEvents.length} TKT.ge events\n`);

// Combine all events
const allEvents = [...raEvents, ...tktEvents];

const timestamp = dayjs().format('YYYYMMDDHHmmss');
const filename = `tbilisi-all-events-${timestamp}.json`;

const output = {
  location: 'Tbilisi, Georgia',
  scrapedAt: new Date().toISOString(),
  totalEvents: allEvents.length,
  sources: {
    'ra.co': raEvents.length,
    'tkt.ge': tktEvents.length
  },
  events: allEvents
};

fs.writeFileSync(filename, JSON.stringify(output, null, 2));

console.log('====================================');
console.log('     ALL EVENTS COMBINED            ');
console.log('====================================\n');
console.log(`✅ Total events: ${allEvents.length}`);
console.log(`   - RA.co: ${raEvents.length} events`);
console.log(`   - TKT.ge: ${tktEvents.length} events`);
console.log(`\n📁 Saved to: ${filename}\n`);

// Clean up - delete the separate files
if (raFile) fs.unlinkSync(raFile);
if (allFile && allFile !== filename) fs.unlinkSync(allFile);

console.log('✨ Old files cleaned up\n');

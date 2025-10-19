import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Swipe API is running' });
});

// AI Analysis endpoint for events
app.post('/api/analyze-event', async (req, res) => {
  console.log('📥 Received request from:', req.ip);
  console.log('📋 Request body:', JSON.stringify(req.body, null, 2));

  try {
    const { eventName, date, location, venue, lineup, description } = req.body;

    if (!eventName) {
      return res.status(400).json({ error: 'Event name is required' });
    }

    // Generate Google Maps link
    const mapsQuery = encodeURIComponent(`${venue}, ${location}`);
    const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

    const prompt = `You are an expert event curator helping young music lovers discover and enjoy events. Your tone should be friendly, knowledgeable, and genuine - like giving advice to a friend.

Event Details:
- Name: ${eventName}
- Date: ${date}
- Location: ${location}
- Venue: ${venue}
- Lineup: ${lineup?.join(', ') || 'N/A'}
- Description: ${description}

YOUR TASK - Follow these instructions EXACTLY:

1. 📍 LOCATION DETAILS
   - Start with: "${venue}, ${location}"
   - Add this exact Google Maps link on the next line: ${googleMapsLink}
   - If you know the specific street address for ${venue} in ${location}, include it
   - Keep it brief - 2-3 lines max

2. 🎯 EVENT OVERVIEW
   - Identify the music genre from the lineup (techno, house, rock, indie, hip-hop, electronic, etc.)
   - Describe what makes ${venue} special or famous if you know
   - What's the vibe? (Underground? High-energy? Intimate? Massive?)
   - Why should someone go to this event specifically?
   - 3-4 sentences max

3. 💡 TIPS FOR ATTENDEES
   - Give 4-6 specific tips based on the genre:
     * Techno/House/Electronic: Dress code (black is safe), arrive after midnight for peak energy, stay hydrated, respect the dancefloor (no phones), bring earplugs
     * Rock/Punk/Metal: Get there early for good spots, earplugs essential, mosh pit etiquette, don't be afraid to get into it
     * Hip-Hop/Rap: Know the lyrics to hype along, filming short clips is okay but don't be glued to your phone, merch sells out fast
     * Indie/Alternative: Early arrival for intimate setting, great opener acts, relaxed vibe
   - Add 1-2 social tips: making friends, being open, enjoying your free time
   - Use bullet points

4. 🚗 HOW TO GET THERE
   - For ${location}, provide specific transport options:
     * Public transit: Name actual metro/bus lines if you know them for this area
     * Taxi/Uber/Bolt: Pickup/dropoff tips
     * Walking: If it's walkable from a landmark
     * Late-night: How to get home after (night buses, safe taxi stands)
   - Be practical and specific
   - 3-4 bullet points

CRITICAL:
- Be conversational but not try-hard
- Use "you" and "your" to speak directly to the reader
- Skip generic advice - be specific to THIS event and genre
- Don't use corporate language or excessive emojis beyond the section headers
- Keep total response under 400 words`;


    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1200,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const analysis = message.content[0].text;

    res.json({ analysis });
  } catch (error) {
    console.error('Error generating AI analysis:', error);
    res.status(500).json({
      error: 'Failed to generate analysis',
      message: error.message,
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Swipe API server running on:`);
  console.log(`   - Local: http://localhost:${port}`);
  console.log(`   - Network: http://172.20.10.3:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
});

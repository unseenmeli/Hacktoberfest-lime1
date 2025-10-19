# Swipe API Server

Backend API server for the Swipe app, providing AI-powered event analysis using Claude AI.

## 🚀 Deploy to Render (Recommended)

The easiest way to get this working is to deploy to Render:

1. **Push your code to GitHub:**
   ```bash
   git add server/
   git commit -m "Add Swipe API server"
   git push
   ```

2. **Create a Render account:**
   - Go to https://render.com and sign up (free)
   - Connect your GitHub account

3. **Create a new Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Configure:
     - **Name**: swipe-api (or whatever you want)
     - **Root Directory**: `server`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: Free

4. **Add environment variable:**
   - In the Render dashboard, go to Environment
   - Add: `ANTHROPIC_API_KEY` = your API key from https://console.anthropic.com/

5. **Deploy!**
   - Render will give you a URL like: `https://swipe-api-xyz.onrender.com`
   - Copy this URL

6. **Update your React Native app:**
   - Add to your root `.env` file:
     ```
     EXPO_PUBLIC_API_URL=https://your-render-url.onrender.com
     ```
   - Restart your app

Done! Your AI Analysis will now work from anywhere.

---

## 🖥️ Local Development (Optional)

If you want to run locally for development:

1. **Install dependencies:**
```bash
cd server
npm install
```

2. **Set up your Anthropic API key:**
Add to root `.env` file:
```
ANTHROPIC_API_KEY=your_actual_api_key_here
```

3. **Run the server:**
```bash
npm run dev
```

The server runs on **http://localhost:3001** by default.

## API Endpoints

### `GET /health`
Health check endpoint to verify the server is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Swipe API is running"
}
```

### `POST /api/analyze-event`
Generate AI analysis for an event with tips, location details, and directions.

**Request body:**
```json
{
  "eventName": "Bass Night",
  "date": "Jan 15, 2025 • 9:00 PM",
  "location": "Tbilisi, Georgia",
  "venue": "Bassiani",
  "lineup": ["DJ Set", "Live Performance"],
  "description": "An unforgettable night of electronic music"
}
```

**Response:**
```json
{
  "analysis": "📍 LOCATION DETAILS\n[Venue address and details]\n\n🎯 EVENT OVERVIEW\n[Analysis]\n\n💡 TIPS FOR ATTENDEES\n[Tips]\n\n🚗 HOW TO GET THERE\n[Directions]"
}
```

## Testing the API

### Using curl:
```bash
curl -X POST http://localhost:3001/api/analyze-event \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "Test Event",
    "date": "Jan 15, 2025",
    "location": "Tbilisi, Georgia",
    "venue": "Test Venue",
    "lineup": ["Artist 1"],
    "description": "Test description"
  }'
```

### Using the Swipe app:
The React Native app will automatically connect to `http://localhost:3001` in development.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Yes |
| `PORT` | Server port (default: 3001) | No |

## Customizing AI Prompts

You can customize the AI analysis by modifying the prompt in `server.js` at line ~30. The prompt determines:
- Tone and style of the analysis
- What information to include
- How to format the response
- Level of detail

Feel free to experiment with different prompts to get the best results for your events!

## Production Deployment

For production, deploy this server to your preferred hosting platform (Heroku, Railway, Fly.io, etc.) and update the `EXPO_PUBLIC_API_URL` in your `.env` file to point to your deployed server.

## Troubleshooting

**Port already in use:**
Change the port in your `.env` file or run with: `PORT=3002 npm start`

**API key errors:**
- Verify your API key is correct in `.env`
- Ensure you have credits in your Anthropic account
- Check that `.env` is in the root directory (not inside `/server`)

**CORS issues:**
The server accepts requests from any origin by default. For production, update the CORS configuration in `server.js`.

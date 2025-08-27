# Bluesky Tweet Generator Bot

A web application that generates tweet variations from webpages and posts them to Bluesky. Users can input a webpage URL, describe how they want it turned into a tweet, specify the tone, and get three tweet options in different styles.

## Features

- **Webpage to Tweet Generation**: Convert any webpage content into engaging tweets
- **Multiple Style Options**: Get 3 tweet variations (concise, detailed, casual)
- **Tone Selection**: Choose from professional, casual, humorous, informative, inspirational, or provocative tones
- **Feedback System**: Rate tweets with thumbs up/down and provide written feedback
- **Direct Posting**: Post selected tweets directly to your Bluesky account
- **Character Count**: See tweet length to ensure it fits within limits

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd client && npm install
   cd ..
   ```

3. Create a `.env` file in the root directory:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   BLUESKY_HANDLE=your.handle@bsky.social
   BLUESKY_APP_PASSWORD=your_app_password_here
   PORT=5000
   ```

4. Run the application:
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend React app (port 3000).

## Usage

1. Enter a webpage URL you want to convert to a tweet
2. Describe how you want the webpage content turned into a tweet
3. Select the desired tone
4. Click "Generate Tweets" to get 3 variations
5. Review the generated tweets:
   - Use thumbs up/down to rate them
   - Add written feedback if needed
   - Click "Post to Bluesky" to publish the selected tweet

## Tech Stack

- **Frontend**: React, CSS
- **Backend**: Node.js, Express
- **APIs**: OpenAI GPT-4, Bluesky AT Protocol
- **Web Scraping**: Cheerio, Axios

## API Endpoints

- `POST /api/generate-tweets`: Generate tweet variations from a webpage
- `POST /api/post-tweet`: Post a tweet to Bluesky
- `POST /api/feedback`: Submit feedback for generated tweets

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key for GPT-4
- `BLUESKY_HANDLE`: Your Bluesky handle (e.g., yourname.bsky.social)
- `BLUESKY_APP_PASSWORD`: Your Bluesky app password (generate from Settings > App Passwords)
- `PORT`: Server port (default: 5000)

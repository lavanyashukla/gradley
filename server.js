require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const OpenAI = require('openai');
const { BskyAgent } = require('@atproto/api');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const bskyAgent = new BskyAgent({
  service: 'https://bsky.social',
});

let bskyAuthenticated = false;

async function authenticateBluesky() {
  if (!process.env.BLUESKY_HANDLE || !process.env.BLUESKY_APP_PASSWORD) {
    console.log('Bluesky credentials not configured');
    return false;
  }
  
  try {
    await bskyAgent.login({
      identifier: process.env.BLUESKY_HANDLE,
      password: process.env.BLUESKY_APP_PASSWORD,
    });
    bskyAuthenticated = true;
    console.log('Successfully authenticated with Bluesky');
    return true;
  } catch (error) {
    console.error('Failed to authenticate with Bluesky:', error.message);
    return false;
  }
}

authenticateBluesky();

async function fetchWebpageContent(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const $ = cheerio.load(response.data);
    
    $('script').remove();
    $('style').remove();
    
    const title = $('title').text() || '';
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    
    const headings = [];
    $('h1, h2, h3').each((i, elem) => {
      if (i < 10) {
        headings.push($(elem).text().trim());
      }
    });
    
    const paragraphs = [];
    $('p').each((i, elem) => {
      if (i < 20) {
        const text = $(elem).text().trim();
        if (text.length > 50) {
          paragraphs.push(text);
        }
      }
    });
    
    return {
      title,
      metaDescription,
      headings: headings.join('\n'),
      content: paragraphs.join('\n\n').substring(0, 3000)
    };
  } catch (error) {
    throw new Error(`Failed to fetch webpage: ${error.message}`);
  }
}

async function generateTweets(webpageContent, description, tone) {
  const styles = ['concise', 'detailed', 'casual'];
  const prompt = `
    Based on the following webpage content, ${description}
    
    Webpage Title: ${webpageContent.title}
    Description: ${webpageContent.metaDescription}
    Key Headings: ${webpageContent.headings}
    Content: ${webpageContent.content}
    
    Generate 3 different tweet options with these requirements:
    - Each tweet must be under 280 characters
    - Overall tone should be: ${tone}
    - Make them engaging and shareable
    - Include relevant hashtags if appropriate
    
    Create 3 variations:
    1. ${styles[0]} style - Brief and to the point
    2. ${styles[1]} style - More informative with key details
    3. ${styles[2]} style - Conversational and approachable
    
    Format the response as JSON array with objects containing 'style' and 'text' fields.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a social media expert who creates engaging tweets. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate tweets');
  }
}

app.post('/api/generate-tweets', async (req, res) => {
  try {
    const { url, description, tone } = req.body;
    
    if (!url || !description || !tone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const webpageContent = await fetchWebpageContent(url);
    const tweets = await generateTweets(webpageContent, description, tone);
    
    res.json({ 
      tweets,
      webpageInfo: {
        title: webpageContent.title,
        description: webpageContent.metaDescription
      }
    });
  } catch (error) {
    console.error('Error generating tweets:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/post-tweet', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Tweet text is required' });
    }
    
    if (!bskyAuthenticated) {
      const authenticated = await authenticateBluesky();
      if (!authenticated) {
        return res.status(401).json({ error: 'Bluesky authentication failed. Please check credentials.' });
      }
    }
    
    const result = await bskyAgent.post({
      text: text,
      createdAt: new Date().toISOString(),
    });
    
    res.json({ 
      success: true, 
      postUrl: `https://bsky.app/profile/${process.env.BLUESKY_HANDLE}/post/${result.uri.split('/').pop()}`
    });
  } catch (error) {
    console.error('Error posting to Bluesky:', error);
    res.status(500).json({ error: 'Failed to post tweet to Bluesky' });
  }
});

app.post('/api/feedback', async (req, res) => {
  try {
    const { tweetId, feedback, rating } = req.body;
    
    console.log('Feedback received:', { tweetId, feedback, rating });
    
    res.json({ success: true, message: 'Feedback recorded' });
  } catch (error) {
    console.error('Error recording feedback:', error);
    res.status(500).json({ error: 'Failed to record feedback' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
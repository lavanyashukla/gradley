import React, { useState } from 'react';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('professional');
  const [tweets, setTweets] = useState([]);
  const [feedback, setFeedback] = useState({});
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [webpageInfo, setWebpageInfo] = useState(null);

  const generateTweets = async () => {
    setLoading(true);
    setError('');
    setTweets([]);
    setFeedback({});
    setRatings({});
    setSuccess('');
    
    try {
      const response = await fetch('http://localhost:5000/api/generate-tweets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, description, tone }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate tweets');
      }
      
      setTweets(data.tweets);
      setWebpageInfo(data.webpageInfo);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const postTweet = async (tweet) => {
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('http://localhost:5000/api/post-tweet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: tweet.text }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to post tweet');
      }
      
      setSuccess(`Tweet posted successfully! View at: ${data.postUrl}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const submitFeedback = async (index, tweetText) => {
    try {
      await fetch('http://localhost:5000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tweetId: index,
          feedback: feedback[index] || '',
          rating: ratings[index] || null,
        }),
      });
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  const handleRating = (index, rating) => {
    setRatings(prev => ({ ...prev, [index]: rating }));
    submitFeedback(index, tweets[index].text);
  };

  const handleFeedbackSubmit = (index) => {
    submitFeedback(index, tweets[index].text);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Bluesky Tweet Generator</h1>
        <p>Generate engaging tweets from any webpage and post them to Bluesky</p>
      </header>

      <main className="App-main">
        <div className="input-section">
          <div className="form-group">
            <label htmlFor="url">Webpage URL:</label>
            <input
              id="url"
              type="url"
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">How to turn into tweet:</label>
            <textarea
              id="description"
              placeholder="Summarize the key points and create an engaging tweet..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="tone">Tone:</label>
            <select
              id="tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="humorous">Humorous</option>
              <option value="informative">Informative</option>
              <option value="inspirational">Inspirational</option>
              <option value="provocative">Provocative</option>
            </select>
          </div>

          <button 
            className="generate-btn"
            onClick={generateTweets}
            disabled={loading || !url || !description}
          >
            {loading ? 'Generating...' : 'Generate Tweets'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        {webpageInfo && (
          <div className="webpage-info">
            <h3>Webpage Info</h3>
            <p><strong>Title:</strong> {webpageInfo.title}</p>
            {webpageInfo.description && (
              <p><strong>Description:</strong> {webpageInfo.description}</p>
            )}
          </div>
        )}

        {tweets.length > 0 && (
          <div className="tweets-section">
            <h2>Generated Tweet Options</h2>
            <div className="tweets-grid">
              {tweets.map((tweet, index) => (
                <div key={index} className="tweet-card">
                  <div className="tweet-header">
                    <span className="tweet-style">{tweet.style}</span>
                    <span className="character-count">
                      {tweet.text.length}/280
                    </span>
                  </div>
                  
                  <div className="tweet-text">{tweet.text}</div>
                  
                  <div className="tweet-actions">
                    <div className="rating-buttons">
                      <button
                        className={`rating-btn ${ratings[index] === 'up' ? 'active' : ''}`}
                        onClick={() => handleRating(index, 'up')}
                        title="Good tweet"
                      >
                        👍
                      </button>
                      <button
                        className={`rating-btn ${ratings[index] === 'down' ? 'active' : ''}`}
                        onClick={() => handleRating(index, 'down')}
                        title="Needs improvement"
                      >
                        👎
                      </button>
                    </div>
                    
                    <button 
                      className="post-btn"
                      onClick={() => postTweet(tweet)}
                      title="Post to Bluesky"
                    >
                      Post to Bluesky
                    </button>
                  </div>
                  
                  <div className="feedback-section">
                    <textarea
                      placeholder="Add feedback for this tweet..."
                      value={feedback[index] || ''}
                      onChange={(e) => setFeedback(prev => ({ ...prev, [index]: e.target.value }))}
                      rows="2"
                    />
                    {feedback[index] && (
                      <button 
                        className="feedback-submit-btn"
                        onClick={() => handleFeedbackSubmit(index)}
                      >
                        Submit Feedback
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

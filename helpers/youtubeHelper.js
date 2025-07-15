const axios = require('axios');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Helper function to extract video ID from a URL
const getVideoId = (url) => {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

// Fetch video description from YouTube API
const fetchVideoDescription = async (url) => {
  const videoId = getVideoId(url);
  if (!videoId) return { url, error: 'Invalid YouTube URL' };

  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;

  try {
    const response = await axios.get(apiUrl);
    const video = response.data.items[0];

    if (!video) return { url, error: 'Video not found' };

    return {
      url,
      title: video.snippet.title,
      description: video.snippet.description,
    };
  } catch (error) {
    return { url, error: error.message };
  }
};

// Main function to handle multiple URLs
const getVideoDescriptions = async (urls) => {
  const results = await Promise.all(urls.map(fetchVideoDescription));
  return results;
};

module.exports = {
  getVideoDescriptions
};

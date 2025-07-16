require('dotenv').config();
const express = require('express');
const app = express();
const { getVideoDescriptions } = require('./helpers/youtubeHelper');
const { analyzeWithGemini } = require('./helpers/geminiHelper');

app.use(express.json());
const PORT = process.env.PORT || 7000;


// YTGuide Version 1️⃣
app.post('/api/v1/youtube-urls', async (req, res) => {
  const { url1, url2, url3, goal } = req.body;
  if (!url1 || !url2 || !url3 || !goal) {
    return res.status(400).json({
      message: "Please provide url1, url2, url3 and goal"
    });
  }

  const urls = [url1, url2, url3];

  try {
    const descriptions = await getVideoDescriptions(urls);
    const geminiResponse = await analyzeWithGemini(goal, descriptions);
   

    res.status(200).json({
      status: 'success',
      message: 'Analysis complete',
      goal,
      geminiRecommendation: geminiResponse
    });
  } catch (err) {
    res.status(500).json({
      message: 'Something went wrong',
      error: err.message
    });
  }
});



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

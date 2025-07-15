require('dotenv').config();
const express = require('express');
const app = express();
const { getVideoDescriptions } = require('./helpers/youtubeHelper');

app.use(express.json());
const PORT = process.env.PORT || 7000;



app.post('/api/youtube-urls', async (req, res) => {
  const { url1, url2, url3 } = req.body;
  const urls = [url1, url2, url3];

  try {
    const descriptions = await getVideoDescriptions(urls);
    res.status(200).json({
      message: 'Descriptions fetched successfully',
      data: descriptions
    });
  } catch (err) {
    res.status(500).json({
      message: 'Failed to fetch descriptions',
      error: err.message
    });
  }
});



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

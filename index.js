require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const slowDown = require('express-slow-down');
const { getVideoDescriptions } = require('./helpers/youtubeHelper');
const { analyzeWithGemini } = require('./helpers/geminiHelper');

app.use(cors());
app.use(express.json());
app.use(helmet());          
app.use(xss());              
app.use(hpp());             

const limiter = rateLimit({
  windowMs: 1000, 
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    status: 'fail',
    message: 'Too many requests from this IP, please try again later.'
  }
});

const speedLimiter = slowDown({
  windowMs: 60 * 1000, 
  delayAfter: 5,       
  delayMs: 700       
});


app.use(limiter);
app.use(speedLimiter);

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

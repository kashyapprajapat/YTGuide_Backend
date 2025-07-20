require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
const slowDown = require('express-slow-down');
const { getVideoDescriptions } = require('./helpers/youtubeHelper');
const { analyzeWithGemini } = require('./helpers/geminiHelper');
const { analyzeWithGroq } = require('./helpers/groqHelper');

app.use(cors());
app.use(express.json());
app.use(helmet());                       
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
  delayMs: () => 700,  
  validate: {
    delayMs: false     
  }     
});


app.use(limiter);
app.use(speedLimiter);

const PORT = process.env.PORT || 7000;

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>YTGuide API</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f9fafb;
          color: #111827;
          text-align: center;
          padding: 50px;
        }
        h1 {
          font-size: 2.5rem;
          margin-bottom: 10px;
        }
        p {
          font-size: 1.2rem;
          margin-bottom: 20px;
        }
        a {
          display: inline-block;
          margin-top: 10px;
          padding: 10px 20px;
          background-color: #2563eb;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          transition: background 0.3s;
        }
        a:hover {
          background-color: #1e40af;
        }
      </style>
    </head>
    <body>
      <h1>Welcome to YTGuide API</h1>
      <p>Your tool for analyzing and summarizing YouTube content intelligently.</p>
      <a href="https://documenter.getpostman.com/view/36611651/2sB34kEJtk" target="_blank">View API Docs</a>
    </body>
    </html>
  `);
});


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

// YTGuide Version 2️⃣
app.post('/api/v2/youtube-urls', async (req, res) => {
  const { url1, url2, url3, goal } = req.body;
  if (!url1 || !url2 || !url3 || !goal) {
    return res.status(400).json({
      message: "Please provide url1, url2, url3 and goal"
    });
  }

  const urls = [url1, url2, url3];

  try {
    const descriptions = await getVideoDescriptions(urls);
    const groqResponse = await analyzeWithGroq(goal, descriptions);

    res.status(200).json({
      status: 'success',
      message: 'Analysis complete',
      goal,
      groqRecommendation: groqResponse,
      version: 'v2'
    });
  } catch (err) {
    res.status(500).json({
      message: 'Something went wrong',
      error: err.message,
      version: 'v2'
    });
  }
});

// Health 
app.get('/health', (req, res) => {
  const healthData = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    port: PORT,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
    },
    services: {
      youtube: 'Connected',
      gemini: 'Connected',
      database: 'N/A'
    }
  };

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>YTGuide API - Health Check</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          margin: 0;
          padding: 20px;
          min-height: 100vh;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        h1 {
          text-align: center;
          font-size: 2.5rem;
          margin-bottom: 30px;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        .status-badge {
          display: inline-block;
          background: #10b981;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          margin-bottom: 20px;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        .health-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 30px;
        }
        .health-card {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 15px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .health-card h3 {
          margin-top: 0;
          color: #fbbf24;
          font-size: 1.3rem;
        }
        .health-item {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .health-item:last-child {
          border-bottom: none;
        }
        .health-label {
          font-weight: 500;
        }
        .health-value {
          font-family: 'Courier New', monospace;
          background: rgba(0, 0, 0, 0.2);
          padding: 2px 8px;
          border-radius: 4px;
        }
        .service-status {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          margin-right: 8px;
          animation: blink 1.5s infinite;
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }
        .timestamp {
          text-align: center;
          margin-top: 20px;
          opacity: 0.8;
          font-size: 0.9rem;
        }
        .refresh-btn {
          display: block;
          margin: 20px auto 0;
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 25px;
          text-decoration: none;
          font-weight: bold;
          transition: all 0.3s ease;
        }
        .refresh-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 YTGuide API Health Check</h1>
        <div style="text-align: center;">
          <span class="status-badge">● ${healthData.status}</span>
        </div>
        
        <div class="health-grid">
          <div class="health-card">
            <h3>📊 System Info</h3>
            <div class="health-item">
              <span class="health-label">Status:</span>
              <span class="health-value">${healthData.status}</span>
            </div>
            <div class="health-item">
              <span class="health-label">Uptime:</span>
              <span class="health-value">${formatUptime(healthData.uptime)}</span>
            </div>
            <div class="health-item">
              <span class="health-label">Environment:</span>
              <span class="health-value">${healthData.environment}</span>
            </div>
            <div class="health-item">
              <span class="health-label">Version:</span>
              <span class="health-value">${healthData.version}</span>
            </div>
            <div class="health-item">
              <span class="health-label">Port:</span>
              <span class="health-value">${healthData.port}</span>
            </div>
          </div>

          <div class="health-card">
            <h3>💾 Memory Usage</h3>
            <div class="health-item">
              <span class="health-label">Heap Used:</span>
              <span class="health-value">${healthData.memory.used} MB</span>
            </div>
            <div class="health-item">
              <span class="health-label">Heap Total:</span>
              <span class="health-value">${healthData.memory.total} MB</span>
            </div>
            <div class="health-item">
              <span class="health-label">RSS:</span>
              <span class="health-value">${healthData.memory.rss} MB</span>
            </div>
          </div>

          <div class="health-card">
            <h3>🔗 Services</h3>
            <div class="health-item">
              <span class="health-label">
                <span class="service-status"></span>YouTube API:
              </span>
              <span class="health-value">${healthData.services.youtube}</span>
            </div>
            <div class="health-item">
              <span class="health-label">
                <span class="service-status"></span>Gemini AI:
              </span>
              <span class="health-value">${healthData.services.gemini}</span>
            </div>
            <div class="health-item">
              <span class="health-label">
                <span class="service-status"></span>Database:
              </span>
              <span class="health-value">${healthData.services.database}</span>
            </div>
          </div>
        </div>

        <div class="timestamp">
          Last checked: ${new Date().toLocaleString()}
        </div>
        
        <a href="/health" class="refresh-btn">🔄 Refresh Health Check</a>
      </div>
    </body>
    </html>
  `);
});

// ping
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

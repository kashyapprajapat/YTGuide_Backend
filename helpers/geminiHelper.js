const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const analyzeWithGemini = async (goal, descriptions) => {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  if (!goal || !descriptions || descriptions.length === 0) {
    throw new Error('Goal and descriptions are required');
  }


  const truncateText = (text, maxLength = 2000) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const videoInfo = descriptions.map((vid, index) => {
    return `Video ${index + 1}:
Title: ${truncateText(vid.title || 'No title', 200)}
Description: ${truncateText(vid.description || 'No description', 1500)}`;
  }).join('\n\n');

  const prompt = `
You are helping a learner choose the most suitable YouTube video to meet their personal learning goal.

🔍 User's Learning Goal:
"${truncateText(goal, 500)}"

🎥 Below are 3 YouTube videos the user is considering, including titles and descriptions:

${videoInfo}

🎯 What you should do:
1. Read the goal carefully and understand what the user truly wants to achieve.
2. Read the video titles and descriptions — understand the intent and usefulness of each.
3. Pick the video that best fits the user's intent — as if you were recommending it to a friend.
4. Write a friendly, motivating, and natural-sounding recommendation explaining **why** that video is best for the user, using emotional and practical reasoning (e.g., clarity, pace, structure, beginner-friendliness, motivation, etc.)

🧠 Then, provide a ranked list (1 to 3) of all three videos, along with **brief reasoning** for each ranking.

✍️ Response format should look like:

✅ **Personal Recommendation**:
"Based on your goal, I'd strongly recommend Video X because... [your human-style reasoning]"

📊 **Video Rankings**:
1. Video X – [Short reason]
2. Video Y – [Short reason]
3. Video Z – [Short reason]

Be thoughtful and personalized — the tone should feel like a helpful, intelligent human is giving advice.
`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
      stopSequences: []
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      }
    ]
  };

  try {
    console.log(`Attempting Gemini API call`);
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000, 
        validateStatus: function (status) {
          return status < 500; 
        }
      }
    );

    
    if (response.status >= 400) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Check if response has the expected structure
    if (!response.data || !response.data.candidates || response.data.candidates.length === 0) {
      throw new Error('Invalid response structure from Gemini API');
    }

    const candidate = response.data.candidates[0];
    
    
    if (candidate.finishReason === 'SAFETY') {
      throw new Error('Content was blocked by safety filters');
    }

    
    const result = candidate.content?.parts?.[0]?.text;
    
    if (!result) {
      throw new Error('No text content in response');
    }

    console.log("Gemini API call successful");
    return result;
    
  } catch (error) {
    console.log(`Gemini API call failed:`, error.message);
    throw error;
  }
};

module.exports = {
  analyzeWithGemini
};
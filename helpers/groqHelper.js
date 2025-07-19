const { Groq } = require('groq-sdk');

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const analyzeWithGroq = async (goal, descriptions) => {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  if (!goal || !descriptions || descriptions.length === 0) {
    throw new Error('Goal and descriptions are required');
  }

  const groq = new Groq({
    apiKey: GROQ_API_KEY
  });

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

  try {
    console.log(`Attempting Groq API call`);
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.1-70b-versatile", // Using a stable model instead of the scout model
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 0.95,
      stream: false // Set to false for easier handling
    });

    const result = chatCompletion.choices[0]?.message?.content;
    
    if (!result) {
      throw new Error('No content in Groq response');
    }

    console.log("Groq API call successful");
    return result;
    
  } catch (error) {
    console.log(`Groq API call failed:`, error.message);
    throw error;
  }
};

module.exports = {
  analyzeWithGroq
};
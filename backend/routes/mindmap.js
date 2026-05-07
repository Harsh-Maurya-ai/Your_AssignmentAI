const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

router.post('/generate', auth, async (req, res) => {
  const { topic } = req.body;

  if (!topic || topic.trim().length < 3) {
    return res.status(400).json({ message: 'Please enter a valid topic.' });
  }

  const prompt = `You are an expert mind map creator for students.

Create a detailed hierarchical mind map for the topic: "${topic}"

Return ONLY a valid JSON object (no markdown, no backticks, no extra text):
{
  "topic": "Main Topic Name",
  "color": "#6366f1",
  "children": [
    {
      "id": "branch1",
      "label": "Main Branch 1",
      "color": "#f59e0b",
      "children": [
        {
          "id": "branch1-1",
          "label": "Sub Topic",
          "color": "#10b981",
          "children": []
        }
      ]
    }
  ]
}

Rules:
- Create exactly 5-7 main branches
- Each main branch must have 3-5 sub-topics
- Sub-topics can have 0-2 deeper children (3rd level)
- Labels must be SHORT (2-5 words max)
- Use these colors for main branches (cycle through): "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"
- Use lighter shades for sub-topics
- topic field = clean title of the main topic
- Return ONLY valid JSON`;

  try {
    const groqResponse = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 3000,
      }),
    });

    if (!groqResponse.ok) {
      const errData = await groqResponse.json();
      console.error('Groq error:', errData);
      return res.status(500).json({ message: 'AI error. Please try again.' });
    }

    const groqData = await groqResponse.json();
    let raw = groqData.choices?.[0]?.message?.content?.trim();
    raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();

    const result = JSON.parse(raw);

    if (!result.topic || !result.children) {
      return res.status(500).json({ message: 'Invalid AI response. Try again.' });
    }

    res.json(result);
  } catch (err) {
    console.error('Mind map error:', err);
    res.status(500).json({ message: 'AI error or invalid response. Please try again.' });
  }
});

module.exports = router;
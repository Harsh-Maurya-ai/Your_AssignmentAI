const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

router.post('/check', auth, async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim().length < 10) {
    return res.status(400).json({ message: 'Please provide text to check (min 10 characters).' });
  }

  const prompt = `You are an expert English grammar and academic writing checker.

Analyze the following text and return a JSON response ONLY (no extra text, no markdown, no backticks).

Text to analyze:
"${text}"

Return this exact JSON structure:
{
  "correctedText": "the fully corrected version of the text",
  "overallScore": 85,
  "tone": "Academic",
  "issues": [
    {
      "type": "Grammar",
      "original": "the wrong phrase",
      "suggestion": "the correct phrase",
      "explanation": "why it is wrong"
    }
  ],
  "suggestions": [
    "One overall writing tip",
    "Another tip"
  ],
  "wordCount": 45,
  "readingTimeSeconds": 20
}

Rules:
- overallScore is 0-100 based on grammar, clarity, and academic tone
- tone can be: "Academic", "Casual", "Formal", "Informal", "Mixed"
- issues array should list specific grammar/spelling/structure problems found (max 8)
- suggestions array should have 2-3 overall writing improvement tips
- wordCount is the word count of the original text
- readingTimeSeconds is estimated reading time in seconds
- Return ONLY the JSON, nothing else`;

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
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    if (!groqResponse.ok) {
      const errData = await groqResponse.json();
      console.error('Groq error:', errData);
      return res.status(500).json({ message: 'AI error. Please try again.' });
    }

    const groqData = await groqResponse.json();
    let raw = groqData.choices?.[0]?.message?.content?.trim();

    // Strip markdown code fences if present
    raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();

    const result = JSON.parse(raw);
    res.json(result);
  } catch (err) {
    console.error('Grammar check error:', err);
    res.status(500).json({ message: 'AI error or invalid response. Please try again.' });
  }
});

module.exports = router;
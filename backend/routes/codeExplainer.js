const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

router.post('/explain', auth, async (req, res) => {
  const { code, language } = req.body;

  if (!code || code.trim().length < 5) {
    return res.status(400).json({ message: 'Please provide code to explain.' });
  }

  const prompt = `You are an expert programming teacher helping an Indian CS/IT student understand code.

Language: ${language || 'Auto-detect'}

Code to explain:
\`\`\`
${code}
\`\`\`

Return ONLY a JSON object (no markdown, no backticks, no extra text):
{
  "language": "detected or provided language",
  "overview": "2-3 sentence simple overview of what this entire code does",
  "lineByLine": [
    {
      "line": "the actual line of code",
      "lineNumber": 1,
      "explanation": "simple explanation in easy English what this line does"
    }
  ],
  "keyConceptsUsed": ["concept1", "concept2"],
  "vivaQuestions": [
    {
      "question": "a likely viva question about this code",
      "answer": "the model answer"
    }
  ],
  "simpleSummary": "Explain the whole code in 3-4 simple lines like you are explaining to a beginner student. Mix simple Hindi words if needed e.g. 'is code mein hum ek loop use karte hain'"
}

Rules:
- lineByLine should cover every meaningful line (skip blank lines and only closing braces)
- vivaQuestions should have 3 most likely questions a professor would ask
- Keep explanations simple, student-friendly
- Return ONLY the JSON`;

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
    res.json(result);
  } catch (err) {
    console.error('Code explainer error:', err);
    res.status(500).json({ message: 'AI error or invalid response. Please try again.' });
  }
});

module.exports = router;
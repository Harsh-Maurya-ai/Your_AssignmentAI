const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

router.post('/debug', auth, async (req, res) => {
  const { code, language, errorMessage } = req.body;

  if (!code || code.trim().length < 5) {
    return res.status(400).json({ message: 'Please provide code to debug.' });
  }

  const prompt = `You are an expert programming debugger helping an Indian CS/IT student fix their buggy code.

Language: ${language || 'Auto-detect'}
${errorMessage ? `Error Message the student is getting: ${errorMessage}` : ''}

Buggy Code:
\`\`\`
${code}
\`\`\`

Analyze the code, find all bugs, and return ONLY a JSON object (no markdown, no backticks, no extra text):
{
  "language": "detected or provided language",
  "hasErrors": true,
  "fixedCode": "the complete corrected version of the code",
  "bugs": [
    {
      "lineNumber": 3,
      "buggyLine": "the incorrect line of code",
      "issue": "what is wrong with this line",
      "fix": "what the correct line should be",
      "severity": "Critical"
    }
  ],
  "explanation": "2-3 sentence overall explanation of what was wrong and what was fixed",
  "preventionTip": "one tip to avoid this type of bug in the future"
}

Rules:
- severity can be: Critical, Warning, or Suggestion
- If no bugs found, set hasErrors to false and bugs to empty array
- fixedCode must be the complete working code, not just the changed lines
- Keep explanations simple and student-friendly
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
        temperature: 0.2,
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
    console.error('Code debugger error:', err);
    res.status(500).json({ message: 'AI error or invalid response. Please try again.' });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

router.post('/convert', auth, async (req, res) => {
  const { code, language } = req.body;

  if (!code || code.trim().length < 5) {
    return res.status(400).json({ message: 'Please provide code to convert.' });
  }

  const prompt = `You are an expert computer science teacher helping an Indian CS/IT student convert code to pseudocode for their exams and assignments.

Language: ${language || 'Auto-detect'}

Code to convert:
\`\`\`
${code}
\`\`\`

Return ONLY a JSON object (no markdown, no backticks, no extra text):
{
  "language": "detected or provided language",
  "pseudocode": "the clean pseudocode version, using standard pseudocode conventions like BEGIN/END, INPUT/OUTPUT, IF/THEN/ELSE, FOR/WHILE loops, etc. Each step on a new line with proper indentation using spaces.",
  "algorithm": [
    "Step 1: description of first logical step",
    "Step 2: description of second logical step"
  ],
  "flowchartDescription": "Text description of the flowchart for this code. Describe each shape: Start (oval) → Process (rectangle) → Decision (diamond) → End (oval). Example: Start → Input n → [n > 0?] Yes → Print n → End, No → Print error → End",
  "complexity": {
    "time": "O(n) or O(1) etc",
    "space": "O(n) or O(1) etc",
    "explanation": "simple one line explanation of why"
  }
}

Rules:
- Pseudocode must be clean, readable, and follow university exam standards
- Algorithm steps should be numbered and in plain simple English
- flowchartDescription should clearly describe each node and arrow
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
        max_tokens: 2000,
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
    console.error('Pseudocode error:', err);
    res.status(500).json({ message: 'AI error or invalid response. Please try again.' });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

router.post('/generate', auth, async (req, res) => {
  const { subject, topic, difficulty, count } = req.body;

  if (!topic || topic.trim().length < 3) {
    return res.status(400).json({ message: 'Please enter a topic or chapter.' });
  }

  const numQ = Math.min(Math.max(parseInt(count) || 20, 5), 30);
  const diff = difficulty || 'Mixed';

  const prompt = `You are an expert university exam question setter for ${subject ? subject : 'the given subject'}.

Generate exactly ${numQ} multiple choice questions on the topic: "${topic}"
Difficulty: ${diff}

Return ONLY a valid JSON object (no markdown, no backticks, no extra text):
{
  "subject": "${subject || topic}",
  "topic": "${topic}",
  "difficulty": "${diff}",
  "questions": [
    {
      "id": 1,
      "question": "What is the time complexity of binary search?",
      "options": {
        "A": "O(n)",
        "B": "O(log n)",
        "C": "O(n log n)",
        "D": "O(1)"
      },
      "correct": "B",
      "explanation": "Binary search divides the search space in half each iteration, giving O(log n) time complexity.",
      "difficulty": "Easy"
    }
  ]
}

Rules:
- Exactly ${numQ} questions
- Each question has exactly 4 options: A, B, C, D
- correct field = only the letter (A, B, C, or D)
- explanation = 1-2 sentence clear explanation of why the answer is correct
- difficulty per question = Easy / Medium / Hard
- ${diff === 'Mixed' ? 'Mix difficulties: ~30% Easy, ~50% Medium, ~20% Hard' : `All questions should be ${diff} difficulty`}
- Questions must test real understanding — definitions, applications, comparisons, tricky edge cases
- All 4 options must be plausible (no obviously wrong options)
- For CS topics: include time complexity, use cases, code logic, algorithm steps
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
        max_tokens: 5000,
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

    if (!result.questions || !Array.isArray(result.questions)) {
      return res.status(500).json({ message: 'Invalid AI response. Try again.' });
    }

    res.json(result);
  } catch (err) {
    console.error('MCQ generator error:', err);
    res.status(500).json({ message: 'AI error or invalid response. Please try again.' });
  }
});

module.exports = router;
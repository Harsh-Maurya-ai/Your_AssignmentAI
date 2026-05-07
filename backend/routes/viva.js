const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

router.post('/predict', auth, async (req, res) => {
  const { subject, topic, semester, difficulty } = req.body;

  if (!subject || subject.trim().length < 2) {
    return res.status(400).json({ message: 'Please provide a subject.' });
  }
  if (!topic || topic.trim().length < 2) {
    return res.status(400).json({ message: 'Please provide a chapter or topic.' });
  }

  const difficultyInstruction =
    difficulty && difficulty !== 'All'
      ? `Focus mostly on ${difficulty} difficulty questions.`
      : 'Mix of Easy (6), Medium (11), and Hard (8) questions.';

  const prompt = `You are an expert university examiner for ${subject}. Generate 25 viva voce questions for the topic: "${topic}" ${semester ? `(Semester ${semester})` : ''}.

${difficultyInstruction}

Each question must have:
- A clear, specific question
- A detailed model answer (3-6 sentences, exam-ready)
- A quick exam tip (1 sentence)
- Difficulty level: Easy / Medium / Hard

Return ONLY a valid JSON object. No markdown, no backticks, no extra text:
{
  "subject": "${subject}",
  "topic": "${topic}",
  "questions": [
    {
      "question": "What is a binary search tree?",
      "answer": "A Binary Search Tree (BST) is a node-based binary tree data structure where each node has at most two children. The left subtree contains only nodes with keys lesser than the parent node's key, and the right subtree contains only nodes with keys greater than the parent node's key. This property makes search, insertion, and deletion operations efficient with O(log n) average time complexity.",
      "tip": "Always mention the time complexity in your answer for full marks.",
      "difficulty": "Easy"
    }
  ]
}

Make questions realistic — exactly what a professor would ask in a viva for ${subject} - ${topic}. Include both conceptual and application-based questions. For CS topics, include questions about algorithms, complexity, real-world use cases, and comparisons.`;

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
        temperature: 0.5,
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
      return res.status(500).json({ message: 'Invalid AI response format. Try again.' });
    }

    res.json(result);
  } catch (err) {
    console.error('Viva predictor error:', err);
    res.status(500).json({ message: 'AI error or invalid response. Please try again.' });
  }
});

module.exports = router;
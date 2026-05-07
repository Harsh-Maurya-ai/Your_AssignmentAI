const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

router.post('/generate', auth, async (req, res) => {
  const { content, subject, cardCount } = req.body;

  if (!content || content.trim().split(/\s+/).length < 20) {
    return res.status(400).json({ message: 'Please provide at least 20 words of content.' });
  }

  const count = parseInt(cardCount) || 15;

  const prompt = `You are an expert educational flashcard creator${subject ? ` for ${subject}` : ''}.

Create exactly ${count} flashcards from this content. Each flashcard must have a clear question on one side and a concise answer on the other.

CONTENT:
"""
${content.substring(0, 6000)}
"""

Return ONLY a valid JSON object (no markdown, no backticks, no extra text):
{
  "cards": [
    {
      "question": "What is a binary search tree?",
      "answer": "A BST is a tree where each node's left subtree has smaller values and right subtree has larger values. Average time complexity: O(log n) for search, insert, delete.",
      "category": "Definition",
      "tip": "Remember: left < root < right"
    }
  ]
}

Requirements:
- Exactly ${count} cards
- question: Clear, specific question (not too long)
- answer: Concise but complete answer (1-3 sentences max)
- category: One of: Definition / Concept / Formula / Example / Comparison / Process
- tip: Optional short memory tip or mnemonic (can be empty string "")
- Mix of different question types: definitions, how/why questions, comparisons, applications
- Make questions test actual understanding, not just memorization
- Derive everything strictly from the provided content
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

    if (!result.cards || !Array.isArray(result.cards)) {
      return res.status(500).json({ message: 'Invalid AI response. Try again.' });
    }

    res.json(result);
  } catch (err) {
    console.error('Flashcard generator error:', err);
    res.status(500).json({ message: 'AI error or invalid response. Please try again.' });
  }
});

module.exports = router;
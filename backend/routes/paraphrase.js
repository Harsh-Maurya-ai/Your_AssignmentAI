const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/paraphrase', auth, async (req, res) => {
  const { text, mode } = req.body;

  if (!text || text.trim().length < 10) {
    return res.status(400).json({ message: 'Please provide text to paraphrase (min 10 characters).' });
  }

  const modePrompts = {
    standard: `Paraphrase the following text in a natural, clear way. Keep the same meaning but use different words and sentence structure. Return ONLY the paraphrased text, nothing else.`,
    academic: `Rewrite the following text in a formal academic tone suitable for university assignments. Use scholarly vocabulary, passive voice where appropriate, and proper academic structure. Return ONLY the rewritten text, nothing else.`,
    simplify: `Rewrite the following text in very simple, easy-to-understand language. Use short sentences, simple words, and avoid jargon. Return ONLY the simplified text, nothing else.`,
  };

  const prompt = `${modePrompts[mode] || modePrompts.standard}

Original Text:
"${text}"`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const paraphrased = completion.choices[0]?.message?.content?.trim();

    const originalWords = text.trim().split(/\s+/).length;
    const newWords = paraphrased.trim().split(/\s+/).length;
    const originalChars = text.replace(/\s/g, '');
    const newChars = paraphrased.replace(/\s/g, '');
    const commonChars = [...newChars].filter(c => originalChars.includes(c)).length;
    const changePercent = Math.round((1 - commonChars / Math.max(originalChars.length, 1)) * 100);

    res.json({
      original: text,
      paraphrased,
      mode,
      originalWordCount: originalWords,
      newWordCount: newWords,
      changePercent: Math.min(changePercent, 99),
    });
  } catch (err) {
    console.error('Paraphrase error:', err);
    res.status(500).json({ message: 'AI error. Please try again.' });
  }
});

module.exports = router;
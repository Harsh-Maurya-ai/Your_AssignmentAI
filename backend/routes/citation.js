const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

router.post('/generate', auth, async (req, res) => {
  const { sourceType, format, title, author, year, url, journal, volume, issue, pages, publisher, accessed } = req.body;

  if (!sourceType || !format || !title) {
    return res.status(400).json({ message: 'Source type, format, and title are required.' });
  }

  const prompt = `You are an academic citation generator. Generate a perfectly formatted citation.

Source Details:
- Source Type: ${sourceType}
- Title: ${title}
- Author(s): ${author || 'Not provided'}
- Year: ${year || 'n.d.'}
- URL: ${url || 'Not provided'}
- Journal/Publisher: ${journal || publisher || 'Not provided'}
- Volume: ${volume || 'Not provided'}
- Issue: ${issue || 'Not provided'}
- Pages: ${pages || 'Not provided'}
- Date Accessed: ${accessed || 'Not provided'}

Generate the citation in ${format} format.

Return ONLY a JSON object like this (no markdown, no extra text):
{
  "citation": "the fully formatted citation string here",
  "format": "${format}",
  "sourceType": "${sourceType}",
  "inText": "the in-text citation for this source e.g. (Author, Year) or [1]"
}`;

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
        max_tokens: 512,
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
    console.error('Citation error:', err);
    res.status(500).json({ message: 'AI error or invalid response. Please try again.' });
  }
});

module.exports = router;
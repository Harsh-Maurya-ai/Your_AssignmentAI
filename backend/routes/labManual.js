const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

router.post('/generate', auth, async (req, res) => {
  const { experimentName, aim, subject, language } = req.body;

  if (!experimentName || experimentName.trim().length < 3) {
    return res.status(400).json({ message: 'Please provide an experiment name.' });
  }
  if (!aim || aim.trim().length < 5) {
    return res.status(400).json({ message: 'Please provide the aim of the experiment.' });
  }

  const prompt = `You are an expert CS/IT lab manual writer for Indian engineering college students (B.Tech/BCA/MCA).

Generate a complete, professional lab manual for the following experiment:

Experiment Name: ${experimentName}
Aim: ${aim}
Subject: ${subject || 'Computer Science'}
Programming Language: ${language || 'C/C++'}

Return ONLY a JSON object (no markdown, no backticks, no extra text):
{
  "experimentNo": "Experiment No: 1",
  "experimentName": "${experimentName}",
  "aim": "Clearly written aim statement",
  "objective": ["objective 1", "objective 2", "objective 3"],
  "theory": "Detailed theory explanation in 3-5 paragraphs. Include definition, working, types if any, and importance. Use proper technical language suitable for university lab manual.",
  "algorithm": [
    "Step 1: Description",
    "Step 2: Description",
    "Step 3: Description"
  ],
  "flowchartDescription": "Textual description of the flowchart for this experiment. Describe Start → Process → Decision → End flow in words since actual diagram cannot be generated. Be detailed enough that student can draw it.",
  "code": "Complete working ${language || 'C/C++'} code for this experiment. Well commented. Standard university format.",
  "codeExplanation": "Line by line or section by section explanation of the key parts of the code.",
  "sampleOutput": "Expected output when program runs successfully. Show sample input and corresponding output.",
  "result": "The experiment was successfully completed. [Short 2-3 line result statement about what was achieved]",
  "conclusion": "Detailed conclusion about what was learned from this experiment, its real-world applications, and significance in Computer Science.",
  "precautions": ["precaution 1", "precaution 2", "precaution 3"],
  "vivaQuestions": [
    {"question": "viva question 1", "answer": "model answer 1"},
    {"question": "viva question 2", "answer": "model answer 2"},
    {"question": "viva question 3", "answer": "model answer 3"},
    {"question": "viva question 4", "answer": "model answer 4"},
    {"question": "viva question 5", "answer": "model answer 5"}
  ]
}

Rules:
- Theory must be thorough — at least 200 words
- Algorithm steps must be clear and numbered
- Code must be complete and runnable
- Use proper university lab manual language
- Viva questions should be what professors actually ask
- Return ONLY the JSON, no other text`;

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
        max_tokens: 4000,
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
    console.error('Lab manual error:', err);
    res.status(500).json({ message: 'AI error or invalid response. Please try again.' });
  }
});

module.exports = router;
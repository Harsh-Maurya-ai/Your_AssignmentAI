const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const pdfParse = require('pdf-parse');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Store file in memory (no disk write needed)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed.'));
  },
});

router.post('/analyze', auth, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file.' });
    }

    const { subject } = req.body;

    // Extract text from PDF
    let pdfText = '';
    try {
      const pdfData = await pdfParse(req.file.buffer);
      pdfText = pdfData.text;
    } catch (e) {
      return res.status(400).json({ message: 'Could not read PDF. Make sure it is a valid text-based PDF (not scanned image).' });
    }

    if (!pdfText || pdfText.trim().length < 100) {
      return res.status(400).json({ message: 'PDF appears to be empty or scanned. Please upload a text-based PDF.' });
    }

    // Truncate to avoid token limits
    const truncated = pdfText.substring(0, 8000);

    const prompt = `You are an expert academic analyzer specializing in Indian university previous year question papers${subject ? ` for ${subject}` : ''}.

Analyze this previous year question paper (PYQ) content and extract deep insights for students:

PYQ CONTENT:
"""
${truncated}
"""

Return ONLY a valid JSON object (no markdown, no backticks, no extra text):
{
  "subject": "Detected subject name",
  "totalQuestions": 45,
  "yearsDetected": ["2022", "2021", "2020"],
  "repeatedTopics": [
    {
      "topic": "Binary Search Tree",
      "frequency": 5,
      "years": ["2022", "2021", "2020"],
      "importance": "Very High",
      "tip": "Always asked with insertion/deletion operations"
    }
  ],
  "importantChapters": [
    {
      "chapter": "Sorting Algorithms",
      "weightage": 25,
      "topicsInChapter": ["Quick Sort", "Merge Sort", "Heap Sort"],
      "likelyMarks": "15-20 marks"
    }
  ],
  "predictedTopics": [
    {
      "topic": "Graph Traversal (BFS & DFS)",
      "probability": "Very High",
      "reason": "Asked in 4 of last 5 years",
      "suggestedPrep": "Practice with adjacency matrix and list both"
    }
  ],
  "questionTypeBreakdown": [
    { "type": "Short Answer (2 marks)", "count": 10, "percentage": 22 },
    { "type": "Medium Answer (5 marks)", "count": 8, "percentage": 18 },
    { "type": "Long Answer (10 marks)", "count": 5, "percentage": 11 }
  ],
  "studyStrategy": [
    "Focus 60% time on top 3 repeated topics",
    "Practice diagrams for tree and graph questions",
    "Memorize time complexities for all sorting algorithms"
  ],
  "mustPrepareTopic": "The single most important topic to prepare based on frequency and marks"
}

Rules:
- repeatedTopics: Find topics that appear multiple times (min 3, max 10), sorted by frequency descending
- importantChapters: Top 5 chapters by marks weightage
- predictedTopics: Top 5 topics most likely to appear next exam, with clear reasoning
- probability field must be: "Very High" / "High" / "Medium"
- importance field must be: "Very High" / "High" / "Medium"
- weightage = percentage of total marks
- Be specific — use actual topic names from the content, not generic names
- Return ONLY valid JSON`;

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

    if (!result.repeatedTopics || !result.predictedTopics) {
      return res.status(500).json({ message: 'Invalid AI response. Try again.' });
    }

    res.json(result);
  } catch (err) {
    console.error('PYQ analyzer error:', err);
    if (err.message?.includes('Only PDF')) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Analysis failed. Please try again.' });
  }
});

module.exports = router;
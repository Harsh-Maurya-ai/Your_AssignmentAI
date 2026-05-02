const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Assignment = require('../models/Assignment');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = `https://api.groq.com/openai/v1/chat/completions`;
const FREE_DAILY_LIMIT = 3;

// Helper: check and increment usage
async function checkUsageLimit(userId) {
  const user = await User.findById(userId);
  if (user.plan === 'pro') return { allowed: true, user };

  const now = new Date();
  const resetDate = new Date(user.usageResetDate);
  const isSameDay =
    now.getDate() === resetDate.getDate() &&
    now.getMonth() === resetDate.getMonth() &&
    now.getFullYear() === resetDate.getFullYear();

  if (!isSameDay) {
    user.usageCount = 0;
    user.usageResetDate = now;
    await user.save();
  }

  if (user.usageCount >= FREE_DAILY_LIMIT) {
    return { allowed: false, user };
  }

  return { allowed: true, user };
}

// POST /api/assignment/generate
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { topic, subject, wordCount, universityName, format, studentName, rollNumber } = req.body;

    if (!topic || !subject || !wordCount || !format) {
      return res.status(400).json({ message: 'Topic, subject, word count, and format are required.' });
    }

    const { allowed, user } = await checkUsageLimit(req.user.id);
    if (!allowed) {
      return res.status(403).json({
        message: 'Daily limit reached. Upgrade to Pro for unlimited access.',
        limitReached: true
      });
    }

    const today = new Date().toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    const prompt = `You are an academic writing assistant helping an Indian university student.

Write a complete, high-quality ${format} on the topic: "${topic}"

Details:
- Subject: ${subject}
- Word Count: approximately ${wordCount} words
- University: ${universityName || 'Not specified'}
- Student Name: ${studentName || 'Student'}
- Roll Number: ${rollNumber || 'N/A'}
- Date: ${today}
- Format: ${format}

Requirements:
1. Start with a proper title page section (Title, Subject, Submitted by, Roll No, University, Date)
2. Follow standard academic structure for a ${format}:
   ${format === 'Essay' ? '- Introduction, Body Paragraphs with clear arguments, Conclusion' : ''}
   ${format === 'Report' ? '- Abstract, Introduction, Literature Review, Methodology, Results/Discussion, Conclusion, References' : ''}
   ${format === 'Case Study' ? '- Introduction, Background, Problem Statement, Analysis, Solutions, Conclusion' : ''}
   ${format === 'Technical' ? '- Introduction, Technical Background, Implementation/Design, Analysis, Results, Conclusion, References' : ''}
3. Use formal academic language appropriate for Indian universities
4. Include at least 3-4 references in IEEE format at the end
5. Write approximately ${wordCount} words (excluding title page)
6. Use clear section headings

Write the complete assignment now:`;

   const groqResponse = await fetch(GROQ_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${GROQ_API_KEY}`
  },
  body: JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 4096,
  })
});

if (!groqResponse.ok) {
  const errData = await groqResponse.json();
  console.error('Groq error:', errData);
  return res.status(500).json({ message: 'AI generation failed. Check your Groq API key.' });
}

const groqData = await groqResponse.json();
const generatedText = groqData.choices?.[0]?.message?.content;

if (!generatedText) {
  return res.status(500).json({ message: 'No content generated. Try again.' });
}

    // Save to DB
    const assignment = new Assignment({
      userId: req.user.id,
      topic,
      subject,
      wordCount,
      universityName,
      format,
      studentName,
      rollNumber,
      content: generatedText,
    });
    await assignment.save();

    // Increment usage for free users
    if (user.plan === 'free') {
      user.usageCount += 1;
      await user.save();
    }

    res.json({
      content: generatedText,
      assignmentId: assignment._id,
      usageCount: user.plan === 'free' ? user.usageCount : null,
      usageLimit: user.plan === 'free' ? FREE_DAILY_LIMIT : null,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/assignment/history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const assignments = await Assignment.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('topic subject format wordCount createdAt');
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/assignment/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, userId: req.user.id });
    if (!assignment) return res.status(404).json({ message: 'Not found' });
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
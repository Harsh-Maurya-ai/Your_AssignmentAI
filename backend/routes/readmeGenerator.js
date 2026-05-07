const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

router.post('/generate', auth, async (req, res) => {
  const { projectName, description, techStack, features, installation, usage, githubUsername } = req.body;

  if (!projectName || projectName.trim().length < 2) {
    return res.status(400).json({ message: 'Please provide a project name.' });
  }
  if (!description || description.trim().length < 10) {
    return res.status(400).json({ message: 'Please provide a project description.' });
  }

  const prompt = `You are an expert GitHub README writer. Generate a professional, visually appealing README.md for the following project.

Project Details:
- Project Name: ${projectName}
- Description: ${description}
- Tech Stack: ${techStack || 'Not specified'}
- Key Features: ${features || 'Not specified'}
- Installation Steps: ${installation || 'Standard npm install'}
- Usage Info: ${usage || 'Standard usage'}
- GitHub Username: ${githubUsername || 'username'}

Return ONLY a JSON object (no markdown, no backticks, no extra text):
{
  "readmeMarkdown": "The complete README.md content as a single string with actual newlines. Include: title with emoji, badges, description, features list, tech stack section, installation steps, usage section, project structure, contributing section, license section. Make it look professional like top GitHub projects.",
  "suggestedLicense": "MIT",
  "projectEmoji": "🚀"
}

README Requirements:
- Start with a big project title with emoji
- Add shields.io badge lines for: license, version, stars (use placeholder URLs)
- Write a compelling description paragraph
- Features section with emoji bullet points
- Tech Stack section with emojis for each technology
- Prerequisites section
- Installation section with numbered steps and code blocks
- Usage section with code example
- Project structure section showing folder tree
- Contributing guidelines
- License section
- Footer with made with love by username
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
    console.error('README generator error:', err);
    res.status(500).json({ message: 'AI error or invalid response. Please try again.' });
  }
});

module.exports = router;
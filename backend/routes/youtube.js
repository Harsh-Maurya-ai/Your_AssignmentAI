const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Fetch transcript using YouTube's timedtext API (no API key needed)
async function fetchTranscript(videoId) {
  try {
    // Try fetching the video page to get transcript tracks
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = await pageRes.text();

    // Extract caption tracks from the page
    const captionMatch = html.match(/"captionTracks":(\[.*?\])/);
    if (!captionMatch) return null;

    const tracks = JSON.parse(captionMatch[1]);
    if (!tracks || tracks.length === 0) return null;

    // Prefer English, fallback to first available
    const track = tracks.find((t) => t.languageCode === 'en') || tracks[0];
    if (!track?.baseUrl) return null;

    const transcriptRes = await fetch(track.baseUrl);
    const xml = await transcriptRes.text();

    // Parse XML transcript
    const textMatches = xml.match(/<text[^>]*>(.*?)<\/text>/gs) || [];
    const transcript = textMatches
      .map((t) => {
        const startMatch = t.match(/start="([\d.]+)"/);
        const text = t.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
        const seconds = startMatch ? parseFloat(startMatch[1]) : 0;
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return { time: `${minutes}:${secs.toString().padStart(2, '0')}`, text };
      })
      .filter((t) => t.text.length > 0);

    return transcript;
  } catch (err) {
    console.error('Transcript fetch error:', err.message);
    return null;
  }
}

router.post('/summarize', auth, async (req, res) => {
  const { url, videoId, language } = req.body;

  if (!videoId) {
    return res.status(400).json({ message: 'Invalid YouTube URL.' });
  }

  // Fetch transcript
  const transcript = await fetchTranscript(videoId);

  let transcriptText = '';
  let hasTranscript = false;

  if (transcript && transcript.length > 20) {
    hasTranscript = true;
    transcriptText = transcript.map((t) => t.text).join(' ').substring(0, 8000);
  }

  const languageInstructions = {
    hindi: 'Write all notes, summary, and key points in Hindi (Devanagari script).',
    hinglish: 'Write notes in Hinglish (mix of Hindi and English, using Roman script for Hindi words).',
    english: 'Write everything in clear English.',
  };

  const prompt = `You are an expert educational content summarizer. ${hasTranscript
    ? `Analyze this YouTube video transcript and create comprehensive lecture notes.`
    : `Create educational notes for a YouTube video with ID: ${videoId}. Since no transcript is available, create general educational notes about what such a video likely covers.`}

${hasTranscript ? `TRANSCRIPT:\n"""${transcriptText}"""` : ''}

Language instruction: ${languageInstructions[language] || languageInstructions.english}

Return ONLY a valid JSON object (no markdown, no backticks):
{
  "title": "A descriptive title for this video content",
  "topic": "Main topic in 3-4 words",
  "duration": "Estimated duration like '15 min read'",
  "summary": "3-4 sentence paragraph summarizing the entire video content clearly.",
  "notes": "Comprehensive lecture-style notes covering all major points from the video. Use paragraphs. Include definitions, explanations, and examples mentioned. Make it feel like proper class notes a student would write.",
  "keyPoints": [
    "First key point explained as a complete sentence",
    "Second key point explained as a complete sentence"
  ],
  "timestamps": [
    { "time": "0:00", "topic": "Introduction", "description": "Brief description of what's covered" },
    { "time": "2:30", "topic": "Topic Name", "description": "Brief description" }
  ],
  "concepts": ["Concept1", "Concept2", "Concept3"]
}

Requirements:
- notes: Should be 300-500 words, written like actual student notes
- keyPoints: 8-12 most important takeaways
- timestamps: 6-10 logical sections with estimated times
- concepts: 5-8 key terms/concepts from the video
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
    console.error('YouTube summarizer error:', err);
    res.status(500).json({ message: 'AI error or invalid response. Please try again.' });
  }
});

module.exports = router;
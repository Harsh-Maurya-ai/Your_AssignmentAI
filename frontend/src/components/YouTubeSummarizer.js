import React, { useState } from 'react';
import './YouTubeSummarizer.css';

const extractVideoId = (url) => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const match = url.match(p);
    if (match) return match[1];
  }
  return null;
};

const YouTubeSummarizer = () => {
  const [url, setUrl] = useState('');
  const [language, setLanguage] = useState('english');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('notes');
  const [copiedSection, setCopiedSection] = useState('');
  const [videoId, setVideoId] = useState(null);

  const handleSummarize = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) { setError('Please paste a YouTube video URL.'); return; }
    const vid = extractVideoId(trimmedUrl);
    if (!vid) { setError('Invalid YouTube URL. Please paste a valid youtube.com or youtu.be link.'); return; }

    setError('');
    setLoading(true);
    setResult(null);
    setVideoId(vid);
    setActiveTab('notes');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/youtube/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: trimmedUrl, videoId: vid, language }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Failed. Try again.'); setLoading(false); return; }
      setResult(data);
    } catch {
      setError('Server error. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(key);
    setTimeout(() => setCopiedSection(''), 2000);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSummarize(); };

  const EXAMPLE_URLS = [
    'https://www.youtube.com/watch?v=aircAruvnKk',
    'https://www.youtube.com/watch?v=PkZNo7MFNFg',
    'https://www.youtube.com/watch?v=rfscVS0vtbw',
  ];

  return (
    <div className="yt-container">
      {/* Header */}
      <div className="yt-header">
        <div className="yt-header-icon">▶️</div>
        <div>
          <h1 className="yt-title">YouTube Video Summarizer</h1>
          <p className="yt-subtitle">Paste any YouTube lecture link — get full notes, key points & timestamps without watching the whole video</p>
        </div>
      </div>

      {/* Input Card */}
      <div className="yt-input-card">
        <div className="yt-input-row">
          <div className="yt-url-wrapper">
            <span className="yt-url-icon">🔗</span>
            <input
              className="yt-url-input"
              placeholder="Paste YouTube URL here... e.g. https://youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {url && (
              <button className="yt-clear-btn" onClick={() => { setUrl(''); setResult(null); setVideoId(null); }}>✕</button>
            )}
          </div>
          <select className="yt-lang-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="english">🇬🇧 English</option>
            <option value="hindi">🇮🇳 Hindi</option>
            <option value="hinglish">🌐 Hinglish</option>
          </select>
        </div>

        {/* Example URLs */}
        <div className="yt-examples">
          <span className="yt-examples-label">Try an example:</span>
          {EXAMPLE_URLS.map((u, i) => (
            <button key={i} className="yt-example-btn" onClick={() => setUrl(u)}>
              Example {i + 1}
            </button>
          ))}
        </div>

        {error && <div className="yt-error">⚠️ {error}</div>}

        <button className="yt-btn-primary" onClick={handleSummarize} disabled={loading}>
          {loading
            ? <><span className="yt-spinner" /> Analyzing Video...</>
            : <><span>🚀</span> Get Video Notes</>}
        </button>
      </div>

      {/* Video Preview + Results */}
      {(videoId || loading) && (
        <div className="yt-results-layout">

          {/* Left: Video Embed */}
          <div className="yt-video-panel">
            {videoId && (
              <div className="yt-embed-wrapper">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="YouTube video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="yt-embed"
                />
              </div>
            )}

            {loading && (
              <div className="yt-loading-card">
                <div className="yt-loading-steps">
                  <div className="yt-loading-step">
                    <span className="yt-step-icon active-step">🔍</span>
                    <span>Fetching video transcript...</span>
                  </div>
                  <div className="yt-loading-step">
                    <span className="yt-step-icon">📖</span>
                    <span>Reading content...</span>
                  </div>
                  <div className="yt-loading-step">
                    <span className="yt-step-icon">✍️</span>
                    <span>Writing notes...</span>
                  </div>
                </div>
                <div className="yt-loading-bar"><div className="yt-loading-fill" /></div>
              </div>
            )}

            {result && !loading && (
              <div className="yt-video-meta">
                {result.title && <div className="yt-video-title">📹 {result.title}</div>}
                <div className="yt-video-stats">
                  {result.duration && <span>⏱️ {result.duration}</span>}
                  {result.topic && <span>📚 {result.topic}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Right: Notes Output */}
          {result && !loading && (
            <div className="yt-notes-panel">
              {/* Tabs */}
              <div className="yt-tabs">
                {[
                  { id: 'notes', label: '📝 Full Notes' },
                  { id: 'bullets', label: '• Key Points' },
                  { id: 'timestamps', label: '⏱️ Timestamps' },
                  { id: 'summary', label: '📋 Summary' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    className={`yt-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="yt-tab-content">

                {/* Full Notes */}
                {activeTab === 'notes' && (
                  <div className="yt-section">
                    <div className="yt-section-header">
                      <span>📝 Full Lecture Notes</span>
                      <button className="yt-copy-btn" onClick={() => copyText(result.notes, 'notes')}>
                        {copiedSection === 'notes' ? '✅ Copied' : '📋 Copy'}
                      </button>
                    </div>
                    <div className="yt-notes-text">{result.notes}</div>
                  </div>
                )}

                {/* Key Points */}
                {activeTab === 'bullets' && (
                  <div className="yt-section">
                    <div className="yt-section-header">
                      <span>• Key Points</span>
                      <button className="yt-copy-btn" onClick={() => copyText(result.keyPoints.join('\n'), 'bullets')}>
                        {copiedSection === 'bullets' ? '✅ Copied' : '📋 Copy'}
                      </button>
                    </div>
                    <ul className="yt-bullets">
                      {result.keyPoints.map((p, i) => (
                        <li key={i} className="yt-bullet-item">
                          <span className="yt-bullet-num">{i + 1}</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Timestamps */}
                {activeTab === 'timestamps' && (
                  <div className="yt-section">
                    <div className="yt-section-header">
                      <span>⏱️ Topic Timestamps</span>
                      <button
                        className="yt-copy-btn"
                        onClick={() => copyText(result.timestamps.map((t) => `${t.time} — ${t.topic}`).join('\n'), 'timestamps')}
                      >
                        {copiedSection === 'timestamps' ? '✅ Copied' : '📋 Copy'}
                      </button>
                    </div>
                    <div className="yt-timestamps">
                      {result.timestamps.map((t, i) => (
                        <div key={i} className="yt-timestamp-item">
                          <span className="yt-time-badge">{t.time}</span>
                          <div className="yt-time-content">
                            <div className="yt-time-topic">{t.topic}</div>
                            {t.description && <div className="yt-time-desc">{t.description}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="yt-timestamps-note">
                      💡 Note: Timestamps are estimated based on video content structure.
                    </div>
                  </div>
                )}

                {/* Summary */}
                {activeTab === 'summary' && (
                  <div className="yt-section">
                    <div className="yt-section-header">
                      <span>📋 Quick Summary</span>
                      <button className="yt-copy-btn" onClick={() => copyText(result.summary, 'summary')}>
                        {copiedSection === 'summary' ? '✅ Copied' : '📋 Copy'}
                      </button>
                    </div>
                    <div className="yt-summary-text">{result.summary}</div>

                    {result.concepts && result.concepts.length > 0 && (
                      <>
                        <div className="yt-concepts-label">🔑 Concepts Covered:</div>
                        <div className="yt-concepts">
                          {result.concepts.map((c, i) => (
                            <span key={i} className="yt-concept-tag">{c}</span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* How it works */}
      {!videoId && !loading && (
        <div className="yt-how-it-works">
          <div className="yt-hiw-title">How it works</div>
          <div className="yt-hiw-steps">
            {[
              { icon: '📋', step: '1', text: 'Paste any YouTube lecture or tutorial URL' },
              { icon: '🤖', step: '2', text: 'AI fetches and analyzes the video transcript' },
              { icon: '📝', step: '3', text: 'Get full notes, key points & timestamps instantly' },
              { icon: '📤', step: '4', text: 'Copy notes and use for your assignments or exam prep' },
            ].map((s) => (
              <div key={s.step} className="yt-hiw-step">
                <div className="yt-hiw-icon">{s.icon}</div>
                <div className="yt-hiw-num">Step {s.step}</div>
                <div className="yt-hiw-text">{s.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeSummarizer;
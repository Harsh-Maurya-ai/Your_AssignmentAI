import React, { useState, useEffect } from 'react';
import './FlashcardGenerator.css';

const SUBJECTS = [
  'Data Structures & Algorithms', 'Operating Systems', 'Database Management System',
  'Computer Networks', 'Object Oriented Programming', 'Software Engineering',
  'Artificial Intelligence', 'Machine Learning', 'Web Development', 'Data Science',
  'Computer Organization & Architecture', 'Theory of Computation', 'Mathematics', 'Other',
];

const FlashcardGenerator = () => {
  const [form, setForm]         = useState({ subject: '', content: '', cardCount: '15' });
  const [cards, setCards]       = useState([]);
  const [savedSets, setSavedSets] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [mode, setMode]         = useState('generate'); // generate | study | saved
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped]   = useState(false);
  const [score, setScore]       = useState({ known: 0, review: 0 });
  const [answered, setAnswered] = useState(new Set());
  const [filter, setFilter]     = useState('all'); // all | known | review
  const [setName, setSetName]   = useState('');
  const [saved, setSaved]       = useState(false);

  // Load saved sets from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem('flashcardSets');
    if (raw) setSavedSets(JSON.parse(raw));
  }, []);

  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length;

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleGenerate = async () => {
    if (!form.content.trim() || wordCount < 20) {
      setError('Please paste at least 20 words of content to generate flashcards.');
      return;
    }
    setError('');
    setLoading(true);
    setCards([]);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Failed. Try again.'); return; }
      setCards(data.cards);
      setCurrentIdx(0);
      setFlipped(false);
      setScore({ known: 0, review: 0 });
      setAnswered(new Set());
      setMode('study');
    } catch {
      setError('Server error. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleFlip = () => setFlipped((f) => !f);

  const handleAnswer = (known) => {
    const newAnswered = new Set(answered);
    newAnswered.add(currentIdx);
    setAnswered(newAnswered);
    setScore((s) => ({ ...s, [known ? 'known' : 'review']: s[known ? 'known' : 'review'] + 1 }));
    setFlipped(false);
    setTimeout(() => {
      if (currentIdx < filteredCards.length - 1) setCurrentIdx((i) => i + 1);
    }, 300);
  };

  const handleSaveSet = () => {
    if (!cards.length) return;
    const newSet = {
      id: Date.now(),
      name: setName || form.subject || `Flashcard Set ${savedSets.length + 1}`,
      subject: form.subject,
      date: new Date().toLocaleDateString('en-IN'),
      cards,
    };
    const updated = [newSet, ...savedSets].slice(0, 10);
    setSavedSets(updated);
    localStorage.setItem('flashcardSets', JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLoadSet = (set) => {
    setCards(set.cards);
    setCurrentIdx(0);
    setFlipped(false);
    setScore({ known: 0, review: 0 });
    setAnswered(new Set());
    setFilter('all');
    setMode('study');
  };

  const handleDeleteSet = (id, e) => {
    e.stopPropagation();
    const updated = savedSets.filter((s) => s.id !== id);
    setSavedSets(updated);
    localStorage.setItem('flashcardSets', JSON.stringify(updated));
  };

  const resetStudy = () => {
    setCurrentIdx(0);
    setFlipped(false);
    setScore({ known: 0, review: 0 });
    setAnswered(new Set());
    setFilter('all');
  };

  const filteredCards = cards.filter((_, i) => {
    if (filter === 'all') return true;
    // We track which cards were answered as known/review
    return true;
  });

  const progress = cards.length ? Math.round((answered.size / cards.length) * 100) : 0;
  const allDone = answered.size === cards.length && cards.length > 0;

  return (
    <div className="fc-container">
      {/* Header */}
      <div className="fc-header">
        <div className="fc-header-icon">🃏</div>
        <div>
          <h1 className="fc-title">Flashcard Generator</h1>
          <p className="fc-subtitle">Turn your notes into interactive flip flashcards — study smarter, remember longer</p>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="fc-mode-bar">
        {[
          { id: 'generate', icon: '✨', label: 'Generate' },
          { id: 'study',    icon: '📖', label: `Study ${cards.length ? `(${cards.length})` : ''}` },
          { id: 'saved',    icon: '💾', label: `Saved (${savedSets.length})` },
        ].map((m) => (
          <button
            key={m.id}
            className={`fc-mode-btn ${mode === m.id ? 'active' : ''}`}
            onClick={() => setMode(m.id)}
            disabled={m.id === 'study' && !cards.length}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* ── GENERATE MODE ── */}
      {mode === 'generate' && (
        <div className="fc-generate-layout">
          <div className="fc-form-card">
            <div className="fc-field">
              <label className="fc-label">Subject (optional)</label>
              <select className="fc-select" value={form.subject} onChange={(e) => handleChange('subject', e.target.value)}>
                <option value="">-- Select Subject --</option>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="fc-field">
              <label className="fc-label">Number of Cards</label>
              <div className="fc-count-btns">
                {['10', '15', '20', '25'].map((n) => (
                  <button
                    key={n}
                    className={`fc-count-btn ${form.cardCount === n ? 'active' : ''}`}
                    onClick={() => handleChange('cardCount', n)}
                  >{n} cards</button>
                ))}
              </div>
            </div>

            <div className="fc-field">
              <div className="fc-textarea-header">
                <label className="fc-label">Paste Your Content *</label>
                <span className="fc-word-count">{wordCount} words</span>
              </div>
              <textarea
                className="fc-textarea"
                placeholder="Paste your chapter notes, textbook content, lecture slides...&#10;&#10;AI will extract the most important concepts and turn them into flashcards!"
                value={form.content}
                onChange={(e) => handleChange('content', e.target.value)}
                rows={10}
              />
            </div>

            {error && <div className="fc-error">⚠️ {error}</div>}

            <button className="fc-btn-primary" onClick={handleGenerate} disabled={loading}>
              {loading
                ? <><span className="fc-spinner" /> Creating Flashcards...</>
                : <><span>🃏</span> Generate Flashcards</>}
            </button>
          </div>

          {/* Info Panel */}
          <div className="fc-info-panel">
            <div className="fc-info-title">📌 How to use</div>
            <div className="fc-info-steps">
              {[
                { icon: '📋', text: 'Paste your chapter notes or textbook content' },
                { icon: '🤖', text: 'AI extracts key concepts and creates Q&A pairs' },
                { icon: '🃏', text: 'Flip cards to test yourself' },
                { icon: '✅', text: 'Mark as Known or Need Review' },
                { icon: '💾', text: 'Save sets to study again later' },
              ].map((s, i) => (
                <div key={i} className="fc-info-step">
                  <span className="fc-info-icon">{s.icon}</span>
                  <span>{s.text}</span>
                </div>
              ))}
            </div>
            <div className="fc-info-tip">
              💡 <strong>Tip:</strong> For best results, paste 100–500 words of focused content from a single chapter or topic.
            </div>
          </div>
        </div>
      )}

      {/* ── STUDY MODE ── */}
      {mode === 'study' && cards.length > 0 && (
        <div className="fc-study-layout">
          {/* Progress Bar */}
          <div className="fc-progress-bar-wrapper">
            <div className="fc-progress-info">
              <span>{answered.size} / {cards.length} cards done</span>
              <div className="fc-score-pills">
                <span className="fc-pill known">✅ {score.known} Known</span>
                <span className="fc-pill review">🔄 {score.review} Review</span>
              </div>
            </div>
            <div className="fc-progress-track">
              <div className="fc-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Completed State */}
          {allDone ? (
            <div className="fc-complete-card">
              <div className="fc-complete-icon">🎉</div>
              <div className="fc-complete-title">Round Complete!</div>
              <div className="fc-complete-stats">
                <div className="fc-stat-box known">
                  <div className="fc-stat-num">{score.known}</div>
                  <div className="fc-stat-label">Known</div>
                </div>
                <div className="fc-stat-box review">
                  <div className="fc-stat-num">{score.review}</div>
                  <div className="fc-stat-label">Review</div>
                </div>
                <div className="fc-stat-box total">
                  <div className="fc-stat-num">{Math.round((score.known / cards.length) * 100)}%</div>
                  <div className="fc-stat-label">Score</div>
                </div>
              </div>
              <div className="fc-complete-actions">
                <button className="fc-btn-secondary" onClick={resetStudy}>🔄 Study Again</button>
                <div className="fc-save-row">
                  <input
                    className="fc-set-name-input"
                    placeholder="Set name (optional)..."
                    value={setName}
                    onChange={(e) => setSetName(e.target.value)}
                  />
                  <button className="fc-btn-primary small" onClick={handleSaveSet} disabled={saved}>
                    {saved ? '✅ Saved!' : '💾 Save Set'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Navigation */}
              <div className="fc-nav-row">
                <button
                  className="fc-nav-btn"
                  onClick={() => { setCurrentIdx((i) => Math.max(0, i - 1)); setFlipped(false); }}
                  disabled={currentIdx === 0}
                >◀ Prev</button>
                <span className="fc-nav-count">{currentIdx + 1} of {cards.length}</span>
                <button
                  className="fc-nav-btn"
                  onClick={() => { setCurrentIdx((i) => Math.min(cards.length - 1, i + 1)); setFlipped(false); }}
                  disabled={currentIdx === cards.length - 1}
                >Next ▶</button>
              </div>

              {/* Flip Card */}
              <div className="fc-card-scene" onClick={handleFlip}>
                <div className={`fc-card ${flipped ? 'flipped' : ''}`}>
                  {/* Front — Question */}
                  <div className="fc-card-face fc-card-front">
                    <div className="fc-card-label">Question</div>
                    <div className="fc-card-content">{cards[currentIdx]?.question}</div>
                    <div className="fc-card-hint">👆 Click to reveal answer</div>
                    {cards[currentIdx]?.category && (
                      <div className="fc-card-category">{cards[currentIdx].category}</div>
                    )}
                  </div>
                  {/* Back — Answer */}
                  <div className="fc-card-face fc-card-back">
                    <div className="fc-card-label answer-label">Answer</div>
                    <div className="fc-card-content">{cards[currentIdx]?.answer}</div>
                    {cards[currentIdx]?.tip && (
                      <div className="fc-card-tip">💡 {cards[currentIdx].tip}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {flipped && !answered.has(currentIdx) && (
                <div className="fc-answer-btns">
                  <button className="fc-answer-btn review" onClick={() => handleAnswer(false)}>
                    🔄 Need Review
                  </button>
                  <button className="fc-answer-btn known" onClick={() => handleAnswer(true)}>
                    ✅ I Know This!
                  </button>
                </div>
              )}
              {answered.has(currentIdx) && (
                <div className="fc-answered-note">✓ Answered — navigate to continue</div>
              )}

              {/* Card Grid Preview */}
              <div className="fc-card-grid">
                {cards.map((_, i) => (
                  <button
                    key={i}
                    className={`fc-grid-dot ${i === currentIdx ? 'current' : ''} ${answered.has(i) ? 'done' : ''}`}
                    onClick={() => { setCurrentIdx(i); setFlipped(false); }}
                  >{i + 1}</button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── SAVED MODE ── */}
      {mode === 'saved' && (
        <div className="fc-saved-section">
          {savedSets.length === 0 ? (
            <div className="fc-empty-state">
              <div className="fc-empty-icon">📭</div>
              <p className="fc-empty-title">No saved sets yet</p>
              <p className="fc-empty-sub">Generate and save flashcard sets to study them later</p>
              <button className="fc-btn-primary small" onClick={() => setMode('generate')}>
                ✨ Generate Flashcards
              </button>
            </div>
          ) : (
            <div className="fc-saved-grid">
              {savedSets.map((set) => (
                <div key={set.id} className="fc-saved-card" onClick={() => handleLoadSet(set)}>
                  <div className="fc-saved-top">
                    <div className="fc-saved-icon">🃏</div>
                    <button className="fc-delete-btn" onClick={(e) => handleDeleteSet(set.id, e)}>🗑️</button>
                  </div>
                  <div className="fc-saved-name">{set.name}</div>
                  {set.subject && <div className="fc-saved-subject">📚 {set.subject}</div>}
                  <div className="fc-saved-meta">
                    <span>{set.cards.length} cards</span>
                    <span>{set.date}</span>
                  </div>
                  <button className="fc-study-btn">📖 Study Now →</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FlashcardGenerator;
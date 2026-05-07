import React, { useState } from 'react';
import './NotesSummarizer.css';

const SUBJECTS = [
  'Data Structures & Algorithms',
  'Operating Systems',
  'Database Management System',
  'Computer Networks',
  'Object Oriented Programming',
  'Software Engineering',
  'Artificial Intelligence',
  'Machine Learning',
  'Web Development',
  'Data Science',
  'Computer Organization & Architecture',
  'Theory of Computation',
  'Mathematics',
  'Physics',
  'English',
  'Other',
];

const NotesSummarizer = () => {
  const [form, setForm] = useState({ subject: '', notes: '', mode: 'detailed' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [copiedSection, setCopiedSection] = useState('');
  const [savedSubject, setSavedSubject] = useState('');
  const [saved, setSaved] = useState(false);

  const wordCount = form.notes.trim().split(/\s+/).filter(Boolean).length;

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSummarize = async () => {
    if (!form.notes.trim() || wordCount < 30) {
      setError('Please paste at least 30 words of notes to summarize.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    setActiveTab('summary');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/summarizer/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Failed. Try again.'); return; }
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

  const handleSave = () => {
    if (!result) return;
    const existing = JSON.parse(localStorage.getItem('savedNotes') || '[]');
    existing.unshift({
      id: Date.now(),
      subject: savedSubject || form.subject || 'General',
      date: new Date().toLocaleDateString(),
      summary: result.summary,
      keyTerms: result.keyTerms,
      bullets: result.bullets,
    });
    localStorage.setItem('savedNotes', JSON.stringify(existing.slice(0, 20)));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const exportPDF = async () => {
    if (!result) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/summarizer/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...result, subject: form.subject }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Summary_${form.subject || 'Notes'}_${Date.now()}.pdf`;
      a.click();
    } catch {
      alert('PDF export failed. Try again.');
    }
  };

  return (
    <div className="ns-container">
      {/* Header */}
      <div className="ns-header">
        <div className="ns-header-icon">📚</div>
        <div>
          <h1 className="ns-title">Notes Summarizer</h1>
          <p className="ns-subtitle">Paste your long lecture notes — get a clean bullet summary, key terms, and exam points instantly</p>
        </div>
      </div>

      <div className="ns-layout">
        {/* LEFT: Input */}
        <div className="ns-input-panel">
          <div className="ns-form-card">
            {/* Subject */}
            <div className="ns-field">
              <label className="ns-label">Subject (optional)</label>
              <select className="ns-select" value={form.subject} onChange={(e) => handleChange('subject', e.target.value)}>
                <option value="">-- Select Subject --</option>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Mode */}
            <div className="ns-field">
              <label className="ns-label">Summary Mode</label>
              <div className="ns-mode-btns">
                {[
                  { id: 'brief', icon: '⚡', label: 'Brief', desc: 'Quick 5-point summary' },
                  { id: 'detailed', icon: '📋', label: 'Detailed', desc: 'Full structured notes' },
                  { id: 'exam', icon: '🎯', label: 'Exam Ready', desc: 'High-priority exam points' },
                ].map((m) => (
                  <button
                    key={m.id}
                    className={`ns-mode-btn ${form.mode === m.id ? 'active' : ''}`}
                    onClick={() => handleChange('mode', m.id)}
                  >
                    <span className="ns-mode-icon">{m.icon}</span>
                    <span className="ns-mode-label">{m.label}</span>
                    <span className="ns-mode-desc">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes Input */}
            <div className="ns-field">
              <div className="ns-textarea-header">
                <label className="ns-label">Paste Your Notes *</label>
                <span className="ns-word-count">{wordCount} words</span>
              </div>
              <textarea
                className="ns-textarea"
                placeholder="Paste your lecture notes, textbook content, or any long text here...&#10;&#10;Tip: The more content you paste, the better the summary!"
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={14}
              />
            </div>

            {error && <div className="ns-error">⚠️ {error}</div>}

            <button className="ns-btn-primary" onClick={handleSummarize} disabled={loading}>
              {loading
                ? <><span className="ns-spinner" /> Summarizing...</>
                : <><span>✨</span> Summarize Notes</>}
            </button>
          </div>
        </div>

        {/* RIGHT: Output */}
        <div className="ns-output-panel">
          {!result && !loading && (
            <div className="ns-empty-state">
              <div className="ns-empty-icon">📄</div>
              <p className="ns-empty-title">Your summary will appear here</p>
              <p className="ns-empty-sub">Paste your notes on the left and click Summarize</p>
              <div className="ns-tips">
                <div className="ns-tip">📖 Works with textbook content</div>
                <div className="ns-tip">💻 Works with lecture slides text</div>
                <div className="ns-tip">📝 Works with handwritten notes (typed)</div>
              </div>
            </div>
          )}

          {loading && (
            <div className="ns-loading-state">
              <div className="ns-loading-icon">🧠</div>
              <p className="ns-loading-text">Reading and analyzing your notes...</p>
              <div className="ns-loading-steps">
                <div className="ns-loading-step active">📖 Reading content</div>
                <div className="ns-loading-step">🔍 Identifying key concepts</div>
                <div className="ns-loading-step">✍️ Writing summary</div>
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="ns-result">
              {/* Action Bar */}
              <div className="ns-action-bar">
                <div className="ns-result-meta">
                  <span className="ns-result-badge">✅ Summary Ready</span>
                  {form.subject && <span className="ns-result-subject">📚 {form.subject}</span>}
                  <span className="ns-result-reduction">
                    {Math.round((1 - result.summary.split(' ').length / wordCount) * 100)}% shorter
                  </span>
                </div>
                <div className="ns-action-btns">
                  <button className="ns-action-btn" onClick={handleSave} disabled={saved}>
                    {saved ? '✅ Saved!' : '💾 Save'}
                  </button>
                  <button className="ns-action-btn primary" onClick={exportPDF}>
                    📄 Export PDF
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="ns-tabs">
                {[
                  { id: 'summary', label: '📋 Summary' },
                  { id: 'bullets', label: '• Bullet Points' },
                  { id: 'terms', label: '🔑 Key Terms' },
                  { id: 'exam', label: '🎯 Exam Points' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    className={`ns-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="ns-tab-content">
                {/* Summary Tab */}
                {activeTab === 'summary' && (
                  <div className="ns-section">
                    <div className="ns-section-header">
                      <span>📋 Paragraph Summary</span>
                      <button className="ns-copy-btn" onClick={() => copyText(result.summary, 'summary')}>
                        {copiedSection === 'summary' ? '✅ Copied' : '📋 Copy'}
                      </button>
                    </div>
                    <div className="ns-summary-text">{result.summary}</div>
                  </div>
                )}

                {/* Bullet Points Tab */}
                {activeTab === 'bullets' && (
                  <div className="ns-section">
                    <div className="ns-section-header">
                      <span>• Bullet Point Summary</span>
                      <button className="ns-copy-btn" onClick={() => copyText(result.bullets.join('\n'), 'bullets')}>
                        {copiedSection === 'bullets' ? '✅ Copied' : '📋 Copy'}
                      </button>
                    </div>
                    <ul className="ns-bullets-list">
                      {result.bullets.map((b, i) => (
                        <li key={i} className="ns-bullet-item">
                          <span className="ns-bullet-dot">▸</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Key Terms Tab */}
                {activeTab === 'terms' && (
                  <div className="ns-section">
                    <div className="ns-section-header">
                      <span>🔑 Key Terms & Definitions</span>
                      <button
                        className="ns-copy-btn"
                        onClick={() => copyText(result.keyTerms.map((t) => `${t.term}: ${t.definition}`).join('\n'), 'terms')}
                      >
                        {copiedSection === 'terms' ? '✅ Copied' : '📋 Copy'}
                      </button>
                    </div>
                    <div className="ns-terms-grid">
                      {result.keyTerms.map((t, i) => (
                        <div key={i} className="ns-term-card">
                          <div className="ns-term-name">🔑 {t.term}</div>
                          <div className="ns-term-def">{t.definition}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exam Points Tab */}
                {activeTab === 'exam' && (
                  <div className="ns-section">
                    <div className="ns-section-header">
                      <span>🎯 High-Priority Exam Points</span>
                      <button className="ns-copy-btn" onClick={() => copyText(result.examPoints.join('\n'), 'exam')}>
                        {copiedSection === 'exam' ? '✅ Copied' : '📋 Copy'}
                      </button>
                    </div>
                    <div className="ns-exam-points">
                      {result.examPoints.map((p, i) => (
                        <div key={i} className="ns-exam-point">
                          <span className="ns-exam-num">{i + 1}</span>
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                    <div className="ns-exam-tip">
                      💡 These are the points most likely to appear in your exam based on the content provided.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesSummarizer;
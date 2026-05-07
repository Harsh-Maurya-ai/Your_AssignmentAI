import React, { useState } from 'react';
import './VivaPredictor.css';

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
  'Computer Organization & Architecture',
  'Theory of Computation',
  'Compiler Design',
  'Data Science',
  'Mobile Application Development',
  'Cyber Security',
  'Cloud Computing',
];

const DIFFICULTY_COLORS = { Easy: '#22c55e', Medium: '#f59e0b', Hard: '#ef4444' };

const VivaPredictor = () => {
  const [form, setForm] = useState({ subject: '', topic: '', semester: '', difficulty: 'All' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [filterDiff, setFilterDiff] = useState('All');
  const [copiedAll, setCopiedAll] = useState(false);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleGenerate = async () => {
    if (!form.subject.trim()) { setError('Please select or enter a subject.'); return; }
    if (!form.topic.trim()) { setError('Please enter a chapter or topic.'); return; }
    setError('');
    setLoading(true);
    setResult(null);
    setExpandedIdx(null);
    setFilterDiff('All');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/viva/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Failed to generate. Try again.'); return; }
      setResult(data);
    } catch {
      setError('Server error. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = result?.questions?.filter(
    (q) => filterDiff === 'All' || q.difficulty === filterDiff
  ) || [];

  const copyAll = () => {
    const text = result.questions
      .map((q, i) => `Q${i + 1}. [${q.difficulty}] ${q.question}\nA: ${q.answer}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const counts = result
    ? { Easy: result.questions.filter((q) => q.difficulty === 'Easy').length,
        Medium: result.questions.filter((q) => q.difficulty === 'Medium').length,
        Hard: result.questions.filter((q) => q.difficulty === 'Hard').length }
    : {};

  return (
    <div className="viva-container">
      {/* Header */}
      <div className="viva-header">
        <div className="viva-header-icon">🎤</div>
        <div>
          <h1 className="viva-title">Viva Question Predictor</h1>
          <p className="viva-subtitle">Get 25 most likely viva questions with model answers — before your examiner does 😉</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="viva-form-card">
        <div className="viva-form-grid">
          {/* Subject */}
          <div className="viva-field">
            <label className="viva-label">Subject *</label>
            <select
              className="viva-select"
              value={form.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
            >
              <option value="">-- Select Subject --</option>
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              <option value="custom">Other (type below)</option>
            </select>
            {form.subject === 'custom' && (
              <input
                className="viva-input mt-8"
                placeholder="Type your subject name..."
                onChange={(e) => handleChange('subject', e.target.value)}
              />
            )}
          </div>

          {/* Topic */}
          <div className="viva-field">
            <label className="viva-label">Chapter / Topic *</label>
            <input
              className="viva-input"
              placeholder="e.g. Binary Trees, Deadlocks, SQL Joins..."
              value={form.topic}
              onChange={(e) => handleChange('topic', e.target.value)}
            />
          </div>

          {/* Semester */}
          <div className="viva-field">
            <label className="viva-label">Semester (optional)</label>
            <select
              className="viva-select"
              value={form.semester}
              onChange={(e) => handleChange('semester', e.target.value)}
            >
              <option value="">-- Select Semester --</option>
              {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>

          {/* Difficulty Focus */}
          <div className="viva-field">
            <label className="viva-label">Difficulty Focus</label>
            <div className="viva-diff-btns">
              {['All', 'Easy', 'Medium', 'Hard'].map((d) => (
                <button
                  key={d}
                  className={`viva-diff-btn ${form.difficulty === d ? 'active' : ''}`}
                  style={form.difficulty === d && d !== 'All' ? { background: DIFFICULTY_COLORS[d] } : {}}
                  onClick={() => handleChange('difficulty', d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <div className="viva-error">⚠️ {error}</div>}

        <button className="viva-generate-btn" onClick={handleGenerate} disabled={loading}>
          {loading ? (
            <><span className="viva-spinner" /> Predicting Questions...</>
          ) : (
            <><span>🎯</span> Predict Viva Questions</>
          )}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="viva-loading-card">
          <div className="viva-loading-icon">🤔</div>
          <p className="viva-loading-text">AI is analyzing your topic and predicting the most likely questions your examiner will ask...</p>
          <div className="viva-loading-bar"><div className="viva-loading-fill" /></div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="viva-results">
          {/* Stats Bar */}
          <div className="viva-stats-bar">
            <div className="viva-stats-info">
              <span className="viva-stats-title">📋 {result.questions.length} Questions Generated</span>
              <span className="viva-stats-topic">📚 {result.subject} — {result.topic}</span>
            </div>
            <div className="viva-stats-right">
              <div className="viva-diff-counts">
                {['Easy','Medium','Hard'].map((d) => (
                  <span key={d} className="viva-diff-count" style={{ color: DIFFICULTY_COLORS[d] }}>
                    {counts[d]} {d}
                  </span>
                ))}
              </div>
              <button className="viva-copy-all-btn" onClick={copyAll}>
                {copiedAll ? '✅ Copied!' : '📋 Copy All'}
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="viva-filter-tabs">
            {['All', 'Easy', 'Medium', 'Hard'].map((d) => (
              <button
                key={d}
                className={`viva-filter-tab ${filterDiff === d ? 'active' : ''}`}
                style={filterDiff === d && d !== 'All' ? { borderColor: DIFFICULTY_COLORS[d], color: DIFFICULTY_COLORS[d] } : {}}
                onClick={() => setFilterDiff(d)}
              >
                {d} {d !== 'All' ? `(${counts[d]})` : `(${result.questions.length})`}
              </button>
            ))}
          </div>

          {/* Questions List */}
          <div className="viva-questions-list">
            {filtered.map((q, i) => (
              <div
                key={i}
                className={`viva-question-card ${expandedIdx === i ? 'expanded' : ''}`}
                onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
              >
                <div className="viva-q-header">
                  <div className="viva-q-left">
                    <span className="viva-q-number">Q{result.questions.indexOf(q) + 1}</span>
                    <span
                      className="viva-q-badge"
                      style={{ background: DIFFICULTY_COLORS[q.difficulty] + '22', color: DIFFICULTY_COLORS[q.difficulty], border: `1px solid ${DIFFICULTY_COLORS[q.difficulty]}44` }}
                    >
                      {q.difficulty}
                    </span>
                    <span className="viva-q-text">{q.question}</span>
                  </div>
                  <span className="viva-q-chevron">{expandedIdx === i ? '▲' : '▼'}</span>
                </div>

                {expandedIdx === i && (
                  <div className="viva-q-answer">
                    <div className="viva-answer-label">📖 Model Answer:</div>
                    <div className="viva-answer-text">{q.answer}</div>
                    {q.tip && (
                      <div className="viva-answer-tip">
                        <span>💡 Exam Tip:</span> {q.tip}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pro tip box */}
          <div className="viva-pro-tip">
            <span>🏆</span>
            <span>Pro Tip: Read all Hard questions the night before. Easy questions are just confidence boosters — focus on Medium & Hard for maximum marks!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VivaPredictor;
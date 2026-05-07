import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './PYQAnalyzer.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const PROB_COLOR = {
  'Very High': { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626', dot: '#ef4444' },
  'High':      { bg: '#fff7ed', border: '#fed7aa', text: '#ea580c', dot: '#f97316' },
  'Medium':    { bg: '#fefce8', border: '#fde68a', text: '#ca8a04', dot: '#eab308' },
};

const IMP_COLOR = {
  'Very High': '#dc2626',
  'High':      '#ea580c',
  'Medium':    '#ca8a04',
};

const PYQAnalyzer = () => {
  const { token } = useAuth();
  const fileRef = useRef(null);

  const [file, setFile]           = useState(null);
  const [subject, setSubject]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [result, setResult]       = useState(null);
  const [activeTab, setActiveTab] = useState('repeated');
  const [dragOver, setDragOver]   = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf') { setError('Only PDF files are allowed.'); return; }
    if (f.size > 10 * 1024 * 1024)   { setError('File size must be under 10MB.'); return; }
    setFile(f);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  };

  const analyze = async () => {
    if (!file) { setError('Please upload a PYQ PDF first.'); return; }
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('pdf', file);
      if (subject) formData.append('subject', subject);

      const res = await fetch(`${API}/api/pyq/analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); }
      catch { throw new Error('Server error. Make sure backend is running.'); }

      if (!res.ok) throw new Error(data.message || 'Analysis failed.');
      setResult(data);
      setActiveTab('repeated');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (b) => b < 1024 * 1024
    ? `${(b / 1024).toFixed(1)} KB`
    : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="pyq-wrapper">
      {/* Header */}
      <div className="pyq-header">
        <span className="pyq-header-icon">📄</span>
        <div>
          <h1 className="pyq-title">Previous Year Question Analyzer</h1>
          <p className="pyq-subtitle">Upload PYQ PDF → AI finds repeated topics, important chapters & predicts next exam</p>
        </div>
      </div>

      {/* Upload Card */}
      {!result && (
        <div className="pyq-upload-layout">
          <div className="pyq-upload-card">
            {/* Drop zone */}
            <div
              className={`pyq-dropzone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files[0])}
              />
              {file ? (
                <div className="pyq-file-info">
                  <span className="pyq-file-icon">📄</span>
                  <div className="pyq-file-details">
                    <div className="pyq-file-name">{file.name}</div>
                    <div className="pyq-file-size">{formatBytes(file.size)}</div>
                  </div>
                  <button
                    className="pyq-file-remove"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  >✕</button>
                </div>
              ) : (
                <>
                  <div className="pyq-drop-icon">📂</div>
                  <div className="pyq-drop-title">Drop your PYQ PDF here</div>
                  <div className="pyq-drop-sub">or click to browse • PDF only • Max 10MB</div>
                </>
              )}
            </div>

            {/* Subject input */}
            <div className="pyq-field">
              <label className="pyq-label">Subject Name (optional but recommended)</label>
              <input
                className="pyq-input"
                placeholder="e.g. Data Structures, Operating Systems, Mathematics..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {error && <div className="pyq-error">⚠️ {error}</div>}

            <button
              className="pyq-btn-analyze"
              onClick={analyze}
              disabled={loading || !file}
            >
              {loading
                ? <><span className="pyq-spinner" /> Analyzing PYQ Paper...</>
                : <>🔍 Analyze PYQ Paper</>}
            </button>

            {loading && (
              <div className="pyq-loading-steps">
                <div className="pyq-step active">📄 Reading PDF content...</div>
                <div className="pyq-step active">🔍 Finding repeated topics...</div>
                <div className="pyq-step active">📊 Calculating chapter weightage...</div>
                <div className="pyq-step active">🎯 Predicting next exam topics...</div>
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="pyq-info-card">
            <div className="pyq-info-title">📌 How it works</div>
            {[
              { icon: '📥', text: 'Upload your university\'s previous year question paper as PDF' },
              { icon: '🤖', text: 'AI reads and analyzes all questions across years' },
              { icon: '🔁', text: 'Finds topics that repeat every year' },
              { icon: '📊', text: 'Shows chapter-wise marks weightage' },
              { icon: '🎯', text: 'Predicts which topics are most likely in next exam' },
            ].map((s, i) => (
              <div key={i} className="pyq-info-step">
                <span className="pyq-info-icon">{s.icon}</span>
                <span>{s.text}</span>
              </div>
            ))}
            <div className="pyq-info-tip">
              💡 <strong>Best results:</strong> Upload a PDF that contains 3+ years of questions together (combined PYQ PDF). Text-based PDFs work best — scanned image PDFs may not work.
            </div>
            <div className="pyq-info-tip" style={{ marginTop: 10, background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af' }}>
              🎓 <strong>Pro tip:</strong> Search "[Your Subject] PYQ PDF [University Name]" on Google to find combined PYQ PDFs.
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="pyq-result-wrapper">
          {/* Summary bar */}
          <div className="pyq-summary-bar">
            <div className="pyq-summary-item">
              <div className="pyq-summary-num">{result.totalQuestions || '—'}</div>
              <div className="pyq-summary-label">Total Questions</div>
            </div>
            <div className="pyq-summary-item">
              <div className="pyq-summary-num">{result.yearsDetected?.length || '—'}</div>
              <div className="pyq-summary-label">Years Analyzed</div>
            </div>
            <div className="pyq-summary-item">
              <div className="pyq-summary-num">{result.repeatedTopics?.length || '—'}</div>
              <div className="pyq-summary-label">Repeated Topics</div>
            </div>
            <div className="pyq-summary-item">
              <div className="pyq-summary-num">{result.importantChapters?.length || '—'}</div>
              <div className="pyq-summary-label">Key Chapters</div>
            </div>
          </div>

          {/* Must prepare banner */}
          {result.mustPrepareTopic && (
            <div className="pyq-must-banner">
              <span className="pyq-must-fire">🔥</span>
              <div>
                <div className="pyq-must-label">Must Prepare Topic</div>
                <div className="pyq-must-topic">{result.mustPrepareTopic}</div>
              </div>
            </div>
          )}

          {/* Years detected */}
          {result.yearsDetected?.length > 0 && (
            <div className="pyq-years-row">
              <span className="pyq-years-label">Years found:</span>
              {result.yearsDetected.map((y) => (
                <span key={y} className="pyq-year-chip">{y}</span>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="pyq-tabs">
            {[
              { id: 'repeated',   icon: '🔁', label: 'Repeated Topics' },
              { id: 'chapters',   icon: '📚', label: 'Chapter Weightage' },
              { id: 'predicted',  icon: '🎯', label: 'Predicted Topics' },
              { id: 'strategy',   icon: '📋', label: 'Study Strategy' },
            ].map((t) => (
              <button
                key={t.id}
                className={`pyq-tab ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* ── REPEATED TOPICS ── */}
          {activeTab === 'repeated' && (
            <div className="pyq-section">
              <div className="pyq-section-header">
                <h3 className="pyq-section-title">🔁 Repeated Topics</h3>
                <p className="pyq-section-sub">Topics that appeared multiple times across years — highest priority for revision</p>
              </div>
              <div className="pyq-topic-list">
                {(result.repeatedTopics || []).map((t, i) => {
                  const imp = IMP_COLOR[t.importance] || '#64748b';
                  return (
                    <div key={i} className="pyq-topic-card">
                      <div className="pyq-topic-rank">#{i + 1}</div>
                      <div className="pyq-topic-body">
                        <div className="pyq-topic-top">
                          <div className="pyq-topic-name">{t.topic}</div>
                          <div className="pyq-topic-freq">
                            <span className="pyq-freq-badge">{t.frequency}x asked</span>
                            <span className="pyq-imp-badge" style={{ color: imp, background: imp + '18' }}>
                              {t.importance}
                            </span>
                          </div>
                        </div>
                        {t.years?.length > 0 && (
                          <div className="pyq-topic-years">
                            {t.years.map((y) => <span key={y} className="pyq-yr-tag">{y}</span>)}
                          </div>
                        )}
                        {t.tip && <div className="pyq-topic-tip">💡 {t.tip}</div>}
                      </div>
                      {/* Frequency bar */}
                      <div className="pyq-freq-bar-wrap">
                        <div
                          className="pyq-freq-bar"
                          style={{
                            width: `${Math.min(100, (t.frequency / (result.repeatedTopics[0]?.frequency || 1)) * 100)}%`,
                            background: imp,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── CHAPTER WEIGHTAGE ── */}
          {activeTab === 'chapters' && (
            <div className="pyq-section">
              <div className="pyq-section-header">
                <h3 className="pyq-section-title">📚 Chapter-wise Weightage</h3>
                <p className="pyq-section-sub">How much marks each chapter carries based on PYQ analysis</p>
              </div>
              <div className="pyq-chapter-list">
                {(result.importantChapters || []).map((ch, i) => (
                  <div key={i} className="pyq-chapter-card">
                    <div className="pyq-chapter-left">
                      <div className="pyq-chapter-name">{ch.chapter}</div>
                      <div className="pyq-chapter-topics">
                        {(ch.topicsInChapter || []).map((t) => (
                          <span key={t} className="pyq-ch-topic-tag">{t}</span>
                        ))}
                      </div>
                      {ch.likelyMarks && (
                        <div className="pyq-chapter-marks">🎯 {ch.likelyMarks} per exam</div>
                      )}
                    </div>
                    <div className="pyq-chapter-right">
                      <div className="pyq-weightage-circle" style={{
                        background: `conic-gradient(#6366f1 ${ch.weightage * 3.6}deg, #f1f5f9 0deg)`
                      }}>
                        <div className="pyq-weightage-inner">{ch.weightage}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Question type breakdown */}
              {result.questionTypeBreakdown?.length > 0 && (
                <div className="pyq-qtype-section">
                  <h4 className="pyq-qtype-title">📝 Question Type Breakdown</h4>
                  <div className="pyq-qtype-list">
                    {result.questionTypeBreakdown.map((qt, i) => (
                      <div key={i} className="pyq-qtype-item">
                        <div className="pyq-qtype-label">{qt.type}</div>
                        <div className="pyq-qtype-bar-wrap">
                          <div className="pyq-qtype-bar" style={{ width: `${qt.percentage}%` }} />
                        </div>
                        <div className="pyq-qtype-count">{qt.count} Qs ({qt.percentage}%)</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PREDICTED TOPICS ── */}
          {activeTab === 'predicted' && (
            <div className="pyq-section">
              <div className="pyq-section-header">
                <h3 className="pyq-section-title">🎯 Predicted Topics for Next Exam</h3>
                <p className="pyq-section-sub">AI prediction based on frequency patterns and gap analysis</p>
              </div>
              <div className="pyq-pred-list">
                {(result.predictedTopics || []).map((p, i) => {
                  const colors = PROB_COLOR[p.probability] || PROB_COLOR['Medium'];
                  return (
                    <div
                      key={i}
                      className="pyq-pred-card"
                      style={{ background: colors.bg, borderColor: colors.border }}
                    >
                      <div className="pyq-pred-left">
                        <div className="pyq-pred-rank" style={{ background: colors.dot }}>#{i + 1}</div>
                      </div>
                      <div className="pyq-pred-body">
                        <div className="pyq-pred-top">
                          <div className="pyq-pred-topic">{p.topic}</div>
                          <span className="pyq-prob-badge" style={{ color: colors.text, background: colors.border }}>
                            {p.probability} Probability
                          </span>
                        </div>
                        <div className="pyq-pred-reason">📌 {p.reason}</div>
                        {p.suggestedPrep && (
                          <div className="pyq-pred-prep">✏️ <strong>Prep:</strong> {p.suggestedPrep}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STUDY STRATEGY ── */}
          {activeTab === 'strategy' && (
            <div className="pyq-section">
              <div className="pyq-section-header">
                <h3 className="pyq-section-title">📋 AI Study Strategy</h3>
                <p className="pyq-section-sub">Personalized study plan based on this PYQ analysis</p>
              </div>
              <div className="pyq-strategy-list">
                {(result.studyStrategy || []).map((s, i) => (
                  <div key={i} className="pyq-strategy-item">
                    <div className="pyq-strategy-num">{i + 1}</div>
                    <div className="pyq-strategy-text">{s}</div>
                  </div>
                ))}
              </div>

              {/* Full topic priority list */}
              <div className="pyq-priority-section">
                <h4 className="pyq-priority-title">⚡ Your Priority Order for Revision</h4>
                <div className="pyq-priority-list">
                  {(result.repeatedTopics || []).slice(0, 5).map((t, i) => (
                    <div key={i} className="pyq-priority-item">
                      <span className="pyq-priority-num">{i + 1}</span>
                      <span className="pyq-priority-topic">{t.topic}</span>
                      <span className="pyq-priority-freq">{t.frequency}x</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Re-analyze button */}
          <div className="pyq-reanalyze-row">
            <button className="pyq-btn-secondary" onClick={() => { setResult(null); setFile(null); setSubject(''); }}>
              📂 Analyze Another PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PYQAnalyzer;
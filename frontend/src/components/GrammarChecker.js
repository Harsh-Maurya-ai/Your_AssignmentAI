import React, { useState } from 'react';
import './GrammarChecker.css';

const GrammarChecker = () => {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('corrected');
  const [copied, setCopied] = useState(false);

  const wordCount = (text) => (text.trim() === '' ? 0 : text.trim().split(/\s+/).length);

  const handleCheck = async () => {
    if (inputText.trim().length < 10) {
      setError('Please enter at least 10 characters.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    setCopied(false);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/grammar/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: inputText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Something went wrong');
      setResult(data);
      setActiveTab('corrected');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.correctedText) {
      navigator.clipboard.writeText(result.correctedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    return 'Needs Work';
  };

  const issueTypeColor = {
    Grammar: '#ef4444',
    Spelling: '#f59e0b',
    Punctuation: '#8b5cf6',
    Structure: '#3b82f6',
    Tone: '#10b981',
  };

  const formatReadingTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.ceil(seconds / 60)} min`;
  };

  return (
    <div className="grammar-wrapper">
      {/* Header */}
      <div className="grammar-header">
        <div className="grammar-title">
          <span className="grammar-icon">✅</span>
          <div>
            <h2>Grammar & Writing Checker</h2>
            <p>Real-time grammar correction, tone check, and writing improvement</p>
          </div>
        </div>
        <div className="grammar-badge">Replaces Grammarly ✅</div>
      </div>

      {/* Main Layout */}
      <div className="grammar-layout">
        {/* Left: Input */}
        <div className="grammar-input-panel">
          <div className="panel-header">
            <span>Your Text</span>
            <span className="word-count">{wordCount(inputText)} words</span>
          </div>
          <textarea
            className="grammar-textarea"
            placeholder="Paste or type your text here to check grammar, tone, and writing quality..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={14}
          />
          {error && <div className="grammar-error">⚠️ {error}</div>}
          <button
            className="check-btn"
            onClick={handleCheck}
            disabled={loading || inputText.trim().length < 10}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="spinner" /> Checking...
              </span>
            ) : (
              <>✅ Check Grammar & Tone</>
            )}
          </button>
        </div>

        {/* Right: Results */}
        <div className="grammar-result-panel">
          {!result && !loading && (
            <div className="result-placeholder">
              <span>📝</span>
              <p>Results will appear here after checking</p>
            </div>
          )}

          {loading && (
            <div className="result-placeholder">
              <div className="loading-spinner" />
              <p>Analyzing your text...</p>
            </div>
          )}

          {result && (
            <>
              {/* Score Cards */}
              <div className="score-cards">
                <div className="score-card main-score">
                  <div
                    className="score-circle"
                    style={{ borderColor: getScoreColor(result.overallScore) }}
                  >
                    <span
                      className="score-number"
                      style={{ color: getScoreColor(result.overallScore) }}
                    >
                      {result.overallScore}
                    </span>
                    <span className="score-max">/100</span>
                  </div>
                  <div className="score-label">{getScoreLabel(result.overallScore)}</div>
                </div>
                <div className="score-card">
                  <div className="card-icon">🎭</div>
                  <div className="card-value">{result.tone}</div>
                  <div className="card-label">Tone</div>
                </div>
                <div className="score-card">
                  <div className="card-icon">📝</div>
                  <div className="card-value">{result.wordCount}</div>
                  <div className="card-label">Words</div>
                </div>
                <div className="score-card">
                  <div className="card-icon">⏱️</div>
                  <div className="card-value">{formatReadingTime(result.readingTimeSeconds)}</div>
                  <div className="card-label">Read Time</div>
                </div>
                <div className="score-card">
                  <div className="card-icon">🔴</div>
                  <div className="card-value">{result.issues?.length || 0}</div>
                  <div className="card-label">Issues</div>
                </div>
              </div>

              {/* Tabs */}
              <div className="result-tabs">
                <button
                  className={`tab-btn ${activeTab === 'corrected' ? 'active' : ''}`}
                  onClick={() => setActiveTab('corrected')}
                >
                  ✏️ Corrected Text
                </button>
                <button
                  className={`tab-btn ${activeTab === 'issues' ? 'active' : ''}`}
                  onClick={() => setActiveTab('issues')}
                >
                  🔴 Issues ({result.issues?.length || 0})
                </button>
                <button
                  className={`tab-btn ${activeTab === 'tips' ? 'active' : ''}`}
                  onClick={() => setActiveTab('tips')}
                >
                  💡 Writing Tips
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {activeTab === 'corrected' && (
                  <div className="corrected-section">
                    <div className="corrected-text">{result.correctedText}</div>
                    <div className="corrected-actions">
                      <button className="copy-btn" onClick={handleCopy}>
                        {copied ? '✅ Copied!' : '📋 Copy Corrected Text'}
                      </button>
                      <button
                        className="recheck-btn"
                        onClick={() => {
                          setInputText(result.correctedText);
                          setResult(null);
                        }}
                      >
                        🔁 Re-check
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'issues' && (
                  <div className="issues-section">
                    {result.issues?.length === 0 ? (
                      <div className="no-issues">
                        <span>🎉</span>
                        <p>No issues found! Your text looks great.</p>
                      </div>
                    ) : (
                      result.issues.map((issue, i) => (
                        <div className="issue-card" key={i}>
                          <div className="issue-header">
                            <span
                              className="issue-type"
                              style={{
                                background: `${issueTypeColor[issue.type] || '#6366f1'}20`,
                                color: issueTypeColor[issue.type] || '#6366f1',
                              }}
                            >
                              {issue.type}
                            </span>
                          </div>
                          <div className="issue-body">
                            <div className="issue-row">
                              <span className="issue-label">❌ Original:</span>
                              <span className="issue-original">"{issue.original}"</span>
                            </div>
                            <div className="issue-row">
                              <span className="issue-label">✅ Fix:</span>
                              <span className="issue-fix">"{issue.suggestion}"</span>
                            </div>
                            <div className="issue-explanation">{issue.explanation}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'tips' && (
                  <div className="tips-section">
                    {result.suggestions?.map((tip, i) => (
                      <div className="tip-card" key={i}>
                        <span className="tip-number">{i + 1}</span>
                        <p>{tip}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GrammarChecker;
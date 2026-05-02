import React, { useState } from 'react';
import './CodeExplainer.css';

const LANGUAGES = ['Auto-detect', 'C', 'C++', 'Java', 'Python', 'JavaScript', 'SQL', 'HTML/CSS'];

const CodeExplainer = () => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('Auto-detect');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const handleExplain = async () => {
    if (code.trim().length < 5) {
      setError('Please paste some code first.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/code-explainer/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code, language }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Something went wrong');
      setResult(data);
      setActiveTab('overview');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCode('');
    setResult(null);
    setError('');
  };

  return (
    <div className="ce-wrapper">
      {/* Header */}
      <div className="ce-header">
        <div className="ce-title">
          <span className="ce-icon">💻</span>
          <div>
            <h2>Code Explainer</h2>
            <p>Paste any code — get line-by-line explanation + viva questions</p>
          </div>
        </div>
        <div className="ce-badge">Perfect for Viva Prep 🎤</div>
      </div>

      <div className="ce-layout">
        {/* Left: Input */}
        <div className="ce-input-panel">

          {/* Language Selector */}
          <div className="ce-section-label">Language</div>
          <div className="ce-lang-selector">
            {LANGUAGES.map((l) => (
              <button
                key={l}
                className={`ce-lang-btn ${language === l ? 'active' : ''}`}
                onClick={() => setLanguage(l)}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Code Input */}
          <div className="ce-section-label" style={{ marginTop: '14px' }}>
            Paste Your Code
            <span className="ce-line-count">
              {code.trim() === '' ? 0 : code.trim().split('\n').length} lines
            </span>
          </div>
          <textarea
            className="ce-textarea"
            placeholder={`// Paste your ${language === 'Auto-detect' ? '' : language} code here...\n// Example:\nint main() {\n    printf("Hello World");\n    return 0;\n}`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={16}
            spellCheck={false}
          />

          {error && <div className="ce-error">⚠️ {error}</div>}

          <div className="ce-form-actions">
            <button
              className="ce-explain-btn"
              onClick={handleExplain}
              disabled={loading || code.trim().length < 5}
            >
              {loading ? (
                <span className="btn-loading"><span className="spinner" /> Explaining...</span>
              ) : (
                <>💡 Explain This Code</>
              )}
            </button>
            {code && (
              <button className="ce-clear-btn" onClick={handleClear}>Clear</button>
            )}
          </div>
        </div>

        {/* Right: Result */}
        <div className="ce-result-panel">
          {!result && !loading && (
            <div className="ce-placeholder">
              <span>🔍</span>
              <p>Paste your code and click Explain</p>
              <ul className="ce-features-list">
                <li>📋 Line-by-line explanation</li>
                <li>🧠 Key concepts used</li>
                <li>🎤 Viva questions with answers</li>
                <li>🇮🇳 Simple Hindi+English summary</li>
              </ul>
            </div>
          )}

          {loading && (
            <div className="ce-placeholder">
              <div className="ce-loading-spinner" />
              <p>Analyzing your code...</p>
            </div>
          )}

          {result && (
            <>
              {/* Detected Language Tag */}
              <div className="ce-result-meta">
                <span className="ce-lang-tag">🔤 {result.language}</span>
                <span className="ce-lines-tag">{result.lineByLine?.length} lines explained</span>
              </div>

              {/* Tabs */}
              <div className="ce-tabs">
                <button className={`ce-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>📋 Overview</button>
                <button className={`ce-tab ${activeTab === 'lines' ? 'active' : ''}`} onClick={() => setActiveTab('lines')}>🔍 Line by Line</button>
                <button className={`ce-tab ${activeTab === 'viva' ? 'active' : ''}`} onClick={() => setActiveTab('viva')}>🎤 Viva Q&A</button>
                <button className={`ce-tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>🇮🇳 Simple Summary</button>
              </div>

              {/* Tab Content */}
              <div className="ce-tab-content">

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="ce-overview">
                    <div className="ce-overview-box">
                      <div className="ce-box-label">What this code does</div>
                      <p className="ce-overview-text">{result.overview}</p>
                    </div>
                    {result.keyConceptsUsed?.length > 0 && (
                      <div className="ce-concepts">
                        <div className="ce-box-label">Key Concepts Used</div>
                        <div className="ce-concept-tags">
                          {result.keyConceptsUsed.map((c, i) => (
                            <span key={i} className="ce-concept-tag">{c}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Line by Line Tab */}
                {activeTab === 'lines' && (
                  <div className="ce-lines">
                    {result.lineByLine?.map((item, i) => (
                      <div className="ce-line-card" key={i}>
                        <div className="ce-line-header">
                          <span className="ce-line-number">Line {item.lineNumber}</span>
                          <code className="ce-line-code">{item.line}</code>
                        </div>
                        <p className="ce-line-explanation">{item.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Viva Q&A Tab */}
                {activeTab === 'viva' && (
                  <div className="ce-viva">
                    {result.vivaQuestions?.map((q, i) => (
                      <div className="ce-viva-card" key={i}>
                        <div className="ce-viva-q">
                          <span className="ce-q-label">Q{i + 1}</span>
                          <p>{q.question}</p>
                        </div>
                        <div className="ce-viva-a">
                          <span className="ce-a-label">Ans</span>
                          <p>{q.answer}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Simple Summary Tab */}
                {activeTab === 'summary' && (
                  <div className="ce-summary">
                    <div className="ce-summary-box">
                      <div className="ce-box-label">🇮🇳 Hinglish Summary (Easy to Remember)</div>
                      <p className="ce-summary-text">{result.simpleSummary}</p>
                    </div>
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

export default CodeExplainer;
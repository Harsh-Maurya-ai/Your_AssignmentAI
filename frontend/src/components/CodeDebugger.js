import React, { useState } from 'react';
import './CodeDebugger.css';

const LANGUAGES = ['Auto-detect', 'C', 'C++', 'Java', 'Python', 'JavaScript', 'SQL'];

const severityConfig = {
  Critical: { color: '#ef4444', bg: '#fee2e2', icon: '🔴' },
  Warning:  { color: '#f59e0b', bg: '#fef3c7', icon: '🟡' },
  Suggestion: { color: '#3b82f6', bg: '#eff6ff', icon: '🔵' },
};

const CodeDebugger = () => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('Auto-detect');
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('bugs');
  const [copiedFixed, setCopiedFixed] = useState(false);

  const handleDebug = async () => {
    if (code.trim().length < 5) {
      setError('Please paste some code first.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/code-debugger/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code, language, errorMessage }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Something went wrong');
      setResult(data);
      setActiveTab('bugs');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyFixed = () => {
    if (result?.fixedCode) {
      navigator.clipboard.writeText(result.fixedCode);
      setCopiedFixed(true);
      setTimeout(() => setCopiedFixed(false), 2000);
    }
  };

  const handleClear = () => {
    setCode('');
    setErrorMessage('');
    setResult(null);
    setError('');
  };

  const criticalCount = result?.bugs?.filter(b => b.severity === 'Critical').length || 0;
  const warningCount = result?.bugs?.filter(b => b.severity === 'Warning').length || 0;
  const suggestionCount = result?.bugs?.filter(b => b.severity === 'Suggestion').length || 0;

  return (
    <div className="cd-wrapper">
      {/* Header */}
      <div className="cd-header">
        <div className="cd-title">
          <span className="cd-icon">🐛</span>
          <div>
            <h2>Code Debugger</h2>
            <p>Paste buggy code — get fixed code with detailed explanation</p>
          </div>
        </div>
        <div className="cd-badge">Finds & Fixes Bugs 🔧</div>
      </div>

      <div className="cd-layout">
        {/* Left: Input */}
        <div className="cd-input-panel">

          {/* Language Selector */}
          <div className="cd-section-label">Language</div>
          <div className="cd-lang-selector">
            {LANGUAGES.map((l) => (
              <button
                key={l}
                className={`cd-lang-btn ${language === l ? 'active' : ''}`}
                onClick={() => setLanguage(l)}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Code Input */}
          <div className="cd-section-label" style={{ marginTop: '14px' }}>
            Paste Buggy Code
            <span className="cd-line-count">
              {code.trim() === '' ? 0 : code.trim().split('\n').length} lines
            </span>
          </div>
          <textarea
            className="cd-textarea"
            placeholder={`// Paste your buggy code here...\n// Example:\nint main() {\n    int x = 10\n    printf("%d", x)  // missing semicolons\n    return 0\n}`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={12}
            spellCheck={false}
          />

          {/* Optional Error Message */}
          <div className="cd-section-label" style={{ marginTop: '12px' }}>
            Error Message (Optional)
          </div>
          <input
            className="cd-error-input"
            placeholder="Paste the error/exception you are getting e.g. NullPointerException, segmentation fault..."
            value={errorMessage}
            onChange={(e) => setErrorMessage(e.target.value)}
          />

          {error && <div className="cd-error-box">⚠️ {error}</div>}

          <div className="cd-form-actions">
            <button
              className="cd-debug-btn"
              onClick={handleDebug}
              disabled={loading || code.trim().length < 5}
            >
              {loading ? (
                <span className="btn-loading"><span className="spinner" /> Debugging...</span>
              ) : (
                <>🔍 Find & Fix Bugs</>
              )}
            </button>
            {code && (
              <button className="cd-clear-btn" onClick={handleClear}>Clear</button>
            )}
          </div>
        </div>

        {/* Right: Result */}
        <div className="cd-result-panel">
          {!result && !loading && (
            <div className="cd-placeholder">
              <span>🐛</span>
              <p>Paste your buggy code and click Debug</p>
              <ul className="cd-features-list">
                <li>🔴 Finds all bugs with line numbers</li>
                <li>✅ Shows complete fixed code</li>
                <li>📖 Explains what was wrong</li>
                <li>💡 Prevention tips included</li>
              </ul>
            </div>
          )}

          {loading && (
            <div className="cd-placeholder">
              <div className="cd-loading-spinner" />
              <p>Analyzing bugs in your code...</p>
            </div>
          )}

          {result && (
            <>
              {/* Status Banner */}
              <div className={`cd-status-banner ${result.hasErrors ? 'has-errors' : 'no-errors'}`}>
                {result.hasErrors ? (
                  <>
                    <span>🐛 Found {result.bugs?.length} issue{result.bugs?.length !== 1 ? 's' : ''} in your {result.language} code</span>
                    <div className="cd-severity-counts">
                      {criticalCount > 0 && <span className="sev-tag critical">🔴 {criticalCount} Critical</span>}
                      {warningCount > 0 && <span className="sev-tag warning">🟡 {warningCount} Warning</span>}
                      {suggestionCount > 0 && <span className="sev-tag suggestion">🔵 {suggestionCount} Suggestion</span>}
                    </div>
                  </>
                ) : (
                  <span>✅ No bugs found! Your {result.language} code looks correct.</span>
                )}
              </div>

              {/* Tabs */}
              <div className="cd-tabs">
                <button className={`cd-tab ${activeTab === 'bugs' ? 'active' : ''}`} onClick={() => setActiveTab('bugs')}>
                  🐛 Bugs ({result.bugs?.length || 0})
                </button>
                <button className={`cd-tab ${activeTab === 'fixed' ? 'active' : ''}`} onClick={() => setActiveTab('fixed')}>
                  ✅ Fixed Code
                </button>
                <button className={`cd-tab ${activeTab === 'explanation' ? 'active' : ''}`} onClick={() => setActiveTab('explanation')}>
                  📖 Explanation
                </button>
              </div>

              {/* Tab Content */}
              <div className="cd-tab-content">

                {/* Bugs Tab */}
                {activeTab === 'bugs' && (
                  <div className="cd-bugs">
                    {result.bugs?.length === 0 ? (
                      <div className="cd-no-bugs">
                        <span>🎉</span>
                        <p>No bugs found! Your code is correct.</p>
                      </div>
                    ) : (
                      result.bugs.map((bug, i) => {
                        const sev = severityConfig[bug.severity] || severityConfig['Suggestion'];
                        return (
                          <div className="cd-bug-card" key={i} style={{ borderLeftColor: sev.color }}>
                            <div className="cd-bug-header">
                              <span className="cd-bug-line">Line {bug.lineNumber}</span>
                              <span
                                className="cd-bug-severity"
                                style={{ background: sev.bg, color: sev.color }}
                              >
                                {sev.icon} {bug.severity}
                              </span>
                            </div>
                            <div className="cd-bug-row">
                              <span className="cd-bug-label">❌ Buggy:</span>
                              <code className="cd-buggy-code">{bug.buggyLine}</code>
                            </div>
                            <div className="cd-bug-row">
                              <span className="cd-bug-label">✅ Fixed:</span>
                              <code className="cd-fixed-code">{bug.fix}</code>
                            </div>
                            <p className="cd-bug-issue">{bug.issue}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Fixed Code Tab */}
                {activeTab === 'fixed' && (
                  <div className="cd-fixed-section">
                    <div className="cd-fixed-header">
                      <span>Complete Fixed Code</span>
                      <button className="cd-copy-btn" onClick={handleCopyFixed}>
                        {copiedFixed ? '✅ Copied!' : '📋 Copy Code'}
                      </button>
                    </div>
                    <pre className="cd-fixed-pre"><code>{result.fixedCode}</code></pre>
                  </div>
                )}

                {/* Explanation Tab */}
                {activeTab === 'explanation' && (
                  <div className="cd-explanation">
                    <div className="cd-exp-box">
                      <div className="cd-box-label">📖 What Was Wrong & What Was Fixed</div>
                      <p className="cd-exp-text">{result.explanation}</p>
                    </div>
                    <div className="cd-tip-box">
                      <div className="cd-box-label">💡 Prevention Tip</div>
                      <p className="cd-tip-text">{result.preventionTip}</p>
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

export default CodeDebugger;
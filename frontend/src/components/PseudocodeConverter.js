import React, { useState } from 'react';
import './PseudocodeConverter.css';

const LANGUAGES = ['Auto-detect', 'C', 'C++', 'Java', 'Python', 'JavaScript', 'SQL'];

const PseudocodeConverter = () => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('Auto-detect');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pseudocode');
  const [copiedPseudo, setCopiedPseudo] = useState(false);
  const [copiedAlgo, setCopiedAlgo] = useState(false);

  const handleConvert = async () => {
    if (code.trim().length < 5) {
      setError('Please paste some code first.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/pseudocode/convert', {
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
      setActiveTab('pseudocode');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPseudo = () => {
    if (result?.pseudocode) {
      navigator.clipboard.writeText(result.pseudocode);
      setCopiedPseudo(true);
      setTimeout(() => setCopiedPseudo(false), 2000);
    }
  };

  const handleCopyAlgo = () => {
    if (result?.algorithm) {
      navigator.clipboard.writeText(result.algorithm.join('\n'));
      setCopiedAlgo(true);
      setTimeout(() => setCopiedAlgo(false), 2000);
    }
  };

  const handleClear = () => {
    setCode('');
    setResult(null);
    setError('');
  };

  return (
    <div className="pc-wrapper">
      {/* Header */}
      <div className="pc-header">
        <div className="pc-title">
          <span className="pc-icon">📐</span>
          <div>
            <h2>Code to Pseudocode Converter</h2>
            <p>Convert any code to pseudocode + algorithm steps + flowchart description</p>
          </div>
        </div>
        <div className="pc-badge">Perfect for Exams 📝</div>
      </div>

      <div className="pc-layout">
        {/* Left: Input */}
        <div className="pc-input-panel">

          {/* Language Selector */}
          <div className="pc-section-label">Language</div>
          <div className="pc-lang-selector">
            {LANGUAGES.map((l) => (
              <button
                key={l}
                className={`pc-lang-btn ${language === l ? 'active' : ''}`}
                onClick={() => setLanguage(l)}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Code Input */}
          <div className="pc-section-label" style={{ marginTop: '14px' }}>
            Paste Your Code
            <span className="pc-line-count">
              {code.trim() === '' ? 0 : code.trim().split('\n').length} lines
            </span>
          </div>
          <textarea
            className="pc-textarea"
            placeholder={`// Paste your code here...\n// Example:\nfor(int i=0; i<n; i++) {\n    sum += arr[i];\n}\nprintf("%d", sum);`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={14}
            spellCheck={false}
          />

          {error && <div className="pc-error">⚠️ {error}</div>}

          <div className="pc-form-actions">
            <button
              className="pc-convert-btn"
              onClick={handleConvert}
              disabled={loading || code.trim().length < 5}
            >
              {loading ? (
                <span className="btn-loading"><span className="spinner" /> Converting...</span>
              ) : (
                <>📐 Convert to Pseudocode</>
              )}
            </button>
            {code && (
              <button className="pc-clear-btn" onClick={handleClear}>Clear</button>
            )}
          </div>
        </div>

        {/* Right: Result */}
        <div className="pc-result-panel">
          {!result && !loading && (
            <div className="pc-placeholder">
              <span>📐</span>
              <p>Paste your code and click Convert</p>
              <ul className="pc-features-list">
                <li>📋 Clean university-standard pseudocode</li>
                <li>🔢 Numbered algorithm steps</li>
                <li>🔷 Flowchart description</li>
                <li>⚡ Time & Space complexity</li>
              </ul>
            </div>
          )}

          {loading && (
            <div className="pc-placeholder">
              <div className="pc-loading-spinner" />
              <p>Converting your code...</p>
            </div>
          )}

          {result && (
            <>
              {/* Detected Language */}
              <div className="pc-result-meta">
                <span className="pc-lang-tag">🔤 {result.language}</span>
                {result.complexity && (
                  <>
                    <span className="pc-complexity-tag">⏱ Time: {result.complexity.time}</span>
                    <span className="pc-complexity-tag">💾 Space: {result.complexity.space}</span>
                  </>
                )}
              </div>

              {/* Tabs */}
              <div className="pc-tabs">
                <button className={`pc-tab ${activeTab === 'pseudocode' ? 'active' : ''}`} onClick={() => setActiveTab('pseudocode')}>
                  📋 Pseudocode
                </button>
                <button className={`pc-tab ${activeTab === 'algorithm' ? 'active' : ''}`} onClick={() => setActiveTab('algorithm')}>
                  🔢 Algorithm
                </button>
                <button className={`pc-tab ${activeTab === 'flowchart' ? 'active' : ''}`} onClick={() => setActiveTab('flowchart')}>
                  🔷 Flowchart
                </button>
                <button className={`pc-tab ${activeTab === 'complexity' ? 'active' : ''}`} onClick={() => setActiveTab('complexity')}>
                  ⚡ Complexity
                </button>
              </div>

              {/* Tab Content */}
              <div className="pc-tab-content">

                {/* Pseudocode Tab */}
                {activeTab === 'pseudocode' && (
                  <div className="pc-pseudo-section">
                    <div className="pc-pseudo-header">
                      <span>Pseudocode Output</span>
                      <button className="pc-copy-btn" onClick={handleCopyPseudo}>
                        {copiedPseudo ? '✅ Copied!' : '📋 Copy'}
                      </button>
                    </div>
                    <pre className="pc-pseudo-pre">{result.pseudocode}</pre>
                  </div>
                )}

                {/* Algorithm Tab */}
                {activeTab === 'algorithm' && (
                  <div className="pc-algo-section">
                    <div className="pc-pseudo-header">
                      <span>Algorithm Steps</span>
                      <button className="pc-copy-btn" onClick={handleCopyAlgo}>
                        {copiedAlgo ? '✅ Copied!' : '📋 Copy All'}
                      </button>
                    </div>
                    <div className="pc-algo-steps">
                      {result.algorithm?.map((step, i) => (
                        <div className="pc-algo-step" key={i}>
                          <span className="pc-step-number">{i + 1}</span>
                          <p>{step.replace(/^Step\s*\d+[:.]\s*/i, '')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flowchart Tab */}
                {activeTab === 'flowchart' && (
                  <div className="pc-flowchart-section">
                    <div className="pc-flowchart-legend">
                      <span className="pc-legend-item"><span className="pc-shape oval">Oval</span> Start / End</span>
                      <span className="pc-legend-item"><span className="pc-shape rect">Rect</span> Process</span>
                      <span className="pc-legend-item"><span className="pc-shape diamond">◆</span> Decision</span>
                    </div>
                    <div className="pc-flowchart-box">
                      <div className="pc-flowchart-label">Flowchart Description</div>
                      <p className="pc-flowchart-text">{result.flowchartDescription}</p>
                    </div>
                    <div className="pc-flowchart-tip">
                      💡 Use this description to draw the flowchart in your exam or use tools like draw.io
                    </div>
                  </div>
                )}

                {/* Complexity Tab */}
                {activeTab === 'complexity' && (
                  <div className="pc-complexity-section">
                    <div className="pc-complexity-cards">
                      <div className="pc-complexity-card time">
                        <div className="pc-comp-icon">⏱️</div>
                        <div className="pc-comp-label">Time Complexity</div>
                        <div className="pc-comp-value">{result.complexity?.time}</div>
                      </div>
                      <div className="pc-complexity-card space">
                        <div className="pc-comp-icon">💾</div>
                        <div className="pc-comp-label">Space Complexity</div>
                        <div className="pc-comp-value">{result.complexity?.space}</div>
                      </div>
                    </div>
                    <div className="pc-complexity-exp">
                      <div className="pc-flowchart-label">Explanation</div>
                      <p>{result.complexity?.explanation}</p>
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

export default PseudocodeConverter;
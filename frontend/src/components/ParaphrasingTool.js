import React, { useState } from 'react';
import './ParaphrasingTool.css';

const ParaphrasingTool = () => {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState('standard');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const modes = [
    { id: 'standard', label: 'Standard', icon: '🔄', desc: 'Natural rewrite, same meaning' },
    { id: 'academic', label: 'Academic', icon: '🎓', desc: 'Formal, university-level tone' },
    { id: 'simplify', label: 'Simplify', icon: '✨', desc: 'Easy, simple language' },
  ];

  const wordCount = (text) => text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

  const handleParaphrase = async () => {
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
      const res = await fetch('http://localhost:5000/api/paraphrase/paraphrase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: inputText, mode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Something went wrong');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.paraphrased) {
      navigator.clipboard.writeText(result.paraphrased);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setInputText('');
    setResult(null);
    setError('');
    setCopied(false);
  };

  return (
    <div className="para-wrapper">
      {/* Header */}
      <div className="para-header">
        <div className="para-title">
          <span className="para-icon">🔄</span>
          <div>
            <h2>Paraphrasing Tool</h2>
            <p>Rewrite any text in seconds — Standard, Academic, or Simplified</p>
          </div>
        </div>
        <div className="para-badge">Replaces Quillbot ✅</div>
      </div>

      {/* Mode Selector */}
      <div className="para-modes">
        {modes.map((m) => (
          <button
            key={m.id}
            className={`mode-btn ${mode === m.id ? 'active' : ''}`}
            onClick={() => setMode(m.id)}
          >
            <span className="mode-icon">{m.icon}</span>
            <div className="mode-text">
              <span className="mode-label">{m.label}</span>
              <span className="mode-desc">{m.desc}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Input / Output Area */}
      <div className="para-editor">
        {/* Left: Input */}
        <div className="para-panel">
          <div className="panel-header">
            <span>Original Text</span>
            <div className="panel-actions">
              <span className="word-count">{wordCount(inputText)} words</span>
              {inputText && (
                <button className="clear-btn" onClick={handleClear}>
                  Clear
                </button>
              )}
            </div>
          </div>
          <textarea
            className="para-textarea"
            placeholder="Paste your text here... (minimum 10 characters)"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={12}
          />
          {error && <div className="para-error">⚠️ {error}</div>}
          <button
            className="paraphrase-btn"
            onClick={handleParaphrase}
            disabled={loading || inputText.trim().length < 10}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="spinner" /> Paraphrasing...
              </span>
            ) : (
              <>🔄 Paraphrase Now</>
            )}
          </button>
        </div>

        {/* Divider Arrow */}
        <div className="para-divider">
          {loading ? <div className="divider-spinner" /> : <span>→</span>}
        </div>

        {/* Right: Output */}
        <div className="para-panel">
          <div className="panel-header">
            <span>Paraphrased Text</span>
            <div className="panel-actions">
              {result && (
                <>
                  <span className="word-count">{result.newWordCount} words</span>
                  <span className="change-badge">~{result.changePercent}% changed</span>
                </>
              )}
            </div>
          </div>
          <div className={`para-output ${!result ? 'empty' : ''}`}>
            {result ? (
              <p>{result.paraphrased}</p>
            ) : (
              <div className="output-placeholder">
                <span>✨</span>
                <p>Your paraphrased text will appear here</p>
              </div>
            )}
          </div>
          {result && (
            <div className="output-actions">
              <button className="copy-btn" onClick={handleCopy}>
                {copied ? '✅ Copied!' : '📋 Copy Text'}
              </button>
              <button
                className="use-btn"
                onClick={() => {
                  setInputText(result.paraphrased);
                  setResult(null);
                }}
              >
                🔁 Re-paraphrase
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      {result && (
        <div className="para-stats">
          <div className="stat">
            <span className="stat-label">Mode Used</span>
            <span className="stat-value">
              {modes.find((m) => m.id === result.mode)?.icon}{' '}
              {modes.find((m) => m.id === result.mode)?.label}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Original Words</span>
            <span className="stat-value">{result.originalWordCount}</span>
          </div>
          <div className="stat">
            <span className="stat-label">New Words</span>
            <span className="stat-value">{result.newWordCount}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Change</span>
            <span className="stat-value change">~{result.changePercent}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParaphrasingTool;
import React, { useState } from 'react';
import './CitationGenerator.css';

const CitationGenerator = () => {
  const [sourceType, setSourceType] = useState('Website');
  const [format, setFormat] = useState('APA');
  const [fields, setFields] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [copiedInText, setCopiedInText] = useState(false);
  const [savedCitations, setSavedCitations] = useState([]);

  const sourceTypes = ['Website', 'Book', 'Journal', 'YouTube', 'Newspaper', 'Research Paper'];
  const formats = ['APA', 'MLA', 'IEEE', 'Chicago'];

  const fieldConfig = {
    Website: ['title', 'author', 'year', 'url', 'accessed'],
    Book: ['title', 'author', 'year', 'publisher', 'pages'],
    Journal: ['title', 'author', 'year', 'journal', 'volume', 'issue', 'pages'],
    YouTube: ['title', 'author', 'year', 'url', 'accessed'],
    Newspaper: ['title', 'author', 'year', 'journal', 'pages'],
    'Research Paper': ['title', 'author', 'year', 'journal', 'volume', 'issue', 'pages', 'url'],
  };

  const fieldLabels = {
    title: 'Title *',
    author: 'Author(s)',
    year: 'Year',
    url: 'URL / Link',
    accessed: 'Date Accessed',
    publisher: 'Publisher',
    journal: 'Journal / Publisher Name',
    volume: 'Volume',
    issue: 'Issue',
    pages: 'Pages (e.g. 12-25)',
  };

  const fieldPlaceholders = {
    title: 'Enter the title of the source',
    author: 'e.g. Sharma, R. or John Smith',
    year: 'e.g. 2023',
    url: 'https://...',
    accessed: 'e.g. 1 May 2025',
    publisher: 'e.g. Oxford University Press',
    journal: 'e.g. IEEE Transactions on...',
    volume: 'e.g. 12',
    issue: 'e.g. 3',
    pages: 'e.g. 45-67',
  };

  const handleField = (key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    if (!fields.title?.trim()) {
      setError('Title is required.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/citation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sourceType, format, ...fields }),
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

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'citation') {
      setCopiedCitation(true);
      setTimeout(() => setCopiedCitation(false), 2000);
    } else {
      setCopiedInText(true);
      setTimeout(() => setCopiedInText(false), 2000);
    }
  };

  const handleSave = () => {
    if (result && !savedCitations.find((c) => c.citation === result.citation)) {
      setSavedCitations((prev) => [result, ...prev]);
    }
  };

  const handleRemoveSaved = (index) => {
    setSavedCitations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClear = () => {
    setFields({});
    setResult(null);
    setError('');
  };

  return (
    <div className="citation-wrapper">
      {/* Header */}
      <div className="citation-header">
        <div className="citation-title">
          <span className="citation-icon">📖</span>
          <div>
            <h2>Citation & Reference Generator</h2>
            <p>Generate APA, MLA, IEEE, Chicago citations instantly</p>
          </div>
        </div>
        <div className="citation-badge">Free Forever ✅</div>
      </div>

      <div className="citation-layout">
        {/* Left: Form */}
        <div className="citation-form-panel">

          {/* Format Selector */}
          <div className="section-label">Citation Format</div>
          <div className="format-selector">
            {formats.map((f) => (
              <button
                key={f}
                className={`format-btn ${format === f ? 'active' : ''}`}
                onClick={() => setFormat(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Source Type Selector */}
          <div className="section-label" style={{ marginTop: '16px' }}>Source Type</div>
          <div className="source-selector">
            {sourceTypes.map((s) => (
              <button
                key={s}
                className={`source-btn ${sourceType === s ? 'active' : ''}`}
                onClick={() => { setSourceType(s); setFields({}); setResult(null); }}
              >
                {s === 'Website' && '🌐'}
                {s === 'Book' && '📚'}
                {s === 'Journal' && '📄'}
                {s === 'YouTube' && '▶️'}
                {s === 'Newspaper' && '📰'}
                {s === 'Research Paper' && '🔬'}
                {' '}{s}
              </button>
            ))}
          </div>

          {/* Dynamic Fields */}
          <div className="citation-fields">
            {fieldConfig[sourceType]?.map((key) => (
              <div className="field-group" key={key}>
                <label className="field-label">{fieldLabels[key]}</label>
                <input
                  className="field-input"
                  type="text"
                  placeholder={fieldPlaceholders[key]}
                  value={fields[key] || ''}
                  onChange={(e) => handleField(key, e.target.value)}
                />
              </div>
            ))}
          </div>

          {error && <div className="citation-error">⚠️ {error}</div>}

          <div className="form-actions">
            <button
              className="generate-btn"
              onClick={handleGenerate}
              disabled={loading || !fields.title?.trim()}
            >
              {loading ? (
                <span className="btn-loading"><span className="spinner" /> Generating...</span>
              ) : (
                <>📖 Generate Citation</>
              )}
            </button>
            <button className="clear-btn" onClick={handleClear}>Clear</button>
          </div>
        </div>

        {/* Right: Result + Saved */}
        <div className="citation-right">

          {/* Result Box */}
          <div className="citation-result-box">
            <div className="result-box-header">
              <span>Generated Citation</span>
              {result && (
                <span className="format-tag">{result.format} • {result.sourceType}</span>
              )}
            </div>

            {!result && !loading && (
              <div className="result-empty">
                <span>📋</span>
                <p>Fill the form and click Generate</p>
              </div>
            )}

            {loading && (
              <div className="result-empty">
                <div className="loading-spinner" />
                <p>Generating citation...</p>
              </div>
            )}

            {result && (
              <div className="result-content">
                {/* Full Citation */}
                <div className="citation-block">
                  <div className="citation-block-label">Full Reference</div>
                  <div className="citation-text">{result.citation}</div>
                  <div className="citation-actions">
                    <button className="copy-btn" onClick={() => handleCopy(result.citation, 'citation')}>
                      {copiedCitation ? '✅ Copied!' : '📋 Copy'}
                    </button>
                    <button className="save-btn" onClick={handleSave}>
                      💾 Save
                    </button>
                  </div>
                </div>

                {/* In-Text Citation */}
                <div className="citation-block intext">
                  <div className="citation-block-label">In-Text Citation</div>
                  <div className="citation-text intext-text">{result.inText}</div>
                  <button className="copy-btn small" onClick={() => handleCopy(result.inText, 'intext')}>
                    {copiedInText ? '✅ Copied!' : '📋 Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Saved Citations Library */}
          {savedCitations.length > 0 && (
            <div className="saved-citations">
              <div className="saved-header">
                <span>💾 Saved Citations ({savedCitations.length})</span>
                <button className="copy-all-btn" onClick={() => {
                  navigator.clipboard.writeText(savedCitations.map((c, i) => `[${i + 1}] ${c.citation}`).join('\n\n'));
                }}>
                  📋 Copy All
                </button>
              </div>
              <div className="saved-list">
                {savedCitations.map((c, i) => (
                  <div className="saved-item" key={i}>
                    <div className="saved-item-meta">
                      <span className="saved-format">{c.format}</span>
                      <span className="saved-type">{c.sourceType}</span>
                    </div>
                    <div className="saved-item-text">{c.citation}</div>
                    <div className="saved-item-actions">
                      <button className="copy-btn small" onClick={() => handleCopy(c.citation, 'citation')}>
                        📋 Copy
                      </button>
                      <button className="remove-btn" onClick={() => handleRemoveSaved(i)}>
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CitationGenerator;
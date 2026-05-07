import React, { useState } from 'react';
import './ReadmeGenerator.css';

const TECH_OPTIONS = [
  'React', 'Node.js', 'Express', 'MongoDB', 'MySQL', 'PostgreSQL',
  'Python', 'Django', 'Flask', 'Java', 'Spring Boot', 'PHP',
  'Laravel', 'Vue.js', 'Angular', 'TypeScript', 'Next.js', 'Firebase',
  'Docker', 'AWS', 'Tailwind CSS', 'Bootstrap', 'Redux', 'GraphQL',
];

const ReadmeGenerator = () => {
  const [form, setForm] = useState({
    projectName: '',
    description: '',
    techStack: [],
    customTech: '',
    features: '',
    installation: '',
    githubUsername: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [copied, setCopied] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTech = (tech) => {
    setForm((prev) => ({
      ...prev,
      techStack: prev.techStack.includes(tech)
        ? prev.techStack.filter((t) => t !== tech)
        : [...prev.techStack, tech],
    }));
  };

  const handleGenerate = async () => {
    if (!form.projectName.trim() || form.projectName.trim().length < 2) {
      setError('Please enter the project name.');
      return;
    }
    if (!form.description.trim() || form.description.trim().length < 10) {
      setError('Please write a short project description (min 10 characters).');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    const allTech = [
      ...form.techStack,
      ...(form.customTech ? form.customTech.split(',').map((t) => t.trim()).filter(Boolean) : []),
    ].join(', ');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/readme/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectName: form.projectName,
          description: form.description,
          techStack: allTech,
          features: form.features,
          installation: form.installation,
          githubUsername: form.githubUsername,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Something went wrong');
      setResult(data);
      setActiveTab('preview');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setForm({
      projectName: '', description: '', techStack: [], customTech: '',
      features: '', installation: '', githubUsername: '',
    });
    setResult(null);
    setError('');
  };

  const handleCopy = () => {
    if (result?.readmeMarkdown) {
      navigator.clipboard.writeText(result.readmeMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!result?.readmeMarkdown) return;
    const blob = new Blob([result.readmeMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderMarkdownPreview = (md) => {
    if (!md) return '';
    return md
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" style="max-width:100%;height:auto;" />')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
      .replace(/^---$/gm, '<hr/>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
      .replace(/\n\n/g, '<br/><br/>');
  };

  return (
    <div className="rg-wrapper">
      {/* Header */}
      <div className="rg-header">
        <div className="rg-title">
          <span className="rg-icon">📋</span>
          <div>
            <h2>GitHub README Generator</h2>
            <p>Professional README.md for your projects — one click copy</p>
          </div>
        </div>
        <div className="rg-badge">⭐ Impress Recruiters</div>
      </div>

      <div className="rg-layout">
        {/* Left: Form */}
        <div className="rg-input-panel">

          <div className="rg-field">
            <label className="rg-label">Project Name <span className="rg-req">*</span></label>
            <input
              className="rg-input"
              type="text"
              placeholder="e.g. AssignmentAI, Zerodha Clone, Chat App"
              value={form.projectName}
              onChange={(e) => handleChange('projectName', e.target.value)}
            />
          </div>

          <div className="rg-field">
            <label className="rg-label">GitHub Username</label>
            <div className="rg-prefix-wrap">
              <span className="rg-prefix">github.com/</span>
              <input
                className="rg-prefix-input"
                type="text"
                placeholder="your-username"
                value={form.githubUsername}
                onChange={(e) => handleChange('githubUsername', e.target.value)}
              />
            </div>
          </div>

          <div className="rg-field">
            <label className="rg-label">Project Description <span className="rg-req">*</span></label>
            <textarea
              className="rg-textarea"
              placeholder="What does your project do? Who is it for? What problem does it solve?"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="rg-field">
            <label className="rg-label">Tech Stack <span className="rg-hint">(click to select)</span></label>
            <div className="rg-tech-grid">
              {TECH_OPTIONS.map((tech) => (
                <button
                  key={tech}
                  className={`rg-tech-btn ${form.techStack.includes(tech) ? 'active' : ''}`}
                  onClick={() => toggleTech(tech)}
                >
                  {tech}
                </button>
              ))}
            </div>
            <input
              className="rg-input"
              type="text"
              placeholder="Other tech (comma separated): Redis, Socket.io..."
              value={form.customTech}
              onChange={(e) => handleChange('customTech', e.target.value)}
              style={{ marginTop: '8px' }}
            />
          </div>

          <div className="rg-field">
            <label className="rg-label">Key Features <span className="rg-hint">(one per line)</span></label>
            <textarea
              className="rg-textarea"
              placeholder={`User Authentication with JWT\nAI Assignment Generator\nExport as PDF and Word\nMobile Responsive UI`}
              value={form.features}
              onChange={(e) => handleChange('features', e.target.value)}
              rows={4}
            />
          </div>

          <div className="rg-field">
            <label className="rg-label">Installation Steps <span className="rg-hint">(optional)</span></label>
            <textarea
              className="rg-textarea"
              placeholder={`npm install\nnpm start`}
              value={form.installation}
              onChange={(e) => handleChange('installation', e.target.value)}
              rows={3}
            />
          </div>

          {error && <div className="rg-error">⚠️ {error}</div>}

          <div className="rg-actions">
            <button className="rg-generate-btn" onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <span className="rg-btn-loading"><span className="rg-spinner" /> Generating README...</span>
              ) : (
                <>📋 Generate README.md</>
              )}
            </button>
            {(result || form.projectName) && (
              <button className="rg-clear-btn" onClick={handleClear}>Clear</button>
            )}
          </div>

          {!result && !loading && (
            <div className="rg-features-box">
              <div className="rg-features-title">What you'll get:</div>
              {['🏷️ Title with emoji & badges', '📝 Professional description',
                '✨ Features list with emojis', '⚙️ Tech stack section',
                '💻 Installation & usage guide', '📁 Project structure tree',
                '🤝 Contributing guidelines', '📄 License section'].map((f) => (
                <div key={f} className="rg-feature-item">{f}</div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Result */}
        <div className="rg-result-panel">
          {!result && !loading && (
            <div className="rg-placeholder">
              <span className="rg-ph-icon">📋</span>
              <p>Fill the form and generate your README</p>
              <p className="rg-ph-sub">Copy directly to your GitHub repository</p>
            </div>
          )}

          {loading && (
            <div className="rg-placeholder">
              <div className="rg-spinner-lg" />
              <p>Writing your README...</p>
              <p className="rg-ph-sub">This may take 10–15 seconds</p>
            </div>
          )}

          {result && (
            <>
              <div className="rg-result-header">
                <div className="rg-result-meta">
                  <span className="rg-proj-emoji">{result.projectEmoji || '🚀'}</span>
                  <span className="rg-proj-name">{form.projectName}</span>
                  {result.suggestedLicense && (
                    <span className="rg-license-badge">{result.suggestedLicense} License</span>
                  )}
                </div>
                <div className="rg-result-btns">
                  <button className={`rg-copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
                    {copied ? '✅ Copied!' : '📋 Copy README'}
                  </button>
                  <button className="rg-download-btn" onClick={handleDownload}>
                    ⬇️ Download .md
                  </button>
                </div>
              </div>

              <div className="rg-tabs">
                <button className={`rg-tab ${activeTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveTab('preview')}>
                  👁️ Preview
                </button>
                <button className={`rg-tab ${activeTab === 'raw' ? 'active' : ''}`} onClick={() => setActiveTab('raw')}>
                  📝 Raw Markdown
                </button>
              </div>

              <div className="rg-tab-content">
                {activeTab === 'preview' && (
                  <div
                    className="rg-preview"
                    dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(result.readmeMarkdown) }}
                  />
                )}
                {activeTab === 'raw' && (
                  <div className="rg-raw-wrap">
                    <div className="rg-raw-hint">
                      📌 Copy this and paste into your GitHub repository's README.md file
                    </div>
                    <pre className="rg-raw-pre">{result.readmeMarkdown}</pre>
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

export default ReadmeGenerator;
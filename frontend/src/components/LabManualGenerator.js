import React, { useState } from 'react';
import './LabManualGenerator.css';

const LANGUAGES = ['C', 'C++', 'Java', 'Python', 'JavaScript', 'SQL'];
const SUBJECTS = [
  'Data Structures',
  'Operating Systems',
  'Computer Networks',
  'Database Management',
  'Object Oriented Programming',
  'Design & Analysis of Algorithms',
  'Compiler Design',
  'Computer Graphics',
  'Microprocessors',
  'Software Engineering',
  'Other',
];

const TABS = [
  { id: 'aim', label: '🎯 Aim & Objective' },
  { id: 'theory', label: '📖 Theory' },
  { id: 'algorithm', label: '⚙️ Algorithm' },
  { id: 'code', label: '💻 Code' },
  { id: 'output', label: '🖥️ Output' },
  { id: 'result', label: '✅ Result' },
  { id: 'viva', label: '🎤 Viva Q&A' },
];

const LabManualGenerator = () => {
  const [form, setForm] = useState({
    experimentName: '',
    aim: '',
    subject: 'Data Structures',
    language: 'C',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('aim');
  const [copied, setCopied] = useState('');

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    if (!form.experimentName.trim() || form.experimentName.trim().length < 3) {
      setError('Please enter the experiment name.');
      return;
    }
    if (!form.aim.trim() || form.aim.trim().length < 5) {
      setError('Please enter the aim of the experiment.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/lab-manual/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Something went wrong');
      setResult(data);
      setActiveTab('aim');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setForm({ experimentName: '', aim: '', subject: 'Data Structures', language: 'C' });
    setResult(null);
    setError('');
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const buildFullManualText = () => {
    if (!result) return '';
    return `
${result.experimentNo || 'Experiment'}
EXPERIMENT NAME: ${result.experimentName}

AIM:
${result.aim}

OBJECTIVES:
${result.objective?.map((o, i) => `${i + 1}. ${o}`).join('\n')}

THEORY:
${result.theory}

ALGORITHM:
${result.algorithm?.join('\n')}

FLOWCHART DESCRIPTION:
${result.flowchartDescription}

CODE (${form.language}):
${result.code}

CODE EXPLANATION:
${result.codeExplanation}

SAMPLE OUTPUT:
${result.sampleOutput}

RESULT:
${result.result}

CONCLUSION:
${result.conclusion}

PRECAUTIONS:
${result.precautions?.map((p, i) => `${i + 1}. ${p}`).join('\n')}

VIVA QUESTIONS:
${result.vivaQuestions?.map((q, i) => `Q${i + 1}. ${q.question}\nAns: ${q.answer}`).join('\n\n')}
    `.trim();
  };

  return (
    <div className="lm-wrapper">
      {/* Header */}
      <div className="lm-header">
        <div className="lm-title">
          <span className="lm-icon">🔬</span>
          <div>
            <h2>Lab Manual Generator</h2>
            <p>Complete university-format lab manual in seconds</p>
          </div>
        </div>
        <div className="lm-badge">🎓 University Ready</div>
      </div>

      <div className="lm-layout">
        {/* Left: Input Form */}
        <div className="lm-input-panel">

          {/* Experiment Name */}
          <div className="lm-field">
            <label className="lm-label">Experiment Name <span className="lm-required">*</span></label>
            <input
              className="lm-input"
              type="text"
              placeholder="e.g. Implement Stack using Array"
              value={form.experimentName}
              onChange={(e) => handleChange('experimentName', e.target.value)}
            />
          </div>

          {/* Aim */}
          <div className="lm-field">
            <label className="lm-label">Aim / Objective <span className="lm-required">*</span></label>
            <textarea
              className="lm-textarea"
              placeholder="e.g. To implement and demonstrate the working of stack data structure using arrays in C language"
              value={form.aim}
              onChange={(e) => handleChange('aim', e.target.value)}
              rows={4}
            />
          </div>

          {/* Subject */}
          <div className="lm-field">
            <label className="lm-label">Subject</label>
            <select
              className="lm-select"
              value={form.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div className="lm-field">
            <label className="lm-label">Programming Language</label>
            <div className="lm-lang-grid">
              {LANGUAGES.map((l) => (
                <button
                  key={l}
                  className={`lm-lang-btn ${form.language === l ? 'active' : ''}`}
                  onClick={() => handleChange('language', l)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="lm-error">⚠️ {error}</div>}

          <div className="lm-actions">
            <button
              className="lm-generate-btn"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading"><span className="lm-spinner" /> Generating Manual...</span>
              ) : (
                <>🔬 Generate Lab Manual</>
              )}
            </button>
            {(result || form.experimentName) && (
              <button className="lm-clear-btn" onClick={handleClear}>Clear</button>
            )}
          </div>

          {!result && !loading && (
            <div className="lm-preview-list">
              <div className="lm-preview-title">What you'll get:</div>
              {['✅ Aim & Objectives', '📖 Detailed Theory', '⚙️ Step-by-step Algorithm',
                '💻 Complete Working Code', '🖥️ Expected Output', '📊 Flowchart Description',
                '✅ Result & Conclusion', '⚠️ Precautions', '🎤 5 Viva Questions with Answers'].map((f) => (
                <div key={f} className="lm-preview-item">{f}</div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Result */}
        <div className="lm-result-panel">
          {!result && !loading && (
            <div className="lm-placeholder">
              <span className="lm-placeholder-icon">🔬</span>
              <p>Fill the form and generate your lab manual</p>
              <p className="lm-placeholder-sub">Export as PDF or Word after generating</p>
            </div>
          )}

          {loading && (
            <div className="lm-placeholder">
              <div className="lm-loading-spinner" />
              <p>Generating your lab manual...</p>
              <p className="lm-placeholder-sub">This may take 10–15 seconds</p>
            </div>
          )}

          {result && (
            <>
              <div className="lm-result-header">
                <div className="lm-result-title">
                  <span className="lm-exp-badge">{result.experimentNo || 'Experiment'}</span>
                  <span className="lm-exp-name">{result.experimentName}</span>
                </div>
                <button
                  className={`lm-copy-all-btn ${copied === 'all' ? 'copied' : ''}`}
                  onClick={() => copyToClipboard(buildFullManualText(), 'all')}
                >
                  {copied === 'all' ? '✅ Copied!' : '📋 Copy Full Manual'}
                </button>
              </div>

              <div className="lm-tabs">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    className={`lm-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="lm-tab-content">

                {activeTab === 'aim' && (
                  <div className="lm-section">
                    <div className="lm-section-block">
                      <div className="lm-block-label">🎯 Aim</div>
                      <p className="lm-text">{result.aim}</p>
                    </div>
                    <div className="lm-section-block">
                      <div className="lm-block-label">📌 Objectives</div>
                      <ol className="lm-obj-list">
                        {result.objective?.map((obj, i) => (
                          <li key={i}>{obj}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}

                {activeTab === 'theory' && (
                  <div className="lm-section">
                    <div className="lm-section-block">
                      <div className="lm-block-header">
                        <div className="lm-block-label">📖 Theory</div>
                        <button
                          className={`lm-copy-btn ${copied === 'theory' ? 'copied' : ''}`}
                          onClick={() => copyToClipboard(result.theory, 'theory')}
                        >
                          {copied === 'theory' ? '✅ Copied' : '📋 Copy'}
                        </button>
                      </div>
                      <p className="lm-text lm-theory-text">{result.theory}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'algorithm' && (
                  <div className="lm-section">
                    <div className="lm-section-block">
                      <div className="lm-block-label">⚙️ Algorithm</div>
                      <ol className="lm-algo-list">
                        {result.algorithm?.map((step, i) => (
                          <li key={i} className="lm-algo-step">{step.replace(/^Step \d+:\s*/i, '')}</li>
                        ))}
                      </ol>
                    </div>
                    <div className="lm-section-block">
                      <div className="lm-block-label">📊 Flowchart Description</div>
                      <div className="lm-flowchart-box">
                        <p className="lm-text">{result.flowchartDescription}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'code' && (
                  <div className="lm-section">
                    <div className="lm-section-block">
                      <div className="lm-block-header">
                        <div className="lm-block-label">💻 Code ({form.language})</div>
                        <button
                          className={`lm-copy-btn ${copied === 'code' ? 'copied' : ''}`}
                          onClick={() => copyToClipboard(result.code, 'code')}
                        >
                          {copied === 'code' ? '✅ Copied' : '📋 Copy Code'}
                        </button>
                      </div>
                      <pre className="lm-code-block">{result.code}</pre>
                    </div>
                    <div className="lm-section-block">
                      <div className="lm-block-label">🧠 Code Explanation</div>
                      <p className="lm-text">{result.codeExplanation}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'output' && (
                  <div className="lm-section">
                    <div className="lm-section-block">
                      <div className="lm-block-label">🖥️ Sample Output</div>
                      <pre className="lm-output-block">{result.sampleOutput}</pre>
                    </div>
                  </div>
                )}

                {activeTab === 'result' && (
                  <div className="lm-section">
                    <div className="lm-section-block">
                      <div className="lm-block-label">✅ Result</div>
                      <p className="lm-text">{result.result}</p>
                    </div>
                    <div className="lm-section-block">
                      <div className="lm-block-label">📝 Conclusion</div>
                      <p className="lm-text">{result.conclusion}</p>
                    </div>
                    {result.precautions?.length > 0 && (
                      <div className="lm-section-block">
                        <div className="lm-block-label">⚠️ Precautions</div>
                        <ul className="lm-precaution-list">
                          {result.precautions.map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'viva' && (
                  <div className="lm-section">
                    <div className="lm-viva-intro">🎤 5 Most Likely Viva Questions for this Experiment</div>
                    {result.vivaQuestions?.map((q, i) => (
                      <div className="lm-viva-card" key={i}>
                        <div className="lm-viva-q">
                          <span className="lm-q-num">Q{i + 1}</span>
                          <p>{q.question}</p>
                        </div>
                        <div className="lm-viva-a">
                          <span className="lm-a-label">Ans</span>
                          <p>{q.answer}</p>
                        </div>
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

export default LabManualGenerator;
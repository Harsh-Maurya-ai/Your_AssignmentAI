import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ExportButtons from './ExportButtons';
import './AssignmentGenerator.css';

const FORMATS = ['Essay', 'Report', 'Case Study', 'Technical'];
const WORD_COUNTS = ['500', '800', '1000', '1500', '2000', '3000'];

const AssignmentGenerator = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    topic: '',
    subject: '',
    wordCount: '1000',
    universityName: '',
    format: 'Essay',
    studentName: user?.name || '',
    rollNumber: '',
  });
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [limitReached, setLimitReached] = useState(false);
  const [usageInfo, setUsageInfo] = useState(null);
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState('form');
  const [assignmentId, setAssignmentId] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleGenerate = async () => {
    if (!form.topic.trim()) return setError('Please enter a topic.');
    if (!form.subject.trim()) return setError('Please enter a subject.');

    setLoading(true);
    setError('');
    setLimitReached(false);
    setOutput('');

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/assignment/generate',
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOutput(res.data.content);
      setAssignmentId(res.data.assignmentId);
      setGenerated(true);
      setStep('result');
      if (res.data.usageCount !== null) {
        setUsageInfo({ used: res.data.usageCount, limit: res.data.usageLimit });
      }
    } catch (err) {
      if (err.response?.data?.limitReached) {
        setLimitReached(true);
        setError('');
      } else {
        setError(err.response?.data?.message || 'Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setStep('form');
    setOutput('');
    setGenerated(false);
    setError('');
    setAssignmentId(null);
    setForm(prev => ({ ...prev, topic: '', subject: '' }));
  };

  const wordCountActual = output.split(/\s+/).filter(Boolean).length;
  const charCount = output.length;

  return (
    <div className="ag-container">

      {/* Header */}
      <div className="ag-header">
        <div className="ag-header-left">
          <div className="ag-icon-wrap">📝</div>
          <div>
            <h1 className="ag-title">Assignment Generator</h1>
            <p className="ag-subtitle">AI-powered academic writing for Indian universities</p>
          </div>
        </div>
        {user?.plan === 'free' && usageInfo && (
          <div className="ag-usage-chip">{usageInfo.used}/{usageInfo.limit} uses today</div>
        )}
        {user?.plan === 'pro' && (
          <div className="ag-pro-chip">⭐ Pro — Unlimited</div>
        )}
      </div>

      {/* Step indicator */}
      <div className="ag-steps">
        <div className={`ag-step ${step === 'form' ? 'active' : generated ? 'done' : ''}`}>
          <span className="ag-step-num">{generated ? '✓' : '1'}</span>
          <span>Fill Details</span>
        </div>
        <div className="ag-step-line" />
        <div className={`ag-step ${step === 'result' ? 'active' : ''}`}>
          <span className="ag-step-num">2</span>
          <span>Generated Content</span>
        </div>
      </div>

      {/* FORM VIEW */}
      {step === 'form' && (
        <div className="ag-form-card">

          <div className="ag-field-group">
            <label className="ag-label">Assignment Format</label>
            <div className="ag-format-tabs">
              {FORMATS.map(f => (
                <button
                  key={f}
                  className={`ag-format-tab ${form.format === f ? 'selected' : ''}`}
                  onClick={() => setForm({ ...form, format: f })}
                >
                  {f === 'Essay' && '📄'}
                  {f === 'Report' && '📊'}
                  {f === 'Case Study' && '🔍'}
                  {f === 'Technical' && '⚙️'}
                  {' '}{f}
                </button>
              ))}
            </div>
          </div>

          <div className="ag-grid-2">
            <div className="ag-field-group">
              <label className="ag-label">Topic <span className="ag-required">*</span></label>
              <input
                className="ag-input"
                name="topic"
                value={form.topic}
                onChange={handleChange}
                placeholder="e.g. Impact of AI in Healthcare"
              />
            </div>
            <div className="ag-field-group">
              <label className="ag-label">Subject <span className="ag-required">*</span></label>
              <input
                className="ag-input"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="e.g. Computer Science, BCA, MBA"
              />
            </div>
          </div>

          <div className="ag-field-group">
            <label className="ag-label">Word Count</label>
            <div className="ag-wc-tabs">
              {WORD_COUNTS.map(wc => (
                <button
                  key={wc}
                  className={`ag-wc-tab ${form.wordCount === wc ? 'selected' : ''}`}
                  onClick={() => setForm({ ...form, wordCount: wc })}
                >
                  {wc}
                </button>
              ))}
            </div>
          </div>

          <div className="ag-optional-label">Optional Details (for cover page)</div>
          <div className="ag-grid-3">
            <div className="ag-field-group">
              <label className="ag-label">University Name</label>
              <input
                className="ag-input"
                name="universityName"
                value={form.universityName}
                onChange={handleChange}
                placeholder="e.g. MDU Rohtak"
              />
            </div>
            <div className="ag-field-group">
              <label className="ag-label">Your Name</label>
              <input
                className="ag-input"
                name="studentName"
                value={form.studentName}
                onChange={handleChange}
                placeholder="Student name"
              />
            </div>
            <div className="ag-field-group">
              <label className="ag-label">Roll Number</label>
              <input
                className="ag-input"
                name="rollNumber"
                value={form.rollNumber}
                onChange={handleChange}
                placeholder="e.g. 21BCA001"
              />
            </div>
          </div>

          {error && <div className="ag-error">⚠️ {error}</div>}

          {limitReached && (
            <div className="ag-limit-banner">
              <div className="ag-limit-text">
                <span className="ag-limit-icon">🔒</span>
                <div>
                  <strong>Daily limit reached (3/3)</strong>
                  <p>Upgrade to Pro for unlimited assignments — only ₹79/month</p>
                </div>
              </div>
              <button className="ag-upgrade-btn">⭐ Upgrade to Pro</button>
            </div>
          )}

          {!limitReached && (
            <button
              className={`ag-generate-btn ${loading ? 'loading' : ''}`}
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <span className="ag-spinner-row">
                  <span className="ag-spinner" />
                  Generating with Groq AI...
                </span>
              ) : (
                '✨ Generate Assignment'
              )}
            </button>
          )}

          {loading && (
            <div className="ag-loading-steps">
              <div className="ag-loading-step">🧠 Understanding your topic...</div>
              <div className="ag-loading-step">✍️ Writing academic content...</div>
              <div className="ag-loading-step">📚 Adding references...</div>
            </div>
          )}
        </div>
      )}

      {/* RESULT VIEW */}
      {step === 'result' && (
        <div className="ag-result-card">
          <div className="ag-result-header">
            <div className="ag-result-meta">
              <span className="ag-meta-chip">📝 {form.format}</span>
              <span className="ag-meta-chip">📚 {form.subject}</span>
              <span className="ag-meta-chip">~{wordCountActual} words</span>
            </div>
            <div className="ag-result-actions">
              <button className="ag-action-btn" onClick={handleCopy}>
                {copied ? '✅ Copied!' : '📋 Copy All'}
              </button>
              <button className="ag-action-btn secondary" onClick={handleReset}>
                🔄 New Assignment
              </button>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="ag-export-row">
            <ExportButtons
              assignmentId={assignmentId}
              content={output}
              form={{ ...form, content: output }}
            />
          </div>

          <textarea
            className="ag-output"
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            spellCheck={false}
          />

          <div className="ag-output-footer">
            <span>✏️ You can edit the content above before exporting</span>
            <span>{wordCountActual} words · {charCount} characters</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentGenerator;
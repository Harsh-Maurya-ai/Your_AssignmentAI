import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './MCQPractice.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SUBJECTS = [
  'Data Structures & Algorithms', 'Operating Systems', 'Database Management System',
  'Computer Networks', 'Object Oriented Programming', 'Software Engineering',
  'Artificial Intelligence', 'Machine Learning', 'Mathematics', 'Physics',
  'Chemistry', 'English', 'Economics', 'History', 'Other',
];

const DIFFICULTIES = ['Mixed', 'Easy', 'Medium', 'Hard'];
const COUNTS = ['10', '15', '20', '25', '30'];

const OPTION_COLORS = {
  correct: { bg: '#f0fdf4', border: '#22c55e', text: '#16a34a', badge: '#dcfce7' },
  wrong:   { bg: '#fef2f2', border: '#ef4444', text: '#dc2626', badge: '#fee2e2' },
  neutral: { bg: '#f8fafc', border: '#e2e8f0', text: '#374151', badge: '#f1f5f9' },
};

const MCQPractice = () => {
  const { token } = useAuth();

  // Form
  const [subject, setSubject]     = useState('');
  const [topic, setTopic]         = useState('');
  const [difficulty, setDifficulty] = useState('Mixed');
  const [count, setCount]         = useState('20');

  // Quiz state
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [mode, setMode]           = useState('setup'); // setup | quiz | result

  // Answer tracking
  const [selected, setSelected]   = useState({}); // { qIndex: 'A' }
  const [submitted, setSubmitted] = useState({}); // { qIndex: true }
  const [current, setCurrent]     = useState(0);
  const [quizDone, setQuizDone]   = useState(false);

  // Weak topics tracking
  const [weakTopics, setWeakTopics] = useState([]);

  const generate = async () => {
    if (!topic.trim()) { setError('Please enter a topic or chapter.'); return; }
    setError('');
    setLoading(true);
    setQuestions([]);
    setSelected({});
    setSubmitted({});
    setCurrent(0);
    setQuizDone(false);

    try {
      const res = await fetch(`${API}/api/mcq/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject, topic, difficulty, count }),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); }
      catch { throw new Error('Server error. Make sure backend is running.'); }
      if (!res.ok) throw new Error(data.message || 'Failed to generate.');
      setQuestions(data.questions);
      setMode('quiz');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (qIdx, option) => {
    if (submitted[qIdx]) return; // already answered
    setSelected((s) => ({ ...s, [qIdx]: option }));
  };

  const handleSubmitAnswer = (qIdx) => {
    if (!selected[qIdx]) return;
    setSubmitted((s) => ({ ...s, [qIdx]: true }));
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      // finish
      finishQuiz();
    }
  };

  const handlePrev = () => setCurrent((c) => Math.max(0, c - 1));

  const finishQuiz = () => {
    // find weak topics = questions answered wrong
    const wrong = questions.filter((q, i) => submitted[i] && selected[i] !== q.correct);
    const unique = [...new Set(wrong.map((q) => q.difficulty))];
    setWeakTopics(unique);
    setQuizDone(true);
    setMode('result');
  };

  // Scores
  const answeredCount = Object.keys(submitted).length;
  const correctCount  = questions.filter((q, i) => submitted[i] && selected[i] === q.correct).length;
  const wrongCount    = answeredCount - correctCount;
  const skippedCount  = questions.length - answeredCount;
  const percent       = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;

  const getOptionState = (qIdx, opt) => {
    if (!submitted[qIdx]) return selected[qIdx] === opt ? 'selected' : 'neutral';
    if (opt === questions[qIdx].correct) return 'correct';
    if (opt === selected[qIdx]) return 'wrong';
    return 'neutral';
  };

  const q = questions[current];

  return (
    <div className="mcq-wrapper">
      {/* Header */}
      <div className="mcq-header">
        <span className="mcq-header-icon">❓</span>
        <div>
          <h1 className="mcq-title">MCQ Practice Generator</h1>
          <p className="mcq-subtitle">AI generates 10–30 MCQs on any topic — practice, score, and track weak areas</p>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="mcq-tabs">
        <button className={`mcq-tab ${mode === 'setup' ? 'active' : ''}`} onClick={() => setMode('setup')}>
          ⚙️ Setup
        </button>
        <button
          className={`mcq-tab ${mode === 'quiz' ? 'active' : ''}`}
          onClick={() => setMode('quiz')}
          disabled={!questions.length}
        >
          📝 Quiz {questions.length ? `(${questions.length} Qs)` : ''}
        </button>
        <button
          className={`mcq-tab ${mode === 'result' ? 'active' : ''}`}
          onClick={() => setMode('result')}
          disabled={!quizDone}
        >
          📊 Results
        </button>
      </div>

      {/* ── SETUP MODE ── */}
      {mode === 'setup' && (
        <div className="mcq-setup-layout">
          <div className="mcq-form-card">
            <div className="mcq-field">
              <label className="mcq-label">Subject (optional)</label>
              <select className="mcq-select" value={subject} onChange={(e) => setSubject(e.target.value)}>
                <option value="">-- Select Subject --</option>
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="mcq-field">
              <label className="mcq-label">Topic / Chapter *</label>
              <input
                className="mcq-input"
                placeholder="e.g. Binary Trees, Sorting Algorithms, French Revolution..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generate()}
              />
            </div>

            <div className="mcq-field">
              <label className="mcq-label">Difficulty</label>
              <div className="mcq-pill-row">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    className={`mcq-pill ${difficulty === d ? 'active diff-' + d.toLowerCase() : ''}`}
                    onClick={() => setDifficulty(d)}
                  >{d}</button>
                ))}
              </div>
            </div>

            <div className="mcq-field">
              <label className="mcq-label">Number of Questions</label>
              <div className="mcq-pill-row">
                {COUNTS.map((c) => (
                  <button
                    key={c}
                    className={`mcq-pill ${count === c ? 'active' : ''}`}
                    onClick={() => setCount(c)}
                  >{c} Qs</button>
                ))}
              </div>
            </div>

            {error && <div className="mcq-error">⚠️ {error}</div>}

            <button className="mcq-btn-primary" onClick={generate} disabled={loading || !topic.trim()}>
              {loading
                ? <><span className="mcq-spinner" /> Generating Questions...</>
                : <>❓ Generate MCQ Practice</>}
            </button>
          </div>

          {/* Info card */}
          <div className="mcq-info-card">
            <div className="mcq-info-title">📌 How it works</div>
            {[
              { icon: '📚', text: 'Enter your chapter or topic' },
              { icon: '🤖', text: 'AI generates real exam-style MCQs' },
              { icon: '✅', text: 'Answer one by one, see instant explanation' },
              { icon: '📊', text: 'Get score + weak area analysis' },
              { icon: '🔁', text: 'Retry to improve your score' },
            ].map((s, i) => (
              <div key={i} className="mcq-info-step">
                <span className="mcq-info-icon">{s.icon}</span>
                <span>{s.text}</span>
              </div>
            ))}
            <div className="mcq-info-tip">
              💡 <strong>Tip:</strong> Use "Mixed" difficulty to get a realistic exam experience.
            </div>

            {/* Example topics */}
            <div className="mcq-examples-title">Try these topics:</div>
            <div className="mcq-chips">
              {['Binary Trees', 'SQL Joins', 'OSI Model', 'Sorting Algorithms', 'Normalization', 'Pointers in C'].map((ex) => (
                <button key={ex} className="mcq-chip" onClick={() => setTopic(ex)}>{ex}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── QUIZ MODE ── */}
      {mode === 'quiz' && questions.length > 0 && (
        <div className="mcq-quiz-layout">
          {/* Top bar */}
          <div className="mcq-quiz-topbar">
            <div className="mcq-quiz-meta">
              <span className="mcq-topic-badge">📚 {questions[0] && (subject || topic)}</span>
              <span className="mcq-diff-badge diff-{difficulty.toLowerCase()}">{difficulty}</span>
            </div>
            <div className="mcq-quiz-progress-text">
              {answeredCount} / {questions.length} answered
              &nbsp;·&nbsp;
              <span className="mcq-correct-text">✅ {correctCount}</span>
              &nbsp;·&nbsp;
              <span className="mcq-wrong-text">❌ {wrongCount}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mcq-progress-track">
            <div
              className="mcq-progress-fill"
              style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }}
            />
          </div>

          {/* Question card */}
          {q && (
            <div className="mcq-question-card">
              <div className="mcq-q-header">
                <span className="mcq-q-num">Q{current + 1} / {questions.length}</span>
                <span className={`mcq-q-diff diff-${(q.difficulty || '').toLowerCase()}`}>{q.difficulty}</span>
              </div>
              <div className="mcq-question-text">{q.question}</div>

              {/* Options */}
              <div className="mcq-options">
                {Object.entries(q.options).map(([opt, text]) => {
                  const state = getOptionState(current, opt);
                  const colors = state === 'correct' ? OPTION_COLORS.correct
                               : state === 'wrong'   ? OPTION_COLORS.wrong
                               : state === 'selected' ? { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8', badge: '#dbeafe' }
                               : OPTION_COLORS.neutral;
                  return (
                    <button
                      key={opt}
                      className={`mcq-option ${state}`}
                      style={{
                        background: colors.bg,
                        borderColor: colors.border,
                        color: colors.text,
                        cursor: submitted[current] ? 'default' : 'pointer',
                      }}
                      onClick={() => handleSelect(current, opt)}
                    >
                      <span className="mcq-opt-badge" style={{ background: colors.badge, color: colors.text }}>
                        {opt}
                      </span>
                      <span className="mcq-opt-text">{text}</span>
                      {state === 'correct' && <span className="mcq-opt-icon">✅</span>}
                      {state === 'wrong'   && <span className="mcq-opt-icon">❌</span>}
                    </button>
                  );
                })}
              </div>

              {/* Explanation (after submit) */}
              {submitted[current] && (
                <div className="mcq-explanation">
                  <span className="mcq-exp-icon">💡</span>
                  <div>
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="mcq-action-row">
                <button className="mcq-btn-secondary" onClick={handlePrev} disabled={current === 0}>
                  ◀ Prev
                </button>

                {!submitted[current] ? (
                  <button
                    className="mcq-btn-submit"
                    onClick={() => handleSubmitAnswer(current)}
                    disabled={!selected[current]}
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button className="mcq-btn-next" onClick={handleNext}>
                    {current === questions.length - 1 ? '🏁 Finish Quiz' : 'Next ▶'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Question navigator dots */}
          <div className="mcq-dot-nav">
            {questions.map((q2, i) => {
              const isCorrect = submitted[i] && selected[i] === q2.correct;
              const isWrong   = submitted[i] && selected[i] !== q2.correct;
              return (
                <button
                  key={i}
                  className={`mcq-dot ${i === current ? 'current' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                  onClick={() => setCurrent(i)}
                  title={`Q${i + 1}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Finish early */}
          {answeredCount > 0 && !quizDone && (
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button className="mcq-btn-finish-early" onClick={finishQuiz}>
                🏁 Finish & See Results
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── RESULT MODE ── */}
      {mode === 'result' && quizDone && (
        <div className="mcq-result-layout">
          {/* Score Card */}
          <div className="mcq-score-card">
            <div className="mcq-score-circle" style={{
              background: percent >= 70 ? 'linear-gradient(135deg,#22c55e,#16a34a)' :
                          percent >= 40 ? 'linear-gradient(135deg,#f59e0b,#d97706)' :
                                          'linear-gradient(135deg,#ef4444,#dc2626)'
            }}>
              <div className="mcq-score-num">{percent}%</div>
              <div className="mcq-score-label">Score</div>
            </div>
            <div className="mcq-score-title">
              {percent >= 80 ? '🎉 Excellent!' : percent >= 60 ? '👍 Good Job!' : percent >= 40 ? '📖 Keep Practicing' : '💪 Need More Practice'}
            </div>
            <div className="mcq-score-sub">{correctCount} correct out of {questions.length} questions</div>
          </div>

          {/* Stats row */}
          <div className="mcq-stats-row">
            <div className="mcq-stat-box correct">
              <div className="mcq-stat-num">{correctCount}</div>
              <div className="mcq-stat-label">✅ Correct</div>
            </div>
            <div className="mcq-stat-box wrong">
              <div className="mcq-stat-num">{wrongCount}</div>
              <div className="mcq-stat-label">❌ Wrong</div>
            </div>
            <div className="mcq-stat-box skipped">
              <div className="mcq-stat-num">{skippedCount}</div>
              <div className="mcq-stat-label">⏭ Skipped</div>
            </div>
            <div className="mcq-stat-box total">
              <div className="mcq-stat-num">{questions.length}</div>
              <div className="mcq-stat-label">📝 Total</div>
            </div>
          </div>

          {/* Weak areas */}
          {weakTopics.length > 0 && (
            <div className="mcq-weak-card">
              <div className="mcq-weak-title">📌 Weak Areas Detected</div>
              <p className="mcq-weak-sub">You struggled more with these difficulty levels — focus your revision here:</p>
              <div className="mcq-weak-tags">
                {weakTopics.map((t) => (
                  <span key={t} className={`mcq-weak-tag diff-${t.toLowerCase()}`}>{t} Questions</span>
                ))}
              </div>
            </div>
          )}

          {/* Review all answers */}
          <div className="mcq-review-section">
            <h3 className="mcq-review-heading">📋 Answer Review</h3>
            {questions.map((q2, i) => {
              const isCorrect = submitted[i] && selected[i] === q2.correct;
              const isWrong   = submitted[i] && !isCorrect;
              const isSkipped = !submitted[i];
              return (
                <div key={i} className={`mcq-review-item ${isCorrect ? 'correct' : isWrong ? 'wrong' : 'skipped'}`}>
                  <div className="mcq-review-q-row">
                    <span className={`mcq-review-status ${isCorrect ? 'correct' : isWrong ? 'wrong' : 'skipped'}`}>
                      {isCorrect ? '✅' : isWrong ? '❌' : '⏭'}
                    </span>
                    <span className="mcq-review-q-num">Q{i + 1}</span>
                    <span className={`mcq-review-diff diff-${(q2.difficulty || '').toLowerCase()}`}>{q2.difficulty}</span>
                  </div>
                  <div className="mcq-review-question">{q2.question}</div>
                  <div className="mcq-review-options-row">
                    {Object.entries(q2.options).map(([opt, text]) => (
                      <span
                        key={opt}
                        className={`mcq-review-opt 
                          ${opt === q2.correct ? 'is-correct' : ''}
                          ${opt === selected[i] && opt !== q2.correct ? 'is-wrong' : ''}
                        `}
                      >
                        <strong>{opt}.</strong> {text}
                      </span>
                    ))}
                  </div>
                  {q2.explanation && (
                    <div className="mcq-review-exp">💡 {q2.explanation}</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Retry */}
          <div className="mcq-result-actions">
            <button className="mcq-btn-primary" onClick={() => {
              setSelected({}); setSubmitted({}); setCurrent(0);
              setQuizDone(false); setMode('quiz');
            }}>🔁 Retry Same Quiz</button>
            <button className="mcq-btn-secondary" onClick={() => {
              setMode('setup'); setQuestions([]);
              setSelected({}); setSubmitted({});
              setCurrent(0); setQuizDone(false);
            }}>➕ New Quiz</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MCQPractice;
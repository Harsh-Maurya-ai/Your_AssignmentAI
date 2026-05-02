import React from 'react';
import { useAuth } from '../context/AuthContext';
import './DashboardHome.css';

const stats = [
  { icon: '📝', label: 'Assignments Generated', value: '0', color: '#6c63ff' },
  { icon: '💻', label: 'Code Explained', value: '0', color: '#3b82f6' },
  { icon: '📚', label: 'Notes Summarized', value: '0', color: '#10b981' },
  { icon: '📄', label: 'Files Exported', value: '0', color: '#f59e0b' },
];

const quickActions = [
  { icon: '📝', label: 'Generate Assignment', desc: 'AI writes your assignment', color: '#6c63ff', id: 'assignment' },
  { icon: '💻', label: 'Explain Code', desc: 'Understand any code', color: '#3b82f6', id: 'code-explainer' },
  { icon: '▶️', label: 'YouTube Notes', desc: 'Summarize any lecture', color: '#ef4444', id: 'youtube' },
  { icon: '🎤', label: 'Viva Prep', desc: 'Predict viva questions', color: '#f59e0b', id: 'viva' },
  { icon: '📅', label: 'Study Planner', desc: 'AI plans your schedule', color: '#10b981', id: 'planner' },
  { icon: '📄', label: 'Build Resume', desc: 'Professional CV maker', color: '#8b5cf6', id: 'resume' },
];

const tips = [
  '💡 Use Viva Predictor before every exam — it predicts 80% of questions!',
  '🚀 YouTube Summarizer saves 2 hours of lecture watching daily',
  '📝 Assignment Generator works best with detailed topic descriptions',
  '🎯 Study Planner works best when you add all exam dates at once',
];

const DashboardHome = () => {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const tip = tips[Math.floor(Math.random() * tips.length)];
  const freeUsageUsed = 0;
  const freeUsageLimit = 3;

  return (
    <div className="dash-home">

      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-greeting">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="dash-subtitle">What do you want to accomplish today?</p>
        </div>
        <div className="dash-date">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* Tip Banner */}
      <div className="tip-banner">
        <span className="tip-text">{tip}</span>
      </div>

      {/* Free plan usage bar */}
      {user?.plan === 'free' && (
        <div className="usage-bar-card">
          <div className="usage-bar-top">
            <span>🆓 Free Plan Usage Today</span>
            <span className="usage-count">{freeUsageUsed}/{freeUsageLimit} uses</span>
          </div>
          <div className="usage-bar-track">
            <div
              className="usage-bar-fill"
              style={{ width: `${(freeUsageUsed / freeUsageLimit) * 100}%` }}
            />
          </div>
          <button className="upgrade-inline-btn">⭐ Upgrade to Pro — ₹79/month</button>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div className="stat-card" key={i} style={{ '--accent': stat.color }}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="section-title">⚡ Quick Actions</div>
      <div className="quick-grid">
        {quickActions.map((action, i) => (
          <div className="quick-card" key={i} style={{ '--accent': action.color }}>
            <div className="quick-icon" style={{ background: action.color + '22', color: action.color }}>
              {action.icon}
            </div>
            <div className="quick-info">
              <div className="quick-label">{action.label}</div>
              <div className="quick-desc">{action.desc}</div>
            </div>
            <div className="quick-arrow">→</div>
          </div>
        ))}
      </div>

      {/* Upcoming deadlines placeholder */}
      <div className="section-title">⏰ Upcoming Deadlines</div>
      <div className="empty-deadlines">
        <div className="empty-icon">📅</div>
        <p>No deadlines added yet</p>
        <button className="add-deadline-btn">+ Add Deadline</button>
      </div>

      {/* Recent activity placeholder */}
      <div className="section-title">🕐 Recent Activity</div>
      <div className="empty-activity">
        <div className="empty-icon">✨</div>
        <p>Your generated content will appear here</p>
      </div>

    </div>
  );
};

export default DashboardHome;
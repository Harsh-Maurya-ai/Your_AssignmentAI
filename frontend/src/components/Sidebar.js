import React from 'react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const menuItems = [
  { id: 'home', icon: '🏠', label: 'Dashboard' },
  { id: 'divider1', divider: true },
  { id: 'assignment', icon: '📝', label: 'Assignment Generator', badge: 'AI' },
  { id: 'paraphrase', icon: '🔄', label: 'Paraphrasing Tool', badge: 'AI' },
  { id: 'grammar', icon: '✅', label: 'Grammar Checker', badge: 'AI' },
  { id: 'citation', icon: '📖', label: 'Citation Generator' },
  { id: 'export', icon: '📄', label: 'Export (PDF/Word)' },
  { id: 'divider2', divider: true },
  { id: 'code-explainer', icon: '💻', label: 'Code Explainer', badge: 'CS' },
{ id: 'debugger', icon: '🐛', label: 'Code Debugger', badge: 'CS' },
  { id: 'pseudocode', icon: '📐', label: 'Code → Pseudocode', badge: 'CS' },
  { id: 'lab-manual', icon: '🔬', label: 'Lab Manual Generator', badge: 'CS' },
  { id: 'viva', icon: '🎤', label: 'Viva Predictor', badge: 'HOT' },
  { id: 'readme', icon: '📋', label: 'README Generator', badge: 'CS' },
  { id: 'divider3', divider: true },
  { id: 'summarizer', icon: '📚', label: 'Notes Summarizer', badge: 'AI' },
  { id: 'youtube', icon: '▶️', label: 'YouTube Summarizer', badge: 'AI' },
  { id: 'flashcards', icon: '🃏', label: 'Flashcard Generator' },
  { id: 'mcq', icon: '❓', label: 'MCQ Practice' },
  { id: 'mindmap', icon: '🧠', label: 'Mind Map Generator' },
  { id: 'pyq', icon: '📄', label: 'PYQ Analyzer', badge: 'HOT' },
  { id: 'divider4', divider: true },
  { id: 'planner', icon: '📅', label: 'Study Planner', badge: 'AI' },
  { id: 'deadline', icon: '⏰', label: 'Deadline Tracker' },
  { id: 'pomodoro', icon: '🍅', label: 'Pomodoro Timer' },
  { id: 'attendance', icon: '📊', label: 'Attendance Calculator' },
  { id: 'cgpa', icon: '🎓', label: 'CGPA Calculator' },
  { id: 'divider5', divider: true },
  { id: 'resume', icon: '📄', label: 'Resume Builder' },
  { id: 'cover-letter', icon: '✉️', label: 'Cover Letter' },
  { id: 'interview', icon: '💼', label: 'Interview Prep' },
  { id: 'project-ideas', icon: '💡', label: 'Project Ideas' },
  { id: 'divider6', divider: true },
  { id: 'history', icon: '🕐', label: 'My History' },
  { id: 'upgrade', icon: '⭐', label: 'Upgrade to Pro', special: true },
];

const Sidebar = ({ activePage, setActivePage, sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">📚</span>
            {sidebarOpen && <span className="logo-text">AssignmentAI</span>}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* User info */}
        {sidebarOpen && (
          <div className="sidebar-user">
            <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className={`user-plan ${user?.plan}`}>{user?.plan === 'pro' ? '⭐ Pro' : '🆓 Free'}</div>
            </div>
          </div>
        )}

        {/* Menu */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            if (item.divider) return <div key={item.id} className="sidebar-divider" />;
            return (
              <button
                key={item.id}
                className={`sidebar-item ${activePage === item.id ? 'active' : ''} ${item.special ? 'special' : ''}`}
                onClick={() => setActivePage(item.id)}
                title={!sidebarOpen ? item.label : ''}
              >
                <span className="item-icon">{item.icon}</span>
                {sidebarOpen && (
                  <>
                    <span className="item-label">{item.label}</span>
                    {item.badge && (
                      <span className={`item-badge badge-${item.badge.toLowerCase()}`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={logout}>
            <span>🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
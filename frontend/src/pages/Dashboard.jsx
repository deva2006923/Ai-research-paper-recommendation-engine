import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Loader2, Search, MessageSquare, Clock, ArrowRight, RotateCcw } from 'lucide-react';

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((new Date() - date) / 1000);
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function Dashboard() {
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchActivity = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getUserActivity();
      setActivity(data);
    } catch (err) {
      console.error(err);
      let detail = err.response?.data?.detail;
      
      if (Array.isArray(detail)) {
        detail = detail.map(d => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(', ');
      } else if (typeof detail !== 'string') {
        detail = null;
      }

      setError(detail || err.message || 'Failed to load your activity data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  const handleResumeChat = (sessionId) => {
    localStorage.setItem('chatSessionId', sessionId);
    // Since the Assistant panel is mounted globally and relies on state, 
    // we can dispatch a custom event or rely on the user to click the panel manually.
    // However, the cleanest way is to dispatch an event to open the chat panel.
    window.dispatchEvent(new CustomEvent('open-assistant'));
  };

  const handleReRunSearch = (query) => {
    localStorage.setItem('problemStatement', query);
    // You can optionally store a limit here if you wanted, but default is fine
    navigate('/results');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-md)' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
        <span className="label-sm">Loading your dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-md)' }}>
        <div style={{ color: 'var(--error)', padding: '24px', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <h3 className="label-sm">Error</h3>
          <p className="body-md">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-lg) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      {/* Dashboard Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-md)' }}>
        <div>
          <span className="label-sm" style={{ color: 'var(--primary)' }}>Personal Dashboard</span>
          <h2 className="headline-lg" style={{ fontSize: '1.75rem', marginTop: '4px' }}>Welcome back, {activity.user.name}</h2>
        </div>
      </div>

      {/* Detail Lists Rows */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-lg)' }}>
        
        {/* Search History */}
        <div className="halo-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-xs)' }}>
            <span className="label-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--on-surface)' }}>
              <Search size={14} /> Your Search History
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
            {activity.searches.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-faint)' }}>You haven't made any searches yet.</p>
            ) : (
              [...activity.searches].reverse().map((search, idx) => (
                <div 
                  key={idx}
                  style={{ 
                    backgroundColor: 'var(--elevated)', 
                    border: '1px solid var(--border)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'border-color 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflow: 'hidden' }}>
                    <span className="jetbrains-mono" style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      "{search.query}"
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--on-surface-faint)' }}>
                      <Clock size={12} />
                      <span>{formatRelativeTime(search.timestamp)}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleReRunSearch(search.query)}
                    title="Run search again"
                    style={{ 
                      background: 'none', 
                      color: 'var(--on-surface-muted)', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '6px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid transparent',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.color = 'var(--primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--on-surface-muted)';
                    }}
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Sessions */}
        <div className="halo-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-xs)' }}>
            <span className="label-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--on-surface)' }}>
              <MessageSquare size={14} /> AI Assistant Sessions
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
            {activity.chat_sessions.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-faint)' }}>No active chat sessions found.</p>
            ) : (
              [...activity.chat_sessions].reverse().map((session, idx) => (
                <div 
                  key={session.id}
                  style={{ 
                    backgroundColor: 'var(--elevated)', 
                    border: '1px solid var(--border)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)' }}>
                        {session.title || 'Untitled Session'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--on-surface-faint)' }}>
                        <Clock size={12} />
                        <span>{formatRelativeTime(session.created_at)}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-muted)', backgroundColor: 'var(--surface)', padding: '2px 6px', borderRadius: '4px' }}>
                      {session.messages.length} msgs
                    </span>
                  </div>
                  
                  {session.messages.length > 0 && (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-muted)', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      "{session.messages[session.messages.length - 1].content}"
                    </p>
                  )}

                  <button 
                    onClick={() => handleResumeChat(session.id)}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.75rem', alignSelf: 'flex-start', marginTop: '4px' }}
                  >
                    Resume Conversation <ArrowRight size={12} style={{ marginLeft: '4px' }}/>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

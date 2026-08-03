import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import StatTile from '../components/ui/StatTile';
import { ShieldAlert, Loader2, Users, Search, MessageSquare, Database, RefreshCw } from 'lucide-react';

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        setError('Access Denied: Restricted to devaprakassh49@gmail.com only.');
      } else {
        setError('Failed to load administrator metrics.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-md)' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
        <span className="label-sm">Querying aggregate system statistics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        style={{ 
          minHeight: '70vh', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          maxWidth: '500px',
          margin: '0 auto',
          textAlign: 'center',
          gap: 'var(--space-md)' 
        }}
      >
        <div 
          style={{ 
            color: 'var(--error)', 
            backgroundColor: 'rgba(255, 58, 92, 0.08)',
            border: '1px solid var(--error)',
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <ShieldAlert size={40} />
          <h3 className="label-sm" style={{ color: 'var(--on-surface)' }}>Authorization Failed</h3>
          <p className="body-md" style={{ fontSize: '0.875rem' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-lg) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      {/* Admin Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-md)' }}>
        <div>
          <span className="label-sm">Secure Terminal</span>
          <h2 className="headline-lg" style={{ fontSize: '1.75rem', marginTop: '4px' }}>System Administration</h2>
        </div>
        <button className="btn-secondary" onClick={fetchStats} style={{ padding: '8px 16px', fontSize: '0.8125rem' }}>
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
        <StatTile 
          label="TOTAL USERS" 
          value={stats.total_users.toString()} 
          trend={8.4} 
          sparklineData={[2, 4, 8, stats.total_users]} 
          color="var(--primary)" 
        />
        <StatTile 
          label="SEARCH QUERIES" 
          value={stats.total_searches.toString()} 
          trend={14.2} 
          sparklineData={[10, 20, 15, 30, stats.total_searches]} 
          color="var(--success)" 
        />
        <StatTile 
          label="ACTIVE SESSIONS" 
          value={stats.total_sessions.toString()} 
          trend={12.0} 
          sparklineData={[1, 3, 5, stats.total_sessions]} 
          color="var(--info)" 
        />
        <StatTile 
          label="MESSAGES EXCHANGED" 
          value={stats.total_messages.toString()} 
          trend={18.5} 
          sparklineData={[20, 50, 40, 80, stats.total_messages]} 
          color="var(--warning)" 
        />
      </div>

      {/* Detail Lists Rows */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-lg)' }}>
        {/* Recent Searches */}
        <div className="halo-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-xs)' }}>
            <span className="label-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--on-surface)' }}>
              <Search size={14} /> Recent Search Queries
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
            {stats.recent_searches.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-faint)' }}>No search records found.</p>
            ) : (
              stats.recent_searches.map((search, idx) => (
                <div 
                  key={idx}
                  style={{ 
                    backgroundColor: 'var(--elevated)', 
                    border: '1px solid var(--border)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <span className="jetbrains-mono" style={{ fontSize: '0.875rem', color: 'var(--primary)' }}>
                    "{search.query}"
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--on-surface-faint)' }}>
                    <span>User ID: {search.user_id}</span>
                    <span>{new Date(search.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="halo-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-xs)' }}>
            <span className="label-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--on-surface)' }}>
              <Users size={14} /> Recent Registered Users
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
            {stats.recent_users.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-faint)' }}>No registered users found.</p>
            ) : (
              stats.recent_users.map((user, idx) => (
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
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {user.picture ? (
                      <img 
                        src={user.picture} 
                        alt={user.name} 
                        style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border-strong)' }} 
                      />
                    ) : (
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                        {user.name.charAt(0)}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--on-surface)' }}>{user.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-muted)' }}>{user.email}</span>
                    </div>
                  </div>
                  <span className="jetbrains-mono" style={{ fontSize: '0.6875rem', color: 'var(--on-surface-faint)' }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { api } from './services/api';

// Pages & Components imports
import Login from './pages/Login';
import Input from './pages/Input';
import Results from './pages/Results';
import Admin from './pages/Admin';
import AssistantPanel from './components/AssistantPanel';
import ForgeEmbers from './components/ui/ForgeEmbers';

import { MessageSquare, LogOut, Terminal, Sparkles, BookOpen, ChevronRight } from 'lucide-react';

function InnerApp() {
  const [user, setUser] = useState(api.getCurrentUser());
  const [query, setQuery] = useState(() => localStorage.getItem('problemStatement') || '');
  const [limit, setLimit] = useState(() => Number(localStorage.getItem('searchLimit')) || 5);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = (newUser) => {
    setUser(newUser);
    navigate('/');
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setIsAssistantOpen(false);
    navigate('/login');
  };

  const handleSearch = (newQuery, newLimit) => {
    setQuery(newQuery);
    setLimit(newLimit);
  };

  // Protected route wrapper
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  // Determine if active link
  const isActive = (path) => location.pathname === path;

  // Show header only when logged in
  const renderHeader = () => {
    if (!user || location.pathname === '/login') return null;

    const isAdmin = user.email === 'devaprakassh49@gmail.com';

    const StarIcon = ({ size = 16, ...props }) => (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" {...props}>
        <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
      </svg>
    );

    const navItemStyle = (active) => ({
      textDecoration: 'none',
      fontSize: '0.8125rem',
      color: active ? 'var(--on-surface)' : 'var(--on-surface-muted)',
      fontWeight: 500,
      padding: '6px 14px',
      borderRadius: '9999px',
      backgroundColor: active ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    });

    return (
      <header 
        style={{ 
          borderBottom: '1px solid var(--border)', 
          padding: '12px var(--space-lg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'transparent',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}
      >
        {/* Left Side Logo */}
        <Link 
          to="/" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            textDecoration: 'none', 
            color: 'var(--on-surface)' 
          }}
        >
          <StarIcon size={18} style={{ color: 'var(--primary)' }} />
          <span className="jetbrains-mono" style={{ fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '-0.02em' }}>
            Scholarly Archive
          </span>
        </Link>
        
        {/* Center Floating Capsule pill menu */}
        <nav 
          style={{ 
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex', 
            gap: '4px', 
            backgroundColor: 'rgba(11, 11, 12, 0.75)', 
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border)',
            borderRadius: '9999px',
            padding: '4px 6px',
            alignItems: 'center'
          }}
        >
          <Link to="/" style={navItemStyle(isActive('/'))}>
            Search
          </Link>
          {query && (
            <Link to="/results" style={navItemStyle(isActive('/results'))}>
              Results
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" style={navItemStyle(isActive('/admin'))}>
              <Terminal size={12} /> Admin
            </Link>
          )}
        </nav>

        {/* Right Side Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <button
            onClick={() => setIsAssistantOpen(!isAssistantOpen)}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '9999px',
              color: 'var(--on-surface)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              padding: '6px 14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <MessageSquare size={13} style={{ color: 'var(--primary)' }} /> AI Assistant
          </button>

          {/* User profile metadata */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid var(--border)', paddingLeft: 'var(--space-md)' }}>
            {user.picture ? (
              <img 
                src={user.picture} 
                alt={user.name} 
                style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--border-strong)' }} 
              />
            ) : (
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                {user.name.charAt(0)}
              </div>
            )}
            <button 
              onClick={handleLogout} 
              title="Logout Session"
              style={{ 
                background: 'none', 
                color: 'var(--on-surface-faint)', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center'
              }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', position: 'relative' }}>
      <ForgeEmbers />
      {renderHeader()}
      
      <main 
        style={{ 
          flex: 1, 
          padding: 'var(--space-lg)', 
          maxWidth: '1200px', 
          width: '100%', 
          margin: '0 auto',
          marginRight: isAssistantOpen ? '380px' : 'auto', // Displaces content when chat is open
          transition: 'margin-right 0.3s ease-out',
          position: 'relative',
          zIndex: 1
        }}
      >
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} 
          />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Input onSearch={handleSearch} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/results" 
            element={
              <ProtectedRoute>
                {query ? <Results query={query} limit={limit} /> : <Navigate to="/" replace />}
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Persistent Chat Sidebar */}
      <AssistantPanel isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />

      {/* Floating AI Assistant Trigger (Bottom Right) */}
      {user && location.pathname !== '/login' && (
        <button
          onClick={() => setIsAssistantOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--primary)',
            color: 'var(--primary)',
            display: isAssistantOpen ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 999,
            boxShadow: '0 8px 32px rgba(255, 92, 0, 0.25)',
            transition: 'transform 0.2s ease, background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.backgroundColor = 'rgba(255, 92, 0, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = 'var(--surface)';
          }}
        >
          <MessageSquare size={20} />
        </button>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <InnerApp />
    </Router>
  );
}

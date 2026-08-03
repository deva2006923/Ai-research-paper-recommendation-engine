import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ScrollFloat from '../components/ui/ScrollFloat';
import { api } from '../services/api';
import { ShieldAlert, LogIn, ArrowRight, Terminal } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [googleToken, setGoogleToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const navigate = useNavigate();

  const handleBypassLogin = async (bypassEmail, bypassName) => {
    setIsLoading(true);
    setError('');
    const mockToken = `mock_${bypassName.replace(/\s+/g, '-')}_${bypassEmail}`;
    try {
      const data = await api.loginWithGoogle(mockToken);
      onLogin(data.user);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to bypass login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomMockSubmit = async (e) => {
    e.preventDefault();
    if (!email || !name) {
      setError('Name and Email are required.');
      return;
    }
    await handleBypassLogin(email.trim(), name.trim());
  };

  const handleTokenSubmit = async (e) => {
    e.preventDefault();
    if (!googleToken) {
      setError('Please enter a Google ID token.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const data = await api.loginWithGoogle(googleToken);
      onLogin(data.user);
    } catch (err) {
      setError(err.response?.data?.detail || 'Verification failed. Expired token.');
    } finally {
      setIsLoading(false);
    }
  };

  const StarIcon = ({ size = 20, ...props }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" {...props}>
      <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
    </svg>
  );

  return (
    <div 
      style={{ 
        minHeight: '94vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 'var(--space-lg) 0',
        position: 'relative',
        width: '100%',
        overflow: 'hidden'
      }}
    >
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(300px, 1fr) minmax(350px, 1.2fr)', 
          gap: '48px', 
          width: '100%', 
          maxWidth: '1100px', 
          alignItems: 'center',
          padding: '0 var(--space-md)',
          zIndex: 10
        }}
        className="login-grid"
      >
        {/* Left Column: Product Info & Actions */}
        <div className="login-hero-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
            <StarIcon size={24} />
            <span className="jetbrains-mono" style={{ fontWeight: 700, fontSize: '0.875rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Scholarly Archive
            </span>
          </div>

          <div style={{ marginTop: '10px' }}>
            <ScrollFloat
              animationDuration={0.8}
              ease="back.out(1.2)"
              scrollStart="top bottom+=80%"
              scrollEnd="bottom center"
              stagger={0.02}
              textClassName="login-hero-title"
            >
              Research once. Scaffold the same code to every server.
            </ScrollFloat>
            <p className="body-md" style={{ fontSize: '1rem', color: 'var(--on-surface-muted)', maxWidth: '460px' }}>
              Scholarly Archive searches arXiv and Semantic Scholar concurrently, isolates project differentiators, and auto-generates developer scaffolds in seconds.
            </p>
          </div>

          {error && (
            <div 
              style={{ 
                display: 'flex', 
                gap: 'var(--space-sm)', 
                color: 'var(--error)', 
                backgroundColor: 'rgba(255, 69, 58, 0.08)',
                border: '1px solid var(--error)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                maxWidth: '460px'
              }}
            >
              <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          {/* Dithersmith-styled CTA login actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '460px', marginTop: '10px' }}>
            {/* Primary violet CTA bypass button (like "Get access") */}
            <button
              onClick={() => handleBypassLogin('devaprakassh49@gmail.com', 'Admin')}
              className="btn-cta"
              disabled={isLoading}
              style={{ width: '100%', justifyContent: 'space-between' }}
            >
              <span>Launch Admin Console (mock)</span>
              <ArrowRight size={16} />
            </button>

            {/* Secondary outline researcher bypass */}
            <button
              onClick={() => handleBypassLogin('sarah@gmail.com', 'Sarah Jenkins')}
              className="btn-secondary"
              disabled={isLoading}
              style={{ width: '100%', border: '1px solid var(--border-strong)', justifyContent: 'space-between', padding: '12px 20px' }}
            >
              <span>Launch Researcher Workspace (mock)</span>
              <ArrowRight size={16} style={{ color: 'var(--on-surface-muted)' }} />
            </button>
          </div>

          {/* Toggle for Advanced Sign-in credentials */}
          <div style={{ maxWidth: '460px' }}>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                background: 'none',
                color: 'var(--on-surface-faint)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '4px 0'
              }}
            >
              {showAdvanced ? 'Hide advanced sign-in options' : 'Show advanced sign-in options (token verification)'}
            </button>

            {showAdvanced && (
              <div 
                className="halo-card" 
                style={{ 
                  marginTop: '12px', 
                  padding: '16px', 
                  backgroundColor: 'var(--surface)', 
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                {/* Option A: Custom credentials */}
                <form onSubmit={handleCustomMockSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span className="label-sm" style={{ fontSize: '0.625rem' }}>Custom mock session profile</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="Name" 
                      className="input-field" 
                      style={{ padding: '8px 12px', fontSize: '0.8125rem' }}
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                    />
                    <input 
                      type="email" 
                      placeholder="Email" 
                      className="input-field" 
                      style={{ padding: '8px 12px', fontSize: '0.8125rem' }}
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                    />
                  </div>
                  <button type="submit" className="btn-primary" style={{ padding: '8px 12px', fontSize: '0.8125rem' }} disabled={isLoading}>
                    Sign in Custom Profile
                  </button>
                </form>

                {/* Option B: Google ID Token */}
                <form onSubmit={handleTokenSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <span className="label-sm" style={{ fontSize: '0.625rem' }}>Verify Google OAuth ID Token</span>
                  <input 
                    type="password" 
                    placeholder="Paste ID Token" 
                    className="input-field" 
                    style={{ padding: '8px 12px', fontSize: '0.8125rem' }}
                    value={googleToken} 
                    onChange={e => setGoogleToken(e.target.value)} 
                  />
                  <button type="submit" className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8125rem', gap: '6px' }} disabled={isLoading}>
                    <LogIn size={12} /> Verify & Log In
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Scrolling Mockup Browser Frame */}
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div 
            className="login-mock-browser"
            style={{ 
              width: '100%', 
              maxWidth: '520px', 
              backgroundColor: 'var(--surface)', 
              borderRadius: '12px', 
              border: '1px solid var(--border-strong)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              height: '380px'
            }}
          >
            {/* Mock Window Header */}
            <div 
              style={{ 
                backgroundColor: 'var(--elevated)', 
                borderBottom: '1px solid var(--border)', 
                padding: '10px 14px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--error)' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--warning)' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
              </div>
              <div 
                className="jetbrains-mono" 
                style={{ 
                  fontSize: '0.6875rem', 
                  color: 'var(--on-surface-faint)', 
                  backgroundColor: 'var(--surface)', 
                  padding: '2px 32px', 
                  borderRadius: '4px',
                  border: '1px solid var(--border)'
                }}
              >
                localhost:5174/results
              </div>
              <div style={{ width: '30px' }} />
            </div>

            {/* Scrolling Viewport */}
            <div 
              style={{ 
                flex: 1, 
                padding: '16px', 
                overflow: 'hidden', 
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Scrolling Card Stack mock */}
              <div 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '16px',
                  animation: 'mockup-scroll 16s infinite ease-in-out'
                }}
                className="mockup-scroller"
              >
                {/* Card 1: Publications */}
                <div style={{ backgroundColor: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="jetbrains-mono" style={{ fontSize: '0.625rem', color: 'var(--primary)', fontWeight: 600 }}>01 / PUBLICATIONS</span>
                    <span className="jetbrains-mono" style={{ fontSize: '0.5625rem', color: 'var(--on-surface-faint)' }}>arXiv</span>
                  </div>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Attention Is All You Need</h4>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--on-surface-muted)', lineHeight: 1.4 }}>
                    We propose a new simple network architecture, the Transformer, based solely on attention mechanisms...
                  </p>
                </div>

                {/* Card 2: Repositories */}
                <div style={{ backgroundColor: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="jetbrains-mono" style={{ fontSize: '0.625rem', color: 'var(--primary)', fontWeight: 600 }}>02 / REPOSITORIES</span>
                    <span className="jetbrains-mono" style={{ fontSize: '0.5625rem', color: 'var(--on-surface-faint)' }}>GitHub</span>
                  </div>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 600 }}>huggingface / transformers</h4>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--on-surface-muted)', lineHeight: 1.4 }}>
                    State-of-the-art Machine Learning for PyTorch, TensorFlow, and JAX...
                  </p>
                </div>

                {/* Card 3: Differentiation */}
                <div style={{ backgroundColor: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="jetbrains-mono" style={{ fontSize: '0.625rem', color: 'var(--primary)', fontWeight: 600 }}>03 / DIFFERENTIATION</span>
                    <span className="jetbrains-mono" style={{ fontSize: '0.5625rem', color: 'var(--on-surface-faint)' }}>AI Engine</span>
                  </div>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Product Gap Matrix</h4>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--on-surface-muted)', lineHeight: 1.4 }}>
                    Focus on low-latency streaming inference pipelines rather than general weight training wrappers...
                  </p>
                </div>

                {/* Card 4: Code Scaffold */}
                <div style={{ backgroundColor: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="jetbrains-mono" style={{ fontSize: '0.625rem', color: 'var(--primary)', fontWeight: 600 }}>04 / SCAFFOLD CODE</span>
                    <span className="jetbrains-mono" style={{ fontSize: '0.5625rem', color: 'var(--on-surface-faint)' }}>Zip Stream</span>
                  </div>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 600 }}>starter_project.zip</h4>
                  <div style={{ height: '4px', backgroundColor: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: '80%', height: '100%', backgroundColor: 'var(--primary)' }} />
                  </div>
                </div>
              </div>

              {/* Fading overlay top & bottom */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40px', background: 'linear-gradient(to bottom, var(--surface), transparent)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px', background: 'linear-gradient(to top, var(--surface), transparent)', pointerEvents: 'none' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Styled mockup scroll keyframe injection */}
      <style>{`
        @keyframes mockup-scroll {
          0% { transform: translateY(0); }
          15% { transform: translateY(0); }
          25% { transform: translateY(-130px); }
          40% { transform: translateY(-130px); }
          50% { transform: translateY(-260px); }
          65% { transform: translateY(-260px); }
          75% { transform: translateY(-380px); }
          90% { transform: translateY(-380px); }
          100% { transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .login-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .mockup-scroller {
            animation: none !important;
          }
        }
      `}</style>

      {/* Pixelated Dither Ramps */}
      <div className="dither-ramp" />
    </div>
  );
}

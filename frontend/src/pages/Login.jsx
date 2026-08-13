import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScrollFloat from '../components/ui/ScrollFloat';
import { api } from '../services/api';
import { ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';

export default function Login({ onLogin }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLoginMode) {
        if (!email || !password) {
          setError('Email and password are required.');
          setIsLoading(false);
          return;
        }
        const data = await api.login(email, password);
        onLogin(data.user);
      } else {
        if (!name || !email || !password || !confirmPassword) {
          setError('All fields are required.');
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setIsLoading(false);
          return;
        }
        const data = await api.signup(name, email, password);
        onLogin(data.user);
      }
    } catch (err) {
      let detail = err.response?.data?.detail;
      
      // If validation error (422 Unprocessable Entity), detail is an array
      if (Array.isArray(detail)) {
        // Extract the first validation message to avoid React crash
        detail = detail.map(d => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(', ');
      } else if (typeof detail !== 'string') {
        detail = null;
      }

      if (isLoginMode) {
        setError(detail || (err.response?.status === 401 ? 'Incorrect email or password.' : 'An error occurred during sign in.'));
      } else {
        setError(detail || (err.response?.status === 400 ? 'An account with this email already exists.' : 'An error occurred during sign up.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
    // Clear fields
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
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
        <div className="login-hero-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
            <p className="body-md" style={{ fontSize: '1rem', color: 'var(--on-surface-muted)', maxWidth: '460px', marginTop: '16px' }}>
              Scholarly Archive searches arXiv and Semantic Scholar concurrently, isolates project differentiators, and auto-generates developer scaffolds in seconds.
            </p>
          </div>

          {/* Dithersmith Auth Form */}
          <div className="halo-card" style={{ maxWidth: '460px', marginTop: '8px' }}>
            <h2 className="headline-lg" style={{ fontSize: '1.5rem', marginBottom: '24px' }}>
              {isLoginMode ? 'Sign In' : 'Create Account'}
            </h2>
            
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
                  marginBottom: '20px'
                }}
              >
                <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {!isLoginMode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="label-sm" htmlFor="name">Full Name</label>
                  <input 
                    id="name"
                    type="text" 
                    placeholder="Jane Doe" 
                    className="input-field" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    disabled={isLoading}
                    required={!isLoginMode}
                  />
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="label-sm" htmlFor="email">Email Address</label>
                <input 
                  id="email"
                  type="email" 
                  placeholder="jane@example.com" 
                  className="input-field" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  disabled={isLoading}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="label-sm" htmlFor="password">Password</label>
                <input 
                  id="password"
                  type="password" 
                  placeholder="••••••••" 
                  className="input-field" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  disabled={isLoading}
                  required
                />
              </div>

              {!isLoginMode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="label-sm" htmlFor="confirmPassword">Confirm Password</label>
                  <input 
                    id="confirmPassword"
                    type="password" 
                    placeholder="••••••••" 
                    className="input-field" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    disabled={isLoading}
                    required={!isLoginMode}
                  />
                </div>
              )}

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ 
                  marginTop: '8px', 
                  borderRadius: 'var(--radius-full)',
                  padding: '14px 24px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  opacity: isLoading ? 0.7 : 1
                }} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <>
                    <span>{isLoginMode ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Dithered Divider */}
            <div style={{ 
              height: '1px', 
              width: '100%', 
              margin: '24px 0',
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'4\' height=\'4\' viewBox=\'0 0 4 4\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'2\' height=\'2\' fill=\'%23FF5C00\' fill-opacity=\'0.3\'/%3E%3C/svg%3E")',
              backgroundRepeat: 'repeat-x'
            }} />

            <div style={{ textAlign: 'center' }}>
              <span className="body-md" style={{ fontSize: '0.875rem' }}>
                {isLoginMode ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                onClick={toggleMode}
                disabled={isLoading}
                style={{
                  background: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                {isLoginMode ? 'Create Account' : 'Sign In'}
              </button>
            </div>
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
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ElectricBorder from '../components/ui/ElectricBorder';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function Input({ onSearch }) {
  const [problemStatement, setProblemStatement] = useState('');
  const [limit, setLimit] = useState(5);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!problemStatement.trim()) return;
    
    // Save to local storage for persistence across dashboard views
    localStorage.setItem('problemStatement', problemStatement);
    localStorage.setItem('searchLimit', limit);
    
    onSearch(problemStatement, limit);
    navigate('/results');
  };

  return (
    <div 
      style={{ 
        minHeight: '80vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 'var(--space-lg)',
        maxWidth: '800px',
        margin: '0 auto',
        gap: 'var(--space-xl)'
      }}
    >
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        <span className="label-sm">Describe Your Idea</span>
        <h2 className="headline-lg">What problem are you trying to solve?</h2>
        <p className="body-md" style={{ maxWidth: '600px', margin: '0 auto' }}>
          Provide a detailed description of your software concept. We will query scientific databases and open-source models to recommend custom designs.
        </p>
      </div>

      <form 
        onSubmit={handleSubmit} 
        style={{ 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 'var(--space-lg)',
          alignItems: 'center'
        }}
      >
        {/* ElectricBorder wraps the primary textarea */}
        <ElectricBorder color="#FF5C00" chaos={0.08}>
          <textarea
            placeholder="Describe the problem, technologies you'd like to use, performance constraints, or feature requirements..."
            className="input-field"
            value={problemStatement}
            onChange={(e) => setProblemStatement(e.target.value)}
            style={{ 
              height: '180px', 
              resize: 'none', 
              border: 'none', 
              backgroundColor: 'transparent',
              padding: '20px',
              borderRadius: 'inherit'
            }}
          />
        </ElectricBorder>

        {/* Limit configurations & CTA button */}
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            width: '100%',
            gap: 'var(--space-md)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span className="label-sm" style={{ color: 'var(--on-surface-muted)' }}>Scan Limit:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              style={{
                backgroundColor: 'var(--surface)',
                color: 'var(--on-surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 12px',
                fontSize: '0.875rem',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer'
              }}
            >
              <option value={3}>3 Papers / Repos</option>
              <option value={5}>5 Papers / Repos</option>
              <option value={10}>10 Papers / Repos</option>
              <option value={15}>15 Papers / Repos</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={!problemStatement.trim()}
            style={{ 
              opacity: problemStatement.trim() ? 1 : 0.6,
              cursor: problemStatement.trim() ? 'pointer' : 'not-allowed',
              padding: '12px 24px',
              borderRadius: '9999px',
              fontWeight: 600
            }}
          >
            <span>Start a search</span> <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollStack } from '../components/ui/ScrollStack';
import StatTile from '../components/ui/StatTile';
import { api } from '../services/api';
import { 
  FileText, Target, Layers, Code, Download, ExternalLink, 
  Loader2, Sparkles, RefreshCw, ChevronRight, FileCode,
  X, Copy, Check, Zap
} from 'lucide-react';

const Github = ({ size = 24, ...props }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    stroke="currentColor" 
    strokeWidth="1.75" 
    fill="none" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function Results({ query, limit }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState('');
  const [papers, setPapers] = useState([]);
  const [repos, setRepos] = useState([]);
  const [differentiation, setDifferentiation] = useState(null);
  const [techStack, setTechStack] = useState(null);
  const [selectedStack, setSelectedStack] = useState({});
  const [regeneratingScaffold, setRegeneratingScaffold] = useState(false);
  const [scaffoldFiles, setScaffoldFiles] = useState({});
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [error, setError] = useState('');
  const [scaffoldError, setScaffoldError] = useState('');
  const [scaffoldSuccess, setScaffoldSuccess] = useState(false);
  const [scaffoldLastUpdated, setScaffoldLastUpdated] = useState(null);
  const [activePaper, setActivePaper] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('papers');

  const fetchResults = async () => {
    if (!query) return;
    setLoading(true);
    setError('');

    try {
      setLoadingStep('Retrieving publication matches...');
      const paperResults = await api.searchPapers(query, limit);
      setPapers(paperResults);

      setLoadingStep('Scanning GitHub repositories...');
      const repoResults = await api.searchRepos(query, limit);
      setRepos(repoResults);

      setLoadingStep('Synthesizing product differentiation angles...');
      const diffResults = await api.getDifferentiation(query, paperResults, repoResults);
      setDifferentiation(diffResults);

      setLoadingStep('Recommending architectural tech stack...');
      const stackResults = await api.getTechStack(query);
      setTechStack(stackResults);

      const initialStack = {};
      if (stackResults.recommendation) {
        Object.entries(stackResults.recommendation).forEach(([layer, options]) => {
          if (Array.isArray(options)) {
            const recommendedIdx = options.findIndex(opt => opt.recommended);
            initialStack[layer] = recommendedIdx !== -1 ? recommendedIdx : 0;
          } else {
            initialStack[layer] = 0; // Not an array, dummy value
          }
        });
      }
      setSelectedStack(initialStack);

      setLoadingStep('Generating starter code scaffold files...');
      const customTechStack = {};
      Object.entries(initialStack).forEach(([layer, selectedIdx]) => {
          const options = stackResults.recommendation[layer];
          const selectedOption = Array.isArray(options) ? options[selectedIdx] : options;
          customTechStack[layer] = selectedOption;
      });
      const codeResults = await api.generateCodeJson(query, customTechStack);
      setScaffoldFiles(codeResults.files || codeResults);

    } catch (err) {
      console.error('Pipeline Error:', err);
      // Surface actual error from the API response or use error message
      const actualError = err.response?.data?.detail || err.message || 'An unknown error occurred';
      setError(`Pipeline Error: ${actualError}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [query, limit]);

  const handleDownloadZip = async () => {
    if (!techStack) return;
    setDownloadingZip(true);
    try {
      const customTechStack = {};
      Object.entries(selectedStack).forEach(([layer, selectedIdx]) => {
          const options = techStack.recommendation[layer];
          const selectedOption = Array.isArray(options) ? options[selectedIdx] : options;
          customTechStack[layer] = selectedOption;
      });
      const blob = await api.generateCodeZipBlob(query, customTechStack);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      
      const cleanName = query.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
      link.setAttribute('download', `${cleanName || 'project'}_scaffold.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Failed to download ZIP file.', err);
    } finally {
      setDownloadingZip(false);
    }
  };

  const parseMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      const cleanLine = line.trim();
      if (cleanLine.startsWith('### ')) {
        return <h4 key={idx} style={{ color: 'var(--on-surface)', marginTop: '16px', marginBottom: '8px', fontSize: '1.05rem', fontWeight: 600 }}>{cleanLine.slice(4)}</h4>;
      }
      if (cleanLine.startsWith('## ')) {
        return <h3 key={idx} style={{ color: 'var(--on-surface)', marginTop: '20px', marginBottom: '10px', fontSize: '1.2rem', fontWeight: 600 }}>{cleanLine.slice(3)}</h3>;
      }
      if (cleanLine.startsWith('# ')) {
        return <h2 key={idx} style={{ color: 'var(--on-surface)', marginTop: '24px', marginBottom: '12px', fontSize: '1.4rem', fontWeight: 600 }}>{cleanLine.slice(2)}</h2>;
      }
      if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
        return <li key={idx} style={{ marginLeft: '16px', marginBottom: '6px', color: 'var(--on-surface-muted)', listStyleType: 'square' }}>{cleanLine.slice(2)}</li>;
      }
      if (cleanLine.match(/^\d+\.\s/)) {
        return <li key={idx} style={{ marginLeft: '16px', marginBottom: '6px', color: 'var(--on-surface-muted)' }}>{cleanLine.replace(/^\d+\.\s/, '')}</li>;
      }
      if (!cleanLine) return <div key={idx} style={{ height: '8px' }} />;
      return <p key={idx} style={{ marginBottom: '10px', color: 'var(--on-surface-muted)', fontSize: '0.9375rem' }}>{cleanLine}</p>;
    });
  };

  const handleRegenerateScaffold = async () => {
    if (!techStack || !selectedStack) return;
    setRegeneratingScaffold(true);
    setScaffoldSuccess(false);
    try {
      const customTechStack = {};
      Object.entries(selectedStack).forEach(([layer, selectedIdx]) => {
          const options = techStack.recommendation[layer];
          const selectedOption = Array.isArray(options) ? options[selectedIdx] : options;
          customTechStack[layer] = selectedOption;
      });
      const codeResults = await api.generateCodeJson(query, customTechStack);
      setScaffoldFiles(codeResults.files || codeResults);
      setScaffoldError('');
      setScaffoldLastUpdated(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
      setScaffoldSuccess(true);
      setTimeout(() => setScaffoldSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to regenerate scaffold.', err);
      setScaffoldError("Failed to regenerate scaffold: " + (err.response?.data?.detail || err.message || 'Unknown error'));
    } finally {
      setRegeneratingScaffold(false);
    }
  };

  if (loading) {
    return (
      <div 
        style={{ 
          minHeight: '85vh', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: 'var(--space-md)'
        }}
      >
        <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary)' }} />
        <span className="label-sm" style={{ color: 'var(--on-surface)' }}>{loadingStep}</span>
        <span className="jetbrains-mono" style={{ fontSize: '0.75rem', color: 'var(--on-surface-faint)' }}>
          Processing pipeline layers concurrently...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-md)' }}>
        <span className="label-sm" style={{ color: 'var(--error)' }}>Pipeline Error</span>
        <p className="body-md">{error}</p>
        <button className="btn-primary" onClick={fetchResults}>
          <RefreshCw size={16} /> Retry Analysis
        </button>
      </div>
    );
  }

  // Calculate StatTile variables
  const totalCitations = papers.reduce((sum, p) => sum + (p.citation_count || p.citationCount || 0), 0);
  const citationValues = papers.map(p => p.citation_count || p.citationCount || 0);
  const maxStars = repos.reduce((max, r) => r.stars > max ? r.stars : max, 0);
  const starValues = repos.map(r => r.stars || 0);

  const StarIcon = ({ size = 16, ...props }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" {...props}>
      <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
    </svg>
  );



  return (
    <div 
      style={{ 
        display: 'grid', 
        gridTemplateColumns: 'minmax(260px, 280px) 1fr', 
        gap: '32px', 
        width: '100%', 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: 'var(--space-md) 0',
        alignItems: 'start'
      }}
      className="results-grid"
    >
      {/* Left Column: Metadata & Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
          <StarIcon size={20} />
          <span className="jetbrains-mono" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Scholarly Archive
          </span>
        </div>

        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--on-surface)', marginBottom: '8px', lineHeight: 1.2 }}>
            Research Workspace
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-muted)', lineHeight: 1.5 }}>
            Consolidated reports, academic articles, matching codebases, and generated consoles for:
          </p>
        </div>

        <div 
          className="jetbrains-mono" 
          style={{ 
            backgroundColor: 'var(--surface)', 
            border: '1px solid var(--border)',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.8125rem',
            color: 'var(--primary)',
            wordBreak: 'break-word',
            lineHeight: 1.4
          }}
        >
          "{query}"
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          <button 
            onClick={handleDownloadZip} 
            className="btn-primary" 
            style={{ width: '100%', borderRadius: '9999px', fontWeight: 600, padding: '12px 20px' }}
            disabled={downloadingZip}
          >
            {downloadingZip ? 'Packing ZIP...' : 'Download Code ZIP'} <Download size={16} />
          </button>
          
          <button 
            onClick={() => navigate('/')} 
            className="btn-secondary" 
            style={{ width: '100%', borderRadius: '9999px', border: '1px solid var(--border-strong)', padding: '12px 20px' }}
          >
            Start New Search
          </button>
        </div>
      </div>

      {/* Right Column: Mock Browser Preview Window */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div 
          style={{ 
            backgroundColor: 'var(--surface)', 
            borderRadius: '12px', 
            border: '1px solid var(--border-strong)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            width: '100%'
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

          {/* Fixed Workspace Navigation Tabs inside browser frame */}
          <div 
            style={{ 
              backgroundColor: 'var(--elevated)', 
              borderBottom: '1px solid var(--border)',
              padding: '10px 14px',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              scrollbarWidth: 'none'
            }}
          >
            {[
              { id: 'papers', label: 'Research Papers', icon: <FileText size={14} /> },
              { id: 'repos', label: 'GitHub Repositories', icon: <Github size={14} /> },
              { id: 'gaps', label: 'Product Gaps', icon: <Target size={14} /> },
              { id: 'scaffold', label: 'Developer Scaffold', icon: <Code size={14} /> }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: isActive ? 'rgba(255, 92, 0, 0.1)' : 'transparent',
                    border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    color: isActive ? 'var(--primary)' : 'var(--on-surface-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--on-surface)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--on-surface-muted)';
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Viewport container rendering active tab panel */}
          <div 
            className="mock-viewport"
            style={{ 
              height: '470px', 
              overflowY: 'auto', 
              padding: '24px var(--space-md) 32px var(--space-md)',
              position: 'relative'
            }}
          >
            {activeTab === 'papers' && (
              /* Card 1: Publications */
              <div id="card-publications" className="halo-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="label-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--on-surface)' }}>
                    <FileText size={16} /> Publications Report
                  </span>
                  <span className="label-sm" style={{ fontSize: '0.625rem' }}>arXiv & Semantic Scholar</span>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                  <StatTile 
                    label="SCANNED PAPERS" 
                    value={papers.length.toString()} 
                    trend={10.2} 
                    sparklineData={[...papers.map((_, i) => i + 1)]}
                    color="var(--primary)" 
                  />
                  <StatTile 
                    label="TOTAL CITATIONS" 
                    value={totalCitations.toLocaleString()} 
                    trend={25.4} 
                    sparklineData={citationValues.length > 1 ? citationValues : [0, totalCitations]}
                    color="var(--success)" 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  {papers.map((paper, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setActivePaper(paper)}
                      style={{ 
                        backgroundColor: 'var(--elevated)', 
                        border: '1px solid var(--border)', 
                        borderRadius: 'var(--radius-md)', 
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s ease, transform 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--on-surface)' }}>
                          {paper.title}
                        </h4>
                        <span style={{ color: 'var(--primary)', flexShrink: 0 }}>
                          <ChevronRight size={16} />
                        </span>
                      </div>
                      <span className="label-sm" style={{ fontSize: '0.6875rem' }}>
                        By: {paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 && ' et al.'}
                      </span>
                      <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-muted)', lineHeight: 1.4 }}>
                        {paper.abstract ? `${paper.abstract.substring(0, 180)}...` : 'No abstract summary available.'}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                          <span className="jetbrains-mono" style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
                            Citations: {paper.citation_count || paper.citationCount || 0}
                          </span>
                          <span className="jetbrains-mono" style={{ fontSize: '0.75rem', color: 'var(--on-surface-faint)' }}>
                            Year: {paper.year || 'N/A'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                          Read Paper
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'repos' && (
              /* Card 2: Repositories */
              <div id="card-repositories" className="halo-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="label-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--on-surface)' }}>
                    <Github size={16} /> GitHub Repositories
                  </span>
                  <span className="label-sm" style={{ fontSize: '0.625rem' }}>GitHub Codebases</span>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                  <StatTile 
                    label="MATCHED REPOS" 
                    value={repos.length.toString()} 
                    trend={15.8} 
                    sparklineData={[...repos.map((_, i) => i + 1)]}
                    color="var(--primary)" 
                  />
                  <StatTile 
                    label="MAX STARS" 
                    value={maxStars.toLocaleString()} 
                    trend={12.4} 
                    sparklineData={starValues.length > 1 ? starValues : [0, maxStars]}
                    color="var(--warning)" 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  {repos.map((repo, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        backgroundColor: 'var(--elevated)', 
                        border: '1px solid var(--border)', 
                        borderRadius: 'var(--radius-md)', 
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--on-surface)' }}>
                          {repo.name}
                        </h4>
                        <a href={repo.url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>
                          <ExternalLink size={16} />
                        </a>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-muted)', lineHeight: 1.4 }}>
                        {repo.description || 'No repository description details provided.'}
                      </p>
                      <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: '4px' }}>
                        <span className="jetbrains-mono" style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>
                          ★ {repo.stars.toLocaleString()} stars
                        </span>
                        <span className="jetbrains-mono" style={{ fontSize: '0.75rem', color: 'var(--info)' }}>
                          ⑂ {repo.forks.toLocaleString()} forks
                        </span>
                        {repo.language && (
                          <span className="jetbrains-mono" style={{ fontSize: '0.75rem', color: 'var(--on-surface-faint)' }}>
                            Language: {repo.language}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'gaps' && (
              /* Card 3: Product Differentiation */
              <div id="card-differentiation" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                {differentiation ? (
                  <>
                    <div className="halo-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="label-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--on-surface)' }}>
                          <Target size={16} /> Existing Landscape Summary
                        </span>
                      </div>
                      <div style={{ backgroundColor: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                        <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--on-surface)', whiteSpace: 'pre-wrap' }}>
                          {differentiation.existing_landscape_summary?.replace(/\\n/g, '\n')}
                        </p>
                      </div>
                    </div>

                    <div className="halo-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderColor: 'var(--primary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="label-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)' }}>
                          <Target size={16} /> Identified Gap
                        </span>
                        <span className="label-sm" style={{ fontSize: '0.625rem', color: 'var(--primary)' }}>Genuinely New Direction</span>
                      </div>
                      <div style={{ backgroundColor: 'rgba(255, 92, 0, 0.05)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                        <p style={{ fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.6, color: 'var(--on-surface)', whiteSpace: 'pre-wrap' }}>
                          {differentiation.identified_gap?.replace(/\\n/g, '\n')}
                        </p>
                      </div>
                    </div>

                    <div className="halo-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="label-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--on-surface)' }}>
                          <Layers size={16} /> Why This Gap Exists
                        </span>
                      </div>
                      <div style={{ backgroundColor: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                        <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--on-surface-muted)', whiteSpace: 'pre-wrap' }}>
                          {differentiation.why_this_gap_exists?.replace(/\\n/g, '\n')}
                        </p>
                      </div>
                    </div>

                    <div className="halo-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'linear-gradient(to bottom right, var(--surface), var(--elevated))' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="label-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)' }}>
                          <Zap size={16} /> Suggested Product Direction
                        </span>
                      </div>
                      <div style={{ backgroundColor: 'var(--elevated)', border: '1px solid var(--success)', borderRadius: 'var(--radius-md)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--on-surface)' }}>
                            {differentiation.suggested_product_direction?.title}
                          </h3>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>
                              {differentiation.suggested_product_direction?.feasibility_score}/10
                            </span>
                            <span style={{ fontSize: '0.625rem', color: 'var(--on-surface-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Feasibility
                            </span>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--on-surface)', whiteSpace: 'pre-wrap' }}>
                          {differentiation.suggested_product_direction?.description?.replace(/\\n/g, '\n')}
                        </p>
                        <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                          <span className="label-sm" style={{ color: 'var(--on-surface-muted)', marginBottom: '4px', display: 'block' }}>Justification</span>
                          <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-faint)', whiteSpace: 'pre-wrap' }}>
                            {differentiation.suggested_product_direction?.justification?.replace(/\\n/g, '\n')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--on-surface-muted)' }}>
                    <p>No differentiation data available.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'scaffold' && (
              /* Combined Architectural Tech Stack & Code Scaffold */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Card 4: Recommended Tech Stack */}
                <div id="card-tech-stack" className="halo-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="label-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--on-surface)' }}>
                      <Layers size={16} /> Architectural Layers
                    </span>
                    <span className="label-sm" style={{ fontSize: '0.625rem' }}>Optimized Stack</span>
                  </div>

                  {techStack && (
                    <>
                      <div 
                        style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                          gap: 'var(--space-md)' 
                        }}
                      >
                        {Object.entries(techStack.recommendation).map(([layer, options], idx) => {
                          const isArray = Array.isArray(options);
                          const selectedIdx = selectedStack[layer];
                          const selectedOption = isArray 
                            ? options[selectedIdx] || options[0] 
                            : options;
                          
                          const getComplexityColor = (complexity) => {
                            if (complexity === 'Beginner') return 'var(--success)';
                            if (complexity === 'Intermediate') return 'var(--warning)';
                            if (complexity === 'Advanced') return 'var(--error)';
                            return 'var(--primary)';
                          };
                            
                          return (
                          <div 
                            key={idx} 
                            className="halo-card" 
                            style={{ 
                              padding: '16px', 
                              backgroundColor: 'var(--elevated)', 
                              display: 'flex', 
                              flexDirection: 'column', 
                              gap: '12px' 
                            }}
                          >
                            <span className="label-sm" style={{ fontSize: '0.625rem' }}>{layer}</span>
                            
                            {isArray ? (
                              <select 
                                value={selectedIdx !== undefined ? selectedIdx : 0}
                                onChange={(e) => setSelectedStack(prev => ({ ...prev, [layer]: parseInt(e.target.value) }))}
                                className="jetbrains-mono"
                                style={{
                                  backgroundColor: 'var(--surface)',
                                  color: 'var(--on-surface)',
                                  border: '1px solid var(--border)',
                                  borderRadius: '6px',
                                  padding: '8px',
                                  fontSize: '0.875rem',
                                  outline: 'none',
                                  width: '100%',
                                  cursor: 'pointer'
                                }}
                              >
                                {options.map((opt, oIdx) => (
                                  <option key={oIdx} value={oIdx}>
                                    {opt.name} {opt.recommended ? '(Default)' : ''}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="jetbrains-mono" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)' }}>
                                {selectedOption.technology || selectedOption.name}
                              </span>
                            )}
                            
                            {selectedOption.complexity && (
                              <span style={{ 
                                display: 'inline-block', 
                                padding: '2px 8px', 
                                borderRadius: '12px', 
                                fontSize: '0.625rem', 
                                fontWeight: 600,
                                alignSelf: 'flex-start',
                                backgroundColor: `color-mix(in srgb, ${getComplexityColor(selectedOption.complexity)} 15%, transparent)`,
                                color: getComplexityColor(selectedOption.complexity),
                                border: `1px solid color-mix(in srgb, ${getComplexityColor(selectedOption.complexity)} 30%, transparent)`
                              }}>
                                {selectedOption.complexity}
                              </span>
                            )}

                            <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-muted)', lineHeight: 1.4 }}>
                              {selectedOption.reason || selectedOption.description}
                            </p>
                          </div>
                        )})}
                      </div>

                      <div style={{ backgroundColor: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '24px', marginTop: '4px' }}>
                        {parseMarkdown(techStack.explanation)}
                      </div>
                    </>
                  )}
                </div>

                {/* Card 5: Starter Code Scaffold */}
                <div id="card-scaffold" className="halo-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="label-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--on-surface)' }}>
                      <Code size={16} /> Starter Code Scaffold
                    </span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {scaffoldSuccess && (
                        <span style={{ color: 'var(--primary)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px', animation: 'fadeIn 0.3s ease' }}>
                          <Check size={14} /> Regenerated!
                        </span>
                      )}
                      <button 
                        className="btn-secondary" 
                        onClick={handleRegenerateScaffold}
                        disabled={regeneratingScaffold || downloadingZip}
                        style={{ padding: '6px 16px', fontSize: '0.8125rem', borderRadius: '9999px', border: '1px solid var(--border-strong)', backgroundColor: 'transparent', color: 'var(--on-surface)', cursor: 'pointer' }}
                      >
                        {regeneratingScaffold ? <Loader2 className="animate-spin" size={14} style={{display: 'inline-block', verticalAlign: 'middle'}}/> : <RefreshCw size={14} style={{display: 'inline-block', verticalAlign: 'middle'}}/>} 
                        <span style={{display: 'inline-block', verticalAlign: 'middle', marginLeft: '6px'}}>Regenerate Scaffold</span>
                      </button>
                      <button 
                        className="btn-primary" 
                        onClick={handleDownloadZip}
                        disabled={downloadingZip || regeneratingScaffold}
                        style={{ padding: '6px 16px', fontSize: '0.8125rem', borderRadius: '9999px', cursor: 'pointer' }}
                      >
                        {downloadingZip ? <Loader2 className="animate-spin" size={14} style={{display: 'inline-block', verticalAlign: 'middle'}}/> : <Download size={14} style={{display: 'inline-block', verticalAlign: 'middle'}}/>} 
                        <span style={{display: 'inline-block', verticalAlign: 'middle', marginLeft: '6px'}}>Download Zip Scaffold</span>
                      </button>
                    </div>
                    {scaffoldError && (
                      <div style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '12px', padding: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', borderRadius: '6px' }}>
                        {scaffoldError}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="label-sm" style={{ fontSize: '0.625rem', color: 'var(--on-surface-muted)' }}>Generated File Scaffold Structure</span>
                      {scaffoldLastUpdated && (
                        <span style={{ fontSize: '0.625rem', color: 'var(--on-surface-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                          Last updated {scaffoldLastUpdated}
                        </span>
                      )}
                    </div>
                    
                    <div 
                      className="jetbrains-mono" 
                      style={{ 
                        backgroundColor: 'var(--elevated)', 
                        border: '1px solid var(--border)', 
                        borderRadius: 'var(--radius-md)',
                        padding: '20px',
                        fontSize: '0.8125rem',
                        color: 'var(--on-surface)',
                        maxHeight: '350px',
                        overflowY: 'auto'
                      }}
                    >
                      {Object.entries(scaffoldFiles).map(([path, content], idx) => (
                        <div key={idx} style={{ marginBottom: '16px' }}>
                          <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                            <FileCode size={14} />
                            <span>{path}</span>
                          </div>
                          <pre style={{ overflowX: 'auto', paddingLeft: '22px', whiteSpace: 'pre-wrap', color: 'var(--on-surface-muted)' }}>
                            {content}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Carousel slide selector mapped to activeTab states */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-start' }}>
          {[
            { id: 'papers', label: '01 / Publications' },
            { id: 'repos', label: '02 / Repositories' },
            { id: 'gaps', label: '03 / Differentiation' },
            { id: 'scaffold', label: '04 / Developer Scaffold' }
          ].map((slide, idx) => {
            const isActive = activeTab === slide.id;
            return (
              <button
                key={idx}
                onClick={() => setActiveTab(slide.id)}
                style={{
                  backgroundColor: isActive ? 'rgba(255, 92, 0, 0.08)' : 'var(--surface)',
                  border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  color: isActive ? 'var(--primary)' : 'var(--on-surface-muted)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'JetBrains Mono, monospace'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.color = 'var(--on-surface)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--on-surface-muted)';
                  }
                }}
              >
                {slide.label}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Styles for responsiveness */}
      <style>{`
        @media (max-width: 800px) {
          .results-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
        }
        @media (max-width: 900px) {
          .reader-content-split {
            grid-template-columns: 1fr !important;
            grid-template-rows: 1fr 1fr !important;
            overflow-y: auto !important;
          }
          .reader-content-split > div {
            border-right: none !important;
            border-bottom: 1px solid var(--border) !important;
            height: auto !important;
            overflow-y: visible !important;
          }
        }
      `}</style>

      {activePaper && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(16px)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px'
          }}
        >
          {/* Modal Container */}
          <div 
            style={{
              width: '100%',
              maxWidth: '1200px',
              height: '90vh',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: '16px',
              display: 'grid',
              gridTemplateRows: 'auto 1fr',
              overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(0,0,0,0.9)'
            }}
          >
            {/* Modal Header */}
            <div 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 24px',
                borderBottom: '1px solid var(--border)',
                backgroundColor: 'var(--elevated)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StarIcon size={18} style={{ color: 'var(--primary)' }} />
                <span className="jetbrains-mono" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--on-surface-muted)' }}>
                  SCHOLARLY READER
                </span>
              </div>
              <button 
                onClick={() => {
                  setActivePaper(null);
                  setCopied(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--on-surface-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.875rem'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--on-surface)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--on-surface-muted)'}
              >
                Close <X size={16} />
              </button>
            </div>

            {/* Modal Content - Two Columns */}
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.2fr',
                height: '100%',
                overflow: 'hidden'
              }}
              className="reader-content-split"
            >
              {/* Left Column: Metadata & Abstract */}
              <div 
                style={{
                  padding: '32px 24px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  borderRight: '1px solid var(--border)',
                  height: '100%'
                }}
              >
                {/* Subject / Year Capsules */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '0.6875rem', padding: '4px 10px', borderRadius: '4px', backgroundColor: 'var(--elevated)', border: '1px solid var(--border)', fontWeight: 600, color: 'var(--primary)' }}>
                    YEAR: {activePaper.year || 'N/A'}
                  </span>
                  <span style={{ fontSize: '0.6875rem', padding: '4px 10px', borderRadius: '4px', backgroundColor: 'var(--elevated)', border: '1px solid var(--border)', fontWeight: 600, color: 'var(--success)' }}>
                    CITATIONS: {activePaper.citation_count || activePaper.citationCount || 0}
                  </span>
                  {(activePaper.open_access_pdf || activePaper.openAccessPdf) && (
                    <span style={{ fontSize: '0.6875rem', padding: '4px 10px', borderRadius: '4px', backgroundColor: 'rgba(48, 213, 200, 0.1)', border: '1px solid var(--success)', fontWeight: 600, color: 'var(--success)' }}>
                      PDF AVAILABLE
                    </span>
                  )}
                </div>

                {/* Title & Authors */}
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.2, color: 'var(--on-surface)', marginBottom: '12px' }}>
                    {activePaper.title}
                  </h3>
                  <p className="jetbrains-mono" style={{ fontSize: '0.8125rem', color: 'var(--on-surface-muted)', lineHeight: 1.5 }}>
                    Authors: {activePaper.authors.join(', ')}
                  </p>
                </div>

                {/* Abstract Text */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                  <h4 className="label-sm" style={{ marginBottom: '8px', color: 'var(--on-surface)' }}>Abstract</h4>
                  <p style={{ fontSize: '0.9375rem', color: 'var(--on-surface-muted)', lineHeight: 1.6 }}>
                    {activePaper.abstract || 'No abstract summary description is available for this publication.'}
                  </p>
                </div>

                {/* Auto-compiled BibTeX snippet */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 className="label-sm" style={{ color: 'var(--on-surface)' }}>BibTeX Citation</h4>
                    <button
                      onClick={() => {
                        const bibtexText = `@article{arxiv:${activePaper.title.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 15)},\n  title={${activePaper.title}},\n  author={${activePaper.authors.join(' and ')}},\n  journal={arXiv preprint},\n  year={${activePaper.year || new Date().getFullYear()}}\n}`;
                        navigator.clipboard.writeText(bibtexText);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: copied ? 'var(--success)' : 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      {copied ? (
                        <>
                          <Check size={12} /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> Copy Citation
                        </>
                      )}
                    </button>
                  </div>
                  <pre 
                    className="jetbrains-mono"
                    style={{
                      backgroundColor: 'var(--elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      fontSize: '0.75rem',
                      color: 'var(--on-surface-muted)',
                      whiteSpace: 'pre-wrap',
                      overflowX: 'auto',
                      lineHeight: 1.4
                    }}
                  >
{`@article{arxiv:${activePaper.title.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 15)},
  title={${activePaper.title}},
  author={${activePaper.authors.join(' and ')}},
  journal={arXiv preprint},
  year={${activePaper.year || new Date().getFullYear()}}
}`}
                  </pre>
                </div>
              </div>

              {/* Right Column: Embedded PDF Viewer */}
              <div 
                style={{
                  padding: '24px',
                  backgroundColor: 'var(--elevated)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}
              >
                {(activePaper.open_access_pdf || activePaper.openAccessPdf) ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="label-sm" style={{ fontSize: '0.625rem' }}>Integrated PDF Viewport</span>
                      <a 
                        href={activePaper.open_access_pdf || activePaper.openAccessPdf} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px' }}
                      >
                        Open In New Tab <ExternalLink size={12} />
                      </a>
                    </div>
                    <div style={{ flex: 1, backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                      <iframe 
                        src={`${activePaper.open_access_pdf || activePaper.openAccessPdf}#toolbar=0&navpanes=0`} 
                        title={activePaper.title}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '16px', border: '1px dashed var(--border-strong)', borderRadius: '8px' }}>
                    <FileText size={48} style={{ color: 'var(--on-surface-faint)' }} />
                    <div style={{ textAlign: 'center' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '4px' }}>PDF Viewer Unavailable</h4>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-muted)', maxWidth: '280px', margin: '0 auto', lineHeight: 1.4 }}>
                        This paper does not provide an open-access direct PDF URL. You can check the paper page using the button below.
                      </p>
                    </div>
                    {activePaper.url && (
                      <a 
                        href={activePaper.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn-primary" 
                        style={{ borderRadius: '9999px', fontSize: '0.8125rem', padding: '10px 20px' }}
                      >
                        Visit External Source <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

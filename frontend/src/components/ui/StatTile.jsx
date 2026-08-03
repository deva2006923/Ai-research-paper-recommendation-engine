import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatTile({ label, value, trend, sparklineData = [], color = 'var(--primary)' }) {
  // Generate sparkline SVG path points dynamically
  const width = 80;
  const height = 32;
  
  let pointsStr = '';
  if (sparklineData.length > 1) {
    const minVal = Math.min(...sparklineData);
    const maxVal = Math.max(...sparklineData);
    const valRange = maxVal - minVal || 1;
    
    pointsStr = sparklineData
      .map((val, idx) => {
        const x = (idx / (sparklineData.length - 1)) * width;
        // Keep 2px padding top and bottom to avoid line clipping
        const y = height - 2 - ((val - minVal) / valRange) * (height - 4);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  const isPositive = trend >= 0;
  const trendColor = isPositive ? 'var(--success)' : 'var(--error)';

  return (
    <div 
      className="halo-card" 
      style={{ 
        position: 'relative', 
        borderTop: `2px solid ${color}`,
        borderTopLeftRadius: '4px',
        borderTopRightRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-sm)',
        minWidth: '200px',
        flex: '1'
      }}
    >
      {/* Eyebrow Label */}
      <span className="label-sm" style={{ display: 'block', fontSize: '0.6875rem' }}>{label}</span>
      
      {/* Metric Value & Trend/Sparkline Row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
        <span className="jetbrains-mono" style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--on-surface)' }}>
          {value}
        </span>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          {/* Trend Chip */}
          <div 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              color: trendColor, 
              fontSize: '0.75rem', 
              fontWeight: 600,
              gap: '2px'
            }}
          >
            {isPositive ? <ArrowUpRight size={14} strokeWidth={2.5} /> : <ArrowDownRight size={14} strokeWidth={2.5} />}
            <span className="jetbrains-mono">{Math.abs(trend)}%</span>
          </div>

          {/* SVG Sparkline */}
          {pointsStr && (
            <svg width={width} height={height} style={{ overflow: 'visible' }}>
              <polyline
                fill="none"
                stroke={color}
                strokeWidth="1.75"
                points={pointsStr}
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

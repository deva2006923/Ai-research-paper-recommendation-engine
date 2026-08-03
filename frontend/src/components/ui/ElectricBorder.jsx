import React from 'react';
import './ElectricBorder.css';

export default function ElectricBorder({ children, color = '#5B6BFF', chaos = 0.08 }) {
  const glowStyle = {
    '--glow-color': color,
    '--glow-intensity': chaos,
  };

  return (
    <div className="electric-border-container" style={glowStyle}>
      <div className="electric-border-glow"></div>
      <div className="electric-border-inner">
        {children}
      </div>
    </div>
  );
}

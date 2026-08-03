import React from 'react';
import './ScrollStack.css';

export function ScrollStack({ children }) {
  return (
    <div className="scroll-stack-container">
      {React.Children.map(children, (child, idx) => {
        if (!child) return null;
        return (
          <div 
            className="scroll-stack-item" 
            style={{ 
              top: `calc(40px + ${idx * 32}px)`,
              zIndex: idx + 1 
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}

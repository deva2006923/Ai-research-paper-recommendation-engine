import React, { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

export default function SplitText({ text, className }) {
  const containerRef = useRef(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    const words = containerRef.current.querySelectorAll('.word');
    gsap.fromTo(words, 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out' }
    );
  }, { scope: containerRef });

  if (!text) return null;

  return (
    <span ref={containerRef} className={className} style={{ display: 'inline-block' }}>
      {text.split(' ').map((word, idx) => (
        <span 
          key={idx} 
          className="word" 
          style={{ display: 'inline-block', marginRight: '0.25em', willChange: 'transform, opacity' }}
        >
          {word}
        </span>
      ))}
    </span>
  );
}

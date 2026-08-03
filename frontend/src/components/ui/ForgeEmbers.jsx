import React, { useEffect, useRef } from 'react';

export default function ForgeEmbers() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle class for crisp, pixelated forge embers
    class Ember {
      constructor() {
        this.reset();
        // Start at random heights on load so they are pre-distributed
        this.y = Math.random() * height;
      }

      reset() {
        this.size = Math.random() > 0.6 ? 4 : 2; // pixelated square sizes
        this.x = Math.random() * width;
        this.y = height + Math.random() * 20;
        this.speedY = -(Math.random() * 0.7 + 0.3); // slow upward drift
        this.speedX = Math.random() * 0.4 - 0.2; // subtle drift left/right
        this.wobbleSpeed = Math.random() * 0.03 + 0.01;
        this.wobbleAngle = Math.random() * Math.PI * 2;
        this.alpha = Math.random() * 0.14 + 0.03; // low opacity so it remains background atmospheric
        this.maxLife = Math.random() * 250 + 150;
        this.life = this.maxLife;
      }

      update() {
        this.y += this.speedY;
        this.wobbleAngle += this.wobbleSpeed;
        this.x += this.speedX + Math.sin(this.wobbleAngle) * 0.15;
        this.life--;

        // Reset if it flows offscreen or dies
        if (this.y < 0 || this.life <= 0) {
          this.reset();
        }
      }

      draw() {
        ctx.fillStyle = `rgba(255, 92, 0, ${this.alpha * (this.life / this.maxLife)})`;
        // Math.floor guarantees crisp square pixels without anti-alias blur
        ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.size, this.size);
      }
    }

    const emberCount = Math.min(Math.floor((width * height) / 20000), 80);
    const embers = Array.from({ length: emberCount }, () => new Ember());

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle retro scanline horizontal filter
      ctx.fillStyle = 'rgba(255, 255, 255, 0.006)';
      for (let i = 0; i < height; i += 4) {
        ctx.fillRect(0, i, width, 1);
      }

      // Draw embers
      embers.forEach((ember) => {
        ember.update();
        ember.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0, // sits behind all page content layers
        pointerEvents: 'none',
        backgroundColor: '#000000'
      }}
    />
  );
}

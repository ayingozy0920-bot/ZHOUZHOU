import React, { useEffect, useRef } from 'react';

export default function SnowBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = 380;
    let height = canvas.height = 700;

    const snowflakes: { x: number; y: number; r: number; d: number; v: number; s: number }[] = [];
    const maxFlakes = 45;

    for (let i = 0; i < maxFlakes; i++) {
      snowflakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 3 + 1,
        d: Math.random() * maxFlakes,
        v: Math.random() * 1.2 + 0.4,
        s: Math.random() * 0.5
      });
    }

    let animationFrame: number;
    let angle = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Soft ocean gradient background tint
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(224, 242, 254, 0.2)');
      gradient.addColorStop(1, 'rgba(186, 230, 253, 0.15)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      snowflakes.forEach(flake => {
        ctx.moveTo(flake.x, flake.y);
        ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2, true);
      });
      ctx.fill();

      // update
      angle += 0.01;
      snowflakes.forEach(flake => {
        flake.y += flake.v;
        flake.x += Math.sin(angle + flake.d) * 0.5;

        if (flake.y > height + 10) {
          flake.y = -10;
          flake.x = Math.random() * width;
        }
      });

      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none z-10 w-full h-full opacity-80" 
    />
  );
}

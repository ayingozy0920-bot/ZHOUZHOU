import React, { useEffect, useRef } from 'react';

export default function RainyBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = 380;
    let height = canvas.height = 700;

    const raindrops: { x: number; y: number; l: number; v: number; o: number }[] = [];
    const maxRaindrops = 60;

    for (let i = 0; i < maxRaindrops; i++) {
      raindrops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        l: Math.random() * 20 + 15,
        v: Math.random() * 2 + 1,
        o: Math.random() * 0.2 + 0.05
      });
    }

    // Static condensation drops
    const staticDrops: { x: number; y: number; r: number; o: number }[] = [];
    for (let i = 0; i < 120; i++) {
      staticDrops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 4 + 1,
        o: Math.random() * 0.3 + 0.1
      });
    }

    let animationFrame: number;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Foggy effect
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(255, 240, 245, 0.12)');
      gradient.addColorStop(0.5, 'rgba(255, 240, 245, 0.08)');
      gradient.addColorStop(1, 'rgba(255, 240, 245, 0.15)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw frosted cat face in background
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.translate(width / 2, height / 2 + 50);
      
      // Cat Head Outline (frosted look)
      ctx.beginPath();
      ctx.arc(0, 0, 100, Math.PI * 0.1, Math.PI * 0.9, true);
      // Ears
      ctx.lineTo(-100, -100);
      ctx.lineTo(-40, -80);
      ctx.lineTo(40, -80);
      ctx.lineTo(100, -100);
      ctx.closePath();
      ctx.strokeStyle = '#FFC0CB';
      ctx.lineWidth = 8;
      ctx.lineJoin = 'round';
      ctx.stroke();
      
      // Eyes
      ctx.fillStyle = '#FFC0CB';
      ctx.beginPath();
      ctx.arc(-35, -20, 12, 0, Math.PI * 2);
      ctx.fill();
      
      // Cross Eye
      ctx.beginPath();
      ctx.moveTo(25, -30);
      ctx.lineTo(45, -10);
      ctx.moveTo(45, -30);
      ctx.lineTo(25, -10);
      ctx.lineWidth = 8;
      ctx.stroke();
      
      // Mouth/Nose
      ctx.beginPath();
      ctx.arc(0, 10, 5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();

      ctx.lineCap = 'round';

      // Draw falling raindrops
      raindrops.forEach(drop => {
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y + drop.l);
        ctx.strokeStyle = `rgba(255, 192, 203, ${drop.o})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        drop.y += drop.v;
        if (drop.y > height) {
          drop.y = -drop.l;
          drop.x = Math.random() * width;
        }
      });

      // Draw static condensation drops
      staticDrops.forEach(drop => {
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, drop.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 192, 203, ${drop.o})`;
        ctx.fill();
        
        // Add a little highlight to drops
        ctx.beginPath();
        ctx.arc(drop.x - drop.r * 0.3, drop.y - drop.r * 0.3, drop.r * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 192, 203, 0.4)';
        ctx.fill();
      });

      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full opacity-80"
        style={{ filter: 'blur(0.5px)' }}
      />
      {/* Overlay text like in screenshot */}
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none select-none">
        <div className="text-[#FFC0CB] text-4xl font-bold whitespace-nowrap rotate-[-5deg] font-serif">
          我只是一只
        </div>
        <div className="text-[#FFC0CB] text-3xl font-bold whitespace-nowrap translate-x-12 mt-2 rotate-[5deg] font-serif">
          小猫
        </div>
      </div>
    </div>
  );
}

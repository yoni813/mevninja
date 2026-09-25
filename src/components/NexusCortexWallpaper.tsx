import React, { useEffect, useRef } from 'react';

interface NexusCortexWallpaperProps {
  opacity?: number; // 0 to 1
  showGrid?: boolean;
  showRays?: boolean;
  showAscendingArrows?: boolean;
  className?: string;
  variant?: 'cinematic' | 'ambient' | 'subtle';
  theme?: 'dark' | 'light';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  pulsePhase: number;
}

interface AscendingTrace {
  x: number;
  y: number;
  length: number;
  speed: number;
  color: string;
  opacity: number;
  width: number;
}

export const NexusCortexWallpaper: React.FC<NexusCortexWallpaperProps> = ({
  opacity,
  showGrid = true,
  showRays = true,
  showAscendingArrows = true,
  className = '',
  variant = 'cinematic',
  theme = 'dark'
}) => {
  const isLight = theme === 'light';
  const defaultOpacity = opacity !== undefined ? opacity : (isLight ? 0.8 : 0.65);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dynamic Animated Background Engine (HTML5 Canvas)
  useEffect(() => {
    if (variant === 'subtle') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate Particles for Neural Web
    const particleCount = variant === 'cinematic' ? 45 : 25;
    const particles: Particle[] = [];
    const colors = isLight
      ? ['#0284c7', '#0ea5e9', '#059669', '#10b981', '#14b8a6']
      : ['#00a3ff', '#38bdf8', '#10b981', '#34d399', '#a3e635'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2 + 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.3,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }

    // Generate Ascending Upward Telemetry Vectors (matching IMG_5841 & IMG_5840)
    const traceCount = variant === 'cinematic' ? 14 : 7;
    const traces: AscendingTrace[] = [];
    for (let i = 0; i < traceCount; i++) {
      traces.push({
        x: Math.random() * width,
        y: Math.random() * height + height * 0.2,
        length: Math.random() * 120 + 80,
        speed: Math.random() * 1.5 + 0.8,
        color: Math.random() > 0.45 ? (isLight ? '#0284c7' : '#38bdf8') : (isLight ? '#059669' : '#34d399'),
        opacity: Math.random() * 0.4 + 0.2,
        width: Math.random() * 1.8 + 1
      });
    }

    let tick = 0;

    const render = () => {
      tick += 0.02;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Ascending Energy Traces (Upward circuit arrows)
      if (showAscendingArrows) {
        traces.forEach((trace) => {
          trace.y -= trace.speed;
          if (trace.y + trace.length < 0) {
            trace.y = height + Math.random() * 100;
            trace.x = Math.random() * width;
          }

          const grad = ctx.createLinearGradient(trace.x, trace.y + trace.length, trace.x, trace.y);
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(0.7, trace.color);
          grad.addColorStop(1, '#ffffff');

          ctx.beginPath();
          ctx.moveTo(trace.x, trace.y + trace.length);
          ctx.lineTo(trace.x, trace.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = trace.width;
          ctx.globalAlpha = trace.opacity;
          ctx.stroke();

          // Upward Arrowhead
          ctx.beginPath();
          ctx.moveTo(trace.x - 3, trace.y + 6);
          ctx.lineTo(trace.x, trace.y);
          ctx.lineTo(trace.x + 3, trace.y + 6);
          ctx.strokeStyle = trace.color;
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.globalAlpha = 1;
        });
      }

      // 2. Draw Connected Neural Mesh Filaments
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        // Move
        p1.x += p1.vx;
        p1.y += p1.vy;

        // Wrap around bounds
        if (p1.x < 0) p1.x = width;
        if (p1.x > width) p1.x = 0;
        if (p1.y < 0) p1.y = height;
        if (p1.y > height) p1.y = 0;

        // Connect near neighbors
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            const filamentAlpha = (1 - dist / 140) * (isLight ? 0.25 : 0.35);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p1.color;
            ctx.globalAlpha = filamentAlpha;
            ctx.lineWidth = 0.8;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }

        // Draw particle node
        const pulse = Math.sin(tick + p1.pulsePhase) * 0.4 + 0.8;
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = p1.color;
        ctx.globalAlpha = p1.alpha * (isLight ? 0.7 : 0.85);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // 3. Central Infinity Singularity Beams
      if (showRays && variant === 'cinematic') {
        const cx = width / 2;
        const cy = height * 0.38;

        const pulse = Math.sin(tick * 1.5) * 0.2 + 0.8;
        const coreGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 180 * pulse);
        if (isLight) {
          coreGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
          coreGrad.addColorStop(0.4, 'rgba(16, 185, 129, 0.2)');
          coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        } else {
          coreGrad.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
          coreGrad.addColorStop(0.35, 'rgba(16, 185, 129, 0.25)');
          coreGrad.addColorStop(1, 'rgba(6, 9, 19, 0)');
        }

        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 180 * pulse, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [variant, isLight, showAscendingArrows, showRays]);

  return (
    <div 
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none transition-colors duration-500 ${className}`} 
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Background Base Tint */}
      <div 
        className={`absolute inset-0 transition-colors duration-500 ${
          isLight ? 'bg-[#EEF2F6]' : 'bg-[#04060B]'
        }`} 
      />

      {/* SVG Wallpaper Graphic Layer */}
      <div 
        className="absolute inset-0 transition-opacity duration-700 ease-in-out flex items-center justify-center"
        style={{ opacity: defaultOpacity }}
      >
        <img
          src={isLight ? '/hft-light-wallpaper.svg' : '/nexus-cortex-wallpaper.svg'}
          alt={isLight ? 'High-Frequency Trading App Wallpaper' : 'Nexus Cortex Wallpaper'}
          className="w-full h-full object-cover object-center transform scale-100 sm:scale-105"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* HTML5 Canvas Dynamic Animated Neural Web & Telemetry Vectors */}
      {variant !== 'subtle' && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ mixBlendMode: isLight ? 'multiply' : 'screen' }}
        />
      )}

      {/* Ambient Radial Color Washes (Blue Nexus & Green Cortex) */}
      {isLight ? (
        <>
          <div className="absolute -top-32 -left-32 w-[650px] h-[650px] bg-sky-400/25 rounded-full blur-[140px]" />
          <div className="absolute -top-32 -right-32 w-[650px] h-[650px] bg-emerald-400/25 rounded-full blur-[140px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[480px] bg-cyan-300/20 rounded-full blur-[140px]" />
          
          {/* Studio Clean Contrast Vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-slate-200/50" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#CBD5E1_85%)] opacity-35" />
        </>
      ) : (
        <>
          <div className="absolute -top-40 -left-40 w-[650px] h-[650px] bg-blue-600/15 rounded-full blur-[140px]" />
          <div className="absolute -top-40 -right-40 w-[650px] h-[650px] bg-emerald-500/15 rounded-full blur-[140px]" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[400px] bg-cyan-500/20 rounded-full blur-[130px]" />

          {/* Deep Space Vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#04060B]/50 via-transparent to-[#04060B]/95" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#04060B_85%)] opacity-85" />
        </>
      )}

      {/* High-Tech Grid Overlay */}
      {showGrid && (
        <div 
          className={`absolute inset-0 bg-[size:36px_36px] ${
            isLight 
              ? 'bg-[linear-gradient(to_right,#64748b0d_1px,transparent_1px),linear-gradient(to_bottom,#64748b0d_1px,transparent_1px)] opacity-70' 
              : 'bg-[linear-gradient(to_right,#0ea5e90d_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e90d_1px,transparent_1px)] opacity-80'
          }`} 
        />
      )}
    </div>
  );
};

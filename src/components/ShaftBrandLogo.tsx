import React from 'react';
import { NexusCortexLogo } from './NexusCortexLogo';

interface ShaftBrandLogoProps {
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const ShaftBrandLogo: React.FC<ShaftBrandLogoProps> = ({
  theme = 'dark',
  size = 'md',
  showSubtitle = true
}) => {
  const isLight = theme === 'light';

  return (
    <div className="flex flex-col items-center justify-center text-center select-none">
      {/* Visual Logo Mark with Glow */}
      <div className="relative group flex items-center justify-center mb-3">
        <div className={`absolute -inset-4 rounded-full blur-2xl opacity-60 group-hover:opacity-90 transition-opacity ${
          isLight
            ? 'bg-gradient-to-r from-sky-400/40 via-cyan-300/30 to-emerald-400/40'
            : 'bg-gradient-to-r from-cyan-500/30 via-sky-600/20 to-emerald-500/30'
        }`} />
        <NexusCortexLogo 
          size={size === 'lg' ? 'xl' : size === 'sm' ? 'sm' : 'md'} 
          theme={theme} 
          pulse={true} 
        />
      </div>

      {/* Institutional Brand Abbreviation: S.H.A.F.T. (With Dots) */}
      <div className="flex items-center justify-center space-x-1 tracking-widest font-black font-mono">
        <span className={`text-2xl sm:text-4xl tracking-[0.2em] font-extrabold ${
          isLight 
            ? 'text-slate-950 drop-shadow-sm' 
            : 'text-white drop-shadow-[0_0_25px_rgba(34,211,238,0.4)]'
        }`}>
          S.H.A.F.T.
        </span>
      </div>

      {/* Full Institutional Name */}
      <div className={`text-xs sm:text-sm font-semibold tracking-wider uppercase font-sans mt-1 ${
        isLight ? 'text-sky-800' : 'text-cyan-400'
      }`}>
        Sunshine High Algorithmic Frequency Trading
      </div>

      {/* Subtitle / System Spec */}
      {showSubtitle && (
        <div className={`text-[10px] sm:text-[11px] font-mono tracking-widest uppercase mt-1.5 flex items-center space-x-2 ${
          isLight ? 'text-slate-500' : 'text-slate-400'
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>NEXUS CORTEX HFT GATEWAY // MSP-55 ARCHITECTURE</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        </div>
      )}
    </div>
  );
};

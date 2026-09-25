import React from 'react';

export interface LogoVariantProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  glow?: boolean;
  theme?: 'dark' | 'light';
  showLabel?: boolean;
}

/**
 * Variant 1: Dual-Ring Quantum Infinity "NC" Emblem
 * (Inspired by uploaded image E4FCF664-E626-43D4-9D83-0C5D51320C30 / IMG_5841)
 * Best suited for: Header, Subsystems Console, Consensus, and Master Branding
 */
export const QuantumInfinityLogo: React.FC<LogoVariantProps> = ({
  size = 'md',
  className = '',
  glow = true,
  theme = 'dark',
  showLabel = false
}) => {
  const isLight = theme === 'light';
  
  const sizeMap = {
    xs: { box: 28, text: 'text-[9px]' },
    sm: { box: 40, text: 'text-xs' },
    md: { box: 64, text: 'text-sm' },
    lg: { box: 96, text: 'text-base' },
    xl: { box: 140, text: 'text-xl' }
  };
  const { box, text } = sizeMap[size];

  return (
    <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
      <div className="relative group flex items-center justify-center" style={{ width: box, height: box * 0.65 }}>
        {glow && (
          <div className={`absolute -inset-1 rounded-full blur-md opacity-60 group-hover:opacity-90 transition-opacity animate-pulse ${
            isLight
              ? 'bg-gradient-to-r from-sky-400/30 via-cyan-300/40 to-emerald-400/30'
              : 'bg-gradient-to-r from-cyan-500/25 via-blue-600/20 to-emerald-500/25'
          }`} />
        )}
        <svg
          viewBox="0 0 200 130"
          className="w-full h-full relative drop-shadow-[0_2px_8px_rgba(0,163,255,0.35)]"
        >
          <defs>
            <linearGradient id="qiBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00A3FF" />
              <stop offset="50%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
            <linearGradient id="qiGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#A3E635" />
            </linearGradient>
            <radialGradient id="qiCoreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="40%" stopColor="#67E8F9" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#38BDF8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Left Ring (Nexus) */}
          <circle
            cx="65"
            cy="65"
            r="42"
            fill="none"
            stroke="url(#qiBlueGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="220 30"
            className="animate-[spin_12s_linear_infinite]"
            style={{ transformOrigin: '65px 65px' }}
          />
          {/* Inner mesh lines */}
          <path
            d="M 35 65 L 95 65 M 65 35 L 65 95 M 44 44 L 86 86 M 44 86 L 86 44"
            stroke="#38BDF8"
            strokeWidth="1.2"
            opacity="0.4"
          />
          {/* Left Nodes */}
          <circle cx="35" cy="65" r="3.5" fill="#FFFFFF" />
          <circle cx="65" cy="35" r="3.5" fill="#38BDF8" />
          <circle cx="65" cy="95" r="3.5" fill="#38BDF8" />
          <circle cx="95" cy="65" r="4" fill="#E0F2FE" />

          {/* Right Ring (Cortex) */}
          <circle
            cx="135"
            cy="65"
            r="42"
            fill="none"
            stroke="url(#qiGreenGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="220 30"
            className="animate-[spin_12s_linear_infinite_reverse]"
            style={{ transformOrigin: '135px 65px' }}
          />
          {/* Inner mesh lines */}
          <path
            d="M 105 65 L 165 65 M 135 35 L 135 95 M 114 44 L 156 86 M 114 86 L 156 44"
            stroke="#4ADE80"
            strokeWidth="1.2"
            opacity="0.4"
          />
          {/* Right Nodes */}
          <circle cx="165" cy="65" r="3.5" fill="#FFFFFF" />
          <circle cx="135" cy="35" r="3.5" fill="#4ADE80" />
          <circle cx="135" cy="95" r="3.5" fill="#4ADE80" />

          {/* Central Singularity Starburst Lens */}
          <circle cx="100" cy="65" r="18" fill="url(#qiCoreGlow)" />
          {/* Starburst Cross Rays */}
          <path
            d="M 70 65 L 130 65 M 100 35 L 100 95"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="animate-pulse"
          />
          <circle cx="100" cy="65" r="3.5" fill="#FFFFFF" />
        </svg>
      </div>

      {showLabel && (
        <span className={`mt-1 font-mono font-bold tracking-tight uppercase ${text} ${
          isLight ? 'text-slate-800' : 'text-slate-200'
        }`}>
          <span className="text-sky-500">NEXUS</span> <span className="text-emerald-500">CORTEX</span>
        </span>
      )}
    </div>
  );
};

/**
 * Variant 2: Neural Circuit Arrow Emblem
 * (Inspired by uploaded image IMG_5835.jpeg)
 * Best suited for: Trading Desk (Directional Momentum & Execution Fill), Order Execution Module
 */
export const NeuralCircuitArrowLogo: React.FC<LogoVariantProps> = ({
  size = 'md',
  className = '',
  glow = true,
  theme = 'dark',
  showLabel = false
}) => {
  const isLight = theme === 'light';

  const sizeMap = {
    xs: { box: 24, text: 'text-[9px]' },
    sm: { box: 36, text: 'text-xs' },
    md: { box: 56, text: 'text-sm' },
    lg: { box: 80, text: 'text-base' },
    xl: { box: 110, text: 'text-xl' }
  };
  const { box, text } = sizeMap[size];

  return (
    <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
      <div className="relative group flex items-center justify-center" style={{ width: box, height: box }}>
        {glow && (
          <div className={`absolute -inset-1 rounded-2xl blur-md opacity-60 group-hover:opacity-90 transition-opacity animate-pulse ${
            isLight
              ? 'bg-gradient-to-tr from-sky-400/40 via-cyan-400/30 to-emerald-400/40'
              : 'bg-gradient-to-tr from-cyan-500/30 via-blue-600/20 to-emerald-400/30'
          }`} />
        )}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full relative drop-shadow-[0_2px_10px_rgba(14,165,233,0.4)]"
        >
          <defs>
            <linearGradient id="arrowCircuitGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="45%" stopColor="#0EA5E9" />
              <stop offset="85%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#4ADE80" />
            </linearGradient>
            <linearGradient id="arrowFillGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0369A1" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#0284C7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Arrow Outer Silhouette */}
          <polygon
            points="50,10 90,50 68,50 82,88 50,70 18,88 32,50 10,50"
            fill="url(#arrowFillGrad)"
            stroke="url(#arrowCircuitGrad)"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Circuit Board Traces inside Arrow */}
          <path
            d="M 50,22 L 50,56 M 38,44 L 50,32 L 62,44 M 32,60 L 44,72 L 50,66 L 56,72 L 68,60 M 50,56 L 36,70 M 50,56 L 64,70"
            fill="none"
            stroke="#67E8F9"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
          />

          {/* Microchip Nodes (Glowing dots) */}
          <circle cx="50" cy="18" r="3.2" fill="#FFFFFF" />
          <circle cx="50" cy="32" r="2.8" fill="#4ADE80" />
          <circle cx="38" cy="44" r="2.5" fill="#38BDF8" />
          <circle cx="62" cy="44" r="2.5" fill="#4ADE80" />
          <circle cx="50" cy="56" r="3" fill="#FFFFFF" />
          <circle cx="32" cy="60" r="2.4" fill="#0EA5E9" />
          <circle cx="68" cy="60" r="2.4" fill="#22C55E" />
          <circle cx="50" cy="66" r="2.5" fill="#38BDF8" />
          <circle cx="50" cy="80" r="3" fill="#10B981" />
        </svg>
      </div>

      {showLabel && (
        <span className={`mt-1 font-mono font-bold tracking-tight uppercase ${text} ${
          isLight ? 'text-slate-800' : 'text-slate-200'
        }`}>
          CIRCUIT <span className="text-emerald-500">MOMENTUM</span>
        </span>
      )}
    </div>
  );
};

/**
 * Variant 3: Multi-Tier Stepped Trajectory Growth Chevron
 * (Inspired by uploaded image IMG_5838.jpeg)
 * Best suited for: Strategy Analytics, Alpha Growth, and PnL Tracking
 */
export const GrowthChevronLogo: React.FC<LogoVariantProps> = ({
  size = 'md',
  className = '',
  glow = true,
  theme = 'dark',
  showLabel = false
}) => {
  const isLight = theme === 'light';

  const sizeMap = {
    xs: { box: 26, text: 'text-[9px]' },
    sm: { box: 38, text: 'text-xs' },
    md: { box: 60, text: 'text-sm' },
    lg: { box: 86, text: 'text-base' },
    xl: { box: 120, text: 'text-xl' }
  };
  const { box, text } = sizeMap[size];

  return (
    <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
      <div className="relative group flex items-center justify-center" style={{ width: box, height: box * 0.85 }}>
        {glow && (
          <div className={`absolute -inset-1 rounded-2xl blur-md opacity-60 group-hover:opacity-90 transition-opacity animate-pulse ${
            isLight
              ? 'bg-gradient-to-r from-cyan-400/30 via-emerald-400/35 to-lime-400/30'
              : 'bg-gradient-to-r from-blue-600/20 via-cyan-500/25 to-emerald-400/35'
          }`} />
        )}
        <svg
          viewBox="0 0 120 100"
          className="w-full h-full relative drop-shadow-[0_2px_10px_rgba(16,185,129,0.35)]"
        >
          <defs>
            <linearGradient id="chevTier1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0EA5E9" />
            </linearGradient>
            <linearGradient id="chevTier2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0EA5E9" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="chevTier3" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#A3E635" />
            </linearGradient>
          </defs>

          {/* Base Stepped Growth Path (Lower Tier - Blue) */}
          <path
            d="M 10,75 L 30,55 L 45,68 L 70,38 L 88,52 L 105,22"
            fill="none"
            stroke="url(#chevTier1)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Middle Tier (Cyan - Green) */}
          <path
            d="M 18,85 L 38,65 L 53,78 L 78,48 L 96,62 L 112,32"
            fill="none"
            stroke="url(#chevTier2)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Top High-Frequency Arrowhead Header */}
          <polygon
            points="112,12 88,24 98,34"
            fill="url(#chevTier3)"
            stroke="#A3E635"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Stepped Circuit Bus & Nodes */}
          <circle cx="10" cy="75" r="3.5" fill="#0284C7" />
          <circle cx="30" cy="55" r="3" fill="#38BDF8" />
          <circle cx="45" cy="68" r="3" fill="#0EA5E9" />
          <circle cx="70" cy="38" r="3.5" fill="#10B981" />
          <circle cx="88" cy="52" r="3" fill="#34D399" />
          <circle cx="105" cy="22" r="4" fill="#FFFFFF" />

          {/* Upward Energy Sparks */}
          <path
            d="M 68,36 L 68,26 M 86,50 L 86,40 M 103,20 L 103,10"
            stroke="#A3E635"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>
      </div>

      {showLabel && (
        <span className={`mt-1 font-mono font-bold tracking-tight uppercase ${text} ${
          isLight ? 'text-slate-800' : 'text-slate-200'
        }`}>
          TRAJECTORY <span className="text-lime-500">CHEVRON</span>
        </span>
      )}
    </div>
  );
};

/**
 * Variant 4: Starburst Fiber Core Singularity
 * (Inspired by uploaded image 6D48FAE2-F608-4AF0-8060-50A3B7E93272.jpeg)
 * Best suited for: VPS Latency & Jitter Sync, Optical Interconnect, AI Screen Diagnostics
 */
export const SingularityFiberCoreLogo: React.FC<LogoVariantProps> = ({
  size = 'md',
  className = '',
  glow = true,
  theme = 'dark',
  showLabel = false
}) => {
  const isLight = theme === 'light';

  const sizeMap = {
    xs: { box: 26, text: 'text-[9px]' },
    sm: { box: 38, text: 'text-xs' },
    md: { box: 58, text: 'text-sm' },
    lg: { box: 84, text: 'text-base' },
    xl: { box: 115, text: 'text-xl' }
  };
  const { box, text } = sizeMap[size];

  return (
    <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
      <div className="relative group flex items-center justify-center" style={{ width: box, height: box }}>
        {glow && (
          <div className={`absolute -inset-1 rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity animate-pulse ${
            isLight
              ? 'bg-gradient-to-tr from-sky-400/40 via-cyan-300/40 to-emerald-400/40'
              : 'bg-gradient-to-tr from-cyan-500/35 via-blue-600/30 to-emerald-400/35'
          }`} />
        )}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full relative drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]"
        >
          <defs>
            <radialGradient id="sfcCenterGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="25%" stopColor="#A5F3FC" stopOpacity="0.9" />
              <stop offset="55%" stopColor="#38BDF8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Fiber Optic Rays radiating outward */}
          {/* Blue Sector (Left) */}
          <path
            d="M 50,50 L 10,20 M 50,50 L 5,35 M 50,50 L 8,50 M 50,50 L 12,65 M 50,50 L 20,80 M 50,50 L 35,92 M 50,50 L 25,12"
            stroke="#0284C7"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M 50,50 L 18,28 M 50,50 L 14,44 M 50,50 L 18,60 M 50,50 L 28,74"
            stroke="#38BDF8"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Green Sector (Right) */}
          <path
            d="M 50,50 L 90,20 M 50,50 L 95,35 M 50,50 L 92,50 M 50,50 L 88,65 M 50,50 L 80,80 M 50,50 L 65,92 M 50,50 L 75,12"
            stroke="#059669"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M 50,50 L 82,28 M 50,50 L 86,44 M 50,50 L 82,60 M 50,50 L 72,74"
            stroke="#34D399"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Center Supernova Singularity */}
          <circle cx="50" cy="50" r="26" fill="url(#sfcCenterGlow)" />
          {/* Intense horizontal & vertical diffraction spikes */}
          <line x1="10" y1="50" x2="90" y2="50" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="50" y1="10" x2="50" y2="90" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="50" cy="50" r="5" fill="#FFFFFF" />
        </svg>
      </div>

      {showLabel && (
        <span className={`mt-1 font-mono font-bold tracking-tight uppercase ${text} ${
          isLight ? 'text-slate-800' : 'text-slate-200'
        }`}>
          SINGULARITY <span className="text-cyan-400">CORE</span>
        </span>
      )}
    </div>
  );
};

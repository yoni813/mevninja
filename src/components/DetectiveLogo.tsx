import React from 'react';

export interface DetectiveLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'silhouette' | 'badge' | 'full' | 'icon';
  theme?: 'dark' | 'light' | 'auto';
  pulse?: boolean;
  animated?: boolean;
  className?: string;
  showText?: boolean;
  accentColor?: 'cyan' | 'amber' | 'emerald' | 'purple' | 'gold';
}

export const DetectiveLogo: React.FC<DetectiveLogoProps> = ({
  size = 'md',
  variant = 'silhouette',
  theme = 'auto',
  pulse = true,
  animated = true,
  className = '',
  showText = false,
  accentColor = 'cyan'
}) => {
  const sizeMap = {
    xs: { container: 'w-7 h-7', width: 28, height: 28, textClass: 'text-xs' },
    sm: { container: 'w-10 h-10', width: 40, height: 40, textClass: 'text-sm' },
    md: { container: 'w-16 h-16', width: 64, height: 64, textClass: 'text-base' },
    lg: { container: 'w-24 h-24', width: 96, height: 96, textClass: 'text-xl' },
    xl: { container: 'w-36 h-36', width: 144, height: 144, textClass: 'text-2xl' },
    '2xl': { container: 'w-52 h-52', width: 208, height: 208, textClass: 'text-4xl' }
  };

  const current = sizeMap[size];
  const isLight = theme === 'light';

  // Accent gradient colors
  const accentGradients = {
    cyan: {
      primary: '#00E5FF',
      secondary: '#0077FF',
      glow: 'rgba(0, 229, 255, 0.4)',
      rim: '#A5F3FC'
    },
    amber: {
      primary: '#F59E0B',
      secondary: '#D97706',
      glow: 'rgba(245, 158, 11, 0.4)',
      rim: '#FDE68A'
    },
    emerald: {
      primary: '#10B981',
      secondary: '#059669',
      glow: 'rgba(16, 185, 129, 0.4)',
      rim: '#6EE7B7'
    },
    purple: {
      primary: '#A855F7',
      secondary: '#7C3AED',
      glow: 'rgba(168, 85, 247, 0.4)',
      rim: '#E9D5FF'
    },
    gold: {
      primary: '#FBBF24',
      secondary: '#B45309',
      glow: 'rgba(251, 191, 36, 0.4)',
      rim: '#FEF08A'
    }
  };

  const colors = accentGradients[accentColor] || accentGradients.cyan;

  return (
    <div
      className={`inline-flex items-center justify-center select-none ${className}`}
      title="1940s Noir Private Detective - Algorithmic Market Intelligence"
    >
      <div className={`relative flex items-center justify-center ${current.container}`}>
        {/* Ambient Backlight Glow */}
        {pulse && (
          <div
            className={`absolute inset-0 rounded-full blur-md opacity-40 transition-opacity ${
              animated ? 'animate-pulse' : ''
            }`}
            style={{ backgroundColor: colors.primary }}
          />
        )}

        <svg
          viewBox="0 0 200 240"
          className="w-full h-full relative overflow-visible drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Background Noir Circle / Spotlight */}
            <radialGradient id={`detSpotlight-${size}`} cx="50%" cy="40%" r="55%">
              <stop
                offset="0%"
                stopColor={isLight ? '#F1F5F9' : '#0F172A'}
                stopOpacity="0.9"
              />
              <stop
                offset="60%"
                stopColor={isLight ? '#E2E8F0' : '#030712'}
                stopOpacity="0.8"
              />
              <stop
                offset="100%"
                stopColor={isLight ? '#CBD5E1' : '#000000'}
                stopOpacity="0"
              />
            </radialGradient>

            {/* Glowing Streetlamp / Backlight Beam */}
            <linearGradient id={`detRimLight-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.rim} stopOpacity="0.9" />
              <stop offset="45%" stopColor={colors.primary} stopOpacity="0.7" />
              <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.3" />
            </linearGradient>

            {/* Detective Body Gradient - Jet Charcoal to Deep Obsidian */}
            <linearGradient id={`detCoatGrad-${size}`} x1="30%" y1="0%" x2="70%" y2="100%">
              <stop offset="0%" stopColor={isLight ? '#1E293B' : '#0F172A'} />
              <stop offset="50%" stopColor={isLight ? '#0F172A' : '#020617'} />
              <stop offset="100%" stopColor={isLight ? '#020617' : '#000000'} />
            </linearGradient>

            {/* Floor Fog & Shadow */}
            <radialGradient id={`detFloorShadow-${size}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.75" />
              <stop offset="70%" stopColor="#000000" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>

            {/* Radar / Scan Ring Pulse */}
            <linearGradient id={`detRadarRing-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.6" />
              <stop offset="50%" stopColor={colors.rim} stopOpacity="0.9" />
              <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* =========================================================================
              BACKGROUND: NOIR STREETLAMP SPOTLIGHT & RADAR RINGS
              ========================================================================= */}
          {variant !== 'icon' && (
            <>
              {/* Soft circular spotlight */}
              <circle
                cx="100"
                cy="115"
                r="85"
                fill={`url(#detSpotlight-${size})`}
                stroke={isLight ? '#94A3B8' : '#1E293B'}
                strokeWidth="1"
                strokeDasharray="4 3"
                opacity={isLight ? 0.6 : 0.4}
              />

              {/* Quant Intelligence Radar Arc */}
              <circle
                cx="100"
                cy="115"
                r="92"
                fill="none"
                stroke={`url(#detRadarRing-${size})`}
                strokeWidth="1.2"
                strokeDasharray="60 40 20 50"
                className={animated ? 'animate-[spin_16s_linear_infinite]' : ''}
                style={{ transformOrigin: '100px 115px' }}
                opacity="0.45"
              />
            </>
          )}

          {/* Ground Cast Shadow */}
          <ellipse
            cx="100"
            cy="222"
            rx="52"
            ry="9"
            fill={`url(#detFloorShadow-${size})`}
          />

          {/* =========================================================================
              1940s PRIVATE DETECTIVE STANDING SILHOUETTE
              Fedora Hat, Upturned Lapels, Long Trench Coat, Belted Waist, Slacks & Oxford Shoes
              ========================================================================= */}
          <g id="detective-standing-silhouette">
            {/* 1. BACKLIT GLOW / RIM LIGHT CONTOUR (Silhouette Edge Light) */}
            <path
              d="
                M 82 28
                C 82 22, 92 18, 100 18
                C 108 18, 118 22, 118 28
                L 134 35
                C 137 36.5, 134 40, 126 40
                C 120 40, 118 41, 117 43
                C 117 46, 122 50, 123 54
                C 124 59, 118 64, 115 67
                L 132 78
                C 137 82, 140 89, 139 98
                L 132 148
                L 137 192
                L 125 194
                L 122 216
                L 128 220
                L 110 220
                L 112 195
                L 100 195
                L 91 195
                L 90 220
                L 72 220
                L 78 216
                L 76 194
                L 64 192
                L 69 148
                L 62 98
                C 61 89, 64 82, 69 78
                L 86 67
                C 83 64, 77 59, 78 54
                C 79 50, 84 46, 84 43
                C 83 41, 81 40, 75 40
                C 67 40, 64 36.5, 67 35
                Z
              "
              fill="none"
              stroke={`url(#detRimLight-${size})`}
              strokeWidth="2.5"
              strokeLinejoin="round"
              opacity={isLight ? 0.7 : 0.9}
            />

            {/* 2. MAIN SOLID DETECTIVE BODY SILHOUETTE */}
            {/* Legs & Trousers */}
            <path
              d="
                M 86 150
                L 80 216
                L 73 218
                C 72 219, 72 221, 74 221
                L 93 221
                C 95 221, 95 219, 93 218
                L 91 216
                L 95 158
                L 105 158
                L 109 216
                L 107 218
                C 105 219, 105 221, 107 221
                L 127 221
                C 129 221, 129 219, 127 218
                L 120 216
                L 114 150
                Z
              "
              fill={`url(#detCoatGrad-${size})`}
            />

            {/* Classic 1940s Double-Breasted Long Trench Coat (Duster) */}
            <path
              d="
                M 85 70
                L 68 80
                C 63 84, 61 90, 62 98
                L 67 142
                C 68 152, 65 170, 63 188
                C 63 192, 66 194, 70 194
                L 130 194
                C 134 194, 137 192, 137 188
                C 135 170, 132 152, 133 142
                L 138 98
                C 139 90, 137 84, 132 80
                L 115 70
                L 124 55
                C 120 54, 115 56, 111 60
                L 100 74
                L 89 60
                C 85 56, 80 54, 76 55
                Z
              "
              fill={`url(#detCoatGrad-${size})`}
            />

            {/* Trench Coat Belt & Buckle */}
            <path
              d="M 72 124 L 128 124 L 127 131 L 73 131 Z"
              fill={isLight ? '#0F172A' : '#090D16'}
            />
            {/* Belt Buckle accent */}
            <rect
              x="95"
              y="123"
              width="10"
              height="9"
              rx="1.5"
              fill="none"
              stroke={colors.primary}
              strokeWidth="1.2"
            />
            <line
              x1="100"
              y1="123"
              x2="100"
              y2="132"
              stroke={colors.primary}
              strokeWidth="1"
            />

            {/* Trench Coat Lapels & Buttons (High Contrast Noir Shadow) */}
            {/* Left Lapel (Upturned) */}
            <path
              d="M 87 64 L 100 88 L 82 82 L 77 62 Z"
              fill={isLight ? '#334155' : '#1E293B'}
              stroke={colors.rim}
              strokeWidth="0.8"
            />
            {/* Right Lapel (Upturned) */}
            <path
              d="M 113 64 L 100 88 L 118 82 L 123 62 Z"
              fill={isLight ? '#1E293B' : '#0F172A'}
              stroke={colors.primary}
              strokeWidth="0.8"
            />

            {/* Tie / Shirt Collar slit */}
            <polygon
              points="98,66 102,66 101,78 99,78"
              fill={colors.rim}
              opacity="0.8"
            />

            {/* Trench Coat Button Accents */}
            <circle cx="93" cy="98" r="1.5" fill={colors.primary} opacity="0.8" />
            <circle cx="107" cy="98" r="1.5" fill={colors.primary} opacity="0.8" />
            <circle cx="93" cy="110" r="1.5" fill={colors.primary} opacity="0.8" />
            <circle cx="107" cy="110" r="1.5" fill={colors.primary} opacity="0.8" />
            <circle cx="94" cy="144" r="1.5" fill={colors.primary} opacity="0.8" />
            <circle cx="106" cy="144" r="1.5" fill={colors.primary} opacity="0.8" />

            {/* Coat Pocket Slits (Hands in Pockets stance) */}
            <path
              d="M 74 138 Q 78 144 84 148"
              stroke={isLight ? '#475569' : '#334155'}
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 126 138 Q 122 144 116 148"
              stroke={isLight ? '#475569' : '#334155'}
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* 3. HEAD & 1940s NOIR FEDORA HAT */}
            {/* Neck / Jaw Shadow */}
            <ellipse
              cx="100"
              cy="52"
              rx="9"
              ry="11"
              fill={`url(#detCoatGrad-${size})`}
            />

            {/* Fedora Hat Crown (Indented Pinch) */}
            <path
              d="
                M 85 36
                C 85 24, 91 19, 98 18
                C 101 18, 103 21, 105 21
                C 108 21, 114 24, 115 36
                Z
              "
              fill={`url(#detCoatGrad-${size})`}
            />

            {/* Fedora Hatband (Contrasting Ribbon) */}
            <path
              d="
                M 84 34
                Q 100 36 116 34
                L 117 38
                Q 100 40 83 38
                Z
              "
              fill={colors.primary}
              opacity="0.9"
            />

            {/* Fedora Brim (Angled Noir Curve) */}
            <path
              d="
                M 66 36
                C 75 35, 85 34, 100 34
                C 118 34, 128 36, 134 37
                C 138 38, 136 41, 126 42
                C 112 43, 88 43, 74 41
                C 64 40, 62 37, 66 36
                Z
              "
              fill={isLight ? '#0F172A' : '#020617'}
              stroke={colors.rim}
              strokeWidth="0.8"
            />

            {/* Mysterious Glowing Eye / Cigarette Amber Glow (Optional subtle noir touch) */}
            <circle
              cx="103"
              cy="45"
              r="1.2"
              fill={colors.rim}
              className={animated ? 'animate-pulse' : ''}
            />
          </g>

          {/* =========================================================================
              HUD / ALGORITHMIC OVERLAY GLYPHS (Private Investigator Quantitative Suite)
              ========================================================================= */}
          {variant === 'badge' && (
            <g opacity="0.7">
              <text
                x="100"
                y="235"
                textAnchor="middle"
                fontSize="8"
                fontFamily="monospace"
                fontWeight="bold"
                fill={colors.primary}
                letterSpacing="2"
              >
                SPECIAL INVESTIGATOR
              </text>
            </g>
          )}
        </svg>
      </div>

      {showText && (
        <div className="ml-2.5 flex flex-col justify-center">
          <div className="flex items-center space-x-1.5">
            <span className={`font-mono font-black tracking-tight ${current.textClass} ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              NEXUS CORTEX
            </span>
            <span
              className="text-[9px] px-1 py-0.2 rounded font-mono font-bold uppercase border"
              style={{
                color: colors.primary,
                borderColor: colors.primary,
                backgroundColor: `${colors.primary}15`
              }}
            >
              1940s Noir
            </span>
          </div>
          <span className={`text-[10px] font-mono tracking-wider ${
            isLight ? 'text-slate-500' : 'text-slate-400'
          }`}>
            ALGORITHMIC PRIVATE INTELLIGENCE
          </span>
        </div>
      )}
    </div>
  );
};

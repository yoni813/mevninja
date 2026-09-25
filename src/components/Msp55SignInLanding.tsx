import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, Key, ArrowRight, CheckCircle2, 
  Sparkles, RefreshCw, AlertCircle, Terminal, 
  ChevronRight, ChevronDown, ChevronUp, Cpu, Brain, ShieldAlert, Activity, Users, 
  GitFork, Workflow, DollarSign, Database, Image as ImageIcon,
  Sun, Moon, ExternalLink, Zap, Camera, Fingerprint, Globe, Shield
} from 'lucide-react';
import { NexusCortexWallpaper } from './NexusCortexWallpaper';
import { ShaftBrandLogo } from './ShaftBrandLogo';
import { NexusCortexLogo } from './NexusCortexLogo';
import { QuantumInfinityLogo, NeuralCircuitArrowLogo, GrowthChevronLogo, SingularityFiberCoreLogo } from './LogoVariants';
import { GoogleSignInModal } from './GoogleSignInModal';
import { FacialRecognitionModal } from './FacialRecognitionModal';
import { BiometricVerificationModal } from './BiometricVerificationModal';
import { BrokerageServerModal } from './BrokerageServerModal';
import { systemsService } from '../services/SystemsService';
import { telemetryService } from '../services/TelemetryService';
import { AuthUser, BackendSystemStatus, SystemsOverviewResponse } from '../types';
import { SubsystemDetailModal } from './SubsystemDetailModal';
import { useTheme } from '../context/ThemeContext';

interface Msp55SignInLandingProps {
  onAuthenticated: (user: AuthUser) => void;
  onEnterWorkbenchDirectly: () => void;
  currentUser: AuthUser | null;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Msp55SignInLanding: React.FC<Msp55SignInLandingProps> = ({
  onAuthenticated,
  onEnterWorkbenchDirectly,
  currentUser,
  theme: propTheme,
  onToggleTheme: propToggleTheme
}) => {
  const themeContext = useTheme();
  const theme = propTheme || themeContext.theme;
  const toggleTheme = propToggleTheme || themeContext.toggleTheme;
  const isLight = theme === 'light';

  const [traderId, setTraderId] = useState('NX-7749-CQO');
  const [passphrase, setPassphrase] = useState('••••••••••••••••');
  const [selectedRole, setSelectedRole] = useState('LEVEL_5_CHIEF_QUANT');
  const [selectedDesk, setSelectedDesk] = useState('Johannesburg Cross-Connect (Equinix ZA-JNB)');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Authentication Modals
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isFacialModalOpen, setIsFacialModalOpen] = useState(false);
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const [isExnessModalOpen, setIsExnessModalOpen] = useState(false);

  // Collapsible UI Sections
  const [isSubsystemsCollapsed, setIsSubsystemsCollapsed] = useState(false);
  const [isScalperRulesCollapsed, setIsScalperRulesCollapsed] = useState(false);

  // Subsystems data
  const [overview, setOverview] = useState<SystemsOverviewResponse | null>(systemsService.getOverview());
  const [selectedSubsystem, setSelectedSubsystem] = useState<BackendSystemStatus | null>(null);

  // Live clocks
  const [time, setTime] = useState({
    utc: new Date().toUTCString().slice(17, 25),
    jnb: new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date()),
    ld4: new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date()),
    ny4: new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date())
  });

  // Dynamic Wallpaper state
  const [wallpaperStyle, setWallpaperStyle] = useState<'cinematic' | 'ambient' | 'subtle'>('cinematic');

  useEffect(() => {
    const unsub = systemsService.subscribeSystems((newOverview) => {
      setOverview(newOverview);
    });

    const clockTimer = setInterval(() => {
      const now = new Date();
      setTime({
        utc: now.toUTCString().slice(17, 25),
        jnb: new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now),
        ld4: new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now),
        ny4: new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now)
      });
    }, 1000);

    return () => {
      unsub();
      clearInterval(clockTimer);
    };
  }, []);

  const handleQuickSelectProfile = (id: string, roleKey: string, deskName: string) => {
    setTraderId(id);
    setSelectedRole(roleKey);
    setSelectedDesk(deskName);
  };

  const handleAuthComplete = (user: AuthUser) => {
    // Log telemetry activity to backend
    telemetryService.logActivity({
      traderId: user.traderId,
      role: user.role,
      action: 'AUTHENTICATION_SUCCESS',
      module: 'AUTH_ENCLAVE',
      details: `Trader authenticated via ${user.authMethod || 'HARDWARE_KEY'} into ${user.desk}. Standard permissions granted.`,
      severity: 'SUCCESS',
      location: user.desk
    });

    onAuthenticated(user);
  };

  const handleDirectHnsSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const user = await systemsService.signIn({
        traderId: 'HNS-STAGING-01',
        role: 'LEVEL_5_CHIEF_QUANT',
        desk: 'HNS Staging Gateway (Direct Institutional DMA)',
        clearanceLevel: 'LEVEL_5_CHIEF_QUANT'
      });
      setIsAuthenticating(false);
      handleAuthComplete(user);
    } catch (err: any) {
      setIsAuthenticating(false);
      setAuthError(err.message || 'HNS Staging authentication failed');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const user = await systemsService.signIn({
        traderId,
        role: selectedRole,
        desk: selectedDesk,
        clearanceLevel: selectedRole
      });
      setIsAuthenticating(false);
      handleAuthComplete(user);
    } catch (err: any) {
      setIsAuthenticating(false);
      setAuthError(err.message || 'Cryptographic enclave authentication failed');
    }
  };

  const iconMap: Record<string, React.ReactNode> = {
    'execution-engine': <Cpu className={`w-4 h-4 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />,
    'predictive-ai': <Brain className={`w-4 h-4 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />,
    'risk-analytics': <ShieldAlert className={`w-4 h-4 ${isLight ? 'text-rose-600' : 'text-rose-400'}`} />,
    'telemetry': <Activity className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />,
    'secure-enclaves': <Lock className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />,
    'collaboration': <Users className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />,
    'shadow-simulation': <GitFork className={`w-4 h-4 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`} />,
    'workflows': <Workflow className={`w-4 h-4 ${isLight ? 'text-pink-600' : 'text-pink-400'}`} />,
    'cost-tracker': <DollarSign className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
  };

  const systemsList: BackendSystemStatus[] = overview?.systems ? (Object.values(overview.systems) as BackendSystemStatus[]) : [];

  return (
    <div className={`min-h-screen flex flex-col font-sans relative overflow-x-hidden transition-colors ${
      isLight ? 'bg-[#f1f5f9] text-slate-900 selection:bg-sky-500/20' : 'bg-[#06080F] text-slate-100 selection:bg-cyan-500/30'
    }`}>
      
      {/* Dynamic Background Wallpaper */}
      <NexusCortexWallpaper 
        theme={theme}
        opacity={isLight 
          ? (wallpaperStyle === 'cinematic' ? 0.70 : wallpaperStyle === 'ambient' ? 0.50 : 0.32) 
          : (wallpaperStyle === 'cinematic' ? 0.65 : wallpaperStyle === 'ambient' ? 0.42 : 0.22)
        }
        variant={wallpaperStyle}
        showGrid={true}
        showRays={true}
      />

      {/* Top Precision Telemetry Bar - Transparent Glass */}
      <header className={`relative z-20 border-b backdrop-blur-md px-4 sm:px-6 py-2.5 transition-colors ${
        isLight ? 'bg-white/65 border-slate-200/80 text-slate-800' : 'bg-slate-950/60 border-slate-800/80 text-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          
          {/* Left Brand Badge */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <NexusCortexLogo size="xs" variant="icon" theme={theme} animated={true} pulse={true} />
              <div className="flex items-center space-x-1 font-bold tracking-wider">
                <span className={isLight ? 'text-sky-700 font-extrabold' : 'text-cyan-400 font-extrabold'}>NEXUS</span>
                <span className={isLight ? 'text-emerald-700 font-extrabold' : 'text-emerald-400 font-extrabold'}>CORTEX</span>
                <span className={`text-[10px] font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>// GATEWAY</span>
              </div>
            </div>
            <span className={`hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
              isLight ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-cyan-950/60 text-cyan-400 border-cyan-800'
            }`}>
              EXNESS MT5 // 6.2ms VPS
            </span>
          </div>

          {/* Center: Global Clocks */}
          <div className="hidden lg:flex items-center space-x-4 text-[11px]">
            <span className="flex items-center space-x-1">
              <span className="text-slate-500">UTC:</span>
              <span className="font-bold">{time.utc}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="text-slate-500">🇿🇦 JNB (Exness):</span>
              <span className="font-bold text-emerald-400">{time.jnb}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="text-slate-500">🇬🇧 LD4:</span>
              <span className="font-bold">{time.ld4}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="text-slate-500">🇺🇸 NY4:</span>
              <span className="font-bold">{time.ny4}</span>
            </span>
          </div>

          {/* Right Controls: Wallpaper & Direct Workbench Entry */}
          <div className="flex items-center space-x-2">
            <div className={`hidden md:flex items-center space-x-1 pl-2 border-l text-[10px] ${
              isLight ? 'border-slate-300' : 'border-slate-800'
            }`}>
              <span className={`mr-1 flex items-center ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <ImageIcon className={`w-3 h-3 mr-1 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
                Backdrop:
              </span>
              {(['cinematic', 'ambient', 'subtle'] as const).map(style => (
                <button
                  key={style}
                  onClick={() => setWallpaperStyle(style)}
                  className={`px-1.5 py-0.5 rounded capitalize transition-all cursor-pointer ${
                    wallpaperStyle === style 
                      ? isLight 
                        ? 'bg-sky-100 text-sky-800 border border-sky-300 font-bold' 
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' 
                      : isLight 
                        ? 'text-slate-600 hover:text-slate-900' 
                        : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {style === 'cinematic' ? 'HDR' : style === 'ambient' ? 'Ambient' : 'Muted'}
                </button>
              ))}
            </div>

            {/* Direct Workbench Access if user is already logged in */}
            {currentUser && (
              <button
                onClick={onEnterWorkbenchDirectly}
                className={`flex items-center space-x-1 px-3 py-1 rounded-xl border transition-all text-xs font-bold cursor-pointer ${
                  isLight 
                    ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-600 shadow-sm' 
                    : 'bg-cyan-950/80 hover:bg-cyan-900 border-cyan-700/60 text-cyan-300 hover:text-white'
                }`}
              >
                <span>Trading Desk ({currentUser.traderId})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Landing Body */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:py-10 flex flex-col items-center">
        
        {/* =========================================================================
            CENTRAL BRAND LOGO: S.H.A.F.T. (With Dots)
            Full Name: Sunshine High Algorithmic Frequency Trading
            ========================================================================= */}
        <div className="flex flex-col items-center text-center space-y-3 max-w-2xl mb-8">
          <ShaftBrandLogo theme={theme} size="lg" showSubtitle={true} />
          <p className={`text-xs sm:text-sm max-w-xl mx-auto mt-1 leading-relaxed ${
            isLight ? 'text-slate-700 font-medium' : 'text-slate-300'
          }`}>
            Institutional algorithmic execution platform engineered for sub-50ms order timeouts,
            hardware-attested Nitro Enclaves, and real-time South African VPS 6.2ms latency monitoring.
          </p>
        </div>

        {/* =========================================================================
            TRANSPARENT FRONT LOGIN WINDOW / INSTITUTIONAL AUTHENTICATION
            Featuring Google Sign-In, Facial Recognition, and Biometric Verification
            ========================================================================= */}
        <div className={`w-full max-w-xl rounded-2xl p-6 sm:p-8 relative overflow-hidden mb-10 border transition-all ${
          isLight
            ? 'bg-white/60 border-slate-300/80 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.12)] text-slate-900'
            : 'bg-slate-950/45 border-slate-800/80 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.7)] text-slate-100'
        }`}>
          
          {/* Top Hairline Glow */}
          <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${
            isLight 
              ? 'from-transparent via-sky-500 to-transparent' 
              : 'from-transparent via-cyan-400 to-transparent'
          }`} />

          {/* Form Header */}
          <div className={`flex items-center justify-between pb-4 mb-5 border-b ${
            isLight ? 'border-slate-300/80' : 'border-slate-800/80'
          }`}>
            <div className="flex items-center space-x-2.5">
              <div className={`p-2 rounded-xl border ${
                isLight ? 'bg-sky-50 border-sky-200 text-sky-600' : 'bg-slate-900/60 border-slate-800 text-cyan-400'
              }`}>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className={`text-sm font-bold uppercase font-mono tracking-wider ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  INSTITUTIONAL ENCLAVE AUTHENTICATION
                </h2>
                <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Tailored Permissions &amp; Telemetry Audited Gateway
                </p>
              </div>
            </div>

            {/* Quick in-card theme switcher & Attestation badge */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={toggleTheme}
                className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' 
                    : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-amber-400'
                }`}
                title="Toggle Dark / Light Setting"
              >
                {isLight ? <Moon className="w-3.5 h-3.5 text-indigo-600" /> : <Sun className="w-3.5 h-3.5" />}
              </button>

              <div className={`flex items-center space-x-1.5 px-2 py-1 border rounded text-[10px] font-mono font-semibold ${
                isLight 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                  : 'bg-emerald-950/40 border-emerald-800/50 text-emerald-400'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>PCR0 VERIFIED</span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              3 ADVANCED AUTHENTICATION MODALITIES (GOOGLE, FACIAL, BIOMETRIC)
              ========================================================================= */}
          <div className="space-y-3 mb-6">
            <label className={`text-[10px] font-mono uppercase tracking-wider font-bold block ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Select Institutional Authentication Method:
            </label>

            {/* HNS Institutional Staging Direct Sign-In */}
            <button
              type="button"
              onClick={handleDirectHnsSignIn}
              disabled={isAuthenticating}
              className={`w-full py-2.5 px-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer shadow-md group ${
                isLight 
                  ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border-emerald-400 text-slate-900' 
                  : 'bg-gradient-to-r from-emerald-950/40 to-teal-950/40 hover:from-emerald-900/60 hover:to-teal-900/60 border-emerald-500/60 text-emerald-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold font-mono text-emerald-400 group-hover:text-emerald-300 transition-colors flex items-center space-x-1.5">
                    <span>Sign in with HNS Staging Account</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 border border-emerald-500/40 rounded text-emerald-300 font-semibold">
                      DIRECT ENCLAVE
                    </span>
                  </div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Instant HNS-STAGING-01 • Level 5 Chief Quant • Institutional DMA
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Exness MetaTrader 5 Direct Sign-In */}
            <button
              type="button"
              onClick={() => setIsExnessModalOpen(true)}
              className={`w-full py-2.5 px-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer shadow-sm group ${
                isLight 
                  ? 'bg-amber-50/70 hover:bg-amber-100/80 border-amber-300 text-slate-900' 
                  : 'bg-amber-950/30 hover:bg-amber-900/50 border-amber-600/50 text-amber-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                  <Key className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold font-mono text-amber-400 group-hover:text-amber-300 transition-colors flex items-center space-x-1.5">
                    <span>Sign in with Exness MT5</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/20 border border-amber-500/40 rounded text-amber-300">
                      MT5Trial9 / MT5Real10
                    </span>
                  </div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Real credentials, live wallet balance &amp; telemetry
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Google Sign-in Button */}
            <button
              type="button"
              onClick={() => setIsGoogleModalOpen(true)}
              className={`w-full py-2.5 px-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer shadow-sm group ${
                isLight 
                  ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800' 
                  : 'bg-slate-900/70 hover:bg-slate-900 border-slate-700 text-slate-100 hover:border-cyan-500/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 rounded-full bg-white p-0.5 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="w-full h-full">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold font-mono group-hover:text-cyan-400 transition-colors">
                    Sign in with Google SSO
                  </div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Institutional OIDC token attestation
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Facial Recognition & Biometric Verification 2-Col Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Facial Recognition */}
              <button
                type="button"
                onClick={() => setIsFacialModalOpen(true)}
                className={`p-3 rounded-xl border flex items-center space-x-3 transition-all cursor-pointer text-left group ${
                  isLight 
                    ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800' 
                    : 'bg-slate-900/70 hover:bg-slate-900 border-slate-700 text-slate-100 hover:border-cyan-500/50'
                }`}
              >
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 group-hover:scale-105 transition-transform">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold font-mono group-hover:text-cyan-400 transition-colors">
                    Facial Recognition
                  </div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    3D Liveness &amp; ZKP mesh
                  </div>
                </div>
              </button>

              {/* Biometric Verification */}
              <button
                type="button"
                onClick={() => setIsBiometricModalOpen(true)}
                className={`p-3 rounded-xl border flex items-center space-x-3 transition-all cursor-pointer text-left group ${
                  isLight 
                    ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800' 
                    : 'bg-slate-900/70 hover:bg-slate-900 border-slate-700 text-slate-100 hover:border-purple-500/50'
                }`}
              >
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30 group-hover:scale-105 transition-transform">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold font-mono group-hover:text-purple-400 transition-colors">
                    Biometric Verification
                  </div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Touch ID / FIDO2 key
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-5">
            <div className={`absolute inset-0 flex items-center ${isLight ? 'text-slate-300' : 'text-slate-800'}`}>
              <div className="w-full border-t border-current" />
            </div>
            <span className={`relative px-3 text-[10px] font-mono uppercase tracking-widest ${
              isLight ? 'bg-white/80 text-slate-500' : 'bg-slate-950/80 text-slate-400'
            }`}>
              OR HARDWARE ENCLAVE PASSPHRASE
            </span>
          </div>

          {/* Quick Profiles Demo Selection */}
          <div className="mb-4">
            <label className={`text-[10px] font-mono uppercase tracking-wider font-bold block mb-1.5 ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Quick Clearance Demo Profiles:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleQuickSelectProfile('HNS-STAGING-01', 'LEVEL_5_CHIEF_QUANT', 'HNS Staging Gateway (Direct Institutional DMA)')}
                className={`px-2.5 py-2 rounded-xl border text-left transition-all text-xs font-mono cursor-pointer backdrop-blur-sm ${
                  traderId === 'HNS-STAGING-01'
                    ? isLight 
                      ? 'bg-emerald-100/90 border-emerald-400 text-emerald-900 shadow-sm ring-1 ring-emerald-400' 
                      : 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-sm ring-1 ring-emerald-500'
                    : isLight 
                      ? 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white' 
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className={`font-bold text-[11px] ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>HNS Staging</div>
                <div className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Level 5 • Staging DMA</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelectProfile('NX-7749-CQO', 'LEVEL_5_CHIEF_QUANT', 'Johannesburg Cross-Connect (Equinix ZA-JNB)')}
                className={`px-2.5 py-2 rounded-xl border text-left transition-all text-xs font-mono cursor-pointer backdrop-blur-sm ${
                  traderId === 'NX-7749-CQO'
                    ? isLight 
                      ? 'bg-sky-100/90 border-sky-400 text-sky-900 shadow-sm' 
                      : 'bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-sm'
                    : isLight 
                      ? 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white' 
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className={`font-bold text-[11px] ${isLight ? 'text-slate-900' : 'text-white'}`}>Chief Quant (CQO)</div>
                <div className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Level 5 • Exness VPS</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelectProfile('NX-8820-RISK', 'LEVEL_4_OPERATOR', 'New York Risk Core (NY4 Data Center)')}
                className={`px-2.5 py-2 rounded-xl border text-left transition-all text-xs font-mono cursor-pointer backdrop-blur-sm ${
                  traderId === 'NX-8820-RISK'
                    ? isLight 
                      ? 'bg-rose-100/90 border-rose-400 text-rose-900 shadow-sm' 
                      : 'bg-rose-950/60 border-rose-500 text-rose-300 shadow-sm'
                    : isLight 
                      ? 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white' 
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className={`font-bold text-[11px] ${isLight ? 'text-slate-900' : 'text-white'}`}>Risk Director</div>
                <div className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Level 4 • NY4 Desk</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelectProfile('NX-9901-FPGA', 'LEVEL_5_SYSTEMS_ARCHITECT', 'London Alpha Desk (LD4 Direct Cross-Connect)')}
                className={`px-2.5 py-2 rounded-xl border text-left transition-all text-xs font-mono cursor-pointer backdrop-blur-sm ${
                  traderId === 'NX-9901-FPGA'
                    ? isLight 
                      ? 'bg-indigo-100/90 border-indigo-400 text-indigo-900 shadow-sm' 
                      : 'bg-indigo-950/60 border-indigo-500 text-indigo-300 shadow-sm'
                    : isLight 
                      ? 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white' 
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className={`font-bold text-[11px] ${isLight ? 'text-slate-900' : 'text-white'}`}>FPGA Architect</div>
                <div className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Level 5 • LD4 Desk</div>
              </button>
            </div>
          </div>

          {/* Form Controls */}
          <form onSubmit={handleSignIn} className="space-y-3.5">
            {authError && (
              <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2 backdrop-blur-sm">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{authError}</span>
              </div>
            )}

            {/* Trader ID */}
            <div>
              <label className={`text-[10px] font-mono uppercase tracking-wider font-bold block mb-1 flex justify-between ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                <span>Institutional Trader ID / Handle</span>
                <span className={isLight ? 'text-sky-700 font-bold' : 'text-cyan-400'}>Required</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={traderId}
                  onChange={(e) => setTraderId(e.target.value)}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-colors pl-9 border backdrop-blur-sm ${
                    isLight 
                      ? 'bg-white/70 border-slate-300 text-slate-900 focus:border-sky-500 focus:bg-white' 
                      : 'bg-slate-900/50 border-slate-700/80 text-white focus:border-cyan-500 focus:bg-slate-900/80'
                  }`}
                  placeholder="e.g. NX-7749-CQO"
                  required
                />
                <Key className={`w-4 h-4 absolute left-3 top-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
            </div>

            {/* Passkey */}
            <div>
              <label className={`text-[10px] font-mono uppercase tracking-wider font-bold block mb-1 flex justify-between ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                <span>Cryptographic Enclave Key / Passphrase</span>
                <span className={isLight ? 'text-emerald-700 font-bold' : 'text-emerald-400'}>Attested</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-colors pl-9 border backdrop-blur-sm ${
                    isLight 
                      ? 'bg-white/70 border-slate-300 text-slate-900 focus:border-sky-500 focus:bg-white' 
                      : 'bg-slate-900/50 border-slate-700/80 text-white focus:border-cyan-500 focus:bg-slate-900/80'
                  }`}
                  placeholder="Hardware Security Key..."
                  required
                />
                <Lock className={`w-4 h-4 absolute left-3 top-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
            </div>

            {/* Role & Desk Allocation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`text-[10px] font-mono uppercase tracking-wider font-bold block mb-1 ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  Clearance Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none border backdrop-blur-sm ${
                    isLight 
                      ? 'bg-white/70 border-slate-300 text-slate-900 focus:border-sky-500' 
                      : 'bg-slate-900/50 border-slate-700/80 text-white focus:border-cyan-500'
                  }`}
                >
                  <option value="LEVEL_5_CHIEF_QUANT">Level 5: Chief Quant (CQO)</option>
                  <option value="LEVEL_5_SYSTEMS_ARCHITECT">Level 5: FPGA Systems Architect</option>
                  <option value="LEVEL_4_OPERATOR">Level 4: Lead Risk Operator</option>
                  <option value="LEVEL_3_ANALYST">Level 3: Quant Research Analyst</option>
                </select>
              </div>

              <div>
                <label className={`text-[10px] font-mono uppercase tracking-wider font-bold block mb-1 ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  Primary Brokerage Location
                </label>
                <select
                  value={selectedDesk}
                  onChange={(e) => setSelectedDesk(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none border backdrop-blur-sm ${
                    isLight 
                      ? 'bg-white/70 border-slate-300 text-slate-900 focus:border-sky-500' 
                      : 'bg-slate-900/50 border-slate-700/80 text-white focus:border-cyan-500'
                  }`}
                >
                  <option value="Johannesburg Cross-Connect (Equinix ZA-JNB)">South Africa Exness MT5 (6.2ms)</option>
                  <option value="London Alpha Desk (LD4 Direct Cross-Connect)">London LD4 Direct (1.2ms)</option>
                  <option value="New York Risk Core (NY4 Data Center)">New York NY4 Equinix (14.2ms)</option>
                  <option value="Tokyo Execution Hub (TY3 Co-Location)">Tokyo TY3 Co-Location (108ms)</option>
                  <option value="Frankfurt Fiber Hub (FR2 Equinix)">Frankfurt FR2 Core (4.8ms)</option>
                </select>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isAuthenticating}
              className={`w-full py-3 font-mono font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-5 ${
                isLight
                  ? 'bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white shadow-sky-600/30'
                  : 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.3)]'
              }`}
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Hardware Attestation...</span>
                </>
              ) : (
                <>
                  <span>AUTHENTICATE &amp; ROUTE TO WORKBENCH</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Direct Sandbox Bypass */}
            <button
              type="button"
              onClick={onEnterWorkbenchDirectly}
              className={`w-full py-2.5 rounded-xl border text-xs font-mono font-medium flex items-center justify-center space-x-2 transition-colors cursor-pointer ${
                isLight 
                  ? 'bg-slate-100/80 hover:bg-slate-200/80 border-slate-300 text-slate-700' 
                  : 'bg-slate-900/40 hover:bg-slate-900/70 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
              <span>Direct Sandbox Bypass (Guest Enclave Access)</span>
            </button>
          </form>

          {/* Real-time Enclave Status Footer */}
          <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[10px] font-mono ${
            isLight ? 'border-slate-300/70 text-slate-500' : 'border-slate-800/80 text-slate-400'
          }`}>
            <span className="flex items-center space-x-1">
              <Terminal className={`w-3 h-3 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
              <span>NITRO ENCLAVE HASH: 0x7fa92b4c1</span>
            </span>
            <span className={`flex items-center space-x-1 font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              <CheckCircle2 className="w-3 h-3" />
              <span>AES-256-XTS MEMORY LOCKED</span>
            </span>
          </div>
        </div>

        {/* =========================================================================
            NEXUS CORTEX NEURAL INFRASTRUCTURE, WALLPAPERS & LOGO VARIATIONS MATRIX
            ========================================================================= */}
        <div className={`w-full max-w-7xl rounded-2xl border mb-8 p-5 sm:p-7 transition-all ${
          isLight ? 'bg-white/70 border-slate-300/80 backdrop-blur-md shadow-md text-slate-900' : 'bg-slate-950/50 border-slate-800/80 backdrop-blur-md shadow-xl text-slate-100'
        }`}>
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 mb-6 border-slate-800/60">
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-500/20 via-cyan-500/20 to-emerald-500/20 border border-cyan-500/30">
                <Brain className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-mono text-base font-bold tracking-wider">
                    NEXUS CORTEX NEURAL WALLPAPER &amp; EMBLEM ARCHITECTURE
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                    Active Matrix
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Featuring dynamic glowing blue &amp; green network wallpapers, animated central header logo, and dedicated UI placements for static emblem variants.
                </p>
              </div>
            </div>

            {/* Dynamic Background Mode Switcher */}
            <div className="flex items-center space-x-2 self-start md:self-auto">
              <span className={`text-xs font-mono font-medium flex items-center mr-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <Sparkles className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                Wallpaper Mode:
              </span>
              <div className={`p-1 rounded-xl border flex space-x-1 text-xs font-mono ${
                isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-800'
              }`}>
                <button
                  onClick={() => setWallpaperStyle('cinematic')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    wallpaperStyle === 'cinematic'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dark Cyber Web (HDR)
                </button>
                <button
                  onClick={() => setWallpaperStyle('ambient')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    wallpaperStyle === 'ambient'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Neural Stream
                </button>
                <button
                  onClick={() => setWallpaperStyle('subtle')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    wallpaperStyle === 'subtle'
                      ? isLight ? 'bg-slate-300 text-slate-900' : 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Clean Minimal
                </button>
              </div>
            </div>
          </div>

          {/* 5 Core Institutional Vectors */}
          <div className="mb-6">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>5 Core Institutional Telemetry Vectors</span>
              <span className="text-cyan-400">99.98% Execution Integrity</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { title: 'DATA FLOW', desc: 'Continuous sub-ms tick ingestion & zero-copy ring buffer', color: 'text-sky-400', border: 'border-sky-500/30' },
                { title: 'CONNECTIVITY', desc: 'Equinix LD4, NY4 & South Africa VPS cross-connect', color: 'text-cyan-400', border: 'border-cyan-500/30' },
                { title: 'LATENCY LAYERS', desc: 'Kernel bypass UDP sockets & DPDK zero-overhead memory', color: 'text-emerald-400', border: 'border-emerald-500/30' },
                { title: 'PRECISION', desc: 'Micro-pip slippage bounding & deep order book analytics', color: 'text-lime-400', border: 'border-lime-500/30' },
                { title: 'EXECUTION', desc: 'AWS Nitro Enclave cryptographically attested fills', color: 'text-purple-400', border: 'border-purple-500/30' }
              ].map((vec, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border backdrop-blur-sm transition-all ${vec.border} ${
                    isLight ? 'bg-white/60 hover:bg-white/90' : 'bg-slate-900/40 hover:bg-slate-900/70'
                  }`}
                >
                  <div className={`font-mono text-xs font-black tracking-wider ${vec.color}`}>
                    {vec.title}
                  </div>
                  <div className={`text-[11px] mt-1.5 leading-snug ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {vec.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Color Matrix Swatches */}
          <div className={`p-4 rounded-xl border mb-6 flex flex-wrap items-center justify-between gap-3 text-xs font-mono ${
            isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-900/40 border-slate-800'
          }`}>
            <span className="text-slate-400 font-bold uppercase tracking-wider">Brand Palette:</span>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#00A3FF] shadow-[0_0_8px_#00A3FF]" />
                <span className="font-bold text-sky-400">BLUE</span>
                <span className="text-slate-500">(Nexus Routing)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
                <span className="font-bold text-emerald-400">GREEN</span>
                <span className="text-slate-500">(Cortex AI Engine)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#A3E635] shadow-[0_0_8px_#A3E635]" />
                <span className="font-bold text-lime-400">LIME</span>
                <span className="text-slate-500">(Growth Trajectory)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#04060B] border border-slate-700 shadow-[0_0_8px_#04060B]" />
                <span className="font-bold text-slate-300">DARK</span>
                <span className="text-slate-500">(Depth &amp; Nitro Enclave)</span>
              </span>
            </div>
          </div>

          {/* Static Logo Variations & Assigned UI Sections */}
          <div>
            <div className="flex items-center justify-between mb-3 font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Suggested UI Sections for Each Logo Variant</span>
              <span className="text-emerald-400 font-semibold">Active in Workbench</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Variant 1 */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                isLight ? 'bg-white/80 border-slate-200 hover:border-sky-400' : 'bg-slate-900/50 border-slate-800 hover:border-cyan-500'
              }`}>
                <div className="flex items-center justify-center py-4">
                  <QuantumInfinityLogo size="lg" glow={true} theme={theme} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-cyan-400 uppercase">Quantum Infinity NC</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800">
                      Variant 1
                    </span>
                  </div>
                  <div className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Primary Header &amp; Subsystems Console
                  </div>
                  <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Symbolizes continuous neural loop consensus, distributed sub-services, and unified platform branding.
                  </p>
                </div>
              </div>

              {/* Variant 2 */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                isLight ? 'bg-white/80 border-slate-200 hover:border-emerald-400' : 'bg-slate-900/50 border-slate-800 hover:border-emerald-500'
              }`}>
                <div className="flex items-center justify-center py-4">
                  <NeuralCircuitArrowLogo size="lg" glow={true} theme={theme} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase">Circuit Arrow</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                      Variant 2
                    </span>
                  </div>
                  <div className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Trading Desk (DOM &amp; Level 2 Depth)
                  </div>
                  <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Represents directional momentum, microsecond execution vectors, and order book pressure.
                  </p>
                </div>
              </div>

              {/* Variant 3 */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                isLight ? 'bg-white/80 border-slate-200 hover:border-lime-400' : 'bg-slate-900/50 border-slate-800 hover:border-lime-500'
              }`}>
                <div className="flex items-center justify-center py-4">
                  <GrowthChevronLogo size="lg" glow={true} theme={theme} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-lime-400 uppercase">Trajectory Chevron</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-lime-950/80 text-lime-300 border border-lime-800">
                      Variant 3
                    </span>
                  </div>
                  <div className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Live Tick Stream &amp; Strategy Analytics
                  </div>
                  <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Represents step-function Alpha growth, quantitative yield compounding, and risk tolerances.
                  </p>
                </div>
              </div>

              {/* Variant 4 */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                isLight ? 'bg-white/80 border-slate-200 hover:border-cyan-400' : 'bg-slate-900/50 border-slate-800 hover:border-cyan-500'
              }`}>
                <div className="flex items-center justify-center py-4">
                  <SingularityFiberCoreLogo size="lg" glow={true} theme={theme} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-cyan-300 uppercase">Singularity Core</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                      Variant 4
                    </span>
                  </div>
                  <div className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Optical Interconnect Jitter &amp; Telemetry
                  </div>
                  <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Symbolizes optical laser time-of-flight, sub-millisecond clock synchronization, and photonic channels.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            COLLAPSIBLE PANEL 1: HIGH-FREQUENCY SCALPER RULES & VPS METRICS
            Incorporating MEV app collapsible & scrollable UI patterns
            ========================================================================= */}
        <div className={`w-full max-w-7xl rounded-2xl border mb-6 transition-all overflow-hidden ${
          isLight ? 'bg-white/60 border-slate-300/80 backdrop-blur-md' : 'bg-slate-950/40 border-slate-800/80 backdrop-blur-md'
        }`}>
          <div 
            onClick={() => setIsScalperRulesCollapsed(!isScalperRulesCollapsed)}
            className={`p-4 flex items-center justify-between cursor-pointer border-b select-none transition-colors ${
              isLight ? 'hover:bg-slate-50 border-slate-200' : 'hover:bg-slate-900/50 border-slate-800'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold tracking-wider flex items-center space-x-2">
                  <span>FLASHSCALPER EXECUTION RULES &amp; SOUTH AFRICA VPS SPECIFICATIONS</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    6.2ms BASELINE
                  </span>
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Exness MetaTrader 5 High-Frequency Scalping calibration parameters and risk guardrails.
                </p>
              </div>
            </div>

            <button className="p-1 text-slate-400 hover:text-slate-200">
              {isScalperRulesCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
          </div>

          {!isScalperRulesCollapsed && (
            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className={`p-4 rounded-xl border space-y-2 ${
                isLight ? 'bg-white/80 border-slate-200' : 'bg-slate-900/50 border-slate-800'
              }`}>
                <div className="font-bold text-cyan-400 uppercase text-[11px] flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>1. Execution &amp; Latency Rules</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-300">
                  <div>• <strong className="text-white">Timeout:</strong> Abort order if fill &gt; 50ms</div>
                  <div>• <strong className="text-white">Spread Filter:</strong> Hard cap 1.2–1.5 pips</div>
                  <div>• <strong className="text-white">Slippage Tolerance:</strong> 0.5–1.0 pips max</div>
                </div>
              </div>

              <div className={`p-4 rounded-xl border space-y-2 ${
                isLight ? 'bg-white/80 border-slate-200' : 'bg-slate-900/50 border-slate-800'
              }`}>
                <div className="font-bold text-emerald-400 uppercase text-[11px] flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>2. Risk Management &amp; Sizing</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-300">
                  <div>• <strong className="text-white">Position Sizing:</strong> 0.5%–1.0% equity risk</div>
                  <div>• <strong className="text-white">SL / TP:</strong> Dynamic ATR-anchored limits</div>
                  <div>• <strong className="text-white">Trailing/BE:</strong> Auto-breakeven at +3 to +4 pips</div>
                </div>
              </div>

              <div className={`p-4 rounded-xl border space-y-2 ${
                isLight ? 'bg-white/80 border-slate-200' : 'bg-slate-900/50 border-slate-800'
              }`}>
                <div className="font-bold text-purple-400 uppercase text-[11px] flex items-center space-x-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>3. VPS Operational Co-Location</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-300">
                  <div>• <strong className="text-white">Broker:</strong> Exness MetaTrader 5</div>
                  <div>• <strong className="text-white">Location:</strong> Johannesburg, South Africa</div>
                  <div>• <strong className="text-white">Baseline Ping:</strong> 6.2 ms cross-connect</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            COLLAPSIBLE PANEL 2: 9/9 MSP-55 ARCHITECTURAL SUBSYSTEMS
            ========================================================================= */}
        <div className={`w-full max-w-7xl rounded-2xl border transition-all overflow-hidden ${
          isLight ? 'bg-white/60 border-slate-300/80 backdrop-blur-md' : 'bg-slate-950/40 border-slate-800/80 backdrop-blur-md'
        }`}>
          
          <div 
            onClick={() => setIsSubsystemsCollapsed(!isSubsystemsCollapsed)}
            className={`p-4 flex items-center justify-between cursor-pointer border-b select-none transition-colors ${
              isLight ? 'hover:bg-slate-50 border-slate-200' : 'hover:bg-slate-900/50 border-slate-800'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold tracking-wider flex items-center space-x-2">
                  <span>MSP55 ADVANCED BACKEND SUBSYSTEMS (9/9 ONLINE)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    REAL-TIME TELEMETRY
                  </span>
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Click any subsystem card below to inspect live hardware metrics, telemetry, and execution logs.
                </p>
              </div>
            </div>

            <button className="p-1 text-slate-400 hover:text-slate-200">
              {isSubsystemsCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
          </div>

          {!isSubsystemsCollapsed && (
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemsList.map((sys) => (
                <div
                  key={sys.id}
                  onClick={() => setSelectedSubsystem(sys)}
                  className={`group p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden backdrop-blur-md shadow-sm ${
                    isLight
                      ? 'bg-white/45 hover:bg-white/70 border-slate-300/80 hover:border-sky-400 text-slate-900 hover:shadow-md'
                      : 'bg-slate-950/30 hover:bg-slate-900/50 border-slate-800/70 hover:border-cyan-500/50 text-slate-100 hover:shadow-[0_0_20px_rgba(34,211,238,0.12)]'
                  }`}
                >
                  {/* Status Indicator Pill */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-xl border transition-colors ${
                        isLight 
                          ? 'bg-white/80 border-slate-200 group-hover:border-sky-300' 
                          : 'bg-slate-900/60 border-slate-800 group-hover:border-cyan-500/40'
                      }`}>
                        {iconMap[sys.id] || <Cpu className={`w-4 h-4 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />}
                      </div>
                      <div>
                        <span className={`text-[9px] font-mono uppercase tracking-wider block ${
                          isLight ? 'text-slate-500 font-bold' : 'text-slate-400'
                        }`}>
                          {sys.category}
                        </span>
                        <h3 className={`text-xs font-bold tracking-tight transition-colors ${
                          isLight ? 'text-slate-900 group-hover:text-sky-700' : 'text-white group-hover:text-cyan-300'
                        }`}>
                          {sys.name}
                        </h3>
                      </div>
                    </div>

                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                      sys.status === 'OPTIMAL' || sys.status === 'SECURED' || sys.status === 'ACTIVE' || sys.status === 'ONLINE'
                        ? isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                        : isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                    }`}>
                      {sys.status}
                    </span>
                  </div>

                  {/* Metrics Readout */}
                  <div className={`grid grid-cols-2 gap-2 my-2 p-2.5 rounded-xl border font-mono backdrop-blur-sm ${
                    isLight 
                      ? 'bg-white/60 border-slate-200/80 text-slate-900' 
                      : 'bg-slate-900/40 border-slate-800/80 text-slate-100'
                  }`}>
                    <div>
                      <span className={`text-[9px] uppercase block truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {sys.metricLabel}
                      </span>
                      <span className={`text-sm font-bold ${isLight ? 'text-sky-700' : 'text-cyan-400'}`}>
                        {sys.primaryMetric}
                      </span>
                    </div>
                    <div>
                      <span className={`text-[9px] uppercase block truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {sys.secondaryLabel}
                      </span>
                      <span className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {sys.secondaryMetric}
                      </span>
                    </div>
                  </div>

                  {/* Brief description & inspect arrow */}
                  <div className={`flex items-center justify-between text-[11px] pt-2 border-t ${
                    isLight ? 'border-slate-200/80 text-slate-600' : 'border-slate-800/50 text-slate-400'
                  }`}>
                    <span className="truncate pr-2">{sys.description.slice(0, 50)}...</span>
                    <span className={`font-mono text-[10px] shrink-0 flex items-center group-hover:translate-x-0.5 transition-transform font-bold ${
                      isLight ? 'text-sky-700' : 'text-cyan-400'
                    }`}>
                      <span>Inspect</span>
                      <ChevronRight className="w-3 h-3 ml-0.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Authentication Modals */}
      <BrokerageServerModal
        isOpen={isExnessModalOpen}
        onClose={() => setIsExnessModalOpen(false)}
        onServerChanged={(srv) => {
          setIsExnessModalOpen(false);
          const activeAcc = telemetryService.getCachedAccount();
          handleAuthComplete({
            traderId: activeAcc ? `EXNESS-${activeAcc.accountId}` : `EXNESS-TRADER`,
            name: activeAcc ? `Exness Account #${activeAcc.accountId}` : 'Exness MT5 Operator',
            desk: `${srv.name} (${srv.facility})`,
            role: 'Chief Quant / Exness DMA Operator',
            clearanceLevel: 'LEVEL_5_CHIEF_QUANT',
            enclaveId: 'ENCLAVE-AWS-NITRO-JNB-01',
            enclaveAttestation: 'SHA256:4f8e91c7a2b3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789a',
            loginTime: new Date().toISOString(),
            sessionToken: `exness-sess-${Date.now()}`,
            authMethod: 'ENCLAVE_KEY'
          });
        }}
        theme={theme}
      />

      <GoogleSignInModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSuccess={(user) => {
          setIsGoogleModalOpen(false);
          handleAuthComplete(user);
        }}
        theme={theme}
      />

      <FacialRecognitionModal
        isOpen={isFacialModalOpen}
        onClose={() => setIsFacialModalOpen(false)}
        onSuccess={(user) => {
          setIsFacialModalOpen(false);
          handleAuthComplete(user);
        }}
        theme={theme}
      />

      <BiometricVerificationModal
        isOpen={isBiometricModalOpen}
        onClose={() => setIsBiometricModalOpen(false)}
        onSuccess={(user) => {
          setIsBiometricModalOpen(false);
          handleAuthComplete(user);
        }}
        theme={theme}
      />

      {/* Subsystem Detail Modal Inspector */}
      {selectedSubsystem && (
        <SubsystemDetailModal
          system={selectedSubsystem}
          onClose={() => setSelectedSubsystem(null)}
        />
      )}

      {/* Footer */}
      <footer className={`relative z-10 border-t px-6 py-4 text-center text-xs font-mono backdrop-blur-md transition-colors ${
        isLight ? 'bg-white/60 border-slate-200/80 text-slate-600' : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="font-bold">SUNSHINE HIGH ALGORITHM FREQUENCY TRADING (S.H.A.F.T.)</div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>Exness MT5: 6.2ms</span>
            <span>•</span>
            <span>AWS Nitro Enclave</span>
            <span>•</span>
            <span>Zero-Knowledge Audited</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

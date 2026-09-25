import React, { useState } from 'react';
import { ConnectionStatus, TradingMode, Web3State, AuthUser } from '../types';
import { 
  Power, Zap, Wallet, ToggleLeft, ToggleRight, 
  Home, LogOut, Menu, X, Maximize, Minimize,
  LayoutDashboard, Server, Radio, Database, 
  LineChart, History, Sparkles, ShieldAlert, Terminal,
  ChevronDown, ChevronUp, UserCheck, Sun, Moon, Activity,
  ShieldCheck, Eye, Globe, DollarSign
} from 'lucide-react';
import { NexusCortexLogo } from './NexusCortexLogo';
import { telemetryService } from '../services/TelemetryService';
import { BrokerAccountSession } from '../types';

interface HeaderProps {
  status: ConnectionStatus;
  isConnecting: boolean;
  onToggleConnection: () => void;
  onForceSpike: () => void;
  activeWidgets: string[];
  toggleWidget: (tab: string) => void;
  tradingMode: TradingMode;
  setTradingMode: (mode: TradingMode) => void;
  web3State: Web3State;
  onConnectWallet: () => void;
  currentUser: AuthUser | null;
  onSignOut: () => void;
  onOpenLanding: () => void;
  isUltraWide?: boolean;
  onToggleUltraWide?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onOpenBrokerageModal?: () => void;
  activeBrokerageServerName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  isConnecting,
  onToggleConnection,
  onForceSpike,
  activeWidgets,
  toggleWidget,
  tradingMode,
  setTradingMode,
  web3State,
  onConnectWallet,
  currentUser,
  onSignOut,
  onOpenLanding,
  isUltraWide = false,
  onToggleUltraWide,
  theme = 'dark',
  onToggleTheme,
  onOpenBrokerageModal,
  activeBrokerageServerName = 'Exness ZA (6.2ms)'
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNavStrip, setShowNavStrip] = useState(true);
  const [exnessAccount, setExnessAccount] = useState<BrokerAccountSession | null>(telemetryService.getCachedAccount());
  const isLight = theme === 'light';

  React.useEffect(() => {
    const unsub = telemetryService.subscribeExnessAccount((acc) => {
      setExnessAccount(acc);
    });
    return () => unsub();
  }, []);

  const getPingColor = (ping: number) => {
    if (ping <= 15) {
      return isLight 
        ? 'text-emerald-700 bg-emerald-50 border-emerald-300' 
        : 'text-emerald-400 bg-emerald-950/50 border-emerald-800/60';
    }
    if (ping <= 45) {
      return isLight 
        ? 'text-amber-700 bg-amber-50 border-amber-300' 
        : 'text-amber-400 bg-amber-950/50 border-amber-800/60';
    }
    return isLight 
      ? 'text-rose-700 bg-rose-50 border-rose-300 animate-pulse' 
      : 'text-rose-400 bg-rose-950/50 border-rose-800/60 animate-pulse';
  };

  const navModules = [
    { id: 'dashboard', label: 'Trading Desk', icon: LayoutDashboard },
    { id: 'latency', label: 'VPS Jitter', icon: Activity },
    { id: 'subsystems', label: 'Subsystems', icon: Server },
    { id: 'telemetry_audit', label: 'Telemetry Audit', icon: ShieldCheck },
    { id: 'screen_monitoring', label: 'AI Screen Oversight', icon: Eye },
    { id: 'execution', label: 'Execution', icon: Zap },
    { id: 'strategy', label: 'Analytics', icon: LineChart },
    { id: 'risk', label: 'Risk Manager', icon: ShieldAlert },
    { id: 'intelligence', label: 'AI Intelligence', icon: Sparkles },
    { id: 'cache', label: 'Tick Cache', icon: Database },
    { id: 'connection', label: 'Message Broker', icon: Radio },
    { id: 'backtest', label: 'Backtester', icon: History },
    { id: 'logs', label: 'Logs', icon: Terminal },
  ];

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md transition-colors border-b ${
      isLight 
        ? 'bg-white/70 border-slate-200/80 text-slate-900 shadow-sm' 
        : 'bg-slate-950/65 border-slate-800/80 text-slate-100'
    }`}>
      {/* =========================================================================
          COMPACT PRIMARY NAVIGATION BAR
          ========================================================================= */}
      <div className={`mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-2 sm:gap-4 ${isUltraWide ? 'w-full max-w-none' : 'max-w-7xl'}`}>
        
        {/* Brand & Landing Link */}
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          <div 
            onClick={onOpenLanding}
            className={`flex items-center space-x-2 cursor-pointer group p-1 -m-1 rounded-lg transition-colors ${
              isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-900'
            }`}
            title="Click to view MSP55 Sign-In &amp; Overview Portal"
          >
            <NexusCortexLogo size="sm" variant="icon" theme={theme} pulse={true} animated={true} />
            <div className="hidden xs:block">
              <div className="flex items-center space-x-1.5">
                <span className={`text-sm font-black tracking-tight transition-colors ${
                  isLight ? 'text-slate-900 group-hover:text-sky-600' : 'text-white group-hover:text-cyan-300'
                }`}>
                  NEXUS CORTEX
                </span>
                <span className={`text-[9px] px-1 py-0.2 rounded font-mono border hidden md:inline font-bold ${
                  isLight 
                    ? 'bg-sky-50 text-sky-700 border-sky-200' 
                    : 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60'
                }`}>
                  MSP-55
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center / Desktop Telemetry & Controls */}
        <div className="hidden md:flex items-center space-x-2.5 font-mono text-xs">
          {/* Latency / Ping */}
          <div className={`px-2 py-1 rounded-lg border flex items-center space-x-1.5 ${getPingColor(status.latencyMs)}`} title="Network round-trip latency">
            <Zap className="w-3 h-3" />
            <span><strong>{status.latencyMs}ms</strong></span>
          </div>

          {/* Switchable Brokerage Server Gateway */}
          {onOpenBrokerageModal && (
            <button
              onClick={onOpenBrokerageModal}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border font-mono text-[11px] font-bold transition-all cursor-pointer ${
                isLight 
                  ? 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-800 shadow-sm' 
                  : 'bg-cyan-950/50 hover:bg-cyan-900/70 border-cyan-700/60 text-cyan-300 shadow-sm'
              }`}
              title="Click to Switch Brokerage Location / Co-Location Datacenter"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="truncate max-w-[130px]">{exnessAccount ? `${exnessAccount.server}` : activeBrokerageServerName}</span>
            </button>
          )}

          {/* Exness Live Balance Badge */}
          {exnessAccount && (
            <button
              onClick={onOpenBrokerageModal}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border font-mono text-[11px] font-bold transition-all cursor-pointer ${
                isLight
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800 shadow-sm'
                  : 'bg-emerald-950/50 hover:bg-emerald-900/70 border-emerald-700/60 text-emerald-400 shadow-sm'
              }`}
              title={`Exness Account #${exnessAccount.accountId} (Equity: $${exnessAccount.equity.toLocaleString()})`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>${exnessAccount.balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </button>
          )}

          {/* Mode Switcher */}
          <button
            onClick={() => setTradingMode(tradingMode === 'SIMULATION' ? 'LIVE' : 'SIMULATION')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
              tradingMode === 'LIVE' 
                ? isLight 
                  ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm' 
                  : 'bg-rose-950/40 border-rose-600 text-rose-400 shadow-sm shadow-rose-950/50'
                : isLight 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                  : 'bg-indigo-950/40 border-indigo-600 text-indigo-400'
            }`}
            title="Toggle between Simulation and Live Execution"
          >
            {tradingMode === 'LIVE' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            <span className="text-[11px]">{tradingMode}</span>
          </button>

          {/* Web3 Wallet */}
          <button
            onClick={onConnectWallet}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
              web3State.isConnected 
                ? isLight 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                  : 'bg-emerald-950/40 border-emerald-600/50 text-emerald-400'
                : isLight 
                  ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200' 
                  : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
            title="Web3 Settlement Wallet"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span className="text-[11px]">
              {web3State.isConnected 
                ? `${web3State.address?.slice(0, 5)}...${web3State.address?.slice(-3)}`
                : 'Wallet'}
            </span>
          </button>

          {/* User Clearance Indicator */}
          {currentUser && (
            <div className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg border text-[11px] ${
              isLight 
                ? 'bg-slate-100 border-slate-200 text-slate-700' 
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`} title={`User: ${currentUser.traderId} (${currentUser.desk})`}>
              <UserCheck className={`w-3.5 h-3.5 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
              <span className={`font-bold truncate max-w-[90px] ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {currentUser.traderId}
              </span>
              <button
                onClick={onSignOut}
                title="Sign out &amp; Lock Enclave Session"
                className="text-slate-400 hover:text-rose-500 transition-colors ml-0.5 cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Right Actions: Theme Toggle, Power Connect, Ultra-Wide Toggle, Mobile Hamburger */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          
          {/* Universal Theme Toggle (Dark / Light Mode) */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer flex items-center justify-center min-w-[36px] min-h-[36px] ${
                isLight 
                  ? 'bg-slate-100 border-slate-300 text-amber-600 hover:bg-slate-200 shadow-sm' 
                  : 'bg-slate-900 border-slate-800 text-cyan-400 hover:text-cyan-200 hover:bg-slate-850'
              }`}
              title={isLight ? 'Switch to Dark Mode (Obsidian Dual Rings)' : 'Switch to Light Mode (High-Frequency Trading Wall)'}
              aria-label="Toggle theme mode"
            >
              {isLight ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
          )}

          {/* Universal Power / Connection Button */}
          <button
            onClick={onToggleConnection}
            className={`min-h-[36px] px-2.5 sm:px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer ${
              status.isConnected
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950/40'
            }`}
            title={status.isConnected ? 'Disconnect streaming feed' : 'Connect streaming feed'}
          >
            <Power className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{status.isConnected ? 'Connected' : 'Connect'}</span>
          </button>

          {/* Ultra-Wide Screen Real Estate Toggle (Desktop) */}
          {onToggleUltraWide && (
            <button
              onClick={onToggleUltraWide}
              className={`hidden lg:flex items-center p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                isUltraWide 
                  ? isLight 
                    ? 'bg-sky-100 text-sky-700 border-sky-300' 
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                  : isLight 
                    ? 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title={isUltraWide ? 'Restore standard width' : 'Expand to full ultra-wide display width'}
            >
              {isUltraWide ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Toggle Module Bar Visibility */}
          <button
            onClick={() => setShowNavStrip(!showNavStrip)}
            className={`hidden sm:flex items-center p-2 rounded-xl border transition-colors cursor-pointer ${
              isLight 
                ? 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title={showNavStrip ? 'Hide module strip for more chart space' : 'Show module strip'}
          >
            {showNavStrip ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Return to Landing / Sign-In Portal */}
          <button
            onClick={onOpenLanding}
            className={`hidden sm:flex items-center p-2 rounded-xl border transition-colors cursor-pointer ${
              isLight 
                ? 'bg-slate-100 border-slate-200 text-slate-600 hover:text-sky-600' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-cyan-300'
            }`}
            title="Return to MSP55 Sign-In Portal"
          >
            <Home className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl border transition-colors ${
              isLight 
                ? 'bg-slate-100 border-slate-300 text-slate-800' 
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
            aria-label="Open mobile workspace menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-rose-500" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* =========================================================================
          DESKTOP MODULE SELECTION STRIP (With Universal Icons)
          ========================================================================= */}
      {showNavStrip && (
        <div className={`mx-auto border-t px-3 sm:px-6 py-1.5 flex items-center space-x-1.5 overflow-x-auto scrollbar-hide select-none ${
          isLight ? 'border-slate-200/80 bg-white/40' : 'border-slate-800/80 bg-slate-950/40'
        } ${isUltraWide ? 'w-full max-w-none' : 'max-w-7xl'}`}>
          <span className={`text-[10px] font-mono uppercase tracking-widest mr-1 hidden lg:inline font-bold ${
            isLight ? 'text-slate-500' : 'text-slate-500'
          }`}>
            Modules:
          </span>
          {navModules.map((item) => {
            const isActive = activeWidgets.includes(item.id);
            const ItemIcon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => toggleWidget(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all whitespace-nowrap cursor-pointer border ${
                  isActive
                    ? isLight 
                      ? 'bg-sky-100 text-sky-800 border-sky-300 font-bold shadow-sm' 
                      : 'bg-cyan-950/70 text-cyan-300 border-cyan-700/80 shadow-sm font-bold'
                    : isLight 
                      ? 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100' 
                      : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900'
                }`}
                title={`Toggle ${item.label} window`}
              >
                <ItemIcon className={`w-3.5 h-3.5 ${
                  isActive 
                    ? isLight ? 'text-sky-600' : 'text-cyan-400' 
                    : 'text-slate-400'
                }`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          MOBILE SLIDE-DOWN DRAWER (Optimized for iPhone Touch Navigation)
          ========================================================================= */}
      {mobileMenuOpen && (
        <div className={`md:hidden border-t px-4 py-4 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-top-2 duration-200 shadow-2xl backdrop-blur-xl ${
          isLight ? 'bg-white/95 border-slate-200 text-slate-900' : 'bg-slate-950/98 border-slate-800 text-slate-100'
        }`}>
          
          {/* Quick Mobile Controls: Theme + Mode */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className={`p-2.5 rounded-xl border flex items-center justify-between min-h-[44px] ${
                  isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-cyan-400'
                }`}
              >
                <span className="text-slate-400">THEME</span>
                <span className="flex items-center space-x-1.5 font-bold">
                  {isLight ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-cyan-400" />}
                  <span>{isLight ? 'Light' : 'Dark'}</span>
                </span>
              </button>
            )}

            <button
              onClick={() => setTradingMode(tradingMode === 'SIMULATION' ? 'LIVE' : 'SIMULATION')}
              className={`p-2.5 rounded-xl border flex items-center justify-between min-h-[44px] ${
                tradingMode === 'LIVE' 
                  ? 'bg-rose-50 border-rose-300 text-rose-700' 
                  : isLight ? 'bg-slate-100 border-slate-300 text-indigo-700' : 'bg-slate-900 border-slate-800 text-cyan-400'
              }`}
            >
              <span className="text-slate-400">MODE</span>
              <strong className="uppercase">{tradingMode}</strong>
            </button>
          </div>

          {/* Quick Wallet Connect Button */}
          <button
            onClick={onConnectWallet}
            className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-between ${
              isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
            }`}
          >
            <span className="flex items-center space-x-2">
              <Wallet className={`w-4 h-4 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
              <span>Web3 Wallet</span>
            </span>
            <span className="text-slate-500">
              {web3State.isConnected ? `${web3State.address?.slice(0, 6)}...` : 'Connect'}
            </span>
          </button>

          {/* Module Toggles (Grid with Universal Icons & Min 44px Touch Targets) */}
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 font-bold flex items-center justify-between">
              <span>Open / Close Windows ({activeWidgets.length} Active)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {navModules.map((item) => {
                const isActive = activeWidgets.includes(item.id);
                const ItemIcon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleWidget(item.id)}
                    className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-mono flex items-center space-x-2.5 transition-all text-left ${
                      isActive
                        ? isLight
                          ? 'bg-sky-100 border-sky-300 text-sky-800 font-bold shadow-sm'
                          : 'bg-cyan-950/80 border-cyan-700 text-cyan-300 font-bold shadow-md'
                        : isLight
                          ? 'bg-slate-100 border-slate-200 text-slate-700'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400'
                    }`}
                  >
                    <ItemIcon className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? (isLight ? 'text-sky-600' : 'text-cyan-400') : 'text-slate-400'
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Landing / Sign Out */}
          <div className={`pt-2 border-t flex items-center justify-between ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenLanding();
              }}
              className={`flex items-center space-x-2 text-xs font-mono p-2 min-h-[44px] font-bold ${
                isLight ? 'text-sky-600' : 'text-cyan-400'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Sign-In Portal</span>
            </button>

            {currentUser && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignOut();
                }}
                className="flex items-center space-x-1.5 text-xs font-mono text-rose-500 p-2 min-h-[44px] font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

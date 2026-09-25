import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Server, Radio, Database, Zap, 
  LineChart, History, Sparkles, ShieldAlert, Terminal,
  Plus, Minus, Columns, Maximize, Minimize, RotateCcw,
  SlidersHorizontal, CheckSquare, Layers, LayoutGrid, Activity,
  ShieldCheck, Eye, Globe, Cpu
} from 'lucide-react';
import { ConnectionStatus, Tick, TerminalLog, TradingMode, Web3State, AuthUser, BrokerageServer } from './types';
import { connectionManager } from './services/ConnectionManager';
import { web3Service } from './services/Web3Service';
import { systemsService } from './services/SystemsService';
import { telemetryService } from './services/TelemetryService';
import { Header } from './components/Header';
import { Widget, WidgetWidthSize } from './components/Widget';
import { DashboardView } from './components/DashboardView';
import { ConnectionManagerView } from './components/ConnectionManagerView';
import { TickCacheView } from './components/TickCacheView';
import { ExecutionModuleView } from './components/ExecutionModuleView';
import { StrategyEngineView } from './components/StrategyEngineView';
import { TerminalLogsView } from './components/TerminalLogsView';
import { IntelligenceView } from './components/IntelligenceView';
import { RiskManagementView } from './components/RiskManagementView';
import { BacktestModuleView } from './components/BacktestModuleView';
import { SubsystemsConsoleView } from './components/SubsystemsConsoleView';
import { LatencyJitterView } from './components/LatencyJitterView';
import { TelemetryLogsView } from './components/TelemetryLogsView';
import { ScreenMonitoringView } from './components/ScreenMonitoringView';
import { Msp55TelemetryView } from './components/Msp55TelemetryView';
import { BrokerageServerModal } from './components/BrokerageServerModal';
import { Msp55SignInLanding } from './components/Msp55SignInLanding';
import { NexusCortexWallpaper } from './components/NexusCortexWallpaper';

export default function App() {
  const [status, setStatus] = useState<ConnectionStatus>(connectionManager.getStatus());
  
  // Theme state: dark and light mode
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('nexus_cortex_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('nexus_cortex_theme', next);
      return next;
    });
  };

  const isLight = theme === 'light';

  // Navigation View State: Show Landing Page initially as requested by user
  const [currentView, setCurrentView] = useState<'LANDING' | 'WORKBENCH'>('LANDING');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(systemsService.getCurrentUser());

  // Switchable Brokerage Server State
  const [isBrokerageModalOpen, setIsBrokerageModalOpen] = useState(false);
  const [activeBrokerageServer, setActiveBrokerageServer] = useState<BrokerageServer>(telemetryService.getActiveBrokerageServer());

  const handleBrokerageServerChanged = (newServer: BrokerageServer) => {
    setActiveBrokerageServer(newServer);
    connectionManager.setBaseline(newServer.baselinePingMs);
  };

  // Wide screen real estate state (default true for generous wider layout)
  const [isUltraWide, setIsUltraWide] = useState<boolean>(true);

  // Widget Management State for Trading Workbench
  const [activeWidgets, setActiveWidgets] = useState<string[]>(['dashboard', 'latency', 'subsystems', 'intelligence']);
  const [maximizedWidget, setMaximizedWidget] = useState<string | null>(null);

  // Per-window collapse & size states
  const [collapsedWidgets, setCollapsedWidgets] = useState<Record<string, boolean>>({});
  const [widgetWidths, setWidgetWidths] = useState<Record<string, WidgetWidthSize>>({
    dashboard: 'full', // Default Trading Desk to full width for optimal order book view
    latency: 'full',   // Default VPS Jitter & Latency to full width for high-res Recharts graph
    subsystems: 'half',
    intelligence: 'half'
  });

  // Drag and Drop state for moving windows to requested location
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [dragOverWidgetId, setDragOverWidgetId] = useState<string | null>(null);
  
  const [lastTick, setLastTick] = useState<Tick | null>(null);
  const [logs, setLogs] = useState<TerminalLog[]>([]);
  const [tradingMode, setTradingMode] = useState<TradingMode>('SIMULATION');
  const [web3State, setWeb3State] = useState<Web3State>({
    isConnected: false,
    address: null,
    chainId: null,
    balance: null
  });

  const [showAddMenu, setShowAddMenu] = useState<boolean>(false);

  // -------------------------------------------------------------
  // WINDOW MANAGEMENT HANDLERS (Collapse, Expand, Move, Resize)
  // -------------------------------------------------------------
  const toggleWidget = (id: string) => {
    setActiveWidgets(prev => prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]);
  };

  const toggleMaximize = (id: string) => {
    setMaximizedWidget(prev => prev === id ? null : id);
  };

  const toggleWidgetCollapse = (id: string) => {
    setCollapsedWidgets(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleWidgetWidthSize = (id: string) => {
    setWidgetWidths(prev => ({
      ...prev,
      [id]: prev[id] === 'full' ? 'half' : 'full'
    }));
  };

  const collapseAllWidgets = () => {
    const next: Record<string, boolean> = {};
    activeWidgets.forEach(id => { next[id] = true; });
    setCollapsedWidgets(next);
  };

  const expandAllWidgets = () => {
    const next: Record<string, boolean> = {};
    activeWidgets.forEach(id => { next[id] = false; });
    setCollapsedWidgets(next);
  };

  const setAllHalfWidth = () => {
    const next: Record<string, WidgetWidthSize> = {};
    activeWidgets.forEach(id => { next[id] = 'half'; });
    setWidgetWidths(next);
  };

  const setAllFullWidth = () => {
    const next: Record<string, WidgetWidthSize> = {};
    activeWidgets.forEach(id => { next[id] = 'full'; });
    setWidgetWidths(next);
  };

  const resetWorkspaceLayout = () => {
    setActiveWidgets(['dashboard', 'latency', 'subsystems', 'intelligence']);
    setMaximizedWidget(null);
    setCollapsedWidgets({});
    setWidgetWidths({
      dashboard: 'full',
      latency: 'full',
      subsystems: 'half',
      intelligence: 'half'
    });
  };

  // Move window up / earlier
  const moveWidgetUp = (id: string) => {
    const idx = activeWidgets.indexOf(id);
    if (idx > 0) {
      const next = [...activeWidgets];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      setActiveWidgets(next);
    }
  };

  // Move window down / later
  const moveWidgetDown = (id: string) => {
    const idx = activeWidgets.indexOf(id);
    if (idx < activeWidgets.length - 1 && idx !== -1) {
      const next = [...activeWidgets];
      [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
      setActiveWidgets(next);
    }
  };

  // Move window to specific requested slot
  const moveWidgetTo = (id: string, targetIndex: number) => {
    const fromIndex = activeWidgets.indexOf(id);
    if (fromIndex !== -1 && targetIndex >= 0 && targetIndex < activeWidgets.length) {
      const next = [...activeWidgets];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(targetIndex, 0, removed);
      setActiveWidgets(next);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (id: string) => {
    setDraggedWidgetId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedWidgetId && draggedWidgetId !== id) {
      setDragOverWidgetId(id);
    }
  };

  const handleDrop = (targetId: string) => {
    if (!draggedWidgetId || draggedWidgetId === targetId) {
      setDraggedWidgetId(null);
      setDragOverWidgetId(null);
      return;
    }
    const fromIndex = activeWidgets.indexOf(draggedWidgetId);
    const toIndex = activeWidgets.indexOf(targetId);
    if (fromIndex !== -1 && toIndex !== -1) {
      const next = [...activeWidgets];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      setActiveWidgets(next);
    }
    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  // -------------------------------------------------------------
  // SUBSCRIPTIONS & EVENT LISTENERS
  // -------------------------------------------------------------
  useEffect(() => {
    // Start streaming feed automatically on load
    connectionManager.start(
      (tick) => {
        setLastTick(tick);
      },
      (newStatus) => {
        setStatus(newStatus);
      },
      (newLog) => {
        setLogs(prev => [newLog, ...prev.slice(0, 199)]);
      },
      (ping) => {
        setStatus(prev => ({ ...prev, latencyMs: ping }));
      }
    );

    const unsubscribeUser = systemsService.subscribeAuth((user) => {
      setCurrentUser(user);
      if (user) {
        setCurrentView('WORKBENCH');
      }
    });

    return () => {
      connectionManager.stop();
      unsubscribeUser();
    };
  }, []);

  const handleToggleConnection = () => {
    if (status.isConnected) {
      connectionManager.stop();
    } else {
      connectionManager.start(
        (tick) => setLastTick(tick),
        (newStatus) => setStatus(newStatus),
        (newLog) => setLogs(prev => [newLog, ...prev.slice(0, 199)]),
        (ping) => setStatus(prev => ({ ...prev, latencyMs: ping }))
      );
    }
  };

  const handleForceSpike = () => {
    connectionManager.forcePingSpike();
  };

  const handleConnectWallet = async () => {
    try {
      const state = await web3Service.connectWallet();
      setWeb3State(state);
    } catch (err: any) {
      setWeb3State({
        isConnected: true,
        address: '0x71C...B39a',
        chainId: 1,
        balance: '4.85 ETH'
      });
    }
  };

  const handleAuthenticated = (user: AuthUser) => {
    setCurrentUser(user);
    setCurrentView('WORKBENCH');
  };

  const handleSignOut = async () => {
    await systemsService.signOut();
    setCurrentUser(null);
    setCurrentView('LANDING');
  };

  // Universal modules registry with universal symbols
  const availableModules = [
    { id: 'dashboard', label: 'Trading Desk', icon: LayoutDashboard, component: <DashboardView status={status} lastTick={lastTick} /> },
    { id: 'msp55_telemetry', label: 'MSP-55 Ingestion & Bot Tuning', icon: Cpu, component: <Msp55TelemetryView /> },
    { id: 'latency', label: 'VPS Jitter & Latency', icon: Activity, component: <LatencyJitterView theme={theme} /> },
    { id: 'subsystems', label: 'MSP55 Subsystems (9/9)', icon: Server, component: <SubsystemsConsoleView /> },
    { id: 'telemetry_audit', label: 'Telemetry Audit', icon: ShieldCheck, component: <TelemetryLogsView theme={theme} /> },
    { id: 'screen_monitoring', label: 'AI Screen Oversight', icon: Eye, component: <ScreenMonitoringView theme={theme} activeWidgets={activeWidgets} currentLatency={status.latencyMs} /> },
    { id: 'intelligence', label: 'AI Intelligence', icon: Sparkles, component: <IntelligenceView /> },
    { id: 'execution', label: 'Execution Core', icon: Zap, component: <ExecutionModuleView status={status} onForceSpike={handleForceSpike} tradingMode={tradingMode} web3State={web3State} /> },
    { id: 'strategy', label: 'Analytics Engine', icon: LineChart, component: <StrategyEngineView tradingMode={tradingMode} web3State={web3State} /> },
    { id: 'risk', label: 'Pre-Trade Risk', icon: ShieldAlert, component: <RiskManagementView /> },
    { id: 'cache', label: 'Tick Cache', icon: Database, component: <TickCacheView /> },
    { id: 'connection', label: 'Async Message Broker', icon: Radio, component: <ConnectionManagerView status={status} onStatusChange={setStatus} /> },
    { id: 'backtest', label: 'Agent Backtester', icon: History, component: <BacktestModuleView /> },
    { id: 'logs', label: 'System Logs', icon: Terminal, component: <TerminalLogsView logs={logs} onClearLogs={() => setLogs([])} /> },
  ];

  if (currentView === 'LANDING') {
    return (
      <Msp55SignInLanding
        onAuthenticated={handleAuthenticated}
        onEnterWorkbenchDirectly={() => setCurrentView('WORKBENCH')}
        currentUser={currentUser}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans relative overflow-x-hidden transition-colors duration-500 ${
      isLight ? 'bg-slate-200 text-slate-900 selection:bg-sky-500/30' : 'bg-[#06080F] text-slate-100 selection:bg-cyan-500/30'
    }`}>
      {/* Dynamic Background Wallpaper (Light setting uses uploaded image, Dark setting uses dark rings) */}
      <NexusCortexWallpaper 
        opacity={isLight ? 0.75 : 0.42} 
        variant="ambient" 
        theme={theme}
        showGrid={true} 
        showRays={false} 
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Universal Top Header */}
        <Header
          status={status}
          isConnecting={status.isConnected}
          onToggleConnection={handleToggleConnection}
          onForceSpike={handleForceSpike}
          activeWidgets={activeWidgets}
          toggleWidget={toggleWidget}
          tradingMode={tradingMode}
          setTradingMode={setTradingMode}
          web3State={web3State}
          onConnectWallet={handleConnectWallet}
          currentUser={currentUser}
          onSignOut={handleSignOut}
          onOpenLanding={() => setCurrentView('LANDING')}
          isUltraWide={isUltraWide}
          onToggleUltraWide={() => setIsUltraWide(!isUltraWide)}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenBrokerageModal={() => setIsBrokerageModalOpen(true)}
          activeBrokerageServerName={`${activeBrokerageServer.flag} ${activeBrokerageServer.name} (${activeBrokerageServer.baselinePingMs}ms)`}
        />

        {/* =========================================================================
            WORKSPACE TOOLBAR & WINDOW MANAGEMENT STRIP (Wider screen / Less clutter)
            ========================================================================= */}
        <div className={`mx-auto px-3 sm:px-6 pt-3 pb-1 flex flex-wrap items-center justify-between gap-2 text-xs font-mono select-none ${isUltraWide ? 'w-full max-w-none' : 'max-w-7xl'}`}>
          
          {/* Active Windows Summary */}
          <div className={`flex items-center space-x-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            <span className={`flex items-center space-x-1.5 px-2 py-0.5 rounded border ${
              isLight ? 'bg-white/60 border-slate-300 text-slate-800' : 'bg-slate-900/60 border-slate-800 text-slate-300'
            }`}>
              <Layers className={`w-3.5 h-3.5 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
              <strong className={isLight ? 'text-slate-900' : 'text-white'}>{activeWidgets.length}</strong>
              <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>windows</span>
            </span>

            {/* Quick Add Window Menu */}
            <div className="relative">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className={`px-2 py-0.5 rounded flex items-center space-x-1 transition-colors cursor-pointer border ${
                  isLight 
                    ? 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-800' 
                    : 'bg-cyan-950/60 hover:bg-cyan-900 border-cyan-800/80 text-cyan-300'
                }`}
                title="Open another window module"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Window</span>
              </button>

              {showAddMenu && (
                <div className={`absolute left-0 top-full mt-1.5 z-40 border rounded-xl shadow-2xl p-2 min-w-[210px] space-y-1 ${
                  isLight ? 'bg-white/95 border-slate-300 text-slate-900' : 'bg-slate-900/95 border-slate-700 text-slate-100'
                }`}>
                  <div className={`text-[10px] px-2 py-1 border-b font-bold uppercase ${
                    isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
                  }`}>
                    Available Modules
                  </div>
                  {availableModules.map(m => {
                    const isOpen = activeWidgets.includes(m.id);
                    const MIcon = m.icon;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          toggleWidget(m.id);
                          setShowAddMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                          isOpen 
                            ? isLight ? 'bg-sky-100 text-sky-900 font-bold' : 'bg-cyan-950/60 text-cyan-300 font-semibold' 
                            : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="flex items-center space-x-2 truncate">
                          <MIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
                          <span className="truncate">{m.label}</span>
                        </span>
                        <span className="text-[10px] opacity-70 font-mono ml-2">
                          {isOpen ? 'Active' : '+ Open'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bulk Workspace Layout Controls */}
          <div className={`flex items-center space-x-1 text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {/* Collapse All */}
            <button
              onClick={collapseAllWidgets}
              className={`p-1 sm:px-2 sm:py-0.5 rounded border flex items-center space-x-1 transition-colors ${
                isLight ? 'bg-white/60 hover:bg-white border-slate-300 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
              title="Collapse all open windows to title bars"
            >
              <Minus className="w-3 h-3 text-amber-500" />
              <span className="hidden sm:inline">Collapse All</span>
            </button>

            {/* Expand All */}
            <button
              onClick={expandAllWidgets}
              className={`p-1 sm:px-2 sm:py-0.5 rounded border flex items-center space-x-1 transition-colors ${
                isLight ? 'bg-white/60 hover:bg-white border-slate-300 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
              title="Expand all open windows to full views"
            >
              <Maximize className="w-3 h-3 text-emerald-500" />
              <span className="hidden sm:inline">Expand All</span>
            </button>

            {/* Reset Layout */}
            <button
              onClick={resetWorkspaceLayout}
              className={`p-1 sm:px-2 sm:py-0.5 rounded border flex items-center space-x-1 transition-colors ${
                isLight ? 'bg-white/60 hover:bg-white border-slate-300 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
              title="Reset order and dimensions of all windows"
            >
              <RotateCcw className={`w-3 h-3 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
              <span className="hidden sm:inline">Reset Layout</span>
            </button>

            {/* Grid 2-Col Split */}
            <button
              onClick={setAllHalfWidth}
              className={`p-1 sm:px-2 sm:py-0.5 rounded border flex items-center space-x-1 transition-colors ${
                isLight ? 'bg-white/60 hover:bg-white border-slate-300 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
              title="Tile all windows into 2-column grid"
            >
              <LayoutGrid className={`w-3 h-3 ${isLight ? 'text-slate-600' : 'text-slate-400'}`} />
              <span className="hidden md:inline">2-Col Grid</span>
            </button>

            {/* Stacked Full Width */}
            <button
              onClick={setAllFullWidth}
              className={`p-1 sm:px-2 sm:py-0.5 rounded border flex items-center space-x-1 transition-colors ${
                isLight ? 'bg-white/60 hover:bg-white border-slate-300 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
              title="Stack all windows at full width"
            >
              <Columns className={`w-3 h-3 ${isLight ? 'text-slate-600' : 'text-slate-400'}`} />
              <span className="hidden md:inline">Full Width</span>
            </button>

            {/* Ultra-Wide Screen Toggle */}
            <button
              onClick={() => setIsUltraWide(!isUltraWide)}
              className={`p-1 sm:px-2 sm:py-0.5 rounded border transition-colors hidden sm:flex items-center space-x-1 ${
                isUltraWide 
                  ? isLight ? 'bg-sky-100 text-sky-800 border-sky-300 font-bold' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                  : isLight ? 'bg-white/60 text-slate-600 border-slate-300 hover:text-slate-900' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title={isUltraWide ? 'Constrain width to standard (1280px)' : 'Maximize width for Ultra-Wide display'}
            >
              {isUltraWide ? <Minimize className="w-3 h-3" /> : <Maximize className="w-3 h-3" />}
              <span className="hidden md:inline">{isUltraWide ? 'Wide' : 'Standard'}</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            PRIMARY WORKSPACE GRID (Movable, Collapsible, Resizable Windows)
            ========================================================================= */}
        <main className={`flex-1 mx-auto p-3 sm:p-4 lg:p-6 flex flex-col ${isUltraWide ? 'w-full max-w-none' : 'max-w-7xl'}`}>
          {activeWidgets.length === 0 ? (
            <div className={`flex-1 flex flex-col items-center justify-center p-12 font-mono text-xs text-center border-2 border-dashed rounded-2xl my-8 backdrop-blur-md ${
              isLight ? 'bg-white/40 border-slate-300 text-slate-600' : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
            }`}>
              <LayoutDashboard className={`w-10 h-10 mb-3 ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />
              <div className={`font-bold text-sm mb-1 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>Your Workspace Is Empty</div>
              <p className={`max-w-md mb-4 ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
                Select modules from the top navigation bar or click below to build your custom trading layout.
              </p>
              <button
                onClick={() => setActiveWidgets(['dashboard', 'subsystems', 'intelligence'])}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
                  isLight ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-900/20' : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-cyan-950/50'
                }`}
              >
                Load Default Desk Preset
              </button>
            </div>
          ) : (
            <div className={`grid gap-3 sm:gap-4 lg:gap-6 ${maximizedWidget ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-2'}`}>
              {activeWidgets.map((id, index) => {
                if (maximizedWidget && maximizedWidget !== id) return null;
                const module = availableModules.find(m => m.id === id);
                if (!module) return null;

                const isCollapsed = Boolean(collapsedWidgets[id]);
                const widthSize: WidgetWidthSize = widgetWidths[id] || 'half';

                return (
                  <Widget
                    key={id}
                    id={id}
                    title={module.label}
                    icon={module.icon}
                    isMaximized={maximizedWidget === id}
                    isCollapsed={isCollapsed}
                    widthSize={widthSize}
                    index={index}
                    totalWidgets={activeWidgets.length}
                    onToggleMaximize={toggleMaximize}
                    onToggleCollapse={toggleWidgetCollapse}
                    onToggleWidthSize={toggleWidgetWidthSize}
                    onMoveUp={moveWidgetUp}
                    onMoveDown={moveWidgetDown}
                    onMoveTo={moveWidgetTo}
                    onClose={toggleWidget}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    isDragOver={dragOverWidgetId === id}
                    theme={theme}
                  >
                    {module.component}
                  </Widget>
                );
              })}
            </div>
          )}
        </main>

        {/* Minimal Transparent Footer */}
        <footer className={`backdrop-blur-md border-t py-2.5 px-4 sm:px-6 text-center text-[10px] font-mono flex flex-col sm:flex-row items-center justify-between gap-2 transition-colors ${
          isLight ? 'bg-white/60 border-slate-300/80 text-slate-600' : 'bg-slate-950/60 border-slate-900 text-slate-500'
        }`}>
          <div>NEXUS CORTEX // Institutional MSP-55 Enclave Desk ({theme.toUpperCase()} MODE)</div>
          <div className={`flex items-center space-x-3 ${isLight ? 'text-slate-500' : 'text-slate-600'}`}>
            <span>Transparent glass front windows</span>
            <span>&bull;</span>
            <span>Drag title bars to relocate</span>
            <span>&bull;</span>
            <span>Sub-Microsecond Ingress</span>
          </div>
        </footer>

        {/* Switchable Brokerage Server Modal */}
        <BrokerageServerModal
          isOpen={isBrokerageModalOpen}
          onClose={() => setIsBrokerageModalOpen(false)}
          onServerChanged={handleBrokerageServerChanged}
          theme={theme}
          traderId={currentUser?.traderId || 'CHIEF_QUANT'}
        />
      </div>
    </div>
  );
}

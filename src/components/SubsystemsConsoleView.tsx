import React, { useState, useEffect } from 'react';
import { 
  Cpu, Brain, ShieldAlert, Activity, Lock, Users, 
  GitFork, Workflow, DollarSign, ChevronRight, RefreshCw, 
  Server, ShieldCheck, Zap, Sparkles
} from 'lucide-react';
import { systemsService } from '../services/SystemsService';
import { BackendSystemStatus, SystemsOverviewResponse } from '../types';
import { SubsystemDetailModal } from './SubsystemDetailModal';
import { RoutingDiagnosticModal } from './RoutingDiagnosticModal';
import { QuantumInfinityLogo } from './LogoVariants';
import { useTheme } from '../context/ThemeContext';

export const SubsystemsConsoleView: React.FC = () => {
  const { theme } = useTheme();
  const [overview, setOverview] = useState<SystemsOverviewResponse | null>(systemsService.getOverview());
  const [selectedSubsystem, setSelectedSubsystem] = useState<BackendSystemStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);

  useEffect(() => {
    const unsub = systemsService.subscribeSystems((newOverview) => {
      setOverview(newOverview);
    });
    return unsub;
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await systemsService.fetchOverview();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const iconMap: Record<string, React.ReactNode> = {
    'execution-engine': <Cpu className="w-5 h-5 text-cyan-400" />,
    'predictive-ai': <Brain className="w-5 h-5 text-purple-400" />,
    'risk-analytics': <ShieldAlert className="w-5 h-5 text-rose-400" />,
    'telemetry': <Activity className="w-5 h-5 text-emerald-400" />,
    'secure-enclaves': <Lock className="w-5 h-5 text-amber-400" />,
    'collaboration': <Users className="w-5 h-5 text-blue-400" />,
    'shadow-simulation': <GitFork className="w-5 h-5 text-indigo-400" />,
    'workflows': <Workflow className="w-5 h-5 text-pink-400" />,
    'cost-tracker': <DollarSign className="w-5 h-5 text-emerald-400" />
  };

  const systemsList: BackendSystemStatus[] = overview?.systems ? (Object.values(overview.systems) as BackendSystemStatus[]) : [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-3.5">
          <QuantumInfinityLogo size="sm" theme={theme} glow={true} />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-white font-mono">MSP55 Advanced Backend Systems Integration</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 border border-cyan-800 text-cyan-400">
                9/9 Systems Online
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time telemetry and control plane for ultra low-latency execution, Gemini predictive AI, Nitro enclaves, and parallel shadow environments.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={() => setIsDiagnosticOpen(true)}
            className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-300 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>MQL5 &amp; FIX 4.4 Diagnostic</span>
          </button>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-mono flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Telemetry'}</span>
          </button>
        </div>
      </div>

      {/* Systems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {systemsList.map((sys) => (
          <div
            key={sys.id}
            onClick={() => setSelectedSubsystem(sys)}
            className="group p-4 rounded-xl bg-slate-900/40 hover:bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden shadow-sm"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 group-hover:border-cyan-500/40 transition-colors">
                  {iconMap[sys.id] || <Server className="w-5 h-5 text-cyan-400" />}
                </div>
                <div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">
                    {sys.category}
                  </span>
                  <h3 className="text-xs font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                    {sys.name}
                  </h3>
                </div>
              </div>

              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                sys.status === 'OPTIMAL' || sys.status === 'SECURED' || sys.status === 'ACTIVE' || sys.status === 'ONLINE'
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                  : 'bg-amber-950/60 text-amber-400 border-amber-800/60'
              }`}>
                {sys.status}
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 my-2 p-3 rounded-lg bg-slate-950 border border-slate-800/80 font-mono">
              <div>
                <span className="text-[9px] text-slate-500 uppercase block truncate">
                  {sys.metricLabel}
                </span>
                <span className="text-base font-bold text-cyan-400">
                  {sys.primaryMetric}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase block truncate">
                  {sys.secondaryLabel}
                </span>
                <span className="text-base font-bold text-slate-200">
                  {sys.secondaryMetric}
                </span>
              </div>
            </div>

            {/* Description & Action */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/50">
              <span className="truncate pr-2 text-[11px]">{sys.description.slice(0, 50)}...</span>
              <span className="text-cyan-400 font-mono text-[11px] shrink-0 flex items-center group-hover:translate-x-0.5 transition-transform">
                <span>Inspect</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Inspector */}
      {selectedSubsystem && (
        <SubsystemDetailModal
          system={selectedSubsystem}
          onClose={() => setSelectedSubsystem(null)}
        />
      )}

      {/* System-Wide Routing Diagnostic Modal */}
      <RoutingDiagnosticModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
      />
    </div>
  );
};

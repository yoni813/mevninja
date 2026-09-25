import React, { useState } from 'react';
import { 
  X, Cpu, Brain, ShieldAlert, Activity, Lock, Users, GitFork, 
  Workflow, DollarSign, CheckCircle2, Play, Plus, Minus, RefreshCw, 
  Zap, Server, Move, Maximize2, Minimize2
} from 'lucide-react';
import { BackendSystemStatus } from '../types';
import { systemsService } from '../services/SystemsService';

interface SubsystemDetailModalProps {
  system: BackendSystemStatus | null;
  onClose: () => void;
}

export const SubsystemDetailModal: React.FC<SubsystemDetailModalProps> = ({ system, onClose }) => {
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowTrigger, setNewWorkflowTrigger] = useState('Volatility Spike > 25%');
  const [newWorkflowAction, setNewWorkflowAction] = useState('Rebalance Delta-Neutral Hedges');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Window state: collapse, resize, location
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [modalSize, setModalSize] = useState<'standard' | 'expanded' | 'compact'>('standard');
  const [positionPreset, setPositionPreset] = useState<'center' | 'bottom-right' | 'top-right'>('center');

  if (!system) return null;

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

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkflowName) return;
    setIsSubmitting(true);
    try {
      await systemsService.createWorkflow(newWorkflowName, newWorkflowTrigger, newWorkflowAction);
      setSubmitSuccess(true);
      setNewWorkflowName('');
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch {
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  // Size styling
  const getSizeClasses = () => {
    switch (modalSize) {
      case 'expanded':
        return 'w-full max-w-5xl max-h-[92vh]';
      case 'compact':
        return 'w-full max-w-lg max-h-[75vh]';
      case 'standard':
      default:
        return 'w-full max-w-2xl max-h-[88vh]';
    }
  };

  // Location position styling
  const getPositionClasses = () => {
    if (positionPreset === 'bottom-right') return 'items-end justify-end p-4 pb-6 pr-6';
    if (positionPreset === 'top-right') return 'items-start justify-end p-4 pt-16 pr-6';
    return 'items-center justify-center p-3 sm:p-4';
  };

  // Cycle position preset
  const cyclePosition = () => {
    if (positionPreset === 'center') setPositionPreset('bottom-right');
    else if (positionPreset === 'bottom-right') setPositionPreset('top-right');
    else setPositionPreset('center');
  };

  return (
    <div className={`fixed inset-0 z-50 flex ${getPositionClasses()} ${isCollapsed ? 'pointer-events-none' : 'bg-black/40 backdrop-blur-sm'}`}>
      
      {/* =========================================================================
          COLLAPSED MINI FLOATING BAR
          ========================================================================= */}
      {isCollapsed ? (
        <div className="pointer-events-auto bg-slate-950/80 backdrop-blur-xl border border-cyan-500/60 rounded-2xl shadow-2xl p-3 flex items-center space-x-3 text-xs font-mono max-w-md animate-in slide-in-from-bottom-4">
          <div className="p-1.5 bg-slate-900 rounded-lg text-cyan-400">
            {iconMap[system.id] || <Server className="w-4 h-4 text-cyan-400" />}
          </div>
          <div className="flex-1 truncate">
            <div className="font-bold text-white truncate">{system.name}</div>
            <div className="text-[10px] text-cyan-400">{system.primaryMetric}</div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 transition-colors"
              title="Expand inspector window"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
              title="Close window"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* =========================================================================
            EXPANDED INSPECTOR WINDOW
            ========================================================================= */
        <div className={`relative ${getSizeClasses()} bg-slate-950/80 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(34,211,238,0.15)] overflow-hidden flex flex-col transition-all duration-200`}>
          
          {/* Header Bar with Universal Control Icons */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-900/70 select-none gap-2">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              {/* Universal Move Handle / Cycle Position */}
              <button
                onClick={cyclePosition}
                className="p-1 text-slate-500 hover:text-cyan-400 cursor-pointer rounded hover:bg-slate-800 transition-colors"
                title={`Relocate window (Current: ${positionPreset})`}
              >
                <Move className="w-4 h-4" />
              </button>

              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex-shrink-0">
                {iconMap[system.id] || <Server className="w-5 h-5 text-cyan-400" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] sm:text-xs font-mono text-cyan-400 font-bold tracking-widest uppercase truncate">
                    MSP55 SUBSYSTEM SPECIFICATION
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex-shrink-0">
                    {system.status}
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">{system.name}</h2>
              </div>
            </div>

            {/* Universal Window Control Buttons */}
            <div className="flex items-center space-x-1 sm:space-x-1.5 flex-shrink-0">
              {/* Universal Collapse Icon */}
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                title="Collapse window"
                aria-label="Collapse window"
              >
                <Minus className="w-4 h-4" />
              </button>

              {/* Universal Size Toggle Icon */}
              <button
                onClick={() => setModalSize(prev => prev === 'expanded' ? 'standard' : prev === 'standard' ? 'compact' : 'expanded')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={`Cycle window size (Current: ${modalSize})`}
                aria-label="Cycle window size"
              >
                {modalSize === 'expanded' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Universal Close Icon */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Close window"
                aria-label="Close window"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 text-xs sm:text-sm text-slate-300 custom-scrollbar">
            
            {/* Key Metric Highlight */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                  {system.metricLabel}
                </span>
                <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-400">
                  {system.primaryMetric}
                </div>
              </div>
              <div className="p-3 sm:p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                  {system.secondaryLabel}
                </span>
                <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                  {system.secondaryMetric}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="p-3 sm:p-4 bg-slate-900/40 rounded-xl border border-slate-800/80 text-xs leading-relaxed text-slate-300">
              <span className="text-slate-400 font-mono font-semibold block mb-1 uppercase tracking-wider text-[10px]">Architectural Summary</span>
              {system.description}
            </div>

            {/* Dynamic Technical Details Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center justify-between">
                <span>Verified Hardware &amp; Software Telemetry</span>
                <span className="text-[10px] text-cyan-400 font-mono">Live API Connected</span>
              </h3>

              <div className="bg-slate-950 rounded-xl border border-slate-800 divide-y divide-slate-800/80 font-mono text-xs">
                {Object.entries(system.details || {}).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center px-3 sm:px-4 py-2 sm:py-2.5">
                    <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-white font-medium">{Array.isArray(val) ? val.join(', ') : String(val)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Feature for Workflows System */}
            {system.id === 'workflows' && (
              <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase text-pink-400 tracking-wider flex items-center space-x-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Deploy New Algorithmic Workflow</span>
                  </h4>
                  {submitSuccess && (
                    <span className="text-xs text-emerald-400 flex items-center space-x-1 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pipeline Deployed!</span>
                    </span>
                  )}
                </div>

                <form onSubmit={handleCreateWorkflow} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Pipeline Name</label>
                    <input
                      type="text"
                      value={newWorkflowName}
                      onChange={(e) => setNewWorkflowName(e.target.value)}
                      placeholder="e.g. Flash Crash Liquidity Injector"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2 text-xs font-mono focus:border-pink-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Trigger Condition</label>
                      <input
                        type="text"
                        value={newWorkflowTrigger}
                        onChange={(e) => setNewWorkflowTrigger(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2 text-xs font-mono focus:border-pink-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Enclave Action</label>
                      <input
                        type="text"
                        value={newWorkflowAction}
                        onChange={(e) => setNewWorkflowAction(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2 text-xs font-mono focus:border-pink-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2 bg-pink-600/90 hover:bg-pink-600 text-white font-mono font-bold rounded-lg text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50 min-h-[44px]"
                  >
                    {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>Compile &amp; Activate Workflow</span>
                  </button>
                </form>
              </div>
            )}

            {/* Interactive Feature for Shadow Simulation */}
            {system.id === 'shadow-simulation' && (
              <div className="p-3 sm:p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/40 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Zero-Risk Shadow Engine Status</div>
                  <div className="text-[11px] text-slate-400">Replicating 100% of live Binance and ECB quotes in isolated memory queue.</div>
                </div>
                <span className="px-2.5 py-1 bg-indigo-900/60 border border-indigo-700/60 rounded text-xs font-mono text-indigo-300">
                  ACTIVE_MIRRORING
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center space-x-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="truncate">Hardware Telemetry: Active</span>
            </div>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-mono transition-colors cursor-pointer min-h-[36px]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Tv, Sparkles, Activity, ShieldCheck, AlertTriangle, 
  CheckCircle2, RefreshCw, Cpu, Server, Terminal, Eye,
  Maximize2, Play, Pause, Zap, ArrowUpRight
} from 'lucide-react';
import { telemetryService } from '../services/TelemetryService';
import { connectionManager } from '../services/ConnectionManager';
import { AiTroubleshootingReport, BrokerageServer } from '../types';

interface ScreenMonitoringViewProps {
  theme?: 'dark' | 'light';
  activeWidgets?: string[];
  currentLatency?: number;
  openPositionsCount?: number;
}

export const ScreenMonitoringView: React.FC<ScreenMonitoringViewProps> = ({
  theme = 'dark',
  activeWidgets = ['dashboard', 'latency', 'subsystems', 'intelligence'],
  currentLatency = 6.2,
  openPositionsCount = 3
}) => {
  const isLight = theme === 'light';
  const [isCapturing, setIsCapturing] = useState(true);
  const [fps, setFps] = useState(2);
  const [capturedFrames, setCapturedFrames] = useState(58);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<AiTroubleshootingReport | null>(null);
  const [activeServer, setActiveServer] = useState<BrokerageServer>(telemetryService.getActiveBrokerageServer());
  const [livePing, setLivePing] = useState(currentLatency);

  useEffect(() => {
    // Initial fetch of status
    telemetryService.fetchMonitoringStatus().then(status => {
      if (status?.latestAiDiagnosis) {
        setDiagnosis(status.latestAiDiagnosis);
      }
      if (status?.capturedFramesCount) {
        setCapturedFrames(status.capturedFramesCount);
      }
    });

    const unsub = connectionManager.subscribeLatency(sample => {
      setLivePing(sample.latencyMs);
    });

    // Frame capture tick
    const interval = setInterval(() => {
      if (isCapturing) {
        setCapturedFrames(prev => prev + 1);
        telemetryService.sendScreenFrameTelemetry({
          activeWidgets,
          latencyMs: livePing,
          spread: 0.2,
          errorsCount: 0,
          openPositionsCount
        });
      }
    }, 1000 / fps);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [isCapturing, fps, activeWidgets, livePing, openPositionsCount]);

  const handleRunAiDiagnostics = async () => {
    setIsAnalyzing(true);
    try {
      const result = await telemetryService.requestAiTroubleshootingAnalysis({
        currentLatency: livePing,
        activeServer: `${activeServer.name} (${activeServer.baselinePingMs}ms baseline)`,
        activeWidgets,
        openPositions: [{ symbol: 'EUR/USD', side: 'BUY', lots: 2.5, pnl: '+4.2 pips' }],
        marketSpread: 0.2,
        recentErrors: []
      });
      if (result) {
        setDiagnosis(result);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={`p-4 sm:p-6 rounded-2xl border space-y-6 transition-all ${
      isLight ? 'bg-white/70 border-slate-300 text-slate-900' : 'bg-slate-950/70 border-slate-800 text-slate-100'
    }`}>
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-700/50">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold font-mono tracking-tight flex items-center space-x-2">
                <span>REAL-TIME SCREEN MONITORING &amp; AI OVERSIGHT</span>
              </h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                isCapturing 
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800' 
                  : 'bg-amber-950/60 text-amber-400 border-amber-800'
              }`}>
                {isCapturing ? 'STREAMING ACTIVE' : 'PAUSED'}
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Continuous algorithmic telemetry capture, window anomaly detection, and automated Gemini trade oversight.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsCapturing(!isCapturing)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              isCapturing 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            {isCapturing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isCapturing ? 'Pause Stream' : 'Resume Stream'}</span>
          </button>

          <button
            onClick={handleRunAiDiagnostics}
            disabled={isAnalyzing}
            className={`px-4 py-1.5 rounded-xl font-mono font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-md disabled:opacity-50 ${
              isLight 
                ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20' 
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing Workspace...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Run AI Troubleshooting</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid: Screen Preview on Left, AI Troubleshooting Report on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live Screen Monitor Emulator (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className={`p-4 rounded-xl border relative overflow-hidden ${
            isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono mb-3 text-slate-400">
              <span className="flex items-center space-x-1.5 text-cyan-400">
                <Eye className="w-3.5 h-3.5" />
                <span>VIRTUAL SCREEN BUFFER // 1920x1080</span>
              </span>
              <span>FRAME #{capturedFrames}</span>
            </div>

            {/* Simulated Desktop Wireframe */}
            <div className="aspect-video w-full rounded-lg bg-slate-950 border border-slate-800 p-2.5 flex flex-col justify-between relative overflow-hidden shadow-inner">
              {/* Scanline raster effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none animate-pulse" />

              {/* Wireframe header bar */}
              <div className="h-3 bg-slate-800/80 rounded flex items-center justify-between px-2">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                <div className="text-[8px] font-mono text-cyan-400 truncate">
                  NEXUS CORTEX HFT // {activeServer.name}
                </div>
              </div>

              {/* Wireframe tiles */}
              <div className="grid grid-cols-2 gap-2 my-2 flex-1">
                <div className="bg-slate-900/90 border border-cyan-500/30 rounded p-1.5 flex flex-col justify-between">
                  <span className="text-[8px] font-mono text-slate-400">TRADING DESK (ORDER BOOK)</span>
                  <div className="h-6 flex items-end space-x-1">
                    <div className="w-1/4 bg-emerald-500/40 h-4 rounded-xs" />
                    <div className="w-1/4 bg-emerald-500/70 h-6 rounded-xs" />
                    <div className="w-1/4 bg-rose-500/70 h-5 rounded-xs" />
                    <div className="w-1/4 bg-rose-500/40 h-3 rounded-xs" />
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-purple-500/30 rounded p-1.5 flex flex-col justify-between">
                  <span className="text-[8px] font-mono text-purple-300">6.2ms LATENCY GRAPH</span>
                  <div className="h-6 flex items-center justify-center">
                    <span className="text-[9px] font-mono font-bold text-cyan-400">
                      {livePing.toFixed(2)} ms
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-700/50 rounded p-1.5">
                  <span className="text-[8px] font-mono text-slate-400">MSP55 (9/9)</span>
                  <div className="text-[8px] text-emerald-400 mt-1 font-mono">ALL ONLINE</div>
                </div>

                <div className="bg-slate-900/90 border border-slate-700/50 rounded p-1.5">
                  <span className="text-[8px] font-mono text-slate-400">AI INTELLIGENCE</span>
                  <div className="text-[8px] text-cyan-400 mt-1 font-mono">GEMINI MONITORING</div>
                </div>
              </div>

              {/* Bottom footer bar */}
              <div className="h-2 bg-slate-800/60 rounded flex items-center px-1">
                <div className="w-8 h-1 bg-cyan-400 rounded-full" />
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-700/40 text-center font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Capture Rate</span>
                <span className="font-bold text-cyan-400">{fps} FPS</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Observed Ping</span>
                <span className="font-bold text-emerald-400">{livePing.toFixed(1)} ms</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Active Panels</span>
                <span className="font-bold text-purple-400">{activeWidgets.length} Modules</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Troubleshooting & Oversight Diagnostics (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className={`p-4 sm:p-5 rounded-xl border relative ${
            isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-900/60 border-slate-800'
          }`}>
            
            {/* Diagnosis Status Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/40 mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider">
                  AI-Assisted Troubleshooting &amp; Oversight Report
                </span>
              </div>

              {diagnosis && (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border flex items-center space-x-1 ${
                  diagnosis.status === 'HEALTHY'
                    ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                    : diagnosis.status === 'NEEDS_ATTENTION'
                      ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                      : 'bg-rose-950/60 border-rose-700 text-rose-300'
                }`}>
                  {diagnosis.status === 'HEALTHY' && <CheckCircle2 className="w-3 h-3" />}
                  {diagnosis.status === 'NEEDS_ATTENTION' && <AlertTriangle className="w-3 h-3" />}
                  <span>{diagnosis.status}</span>
                </span>
              )}
            </div>

            {/* Assessment Summary */}
            {diagnosis ? (
              <div className="space-y-4">
                <div className={`p-3.5 rounded-xl border font-sans text-xs sm:text-sm leading-relaxed ${
                  isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-950/60 border-slate-800/80 text-slate-200'
                }`}>
                  <span className="font-mono text-[10px] uppercase font-bold text-cyan-400 block mb-1">
                    Operational Diagnosis:
                  </span>
                  {diagnosis.summary}
                </div>

                {/* Detected Anomalies */}
                <div>
                  <h4 className="font-mono text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2">
                    Detected Anomalies ({diagnosis.detectedAnomalies.length}):
                  </h4>
                  {diagnosis.detectedAnomalies.length === 0 ? (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>Zero execution, network jitter, or algorithmic anomalies identified.</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {diagnosis.detectedAnomalies.map((anom, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                          <span>{anom}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recommended Algorithmic & Trade Fixes */}
                <div>
                  <h4 className="font-mono text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2">
                    Recommended Algorithmic Actions:
                  </h4>
                  <div className="space-y-1.5">
                    {diagnosis.recommendedFixes.map((fix, idx) => (
                      <div 
                        key={idx} 
                        className={`p-2.5 rounded-lg border text-xs font-mono flex items-start space-x-2 ${
                          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-950/50 border-slate-800 text-slate-300'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{fix}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monitored Metrics Ribbon */}
                <div className={`p-3 rounded-xl border grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] ${
                  isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-950/80 border-slate-800 text-slate-300'
                }`}>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Observed Latency</span>
                    <span className="font-bold text-cyan-400">{diagnosis.monitoredMetrics.latency} ms</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Spread</span>
                    <span className="font-bold text-emerald-400">{diagnosis.monitoredMetrics.spread} pips</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Monitored Panels</span>
                    <span className="font-bold text-purple-400">{diagnosis.monitoredMetrics.activeWidgets}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Risk Guard</span>
                    <span className="font-bold text-emerald-400">{diagnosis.monitoredMetrics.riskStatus}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 font-mono space-y-2">
                <RefreshCw className="w-5 h-5 mx-auto animate-spin text-cyan-400" />
                <p>Retrieving initial AI screen telemetry diagnosis...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

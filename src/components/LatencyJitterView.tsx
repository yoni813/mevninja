import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ReferenceLine, ComposedChart, Line, BarChart, Bar, Cell
} from 'recharts';
import { 
  Activity, Zap, ShieldCheck, AlertTriangle, RefreshCw, 
  Sliders, Play, Pause, ArrowDown, ArrowUp, Cpu, Server, Wifi
} from 'lucide-react';
import { connectionManager, LatencySample } from '../services/ConnectionManager';
import { SingularityFiberCoreLogo } from './LogoVariants';
import { LatencyDistributionHeatmap } from './LatencyDistributionHeatmap';

interface LatencyJitterViewProps {
  theme?: 'dark' | 'light';
}

export const LatencyJitterView: React.FC<LatencyJitterViewProps> = ({ theme = 'dark' }) => {
  const isLight = theme === 'light';
  const [history, setHistory] = useState<LatencySample[]>(() => connectionManager.getLatencyHistory());
  const [currentSample, setCurrentSample] = useState<LatencySample | null>(() => {
    const list = connectionManager.getLatencyHistory();
    return list.length > 0 ? list[list.length - 1] : null;
  });
  const [isPaused, setIsPaused] = useState(false);
  const [windowSize, setWindowSize] = useState<30 | 60 | 120>(60);
  const [viewMode, setViewMode] = useState<'OVERVIEW' | 'LATENCY_ONLY' | 'JITTER_DELTA'>('OVERVIEW');
  const [baseline, setBaseline] = useState<number>(() => connectionManager.getBaseline());
  const [criticalThreshold, setCriticalThreshold] = useState<number>(15.0);
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  useEffect(() => {
    const unsubscribe = connectionManager.subscribeLatency((sample, fullHistory) => {
      if (!isPausedRef.current) {
        setCurrentSample(sample);
        setHistory(fullHistory);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Filtered window data
  const chartData = useMemo(() => {
    return history.slice(-windowSize).map(item => ({
      ...item,
      upperBound: Number((baseline + Math.max(0.5, item.jitterMs)).toFixed(2)),
      lowerBound: Number(Math.max(0, baseline - Math.max(0.5, item.jitterMs)).toFixed(2)),
      baseline: baseline
    }));
  }, [history, windowSize, baseline]);

  // Descriptive statistical computations
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        current: baseline,
        jitter: 0.3,
        avg: baseline,
        min: baseline,
        max: baseline,
        stdDev: 0.2,
        spikeCount: 0,
        optimalPct: 100
      };
    }
    const latencies = chartData.map(d => d.latencyMs);
    const jitters = chartData.map(d => d.jitterMs);
    const current = latencies[latencies.length - 1] || baseline;
    const currentJitter = jitters[jitters.length - 1] || 0.3;
    const min = Math.min(...latencies);
    const max = Math.max(...latencies);
    const sum = latencies.reduce((a, b) => a + b, 0);
    const avg = Number((sum / latencies.length).toFixed(2));
    
    // Variance and std dev
    const variance = latencies.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / latencies.length;
    const stdDev = Number(Math.sqrt(variance).toFixed(2));
    
    const spikes = chartData.filter(d => d.status === 'SPIKE' || d.latencyMs > 20).length;
    const optimalCount = chartData.filter(d => d.jitterMs <= 0.6).length;
    const optimalPct = Math.round((optimalCount / chartData.length) * 100);

    return {
      current,
      jitter: currentJitter,
      avg,
      min,
      max,
      stdDev,
      spikeCount: spikes,
      optimalPct
    };
  }, [chartData, baseline]);

  // Critical threshold crossing detection & dynamic gradient offset calculation
  const hasCrossedCritical = useMemo(() => {
    return chartData.some(d => d.latencyMs >= criticalThreshold);
  }, [chartData, criticalThreshold]);

  const isCurrentlyCritical = (currentSample?.latencyMs || baseline) >= criticalThreshold;

  const gradientOffset = useMemo(() => {
    if (chartData.length === 0) return 0;
    const latencies = chartData.map(d => d.latencyMs);
    const dataMax = Math.max(...latencies, criticalThreshold, 14);
    const dataMin = Math.min(...latencies, 3);
    if (dataMax <= dataMin) return 0;
    return Math.max(0, Math.min(1, (dataMax - criticalThreshold) / (dataMax - dataMin)));
  }, [chartData, criticalThreshold]);

  // Jitter Distribution Bins
  const jitterDistribution = useMemo(() => {
    const bins = [
      { bin: '≤0.2ms', count: 0, label: 'Ultra-low' },
      { bin: '0.2-0.5ms', count: 0, label: 'Target' },
      { bin: '0.5-1.0ms', count: 0, label: 'Mild' },
      { bin: '1.0-2.0ms', count: 0, label: 'Elevated' },
      { bin: '>2.0ms', count: 0, label: 'Spike' },
    ];
    chartData.forEach(d => {
      const j = d.jitterMs;
      if (j <= 0.2) bins[0].count++;
      else if (j <= 0.5) bins[1].count++;
      else if (j <= 1.0) bins[2].count++;
      else if (j <= 2.0) bins[3].count++;
      else bins[4].count++;
    });
    return bins;
  }, [chartData]);

  const handleTriggerSpike = () => {
    connectionManager.forcePingSpike();
  };

  const handleResetBaseline = () => {
    connectionManager.setBaseline(6.2);
    setBaseline(6.2);
  };

  const handleClearBuffer = () => {
    connectionManager.clearLatencyHistory();
  };

  // Status badge styling
  const getQualityBadge = () => {
    if (!currentSample) return null;
    if (currentSample.latencyMs > 30) {
      return (
        <span id="latency-status-spike" className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
          CRITICAL SPIKE ({currentSample.latencyMs}ms)
        </span>
      );
    }
    if (currentSample.latencyMs > 12) {
      return (
        <span id="latency-status-elevated" className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <Activity className="w-3.5 h-3.5 mr-1" />
          ELEVATED ({currentSample.latencyMs}ms)
        </span>
      );
    }
    return (
      <span id="latency-status-optimal" className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
        <ShieldCheck className="w-3.5 h-3.5 mr-1" />
        OPTIMAL JITTER (±{stats.jitter}ms)
      </span>
    );
  };

  return (
    <div id="latency-jitter-module" className="flex flex-col space-y-4 w-full select-none">
      
      {/* Module Title Header with Singularity Fiber Core Emblem */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isLight ? 'bg-white/80 border-slate-200' : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className="flex items-center space-x-3">
          <SingularityFiberCoreLogo size="sm" glow={true} theme={theme} />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold tracking-tight text-white flex items-center space-x-1.5">
                <span className={isLight ? 'text-slate-900' : 'text-white'}>Optical Interconnect Jitter Diagnostics</span>
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border font-semibold bg-cyan-950/60 text-cyan-400 border-cyan-800/60">
                Fiber Singularity Core
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Laser cross-connect time-of-flight monitoring across Equinix LD4 (London), NY4 (Secaucus), and ZA-JNB (Johannesburg).
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getQualityBadge()}
        </div>
      </div>

      {/* -------------------------------------------------------------
          TOP KPI TELEMETRY STRIP
          ------------------------------------------------------------- */}
      <div id="latency-kpi-strip" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        
        {/* Real-time Measured Latency */}
        <div id="kpi-current-latency" className={`p-3 rounded-xl border flex flex-col justify-between transition-colors ${
          isLight ? 'bg-white/70 border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800/80 shadow-md'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400">
            <span>Current Ping</span>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                stats.current > 20 ? 'bg-rose-400' : 'bg-emerald-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                stats.current > 20 ? 'bg-rose-500' : 'bg-emerald-500'
              }`} />
            </span>
          </div>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className={`text-2xl font-bold font-mono tracking-tight ${
              stats.current > 20 
                ? 'text-rose-400' 
                : stats.current > 10 
                ? 'text-amber-400' 
                : isLight 
                ? 'text-sky-700' 
                : 'text-cyan-400'
            }`}>
              {stats.current}
            </span>
            <span className="text-xs text-slate-500 font-mono">ms</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center">
            {stats.current >= baseline ? (
              <span className="text-amber-400 flex items-center">
                <ArrowUp className="w-3 h-3 mr-0.5" />
                +{(stats.current - baseline).toFixed(1)}ms
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center">
                <ArrowDown className="w-3 h-3 mr-0.5" />
                {(stats.current - baseline).toFixed(1)}ms
              </span>
            )}
            <span className="ml-1 text-slate-500">vs 6.2ms base</span>
          </div>
        </div>

        {/* Baseline Reference */}
        <div id="kpi-baseline-target" className={`p-3 rounded-xl border flex flex-col justify-between transition-colors ${
          isLight ? 'bg-white/70 border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800/80 shadow-md'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400">
            <span>Target Baseline</span>
            <Server className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className={`text-2xl font-bold font-mono tracking-tight ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              {baseline.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 font-mono">ms</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
            Equinix ZA-JNB VPS
          </div>
        </div>

        {/* Instant Jitter */}
        <div id="kpi-instant-jitter" className={`p-3 rounded-xl border flex flex-col justify-between transition-colors ${
          isLight ? 'bg-white/70 border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800/80 shadow-md'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400">
            <span>Instant Jitter</span>
            <Activity className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl font-bold font-mono tracking-tight text-purple-400">
              ±{stats.jitter.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500 font-mono">ms</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            σ Std Dev: {stats.stdDev}ms
          </div>
        </div>

        {/* Window Average */}
        <div id="kpi-window-average" className={`p-3 rounded-xl border flex flex-col justify-between transition-colors ${
          isLight ? 'bg-white/70 border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800/80 shadow-md'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400">
            <span>Window Mean</span>
            <Wifi className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className={`text-2xl font-bold font-mono tracking-tight ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              {stats.avg}
            </span>
            <span className="text-xs text-slate-500 font-mono">ms</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Range: {stats.min} – {stats.max}ms
          </div>
        </div>

        {/* Optimal Window % */}
        <div id="kpi-optimal-pct" className={`p-3 rounded-xl border flex flex-col justify-between transition-colors ${
          isLight ? 'bg-white/70 border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800/80 shadow-md'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400">
            <span>Stability Score</span>
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl font-bold font-mono tracking-tight text-emerald-400">
              {stats.optimalPct}%
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Within ±0.6ms target
          </div>
        </div>

        {/* Spikes / Outliers */}
        <div id="kpi-spikes-count" className={`p-3 rounded-xl border flex flex-col justify-between transition-colors ${
          isLight ? 'bg-white/70 border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800/80 shadow-md'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400">
            <span>Spike Events</span>
            <Zap className={`w-3.5 h-3.5 ${stats.spikeCount > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
          </div>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className={`text-2xl font-bold font-mono tracking-tight ${
              stats.spikeCount > 0 ? 'text-amber-400' : 'text-slate-400'
            }`}>
              {stats.spikeCount}
            </span>
            <span className="text-xs text-slate-500 font-mono">aborts: 0</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            50ms abort cutoff
          </div>
        </div>

      </div>

      {/* -------------------------------------------------------------
          INTERACTIVE CONTROLS TOOLBAR
          ------------------------------------------------------------- */}
      <div id="latency-controls-bar" className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs font-mono transition-colors ${
        isLight ? 'bg-white/60 border-slate-200' : 'bg-slate-900/40 border-slate-800/70'
      }`}>
        {/* Left: View Mode Selectors */}
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-400 text-[11px] uppercase mr-1">View:</span>
          <button
            id="btn-view-overview"
            onClick={() => setViewMode('OVERVIEW')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              viewMode === 'OVERVIEW'
                ? isLight 
                  ? 'bg-sky-600 text-white font-semibold shadow-sm' 
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                : isLight 
                  ? 'hover:bg-slate-100 text-slate-600' 
                  : 'hover:bg-slate-800/60 text-slate-400'
            }`}
          >
            Baseline & Jitter Area
          </button>
          <button
            id="btn-view-latency-only"
            onClick={() => setViewMode('LATENCY_ONLY')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              viewMode === 'LATENCY_ONLY'
                ? isLight 
                  ? 'bg-sky-600 text-white font-semibold shadow-sm' 
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                : isLight 
                  ? 'hover:bg-slate-100 text-slate-600' 
                  : 'hover:bg-slate-800/60 text-slate-400'
            }`}
          >
            Latency Focus
          </button>
          <button
            id="btn-view-delta"
            onClick={() => setViewMode('JITTER_DELTA')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              viewMode === 'JITTER_DELTA'
                ? isLight 
                  ? 'bg-sky-600 text-white font-semibold shadow-sm' 
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                : isLight 
                  ? 'hover:bg-slate-100 text-slate-600' 
                  : 'hover:bg-slate-800/60 text-slate-400'
            }`}
          >
            Delta vs Baseline (±Δ)
          </button>
        </div>

        {/* Right: Actions & Window Size */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Visual Critical Latency Threshold Configuration */}
          <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors ${
            isCurrentlyCritical 
              ? 'bg-rose-500/15 border-rose-500/50 text-rose-300 ring-1 ring-rose-500/40' 
              : isLight 
                ? 'bg-slate-50 border-slate-300 text-slate-700' 
                : 'bg-slate-900/80 border-slate-700 text-slate-300'
          }`}>
            <span className="text-[10px] uppercase font-bold text-rose-400 flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Critical Latency:</span>
            </span>
            <div className="flex items-center space-x-1">
              <input
                id="input-critical-latency-threshold"
                type="number"
                min="1"
                max="100"
                step="0.5"
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(Math.max(1, Number(e.target.value) || 15))}
                className={`w-14 px-1.5 py-0.5 rounded text-xs font-mono font-bold text-center border focus:outline-none ${
                  isLight 
                    ? 'bg-white border-slate-300 text-rose-600 focus:border-rose-500' 
                    : 'bg-slate-950 border-slate-700 text-rose-400 focus:border-rose-500'
                }`}
              />
              <span className="text-[10px] text-slate-400">ms</span>
            </div>

            {/* Quick Presets */}
            <div className="hidden sm:flex items-center space-x-0.5 pl-1 border-l border-slate-700/50">
              {[8, 12, 15, 25].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCriticalThreshold(preset)}
                  className={`px-1.5 py-0.5 text-[9px] rounded transition-colors ${
                    criticalThreshold === preset
                      ? 'bg-rose-500 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {preset}m
                </button>
              ))}
            </div>
          </div>

          {/* Window size buttons */}
          <div className="flex items-center space-x-1 border border-slate-700/50 rounded-lg p-0.5">
            {[30, 60, 120].map((sz) => (
              <button
                key={sz}
                id={`btn-window-${sz}`}
                onClick={() => setWindowSize(sz as any)}
                className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                  windowSize === sz
                    ? isLight ? 'bg-sky-100 text-sky-800 font-bold' : 'bg-slate-800 text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sz}s
              </button>
            ))}
          </div>

          {/* Pause / Resume */}
          <button
            id="btn-toggle-pause"
            onClick={() => setIsPaused(!isPaused)}
            className={`px-2.5 py-1 rounded-lg border flex items-center space-x-1 transition-colors ${
              isPaused 
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                : isLight ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200' : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
            title={isPaused ? 'Resume live latency stream' : 'Freeze chart stream'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          {/* Force Spike Simulation Button */}
          <button
            id="btn-simulate-ping-spike"
            onClick={handleTriggerSpike}
            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 flex items-center space-x-1 transition-colors font-medium cursor-pointer"
            title="Simulate network jitter / ping spike to test critical threshold, 50ms timeout and adaptive deviation"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="text-[11px]">Test Spike</span>
          </button>

          {/* Recalibrate Baseline */}
          <button
            id="btn-recalibrate-baseline"
            onClick={handleResetBaseline}
            className={`px-2.5 py-1 rounded-lg border flex items-center space-x-1 transition-colors ${
              isLight ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200' : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
            title="Reset baseline anchor to 6.2 ms (South Africa VPS)"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="text-[11px]">Reset 6.2ms</span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          MAIN RECHARTS REAL-TIME GRAPH
          ------------------------------------------------------------- */}
      <div id="latency-recharts-card" className={`p-4 rounded-xl border relative flex flex-col transition-colors ${
        isLight ? 'bg-white/80 border-slate-200 shadow-md' : 'bg-slate-900/50 border-slate-800 shadow-xl'
      }`}>
        
        {/* Chart Header Info */}
        <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm font-semibold tracking-tight text-slate-200 flex items-center">
              <span className={`w-2 h-2 rounded-full inline-block mr-2 ${isCurrentlyCritical ? 'bg-rose-500 animate-ping' : 'bg-cyan-400'}`} />
              MetaTrader / Exness VPS Latency & Jitter Stream
            </span>
            {getQualityBadge()}

            {/* Critical Latency Alert Pill */}
            {isCurrentlyCritical && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 flex items-center space-x-1 animate-pulse">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>CRITICAL LATENCY EXCEEDED (&gt;{criticalThreshold}ms)</span>
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-3 text-xs font-mono text-slate-400">
            <div className="flex items-center space-x-1.5">
              <span className={`w-3 h-0.5 inline-block ${isCurrentlyCritical || hasCrossedCritical ? 'bg-rose-500' : 'bg-cyan-400'}`} />
              <span className={isCurrentlyCritical ? 'text-rose-400 font-bold' : ''}>
                {isCurrentlyCritical ? 'Critical Latency (Red)' : 'Observed Latency (ms)'}
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 bg-rose-500 border-b border-dashed border-rose-500 inline-block" />
              <span>{criticalThreshold}ms Threshold</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 bg-emerald-400 border-b border-dashed border-emerald-400 inline-block" />
              <span>{baseline.toFixed(1)}ms Baseline</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 bg-purple-500/30 rounded inline-block" />
              <span>Jitter Envelope (±σ)</span>
            </div>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'JITTER_DELTA' ? (
              /* Delta Mode: showing deviation from 6.2ms baseline */
              <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="deltaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isLight ? '#e2e8f0' : '#1e293b'} 
                  vertical={false} 
                />
                <XAxis 
                  dataKey="timeStr" 
                  stroke={isLight ? '#64748b' : '#64748b'} 
                  fontSize={10} 
                  fontFamily="monospace"
                  tickLine={false}
                />
                <YAxis 
                  stroke={isLight ? '#64748b' : '#64748b'} 
                  fontSize={10} 
                  fontFamily="monospace"
                  tickFormatter={(val) => `${val > 0 ? '+' : ''}${val}ms`}
                  domain={[-2, 'auto']}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip isLight={isLight} baseline={baseline} />} />
                <ReferenceLine y={0} stroke="#10b981" strokeWidth={1.5} label={{ value: 'Zero Delta (6.2ms)', fill: '#10b981', fontSize: 10 }} />
                <Area 
                  type="monotone" 
                  dataKey="deltaMs" 
                  name="Delta vs Baseline"
                  stroke="#a855f7" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#deltaGradient)" 
                  isAnimationActive={false}
                />
              </AreaChart>
            ) : (
              /* Overview and Latency Focus Modes */
              <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.65}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05}/>
                  </linearGradient>
                  {/* Dynamic Critical Latency Stroke Gradient: shifts to red above critical threshold */}
                  <linearGradient id="criticalLatencyStroke" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset={`${Math.max(5, Math.min(95, gradientOffset * 100))}%`} stopColor="#ef4444" />
                    <stop offset={`${Math.max(5, Math.min(95, gradientOffset * 100))}%`} stopColor={isLight ? '#0284c7' : '#06b6d4'} />
                    <stop offset="100%" stopColor={isLight ? '#0284c7' : '#06b6d4'} />
                  </linearGradient>
                  {/* Dynamic Critical Latency Area Fill */}
                  <linearGradient id="criticalLatencyArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.7} />
                    <stop offset={`${Math.max(5, Math.min(95, gradientOffset * 100))}%`} stopColor="#ef4444" stopOpacity={0.35} />
                    <stop offset={`${Math.max(5, Math.min(95, gradientOffset * 100))}%`} stopColor={isLight ? '#0284c7' : '#06b6d4'} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={isLight ? '#0284c7' : '#06b6d4'} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="jitterBandGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.03}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isLight ? '#e2e8f0' : '#1e293b'} 
                  vertical={false} 
                />
                <XAxis 
                  dataKey="timeStr" 
                  stroke={isLight ? '#64748b' : '#64748b'} 
                  fontSize={10} 
                  fontFamily="monospace"
                  tickLine={false}
                />
                <YAxis 
                  stroke={isLight ? '#64748b' : '#64748b'} 
                  fontSize={10} 
                  fontFamily="monospace"
                  domain={[3, (dataMax: number) => Math.max(12, Math.max(criticalThreshold + 2, Math.min(100, Math.ceil(dataMax + 2))))]}
                  tickFormatter={(val) => `${val}ms`}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip isLight={isLight} baseline={baseline} />} />
                
                {/* 6.2ms South African VPS Baseline Anchor */}
                <ReferenceLine 
                  y={baseline} 
                  stroke="#10b981" 
                  strokeDasharray="4 4" 
                  strokeWidth={2}
                  label={{ 
                    value: `Baseline (${baseline.toFixed(1)} ms)`, 
                    fill: '#10b981', 
                    fontSize: 10, 
                    position: 'insideBottomRight' 
                  }} 
                />

                {/* User-Configurable Critical Latency Threshold Line */}
                <ReferenceLine 
                  y={criticalThreshold} 
                  stroke="#ef4444" 
                  strokeDasharray="3 3" 
                  strokeWidth={2}
                  label={{ 
                    value: `Critical Threshold (${criticalThreshold.toFixed(1)} ms)`, 
                    fill: '#ef4444', 
                    fontSize: 10, 
                    position: 'insideTopLeft' 
                  }} 
                />

                {/* 50ms Hard Execution Timeout threshold */}
                <ReferenceLine 
                  y={50} 
                  stroke="#dc2626" 
                  strokeDasharray="2 2" 
                  strokeWidth={1}
                  label={{ 
                    value: '50ms Order Timeout Threshold', 
                    fill: '#dc2626', 
                    fontSize: 10, 
                    position: 'top' 
                  }} 
                />

                {viewMode === 'OVERVIEW' && (
                  <>
                    {/* Jitter Upper Envelope Band */}
                    <Area 
                      type="monotone" 
                      dataKey="upperBound" 
                      stroke="#8b5cf6" 
                      strokeDasharray="2 2"
                      strokeWidth={1}
                      fillOpacity={1} 
                      fill="url(#jitterBandGradient)" 
                      isAnimationActive={false}
                    />
                    {/* Jitter Lower Envelope Band */}
                    <Area 
                      type="monotone" 
                      dataKey="lowerBound" 
                      stroke="#8b5cf6" 
                      strokeDasharray="2 2"
                      strokeWidth={1}
                      fillOpacity={0} 
                      isAnimationActive={false}
                    />
                  </>
                )}

                {/* Primary Real-time Latency Line and Area with Dynamic Red Color when threshold is crossed */}
                <Area 
                  type="monotone" 
                  dataKey="latencyMs" 
                  name="Observed Ping"
                  stroke={isCurrentlyCritical ? "#ef4444" : hasCrossedCritical ? "url(#criticalLatencyStroke)" : isLight ? "#0284c7" : "#06b6d4"} 
                  strokeWidth={isCurrentlyCritical ? 3 : 2.5}
                  fillOpacity={1} 
                  fill={isCurrentlyCritical ? "rgba(239,68,68,0.3)" : hasCrossedCritical ? "url(#criticalLatencyArea)" : "url(#latencyGradient)"} 
                  isAnimationActive={false}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Explanatory Footer Callout */}
        <div className={`mt-3 pt-3 border-t flex flex-wrap items-center justify-between text-[11px] font-mono gap-2 ${
          isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800/80 text-slate-400'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-emerald-400 font-semibold">● FLASHSCALPER Engine:</span>
            <span>Sub-50ms execution rule active with 0.5–1.0 pip slippage adaptation.</span>
          </div>
          <div className="text-slate-400">
            Buffer: {chartData.length} samples | Sampling: Real-time on WebSocket tick feed
          </div>
        </div>

      </div>

      {/* -------------------------------------------------------------
          24-HOUR LATENCY DISTRIBUTION & BOTTLENECK HEATMAP (D3.js)
          ------------------------------------------------------------- */}
      <LatencyDistributionHeatmap 
        className="mb-4"
        theme={theme}
        currentRealtimeLatency={currentSample?.latencyMs ?? baseline}
      />

      {/* -------------------------------------------------------------
          SECONDARY: JITTER DISTRIBUTION & HISTOGRAM
          ------------------------------------------------------------- */}
      <div id="latency-histogram-card" className={`p-3.5 rounded-xl border flex flex-col transition-colors ${
        isLight ? 'bg-white/70 border-slate-200 shadow-sm' : 'bg-slate-900/40 border-slate-800/70 shadow-md'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs font-semibold text-slate-300 flex items-center">
            <Activity className="w-3.5 h-3.5 text-purple-400 mr-1.5" />
            Jitter Variance Distribution Histogram (Samples in active window)
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            Total Samples: {chartData.length}
          </span>
        </div>

        <div className="w-full h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={jitterDistribution} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#1e293b'} vertical={false} />
              <XAxis dataKey="bin" stroke="#64748b" fontSize={10} fontFamily="monospace" tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} fontFamily="monospace" tickLine={false} allowDecimals={false} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                {jitterDistribution.map((entry, index) => {
                  let color = '#10b981'; // green for ultra low & target
                  if (entry.bin === '0.5-1.0ms') color = '#06b6d4'; // cyan for mild
                  else if (entry.bin === '1.0-2.0ms') color = '#f59e0b'; // amber for elevated
                  else if (entry.bin === '>2.0ms') color = '#ef4444'; // red for spike
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

// -------------------------------------------------------------
// HIGH-PRECISION CUSTOM TOOLTIP
// -------------------------------------------------------------
interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  isLight: boolean;
  baseline: number;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label, isLight, baseline }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload as LatencySample;
  if (!data) return null;

  const delta = (data.latencyMs - baseline).toFixed(2);
  const deltaNum = Number(delta);

  return (
    <div className={`p-2.5 rounded-lg shadow-xl border font-mono text-xs backdrop-blur-md z-50 ${
      isLight ? 'bg-white/95 border-slate-300 text-slate-800' : 'bg-slate-950/95 border-slate-700 text-slate-200'
    }`}>
      <div className="flex items-center justify-between border-b border-slate-700/40 pb-1 mb-1.5 text-[11px] text-slate-400">
        <span>Time: {data.timeStr}</span>
        <span className={`font-semibold px-1.5 py-0.2 rounded text-[10px] ${
          data.status === 'SPIKE' ? 'bg-rose-500/20 text-rose-400' :
          data.status === 'ELEVATED' ? 'bg-amber-500/20 text-amber-400' :
          'bg-emerald-500/20 text-emerald-400'
        }`}>
          {data.status}
        </span>
      </div>

      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between items-center space-x-3">
          <span className="text-slate-400">Measured Latency:</span>
          <span className="font-bold text-cyan-400">{data.latencyMs} ms</span>
        </div>
        <div className="flex justify-between items-center space-x-3">
          <span className="text-slate-400">Target Baseline:</span>
          <span className="text-emerald-400">{baseline.toFixed(1)} ms</span>
        </div>
        <div className="flex justify-between items-center space-x-3">
          <span className="text-slate-400">Baseline Delta:</span>
          <span className={deltaNum > 0 ? 'text-amber-400' : 'text-emerald-400'}>
            {deltaNum > 0 ? `+${delta}` : delta} ms
          </span>
        </div>
        <div className="flex justify-between items-center space-x-3">
          <span className="text-slate-400">Instant Jitter:</span>
          <span className="text-purple-400">±{data.jitterMs} ms</span>
        </div>
      </div>
    </div>
  );
};

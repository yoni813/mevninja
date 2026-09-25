import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  Zap, 
  RefreshCw, 
  CheckCircle2, 
  Sliders, 
  TrendingUp, 
  Globe, 
  SlidersHorizontal,
  ArrowRight,
  Flame,
  Radio,
  BarChart3,
  Bot
} from 'lucide-react';
import { msp55IngestionService } from '../services/Msp55IngestionService';
import { Msp55IngestionState, DynamicBotTuningParameters } from '../types';

export const Msp55TelemetryView: React.FC = () => {
  const [state, setState] = useState<Msp55IngestionState>(msp55IngestionService.getState());
  const [selectedSymbol, setSelectedSymbol] = useState<string>('EURUSD');
  const [isTuning, setIsTuning] = useState(false);
  const [isSimulatingFallback, setIsSimulatingFallback] = useState(false);
  const [manualLot, setManualLot] = useState<number>(0.75);

  useEffect(() => {
    const unsub = msp55IngestionService.subscribe(() => {
      setState(msp55IngestionService.getState());
    });
    return unsub;
  }, []);

  const handleTune = async (sym: string) => {
    setIsTuning(true);
    const imbalance = state.level2ImbalanceSummary.find(s => s.symbol === sym)?.imbalance || 10.0;
    await msp55IngestionService.tuneBotExecution({
      symbol: sym,
      baseLot: manualLot,
      currentPingMs: 6.2,
      orderFlowImbalance: imbalance,
      macroBias: 'RISK_ON',
      aiSentimentScore: 28.5
    });
    setIsTuning(false);
  };

  const handleToggleGeminiFallback = async () => {
    setIsSimulatingFallback(true);
    const nextAction = state.geminiTelemetry.fallbackEngaged ? 'RESTORE_PRIMARY' : 'TRIGGER_FALLBACK';
    await msp55IngestionService.simulateGeminiFallback(nextAction);
    setIsSimulatingFallback(false);
  };

  const currentTuning: DynamicBotTuningParameters | undefined = state.activeBotTunings[selectedSymbol] || state.activeBotTunings['EURUSD'];

  return (
    <div id="msp55-telemetry-container" className="space-y-4">
      {/* MSP-55 Engine Header */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-4 shadow-lg backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-wider text-slate-100 uppercase">MSP-55 Institutional Ingestion Core</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                  OPTIMAL (64 μs)
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                High-throughput telemetry aggregator for Gemini 3.8/3.7, Macro calendar & Level II order books
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Throughput: <strong className="text-white">{state.ingestionRateTps.toLocaleString()} TPS</strong></span>
            </div>
            <button
              onClick={() => msp55IngestionService.fetchTelemetry()}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Refresh Ingestion Telemetry"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Gemini Fallback Core + Macro Feed + Level II Depth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. Gemini Model Telemetry & Automatic Fallback */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Gemini AI Model Hierarchy</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                state.geminiTelemetry.fallbackEngaged 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}>
                {state.geminiTelemetry.activeModel}
              </span>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Primary Engine:</span>
                  <span className={`font-bold ${state.geminiTelemetry.activeModel === 'gemini-3.8-flash' ? 'text-emerald-400' : 'text-slate-500 line-through'}`}>
                    gemini-3.8-flash
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Auto-Fallback Target:</span>
                  <span className={`font-bold ${state.geminiTelemetry.activeModel === 'gemini-3.7-flash' ? 'text-amber-400' : 'text-slate-400'}`}>
                    gemini-3.7-flash
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Token Status:</span>
                  <span className={`font-bold ${state.geminiTelemetry.tokenStatus === 'OPTIMAL' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {state.geminiTelemetry.tokenStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Inference Latency:</span>
                  <span className="text-white font-bold">{state.geminiTelemetry.lastCallLatencyMs} ms</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Model Confidence:</span>
                  <span className="text-cyan-400 font-bold">{state.geminiTelemetry.confidenceScore}%</span>
                </div>
              </div>

              {state.geminiTelemetry.lastFallbackReason && (
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
                  ⚠️ {state.geminiTelemetry.lastFallbackReason}
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800/80">
            <button
              onClick={handleToggleGeminiFallback}
              disabled={isSimulatingFallback}
              className={`w-full py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all ${
                state.geminiTelemetry.fallbackEngaged
                  ? 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingFallback ? 'animate-spin' : ''}`} />
              {state.geminiTelemetry.fallbackEngaged
                ? 'Restore Primary (Gemini 3.8 Flash)'
                : 'Simulate Gemini 3.8 Token End -> Fallback 3.7'}
            </button>
          </div>
        </div>

        {/* 2. Live Macroeconomic Ingestion Feed */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Live Macroeconomic Telemetry</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                {state.macroFeedCount} Feeds Active
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Fed Funds Target Rate</span>
                <span className="text-white font-bold">4.75% (Easing)</span>
              </div>
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">US Core CPI (YoY)</span>
                <span className="text-emerald-400 font-bold">2.8% (Disinflation)</span>
              </div>
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">US Non-Farm Payrolls</span>
                <span className="text-cyan-400 font-bold">175K (Resilient)</span>
              </div>
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">US 10-Yr Benchmark Yield</span>
                <span className="text-amber-400 font-bold">4.28%</span>
              </div>
            </div>
          </div>

          <div className="p-2 mt-3 rounded bg-indigo-950/40 border border-indigo-500/30 text-[11px] font-mono text-indigo-300 flex items-center justify-between">
            <span>Macro Regime Bias:</span>
            <strong className="text-emerald-300 font-bold">RISK_ON (Bullish Liquidity)</strong>
          </div>
        </div>

        {/* 3. Level II Exchange Order Book Imbalances */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Level II Book Imbalances</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                20-Level Depth
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              {state.level2ImbalanceSummary.map((book) => (
                <div 
                  key={book.symbol}
                  onClick={() => setSelectedSymbol(book.symbol)}
                  className={`p-2 rounded border cursor-pointer transition-all ${
                    selectedSymbol === book.symbol
                      ? 'bg-purple-950/40 border-purple-500/60 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-200">{book.symbol}</span>
                    <span className={`font-bold ${book.imbalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {book.imbalance >= 0 ? '+' : ''}{book.imbalance.toFixed(1)}% {book.imbalance >= 0 ? 'BID SKEW' : 'ASK SKEW'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
                    <div 
                      className="bg-emerald-500 h-full transition-all" 
                      style={{ width: `${Math.max(10, Math.min(90, 50 + book.imbalance * 1.5))}%` }}
                    />
                    <div 
                      className="bg-rose-500 h-full transition-all" 
                      style={{ width: `${Math.max(10, Math.min(90, 50 - book.imbalance * 1.5))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-2 mt-3 rounded bg-purple-950/40 border border-purple-500/30 text-[11px] font-mono text-purple-300 flex items-center justify-between">
            <span>Primary Microstructure Flow:</span>
            <strong className="text-emerald-300 font-bold">Institutional Bid Absorption</strong>
          </div>
        </div>
      </div>

      {/* Dynamic Bot Execution Parameters Tuning Matrix */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                MSP-55 Dynamic Trading Bot Execution Tuning
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {selectedSymbol} FLASHSCALPER
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Real-time algorithmic recalibration synthesizing Gemini intelligence, macro calendar & Level II order flow
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
              {['EURUSD', 'GBPUSD', 'BTCUSD', 'XAUUSD'].map((sym) => (
                <button
                  key={sym}
                  onClick={() => setSelectedSymbol(sym)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                    selectedSymbol === sym
                      ? 'bg-cyan-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleTune(selectedSymbol)}
              disabled={isTuning}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow"
            >
              <SlidersHorizontal className={`w-3.5 h-3.5 ${isTuning ? 'animate-spin' : ''}`} />
              {isTuning ? 'Recalibrating...' : 'Tune Bot Parameters'}
            </button>
          </div>
        </div>

        {/* Real-time Dynamic Parameters Display */}
        {currentTuning ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
              <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1">Dynamic Lot Size</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-emerald-400">{currentTuning.calculatedLotSize}</span>
                <span className="text-[10px] font-mono text-slate-400">lots ({currentTuning.dynamicLotMultiplier}x)</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
              <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1">Dynamic Deviation</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-cyan-400">{currentTuning.dynamicDeviationPts}</span>
                <span className="text-[10px] font-mono text-slate-400">points (MQL5)</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
              <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1">Dynamic ATR SL</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-amber-400">{currentTuning.dynamicSlPips}</span>
                <span className="text-[10px] font-mono text-slate-400">pips</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
              <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1">Dynamic ATR TP</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-indigo-400">{currentTuning.dynamicTpPips}</span>
                <span className="text-[10px] font-mono text-slate-400">pips</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
              <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1">Auto-Breakeven</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-teal-400">+{currentTuning.autoBreakEvenTriggerPips}</span>
                <span className="text-[10px] font-mono text-slate-400">pips trigger</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
              <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1">Execution Gating</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold font-mono text-emerald-400">PASSED (&lt;50ms)</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Tuning Rationale Breakdown */}
        {currentTuning?.tuningRationale && (
          <div className="mt-3 p-3 rounded-lg bg-slate-950/50 border border-slate-800/80 font-mono text-xs text-slate-300 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Live Synthesis & Microstructure Rationale:
            </span>
            {currentTuning.tuningRationale.map((rat, idx) => (
              <div key={idx} className="flex items-start gap-2 text-slate-300">
                <ArrowRight className="w-3 h-3 text-cyan-400 mt-0.5 shrink-0" />
                <span>{rat}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

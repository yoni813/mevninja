import React, { useState, useEffect } from 'react';
import { StrategyConfig, TradingMode, Web3State } from '../types';
import { strategyService } from '../services/StrategyService';
import { tickCache } from '../services/TickCache';
import { Play, Square, Cpu, TrendingUp, Zap, BarChart3, Lock } from 'lucide-react';

interface StrategyEngineViewProps {
  tradingMode: TradingMode;
  web3State: Web3State;
}

export const StrategyEngineView: React.FC<StrategyEngineViewProps> = ({ tradingMode, web3State }) => {
  const [strategies, setStrategies] = useState<StrategyConfig[]>(strategyService.getStrategies());

  useEffect(() => {
    strategyService.setTradingMode(tradingMode);
    const unsubscribe = strategyService.subscribe(() => {
      setStrategies(strategyService.getStrategies());
    });
    return unsubscribe;
  }, [tradingMode]);

  const toggleStrategy = (id: string) => {
    if (tradingMode === 'LIVE' && !web3State.isConnected) {
      alert("Please connect your Web3 wallet in the header to cryptographically sign High-Frequency Trading live sessions.");
      return;
    }
    strategyService.toggleStrategy(id);
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">HFT Strategy Engine (Sub-Millisecond Cache Readers)</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Algorithmic trading strategies running concurrently, reading live prices directly from the in-memory cache with sub-millisecond access speeds. Bypasses UI chart renders to achieve institutional-grade execution speed.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {strategies.map((strat) => {
          const latest = tickCache.getLatestTick(strat.symbol).tick;
          return (
            <div key={strat.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold ${
                    strat.active ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {strat.active ? 'RUNNING (<1ms CACHE)' : 'STOPPED'}
                  </span>
                  <span className="text-xs font-mono text-purple-400">{strat.symbol}</span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">{strat.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Type: {strat.type}</p>
                </div>

                {strat.metadata && (
                  <div className="bg-blue-950/30 border border-blue-800/40 rounded-lg p-2.5 space-y-1 text-[11px] font-mono">
                    <div className="text-blue-300 font-semibold flex items-center justify-between">
                      <span>ENGINE CALIBRATION</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-blue-900/60 text-blue-200 rounded border border-blue-700/50">LOCKED</span>
                    </div>
                    <div className="text-slate-300 flex justify-between">
                      <span className="text-slate-400">Baseline Ping:</span>
                      <span className="text-emerald-400 font-bold">{strat.metadata.baselineLatencyMs} ms ({strat.metadata.vpsLocation})</span>
                    </div>
                    <div className="text-slate-300 flex justify-between">
                      <span className="text-slate-400">Timeout / Slippage:</span>
                      <span className="text-amber-300">{strat.metadata.executionTimeoutMs}ms / ≤{strat.metadata.slippageTolerancePips} pip</span>
                    </div>
                    <div className="text-slate-300 flex justify-between">
                      <span className="text-slate-400">Spread Cap / Risk:</span>
                      <span className="text-slate-200">≤{strat.metadata.spreadFilterMaxPips} pips / {strat.metadata.equityRiskRange}</span>
                    </div>
                    <div className="text-slate-300 flex justify-between">
                      <span className="text-slate-400">Auto-BE / News:</span>
                      <span className="text-purple-300">+{strat.metadata.autoBreakEvenTriggerPips} pips / ±{strat.metadata.newsBlackoutMinutes}m Tier-1</span>
                    </div>
                  </div>
                )}

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Latest Price:</span>
                    <span className="text-white font-bold">{latest ? latest.last : '---'}</span>
                  </div>
                  
                  {/* Simulation Stats */}
                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <div className="text-[10px] text-indigo-400 font-bold tracking-widest">SIMULATION</div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Trades:</span>
                      <span className="text-indigo-300 font-bold">{strat.totalTrades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">PnL:</span>
                      <span className={`font-bold ${strat.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {strat.pnl >= 0 ? `+$${strat.pnl}` : `-$${Math.abs(strat.pnl)}`}
                      </span>
                    </div>
                  </div>

                  {/* Live Stats */}
                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <div className="text-[10px] text-rose-400 font-bold tracking-widest flex items-center space-x-1">
                      <span>LIVE</span>
                      {web3State.isConnected && <Lock className="w-2.5 h-2.5 text-emerald-400" />}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Trades:</span>
                      <span className="text-rose-300 font-bold">{strat.liveTrades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">PnL:</span>
                      <span className={`font-bold ${strat.livePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {strat.livePnl >= 0 ? `+$${strat.livePnl}` : `-$${Math.abs(strat.livePnl)}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => toggleStrategy(strat.id)}
                className={`w-full py-2.5 rounded-xl text-xs font-medium flex items-center justify-center space-x-2 transition-all ${
                  strat.active
                    ? 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60'
                    : tradingMode === 'LIVE' 
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/20'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                }`}
              >
                {strat.active ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Strategy</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start {tradingMode === 'LIVE' ? 'LIVE' : 'SIM'} Strategy</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

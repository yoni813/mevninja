import React, { useState, useEffect } from 'react';
import { Tick, ConnectionStatus } from '../types';
import { tickCache } from '../services/TickCache';
import { TrendingUp, TrendingDown, Activity, Zap, Database, ArrowRightLeft, Layers } from 'lucide-react';
import { OrderBookDepthChart } from './OrderBookDepthChart';
import { NeuralCircuitArrowLogo, GrowthChevronLogo } from './LogoVariants';
import { ExnessAccountTelemetryPanel } from './ExnessAccountTelemetryPanel';

interface DashboardViewProps {
  status: ConnectionStatus;
  lastTick: Tick | null;
  theme?: 'dark' | 'light';
  onOpenBrokerageModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ status, lastTick, theme = 'dark', onOpenBrokerageModal }) => {
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');
  const symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD', 'XAUUSD'];
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [cacheStats, setCacheStats] = useState(tickCache.getCacheStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setTicks(tickCache.getHistory(selectedSymbol).slice(-15).reverse());
      setCacheStats(tickCache.getCacheStats());
    }, 150);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const activeTick = tickCache.getLatestTick(selectedSymbol).tick;
  const history = tickCache.getHistory(selectedSymbol);

  return (
    <div className="space-y-5">
      {/* Top Metric Cards - Transparent Glass */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/35 border border-slate-800/60 backdrop-blur-md rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>ACTIVE ASYNC THREAD</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-lg font-mono font-bold text-white">{status.threadId}</div>
          <div className="mt-1 text-xs text-emerald-400 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{status.protocol} Streaming Active</span>
          </div>
        </div>

        <div className="bg-slate-900/35 border border-slate-800/60 backdrop-blur-md rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>SUB-MS CACHE ACCESS</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-lg font-mono font-bold text-white">{cacheStats.avgReadTimeUs} µs</div>
          <div className="mt-1 text-xs text-slate-400">
            Total Ticks: <strong className="text-white">{cacheStats.totalReads}</strong> reads
          </div>
        </div>

        <div className="bg-slate-900/35 border border-slate-800/60 backdrop-blur-md rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>TERMINAL_PING (LATENCY)</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-lg font-mono font-bold text-white">{status.latencyMs} ms</div>
          <div className="mt-1 text-xs text-slate-400">
            Jitter: <strong className="text-white">{status.jitterMs} ms</strong>
          </div>
        </div>

        <div className="bg-slate-900/35 border border-slate-800/60 backdrop-blur-md rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>PACKETS INGESTED</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-lg font-mono font-bold text-white">{status.packetsReceived.toLocaleString()}</div>
          <div className="mt-1 text-xs text-slate-400">
            Footprint: <strong className="text-white">{(cacheStats.memoryFootprintBytes / 1024).toFixed(1)} KB</strong>
          </div>
        </div>
      </div>

      {/* Live Exness Real Account & Wallet Telemetry */}
      <ExnessAccountTelemetryPanel
        theme={theme}
        onOpenBrokerageModal={onOpenBrokerageModal}
      />

      {/* Symbol Selector Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {symbols.map((sym) => {
          const t = tickCache.getLatestTick(sym).tick;
          return (
            <button
              key={sym}
              onClick={() => setSelectedSymbol(sym)}
              className={`px-3.5 py-2.5 rounded-xl border flex items-center space-x-3 transition-all cursor-pointer backdrop-blur-sm ${
                selectedSymbol === sym
                  ? 'bg-blue-950/50 border-blue-500 text-white shadow-md'
                  : 'bg-slate-900/35 border-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <div className="font-bold text-xs tracking-wide">{sym}</div>
              {t && (
                <div className="text-right font-mono text-[11px]">
                  <div className="text-white font-semibold">{t.last}</div>
                  <div className="text-[9px] text-slate-400">B: {t.bid} | A: {t.ask}</div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* D3.js Real-Time Order Book Depth & Volume Distribution Chart */}
      <OrderBookDepthChart
        symbol={selectedSymbol}
        activeTick={activeTick}
      />

      {/* Main Terminal Area: Price Ladder & Live Tick Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Level 2 / Price Ladder Simulator */}
        <div className="bg-slate-900/35 border border-slate-800/60 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <NeuralCircuitArrowLogo size="xs" glow={true} />
              <span>Depth of Market (DOM) - {selectedSymbol}</span>
            </h2>
            <div className="flex items-center space-x-1.5">
              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-sky-950/80 text-sky-400 border border-sky-800/60 rounded">Momentum Vector</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800/60 text-slate-300 rounded">Sub-ms Cache</span>
            </div>
          </div>

          {activeTick ? (
            <div className="space-y-3 font-mono">
              {/* Asks */}
              <div className="space-y-1">
                {[4, 3, 2, 1].map((offset) => {
                  const step = selectedSymbol.includes('BTC') ? 2.5 : selectedSymbol.includes('XAU') ? 0.25 : selectedSymbol.includes('JPY') ? 0.02 : 0.0001;
                  const decimals = selectedSymbol.includes('JPY') || selectedSymbol.includes('BTC') || selectedSymbol.includes('XAU') ? 2 : 5;
                  const askPrice = Number((activeTick.ask + offset * step).toFixed(decimals));
                  const vol = Math.floor(Math.random() * 20 + 2);
                  return (
                    <div key={offset} className="flex justify-between items-center text-xs bg-rose-950/20 border border-rose-900/30 px-2.5 py-1 rounded">
                      <span className="text-rose-400 font-semibold">{askPrice}</span>
                      <div className="w-20 sm:w-24 bg-rose-900/30 h-1.5 rounded overflow-hidden">
                        <div className="bg-rose-500 h-full" style={{ width: `${vol * 4}%` }}></div>
                      </div>
                      <span className="text-slate-400 text-[11px]">{vol}.00 lot</span>
                    </div>
                  );
                })}
              </div>

              {/* Spread / Midpoint divider */}
              <div className="py-1.5 px-2.5 bg-slate-800/40 rounded border border-slate-700/60 flex justify-between items-center text-xs">
                <span className="text-slate-400">Spread:</span>
                <span className="text-amber-400 font-bold">
                  {selectedSymbol.includes('BTC') || selectedSymbol.includes('XAU')
                    ? `$${Math.abs(activeTick.ask - activeTick.bid).toFixed(2)}`
                    : `${Math.abs((activeTick.ask - activeTick.bid) * (selectedSymbol.includes('JPY') ? 100 : 10000)).toFixed(1)} pts`}
                </span>
                <span className="text-slate-400">Last: <strong className="text-white">{activeTick.last}</strong></span>
              </div>

              {/* Bids */}
              <div className="space-y-1">
                {[1, 2, 3, 4].map((offset) => {
                  const step = selectedSymbol.includes('BTC') ? 2.5 : selectedSymbol.includes('XAU') ? 0.25 : selectedSymbol.includes('JPY') ? 0.02 : 0.0001;
                  const decimals = selectedSymbol.includes('JPY') || selectedSymbol.includes('BTC') || selectedSymbol.includes('XAU') ? 2 : 5;
                  const bidPrice = Number((activeTick.bid - offset * step).toFixed(decimals));
                  const vol = Math.floor(Math.random() * 20 + 2);
                  return (
                    <div key={offset} className="flex justify-between items-center text-xs bg-emerald-950/20 border border-emerald-900/30 px-2.5 py-1 rounded">
                      <span className="text-emerald-400 font-semibold">{bidPrice}</span>
                      <div className="w-20 sm:w-24 bg-emerald-900/30 h-1.5 rounded overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${vol * 4}%` }}></div>
                      </div>
                      <span className="text-slate-400 text-[11px]">{vol}.00 lot</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">Waiting for incoming tick stream...</div>
          )}
        </div>

        {/* Live Tick Stream Table */}
        <div className="bg-slate-900/35 border border-slate-800/60 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <GrowthChevronLogo size="xs" glow={true} />
              <span>Async In-Memory Tick Stream ({selectedSymbol})</span>
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded">Growth Chevron</span>
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">Bypassing DOM re-renders</span>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-400 text-[11px]">
                  <th className="pb-2 font-semibold">SEQ #</th>
                  <th className="pb-2 font-semibold">TIME</th>
                  <th className="pb-2 font-semibold">BID</th>
                  <th className="pb-2 font-semibold">ASK</th>
                  <th className="pb-2 font-semibold">LAST</th>
                  <th className="pb-2 font-semibold">VOL</th>
                  <th className="pb-2 font-semibold">THREAD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {ticks.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2 text-slate-400">#{t.sequenceId}</td>
                    <td className="py-2 text-slate-300">{new Date(t.timestamp).toLocaleTimeString() + '.' + (t.timestamp % 1000).toString().padStart(3, '0')}</td>
                    <td className="py-2 text-emerald-400">{t.bid}</td>
                    <td className="py-2 text-rose-400">{t.ask}</td>
                    <td className="py-2 text-white font-bold">{t.last}</td>
                    <td className="py-2 text-slate-300">{t.volume}</td>
                    <td className="py-2 text-purple-400 text-[10px]">{t.sourceThread}</td>
                  </tr>
                ))}
                {ticks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      No ticks recorded yet. Start the connection stream.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

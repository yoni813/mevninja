import React, { useState, useEffect } from 'react';
import { tickCache } from '../services/TickCache';
import { Database, Zap, HardDrive, RefreshCw, Layers } from 'lucide-react';

export const TickCacheView: React.FC = () => {
  const [cacheStats, setCacheStats] = useState(tickCache.getCacheStats());
  const [allTicks, setAllTicks] = useState(tickCache.getAllLatestTicks());
  const [benchmarkResult, setBenchmarkResult] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCacheStats(tickCache.getCacheStats());
      setAllTicks(tickCache.getAllLatestTicks());
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const runSubMillisecondBenchmark = () => {
    const iterations = 10000;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      tickCache.getLatestTick('EURUSD');
    }
    const end = performance.now();
    const totalTimeUs = (end - start) * 1000;
    const perReadUs = totalTimeUs / iterations;
    setBenchmarkResult(Number(perReadUs.toFixed(3)));
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400">
            <Database className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">Sub-Millisecond In-Memory Tick Cache</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Incoming ticks from the asynchronous connection manager are written immediately into an O(1) in-memory cache structure (`Map` ring-buffer). Strategy logic reads prices instantly in sub-microseconds, completely bypassing heavy chart DOM updates and UI rendering loops.
            </p>
          </div>
        </div>
      </div>

      {/* Cache Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="text-xs text-slate-400">Avg Read Latency</div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-2">{cacheStats.avgReadTimeUs} µs</div>
          <div className="text-[11px] text-slate-500 mt-1">Sub-millisecond direct memory access</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="text-xs text-slate-400">Total Cache Reads</div>
          <div className="text-2xl font-mono font-bold text-white mt-2">{cacheStats.totalReads.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">High-frequency strategy calls</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="text-xs text-slate-400">Cached Symbols</div>
          <div className="text-2xl font-mono font-bold text-blue-400 mt-2">{cacheStats.totalSymbols}</div>
          <div className="text-[11px] text-slate-500 mt-1">Active instruments in memory</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="text-xs text-slate-400">Memory Footprint</div>
          <div className="text-2xl font-mono font-bold text-purple-400 mt-2">
            {(cacheStats.memoryFootprintBytes / 1024).toFixed(1)} KB
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Optimized ring-buffer storage</div>
        </div>
      </div>

      {/* Benchmark & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Benchmark Tool */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm lg:col-span-1 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Sub-MS Read Benchmark</span>
          </h3>
          <p className="text-xs text-slate-400">
            Execute 10,000 continuous cache lookups to verify sub-millisecond execution speeds.
          </p>

          <button
            onClick={runSubMillisecondBenchmark}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs transition-all shadow-lg shadow-blue-900/20"
          >
            Run 10,000 Lookups Benchmark
          </button>

          {benchmarkResult !== null && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-center space-y-1">
              <div className="text-xs text-slate-400">Average Time Per Read:</div>
              <div className="text-xl font-bold text-emerald-400">{benchmarkResult} µs</div>
              <div className="text-[10px] text-slate-500">({(benchmarkResult / 1000).toFixed(4)} milliseconds)</div>
            </div>
          )}
        </div>

        {/* In-Memory Snapshot Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-blue-400" />
            <span>In-Memory Cache Snapshot (O(1) Map)</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">SYMBOL</th>
                  <th className="pb-3 font-semibold">BID</th>
                  <th className="pb-3 font-semibold">ASK</th>
                  <th className="pb-3 font-semibold">LAST PRICE</th>
                  <th className="pb-3 font-semibold">LAST UPDATE</th>
                  <th className="pb-3 font-semibold">THREAD SRC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {Array.from(allTicks.entries()).map(([sym, t]) => (
                  <tr key={sym} className="hover:bg-slate-800/40">
                    <td className="py-3 font-bold text-white">{sym}</td>
                    <td className="py-3 text-emerald-400">{t.bid}</td>
                    <td className="py-3 text-rose-400">{t.ask}</td>
                    <td className="py-3 font-semibold text-white">{t.last}</td>
                    <td className="py-3 text-slate-400">{new Date(t.timestamp).toLocaleTimeString() + '.' + (t.timestamp % 1000).toString().padStart(3, '0')}</td>
                    <td className="py-3 text-purple-400 text-[10px]">{t.sourceThread}</td>
                  </tr>
                ))}
                {allTicks.size === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      Cache is empty. Start the connection manager stream.
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

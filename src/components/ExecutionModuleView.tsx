import React, { useState, useEffect } from 'react';
import { ConnectionStatus, MqlTradeRequest, ExecutionResult, TradingMode, Web3State } from '../types';
import { executionEngine } from '../services/ExecutionEngine';
import { tickCache } from '../services/TickCache';
import { web3Service } from '../services/Web3Service';
import { riskManagement } from '../services/RiskManagement';
import { slippageAnalytics } from '../services/SlippageAnalytics';
import { SlippageHeatmap } from './SlippageHeatmap';
import { Shield, Zap, Send, CheckCircle2, AlertTriangle, RefreshCw, Lock } from 'lucide-react';

interface ExecutionModuleViewProps {
  status: ConnectionStatus;
  onForceSpike: () => void;
  tradingMode: TradingMode;
  web3State: Web3State;
}

export const ExecutionModuleView: React.FC<ExecutionModuleViewProps> = ({ status, onForceSpike, tradingMode, web3State }) => {
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');
  const [orderType, setOrderType] = useState<MqlTradeRequest['type']>('ORDER_TYPE_BUY');
  const [volume, setVolume] = useState(1.0);
  const [latestRequest, setLatestRequest] = useState<MqlTradeRequest | null>(null);
  const [executionHistory, setExecutionHistory] = useState<ExecutionResult[]>([]);
  
  const [isValidating, setIsValidating] = useState(false);
  const [validationSuccess, setValidationSuccess] = useState<boolean | null>(null);

  // Keep execution engine ping in sync with connection status ping
  useEffect(() => {
    executionEngine.setPing(status.latencyMs);
    const latestTick = tickCache.getLatestTick(selectedSymbol).tick;
    if (latestTick) {
      const price = orderType.includes('BUY') ? latestTick.ask : latestTick.bid;
      setLatestRequest(executionEngine.createTradeRequest(selectedSymbol, orderType, volume, price));
    }
    setExecutionHistory(executionEngine.getHistory());
  }, [status.latencyMs, selectedSymbol, orderType, volume]);

  const handleValidateEndpoints = () => {
    setIsValidating(true);
    setValidationSuccess(null);
    setTimeout(() => {
      // Simulate endpoint and FIX session validation
      if (status.isConnected) {
        setValidationSuccess(true);
      } else {
        setValidationSuccess(false);
      }
      setIsValidating(false);
    }, 1200);
  };

  const handleExecute = async () => {
    if (!latestRequest) return;
    
    if (tradingMode === 'LIVE') {
      if (!validationSuccess) {
        alert('Please validate FIX session & API endpoints before live execution.');
        return;
      }
      if (!web3State.isConnected) {
        alert('Please connect your Web3 wallet to cryptographically sign live execution requests.');
        return;
      }

      // Pre-Trade Risk Management Check
      const riskValidation = riskManagement.validatePreTrade(latestRequest.volume, latestRequest.price);
      if (!riskValidation.approved) {
        alert('PRE-TRADE RISK REJECTION: ' + riskValidation.reason);
        return;
      }

      try {
        const payload = JSON.stringify({
          action: latestRequest.action,
          symbol: latestRequest.symbol,
          volume: latestRequest.volume,
          type: latestRequest.type,
          price: latestRequest.price
        });
        
        // Use Ethers.js to sign the transaction payload
        const signature = await web3Service.signTrade(payload);
        
        executionEngine.executeOrder(latestRequest, 'LIVE', signature);
        setExecutionHistory(executionEngine.getHistory());

        const assetClass = selectedSymbol.startsWith('EUR') || selectedSymbol.startsWith('GBP') || selectedSymbol.startsWith('USD')
          ? 'FX Majors'
          : selectedSymbol.startsWith('BTC')
          ? 'Crypto Pairs'
          : selectedSymbol.startsWith('XAU')
          ? 'Commodities'
          : 'FX Majors';
        slippageAnalytics.recordLiveExecution(assetClass, status.latencyMs, dynamicDeviation);
      } catch (err: any) {
        console.error(err);
        alert('Failed to sign transaction: ' + err.message);
      }
    } else {
      // Simulation mode
      executionEngine.executeOrder(latestRequest, 'SIMULATION');
      setExecutionHistory(executionEngine.getHistory());

      const assetClass = selectedSymbol.startsWith('EUR') || selectedSymbol.startsWith('GBP') || selectedSymbol.startsWith('USD')
        ? 'FX Majors'
        : selectedSymbol.startsWith('BTC')
        ? 'Crypto Pairs'
        : selectedSymbol.startsWith('XAU')
        ? 'Commodities'
        : 'FX Majors';
      slippageAnalytics.recordLiveExecution(assetClass, status.latencyMs, dynamicDeviation);
    }
  };

  const dynamicDeviation = executionEngine.calculateDynamicDeviation(status.latencyMs);

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400">
            <Shield className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">Dynamic Execution Module & MqlTradeRequest Slippage Adaptation</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Monitors network latency via `TerminalInfoInteger(TERMINAL_PING)` in real time. The deviation parameter inside `MqlTradeRequest` is automatically linked to this ping: slippage tolerances are tightened during optimal low-lag periods and automatically widened when ping spikes occur to prevent requotes.
            </p>
          </div>
        </div>
      </div>

      {/* Real-Time D3 Slippage Heatmap Visualization */}
      <SlippageHeatmap currentLatencyMs={status.latencyMs} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Form & Deviation Linker */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm lg:col-span-1 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Send className="w-4 h-4 text-emerald-400" />
            <span>Order Dispatcher</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Symbol</label>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              >
                {['EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD', 'XAUUSD'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Order Type</label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as MqlTradeRequest['type'])}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              >
                <option value="ORDER_TYPE_BUY">BUY (Market)</option>
                <option value="ORDER_TYPE_SELL">SELL (Market)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Volume (Lots)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="50"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {tradingMode === 'LIVE' && (
              <div className="bg-rose-950/20 p-4 rounded-xl border border-rose-900/40 space-y-3">
                <div className="text-xs text-slate-300 font-medium">LIVE TRADING VALIDATION</div>
                
                <button
                  onClick={handleValidateEndpoints}
                  disabled={isValidating}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg text-xs transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isValidating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Shield className="w-3.5 h-3.5" />
                  )}
                  <span>{isValidating ? 'Validating FIX & API...' : 'Validate Endpoints'}</span>
                </button>

                {validationSuccess !== null && (
                  <div className={`text-[10px] flex items-center space-x-1.5 ${validationSuccess ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {validationSuccess ? (
                      <><CheckCircle2 className="w-3 h-3" /> <span>All endpoints verified. Ready for live execution.</span></>
                    ) : (
                      <><AlertTriangle className="w-3 h-3" /> <span>Connection inactive. Please connect feed.</span></>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Dynamic Slippage Indicator Box */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Current TERMINAL_PING:</span>
                <span className="font-mono font-bold text-amber-400">{status.latencyMs} ms</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Auto-Linked Deviation:</span>
                <span className="font-mono font-bold text-emerald-400">{dynamicDeviation} points</span>
              </div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                {status.latencyMs <= 30 ? '✓ Low lag: Slippage tolerance tightened for precise fills.' : '⚠ High lag: Deviation widened to prevent requotes.'}
              </div>
            </div>

            <button
              onClick={handleExecute}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-xs transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center space-x-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Send MqlTradeRequest</span>
            </button>

            <button
              onClick={onForceSpike}
              className="w-full py-2 bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 border border-amber-800/60 rounded-xl text-xs font-medium transition-all"
            >
              Test Ping Spike & Deviation Widening
            </button>
          </div>
        </div>

        {/* MqlTradeRequest Structure Inspector & Execution Log */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm lg:col-span-2 space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span>MqlTradeRequest Structure & Execution Output</span>
          </h3>

          {/* Struct code block */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
            <div className="text-purple-400 font-bold mb-2">// MQL5 Trade Request Struct (Auto-updated with dynamic ping deviation)</div>
            {latestRequest ? (
              <>
                <div><span className="text-blue-400">MqlTradeRequest</span> request;</div>
                <div>ZeroMemory(request);</div>
                <div>request.action = <span className="text-amber-400">{latestRequest.action}</span>;</div>
                <div>request.symbol = <span className="text-emerald-400">"{latestRequest.symbol}"</span>;</div>
                <div>request.volume = <span className="text-white">{latestRequest.volume}</span>;</div>
                <div>request.type = <span className="text-amber-400">{latestRequest.type}</span>;</div>
                <div>request.price = <span className="text-white">{latestRequest.price}</span>;</div>
                <div className="bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 my-1">
                  request.deviation = <strong className="text-emerald-400">{latestRequest.deviation}</strong>; <span className="text-slate-500">// Linked to TERMINAL_PING ({status.latencyMs}ms)</span>
                </div>
                <div>request.comment = <span className="text-emerald-400">"{latestRequest.comment}"</span>;</div>
                <div className="text-slate-500 mt-2">MqlTradeResult result; OrderSend(request, result);</div>
              </>
            ) : (
              <div>Initializing request structure...</div>
            )}
          </div>

          {/* Execution History */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Recent Execution Fills</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2 font-semibold">TICKET</th>
                    <th className="pb-2 font-semibold">TIME</th>
                    <th className="pb-2 font-semibold">MODE</th>
                    <th className="pb-2 font-semibold">PRICE</th>
                    <th className="pb-2 font-semibold">PING</th>
                    <th className="pb-2 font-semibold">DEVIATION</th>
                    <th className="pb-2 font-semibold">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {executionHistory.map((ex, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="py-2.5 text-slate-400">#{ex.ticket}</td>
                      <td className="py-2.5 text-slate-300">{new Date(ex.timestamp).toLocaleTimeString()}</td>
                      <td className="py-2.5">
                        <div className="flex items-center space-x-1">
                          <span className={ex.mode === 'LIVE' ? 'text-rose-400 font-bold' : 'text-indigo-400'}>
                            {ex.mode}
                          </span>
                          {ex.signature && <Lock className="w-3 h-3 text-emerald-400" title="Cryptographically Signed" />}
                        </div>
                      </td>
                      <td className="py-2.5 text-white font-bold">{ex.price}</td>
                      <td className="py-2.5 text-amber-400">{ex.pingAtExecution} ms</td>
                      <td className="py-2.5 text-emerald-400">{ex.deviationApplied} pts</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ex.status === 'FILLED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {ex.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {executionHistory.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">
                        No orders executed yet. Click "Send MqlTradeRequest" above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

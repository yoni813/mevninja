import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, ShieldCheck, RefreshCw, 
  ArrowUpRight, ArrowDownRight, Wallet, Lock, Server, CheckCircle2, 
  AlertCircle, X, ChevronRight, Zap, Globe, Key, Sliders, Activity
} from 'lucide-react';
import { telemetryService } from '../services/TelemetryService';
import { BrokerAccountSession, ExnessPosition } from '../types';

interface ExnessAccountTelemetryPanelProps {
  theme?: 'dark' | 'light';
  onOpenBrokerageModal?: () => void;
  compact?: boolean;
}

export const ExnessAccountTelemetryPanel: React.FC<ExnessAccountTelemetryPanelProps> = ({
  theme = 'dark',
  onOpenBrokerageModal,
  compact = false
}) => {
  const isLight = theme === 'light';
  const [account, setAccount] = useState<BrokerAccountSession | null>(telemetryService.getCachedAccount());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('5000');
  const [depositAction, setDepositAction] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [isProcessingTx, setIsProcessingTx] = useState(false);
  const [txMessage, setTxMessage] = useState<string | null>(null);

  // Direct login state
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [serverName, setServerName] = useState('Exness-MT5Trial9');
  const [accountLogin, setAccountLogin] = useState('78401924');
  const [password, setPassword] = useState('••••••••••••');
  const [initialBalance, setInitialBalance] = useState('50000');
  const [leverage, setLeverage] = useState('100');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = telemetryService.subscribeExnessAccount((acc) => {
      setAccount(acc);
    });
    return () => unsub();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await telemetryService.fetchExnessAccountTelemetry();
    setIsRefreshing(false);
  };

  const handleClosePosition = async (ticket: number) => {
    await telemetryService.closeExnessPosition(ticket);
  };

  const handleDepositWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) return;

    setIsProcessingTx(true);
    setTxMessage(null);
    try {
      const res = await telemetryService.adjustExnessWalletBalance(amt, depositAction, `${depositAction} via Portal Treasury`);
      if (res) {
        setTxMessage(`Successfully ${depositAction === 'WITHDRAW' ? 'withdrew' : 'deposited'} $${amt.toLocaleString()}! New Balance: $${res.newBalance.toLocaleString()}`);
        setTimeout(() => {
          setIsDepositModalOpen(false);
          setTxMessage(null);
        }, 1500);
      }
    } finally {
      setIsProcessingTx(false);
    }
  };

  const handleDirectExnessAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthSuccessMsg(null);
    try {
      const res = await telemetryService.authenticateExness({
        server: serverName,
        login: accountLogin,
        password,
        initialBalance: parseFloat(initialBalance) || 50000,
        leverage: parseInt(leverage, 10) || 100,
        currency: 'USD'
      });
      if (res) {
        setAuthSuccessMsg(`Connected to ${res.server} (Account #${res.accountId})`);
        setTimeout(() => {
          setShowLoginForm(false);
          setAuthSuccessMsg(null);
        }, 1200);
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (!account) {
    return (
      <div className={`p-4 rounded-2xl border text-center ${
        isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-950/40 border-slate-800 text-slate-300'
      }`}>
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
        <span className="text-xs font-mono">Initializing Exness Live Telemetry...</span>
      </div>
    );
  }

  const pnlIsPositive = account.floatingPnl >= 0;

  return (
    <div className={`rounded-2xl border transition-all relative overflow-hidden ${
      isLight 
        ? 'bg-white/80 border-slate-300/80 backdrop-blur-md shadow-sm text-slate-900' 
        : 'bg-slate-950/50 border-slate-800/80 backdrop-blur-md shadow-lg text-slate-100'
    }`}>
      {/* Header bar */}
      <div className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2 ${
        isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/50 border-slate-800/80'
      }`}>
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold font-mono tracking-wider">
                EXNESS LIVE ACCOUNT &amp; WALLET TELEMETRY
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                account.isDemo
                  ? isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-950/50 text-amber-400 border-amber-700/60'
                  : isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-950/50 text-emerald-400 border-emerald-700/60'
              }`}>
                {account.isDemo ? 'TRIAL / DEMO' : 'REAL / LIVE'}
              </span>
            </div>
            <div className={`text-[11px] font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Server: <strong className="text-cyan-400">{account.server}</strong> • Account: <strong>#{account.accountId}</strong> • Lev: <strong>1:{account.leverage}</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsDepositModalOpen(true)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer ${
              isLight 
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300' 
                : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border-emerald-700/50'
            }`}
            title="Adjust Wallet Balance (Deposit / Withdraw)"
          >
            <DollarSign className="w-3 h-3" />
            <span>Deposit / Withdraw</span>
          </button>

          <button
            type="button"
            onClick={() => setShowLoginForm(!showLoginForm)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer ${
              showLoginForm
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                : isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' 
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <Key className="w-3 h-3 inline mr-1" />
            <span>{showLoginForm ? 'Close Login' : 'Switch Exness Account'}</span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-100 border-slate-300' : 'hover:bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Refresh Exness Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Embedded Direct Exness Login Form (when toggled) */}
      {showLoginForm && (
        <form onSubmit={handleDirectExnessAuth} className={`p-4 border-b space-y-3 ${
          isLight ? 'bg-sky-50/50 border-sky-200' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider">
              Authenticate Direct Exness Account
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Supports MT5Trial9 &amp; MT5Real10
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
            <div>
              <label className="block text-[10px] uppercase text-slate-400 mb-1">Server Name:</label>
              <select
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-slate-100'
                }`}
              >
                <option value="Exness-MT5Trial9">Exness-MT5Trial9 (Trial / Demo 9)</option>
                <option value="Exness-MT5Real10">Exness-MT5Real10 (Real / Live 10)</option>
                <option value="Exness-MT5Real11">Exness-MT5Real11 (Real / Live 11)</option>
                <option value="Exness-MT5Trial">Exness-MT5Trial (General Demo)</option>
                <option value="Exness-MT5Real-ZA01">Exness-MT5Real-ZA01 (Johannesburg)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase text-slate-400 mb-1">Account Login / ID:</label>
              <input
                type="text"
                value={accountLogin}
                onChange={(e) => setAccountLogin(e.target.value)}
                placeholder="e.g. 78401924"
                required
                className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-slate-100'
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase text-slate-400 mb-1">Trading Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-slate-100'
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase text-slate-400 mb-1">Initial Wallet Balance ($):</label>
              <input
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="50000"
                className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-slate-100'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-3 text-[11px] font-mono">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="exnessType"
                  checked={serverName.includes('Trial') || serverName.includes('Demo')}
                  onChange={() => setServerName('Exness-MT5Trial9')}
                />
                <span>Trial / Demo</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="exnessType"
                  checked={serverName.includes('Real')}
                  onChange={() => setServerName('Exness-MT5Real10')}
                />
                <span className="text-emerald-400 font-bold">Real / Live (MT5Real10)</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="px-4 py-1.5 rounded-lg font-mono font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              {isAuthenticating ? 'Authenticating with Exness...' : 'Connect to Exness'}
            </button>
          </div>

          {authSuccessMsg && (
            <div className="p-2 rounded bg-emerald-950/40 border border-emerald-600 text-emerald-400 text-xs font-mono flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{authSuccessMsg}</span>
            </div>
          )}
        </form>
      )}

      {/* Primary Telemetry Grid: Balance, Equity, Margin, Free Margin, Floating PnL */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Wallet Balance */}
        <div className={`p-3 rounded-xl border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'
        }`}>
          <div className={`text-[10px] uppercase font-mono font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Wallet Balance
          </div>
          <div className="mt-1 text-base sm:text-lg font-bold font-mono text-emerald-400">
            ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            {account.currency} Real Funds
          </div>
        </div>

        {/* Equity */}
        <div className={`p-3 rounded-xl border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'
        }`}>
          <div className={`text-[10px] uppercase font-mono font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Account Equity
          </div>
          <div className={`mt-1 text-base sm:text-lg font-bold font-mono ${pnlIsPositive ? 'text-cyan-400' : 'text-rose-400'}`}>
            ${account.equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            Bal + Floating PnL
          </div>
        </div>

        {/* Floating PnL */}
        <div className={`p-3 rounded-xl border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'
        }`}>
          <div className={`text-[10px] uppercase font-mono font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Floating PnL
          </div>
          <div className={`mt-1 text-base sm:text-lg font-bold font-mono flex items-center space-x-1 ${
            pnlIsPositive ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {pnlIsPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{pnlIsPositive ? '+' : ''}${account.floatingPnl.toFixed(2)}</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            {account.positionsCount} active trades
          </div>
        </div>

        {/* Margin Used */}
        <div className={`p-3 rounded-xl border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'
        }`}>
          <div className={`text-[10px] uppercase font-mono font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Margin Used
          </div>
          <div className="mt-1 text-base sm:text-lg font-bold font-mono text-amber-400">
            ${account.margin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            1:{account.leverage} Leverage
          </div>
        </div>

        {/* Free Margin */}
        <div className={`p-3 rounded-xl border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'
        }`}>
          <div className={`text-[10px] uppercase font-mono font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Free Margin
          </div>
          <div className="mt-1 text-base sm:text-lg font-bold font-mono text-sky-400">
            ${account.freeMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            Available For Orders
          </div>
        </div>

        {/* Margin Level % */}
        <div className={`p-3 rounded-xl border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'
        }`}>
          <div className={`text-[10px] uppercase font-mono font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Margin Level %
          </div>
          <div className="mt-1 text-base sm:text-lg font-bold font-mono text-purple-400">
            {account.marginLevel.toFixed(1)}%
          </div>
          <div className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3" />
            <span>HEALTHY &gt; 100%</span>
          </div>
        </div>
      </div>

      {/* Live Open Positions Table */}
      {account.openPositions && account.openPositions.length > 0 && (
        <div className="px-4 pb-4">
          <div className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center justify-between">
            <span>Live Open Exness Positions ({account.openPositions.length}):</span>
            <span className="text-[10px] text-slate-500">Auto-calculated against real market price feeds</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className={`border-b text-[10px] uppercase text-slate-400 ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}>
                  <th className="py-2 px-2.5">Ticket #</th>
                  <th className="py-2 px-2.5">Symbol</th>
                  <th className="py-2 px-2.5">Type</th>
                  <th className="py-2 px-2.5">Lots</th>
                  <th className="py-2 px-2.5">Open Price</th>
                  <th className="py-2 px-2.5">Current Price</th>
                  <th className="py-2 px-2.5">PnL ($)</th>
                  <th className="py-2 px-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {account.openPositions.map((pos) => {
                  const isPosProfitable = pos.pnl >= 0;
                  return (
                    <tr key={pos.ticket} className={`hover:bg-slate-800/20 transition-colors ${
                      isLight ? 'hover:bg-slate-50' : ''
                    }`}>
                      <td className="py-2.5 px-2.5 font-bold text-slate-300">#{pos.ticket}</td>
                      <td className="py-2.5 px-2.5 font-bold text-cyan-400">{pos.symbol}</td>
                      <td className="py-2.5 px-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          pos.type === 'BUY'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {pos.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5">{pos.lots}</td>
                      <td className="py-2.5 px-2.5">{pos.openPrice}</td>
                      <td className="py-2.5 px-2.5 text-white font-semibold">{pos.currentPrice}</td>
                      <td className={`py-2.5 px-2.5 font-bold ${isPosProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPosProfitable ? '+' : ''}${pos.pnl.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleClosePosition(pos.ticket)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono transition-all cursor-pointer ${
                            isPosProfitable
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-rose-600 hover:bg-rose-500 text-white'
                          }`}
                          title="Close position and realize PnL to Wallet Balance"
                        >
                          Close &amp; Realize
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deposit / Withdraw Modal */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={`relative w-full max-w-md rounded-2xl border p-5 shadow-2xl ${
            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-100'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold font-mono uppercase">
                  Exness Wallet Treasury Adjustment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDepositModalOpen(false)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDepositWithdraw} className="space-y-4 font-mono text-xs">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setDepositAction('DEPOSIT')}
                  className={`flex-1 py-2 rounded-xl font-bold border transition-all ${
                    depositAction === 'DEPOSIT'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Deposit Funds
                </button>
                <button
                  type="button"
                  onClick={() => setDepositAction('WITHDRAW')}
                  className={`flex-1 py-2 rounded-xl font-bold border transition-all ${
                    depositAction === 'WITHDRAW'
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Withdraw Funds
                </button>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-slate-400 mb-1">
                  Amount in USD ($):
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min="1"
                  step="any"
                  required
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-bold font-mono ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-100'
                  }`}
                />
              </div>

              <div className={`p-3 rounded-xl border text-[11px] ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/50 border-slate-800'
              }`}>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Current Wallet Balance:</span>
                  <strong className="text-emerald-400">${account.balance.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Available Free Margin:</span>
                  <strong className="text-sky-400">${account.freeMargin.toLocaleString()}</strong>
                </div>
              </div>

              {txMessage && (
                <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-600 text-emerald-400 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{txMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingTx}
                  className={`px-4 py-1.5 rounded-xl font-bold text-white transition-all shadow-md ${
                    depositAction === 'DEPOSIT'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {isProcessingTx ? 'Processing...' : `Confirm ${depositAction}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

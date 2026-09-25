import React, { useState, useEffect } from 'react';
import { 
  Server, Globe, Check, RefreshCw, X, Shield, ArrowRight, Zap, 
  Key, Lock, CheckCircle2, DollarSign, Wallet, Activity 
} from 'lucide-react';
import { telemetryService } from '../services/TelemetryService';
import { BrokerageServer, BrokerAccountSession } from '../types';

interface BrokerageServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServerChanged?: (newServer: BrokerageServer) => void;
  theme?: 'dark' | 'light';
  traderId?: string;
}

export const BrokerageServerModal: React.FC<BrokerageServerModalProps> = ({
  isOpen,
  onClose,
  onServerChanged,
  theme = 'dark',
  traderId = 'CHIEF_QUANT'
}) => {
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<'EXNESS_AUTH' | 'SERVER_ROUTING'>('EXNESS_AUTH');
  const [servers, setServers] = useState<BrokerageServer[]>([]);
  const [activeServerId, setActiveServerId] = useState<string>('exness-trial9');
  const [selectedServerId, setSelectedServerId] = useState<string>('exness-trial9');
  const [isSwitching, setIsSwitching] = useState(false);

  // Exness Credentials Form
  const [exnessServer, setExnessServer] = useState('Exness-MT5Trial9');
  const [accountLogin, setAccountLogin] = useState('78401924');
  const [accountPassword, setAccountPassword] = useState('••••••••••••');
  const [initialBalance, setInitialBalance] = useState('50000');
  const [leverage, setLeverage] = useState('100');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [activeAccount, setActiveAccount] = useState<BrokerAccountSession | null>(telemetryService.getCachedAccount());

  useEffect(() => {
    if (isOpen) {
      telemetryService.fetchBrokerageServers().then(res => {
        setServers(res.servers);
        setActiveServerId(res.activeServerId);
        setSelectedServerId(res.activeServerId);
      });
      telemetryService.fetchExnessAccountTelemetry().then(acc => {
        if (acc) setActiveAccount(acc);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplySwitch = async () => {
    if (selectedServerId === activeServerId) {
      onClose();
      return;
    }
    setIsSwitching(true);
    try {
      const updated = await telemetryService.selectBrokerageServer(selectedServerId, traderId);
      if (updated) {
        setActiveServerId(updated.id);
        if (onServerChanged) {
          onServerChanged(updated);
        }
      }
    } finally {
      setIsSwitching(false);
      onClose();
    }
  };

  const handleExnessAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthSuccess(null);
    try {
      const isDemo = exnessServer.toLowerCase().includes('trial') || exnessServer.toLowerCase().includes('demo');
      const acc = await telemetryService.authenticateExness({
        server: exnessServer,
        login: accountLogin,
        password: accountPassword,
        isDemo,
        initialBalance: parseFloat(initialBalance) || (isDemo ? 50000 : 100000),
        leverage: parseInt(leverage, 10) || 100,
        currency: 'USD'
      });
      if (acc) {
        setActiveAccount(acc);
        setAuthSuccess(`Authenticated with ${acc.server} (Account #${acc.accountId})! Live telemetry active.`);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className={`relative w-full max-w-2xl rounded-2xl border overflow-hidden shadow-2xl transition-all ${
        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-100'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold tracking-wider">
                EXNESS BROKERAGE &amp; CO-LOCATION GATEWAY
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                MetaTrader 5 Direct Authentication &amp; Live Server Telemetry
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-200 border-slate-300' : 'hover:bg-slate-800 border-slate-800 text-slate-400'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`px-4 pt-2 border-b flex items-center space-x-2 ${
          isLight ? 'bg-slate-100/60 border-slate-200' : 'bg-slate-900/40 border-slate-800'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('EXNESS_AUTH')}
            className={`px-4 py-2 text-xs font-mono font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'EXNESS_AUTH'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5 inline mr-1.5" />
            Exness MT5 Direct Login
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SERVER_ROUTING')}
            className={`px-4 py-2 text-xs font-mono font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'SERVER_ROUTING'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5 inline mr-1.5" />
            Co-Location Routing Servers
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {activeTab === 'EXNESS_AUTH' ? (
            <form onSubmit={handleExnessAuth} className="space-y-4">
              <div className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
                isLight ? 'bg-sky-50 border-sky-200 text-sky-900' : 'bg-cyan-950/30 border-cyan-800/40 text-cyan-300'
              }`}>
                <span>Supports <strong>HNS-Staging</strong>, <strong>Exness-MT5Trial9</strong> &amp; <strong>Exness-MT5Real10</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setExnessServer('HNS-Staging');
                    setAccountLogin('HNS-STAGING-8840');
                    setAccountPassword('••••••••••••');
                    setInitialBalance('100000');
                  }}
                  className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  ⚡ Preset HNS Staging
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-mono text-xs">
                {/* Server selection */}
                <div>
                  <label className={`block text-[10px] uppercase font-bold mb-1.5 ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    Brokerage / Gateway Server:
                  </label>
                  <select
                    value={exnessServer}
                    onChange={(e) => setExnessServer(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-100'
                    }`}
                  >
                    <option value="HNS-Staging">HNS-Staging (HNS Institutional Staging Hub)</option>
                    <option value="HNS-MT5-Live">HNS-MT5-Live (HNS Production DMA Gateway)</option>
                    <option value="Exness-MT5Trial9">Exness-MT5Trial9 (Trial / Demo 9)</option>
                    <option value="Exness-MT5Real10">Exness-MT5Real10 (Real / Live 10)</option>
                    <option value="Exness-MT5Real11">Exness-MT5Real11 (Real / Live 11)</option>
                    <option value="Exness-MT5Trial">Exness-MT5Trial (General Demo)</option>
                    <option value="Exness-MT5Real-ZA01">Exness-MT5Real-ZA01 (Johannesburg Teraco)</option>
                  </select>
                </div>

                {/* Account Login ID */}
                <div>
                  <label className={`block text-[10px] uppercase font-bold mb-1.5 ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    Exness Account Login / ID:
                  </label>
                  <input
                    type="text"
                    value={accountLogin}
                    onChange={(e) => setAccountLogin(e.target.value)}
                    placeholder="e.g. 78401924"
                    required
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-100'
                    }`}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className={`block text-[10px] uppercase font-bold mb-1.5 ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    Trading Password:
                  </label>
                  <input
                    type="password"
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-100'
                    }`}
                  />
                </div>

                {/* Initial Balance */}
                <div>
                  <label className={`block text-[10px] uppercase font-bold mb-1.5 ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    Wallet Balance ($ USD):
                  </label>
                  <input
                    type="number"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    placeholder="50000"
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-100'
                    }`}
                  />
                </div>

                {/* Leverage */}
                <div className="sm:col-span-2">
                  <label className={`block text-[10px] uppercase font-bold mb-1.5 ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    Account Leverage:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['100', '200', '500', '1000'].map((lev) => (
                      <button
                        key={lev}
                        type="button"
                        onClick={() => setLeverage(lev)}
                        className={`py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                          leverage === lev
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                            : isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-700 text-slate-300'
                        }`}
                      >
                        1:{lev}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {authSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-600 text-emerald-400 text-xs font-mono flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{authSuccess}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-mono text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="px-5 py-2 rounded-xl font-mono font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isAuthenticating ? 'Authenticating with Exness...' : 'Sign In to Exness'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Select an institutional co-location data center to minimize execution roundtrip latency:
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {servers.map((srv) => (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => setSelectedServerId(srv.id)}
                    className={`p-3.5 rounded-xl border text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all cursor-pointer ${
                      selectedServerId === srv.id
                        ? isLight 
                          ? 'bg-sky-50 border-sky-400 shadow-sm ring-1 ring-sky-400' 
                          : 'bg-cyan-950/40 border-cyan-500 text-white shadow-[0_0_20px_rgba(34,211,238,0.15)] ring-1 ring-cyan-500'
                        : isLight 
                          ? 'hover:bg-slate-50 border-slate-200 text-slate-800' 
                          : 'hover:bg-slate-900/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{srv.flag}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs font-mono">{srv.name}</span>
                          {srv.id === activeServerId && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              CURRENT ROUTE
                            </span>
                          )}
                        </div>
                        <div className={`text-[11px] font-sans ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          {srv.facility} • {srv.provider}
                        </div>
                        <div className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          Cross-Connect: {srv.crossConnectType} (IP: {srv.ipAddress})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 self-end sm:self-center font-mono">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase">Baseline Ping</div>
                        <div className={`text-sm font-bold ${
                          srv.baselinePingMs <= 2.0 
                            ? 'text-cyan-400' 
                            : srv.baselinePingMs <= 10.0 
                              ? 'text-emerald-400' 
                              : 'text-amber-400'
                        }`}>
                          {srv.baselinePingMs.toFixed(1)} ms
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selectedServerId === srv.id 
                          ? 'bg-cyan-500 border-cyan-400 text-slate-950' 
                          : 'border-slate-700 bg-slate-900/40'
                      }`}>
                        {selectedServerId === srv.id && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Action buttons */}
              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-mono text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleApplySwitch}
                  disabled={isSwitching}
                  className="px-4 py-1.5 rounded-xl font-mono font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSwitching ? 'Switching Fiber Route...' : 'Confirm & Switch Server'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

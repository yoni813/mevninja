import React, { useState, useEffect } from 'react';
import { 
  Activity, Shield, Filter, Download, RefreshCw, 
  CheckCircle2, AlertTriangle, Info, Terminal, Clock, MapPin, Globe
} from 'lucide-react';
import { telemetryService } from '../services/TelemetryService';
import { UserActivityLog } from '../types';

interface TelemetryLogsViewProps {
  theme?: 'dark' | 'light';
}

export const TelemetryLogsView: React.FC<TelemetryLogsViewProps> = ({
  theme = 'dark'
}) => {
  const isLight = theme === 'light';
  const [logs, setLogs] = useState<UserActivityLog[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'INFO' | 'SUCCESS' | 'WARN' | 'CRITICAL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const unsub = telemetryService.subscribeActivities((newLogs) => {
      setLogs(newLogs);
    });

    return () => {
      unsub();
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const fetched = await telemetryService.fetchActivities();
      setLogs(fetched);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchSeverity = filterSeverity === 'ALL' || log.severity === filterSeverity;
    const matchSearch = searchTerm === '' || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.traderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSeverity && matchSearch;
  });

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-cortex-telemetry-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`p-4 sm:p-6 rounded-2xl border space-y-4 transition-all ${
      isLight ? 'bg-white/70 border-slate-300 text-slate-900' : 'bg-slate-950/70 border-slate-800 text-slate-100'
    }`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-700/50">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold font-mono tracking-tight">
                COMPREHENSIVE USER ACTIVITY &amp; ENCLAVE TELEMETRY AUDIT
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold">
                {logs.length} EVENTS CAPTURED
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Tamper-evident cryptographic ledger of all trader interactions, enclave authorizations, and routing transitions.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-100 border-slate-300 text-slate-700' : 'hover:bg-slate-800 border-slate-700 text-slate-300'
            }`}
            title="Refresh backend audit log"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={handleExportJson}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-cyan-300'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Log</span>
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center space-x-1.5">
          <span className={`text-[11px] uppercase mr-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Filter:
          </span>
          {(['ALL', 'INFO', 'SUCCESS', 'WARN', 'CRITICAL'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2 py-1 rounded-lg border transition-all ${
                filterSeverity === sev
                  ? isLight
                    ? 'bg-sky-100 text-sky-800 border-sky-300 font-bold'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                  : isLight
                    ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                    : 'border-slate-800 text-slate-400 hover:bg-slate-900'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search action, user, or IP..."
            className={`w-full px-3 py-1.5 rounded-xl text-xs font-mono border focus:outline-none transition-colors ${
              isLight 
                ? 'bg-white border-slate-300 text-slate-900 focus:border-sky-500' 
                : 'bg-slate-900/70 border-slate-800 text-white focus:border-cyan-500'
            }`}
          />
        </div>
      </div>

      {/* Logs Table / Stream */}
      <div className={`rounded-xl border overflow-hidden max-h-[420px] overflow-y-auto ${
        isLight ? 'border-slate-200 bg-white/60' : 'border-slate-800/80 bg-slate-950/40'
      }`}>
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className={`border-b text-[10px] uppercase font-bold ${
              isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-900/80 border-slate-800 text-slate-400'
            }`}>
              <th className="p-3">Time (UTC)</th>
              <th className="p-3">Severity</th>
              <th className="p-3">Trader / Role</th>
              <th className="p-3">Action &amp; Details</th>
              <th className="p-3">Module</th>
              <th className="p-3">Location &amp; IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-400">
                  No telemetry entries match the current filter.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr 
                  key={log.id} 
                  className={`transition-colors ${
                    isLight ? 'hover:bg-slate-50/80' : 'hover:bg-slate-900/40'
                  }`}
                >
                  <td className="p-3 whitespace-nowrap text-[11px] text-slate-400">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{new Date(log.epochMs).toLocaleTimeString()}</span>
                    </div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                      log.severity === 'SUCCESS' 
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                        : log.severity === 'CRITICAL' 
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' 
                          : log.severity === 'WARN' 
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' 
                            : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                    }`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="font-bold text-slate-200">{log.traderId}</div>
                    <div className="text-[10px] text-slate-400">{log.role}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-cyan-300">{log.action}</div>
                    <div className={`text-[11px] font-sans line-clamp-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {log.details}
                    </div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                      {log.module}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap text-[10px] text-slate-400">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{log.location}</span>
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono pl-4">{log.ip}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

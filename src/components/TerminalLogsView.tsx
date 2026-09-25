import React from 'react';
import { TerminalLog } from '../types';
import { Terminal, Shield, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface TerminalLogsViewProps {
  logs: TerminalLog[];
  onClearLogs: () => void;
}

export const TerminalLogsView: React.FC<TerminalLogsViewProps> = ({ logs, onClearLogs }) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">System & Thread Execution Logs</h2>
            <p className="text-xs text-slate-400">Real-time event stream from asynchronous worker threads and connection manager.</p>
          </div>
        </div>
        <button
          onClick={onClearLogs}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-all border border-slate-700"
        >
          Clear Logs
        </button>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs h-[500px] overflow-y-auto space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start space-x-3 p-2 rounded hover:bg-slate-900/50 transition-colors border-b border-slate-900">
            <span className="text-slate-500 text-[10px] whitespace-nowrap">{log.timestamp}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap ${
              log.level === 'SUCCESS' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
              log.level === 'WARN' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
              log.level === 'ERROR' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
              'bg-blue-950 text-blue-400 border border-blue-800'
            }`}>
              {log.level}
            </span>
            <span className="text-purple-400 text-[11px] whitespace-nowrap">[{log.thread}]</span>
            <span className="text-slate-200 flex-1">{log.message}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-center py-32 text-slate-600">No logs recorded yet.</div>
        )}
      </div>
    </div>
  );
};

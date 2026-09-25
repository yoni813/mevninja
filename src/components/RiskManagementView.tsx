import React, { useState, useEffect } from 'react';
import { RiskState } from '../types';
import { riskManagement } from '../services/RiskManagement';
import { ShieldAlert, ShieldCheck, Activity, BarChart3, AlertTriangle, Scale } from 'lucide-react';

export const RiskManagementView: React.FC = () => {
  const [riskState, setRiskState] = useState<RiskState>(riskManagement.getRiskState());

  useEffect(() => {
    const interval = setInterval(() => {
      setRiskState(riskManagement.getRiskState());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-emerald-600/20 border border-emerald-500/40 rounded-xl text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">Pre-Trade Risk Management & Compliance</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Real-time monitoring of exposure limits, margin utilization, and regulatory compliance checks. The event-driven architecture ensures all parameters are validated before any live trade execution can be routed to the FIX core.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Status & Exposure Limits */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm lg:col-span-1 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Overall Risk Status</span>
            </h3>
            
            <div className={`p-6 rounded-xl border flex flex-col items-center justify-center space-y-3 ${
              riskState.status === 'SECURE' ? 'bg-emerald-950/40 border-emerald-900/60' :
              riskState.status === 'WARNING' ? 'bg-amber-950/40 border-amber-900/60' :
              'bg-rose-950/40 border-rose-900/60'
            }`}>
              {riskState.status === 'SECURE' ? (
                <ShieldCheck className="w-12 h-12 text-emerald-400" />
              ) : riskState.status === 'WARNING' ? (
                <AlertTriangle className="w-12 h-12 text-amber-400" />
              ) : (
                <ShieldAlert className="w-12 h-12 text-rose-400" />
              )}
              <div className={`text-2xl font-black tracking-widest ${
                riskState.status === 'SECURE' ? 'text-emerald-400' :
                riskState.status === 'WARNING' ? 'text-amber-400' :
                'text-rose-400'
              }`}>
                {riskState.status}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span>Exposure Limits</span>
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Margin Utilization</span>
                  <span className="text-white font-mono">{riskState.exposure.marginUtilization.toFixed(1)}% / 100%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      riskState.exposure.marginUtilization < 50 ? 'bg-emerald-500' :
                      riskState.exposure.marginUtilization < 80 ? 'bg-amber-500' : 'bg-rose-500'
                    }`} 
                    style={{ width: `${Math.min(100, riskState.exposure.marginUtilization)}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Gross Exposure</div>
                  <div className="text-sm font-bold text-white font-mono mt-1">
                    ${(riskState.exposure.grossExposure / 1000000).toFixed(2)}M
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Net Exposure</div>
                  <div className="text-sm font-bold text-blue-400 font-mono mt-1">
                    ${(riskState.exposure.netExposure / 1000).toFixed(1)}K
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Regulatory Checks */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Scale className="w-4 h-4 text-purple-400" />
              <span>Regulatory & Compliance Checks</span>
            </h3>
            
            <div className="overflow-hidden border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs font-mono bg-slate-950">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900">
                    <th className="p-4 font-semibold">MODULE ID</th>
                    <th className="p-4 font-semibold">COMPLIANCE RULE</th>
                    <th className="p-4 font-semibold">LAST VERIFIED</th>
                    <th className="p-4 font-semibold text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {riskState.checks.map(check => (
                    <tr key={check.id} className="hover:bg-slate-900/40">
                      <td className="p-4 text-purple-400">#{check.id.toUpperCase()}</td>
                      <td className="p-4 text-white font-medium">{check.name}</td>
                      <td className="p-4 text-slate-500">{new Date(check.lastChecked).toLocaleTimeString()}</td>
                      <td className="p-4 text-right">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider ${
                          check.status === 'PASSED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' :
                          check.status === 'FAILED' ? 'bg-rose-950 text-rose-400 border border-rose-800/60' :
                          'bg-amber-950 text-amber-400 border border-amber-800/60'
                        }`}>
                          {check.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

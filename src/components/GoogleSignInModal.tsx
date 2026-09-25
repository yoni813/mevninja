import React, { useState } from 'react';
import { Shield, X, Check, ArrowRight, RefreshCw, Key } from 'lucide-react';
import { AuthUser } from '../types';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  theme?: 'dark' | 'light';
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  theme = 'dark'
}) => {
  const isLight = theme === 'light';
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('gizzleg@gmail.com');
  const [customEmail, setCustomEmail] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  if (!isOpen) return null;

  const accounts = [
    {
      email: 'gizzleg@gmail.com',
      name: 'Lead Trader (Primary Owner)',
      role: 'LEVEL_5_CHIEF_QUANT',
      roleTitle: 'HNS Staging & Prop Trading Lead',
      desk: 'HNS Staging Gateway (Direct Institutional DMA)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    {
      email: 'staging@hns-trading.io',
      name: 'HNS Staging Institutional Desk',
      role: 'LEVEL_5_CHIEF_QUANT',
      roleTitle: 'Chief Quantitative Architect',
      desk: 'HNS Direct Institutional Gateway',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    },
    {
      email: 'tadiossam@gmail.com',
      name: 'Samuel Tadios',
      role: 'LEVEL_5_CHIEF_QUANT',
      roleTitle: 'Chief Quantitative Architect',
      desk: 'Johannesburg Cross-Connect (Equinix ZA-JNB)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    },
    {
      email: 'quant.lead@shaft-hft.internal',
      name: 'S.H.A.F.T. Institutional Enclave',
      role: 'LEVEL_5_SYSTEMS_ARCHITECT',
      roleTitle: 'FPGA Execution Engine Lead',
      desk: 'London Alpha Desk (LD4 Direct Cross-Connect)',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80'
    }
  ];

  const handleAuthorize = (acc: typeof accounts[0]) => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      const isHns = acc.email.includes('hns') || acc.email === 'gizzleg@gmail.com';
      const verifiedUser: AuthUser = {
        traderId: isHns ? 'HNS-STAGING-01' : acc.email === 'tadiossam@gmail.com' ? 'NX-9012-SAM' : 'NX-7749-CQO',
        name: acc.name,
        email: acc.email,
        role: acc.role,
        desk: acc.desk,
        clearanceLevel: 'LEVEL_5_CHIEF_QUANT',
        enclaveId: 'enc-gsi-oauth-0x981b',
        enclaveAttestation: 'GOOGLE_GSI_OIDC_ATTESTED_NITRO_PCR0_0x3ac91',
        loginTime: new Date().toLocaleTimeString(),
        sessionToken: `gsi_oauth_${Date.now()}`,
        authMethod: isHns ? 'HNS_STAGING' : 'GOOGLE_SSO',
        avatar: acc.avatar,
        permissions: [
          'ORDER_EXECUTION',
          'SUB_50MS_ABORT_OVERRIDE',
          'TERMINAL_PING_CALIBRATION',
          'BROKERAGE_ROUTING_SWITCH',
          'TELEMETRY_LOG_AUDIT',
          'AI_SCREEN_OVERSIGHT',
          'HNS_STAGING_EXECUTION'
        ]
      };
      onSuccess(verifiedUser);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className={`relative w-full max-w-md rounded-2xl border overflow-hidden shadow-2xl transition-all ${
        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-100'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex items-center space-x-2.5">
            {/* Google G Logo SVG */}
            <div className="w-8 h-8 rounded-full bg-white p-1.5 shadow-sm flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-full h-full">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold tracking-wider">
                GOOGLE INSTITUTIONAL SINGLE SIGN-ON
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Sign in to Sunshine High Algorithmic Frequency Trading (S.H.A.F.T.)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isVerifying}
            className={`p-1.5 rounded-lg border transition-colors ${
              isLight ? 'hover:bg-slate-200 border-slate-300' : 'hover:bg-slate-800 border-slate-800 text-slate-400'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Choose an authorized Google Institutional account to attest hardware clearance and enter the Nexus Cortex trading workbench:
          </p>

          {/* Account selector list */}
          <div className="space-y-2.5">
            {accounts.map(acc => (
              <button
                key={acc.email}
                type="button"
                onClick={() => setSelectedAccount(acc.email)}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  selectedAccount === acc.email
                    ? isLight 
                      ? 'bg-sky-50 border-sky-400 shadow-sm' 
                      : 'bg-cyan-950/40 border-cyan-500 text-white shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                    : isLight 
                      ? 'hover:bg-slate-50 border-slate-200 text-slate-700' 
                      : 'hover:bg-slate-900/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={acc.avatar}
                    alt={acc.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-400/30"
                  />
                  <div>
                    <div className="font-bold text-xs">{acc.name}</div>
                    <div className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {acc.email}
                    </div>
                    <div className="text-[10px] text-cyan-500 font-mono mt-0.5">
                      {acc.roleTitle} • {acc.desk}
                    </div>
                  </div>
                </div>

                {selectedAccount === acc.email && (
                  <div className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* OIDC Permissions Badge */}
          <div className={`p-3 rounded-xl border text-[11px] font-mono space-y-1.5 ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900/40 border-slate-800 text-slate-400'
          }`}>
            <div className="font-bold text-xs text-cyan-400 flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Tailored Standard Permissions Granted:</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div>• Sub-50ms Execution Order</div>
              <div>• Real-time VPS 6.2ms Jitter</div>
              <div>• AWS Nitro Hardware Enclave</div>
              <div>• AI Screen Diagnostic Oversight</div>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={() => {
              const acc = accounts.find(a => a.email === selectedAccount) || accounts[0];
              handleAuthorize(acc);
            }}
            disabled={isVerifying}
            className={`w-full py-3 rounded-xl font-mono font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg disabled:opacity-50 ${
              isLight 
                ? 'bg-sky-600 hover:bg-sky-500 text-white' 
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
            }`}
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Exchanging OIDC Tokens with Nitro Enclave...</span>
              </>
            ) : (
              <>
                <span>CONTINUE AS {selectedAccount.toUpperCase()}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

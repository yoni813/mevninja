import React, { useState } from 'react';
import { Fingerprint, ShieldCheck, RefreshCw, X, Check, Key, Cpu } from 'lucide-react';
import { AuthUser } from '../types';

interface BiometricVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  theme?: 'dark' | 'light';
}

export const BiometricVerificationModal: React.FC<BiometricVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  theme = 'dark'
}) => {
  const isLight = theme === 'light';
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<'IDLE' | 'READING_FINGERPRINT' | 'ATTESTING_NITRO' | 'SUCCESS'>('IDLE');

  if (!isOpen) return null;

  const handleStartBiometricScan = () => {
    setIsScanning(true);
    setScanStep('READING_FINGERPRINT');

    setTimeout(() => {
      setScanStep('ATTESTING_NITRO');
      setTimeout(() => {
        setScanStep('SUCCESS');
        setTimeout(() => {
          setIsScanning(false);
          const verifiedUser: AuthUser = {
            traderId: 'NX-7749-CQO',
            name: 'Dr. Evelyn Vance (Touch ID Attested)',
            role: 'LEVEL_5_CHIEF_QUANT',
            desk: 'London Alpha Desk (LD4 Direct Cross-Connect)',
            clearanceLevel: 'LEVEL_5_CHIEF_QUANT',
            enclaveId: 'enc-fido2-bio-0x4a92',
            enclaveAttestation: 'FIDO2_WEBAUTHN_TOUCH_ID_PCR0_0x89cb12',
            loginTime: new Date().toLocaleTimeString(),
            sessionToken: `fido2_bio_${Date.now()}`,
            authMethod: 'BIOMETRIC_TOUCH',
            email: 'evelyn.vance@shaft-hft.internal',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            permissions: [
              'ORDER_EXECUTION',
              'SUB_50MS_ABORT_OVERRIDE',
              'TERMINAL_PING_CALIBRATION',
              'BROKERAGE_ROUTING_SWITCH',
              'TELEMETRY_LOG_AUDIT',
              'AI_SCREEN_OVERSIGHT',
              'BIOMETRIC_SIGNATURE_AUTH'
            ]
          };
          onSuccess(verifiedUser);
        }, 1000);
      }, 1000);
    }, 1200);
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
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold tracking-wider">
                BIOMETRIC / FIDO2 HARDWARE VERIFICATION
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Touch ID, Windows Hello &amp; Hardware Security Key Handshake
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isScanning}
            className={`p-1.5 rounded-lg border transition-colors ${
              isLight ? 'hover:bg-slate-200 border-slate-300' : 'hover:bg-slate-800 border-slate-800 text-slate-400'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center space-y-5">
          {/* Fingerprint Sensor Illustration */}
          <div 
            onClick={!isScanning ? handleStartBiometricScan : undefined}
            className={`w-28 h-28 rounded-full border-2 flex items-center justify-center cursor-pointer relative transition-all duration-300 ${
              scanStep === 'SUCCESS'
                ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.4)]'
                : isScanning
                  ? 'border-purple-400 bg-purple-500/10 shadow-[0_0_30px_rgba(168,85,247,0.4)] animate-pulse'
                  : isLight
                    ? 'border-purple-300 bg-purple-50 hover:bg-purple-100 hover:border-purple-500'
                    : 'border-slate-700 bg-slate-900/60 hover:border-purple-500 hover:bg-slate-900'
            }`}
          >
            {/* Ripples */}
            {isScanning && (
              <div className="absolute inset-0 rounded-full border border-purple-400 animate-ping opacity-40" />
            )}

            {scanStep === 'SUCCESS' ? (
              <Check className="w-14 h-14 text-emerald-400 stroke-[2.5]" />
            ) : (
              <Fingerprint className={`w-14 h-14 transition-colors ${
                isScanning ? 'text-purple-400 animate-pulse' : isLight ? 'text-purple-600' : 'text-purple-400'
              }`} />
            )}
          </div>

          <div>
            <h4 className="font-mono text-sm font-bold tracking-tight mb-1">
              {scanStep === 'IDLE' && 'Touch Sensor or Insert Security Key'}
              {scanStep === 'READING_FINGERPRINT' && 'Scanning Biometric Ridge Pattern...'}
              {scanStep === 'ATTESTING_NITRO' && 'Verifying with AWS Nitro Enclave...'}
              {scanStep === 'SUCCESS' && 'Biometric Attestation Verified!'}
            </h4>
            <p className={`text-xs max-w-xs mx-auto ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {scanStep === 'IDLE' 
                ? 'Click the sensor above or press the button below to initiate biometric verification.'
                : 'Cryptographic challenge-response in progress. Keep finger on sensor.'}
            </p>
          </div>

          {/* Action button */}
          <button
            onClick={handleStartBiometricScan}
            disabled={isScanning}
            className={`w-full py-3 rounded-xl font-mono font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg disabled:opacity-50 ${
              isLight 
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20' 
                : 'bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
            }`}
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Reading Sensor...</span>
              </>
            ) : (
              <>
                <Fingerprint className="w-4 h-4" />
                <span>VERIFY VIA BIOMETRIC SENSOR</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

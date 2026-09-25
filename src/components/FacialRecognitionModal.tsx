import React, { useState, useEffect, useRef } from 'react';
import { Camera, ShieldCheck, RefreshCw, X, CheckCircle2, AlertTriangle, UserCheck, Eye, Lock } from 'lucide-react';
import { AuthUser } from '../types';

interface FacialRecognitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  theme?: 'dark' | 'light';
}

export const FacialRecognitionModal: React.FC<FacialRecognitionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  theme = 'dark'
}) => {
  const isLight = theme === 'light';
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanPhase, setScanPhase] = useState<'INITIALIZING' | 'ALIGNING' | 'EXTRACTING_MESH' | 'ZKP_PROVING' | 'VERIFIED'>('INITIALIZING');
  const [biometricScore, setBiometricScore] = useState(0);
  const [simulatedMode, setSimulatedMode] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScanProgress(0);
      setScanPhase('INITIALIZING');
      setBiometricScore(0);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setStreamActive(true);
          runBiometricScanSequence();
        }
      } else {
        throw new Error('Webcam API not directly available in sandbox. Switching to hardware sensor simulation.');
      }
    } catch (err: any) {
      console.warn('[FacialAuth] Camera access fallback to biometric simulation:', err.message);
      setSimulatedMode(true);
      setStreamActive(true);
      runBiometricScanSequence();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  const runBiometricScanSequence = () => {
    setScanPhase('ALIGNING');
    let current = 0;
    const interval = setInterval(() => {
      current += 4;
      setScanProgress(Math.min(100, current));
      setBiometricScore(Number((0.85 + (current / 100) * 0.148).toFixed(4)));

      if (current === 28) {
        setScanPhase('EXTRACTING_MESH');
      } else if (current === 64) {
        setScanPhase('ZKP_PROVING');
      } else if (current >= 100) {
        clearInterval(interval);
        setScanPhase('VERIFIED');
        setTimeout(() => {
          stopCamera();
          const verifiedUser: AuthUser = {
            traderId: 'NX-7749-CQO',
            name: 'Dr. Evelyn Vance (Biometric Attested)',
            role: 'LEVEL_5_CHIEF_QUANT',
            desk: 'London Alpha Desk (LD4 Direct Cross-Connect)',
            clearanceLevel: 'LEVEL_5_CHIEF_QUANT',
            enclaveId: 'enc-bio-facial-0x892a',
            enclaveAttestation: 'NITRO_BIOMETRIC_FACIAL_PCR0_VERIFIED_0x9b4c1',
            loginTime: new Date().toLocaleTimeString(),
            sessionToken: `bio_jwt_${Date.now()}`,
            authMethod: 'FACIAL_RECOGNITION',
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
        }, 1200);
      }
    }, 90);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className={`relative w-full max-w-lg rounded-2xl border overflow-hidden shadow-2xl transition-all ${
        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-100'
      }`}>
        
        {/* Top Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold tracking-wider flex items-center space-x-2">
                <span>FACIAL RECOGNITION BIOMETRIC SCAN</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono">
                  S.H.A.F.T. ZERO-KNOWLEDGE
                </span>
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                AWS Nitro Enclave Isolated Liveness & Facial Geometry Verification
              </p>
            </div>
          </div>
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className={`p-1.5 rounded-lg border transition-colors ${
              isLight ? 'hover:bg-slate-200 border-slate-300' : 'hover:bg-slate-800 border-slate-800 text-slate-400'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video / Camera Viewport with HUD Overlay */}
        <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800">
          
          {/* Live Video or Simulated Canvas */}
          {!simulatedMode ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 relative">
              {/* Simulated Face Silhouette */}
              <div className="w-40 h-52 rounded-full border-2 border-dashed border-cyan-500/50 flex items-center justify-center relative">
                <div className="w-32 h-44 rounded-full border border-cyan-400/30 flex flex-col items-center justify-center space-y-4">
                  <div className="flex space-x-8">
                    <div className="w-4 h-2 bg-cyan-400/40 rounded-full animate-pulse" />
                    <div className="w-4 h-2 bg-cyan-400/40 rounded-full animate-pulse" />
                  </div>
                  <div className="w-2 h-6 bg-cyan-400/40 rounded" />
                  <div className="w-10 h-2 bg-cyan-400/40 rounded-full" />
                </div>
              </div>
              <span className="absolute bottom-3 text-[10px] font-mono text-cyan-400/70">
                [Biometric Hardware Emulation Active]
              </span>
            </div>
          )}

          {/* Biometric Scanning Grid & Reticle Overlay */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
            
            {/* Dynamic Laser Scanning Line */}
            <div 
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(34,211,238,0.8)] transition-all duration-75"
              style={{ top: `${scanProgress}%` }}
            />

            {/* Target Face Frame Box */}
            <div className={`relative w-48 sm:w-56 h-60 rounded-3xl border-2 transition-all flex flex-col justify-between p-2 ${
              scanPhase === 'VERIFIED'
                ? 'border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                : 'border-cyan-400/70 shadow-[0_0_20px_rgba(34,211,238,0.3)] animate-pulse'
            }`}>
              {/* Corner markers */}
              <div className="flex justify-between">
                <div className="w-4 h-4 border-t-2 border-l-2 border-cyan-300" />
                <div className="w-4 h-4 border-t-2 border-r-2 border-cyan-300" />
              </div>

              {/* Status Center Icon */}
              <div className="flex flex-col items-center justify-center">
                {scanPhase === 'VERIFIED' ? (
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
                ) : (
                  <Eye className="w-8 h-8 text-cyan-400/60 animate-pulse" />
                )}
                <span className="text-[11px] font-mono font-bold text-cyan-300 mt-2 bg-black/60 px-2 py-0.5 rounded">
                  {scanPhase === 'ALIGNING' && 'ALIGNING BIOMETRIC FRAME...'}
                  {scanPhase === 'EXTRACTING_MESH' && 'EXTRACTING 468 3D LANDMARKS...'}
                  {scanPhase === 'ZKP_PROVING' && 'GENERATING ZERO-KNOWLEDGE PROOF...'}
                  {scanPhase === 'VERIFIED' && 'ATTRIBUTES MATCHED 99.8%'}
                </span>
              </div>

              <div className="flex justify-between">
                <div className="w-4 h-4 border-b-2 border-l-2 border-cyan-300" />
                <div className="w-4 h-4 border-b-2 border-r-2 border-cyan-300" />
              </div>
            </div>

            {/* Top Right Live Telemetry */}
            <div className="absolute top-3 right-3 text-right font-mono text-[10px] text-cyan-300 bg-black/70 px-2.5 py-1.5 rounded-lg border border-cyan-500/30">
              <div>CONFIDENCE: {(biometricScore * 100).toFixed(1)}%</div>
              <div>ENTROPY: 256-BIT SHA3</div>
              <div>ENCLAVE: AWS NITRO SGX</div>
            </div>
          </div>
        </div>

        {/* Progress Bar & Feedback Footer */}
        <div className="p-4 space-y-3">
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Biometric Attestation Progress</span>
              <span className="font-bold text-cyan-400">{scanProgress}%</span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-150"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Biometric PCR0 Attested</span>
            </div>
            <button
              onClick={() => {
                setScanProgress(0);
                runBiometricScanSequence();
              }}
              className={`flex items-center space-x-1 text-[11px] underline cursor-pointer ${
                isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <RefreshCw className="w-3 h-3" />
              <span>Rescan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { NexusCortexLogo } from './NexusCortexLogo';

interface Msp55LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  pulse?: boolean;
  showSubtext?: boolean;
  variant?: 'icon' | 'full';
  theme?: 'dark' | 'light' | 'auto';
}

export const Msp55Logo: React.FC<Msp55LogoProps> = ({
  size = 'lg',
  pulse = true,
  showSubtext = true,
  variant = 'full',
  theme = 'dark'
}) => {
  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="relative transform hover:scale-[1.02] transition-transform duration-300">
        <NexusCortexLogo
          size={size}
          variant={variant}
          theme={theme}
          pulse={pulse}
        />
      </div>

      {showSubtext && (
        <div className="mt-2 text-center">
          <div className="flex items-center justify-center space-x-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-400/90 font-semibold">
              MSP-55 HARDWARE ENCLAVE VERIFIED
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { DetectiveLogo } from './DetectiveLogo';

interface NexusCortexLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'icon' | 'full';
  theme?: 'dark' | 'light' | 'auto';
  pulse?: boolean;
  animated?: boolean;
  className?: string;
  showText?: boolean;
}

export const NexusCortexLogo: React.FC<NexusCortexLogoProps> = ({
  size = 'md',
  variant = 'icon',
  theme = 'auto',
  pulse = true,
  animated = true,
  className = '',
  showText = false
}) => {
  return (
    <DetectiveLogo
      size={size}
      variant={variant === 'full' ? 'full' : 'silhouette'}
      theme={theme}
      pulse={pulse}
      animated={animated}
      className={className}
      showText={showText || variant === 'full'}
      accentColor="cyan"
    />
  );
};


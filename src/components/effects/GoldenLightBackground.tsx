import React, { useEffect, useRef } from 'react';
import '../../styles/golden-light-effects.css';
import { GoldenAmbientGlow, type GoldenSectionVariant } from './GoldenAmbientGlow';
import { GoldenLightTrails } from './GoldenLightTrails';
import { GoldenOrbs } from './GoldenOrbs';
import { GoldenParticles } from './GoldenParticles';

interface GoldenLightBackgroundProps {
  variant?: GoldenSectionVariant;
  className?: string;
}

export const GoldenLightBackground: React.FC<GoldenLightBackgroundProps> = ({
  variant = 'hero',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const syncVisibility = () => {
      containerRef.current?.classList.toggle('is-paused', document.hidden);
    };
    syncVisibility();
    document.addEventListener('visibilitychange', syncVisibility);
    return () => document.removeEventListener('visibilitychange', syncVisibility);
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      data-golden-variant={variant}
      className={`golden-light-background ${className}`.trim()}
    >
      <GoldenAmbientGlow variant={variant} />
      <GoldenOrbs variant={variant} />
      <GoldenLightTrails variant={variant} />
      <GoldenParticles variant={variant} />
    </div>
  );
};

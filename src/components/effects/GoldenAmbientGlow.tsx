import React from 'react';

export type GoldenSectionVariant =
  | 'hero'
  | 'about'
  | 'services'
  | 'solutions'
  | 'projects'
  | 'insights'
  | 'contact'
  | 'footer';

interface GoldenAmbientGlowProps {
  variant: GoldenSectionVariant;
}

export const GoldenAmbientGlow: React.FC<GoldenAmbientGlowProps> = ({ variant }) => {
  return (
    <div className="golden-layer-ambient">
      <div className={`golden-ambient-wash golden-ambient-wash--${variant}`} />
    </div>
  );
};

import React from 'react';
import type { GoldenSectionVariant } from './GoldenAmbientGlow';

interface TrailSpec {
  id: string;
  top: string;
  left: string;
  width: string;
  angle: string;
  duration: string;
  delay: string;
  opacity: number;
  tier?: 'all' | 'tablet-up' | 'desktop-only';
}

const TRAILS_BY_VARIANT: Record<GoldenSectionVariant, TrailSpec[]> = {
  hero: [
    {
      id: 'hero-trail-1',
      top: '22%',
      left: '4%',
      width: '44%',
      angle: '-7deg',
      duration: '24s',
      delay: '-5s',
      opacity: 0.24,
      tier: 'all',
    },
    {
      id: 'hero-trail-2',
      top: '76%',
      left: '42%',
      width: '42%',
      angle: '5deg',
      duration: '29s',
      delay: '-14s',
      opacity: 0.2,
      tier: 'desktop-only',
    },
  ],
  about: [
    {
      id: 'about-trail-1',
      top: '28%',
      left: '10%',
      width: '38%',
      angle: '-5deg',
      duration: '28s',
      delay: '-9s',
      opacity: 0.16,
      tier: 'tablet-up',
    },
  ],
  services: [
    {
      id: 'services-trail-1',
      top: '18%',
      left: '50%',
      width: '40%',
      angle: '-6deg',
      duration: '27s',
      delay: '-11s',
      opacity: 0.18,
      tier: 'tablet-up',
    },
  ],
  solutions: [
    {
      id: 'solutions-trail-1',
      top: '66%',
      left: '14%',
      width: '36%',
      angle: '4deg',
      duration: '26s',
      delay: '-7s',
      opacity: 0.18,
      tier: 'tablet-up',
    },
  ],
  projects: [
    {
      id: 'projects-trail-1',
      top: '16%',
      left: '8%',
      width: '40%',
      angle: '-6deg',
      duration: '25s',
      delay: '-6s',
      opacity: 0.2,
      tier: 'all',
    },
    {
      id: 'projects-trail-2',
      top: '84%',
      left: '48%',
      width: '38%',
      angle: '5deg',
      duration: '31s',
      delay: '-17s',
      opacity: 0.18,
      tier: 'desktop-only',
    },
  ],
  insights: [],
  contact: [
    {
      id: 'contact-trail-1',
      top: '24%',
      left: '12%',
      width: '36%',
      angle: '-5deg',
      duration: '28s',
      delay: '-10s',
      opacity: 0.18,
      tier: 'tablet-up',
    },
  ],
  footer: [],
};

export const GoldenLightTrails: React.FC<{ variant: GoldenSectionVariant }> = ({
  variant,
}) => {
  const trails = TRAILS_BY_VARIANT[variant];
  if (trails.length === 0) return null;

  return (
    <div className="golden-layer-particles">
      {trails.map((trail) => {
        const tierClass =
          trail.tier === 'desktop-only'
            ? 'golden-desktop-only'
            : trail.tier === 'tablet-up'
              ? 'golden-tablet-up'
              : '';
        return (
          <div
            key={trail.id}
            className={`golden-trail ${tierClass}`.trim()}
            style={
              {
                top: trail.top,
                left: trail.left,
                width: trail.width,
                '--trail-angle': trail.angle,
                '--trail-duration': trail.duration,
                '--trail-delay': trail.delay,
                '--trail-opacity': String(trail.opacity),
              } as React.CSSProperties
            }
          />
        );
      })}
      {(variant === 'hero' || variant === 'projects') && (
        <svg
          className="golden-trail-arc golden-tablet-up"
          viewBox="0 0 800 220"
          fill="none"
          preserveAspectRatio="none"
          style={
            {
              top: variant === 'hero' ? '10%' : '20%',
              left: '8%',
              width: '84%',
              height: '180px',
              '--trail-duration': variant === 'hero' ? '30s' : '34s',
              '--trail-delay': '-8s',
            } as React.CSSProperties
          }
        >
          <defs>
            <linearGradient id={`gold-arc-${variant}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(200, 162, 83, 0)" />
              <stop offset="35%" stopColor="rgba(200, 162, 83, 0.12)" />
              <stop offset="55%" stopColor="rgba(229, 206, 147, 0.24)" />
              <stop offset="80%" stopColor="rgba(200, 162, 83, 0.08)" />
              <stop offset="100%" stopColor="rgba(200, 162, 83, 0)" />
            </linearGradient>
          </defs>
          <path
            d="M 10 155 Q 260 40 520 118 T 790 52"
            stroke={`url(#gold-arc-${variant})`}
            strokeWidth="1.25"
            strokeLinecap="round"
          />
        </svg>
      )}
    </div>
  );
};

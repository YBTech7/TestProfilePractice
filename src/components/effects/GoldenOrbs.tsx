import React from 'react';
import type { GoldenSectionVariant } from './GoldenAmbientGlow';

interface OrbSpec {
  id: string;
  top: string;
  left: string;
  size: number;
  duration: string;
  delay: string;
  dx: string;
  dy: string;
  opacityMin: number;
  opacityMax: number;
  soft?: boolean;
  tier?: 'all' | 'tablet-up' | 'desktop-only';
}

const ORBS_BY_VARIANT: Record<GoldenSectionVariant, OrbSpec[]> = {
  hero: [
    {
      id: 'hero-orb-1',
      top: '-6%',
      left: '6%',
      size: 320,
      duration: '26s',
      delay: '-4s',
      dx: '22px',
      dy: '-18px',
      opacityMin: 0.28,
      opacityMax: 0.48,
      tier: 'all',
    },
    {
      id: 'hero-orb-2',
      top: '48%',
      left: '64%',
      size: 270,
      duration: '31s',
      delay: '-11s',
      dx: '-18px',
      dy: '16px',
      opacityMin: 0.22,
      opacityMax: 0.38,
      soft: true,
      tier: 'tablet-up',
    },
    {
      id: 'hero-orb-3',
      top: '14%',
      left: '78%',
      size: 180,
      duration: '23s',
      delay: '-7s',
      dx: '14px',
      dy: '14px',
      opacityMin: 0.18,
      opacityMax: 0.34,
      soft: true,
      tier: 'desktop-only',
    },
  ],
  about: [
    {
      id: 'about-orb-1',
      top: '16%',
      left: '70%',
      size: 230,
      duration: '30s',
      delay: '-6s',
      dx: '-14px',
      dy: '14px',
      opacityMin: 0.18,
      opacityMax: 0.32,
      soft: true,
      tier: 'all',
    },
  ],
  services: [
    {
      id: 'services-orb-1',
      top: '8%',
      left: '12%',
      size: 260,
      duration: '29s',
      delay: '-9s',
      dx: '16px',
      dy: '12px',
      opacityMin: 0.18,
      opacityMax: 0.32,
      soft: true,
      tier: 'all',
    },
    {
      id: 'services-orb-2',
      top: '58%',
      left: '74%',
      size: 240,
      duration: '33s',
      delay: '-14s',
      dx: '-16px',
      dy: '-14px',
      opacityMin: 0.16,
      opacityMax: 0.3,
      soft: true,
      tier: 'tablet-up',
    },
  ],
  solutions: [
    {
      id: 'solutions-orb-1',
      top: '18%',
      left: '8%',
      size: 240,
      duration: '28s',
      delay: '-5s',
      dx: '18px',
      dy: '-12px',
      opacityMin: 0.2,
      opacityMax: 0.34,
      soft: true,
      tier: 'all',
    },
    {
      id: 'solutions-orb-2',
      top: '44%',
      left: '68%',
      size: 220,
      duration: '32s',
      delay: '-13s',
      dx: '-14px',
      dy: '16px',
      opacityMin: 0.16,
      opacityMax: 0.3,
      soft: true,
      tier: 'tablet-up',
    },
  ],
  projects: [
    {
      id: 'projects-orb-1',
      top: '12%',
      left: '66%',
      size: 260,
      duration: '31s',
      delay: '-8s',
      dx: '-18px',
      dy: '14px',
      opacityMin: 0.18,
      opacityMax: 0.34,
      soft: true,
      tier: 'all',
    },
    {
      id: 'projects-orb-2',
      top: '56%',
      left: '8%',
      size: 210,
      duration: '27s',
      delay: '-16s',
      dx: '14px',
      dy: '-12px',
      opacityMin: 0.16,
      opacityMax: 0.28,
      soft: true,
      tier: 'tablet-up',
    },
  ],
  insights: [
    {
      id: 'insights-orb-1',
      top: '18%',
      left: '62%',
      size: 200,
      duration: '34s',
      delay: '-10s',
      dx: '-12px',
      dy: '10px',
      opacityMin: 0.14,
      opacityMax: 0.26,
      soft: true,
      tier: 'all',
    },
  ],
  contact: [
    {
      id: 'contact-orb-1',
      top: '16%',
      left: '6%',
      size: 270,
      duration: '27s',
      delay: '-4s',
      dx: '18px',
      dy: '-14px',
      opacityMin: 0.22,
      opacityMax: 0.38,
      tier: 'all',
    },
    {
      id: 'contact-orb-2',
      top: '54%',
      left: '74%',
      size: 220,
      duration: '32s',
      delay: '-12s',
      dx: '-14px',
      dy: '12px',
      opacityMin: 0.18,
      opacityMax: 0.32,
      soft: true,
      tier: 'tablet-up',
    },
  ],
  footer: [],
};

export const GoldenOrbs: React.FC<{ variant: GoldenSectionVariant }> = ({ variant }) => {
  const orbs = ORBS_BY_VARIANT[variant];
  if (orbs.length === 0) return null;

  return (
    <div className="golden-layer-ambient">
      {orbs.map((orb) => {
        const tierClass =
          orb.tier === 'desktop-only'
            ? 'golden-desktop-only'
            : orb.tier === 'tablet-up'
              ? 'golden-tablet-up'
              : '';
        return (
          <div
            key={orb.id}
            className={`golden-orb ${orb.soft ? 'golden-orb--soft' : ''} ${tierClass}`.trim()}
            style={
              {
                top: orb.top,
                left: orb.left,
                width: `${orb.size}px`,
                height: `${orb.size}px`,
                '--orb-duration': orb.duration,
                '--orb-delay': orb.delay,
                '--orb-dx': orb.dx,
                '--orb-dy': orb.dy,
                '--orb-opacity-min': String(orb.opacityMin),
                '--orb-opacity-max': String(orb.opacityMax),
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
};

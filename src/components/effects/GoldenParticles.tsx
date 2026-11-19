import React from 'react';
import type { GoldenSectionVariant } from './GoldenAmbientGlow';

interface ParticleSpec {
  id: string;
  top: number;
  left: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  dx: number;
  dy: number;
  direction: 'up' | 'diag';
  color: string;
  tier: 'all' | 'tablet-up' | 'desktop-only';
}

interface StardustSpec {
  id: string;
  top: number;
  left: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  tier: 'all' | 'tablet-up' | 'desktop-only';
}

const VARIANT_CONFIG: Record<
  GoldenSectionVariant,
  { seed: number; particles: number; stardust: number; maxOpacity: number }
> = {
  hero: { seed: 101, particles: 22, stardust: 4, maxOpacity: 0.34 },
  about: { seed: 211, particles: 10, stardust: 2, maxOpacity: 0.24 },
  services: { seed: 307, particles: 14, stardust: 3, maxOpacity: 0.26 },
  solutions: { seed: 409, particles: 12, stardust: 2, maxOpacity: 0.25 },
  projects: { seed: 503, particles: 14, stardust: 3, maxOpacity: 0.28 },
  insights: { seed: 601, particles: 8, stardust: 2, maxOpacity: 0.2 },
  contact: { seed: 709, particles: 12, stardust: 2, maxOpacity: 0.28 },
  footer: { seed: 809, particles: 6, stardust: 1, maxOpacity: 0.18 },
};

function seededUnit(seed: number, index: number, salt: number): number {
  const value = Math.sin(seed * 12.9898 + index * 78.233 + salt * 37.719) * 43758.5453;
  return value - Math.floor(value);
}

function buildParticles(variant: GoldenSectionVariant): ParticleSpec[] {
  const cfg = VARIANT_CONFIG[variant];
  const palette = ['#e5ce93', '#c8a253', '#dfc585', '#f7e7b4'];
  const items: ParticleSpec[] = [];

  for (let i = 0; i < cfg.particles; i++) {
    const r1 = seededUnit(cfg.seed, i, 1);
    const r2 = seededUnit(cfg.seed, i, 2);
    const r3 = seededUnit(cfg.seed, i, 3);
    const r4 = seededUnit(cfg.seed, i, 4);
    const r5 = seededUnit(cfg.seed, i, 5);

    const tier: ParticleSpec['tier'] =
      i < Math.ceil(cfg.particles * 0.45)
        ? 'all'
        : i < Math.ceil(cfg.particles * 0.72)
          ? 'tablet-up'
          : 'desktop-only';

    const size = Number((1.2 + r3 * 2.6).toFixed(2));
    const opacity = Number((0.1 + r4 * (cfg.maxOpacity - 0.1)).toFixed(2));
    const duration = Number((16 + r5 * 18).toFixed(1));
    const delay = Number((-r1 * 24).toFixed(1));
    const direction: 'up' | 'diag' = i % 3 === 0 ? 'diag' : 'up';

    items.push({
      id: `${variant}-p-${i}`,
      top: Number((8 + r1 * 84).toFixed(2)),
      left: Number((4 + r2 * 92).toFixed(2)),
      size,
      opacity,
      duration,
      delay,
      dx: direction === 'diag' ? Math.round(14 + r3 * 18) : Math.round((r3 - 0.5) * 18),
      dy: -Math.round(24 + r4 * 26),
      direction,
      color: palette[i % palette.length],
      tier,
    });
  }

  return items;
}

function buildStardust(variant: GoldenSectionVariant): StardustSpec[] {
  const cfg = VARIANT_CONFIG[variant];
  const items: StardustSpec[] = [];

  for (let i = 0; i < cfg.stardust; i++) {
    const r1 = seededUnit(cfg.seed + 50, i, 7);
    const r2 = seededUnit(cfg.seed + 50, i, 9);
    const r3 = seededUnit(cfg.seed + 50, i, 11);

    const tier: StardustSpec['tier'] =
      i === 0 ? 'all' : i === 1 ? 'tablet-up' : 'desktop-only';

    items.push({
      id: `${variant}-s-${i}`,
      top: Number((12 + r1 * 74).toFixed(2)),
      left: Number((8 + r2 * 84).toFixed(2)),
      size: Number((2.2 + r3 * 1.6).toFixed(2)),
      opacity: Number((Math.min(0.38, cfg.maxOpacity + 0.06)).toFixed(2)),
      duration: Number((11 + r3 * 9).toFixed(1)),
      delay: Number((-r2 * 14).toFixed(1)),
      tier,
    });
  }

  return items;
}

export const GoldenParticles: React.FC<{ variant: GoldenSectionVariant }> = ({
  variant,
}) => {
  const particles = React.useMemo(() => buildParticles(variant), [variant]);
  const stardust = React.useMemo(() => buildStardust(variant), [variant]);

  return (
    <div className="golden-layer-particles">
      {particles.map((p) => {
        const tierClass =
          p.tier === 'desktop-only'
            ? 'golden-desktop-only'
            : p.tier === 'tablet-up'
              ? 'golden-tablet-up'
              : '';
        return (
          <span
            key={p.id}
            className={`golden-particle golden-particle--${p.direction} ${tierClass}`.trim()}
            style={
              {
                top: `${p.top}%`,
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                '--particle-color': p.color,
                '--p-opacity': String(p.opacity),
                '--p-duration': `${p.duration}s`,
                '--p-delay': `${p.delay}s`,
                '--p-dx': `${p.dx}px`,
                '--p-dy': `${p.dy}px`,
              } as React.CSSProperties
            }
          />
        );
      })}

      {stardust.map((s) => {
        const tierClass =
          s.tier === 'desktop-only'
            ? 'golden-desktop-only'
            : s.tier === 'tablet-up'
              ? 'golden-tablet-up'
              : '';
        return (
          <span
            key={s.id}
            className={`golden-stardust ${tierClass}`.trim()}
            style={
              {
                top: `${s.top}%`,
                left: `${s.left}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                '--s-opacity': String(s.opacity),
                '--s-duration': `${s.duration}s`,
                '--s-delay': `${s.delay}s`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
};

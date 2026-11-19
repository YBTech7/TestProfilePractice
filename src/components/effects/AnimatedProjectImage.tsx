import React, { useEffect, useRef } from 'react';
import '../../styles/project-image-motion.css';
import type { ProjectImageAnimationVariant } from '../../types';
import { AICircuitMotionOverlay } from './AICircuitMotionOverlay';
import { AnalyticsMotionOverlay } from './AnalyticsMotionOverlay';
import { NetworkMotionOverlay } from './NetworkMotionOverlay';

export type { ProjectImageAnimationVariant };

interface AnimatedProjectImageProps {
  src: string;
  alt: string;
  variant?: ProjectImageAnimationVariant;
  domain?: string;
  aspectClassName?: string;
  imgClassName?: string;
  loading?: 'lazy' | 'eager';
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  children?: React.ReactNode;
}

export function resolveProjectAnimationVariant(
  variant: ProjectImageAnimationVariant | undefined,
  src: string,
  domain?: string
): ProjectImageAnimationVariant {
  if (variant) return variant;

  const lowerSrc = src.toLowerCase();
  const lowerDomain = (domain || '').toLowerCase();

  if (lowerSrc.includes('analytics_dashboard') || lowerDomain.includes('analytics')) {
    return 'analytics';
  }
  if (lowerSrc.includes('ai_automation') || lowerDomain.includes('ai')) {
    return 'ai-circuit';
  }
  if (
    lowerSrc.includes('blockchain_network') ||
    lowerDomain.includes('technical support') ||
    lowerDomain.includes('network')
  ) {
    return 'network';
  }
  return 'ambient';
}

const AmbientMotionOverlay: React.FC = () => (
  <div aria-hidden="true" className="project-motion-overlay">
    <div className="motion-shimmer-band" />
    <span
      className="motion-micro-dot"
      style={
        {
          top: '36%',
          left: '28%',
          width: '3px',
          height: '3px',
          '--dot-dx': '18px',
          '--dot-dy': '-12px',
          '--dot-duration': '10s',
          '--dot-delay': '-2s',
        } as React.CSSProperties
      }
    />
    <span
      className="motion-micro-dot"
      style={
        {
          top: '58%',
          left: '68%',
          width: '2.5px',
          height: '2.5px',
          '--dot-dx': '-14px',
          '--dot-dy': '-10px',
          '--dot-duration': '12s',
          '--dot-delay': '-6s',
        } as React.CSSProperties
      }
    />
  </div>
);

export const AnimatedProjectImage: React.FC<AnimatedProjectImageProps> = ({
  src,
  alt,
  variant,
  domain,
  aspectClassName = 'aspect-[4/3]',
  imgClassName = '',
  loading = 'lazy',
  referrerPolicy = 'no-referrer',
  children,
}) => {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const resolvedVariant = resolveProjectAnimationVariant(variant, src, domain);

  useEffect(() => {
    const node = frameRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          node.classList.toggle('is-offscreen', !entry.isIntersecting);
        }
      },
      { rootMargin: '120px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={frameRef}
      data-project-motion={resolvedVariant}
      className={`project-motion-frame w-full bg-[#06141E] ${aspectClassName}`.trim()}
    >
      {/* Layer 1: Original Project Image with subtle depth drift */}
      <div className="project-motion-media">
        <img
          src={src}
          alt={alt}
          referrerPolicy={referrerPolicy}
          loading={loading}
          className={`project-motion-img ${imgClassName}`.trim()}
        />
      </div>

      {/* Layer 2: Animated Golden Light Overlays */}
      {resolvedVariant === 'analytics' && <AnalyticsMotionOverlay />}
      {resolvedVariant === 'ai-circuit' && <AICircuitMotionOverlay />}
      {resolvedVariant === 'network' && <NetworkMotionOverlay />}
      {resolvedVariant === 'ambient' && <AmbientMotionOverlay />}

      {/* Layers 3–5: Gradient shading, metric overlays, and controls */}
      {children}
    </div>
  );
};

import React from 'react';
import type { PortraitInteractionState } from '../../types';

interface PortraitDragMotionProps {
  stageRef: React.RefObject<HTMLDivElement | null>;
  interactionState: PortraitInteractionState;
  ariaLabel: string;
  handlers: {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerCancel: (e: React.PointerEvent<HTMLElement>) => void;
  };
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
}

export const PortraitDragMotion: React.FC<PortraitDragMotionProps> = ({
  stageRef,
  interactionState,
  ariaLabel,
  handlers,
  onPointerEnter,
  onPointerLeave,
  onClick,
  onKeyDown,
  children,
}) => {
  return (
    <div className="interactive-portrait-perspective">
      <div
        ref={stageRef}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        data-state={interactionState}
        onPointerDown={handlers.onPointerDown}
        onPointerMove={handlers.onPointerMove}
        onPointerUp={handlers.onPointerUp}
        onPointerCancel={handlers.onPointerCancel}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onClick={onClick}
        onKeyDown={onKeyDown}
        onDragStart={(e) => e.preventDefault()}
        className="interactive-portrait profile-photo-frame interactive-portrait-stage"
      >
        {/* Layer 1 & 2: Dark Teal Surface & Soft Golden Ambient Light */}
        <div aria-hidden="true" className="portrait-ambient-gold-layer" />

        {/* Layer 3: Portrait Subject & Progressive Enhancement Layers */}
        <div className="portrait-subject-layer">{children}</div>

        {/* Layer 4 & 5: Original Vignette Shading & Gold Rim Highlight */}
        <div className="profile-photo-vignette" aria-hidden="true" />
        <div className="portrait-rim-glow" aria-hidden="true" />
      </div>
    </div>
  );
};

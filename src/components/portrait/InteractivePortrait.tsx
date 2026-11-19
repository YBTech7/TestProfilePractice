import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePointerTracking, type GazeVector } from '../../hooks/usePointerTracking';
import { usePortraitDrag, type DragTransform } from '../../hooks/usePortraitDrag';
import '../../styles/interactive-portrait.css';
import type {
  PortraitExpressionFrames,
  PortraitExpressionState,
  PortraitEyeRigAssets,
  PortraitInteractionState,
} from '../../types';
import { PortraitDragMotion } from './PortraitDragMotion';
import { PortraitExpressions } from './PortraitExpressions';
import { PortraitEyeTracking } from './PortraitEyeTracking';

export interface InteractivePortraitProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  enableEyeTracking?: boolean;
  enableExpressions?: boolean;
  enableDragMotion?: boolean;
  rigAssets?: PortraitEyeRigAssets;
  expressionFrames?: PortraitExpressionFrames;
  onError?: () => void;
}

const EXPRESSION_SEQUENCE: PortraitExpressionState[] = [
  'smile',
  'eyebrow-raise',
  'playful-reaction',
  'neutral',
];

const EXPRESSION_LABELS: Record<PortraitExpressionState, string> = {
  neutral: 'Neutral portrait',
  smile: 'Friendly greeting state',
  'eyebrow-raise': 'Attentive eyebrow-raise state',
  'playful-reaction': 'Friendly playful reaction state',
};

const EXPRESSION_POSE: Record<
  PortraitExpressionState,
  { rx: number; ry: number; rz: number; scale: number }
> = {
  neutral: { rx: 0, ry: 0, rz: 0, scale: 1 },
  smile: { rx: 0.8, ry: 0, rz: 0, scale: 1.012 },
  'eyebrow-raise': { rx: 2.2, ry: 0, rz: 0, scale: 1.015 },
  'playful-reaction': { rx: 1.0, ry: 2.6, rz: 1.4, scale: 1.015 },
};

const EXPRESSION_DWELL_MS = 1750;

export const InteractivePortrait: React.FC<InteractivePortraitProps> = ({
  src,
  alt = 'Portrait of Pio Languisan',
  width = 1199,
  height = 1312,
  className = '',
  priority = false,
  enableEyeTracking = true,
  enableExpressions = true,
  enableDragMotion = true,
  rigAssets,
  expressionFrames,
  onError,
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [gazeActive, setGazeActive] = useState(false);
  const [expression, setExpression] = useState<PortraitExpressionState>('neutral');
  const [shimmerKey, setShimmerKey] = useState(0);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const expressionIndexRef = useRef<number>(-1);
  const expressionTimerRef = useRef<number | null>(null);
  const suppressNextClickRef = useRef<boolean>(false);

  const gazeRef = useRef<GazeVector>({ x: 0, y: 0, active: false });
  const dragRef = useRef<DragTransform>({
    rotateX: 0,
    rotateY: 0,
    translateX: 0,
    translateY: 0,
    scale: 1,
  });

  const isDraggingRef = useRef(isDragging);
  isDraggingRef.current = isDragging;
  const isHoveringRef = useRef(isHovering);
  isHoveringRef.current = isHovering;
  const expressionRef = useRef(expression);
  expressionRef.current = expression;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const clearExpressionTimer = useCallback(() => {
    if (expressionTimerRef.current !== null) {
      window.clearTimeout(expressionTimerRef.current);
      expressionTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearExpressionTimer, [clearExpressionTimer]);

  const applyStageVisuals = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;

    if (reducedMotion) {
      el.style.removeProperty('--portrait-tx');
      el.style.removeProperty('--portrait-ty');
      el.style.removeProperty('--portrait-rx');
      el.style.removeProperty('--portrait-ry');
      el.style.removeProperty('--portrait-rz');
      el.style.removeProperty('--portrait-scale');
      el.style.removeProperty('--portrait-light-x');
      el.style.removeProperty('--portrait-light-y');
      el.style.removeProperty('--gaze-iris-x');
      el.style.removeProperty('--gaze-iris-y');
      el.style.boxShadow = '';
      return;
    }

    const drag = dragRef.current;
    const gaze = gazeRef.current;
    const currExpr = expressionRef.current;

    if (isDraggingRef.current) {
      el.style.setProperty('--portrait-tx', `${drag.translateX.toFixed(2)}px`);
      el.style.setProperty('--portrait-ty', `${drag.translateY.toFixed(2)}px`);
      el.style.setProperty('--portrait-rx', `${drag.rotateX.toFixed(2)}deg`);
      el.style.setProperty('--portrait-ry', `${drag.rotateY.toFixed(2)}deg`);
      el.style.setProperty('--portrait-rz', '0deg');
      el.style.setProperty('--portrait-scale', `${drag.scale}`);
      el.style.setProperty('--portrait-light-x', `${(50 + drag.rotateY * 3.5).toFixed(1)}%`);
      el.style.setProperty('--portrait-light-y', `${(28 - drag.rotateX * 3.5).toFixed(1)}%`);
      el.style.boxShadow = `${(-drag.rotateY * 1.4).toFixed(1)}px ${(24 + drag.rotateX * 1.6).toFixed(1)}px 56px -14px rgba(2, 10, 16, 0.85), 0 0 28px rgba(200, 162, 83, 0.16)`;
      return;
    }

    if (currExpr !== 'neutral') {
      const pose = EXPRESSION_POSE[currExpr];
      el.style.setProperty('--portrait-tx', '0px');
      el.style.setProperty('--portrait-ty', '-2px');
      el.style.setProperty('--portrait-rx', `${pose.rx}deg`);
      el.style.setProperty('--portrait-ry', `${pose.ry}deg`);
      el.style.setProperty('--portrait-rz', `${pose.rz}deg`);
      el.style.setProperty('--portrait-scale', `${pose.scale}`);
      el.style.setProperty('--portrait-light-x', '50%');
      el.style.setProperty('--portrait-light-y', '22%');
      el.style.boxShadow =
        '0 28px 54px -14px rgba(2, 10, 16, 0.82), 0 0 26px rgba(223, 197, 133, 0.14)';
      return;
    }

    if (enableEyeTracking && gaze.active) {
      const rx = -gaze.y * 1.8;
      const ry = gaze.x * 2.4;
      const scale = isHoveringRef.current ? 1.008 : 1;

      el.style.setProperty('--portrait-tx', '0px');
      el.style.setProperty('--portrait-ty', '0px');
      el.style.setProperty('--portrait-rx', `${rx.toFixed(2)}deg`);
      el.style.setProperty('--portrait-ry', `${ry.toFixed(2)}deg`);
      el.style.setProperty('--portrait-rz', '0deg');
      el.style.setProperty('--portrait-scale', `${scale}`);
      el.style.setProperty('--portrait-light-x', `${(50 + gaze.x * 24).toFixed(1)}%`);
      el.style.setProperty('--portrait-light-y', `${(24 + gaze.y * 20).toFixed(1)}%`);
      el.style.setProperty('--gaze-iris-x', `${(gaze.x * 3).toFixed(2)}px`);
      el.style.setProperty('--gaze-iris-y', `${(gaze.y * 2).toFixed(2)}px`);
      el.style.boxShadow = isHoveringRef.current
        ? `${(-ry * 1.1).toFixed(1)}px ${(24 - rx * 1.1).toFixed(1)}px 52px -14px rgba(2, 10, 16, 0.78), 0 0 22px rgba(200, 162, 83, 0.1)`
        : '';
      return;
    }

    el.style.setProperty('--portrait-tx', '0px');
    el.style.setProperty('--portrait-ty', '0px');
    el.style.setProperty('--portrait-rx', '0deg');
    el.style.setProperty('--portrait-ry', '0deg');
    el.style.setProperty('--portrait-rz', '0deg');
    el.style.setProperty('--portrait-scale', '1');
    el.style.setProperty('--portrait-light-x', '50%');
    el.style.setProperty('--portrait-light-y', '24%');
    el.style.setProperty('--gaze-iris-x', '0px');
    el.style.setProperty('--gaze-iris-y', '0px');
    el.style.boxShadow = '';
  }, [enableEyeTracking, reducedMotion]);

  useEffect(() => {
    applyStageVisuals();
  }, [applyStageVisuals, isDragging, isHovering, expression, reducedMotion]);

  usePointerTracking({
    enabled: enableEyeTracking && !isDragging,
    reducedMotion,
    targetRef: stageRef,
    eyeAnchor: { x: 0.5, y: 0.22 },
    onUpdate: (gaze) => {
      gazeRef.current = gaze;
      applyStageVisuals();
    },
    onActiveChange: (active) => {
      setGazeActive(active);
    },
  });

  const { handlers: dragHandlers } = usePortraitDrag({
    enabled: enableDragMotion,
    reducedMotion,
    stageRef,
    onDragTransform: (nextTransform) => {
      dragRef.current = nextTransform;
      applyStageVisuals();
    },
    onDragStart: () => {
      suppressNextClickRef.current = true;
      setIsReturning(false);
      setIsDragging(true);
    },
    onDragEnd: (wasDrag) => {
      setIsDragging(false);
      if (wasDrag) {
        setIsReturning(true);
        window.setTimeout(() => {
          suppressNextClickRef.current = false;
        }, 0);
      } else {
        suppressNextClickRef.current = false;
      }
    },
    onReturnComplete: () => {
      setIsReturning(false);
      applyStageVisuals();
    },
  });

  const triggerExpressionCycle = useCallback(() => {
    if (!enableExpressions) return;

    clearExpressionTimer();
    const nextIdx = (expressionIndexRef.current + 1) % EXPRESSION_SEQUENCE.length;
    expressionIndexRef.current = nextIdx;
    const nextState = EXPRESSION_SEQUENCE[nextIdx];

    setExpression(nextState);
    setLiveAnnouncement(EXPRESSION_LABELS[nextState]);

    if (nextState !== 'neutral' && !reducedMotion) {
      setShimmerKey((k) => k + 1);
      expressionTimerRef.current = window.setTimeout(() => {
        setExpression('neutral');
        expressionTimerRef.current = null;
      }, EXPRESSION_DWELL_MS);
    }
  }, [clearExpressionTimer, enableExpressions, reducedMotion]);

  const handleStageClick = useCallback(() => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }
    triggerExpressionCycle();
  }, [triggerExpressionCycle]);

  const handleStageKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerExpressionCycle();
      }
    },
    [triggerExpressionCycle]
  );

  const interactionState: PortraitInteractionState = useMemo(() => {
    if (reducedMotion) return 'REDUCED_MOTION';
    if (isDragging) return 'DRAGGING';
    if (isReturning) return 'RETURNING';
    if (expression !== 'neutral') return 'EXPRESSING';
    if (enableEyeTracking && gazeActive) return 'TRACKING_GAZE';
    if (isHovering) return 'HOVERING';
    return 'IDLE';
  }, [
    reducedMotion,
    isDragging,
    isReturning,
    expression,
    enableEyeTracking,
    gazeActive,
    isHovering,
  ]);

  const ariaLabel = reducedMotion
    ? 'Portrait of Pio Languisan. Press Enter or Space to cycle greeting states.'
    : 'Interactive portrait of Pio Languisan. Click or press Enter to cycle greeting states, or drag to tilt in 3D.';

  return (
    <div className="profile-photo-container">
      <PortraitDragMotion
        stageRef={stageRef}
        interactionState={interactionState}
        ariaLabel={ariaLabel}
        handlers={dragHandlers}
        onPointerEnter={() => setIsHovering(true)}
        onPointerLeave={() => setIsHovering(false)}
        onClick={handleStageClick}
        onKeyDown={handleStageKeyDown}
      >
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`profile-photo ${className}`.trim()}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          referrerPolicy="no-referrer"
          draggable={false}
          onError={onError}
        />

        {enableEyeTracking && (
          <PortraitEyeTracking
            rigAssets={rigAssets}
            reducedMotion={reducedMotion}
            isExpressing={expression !== 'neutral'}
          />
        )}

        {enableExpressions && (
          <PortraitExpressions
            expression={expression}
            shimmerKey={shimmerKey}
            expressionFrames={expressionFrames}
            alt={alt}
            reducedMotion={reducedMotion}
          />
        )}
      </PortraitDragMotion>

      <span className="sr-only" aria-live="polite">
        {liveAnnouncement}
      </span>
    </div>
  );
};

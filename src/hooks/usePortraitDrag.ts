import { useCallback, useEffect, useRef } from 'react';

export interface DragTransform {
  rotateX: number;
  rotateY: number;
  translateX: number;
  translateY: number;
  scale: number;
}

interface UsePortraitDragOptions {
  enabled: boolean;
  reducedMotion: boolean;
  stageRef: React.RefObject<HTMLElement | null>;
  onDragTransform: (transform: DragTransform) => void;
  onDragStart?: () => void;
  onDragEnd?: (wasDrag: boolean) => void;
  onReturnComplete?: () => void;
}

const MAX_ROTATE_X = 6; // degrees
const MAX_ROTATE_Y = 8; // degrees
const MAX_TRANSLATE = 12; // pixels
const MAX_SCALE = 1.02;
const DRAG_THRESHOLD_PX = 6;
const RETURN_DURATION_MS = 540;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function usePortraitDrag({
  enabled,
  reducedMotion,
  stageRef,
  onDragTransform,
  onDragStart,
  onDragEnd,
  onReturnComplete,
}: UsePortraitDragOptions) {
  const activePointerIdRef = useRef<number | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const didExceedThresholdRef = useRef<boolean>(false);
  const returnTimerRef = useRef<number | null>(null);

  const onDragTransformRef = useRef(onDragTransform);
  onDragTransformRef.current = onDragTransform;
  const onDragStartRef = useRef(onDragStart);
  onDragStartRef.current = onDragStart;
  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;
  const onReturnCompleteRef = useRef(onReturnComplete);
  onReturnCompleteRef.current = onReturnComplete;

  const clearReturnTimer = useCallback(() => {
    if (returnTimerRef.current !== null) {
      window.clearTimeout(returnTimerRef.current);
      returnTimerRef.current = null;
    }
  }, []);

  const resetToRest = useCallback(
    (notifyDragEnd: boolean) => {
      const wasDrag = didExceedThresholdRef.current;
      activePointerIdRef.current = null;
      startPointRef.current = null;
      didExceedThresholdRef.current = false;

      onDragTransformRef.current({
        rotateX: 0,
        rotateY: 0,
        translateX: 0,
        translateY: 0,
        scale: 1,
      });

      if (notifyDragEnd) {
        onDragEndRef.current?.(wasDrag);
      }

      if (wasDrag) {
        clearReturnTimer();
        returnTimerRef.current = window.setTimeout(() => {
          returnTimerRef.current = null;
          onReturnCompleteRef.current?.();
        }, RETURN_DURATION_MS);
      }
    },
    [clearReturnTimer]
  );

  useEffect(() => {
    const handleWindowBlur = () => {
      if (activePointerIdRef.current !== null) {
        resetToRest(true);
      }
    };
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      clearReturnTimer();
    };
  }, [clearReturnTimer, resetToRest]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!enabled || e.button > 0) return;

      clearReturnTimer();
      activePointerIdRef.current = e.pointerId;
      startPointRef.current = { x: e.clientX, y: e.clientY };
      didExceedThresholdRef.current = false;

      if (e.pointerType === 'mouse' && stageRef.current?.setPointerCapture) {
        try {
          stageRef.current.setPointerCapture(e.pointerId);
        } catch {
          // Safe fallback if element rejects capture
        }
      }
    },
    [enabled, clearReturnTimer, stageRef]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!enabled || reducedMotion) return;
      if (activePointerIdRef.current !== e.pointerId || !startPointRef.current) return;

      const dx = e.clientX - startPointRef.current.x;
      const dy = e.clientY - startPointRef.current.y;
      const distance = Math.hypot(dx, dy);

      if (!didExceedThresholdRef.current) {
        if (distance < DRAG_THRESHOLD_PX) return;
        didExceedThresholdRef.current = true;
        onDragStartRef.current?.();

        if (e.pointerType !== 'mouse' && stageRef.current?.setPointerCapture) {
          try {
            stageRef.current.setPointerCapture(e.pointerId);
          } catch {
            // Ignore capture errors on touch devices
          }
        }
      }

      const rect = stageRef.current?.getBoundingClientRect();
      const spanX = Math.max((rect?.width ?? 360) * 0.48, 120);
      const spanY = Math.max((rect?.height ?? 400) * 0.48, 120);

      const normX = clamp(dx / spanX, -1, 1);
      const normY = clamp(dy / spanY, -1, 1);

      onDragTransformRef.current({
        // Dragging down tilts top away / bottom forward cleanly toward drag direction
        rotateX: -normY * MAX_ROTATE_X,
        rotateY: normX * MAX_ROTATE_Y,
        translateX: normX * MAX_TRANSLATE,
        translateY: normY * MAX_TRANSLATE,
        scale: MAX_SCALE,
      });
    },
    [enabled, reducedMotion, stageRef]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (activePointerIdRef.current !== e.pointerId) return;

      if (stageRef.current?.hasPointerCapture?.(e.pointerId)) {
        try {
          stageRef.current.releasePointerCapture(e.pointerId);
        } catch {
          // Ignore release failure
        }
      }
      resetToRest(true);
    },
    [resetToRest, stageRef]
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (activePointerIdRef.current !== e.pointerId) return;
      resetToRest(true);
    },
    [resetToRest]
  );

  return {
    didExceedThresholdRef,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    },
  };
}

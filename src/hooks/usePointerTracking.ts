import { useCallback, useEffect, useRef } from 'react';

export interface GazeVector {
  /** Normalized horizontal offset relative to eye anchor (-1 left to +1 right) */
  x: number;
  /** Normalized vertical offset relative to eye anchor (-1 up to +1 down) */
  y: number;
  /** Whether the fine pointer is actively tracked */
  active: boolean;
}

interface UsePointerTrackingOptions {
  enabled: boolean;
  reducedMotion: boolean;
  targetRef: React.RefObject<HTMLElement | null>;
  /** Normalized facial eye-line center within portrait box */
  eyeAnchor?: { x: number; y: number };
  onUpdate: (gaze: GazeVector) => void;
  onActiveChange?: (isActive: boolean) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function usePointerTracking({
  enabled,
  reducedMotion,
  targetRef,
  eyeAnchor = { x: 0.5, y: 0.22 },
  onUpdate,
  onActiveChange,
}: UsePointerTrackingOptions) {
  const goalRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const currentRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const activeStateRef = useRef<boolean>(false);

  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const onActiveChangeRef = useRef(onActiveChange);
  onActiveChangeRef.current = onActiveChange;

  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const goal = goalRef.current;
    const curr = currentRef.current;
    const damping = goal.active ? 0.18 : 0.14;

    const dx = goal.x - curr.x;
    const dy = goal.y - curr.y;

    curr.x += dx * damping;
    curr.y += dy * damping;

    const settled = Math.abs(dx) < 0.002 && Math.abs(dy) < 0.002;
    if (settled) {
      curr.x = goal.x;
      curr.y = goal.y;
    }

    onUpdateRef.current({
      x: curr.x,
      y: curr.y,
      active: goal.active || !settled,
    });

    if (settled && !goal.active) {
      rafRef.current = null;
      return;
    }

    if (!settled) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      rafRef.current = null;
    }
  }, []);

  const scheduleTick = useCallback(() => {
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  const resetGaze = useCallback(() => {
    goalRef.current = { x: 0, y: 0, active: false };
    if (activeStateRef.current) {
      activeStateRef.current = false;
      onActiveChangeRef.current?.(false);
    }
    scheduleTick();
  }, [scheduleTick]);

  useEffect(() => {
    if (!enabled || reducedMotion || typeof window === 'undefined') {
      stopRaf();
      currentRef.current = { x: 0, y: 0 };
      goalRef.current = { x: 0, y: 0, active: false };
      onUpdateRef.current({ x: 0, y: 0, active: false });
      return;
    }

    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!isFinePointer) {
      return;
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') {
        return;
      }
      const el = targetRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const anchorX = rect.left + rect.width * eyeAnchor.x;
      const anchorY = rect.top + rect.height * eyeAnchor.y;

      const normSpanX = Math.max(rect.width * 0.95, 280);
      const normSpanY = Math.max(rect.height * 0.95, 280);

      const rawX = (e.clientX - anchorX) / normSpanX;
      const rawY = (e.clientY - anchorY) / normSpanY;
      const radialDist = Math.hypot(rawX, rawY);

      // Smoothly attenuate back toward natural resting gaze when cursor moves far away
      const falloff =
        radialDist <= 1.25
          ? 1
          : Math.max(0, 1 - (radialDist - 1.25) / 1.5);

      const attenuatedX = clamp(rawX, -1, 1) * falloff;
      const attenuatedY = clamp(rawY, -1, 1) * falloff;
      const isEngaged = falloff > 0.04;

      goalRef.current = {
        x: attenuatedX,
        y: attenuatedY,
        active: isEngaged,
      };

      if (activeStateRef.current !== isEngaged) {
        activeStateRef.current = isEngaged;
        onActiveChangeRef.current?.(isEngaged);
      }
      scheduleTick();
    };

    const handleMouseLeaveDocument = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        resetGaze();
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('mouseout', handleMouseLeaveDocument, { passive: true });
    window.addEventListener('blur', resetGaze);

    return () => {
      stopRaf();
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseout', handleMouseLeaveDocument);
      window.removeEventListener('blur', resetGaze);
    };
  }, [enabled, reducedMotion, targetRef, eyeAnchor.x, eyeAnchor.y, resetGaze, scheduleTick, stopRaf]);

  return { resetGaze };
}

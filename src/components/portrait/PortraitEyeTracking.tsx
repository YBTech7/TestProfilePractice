import React, { useEffect, useState } from 'react';
import type { PortraitEyeRigAssets } from '../../types';

interface PortraitEyeTrackingProps {
  rigAssets?: PortraitEyeRigAssets;
  reducedMotion: boolean;
  isExpressing: boolean;
}

/**
 * Progressive-enhancement eye tracking layer.
 * - When segmented `rigAssets` (left/right iris + eyelid mask) are supplied,
 *   renders socket-clamped iris displacement and natural irregular blinking.
 * - When operating on the single static photograph without separated eye layers,
 *   renders only the studio directional specular key-light layer without distorting facial pixels.
 */
export const PortraitEyeTracking: React.FC<PortraitEyeTrackingProps> = ({
  rigAssets,
  reducedMotion,
  isExpressing,
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const hasRiggedEyes = Boolean(rigAssets?.leftIrisUrl && rigAssets?.rightIrisUrl);

  useEffect(() => {
    if (!hasRiggedEyes || !rigAssets?.upperEyelidMaskUrl || reducedMotion || isExpressing) {
      setIsBlinking(false);
      return;
    }

    let blinkTimer: number | null = null;
    let openTimer: number | null = null;
    let cancelled = false;

    const scheduleBlink = (delayMs: number) => {
      blinkTimer = window.setTimeout(() => {
        if (cancelled) return;
        setIsBlinking(true);
        openTimer = window.setTimeout(() => {
          if (cancelled) return;
          setIsBlinking(false);
          // Irregular natural blink interval (3.4s - 6.2s)
          const nextDelay = 3400 + ((Date.now() % 7) * 400);
          scheduleBlink(nextDelay);
        }, 130);
      }, delayMs);
    };

    scheduleBlink(3800);

    return () => {
      cancelled = true;
      if (blinkTimer !== null) window.clearTimeout(blinkTimer);
      if (openTimer !== null) window.clearTimeout(openTimer);
    };
  }, [hasRiggedEyes, rigAssets?.upperEyelidMaskUrl, reducedMotion, isExpressing]);

  return (
    <>
      {hasRiggedEyes && (
        <div aria-hidden="true" className="portrait-eye-rig-layer">
          <div
            className="portrait-eye-socket"
            style={{ left: '40.5%', top: '19.5%', width: '6.2%', height: '3.2%' }}
          >
            <img
              src={rigAssets?.leftIrisUrl}
              alt=""
              className="portrait-eye-iris"
              style={{
                transform:
                  'translate3d(var(--gaze-iris-x, 0px), var(--gaze-iris-y, 0px), 0)',
              }}
            />
            {rigAssets?.upperEyelidMaskUrl && (
              <img
                src={rigAssets.upperEyelidMaskUrl}
                alt=""
                className="portrait-eyelid-blink"
                data-blinking={isBlinking ? 'true' : 'false'}
              />
            )}
          </div>
          <div
            className="portrait-eye-socket"
            style={{ left: '51.8%', top: '19.1%', width: '6.2%', height: '3.2%' }}
          >
            <img
              src={rigAssets?.rightIrisUrl}
              alt=""
              className="portrait-eye-iris"
              style={{
                transform:
                  'translate3d(var(--gaze-iris-x, 0px), var(--gaze-iris-y, 0px), 0)',
              }}
            />
            {rigAssets?.upperEyelidMaskUrl && (
              <img
                src={rigAssets.upperEyelidMaskUrl}
                alt=""
                className="portrait-eyelid-blink"
                data-blinking={isBlinking ? 'true' : 'false'}
              />
            )}
          </div>
        </div>
      )}

      {/* Subtle directional studio reflection tracking cursor position */}
      <div aria-hidden="true" className="portrait-specular-layer" />
    </>
  );
};

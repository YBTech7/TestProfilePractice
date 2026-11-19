import React from 'react';
import type {
  PortraitExpressionFrames,
  PortraitExpressionState,
} from '../../types';

interface PortraitExpressionsProps {
  expression: PortraitExpressionState;
  shimmerKey: number;
  expressionFrames?: PortraitExpressionFrames;
  alt: string;
  reducedMotion: boolean;
}

const FRAME_STATES: PortraitExpressionState[] = [
  'smile',
  'eyebrow-raise',
  'playful-reaction',
];

export const PortraitExpressions: React.FC<PortraitExpressionsProps> = ({
  expression,
  shimmerKey,
  expressionFrames,
  alt,
  reducedMotion,
}) => {
  return (
    <>
      {expressionFrames &&
        FRAME_STATES.map((stateKey) => {
          const frameSrc = expressionFrames[stateKey];
          if (!frameSrc) return null;
          return (
            <img
              key={stateKey}
              src={frameSrc}
              alt=""
              aria-hidden="true"
              data-active={expression === stateKey && !reducedMotion ? 'true' : 'false'}
              className="portrait-expression-frame-overlay"
              draggable={false}
            />
          );
        })}

      {shimmerKey > 0 && !reducedMotion && (
        <div
          key={shimmerKey}
          aria-hidden="true"
          data-triggered="true"
          data-expression-alt={alt}
          className="portrait-click-shimmer"
        />
      )}
    </>
  );
};

import React from 'react';

const MICRO_PARTICLES = [
  { id: 'ai-mp-1', top: '46%', left: '42%', size: 3, dx: '18px', dy: '-10px', dur: '9s', delay: '-1s' },
  { id: 'ai-mp-2', top: '54%', left: '54%', size: 2.5, dx: '-16px', dy: '-10px', dur: '11s', delay: '-4s' },
  { id: 'ai-mp-3', top: '38%', left: '56%', size: 2.5, dx: '14px', dy: '10px', dur: '12s', delay: '-7s', desktopOnly: true },
  { id: 'ai-mp-4', top: '62%', left: '34%', size: 2, dx: '14px', dy: '-8px', dur: '10s', delay: '-3s', desktopOnly: true },
];

export const AICircuitMotionOverlay: React.FC = () => {
  return (
    <div aria-hidden="true" className="project-motion-overlay">
      {/* Central processor core breathing glow */}
      <div
        className="motion-ambient-glow"
        style={
          {
            top: '39%',
            left: '36%',
            width: '28%',
            height: '36%',
            '--glow-duration': '8s',
            '--glow-delay': '-1.5s',
          } as React.CSSProperties
        }
      />

      {/* Exact isometric circuit traces mapped to ai_automation_workflow_1794901228479.jpg (4:3) */}
      <svg
        className="project-motion-svg"
        viewBox="0 0 1000 750"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Center -> Upper-left gold processor -> outer cluster */}
        <path
          d="M 500 428 L 402 372 L 320 326 L 266 296"
          className="motion-data-path"
          pathLength={162}
          style={{ '--flow-duration': '9.5s', '--flow-delay': '-1s' } as React.CSSProperties}
        />

        {/* Center -> Lower-right gold processor -> outer cluster */}
        <path
          d="M 500 428 L 596 484 L 680 532 L 774 585"
          className="motion-data-path"
          pathLength={162}
          style={{ '--flow-duration': '11s', '--flow-delay': '-4.5s' } as React.CSSProperties}
        />

        {/* Center -> Upper-right hub -> top-right cluster */}
        <path
          d="M 500 428 L 596 372 L 675 325 L 748 282"
          className="motion-data-path motion-data-path--subtle"
          pathLength={162}
          style={{ '--flow-duration': '12.5s', '--flow-delay': '-2.5s' } as React.CSSProperties}
        />

        {/* Center -> Lower-left hub -> bottom-left cluster */}
        <path
          d="M 500 428 L 402 484 L 326 528 L 238 578"
          className="motion-data-path motion-data-path--subtle"
          pathLength={162}
          style={{ '--flow-duration': '13.5s', '--flow-delay': '-7s' } as React.CSSProperties}
        />

        {/* Perimeter circuit links */}
        <path
          d="M 162 435 L 254 318 L 368 206 L 478 135"
          className="motion-data-path motion-data-path--subtle project-motion-desktop-detail"
          pathLength={162}
          style={{ '--flow-duration': '14s', '--flow-delay': '-5s' } as React.CSSProperties}
        />
        <path
          d="M 478 135 L 615 178 L 762 284 L 892 405"
          className="motion-data-path motion-data-path--subtle project-motion-desktop-detail"
          pathLength={162}
          style={{ '--flow-duration': '15s', '--flow-delay': '-9s' } as React.CSSProperties}
        />

        {/* Alternating intelligent node pulses */}
        <g>
          <circle
            cx="500"
            cy="428"
            r="14"
            className="motion-node-halo"
            style={{ '--pulse-duration': '6.5s', '--pulse-delay': '0s' } as React.CSSProperties}
          />
          <circle
            cx="500"
            cy="428"
            r="4.5"
            className="motion-node-core"
            style={{ '--pulse-duration': '6.5s', '--pulse-delay': '0s' } as React.CSSProperties}
          />

          <circle
            cx="402"
            cy="372"
            r="11"
            className="motion-node-halo"
            style={{ '--pulse-duration': '7.5s', '--pulse-delay': '-2.5s' } as React.CSSProperties}
          />
          <circle
            cx="402"
            cy="372"
            r="3.5"
            className="motion-node-core"
            style={{ '--pulse-duration': '7.5s', '--pulse-delay': '-2.5s' } as React.CSSProperties}
          />

          <circle
            cx="596"
            cy="484"
            r="11"
            className="motion-node-halo"
            style={{ '--pulse-duration': '8s', '--pulse-delay': '-5s' } as React.CSSProperties}
          />
          <circle
            cx="596"
            cy="484"
            r="3.5"
            className="motion-node-core"
            style={{ '--pulse-duration': '8s', '--pulse-delay': '-5s' } as React.CSSProperties}
          />

          <circle
            cx="596"
            cy="372"
            r="9"
            className="motion-node-halo project-motion-desktop-detail"
            style={{ '--pulse-duration': '7s', '--pulse-delay': '-1.5s' } as React.CSSProperties}
          />
          <circle
            cx="402"
            cy="484"
            r="9"
            className="motion-node-halo project-motion-desktop-detail"
            style={{ '--pulse-duration': '8.5s', '--pulse-delay': '-4s' } as React.CSSProperties}
          />
        </g>
      </svg>

      {/* Subtle micro-particle transmission */}
      {MICRO_PARTICLES.map((p) => (
        <span
          key={p.id}
          className={`motion-micro-dot ${p.desktopOnly ? 'project-motion-desktop-detail' : ''}`.trim()}
          style={
            {
              top: p.top,
              left: p.left,
              width: `${p.size}px`,
              height: `${p.size}px`,
              '--dot-dx': p.dx,
              '--dot-dy': p.dy,
              '--dot-duration': p.dur,
              '--dot-delay': p.delay,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};

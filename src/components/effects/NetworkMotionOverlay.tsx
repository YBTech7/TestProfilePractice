import React from 'react';

export const NetworkMotionOverlay: React.FC = () => {
  return (
    <div aria-hidden="true" className="project-motion-overlay">
      {/* Subtle ambient infrastructure depth glow */}
      <div
        className="motion-ambient-glow"
        style={
          {
            top: '28%',
            left: '34%',
            width: '36%',
            height: '44%',
            '--glow-duration': '10s',
            '--glow-delay': '-3s',
          } as React.CSSProperties
        }
      />

      {/* Exact isometric cube-grid corridors mapped to blockchain_network_visual_1794901227232.jpg (16:9) */}
      <svg
        className="project-motion-svg"
        viewBox="0 0 1000 562"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* NE-SW primary network corridors */}
        <path
          d="M 140 486 L 265 415 L 400 338 L 500 280 L 640 200 L 785 118 L 915 44"
          className="motion-data-path"
          pathLength={162}
          style={{ '--flow-duration': '11.5s', '--flow-delay': '-2s' } as React.CSSProperties}
        />
        <path
          d="M 255 538 L 395 458 L 535 378 L 675 298 L 815 218 L 960 135"
          className="motion-data-path motion-data-path--subtle"
          pathLength={162}
          style={{ '--flow-duration': '14s', '--flow-delay': '-7.5s' } as React.CSSProperties}
        />
        <path
          d="M 75 405 L 220 322 L 365 240 L 505 160 L 650 78"
          className="motion-data-path motion-data-path--subtle project-motion-desktop-detail"
          pathLength={162}
          style={{ '--flow-duration': '13s', '--flow-delay': '-5s' } as React.CSSProperties}
        />

        {/* NW-SE cross-tier escalation corridors */}
        <path
          d="M 315 190 L 442 262 L 568 334 L 705 412 L 845 492"
          className="motion-data-path motion-data-path--reverse"
          pathLength={162}
          style={{ '--flow-duration': '12.5s', '--flow-delay': '-4s' } as React.CSSProperties}
        />
        <path
          d="M 195 258 L 325 332 L 455 406 L 585 480"
          className="motion-data-path motion-data-path--subtle project-motion-desktop-detail"
          pathLength={162}
          style={{ '--flow-duration': '14.5s', '--flow-delay': '-9s' } as React.CSSProperties}
        />

        {/* Selected isometric teal cube node pulses */}
        <g>
          <circle
            cx="500"
            cy="280"
            r="12"
            className="motion-node-halo"
            style={{ '--pulse-duration': '7s', '--pulse-delay': '0s' } as React.CSSProperties}
          />
          <circle
            cx="500"
            cy="280"
            r="3.8"
            className="motion-node-core"
            style={{ '--pulse-duration': '7s', '--pulse-delay': '0s' } as React.CSSProperties}
          />

          <circle
            cx="442"
            cy="262"
            r="9.5"
            className="motion-node-halo"
            style={{ '--pulse-duration': '8.5s', '--pulse-delay': '-2.5s' } as React.CSSProperties}
          />
          <circle
            cx="442"
            cy="262"
            r="3"
            className="motion-node-core"
            style={{ '--pulse-duration': '8.5s', '--pulse-delay': '-2.5s' } as React.CSSProperties}
          />

          <circle
            cx="568"
            cy="334"
            r="9.5"
            className="motion-node-halo"
            style={{ '--pulse-duration': '9s', '--pulse-delay': '-5s' } as React.CSSProperties}
          />
          <circle
            cx="568"
            cy="334"
            r="3"
            className="motion-node-core"
            style={{ '--pulse-duration': '9s', '--pulse-delay': '-5s' } as React.CSSProperties}
          />

          <circle
            cx="640"
            cy="200"
            r="9"
            className="motion-node-halo project-motion-desktop-detail"
            style={{ '--pulse-duration': '7.5s', '--pulse-delay': '-3.5s' } as React.CSSProperties}
          />
          <circle
            cx="368"
            cy="298"
            r="9"
            className="motion-node-halo project-motion-desktop-detail"
            style={{ '--pulse-duration': '10s', '--pulse-delay': '-6.5s' } as React.CSSProperties}
          />
        </g>
      </svg>
    </div>
  );
};

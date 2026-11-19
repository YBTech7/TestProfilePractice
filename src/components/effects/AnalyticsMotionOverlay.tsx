import React from 'react';

export const AnalyticsMotionOverlay: React.FC = () => {
  return (
    <div aria-hidden="true" className="project-motion-overlay">
      {/* Subtle golden illumination centered on the analytics dashboard chart */}
      <div
        className="motion-ambient-glow"
        style={
          {
            top: '34%',
            left: '48%',
            width: '36%',
            height: '44%',
            '--glow-duration': '8.5s',
            '--glow-delay': '-2s',
          } as React.CSSProperties
        }
      />

      {/* Monitor-only cinematic reflection sweep */}
      <div className="analytics-screen-clip project-motion-desktop-detail">
        <div className="analytics-screen-sheen" />
      </div>

      {/* Exact SVG chart curves mapped to analytics_dashboard_visual_1794901227040.jpg (4:3) */}
      <svg
        className="project-motion-svg"
        viewBox="0 0 1000 750"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Top-left KPI mini sparkline */}
        <path
          d="M 443 276 Q 466 263, 486 271 T 532 256 T 584 254"
          className="motion-data-path motion-data-path--subtle"
          pathLength={162}
          style={
            {
              '--flow-duration': '9s',
              '--flow-delay': '-3s',
            } as React.CSSProperties
          }
        />

        {/* Upper Gross Revenue curve */}
        <path
          d="M 442 582 C 478 510, 502 472, 526 474 C 550 476, 558 498, 576 495 C 618 486, 654 396, 687 378 C 718 366, 742 388, 772 365 C 798 345, 815 326, 831 310"
          className="motion-data-path"
          pathLength={162}
          style={
            {
              '--flow-duration': '10.5s',
              '--flow-delay': '-1s',
            } as React.CSSProperties
          }
        />

        {/* Lower Operating Income curve */}
        <path
          d="M 442 582 C 475 542, 504 525, 526 526 C 550 528, 558 548, 578 544 C 618 536, 656 480, 687 472 C 718 466, 742 490, 776 478 C 802 468, 816 458, 830 452"
          className="motion-data-path motion-data-path--subtle"
          pathLength={162}
          style={
            {
              '--flow-duration': '13s',
              '--flow-delay': '-6s',
            } as React.CSSProperties
          }
        />

        {/* Illuminated 2023 & trend data nodes */}
        <g>
          <circle
            cx="687"
            cy="378"
            r="12"
            className="motion-node-halo"
            style={{ '--pulse-duration': '6s', '--pulse-delay': '0s' } as React.CSSProperties}
          />
          <circle
            cx="687"
            cy="378"
            r="4.2"
            className="motion-node-core"
            style={{ '--pulse-duration': '6s', '--pulse-delay': '0s' } as React.CSSProperties}
          />

          <circle
            cx="687"
            cy="472"
            r="11"
            className="motion-node-halo"
            style={{ '--pulse-duration': '7.5s', '--pulse-delay': '-3s' } as React.CSSProperties}
          />
          <circle
            cx="687"
            cy="472"
            r="4"
            className="motion-node-core"
            style={{ '--pulse-duration': '7.5s', '--pulse-delay': '-3s' } as React.CSSProperties}
          />

          <circle
            cx="831"
            cy="310"
            r="9"
            className="motion-node-halo project-motion-desktop-detail"
            style={{ '--pulse-duration': '8s', '--pulse-delay': '-4.5s' } as React.CSSProperties}
          />
          <circle
            cx="831"
            cy="310"
            r="3"
            className="motion-node-core project-motion-desktop-detail"
            style={{ '--pulse-duration': '8s', '--pulse-delay': '-4.5s' } as React.CSSProperties}
          />
        </g>
      </svg>
    </div>
  );
};

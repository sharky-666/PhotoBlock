import React from 'react';

interface ShutterLogoProps {
  className?: string;
  size?: number;
}

const ShutterLogo: React.FC<ShutterLogoProps> = ({ className, size = 32 }) => {
  const cx = 32;
  const cy = 32;
  const outerR = 26;
  const innerR = 6;
  const bladeCount = 5;
  const gapWidth = 2;

  const gaps = Array.from({ length: bladeCount }, (_, i) => {
    const startAngle = (i * 360) / bladeCount - 90;
    const startRad = (startAngle * Math.PI) / 180;
    const startX = cx + outerR * Math.cos(startRad);
    const startY = cy + outerR * Math.sin(startRad);

    const midAngle = startAngle + 50;
    const midRad = (midAngle * Math.PI) / 180;
    const midR = outerR * 0.55;
    const midX = cx + midR * Math.cos(midRad);
    const midY = cy + midR * Math.sin(midRad);

    const endAngle = startAngle + 95;
    const endRad = (endAngle * Math.PI) / 180;
    const endX = cx + innerR * Math.cos(endRad);
    const endY = cy + innerR * Math.sin(endRad);

    return { d: `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}` };
  });

  const maskId = `shutter-mask-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shutter-logo ${className || ''}`}
      aria-hidden="true"
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width="64" height="64" fill="white" />
          <circle cx={cx} cy={cy} r={innerR} fill="black" className="shutter-logo__hole" />
          {gaps.map((gap, i) => (
            <path
              key={i}
              d={gap.d}
              stroke="black"
              strokeWidth={gapWidth}
              strokeLinecap="round"
              fill="none"
            />
          ))}
        </mask>
      </defs>
      <g className="shutter-logo__rotate">
        <circle
          cx={cx}
          cy={cy}
          r={outerR}
          className="fill-current"
          mask={`url(#${maskId})`}
        />
      </g>
      <style>{`
        .shutter-logo {
          color: var(--gold);
          overflow: visible;
        }
        .shutter-logo__rotate {
          transform-origin: 32px 32px;
          transition: transform 2.5s cubic-bezier(.22,.61,.36,1);
        }
        .shutter-logo:hover .shutter-logo__rotate {
          transform: rotate(90deg);
        }
        .shutter-logo__hole {
          transition: r 0.8s cubic-bezier(.22,.61,.36,1);
        }
        .shutter-logo:hover .shutter-logo__hole {
          r: 7.5px;
        }
        @media (prefers-reduced-motion: reduce) {
          .shutter-logo__rotate,
          .shutter-logo__hole {
            transition: none;
          }
        }
      `}</style>
    </svg>
  );
};

export default ShutterLogo;

import React from 'react';

interface ShutterSpinnerProps {
  size?: number;
  className?: string;
}

const ShutterSpinner: React.FC<ShutterSpinnerProps> = ({
  size = 24,
  className = '',
}) => {
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

    return `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shutter-spinner inline-block ${className}`}
      aria-label="加载中"
      role="status"
    >
      <defs>
        <mask id="shutter-spinner-mask" maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width="64" height="64" fill="white" />
          <circle cx={cx} cy={cy} r={innerR} fill="black" />
          {gaps.map((d, i) => (
            <path
              key={i}
              d={d}
              stroke="black"
              strokeWidth={gapWidth}
              strokeLinecap="round"
              fill="none"
            />
          ))}
        </mask>
      </defs>
      <circle
        cx={cx}
        cy={cy}
        r={outerR}
        className="fill-current"
        mask="url(#shutter-spinner-mask)"
      />
    </svg>
  );
};

export default ShutterSpinner;

import React from 'react';
import { motion } from 'framer-motion';

const BLADE_COUNT = 8;

interface ShutterBladesProps {
  open: boolean;
  duration?: number;
}

const ShutterBlades: React.FC<ShutterBladesProps> = ({
  open,
  duration = 0.36,
}) => {
  const anglePerBlade = 360 / BLADE_COUNT;
  const halfAngleRad = (anglePerBlade / 2) * (Math.PI / 180);

  const pivotRadius = 260;
  const closedInnerRadius = 10;
  const bladeLength = pivotRadius - closedInnerRadius;

  const bladeOuterHalfW = Math.tan(halfAngleRad) * pivotRadius + 16;
  const bladeInnerHalfW = Math.tan(halfAngleRad) * closedInnerRadius + 2;

  const bladePoints = [
    [-bladeOuterHalfW, 0],
    [bladeOuterHalfW, 0],
    [bladeInnerHalfW, bladeLength],
    [-bladeInnerHalfW, bladeLength],
  ]
    .map(([x, y]) => `${x},${y}`)
    .join(' ');

  const openRotDeg = -anglePerBlade * 1.7;

  return (
    <svg
      viewBox="-300 -300 600 600"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sb-body" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0c0a08" />
          <stop offset="55%" stopColor="#040303" />
          <stop offset="100%" stopColor="#0d0b09" />
        </linearGradient>
        <linearGradient id="sb-seam" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsla(45, 75%, 68%, 0)" />
          <stop offset="60%" stopColor="hsla(45, 88%, 72%, 0.2)" />
          <stop offset="100%" stopColor="hsla(45, 75%, 68%, 0)" />
        </linearGradient>
      </defs>

      {Array.from({ length: BLADE_COUNT }, (_, i) => {
        const baseAngle = i * anglePerBlade;
        const rad = (baseAngle * Math.PI) / 180;
        const pivotX = Math.cos(rad) * pivotRadius;
        const pivotY = Math.sin(rad) * pivotRadius;

        return (
          <g
            key={i}
            transform={`translate(${pivotX} ${pivotY}) rotate(${baseAngle + 90})`}
          >
            <motion.polygon
              style={{ transformOrigin: '0px 0px' }}
              points={bladePoints}
              fill="url(#sb-body)"
              initial={false}
              animate={{ rotate: open ? openRotDeg : 0 }}
              transition={{
                duration,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
            <motion.line
              style={{ transformOrigin: '0px 0px' }}
              x1={-bladeOuterHalfW * 0.6}
              y1={1}
              x2={-bladeInnerHalfW * 0.3}
              y2={bladeLength - 1}
              stroke="url(#sb-seam)"
              strokeWidth={1.2}
              initial={false}
              animate={{ rotate: open ? openRotDeg : 0 }}
              transition={{
                duration,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          </g>
        );
      })}
    </svg>
  );
};

export default ShutterBlades;

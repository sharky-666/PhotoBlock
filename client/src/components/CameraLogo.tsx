import React from 'react';

interface CameraLogoProps {
  className?: string;
  size?: number;
}

const CameraLogo: React.FC<CameraLogoProps> = ({ className, size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Camera body - rounded rectangle with viewfinder */}
      <rect
        x="20"
        y="10"
        width="24"
        height="16"
        rx="4"
        className="stroke-current"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="26"
        y="14"
        width="12"
        height="8"
        rx="1.5"
        className="fill-current/5"
      />
      {/* Tripod head / mount */}
      <line
        x1="32"
        y1="26"
        x2="32"
        y2="31"
        className="stroke-current"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Pan handle */}
      <line
        x1="23"
        y1="31"
        x2="41"
        y2="31"
        className="stroke-current"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle
        cx="42"
        cy="31"
        r="2.5"
        className="stroke-current"
        strokeWidth="2.5"
      />
      {/* Tripod legs */}
      {/* Left leg */}
      <line
        x1="32"
        y1="31"
        x2="15"
        y2="54"
        className="stroke-current"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Center leg */}
      <line
        x1="32"
        y1="31"
        x2="32"
        y2="50"
        className="stroke-current"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Right leg */}
      <line
        x1="32"
        y1="31"
        x2="49"
        y2="54"
        className="stroke-current"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Feet tips */}
      <circle
        cx="15"
        cy="54"
        r="1.5"
        className="fill-current"
      />
      <circle
        cx="32"
        cy="50"
        r="1.5"
        className="fill-current"
      />
      <circle
        cx="49"
        cy="54"
        r="1.5"
        className="fill-current"
      />
    </svg>
  );
};

export default CameraLogo;

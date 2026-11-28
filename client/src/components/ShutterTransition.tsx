import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface ShutterTransitionProps {
  triggerRef: React.RefObject<HTMLButtonElement>;
}

const ShutterTransition: React.FC<ShutterTransitionProps> = ({ triggerRef }) => {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<
    'idle' | 'expanding' | 'gold-full' | 'to-dark' | 'fading'
  >('idle');
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [logoSize, setLogoSize] = useState(72);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const btn = triggerRef.current;
    if (!btn) return;

    const handleClick = (e: MouseEvent) => {
      if (active) return;
      if (location.pathname === '/') return;
      e.preventDefault();

      const rect = btn.getBoundingClientRect();
      setOrigin({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      setLogoSize(rect.width);

      setActive(true);
      setPhase('expanding');

      const t1 = setTimeout(() => {
        setPhase('gold-full');
      }, 750);

      const t2 = setTimeout(() => {
        navigate('/');
        window.scrollTo({ top: 0 });
        setPhase('to-dark');
      }, 900);

      const t3 = setTimeout(() => {
        setPhase('fading');
      }, 1200);

      const t4 = setTimeout(() => {
        setActive(false);
        setPhase('idle');
      }, 1900);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    };

    btn.addEventListener('click', handleClick);
    return () => btn.removeEventListener('click', handleClick);
  }, [triggerRef, navigate, active]);

  if (!active) return null;

  const bladeCount = 6;
  const blades = Array.from({ length: bladeCount }, (_, i) => i);

  return (
    <div
      className={`shutter-transition shutter-transition--${phase}`}
      style={
        {
          ['--ox' as string]: `${origin.x}px`,
          ['--oy' as string]: `${origin.y}px`,
          ['--logo-size' as string]: `${logoSize}px`,
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      <div className="shutter-transition__bg-dark" />
      <div className="shutter-transition__glow" />
      <div className="shutter-transition__blades">
        {blades.map((i) => (
          <div
            key={i}
            className="shutter-transition__blade"
            style={{ ['--i' as string]: i }}
          />
        ))}
      </div>
      <style>{`
        .shutter-transition {
          position: fixed;
          z-index: 99999;
          pointer-events: none;
        }
        .shutter-transition__bg-dark {
          position: fixed;
          inset: 0;
          background: hsl(0 0% 5%);
          opacity: 0;
          pointer-events: none;
        }
        .shutter-transition__glow {
          position: fixed;
          left: var(--ox);
          top: var(--oy);
          width: var(--logo-size);
          height: var(--logo-size);
          background: hsl(42, 71%, 57%);
          border-radius: 50%;
          transform: translate(-50%, -50%) scale(0.3);
          pointer-events: none;
          opacity: 0;
        }
        .shutter-transition--expanding .shutter-transition__glow {
          animation: glow-expand 0.75s cubic-bezier(.22,.7,.2,1) forwards;
        }
        .shutter-transition--gold-full .shutter-transition__glow,
        .shutter-transition--to-dark .shutter-transition__glow {
          opacity: 1;
          transform: translate(-50%, -50%) scale(50);
          border-radius: 0;
        }
        .shutter-transition--fading .shutter-transition__glow {
          opacity: 0;
          transition: opacity 0.4s ease-in;
        }
        .shutter-transition--to-dark .shutter-transition__bg-dark {
          opacity: 1;
          transition: opacity 0.3s ease-in;
        }
        .shutter-transition--fading .shutter-transition__bg-dark {
          opacity: 0;
          transition: opacity 0.55s ease-out;
        }
        @keyframes glow-expand {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.3);
            border-radius: 50%;
          }
          20% {
            opacity: 0.95;
            transform: translate(-50%, -50%) scale(1);
            border-radius: 50%;
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(50);
            border-radius: 15%;
          }
        }
        .shutter-transition__blades {
          position: fixed;
          left: 0;
          top: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
        }
        .shutter-transition__blade {
          position: absolute;
          left: var(--ox);
          top: var(--oy);
          width: 300vmax;
          height: 300vmax;
          margin-left: -150vmax;
          margin-top: -150vmax;
          background: conic-gradient(
            from calc(var(--i) * 60deg - 28deg),
            hsl(42, 71%, 57%) 0deg,
            hsl(42, 71%, 57%) 52deg,
            hsl(42, 71%, 57%, 0) 56deg,
            transparent 60deg
          );
          opacity: 0;
          transform-origin: center center;
          transform: translate(-50%, -50%) scale(0.02) rotate(calc(var(--i) * 60deg));
        }
        .shutter-transition--expanding .shutter-transition__blade {
          animation: shutter-expand 0.75s cubic-bezier(.2,.7,.2,1) forwards;
          animation-delay: calc(var(--i) * 0.012s);
        }
        .shutter-transition--gold-full .shutter-transition__blade,
        .shutter-transition--to-dark .shutter-transition__blade {
          opacity: 0;
          transform: translate(-50%, -50%) scale(60) rotate(calc(var(--i) * 60deg + 110deg));
          transition: opacity 0.1s ease-out;
        }
        @keyframes shutter-expand {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.02) rotate(calc(var(--i) * 60deg));
          }
          15% {
            opacity: 0.95;
          }
          80% {
            opacity: 0.85;
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(60) rotate(calc(var(--i) * 60deg + 110deg));
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .shutter-transition__bg-dark,
          .shutter-transition__glow {
            transition: none;
            animation: none !important;
          }
          .shutter-transition--expanding .shutter-transition__blade {
            animation: none;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ShutterTransition;

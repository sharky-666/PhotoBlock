import React from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getHomepageCopy } from '@client/src/api/portfolio';
import ShutterSpinner from '@client/src/components/ui/shutter-spinner';
import {
  buildJourneyEntries,
  type JourneyEntry,
} from '@client/src/utils/journey';
import { cn } from '@client/src/lib/utils';
import type { HomepageCopy } from '@shared/api.interface';

const JourneyLineArt: React.FC = () => (
  <>
    <div
      className="journey-linework journey-linework--ridge"
      aria-hidden="true"
    >
      <svg viewBox="0 0 760 440" fill="none" preserveAspectRatio="xMidYMid meet">
        <circle cx="566" cy="108" r="62" stroke="currentColor" opacity=".5" />
        <circle
          cx="566"
          cy="108"
          r="82"
          stroke="currentColor"
          strokeDasharray="2 12"
          opacity=".2"
        />
        <path
          d="M-20 348 122 244l104 66 147-181 128 166 120-101 156 139"
          stroke="currentColor"
          strokeWidth="1.1"
          opacity=".55"
        />
        <path
          d="M20 394 151 302l111 50 132-119 142 127 120-70 135 88"
          stroke="currentColor"
          opacity=".27"
        />
        <path
          d="M438 62c15-11 30-11 45 0M486 38c10-8 21-8 31 0"
          stroke="currentColor"
          strokeWidth="1.1"
          opacity=".42"
        />
      </svg>
    </div>

    <div
      className="journey-linework journey-linework--contour"
      aria-hidden="true"
    >
      <svg viewBox="0 0 560 620" fill="none" preserveAspectRatio="xMidYMid meet">
        <path
          d="M45 128c133-91 307-74 405 26 91 93 68 222-11 304"
          stroke="currentColor"
          opacity=".48"
        />
        <path
          d="M91 173c107-68 242-50 320 26 72 70 54 168-8 229"
          stroke="currentColor"
          opacity=".34"
        />
        <path
          d="M141 222c78-46 176-29 229 27 48 50 36 111-8 151"
          stroke="currentColor"
          opacity=".23"
        />
        <path
          d="M78 392c93-42 176-29 248 38 65 60 126 67 196 24"
          stroke="currentColor"
          strokeDasharray="3 11"
          opacity=".2"
        />
        <circle cx="403" cy="184" r="3.2" fill="currentColor" opacity=".5" />
      </svg>
    </div>

    <div
      className="journey-linework journey-linework--dunes"
      aria-hidden="true"
    >
      <svg viewBox="0 0 980 360" fill="none" preserveAspectRatio="xMidYMid meet">
        <path
          d="M-20 154c181-91 357-53 528 79 143 111 290 126 489 42"
          stroke="currentColor"
          strokeWidth="1.05"
          opacity=".5"
        />
        <path
          d="M-10 205c178-64 344-19 508 96 153 107 307 111 500 23"
          stroke="currentColor"
          opacity=".31"
        />
        <path
          d="M0 262c171-47 329 2 485 108 150 101 310 90 505 3"
          stroke="currentColor"
          strokeWidth=".8"
          strokeDasharray="3 12"
          opacity=".22"
        />
        <path
          d="M720 68c14-10 28-10 42 0M773 42c10-8 21-8 31 0"
          stroke="currentColor"
          opacity=".4"
        />
      </svg>
    </div>
  </>
);

const JourneyEntryRow: React.FC<{
  entry: JourneyEntry;
  index: number;
  reducedMotion: boolean;
}> = ({ entry, index, reducedMotion }) => {
  const rowRef = React.useRef<HTMLDivElement>(null);
  const isLeft = index % 2 === 0;
  const offset = isLeft ? -54 : 54;
  const x = useMotionValue(reducedMotion ? 0 : offset);
  const y = useMotionValue(reducedMotion ? 0 : 14);
  const opacity = useMotionValue(reducedMotion ? 1 : 0);
  const markerOpacity = useMotionValue(reducedMotion ? 1 : 0);
  const markerScale = useTransform(
    markerOpacity,
    [0, 1],
    [0.78, 1],
  );

  React.useEffect(() => {
    if (reducedMotion) {
      x.set(0);
      y.set(0);
      opacity.set(1);
      markerOpacity.set(1);
      return;
    }

    let frame = 0;
    const update = () => {
      const row = rowRef.current;
      if (!row) return;
      const rect = row.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const start = viewportHeight * 0.9;
      const end = viewportHeight * 0.48;
      const progress = Math.min(
        1,
        Math.max(0, (start - rect.top) / Math.max(start - end, 1)),
      );
      const eased = 1 - Math.pow(1 - progress, 3);
      x.set(offset * (1 - eased));
      y.set(14 * (1 - eased));
      opacity.set(Math.min(1, eased * 1.35));
      markerOpacity.set(
        Math.min(1, Math.max(0, (progress - 0.38) / 0.52)),
      );
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [markerOpacity, offset, opacity, reducedMotion, x, y]);

  return (
    <motion.div
      ref={rowRef}
      style={{ x, y, opacity }}
      className="group relative grid grid-cols-[2rem_minmax(0,1fr)] items-start md:grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)]"
    >
      <span
        className="absolute left-4 top-8 z-10 h-3 w-3 -translate-x-1/2 rotate-45 border border-primary/30 bg-background md:left-1/2"
        aria-hidden="true"
      />
      <motion.span
        className="absolute left-4 top-8 z-[11] h-3 w-3 -translate-x-1/2 rotate-45 border border-primary bg-primary shadow-[0_0_12px_var(--primary)] md:left-1/2"
        style={{ opacity: markerOpacity, scale: markerScale }}
        aria-hidden="true"
      />
      <article
        className={cn(
          'col-start-2 w-full origin-center border border-border/65 bg-card/35 p-5',
          'transition-[transform,background-color,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          'group-hover:scale-[1.035] group-hover:border-primary/55 group-hover:bg-primary/[0.035]',
          'will-change-transform md:p-6',
          isLeft ? 'md:col-start-1' : 'md:col-start-3',
        )}
      >
        <div className="flex items-start justify-between gap-5">
          <span className="font-display text-3xl font-light text-muted-foreground transition-colors delay-75 duration-300 group-hover:text-primary md:text-4xl">
            {entry.year}
          </span>
          <span className="border border-border/70 px-2 py-1 font-mono text-[8px] tracking-[0.24em] text-muted-foreground/65 transition-colors delay-75 duration-300 group-hover:border-primary/45 group-hover:text-primary">
            {entry.category}
          </span>
        </div>
        <span className="mt-4 block h-px w-10 bg-primary/30 transition-all duration-500 group-hover:w-16 group-hover:bg-primary/70" />
        <p className="mt-4 font-display text-base leading-7 tracking-[0.08em] text-foreground/72 transition-colors delay-75 duration-300 group-hover:text-primary md:text-lg">
          {entry.text}
        </p>
      </article>
    </motion.div>
  );
};

const JourneyPage: React.FC = () => {
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smoothScrollProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 26,
    mass: 0.35,
  });
  const axisScale = useTransform(
    smoothScrollProgress,
    [0, 0.08, 0.82, 1],
    [0.05, 0.16, 0.84, 1],
  );
  const { data: copy, isLoading } = useQuery<HomepageCopy>({
    queryKey: ['homepage-copy'],
    queryFn: getHomepageCopy,
    staleTime: 60 * 1000,
    retry: 1,
  });
  const entries = copy ? buildJourneyEntries(copy) : [];

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <ShutterSpinner size={40} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="journey-page mx-auto max-w-6xl px-6 py-16 md:px-12 md:py-20">
      <JourneyLineArt />
      <motion.span
        className="journey-axis journey-axis--page absolute bottom-0 hidden md:block"
        style={{
          originY: 0,
          scaleY: reducedMotion ? 1 : axisScale,
        }}
        aria-hidden="true"
      />
      <motion.header
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-center"
      >
        <h1 className="font-display text-3xl font-light md:text-5xl">
          时间历程
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
          回望每一次选择、相遇与被光照亮的时刻。
        </p>
      </motion.header>

      {entries.length === 0 ? (
        <div className="mt-14 border border-dashed border-border px-6 py-16 text-center text-muted-foreground">
          暂无时间历程
        </div>
      ) : (
        <div className="relative z-10 mx-auto mt-14 max-w-5xl overflow-hidden md:mt-18">
          <motion.span
            className="journey-axis absolute bottom-0 left-4 top-0 md:hidden"
            style={{
              originY: 0,
              scaleY: reducedMotion ? 1 : axisScale,
            }}
            aria-hidden="true"
          />
          <div className="space-y-4 md:space-y-6">
            {entries.map((entry, index) => (
              <JourneyEntryRow
                key={`${entry.year}-${entry.category}-${entry.text}`}
                entry={entry}
                index={index}
                reducedMotion={Boolean(reducedMotion)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="relative z-10 mt-12 text-center">
        <Link
          to="/"
          className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-primary"
        >
          ← 返回首页
        </Link>
      </div>
    </div>
  );
};

export default JourneyPage;

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useSpring, useTransform, useInView, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Download, Film, Image as ImageIcon, Maximize2, Play, X } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { formatDuration } from '@client/src/utils/media-metadata';
import { UniversalLink } from '@client/src/components/UniversalLink';
import Image from '@client/src/components/ui/image';
import ImageLightbox from '@client/src/components/ImageLightbox';
import TravelMap from '@client/src/components/TravelMap';
import ShutterSpinner from '@client/src/components/ui/shutter-spinner';
import type { LightboxImage } from '@client/src/components/ImageLightbox';
import { cn } from '@client/src/lib/utils';
import { getFeaturedSeries, getCategoryList, getFeaturedVideos, getFeaturedImages, incrementArtworkView, getHomepageCopy, getSiteSettings, getSeriesList, getHeroSlides } from '@client/src/api/portfolio';
import { useSiteStats } from '@client/src/hooks/useSiteStats';
import { buildJourneyEntries } from '@client/src/utils/journey';
import { DEFAULT_HOMEPAGE_COPY } from '@shared/homepage-defaults';
import type { Artwork, Series, Category, HomepageCopy, HeroSlide } from '@shared/api.interface';

const HERO_IMAGE_URL = '/images/hero-noir.svg';
const ARTIST_IMAGE_URL = '/images/artist-default.svg';
const HERO_THEME_TITLE = '光影诗篇';
const HERO_THEME_SUBTITLE = 'The Poetry of Light';

const useHomepageCopy = (): HomepageCopy => {
  const { data } = useQuery<HomepageCopy>({
    queryKey: ['homepage-copy'],
    queryFn: getHomepageCopy,
    staleTime: 60 * 1000,
    retry: 1,
  });
  return data || DEFAULT_HOMEPAGE_COPY;
};

/* ---------- shared variants ---------- */

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const viewConfig = {
  once: true,
  margin: '-100px 0px',
};

type SectionMotifVariant =
  | 'moon-ridge'
  | 'contour'
  | 'orbit'
  | 'constellation'
  | 'canyon'
  | 'cine-ribbon'
  | 'wave-field'
  | 'dune-field'
  | 'metric-ridge';

const SectionMotif: React.FC<{ variant: SectionMotifVariant }> = ({
  variant,
}) => (
  <div
    aria-hidden="true"
    className={cn('section-motif', `section-motif--${variant}`)}
  >
    <svg viewBox="0 0 1440 520" fill="none" preserveAspectRatio="xMidYMid meet">
      {variant === 'moon-ridge' && (
        <>
          <circle cx="1080" cy="116" r="66" stroke="currentColor" opacity=".42" />
          <circle cx="1080" cy="116" r="86" stroke="currentColor" opacity=".14" strokeDasharray="2 11" />
          <path d="M-40 408 146 282l112 72 154-181 134 174 132-108 168 151 138-107 158 98 142-143 176 137" stroke="currentColor" strokeWidth="1.15" opacity=".58" />
          <path d="M-20 458 164 342l122 60 142-137 154 153 121-78 168 112 153-82 166 75 143-99 147 92" stroke="currentColor" strokeWidth=".8" opacity=".3" />
          <path d="M856 94c15-10 30-10 45 0M906 72c10-7 21-7 32 0" stroke="currentColor" strokeWidth="1.1" opacity=".5" />
        </>
      )}
      {variant === 'contour' && (
        <>
          <path d="M595 74c180-76 423-66 576 25 165 98 244 263 179 384" stroke="currentColor" strokeWidth="1" opacity=".52" />
          <path d="M656 118c148-54 339-43 466 30 129 74 196 196 151 285" stroke="currentColor" strokeWidth=".9" opacity=".4" />
          <path d="M719 166c118-35 260-22 356 37 93 57 146 143 119 203" stroke="currentColor" strokeWidth=".8" opacity=".3" />
          <path d="M798 213c89-22 181-4 242 37 55 38 88 91 76 127" stroke="currentColor" strokeWidth=".7" opacity=".22" />
          <circle cx="1230" cy="120" r="4" fill="currentColor" opacity=".55" />
          <path d="M180 158h82M221 117v82" stroke="currentColor" opacity=".28" />
        </>
      )}
      {variant === 'orbit' && (
        <>
          <circle cx="1124" cy="266" r="58" stroke="currentColor" opacity=".55" />
          <circle cx="1124" cy="266" r="118" stroke="currentColor" opacity=".28" strokeDasharray="3 10" />
          <circle cx="1124" cy="266" r="190" stroke="currentColor" opacity=".16" />
          <path d="M884 266h480M1124 26v480" stroke="currentColor" opacity=".12" />
          <circle cx="962" cy="177" r="3" fill="currentColor" opacity=".65" />
          <circle cx="1286" cy="324" r="2.5" fill="currentColor" opacity=".55" />
          <circle cx="1196" cy="90" r="2" fill="currentColor" opacity=".42" />
          <path d="M1048 210c14-10 29-10 44 0M1190 352c12-9 25-9 37 0" stroke="currentColor" opacity=".45" />
        </>
      )}
      {variant === 'constellation' && (
        <>
          <path d="M80 352c137-193 292-239 474-139 116 64 212 59 316-19 98-74 205-70 326 18" stroke="currentColor" strokeWidth="1" strokeDasharray="4 12" opacity=".34" />
          <circle cx="218" cy="248" r="3.5" fill="currentColor" opacity=".65" />
          <circle cx="478" cy="235" r="2.5" fill="currentColor" opacity=".48" />
          <circle cx="769" cy="184" r="3" fill="currentColor" opacity=".58" />
          <circle cx="1108" cy="239" r="2.2" fill="currentColor" opacity=".42" />
          <path d="M328 176c13-10 27-10 40 0M354 153c10-8 21-8 31 0M966 156c15-11 31-11 46 0M1010 130c11-8 22-8 33 0" stroke="currentColor" strokeWidth="1.1" opacity=".52" />
        </>
      )}
      {variant === 'canyon' && (
        <>
          <path d="M-20 488 182 326l126 57 152-139 132 150 156-110 174 157 156-122 178 137 146-95 128 127" stroke="currentColor" strokeWidth="1.1" opacity=".46" />
          <path d="M-10 523 168 393l134 72 156-105 131 111 170-87 158 113 162-80 158 90 143-68 170 84" stroke="currentColor" strokeWidth=".75" opacity=".26" />
          <path d="M72 440c125-47 260-48 394-6 145 45 293 48 445 5 127-36 259-33 394 8" stroke="currentColor" strokeDasharray="2 12" opacity=".2" />
          <path d="M1082 96c17-12 34-12 51 0M1135 70c12-9 25-9 37 0" stroke="currentColor" strokeWidth="1" opacity=".34" />
        </>
      )}
      {variant === 'cine-ribbon' && (
        <>
          <path d="M-40 118c214-94 397-58 549 106 168 181 336 220 594 118 133-52 245-55 377-9" stroke="currentColor" strokeWidth="1.05" opacity=".5" />
          <path d="M-20 158c205-77 372-42 510 103 159 168 324 205 571 117 139-50 263-52 409-4" stroke="currentColor" strokeWidth=".75" strokeDasharray="3 11" opacity=".28" />
          <path d="M82 52h154v92H82zM190 66h30M190 86h21M190 106h27" stroke="currentColor" strokeWidth=".8" opacity=".24" />
          <circle cx="1189" cy="90" r="42" stroke="currentColor" opacity=".36" />
          <path d="M1111 90h156M1189 12v156" stroke="currentColor" opacity=".16" />
          <path d="M922 64c14-10 28-10 42 0M973 38c10-8 21-8 31 0" stroke="currentColor" strokeWidth="1.1" opacity=".42" />
        </>
      )}
      {variant === 'wave-field' && (
        <>
          <path d="M-20 184c217-88 406-78 567 29 184 123 371 142 568 56 182-79 338-61 470 54" stroke="currentColor" strokeWidth="1" opacity=".46" />
          <path d="M-30 228c221-75 409-58 563 49 183 126 376 143 580 52 172-77 320-53 461 61" stroke="currentColor" strokeWidth=".75" opacity=".31" />
          <path d="M-40 276c220-62 407-38 560 72 178 127 376 141 584 43 170-80 311-48 452 68" stroke="currentColor" strokeWidth=".7" strokeDasharray="4 13" opacity=".22" />
          <circle cx="1240" cy="215" r="4" fill="currentColor" opacity=".44" />
          <path d="M1124 166h78M1163 127v78" stroke="currentColor" opacity=".2" />
        </>
      )}
      {variant === 'dune-field' && (
        <>
          <path d="M-30 220c211-91 402-61 573 72 141 109 298 133 471 70 189-69 340-43 455 80" stroke="currentColor" strokeWidth="1" opacity=".45" />
          <path d="M-20 266c210-71 391-33 551 89 151 115 311 136 489 65 175-69 310-38 438 75" stroke="currentColor" strokeWidth=".8" opacity=".3" />
          <path d="M-10 318c201-58 381-9 541 112 156 117 319 130 498 49 163-73 292-36 423 82" stroke="currentColor" strokeWidth=".7" strokeDasharray="3 12" opacity=".2" />
          <circle cx="108" cy="116" r="38" stroke="currentColor" opacity=".3" />
          <path d="M230 82c13-10 27-10 40 0M277 56c9-7 19-7 28 0" stroke="currentColor" strokeWidth="1" opacity=".38" />
        </>
      )}
      {variant === 'metric-ridge' && (
        <>
          <path d="M-20 412 118 340l116 51 152-122 142 137 138-99 166 124 142-92 158 84 151-126 177 111" stroke="currentColor" strokeWidth=".95" opacity=".4" />
          <path d="M-20 456 124 389l120 46 144-101 151 116 130-78 166 103 151-70 163 69 143-91 148 73" stroke="currentColor" strokeWidth=".7" opacity=".26" />
          <path d="M0 492h1440" stroke="currentColor" strokeDasharray="2 14" opacity=".18" />
          <path d="M176 472v20M470 472v20M764 472v20M1058 472v20M1352 472v20" stroke="currentColor" opacity=".22" />
          <circle cx="118" cy="340" r="3" fill="currentColor" opacity=".45" />
          <circle cx="528" cy="406" r="2.4" fill="currentColor" opacity=".38" />
          <circle cx="1090" cy="331" r="2.8" fill="currentColor" opacity=".42" />
        </>
      )}
    </svg>
  </div>
);

/* ---------- Section Title ---------- */

const SectionTitle: React.FC<{
  title?: string;
  subTitle?: string;
  align?: 'left' | 'center';
}> = ({ title, subTitle, align = 'left' }) => (
  <div
    className={cn(
      'mb-12 md:mb-16',
      align === 'center' && 'text-center',
    )}
  >
    {title?.trim() && (
      <h2 className="text-balance font-display text-2xl font-light text-foreground sm:text-3xl md:text-5xl">
        {title}
        {subTitle?.trim() && (
          <span className="ml-3 text-base font-normal text-muted-foreground md:text-lg">
            {subTitle}
          </span>
        )}
      </h2>
    )}
  </div>
);

/* ---------- Animated Counter ---------- */

const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px 0px' });
  const spring = useSpring(0, {
    stiffness: 30,
    damping: 20,
    mass: 0.5,
  });
  const display = useTransform(spring, (v) => {
    const rounded = Math.round(v);
    if (rounded >= 1000) {
      const k = (rounded / 1000).toFixed(1);
      // 去掉末尾的 .0 保持干净
      return k.replace(/\.0$/, '') + 'K';
    }
    return rounded.toString();
  });

  useEffect(() => {
    if (inView) {
      spring.set(value);
    }
  }, [inView, value, spring]);

  return (
    <div
      ref={ref}
      className="font-display text-4xl font-light tracking-[0.04em] text-foreground [font-variant-numeric:tabular-nums] md:text-6xl"
    >
      <motion.span>{display}</motion.span>
    </div>
  );
};

/* ---------- Series Skeleton ---------- */

const SeriesSkeleton: React.FC = () => (
  <div className="grid w-full grid-cols-1 gap-0 sm:grid-cols-2 md:grid-cols-3">
    {[0, 1, 2].map((i: number) => (
      <div key={i} className="aspect-[3/4] w-full animate-pulse bg-muted" />
    ))}
  </div>
);

/* ---------- Category Skeleton ---------- */

const CategorySkeleton: React.FC = () => (
  <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
    {[0, 1, 2].map((i: number) => (
      <div key={i} className="aspect-[4/3] w-full animate-pulse bg-muted" />
    ))}
  </div>
);

/* ---------- Hero ---------- */

const AUTO_PLAY_INTERVAL = 5000;
const FADE_DURATION = 1;

const HeroSection: React.FC = () => {
  const copy = useHomepageCopy();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const honors = copy.heroHonors
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean);

  const { data: slides, status: slidesStatus } = useQuery<HeroSlide[]>({
    queryKey: ['hero-slides', 'active'],
    queryFn: () => getHeroSlides(true),
    staleTime: 60 * 1000,
    retry: 1,
  });

  const hasSlides = slidesStatus === 'success' && slides && slides.length > 0;
  const activeSlides = slides || [];
  const imageSlides = activeSlides.filter((s: HeroSlide) => s.mediaType === 'image');

  // Build lightbox images from image-type slides (map to current slide index)
  const heroLightboxImages: LightboxImage[] = hasSlides
    ? imageSlides.map((s: HeroSlide) => ({
        src: s.mediaUrl,
        alt: s.title || 'Hero slide',
        caption: s.subtitle || '',
      }))
    : [{ src: HERO_IMAGE_URL, alt: 'Demo Studio', caption: '作品集演示' }];

  // Map current carousel index → lightbox index (only image slides count in lightbox)
  const handleOpenLightbox = useCallback(() => {
    if (!hasSlides) {
      setLightboxIndex(0);
      return;
    }
    const currentSlide = activeSlides[currentIndex];
    if (!currentSlide || currentSlide.mediaType !== 'image') return;
    const lbIdx = imageSlides.findIndex(
      (s: HeroSlide) => s.id === currentSlide.id,
    );
    if (lbIdx >= 0) setLightboxIndex(lbIdx);
  }, [hasSlides, activeSlides, currentIndex, imageSlides]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) =>
      prev === 0 ? activeSlides.length - 1 : prev - 1,
    );
  }, [activeSlides.length]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) =>
      prev === activeSlides.length - 1 ? 0 : prev + 1,
    );
  }, [activeSlides.length]);

  // Auto-play
  useEffect(() => {
    if (!hasSlides || isPaused || activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) =>
        prev === activeSlides.length - 1 ? 0 : prev + 1,
      );
    }, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [hasSlides, isPaused, activeSlides.length]);

  const handleScrollDown = () => {
    const worksEl = document.getElementById('image-works');
    if (worksEl) {
      worksEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const currentSlide = hasSlides ? activeSlides[currentIndex] : null;
  const isClickable = !hasSlides || currentSlide?.mediaType === 'image';

  return (
    <section
      className="hero-stage relative flex min-h-screen items-center justify-center overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="hero-ambient" aria-hidden="true">
        <span className="hero-orb hero-orb-left" />
        <span className="hero-orb hero-orb-right" />
        <span className="hero-beam" />
      </div>
      <div className="hero-corners" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>

      {/* Background media layer */}
      {hasSlides ? (
        <div className="hero-media-layer absolute inset-0">
          {activeSlides.map((slide: HeroSlide, index: number) => {
            const isActive = index === currentIndex;
            return (
              <motion.div
                key={slide.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={{ duration: FADE_DURATION, ease: 'easeInOut' }}
                className={cn(
                  'absolute inset-0',
                  slide.mediaType === 'image' && isClickable && 'cursor-zoom-in',
                )}
                onClick={() => {
                  if (slide.mediaType === 'image' && isActive) {
                    handleOpenLightbox();
                  }
                }}
                role={slide.mediaType === 'image' ? 'button' : undefined}
                aria-label={
                  slide.mediaType === 'image' ? '查看大图' : undefined
                }
              >
                {slide.mediaType === 'image' ? (
                  <Image
                    src={slide.mediaUrl}
                    alt={slide.title || 'Hero slide'}
                    fill
                    priority={index === 0}
                    className="object-cover opacity-[0.96]"
                  />
                ) : (
                  <video
                    src={slide.mediaUrl}
                    poster={slide.thumbnailUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="h-full w-full object-cover opacity-[0.96]"
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div
          className="hero-media-layer absolute inset-0 cursor-zoom-in"
          onClick={() => setLightboxIndex(0)}
          role="button"
          aria-label="查看大图"
        >
          <Image
            src={HERO_IMAGE_URL}
            alt="Hero background"
            fill
            priority
            className="object-cover opacity-[0.96]"
          />
        </div>
      )}

      {/* 轻微暗场只压边缘，保留作品细节 */}
      <div className="pointer-events-none absolute inset-0 bg-background/10" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/26 via-background/3 to-background/70" />

      {/* Brand / foreground content (centered, always visible) */}
      <div className="hero-copy-shield relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 text-center 2xl:max-w-6xl">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: 'easeOut' }}
          className="hero-wordmark relative mx-auto w-full max-w-[920px]"
        >
          <svg
            className="hero-wordmark-emblem"
            viewBox="0 0 920 340"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <ellipse
              className="hero-emblem-line hero-emblem-line-gold"
              cx="460"
              cy="170"
              rx="422"
              ry="138"
            />
            <ellipse
              className="hero-emblem-line"
              cx="460"
              cy="170"
              rx="375"
              ry="112"
            />
            <path
              className="hero-emblem-line hero-emblem-line-gold"
              d="M38 170h154M728 170h154"
            />
            <path
              className="hero-emblem-line"
              d="M460 20v30M460 290v30"
            />
            <path
              className="hero-emblem-diamond"
              d="m460 25 5 5-5 5-5-5zM460 285l5 5-5 5-5-5z"
            />
          </svg>
          <span className="hero-wordmark-name">
            {HERO_THEME_TITLE}
            <span
              className="hero-wordmark-name-shine"
              aria-hidden="true"
            >
              {HERO_THEME_TITLE}
            </span>
          </span>
          <span className="hero-wordmark-script">
            {HERO_THEME_SUBTITLE}
          </span>
          <span className="hero-wordmark-meta">
            <i />
            <span>Fine Art Photography</span>
            <b>◆</b>
            <span>MMXXVI</span>
            <i />
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: 'easeOut' }}
          className="mt-6 font-display text-lg font-light italic text-foreground/80 md:text-xl 2xl:text-2xl"
        >
          {copy.heroSlogan}
        </motion.p>

        {/* Honor tags */}
        <div className="mt-10 w-full">
          <div className="mx-auto mb-5 flex w-full max-w-sm items-center gap-4 text-primary/55">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/45" />
            <span className="font-mono text-[8px] uppercase tracking-[0.32em]">
              Selected Honors · 荣誉
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/45" />
          </div>
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1, ease: 'easeOut' }}
          className="flex max-w-4xl flex-wrap items-center justify-center gap-x-7 gap-y-3"
        >
          {honors.map((honor: string) => (
            <span
              key={honor}
              className="flex items-center gap-3 text-[9px] font-medium uppercase tracking-[0.2em] text-foreground/55 md:text-[10px] 2xl:text-xs"
            >
              <span className="h-1 w-1 rotate-45 bg-primary/75" />
              {honor}
            </span>
          ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.3, ease: 'easeOut' }}
          className="mt-9 grid w-full max-w-md grid-cols-2 gap-3 sm:flex sm:w-auto"
        >
          <UniversalLink
            to="/works/photos"
            className="group inline-flex min-h-11 items-center justify-center gap-3 border border-primary bg-primary px-6 text-[10px] font-medium tracking-[0.24em] text-primary-foreground transition-all duration-300 hover:bg-primary/90"
          >
            进入作品
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </UniversalLink>
          <UniversalLink
            to="/about"
            className="inline-flex min-h-11 items-center justify-center border border-foreground/20 bg-background/35 px-6 text-[10px] font-medium tracking-[0.24em] text-foreground/80 backdrop-blur-sm transition-all duration-300 hover:border-primary/60 hover:bg-background/55 hover:text-primary"
          >
            了解摄影师
          </UniversalLink>
        </motion.div>
      </div>

      {/* Slide caption (bottom-left, per-slide) */}
      {hasSlides && currentSlide && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            className="pointer-events-none absolute bottom-24 left-6 z-10 max-w-xs text-left md:bottom-32 md:left-12 md:max-w-md"
          >
            {currentSlide.title && (
              <p className="font-display text-lg font-light text-foreground/90 md:text-xl">
                {currentSlide.title}
              </p>
            )}
            {currentSlide.subtitle && (
              <p className="mt-1 text-xs text-foreground/60 md:text-sm">
                {currentSlide.subtitle}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Navigation arrows */}
      {hasSlides && activeSlides.length > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="上一张"
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-foreground/20 bg-background/20 p-1.5 text-foreground/60 backdrop-blur-sm transition-all hover:border-foreground/40 hover:bg-background/40 hover:text-foreground md:left-6 md:p-2"
          >
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>
          <button
            onClick={goNext}
            aria-label="下一张"
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-foreground/20 bg-background/20 p-1.5 text-foreground/60 backdrop-blur-sm transition-all hover:border-foreground/40 hover:bg-background/40 hover:text-foreground md:right-6 md:p-2"
          >
            <ChevronRight size={20} strokeWidth={1.5} />
          </button>
        </>
      )}

      {/* Indicator dots */}
      {hasSlides && activeSlides.length > 1 && (
        <div className="absolute bottom-20 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 md:bottom-24">
          {activeSlides.map((slide: HeroSlide, index: number) => (
            <button
              key={slide.id}
              onClick={() => goToSlide(index)}
              aria-label={`跳转到第 ${index + 1} 张`}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                index === currentIndex
                  ? 'w-6 bg-foreground/70'
                  : 'w-1.5 bg-foreground/30 hover:bg-foreground/50',
              )}
            />
          ))}
        </div>
      )}

      {/* Scroll indicator */}
      <motion.button
        onClick={handleScrollDown}
        aria-label="向下滚动"
        className="group absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 text-[9px] font-medium uppercase tracking-[0.36em] text-foreground/45 transition-colors hover:text-primary md:bottom-10"
        animate={{ y: [0, 5, 0] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <span>Scroll</span>
        <span className="h-9 w-px bg-gradient-to-b from-primary/70 to-transparent transition-colors group-hover:from-primary" />
      </motion.button>

      <ImageLightbox
        images={heroLightboxImages}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={(i: number) => setLightboxIndex(i)}
      />
    </section>
  );
};

/* ---------- Fullscreen Image ---------- */

const FullscreenImageSection: React.FC = () => {
  const copy = useHomepageCopy();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { data, isLoading } = useQuery<Artwork[]>({
    queryKey: ['portfolio', 'featured-images'],
    queryFn: () => getFeaturedImages(6),
    staleTime: 60 * 1000,
    retry: 1,
    throwOnError: (err) => {
      logger.error('获取精选图片失败', err);
      return false;
    },
  });

  const lightboxImages: LightboxImage[] = data
    ? data
        .filter((a: Artwork) => a.mediaType === 'image')
        .map((a: Artwork) => ({
          src: a.imageUrl,
          alt: a.title,
          caption: a.location || undefined,
          artwork: a,
        }))
    : [];

  if (isLoading) {
    return (
      <section id="image-works" className="pt-24 pb-16 md:pt-32 md:pb-20">
        <div className="mx-auto max-w-7xl px-6 text-center md:px-12">
          <h2 className="text-balance font-display text-2xl font-light italic text-foreground/80 sm:text-3xl md:text-5xl">
            「{copy.imageWorksTitle}」
          </h2>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-0 sm:grid-cols-2 md:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i: number) => (
            <div key={i} className="aspect-[4/3] w-full animate-pulse bg-muted" />
          ))}
        </div>
      </section>
    );
  }

  if (!data || data.length === 0) {
    return (
      <section id="image-works" className="pt-24 pb-16 md:pt-32 md:pb-20">
        <div className="mx-auto mb-10 max-w-3xl px-6 text-center md:mb-12 md:px-12">
          <h2 className="text-balance font-display text-2xl font-light italic text-foreground sm:text-3xl md:text-5xl">
            「{copy.imageWorksTitle}」
          </h2>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            {copy.imageWorksSubtitle}
          </p>
        </div>
        <div className="mx-6 flex min-h-64 flex-col items-center justify-center border border-border/80 bg-card/20 px-6 text-center md:mx-12">
          <ImageIcon className="h-9 w-9 text-muted-foreground/50" strokeWidth={1.2} />
          <p className="mt-4 font-display text-2xl text-foreground">
            暂无图片作品
          </p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            上传第一组摄影作品后，这里会自动生成作品墙。
          </p>
        </div>
      </section>
    );
  }

  const items = data.filter((a: Artwork) => a.mediaType === 'image').slice(0, 6);

  const handleImageClick = (imageIndex: number) => {
    const artwork = items[imageIndex];
    const lbIndex = lightboxImages.findIndex(
      (img: LightboxImage) => img.src === artwork.imageUrl,
    );
    if (lbIndex >= 0) setLightboxIndex(lbIndex);
    incrementArtworkView(artwork.id).catch(() => {});
  };

  return (
    <section id="image-works" className="pt-24 pb-16 md:pt-32 md:pb-20">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewConfig}
        variants={fadeInUp}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="mx-auto mb-16 max-w-3xl px-6 text-center md:mb-20 md:px-12"
      >
        <h2 className="text-balance font-display text-2xl font-light italic text-foreground sm:text-3xl md:text-5xl">
          「{copy.imageWorksTitle}」
        </h2>
        <p className="mt-4 text-base text-muted-foreground md:text-lg">
          {copy.imageWorksSubtitle}
        </p>
      </motion.div>

      {/* Image wall — 3 columns, no gap, full bleed */}
      <div className="grid w-full grid-cols-1 gap-0 sm:grid-cols-2 md:grid-cols-3">
        {items.map((artwork: Artwork, index: number) => (
          <motion.button
            key={artwork.id}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px 0px' }}
            variants={fadeInUp}
            transition={{
              duration: 0.7,
              ease: 'easeOut',
              delay: index * 0.08,
            }}
            onClick={() => handleImageClick(index)}
            className="gallery-tile group relative block aspect-[4/3] w-full overflow-hidden bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`查看大图：${artwork.title}`}
          >
            <Image
              src={artwork.imageUrl}
              alt={artwork.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33.33vw"
              className="object-cover transition-all duration-700 ease-out group-hover:scale-[1.04]"
            />

            {/* Quality badge */}
            {artwork.quality && (
              <div className="absolute left-3 top-3 z-10">
                <span className="rounded-sm bg-black/60 px-2 py-0.5 text-[11px] font-medium tracking-wider text-white backdrop-blur-sm">
                  {artwork.quality}
                </span>
              </div>
            )}

            <span className="absolute right-4 top-4 z-10 font-mono text-[9px] tracking-[0.24em] text-white/55">
              {String(index + 1).padStart(2, '0')}
            </span>

            {/* Hover dark overlay */}
            <div className="absolute inset-0 bg-black/0 transition-all duration-500 group-hover:bg-black/25" />

            {/* Bottom gradient for text readability */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            {/* Title overlay (always visible, enhanced on hover) */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-left md:p-6">
              <span className="mb-3 block h-px w-7 bg-primary/85" />
              <h3 className="font-display text-lg font-light text-white drop-shadow-md transition-all duration-500 md:text-2xl">
                {artwork.title}
              </h3>
              {artwork.location && (
                <p className="mt-1 text-xs text-white/80 drop-shadow-sm md:text-sm">
                  {artwork.location}
                </p>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      <ImageLightbox
        images={lightboxImages}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={(i: number) => setLightboxIndex(i)}
      />
    </section>
  );
};

/* ---------- Video-first Hero + Image Coverflow ---------- */

type ShowcaseImage = {
  id: string;
  src: string;
  title: string;
  subtitle?: string;
  artwork?: Artwork;
  isPlaceholder?: boolean;
};

const PREVIEW_IMAGE_SLIDES: ShowcaseImage[] = [
  {
    id: 'preview-cinematic',
    src: '/images/hero-cinematic.svg',
    title: '山雾晨曦',
    subtitle: '示例影像 · 上传作品后自动替换',
    isPlaceholder: true,
  },
  {
    id: 'preview-noir',
    src: '/images/hero-noir.svg',
    title: '静默山脊',
    subtitle: '示例影像 · 上传作品后自动替换',
    isPlaceholder: true,
  },
  {
    id: 'preview-portrait',
    src: '/images/artist-default.svg',
    title: '光影肖像',
    subtitle: '示例影像 · 上传作品后自动替换',
    isPlaceholder: true,
  },
];

type ShowcaseVideo = {
  id: string;
  src: string;
  poster?: string;
  title: string;
  subtitle?: string;
};

const VideoPreviewModal: React.FC<{
  video: ShowcaseVideo | null;
  onClose: () => void;
}> = ({ video, onClose }) => {
  useEffect(() => {
    if (!video) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, video]);

  return createPortal(
    <AnimatePresence>
      {video && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-background/96 p-4 md:p-10"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`播放视频：${video.title}`}
          data-native-cursor="true"
        >
          <div
            className="pointer-events-none absolute inset-[-5rem] scale-110 bg-cover bg-center opacity-20 blur-3xl"
            style={{
              backgroundImage: `url("${video.poster || HERO_IMAGE_URL}")`,
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-background/75" />

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-foreground/15 bg-background/60 text-foreground/80 backdrop-blur-md transition-colors hover:border-primary/60 hover:text-primary md:right-8 md:top-8"
            aria-label="关闭视频"
          >
            <X size={22} strokeWidth={1.5} />
          </button>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-[92rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <video
              key={video.id}
              src={video.src}
              poster={video.poster}
              controls
              autoPlay
              playsInline
              preload="metadata"
              className="max-h-[82vh] w-full bg-black object-contain"
            />
            <div className="mt-4 flex items-end justify-between gap-5">
              <div>
                <p className="font-display text-xl font-light text-foreground md:text-2xl">
                  {video.title}
                </p>
                {video.subtitle && (
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {video.subtitle}
                  </p>
                )}
              </div>
              <span className="hidden font-mono text-[9px] uppercase tracking-[0.28em] text-foreground/35 md:block">
                Cinematic Film
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

const VideoHeroSection: React.FC = () => {
  const copy = useHomepageCopy();
  const [playerOpen, setPlayerOpen] = useState(false);
  const { data: heroSlides = [] } = useQuery<HeroSlide[]>({
    queryKey: ['hero-slides', 'active'],
    queryFn: () => getHeroSlides(true),
    staleTime: 60 * 1000,
    retry: 1,
  });
  const { data: featuredVideos = [] } = useQuery<Artwork[]>({
    queryKey: ['portfolio', 'featured-videos'],
    queryFn: () => getFeaturedVideos(6),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const videos: ShowcaseVideo[] = [
    ...heroSlides
      .filter((slide) => slide.mediaType === 'video')
      .map((slide) => ({
        id: slide.id,
        src: slide.mediaUrl,
        poster: slide.thumbnailUrl,
        title: slide.title,
        subtitle: slide.subtitle,
      })),
    ...featuredVideos.map((video) => ({
      id: video.id,
      src: video.imageUrl,
      poster: undefined,
      title: video.title,
      subtitle: video.location || undefined,
    })),
  ];
  const activeVideo = videos[0];

  const scrollToImages = () => {
    document
      .getElementById('image-works')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section
      id="video-works"
      className="video-hero-stage relative isolate -mt-20 flex min-h-[calc(100svh-4rem)] items-end overflow-hidden"
    >
      <div
        className={cn(
          'absolute inset-0',
          activeVideo && 'cursor-pointer',
        )}
        onClick={() => activeVideo && setPlayerOpen(true)}
        role={activeVideo ? 'button' : undefined}
        tabIndex={activeVideo ? 0 : undefined}
        onKeyDown={(event) => {
          if (
            activeVideo &&
            (event.key === 'Enter' || event.key === ' ')
          ) {
            event.preventDefault();
            setPlayerOpen(true);
          }
        }}
        aria-label={activeVideo ? '播放首页视频' : undefined}
      >
        {activeVideo ? (
          <video
            key={activeVideo.id}
            src={activeVideo.src}
            poster={activeVideo.poster || HERO_IMAGE_URL}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="h-full w-full scale-[1.015] object-cover"
          />
        ) : (
          <Image
            src="/images/hero-cinematic.svg"
            alt="视频作品封面"
            fill
            priority
            className="scale-[1.015] object-cover"
          />
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/26 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/55 via-transparent to-background/10" />
      <div className="video-hero-frame" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[110rem] px-6 pb-14 pt-32 md:px-12 md:pb-20 md:pt-40">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mr-auto max-w-4xl text-left"
        >
          <div className="mb-6 flex items-center justify-start gap-4">
            <span className="h-px w-12 bg-primary" />
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-primary/80 md:text-[10px]">
              Cinematic Stories
            </span>
          </div>
          {copy.heroSlogan?.trim() && (
            <h1 className="max-w-3xl text-balance font-display text-3xl font-light leading-[1.15] tracking-[0.04em] text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
              {copy.heroSlogan}
            </h1>
          )}
          <p className="mt-5 max-w-xl text-sm leading-7 text-foreground/65 md:text-base">
            {activeVideo?.subtitle ||
              '让影像在时间里流动，让每一次按下快门都有回声。'}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            {activeVideo ? (
              <button
                type="button"
                onClick={() => setPlayerOpen(true)}
                className="group inline-flex min-h-11 items-center gap-3 rounded-full border border-foreground/20 bg-background/30 px-6 text-[10px] font-medium tracking-[0.24em] text-foreground/85 backdrop-blur-md transition-all duration-300 hover:border-primary/70 hover:text-primary"
              >
                <Play size={14} strokeWidth={1.5} />
                播放视频
              </button>
            ) : (
              <UniversalLink
                to="/works/videos"
                className="group inline-flex min-h-11 items-center gap-3 rounded-full border border-foreground/20 bg-background/30 px-6 text-[10px] font-medium tracking-[0.24em] text-foreground/85 backdrop-blur-md transition-all duration-300 hover:border-primary/70 hover:text-primary"
              >
                浏览视频
              </UniversalLink>
            )}
            <button
              type="button"
              onClick={scrollToImages}
              className="inline-flex min-h-11 items-center gap-3 px-3 text-[10px] font-medium tracking-[0.2em] text-foreground/50 transition-colors hover:text-primary"
            >
              浏览图片
            </button>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-8 right-6 z-10 hidden items-center gap-4 font-mono text-[8px] uppercase tracking-[0.3em] text-foreground/35 md:flex md:right-12">
        <span>Film 01</span>
        <span className="h-px w-14 bg-foreground/20" />
        <span>Scroll to explore</span>
      </div>

      <VideoPreviewModal
        video={playerOpen && activeVideo ? activeVideo : null}
        onClose={() => setPlayerOpen(false)}
      />
    </section>
  );
};

const ImageShowcaseSection: React.FC = () => {
  const copy = useHomepageCopy();
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: heroSlides = [], isLoading: heroSlidesLoading } = useQuery<HeroSlide[]>({
    queryKey: ['hero-slides', 'active'],
    queryFn: () => getHeroSlides(true),
    staleTime: 60 * 1000,
    retry: 1,
  });
  const { data: featuredImages = [], isLoading: featuredImagesLoading } = useQuery<Artwork[]>({
    queryKey: ['portfolio', 'featured-images-coverflow'],
    queryFn: () => getFeaturedImages(12),
    staleTime: 60 * 1000,
    retry: 1,
  });

  const heroImages: ShowcaseImage[] = heroSlides
    .filter((slide) => slide.mediaType === 'image')
    .map((slide) => ({
      id: slide.id,
      src: slide.mediaUrl,
      title: slide.title || '无题',
      subtitle: slide.subtitle,
    }));
  const featuredImageSlides: ShowcaseImage[] = featuredImages.map((artwork) => ({
    id: artwork.id,
    src: artwork.imageUrl,
    title: artwork.title,
    subtitle: artwork.location || artwork.description,
    artwork,
  }));
  const seenSources = new Set<string>();
  const realImages = [...heroImages, ...featuredImageSlides].filter((item) => {
    if (seenSources.has(item.src)) return false;
    seenSources.add(item.src);
    return true;
  });
  const items = realImages.length > 0 ? realImages : PREVIEW_IMAGE_SLIDES;
  const isLoading = heroSlidesLoading || featuredImagesLoading;

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(items.length - 1, 0)));
  }, [items.length]);

  const goTo = useCallback(
    (nextIndex: number) => {
      if (items.length === 0) return;
      setActiveIndex((nextIndex + items.length) % items.length);
    },
    [items.length],
  );
  const goPrev = () => goTo(activeIndex - 1);
  const goNext = () => goTo(activeIndex + 1);

  const current = items[activeIndex];
  const previous = items[(activeIndex - 1 + items.length) % items.length];
  const next = items[(activeIndex + 1) % items.length];
  const previousFar = items[(activeIndex - 2 + items.length) % items.length];
  const nextFar = items[(activeIndex + 2) % items.length];
  const lightboxImages: LightboxImage[] = items.map((item) => ({
    src: item.src,
    alt: item.title,
    caption: item.subtitle,
    artwork: item.artwork,
  }));

  const openCurrent = () => {
    if (!current) return;
    setLightboxIndex(activeIndex);
    if (current.artwork) {
      incrementArtworkView(current.artwork.id).catch(() => {});
    }
  };

  const motionTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.58, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <section
      id="image-works"
      className="image-showcase-stage relative overflow-hidden py-9 md:py-12"
    >
      <SectionMotif variant="moon-ridge" />
      <div className="relative z-10 mx-auto flex max-w-[110rem] flex-col items-center gap-4 px-6 text-center md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={motionTransition}
        >
          {copy.imageWorksTitle?.trim() && (
            <h2 className="font-display text-2xl font-light tracking-[0.04em] text-foreground md:text-3xl">
              {copy.imageWorksTitle}
            </h2>
          )}
        </motion.div>
        <UniversalLink
          to="/works/photos"
          className="group inline-flex w-fit items-center gap-3 text-[10px] font-medium tracking-[0.2em] text-foreground/55 transition-colors hover:text-primary"
        >
          查看全部图片
          <span className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </UniversalLink>
      </div>

      <div className="relative mx-auto mt-6 h-[clamp(11rem,22vw,18rem)] w-full max-w-[110rem] md:mt-8">
        {items.length > 1 && previousFar && (
          <motion.button
            key={`previous-far-${previousFar.id}`}
            type="button"
            initial={{ opacity: 0, x: reducedMotion ? 0 : -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={motionTransition}
            onClick={() => goTo(activeIndex - 2)}
            aria-label={`查看更早图片：${previousFar.title}`}
            className="group absolute -left-[15%] top-[23%] z-[8] h-[55%] w-[27%] overflow-hidden border border-foreground/[0.06] bg-muted/20 opacity-[0.10] blur-[1.5px] transition-opacity duration-500 hover:opacity-[0.24] md:left-[7%] md:w-[13%] md:opacity-[0.16]"
          >
            <Image
              src={previousFar.src}
              alt=""
              fill
              sizes="16vw"
              className="object-cover"
            />
            <span className="absolute inset-0 bg-background/50" />
          </motion.button>
        )}

        {items.length > 1 && previous && (
          <motion.button
            key={`previous-${previous.id}`}
            type="button"
            initial={{ opacity: 0, x: reducedMotion ? 0 : -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={motionTransition}
            onClick={() => goTo(activeIndex - 1)}
            aria-label={`查看上一张：${previous.title}`}
            className="group absolute -left-[5%] top-[12%] z-10 h-[76%] w-[31%] overflow-hidden border border-foreground/10 bg-muted/30 opacity-20 transition-opacity duration-500 hover:opacity-50 md:left-[17.5%] md:w-[18%] md:opacity-35"
          >
            <Image
              src={previous.src}
              alt=""
              fill
              sizes="18vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
            />
            <span className="absolute inset-0 bg-background/35" />
          </motion.button>
        )}

        {current && (
          <motion.button
            key={`current-${current.id}`}
            type="button"
            initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.975 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={motionTransition}
            onClick={openCurrent}
            aria-label={`查看图片信息：${current.title}`}
            className={cn(
              'group absolute left-1/2 top-0 z-20 h-full w-[68%] -translate-x-1/2 cursor-zoom-in overflow-hidden border border-foreground/15 bg-muted/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary md:w-[38%]',
            )}
          >
            <Image
              src={current.src}
              alt={current.title}
              fill
              priority
              sizes="(max-width: 768px) 68vw, 38vw"
              className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.018]"
            />
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/5" />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-left md:p-5">
              <span>
                <span className="block h-px w-8 bg-primary/80" />
                <span className="mt-2 block font-display text-lg font-light text-foreground md:text-2xl">
                  {current.title}
                </span>
                {current.subtitle && (
                  <span className="mt-1 block max-w-md text-[10px] leading-4 text-foreground/60 md:text-xs">
                    {current.subtitle}
                  </span>
                )}
              </span>
              <span className="hidden shrink-0 font-mono text-[9px] tracking-[0.24em] text-foreground/45 sm:block">
                {String(activeIndex + 1).padStart(2, '0')} /{' '}
                {String(items.length).padStart(2, '0')}
              </span>
            </span>
          </motion.button>
        )}

        {items.length > 1 && next && (
          <motion.button
            key={`next-${next.id}`}
            type="button"
            initial={{ opacity: 0, x: reducedMotion ? 0 : 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={motionTransition}
            onClick={() => goTo(activeIndex + 1)}
            aria-label={`查看下一张：${next.title}`}
            className="group absolute -right-[5%] top-[12%] z-10 h-[76%] w-[31%] overflow-hidden border border-foreground/10 bg-muted/30 opacity-20 transition-opacity duration-500 hover:opacity-50 md:right-[17.5%] md:w-[18%] md:opacity-35"
          >
            <Image
              src={next.src}
              alt=""
              fill
              sizes="18vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
            />
            <span className="absolute inset-0 bg-background/35" />
          </motion.button>
        )}

        {items.length > 1 && nextFar && (
          <motion.button
            key={`next-far-${nextFar.id}`}
            type="button"
            initial={{ opacity: 0, x: reducedMotion ? 0 : 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={motionTransition}
            onClick={() => goTo(activeIndex + 2)}
            aria-label={`查看更后图片：${nextFar.title}`}
            className="group absolute -right-[15%] top-[23%] z-[8] h-[55%] w-[27%] overflow-hidden border border-foreground/[0.06] bg-muted/20 opacity-[0.10] blur-[1.5px] transition-opacity duration-500 hover:opacity-[0.24] md:right-[7%] md:w-[13%] md:opacity-[0.16]"
          >
            <Image
              src={nextFar.src}
              alt=""
              fill
              sizes="16vw"
              className="object-cover"
            />
            <span className="absolute inset-0 bg-background/50" />
          </motion.button>
        )}

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="上一张图片"
              className="absolute left-1 top-1/2 z-40 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-foreground/20 bg-background/65 text-foreground/70 backdrop-blur-md transition-all duration-300 hover:border-primary/70 hover:text-primary md:left-[21%] md:h-10 md:w-10"
            >
              <ChevronLeft size={18} strokeWidth={1.4} />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="下一张图片"
              className="absolute right-1 top-1/2 z-40 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-foreground/20 bg-background/65 text-foreground/70 backdrop-blur-md transition-all duration-300 hover:border-primary/70 hover:text-primary md:right-[21%] md:h-10 md:w-10"
            >
              <ChevronRight size={18} strokeWidth={1.4} />
            </button>
          </>
        )}
      </div>

      <p className="mx-auto mt-3 max-w-[110rem] px-6 text-center font-mono text-[8px] uppercase tracking-[0.3em] text-foreground/30 md:px-12">
        {isLoading ? 'Loading selected photography' : 'Use the arrows to explore'}
      </p>

      <ImageLightbox
        images={lightboxImages}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={(index) => setLightboxIndex(index)}
      />
    </section>
  );
};

/* ---------- Selected Series ---------- */

const SelectedSeriesSection: React.FC = () => {
  const copy = useHomepageCopy();
  const { data, isLoading, error } = useQuery<Series[]>({
    queryKey: ['portfolio', 'featured-series'],
    queryFn: () => getFeaturedSeries('image'),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    throwOnError: (err) => {
      logger.error('获取精选系列失败', err);
      return false;
    },
  });

  return (
    <section
      id="image-series"
      className="relative overflow-hidden pt-0 pb-24 md:pb-32"
    >
      <SectionMotif variant="contour" />
      <SectionMotif variant="dune-field" />
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewConfig}
        variants={fadeInUp}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 mx-auto mb-16 max-w-3xl px-6 text-center md:mb-20 md:px-12"
      >
        {copy.imageSeriesTitle?.trim() && (
          <h2 className="text-balance font-display text-2xl font-light italic text-foreground sm:text-3xl md:text-5xl">
            「{copy.imageSeriesTitle}」
          </h2>
        )}
        {copy.imageSeriesSubtitle?.trim() && (
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            {copy.imageSeriesSubtitle}
          </p>
        )}
      </motion.div>

      {isLoading && <SeriesSkeleton />}

      {error && (
        <p className="text-center text-sm text-muted-foreground">
          加载失败，请稍后重试
        </p>
      )}

      {data && data.length > 0 && (
        <div className="relative z-10 grid w-full grid-cols-1 gap-0 sm:grid-cols-2 md:grid-cols-3">
          {data.map((series: Series, index: number) => (
            <motion.div
              key={series.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px 0px' }}
              variants={fadeInUp}
              transition={{
                duration: 0.7,
                ease: 'easeOut',
                delay: index * 0.08,
              }}
            >
              <Link
                to={`/series/${series.slug || series.id}`}
                className="gallery-tile group relative block aspect-[3/4] w-full overflow-hidden bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`查看系列 ${series.titleZh}`}
              >
                {series.coverUrl && (
                  <Image
                    src={series.coverUrl}
                    alt={series.titleZh}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33.33vw"
                    className="object-cover transition-all duration-700 ease-out group-hover:scale-[1.04]"
                  />
                )}

                <div className="absolute inset-0 bg-black/0 transition-all duration-500 group-hover:bg-black/25" />

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 text-left md:p-7">
                  <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-white/60 drop-shadow-sm md:text-xs">
                    {series.artworkCount || 0} works
                    {series.yearStart ? ` · ${series.yearStart}${series.yearEnd ? `–${series.yearEnd}` : ''}` : ''}
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-light italic text-white drop-shadow-md transition-transform duration-500 md:text-4xl group-hover:translate-y-[-2px]">
                    {series.titleEn}
                  </h3>
                  <p className="mt-1 text-sm text-white/80 drop-shadow-sm md:text-base">
                    {series.titleZh}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {data && data.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          暂无精选系列
        </p>
      )}
    </section>
  );
};

/* ---------- Video Section ---------- */

const VideoPlayerModal: React.FC<{
  artwork: Artwork | null;
  onClose: () => void;
}> = ({ artwork, onClose }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!artwork || downloading) return;
    setDownloading(true);
    try {
      const clean = artwork.imageUrl.split('?')[0].split('#')[0];
      const match = clean.match(/\.([a-zA-Z0-9]+)$/);
      const ext = match ? match[1].toLowerCase() : 'mp4';
      const fileName = `${artwork.title || 'video'}.${ext}`;
      const response = await fetch(artwork.imageUrl, { mode: 'cors' });
      if (!response.ok) throw new Error(`下载失败: ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      toast.success('下载成功', { description: fileName });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '下载失败';
      toast.error('下载失败', { description: msg });
      logger.error('[VideoModal] download failed:', err);
    } finally {
      setDownloading(false);
    }
  }, [artwork, downloading]);

  return (
    <AnimatePresence>
      {artwork && (
        <motion.div
          key="video-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-5xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top right controls */}
            <div className="absolute -top-12 right-0 z-10 flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex h-10 w-10 items-center justify-center text-white/70 transition-colors hover:text-white disabled:opacity-50"
                aria-label={downloading ? '下载中' : '下载视频'}
              >
                {downloading ? (
                  <ShutterSpinner size={22} className="animate-spin" />
                ) : (
                  <Download size={22} strokeWidth={1.5} />
                )}
              </button>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center text-white/70 transition-colors hover:text-white"
                aria-label="关闭视频"
              >
                <X size={28} strokeWidth={1.5} />
              </button>
            </div>

            <video
              src={artwork.imageUrl}
              controls
              autoPlay
              playsInline
              className="w-full rounded-sm bg-black"
            />
            <p className="mt-4 font-display text-xl font-light text-white/90">
              {artwork.title}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const VideoSkeleton: React.FC = () => (
  <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-6 sm:grid-cols-2 md:gap-5 md:px-12 lg:grid-cols-3">
    {[0, 1, 2, 3, 4, 5].map((i: number) => (
      <div key={i} className="aspect-video w-full animate-pulse rounded-sm bg-muted" />
    ))}
  </div>
);

const VideoSection: React.FC = () => {
  const copy = useHomepageCopy();
  const videoTitle =
    copy.videoWorksTitle?.trim() ||
    copy.videoWorksSubtitle?.trim() ||
    '视频作品';
  const videoDescription = copy.videoWorksTitle?.trim()
    ? copy.videoWorksSubtitle?.trim()
    : '';
  const { data, isLoading, error } = useQuery<Artwork[]>({
    queryKey: ['portfolio', 'featured-videos'],
    queryFn: () => getFeaturedVideos(6),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    throwOnError: (err) => {
      logger.error('获取视频作品失败', err);
      return false;
    },
  });

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  const lightboxImages: LightboxImage[] = data
    ? data.map((a: Artwork) => ({
        src: a.imageUrl,
        alt: a.title,
        caption: a.location || undefined,
        artwork: a,
      }))
    : [];

  const handleMouseEnter = (id: string) => {
    const video = videoRefs.current.get(id);
    if (video) video.play().catch(() => {});
  };

  const handleMouseLeave = (id: string) => {
    const video = videoRefs.current.get(id);
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  };

  const handleDownload = async (artwork: Artwork, e: React.MouseEvent) => {
    e.stopPropagation();
    const clean = artwork.imageUrl.split('?')[0].split('#')[0];
    const match = clean.match(/\.([a-zA-Z0-9]+)$/);
    const ext = match ? match[1].toLowerCase() : 'mp4';
    const fileName = `${artwork.title || 'video'}.${ext}`;
    try {
      const response = await fetch(artwork.imageUrl, { mode: 'cors' });
      if (!response.ok) throw new Error(`下载失败: ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      toast.success('下载成功', { description: fileName });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '下载失败';
      toast.error('下载失败', { description: msg });
      logger.error('[VideoSection] download failed:', err);
    }
  };

  return (
    <section
      id="video-works"
      className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-20"
    >
      <SectionMotif variant="cine-ribbon" />
      <SectionMotif variant="wave-field" />
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewConfig}
        variants={fadeInUp}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 mx-auto mb-16 max-w-3xl px-6 text-center md:mb-20 md:px-12"
      >
        <h2 className="text-balance font-display text-2xl font-light text-foreground sm:text-3xl md:text-5xl">
          {videoTitle}
        </h2>
        {videoDescription && (
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            {videoDescription}
          </p>
        )}
      </motion.div>

      {isLoading && <VideoSkeleton />}

      {error && (
        <p className="text-center text-sm text-muted-foreground">
          加载失败，请稍后重试
        </p>
      )}

      {data && data.length > 0 && (
        <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-6 sm:grid-cols-2 md:gap-5 md:px-12 lg:grid-cols-3">
          {data.map((video: Artwork, index: number) => (
            <motion.div
              key={video.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px 0px' }}
              variants={fadeInUp}
              transition={{
                duration: 0.7,
                ease: 'easeOut',
                delay: index * 0.08,
              }}
              className="group"
            >
              <button
                onClick={() => {
                  const idx = lightboxImages.findIndex(
                    (img: LightboxImage) => img.artwork?.id === video.id,
                  );
                  if (idx >= 0) setLightboxIndex(idx);
                  incrementArtworkView(video.id).catch(() => {});
                }}
                onMouseEnter={() => handleMouseEnter(video.id)}
                onMouseLeave={() => handleMouseLeave(video.id)}
                className="relative block w-full overflow-hidden rounded-sm bg-black text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`播放视频 ${video.title}`}
              >
                <div className="aspect-video w-full">
                  <video
                    ref={(el) => {
                      if (el) {
                        videoRefs.current.set(video.id, el);
                      } else {
                        videoRefs.current.delete(video.id);
                      }
                    }}
                    src={video.imageUrl}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                </div>

                {/* Top left: duration + quality badge */}
                <div className="absolute left-3 top-3 flex items-center gap-2">
                  {video.durationSeconds && video.durationSeconds > 0 && (
                    <span className="rounded-sm bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                      {formatDuration(video.durationSeconds)}
                    </span>
                  )}
                  {video.quality && (
                    <span className="rounded-sm bg-black/60 px-2 py-0.5 text-[11px] font-medium tracking-wider text-white backdrop-blur-sm">
                      {video.quality}
                    </span>
                  )}
                </div>

                {/* Bottom right: action buttons (reveal on hover) */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-0 transition-all duration-300 group-hover:opacity-100">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleDownload(video, e)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleDownload(video, e as unknown as React.MouseEvent);
                      }
                    }}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-primary"
                    aria-label={`下载视频 ${video.title}`}
                  >
                    <Download size={14} strokeWidth={1.5} />
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-primary">
                    <Maximize2 size={14} strokeWidth={1.5} />
                  </span>
                </div>

                {/* Bottom gradient for text readability */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                {/* Title */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
                  <h3 className="font-display text-lg font-light text-white drop-shadow-md md:text-xl">
                    {video.title}
                  </h3>
                  {video.location && (
                    <p className="mt-0.5 text-xs text-white/70 drop-shadow-sm">
                      {video.location}
                    </p>
                  )}
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {data && data.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          暂无视频作品
        </p>
      )}

      <ImageLightbox
        images={lightboxImages}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </section>
  );
};

/* ---------- Video Series ---------- */

const VideoSeriesSection: React.FC = () => {
  const copy = useHomepageCopy();
  const { data, isLoading, error } = useQuery<Series[]>({
    queryKey: ['portfolio', 'featured-video-series'],
    queryFn: () => getFeaturedSeries('video'),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    throwOnError: (err) => {
      logger.error('获取视频精选系列失败', err);
      return false;
    },
  });

  if (!isLoading && !error && (!data || data.length === 0)) return null;

  return (
    <section
      id="video-series"
      className="pt-0 pb-24 md:pb-32"
    >
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewConfig}
        variants={fadeInUp}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="mx-auto mb-16 max-w-3xl px-6 text-center md:mb-20 md:px-12"
      >
        {copy.videoSeriesTitle?.trim() && (
          <h2 className="text-balance font-display text-2xl font-light italic text-foreground sm:text-3xl md:text-5xl">
            「{copy.videoSeriesTitle}」
          </h2>
        )}
        {copy.videoSeriesSubtitle?.trim() && (
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            {copy.videoSeriesSubtitle}
          </p>
        )}
      </motion.div>

      {isLoading && <SeriesSkeleton />}

      {error && (
        <p className="text-center text-sm text-muted-foreground">
          加载失败，请稍后重试
        </p>
      )}

      {data && data.length > 0 && (
        <div className="grid w-full grid-cols-1 gap-0 sm:grid-cols-2 md:grid-cols-3">
          {data.map((series: Series, index: number) => (
            <motion.div
              key={series.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px 0px' }}
              variants={fadeInUp}
              transition={{
                duration: 0.7,
                ease: 'easeOut',
                delay: index * 0.08,
              }}
            >
              <Link
                to={`/series/${series.slug || series.id}`}
                className="gallery-tile group relative block aspect-[3/4] w-full overflow-hidden bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`查看视频系列 ${series.titleZh}`}
              >
                {series.coverUrl && (
                  <Image
                    src={series.coverUrl}
                    alt={series.titleZh}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33.33vw"
                    className="object-cover transition-all duration-700 ease-out group-hover:scale-[1.04]"
                  />
                )}

                <div className="absolute inset-0 bg-black/0 transition-all duration-500 group-hover:bg-black/25" />

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="absolute bottom-0 left-0 right-0 z-10 p-6 text-white md:p-8">
                  <p className="font-display text-xs tracking-[0.3em] text-white/60 md:text-sm">
                    {series.yearStart || ''}
                    {series.yearEnd && series.yearEnd !== series.yearStart
                      ? ` — ${series.yearEnd}`
                      : ''}
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-light md:text-3xl">
                    {series.titleZh}
                  </h3>
                  <p className="mt-1 text-sm text-white/70">{series.titleEn}</p>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-px w-0 bg-primary transition-all duration-500 group-hover:w-full" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
};

/* ---------- More Video Series ---------- */

const MoreVideoSeriesSection: React.FC = () => {
  const copy = useHomepageCopy();
  const { data, isLoading, error } = useQuery({
    queryKey: ['portfolio', 'all-video-series'],
    queryFn: () => getSeriesList('video'),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    throwOnError: (err) => {
      logger.error('获取视频系列失败', err);
      return false;
    },
  });

  const seriesItems = data?.items.filter((s: Series) => !!s.coverUrl) || [];

  if (!isLoading && !error && seriesItems.length <= 3) return null;

  const rest = seriesItems.slice(3);

  return (
    <section id="video-more-series" className="mx-auto max-w-7xl px-6 py-24 md:px-12 md:py-32">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewConfig}
        variants={fadeInUp}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <SectionTitle title={copy.videoCategoriesTitle} />
      </motion.div>

      {isLoading && <CategorySkeleton />}

      {error && (
        <p className="text-center text-sm text-muted-foreground">
          加载失败，请稍后重试
        </p>
      )}

      {rest.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {rest.map((series: Series, index: number) => (
            <motion.div
              key={series.id}
              initial="hidden"
              whileInView="visible"
              viewport={viewConfig}
              variants={fadeInUp}
              transition={{
                duration: 0.7,
                ease: 'easeOut',
                delay: index * 0.1,
              }}
            >
              <Link
                to={`/series/${series.slug || series.id}`}
                className="gallery-tile group relative block aspect-[4/3] overflow-hidden"
                aria-label={`查看视频系列 ${series.titleZh}`}
              >
                {series.coverUrl && (
                  <Image
                    src={series.coverUrl}
                    alt={series.titleZh}
                    fill
                    sizes="(max-width: 768px) 100vw, 33.33vw"
                    className="object-cover transition-all duration-700 group-hover:scale-[1.03]"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent transition-opacity duration-500 group-hover:from-foreground/80" />
                <div className="absolute bottom-0 left-0 right-0 z-10 block p-6 text-white">
                  <h3 className="font-display text-2xl font-light md:text-3xl">
                    {series.titleEn}
                  </h3>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm text-white/70">{series.titleZh}</span>
                    <span className="tnum text-xs text-white/60">
                      {series.artworkCount || 0} works
                    </span>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-px w-0 bg-primary transition-all duration-500 group-hover:w-full" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
};

/* ---------- More Image Series ---------- */

const MoreImageSeriesSection: React.FC = () => {
  const copy = useHomepageCopy();
  const { data, isLoading, error } = useQuery({
    queryKey: ['portfolio', 'all-image-series'],
    queryFn: () => getSeriesList('image'),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    throwOnError: (err) => {
      logger.error('获取图片系列失败', err);
      return false;
    },
  });

  const seriesItems = data?.items.filter((s: Series) => !!s.coverUrl) || [];

  if (!isLoading && !error && seriesItems.length <= 4) return null;

  const rest = seriesItems.slice(4);

  return (
    <section id="image-more-series" className="mx-auto max-w-7xl px-6 py-24 md:px-12 md:py-32">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewConfig}
        variants={fadeInUp}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <SectionTitle title={copy.imageCategoriesTitle} />
      </motion.div>

      {isLoading && <CategorySkeleton />}

      {error && (
        <p className="text-center text-sm text-muted-foreground">
          加载失败，请稍后重试
        </p>
      )}

      {rest.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {rest.map((series: Series, index: number) => (
            <motion.div
              key={series.id}
              initial="hidden"
              whileInView="visible"
              viewport={viewConfig}
              variants={fadeInUp}
              transition={{
                duration: 0.7,
                ease: 'easeOut',
                delay: index * 0.1,
              }}
            >
              <Link
                to={`/series/${series.slug || series.id}`}
                className="gallery-tile group relative block aspect-[4/3] overflow-hidden"
                aria-label={`查看图片系列 ${series.titleZh}`}
              >
                {series.coverUrl && (
                  <Image
                    src={series.coverUrl}
                    alt={series.titleZh}
                    fill
                    sizes="(max-width: 768px) 100vw, 33.33vw"
                    className="object-cover transition-all duration-700 group-hover:scale-[1.03]"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent transition-opacity duration-500 group-hover:from-foreground/80" />
                <div className="absolute bottom-0 left-0 right-0 z-10 block p-6 text-white">
                  <h3 className="font-display text-2xl font-light md:text-3xl">
                    {series.titleEn}
                  </h3>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm text-white/70">{series.titleZh}</span>
                    <span className="tnum text-xs text-white/60">
                      {series.artworkCount || 0} works
                    </span>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-px w-0 bg-primary transition-all duration-500 group-hover:w-full" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
};

/* ---------- Stats ---------- */

const StatsSection: React.FC = () => {
  const copy = useHomepageCopy();
  const { data } = useSiteStats();

  const views = data?.totalViews ?? 0;
  const artworks = data?.totalArtworks ?? 0;
  const cities = data?.citiesVisited ?? 0;
  const countries = data?.countriesVisited ?? 0;

  const stats = [
    { value: views, label: '作品浏览量' },
    { value: artworks, label: copy.statsArtworksLabel },
    { value: cities, label: copy.statsCitiesLabel },
    { value: countries, label: copy.statsCountriesLabel },
  ];

  return (
    <section className="stats-stage py-[3.6rem] md:py-[4.8rem]">
      <span className="stats-light-sweep" aria-hidden="true" />
      <SectionMotif variant="orbit" />
      <SectionMotif variant="metric-ridge" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-8">
          {stats.map((stat, index: number) => (
            <motion.div
              key={stat.label || index}
              initial="hidden"
              whileInView="visible"
              viewport={viewConfig}
              variants={fadeInUp}
              transition={{
                duration: 0.7,
                ease: 'easeOut',
                delay: index * 0.1,
              }}
              className="text-center"
            >
              <AnimatedNumber value={stat.value} />
              {stat.label?.trim() && (
                <p className="mt-3 text-xs font-medium tracking-[0.2em] text-muted-foreground md:text-sm">
                  {stat.label}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ---------- Journey timeline ---------- */

const JourneySection: React.FC = () => {
  const copy = useHomepageCopy();
  const entries = buildJourneyEntries(copy);

  if (entries.length === 0) return null;

  return (
    <section
      id="journey"
      className="overflow-hidden border-y border-border/70 bg-background py-24 md:py-32"
    >
      <SectionMotif variant="canyon" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewConfig}
          variants={fadeInUp}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="mb-14 md:mb-20"
        >
          <h2 className="text-center font-display text-3xl font-light md:text-5xl">
            时间历程
          </h2>
        </motion.div>
      </div>

      <div className="relative z-10 overflow-x-auto pb-4">
        <div
          className="relative mx-auto grid min-w-[980px] max-w-[1500px] px-12"
          style={{
            gridTemplateColumns: `repeat(${entries.length}, minmax(130px, 1fr))`,
          }}
        >
          <span className="absolute left-12 right-12 top-[76px] border-t border-dashed border-primary/35" />
          {entries.map((entry, index) => (
            <motion.article
              key={`${entry.year}-${entry.category}-${entry.text}`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px 0px' }}
              transition={{
                duration: 0.6,
                delay: index * 0.06,
                ease: 'easeOut',
              }}
              className="relative min-h-[300px] origin-top border-r border-border/35 px-5 transition-[transform,background-color] duration-300 ease-out last:border-r-0 hover:z-10 hover:scale-[1.025] hover:bg-foreground/[0.025] will-change-transform"
            >
              <div className="mb-9 flex items-center justify-between">
                <span className="font-display text-3xl font-light text-primary/80 md:text-4xl">
                  {entry.year}
                </span>
                <span className="font-mono text-[8px] tracking-[0.22em] text-muted-foreground/50">
                  {entry.category}
                </span>
              </div>
              <span className="absolute right-5 top-[69px] h-3 w-3 rotate-45 border border-primary/70 bg-background" />
              <p className="timeline-copy max-h-[190px] font-display text-base leading-7 tracking-[0.16em] text-foreground/72 md:text-lg">
                {entry.text}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ---------- Travel Map ---------- */

const MapSection: React.FC = () => {
  const copy = useHomepageCopy();

  return (
    <section className="cta-stage py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6 md:px-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewConfig}
          variants={fadeInUp}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="mb-12 text-center md:mb-16"
        >
          <h2 className="font-display text-2xl font-medium leading-tight md:text-4xl">
            光影足迹
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[color:var(--text)] opacity-60 md:text-base">
            {copy.statsTitle}
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewConfig}
          variants={fadeInUp}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
        >
          <TravelMap className="mx-auto" />
        </motion.div>
      </div>
    </section>
  );
};

/* ---------- CTA ---------- */

const CTASection: React.FC = () => {
  const copy = useHomepageCopy();
  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: getSiteSettings,
    staleTime: 60_000,
  });
  const socialLinks = [
    { key: 'xiaohongshuUrl', label: '小红书' },
    { key: 'douyinUrl', label: '抖音' },
    { key: 'weiboUrl', label: '微博' },
    { key: 'instagramUrl', label: 'Instagram' },
    { key: 'ctripUrl', label: '携程' },
  ] as const;
  const normalizeUrl = (value: string): string =>
    /^https?:\/\//i.test(value.trim())
      ? value.trim()
      : `https://${value.trim()}`;
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <SectionMotif variant="constellation" />
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center md:px-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewConfig}
          variants={fadeInUp}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {copy.ctaTitle?.trim() && (
            <h2 className="text-balance font-display text-2xl font-light leading-tight text-foreground md:text-4xl">
              {copy.ctaTitle}
            </h2>
          )}

          {copy.ctaSubtitle?.trim() && (
            <p className="mt-6 font-display text-lg italic text-muted-foreground md:text-xl">
              {copy.ctaSubtitle}
            </p>
          )}

          {copy.ctaButtonText?.trim() && (
            <UniversalLink
              to="/cooperation"
              className="mt-10 inline-block font-display text-xl text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline md:text-2xl"
            >
              {copy.ctaButtonText}
            </UniversalLink>
          )}

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {socialLinks.map(({ key, label }) => {
              const value = settings?.[key]?.trim();
              if (!value) return null;
              return (
                <UniversalLink
                  key={key}
                  to={normalizeUrl(value)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium tracking-[0.2em] text-foreground/60 transition-colors hover:text-primary"
                >
                  {label}
                </UniversalLink>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

/* ---------- Page ---------- */

const HomePage: React.FC = () => {
  return (
    <div className="bg-background text-foreground">
      <div>
        <VideoHeroSection />
        <ImageShowcaseSection />

        <SelectedSeriesSection />
        <MoreImageSeriesSection />

        <VideoSection />
        <VideoSeriesSection />
        <MoreVideoSeriesSection />
        <StatsSection />
        <JourneySection />
        <MapSection />
        <CTASection />
      </div>
    </div>
  );
};

export default HomePage;

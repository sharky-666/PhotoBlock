import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Download, Film, X } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import Image from '@client/src/components/ui/image';
import { cn } from '@client/src/lib/utils';
import ShutterSpinner from '@client/src/components/ui/shutter-spinner';
import type { Artwork } from '@shared/api.interface';

export interface LightboxProps {
  images: Artwork[];
  index: number;
  open: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

const Lightbox: React.FC<LightboxProps> = ({
  images,
  index,
  open,
  onClose,
  onIndexChange,
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const prevOverflow = useRef<string>('');

  const current = images[index];
  const total = images.length;
  const hasPrev = index > 0;
  const hasNext = index < total - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) {
      onIndexChange(index - 1);
      setImgLoaded(false);
    }
  }, [hasPrev, index, onIndexChange]);

  const goNext = useCallback(() => {
    if (hasNext) {
      onIndexChange(index + 1);
      setImgLoaded(false);
    }
  }, [hasNext, index, onIndexChange]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    prevOverflow.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    logger.debug('[Lightbox] opened, body scroll locked');
    return () => {
      document.body.style.overflow = prevOverflow.current;
      logger.debug('[Lightbox] closed, body scroll restored');
    };
  }, [open]);

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose, goPrev, goNext]);

  // Reset load state when index changes
  useEffect(() => {
    setImgLoaded(false);
  }, [index]);

  const getFileExtension = (url: string): string => {
    const clean = url.split('?')[0].split('#')[0];
    const match = clean.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1].toLowerCase() : '';
  };

  const getDownloadFileName = (artwork: Artwork): string => {
    const baseName = artwork.title?.trim() || 'artwork';
    const ext = getFileExtension(artwork.imageUrl);
    if (ext) return `${baseName}.${ext}`;
    if (artwork.mediaType === 'video') return `${baseName}.mp4`;
    return `${baseName}.jpg`;
  };

  const handleDownload = useCallback(async () => {
    if (!current || downloading) return;
    setDownloading(true);
    try {
      const fileName = getDownloadFileName(current);
      const response = await fetch(current.imageUrl, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`下载失败: ${response.status}`);
      }
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
      logger.debug('[Lightbox] downloaded:', fileName);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '下载失败';
      toast.error('下载失败', { description: msg });
      logger.error('[Lightbox] download failed:', err);
    } finally {
      setDownloading(false);
    }
  }, [current, downloading]);

  if (!current) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="lightbox-backdrop fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-label="图片浏览"
        >
          {/* Top right controls */}
          <div className="absolute right-4 top-4 z-30 flex items-center gap-2 md:right-6 md:top-6">
            <button
              type="button"
              aria-label={downloading ? '下载中' : '下载原图'}
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              disabled={downloading}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 md:h-12 md:w-12"
            >
              {downloading ? (
                <ShutterSpinner size={22} className="animate-spin text-primary-tint" />
              ) : (
                <Download size={22} strokeWidth={1.5} />
              )}
            </button>
            <button
              type="button"
              aria-label="关闭"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white md:h-12 md:w-12"
            >
              <X size={24} strokeWidth={1.5} />
            </button>
          </div>

          {/* Prev button */}
          {hasPrev && (
            <button
              type="button"
              aria-label="上一张"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-white/70 transition-all hover:bg-white/10 hover:text-white md:left-8 md:h-14 md:w-14"
            >
              <ChevronLeft size={28} strokeWidth={1.5} />
            </button>
          )}

          {/* Next button */}
          {hasNext && (
            <button
              type="button"
              aria-label="下一张"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-white/70 transition-all hover:bg-white/10 hover:text-white md:right-8 md:h-14 md:w-14"
            >
              <ChevronRight size={28} strokeWidth={1.5} />
            </button>
          )}

          {/* Image container */}
          <div
            className="relative flex max-h-[85vh] w-full max-w-[90vw] items-center justify-center px-16 md:px-24"
            onClick={(e) => e.stopPropagation()}
          >
              <motion.div
                className="relative flex w-full items-center justify-center"
                initial={{ opacity: 0, scale: 0.92, filter: 'blur(8px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.92, filter: 'blur(8px)' }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {current.mediaType === 'video' ? (
                  <video
                    src={current.imageUrl}
                    className="max-h-[85vh] w-auto max-w-full object-contain"
                    controls
                    autoPlay
                    playsInline
                  />
                ) : (
                  <Image
                    src={current.imageUrl}
                    alt={current.title || '作品'}
                    className={cn(
                      'max-h-[85vh] w-auto max-w-full object-contain',
                      imgLoaded ? 'opacity-100' : 'opacity-0',
                    )}
                    style={{
                      transition: 'opacity 0.6s ease-out',
                      maxHeight: '85vh',
                    }}
                    onLoad={() => setImgLoaded(true)}
                    priority
                  />
                )}
              </motion.div>
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-6 left-0 right-0 z-30 flex items-center justify-center gap-4 px-6 text-center text-white/80 md:bottom-8">
            {current.title && (
              <span className="flex items-center gap-2 text-sm text-white/90 md:text-base">
                {current.mediaType === 'video' && (
                  <Film size={14} strokeWidth={1.5} className="shrink-0" />
                )}
                {current.title}
              </span>
            )}
            <span className="tnum text-xs text-white/60 md:text-sm">
              {index + 1} / {total}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Lightbox;

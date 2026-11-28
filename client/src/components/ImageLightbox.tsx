import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Info } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Button } from '@client/src/components/ui/button';
import { cn } from '@client/src/lib/utils';
import ShutterSpinner from '@client/src/components/ui/shutter-spinner';
import {
  formatDuration,
  formatFileSize,
} from '@client/src/utils/media-metadata';
import type { Artwork } from '@shared/api.interface';

export interface LightboxImage {
  src: string;
  alt: string;
  caption?: string;
  artwork?: Artwork;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 3;
const SCALE_STEP = 0.15;
const ZOOM_IN_SCALE = 2;

const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  index,
  onClose,
  onIndexChange,
}) => {
  const isOpen = index !== null;
  const currentImage = index !== null ? images[index] : null;
  const [loaded, setLoaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  const artwork = currentImage?.artwork;
  const isVideo = artwork?.mediaType === 'video';

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const goPrev = useCallback(() => {
    if (index === null || images.length <= 1) return;
    setLoaded(false);
    resetZoom();
    onIndexChange((index - 1 + images.length) % images.length);
  }, [index, images.length, onIndexChange, resetZoom]);

  const goNext = useCallback(() => {
    if (index === null || images.length <= 1) return;
    setLoaded(false);
    resetZoom();
    onIndexChange((index + 1) % images.length);
  }, [index, images.length, onIndexChange, resetZoom]);

  useEffect(() => {
    setLoaded(false);
    resetZoom();
  }, [index, resetZoom]);

  useEffect(() => {
    if (!isOpen) return;
    resetZoom();
    setInfoOpen(false);
  }, [isOpen, resetZoom]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isVideo) return;
    const delta = e.deltaY < 0 ? SCALE_STEP : -SCALE_STEP;
    setScale((prev) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev + delta));
      if (next === MIN_SCALE) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  }, [isVideo]);

  const handleDoubleClick = useCallback(() => {
    if (isVideo) return;
    setScale((prev) => {
      if (prev > MIN_SCALE) {
        setPosition({ x: 0, y: 0 });
        return MIN_SCALE;
      }
      return ZOOM_IN_SCALE;
    });
  }, [isVideo]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };

    document.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose, goPrev, goNext]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (scale <= MIN_SCALE || isVideo) return;
      e.preventDefault();
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y,
      };
    },
    [scale, position, isVideo],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPosition({
        x: dragStart.current.posX + dx,
        y: dragStart.current.posY + dy,
      });
    },
    [isDragging],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const getFileExtension = (url: string): string => {
    const clean = url.split('?')[0].split('#')[0];
    const match = clean.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1].toLowerCase() : 'jpg';
  };

  const handleDownload = useCallback(async () => {
    if (!currentImage || downloading) return;
    setDownloading(true);
    try {
      const ext = getFileExtension(currentImage.src);
      const baseName = currentImage.alt?.trim() || 'artwork';
      const fileName = `${baseName}.${ext}`;
      const response = await fetch(currentImage.src, { mode: 'cors' });
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
      logger.debug('[ImageLightbox] downloaded:', fileName);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '下载失败';
      toast.error('下载失败', { description: msg });
      logger.error('[ImageLightbox] download failed:', err);
    } finally {
      setDownloading(false);
    }
  }, [currentImage, downloading]);

  const InfoRow: React.FC<{ label: string; value?: string | null | number }> = ({
    label,
    value,
  }) => {
    if (value === undefined || value === null || value === '') return null;
    return (
      <div className="flex items-start justify-between gap-6 border-b border-border py-2 last:border-b-0">
        <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
          {label}
        </span>
        <span className="tnum break-words text-right text-sm text-foreground">
          {typeof value === 'number' ? String(value) : value}
        </span>
      </div>
    );
  };

  const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="mt-5 mb-1">
      <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {children}
      </span>
    </div>
  );

  const PanelContent: React.FC = () => (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="pb-3">
          {artwork?.quality && (
            <span className="inline-flex rounded-sm bg-foreground/10 px-2 py-0.5 text-[11px] font-medium tracking-wider text-foreground">
              {artwork.quality}
            </span>
          )}
        </div>
        <h2 className="font-display text-2xl font-light leading-tight text-foreground">
          {currentImage?.alt || ''}
        </h2>
        {(artwork?.description || currentImage?.caption) && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {artwork?.description || currentImage?.caption}
          </p>
        )}

        <SectionTitle>基本信息</SectionTitle>
        {artwork ? (
          <>
            <InfoRow
              label="分辨率"
              value={
                artwork.width && artwork.height
                  ? `${artwork.width} × ${artwork.height}`
                  : null
              }
            />
            <InfoRow label="文件大小" value={formatFileSize(artwork.fileSize)} />
            <InfoRow label="拍摄日期" value={artwork.takenAt || null} />
            <InfoRow label="拍摄地点" value={artwork.location || null} />
          </>
        ) : (
          <InfoRow label="作品说明" value={currentImage?.caption || '暂无更多信息'} />
        )}

        {isVideo && (
          <>
            <SectionTitle>视频信息</SectionTitle>
            <InfoRow
              label="时长"
              value={
                artwork?.durationSeconds
                  ? formatDuration(artwork.durationSeconds)
                  : null
              }
            />
            <InfoRow
              label="帧率"
              value={artwork?.fps ? `${artwork.fps} fps` : null}
            />
            <InfoRow
              label="文件格式"
              value={
                currentImage
                  ? getFileExtension(currentImage.src).toUpperCase()
                  : null
              }
            />
          </>
        )}

        {artwork && !isVideo && (
          <>
            <SectionTitle>拍摄参数</SectionTitle>
            <InfoRow label="相机型号" value={artwork?.cameraModel} />
            <InfoRow label="镜头型号" value={artwork?.lensModel} />
            <InfoRow label="光圈" value={artwork?.aperture} />
            <InfoRow label="快门速度" value={artwork?.shutterSpeed} />
            <InfoRow label="ISO" value={artwork?.iso} />
            <InfoRow label="焦距" value={artwork?.focalLength} />
            <InfoRow label="曝光补偿" value={artwork?.exposureCompensation} />
            <InfoRow label="白平衡" value={artwork?.whiteBalance} />
            <InfoRow
              label="文件格式"
              value={
                currentImage
                  ? getFileExtension(currentImage.src).toUpperCase()
                  : null
              }
            />
          </>
        )}
      </div>

      <div className="mt-2 border-t border-border pt-4">
        <Button
          variant="outline"
          className="w-full border-foreground/20 bg-foreground/5 text-foreground hover:bg-foreground/10 hover:text-foreground"
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <ShutterSpinner size={16} className="mr-2 animate-spin text-primary-tint" />
          ) : (
            <Download size={16} strokeWidth={1.5} className="mr-2" />
          )}
          下载原图
        </Button>
      </div>
    </div>
  );

  return createPortal(
    <AnimatePresence>
      {isOpen && currentImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="photo-lightbox fixed inset-0 z-[100] overflow-hidden"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={currentImage.alt}
          data-native-cursor="true"
        >
          <div
            className="pointer-events-none absolute inset-[-5rem] scale-110 bg-cover bg-center opacity-35 blur-3xl"
            style={{ backgroundImage: `url("${currentImage.src}")` }}
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute inset-0 bg-background/45 backdrop-blur-xl" />

          <div className="absolute left-4 top-4 z-30 md:left-6 md:top-6">
            <Button
              variant="ghost"
              className="h-10 gap-2 rounded-full bg-background/55 px-4 text-foreground shadow-lg backdrop-blur-md hover:bg-background/80 hover:text-foreground md:h-11 md:px-5"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              aria-label="返回"
            >
              <ArrowLeft size={18} strokeWidth={2} />
              <span className="text-sm font-medium">返回</span>
            </Button>
          </div>

          <div className="absolute right-4 top-4 z-30 flex items-center gap-2 md:right-6 md:top-6">
            {currentImage && (
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-full bg-background/55 text-foreground shadow-sm backdrop-blur-md hover:bg-background/80 hover:text-foreground md:hidden"
                onClick={(e) => {
                  e.stopPropagation();
                  setInfoOpen((prev) => !prev);
                }}
                aria-label={infoOpen ? '隐藏参数' : '显示参数'}
              >
                <Info size={20} strokeWidth={1.5} />
              </Button>
            )}
          </div>

          <div className="flex h-full w-full md:flex-row">
            <div className="relative flex-1 flex items-center justify-center">
              {images.length > 1 && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute left-2 top-1/2 z-30 -translate-y-1/2 text-foreground/65 hover:bg-foreground/10 hover:text-foreground md:left-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      goPrev();
                    }}
                    aria-label="上一张"
                  >
                    <ChevronLeft size={28} strokeWidth={1.5} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-2 top-1/2 z-30 -translate-y-1/2 text-foreground/65 hover:bg-foreground/10 hover:text-foreground md:right-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      goNext();
                    }}
                    aria-label="下一张"
                  >
                    <ChevronRight size={28} strokeWidth={1.5} />
                  </Button>
                </>
              )}

              <motion.figure
                initial={{ opacity: 0, scale: 0.92, filter: 'blur(8px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.92, filter: 'blur(8px)' }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex h-full w-full max-h-screen max-w-full items-center justify-center p-2 md:p-3"
                onClick={(e) => e.stopPropagation()}
                onWheel={handleWheel}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
              >
                {!loaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShutterSpinner size={40} className="animate-spin text-primary-tint" />
                  </div>
                )}
                <div
                  className="relative flex h-full w-full items-center justify-center"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transformOrigin: 'center center',
                    willChange: 'transform',
                  }}
                  onMouseDown={handleMouseDown}
                  onDoubleClick={handleDoubleClick}
                >
                  {isVideo ? (
                    <video
                      key={currentImage.src}
                      src={currentImage.src}
                      controls
                      autoPlay
                      playsInline
                      className={cn(
                        'h-full w-full object-contain transition-opacity duration-300 ease-out',
                        loaded ? 'opacity-100' : 'opacity-0',
                      )}
                      onLoadedData={() => setLoaded(true)}
                    />
                  ) : (
                    <img
                      key={currentImage.src}
                      src={currentImage.src}
                      alt={currentImage.alt}
                      onLoad={() => setLoaded(true)}
                      className={cn(
                        'h-[78%] w-[92%] select-none object-contain transition-opacity duration-300 ease-out md:h-[84%] md:w-[88%]',
                        loaded ? 'opacity-100' : 'opacity-0',
                        scale > MIN_SCALE ? 'cursor-grab' : 'cursor-zoom-in',
                        isDragging && 'cursor-grabbing',
                      )}
                      draggable={false}
                    />
                  )}
                </div>
              </motion.figure>

              {images.length > 1 && (
                <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-foreground/50 tnum md:hidden">
                  {(index ?? 0) + 1} / {images.length}
                </div>
              )}

              {scale > MIN_SCALE && (
                <div className="pointer-events-none absolute bottom-4 right-4 text-xs text-foreground/50 tnum">
                  {Math.round(scale * 100)}%
                </div>
              )}
            </div>

            {currentImage && (
              <aside
                className="hidden w-[23rem] shrink-0 flex-col border-l border-border bg-background/78 p-6 backdrop-blur-xl md:flex lg:w-[26rem]"
                onClick={(e) => e.stopPropagation()}
              >
                <PanelContent />
              </aside>
            )}
          </div>

          <AnimatePresence>
            {infoOpen && currentImage && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed inset-x-0 bottom-0 z-30 max-h-[70vh] overflow-hidden rounded-t-2xl border-t border-border bg-background/95 text-foreground shadow-2xl backdrop-blur-xl md:hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-foreground/25" />
                <div className="px-5 py-4">
                  <PanelContent />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default ImageLightbox;

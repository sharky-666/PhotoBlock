import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Play, Share2 } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { portfolio } from '@client/src/api';
import Image from '@client/src/components/ui/image';
import Lightbox from '@client/src/components/Lightbox';
import ShutterSpinner from '@client/src/components/ui/shutter-spinner';
import type { Artwork } from '@shared/api.interface';
import { useSharePage } from '@client/src/hooks/use-share-page';

const SeriesDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const sharePage = useSharePage();

  const {
    data: series,
    isLoading: seriesLoading,
    error: seriesError,
  } = useQuery({
    queryKey: ['series', id],
    queryFn: () => portfolio.getSeriesDetail(id),
    enabled: !!id,
  });

  const {
    data,
    isLoading: artworksLoading,
    error: artworksError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['artworks', 'series', id],
    queryFn: ({ pageParam }) =>
      portfolio.getArtworks({ seriesId: id, limit: 50, cursor: pageParam as string | undefined }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!id,
  });

  const allArtworks: Artwork[] =
    data?.pages.flatMap((page) => page.items) ?? [];

  const openLightbox = (index: number) => {
    logger.debug('[SeriesDetail] open lightbox at index', index);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const loading = seriesLoading || artworksLoading;
  const error = seriesError || artworksError;

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center gap-4 px-6 py-24">
        <ShutterSpinner size={40} className="animate-spin text-primary" />
        <p className="text-muted-foreground">加载中…</p>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-muted-foreground">系列不存在或加载失败</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft size={16} strokeWidth={1.5} /> 返回首页
        </Link>
      </div>
    );
  }

  const yearRange =
    series.yearStart && series.yearEnd
      ? `${series.yearStart} — ${series.yearEnd}`
      : series.yearStart
        ? String(series.yearStart)
        : series.yearEnd
          ? String(series.yearEnd)
          : '';

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      {/* Back link */}
      <div className="mb-12 flex items-center justify-between gap-4 md:mb-16">
        <Link
          to={series.mediaType === 'video' ? '/works/videos' : '/works/photos'}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          <span>返回作品</span>
        </Link>
        <button
          type="button"
          onClick={() => void sharePage(series.titleZh)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <Share2 size={16} strokeWidth={1.5} />
          分享系列
        </button>
      </div>

      {/* Header */}
      <header className="mb-16 md:mb-24">
        <h1 className="text-balance font-display text-3xl leading-[1.08] tracking-tight text-foreground sm:text-4xl md:text-6xl lg:text-7xl">
          {series.titleEn}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-muted-foreground md:mt-6">
          <span className="text-base md:text-lg">{series.titleZh}</span>
          {yearRange && (
            <span className="tnum text-sm">· {yearRange}</span>
          )}
          <span className="tnum text-sm tracking-wider">
            共 {series.artworkCount} 件作品
          </span>
        </div>
        {series.description && (
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-foreground/80 md:text-lg">
            {series.description}
          </p>
        )}
      </header>

      {/* Gallery - Masonry */}
      {allArtworks.length === 0 ? (
        <div className="border border-border/80 bg-card/20 px-6 py-20 text-center">
          <p className="font-display text-2xl text-foreground">暂无作品</p>
          <p className="mt-3 text-sm text-muted-foreground">
            这个系列还没有发布作品。
          </p>
          <Link
            to={series.mediaType === 'video' ? '/works/videos' : '/works/photos'}
            className="mt-6 inline-flex text-sm text-primary hover:underline"
          >
            浏览其他作品
          </Link>
        </div>
      ) : (
        <>
          <div className="columns-1 gap-6 md:columns-2 md:gap-8">
            {allArtworks.map((artwork: Artwork, idx: number) => (
              <figure
                key={artwork.id}
                className="group mb-6 break-inside-avoid cursor-pointer md:mb-8"
                onClick={() => openLightbox(idx)}
              >
                <div className="overflow-hidden">
                  {artwork.mediaType === 'video' ? (
                    <div className="relative">
                      <video
                        src={artwork.imageUrl}
                        className="w-full object-cover"
                        style={{
                          aspectRatio:
                            artwork.width && artwork.height
                              ? `${artwork.width} / ${artwork.height}`
                              : undefined,
                        }}
                        preload="metadata"
                        muted
                        playsInline
                      />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-black shadow-lg transition-all duration-300 ease-out group-hover:scale-110">
                          <Play size={20} strokeWidth={1.5} className="ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Image
                      src={artwork.imageUrl}
                      alt={artwork.title || '作品'}
                      className="w-full object-cover"
                      style={{
                        aspectRatio:
                          artwork.width && artwork.height
                            ? `${artwork.width} / ${artwork.height}`
                            : undefined,
                      }}
                    />
                  )}
                </div>
                <figcaption className="mt-3 flex items-center justify-between gap-4 text-xs text-muted-foreground md:text-sm">
                  <span className="truncate">{artwork.title || '未命名作品'}</span>
                  <span className="tnum shrink-0 text-[10px] tracking-[0.2em] text-muted-foreground/60">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>

          {/* Load more */}
          {hasNextPage && (
            <div className="mt-16 flex justify-center md:mt-20">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="rounded-sm border border-foreground/20 px-8 py-3 text-sm transition-all hover:border-primary hover:text-primary disabled:opacity-50"
              >
                {isFetchingNextPage ? '加载中…' : '加载更多'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      <Lightbox
        images={allArtworks}
        index={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setLightboxIndex}
      />
    </div>
  );
};

export default SeriesDetailPage;

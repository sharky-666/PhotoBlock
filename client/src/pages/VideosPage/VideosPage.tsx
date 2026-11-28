import React, { useMemo, useRef } from 'react';
import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Play } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { portfolio } from '@client/src/api';
import ShutterSpinner from '@client/src/components/ui/shutter-spinner';
import type { Artwork, Category } from '@shared/api.interface';

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const VideosPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

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

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ['categories', 'video'],
    queryFn: () => portfolio.getCategoryList('video'),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const categories: Category[] = categoriesData?.items ?? [];
  const categoryNameFromUrl = searchParams.get('category');

  const selectedCategoryId: string | null = useMemo(() => {
    if (!categoryNameFromUrl) return null;
    const found = categories.find(
      (category: Category) =>
        category.slug === categoryNameFromUrl ||
        category.id === categoryNameFromUrl ||
        category.nameZh === categoryNameFromUrl,
    );
    return found ? found.id : null;
  }, [categories, categoryNameFromUrl]);

  const selectedCategory: Category | null = useMemo(() => {
    if (!selectedCategoryId) return null;
    return categories.find((c: Category) => c.id === selectedCategoryId) ?? null;
  }, [categories, selectedCategoryId]);

  const {
    data,
    isLoading: artworksLoading,
    error: artworksError,
    refetch: refetchArtworks,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['artworks', 'video', selectedCategoryId],
    queryFn: ({ pageParam }) =>
      portfolio.getArtworks({
        mediaType: 'video',
        categoryId: selectedCategoryId ?? undefined,
        limit: 12,
        cursor: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  const allArtworks: Artwork[] = data?.pages.flatMap((page) => page.items) ?? [];

  const handleCategoryClick = (category: Category | null) => {
    logger.debug('[VideosPage] select category:', category?.nameZh);
    if (category) {
      setSearchParams({ category: category.slug || category.id });
    } else {
      setSearchParams({});
    }
  };

  const handleVideoClick = (artwork: Artwork) => {
    logger.debug('[VideosPage] click video:', artwork.id);
    toast.info('视频播放功能开发中', {
      description: artwork.title || '敬请期待',
    });
  };

  const handleLoadMore = () => {
    void fetchNextPage();
  };

  const loading = categoriesLoading || artworksLoading;
  const error = categoriesError || artworksError;

  return (
    <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <header className="mb-16 text-center md:mb-20">
        <h1 className="text-balance font-display text-3xl leading-[1.08] tracking-tight text-foreground sm:text-4xl md:text-6xl">
          {selectedCategory ? selectedCategory.nameZh : '全部作品'}
        </h1>
        {selectedCategory?.description ? (
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
            {selectedCategory.description}
          </p>
        ) : (
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            动态影像与短片合集
          </p>
        )}
      </header>

      <div className="mb-8 flex flex-wrap items-center justify-center gap-3 md:gap-4 md:mb-8">
        <button
          type="button"
          onClick={() => handleCategoryClick(null)}
          className={`rounded-sm border px-5 py-2 text-sm transition-all duration-300 ${
            selectedCategoryId === null
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
          }`}
        >
          全部
        </button>
        {categories.map((category: Category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => handleCategoryClick(category)}
            className={`rounded-sm border px-5 py-2 text-sm transition-all duration-300 ${
              selectedCategoryId === category.id
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
            }`}
          >
            {category.nameZh}
          </button>
        ))}
      </div>

      {loading && allArtworks.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
          <ShutterSpinner size={40} className="animate-spin text-primary" />
          <p className="text-muted-foreground">加载中…</p>
        </div>
      ) : error ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
          <p className="text-muted-foreground">视频加载失败，请稍后重试</p>
          <button
            type="button"
            onClick={() => {
              void refetchCategories();
              void refetchArtworks();
            }}
            className="border border-foreground/20 px-6 py-2 text-sm transition-colors hover:border-primary hover:text-primary"
          >
            重新加载
          </button>
        </div>
      ) : allArtworks.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground">
          暂无作品
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allArtworks.map((artwork: Artwork) => (
              <figure
                key={artwork.id}
                className="group cursor-pointer overflow-hidden rounded-sm"
                onClick={() => handleVideoClick(artwork)}
                onMouseEnter={() => handleMouseEnter(artwork.id)}
                onMouseLeave={() => handleMouseLeave(artwork.id)}
              >
                <div className="relative aspect-video overflow-hidden bg-black">
                  <video
                    ref={(el) => {
                      if (el) {
                        videoRefs.current.set(artwork.id, el);
                      } else {
                        videoRefs.current.delete(artwork.id);
                      }
                    }}
                    src={artwork.imageUrl}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/90 bg-black/40 text-white backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                      <Play size={24} fill="currentColor" className="ml-1" strokeWidth={1.5} />
                    </div>
                  </div>
                  {artwork.durationSeconds !== null && artwork.durationSeconds !== undefined && (
                    <div className="absolute bottom-2 right-2 rounded-sm bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm tnum">
                      {formatDuration(artwork.durationSeconds)}
                    </div>
                  )}
                </div>
                <figcaption className="mt-3 flex items-center justify-between">
                  <span className="truncate text-sm text-foreground">
                    {artwork.title || '未命名作品'}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>

          {hasNextPage && (
            <div className="mt-16 flex justify-center md:mt-20">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isFetchingNextPage}
                className="rounded-sm border border-foreground/20 px-8 py-3 text-sm transition-all hover:border-primary hover:text-primary disabled:opacity-50"
              >
                {isFetchingNextPage ? '加载中…' : '加载更多'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideosPage;

import React, { useMemo } from 'react';
import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { portfolio } from '@client/src/api';
import { Image } from '@client/src/components/ui/image';
import ImageLightbox from '@client/src/components/ImageLightbox';
import ShutterSpinner from '@client/src/components/ui/shutter-spinner';
import type { Artwork, Category } from '@shared/api.interface';
import type { LightboxImage } from '@client/src/components/ImageLightbox';

const PhotosPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ['categories', 'image'],
    queryFn: () => portfolio.getCategoryList('image'),
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
    queryKey: ['artworks', 'image', selectedCategoryId],
    queryFn: ({ pageParam }) =>
      portfolio.getArtworks({
        mediaType: 'image',
        categoryId: selectedCategoryId ?? undefined,
        limit: 24,
        cursor: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  const allArtworks: Artwork[] = data?.pages.flatMap((page) => page.items) ?? [];

  const lightboxImages: LightboxImage[] = allArtworks.map((artwork: Artwork) => ({
    src: artwork.imageUrl,
    alt: artwork.title || '作品',
    caption: artwork.title || undefined,
    artwork,
  }));

  const handleCategoryClick = (category: Category | null) => {
    logger.debug('[PhotosPage] select category:', category?.nameZh);
    if (category) {
      setSearchParams({ category: category.slug || category.id });
    } else {
      setSearchParams({});
    }
    setLightboxIndex(null);
  };

  const openLightbox = (index: number) => {
    logger.debug('[PhotosPage] open lightbox at index', index);
    setLightboxIndex(index);
  };

  const handleLightboxClose = () => {
    setLightboxIndex(null);
  };

  const handleLightboxIndexChange = (index: number) => {
    setLightboxIndex(index);
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
            精选摄影作品合集
          </p>
        )}
      </header>

      <div className="mb-8 flex flex-wrap items-center justify-center gap-3 md:gap-4">
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
          <p className="text-muted-foreground">作品加载失败，请稍后重试</p>
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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {allArtworks.map((artwork: Artwork, idx: number) => (
              <figure
                key={artwork.id}
                className="group cursor-pointer overflow-hidden rounded-sm"
                onClick={() => openLightbox(idx)}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={artwork.imageUrl}
                    alt={artwork.title || '作品'}
                    fill
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>
                {artwork.title && (
                  <figcaption className="mt-3 text-xs text-muted-foreground md:text-sm">
                    {artwork.title}
                  </figcaption>
                )}
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

      <ImageLightbox
        images={lightboxImages}
        index={lightboxIndex}
        onClose={handleLightboxClose}
        onIndexChange={handleLightboxIndexChange}
      />
    </div>
  );
};

export default PhotosPage;

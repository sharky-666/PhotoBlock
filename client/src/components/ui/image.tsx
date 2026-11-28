'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@client/src/lib/utils';
import ShutterSpinner from '@client/src/components/ui/shutter-spinner';

type ImageFormat = 'jpg' | 'png' | 'webp' | 'bmp' | 'gif' | 'tiff';

type NativeImgProps = React.ComponentPropsWithoutRef<'img'>;

export interface ImageProps extends NativeImgProps {
  quality?: number;
  format?: ImageFormat;
  breakpoints?: Array<number>;
  /** 是否填充父容器（position: absolute + inset-0） */
  fill?: boolean;
  /** 是否优先加载（关闭 lazy loading） */
  priority?: boolean;
  /** 是否为阿里云 OSS 图片（自定义域名时由调用方指定） */
  isOss?: boolean;
}

const DEFAULT_QUALITY = 80;
const DEFAULT_RESOLUTIONS: number[] = [
  16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048,
  3840,
];

const SRC_ALLOWLIST = [
  '/runtime/api/v1/storage/object/',
  '/aily/api/v1/feisuda/attachments/',
  '/aily/api/v1/files/static/',
];

function getClosestResolution(target: number): number {
  return DEFAULT_RESOLUTIONS.reduce((prev, curr) => {
    return Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev;
  });
}

function applyParamsToUrl(
  src: string,
  params: Record<string, string | number | undefined>,
): string {
  const search = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => {
      return `${k},${v}`;
    })
    .join('/');
  if (!search) return src;

  const [pathAndQuery = '', hash] = src.split('#');
  const [base, query] = pathAndQuery.split('?');
  const urlParams = new URLSearchParams(query);
  urlParams.set('x-tos-process', `image/${search}`);

  return `${base}?${urlParams.toString()}${hash ? '#' + hash : ''}`;
}

function applyOssParamsToUrl(
  src: string,
  params: Record<string, string | number | undefined>,
): string {
  const search = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => {
      return `${k},${v}`;
    })
    .join('/');
  if (!search) return src;

  const [pathAndQuery = '', hash] = src.split('#');
  const [base, query] = pathAndQuery.split('?');
  const urlParams = new URLSearchParams(query);
  urlParams.set('x-oss-process', `image/${search}`);

  return `${base}?${urlParams.toString()}${hash ? '#' + hash : ''}`;
}

function isTargetSrc(originSrc: string) {
  return SRC_ALLOWLIST.some((item) => originSrc.includes(item));
}

function isOssSrc(originSrc: string, isOssProp?: boolean) {
  if (isOssProp) return true;
  return originSrc.includes('aliyuncs.com');
}

function supportWebp() {
  try {
    return (
      document
        .createElement('canvas')
        .toDataURL('image/webp')
        .indexOf('data:image/webp') === 0
    );
  } catch (err) {
    return false;
  }
}

function buildSrcSet(
  src: string,
  widths: number[],
  format: ImageFormat | undefined,
  quality: number,
  width?: number,
  sizes?: string,
): string | undefined {
  if (!widths || widths.length === 0 || (!width && !sizes)) return undefined;
  const fmt = format;
  if (width) {
    return [1, 2]
      .map((dpr) => {
        const targetWidth = getClosestResolution(width * dpr);
        return `${applyParamsToUrl(src, { resize: `w_${targetWidth}`, quality: `Q_${quality}`, format: fmt })} ${dpr}x`;
      })
      .join(', ');
  }
  return widths
    .map(
      (w) =>
        `${applyParamsToUrl(src, { resize: `w_${w}`, quality: `Q_${quality}`, format: fmt })} ${w}w`,
    )
    .join(', ');
}

function buildOssSrcSet(
  src: string,
  widths: number[],
  format: ImageFormat | undefined,
  quality: number,
  width?: number,
  sizes?: string,
): string | undefined {
  if (!widths || widths.length === 0 || (!width && !sizes)) return undefined;
  const fmt = format;
  if (width) {
    return [1, 2]
      .map((dpr) => {
        const targetWidth = getClosestResolution(width * dpr);
        return `${applyOssParamsToUrl(src, { resize: `w_${targetWidth}`, quality: `q_${quality}`, format: fmt })} ${dpr}x`;
      })
      .join(', ');
  }
  return widths
    .map(
      (w) =>
        `${applyOssParamsToUrl(src, { resize: `w_${w}`, quality: `q_${quality}`, format: fmt })} ${w}w`,
    )
    .join(', ');
}

export const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      src,
      width,
      height,
      quality = DEFAULT_QUALITY,
      format,
      sizes,
      srcSet: userSrcSet,
      breakpoints = DEFAULT_RESOLUTIONS,
      className,
      fill,
      priority,
      loading,
      decoding = 'async',
      alt = '',
      isOss,
      ...rest
    },
    ref,
  ) => {
    const [loaded, setLoaded] = React.useState(false);

    const defaultFormat = React.useMemo(
      () => (supportWebp() ? 'webp' : undefined),
      [],
    );

    const actualLoading = priority ? 'eager' : loading ?? 'lazy';

    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      setLoaded(true);
      rest.onLoad?.(e);
    };

    const numericWidth = typeof width === 'number' ? width : undefined;

    const srcIsTos = typeof src === 'string' && isTargetSrc(src);
    const srcIsOss = typeof src === 'string' && isOssSrc(src, isOss);

    // 既不在白名单也不是 OSS → 直接渲染（带渐入）
    if (typeof src !== 'string' || (!srcIsTos && !srcIsOss)) {
      return (
        <div
          className={cn(
            'img-hover relative overflow-hidden',
            fill && 'absolute inset-0 h-full w-full',
          )}
        >
          {!loaded && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/40">
              <ShutterSpinner
                size={28}
                className="animate-spin text-primary/60"
              />
            </div>
          )}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: loaded ? 1 : 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={cn('h-full w-full', fill && 'h-full w-full')}
          >
            <img
              {...rest}
              ref={ref}
              src={src}
              width={width}
              height={height}
              sizes={sizes}
              srcSet={userSrcSet}
              alt={alt}
              className={cn(
                'h-full w-full bg-muted/30 object-cover',
                fill && 'h-full w-full',
                className,
              )}
              loading={actualLoading}
              decoding={decoding}
              onLoad={handleLoad}
            />
          </motion.div>
        </div>
      );
    }

    if (srcIsTos) {
      // 白名单内 → 生成优化 srcSet
      const srcSet =
        userSrcSet ??
        buildSrcSet(
          src,
          breakpoints,
          format ?? (defaultFormat as ImageFormat),
          quality,
          numericWidth,
          sizes,
        );

      const baseSrc = applyParamsToUrl(src, {
        resize: numericWidth ? `w_${numericWidth}` : undefined,
        quality: `Q_${quality}`,
        format: format ?? defaultFormat,
      });

      return (
        <div
          className={cn(
            'img-hover relative overflow-hidden',
            fill && 'absolute inset-0 h-full w-full',
          )}
        >
          {!loaded && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/40">
              <ShutterSpinner
                size={28}
                className="animate-spin text-primary/60"
              />
            </div>
          )}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: loaded ? 1 : 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={cn('h-full w-full', fill && 'h-full w-full')}
          >
            <img
              {...rest}
              ref={ref}
              src={baseSrc}
              width={width}
              height={height}
              sizes={sizes}
              srcSet={srcSet}
              alt={alt}
              className={cn(
                'h-full w-full bg-muted/30 object-cover',
                fill && 'h-full w-full',
                className,
              )}
              loading={actualLoading}
              decoding={decoding}
              onLoad={handleLoad}
            />
          </motion.div>
        </div>
      );
    }

    // OSS 图片 → 生成 OSS 优化 srcSet
    const ossSrcSet =
      userSrcSet ??
      buildOssSrcSet(
        src,
        breakpoints,
        format ?? (defaultFormat as ImageFormat),
        quality,
        numericWidth,
        sizes,
      );

    const ossBaseSrc = applyOssParamsToUrl(src, {
      resize: numericWidth ? `w_${numericWidth}` : undefined,
      quality: `q_${quality}`,
      format: format ?? defaultFormat,
    });

    return (
      <div
        className={cn(
          'img-hover relative overflow-hidden',
          fill && 'absolute inset-0 h-full w-full',
        )}
      >
        {!loaded && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/40">
            <ShutterSpinner
              size={28}
              className="animate-spin text-primary/60"
            />
          </div>
        )}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: loaded ? 1 : 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={cn('h-full w-full', fill && 'h-full w-full')}
        >
          <img
            {...rest}
            ref={ref}
            src={ossBaseSrc}
            width={width}
            height={height}
            sizes={sizes}
            srcSet={ossSrcSet}
            alt={alt}
            className={cn(
              'h-full w-full bg-muted/30 object-cover',
              fill && 'h-full w-full',
              className,
            )}
            loading={actualLoading}
            decoding={decoding}
            onLoad={handleLoad}
          />
        </motion.div>
      </div>
    );
  },
);

Image.displayName = 'Image';

export default Image;

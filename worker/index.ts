import {
  getArtwork,
  getCategory,
  getHeroSlides,
  getHomepageCopy,
  getLocationMarkers,
  getSeries,
  getSitemapEntries,
  getSiteSettings,
  getStats,
  incrementArtworkView,
  listArtworks,
  listCategories,
  listFeaturedArtworks,
  listFeaturedSeries,
  listSeries,
  normalizeMediaType,
} from './data';
import { handleAdminApi } from './admin';
import { HttpError, fail, ok, positiveInt } from './http';
import { createOssSignedUrl } from './oss';
import type { Env, ExecutionContext } from './types';

function notFound(message: string): never {
  throw new HttpError(404, message);
}

async function publicApi(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  const { pathname, searchParams } = url;
  const mediaType = normalizeMediaType(searchParams.get('mediaType'));
  const isViewRequest =
    request.method === 'POST' &&
    /^\/api\/artworks\/[^/]+\/view$/.test(pathname);
  if (
    request.method !== 'GET' &&
    request.method !== 'HEAD' &&
    !isViewRequest
  ) {
    throw new HttpError(405, '请求方法不支持');
  }

  if (pathname === '/api/health') {
    return ok({
      service: 'photoblock-api',
      status: 'ok',
      runtime: 'cloudflare-worker',
    });
  }

  if (pathname === '/api/series/featured') {
    return ok(await listFeaturedSeries(env, mediaType), {
      cacheSeconds: 60,
    });
  }

  if (pathname === '/api/series') {
    return ok(await listSeries(env, mediaType));
  }

  const seriesMatch = pathname.match(/^\/api\/series\/([^/]+)$/);
  if (seriesMatch) {
    try {
      return ok(await getSeries(env, decodeURIComponent(seriesMatch[1])), {
        cacheSeconds: 60,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'SERIES_NOT_FOUND') {
        notFound('系列不存在');
      }
      throw error;
    }
  }

  if (pathname === '/api/categories') {
    return ok(await listCategories(env, mediaType));
  }

  const categoryMatch = pathname.match(
    /^\/api\/categories\/([^/]+)$/,
  );
  if (categoryMatch) {
    try {
      return ok(
        await getCategory(
          env,
          decodeURIComponent(categoryMatch[1]),
        ),
        { cacheSeconds: 60 },
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'CATEGORY_NOT_FOUND'
      ) {
        notFound('分类不存在');
      }
      throw error;
    }
  }

  if (pathname === '/api/artworks/featured-videos') {
    const limit = positiveInt(searchParams.get('limit'), 8, 20);
    return ok(await listFeaturedArtworks(env, 'video', limit), {
      cacheSeconds: 30,
    });
  }

  if (pathname === '/api/artworks/featured-images') {
    const limit = positiveInt(searchParams.get('limit'), 6, 20);
    return ok(await listFeaturedArtworks(env, 'image', limit), {
      cacheSeconds: 30,
    });
  }

  if (pathname === '/api/artworks') {
    const cursor = searchParams.get('cursor') ?? undefined;
    try {
      return ok(
        await listArtworks(env, {
          seriesId: searchParams.get('seriesId') ?? undefined,
          categoryId:
            searchParams.get('categoryId') ?? undefined,
          mediaType,
          location: searchParams.get('location') ?? undefined,
          cursor,
          limit: positiveInt(searchParams.get('limit'), 20, 200),
        }),
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'INVALID_CURSOR'
      ) {
        throw new HttpError(400, 'cursor 格式错误');
      }
      throw error;
    }
  }

  const viewMatch = pathname.match(
    /^\/api\/artworks\/([^/]+)\/view$/,
  );
  if (viewMatch && request.method === 'POST') {
    const visitor =
      request.headers.get('cf-connecting-ip') ??
      request.headers.get('x-forwarded-for') ??
      'unknown';
    const userAgent = request.headers.get('user-agent') ?? '';
    try {
      return ok(
        await incrementArtworkView(
          env,
          decodeURIComponent(viewMatch[1]),
          `${visitor}|${userAgent}`,
        ),
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'ARTWORK_NOT_FOUND'
      ) {
        notFound('作品不存在');
      }
      throw error;
    }
  }

  const artworkMatch = pathname.match(
    /^\/api\/artworks\/([^/]+)$/,
  );
  if (artworkMatch) {
    try {
      return ok(
        await getArtwork(
          env,
          decodeURIComponent(artworkMatch[1]),
        ),
        { cacheSeconds: 30 },
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'ARTWORK_NOT_FOUND'
      ) {
        notFound('作品不存在');
      }
      throw error;
    }
  }

  if (pathname === '/api/site-settings') {
    return ok(await getSiteSettings(env), { cacheSeconds: 30 });
  }

  if (pathname === '/api/homepage-copy') {
    return ok(await getHomepageCopy(env), {
      cacheSeconds: 30,
    });
  }

  if (pathname === '/api/hero-slides') {
    return ok(
      await getHeroSlides(
        env,
        searchParams.get('activeOnly') === 'true',
      ),
      { cacheSeconds: 30 },
    );
  }

  if (pathname === '/api/location-markers') {
    return ok(await getLocationMarkers(env), {
      cacheSeconds: 60,
    });
  }

  if (pathname === '/api/stats') {
    return ok(await getStats(env), { cacheSeconds: 30 });
  }

  throw new HttpError(404, '接口不存在');
}

async function serveMedia(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  const key = decodeURIComponent(
    url.pathname.slice('/media/'.length),
  );
  if (!key || key.startsWith('/') || key.includes('..')) {
    return new Response('Not found', { status: 404 });
  }

  const signed = await createOssSignedUrl(
    env,
    key,
    request.method === 'HEAD' ? 'HEAD' : 'GET',
    { expiresSeconds: 10 * 60 },
  );
  return new Response(null, {
    status: 302,
    headers: {
      location: signed.url,
      'cache-control': 'private, no-store',
    },
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function serveSeo(
  env: Env,
  url: URL,
): Promise<Response | null> {
  const siteUrl = (env.PUBLIC_SITE_URL || url.origin).replace(/\/+$/, '');
  if (url.pathname === '/robots.txt') {
    return new Response(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        '',
        `Sitemap: ${siteUrl}/sitemap.xml`,
        '',
      ].join('\n'),
      {
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'public, max-age=3600',
        },
      },
    );
  }

  if (url.pathname !== '/sitemap.xml') return null;
  const staticPaths = [
    '/',
    '/works/photos',
    '/works/videos',
    '/about',
    '/cooperation',
  ];
  const dynamicEntries = await getSitemapEntries(env);
  const entries = [
    ...staticPaths.map((path) => ({ path, updatedAt: '' })),
    ...dynamicEntries,
  ];
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((entry) =>
      [
        '  <url>',
        `    <loc>${escapeXml(`${siteUrl}${entry.path}`)}</loc>`,
        entry.updatedAt
          ? `    <lastmod>${escapeXml(entry.updatedAt.slice(0, 10))}</lastmod>`
          : '',
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n'),
    ),
    '</urlset>',
    '',
  ].join('\n');
  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}

function secureResponse(response: Response): Response {
  const secured = new Response(response.body, response);
  secured.headers.set('x-content-type-options', 'nosniff');
  secured.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  secured.headers.set(
    'permissions-policy',
    'camera=(), microphone=(), geolocation=(self)',
  );
  secured.headers.set('x-frame-options', 'SAMEORIGIN');
  return secured;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    context: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'GET' || request.method === 'HEAD') {
      const seoResponse = await serveSeo(env, url);
      if (seoResponse) return secureResponse(seoResponse);
    }

    if (url.pathname.startsWith('/api/admin/')) {
      try {
        return secureResponse(
          await handleAdminApi(request, env, url),
        );
      } catch (error) {
        return secureResponse(fail(error));
      }
    }

    if (url.pathname.startsWith('/api/')) {
      try {
        return secureResponse(await publicApi(request, env, url));
      } catch (error) {
        return secureResponse(fail(error));
      }
    }

    if (
      (request.method === 'GET' || request.method === 'HEAD') &&
      url.pathname.startsWith('/media/')
    ) {
      return secureResponse(await serveMedia(request, env, url));
    }

    try {
      return secureResponse(await env.ASSETS.fetch(request));
    } catch (error) {
      console.error('Static asset request failed', error);
      context.passThroughOnException();
      return secureResponse(
        new Response('Asset not found', { status: 404 }),
      );
    }
  },
};

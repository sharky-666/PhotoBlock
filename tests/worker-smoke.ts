import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

import worker from '../worker/index';
import type { Env } from '../worker/types';

type ParametersArray = unknown[];

function createD1Adapter(databasePath: string) {
  const database = new DatabaseSync(databasePath);

  const wrap = (sql: string, params: ParametersArray = []) => ({
    isQuery: /^\s*(select|with|pragma)/i.test(sql),
    bind(...values: unknown[]) {
      return wrap(sql, values);
    },
    async first<T>(column?: string) {
      const row = database.prepare(sql).get(...params) as
        | Record<string, unknown>
        | undefined;
      if (!row) return null;
      if (column) return row[column] as T;
      return row as T;
    },
    async all<T>() {
      return {
        success: true,
        results: database.prepare(sql).all(...params) as T[],
        meta: {},
      };
    },
    async run<T>() {
      const result = database.prepare(sql).run(...params);
      return {
        success: true,
        results: [] as T[],
        meta: {
          changes: Number(result.changes),
          last_row_id: Number(result.lastInsertRowid),
        },
      };
    },
  });

  return {
    exec(sql: string) {
      database.exec(sql);
    },
    prepare(sql: string) {
      return wrap(sql);
    },
    async batch(
      statements: Array<{
        isQuery: boolean;
        all(): Promise<unknown>;
        run(): Promise<unknown>;
      }>,
    ) {
      const results = [];
      for (const statement of statements) {
        results.push(
          statement.isQuery
            ? await statement.all()
            : await statement.run(),
        );
      }
      return results;
    },
  };
}

function createOssFetchAdapter() {
  const objects = new Map<
    string,
    {
      body: Uint8Array;
      contentType: string;
    }
  >();

  return {
    objects,
    async fetch(input: RequestInfo | URL, init: RequestInit = {}) {
      const request = new Request(input, init);
      const url = new URL(request.url);
      const key = decodeURIComponent(url.pathname.slice(1));
      const method = request.method.toUpperCase();

      if (method === 'PUT') {
        const body = new Uint8Array(await request.arrayBuffer());
        objects.set(key, {
          body,
          contentType:
            request.headers.get('content-type') ??
            'application/octet-stream',
        });
        return new Response(null, {
          status: 200,
          headers: { etag: '"smoke-test"' },
        });
      }

      if (method === 'GET') {
        const object = objects.get(key);
        if (!object) return new Response(null, { status: 404 });
        return new Response(object.body.subarray(0, 1), {
          status: 206,
          headers: {
            'content-range': `bytes 0-0/${object.body.byteLength}`,
            'content-type': object.contentType,
          },
        });
      }

      if (method === 'DELETE') {
        objects.delete(key);
        return new Response(null, { status: 204 });
      }

      return new Response(null, { status: 405 });
    },
  };
}

async function jsonResponse(response: Response) {
  return (await response.json()) as {
    success: boolean;
    data: any;
    message: string;
  };
}

async function main() {
  const dbPath = ':memory:';
  const db = createD1Adapter(dbPath);
  const migration = fs.readFileSync(
    new URL('../migrations/0001_init.sql', import.meta.url),
    'utf8',
  );
  db.exec(migration);

  const oss = createOssFetchAdapter();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = oss.fetch;
  const assets = {
    async fetch() {
      return new Response('asset', { status: 200 });
    },
  };

  const env = {
    DB: db,
    ASSETS: assets,
    MEDIA_BASE_URL: '',
    ALIYUN_OSS_REGION: 'oss-cn-shanghai',
    ALIYUN_OSS_BUCKET: 'example-media-bucket',
    ALIYUN_OSS_ENDPOINT: 'https://oss-cn-shanghai.aliyuncs.com',
    ALIYUN_OSS_ACCESS_KEY_ID: 'smoke-test-access-key',
    ALIYUN_OSS_ACCESS_KEY_SECRET: 'smoke-test-secret',
    ALIYUN_OSS_PREFIX: 'uploads',
    PUBLIC_SITE_URL: 'https://demo.example.com',
    ADMIN_BOOTSTRAP_USERNAME: 'admin',
    ADMIN_BOOTSTRAP_PASSWORD: 'smoke-test-password',
    VIEW_HASH_SECRET: 'smoke-test-view-secret',
  } as unknown as Env;

  const context = {
    waitUntil() {},
    passThroughOnException() {},
  };

  const request = (
    path: string,
    init: RequestInit = {},
  ) =>
    worker.fetch(
      new Request(`http://localhost${path}`, init),
      env,
      context,
    );

  const health = await request('/api/health');
  assert.equal(health.status, 200);
  assert.equal(
    health.headers.get('x-content-type-options'),
    'nosniff',
  );

  const defaultsResponse = await request('/api/homepage-copy');
  const defaults = await jsonResponse(defaultsResponse);
  assert.equal(defaults.data.heroMainTitle, '演示摄影师');

  const loginResponse = await request('/api/admin/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost',
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'smoke-test-password',
    }),
  });
  assert.equal(loginResponse.status, 200);
  const cookie = loginResponse.headers.get('set-cookie')?.split(';')[0];
  assert.ok(cookie);

  const adminHeaders = {
    cookie: cookie!,
    origin: 'http://localhost',
  };

  const statusResponse = await request('/api/admin/status', {
    headers: adminHeaders,
  });
  const status = await jsonResponse(statusResponse);
  assert.equal(status.data.isLoggedIn, true);

  const imageBytes = new Uint8Array([137, 80, 78, 71]);
  const signResponse = await request('/api/admin/media/sign', {
    method: 'POST',
    headers: {
      ...adminHeaders,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      filename: 'cover.png',
      contentType: 'image/png',
      size: imageBytes.byteLength,
    }),
  });
  const signed = await jsonResponse(signResponse);
  assert.equal(signResponse.status, 200);
  assert.match(signed.data.uploadUrl, /^https:\/\/example-media-bucket\./);

  const putResponse = await fetch(signed.data.uploadUrl, {
    method: 'PUT',
    headers: signed.data.headers,
    body: imageBytes,
  });
  assert.equal(putResponse.status, 200);

  const uploadResponse = await request('/api/admin/media/confirm', {
    method: 'POST',
    headers: {
      ...adminHeaders,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      key: signed.data.key,
      contentType: signed.data.contentType,
      size: signed.data.size,
    }),
  });
  const upload = await jsonResponse(uploadResponse);
  assert.equal(uploadResponse.status, 201);
  assert.match(upload.data.url, /^\/media\//);

  const proxyForm = new FormData();
  proxyForm.append(
    'file',
    new File([new Uint8Array([80, 82, 79, 88, 89])], 'proxy.png', {
      type: 'image/png',
    }),
  );
  const proxyUploadResponse = await request('/api/admin/media/proxy', {
    method: 'POST',
    headers: adminHeaders,
    body: proxyForm,
  });
  const proxyUpload = await jsonResponse(proxyUploadResponse);
  assert.equal(proxyUploadResponse.status, 201);
  assert.match(proxyUpload.data.url, /^\/media\//);
  const proxyDeleteResponse = await request(
    `/api/admin/media/${encodeURIComponent(proxyUpload.data.key)}`,
    {
      method: 'DELETE',
      headers: adminHeaders,
    },
  );
  assert.equal(proxyDeleteResponse.status, 200);

  const categoryResponse = await request('/api/admin/categories', {
    method: 'POST',
    headers: {
      ...adminHeaders,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      nameZh: '城市之影',
      nameEn: 'City Shadows',
      description: '城市摄影分类',
      coverUrl: upload.data.url,
      mediaType: 'image',
      sortOrder: 1,
    }),
  });
  const category = await jsonResponse(categoryResponse);
  assert.equal(categoryResponse.status, 201);

  const seriesResponse = await request('/api/admin/series', {
    method: 'POST',
    headers: {
      ...adminHeaders,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      titleZh: '夜行',
      titleEn: 'Night Walk',
      description: '夜色中的城市',
      coverUrl: upload.data.url,
      mediaType: 'image',
      sortOrder: 1,
      isFeatured: true,
    }),
  });
  const series = await jsonResponse(seriesResponse);
  assert.equal(seriesResponse.status, 201);

  const artworkResponse = await request('/api/admin/artworks', {
    method: 'POST',
    headers: {
      ...adminHeaders,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      title: '午夜街角',
      description: '测试作品',
      imageUrl: upload.data.url,
      mediaType: 'image',
      width: 1600,
      height: 1067,
      categoryId: category.data.id,
      seriesId: series.data.id,
      location: '上海',
      latitude: 31.2304,
      longitude: 121.4737,
    }),
  });
  const artwork = await jsonResponse(artworkResponse);
  assert.equal(artworkResponse.status, 201);

  const sitemapResponse = await request('/sitemap.xml');
  assert.equal(sitemapResponse.status, 200);
  const sitemap = await sitemapResponse.text();
  assert.match(sitemap, /https:\/\/demo\.example\.com\/series\//);
  assert.match(sitemap, /https:\/\/demo\.example\.com\/category\//);

  const publicArtworks = await request('/api/artworks?limit=10');
  const artworks = await jsonResponse(publicArtworks);
  assert.equal(artworks.data.items.length, 1);
  assert.equal(artworks.data.items[0].title, '午夜街角');

  const updatedCopy = await request('/api/admin/homepage-copy', {
    method: 'PATCH',
    headers: {
      ...adminHeaders,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      heroMainTitle: '动态光影',
    }),
  });
  const copy = await jsonResponse(updatedCopy);
  assert.equal(copy.data.heroMainTitle, '动态光影');

  const publicCopy = await jsonResponse(
    await request('/api/homepage-copy'),
  );
  assert.equal(publicCopy.data.heroMainTitle, '动态光影');

  const stats = await jsonResponse(await request('/api/stats'));
  assert.equal(stats.data.totalArtworks, 1);

  const changePasswordResponse = await request(
    '/api/admin/change-password',
    {
      method: 'POST',
      headers: {
        ...adminHeaders,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        oldPassword: 'smoke-test-password',
        newPassword: 'smoke-test-new-password',
      }),
    },
  );
  assert.equal(changePasswordResponse.status, 200);

  const deleteMediaResponse = await request(
    `/api/admin/media/${encodeURIComponent(upload.data.key)}`,
    {
      method: 'DELETE',
      headers: adminHeaders,
    },
  );
  assert.equal(deleteMediaResponse.status, 200);
  assert.equal(oss.objects.has(upload.data.key), false);

  const logoutResponse = await request('/api/admin/logout', {
    method: 'POST',
    headers: adminHeaders,
  });
  assert.equal(logoutResponse.status, 200);

  const reloginResponse = await request('/api/admin/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost',
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'smoke-test-new-password',
    }),
  });
  assert.equal(reloginResponse.status, 200);
  globalThis.fetch = originalFetch;

  console.log('Worker smoke test passed');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

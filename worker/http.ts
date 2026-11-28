export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

const API_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
};

export function ok<T>(
  data: T,
  init: {
    status?: number;
    cacheSeconds?: number;
  } = {},
): Response {
  return Response.json(
    {
      success: true,
      data,
      message: 'ok',
    },
    {
      status: init.status ?? 200,
      headers:
        init.cacheSeconds === undefined
          ? API_HEADERS
          : {
              ...API_HEADERS,
              'cache-control': `public, max-age=${init.cacheSeconds}, stale-while-revalidate=300`,
            },
    },
  );
}

export function fail(error: unknown): Response {
  if (error instanceof HttpError) {
    return Response.json(
      {
        success: false,
        data: null,
        message: error.message,
      },
      {
        status: error.status,
        headers: {
          ...API_HEADERS,
          'cache-control': 'no-store',
        },
      },
    );
  }

  console.error('Unhandled worker error', error);
  return Response.json(
    {
      success: false,
      data: null,
      message: '服务器内部错误',
    },
    {
      status: 500,
      headers: {
        ...API_HEADERS,
        'cache-control': 'no-store',
      },
    },
  );
}

export function positiveInt(
  value: string | null,
  fallback: number,
  max: number,
): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

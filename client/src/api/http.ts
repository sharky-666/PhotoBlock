import { notifyPortfolioUpdated } from '@client/src/lib/portfolio-sync';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(
  /\/+$/,
  '',
);

type QueryValue = string | number | boolean | null | undefined;

interface RequestOptions {
  params?: object;
  headers?: Record<string, string>;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string;
}

export class ApiHttpError extends Error {
  readonly response: {
    status: number;
    data: unknown;
  };

  constructor(status: number, data: unknown, message: string) {
    super(message);
    this.name = 'ApiHttpError';
    this.response = { status, data };
  }
}

function buildUrl(
  path: string,
  params?: object,
): string {
  const base = API_BASE_URL || window.location.origin;
  const url = new URL(path, base);
  for (const [key, value] of Object.entries(
    params ?? {},
  ) as Array<[string, QueryValue]>) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  if (!API_BASE_URL) return `${url.pathname}${url.search}`;
  return url.toString();
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return JSON.parse(text);
  }
  return text;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<{ data: T; status: number }> {
  const headers: Record<string, string> = {
    accept: 'application/json',
    ...options.headers,
  };
  let requestBody: BodyInit | undefined;
  if (body instanceof FormData) {
    requestBody = body;
  } else if (body !== undefined) {
    headers['content-type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(
    buildUrl(path, options.params),
    {
      method,
      headers,
      body: requestBody,
      credentials: 'same-origin',
    },
  );
  const data = await parseBody(response);

  if (!response.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string'
        ? data.message
        : `请求失败（HTTP ${response.status}）`;
    throw new ApiHttpError(response.status, data, message);
  }

  if (method !== 'GET' && path.startsWith('/api/admin/')) {
    notifyPortfolioUpdated();
  }

  return { data: data as T, status: response.status };
}

export const apiClient = {
  get<T = any>(path: string, options?: RequestOptions) {
    return request<ApiEnvelope<T>>('GET', path, undefined, options);
  },
  post<T = any>(path: string, body?: unknown, options?: RequestOptions) {
    return request<ApiEnvelope<T>>('POST', path, body, options);
  },
  patch<T = any>(path: string, body?: unknown, options?: RequestOptions) {
    return request<ApiEnvelope<T>>('PATCH', path, body, options);
  },
  delete<T = any>(path: string, options?: RequestOptions) {
    return request<ApiEnvelope<T>>('DELETE', path, undefined, options);
  },
};

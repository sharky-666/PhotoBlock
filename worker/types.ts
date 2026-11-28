export interface D1Result<T = Record<string, unknown>> {
  results?: T[];
  success: boolean;
  meta: {
    changes?: number;
    duration?: number;
    last_row_id?: number;
    rows_read?: number;
    rows_written?: number;
  };
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(columnName?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = Record<string, unknown>>(
    statements: D1PreparedStatement[],
  ): Promise<D1Result<T>[]>;
}

export interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  MEDIA_BASE_URL: string;
  ALIYUN_OSS_REGION: string;
  ALIYUN_OSS_BUCKET: string;
  ALIYUN_OSS_ENDPOINT: string;
  ALIYUN_OSS_ACCESS_KEY_ID: string;
  ALIYUN_OSS_ACCESS_KEY_SECRET: string;
  ALIYUN_OSS_PREFIX?: string;
  PUBLIC_SITE_URL: string;
  ADMIN_BOOTSTRAP_USERNAME?: string;
  ADMIN_BOOTSTRAP_PASSWORD?: string;
  VIEW_HASH_SECRET?: string;
  CF_ACCESS_AUD?: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

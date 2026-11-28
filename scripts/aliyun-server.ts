import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { DatabaseSync, type StatementSync } from 'node:sqlite';
import worker from '../worker/index';
import type {
  D1Database,
  D1PreparedStatement,
  D1Result,
  Env,
  ExecutionContext,
} from '../worker/types';

type SqlValue = string | number | bigint | null | Uint8Array;

function normalizeValue(value: unknown): SqlValue {
  if (value === undefined || value === null) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (value instanceof Date) return value.toISOString();
  return value as SqlValue;
}

class NodeD1Statement implements D1PreparedStatement {
  constructor(
    private readonly database: DatabaseSync,
    private readonly query: string,
    private readonly values: SqlValue[] = [],
  ) {}

  bind(...values: unknown[]): D1PreparedStatement {
    return new NodeD1Statement(
      this.database,
      this.query,
      values.map(normalizeValue),
    );
  }

  private prepare(): StatementSync {
    return this.database.prepare(this.query);
  }

  async first<T = Record<string, unknown>>(
    columnName?: string,
  ): Promise<T | null> {
    const row = this.prepare().get(...this.values) as
      | Record<string, unknown>
      | undefined;
    if (!row) return null;
    if (columnName) return (row[columnName] as T) ?? null;
    return row as T;
  }

  async all<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    const results = this.prepare().all(...this.values) as T[];
    return {
      success: true,
      results,
      meta: {
        rows_read: results.length,
      },
    };
  }

  async run<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    const result = this.prepare().run(...this.values);
    return {
      success: true,
      meta: {
        changes: Number(result.changes),
        last_row_id: Number(result.lastInsertRowid),
        rows_written: Number(result.changes),
      },
    };
  }
}

class NodeD1Database implements D1Database {
  constructor(private readonly database: DatabaseSync) {}

  prepare(query: string): D1PreparedStatement {
    return new NodeD1Statement(this.database, query);
  }

  async batch<T = Record<string, unknown>>(
    statements: D1PreparedStatement[],
  ): Promise<D1Result<T>[]> {
    this.database.exec('BEGIN IMMEDIATE');
    try {
      const results: D1Result<T>[] = [];
      for (const statement of statements) {
        const nodeStatement = statement as NodeD1Statement;
        const operation = nodeStatement.query
          .trimStart()
          .split(/\s+/, 1)[0]
          .toUpperCase();
        results.push(
          operation === 'SELECT' || operation === 'PRAGMA'
            ? await statement.all<T>()
            : await statement.run<T>(),
        );
      }
      this.database.exec('COMMIT');
      return results;
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }
}

function requestHeaders(request: IncomingMessage): Headers {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((item) => headers.append(name, item));
    } else {
      headers.set(name, value);
    }
  }
  return headers;
}

async function toWebRequest(request: IncomingMessage): Promise<Request> {
  const forwardedProto = String(request.headers['x-forwarded-proto'] || 'http')
    .split(',')[0]
    .trim();
  const host = request.headers.host || '127.0.0.1';
  const method = request.method || 'GET';
  const hasBody = method !== 'GET' && method !== 'HEAD';
  const init: RequestInit & { duplex?: 'half' } = {
    method,
    headers: requestHeaders(request),
    redirect: 'manual',
  };
  if (hasBody) {
    init.body = Readable.toWeb(request) as ReadableStream<Uint8Array>;
    init.duplex = 'half';
  }
  return new Request(
    `${forwardedProto}://${host}${request.url || '/'}`,
    init,
  );
}

async function sendWebResponse(
  response: Response,
  target: ServerResponse,
): Promise<void> {
  target.statusCode = response.status;
  target.statusMessage = response.statusText;

  const setCookies =
    typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [];
  response.headers.forEach((value, name) => {
    if (name.toLowerCase() !== 'set-cookie') {
      target.setHeader(name, value);
    }
  });
  setCookies.forEach((cookie) => target.appendHeader('set-cookie', cookie));

  if (!response.body || response.status === 204 || response.status === 304) {
    target.end();
    return;
  }

  const body = Buffer.from(await response.arrayBuffer());
  target.setHeader('content-length', String(body.length));
  target.end(body);
}

const dbPath = process.env.DB_PATH || '/srv/photoblock/shared/photoblock.sqlite';
const port = Number(process.env.PORT || '8787');
const database = new DatabaseSync(dbPath);
database.exec('PRAGMA journal_mode = WAL');
database.exec('PRAGMA foreign_keys = ON');
database.exec('PRAGMA busy_timeout = 5000');

const env = {
  ...process.env,
  MEDIA_BASE_URL: process.env.MEDIA_BASE_URL ?? '',
  ALIYUN_OSS_REGION: process.env.ALIYUN_OSS_REGION ?? '',
  ALIYUN_OSS_BUCKET: process.env.ALIYUN_OSS_BUCKET ?? '',
  ALIYUN_OSS_ENDPOINT: process.env.ALIYUN_OSS_ENDPOINT ?? '',
  ALIYUN_OSS_ACCESS_KEY_ID: process.env.ALIYUN_OSS_ACCESS_KEY_ID ?? '',
  ALIYUN_OSS_ACCESS_KEY_SECRET:
    process.env.ALIYUN_OSS_ACCESS_KEY_SECRET ?? '',
  ALIYUN_OSS_PREFIX: process.env.ALIYUN_OSS_PREFIX ?? '',
  PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL ?? '',
  DB: new NodeD1Database(database),
  ASSETS: {
    async fetch() {
      return new Response('Not found', { status: 404 });
    },
  },
} as unknown as Env;

const context: ExecutionContext = {
  waitUntil() {},
  passThroughOnException() {},
};

const server = createServer(async (request, response) => {
  try {
    const webRequest = await toWebRequest(request);
    const webResponse = await worker.fetch(webRequest, env, context);
    await sendWebResponse(webResponse, response);
  } catch (error) {
    console.error('[aliyun-server] request failed', error);
    if (!response.headersSent) response.statusCode = 500;
    response.end('Internal Server Error');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`[aliyun-server] listening on 127.0.0.1:${port}`);
  console.log(`[aliyun-server] database: ${dbPath}`);
});

function shutdown() {
  server.close(() => {
    database.close();
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

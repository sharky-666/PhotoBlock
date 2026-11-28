import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { siteSettings } from '@server/database/schema';
import { eq } from 'drizzle-orm';
import * as crypto from 'node:crypto';
import type { OssConfig, OssUploadSignature } from '@shared/api.interface';

const OSS_SETTING_KEYS = [
  'oss_access_key_id',
  'oss_access_key_secret',
  'oss_bucket',
  'oss_endpoint',
  'oss_custom_domain',
] as const;

type OssSettingKey = (typeof OSS_SETTING_KEYS)[number];

function getEncryptionKey(): Buffer {
  const raw =
    process.env.OSS_CONFIG_ENCRYPTION_KEY ??
    'demo-oss-config-key-replace-before-deployment';
  return crypto.createHash('sha256').update(raw).digest();
}

function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

function decrypt(ciphertext: string): string {
  if (!ciphertext) return '';
  const parts = ciphertext.split(':');
  if (parts.length !== 3) return ciphertext;
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(parts[0], 'base64');
    const tag = Buffer.from(parts[1], 'base64');
    const encrypted = Buffer.from(parts[2], 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch {
    return '';
  }
}

function randomString(len: number): string {
  return crypto.randomBytes(len).toString('hex').slice(0, len);
}

function getExt(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx) : '';
}

@Injectable()
export class OssService {
  private readonly logger = new Logger(OssService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getConfig(): Promise<OssConfig> {
    const allRows = await this.db.select().from(siteSettings);
    const map = new Map<string, string>();
    for (const row of allRows) {
      map.set(row.settingKey, row.settingValue);
    }

    const accessKeyId = decrypt(map.get('oss_access_key_id') ?? '');
    const accessKeySecret = decrypt(map.get('oss_access_key_secret') ?? '');
    const bucket = map.get('oss_bucket') ?? '';
    const endpoint = map.get('oss_endpoint') ?? '';
    const customDomain = map.get('oss_custom_domain') ?? '';

    const isConfigured = Boolean(
      accessKeyId && accessKeySecret && bucket && endpoint,
    );

    return {
      accessKeyId: accessKeyId ? '••••••••' + accessKeyId.slice(-4) : '',
      accessKeySecret: '',
      bucket,
      endpoint,
      customDomain,
      isConfigured,
    };
  }

  async getRawConfig(): Promise<{
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
    endpoint: string;
    customDomain: string;
  } | null> {
    const allRows = await this.db.select().from(siteSettings);
    const map = new Map<string, string>();
    for (const row of allRows) {
      map.set(row.settingKey, row.settingValue);
    }

    const accessKeyId = decrypt(map.get('oss_access_key_id') ?? '');
    const accessKeySecret = decrypt(map.get('oss_access_key_secret') ?? '');
    const bucket = map.get('oss_bucket') ?? '';
    const endpoint = map.get('oss_endpoint') ?? '';
    const customDomain = map.get('oss_custom_domain') ?? '';

    if (!accessKeyId || !accessKeySecret || !bucket || !endpoint) {
      return null;
    }
    return { accessKeyId, accessKeySecret, bucket, endpoint, customDomain };
  }

  async updateConfig(patch: Record<string, string>): Promise<OssConfig> {
    const entries: [OssSettingKey, string][] = [];
    const keyMap: Record<string, OssSettingKey> = {
      accessKeyId: 'oss_access_key_id',
      accessKeySecret: 'oss_access_key_secret',
      bucket: 'oss_bucket',
      endpoint: 'oss_endpoint',
      customDomain: 'oss_custom_domain',
    };

    for (const [camelKey, value] of Object.entries(patch)) {
      const snakeKey = keyMap[camelKey];
      if (!snakeKey) continue;
      entries.push([snakeKey, value]);
    }

    if (entries.length === 0) return this.getConfig();

    await this.db.transaction(async (tx) => {
      for (const [key, value] of entries) {
        let storedValue = value;
        const isSecret = key === 'oss_access_key_id' || key === 'oss_access_key_secret';
        if (isSecret) {
          if (!value || value.startsWith('••••••••')) continue;
          storedValue = encrypt(value);
        }
        await tx
          .insert(siteSettings)
          .values({ settingKey: key, settingValue: storedValue })
          .onConflictDoUpdate({
            target: siteSettings.settingKey,
            set: { settingValue: storedValue },
          });
      }
    });

    return this.getConfig();
  }

  async generateUploadSignature(
    filename: string,
    contentType?: string,
  ): Promise<OssUploadSignature> {
    const config = await this.getRawConfig();
    if (!config) {
      throw new BadRequestException('OSS 未配置');
    }

    const { accessKeyId, accessKeySecret, bucket, endpoint, customDomain } = config;
    const date = new Date();
    const dir = `artworks/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    const ext = getExt(filename);
    const randomName = randomString(16);
    const fileName = `${dir}/${randomName}${ext}`;

    const expiration = new Date(date.getTime() + 30 * 60 * 1000).toISOString();

    const conditions: unknown[] = [
      ['content-length-range', 0, 500 * 1024 * 1024],
      ['starts-with', '$key', dir + '/'],
    ];

    const policy = {
      expiration,
      conditions,
    };

    const policyBase64 = Buffer.from(JSON.stringify(policy)).toString('base64');
    const signature = crypto
      .createHmac('sha1', accessKeySecret)
      .update(policyBase64)
      .digest('base64');

    const host = customDomain
      ? `https://${customDomain}`
      : `https://${bucket}.${endpoint}`;

    return {
      host,
      dir,
      policy: policyBase64,
      signature,
      ossAccessKeyId: accessKeyId,
      filePath: fileName,
      fileUrl: `${host}/${fileName}`,
    };
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const config = await this.getRawConfig();
    if (!config) {
      return { success: false, message: '请先填写完整的 OSS 配置' };
    }

    const { accessKeyId, accessKeySecret, bucket, endpoint } = config;

    try {
      const date = new Date().toUTCString();
      const resource = `/${bucket}/`;
      const stringToSign = `GET\n\n\n${date}\n${resource}`;
      const signature = crypto
        .createHmac('sha1', accessKeySecret)
        .update(stringToSign)
        .digest('base64');

      const authHeader = `OSS ${accessKeyId}:${signature}`;

      const response = await fetch(`https://${bucket}.${endpoint}/?max-keys=1`, {
        method: 'GET',
        headers: {
          Date: date,
          Authorization: authHeader,
          Host: `${bucket}.${endpoint}`,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        return { success: true, message: '连接成功，Bucket 访问正常' };
      }

      const body = await response.text().catch(() => '');
      this.logger.warn(`OSS test connection failed: ${response.status} ${body.slice(0, 200)}`);

      if (response.status === 403) {
        return { success: false, message: 'AccessKey 权限不足或签名错误（403）' };
      }
      if (response.status === 404) {
        return { success: false, message: 'Bucket 不存在或 Endpoint 错误（404）' };
      }
      return { success: false, message: `连接失败：HTTP ${response.status}` };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`OSS test connection error: ${msg}`);
      return { success: false, message: `网络错误：${msg}` };
    }
  }
}

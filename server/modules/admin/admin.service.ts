import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { and, eq, gt } from 'drizzle-orm';
import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { adminConfig, adminSession } from '@server/database/schema';

const scryptAsync = promisify(scrypt);

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  private async verifyPassword(
    password: string,
    storedHash: string,
  ): Promise<boolean> {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    const storedBuf = Buffer.from(hash, 'hex');
    if (derivedKey.length !== storedBuf.length) return false;
    return timingSafeEqual(derivedKey, storedBuf);
  }

  async login(
    username: string,
    password: string,
  ): Promise<{ token: string; username: string }> {
    const admins = await this.db
      .select()
      .from(adminConfig)
      .where(
        and(
          eq(adminConfig.username, username),
          eq(adminConfig.isActive, true),
        ),
      );

    if (admins.length === 0 || !admins[0].passwordHash) {
      throw new BadRequestException('用户名或密码错误');
    }

    const admin = admins[0];
    const valid = await this.verifyPassword(password, admin.passwordHash);
    if (!valid) {
      throw new BadRequestException('用户名或密码错误');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.db.insert(adminSession).values({
      adminId: admin.id,
      token,
      expiresAt,
    });

    this.logger.log(`管理员 ${username} 登录成功`);
    return { token, username };
  }

  async validateSession(
    token: string,
  ): Promise<{ adminId: string; username: string } | null> {
    const rows = await this.db
      .select({
        adminId: adminSession.adminId,
        username: adminConfig.username,
      })
      .from(adminSession)
      .innerJoin(adminConfig, eq(adminSession.adminId, adminConfig.id))
      .where(
        and(
          eq(adminSession.token, token),
          gt(adminSession.expiresAt, new Date()),
          eq(adminConfig.isActive, true),
        ),
      );

    if (rows.length === 0) return null;
    const row = rows[0];
    if (!row.username) return null;
    return { adminId: row.adminId, username: row.username };
  }

  async logout(token: string): Promise<void> {
    await this.db.delete(adminSession).where(eq(adminSession.token, token));
  }

  async changePassword(
    adminId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean }> {
    const admins = await this.db
      .select()
      .from(adminConfig)
      .where(eq(adminConfig.id, adminId));

    if (admins.length === 0 || !admins[0].passwordHash) {
      throw new BadRequestException('管理员不存在');
    }

    const admin = admins[0];
    const valid = await this.verifyPassword(oldPassword, admin.passwordHash);
    if (!valid) {
      throw new BadRequestException('原密码错误');
    }

    const newHash = await this.hashPassword(newPassword);
    await this.db
      .update(adminConfig)
      .set({ passwordHash: newHash })
      .where(eq(adminConfig.id, adminId));

    this.logger.log(`管理员 ${adminId} 修改了密码`);
    return { success: true };
  }

  async ensureDefaultAdmin(): Promise<void> {
    const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
    const bootstrapUsername =
      process.env.ADMIN_BOOTSTRAP_USERNAME?.trim() || 'admin';

    if (!bootstrapPassword) {
      this.logger.warn(
        'ADMIN_BOOTSTRAP_PASSWORD 未配置，跳过管理员初始化',
      );
      return;
    }
    if (bootstrapPassword.length < 12) {
      throw new Error(
        'ADMIN_BOOTSTRAP_PASSWORD 至少需要 12 个字符',
      );
    }

    const existing = await this.db
      .select()
      .from(adminConfig)
      .where(eq(adminConfig.username, bootstrapUsername));

    if (existing.length > 0) {
      return;
    }

    const passwordHash = await this.hashPassword(bootstrapPassword);
    await this.db.insert(adminConfig).values({
      username: bootstrapUsername,
      passwordHash,
      isActive: true,
      adminUser: '',
    });

    this.logger.log(`已创建管理员 ${bootstrapUsername}`);
  }
}

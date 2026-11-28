/* eslint-disable */
/** auto generated, do not edit */
import { sql } from 'drizzle-orm';
import { bigint, boolean, date, foreignKey, index, integer, numeric, pgTable, text, uniqueIndex, uuid, varchar, customType } from "drizzle-orm/pg-core"

export const customTimestamptz = customType<{
  data: Date;
  driverData: string;
  config: { precision?: number };
}>({
  dataType(config) {
    const precision = typeof config?.precision !== 'undefined'
      ? ` (${config.precision})`
      : '';
    return `timestamptz${precision}`;
  },
  toDriver(value: Date | string | number) {
    if (value == null) return value as any;
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    throw new Error('Invalid timestamp value');
  },
  fromDriver(value: string | Date): Date {
    if (value instanceof Date) return value;
    return new Date(value);
  },
});

export const userProfile = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'user_profile';
  },
  toDriver(value: string) {
    return sql`ROW(${value})::user_profile`;
  },
  fromDriver(value: string) {
    const [userId] = value.slice(1, -1).split(',');
    return userId.trim();
  },
});

export type FileAttachment = {
  bucket_id: string;
  file_path: string;
};

export const fileAttachment = customType<{
  data: FileAttachment;
  driverData: string;
}>({
  dataType() {
    return 'file_attachment';
  },
  toDriver(value: FileAttachment) {
    return sql`ROW(${value.bucket_id},${value.file_path})::file_attachment`;
  },
  fromDriver(value: string): FileAttachment {
    const [bucketId, filePath] = value.slice(1, -1).split(',');
    return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
  },
});

export function escapeLiteral(str: string): string {
  return "'" + str.replace(/'/g, "''") + "'";
}

export const userProfileArray = customType<{
  data: string[];
  driverData: string;
}>({
  dataType() {
    return 'user_profile[]';
  },
  toDriver(value: string[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::user_profile[]`;
    }
    const elements = value.map(id => `ROW(${escapeLiteral(id)})::user_profile`).join(',');
    return sql.raw(`ARRAY[${elements}]::user_profile[]`);
  },
  fromDriver(value: string): string[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => m.slice(1, -1).split(',')[0].trim());
  },
});

export const fileAttachmentArray = customType<{
  data: FileAttachment[];
  driverData: string;
}>({
  dataType() {
    return 'file_attachment[]';
  },
  toDriver(value: FileAttachment[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::file_attachment[]`;
    }
    const elements = value.map(f =>
      `ROW(${escapeLiteral(f.bucket_id)},${escapeLiteral(f.file_path)})::file_attachment`
    ).join(',');
    return sql.raw(`ARRAY[${elements}]::file_attachment[]`);
  },
  fromDriver(value: string): FileAttachment[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => {
      const [bucketId, filePath] = m.slice(1, -1).split(',');
      return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
    });
  },
});

export const heroSlide = pgTable("hero_slide", {
  id: uuid("id").primaryKey().defaultRandom(),
  mediaType: varchar("media_type", { length: 20 }).notNull().default('image'),
  mediaUrl: text("media_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: varchar("subtitle", { length: 255 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_hero_slide_sort").on(table.sortOrder),
  index("idx_hero_slide_active").on(table.isActive),
]);

export const siteSettings = pgTable("site_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  settingKey: varchar("setting_key", { length: 50 }).notNull().unique(),
  settingValue: text("setting_value").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("site_settings_setting_key_key").on(table.settingKey),
]);

export const adminSession = pgTable("admin_session", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: uuid("admin_id").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: customTimestamptz("expires_at", { precision: 3 }).notNull(),
  createdAt: customTimestamptz("created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("admin_session_token_key").on(table.token),
  foreignKey({
    columns: [table.adminId],
    foreignColumns: [adminConfig.id],
    name: "admin_session_admin_id_fkey",
  }).onDelete("cascade"),
]);

export const adminPasscode = pgTable("admin_passcode", {
  id: uuid("id").primaryKey().defaultRandom(),
  passcode: varchar("passcode", { length: 100 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const adminConfig = pgTable("admin_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminUser: userProfile("admin_user").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  username: varchar("username", { length: 100 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  // Complex index: CREATE UNIQUE INDEX idx_admin_config_user_unique ON admin_config USING btree (((admin_user).user_id)),
  uniqueIndex("idx_admin_config_username_unique").on(table.username),
]);

export const artwork = pgTable("artwork", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  mediaType: varchar("media_type", { length: 20 }).notNull().default('image'),
  width: integer("width"),
  height: integer("height"),
  seriesId: uuid("series_id"),
  categoryId: uuid("category_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  location: varchar("location", { length: 255 }),
  takenAt: date("taken_at"),
  durationSeconds: integer("duration_seconds"),
  fps: numeric("fps"),
  quality: varchar("quality", { length: 20 }),
  fileSize: bigint("file_size", { mode: 'number' }),
  cameraModel: varchar("camera_model", { length: 255 }),
  lensModel: varchar("lens_model", { length: 255 }),
  aperture: varchar("aperture", { length: 20 }),
  shutterSpeed: varchar("shutter_speed", { length: 30 }),
  iso: integer("iso"),
  focalLength: varchar("focal_length", { length: 30 }),
  exposureCompensation: varchar("exposure_compensation", { length: 30 }),
  whiteBalance: varchar("white_balance", { length: 50 }),
  takenAtTime: varchar("taken_at_time", { length: 20 }),
  viewCount: integer("view_count").notNull().default(0),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  shotDirection: numeric("shot_direction"),
  shotAltitude: numeric("shot_altitude"),
  shotAngle: numeric("shot_angle"),
  cameraPositionDesc: text("camera_position_desc"),
  rawFileUrl: text("raw_file_url"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_artwork_series_id").on(table.seriesId),
  index("idx_artwork_category_id").on(table.categoryId),
  index("idx_artwork_view_count").on(table.viewCount),
  index("idx_artwork_lat_lng").on(table.latitude, table.longitude),
  foreignKey({
    columns: [table.seriesId],
    foreignColumns: [series.id],
    name: "artwork_series_id_fkey",
  }).onDelete("set null"),
  foreignKey({
    columns: [table.categoryId],
    foreignColumns: [category.id],
    name: "artwork_category_id_fkey",
  }).onDelete("set null"),
]);

export const category = pgTable("category", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameZh: varchar("name_zh", { length: 100 }).notNull(),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
  description: text("description").notNull(),
  coverUrl: text("cover_url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  mediaType: varchar("media_type", { length: 20 }).notNull().default('image'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_category_media_type").on(table.mediaType),
]);

export const series = pgTable("series", {
  id: uuid("id").primaryKey().defaultRandom(),
  titleZh: varchar("title_zh", { length: 255 }).notNull(),
  titleEn: varchar("title_en", { length: 255 }).notNull(),
  description: text("description").notNull(),
  yearStart: integer("year_start"),
  yearEnd: integer("year_end"),
  coverUrl: text("cover_url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  mediaType: varchar("media_type", { length: 20 }).notNull().default('image'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_series_featured").on(table.isFeatured),
  index("idx_series_media_type").on(table.mediaType),
]);

// table aliases
export const adminConfigTable = adminConfig;
export const adminPasscodeTable = adminPasscode;
export const adminSessionTable = adminSession;
export const artworkTable = artwork;
export const categoryTable = category;
export const heroSlideTable = heroSlide;
export const seriesTable = series;
export const siteSettingsTable = siteSettings;

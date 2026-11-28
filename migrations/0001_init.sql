PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS series (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title_zh TEXT NOT NULL,
  title_en TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  year_start INTEGER,
  year_end INTEGER,
  cover_key TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_featured INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0, 1)),
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  alt_text TEXT,
  seo_title TEXT,
  seo_description TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_series_featured
  ON series (is_featured, status, sort_order);
CREATE INDEX IF NOT EXISTS idx_series_media_type
  ON series (media_type, status, sort_order);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  cover_key TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  alt_text TEXT,
  seo_title TEXT,
  seo_description TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_media_type
  ON categories (media_type, status, sort_order);

CREATE TABLE IF NOT EXISTS artworks (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_key TEXT NOT NULL,
  raw_file_key TEXT,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  width INTEGER,
  height INTEGER,
  series_id TEXT REFERENCES series (id) ON DELETE SET NULL,
  category_id TEXT REFERENCES categories (id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_featured INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0, 1)),
  location TEXT,
  taken_at TEXT,
  duration_seconds INTEGER,
  fps REAL,
  quality TEXT,
  file_size INTEGER,
  camera_model TEXT,
  lens_model TEXT,
  aperture TEXT,
  shutter_speed TEXT,
  iso INTEGER,
  focal_length TEXT,
  exposure_compensation TEXT,
  white_balance TEXT,
  taken_at_time TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  latitude REAL,
  longitude REAL,
  shot_direction REAL,
  shot_altitude REAL,
  shot_angle REAL,
  camera_position_desc TEXT,
  alt_text TEXT,
  seo_title TEXT,
  seo_description TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_artworks_series_id
  ON artworks (series_id, status, sort_order);
CREATE INDEX IF NOT EXISTS idx_artworks_category_id
  ON artworks (category_id, status, sort_order);
CREATE INDEX IF NOT EXISTS idx_artworks_media_type
  ON artworks (media_type, status, sort_order);
CREATE INDEX IF NOT EXISTS idx_artworks_featured
  ON artworks (is_featured, status, created_at);
CREATE INDEX IF NOT EXISTS idx_artworks_location
  ON artworks (location, latitude, longitude);

CREATE TABLE IF NOT EXISTS hero_slides (
  id TEXT PRIMARY KEY,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  media_key TEXT NOT NULL,
  thumbnail_key TEXT,
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hero_slides_sort
  ON hero_slides (is_active, sort_order);

CREATE TABLE IF NOT EXISTS site_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS view_events (
  id TEXT PRIMARY KEY,
  artwork_id TEXT NOT NULL REFERENCES artworks (id) ON DELETE CASCADE,
  visitor_hash TEXT NOT NULL,
  view_day TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (artwork_id, visitor_hash, view_day)
);

CREATE INDEX IF NOT EXISTS idx_view_events_artwork
  ON view_events (artwork_id, view_day);

CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  source_page TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status
  ON contact_messages (status, created_at);

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES admin_users (id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id
  ON admin_sessions (admin_id, expires_at);

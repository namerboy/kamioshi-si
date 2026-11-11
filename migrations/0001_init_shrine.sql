-- Kamioshi.si D1 Schema (Optimized for 100k+ plaques & tags with O(1) stats & zero-scan indexes)

CREATE TABLE IF NOT EXISTS plaques (
  coordinate INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT NOT NULL UNIQUE,
  kamioshi_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  message TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT 'Fan',
  location TEXT NOT NULL DEFAULT 'Everywhere',
  country_code TEXT NOT NULL DEFAULT 'EARTH',
  wood_type TEXT NOT NULL DEFAULT 'hinoki',
  cord_color TEXT NOT NULL DEFAULT 'crimson',
  stamp TEXT NOT NULL DEFAULT '推',
  bow_count INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'Universal',
  author_token_hash TEXT,
  report_count INTEGER NOT NULL DEFAULT 0,
  is_hidden INTEGER NOT NULL DEFAULT 0
);

-- Zero-scan composite indexes for cursor/offset pagination across 100k+ rows
CREATE INDEX IF NOT EXISTS idx_plaques_visible_newest
  ON plaques(is_hidden, coordinate DESC);

CREATE INDEX IF NOT EXISTS idx_plaques_visible_oldest
  ON plaques(is_hidden, coordinate ASC);

CREATE INDEX IF NOT EXISTS idx_plaques_visible_bows
  ON plaques(is_hidden, bow_count DESC, coordinate DESC);

CREATE INDEX IF NOT EXISTS idx_plaques_cat_newest
  ON plaques(is_hidden, category, coordinate DESC);

CREATE INDEX IF NOT EXISTS idx_plaques_cat_oldest
  ON plaques(is_hidden, category, coordinate ASC);

CREATE INDEX IF NOT EXISTS idx_plaques_cat_bows
  ON plaques(is_hidden, category, bow_count DESC, coordinate DESC);

-- Inverted token index (supports both Latin prefix search and CJK bigram search without full scans)
CREATE TABLE IF NOT EXISTS plaque_tokens (
  token TEXT NOT NULL,
  coordinate INTEGER NOT NULL,
  PRIMARY KEY (token, coordinate)
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS idx_plaque_tokens_coord
  ON plaque_tokens(coordinate);

-- O(1) Pre-aggregated counters so page loads read ~15 rows instead of scanning 100,000 rows
CREATE TABLE IF NOT EXISTS shrine_stats (
  stat_key TEXT PRIMARY KEY,
  stat_value INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO shrine_stats (stat_key, stat_value) VALUES
  ('total_plaques', 0),
  ('total_bells', 0),
  ('unique_locations', 0),
  ('max_coordinate', 0),
  ('cat_vtuber', 0),
  ('cat_kpop', 0),
  ('cat_anime', 0),
  ('cat_esports', 0),
  ('cat_music', 0),
  ('cat_creator', 0),
  ('cat_athlete', 0),
  ('cat_place', 0),
  ('cat_pet', 0),
  ('cat_tech', 0),
  ('cat_icon', 0),
  ('cat_other', 0);

-- Unique city/location tracking for O(1) unique location counter updates
CREATE TABLE IF NOT EXISTS shrine_locations (
  location_norm TEXT PRIMARY KEY,
  plaque_count INTEGER NOT NULL DEFAULT 0
);

-- Scalable 100k+ Tag / Kamioshi directory with indexed popularity and prefix lookup
CREATE TABLE IF NOT EXISTS shrine_tags (
  tag_norm TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  plaque_count INTEGER NOT NULL DEFAULT 1,
  bow_total INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shrine_tags_popular
  ON shrine_tags(plaque_count DESC, bow_total DESC);

-- Server-side rate limiting table by hashed IP
CREATE TABLE IF NOT EXISTS rate_limits (
  ip_hash TEXT PRIMARY KEY,
  last_plaque_ts INTEGER NOT NULL DEFAULT 0,
  window_start_ts INTEGER NOT NULL DEFAULT 0,
  window_count INTEGER NOT NULL DEFAULT 0
);

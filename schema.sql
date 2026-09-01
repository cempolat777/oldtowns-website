CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  category TEXT NOT NULL DEFAULT 'Walking Tours',
  channel TEXT,
  channel_title TEXT,
  channel_id TEXT,
  badge TEXT,
  published_at TEXT,
  city TEXT,
  country TEXT,
  raw_json TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_videos_category
ON videos(category);

CREATE INDEX IF NOT EXISTS idx_videos_city
ON videos(city);

CREATE INDEX IF NOT EXISTS idx_videos_country
ON videos(country);

CREATE INDEX IF NOT EXISTS idx_videos_published_at
ON videos(published_at);

CREATE INDEX IF NOT EXISTS idx_videos_active
ON videos(active);

CREATE INDEX IF NOT EXISTS idx_videos_channel_id
ON videos(channel_id);


CREATE TABLE IF NOT EXISTS video_descriptions (
  video_id TEXT NOT NULL,
  lang TEXT NOT NULL,
  seo_title TEXT,
  seo_description TEXT,
  page_description TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (video_id, lang),

  FOREIGN KEY (video_id)
    REFERENCES videos(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_video_descriptions_lang
ON video_descriptions(lang);


CREATE TABLE IF NOT EXISTS ingestion_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id TEXT,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ingestion_log_video_id
ON ingestion_log(video_id);

CREATE INDEX IF NOT EXISTS idx_ingestion_log_created_at
ON ingestion_log(created_at);
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS hotels (
  id TEXT PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  city TEXT,
  country TEXT,
  address TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  geohash6 TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hotels_location
ON hotels(country, city, active);

CREATE INDEX IF NOT EXISTS idx_hotels_geohash6
ON hotels(geohash6, active);

CREATE TABLE IF NOT EXISTS hotel_sources (
  hotel_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_hotel_id TEXT NOT NULL,
  star_rating REAL,
  guest_rating REAL,
  review_count INTEGER,
  thumbnail_url TEXT,
  booking_url TEXT,
  content_expires_at TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (provider, provider_hotel_id),

  FOREIGN KEY (hotel_id)
    REFERENCES hotels(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_hotel_sources_hotel
ON hotel_sources(hotel_id, active);

CREATE INDEX IF NOT EXISTS idx_hotel_sources_expiry
ON hotel_sources(content_expires_at);

CREATE TABLE IF NOT EXISTS video_hotels (
  video_id TEXT NOT NULL,
  hotel_id TEXT NOT NULL,
  distance_meters INTEGER NOT NULL,
  selection_score REAL NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL,
  match_method TEXT NOT NULL DEFAULT 'route',
  verified INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (video_id, hotel_id),

  FOREIGN KEY (video_id)
    REFERENCES videos(id)
    ON DELETE CASCADE,

  FOREIGN KEY (hotel_id)
    REFERENCES hotels(id)
    ON DELETE CASCADE,

  CHECK (distance_meters >= 0),
  CHECK (rank > 0),
  CHECK (match_method IN ('route', 'landmark', 'airport', 'city'))
);

CREATE INDEX IF NOT EXISTS idx_video_hotels_rank
ON video_hotels(video_id, active, verified, rank);

CREATE INDEX IF NOT EXISTS idx_video_hotels_hotel
ON video_hotels(hotel_id, active);

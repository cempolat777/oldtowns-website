-- Local integration test data only.
-- Distances are Ikebukuro station-area proxies and must be replaced by
-- route-based measurements before production use.

PRAGMA foreign_keys = ON;

INSERT INTO hotels (
  id,
  canonical_name,
  city,
  country,
  address,
  latitude,
  longitude,
  active
) VALUES
  (
    'hotel-metropolitan-tokyo-ikebukuro',
    'Hotel Metropolitan Tokyo Ikebukuro',
    'Tokyo',
    'Japan',
    '1-6-1 Nishi-Ikebukuro, Toshima-ku, Tokyo 171-8505, Japan',
    35.7283502,
    139.7079847,
    1
  ),
  (
    'the-b-ikebukuro',
    'the b ikebukuro',
    'Tokyo',
    'Japan',
    '1-39-4 Higashiikebukuro, Toshima-ku, Tokyo 170-0013, Japan',
    35.7323509,
    139.7115999,
    1
  ),
  (
    'sunshine-city-prince-hotel',
    'Sunshine City Prince Hotel',
    'Tokyo',
    'Japan',
    '3-1-5 Higashi-Ikebukuro, Toshima-ku, Tokyo 170-8440, Japan',
    35.729605,
    139.719440,
    1
  )
ON CONFLICT(id) DO UPDATE SET
  canonical_name = excluded.canonical_name,
  city = excluded.city,
  country = excluded.country,
  address = excluded.address,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  active = excluded.active,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO hotel_sources (
  hotel_id,
  provider,
  provider_hotel_id,
  booking_url,
  active
) VALUES
  (
    'hotel-metropolitan-tokyo-ikebukuro',
    'official',
    'hotel-metropolitan-tokyo-ikebukuro',
    'https://tokyo-ikebukuro.hotel-metropolitan.com/',
    1
  ),
  (
    'the-b-ikebukuro',
    'official',
    'the-b-ikebukuro',
    'https://en.theb-hotels.com/theb/ikebukuro',
    1
  ),
  (
    'sunshine-city-prince-hotel',
    'official',
    'sunshine-city-prince-hotel',
    'https://www.princehotels.com/sunshine/',
    1
  )
ON CONFLICT(provider, provider_hotel_id) DO UPDATE SET
  hotel_id = excluded.hotel_id,
  booking_url = excluded.booking_url,
  active = excluded.active,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO video_hotels (
  video_id,
  hotel_id,
  distance_meters,
  selection_score,
  rank,
  match_method,
  verified,
  active
) VALUES
  (
    'pON9O5Ski8U',
    'hotel-metropolitan-tokyo-ikebukuro',
    200,
    100,
    1,
    'landmark',
    1,
    1
  ),
  (
    'pON9O5Ski8U',
    'the-b-ikebukuro',
    350,
    90,
    2,
    'landmark',
    1,
    1
  ),
  (
    'pON9O5Ski8U',
    'sunshine-city-prince-hotel',
    800,
    80,
    3,
    'landmark',
    1,
    1
  )
ON CONFLICT(video_id, hotel_id) DO UPDATE SET
  distance_meters = excluded.distance_meters,
  selection_score = excluded.selection_score,
  rank = excluded.rank,
  match_method = excluded.match_method,
  verified = excluded.verified,
  active = excluded.active,
  updated_at = CURRENT_TIMESTAMP;

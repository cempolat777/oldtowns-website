import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_VIDEOS_PATH = path.join(
  __dirname,
  'src',
  'data',
  'videos.json'
);

const DEFAULT_OUTPUT_PATH = path.join(
  __dirname,
  'sync-videos.generated.sql'
);

function parseArguments(argv) {
  const args = {
    videosPath: DEFAULT_VIDEOS_PATH,
    outputPath: DEFAULT_OUTPUT_PATH,
    hotelsOnly: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--input' && argv[index + 1]) {
      args.videosPath = path.resolve(argv[++index]);
    } else if (value === '--output' && argv[index + 1]) {
      args.outputPath = path.resolve(argv[++index]);
    } else if (value === '--hotels-only') {
      args.hotelsOnly = true;
    }
  }

  return args;
}

function sqlValue(value) {
  if (value === undefined || value === null) {
    return 'NULL';
  }

  const cleaned = String(value)
    .replace(/\0/g, '')
    .replace(/'/g, "''");

  return `'${cleaned}'`;
}

function normalizeVideo(video) {
  return {
    id: String(video.id || '').trim(),
    title: String(video.title || '').trim(),

    description:
      video.description !== undefined
        ? String(video.description)
        : null,

    thumbnail:
      video.thumbnail !== undefined
        ? String(video.thumbnail)
        : null,

    category:
      video.category && String(video.category).trim()
        ? String(video.category).trim()
        : 'Walking Tours',

    channel:
      video.channel !== undefined
        ? String(video.channel)
        : null,

    channelTitle:
      video.channelTitle !== undefined
        ? String(video.channelTitle)
        : null,

    channelId:
      video.channelId !== undefined
        ? String(video.channelId)
        : null,

    badge:
      video.badge !== undefined
        ? String(video.badge)
        : null,

    publishedAt:
      video.publishedAt !== undefined
        ? String(video.publishedAt)
        : null,

    city:
      video.city !== undefined
        ? String(video.city)
        : null,

    country:
      video.country !== undefined
        ? String(video.country)
        : null,

    rawJson: JSON.stringify(video)
  };
}

function buildInsertStatement(video) {
  return `
INSERT INTO videos (
  id,
  title,
  description,
  thumbnail,
  category,
  channel,
  channel_title,
  channel_id,
  badge,
  published_at,
  city,
  country,
  raw_json,
  active
)
VALUES (
  ${sqlValue(video.id)},
  ${sqlValue(video.title)},
  ${sqlValue(video.description)},
  ${sqlValue(video.thumbnail)},
  ${sqlValue(video.category)},
  ${sqlValue(video.channel)},
  ${sqlValue(video.channelTitle)},
  ${sqlValue(video.channelId)},
  ${sqlValue(video.badge)},
  ${sqlValue(video.publishedAt)},
  ${sqlValue(video.city)},
  ${sqlValue(video.country)},
  ${sqlValue(video.rawJson)},
  1
)
ON CONFLICT(id) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  thumbnail = excluded.thumbnail,
  category = excluded.category,
  channel = excluded.channel,
  channel_title = excluded.channel_title,
  channel_id = excluded.channel_id,
  badge = excluded.badge,
  published_at = excluded.published_at,
  city = excluded.city,
  country = excluded.country,
  raw_json = excluded.raw_json,
  active = 1,
  updated_at = CURRENT_TIMESTAMP;
`;
}

function loadVideos(videosPath) {
  if (!fs.existsSync(videosPath)) {
    throw new Error(
      `Videos file was not found: ${videosPath}`
    );
  }

  const raw = fs.readFileSync(
    videosPath,
    'utf8'
  );

  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(
      'videos.json must contain a JSON array.'
    );
  }

  return parsed;
}

function validateVideos(videos) {
  const validVideos = [];
  const skippedVideos = [];
  const seenIds = new Set();

  for (const sourceVideo of videos) {
    const video = normalizeVideo(sourceVideo);

    if (!video.id) {
      skippedVideos.push({
        id: '(missing)',
        reason: 'Missing video id'
      });

      continue;
    }

    if (!video.title) {
      skippedVideos.push({
        id: video.id,
        reason: 'Missing video title'
      });

      continue;
    }

    if (seenIds.has(video.id)) {
      skippedVideos.push({
        id: video.id,
        reason: 'Duplicate video id'
      });

      continue;
    }

    seenIds.add(video.id);
    validVideos.push(video);
  }

  return {
    validVideos,
    skippedVideos
  };
}

const MAX_DISTANCE_METERS = 3000;
const EARTH_RADIUS_METERS = 6371000;

function hasTrustedRouteGeo(video) {
  const geo = video?.geo;
  return geo?.verified === true &&
    geo?.integrityVerified === true &&
    ['route-point', 'landmark', 'airport'].includes(geo.precision) &&
    typeof geo.latitude === 'number' &&
    Number.isFinite(geo.latitude) &&
    Math.abs(geo.latitude) <= 90 &&
    typeof geo.longitude === 'number' &&
    Number.isFinite(geo.longitude) &&
    Math.abs(geo.longitude) <= 180;
}

function distanceInMeters(a, b) {
  const toRadians = Math.PI / 180;
  const latDelta = (b.latitude - a.latitude) * toRadians;
  const lngDelta = (b.longitude - a.longitude) * toRadians;
  const latitudeA = a.latitude * toRadians;
  const latitudeB = b.latitude * toRadians;
  const haversine = Math.sin(latDelta / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(lngDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(Math.min(1, haversine)));
}

function isVerifiedHotel(hotel) {
  return hotel?.verified === true &&
    hotel?.cityContextVerified !== false &&
    String(hotel?.id || '').trim() &&
    String(hotel?.name || '').trim() &&
    typeof hotel.latitude === 'number' &&
    Number.isFinite(hotel.latitude) &&
    Math.abs(hotel.latitude) <= 90 &&
    typeof hotel.longitude === 'number' &&
    Number.isFinite(hotel.longitude) &&
    Math.abs(hotel.longitude) <= 180;
}

// Source evidence is required for every hotel. A city name by itself never
// creates an association. Cross-video matches reuse existing verified places.
function collectVerifiedHotelLinks(videos) {
  const trustedVideos = [];
  const hotelPool = new Map();

  for (const normalized of videos) {
    const video = JSON.parse(normalized.rawJson);
    if (!hasTrustedRouteGeo(video)) continue;
    trustedVideos.push(video);

    for (const hotel of Array.isArray(video.nearbyHotels) ? video.nearbyHotels : []) {
      if (!isVerifiedHotel(hotel)) continue;
      if (distanceInMeters(video.geo, hotel) > MAX_DISTANCE_METERS) continue;
      if (!hotelPool.has(hotel.id)) {
        hotelPool.set(hotel.id, {
          id: hotel.id,
          name: hotel.name,
          city: hotel.city || null,
          country: hotel.country || null,
          address: hotel.address || null,
          latitude: hotel.latitude,
          longitude: hotel.longitude
        });
      }
    }
  }

  const links = [];
  for (const video of trustedVideos) {
    const nearby = [];
    const maxLatDelta = MAX_DISTANCE_METERS / 110574;
    const maxLngDelta = MAX_DISTANCE_METERS /
      (111320 * Math.max(0.001, Math.cos(video.geo.latitude * Math.PI / 180)));

    for (const hotel of hotelPool.values()) {
      if (Math.abs(video.geo.latitude - hotel.latitude) > maxLatDelta ||
          Math.abs(video.geo.longitude - hotel.longitude) > maxLngDelta) continue;
      const distance = distanceInMeters(video.geo, hotel);
      if (distance <= MAX_DISTANCE_METERS) {
        nearby.push({ videoId: video.id, hotelId: hotel.id, distance: Math.round(distance) });
      }
    }

    nearby.sort((a, b) => a.distance - b.distance || a.hotelId.localeCompare(b.hotelId));
    const method = video.geo.precision === 'airport' ? 'airport' :
      video.geo.precision === 'landmark' ? 'landmark' : 'route';
    for (const [index, link] of nearby.slice(0, 30).entries()) {
      links.push({ ...link, rank: index + 1, method });
    }
  }

  return { hotels: [...hotelPool.values()], links, trustedVideoCount: trustedVideos.length };
}

function buildHotelStatements(verified) {
  const statements = [
    '-- Only trusted route anchors and independently verified hotels are used.',
    '-- Preserve manually disabled hotels and video/hotel links.',
    '-- No video row is activated by the hotel synchronization.'
  ];

  // The production database already has these tables. A missing schema is an
  // operational error, not a reason to silently discard the hotel evidence.
  for (let index = 0; index < verified.hotels.length; index += 50) {
    const batch = verified.hotels.slice(index, index + 50);
    statements.push(`INSERT INTO hotels (
  id, canonical_name, city, country, address, latitude, longitude, active
) VALUES\n${batch.map((hotel) => `  (${[
  sqlValue(hotel.id), sqlValue(hotel.name), sqlValue(hotel.city),
  sqlValue(hotel.country), sqlValue(hotel.address),
  String(hotel.latitude), String(hotel.longitude), '1'
].join(', ')})`).join(',\n')}\nON CONFLICT(id) DO NOTHING;`);
  }

  for (const link of verified.links) {
    // INSERT ... SELECT ensures a hotels-only backfill cannot create an orphan
    // association or activate a video previously disabled in D1.
    statements.push(`INSERT INTO video_hotels (
  video_id, hotel_id, distance_meters, selection_score, rank,
  match_method, verified, active
)
SELECT ${sqlValue(link.videoId)}, ${sqlValue(link.hotelId)}, ${link.distance}, 0,
  ${link.rank}, ${sqlValue(link.method)}, 1, 1
FROM videos AS v
INNER JOIN hotels AS h ON h.id = ${sqlValue(link.hotelId)} AND h.active = 1
WHERE v.id = ${sqlValue(link.videoId)} AND v.active = 1
ON CONFLICT(video_id, hotel_id) DO UPDATE SET
  distance_meters = excluded.distance_meters,
  rank = excluded.rank,
  updated_at = CURRENT_TIMESTAMP
WHERE video_hotels.active = 1 AND video_hotels.verified = 1;`);
  }
  return statements;
}

function createSqlFile(videos, outputPath, hotelsOnly = false) {
  const verified = collectVerifiedHotelLinks(videos);
  const statements = hotelsOnly ? [] : videos.map(buildInsertStatement);
  const sql = [
    '-- Generated automatically from src/data/videos.json',
    '-- Safe additive/upsert D1 sync; archived videos remain unchanged.',
    '-- Hotel associations are limited to trusted route anchors.',
    '',
    ...statements,
    ...buildHotelStatements(verified),
    ''
  ].join('\n');

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, sql, 'utf8');
  return { ...verified, outputPath };
}

function main() {
  const args = parseArguments(
    process.argv.slice(2)
  );

  if (args.hotelsOnly && args.outputPath === DEFAULT_OUTPUT_PATH) {
    args.outputPath = path.join(__dirname, 'sync-hotel-links.generated.sql');
  }

  console.log('Reading videos.json...');

  const sourceVideos = loadVideos(
    args.videosPath
  );

  console.log(
    `Source videos: ${sourceVideos.length}`
  );

  const {
    validVideos,
    skippedVideos
  } = validateVideos(sourceVideos);

  console.log(
    `Valid videos: ${validVideos.length}`
  );

  console.log(
    `Rejected videos: ${skippedVideos.length}`
  );

  if (skippedVideos.length > 0) {
    console.log('Rejected entries:');

    for (const item of skippedVideos) {
      console.log(
        `- ${item.id}: ${item.reason}`
      );
    }
  }

  if (validVideos.length === 0) {
    throw new Error(
      'No valid videos are available.'
    );
  }

  console.log(
    'Generating safe D1 sync SQL file...'
  );

  const hotelSummary = createSqlFile(
    validVideos,
    args.outputPath,
    args.hotelsOnly
  );

  console.log(
    `SQL file created: ${args.outputPath}`
  );

  console.log(
    `Prepared videos: ${validVideos.length}`
  );

  console.log(
    'Existing rows outside this source were not deactivated.'
  );

  console.log(`Trusted route videos: ${hotelSummary.trustedVideoCount}`);
  console.log(`Verified hotel places: ${hotelSummary.hotels.length}`);
  console.log(`Video/hotel associations prepared: ${hotelSummary.links.length}`);
  console.log('Only the videos, hotels, and video_hotels tables are targeted.');

  console.log(args.hotelsOnly
    ? 'Hotel-only mode: no video rows will be written or activated.'
    : 'Standard admission mode: accepted video rows and hotel links are included.');

  console.log(
    'No database changes were made by this script.'
  );
}

try {
  main();
} catch (error) {
  console.error(
    'SQL generation failed:',
    error instanceof Error
      ? error.message
      : error
  );

  process.exit(1);
}
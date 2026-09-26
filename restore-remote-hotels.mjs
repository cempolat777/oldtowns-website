import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const EXPECTED_VIDEO_COUNT = 313;
const EXPECTED_HOTEL_LINK_COUNT = 3198;
const REFERENCE_VIDEO_ID = 'geyPUzGq19w';
const EXPECTED_REFERENCE_HOTELS = 30;

function parseArguments(argv) {
  const args = {
    source: '',
    output: '',
    generateOnly: false,
    confirmRemote: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--generate-only') {
      args.generateOnly = true;
    } else if (value === '--confirm-remote') {
      args.confirmRemote = true;
    } else if (value === '--source' && argv[index + 1]) {
      args.source = argv[++index];
    } else if (value === '--output' && argv[index + 1]) {
      args.output = argv[++index];
    } else {
      throw new Error(`Unknown or incomplete argument: ${value}`);
    }
  }

  return args;
}

function readCandidate(filePath) {
  try {
    const videos = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!Array.isArray(videos) || videos.length !== EXPECTED_VIDEO_COUNT) {
      return null;
    }

    const hotelLinks = videos.reduce(
      (total, video) =>
        total + (
          Array.isArray(video?.nearbyHotels)
            ? video.nearbyHotels.length
            : 0
        ),
      0
    );
    const referenceVideo = videos.find(
      (video) => video?.id === REFERENCE_VIDEO_ID
    );
    const referenceHotels = Array.isArray(referenceVideo?.nearbyHotels)
      ? referenceVideo.nearbyHotels.length
      : 0;

    if (
      hotelLinks !== EXPECTED_HOTEL_LINK_COUNT ||
      referenceHotels !== EXPECTED_REFERENCE_HOTELS
    ) {
      return null;
    }

    return { videos, hotelLinks, referenceHotels };
  } catch {
    return null;
  }
}

function findSourceBackup(projectRoot, requestedPath) {
  if (requestedPath) {
    const absolutePath = path.resolve(requestedPath);
    const parsed = readCandidate(absolutePath);

    if (!parsed) {
      throw new Error(
        `The requested backup is not the expected pre-repair data: ${absolutePath}`
      );
    }

    return { filePath: absolutePath, ...parsed };
  }

  const dataDirectory = path.join(projectRoot, 'src', 'data');
  const candidates = fs.readdirSync(dataDirectory)
    .filter((name) => /^videos\.before-integrity-repair\..+\.json$/u.test(name))
    .sort((left, right) => right.localeCompare(left));

  for (const name of candidates) {
    const filePath = path.join(dataDirectory, name);
    const parsed = readCandidate(filePath);

    if (parsed) {
      return { filePath, ...parsed };
    }
  }

  throw new Error(
    'A verified pre-repair backup with 313 videos and 3198 hotel links was not found.'
  );
}

function sqlText(value) {
  if (value === undefined || value === null) {
    return 'NULL';
  }

  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : 'NULL';
}

function countryFromAddress(address) {
  const match = String(address || '').match(/(?:^|,\s*)([A-Z]{2})\s*$/u);
  return match?.[1] || undefined;
}

function hotelScore(hotel) {
  return (
    (hotel?.verified === true ? 1000 : 0) +
    (Number(hotel?.confidence) || 0) * 100 +
    (String(hotel?.name || '').trim() ? 10 : 0) +
    (String(hotel?.address || '').trim() ? 5 : 0)
  );
}

function matchMethod(video) {
  if (String(video?.category || '') === 'Airport Walks') {
    return 'airport';
  }

  if (String(video?.geo?.precision || '') === 'route-point') {
    return 'route';
  }

  return 'city';
}

function collectRows(videos) {
  const hotels = new Map();
  const links = new Map();

  for (const video of videos) {
    const videoId = String(video?.id || '').trim();
    const nearbyHotels = Array.isArray(video?.nearbyHotels)
      ? video.nearbyHotels
      : [];

    for (let index = 0; index < nearbyHotels.length; index += 1) {
      const hotel = nearbyHotels[index];
      const hotelId = String(hotel?.id || '').trim();
      const name = String(hotel?.name || '').trim();
      const latitude = Number(hotel?.latitude);
      const longitude = Number(hotel?.longitude);

      if (
        !videoId ||
        !hotelId ||
        !name ||
        hotel?.verified !== true ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        continue;
      }

      const existingHotel = hotels.get(hotelId);

      if (!existingHotel || hotelScore(hotel) > hotelScore(existingHotel)) {
        hotels.set(hotelId, hotel);
      }

      const key = `${videoId}\u0000${hotelId}`;

      links.set(key, {
        videoId,
        hotelId,
        distanceMeters: Math.max(
          0,
          Math.round(Number(hotel.distanceMeters) || 0)
        ),
        rank: index + 1,
        method: matchMethod(video)
      });
    }
  }

  return { hotels, links: Array.from(links.values()) };
}

function buildSql(videos) {
  const { hotels, links } = collectRows(videos);

  if (links.length !== EXPECTED_HOTEL_LINK_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_HOTEL_LINK_COUNT} unique verified hotel links; generated ${links.length}.`
    );
  }

  const statements = [
    'PRAGMA foreign_keys = ON;',
    `CREATE TABLE IF NOT EXISTS hotels (
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
);`,
    `CREATE TABLE IF NOT EXISTS hotel_sources (
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
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);`,
    `CREATE TABLE IF NOT EXISTS video_hotels (
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
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  CHECK (distance_meters >= 0),
  CHECK (rank > 0),
  CHECK (match_method IN ('route', 'landmark', 'airport', 'city'))
);`,
    'CREATE INDEX IF NOT EXISTS idx_hotels_location ON hotels(country, city, active);',
    'CREATE INDEX IF NOT EXISTS idx_hotel_sources_hotel ON hotel_sources(hotel_id, active);',
    'CREATE INDEX IF NOT EXISTS idx_video_hotels_rank ON video_hotels(video_id, active, verified, rank);'
  ];

  for (const [hotelId, hotel] of hotels) {
    statements.push(
      `INSERT INTO hotels (
  id, canonical_name, city, country, address,
  latitude, longitude, active, updated_at
) VALUES (
  ${sqlText(hotelId)},
  ${sqlText(hotel.name)},
  ${sqlText(hotel.city)},
  ${sqlText(hotel.country || countryFromAddress(hotel.address))},
  ${sqlText(hotel.address)},
  ${sqlNumber(hotel.latitude)},
  ${sqlNumber(hotel.longitude)},
  1,
  CURRENT_TIMESTAMP
) ON CONFLICT(id) DO UPDATE SET
  canonical_name = excluded.canonical_name,
  city = COALESCE(excluded.city, hotels.city),
  country = COALESCE(excluded.country, hotels.country),
  address = COALESCE(excluded.address, hotels.address),
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  active = 1,
  updated_at = CURRENT_TIMESTAMP;`
    );
  }

  for (const link of links) {
    statements.push(
      `INSERT INTO video_hotels (
  video_id, hotel_id, distance_meters, selection_score,
  rank, match_method, verified, active, updated_at
) VALUES (
  ${sqlText(link.videoId)},
  ${sqlText(link.hotelId)},
  ${link.distanceMeters},
  0,
  ${link.rank},
  ${sqlText(link.method)},
  1,
  1,
  CURRENT_TIMESTAMP
) ON CONFLICT(video_id, hotel_id) DO UPDATE SET
  distance_meters = excluded.distance_meters,
  rank = excluded.rank,
  match_method = excluded.match_method,
  verified = 1,
  active = 1,
  updated_at = CURRENT_TIMESTAMP;`
    );
  }

  return {
    sql: `${statements.join('\n\n')}\n`,
    uniqueHotels: hotels.size,
    hotelLinks: links.length
  };
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: false
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `${command} failed with exit code ${result.status}.`
    );
  }
}

function main() {
  const args = parseArguments(process.argv.slice(2));
  const projectRoot = process.cwd();

  if (!args.generateOnly && !args.confirmRemote) {
    throw new Error('Pass --confirm-remote to write verified hotel data to the remote D1 database.');
  }

  const packagePath = path.join(projectRoot, 'package.json');

  if (!args.generateOnly) {
    if (!fs.existsSync(packagePath)) {
      throw new Error('Run this script from the oldtowns-website project root.');
    }

    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    if (packageJson.name !== 'oldtowns-website') {
      throw new Error('The current directory is not the oldtowns-website project root.');
    }
  }

  const source = findSourceBackup(projectRoot, args.source);
  const generated = buildSql(source.videos);
  const outputPath = args.output
    ? path.resolve(args.output)
    : path.join(
        fs.mkdtempSync(path.join(os.tmpdir(), 'oldtowns-remote-hotel-restore-')),
        'restore-local-hotels.sql'
      );

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, generated.sql, 'utf8');

  if (args.generateOnly) {
    console.log(JSON.stringify({
      source: source.filePath,
      videos: source.videos.length,
      hotelLinks: generated.hotelLinks,
      uniqueHotels: generated.uniqueHotels,
      referenceVideoHotels: source.referenceHotels,
      outputPath
    }, null, 2));
    return;
  }

  const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

  run(npxCommand, [
    'wrangler',
    'd1',
    'execute',
    'oldtowns-db',
    '--remote',
    `--file=${outputPath}`
  ]);

  run(npxCommand, [
    'wrangler',
    'd1',
    'execute',
    'oldtowns-db',
    '--remote',
    `--command=SELECT COUNT(*) AS restored_hotels FROM video_hotels WHERE video_id = '${REFERENCE_VIDEO_ID}' AND active = 1 AND verified = 1`
  ]);

  console.log('Remote hotel data restored.');
  console.log(`Hotel links restored: ${generated.hotelLinks}.`);
  console.log(`Reference video hotels restored: ${source.referenceHotels}.`);
  console.log('No page, title, video JSON, or deployment files were changed.');
}

main();

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getVideoIndexDecision } from './src/lib/videoSeo.ts';

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
  'import-videos.generated.sql'
);

function parseArguments(argv) {
  const args = {
    videosPath: DEFAULT_VIDEOS_PATH,
    outputPath: DEFAULT_OUTPUT_PATH
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--input' && argv[index + 1]) {
      args.videosPath = path.resolve(argv[++index]);
    } else if (value === '--output' && argv[index + 1]) {
      args.outputPath = path.resolve(argv[++index]);
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
    throw new Error(`Videos file was not found: ${videosPath}`);
  }

  const raw = fs.readFileSync(videosPath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error('videos.json must contain a JSON array.');
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

    const decision = getVideoIndexDecision(sourceVideo);

    if (!decision.indexable) {
      skippedVideos.push({
        id: video.id,
        reason: `Not indexable: ${decision.reasons.join(', ')}`
      });
      continue;
    }

    validVideos.push(video);
  }

  return {
    validVideos,
    skippedVideos
  };
}

function createSqlFile(videos, outputPath) {
  const statements = videos.map(buildInsertStatement);
  const sql = [
    '-- Generated automatically',
    '-- Source: src/data/videos.json',
    '-- Only indexable videos are activated',
    '-- Existing rows not present in the accepted source are deactivated',
    '',
    'BEGIN TRANSACTION;',
    '',
    'UPDATE videos',
    'SET active = 0,',
    '    updated_at = CURRENT_TIMESTAMP;',
    '',
    ...statements,
    '',
    'COMMIT;',
    ''
  ].join('\n');

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, sql, 'utf8');
}

function main() {
  const args = parseArguments(process.argv.slice(2));

  console.log('Reading videos.json...');

  const sourceVideos = loadVideos(args.videosPath);

  console.log(`Source videos: ${sourceVideos.length}`);

  const {
    validVideos,
    skippedVideos
  } = validateVideos(sourceVideos);

  console.log(`Indexable videos: ${validVideos.length}`);
  console.log(`Rejected videos: ${skippedVideos.length}`);

  if (skippedVideos.length > 0) {
    console.log('Rejected entries:');

    for (const item of skippedVideos) {
      console.log(`- ${item.id}: ${item.reason}`);
    }
  }

  if (validVideos.length === 0) {
    throw new Error('No indexable videos are available.');
  }

  console.log('Generating guarded SQL import file...');

  createSqlFile(validVideos, args.outputPath);

  console.log(`SQL file created: ${args.outputPath}`);
  console.log(`Prepared videos: ${validVideos.length}`);
  console.log('No database changes were made by this script.');
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

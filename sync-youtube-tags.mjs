import fs from 'node:fs';
import path from 'node:path';
import process, { loadEnvFile } from 'node:process';
import { pathToFileURL } from 'node:url';

try {
  loadEnvFile();
} catch {}

const DEFAULT_INPUT = './src/data/videos.json';
const BATCH_SIZE = 50;

function parseArgs(args) {
  const options = {
    input: DEFAULT_INPUT,
    apply: false,
    refresh: false,
    limit: Infinity
  };

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--apply') {
      options.apply = true;
    } else if (arg === '--refresh') {
      options.refresh = true;
    } else if (arg === '--input' && args[index + 1]) {
      options.input = args[++index];
    } else if (arg === '--limit' && args[index + 1]) {
      const limit = Number(args[++index]);
      if (!Number.isSafeInteger(limit) || limit < 1) {
        throw new Error('--limit must be a positive integer.');
      }
      options.limit = limit;
    } else {
      throw new Error(`Unknown or incomplete argument: ${arg}`);
    }
  }

  return options;
}

function readVideos(input) {
  const raw = fs.readFileSync(input, 'utf8');
  const videos = JSON.parse(raw.replace(/^\uFEFF/, ''));
  if (!Array.isArray(videos)) {
    throw new Error('The input file must contain a JSON array of videos.');
  }
  return { raw, videos };
}

export async function syncVideoTags(options = {}) {
  const input = path.resolve(options.input ?? DEFAULT_INPUT);
  const apply = options.apply === true;
  const refresh = options.refresh === true;
  const limit = options.limit ?? Infinity;
  const apiKey = options.apiKey ?? process.env.YOUTUBE_API_KEY;
  const fetcher = options.fetcher ?? fetch;

  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY is missing.');
  }

  const { raw, videos } = readVideos(input);
  const pending = new Map();
  let skipped = 0;

  for (const video of videos) {
    const id = String(video?.id ?? '').trim();
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) {
      skipped++;
      continue;
    }
    if (!refresh && Array.isArray(video.youtubeTags)) {
      continue;
    }
    if (!pending.has(id)) pending.set(id, []);
    pending.get(id).push(video);
  }

  const ids = [...pending.keys()].slice(0, limit);
  let fetched = 0;
  let withTags = 0;
  let withoutTags = 0;
  let unavailable = 0;
  let changedRecords = 0;

  for (let index = 0; index < ids.length; index += BATCH_SIZE) {
    const batch = ids.slice(index, index + BATCH_SIZE);
    const params = new URLSearchParams({
      part: 'snippet',
      id: batch.join(','),
      fields: 'items(id,snippet(tags))',
      key: apiKey
    });

    const response = await fetcher(
      `https://www.googleapis.com/youtube/v3/videos?${params}`
    );
    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(
        data.error?.message || `YouTube API error: ${response.status}`
      );
    }

    const returned = new Map(
      (data.items ?? []).map(item => [item.id, item])
    );

    for (const id of batch) {
      const item = returned.get(id);
      if (!item) {
        unavailable++;
        continue;
      }

      fetched++;
      const tags = Array.isArray(item.snippet?.tags)
        ? [...new Set(
            item.snippet.tags
              .map(tag => String(tag).trim())
              .filter(Boolean)
          )]
        : [];

      if (tags.length) withTags++;
      else withoutTags++;

      for (const video of pending.get(id)) {
        video.youtubeTags = tags;
        changedRecords++;
      }
    }
  }

  let backupPath = '';

  if (apply && changedRecords > 0) {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-');

    backupPath = `${input}.backup-before-youtube-tags-${timestamp}`;
    const temporaryPath = `${input}.youtube-tags-${process.pid}.tmp`;

    const indent =
      /\n([ \t]+)"[^"\n]+"\s*:/.exec(raw)?.[1] ?? '  ';

    fs.copyFileSync(
      input,
      backupPath,
      fs.constants.COPYFILE_EXCL
    );

    try {
      fs.writeFileSync(
        temporaryPath,
        `${JSON.stringify(videos, null, indent)}\n`,
        'utf8'
      );
      fs.renameSync(temporaryPath, input);
    } finally {
      if (fs.existsSync(temporaryPath)) {
        fs.unlinkSync(temporaryPath);
      }
    }
  }

  const report = {
    file: input,
    mode: apply ? 'APPLY' : 'PREVIEW',
    records: videos.length,
    eligibleIds: pending.size,
    requestedIds: ids.length,
    fetchedIds: fetched,
    videosWithTags: withTags,
    videosWithoutTags: withoutTags,
    unavailableIds: unavailable,
    skippedRecords: skipped,
    changedRecords,
    backupPath
  };

  console.log(JSON.stringify(report, null, 2));
  return report;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(
    path.resolve(process.argv[1])
  ).href
) {
  syncVideoTags(
    parseArgs(process.argv.slice(2))
  ).catch(error => {
    console.error(
      'YouTube tag synchronization failed:',
      error.message || error
    );
    process.exitCode = 1;
  });
}
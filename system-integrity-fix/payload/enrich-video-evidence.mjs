import fs from 'node:fs';
import path from 'node:path';
import process, { loadEnvFile } from 'node:process';
import { createHash } from 'node:crypto';

try {
  loadEnvFile();
} catch {}

const DEFAULT_INPUT_PATH = './src/data/videos.json';
const DEFAULT_REPORT_PATH = './video-evidence-report.json';
const DEFAULT_BACKUP_PATH = './src/data/videos.before-evidence-enrichment.json';
const YOUTUBE_BATCH_SIZE = 50;
const REQUEST_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 20_000;
const EVIDENCE_VERSION = 2;

const GENERIC_CHAPTER_NAMES = new Set([
  'ad',
  'advertisement',
  'beginning',
  'chapter',
  'complete tour',
  'complete walk',
  'end',
  'ending',
  'entire tour',
  'entire walk',
  'full tour',
  'full video',
  'full walk',
  'highlights',
  'intro',
  'intro and map',
  'intro and preview',
  'intro map',
  'intro preview',
  'introduction',
  'music',
  'opening',
  'opening title',
  'outro',
  'preview',
  'room tour',
  'route overview',
  'start',
  'subscribe',
  'thank you',
  'thanks',
  'video',
  'video highlights',
  'video preview',
  'walking tour',
  'welcome'
]);

const GENERIC_CHAPTER_WORDS = new Set([
  'a', 'ad', 'advertisement', 'an', 'and', 'at', 'begin',
  'beginning', 'begins', 'chapter', 'cinematic', 'commentary',
  'complete', 'drone', 'end', 'ending', 'entire', 'final',
  'finale', 'food', 'full', 'highlight', 'highlights', 'in',
  'interactive', 'intro', 'introduction', 'map', 'music', 'night',
  'of', 'on', 'opening', 'outro', 'overview', 'part', 'preview',
  'quick', 'room', 'route', 'scene', 'scenes', 'section', 'start',
  'the', 'this', 'title', 'to', 'tour', 'video', 'walk', 'walking',
  'welcome'
]);

function parseArguments(argv) {
  const args = {
    inputPath: DEFAULT_INPUT_PATH,
    reportPath: DEFAULT_REPORT_PATH,
    backupPath: DEFAULT_BACKUP_PATH,
    write: false,
    offline: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--write') {
      args.write = true;
    } else if (value === '--offline') {
      args.offline = true;
    } else if (value === '--input' && argv[index + 1]) {
      args.inputPath = argv[index + 1];
      index += 1;
    } else if (value === '--report' && argv[index + 1]) {
      args.reportPath = argv[index + 1];
      index += 1;
    } else if (value === '--backup' && argv[index + 1]) {
      args.backupPath = argv[index + 1];
      index += 1;
    }
  }

  return args;
}

function cleanInlineText(value = '') {
  return String(value)
    .normalize('NFKC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanMultilineText(value = '') {
  return String(value)
    .normalize('NFKC')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trimEnd())
    .join('\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

function isValidVideoId(value) {
  return /^[A-Za-z0-9_-]{11}$/.test(String(value || '').trim());
}

function parseDurationSeconds(value = '') {
  const duration = String(value || '').trim();

  if (/^\d+$/.test(duration)) {
    return Number(duration);
  }

  const match = duration.match(
    /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i
  );

  if (!match) return 0;

  return Math.round(
    Number(match[1] || 0) * 86_400 +
    Number(match[2] || 0) * 3_600 +
    Number(match[3] || 0) * 60 +
    Number(match[4] || 0)
  );
}

function parseTimestamp(value = '') {
  const normalized = String(value).replace(/;/g, ':');
  const parts = normalized.split(':').map(Number);

  if (
    parts.some((part) => !Number.isInteger(part) || part < 0) ||
    parts.length < 2 ||
    parts.length > 3
  ) {
    return null;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;

    if (seconds > 59) return null;

    return minutes * 60 + seconds;
  }

  const [hours, minutes, seconds] = parts;

  if (minutes > 59 || seconds > 59) return null;

  return hours * 3_600 + minutes * 60 + seconds;
}

function cleanChapterTitle(value = '') {
  return cleanInlineText(value)
    .replace(/^[\s\-–—|:;,.•·▶►]+/u, '')
    .replace(/[\s\-–—|:;,.•·]+$/u, '')
    .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/gu, '')
    .trim();
}

function isGenericChapterTitle(value = '') {
  const normalized = normalizeComparison(value);

  if (!normalized || GENERIC_CHAPTER_NAMES.has(normalized)) {
    return true;
  }

  if (
    /^(?:part|chapter|section|day)\s+(?:\d+|[ivxlcdm]+)$/i
      .test(normalized)
  ) {
    return true;
  }

  const words = normalized.split(/\s+/).filter(Boolean);

  return Boolean(words.length) && words.every(
    (word) =>
      GENERIC_CHAPTER_WORDS.has(word) ||
      /^\d+$/u.test(word) ||
      /^[ivxlcdm]+$/iu.test(word)
  );
}

function parseDescriptionChapters(description, durationSeconds = 0) {
  const lines = cleanMultilineText(description).split('\n');
  const found = [];

  for (const line of lines) {
    const match = line.match(
      /^\s*(?:[-–—•·]\s*)?(?:\[\s*)?((?:\d{1,2}:)?\d{1,3}[:;]\d{2})(?:\s*\])?\s*(?:[-–—|:;,.•·]\s*)?(.+?)\s*$/u
    );

    if (!match) continue;

    const startSeconds = parseTimestamp(match[1]);
    const title = cleanChapterTitle(match[2]);

    if (
      startSeconds === null ||
      !title ||
      title.length < 2 ||
      title.length > 100 ||
      isGenericChapterTitle(title)
    ) {
      continue;
    }

    if (durationSeconds && startSeconds >= durationSeconds) {
      continue;
    }

    found.push({
      title,
      startSeconds,
      verified: true,
      source: 'youtube-description',
      confidence: 1
    });
  }

  const unique = [];
  const seenOffsets = new Set();

  for (const chapter of found.sort(
    (first, second) => first.startSeconds - second.startSeconds
  )) {
    if (seenOffsets.has(chapter.startSeconds)) continue;

    seenOffsets.add(chapter.startSeconds);
    unique.push(chapter);
  }

  return unique.map((chapter, index) => {
    const next = unique[index + 1];
    const endSeconds =
      next?.startSeconds ||
      durationSeconds ||
      undefined;

    return {
      ...chapter,
      ...(endSeconds && endSeconds > chapter.startSeconds
        ? { endSeconds }
        : {})
    };
  });
}

function normalizeComparison(value = '') {
  return cleanInlineText(value)
    .toLocaleLowerCase('en')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function isSpecificRoutePoint(title) {
  const normalized = normalizeComparison(title);
  const words = normalized.split(/\s+/).filter(Boolean);

  if (!normalized || isGenericChapterTitle(normalized)) {
    return false;
  }

  if (words.length > 10) return false;

  if (/^(?:part|chapter|section|day)\s+\d+$/i.test(normalized)) {
    return false;
  }

  if (/^(?:\d+|\d+[a-z]?)$/i.test(normalized)) {
    return false;
  }

  if (
    /\b(?:subscribe|sponsor|patreon|instagram|facebook|youtube)\b/i
      .test(normalized)
  ) {
    return false;
  }

  return /\p{L}/u.test(normalized);
}

function routePointsFromChapters(chapters) {
  const points = [];
  const seen = new Set();

  for (const chapter of chapters) {
    if (!isSpecificRoutePoint(chapter.title)) continue;

    const key = normalizeComparison(chapter.title);

    if (!key || seen.has(key)) continue;

    seen.add(key);

    points.push({
      name: chapter.title,
      type: 'chapter-location',
      verified: true,
      source: 'youtube-description',
      confidence: 0.9,
      startSeconds: chapter.startSeconds
    });
  }

  return points;
}

function sourceHash(video) {
  const value = JSON.stringify({
    id: video.id || '',
    title: video.title || '',
    description: video.description || '',
    channelId: video.channelId || '',
    channelTitle:
      video.channelTitle ||
      video.channel ||
      '',
    publishedAt: video.publishedAt || '',
    duration: video.duration || ''
  });

  return createHash('sha256')
    .update(value)
    .digest('hex');
}

function loadVideos(inputPath) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(
      `Input file was not found: ${inputPath}`
    );
  }

  const parsed = JSON.parse(
    fs.readFileSync(inputPath, 'utf8')
  );

  const videos = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.videos)
      ? parsed.videos
      : Array.isArray(parsed.items)
        ? parsed.items
        : [];

  if (!videos.length) {
    throw new Error(
      `No videos were found in ${inputPath}`
    );
  }

  return {
    parsed,
    videos
  };
}

function chunks(values, size) {
  const result = [];

  for (
    let index = 0;
    index < values.length;
    index += size
  ) {
    result.push(
      values.slice(index, index + size)
    );
  }

  return result;
}

function delay(milliseconds) {
  return new Promise((resolve) =>
    setTimeout(resolve, milliseconds)
  );
}

async function fetchJson(url, attempt = 1) {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch(url, {
      signal: controller.signal
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const message =
        data?.error?.message ||
        `${response.status} ${response.statusText}`;

      const retryable =
        response.status === 429 ||
        response.status >= 500;

      if (
        retryable &&
        attempt < REQUEST_RETRIES
      ) {
        await delay(
          500 * 2 ** (attempt - 1)
        );

        return fetchJson(
          url,
          attempt + 1
        );
      }

      throw new Error(message);
    }

    return data;
  } catch (error) {
    if (
      attempt < REQUEST_RETRIES &&
      error?.name === 'AbortError'
    ) {
      await delay(
        500 * 2 ** (attempt - 1)
      );

      return fetchJson(
        url,
        attempt + 1
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchYouTubeVideos(
  videoIds,
  apiKey
) {
  const result = new Map();

  for (
    const batch of chunks(
      videoIds,
      YOUTUBE_BATCH_SIZE
    )
  ) {
    const params = new URLSearchParams({
      part: 'snippet,contentDetails,status',
      id: batch.join(','),
      key: apiKey
    });

    const data = await fetchJson(
      `https://www.googleapis.com/youtube/v3/videos?${params}`
    );

    for (const item of data.items || []) {
      result.set(item.id, item);
    }
  }

  return result;
}

function bestThumbnail(snippet, videoId) {
  return (
    snippet?.thumbnails?.maxres?.url ||
    snippet?.thumbnails?.standard?.url ||
    snippet?.thumbnails?.high?.url ||
    snippet?.thumbnails?.medium?.url ||
    snippet?.thumbnails?.default?.url ||
    (
      isValidVideoId(videoId)
        ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
        : ''
    )
  );
}

function mergeGeneratedEvidence(
  existing = [],
  generated = [],
  source
) {
  const preserved = existing.filter(
    (item) => item?.source !== source
  );

  return [
    ...preserved,
    ...generated
  ];
}

function mergeGeneratedRoutePoints(
  existing = [],
  generated = []
) {
  const preserved = existing.filter(
    (item) =>
      item?.source !== 'youtube-description' &&
      item?.source !== 'video-title' &&
      item?.type !== 'title-place'
  );

  return [
    ...preserved,
    ...generated
  ];
}

function enrichFromSource(
  video,
  source,
  timestamp
) {
  const snippet = source?.snippet || {};
  const contentDetails =
    source?.contentDetails || {};
  const status = source?.status || {};

  const description = cleanMultilineText(
    snippet.description ??
    video.description ??
    ''
  );

  const duration =
    contentDetails.duration ||
    video.duration ||
    '';

  const durationSeconds =
    parseDurationSeconds(duration);

  const generatedChapters =
    parseDescriptionChapters(
      description,
      durationSeconds
    );

  const generatedRoutePoints =
    routePointsFromChapters(
      generatedChapters
    );

  const next = {
    ...video,

    title: cleanInlineText(
      snippet.title ??
      video.title ??
      ''
    ),

    description,

    thumbnail:
      bestThumbnail(snippet, video.id) ||
      video.thumbnail ||
      '',

    channel: cleanInlineText(
      snippet.channelTitle ??
      video.channel ??
      ''
    ),

    channelTitle: cleanInlineText(
      snippet.channelTitle ??
      video.channelTitle ??
      video.channel ??
      ''
    ),

    channelId:
      snippet.channelId ||
      video.channelId ||
      '',

    publishedAt:
      snippet.publishedAt ||
      video.publishedAt ||
      '',

    duration,

    active: source
      ? status.privacyStatus === 'public'
      : video.active,

    embedAvailable: source
      ? status.embeddable !== false
      : video.embedAvailable,

    thumbnailValid: Boolean(
      bestThumbnail(snippet, video.id) ||
      video.thumbnail
    ),

    chapters: mergeGeneratedEvidence(
      Array.isArray(video.chapters)
        ? video.chapters
        : [],
      generatedChapters,
      'youtube-description'
    ),

    routePoints: mergeGeneratedRoutePoints(
      Array.isArray(video.routePoints)
        ? video.routePoints
        : [],
      generatedRoutePoints
    ),

    updatedAt: timestamp
  };

  next.sourceHash =
    sourceHash(next);

  next.evidence = {
    ...(video.evidence || {}),

    version: EVIDENCE_VERSION,

    status: generatedRoutePoints.length
      ? 'verified'
      : generatedChapters.length
        ? 'partial'
        : 'metadata-only',

    updatedAt: timestamp,

    sources: {
      ...(video.evidence?.sources || {}),

      youtube: {
        verified: Boolean(source),

        fetchedAt: source
          ? timestamp
          : undefined,

        publisherVerified: Boolean(
          source &&
          snippet.channelId
        ),

        publicationDateVerified: Boolean(
          source &&
          snippet.publishedAt
        ),

        descriptionPreserved:
          Boolean(description),

        chaptersFromDescription:
          generatedChapters.length,

        routePointsFromDescription:
          generatedRoutePoints.length
      }
    }
  };

  return next;
}

function writeJsonAtomic(filePath, value) {
  const directory =
    path.dirname(filePath);

  const temporaryPath =
    `${filePath}.tmp`;

  fs.mkdirSync(directory, {
    recursive: true
  });

  fs.writeFileSync(
    temporaryPath,
    `${JSON.stringify(value, null, 2)}\n`,
    'utf8'
  );

  fs.renameSync(
    temporaryPath,
    filePath
  );
}

function buildReport(
  beforeVideos,
  afterVideos,
  sourceMap,
  args
) {
  let sourceVerified = 0;
  let unavailable = 0;
  let descriptionsWithLineBreaks = 0;
  let videosWithChapters = 0;
  let videosWithRoutePoints = 0;
  let totalChapters = 0;
  let totalRoutePoints = 0;

  for (const video of afterVideos) {
    if (sourceMap.has(video.id)) {
      sourceVerified += 1;
    } else if (!args.offline) {
      unavailable += 1;
    }

    if (
      String(video.description || '')
        .includes('\n')
    ) {
      descriptionsWithLineBreaks += 1;
    }

    const chapters =
      Array.isArray(video.chapters)
        ? video.chapters
        : [];

    const routePoints =
      Array.isArray(video.routePoints)
        ? video.routePoints
        : [];

    if (chapters.length) {
      videosWithChapters += 1;
    }

    if (routePoints.length) {
      videosWithRoutePoints += 1;
    }

    totalChapters +=
      chapters.length;

    totalRoutePoints +=
      routePoints.length;
  }

  return {
    generatedAt:
      new Date().toISOString(),

    mode: args.offline
      ? 'offline'
      : 'youtube-api',

    writeRequested:
      args.write,

    inputPath:
      args.inputPath,

    videos:
      beforeVideos.length,

    sourceVerified,
    unavailable,
    descriptionsWithLineBreaks,
    videosWithChapters,
    totalChapters,
    videosWithRoutePoints,
    totalRoutePoints
  };
}

async function main() {
  const args = parseArguments(
    process.argv.slice(2)
  );

  const apiKey =
    process.env.YOUTUBE_API_KEY || '';

  if (!args.offline && !apiKey) {
    throw new Error(
      'YOUTUBE_API_KEY is missing. Add it to .env or use --offline for parser testing.'
    );
  }

  const {
    parsed,
    videos
  } = loadVideos(args.inputPath);

  const validIds = videos
    .map((video) => video.id)
    .filter(isValidVideoId);

  const sourceMap = args.offline
    ? new Map()
    : await fetchYouTubeVideos(
        validIds,
        apiKey
      );

  const timestamp =
    new Date().toISOString();

  const enriched = videos.map(
    (video) =>
      enrichFromSource(
        video,
        sourceMap.get(video.id),
        timestamp
      )
  );

  const output = Array.isArray(parsed)
    ? enriched
    : Array.isArray(parsed.videos)
      ? {
          ...parsed,
          videos: enriched
        }
      : {
          ...parsed,
          items: enriched
        };

  const report = buildReport(
    videos,
    enriched,
    sourceMap,
    args
  );

  writeJsonAtomic(
    args.reportPath,
    report
  );

  if (args.write) {
    if (
      !fs.existsSync(
        args.backupPath
      )
    ) {
      fs.mkdirSync(
        path.dirname(
          args.backupPath
        ),
        {
          recursive: true
        }
      );

      fs.copyFileSync(
        args.inputPath,
        args.backupPath
      );
    }

    writeJsonAtomic(
      args.inputPath,
      output
    );
  }

  console.log(
    JSON.stringify(
      report,
      null,
      2
    )
  );

  console.log(
    args.write
      ? `Enriched data written to ${args.inputPath}`
      : 'Dry run complete. No video data was changed.'
  );
}

main().catch((error) => {
  console.error(
    'Video evidence enrichment failed:',
    error.message || error
  );

  process.exitCode = 1;
});

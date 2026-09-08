import fs from 'node:fs';
import { loadEnvFile } from 'node:process';

try {
  loadEnvFile();
} catch {}

const API_KEY = process.env.YOUTUBE_API_KEY;
const VIDEOS_PATH = './src/data/videos.json';
const OUTPUT_PATH = './channel-video-candidates.json';
const MIN_DURATION_SECONDS = 30 * 60;

const CATEGORY_PATTERNS = [
  ['Airport Walks', /\b(?:airport|terminal|aeropuerto|aéroport|flughafen|aeroporto)\b/i],
  ['Beach Walking Tours', /\b(?:beach|seaside|seafront|coastal|coastline|oceanfront)\b/i],
  ['Night & Rain', /\b(?:night|rain|rainy|evening|after dark|storm)\b/i],
  ['Drone & Aerial', /\b(?:drone|aerial|fpv|from above|flying over|fly over)\b/i],
  ['Street Food', /\b(?:street food|food market|night market|food tour|culinary|food street)\b/i],
  ['Nature Trails', /\b(?:nature|forest|trail|hiking|hike|waterfall|national park|mountain)\b/i],
  ['Museums & Culture', /\b(?:museum|gallery|culture|cultural|heritage|historic|ancient ruins|old town|temple|palace)\b/i],
  ['Documentaries', /\b(?:documentary|travel guide|city guide|history|historical)\b/i],
  ['POV Rides', /\b(?:pov|drive|driving|ride|cycling|tram|train|bus|motorcycle)\b/i],
  ['Walking Tours', /\b(?:walk|walking|stroll|promenade)\b/i]
];

function clean(value = '') {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function loadVideos() {
  if (!fs.existsSync(VIDEOS_PATH)) {
    return [];
  }

  try {
    const data = JSON.parse(
      fs.readFileSync(VIDEOS_PATH, 'utf8')
    );

    return Array.isArray(data) ? data : [];
  } catch {
    throw new Error('Could not read videos.json.');
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(
      data?.error?.message ||
      `${response.status} ${response.statusText}`
    );
  }

  return data;
}

async function resolveChannel(handle) {
  const normalized = handle.replace(/^@/, '');

  const params = new URLSearchParams({
    part: 'snippet,contentDetails',
    forHandle: normalized,
    key: API_KEY
  });

  const data = await fetchJson(
    `https://www.googleapis.com/youtube/v3/channels?${params}`
  );

  const channel = data.items?.[0];

  if (!channel) {
    throw new Error(`Channel not found: ${handle}`);
  }

  const uploadsPlaylistId =
    channel.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) {
    throw new Error(
      `Uploads playlist not found: ${handle}`
    );
  }

  return {
    id: channel.id,
    title: clean(channel.snippet?.title),
    uploadsPlaylistId
  };
}

async function fetchUploadIds(playlistId) {
  const ids = [];
  let pageToken = '';

  do {
    const params = new URLSearchParams({
      part: 'contentDetails',
      playlistId,
      maxResults: '50',
      key: API_KEY
    });

    if (pageToken) {
      params.set('pageToken', pageToken);
    }

    const data = await fetchJson(
      `https://www.googleapis.com/youtube/v3/playlistItems?${params}`
    );

    for (const item of data.items || []) {
      const videoId =
        item.contentDetails?.videoId;

      if (videoId) {
        ids.push(videoId);
      }
    }

    pageToken =
      data.nextPageToken || '';

  } while (pageToken);

  return ids;
}

async function fetchVideoDetails(videoIds) {
  const videos = [];

  for (
    let index = 0;
    index < videoIds.length;
    index += 50
  ) {
    const batch =
      videoIds.slice(index, index + 50);

    const params = new URLSearchParams({
      part: 'snippet,contentDetails,status,statistics',
      id: batch.join(','),
      key: API_KEY
    });

    const data = await fetchJson(
      `https://www.googleapis.com/youtube/v3/videos?${params}`
    );

    videos.push(
      ...(data.items || [])
    );
  }

  return videos;
}

function durationSeconds(isoDuration = '') {
  const match = isoDuration.match(
    /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/
  );

  if (!match) {
    return 0;
  }

  return (
    Number(match[1] || 0) * 3600 +
    Number(match[2] || 0) * 60 +
    Number(match[3] || 0)
  );
}

function categoryFor(title) {
  for (const [category, pattern] of CATEGORY_PATTERNS) {
    if (pattern.test(title)) {
      return category;
    }
  }

  return null;
}

function cityRelevant(title, description, city) {
  const text =
    `${title} ${description}`
      .toLocaleLowerCase('en-US');

  return text.includes(
    city.toLocaleLowerCase('en-US')
  );
}

function badgeFor(title, category) {
  const normalized =
    title.toLowerCase();

  if (category === 'Drone & Aerial') {
    return 'DRONE 4K';
  }

  if (
    normalized.includes('rain') ||
    normalized.includes('rainy')
  ) {
    return 'RAIN 4K';
  }

  return '4K 60FPS';
}

function parseArguments() {
  const args = process.argv.slice(2);

  if (
    args[0]?.toUpperCase() === 'ALL'
  ) {
    const handles = args.slice(1);

    if (handles.length === 0) {
      throw new Error(
        'Usage: node .\\fetch-channel-videos.mjs ALL "@Channel1" "@Channel2"'
      );
    }

    return {
      mode: 'ALL',
      city: '',
      country: '',
      limit: Infinity,
      handles
    };
  }

  const [
    city,
    country,
    limitRaw,
    ...handles
  ] = args;

  const limit = Number(limitRaw);

  if (
    !city ||
    !country ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    handles.length === 0
  ) {
    throw new Error(
      'Usage: node .\\fetch-channel-videos.mjs Bangkok Thailand 200 "@Channel1" "@Channel2"'
    );
  }

  return {
    mode: 'CITY',
    city,
    country,
    limit,
    handles
  };
}

async function main() {
  if (!API_KEY) {
    throw new Error(
      'YOUTUBE_API_KEY is missing.'
    );
  }

  const config =
    parseArguments();

  const existing =
    loadVideos();

  const existingIds =
    new Set(
      existing
        .map(video => video.id)
        .filter(Boolean)
    );

  const archiveIds =
    new Set();

  if (config.mode === 'ALL') {
    console.log(
      'Mode: ALL eligible videos'
    );
  } else {
    console.log(
      `Target: ${config.city}, ${config.country}`
    );
    console.log(
      `Maximum selected: ${config.limit}`
    );
  }

  console.log(
    `Existing videos: ${existing.length}`
  );

  for (const handle of config.handles) {
    const channel =
      await resolveChannel(handle);

    console.log(
      `Scanning channel: ${channel.title} (${handle})`
    );

    const ids =
      await fetchUploadIds(
        channel.uploadsPlaylistId
      );

    console.log(
      `Archive videos found: ${ids.length}`
    );

    for (const id of ids) {
      archiveIds.add(id);
    }
  }

  console.log(
    `Unique archive IDs: ${archiveIds.size}`
  );

  const details =
    await fetchVideoDetails(
      [...archiveIds]
    );

  const returnedIds =
    new Set(
      details
        .map(video => video.id)
        .filter(Boolean)
    );

  const missingFromApi =
    [...archiveIds]
      .filter(id => !returnedIds.has(id))
      .length;

  const candidates = [];

  const rejection = {
    duplicate: 0,
    unavailable: 0,
    missingFromApi,
    wrongCity: 0,
    tooShort: 0,
    uncategorized: 0
  };

  for (const video of details) {
    const videoId =
      video.id;

    if (
      !videoId ||
      video.status?.privacyStatus !== 'public' ||
      video.status?.embeddable !== true
    ) {
      rejection.unavailable++;
      continue;
    }

    if (
      existingIds.has(videoId)
    ) {
      rejection.duplicate++;
      continue;
    }

    const title =
      clean(video.snippet?.title);

    const description =
      clean(video.snippet?.description);

    if (
      config.mode === 'CITY' &&
      !cityRelevant(
        title,
        description,
        config.city
      )
    ) {
      rejection.wrongCity++;
      continue;
    }

    const seconds =
      durationSeconds(
        video.contentDetails?.duration
      );

    if (
      seconds < MIN_DURATION_SECONDS
    ) {
      rejection.tooShort++;
      continue;
    }

    const category =
      categoryFor(title);

    if (!category) {
      rejection.uncategorized++;
      continue;
    }

    candidates.push({
      id: videoId,

      title,

      description,

      thumbnail:
        `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,

      category,

      city:
        config.mode === 'CITY'
          ? config.city
          : '',

      country:
        config.mode === 'CITY'
          ? config.country
          : '',

      channel:
        clean(video.snippet?.channelTitle),

      channelTitle:
        clean(video.snippet?.channelTitle),

      channelId:
        video.snippet?.channelId || '',

      badge:
        badgeFor(title, category),

      publishedAt:
        video.snippet?.publishedAt || '',

      viewCount:
        Number(
          video.statistics?.viewCount || 0
        ),

      durationSeconds:
        seconds,

      admission: {
        version: 3,
        status: 'channel-candidate',
        source: 'channel-archive',
        mode: config.mode
      }
    });
  }

  candidates.sort(
    (a, b) =>
      b.viewCount - a.viewCount
  );

  const selected =
    config.mode === 'ALL'
      ? candidates
      : candidates.slice(
          0,
          config.limit
        );

  fs.writeFileSync(
    OUTPUT_PATH,
    `${JSON.stringify(
      selected,
      null,
      2
    )}\n`,
    'utf8'
  );

  const categoryCounts = {};

  for (const video of selected) {
    categoryCounts[video.category] =
      (
        categoryCounts[
          video.category
        ] || 0
      ) + 1;
  }

  console.log('');
  console.log(
    `Eligible candidates: ${candidates.length}`
  );

  console.log(
    `Selected: ${selected.length}`
  );

  console.log(
    'Categories:',
    categoryCounts
  );

  console.log(
    'Rejected:',
    rejection
  );

  console.log(
    `Saved: ${OUTPUT_PATH}`
  );

  console.log(
    `${VIDEOS_PATH} was not changed.`
  );
}

main().catch(error => {
  console.error(
    'Fatal error:',
    error.message || error
  );

  process.exit(1);
});
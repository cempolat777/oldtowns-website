import fs from 'node:fs';
import { loadEnvFile } from 'node:process';
import { pathToFileURL } from 'node:url';

try {
  loadEnvFile();
} catch {}

const API_KEY = process.env.YOUTUBE_API_KEY;
const CURRENT_VIDEOS_PATH = './src/data/videos.json';
const CANDIDATE_OUTPUT_PATH = './video-candidates.json';
const MINIMUM_UNIQUE_EVIDENCE = 2;

const SEARCH_QUERIES = [
  { query: 'Tokyo 4k walking tour 1 hour', category: 'Walking Tours' },
  { query: 'London 4k walking tour 1 hour', category: 'Walking Tours' },
  { query: 'Paris 4k walking tour 1 hour', category: 'Walking Tours' },
  { query: 'Istanbul 4k walking tour 1 hour', category: 'Walking Tours' },
  { query: 'New York 4k walking tour 1 hour', category: 'Walking Tours' },
  { query: 'Rome 4k walking tour 1 hour', category: 'Walking Tours' },
  { query: 'airport walking tour 4k', category: 'Airport Walks' },
  { query: 'international airport walking tour 4k', category: 'Airport Walks' },
  { query: 'airport terminal walk 4k', category: 'Airport Walks' },
  { query: 'Haneda airport walking tour 4k', category: 'Airport Walks' },
  { query: 'Changi airport walking tour 4k', category: 'Airport Walks' },
  { query: 'Dubai airport walking tour 4k', category: 'Airport Walks' },
  { query: 'Istanbul airport walking tour 4k', category: 'Airport Walks' },
  { query: 'Heathrow airport walking tour 4k', category: 'Airport Walks' },
  { query: 'beach walking tour 4k 1 hour', category: 'Beach Walking Tours' },
  { query: 'seaside walking tour 4k 1 hour', category: 'Beach Walking Tours' },
  { query: 'Tokyo rain walk 4k 1 hour', category: 'Night & Rain' },
  { query: 'London rain walk 4k 1 hour', category: 'Night & Rain' },
  { query: 'Paris night walk 4k 1 hour', category: 'Night & Rain' },
  { query: 'World cities 4k drone view 1 hour', category: 'Drone & Aerial' },
  { query: 'Switzerland 4k drone relaxing 1 hour', category: 'Drone & Aerial' },
  { query: '4k POV driving tour 1 hour', category: 'POV Rides' },
  { query: 'Japan street food tour 4k 1 hour', category: 'Street Food' },
  { query: 'Istanbul street food tour 4k 1 hour', category: 'Street Food' },
  { query: 'Historic old town walking tour 4k 1 hour', category: 'Museums & Culture' },
  { query: 'Ancient ruins 4k tour 1 hour', category: 'Museums & Culture' },
  { query: 'Nature forest walking tour 4k 1 hour', category: 'Nature Trails' },
  { query: 'city travel documentary 4k', category: 'Documentaries' }
];

const CATEGORY_PATTERNS = {
  'Walking Tours': /\b(?:walk|walking|stroll|promenade)\b/i,
  'Airport Walks': /\b(?:airport|terminal|aeropuerto|aéroport|flughafen|aeroporto)\b/i,
  'Beach Walking Tours': /\b(?:beach|seaside|seafront|coastal|coastline|oceanfront)\b/i,
  'Night & Rain': /\b(?:night|rain|rainy|evening|after dark|storm)\b/i,
  'Drone & Aerial': /\b(?:drone|aerial|fpv|from above|flying over|fly over)\b/i,
  'POV Rides': /\b(?:pov|drive|driving|ride|cycling|tram|train|bus|motorcycle)\b/i,
  'Street Food': /\b(?:street food|food market|night market|food tour|culinary|food street)\b/i,
  'Museums & Culture': /\b(?:museum|gallery|culture|cultural|heritage|historic|ancient ruins|old town)\b/i,
  'Nature Trails': /\b(?:nature|forest|trail|hiking|hike|waterfall|national park|mountain)\b/i,
  Documentaries: /\b(?:documentary|travel guide|city guide|history|historical)\b/i
};

const GENERIC_EVIDENCE_PATTERN = /^(?:intro|introduction|preview|outro|ending|end|start|map|route map|chapter|chapters|timestamp|timestamps|full walk|full tour|walking tour|city walk|street walk|beach walk|drone intro|part\s*\d*|section\s*\d*|4k|8k|hdr|60\s*fps|music|subscribe|like and subscribe|highlights?)$/i;
const PROMOTIONAL_PATTERN = /\b(?:subscribe|notification|follow us|social media|sponsor|merch|patreon|donate|like and share)\b/i;
const QUALITY_ONLY_PATTERN = /^(?:(?:2k|4k|8k|12k|hd|uhd|hdr|sdr|\d{2,3}\s*fps|pov)[\s|+,&/\-]*)+$/i;

function decodeHtml(value = '') {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function cleanTitle(title) {
  return decodeHtml(title).replace(/\s+/g, ' ').trim();
}

function cleanDescription(description) {
  return decodeHtml(description)
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();
}

function parseTimestamp(value) {
  const parts = String(value).split(':').map(Number);

  if (parts.some((part) => !Number.isFinite(part))) return null;

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    if (seconds > 59) return null;
    return minutes * 60 + seconds;
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    if (minutes > 59 || seconds > 59) return null;
    return hours * 3600 + minutes * 60 + seconds;
  }

  return null;
}

function normalizeEvidenceLabel(value) {
  return cleanTitle(value)
    .replace(/^[\s\-–—|•:]+|[\s\-–—|•:]+$/g, '')
    .replace(/\s*\([^)]*\)\s*$/g, '')
    .trim();
}

function isSpecificEvidenceLabel(value) {
  const label = normalizeEvidenceLabel(value);

  if (label.length < 3 || label.length > 100) return false;
  if (!/[\p{L}\p{N}]/u.test(label)) return false;
  if (/https?:\/\/|www\.|#[\p{L}\p{N}_]+/iu.test(label)) return false;
  if (GENERIC_EVIDENCE_PATTERN.test(label)) return false;
  if (PROMOTIONAL_PATTERN.test(label)) return false;
  if (QUALITY_ONLY_PATTERN.test(label)) return false;

  return true;
}

export function extractUniqueEvidence(description) {
  const evidence = [];
  const seen = new Set();

  for (const sourceLine of cleanDescription(description).split('\n')) {
    const line = sourceLine.trim();
    if (!line) continue;

    const leadingTimestamp = line.match(
      /^[^\p{L}\p{N}:]*((?:\d{1,2}:)?\d{1,2}:\d{2})\s*(?:AM|PM)?\s*(?:[-–—|•:]\s*)?(.+)$/iu
    );
    const trailingTimestamp = line.match(
      /^(.+?)\s*[\[(]((?:\d{1,2}:)?\d{1,2}:\d{2})[\])]\s*$/u
    );
    const match = leadingTimestamp || trailingTimestamp;

    if (!match) continue;

    const timestamp = leadingTimestamp ? match[1] : match[2];
    const label = normalizeEvidenceLabel(leadingTimestamp ? match[2] : match[1]);
    const startSeconds = parseTimestamp(timestamp);
    const key = label.toLocaleLowerCase('en-US');

    if (startSeconds === null || !isSpecificEvidenceLabel(label) || seen.has(key)) {
      continue;
    }

    seen.add(key);
    evidence.push({ title: label, startSeconds });
  }

  return evidence.slice(0, 30);
}

export function isCategoryRelevant(title, category) {
  const pattern = CATEGORY_PATTERNS[category];
  return Boolean(pattern && pattern.test(cleanTitle(title)));
}

function loadExistingVideos() {
  if (!fs.existsSync(CURRENT_VIDEOS_PATH)) return [];

  try {
    const data = JSON.parse(fs.readFileSync(CURRENT_VIDEOS_PATH, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch {
    console.error('Could not read the existing videos.json file.');
    process.exit(1);
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data?.error?.message || `${response.status} ${response.statusText}`);
  }

  return data;
}

async function searchYouTube(query) {
  const params = new URLSearchParams({
    part: 'snippet',
    maxResults: '25',
    q: query,
    type: 'video',
    videoDefinition: 'high',
    videoDuration: 'long',
    videoEmbeddable: 'true',
    key: API_KEY
  });

  return fetchJson(`https://www.googleapis.com/youtube/v3/search?${params}`);
}

async function fetchVideoDetails(videoIds) {
  if (!videoIds.length) return [];

  const params = new URLSearchParams({
    part: 'snippet,contentDetails,status',
    id: videoIds.slice(0, 50).join(','),
    key: API_KEY
  });

  const data = await fetchJson(
    `https://www.googleapis.com/youtube/v3/videos?${params}`
  );

  return data.items || [];
}

function getBadge(title, category) {
  const normalized = cleanTitle(title).toLowerCase();

  if (category === 'Drone & Aerial') return 'DRONE 4K';
  if (normalized.includes('rain')) return 'RAIN 4K';
  return '4K 60FPS';
}

async function fetchYouTubeVideos() {
  if (!API_KEY) {
    console.error('YOUTUBE_API_KEY is missing.');
    process.exit(1);
  }

  const existingVideos = loadExistingVideos();
  const acceptedCandidates = [];
  const seenVideoIds = new Set(existingVideos.map((video) => video.id).filter(Boolean));
  const rejectionCounts = {
    duplicate: 0,
    unavailable: 0,
    categoryMismatch: 0,
    insufficientUniqueValue: 0
  };
  let acceptedVideos = 0;

  for (const item of SEARCH_QUERIES) {
    console.log(`Searching: "${item.query}"`);

    try {
      const searchData = await searchYouTube(item.query);
      const ids = (searchData.items || [])
        .map((video) => video.id?.videoId)
        .filter(Boolean);
      const videos = await fetchVideoDetails(ids);

      for (const video of videos) {
        const videoId = video.id;

        if (!videoId || video.status?.embeddable === false || video.status?.privacyStatus !== 'public') {
          rejectionCounts.unavailable++;
          continue;
        }

        if (seenVideoIds.has(videoId)) {
          rejectionCounts.duplicate++;
          continue;
        }

        const title = cleanTitle(video.snippet?.title);
        const description = cleanDescription(video.snippet?.description);

        if (!isCategoryRelevant(title, item.category)) {
          rejectionCounts.categoryMismatch++;
          continue;
        }

        const uniqueEvidence = extractUniqueEvidence(description);

        if (uniqueEvidence.length < MINIMUM_UNIQUE_EVIDENCE) {
          rejectionCounts.insufficientUniqueValue++;
          continue;
        }

        acceptedCandidates.push({
          id: videoId,
          title,
          description,
          thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          category: item.category,
          channel: cleanTitle(video.snippet?.channelTitle),
          channelTitle: cleanTitle(video.snippet?.channelTitle),
          channelId: video.snippet?.channelId || '',
          badge: getBadge(title, item.category),
          publishedAt: video.snippet?.publishedAt || '',
          admission: {
            version: 1,
            status: 'accepted',
            uniqueEvidenceCount: uniqueEvidence.length,
            evidence: uniqueEvidence
          }
        });

        seenVideoIds.add(videoId);
        acceptedVideos++;
      }
    } catch (error) {
      console.error(`Fetch error (${item.query}):`, error.message || error);
    }
  }

  fs.writeFileSync(
    CANDIDATE_OUTPUT_PATH,
    `${JSON.stringify(acceptedCandidates, null, 2)}\n`,
    'utf8'
  );

  console.log(`Existing videos preserved: ${existingVideos.length}`);
  console.log(`New videos accepted: ${acceptedVideos}`);
  console.log(`New videos rejected: ${Object.values(rejectionCounts).reduce((sum, count) => sum + count, 0)}`);
  console.log('Rejection counts:', rejectionCounts);
  console.log(`Candidate report: ${CANDIDATE_OUTPUT_PATH}`);
  console.log(`${CURRENT_VIDEOS_PATH} was not changed.`);
}

const isDirectRun = process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  fetchYouTubeVideos().catch((error) => {
    console.error('Fatal error:', error.message || error);
    process.exit(1);
  });
}

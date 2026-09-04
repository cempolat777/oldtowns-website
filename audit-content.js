import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();
const VIDEOS_PATH = path.join(PROJECT_ROOT, 'src', 'data', 'videos.json');
const REPORT_PATH = path.join(PROJECT_ROOT, 'content-audit.json');

function normalizeText(value = '') {
  return String(value)
    .replace(/\r/g, '')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/www\.\S+/gi, ' ')
    .replace(/#[\p{L}\p{N}_-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function getDescriptionLength(video) {
  return normalizeText(video.description || '').length;
}

function countRouteMarkers(video) {
  const text = String(video.description || '').replace(/\r/g, '');

  const matches = text.match(
    /(?:^|\n)\s*(?:\d{1,2}:)?\d{1,2}:\d{2}\b/gm
  );

  return matches ? matches.length : 0;
}

function hasSource(video) {
  return Boolean(video.channelTitle || video.channel);
}

function getQuality(video) {
  const descriptionLength = getDescriptionLength(video);
  const routeMarkers = countRouteMarkers(video);

  let score = 0;

  if (normalizeText(video.title).length >= 12) {
    score += 1;
  }

  if (descriptionLength >= 250) {
    score += 3;
  } else if (descriptionLength >= 120) {
    score += 2;
  } else if (descriptionLength >= 60) {
    score += 1;
  }

  if (video.city) score += 1;
  if (video.country) score += 1;
  if (video.category) score += 1;
  if (hasSource(video)) score += 1;
  if (video.publishedAt) score += 1;

  if (routeMarkers >= 3) {
    score += 2;
  } else if (routeMarkers >= 1) {
    score += 1;
  }

  const criticalThin =
    descriptionLength < 60 &&
    routeMarkers === 0 &&
    (!video.city || !video.country);

  const thin =
    score < 6 ||
    (descriptionLength < 80 && routeMarkers === 0);

  return {
    score,
    descriptionLength,
    routeMarkers,
    thin,
    criticalThin
  };
}

function createSlug(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function groupBy(items, keyGetter) {
  const map = new Map();

  for (const item of items) {
    const key = keyGetter(item);

    if (!key) {
      continue;
    }

    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key).push(item);
  }

  return map;
}

if (!fs.existsSync(VIDEOS_PATH)) {
  console.error(
    'videos.json was not found at src/data/videos.json.'
  );

  process.exit(1);
}

let videos;

try {
  videos = JSON.parse(
    fs.readFileSync(VIDEOS_PATH, 'utf8')
  );
} catch (error) {
  console.error(
    'Could not read videos.json:',
    error.message || error
  );

  process.exit(1);
}

if (!Array.isArray(videos)) {
  console.error(
    'videos.json must contain an array.'
  );

  process.exit(1);
}

const auditedVideos = videos.map((video) => ({
  id: video.id,
  title: video.title || '',
  city: video.city || '',
  country: video.country || '',
  category: video.category || '',
  hasDescription: Boolean(
    normalizeText(video.description || '')
  ),
  hasSource: hasSource(video),
  hasPublishedAt: Boolean(video.publishedAt),
  ...getQuality(video)
}));

const descriptionGroups = groupBy(
  videos.filter(
    (video) =>
      normalizeText(video.description || '').length >= 60
  ),
  (video) =>
    normalizeText(video.description || '')
);

const duplicateDescriptionGroups =
  [...descriptionGroups.values()]
    .filter((group) => group.length > 1)
    .map((group) => ({
      count: group.length,
      ids: group.map((video) => video.id),
      titles: group.map(
        (video) => video.title || ''
      )
    }))
    .sort((a, b) => b.count - a.count);

const cityGroups = groupBy(
  videos.filter((video) => video.city),
  (video) =>
    `${createSlug(video.country || '')}::${createSlug(
      video.city || ''
    )}`
);

const countryGroups = groupBy(
  videos.filter((video) => video.country),
  (video) =>
    createSlug(video.country || '')
);

const thinCityHubs =
  [...cityGroups.values()]
    .filter((group) => group.length < 2)
    .map((group) => ({
      city: group[0]?.city || '',
      country: group[0]?.country || '',
      videoCount: group.length,
      videoIds: group.map(
        (video) => video.id
      )
    }))
    .sort((a, b) =>
      a.city.localeCompare(b.city)
    );

const thinCountryHubs =
  [...countryGroups.values()]
    .filter((group) => group.length < 2)
    .map((group) => ({
      country: group[0]?.country || '',
      videoCount: group.length,
      videoIds: group.map(
        (video) => video.id
      )
    }))
    .sort((a, b) =>
      a.country.localeCompare(b.country)
    );

const summary = {
  totalVideos: videos.length,

  thinVideoPages:
    auditedVideos.filter(
      (video) => video.thin
    ).length,

  criticalThinVideoPages:
    auditedVideos.filter(
      (video) => video.criticalThin
    ).length,

  missingDescriptions:
    auditedVideos.filter(
      (video) => !video.hasDescription
    ).length,

  descriptionsUnder80Chars:
    auditedVideos.filter(
      (video) =>
        video.descriptionLength > 0 &&
        video.descriptionLength < 80
    ).length,

  missingCity:
    auditedVideos.filter(
      (video) => !video.city
    ).length,

  missingCountry:
    auditedVideos.filter(
      (video) => !video.country
    ).length,

  missingCategory:
    auditedVideos.filter(
      (video) => !video.category
    ).length,

  missingSource:
    auditedVideos.filter(
      (video) => !video.hasSource
    ).length,

  missingPublishedAt:
    auditedVideos.filter(
      (video) => !video.hasPublishedAt
    ).length,

  videosWithRouteMarkers:
    auditedVideos.filter(
      (video) => video.routeMarkers > 0
    ).length,

  duplicateDescriptionGroups:
    duplicateDescriptionGroups.length,

  videosInsideDuplicateDescriptionGroups:
    duplicateDescriptionGroups.reduce(
      (sum, group) => sum + group.count,
      0
    ),

  cityHubsWithOneVideo:
    thinCityHubs.length,

  countryHubsWithOneVideo:
    thinCountryHubs.length
};

const report = {
  generatedAt: new Date().toISOString(),

  summary,

  thinVideos:
    auditedVideos
      .filter((video) => video.thin)
      .sort((a, b) => a.score - b.score),

  criticalThinVideos:
    auditedVideos
      .filter(
        (video) => video.criticalThin
      )
      .sort((a, b) => a.score - b.score),

  duplicateDescriptionGroups,

  thinCityHubs,

  thinCountryHubs
};

fs.writeFileSync(
  REPORT_PATH,
  `${JSON.stringify(report, null, 2)}\n`,
  'utf8'
);

console.log('');
console.log('CONTENT QUALITY AUDIT');
console.log('=====================');

console.log(
  `Total videos: ${summary.totalVideos}`
);

console.log(
  `Thin video pages: ${summary.thinVideoPages}`
);

console.log(
  `Critical thin video pages: ${summary.criticalThinVideoPages}`
);

console.log(
  `Missing descriptions: ${summary.missingDescriptions}`
);

console.log(
  `Descriptions under 80 characters: ${summary.descriptionsUnder80Chars}`
);

console.log(
  `Missing city: ${summary.missingCity}`
);

console.log(
  `Missing country: ${summary.missingCountry}`
);

console.log(
  `Missing category: ${summary.missingCategory}`
);

console.log(
  `Missing source: ${summary.missingSource}`
);

console.log(
  `Missing published date: ${summary.missingPublishedAt}`
);

console.log(
  `Videos with route markers: ${summary.videosWithRouteMarkers}`
);

console.log(
  `Duplicate description groups: ${summary.duplicateDescriptionGroups}`
);

console.log(
  `Videos inside duplicate description groups: ${summary.videosInsideDuplicateDescriptionGroups}`
);

console.log(
  `City hubs with one video: ${summary.cityHubsWithOneVideo}`
);

console.log(
  `Country hubs with one video: ${summary.countryHubsWithOneVideo}`
);

console.log('');
console.log('No source data was changed.');
console.log(
  'Detailed report: content-audit.json'
);
console.log('');
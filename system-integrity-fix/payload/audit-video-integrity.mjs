import fs from 'node:fs';
import process from 'node:process';

const inputPath =
  process.argv[2] ||
  './src/data/videos.json';

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

const genericLabels = new Set([
  'beginning', 'chapter', 'complete tour', 'complete walk', 'end',
  'ending', 'entire tour', 'entire walk', 'full tour', 'full video',
  'full walk', 'highlights', 'intro', 'intro and map',
  'intro and preview', 'intro map', 'intro preview', 'introduction',
  'opening', 'opening title', 'outro', 'preview', 'room tour',
  'route overview', 'start', 'video', 'video highlights',
  'video preview', 'walking tour', 'welcome'
]);

const genericWords = new Set([
  'a', 'an', 'and', 'at', 'begin', 'beginning', 'begins', 'chapter',
  'cinematic', 'commentary', 'complete', 'drone', 'end', 'ending',
  'entire', 'final', 'finale', 'food', 'full', 'highlight',
  'highlights', 'in', 'interactive', 'intro', 'introduction', 'map',
  'night', 'of', 'on', 'opening', 'outro', 'overview', 'part',
  'preview', 'quick', 'room', 'route', 'scene', 'scenes', 'section',
  'start', 'the', 'this', 'title', 'to', 'tour', 'video', 'walk',
  'walking', 'welcome'
]);

const countryCodes = new Map([
  ['brazil', 'BR'],
  ['canada', 'CA'],
  ['czechia', 'CZ'],
  ['france', 'FR'],
  ['italy', 'IT'],
  ['japan', 'JP'],
  ['poland', 'PL'],
  ['singapore', 'SG'],
  ['spain', 'ES'],
  ['thailand', 'TH'],
  ['turkiye', 'TR'],
  ['türkiye', 'TR'],
  ['united arab emirates', 'AE'],
  ['united kingdom', 'GB'],
  ['united states', 'US']
]);

function normalize(value = '') {
  return String(value)
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function isGenericLabel(value = '') {
  const normalized = normalize(value);

  if (!normalized || genericLabels.has(normalized)) {
    return true;
  }

  if (
    /^(?:part|chapter|section|day)\s+(?:\d+|[ivxlcdm]+)$/iu
      .test(normalized)
  ) {
    return true;
  }

  const words = normalized.split(/\s+/).filter(Boolean);

  return Boolean(words.length) && words.every(
    (word) =>
      genericWords.has(word) ||
      /^\d+$/u.test(word) ||
      /^[ivxlcdm]+$/iu.test(word)
  );
}

function trustedGeo(video) {
  return (
    video.geo?.verified === true &&
    video.geo?.integrityVerified === true &&
    Number.isFinite(video.geo?.latitude) &&
    Number.isFinite(video.geo?.longitude) &&
    Number.isFinite(video.geo?.cityDistanceMeters) &&
    video.geo.cityDistanceMeters >= 0 &&
    video.geo.cityDistanceMeters <= 90_000 &&
    Number(video.geo?.verificationVersion) >= 2
  );
}

function radians(value) {
  return value * Math.PI / 180;
}

function distanceMeters(left, right) {
  const latitudeDelta = radians(
    right.latitude - left.latitude
  );
  const longitudeDelta = radians(
    right.longitude - left.longitude
  );
  const latitude1 = radians(left.latitude);
  const latitude2 = radians(right.latitude);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitude1) *
      Math.cos(latitude2) *
      Math.sin(longitudeDelta / 2) ** 2;

  return Math.round(
    6_371_000 * 2 *
      Math.atan2(
        Math.sqrt(value),
        Math.sqrt(1 - value)
      )
  );
}

function maximumCityDistance(point) {
  return /\b(?:airport|terminal)\b/iu
    .test(String(point?.name || ''))
    ? 90_000
    : 35_000;
}

const issues = [];
const warnings = [];
const issueCounts = new Map();
const warningCounts = new Map();
let hotels = 0;
let trustedVideos = 0;
let latinHotelNames = 0;

function add(target, counts, video, issue, detail = '') {
  counts.set(
    issue,
    (counts.get(issue) || 0) + 1
  );
  target.push({
    id: video.id,
    city: video.city || '',
    issue,
    detail
  });
}

for (const video of videos) {
  const routePoints = Array.isArray(video.routePoints)
    ? video.routePoints
    : [];
  const chapters = Array.isArray(video.chapters)
    ? video.chapters
    : [];
  const nearbyHotels = Array.isArray(video.nearbyHotels)
    ? video.nearbyHotels
    : [];
  const isTrusted = trustedGeo(video);

  if (isTrusted) {
    trustedVideos += 1;
  }

  for (const chapter of chapters) {
    if (
      chapter?.verified === true &&
      isGenericLabel(chapter.title)
    ) {
      add(
        issues,
        issueCounts,
        video,
        'generic-verified-chapter',
        String(chapter.title || '')
      );
    }
  }

  for (const point of routePoints) {
    if (
      point?.source === 'video-title' ||
      point?.type === 'title-place'
    ) {
      add(
        issues,
        issueCounts,
        video,
        'unsafe-title-place',
        `${point.name || ''} -> ${point.canonicalName || ''}`
      );
    }

    if (
      point?.verified === true &&
      isGenericLabel(point.name)
    ) {
      add(
        issues,
        issueCounts,
        video,
        'generic-verified-route',
        String(point.name || '')
      );
    }

    if (point?.geoVerified === true) {
      const maximum = maximumCityDistance(point);

      if (
        !Number.isFinite(point.cityDistanceMeters) ||
        point.cityDistanceMeters > maximum
      ) {
        add(
          issues,
          issueCounts,
          video,
          'route-city-distance-unverified',
          String(point.name || '')
        );
      }
    }
  }

  if (video.geo && !isTrusted) {
    add(
      issues,
      issueCounts,
      video,
      'untrusted-video-geo'
    );
  }

  const expectedCountryCode = countryCodes.get(
    normalize(video.country)
  );

  for (const hotel of nearbyHotels) {
    hotels += 1;

    if (/\p{Script=Latin}/u.test(String(hotel.name || ''))) {
      latinHotelNames += 1;
    }

    if (!isTrusted) {
      add(
        issues,
        issueCounts,
        video,
        'hotel-without-trusted-geo',
        String(hotel.name || '')
      );
      continue;
    }

    if (
      !Number.isFinite(hotel.latitude) ||
      !Number.isFinite(hotel.longitude) ||
      !Number.isFinite(hotel.distanceMeters)
    ) {
      add(
        issues,
        issueCounts,
        video,
        'invalid-hotel-geometry',
        String(hotel.name || '')
      );
      continue;
    }

    const measuredDistance = distanceMeters(
      video.geo,
      hotel
    );

    if (
      Math.abs(
        measuredDistance - hotel.distanceMeters
      ) > 150
    ) {
      add(
        issues,
        issueCounts,
        video,
        'hotel-distance-mismatch',
        String(hotel.name || '')
      );
    }

    if (hotel.distanceMeters > 3_000) {
      add(
        issues,
        issueCounts,
        video,
        'hotel-outside-radius',
        String(hotel.name || '')
      );
    }

    if (
      expectedCountryCode &&
      hotel.address &&
      /,\s*[A-Z]{2}\s*$/u.test(hotel.address) &&
      !new RegExp(`,\\s*${expectedCountryCode}\\s*$`, 'u')
        .test(hotel.address)
    ) {
      add(
        issues,
        issueCounts,
        video,
        'hotel-country-mismatch',
        String(hotel.name || '')
      );
    }
  }

  if (
    nearbyHotels.length &&
    !nearbyHotels.some(
      (hotel) => hotel.verified === true
    )
  ) {
    add(
      warnings,
      warningCounts,
      video,
      'hotels-not-marked-verified'
    );
  }
}

const summary = {
  inputPath,
  videos: videos.length,
  trustedVideos,
  hotels,
  latinHotelNameCoverage: hotels
    ? Number((latinHotelNames / hotels).toFixed(3))
    : 0,
  criticalCount: issues.length,
  warningCount: warnings.length,
  issueCounts: Object.fromEntries(
    [...issueCounts.entries()]
      .sort((left, right) => right[1] - left[1])
  ),
  warningCounts: Object.fromEntries(
    [...warningCounts.entries()]
      .sort((left, right) => right[1] - left[1])
  ),
  criticalExamples: issues.slice(0, 100),
  warningExamples: warnings.slice(0, 50)
};

console.log(JSON.stringify(summary, null, 2));

if (issues.length) {
  process.exitCode = 1;
}

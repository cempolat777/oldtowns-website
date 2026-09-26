import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('src/lib/videoSeo.ts');
const original = fs.readFileSync(file, 'utf8');
const eol = original.includes('\r\n') ? '\r\n' : '\n';
let source = original.replace(/\r\n/g, '\n');

function replaceOnce(oldText, newText, label) {
  const first = source.indexOf(oldText);

  if (
    first < 0 ||
    source.indexOf(oldText, first + oldText.length) >= 0
  ) {
    throw new Error(
      `Expected exactly one match: ${label}. No file changed.`
    );
  }

  source =
    source.slice(0, first) +
    newText +
    source.slice(first + oldText.length);
}

if (source.includes('  youtubeTags?: string[];')) {
  throw new Error(
    'YouTube tags are already connected. No file changed.'
  );
}

replaceOnce(
  '  nearbyHotels?: VideoNearbyHotel[];\n};',
  '  nearbyHotels?: VideoNearbyHotel[];\n  youtubeTags?: string[];\n};',
  'Video type'
);

const helper = String.raw`// Publisher tags support existing video information.
function normalizeTagEvidence(value: string) {
  return String(value || '')
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function getTagSupportedDetails(video: Video): Detail[] {
  if (!Array.isArray(video.youtubeTags) || !video.youtubeTags.length) {
    return [];
  }

  const originalTitle = String(video.title || '');
  const originalDescription = String(video.description || '');
  const titleText = ' ' + normalizeTagEvidence(originalTitle) + ' ';
  const descriptionText = ' ' + normalizeTagEvidence(originalDescription) + ' ';
  const foundCountry = findCountry(cleanTitle(originalTitle));
  const details = new Map<string, Detail>();

  for (const rawTag of video.youtubeTags.slice(0, 60)) {
    if (typeof rawTag !== 'string') continue;

    const tag = rawTag.trim();

    if (
      tag.length < 3 ||
      tag.length > 80 ||
      isGenericLocationLabel(tag)
    ) {
      continue;
    }

    const candidate = sanitizeCandidate(
      tag,
      video,
      foundCountry?.matched || null
    );

    const phrase = normalizeTagEvidence(candidate);

    if (!phrase || phrase.length < 3) continue;

    const inTitle = titleText.includes(' ' + phrase + ' ');
    const inDescription = descriptionText.includes(' ' + phrase + ' ');

    if (!inTitle && !inDescription) continue;

    const detail = parseDetail(candidate);

    if (!detail || !isSeoTitleDetailSafe(detail, video)) continue;
    if (!detail.type && !inTitle) continue;

    const key =
      (detail.type || 'proper') +
      '|' +
      normalizeTagEvidence(detail.name);

    const previous = details.get(key);

    const scored = {
      ...detail,
      score: detail.score + (inTitle ? 20 : 0)
    };

    if (!previous || scored.score > previous.score) {
      details.set(key, scored);
    }
  }

  return [...details.values()].sort(
    (a, b) => b.score - a.score
  );
}

`;

replaceOnce(
  'function getSeoPreferredDetail(',
  helper + 'function getSeoPreferredDetail(',
  'Tag helper'
);

const preferredStart = source.indexOf(
  'function getSeoPreferredDetail('
);

const preferredEnd = source.indexOf(
  '\nfunction styleFromDetail(',
  preferredStart
);

if (preferredStart < 0 || preferredEnd < 0) {
  throw new Error(
    'SEO selection function missing. No file changed.'
  );
}

const preferred = source.slice(
  preferredStart,
  preferredEnd
);

const tailStart = preferred.indexOf(
  '  const details = ['
);

if (
  tailStart < 0 ||
  !preferred.includes("  return '';\n}")
) {
  throw new Error(
    'Unexpected SEO selection function. No file changed.'
  );
}

const nextPreferred =
  preferred.slice(0, tailStart) +
  String.raw`  const details = [
    ...extractTitleDetails(video),
    ...extractRouteDetails(video)
  ].filter((detail) => isSeoTitleDetailSafe(detail, video));

  const tagDetails = getTagSupportedDetails(video);

  const supported = details.find((detail) =>
    tagDetails.some((tagDetail) =>
      normalizeTagEvidence(tagDetail.name) ===
      normalizeTagEvidence(detail.name)
    )
  );

  const selected = supported || details[0] || tagDetails[0];

  return selected ? localizeDetail(selected, lang) : '';
}
` +
  '\n';

replaceOnce(
  preferred,
  nextPreferred,
  'SEO selection'
);

const analysisStart = source.indexOf(
  'export function getVideoSeoAnalysis('
);

if (analysisStart < 0) {
  throw new Error(
    'SEO analysis missing. No file changed.'
  );
}

const cacheStart = source.indexOf(
  '  const cacheKey =',
  analysisStart
);

const cacheEnd = source.indexOf(
  '\n\n',
  cacheStart
);

if (cacheStart < 0 || cacheEnd < 0) {
  throw new Error(
    'SEO cache missing. No file changed.'
  );
}

const originalCache = source.slice(
  cacheStart,
  cacheEnd
);

const revisedCache = originalCache.replace(
  "${video.country || ''}",
  "${video.country || ''}|${Array.isArray(video.youtubeTags) ? video.youtubeTags.join('\\u001f') : ''}"
);

if (originalCache === revisedCache) {
  throw new Error(
    'Cache key does not match. No file changed.'
  );
}

replaceOnce(
  originalCache,
  revisedCache,
  'SEO cache'
);

replaceOnce(
  "    country: cleanGeneratedText(video.country || ''),\n    active: video.active !== false && video.active !== 0,",
  "    country: cleanGeneratedText(video.country || ''),\n    youtubeTags: Array.isArray(video.youtubeTags)\n      ? video.youtubeTags.filter((tag) => typeof tag === 'string').map((tag) => tag.trim())\n      : [],\n    active: video.active !== false && video.active !== 0,",
  'SEO source payload'
);

const backup =
  file +
  '.before-youtube-tags-' +
  new Date().toISOString().replace(/[:.]/g, '-');

fs.copyFileSync(
  file,
  backup,
  fs.constants.COPYFILE_EXCL
);

fs.writeFileSync(
  file,
  source.replace(/\n/g, eol),
  'utf8'
);

console.log(`Updated: ${file}`);
console.log(
  `Original lines: ${
    original.split(/\r?\n/).length -
    Number(original.endsWith('\n'))
  }`
);
console.log(
  `Updated lines: ${
    source.split('\n').length -
    Number(source.endsWith('\n'))
  }`
);
console.log(`Backup: ${backup}`);

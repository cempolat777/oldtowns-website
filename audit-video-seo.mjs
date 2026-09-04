import { readFile } from 'node:fs/promises';
import process from 'node:process';
import {
  getVideoCanonicalUrl,
  getVideoH1,
  getVideoSeoAudit,
  getVideoSeoContent,
  isGenericLocationLabel,
  supportedLangs
} from './src/lib/videoSeo.ts';

const inputPath = process.argv[2] || './src/data/videos.json';
const raw = await readFile(inputPath, 'utf8');
const parsed = JSON.parse(raw);
const videos = Array.isArray(parsed)
  ? parsed
  : Array.isArray(parsed.videos)
    ? parsed.videos
    : Array.isArray(parsed.items)
      ? parsed.items
      : [];

if (!videos.length) throw new Error(`No videos found in ${inputPath}`);

const MIN_DESCRIPTION_WORDS = 150;
const MAX_DESCRIPTION_WORDS = 250;
const MIN_META_CHARACTERS = 150;
const MAX_META_CHARACTERS = 250;
const MAX_HOTEL_DISTANCE_METERS = 3_000;
const MAX_SIDEBAR_HOTELS = 30;

const reasonCounts = new Map();
const signalCounts = new Map();
const descriptionOwners = new Map();
const h1Owners = new Map();
const seoTitleOwners = new Map();
const metaOwners = new Map();
const failures = [];
let indexable = 0;
let noindex = 0;
let totalWords = 0;
let renderedDescriptions = 0;
let invalidGenericRoutePointsDetected = 0;
let invalidGenericRoutePointsRemoved = 0;
let videosWithUnresolvedLocations = 0;
let videosWithCityAnchorConflicts = 0;
let hotelsRejectedForGeographicMismatch = 0;
let videosWithAtLeastOneValidHotel = 0;
let videosWithThreeValidHotels = 0;
let videosWithSidebarHotels = 0;
let descriptionsOutsideTarget = 0;
let metaDescriptionsOutsideTarget = 0;
let missingCanonicalUrls = 0;
let invalidHreflang = 0;
let structuredDataErrors = 0;

const addCount = (map, key) => map.set(key, (map.get(key) || 0) + 1);
const normalize = (value) => String(value || '')
  .normalize('NFKC')
  .toLocaleLowerCase()
  .replace(/\s+/g, ' ')
  .trim();
const addOwner = (map, key, owner) => {
  const owners = map.get(key) || [];
  owners.push(owner);
  map.set(key, owners);
};

for (const video of videos) {
  const primaryAudit = getVideoSeoAudit(video, 'en');
  const genericRoutePoints = (video.routePoints || [])
    .filter((point) => isGenericLocationLabel(point?.name || ''));
  invalidGenericRoutePointsDetected += genericRoutePoints.length;
  invalidGenericRoutePointsRemoved += genericRoutePoints.length;

  const trustedGeo =
    video.geo?.verified === true &&
    video.geo?.integrityVerified === true;
  if (!trustedGeo) videosWithUnresolvedLocations += 1;
  if (video.geo?.verified === true && video.geo?.integrityVerified === false) {
    videosWithCityAnchorConflicts += 1;
  }

  const hotels = Array.isArray(video.nearbyHotels) ? video.nearbyHotels : [];
  const validHotels = hotels
    .filter((hotel) =>
      trustedGeo &&
      hotel?.verified === true &&
      hotel?.cityContextVerified !== false &&
      Number.isFinite(Number(hotel?.distanceMeters)) &&
      Number(hotel.distanceMeters) >= 0 &&
      Number(hotel.distanceMeters) <= MAX_HOTEL_DISTANCE_METERS
    )
    .sort((left, right) => Number(left.distanceMeters) - Number(right.distanceMeters))
    .slice(0, MAX_SIDEBAR_HOTELS);
  hotelsRejectedForGeographicMismatch += Math.max(0, hotels.length - validHotels.length);
  if (validHotels.length >= 1) videosWithAtLeastOneValidHotel += 1;
  if (validHotels.length >= 3) videosWithThreeValidHotels += 1;
  if (validHotels.length >= 1 && validHotels.length <= MAX_SIDEBAR_HOTELS) {
    videosWithSidebarHotels += 1;
  }

  if (primaryAudit.indexDecision.indexable) indexable += 1;
  else noindex += 1;
  for (const reason of primaryAudit.indexDecision.reasons) addCount(reasonCounts, reason);
  for (const signal of primaryAudit.uniqueSignals) addCount(signalCounts, signal);

  for (const lang of supportedLangs) {
    const audit = getVideoSeoAudit(video, lang);
    const content = getVideoSeoContent(video, lang);
    const description = normalize(content.description);
    const h1 = normalize(getVideoH1(video, lang));
    const seoTitle = normalize(content.h1);
    const meta = normalize(content.metaDescription);
    const owner = `${video.id}:${lang}`;

    totalWords += audit.wordCount;
    renderedDescriptions += 1;

    if (audit.wordCount < MIN_DESCRIPTION_WORDS || audit.wordCount > MAX_DESCRIPTION_WORDS) {
      descriptionsOutsideTarget += 1;
      failures.push({ id: video.id, lang, issue: 'description-word-count', value: audit.wordCount });
    }
    if (content.metaDescription.length < MIN_META_CHARACTERS || content.metaDescription.length > MAX_META_CHARACTERS) {
      metaDescriptionsOutsideTarget += 1;
      failures.push({ id: video.id, lang, issue: 'meta-description-character-count', value: content.metaDescription.length });
    }
    if (audit.repeatedParagraphs) failures.push({ id: video.id, lang, issue: 'repeated-paragraph' });

    const expectedCanonical = getVideoCanonicalUrl(video, lang);
    if (!content.canonicalUrl || content.canonicalUrl !== expectedCanonical) {
      missingCanonicalUrls += 1;
      failures.push({ id: video.id, lang, issue: 'canonical-url' });
    }

    const alternates = content.sitemap?.alternates || [];
    const alternateLanguages = new Set(alternates.map((item) => item.lang));
    if (
      alternates.length !== supportedLangs.length ||
      supportedLangs.some((supported) => !alternateLanguages.has(supported))
    ) {
      invalidHreflang += 1;
      failures.push({ id: video.id, lang, issue: 'hreflang' });
    }

    const schema = content.videoObject || {};
    if (
      schema['@type'] !== 'VideoObject' ||
      !schema.name ||
      !schema.description ||
      !schema.thumbnailUrl ||
      !schema.embedUrl
    ) {
      structuredDataErrors += 1;
      failures.push({ id: video.id, lang, issue: 'video-structured-data' });
    }

    if (description) addOwner(descriptionOwners, `${lang}:${description}`, owner);
    if (h1) addOwner(h1Owners, `${lang}:${h1}`, owner);
    if (seoTitle) addOwner(seoTitleOwners, `${lang}:${seoTitle}`, owner);
    if (meta) addOwner(metaOwners, `${lang}:${meta}`, owner);
  }
}

const duplicateGroups = (ownersMap) => Array.from(ownersMap.values())
  .filter((owners) => owners.length > 1)
  .sort((left, right) => right.length - left.length);
const duplicateDescriptions = duplicateGroups(descriptionOwners);
const duplicateH1 = duplicateGroups(h1Owners);
const duplicateSeoTitles = duplicateGroups(seoTitleOwners);
const duplicateMetaDescriptions = duplicateGroups(metaOwners);

const summary = {
  inputPath,
  videosChecked: videos.length,
  languages: supportedLangs.length,
  renderedDescriptions,
  invalidGenericRoutePointsDetected,
  invalidGenericRoutePointsRemoved,
  videosWithUnresolvedLocations,
  videosWithCityAnchorConflicts,
  hotelsRejectedForGeographicMismatch,
  videosWithAtLeastOneValidHotel,
  videosWithThreeValidHotels,
  videosWithSidebarHotels,
  descriptionsOutsideTarget,
  metaDescriptionsOutsideTarget,
  duplicateH1Groups: duplicateH1.length,
  duplicateSeoTitleGroups: duplicateSeoTitles.length,
  duplicateMetaDescriptionGroups: duplicateMetaDescriptions.length,
  duplicateDescriptionGroups: duplicateDescriptions.length,
  missingCanonicalUrls,
  invalidHreflang,
  structuredDataErrors,
  indexable,
  wouldBecomeNoindex: noindex,
  averageWords: Number((totalWords / renderedDescriptions).toFixed(1)),
  reasonCounts: Object.fromEntries(
    Array.from(reasonCounts.entries()).sort((left, right) => right[1] - left[1])
  ),
  signalCounts: Object.fromEntries(
    Array.from(signalCounts.entries()).sort((left, right) => right[1] - left[1])
  ),
  duplicateExamples: {
    h1: duplicateH1.slice(0, 5),
    seoTitle: duplicateSeoTitles.slice(0, 5),
    metaDescription: duplicateMetaDescriptions.slice(0, 5)
  },
  failures: failures.slice(0, 200),
  failureCount: failures.length
};

console.log(JSON.stringify(summary, null, 2));
if (failures.length > 0) process.exitCode = 1;

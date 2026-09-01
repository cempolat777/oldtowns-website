import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {
  VIDEO_CONTENT_VERSION,
  getVideoQualityScore,
  getVideoSeoAudit,
  supportedLangs
} from './src/lib/videoSeo.ts';

const DEFAULT_CURRENT_PATH = './src/data/videos.json';
const DEFAULT_CANDIDATE_PATH = './video-candidates.overture.json';
const DEFAULT_REPORT_PATH = './video-admission-report.json';
const DEFAULT_REJECTED_PATH = './video-candidates.rejected.json';
const DEFAULT_BACKUP_PATH = './src/data/videos.before-candidate-admission.json';
const MINIMUM_METADATA_EVIDENCE = 2;

const AERIAL_CATEGORY_WORDS = [
  'drone',
  'aerial'
];

const INFORMATIONAL_CATEGORY_WORDS = [
  'documentary',
  'documentaries',
  'nature'
];

function parseArguments(argv) {
  const args = {
    currentPath: DEFAULT_CURRENT_PATH,
    candidatePath: DEFAULT_CANDIDATE_PATH,
    reportPath: DEFAULT_REPORT_PATH,
    rejectedPath: DEFAULT_REJECTED_PATH,
    backupPath: DEFAULT_BACKUP_PATH,
    write: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--write') {
      args.write = true;
    } else if (value === '--current' && argv[index + 1]) {
      args.currentPath = argv[++index];
    } else if (value === '--candidates' && argv[index + 1]) {
      args.candidatePath = argv[++index];
    } else if (value === '--report' && argv[index + 1]) {
      args.reportPath = argv[++index];
    } else if (value === '--rejected' && argv[index + 1]) {
      args.rejectedPath = argv[++index];
    } else if (value === '--backup' && argv[index + 1]) {
      args.backupPath = argv[++index];
    }
  }

  return args;
}

function loadVideoDocument(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} file was not found: ${filePath}`);
  }

  const document = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const videos = Array.isArray(document)
    ? document
    : Array.isArray(document.videos)
      ? document.videos
      : Array.isArray(document.items)
        ? document.items
        : [];

  if (!Array.isArray(videos)) {
    throw new Error(`${label} file does not contain a video array.`);
  }

  return { document, videos };
}

function rebuildVideoDocument(document, videos) {
  if (Array.isArray(document)) {
    return videos;
  }

  if (Array.isArray(document.videos)) {
    return { ...document, videos };
  }

  return { ...document, items: videos };
}

function writeJsonAtomic(filePath, value) {
  const directory = path.dirname(filePath);
  const temporaryPath = `${filePath}.tmp`;

  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    temporaryPath,
    `${JSON.stringify(value, null, 2)}\n`,
    'utf8'
  );
  fs.renameSync(temporaryPath, filePath);
}

function uniqueReasons(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizePolicyText(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('en')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function includesCategoryWord(category, words) {
  return words.some((word) =>
    category.includes(word)
  );
}

function getContentPolicy(candidate) {
  const category = normalizePolicyText(
    candidate.category ||
    candidate.categorySlug ||
    candidate.contentType ||
    ''
  );

  if (includesCategoryWord(category, INFORMATIONAL_CATEGORY_WORDS)) {
    return {
      name: 'informational',
      requiresVerifiedLocation: false,
      requiresNearbyHotels: false
    };
  }

  if (includesCategoryWord(category, AERIAL_CATEGORY_WORDS)) {
    return {
      name: 'aerial',
      requiresVerifiedLocation: true,
      requiresNearbyHotels: false
    };
  }

  return {
    name: 'location-experience',
    requiresVerifiedLocation: true,
    requiresNearbyHotels: true
  };
}

function hasVerifiedLocation(candidate) {
  const geo = candidate.geo;
  const overture = candidate.evidence?.sources?.overture;
  const latitude = Number(geo?.latitude);
  const longitude = Number(geo?.longitude);

  return Boolean(
    geo &&
    geo.verified === true &&
    geo.integrityVerified === true &&
    overture?.verified === true &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function hasVerifiedNearbyHotels(candidate) {
  if (!Array.isArray(candidate.nearbyHotels)) {
    return false;
  }

  return candidate.nearbyHotels.some((hotel) => {
    const latitude = Number(hotel?.latitude);
    const longitude = Number(hotel?.longitude);
    const distanceMeters = Number(hotel?.distanceMeters);

    return Boolean(
      hotel &&
      String(hotel.id || '').trim() &&
      String(hotel.name || '').trim() &&
      hotel.verified === true &&
      hotel.cityContextVerified === true &&
      Number.isFinite(latitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      Number.isFinite(longitude) &&
      longitude >= -180 &&
      longitude <= 180 &&
      Number.isFinite(distanceMeters) &&
      distanceMeters >= 0
    );
  });
}

function prepareCandidate(candidate) {
  const qualityScore = getVideoQualityScore(candidate);

  return {
    ...candidate,
    active: true,
    qualityScore,
    contentVersion: VIDEO_CONTENT_VERSION,
    indexStatus: 'index'
  };
}

function auditCandidate(candidate) {
  const prepared = prepareCandidate(candidate);
  const audits = supportedLangs.map((lang) =>
    getVideoSeoAudit(prepared, lang)
  );
  const reasons = [];
  const admission = candidate.admission || {};
  const metadataEvidenceCount = Number(
    admission.uniqueEvidenceCount || 0
  );
  const policy = getContentPolicy(candidate);

  if (admission.status !== 'accepted') {
    reasons.push('metadata-admission-missing');
  }

  if (metadataEvidenceCount < MINIMUM_METADATA_EVIDENCE) {
    reasons.push('metadata-evidence-below-threshold');
  }

  if (
    policy.requiresVerifiedLocation &&
    !hasVerifiedLocation(candidate)
  ) {
    reasons.push('verified-location-required');
  }

  if (
    policy.requiresNearbyHotels &&
    !hasVerifiedNearbyHotels(candidate)
  ) {
    reasons.push('verified-nearby-hotel-required');
  }

  for (const audit of audits) {
    if (!audit.indexDecision.indexable) {
      reasons.push(...audit.indexDecision.reasons);
    }

    if (audit.paragraphCount !== 2) {
      reasons.push(`invalid-paragraph-count:${audit.lang}`);
    }

    if (audit.repeatedParagraphs) {
      reasons.push(`repeated-paragraphs:${audit.lang}`);
    }
  }

  return {
    prepared,
    audits,
    policy,
    reasons: uniqueReasons(reasons)
  };
}

function countReasons(rejected) {
  const counts = {};

  for (const item of rejected) {
    for (const reason of item.reasons) {
      counts[reason] = (counts[reason] || 0) + 1;
    }
  }

  return Object.fromEntries(
    Object.entries(counts).sort((left, right) => right[1] - left[1])
  );
}

function main() {
  const args = parseArguments(process.argv.slice(2));
  const current = loadVideoDocument(args.currentPath, 'Current video');
  const candidates = loadVideoDocument(args.candidatePath, 'Candidate');
  const currentIds = new Set(
    current.videos.map((video) => String(video.id || '')).filter(Boolean)
  );
  const candidateIds = new Set();
  const accepted = [];
  const rejected = [];

  for (const candidate of candidates.videos) {
    const id = String(candidate.id || '');

    if (currentIds.has(id)) {
      rejected.push({
        id,
        title: candidate.title || '',
        reasons: ['duplicate-existing']
      });
      continue;
    }

    if (candidateIds.has(id)) {
      rejected.push({
        id,
        title: candidate.title || '',
        reasons: ['duplicate-candidate']
      });
      continue;
    }

    candidateIds.add(id);

    const result = auditCandidate(candidate);

    if (result.reasons.length) {
      rejected.push({
        id,
        title: candidate.title || '',
        policy: result.policy.name,
        reasons: result.reasons,
        languages: result.audits.map((audit) => ({
          lang: audit.lang,
          indexable: audit.indexDecision.indexable,
          paragraphCount: audit.paragraphCount,
          repeatedParagraphs: audit.repeatedParagraphs
        }))
      });
      continue;
    }

    accepted.push(result.prepared);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    writeRequested: args.write,
    currentVideos: current.videos.length,
    candidatesChecked: candidates.videos.length,
    accepted: accepted.length,
    rejected: rejected.length,
    finalVideos: current.videos.length + accepted.length,
    languagesChecked: supportedLangs.length,
    rejectionCounts: countReasons(rejected)
  };

  writeJsonAtomic(args.reportPath, report);
  writeJsonAtomic(args.rejectedPath, rejected);

  if (args.write) {
    if (!fs.existsSync(args.backupPath)) {
      fs.mkdirSync(path.dirname(args.backupPath), { recursive: true });
      fs.copyFileSync(args.currentPath, args.backupPath);
    }

    writeJsonAtomic(
      args.currentPath,
      rebuildVideoDocument(
        current.document,
        [...current.videos, ...accepted]
      )
    );
  }

  console.log(JSON.stringify(report, null, 2));
  console.log(
    args.write
      ? `Accepted candidates were added to ${args.currentPath}`
      : 'Dry run complete. Current video data was not changed.'
  );
}

try {
  main();
} catch (error) {
  console.error('Candidate admission failed:', error.message || error);
  process.exitCode = 1;
}

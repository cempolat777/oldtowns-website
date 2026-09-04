import { readFile } from 'node:fs/promises';
import process from 'node:process';
import {
  getVideoH1,
  getVideoSeoAudit,
  getVideoSeoContent,
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

if (!videos.length) {
  throw new Error(`No videos found in ${inputPath}`);
}

const reasonCounts = new Map();
const signalCounts = new Map();
const descriptionOwners = new Map();
const titleOwners = new Map();
const failures = [];
let indexable = 0;
let noindex = 0;
let totalWords = 0;
let renderedDescriptions = 0;

const addCount = (map, key) => {
  map.set(key, (map.get(key) || 0) + 1);
};

const addOwner = (map, key, owner) => {
  const owners = map.get(key) || [];
  owners.push(owner);
  map.set(key, owners);
};

for (const video of videos) {
  const primaryAudit = getVideoSeoAudit(video, 'en');

  if (primaryAudit.indexDecision.indexable) {
    indexable += 1;
  } else {
    noindex += 1;
  }

  for (const reason of primaryAudit.indexDecision.reasons) {
    addCount(reasonCounts, reason);
  }

  for (const signal of primaryAudit.uniqueSignals) {
    addCount(signalCounts, signal);
  }

  for (const lang of supportedLangs) {
    const audit = getVideoSeoAudit(video, lang);
    const content = getVideoSeoContent(video, lang);
    const normalizedDescription = content.description
      .normalize('NFKC')
      .toLocaleLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
    const normalizedTitle = getVideoH1(video, lang)
      .normalize('NFKC')
      .toLocaleLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
    const owner = `${video.id}:${lang}`;

    totalWords += audit.wordCount;
    renderedDescriptions += 1;

    if (!normalizedDescription) {
      failures.push({
        id: video.id,
        lang,
        issue: 'empty-description'
      });
    }

    if (!content.metaDescription) {
      failures.push({
        id: video.id,
        lang,
        issue: 'empty-meta-description'
      });
    }

    if (content.metaDescription.length > 155) {
      failures.push({
        id: video.id,
        lang,
        issue: 'meta-description-too-long'
      });
    }

    if (audit.repeatedParagraphs) {
      failures.push({
        id: video.id,
        lang,
        issue: 'repeated-paragraph'
      });
    }

    if (normalizedDescription) {
      addOwner(
        descriptionOwners,
        lang.concat(String.fromCharCode(58), normalizedDescription),
        owner
      );
    }

    if (normalizedTitle) {
      addOwner(
        titleOwners,
        lang.concat(String.fromCharCode(58), normalizedTitle),
        owner
      );
    }
  }
}

const duplicateGroups = (ownersMap) =>
  Array.from(ownersMap.values())
    .filter((owners) => owners.length > 1)
    .sort((a, b) => b.length - a.length);

const duplicateDescriptions = duplicateGroups(
  descriptionOwners
);

const duplicateTitles = duplicateGroups(
  titleOwners
);

const summary = {
  inputPath,
  videos: videos.length,
  languages: supportedLangs.length,
  renderedDescriptions,
  indexable,
  noindex,
  averageWords: Number(
    (totalWords / renderedDescriptions).toFixed(1)
  ),
  reasonCounts: Object.fromEntries(
    Array.from(reasonCounts.entries())
      .sort((a, b) => b[1] - a[1])
  ),
  signalCounts: Object.fromEntries(
    Array.from(signalCounts.entries())
      .sort((a, b) => b[1] - a[1])
  ),
  duplicateDescriptionGroups:
    duplicateDescriptions.length,
  duplicateTitleGroups:
    duplicateTitles.length,
  duplicateDescriptionExamples:
    duplicateDescriptions.slice(0, 10),
  duplicateTitleExamples:
    duplicateTitles.slice(0, 10),
  failures: failures.slice(0, 100),
  failureCount: failures.length
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exitCode = 1;
}

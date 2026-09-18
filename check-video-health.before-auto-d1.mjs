import fs from 'node:fs';
import path from 'node:path';
import { loadEnvFile } from 'node:process';

try {
  loadEnvFile();
} catch {}

const API_KEY = process.env.YOUTUBE_API_KEY;

const VIDEOS_PATH = './src/data/videos.json';
const BLACKLIST_PATH = './src/data/video-blacklist.json';
const REPORT_PATH = './video-health-report.json';
const BACKUP_DIR = './src/data/health-backups';

const BATCH_SIZE = 50;

function loadJsonArray(filePath, errorMessage) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const raw = fs
      .readFileSync(filePath, 'utf8')
      .replace(/^\uFEFF/, '');

    const data = JSON.parse(raw);

    return Array.isArray(data) ? data : [];
  } catch {
    throw new Error(errorMessage);
  }
}

function loadVideos() {
  return loadJsonArray(
    VIDEOS_PATH,
    'Could not read videos.json.'
  );
}

function ensureBlacklistFile() {
  if (!fs.existsSync(BLACKLIST_PATH)) {
    fs.writeFileSync(
      BLACKLIST_PATH,
      '[]\n',
      'utf8'
    );
  }
}

function loadBlacklist() {
  ensureBlacklistFile();

  const entries = loadJsonArray(
    BLACKLIST_PATH,
    'Could not read video-blacklist.json.'
  );

  const videoIds = new Set();
  const channelIds = new Set();

  for (const entry of entries) {
    if (typeof entry === 'string') {
      const id = entry.trim();

      if (id) {
        videoIds.add(id);
      }

      continue;
    }

    if (
      !entry ||
      typeof entry !== 'object'
    ) {
      continue;
    }

    const type = String(
      entry.type || 'video'
    ).toLowerCase();

    const id = String(
      entry.id || ''
    ).trim();

    if (!id) {
      continue;
    }

    if (type === 'channel') {
      channelIds.add(id);
    } else {
      videoIds.add(id);
    }
  }

  return {
    videoIds,
    channelIds
  };
}

async function fetchJson(url) {
  const response = await fetch(url);

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Invalid YouTube API response: ${response.status} ${response.statusText}`
    );
  }

  if (!response.ok || data.error) {
    throw new Error(
      data?.error?.message ||
      `${response.status} ${response.statusText}`
    );
  }

  return data;
}

async function fetchVideoBatch(videoIds) {
  const params = new URLSearchParams({
    part: 'snippet,status',
    id: videoIds.join(','),
    key: API_KEY
  });

  const data = await fetchJson(
    `https://www.googleapis.com/youtube/v3/videos?${params}`
  );

  return data.items || [];
}

async function fetchVideoDetails(videoIds) {
  const videos = [];
  const missingIds = [];

  for (
    let index = 0;
    index < videoIds.length;
    index += BATCH_SIZE
  ) {
    const batch = videoIds.slice(
      index,
      index + BATCH_SIZE
    );

    const batchVideos =
      await fetchVideoBatch(batch);

    videos.push(...batchVideos);

    const returnedIds = new Set(
      batchVideos
        .map(video => video.id)
        .filter(Boolean)
    );

    const missingInBatch = batch.filter(
      id => !returnedIds.has(id)
    );

    /*
      Safety verification:
      If a video is missing from a 50-video response,
      check that video individually before marking it
      as unavailable.
    */
    for (const id of missingInBatch) {
      const verification =
        await fetchVideoBatch([id]);

      if (
        verification.length > 0 &&
        verification[0]?.id === id
      ) {
        videos.push(verification[0]);
      } else {
        missingIds.push(id);
      }
    }

    const completed = Math.min(
      index + BATCH_SIZE,
      videoIds.length
    );

    console.log(
      `Checked API batch: ${completed}/${videoIds.length}`
    );
  }

  return {
    videos,
    missingIds
  };
}

function addProblem(
  problems,
  video,
  reason,
  extra = {}
) {
  problems.push({
    id: video?.id || '',
    title: video?.title || '',
    city: video?.city || '',
    country: video?.country || '',
    category: video?.category || '',
    reason,
    ...extra
  });
}

function createBackup() {
  fs.mkdirSync(
    BACKUP_DIR,
    {
      recursive: true
    }
  );

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-');

  const backupPath = path.join(
    BACKUP_DIR,
    `videos-before-health-cleanup-${timestamp}.json`
  );

  fs.copyFileSync(
    VIDEOS_PATH,
    backupPath
  );

  return backupPath;
}

function saveVideos(videos) {
  const tempPath =
    `${VIDEOS_PATH}.tmp`;

  fs.writeFileSync(
    tempPath,
    `${JSON.stringify(
      videos,
      null,
      2
    )}\n`,
    'utf8'
  );

  /*
    Write to a temporary file first.
    The original file is replaced only after
    the new JSON has been written successfully.
  */
  fs.renameSync(
    tempPath,
    VIDEOS_PATH
  );
}

async function main() {
  if (!API_KEY) {
    throw new Error(
      'YOUTUBE_API_KEY is missing.'
    );
  }

  const videos = loadVideos();
  const blacklist = loadBlacklist();

  console.log(
    `Archive videos: ${videos.length}`
  );

  console.log(
    `Blacklisted videos: ${blacklist.videoIds.size}`
  );

  console.log(
    `Blacklisted channels: ${blacklist.channelIds.size}`
  );

  const archiveById = new Map();
  const duplicateIds = [];

  for (const video of videos) {
    const id = String(
      video?.id || ''
    ).trim();

    if (!id) {
      continue;
    }

    if (archiveById.has(id)) {
      duplicateIds.push(id);
      continue;
    }

    archiveById.set(id, video);
  }

  const uniqueIds = [
    ...archiveById.keys()
  ];

  console.log(
    `Unique video IDs: ${uniqueIds.length}`
  );

  if (duplicateIds.length > 0) {
    console.log(
      `Duplicate IDs found: ${duplicateIds.length}`
    );
  }

  /*
    If the YouTube API fails anywhere during this stage,
    the script throws an error and stops before videos.json
    can be modified.
  */
  const healthData =
    await fetchVideoDetails(uniqueIds);

  const apiVideos =
    healthData.videos;

  const confirmedMissingIds =
    new Set(healthData.missingIds);

  const apiById = new Map(
    apiVideos.map(video => [
      video.id,
      video
    ])
  );

  const unhealthyVideos = [];

  const unhealthyIds =
    new Set();

  const reasonCounts = {
    blacklistedVideo: 0,
    blacklistedChannel: 0,
    missingFromApi: 0,
    notPublic: 0,
    embeddingDisabled: 0
  };

  let healthy = 0;

  for (const id of uniqueIds) {
    const archiveVideo =
      archiveById.get(id);

    if (
      blacklist.videoIds.has(id)
    ) {
      reasonCounts.blacklistedVideo++;

      unhealthyIds.add(id);

      addProblem(
        unhealthyVideos,
        archiveVideo,
        'blacklisted-video'
      );

      continue;
    }

    if (
      confirmedMissingIds.has(id)
    ) {
      reasonCounts.missingFromApi++;

      unhealthyIds.add(id);

      addProblem(
        unhealthyVideos,
        archiveVideo,
        'missing-from-youtube-api'
      );

      continue;
    }

    const apiVideo =
      apiById.get(id);

    /*
      This should normally never happen because all missing
      IDs were individually verified above. If it does happen,
      abort instead of deleting anything.
    */
    if (!apiVideo) {
      throw new Error(
        `Health verification incomplete for video: ${id}. No videos were removed.`
      );
    }

    const channelId = String(
      apiVideo.snippet?.channelId || ''
    ).trim();

    if (
      channelId &&
      blacklist.channelIds.has(channelId)
    ) {
      reasonCounts.blacklistedChannel++;

      unhealthyIds.add(id);

      addProblem(
        unhealthyVideos,
        archiveVideo,
        'blacklisted-channel',
        {
          channelId
        }
      );

      continue;
    }

    if (
      apiVideo.status?.privacyStatus !==
      'public'
    ) {
      reasonCounts.notPublic++;

      unhealthyIds.add(id);

      addProblem(
        unhealthyVideos,
        archiveVideo,
        'not-public',
        {
          privacyStatus:
            apiVideo.status?.privacyStatus ||
            'unknown'
        }
      );

      continue;
    }

    if (
      apiVideo.status?.embeddable !== true
    ) {
      reasonCounts.embeddingDisabled++;

      unhealthyIds.add(id);

      addProblem(
        unhealthyVideos,
        archiveVideo,
        'embedding-disabled',
        {
          channelId
        }
      );

      continue;
    }

    healthy++;
  }

  let backupPath = null;
  let removed = 0;
  let remaining = videos.length;

  /*
    Only modify videos.json when at least one video
    has been positively identified as unhealthy.
  */
  if (unhealthyIds.size > 0) {
    backupPath = createBackup();

    console.log('');
    console.log(
      `Backup created: ${backupPath}`
    );

    const cleanedVideos =
      videos.filter(video => {
        const id = String(
          video?.id || ''
        ).trim();

        return !unhealthyIds.has(id);
      });

    removed =
      videos.length -
      cleanedVideos.length;

    remaining =
      cleanedVideos.length;

    saveVideos(cleanedVideos);

    console.log(
      `Removed unhealthy videos: ${removed}`
    );

    console.log(
      `Remaining videos: ${remaining}`
    );
  } else {
    console.log('');
    console.log(
      'No unhealthy videos found. videos.json was not changed.'
    );
  }

  const report = {
    checkedAt:
      new Date().toISOString(),

    archiveVideos:
      videos.length,

    uniqueVideoIds:
      uniqueIds.length,

    duplicateIds:
      duplicateIds.length,

    healthy,

    unhealthy:
      unhealthyVideos.length,

    removed,

    remaining,

    backupPath,

    blacklist: {
      videos:
        blacklist.videoIds.size,

      channels:
        blacklist.channelIds.size
    },

    reasons:
      reasonCounts,

    unhealthyVideos
  };

  fs.writeFileSync(
    REPORT_PATH,
    `${JSON.stringify(
      report,
      null,
      2
    )}\n`,
    'utf8'
  );

  console.log('');
  console.log(
    'VIDEO HEALTH CHECK COMPLETE'
  );

  console.log(
    '---------------------------'
  );

  console.log(
    `Archive videos before check: ${report.archiveVideos}`
  );

  console.log(
    `Unique IDs: ${report.uniqueVideoIds}`
  );

  console.log(
    `Healthy: ${report.healthy}`
  );

  console.log(
    `Unhealthy: ${report.unhealthy}`
  );

  console.log(
    `Removed: ${report.removed}`
  );

  console.log(
    `Remaining: ${report.remaining}`
  );

  console.log(
    `Duplicate IDs: ${report.duplicateIds}`
  );

  console.log('');

  console.log(
    'Problems:',
    report.reasons
  );

  console.log('');

  if (report.backupPath) {
    console.log(
      `Backup: ${report.backupPath}`
    );
  }

  console.log(
    `Report saved: ${REPORT_PATH}`
  );
}

main().catch(error => {
  console.error(
    'Fatal error:',
    error.message || error
  );

  console.error(
    'Health cleanup stopped. No further changes were made.'
  );

  process.exit(1);
});
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PATHS = {
  candidates: './video-candidates.json',
  evidence: './video-candidates.evidence.json',
  locations: './video-candidates.locations.json',
  overture: './video-candidates.overture.json',
  evidenceReport: './video-candidate-evidence-report.json',
  overtureReport: './video-candidate-overture-report.json',
  admissionReport: './video-admission-report.json',
  rejected: './video-candidates.rejected.json',
  currentVideos: './src/data/videos.json',
  currentBackup: './src/data/videos.before-candidate-admission.json',
  sql: './sync-videos.generated.sql',
  overtureCache: './src/data/overture-evidence-cache.json',
  overtureAttribution: './src/data/overture-attribution.json'
};

function parseArguments(argv) {
  return {
    skipFetch: argv.includes('--skip-fetch'),
    skipRemoteD1: argv.includes('--skip-remote-d1'),
    applyLocalD1: argv.includes('--apply-local-d1'),
    help: argv.includes('--help') || argv.includes('-h')
  };
}

function printHelp() {
  console.log([
    'Usage:',
    '  node run-video-admission.mjs',
    '  node run-video-admission.mjs --skip-fetch',
    '  node run-video-admission.mjs --apply-local-d1',
    '  node run-video-admission.mjs --skip-remote-d1',
    '',
    'Default behavior:',
    '  Accepted videos are written to videos.json.',
    '  Safe D1 synchronization SQL is generated.',
    '  Remote D1 is synchronized automatically.',
    '  Archive and D1 active video counts are verified.',
    '',
    'Options:',
    '  --skip-fetch       Resume from an existing video-candidates.json file.',
    '  --apply-local-d1   Synchronize local D1 instead of remote D1.',
    '  --skip-remote-d1   Do not apply D1 synchronization.',
    '  --help             Show this help message.'
  ].join('\n'));
}

function absolute(filePath) {
  return path.resolve(__dirname, filePath);
}

function ensureFile(filePath) {
  const resolved = absolute(filePath);

  if (!fs.existsSync(resolved)) {
    throw new Error(`Required file was not found: ${resolved}`);
  }
}

function runStep(label, command, args, captureOutput = false) {
  console.log(`\n=== ${label} ===`);

  const result = spawnSync(command, args, {
    cwd: __dirname,
    stdio: captureOutput ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    encoding: captureOutput ? 'utf8' : undefined,
    windowsHide: true
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    if (captureOutput) {
      if (result.stdout) {
        console.error(result.stdout);
      }

      if (result.stderr) {
        console.error(result.stderr);
      }
    }

    throw new Error(`${label} failed with exit code ${result.status}.`);
  }

  return result;
}

function runNodeStep(label, script, args = [], stripTypes = false) {
  ensureFile(script);

  runStep(
    label,
    process.execPath,
    [
      ...(stripTypes ? ['--experimental-strip-types'] : []),
      script,
      ...args
    ]
  );
}

function readJson(filePath) {
  return JSON.parse(
    fs.readFileSync(
      absolute(filePath),
      'utf8'
    )
  );
}

function getVideoArray(document) {
  if (Array.isArray(document)) {
    return document;
  }

  if (Array.isArray(document?.videos)) {
    return document.videos;
  }

  if (Array.isArray(document?.items)) {
    return document.items;
  }

  throw new Error(
    'Current video data does not contain a video array.'
  );
}

function currentVideoCount() {
  ensureFile(PATHS.currentVideos);

  const document = readJson(PATHS.currentVideos);
  const videos = getVideoArray(document);

  return videos.length;
}

function candidateCount() {
  ensureFile(PATHS.candidates);

  const document = readJson(PATHS.candidates);

  if (!Array.isArray(document)) {
    throw new Error(
      'video-candidates.json must contain an array.'
    );
  }

  return document.length;
}

function getNpxCommand() {
  return process.platform === 'win32'
    ? 'npx.cmd'
    : 'npx';
}

function applyD1(remote) {
  ensureFile(PATHS.sql);

  const modeFlag = remote
    ? '--remote'
    : '--local';

  runStep(
    remote
      ? 'Apply remote D1 synchronization'
      : 'Apply local D1 synchronization',
    getNpxCommand(),
    [
      'wrangler',
      'd1',
      'execute',
      'oldtowns-db',
      modeFlag,
      `--file=${PATHS.sql}`
    ]
  );
}

function verifyD1Count(remote) {
  const archiveCount = currentVideoCount();

  const modeFlag = remote
    ? '--remote'
    : '--local';

  const result = runStep(
    remote
      ? 'Verify remote D1 video count'
      : 'Verify local D1 video count',
    getNpxCommand(),
    [
      'wrangler',
      'd1',
      'execute',
      'oldtowns-db',
      modeFlag,
      '--json',
      '--command=SELECT COUNT(*) AS total, SUM(active) AS active FROM videos;'
    ],
    true
  );

  let response;

  try {
    response = JSON.parse(result.stdout);
  } catch {
    console.error(result.stdout);

    throw new Error(
      'Could not parse D1 verification response.'
    );
  }

  const firstResult = Array.isArray(response)
    ? response[0]
    : response;

  const row =
    firstResult?.results?.[0] ||
    firstResult?.result?.[0] ||
    null;

  if (!row) {
    throw new Error(
      'D1 verification query returned no result.'
    );
  }

  const total = Number(row.total || 0);
  const active = Number(row.active || 0);

  console.log(`Archive videos: ${archiveCount}`);
  console.log(`D1 total rows: ${total}`);
  console.log(`D1 active videos: ${active}`);

  if (active !== archiveCount) {
    throw new Error(
      `D1 synchronization verification failed: archive=${archiveCount}, active=${active}.`
    );
  }

  console.log(
    `D1 synchronization verified: ${active}/${archiveCount} active videos.`
  );
}

function main() {
  const args = parseArguments(
    process.argv.slice(2)
  );

  if (args.help) {
    printHelp();
    return;
  }

  if (
    args.applyLocalD1 &&
    args.skipRemoteD1
  ) {
    throw new Error(
      'Choose either --apply-local-d1 or --skip-remote-d1, not both.'
    );
  }

  if (!args.skipFetch) {
    runNodeStep(
      'Fetch and pre-screen metadata',
      './fetch-videos.js'
    );
  }

  const discoveredCandidates =
    candidateCount();

  console.log(
    `Candidates ready for enrichment: ${discoveredCandidates}`
  );

  if (discoveredCandidates === 0) {
    console.log(
      'No candidates passed metadata screening. Current videos were not changed.'
    );

    return;
  }

  runNodeStep(
    'Enrich YouTube evidence',
    './enrich-video-evidence.mjs',
    [
      '--write',
      '--input',
      PATHS.candidates,
      '--output',
      PATHS.evidence,
      '--report',
      PATHS.evidenceReport
    ]
  );

  runNodeStep(
    'Detect city and country',
    './enrich-locations.js',
    [
      '--input',
      PATHS.evidence,
      '--output',
      PATHS.locations
    ]
  );

  runNodeStep(
    'Verify locations and nearby hotels',
    './enrich-video-overture.mjs',
    [
      '--write',
      '--input',
      PATHS.locations,
      '--output',
      PATHS.overture,
      '--report',
      PATHS.overtureReport,
      '--cache',
      PATHS.overtureCache,
      '--attribution',
      PATHS.overtureAttribution
    ]
  );

  runNodeStep(
    'Dry-run final admission gate',
    './finalize-video-candidates.mjs',
    [
      '--current',
      PATHS.currentVideos,
      '--candidates',
      PATHS.overture,
      '--report',
      PATHS.admissionReport,
      '--rejected',
      PATHS.rejected,
      '--backup',
      PATHS.currentBackup
    ],
    true
  );

  const admissionReport =
    readJson(PATHS.admissionReport);

  const accepted = Number(
    admissionReport.accepted || 0
  );

  if (accepted === 0) {
    console.log(
      'No candidates passed the final gate. Current videos were not changed.'
    );

    return;
  }

  runNodeStep(
    'Commit accepted candidates',
    './finalize-video-candidates.mjs',
    [
      '--write',
      '--current',
      PATHS.currentVideos,
      '--candidates',
      PATHS.overture,
      '--report',
      PATHS.admissionReport,
      '--rejected',
      PATHS.rejected,
      '--backup',
      PATHS.currentBackup
    ],
    true
  );

  /*
   * Generate synchronization SQL from the complete archive.
   * This script does not deactivate videos that are absent
   * from the source and does not modify other D1 tables.
   */
  runNodeStep(
    'Generate safe D1 synchronization SQL',
    './sync-videos-to-d1.mjs',
    [
      '--input',
      PATHS.currentVideos,
      '--output',
      PATHS.sql
    ]
  );

  if (args.skipRemoteD1) {
    console.log(
      'D1 synchronization was skipped by request.'
    );
  } else if (args.applyLocalD1) {
    applyD1(false);
    verifyD1Count(false);
  } else {
    applyD1(true);
    verifyD1Count(true);
  }

  console.log(
    `\nAdmission pipeline complete. Accepted videos: ${accepted}`
  );

  console.log(
    `Current archive videos: ${currentVideoCount()}`
  );

  if (!args.skipRemoteD1) {
    console.log(
      'Archive and D1 synchronization completed successfully.'
    );
  }
}

try {
  main();
} catch (error) {
  console.error(
    'Video admission pipeline failed:',
    error instanceof Error
      ? error.message
      : error
  );

  process.exitCode = 1;
}
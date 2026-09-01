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
  sql: './import-videos.generated.sql',
  overtureCache: './src/data/overture-evidence-cache.json',
  overtureAttribution: './src/data/overture-attribution.json'
};

function parseArguments(argv) {
  return {
    skipFetch: argv.includes('--skip-fetch'),
    applyLocalD1: argv.includes('--apply-local-d1'),
    applyRemoteD1: argv.includes('--apply-remote-d1'),
    help: argv.includes('--help') || argv.includes('-h')
  };
}

function printHelp() {
  console.log([
    'Usage:',
    '  node run-video-admission.mjs',
    '  node run-video-admission.mjs --skip-fetch',
    '  node run-video-admission.mjs --apply-local-d1',
    '  node run-video-admission.mjs --apply-remote-d1',
    '',
    'Options:',
    '  --skip-fetch       Resume from an existing video-candidates.json file.',
    '  --apply-local-d1   Apply the guarded SQL file to the local D1 database.',
    '  --apply-remote-d1  Apply the guarded SQL file to the remote D1 database.',
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

function runStep(label, command, args) {
  console.log(`\n=== ${label} ===`);

  const result = spawnSync(command, args, {
    cwd: __dirname,
    stdio: 'inherit',
    windowsHide: true
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}.`);
  }
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
  return JSON.parse(fs.readFileSync(absolute(filePath), 'utf8'));
}

function candidateCount() {
  ensureFile(PATHS.candidates);

  const document = readJson(PATHS.candidates);

  if (!Array.isArray(document)) {
    throw new Error('video-candidates.json must contain an array.');
  }

  return document.length;
}

function applyD1(remote) {
  const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const modeFlag = remote ? '--remote' : '--local';

  runStep(
    remote ? 'Apply remote D1 synchronization' : 'Apply local D1 synchronization',
    npxCommand,
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

function main() {
  const args = parseArguments(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  if (args.applyLocalD1 && args.applyRemoteD1) {
    throw new Error('Choose either local D1 or remote D1, not both.');
  }

  if (!args.skipFetch) {
    runNodeStep('Fetch and pre-screen metadata', './fetch-videos.js');
  }

  const discoveredCandidates = candidateCount();

  console.log(`Candidates ready for enrichment: ${discoveredCandidates}`);

  if (discoveredCandidates === 0) {
    console.log('No candidates passed metadata screening. Current videos were not changed.');
    return;
  }

  runNodeStep(
    'Enrich YouTube evidence',
    './enrich-video-evidence.mjs',
    [
      '--write',
      '--input', PATHS.candidates,
      '--output', PATHS.evidence,
      '--report', PATHS.evidenceReport
    ]
  );

  runNodeStep(
    'Detect city and country',
    './enrich-locations.js',
    [
      '--input', PATHS.evidence,
      '--output', PATHS.locations
    ]
  );

  runNodeStep(
    'Verify locations and nearby hotels',
    './enrich-video-overture.mjs',
    [
      '--write',
      '--input', PATHS.locations,
      '--output', PATHS.overture,
      '--report', PATHS.overtureReport,
      '--cache', PATHS.overtureCache,
      '--attribution', PATHS.overtureAttribution
    ]
  );

  runNodeStep(
    'Dry-run final admission gate',
    './finalize-video-candidates.mjs',
    [
      '--current', PATHS.currentVideos,
      '--candidates', PATHS.overture,
      '--report', PATHS.admissionReport,
      '--rejected', PATHS.rejected,
      '--backup', PATHS.currentBackup
    ],
    true
  );

  const admissionReport = readJson(PATHS.admissionReport);
  const accepted = Number(admissionReport.accepted || 0);

  if (accepted === 0) {
    console.log('No candidates passed the final gate. Current videos were not changed.');
    return;
  }

  runNodeStep(
    'Commit accepted candidates',
    './finalize-video-candidates.mjs',
    [
      '--write',
      '--current', PATHS.currentVideos,
      '--candidates', PATHS.overture,
      '--report', PATHS.admissionReport,
      '--rejected', PATHS.rejected,
      '--backup', PATHS.currentBackup
    ],
    true
  );

  runNodeStep(
    'Generate guarded D1 SQL',
    './import-videos-to-d1.mjs',
    [
      '--input', PATHS.currentVideos,
      '--output', PATHS.sql
    ],
    true
  );

  if (args.applyLocalD1) {
    applyD1(false);
  } else if (args.applyRemoteD1) {
    applyD1(true);
  }

  console.log(`\nAdmission pipeline complete. Accepted videos: ${accepted}`);

  if (!args.applyLocalD1 && !args.applyRemoteD1) {
    console.log('Guarded SQL was generated but no D1 database was changed.');
  }
}

try {
  main();
} catch (error) {
  console.error('Video admission pipeline failed:', error.message || error);
  process.exitCode = 1;
}

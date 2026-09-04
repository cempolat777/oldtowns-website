import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const DEFAULT_INPUT_PATH = './src/data/videos.json';
const DEFAULT_REPORT_PATH = './video-integrity-repair-report.json';
const DEFAULT_CACHE_PATH = './src/data/overture-evidence-cache.json';
const DEFAULT_ATTRIBUTION_PATH = './src/data/overture-attribution.json';

function parseArguments(argv) {
  const args = {
    inputPath: DEFAULT_INPUT_PATH,
    reportPath: DEFAULT_REPORT_PATH,
    cachePath: DEFAULT_CACHE_PATH,
    attributionPath: DEFAULT_ATTRIBUTION_PATH,
    duckdbCommand: 'duckdb',
    release: '',
    write: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--write') {
      args.write = true;
    } else if (value === '--input' && argv[index + 1]) {
      args.inputPath = argv[++index];
    } else if (value === '--report' && argv[index + 1]) {
      args.reportPath = argv[++index];
    } else if (value === '--cache' && argv[index + 1]) {
      args.cachePath = argv[++index];
    } else if (value === '--attribution' && argv[index + 1]) {
      args.attributionPath = argv[++index];
    } else if (value === '--duckdb' && argv[index + 1]) {
      args.duckdbCommand = argv[++index];
    } else if (value === '--release' && argv[index + 1]) {
      args.release = argv[++index];
    }
  }

  return args;
}

function runNode(scriptPath, args, options = {}) {
  const result = spawnSync(
    process.execPath,
    [scriptPath, ...args],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: options.capture
        ? ['ignore', 'pipe', 'pipe']
        : 'inherit'
    }
  );

  if (result.error) {
    throw result.error;
  }

  if (
    result.status !== 0 &&
    !options.allowFailure
  ) {
    throw new Error(
      `${path.basename(scriptPath)} failed with exit code ${result.status}.`
    );
  }

  return result;
}

function parseJsonOutput(result, label) {
  const output = String(result.stdout || '').trim();

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  try {
    return JSON.parse(output);
  } catch {
    throw new Error(
      `${label} did not return valid JSON.`
    );
  }
}

function readJson(filePath) {
  return JSON.parse(
    fs.readFileSync(filePath, 'utf8')
  );
}

function writeJsonAtomic(filePath, value) {
  const absolutePath = path.resolve(filePath);
  const temporaryPath = `${absolutePath}.tmp`;

  fs.mkdirSync(
    path.dirname(absolutePath),
    { recursive: true }
  );

  fs.writeFileSync(
    temporaryPath,
    `${JSON.stringify(value, null, 2)}\n`,
    'utf8'
  );

  fs.renameSync(temporaryPath, absolutePath);
}

function timestampForPath() {
  return new Date()
    .toISOString()
    .replace(/[:.]/g, '-');
}

function commitFile(sourcePath, targetPath) {
  const absoluteTarget = path.resolve(targetPath);
  const temporaryTarget = `${absoluteTarget}.integrity.tmp`;

  fs.mkdirSync(
    path.dirname(absoluteTarget),
    { recursive: true }
  );
  fs.copyFileSync(sourcePath, temporaryTarget);
  fs.renameSync(temporaryTarget, absoluteTarget);
}

function main() {
  const args = parseArguments(
    process.argv.slice(2)
  );

  const projectRoot = process.cwd();
  const inputPath = path.resolve(args.inputPath);

  if (!fs.existsSync(inputPath)) {
    throw new Error(
      `Video data file not found: ${inputPath}`
    );
  }

  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'oldtowns-integrity-')
  );

  try {
    const temporaryInput = path.join(
      temporaryDirectory,
      'videos.json'
    );
    const evidenceReportPath = path.join(
      temporaryDirectory,
      'evidence-report.json'
    );
    const overtureReportPath = path.join(
      temporaryDirectory,
      'overture-report.json'
    );
    const temporaryAttributionPath = path.join(
      temporaryDirectory,
      'overture-attribution.json'
    );
    const temporaryCachePath = path.join(
      temporaryDirectory,
      'overture-evidence-cache.json'
    );

    fs.copyFileSync(inputPath, temporaryInput);

    if (fs.existsSync(path.resolve(args.cachePath))) {
      fs.copyFileSync(
        path.resolve(args.cachePath),
        temporaryCachePath
      );
    }

    console.error(
      'Stage 1/4: Rebuilding video evidence in an isolated copy.'
    );

    runNode(
      path.join(projectRoot, 'enrich-video-evidence.mjs'),
      [
        '--offline',
        '--write',
        '--input', temporaryInput,
        '--report', evidenceReportPath,
        '--backup', path.join(
          temporaryDirectory,
          'videos.before-evidence.json'
        )
      ]
    );

    console.error(
      'Stage 2/4: Rebuilding verified locations and nearby hotels.'
    );

    const overtureArguments = [
      '--write',
      '--input', temporaryInput,
      '--report', overtureReportPath,
      '--cache', temporaryCachePath,
      '--attribution', temporaryAttributionPath,
      '--backup', path.join(
        temporaryDirectory,
        'videos.before-overture.json'
      ),
      '--duckdb', args.duckdbCommand
    ];

    if (args.release) {
      overtureArguments.push(
        '--release',
        args.release
      );
    }

    runNode(
      path.join(projectRoot, 'enrich-video-overture.mjs'),
      overtureArguments
    );

    console.error(
      'Stage 3/4: Running integrity audit.'
    );

    const integrityResult = runNode(
      path.join(projectRoot, 'audit-video-integrity.mjs'),
      [temporaryInput],
      {
        capture: true,
        allowFailure: true
      }
    );
    const integrity = parseJsonOutput(
      integrityResult,
      'Integrity audit'
    );

    console.error(
      'Stage 4/4: Running multilingual SEO audit.'
    );

    const seoResult = runNode(
      path.join(projectRoot, 'audit-video-seo.mjs'),
      [temporaryInput],
      {
        capture: true,
        allowFailure: true
      }
    );
    const seo = parseJsonOutput(
      seoResult,
      'SEO audit'
    );

    const report = {
      generatedAt: new Date().toISOString(),
      mode: args.write ? 'write' : 'dry-run',
      inputPath: args.inputPath,
      evidence: readJson(evidenceReportPath),
      overture: readJson(overtureReportPath),
      integrity,
      seo
    };

    writeJsonAtomic(args.reportPath, report);

    if (
      integrity.criticalCount > 0 ||
      integrityResult.status !== 0
    ) {
      throw new Error(
        `Integrity audit blocked the update with ${integrity.criticalCount} critical findings.`
      );
    }

    if (
      seo.failureCount > 0 ||
      seoResult.status !== 0
    ) {
      throw new Error(
        `SEO audit blocked the update with ${seo.failureCount} failures.`
      );
    }

    if (fs.existsSync(temporaryCachePath)) {
      commitFile(
        temporaryCachePath,
        path.resolve(args.cachePath)
      );
    }

    if (!args.write) {
      console.log(
        'Dry run passed. The original videos.json file was not changed.'
      );
      console.log(
        `Report: ${path.resolve(args.reportPath)}`
      );
      return;
    }

    const backupPath = path.join(
      path.dirname(inputPath),
      `videos.before-integrity-repair.${timestampForPath()}.json`
    );

    fs.copyFileSync(inputPath, backupPath);
    commitFile(temporaryInput, inputPath);

    if (fs.existsSync(temporaryAttributionPath)) {
      commitFile(
        temporaryAttributionPath,
        path.resolve(args.attributionPath)
      );
    }

    console.log(
      'Integrity repair passed and videos.json was updated.'
    );
    console.log(`Backup: ${backupPath}`);
    console.log(
      `Report: ${path.resolve(args.reportPath)}`
    );
  } finally {
    fs.rmSync(
      temporaryDirectory,
      { recursive: true, force: true }
    );
  }
}

try {
  main();
} catch (error) {
  console.error(
    'Integrity repair failed:',
    error.message || error
  );
  process.exitCode = 1;
}

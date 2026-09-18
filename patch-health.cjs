const fs = require('fs');

const file = 'check-video-health.mjs';
const backup = 'check-video-health.before-auto-d1.mjs';

let text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');

fs.copyFileSync(file, backup);

if (!text.includes("import { spawnSync } from 'node:child_process';")) {
  text = text.replace(
    "import { loadEnvFile } from 'node:process';",
    "import { loadEnvFile } from 'node:process';\nimport { spawnSync } from 'node:child_process';"
  );
}

if (!text.includes("const D1_DATABASE = 'oldtowns-db';")) {
  text = text.replace(
    "const BACKUP_DIR = './src/data/health-backups';",
    "const BACKUP_DIR = './src/data/health-backups';\nconst D1_DATABASE = 'oldtowns-db';\nconst D1_SQL_PATH = './video-health-d1.generated.sql';"
  );
}

if (!text.includes('function syncHealthToD1(')) {
  const helper = `
function sqlString(value) {
  return "'" + String(value).replace(/'/g, "''") + "'";
}

function writeD1HealthSql(healthyIds, unhealthyIds) {
  const statements = [];

  if (healthyIds.size > 0) {
    const ids = [...healthyIds].map(sqlString).join(', ');

    statements.push(
      \`UPDATE videos SET active = 1, updated_at = CURRENT_TIMESTAMP WHERE id IN (\${ids});\`
    );
  }

  if (unhealthyIds.size > 0) {
    const ids = [...unhealthyIds].map(sqlString).join(', ');

    statements.push(
      \`UPDATE videos SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id IN (\${ids});\`
    );
  }

  fs.writeFileSync(
    D1_SQL_PATH,
    statements.join('\\n') + '\\n',
    'utf8'
  );
}

function syncHealthToD1(healthyIds, unhealthyIds) {
  writeD1HealthSql(healthyIds, unhealthyIds);

  const npxCommand =
    process.platform === 'win32'
      ? 'npx.cmd'
      : 'npx';

  const result = spawnSync(
    npxCommand,
    [
      'wrangler',
      'd1',
      'execute',
      D1_DATABASE,
      '--remote',
      \`--file=\${D1_SQL_PATH}\`
    ],
    {
      stdio: 'inherit',
      env: process.env
    }
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      \`D1 health sync failed with exit code \${result.status}. videos.json was not changed.\`
    );
  }
}

`;

  text = text.replace(
    'async function main() {',
    helper + 'async function main() {'
  );
}

if (!text.includes('const healthyIds =')) {
  text = text.replace(
    `const unhealthyIds =
    new Set();`,
    `const unhealthyIds =
    new Set();

  const healthyIds =
    new Set();`
  );
}

text = text.replace(
  `    healthy++;
  }`,
  `    healthy++;
    healthyIds.add(id);
  }`
);

const start = text.indexOf('  let backupPath = null;');
const end = text.indexOf('  const report = {', start);

if (start === -1 || end === -1) {
  throw new Error('Health cleanup block not found.');
}

const replacement = `  let backupPath = null;
  let removed = 0;
  let remaining = videos.length;

  if (
    healthyIds.size > 0 ||
    unhealthyIds.size > 0
  ) {
    console.log('');
    console.log('Syncing video health status to D1...');

    syncHealthToD1(
      healthyIds,
      unhealthyIds
    );

    console.log('D1 health status sync complete.');
  }

  if (unhealthyIds.size > 0) {
    backupPath = createBackup();

    console.log('');
    console.log(
      \`Backup created: \${backupPath}\`
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
      \`Removed unhealthy videos from active JSON: \${removed}\`
    );

    console.log(
      \`Remaining active videos: \${remaining}\`
    );
  } else {
    console.log('');
    console.log(
      'No unhealthy videos found. videos.json was not changed.'
    );
  }

`;

text =
  text.slice(0, start) +
  replacement +
  text.slice(end);

const catchStart = text.indexOf('main().catch(error => {');

if (catchStart === -1) {
  throw new Error('Main catch block not found.');
}

text =
  text.slice(0, catchStart) +
  `main().catch(error => {
  console.error(
    error instanceof Error
      ? error.stack || error.message
      : error
  );

  process.exitCode = 1;
});
`;

fs.writeFileSync(file, text, 'utf8');

console.log('UPDATED:', file);
console.log('BACKUP:', backup);

const fs = require('node:fs');

const candidates = JSON.parse(fs.readFileSync('dw-documentary-candidates.json', 'utf8'));
const videos = JSON.parse(fs.readFileSync('src/data/videos.json', 'utf8'));
const ids = new Set(videos.map(v => v.id));

if (
  candidates.length !== 515 ||
  candidates.some(v => !v.id || v.category !== 'Documentaries' || !ids.has(v.id)) ||
  new Set(candidates.map(v => v.id)).size !== 515
) {
  throw new Error('Documentary data check failed. Nothing was imported.');
}

const quote = value => "'" + String(value ?? '').replace(/'/g, "''") + "'";
const files = [];

for (let i = 0; i < candidates.length; i += 25) {
  const batch = candidates.slice(i, i + 25);
  const sql = batch.map(v => {
    const raw = JSON.stringify(v);
    return `INSERT OR IGNORE INTO videos (id,title,description,thumbnail,category,channel,channel_title,channel_id,badge,published_at,city,country,raw_json,active)
VALUES (${[
      v.id, v.title, v.description, v.thumbnail, 'Documentaries',
      v.channel, v.channelTitle, v.channelId, v.badge,
      v.publishedAt, '', '', raw
    ].map(quote).join(',')},1);`;
  }).join('\n');

  const file = `dw-documentary-import-${String(i / 25 + 1).padStart(2, '0')}.sql`;
  fs.writeFileSync(file, sql, 'utf8');
  files.push(file);
}

fs.writeFileSync('dw-documentary-import-files.json', JSON.stringify(files));
console.log(`Prepared ${candidates.length} documentaries in ${files.length} SQL files.`);

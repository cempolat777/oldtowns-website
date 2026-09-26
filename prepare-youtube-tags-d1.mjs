import fs from 'node:fs';

const videos = JSON.parse(
  fs.readFileSync('./src/data/videos.json', 'utf8').replace(/^\uFEFF/, '')
);

const statements = [];
const seen = new Set();

for (const video of videos) {
  const id = String(video?.id || '');

  if (
    !/^[A-Za-z0-9_-]{11}$/.test(id) ||
    !Array.isArray(video.youtubeTags) ||
    seen.has(id)
  ) {
    continue;
  }

  seen.add(id);

  const tags = JSON.stringify(
    video.youtubeTags.filter(tag => typeof tag === 'string')
  ).replaceAll("'", "''");

  statements.push(
    `UPDATE videos SET raw_json = json_set(raw_json, '$.youtubeTags', json('${tags}')) WHERE id = '${id}' AND json_valid(raw_json) = 1;`
  );
}

if (statements.length === 0) {
  throw new Error('No video tags found. Database unchanged.');
}

fs.writeFileSync(
  './youtube-tags-d1.sql',
  statements.join('\n') + '\n',
  'utf8'
);

console.log(`Video tag updates prepared: ${statements.length}`);

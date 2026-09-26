import fs from 'node:fs';
import { loadEnvFile } from 'node:process';

try { loadEnvFile(); } catch {}

const apiKey = process.env.YOUTUBE_API_KEY;
if (!apiKey) throw new Error('YOUTUBE_API_KEY is missing.');

const input = JSON.parse(
  fs.readFileSync('./missing-youtube-tags.json', 'utf8').replace(/^\uFEFF/, '')
);

const rows = Array.isArray(input)
  ? input.flatMap(item => item.results || [])
  : input.results || [];

const ids = [...new Set(
  rows.map(row => String(row.id || '').trim())
    .filter(id => /^[A-Za-z0-9_-]{11}$/.test(id))
)];

if (!ids.length) throw new Error('No valid video IDs found.');

const statements = [];
let withTags = 0;
let withoutTags = 0;
let unavailable = 0;

for (let i = 0; i < ids.length; i += 50) {
  const batch = ids.slice(i, i + 50);

  const params = new URLSearchParams({
    part: 'snippet',
    id: batch.join(','),
    fields: 'items(id,snippet(tags))',
    key: apiKey
  });

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${params}`
  );

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `YouTube API: ${response.status}`);
  }

  const returned = new Map(
    (data.items || []).map(item => [item.id, item])
  );

  for (const id of batch) {
    const item = returned.get(id);

    if (!item) {
      unavailable++;
      continue;
    }

    const tags = Array.isArray(item.snippet?.tags)
      ? [...new Set(
          item.snippet.tags
            .filter(tag => typeof tag === 'string')
            .map(tag => tag.trim())
            .filter(Boolean)
        )]
      : [];

    if (tags.length) withTags++;
    else withoutTags++;

    const escapedTags = JSON.stringify(tags).replaceAll("'", "''");

    statements.push(
      `UPDATE videos SET raw_json = json_set(raw_json, '$.youtubeTags', json('${escapedTags}')) WHERE id = '${id}' AND json_valid(raw_json) = 1 AND json_type(raw_json, '$.youtubeTags') IS NULL;`
    );
  }
}

if (!statements.length) {
  throw new Error('No updates prepared. Database unchanged.');
}

fs.writeFileSync(
  './missing-youtube-tags-d1.sql',
  statements.join('\n') + '\n',
  'utf8'
);

console.log(JSON.stringify({
  requested: ids.length,
  prepared: statements.length,
  withTags,
  withoutTags,
  unavailable
}, null, 2));

const fs = require('fs');

const data = JSON.parse(
  fs.readFileSync('missing-112-recovered.json', 'utf8').replace(/^\uFEFF/, '')
);

function sql(value) {
  if (value === null || value === undefined) return 'NULL';
  return "'" + String(value).replace(/'/g, "''") + "'";
}

const statements = data.map((item) => {
  const v = item.raw_json;

  return `INSERT OR IGNORE INTO videos (
    id,
    title,
    description,
    thumbnail,
    category,
    channel,
    channel_title,
    channel_id,
    badge,
    published_at,
    city,
    country,
    raw_json,
    active
  ) VALUES (
    ${sql(v.id)},
    ${sql(v.title)},
    ${sql(v.description)},
    ${sql(v.thumbnail)},
    ${sql(v.category)},
    ${sql(v.channel)},
    ${sql(v.channelTitle)},
    ${sql(v.channelId)},
    ${sql(v.badge)},
    ${sql(v.publishedAt)},
    ${sql(v.city)},
    ${sql(v.country)},
    ${sql(JSON.stringify(v))},
    0
  );`;
});

fs.writeFileSync(
  'restore-missing-112.sql',
  statements.join('\n'),
  'utf8'
);

console.log('SQL ROWS:', statements.length);

import fs from 'node:fs';

const videos = JSON.parse(
  fs.readFileSync('./src/data/videos.json', 'utf8')
);

const suspicious = [];

for (const video of videos) {
  const city = String(video.city || '').trim();
  const title = String(video.title || '').trim();

  if (!city || !title) continue;

  const normalizedCity = city.toLowerCase();
  const normalizedTitle = title.toLowerCase();

  if (!normalizedTitle.includes(normalizedCity)) {
    suspicious.push({
      id: video.id,
      city: video.city,
      country: video.country,
      title: video.title
    });
  }
}

fs.writeFileSync(
  './city-title-mismatch.json',
  JSON.stringify(suspicious, null, 2),
  'utf8'
);

console.log(`Suspicious: ${suspicious.length}`);
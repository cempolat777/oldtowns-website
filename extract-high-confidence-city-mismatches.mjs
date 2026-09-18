import fs from 'node:fs';

const videos = JSON.parse(
  fs.readFileSync('./src/data/videos.json', 'utf8')
);

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const cityCountryCounts = new Map();

for (const video of videos) {
  const city = String(video.city || '').trim();
  const country = String(video.country || '').trim();

  if (!city || !country) continue;

  if (!cityCountryCounts.has(city)) {
    cityCountryCounts.set(city, new Map());
  }

  const countryCounts = cityCountryCounts.get(city);
  countryCounts.set(
    country,
    (countryCounts.get(country) || 0) + 1
  );
}

const cityCountry = new Map();

for (const [city, counts] of cityCountryCounts) {
  const sorted = [...counts.entries()]
    .sort((a, b) => b[1] - a[1]);

  cityCountry.set(city, sorted[0][0]);
}

const cities = [...cityCountry.keys()]
  .filter(city => normalize(city).length >= 4)
  .sort((a, b) => b.length - a.length);

const ambiguousCities = new Set([
  'nice',
  'reading',
  'mobile',
  'bath',
  'orange'
]);

const suspicious = [];

for (const video of videos) {
  const assignedCity = String(video.city || '').trim();
  const assignedCountry = String(video.country || '').trim();
  const title = normalize(video.title);

  if (!assignedCity || !assignedCountry || !title) continue;

  const assignedCityNormalized = normalize(assignedCity);

  if (title.includes(assignedCityNormalized)) {
    continue;
  }

  const matches = [];

  for (const candidateCity of cities) {
    const candidateNormalized = normalize(candidateCity);

    if (candidateCity === assignedCity) continue;
    if (ambiguousCities.has(candidateNormalized)) continue;

    const pattern = new RegExp(
      `(^| )${candidateNormalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`
    );

    if (!pattern.test(title)) continue;

    const candidateCountry = cityCountry.get(candidateCity);

    if (
      candidateCountry &&
      normalize(candidateCountry) !== normalize(assignedCountry)
    ) {
      matches.push({
        city: candidateCity,
        country: candidateCountry
      });
    }
  }

  if (matches.length === 1) {
    suspicious.push({
      id: video.id,
      assignedCity,
      assignedCountry,
      detectedCity: matches[0].city,
      detectedCountry: matches[0].country,
      title: video.title
    });
  }
}

fs.writeFileSync(
  './high-confidence-city-mismatches.json',
  JSON.stringify(suspicious, null, 2),
  'utf8'
);

console.log(`High-confidence candidates: ${suspicious.length}`);
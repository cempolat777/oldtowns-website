import fs from 'node:fs';

const VIDEO_PATH = './src/data/videos.json';

const fixes = {
  'vfB6rAlV9Xc': ['London', 'United Kingdom', 'New York', 'United States'],
  'SExU_8-2aUA': ['Rome', 'Italy', 'Mexico City', 'Mexico'],
  'to7siLP-q5A': ['Rome', 'Italy', 'Mexico City', 'Mexico'],
  'Y81PNtTBWe4': ['Paris', 'France', 'Mexico City', 'Mexico'],
  '4-fKYMpm2VA': ['Rome', 'Italy', 'Mexico City', 'Mexico'],
  'gpYi5QxN8iE': ['Rome', 'Italy', 'Mexico City', 'Mexico'],
  '8FRwlYpK5MU': ['Cambridge', 'United Kingdom', 'Toronto', 'Canada'],
  'yynU6cjshcY': ['Rome', 'Italy', 'Mexico City', 'Mexico'],
  '40DSJZD5nMw': ['Oxford', 'United Kingdom', 'New York', 'United States'],
  'vZ0k8yROua0': ['Paris', 'France', 'Athens', 'Greece'],
  'lrTe-c5LgF8': ['New York', 'United States', 'Toronto', 'Canada'],
  'R4c3DLWnn0U': ['Oxford', 'United Kingdom', 'New York', 'United States'],
  'DUSEQDmtxfk': ['Paris', 'France', 'Athens', 'Greece'],
  'OImKEFPyT7E': ['Paris', 'France', 'Las Vegas', 'United States'],
  '3ecyAHQDsIU': ['Tokyo', 'Japan', 'Los Angeles', 'United States'],
  'nbQ_z-0ZO28': ['Tokyo', 'Japan', 'Hanoi', 'Vietnam'],
  'VINOSu5y4ic': ['Venice', 'Italy', 'Los Angeles', 'United States'],
  'I9XB1gHvF74': ['Tokyo', 'Japan', 'Dubai', 'United Arab Emirates'],
  'rmxNPzpuFB4': ['Tokyo', 'Japan', 'Singapore', 'Singapore'],
  'RZ9ZeSu8HIE': ['Venice', 'Italy', 'Los Angeles', 'United States'],
  '64iJylQa0Y4': ['Nice', 'France', 'Florence', 'Italy'],
  '3CRJWy5zXvg': ['Tokyo', 'Japan', 'Bangkok', 'Thailand'],
  '8ozcWp5Bj4c': ['Tokyo', 'Japan', 'Porto', 'Portugal'],
  'thncN0KR_dE': ['Venice', 'Italy', 'Barcelona', 'Spain'],
  'xJVOVzK03BQ': ['Tokyo', 'Japan', 'London', 'United Kingdom'],
  'I0s0xVRERs0': ['Tokyo', 'Japan', 'Las Vegas', 'United States'],
  'Gwfq7moxzKw': ['Tokyo', 'Japan', 'Amsterdam', 'Netherlands'],
  'zvc7ZcMmIWE': ['Venice', 'Italy', 'Madrid', 'Spain'],
  'sTs9aa7Y6lI': ['Tokyo', 'Japan', 'Lisbon', 'Portugal'],
  '48PXW6V8Cj4': ['Tokyo', 'Japan', 'Cairo', 'Egypt'],
  'n_hx_rQQ6sw': ['Kyoto', 'Japan', 'Athens', 'Greece'],
  'd3lX1iSEkT8': ['Tokyo', 'Japan', 'Mexico City', 'Mexico'],
  'sq0fi9y9iKY': ['Tokyo', 'Japan', 'Singapore', 'Singapore'],
  'OnGu5XgeZ3E': ['Tokyo', 'Japan', 'Madrid', 'Spain'],
  'mD1J68ce2-s': ['Tokyo', 'Japan', 'Lisbon', 'Portugal'],
  'ovK5FbRXVkg': ['Venice', 'Italy', 'Las Vegas', 'United States'],
  'UJw2HGqlHPg': ['Tokyo', 'Japan', 'Mexico City', 'Mexico'],
  'AM8MsJWuevw': ['Tokyo', 'Japan', 'Miami', 'United States'],
  'JDvLlvPDhxg': ['Paris', 'France', 'Miami', 'United States'],
  'iQ2RXLUH9mI': ['Tokyo', 'Japan', 'Las Vegas', 'United States'],
  'LddoNrTyJA4': ['Tokyo', 'Japan', 'Mexico City', 'Mexico'],
  'mt6uleO1tEs': ['Tokyo', 'Japan', 'Dubai', 'United Arab Emirates'],
  '3_o9H1f8H5s': ['Tokyo', 'Japan', 'New York', 'United States'],
  'nw9uApBSoWI': ['Tokyo', 'Japan', 'Las Vegas', 'United States'],
  'WHl2fyeoRKo': ['Kyoto', 'Japan', 'Athens', 'Greece'],
  '6Yn5nBsueIk': ['Tokyo', 'Japan', 'Amsterdam', 'Netherlands'],
  'LV5cGYJWZYY': ['London', 'United Kingdom', 'Paris', 'France'],
  '1F6sQHXvZqE': ['London', 'United Kingdom', 'Paris', 'France'],
  'a_PaSxIyKfw': ['Palermo', 'Italy', 'Buenos Aires', 'Argentina'],
  'lL2mFfR_0XI': ['London', 'United Kingdom', 'Paris', 'France'],
  'yAbJdGXuOIE': ['Paris', 'France', 'Hanoi', 'Vietnam']
};

const raw = fs.readFileSync(VIDEO_PATH, 'utf8');
const videos = JSON.parse(raw);

const byId = new Map(videos.map(video => [video.id, video]));
const errors = [];

for (const [id, fix] of Object.entries(fixes)) {
  const [expectedCity, expectedCountry] = fix;
  const video = byId.get(id);

  if (!video) {
    errors.push(`${id}: video not found`);
    continue;
  }

  if (
    video.city !== expectedCity ||
    video.country !== expectedCountry
  ) {
    errors.push(
      `${id}: expected ${expectedCity}, ${expectedCountry} but found ${video.city}, ${video.country}`
    );
  }
}

if (errors.length > 0) {
  console.error('Validation failed. No changes were made.');
  console.error(errors.join('\n'));
  process.exit(1);
}

const timestamp = new Date()
  .toISOString()
  .replace(/[:.]/g, '-');

const backupPath =
  `./src/data/videos.before-high-confidence-city-fix-${timestamp}.json`;

fs.writeFileSync(backupPath, raw, 'utf8');

let changed = 0;

for (const [id, fix] of Object.entries(fixes)) {
  const [, , newCity, newCountry] = fix;
  const video = byId.get(id);

  video.city = newCity;
  video.country = newCountry;
  changed++;
}

fs.writeFileSync(
  VIDEO_PATH,
  JSON.stringify(videos, null, 2) + '\n',
  'utf8'
);

console.log(`Validated: ${Object.keys(fixes).length}`);
console.log(`Changed: ${changed}`);
console.log(`Backup: ${backupPath}`);
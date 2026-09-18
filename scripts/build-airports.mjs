import fs from 'node:fs/promises';
import path from 'node:path';

const SOURCE_URL =
  'https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airports.csv';

const OUTPUT_PATH = path.resolve(
  'public',
  'data',
  'airports.min.json'
);

function parseCsvLine(line) {
  const values = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }

      continue;
    }

    if (character === ',' && !quoted) {
      values.push(value);
      value = '';
      continue;
    }

    value += character;
  }

  values.push(value);
  return values;
}

const response = await fetch(SOURCE_URL);

if (!response.ok) {
  throw new Error(
    `Airport download failed: ${response.status} ${response.statusText}`
  );
}

const csv = await response.text();
const lines = csv.split(/\r?\n/);
const header = parseCsvLine(lines.shift() || '');

const columnIndex = Object.fromEntries(
  header.map((name, index) => [name, index])
);

const read = (values, name) =>
  values[columnIndex[name]] || '';

const airports = [];

for (let index = 0; index < lines.length; index += 1) {
  const line = lines[index];

  if (!line) continue;

  const values = parseCsvLine(line);
  const type = read(values, 'type');

  if (!type || type === 'closed') continue;

  const lat = Number(read(values, 'latitude_deg'));
  const lng = Number(read(values, 'longitude_deg'));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    continue;
  }

  airports.push({
    id: read(values, 'id') || read(values, 'ident') || String(index),
    ident: read(values, 'ident'),
    type,
    name: read(values, 'name'),
    country: read(values, 'iso_country'),
    city: read(values, 'municipality'),
    scheduled: read(values, 'scheduled_service'),
    iata: read(values, 'iata_code'),
    icao: read(values, 'icao_code') || read(values, 'gps_code'),
    lat,
    lng
  });
}

await fs.mkdir(path.dirname(OUTPUT_PATH), {
  recursive: true
});

await fs.writeFile(
  OUTPUT_PATH,
  JSON.stringify(airports),
  'utf8'
);

const stat = await fs.stat(OUTPUT_PATH);

console.log(`Airports written: ${airports.length.toLocaleString()}`);
console.log(`Output: ${OUTPUT_PATH}`);
console.log(`Size: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);
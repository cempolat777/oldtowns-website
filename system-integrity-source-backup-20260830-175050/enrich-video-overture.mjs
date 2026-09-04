import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const DEFAULT_INPUT_PATH = './src/data/videos.json';
const DEFAULT_REPORT_PATH = './video-overture-report.json';
const DEFAULT_CACHE_PATH = './src/data/overture-evidence-cache.json';
const DEFAULT_ATTRIBUTION_PATH = './src/data/overture-attribution.json';
const DEFAULT_BACKUP_PATH = './src/data/videos.before-overture-enrichment.json';
const STAC_CATALOG_URL = 'https://stac.overturemaps.org/catalog.json';
const OVERTURE_S3_ROOT = 's3://overturemaps-us-west-2/release';
const ENGINE_VERSION = 1;
const CITY_SEARCH_BATCH_SIZE = 25;
const ROUTE_SEARCH_RADIUS_KM = 60;
const HOTEL_SEARCH_RADIUS_METERS = 3_000;
const HOTEL_QUERY_PADDING_KM = 4;
const MAX_QUERY_ROWS = 5_000;
const MIN_PLACE_CONFIDENCE = 0.55;
const MIN_HOTEL_CONFIDENCE = 0.65;
const MIN_ROUTE_MATCH_SCORE = 0.68;
const MIN_TITLE_MATCH_SCORE = 0.76;
const DUCKDB_MAX_BUFFER = 100 * 1024 * 1024;

const COUNTRY_CODE_ALIASES = new Map([
  ['bolivia', 'BO'],
  ['brunei', 'BN'],
  ['cape verde', 'CV'],
  ['czech republic', 'CZ'],
  ['czechia', 'CZ'],
  ['hong kong', 'HK'],
  ['iran', 'IR'],
  ['laos', 'LA'],
  ['moldova', 'MD'],
  ['north korea', 'KP'],
  ['palestine', 'PS'],
  ['republic of korea', 'KR'],
  ['russia', 'RU'],
  ['south korea', 'KR'],
  ['syria', 'SY'],
  ['taiwan', 'TW'],
  ['tanzania', 'TZ'],
  ['turkey', 'TR'],
  ['turkiye', 'TR'],
  ['türkiye', 'TR'],
  ['uae', 'AE'],
  ['uk', 'GB'],
  ['united kingdom', 'GB'],
  ['united states', 'US'],
  ['united states of america', 'US'],
  ['usa', 'US'],
  ['venezuela', 'VE'],
  ['vietnam', 'VN']
]);

const LOCATION_NOISE_WORDS = new Set([
  '4k', '8k', 'hdr', 'uhd', '60fps', '30fps', 'fps', 'pov', 'tv',
  'walk', 'walking', 'tour', 'tours', 'video', 'virtual', 'ambient',
  'sound', 'sounds', 'binaural', 'audio', 'talking', 'relaxing',
  'cinematic', 'live', 'full', 'hour', 'hours', 'minute', 'minutes',
  'day', 'night', 'rain', 'rainy', 'summer', 'winter', 'spring',
  'autumn', 'fall', 'best', 'beautiful', 'amazing', 'ultimate',
  'explore', 'discover', 'the', 'and', 'from', 'into', 'through',
  'with', 'near', 'around', 'toward', 'towards', 'city', 'route',
  'yürüyüş', 'turu', 'şehir', 'gece', 'yağmur', 'spaziergang',
  'stadtrundgang', 'rundgang', 'promenade', 'visite', 'ville',
  'paseo', 'recorrido', 'ciudad', 'passeio', 'cidade',
  'passeggiata', 'città', 'wandeling', 'stadswandeling',
  'spacer', 'wycieczka', 'promenad', 'stadsvandring'
]);

const GENERIC_LOCATION_WORDS = new Set([
  'street', 'road', 'avenue', 'boulevard', 'lane', 'drive', 'highway',
  'square', 'plaza', 'station', 'terminal', 'market', 'bazaar', 'mall',
  'park', 'garden', 'waterfront', 'promenade', 'pier', 'quay', 'harbor',
  'harbour', 'district', 'quarter', 'neighborhood', 'neighbourhood',
  'center', 'centre', 'downtown', 'old', 'town', 'bridge', 'beach',
  'port', 'airport', 'temple', 'church', 'cathedral', 'mosque', 'museum',
  'castle', 'palace', 'caddesi', 'cadde', 'sokak', 'sokağı', 'meydan',
  'meydanı', 'çarşı', 'çarşısı', 'mahallesi', 'mahalle'
]);

const ROAD_WORDS = new Set([
  'street', 'road', 'avenue', 'boulevard', 'lane', 'drive', 'highway',
  'motorway', 'way', 'alley', 'caddesi', 'cadde', 'sokak', 'sokağı',
  'strasse', 'straße', 'platz', 'rue', 'via', 'calle', 'avenida'
]);

const AREA_WORDS = new Set([
  'district', 'quarter', 'neighborhood', 'neighbourhood', 'borough',
  'downtown', 'center', 'centre', 'old town', 'mahallesi', 'mahalle'
]);

const DESCRIPTOR_GROUPS = [
  new Set([
    'street', 'road', 'avenue', 'boulevard', 'lane', 'drive', 'highway',
    'way', 'caddesi', 'cadde', 'sokak', 'sokağı', 'strasse', 'straße',
    'rue', 'via', 'calle', 'avenida'
  ]),
  new Set(['square', 'plaza', 'meydan', 'meydanı', 'platz']),
  new Set(['station', 'terminal', 'airport']),
  new Set(['market', 'bazaar', 'çarşı', 'çarşısı', 'mall']),
  new Set([
    'waterfront', 'promenade', 'pier', 'quay', 'harbor', 'harbour', 'port'
  ]),
  new Set([
    'district', 'quarter', 'neighborhood', 'neighbourhood', 'borough',
    'mahallesi', 'mahalle'
  ]),
  new Set(['park', 'garden']),
  new Set(['temple', 'church', 'cathedral', 'mosque']),
  new Set(['castle', 'palace'])
];

function parseArguments(argv) {
  const args = {
    inputPath: DEFAULT_INPUT_PATH,
    reportPath: DEFAULT_REPORT_PATH,
    cachePath: DEFAULT_CACHE_PATH,
    attributionPath: DEFAULT_ATTRIBUTION_PATH,
    backupPath: DEFAULT_BACKUP_PATH,
    duckdbCommand: 'duckdb',
    release: '',
    write: false,
    offline: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--write') {
      args.write = true;
    } else if (value === '--offline') {
      args.offline = true;
    } else if (value === '--input' && argv[index + 1]) {
      args.inputPath = argv[++index];
    } else if (value === '--report' && argv[index + 1]) {
      args.reportPath = argv[++index];
    } else if (value === '--cache' && argv[index + 1]) {
      args.cachePath = argv[++index];
    } else if (value === '--attribution' && argv[index + 1]) {
      args.attributionPath = argv[++index];
    } else if (value === '--backup' && argv[index + 1]) {
      args.backupPath = argv[++index];
    } else if (value === '--duckdb' && argv[index + 1]) {
      args.duckdbCommand = argv[++index];
    } else if (value === '--release' && argv[index + 1]) {
      args.release = argv[++index];
    }
  }

  return args;
}

function cleanText(value = '') {
  return String(value)
    .normalize('NFKC')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeText(value = '') {
  return cleanText(value)
    .toLocaleLowerCase('en')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function hashValue(value) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(value))
    .digest('hex');
}

function roundCoordinate(value, digits = 6) {
  const multiplier = 10 ** digits;
  return Math.round(Number(value) * multiplier) / multiplier;
}

function parseJson(value, fallback) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value === 'object') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJsonAtomic(filePath, value) {
  const directory = path.dirname(filePath);
  const temporaryPath = `${filePath}.tmp`;

  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    temporaryPath,
    `${JSON.stringify(value, null, 2)}\n`,
    'utf8'
  );
  fs.renameSync(temporaryPath, filePath);
}

function loadVideos(inputPath) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file was not found: ${inputPath}`);
  }

  const document = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

  const videos = Array.isArray(document)
    ? document
    : Array.isArray(document.videos)
      ? document.videos
      : Array.isArray(document.items)
        ? document.items
        : [];

  if (!videos.length) {
    throw new Error(`No videos were found in ${inputPath}`);
  }

  return { document, videos };
}

function rebuildVideoDocument(document, videos) {
  if (Array.isArray(document)) {
    return videos;
  }

  if (Array.isArray(document.videos)) {
    return { ...document, videos };
  }

  return { ...document, items: videos };
}

function countryCodeForName(value = '') {
  const normalized = normalizeText(value);

  if (!normalized) {
    return '';
  }

  const alias = COUNTRY_CODE_ALIASES.get(normalized);

  if (alias) {
    return alias;
  }

  let displayNames;

  try {
    displayNames = new Intl.DisplayNames(['en'], {
      type: 'region'
    });
  } catch {
    return '';
  }

  for (let first = 65; first <= 90; first += 1) {
    for (let second = 65; second <= 90; second += 1) {
      const code = String.fromCharCode(first, second);
      const name = displayNames.of(code);

      if (
        name &&
        name !== code &&
        normalizeText(name) === normalized
      ) {
        return code;
      }
    }
  }

  return '';
}

function uniqueBy(values, keyBuilder) {
  const seen = new Set();

  return values.filter((value) => {
    const key = keyBuilder(value);

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function chunks(values, size) {
  const result = [];

  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }

  return result;
}

function runDuckDb(command, sql) {
  const result = spawnSync(
    command,
    ['-json', '-c', sql],
    {
      encoding: 'utf8',
      windowsHide: true,
      maxBuffer: DUCKDB_MAX_BUFFER
    }
  );

  if (result.error) {
    throw new Error(
      `DuckDB could not start: ${result.error.message}`
    );
  }

  if (result.status !== 0) {
    const errorText = cleanText(
      result.stderr || result.stdout
    ).slice(0, 1_000);

    throw new Error(`DuckDB query failed: ${errorText}`);
  }

  const output = String(result.stdout || '').trim();

  if (!output) {
    return [];
  }

  try {
    const parsed = JSON.parse(output);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    throw new Error(
      `DuckDB returned invalid JSON: ${output.slice(0, 500)}`
    );
  }
}

function duckDbPreamble() {
  return [
    'LOAD httpfs;',
    "SET s3_region='us-west-2';",
    'SET enable_progress_bar=false;',
    'SET threads=4;'
  ].join('\n');
}

function ensureDuckDb(command) {
  const version = spawnSync(
    command,
    ['--version'],
    {
      encoding: 'utf8',
      windowsHide: true
    }
  );

  if (version.error || version.status !== 0) {
    throw new Error(
      'DuckDB CLI was not found. Install it and restart the terminal.'
    );
  }

  runDuckDb(
    command,
    'INSTALL httpfs; LOAD httpfs; SELECT 1 AS ready;'
  );
}

async function resolveLatestRelease(
  requestedRelease,
  cache,
  offline
) {
  if (requestedRelease) {
    return requestedRelease;
  }

  if (offline) {
    if (!cache.release) {
      throw new Error(
        'No cached Overture release is available for offline mode.'
      );
    }

    return cache.release;
  }

  try {
    const response = await fetch(STAC_CATALOG_URL, {
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const catalog = await response.json();

    if (!catalog.latest) {
      throw new Error(
        'The STAC catalog did not include a latest release.'
      );
    }

    return cleanText(catalog.latest);
  } catch (error) {
    if (cache.release) {
      console.error(
        `STAC lookup failed; cached release ${cache.release} will be used.`
      );

      return cache.release;
    }

    throw new Error(
      `Could not resolve the latest Overture release: ${
        error.message || error
      }`
    );
  }
}

function releasePath(release, theme, type) {
  return [
    OVERTURE_S3_ROOT,
    release,
    `theme=${theme}`,
    `type=${type}`,
    '*'
  ].join('/');
}

function createCache(existing = {}) {
  return {
    version: ENGINE_VERSION,
    provider: 'overture',
    release: existing.release || '',
    updatedAt: existing.updatedAt || '',
    cities: existing.cities || {},
    routes: existing.routes || {},
    hotels: existing.hotels || {}
  };
}

function pruneCache(cache, release) {
  for (const bucketName of ['cities', 'routes', 'hotels']) {
    cache[bucketName] = Object.fromEntries(
      Object.entries(cache[bucketName] || {}).filter(
        ([key]) => key.startsWith(`${release}:`)
      )
    );
  }

  cache.release = release;
}

function cityKey(city, countryCode) {
  return `${countryCode}:${normalizeText(city)}`;
}

function cityCacheKey(release, descriptor) {
  return `${release}:${cityKey(
    descriptor.city,
    descriptor.countryCode
  )}`;
}

function routeCacheKey(
  release,
  descriptor,
  candidateName,
  kind
) {
  return [
    release,
    cityKey(descriptor.city, descriptor.countryCode),
    kind,
    normalizeText(candidateName)
  ].join(':');
}

function hotelCacheKey(release, anchor) {
  return [
    release,
    roundCoordinate(anchor.latitude, 4),
    roundCoordinate(anchor.longitude, 4)
  ].join(':');
}

function buildCityDescriptors(videos) {
  return uniqueBy(
    videos
      .map((video) => {
        const city = cleanText(video.city || '');
        const country = cleanText(video.country || '');
        const countryCode = countryCodeForName(country);

        return city && countryCode
          ? {
              city,
              country,
              countryCode
            }
          : null;
      })
      .filter(Boolean),
    (descriptor) => cityKey(
      descriptor.city,
      descriptor.countryCode
    )
  );
}

function flattenStrings(value, output = []) {
  if (typeof value === 'string') {
    const text = cleanText(value);

    if (text) {
      output.push(text);
    }
  } else if (Array.isArray(value)) {
    for (const item of value) {
      flattenStrings(item, output);
    }
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) {
      flattenStrings(item, output);
    }
  }

  return output;
}

function flattenNameValues(primary, namesJson) {
  return uniqueBy(
    [
      cleanText(primary || ''),
      ...flattenStrings(parseJson(namesJson, {}))
    ].filter(Boolean),
    normalizeText
  );
}

function chooseCityResult(rows, descriptor) {
  const target = normalizeText(descriptor.city);

  return rows
    .filter(
      (row) => row.country === descriptor.countryCode
    )
    .map((row) => {
      const allNames = flattenNameValues(
        row.name,
        row.names_json
      );

      const exact = allNames.some(
        (name) => normalizeText(name) === target
      );

      const population = Number(row.population || 0);

      const subtypeScore =
        row.subtype === 'locality'
          ? 2
          : row.subtype === 'borough'
            ? 1
            : 0;

      return {
        row,
        exact,
        population,
        subtypeScore
      };
    })
    .filter((candidate) => candidate.exact)
    .sort(
      (left, right) =>
        right.subtypeScore - left.subtypeScore ||
        right.population - left.population
    )[0]?.row || null;
}

function queryCityContexts(
  command,
  release,
  descriptors
) {
  const results = new Map();

  for (const batch of chunks(
    descriptors,
    CITY_SEARCH_BATCH_SIZE
  )) {
    const conditions = batch.map((descriptor) => {
      const cityName = cleanText(
        descriptor.city
      ).toLocaleLowerCase('en');

      return `(
        country = ${sqlLiteral(descriptor.countryCode)}
        AND lower(CAST(names AS VARCHAR))
          LIKE ${sqlLiteral(`%${cityName}%`)}
      )`;
    });

    const sql = `${duckDbPreamble()}
      SELECT
        id,
        names.primary AS name,
        CAST(names AS JSON) AS names_json,
        country,
        subtype,
        region,
        population,
        bbox.xmin AS longitude,
        bbox.ymin AS latitude
      FROM read_parquet(
        ${sqlLiteral(
          releasePath(
            release,
            'divisions',
            'division'
          )
        )},
        filename=true,
        hive_partitioning=1
      )
      WHERE subtype IN ('locality', 'borough')
        AND bbox.xmin IS NOT NULL
        AND (${conditions.join(' OR ')})
      LIMIT ${MAX_QUERY_ROWS};`;

    const rows = runDuckDb(command, sql);

    for (const descriptor of batch) {
      const selected = chooseCityResult(
        rows,
        descriptor
      );

      results.set(
        cityKey(
          descriptor.city,
          descriptor.countryCode
        ),
        selected
      );
    }
  }

  return results;
}

function cityContextFromRow(
  row,
  descriptor,
  release,
  timestamp
) {
  if (!row) {
    return null;
  }

  const latitude = Number(row.latitude);
  const longitude = Number(row.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return {
    id: cleanText(row.id || ''),
    city: descriptor.city,
    country: descriptor.country,
    countryCode: descriptor.countryCode,
    canonicalName: cleanText(
      row.name || descriptor.city
    ),
    subtype: cleanText(
      row.subtype || 'locality'
    ),
    region: cleanText(row.region || ''),
    latitude,
    longitude,
    population: Number(row.population || 0),
    source: 'overture-divisions',
    release,
    verified: true,
    updatedAt: timestamp
  };
}

function tokenSet(value) {
  return new Set(
    normalizeText(value)
      .split(' ')
      .filter(Boolean)
  );
}

function distinctiveTokens(value) {
  return [...tokenSet(value)].filter(
    (token) =>
      token.length > 2 &&
      !LOCATION_NOISE_WORDS.has(token) &&
      !GENERIC_LOCATION_WORDS.has(token)
  );
}

function originalSearchTerms(value) {
  const original = cleanText(value)
    .toLocaleLowerCase('en')
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 2);

  return uniqueBy(
    [
      ...distinctiveTokens(value),
      ...original
    ],
    normalizeText
  )
    .filter(
      (token) =>
        !LOCATION_NOISE_WORDS.has(
          normalizeText(token)
        )
    )
    .slice(0, 4);
}

function classifyCandidate(value) {
  const normalized = normalizeText(value);
  const words = normalized.split(' ');

  if (
    [...ROAD_WORDS].some(
      (word) => words.includes(normalizeText(word))
    )
  ) {
    return 'road';
  }

  if (
    [...AREA_WORDS].some(
      (word) => normalized.includes(normalizeText(word))
    )
  ) {
    return 'area';
  }

  return 'place';
}

function titleCandidates(video) {
  const cityTokens = tokenSet(
    `${video.city || ''} ${video.country || ''}`
  );

  const title = cleanText(video.title || '');

  const segments = title.split(
    /\s+[\-–—]\s+|[|•·:]/u
  );

  const candidates = segments.map((segment) => {
    const cleaned = segment
      .replace(
        /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu,
        ' '
      )
      .replace(
        /\[(?:[^\]]*(?:4k|8k|hdr|fps|uhd)[^\]]*)\]/giu,
        ' '
      )
      .replace(/\b(?:19|20)\d{2}\b/g, ' ');

    return cleanText(
      normalizeText(cleaned)
        .split(' ')
        .filter(
          (token) =>
            token.length > 1 &&
            !LOCATION_NOISE_WORDS.has(token) &&
            !cityTokens.has(token)
        )
        .join(' ')
    );
  });

  return uniqueBy(candidates, normalizeText)
    .filter(
      (candidate) =>
        distinctiveTokens(candidate).length > 0
    )
    .slice(0, 2);
}

function buildCandidatesForVideo(video) {
  const routePoints = Array.isArray(
    video.routePoints
  )
    ? video.routePoints
    : [];

  const existing = routePoints
    .map((point, index) => ({
      key: `route:${index}`,
      kind: 'route',
      index,
      name: cleanText(point.name || ''),
      point,
      classification: classifyCandidate(
        point.name || ''
      )
    }))
    .filter(
      (candidate) =>
        candidate.name &&
        distinctiveTokens(candidate.name).length > 0
    );

  const title = titleCandidates(video).map(
    (name, index) => ({
      key: `title:${index}`,
      kind: 'title',
      index,
      name,
      point: {
        name,
        type: 'title-place',
        source: 'video-title',
        verified: false
      },
      classification: classifyCandidate(name)
    })
  );

  return [...existing, ...title];
}

function boundsAround(
  latitude,
  longitude,
  radiusKm
) {
  const latitudeDelta = radiusKm / 110.574;

  const cosine = Math.max(
    0.1,
    Math.cos(latitude * Math.PI / 180)
  );

  const longitudeDelta =
    radiusKm / (111.32 * cosine);

  return {
    west: longitude - longitudeDelta,
    south: latitude - latitudeDelta,
    east: longitude + longitudeDelta,
    north: latitude + latitudeDelta
  };
}

function boundsForAnchors(anchors, paddingKm) {
  const latitudes = anchors.map(
    (anchor) => anchor.latitude
  );

  const longitudes = anchors.map(
    (anchor) => anchor.longitude
  );

  const averageLatitude =
    latitudes.reduce(
      (sum, value) => sum + value,
      0
    ) / latitudes.length;

  const latitudePadding =
    paddingKm / 110.574;

  const cosine = Math.max(
    0.1,
    Math.cos(averageLatitude * Math.PI / 180)
  );

  const longitudePadding =
    paddingKm / (111.32 * cosine);

  return {
    west:
      Math.min(...longitudes) -
      longitudePadding,
    south:
      Math.min(...latitudes) -
      latitudePadding,
    east:
      Math.max(...longitudes) +
      longitudePadding,
    north:
      Math.max(...latitudes) +
      latitudePadding
  };
}

function bboxCondition(
  bounds,
  pointGeometry = false
) {
  if (pointGeometry) {
    return `
      bbox.xmin BETWEEN ${bounds.west}
        AND ${bounds.east}
      AND bbox.ymin BETWEEN ${bounds.south}
        AND ${bounds.north}
    `;
  }

  return `
    bbox.xmax >= ${bounds.west}
    AND bbox.xmin <= ${bounds.east}
    AND bbox.ymax >= ${bounds.south}
    AND bbox.ymin <= ${bounds.north}
  `;
}

function nameSearchCondition(terms) {
  return terms
    .map(
      (term) =>
        `lower(CAST(names AS VARCHAR)) LIKE ${
          sqlLiteral(
            `%${cleanText(term).toLocaleLowerCase('en')}%`
          )
        }`
    )
    .join(' OR ');
}

function detectPlaceSchema(command, release) {
  const sql = `${duckDbPreamble()}
    DESCRIBE SELECT *
    FROM read_parquet(
      ${sqlLiteral(
        releasePath(
          release,
          'places',
          'place'
        )
      )},
      filename=true,
      hive_partitioning=1
    );`;

  const columns = new Set(
    runDuckDb(command, sql).map(
      (row) =>
        cleanText(
          row.column_name || row.name || ''
        )
    )
  );

  if (
    !columns.has('names') ||
    !columns.has('bbox')
  ) {
    throw new Error(
      'The Overture Places schema is missing required names or bbox fields.'
    );
  }

  return {
    basicCategory:
      columns.has('basic_category'),
    taxonomy:
      columns.has('taxonomy'),
    categories:
      columns.has('categories')
  };
}

function placeCategoryExpression(placeSchema) {
  const fields = [];

  if (placeSchema.basicCategory) {
    fields.push('basic_category');
  }

  if (placeSchema.taxonomy) {
    fields.push('taxonomy.primary');
  }

  if (placeSchema.categories) {
    fields.push('categories.primary');
  }

  if (!fields.length) {
    return 'NULL::VARCHAR';
  }

  return fields.length === 1
    ? fields[0]
    : `COALESCE(${fields.join(', ')})`;
}

function hotelCategoryCondition(placeSchema) {
  const conditions = [];

  if (placeSchema.basicCategory) {
    conditions.push(
      "basic_category = 'hotel'"
    );
  }

  if (placeSchema.taxonomy) {
    conditions.push(
      "taxonomy.primary IN ('hotel', 'resort_hotel', 'boutique_hotel')"
    );

    conditions.push(
      "list_contains(taxonomy.hierarchy, 'hotel')"
    );
  }

  if (placeSchema.categories) {
    conditions.push(
      "categories.primary IN ('hotel', 'resort_hotel', 'boutique_hotel')"
    );
  }

  if (!conditions.length) {
    throw new Error(
      'The Overture Places schema has no supported category field.'
    );
  }

  return `(${conditions.join(' OR ')})`;
}

function commonRecordSelect(
  source,
  placeSchema
) {
  const confidence =
    source === 'places'
      ? 'confidence'
      : 'NULL::DOUBLE';

  const category =
    source === 'places'
      ? placeCategoryExpression(placeSchema)
      : 'subtype';

  return `
    id,
    names.primary AS name,
    CAST(names AS JSON) AS names_json,
    bbox.xmin +
      ((bbox.xmax - bbox.xmin) / 2)
      AS longitude,
    bbox.ymin +
      ((bbox.ymax - bbox.ymin) / 2)
      AS latitude,
    ${confidence} AS confidence,
    ${category} AS category,
    ${sqlLiteral(source)} AS record_source
  `;
}

function queryCandidateRecords(
  command,
  release,
  context,
  candidates,
  placeSchema
) {
  const terms = uniqueBy(
    candidates.flatMap(
      (candidate) =>
        originalSearchTerms(candidate.name)
    ),
    (value) =>
      cleanText(value).toLocaleLowerCase('en')
  ).slice(0, 100);

  if (!terms.length) {
    return [];
  }

  const bounds = boundsAround(
    context.latitude,
    context.longitude,
    ROUTE_SEARCH_RADIUS_KM
  );

  const nameCondition =
    nameSearchCondition(terms);

  const records = [];

  const placeSql = `${duckDbPreamble()}
    SELECT ${commonRecordSelect(
      'places',
      placeSchema
    )}
    FROM read_parquet(
      ${sqlLiteral(
        releasePath(
          release,
          'places',
          'place'
        )
      )},
      filename=true,
      hive_partitioning=1
    )
    WHERE ${bboxCondition(bounds, true)}
      AND names.primary IS NOT NULL
      AND COALESCE(
        operating_status,
        'open'
      ) <> 'permanently_closed'
      AND COALESCE(
        confidence,
        0.7
      ) >= ${MIN_PLACE_CONFIDENCE}
      AND (${nameCondition})
    LIMIT ${MAX_QUERY_ROWS};`;

  records.push(
    ...runDuckDb(command, placeSql)
  );

  const divisionSql = `${duckDbPreamble()}
    SELECT ${commonRecordSelect(
      'divisions',
      placeSchema
    )}
    FROM read_parquet(
      ${sqlLiteral(
        releasePath(
          release,
          'divisions',
          'division'
        )
      )},
      filename=true,
      hive_partitioning=1
    )
    WHERE ${bboxCondition(bounds, true)}
      AND country = ${
        sqlLiteral(context.countryCode)
      }
      AND subtype IN (
        'locality',
        'borough',
        'neighborhood',
        'microhood'
      )
      AND names.primary IS NOT NULL
      AND (${nameCondition})
    LIMIT ${MAX_QUERY_ROWS};`;

  records.push(
    ...runDuckDb(command, divisionSql)
  );

  const hasRoadCandidates = candidates.some(
    (candidate) =>
      candidate.classification === 'road'
  );

  if (hasRoadCandidates) {
    const roadTerms = uniqueBy(
      candidates
        .filter(
          (candidate) =>
            candidate.classification === 'road'
        )
        .flatMap(
          (candidate) =>
            originalSearchTerms(candidate.name)
        ),
      (value) =>
        cleanText(value).toLocaleLowerCase('en')
    );

    if (roadTerms.length) {
      const transportationSql =
        `${duckDbPreamble()}
          SELECT ${commonRecordSelect(
            'transportation',
            placeSchema
          )}
          FROM read_parquet(
            ${sqlLiteral(
              releasePath(
                release,
                'transportation',
                'segment'
              )
            )},
            filename=true,
            hive_partitioning=1
          )
          WHERE ${
            bboxCondition(bounds, false)
          }
            AND names IS NOT NULL
            AND (${
              nameSearchCondition(roadTerms)
            })
          LIMIT ${MAX_QUERY_ROWS};`;

      records.push(
        ...runDuckDb(
          command,
          transportationSql
        )
      );
    }
  }

  return records;
}

function haversineMeters(left, right) {
  const toRadians = (degrees) =>
    degrees * Math.PI / 180;

  const latitudeDelta = toRadians(
    right.latitude - left.latitude
  );

  const longitudeDelta = toRadians(
    right.longitude - left.longitude
  );

  const latitude1 =
    toRadians(left.latitude);

  const latitude2 =
    toRadians(right.latitude);

  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitude1) *
      Math.cos(latitude2) *
      Math.sin(longitudeDelta / 2) ** 2;

  return Math.round(
    6_371_000 *
      2 *
      Math.atan2(
        Math.sqrt(value),
        Math.sqrt(1 - value)
      )
  );
}

function jaccardScore(left, right) {
  const leftTokens = tokenSet(left);
  const rightTokens = tokenSet(right);

  if (
    !leftTokens.size ||
    !rightTokens.size
  ) {
    return 0;
  }

  let intersection = 0;

  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      intersection += 1;
    }
  }

  const union = new Set([
    ...leftTokens,
    ...rightTokens
  ]).size;

  return union
    ? intersection / union
    : 0;
}

function descriptorScore(
  candidateName,
  recordName
) {
  const candidateTokens =
    tokenSet(candidateName);

  const recordTokens =
    tokenSet(recordName);

  const applicableGroups =
    DESCRIPTOR_GROUPS.filter(
      (group) =>
        [...group].some(
          (word) =>
            candidateTokens.has(
              normalizeText(word)
            )
        )
    );

  if (!applicableGroups.length) {
    return 1;
  }

  return applicableGroups.some(
    (group) =>
      [...group].some(
        (word) =>
          recordTokens.has(
            normalizeText(word)
          )
      )
  )
    ? 1
    : 0;
}

function recordSourcePreference(
  classification,
  recordSource
) {
  if (classification === 'road') {
    return recordSource === 'transportation'
      ? 1
      : 0;
  }

  if (classification === 'area') {
    return recordSource === 'divisions'
      ? 1
      : 0.3;
  }

  return recordSource === 'places'
    ? 1
    : 0.2;
}

function scoreRecord(
  candidate,
  record,
  context
) {
  const latitude = Number(record.latitude);
  const longitude = Number(record.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  const candidateTokens =
    distinctiveTokens(candidate.name);

  if (!candidateTokens.length) {
    return null;
  }

  const names = flattenNameValues(
    record.name,
    record.names_json
  );

  let best = null;

  for (const name of names) {
    const nameTokens = tokenSet(name);

    const matched =
      candidateTokens.filter(
        (token) => nameTokens.has(token)
      ).length;

    const coverage =
      matched / candidateTokens.length;

    if (coverage < 0.6) {
      continue;
    }

    const descriptor = descriptorScore(
      candidate.name,
      name
    );

    const jaccard = jaccardScore(
      candidate.name,
      name
    );

    const confidence =
      Number.isFinite(
        Number(record.confidence)
      )
        ? Number(record.confidence)
        : 0.7;

    const distance = haversineMeters(
      context,
      {
        latitude,
        longitude
      }
    );

    const distanceScore = Math.max(
      0,
      1 -
        distance /
          (ROUTE_SEARCH_RADIUS_KM * 1_000)
    );

    const preference =
      recordSourcePreference(
        candidate.classification,
        record.record_source
      );

    const score =
      coverage * 0.56 +
      jaccard * 0.14 +
      descriptor * 0.08 +
      confidence * 0.1 +
      distanceScore * 0.04 +
      preference * 0.08;

    if (!best || score > best.score) {
      best = {
        record,
        name,
        score,
        distance,
        confidence
      };
    }
  }

  return best;
}

function chooseRecord(
  candidate,
  records,
  context
) {
  const threshold =
    candidate.kind === 'title'
      ? MIN_TITLE_MATCH_SCORE
      : MIN_ROUTE_MATCH_SCORE;

  return records
    .map(
      (record) =>
        scoreRecord(
          candidate,
          record,
          context
        )
    )
    .filter(
      (result) =>
        result &&
        result.score >= threshold
    )
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.distance - right.distance
    )[0] || null;
}

function applyRecordToPoint(
  candidate,
  match,
  release,
  timestamp
) {
  const record = match.record;
  const latitude = Number(record.latitude);
  const longitude = Number(record.longitude);

  const sourceName =
    `overture-${record.record_source}`;

  return {
    ...candidate.point,
    name:
      candidate.point.name ||
      candidate.name,
    canonicalName: cleanText(
      match.name ||
      record.name ||
      candidate.name
    ),
    verified:
      candidate.kind === 'title'
        ? true
        : candidate.point.verified === true,
    sourceVerified:
      candidate.kind === 'title' ||
      candidate.point.verified === true ||
      candidate.point.source ===
        'youtube-description',
    geoVerified: true,
    geoSource: sourceName,
    overtureId: cleanText(record.id || ''),
    overtureRelease: release,
    latitude,
    longitude,
    placeCategory: cleanText(
      record.category || ''
    ),
    geoConfidence:
      Math.round(match.score * 1_000) /
      1_000,
    overtureConfidence:
      Number.isFinite(
        Number(record.confidence)
      )
        ? Number(record.confidence)
        : null,
    updatedAt: timestamp
  };
}

function markUnresolvedPoint(
  point,
  timestamp
) {
  if (
    !point ||
    point.source !== 'youtube-description'
  ) {
    return point;
  }

  return {
    ...point,
    sourceVerified: true,
    geoVerified: false,
    updatedAt: timestamp
  };
}

function parseAddress(addressesJson) {
  const addresses = parseJson(
    addressesJson,
    []
  );

  const first = Array.isArray(addresses)
    ? addresses[0]
    : null;

  if (
    !first ||
    typeof first !== 'object'
  ) {
    return '';
  }

  return uniqueBy(
    [
      first.freeform,
      first.locality,
      first.region,
      first.postcode,
      first.country
    ]
      .map(cleanText)
      .filter(Boolean),
    normalizeText
  ).join(', ');
}

function sourceDatasets(sourcesJson) {
  const sources = parseJson(
    sourcesJson,
    []
  );

  if (!Array.isArray(sources)) {
    return [];
  }

  return uniqueBy(
    sources
      .map(
        (source) =>
          cleanText(
            source?.dataset ||
            source?.provider ||
            ''
          )
      )
      .filter(Boolean),
    normalizeText
  );
}

function queryHotels(
  command,
  release,
  anchors,
  placeSchema
) {
  const bounds = boundsForAnchors(
    anchors,
    HOTEL_QUERY_PADDING_KM
  );

  const sql = `${duckDbPreamble()}
    SELECT
      id,
      names.primary AS name,
      CAST(names AS JSON) AS names_json,
      bbox.xmin AS longitude,
      bbox.ymin AS latitude,
      confidence,
      ${
        placeCategoryExpression(placeSchema)
      } AS category,
      CAST(addresses AS JSON)
        AS addresses_json,
      CAST(sources AS JSON)
        AS sources_json
    FROM read_parquet(
      ${sqlLiteral(
        releasePath(
          release,
          'places',
          'place'
        )
      )},
      filename=true,
      hive_partitioning=1
    )
    WHERE ${bboxCondition(bounds, true)}
      AND names.primary IS NOT NULL
      AND COALESCE(
        operating_status,
        'open'
      ) <> 'permanently_closed'
      AND COALESCE(
        confidence,
        0.7
      ) >= ${MIN_HOTEL_CONFIDENCE}
      AND ${
        hotelCategoryCondition(placeSchema)
      }
    LIMIT ${MAX_QUERY_ROWS};`;

  return runDuckDb(command, sql);
}

function hotelsNearAnchor(
  records,
  anchor,
  release,
  timestamp
) {
  const hotels = records
    .map((record) => {
      const latitude =
        Number(record.latitude);

      const longitude =
        Number(record.longitude);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        return null;
      }

      const names = flattenNameValues(
        record.name,
        record.names_json
      );

      const name = cleanText(
        record.name ||
        names[0] ||
        ''
      );

      if (!name) {
        return null;
      }

      const distanceMeters =
        haversineMeters(
          anchor,
          {
            latitude,
            longitude
          }
        );

      if (
        distanceMeters >
        HOTEL_SEARCH_RADIUS_METERS
      ) {
        return null;
      }

      return {
        id: cleanText(record.id || ''),
        name,
        distanceMeters,
        distanceType: 'straight-line',
        address: parseAddress(
          record.addresses_json
        ),
        latitude,
        longitude,
        verified: true,
        source: 'overture-places',
        sourceDatasets: sourceDatasets(
          record.sources_json
        ),
        confidence:
          Number.isFinite(
            Number(record.confidence)
          )
            ? Number(record.confidence)
            : 0.7,
        overtureRelease: release,
        updatedAt: timestamp
      };
    })
    .filter(Boolean);

  return uniqueBy(
    hotels,
    (hotel) =>
      hotel.id ||
      [
        normalizeText(hotel.name),
        hotel.latitude,
        hotel.longitude
      ].join(':')
  )
    .sort(
      (left, right) =>
        left.distanceMeters -
          right.distanceMeters ||
        right.confidence -
          left.confidence
    )
    .slice(0, 30);
}

function mergeHotels(existing, generated) {
  const preserved = (
    Array.isArray(existing)
      ? existing
      : []
  ).filter(
    (hotel) =>
      hotel?.source !==
        'overture-places' &&
      hotel?.source !==
        'geoapify-places'
  );

  return [
    ...preserved,
    ...generated
  ];
}

function createAttributionManifest(
  release,
  timestamp,
  themesUsed
) {
  const themes = {};

  if (themesUsed.has('places')) {
    themes.places = {
      source: 'Overture Maps Places',
      licenses: [
        'CDLA-Permissive-2.0',
        'Apache-2.0',
        'CC0-1.0'
      ],
      notices: [
        'Foursquare data is available under Apache-2.0 and includes a NOTICE file.'
      ]
    };
  }

  if (themesUsed.has('divisions')) {
    themes.divisions = {
      source: 'Overture Maps Divisions',
      license: 'ODbL-1.0',
      attribution:
        '© OpenStreetMap contributors, Overture Maps Foundation'
    };
  }

  if (themesUsed.has('transportation')) {
    themes.transportation = {
      source:
        'Overture Maps Transportation',
      license: 'ODbL-1.0',
      attribution:
        '© OpenStreetMap contributors, Overture Maps Foundation'
    };
  }

  return {
    generatedAt: timestamp,
    provider:
      'Overture Maps Foundation',
    release,
    themes,
    links: {
      attribution:
        'https://docs.overturemaps.org/attribution/',
      cdlaPermissive20:
        'https://cdla.dev/permissive-2-0/',
      apache20:
        'https://www.apache.org/licenses/LICENSE-2.0',
      odbl10:
        'https://opendatacommons.org/licenses/odbl/1-0/'
    }
  };
}

function createCounters() {
  return {
    cityContextsVerified: 0,
    cityContextsUnresolved: 0,
    routePointsGeoVerified: 0,
    routePointsGeoUnresolved: 0,
    titlePlacesGeoVerified: 0,
    videosWithGeoAnchor: 0,
    videosWithNearbyHotels: 0,
    hotelsVerified: 0,
    cacheHits: 0,
    duckDbQueries: 0
  };
}

async function main() {
  const args = parseArguments(
    process.argv.slice(2)
  );

  const {
    document,
    videos
  } = loadVideos(args.inputPath);

  const cache = createCache(
    readJson(args.cachePath, {})
  );

  const release =
    await resolveLatestRelease(
      args.release,
      cache,
      args.offline
    );

  pruneCache(cache, release);

  if (!args.offline) {
    ensureDuckDb(args.duckdbCommand);
  }

  const placeSchema = args.offline
    ? null
    : detectPlaceSchema(
        args.duckdbCommand,
        release
      );

  const timestamp =
    new Date().toISOString();

  const counters = createCounters();

  const themesUsed = new Set([
    'places',
    'divisions'
  ]);

  const descriptors =
    buildCityDescriptors(videos);

  const contexts = new Map();
  const missingDescriptors = [];

  for (const descriptor of descriptors) {
    const key = cityCacheKey(
      release,
      descriptor
    );

    if (
      Object.hasOwn(
        cache.cities,
        key
      )
    ) {
      contexts.set(
        cityKey(
          descriptor.city,
          descriptor.countryCode
        ),
        cache.cities[key]
      );

      counters.cacheHits += 1;
    } else {
      missingDescriptors.push(
        descriptor
      );
    }
  }

  if (
    !args.offline &&
    missingDescriptors.length
  ) {
    const queried =
      queryCityContexts(
        args.duckdbCommand,
        release,
        missingDescriptors
      );

    counters.duckDbQueries +=
      Math.ceil(
        missingDescriptors.length /
        CITY_SEARCH_BATCH_SIZE
      );

    for (
      const descriptor
      of missingDescriptors
    ) {
      const row = queried.get(
        cityKey(
          descriptor.city,
          descriptor.countryCode
        )
      );

      const context =
        cityContextFromRow(
          row,
          descriptor,
          release,
          timestamp
        );

      const key = cityCacheKey(
        release,
        descriptor
      );

      cache.cities[key] = context;

      contexts.set(
        cityKey(
          descriptor.city,
          descriptor.countryCode
        ),
        context
      );
    }
  }

  for (const descriptor of descriptors) {
    const context = contexts.get(
      cityKey(
        descriptor.city,
        descriptor.countryCode
      )
    );

    if (context) {
      counters.cityContextsVerified += 1;
    } else {
      counters.cityContextsUnresolved += 1;
    }
  }

  const videosByCity = new Map();

  for (const video of videos) {
    const countryCode =
      countryCodeForName(
        video.country || ''
      );

    const key = cityKey(
      video.city || '',
      countryCode
    );

    if (!videosByCity.has(key)) {
      videosByCity.set(key, []);
    }

    videosByCity.get(key).push(video);
  }

  const enrichedById = new Map();

  for (
    const [key, cityVideos]
    of videosByCity
  ) {
    const context = contexts.get(key);

    if (!context) {
      for (const video of cityVideos) {
        enrichedById.set(
          video.id,
          video
        );
      }

      continue;
    }

    const candidateEntries =
      cityVideos.map((video) => ({
        video,
        candidates:
          buildCandidatesForVideo(video)
      }));

    const uncachedCandidates = [];
    const matches = new Map();

    for (
      const entry
      of candidateEntries
    ) {
      for (
        const candidate
        of entry.candidates
      ) {
        const cacheKey =
          routeCacheKey(
            release,
            context,
            candidate.name,
            candidate.kind
          );

        const matchKey =
          `${entry.video.id}:${candidate.key}`;

        if (
          Object.hasOwn(
            cache.routes,
            cacheKey
          )
        ) {
          matches.set(
            matchKey,
            cache.routes[cacheKey]
          );

          counters.cacheHits += 1;
        } else {
          uncachedCandidates.push({
            ...candidate,
            videoId: entry.video.id,
            cacheKey
          });
        }
      }
    }

    if (
      !args.offline &&
      uncachedCandidates.length
    ) {
      const records =
        queryCandidateRecords(
          args.duckdbCommand,
          release,
          context,
          uncachedCandidates,
          placeSchema
        );

      const hasRoadCandidates =
        uncachedCandidates.some(
          (candidate) =>
            candidate.classification ===
            'road'
        );

      counters.duckDbQueries +=
        hasRoadCandidates ? 3 : 2;

      if (hasRoadCandidates) {
        themesUsed.add(
          'transportation'
        );
      }

      for (
        const candidate
        of uncachedCandidates
      ) {
        const selected = chooseRecord(
          candidate,
          records,
          context
        );

        const stored = selected
          ? {
              record: selected.record,
              name: selected.name,
              score: selected.score,
              distance:
                selected.distance,
              confidence:
                selected.confidence
            }
          : null;

        cache.routes[
          candidate.cacheKey
        ] = stored;

        matches.set(
          `${candidate.videoId}:${candidate.key}`,
          stored
        );
      }
    }

    const pendingVideos = [];
    const anchors = [];

    for (
      const entry
      of candidateEntries
    ) {
      const routePoints =
        Array.isArray(
          entry.video.routePoints
        )
          ? entry.video.routePoints.map(
              (point) => ({ ...point })
            )
          : [];

      let anchor = null;

      const routeCandidates =
        entry.candidates.filter(
          (item) =>
            item.kind === 'route'
        );

      for (
        const candidate
        of routeCandidates
      ) {
        const stored = matches.get(
          `${entry.video.id}:${candidate.key}`
        );

        if (stored) {
          const point =
            applyRecordToPoint(
              candidate,
              stored,
              release,
              timestamp
            );

          routePoints[
            candidate.index
          ] = point;

          counters
            .routePointsGeoVerified += 1;

          if (!anchor) {
            anchor = point;
          }
        } else {
          routePoints[
            candidate.index
          ] = markUnresolvedPoint(
            routePoints[
              candidate.index
            ],
            timestamp
          );

          counters
            .routePointsGeoUnresolved += 1;
        }
      }

      if (!anchor) {
        const candidates =
          entry.candidates.filter(
            (item) =>
              item.kind === 'title'
          );

        for (
          const candidate
          of candidates
        ) {
          const stored = matches.get(
            `${entry.video.id}:${candidate.key}`
          );

          if (!stored) {
            continue;
          }

          const point =
            applyRecordToPoint(
              candidate,
              stored,
              release,
              timestamp
            );

          routePoints.push(point);
          anchor = point;

          counters
            .titlePlacesGeoVerified += 1;

          break;
        }
      }

      if (anchor) {
        anchors.push({
          videoId: entry.video.id,
          latitude: anchor.latitude,
          longitude: anchor.longitude,
          point: anchor
        });

        counters
          .videosWithGeoAnchor += 1;
      }

      pendingVideos.push({
        video: entry.video,
        routePoints,
        anchor
      });
    }

    const anchorsMissingHotels =
      anchors.filter((anchor) => {
        const cacheKey =
          hotelCacheKey(
            release,
            anchor
          );

        if (
          Object.hasOwn(
            cache.hotels,
            cacheKey
          )
        ) {
          counters.cacheHits += 1;
          return false;
        }

        return true;
      });

    if (
      !args.offline &&
      anchorsMissingHotels.length
    ) {
      const hotelRecords =
        queryHotels(
          args.duckdbCommand,
          release,
          anchorsMissingHotels,
          placeSchema
        );

      counters.duckDbQueries += 1;

      for (
        const anchor
        of anchorsMissingHotels
      ) {
        cache.hotels[
          hotelCacheKey(
            release,
            anchor
          )
        ] = hotelsNearAnchor(
          hotelRecords,
          anchor,
          release,
          timestamp
        );
      }
    }

    for (
      const pending
      of pendingVideos
    ) {
      const {
        video,
        routePoints,
        anchor
      } = pending;

      const nearbyHotels = anchor
        ? cache.hotels[
            hotelCacheKey(
              release,
              anchor
            )
          ] || []
        : [];

      if (nearbyHotels.length) {
        counters
          .videosWithNearbyHotels += 1;

        counters.hotelsVerified +=
          nearbyHotels.length;
      }

      const evidence = {
        ...(video.evidence || {}),
        version: Math.max(
          Number(
            video.evidence?.version || 0
          ),
          ENGINE_VERSION
        ),
        updatedAt: timestamp,
        sources: {
          ...(
            video.evidence?.sources ||
            {}
          ),
          overture: {
            verified: Boolean(anchor),
            release,
            fetchedAt: timestamp,
            cityContextVerified: true,
            routePointsVerified:
              routePoints.filter(
                (point) =>
                  point?.geoVerified ===
                  true
              ).length,
            nearbyHotelsVerified:
              nearbyHotels.length
          }
        }
      };

      enrichedById.set(
        video.id,
        {
          ...video,
          ...(anchor
            ? {
                geo: {
                  latitude:
                    anchor.latitude,
                  longitude:
                    anchor.longitude,
                  placeId:
                    anchor.overtureId,
                  precision:
                    'route-point',
                  source:
                    anchor.geoSource,
                  release,
                  verified: true,
                  updatedAt:
                    timestamp
                }
              }
            : {}),
          routePoints,
          nearbyHotels:
            mergeHotels(
              video.nearbyHotels,
              nearbyHotels
            ),
          evidence,
          updatedAt: timestamp
        }
      );
    }

    console.error(
      `Processed ${enrichedById.size}/${videos.length} videos`
    );
  }

  const enriched = videos.map(
    (video) =>
      enrichedById.get(video.id) ||
      video
  );

  cache.updatedAt = timestamp;

  writeJsonAtomic(
    args.cachePath,
    cache
  );

  writeJsonAtomic(
    args.attributionPath,
    createAttributionManifest(
      release,
      timestamp,
      themesUsed
    )
  );

  const report = {
    generatedAt: timestamp,
    mode: args.offline
      ? 'offline-cache'
      : 'overture-duckdb',
    writeRequested: args.write,
    inputPath: args.inputPath,
    release,
    videos: videos.length,
    noApiKey: true,
    noRequestQuota: true,
    ...counters
  };

  writeJsonAtomic(
    args.reportPath,
    report
  );

  if (args.write) {
    if (
      !fs.existsSync(
        args.backupPath
      )
    ) {
      fs.mkdirSync(
        path.dirname(
          args.backupPath
        ),
        {
          recursive: true
        }
      );

      fs.copyFileSync(
        args.inputPath,
        args.backupPath
      );
    }

    writeJsonAtomic(
      args.inputPath,
      rebuildVideoDocument(
        document,
        enriched
      )
    );
  }

  console.log(
    JSON.stringify(
      report,
      null,
      2
    )
  );

  console.log(
    args.write
      ? `Overture evidence written to ${args.inputPath}`
      : 'Dry run complete. Video data was not changed.'
  );
}

main().catch((error) => {
  console.error(
    'Overture enrichment failed:',
    error.message || error
  );

  process.exitCode = 1;
});
import { detectHotelLocation } from './locations.js';

const MAX_HOTELS = 10;
const MAX_DISTANCE = 3000;
const EARTH_RADIUS = 6371000;

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
];

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(scanPendingVideos(env));
  }
};

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0131/g, 'i')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function hasCorruptedLocation(location) {
  const values = [
    location.city,
    location.country,
    location.district,
    location.searchLocation
  ];

  return values.some(value =>
    /[\u00C3\u00C2\uFFFD\u00C6]/u.test(String(value || ''))
  );
}

function distanceMeters(a, b) {
  const toRad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * toRad;
  const dLon = (b.longitude - a.longitude) * toRad;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * toRad) *
    Math.cos(b.latitude * toRad) *
    Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS *
    Math.asin(Math.sqrt(Math.min(1, h)));
}

async function resolveCoordinates(db, location) {
  const key = normalize(location.searchLocation);

  const cached = await db.prepare(`
    SELECT latitude, longitude
    FROM hotel_location_cache
    WHERE location_key = ?1
  `).bind(key).first();

  if (cached) {
    const latitude = Number(cached.latitude);
    const longitude = Number(cached.longitude);

    if (Number.isFinite(latitude) && Math.abs(latitude) <= 90 &&
        Number.isFinite(longitude) && Math.abs(longitude) <= 180) {
      return { latitude, longitude };
    }

    return null;
  }

  const params = new URLSearchParams({
    q: location.searchLocation,
    format: 'json',
    addressdetails: '1',
    limit: '3'
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: {
        'User-Agent': 'OldTownsWalksHotelScanner/1.0 (https://oldtownswalks.com)',
        'Accept-Language': 'en'
      },
      signal: AbortSignal.timeout(15000)
    }
  );

  if (!response.ok) {
    throw new Error(`Geocoding HTTP ${response.status}`);
  }

  const results = await response.json();

  const expectedCountry = normalize(location.country);
  const countryAliases = {
    turkiye: ['turkey', 'turkiye']
  };

  const acceptedCountries = [
    expectedCountry,
    ...(countryAliases[expectedCountry] || [])
  ];

  const expectedPlace = normalize(
    location.district || location.city
  );

  if (!Array.isArray(results)) {
    throw new Error('Invalid geocoding response');
  }

  const matches = results.filter(result => {
    const address = result.address || {};
    const actualCountry = normalize(address.country);
    const displayName = ` ${normalize(result.display_name)} `;
    const includesPlace = place => displayName.includes(` ${normalize(place)} `);
    const latitude = Number(result.lat);
    const longitude = Number(result.lon);

    return acceptedCountries.includes(actualCountry) &&
      includesPlace(expectedPlace) &&
      includesPlace(location.city) &&
      Number.isFinite(latitude) && Math.abs(latitude) <= 90 &&
      Number.isFinite(longitude) && Math.abs(longitude) <= 180;
  });

  // Never select an arbitrary result when geocoding returns multiple locations.
  if (matches.length !== 1) {
    return null;
  }

  const match = matches[0];

  if (!match) {
    return null;
  }

  const coordinates = {
    latitude: Number(match.lat),
    longitude: Number(match.lon)
  };

  await db.prepare(`
    INSERT OR IGNORE INTO hotel_location_cache
      (location_key, latitude, longitude)
    VALUES (?1, ?2, ?3)
  `).bind(
    key,
    coordinates.latitude,
    coordinates.longitude
  ).run();

  return coordinates;
}

async function findExistingHotels(db, coordinates) {
  const latSpan = MAX_DISTANCE / 110574;

  const lonSpan = MAX_DISTANCE / (
    111320 * Math.max(
      0.001,
      Math.cos(coordinates.latitude * Math.PI / 180)
    )
  );

  const { results = [] } = await db.prepare(`
    SELECT id, canonical_name, latitude, longitude
    FROM hotels AS h
    WHERE h.active = 1
      AND EXISTS (
        SELECT 1 FROM video_hotels AS vh
        WHERE vh.hotel_id = h.id AND vh.active = 1 AND vh.verified = 1
      )
      AND latitude BETWEEN ?1 AND ?2
      AND longitude BETWEEN ?3 AND ?4
  `).bind(
    coordinates.latitude - latSpan,
    coordinates.latitude + latSpan,
    coordinates.longitude - lonSpan,
    coordinates.longitude + lonSpan
  ).all();

  return results
    .map(hotel => ({
      id: hotel.id,
      name: hotel.canonical_name,
      latitude: Number(hotel.latitude),
      longitude: Number(hotel.longitude),
      existing: true,
      distance: Math.round(
        distanceMeters(coordinates, {
          latitude: Number(hotel.latitude),
          longitude: Number(hotel.longitude)
        })
      )
    }))
    .filter(hotel =>
      hotel.name &&
      Number.isFinite(hotel.distance) &&
      hotel.distance <= MAX_DISTANCE
    )
    .sort((a, b) => a.distance - b.distance)
    .slice(0, MAX_HOTELS);
}

async function findOpenStreetMapHotels(coordinates) {
  const { latitude, longitude } = coordinates;

  const query = `
    [out:json][timeout:25];
    (
      node["tourism"="hotel"](around:${MAX_DISTANCE},${latitude},${longitude});
      way["tourism"="hotel"](around:${MAX_DISTANCE},${latitude},${longitude});
      node["tourism"="guest_house"](around:${MAX_DISTANCE},${latitude},${longitude});
      way["tourism"="guest_house"](around:${MAX_DISTANCE},${latitude},${longitude});
    );
    out center tags;
  `.trim();

  let elements = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(25000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data.elements)) {
        throw new Error('Invalid Overpass response');
      }

      elements = data.elements;
      break;

    } catch (error) {
      console.warn('Overpass endpoint failed:', error.message);
    }
  }

  if (elements === null) {
    throw new Error('All Overpass endpoints failed');
  }

  return elements
    .map(element => {
      const latitude = Number(
        element.lat ?? element.center?.lat
      );

      const longitude = Number(
        element.lon ?? element.center?.lon
      );

      const name = String(element.tags?.name || '').trim();

      if (
        !['node', 'way'].includes(element.type) ||
        !Number.isSafeInteger(Number(element.id)) ||
        !name ||
        !Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
        !Number.isFinite(longitude) || Math.abs(longitude) > 180
      ) {
        return null;
      }

      const hotel = {
        id: `osm-${element.type}-${element.id}`,
        name,
        latitude,
        longitude,
        existing: false
      };

      hotel.distance = Math.round(
        distanceMeters(coordinates, hotel)
      );

      return hotel;
    })
    .filter(hotel =>
      hotel &&
      hotel.distance <= MAX_DISTANCE
    );
}

async function saveScanStatus(db, videoId, status) {
  await db.prepare(`
    INSERT OR IGNORE INTO hotel_scan_status (video_id, status)
    SELECT ?1, ?2
    WHERE EXISTS (
      SELECT 1 FROM videos AS v
      WHERE v.id = ?1 AND v.active = 1
        AND LOWER(TRIM(COALESCE(v.category, ''))) <> 'documentaries'
        AND LOWER(COALESCE(v.title, '')) NOT LIKE '%documentary%'
    )
    AND NOT EXISTS (
      SELECT 1 FROM video_hotels WHERE video_id = ?1
    )
  `).bind(videoId, status).run();
}

async function deferScan(db, videoId, error) {
  await db.prepare(`
    INSERT INTO ingestion_log (video_id, action, status, message)
    VALUES (?1, 'hotel_scan', 'retry', ?2)
  `).bind(videoId, String(error?.message || error).slice(0, 300)).run();

  console.warn(`Hotel scan deferred for ${videoId}: ${String(error?.message || error)}`);
}

async function saveHotelMatches(db, video, hotels) {
  const statements = [];

  for (const hotel of hotels) {
    if (!hotel.existing) {
      statements.push(
        db.prepare(`
          INSERT OR IGNORE INTO hotels (
            id, canonical_name, city, country,
            latitude, longitude, active
          )
          SELECT ?1, ?2, ?3, ?4, ?5, ?6, 1
          WHERE EXISTS (
            SELECT 1 FROM videos AS v WHERE v.id = ?7 AND v.active = 1
              AND LOWER(TRIM(COALESCE(v.category, ''))) <> 'documentaries'
              AND LOWER(COALESCE(v.title, '')) NOT LIKE '%documentary%'
          )
          AND NOT EXISTS (
            SELECT 1 FROM hotel_scan_status WHERE video_id = ?7
          )
        `).bind(
          hotel.id,
          hotel.name,
          video.location.city,
          video.location.country,
          hotel.latitude,
          hotel.longitude,
          video.id
        )
      );
    }
  }

  hotels.forEach((hotel, index) => {
    statements.push(
      db.prepare(`
        INSERT OR IGNORE INTO video_hotels (
          video_id, hotel_id, distance_meters,
          selection_score, rank, match_method,
          verified, active
        )
        SELECT ?1, ?2, ?3, 0, ?4, 'city', 1, 1
        WHERE EXISTS (
          SELECT 1 FROM videos AS v
          WHERE v.id = ?1 AND v.active = 1
            AND LOWER(TRIM(COALESCE(v.category, ''))) <> 'documentaries'
            AND LOWER(COALESCE(v.title, '')) NOT LIKE '%documentary%'
        )
        AND EXISTS (
          SELECT 1 FROM hotels AS h WHERE h.id = ?2 AND h.active = 1
        )
        AND NOT EXISTS (
          SELECT 1 FROM hotel_scan_status WHERE video_id = ?1
        )
      `).bind(
        video.id,
        hotel.id,
        hotel.distance,
        index + 1
      )
    );
  });

  statements.push(
    db.prepare(`
      INSERT OR IGNORE INTO hotel_scan_status (video_id, status)
      SELECT ?1, 'matched'
      WHERE EXISTS (
        SELECT 1 FROM video_hotels AS vh
        WHERE vh.video_id = ?1 AND vh.active = 1 AND vh.verified = 1
      )
    `).bind(video.id)
  );

  await db.batch(statements);

  const saved = await db.prepare(`
    SELECT COUNT(*) AS total FROM video_hotels
    WHERE video_id = ?1 AND active = 1 AND verified = 1
  `).bind(video.id).first();

  if (!saved?.total) {
    throw new Error(`No verified hotel links saved for ${video.id}`);
  }

  return Number(saved.total);
}

async function scanPendingVideos(env) {
  const db = env.oldtowns_db;

  if (!db) {
    throw new Error('D1 binding is missing');
  }

  const { results: videos = [] } = await db.prepare(`
    SELECT v.id, v.title, v.city, v.country
    FROM videos AS v
    WHERE v.active = 1
      AND LOWER(TRIM(COALESCE(v.category, '')))
          <> 'documentaries'
      AND LOWER(COALESCE(v.title, ''))
          NOT LIKE '%documentary%'
      AND NOT EXISTS (
        SELECT 1 FROM hotel_scan_status AS s
        WHERE s.video_id = v.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM video_hotels AS vh
        WHERE vh.video_id = v.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM ingestion_log AS log
        WHERE log.video_id = v.id
          AND log.action = 'hotel_scan'
          AND log.status = 'retry'
          AND log.created_at > datetime('now', '-1 day')
      )
    ORDER BY v.id
    LIMIT 10
  `).all();

  if (videos.length === 0) {
    console.log('No pending hotel scans');
    return;
  }

  for (const video of videos) {
    try {
      await processVideo(db, video);
    } catch (error) {
      console.error(
        `Hotel scan failed for ${video.id}:`,
        error
      );

      try {
        await deferScan(db, video.id, error);
      } catch (logError) {
        console.error(
          `Could not defer ${video.id}:`,
          logError
        );
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1200));
  }

  console.log(`Hotel scan batch completed: ${videos.length} videos`);
}

async function processVideo(db, video) {
  console.log(`Scanning video: ${video.id}`);

  const location = detectHotelLocation(video);

  if (
    location.status !== 'resolved' ||
    hasCorruptedLocation(location) ||
    !String(location.city || '').trim() ||
    !String(location.country || '').trim()
  ) {
    await saveScanStatus(db, video.id, 'no_location');
    console.log(`Skipped unresolved location: ${video.id}`);
    return;
  }

  let coordinates;

  try {
    coordinates = await resolveCoordinates(db, location);
  } catch (error) {
    await deferScan(db, video.id, error);
    return;
  }

  if (!coordinates) {
    await saveScanStatus(db, video.id, 'no_location');
    console.log(`Location could not be verified: ${video.id}`);
    return;
  }

  video.location = location;

  const existing = await findExistingHotels(
    db,
    coordinates
  );

  let hotels = existing;

  if (existing.length === 0) {
    let discovered;

    try {
      discovered = await findOpenStreetMapHotels(coordinates);
    } catch (error) {
      await deferScan(db, video.id, error);
      return;
    }

    const byId = new Map();

    for (const hotel of [...existing, ...discovered]) {
      byId.set(hotel.id, hotel);
    }

    hotels = [...byId.values()];
  }

  hotels = hotels
    .sort((a, b) => a.distance - b.distance)
    .slice(0, MAX_HOTELS);

  if (hotels.length === 0) {
    await saveScanStatus(db, video.id, 'no_hotels');
    console.log(`No hotels found: ${video.id}`);
    return;
  }

  const alreadyProcessed = await db.prepare(`
    SELECT 1 AS found
    WHERE EXISTS (SELECT 1 FROM hotel_scan_status WHERE video_id = ?1)
       OR EXISTS (SELECT 1 FROM video_hotels WHERE video_id = ?1)
  `).bind(video.id).first();

  if (alreadyProcessed) {
    console.log(`Existing hotel data preserved: ${video.id}`);
    return;
  }

  const savedCount = await saveHotelMatches(db, video, hotels);
  console.log(`Matched ${savedCount} hotels: ${video.id}`);
}

#!/usr/bin/env node
/**
 * fetch-hotels.mjs
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.cwd();

const VIDEOS_PATH = path.join(ROOT, "src/data/videos.json");
const HOTELS_OUT_PATH = path.join(ROOT, "src/data/hotels.json");
const CACHE_DIR = path.join(ROOT, ".cache");
const OVERPASS_CACHE_PATH = path.join(CACHE_DIR, "overpass-cache.json");
const GEOCODE_CACHE_PATH = path.join(CACHE_DIR, "geocode-cache.json");
const PROGRESS_PATH = path.join(CACHE_DIR, "fetch-hotels-progress.json");

const HOTELS_PER_VIDEO = 10;
const SEARCH_RADII_METERS = [3000, 6000, 12000, 25000];
const REQUEST_DELAY_MS = 1200;
const MAX_RETRIES_PER_ENDPOINT = 3;
const RETRY_BASE_DELAY_MS = 2000;
const FETCH_TIMEOUT_MS = 25000;

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "OldTownsWalkingToursBot/1.0 (contact: info@oldtownswalks.com)";

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function readJsonSafe(filePath, fallback) {
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, data) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Caches
// ---------------------------------------------------------------------------

let overpassCache = {};
let geocodeCache = {};
let progress = { done: {} };

async function loadCaches() {
  overpassCache = await readJsonSafe(OVERPASS_CACHE_PATH, {});
  geocodeCache = await readJsonSafe(GEOCODE_CACHE_PATH, {});
  progress = await readJsonSafe(PROGRESS_PATH, { done: {} });
}

async function saveOverpassCache() {
  await writeJson(OVERPASS_CACHE_PATH, overpassCache);
}
async function saveGeocodeCache() {
  await writeJson(GEOCODE_CACHE_PATH, geocodeCache);
}
async function saveProgress() {
  await writeJson(PROGRESS_PATH, progress);
}

function coordCacheKey(lat, lon, radius) {
  return `${lat.toFixed(3)},${lon.toFixed(3)}@${radius}`;
}

// ---------------------------------------------------------------------------
// Coordinate extraction
// ---------------------------------------------------------------------------

async function extractCoordinates(video) {
  if (Array.isArray(video.routePoints) && video.routePoints.length > 0) {
    const pts = video.routePoints
      .map((p) => {
        if (Array.isArray(p)) return { lat: Number(p[0]), lon: Number(p[1]) };
        return {
          lat: Number(p.lat ?? p.latitude),
          lon: Number(p.lon ?? p.lng ?? p.longitude),
        };
      })
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));

    if (pts.length > 0) {
      const lat = pts.reduce((sum, p) => sum + p.lat, 0) / pts.length;
      const lon = pts.reduce((sum, p) => sum + p.lon, 0) / pts.length;
      return { lat, lon, source: "routePoints" };
    }
  }

  const flatLat = video.lat ?? video.latitude;
  const flatLon = video.lon ?? video.lng ?? video.longitude;
  if (Number.isFinite(Number(flatLat)) && Number.isFinite(Number(flatLon))) {
    return { lat: Number(flatLat), lon: Number(flatLon), source: "flat-fields" };
  }

  if (video.location && typeof video.location === "object") {
    const nLat = video.location.lat ?? video.location.latitude;
    const nLon = video.location.lon ?? video.location.lng ?? video.location.longitude;
    if (Number.isFinite(Number(nLat)) && Number.isFinite(Number(nLon))) {
      return { lat: Number(nLat), lon: Number(nLon), source: "nested-location" };
    }
  }

  const cityName = video.city || video.location?.city;
  const countryName = video.country || video.location?.country;
  if (cityName) {
    const geocoded = await geocodeCity(cityName, countryName);
    if (geocoded) return { ...geocoded, source: "geocoded" };
  }

  return null;
}

async function geocodeCity(city, country) {
  const query = country ? `${city}, ${country}` : city;
  const cacheKey = query.toLowerCase().trim();

  if (geocodeCache[cacheKey]) return geocodeCache[cacheKey];

  const url = `${NOMINATIM_ENDPOINT}?format=json&limit=1&q=${encodeURIComponent(query)}`;

  for (let attempt = 1; attempt <= MAX_RETRIES_PER_ENDPOINT; attempt++) {
    try {
      await sleep(REQUEST_DELAY_MS);
      const res = await fetchWithTimeout(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        console.warn(`  [geocode] no result for "${query}"`);
        return null;
      }

      const result = { lat: Number(data[0].lat), lon: Number(data[0].lon) };
      geocodeCache[cacheKey] = result;
      await saveGeocodeCache();
      return result;
    } catch (err) {
      console.warn(`  [geocode] attempt ${attempt}/${MAX_RETRIES_PER_ENDPOINT} failed for "${query}": ${err.message}`);
      if (attempt < MAX_RETRIES_PER_ENDPOINT) {
        await sleep(RETRY_BASE_DELAY_MS * attempt);
      }
    }
  }

  console.error(`  [geocode] giving up on "${query}"`);
  return null;
}

// ---------------------------------------------------------------------------
// Overpass querying
// ---------------------------------------------------------------------------

function buildOverpassQuery(lat, lon, radiusMeters) {
  return `
    [out:json][timeout:25];
    (
      node["tourism"="hotel"](around:${radiusMeters},${lat},${lon});
      way["tourism"="hotel"](around:${radiusMeters},${lat},${lon});
      node["tourism"="guest_house"](around:${radiusMeters},${lat},${lon});
      way["tourism"="guest_house"](around:${radiusMeters},${lat},${lon});
    );
    out center tags;
  `.trim();
}

async function queryOverpassEndpoint(endpoint, query) {
  for (let attempt = 1; attempt <= MAX_RETRIES_PER_ENDPOINT; attempt++) {
    try {
      await sleep(REQUEST_DELAY_MS);
      const res = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": USER_AGENT,
        },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (res.status === 429 || res.status === 504) {
        throw new Error(`rate-limited or gateway timeout (HTTP ${res.status})`);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      return await res.json();
    } catch (err) {
      console.warn(`    [overpass:${new URL(endpoint).hostname}] attempt ${attempt}/${MAX_RETRIES_PER_ENDPOINT} failed: ${err.message}`);
      if (attempt < MAX_RETRIES_PER_ENDPOINT) {
        await sleep(RETRY_BASE_DELAY_MS * attempt);
      }
    }
  }
  return null;
}

async function queryOverpassAllMirrors(lat, lon, radiusMeters) {
  const cacheKey = coordCacheKey(lat, lon, radiusMeters);
  if (overpassCache[cacheKey]) return overpassCache[cacheKey];

  const query = buildOverpassQuery(lat, lon, radiusMeters);

  for (const endpoint of OVERPASS_ENDPOINTS) {
    const result = await queryOverpassEndpoint(endpoint, query);
    if (result && Array.isArray(result.elements)) {
      overpassCache[cacheKey] = result.elements;
      await saveOverpassCache();
      return result.elements;
    }
  }

  console.error(`    [overpass] all mirrors failed for radius ${radiusMeters}m`);
  return [];
}

async function findNearestHotels(lat, lon) {
  let elements = [];

  for (const radius of SEARCH_RADII_METERS) {
    elements = await queryOverpassAllMirrors(lat, lon, radius);
    if (elements.length >= HOTELS_PER_VIDEO) break;
  }

  const hotels = elements
    .map((el) => {
      const hLat = el.lat ?? el.center?.lat;
      const hLon = el.lon ?? el.center?.lon;
      if (!Number.isFinite(hLat) || !Number.isFinite(hLon)) return null;

      const tags = el.tags || {};
      return {
        id: `osm-${el.type}-${el.id}`,
        name: tags.name || "Unnamed hotel",
        lat: hLat,
        lon: hLon,
        address: [tags["addr:street"], tags["addr:housenumber"], tags["addr:city"]]
          .filter(Boolean)
          .join(" "),
        website: tags.website || tags["contact:website"] || null,
        distanceMeters: Math.round(distanceMeters(lat, lon, hLat, hLon)),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, HOTELS_PER_VIDEO);

  return hotels;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  await mkdir(CACHE_DIR, { recursive: true });
  await loadCaches();

  const rawData = await readJsonSafe(VIDEOS_PATH, null);
  if (!rawData) {
    console.error(`Could not read ${VIDEOS_PATH}`);
    process.exit(1);
  }

  const videos = Array.isArray(rawData) ? rawData : rawData.videos || [];
  const allHotelsById = {};
  let processed = 0;
  let skipped = 0;

  for (const video of videos) {
    const videoId = video.id || video.slug || video.title;

    if (!videoId) {
      console.warn("[skip] video has no id/slug/title:", video);
      skipped++;
      continue;
    }

    if (progress.done[videoId]) {
      video.nearbyHotelIds = progress.done[videoId];
      processed++;
      continue;
    }

    console.log(`\n[${processed + skipped + 1}/${videos.length}] ${videoId}`);

    const coords = await extractCoordinates(video);
    if (!coords) {
      console.warn(`  [skip] no usable coordinates for "${videoId}"`);
      video.nearbyHotelIds = [];
      progress.done[videoId] = [];
      await saveProgress();
      skipped++;
      continue;
    }

    console.log(`  coords: ${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)} (via ${coords.source})`);

    const hotels = await findNearestHotels(coords.lat, coords.lon);
    console.log(`  found ${hotels.length} hotel(s)`);

    for (const hotel of hotels) {
      allHotelsById[hotel.id] = hotel;
    }

    const hotelIds = hotels.map((h) => h.id);
    video.nearbyHotelIds = hotelIds;
    progress.done[videoId] = hotelIds;

    await saveProgress();
    await writeJson(HOTELS_OUT_PATH, Object.values(allHotelsById));
    await writeJson(VIDEOS_PATH, rawData);

    processed++;
  }

  console.log(`\nDone. Processed: ${processed}, skipped: ${skipped}, total unique hotels: ${Object.keys(allHotelsById).length}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
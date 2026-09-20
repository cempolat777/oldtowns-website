import { transliterate } from 'transliteration';

export type NearbyHotel = {
  id: string;
  name: string;
  latinName?: string;
  localName?: string;
  city?: string;
  country?: string;
  address?: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  rank: number;
  provider?: string;
  providerHotelId?: string;
  starRating?: number;
  guestRating?: number;
  reviewCount?: number;
  thumbnailUrl?: string;
  bookingUrl?: string;
};

export type NearbyHotelResult = {
  items: NearbyHotel[];
  total: number;
};

type D1PreparedStatementLike = {
  bind: (...values: unknown[]) => D1PreparedStatementLike;
  first: <T = unknown>() => Promise<T | null>;
  all: <T = unknown>() => Promise<{ results?: T[] }>;
};

type D1DatabaseLike = {
  prepare: (query: string) => D1PreparedStatementLike;
};

type HotelRow = {
  hotel_id: string;
  canonical_name: string;
  city: string | null;
  country: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  distance_meters: number;
  hotel_rank: number;
  provider: string | null;
  provider_hotel_id: string | null;
  star_rating: number | null;
  guest_rating: number | null;
  review_count: number | null;
  thumbnail_url: string | null;
  booking_url: string | null;
  content_expires_at: string | null;
  source_updated_at: string | null;
};

type CountRow = {
  total: number;
};

type TrustedVideoGeo = {
  latitude?: number;
  longitude?: number;
  verified?: boolean;
  integrityVerified?: boolean;
  precision?: string;
};

type VideoAnchorRow = {
  raw_json: string | null;
  active: number | null;
};

const MAX_HOTEL_DISTANCE_METERS = 3_000;
const EARTH_RADIUS_METERS = 6_371_000;

function isTrustedRouteAnchor(value: TrustedVideoGeo | undefined): value is TrustedVideoGeo & {
  latitude: number;
  longitude: number;
} {
  if (!value || value.verified !== true || value.integrityVerified !== true) {
    return false;
  }

  // A city centroid is not evidence of a hotel being near the filmed route.
  const precision = String(value.precision || '').toLowerCase();
  if (!['route-point', 'landmark', 'airport'].includes(precision)) {
    return false;
  }

  return typeof value.latitude === 'number' &&
    Number.isFinite(value.latitude) &&
    value.latitude >= -90 && value.latitude <= 90 &&
    typeof value.longitude === 'number' &&
    Number.isFinite(value.longitude) &&
    value.longitude >= -180 && value.longitude <= 180;
}

function distanceInMeters(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
) {
  const radians = Math.PI / 180;
  const deltaLatitude = (latitudeB - latitudeA) * radians;
  const deltaLongitude = (longitudeB - longitudeA) * radians;
  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(latitudeA * radians) * Math.cos(latitudeB * radians) *
    Math.sin(deltaLongitude / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(Math.min(1, haversine)));
}

async function findExistingHotelsNearRoute(
  db: D1DatabaseLike,
  videoId: string,
  limit: number,
  suppliedGeo?: TrustedVideoGeo
): Promise<NearbyHotelResult> {
  let geo = suppliedGeo;

  if (!isTrustedRouteAnchor(geo)) {
    const videoRow = await db
      .prepare('SELECT raw_json, active FROM videos WHERE id = ?1 LIMIT 1')
      .bind(videoId)
      .first<VideoAnchorRow>();

    if (Number(videoRow?.active) !== 1 || !videoRow?.raw_json) {
      return { items: [], total: 0 };
    }

    try {
      geo = (JSON.parse(videoRow.raw_json) as { geo?: TrustedVideoGeo }).geo;
    } catch {
      return { items: [], total: 0 };
    }
  }

  if (!isTrustedRouteAnchor(geo)) {
    return { items: [], total: 0 };
  }

  const latitudeSpan = MAX_HOTEL_DISTANCE_METERS / 110_574;
  const longitudeSpan = Math.min(
    180,
    MAX_HOTEL_DISTANCE_METERS / (111_320 * Math.max(0.001, Math.cos(geo.latitude * Math.PI / 180)))
  );

  // Read only hotels that have at least one previously verified association.
  // This does not create new hotel records or mark a new video as verified.
  const result = await db
    .prepare(`
      SELECT
        h.id AS hotel_id,
        h.canonical_name,
        h.city,
        h.country,
        h.address,
        h.latitude,
        h.longitude,
        0 AS distance_meters,
        0 AS hotel_rank,
        hs.provider,
        hs.provider_hotel_id,
        hs.star_rating,
        hs.guest_rating,
        hs.review_count,
        hs.thumbnail_url,
        hs.booking_url,
        hs.content_expires_at,
        hs.updated_at AS source_updated_at
      FROM hotels AS h
      LEFT JOIN hotel_sources AS hs
        ON hs.hotel_id = h.id AND hs.active = 1
      WHERE h.active = 1
        AND h.latitude BETWEEN ?1 AND ?2
        AND h.longitude BETWEEN ?3 AND ?4
        AND EXISTS (
          SELECT 1 FROM video_hotels AS vh
          WHERE vh.hotel_id = h.id AND vh.active = 1 AND vh.verified = 1
        )
    `)
    .bind(
      geo.latitude - latitudeSpan,
      geo.latitude + latitudeSpan,
      geo.longitude - longitudeSpan,
      geo.longitude + longitudeSpan
    )
    .all<HotelRow>();

  const grouped = new Map<string, { rows: HotelRow[]; distance: number }>();

  for (const row of result.results || []) {
    const latitude = Number(row.latitude);
    const longitude = Number(row.longitude);
    if (!row.hotel_id || !String(row.canonical_name || '').trim() ||
        !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      continue;
    }

    const distance = distanceInMeters(geo.latitude, geo.longitude, latitude, longitude);
    if (distance > MAX_HOTEL_DISTANCE_METERS) {
      continue;
    }

    const found = grouped.get(row.hotel_id);
    if (found) {
      found.rows.push(row);
    } else {
      grouped.set(row.hotel_id, { rows: [row], distance });
    }
  }

  const now = Date.now();
  const matches = Array.from(grouped.values())
    .sort((left, right) => left.distance - right.distance);

  const items: NearbyHotel[] = matches.slice(0, limit).map((match, index) => {
    const hotel = match.rows[0];
    const source = chooseSource(match.rows, now);

    return {
      id: hotel.hotel_id,
      name: hotel.canonical_name,
      city: optionalText(hotel.city),
      country: optionalText(hotel.country),
      address: optionalText(hotel.address),
      latitude: Number(hotel.latitude),
      longitude: Number(hotel.longitude),
      distanceMeters: Math.round(match.distance),
      rank: index + 1,
      provider: optionalText(source.provider),
      providerHotelId: optionalText(source.provider_hotel_id),
      starRating: optionalNumber(source.star_rating),
      guestRating: optionalNumber(source.guest_rating),
      reviewCount: optionalNumber(source.review_count),
      thumbnailUrl: isFreshSource(source, now) ? optionalText(source.thumbnail_url) : undefined,
      bookingUrl: isFreshSource(source, now) ? optionalText(source.booking_url) : undefined
    };
  });

  return { items, total: matches.length };
}

const providerPriority = [
  'booking',
  'expedia',
  'agoda',
  'trip',
  'google',
  'openstreetmap'
];

function optionalText(value: string | null) {
  const cleaned = String(value || '').trim();
  return cleaned || undefined;
}

function optionalNumber(value: number | null) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

function isFreshSource(row: HotelRow, now: number) {
  if (!row.content_expires_at) {
    return true;
  }

  const expiry = Date.parse(row.content_expires_at);
  return Number.isFinite(expiry) && expiry > now;
}

function sourceScore(row: HotelRow, now: number) {
  const providerIndex = providerPriority.indexOf(
    String(row.provider || '').toLowerCase()
  );
  const priority = providerIndex === -1
    ? providerPriority.length
    : providerIndex;
  const freshnessBonus = isFreshSource(row, now) ? 100 : 0;
  const bookingBonus = row.booking_url ? 20 : 0;
  const imageBonus = row.thumbnail_url ? 10 : 0;
  const ratingBonus = row.guest_rating !== null ? 5 : 0;

  return freshnessBonus + bookingBonus + imageBonus + ratingBonus - priority;
}

function chooseSource(rows: HotelRow[], now: number) {
  return [...rows].sort(
    (left, right) =>
      sourceScore(right, now) - sourceScore(left, now)
  )[0];
}

function isMissingHotelSchema(error: unknown) {
  const message = error instanceof Error
    ? error.message
    : String(error || '');

  return /no such table:\s*(hotels|hotel_sources|video_hotels)/i
    .test(message);
}

export async function getNearbyHotelsForVideo(
  db: D1DatabaseLike,
  videoId: string,
  limit: number = 30,
  videoGeo?: TrustedVideoGeo
): Promise<NearbyHotelResult> {
  const safeVideoId = String(videoId || '').trim();
  const safeLimit = Math.max(1, Math.min(30, Math.floor(limit)));

  if (!safeVideoId) {
    return { items: [], total: 0 };
  }

  try {
    const countRow = await db
      .prepare(`
        SELECT COUNT(*) AS total
        FROM video_hotels AS vh
        INNER JOIN hotels AS h
          ON h.id = vh.hotel_id
        WHERE vh.video_id = ?1
          AND vh.active = 1
          AND vh.verified = 1
          AND h.active = 1
      `)
      .bind(safeVideoId)
      .first<CountRow>();

    const rows = await db
      .prepare(`
        SELECT
          h.id AS hotel_id,
          h.canonical_name,
          h.city,
          h.country,
          h.address,
          h.latitude,
          h.longitude,
          vh.distance_meters,
          vh.rank AS hotel_rank,
          hs.provider,
          hs.provider_hotel_id,
          hs.star_rating,
          hs.guest_rating,
          hs.review_count,
          hs.thumbnail_url,
          hs.booking_url,
          hs.content_expires_at,
          hs.updated_at AS source_updated_at
        FROM video_hotels AS vh
        INNER JOIN hotels AS h
          ON h.id = vh.hotel_id
        LEFT JOIN hotel_sources AS hs
          ON hs.hotel_id = h.id
          AND hs.active = 1
        WHERE vh.video_id = ?1
          AND vh.active = 1
          AND vh.verified = 1
          AND h.active = 1
        ORDER BY vh.rank ASC, vh.distance_meters ASC
        LIMIT ?2
      `)
      .bind(safeVideoId, safeLimit * 8)
      .all<HotelRow>();

    if (!rows.results?.length) {
      return await findExistingHotelsNearRoute(db, safeVideoId, safeLimit, videoGeo);
    }

    const grouped = new Map<string, HotelRow[]>();

    for (const row of rows.results || []) {
      const existing = grouped.get(row.hotel_id) || [];
      existing.push(row);
      grouped.set(row.hotel_id, existing);
    }

    const now = Date.now();
    const items = Array.from(grouped.values())
      .map((hotelRows) => {
        const base = hotelRows[0];
        const source = chooseSource(hotelRows, now);

        return {
          id: base.hotel_id,
          name: base.canonical_name,
          city: optionalText(base.city),
          country: optionalText(base.country),
          address: optionalText(base.address),
          latitude: Number(base.latitude),
          longitude: Number(base.longitude),
          distanceMeters: Number(base.distance_meters),
          rank: Number(base.hotel_rank),
          provider: optionalText(source.provider),
          providerHotelId: optionalText(source.provider_hotel_id),
          starRating: optionalNumber(source.star_rating),
          guestRating: optionalNumber(source.guest_rating),
          reviewCount: optionalNumber(source.review_count),
          thumbnailUrl: isFreshSource(source, now)
            ? optionalText(source.thumbnail_url)
            : undefined,
          bookingUrl: isFreshSource(source, now)
            ? optionalText(source.booking_url)
            : undefined
        } satisfies NearbyHotel;
      })
      .sort(
        (left, right) =>
          left.rank - right.rank ||
          left.distanceMeters - right.distanceMeters
      )
      .slice(0, safeLimit);

    return {
      items,
      total: Number(countRow?.total || items.length)
    };
  } catch (error) {
    if (isMissingHotelSchema(error)) {
      return { items: [], total: 0 };
    }

    throw error;
  }
}

const localNamePreferredLanguages = new Set([
  'ar', 'hi', 'ja', 'ko', 'ru', 'zh'
]);

function hasNonLatinLetters(value: string) {
  return [...value].some(
    (character) => /\p{L}/u.test(character) && !/\p{Script=Latin}/u.test(character)
  );
}

function romanizeHotelName(value: string) {
  const original = String(value || '').trim();
  if (!original || !hasNonLatinLetters(original)) {
    return original;
  }

  try {
    return transliterate(original).replace(/\s+/g, ' ').trim() || original;
  } catch {
    return original;
  }
}

export function resolveHotelDisplayName(
  hotel: Pick<NearbyHotel, 'name' | 'latinName' | 'localName'>,
  lang: string
) {
  const language = String(lang || 'en').toLocaleLowerCase().split('-')[0];
  const primary = String(hotel.name || '').trim();
  const latin = String(hotel.latinName || '').trim();
  const local = String(hotel.localName || '').trim();

  if (localNamePreferredLanguages.has(language) && local) {
    return local;
  }

  if (latin) {
    return latin;
  }

  return romanizeHotelName(primary || local);
}

export function formatHotelDistance(
  distanceMeters: number,
  lang: string
) {
  const distance = Math.max(0, Number(distanceMeters) || 0);
  const locale = String(lang || 'en');

  if (distance < 1000) {
    return `${Math.round(distance)} m`;
  }

  return `${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(distance / 1000)} km`;
}

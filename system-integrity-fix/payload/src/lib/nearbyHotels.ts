export type NearbyHotel = {
  id: string;
  name: string;
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
  limit: number = 4
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

import fs from 'node:fs';
import { loadEnvFile } from 'node:process';

try {
  loadEnvFile();
} catch {}

const API_KEY = process.env.YOUTUBE_API_KEY;
const OUTPUT_PATH = './video-candidates.json';

if (!API_KEY) {
  console.error('YOUTUBE_API_KEY is missing from .env');
  process.exit(1);
}

const SEARCH_QUERIES = [
  // Walking Tours
  {
    query: 'Tokyo 4k walking tour',
    category: 'Walking Tours'
  },
  {
    query: 'London 4k walking tour',
    category: 'Walking Tours'
  },
  {
    query: 'Paris 4k walking tour',
    category: 'Walking Tours'
  },
  {
    query: 'Istanbul 4k walking tour',
    category: 'Walking Tours'
  },
  {
    query: 'New York 4k walking tour',
    category: 'Walking Tours'
  },
  {
    query: 'Rome 4k walking tour',
    category: 'Walking Tours'
  },

  // Airport Walks
  {
    query: 'airport walking tour 4k',
    category: 'Airport Walks'
  },
  {
    query: 'international airport walking tour 4k',
    category: 'Airport Walks'
  },
  {
    query: 'airport terminal walk 4k',
    category: 'Airport Walks'
  },
  {
    query: 'Haneda airport walking tour 4k',
    category: 'Airport Walks'
  },
  {
    query: 'Changi airport walking tour 4k',
    category: 'Airport Walks'
  },
  {
    query: 'Dubai airport walking tour 4k',
    category: 'Airport Walks'
  },
  {
    query: 'Istanbul airport walking tour 4k',
    category: 'Airport Walks'
  },
  {
    query: 'Heathrow airport walking tour 4k',
    category: 'Airport Walks'
  },

  // Beach Walks
  {
    query: 'beach walking tour 4k',
    category: 'Beach Walking Tours'
  },

  // Night & Rain
  {
    query: 'night walking tour 4k',
    category: 'Night & Rain'
  },
  {
    query: 'rain walking tour 4k',
    category: 'Night & Rain'
  },

  // Drone & Aerial
  {
    query: 'drone city 4k',
    category: 'Drone & Aerial'
  },

  // Street Food
  {
    query: 'street food walking tour 4k',
    category: 'Street Food'
  },

  // Museums & Culture
  {
    query: 'museum walking tour 4k',
    category: 'Museums & Culture'
  },

  // Nature Trails
  {
    query: 'nature forest walking tour 4k',
    category: 'Nature Trails'
  }
];

const SEARCH_RESULTS_PER_QUERY = 25;
const KEEP_PER_QUERY = 8;

function cleanText(value = '') {
  return String(value)
    .replace(/\r/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDuration(iso = '') {
  const match = String(iso).match(
    /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/
  );

  if (!match) {
    return 0;
  }

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);

  return (
    hours * 3600 +
    minutes * 60 +
    seconds
  );
}

function daysSince(dateString) {
  const published = new Date(dateString).getTime();

  if (!Number.isFinite(published)) {
    return 1;
  }

  return Math.max(
    1,
    (Date.now() - published) /
      (1000 * 60 * 60 * 24)
  );
}

function logScore(value, ceiling) {
  const numeric = Math.max(
    0,
    Number(value) || 0
  );

  const max = Math.max(
    1,
    Number(ceiling) || 1
  );

  return Math.min(
    1,
    Math.log10(numeric + 1) /
      Math.log10(max + 1)
  );
}

function getRelevanceScore(title, category) {
  const t = cleanText(title).toLowerCase();

  const rules = {
    'Walking Tours': [
      'walk',
      'walking',
      'walking tour',
      'city walk'
    ],

    'Airport Walks': [
      'airport',
      'terminal',
      'airport walk',
      'airport walking',
      'airport tour'
    ],

    'Beach Walking Tours': [
      'beach',
      'seaside',
      'seafront',
      'coastal',
      'oceanfront'
    ],

    'Night & Rain': [
      'night',
      'rain',
      'rainy',
      'evening'
    ],

    'Drone & Aerial': [
      'drone',
      'aerial'
    ],

    'Street Food': [
      'street food',
      'food market',
      'night market'
    ],

    'Museums & Culture': [
      'museum',
      'gallery',
      'culture',
      'cultural'
    ],

    'Nature Trails': [
      'nature',
      'forest',
      'trail',
      'hiking',
      'walk'
    ]
  };

  const keywords = rules[category] || [];

  const matches = keywords.filter(
    (keyword) => t.includes(keyword)
  ).length;

  return Math.min(
    1,
    matches /
      Math.max(
        1,
        Math.min(3, keywords.length)
      )
  );
}

function getMinimumDurationSeconds(category) {
  if (category === 'Drone & Aerial') {
    return 5 * 60;
  }

  if (category === 'Museums & Culture') {
    return 8 * 60;
  }

  return 12 * 60;
}

function hasAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function isRejectedTitle(title) {
  const blockedTerms = [
    'ambient music',
    'relaxation music',
    'meditation music',
    'music for sleep',
    'sleep music',
    'sleep and study',
    'sleep & study',
    'for sleep',
    'nature sounds',
    'rain sounds',
    'white noise',
    'brown noise',
    'soundscape',
    'drone show',
    'fireworks show',
    'concert',
    'gameplay',
    'movie recap',
    'trailer',
    'netflix'
  ];

  return hasAny(title, blockedTerms);
}

function isRelevantCandidate(video, category) {
  const title = cleanText(
    video.snippet?.title
  ).toLowerCase();

  if (!title || isRejectedTitle(title)) {
    return false;
  }

  const walkTerms = [
    'walk',
    'walking',
    'walking tour',
    'city walk',
    'street walk',
    'virtual walk'
  ];

  if (category === 'Walking Tours') {
    if (!hasAny(title, walkTerms)) {
      return false;
    }

    const rejectedWalkingTerms = [
      'airport',
      'terminal',
      'beach',
      'beachfront',
      'seaside',
      'seafront',
      'drone',
      'aerial',
      'vlog',
      'bike ride',
      'bicycle ride',
      'cycling tour',
      'driving tour',
      'car tour',
      'aquarium',
      'underwater zoo',
      'zoo tour',
      'theme park',
      'amusement park',
      'roller coaster'
    ];

    if (hasAny(title, rejectedWalkingTerms)) {
      return false;
    }

    return true;
  }

  if (category === 'Airport Walks') {
    const airportTerms = [
      'airport',
      'terminal',
      'aeropuerto',
      'aéroport',
      'flughafen',
      'aeroporto'
    ];

    return (
      hasAny(title, airportTerms) &&
      hasAny(title, [
        ...walkTerms,
        'tour',
        'inside'
      ])
    );
  }

  if (category === 'Beach Walking Tours') {
    const beachTerms = [
      'beach',
      'beachfront',
      'seaside',
      'seafront',
      'coastal',
      'coastline',
      'oceanfront',
      'playa',
      'praia',
      'plage',
      'spiaggia',
      'strand',
      'pantai'
    ];

    return (
      hasAny(title, beachTerms) &&
      hasAny(title, [
        ...walkTerms,
        'tour'
      ])
    );
  }

  if (category === 'Night & Rain') {
    const atmosphereTerms = [
      'night',
      'rain',
      'rainy',
      'evening',
      'storm'
    ];

    return (
      hasAny(title, atmosphereTerms) &&
      hasAny(title, [
        ...walkTerms,
        'tour'
      ])
    );
  }

  if (category === 'Drone & Aerial') {
    return hasAny(title, [
      'drone',
      'aerial'
    ]);
  }

  if (category === 'Street Food') {
    const foodTerms = [
      'street food',
      'food market',
      'night market',
      'food tour'
    ];

    return (
      hasAny(title, foodTerms) &&
      hasAny(title, [
        'walk',
        'walking',
        'tour',
        'market'
      ])
    );
  }

  if (category === 'Museums & Culture') {
    const cultureTerms = [
      'museum',
      'gallery',
      'culture',
      'cultural'
    ];

    return (
      hasAny(title, cultureTerms) &&
      hasAny(title, [
        'walk',
        'walking',
        'tour',
        'inside'
      ])
    );
  }

  if (category === 'Nature Trails') {
    const natureTerms = [
      'nature',
      'forest',
      'trail',
      'hiking',
      'mountain',
      'park'
    ];

    return (
      hasAny(title, natureTerms) &&
      hasAny(title, [
        'walk',
        'walking',
        'hiking',
        'trail',
        'tour'
      ])
    );
  }

  return false;
}

function calculateQualityScore(
  video,
  channel,
  category
) {
  const views = Number(
    video.statistics?.viewCount || 0
  );

  const subscribers = Number(
    channel?.statistics?.subscriberCount || 0
  );

  const publishedAt =
    video.snippet?.publishedAt || '';

  const ageDays = daysSince(
    publishedAt
  );

  const viewsPerDay =
    views / ageDays;

  const descriptionLength =
    cleanText(
      video.snippet?.description
    ).length;

  const durationSeconds =
    parseDuration(
      video.contentDetails?.duration
    );

  const relevance =
    getRelevanceScore(
      video.snippet?.title,
      category
    );

  const viewStrength =
    logScore(
      views,
      10_000_000
    );

  const channelStrength =
    logScore(
      subscribers,
      5_000_000
    );

  const velocityStrength =
    logScore(
      viewsPerDay,
      100_000
    );

  const descriptionStrength =
    Math.min(
      1,
      descriptionLength / 500
    );

  let durationStrength = 1;

  const minimumDuration =
    getMinimumDurationSeconds(
      category
    );

  if (
    durationSeconds <
    minimumDuration
  ) {
    durationStrength =
      durationSeconds /
      minimumDuration;
  }

  const score =
    viewStrength * 35 +
    channelStrength * 25 +
    velocityStrength * 20 +
    relevance * 10 +
    descriptionStrength * 5 +
    durationStrength * 5;

  return {
    score: Number(
      score.toFixed(2)
    ),

    views,

    subscribers,

    viewsPerDay:
      Math.round(
        viewsPerDay
      ),

    ageDays:
      Math.round(
        ageDays
      ),

    descriptionLength,

    durationSeconds
  };
}

async function fetchJson(url) {
  const response =
    await fetch(url);

  const data =
    await response.json();

  if (
    !response.ok ||
    data.error
  ) {
    const message =
      data?.error?.message ||
      `${response.status} ${response.statusText}`;

    throw new Error(message);
  }

  return data;
}

async function searchVideos(query) {
  const params =
    new URLSearchParams({
      part: 'snippet',
      type: 'video',
      maxResults:
        String(
          SEARCH_RESULTS_PER_QUERY
        ),
      q: query,
      order: 'viewCount',
      videoEmbeddable: 'true',
      videoSyndicated: 'true',
      key: API_KEY
    });

  const data =
    await fetchJson(
      `https://www.googleapis.com/youtube/v3/search?${params}`
    );

  return data.items || [];
}

async function getVideoDetails(
  videoIds
) {
  if (!videoIds.length) {
    return [];
  }

  const params =
    new URLSearchParams({
      part:
        'snippet,statistics,contentDetails,status',
      id: videoIds.join(','),
      key: API_KEY
    });

  const data =
    await fetchJson(
      `https://www.googleapis.com/youtube/v3/videos?${params}`
    );

  return data.items || [];
}

async function getChannelDetails(
  channelIds
) {
  if (!channelIds.length) {
    return new Map();
  }

  const uniqueIds = [
    ...new Set(channelIds)
  ];

  const map = new Map();

  for (
    let i = 0;
    i < uniqueIds.length;
    i += 50
  ) {
    const batch =
      uniqueIds.slice(
        i,
        i + 50
      );

    const params =
      new URLSearchParams({
        part:
          'statistics,snippet',
        id: batch.join(','),
        key: API_KEY
      });

    const data =
      await fetchJson(
        `https://www.googleapis.com/youtube/v3/channels?${params}`
      );

    for (
      const channel of
      data.items || []
    ) {
      map.set(
        channel.id,
        channel
      );
    }
  }

  return map;
}

async function getRankedCandidates(
  searchItem
) {
  const searchResults =
    await searchVideos(
      searchItem.query
    );

  const ids =
    searchResults
      .map(
        (item) =>
          item.id?.videoId
      )
      .filter(Boolean);

  const videos =
    await getVideoDetails(
      ids
    );

  const validVideos =
    videos.filter(
      (video) => {
        if (
          video.status?.embeddable ===
          false
        ) {
          return false;
        }

        const durationSeconds =
          parseDuration(
            video.contentDetails
              ?.duration
          );

        if (
          durationSeconds <
          getMinimumDurationSeconds(
            searchItem.category
          )
        ) {
          return false;
        }

        return isRelevantCandidate(
          video,
          searchItem.category
        );
      }
    );

  const channels =
    await getChannelDetails(
      validVideos
        .map(
          (video) =>
            video.snippet
              ?.channelId
        )
        .filter(Boolean)
    );

  return validVideos
    .map(
      (video) => {
        const channel =
          channels.get(
            video.snippet
              ?.channelId
          ) || null;

        const quality =
          calculateQualityScore(
            video,
            channel,
            searchItem.category
          );

        return {
          id: video.id,

          originalTitle:
            cleanText(
              video.snippet
                ?.title
            ),

          sourceDescription:
            cleanText(
              video.snippet
                ?.description
            ),

          thumbnail:
            video.snippet
              ?.thumbnails
              ?.maxres?.url ||
            video.snippet
              ?.thumbnails
              ?.standard?.url ||
            video.snippet
              ?.thumbnails
              ?.high?.url ||
            '',

          category:
            searchItem.category,

          channel:
            cleanText(
              video.snippet
                ?.channelTitle
            ),

          channelTitle:
            cleanText(
              video.snippet
                ?.channelTitle
            ),

          channelId:
            video.snippet
              ?.channelId ||
            '',

          publishedAt:
            video.snippet
              ?.publishedAt ||
            '',

          durationSeconds:
            quality.durationSeconds,

          viewCount:
            quality.views,

          subscriberCount:
            quality.subscribers,

          viewsPerDay:
            quality.viewsPerDay,

          qualityScore:
            quality.score,

          searchQuery:
            searchItem.query
        };
      }
    )
    .sort(
      (a, b) =>
        b.qualityScore -
        a.qualityScore
    )
    .slice(
      0,
      KEEP_PER_QUERY
    );
}

async function main() {
  console.log(
    'QUALITY VIDEO DISCOVERY'
  );

  console.log(
    'This script does not modify src/data/videos.json.'
  );

  console.log('');

  const candidateMap =
    new Map();

  for (
    const item of
    SEARCH_QUERIES
  ) {
    try {
      console.log(
        `Searching: ${item.query}`
      );

      const candidates =
        await getRankedCandidates(
          item
        );

      for (
        const candidate of
        candidates
      ) {
        const existing =
          candidateMap.get(
            candidate.id
          );

        if (
          !existing ||
          candidate.qualityScore >
            existing.qualityScore
        ) {
          candidateMap.set(
            candidate.id,
            candidate
          );
        }
      }

      console.log(
        `Accepted candidates: ${candidates.length}`
      );
    } catch (error) {
      console.error(
        `Search failed for "${item.query}":`,
        error.message || error
      );
    }
  }

  const candidates =
    [...candidateMap.values()]
      .sort(
        (a, b) =>
          b.qualityScore -
          a.qualityScore
      );

  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(
      candidates,
      null,
      2
    ) + '\n',
    'utf8'
  );

  console.log('');

  console.log(
    `Unique ranked candidates: ${candidates.length}`
  );

  console.log(
    `Report written to: ${OUTPUT_PATH}`
  );

  console.log(
    'src/data/videos.json was not changed.'
  );
}

main().catch(
  (error) => {
    console.error(
      'Fatal error:',
      error.message ||
        error
    );

    process.exit(1);
  }
);
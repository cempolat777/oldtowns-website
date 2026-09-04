import fs from 'fs';
import { loadEnvFile } from 'node:process';

loadEnvFile();

const API_KEY = process.env.YOUTUBE_API_KEY;

if (!API_KEY) {
  console.error('YOUTUBE_API_KEY is missing.');
  process.exit(1);
}

const OUTPUT_PATH = './src/data/videos.json';

const SEARCH_QUERIES = [
  // Walking Tours
  { query: 'Tokyo 4k walking tour 1 hour', category: 'Walking Tours' },
  { query: 'London 4k walking tour 1 hour', category: 'Walking Tours' },
  { query: 'Paris 4k walking tour 1 hour', category: 'Walking Tours' },
  { query: 'Istanbul 4k walking tour 1 hour', category: 'Walking Tours' },
  { query: 'New York 4k walking tour 1 hour', category: 'Walking Tours' },
  { query: 'Rome 4k walking tour 1 hour', category: 'Walking Tours' },

  // Beach Walking Tours
  { query: 'beach walking tour 4k 1 hour', category: 'Beach Walking Tours' },
  { query: 'seaside walking tour 4k 1 hour', category: 'Beach Walking Tours' },

  // Night & Rain
  { query: 'Tokyo rain walk 4k 1 hour', category: 'Night & Rain' },
  { query: 'London rain walk 4k 1 hour', category: 'Night & Rain' },
  { query: 'Paris night walk 4k 1 hour', category: 'Night & Rain' },

  // Drone & Aerial
  { query: 'World cities 4k drone view 1 hour', category: 'Drone & Aerial' },
  { query: 'Switzerland 4k drone relaxing 1 hour', category: 'Drone & Aerial' },

  // Street Food
  { query: 'Japan street food tour 4k 1 hour', category: 'Street Food' },
  { query: 'Istanbul street food tour 4k 1 hour', category: 'Street Food' },

  // Museums & Culture
  { query: 'Historic old town walking tour 4k 1 hour', category: 'Museums & Culture' },
  { query: 'Ancient ruins 4k tour 1 hour', category: 'Museums & Culture' },

  // Nature Trails
  { query: 'Nature forest walking tour 4k 1 hour', category: 'Nature Trails' }
];

function cleanTitle(title) {
  if (!title) return '';

  return title
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function loadExistingVideos() {
  if (!fs.existsSync(OUTPUT_PATH)) {
    return [];
  }

  try {
    const rawData = fs.readFileSync(OUTPUT_PATH, 'utf8');
    const data = JSON.parse(rawData);

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Could not read the existing videos.json file.');
    process.exit(1);
  }
}

async function fetchYouTubeVideos() {
  const existingVideos = loadExistingVideos();

  const allVideos = [...existingVideos];

  // Prevent duplicate videos using the unique YouTube video ID.
  const seenVideoIds = new Set(
    existingVideos
      .map((video) => video.id)
      .filter(Boolean)
  );

  let addedVideos = 0;

  for (const item of SEARCH_QUERIES) {
    console.log(`Searching: "${item.query}"`);

    const url =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet` +
      `&maxResults=25` +
      `&q=${encodeURIComponent(item.query)}` +
      `&type=video` +
      `&videoDefinition=high` +
      `&videoDuration=long` +
      `&videoEmbeddable=true` +
      `&key=${API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.error(
          `YouTube API error (${item.query}):`,
          data.error.message
        );
        continue;
      }

      if (!data.items?.length) {
        console.log(`No videos found: ${item.query}`);
        continue;
      }

      for (const video of data.items) {
        const videoId = video.id?.videoId;

        if (!videoId) {
          continue;
        }

        // Skip videos that already exist in videos.json.
        if (seenVideoIds.has(videoId)) {
          continue;
        }

        const title = cleanTitle(video.snippet.title);

        let badge = '4K 60FPS';

        if (title.toLowerCase().includes('rain')) {
          badge = 'RAIN 4K';
        }

        if (
          title.toLowerCase().includes('drone') ||
          title.toLowerCase().includes('aerial')
        ) {
          badge = 'DRONE 4K';
        }

        allVideos.push({
          id: videoId,
          title,
          description: cleanTitle(video.snippet.description),
          thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          category: item.category,
          channel: video.snippet.channelTitle,
          channelTitle: video.snippet.channelTitle,
          channelId: video.snippet.channelId,
          badge,
          publishedAt: video.snippet.publishedAt
        });

        seenVideoIds.add(videoId);
        addedVideos++;
      }
    } catch (error) {
      console.error(
        `Fetch error (${item.query}):`,
        error.message || error
      );
    }
  }

  fs.mkdirSync('./src/data', { recursive: true });

  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(allVideos, null, 2),
    'utf8'
  );

  console.log(`Existing videos: ${existingVideos.length}`);
  console.log(`New videos added: ${addedVideos}`);
  console.log(`Total videos: ${allVideos.length}`);
}

fetchYouTubeVideos();
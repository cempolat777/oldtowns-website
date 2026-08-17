import fs from 'fs';

// YouTube API Key
const API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyAQR2TnjBRbsOPWTi68tiUmJ5kB7G7OyLE';

// Dünyanın En Büyük Şehirleri ve Özel Kategoriler (1 Saatlik 4K Video Aramaları)
const SEARCH_QUERIES = [
  // Walking Tours
  { query: 'Tokyo 4k walking tour 1 hour', category: 'Walking Tours' },
  { query: 'London 4k walking tour 1 hour', category: 'Walking Tours' },
  { query: 'Paris 4k walking tour 1 hour', category: 'Walking Tours' },
  { query: 'Istanbul 4k walking tour 1 hour', category: 'Walking Tours' },
  { query: 'New York 4k walking tour 1 hour', category: 'Walking Tours' },
  { query: 'Rome 4k walking tour 1 hour', category: 'Walking Tours' },

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

async function fetchYouTubeVideos() {
  let allVideos = [];
  let seenVideoIds = new Set();

  for (const item of SEARCH_QUERIES) {
    console.log(`⏳ Aranıyor: '${item.query}'...`);
    
    // videoDuration=long -> Sadece 20+ dakika ve 1 saat civarı videoları filtreler
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=${encodeURIComponent(item.query)}&type=video&videoDefinition=high&videoDuration=long&videoEmbeddable=true&key=${API_KEY}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.error(`❌ API HATASI (${item.query}):`, data.error.message);
        continue;
      }

      if (!data.items || data.items.length === 0) {
        console.log(`⚠️ Video bulunamadı: ${item.query}`);
        continue;
      }

      for (const v of data.items) {
        const videoId = v.id?.videoId;
        if (!videoId || seenVideoIds.has(videoId)) continue;

        const title = cleanTitle(v.snippet.title);
        
        // Rozet belirleme
        let badge = "4K 60FPS";
        if (title.toLowerCase().includes("rain")) badge = "RAIN 4K";
        if (title.toLowerCase().includes("drone")) badge = "DRONE 4K";

        allVideos.push({
          id: videoId,
          title: title,
          description: cleanTitle(v.snippet.description),
          thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          category: item.category,
          channel: v.snippet.channelTitle,
          channelTitle: v.snippet.channelTitle,
          channelId: v.snippet.channelId,
          badge: badge,
          publishedAt: v.snippet.publishedAt
        });

        seenVideoIds.add(videoId);
      }
    } catch (error) {
      console.error(`❌ Hata oluştu (${item.query}):`, error.message || error);
    }
  }

  const outputPath = './src/data/videos.json';
  fs.mkdirSync('./src/data', { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(allVideos, null, 2));
  
  console.log(`\n🎉 BAŞARILI! Toplam ${allVideos.length} adet 4K video 'src/data/videos.json' dosyasına yüklendi.`);
}

fetchYouTubeVideos();
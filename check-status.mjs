import fs from 'node:fs';
import path from 'node:path';

const VIDEOS_PATH = './src/data/videos.json';
const HOTELS_PATH = './src/data/hotels.json';

const REQUIRED_FILES = [
  './src/data/videos.json',
  './src/data/hotels.json',
  './public/robots.txt',
  './public/sitemap-index.xml',
  './.env'
];

function checkProjectStatus() {
  console.log('\n==================================================');
  console.log('   OLD TOWNS WALKS - SYSTEM & DATA REPORT');
  console.log('==================================================\n');

  // 1. Critical File Check
  console.log('--- [1] CRITICAL FILES CHECK ---');
  REQUIRED_FILES.forEach((file) => {
    const exists = fs.existsSync(file);
    console.log(`${exists ? '✅' : '❌'} ${file.padEnd(30)} -> ${exists ? 'EXISTS' : 'MISSING'}`);
  });

  // 2. Videos Data Analysis
  console.log('\n--- [2] VIDEO DATA SYSTEM ANALYSIS ---');
  if (!fs.existsSync(VIDEOS_PATH)) {
    console.log('❌ src/data/videos.json not found!');
    return;
  }

  const rawVideos = fs.readFileSync(VIDEOS_PATH, 'utf8');
  const parsedVideos = JSON.parse(rawVideos);
  const videos = Array.isArray(parsedVideos) ? parsedVideos : (parsedVideos.videos || parsedVideos.items || []);

  const totalVideos = videos.length;
  let withChapters = 0;
  let withRoutePoints = 0;
  let withHotels = 0;
  let missingThumbnails = 0;

  videos.forEach((v) => {
    if (v.chapters && v.chapters.length > 0) withChapters++;
    if (v.routePoints && v.routePoints.length > 0) withRoutePoints++;
    if (v.hotels && v.hotels.length > 0) withHotels++;
    if (!v.thumbnail) missingThumbnails++;
  });

  console.log(`• Total Videos              : ${totalVideos}`);
  console.log(`• Videos with Chapters      : ${withChapters} / ${totalVideos} (${Math.round((withChapters/totalVideos)*100) || 0}%)`);
  console.log(`• Videos with Route Points  : ${withRoutePoints} / ${totalVideos} (${Math.round((withRoutePoints/totalVideos)*100) || 0}%)`);
  console.log(`• Videos with Hotels Linked : ${withHotels} / ${totalVideos} (${Math.round((withHotels/totalVideos)*100) || 0}%)`);
  console.log(`• Missing Thumbnails        : ${missingThumbnails}`);

  // 3. Hotels Data & Affiliate Analysis
  console.log('\n--- [3] HOTEL DATABASE & AFFILIATE ANALYSIS ---');
  if (fs.existsSync(HOTELS_PATH)) {
    const rawHotels = fs.readFileSync(HOTELS_PATH, 'utf8');
    const parsedHotels = JSON.parse(rawHotels);
    const hotels = Array.isArray(parsedHotels) ? parsedHotels : (parsedHotels.hotels || []);

    let withImages = 0;
    let withAffiliateLinks = 0;
    let withRatings = 0;

    hotels.forEach((h) => {
      if (h.image || h.imageUrl) withImages++;
      if (h.bookingUrl || h.affiliateUrl) withAffiliateLinks++;
      if (h.rating) withRatings++;
    });

    console.log(`• Total Saved Hotels        : ${hotels.length}`);
    console.log(`• Hotels with Real Images   : ${withImages} / ${hotels.length}`);
    console.log(`• Hotels with Affiliate Links: ${withAffiliateLinks} / ${hotels.length}`);
    console.log(`• Hotels with Ratings       : ${withRatings} / ${hotels.length}`);
  } else {
    console.log('⚠️ src/data/hotels.json has not been created yet.');
  }

  console.log('\n==================================================\n');
}

checkProjectStatus();
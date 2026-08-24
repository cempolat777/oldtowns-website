import fs from 'fs';
import path from 'path';

const jsonPath = path.join(process.cwd(), 'src/data/videos.json');

// Read the JSON file
const rawData = fs.readFileSync(jsonPath, 'utf8');
const videos = JSON.parse(rawData);

// Category rules based on keywords found in the video title
function getCategoryByTitle(title) {
  const t = String(title || '').toLowerCase();

  // Drone and aerial content
  if (
    t.includes('drone') ||
    t.includes('aerial') ||
    t.includes('fpv') ||
    t.includes('flight')
  ) {
    return 'Drone & Aerial';
  }

  // Airport and terminal walking tours
  if (
    (
      t.includes('airport') ||
      t.includes('terminal') ||
      t.includes('aeropuerto') ||
      t.includes('aéroport') ||
      t.includes('flughafen') ||
      t.includes('aeroporto')
    ) && (
      t.includes('walk') ||
      t.includes('walking') ||
      t.includes('tour') ||
      t.includes('terminal') ||
      t.includes('inside')
    )
  ) {
    return 'Airport Walks';
  }

  // Beach and seaside walking tours
  if (
    t.includes('beach') ||
    t.includes('beachfront') ||
    t.includes('seaside') ||
    t.includes('seafront') ||
    t.includes('coastal') ||
    t.includes('coastline') ||
    t.includes('oceanfront') ||
    t.includes('playa') ||
    t.includes('praia') ||
    t.includes('plage') ||
    t.includes('spiaggia') ||
    t.includes('strand') ||
    t.includes('pantai')
  ) {
    return 'Beach Walking Tours';
  }

  // Night and rain walks
  if (
    t.includes('night') ||
    t.includes('rain') ||
    t.includes('rainy') ||
    t.includes('dark')
  ) {
    return 'Night & Rain';
  }

  // Street food, markets and bazaars
  if (
    t.includes('food') ||
    t.includes('market') ||
    t.includes('bazaar') ||
    t.includes('eat')
  ) {
    return 'Street Food';
  }

  // Museums, historic places and cultural locations
  if (
    t.includes('museum') ||
    t.includes('castle') ||
    t.includes('historic') ||
    t.includes('palace') ||
    t.includes('temple')
  ) {
    return 'Museums & Culture';
  }

  // POV rides and transportation
  if (
    t.includes('ride') ||
    t.includes('drive') ||
    t.includes('tram') ||
    t.includes('bus') ||
    t.includes('boat')
  ) {
    return 'POV Rides';
  }

  // Nature and hiking content
  if (
    t.includes('trail') ||
    t.includes('nature') ||
    t.includes('park') ||
    t.includes('hike')
  ) {
    return 'Nature Trails';
  }

  // Default category
  return 'Walking Tours';
}

// Update all videos
const updatedVideos = videos.map((video) => ({
  ...video,
  category: getCategoryByTitle(video.title)
}));

// Write the updated data back to videos.json
fs.writeFileSync(
  jsonPath,
  JSON.stringify(updatedVideos, null, 2),
  'utf8'
);

console.log(
  `Successfully categorized ${updatedVideos.length} videos.`
);
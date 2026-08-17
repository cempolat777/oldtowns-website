import fs from 'fs';
import path from 'path';

const jsonPath = path.join(process.cwd(), 'src/data/videos.json');

// JSON dosyasını oku
const rawData = fs.readFileSync(jsonPath, 'utf8');
const videos = JSON.parse(rawData);

// Kategori Kuralları (Başlıkta geçen kelimeler)
function getCategoryByTitle(title) {
  const t = title.toLowerCase();

  if (t.includes('drone') || t.includes('aerial') || t.includes('fpv') || t.includes('flight')) {
    return 'Drone & Aerial';
  }
  if (t.includes('night') || t.includes('rain') || t.includes('rainy') || t.includes('dark')) {
    return 'Night & Rain';
  }
  if (t.includes('food') || t.includes('market') || t.includes('bazaar') || t.includes('eat')) {
    return 'Street Food';
  }
  if (t.includes('museum') || t.includes('castle') || t.includes('historic') || t.includes('palace') || t.includes('temple')) {
    return 'Museums & Culture';
  }
  if (t.includes('ride') || t.includes('drive') || t.includes('tram') || t.includes('bus') || t.includes('boat')) {
    return 'POV Rides';
  }
  if (t.includes('trail') || t.includes('nature') || t.includes('park') || t.includes('beach') || t.includes('hike')) {
    return 'Nature Trails';
  }

  // Eşleşmeyenler için varsayılan
  return 'Walking Tours';
}

// Tüm videoları güncelle
const updatedVideos = videos.map(video => ({
  ...video,
  category: getCategoryByTitle(video.title)
}));

// Güncellenmiş veriyi videos.json'a geri yaz
fs.writeFileSync(jsonPath, JSON.stringify(updatedVideos, null, 2), 'utf8');

console.log(`✅ Başarıyla ${updatedVideos.length} video otomatik kategorize edildi!`);
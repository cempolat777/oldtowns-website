export const supportedLangs = [
  'en','tr','de','es','it','fr','ja','pt','ru','zh','ko','ar','hi','nl','pl','sv','id','vi'
] as const;

export type Lang = typeof supportedLangs[number];

type Video = {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  category?: string;
  channel?: string;
  publishedAt?: string;
  badge?: string;
};

const categoryNames: Record<string, Record<string, string>> = {
  'Walking Tours': {
    en:'Walking Tour', tr:'Yürüyüş Turu', de:'Stadtrundgang', es:'Recorrido a Pie',
    it:'Tour a Piedi', fr:'Visite à Pied', ja:'街歩き', pt:'Passeio a Pé',
    ru:'Пешеходная прогулка', zh:'徒步之旅', ko:'도보 여행', ar:'جولة مشي',
    hi:'पैदल यात्रा', nl:'Stadswandeling', pl:'Spacer po Mieście', sv:'Stadsvandring',
    id:'Tur Jalan Kaki', vi:'Tour Đi Bộ'
  },
  'Night & Rain': {
    en:'Night & Rain Walk', tr:'Gece & Yağmur Yürüyüşü', de:'Nacht- & Regenspaziergang',
    es:'Paseo Nocturno y con Lluvia', it:'Passeggiata Notturna e sotto la Pioggia',
    fr:'Balade de Nuit et sous la Pluie', ja:'夜・雨の散歩', pt:'Caminhada Noturna e na Chuva',
    ru:'Ночная прогулка под дождём', zh:'夜间雨中漫步', ko:'야간 빗속 산책', ar:'جولة ليلية تحت المطر',
    hi:'रात और बारिश की सैर', nl:'Nacht- & Regenwandeling', pl:'Nocny Spacer w Deszczu',
    sv:'Natt- & Regnpromenad', id:'Jalan Malam & Hujan', vi:'Đi Bộ Đêm & Mưa'
  },
  'Drone & Aerial': {
    en:'Drone & Aerial View', tr:'Drone & Hava Görüntüleri', de:'Drohnen- & Luftaufnahmen',
    es:'Vista Aérea con Dron', it:'Veduta Aerea con Drone', fr:'Vue Aérienne par Drone',
    ja:'ドローン空撮', pt:'Vista Aérea com Drone', ru:'Аэросъёмка с дрона',
    zh:'无人机航拍', ko:'드론 항공 영상', ar:'تصوير جوي بالطائرة المسيّرة',
    hi:'ड्रोन एरियल व्यू', nl:'Drone- & Luchtbeelden', pl:'Widok z Drona',
    sv:'Drönarvy', id:'Pemandangan Drone & Udara', vi:'Góc Nhìn Flycam'
  },
  'Street Food': {
    en:'Street Food Tour', tr:'Sokak Lezzetleri Turu', de:'Street-Food-Tour',
    es:'Tour de Comida Callejera', it:'Tour dello Street Food', fr:'Tour de Street Food',
    ja:'ストリートフード巡り', pt:'Tour de Comida de Rua', ru:'Тур по Уличной Еде',
    zh:'街头美食之旅', ko:'길거리 음식 투어', ar:'جولة أطعمة الشوارع',
    hi:'स्ट्रीट फूड टूर', nl:'Streetfoodtour', pl:'Wycieczka po Street Foodzie',
    sv:'Street Food-rundtur', id:'Tur Kuliner Jalanan', vi:'Tour Ẩm Thực Đường Phố'
  },
  'Nature Trails': {
    en:'Nature Walk', tr:'Doğa Yürüyüşü', de:'Naturwanderung', es:'Paseo por la Naturaleza',
    it:'Passeggiata nella Natura', fr:'Balade dans la Nature', ja:'自然散策',
    pt:'Caminhada na Natureza', ru:'Прогулка на Природе', zh:'自然徒步', ko:'자연 산책',
    ar:'نزهة في الطبيعة', hi:'प्रकृति की सैर', nl:'Natuurwandeling',
    pl:'Spacer Przyrodniczy', sv:'Naturvandring', id:'Jelajah Alam', vi:'Đi Bộ Thiên Nhiên'
  },
  'Museums & Culture': {
    en:'Museum & Culture Tour', tr:'Müze & Kültür Turu', de:'Museums- & Kulturtour',
    es:'Tour de Museos y Cultura', it:'Tour di Musei e Cultura', fr:'Visite Musées & Culture',
    ja:'博物館・文化ツアー', pt:'Tour de Museus e Cultura', ru:'Музеи и Культура',
    zh:'博物馆与文化之旅', ko:'박물관 & 문화 투어', ar:'جولة المتاحف والثقافة',
    hi:'संग्रहालय और संस्कृति टूर', nl:'Museum- & Cultuurtour',
    pl:'Muzea i Kultura', sv:'Museum- & Kulturtur', id:'Tur Museum & Budaya', vi:'Tour Bảo Tàng & Văn Hóa'
  },
  'POV Rides': {
    en:'POV Ride', tr:'POV Sürüş', de:'POV-Fahrt', es:'Recorrido POV', it:'Percorso POV',
    fr:'Trajet POV', ja:'POVドライブ', pt:'Passeio POV', ru:'POV-поездка', zh:'POV驾驶',
    ko:'POV 주행', ar:'جولة قيادة POV', hi:'POV राइड', nl:'POV-rit',
    pl:'Przejazd POV', sv:'POV-tur', id:'Perjalanan POV', vi:'Chuyến Đi POV'
  }
};

const pageText: Record<string, {title:string; description:string}> = {
  en:{title:'Old Towns Walks – 4K Walking Tours Around the World',description:'Explore immersive 4K walking tours, night walks, drone views, street food, culture and nature from cities around the world.'},
  tr:{title:'Old Towns Walks – Dünyadan 4K Yürüyüş Turları',description:'Dünyanın farklı şehirlerinden 4K yürüyüş turları, gece yürüyüşleri, drone görüntüleri, sokak lezzetleri, kültür ve doğa videolarını keşfedin.'},
  de:{title:'Old Towns Walks – 4K-Stadtrundgänge aus aller Welt',description:'Entdecke immersive 4K-Stadtrundgänge, Nachtspaziergänge, Drohnenaufnahmen, Street Food, Kultur und Natur aus aller Welt.'},
  es:{title:'Old Towns Walks – Recorridos a Pie 4K por el Mundo',description:'Explora recorridos a pie 4K, paseos nocturnos, vistas con dron, comida callejera, cultura y naturaleza de ciudades de todo el mundo.'},
  fr:{title:'Old Towns Walks – Visites à Pied 4K dans le Monde',description:'Découvrez des visites à pied 4K, balades nocturnes, vues aériennes, street food, culture et nature dans des villes du monde entier.'}
};

function normalizeLang(lang?: string): string {
  return supportedLangs.includes((lang || 'en') as Lang) ? (lang || 'en') : 'en';
}

export function getPageSeo(lang?: string) {
  const l = normalizeLang(lang);
  return pageText[l] || pageText.en;
}

export function getCategoryName(category?: string, lang?: string) {
  const l = normalizeLang(lang);
  const map = categoryNames[category || 'Walking Tours'] || categoryNames['Walking Tours'];
  return map[l] || map.en;
}

function cleanTitle(title: string) {
  return title
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/#[\p{L}\p{N}_-]+/gu, '')
    .replace(/[【】\[\]<>]/g, ' ')
    .replace(/\([^)]*(?:ASMR|CAPTION|NO TALKING|60\s*FPS|HDR|UHD)[^)]*\)/gi, ' ')
    .replace(/\b(?:4K|8K|HDR|UHD|60FPS|60\s*FPS|ULTRA\s*HD|ASMR)\b/gi, ' ')
    .replace(/\b(?:NO\s*TALKING|CAPTIONS?|IMMERSIVE\s*SOUND|REAL\s*CITY\s*SOUNDS?)\b/gi, ' ')
    .replace(/[|•·]+/g, ' | ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const seoNoise = [
  'walking tour','walk tour','city walk','street walk','walking','walk','tour',
  'virtual','video','complete','true','full','relaxing','relaxation','cinematic',
  'day & night street views','day and night street views','street views',
  'day & night','day and night','jp','japan 4k','4k japan',
  '1 hour','2 hour','3 hour','4 hour','1-hour','2-hour','3-hour','4-hour'
];

function stripSeoNoise(value: string) {
  let out = value;
  for (const word of seoNoise) {
    out = out.replace(new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi'), ' ');
  }
  return out
    .replace(/\b(?:in|through|around|explore|exploring)\s*$/gi, ' ')
    .replace(/\s*[-–—,:/]\s*/g, ' ')
    .replace(/\s*\|\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectFeature(title: string, category?: string) {
  const t = title.toLowerCase();

  // Birleşik niyetleri önce yakala.
  if (/\b(?:rainy|rain|heavy rain|storm)\b/.test(t) && /\b(?:night|evening|blue hour)\b/.test(t)) return 'rainNight';
  if (/\b(?:cherry blossom|cherry blossoms|sakura)\b/.test(t)) return 'cherry';
  if (/\b(?:snow|snowy)\b/.test(t)) return 'snow';
  if (/\b(?:rainy|rain|heavy rain|storm)\b/.test(t)) return 'rain';
  if (/\b(?:night|evening|blue hour)\b/.test(t)) return 'night';
  if (/\b(?:drone|aerial)\b/.test(t) || category === 'Drone & Aerial') return 'drone';
  if (category === 'Street Food') return 'food';
  if (category === 'Nature Trails') return 'nature';
  if (category === 'Museums & Culture') return 'culture';
  if (category === 'POV Rides') return 'pov';
  return 'walk';
}

const featureNames: Record<string, Record<string, string>> = {
  walk: {en:'Walking Tour',tr:'Yürüyüş Turu',de:'Stadtrundgang',es:'Recorrido a Pie',it:'Tour a Piedi',fr:'Visite à Pied',ja:'街歩き',pt:'Passeio a Pé',ru:'Пешеходная прогулка',zh:'徒步之旅',ko:'도보 여행',ar:'جولة مشي',hi:'पैदल यात्रा',nl:'Stadswandeling',pl:'Spacer po Mieście',sv:'Stadsvandring',id:'Tur Jalan Kaki',vi:'Tour Đi Bộ'},
  night: {en:'Night Walking Tour',tr:'Gece Yürüyüş Turu',de:'Nachtspaziergang',es:'Recorrido Nocturno a Pie',it:'Passeggiata Notturna',fr:'Balade Nocturne',ja:'夜の街歩き',pt:'Caminhada Noturna',ru:'Ночная прогулка',zh:'夜间徒步',ko:'야간 도보 여행',ar:'جولة مشي ليلية',hi:'रात की पैदल यात्रा',nl:'Nachtwandeling',pl:'Nocny Spacer',sv:'Nattpromenad',id:'Tur Jalan Malam',vi:'Tour Đi Bộ Ban Đêm'},
  rain: {en:'Rain Walking Tour',tr:'Yağmurlu Yürüyüş Turu',de:'Regenspaziergang',es:'Recorrido a Pie bajo la Lluvia',it:'Passeggiata sotto la Pioggia',fr:'Balade sous la Pluie',ja:'雨の街歩き',pt:'Caminhada na Chuva',ru:'Прогулка под дождём',zh:'雨中徒步',ko:'빗속 도보 여행',ar:'جولة مشي تحت المطر',hi:'बारिश में पैदल यात्रा',nl:'Regenwandeling',pl:'Spacer w Deszczu',sv:'Regnpromenad',id:'Tur Jalan Saat Hujan',vi:'Tour Đi Bộ Dưới Mưa'},
  rainNight: {en:'Rainy Night Walking Tour',tr:'Yağmurlu Gece Yürüyüş Turu',de:'Nächtlicher Regenspaziergang',es:'Recorrido Nocturno bajo la Lluvia',it:'Passeggiata Notturna sotto la Pioggia',fr:'Balade Nocturne sous la Pluie',ja:'雨の夜の街歩き',pt:'Caminhada Noturna na Chuva',ru:'Ночная прогулка под дождём',zh:'雨夜徒步',ko:'비 오는 밤 도보 여행',ar:'جولة مشي ليلية تحت المطر',hi:'बारिश में रात की पैदल यात्रा',nl:'Nachtelijke Regenwandeling',pl:'Nocny Spacer w Deszczu',sv:'Nattlig Regnpromenad',id:'Tur Jalan Malam Saat Hujan',vi:'Tour Đi Bộ Đêm Mưa'},
  cherry: {en:'Cherry Blossom Walking Tour',tr:'Kiraz Çiçekleri Yürüyüş Turu',de:'Kirschblüten-Spaziergang',es:'Paseo entre Cerezos en Flor',it:'Passeggiata tra i Ciliegi in Fiore',fr:'Balade sous les Cerisiers en Fleurs',ja:'桜の街歩き',pt:'Caminhada pelas Cerejeiras em Flor',ru:'Прогулка среди Сакуры',zh:'樱花徒步',ko:'벚꽃 도보 여행',ar:'جولة مشي بين أزهار الكرز',hi:'चेरी ब्लॉसम पैदल यात्रा',nl:'Kersenbloesemwandeling',pl:'Spacer wśród Kwitnących Wiśni',sv:'Körsbärsblomspromenad',id:'Tur Jalan Bunga Sakura',vi:'Tour Đi Bộ Ngắm Hoa Anh Đào'},
  snow: {en:'Snow Walking Tour',tr:'Karlı Yürüyüş Turu',de:'Schneespaziergang',es:'Recorrido a Pie con Nieve',it:'Passeggiata sulla Neve',fr:'Balade sous la Neige',ja:'雪の街歩き',pt:'Caminhada na Neve',ru:'Прогулка по снегу',zh:'雪中徒步',ko:'눈길 도보 여행',ar:'جولة مشي في الثلج',hi:'बर्फ में पैदल यात्रा',nl:'Sneeuwwandeling',pl:'Spacer po Śniegu',sv:'Snöpromenad',id:'Tur Jalan di Salju',vi:'Tour Đi Bộ Trong Tuyết'},
  drone: {en:'Drone & Aerial View',tr:'Drone & Hava Görüntüleri',de:'Drohnen- & Luftaufnahmen',es:'Vista Aérea con Dron',it:'Veduta Aerea con Drone',fr:'Vue Aérienne par Drone',ja:'ドローン空撮',pt:'Vista Aérea com Drone',ru:'Аэросъёмка с дрона',zh:'无人机航拍',ko:'드론 항공 영상',ar:'تصوير جوي بالطائرة المسيّرة',hi:'ड्रोन एरियल व्यू',nl:'Drone- & Luchtbeelden',pl:'Widok z Drona',sv:'Drönarvy',id:'Pemandangan Drone & Udara',vi:'Góc Nhìn Flycam'},
  food: {en:'Street Food Tour',tr:'Sokak Lezzetleri Turu',de:'Street-Food-Tour',es:'Tour de Comida Callejera',it:'Tour dello Street Food',fr:'Tour de Street Food',ja:'ストリートフード巡り',pt:'Tour de Comida de Rua',ru:'Тур по Уличной Еде',zh:'街头美食之旅',ko:'길거리 음식 투어',ar:'جولة أطعمة الشوارع',hi:'स्ट्रीट फूड टूर',nl:'Streetfoodtour',pl:'Wycieczka po Street Foodzie',sv:'Street Food-rundtur',id:'Tur Kuliner Jalanan',vi:'Tour Ẩm Thực Đường Phố'},
  nature: {en:'Nature Walking Tour',tr:'Doğa Yürüyüşü',de:'Naturwanderung',es:'Paseo por la Naturaleza',it:'Passeggiata nella Natura',fr:'Balade dans la Nature',ja:'自然散策',pt:'Caminhada na Natureza',ru:'Прогулка на Природе',zh:'自然徒步',ko:'자연 산책',ar:'نزهة في الطبيعة',hi:'प्रकृति की सैर',nl:'Natuurwandeling',pl:'Spacer Przyrodniczy',sv:'Naturvandring',id:'Jelajah Alam',vi:'Đi Bộ Thiên Nhiên'},
  culture: {en:'Culture Walking Tour',tr:'Kültür Yürüyüş Turu',de:'Kultur-Spaziergang',es:'Recorrido Cultural a Pie',it:'Tour Culturale a Piedi',fr:'Balade Culturelle',ja:'文化散策',pt:'Passeio Cultural',ru:'Культурная прогулка',zh:'文化徒步',ko:'문화 도보 여행',ar:'جولة ثقافية سيرًا على الأقدام',hi:'सांस्कृतिक पैदल यात्रा',nl:'Culturele Wandeling',pl:'Spacer Kulturowy',sv:'Kulturpromenad',id:'Tur Jalan Budaya',vi:'Tour Đi Bộ Văn Hóa'},
  pov: {en:'POV Tour',tr:'POV Gezi Turu',de:'POV-Tour',es:'Recorrido POV',it:'Tour POV',fr:'Parcours POV',ja:'POVツアー',pt:'Passeio POV',ru:'POV-тур',zh:'POV之旅',ko:'POV 투어',ar:'جولة POV',hi:'POV टूर',nl:'POV-tour',pl:'Trasa POV',sv:'POV-tur',id:'Tur POV',vi:'Chuyến Đi POV'}
};

function removeFeatureWords(value: string) {
  return value
    .replace(/\b(?:rainy|rain|heavy rain|storm|night|evening|blue hour|snow|snowy|spring|cherry blossoms?|sakura|drone|aerial)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSubject(title: string) {
  const cleaned = cleanTitle(title);

  // YouTube başlıklarında ilk bölüm çoğunlukla en güçlü yer/konu sinyalini taşır.
  // Önce ayraçlara göre böl; sonra SEO gürültüsünü temizle.
  const parts = cleaned.split(/\s+\|\s+|\s+[–—]\s+/).map(p => p.trim()).filter(Boolean);
  let subject = parts[0] || cleaned;

  subject = stripSeoNoise(subject);
  subject = removeFeatureWords(subject);

  // Başta/sonda kalan anlamsız bağlaçları temizle.
  subject = subject
    .replace(/^(?:the|a|an)\s+/i, '')
    .replace(/\b(?:in|at|of|with|and|&)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Çok kısa ilk bölüm varsa ikinci bölümü dene.
  if (subject.length < 3 && parts[1]) {
    subject = removeFeatureWords(stripSeoNoise(parts[1]));
  }

  // Uzun reklam/cümle parçalarını kart başlığında taşımayalım.
  if (subject.length > 62) {
    subject = subject.slice(0, 62).replace(/\s+\S*$/, '').trim();
  }

  return subject;
}

export function getVideoCardTitle(video: Video, lang?: string) {
  const l = normalizeLang(lang);
  const original = cleanTitle(video.title);
  const feature = detectFeature(original, video.category);
  const label = featureNames[feature]?.[l] || featureNames[feature]?.en || getCategoryName(video.category, l);
  const subject = buildSubject(video.title);

  // Yer bilgisi güvenilir biçimde çıkarılamazsa sahte veri üretme.
  if (!subject || subject.length < 3) {
    return `${original} | ${label} 4K`;
  }

  return `${subject} | ${label} 4K`;
}

export function getVideoSeoDescription(video: Video, lang?: string) {
  const category = getCategoryName(video.category, lang);
  const base = (video.description || '').replace(/\s+/g, ' ').trim();
  if (base) return `${category}. ${base}`.slice(0, 300);
  return `${getVideoCardTitle(video, lang)} – immersive 4K travel video.`;
}

export function getVideoSchema(video: Video, lang?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: getVideoCardTitle(video, lang),
    description: getVideoSeoDescription(video, lang),
    thumbnailUrl: [video.thumbnail || `https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`],
    uploadDate: video.publishedAt,
    contentUrl: `https://www.youtube.com/watch?v=${video.id}`,
    embedUrl: `https://www.youtube.com/embed/${video.id}`
  };
}
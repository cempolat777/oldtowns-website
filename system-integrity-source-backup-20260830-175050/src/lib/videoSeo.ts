export const supportedLangs = [
  'en','tr','de','es','it','fr','ja','pt','ru','zh','ko','ar','hi','nl','pl','sv','id','vi'
] as const;

export type Lang = typeof supportedLangs[number];

export const VIDEO_CONTENT_VERSION = 7;

export type VideoIndexStatus = 'index' | 'noindex' | 'pending';

export type VideoChapter = {
  title: string;
  startSeconds: number;
  endSeconds?: number;
  verified?: boolean;
};

export type VideoRoutePoint = {
  name: string;
  type?: string;
  verified?: boolean;
};

export type VideoNearbyHotel = {
  id: string;
  name: string;
  distanceMeters?: number;
  guestRating?: number;
  reviewCount?: number;
  bookingUrl?: string;
  verified?: boolean;
};

export type Video = {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  category?: string;
  channel?: string;
  channelTitle?: string;
  channelId?: string;
  publishedAt?: string;
  duration?: string;
  badge?: string;
  city?: string;
  country?: string;
  active?: boolean | number;
  updatedAt?: string;
  sourceHash?: string;
  contentVersion?: number;
  qualityScore?: number;
  indexStatus?: VideoIndexStatus;
  embedAvailable?: boolean;
  thumbnailValid?: boolean;
  chapters?: VideoChapter[];
  routePoints?: VideoRoutePoint[];
  nearbyHotels?: VideoNearbyHotel[];
};

export type VideoContentOverride = {
  lang: Lang;
  h1?: string;
  metaDescription?: string;
  paragraphs?: string[];
};

export type VideoIndexDecision = {
  indexable: boolean;
  sitemapEligible: boolean;
  robots: 'index,follow' | 'noindex,follow';
  qualityScore: number;
  reasons: string[];
};

export type VideoSeoAudit = {
  lang: Lang;
  characterCount: number;
  wordCount: number;
  paragraphCount: number;
  uniqueSignals: string[];
  missingSignals: string[];
  repeatedParagraphs: boolean;
  indexDecision: VideoIndexDecision;
};

export type VideoSitemapData = {
  eligible: boolean;
  loc: string;
  lastmod?: string;
  alternates: Array<{
    lang: Lang;
    href: string;
  }>;
  video: null | {
    thumbnailLoc: string;
    title: string;
    description: string;
    playerLoc: string;
    publicationDate?: string;
    durationSeconds?: number;
    uploader?: string;
  };
};

const categoryNames: Record<string, Record<string, string>> = {
  'Walking Tours': {
    en:'Walking Tour', tr:'Yürüyüş Turu', de:'Stadtrundgang', es:'Recorrido a Pie',
    it:'Tour a Piedi', fr:'Visite à Pied', ja:'街歩き', pt:'Passeio a Pé',
    ru:'Пешеходная прогулка', zh:'徒步之旅', ko:'도보 여행', ar:'جولة مشي',
    hi:'पैदल यात्रा', nl:'Stadswandeling', pl:'Spacer po Mieście', sv:'Stadsvandring',
    id:'Tur Jalan Kaki', vi:'Tour Đi Bộ'
  },
  'Airport Walks': {
    en:'Airport Walk', tr:'Havalimanı Yürüyüşü', de:'Flughafen-Spaziergang', es:'Paseo por el Aeropuerto',
    it:'Passeggiata in Aeroporto', fr:'Promenade dans l’Aéroport', ja:'空港ウォーク', pt:'Caminhada no Aeroporto',
    ru:'Прогулка по аэропорту', zh:'机场漫步', ko:'공항 산책', ar:'جولة في المطار',
    hi:'एयरपोर्ट वॉक', nl:'Luchthavenwandeling', pl:'Spacer po Lotnisku', sv:'Flygplatspromenad',
    id:'Jelajah Bandara', vi:'Đi Bộ Sân Bay'
  },
  'Beach Walking Tours': {
    en:'Beach Walking Tour', tr:'Plaj Yürüyüş Turu', de:'Strandspaziergang', es:'Paseo por la Playa',
    it:'Passeggiata in Spiaggia', fr:'Balade sur la Plage', ja:'ビーチウォーク', pt:'Caminhada na Praia',
    ru:'Прогулка по пляжу', zh:'海滩漫步', ko:'해변 산책', ar:'جولة مشي على الشاطئ',
    hi:'समुद्र तट की सैर', nl:'Strandwandeling', pl:'Spacer po Plaży', sv:'Strandpromenad',
    id:'Jalan-jalan di Pantai', vi:'Đi Bộ Trên Bãi Biển'
  },
  'Night & Rain': {
    en:'Night & Rain Walk', tr:'Gece & Yağmur Yürüyüşü', de:'Nacht- & Regenspaziergang', es:'Paseo Nocturno y con Lluvia',
    it:'Passeggiata Notturna e sotto la Pioggia', fr:'Balade de Nuit et sous la Pluie', ja:'夜・雨の散歩', pt:'Caminhada Noturna e na Chuva',
    ru:'Ночная прогулка под дождём', zh:'夜间雨中漫步', ko:'야간 빗속 산책', ar:'جولة ليلية تحت المطر',
    hi:'रात और बारिश की सैर', nl:'Nacht- & Regenwandeling', pl:'Nocny Spacer w Deszczu', sv:'Natt- & Regnpromenad',
    id:'Jalan Malam & Hujan', vi:'Đi Bộ Đêm & Mưa'
  },
  'Drone & Aerial': {
    en:'Drone & Aerial View', tr:'Drone & Hava Görüntüleri', de:'Drohnen- & Luftaufnahmen', es:'Vista Aérea con Dron',
    it:'Veduta Aerea con Drone', fr:'Vue Aérienne par Drone', ja:'ドローン空撮', pt:'Vista Aérea com Drone',
    ru:'Аэросъёмка с дрона', zh:'无人机航拍', ko:'드론 항공 영상', ar:'تصوير جوي بالطائرة المسيّرة',
    hi:'ड्रोन एरियल व्यू', nl:'Drone- & Luchtbeelden', pl:'Widok z Drona', sv:'Drönarvy',
    id:'Pemandangan Drone & Udara', vi:'Góc Nhìn Flycam'
  },
  'Street Food': {
    en:'Street Food Tour', tr:'Sokak Lezzetleri Turu', de:'Street-Food-Tour', es:'Tour de Comida Callejera',
    it:'Tour dello Street Food', fr:'Tour de Street Food', ja:'ストリートフード巡り', pt:'Tour de Comida de Rua',
    ru:'Тур по Уличной Еде', zh:'街头美食之旅', ko:'길거리 음식 투어', ar:'جولة أطعمة الشوارع',
    hi:'स्ट्रीट फूड टूर', nl:'Streetfoodtour', pl:'Wycieczka po Street Foodzie', sv:'Street Food-rundtur',
    id:'Tur Kuliner Jalanan', vi:'Tour Ẩm Thực Đường Phố'
  },
  'Nature Trails': {
    en:'Nature Walk', tr:'Doğa Yürüyüşü', de:'Naturwanderung', es:'Paseo por la Naturaleza',
    it:'Passeggiata nella Natura', fr:'Balade dans la Nature', ja:'自然散策', pt:'Caminhada na Natureza',
    ru:'Прогулка на Природе', zh:'自然徒步', ko:'자연 산책', ar:'نزهة في الطبيعة',
    hi:'प्रकृति की सैर', nl:'Natuurwandeling', pl:'Spacer Przyrodniczy', sv:'Naturvandring',
    id:'Jelajah Alam', vi:'Đi Bộ Thiên Nhiên'
  },
  'Museums & Culture': {
    en:'Museum & Culture Tour', tr:'Müze & Kültür Turu', de:'Museums- & Kulturtour', es:'Tour de Museos y Cultura',
    it:'Tour di Musei e Cultura', fr:'Visite Musées & Culture', ja:'博物館・文化ツアー', pt:'Tour de Museus e Cultura',
    ru:'Музеи и Культура', zh:'博物馆与文化之旅', ko:'박물관 & 문화 투어', ar:'جولة المتاحف والثقافة',
    hi:'संग्रहालय और संस्कृति टूर', nl:'Museum- & Cultuurtour', pl:'Muzea i Kultura', sv:'Museum- & Kulturtur',
    id:'Tur Museum & Budaya', vi:'Tour Bảo Tàng & Văn Hóa'
  },
  'POV Rides': {
    en:'POV Ride', tr:'POV Sürüş', de:'POV-Fahrt', es:'Recorrido POV', it:'Percorso POV', fr:'Trajet POV',
    ja:'POVドライブ', pt:'Passeio POV', ru:'POV-поездка', zh:'POV驾驶', ko:'POV 주행', ar:'جولة قيادة POV',
    hi:'POV राइड', nl:'POV-rit', pl:'Przejazd POV', sv:'POV-tur', id:'Perjalanan POV', vi:'Chuyến Đi POV'
  },
  'Documentaries': {
    en:'Travel Documentary', tr:'Seyahat Belgeseli', de:'Reisedokumentation', es:'Documental de Viajes',
    it:'Documentario di Viaggio', fr:'Documentaire de Voyage', ja:'旅行ドキュメンタリー', pt:'Documentário de Viagem',
    ru:'Документальный фильм о путешествиях', zh:'旅行纪录片', ko:'여행 다큐멘터리', ar:'وثائقي سفر',
    hi:'यात्रा वृत्तचित्र', nl:'Reisdocumentaire', pl:'Dokument Podróżniczy', sv:'Resedokumentär',
    id:'Dokumenter Perjalanan', vi:'Phim Tài Liệu Du Lịch'
  }
};

const pageText: Record<string, { title: string; description: string }> = {
  en:{title:'Old Towns Walks – 4K Walking Tours Around the World',description:'Explore curated 4K walking tours, airport walks, night and rain walks, beaches, drone views, street food, culture and nature from destinations around the world.'},
  tr:{title:'Old Towns Walks – Dünyadan 4K Yürüyüş Turları',description:'Dünyanın farklı noktalarından seçilmiş 4K yürüyüş turlarını, havalimanı yürüyüşlerini, gece ve yağmur turlarını, plajları, drone görüntülerini, sokak lezzetlerini, kültürü ve doğayı keşfedin.'},
  de:{title:'Old Towns Walks – 4K-Stadtrundgänge aus aller Welt',description:'Entdecke ausgewählte 4K-Stadtrundgänge, Flughafen-Spaziergänge, Nacht- und Regenspaziergänge, Strände, Drohnenaufnahmen, Street Food, Kultur und Natur aus aller Welt.'},
  es:{title:'Old Towns Walks – Recorridos a Pie 4K por el Mundo',description:'Explora recorridos a pie 4K seleccionados, paseos por aeropuertos, recorridos nocturnos y con lluvia, playas, vistas con dron, comida callejera, cultura y naturaleza de todo el mundo.'},
  it:{title:'Old Towns Walks – Tour a Piedi 4K nel Mondo',description:'Scopri tour a piedi 4K selezionati, passeggiate negli aeroporti, tour notturni e sotto la pioggia, spiagge, riprese con drone, street food, cultura e natura da tutto il mondo.'},
  fr:{title:'Old Towns Walks – Visites à Pied 4K dans le Monde',description:'Découvrez des visites à pied 4K sélectionnées, des promenades dans les aéroports, des balades de nuit et sous la pluie, des plages, des vues aériennes, la street food, la culture et la nature.'},
  ja:{title:'Old Towns Walks – 世界の4K街歩きツアー',description:'世界各地から厳選した4K街歩き、空港ウォーク、夜や雨の散策、ビーチ、ドローン映像、ストリートフード、文化、自然の旅を紹介します。'},
  pt:{title:'Old Towns Walks – Passeios a Pé 4K pelo Mundo',description:'Explore passeios a pé 4K selecionados, caminhadas em aeroportos, passeios noturnos e na chuva, praias, vistas de drone, comida de rua, cultura e natureza do mundo todo.'},
  ru:{title:'Old Towns Walks – 4K прогулки по городам мира',description:'Исследуйте отобранные 4K прогулки, аэропорты, ночные и дождливые маршруты, пляжи, съёмку с дрона, уличную еду, культуру и природу со всего мира.'},
  zh:{title:'Old Towns Walks – 世界各地4K步行之旅',description:'探索精选的4K城市步行、机场漫步、夜间与雨中路线、海滩、无人机航拍、街头美食、文化与自然旅行内容。'},
  ko:{title:'Old Towns Walks – 세계의 4K 도보 여행',description:'세계 각지의 엄선된 4K 도보 여행, 공항 산책, 야간 및 우중 산책, 해변, 드론 영상, 길거리 음식, 문화와 자연을 만나보세요.'},
  ar:{title:'Old Towns Walks – جولات مشي 4K حول العالم',description:'استكشف جولات مشي 4K مختارة، وجولات المطارات، والمشي الليلي وتحت المطر، والشواطئ، والتصوير الجوي، وأطعمة الشوارع، والثقافة والطبيعة حول العالم.'},
  hi:{title:'Old Towns Walks – दुनिया भर की 4K वॉकिंग टूर',description:'दुनिया भर से चुनी गई 4K वॉकिंग टूर, एयरपोर्ट वॉक, रात और बारिश की सैर, समुद्र तट, ड्रोन दृश्य, स्ट्रीट फूड, संस्कृति और प्रकृति को देखें।'},
  nl:{title:'Old Towns Walks – 4K-wandelingen over de Hele Wereld',description:'Ontdek geselecteerde 4K-wandelingen, luchthavenwandelingen, nacht- en regenwandelingen, stranden, dronebeelden, streetfood, cultuur en natuur van over de hele wereld.'},
  pl:{title:'Old Towns Walks – Spacery 4K z Całego Świata',description:'Odkrywaj wybrane spacery 4K, spacery po lotniskach, nocne i deszczowe trasy, plaże, ujęcia z drona, street food, kulturę i przyrodę z całego świata.'},
  sv:{title:'Old Towns Walks – 4K-promenader från Hela Världen',description:'Upptäck utvalda 4K-promenader, flygplatspromenader, natt- och regnpromenader, stränder, drönarvyer, street food, kultur och natur från hela världen.'},
  id:{title:'Old Towns Walks – Tur Jalan Kaki 4K dari Seluruh Dunia',description:'Jelajahi tur jalan kaki 4K pilihan, jelajah bandara, perjalanan malam dan hujan, pantai, pemandangan drone, kuliner jalanan, budaya, dan alam dari seluruh dunia.'},
  vi:{title:'Old Towns Walks – Tour Đi Bộ 4K Khắp Thế Giới',description:'Khám phá các tour đi bộ 4K tuyển chọn, đi bộ sân bay, hành trình đêm và mưa, bãi biển, góc nhìn flycam, ẩm thực đường phố, văn hóa và thiên nhiên trên khắp thế giới.'}
};

function normalizeLang(lang?: string): Lang {
  const candidate = (lang || 'en') as Lang;
  return supportedLangs.includes(candidate) ? candidate : 'en';
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

export function cleanTitle(title: string) {
  return String(title || '')
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
  'walking tour','walk tour','city walk','street walk','walking','walk','tour','virtual','video',
  'complete','true','full','relaxing','relaxation','cinematic','day & night street views',
  'day and night street views','street views','day & night','day and night','1 hour','2 hour',
  '3 hour','4 hour','5 hour','1-hour','2-hour','3-hour','4-hour','5-hour'
];

function stripSeoNoise(value: string) {
  let out = value;

  for (const word of seoNoise) {
    out = out.replace(new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi'), ' ');
  }

  return out
    .replace(/\b(?:through|around|explore|exploring)\b/gi, ' ')
    .replace(/\s*[-–—,:/]\s*/g, ' ')
    .replace(/\s*\|\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectFeature(title: string, category?: string) {
  const t = String(title || '').toLowerCase();

  if (
    category === 'Drone & Aerial' ||
    /\b(?:drone|aerial|fpv|from above|flying over|fly over)\b/.test(t)
  ) {
    return 'drone';
  }

  if (
    category === 'Airport Walks' ||
    /\b(?:airport|terminal\s*\d*|lax|jfk|lhr|dxb|hnd|nrt|kix|cdg|ams|fra|sin)\b/.test(t)
  ) {
    return 'airport';
  }

  if (category === 'Beach Walking Tours') return 'beach';
  if (category === 'Street Food') return 'food';
  if (category === 'Nature Trails') return 'nature';
  if (category === 'Museums & Culture') return 'culture';
  if (category === 'POV Rides') return 'pov';
  if (category === 'Documentaries') return 'documentary';

  if (
    /\b(?:rainy|rain|heavy rain|storm|raining|wet streets?)\b/.test(t) &&
    /\b(?:night|nighttime|after dark|midnight|evening|blue hour)\b/.test(t)
  ) {
    return 'rainNight';
  }

  if (/\b(?:cherry blossom|cherry blossoms|sakura)\b/.test(t)) return 'cherry';
  if (/\b(?:snow|snowy|snowfall)\b/.test(t)) return 'snow';
  if (/\b(?:rainy|rain|heavy rain|storm|raining|wet streets?)\b/.test(t)) return 'rain';
  if (/\b(?:night|nighttime|after dark|midnight)\b/.test(t)) return 'night';

  return 'walk';
}

const featureNames: Record<string, Record<string, string>> = {
  walk:{
    en:'Walking Tour',tr:'Yürüyüş Turu',de:'Stadtrundgang',es:'Recorrido a Pie',it:'Tour a Piedi',
    fr:'Visite à Pied',ja:'街歩き',pt:'Passeio a Pé',ru:'Пешеходная прогулка',zh:'徒步之旅',
    ko:'도보 여행',ar:'جولة مشي',hi:'पैदल यात्रा',nl:'Stadswandeling',pl:'Spacer po Mieście',
    sv:'Stadsvandring',id:'Tur Jalan Kaki',vi:'Tour Đi Bộ'
  },
  airport:{
    en:'Airport Walk',tr:'Havalimanı Yürüyüşü',de:'Flughafen-Spaziergang',es:'Paseo por el Aeropuerto',
    it:'Passeggiata in Aeroporto',fr:'Promenade dans l’Aéroport',ja:'空港ウォーク',pt:'Caminhada no Aeroporto',
    ru:'Прогулка по аэропорту',zh:'机场漫步',ko:'공항 산책',ar:'جولة في المطار',hi:'एयरपोर्ट वॉक',
    nl:'Luchthavenwandeling',pl:'Spacer po Lotnisku',sv:'Flygplatspromenad',id:'Jelajah Bandara',vi:'Đi Bộ Sân Bay'
  },
  beach:{
    en:'Beach Walking Tour',tr:'Plaj Yürüyüş Turu',de:'Strandspaziergang',es:'Paseo por la Playa',
    it:'Passeggiata in Spiaggia',fr:'Balade sur la Plage',ja:'ビーチウォーク',pt:'Caminhada na Praia',
    ru:'Прогулка по пляжу',zh:'海滩漫步',ko:'해변 산책',ar:'جولة مشي على الشاطئ',hi:'समुद्र तट की सैर',
    nl:'Strandwandeling',pl:'Spacer po Plaży',sv:'Strandpromenad',id:'Jalan-jalan di Pantai',vi:'Đi Bộ Trên Bãi Biển'
  },
  night:{
    en:'Night Walking Tour',tr:'Gece Yürüyüş Turu',de:'Nachtspaziergang',es:'Recorrido Nocturno a Pie',
    it:'Passeggiata Notturna',fr:'Balade Nocturne',ja:'夜の街歩き',pt:'Caminhada Noturna',
    ru:'Ночная прогулка',zh:'夜间徒步',ko:'야간 도보 여행',ar:'جولة مشي ليلية',hi:'रात की पैदल यात्रा',
    nl:'Nachtwandeling',pl:'Nocny Spacer',sv:'Nattpromenad',id:'Tur Jalan Malam',vi:'Tour Đi Bộ Ban Đêm'
  },
  rain:{
    en:'Rain Walking Tour',tr:'Yağmurlu Yürüyüş Turu',de:'Regenspaziergang',es:'Recorrido a Pie bajo la Lluvia',
    it:'Passeggiata sotto la Pioggia',fr:'Balade sous la Pluie',ja:'雨の街歩き',pt:'Caminhada na Chuva',
    ru:'Прогулка под дождём',zh:'雨中徒步',ko:'빗속 도보 여행',ar:'جولة مشي تحت المطر',
    hi:'बारिश में पैदल यात्रा',nl:'Regenwandeling',pl:'Spacer w Deszczu',sv:'Regnpromenad',
    id:'Tur Jalan Saat Hujan',vi:'Tour Đi Bộ Dưới Mưa'
  },
  rainNight:{
    en:'Rainy Night Walking Tour',tr:'Yağmurlu Gece Yürüyüş Turu',de:'Nächtlicher Regenspaziergang',
    es:'Recorrido Nocturno bajo la Lluvia',it:'Passeggiata Notturna sotto la Pioggia',
    fr:'Balade Nocturne sous la Pluie',ja:'雨の夜の街歩き',pt:'Caminhada Noturna na Chuva',
    ru:'Ночная прогулка под дождём',zh:'雨夜徒步',ko:'비 오는 밤 도보 여행',
    ar:'جولة مشي ليلية تحت المطر',hi:'बारिश में रात की पैदल यात्रा',nl:'Nachtelijke Regenwandeling',
    pl:'Nocny Spacer w Deszczu',sv:'Nattlig Regnpromenad',id:'Tur Jalan Malam Saat Hujan',vi:'Tour Đi Bộ Đêm Mưa'
  },
  cherry:{
    en:'Cherry Blossom Walking Tour',tr:'Kiraz Çiçekleri Yürüyüş Turu',de:'Kirschblüten-Spaziergang',
    es:'Paseo entre Cerezos en Flor',it:'Passeggiata tra i Ciliegi in Fiore',fr:'Balade sous les Cerisiers en Fleurs',
    ja:'桜の街歩き',pt:'Caminhada pelas Cerejeiras em Flor',ru:'Прогулка среди Сакуры',zh:'樱花徒步',
    ko:'벚꽃 도보 여행',ar:'جولة مشي بين أزهار الكرز',hi:'चेरी ब्लॉसम पैदल यात्रा',
    nl:'Kersenbloesemwandeling',pl:'Spacer wśród Kwitnących Wiśni',sv:'Körsbärsblomspromenad',
    id:'Tur Jalan Bunga Sakura',vi:'Tour Đi Bộ Ngắm Hoa Anh Đào'
  },
  snow:{
    en:'Snow Walking Tour',tr:'Karlı Yürüyüş Turu',de:'Schneespaziergang',es:'Recorrido a Pie con Nieve',
    it:'Passeggiata sulla Neve',fr:'Balade sous la Neige',ja:'雪の街歩き',pt:'Caminhada na Neve',
    ru:'Прогулка по снегу',zh:'雪中徒步',ko:'눈길 도보 여행',ar:'جولة مشي في الثلج',
    hi:'बर्फ में पैदल यात्रा',nl:'Sneeuwwandeling',pl:'Spacer po Śniegu',sv:'Snöpromenad',
    id:'Tur Jalan di Salju',vi:'Tour Đi Bộ Trong Tuyết'
  },
  drone:{
    en:'Drone & Aerial View',tr:'Drone & Hava Görüntüleri',de:'Drohnen- & Luftaufnahmen',es:'Vista Aérea con Dron',
    it:'Veduta Aerea con Drone',fr:'Vue Aérienne par Drone',ja:'ドローン空撮',pt:'Vista Aérea com Drone',
    ru:'Аэросъёмка с дрона',zh:'无人机航拍',ko:'드론 항공 영상',ar:'تصوير جوي بالطائرة المسيّرة',
    hi:'ड्रोन एरियल व्यू',nl:'Drone- & Luchtbeelden',pl:'Widok z Drona',sv:'Drönarvy',
    id:'Pemandangan Drone & Udara',vi:'Góc Nhìn Flycam'
  },
  food:{
    en:'Street Food Tour',tr:'Sokak Lezzetleri Turu',de:'Street-Food-Tour',es:'Tour de Comida Callejera',
    it:'Tour dello Street Food',fr:'Tour de Street Food',ja:'ストリートフード巡り',pt:'Tour de Comida de Rua',
    ru:'Тур по Уличной Еде',zh:'街头美食之旅',ko:'길거리 음식 투어',ar:'جولة أطعمة الشوارع',
    hi:'स्ट्रीट फूड टूर',nl:'Streetfoodtour',pl:'Wycieczka po Street Foodzie',sv:'Street Food-rundtur',
    id:'Tur Kuliner Jalanan',vi:'Tour Ẩm Thực Đường Phố'
  },
  nature:{
    en:'Nature Walking Tour',tr:'Doğa Yürüyüşü',de:'Naturwanderung',es:'Paseo por la Naturaleza',
    it:'Passeggiata nella Natura',fr:'Balade dans la Nature',ja:'自然散策',pt:'Caminhada na Natureza',
    ru:'Прогулка на Природе',zh:'自然徒步',ko:'자연 산책',ar:'نزهة في الطبيعة',
    hi:'प्रकृति की सैर',nl:'Natuurwandeling',pl:'Spacer Przyrodniczy',sv:'Naturvandring',
    id:'Jelajah Alam',vi:'Tour Đi Bộ Thiên Nhiên'
  },
  culture:{
    en:'Culture Walking Tour',tr:'Kültür Yürüyüş Turu',de:'Kultur-Spaziergang',es:'Recorrido Cultural a Pie',
    it:'Tour Culturale a Piedi',fr:'Balade Culturelle',ja:'文化散策',pt:'Passeio Cultural',
    ru:'Культурная прогулка',zh:'文化徒步',ko:'문화 도보 여행',ar:'جولة ثقافية سيرًا على الأقدام',
    hi:'सांस्कृतिक पैदल यात्रा',nl:'Culturele Wandeling',pl:'Spacer Kulturowy',sv:'Kulturpromenad',
    id:'Tur Jalan Budaya',vi:'Tour Đi Bộ Văn Hóa'
  },
  pov:{
    en:'POV Tour',tr:'POV Gezi Turu',de:'POV-Tour',es:'Recorrido POV',it:'Tour POV',fr:'Parcours POV',
    ja:'POVツアー',pt:'Passeio POV',ru:'POV-тур',zh:'POV之旅',ko:'POV 투어',ar:'جولة POV',
    hi:'POV टूर',nl:'POV-tour',pl:'Trasa POV',sv:'POV-tur',id:'Tur POV',vi:'Chuyến Đi POV'
  },
  documentary:{
    en:'Travel Documentary',tr:'Seyahat Belgeseli',de:'Reisedokumentation',es:'Documental de Viajes',
    it:'Documentario di Viaggio',fr:'Documentaire de Voyage',ja:'旅行ドキュメンタリー',
    pt:'Documentário de Viagem',ru:'Документальный фильм о путешествиях',zh:'旅行纪录片',
    ko:'여행 다큐멘터리',ar:'وثائقي سفر',hi:'यात्रा वृत्तचित्र',nl:'Reisdocumentaire',
    pl:'Dokument Podróżniczy',sv:'Resedokumentär',id:'Dokumenter Perjalanan',vi:'Phim Tài Liệu Du Lịch'
  }
};

const countryAliases: Array<{ code: string; names: string[] }> = [
  {code:'JP',names:['japan','japonya','japon']},
  {code:'TR',names:['turkey','türkiye','turkiye']},
  {code:'DE',names:['germany','deutschland']},
  {code:'FR',names:['france']},
  {code:'IT',names:['italy','italia']},
  {code:'ES',names:['spain','españa','espana']},
  {code:'PT',names:['portugal']},
  {code:'NL',names:['netherlands','holland']},
  {code:'BE',names:['belgium','belgique','belgië']},
  {code:'AT',names:['austria','österreich']},
  {code:'CH',names:['switzerland','schweiz','suisse']},
  {code:'GB',names:['united kingdom','uk','great britain','england','scotland','wales']},
  {code:'US',names:['united states','usa','united states of america']},
  {code:'CA',names:['canada']},
  {code:'MX',names:['mexico','méxico']},
  {code:'BR',names:['brazil','brasil']},
  {code:'AR',names:['argentina']},
  {code:'CL',names:['chile']},
  {code:'PE',names:['peru','perú']},
  {code:'CN',names:['china']},
  {code:'KR',names:['south korea','korea']},
  {code:'IN',names:['india']},
  {code:'ID',names:['indonesia']},
  {code:'VN',names:['vietnam','viet nam']},
  {code:'TH',names:['thailand']},
  {code:'MY',names:['malaysia']},
  {code:'SG',names:['singapore']},
  {code:'PH',names:['philippines']},
  {code:'AU',names:['australia']},
  {code:'NZ',names:['new zealand']},
  {code:'AE',names:['united arab emirates','uae']},
  {code:'SA',names:['saudi arabia']},
  {code:'EG',names:['egypt']},
  {code:'MA',names:['morocco']},
  {code:'GR',names:['greece']},
  {code:'HR',names:['croatia']},
  {code:'CZ',names:['czechia','czech republic']},
  {code:'PL',names:['poland']},
  {code:'SE',names:['sweden']},
  {code:'NO',names:['norway']},
  {code:'DK',names:['denmark']},
  {code:'FI',names:['finland']},
  {code:'IS',names:['iceland']},
  {code:'IE',names:['ireland']},
  {code:'RO',names:['romania']},
  {code:'HU',names:['hungary']},
  {code:'BG',names:['bulgaria']},
  {code:'RS',names:['serbia']},
  {code:'SI',names:['slovenia']},
  {code:'SK',names:['slovakia']},
  {code:'UA',names:['ukraine']},
  {code:'GE',names:['georgia']},
  {code:'QA',names:['qatar']},
  {code:'KW',names:['kuwait']},
  {code:'OM',names:['oman']},
  {code:'JO',names:['jordan']},
  {code:'IL',names:['israel']},
  {code:'ZA',names:['south africa']},
  {code:'TZ',names:['tanzania']},
  {code:'KE',names:['kenya']}
];

const englishRegionCodeMap = (() => {
  const map = new Map<string, string>();
  const display = new Intl.DisplayNames(['en'], { type: 'region' });

  for (let first = 65; first <= 90; first += 1) {
    for (let second = 65; second <= 90; second += 1) {
      const code = String.fromCharCode(first, second);
      const name = display.of(code);

      if (name && name !== code) {
        map.set(name.toLocaleLowerCase(), code);
      }
    }
  }

  for (const item of countryAliases) {
    for (const name of item.names) {
      map.set(name.toLocaleLowerCase(), item.code);
    }
  }

  return map;
})();

const countryMatchCache =
  new Map<string, { code: string; matched: string } | null>();

const locationCache =
  new Map<string, string>();

function regionName(code: string, lang: string) {
  try {
    return new Intl.DisplayNames(
      [lang],
      { type: 'region' }
    ).of(code) || code;
  } catch {
    return code;
  }
}

function findCountry(value: string) {
  const source = String(value || '');
  const cacheKey = source.toLocaleLowerCase();

  if (countryMatchCache.has(cacheKey)) {
    return countryMatchCache.get(cacheKey) || null;
  }

  const lower = cacheKey;

  for (const item of countryAliases) {
    for (const name of item.names) {
      if (
        new RegExp(
          `(^|[^\\p{L}])${escapeRegExp(name)}([^\\p{L}]|$)`,
          'iu'
        ).test(lower)
      ) {
        const result = {
          code: item.code,
          matched: name
        };

        countryMatchCache.set(
          cacheKey,
          result
        );

        return result;
      }
    }
  }

  const codes =
    source.match(/\b[A-Z]{2}\b/g) || [];

  const code =
    codes.find(
      (item) =>
        regionName(item, 'en') !== item
    );

  if (code) {
    const result = {
      code,
      matched: code
    };

    countryMatchCache.set(
      cacheKey,
      result
    );

    return result;
  }

  for (
    const [name, regionCode]
    of englishRegionCodeMap.entries()
  ) {
    if (
      new RegExp(
        `(^|[^\\p{L}])${escapeRegExp(name)}([^\\p{L}]|$)`,
        'iu'
      ).test(lower)
    ) {
      const result = {
        code: regionCode,
        matched: name
      };

      countryMatchCache.set(
        cacheKey,
        result
      );

      return result;
    }
  }

  countryMatchCache.set(
    cacheKey,
    null
  );

  return null;
}

function localizeCountry(
  value: string | undefined,
  lang: string
) {
  const cleaned =
    String(value || '').trim();

  if (!cleaned) {
    return '';
  }

  const directCode =
    /^[A-Z]{2}$/i.test(cleaned)
      ? cleaned.toUpperCase()
      : null;

  if (
    directCode &&
    regionName(directCode, 'en') !==
      directCode
  ) {
    return regionName(
      directCode,
      lang
    );
  }

  const mappedCode =
    englishRegionCodeMap.get(
      cleaned.toLocaleLowerCase()
    );

  if (mappedCode) {
    return regionName(
      mappedCode,
      lang
    );
  }

  const found =
    findCountry(cleaned);

  return found
    ? regionName(found.code, lang)
    : cleaned;
}

function removeFeatureWords(value: string) {
  return value
    .replace(
      /\b(?:rainy|rain|heavy rain|storm|night|evening|blue hour|snow|snowy|spring|cherry blossoms?|sakura|drone|aerial)\b/gi,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();
}



function normalizeCityCandidate(
  value: string
) {
  return String(value || '')
    .normalize('NFKC')
    .replace(
      /[\u{1F1E6}-\u{1F1FF}]{2}/gu,
      ' '
    )
    .replace(
      /[\p{Extended_Pictographic}\uFE0F]/gu,
      ' '
    )
    .replace(
      /\b20\d{2}\b/g,
      ' '
    )
    .replace(
      /\b\d+(?:\.\d+)?\s*°?\s*[CF]\b/gi,
      ' '
    )
    .replace(
      /\b\d+(?:\.\d+)?\s*[-–]?\s*(?:hours?|hrs?|hr|minutes?|mins?|min)\b/gi,
      ' '
    )
    .replace(
      /\b(?:hours?|hrs?|hr|minutes?|mins?|min)\b/gi,
      ' '
    )
    .replace(
      /\b(?:4k|8k|12k|hdr|uhd|ultra\s*hd|60\s*fps|120\s*fps|asmr)\b/gi,
      ' '
    )
    .replace(
      /\b(?:walking\s+tour|walk\s+tour|city\s+walk|street\s+walk|walking|walk|tour|virtual|video|film|films|drone|aerial|footage|view|views|relaxation|relaxing|ambient|cinematic|immersive|captions?|sound|music|summer|winter|spring|autumn|heatwave|night|evening|rain|rainy|snow|snowy|flying\s+over|fly\s+over|from\s+above|tram|train|bus|bike|bicycle|car|drive|driving|ride|riding|attractions?|sights?|in|at|around|through)\b/gi,
      ' '
    )
    .replace(
      /[()[\]{}<>【】|:;,/\\]+/g,
      ' '
    )
    .replace(
      /\b(?:one|two|three|four|five|six|seven|eight|nine|ten)\b/gi,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}

function chooseCityCandidate(
  candidate: string,
  original: string
) {
  const words =
    candidate
      .split(/\s+/)
      .filter(Boolean);

  if (
    !words.length ||
    words.length > 4
  ) {
    return '';
  }

  if (
    words.length >= 2
  ) {
    const lowerOriginal =
      original.toLocaleLowerCase();

    const counts =
      words.map(
        (word) => ({
          word,
          count:
            (
              lowerOriginal.match(
                new RegExp(
                  `\\b${escapeRegExp(word.toLocaleLowerCase())}\\b`,
                  'giu'
                )
              ) ||
              []
            ).length
        })
      );

    const repeated =
      counts
        .filter(
          (item) =>
            item.count >= 2
        )
        .sort(
          (a, b) =>
            b.count -
            a.count
        );

    if (
      repeated.length === 1
    ) {
      return repeated[0].word;
    }
  }

  return candidate;
}

function inferCityFromTitle(
  title: string,
  countryMatch?: string | null
) {
  const original =
    String(title || '')
      .normalize('NFKC');

  const cleaned =
    cleanTitle(original);

  if (countryMatch) {
    const index =
      cleaned
        .toLocaleLowerCase()
        .indexOf(
          countryMatch
            .toLocaleLowerCase()
        );

    if (index > 0) {
      const beforeCountry =
        normalizeCityCandidate(
          cleaned.slice(
            0,
            index
          )
        );

      const selected =
        chooseCityCandidate(
          beforeCountry,
          original
        );

      if (selected) {
        return selected;
      }
    }
  }

  const segments =
    original
      .replace(
        /[•·]/g,
        ' | '
      )
      .split(
        /\s+\|\s+|\s+[–—]\s+|\s+-\s+|,\s*/
      )
      .map(
        (segment) =>
          normalizeCityCandidate(
            segment
          )
      )
      .filter(Boolean);

  for (
    const segment
    of segments
  ) {
    const selected =
      chooseCityCandidate(
        segment,
        original
      );

    if (selected) {
      return selected;
    }
  }

  const evidencePatterns = [
    /\b(?:aerial|flying\s+over|fly\s+over|walk\s+in|walking\s+in|walk\s+through|walking\s+through|walk\s+around|walking\s+around|in|at)\s+([^|–—-]{2,60})/iu,
    /\bdrone\s+([^|–—-]{2,45})/iu,
    /([^|–—-]{2,60})\s+(?:walking\s+tour|city\s+walk|street\s+walk|walk|drone|aerial)\b/iu
  ];

  for (
    const pattern
    of evidencePatterns
  ) {
    const match =
      original.match(pattern);

    if (!match?.[1]) {
      continue;
    }

    const candidate =
      normalizeCityCandidate(
        match[1]
      );

    const selected =
      chooseCityCandidate(
        candidate,
        original
      );

    if (selected) {
      return selected;
    }
  }

  return '';
}

function getLocationLabel(
  video: Video,
  lang: string
) {
  const cacheKey =
    `${video.id}|${lang}|${video.city || ''}|${video.country || ''}`;

  if (locationCache.has(cacheKey)) {
    return locationCache.get(cacheKey) || '';
  }

  const city =
    String(video.city || '').trim();

  const country =
    localizeCountry(
      video.country,
      lang
    );

  const samePlace =
    city &&
    country &&
    city
      .toLocaleLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '') ===
    country
      .toLocaleLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '');

  let result = '';

  if (city && country) {
    result =
      samePlace
        ? country
        : `${city}, ${country}`;
  } else if (city) {
    result = city;
  } else if (country) {
    result = country;
  } else {
    const original =
      cleanTitle(video.title);

    const foundCountry =
      findCountry(original);

    const inferredCity =
      inferCityFromTitle(
        original,
        foundCountry?.matched || null
      );

    if (
      inferredCity &&
      foundCountry
    ) {
      const localizedCountry =
        regionName(
          foundCountry.code,
          lang
        );

      const inferredNormalized =
        inferredCity
          .toLocaleLowerCase()
          .replace(
            /[^\p{L}\p{N}]+/gu,
            ''
          );

      const countryNormalized =
        localizedCountry
          .toLocaleLowerCase()
          .replace(
            /[^\p{L}\p{N}]+/gu,
            ''
          );

      result =
        inferredNormalized ===
        countryNormalized
          ? localizedCountry
          : `${inferredCity}, ${localizedCountry}`;
    } else if (inferredCity) {
      result = inferredCity;
    } else if (foundCountry) {
      result =
        regionName(
          foundCountry.code,
          lang
        );
    }
  }

  locationCache.set(
    cacheKey,
    result
  );

  return result;
}

type DetailType =
  | 'crossing'
  | 'luxuryShoppingDistrict'
  | 'shoppingDistrict'
  | 'templeArea'
  | 'historicDistrict'
  | 'oldTown'
  | 'cityCenter'
  | 'electricTown'
  | 'waterfront'
  | 'bazaar'
  | 'market'
  | 'airportTerminal'
  | 'terminalNumber'
  | 'trainStation'
  | 'metroStation'
  | 'station'
  | 'square'
  | 'street'
  | 'avenue'
  | 'boulevard'
  | 'park'
  | 'beach'
  | 'museum'
  | 'temple'
  | 'neighborhood'
  | 'promenade'
  | 'district';

type Detail = {
  name: string;
  type?: DetailType;
  score: number;
};

const detailTemplates:
Record<
  DetailType,
  Record<string, string>
> = {
  crossing:{
    en:'{name} Crossing',tr:'{name} Kavşağı',de:'{name}-Kreuzung',es:'Cruce de {name}',
    it:'Incrocio di {name}',fr:'Carrefour de {name}',ja:'{name}交差点',pt:'Cruzamento de {name}',
    ru:'Перекрёсток {name}',zh:'{name}十字路口',ko:'{name} 교차로',ar:'تقاطع {name}',
    hi:'{name} चौराहा',nl:'Kruising {name}',pl:'Skrzyżowanie {name}',sv:'{name}-korsningen',
    id:'Persimpangan {name}',vi:'Ngã tư {name}'
  },

  luxuryShoppingDistrict:{
    en:'{name} Luxury Shopping District',tr:'{name} Lüks Alışveriş Bölgesi',
    de:'Luxus-Einkaufsviertel {name}',es:'Distrito Comercial de Lujo de {name}',
    it:'Quartiere dello Shopping di Lusso di {name}',fr:'Quartier du Shopping de Luxe de {name}',
    ja:'{name}高級ショッピング地区',pt:'Distrito de Compras de Luxo de {name}',
    ru:'Район люксового шопинга {name}',zh:'{name}奢华购物区',
    ko:'{name} 명품 쇼핑 지구',ar:'منطقة التسوق الفاخر في {name}',
    hi:'{name} लक्ज़री खरीदारी क्षेत्र',nl:'Luxe Winkelwijk {name}',
    pl:'Luksusowa Dzielnica Handlowa {name}',sv:'Lyxshoppingdistriktet {name}',
    id:'Distrik Belanja Mewah {name}',vi:'Khu Mua Sắm Cao Cấp {name}'
  },

  shoppingDistrict:{
    en:'{name} Shopping District',tr:'{name} Alışveriş Bölgesi',
    de:'Einkaufsviertel {name}',es:'Distrito Comercial de {name}',
    it:'Quartiere dello Shopping di {name}',fr:'Quartier Commerçant de {name}',
    ja:'{name}ショッピング地区',pt:'Distrito Comercial de {name}',
    ru:'Торговый район {name}',zh:'{name}购物区',ko:'{name} 쇼핑 지구',
    ar:'منطقة التسوق في {name}',hi:'{name} खरीदारी क्षेत्र',
    nl:'Winkelwijk {name}',pl:'Dzielnica Handlowa {name}',
    sv:'Shoppingdistriktet {name}',id:'Distrik Belanja {name}',vi:'Khu Mua Sắm {name}'
  },

  templeArea:{
    en:'{name} Temple Area',tr:'{name} Tapınak Bölgesi',de:'Tempelviertel {name}',
    es:'Zona del Templo de {name}',it:'Area del Tempio di {name}',
    fr:'Quartier du Temple de {name}',ja:'{name}寺院エリア',
    pt:'Área do Templo de {name}',ru:'Район храма {name}',zh:'{name}寺庙区',
    ko:'{name} 사원 지역',ar:'منطقة معبد {name}',hi:'{name} मंदिर क्षेत्र',
    nl:'Tempelgebied {name}',pl:'Okolice Świątyni {name}',
    sv:'Tempelområdet {name}',id:'Area Kuil {name}',vi:'Khu Đền {name}'
  },

  historicDistrict:{
    en:'{name} Historic District',tr:'{name} Tarihi Bölgesi',
    de:'Historisches Viertel {name}',es:'Distrito Histórico de {name}',
    it:'Quartiere Storico di {name}',fr:'Quartier Historique de {name}',
    ja:'{name}歴史地区',pt:'Distrito Histórico de {name}',
    ru:'Исторический район {name}',zh:'{name}历史街区',ko:'{name} 역사 지구',
    ar:'الحي التاريخي في {name}',hi:'{name} ऐतिहासिक जिला',
    nl:'Historische Wijk {name}',pl:'Historyczna Dzielnica {name}',
    sv:'Historiska distriktet {name}',id:'Distrik Bersejarah {name}',
    vi:'Khu Phố Lịch Sử {name}'
  },

  oldTown:{
    en:'{name} Old Town',tr:'{name} Eski Şehir',de:'Altstadt {name}',
    es:'Casco Antiguo de {name}',it:'Centro Storico di {name}',
    fr:'Vieille Ville de {name}',ja:'{name}旧市街',pt:'Centro Histórico de {name}',
    ru:'Старый город {name}',zh:'{name}老城区',ko:'{name} 구시가지',
    ar:'البلدة القديمة في {name}',hi:'{name} पुराना शहर',nl:'Oude Stad {name}',
    pl:'Stare Miasto {name}',sv:'Gamla stan i {name}',
    id:'Kota Tua {name}',vi:'Phố Cổ {name}'
  },

  cityCenter:{
    en:'{name} City Center',tr:'{name} Şehir Merkezi',de:'Stadtzentrum {name}',
    es:'Centro de {name}',it:'Centro di {name}',fr:'Centre-ville de {name}',
    ja:'{name}中心部',pt:'Centro de {name}',ru:'Центр города {name}',
    zh:'{name}市中心',ko:'{name} 도심',ar:'وسط مدينة {name}',
    hi:'{name} सिटी सेंटर',nl:'Stadscentrum {name}',pl:'Centrum {name}',
    sv:'Centrala {name}',id:'Pusat Kota {name}',vi:'Trung Tâm {name}'
  },

  electricTown:{
    en:'{name} Electric Town',tr:'{name} Elektronik Bölgesi',
    de:'Elektronikviertel {name}',es:'Distrito Electrónico de {name}',
    it:'Quartiere dell’Elettronica di {name}',fr:'Quartier de l’Électronique de {name}',
    ja:'{name}電気街',pt:'Distrito de Eletrônicos de {name}',
    ru:'Район электроники {name}',zh:'{name}电器街',
    ko:'{name} 전자상가',ar:'حي الإلكترونيات في {name}',
    hi:'{name} इलेक्ट्रॉनिक्स क्षेत्र',nl:'Elektronicawijk {name}',
    pl:'Dzielnica Elektroniki {name}',sv:'Elektronikdistriktet {name}',
    id:'Distrik Elektronik {name}',vi:'Khu Điện Tử {name}'
  },

  waterfront:{
    en:'{name} Waterfront',tr:'{name} Sahili',de:'Uferpromenade {name}',
    es:'Paseo Marítimo de {name}',it:'Lungomare di {name}',
    fr:'Front de Mer de {name}',ja:'{name}ウォーターフロント',
    pt:'Orla de {name}',ru:'Набережная {name}',zh:'{name}滨水区',
    ko:'{name} 워터프런트',ar:'واجهة {name} البحرية',
    hi:'{name} तटीय क्षेत्र',nl:'Waterkant van {name}',
    pl:'Nabrzeże {name}',sv:'Vattnet vid {name}',
    id:'Tepi Laut {name}',vi:'Bờ Biển {name}'
  },

  bazaar:{
    en:'{name} Bazaar',tr:'{name} Çarşısı',de:'Basar {name}',
    es:'Bazar de {name}',it:'Bazar di {name}',fr:'Bazar de {name}',
    ja:'{name}バザール',pt:'Bazar de {name}',ru:'Базар {name}',
    zh:'{name}集市',ko:'{name} 바자르',ar:'بازار {name}',
    hi:'{name} बाज़ार',nl:'Bazaar {name}',pl:'Bazar {name}',
    sv:'Basaren {name}',id:'Bazar {name}',vi:'Chợ {name}'
  },

  market:{
    en:'{name} Market',tr:'{name} Pazarı',de:'Markt {name}',
    es:'Mercado de {name}',it:'Mercato di {name}',fr:'Marché de {name}',
    ja:'{name}市場',pt:'Mercado de {name}',ru:'Рынок {name}',
    zh:'{name}市场',ko:'{name} 시장',ar:'سوق {name}',
    hi:'{name} बाज़ार',nl:'Markt {name}',pl:'Targ {name}',
    sv:'Marknaden {name}',id:'Pasar {name}',vi:'Chợ {name}'
  },

  airportTerminal:{
    en:'{name} Airport Terminal',tr:'{name} Havalimanı Terminali',
    de:'Flughafenterminal {name}',es:'Terminal del Aeropuerto {name}',
    it:'Terminal Aeroportuale {name}',fr:'Terminal Aéroportuaire {name}',
    ja:'{name}空港ターミナル',pt:'Terminal do Aeroporto {name}',
    ru:'Терминал аэропорта {name}',zh:'{name}机场航站楼',
    ko:'{name} 공항 터미널',ar:'مبنى مطار {name}',
    hi:'{name} एयरपोर्ट टर्मिनल',nl:'Luchthaventerminal {name}',
    pl:'Terminal Lotniska {name}',sv:'Flygplatsterminalen {name}',
    id:'Terminal Bandara {name}',vi:'Nhà Ga Sân Bay {name}'
  },

  terminalNumber:{
    en:'Terminal {name}',tr:'Terminal {name}',de:'Terminal {name}',
    es:'Terminal {name}',it:'Terminal {name}',fr:'Terminal {name}',
    ja:'ターミナル{name}',pt:'Terminal {name}',ru:'Терминал {name}',
    zh:'{name}号航站楼',ko:'터미널 {name}',ar:'المبنى {name}',
    hi:'टर्मिनल {name}',nl:'Terminal {name}',pl:'Terminal {name}',
    sv:'Terminal {name}',id:'Terminal {name}',vi:'Nhà Ga {name}'
  },

  trainStation:{
    en:'{name} Train Station',tr:'{name} Tren İstasyonu',de:'Bahnhof {name}',
    es:'Estación de Tren de {name}',it:'Stazione Ferroviaria di {name}',
    fr:'Gare de {name}',ja:'{name}駅',pt:'Estação de Trem de {name}',
    ru:'Железнодорожный вокзал {name}',zh:'{name}火车站',
    ko:'{name} 기차역',ar:'محطة قطار {name}',hi:'{name} रेलवे स्टेशन',
    nl:'Treinstation {name}',pl:'Dworzec Kolejowy {name}',
    sv:'Tågstationen {name}',id:'Stasiun Kereta {name}',vi:'Ga Tàu {name}'
  },

  metroStation:{
    en:'{name} Metro Station',tr:'{name} Metro İstasyonu',de:'U-Bahnhof {name}',
    es:'Estación de Metro de {name}',it:'Stazione Metro di {name}',
    fr:'Station de Métro {name}',ja:'{name}地下鉄駅',
    pt:'Estação de Metrô {name}',ru:'Станция метро {name}',
    zh:'{name}地铁站',ko:'{name} 지하철역',ar:'محطة مترو {name}',
    hi:'{name} मेट्रो स्टेशन',nl:'Metrostation {name}',
    pl:'Stacja Metra {name}',sv:'Tunnelbanestationen {name}',
    id:'Stasiun Metro {name}',vi:'Ga Metro {name}'
  },

  station:{
    en:'{name} Station',tr:'{name} İstasyonu',de:'Station {name}',
    es:'Estación de {name}',it:'Stazione di {name}',fr:'Station {name}',
    ja:'{name}駅',pt:'Estação de {name}',ru:'Станция {name}',
    zh:'{name}站',ko:'{name}역',ar:'محطة {name}',
    hi:'{name} स्टेशन',nl:'Station {name}',pl:'Stacja {name}',
    sv:'Stationen {name}',id:'Stasiun {name}',vi:'Ga {name}'
  },

  square:{
    en:'{name} Square',tr:'{name} Meydanı',de:'{name}-Platz',
    es:'Plaza {name}',it:'Piazza {name}',fr:'Place {name}',
    ja:'{name}広場',pt:'Praça {name}',ru:'Площадь {name}',
    zh:'{name}广场',ko:'{name} 광장',ar:'ساحة {name}',
    hi:'{name} चौक',nl:'Plein {name}',pl:'Plac {name}',
    sv:'{name}-torget',id:'Alun-Alun {name}',vi:'Quảng Trường {name}'
  },

  street:{
    en:'{name} Street',tr:'{name} Sokağı',de:'{name}-Straße',
    es:'Calle {name}',it:'Via {name}',fr:'Rue {name}',
    ja:'{name}通り',pt:'Rua {name}',ru:'Улица {name}',
    zh:'{name}街',ko:'{name} 거리',ar:'شارع {name}',
    hi:'{name} सड़क',nl:'{name}straat',pl:'Ulica {name}',
    sv:'{name}-gatan',id:'Jalan {name}',vi:'Phố {name}'
  },

  avenue:{
    en:'{name} Avenue',tr:'{name} Caddesi',de:'{name}-Allee',
    es:'Avenida {name}',it:'Viale {name}',fr:'Avenue {name}',
    ja:'{name}大通り',pt:'Avenida {name}',ru:'Проспект {name}',
    zh:'{name}大道',ko:'{name} 애비뉴',ar:'جادة {name}',
    hi:'{name} एवेन्यू',nl:'Laan {name}',pl:'Aleja {name}',
    sv:'{name}-avenyn',id:'Avenue {name}',vi:'Đại Lộ {name}'
  },

  boulevard:{
    en:'{name} Boulevard',tr:'{name} Bulvarı',de:'{name}-Boulevard',
    es:'Bulevar {name}',it:'Boulevard {name}',fr:'Boulevard {name}',
    ja:'{name}大通り',pt:'Boulevard {name}',ru:'Бульвар {name}',
    zh:'{name}大道',ko:'{name} 대로',ar:'بوليفارد {name}',
    hi:'{name} बुलेवार्ड',nl:'Boulevard {name}',pl:'Bulwar {name}',
    sv:'{name}-boulevarden',id:'Bulevar {name}',vi:'Đại Lộ {name}'
  },

  park:{
    en:'{name} Park',tr:'{name} Parkı',de:'{name}-Park',
    es:'Parque {name}',it:'Parco {name}',fr:'Parc {name}',
    ja:'{name}公園',pt:'Parque {name}',ru:'Парк {name}',
    zh:'{name}公园',ko:'{name} 공원',ar:'حديقة {name}',
    hi:'{name} पार्क',nl:'Park {name}',pl:'Park {name}',
    sv:'{name}-parken',id:'Taman {name}',vi:'Công Viên {name}'
  },

  beach:{
    en:'{name} Beach',tr:'{name} Plajı',de:'Strand {name}',
    es:'Playa {name}',it:'Spiaggia {name}',fr:'Plage {name}',
    ja:'{name}ビーチ',pt:'Praia {name}',ru:'Пляж {name}',
    zh:'{name}海滩',ko:'{name} 해변',ar:'شاطئ {name}',
    hi:'{name} बीच',nl:'Strand {name}',pl:'Plaża {name}',
    sv:'Stranden {name}',id:'Pantai {name}',vi:'Bãi Biển {name}'
  },

  museum:{
    en:'{name} Museum',tr:'{name} Müzesi',de:'Museum {name}',
    es:'Museo {name}',it:'Museo {name}',fr:'Musée {name}',
    ja:'{name}博物館',pt:'Museu {name}',ru:'Музей {name}',
    zh:'{name}博物馆',ko:'{name} 박물관',ar:'متحف {name}',
    hi:'{name} संग्रहालय',nl:'Museum {name}',pl:'Muzeum {name}',
    sv:'Museet {name}',id:'Museum {name}',vi:'Bảo Tàng {name}'
  },

  temple:{
    en:'{name} Temple',tr:'{name} Tapınağı',de:'Tempel {name}',
    es:'Templo {name}',it:'Tempio {name}',fr:'Temple {name}',
    ja:'{name}寺',pt:'Templo {name}',ru:'Храм {name}',
    zh:'{name}寺',ko:'{name} 사원',ar:'معبد {name}',
    hi:'{name} मंदिर',nl:'Tempel {name}',pl:'Świątynia {name}',
    sv:'Templet {name}',id:'Kuil {name}',vi:'Đền {name}'
  },

  neighborhood:{
    en:'{name} Neighborhood',tr:'{name} Mahallesi',de:'Viertel {name}',
    es:'Barrio {name}',it:'Quartiere {name}',fr:'Quartier {name}',
    ja:'{name}地区',pt:'Bairro {name}',ru:'Район {name}',
    zh:'{name}街区',ko:'{name} 동네',ar:'حي {name}',
    hi:'{name} पड़ोस',nl:'Wijk {name}',pl:'Dzielnica {name}',
    sv:'Området {name}',id:'Lingkungan {name}',vi:'Khu Phố {name}'
  },

  promenade:{
    en:'{name} Promenade',tr:'{name} Gezinti Yolu',de:'Promenade {name}',
    es:'Paseo de {name}',it:'Passeggiata di {name}',fr:'Promenade de {name}',
    ja:'{name}遊歩道',pt:'Calçadão de {name}',ru:'Променад {name}',
    zh:'{name}步道',ko:'{name} 산책로',ar:'ممشى {name}',
    hi:'{name} प्रोमेनेड',nl:'Promenade {name}',pl:'Promenada {name}',
    sv:'Promenaden {name}',id:'Promenade {name}',vi:'Lối Dạo {name}'
  },

  district:{
    en:'{name} District',tr:'{name} Bölgesi',de:'Viertel {name}',
    es:'Distrito {name}',it:'Quartiere {name}',fr:'Quartier {name}',
    ja:'{name}地区',pt:'Distrito {name}',ru:'Район {name}',
    zh:'{name}区',ko:'{name} 지구',ar:'منطقة {name}',
    hi:'{name} जिला',nl:'District {name}',pl:'Dzielnica {name}',
    sv:'Distriktet {name}',id:'Distrik {name}',vi:'Khu {name}'
  }
};

const detailPatterns:
Array<{
  type: DetailType;
  regex: RegExp;
  score: number;
}> = [
  {
    type:'luxuryShoppingDistrict',
    regex:/^(.+?)(?:['’]s)?\s+luxury\s+shopping\s+district$/iu,
    score:120
  },
  {
    type:'shoppingDistrict',
    regex:/^(.+?)(?:['’]s)?\s+shopping\s+district$/iu,
    score:118
  },
  {
    type:'templeArea',
    regex:/^(.+?)\s+temple\s+area$/iu,
    score:116
  },
  {
    type:'historicDistrict',
    regex:/^(.+?)\s+historic(?:al)?\s+district$/iu,
    score:114
  },
  {
    type:'oldTown',
    regex:/^(.+?)\s+old\s+town$/iu,
    score:112
  },
  {
    type:'cityCenter',
    regex:/^(.+?)\s+city\s+cent(?:er|re)$/iu,
    score:110
  },
  {
    type:'electricTown',
    regex:/^(.+?)\s+electric\s+town$/iu,
    score:108
  },
  {
    type:'airportTerminal',
    regex:/^(.+?)\s+airport\s+terminal(?:\s+\d+[a-z]?)?$/iu,
    score:106
  },
  {
    type:'trainStation',
    regex:/^(.+?)\s+train\s+station$/iu,
    score:104
  },
  {
    type:'metroStation',
    regex:/^(.+?)\s+(?:metro|subway|underground)\s+station$/iu,
    score:104
  },
  {
    type:'waterfront',
    regex:/^(.+?)\s+waterfront$/iu,
    score:102
  },
  {
    type:'neighborhood',
    regex:/^(.+?)\s+neighbou?rhood$/iu,
    score:100
  },
  {
    type:'promenade',
    regex:/^(.+?)\s+promenade$/iu,
    score:98
  },
  {
    type:'boulevard',
    regex:/^(.+?)\s+boulevard$/iu,
    score:98
  },
  {
    type:'avenue',
    regex:/^(.+?)\s+avenue$/iu,
    score:98
  },
  {
    type:'street',
    regex:/^(.+?)\s+street$/iu,
    score:98
  },
  {
    type:'crossing',
    regex:/^(.+?)\s+crossing$/iu,
    score:96
  },
  {
    type:'bazaar',
    regex:/^(.+?)\s+bazaar$/iu,
    score:96
  },
  {
    type:'market',
    regex:/^(.+?)\s+market$/iu,
    score:96
  },
  {
    type:'station',
    regex:/^(.+?)\s+station$/iu,
    score:94
  },
  {
    type:'park',
    regex:/^(.+?)\s+park$/iu,
    score:94
  },
  {
    type:'square',
    regex:/^(.+?)\s+square$/iu,
    score:94
  },
  {
    type:'museum',
    regex:/^(.+?)\s+museum$/iu,
    score:94
  },
  {
    type:'temple',
    regex:/^(.+?)\s+temple$/iu,
    score:94
  },
  {
    type:'beach',
    regex:/^(.+?)\s+beach$/iu,
    score:94
  },
  {
    type:'district',
    regex:/^(.+?)\s+district$/iu,
    score:92
  },
  {
    type:'terminalNumber',
    regex:/^terminal\s+([0-9]+[a-z]?(?:\s*[-–]\s*[0-9]+[a-z]?)?)$/iu,
    score:92
  }
];

const weakWords = new Set([
  'best','ultimate','amazing','incredible','iconic',
  'discovery','discover','discovering','explore','exploring',
  'suburban','vibe','vibes','natural','record','breaking',
  'must','see','world','worlds','why','how','this','that',
  'feels','feel','looks','look','hour','hours','hr','hrs',
  'minute','minutes','complete','true','full',
  'day','night','rain','rainy','snow','snowy',
  'spring','summer','autumn','winter','hot','scorching','heatwave',
  'beautiful','famous','popular','top','hidden',
  'streets','street','city','travel','experience',
  'relaxing','relaxation','cinematic','virtual','ambient','ambience',
  'view','views','film','films','video','videos','tour','tours',
  'walk','walking','drone','aerial','footage','hdr','uhd','ultra','hd',
  'fps','4k','8k','12k','60fps','120fps','pov','sound','sounds',
  'immersive','caption','captions','journey','music','focus','tv',
  'style','scenic','flying','flight','from','above',
  'january','february','march','april','may','june','july','august','september','october','november','december',
  'jan','feb','mar','apr','jun','jul','aug','sep','sept','oct','nov','dec',
  'heavy','thunderstorm','thunderstorms','wind','winds','windy','wet',
  'compilation','collection'
]);

const untranslatedGenericWords =
  /\b(?:crossing|district|temple|area|market|waterfront|old town|airport|terminal|station|square|street|avenue|boulevard|park|beach|museum|neighborhood|neighbourhood|promenade|bazaar)\b/i;

function cleanDetailText(value: string) {
  return String(value || '')
    .normalize('NFKC')
    .replace(
      /[\u{1F1E6}-\u{1F1FF}]{2}/gu,
      ' '
    )
    .replace(
      /[\p{Extended_Pictographic}\uFE0F]/gu,
      ' '
    )
    .replace(
      /[{}\[\]<>]/g,
      ' '
    )
    .replace(
      /[“”]/g,
      '"'
    )
    .replace(
      /[‘’]/g,
      "'"
    )
    .replace(
      /(?:\?|}|�)\s*s\b/gi,
      "'s"
    )
    .replace(
      /\b20\d{2}\b/g,
      ' '
    )
    .replace(
      /\b\d+(?:\.\d+)?\s*(?:hours?|hrs?|minutes?|mins?)\b/gi,
      ' '
    )
    .replace(
      /\b(?:4k|8k|hdr|uhd|60fps|60\s*fps|ultra\s*hd|asmr|no\s*talking|captions?)\b/gi,
      ' '
    )
    .replace(
      /[#@][\p{L}\p{N}_-]+/gu,
      ' '
    )
    .replace(/\s+/g, ' ')
    .replace(
      /^\s*[|:;,\-–—&]+|[|:;,\-–—&]+\s*$/g,
      ''
    )
    .trim();
}

function removeLiteral(
  value: string,
  literal?: string
) {
  const cleaned =
    String(literal || '').trim();

  if (!cleaned) {
    return value;
  }

  return value.replace(
    new RegExp(
      `(^|[^\\p{L}\\p{N}])${escapeRegExp(cleaned)}(?=$|[^\\p{L}\\p{N}])`,
      'giu'
    ),
    ' '
  );
}

function normalizeDetailName(value: string) {
  return cleanDetailText(value)
    .replace(
      /^['’]?s\s+/i,
      ' '
    )
    .replace(
      /(?:['’]s)\s*$/iu,
      ''
    )
    .replace(
      /^\s*(?:in|at|from|to|the)\s+/iu,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim();
}

function isSafeProperName(value: string) {
  const cleaned =
    normalizeDetailName(value);

  if (
    cleaned.length < 2 ||
    cleaned.length > 38
  ) {
    return false;
  }

  if (
    /[!?]/.test(cleaned) ||
    /\d{4}/.test(cleaned)
  ) {
    return false;
  }

  if (
    untranslatedGenericWords
      .test(cleaned)
  ) {
    return false;
  }

  const words =
    cleaned
      .split(/\s+/)
      .filter(
        (word) =>
          word &&
          word !== '&'
      );

  if (
    !words.length ||
    words.length > 5
  ) {
    return false;
  }

  const lowerWords =
    words.map(
      (word) =>
        word
          .toLocaleLowerCase()
          .replace(
            /[^\p{L}\p{N}]/gu,
            ''
          )
    );

  if (
    lowerWords.some(
      (word) =>
        weakWords.has(word)
    )
  ) {
    return false;
  }

  return words.every(
    (word) =>
      /^[\p{L}\p{M}\p{N}'’.\-&]+$/u
        .test(word)
  );
}

function parseDetail(
  value: string,
  baseScore = 0
): Detail | null {
  const cleaned =
    cleanDetailText(value);

  if (!cleaned) {
    return null;
  }

  for (
    const pattern
    of detailPatterns
  ) {
    const match =
      cleaned.match(
        pattern.regex
      );

    if (match?.[1]) {
      const name =
        normalizeDetailName(
          match[1]
        );

      if (
        pattern.type ===
        'terminalNumber'
      ) {
        return {
          name,
          type: pattern.type,
          score:
            pattern.score +
            baseScore
        };
      }

      if (
        isSafeProperName(name)
      ) {
        return {
          name,
          type: pattern.type,
          score:
            pattern.score +
            baseScore
        };
      }
    }
  }

  if (
    isSafeProperName(cleaned)
  ) {
    return {
      name:
        normalizeDetailName(
          cleaned
        ),
      score:
        70 +
        baseScore
    };
  }

  return null;
}

function localizeDetail(
  detail: Detail,
  lang: string
) {
  if (!detail.type) {
    return detail.name;
  }

  const template =
    detailTemplates[
      detail.type
    ]?.[lang] ||
    detailTemplates[
      detail.type
    ]?.en;

  return template
    ? template
        .replace(
          '{name}',
          detail.name
        )
        .trim()
    : detail.name;
}

function splitTitleSegments(value: string) {
  return value
    .replace(
      /[•·]/g,
      ' | '
    )
    .split(
      /\s+\|\s+|\s+[–—]\s+|\s+-\s+/
    )
    .map(
      (item) =>
        item.trim()
    )
    .filter(Boolean);
}

function sanitizeCandidate(
  value: string,
  video: Video,
  countryMatch?: string | null
) {
  let candidate =
    cleanDetailText(value);

  candidate =
    removeLiteral(
      candidate,
      video.city
    );

  candidate =
    removeLiteral(
      candidate,
      video.country
    );

  if (countryMatch) {
    candidate =
      removeLiteral(
        candidate,
        countryMatch
      );
  }

  if (!video.city) {
    const inferredCity =
      inferCityFromTitle(
        video.title,
        countryMatch ||
        null
      );

    if (inferredCity) {
      candidate =
        removeLiteral(
          candidate,
          inferredCity
        );
    }
  }

  candidate =
    removeFeatureWords(
      stripSeoNoise(
        candidate
      )
    )
    .replace(
      /\b(?:airport\s+walk|airport\s+tour|airport\s+walking|beach\s+walking|beach\s+walk|terminal\s+walk)\b/gi,
      ' '
    )
    .replace(
      /\b(?:immersive(?:\s+sound)?|ambient(?:\s+walk)?|binaural|3d\s+audio|captions?|relaxation|scenic|panoramic|summer|winter|heatwave|lively|vibrant|quiet|peaceful|local\s+city\s+life|local\s+life|street\s+life|busy\s+streets?|hidden\s+streets?)\b/gi,
      ' '
    )
    .replace(
      /^['’]?s\s+/i,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();

  return candidate;
}

const titleDetailCache =
  new Map<string, Detail[]>();

const routeDetailCache =
  new Map<string, Detail[]>();

function extractTitleDetails(
  video: Video
) {
  const cacheKey =
    `${video.id}|${video.title}|${video.city || ''}|${video.country || ''}`;

  const cached =
    titleDetailCache.get(
      cacheKey
    );

  if (cached) {
    return cached;
  }

  const original =
    cleanTitle(video.title);

  const foundCountry =
    findCountry(original);

  const details: Detail[] = [];

  const fromTo =
    original.match(
      /\bfrom\s+(.+?)\s+to\s+(.+?)(?=\s+\||\s+[–—-]\s+|$)/iu
    );

  if (fromTo) {
    const first =
      parseDetail(
        sanitizeCandidate(
          fromTo[1],
          video,
          foundCountry?.matched ||
          null
        ),
        30
      );

    const second =
      parseDetail(
        sanitizeCandidate(
          fromTo[2],
          video,
          foundCountry?.matched ||
          null
        ),
        28
      );

    if (first) {
      details.push(first);
    }

    if (second) {
      details.push(second);
    }
  }

  for (
    const segment
    of splitTitleSegments(
      original
    )
  ) {
    const detail =
      parseDetail(
        sanitizeCandidate(
          segment,
          video,
          foundCountry?.matched ||
          null
        )
      );

    if (detail) {
      details.push(detail);
    }
  }

  const unique =
    new Map<string, Detail>();

  for (
    const detail
    of details
  ) {
    const key =
      `${detail.type || 'proper'}|${detail.name.toLocaleLowerCase()}`;

    const previous =
      unique.get(key);

    if (
      !previous ||
      detail.score >
      previous.score
    ) {
      unique.set(
        key,
        detail
      );
    }
  }

  const result =
    [...unique.values()]
      .sort(
        (a, b) =>
          b.score -
          a.score
      );

  titleDetailCache.set(
    cacheKey,
    result
  );

  return result;
}

function extractRouteDetails(
  video: Video
) {
  const cacheKey =
    `${video.id}|${video.description || ''}|${video.city || ''}|${video.country || ''}`;

  const cached =
    routeDetailCache.get(
      cacheKey
    );

  if (cached) {
    return cached;
  }

  const source =
    String(
      video.description || ''
    )
    .replace(/\r/g, ' ');

  if (!source) {
    routeDetailCache.set(
      cacheKey,
      []
    );

    return [] as Detail[];
  }

  const found: Detail[] = [];
  const seen =
    new Set<string>();

  const pattern =
    /(?:^|\s)(?:\d{1,2}:)?\d{1,2}:\d{2}\s*[-–—:]?\s*(.*?)(?=\s+(?:\d{1,2}:)?\d{1,2}:\d{2}\b|$)/g;

  let match:
    RegExpExecArray |
    null;

  while (
    (
      match =
        pattern.exec(source)
    ) !== null
  ) {
    const raw =
      cleanDetailText(
        match[1] || ''
      )
      .replace(
        /https?:\/\/\S+/gi,
        ' '
      )
      .replace(
        /\b(?:intro|preview|outro|subscribe|chapter|chapters)\b/gi,
        ' '
      )
      .replace(/\s+/g, ' ')
      .trim();

    const detail =
      parseDetail(
        sanitizeCandidate(
          raw,
          video
        )
      );

    if (detail) {
      const key =
        `${detail.type || 'proper'}|${detail.name.toLocaleLowerCase()}`;

      if (!seen.has(key)) {
        seen.add(key);
        found.push(detail);
      }
    }

    if (
      found.length >= 4
    ) {
      break;
    }
  }

  const result =
    found.sort(
      (a, b) =>
        b.score -
        a.score
    );

  routeDetailCache.set(
    cacheKey,
    result
  );

  return result;
}

function getBestDetail(
  video: Video
) {
  return (
    extractTitleDetails(
      video
    )[0] ||
    extractRouteDetails(
      video
    )[0] ||
    null
  );
}

function formatPublishedDate(
  value: string | undefined,
  lang: string
) {
  if (!value) {
    return '';
  }

  const date =
    new Date(value);

  if (
    !Number.isFinite(
      date.getTime()
    )
  ) {
    return '';
  }

  try {
    return new Intl.DateTimeFormat(
      lang,
      {
        year:'numeric',
        month:'short',
        day:'numeric'
      }
    ).format(date);
  } catch {
    return value.slice(0, 10);
  }
}

function hashSeed(value: string) {
  let hash = 2166136261;

  for (
    let i = 0;
    i < value.length;
    i += 1
  ) {
    hash ^=
      value.charCodeAt(i);

    hash =
      Math.imul(
        hash,
        16777619
      );
  }

  return hash >>> 0;
}

function pickDeterministic<T>(
  items: T[],
  videoId: string,
  salt: string
): T {
  return items[
    hashSeed(
      `${videoId}|${salt}`
    ) %
    items.length
  ];
}


type SeoContentFamily =
  | 'walking'
  | 'airport'
  | 'beach'
  | 'drone'
  | 'food'
  | 'nature'
  | 'culture'
  | 'pov'
  | 'documentary';

type SeoTitleStyle =
  | 'walking'
  | 'cityWalk'
  | 'immersiveWalk'
  | 'eveningWalk'
  | 'nightWalk'
  | 'rainWalk'
  | 'rainNightWalk'
  | 'snowWalk'
  | 'cherryWalk'
  | 'historicWalk'
  | 'hiddenWalk'
  | 'waterfrontWalk'
  | 'shoppingWalk'
  | 'scenicWalk'
  | 'summerWalk'
  | 'winterWalk'
  | 'quietWalk'
  | 'livelyWalk'
  | 'relaxingWalk'
  | 'relaxingEveningWalk'
  | 'localLifeWalk'
  | 'streetLifeWalk'
  | 'centralWalk'
  | 'landmarkWalk'
  | 'airportWalk'
  | 'airportWalkthrough'
  | 'terminalWalkthrough'
  | 'beachWalk'
  | 'coastalWalk'
  | 'droneView'
  | 'droneFilm'
  | 'aerialJourney'
  | 'nightAerial'
  | 'foodTour'
  | 'marketFoodTour'
  | 'natureWalk'
  | 'scenicNatureWalk'
  | 'cultureTour'
  | 'povRide'
  | 'documentary';

type SeoTitleAnalysis = {
  family: SeoContentFamily;
  style: SeoTitleStyle;
  detail: string;
  quality: string;
};

const seoTitleStyleNames: Record<SeoTitleStyle, Record<string, string>> = {
  walking:{en:'Walking Tour',tr:'Yürüyüş Turu',de:'Stadtrundgang',es:'Recorrido a Pie',it:'Tour a Piedi',fr:'Visite à Pied',ja:'街歩きツアー',pt:'Passeio a Pé',ru:'Пешеходная прогулка',zh:'徒步之旅',ko:'도보 여행',ar:'جولة مشي',hi:'पैदल यात्रा',nl:'Stadswandeling',pl:'Spacer po Mieście',sv:'Stadsvandring',id:'Tur Jalan Kaki',vi:'Tour Đi Bộ'},
  cityWalk:{en:'City Walk',tr:'Şehir Yürüyüşü',de:'Stadtspaziergang',es:'Paseo Urbano',it:'Passeggiata in Città',fr:'Balade en Ville',ja:'街歩き',pt:'Caminhada Urbana',ru:'Городская прогулка',zh:'城市漫步',ko:'도시 산책',ar:'جولة في المدينة',hi:'शहर की सैर',nl:'Stadswandeling',pl:'Spacer po Mieście',sv:'Stadspromenad',id:'Jelajah Kota',vi:'Đi Bộ Thành Phố'},
  immersiveWalk:{en:'Immersive Walking Tour',tr:'Sürükleyici Yürüyüş Turu',de:'Immersiver Stadtrundgang',es:'Recorrido Inmersivo a Pie',it:'Tour Immersivo a Piedi',fr:'Visite Immersive à Pied',ja:'没入型街歩きツアー',pt:'Passeio Imersivo a Pé',ru:'Иммерсивная прогулка',zh:'沉浸式徒步之旅',ko:'몰입형 도보 여행',ar:'جولة مشي غامرة',hi:'इमर्सिव पैदल यात्रा',nl:'Meeslepende Stadswandeling',pl:'Immersyjny Spacer',sv:'Uppslukande Stadsvandring',id:'Tur Jalan Kaki Imersif',vi:'Tour Đi Bộ Nhập Vai'},
  eveningWalk:{en:'Evening City Walk',tr:'Akşam Şehir Yürüyüşü',de:'Abendlicher Stadtspaziergang',es:'Paseo Urbano al Atardecer',it:'Passeggiata Serale in Città',fr:'Balade Urbaine en Soirée',ja:'夕方の街歩き',pt:'Caminhada Urbana ao Entardecer',ru:'Вечерняя прогулка по городу',zh:'傍晚城市漫步',ko:'저녁 도시 산책',ar:'جولة مسائية في المدينة',hi:'शाम की शहर यात्रा',nl:'Avondwandeling door de Stad',pl:'Wieczorny Spacer po Mieście',sv:'Kvällspromenad i Staden',id:'Jelajah Kota Sore',vi:'Đi Bộ Thành Phố Buổi Tối'},
  nightWalk:{en:'Night City Walk',tr:'Gece Şehir Yürüyüşü',de:'Nächtlicher Stadtspaziergang',es:'Paseo Nocturno por la Ciudad',it:'Passeggiata Notturna in Città',fr:'Balade Nocturne en Ville',ja:'夜の街歩き',pt:'Caminhada Noturna na Cidade',ru:'Ночная прогулка по городу',zh:'夜间城市漫步',ko:'야간 도시 산책',ar:'جولة ليلية في المدينة',hi:'रात की शहर यात्रा',nl:'Nachtwandeling door de Stad',pl:'Nocny Spacer po Mieście',sv:'Nattpromenad i Staden',id:'Jelajah Kota Malam',vi:'Đi Bộ Thành Phố Ban Đêm'},
  rainWalk:{en:'Rain Walking Tour',tr:'Yağmurlu Yürüyüş Turu',de:'Regenspaziergang',es:'Recorrido a Pie bajo la Lluvia',it:'Passeggiata sotto la Pioggia',fr:'Balade sous la Pluie',ja:'雨の街歩き',pt:'Caminhada na Chuva',ru:'Прогулка под дождём',zh:'雨中徒步',ko:'빗속 도보 여행',ar:'جولة مشي تحت المطر',hi:'बारिश में पैदल यात्रा',nl:'Regenwandeling',pl:'Spacer w Deszczu',sv:'Regnpromenad',id:'Tur Jalan Saat Hujan',vi:'Tour Đi Bộ Dưới Mưa'},
  rainNightWalk:{en:'Rainy Night Walk',tr:'Yağmurlu Gece Yürüyüşü',de:'Nächtlicher Regenspaziergang',es:'Paseo Nocturno bajo la Lluvia',it:'Passeggiata Notturna sotto la Pioggia',fr:'Balade Nocturne sous la Pluie',ja:'雨の夜の街歩き',pt:'Caminhada Noturna na Chuva',ru:'Ночная прогулка под дождём',zh:'雨夜漫步',ko:'비 오는 밤 산책',ar:'جولة ليلية تحت المطر',hi:'बारिश में रात की सैर',nl:'Nachtelijke Regenwandeling',pl:'Nocny Spacer w Deszczu',sv:'Nattlig Regnpromenad',id:'Jalan Malam Saat Hujan',vi:'Đi Bộ Đêm Mưa'},
  snowWalk:{en:'Snow Walking Tour',tr:'Karlı Yürüyüş Turu',de:'Schneespaziergang',es:'Recorrido a Pie con Nieve',it:'Passeggiata sulla Neve',fr:'Balade sous la Neige',ja:'雪の街歩き',pt:'Caminhada na Neve',ru:'Прогулка по снегу',zh:'雪中徒步',ko:'눈길 도보 여행',ar:'جولة مشي في الثلج',hi:'बर्फ में पैदल यात्रा',nl:'Sneeuwwandeling',pl:'Spacer po Śniegu',sv:'Snöpromenad',id:'Tur Jalan di Salju',vi:'Tour Đi Bộ Trong Tuyết'},
  cherryWalk:{en:'Cherry Blossom Walk',tr:'Kiraz Çiçekleri Yürüyüşü',de:'Kirschblüten-Spaziergang',es:'Paseo entre Cerezos en Flor',it:'Passeggiata tra i Ciliegi in Fiore',fr:'Balade sous les Cerisiers en Fleurs',ja:'桜の街歩き',pt:'Caminhada pelas Cerejeiras em Flor',ru:'Прогулка среди Сакуры',zh:'樱花漫步',ko:'벚꽃 산책',ar:'جولة بين أزهار الكرز',hi:'चेरी ब्लॉसम की सैर',nl:'Kersenbloesemwandeling',pl:'Spacer wśród Kwitnących Wiśni',sv:'Körsbärsblomspromenad',id:'Jalan Bunga Sakura',vi:'Đi Bộ Ngắm Hoa Anh Đào'},
  historicWalk:{en:'Historic Walking Tour',tr:'Tarihi Yürüyüş Turu',de:'Historischer Stadtrundgang',es:'Recorrido Histórico a Pie',it:'Tour Storico a Piedi',fr:'Visite Historique à Pied',ja:'歴史街歩きツアー',pt:'Passeio Histórico a Pé',ru:'Историческая прогулка',zh:'历史徒步之旅',ko:'역사 도보 여행',ar:'جولة مشي تاريخية',hi:'ऐतिहासिक पैदल यात्रा',nl:'Historische Stadswandeling',pl:'Historyczny Spacer',sv:'Historisk Stadsvandring',id:'Tur Jalan Kaki Bersejarah',vi:'Tour Đi Bộ Lịch Sử'},
  hiddenWalk:{en:'Hidden Streets Walk',tr:'Gizli Sokaklar Yürüyüşü',de:'Spaziergang durch Verborgene Straßen',es:'Paseo por Calles Escondidas',it:'Passeggiata tra Strade Nascoste',fr:'Balade dans les Rues Cachées',ja:'隠れた路地散策',pt:'Caminhada por Ruas Escondidas',ru:'Прогулка по скрытым улицам',zh:'隐秘街巷漫步',ko:'숨은 골목 산책',ar:'جولة في الشوارع الخفية',hi:'छिपी गलियों की सैर',nl:'Wandeling door Verborgen Straten',pl:'Spacer po Ukrytych Ulicach',sv:'Promenad på Dolda Gator',id:'Jelajah Jalan Tersembunyi',vi:'Đi Bộ Qua Những Con Phố Ẩn'},
  waterfrontWalk:{en:'Waterfront Walk',tr:'Sahil Yürüyüşü',de:'Uferspaziergang',es:'Paseo por la Ribera',it:'Passeggiata sul Lungomare',fr:'Balade au Bord de l’Eau',ja:'ウォーターフロント散策',pt:'Caminhada pela Orla',ru:'Прогулка по набережной',zh:'滨水漫步',ko:'수변 산책',ar:'جولة على الواجهة البحرية',hi:'वॉटरफ्रंट वॉक',nl:'Wandeling langs het Water',pl:'Spacer po Nabrzeżu',sv:'Promenad längs Vattnet',id:'Jalan di Tepi Laut',vi:'Đi Bộ Ven Sông/Biển'},
  shoppingWalk:{en:'Shopping District Walk',tr:'Alışveriş Bölgesi Yürüyüşü',de:'Spaziergang durchs Einkaufsviertel',es:'Paseo por el Distrito Comercial',it:'Passeggiata nel Quartiere dello Shopping',fr:'Balade dans le Quartier Commerçant',ja:'ショッピング街散策',pt:'Caminhada pelo Distrito Comercial',ru:'Прогулка по торговому району',zh:'购物区漫步',ko:'쇼핑 지구 산책',ar:'جولة في منطقة التسوق',hi:'शॉपिंग क्षेत्र की सैर',nl:'Wandeling door het Winkelgebied',pl:'Spacer po Dzielnicy Handlowej',sv:'Promenad i Shoppingdistriktet',id:'Jalan di Distrik Belanja',vi:'Đi Bộ Khu Mua Sắm'},
  scenicWalk:{en:'Scenic Walking Tour',tr:'Manzaralı Yürüyüş Turu',de:'Malerischer Spaziergang',es:'Paseo Panorámico',it:'Passeggiata Panoramica',fr:'Balade Panoramique',ja:'景観街歩き',pt:'Caminhada Panorâmica',ru:'Живописная прогулка',zh:'景观徒步',ko:'풍경 도보 여행',ar:'جولة مشي ذات مناظر خلابة',hi:'दृश्यात्मक पैदल यात्रा',nl:'Schilderachtige Wandeling',pl:'Malowniczy Spacer',sv:'Naturskön Promenad',id:'Tur Jalan dengan Pemandangan',vi:'Tour Đi Bộ Ngắm Cảnh'},
  summerWalk:{en:'Summer City Walk',tr:'Yaz Şehir Yürüyüşü',de:'Sommerlicher Stadtspaziergang',es:'Paseo Urbano de Verano',it:'Passeggiata Estiva in Città',fr:'Balade Urbaine d’Été',ja:'夏の街歩き',pt:'Caminhada Urbana de Verão',ru:'Летняя прогулка по городу',zh:'夏日城市漫步',ko:'여름 도시 산책',ar:'جولة صيفية في المدينة',hi:'गर्मियों की शहर सैर',nl:'Zomerse Stadswandeling',pl:'Letni Spacer po Mieście',sv:'Sommarpromenad i Staden',id:'Jelajah Kota Musim Panas',vi:'Đi Bộ Thành Phố Mùa Hè'},
  winterWalk:{en:'Winter City Walk',tr:'Kış Şehir Yürüyüşü',de:'Winterlicher Stadtspaziergang',es:'Paseo Urbano de Invierno',it:'Passeggiata Invernale in Città',fr:'Balade Urbaine d’Hiver',ja:'冬の街歩き',pt:'Caminhada Urbana de Inverno',ru:'Зимняя прогулка по городу',zh:'冬日城市漫步',ko:'겨울 도시 산책',ar:'جولة شتوية في المدينة',hi:'सर्दियों की शहर सैर',nl:'Winterse Stadswandeling',pl:'Zimowy Spacer po Mieście',sv:'Vinterpromenad i Staden',id:'Jelajah Kota Musim Dingin',vi:'Đi Bộ Thành Phố Mùa Đông'},
  quietWalk:{en:'Quiet City Walk',tr:'Sakin Şehir Yürüyüşü',de:'Ruhiger Stadtspaziergang',es:'Paseo Urbano Tranquilo',it:'Passeggiata Tranquilla in Città',fr:'Balade Urbaine Tranquille',ja:'静かな街歩き',pt:'Caminhada Urbana Tranquila',ru:'Тихая прогулка по городу',zh:'宁静城市漫步',ko:'조용한 도시 산책',ar:'جولة هادئة في المدينة',hi:'शांत शहर सैर',nl:'Rustige Stadswandeling',pl:'Spokojny Spacer po Mieście',sv:'Lugn Stadspromenad',id:'Jelajah Kota Tenang',vi:'Đi Bộ Thành Phố Yên Tĩnh'},
  livelyWalk:{en:'Lively City Walk',tr:'Canlı Şehir Yürüyüşü',de:'Lebhafter Stadtspaziergang',es:'Paseo Urbano Animado',it:'Passeggiata Vivace in Città',fr:'Balade Urbaine Animée',ja:'にぎやかな街歩き',pt:'Caminhada Urbana Animada',ru:'Оживлённая прогулка по городу',zh:'活力城市漫步',ko:'활기찬 도시 산책',ar:'جولة حيوية في المدينة',hi:'जीवंत शहर सैर',nl:'Levendige Stadswandeling',pl:'Tętniący Życiem Spacer',sv:'Livlig Stadspromenad',id:'Jelajah Kota Ramai',vi:'Đi Bộ Thành Phố Sôi Động'},
  relaxingWalk:{en:'Relaxing City Walk',tr:'Rahatlatıcı Şehir Yürüyüşü',de:'Entspannender Stadtspaziergang',es:'Paseo Urbano Relajante',it:'Passeggiata Rilassante in Città',fr:'Balade Urbaine Relaxante',ja:'リラックス街歩き',pt:'Caminhada Urbana Relaxante',ru:'Расслабляющая прогулка по городу',zh:'轻松城市漫步',ko:'편안한 도시 산책',ar:'جولة مريحة في المدينة',hi:'आरामदायक शहर सैर',nl:'Ontspannende Stadswandeling',pl:'Relaksujący Spacer po Mieście',sv:'Avkopplande Stadspromenad',id:'Jelajah Kota Santai',vi:'Đi Bộ Thành Phố Thư Giãn'},
  relaxingEveningWalk:{en:'Relaxing Evening Walk',tr:'Rahatlatıcı Akşam Yürüyüşü',de:'Entspannender Abendspaziergang',es:'Paseo Relajante al Atardecer',it:'Passeggiata Serale Rilassante',fr:'Balade Relaxante en Soirée',ja:'リラックス夕方散策',pt:'Caminhada Relaxante ao Entardecer',ru:'Расслабляющая вечерняя прогулка',zh:'轻松傍晚漫步',ko:'편안한 저녁 산책',ar:'جولة مسائية مريحة',hi:'आरामदायक शाम की सैर',nl:'Ontspannende Avondwandeling',pl:'Relaksujący Wieczorny Spacer',sv:'Avkopplande Kvällspromenad',id:'Jalan Santai Sore Hari',vi:'Đi Bộ Thư Giãn Buổi Tối'},
  localLifeWalk:{en:'Local Life Walk',tr:'Yerel Yaşam Yürüyüşü',de:'Spaziergang durch das Lokale Leben',es:'Paseo por la Vida Local',it:'Passeggiata nella Vita Locale',fr:'Balade dans la Vie Locale',ja:'ローカルライフ散策',pt:'Caminhada pela Vida Local',ru:'Прогулка по местной жизни',zh:'当地生活漫步',ko:'현지 일상 산책',ar:'جولة في الحياة المحلية',hi:'स्थानीय जीवन की सैर',nl:'Wandeling door het Lokale Leven',pl:'Spacer przez Lokalne Życie',sv:'Promenad genom Lokallivet',id:'Jelajah Kehidupan Lokal',vi:'Đi Bộ Khám Phá Cuộc Sống Địa Phương'},
  streetLifeWalk:{en:'Street Life Walk',tr:'Sokak Yaşamı Yürüyüşü',de:'Spaziergang durch das Straßenleben',es:'Paseo por la Vida Callejera',it:'Passeggiata nella Vita di Strada',fr:'Balade dans la Vie de Rue',ja:'ストリートライフ散策',pt:'Caminhada pela Vida nas Ruas',ru:'Прогулка по уличной жизни',zh:'街头生活漫步',ko:'거리 생활 산책',ar:'جولة في حياة الشوارع',hi:'सड़क जीवन की सैर',nl:'Wandeling door het Straatleven',pl:'Spacer przez Życie Uliczne',sv:'Promenad genom Gatulivet',id:'Jelajah Kehidupan Jalanan',vi:'Đi Bộ Khám Phá Đời Sống Đường Phố'},
  centralWalk:{en:'Central City Walk',tr:'Şehir Merkezi Yürüyüşü',de:'Spaziergang durch die Innenstadt',es:'Paseo por el Centro de la Ciudad',it:'Passeggiata nel Centro Città',fr:'Balade dans le Centre-ville',ja:'市中心部の街歩き',pt:'Caminhada pelo Centro da Cidade',ru:'Прогулка по центру города',zh:'市中心漫步',ko:'도심 산책',ar:'جولة في وسط المدينة',hi:'शहर के केंद्र की सैर',nl:'Wandeling door het Stadscentrum',pl:'Spacer po Centrum Miasta',sv:'Promenad i Stadskärnan',id:'Jelajah Pusat Kota',vi:'Đi Bộ Trung Tâm Thành Phố'},
  landmarkWalk:{en:'Landmark Walking Tour',tr:'Önemli Noktalar Yürüyüş Turu',de:'Spaziergang zu Sehenswürdigkeiten',es:'Recorrido a Pie por Lugares Emblemáticos',it:'Tour a Piedi tra i Luoghi Iconici',fr:'Visite à Pied des Sites Emblématiques',ja:'名所街歩きツアー',pt:'Passeio a Pé por Pontos Turísticos',ru:'Прогулка по достопримечательностям',zh:'地标徒步之旅',ko:'랜드마크 도보 여행',ar:'جولة مشي بين المعالم',hi:'प्रमुख स्थलों की पैदल यात्रा',nl:'Wandeling langs Bezienswaardigheden',pl:'Spacer po Atrakcjach',sv:'Promenad bland Sevärdheter',id:'Tur Jalan Kaki Landmark',vi:'Tour Đi Bộ Qua Các Địa Danh'},
  airportWalk:{en:'Airport Walk',tr:'Havalimanı Yürüyüşü',de:'Flughafen-Spaziergang',es:'Paseo por el Aeropuerto',it:'Passeggiata in Aeroporto',fr:'Promenade dans l’Aéroport',ja:'空港ウォーク',pt:'Caminhada no Aeroporto',ru:'Прогулка по аэропорту',zh:'机场漫步',ko:'공항 산책',ar:'جولة في المطار',hi:'एयरपोर्ट वॉक',nl:'Luchthavenwandeling',pl:'Spacer po Lotnisku',sv:'Flygplatspromenad',id:'Jelajah Bandara',vi:'Đi Bộ Sân Bay'},
  airportWalkthrough:{en:'Airport Walkthrough',tr:'Havalimanı İçinde Yürüyüş',de:'Flughafen-Rundgang',es:'Recorrido por el Aeropuerto',it:'Percorso in Aeroporto',fr:'Parcours dans l’Aéroport',ja:'空港ウォークスルー',pt:'Percurso pelo Aeroporto',ru:'Обзор аэропорта пешком',zh:'机场实走导览',ko:'공항 둘러보기',ar:'جولة تفصيلية في المطار',hi:'हवाई अड्डा भ्रमण',nl:'Rondgang door de Luchthaven',pl:'Przejście po Lotnisku',sv:'Rundtur på Flygplatsen',id:'Jelajah Bandara',vi:'Đi Bộ Khám Phá Sân Bay'},
  terminalWalkthrough:{en:'Terminal Walkthrough',tr:'Terminal Yürüyüşü',de:'Terminal-Rundgang',es:'Recorrido por la Terminal',it:'Percorso nella Terminal',fr:'Parcours du Terminal',ja:'ターミナルウォークスルー',pt:'Percurso pelo Terminal',ru:'Обзор терминала пешком',zh:'航站楼实走导览',ko:'터미널 둘러보기',ar:'جولة تفصيلية في مبنى الركاب',hi:'टर्मिनल भ्रमण',nl:'Rondgang door de Terminal',pl:'Przejście po Terminalu',sv:'Rundtur i Terminalen',id:'Jelajah Terminal',vi:'Đi Bộ Khám Phá Nhà Ga'},
  beachWalk:{en:'Beach Walking Tour',tr:'Plaj Yürüyüş Turu',de:'Strandspaziergang',es:'Paseo por la Playa',it:'Passeggiata in Spiaggia',fr:'Balade sur la Plage',ja:'ビーチウォーク',pt:'Caminhada na Praia',ru:'Прогулка по пляжу',zh:'海滩漫步',ko:'해변 산책',ar:'جولة مشي على الشاطئ',hi:'समुद्र तट की सैर',nl:'Strandwandeling',pl:'Spacer po Plaży',sv:'Strandpromenad',id:'Jalan-jalan di Pantai',vi:'Đi Bộ Trên Bãi Biển'},
  coastalWalk:{en:'Coastal Walk',tr:'Kıyı Yürüyüşü',de:'Küstenspaziergang',es:'Paseo Costero',it:'Passeggiata Costiera',fr:'Balade Côtière',ja:'海岸散策',pt:'Caminhada Costeira',ru:'Прогулка по побережью',zh:'海岸漫步',ko:'해안 산책',ar:'جولة ساحلية',hi:'तटीय सैर',nl:'Kustwandeling',pl:'Spacer Nadmorski',sv:'Kustpromenad',id:'Jalan Pesisir',vi:'Đi Bộ Ven Biển'},
  droneView:{en:'Drone & Aerial View',tr:'Drone & Hava Görüntüleri',de:'Drohnen- & Luftaufnahmen',es:'Vista Aérea con Dron',it:'Veduta Aerea con Drone',fr:'Vue Aérienne par Drone',ja:'ドローン空撮',pt:'Vista Aérea com Drone',ru:'Аэросъёмка с дрона',zh:'无人机航拍',ko:'드론 항공 영상',ar:'تصوير جوي بالطائرة المسيّرة',hi:'ड्रोन हवाई दृश्य',nl:'Drone- & Luchtbeelden',pl:'Widok z Drona',sv:'Drönarvy',id:'Pemandangan Drone & Udara',vi:'Góc Nhìn Flycam'},
  droneFilm:{en:'Aerial Drone Film',tr:'Havadan Drone Filmi',de:'Drohnen-Luftfilm',es:'Película Aérea con Dron',it:'Film Aereo con Drone',fr:'Film Aérien par Drone',ja:'ドローン空撮フィルム',pt:'Filme Aéreo com Drone',ru:'Аэрофильм с дрона',zh:'无人机航拍影片',ko:'드론 항공 영상',ar:'فيلم جوي بالطائرة المسيّرة',hi:'हवाई ड्रोन फिल्म',nl:'Luchtfilm met Drone',pl:'Film z Drona',sv:'Drönarfilm',id:'Film Udara Drone',vi:'Phim Flycam Trên Không'},
  aerialJourney:{en:'Aerial Journey',tr:'Havadan Yolculuk',de:'Luftreise',es:'Viaje Aéreo',it:'Viaggio Aereo',fr:'Voyage Aérien',ja:'空からの旅',pt:'Jornada Aérea',ru:'Воздушное путешествие',zh:'空中之旅',ko:'항공 여정',ar:'رحلة جوية',hi:'हवाई यात्रा',nl:'Luchtreis',pl:'Podróż z Powietrza',sv:'Flygresa',id:'Perjalanan Udara',vi:'Hành Trình Trên Không'},
  nightAerial:{en:'Night Aerial View',tr:'Gece Hava Görüntüleri',de:'Nächtliche Luftaufnahmen',es:'Vista Aérea Nocturna',it:'Veduta Aerea Notturna',fr:'Vue Aérienne Nocturne',ja:'夜景空撮',pt:'Vista Aérea Noturna',ru:'Ночная аэросъёмка',zh:'夜间航拍',ko:'야간 항공 영상',ar:'منظر جوي ليلي',hi:'रात्रि हवाई दृश्य',nl:'Nachtelijke Luchtbeelden',pl:'Nocny Widok z Powietrza',sv:'Nattlig Flygvy',id:'Pemandangan Udara Malam',vi:'Góc Nhìn Trên Không Ban Đêm'},
  foodTour:{en:'Street Food Tour',tr:'Sokak Lezzetleri Turu',de:'Street-Food-Tour',es:'Tour de Comida Callejera',it:'Tour dello Street Food',fr:'Tour de Street Food',ja:'ストリートフード巡り',pt:'Tour de Comida de Rua',ru:'Тур по Уличной Еде',zh:'街头美食之旅',ko:'길거리 음식 투어',ar:'جولة أطعمة الشوارع',hi:'स्ट्रीट फूड टूर',nl:'Streetfoodtour',pl:'Wycieczka po Street Foodzie',sv:'Street Food-rundtur',id:'Tur Kuliner Jalanan',vi:'Tour Ẩm Thực Đường Phố'},
  marketFoodTour:{en:'Food Market Tour',tr:'Yemek Pazarı Turu',de:'Food-Market-Tour',es:'Tour del Mercado Gastronómico',it:'Tour del Mercato Gastronomico',fr:'Visite du Marché Gourmand',ja:'フードマーケット巡り',pt:'Tour pelo Mercado Gastronômico',ru:'Тур по продуктовому рынку',zh:'美食市场之旅',ko:'푸드 마켓 투어',ar:'جولة في سوق الطعام',hi:'फूड मार्केट टूर',nl:'Foodmarkttour',pl:'Wycieczka po Targu Żywności',sv:'Matmarknadstur',id:'Tur Pasar Kuliner',vi:'Tour Chợ Ẩm Thực'},
  natureWalk:{en:'Nature Walk',tr:'Doğa Yürüyüşü',de:'Naturwanderung',es:'Paseo por la Naturaleza',it:'Passeggiata nella Natura',fr:'Balade dans la Nature',ja:'自然散策',pt:'Caminhada na Natureza',ru:'Прогулка на Природе',zh:'自然徒步',ko:'자연 산책',ar:'نزهة في الطبيعة',hi:'प्रकृति की सैर',nl:'Natuurwandeling',pl:'Spacer Przyrodniczy',sv:'Naturvandring',id:'Jelajah Alam',vi:'Đi Bộ Thiên Nhiên'},
  scenicNatureWalk:{en:'Scenic Nature Walk',tr:'Manzaralı Doğa Yürüyüşü',de:'Malerische Naturwanderung',es:'Paseo Panorámico por la Naturaleza',it:'Passeggiata Panoramica nella Natura',fr:'Balade Panoramique dans la Nature',ja:'景観自然散策',pt:'Caminhada Panorâmica na Natureza',ru:'Живописная прогулка на природе',zh:'景观自然徒步',ko:'풍경 자연 산책',ar:'نزهة طبيعية ذات مناظر خلابة',hi:'दृश्यात्मक प्रकृति सैर',nl:'Schilderachtige Natuurwandeling',pl:'Malowniczy Spacer Przyrodniczy',sv:'Naturskön Vandring',id:'Jelajah Alam dengan Pemandangan',vi:'Đi Bộ Thiên Nhiên Ngắm Cảnh'},
  cultureTour:{en:'Culture & Museum Tour',tr:'Kültür & Müze Turu',de:'Kultur- & Museumstour',es:'Tour Cultural y de Museos',it:'Tour Culturale e Museale',fr:'Visite Culturelle & Musées',ja:'文化・博物館ツアー',pt:'Tour Cultural e de Museus',ru:'Культурный и музейный тур',zh:'文化与博物馆之旅',ko:'문화 & 박물관 투어',ar:'جولة ثقافية ومتاحف',hi:'संस्कृति और संग्रहालय टूर',nl:'Cultuur- & Museumtour',pl:'Wycieczka Kulturalna i Muzealna',sv:'Kultur- & Museumstur',id:'Tur Budaya & Museum',vi:'Tour Văn Hóa & Bảo Tàng'},
  povRide:{en:'POV Ride',tr:'POV Sürüş',de:'POV-Fahrt',es:'Recorrido POV',it:'Percorso POV',fr:'Trajet POV',ja:'POVドライブ',pt:'Passeio POV',ru:'POV-поездка',zh:'POV驾驶',ko:'POV 주행',ar:'جولة قيادة POV',hi:'POV राइड',nl:'POV-rit',pl:'Przejazd POV',sv:'POV-tur',id:'Perjalanan POV',vi:'Chuyến Đi POV'},
  documentary:{en:'Travel Documentary',tr:'Seyahat Belgeseli',de:'Reisedokumentation',es:'Documental de Viajes',it:'Documentario di Viaggio',fr:'Documentaire de Voyage',ja:'旅行ドキュメンタリー',pt:'Documentário de Viagem',ru:'Документальный фильм о путешествиях',zh:'旅行纪录片',ko:'여행 다큐멘터리',ar:'وثائقي سفر',hi:'यात्रा वृत्तचित्र',nl:'Reisdocumentaire',pl:'Dokument Podróżniczy',sv:'Resedokumentär',id:'Dokumenter Perjalanan',vi:'Phim Tài Liệu Du Lịch'}
};

const neutralWalkingVariants: Record<string, string[]> = {
  en:['Walking Tour','City Walk','On-Foot City Tour'],
  tr:['Yürüyüş Turu','Şehir Yürüyüşü','Yaya Şehir Turu'],
  de:['Stadtrundgang','Stadtspaziergang','Stadttour zu Fuß'],
  es:['Recorrido a Pie','Paseo Urbano','Tour Urbano a Pie'],
  it:['Tour a Piedi','Passeggiata in Città','Tour Urbano a Piedi'],
  fr:['Visite à Pied','Balade en Ville','Tour Urbain à Pied'],
  ja:['街歩きツアー','街歩き','徒歩シティツアー'],
  pt:['Passeio a Pé','Caminhada Urbana','Tour Urbano a Pé'],
  ru:['Пешеходная прогулка','Городская прогулка','Пеший тур по городу'],
  zh:['徒步之旅','城市漫步','城市步行之旅'],
  ko:['도보 여행','도시 산책','도보 시티 투어'],
  ar:['جولة مشي','جولة في المدينة','جولة مدينة سيرًا على الأقدام'],
  hi:['पैदल यात्रा','शहर की सैर','पैदल शहर टूर'],
  nl:['Stadswandeling','Wandeling door de Stad','Stadstour te Voet'],
  pl:['Spacer po Mieście','Miejski Spacer','Piesza Wycieczka po Mieście'],
  sv:['Stadsvandring','Stadspromenad','Stadstur till Fots'],
  id:['Tur Jalan Kaki','Jelajah Kota','Tur Kota dengan Berjalan Kaki'],
  vi:['Tour Đi Bộ','Đi Bộ Thành Phố','Tour Thành Phố Đi Bộ']
};

const airportTitleTemplates: Record<string, { international: string; airport: string; terminal: string }> = {
  en:{international:'{name} International Airport',airport:'{name} Airport',terminal:'Terminal {number}'},
  tr:{international:'{name} Uluslararası Havalimanı',airport:'{name} Havalimanı',terminal:'Terminal {number}'},
  de:{international:'Internationaler Flughafen {name}',airport:'Flughafen {name}',terminal:'Terminal {number}'},
  es:{international:'Aeropuerto Internacional de {name}',airport:'Aeropuerto de {name}',terminal:'Terminal {number}'},
  it:{international:'Aeroporto Internazionale di {name}',airport:'Aeroporto di {name}',terminal:'Terminal {number}'},
  fr:{international:'Aéroport International de {name}',airport:'Aéroport de {name}',terminal:'Terminal {number}'},
  ja:{international:'{name}国際空港',airport:'{name}空港',terminal:'ターミナル{number}'},
  pt:{international:'Aeroporto Internacional de {name}',airport:'Aeroporto de {name}',terminal:'Terminal {number}'},
  ru:{international:'Международный аэропорт {name}',airport:'Аэропорт {name}',terminal:'Терминал {number}'},
  zh:{international:'{name}国际机场',airport:'{name}机场',terminal:'{number}号航站楼'},
  ko:{international:'{name} 국제공항',airport:'{name} 공항',terminal:'터미널 {number}'},
  ar:{international:'مطار {name} الدولي',airport:'مطار {name}',terminal:'المبنى {number}'},
  hi:{international:'{name} अंतरराष्ट्रीय हवाई अड्डा',airport:'{name} हवाई अड्डा',terminal:'टर्मिनल {number}'},
  nl:{international:'Internationale Luchthaven {name}',airport:'Luchthaven {name}',terminal:'Terminal {number}'},
  pl:{international:'Międzynarodowe Lotnisko {name}',airport:'Lotnisko {name}',terminal:'Terminal {number}'},
  sv:{international:'{name} Internationella Flygplats',airport:'{name} Flygplats',terminal:'Terminal {number}'},
  id:{international:'Bandara Internasional {name}',airport:'Bandara {name}',terminal:'Terminal {number}'},
  vi:{international:'Sân Bay Quốc Tế {name}',airport:'Sân Bay {name}',terminal:'Nhà Ga {number}'}
};

const titleAnalysisCache = new Map<string, SeoTitleAnalysis>();

function seoSource(video: Video) {
  return `${video.title || ''} ${video.description || ''}`
    .normalize('NFKC')
    .toLocaleLowerCase();
}

function seoTitleSource(video: Video) {
  return String(video.title || '')
    .normalize('NFKC')
    .toLocaleLowerCase();
}

function resolveSeoContentFamily(video: Video): SeoContentFamily {
  const title = seoTitleSource(video);
  const source = seoSource(video);
  const category = String(video.category || '');
  const badge = String(video.badge || '').toLowerCase();

  const airportTitle = /\b(?:airport|airports|terminal\s*\d*|lax|jfk|lhr|dxb|hnd|nrt|kix|cdg|ams|fra|sin)\b/i.test(title);
  const droneTitle = /\b(?:drone|aerial|fpv|from above|flying over|fly over)\b/i.test(title);
  const foodTitle = /\b(?:street food|food market|night market|food tour|culinary|local food|food street)\b/i.test(title);
  const beachTitle = /\b(?:beach|beachfront|seafront|seaside|coastal|coastline|oceanfront)\b/i.test(title);
  const povTitle = /\b(?:driving tour|drive tour|pov drive|bike ride|tram ride|train ride|bus ride|motorcycle ride|cycling tour|car ride)\b/i.test(title);
  const documentaryTitle = /\b(?:documentary|travel guide|city guide|itinerary)\b/i.test(title);
  const natureTitle = /\b(?:nature trail|forest walk|mountain trail|hiking trail|hike|waterfall trail|national park|nature walk)\b/i.test(title);
  const cultureTitle = /\b(?:museum|gallery|cultural tour|culture tour|heritage museum)\b/i.test(title);
  const walkingTitle = /\b(?:walking tour|city walk|street walk|summer walk|rain walk|night walk|walk in|walking in|walk through|walking through|walk around|walking around|hour walk|stroll)\b/i.test(title);

  if (airportTitle) return 'airport';
  if (droneTitle) return 'drone';
  if (foodTitle) return 'food';
  if (beachTitle) return 'beach';
  if (povTitle) return 'pov';
  if (documentaryTitle) return 'documentary';
  if (natureTitle) return 'nature';
  if (cultureTitle) return 'culture';
  if (walkingTitle) return 'walking';

  if (category === 'Airport Walks' && /\b(?:airport|terminal|arrival|departure|gate|concourse)\b/i.test(source)) return 'airport';
  if (
    category === 'Drone & Aerial' &&
    (
      /\b(?:drone|aerial|fpv|from above|flying over|fly over|airborne footage)\b/i.test(source) ||
      /\bdrone\b/i.test(badge)
    )
  ) return 'drone';
  if (category === 'Street Food' && /\b(?:street food|food market|night market|food tour|culinary|food street)\b/i.test(source)) return 'food';
  if (category === 'Beach Walking Tours' && /\b(?:beach|seaside|seafront|coastal|coastline|oceanfront)\b/i.test(source)) return 'beach';
  if (category === 'POV Rides' && /\b(?:drive|driving|ride|bike|tram|train|bus|motorcycle|cycling)\b/i.test(source)) return 'pov';
  if (category === 'Nature Trails' && /\b(?:nature|forest|mountain|trail|hike|hiking|waterfall|national park)\b/i.test(source)) return 'nature';
  if (category === 'Museums & Culture' && /\b(?:museum|gallery|culture|cultural|heritage)\b/i.test(source)) return 'culture';
  if (category === 'Documentaries') return 'documentary';

  return 'walking';
}

function detectSeoTitleStyle(video: Video, family: SeoContentFamily): SeoTitleStyle {
  const title = seoTitleSource(video);
  const hasRain = /\b(?:rain|rainy|raining|storm|wet streets?)\b/i.test(title);
  const hasNight = /\b(?:night|nighttime|after dark|midnight)\b/i.test(title);
  const hasEvening = /\b(?:evening|sunset|dusk|blue hour)\b/i.test(title);

  if (family === 'airport') {
    if (/\bterminal\s*[a-z0-9-]*\b/i.test(title) && /\b(?:walkthrough|walk through|walking|walk|tour)\b/i.test(title)) {
      return 'terminalWalkthrough';
    }
    if (/\b(?:walkthrough|walk through|inside|arrival|departure)\b/i.test(title)) return 'airportWalkthrough';
    return 'airportWalk';
  }

  if (family === 'drone') {
    if (hasNight) return 'nightAerial';
    if (/\b(?:journey|flying over|fly over|from above)\b/i.test(title)) return 'aerialJourney';
    if (/\b(?:film|relaxation film|drone footage|footage)\b/i.test(title)) return 'droneFilm';
    return 'droneView';
  }

  if (family === 'beach') {
    return /\b(?:coastal|coastline|seaside|seafront|waterfront)\b/i.test(title)
      ? 'coastalWalk'
      : 'beachWalk';
  }

  if (family === 'food') {
    return /\b(?:market|bazaar)\b/i.test(title)
      ? 'marketFoodTour'
      : 'foodTour';
  }

  if (family === 'nature') {
    return /\b(?:scenic|panoramic)\b/i.test(title)
      ? 'scenicNatureWalk'
      : 'natureWalk';
  }

  if (family === 'culture') return 'cultureTour';
  if (family === 'pov') return 'povRide';
  if (family === 'documentary') return 'documentary';

  if (/\b(?:cherry blossom|cherry blossoms|sakura)\b/i.test(title)) return 'cherryWalk';
  if (/\b(?:snow|snowy|snowfall)\b/i.test(title)) return 'snowWalk';
  if (hasRain && hasNight) return 'rainNightWalk';
  if (hasRain) return 'rainWalk';
  if (hasNight) return 'nightWalk';
  if (hasEvening && /\b(?:relaxing|relaxed|calming)\b/i.test(title)) return 'relaxingEveningWalk';
  if (hasEvening) return 'eveningWalk';
  if (/\b(?:immersive|binaural|3d audio)\b/i.test(title)) return 'immersiveWalk';
  if (/\b(?:relaxing|relaxed|calming)\b/i.test(title)) return 'relaxingWalk';
  if (/\b(?:historic|historical|heritage|old town|ancient streets?)\b/i.test(title)) return 'historicWalk';
  if (/\b(?:hidden streets?|hidden lanes?|hidden alleys?)\b/i.test(title)) return 'hiddenWalk';
  if (/\b(?:waterfront|riverfront|riverside|harbou?rfront|seafront|promenade)\b/i.test(title)) return 'waterfrontWalk';
  if (/\b(?:shopping district|shopping streets?|luxury shopping)\b/i.test(title)) return 'shoppingWalk';
  if (/\b(?:scenic|panoramic)\b/i.test(title)) return 'scenicWalk';
  if (/\b(?:summer|heatwave)\b/i.test(title)) return 'summerWalk';
  if (/\b(?:winter|wintry)\b/i.test(title)) return 'winterWalk';
  if (/\b(?:quiet|peaceful|calm streets?)\b/i.test(title)) return 'quietWalk';
  if (/\b(?:lively|busy streets?|vibrant|street party)\b/i.test(title)) return 'livelyWalk';
  if (/\b(?:local city life|local life|local daily life)\b/i.test(title)) return 'localLifeWalk';
  if (/\b(?:street life|daily street life|everyday street life)\b/i.test(title)) return 'streetLifeWalk';
  if (/\b(?:city center|city centre|downtown|central city|central london|central paris|central rome|central tokyo)\b/i.test(title)) return 'centralWalk';
  if (/\b(?:landmarks?|top attractions?|major sights?|famous sights?)\b/i.test(title)) return 'landmarkWalk';
  if (/\bcity walk\b/i.test(title)) return 'cityWalk';

  return 'walking';
}

function getSeoTitleQuality(video: Video) {
  const badge = String(video.badge || '').toUpperCase();
  const title = String(video.title || '').toUpperCase();

  if (/\b12K\b/.test(badge) || /\b12K\b/.test(title)) return '12K';
  if (/\b8K\b/.test(badge) || /\b8K\b/.test(title)) return '8K';
  if (
    /\b4K\b/.test(badge) ||
    /\b4K\b/.test(title) ||
    /\bDRONE 4K\b/.test(badge) ||
    /\bRAIN 4K\b/.test(badge)
  ) {
    return '4K';
  }

  return '';
}

type AirportTitleData = {
  name: string;
  international: boolean;
  code: string;
  terminal: string;
};

function cleanAirportTitleName(value: string) {
  return String(value || '')
    .normalize('NFKC')
    .replace(
      /^(?:arriving\s+in|arriving\s+at|arrival\s+at|departing\s+from|departure\s+from|walking\s+through|walk\s+through|walking\s+inside|inside|tour\s+of|video\s+tour\s+of|exploring|explore|at|in|of)\s+/i,
      ' '
    )
    .replace(/\b(?:4k|8k|12k|hdr|uhd|video|tour|walkthrough|walking|walk|full)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractAirportTitleData(video: Video): AirportTitleData | null {
  const title = String(video.title || '')
    .normalize('NFKC')
    .replace(/[\[\]{}<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const terminalMatch =
    title.match(/\bTerminal\s*([0-9]+[A-Z]?|[A-Z])\b/i) ||
    title.match(/\bT([0-9]+[A-Z]?)\b/);

  const codeCandidates = title.match(/\b[A-Z]{3}\b/g) || [];
  const code = codeCandidates.find(
    (item) =>
      !['HDR','UHD','POV','USA','ASMR'].includes(item)
  ) || '';

  const airportMatch = title.match(
    /([\p{L}\p{M}.'’&-]+(?:\s+[\p{L}\p{M}.'’&-]+){0,6}?)\s+(International\s+)?Airport\b/iu
  );

  if (airportMatch) {
    let name = cleanAirportTitleName(airportMatch[1]);

    const city =
      String(video.city || '')
        .trim();

    if (
      city &&
      name
        .toLocaleLowerCase()
        .startsWith(
          `${city.toLocaleLowerCase()} `
        )
    ) {
      name =
        name
          .slice(
            city.length
          )
          .trim();
    } else if (
      city &&
      name.toLocaleLowerCase() ===
        city.toLocaleLowerCase() &&
      code
    ) {
      name = '';
    }

    if (
      (
        name &&
        isSafeProperName(name)
      ) ||
      code ||
      terminalMatch?.[1]
    ) {
      return {
        name,
        international:Boolean(airportMatch[2]),
        code,
        terminal:terminalMatch?.[1] || ''
      };
    }
  }

  if (code || terminalMatch?.[1]) {
    return {
      name:'',
      international:false,
      code,
      terminal:terminalMatch?.[1] || ''
    };
  }

  return null;
}

function localizeAirportTitleData(
  data: AirportTitleData,
  lang: string
) {
  const template =
    airportTitleTemplates[lang] ||
    airportTitleTemplates.en;

  let label = '';

  if (data.name) {
    label =
      (
        data.international
          ? template.international
          : template.airport
      ).replace(
        '{name}',
        data.name
      );

    if (data.code) {
      label += ` (${data.code})`;
    }
  } else if (data.code) {
    label = data.code;
  }

  if (data.terminal) {
    const terminalLabel =
      template.terminal.replace(
        '{number}',
        data.terminal
      );

    label =
      label
        ? `${label} | ${terminalLabel}`
        : terminalLabel;
  }

  return label;
}

function isSeoTitleDetailSafe(
  detail: Detail,
  video: Video
) {
  const normalized =
    detail.name
      .toLocaleLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();

  if (!normalized) return false;

  const city =
    String(video.city || '')
      .toLocaleLowerCase()
      .trim();

  const country =
    String(video.country || '')
      .toLocaleLowerCase()
      .trim();

  const inferredCity =
    !video.city
      ? inferCityFromTitle(
          video.title,
          findCountry(
            cleanTitle(video.title)
          )?.matched ||
          null
        )
          .toLocaleLowerCase()
          .trim()
      : '';

  if (
    normalized === city ||
    normalized === country ||
    (
      inferredCity &&
      normalized === inferredCity
    )
  ) {
    return false;
  }

  if (
    /\b(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b/i.test(normalized)
  ) {
    return false;
  }

  const words =
    normalized
      .split(/\s+/)
      .filter(Boolean);

  if (
    words.some(
      (word) =>
        weakWords.has(word)
    )
  ) {
    return false;
  }

  if (!detail.type) {
    const genericUntyped =
      new Set([
        'a','an','the','in','on','at','of','for','to','from','with','and','or',
        'central','downtown','countryside','capital','powerful','most','intense',
        'area','areas','region','regions','place','places','life','vibes','vibe',
        'outdoor','dining','cafe','cafes','crowd','crowds','restaurant','restaurants',
        'shop','shops','shopping','atmosphere','ambience','ambient'
      ]);

    if (
      words.some(
        (word) =>
          genericUntyped.has(word)
      )
    ) {
      return false;
    }

    if (
      words.length >= 4
    ) {
      return false;
    }
  }

  return true;
}

function parseSeoRoutePart(
  value: string,
  video: Video
) {
  const country =
    findCountry(
      cleanTitle(video.title)
    );

  const candidate =
    sanitizeCandidate(
      value,
      video,
      country?.matched ||
      null
    );

  const detail =
    parseDetail(
      candidate,
      50
    );

  return (
    detail &&
    isSeoTitleDetailSafe(
      detail,
      video
    )
  )
    ? detail
    : null;
}

function extractSeoTitleRoute(
  video: Video,
  lang: string
) {
  const title =
    cleanTitle(video.title);

  const patterns = [
    /\bfrom\s+(.+?)\s+to\s+(.+?)(?=\s+\||\s+[–—-]\s+|$)/iu,
    /(?:^|\|)\s*([^|]{2,45}?)\s+to\s+([^|]{2,45}?)(?=\||$)/iu
  ];

  for (
    const pattern
    of patterns
  ) {
    const match =
      title.match(pattern);

    if (!match) continue;

    const first =
      parseSeoRoutePart(
        match[1],
        video
      );

    const second =
      parseSeoRoutePart(
        match[2],
        video
      );

    if (
      first &&
      second &&
      first.name.toLocaleLowerCase() !==
        second.name.toLocaleLowerCase()
    ) {
      return `${localizeDetail(first, lang)} → ${localizeDetail(second, lang)}`;
    }
  }

  return '';
}

function getSeoPreferredDetail(
  video: Video,
  lang: string,
  family: SeoContentFamily
) {
  if (family === 'airport') {
    const airport =
      extractAirportTitleData(video);

    if (airport) {
      const label =
        localizeAirportTitleData(
          airport,
          lang
        );

      if (label) {
        return label;
      }
    }
  }

  const route =
    extractSeoTitleRoute(
      video,
      lang
    );

  if (route) {
    return route;
  }

  const details = [
    ...extractTitleDetails(video),
    ...extractRouteDetails(video)
  ];

  for (
    const detail
    of details
  ) {
    if (
      isSeoTitleDetailSafe(
        detail,
        video
      )
    ) {
      return localizeDetail(
        detail,
        lang
      );
    }
  }

  return '';
}

function styleFromDetail(
  detail: Detail | null,
  current: SeoTitleStyle
): SeoTitleStyle {
  if (
    current !== 'walking' &&
    current !== 'cityWalk'
  ) {
    return current;
  }

  switch (
    detail?.type
  ) {
    case 'luxuryShoppingDistrict':
    case 'shoppingDistrict':
      return 'shoppingWalk';

    case 'waterfront':
    case 'promenade':
      return 'waterfrontWalk';

    case 'historicDistrict':
    case 'oldTown':
    case 'templeArea':
    case 'temple':
      return 'historicWalk';

    default:
      return current;
  }
}

function getSeoStyleLabel(
  style: SeoTitleStyle,
  lang: string,
  videoId: string,
  hasDetail: boolean
) {
  if (
    style === 'walking' &&
    !hasDetail
  ) {
    const variants =
      neutralWalkingVariants[lang] ||
      neutralWalkingVariants.en;

    return variants[
      hashSeed(
        `${videoId}|neutral-title`
      ) %
      variants.length
    ];
  }

  return (
    seoTitleStyleNames[
      style
    ]?.[lang] ||
    seoTitleStyleNames[
      style
    ]?.en ||
    seoTitleStyleNames.walking.en
  );
}

function formatSeoTitleDate(
  value: string | undefined,
  lang: string
) {
  if (!value) return '';

  const date =
    new Date(value);

  if (
    !Number.isFinite(
      date.getTime()
    )
  ) {
    return '';
  }

  try {
    return new Intl.DateTimeFormat(
      lang,
      {
        year:'numeric',
        month:'short',
        day:'numeric'
      }
    ).format(date);
  } catch {
    return value.slice(0, 7);
  }
}

function formatSeoTitlePublication(
  value: string | undefined,
  lang: string
) {
  if (!value) return '';

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return '';
  }

  try {
    return new Intl.DateTimeFormat(
      lang,
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC'
      }
    ).format(date);
  } catch {
    return value.slice(0, 16).replace('T', ' ');
  }
}

function trimSeoTitle(
  value: string,
  maxLength: number
) {
  const cleaned =
    value
      .replace(/\s+/g, ' ')
      .replace(/\s+\|\s+\|/g, ' | ')
      .replace(/^\s*\|\s*|\s*\|\s*$/g, '')
      .trim();

  if (
    cleaned.length <=
    maxLength
  ) {
    return cleaned;
  }

  const parts =
    cleaned.split(' | ');

  if (
    parts.length >= 3
  ) {
    const shorter =
      `${parts[0]} | ${parts[parts.length - 1]}`;

    if (
      shorter.length <=
      maxLength
    ) {
      return shorter;
    }
  }

  return cleaned
    .slice(
      0,
      maxLength
    )
    .replace(
      /\s+\S*$/,
      ''
    )
    .replace(
      /[|:;,\-–—]+$/,
      ''
    )
    .trim();
}

export function getVideoSeoAnalysis(
  video: Video,
  lang?: string
) {
  const l =
    normalizeLang(lang);

  const cacheKey =
    `${video.id}|${video.title}|${video.description || ''}|${video.category || ''}|${video.badge || ''}|${video.city || ''}|${video.country || ''}`;

  const cached =
    titleAnalysisCache.get(
      cacheKey
    );

  if (cached) {
    return {
      ...cached,
      detail:
        getSeoPreferredDetail(
          video,
          l,
          cached.family
        )
    };
  }

  const family =
    resolveSeoContentFamily(
      video
    );

  let style =
    detectSeoTitleStyle(
      video,
      family
    );

  const rawDetail =
    getBestDetail(video);

  style =
    family === 'walking'
      ? styleFromDetail(
          rawDetail,
          style
        )
      : style;

  const analysis:
    SeoTitleAnalysis = {
      family,
      style,
      detail:'',
      quality:
        getSeoTitleQuality(
          video
        )
    };

  titleAnalysisCache.set(
    cacheKey,
    analysis
  );

  return {
    ...analysis,
    detail:
      getSeoPreferredDetail(
        video,
        l,
        family
      )
  };
}


const MAX_VIDEO_TITLE_LENGTH = 108;
const MAX_META_DESCRIPTION_LENGTH = 155;
const MIN_INDEX_QUALITY_SCORE = 70;

function buildVideoTitle(
  video: Video,
  lang: string
) {
  const analysis =
    getVideoSeoAnalysis(
      video,
      lang
    );

  const location =
    getLocationLabel(
      video,
      lang
    );

  const detail =
    analysis.detail;

  const styleLabel =
    getSeoStyleLabel(
      analysis.style,
      lang,
      video.id,
      Boolean(detail)
    );

  const suffix =
    analysis.quality
      ? `${styleLabel} ${analysis.quality}`
      : styleLabel;

  const dateQualifier =
    !detail
      ? formatSeoTitleDate(
          video.publishedAt,
          lang
        )
      : '';

  const city =
    String(video.city || '')
      .trim();

  const attempts = [
    location &&
    detail
      ? `${location} | ${detail} | ${suffix}`
      : '',

    city &&
    detail
      ? `${city} | ${detail} | ${suffix}`
      : '',

    location &&
    dateQualifier
      ? `${location} | ${suffix} | ${dateQualifier}`
      : '',

    location
      ? `${location} | ${suffix}`
      : '',

    detail
      ? `${detail} | ${suffix}`
      : '',

    dateQualifier
      ? `${suffix} | ${dateQualifier}`
      : '',

    suffix
  ].filter(Boolean);

  return (
    attempts.find(
      (item) =>
        item.length <=
        MAX_VIDEO_TITLE_LENGTH
    ) ||
    trimSeoTitle(
      attempts[0] ||
      suffix,
      MAX_VIDEO_TITLE_LENGTH
    )
  );
}

export function getVideoCardTitle(
  video: Video,
  lang?: string
) {
  return buildVideoTitle(
    video,
    normalizeLang(lang)
  );
}

function resolveCategoryFromSeoTitle(
  seoTitle: string
) {
  const title =
    String(seoTitle || '')
      .normalize('NFKC')
      .toLocaleLowerCase();

  if (
    /\b(?:airport|terminal walkthrough|airport walkthrough|airport walk)\b/i.test(title)
  ) {
    return 'Airport Walks';
  }

  if (
    /\b(?:drone|aerial|aerial journey|aerial view|drone film)\b/i.test(title)
  ) {
    return 'Drone & Aerial';
  }

  if (
    /\b(?:beach walking tour|beach walk|coastal walk)\b/i.test(title)
  ) {
    return 'Beach Walking Tours';
  }

  if (
    /\b(?:street food tour|food tour|market food tour)\b/i.test(title)
  ) {
    return 'Street Food';
  }

  if (
    /\b(?:nature walk|nature walking tour|scenic nature walk)\b/i.test(title)
  ) {
    return 'Nature Trails';
  }

  if (
    /\b(?:culture tour|culture walking tour|museum & culture tour|museum and culture tour)\b/i.test(title)
  ) {
    return 'Museums & Culture';
  }

  if (
    /\b(?:pov ride|pov tour)\b/i.test(title)
  ) {
    return 'POV Rides';
  }

  if (
    /\b(?:travel documentary|documentary)\b/i.test(title)
  ) {
    return 'Documentaries';
  }

  if (
    /\b(?:rain|rainy|night|evening|after dark)\b/i.test(title)
  ) {
    return 'Night & Rain';
  }

  return 'Walking Tours';
}

export function getResolvedVideoCategory(
  video: Video
) {
  const canonicalSeoTitle =
    buildVideoTitle(
      video,
      'en'
    );

  return resolveCategoryFromSeoTitle(
    canonicalSeoTitle
  );
}

export function getVideoSeoStyleLabel(
  video: Video,
  lang?: string
) {
  const l =
    normalizeLang(lang);

  const analysis =
    getVideoSeoAnalysis(
      video,
      l
    );

  return getSeoStyleLabel(
    analysis.style,
    l,
    video.id,
    Boolean(analysis.detail)
  );
}

const descriptionText:
Record<
  string,
  {
    open: string[];
    detail: string[];
    route: string[];
    date: string[];
    close: string[];
  }
> = {
  en:{
    open:[
      '{location} — {feature} in 4K.',
      'Explore {location} through this 4K {feature}.',
      'This 4K {feature} takes you through {location}.'
    ],
    detail:[
      'Featured location: {detail}.',
      'A key location in the video is {detail}.',
      'The video highlights {detail}.'
    ],
    route:[
      'Route highlights include {route}.',
      'Along the route you can see {route}.',
      'The route features {route}.'
    ],
    date:[
      'Published on {date}.',
      'Video date: {date}.'
    ],
    close:[
      'See the real streets, surroundings and atmosphere captured in the video.',
      'Experience the places and street-level atmosphere shown in the video.',
      'Discover the real locations and surroundings shown on screen.'
    ]
  },

  tr:{
    open:[
      '{location} — 4K {feature}.',
      '{location} konumunu bu 4K {feature} ile keşfedin.',
      'Bu 4K {feature}, {location} çevresini gösteriyor.'
    ],
    detail:[
      'Öne çıkan nokta: {detail}.',
      'Videodaki önemli noktalardan biri {detail}.',
      'Videoda {detail} öne çıkıyor.'
    ],
    route:[
      'Rota üzerinde {route} yer alıyor.',
      'Rota noktaları arasında {route} bulunuyor.',
      'Güzergâh {route} noktalarını içeriyor.'
    ],
    date:[
      'Yayın tarihi: {date}.',
      'Video tarihi: {date}.'
    ],
    close:[
      'Videoda görülen gerçek sokakları, çevreyi ve atmosferi keşfedin.',
      'Videonun gösterdiği gerçek yerleri ve sokak atmosferini deneyimleyin.',
      'Ekranda görülen gerçek konumları ve çevreyi keşfedin.'
    ]
  },

  de:{
    open:[
      '{location} — {feature} in 4K.',
      'Entdecke {location} mit dieser 4K-{feature}.',
      'Diese 4K-{feature} führt durch {location}.'
    ],
    detail:[
      'Im Mittelpunkt steht {detail}.',
      'Ein wichtiger Ort im Video ist {detail}.',
      'Das Video zeigt besonders {detail}.'
    ],
    route:[
      'Zu den Routenpunkten gehören {route}.',
      'Entlang der Route siehst du {route}.',
      'Die Route führt über {route}.'
    ],
    date:[
      'Veröffentlicht am {date}.',
      'Videodatum: {date}.'
    ],
    close:[
      'Erlebe die echten Straßen, Orte und die Atmosphäre aus dem Video.',
      'Entdecke die im Video gezeigten Straßen und die Umgebung vor Ort.',
      'Sieh die realen Orte und Umgebungen, die im Video gezeigt werden.'
    ]
  },

  es:{
    open:[
      '{location} — {feature} en 4K.',
      'Explora {location} con este {feature} en 4K.',
      'Este {feature} en 4K recorre {location}.'
    ],
    detail:[
      'Lugar destacado: {detail}.',
      'Un punto importante del video es {detail}.',
      'El video destaca {detail}.'
    ],
    route:[
      'La ruta incluye {route}.',
      'Entre los puntos del recorrido están {route}.',
      'El recorrido pasa por {route}.'
    ],
    date:[
      'Publicado el {date}.',
      'Fecha del video: {date}.'
    ],
    close:[
      'Descubre las calles, los lugares y el ambiente real que muestra el video.',
      'Vive el entorno y la atmósfera a pie de calle que aparecen en el video.',
      'Explora los lugares y alrededores reales que aparecen en pantalla.'
    ]
  },

  it:{
    open:[
      '{location} — {feature} in 4K.',
      'Scopri {location} con questo {feature} in 4K.',
      'Questo {feature} in 4K attraversa {location}.'
    ],
    detail:[
      'Luogo in evidenza: {detail}.',
      'Un punto importante del video è {detail}.',
      'Il video mette in evidenza {detail}.'
    ],
    route:[
      'Il percorso comprende {route}.',
      'Tra i punti del percorso ci sono {route}.',
      'Il percorso passa per {route}.'
    ],
    date:[
      'Pubblicato il {date}.',
      'Data del video: {date}.'
    ],
    close:[
      'Scopri le strade, i luoghi e l’atmosfera reale mostrati nel video.',
      'Vivi l’ambiente e le strade reali riprese nel video.',
      'Esplora i luoghi e gli ambienti reali visibili sullo schermo.'
    ]
  },

  fr:{
    open:[
      '{location} — {feature} en 4K.',
      'Découvrez {location} avec cette {feature} en 4K.',
      'Cette {feature} en 4K parcourt {location}.'
    ],
    detail:[
      'Lieu mis en avant : {detail}.',
      'Un lieu important de la vidéo est {detail}.',
      'La vidéo met en valeur {detail}.'
    ],
    route:[
      'Le parcours comprend {route}.',
      'Parmi les étapes du parcours : {route}.',
      'Le parcours passe par {route}.'
    ],
    date:[
      'Publié le {date}.',
      'Date de la vidéo : {date}.'
    ],
    close:[
      'Découvrez les rues, les lieux et l’atmosphère réelle filmés dans la vidéo.',
      'Vivez l’ambiance des rues et des lieux montrés dans la vidéo.',
      'Explorez les lieux et les environs réels visibles à l’écran.'
    ]
  },

  ja:{
    open:[
      '{location} — 4Kの{feature}。',
      '4Kの{feature}で{location}を探索します。',
      'この4K{feature}では{location}を巡ります。'
    ],
    detail:[
      '見どころ：{detail}。',
      '映像の重要な場所：{detail}。',
      '映像では{detail}が見どころです。'
    ],
    route:[
      'ルートには{route}が含まれます。',
      '主なルート地点は{route}です。',
      'ルートは{route}を通ります。'
    ],
    date:[
      '公開日：{date}。',
      '映像の日付：{date}。'
    ],
    close:[
      '映像に映る実際の街並み、場所、雰囲気をお楽しみください。',
      '現地の通りや周辺の雰囲気を映像で体験できます。',
      '画面に映る実際の場所と周辺環境をご覧ください。'
    ]
  },

  pt:{
    open:[
      '{location} — {feature} em 4K.',
      'Explore {location} neste {feature} em 4K.',
      'Este {feature} em 4K percorre {location}.'
    ],
    detail:[
      'Local em destaque: {detail}.',
      'Um ponto importante do vídeo é {detail}.',
      'O vídeo destaca {detail}.'
    ],
    route:[
      'A rota inclui {route}.',
      'Entre os pontos da rota estão {route}.',
      'O percurso passa por {route}.'
    ],
    date:[
      'Publicado em {date}.',
      'Data do vídeo: {date}.'
    ],
    close:[
      'Descubra as ruas, os lugares e a atmosfera real mostrados no vídeo.',
      'Veja o ambiente e as ruas reais capturados no vídeo.',
      'Explore os locais e arredores reais mostrados na tela.'
    ]
  },

  ru:{
    open:[
      '{location} — {feature} в 4K.',
      'Исследуйте {location} в формате {feature} 4K.',
      'Этот материал {feature} 4K проходит по {location}.'
    ],
    detail:[
      'Главная точка: {detail}.',
      'Важное место в видео — {detail}.',
      'В видео особенно показан {detail}.'
    ],
    route:[
      'Маршрут включает {route}.',
      'Среди точек маршрута: {route}.',
      'Маршрут проходит через {route}.'
    ],
    date:[
      'Опубликовано {date}.',
      'Дата видео: {date}.'
    ],
    close:[
      'Посмотрите реальные улицы, места и атмосферу, показанные в видео.',
      'Почувствуйте атмосферу улиц и мест, снятых в видео.',
      'Исследуйте реальные места и окружение, показанные на экране.'
    ]
  },

  zh:{
    open:[
      '{location} — 4K{feature}。',
      '通过这段4K{feature}探索{location}。',
      '这段4K{feature}带你走进{location}。'
    ],
    detail:[
      '重点地点：{detail}。',
      '视频中的重要地点是{detail}。',
      '视频重点展示{detail}。'
    ],
    route:[
      '路线包括{route}。',
      '沿途可看到{route}。',
      '路线经过{route}。'
    ],
    date:[
      '发布日期：{date}。',
      '视频日期：{date}。'
    ],
    close:[
      '感受视频中真实的街道、地点与现场氛围。',
      '探索画面中真实的街景、环境和地点。',
      '查看屏幕中真实出现的地点和周边环境。'
    ]
  },

  ko:{
    open:[
      '{location} — 4K {feature}.',
      '4K {feature}로 {location}를 둘러보세요.',
      '이 4K {feature}는 {location}를 담고 있습니다.'
    ],
    detail:[
      '주요 장소: {detail}.',
      '영상의 중요한 장소는 {detail}입니다.',
      '영상에서는 {detail}를 중심으로 보여줍니다.'
    ],
    route:[
      '경로에는 {route}가 포함됩니다.',
      '주요 경로 지점은 {route}입니다.',
      '경로는 {route}를 지나갑니다.'
    ],
    date:[
      '게시일: {date}.',
      '영상 날짜: {date}.'
    ],
    close:[
      '영상에 담긴 실제 거리와 장소, 분위기를 경험해 보세요.',
      '현장의 거리 풍경과 주변 분위기를 영상으로 만나보세요.',
      '화면에 보이는 실제 장소와 주변 환경을 확인해 보세요.'
    ]
  },

  ar:{
    open:[
      '{location} — {feature} بدقة 4K.',
      'استكشف {location} عبر {feature} بدقة 4K.',
      'يأخذك هذا {feature} بدقة 4K عبر {location}.'
    ],
    detail:[
      'الموقع الأبرز: {detail}.',
      'من المواقع المهمة في الفيديو {detail}.',
      'يركز الفيديو على {detail}.'
    ],
    route:[
      'يشمل المسار {route}.',
      'من أبرز نقاط المسار {route}.',
      'يمر المسار عبر {route}.'
    ],
    date:[
      'تاريخ النشر: {date}.',
      'تاريخ الفيديو: {date}.'
    ],
    close:[
      'شاهد الشوارع والأماكن والأجواء الحقيقية التي تظهر في الفيديو.',
      'اكتشف أجواء الشوارع والمواقع الحقيقية المصورة في الفيديو.',
      'استكشف المواقع الحقيقية والمناطق المحيطة الظاهرة على الشاشة.'
    ]
  },

  hi:{
    open:[
      '{location} — 4K {feature}.',
      'इस 4K {feature} के साथ {location} को देखें।',
      'यह 4K {feature} आपको {location} की सैर कराता है।'
    ],
    detail:[
      'मुख्य स्थान: {detail}।',
      'वीडियो का एक महत्वपूर्ण स्थान {detail} है।',
      'वीडियो में {detail} प्रमुख है।'
    ],
    route:[
      'मार्ग में {route} शामिल हैं।',
      'रूट के प्रमुख स्थानों में {route} शामिल हैं।',
      'रूट {route} से होकर गुजरता है।'
    ],
    date:[
      'प्रकाशित: {date}।',
      'वीडियो की तारीख: {date}।'
    ],
    close:[
      'वीडियो में दिखाई गई वास्तविक सड़कों, जगहों और माहौल का अनुभव करें।',
      'स्थानीय सड़कों और आसपास के वास्तविक वातावरण को वीडियो में देखें।',
      'स्क्रीन पर दिखाई गई वास्तविक जगहों और आसपास के क्षेत्र को देखें।'
    ]
  },

  nl:{
    open:[
      '{location} — {feature} in 4K.',
      'Ontdek {location} met deze {feature} in 4K.',
      'Deze {feature} in 4K voert door {location}.'
    ],
    detail:[
      'Uitgelichte locatie: {detail}.',
      'Een belangrijke plek in de video is {detail}.',
      'De video legt de nadruk op {detail}.'
    ],
    route:[
      'De route bevat {route}.',
      'Langs de route zie je {route}.',
      'De route loopt via {route}.'
    ],
    date:[
      'Gepubliceerd op {date}.',
      'Videodatum: {date}.'
    ],
    close:[
      'Ontdek de echte straten, plekken en sfeer die in de video zijn vastgelegd.',
      'Ervaar de straten en omgeving zoals ze in de video te zien zijn.',
      'Bekijk de echte locaties en omgeving die op het scherm te zien zijn.'
    ]
  },

  pl:{
    open:[
      '{location} — {feature} w 4K.',
      'Odkryj {location} dzięki temu materiałowi {feature} w 4K.',
      'Ten materiał {feature} w 4K prowadzi przez {location}.'
    ],
    detail:[
      'Wyróżnione miejsce: {detail}.',
      'Ważnym miejscem w filmie jest {detail}.',
      'Film pokazuje przede wszystkim {detail}.'
    ],
    route:[
      'Trasa obejmuje {route}.',
      'Wśród punktów trasy znajdują się {route}.',
      'Trasa prowadzi przez {route}.'
    ],
    date:[
      'Opublikowano {date}.',
      'Data filmu: {date}.'
    ],
    close:[
      'Zobacz prawdziwe ulice, miejsca i atmosferę uchwycone w filmie.',
      'Poznaj ulice i otoczenie pokazane w filmie.',
      'Zobacz prawdziwe miejsca i otoczenie widoczne na ekranie.'
    ]
  },

  sv:{
    open:[
      '{location} — {feature} i 4K.',
      'Upptäck {location} med denna {feature} i 4K.',
      'Denna {feature} i 4K tar dig genom {location}.'
    ],
    detail:[
      'Utvald plats: {detail}.',
      'En viktig plats i videon är {detail}.',
      'Videon lyfter fram {detail}.'
    ],
    route:[
      'Rutten omfattar {route}.',
      'Längs rutten ser du {route}.',
      'Rutten går via {route}.'
    ],
    date:[
      'Publicerad {date}.',
      'Videodatum: {date}.'
    ],
    close:[
      'Upptäck de verkliga gatorna, platserna och atmosfären i videon.',
      'Upplev gatumiljön och omgivningarna som visas i videon.',
      'Se de verkliga platserna och omgivningarna som syns på skärmen.'
    ]
  },

  id:{
    open:[
      '{location} — {feature} dalam 4K.',
      'Jelajahi {location} melalui {feature} 4K ini.',
      '{feature} 4K ini membawa Anda menyusuri {location}.'
    ],
    detail:[
      'Lokasi unggulan: {detail}.',
      'Lokasi penting dalam video adalah {detail}.',
      'Video menyoroti {detail}.'
    ],
    route:[
      'Rute mencakup {route}.',
      'Titik utama rute meliputi {route}.',
      'Rute melewati {route}.'
    ],
    date:[
      'Dipublikasikan {date}.',
      'Tanggal video: {date}.'
    ],
    close:[
      'Saksikan jalan, tempat, dan suasana nyata yang direkam dalam video.',
      'Rasakan lingkungan jalan dan tempat nyata yang terlihat dalam video.',
      'Lihat lokasi dan lingkungan nyata yang tampil di layar.'
    ]
  },

  vi:{
    open:[
      '{location} — {feature} 4K.',
      'Khám phá {location} qua {feature} 4K này.',
      '{feature} 4K này đưa bạn qua {location}.'
    ],
    detail:[
      'Địa điểm nổi bật: {detail}.',
      'Một địa điểm quan trọng trong video là {detail}.',
      'Video tập trung vào {detail}.'
    ],
    route:[
      'Tuyến đường gồm {route}.',
      'Các điểm chính trên tuyến gồm {route}.',
      'Tuyến đường đi qua {route}.'
    ],
    date:[
      'Đăng ngày {date}.',
      'Ngày video: {date}.'
    ],
    close:[
      'Khám phá những con phố, địa điểm và bầu không khí thực tế trong video.',
      'Trải nghiệm đường phố và không gian thực tế được ghi lại trong video.',
      'Xem các địa điểm và khu vực thực tế xuất hiện trên màn hình.'
    ]
  }
};

const genericOpenText: Record<string, string[]> = {
  en:['This video presents a 4K {feature}.'],
  tr:['Bu video bir 4K {feature} sunuyor.'],
  de:['Dieses Video zeigt eine 4K-{feature}.'],
  es:['Este video presenta un {feature} en 4K.'],
  it:['Questo video presenta un {feature} in 4K.'],
  fr:['Cette vidéo présente une {feature} en 4K.'],
  ja:['この動画では4Kの{feature}を楽しめます。'],
  pt:['Este vídeo apresenta um {feature} em 4K.'],
  ru:['В этом видео представлен 4K-маршрут: {feature}.'],
  zh:['本视频呈现4K{feature}。'],
  ko:['이 영상은 4K {feature}을 보여 줍니다.'],
  ar:['يقدم هذا الفيديو {feature} بدقة 4K.'],
  hi:['यह वीडियो 4K {feature} प्रस्तुत करता है।'],
  nl:['Deze video toont een {feature} in 4K.'],
  pl:['Ten film przedstawia {feature} w 4K.'],
  sv:['Den här videon visar en {feature} i 4K.'],
  id:['Video ini menyajikan {feature} dalam 4K.'],
  vi:['Video này giới thiệu {feature} ở chất lượng 4K.']
};

const sourceText: Record<string, string[]> = {
  en:['Published by {channel}.'],
  tr:['{channel} tarafından yayımlandı.'],
  de:['Veröffentlicht von {channel}.'],
  es:['Publicado por {channel}.'],
  it:['Pubblicato da {channel}.'],
  fr:['Publié par {channel}.'],
  ja:['公開元: {channel}。'],
  pt:['Publicado por {channel}.'],
  ru:['Опубликовано каналом {channel}.'],
  zh:['由{channel}发布。'],
  ko:['{channel}에서 게시했습니다.'],
  ar:['نشره {channel}.'],
  hi:['{channel} द्वारा प्रकाशित।'],
  nl:['Gepubliceerd door {channel}.'],
  pl:['Opublikowano przez {channel}.'],
  sv:['Publicerad av {channel}.'],
  id:['Dipublikasikan oleh {channel}.'],
  vi:['Được đăng bởi {channel}.']
};

const chapterText: Record<string, string[]> = {
  en:['Verified chapters include {chapters}.'],
  tr:['Doğrulanmış bölümler arasında {chapters} bulunuyor.'],
  de:['Zu den bestätigten Kapiteln gehören {chapters}.'],
  es:['Los capítulos verificados incluyen {chapters}.'],
  it:['I capitoli verificati includono {chapters}.'],
  fr:['Les chapitres vérifiés comprennent {chapters}.'],
  ja:['確認済みのチャプターには{chapters}が含まれます。'],
  pt:['Os capítulos verificados incluem {chapters}.'],
  ru:['Проверенные главы включают {chapters}.'],
  zh:['已验证的章节包括{chapters}。'],
  ko:['확인된 챕터에는 {chapters}이 포함됩니다.'],
  ar:['تتضمن الفصول الموثقة {chapters}.'],
  hi:['सत्यापित अध्यायों में {chapters} शामिल हैं।'],
  nl:['De geverifieerde hoofdstukken omvatten {chapters}.'],
  pl:['Zweryfikowane rozdziały obejmują {chapters}.'],
  sv:['Verifierade kapitel omfattar {chapters}.'],
  id:['Bab terverifikasi mencakup {chapters}.'],
  vi:['Các chương đã xác minh gồm {chapters}.']
};

type DescriptionContextMode =
  | 'ground'
  | 'aerial'
  | 'ride'
  | 'documentary';

const descriptionContextText: Record<
  string,
  {
    ground: string;
    aerial: string;
    ride: string;
    documentary: string;
    quality: string;
    related: string;
    relatedGeneric: string;
  }
> = {
  en: {
    ground: 'The recording follows the filmed route at ground level, keeping {location} in view as a continuous {feature}. It shows the routes, public or visitor areas, surrounding details and everyday movement that actually appear on screen.',
    aerial: 'The aerial recording shows {location} from above, providing a broad view of the visible urban form, landscape and spatial relationships that cannot be seen from ground level.',
    ride: 'The moving point-of-view recording follows the filmed route through {location}, showing how the visible roads, scenery and surrounding areas connect along the journey.',
    documentary: 'The recording brings together the destination views and context actually presented for {location}, while this page summarizes the verified location, category and publication details.',
    quality: 'The {quality} presentation preserves fine visual detail and motion throughout the recording.',
    related: 'Use the related videos to compare other recorded areas and {feature} entries from {location}.',
    relatedGeneric: 'Use the related videos to compare other recorded areas and {feature} entries in the collection.'
  },
  tr: {
    ground: 'Kayıt, çekilen güzergâhı zemin seviyesinde kesintisiz bir {feature} olarak izler ve {location} çevresini doğrudan gösterir. Ekranda gerçekten görülen rotaları, kamusal veya ziyaret alanlarını, çevresel ayrıntıları ve günlük hareketi sunar.',
    aerial: 'Hava çekimi, {location} bölgesini yukarıdan göstererek şehir dokusu, manzara ve alanların birbiriyle ilişkisi hakkında zemin seviyesinden görülemeyen geniş bir bakış sunar.',
    ride: 'Hareketli bakış açısı kaydı, {location} içindeki çekim rotasını kesintisiz izleyerek yol boyunca görülen yolların, manzaranın ve çevredeki alanların birbirine nasıl bağlandığını gösterir.',
    documentary: 'Kayıt, {location} için kaynak videoda gerçekten sunulan destinasyon görüntülerini ve bağlamı bir araya getirir; bu sayfa doğrulanmış konum, kategori ve yayın bilgilerini özetler.',
    quality: '{quality} sunum, kayıt boyunca ince görsel ayrıntıların ve hareketin korunmasına yardımcı olur.',
    related: 'Benzer videolarla {location} için kaydedilmiş diğer bölgeleri ve {feature} içeriklerini karşılaştırabilirsiniz.',
    relatedGeneric: 'Benzer videolarla koleksiyondaki diğer bölgeleri ve {feature} içeriklerini karşılaştırabilirsiniz.'
  },
  de: {
    ground: 'Die Aufnahme folgt der gefilmten Route auf Bodenhöhe und zeigt {location} als fortlaufenden {feature}. Zu sehen sind die Wege, öffentlichen oder zugänglichen Bereiche, Umgebungsdetails und alltäglichen Bewegungen, die tatsächlich im Bild erscheinen.',
    aerial: 'Die Luftaufnahme zeigt {location} von oben und vermittelt einen weiten Blick auf sichtbare Stadtstrukturen, Landschaften und räumliche Zusammenhänge, die vom Boden aus nicht erkennbar sind.',
    ride: 'Die bewegte Perspektivaufnahme folgt der gefilmten Route durch {location} und zeigt, wie die sichtbaren Straßen, Landschaften und umliegenden Bereiche entlang der Strecke zusammenhängen.',
    documentary: 'Die Aufnahme bündelt die für {location} tatsächlich gezeigten Ansichten und Zusammenhänge; diese Seite fasst bestätigte Angaben zu Ort, Kategorie und Veröffentlichung zusammen.',
    quality: 'Die Darstellung in {quality} bewahrt feine Bilddetails und Bewegungen während der gesamten Aufnahme.',
    related: 'Mit den verwandten Videos lassen sich weitere aufgezeichnete Gebiete und {feature}-Beiträge aus {location} vergleichen.',
    relatedGeneric: 'Mit den verwandten Videos lassen sich weitere aufgezeichnete Gebiete und {feature}-Beiträge der Sammlung vergleichen.'
  },
  es: {
    ground: 'La grabación sigue la ruta filmada a nivel del suelo y mantiene {location} en pantalla como un {feature} continuo. Muestra los recorridos, espacios públicos o de visita, detalles del entorno y movimientos cotidianos que realmente aparecen en el vídeo.',
    aerial: 'La grabación aérea muestra {location} desde arriba y ofrece una visión amplia de la forma urbana, el paisaje y las relaciones espaciales visibles que no pueden apreciarse desde el suelo.',
    ride: 'La grabación en movimiento sigue la ruta filmada por {location} y muestra cómo se conectan las carreteras, el paisaje y las zonas circundantes visibles durante el trayecto.',
    documentary: 'La grabación reúne las vistas y el contexto realmente presentados sobre {location}, mientras esta página resume la ubicación, la categoría y los datos de publicación verificados.',
    quality: 'La presentación en {quality} conserva los detalles visuales y el movimiento durante toda la grabación.',
    related: 'Utiliza los vídeos relacionados para comparar otras zonas grabadas y contenidos de {feature} de {location}.',
    relatedGeneric: 'Utiliza los vídeos relacionados para comparar otras zonas grabadas y contenidos de {feature} de la colección.'
  },
  it: {
    ground: 'La registrazione segue il percorso filmato a livello del suolo e mantiene {location} al centro di un {feature} continuo. Mostra i percorsi, gli spazi pubblici o visitabili, i dettagli dell’ambiente e i movimenti quotidiani realmente presenti sullo schermo.',
    aerial: 'La ripresa aerea mostra {location} dall’alto e offre una visione ampia della forma urbana, del paesaggio e dei rapporti spaziali visibili che non si possono osservare da terra.',
    ride: 'La ripresa in movimento segue il percorso filmato attraverso {location} e mostra come strade, paesaggi e aree circostanti visibili si collegano lungo il tragitto.',
    documentary: 'La registrazione riunisce le vedute e il contesto realmente presentati per {location}, mentre questa pagina riassume i dati verificati su luogo, categoria e pubblicazione.',
    quality: 'La presentazione in {quality} conserva i dettagli visivi e il movimento per tutta la registrazione.',
    related: 'Usa i video correlati per confrontare altre aree registrate e contenuti di {feature} da {location}.',
    relatedGeneric: 'Usa i video correlati per confrontare altre aree registrate e contenuti di {feature} della raccolta.'
  },
  fr: {
    ground: 'L’enregistrement suit le parcours filmé au niveau du sol et garde {location} au centre d’un {feature} continu. Il montre les itinéraires, les espaces publics ou accessibles, les détails environnants et les mouvements quotidiens réellement visibles à l’écran.',
    aerial: 'La prise de vue aérienne montre {location} depuis le ciel et offre une vue d’ensemble sur la forme urbaine, le paysage et les relations spatiales visibles qui ne peuvent pas être observées depuis le sol.',
    ride: 'La prise de vue en mouvement suit le parcours filmé à travers {location} et montre comment les routes, les paysages et les zones environnantes visibles s’enchaînent au cours du trajet.',
    documentary: 'L’enregistrement rassemble les vues et le contexte réellement présentés pour {location}, tandis que cette page résume les informations vérifiées sur le lieu, la catégorie et la publication.',
    quality: 'La présentation en {quality} préserve les détails visuels et les mouvements tout au long de l’enregistrement.',
    related: 'Utilisez les vidéos associées pour comparer d’autres zones filmées et contenus de {feature} à {location}.',
    relatedGeneric: 'Utilisez les vidéos associées pour comparer d’autres zones filmées et contenus de {feature} dans la collection.'
  },
  ja: {
    ground: '映像は地上から撮影ルートを連続してたどり、{location}を{feature}として映します。画面に実際に登場する経路、公共・見学スペース、周囲の細部、人々の動きを確認できます。',
    aerial: '空撮映像は{location}を上空から映し、地上では把握しにくい街の構造、風景、空間のつながりを広い視点で示します。',
    ride: '移動視点の映像は{location}の撮影ルートを連続して進み、道、風景、周辺エリアが行程の中でどのようにつながるかを示します。',
    documentary: '映像は{location}について元動画で実際に提示された景観と背景をまとめ、このページでは確認済みの場所、カテゴリー、公開情報を要約します。',
    quality: '{quality}の映像は、記録全体を通して細かな視覚情報と動きを保ちます。',
    related: '関連動画では、{location}で撮影された別のエリアや{feature}を比較できます。',
    relatedGeneric: '関連動画では、コレクション内の別のエリアや{feature}を比較できます。'
  },
  pt: {
    ground: 'A gravação acompanha o percurso filmado ao nível do solo e mantém {location} em destaque como um {feature} contínuo. Ela mostra os trajetos, espaços públicos ou de visita, detalhes do ambiente e movimentos cotidianos que realmente aparecem na tela.',
    aerial: 'A gravação aérea mostra {location} de cima e oferece uma visão ampla da forma urbana, da paisagem e das relações espaciais visíveis que não podem ser percebidas ao nível do solo.',
    ride: 'A gravação em movimento acompanha o trajeto filmado por {location} e mostra como as estradas, a paisagem e as áreas ao redor se conectam ao longo do percurso.',
    documentary: 'A gravação reúne as imagens e o contexto realmente apresentados sobre {location}, enquanto esta página resume os dados verificados de localização, categoria e publicação.',
    quality: 'A apresentação em {quality} preserva os detalhes visuais e o movimento durante toda a gravação.',
    related: 'Use os vídeos relacionados para comparar outras áreas gravadas e conteúdos de {feature} de {location}.',
    relatedGeneric: 'Use os vídeos relacionados para comparar outras áreas gravadas e conteúdos de {feature} da coleção.'
  },
  ru: {
    ground: 'Запись следует по снятому маршруту на уровне земли и показывает {location} как непрерывный {feature}. В кадре остаются пути, общественные или доступные для посещения пространства, детали окружения и повседневное движение, действительно попавшие в видео.',
    aerial: 'Аэросъёмка показывает {location} сверху и даёт широкий обзор видимой городской структуры, ландшафта и пространственных связей, которые нельзя оценить с уровня земли.',
    ride: 'Запись с движущейся точки зрения следует по снятому маршруту через {location} и показывает, как видимые дороги, пейзажи и окружающие районы связаны на протяжении поездки.',
    documentary: 'Запись объединяет виды и контекст, действительно представленные для {location}, а эта страница кратко сводит проверенные данные о месте, категории и публикации.',
    quality: 'Формат {quality} сохраняет мелкие визуальные детали и движение на протяжении всей записи.',
    related: 'Используйте связанные видео, чтобы сравнить другие снятые районы и материалы {feature} из {location}.',
    relatedGeneric: 'Используйте связанные видео, чтобы сравнить другие снятые районы и материалы {feature} из коллекции.'
  },
  zh: {
    ground: '视频从地面视角连续跟随拍摄路线，并以{feature}的方式呈现{location}。画面展示了真实出现的路线、公共或参观空间、周边细节与日常活动。',
    aerial: '航拍视频从空中展示{location}，呈现地面视角难以观察到的城市形态、景观以及空间之间的关系。',
    ride: '移动视角视频沿着{location}的拍摄路线连续前进，展示沿途可见道路、景观与周边区域之间的连接。',
    documentary: '视频汇集了原始内容中真实呈现的{location}景观与背景，本页面则概述已确认的地点、分类和发布时间信息。',
    quality: '{quality}画质在整段视频中保留了细致的视觉信息与动态表现。',
    related: '可通过相关视频比较{location}的其他拍摄区域与{feature}内容。',
    relatedGeneric: '可通过相关视频比较合集中的其他拍摄区域与{feature}内容。'
  },
  ko: {
    ground: '영상은 지상 시점에서 촬영 경로를 연속으로 따라가며 {location}을 {feature} 형식으로 보여 줍니다. 화면에 실제로 나타나는 경로, 공공 또는 관람 공간, 주변 세부 요소와 일상의 움직임을 확인할 수 있습니다.',
    aerial: '항공 영상은 {location}을 위에서 보여 주며 지상에서는 파악하기 어려운 도시 구조, 풍경과 공간의 관계를 넓은 시야로 전달합니다.',
    ride: '이동 시점 영상은 {location}의 촬영 경로를 연속해서 따라가며 길, 풍경과 주변 지역이 여정 속에서 어떻게 이어지는지 보여 줍니다.',
    documentary: '영상은 {location}에 대해 원본에서 실제로 제시된 장면과 맥락을 모으고, 이 페이지는 확인된 위치, 카테고리와 게시 정보를 요약합니다.',
    quality: '{quality} 화질은 영상 전체에서 세밀한 시각 정보와 움직임을 보존합니다.',
    related: '관련 영상에서 {location}의 다른 촬영 지역과 {feature} 콘텐츠를 비교할 수 있습니다.',
    relatedGeneric: '관련 영상에서 컬렉션의 다른 촬영 지역과 {feature} 콘텐츠를 비교할 수 있습니다.'
  },
  ar: {
    ground: 'يتابع التسجيل المسار المصوّر من مستوى الأرض ويعرض {location} ضمن {feature} متواصل. ويُظهر المسارات والمساحات العامة أو المخصصة للزيارة وتفاصيل البيئة والحركة اليومية الظاهرة فعلاً على الشاشة.',
    aerial: 'يعرض التصوير الجوي {location} من الأعلى ويوفر رؤية واسعة للشكل العمراني والمناظر والعلاقات المكانية التي لا يمكن ملاحظتها من مستوى الأرض.',
    ride: 'يتابع التسجيل من منظور متحرك المسار المصوّر عبر {location} ويوضح كيفية اتصال الطرق والمناظر والمناطق المحيطة الظاهرة على امتداد الرحلة.',
    documentary: 'يجمع التسجيل المشاهد والسياق المعروضين فعلاً عن {location}، بينما تلخص هذه الصفحة معلومات الموقع والفئة والنشر التي تم التحقق منها.',
    quality: 'يحافظ عرض {quality} على التفاصيل البصرية الدقيقة والحركة طوال التسجيل.',
    related: 'استخدم الفيديوهات ذات الصلة لمقارنة مناطق مصوّرة أخرى ومحتوى {feature} من {location}.',
    relatedGeneric: 'استخدم الفيديوهات ذات الصلة لمقارنة مناطق مصوّرة أخرى ومحتوى {feature} في المجموعة.'
  },
  hi: {
    ground: 'रिकॉर्डिंग ज़मीन के स्तर से फिल्माए गए मार्ग का लगातार अनुसरण करती है और {location} को एक निरंतर {feature} के रूप में दिखाती है। इसमें स्क्रीन पर वास्तव में दिखाई देने वाले मार्ग, सार्वजनिक या दर्शक क्षेत्र, आसपास के विवरण और दैनिक गतिविधियाँ शामिल हैं।',
    aerial: 'हवाई रिकॉर्डिंग {location} को ऊपर से दिखाती है और शहरी बनावट, परिदृश्य तथा स्थानों के बीच संबंधों का व्यापक दृश्य देती है, जिन्हें ज़मीन से देखना संभव नहीं होता।',
    ride: 'चलते हुए दृष्टिकोण की रिकॉर्डिंग {location} के फिल्माए गए मार्ग का अनुसरण करती है और दिखाती है कि रास्ते, दृश्य तथा आसपास के क्षेत्र यात्रा के दौरान कैसे जुड़ते हैं।',
    documentary: 'रिकॉर्डिंग {location} के बारे में स्रोत वीडियो में वास्तव में प्रस्तुत दृश्यों और संदर्भ को एक साथ लाती है, जबकि यह पेज सत्यापित स्थान, श्रेणी और प्रकाशन जानकारी का सार देता है।',
    quality: '{quality} प्रस्तुति पूरी रिकॉर्डिंग में सूक्ष्म दृश्य विवरण और गति को सुरक्षित रखती है।',
    related: 'संबंधित वीडियो से {location} के अन्य रिकॉर्ड किए गए क्षेत्रों और {feature} सामग्री की तुलना करें।',
    relatedGeneric: 'संबंधित वीडियो से संग्रह के अन्य रिकॉर्ड किए गए क्षेत्रों और {feature} सामग्री की तुलना करें।'
  },
  nl: {
    ground: 'De opname volgt de gefilmde route op grondniveau en houdt {location} in beeld als een doorlopende {feature}. Ze toont de routes, openbare of toegankelijke ruimtes, omgevingsdetails en dagelijkse bewegingen die werkelijk in beeld verschijnen.',
    aerial: 'De luchtopname toont {location} van boven en biedt een breed beeld van de zichtbare stedelijke vorm, het landschap en ruimtelijke relaties die vanaf de grond niet waarneembaar zijn.',
    ride: 'De bewegende perspectiefopname volgt de gefilmde route door {location} en laat zien hoe zichtbare wegen, landschappen en omliggende gebieden tijdens de rit met elkaar verbonden zijn.',
    documentary: 'De opname brengt de daadwerkelijk getoonde beelden en context van {location} samen, terwijl deze pagina de geverifieerde locatie-, categorie- en publicatiegegevens samenvat.',
    quality: 'De weergave in {quality} behoudt fijne visuele details en beweging gedurende de hele opname.',
    related: 'Gebruik de gerelateerde video’s om andere opgenomen gebieden en {feature}-inhoud uit {location} te vergelijken.',
    relatedGeneric: 'Gebruik de gerelateerde video’s om andere opgenomen gebieden en {feature}-inhoud in de collectie te vergelijken.'
  },
  pl: {
    ground: 'Nagranie prowadzi wzdłuż sfilmowanej trasy z poziomu ziemi i pokazuje {location} jako ciągły {feature}. Widać w nim trasy, przestrzenie publiczne lub dostępne dla odwiedzających, szczegóły otoczenia i codzienny ruch rzeczywiście obecny w kadrze.',
    aerial: 'Nagranie z powietrza pokazuje {location} z góry i oferuje szeroki widok na widoczną strukturę miasta, krajobraz oraz relacje przestrzenne, których nie można ocenić z poziomu ziemi.',
    ride: 'Nagranie z ruchomej perspektywy podąża sfilmowaną trasą przez {location} i pokazuje, jak widoczne drogi, krajobrazy oraz otaczające obszary łączą się podczas podróży.',
    documentary: 'Nagranie łączy widoki i kontekst rzeczywiście przedstawione dla {location}, a ta strona podsumowuje potwierdzone informacje o miejscu, kategorii i publikacji.',
    quality: 'Prezentacja w {quality} zachowuje drobne szczegóły obrazu i płynność ruchu przez całe nagranie.',
    related: 'Użyj powiązanych filmów, aby porównać inne nagrane obszary i materiały {feature} z {location}.',
    relatedGeneric: 'Użyj powiązanych filmów, aby porównać inne nagrane obszary i materiały {feature} w kolekcji.'
  },
  sv: {
    ground: 'Inspelningen följer den filmade rutten på marknivå och håller {location} i bild som en sammanhängande {feature}. Den visar de vägar, offentliga eller besöksbara miljöer, omgivningsdetaljer och vardagsrörelser som faktiskt syns på skärmen.',
    aerial: 'Flygbilden visar {location} ovanifrån och ger en bred överblick över synlig stadsstruktur, landskap och rumsliga samband som inte kan uppfattas från marknivå.',
    ride: 'Inspelningen ur ett rörligt perspektiv följer den filmade rutten genom {location} och visar hur synliga vägar, landskap och omgivande områden hänger samman längs färden.',
    documentary: 'Inspelningen samlar de vyer och det sammanhang som faktiskt presenteras för {location}, medan sidan sammanfattar verifierad information om plats, kategori och publicering.',
    quality: 'Visningen i {quality} bevarar fina bilddetaljer och rörelser genom hela inspelningen.',
    related: 'Använd relaterade videor för att jämföra andra inspelade områden och {feature}-innehåll från {location}.',
    relatedGeneric: 'Använd relaterade videor för att jämföra andra inspelade områden och {feature}-innehåll i samlingen.'
  },
  id: {
    ground: 'Rekaman mengikuti rute yang difilmkan dari permukaan tanah dan menampilkan {location} sebagai {feature} yang berkesinambungan. Video memperlihatkan rute, ruang publik atau area kunjungan, detail sekitar, dan aktivitas sehari-hari yang benar-benar tampak di layar.',
    aerial: 'Rekaman udara memperlihatkan {location} dari atas dan memberikan pandangan luas tentang bentuk kota, lanskap, serta hubungan antarruang yang tidak dapat diamati dari permukaan tanah.',
    ride: 'Rekaman dengan sudut pandang bergerak mengikuti rute yang difilmkan melalui {location} dan menunjukkan hubungan jalan, pemandangan, serta kawasan sekitar yang terlihat sepanjang perjalanan.',
    documentary: 'Rekaman menyatukan pemandangan dan konteks yang benar-benar disajikan tentang {location}, sementara halaman ini merangkum informasi lokasi, kategori, dan publikasi yang telah diverifikasi.',
    quality: 'Tampilan {quality} mempertahankan detail visual halus dan gerakan sepanjang rekaman.',
    related: 'Gunakan video terkait untuk membandingkan area lain yang direkam dan konten {feature} dari {location}.',
    relatedGeneric: 'Gunakan video terkait untuk membandingkan area lain yang direkam dan konten {feature} dalam koleksi.'
  },
  vi: {
    ground: 'Video theo sát tuyến đường được ghi hình từ mặt đất và trình bày {location} như một {feature} liên tục. Nội dung cho thấy các tuyến đi, không gian công cộng hoặc tham quan, chi tiết xung quanh và hoạt động đời thường thực sự xuất hiện trên màn hình.',
    aerial: 'Video trên không cho thấy {location} từ trên cao, mang lại góc nhìn rộng về cấu trúc đô thị, cảnh quan và mối liên hệ không gian không thể quan sát từ mặt đất.',
    ride: 'Video từ góc nhìn chuyển động theo sát tuyến đường được ghi hình qua {location}, cho thấy cách đường sá, cảnh quan và khu vực xung quanh kết nối trong suốt hành trình.',
    documentary: 'Video tập hợp những hình ảnh và bối cảnh thực sự được trình bày về {location}, còn trang này tóm tắt thông tin đã xác minh về địa điểm, danh mục và ngày đăng.',
    quality: 'Định dạng {quality} giữ lại chi tiết hình ảnh và chuyển động trong suốt video.',
    related: 'Dùng video liên quan để so sánh các khu vực khác đã ghi hình và nội dung {feature} tại {location}.',
    relatedGeneric: 'Dùng video liên quan để so sánh các khu vực khác đã ghi hình và nội dung {feature} trong bộ sưu tập.'
  }
};

function getDescriptionContextMode(
  family: SeoContentFamily
): DescriptionContextMode {
  if (family === 'drone') return 'aerial';
  if (family === 'pov') return 'ride';
  if (family === 'documentary') return 'documentary';
  return 'ground';
}

const expandedDescriptionText: Record<
  string,
  {
    experience: string;
    source: string;
    discovery: string;
  }
> = {
  en: {
    experience: 'The recording keeps the destination at the centre of the experience, so the streets, public spaces, architecture, landscapes and everyday movement that are actually visible can be examined at a comfortable pace. Watching the sequence from beginning to end also gives a clearer sense of scale and visual continuity than isolated travel photographs. This page names specific places only when they are supported by the available video data.',
    source: 'The original video remains embedded from its publishing channel, while this page organises the verified location, category and publication details in one place. This makes the recording useful both as a virtual visit and as an initial visual reference before a trip. No unverified route, landmark or historical claim is added to complete the description.',
    discovery: 'Continue with the related videos to compare other walks and destination recordings in the collection. Different videos may reveal another area, route, time or filming style, helping you build a broader visual impression without replacing the original source. Choose the next recording according to the location and category information shown on each page.'
  },
  tr: {
    experience: 'Kayıt, izleyicinin dikkatini doğrudan ekranda görülen konuma yöneltir; böylece gerçek sokaklar, kamusal alanlar, mimari ayrıntılar, çevre ve günlük hareket rahat bir tempoda incelenebilir. Videoyu başından sonuna kadar izlemek, birbirinden kopuk seyahat fotoğraflarına göre mekânın ölçeği ve görüntülerin devamlılığı hakkında daha açık bir fikir verir. Bu sayfada belirli yer adları yalnızca mevcut video verileriyle doğrulanabildiğinde kullanılır.',
    source: 'Orijinal video, yayımlandığı kanal üzerinden gömülü olarak sunulurken bu sayfa doğrulanmış konum, kategori ve yayın bilgilerini tek yerde düzenler. Bu yapı kaydı hem sanal bir ziyaret hem de yolculuk öncesinde kullanılabilecek ilk görsel kaynak hâline getirir. Açıklamayı uzatmak amacıyla doğrulanmamış rota, simge yapı veya tarih bilgisi eklenmez.',
    discovery: 'Koleksiyondaki diğer yürüyüşleri ve destinasyon kayıtlarını karşılaştırmak için benzer videolarla keşfe devam edebilirsiniz. Farklı videolar başka bir bölgeyi, güzergâhı, zamanı veya çekim biçimini gösterebilir ve orijinal kaynağın yerini almadan daha geniş bir görsel izlenim oluşturabilir. Sonraki videoyu her sayfada gösterilen konum ve kategori bilgilerine göre seçebilirsiniz.'
  },
  de: {
    experience: 'Die Aufnahme stellt das Reiseziel in den Mittelpunkt, sodass die tatsächlich sichtbaren Straßen, öffentlichen Räume, Bauwerke, Landschaften und Bewegungen in angenehmem Tempo betrachtet werden können. Der vollständige Ablauf vermittelt außerdem Größenverhältnisse und räumliche Übergänge besser als einzelne Reisefotos. Konkrete Orte werden auf dieser Seite nur genannt, wenn sie durch die verfügbaren Videodaten belegt sind.',
    source: 'Das Originalvideo bleibt vom veröffentlichenden Kanal eingebettet, während diese Seite bestätigte Angaben zu Ort, Kategorie und Veröffentlichung übersichtlich zusammenführt. Dadurch eignet sich die Aufnahme sowohl für einen virtuellen Besuch als auch als erste visuelle Orientierung vor einer Reise. Unbestätigte Routen, Sehenswürdigkeiten oder historische Aussagen werden nicht ergänzt.',
    discovery: 'Mit den verwandten Videos lässt sich die Erkundung innerhalb der Sammlung fortsetzen. Andere Aufnahmen können ein weiteres Gebiet, eine andere Route, Tageszeit oder Aufnahmeart zeigen und so einen breiteren visuellen Eindruck vermitteln, ohne die Originalquelle zu ersetzen. Das nächste Video kann anhand der auf jeder Seite angegebenen Orts- und Kategorieinformationen ausgewählt werden.'
  },
  es: {
    experience: 'La grabación mantiene el destino en el centro de la experiencia, de modo que las calles, los espacios públicos, la arquitectura, el paisaje y el movimiento cotidiano realmente visibles pueden observarse a un ritmo cómodo. Ver la secuencia completa también permite comprender mejor la escala y la continuidad del lugar que una serie de fotografías aisladas. Esta página solo menciona lugares concretos cuando están respaldados por los datos disponibles del vídeo.',
    source: 'El vídeo original permanece insertado desde el canal que lo publicó, mientras esta página reúne en un solo lugar los datos verificados de ubicación, categoría y publicación. Así, la grabación sirve tanto para una visita virtual como para obtener una primera referencia visual antes de un viaje. No se añaden rutas, monumentos ni afirmaciones históricas sin verificar para completar la descripción.',
    discovery: 'Continúa con los vídeos relacionados para comparar otros recorridos y grabaciones de destinos de la colección. Cada vídeo puede mostrar otra zona, ruta, hora o estilo de filmación y ayudar a formar una impresión visual más amplia sin sustituir la fuente original. Elige la siguiente grabación utilizando la información de ubicación y categoría indicada en cada página.'
  },
  it: {
    experience: 'La registrazione mantiene la destinazione al centro dell’esperienza, permettendo di osservare con calma le strade, gli spazi pubblici, l’architettura, il paesaggio e i movimenti quotidiani realmente visibili. Seguire la sequenza dall’inizio alla fine aiuta inoltre a comprendere la scala e la continuità del luogo meglio di una serie di fotografie separate. Questa pagina nomina luoghi specifici solo quando sono confermati dai dati disponibili del video.',
    source: 'Il video originale rimane incorporato dal canale che lo ha pubblicato, mentre questa pagina riunisce le informazioni verificate su luogo, categoria e pubblicazione. La registrazione può quindi servire sia come visita virtuale sia come primo riferimento visivo prima di un viaggio. Per completare la descrizione non vengono aggiunti itinerari, punti di interesse o dati storici non verificati.',
    discovery: 'Prosegui con i video correlati per confrontare altre passeggiate e registrazioni di destinazioni presenti nella raccolta. Video diversi possono mostrare un’altra zona, un percorso, un momento o uno stile di ripresa differente, offrendo una visione più ampia senza sostituire la fonte originale. Scegli il prossimo video attraverso le informazioni su luogo e categoria mostrate in ogni pagina.'
  },
  fr: {
    experience: 'L’enregistrement place la destination au centre de l’expérience afin d’observer à un rythme confortable les rues, les espaces publics, l’architecture, les paysages et les mouvements quotidiens réellement visibles. Regarder la séquence du début à la fin donne également une meilleure perception de l’échelle et de la continuité du lieu que des photographies isolées. Cette page ne nomme des endroits précis que lorsqu’ils sont confirmés par les données disponibles de la vidéo.',
    source: 'La vidéo originale reste intégrée depuis la chaîne qui l’a publiée, tandis que cette page rassemble les informations vérifiées sur le lieu, la catégorie et la publication. L’enregistrement peut ainsi servir de visite virtuelle ou de première référence visuelle avant un voyage. Aucun itinéraire, monument ou élément historique non vérifié n’est ajouté pour compléter la description.',
    discovery: 'Poursuivez l’exploration avec les vidéos associées afin de comparer d’autres promenades et destinations de la collection. Chaque enregistrement peut présenter une autre zone, un parcours, un moment ou un style de tournage différent et offrir une impression visuelle plus large sans remplacer la source originale. Choisissez la prochaine vidéo grâce aux informations de lieu et de catégorie affichées sur chaque page.'
  },
  ja: {
    experience: '映像では目的地そのものに焦点を置き、実際に画面に映る通り、公共空間、建築、風景、人々の動きを落ち着いたペースで確認できます。最初から最後まで続けて見ることで、個別の旅行写真だけでは分かりにくい場所の広がりや映像の連続性も把握しやすくなります。このページでは、利用可能な動画データで確認できる場合に限って具体的な地名を記載します。',
    source: '元の動画は公開チャンネルから埋め込まれた状態を保ち、このページでは確認済みの場所、カテゴリー、公開情報を一か所に整理しています。そのため、バーチャルな訪問としても、旅行前の最初の視覚的な資料としても利用できます。説明を補うために、未確認のルート、名所、歴史情報を追加することはありません。',
    discovery: '関連動画を使って、コレクション内の別の街歩きや目的地の映像も比較できます。動画ごとに異なる地域、ルート、時間帯、撮影スタイルが映る場合があり、元の情報源を置き換えることなく、より広い視覚的な印象を得られます。各ページに表示された場所とカテゴリーを確認して、次に見る映像を選んでください。'
  },
  pt: {
    experience: 'A gravação mantém o destino no centro da experiência, permitindo observar com calma as ruas, os espaços públicos, a arquitetura, a paisagem e o movimento cotidiano que realmente aparecem na tela. Acompanhar a sequência do início ao fim também ajuda a compreender melhor a escala e a continuidade do local do que fotografias de viagem isoladas. Esta página só menciona lugares específicos quando eles são confirmados pelos dados disponíveis do vídeo.',
    source: 'O vídeo original continua incorporado a partir do canal que o publicou, enquanto esta página reúne as informações verificadas de localização, categoria e publicação. Assim, a gravação pode servir tanto como visita virtual quanto como primeira referência visual antes de uma viagem. Nenhuma rota, atração ou informação histórica não verificada é adicionada apenas para completar a descrição.',
    discovery: 'Continue pelos vídeos relacionados para comparar outras caminhadas e gravações de destinos da coleção. Vídeos diferentes podem mostrar outra área, percurso, horário ou estilo de filmagem e ajudar a formar uma impressão visual mais ampla sem substituir a fonte original. Escolha a próxima gravação usando as informações de localização e categoria apresentadas em cada página.'
  },
  ru: {
    experience: 'Запись сохраняет внимание на самом месте, поэтому реально показанные улицы, общественные пространства, архитектуру, пейзажи и повседневное движение можно рассматривать в удобном темпе. Последовательный просмотр от начала до конца также лучше передаёт масштаб и визуальную связь между кадрами, чем отдельные туристические фотографии. Конкретные названия мест указаны на этой странице только тогда, когда они подтверждаются доступными данными видео.',
    source: 'Оригинальное видео остаётся встроенным с опубликовавшего его канала, а эта страница объединяет проверенные сведения о месте, категории и дате публикации. Благодаря этому запись подходит и для виртуального путешествия, и для первого визуального знакомства перед поездкой. Непроверенные маршруты, достопримечательности или исторические сведения не добавляются ради увеличения описания.',
    discovery: 'Продолжите просмотр с помощью связанных видео, чтобы сравнить другие прогулки и записи направлений из коллекции. В разных роликах могут быть показаны другие районы, маршруты, время или стиль съёмки, что помогает составить более широкое визуальное представление без замены оригинального источника. Выбирайте следующую запись по информации о месте и категории на каждой странице.'
  },
  zh: {
    experience: '视频始终以目的地本身为中心，观众可以按照舒适的节奏观察画面中真实出现的街道、公共空间、建筑、景观与日常活动。从头到尾连续观看，也比零散的旅行照片更容易理解地点的尺度和画面之间的连续关系。本页面只会在现有视频数据能够确认时标注具体地点。',
    source: '原始视频继续通过发布频道嵌入播放，本页面则把已经确认的地点、分类和发布时间整理在同一处。因此，这段视频既可以作为一次线上游览，也可以成为出行前的初步视觉参考。页面不会为了延长说明而添加未经确认的路线、地标或历史信息。',
    discovery: '通过相关视频，您可以继续比较合集中的其他步行记录和目的地影像。不同视频可能呈现其他区域、路线、时间或拍摄方式，在不取代原始来源的前提下带来更完整的视觉印象。您可以根据每个页面显示的地点与分类信息选择下一段视频。'
  },
  ko: {
    experience: '이 영상은 목적지 자체에 시선을 두어 화면에 실제로 나타나는 거리, 공공 공간, 건축물, 풍경과 일상의 움직임을 편안한 속도로 살펴볼 수 있게 합니다. 처음부터 끝까지 이어서 보면 개별 여행 사진만으로는 알기 어려운 장소의 규모와 장면 사이의 연속성도 더 분명하게 이해할 수 있습니다. 이 페이지는 제공된 영상 데이터로 확인할 수 있는 경우에만 구체적인 장소 이름을 표시합니다.',
    source: '원본 영상은 게시한 채널에서 임베드된 상태로 유지되며, 이 페이지는 확인된 위치, 카테고리와 게시 정보를 한곳에 정리합니다. 따라서 영상은 가상 방문뿐 아니라 여행 전 처음 살펴보는 시각 자료로도 활용할 수 있습니다. 설명을 늘리기 위해 확인되지 않은 경로, 명소 또는 역사 정보를 추가하지 않습니다.',
    discovery: '관련 영상을 통해 컬렉션의 다른 도보 여행과 목적지 기록을 계속 비교해 보세요. 영상마다 다른 지역, 경로, 시간 또는 촬영 방식을 보여 줄 수 있어 원본 출처를 대신하지 않으면서 더 넓은 시각적 인상을 얻는 데 도움이 됩니다. 각 페이지에 표시된 위치와 카테고리 정보를 기준으로 다음 영상을 선택할 수 있습니다.'
  },
  ar: {
    experience: 'يحافظ التسجيل على تركيز المشاهدة على الوجهة نفسها، بحيث يمكن تأمل الشوارع والمساحات العامة والعمارة والمناظر والحركة اليومية الظاهرة فعلاً على الشاشة بوتيرة مريحة. كما أن متابعة التسلسل من البداية إلى النهاية تمنح تصوراً أوضح لحجم المكان واستمرارية المشاهد مقارنة بالصور السياحية المنفصلة. لا تذكر هذه الصفحة أسماء أماكن محددة إلا عندما تؤكدها بيانات الفيديو المتاحة.',
    source: 'يبقى الفيديو الأصلي مضمناً من القناة التي نشرته، بينما تجمع هذه الصفحة معلومات الموقع والفئة والنشر التي تم التحقق منها في مكان واحد. وبذلك يصلح التسجيل كزيارة افتراضية وكمرجع بصري أولي قبل السفر. لا تتم إضافة مسارات أو معالم أو معلومات تاريخية غير مؤكدة لمجرد إكمال الوصف.',
    discovery: 'يمكن متابعة الاستكشاف عبر الفيديوهات ذات الصلة ومقارنة جولات وتسجيلات وجهات أخرى ضمن المجموعة. قد يعرض كل فيديو منطقة أو مساراً أو وقتاً أو أسلوب تصوير مختلفاً، مما يساعد على تكوين انطباع بصري أوسع من دون استبدال المصدر الأصلي. اختر التسجيل التالي بالاعتماد على معلومات الموقع والفئة المعروضة في كل صفحة.'
  },
  hi: {
    experience: 'रिकॉर्डिंग का ध्यान गंतव्य पर रहता है, इसलिए स्क्रीन पर वास्तव में दिखाई देने वाली सड़कों, सार्वजनिक स्थानों, वास्तुकला, दृश्यों और दैनिक गतिविधियों को आरामदायक गति से देखा जा सकता है। वीडियो को शुरू से अंत तक देखने पर अलग-अलग यात्रा तस्वीरों की तुलना में स्थान के आकार और दृश्यों की निरंतरता को बेहतर समझने में मदद मिलती है। इस पेज पर किसी विशेष स्थान का नाम तभी दिया जाता है जब उपलब्ध वीडियो डेटा उसकी पुष्टि करता है।',
    source: 'मूल वीडियो उसे प्रकाशित करने वाले चैनल से एम्बेड रहता है, जबकि यह पेज सत्यापित स्थान, श्रेणी और प्रकाशन जानकारी को एक जगह व्यवस्थित करता है। इस कारण रिकॉर्डिंग आभासी यात्रा और वास्तविक यात्रा से पहले शुरुआती दृश्य संदर्भ, दोनों के रूप में उपयोगी हो सकती है। विवरण पूरा करने के लिए अपुष्ट मार्ग, स्थल या ऐतिहासिक जानकारी नहीं जोड़ी जाती।',
    discovery: 'संग्रह में मौजूद अन्य सैर और गंतव्य रिकॉर्डिंग की तुलना करने के लिए संबंधित वीडियो देखते रहें। अलग वीडियो किसी दूसरे क्षेत्र, मार्ग, समय या फिल्मांकन शैली को दिखा सकते हैं और मूल स्रोत को बदले बिना व्यापक दृश्य समझ बनाने में मदद कर सकते हैं। प्रत्येक पेज पर दिखाई गई स्थान और श्रेणी की जानकारी के आधार पर अगला वीडियो चुनें।'
  },
  nl: {
    experience: 'De opname houdt de bestemming centraal, zodat de werkelijk zichtbare straten, openbare ruimtes, architectuur, landschappen en dagelijkse bewegingen in een rustig tempo kunnen worden bekeken. Door de beelden van begin tot eind te volgen, worden ook de schaal en de visuele samenhang van de plek duidelijker dan met afzonderlijke reisfoto’s. Deze pagina noemt specifieke locaties alleen wanneer ze door de beschikbare videogegevens worden bevestigd.',
    source: 'De oorspronkelijke video blijft ingesloten vanaf het kanaal dat hem publiceerde, terwijl deze pagina de geverifieerde locatie-, categorie- en publicatiegegevens op één plek ordent. Zo kan de opname zowel als virtueel bezoek als eerste visuele oriëntatie voor een reis worden gebruikt. Niet-geverifieerde routes, bezienswaardigheden of historische beweringen worden niet toegevoegd om de beschrijving langer te maken.',
    discovery: 'Ga verder met de gerelateerde video’s om andere wandelingen en bestemmingsopnamen in de collectie te vergelijken. Verschillende video’s kunnen een ander gebied, route, tijdstip of filmstijl tonen en zo een bredere visuele indruk geven zonder de oorspronkelijke bron te vervangen. Kies de volgende opname aan de hand van de locatie- en categoriegegevens op iedere pagina.'
  },
  pl: {
    experience: 'Nagranie skupia uwagę na samym miejscu, dzięki czemu rzeczywiście widoczne ulice, przestrzenie publiczne, architekturę, krajobrazy i codzienny ruch można oglądać w spokojnym tempie. Obejrzenie całej sekwencji od początku do końca pozwala również lepiej zrozumieć skalę i ciągłość przestrzeni niż pojedyncze zdjęcia z podróży. Ta strona wymienia konkretne miejsca tylko wtedy, gdy potwierdzają je dostępne dane filmu.',
    source: 'Oryginalny film pozostaje osadzony z kanału, który go opublikował, a ta strona porządkuje w jednym miejscu zweryfikowane informacje o lokalizacji, kategorii i publikacji. Dzięki temu nagranie może służyć jako wirtualna wizyta oraz pierwsze źródło wizualne przed podróżą. Niepotwierdzone trasy, zabytki ani informacje historyczne nie są dodawane tylko po to, aby uzupełnić opis.',
    discovery: 'Kontynuuj oglądanie powiązanych filmów, aby porównać inne spacery i nagrania miejsc dostępne w kolekcji. Różne materiały mogą pokazywać inny obszar, trasę, porę lub styl filmowania i tworzyć szerszy obraz bez zastępowania oryginalnego źródła. Następny film wybierz na podstawie informacji o lokalizacji i kategorii widocznych na każdej stronie.'
  },
  sv: {
    experience: 'Inspelningen håller resmålet i centrum, så att de gator, offentliga miljöer, byggnader, landskap och vardagsrörelser som faktiskt syns kan studeras i ett behagligt tempo. Genom att följa hela sekvensen från början till slut blir det också lättare att förstå platsens skala och visuella sammanhang än genom enskilda resebilder. Den här sidan namnger bara särskilda platser när de stöds av tillgängliga videodata.',
    source: 'Originalvideon förblir inbäddad från kanalen som publicerade den, medan den här sidan samlar verifierad information om plats, kategori och publicering. Inspelningen kan därför användas både som ett virtuellt besök och som en första visuell orientering före en resa. Obekräftade rutter, sevärdheter eller historiska uppgifter läggs inte till för att fylla ut beskrivningen.',
    discovery: 'Fortsätt med relaterade videor för att jämföra andra promenader och destinationsinspelningar i samlingen. Olika videor kan visa ett annat område, en rutt, en tidpunkt eller en filmstil och ge ett bredare visuellt intryck utan att ersätta originalkällan. Välj nästa inspelning med hjälp av plats- och kategoriinformationen som visas på varje sida.'
  },
  id: {
    experience: 'Rekaman ini menempatkan destinasi sebagai pusat pengalaman, sehingga jalan, ruang publik, arsitektur, pemandangan, dan aktivitas sehari-hari yang benar-benar terlihat dapat diamati dengan tempo nyaman. Menonton urutan gambar dari awal hingga akhir juga membantu memahami skala dan kesinambungan tempat dengan lebih baik daripada foto perjalanan yang terpisah. Halaman ini hanya menyebut lokasi tertentu ketika didukung oleh data video yang tersedia.',
    source: 'Video asli tetap disematkan dari kanal yang menerbitkannya, sementara halaman ini menyusun informasi lokasi, kategori, dan publikasi yang telah diverifikasi dalam satu tempat. Dengan demikian, rekaman dapat digunakan sebagai kunjungan virtual maupun referensi visual awal sebelum perjalanan. Rute, tengara, atau informasi sejarah yang belum diverifikasi tidak ditambahkan hanya untuk melengkapi deskripsi.',
    discovery: 'Lanjutkan melalui video terkait untuk membandingkan tur jalan kaki dan rekaman destinasi lain dalam koleksi. Video yang berbeda dapat menampilkan area, rute, waktu, atau gaya pengambilan gambar lain dan membantu membentuk kesan visual yang lebih luas tanpa menggantikan sumber asli. Pilih rekaman berikutnya berdasarkan informasi lokasi dan kategori pada setiap halaman.'
  },
  vi: {
    experience: 'Video tập trung vào điểm đến, giúp người xem quan sát đường phố, không gian công cộng, kiến trúc và hoạt động thực sự xuất hiện trên màn hình. Xem toàn bộ trình tự giúp hiểu rõ hơn quy mô và sự liên tục của địa điểm. Trang chỉ nêu địa danh khi dữ liệu video xác nhận.',
    source: 'Video gốc vẫn được nhúng từ kênh xuất bản, còn trang này tập hợp thông tin đã xác minh về địa điểm, danh mục và ngày đăng. Bản ghi có thể dùng để tham quan trực tuyến hoặc tham khảo trước chuyến đi. Không thêm tuyến đường, địa danh hay lịch sử chưa được xác minh.',
    discovery: 'Tiếp tục với video liên quan để so sánh các chuyến đi bộ và điểm đến khác. Mỗi video có thể cho thấy khu vực, tuyến đường, thời điểm hoặc cách quay khác nhau, giúp mở rộng góc nhìn mà không thay thế nguồn gốc. Chọn video tiếp theo theo địa điểm và danh mục hiển thị.'
  }
};

type DescriptionFactLabels = {
  featured: string;
  route: string;
  chapters: string;
  nearbyHotels: string;
  hotelNote: string;
  quality: string;
  duration: string;
  publisher: string;
  published: string;
};

type DescriptionSentenceTemplates = {
  overviewDetail: string;
  overviewBasic: string;
  hotels: string;
  sourceDate: string;
  sourceOnly: string;
  dateOnly: string;
  duration: string;
};

const descriptionFactLabels: Record<Lang, DescriptionFactLabels> = {
  en: { featured:'Featured place', route:'Verified route points', chapters:'Timestamped sections', nearbyHotels:'Nearby stays', hotelNote:'Check current access, prices and availability before booking.', quality:'Quality', duration:'Duration', publisher:'Publisher', published:'Published' },
  tr: { featured:'Öne çıkan konum', route:'Doğrulanmış rota noktaları', chapters:'Zaman damgalı bölümler', nearbyHotels:'Yakındaki konaklama seçenekleri', hotelNote:'Rezervasyondan önce güncel ulaşım, fiyat ve müsaitlik bilgilerini kontrol edin.', quality:'Kalite', duration:'Süre', publisher:'Yayıncı', published:'Yayın tarihi' },
  de: { featured:'Hervorgehobener Ort', route:'Bestätigte Routenpunkte', chapters:'Abschnitte mit Zeitmarken', nearbyHotels:'Unterkünfte in der Nähe', hotelNote:'Prüfe vor der Buchung aktuelle Anreise, Preise und Verfügbarkeit.', quality:'Qualität', duration:'Dauer', publisher:'Herausgeber', published:'Veröffentlicht' },
  es: { featured:'Lugar destacado', route:'Puntos verificados de la ruta', chapters:'Secciones con marca de tiempo', nearbyHotels:'Alojamientos cercanos', hotelNote:'Comprueba el acceso, los precios y la disponibilidad antes de reservar.', quality:'Calidad', duration:'Duración', publisher:'Editor', published:'Publicado' },
  it: { featured:'Luogo in evidenza', route:'Punti verificati del percorso', chapters:'Sezioni con indicazione temporale', nearbyHotels:'Alloggi nelle vicinanze', hotelNote:'Controlla accesso, prezzi e disponibilità aggiornati prima di prenotare.', quality:'Qualità', duration:'Durata', publisher:'Editore', published:'Pubblicato' },
  fr: { featured:'Lieu mis en avant', route:'Points de parcours vérifiés', chapters:'Séquences horodatées', nearbyHotels:'Hébergements à proximité', hotelNote:'Vérifiez l’accès, les prix et les disponibilités avant de réserver.', quality:'Qualité', duration:'Durée', publisher:'Éditeur', published:'Publié' },
  ja: { featured:'注目地点', route:'確認済みのルート地点', chapters:'タイムスタンプ付き区間', nearbyHotels:'周辺の宿泊施設', hotelNote:'予約前にアクセス、料金、空室状況の最新情報を確認してください。', quality:'画質', duration:'長さ', publisher:'公開元', published:'公開日' },
  pt: { featured:'Local em destaque', route:'Pontos verificados da rota', chapters:'Seções com marcação de tempo', nearbyHotels:'Hospedagens próximas', hotelNote:'Consulte acesso, preços e disponibilidade atuais antes de reservar.', quality:'Qualidade', duration:'Duração', publisher:'Publicador', published:'Publicado' },
  ru: { featured:'Главное место', route:'Проверенные точки маршрута', chapters:'Разделы с временными метками', nearbyHotels:'Жильё поблизости', hotelNote:'Перед бронированием проверьте актуальные условия проезда, цены и наличие мест.', quality:'Качество', duration:'Продолжительность', publisher:'Автор публикации', published:'Опубликовано' },
  zh: { featured:'重点地点', route:'已验证路线点', chapters:'带时间戳的片段', nearbyHotels:'附近住宿', hotelNote:'预订前请确认最新交通、价格和空房信息。', quality:'画质', duration:'时长', publisher:'发布者', published:'发布日期' },
  ko: { featured:'주요 장소', route:'확인된 경로 지점', chapters:'타임스탬프 구간', nearbyHotels:'인근 숙소', hotelNote:'예약 전에 최신 교통편, 요금 및 객실 상황을 확인하세요.', quality:'화질', duration:'길이', publisher:'게시자', published:'게시일' },
  ar: { featured:'الموقع البارز', route:'نقاط المسار الموثقة', chapters:'أقسام ذات طوابع زمنية', nearbyHotels:'أماكن إقامة قريبة', hotelNote:'تحقق من الوصول والأسعار والتوافر الحالي قبل الحجز.', quality:'الجودة', duration:'المدة', publisher:'الناشر', published:'تاريخ النشر' },
  hi: { featured:'प्रमुख स्थान', route:'सत्यापित मार्ग बिंदु', chapters:'समय-चिह्नित खंड', nearbyHotels:'आस-पास ठहरने के विकल्प', hotelNote:'बुकिंग से पहले मौजूदा पहुँच, कीमत और उपलब्धता जाँचें।', quality:'गुणवत्ता', duration:'अवधि', publisher:'प्रकाशक', published:'प्रकाशित' },
  nl: { featured:'Uitgelichte plek', route:'Geverifieerde routepunten', chapters:'Onderdelen met tijdcodes', nearbyHotels:'Accommodaties in de buurt', hotelNote:'Controleer voor het boeken de actuele bereikbaarheid, prijzen en beschikbaarheid.', quality:'Kwaliteit', duration:'Duur', publisher:'Uitgever', published:'Gepubliceerd' },
  pl: { featured:'Wyróżnione miejsce', route:'Zweryfikowane punkty trasy', chapters:'Sekcje ze znacznikami czasu', nearbyHotels:'Noclegi w pobliżu', hotelNote:'Przed rezerwacją sprawdź aktualny dojazd, ceny i dostępność.', quality:'Jakość', duration:'Czas trwania', publisher:'Wydawca', published:'Opublikowano' },
  sv: { featured:'Utvald plats', route:'Verifierade ruttpunkter', chapters:'Tidsstämplade avsnitt', nearbyHotels:'Boenden i närheten', hotelNote:'Kontrollera aktuell tillgång, priser och tillgänglighet före bokning.', quality:'Kvalitet', duration:'Längd', publisher:'Utgivare', published:'Publicerad' },
  id: { featured:'Lokasi unggulan', route:'Titik rute terverifikasi', chapters:'Bagian bertanda waktu', nearbyHotels:'Akomodasi terdekat', hotelNote:'Periksa akses, harga, dan ketersediaan terbaru sebelum memesan.', quality:'Kualitas', duration:'Durasi', publisher:'Penerbit', published:'Diterbitkan' },
  vi: { featured:'Địa điểm nổi bật', route:'Các điểm tuyến đường đã xác minh', chapters:'Các phần có dấu thời gian', nearbyHotels:'Nơi lưu trú gần đó', hotelNote:'Hãy kiểm tra lối đi, giá và tình trạng phòng hiện tại trước khi đặt.', quality:'Chất lượng', duration:'Thời lượng', publisher:'Nhà xuất bản', published:'Ngày đăng' }
};

const descriptionSentenceTemplates: Record<Lang, DescriptionSentenceTemplates> = {
  en: { overviewDetail:'This {quality}{feature} was recorded in {location}, with {detail} as the featured area.', overviewBasic:'This {quality}{feature} was recorded in {location}.', hotels:'Nearby accommodation data for this route includes {hotels}.', sourceDate:'The video was published by {publisher} on {date}.', sourceOnly:'The video was published by {publisher}.', dateOnly:'The video was published on {date}.', duration:'The video duration is {duration}.' },
  tr: { overviewDetail:'{location} konumunda kaydedilen bu {quality}{feature} videosunda {detail} öne çıkıyor.', overviewBasic:'Bu {quality}{feature}, {location} konumunda kaydedildi.', hotels:'Bu rota için yakındaki konaklama verilerinde {hotels} yer alıyor.', sourceDate:'Video, {publisher} tarafından {date} tarihinde yayımlandı.', sourceOnly:'Video, {publisher} tarafından yayımlandı.', dateOnly:'Video {date} tarihinde yayımlandı.', duration:'Video süresi {duration}.' },
  de: { overviewDetail:'Dieser in {location} aufgenommene {quality}{feature} zeigt {detail} als Schwerpunkt.', overviewBasic:'Dieser {quality}{feature} wurde in {location} aufgenommen.', hotels:'Zu den Unterkünften in der Nähe dieser Route gehören {hotels}.', sourceDate:'Das Video wurde am {date} von {publisher} veröffentlicht.', sourceOnly:'Das Video wurde von {publisher} veröffentlicht.', dateOnly:'Das Video wurde am {date} veröffentlicht.', duration:'Die Videolänge beträgt {duration}.' },
  es: { overviewDetail:'Este {quality}{feature} se grabó en {location} y destaca {detail}.', overviewBasic:'Este {quality}{feature} se grabó en {location}.', hotels:'Los datos de alojamiento cercanos a esta ruta incluyen {hotels}.', sourceDate:'El video fue publicado por {publisher} el {date}.', sourceOnly:'El video fue publicado por {publisher}.', dateOnly:'El video fue publicado el {date}.', duration:'La duración del video es de {duration}.' },
  it: { overviewDetail:'Questo {quality}{feature} è stato registrato a {location} e mette in evidenza {detail}.', overviewBasic:'Questo {quality}{feature} è stato registrato a {location}.', hotels:'I dati sugli alloggi vicini a questo percorso includono {hotels}.', sourceDate:'Il video è stato pubblicato da {publisher} il {date}.', sourceOnly:'Il video è stato pubblicato da {publisher}.', dateOnly:'Il video è stato pubblicato il {date}.', duration:'La durata del video è {duration}.' },
  fr: { overviewDetail:'Cette {quality}{feature} a été filmée à {location} et met en avant {detail}.', overviewBasic:'Cette {quality}{feature} a été filmée à {location}.', hotels:'Les données d’hébergement à proximité de ce parcours comprennent {hotels}.', sourceDate:'La vidéo a été publiée par {publisher} le {date}.', sourceOnly:'La vidéo a été publiée par {publisher}.', dateOnly:'La vidéo a été publiée le {date}.', duration:'La durée de la vidéo est de {duration}.' },
  ja: { overviewDetail:'この{quality}{feature}は{location}で撮影され、{detail}が主なエリアとして紹介されています。', overviewBasic:'この{quality}{feature}は{location}で撮影されました。', hotels:'このルート周辺の宿泊データには、{hotels}が含まれます。', sourceDate:'動画は{publisher}により{date}に公開されました。', sourceOnly:'動画は{publisher}により公開されました。', dateOnly:'動画は{date}に公開されました。', duration:'動画の長さは{duration}です。' },
  pt: { overviewDetail:'Este {quality}{feature} foi gravado em {location} e destaca {detail}.', overviewBasic:'Este {quality}{feature} foi gravado em {location}.', hotels:'Os dados de hospedagem próximos desta rota incluem {hotels}.', sourceDate:'O vídeo foi publicado por {publisher} em {date}.', sourceOnly:'O vídeo foi publicado por {publisher}.', dateOnly:'O vídeo foi publicado em {date}.', duration:'A duração do vídeo é de {duration}.' },
  ru: { overviewDetail:'Эта {quality}{feature} снята в {location}; главное место в видео — {detail}.', overviewBasic:'Эта {quality}{feature} снята в {location}.', hotels:'В данных о жилье рядом с этим маршрутом указаны {hotels}.', sourceDate:'Видео опубликовано каналом {publisher} {date}.', sourceOnly:'Видео опубликовано каналом {publisher}.', dateOnly:'Видео опубликовано {date}.', duration:'Продолжительность видео — {duration}.' },
  zh: { overviewDetail:'这段{quality}{feature}拍摄于{location}，重点区域为{detail}。', overviewBasic:'这段{quality}{feature}拍摄于{location}。', hotels:'该路线附近的住宿数据包括{hotels}。', sourceDate:'视频由{publisher}发布于{date}。', sourceOnly:'视频由{publisher}发布。', dateOnly:'视频发布于{date}。', duration:'视频时长为{duration}。' },
  ko: { overviewDetail:'이 {quality}{feature}은(는) {location}에서 촬영되었으며 {detail}이(가) 주요 지역으로 소개됩니다.', overviewBasic:'이 {quality}{feature}은(는) {location}에서 촬영되었습니다.', hotels:'이 경로 주변 숙박 데이터에는 {hotels}이(가) 포함됩니다.', sourceDate:'영상은 {publisher}이(가) {date}에 게시했습니다.', sourceOnly:'영상은 {publisher}이(가) 게시했습니다.', dateOnly:'영상은 {date}에 게시되었습니다.', duration:'영상 길이는 {duration}입니다.' },
  ar: { overviewDetail:'تم تصوير {feature} بجودة {quality} في {location}، وتبرز فيه منطقة {detail}.', overviewBasic:'تم تصوير {feature} بجودة {quality} في {location}.', hotels:'تتضمن بيانات الإقامة القريبة من هذا المسار {hotels}.', sourceDate:'نشر {publisher} الفيديو في {date}.', sourceOnly:'نشر {publisher} هذا الفيديو.', dateOnly:'نُشر الفيديو في {date}.', duration:'مدة الفيديو {duration}.' },
  hi: { overviewDetail:'यह {quality}{feature} {location} में रिकॉर्ड किया गया है और इसमें {detail} प्रमुख स्थान है।', overviewBasic:'यह {quality}{feature} {location} में रिकॉर्ड किया गया है।', hotels:'इस मार्ग के पास उपलब्ध आवास डेटा में {hotels} शामिल हैं।', sourceDate:'वीडियो {publisher} ने {date} को प्रकाशित किया।', sourceOnly:'वीडियो {publisher} ने प्रकाशित किया।', dateOnly:'वीडियो {date} को प्रकाशित किया गया।', duration:'वीडियो की अवधि {duration} है।' },
  nl: { overviewDetail:'Deze {quality}{feature} is opgenomen in {location}, met {detail} als uitgelicht gebied.', overviewBasic:'Deze {quality}{feature} is opgenomen in {location}.', hotels:'De verblijfsgegevens bij deze route omvatten {hotels}.', sourceDate:'De video is op {date} gepubliceerd door {publisher}.', sourceOnly:'De video is gepubliceerd door {publisher}.', dateOnly:'De video is gepubliceerd op {date}.', duration:'De videoduur is {duration}.' },
  pl: { overviewDetail:'Ten {quality}{feature} nagrano w {location}, a wyróżnionym miejscem jest {detail}.', overviewBasic:'Ten {quality}{feature} nagrano w {location}.', hotels:'Dane noclegowe w pobliżu tej trasy obejmują {hotels}.', sourceDate:'Film został opublikowany przez {publisher} {date}.', sourceOnly:'Film został opublikowany przez {publisher}.', dateOnly:'Film został opublikowany {date}.', duration:'Czas trwania filmu to {duration}.' },
  sv: { overviewDetail:'Denna {quality}{feature} spelades in i {location}, med {detail} som utvalt område.', overviewBasic:'Denna {quality}{feature} spelades in i {location}.', hotels:'Boendedata nära denna rutt omfattar {hotels}.', sourceDate:'Videon publicerades av {publisher} den {date}.', sourceOnly:'Videon publicerades av {publisher}.', dateOnly:'Videon publicerades den {date}.', duration:'Videons längd är {duration}.' },
  id: { overviewDetail:'{feature} {quality} ini direkam di {location}, dengan {detail} sebagai area utama.', overviewBasic:'{feature} {quality} ini direkam di {location}.', hotels:'Data akomodasi di dekat rute ini mencakup {hotels}.', sourceDate:'Video ini diterbitkan oleh {publisher} pada {date}.', sourceOnly:'Video ini diterbitkan oleh {publisher}.', dateOnly:'Video ini diterbitkan pada {date}.', duration:'Durasi video adalah {duration}.' },
  vi: { overviewDetail:'{feature} {quality} này được ghi hình tại {location}, trong đó {detail} là khu vực nổi bật.', overviewBasic:'{feature} {quality} này được ghi hình tại {location}.', hotels:'Dữ liệu lưu trú gần tuyến đường này gồm {hotels}.', sourceDate:'Video được {publisher} đăng vào {date}.', sourceOnly:'Video được {publisher} đăng.', dateOnly:'Video được đăng vào {date}.', duration:'Thời lượng video là {duration}.' }
};

function fillTemplate(
  template: string,
  values: Record<string, string>
) {
  return template.replace(
    /\{(\w+)\}/g,
    (_, key: string) =>
      values[key] || ''
  );
}

function cleanGeneratedText(value: string) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getVerifiedChapters(video: Video) {
  return (video.chapters || [])
    .filter(
      (chapter) =>
        chapter.verified === true &&
        Number.isFinite(chapter.startSeconds) &&
        chapter.startSeconds >= 0 &&
        cleanGeneratedText(chapter.title).length > 0
    )
    .map((chapter) => ({
      ...chapter,
      title: cleanGeneratedText(chapter.title),
      startSeconds: Math.floor(chapter.startSeconds),
      endSeconds:
        typeof chapter.endSeconds === 'number' &&
        Number.isFinite(chapter.endSeconds) &&
        chapter.endSeconds > chapter.startSeconds
          ? Math.floor(chapter.endSeconds)
          : undefined
    }))
    .sort((a, b) => a.startSeconds - b.startSeconds);
}

function getVerifiedRouteNames(video: Video) {
  return Array.from(
    new Set(
      (video.routePoints || [])
        .filter((point) => point.verified === true)
        .map((point) => cleanGeneratedText(point.name))
        .filter(Boolean)
    )
  ).slice(0, 5);
}

function getDescriptionRouteNames(
  video: Video,
  _lang: string,
  _titleDetail: ReturnType<typeof getBestDetail>
) {
  return getVerifiedRouteNames(video);
}

function formatLocalizedList(
  values: string[],
  lang: string
) {
  try {
    return new Intl.ListFormat(lang, {
      style: 'long',
      type: 'conjunction'
    }).format(values);
  } catch {
    return values.join(', ');
  }
}

function formatChapterTimestamp(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainingSeconds = total % 60;

  return hours > 0
    ? [hours, minutes, remainingSeconds]
        .map((part) => String(part).padStart(2, '0'))
        .join(':')
    : [minutes, remainingSeconds]
        .map((part) => String(part).padStart(2, '0'))
        .join(':');
}

function formatLocalizedDistance(
  distanceMeters: number,
  lang: string
) {
  const distance = Math.max(0, Number(distanceMeters) || 0);

  if (distance < 1000) {
    return `${Math.round(distance)} m`;
  }

  return `${new Intl.NumberFormat(lang, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  }).format(distance / 1000)} km`;
}

function formatLocalizedDuration(
  duration: string | undefined,
  lang: string
) {
  const totalSeconds = parseDurationSeconds(duration);

  if (!totalSeconds) {
    return '';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const values: string[] = [];

  const formatUnit = (
    value: number,
    unit: 'hour' | 'minute' | 'second'
  ) => {
    try {
      return new Intl.NumberFormat(lang, {
        style: 'unit',
        unit,
        unitDisplay: 'short'
      }).format(value);
    } catch {
      const fallback = unit === 'hour' ? 'h' : unit === 'minute' ? 'min' : 's';
      return `${value} ${fallback}`;
    }
  };

  if (hours) values.push(formatUnit(hours, 'hour'));
  if (minutes) values.push(formatUnit(minutes, 'minute'));
  if (!hours && !minutes && seconds) {
    values.push(formatUnit(seconds, 'second'));
  }

  return values.join(' ');
}

function getVerifiedHotels(video: Video) {
  const seen = new Set<string>();

  return (video.nearbyHotels || [])
    .filter((hotel) => hotel.verified === true)
    .map((hotel) => ({
      ...hotel,
      name: cleanGeneratedText(hotel.name),
      distanceMeters:
        typeof hotel.distanceMeters === 'number' &&
        Number.isFinite(hotel.distanceMeters) &&
        hotel.distanceMeters >= 0
          ? Math.round(hotel.distanceMeters)
          : undefined
    }))
    .filter((hotel) => {
      const key = hotel.name.toLocaleLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) =>
      (a.distanceMeters ?? Number.MAX_SAFE_INTEGER) -
      (b.distanceMeters ?? Number.MAX_SAFE_INTEGER)
    )
    .slice(0, 3);
}

function getVideoEvidenceSignals(video: Video) {
  const signals: string[] = [];

  if (getBestDetail(video)) signals.push('specific-place');
  if (getVerifiedRouteNames(video).length) signals.push('verified-route');
  if (getVerifiedChapters(video).length) signals.push('verified-chapters');
  if (getVerifiedHotels(video).some((hotel) => hotel.distanceMeters !== undefined)) {
    signals.push('measured-nearby-hotels');
  }
  if (parseDurationSeconds(video.duration)) signals.push('duration');
  if (video.channelTitle || video.channel) signals.push('publisher');
  if (normalizeIsoDate(video.publishedAt)) signals.push('publication-date');

  return signals;
}

function getDescriptionQuality(video: Video) {
  const value = cleanGeneratedText(
    `${video.badge || ''} ${video.title || ''}`
  );
  const resolution = /\b8K\b/i.test(value)
    ? '8K'
    : /\b4K\b/i.test(value)
      ? '4K'
      : '';
  const frameRate = /\b60\s*FPS\b/i.test(value)
    ? '60FPS'
    : '';
  const hdr = /\bHDR\b/i.test(value) ? 'HDR' : '';

  return [resolution, hdr, frameRate].filter(Boolean).join(' ');
}

function formatLabeledFact(label: string, value: string) {
  const cleanedValue = cleanGeneratedText(value)
    .replace(/[.。]+$/u, '')
    .trim();

  return cleanedValue ? `${label}: ${cleanedValue}.` : '';
}

export function getVideoDescriptionParagraphs(
  video: Video,
  lang?: string
) {
  const l = normalizeLang(lang);
  const analysis = getVideoSeoAnalysis(video, l);
  const featureLabel = getSeoStyleLabel(
    analysis.style,
    l,
    video.id,
    Boolean(analysis.detail)
  );
  const location = getLocationLabel(video, l);
  const labels = descriptionFactLabels[l];
  const sentences = descriptionSentenceTemplates[l];
  const detail = cleanGeneratedText(analysis.detail || '');
  const routeNames = getDescriptionRouteNames(video, l, getBestDetail(video));
  const chapters = getVerifiedChapters(video).slice(0, 4);
  const hotels = getVerifiedHotels(video);
  const paragraphs: string[] = [];
  const quality = getDescriptionQuality(video);
  const localizedFeature = featureLabel.toLocaleLowerCase(l);

  if (location) {
    paragraphs.push(
      fillTemplate(
        detail ? sentences.overviewDetail : sentences.overviewBasic,
        {
          location,
          detail,
          feature: localizedFeature,
          quality: quality ? `${quality} ` : ''
        }
      )
    );
  } else {
    paragraphs.push(
      [
        quality ? formatLabeledFact(labels.quality, quality) : '',
        `${featureLabel}.`
      ].filter(Boolean).join(' ')
    );
  }

  const routeFacts = [
    routeNames.length
      ? formatLabeledFact(labels.route, formatLocalizedList(routeNames, l))
      : '',
    chapters.length
      ? formatLabeledFact(labels.chapters, formatLocalizedList(
          chapters.map((chapter) =>
            `${chapter.title} (${formatChapterTimestamp(chapter.startSeconds)})`
          ),
          l
        ))
      : ''
  ].filter(Boolean);

  if (routeFacts.length) {
    paragraphs.push(routeFacts.join(' '));
  }

  if (hotels.length) {
    const hotelList = hotels.map((hotel) =>
      hotel.distanceMeters === undefined
        ? hotel.name
        : `${hotel.name} (${formatLocalizedDistance(hotel.distanceMeters, l)})`
    );

    paragraphs.push([
      fillTemplate(sentences.hotels, {
        hotels: formatLocalizedList(hotelList, l)
      }),
      labels.hotelNote
    ].join(' '));
  }

  const duration = formatLocalizedDuration(video.duration, l);
  const publisher = cleanGeneratedText(video.channelTitle || video.channel || '');
  const published = formatPublishedDate(video.publishedAt, l);
  const sentenceDuration = duration.replace(/[.。]+$/u, '').trim();
  const sentencePublished = published.replace(/[.。]+$/u, '').trim();
  const sourceFacts = [
    publisher && sentencePublished
      ? fillTemplate(sentences.sourceDate, { publisher, date: sentencePublished })
      : publisher
        ? fillTemplate(sentences.sourceOnly, { publisher })
        : sentencePublished
          ? fillTemplate(sentences.dateOnly, { date: sentencePublished })
          : '',
    sentenceDuration
      ? fillTemplate(sentences.duration, { duration: sentenceDuration })
      : ''
  ].filter(Boolean);

  if (sourceFacts.length) {
    paragraphs.push(sourceFacts.join(' '));
  }

  return paragraphs.map(cleanGeneratedText).filter(Boolean);
}

export function getVideoSeoDescription(
  video: Video,
  lang?: string
) {
  return getVideoDescriptionParagraphs(video, lang)
    .join('\n\n');
}

function trimMetaDescription(value: string) {
  const cleaned = cleanGeneratedText(value);

  if (cleaned.length <= MAX_META_DESCRIPTION_LENGTH) {
    return cleaned;
  }

  const limited = cleaned.slice(0, MAX_META_DESCRIPTION_LENGTH - 1);
  const sentenceEnd = Math.max(
    limited.lastIndexOf('.'),
    limited.lastIndexOf('!'),
    limited.lastIndexOf('?'),
    limited.lastIndexOf('。'),
    limited.lastIndexOf('！'),
    limited.lastIndexOf('？')
  );
  const usesCompactScript =
    /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/u.test(cleaned);
  const minimumSentenceLength = usesCompactScript ? 80 : 135;

  if (sentenceEnd >= minimumSentenceLength) {
    return limited.slice(0, sentenceEnd + 1).trim();
  }

  const wordEnd = limited.lastIndexOf(' ');
  const trimmed = wordEnd >= 80
    ? limited.slice(0, wordEnd)
    : limited;

  return `${trimmed.replace(/[,:;\-–—]+$/, '').trim()}…`;
}

export function getVideoMetaDescription(
  video: Video,
  lang?: string
) {
  const l = normalizeLang(lang);
  return trimMetaDescription(
    getVideoDescriptionParagraphs(video, l).join(' ')
  );
}

export function getVideoH1(
  video: Video,
  lang?: string
) {
  const l = normalizeLang(lang);
  const baseTitle = getVideoCardTitle(video, l);
  const publication = formatSeoTitlePublication(
    video.publishedAt,
    l
  );
  const rawPublisher = cleanGeneratedText(
    video.channelTitle || video.channel || ''
  );
  const publisher = (
    rawPublisher.length > 28
      ? rawPublisher.slice(0, 28).replace(/\s+\S*$/u, '')
      : rawPublisher
  )
    .replace(/[|:;,\-–—]+$/u, '')
    .trim();
  const qualifier = [publication, publisher]
    .filter(Boolean)
    .join(' · ');

  if (!qualifier) {
    return baseTitle;
  }

  const maxBaseLength = Math.max(
    32,
    MAX_VIDEO_TITLE_LENGTH - qualifier.length - 3
  );
  const candidate = `${trimSeoTitle(
    baseTitle,
    maxBaseLength
  )} | ${qualifier}`;

  return trimSeoTitle(
    candidate,
    MAX_VIDEO_TITLE_LENGTH
  );
}

export function isValidYouTubeId(value: string) {
  return /^[A-Za-z0-9_-]{11}$/.test(String(value || '').trim());
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function getVideoThumbnailUrl(video: Video) {
  const thumbnail = String(video.thumbnail || '').trim();

  if (thumbnail && isValidHttpUrl(thumbnail)) {
    return thumbnail;
  }

  return isValidYouTubeId(video.id)
    ? `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`
    : '';
}

function hasCategoryContext(video: Video) {
  if (video.category && categoryNames[video.category]) {
    return true;
  }

  return /\b(?:walking tour|city walk|street walk|airport|drone|aerial|beach|street food|nature trail|museum|documentary|pov)\b/i
    .test(String(video.title || ''));
}

export function getVideoQualityScore(video: Video) {
  const validId = isValidYouTubeId(video.id);
  const validTitle = cleanGeneratedText(video.title).length >= 6;
  const embedAvailable = validId && video.embedAvailable !== false;
  const thumbnailAvailable =
    video.thumbnailValid !== false &&
    Boolean(getVideoThumbnailUrl(video));
  const locationAvailable = Boolean(getLocationLabel(video, 'en'));
  const categoryAvailable = hasCategoryContext(video);
  const active = video.active !== false && video.active !== 0;
  const specificPlaceAvailable = Boolean(getBestDetail(video));
  const verifiedRouteAvailable = getVerifiedRouteNames(video).length > 0;
  const verifiedChaptersAvailable = getVerifiedChapters(video).length > 0;
  const measuredHotelsAvailable = getVerifiedHotels(video)
    .some((hotel) => hotel.distanceMeters !== undefined);
  const durationAvailable = Boolean(parseDurationSeconds(video.duration));

  let score = 0;
  if (validId) score += 10;
  if (validTitle) score += 10;
  if (embedAvailable) score += 15;
  if (thumbnailAvailable) score += 10;
  if (locationAvailable) score += 15;
  if (categoryAvailable) score += 5;
  if (specificPlaceAvailable) score += 10;
  if (verifiedRouteAvailable || verifiedChaptersAvailable) score += 5;
  if (measuredHotelsAvailable) score += 5;
  if (durationAvailable) score += 5;
  if (video.publishedAt) score += 5;
  if (video.channelTitle || video.channel) score += 5;
  if (active) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getVideoIndexDecision(
  video: Video
): VideoIndexDecision {
  const reasons: string[] = [];
  const validId = isValidYouTubeId(video.id);
  const validTitle = cleanGeneratedText(video.title).length >= 6;
  const embedAvailable = validId && video.embedAvailable !== false;
  const thumbnailAvailable =
    video.thumbnailValid !== false &&
    Boolean(getVideoThumbnailUrl(video));
  const sufficientContext =
    Boolean(getLocationLabel(video, 'en')) &&
    hasCategoryContext(video);
  const evidenceSignals = getVideoEvidenceSignals(video);
  const uniqueContentAvailable = evidenceSignals.some((signal) =>
    [
      'specific-place',
      'verified-route',
      'verified-chapters',
      'measured-nearby-hotels'
    ].includes(signal)
  );
  const active = video.active !== false && video.active !== 0;
  const calculatedScore = getVideoQualityScore(video);
  const qualityScore =
    Number(video.contentVersion || 0) >= VIDEO_CONTENT_VERSION &&
    typeof video.qualityScore === 'number' &&
    Number.isFinite(video.qualityScore)
    ? Math.max(0, Math.min(100, Math.round(Number(video.qualityScore))))
    : calculatedScore;

  if (!active) reasons.push('inactive');
  if (!validId) reasons.push('invalid-video-id');
  if (!validTitle) reasons.push('missing-title');
  if (!embedAvailable) reasons.push('embed-unavailable');
  if (!thumbnailAvailable) reasons.push('thumbnail-unavailable');
  if (!sufficientContext) reasons.push('insufficient-context');
  if (!uniqueContentAvailable) reasons.push('insufficient-unique-value');
  if (qualityScore < MIN_INDEX_QUALITY_SCORE) {
    reasons.push('quality-below-threshold');
  }
  if (video.indexStatus === 'pending') {
    reasons.push('index-status-pending');
  }
  if (video.indexStatus === 'noindex') {
    reasons.push('index-status-noindex');
  }

  const indexable = reasons.length === 0;

  return {
    indexable,
    sitemapEligible: indexable,
    robots: indexable ? 'index,follow' : 'noindex,follow',
    qualityScore,
    reasons
  };
}

function countLocalizedWords(value: string, lang: string) {
  const cleaned = cleanGeneratedText(value);

  try {
    const segmenter = new Intl.Segmenter(lang, {
      granularity: 'word'
    });

    return Array.from(segmenter.segment(cleaned))
      .filter((segment) => segment.isWordLike)
      .length;
  } catch {
    return cleaned ? cleaned.split(/\s+/).length : 0;
  }
}

export function getVideoSeoAudit(
  video: Video,
  lang?: string
): VideoSeoAudit {
  const l = normalizeLang(lang);
  const paragraphs = getVideoDescriptionParagraphs(video, l);
  const description = paragraphs.join(' ');
  const normalizedParagraphs = paragraphs.map((paragraph) =>
    cleanGeneratedText(paragraph).toLocaleLowerCase()
  );
  const uniqueSignals = getVideoEvidenceSignals(video);
  const expectedSignals = [
    'specific-place',
    'verified-route',
    'verified-chapters',
    'measured-nearby-hotels',
    'duration',
    'publisher',
    'publication-date'
  ];

  return {
    lang: l,
    characterCount: description.length,
    wordCount: countLocalizedWords(description, l),
    paragraphCount: paragraphs.length,
    uniqueSignals,
    missingSignals: expectedSignals.filter((signal) =>
      !uniqueSignals.includes(signal)
    ),
    repeatedParagraphs:
      new Set(normalizedParagraphs).size !== normalizedParagraphs.length,
    indexDecision: getVideoIndexDecision(video)
  };
}

const DEFAULT_SITE_URL = 'https://oldtownswalks.com';

function normalizeSiteUrl(baseUrl?: string) {
  return String(baseUrl || DEFAULT_SITE_URL)
    .trim()
    .replace(/\/$/, '');
}

export function getVideoCanonicalUrl(
  video: Video,
  lang?: string,
  baseUrl?: string
) {
  const l = normalizeLang(lang);
  return `${normalizeSiteUrl(baseUrl)}/${l}/walks/${video.id}`;
}

function parseDurationSeconds(value?: string) {
  const duration = String(value || '').trim();

  if (/^\d+$/.test(duration)) {
    const seconds = Number(duration);
    return seconds > 0 ? seconds : undefined;
  }

  const match = duration.match(
    /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i
  );

  if (!match) {
    return undefined;
  }

  const seconds =
    Number(match[1] || 0) * 86400 +
    Number(match[2] || 0) * 3600 +
    Number(match[3] || 0) * 60 +
    Number(match[4] || 0);

  return seconds > 0 ? Math.floor(seconds) : undefined;
}

function normalizeIsoDate(value?: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toISOString()
    : undefined;
}

export function getVideoSitemapData(
  video: Video,
  lang?: string,
  baseUrl?: string
): VideoSitemapData {
  const l = normalizeLang(lang);
  const root = normalizeSiteUrl(baseUrl);
  const decision = getVideoIndexDecision(video);
  const loc = getVideoCanonicalUrl(video, l, root);
  const alternates = supportedLangs.map((alternateLang) => ({
    lang: alternateLang,
    href: getVideoCanonicalUrl(video, alternateLang, root)
  }));
  const thumbnailLoc = getVideoThumbnailUrl(video);
  const durationSeconds = parseDurationSeconds(video.duration);
  const uploader = cleanGeneratedText(
    video.channelTitle || video.channel || ''
  );

  return {
    eligible: decision.sitemapEligible,
    loc,
    lastmod: normalizeIsoDate(video.updatedAt || video.publishedAt),
    alternates,
    video: decision.sitemapEligible
      ? {
          thumbnailLoc,
          title: getVideoH1(video, l),
          description: getVideoMetaDescription(video, l),
          playerLoc: `https://www.youtube-nocookie.com/embed/${video.id}`,
          ...(video.publishedAt
            ? { publicationDate: video.publishedAt }
            : {}),
          ...(durationSeconds
            ? { durationSeconds }
            : {}),
          ...(uploader
            ? { uploader }
            : {})
        }
      : null
  };
}

function getVideoSourcePayload(video: Video) {
  return JSON.stringify({
    id: String(video.id || '').trim(),
    title: cleanGeneratedText(video.title),
    description: cleanGeneratedText(video.description || ''),
    thumbnail: String(video.thumbnail || '').trim(),
    category: String(video.category || '').trim(),
    channel: cleanGeneratedText(video.channel || ''),
    channelTitle: cleanGeneratedText(video.channelTitle || ''),
    channelId: String(video.channelId || '').trim(),
    publishedAt: String(video.publishedAt || '').trim(),
    duration: String(video.duration || '').trim(),
    badge: cleanGeneratedText(video.badge || ''),
    city: cleanGeneratedText(video.city || ''),
    country: cleanGeneratedText(video.country || ''),
    active: video.active !== false && video.active !== 0,
    embedAvailable: video.embedAvailable,
    thumbnailValid: video.thumbnailValid,
    chapters: getVerifiedChapters(video),
    routePoints: (video.routePoints || [])
      .filter((point) => point.verified === true)
      .map((point) => ({
        name: cleanGeneratedText(point.name),
        type: cleanGeneratedText(point.type || '')
      })),
    nearbyHotels: getVerifiedHotels(video).map((hotel) => ({
      id: cleanGeneratedText(hotel.id),
      name: hotel.name,
      distanceMeters: hotel.distanceMeters
    }))
  });
}

export async function createVideoSourceHash(video: Video) {
  const bytes = new TextEncoder().encode(getVideoSourcePayload(video));
  const digest = await crypto.subtle.digest('SHA-256', bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function baseVideoSchema(
  video: Video,
  lang?: string
) {
  const l = normalizeLang(lang);
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: getVideoH1(video, l),
    description: getVideoSeoDescription(video, l),
    inLanguage: l
  };
  const thumbnailUrl = getVideoThumbnailUrl(video);

  if (thumbnailUrl) {
    schema.thumbnailUrl = [thumbnailUrl];
  }

  if (isValidYouTubeId(video.id)) {
    schema.embedUrl =
      `https://www.youtube-nocookie.com/embed/${video.id}`;
  }

  if (video.publishedAt) {
    schema.uploadDate = video.publishedAt;
  }

  if (video.duration) {
    schema.duration = video.duration;
  }

  const channelName = cleanGeneratedText(
    video.channelTitle || video.channel || ''
  );

  if (channelName) {
    schema.author = {
      '@type': 'Organization',
      name: channelName
    };
  }

  const chapters = getVerifiedChapters(video);

  if (chapters.length && isValidYouTubeId(video.id)) {
    schema.hasPart = chapters.map((chapter) => ({
      '@type': 'Clip',
      name: chapter.title,
      startOffset: chapter.startSeconds,
      ...(chapter.endSeconds
        ? { endOffset: chapter.endSeconds }
        : {}),
      url:
        `https://www.youtube.com/watch?v=${video.id}&t=${chapter.startSeconds}s`
    }));
  }

  return schema;
}

export function getVideoSchema(
  video: Video,
  lang?: string
) {
  return baseVideoSchema(video, lang);
}

export function generateVideoSchema(
  video: Video,
  baseUrl: string,
  lang?: string
) {
  const l = normalizeLang(lang);

  return {
    ...baseVideoSchema(video, l),
    url: getVideoCanonicalUrl(video, l, baseUrl)
  };
}

export function getVideoSeoContent(
  video: Video,
  lang?: string,
  baseUrl: string = DEFAULT_SITE_URL,
  override?: VideoContentOverride
) {
  const l = normalizeLang(lang);
  const matchingOverride = override?.lang === l
    ? override
    : undefined;
  const generatedParagraphs = getVideoDescriptionParagraphs(video, l);
  const overrideParagraphs = (matchingOverride?.paragraphs || [])
    .map(cleanGeneratedText)
    .filter(Boolean);
  const paragraphs = overrideParagraphs.length
    ? overrideParagraphs
    : generatedParagraphs;
  const h1 = cleanGeneratedText(matchingOverride?.h1 || '') ||
    getVideoH1(video, l);
  const metaDescription = matchingOverride?.metaDescription
    ? trimMetaDescription(matchingOverride.metaDescription)
    : overrideParagraphs.length
      ? trimMetaDescription(paragraphs.join(' '))
      : getVideoMetaDescription(video, l);
  const description = paragraphs.join('\n\n');
  const indexDecision = getVideoIndexDecision(video);
  const videoObject = {
    ...generateVideoSchema(video, baseUrl, l),
    name: h1,
    description
  };
  const sitemap = getVideoSitemapData(video, l, baseUrl);

  if (sitemap.video) {
    sitemap.video = {
      ...sitemap.video,
      title: h1,
      description: metaDescription
    };
  }

  return {
    lang: l,
    h1,
    metaDescription,
    paragraphs,
    description,
    canonicalUrl: getVideoCanonicalUrl(video, l, baseUrl),
    robots: indexDecision.robots,
    indexDecision,
    videoObject,
    sitemap,
    sourceHash: video.sourceHash || '',
    contentVersion: VIDEO_CONTENT_VERSION
  };
}

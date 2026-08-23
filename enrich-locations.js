import fs from 'fs';

const OUTPUT_PATH = './src/data/videos.json';

const LOCATION_RULES = [
  { city: 'Tokyo', country: 'Japan', aliases: ['tokyo'] },
  { city: 'Kyoto', country: 'Japan', aliases: ['kyoto'] },
  { city: 'Osaka', country: 'Japan', aliases: ['osaka'] },
  { city: 'Yokohama', country: 'Japan', aliases: ['yokohama'] },
  { city: 'Nara', country: 'Japan', aliases: ['nara'] },
  { city: 'Sapporo', country: 'Japan', aliases: ['sapporo'] },
  { city: 'Fukuoka', country: 'Japan', aliases: ['fukuoka'] },
  { city: 'Hiroshima', country: 'Japan', aliases: ['hiroshima'] },

  { city: 'Istanbul', country: 'Türkiye', aliases: ['istanbul'] },
  { city: 'Izmir', country: 'Türkiye', aliases: ['izmir'] },
  { city: 'Ankara', country: 'Türkiye', aliases: ['ankara'] },
  { city: 'Antalya', country: 'Türkiye', aliases: ['antalya'] },

  { city: 'London', country: 'United Kingdom', aliases: ['london'] },
  { city: 'Edinburgh', country: 'United Kingdom', aliases: ['edinburgh'] },
  { city: 'Manchester', country: 'United Kingdom', aliases: ['manchester'] },
  { city: 'Liverpool', country: 'United Kingdom', aliases: ['liverpool'] },

  { city: 'Paris', country: 'France', aliases: ['paris'] },
  { city: 'Lyon', country: 'France', aliases: ['lyon'] },
  { city: 'Marseille', country: 'France', aliases: ['marseille'] },
  { city: 'Bordeaux', country: 'France', aliases: ['bordeaux'] },

  { city: 'Rome', country: 'Italy', aliases: ['rome', 'roma'] },
  { city: 'Milan', country: 'Italy', aliases: ['milan', 'milano'] },
  { city: 'Venice', country: 'Italy', aliases: ['venice', 'venezia'] },
  { city: 'Florence', country: 'Italy', aliases: ['florence', 'firenze'] },
  { city: 'Naples', country: 'Italy', aliases: ['naples', 'napoli'] },
  { city: 'Pompeii', country: 'Italy', aliases: ['pompeii', 'pompei'] },

  { city: 'Barcelona', country: 'Spain', aliases: ['barcelona'] },
  { city: 'Madrid', country: 'Spain', aliases: ['madrid'] },
  { city: 'Seville', country: 'Spain', aliases: ['seville', 'sevilla'] },
  { city: 'Malaga', country: 'Spain', aliases: ['malaga'] },

  { city: 'Lisbon', country: 'Portugal', aliases: ['lisbon', 'lisboa'] },
  { city: 'Porto', country: 'Portugal', aliases: ['porto'] },

  { city: 'Amsterdam', country: 'Netherlands', aliases: ['amsterdam'] },
  { city: 'Rotterdam', country: 'Netherlands', aliases: ['rotterdam'] },

  { city: 'Berlin', country: 'Germany', aliases: ['berlin'] },
  { city: 'Munich', country: 'Germany', aliases: ['munich', 'munchen'] },
  { city: 'Hamburg', country: 'Germany', aliases: ['hamburg'] },
  { city: 'Cologne', country: 'Germany', aliases: ['cologne', 'koln'] },
  { city: 'Düsseldorf', country: 'Germany', aliases: ['dusseldorf'] },
  { city: 'Frankfurt', country: 'Germany', aliases: ['frankfurt'] },
  { city: 'Dresden', country: 'Germany', aliases: ['dresden'] },

  { city: 'Vienna', country: 'Austria', aliases: ['vienna', 'wien'] },
  { city: 'Salzburg', country: 'Austria', aliases: ['salzburg'] },

  { city: 'Zurich', country: 'Switzerland', aliases: ['zurich'] },
  { city: 'Geneva', country: 'Switzerland', aliases: ['geneva'] },
  { city: 'Lucerne', country: 'Switzerland', aliases: ['lucerne', 'luzern'] },

  { city: 'Prague', country: 'Czechia', aliases: ['prague', 'praha'] },
  { city: 'Budapest', country: 'Hungary', aliases: ['budapest'] },
  { city: 'Warsaw', country: 'Poland', aliases: ['warsaw', 'warszawa'] },
  { city: 'Krakow', country: 'Poland', aliases: ['krakow'] },

  { city: 'Athens', country: 'Greece', aliases: ['athens'] },
  { city: 'Dubrovnik', country: 'Croatia', aliases: ['dubrovnik'] },
  { city: 'Zagreb', country: 'Croatia', aliases: ['zagreb'] },

  { city: 'Copenhagen', country: 'Denmark', aliases: ['copenhagen'] },
  { city: 'Stockholm', country: 'Sweden', aliases: ['stockholm'] },
  { city: 'Oslo', country: 'Norway', aliases: ['oslo'] },
  { city: 'Helsinki', country: 'Finland', aliases: ['helsinki'] },
  { city: 'Reykjavik', country: 'Iceland', aliases: ['reykjavik'] },
  { city: 'Dublin', country: 'Ireland', aliases: ['dublin'] },

  { city: 'New York', country: 'United States', aliases: ['new york', 'nyc', 'manhattan'] },
  { city: 'Los Angeles', country: 'United States', aliases: ['los angeles'] },
  { city: 'San Francisco', country: 'United States', aliases: ['san francisco'] },
  { city: 'Las Vegas', country: 'United States', aliases: ['las vegas'] },
  { city: 'Chicago', country: 'United States', aliases: ['chicago'] },
  { city: 'Boston', country: 'United States', aliases: ['boston'] },
  { city: 'Miami', country: 'United States', aliases: ['miami'] },
  { city: 'Seattle', country: 'United States', aliases: ['seattle'] },

  { city: 'Toronto', country: 'Canada', aliases: ['toronto'] },
  { city: 'Vancouver', country: 'Canada', aliases: ['vancouver'] },
  { city: 'Montreal', country: 'Canada', aliases: ['montreal'] },

  { city: 'Mexico City', country: 'Mexico', aliases: ['mexico city'] },

  { city: 'Rio de Janeiro', country: 'Brazil', aliases: ['rio de janeiro'] },
  { city: 'São Paulo', country: 'Brazil', aliases: ['sao paulo'] },
  { city: 'Buenos Aires', country: 'Argentina', aliases: ['buenos aires'] },
  { city: 'Lima', country: 'Peru', aliases: ['lima peru'] },

  { city: 'Seoul', country: 'South Korea', aliases: ['seoul'] },
  { city: 'Busan', country: 'South Korea', aliases: ['busan'] },

  { city: 'Beijing', country: 'China', aliases: ['beijing'] },
  { city: 'Shanghai', country: 'China', aliases: ['shanghai'] },
  { city: 'Hong Kong', country: 'Hong Kong', aliases: ['hong kong'] },

  { city: 'Bangkok', country: 'Thailand', aliases: ['bangkok'] },
  { city: 'Chiang Mai', country: 'Thailand', aliases: ['chiang mai'] },
  { city: 'Phuket', country: 'Thailand', aliases: ['phuket'] },

  { city: 'Singapore', country: 'Singapore', aliases: ['singapore'] },
  { city: 'Kuala Lumpur', country: 'Malaysia', aliases: ['kuala lumpur'] },

  { city: 'Hanoi', country: 'Vietnam', aliases: ['hanoi'] },
  { city: 'Ho Chi Minh City', country: 'Vietnam', aliases: ['ho chi minh city', 'saigon'] },

  { city: 'Jakarta', country: 'Indonesia', aliases: ['jakarta'] },
  { city: 'Manila', country: 'Philippines', aliases: ['manila'] },

  { city: 'Dubai', country: 'United Arab Emirates', aliases: ['dubai'] },
  { city: 'Abu Dhabi', country: 'United Arab Emirates', aliases: ['abu dhabi'] },

  { city: 'Cairo', country: 'Egypt', aliases: ['cairo'] },
  { city: 'Luxor', country: 'Egypt', aliases: ['luxor'] },

  { city: 'Marrakesh', country: 'Morocco', aliases: ['marrakesh', 'marrakech'] },
  { city: 'Casablanca', country: 'Morocco', aliases: ['casablanca'] },

  { city: 'Sydney', country: 'Australia', aliases: ['sydney'] },
  { city: 'Melbourne', country: 'Australia', aliases: ['melbourne'] },
  { city: 'Brisbane', country: 'Australia', aliases: ['brisbane'] },

  { city: 'Auckland', country: 'New Zealand', aliases: ['auckland'] }
];

const COUNTRY_RULES = [
  { country: 'Japan', aliases: ['japan'] },
  { country: 'Türkiye', aliases: ['turkey', 'turkiye'] },
  { country: 'United Kingdom', aliases: ['united kingdom', 'england', 'scotland'] },
  { country: 'France', aliases: ['france'] },
  { country: 'Italy', aliases: ['italy', 'italia'] },
  { country: 'Spain', aliases: ['spain', 'espana'] },
  { country: 'Portugal', aliases: ['portugal'] },
  { country: 'Netherlands', aliases: ['netherlands', 'holland'] },
  { country: 'Germany', aliases: ['germany', 'deutschland'] },
  { country: 'Austria', aliases: ['austria'] },
  { country: 'Switzerland', aliases: ['switzerland'] },
  { country: 'Czechia', aliases: ['czechia', 'czech republic'] },
  { country: 'Hungary', aliases: ['hungary'] },
  { country: 'Poland', aliases: ['poland'] },
  { country: 'Greece', aliases: ['greece'] },
  { country: 'Croatia', aliases: ['croatia'] },
  { country: 'Denmark', aliases: ['denmark'] },
  { country: 'Sweden', aliases: ['sweden'] },
  { country: 'Norway', aliases: ['norway'] },
  { country: 'Finland', aliases: ['finland'] },
  { country: 'Iceland', aliases: ['iceland'] },
  { country: 'Ireland', aliases: ['ireland'] },

  { country: 'United States', aliases: ['united states', 'usa'] },
  { country: 'Canada', aliases: ['canada'] },
  { country: 'Mexico', aliases: ['mexico'] },
  { country: 'Brazil', aliases: ['brazil', 'brasil'] },
  { country: 'Argentina', aliases: ['argentina'] },
  { country: 'Chile', aliases: ['chile'] },
  { country: 'Peru', aliases: ['peru'] },

  { country: 'South Korea', aliases: ['south korea'] },
  { country: 'China', aliases: ['china'] },
  { country: 'Thailand', aliases: ['thailand'] },
  { country: 'Singapore', aliases: ['singapore'] },
  { country: 'Malaysia', aliases: ['malaysia'] },
  { country: 'Vietnam', aliases: ['vietnam'] },
  { country: 'Indonesia', aliases: ['indonesia'] },
  { country: 'Philippines', aliases: ['philippines'] },

  { country: 'United Arab Emirates', aliases: ['united arab emirates', 'uae'] },
  { country: 'Egypt', aliases: ['egypt'] },
  { country: 'Morocco', aliases: ['morocco'] },

  { country: 'Australia', aliases: ['australia'] },
  { country: 'New Zealand', aliases: ['new zealand'] }
];

function normalizeText(value) {
  return ` ${String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `;
}

function containsAlias(text, alias) {
  const normalizedAlias = normalizeText(alias).trim();

  return (
    normalizedAlias &&
    text.includes(` ${normalizedAlias} `)
  );
}

function detectLocation(video) {
  const title = normalizeText(video.title);

  for (const rule of LOCATION_RULES) {
    if (
      rule.aliases.some((alias) =>
        containsAlias(title, alias)
      )
    ) {
      return {
        city: rule.city,
        country: rule.country
      };
    }
  }

  for (const rule of COUNTRY_RULES) {
    if (
      rule.aliases.some((alias) =>
        containsAlias(title, alias)
      )
    ) {
      return {
        city: '',
        country: rule.country
      };
    }
  }

  return {
    city: '',
    country: ''
  };
}

function loadVideos() {
  if (!fs.existsSync(OUTPUT_PATH)) {
    console.error('videos.json was not found.');
    process.exit(1);
  }

  try {
    const rawData = fs.readFileSync(
      OUTPUT_PATH,
      'utf8'
    );

    const data = JSON.parse(rawData);

    if (!Array.isArray(data)) {
      throw new Error(
        'videos.json must contain an array.'
      );
    }

    return data;
  } catch (error) {
    console.error(
      'Could not read videos.json:',
      error.message || error
    );

    process.exit(1);
  }
}

const videos = loadVideos();

let citiesAdded = 0;
let countriesAdded = 0;
let unchangedVideos = 0;

const updatedVideos = videos.map((video) => {
  const detected = detectLocation(video);

  const updatedVideo = {
    ...video
  };

  let changed = false;

  if (!updatedVideo.city && detected.city) {
    updatedVideo.city = detected.city;
    citiesAdded++;
    changed = true;
  }

  if (!updatedVideo.country && detected.country) {
    updatedVideo.country = detected.country;
    countriesAdded++;
    changed = true;
  }

  if (!changed) {
    unchangedVideos++;
  }

  return updatedVideo;
});

fs.writeFileSync(
  OUTPUT_PATH,
  JSON.stringify(
    updatedVideos,
    null,
    2
  ),
  'utf8'
);

console.log(
  `Videos processed: ${updatedVideos.length}`
);

console.log(
  `Cities added: ${citiesAdded}`
);

console.log(
  `Countries added: ${countriesAdded}`
);

console.log(
  `Unchanged videos: ${unchangedVideos}`
);
import fs from 'fs';

const DEFAULT_INPUT_PATH = './video-candidates.evidence.json';
const DEFAULT_OUTPUT_PATH = './video-candidates.locations.json';

function parseArguments(argv) {
  const args = {
    inputPath: DEFAULT_INPUT_PATH,
    outputPath: DEFAULT_OUTPUT_PATH
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--input' && argv[index + 1]) {
      args.inputPath = argv[++index];
    } else if (value === '--output' && argv[index + 1]) {
      args.outputPath = argv[++index];
    }
  }

  return args;
}

const LOCATION_RULES = [
  { city: 'Tokyo', country: 'Japan', aliases: ['tokyo'] },
  { city: 'Kyoto', country: 'Japan', aliases: ['kyoto'] },
  { city: 'Osaka', country: 'Japan', aliases: ['osaka'] },
  { city: 'Yokohama', country: 'Japan', aliases: ['yokohama'] },
  { city: 'Nara', country: 'Japan', aliases: ['nara'] },
  { city: 'Sapporo', country: 'Japan', aliases: ['sapporo'] },
  { city: 'Kobe', country: 'Japan', aliases: ['kobe'] },
  { city: 'Fukuoka', country: 'Japan', aliases: ['fukuoka'] },
  { city: 'Nagoya', country: 'Japan', aliases: ['nagoya'] },
  { city: 'Hiroshima', country: 'Japan', aliases: ['hiroshima'] },

  { city: 'Istanbul', country: 'Türkiye', aliases: ['istanbul'] },
  { city: 'Izmir', country: 'Türkiye', aliases: ['izmir'] },
  { city: 'Ankara', country: 'Türkiye', aliases: ['ankara'] },
  { city: 'Antalya', country: 'Türkiye', aliases: ['antalya'] },
  { city: 'Bursa', country: 'Türkiye', aliases: ['bursa'] },

  { city: 'London', country: 'United Kingdom', aliases: ['london'] },
  { city: 'Edinburgh', country: 'United Kingdom', aliases: ['edinburgh'] },
  { city: 'Manchester', country: 'United Kingdom', aliases: ['manchester'] },
  { city: 'Liverpool', country: 'United Kingdom', aliases: ['liverpool'] },
  { city: 'Oxford', country: 'United Kingdom', aliases: ['oxford'] },
  { city: 'Cambridge', country: 'United Kingdom', aliases: ['cambridge'] },

  { city: 'Paris', country: 'France', aliases: ['paris'] },
  { city: 'Nice', country: 'France', aliases: ['nice france', 'nice cote d azur'] },
  { city: 'Lyon', country: 'France', aliases: ['lyon'] },
  { city: 'Marseille', country: 'France', aliases: ['marseille'] },
  { city: 'Bordeaux', country: 'France', aliases: ['bordeaux'] },
  { city: 'Strasbourg', country: 'France', aliases: ['strasbourg'] },

  { city: 'Rome', country: 'Italy', aliases: ['rome', 'roma'] },
  { city: 'Milan', country: 'Italy', aliases: ['milan', 'milano'] },
  { city: 'Venice', country: 'Italy', aliases: ['venice', 'venezia'] },
  { city: 'Florence', country: 'Italy', aliases: ['florence', 'firenze'] },
  { city: 'Naples', country: 'Italy', aliases: ['naples', 'napoli'] },
  { city: 'Bologna', country: 'Italy', aliases: ['bologna'] },
  { city: 'Verona', country: 'Italy', aliases: ['verona'] },
  { city: 'Turin', country: 'Italy', aliases: ['turin', 'torino'] },
  { city: 'Palermo', country: 'Italy', aliases: ['palermo'] },
  { city: 'Pompeii', country: 'Italy', aliases: ['pompeii', 'pompei'] },

  { city: 'Barcelona', country: 'Spain', aliases: ['barcelona'] },
  { city: 'Madrid', country: 'Spain', aliases: ['madrid'] },
  { city: 'Seville', country: 'Spain', aliases: ['seville', 'sevilla'] },
  { city: 'Valencia', country: 'Spain', aliases: ['valencia spain', 'valencia espana'] },
  { city: 'Malaga', country: 'Spain', aliases: ['malaga'] },
  { city: 'Granada', country: 'Spain', aliases: ['granada spain', 'granada espana'] },

  { city: 'Lisbon', country: 'Portugal', aliases: ['lisbon', 'lisboa'] },
  { city: 'Porto', country: 'Portugal', aliases: ['porto portugal'] },

  { city: 'Amsterdam', country: 'Netherlands', aliases: ['amsterdam'] },
  { city: 'Rotterdam', country: 'Netherlands', aliases: ['rotterdam'] },
  { city: 'The Hague', country: 'Netherlands', aliases: ['the hague', 'den haag'] },

  { city: 'Berlin', country: 'Germany', aliases: ['berlin'] },
  { city: 'Munich', country: 'Germany', aliases: ['munich', 'munchen'] },
  { city: 'Hamburg', country: 'Germany', aliases: ['hamburg'] },
  { city: 'Cologne', country: 'Germany', aliases: ['cologne', 'koln'] },
  { city: 'Düsseldorf', country: 'Germany', aliases: ['dusseldorf'] },
  { city: 'Frankfurt', country: 'Germany', aliases: ['frankfurt'] },
  { city: 'Dresden', country: 'Germany', aliases: ['dresden'] },
  { city: 'Nuremberg', country: 'Germany', aliases: ['nuremberg', 'nurnberg'] },
  { city: 'Heidelberg', country: 'Germany', aliases: ['heidelberg'] },

  { city: 'Vienna', country: 'Austria', aliases: ['vienna', 'wien'] },
  { city: 'Salzburg', country: 'Austria', aliases: ['salzburg'] },
  { city: 'Innsbruck', country: 'Austria', aliases: ['innsbruck'] },

  { city: 'Zurich', country: 'Switzerland', aliases: ['zurich'] },
  { city: 'Geneva', country: 'Switzerland', aliases: ['geneva', 'geneve'] },
  { city: 'Lucerne', country: 'Switzerland', aliases: ['lucerne', 'luzern'] },
  { city: 'Bern', country: 'Switzerland', aliases: ['bern switzerland', 'berne switzerland'] },

  { city: 'Prague', country: 'Czechia', aliases: ['prague', 'praha'] },
  { city: 'Budapest', country: 'Hungary', aliases: ['budapest'] },
  { city: 'Warsaw', country: 'Poland', aliases: ['warsaw', 'warszawa'] },
  { city: 'Krakow', country: 'Poland', aliases: ['krakow'] },
  { city: 'Gdansk', country: 'Poland', aliases: ['gdansk'] },

  { city: 'Athens', country: 'Greece', aliases: ['athens', 'athina'] },
  { city: 'Thessaloniki', country: 'Greece', aliases: ['thessaloniki'] },

  { city: 'Dubrovnik', country: 'Croatia', aliases: ['dubrovnik'] },
  { city: 'Split', country: 'Croatia', aliases: ['split croatia'] },
  { city: 'Zagreb', country: 'Croatia', aliases: ['zagreb'] },

  { city: 'Copenhagen', country: 'Denmark', aliases: ['copenhagen', 'kobenhavn'] },
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
  { city: 'Washington', country: 'United States', aliases: ['washington dc', 'washington d c'] },
  { city: 'Philadelphia', country: 'United States', aliases: ['philadelphia'] },

  { city: 'Toronto', country: 'Canada', aliases: ['toronto'] },
  { city: 'Vancouver', country: 'Canada', aliases: ['vancouver'] },
  { city: 'Montreal', country: 'Canada', aliases: ['montreal'] },
  { city: 'Quebec City', country: 'Canada', aliases: ['quebec city'] },

  { city: 'Mexico City', country: 'Mexico', aliases: ['mexico city', 'ciudad de mexico'] },

  { city: 'Rio de Janeiro', country: 'Brazil', aliases: ['rio de janeiro'] },
  { city: 'São Paulo', country: 'Brazil', aliases: ['sao paulo'] },
  { city: 'Buenos Aires', country: 'Argentina', aliases: ['buenos aires'] },
  { city: 'Santiago', country: 'Chile', aliases: ['santiago chile'] },
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

  { city: 'Hanoi', country: 'Vietnam', aliases: ['hanoi', 'ha noi'] },
  { city: 'Ho Chi Minh City', country: 'Vietnam', aliases: ['ho chi minh city', 'saigon'] },

  { city: 'Bali', country: 'Indonesia', aliases: ['bali indonesia'] },
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

  { city: 'Auckland', country: 'New Zealand', aliases: ['auckland'] },
  { city: 'Queenstown', country: 'New Zealand', aliases: ['queenstown new zealand'] }
];

const COUNTRY_RULES = [
  { country: 'Japan', aliases: ['japan'] },
  { country: 'Türkiye', aliases: ['turkey', 'turkiye'] },
  { country: 'United Kingdom', aliases: ['united kingdom', 'great britain', 'england', 'scotland', 'wales'] },
  { country: 'France', aliases: ['france'] },
  { country: 'Italy', aliases: ['italy', 'italia'] },
  { country: 'Spain', aliases: ['spain', 'espana'] },
  { country: 'Portugal', aliases: ['portugal'] },
  { country: 'Netherlands', aliases: ['netherlands', 'holland'] },
  { country: 'Belgium', aliases: ['belgium'] },
  { country: 'Germany', aliases: ['germany', 'deutschland'] },
  { country: 'Austria', aliases: ['austria', 'osterreich'] },
  { country: 'Switzerland', aliases: ['switzerland', 'schweiz', 'suisse'] },
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
  { country: 'United States', aliases: ['united states', 'united states of america', 'usa'] },
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
  { country: 'Vietnam', aliases: ['vietnam', 'viet nam'] },
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

function containsAlias(normalizedText, alias) {
  const normalizedAlias = normalizeText(alias).trim();
  return normalizedAlias && normalizedText.includes(` ${normalizedAlias} `);
}

function detectLocation(video) {
  const sourceText = normalizeText(
    `${video.title || ''} ${video.description || ''}`
  );

  for (const rule of LOCATION_RULES) {
    if (rule.aliases.some((alias) => containsAlias(sourceText, alias))) {
      return {
        city: rule.city,
        country: rule.country
      };
    }
  }

  for (const rule of COUNTRY_RULES) {
    if (rule.aliases.some((alias) => containsAlias(sourceText, alias))) {
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

function loadVideos(inputPath) {
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file was not found: ${inputPath}`);
    process.exit(1);
  }

  try {
    const rawData = fs.readFileSync(inputPath, 'utf8');
    const data = JSON.parse(rawData);

    if (!Array.isArray(data)) {
      throw new Error('The input file must contain an array.');
    }

    return data;
  } catch (error) {
    console.error('Could not read the input file:', error.message || error);
    process.exit(1);
  }
}

const args = parseArguments(process.argv.slice(2));
const videos = loadVideos(args.inputPath);

let cityAdded = 0;
let countryAdded = 0;
let unchanged = 0;

const updatedVideos = videos.map((video) => {
  const detected = detectLocation(video);
  const nextVideo = { ...video };

  if (!nextVideo.city && detected.city) {
    nextVideo.city = detected.city;
    cityAdded++;
  }

  if (!nextVideo.country && detected.country) {
    nextVideo.country = detected.country;
    countryAdded++;
  }

  if (
    nextVideo.city === video.city &&
    nextVideo.country === video.country
  ) {
    unchanged++;
  }

  return nextVideo;
});

fs.writeFileSync(
  args.outputPath,
  `${JSON.stringify(updatedVideos, null, 2)}\n`,
  'utf8'
);

console.log(`Videos processed: ${updatedVideos.length}`);
console.log(`Cities added: ${cityAdded}`);
console.log(`Countries added: ${countryAdded}`);
console.log(`Unchanged videos: ${unchanged}`);
console.log(`Location output: ${args.outputPath}`);
console.log(`${args.inputPath} was not changed.`);

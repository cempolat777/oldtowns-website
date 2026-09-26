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

  { city: 'Istanbul', country: 'TÃ¼rkiye', aliases: ['istanbul'] },
  { city: 'Izmir', country: 'TÃ¼rkiye', aliases: ['izmir'] },
  { city: 'Ankara', country: 'TÃ¼rkiye', aliases: ['ankara'] },
  { city: 'Antalya', country: 'TÃ¼rkiye', aliases: ['antalya'] },
  { city: 'Bursa', country: 'TÃ¼rkiye', aliases: ['bursa'] },

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
  { city: 'DÃ¼sseldorf', country: 'Germany', aliases: ['dusseldorf'] },
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
  { city: 'SÃ£o Paulo', country: 'Brazil', aliases: ['sao paulo'] },
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

const EXTRA_RULES = [
  {
    city: 'Bogota',
    country: 'Colombia',
    aliases: ['bogota']
  },
  {
    city: 'Granada',
    country: 'Spain',
    aliases: ['alhambra granada', 'granada spain']
  }
];

const DISTRICT_RULES = [
  { city: 'Düsseldorf', district: 'Altstadt', aliases: ['altstadt'] },
  { city: 'Düsseldorf', district: 'Oberbilk', aliases: ['oberbilk'] },
  { city: 'Düsseldorf', district: 'Unterbilk', aliases: ['unterbilk'] },
  { city: 'Tokyo', district: 'Akihabara', aliases: ['akihabara'] },
  { city: 'Izmir', district: 'Alsancak', aliases: ['alsancak'] },
  { city: 'Izmir', district: 'Konak', aliases: ['konak'] },
  { city: 'Izmir', district: 'Kemeraltı', aliases: ['kemeralti'] }
];

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function containsPlace(text, alias) {
  const normalizedAlias = normalize(alias);

  return normalizedAlias &&
    ` ${text} `.includes(` ${normalizedAlias} `);
}

export function detectHotelLocation(video) {
  const title = normalize(video.title);

  const matches = [...LOCATION_RULES, ...EXTRA_RULES]
    .filter(rule =>
      rule.aliases.some(alias => containsPlace(title, alias))
    );

  const uniqueCities = [...new Set(matches.map(rule => rule.city))];

  if (uniqueCities.length !== 1) {
    return {
      status: uniqueCities.length ? 'ambiguous' : 'no_location'
    };
  }

  const location = matches[0];

  if (
    video.city &&
    normalize(video.city) !== normalize(location.city)
  ) {
    return {
      status: 'conflict',
      titleCity: location.city,
      storedCity: video.city
    };
  }

  const district = DISTRICT_RULES.find(rule =>
    rule.city === location.city &&
    rule.aliases.some(alias => containsPlace(title, alias))
  );

  return {
    status: 'resolved',
    city: location.city,
    country: location.country,
    district: district?.district || null,
    searchLocation: [
      district?.district,
      location.city,
      location.country
    ].filter(Boolean).join(', ')
  };
}
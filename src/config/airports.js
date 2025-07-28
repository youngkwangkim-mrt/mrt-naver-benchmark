// Airport codes and their metadata
export const AIRPORTS = {
  // Seoul airports
  ICN: { name: 'Incheon International Airport', city: 'Seoul', region: 'Korea' },
  SEL: { name: 'Seoul Metropolitan Area', city: 'Seoul', region: 'Korea' },
  
  // Asia
  NRT: { name: 'Narita International Airport', city: 'Tokyo', region: 'Asia' },
  HND: { name: 'Haneda Airport', city: 'Tokyo', region: 'Asia' },
  TYO: { name: 'Tokyo Metropolitan Area', city: 'Tokyo', region: 'Asia' },
  KIX: { name: 'Kansai International Airport', city: 'Osaka', region: 'Asia' },
  OSA: { name: 'Osaka Metropolitan Area', city: 'Osaka', region: 'Asia' },
  FUK: { name: 'Fukuoka Airport', city: 'Fukuoka', region: 'Asia' },
  CTS: { name: 'New Chitose Airport', city: 'Sapporo', region: 'Asia' },
  DAD: { name: 'Da Nang International Airport', city: 'Da Nang', region: 'Asia' },
  BKK: { name: 'Suvarnabhumi Airport', city: 'Bangkok', region: 'Asia' },
  CEB: { name: 'Mactan-Cebu International Airport', city: 'Cebu', region: 'Asia' },
  SIN: { name: 'Singapore Changi Airport', city: 'Singapore', region: 'Asia' },
  BKI: { name: 'Kota Kinabalu International Airport', city: 'Kota Kinabalu', region: 'Asia' },
  CXR: { name: 'Cam Ranh International Airport', city: 'Nha Trang', region: 'Asia' },
  HKG: { name: 'Hong Kong International Airport', city: 'Hong Kong', region: 'Asia' },
  SGN: { name: 'Tan Son Nhat International Airport', city: 'Ho Chi Minh', region: 'Asia' },
  TPE: { name: 'Taiwan Taoyuan International Airport', city: 'Taipei', region: 'Asia' },
  CNX: { name: 'Chiang Mai International Airport', city: 'Chiang Mai', region: 'Asia' },
  ULN: { name: 'Chinggis Khaan International Airport', city: 'Ulaanbaatar', region: 'Asia' },
  HAN: { name: 'Noi Bai International Airport', city: 'Hanoi', region: 'Asia' },
  
  // Americas
  LAX: { name: 'Los Angeles International Airport', city: 'Los Angeles', region: 'Americas' },
  JFK: { name: 'John F. Kennedy International Airport', city: 'New York', region: 'Americas' },
  SFO: { name: 'San Francisco International Airport', city: 'San Francisco', region: 'Americas' },
  LAS: { name: 'Harry Reid International Airport', city: 'Las Vegas', region: 'Americas' },
  
  // Europe
  CDG: { name: 'Charles de Gaulle Airport', city: 'Paris', region: 'Europe' },
  LHR: { name: 'Heathrow Airport', city: 'London', region: 'Europe' },
  FCO: { name: 'Leonardo da Vinci International Airport', city: 'Rome', region: 'Europe' },
  BCN: { name: 'Barcelona Airport', city: 'Barcelona', region: 'Europe' },
  FRA: { name: 'Frankfurt Airport', city: 'Frankfurt', region: 'Europe' },
  
  // Pacific
  GUM: { name: 'Antonio B. Won Pat International Airport', city: 'Guam', region: 'Pacific' },
  SPN: { name: 'Saipan International Airport', city: 'Saipan', region: 'Pacific' }
};

// Seoul departure airports
export const SEOUL_AIRPORTS = ['ICN', 'SEL'];

// Destination airports grouped by region
export const DESTINATION_AIRPORTS = {
  Asia: ['NRT', 'HND', 'TYO', 'KIX', 'OSA', 'FUK', 'CTS', 'DAD', 'BKK', 'CEB', 'SIN', 'BKI', 'CXR', 'HKG', 'SGN', 'TPE', 'CNX', 'ULN', 'HAN'],
  Americas: ['LAX', 'JFK', 'SFO', 'LAS'],
  Europe: ['CDG', 'LHR', 'FCO', 'BCN', 'FRA'],
  Pacific: ['GUM', 'SPN']
};

// Long-haul routes (flights longer than 6 hours typically)
export const LONG_HAUL_DESTINATIONS = [
  ...DESTINATION_AIRPORTS.Americas,
  ...DESTINATION_AIRPORTS.Europe,
  'SIN', 'BKI', 'CXR', 'HKG', 'SGN', 'ULN'
];

// Get all destination airports as a flat array
export const ALL_DESTINATIONS = Object.values(DESTINATION_AIRPORTS).flat();

// Helper functions
export function isLongHaulRoute(destinationCode) {
  return LONG_HAUL_DESTINATIONS.includes(destinationCode);
}

export function getRandomSeoulAirport() {
  return SEOUL_AIRPORTS[Math.floor(Math.random() * SEOUL_AIRPORTS.length)];
}

export function getRandomDestination() {
  return ALL_DESTINATIONS[Math.floor(Math.random() * ALL_DESTINATIONS.length)];
}

export function getAirportInfo(code) {
  return AIRPORTS[code] || { name: 'Unknown Airport', city: 'Unknown', region: 'Unknown' };
} 
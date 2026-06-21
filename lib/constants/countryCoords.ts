export const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  US: [37.0902, -95.7129],
  GB: [55.3781, -3.4360],
  CA: [56.1304, -106.3468],
  AU: [-25.2744, 133.7751],
  NZ: [-40.9006, 174.8860],
  IE: [53.4129, -8.2439],
  NG: [9.0820, 8.6753],
  GH: [7.9465, -1.0232],
  KE: [-1.2921, 36.8219],
  ZA: [-30.5595, 22.9375],
  EG: [26.8206, 30.8025],
  MA: [31.7917, -7.0926],
  ET: [9.1450, 40.4897],
  TZ: [-6.3690, 34.8888],
  UG: [1.3733, 32.2903],
  DE: [51.1657, 10.4515],
  FR: [46.2276, 2.2137],
  ES: [40.4637, -3.7492],
  IT: [41.8719, 12.5674],
  PT: [39.3999, -8.2245],
  NL: [52.1326, 5.2913],
  BE: [50.5039, 4.4699],
  CH: [46.8182, 8.2275],
  AT: [47.5162, 14.5501],
  SE: [60.1282, 18.6435],
  NO: [60.4720, 8.4689],
  DK: [56.2639, 9.5018],
  FI: [61.9241, 25.7482],
  PL: [51.9194, 19.1451],
  CZ: [49.8175, 15.4730],
  GR: [39.0742, 21.8243],
  RO: [45.9432, 24.9668],
  HU: [47.1625, 19.5033],
  UA: [48.3794, 31.1656],
  RU: [61.5240, 105.3188],
  TR: [38.9637, 35.2433],
  IL: [31.0461, 34.8516],
  AE: [23.4241, 53.8478],
  SA: [23.8859, 45.0792],
  QA: [25.3548, 51.1839],
  IN: [20.5937, 78.9629],
  PK: [30.3753, 69.3451],
  BD: [23.6850, 90.3563],
  CN: [35.8617, 104.1954],
  JP: [36.2048, 138.2529],
  KR: [35.9078, 127.7669],
  SG: [1.3521, 103.8198],
  MY: [4.2105, 101.9758],
  ID: [-0.7893, 113.9213],
  PH: [12.8797, 121.7740],
  TH: [15.8700, 100.9925],
  VN: [14.0583, 108.2772],
  BR: [-14.2350, -51.9253],
  MX: [23.6345, -102.5528],
  AR: [-38.4161, -63.6167],
  CL: [-35.6751, -71.5430],
  CO: [4.5709, -74.2973],
  PE: [-9.1900, -75.0152],
};

// Generates a slightly jittered coordinate to prevent markers for users
// in the same country from completely overlapping.
export function getJitteredCoordinates(countryCode: string, index: number): [number, number] {
  const coords = COUNTRY_COORDINATES[countryCode.toUpperCase()];
  if (!coords) return [0, 0];

  if (index === 0) return coords;

  // Jitter slightly based on index
  const angle = (index * 137.5) * (Math.PI / 180); // golden angle in radians
  const radius = 0.15 + (index * 0.05); // spiraling out
  const latJitter = Math.sin(angle) * radius;
  const lngJitter = Math.cos(angle) * radius;

  return [coords[0] + latJitter, coords[1] + lngJitter];
}

export interface Coordinates {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistance(a: Coordinates, b: Coordinates): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 50) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

// ─── Malawi Cities Database ───

export interface CityInfo {
  name: string;
  coords: Coordinates;
  population: number;     // estimated
  isUrban: boolean;
  region: string;
}

export const MALAWI_CITIES: CityInfo[] = [
  { name: "Lilongwe", coords: { lat: -13.9626, lng: 33.7741 }, population: 989000, isUrban: true, region: "Central" },
  { name: "Blantyre", coords: { lat: -15.7861, lng: 35.0058 }, population: 800000, isUrban: true, region: "Southern" },
  { name: "Mzuzu", coords: { lat: -11.4656, lng: 34.0207 }, population: 221000, isUrban: false, region: "Northern" },
  { name: "Zomba", coords: { lat: -15.3867, lng: 35.3188 }, population: 101000, isUrban: false, region: "Southern" },
  { name: "Mangochi", coords: { lat: -14.4750, lng: 35.2687 }, population: 51000, isUrban: false, region: "Southern" },
  { name: "Salima", coords: { lat: -13.7794, lng: 34.4580 }, population: 36000, isUrban: false, region: "Central" },
  { name: "Nkhotakota", coords: { lat: -12.9304, lng: 34.2910 }, population: 33000, isUrban: false, region: "Central" },
  { name: "Karonga", coords: { lat: -9.9333, lng: 33.9333 }, population: 42000, isUrban: false, region: "Northern" },
  { name: "Kasungu", coords: { lat: -13.0333, lng: 33.4833 }, population: 58000, isUrban: false, region: "Central" },
  { name: "Nkhata Bay", coords: { lat: -11.6077, lng: 34.2961 }, population: 14000, isUrban: false, region: "Northern" },
];

export const AFRICAN_CITY_COORDS: Record<string, Coordinates> = Object.fromEntries(
  MALAWI_CITIES.map((c) => [c.name, c.coords])
);

export const AFRICAN_CITIES = Object.keys(AFRICAN_CITY_COORDS);

// ─── City Detection ───

export function findNearestCity(lat: number, lng: number): string | null {
  const user: Coordinates = { lat, lng };
  let best: string | null = null;
  let bestDist = Infinity;
  for (const [city, coords] of Object.entries(AFRICAN_CITY_COORDS)) {
    const d = haversineDistance(user, coords);
    if (d < bestDist) {
      bestDist = d;
      best = city;
    }
  }
  return best;
}

// ─── Smart Radius ───

/**
 * Returns a dynamic search radius based on the city's population density.
 * Urban areas (Lilongwe, Blantyre) → 5 km
 * Suburban → 10 km
 * Rural → 25 km
 * Unknown → 15 km fallback
 */
export function getSmartRadius(city: string | null): number {
  if (!city) return 15;
  const info = MALAWI_CITIES.find((c) => c.name.toLowerCase() === city.toLowerCase());
  if (!info) return 15;
  if (info.isUrban) return 5;
  if (info.population > 50000) return 10;
  return 25;
}

/**
 * Returns experiences within the smart radius of a given location.
 */
export function filterByRadius<T extends { coordinates?: Coordinates; location?: string }>(
  items: T[],
  userLocation: Coordinates,
  city: string | null,
): T[] {
  const radius = getSmartRadius(city);
  return items.filter((item) => {
    // If coordinates are available, use precise distance
    if (item.coordinates) {
      const dist = haversineDistance(userLocation, item.coordinates);
      return dist <= radius;
    }
    // Fallback: include all if no coordinates (can't filter)
    return true;
  });
}

/**
 * Sorts items by distance from user location.
 */
export function sortByDistance<T extends { coordinates?: Coordinates; location?: string }>(
  items: T[],
  userLocation: Coordinates,
): T[] {
  return [...items].sort((a, b) => {
    const dA = a.coordinates ? haversineDistance(userLocation, a.coordinates) : Infinity;
    const dB = b.coordinates ? haversineDistance(userLocation, b.coordinates) : Infinity;
    return dA - dB;
  });
}

/**
 * Attaches distance information to each item.
 */
export interface WithDistance {
  distance: number;
  distanceLabel: string;
}

export function attachDistance<T>(
  items: T[],
  getCoordinates: (item: T) => Coordinates | undefined,
  userLocation: Coordinates,
): (T & WithDistance)[] {
  return items.map((item) => {
    const coords = getCoordinates(item);
    if (!coords) return { ...item, distance: Infinity, distanceLabel: "" };
    const d = haversineDistance(userLocation, coords);
    return { ...item, distance: d, distanceLabel: formatDistance(d) };
  });
}

// ─── Location Suggestions ───

export interface LocationSuggestion {
  name: string;
  region: string;
  isUrban: boolean;
  distance?: number;
}

/**
 * Returns location suggestions matching the query string.
 */
export function getLocationSuggestions(query: string): LocationSuggestion[] {
  if (!query.trim() || query.length < 1) return [];
  const q = query.toLowerCase();

  const matches = MALAWI_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q),
  );

  return matches.map((c) => ({
    name: c.name,
    region: c.region,
    isUrban: c.isUrban,
  }));
}

/**
 * Returns popular cities for the homepage "Popular Around You" section.
 */
export function getPopularCities(): CityInfo[] {
  return MALAWI_CITIES.filter((c) => c.isUrban || c.population > 100000);
}

/**
 * Checks if user is walking distance (<1 km) or driving distance to a location.
 */
export function getTravelMode(distKm: number): { mode: "walk" | "drive"; time: string } {
  if (distKm < 1) {
    const min = Math.round(distKm * 12); // ~12 min per km walking
    return { mode: "walk", time: `${min} min walk` };
  }
  const min = Math.round((distKm / 40) * 60); // ~40 km/h average driving speed
  return { mode: "drive", time: `${min} min drive` };
}

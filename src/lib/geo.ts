export interface Coordinates {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

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

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 50) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export const AFRICAN_CITY_COORDS: Record<string, Coordinates> = {
  Lilongwe: { lat: -13.9626, lng: 33.7741 },
  Blantyre: { lat: -15.7861, lng: 35.0058 },
};

export const AFRICAN_CITIES = Object.keys(AFRICAN_CITY_COORDS);

/**
 * Returns the nearest African city name for a given GPS coordinate.
 * Useful for auto-selecting "Lilongwe" or "Blantyre" from the user's location.
 */
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

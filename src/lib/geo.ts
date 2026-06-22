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
  Lusaka: { lat: -15.4167, lng: 28.2833 },
  Harare: { lat: -17.8252, lng: 31.0335 },
  Johannesburg: { lat: -26.2041, lng: 28.0473 },
  "Dar es Salaam": { lat: -6.7924, lng: 39.2083 },
  Nairobi: { lat: -1.2921, lng: 36.8219 },
  "Cape Maclear": { lat: -14.0167, lng: 34.85 },
  Salima: { lat: -13.7833, lng: 34.4333 },
  Mangochi: { lat: -14.4667, lng: 35.2667 },
  Zomba: { lat: -15.3867, lng: 35.3188 },
  Dedza: { lat: -14.3667, lng: 34.3333 },
  Liwonde: { lat: -15.0667, lng: 35.2167 },
};

export const AFRICAN_CITIES = Object.keys(AFRICAN_CITY_COORDS);

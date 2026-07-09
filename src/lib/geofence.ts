"use client";

import { haversineDistance, formatDistance, getTravelMode } from "./geo";
import type { Coordinates } from "./geo";

// â”€â”€â”€ Types â”€â”€â”€

export interface GeofenceZone {
  id: string;
  name: string;
  center: Coordinates;
  radius: number; // meters
  experienceIds: string[];
}

export interface GeofenceResult {
  zone: GeofenceZone;
  distance: number;   // meters from user to zone center
  distanceKm: number;  // km
  distanceLabel: string;
  travelMode: ReturnType<typeof getTravelMode>;
  isInside: boolean;
}

// â”€â”€â”€ Mock Geofence Zones (Malawi) â”€â”€â”€

export const MOCK_GEOFENCE_ZONES: GeofenceZone[] = [
  {
    id: "lilongwe-city-center",
    name: "Lilongwe City Centre",
    center: { lat: -13.9626, lng: 33.7741 },
    radius: 2000,
    experienceIds: ["exp-1", "exp-2", "exp-3", "exp-4"],
  },
  {
    id: "blantyre-city-center",
    name: "Blantyre City Centre",
    center: { lat: -15.7861, lng: 35.0058 },
    radius: 2000,
    experienceIds: ["exp-5", "exp-6", "exp-7"],
  },
  {
    id: "lake-malawi-nkhata",
    name: "Nkhata Bay Â· Lake Malawi",
    center: { lat: -11.6077, lng: 34.2961 },
    radius: 3000,
    experienceIds: ["exp-8", "exp-9"],
  },
  {
    id: "mzuzu-central",
    name: "Mzuzu City",
    center: { lat: -11.4656, lng: 34.0207 },
    radius: 2000,
    experienceIds: ["exp-10"],
  },
  {
    id: "zomba-plateau",
    name: "Zomba Plateau",
    center: { lat: -15.3867, lng: 35.3188 },
    radius: 4000,
    experienceIds: ["exp-11"],
  },
];

// â”€â”€â”€ Geofence Functions â”€â”€â”€

/**
 * Check which geofence zones the user is currently inside or near.
 * Returns zones sorted by distance (nearest first).
 */
export function checkGeofence(
  userLocation: Coordinates,
  zones: GeofenceZone[] = MOCK_GEOFENCE_ZONES,
): GeofenceResult[] {
  const results: GeofenceResult[] = [];

  for (const zone of zones) {
    const distanceKm = haversineDistance(userLocation, zone.center);
    const distanceM = distanceKm * 1000;
    const isInside = distanceM <= zone.radius;

    results.push({
      zone,
      distance: Math.round(distanceM),
      distanceKm,
      distanceLabel: formatDistance(distanceKm),
      travelMode: getTravelMode(distanceKm),
      isInside,
    });
  }

  // Sort: inside first, then by distance
  results.sort((a, b) => {
    if (a.isInside !== b.isInside) return a.isInside ? -1 : 1;
    return a.distance - b.distance;
  });

  return results;
}

/**
 * Get experiences that are inside or very near geofence zones.
 * If the user is inside a zone, recommend experiences in that zone.
 */
export function getNearbyGeofenceExperiences(
  userLocation: Coordinates | null,
  experienceIds: string[],
  zones: GeofenceZone[] = MOCK_GEOFENCE_ZONES,
): { zone: GeofenceZone; matchedIds: string[]; distanceLabel: string }[] {
  if (!userLocation) {
    // No GPS â€” return first zone's experiences as default
    return zones.slice(0, 2).map((z) => ({
      zone: z,
      matchedIds: z.experienceIds.filter((id) => experienceIds.includes(id)),
      distanceLabel: "",
    }));
  }

  const nearby = checkGeofence(userLocation, zones);

  return nearby
    .filter((r) => r.distance <= (r.zone.radius * 3) / 1000) // within 3x zone radius
    .map((r) => ({
      zone: r.zone,
      matchedIds: r.zone.experienceIds.filter((id) => experienceIds.includes(id)),
      distanceLabel: r.distanceLabel,
    }))
    .filter((r) => r.matchedIds.length > 0);
}

/**
 * Get popular experiences in the user's area based on geofence proximity.
 */
export function getPopularInArea(
  userLocation: Coordinates | null,
  allExperienceIds: string[],
): string[] {
  if (!userLocation) return [];

  const nearby = getNearbyGeofenceExperiences(userLocation, allExperienceIds);
  const ids = new Set<string>();
  for (const n of nearby) {
    for (const id of n.matchedIds) {
      ids.add(id);
    }
  }
  return Array.from(ids);
}

/**
 * Get a human-readable prompt like "You're near [Zone Name] â€” only X away!"
 */
export function getGeofencePrompt(results: GeofenceResult[]): string | null {
  const nearestInside = results.find((r) => r.isInside);
  if (nearestInside) {
    return `You're in ${nearestInside.zone.name}! Check out experiences nearby.`;
  }

  const nearest = results[0];
  if (nearest && nearest.distanceKm < 5) {
    return `${nearest.zone.name} is ${nearest.distanceLabel} away â€” explore what's near you!`;
  }

  return null;
}

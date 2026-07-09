"use client";

import { useState, useEffect, useCallback } from "react";

export interface GeoPosition {
  lat: number;
  lng: number;
}

interface GeoState {
  position: GeoPosition | null;
  loading: boolean;
  error: string | null;
  permission: PermissionState | "prompt" | "denied" | "granted" | "unavailable";
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    position: null,
    loading: false,
    error: null,
    permission: "prompt",
  });

  const requestPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser",
        permission: "unavailable",
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          loading: false,
          error: null,
          permission: "granted",
        });
      },
      (err) => {
        let message = "Failed to get location";
        let perm: GeoState["permission"] = "denied";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            message = "Location permission denied. Please enable it in your browser settings.";
            perm = "denied";
            break;
          case err.POSITION_UNAVAILABLE:
            message = "Location information is unavailable right now.";
            perm = "unavailable";
            break;
          case err.TIMEOUT:
            message = "Location request timed out. Please try again.";
            break;
        }
        setState({ position: null, loading: false, error: message, permission: perm });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    // Check initial permission state
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        setState((prev) => ({ ...prev, permission: result.state }));
        if (result.state === "granted") {
          requestPosition();
        }
        result.addEventListener("change", () => {
          setState((prev) => ({ ...prev, permission: result.state }));
        });
      }).catch(() => {
        // permissions.query not supported, stay on prompt
      });
    }
  }, [requestPosition]);

  return { ...state, requestPosition };
}

export function getDistance(a: GeoPosition, b: GeoPosition): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function formatDist(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 50) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

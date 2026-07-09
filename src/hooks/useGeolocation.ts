"use client";

import { useState, useEffect } from "react";
import type { Coordinates } from "@/lib/geo";

interface GeolocationState {
  coords: Coordinates | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ coords: null, error: "Geolocation not supported", loading: false });
      return;
    }

    const onSuccess = (pos: GeolocationPosition) => {
      setState({
        coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        error: null,
        loading: false,
      });
    };

    const onError = (err: GeolocationPositionError) => {
      setState({ coords: null, error: err.message, loading: false });
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
    });
  }, []);

  return state;
}

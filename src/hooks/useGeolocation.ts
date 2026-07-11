import { useState, useEffect } from "preact/hooks";

import { log, logError } from '../lib/logger';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  permissionDenied: boolean;
  error: string | null;
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    loading: true,
    permissionDenied: false,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      logError('geo', 'geolocation not supported');
      setState((s) => ({
        ...s,
        loading: false,
        error: "Geolocation not supported",
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        log('geo', 'location obtained', { lat: position.coords.latitude, lng: position.coords.longitude });
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          loading: false,
          permissionDenied: false,
          error: null,
        });
      },
      (error) => {
        logError('geo', 'location error', error.message);
        setState((s) => ({
          ...s,
          loading: false,
          permissionDenied: error.code === error.PERMISSION_DENIED,
          error: error.message,
        }));
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 min cache
      },
    );
  }, []);

  return state;
}

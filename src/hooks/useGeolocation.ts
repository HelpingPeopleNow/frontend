import { useState, useEffect } from "preact/hooks";

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
      setState((s) => ({
        ...s,
        loading: false,
        error: "Geolocation not supported",
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          loading: false,
          permissionDenied: false,
          error: null,
        });
      },
      (error) => {
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

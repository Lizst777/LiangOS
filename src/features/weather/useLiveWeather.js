import { useCallback, useEffect, useState } from "react";
import { loadWeather } from "./weatherService";

const LOCATION_MAX_AGE_MS = 60_000;
const WEATHER_REFRESH_MS = 10 * 60_000;

function getInitialLocationState() {
  return typeof navigator !== "undefined" && navigator.geolocation
    ? "locating"
    : "unavailable";
}

export function useLiveWeather(onWeatherChange) {
  const [weather, setWeather] = useState(null);
  const [locationState, setLocationState] = useState(getInitialLocationState);
  const [locationRequest, setLocationRequest] = useState(0);

  useEffect(() => {
    let isActive = true;
    let watchId = null;
    let latestRequest = 0;
    let latestPosition = null;
    let pendingPositionKey = null;
    let lastRequestKey = null;
    let lastRequestAt = 0;
    let locationKey = null;
    let locationName = null;
    let hasWeather = false;

    function commitWeather(nextWeather) {
      if (!isActive || !nextWeather) return;
      setWeather(nextWeather);
      onWeatherChange?.(nextWeather);
      hasWeather = true;
    }

    async function refreshWeather(position, { force = false } = {}) {
      if (!isActive) return;

      const { key, latitude, longitude } = position;
      const now = Date.now();
      const hasFreshRequest =
        key === lastRequestKey && now - lastRequestAt < WEATHER_REFRESH_MS;

      if ((!force && hasFreshRequest) || pendingPositionKey === key) return;

      lastRequestKey = key;
      lastRequestAt = now;
      pendingPositionKey = key;

      const requestId = ++latestRequest;
      const knownLocation = key === locationKey ? locationName : null;

      try {
        const nextWeather = await loadWeather(longitude, latitude, knownLocation);

        if (!isActive || requestId !== latestRequest) return;

        if (nextWeather.location) {
          locationKey = key;
          locationName = nextWeather.location;
        }

        setLocationState("ready");
        commitWeather(nextWeather);
      } catch {
        if (!hasWeather && requestId === latestRequest) {
          setLocationState("unavailable");
        }
      } finally {
        if (requestId === latestRequest) pendingPositionKey = null;
      }
    }

    function handlePosition({ coords }) {
      if (!isActive) return;

      const { latitude, longitude } = coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

      latestPosition = {
        key: `${longitude.toFixed(3)},${latitude.toFixed(3)}`,
        latitude,
        longitude,
      };

      if (document.visibilityState === "visible") {
        void refreshWeather(latestPosition);
      }
    }

    function stopLocationWatch() {
      if (watchId === null) return;
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }

    function startLocationWatch() {
      if (!isActive || watchId !== null || document.visibilityState !== "visible") {
        return;
      }

      watchId = navigator.geolocation.watchPosition(
        handlePosition,
        (error) => {
          if (!isActive) return;
          setLocationState(error.code === 1 ? "denied" : "unavailable");
          stopLocationWatch();
        },
        {
          enableHighAccuracy: false,
          maximumAge: LOCATION_MAX_AGE_MS,
          timeout: 12_000,
        },
      );
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        startLocationWatch();
        if (latestPosition) void refreshWeather(latestPosition);
      } else {
        stopLocationWatch();
      }
    }

    if (!navigator.geolocation) {
      return () => {
        isActive = false;
      };
    }

    startLocationWatch();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const refreshTimer = window.setInterval(() => {
      if (document.visibilityState === "visible" && latestPosition) {
        void refreshWeather(latestPosition, { force: true });
      }
    }, WEATHER_REFRESH_MS);

    return () => {
      isActive = false;
      latestRequest += 1;
      stopLocationWatch();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(refreshTimer);
    };
  }, [locationRequest, onWeatherChange]);

  const retryLocation = useCallback(() => {
    setLocationState("locating");
    setLocationRequest((value) => value + 1);
  }, []);

  return { locationState, retryLocation, weather };
}

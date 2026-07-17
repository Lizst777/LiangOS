import { useEffect, useState } from "react";
import { fetchQWeather, getQWeatherLocationName } from "../utils/qweather";

const WEATHER_TEXT = {
  晴: "Sunny",
  多云: "Cloudy",
  少云: "Partly Cloudy",
  晴间多云: "Partly Cloudy",
  阴: "Overcast",
  小雨: "Light Rain",
  中雨: "Rain",
  大雨: "Heavy Rain",
  阵雨: "Showers",
  雷阵雨: "Thunderstorm",
  雾: "Fog",
  霾: "Haze",
  雪: "Snow",
};

const WEATHER_ICON = {
  Sunny: "☀",
  Cloudy: "☁",
  "Partly Cloudy": "☁",
  Overcast: "☁",
  "Light Rain": "☂",
  Rain: "☂",
  "Heavy Rain": "☂",
  Showers: "☂",
  Thunderstorm: "☈",
  Fog: "≋",
  Haze: "≋",
  Snow: "✦",
};

const LOCATION_MAX_AGE_MS = 60_000;
const WEATHER_REFRESH_MS = 10 * 60_000;

function normalizeWeatherText(value) {
  if (!value) return "Cloudy";
  return WEATHER_TEXT[value] || value;
}

async function loadWeather(longitude, latitude, knownLocation = null) {
  const weatherRequest = fetchQWeather(longitude, latitude);
  const locationRequest = knownLocation
    ? Promise.resolve(knownLocation)
    : getQWeatherLocationName(longitude, latitude).catch(() => null);
  const [data, location] = await Promise.all([weatherRequest, locationRequest]);

  return {
    temperature: data.temperature,
    text: normalizeWeatherText(data.weatherText),
    location,
  };
}

function WeatherStatus({ onWeatherChange }) {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    let active = true;
    let watchId = null;
    let latestRequest = 0;
    let latestPosition = null;
    let pendingPositionKey = null;
    let lastRequestKey = null;
    let lastRequestAt = 0;
    let locationKey = null;
    let locationName = null;

    function commitWeather(nextWeather) {
      if (!active || !nextWeather) return;
      setWeather(nextWeather);
      onWeatherChange?.(nextWeather);
    }

    async function refreshWeather(position, { force = false } = {}) {
      if (!active) return;

      const { latitude, longitude, key } = position;
      const now = Date.now();
      const hasFreshRequest =
        key === lastRequestKey && now - lastRequestAt < WEATHER_REFRESH_MS;

      if ((!force && hasFreshRequest) || pendingPositionKey === key) return;

      lastRequestKey = key;
      lastRequestAt = now;
      pendingPositionKey = key;
      const request = ++latestRequest;
      const knownLocation = key === locationKey ? locationName : null;

      try {
        const nextWeather = await loadWeather(
          longitude,
          latitude,
          knownLocation,
        );

        if (!active || request !== latestRequest) return;
        if (nextWeather.location) {
          locationKey = key;
          locationName = nextWeather.location;
        }
        commitWeather(nextWeather);
      } catch {
        // Keep the last valid weather during temporary location or API failures.
      } finally {
        if (request === latestRequest) pendingPositionKey = null;
      }
    }

    function handlePosition({ coords }) {
      if (!active) return;

      const { latitude, longitude } = coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

      latestPosition = {
        latitude,
        longitude,
        key: `${longitude.toFixed(3)},${latitude.toFixed(3)}`,
      };

      if (document.visibilityState === "visible") {
        void refreshWeather(latestPosition);
      }
    }

    function startLocationWatch() {
      if (
        !active ||
        watchId !== null ||
        document.visibilityState !== "visible"
      ) {
        return;
      }

      watchId = navigator.geolocation.watchPosition(handlePosition, () => {}, {
        enableHighAccuracy: false,
        maximumAge: LOCATION_MAX_AGE_MS,
      });
    }

    function stopLocationWatch() {
      if (watchId === null) return;
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        startLocationWatch();
        if (latestPosition) void refreshWeather(latestPosition);
        return;
      }

      stopLocationWatch();
    }

    if (!navigator.geolocation) {
      return () => {
        active = false;
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
      active = false;
      latestRequest += 1;
      stopLocationWatch();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(refreshTimer);
    };
  }, [onWeatherChange]);

  if (!weather) return null;

  return (
    <div className="weather-status" aria-label="Weather">
      <div className="weather-status__inner">
        <span className="weather-status__icon" aria-hidden>
          {WEATHER_ICON[weather.text] || "☁"}
        </span>
        <div className="weather-status__copy">
          <strong>{weather.temperature}°C</strong>
          <span>{weather.text}</span>
          {weather.location ? <span lang="zh-CN">{weather.location}</span> : null}
        </div>
      </div>
    </div>
  );
}

export default WeatherStatus;

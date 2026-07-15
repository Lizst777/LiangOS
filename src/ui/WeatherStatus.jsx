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

function normalizeWeatherText(value) {
  if (!value) return "Cloudy";
  return WEATHER_TEXT[value] || value;
}

function normalizeLocationName(value) {
  if (!value) return "Rizhao, Shandong";

  if (
    value.includes("日照") ||
    value.includes("东港") ||
    value.toLowerCase().includes("rizhao")
  ) {
    return "Rizhao, Shandong";
  }

  if (value.includes("东京") || value.toLowerCase().includes("tokyo")) {
    return "Tokyo, Japan";
  }

  return value;
}

const DEFAULT_LOCATION = {
  latitude: 35.42,
  longitude: 119.46,
  name: "Rizhao, Shandong",
};

let cachedWeather = null;
let defaultWeatherPromise = null;
let preciseWeatherPromise = null;

async function loadWeather(
  longitude,
  latitude,
  fallbackLocation,
  { resolveLocation = true } = {},
) {
  const weatherRequest = fetchQWeather(longitude, latitude);
  const locationRequest = resolveLocation
    ? getQWeatherLocationName(longitude, latitude).catch(() => fallbackLocation)
    : Promise.resolve(fallbackLocation);
  const [data, location] = await Promise.all([weatherRequest, locationRequest]);

  return {
    temperature: data.temperature,
    text: normalizeWeatherText(data.weatherText),
    location: normalizeLocationName(location || fallbackLocation),
  };
}

function getDefaultWeather() {
  if (!defaultWeatherPromise) {
    defaultWeatherPromise = loadWeather(
      DEFAULT_LOCATION.longitude,
      DEFAULT_LOCATION.latitude,
      DEFAULT_LOCATION.name,
      { resolveLocation: false },
    ).catch(() => null);
  }

  return defaultWeatherPromise;
}

function getPreciseWeather() {
  if (!navigator.geolocation) return Promise.resolve(null);

  if (!preciseWeatherPromise) {
    preciseWeatherPromise = new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        maximumAge: 30 * 60 * 1000,
        timeout: 6000,
      });
    })
      .then(({ coords }) =>
        loadWeather(coords.longitude, coords.latitude, DEFAULT_LOCATION.name),
      )
      .catch(() => null);
  }

  return preciseWeatherPromise;
}

function WeatherStatus({ onWeatherChange }) {
  const [weather, setWeather] = useState(cachedWeather);

  useEffect(() => {
    let active = true;

    function commitWeather(nextWeather) {
      if (!active || !nextWeather) return;
      cachedWeather = nextWeather;
      setWeather(nextWeather);
      onWeatherChange?.(nextWeather);
    }

    async function load() {
      if (cachedWeather) commitWeather(cachedWeather);

      const preciseWeatherRequest = getPreciseWeather();
      await getDefaultWeather().then(commitWeather);
      const preciseWeather = await preciseWeatherRequest;
      commitWeather(preciseWeather);
    }

    load();

    return () => {
      active = false;
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
          <span>{weather.location}</span>
        </div>
      </div>
    </div>
  );
}

export default WeatherStatus;

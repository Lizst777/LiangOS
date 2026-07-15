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

async function loadWeather(longitude, latitude) {
  const weatherRequest = fetchQWeather(longitude, latitude);
  const locationRequest = getQWeatherLocationName(longitude, latitude).catch(
    () => null,
  );
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
    let latestRequest = 0;
    let lastPositionKey = null;

    function commitWeather(nextWeather) {
      if (!active || !nextWeather) return;
      setWeather(nextWeather);
      onWeatherChange?.(nextWeather);
    }

    if (!navigator.geolocation) {
      return () => {
        active = false;
      };
    }

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

        const positionKey = `${longitude.toFixed(3)},${latitude.toFixed(3)}`;
        if (positionKey === lastPositionKey) return;
        lastPositionKey = positionKey;

        const request = ++latestRequest;
        loadWeather(longitude, latitude)
          .then((nextWeather) => {
            if (request === latestRequest) commitWeather(nextWeather);
          })
          .catch(() => {
            if (!active || request !== latestRequest) return;
            setWeather(null);
            onWeatherChange?.(null);
          });
      },
      () => {},
      {
        enableHighAccuracy: false,
        maximumAge: 0,
      },
    );

    return () => {
      active = false;
      navigator.geolocation.clearWatch(watchId);
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
          {weather.location ? <span>{weather.location}</span> : null}
        </div>
      </div>
    </div>
  );
}

export default WeatherStatus;

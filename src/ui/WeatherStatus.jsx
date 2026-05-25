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
  Snow: "✳",
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

function WeatherStatus() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });

        const { latitude, longitude } = position.coords;
        const data = await fetchQWeather(longitude, latitude);
        const name = await getQWeatherLocationName(longitude, latitude);

        setWeather({
          temperature: data.temperature,
          text: normalizeWeatherText(data.weatherText),
          location: normalizeLocationName(name),
        });
      } catch {
        try {
          const data = await fetchQWeather(119.46, 35.42);
          setWeather({
            temperature: data.temperature,
            text: normalizeWeatherText(data.weatherText),
            location: "Rizhao, Shandong",
          });
        } catch {
          setWeather(null);
        }
      }
    }

    load();
  }, []);

  if (!weather) return null;

  return (
    <div className="weather-status" aria-label="Weather">
      <span className="weather-status__icon" aria-hidden>
        {WEATHER_ICON[weather.text] || "☁"}
      </span>
      <div className="weather-status__copy">
        <strong>{weather.temperature}°C</strong>
        <span>{weather.text}</span>
        <span>{weather.location}</span>
      </div>
    </div>
  );
}

export default WeatherStatus;

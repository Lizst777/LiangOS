import { fetchCurrentWeather, fetchLocationName } from "./qweatherClient";

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

export const WEATHER_ICON = {
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
  return WEATHER_TEXT[value] ?? value;
}

export async function loadWeather(longitude, latitude, knownLocation = null) {
  const weatherRequest = fetchCurrentWeather(longitude, latitude);
  const locationRequest = knownLocation
    ? Promise.resolve(knownLocation)
    : fetchLocationName(longitude, latitude).catch(() => null);
  const [data, location] = await Promise.all([weatherRequest, locationRequest]);

  return {
    location,
    temperature: data.temperature,
    text: normalizeWeatherText(data.weatherText),
  };
}

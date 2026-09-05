const API_KEY = import.meta.env.VITE_QWEATHER_KEY;
const WEATHER_HOST =
  import.meta.env.VITE_QWEATHER_HOST || "https://devapi.qweather.com";
const GEO_HOST = import.meta.env.VITE_QWEATHER_GEO_HOST;
const SUCCESS_CODE = "200";

function requireApiKey() {
  if (!API_KEY) {
    throw new Error("Missing VITE_QWEATHER_KEY environment variable.");
  }
}

function createApiError(message, response, body) {
  const error = new Error(message);
  error.status = response.status;
  error.body = body;
  return error;
}

async function fetchJson(url) {
  const response = await fetch(url);
  const text = await response.text();

  try {
    return { body: JSON.parse(text), response };
  } catch {
    return { body: text, response };
  }
}

function getLocationName(location) {
  if (!location || typeof location !== "object") return null;
  return location.name?.trim() || null;
}

export async function fetchCurrentWeather(longitude, latitude) {
  requireApiKey();

  const url = `${WEATHER_HOST}/v7/weather/now?location=${longitude},${latitude}&key=${API_KEY}`;
  const { body, response } = await fetchJson(url);

  if (!response.ok || !body || body.code !== SUCCESS_CODE || !body.now) {
    const message =
      response.status === 403
        ? "QWeather request failed (403)."
        : body?.code || `HTTP ${response.status}`;
    throw createApiError(message, response, body);
  }

  return {
    feelsLike: body.now.feelsLike,
    humidity: body.now.humidity,
    observationTime: body.now.obsTime,
    temperature: body.now.temp,
    updateTime: body.updateTime || null,
    weatherText: body.now.text,
    windDirection: body.now.windDir,
    windScale: body.now.windScale,
  };
}

export async function fetchLocationName(longitude, latitude) {
  requireApiKey();

  const hosts = [
    ...new Set([GEO_HOST, "https://geoapi.qweather.com", WEATHER_HOST].filter(Boolean)),
  ];

  for (const host of hosts) {
    const url = `${host}/geo/v2/city/lookup?location=${longitude},${latitude}&key=${API_KEY}&lang=zh`;

    let result;
    try {
      result = await fetchJson(url);
    } catch {
      continue;
    }

    const { body, response } = result;
    if (response.status === 404) continue;

    if (
      response.ok &&
      body?.code === SUCCESS_CODE &&
      Array.isArray(body.location) &&
      body.location[0]
    ) {
      return getLocationName(body.location[0]);
    }
  }

  return null;
}

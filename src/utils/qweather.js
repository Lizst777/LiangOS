const QWEATHER_KEY = import.meta.env.VITE_QWEATHER_KEY;
const QWEATHER_HOST = import.meta.env.VITE_QWEATHER_HOST || "https://devapi.qweather.com";
const QWEATHER_GEO_HOST = import.meta.env.VITE_QWEATHER_GEO_HOST;

function ensureKey() {
  if (!QWEATHER_KEY) {
    throw new Error("Missing VITE_QWEATHER_KEY environment variable.");
  }
}

function formatLocationName(location) {
  if (!location || typeof location !== "object") return null;

  const name = location.name?.trim();
  return name || null;
}

async function fetchJsonResponse(url) {
  const res = await fetch(url);

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { res, data };
}

/**
 * 获取和风实时天气
 * location 顺序：经度,纬度
 */
export async function fetchQWeather(longitude, latitude) {
  ensureKey();

  const url = `${QWEATHER_HOST}/v7/weather/now?location=${longitude},${latitude}&key=${QWEATHER_KEY}`;
  const { res, data } = await fetchJsonResponse(url);

  if (res.status === 403) {
    const err = new Error("QWeather request failed (403).");
    err.status = 403;
    err.body = data;
    throw err;
  }

  if (!res.ok || !data || data.code !== '200' || !data.now) {
    const err = new Error((data && data.code) || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }

  const now = data.now;

  return {
    weatherText: now.text,
    temperature: now.temp,
    feelsLike: now.feelsLike,
    humidity: now.humidity,
    windDir: now.windDir,
    windScale: now.windScale,
    obsTime: now.obsTime,
    updateTime: data.updateTime || null,
  };
}

export async function getQWeatherLocationName(longitude, latitude) {
  ensureKey();

  const geoHosts = [
    QWEATHER_GEO_HOST,
    "https://geoapi.qweather.com",
    QWEATHER_HOST,
  ].filter(Boolean);

  for (const host of geoHosts) {
    const url = `${host}/geo/v2/city/lookup?location=${longitude},${latitude}&key=${QWEATHER_KEY}&lang=zh`;

    let res;
    let data;
    try {
      ({ res, data } = await fetchJsonResponse(url));
    } catch {
      continue;
    }

    if (res.status === 404) {
      continue;
    }

    if (res.ok && data && data.code === '200' && Array.isArray(data.location) && data.location[0]) {
      return formatLocationName(data.location[0]);
    }

  }

  return null;
}

export default fetchQWeather;

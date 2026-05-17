const QWEATHER_KEY = import.meta.env.VITE_QWEATHER_KEY;
const QWEATHER_HOST = import.meta.env.VITE_QWEATHER_HOST || "https://devapi.qweather.com";
const QWEATHER_GEO_HOST = import.meta.env.VITE_QWEATHER_GEO_HOST;

function ensureKey() {
  if (!QWEATHER_KEY) {
    throw new Error("Missing VITE_QWEATHER_KEY environment variable.");
  }
}

function appendCitySuffix(value) {
  if (!value || typeof value !== 'string') return value;
  if (/[市区县]$/.test(value)) return value;
  return `${value}市`;
}

function shouldAddCitySuffix(adm2, name) {
  if (!adm2 || !name) return false;
  if (adm2 === name) return false;
  if (/[市区县]$/.test(adm2)) return false;
  return !/[市区县]$/.test(name);
}

function formatLocationName(location) {
  if (!location || typeof location !== 'object') return null;

  const { adm1, adm2, name } = location;
  if (!name) return null;

  const regionName = name;
  const cityName = adm2 || adm1;

  if (!cityName) {
    return regionName;
  }

  if (cityName === regionName) {
    return regionName;
  }

  const normalizedCity = shouldAddCitySuffix(cityName, regionName)
    ? appendCitySuffix(cityName)
    : cityName;

  return `${normalizedCity} · ${regionName}`;
}

async function fetchJsonResponse(url) {
  let res;
  try {
    res = await fetch(url);
  } catch (networkErr) {
    console.error("QWeather fetch network error:", networkErr);
    throw networkErr;
  }

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { res, data, url };
}

/**
 * 获取和风实时天气
 * location 顺序：经度,纬度
 */
export async function fetchQWeather(longitude, latitude) {
  ensureKey();

  const url = `${QWEATHER_HOST}/v7/weather/now?location=${longitude},${latitude}&key=${QWEATHER_KEY}`;
  const { res, data } = await fetchJsonResponse(url);

  // 打印完整返回，便于浏览器控制台查看
  console.log("QWeather response:", data);

  if (res.status === 403) {
    console.error("QWeather request URL:", url);
    console.error("QWeather response.status:", res.status);
    console.error("QWeather response body:", data);
    console.error("提示：可能是 API Host 错误、Key 权限限制、订阅未启用或安全限制");
    const err = new Error('403');
    err.status = 403;
    err.body = data;
    throw err;
  }

  if (!res.ok || !data || data.code !== '200' || !data.now) {
    console.error("QWeather error:", data && data.code, data);
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
    console.log("QWeather Geo try:", url.replace(QWEATHER_KEY, "***"));

    let res;
    let data;
    try {
      ({ res, data } = await fetchJsonResponse(url));
    } catch (fetchErr) {
      console.error("QWeather Geo error:", {
        status: fetchErr?.status || 'fetch-error',
        code: fetchErr?.body?.code,
        body: fetchErr,
      });
      continue;
    }

    console.log("QWeather Geo status:", res.status);
    console.log("QWeather Geo body:", data);

    if (res.status === 404) {
      continue;
    }

    if (res.ok && data && data.code === '200' && Array.isArray(data.location) && data.location[0]) {
      return formatLocationName(data.location[0]) || '未知地区';
    }

    console.error("QWeather Geo error:", {
      status: res.status,
      code: data?.code,
      body: data,
    });
  }

  return '未知地区';
}

export default fetchQWeather;

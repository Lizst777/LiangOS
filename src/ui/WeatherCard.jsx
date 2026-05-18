import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { motionTransition } from "../utils/motion";
import { fetchQWeather, getQWeatherLocationName } from "../utils/qweather";

function formatTimeLabel(value, suffix) {
  if (!value) return "--";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "--";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes} ${suffix}`;
}

function WeatherCard() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDefault, setIsDefault] = useState(false);
  const [localRefreshedAt, setLocalRefreshedAt] = useState(null);
  const [locationName, setLocationName] = useState("未知地区");

  useEffect(() => {
    async function loadWeather() {
      setLoading(true);
      setError(null);
      setIsDefault(false);

      async function loadByCoords(lat, lon) {
        const data = await fetchQWeather(lon, lat);
        setWeather(data);
        setLocalRefreshedAt(new Date());

        try {
          const name = await getQWeatherLocationName(lon, lat);
          setLocationName(name || "未知地区");
        } catch (lookupErr) {
          console.error("Location lookup failed:", lookupErr);
          const code = lookupErr?.body?.code || lookupErr?.status || "error";
          setLocationName(`未知地区(${code})`);
        }
      }

      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
          });
        });

        const { latitude, longitude } = position.coords;
        await loadByCoords(latitude, longitude);
      } catch {
        try {
          await loadByCoords(35.6895, 139.6917);
          setIsDefault(true);
          setLocationName("东京");
        } catch (fallbackErr) {
          console.error("Weather fallback error:", fallbackErr);
          const statusCode = fallbackErr?.status || "unknown";
          const code = fallbackErr?.body?.code || "none";
          setError(`天气暂不可用：HTTP ${statusCode} / code ${code}`);
        }
      } finally {
        setLoading(false);
      }
    }

    loadWeather();
  }, []);

  if (loading) {
    return (
      <motion.section
        className="ui-surface ui-card weather-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={motionTransition}
      >
        <div className="weather-card__loading">加载中...</div>
      </motion.section>
    );
  }

  if (error) {
    return (
      <motion.section
        className="ui-surface ui-card weather-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={motionTransition}
      >
        <div className="weather-card__error">{error}</div>
      </motion.section>
    );
  }

  if (!weather) return null;

  const observedAt = formatTimeLabel(weather.obsTime, "更新");
  const refreshedAt = formatTimeLabel(localRefreshedAt, "刷新");

  return (
    <motion.section
      className="ui-surface ui-card weather-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -1 }}
      transition={motionTransition}
    >
      <div className="weather-card__header">
        <div>
          <h3 className="weather-card__title">天气</h3>
          <p className="weather-card__location">{locationName}</p>
          {isDefault && <p className="weather-card__note">默认城市：东京</p>}
        </div>
      </div>

      <div className="weather-card__current">
        <div className="weather-card__main-left">
          <span className="weather-card__temp">{weather.temperature}°</span>
          <div className="weather-card__description">{weather.weatherText}</div>
        </div>

        <div className="weather-card__main-right">
          <div className="weather-card__feels">体感 {weather.feelsLike}°</div>
          <div className="weather-card__humidity">湿度 {weather.humidity}%</div>
        </div>
      </div>

      <div className="weather-card__grid">
        <div className="weather-card__item">
          <span className="weather-card__label">风向</span>
          <span className="weather-card__value">{weather.windDir}</span>
        </div>
        <div className="weather-card__item">
          <span className="weather-card__label">风力</span>
          <span className="weather-card__value">{weather.windScale} 级</span>
        </div>
        <div className="weather-card__item">
          <span className="weather-card__label">观测时间</span>
          <span className="weather-card__value weather-card__value--muted">
            {observedAt}
          </span>
        </div>
        <div className="weather-card__item">
          <span className="weather-card__label">本地刷新</span>
          <span className="weather-card__value weather-card__value--muted">
            {refreshedAt}
          </span>
        </div>
      </div>

      <div className="weather-card__footer">数据来自和风天气</div>
    </motion.section>
  );
}

export default WeatherCard;

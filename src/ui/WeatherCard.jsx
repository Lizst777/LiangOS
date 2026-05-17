import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { motionTransition } from "../utils/motion";
import { fetchQWeather, getQWeatherLocationName } from "../utils/qweather";

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
      } catch (err) {
        try {
          await loadByCoords(35.6895, 139.6917); // 东京（lon,lat）
          setIsDefault(true);
          setLocationName("东京");
        } catch (fallbackErr) {
          console.error("Weather fallback error:", fallbackErr);
          setError("天气暂不可用");
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
          {isDefault && (
            <p className="weather-card__note">默认城市：东京</p>
          )}
        </div>
        <div className="weather-card__updated">&nbsp;</div>
      </div>

      <div className="weather-card__current">
        <div className="weather-card__main-left">
          <div>
            <span className="weather-card__temp">{weather.temperature}°</span>
            <div className="weather-card__description">{weather.weatherText}</div>
          </div>
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
          <span className="weather-card__value">{weather.obsTime}</span>
        </div>
        <div className="weather-card__item">
          <span className="weather-card__label">本地刷新</span>
          <span className="weather-card__value">{localRefreshedAt?.toLocaleString()}</span>
        </div>
      </div>

      <div className="weather-card__footer">数据来自和风天气</div>
    </motion.section>
  );
}

export default WeatherCard;

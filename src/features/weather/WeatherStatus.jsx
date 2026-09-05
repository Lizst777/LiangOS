import { useLiveWeather } from "./useLiveWeather";
import { WEATHER_ICON } from "./weatherService";

function LocationPermission({ onRetry }) {
  return (
    <div className="weather-status weather-status--permission" aria-live="polite">
      <button className="weather-status__permission" type="button" onClick={onRetry}>
        定位未开启
      </button>
    </div>
  );
}

function WeatherStatus({ onWeatherChange }) {
  const { locationState, retryLocation, weather } = useLiveWeather(onWeatherChange);

  if (!weather) {
    return locationState === "locating" ? null : (
      <LocationPermission onRetry={retryLocation} />
    );
  }

  return (
    <div className="weather-status" aria-label="Weather">
      <div className="weather-status__inner">
        <span className="weather-status__icon" aria-hidden>
          {WEATHER_ICON[weather.text] ?? "☁"}
        </span>
        <div className="weather-status__copy">
          <strong>{weather.temperature}°C</strong>
          <span>{weather.text}</span>
          {weather.location && <span lang="zh-CN">{weather.location}</span>}
        </div>
      </div>
    </div>
  );
}

export default WeatherStatus;

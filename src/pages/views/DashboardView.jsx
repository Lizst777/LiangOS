import { useEffect, useState } from "react";
import TimeDisplay from "../../ui/TimeDisplay";
import WeatherStatus from "../../ui/WeatherStatus";
import { getDaypart } from "../../utils/daypart";

const SOFT_WEATHER = /rain|fog|haze|overcast|snow|shower|thunder/i;

function DashboardView({ onOpenNotes }) {
  const [weather, setWeather] = useState(null);
  const [daypart, setDaypart] = useState(() => getDaypart());

  useEffect(() => {
    const timer = window.setInterval(() => setDaypart(getDaypart()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const workspaceClass = [
    "workspace",
    `workspace--${daypart}`,
    SOFT_WEATHER.test(weather?.text ?? "") ? "workspace--weather-soft" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className={workspaceClass} aria-label="Overview">
      <div className="workspace__background" aria-hidden />
      <WeatherStatus onWeatherChange={setWeather} />
      <TimeDisplay
        weather={weather}
        daypart={daypart}
        onOpenNotes={onOpenNotes}
      />
    </main>
  );
}

export default DashboardView;

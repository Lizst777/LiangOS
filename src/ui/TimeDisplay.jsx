import { useEffect, useState } from "react";
import MomentText from "./MomentText";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
});

function TimeDisplay({ weather, daypart }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    let timer;

    function updateAtMinuteBoundary() {
      const now = new Date();
      setTime(now);
      const elapsedInMinute = now.getSeconds() * 1000 + now.getMilliseconds();
      timer = window.setTimeout(updateAtMinuteBoundary, 60_050 - elapsedInMinute);
    }

    const now = new Date();
    const elapsedInMinute = now.getSeconds() * 1000 + now.getMilliseconds();
    timer = window.setTimeout(updateAtMinuteBoundary, 60_050 - elapsedInMinute);

    return () => window.clearTimeout(timer);
  }, []);

  const hours = String(time.getHours()).padStart(2, "0");
  const minutes = String(time.getMinutes()).padStart(2, "0");
  const date = `${dateFormatter.format(time)} · ${weekdayFormatter.format(time)}`;

  return (
    <div className="time-display">
      <time className="time-display__clock" dateTime={`${hours}:${minutes}`}>
        <span className="time-display__hours">{hours}</span>
        <span className="time-display__colon" aria-hidden>
          :
        </span>
        <span className="time-display__minutes">{minutes}</span>
      </time>
      <div className="time-display__date">{date}</div>
      <MomentText weather={weather} daypart={daypart} />
    </div>
  );
}

export default TimeDisplay;

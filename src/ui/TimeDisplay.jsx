import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { fadeInUp, prefersReducedMotion } from "../utils/gsapMotion";

gsap.registerPlugin(useGSAP);

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
});

function TimeDisplay() {
  const [time, setTime] = useState(new Date());
  const rootRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useGSAP(
    () => {
      const clockParts = [
        ".time-display__hours",
        ".time-display__colon",
        ".time-display__minutes",
      ];

      if (prefersReducedMotion()) {
        fadeInUp([...clockParts, ".time-display__date"]);
        return;
      }

      gsap
        .timeline()
        .add(fadeInUp(clockParts, { y: 10, stagger: 0.035 }))
        .add(fadeInUp(".time-display__date", { y: 6 }), "-=0.18");
    },
    { scope: rootRef },
  );

  const hours = String(time.getHours()).padStart(2, "0");
  const minutes = String(time.getMinutes()).padStart(2, "0");
  const date = `${dateFormatter.format(time)} · ${weekdayFormatter.format(time)}`;

  return (
    <div className="time-display" ref={rootRef}>
      <time className="time-display__clock" dateTime={`${hours}:${minutes}`}>
        <span className="time-display__hours">{hours}</span>
        <span className="time-display__colon" aria-hidden>
          :
        </span>
        <span className="time-display__minutes">{minutes}</span>
      </time>
      <div className="time-display__date">{date}</div>
    </div>
  );
}

export default TimeDisplay;

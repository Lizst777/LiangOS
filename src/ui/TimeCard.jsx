import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { motionTransition } from "../utils/motion";

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const MONTHS = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];

function TimeCard() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = String(time.getHours()).padStart(2, "0");
  const minutes = String(time.getMinutes()).padStart(2, "0");
  const seconds = String(time.getSeconds()).padStart(2, "0");
  const date = time.getDate();
  const month = MONTHS[time.getMonth()];
  const weekday = WEEKDAYS[time.getDay()];

  return (
    <motion.section
      className="ui-surface ui-card time-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -1 }}
      transition={motionTransition}
    >
      <div className="time-card__time">
        <span className="time-card__hours">{hours}</span>
        <span className="time-card__separator">:</span>
        <span className="time-card__minutes">{minutes}</span>
        <span className="time-card__separator">:</span>
        <span className="time-card__seconds">{seconds}</span>
      </div>

      <div className="time-card__date">
        <span className="time-card__month-day">
          {month} {date}
        </span>
        <span className="time-card__weekday">{weekday}</span>
      </div>
    </motion.section>
  );
}

export default TimeCard;

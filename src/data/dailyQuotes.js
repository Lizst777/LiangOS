import DAILY_QUOTES from "./dailyQuotes.generated.json" with { type: "json" };

const DAY_MS = 24 * 60 * 60 * 1000;
const QUOTE_EPOCH_UTC = Date.UTC(2026, 6, 17);

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDailyQuote(date = new Date()) {
  const dayNumber = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS,
  );
  const epochDayNumber = Math.floor(QUOTE_EPOCH_UTC / DAY_MS);
  const quoteIndex =
    (((dayNumber - epochDayNumber) % DAILY_QUOTES.length) + DAILY_QUOTES.length) %
    DAILY_QUOTES.length;
  const quote = DAILY_QUOTES[quoteIndex];

  return {
    ...quote,
    dateKey: getLocalDateKey(date),
  };
}

export function getMillisecondsUntilTomorrow(date = new Date()) {
  const tomorrow = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return Math.max(1000, tomorrow.getTime() - date.getTime() + 100);
}

export { DAILY_QUOTES };

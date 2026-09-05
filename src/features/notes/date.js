const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
});

function getDateFromKey(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function formatEntryDate(value) {
  const date = getDateFromKey(value);
  return `${dateFormatter.format(date)} · ${weekdayFormatter.format(date)}`;
}

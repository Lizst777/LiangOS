export function getDaypart(date = new Date()) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 10) return "morning";
  if (hour >= 10 && hour < 17) return "day";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

export function isCurrentTimelineItem(item, currentEntry) {
  return (
    item.kind !== "moment" &&
    currentEntry.entryDate === item.entry_date &&
    (item.kind === "entry" || currentEntry.content === item.content)
  );
}

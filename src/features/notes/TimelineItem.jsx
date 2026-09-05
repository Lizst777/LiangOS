import { isCurrentTimelineItem } from "./timeline";

const entryDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const versionDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  month: "long",
  year: "numeric",
});

function getDateFromKey(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function getPreview(content) {
  const compact = content.trim();
  if (!compact) return "Blank";
  return compact.length > 320 ? `…${compact.slice(-320)}` : compact;
}

function getActionLabel({ errorId, isCurrent, isPending, item }) {
  if (isCurrent) return "Current";

  const isEntry = item.kind === "entry";
  if (isPending) return isEntry ? "Opening" : "Restoring";
  if (errorId === item.key) return isEntry ? "Not opened" : "Not restored";
  return isEntry ? "Open" : "Restore";
}

function TimelineItem({ currentEntry, errorId, item, onSelect, pendingId }) {
  const isCurrent = isCurrentTimelineItem(item, currentEntry);
  const isPending = pendingId === item.key;
  const actionLabel = getActionLabel({
    errorId,
    isCurrent,
    isPending,
    item,
  });
  const isEntry = item.kind === "entry";

  return (
    <article className="note-version">
      <time dateTime={isEntry ? item.entry_date : item.created_at}>
        {isEntry
          ? entryDateFormatter.format(getDateFromKey(item.entry_date))
          : `${item.kind === "moment" ? "Moment" : "Version"} · ${versionDateFormatter.format(new Date(item.created_at))}`}
      </time>
      <p>{getPreview(item.content)}</p>

      {item.kind !== "moment" && (
        <button
          type="button"
          onClick={() => void onSelect(item)}
          disabled={pendingId !== null || isCurrent}
          aria-live="polite"
        >
          {actionLabel}
        </button>
      )}
    </article>
  );
}

export default TimelineItem;

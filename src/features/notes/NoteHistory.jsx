import { useEffect, useState } from "react";
import PrivateDialog from "../../components/layout/PrivateDialog";
import { useOwnerSession } from "../../hooks/useOwnerSession";
import TimelineItem from "./TimelineItem";
import { isCurrentTimelineItem } from "./timeline";
import { loadTimeline } from "./timelineRepository";

const EMPTY_MESSAGES = {
  error: "Timeline is unavailable.",
  loading: "Loading.",
  ready: "No earlier entries yet.",
};

function NoteHistory({
  currentEntry,
  isOpen,
  onClose,
  onOpenEntry,
  onRestore,
  userId,
}) {
  const { client } = useOwnerSession();
  const [items, setItems] = useState([]);
  const [loadState, setLoadState] = useState("idle");
  const [pendingId, setPendingId] = useState(null);
  const [errorId, setErrorId] = useState(null);

  useEffect(() => {
    if (!isOpen || !client || !userId) return undefined;

    let isActive = true;

    async function loadHistory() {
      setLoadState("loading");
      setErrorId(null);

      const { data, error } = await loadTimeline(client, userId);
      if (!isActive) return;

      if (error) {
        setLoadState("error");
        return;
      }

      setItems(data);
      setLoadState("ready");
    }

    void loadHistory();

    return () => {
      isActive = false;
    };
  }, [client, isOpen, userId]);

  async function selectItem(item) {
    if (pendingId !== null) return;

    if (isCurrentTimelineItem(item, currentEntry)) {
      onClose();
      return;
    }

    setPendingId(item.key);
    setErrorId(null);

    try {
      const result =
        item.kind === "entry"
          ? await onOpenEntry(item.entry_date)
          : await onRestore(item);

      if (result?.error) {
        setErrorId(item.key);
        return;
      }

      onClose();
    } catch {
      setErrorId(item.key);
    } finally {
      setPendingId(null);
    }
  }

  const showEmptyMessage =
    loadState === "error" ||
    (loadState === "loading" && items.length === 0) ||
    (loadState === "ready" && items.length === 0);

  return (
    <PrivateDialog
      className="note-history"
      title="Timeline"
      closeLabel="Close timeline"
      isOpen={isOpen}
      onClose={onClose}
      closeDisabled={pendingId !== null}
    >
      <div className="note-history__list">
        {showEmptyMessage && (
          <p className="note-history__empty">{EMPTY_MESSAGES[loadState]}</p>
        )}

        {items.map((item) => (
          <TimelineItem
            currentEntry={currentEntry}
            errorId={errorId}
            item={item}
            key={item.key}
            onSelect={selectItem}
            pendingId={pendingId}
          />
        ))}
      </div>
    </PrivateDialog>
  );
}

export default NoteHistory;

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import { useOwnerSession } from "../../hooks/useOwnerSession";
import { IconClose } from "../../ui/Icons";
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
  const dialogRef = useRef(null);

  useDialogFocus(isOpen, dialogRef);

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

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event) {
      if (event.key === "Escape" && pendingId === null) onClose();
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, onClose, pendingId]);

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

  if (typeof document === "undefined") return null;

  const showEmptyMessage =
    loadState === "error" ||
    (loadState === "loading" && items.length === 0) ||
    (loadState === "ready" && items.length === 0);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.section
          className="note-history"
          role="dialog"
          aria-modal="true"
          aria-labelledby="note-history-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="note-history__inner"
            ref={dialogRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.24 }}
          >
            <header className="note-history__header">
              <h2 id="note-history-title">Timeline</h2>
              <button
                className="note-history__close"
                type="button"
                onClick={onClose}
                disabled={pendingId !== null}
                aria-label="Close timeline"
                title="Close"
                data-dialog-initial-focus
              >
                <IconClose />
              </button>
            </header>

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
          </motion.div>
        </motion.section>
      )}
    </AnimatePresence>,
    document.querySelector(".liangos-app") ?? document.body,
  );
}

export default NoteHistory;

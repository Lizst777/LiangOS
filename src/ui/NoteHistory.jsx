import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useDialogFocus } from "../hooks/useDialogFocus";
import { supabase } from "../lib/supabase";
import { IconClose } from "./Icons";

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

function mergeHistory(entries, versions, moments) {
  return [
    ...entries.map((entry) => ({
      ...entry,
      key: `entry-${entry.id}`,
      kind: "entry",
      sortTime: `${entry.entry_date}T23:59:59`,
    })),
    ...versions.map((version) => ({
      ...version,
      key: `version-${version.id}`,
      kind: "version",
      sortTime: version.created_at,
    })),
    ...moments.map((moment) => ({
      ...moment,
      key: `moment-${moment.id}`,
      kind: "moment",
      sortTime: moment.created_at,
    })),
  ].sort((left, right) => new Date(right.sortTime) - new Date(left.sortTime));
}

function NoteHistory({
  currentEntry,
  isOpen,
  onClose,
  onOpenEntry,
  onRestore,
  userId,
}) {
  const [items, setItems] = useState([]);
  const [loadState, setLoadState] = useState("idle");
  const [pendingId, setPendingId] = useState(null);
  const [errorId, setErrorId] = useState(null);
  const dialogRef = useRef(null);

  useDialogFocus(isOpen, dialogRef);

  useEffect(() => {
    if (!isOpen || !supabase || !userId) return undefined;

    let isActive = true;

    async function loadHistory() {
      setLoadState("loading");
      setErrorId(null);

      const [entriesResult, versionsResult, momentsResult] = await Promise.all([
        supabase
          .from("daily_notes")
          .select("id, entry_date, content, updated_at")
          .eq("user_id", userId)
          .order("entry_date", { ascending: false })
          .limit(180),
        supabase
          .from("daily_note_versions")
          .select("id, entry_date, content, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(160),
        supabase
          .from("moment_traces")
          .select("id, content, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(160),
      ]);

      if (!isActive) return;

      if (entriesResult.error || versionsResult.error || momentsResult.error) {
        setLoadState("error");
        return;
      }

      setItems(
        mergeHistory(
          entriesResult.data ?? [],
          versionsResult.data ?? [],
          momentsResult.data ?? [],
        ),
      );
      setLoadState("ready");
    }

    loadHistory();

    return () => {
      isActive = false;
    };
  }, [isOpen, userId]);

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

    const isCurrent =
      item.kind !== "moment" &&
      currentEntry.entryDate === item.entry_date &&
      (item.kind === "entry" || currentEntry.content === item.content);
    if (isCurrent) {
      onClose();
      return;
    }

    setPendingId(item.key);
    setErrorId(null);

    try {
      const result =
        item.kind === "entry" ? await onOpenEntry(item.entry_date) : await onRestore(item);

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
              {loadState === "loading" && items.length === 0 && (
                <p className="note-history__empty">Loading.</p>
              )}
              {loadState === "error" && (
                <p className="note-history__empty">Timeline is unavailable.</p>
              )}
              {loadState === "ready" && items.length === 0 && (
                <p className="note-history__empty">No earlier entries yet.</p>
              )}
              {items.map((item) => {
                const isCurrent =
                  item.kind !== "moment" &&
                  currentEntry.entryDate === item.entry_date &&
                  (item.kind === "entry" || currentEntry.content === item.content);
                const isPending = pendingId === item.key;
                const label = isCurrent
                  ? "Current"
                  : isPending
                    ? item.kind === "entry"
                      ? "Opening"
                      : "Restoring"
                    : errorId === item.key
                      ? item.kind === "entry"
                        ? "Not opened"
                        : "Not restored"
                      : item.kind === "entry"
                        ? "Open"
                        : "Restore";

                return (
                  <article className="note-version" key={item.key}>
                    <time dateTime={item.kind === "entry" ? item.entry_date : item.created_at}>
                      {item.kind === "entry"
                        ? entryDateFormatter.format(getDateFromKey(item.entry_date))
                        : `${item.kind === "moment" ? "Moment" : "Version"} · ${versionDateFormatter.format(new Date(item.created_at))}`}
                    </time>
                    <p>{getPreview(item.content)}</p>
                    {item.kind !== "moment" && (
                      <button
                        type="button"
                        onClick={() => void selectItem(item)}
                        disabled={pendingId !== null || isCurrent}
                        aria-live="polite"
                      >
                        {label}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          </motion.div>
        </motion.section>
      )}
    </AnimatePresence>,
    document.querySelector(".liangos-app") ?? document.body,
  );
}

export default NoteHistory;

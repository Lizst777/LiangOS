import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import { IconClose } from "./Icons";

const versionDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  month: "long",
  year: "numeric",
});

function getPreview(content) {
  const compact = content.trim();
  if (!compact) return "空白";
  return compact.length > 320 ? `…${compact.slice(-320)}` : compact;
}

function NoteHistory({ currentNote, isOpen, onClose, onRestore, userId }) {
  const [versions, setVersions] = useState([]);
  const [loadState, setLoadState] = useState("idle");
  const [restoringId, setRestoringId] = useState(null);
  const [restoreErrorId, setRestoreErrorId] = useState(null);

  useEffect(() => {
    if (!isOpen || !supabase || !userId) return undefined;

    let isActive = true;

    async function loadVersions() {
      setLoadState("loading");
      setRestoreErrorId(null);

      const { data, error } = await supabase
        .from("note_versions")
        .select("id, content, last_entry_date, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(80);

      if (!isActive) return;

      if (error) {
        setLoadState("error");
        return;
      }

      setVersions(data ?? []);
      setLoadState("ready");
    }

    loadVersions();

    return () => {
      isActive = false;
    };
  }, [isOpen, userId]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event) {
      if (event.key === "Escape" && restoringId === null) onClose();
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, onClose, restoringId]);

  async function restoreVersion(version) {
    if (!supabase || !userId || restoringId !== null) return;

    const isCurrent =
      currentNote.content === version.content &&
      currentNote.entryDate === version.last_entry_date;

    if (isCurrent) {
      onClose();
      return;
    }

    setRestoringId(version.id);
    setRestoreErrorId(null);

    try {
      const { error: snapshotError } = await supabase.from("note_versions").insert({
        user_id: userId,
        content: currentNote.content,
        last_entry_date: currentNote.entryDate,
      });

      if (snapshotError) {
        setRestoreErrorId(version.id);
        return;
      }

      const { error } = await onRestore(version);
      if (error) {
        setRestoreErrorId(version.id);
        return;
      }

      onClose();
    } catch {
      setRestoreErrorId(version.id);
    } finally {
      setRestoringId(null);
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.24 }}
          >
            <header className="note-history__header">
              <h2 id="note-history-title">History</h2>
              <button
                className="note-history__close"
                type="button"
                onClick={onClose}
                disabled={restoringId !== null}
                aria-label="Close history"
                title="Close"
              >
                <IconClose />
              </button>
            </header>

            <div className="note-history__list">
              {loadState === "loading" && versions.length === 0 && (
                <p className="note-history__empty">Loading.</p>
              )}
              {loadState === "error" && (
                <p className="note-history__empty">History is unavailable.</p>
              )}
              {loadState === "ready" && versions.length === 0 && (
                <p className="note-history__empty">No earlier versions yet.</p>
              )}
              {versions.map((version) => (
                <article className="note-version" key={version.id}>
                  <time dateTime={version.created_at}>
                    {versionDateFormatter.format(new Date(version.created_at))}
                  </time>
                  <p>{getPreview(version.content)}</p>
                  <button
                    type="button"
                    onClick={() => restoreVersion(version)}
                    disabled={restoringId !== null}
                    aria-live="polite"
                  >
                    {restoringId === version.id
                      ? "Restoring"
                      : restoreErrorId === version.id
                        ? "Not restored"
                        : "Restore"}
                  </button>
                </article>
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

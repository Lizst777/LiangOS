import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import { useOwnerSession } from "../../hooks/useOwnerSession";
import { IconClose } from "../../ui/Icons";
import MomentTraceItem from "./MomentTraceItem";
import { loadMomentTraces } from "./momentTraceRepository";

const EMPTY_MESSAGES = {
  error: "暂时无法抵达。",
  loading: "正在读取。",
  ready: "还没有留下什么。",
};

function MomentArchive({ isOpen, onClose, refreshKey }) {
  const { client, user } = useOwnerSession();
  const [traces, setTraces] = useState([]);
  const [loadState, setLoadState] = useState("idle");
  const dialogRef = useRef(null);
  const userId = user?.id ?? null;

  useDialogFocus(isOpen, dialogRef);

  const closeArchive = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !client || !userId) return undefined;

    let isActive = true;

    async function loadTraces() {
      setLoadState("loading");
      const { data, error } = await loadMomentTraces(client, userId);

      if (!isActive) return;

      if (error) {
        setLoadState("error");
        return;
      }

      setTraces(data ?? []);
      setLoadState("ready");
    }

    void loadTraces();

    return () => {
      isActive = false;
    };
  }, [client, isOpen, refreshKey, userId]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event) {
      if (event.key === "Escape") closeArchive();
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [closeArchive, isOpen]);

  function updateTrace(updatedTrace) {
    setTraces((current) =>
      current.map((trace) =>
        trace.id === updatedTrace.id
          ? { ...trace, content: updatedTrace.content }
          : trace,
      ),
    );
  }

  function removeTrace(id) {
    setTraces((current) => current.filter((trace) => trace.id !== id));
  }

  if (typeof document === "undefined") return null;

  const showEmptyMessage =
    loadState === "error" ||
    (loadState === "loading" && traces.length === 0) ||
    (loadState === "ready" && traces.length === 0);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.section
          className="moment-archive"
          role="dialog"
          aria-modal="true"
          aria-labelledby="moment-archive-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="moment-archive__inner"
            ref={dialogRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.24 }}
          >
            <header className="moment-archive__header">
              <h2 id="moment-archive-title">痕迹</h2>
              <button
                className="moment-archive__close"
                type="button"
                onClick={closeArchive}
                aria-label="关闭痕迹"
                title="关闭"
                data-dialog-initial-focus
              >
                <IconClose />
              </button>
            </header>

            <div className="moment-archive__list">
              {showEmptyMessage && (
                <p className="moment-archive__empty">{EMPTY_MESSAGES[loadState]}</p>
              )}

              {traces.map((trace) => (
                <MomentTraceItem
                  client={client}
                  key={trace.id}
                  onDeleted={removeTrace}
                  onUpdated={updateTrace}
                  trace={trace}
                  userId={userId}
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

export default MomentArchive;

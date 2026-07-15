import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useOwnerSession } from "../hooks/useOwnerSession";
import { supabase } from "../lib/supabase";
import { IconClose } from "./Icons";

const traceDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  month: "long",
  year: "numeric",
});

function formatWeather(trace) {
  return [
    trace.temperature ? `${trace.temperature}°C` : null,
    trace.weather_text,
    trace.location,
  ]
    .filter(Boolean)
    .join(" · ");
}

function MomentArchive({ isOpen, onClose, refreshKey }) {
  const { user } = useOwnerSession();
  const [traces, setTraces] = useState([]);
  const [loadState, setLoadState] = useState("idle");
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const feedbackTimerRef = useRef(null);
  const userId = user?.id ?? null;

  const closeArchive = useCallback(() => {
    setEditingId(null);
    setDraft("");
    setConfirmingDeleteId(null);
    setPendingAction(null);
    setFeedback(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !supabase || !userId) return undefined;

    let isActive = true;

    async function loadTraces() {
      setLoadState("loading");

      const { data, error } = await supabase
        .from("moment_traces")
        .select("id, content, weather_text, temperature, location, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(120);

      if (!isActive) return;

      if (error) {
        setLoadState("error");
        return;
      }

      setTraces(data ?? []);
      setLoadState("ready");
    }

    loadTraces();

    return () => {
      isActive = false;
    };
  }, [isOpen, refreshKey, userId]);

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

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  function showFeedback(id, label) {
    if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
    setFeedback({ id, label });
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(null), 1800);
  }

  function startEditing(trace) {
    setConfirmingDeleteId(null);
    setEditingId(trace.id);
    setDraft(trace.content);
    setFeedback(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setDraft("");
  }

  async function updateTrace(event, trace) {
    event.preventDefault();
    const nextContent = draft.trim();

    if (!nextContent) {
      showFeedback(trace.id, "不能为空");
      return;
    }

    if (nextContent === trace.content) {
      cancelEditing();
      return;
    }

    setPendingAction({ id: trace.id, type: "update" });

    try {
      const { data, error } = await supabase
        .from("moment_traces")
        .update({ content: nextContent })
        .eq("id", trace.id)
        .eq("user_id", userId)
        .select("id, content")
        .single();

      if (error) {
        showFeedback(trace.id, "未保存");
        return;
      }

      setTraces((current) =>
        current.map((item) => (item.id === data.id ? { ...item, content: data.content } : item)),
      );
      cancelEditing();
      showFeedback(trace.id, "已保存");
    } catch {
      showFeedback(trace.id, "未保存");
    } finally {
      setPendingAction(null);
    }
  }

  async function deleteTrace(trace) {
    setPendingAction({ id: trace.id, type: "delete" });

    try {
      const { data, error } = await supabase
        .from("moment_traces")
        .delete()
        .eq("id", trace.id)
        .eq("user_id", userId)
        .select("id")
        .single();

      if (error) {
        showFeedback(trace.id, "未删除");
        return;
      }

      setTraces((current) => current.filter((item) => item.id !== data.id));
      setConfirmingDeleteId(null);
    } catch {
      showFeedback(trace.id, "未删除");
    } finally {
      setPendingAction(null);
    }
  }

  if (typeof document === "undefined") return null;

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
              >
                <IconClose />
              </button>
            </header>

            <div className="moment-archive__list">
              {loadState === "loading" && traces.length === 0 && (
                <p className="moment-archive__empty">正在读取。</p>
              )}
              {loadState === "error" && (
                <p className="moment-archive__empty">暂时无法抵达。</p>
              )}
              {loadState === "ready" && traces.length === 0 && (
                <p className="moment-archive__empty">还没有留下什么。</p>
              )}
              {traces.map((trace) => {
                const weather = formatWeather(trace);
                const isEditing = editingId === trace.id;
                const isConfirmingDelete = confirmingDeleteId === trace.id;
                const isPending = pendingAction?.id === trace.id;
                const editFormId = `moment-trace-edit-${trace.id}`;

                return (
                  <article className="moment-trace" key={trace.id}>
                    <time className="moment-trace__time" dateTime={trace.created_at}>
                      {traceDateFormatter.format(new Date(trace.created_at))}
                    </time>

                    {isEditing ? (
                      <form
                        className="moment-trace__edit"
                        id={editFormId}
                        onSubmit={(event) => updateTrace(event, trace)}
                      >
                        <textarea
                          value={draft}
                          onChange={(event) => setDraft(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") {
                              event.stopPropagation();
                              cancelEditing();
                            }
                            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                              event.currentTarget.form?.requestSubmit();
                            }
                          }}
                          maxLength={120}
                          rows={2}
                          autoFocus
                          aria-label="编辑 moment"
                        />
                      </form>
                    ) : (
                      <p>{trace.content}</p>
                    )}

                    <span className="moment-trace__weather">{weather}</span>

                    <div className="moment-trace__actions" aria-live="polite">
                      {feedback?.id === trace.id ? (
                        <span>{feedback.label}</span>
                      ) : isEditing ? (
                        <>
                          <button
                            type="submit"
                            form={editFormId}
                            disabled={isPending}
                          >
                            {isPending ? "保存中" : "保存"}
                          </button>
                          <span aria-hidden="true">·</span>
                          <button type="button" onClick={cancelEditing} disabled={isPending}>
                            取消
                          </button>
                        </>
                      ) : isConfirmingDelete ? (
                        <>
                          <button type="button" onClick={() => deleteTrace(trace)} disabled={isPending}>
                            {isPending ? "删除中" : "确认删除"}
                          </button>
                          <span aria-hidden="true">·</span>
                          <button
                            type="button"
                            onClick={() => setConfirmingDeleteId(null)}
                            disabled={isPending}
                          >
                            取消
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => startEditing(trace)}>
                            编辑
                          </button>
                          <span aria-hidden="true">·</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setConfirmingDeleteId(trace.id);
                            }}
                          >
                            删除
                          </button>
                        </>
                      )}
                    </div>
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

export default MomentArchive;

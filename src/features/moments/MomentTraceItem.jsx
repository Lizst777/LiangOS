import { useEffect, useRef, useState } from "react";
import { deleteMomentTrace, updateMomentTrace } from "./momentTraceRepository";

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

function MomentTraceItem({ client, onDeleted, onUpdated, trace, userId }) {
  const [mode, setMode] = useState("view");
  const [draft, setDraft] = useState(trace.content);
  const [pendingAction, setPendingAction] = useState(null);
  const [feedback, setFeedback] = useState("");
  const feedbackTimerRef = useRef(null);
  const editFormId = `moment-trace-edit-${trace.id}`;
  const weather = formatWeather(trace);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  function showFeedback(label) {
    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current);
    }

    setFeedback(label);
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(""), 1800);
  }

  function startEditing() {
    setDraft(trace.content);
    setFeedback("");
    setMode("edit");
  }

  function cancelAction() {
    setDraft(trace.content);
    setMode("view");
  }

  async function submitUpdate(event) {
    event.preventDefault();
    const content = draft.trim();

    if (!content) {
      showFeedback("不能为空");
      return;
    }

    if (content === trace.content) {
      cancelAction();
      return;
    }

    setPendingAction("update");

    try {
      const { data, error } = await updateMomentTrace(client, {
        content,
        id: trace.id,
        userId,
      });

      if (error) {
        showFeedback("未保存");
        return;
      }

      onUpdated(data);
      setMode("view");
      showFeedback("已保存");
    } catch {
      showFeedback("未保存");
    } finally {
      setPendingAction(null);
    }
  }

  async function confirmDelete() {
    setPendingAction("delete");

    try {
      const { data, error } = await deleteMomentTrace(client, {
        id: trace.id,
        userId,
      });

      if (error) {
        showFeedback("未删除");
        return;
      }

      onDeleted(data.id);
    } catch {
      showFeedback("未删除");
    } finally {
      setPendingAction(null);
    }
  }

  function handleEditKeyDown(event) {
    if (event.key === "Escape") {
      event.stopPropagation();
      cancelAction();
    }

    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <article className="moment-trace">
      <time className="moment-trace__time" dateTime={trace.created_at}>
        {traceDateFormatter.format(new Date(trace.created_at))}
      </time>

      {mode === "edit" ? (
        <form className="moment-trace__edit" id={editFormId} onSubmit={submitUpdate}>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleEditKeyDown}
            maxLength={120}
            rows={2}
            autoFocus
            aria-label="编辑 moment"
          />
        </form>
      ) : (
        <p>{trace.content}</p>
      )}

      {(trace.quote_author || trace.quote_source) && (
        <span className="moment-trace__source">
          {[trace.quote_author, trace.quote_source].filter(Boolean).join(" · ")}
        </span>
      )}
      <span className="moment-trace__weather">{weather}</span>

      <div className="moment-trace__actions" aria-live="polite">
        {feedback ? (
          <span>{feedback}</span>
        ) : mode === "edit" ? (
          <>
            <button type="submit" form={editFormId} disabled={pendingAction !== null}>
              {pendingAction === "update" ? "保存中" : "保存"}
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={cancelAction}
              disabled={pendingAction !== null}
            >
              取消
            </button>
          </>
        ) : mode === "delete" ? (
          <>
            <button
              type="button"
              onClick={() => void confirmDelete()}
              disabled={pendingAction !== null}
            >
              {pendingAction === "delete" ? "删除中" : "确认删除"}
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={cancelAction}
              disabled={pendingAction !== null}
            >
              取消
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={startEditing}>
              编辑
            </button>
            <span aria-hidden="true">·</span>
            <button type="button" onClick={() => setMode("delete")}>
              删除
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export default MomentTraceItem;

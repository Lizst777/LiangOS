import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from "react";
import { formatEntryDate } from "./date";

const NoteHistory = lazy(() => import("./NoteHistory"));

function NotesEditor({
  content,
  entryDate,
  exportLabel,
  exportStatus,
  hasOpenedHistory,
  isActive,
  isHistoryOpen,
  isNoteReady,
  isToday,
  onCloseHistory,
  onContentChange,
  onExport,
  onOpenEntry,
  onOpenHistory,
  onRestoreVersion,
  onSignOut,
  onToday,
  statusText,
  userId,
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!isActive || !isNoteReady) return undefined;

    const frame = window.requestAnimationFrame(() => {
      textareaRef.current?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isActive, isNoteReady]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || !isNoteReady) return;
    if (window.CSS?.supports?.("field-sizing", "content")) return;

    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [content, isNoteReady]);

  const formattedDate = formatEntryDate(entryDate);

  return (
    <>
      <section className="notes-editor page-scroll" aria-label="Notes">
        <time className="notes-editor__date" dateTime={entryDate}>
          {formattedDate}
        </time>
        <textarea
          className="notes-editor__textarea"
          ref={textareaRef}
          value={content}
          onChange={(event) => onContentChange(event.target.value)}
          disabled={!isNoteReady}
          aria-label={`Notes for ${formattedDate}`}
        />
        <div className="notes-editor__meta">
          <span className="notes-editor__status" aria-live="polite">
            {statusText}
          </span>
          {!isToday && (
            <>
              <span aria-hidden="true">·</span>
              <button className="notes-editor__action" type="button" onClick={onToday}>
                Today
              </button>
            </>
          )}
          <span aria-hidden="true">·</span>
          <button
            className="notes-editor__action"
            type="button"
            disabled={!isNoteReady}
            onClick={onOpenHistory}
          >
            Timeline
          </button>
          <span aria-hidden="true">·</span>
          <button
            className="notes-editor__action notes-editor__action--export"
            type="button"
            onClick={onExport}
            disabled={!isNoteReady || exportStatus === "exporting"}
            aria-live="polite"
          >
            {exportLabel}
          </button>
          <span aria-hidden="true">·</span>
          <button className="notes-editor__action" type="button" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </section>

      {hasOpenedHistory && (
        <Suspense fallback={null}>
          <NoteHistory
            currentEntry={{ content, entryDate }}
            isOpen={isHistoryOpen}
            onClose={onCloseHistory}
            onOpenEntry={onOpenEntry}
            onRestore={onRestoreVersion}
            userId={userId}
          />
        </Suspense>
      )}
    </>
  );
}

export default NotesEditor;

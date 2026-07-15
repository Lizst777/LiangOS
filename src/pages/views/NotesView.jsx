import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useOwnerSession } from "../../hooks/useOwnerSession";
import { supabase } from "../../lib/supabase";
import { exportPrivateData } from "../../utils/exportPrivateData";

const NoteHistory = lazy(() => import("../../ui/NoteHistory"));

const LEGACY_STORAGE_KEY = "liangos-notes-content";
const SAVE_DELAY = 700;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
});

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateAnchor(date = new Date()) {
  return `${dateFormatter.format(date)} · ${weekdayFormatter.format(date)}`;
}

function appendDateAnchor(content, date = new Date()) {
  const anchor = formatDateAnchor(date);
  const trimmed = content.trimEnd();

  if (trimmed.endsWith(anchor)) return content;
  return trimmed ? `${trimmed}\n\n${anchor}\n\n` : `${anchor}\n\n`;
}

function getLegacyContent() {
  try {
    return localStorage.getItem(LEGACY_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function clearLegacyContent() {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // The cloud copy is authoritative after migration.
  }
}

function NotesView() {
  const { isAvailable, isReady, user, signIn, signOut } = useOwnerSession();
  const [password, setPassword] = useState("");
  const [authStatus, setAuthStatus] = useState(isAvailable ? "idle" : "unavailable");
  const [content, setContent] = useState("");
  const [entryDate, setEntryDate] = useState(null);
  const [isNoteReady, setIsNoteReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [exportStatus, setExportStatus] = useState("idle");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [hasOpenedHistory, setHasOpenedHistory] = useState(false);
  const textareaRef = useRef(null);
  const lastSaved = useRef({ content: "", entryDate: null });
  const saveRequest = useRef(0);
  const saveTimerRef = useRef(null);
  const exportTimerRef = useRef(null);
  const userId = user?.id ?? null;

  useEffect(() => {
    const timer = window.setInterval(() => {
      const nextDate = getLocalDateKey();
      if (!userId || !isNoteReady || !entryDate || entryDate === nextDate) return;

      setContent((current) => appendDateAnchor(current));
      setEntryDate(nextDate);
      setSaveStatus("saving");
    }, 60_000);

    return () => window.clearInterval(timer);
  }, [entryDate, isNoteReady, userId]);

  useEffect(() => {
    if (!userId) {
      saveRequest.current += 1;
      return undefined;
    }

    let isActive = true;

    async function loadNote() {
      setIsNoteReady(false);
      setSaveStatus("loading");

      const currentDate = getLocalDateKey();
      const currentDateValue = new Date();
      const { data, error } = await supabase
        .from("notes")
        .select("content, last_entry_date")
        .eq("user_id", userId)
        .maybeSingle();

      if (!isActive) return;

      if (error) {
        const fallbackContent = appendDateAnchor("", currentDateValue);
        lastSaved.current = { content: "", entryDate: null };
        setContent(fallbackContent);
        setEntryDate(currentDate);
        setSaveStatus("error");
        setIsNoteReady(true);
        return;
      }

      const legacyContent = data ? "" : getLegacyContent();
      let nextContent = data?.content ?? legacyContent;
      let nextEntryDate = data?.last_entry_date ?? null;
      const needsDateAnchor = nextEntryDate !== currentDate;

      if (needsDateAnchor) {
        nextContent = appendDateAnchor(nextContent, currentDateValue);
        nextEntryDate = currentDate;
      }

      const needsInitialSave = !data || Boolean(legacyContent) || needsDateAnchor;
      let initialSaveError = null;

      if (needsInitialSave) {
        const { error: upsertError } = await supabase.from("notes").upsert({
          user_id: userId,
          content: nextContent,
          last_entry_date: nextEntryDate,
          updated_at: new Date().toISOString(),
        });
        initialSaveError = upsertError;

        if (!isActive) return;
        if (!upsertError && legacyContent) clearLegacyContent();
      }

      lastSaved.current = initialSaveError
        ? { content: data?.content ?? "", entryDate: data?.last_entry_date ?? null }
        : { content: nextContent, entryDate: nextEntryDate };
      setContent(nextContent);
      setEntryDate(nextEntryDate);
      setSaveStatus(initialSaveError ? "error" : "saved");
      setIsNoteReady(true);
    }

    loadNote();

    return () => {
      isActive = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!supabase || !userId || !isNoteReady || !entryDate) return undefined;

    if (
      content === lastSaved.current.content &&
      entryDate === lastSaved.current.entryDate
    ) {
      return undefined;
    }

    const requestId = ++saveRequest.current;
    saveTimerRef.current = window.setTimeout(async () => {
      saveTimerRef.current = null;
      const { error } = await supabase.from("notes").upsert({
        user_id: userId,
        content,
        last_entry_date: entryDate,
        updated_at: new Date().toISOString(),
      });

      if (requestId !== saveRequest.current) return;

      if (error) {
        setSaveStatus("error");
        return;
      }

      lastSaved.current = { content, entryDate };
      setSaveStatus("saved");
    }, SAVE_DELAY);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [content, entryDate, isNoteReady, userId]);

  useEffect(() => {
    return () => {
      if (exportTimerRef.current) window.clearTimeout(exportTimerRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || !isNoteReady) return;

    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [content, isNoteReady]);

  async function saveNow(nextContent = content, nextEntryDate = entryDate) {
    if (!supabase || !userId || !nextEntryDate) {
      return { error: new Error("Notes are unavailable.") };
    }

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    const requestId = ++saveRequest.current;
    setSaveStatus("saving");

    const { error } = await supabase.from("notes").upsert({
      user_id: userId,
      content: nextContent,
      last_entry_date: nextEntryDate,
      updated_at: new Date().toISOString(),
    });

    if (requestId !== saveRequest.current) {
      return { error: new Error("A newer save replaced this request.") };
    }

    if (error) {
      setSaveStatus("error");
      return { error };
    }

    lastSaved.current = { content: nextContent, entryDate: nextEntryDate };
    setSaveStatus("saved");
    return { error: null };
  }

  async function requestSignIn(event) {
    event.preventDefault();
    if (!isAvailable || !password || authStatus === "sending") return;

    setAuthStatus("sending");
    const { error } = await signIn(password);

    if (!error) setPassword("");
    setAuthStatus(error ? "error" : "idle");
  }

  async function requestSignOut() {
    const hasUnsavedChanges =
      isNoteReady &&
      (content !== lastSaved.current.content || entryDate !== lastSaved.current.entryDate);

    if (hasUnsavedChanges) {
      const { error } = await saveNow();
      if (error) return;
    }

    saveRequest.current += 1;
    setIsHistoryOpen(false);
    await signOut();
    setPassword("");
  }

  async function requestExport() {
    if (!supabase || !userId || exportStatus === "exporting") return;

    if (exportTimerRef.current) window.clearTimeout(exportTimerRef.current);
    setExportStatus("exporting");

    try {
      const hasUnsavedChanges =
        content !== lastSaved.current.content || entryDate !== lastSaved.current.entryDate;

      if (hasUnsavedChanges) {
        const { error } = await saveNow();
        if (error) throw error;
      }

      await exportPrivateData(supabase, userId);
      setExportStatus("exported");
    } catch {
      setExportStatus("error");
    }

    exportTimerRef.current = window.setTimeout(() => setExportStatus("idle"), 1800);
  }

  async function restoreVersion(version) {
    const restoredEntryDate = version.last_entry_date ?? getLocalDateKey();
    const restoredContent = version.last_entry_date
      ? version.content
      : appendDateAnchor(version.content);
    const result = await saveNow(restoredContent, restoredEntryDate);

    if (!result.error) {
      setContent(restoredContent);
      setEntryDate(restoredEntryDate);
    }

    return result;
  }

  const closeHistory = useCallback(() => setIsHistoryOpen(false), []);

  if (!isReady) {
    return (
      <section className="notes-gate page-scroll" aria-label="Notes loading">
        <p className="notes-gate__status">Connecting</p>
      </section>
    );
  }

  if (!user) {
    const authMessage = {
      error: "Unable to unlock",
      unavailable: "Connection unavailable",
    }[authStatus];

    return (
      <section className="notes-gate page-scroll" aria-label="Sign in to notes">
        <form className="notes-gate__form" onSubmit={requestSignIn}>
          <input
            className="notes-gate__input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (authStatus === "error") setAuthStatus("idle");
            }}
            autoComplete="current-password"
            aria-label="Password"
            required
          />
          <button
            className="notes-gate__button"
            type="submit"
            disabled={authStatus === "sending" || authStatus === "unavailable"}
          >
            {authStatus === "sending" ? "Unlocking" : "Unlock"}
          </button>
          <p className="notes-gate__status" aria-live="polite">
            {authMessage ?? ""}
          </p>
        </form>
      </section>
    );
  }

  const statusText = {
    loading: "Loading",
    saving: "Saving",
    saved: "Saved",
    error: "Not saved",
  }[saveStatus];
  const exportLabel = {
    idle: "Export",
    exporting: "Exporting",
    exported: "Exported",
    error: "Not exported",
  }[exportStatus];

  return (
    <>
      <section className="notes-editor page-scroll" aria-label="Notes">
        <textarea
          className="notes-editor__textarea"
          ref={textareaRef}
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            setSaveStatus("saving");
          }}
          disabled={!isNoteReady}
          autoFocus
          aria-label="Notes"
        />
        <div className="notes-editor__meta">
          <span className="notes-editor__status" aria-live="polite">
            {statusText ?? ""}
          </span>
          <span aria-hidden="true">·</span>
          <button
            className="notes-editor__action"
            type="button"
            disabled={!isNoteReady}
            onClick={() => {
              setHasOpenedHistory(true);
              setIsHistoryOpen(true);
            }}
          >
            History
          </button>
          <span aria-hidden="true">·</span>
          <button
            className="notes-editor__action notes-editor__action--export"
            type="button"
            onClick={requestExport}
            disabled={!isNoteReady || exportStatus === "exporting"}
            aria-live="polite"
          >
            {exportLabel}
          </button>
          <span aria-hidden="true">·</span>
          <button className="notes-editor__action" type="button" onClick={requestSignOut}>
            Sign out
          </button>
        </div>
      </section>

      {hasOpenedHistory && (
        <Suspense fallback={null}>
          <NoteHistory
            currentNote={{ content, entryDate }}
            isOpen={isHistoryOpen}
            onClose={closeHistory}
            onRestore={restoreVersion}
            userId={userId}
          />
        </Suspense>
      )}
    </>
  );
}

export default NotesView;

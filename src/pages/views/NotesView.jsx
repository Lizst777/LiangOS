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

function getDateFromKey(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function formatEntryDate(value) {
  const date = getDateFromKey(value);
  return `${dateFormatter.format(date)} · ${weekdayFormatter.format(date)}`;
}

function NotesView({ registerBeforeLeave }) {
  const { isAvailable, isReady, user, signIn, signOut } = useOwnerSession();
  const [password, setPassword] = useState("");
  const [authStatus, setAuthStatus] = useState(isAvailable ? "idle" : "unavailable");
  const [todayKey, setTodayKey] = useState(() => getLocalDateKey());
  const [entryDate, setEntryDate] = useState(() => getLocalDateKey());
  const [content, setContent] = useState("");
  const [isNoteReady, setIsNoteReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [exportStatus, setExportStatus] = useState("idle");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [hasOpenedHistory, setHasOpenedHistory] = useState(false);
  const textareaRef = useRef(null);
  const isMountedRef = useRef(true);
  const previousTodayRef = useRef(todayKey);
  const lastSavedRef = useRef({ content: "", entryDate: null });
  const latestDraftRef = useRef({
    content: "",
    entryDate,
    isReady: false,
    userId: null,
  });
  const saveQueueRef = useRef(Promise.resolve({ error: null }));
  const loadRequestRef = useRef(0);
  const saveTimerRef = useRef(null);
  const exportTimerRef = useRef(null);
  const userId = user?.id ?? null;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    latestDraftRef.current = {
      content,
      entryDate,
      isReady: isNoteReady,
      userId,
    };
  }, [content, entryDate, isNoteReady, userId]);

  useEffect(() => {
    const timer = window.setInterval(() => setTodayKey(getLocalDateKey()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const persistEntry = useCallback((draft, { quiet = false } = {}) => {
    if (!supabase || !draft.userId || !draft.entryDate) {
      return Promise.resolve({ error: new Error("Notes are unavailable.") });
    }

    if (!quiet && isMountedRef.current) setSaveStatus("saving");

    const write = async () => {
      try {
        const { error } = await supabase.from("daily_notes").upsert(
          {
            user_id: draft.userId,
            entry_date: draft.entryDate,
            content: draft.content,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,entry_date" },
        );

        if (error) throw error;

        const isCurrentEntry =
          latestDraftRef.current.userId === draft.userId &&
          latestDraftRef.current.entryDate === draft.entryDate;

        if (isCurrentEntry) {
          lastSavedRef.current = {
            content: draft.content,
            entryDate: draft.entryDate,
          };
        }

        const isLatestDraft =
          isCurrentEntry && latestDraftRef.current.content === draft.content;

        if (!quiet && isMountedRef.current && isCurrentEntry) {
          setSaveStatus(isLatestDraft ? "saved" : "saving");
        }

        return { error: null };
      } catch (error) {
        const isCurrentEntry =
          latestDraftRef.current.userId === draft.userId &&
          latestDraftRef.current.entryDate === draft.entryDate;
        if (!quiet && isMountedRef.current && isCurrentEntry) setSaveStatus("error");
        return {
          error: error instanceof Error ? error : new Error("The note was not saved."),
        };
      }
    };

    const queuedWrite = saveQueueRef.current.then(write, write);
    saveQueueRef.current = queuedWrite;
    return queuedWrite;
  }, []);

  const flushPendingSave = useCallback(
    async ({ quiet = false } = {}) => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      await saveQueueRef.current;

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const draft = { ...latestDraftRef.current };
        if (!draft.isReady || !draft.userId) return true;

        const isSaved =
          draft.content === lastSavedRef.current.content &&
          draft.entryDate === lastSavedRef.current.entryDate;
        if (isSaved) return true;

        const { error } = await persistEntry(draft, { quiet });
        if (error) return false;
      }

      const latest = latestDraftRef.current;
      return (
        latest.content === lastSavedRef.current.content &&
        latest.entryDate === lastSavedRef.current.entryDate
      );
    },
    [persistEntry],
  );

  const beginEntryChange = useCallback(
    (nextEntryDate) => {
      latestDraftRef.current = {
        content: "",
        entryDate: nextEntryDate,
        isReady: false,
        userId,
      };
      setContent("");
      setIsNoteReady(false);
      setSaveStatus("loading");
      setEntryDate(nextEntryDate);
    },
    [userId],
  );

  useEffect(() => {
    if (!registerBeforeLeave) return undefined;
    return registerBeforeLeave(() => flushPendingSave());
  }, [flushPendingSave, registerBeforeLeave]);

  useEffect(() => {
    function flushWhenHidden() {
      if (document.visibilityState === "hidden") {
        void flushPendingSave({ quiet: true });
      }
    }

    function flushBeforePageHide() {
      void flushPendingSave({ quiet: true });
    }

    document.addEventListener("visibilitychange", flushWhenHidden);
    window.addEventListener("pagehide", flushBeforePageHide);

    return () => {
      document.removeEventListener("visibilitychange", flushWhenHidden);
      window.removeEventListener("pagehide", flushBeforePageHide);
    };
  }, [flushPendingSave]);

  useEffect(() => {
    if (!userId) {
      loadRequestRef.current += 1;
      return undefined;
    }

    const requestId = ++loadRequestRef.current;
    let isActive = true;

    async function loadEntry() {
      setIsNoteReady(false);
      setSaveStatus("loading");

      const { data, error } = await supabase
        .from("daily_notes")
        .select("content, entry_date")
        .eq("user_id", userId)
        .eq("entry_date", entryDate)
        .maybeSingle();

      if (!isActive || requestId !== loadRequestRef.current) return;

      if (error) {
        setSaveStatus("error");
        return;
      }

      const nextContent = data?.content ?? "";
      lastSavedRef.current = { content: nextContent, entryDate };
      latestDraftRef.current = {
        content: nextContent,
        entryDate,
        isReady: true,
        userId,
      };
      setContent(nextContent);
      setSaveStatus("saved");
      setIsNoteReady(true);
    }

    loadEntry();

    return () => {
      isActive = false;
    };
  }, [entryDate, userId]);

  useEffect(() => {
    if (!supabase || !userId || !isNoteReady || !entryDate) return undefined;

    const isSaved =
      content === lastSavedRef.current.content &&
      entryDate === lastSavedRef.current.entryDate;
    if (isSaved) return undefined;

    const draft = { content, entryDate, isReady: true, userId };
    const timer = window.setTimeout(() => {
      saveTimerRef.current = null;
      void persistEntry(draft);
    }, SAVE_DELAY);
    saveTimerRef.current = timer;

    return () => {
      window.clearTimeout(timer);
      if (saveTimerRef.current === timer) saveTimerRef.current = null;
    };
  }, [content, entryDate, isNoteReady, persistEntry, userId]);

  useEffect(() => {
    const previousToday = previousTodayRef.current;
    previousTodayRef.current = todayKey;

    if (previousToday === todayKey || entryDate !== previousToday) return;

    void (async () => {
      const canMove = await flushPendingSave();
      if (canMove && isMountedRef.current) beginEntryChange(todayKey);
    })();
  }, [beginEntryChange, entryDate, flushPendingSave, todayKey]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      if (exportTimerRef.current) window.clearTimeout(exportTimerRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || !isNoteReady) return;

    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [content, isNoteReady]);

  async function requestSignIn(event) {
    event.preventDefault();
    if (!isAvailable || !password || authStatus === "sending") return;

    setAuthStatus("sending");
    const { error } = await signIn(password);

    if (!error) setPassword("");
    setAuthStatus(error ? "error" : "idle");
  }

  async function requestSignOut() {
    const canLeave = await flushPendingSave();
    if (!canLeave) return;

    setIsHistoryOpen(false);
    await signOut();
    setPassword("");
  }

  async function requestExport() {
    if (!supabase || !userId || exportStatus === "exporting") return;

    if (exportTimerRef.current) window.clearTimeout(exportTimerRef.current);
    setExportStatus("exporting");

    try {
      const canExport = await flushPendingSave();
      if (!canExport) throw new Error("The current note was not saved.");

      await exportPrivateData(supabase, userId);
      setExportStatus("exported");
    } catch {
      setExportStatus("error");
    }

    exportTimerRef.current = window.setTimeout(() => setExportStatus("idle"), 1800);
  }

  async function openEntry(nextEntryDate) {
    if (!nextEntryDate || nextEntryDate === entryDate) return { error: null };

    const canMove = await flushPendingSave();
    if (!canMove) return { error: new Error("The current note was not saved.") };

    beginEntryChange(nextEntryDate);
    return { error: null };
  }

  async function restoreVersion(version) {
    if (!supabase || !userId || !version.entry_date) {
      return { error: new Error("This version is unavailable.") };
    }

    const canMove = await flushPendingSave();
    if (!canMove) return { error: new Error("The current note was not saved.") };

    setSaveStatus("saving");
    const { error } = await supabase.from("daily_notes").upsert(
      {
        user_id: userId,
        entry_date: version.entry_date,
        content: version.content,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,entry_date" },
    );

    if (error) {
      setSaveStatus("error");
      return { error };
    }

    lastSavedRef.current = {
      content: version.content,
      entryDate: version.entry_date,
    };
    latestDraftRef.current = {
      content: version.content,
      entryDate: version.entry_date,
      isReady: true,
      userId,
    };
    setEntryDate(version.entry_date);
    setContent(version.content);
    setIsNoteReady(true);
    setSaveStatus("saved");
    return { error: null };
  }

  async function requestHistory() {
    const canOpen = await flushPendingSave();
    if (!canOpen) return;
    setHasOpenedHistory(true);
    setIsHistoryOpen(true);
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
    idle: "",
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
  const isToday = entryDate === todayKey;

  return (
    <>
      <section className="notes-editor page-scroll" aria-label="Notes">
        <time className="notes-editor__date" dateTime={entryDate}>
          {formatEntryDate(entryDate)}
        </time>
        <textarea
          className="notes-editor__textarea"
          ref={textareaRef}
          value={content}
          onChange={(event) => {
            const nextContent = event.target.value;
            latestDraftRef.current = {
              content: nextContent,
              entryDate,
              isReady: isNoteReady,
              userId,
            };
            setContent(nextContent);
            setSaveStatus("saving");
          }}
          onBlur={() => void flushPendingSave()}
          disabled={!isNoteReady}
          autoFocus
          aria-label={`Notes for ${formatEntryDate(entryDate)}`}
        />
        <div className="notes-editor__meta">
          <span className="notes-editor__status" aria-live="polite">
            {statusText ?? ""}
          </span>
          {!isToday && (
            <>
              <span aria-hidden="true">·</span>
              <button
                className="notes-editor__action"
                type="button"
                onClick={() => void openEntry(todayKey)}
              >
                Today
              </button>
            </>
          )}
          <span aria-hidden="true">·</span>
          <button
            className="notes-editor__action"
            type="button"
            disabled={!isNoteReady}
            onClick={() => void requestHistory()}
          >
            Timeline
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
            currentEntry={{ content, entryDate }}
            isOpen={isHistoryOpen}
            onClose={closeHistory}
            onOpenEntry={openEntry}
            onRestore={restoreVersion}
            userId={userId}
          />
        </Suspense>
      )}
    </>
  );
}

export default NotesView;

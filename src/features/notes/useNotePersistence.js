import { useCallback, useEffect, useRef } from "react";
import { saveDailyNote } from "./dailyNoteRepository";

const SAVE_DELAY = 700;

export function useNotePersistence({ setSaveStatus, supabase }) {
  const isMountedRef = useRef(true);
  const lastSavedRef = useRef({ content: "", entryDate: null });
  const latestDraftRef = useRef({
    content: "",
    entryDate: null,
    isReady: false,
    userId: null,
  });
  const saveQueueRef = useRef(Promise.resolve({ error: null }));
  const activeFlushRef = useRef(null);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

  const setLatestDraft = useCallback((draft) => {
    latestDraftRef.current = draft;
  }, []);

  const markSaved = useCallback((draft) => {
    lastSavedRef.current = {
      content: draft.content,
      entryDate: draft.entryDate,
    };
    latestDraftRef.current = draft;
  }, []);

  const isSaved = useCallback(
    (draft) =>
      draft.content === lastSavedRef.current.content &&
      draft.entryDate === lastSavedRef.current.entryDate,
    [],
  );

  const persistEntry = useCallback(
    (draft, { quiet = false } = {}) => {
      if (!supabase || !draft.userId || !draft.entryDate) {
        return Promise.resolve({ error: new Error("Notes are unavailable.") });
      }

      if (!quiet && isMountedRef.current) setSaveStatus("saving");

      const write = async () => {
        try {
          const { error } = await saveDailyNote(supabase, draft);
          if (error) throw error;

          const currentDraft = latestDraftRef.current;
          const isCurrentEntry =
            currentDraft.userId === draft.userId &&
            currentDraft.entryDate === draft.entryDate;

          if (isCurrentEntry) {
            lastSavedRef.current = {
              content: draft.content,
              entryDate: draft.entryDate,
            };
          }

          if (!quiet && isMountedRef.current && isCurrentEntry) {
            setSaveStatus(currentDraft.content === draft.content ? "saved" : "saving");
          }

          return { error: null };
        } catch (error) {
          const currentDraft = latestDraftRef.current;
          const isCurrentEntry =
            currentDraft.userId === draft.userId &&
            currentDraft.entryDate === draft.entryDate;

          if (!quiet && isMountedRef.current && isCurrentEntry) {
            setSaveStatus("error");
          }

          return {
            error:
              error instanceof Error ? error : new Error("The note was not saved."),
          };
        }
      };

      const queuedWrite = saveQueueRef.current.then(write, write);
      saveQueueRef.current = queuedWrite;
      return queuedWrite;
    },
    [setSaveStatus, supabase],
  );

  const flushPendingSave = useCallback(
    ({ quiet = false } = {}) => {
      if (activeFlushRef.current) return activeFlushRef.current;

      const flush = (async () => {
        if (saveTimerRef.current) {
          window.clearTimeout(saveTimerRef.current);
          saveTimerRef.current = null;
        }

        await saveQueueRef.current;

        for (let attempt = 0; attempt < 3; attempt += 1) {
          const draft = { ...latestDraftRef.current };
          if (!draft.isReady || !draft.userId) return true;
          if (isSaved(draft)) return true;

          const { error } = await persistEntry(draft, { quiet });
          if (error) return false;
        }

        return isSaved(latestDraftRef.current);
      })();

      const trackedFlush = flush.finally(() => {
        if (activeFlushRef.current === trackedFlush) {
          activeFlushRef.current = null;
        }
      });

      activeFlushRef.current = trackedFlush;
      return trackedFlush;
    },
    [isSaved, persistEntry],
  );

  const scheduleSave = useCallback(
    (draft) => {
      const timer = window.setTimeout(() => {
        saveTimerRef.current = null;
        void persistEntry(draft);
      }, SAVE_DELAY);
      saveTimerRef.current = timer;

      return () => {
        window.clearTimeout(timer);
        if (saveTimerRef.current === timer) saveTimerRef.current = null;
      };
    },
    [persistEntry],
  );

  const hasUnsavedDraft = useCallback(() => {
    const draft = latestDraftRef.current;
    return Boolean(draft.isReady && draft.userId && !isSaved(draft));
  }, [isSaved]);

  return {
    flushPendingSave,
    hasUnsavedDraft,
    isSaved,
    markSaved,
    scheduleSave,
    setLatestDraft,
  };
}

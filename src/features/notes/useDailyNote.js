import { useCallback, useEffect, useRef, useState } from "react";
import { getLocalDateKey } from "./date";
import { loadDailyNote, saveDailyNote } from "./dailyNoteRepository";
import { useNotePersistence } from "./useNotePersistence";

function createDraft({ content, entryDate, isReady, userId }) {
  return { content, entryDate, isReady, userId };
}

export function useDailyNote({ isActive, registerBeforeLeave, supabase, userId }) {
  const [todayKey, setTodayKey] = useState(() => getLocalDateKey());
  const [entryDate, setEntryDate] = useState(() => getLocalDateKey());
  const [content, setContent] = useState("");
  const [isNoteReady, setIsNoteReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const isMountedRef = useRef(true);
  const previousTodayRef = useRef(todayKey);
  const loadRequestRef = useRef(0);

  const {
    flushPendingSave,
    hasUnsavedDraft,
    isSaved,
    markSaved,
    scheduleSave,
    setLatestDraft,
  } = useNotePersistence({ setSaveStatus, supabase });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setLatestDraft(createDraft({ content, entryDate, isReady: isNoteReady, userId }));
  }, [content, entryDate, isNoteReady, setLatestDraft, userId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTodayKey(getLocalDateKey());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  const beginEntryChange = useCallback(
    (nextEntryDate) => {
      setLatestDraft(
        createDraft({
          content: "",
          entryDate: nextEntryDate,
          isReady: false,
          userId,
        }),
      );
      setContent("");
      setIsNoteReady(false);
      setSaveStatus("loading");
      setEntryDate(nextEntryDate);
    },
    [setLatestDraft, userId],
  );

  useEffect(() => {
    if (!isActive || !registerBeforeLeave) return undefined;
    return registerBeforeLeave(() => flushPendingSave());
  }, [flushPendingSave, isActive, registerBeforeLeave]);

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
    if (!isActive) return undefined;

    function warnBeforeUnload(event) {
      if (!hasUnsavedDraft()) return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasUnsavedDraft, isActive]);

  useEffect(() => {
    if (!supabase || !userId) {
      loadRequestRef.current += 1;
      return undefined;
    }

    const requestId = ++loadRequestRef.current;
    let isCurrentRequest = true;

    async function loadEntry() {
      setIsNoteReady(false);
      setSaveStatus("loading");

      const { data, error } = await loadDailyNote(supabase, {
        entryDate,
        userId,
      });

      if (!isCurrentRequest || requestId !== loadRequestRef.current) return;

      if (error) {
        setSaveStatus("error");
        return;
      }

      const nextDraft = createDraft({
        content: data?.content ?? "",
        entryDate,
        isReady: true,
        userId,
      });
      markSaved(nextDraft);
      setContent(nextDraft.content);
      setSaveStatus("saved");
      setIsNoteReady(true);
    }

    void loadEntry();

    return () => {
      isCurrentRequest = false;
    };
  }, [entryDate, markSaved, supabase, userId]);

  useEffect(() => {
    if (!supabase || !userId || !isNoteReady || !entryDate) return undefined;

    const draft = createDraft({
      content,
      entryDate,
      isReady: true,
      userId,
    });
    return isSaved(draft) ? undefined : scheduleSave(draft);
  }, [content, entryDate, isNoteReady, isSaved, scheduleSave, supabase, userId]);

  useEffect(() => {
    const previousToday = previousTodayRef.current;
    previousTodayRef.current = todayKey;

    if (previousToday === todayKey || entryDate !== previousToday) return;

    void (async () => {
      const canMove = await flushPendingSave();
      if (canMove && isMountedRef.current) beginEntryChange(todayKey);
    })();
  }, [beginEntryChange, entryDate, flushPendingSave, todayKey]);

  const updateContent = useCallback(
    (nextContent) => {
      setLatestDraft(
        createDraft({
          content: nextContent,
          entryDate,
          isReady: isNoteReady,
          userId,
        }),
      );
      setContent(nextContent);
      setSaveStatus("saving");
    },
    [entryDate, isNoteReady, setLatestDraft, userId],
  );

  const openEntry = useCallback(
    async (nextEntryDate) => {
      if (!nextEntryDate || nextEntryDate === entryDate) {
        return { error: null };
      }

      const canMove = await flushPendingSave();
      if (!canMove) {
        return { error: new Error("The current note was not saved.") };
      }

      beginEntryChange(nextEntryDate);
      return { error: null };
    },
    [beginEntryChange, entryDate, flushPendingSave],
  );

  const restoreVersion = useCallback(
    async (version) => {
      if (!supabase || !userId || !version.entry_date) {
        return { error: new Error("This version is unavailable.") };
      }

      const canMove = await flushPendingSave();
      if (!canMove) {
        return { error: new Error("The current note was not saved.") };
      }

      setSaveStatus("saving");
      const nextDraft = createDraft({
        content: version.content,
        entryDate: version.entry_date,
        isReady: true,
        userId,
      });
      const { error } = await saveDailyNote(supabase, nextDraft);

      if (error) {
        setSaveStatus("error");
        return { error };
      }

      markSaved(nextDraft);
      setEntryDate(nextDraft.entryDate);
      setContent(nextDraft.content);
      setIsNoteReady(true);
      setSaveStatus("saved");
      return { error: null };
    },
    [flushPendingSave, markSaved, supabase, userId],
  );

  return {
    content,
    entryDate,
    flushPendingSave,
    isNoteReady,
    openEntry,
    restoreVersion,
    saveStatus,
    todayKey,
    updateContent,
  };
}

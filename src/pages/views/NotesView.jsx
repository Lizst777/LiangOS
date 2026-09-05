import { useCallback, useEffect, useRef, useState } from "react";
import NotesEditor from "../../features/notes/NotesEditor";
import NotesGate from "../../features/notes/NotesGate";
import { useDailyNote } from "../../features/notes/useDailyNote";
import { exportPrivateData } from "../../features/private-data/exportPrivateData";
import { useOwnerSession } from "../../hooks/useOwnerSession";

const AUTH_MESSAGES = {
  error: "Unable to unlock",
  unavailable: "Connection unavailable",
};

const SAVE_STATUS_LABELS = {
  idle: "",
  loading: "Loading",
  saving: "Saving",
  saved: "Saved",
  error: "Not saved",
};

const EXPORT_STATUS_LABELS = {
  idle: "Export",
  exporting: "Exporting",
  exported: "Exported",
  error: "Not exported",
};

function NotesView({ isActive = false, registerBeforeLeave }) {
  const {
    client: supabase,
    ensureClient,
    isAvailable,
    user,
    signIn,
    signOut,
  } = useOwnerSession();

  const [password, setPassword] = useState("");
  const [authStatus, setAuthStatus] = useState(isAvailable ? "idle" : "unavailable");
  const [exportStatus, setExportStatus] = useState("idle");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [hasOpenedHistory, setHasOpenedHistory] = useState(false);
  const exportTimerRef = useRef(null);
  const userId = user?.id ?? null;

  const {
    content,
    entryDate,
    flushPendingSave,
    isNoteReady,
    openEntry,
    restoreVersion,
    saveStatus,
    todayKey,
    updateContent,
  } = useDailyNote({
    isActive,
    registerBeforeLeave,
    supabase,
    userId,
  });

  useEffect(() => {
    if (isActive) void ensureClient();
  }, [ensureClient, isActive]);

  useEffect(() => {
    return () => {
      if (exportTimerRef.current) window.clearTimeout(exportTimerRef.current);
    };
  }, []);

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

    exportTimerRef.current = window.setTimeout(() => {
      setExportStatus("idle");
    }, 1800);
  }

  async function requestHistory() {
    const canOpen = await flushPendingSave();
    if (!canOpen) return;

    setHasOpenedHistory(true);
    setIsHistoryOpen(true);
  }

  const closeHistory = useCallback(() => setIsHistoryOpen(false), []);

  function updatePassword(nextPassword) {
    setPassword(nextPassword);
    if (authStatus === "error") setAuthStatus("idle");
  }

  if (!user) {
    return (
      <NotesGate
        authMessage={AUTH_MESSAGES[authStatus] ?? ""}
        authStatus={authStatus}
        isActive={isActive}
        onPasswordChange={updatePassword}
        onSubmit={requestSignIn}
        password={password}
      />
    );
  }

  return (
    <NotesEditor
      content={content}
      entryDate={entryDate}
      exportLabel={EXPORT_STATUS_LABELS[exportStatus]}
      exportStatus={exportStatus}
      hasOpenedHistory={hasOpenedHistory}
      isActive={isActive}
      isHistoryOpen={isHistoryOpen}
      isNoteReady={isNoteReady}
      isToday={entryDate === todayKey}
      onCloseHistory={closeHistory}
      onContentChange={updateContent}
      onExport={() => void requestExport()}
      onOpenEntry={openEntry}
      onOpenHistory={() => void requestHistory()}
      onRestoreVersion={restoreVersion}
      onSignOut={() => void requestSignOut()}
      onToday={() => void openEntry(todayKey)}
      statusText={SAVE_STATUS_LABELS[saveStatus]}
      userId={userId}
    />
  );
}

export default NotesView;

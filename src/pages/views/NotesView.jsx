import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

const LEGACY_STORAGE_KEY = "liangos-notes-content";
const OWNER_EMAIL = "notes-owner@liangos.local";
const SAVE_DELAY = 700;

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
    // The cloud note is already saved, so a restricted browser needs no fallback.
  }
}

function NotesView() {
  const [session, setSession] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(!supabase);
  const [password, setPassword] = useState("");
  const [authStatus, setAuthStatus] = useState(supabase ? "idle" : "unavailable");
  const [content, setContent] = useState("");
  const [isNoteReady, setIsNoteReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const lastSavedContent = useRef("");
  const saveRequest = useRef(0);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!supabase) return undefined;

    let isActive = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isActive) return;

      setSession(data.session);
      setAuthStatus(error ? "error" : "idle");
      setIsAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isActive) return;

      setSession(nextSession);
      setIsAuthReady(true);
      if (nextSession) {
        setAuthStatus("idle");
      } else {
        saveRequest.current += 1;
        setContent("");
        setIsNoteReady(false);
        setSaveStatus("idle");
        lastSavedContent.current = "";
      }
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !userId) return undefined;

    let isActive = true;

    async function loadNote() {
      setIsNoteReady(false);
      setSaveStatus("loading");

      const { data, error } = await supabase
        .from("notes")
        .select("content")
        .eq("user_id", userId)
        .maybeSingle();

      if (!isActive) return;

      if (error) {
        setSaveStatus("error");
        setIsNoteReady(true);
        return;
      }

      let nextContent = data?.content ?? "";
      const legacyContent = data ? "" : getLegacyContent();
      let migrationFailed = false;

      if (legacyContent) {
        const { error: migrationError } = await supabase.from("notes").upsert({
          user_id: userId,
          content: legacyContent,
          updated_at: new Date().toISOString(),
        });

        if (!isActive) return;

        if (migrationError) {
          nextContent = legacyContent;
          migrationFailed = true;
        } else {
          nextContent = legacyContent;
          clearLegacyContent();
        }
      }

      lastSavedContent.current = migrationFailed ? "" : nextContent;
      setContent(nextContent);
      setSaveStatus(migrationFailed ? "error" : "saved");
      setIsNoteReady(true);
    }

    loadNote();

    return () => {
      isActive = false;
    };
  }, [userId]);

  useEffect(() => {
    if (
      !supabase ||
      !userId ||
      !isNoteReady ||
      content === lastSavedContent.current
    ) {
      return undefined;
    }

    const requestId = ++saveRequest.current;
    const timeout = window.setTimeout(async () => {
      const { error } = await supabase.from("notes").upsert({
        user_id: userId,
        content,
        updated_at: new Date().toISOString(),
      });

      if (requestId !== saveRequest.current) return;

      if (error) {
        setSaveStatus("error");
        return;
      }

      lastSavedContent.current = content;
      setSaveStatus("saved");
    }, SAVE_DELAY);

    return () => window.clearTimeout(timeout);
  }, [content, isNoteReady, userId]);

  async function requestSignIn(event) {
    event.preventDefault();
    if (!supabase || !password || authStatus === "sending") return;

    setAuthStatus("sending");

    const { error } = await supabase.auth.signInWithPassword({
      email: OWNER_EMAIL,
      password,
    });

    if (!error) setPassword("");
    setAuthStatus(error ? "error" : "sent");
  }

  async function signOut() {
    if (!supabase) return;

    await supabase.auth.signOut();
    setPassword("");
  }

  if (!isAuthReady) {
    return (
      <section className="notes-gate page-scroll" aria-label="Notes loading">
        <p className="notes-gate__status">正在连接</p>
      </section>
    );
  }

  if (!session) {
    const authMessage = {
      error: "无法解锁",
      unavailable: "连接不可用",
    }[authStatus];

    return (
      <section className="notes-gate page-scroll" aria-label="Sign in to notes">
        <form className="notes-gate__form" onSubmit={requestSignIn}>
          <input
            className="notes-gate__input"
            type="password"
            placeholder="密码"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (authStatus === "error") setAuthStatus("idle");
            }}
            autoComplete="current-password"
            aria-label="密码"
            required
          />
          <button
            className="notes-gate__button"
            type="submit"
            disabled={authStatus === "sending" || authStatus === "unavailable"}
          >
            {authStatus === "sending" ? "解锁中" : "解锁"}
          </button>
          <p className="notes-gate__status" aria-live="polite">
            {authMessage ?? ""}
          </p>
        </form>
      </section>
    );
  }

  const statusText = {
    loading: "读取中",
    saving: "保存中",
    saved: "已保存",
    error: "未保存",
  }[saveStatus];

  return (
    <section className="notes-editor page-scroll" aria-label="Notes">
      <textarea
        className="notes-editor__textarea"
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
        <button className="notes-editor__signout" type="button" onClick={signOut}>
          退出
        </button>
      </div>
    </section>
  );
}

export default NotesView;

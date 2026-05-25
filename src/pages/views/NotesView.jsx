import { useEffect, useState } from "react";

const NOTE_PASSWORD = "1191961314qweLHT";
const STORAGE_KEY = "liangos-notes-content";

function NotesView() {
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [content, setContent] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    if (!isUnlocked) return;

    try {
      localStorage.setItem(STORAGE_KEY, content);
    } catch {
      /* localStorage can be unavailable in restricted contexts. */
    }
  }, [content, isUnlocked]);

  function unlock() {
    if (password === NOTE_PASSWORD) {
      setIsUnlocked(true);
      setError("");
      return;
    }

    setError("Incorrect password");
  }

  if (!isUnlocked) {
    return (
      <section className="notes-gate page-scroll" aria-label="Unlock notes">
        <form
          className="notes-gate__form"
          onSubmit={(event) => {
            event.preventDefault();
            unlock();
          }}
        >
          <input
            className="notes-gate__input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            aria-label="Password"
          />
          <button className="notes-gate__button" type="submit">
            Unlock
          </button>
          {error && <p className="notes-gate__error">{error}</p>}
        </form>
      </section>
    );
  }

  return (
    <section className="notes-editor page-scroll" aria-label="Notes">
      <textarea
        className="notes-editor__textarea"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        autoFocus
        aria-label="Notes"
      />
      <button
        className="notes-editor__lock"
        type="button"
        onClick={() => {
          setIsUnlocked(false);
          setPassword("");
        }}
      >
        Lock
      </button>
    </section>
  );
}

export default NotesView;

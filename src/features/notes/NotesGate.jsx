import { useEffect, useRef } from "react";

function NotesGate({
  authMessage,
  authStatus,
  isActive,
  onPasswordChange,
  onSubmit,
  password,
}) {
  const passwordInputRef = useRef(null);

  useEffect(() => {
    if (!isActive) return undefined;

    const frame = window.requestAnimationFrame(() => {
      passwordInputRef.current?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isActive]);

  return (
    <section className="notes-gate page-scroll" aria-label="Sign in to notes">
      <form className="notes-gate__form" onSubmit={onSubmit}>
        <input
          className="notes-gate__input"
          ref={passwordInputRef}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
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
          {authMessage}
        </p>
      </form>
    </section>
  );
}

export default NotesGate;

function ConnectionStatus({ label = "Connecting", className = "" }) {
  const classes = ["connection-status", className].filter(Boolean).join(" ");

  return (
    <span
      className={classes}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-busy="true"
    >
      <span className="connection-status__label">{label}</span>
      <span className="connection-status__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </span>
  );
}

export default ConnectionStatus;

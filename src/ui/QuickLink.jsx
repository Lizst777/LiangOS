function QuickLink({ label, onClick }) {
  return (
    <button type="button" className="ui-quick-link" onClick={onClick}>
      <span>{label}</span>
      <span className="ui-quick-link__arrow" aria-hidden>
        →
      </span>
    </button>
  );
}

export default QuickLink;

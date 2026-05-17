function InfoRow({ label, value }) {
  return (
    <div className="ui-info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default InfoRow;

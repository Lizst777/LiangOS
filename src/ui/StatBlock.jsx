import Card from "./Card";

function StatBlock({ value, label, badge }) {
  return (
    <Card className="ui-stat">
      <div className="ui-stat__value">{value}</div>
      <div className="ui-stat__label">{label}</div>
      {badge && <span className="ui-stat__badge">{badge}</span>}
    </Card>
  );
}

export default StatBlock;

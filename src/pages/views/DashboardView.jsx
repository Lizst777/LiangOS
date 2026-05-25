import TimeDisplay from "../../ui/TimeDisplay";
import WeatherStatus from "../../ui/WeatherStatus";

function DashboardView() {
  return (
    <main className="workspace" aria-label="Overview">
      <div className="workspace__background" aria-hidden />
      <WeatherStatus />
      <TimeDisplay />
    </main>
  );
}

export default DashboardView;

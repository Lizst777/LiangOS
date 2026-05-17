import TimeCard from "../../ui/TimeCard";
import WeatherCard from "../../ui/WeatherCard";

function DashboardView() {
  return (
    <section className="bento">
      <section className="bento__span-6">
        <TimeCard />
      </section>

      <section className="bento__span-6">
        <WeatherCard />
      </section>
    </section>
  );
}

export default DashboardView;

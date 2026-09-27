import { useEffect, useState } from "react";

export default function ForecastStrip() {
  const [forecast, setForecast] = useState(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    fetch("/forecast.json")
      .then((r) => {
        if (!r.ok) throw new Error("no forecast file");
        return r.json();
      })
      .then(setForecast)
      .catch(() => setMissing(true));
  }, []);

  if (missing) {
    return (
      <section className="hero">
        <div className="hero__head">
          <h1>Today's forecast</h1>
          <p className="hero__sub">No forecast.json yet — run `python ai/export_forecast.py` and drop the output in frontend/public/.</p>
        </div>
      </section>
    );
  }

  if (!forecast) {
    return (
      <section className="hero">
        <div className="hero__head">
          <h1>Today's forecast</h1>
          <p className="hero__sub">Loading…</p>
        </div>
      </section>
    );
  }

  const rows = forecast.hours || [];
  const maxAbs = Math.max(1, ...rows.map((r) => Math.abs(r.predicted_surplus)));
  const sellHours = rows.filter((r) => r.predicted_surplus > 0).length;
  const totalSurplus = rows
    .filter((r) => r.predicted_surplus > 0)
    .reduce((s, r) => s + r.predicted_surplus, 0);

  return (
    <section className="hero">
      <div className="hero__head">
        <h1>Today's forecast — {forecast.location || "Bengaluru"}</h1>
        <p className="hero__sub">
          <span className="mono">{sellHours}</span> sellable hours ·{" "}
          <span className="mono">{totalSurplus.toFixed(2)} kWh</span> total surplus, from live weather
        </p>
      </div>
      <div className="forecaststrip" role="img" aria-label="Hourly predicted surplus and deficit">
        {rows.map((r) => {
          const height = Math.max(4, (Math.abs(r.predicted_surplus) / maxAbs) * 46);
          const sell = r.predicted_surplus > 0;
          return (
            <div className="forecaststrip__col" key={r.hour} title={`${r.hour}:00 — ${r.predicted_surplus} kWh`}>
              <div
                className={`forecaststrip__bar ${sell ? "forecaststrip__bar--sell" : "forecaststrip__bar--buy"}`}
                style={{ height: `${height}px` }}
              />
              {r.hour % 3 === 0 && <span className="forecaststrip__label mono">{r.hour}</span>}
            </div>
          );
        })}
      </div>
      <div className="hero__legend">
        <span><i className="dot dot--sell" /> surplus (sell)</span>
        <span><i className="dot dot--buy" /> deficit (buy)</span>
      </div>
    </section>
  );
}

import React, { useEffect, useState } from "react";

function riskPillClass(prob) {
  if (prob >= 0.7) return "high";
  if (prob >= 0.4) return "medium";
  return "low";
}

function riskLabel(prob) {
  if (prob >= 0.7) return "High";
  if (prob >= 0.4) return "Medium";
  return "Low";
}

function formatTime(ts) {
  if (!ts) return "—";
  try {
    const [date, time]    = ts.split("T");
    const [hh, mm]        = time.split(":");
    const [, month, day]  = date.split("-");
    return `${day}/${month} ${hh}:${mm}`;
  } catch {
    return ts;
  }
}

const PAGE_SIZE = 24;

export default function ForecastTable({ hourlyPredictions, total }) {
  // Reset "show all" whenever the predictions prop changes (new location selected)
  const [showAll, setShowAll] = useState(false);
  useEffect(() => { setShowAll(false); }, [hourlyPredictions]);

  if (!hourlyPredictions || hourlyPredictions.length === 0) return null;

  const rows = showAll ? hourlyPredictions : hourlyPredictions.slice(0, PAGE_SIZE);

  return (
    <section className="card" aria-label="Hourly forecast table">
      <div className="card-body">
        <div className="section-heading">
          <span className="icon" aria-hidden="true">📊</span>
          Hourly Forecast &amp; Bust Risk
          <span className="text-muted" style={{ marginLeft: "auto", fontSize: "0.75rem" }}>
            Showing {showAll ? rows.length : Math.min(PAGE_SIZE, hourlyPredictions.length)}{" "}
            of {total ?? hourlyPredictions.length} hours
          </span>
        </div>
        <p className="text-muted" style={{ marginBottom: 12, fontSize: "0.82rem" }}>
          Bust Prob = model-estimated probability that this hour's forecast may bust.
          Risk thresholds: Low &lt;40%, Medium 40–70%, High ≥70%.
        </p>

        <div className="forecast-table-wrap">
          <table className="forecast-table">
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Temp (°C)</th>
                <th scope="col">Humidity (%)</th>
                <th scope="col">Precip (mm)</th>
                <th scope="col">Wind (km/h)</th>
                <th scope="col">Bust Prob</th>
                <th scope="col">Risk</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((hour, idx) => {
                const wx   = hour.weather_data ?? {};
                const prob = hour.bust_probability ?? 0;
                const lvl  = riskPillClass(prob);

                return (
                  <tr key={idx}>
                    <td className="font-mono">{formatTime(hour.timestamp)}</td>
                    <td>{wx.temperature  ?? "—"}</td>
                    <td>{wx.humidity     ?? "—"}</td>
                    <td>{wx.precipitation ?? "—"}</td>
                    <td>{wx.wind_speed   ?? "—"}</td>
                    <td style={{ fontWeight: 600 }}>
                      {(prob * 100).toFixed(1)}%
                    </td>
                    <td>
                      <span
                        className={`risk-pill ${lvl}`}
                        aria-label={`Risk level: ${riskLabel(prob)}`}
                      >
                        {riskLabel(prob)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {hourlyPredictions.length > PAGE_SIZE && (
          <button
            className="quick-btn"
            style={{ marginTop: "12px", borderRadius: "6px" }}
            onClick={() => setShowAll((v) => !v)}
            aria-expanded={showAll}
            aria-controls="forecast-table-body"
          >
            {showAll
              ? "Show first 24 hours"
              : `Show all ${hourlyPredictions.length} hours`}
          </button>
        )}
      </div>
    </section>
  );
}

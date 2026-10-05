import React, { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/* ── Available weather variables ── */
const VARIABLES = [
  { key: "temperature",   label: "Temperature",  unit: "°C",   color: "#e65100" },
  { key: "humidity",      label: "Humidity",     unit: "%",    color: "#1565c0" },
  { key: "precipitation", label: "Precipitation",unit: "mm",   color: "#0288d1" },
  { key: "wind_speed",    label: "Wind Speed",   unit: "km/h", color: "#6a1b9a" },
];

/* ── Tick strategy ──────────────────────────────────────────── */
function buildTicks(data, maxTicks = 12) {
  if (!data || data.length === 0) return [];
  const step = Math.max(1, Math.floor(data.length / maxTicks));
  return data.map((d, i) => (i % step === 0 ? d.tickLabel : ''));
}

/* ================================================================
   WeatherTrendChart
   ================================================================ */
export default function WeatherTrendChart({ hourlyPredictions }) {
  const [activeVar, setActiveVar] = useState(VARIABLES[0]);

  /* ── Derive chart data ─────────────────────────────────────── */
  const chartData = useMemo(() => {
    if (!hourlyPredictions || hourlyPredictions.length === 0) return [];
    return hourlyPredictions.map((h) => {
      let tickLabel    = h.timestamp;
      let fullTimestamp = h.timestamp;
      try {
        const [date, time] = h.timestamp.split("T");
        const [, mm, dd]   = date.split("-");
        const [hh, min]    = time.split(":");
        tickLabel    = `${dd}/${mm} ${hh}:${min}`;
        fullTimestamp = `${dd}/${mm} ${hh}:${min}`;
      } catch (_) {}

      const raw = h.weather_data?.[activeVar.key];
      return {
        tickLabel,
        fullTimestamp,
        value: raw !== undefined && raw !== null ? parseFloat(raw) : null,
      };
    });
  }, [hourlyPredictions, activeVar]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <p className="text-muted">No forecast data available.</p>
        </div>
      </div>
    );
  }

  const labels = buildTicks(chartData, 12);

  const data = {
    labels: chartData.map(d => d.tickLabel),
    datasets: [
      {
        label: `${activeVar.label} (${activeVar.unit})`,
        data: chartData.map(d => d.value),
        fill: false,
        borderColor: activeVar.color,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 2,
        spanGaps: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#1a2a3a',
        bodyColor: activeVar.color,
        borderColor: '#dde3eb',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          title: (context) => chartData[context[0].dataIndex].fullTimestamp,
          label: (context) => {
            let val = context.raw;
            return `${activeVar.label}: ${val !== null && val !== undefined ? val : '—'} ${activeVar.unit}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxTicksLimit: 12,
          color: '#5a7080',
          font: { size: 10 },
          callback: function(value, index, values) {
            return labels[index] || '';
          }
        },
      },
      y: {
        grid: {
          color: '#eef1f5',
          drawBorder: false,
        },
        ticks: {
          callback: (value) => `${value}${activeVar.unit}`,
          color: '#5a7080',
          font: { size: 11 },
        }
      }
    }
  };

  return (
    <section className="card" aria-label="Weather trend chart">
      <div className="card-body">
        {/* ── Header ─────────────────────────────────────── */}
        <div
          className="section-heading"
          style={{ flexWrap: "wrap", gap: 12 }}
        >
          <span>
            <span className="icon" aria-hidden="true">🌤️</span>
            Weather Forecast Trend
          </span>

          {/* ── Variable selector ──────────────────────── */}
          <div
            role="group"
            aria-label="Select weather variable"
            style={{ display: "flex", gap: 6, flexWrap: "wrap", marginLeft: "auto" }}
          >
            {VARIABLES.map((v) => (
              <button
                key={v.key}
                className={`quick-btn${activeVar.key === v.key ? " active" : ""}`}
                style={{ padding: "4px 12px", fontSize: "0.75rem", borderRadius: 4 }}
                onClick={() => setActiveVar(v)}
                aria-pressed={activeVar.key === v.key}
                aria-label={`Show ${v.label} trend`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-muted" style={{ marginBottom: 16 }}>
          Hourly forecast conditions for the selected location.
          Showing: <strong>{activeVar.label}</strong> ({activeVar.unit})
        </p>

        {/* ── Chart ──────────────────────────────────────── */}
        <div style={{ height: 260, width: '100%' }}>
          <Line data={data} options={options} />
        </div>
      </div>
    </section>
  );
}

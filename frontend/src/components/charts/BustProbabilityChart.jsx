import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
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
  Filler,
  Legend
);

/* ── Risk helpers (same thresholds as backend) ─────────────── */
function riskLabel(prob) {
  if (prob >= 0.7) return "High";
  if (prob >= 0.4) return "Medium";
  return "Low";
}
function riskColor(prob) {
  if (prob >= 0.7) return "#c62828";
  if (prob >= 0.4) return "#e65100";
  return "#2e7d32";
}

/* ── Tick strategy: show every Nth label so X-axis is readable ─ */
function buildTicks(data, maxTicks = 12) {
  if (!data || data.length === 0) return [];
  const step = Math.max(1, Math.floor(data.length / maxTicks));
  return data.map((d, i) => (i % step === 0 ? d.tickLabel : ''));
}

/* ================================================================
   BustProbabilityChart
   ================================================================ */
export default function BustProbabilityChart({ hourlyPredictions }) {
  /* ── Derive chart data from real API response ─────────── */
  const chartData = useMemo(() => {
    if (!hourlyPredictions || hourlyPredictions.length === 0) return [];
    return hourlyPredictions.map((h) => {
      let tickLabel = h.timestamp;
      let fullTimestamp = h.timestamp;
      try {
        const [date, time] = h.timestamp.split("T");
        const [, mm, dd]   = date.split("-");
        const [hh, min]    = time.split(":");
        tickLabel    = `${dd}/${mm} ${hh}:${min}`;
        fullTimestamp = `${dd}/${mm} ${hh}:${min}`;
      } catch (_) {}

      return {
        tickLabel,
        fullTimestamp,
        probability: parseFloat((h.bust_probability * 100).toFixed(2)),
      };
    });
  }, [hourlyPredictions]);

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
        label: 'Bust Probability (%)',
        data: chartData.map(d => d.probability),
        fill: true,
        backgroundColor: 'rgba(21, 101, 192, 0.1)',
        borderColor: '#1565c0',
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 2,
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
        bodyColor: '#5a7080',
        borderColor: '#dde3eb',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          title: (context) => {
            return chartData[context[0].dataIndex].fullTimestamp;
          },
          label: (context) => {
            const prob = context.raw / 100;
            return [
              `Bust Prob: ${context.raw.toFixed(2)}%`,
              `Risk Level: ${riskLabel(prob)}`
            ];
          },
          labelTextColor: (context) => {
             const prob = context.raw / 100;
             return riskColor(prob);
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
        min: 0,
        max: 100,
        grid: {
          color: '#eef1f5',
          drawBorder: false,
        },
        ticks: {
          callback: (value) => `${value}%`,
          color: '#5a7080',
          font: { size: 11 },
          stepSize: 20
        }
      }
    }
  };

  return (
    <section className="card" aria-label="Bust probability chart">
      <div className="card-body">
        {/* ── Header ─────────────────────────────────────── */}
        <div className="section-heading">
          <span className="icon" aria-hidden="true">⚡</span>
          Forecast Bust Probability
        </div>
        <p className="text-muted" style={{ marginBottom: 16 }}>
          Hourly probability of forecast bust risk across the 7-day horizon.
          Thresholds: Low &lt;40%, Medium 40–70%, High ≥70%.
        </p>

        {/* ── Chart ──────────────────────────────────────── */}
        <div style={{ height: 280, width: '100%' }}>
          <Line data={data} options={options} />
        </div>
      </div>
    </section>
  );
}

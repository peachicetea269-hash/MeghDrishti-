import React, { useMemo } from "react";
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

function riskColor(level) {
  if (level === "High") return "#c62828";
  if (level === "Medium") return "#e65100";
  return "#2e7d32";
}

export default function LeadTimeRiskPanel({ data, loading, error }) {
  const processedDays = useMemo(() => {
    if (!data || !data.locations) return null;

    const validLocations = data.locations.filter((loc) => loc.status === "success");
    if (validLocations.length === 0) return [];

    const dates = validLocations[0].daily.map((d) => d.date);

    const dayMetrics = dates.map((dateStr, index) => {
      let highCount = 0;
      let medCount = 0;
      let lowCount = 0;
      let sumAvg = 0;
      let maxPeak = -1;

      validLocations.forEach((loc) => {
        const dayStats = loc.daily.find((d) => d.date === dateStr);
        if (dayStats) {
          sumAvg += dayStats.average_bust_probability;
          
          if (dayStats.peak_bust_probability > maxPeak) {
            maxPeak = dayStats.peak_bust_probability;
          }

          if (dayStats.risk_level === "High") highCount++;
          else if (dayStats.risk_level === "Medium") medCount++;
          else lowCount++;
        }
      });

      const avgRegionalRisk = sumAvg / validLocations.length;
      const peakRegionalRisk = maxPeak >= 0 ? maxPeak : 0;

      let overallDayRisk = "Low";
      if (peakRegionalRisk >= 0.7) overallDayRisk = "High";
      else if (peakRegionalRisk >= 0.4) overallDayRisk = "Medium";

      return {
        dayLabel: `Day ${index + 1}`,
        date: dateStr,
        averageRegionalRisk: parseFloat((avgRegionalRisk * 100).toFixed(1)),
        peakRegionalRisk: parseFloat((peakRegionalRisk * 100).toFixed(1)),
        overallRisk: overallDayRisk,
        highCount,
        medCount,
        lowCount,
      };
    });

    return dayMetrics;
  }, [data]);

  if (loading) {
    return (
      <section className="card">
        <div className="card-body" style={{ minHeight: "350px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="text-muted">Loading 10-day bust-risk analysis...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card">
        <div className="card-body">
          <div className="error-banner" role="alert">
            <span className="error-banner-icon">⚠️</span>
            <div className="error-banner-text">
              <div className="error-banner-msg">Unable to load 10-day bust-risk analysis.</div>
              <div style={{ marginTop: "4px", opacity: 0.85 }}>{error}</div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!processedDays || processedDays.length === 0) {
    return null;
  }

  const validCount = data.locations.filter(l => l.status === "success").length;

  const chartData = {
    labels: processedDays.map(d => d.dayLabel),
    datasets: [
      {
        label: 'Average Regional Bust Risk',
        data: processedDays.map(d => d.averageRegionalRisk),
        borderColor: '#1976d2',
        backgroundColor: '#1976d2',
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: 'Peak Regional Bust Risk',
        data: processedDays.map(d => d.peakRegionalRisk),
        borderColor: '#d32f2f',
        backgroundColor: '#d32f2f',
        tension: 0.4,
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 3,
        pointHoverRadius: 6,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#1a2a3a',
        bodyColor: '#5a7080',
        borderColor: '#dde3eb',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw}%`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#666', font: { size: 12 } }
      },
      y: {
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Forecast Bust Probability (%)',
          color: '#444',
          font: { size: 13, weight: 'bold' }
        },
        grid: {
          color: (context) => {
            if (context.tick.value === 70) return '#c62828';
            if (context.tick.value === 40) return '#e65100';
            return '#e0e0e0';
          },
          borderDash: (context) => {
            if (context.tick.value === 70 || context.tick.value === 40) return [3, 3];
            return [];
          },
          lineWidth: (context) => {
            if (context.tick.value === 70 || context.tick.value === 40) return 2;
            return 1;
          },
          drawBorder: false,
        },
        ticks: {
          callback: (value) => `${value}%`,
          color: '#666',
          font: { size: 12 },
          stepSize: 20
        }
      }
    }
  };

  return (
    <section className="card" aria-label="10-Day Forecast Bust Risk">
      <div className="card-body" style={{ padding: "20px 20px 0" }}>
        
        <div className="section-heading" style={{ marginBottom: "4px" }}>
          <span className="icon" aria-hidden="true">📈</span>
          10-Day Forecast Bust Risk
        </div>
        <p className="text-muted" style={{ fontSize: "0.85rem", margin: 0, paddingBottom: "10px" }}>
          How estimated forecast-bust risk changes across the medium-range forecast horizon
        </p>
        <p style={{ fontSize: "0.75rem", fontStyle: "italic", color: "#666", marginBottom: "16px" }}>
          Risk values represent the AI model's estimated probability of forecast bust for the selected forecast horizon. They are not verified forecast-confidence percentages. Based on {validCount} available regions.
        </p>

        <div style={{ height: "300px", width: "100%", paddingBottom: "10px" }}>
          <Line data={chartData} options={chartOptions} />
        </div>

      </div>

      <div style={{ 
        display: "flex", 
        overflowX: "auto", 
        gap: "12px", 
        padding: "20px",
        background: "var(--clr-bg)",
        borderTop: "1px solid var(--clr-border)",
        borderBottomLeftRadius: "var(--radius)",
        borderBottomRightRadius: "var(--radius)"
      }}>
        {processedDays.map((day) => (
          <div key={day.date} style={{ 
            minWidth: "150px", 
            background: "#fff",
            border: "1px solid var(--clr-border)",
            borderRadius: "8px",
            padding: "12px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
          }}>
            <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{day.dayLabel}</div>
            <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "8px" }}>
              {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </div>
            
            <div style={{ fontSize: "0.85rem", display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ color: "#666" }}>Avg:</span>
              <strong style={{ color: "#1976d2" }}>{day.averageRegionalRisk}%</strong>
            </div>
            <div style={{ fontSize: "0.85rem", display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "#666" }}>Peak:</span>
              <strong>{day.peakRegionalRisk}%</strong>
            </div>
            
            <div style={{ 
              fontSize: "0.8rem", 
              paddingTop: "6px", 
              borderTop: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span style={{ color: "#666" }}>Risk:</span>
              <span style={{ 
                color: riskColor(day.overallRisk),
                fontWeight: 600,
                background: `${riskColor(day.overallRisk)}15`,
                padding: "2px 6px",
                borderRadius: "4px"
              }}>
                {day.overallRisk}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

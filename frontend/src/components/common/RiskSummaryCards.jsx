import React from "react";

function riskClass(level) {
  if (level === "High")   return "high";
  if (level === "Medium") return "medium";
  if (level === "Low")    return "low";
  return "";
}

function formatTimestamp(ts) {
  if (!ts) return "—";
  try {
    const [datePart, timePart] = ts.split("T");
    const [year, month, day]   = datePart.split("-");
    const [hh, mm]             = timePart.split(":");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[parseInt(month,10)-1]} ${parseInt(day,10)}, ${hh}:${mm}`;
  } catch {
    return ts.replace("T", " ");
  }
}

export default function RiskSummaryCards({ summary }) {
  if (!summary) return null;

  const risk = summary.overall_risk_level;
  const rc   = riskClass(risk);

  // Peak probability value (0–1) for colour logic
  const peakProb = summary.peak_bust_probability;

  const cards = [
    {
      label:      "Overall Risk",
      value:      risk ?? "—",
      sub:        "Application-level bust assessment",
      valueClass: `kpi-risk-${rc || "default"}`,
      cardClass:  `risk-${rc || "accent"}`,
    },
    {
      label:      "Peak Bust Probability",
      value:      peakProb != null
        ? `${(peakProb * 100).toFixed(1)}%`
        : "—",
      sub:        "Model-estimated probability of forecast bust",
      valueClass: peakProb >= 0.7 ? "kpi-risk-high"
                : peakProb >= 0.4 ? "kpi-risk-medium"
                : "kpi-risk-low",
      cardClass: "risk-accent",
    },
    {
      label:      "Peak Risk Time",
      value: (() => {
        const ts = summary.peak_probability_timestamp;
        if (!ts) return "—";
        try { return ts.split("T")[1].slice(0, 5); } catch { return "—"; }
      })(),
      sub:        formatTimestamp(summary.peak_probability_timestamp),
      valueClass: "",
      cardClass:  "risk-accent",
    },
    {
      label:      "Model Version",
      value:      summary.model_version ?? "Unavailable",
      sub:        `${summary.total_hourly_predictions ?? "—"} hourly predictions · from backend`,
      valueClass: "font-mono",
      cardClass:  "risk-accent",
    },
  ];

  return (
    <div className="kpi-grid" role="region" aria-label="Risk summary KPI cards">
      {cards.map((c) => (
        <div key={c.label} className={`kpi-card ${c.cardClass}`}>
          <div className="kpi-label">{c.label}</div>
          <div className={`kpi-value ${c.valueClass}`}>{c.value}</div>
          <div className="kpi-sub">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}

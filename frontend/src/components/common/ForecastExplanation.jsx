import React, { useMemo } from "react";

export default function ForecastExplanation({ summary, hourlyPredictions }) {
  // Find the explanation for the peak bust probability hour
  const peakExplanation = useMemo(() => {
    if (!summary || !hourlyPredictions) return null;
    
    const peakHour = hourlyPredictions.find(
      h => h.timestamp === summary.peak_probability_timestamp
    );
    
    if (!peakHour || !peakHour.explanation) return null;
    return peakHour.explanation;
  }, [summary, hourlyPredictions]);

  if (!peakExplanation || !peakExplanation.available) {
    return null; // Fail gracefully without breaking UI
  }

  return (
    <section className="card" aria-label="Model explainability">
      <div className="card-body">
        <div className="section-heading">
          <span className="icon" aria-hidden="true">🧠</span>
          Top meteorological factors influencing this prediction
        </div>
        
        <p className="text-muted" style={{ marginBottom: 14, fontSize: "0.85rem", lineHeight: 1.5 }}>
          Model factors associated with elevated bust risk at peak hour (<strong>
          {summary.peak_probability_timestamp ? summary.peak_probability_timestamp.split('T')[1].slice(0,5) : ''}
          </strong>):
        </p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {peakExplanation.top_factors.map((factor, idx) => (
            <div 
              key={idx} 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                padding: "10px 12px", 
                background: "var(--clr-accent-lt)", 
                borderRadius: "6px" 
              }}
            >
              <div style={{ flex: 1 }}>
                <strong style={{ color: "var(--clr-text-dark)", fontSize: "0.95rem" }}>
                  {factor.label}
                </strong>
                <span style={{ marginLeft: "8px", color: "var(--clr-text-light)", fontSize: "0.85rem" }}>
                  ({factor.value} {factor.unit})
                </span>
              </div>
              <div 
                style={{ 
                  fontSize: "0.85rem", 
                  fontWeight: 600,
                  color: factor.direction === "increases_bust_risk" ? "#c62828" : "#2e7d32" 
                }}
              >
                {factor.direction === "increases_bust_risk" ? "↑ Increases risk" : "↓ Decreases risk"}
              </div>
            </div>
          ))}
          {peakExplanation.top_factors.length === 0 && (
            <div className="text-muted" style={{ fontSize: "0.85rem" }}>
              No primary meteorological factors identified for this hour.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

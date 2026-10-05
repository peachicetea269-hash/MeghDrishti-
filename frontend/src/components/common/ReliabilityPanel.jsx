import React from "react";

export default function ReliabilityPanel({ reliabilityData, onRetry }) {
  if (!reliabilityData) return null;

  if (reliabilityData.error) {
    return (
      <section className="card" aria-label="Forecast reliability panel">
        <div className="card-body">
          <div className="section-heading">
            <span className="icon" aria-hidden="true">🔍</span>
            Historical Forecast Verification
          </div>
          <div className="error-banner" role="alert" aria-live="assertive">
            <span className="error-banner-icon" aria-hidden="true">⚠️</span>
            <div className="error-banner-text">
              <div className="error-banner-msg">Unable to load historical verification data.</div>
              <div style={{ marginTop: "4px", opacity: 0.85 }}>{reliabilityData.message}</div>
              {onRetry && (
                <button className="retry-btn" onClick={onRetry}>
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const isInsufficient = reliabilityData.status === "insufficient_data";

  return (
    <section className="card" aria-label="Forecast reliability panel">
      <div className="card-body">
        <div className="section-heading">
          <span className="icon" aria-hidden="true">🔍</span>
          Historical Forecast Verification
        </div>

        {/* Conceptual explainer */}
        <div
          style={{
            background: "var(--clr-accent-lt)",
            borderRadius: "var(--radius-sm)",
            padding: "12px 14px",
            marginBottom: "14px",
            fontSize: "0.85rem",
            lineHeight: 1.65,
          }}
        >
          <strong>Forecast Bust Risk</strong> — forward-looking model probability
          that the NWP weather forecast will be wrong for this hour.
          <br />
          <strong>Forecast Reliability</strong> — backward-looking historical
          verification comparing past NWP forecasts against actual observed ground data.
          These are two distinct, independent metrics.
        </div>

        {isInsufficient ? (
          <div className="reliability-notice informational" role="status" aria-live="polite">
            <span aria-hidden="true" style={{ fontSize: "1.2rem", flexShrink: 0 }}>📊</span>
            <div style={{ width: "100%" }}>
              <strong>Verification data is being accumulated from real forecast snapshots.</strong>
              <p style={{ margin: "5px 0 12px", lineHeight: 1.55 }}>
                Historical reliability is calculated by comparing previously issued forecasts with corresponding actual weather observations. Metrics will appear once sufficient forecast-vs-actual pairs are available.
              </p>

              {/* Explanation of pipeline */}
              <div style={{ background: "rgba(255,255,255,0.6)", padding: "12px", borderRadius: "var(--radius-sm)", marginBottom: "14px" }}>
                <div className="pipeline-explainer">
                  <div className="pipeline-step">Forecast Snapshot</div>
                  <div className="pipeline-arrow">↓</div>
                  <div className="pipeline-step">Actual Weather</div>
                  <div className="pipeline-arrow">↓</div>
                  <div className="pipeline-step">Forecast vs Actual</div>
                  <div className="pipeline-arrow">↓</div>
                  <div className="pipeline-step">Reliability Metrics</div>
                </div>
                <p style={{ margin: "10px 0 0", fontSize: "0.8rem", color: "var(--clr-text)", textAlign: "center" }}>
                  MeghDrishti stores generated forecasts so they can later be verified against historical actual weather.
                </p>
              </div>

              {/* Compact Status Section */}
              <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: "12px" }}>
                <strong style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--clr-text-muted)" }}>Verification Status</strong>
                <div style={{ fontWeight: "700", color: "var(--clr-accent)", marginBottom: "10px", fontSize: "0.9rem" }}>COLLECTING DATA</div>
                
                <div className="reliability-metrics" style={{ marginTop: 0 }}>
                  <div className="reliability-metric">
                    <div className="reliability-metric-label">Forecast snapshots</div>
                    <div className="reliability-metric-value" style={{ fontSize: "0.95rem" }}>Active</div>
                  </div>
                  <div className="reliability-metric">
                    <div className="reliability-metric-label">Historical forecast-vs-actual pairs</div>
                    <div className="reliability-metric-value" style={{ fontSize: "0.95rem" }}>Not yet available</div>
                  </div>
                  <div className="reliability-metric">
                    <div className="reliability-metric-label">Reliability metrics</div>
                    <div className="reliability-metric-value" style={{ fontSize: "0.95rem" }}>Awaiting sufficient data</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="reliability-notice calculated" role="status">
            <span aria-hidden="true" style={{ fontSize: "1.2rem", flexShrink: 0 }}>✅</span>
            <div style={{ width: "100%" }}>
              <strong>Historical Verification Metrics</strong>
              <p style={{ margin: "4px 0 10px", fontSize: "0.8rem", opacity: 0.8 }}>
                Based on past forecast-vs-observed comparisons returned by the backend.
              </p>
              <div className="reliability-metrics">
                {reliabilityData.metrics?.temperature_mae !== undefined && (
                  <div className="reliability-metric">
                    <div className="reliability-metric-label">Temp MAE</div>
                    <div className="reliability-metric-value">
                      {reliabilityData.metrics.temperature_mae}°C
                    </div>
                  </div>
                )}
                {reliabilityData.metrics?.temperature_rmse !== undefined && (
                  <div className="reliability-metric">
                    <div className="reliability-metric-label">Temp RMSE</div>
                    <div className="reliability-metric-value">
                      {reliabilityData.metrics.temperature_rmse}°C
                    </div>
                  </div>
                )}
                {reliabilityData.metrics?.humidity_mae !== undefined && (
                  <div className="reliability-metric">
                    <div className="reliability-metric-label">Humidity MAE</div>
                    <div className="reliability-metric-value">
                      {reliabilityData.metrics.humidity_mae}%
                    </div>
                  </div>
                )}
                {reliabilityData.metrics?.samples !== undefined && (
                  <div className="reliability-metric">
                    <div className="reliability-metric-label">Verification Samples</div>
                    <div className="reliability-metric-value">
                      {reliabilityData.metrics.samples}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

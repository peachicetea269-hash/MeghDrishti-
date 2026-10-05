import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { fetchRegionalConfidence } from "../../services/api";

// ── Helpers ────────────────────────────────────────────────────────
function riskColor(level) {
  if (level === "High") return "#c62828";
  if (level === "Medium") return "#e65100";
  return "#2e7d32";
}

// Ensure the map bounds encompass all of Maharashtra reasonably
const MAHARASHTRA_BOUNDS = [
  [15.5, 72.5], // South-West
  [22.0, 81.0], // North-East
];

function BoundsEnforcer() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(MAHARASHTRA_BOUNDS, { padding: [20, 20] });
  }, [map]);
  return null;
}

export default function RegionalForecastRiskMap({ data, loading, error }) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // ── Derived State ────────────────────────────────────────────────
  const processedData = useMemo(() => {
    if (!data || !data.locations) return null;

    // Filter out failed locations entirely from processing for safety
    const successfulLocations = data.locations.filter((loc) => loc.status === "success");

    // Gather all unique dates from the first successful location to build our Day tabs
    // Note: We assume all locations have the same forecast days aligned.
    let availableDates = [];
    if (successfulLocations.length > 0) {
      availableDates = successfulLocations[0].daily.map((d) => d.date);
    }

    const currentDateStr = availableDates[selectedDayIndex];

    // Compute summary for the selected day
    let highCount = 0;
    let medCount = 0;
    let lowCount = 0;
    let highestBust = -1;
    let highestLocName = "None";

    const activeMarkers = [];

    successfulLocations.forEach((loc) => {
      const dayData = loc.daily.find((d) => d.date === currentDateStr);
      if (dayData) {
        activeMarkers.push({
          location: loc.location,
          latitude: loc.latitude,
          longitude: loc.longitude,
          ...dayData,
        });

        if (dayData.risk_level === "High") highCount++;
        else if (dayData.risk_level === "Medium") medCount++;
        else lowCount++;

        if (dayData.peak_bust_probability > highestBust) {
          highestBust = dayData.peak_bust_probability;
          highestLocName = loc.location;
        }
      }
    });

    return {
      availableDates,
      currentDateStr,
      activeMarkers,
      summary: {
        highCount,
        medCount,
        lowCount,
        highestLocName,
        highestBust: highestBust >= 0 ? highestBust : null,
      },
      hasFailedLocations: successfulLocations.length < data.locations.length,
    };
  }, [data, selectedDayIndex]);

  // ── Render States ────────────────────────────────────────────────
  if (loading) {
    return (
      <section className="card" aria-label="10-Day Forecast Bust Risk Map">
        <div className="card-body" style={{ minHeight: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="text-muted">Loading 10-day regional forecast risk...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card" aria-label="10-Day Forecast Bust Risk Map">
        <div className="card-body">
          <div className="error-banner" role="alert">
            <span className="error-banner-icon">⚠️</span>
            <div className="error-banner-text">
              <div className="error-banner-msg">Unable to load regional forecast risk.</div>
              <div style={{ marginTop: "4px", opacity: 0.85 }}>{error}</div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!processedData || processedData.availableDates.length === 0) {
    return null; // Silent fail if no data structure returned
  }

  const { availableDates, currentDateStr, activeMarkers, summary, hasFailedLocations } = processedData;

  return (
    <section className="card" aria-label="10-Day Forecast Bust Risk Map">
      <div className="card-body" style={{ padding: "0" }}>
        
        {/* Header & Subtitle */}
        <div style={{ padding: "20px 20px 10px" }}>
          <div className="section-heading" style={{ marginBottom: "4px" }}>
            <span className="icon" aria-hidden="true">🗺️</span>
            10-Day Forecast Bust Risk Map
          </div>
          <p className="text-muted" style={{ fontSize: "0.85rem", margin: 0 }}>
            AI-estimated forecast bust risk across supported Maharashtra regions
          </p>
          {hasFailedLocations && (
            <p style={{ fontSize: "0.8rem", color: "#e65100", margin: "4px 0 0" }}>
              * Some regional forecasts are temporarily unavailable.
            </p>
          )}
        </div>

        {/* Day Selector Tabs */}
        <div 
          role="tablist"
          aria-label="Forecast day selection"
          style={{ 
            display: "flex", 
            overflowX: "auto", 
            gap: "8px", 
            padding: "0 20px 14px",
            borderBottom: "1px solid var(--clr-border)"
          }}
        >
          {availableDates.map((dateStr, idx) => {
            const isActive = idx === selectedDayIndex;
            return (
              <button
                key={dateStr}
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedDayIndex(idx)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  border: `1px solid ${isActive ? "var(--clr-accent)" : "var(--clr-border)"}`,
                  background: isActive ? "var(--clr-accent)" : "transparent",
                  color: isActive ? "#fff" : "var(--clr-text)",
                  fontSize: "0.85rem",
                  fontWeight: isActive ? 600 : 400,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s"
                }}
              >
                Day {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Summary Strip */}
        <div style={{ 
          display: "flex", 
          flexWrap: "wrap",
          gap: "16px",
          padding: "12px 20px", 
          background: "var(--clr-bg)",
          fontSize: "0.85rem"
        }}>
          <div><strong>Date:</strong> {currentDateStr}</div>
          <div>
            <strong>Risk Spread:</strong>&nbsp;
            <span style={{ color: "#c62828" }}>{summary.highCount} High</span> ·&nbsp;
            <span style={{ color: "#e65100" }}>{summary.medCount} Med</span> ·&nbsp;
            <span style={{ color: "#2e7d32" }}>{summary.lowCount} Low</span>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <strong>Highest Bust Risk:</strong> {summary.highestLocName} 
            {summary.highestBust !== null ? ` — ${(summary.highestBust * 100).toFixed(1)}%` : ""}
          </div>
        </div>

        {/* Map Container */}
        <div style={{ height: "450px", width: "100%", position: "relative" }}>
          <MapContainer 
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%" }}
            attributionControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
            <BoundsEnforcer />

            {activeMarkers.map((marker) => (
              <CircleMarker
                key={marker.location}
                center={[marker.latitude, marker.longitude]}
                radius={8}
                pathOptions={{
                  fillColor: riskColor(marker.risk_level),
                  fillOpacity: 0.9,
                  color: "#fff",
                  weight: 2
                }}
              >
                <Popup>
                  <div style={{ minWidth: "160px" }}>
                    <h3 style={{ margin: "0 0 8px", fontSize: "1rem" }}>{marker.location}</h3>
                    <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "8px" }}>
                      Date: {marker.date}
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span>Peak Bust Risk:</span>
                      <strong>{(marker.peak_bust_probability * 100).toFixed(1)}%</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span>Average Bust Risk:</span>
                      <strong>{(marker.average_bust_probability * 100).toFixed(1)}%</strong>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid #eee" }}>
                      <span>Risk Level:</span>
                      <strong style={{ color: riskColor(marker.risk_level) }}>
                        {marker.risk_level.toUpperCase()}
                      </strong>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* Compact Legend overlay */}
          <div style={{
            position: "absolute",
            bottom: "20px",
            right: "20px",
            zIndex: 1000,
            background: "rgba(255,255,255,0.95)",
            padding: "10px",
            borderRadius: "6px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            fontSize: "0.75rem",
            pointerEvents: "none"
          }}>
            <div style={{ fontWeight: 600, marginBottom: "6px" }}>Forecast Bust Risk</div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#c62828" }}></div>
              <span>High (≥ 70%)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#e65100" }}></div>
              <span>Medium (40–69%)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#2e7d32" }}></div>
              <span>Low (&lt; 40%)</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

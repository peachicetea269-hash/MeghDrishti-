import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix missing marker icons in leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Create custom icons based on risk
const getRiskIcon = (riskLevel) => {
  let color = "blue"; // default
  if (riskLevel === "High") color = "red";
  else if (riskLevel === "Medium") color = "orange";
  else if (riskLevel === "Low") color = "green";

  // Use raw SVG data URI for custom colored markers
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2) {
      map.flyTo(center, 11, { animate: true, duration: 1.5 });
    }
  }, [center, map]);
  return null;
};

export default function WeatherRiskMap({ locationName, latitude, longitude, riskLevel, peakProbability }) {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return (
      <div style={{ padding: "40px", background: "#f8f9fa", border: "1px dashed #dee2e6", borderRadius: "8px", textAlign: "center", color: "#6c757d" }}>
        No valid coordinates available. Please search or select a location to view the map.
      </div>
    );
  }

  const center = [latitude, longitude];
  const icon = getRiskIcon(riskLevel);

  return (
    <div style={{ height: "400px", width: "100%", borderRadius: "8px", overflow: "hidden", border: "1px solid #dee2e6" }}>
      <MapContainer center={center} zoom={11} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} />
        <Marker position={center} icon={icon}>
          <Popup>
            <div style={{ textAlign: "center", minWidth: "120px" }}>
              <h4 style={{ margin: "0 0 5px 0" }}>{locationName}</h4>
              <p style={{ margin: "0 0 10px 0", fontSize: "0.85rem", color: "#6c757d" }}>
                Lat: {latitude.toFixed(4)}<br/>Lon: {longitude.toFixed(4)}
              </p>
              {riskLevel && (
                <div style={{ padding: "5px", background: "#f8f9fa", borderRadius: "4px", border: "1px solid #e9ecef" }}>
                  <div style={{ fontWeight: "bold", color: riskLevel === "High" ? "#dc3545" : (riskLevel === "Medium" ? "#ffc107" : "#198754") }}>
                    Risk: {riskLevel}
                  </div>
                  {peakProbability !== undefined && (
                    <div style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                      Peak Prob: {(peakProbability * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

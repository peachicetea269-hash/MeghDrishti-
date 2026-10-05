import React from "react";

/**
 * Displays current weather values from the FIRST hourly prediction entry.
 * All data comes from the real API response — nothing is fabricated.
 */
export default function CurrentWeatherCard({ hourlyPredictions }) {
  if (!hourlyPredictions || hourlyPredictions.length === 0) return null;

  const first  = hourlyPredictions[0];
  const wx     = first?.weather_data ?? {};

  const fields = [
    { label: "Temperature",    value: wx.temperature,    unit: "°C"      },
    { label: "Humidity",       value: wx.humidity,       unit: "%"       },
    { label: "Precipitation",  value: wx.precipitation,  unit: "mm"      },
    { label: "Wind Speed",     value: wx.wind_speed,     unit: "km/h"    },
    { label: "Wind Dir.",      value: wx.wind_direction, unit: "°"       },
    { label: "Cloud Cover",    value: wx.cloud_cover,    unit: "%"       },
    { label: "Pressure",       value: wx.pressure,       unit: "hPa"     },
    { label: "Visibility",     value: wx.visibility,     unit: "km"      },
  ].filter((f) => f.value !== undefined && f.value !== null);

  return (
    <div className="card">
      <div className="card-body">
        <div className="section-heading">
          <span className="icon" aria-hidden="true">🌡️</span>
          Current Conditions
        </div>
        <p className="text-muted" style={{ marginBottom: "14px" }}>
          From first available forecast hour
        </p>
        <div className="weather-grid">
          {fields.map((f) => (
            <div className="weather-item" key={f.label}>
              <div className="weather-item-label">{f.label}</div>
              <div className="weather-item-value">
                {typeof f.value === "number" ? f.value.toFixed ? f.value : f.value : f.value}
                <span className="weather-item-unit"> {f.unit}</span>
              </div>
            </div>
          ))}
          {fields.length === 0 && (
            <p className="text-muted">No weather data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

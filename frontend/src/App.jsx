import React, { useState } from "react";
import { fetchPrediction, fetchGeocode, fetchReliability, fetchRegionalConfidence } from "./services/api";

// Layout
import Header from "./components/layout/Header";

// Common
import LocationSearch       from "./components/common/LocationSearch";
import RiskSummaryCards     from "./components/common/RiskSummaryCards";
import ReliabilityPanel     from "./components/common/ReliabilityPanel";
import ReportsSection       from "./components/common/ReportsSection";
import ForecastExplanation  from "./components/common/ForecastExplanation";

// Weather
import CurrentWeatherCard from "./components/weather/CurrentWeatherCard";
import ForecastTable      from "./components/weather/ForecastTable";

// Charts
import BustProbabilityChart from "./components/charts/BustProbabilityChart";
import WeatherTrendChart    from "./components/charts/WeatherTrendChart";

// Map
import WeatherRiskMap          from "./components/map/WeatherRiskMap";
import RegionalForecastRiskMap from "./components/map/RegionalForecastRiskMap";

import LeadTimeRiskPanel       from "./components/charts/LeadTimeRiskPanel";

/* ── Loading skeleton helpers ──────────────────────────── */
function SkeletonKpi() {
  return (
    <div className="kpi-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton skeleton-kpi" />
      ))}
    </div>
  );
}

function SkeletonBlock({ tall }) {
  return <div className={`skeleton ${tall ? "skeleton-tall" : "skeleton-block"}`} />;
}

/* ── Error banner ──────────────────────────────────────── */
function ErrorBanner({ message, onRetry }) {
  return (
    <div className="error-banner" role="alert" aria-live="assertive">
      <span className="error-banner-icon" aria-hidden="true">⚠️</span>
      <div className="error-banner-text">
        <div className="error-banner-msg">Unable to load forecast data</div>
        <div style={{ marginTop: "4px", opacity: 0.85 }}>{message}</div>
        {onRetry && (
          <button className="retry-btn" onClick={onRetry}>
            Retry Request
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Location bar ──────────────────────────────────────── */
function LocationBar({ name, lat, lon }) {
  if (!name) return null;
  return (
    <div className="location-bar" aria-label={`Currently viewing: ${name}`}>
      <span className="location-bar-pin" aria-hidden="true">📍</span>
      <span className="location-bar-name">{name}</span>
      {lat != null && lon != null && (
        <span className="location-bar-coords">
          {lat.toFixed(4)}°N, {lon.toFixed(4)}°E
        </span>
      )}
    </div>
  );
}

import LandingPage from "./pages/landing/LandingPage";
import RoleSelection from "./pages/login/RoleSelection";
import PasswordLogin from "./pages/login/PasswordLogin";
import Sidebar from "./components/layout/Sidebar";

/* ================================================================
   Main App
   ================================================================ */
export default function App() {
  const [view, setView] = useState("landing");
  const [userRole, setUserRole] = useState(null);

  // Prediction + reliability data
  const [data,            setData]            = useState(null);
  const [reliabilityData, setReliabilityData] = useState(null);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState(null);
  
  // Search state
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching,   setIsSearching]   = useState(false);
  const [searchError,   setSearchError]   = useState(null);

  // Selected location
  const [currentLocation, setCurrentLocation] = useState(null);

  const [regionalData,    setRegionalData]    = useState(null);
  const [regionalLoading, setRegionalLoading] = useState(true);
  const [regionalError,   setRegionalError]   = useState(null);

  /* ── Load Regional Confidence (Once on Mount) ──────────── */
  React.useEffect(() => {
    const loadRegional = async () => {
      setRegionalLoading(true);
      setRegionalError(null);
      try {
        const res = await fetchRegionalConfidence(10);
        setRegionalData(res);
      } catch (err) {
        setRegionalError(err.message || "Failed to load regional data.");
      } finally {
        setRegionalLoading(false);
      }
    };
    loadRegional();
  }, []);

  /* ── Load prediction + reliability ─────────────────────── */
  const loadData = async (name, lat, lon) => {
    setLoading(true);
    setError(null);
    setData(null);
    setReliabilityData(null);
    setSearchResults([]);
    setCurrentLocation({ name, lat, lon });

    try {
      const predPromise = fetchPrediction({ latitude: lat, longitude: lon, location_name: name });
      const relPromise = fetchReliability(name).catch(err => ({ error: true, message: err.message }));
      
      const [predResult, relResult] = await Promise.all([predPromise, relPromise]);
      setData(predResult);
      setReliabilityData(relResult);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Geocode search ─────────────────────────────────────── */
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    try {
      const result = await fetchGeocode(searchQuery);
      if (result.results && result.results.length > 0) {
        setSearchResults(result.results);
      } else {
        setSearchError("No locations found. Try a different search.");
      }
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  /* ── Select geocode result ──────────────────────────────── */
  const selectLocation = (location) => {
    const shortName = location.display_name.split(",")[0];
    setSearchQuery(shortName);
    loadData(shortName, location.latitude, location.longitude);
  };

  /* ── Render ─────────────────────────────────────────────── */
  if (view === "landing") {
    return <LandingPage onLogin={() => setView("role-selection")} />;
  }

  if (view === "role-selection") {
    return (
      <RoleSelection 
        onBack={() => setView("landing")}
        onContinue={() => setView("login")}
        selectedRole={userRole}
        setSelectedRole={setUserRole}
      />
    );
  }

  if (view === "login") {
    return (
      <PasswordLogin 
        userRole={userRole} 
        onBack={() => setView("role-selection")} 
        onLoginSuccess={() => setView("dashboard")} 
      />
    );
  }

  return (
    <div className="app-wrapper">
      {/* ── Header ───────────────────────────────────────── */}
      <Header userRole={userRole} onLogout={() => { setView("landing"); setUserRole(null); }} />

      <div style={{ display: 'flex', width: '100%', minHeight: 'calc(100vh - 76px)' }}>
        <Sidebar userRole={userRole} onLogout={() => { setView("landing"); setUserRole(null); }} />

        <main className="app-content" id="main-content" style={{ flex: 1, minWidth: 0 }}>
          <div id="dashboard" style={{ marginBottom: "24px", borderBottom: "1px solid var(--clr-border)", paddingBottom: "16px" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "700", marginBottom: "4px", color: "var(--clr-text)" }}>AI-Based Forecast Bust Detection</h1>
            <p style={{ color: "var(--clr-text-muted)", fontSize: "1rem" }}>
              Identify potentially unreliable medium-range forecasts and prioritize areas requiring additional attention.
            </p>
          </div>

          {/* ── Location search + quick buttons ──────────── */}
          <div id="location-search">
            <LocationSearch
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchResults={searchResults}
              searchError={searchError}
              isSearching={isSearching}
              loading={loading}
              currentLocation={currentLocation}
              onSearch={handleSearch}
              onSelectResult={selectLocation}
              onQuickSelect={loadData}
            />
          </div>

          {/* ── Active location bar ───────────────────────── */}
          {currentLocation && (
            <div className="mt-20">
              <LocationBar
                name={currentLocation.name}
                lat={currentLocation.lat}
                lon={currentLocation.lon}
              />
            </div>
          )}

          {/* ── Error banner ─────────────────────────────── */}
          {error && (
            <div className="mt-20">
              <ErrorBanner
                message={error}
                onRetry={() => {
                  if (currentLocation) {
                    loadData(currentLocation.name, currentLocation.lat, currentLocation.lon);
                  }
                }}
              />
            </div>
          )}

          {/* ── KPI Cards ────────────────────────────────── */}
          <div className="mt-20">
            {loading ? (
              <SkeletonKpi />
            ) : data ? (
              <RiskSummaryCards summary={data.summary} />
            ) : null}
          </div>

          {/* ── Explainability ───────────────────────────── */}
          <div className="mt-20">
            {loading ? null : data ? (
              <ForecastExplanation 
                summary={data.summary} 
                hourlyPredictions={data.hourly_predictions} 
              />
            ) : null}
          </div>

          {/* ── Regional 10-Day Map ──────────────────────── */}
          <div className="mt-20" id="risk-map">
            <RegionalForecastRiskMap 
              data={regionalData} 
              loading={regionalLoading} 
              error={regionalError} 
            />
          </div>

          {/* ── Lead-Time Risk Panel ─────────────────────── */}
          <div className="mt-20" id="lead-time-analysis">
            <LeadTimeRiskPanel
              data={regionalData}
              loading={regionalLoading}
              error={regionalError}
            />
          </div>

          {/* ── Map + Current Weather row ─────────────────── */}
          {(loading || currentLocation) && (
            <div className="two-col-3-2 mt-20">
              {/* Map */}
              <div className="card">
                <div className="card-body">
                  <div className="section-heading">
                    <span className="icon" aria-hidden="true">🗺️</span>
                    Risk Map
                  </div>
                  {loading ? (
                    <SkeletonBlock tall />
                  ) : currentLocation ? (
                    <div className="map-wrapper">
                      <WeatherRiskMap
                        locationName={currentLocation.name}
                        latitude={currentLocation.lat}
                        longitude={currentLocation.lon}
                        riskLevel={data?.summary?.overall_risk_level}
                        peakProbability={data?.summary?.peak_bust_probability}
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Current weather */}
              {loading ? (
                <SkeletonBlock />
              ) : data ? (
                <CurrentWeatherCard hourlyPredictions={data.hourly_predictions} />
              ) : null}
            </div>
          )}

          {/* ── Forecast Table ───────────────────────────── */}
          <div className="mt-20" id="forecast-analysis">
            {loading ? (
              <SkeletonBlock />
            ) : data ? (
              <ForecastTable
                hourlyPredictions={data.hourly_predictions}
                total={data.summary?.total_hourly_predictions}
              />
            ) : null}
          </div>

          {/* ── Bust Probability Chart ────────────────── */}
          <div className="mt-20">
            {loading ? (
              <SkeletonBlock />
            ) : data ? (
              <BustProbabilityChart hourlyPredictions={data.hourly_predictions} />
            ) : null}
          </div>

          {/* ── Weather Trend Chart ──────────────────────── */}
          <div className="mt-20">
            {loading ? (
              <SkeletonBlock />
            ) : data ? (
              <WeatherTrendChart hourlyPredictions={data.hourly_predictions} />
            ) : null}
          </div>

          {/* ── Reliability panel ────────────────────────── */}
          {(loading || reliabilityData) && (
            <div className="mt-20" id="verification">
              {loading ? (
                <SkeletonBlock />
              ) : (
                <ReliabilityPanel 
                  reliabilityData={reliabilityData}
                  onRetry={() => loadData(currentLocation.name, currentLocation.lat, currentLocation.lon)}
                />
              )}
            </div>
          )}

          {/* ── Empty state (no location selected yet) ───── */}
          {!currentLocation && !loading && !error && (
            <div
              className="card mt-20"
              style={{ textAlign: "center", padding: "60px 20px" }}
              aria-label="Getting started prompt"
            >
              <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🌦️</div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "8px" }}>
                Select a location to view forecast risk and weather intelligence.
              </h2>
              <p className="text-muted">
                Choose Pune, Mumbai or Nashik above, or search for any location.
              </p>
            </div>
          )}

          {/* ── Reports Section ──────────────────────────── */}
          <div className="mt-20" id="reports">
            <ReportsSection 
              currentLocation={currentLocation}
              data={data}
              reliabilityData={reliabilityData}
              userRole={userRole}
            />
          </div>

        </main>
      </div>
      
      {/* ── Footer ───────────────────────────────────────── */}
      <footer style={{ textAlign: "center", padding: "20px", color: "var(--clr-text-light)", fontSize: "0.8rem", marginTop: "20px" }}>
        MeghDrishti — Advanced AI Weather Analytics
      </footer>
    </div>
  );
}

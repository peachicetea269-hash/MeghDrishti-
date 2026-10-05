import React from "react";

const QUICK = [
  { name: "Pune",   lat: 18.5204, lon: 73.8567 },
  { name: "Mumbai", lat: 19.0760, lon: 72.8777 },
  { name: "Nashik", lat: 20.0059, lon: 73.7797 },
];

export default function LocationSearch({
  searchQuery,
  setSearchQuery,
  searchResults,
  searchError,
  isSearching,
  loading,
  currentLocation,
  onSearch,
  onSelectResult,
  onQuickSelect,
}) {
  return (
    <section className="card" aria-label="Location selection">
      <div className="card-body">
        {/* Quick locations */}
        <div className="quick-locations" style={{ marginBottom: "14px" }}>
          <span className="quick-label" id="quick-loc-label">Quick&nbsp;locations:</span>
          <div
            role="group"
            aria-labelledby="quick-loc-label"
            style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
          >
            {QUICK.map((loc) => (
              <button
                key={loc.name}
                className={`quick-btn${currentLocation?.name === loc.name ? " active" : ""}`}
                onClick={() => onQuickSelect(loc.name, loc.lat, loc.lon)}
                disabled={loading}
                aria-pressed={currentLocation?.name === loc.name}
                aria-label={`Load forecast for ${loc.name}`}
              >
                {loc.name}
              </button>
            ))}
          </div>
        </div>

        <hr className="divider" style={{ marginBottom: "14px" }} />

        {/* Search form */}
        <form
          onSubmit={onSearch}
          className="search-form"
          role="search"
          aria-label="Search for a location"
        >
          <label htmlFor="location-search" className="sr-only">
            Search location
          </label>
          <input
            id="location-search"
            type="search"
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search city, e.g. Nagpur, Maharashtra…"
            autoComplete="off"
            disabled={loading}
            aria-label="Enter location name"
          />
          <button
            type="submit"
            className="search-btn"
            disabled={isSearching || loading}
            aria-label="Search"
          >
            {isSearching ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Searching…
              </>
            ) : (
              "Search"
            )}
          </button>

          {/* Dropdown results — positioned relative to form */}
          {searchResults.length > 0 && (
            <div
              className="search-results-list"
              role="listbox"
              aria-label="Search results"
            >
              {searchResults.map((loc, idx) => (
                <div
                  key={idx}
                  className="search-result-item"
                  role="option"
                  tabIndex={0}
                  onClick={() => onSelectResult(loc)}
                  onKeyDown={(e) => e.key === "Enter" && onSelectResult(loc)}
                  aria-selected={false}
                >
                  <div className="search-result-name">{loc.display_name}</div>
                  <div className="search-result-coords">
                    {loc.latitude.toFixed(4)}°N, {loc.longitude.toFixed(4)}°E
                  </div>
                </div>
              ))}
            </div>
          )}
        </form>

        {searchError && (
          <p className="search-error" role="alert" aria-live="polite">
            <span aria-hidden="true">⚠</span> {searchError}
          </p>
        )}
      </div>
    </section>
  );
}

import React from "react";

/* SVG radar/cloud icon — no external dependency */
const RadarIcon = () => (
  <svg
    className="header-logo"
    viewBox="0 0 44 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Radar circles */}
    <circle cx="22" cy="22" r="20" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
    <circle cx="22" cy="22" r="13" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
    <circle cx="22" cy="22" r="7"  stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
    {/* Sweep line */}
    <line x1="22" y1="22" x2="22" y2="2"
      stroke="rgba(100,210,255,0.85)" strokeWidth="2" strokeLinecap="round" />
    {/* Sweep arc glow */}
    <path
      d="M22 2 A20 20 0 0 1 38 30"
      stroke="rgba(100,210,255,0.35)"
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
    />
    {/* Center dot */}
    <circle cx="22" cy="22" r="2.5" fill="rgba(100,210,255,0.9)" />
    {/* Blip */}
    <circle cx="30" cy="13" r="2" fill="rgba(100,255,180,0.9)" />
  </svg>
);

export default function Header({ userRole, onLogout }) {
  const formatRole = (role) => {
    if (!role) return "";
    const titles = {
      "meteorologist": "Meteorologist / Weather Forecaster",
      "disaster_management": "Disaster Management Authority",
      "government": "Government / Administration",
      "operational": "Operational Weather Team",
      "researcher": "Weather Researcher"
    };
    return titles[role] || role;
  };

  return (
    <header className="site-header" role="banner">
      <div className="header-inner">
        <div className="header-brand">
          <RadarIcon />
          <div>
            <div className="header-title">MeghDrishti</div>
            <div className="header-subtitle">
              AI-Based Forecast Bust Detection
            </div>
          </div>
        </div>
        <div className="header-right" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {userRole && (
            <div className="header-role" style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.9)" }}>
              Role: <strong style={{ color: "#fff" }}>{formatRole(userRole)}</strong>
            </div>
          )}
          {onLogout && (
            <button 
              onClick={onLogout}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                padding: "4px 12px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.85rem"
              }}
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

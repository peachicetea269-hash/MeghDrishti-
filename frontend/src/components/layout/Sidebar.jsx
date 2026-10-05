import React, { useState } from "react";
import "./Sidebar.css";

const RadarIcon = () => (
  <svg
    className="sidebar-logo-icon"
    viewBox="0 0 44 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="22" cy="22" r="20" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
    <circle cx="22" cy="22" r="13" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
    <circle cx="22" cy="22" r="7"  stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
    <line x1="22" y1="22" x2="22" y2="2" stroke="rgba(100,210,255,0.85)" strokeWidth="2" strokeLinecap="round" />
    <path d="M22 2 A20 20 0 0 1 38 30" stroke="rgba(100,210,255,0.35)" strokeWidth="4" strokeLinecap="round" fill="none" />
    <circle cx="22" cy="22" r="2.5" fill="rgba(100,210,255,0.9)" />
    <circle cx="30" cy="13" r="2" fill="rgba(100,255,180,0.9)" />
  </svg>
);

export default function Sidebar({ userRole, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  const formatRole = (role) => {
    if (!role) return "Authorized Personnel";
    const titles = {
      "meteorologist": "Meteorologist",
      "disaster_management": "Disaster Management",
      "government": "Government Admin",
      "operational": "Operational Team",
      "researcher": "Weather Researcher"
    };
    return titles[role] || role;
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "location-search", label: "Location Search", icon: "🔍" },
    { id: "forecast-analysis", label: "Forecast Analysis", icon: "📈" },
    { id: "risk-map", label: "Risk Map", icon: "🗺️" },
    { id: "lead-time-analysis", label: "Lead-Time Analysis", icon: "⏳" },
    { id: "verification", label: "Verification", icon: "✅" }
  ];

  return (
    <>
      <button 
        className="sidebar-mobile-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Sidebar"
      >
        ☰ Menu
      </button>

      <aside className={`sidebar-container ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <RadarIcon />
          <div className="sidebar-brand">MeghDrishti</div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <a 
              key={item.id} 
              href={`#${item.id}`} 
              className="sidebar-nav-item"
              onClick={() => setIsOpen(false)}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              {item.label}
            </a>
          ))}
          <a href="#reports" className="sidebar-nav-item" onClick={() => setIsOpen(false)}>
            <span className="sidebar-nav-icon">📑</span>
            Reports
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-role">
            <div className="role-label">Role</div>
            <div className="role-value">{formatRole(userRole)}</div>
          </div>
          {onLogout && (
            <button className="sidebar-logout-btn" onClick={onLogout}>
              Logout
            </button>
          )}
        </div>
      </aside>

      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
}

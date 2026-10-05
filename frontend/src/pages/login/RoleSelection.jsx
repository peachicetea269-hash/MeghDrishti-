import React from "react";
import "./RoleSelection.css";

const ROLES = [
  {
    id: "meteorologist",
    title: "Meteorologist / Weather Forecaster",
    description: "Detailed operational forecasts, model verification, and deep meteorological insights.",
    icon: "🌤️"
  },
  {
    id: "disaster_management",
    title: "Disaster Management Authority",
    description: "High-level risk assessments, bust alerts, and emergency preparedness tracking.",
    icon: "🚨"
  },
  {
    id: "government",
    title: "Government / Administration",
    description: "Strategic weather overview, policy planning, and regional vulnerability analysis.",
    icon: "🏛️"
  },
  {
    id: "operational",
    title: "Operational Weather Team",
    description: "Real-time monitoring, shift handovers, and short-term forecast confidence.",
    icon: "📡"
  },
  {
    id: "researcher",
    title: "Weather Researcher",
    description: "Historical model performance, explainability data, and deep-dive analytics.",
    icon: "🔬"
  }
];

export default function RoleSelection({ onBack, onContinue, selectedRole, setSelectedRole }) {
  const handleContinue = () => {
    if (selectedRole) {
      onContinue(selectedRole);
    }
  };

  return (
    <div className="role-selection-page">
      <div className="role-selection-container">
        <header className="role-selection-header">
          <h1 className="role-selection-title">MeghDrishti</h1>
          <h2 className="role-selection-subtitle">Select Your Role</h2>
          <p className="role-selection-description">
            Choose your role to continue to the authorized MeghDrishti portal.
          </p>
        </header>

        <div className="role-cards-grid">
          {ROLES.map((role) => (
            <div 
              key={role.id} 
              className={`role-card ${selectedRole === role.id ? "selected" : ""}`}
              onClick={() => setSelectedRole(role.id)}
            >
              <div className="role-icon">{role.icon}</div>
              <div className="role-content">
                <h3 className="role-name">{role.title}</h3>
                <p className="role-desc">{role.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="role-selection-actions">
          <button className="btn-back" onClick={onBack}>&larr; Back</button>
          <button 
            className="btn-continue" 
            onClick={handleContinue}
            disabled={!selectedRole}
          >
            Continue &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

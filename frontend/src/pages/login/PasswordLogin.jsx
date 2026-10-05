import React, { useState } from "react";
import "./PasswordLogin.css";

export default function PasswordLogin({ userRole, onBack, onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  
  // Format the role for display
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

  const handleSignIn = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter both Username and Password.");
      return;
    }
    // Demo login flow: just proceed on any non-empty input
    onLoginSuccess();
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <header className="login-header">
          <h1 className="login-title">MeghDrishti</h1>
          <h2 className="login-subtitle">Authorized Login</h2>
          <div className="login-role-badge">
            Role: <span>{formatRole(userRole)}</span>
          </div>
        </header>

        <form className="login-form" onSubmit={handleSignIn}>
          {error && <div className="login-error">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">Username / Official ID</label>
            <input 
              type="text" 
              id="username"
              className="form-control"
              placeholder="Enter your official ID"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                id="password"
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button" 
                className="btn-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="login-actions">
            <button type="button" className="btn-back" onClick={onBack}>&larr; Back</button>
            <button type="submit" className="btn-signin">Sign In &rarr;</button>
          </div>
        </form>
      </div>
    </div>
  );
}

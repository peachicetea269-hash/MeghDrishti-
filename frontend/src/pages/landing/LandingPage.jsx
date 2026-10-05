import React from "react";
import "./LandingPage.css";

const RadarIcon = () => (
  <svg
    className="landing-logo-icon"
    viewBox="0 0 44 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    style={{ width: "32px", height: "32px", marginRight: "10px" }}
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

export default function LandingPage({ onLogin }) {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-brand">
          <RadarIcon />
          <span className="landing-title">MeghDrishti</span>
        </div>
        <nav className="landing-nav">
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-content">
            <h1 className="hero-title">MeghDrishti</h1>
            <h2 className="hero-subtitle">AI-Based Forecast Bust Detection</h2>
            <p className="hero-description">
              Identify potentially unreliable medium-range weather forecasts and enable better decision-making for a safer tomorrow.
            </p>
            <button className="cta-button" onClick={onLogin}>
              Authorized Login &rarr;
            </button>
          </div>
        </section>

        <section className="landing-features" id="features">
          <div className="feature-item">
            <span className="feature-icon">🌩️</span>
            <h3>Forecast Bust Detection</h3>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🗺️</span>
            <h3>Risk Region Analysis</h3>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🧠</span>
            <h3>Explainable AI</h3>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📅</span>
            <h3>Medium-Range (Up to 10 Days)</h3>
          </div>
        </section>

        <section className="landing-about" id="about">
          <h2>About MeghDrishti</h2>
          <p>
            MeghDrishti is an AI-based forecast bust detection platform designed to identify potentially unreliable medium-range weather forecasts and help operational users prioritize forecasts requiring additional attention.
          </p>
        </section>

        <section className="landing-contact" id="contact">
          <h2>Contact</h2>
          <p>
            For authorized operational, research, or institutional enquiries, please contact the MeghDrishti project team.
          </p>
        </section>
      </main>
    </div>
  );
}

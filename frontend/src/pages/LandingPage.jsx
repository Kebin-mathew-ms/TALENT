import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import {
  Users,
  Code2,
  Cpu,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import '../styles/landing.css';

export const LandingPage = () => {
  return (
    <div className="landing-container">
      <Navbar />

      <section className="hero-section">
        <div className="hero-pill">
          <Sparkles size={16} />
          <span>Multi-Candidate Technical Assessment Platform</span>
        </div>

        <h1 className="hero-title">
          Assess Multiple Candidates <span>Simultaneously</span> in Real-Time
        </h1>

        <p className="hero-description">
          Talent Flow empowers technical recruiters and engineering managers to host
          collaborative, isolated coding assessments. Evaluate multiple candidates at scale
          with secure code execution, Monaco editor integration, AI proctoring, and automated insights.
        </p>

        <div className="hero-cta">
          <Link to="/login" className="btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
            <span>Interviewer Portal</span>
            <ArrowRight size={18} />
          </Link>
          <Link to="/register" className="btn-secondary" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
            <span>Join as Candidate</span>
          </Link>
        </div>
      </section>

      <section className="features-grid">
        <div className="feature-card">
          <div className="feature-icon-wrapper">
            <Users size={26} />
          </div>
          <h3 className="feature-title">Multi-Candidate Orchestration</h3>
          <p className="feature-desc">
            One interviewer can invite and monitor multiple candidates simultaneously. Every candidate gets an isolated, secure coding workspace.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon-wrapper">
            <Code2 size={26} />
          </div>
          <h3 className="feature-title">Monaco Coding Environment</h3>
          <p className="feature-desc">
            Full-featured VS Code-powered editor supporting syntax highlighting, auto-completion, and multi-language support.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon-wrapper">
            <Cpu size={26} />
          </div>
          <h3 className="feature-title">AI Submission Evaluation</h3>
          <p className="feature-desc">
            Automated code quality analysis, algorithmic efficiency scoring, and comprehensive feedback generated for every candidate.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon-wrapper">
            <ShieldCheck size={26} />
          </div>
          <h3 className="feature-title">Advanced Proctoring</h3>
          <p className="feature-desc">
            Detect tab switches, paste events, and unusual behavior during assessment sessions with audit timestamps.
          </p>
        </div>
      </section>

      <footer className="landing-footer">
        <p>© 2026 Talent Flow Platform. Built for modern high-velocity engineering teams.</p>
      </footer>
    </div>
  );
};

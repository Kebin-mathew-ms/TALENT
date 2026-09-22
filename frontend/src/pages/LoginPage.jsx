import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, LogIn, AlertCircle } from 'lucide-react';
import '../styles/auth.css';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('INTERVIEWER'); // INTERVIEWER or CANDIDATE
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrorMessage('');
    if (tab === 'INTERVIEWER') {
      setEmail('admin@gmail.com');
      setPassword('Admin@123');
    } else {
      setEmail('alex@candidate.com');
      setPassword('Candidate@123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const res = await login(email, password);
    setIsSubmitting(false);

    if (res.success) {
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (res.user.role === 'INTERVIEWER') {
        navigate('/interviewer/dashboard', { replace: true });
      } else {
        navigate('/candidate/dashboard', { replace: true });
      }
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-brand">
            <div className="brand-icon" style={{ width: 36, height: 36 }}>
              <Zap size={20} />
            </div>
            <span>Talent Flow</span>
          </Link>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to access your assessment workspace</p>
        </div>

        <div className="auth-role-tabs">
          <button
            className={`role-tab ${activeTab === 'INTERVIEWER' ? 'active' : ''}`}
            onClick={() => handleTabChange('INTERVIEWER')}
          >
            Interviewer Login
          </button>
          <button
            className={`role-tab ${activeTab === 'CANDIDATE' ? 'active' : ''}`}
            onClick={() => handleTabChange('CANDIDATE')}
          >
            Candidate Login
          </button>
        </div>

        {errorMessage && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary btn-full"
            disabled={isSubmitting}
            style={{ marginTop: '0.75rem' }}
          >
            <LogIn size={18} />
            <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="demo-credentials">
          <strong>Demo Seed Credentials:</strong>
          <br />
          {activeTab === 'INTERVIEWER' ? (
            <>Email: <code>admin@gmail.com</code> | Pass: <code>Admin@123</code></>
          ) : (
            <>Email: <code>alex@candidate.com</code> | Pass: <code>Candidate@123</code></>
          )}
        </div>

        <div className="auth-footer-text">
          Don't have a candidate account yet?{' '}
          <Link to="/register">Register as Candidate</Link>
        </div>
      </div>
    </div>
  );
};

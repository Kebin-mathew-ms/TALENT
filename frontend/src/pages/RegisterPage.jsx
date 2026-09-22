import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, UserPlus, AlertCircle } from 'lucide-react';
import '../styles/auth.css';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    education: '',
    skills: '',
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const res = await register(formData);
    setIsSubmitting(false);

    if (res.success) {
      navigate('/candidate/dashboard', { replace: true });
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 540 }}>
        <div className="auth-header">
          <Link to="/" className="auth-brand">
            <div className="brand-icon" style={{ width: 36, height: 36 }}>
              <Zap size={20} />
            </div>
            <span>Talent Flow</span>
          </Link>
          <h2 className="auth-title">Candidate Registration</h2>
          <p className="auth-subtitle">Create your profile to join technical assessments</p>
        </div>

        {errorMessage && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g. Alex Rivera"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="alex@candidate.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="text"
              name="phone"
              className="form-input"
              placeholder="+1 (555) 019-2834"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Education / Degree</label>
            <input
              type="text"
              name="education"
              className="form-input"
              placeholder="B.S. Computer Science, University of Technology"
              value={formData.education}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Key Technical Skills</label>
            <input
              type="text"
              name="skills"
              className="form-input"
              placeholder="JavaScript, React, Node.js, Python, Algorithms"
              value={formData.skills}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="btn-primary btn-full"
            disabled={isSubmitting}
            style={{ marginTop: '0.75rem' }}
          >
            <UserPlus size={18} />
            <span>{isSubmitting ? 'Registering Account...' : 'Create Account'}</span>
          </button>
        </form>

        <div className="auth-footer-text">
          Already have an account? <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { createCandidate, fetchCandidateById, updateCandidate } from '../services/candidateService';
import { UserPlus, Save, ArrowLeft, AlertCircle } from 'lucide-react';
import '../styles/dashboard.css';

export const CandidateFormPage = () => {
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    education: '',
    skills: '',
  });

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    if (isEditMode) {
      const loadCandidate = async () => {
        try {
          const response = await fetchCandidateById(id);
          if (response.success && response.data?.candidate) {
            const cand = response.data.candidate;
            setFormData({
              name: cand.name || '',
              email: cand.email || '',
              password: '',
              phone: cand.phone || '',
              education: cand.education || '',
              skills: cand.skills || '',
            });
          } else {
            setError(response.message);
          }
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to fetch candidate details.');
        } finally {
          setIsLoading(false);
        }
      };

      loadCandidate();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isEditMode) {
        const res = await updateCandidate(id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          education: formData.education,
          skills: formData.skills,
        });
        if (res.success) {
          navigate(`/interviewer/candidates/${id}`);
        } else {
          setError(res.message);
        }
      } else {
        const res = await createCandidate(formData);
        if (res.success) {
          navigate('/interviewer/candidates');
        } else {
          setError(res.message);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while saving candidate information.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title={isEditMode ? 'Edit Candidate' : 'Add Candidate'}>
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading candidate form...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={isEditMode ? 'Edit Candidate Profile' : 'Register New Candidate'}>
      <div className="section-card" style={{ maxWidth: 720 }}>
        <div className="section-header">
          <div>
            <h2 className="section-title">
              {isEditMode ? `Edit Candidate #${id}` : 'Create Candidate Account'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {isEditMode
                ? 'Update candidate contact details, skills, and educational qualifications.'
                : 'Register a candidate account so they can be assigned to technical assessments.'}
            </p>
          </div>

          <Link to="/interviewer/candidates" className="btn-secondary">
            <ArrowLeft size={16} />
            <span>Back to Candidates</span>
          </Link>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
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

          <div style={{ display: 'grid', gridTemplateColumns: isEditMode ? '1fr' : '1fr 1fr', gap: '1rem' }}>
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

            {!isEditMode && (
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
            )}
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
            <label className="form-label">Education / Qualification</label>
            <input
              type="text"
              name="education"
              className="form-input"
              placeholder="B.S. Computer Science, Stanford University"
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
              placeholder="JavaScript, React, Node.js, Python, PostgreSQL"
              value={formData.skills}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isEditMode ? <Save size={18} /> : <UserPlus size={18} />}
              <span>{isSubmitting ? 'Saving...' : isEditMode ? 'Update Candidate' : 'Create Candidate'}</span>
            </button>
            <Link to="/interviewer/candidates" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

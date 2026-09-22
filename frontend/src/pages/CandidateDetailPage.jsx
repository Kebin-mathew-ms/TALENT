import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { fetchCandidateById } from '../services/candidateService';
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Code2,
  FileCode,
  ArrowLeft,
  Edit3,
  Calendar,
  Sparkles,
} from 'lucide-react';
import '../styles/dashboard.css';

export const CandidateDetailPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCandidate = async () => {
      try {
        const response = await fetchCandidateById(id);
        if (response.success) {
          setData(response.data);
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
  }, [id]);

  if (isLoading) {
    return (
      <DashboardLayout title="Candidate Profile">
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading candidate details...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout title="Candidate Profile">
        <div className="error-banner">
          <span>{error || 'Candidate profile not found'}</span>
        </div>
      </DashboardLayout>
    );
  }

  const { candidate, history } = data;

  return (
    <DashboardLayout title={`Candidate: ${candidate.name}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Profile Card */}
        <div className="section-card">
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div className="avatar" style={{ width: 64, height: 64, fontSize: '1.5rem' }}>
                {candidate.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{candidate.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <span className="badge badge-candidate">Candidate Profile</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ID: #{candidate.id}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/interviewer/candidates" className="btn-secondary">
                <ArrowLeft size={16} />
                <span>Back</span>
              </Link>
              <Link to={`/interviewer/candidates/${candidate.id}/edit`} className="btn-primary">
                <Edit3 size={16} />
                <span>Edit Profile</span>
              </Link>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mail size={16} /> Email Address
              </label>
              <div className="form-input" style={{ background: 'var(--bg-dark)' }}>{candidate.email}</div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Phone size={16} /> Phone Number
              </label>
              <div className="form-input" style={{ background: 'var(--bg-dark)' }}>{candidate.phone || 'Not provided'}</div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <GraduationCap size={16} /> Education / Degree
              </label>
              <div className="form-input" style={{ background: 'var(--bg-dark)' }}>{candidate.education || 'Not provided'}</div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Code2 size={16} /> Key Technical Skills
              </label>
              <div className="form-input" style={{ background: 'var(--bg-dark)' }}>{candidate.skills || 'Not provided'}</div>
            </div>
          </div>
        </div>

        {/* Assessment History Card */}
        <div className="section-card">
          <div className="section-header">
            <div>
              <h3 className="section-title">Assessment History</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Technical assessments assigned to this candidate.
              </p>
            </div>
          </div>

          {history && history.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Assessment Title</th>
                  <th>Duration</th>
                  <th>Candidate Status</th>
                  <th>Assessment Status</th>
                  <th>Score</th>
                  <th>Report</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{item.title}</td>
                    <td>{item.duration} mins</td>
                    <td>
                      <span className="badge badge-candidate">{item.status}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${item.assessmentStatus.toLowerCase()}`}>
                        {item.assessmentStatus}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Sparkles size={14} /> Pending AI Eval
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        AI Evaluation Not Available Yet
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
              <FileCode size={36} className="empty-icon" />
              <p style={{ color: 'var(--text-muted)' }}>No assessment history recorded for this candidate yet.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

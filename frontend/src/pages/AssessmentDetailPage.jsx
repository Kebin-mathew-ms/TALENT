import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { fetchAssessmentById } from '../services/assessmentService';
import {
  FileCode,
  Users,
  BookOpen,
  Clock,
  Calendar,
  ArrowLeft,
  Edit3,
  CheckCircle,
} from 'lucide-react';
import '../styles/dashboard.css';

export const AssessmentDetailPage = () => {
  const { id } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const loadAssessment = async () => {
      try {
        const response = await fetchAssessmentById(id);
        if (response.success) {
          setAssessment(response.data);
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch assessment details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAssessment();
  }, [id]);

  if (isLoading) {
    return (
      <DashboardLayout title="Assessment Details">
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading assessment summary...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !assessment) {
    return (
      <DashboardLayout title="Assessment Details">
        <div className="error-banner">
          <span>{error || 'Assessment not found'}</span>
        </div>
      </DashboardLayout>
    );
  }

  const { title, description, duration, startTime, endTime, candidates = [], questions = [], creator } = assessment;
  const statusBadge = (assessment.dynamicStatus || assessment.status).toLowerCase();

  return (
    <DashboardLayout title={`Assessment: ${title}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Header Summary Card */}
        <div className="section-card">
          <div className="section-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{title}</h2>
                <span className={`badge badge-${statusBadge}`}>
                  {assessment.dynamicStatus || assessment.status}
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {description || 'No description provided for this assessment.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/interviewer/assessments" className="btn-secondary">
                <ArrowLeft size={16} />
                <span>Back</span>
              </Link>
              {assessment.status !== 'LIVE' && assessment.status !== 'COMPLETED' && (
                <Link to={`/interviewer/assessments/${assessment.id}/edit`} className="btn-primary">
                  <Edit3 size={16} />
                  <span>Edit Assessment</span>
                </Link>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.25rem',
              borderTop: '1px solid var(--border)',
              paddingTop: '1.25rem',
              marginTop: '0.5rem',
            }}
          >
            <div>
              <span className="metric-label">Start Schedule</span>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '0.25rem' }}>
                {startTime ? new Date(startTime).toLocaleString() : 'Not Scheduled'}
              </div>
            </div>

            <div>
              <span className="metric-label">Duration</span>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '0.25rem' }}>
                {duration} minutes
              </div>
            </div>

            <div>
              <span className="metric-label">Candidate Count</span>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '0.25rem', color: '#818cf8' }}>
                {candidates.length} Candidates Selected
              </div>
            </div>

            <div>
              <span className="metric-label">Question Count</span>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '0.25rem', color: '#38bdf8' }}>
                {questions.length} Questions Configured
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Candidates List */}
        <div className="section-card">
          <div className="section-header">
            <h3 className="section-title">Assigned Candidates ({candidates.length})</h3>
          </div>

          {candidates.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {candidates.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: '1rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.925rem' }}>{c.candidate?.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.candidate?.email}</div>
                  </div>
                  <span className="badge badge-candidate" style={{ fontSize: '0.7rem' }}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No candidates assigned yet.</p>
          )}
        </div>

        {/* Configured Questions List (Preserving Display Order) */}
        <div className="section-card">
          <div className="section-header">
            <h3 className="section-title">Question Sequence ({questions.length})</h3>
          </div>

          {questions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {questions.map((qItem) => (
                <div
                  key={qItem.id}
                  style={{
                    padding: '1rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontWeight: 800, color: '#38bdf8', fontSize: '1rem', width: 28 }}>
                      #{qItem.displayOrder}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{qItem.question?.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Category: {qItem.question?.category} • Language: {qItem.question?.language} • Time Limit: {qItem.question?.timeLimit}s
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      background: qItem.question?.difficulty === 'EASY' ? 'rgba(16,185,129,0.15)' : qItem.question?.difficulty === 'MEDIUM' ? 'rgba(245,158,11,0.15)' : 'rgba(244,63,94,0.15)',
                      color: qItem.question?.difficulty === 'EASY' ? '#34d399' : qItem.question?.difficulty === 'MEDIUM' ? '#fbbf24' : '#fb7185',
                      fontWeight: 600,
                    }}
                  >
                    {qItem.question?.difficulty}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No questions added to this assessment yet.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

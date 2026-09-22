import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { fetchAssessmentById, checkAssessmentAccess } from '../services/assessmentService';
import { Clock, BookOpen, UserCheck, Calendar, ArrowLeft, Play, ShieldAlert, Sparkles } from 'lucide-react';
import '../styles/dashboard.css';

export const CandidateAssessmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [accessInfo, setAccessInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const [assRes, accessRes] = await Promise.all([
          fetchAssessmentById(id),
          checkAssessmentAccess(id),
        ]);

        if (assRes.success) {
          setAssessment(assRes.data);
        } else {
          setError(assRes.message);
        }

        if (accessRes.success) {
          setAccessInfo(accessRes.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch assessment overview.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDetails();
  }, [id]);

  if (isLoading) {
    return (
      <DashboardLayout title="Assessment Overview">
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading assessment information & verifying permissions...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !assessment) {
    return (
      <DashboardLayout title="Assessment Overview">
        <div className="error-banner">
          <span>{error || 'Assessment not found'}</span>
        </div>
      </DashboardLayout>
    );
  }

  const { title, description, duration, startTime, endTime, questions = [], creator } = assessment;

  return (
    <DashboardLayout title={title}>
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        <div className="section-card">
          <div className="section-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{title}</h2>
                <span className="badge badge-candidate">Assigned To You</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {description || 'No description provided.'}
              </p>
            </div>

            <Link to="/candidate/dashboard" className="btn-secondary">
              <ArrowLeft size={16} />
              <span>Back</span>
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.25rem',
              borderTop: '1px solid var(--border)',
              paddingTop: '1.25rem',
              margin: '1rem 0',
            }}
          >
            <div>
              <span className="metric-label">Scheduled Time</span>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '0.25rem' }}>
                {startTime ? new Date(startTime).toLocaleString() : 'Flex Schedule'}
              </div>
            </div>

            <div>
              <span className="metric-label">Duration</span>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '0.25rem' }}>
                {duration} minutes
              </div>
            </div>

            <div>
              <span className="metric-label">Questions</span>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '0.25rem', color: '#38bdf8' }}>
                {questions.length} Technical Problems
              </div>
            </div>

            <div>
              <span className="metric-label">Interviewer</span>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '0.25rem', color: '#34d399' }}>
                {creator?.name || 'Assigned Host'}
              </div>
            </div>
          </div>

          {/* Access Control Status Banner */}
          {accessInfo && (
            <div
              style={{
                marginTop: '1.5rem',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                background: accessInfo.canJoin ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 102, 241, 0.12)',
                border: accessInfo.canJoin ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: accessInfo.canJoin ? '#34d399' : '#a5b4fc' }}>
                <Sparkles size={18} />
                <span>Session Access Check: {accessInfo.reason}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {accessInfo.canJoin
                    ? 'The assessment window is active. You may launch your workspace.'
                    : 'The live coding workspace will unlock automatically when the session begins.'}
                </span>

                <button
                  className="btn-primary"
                  disabled={!accessInfo.canJoin}
                  onClick={async () => {
                    if (accessInfo.canJoin) {
                      navigate(`/candidate/assessments/${id}/session`);
                    } else {
                      alert(`Session access status: ${accessInfo.reason}`);
                    }
                  }}
                  style={{
                    padding: '0.6rem 1.25rem',
                    opacity: accessInfo.canJoin ? 1 : 0.6,
                    cursor: accessInfo.canJoin ? 'pointer' : 'not-allowed',
                  }}
                >
                  <Play size={16} />
                  <span>Join Live Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

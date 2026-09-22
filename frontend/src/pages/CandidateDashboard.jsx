import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { fetchCandidateAssessments } from '../services/dashboardService';
import {
  Clock,
  BookOpen,
  UserCheck,
  Play,
  CheckCircle,
  FileQuestion,
} from 'lucide-react';
import '../styles/dashboard.css';

export const CandidateDashboard = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAssessments = async () => {
      try {
        const response = await fetchCandidateAssessments();
        if (response.success) {
          setAssessments(response.data.assessments || []);
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch candidate assessments.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAssessments();
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout title="Candidate Dashboard">
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
          Loading your assigned assessments...
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Candidate Dashboard">
        <div className="error-banner">
          <span>{error}</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Candidate Dashboard">
      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">Assigned Technical Assessments</h2>
        </div>

        {assessments.length > 0 ? (
          <div className="assessments-grid">
            {assessments.map((item) => (
              <div key={item.id} className="assessment-card">
                <div>
                  <div className="assessment-header">
                    <h3 className="assessment-title">{item.title}</h3>
                    <span className={`badge badge-${item.assessmentStatus.toLowerCase()}`}>
                      {item.assessmentStatus}
                    </span>
                  </div>

                  <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                    {item.description || 'No description provided.'}
                  </p>

                  <div className="assessment-meta">
                    <div className="meta-item">
                      <Clock size={15} color="#818cf8" />
                      <span>{item.duration} minutes</span>
                    </div>

                    <div className="meta-item">
                      <BookOpen size={15} color="#38bdf8" />
                      <span>{item.questionCount} Questions</span>
                    </div>

                    <div className="meta-item">
                      <UserCheck size={15} color="#34d399" />
                      <span>Interviewer: {item.interviewer}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Candidate Status: <strong style={{ color: '#e2e8f0' }}>{item.candidateStatus}</strong>
                  </span>

                  <button
                    className="btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    onClick={() => navigate(`/candidate/assessments/${item.id}`)}
                  >
                    <Play size={14} />
                    <span>Enter Session</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FileQuestion size={48} className="empty-icon" />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#e2e8f0' }}>No assessments assigned yet.</h3>
            <p>Your interviewer will invite you to technical assessment sessions here.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { fetchAssessmentById } from '../services/assessmentService';
import { fetchReports } from '../services/reportService';
import { getAssessmentProctoringIncidents } from '../services/proctoringService';
import {
  BarChart3,
  TrendingUp,
  Users,
  ShieldAlert,
  ArrowLeft,
  Award,
  CheckCircle,
  Clock,
} from 'lucide-react';
import '../styles/dashboard.css';

export const AssessmentAnalyticsPage = () => {
  const { id } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [reports, setReports] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        const [assRes, repRes, procRes] = await Promise.all([
          fetchAssessmentById(id),
          fetchReports({ assessmentId: id, limit: 100 }),
          getAssessmentProctoringIncidents(id)
        ]);

        if (assRes.success) setAssessment(assRes.data);
        if (repRes.success) setReports(repRes.data);
        if (procRes.success) setIncidents(procRes.data);
      } catch (err) {
        setError('Failed to load assessment analytics.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [id]);

  if (isLoading) {
    return (
      <DashboardLayout title="Assessment Analytics">
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Computing assessment analytics & score distributions...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !assessment) {
    return (
      <DashboardLayout title="Assessment Analytics">
        <div className="error-banner">
          <span>{error || 'Assessment not found'}</span>
        </div>
      </DashboardLayout>
    );
  }

  const { title, candidates = [], sessions = [] } = assessment;
  const completedCount = sessions.filter((s) => s.status === 'COMPLETED' || s.status === 'SUBMITTED').length;
  const completionRate = candidates.length > 0 ? Math.round((completedCount / candidates.length) * 100) : 0;

  const scores = reports.map((r) => r.overallScore || 0);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;

  const highPerformers = scores.filter((s) => s >= 80).length;
  const mediumPerformers = scores.filter((s) => s >= 60 && s < 80).length;
  const lowPerformers = scores.filter((s) => s < 60).length;

  return (
    <DashboardLayout title={`Analytics: ${title}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header Card */}
        <div className="section-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <BarChart3 size={24} color="#818cf8" /> {title} — Assessment Analytics
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Cohort metrics, score distribution, and proctoring incident metrics.
              </div>
            </div>

            <Link to={`/interviewer/assessments/${id}`} className="btn-secondary">
              <ArrowLeft size={16} />
              <span>Back to Assessment</span>
            </Link>
          </div>
        </div>

        {/* Analytics Top Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
          <div className="section-card" style={{ padding: '1.25rem', borderLeft: '4px solid #34d399' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Completion Rate
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#34d399', marginTop: '0.25rem' }}>
              {completionRate}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4 }}>
              {completedCount} of {candidates.length} candidates finished
            </div>
          </div>

          <div className="section-card" style={{ padding: '1.25rem', borderLeft: '4px solid #c084fc' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Cohort Mean Score
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#c084fc', marginTop: '0.25rem' }}>
              {avgScore} / 100
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4 }}>
              Highest: {maxScore}  |  Lowest: {minScore}
            </div>
          </div>

          <div className="section-card" style={{ padding: '1.25rem', borderLeft: '4px solid #f43f5e' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Proctoring Flags
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f43f5e', marginTop: '0.25rem' }}>
              {incidents.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4 }}>
              Logged focus/media incidents
            </div>
          </div>

          <div className="section-card" style={{ padding: '1.25rem', borderLeft: '4px solid #38bdf8' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Evaluated Candidates
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#38bdf8', marginTop: '0.25rem' }}>
              {reports.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4 }}>
              Generated candidate reports
            </div>
          </div>
        </div>

        {/* Score Distribution Breakdown Cards */}
        <div className="section-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="#818cf8" /> Candidate Score Performance Distribution
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
            <div style={{ background: '#0b0f19', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>High Performers (80 - 100)</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', margin: '0.5rem 0' }}>{highPerformers}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {scores.length > 0 ? Math.round((highPerformers / scores.length) * 100) : 0}% of evaluated candidates
              </div>
            </div>

            <div style={{ background: '#0b0f19', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase' }}>Moderate Performers (60 - 79)</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', margin: '0.5rem 0' }}>{mediumPerformers}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {scores.length > 0 ? Math.round((mediumPerformers / scores.length) * 100) : 0}% of evaluated candidates
              </div>
            </div>

            <div style={{ background: '#0b0f19', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: 700, textTransform: 'uppercase' }}>Needs Review (&lt; 60)</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', margin: '0.5rem 0' }}>{lowPerformers}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {scores.length > 0 ? Math.round((lowPerformers / scores.length) * 100) : 0}% of evaluated candidates
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

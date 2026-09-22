import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { fetchInterviewerStats } from '../services/dashboardService';
import {
  FileCode,
  Calendar,
  Radio,
  CheckCircle,
  Users,
  Plus,
  Clock,
  BookOpen,
  FileText,
  ShieldAlert,
  Sparkles,
  BarChart3,
  Play,
  Eye,
} from 'lucide-react';
import '../styles/dashboard.css';

export const InterviewerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetchInterviewerStats();
        if (response.success) {
          setStats(response.data);
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch interviewer statistics.');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout title="Interviewer Platform Control Center">
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
          Loading platform metrics & active assessment roster...
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Interviewer Platform Control Center">
        <div className="error-banner">
          <span>{error}</span>
        </div>
      </DashboardLayout>
    );
  }

  const { metrics, recentAssessments = [] } = stats || {};

  return (
    <DashboardLayout title="Interviewer Control Center">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Top Control Bar */}
        <div className="section-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Platform Overview & Assessment Lifecycle</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Manage candidate enrollment, problem creation, real-time live assessments, AI evaluations & reports.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link to="/interviewer/reports" className="btn-secondary">
                <FileText size={16} color="#818cf8" />
                <span>Reports</span>
              </Link>
              <Link to="/interviewer/proctoring" className="btn-secondary">
                <ShieldAlert size={16} color="#f43f5e" />
                <span>Proctoring</span>
              </Link>
              <Link to="/interviewer/assessments/new" className="btn-primary">
                <Plus size={16} />
                <span>Create Assessment</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-top">
              <span className="metric-label">Total Assessments</span>
              <div className="metric-icon-box" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                <FileCode size={20} />
              </div>
            </div>
            <div className="metric-value">{metrics?.totalAssessments || 0}</div>
          </div>

          <div className="metric-card">
            <div className="metric-top">
              <span className="metric-label">Scheduled</span>
              <div className="metric-icon-box" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8' }}>
                <Calendar size={20} />
              </div>
            </div>
            <div className="metric-value">{metrics?.scheduledAssessments || 0}</div>
          </div>

          <div className="metric-card">
            <div className="metric-top">
              <span className="metric-label">Live Active</span>
              <div className="metric-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                <Radio size={20} />
              </div>
            </div>
            <div className="metric-value">{metrics?.liveAssessments || 0}</div>
          </div>

          <div className="metric-card">
            <div className="metric-top">
              <span className="metric-label">Completed</span>
              <div className="metric-icon-box" style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1' }}>
                <CheckCircle size={20} />
              </div>
            </div>
            <div className="metric-value">{metrics?.completedAssessments || 0}</div>
          </div>

          <div className="metric-card">
            <div className="metric-top">
              <span className="metric-label">Enrolled Candidates</span>
              <div className="metric-icon-box" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                <Users size={20} />
              </div>
            </div>
            <div className="metric-value">{metrics?.totalCandidates || 0}</div>
          </div>
        </div>

        {/* Recent Assessments Roster */}
        <div className="section-card" style={{ padding: '1.25rem' }}>
          <div className="section-header" style={{ marginBottom: '1rem' }}>
            <h2 className="section-title">Active Assessment Roster</h2>
            <Link to="/interviewer/assessments" style={{ fontSize: '0.825rem', color: '#818cf8', textDecoration: 'underline' }}>
              View All Assessments
            </Link>
          </div>

          {recentAssessments && recentAssessments.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Candidates</th>
                  <th>Questions</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentAssessments.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.title}</td>
                    <td>
                      <span className={`badge badge-${item.status.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8' }}>
                        <Clock size={14} />
                        <span>{item.duration} mins</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Users size={14} color="#818cf8" />
                        <span>{item._count?.candidates || 0} Candidates</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <BookOpen size={14} color="#38bdf8" />
                        <span>{item._count?.questions || 0} Questions</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <Link to={`/interviewer/assessments/${item.id}/live`} className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                          <Play size={12} /> Live Monitor
                        </Link>

                        <Link to={`/interviewer/assessments/${item.id}/results`} className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                          <BarChart3 size={12} /> Results
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <p>No assessments created yet. Click "Create Assessment" to build your first technical assessment.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

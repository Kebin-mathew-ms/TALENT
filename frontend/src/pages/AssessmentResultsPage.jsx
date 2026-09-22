import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { fetchAssessmentById } from '../services/assessmentService';
import { fetchReports, downloadReportPDF, downloadBulkReportsZIP } from '../services/reportService';
import {
  FileText,
  Download,
  Users,
  CheckCircle,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowLeft,
  Eye,
  Archive,
} from 'lucide-react';
import '../styles/dashboard.css';

export const AssessmentResultsPage = () => {
  const { id } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [assRes, repRes] = await Promise.all([
        fetchAssessmentById(id),
        fetchReports({ assessmentId: id, limit: 100 })
      ]);

      if (assRes.success) setAssessment(assRes.data);
      if (repRes.success) setReports(repRes.data);
    } catch (err) {
      setError('Failed to load assessment results.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleBulkDownload = async () => {
    setIsBulkDownloading(true);
    try {
      await downloadBulkReportsZIP(id);
    } catch (err) {
      alert('Failed to generate ZIP archive of reports.');
    } finally {
      setIsBulkDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Assessment Candidate Results">
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading assessment results & roster...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !assessment) {
    return (
      <DashboardLayout title="Assessment Candidate Results">
        <div className="error-banner">
          <span>{error || 'Assessment not found'}</span>
        </div>
      </DashboardLayout>
    );
  }

  const { title, candidates = [], sessions = [] } = assessment;
  const completedCount = sessions.filter((s) => s.status === 'COMPLETED' || s.status === 'SUBMITTED').length;
  const inProgressCount = sessions.filter((s) => s.status === 'ACTIVE').length;
  const notStartedCount = Math.max(0, candidates.length - completedCount - inProgressCount);

  const avgScore = reports.length > 0
    ? Math.round(reports.reduce((acc, r) => acc + (r.overallScore || 0), 0) / reports.length)
    : 0;

  return (
    <DashboardLayout title={`Results: ${title}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header Control Card */}
        <div className="section-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{title}</h2>
                <span className="badge badge-completed" style={{ fontSize: '0.75rem' }}>
                  {sessions.length} Candidates Enrolled
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                View complete performance breakdown, AI scores, and PDF reports for each candidate.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <Link to={`/interviewer/assessments/${id}`} className="btn-secondary">
                <ArrowLeft size={16} />
                <span>Assessment Details</span>
              </Link>

              <button className="btn-primary" onClick={handleBulkDownload} disabled={isBulkDownloading || reports.length === 0}>
                <Archive size={16} />
                <span>{isBulkDownloading ? 'Creating ZIP Archive...' : 'Download All Reports (ZIP)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
          <div className="section-card" style={{ padding: '1.25rem', borderLeft: '4px solid #818cf8' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Total Candidates
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>
              {candidates.length}
            </div>
          </div>

          <div className="section-card" style={{ padding: '1.25rem', borderLeft: '4px solid #34d399' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Completed Sessions
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', marginTop: '0.25rem' }}>
              {completedCount}
            </div>
          </div>

          <div className="section-card" style={{ padding: '1.25rem', borderLeft: '4px solid #fbbf24' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              In Progress / Pending
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.25rem' }}>
              {inProgressCount + notStartedCount}
            </div>
          </div>

          <div className="section-card" style={{ padding: '1.25rem', borderLeft: '4px solid #c084fc' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Average AI Score
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#c084fc', marginTop: '0.25rem' }}>
              {avgScore}/100
            </div>
          </div>
        </div>

        {/* Candidate Results Table */}
        <div className="section-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="#818cf8" /> Candidate Roster Results & Reports
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem' }}>Candidate Name</th>
                  <th style={{ padding: '0.75rem' }}>Session Status</th>
                  <th style={{ padding: '0.75rem' }}>Overall AI Score</th>
                  <th style={{ padding: '0.75rem' }}>Proctoring Score</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => {
                  const sessionObj = sessions.find((s) => s.candidateId === c.candidateId);
                  const reportObj = reports.find((r) => r.sessionId === sessionObj?.id || r.candidateId === c.candidateId);

                  return (
                    <tr key={c.candidateId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                        {c.candidate?.name}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.candidate?.email}</div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span className={`badge badge-${(sessionObj?.status || 'WAITING').toLowerCase()}`} style={{ fontSize: '0.7rem' }}>
                          {sessionObj?.status || 'WAITING'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: '#c084fc' }}>
                        {reportObj ? `${reportObj.overallScore}/100` : 'Pending'}
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: (sessionObj?.proctoringScore ?? 100) < 70 ? '#f43f5e' : '#34d399' }}>
                        {sessionObj?.proctoringScore ?? 100}%
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        {reportObj ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            <Link to={`/interviewer/reports/${reportObj.id}`} className="btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.775rem' }}>
                              <Eye size={14} />
                              <span>View Report</span>
                            </Link>

                            <button
                              className="btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.775rem' }}
                              onClick={() => downloadReportPDF(reportObj.id, `${c.candidate?.name}_Report.pdf`)}
                            >
                              <Download size={14} />
                              <span>PDF</span>
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Report pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { fetchReportById, downloadReportPDF, generateReport } from '../services/reportService';
import { saveFeedback } from '../services/feedbackService';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Download,
  ArrowLeft,
  Sparkles,
  ShieldAlert,
  User,
  Clock,
  Code2,
  CheckCircle,
  AlertTriangle,
  Save,
  RefreshCw,
} from 'lucide-react';
import '../styles/dashboard.css';

export const CandidateReportDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const isInterviewer = user?.role === 'INTERVIEWER';

  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Feedback form state
  const [feedbackData, setFeedbackData] = useState({
    technicalKnowledge: 85,
    problemSolving: 85,
    communication: 80,
    codeQuality: 85,
    overallPerformance: 85,
    comments: ''
  });
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState(null);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const res = await fetchReportById(id);
      if (res.success && res.data) {
        const rObj = res.data;
        setReport(rObj);

        // Pre-fill feedback form if existing
        if (rObj.session?.feedback) {
          const f = rObj.session.feedback;
          setFeedbackData({
            technicalKnowledge: f.technicalKnowledge || 85,
            problemSolving: f.problemSolving || 85,
            communication: f.communication || 80,
            codeQuality: f.codeQuality || 85,
            overallPerformance: f.overallPerformance || 85,
            comments: f.comments || ''
          });
        }
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load report.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [id]);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      await downloadReportPDF(id, `${report.session?.candidate?.name || 'Candidate'}_Assessment_Report.pdf`);
    } catch (err) {
      alert('Failed to download PDF report.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    if (!report?.sessionId) return;
    setIsSavingFeedback(true);
    setFeedbackSuccessMsg(null);

    try {
      const res = await saveFeedback({
        sessionId: report.sessionId,
        assessmentId: report.assessmentId,
        candidateId: report.candidateId,
        ...feedbackData
      });

      if (res.success) {
        setFeedbackSuccessMsg('Interviewer qualitative evaluation saved & report updated!');
        loadReport();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save feedback.');
    } finally {
      setIsSavingFeedback(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Assessment Candidate Report">
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading candidate report details...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !report) {
    return (
      <DashboardLayout title="Assessment Candidate Report">
        <div className="error-banner">
          <span>{error || 'Report not found'}</span>
        </div>
      </DashboardLayout>
    );
  }

  const candidate = report.session?.candidate || {};
  const assessment = report.session?.assessment || {};
  const submissions = report.session?.submissions || [];
  const proctoringIncidents = report.session?.proctoringIncidents || [];
  const latestAiEval = submissions[0]?.aiEvaluation;

  return (
    <DashboardLayout title={`Report: ${candidate.name || 'Candidate'}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Top Action Header */}
        <div className="section-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{candidate.name}</h2>
                <span className={`badge badge-${report.status.toLowerCase()}`}>
                  Report Status: {report.status}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Assessment: {assessment.title} • Date: {new Date(report.generatedAt || report.updatedAt).toLocaleDateString()}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <Link to="/interviewer/reports" className="btn-secondary">
                <ArrowLeft size={16} />
                <span>Back to Reports</span>
              </Link>

              <button className="btn-primary" onClick={handleDownloadPDF} disabled={isDownloading}>
                <Download size={16} />
                <span>{isDownloading ? 'Generating PDF...' : 'Download PDF Report'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Candidate & Assessment Meta Info Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div className="section-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} color="#818cf8" /> Candidate Profile
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Name:</span> <strong style={{ color: '#fff' }}>{candidate.name}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Email:</span> <strong style={{ color: '#fff' }}>{candidate.email}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Education:</span> <strong style={{ color: '#fff' }}>{candidate.education || 'N/A'}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Skills:</span> <strong style={{ color: '#fff' }}>{candidate.skills || 'N/A'}</strong></div>
            </div>
          </div>

          <div className="section-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="#34d399" /> Assessment Session Summary
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Title:</span> <strong style={{ color: '#fff' }}>{assessment.title}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Duration:</span> <strong style={{ color: '#fff' }}>{assessment.duration} mins</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Submissions:</span> <strong style={{ color: '#818cf8' }}>{submissions.length} Total</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Proctoring Score:</span> <strong style={{ color: report.session?.proctoringScore < 70 ? '#f43f5e' : '#34d399' }}>{report.session?.proctoringScore ?? 100}%</strong></div>
            </div>
          </div>
        </div>

        {/* Visual Overall Score Breakdown Card */}
        <div className="section-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))', border: '1px solid rgba(99,102,241,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#c084fc', textTransform: 'uppercase', fontWeight: 700 }}>
                Candidate Technical Evaluation Score
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', marginTop: '0.2rem' }}>
                {report.overallScore} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ 100</span>
              </div>
            </div>

            {latestAiEval && (
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                <div style={{ background: '#0b0f19', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Correctness</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>{latestAiEval.correctness}/100</div>
                </div>
                <div style={{ background: '#0b0f19', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Code Quality</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>{latestAiEval.codeQuality}/100</div>
                </div>
                <div style={{ background: '#0b0f19', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Efficiency</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>{latestAiEval.efficiency}/100</div>
                </div>
                <div style={{ background: '#0b0f19', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Problem Solving</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#c084fc' }}>{latestAiEval.problemSolving}/100</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Question Submissions & Code Snapshots */}
        <div className="section-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Code2 size={18} color="#38bdf8" /> Submissions & Code Snapshots ({submissions.length})
          </h3>

          {submissions.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No code submissions recorded for this assessment.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {submissions.map((sub, idx) => (
                <div key={sub.id} style={{ background: '#0b0f19', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      Q{idx + 1}. {sub.question?.title || 'Coding Problem'} ({sub.language})
                    </div>
                    <span className={`badge badge-${sub.status.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>
                      {sub.status}
                    </span>
                  </div>

                  <pre style={{ background: '#131b2e', padding: '0.85rem', borderRadius: 6, border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '0.825rem', color: '#e2e8f0', overflowX: 'auto' }}>
                    {sub.code}
                  </pre>

                  {sub.aiEvaluation && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(168,85,247,0.08)', borderRadius: 6, border: '1px solid rgba(168,85,247,0.2)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#c084fc', marginBottom: '0.35rem' }}>
                        AI Evaluation Feedback
                      </div>
                      <p style={{ fontSize: '0.825rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                        {sub.aiEvaluation.feedback}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Proctoring Incident Summary Audit */}
        <div className="section-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={18} color="#f43f5e" /> Proctoring Audit Log ({proctoringIncidents.length} Flags)
          </h3>

          {proctoringIncidents.length === 0 ? (
            <div style={{ color: '#34d399', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle size={16} /> 100% Clean Proctoring Record — No suspicious activity detected.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'left' }}>
                    <th style={{ padding: '0.6rem' }}>Event Type</th>
                    <th style={{ padding: '0.6rem' }}>Warning Level</th>
                    <th style={{ padding: '0.6rem' }}>Severity</th>
                    <th style={{ padding: '0.6rem' }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {proctoringIncidents.map((inc) => (
                    <tr key={inc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.6rem', fontWeight: 600, color: '#fbbf24' }}>{inc.eventType}</td>
                      <td style={{ padding: '0.6rem', color: '#f87171' }}>Warning #{inc.warningNumber}</td>
                      <td style={{ padding: '0.6rem' }}>
                        <span className={`badge badge-${inc.severity.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                          {inc.severity}
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.775rem' }}>
                        {new Date(inc.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Qualitative Interviewer Evaluation Form (Interviewer only) */}
        {isInterviewer && (
          <div className="section-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="#a855f7" /> Interviewer Qualitative Score & Comments
            </h3>

            {feedbackSuccessMsg && (
              <div className="success-banner" style={{ marginBottom: '1rem' }}>
                <CheckCircle size={16} />
                <span>{feedbackSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Tech Knowledge (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-input"
                    value={feedbackData.technicalKnowledge}
                    onChange={(e) => setFeedbackData({ ...feedbackData, technicalKnowledge: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Problem Solving (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-input"
                    value={feedbackData.problemSolving}
                    onChange={(e) => setFeedbackData({ ...feedbackData, problemSolving: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Communication (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-input"
                    value={feedbackData.communication}
                    onChange={(e) => setFeedbackData({ ...feedbackData, communication: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Code Quality (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-input"
                    value={feedbackData.codeQuality}
                    onChange={(e) => setFeedbackData({ ...feedbackData, codeQuality: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Interviewer Notes & Decision Feedback</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Enter detailed qualitative feedback..."
                  value={feedbackData.comments}
                  onChange={(e) => setFeedbackData({ ...feedbackData, comments: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary" disabled={isSavingFeedback}>
                  <Save size={16} />
                  <span>{isSavingFeedback ? 'Saving Feedback...' : 'Save Evaluation & Update Report'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

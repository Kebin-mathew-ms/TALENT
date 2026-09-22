import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { fetchAssessments } from '../services/assessmentService';
import { getAssessmentProctoringIncidents } from '../services/proctoringService';
import { getAssessmentSubmissions } from '../services/submissionService';
import {
  ShieldAlert,
  Search,
  Filter,
  Users,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Clock,
  Code2,
} from 'lucide-react';
import '../styles/dashboard.css';

export const InterviewerProctoringPage = () => {
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [incidents, setIncidents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial list of assessments
  useEffect(() => {
    const loadAssessments = async () => {
      try {
        const res = await fetchAssessments();
        if (res.success && res.data) {
          setAssessments(res.data);
          if (res.data.length > 0) {
            setSelectedAssessmentId(res.data[0].id.toString());
          }
        }
      } catch (err) {
        setError('Failed to load assessments.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAssessments();
  }, []);

  // Fetch proctoring incidents & submissions when selected assessment changes
  useEffect(() => {
    if (!selectedAssessmentId) return;

    const loadAssessmentDetails = async () => {
      setIsLoading(true);
      try {
        const [procRes, subRes] = await Promise.all([
          getAssessmentProctoringIncidents(selectedAssessmentId),
          getAssessmentSubmissions(selectedAssessmentId)
        ]);

        if (procRes.success) setIncidents(procRes.data);
        if (subRes.success) setSubmissions(subRes.data);
      } catch (err) {
        console.error('Error loading proctoring reports:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAssessmentDetails();
  }, [selectedAssessmentId]);

  const filteredIncidents = incidents.filter((inc) => {
    const nameMatch = inc.candidate?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const eventMatch = inc.eventType?.toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || eventMatch;
  });

  return (
    <DashboardLayout title="Automated Proctoring & AI Evaluation Audit">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Top Control Bar */}
        <div className="section-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ShieldAlert size={22} color="#f43f5e" /> Proctoring & Integrity Audit Center
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Monitor candidate tab switches, focus loss, media events, and AI code scores.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={16} color="var(--text-muted)" />
                <select
                  className="form-input"
                  style={{ width: 220, fontSize: '0.85rem' }}
                  value={selectedAssessmentId}
                  onChange={(e) => setSelectedAssessmentId(e.target.value)}
                >
                  <option value="">Select Assessment...</option>
                  {assessments.map((ass) => (
                    <option key={ass.id} value={ass.id}>
                      {ass.title}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ position: 'relative', width: 220 }}>
                <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Filter candidate/event..."
                  style={{ paddingLeft: 32, fontSize: '0.85rem' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
          <div className="section-card" style={{ padding: '1.25rem', borderLeft: '4px solid #f43f5e' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Total Proctoring Flags
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f43f5e', marginTop: '0.35rem' }}>
              {incidents.length}
            </div>
          </div>

          <div className="section-card" style={{ padding: '1.25rem', borderLeft: '4px solid #a855f7' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Evaluated Code Submissions
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#c084fc', marginTop: '0.35rem' }}>
              {submissions.filter((s) => s.status === 'EVALUATED').length}
            </div>
          </div>

          <div className="section-card" style={{ padding: '1.25rem', borderLeft: '4px solid #34d399' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Overall Assessment Integrity
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: incidents.length > 5 ? '#fbbf24' : '#34d399', marginTop: '0.35rem' }}>
              {incidents.length === 0 ? '100% Clean' : `${Math.max(40, 100 - incidents.length * 10)}% Score`}
            </div>
          </div>
        </div>

        {/* Proctoring Incidents Audit Logs Table */}
        <div className="section-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} color="#f59e0b" /> Detailed Proctoring Incident Logs
          </h3>

          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading incident logs...</div>
          ) : filteredIncidents.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No proctoring incidents recorded for this assessment.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem' }}>Candidate</th>
                    <th style={{ padding: '0.75rem' }}>Event Type</th>
                    <th style={{ padding: '0.75rem' }}>Warning Level</th>
                    <th style={{ padding: '0.75rem' }}>Proctoring Score</th>
                    <th style={{ padding: '0.75rem' }}>Logged Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncidents.map((inc) => (
                    <tr key={inc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                        {inc.candidate?.name}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inc.candidate?.email}</div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: inc.eventType === 'TAB_SWITCH' ? 'rgba(244,63,94,0.15)' : 'rgba(245,158,11,0.15)',
                            color: inc.eventType === 'TAB_SWITCH' ? '#f43f5e' : '#fbbf24',
                          }}
                        >
                          {inc.eventType}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: '#f87171' }}>
                        Warning #{inc.warningNumber}
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: inc.session?.proctoringScore < 70 ? '#f43f5e' : '#34d399' }}>
                        {inc.session?.proctoringScore ?? 85}%
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        {new Date(inc.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

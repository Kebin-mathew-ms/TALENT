import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { fetchReports, downloadReportPDF, generateReport } from '../services/reportService';
import {
  FileText,
  Search,
  Download,
  Eye,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import '../styles/dashboard.css';

export const InterviewerReportListPage = () => {
  const [reports, setReports] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetchReports({
        page,
        limit: 10,
        search: searchTerm,
        status: statusFilter
      });
      if (res.success) {
        setReports(res.data);
        setMeta(res.meta);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Failed to fetch assessment reports.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadReports();
  };

  const handleDownload = async (reportId, candidateName) => {
    setActionLoading((prev) => ({ ...prev, [reportId]: true }));
    try {
      await downloadReportPDF(reportId, `${candidateName || 'Candidate'}_Report.pdf`);
    } catch (err) {
      alert('Failed to download PDF report.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  const handleRegenerate = async (sessionId, reportId) => {
    setActionLoading((prev) => ({ ...prev, [reportId]: true }));
    try {
      const res = await generateReport(sessionId);
      if (res.success) {
        loadReports();
      }
    } catch (err) {
      alert('Failed to regenerate report.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  return (
    <DashboardLayout title="Assessment Candidate Reports">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Top Controls Card */}
        <div className="section-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FileText size={22} color="#818cf8" /> Candidate Technical Assessment Reports
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Browse, review, and download PDF reports for all completed candidate assessments.
              </p>
            </div>

            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Filter size={16} color="var(--text-muted)" />
                <select
                  className="form-input"
                  style={{ width: 160, fontSize: '0.85rem' }}
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                >
                  <option value="">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="GENERATING">Generating</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              <div style={{ position: 'relative', width: 220 }}>
                <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search candidate/test..."
                  style={{ paddingLeft: 32, fontSize: '0.85rem' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}>
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Reports Data Table */}
        <div className="section-card" style={{ padding: '1.25rem' }}>
          {isLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading candidate reports...</div>
          ) : reports.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No assessment reports found matching your criteria.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem' }}>Candidate</th>
                    <th style={{ padding: '0.75rem' }}>Assessment</th>
                    <th style={{ padding: '0.75rem' }}>Overall Score</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem' }}>Generated Date</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                        {report.session?.candidate?.name || 'Candidate'}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{report.session?.candidate?.email}</div>
                      </td>
                      <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>
                        {report.session?.assessment?.title || 'Technical Assessment'}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            background: report.overallScore >= 80 ? 'rgba(52,211,153,0.15)' : 'rgba(99,102,241,0.15)',
                            color: report.overallScore >= 80 ? '#34d399' : '#818cf8',
                          }}
                        >
                          {report.overallScore}/100
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span className={`badge badge-${report.status.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>
                          {report.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        {new Date(report.generatedAt || report.updatedAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <Link to={`/interviewer/reports/${report.id}`} className="btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.775rem' }}>
                            <Eye size={14} />
                            <span>View</span>
                          </Link>

                          <button
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.775rem' }}
                            onClick={() => handleDownload(report.id, report.session?.candidate?.name)}
                            disabled={actionLoading[report.id]}
                          >
                            <Download size={14} />
                            <span>PDF</span>
                          </button>

                          <button
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.775rem' }}
                            title="Regenerate Report"
                            onClick={() => handleRegenerate(report.sessionId, report.id)}
                            disabled={actionLoading[report.id]}
                          >
                            <RefreshCw size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {meta.totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Page {meta.page} of {meta.totalPages} ({meta.total} Total Reports)
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn-secondary"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

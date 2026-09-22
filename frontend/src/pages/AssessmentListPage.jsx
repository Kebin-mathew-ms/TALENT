import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { fetchAssessments, deleteAssessment } from '../services/assessmentService';
import { Pagination } from '../components/Pagination';
import { Search, Plus, FileCode, Eye, Edit3, Trash2, Clock, Users, BookOpen } from 'lucide-react';
import '../styles/dashboard.css';

export const AssessmentListPage = () => {
  const [assessments, setAssessments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchAssessments({ page, limit: 10, search, status });
      if (response.success) {
        setAssessments(response.data || []);
        setPagination(response.pagination);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch assessments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, search, status]);

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete assessment "${title}"?`)) {
      try {
        const response = await deleteAssessment(id);
        if (response.success) {
          loadData();
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete assessment.');
      }
    }
  };

  return (
    <DashboardLayout title="Assessment Management">
      <div className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Assessment Campaigns</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Create multi-candidate assessments, configure problem sets, and set schedules.
            </p>
          </div>

          <Link to="/interviewer/assessments/new" className="btn-primary">
            <Plus size={16} />
            <span>Create Assessment</span>
          </Link>
        </div>

        {/* Search & Filter */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-dim)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem', width: '100%' }}
              placeholder="Search by assessment title..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="form-input"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="LIVE">Live</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {error && (
          <div className="error-banner">
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading assessment list...
          </div>
        ) : assessments.length > 0 ? (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Assessment Title</th>
                  <th>Status</th>
                  <th>Start Time</th>
                  <th>Duration</th>
                  <th>Candidates</th>
                  <th>Questions</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a) => {
                  const statusBadge = (a.dynamicStatus || a.status).toLowerCase();
                  return (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600 }}>{a.title}</td>
                      <td>
                        <span className={`badge badge-${statusBadge}`}>
                          {a.dynamicStatus || a.status}
                        </span>
                      </td>
                      <td>
                        {a.startTime ? new Date(a.startTime).toLocaleString() : 'Not Scheduled'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
                          <Clock size={14} />
                          <span>{a.duration} mins</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Users size={14} color="#818cf8" />
                          <span>{a._count?.candidates || 0} Candidates</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <BookOpen size={14} color="#38bdf8" />
                          <span>{a._count?.questions || 0} Questions</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-dim)' }}>
                        {new Date(a.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                            onClick={() => navigate(`/interviewer/assessments/${a.id}`)}
                            title="View Assessment Details"
                          >
                            <Eye size={15} />
                          </button>
                          {a.status !== 'LIVE' && a.status !== 'COMPLETED' && (
                            <button
                              className="btn-secondary"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                              onClick={() => navigate(`/interviewer/assessments/${a.id}/edit`)}
                              title="Edit Assessment"
                            >
                              <Edit3 size={15} />
                            </button>
                          )}
                          {a.status === 'DRAFT' && (
                            <button
                              className="btn-secondary"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', color: 'var(--accent-rose)' }}
                              onClick={() => handleDelete(a.id, a.title)}
                              title="Delete Assessment"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
          </>
        ) : (
          <div className="empty-state">
            <FileCode size={48} className="empty-icon" />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#e2e8f0' }}>No assessments created.</h3>
            <p>Click "Create Assessment" to build a multi-candidate technical evaluation.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

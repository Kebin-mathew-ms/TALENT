import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { fetchCandidates, deleteCandidate } from '../services/candidateService';
import { Pagination } from '../components/Pagination';
import { Search, UserPlus, Eye, Edit3, Trash2, Users } from 'lucide-react';
import '../styles/dashboard.css';

export const CandidateListPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchCandidates({ page, limit: 10, search });
      if (response.success) {
        setCandidates(response.data || []);
        setPagination(response.pagination);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load candidates list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, search]);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete candidate "${name}"?`)) {
      try {
        const response = await deleteCandidate(id);
        if (response.success) {
          loadData();
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete candidate.');
      }
    }
  };

  return (
    <DashboardLayout title="Candidate Management">
      <div className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Candidate Directory</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Manage candidate accounts, search history, and view assigned technical assessments.
            </p>
          </div>

          <Link to="/interviewer/candidates/new" className="btn-primary">
            <UserPlus size={16} />
            <span>Add Candidate</span>
          </Link>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-dim)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem', width: '100%' }}
              placeholder="Search by name, email, or skills..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading candidate directory...
          </div>
        ) : candidates.length > 0 ? (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Candidate Name</th>
                  <th>Email Address</th>
                  <th>Phone</th>
                  <th>Education</th>
                  <th>Key Skills</th>
                  <th>Assessments</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((cand) => (
                  <tr key={cand.id}>
                    <td style={{ fontWeight: 600 }}>{cand.name}</td>
                    <td style={{ color: '#818cf8' }}>{cand.email}</td>
                    <td>{cand.phone || '—'}</td>
                    <td style={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cand.education || '—'}
                    </td>
                    <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cand.skills || '—'}
                    </td>
                    <td>
                      <span className="badge badge-candidate">
                        {cand._count?.candidateAssessment || 0} Assigned
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-live">Active</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                          onClick={() => navigate(`/interviewer/candidates/${cand.id}`)}
                          title="View Candidate Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                          onClick={() => navigate(`/interviewer/candidates/${cand.id}/edit`)}
                          title="Edit Candidate Profile"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', color: 'var(--accent-rose)' }}
                          onClick={() => handleDelete(cand.id, cand.name)}
                          title="Delete Candidate"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
          </>
        ) : (
          <div className="empty-state">
            <Users size={48} className="empty-icon" />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#e2e8f0' }}>No candidates found.</h3>
            <p>Click "Add Candidate" to register candidate accounts for technical assessments.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

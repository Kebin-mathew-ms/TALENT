import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { fetchQuestions, deleteQuestion } from '../services/questionService';
import { Pagination } from '../components/Pagination';
import { Search, Plus, BookOpen, Edit3, Trash2, Clock, Code2 } from 'lucide-react';
import '../styles/dashboard.css';

export const QuestionListPage = () => {
  const [questions, setQuestions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [language, setLanguage] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchQuestions({
        page,
        limit: 10,
        search,
        category,
        difficulty,
        language,
      });
      if (response.success) {
        setQuestions(response.data || []);
        setPagination(response.pagination);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch question bank.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, search, category, difficulty, language]);

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete question "${title}"?`)) {
      try {
        const response = await deleteQuestion(id);
        if (response.success) {
          alert(response.message);
          loadData();
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete question.');
      }
    }
  };

  return (
    <DashboardLayout title="Question Bank">
      <div className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Technical Question Repository</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Create, categorize, and organize coding problems for technical assessments.
            </p>
          </div>

          <Link to="/interviewer/questions/new" className="btn-primary">
            <Plus size={16} />
            <span>Add Question</span>
          </Link>
        </div>

        {/* Filters & Search */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-dim)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem', width: '100%' }}
              placeholder="Search by title or description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="form-input"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Categories</option>
            <option value="JAVASCRIPT">JavaScript</option>
            <option value="PYTHON">Python</option>
            <option value="JAVA">Java</option>
            <option value="CPP">C++</option>
            <option value="DATA_STRUCTURES">Data Structures</option>
            <option value="ALGORITHMS">Algorithms</option>
            <option value="DATABASE">Database</option>
            <option value="WEB_DEVELOPMENT">Web Development</option>
          </select>

          <select
            className="form-input"
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>

          <select
            className="form-input"
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Languages</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
        </div>

        {error && (
          <div className="error-banner">
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading question repository...
          </div>
        ) : questions.length > 0 ? (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Question Title</th>
                  <th>Category</th>
                  <th>Difficulty</th>
                  <th>Language</th>
                  <th>Time Limit</th>
                  <th>Created By</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.id}>
                    <td style={{ fontWeight: 600 }}>{q.title}</td>
                    <td>
                      <span className="badge badge-scheduled" style={{ fontSize: '0.7rem' }}>
                        {q.category}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          background: q.difficulty === 'EASY' ? 'rgba(16,185,129,0.15)' : q.difficulty === 'MEDIUM' ? 'rgba(245,158,11,0.15)' : 'rgba(244,63,94,0.15)',
                          color: q.difficulty === 'EASY' ? '#34d399' : q.difficulty === 'MEDIUM' ? '#fbbf24' : '#fb7185',
                          fontWeight: 600,
                        }}
                      >
                        {q.difficulty}
                      </span>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Code2 size={14} color="#818cf8" />
                        <span>{q.language}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
                        <Clock size={14} />
                        <span>{q.timeLimit}s</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{q.creator?.name || 'Admin'}</td>
                    <td style={{ color: 'var(--text-dim)' }}>
                      {new Date(q.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                          onClick={() => navigate(`/interviewer/questions/${q.id}/edit`)}
                          title="Edit Question"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', color: 'var(--accent-rose)' }}
                          onClick={() => handleDelete(q.id, q.title)}
                          title="Delete Question"
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
            <BookOpen size={48} className="empty-icon" />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#e2e8f0' }}>No questions found.</h3>
            <p>Click "Add Question" to populate your technical problem bank.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

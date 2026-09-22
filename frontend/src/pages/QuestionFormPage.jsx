import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { createQuestion, fetchQuestionById, updateQuestion } from '../services/questionService';
import { Plus, Save, ArrowLeft, AlertCircle } from 'lucide-react';
import '../styles/dashboard.css';

export const QuestionFormPage = () => {
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    language: 'javascript',
    expectedOutput: '',
    timeLimit: 30,
  });

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    if (isEditMode) {
      const loadQuestion = async () => {
        try {
          const response = await fetchQuestionById(id);
          if (response.success && response.data) {
            const q = response.data;
            setFormData({
              title: q.title || '',
              description: q.description || '',
              category: q.category || 'JAVASCRIPT',
              difficulty: q.difficulty || 'MEDIUM',
              language: q.language || 'javascript',
              expectedOutput: q.expectedOutput || '',
              timeLimit: q.timeLimit || 30,
            });
          } else {
            setError(response.message);
          }
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to fetch question details.');
        } finally {
          setIsLoading(false);
        }
      };

      loadQuestion();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isEditMode) {
        const res = await updateQuestion(id, formData);
        if (res.success) {
          navigate('/interviewer/questions');
        } else {
          setError(res.message);
        }
      } else {
        const res = await createQuestion(formData);
        if (res.success) {
          navigate('/interviewer/questions');
        } else {
          setError(res.message);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while saving the question.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title={isEditMode ? 'Edit Question' : 'Add Question'}>
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading question editor...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={isEditMode ? 'Edit Question' : 'Add Technical Question'}>
      <div className="section-card" style={{ maxWidth: 840 }}>
        <div className="section-header">
          <div>
            <h2 className="section-title">
              {isEditMode ? `Edit Question #${id}` : 'Create Technical Problem'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Define problem title, detailed description, expected output, and target execution limits.
            </p>
          </div>

          <Link to="/interviewer/questions" className="btn-secondary">
            <ArrowLeft size={16} />
            <span>Back to Question Bank</span>
          </Link>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Question Title *</label>
            <input
              type="text"
              name="title"
              className="form-input"
              placeholder="e.g. Reverse a Linked List"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Problem Description * (Markdown Supported)</label>
            <textarea
              name="description"
              className="form-input"
              rows={6}
              style={{ resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}
              placeholder="Given the head of a singly linked list, reverse the list..."
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                name="category"
                className="form-input"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="JAVASCRIPT">JavaScript</option>
                <option value="PYTHON">Python</option>
                <option value="JAVA">Java</option>
                <option value="CPP">C++</option>
                <option value="DATA_STRUCTURES">Data Structures</option>
                <option value="ALGORITHMS">Algorithms</option>
                <option value="DATABASE">Database</option>
                <option value="WEB_DEVELOPMENT">Web Development</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Difficulty *</label>
              <select
                name="difficulty"
                className="form-input"
                value={formData.difficulty}
                onChange={handleChange}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Language *</label>
              <select
                name="language"
                className="form-input"
                value={formData.language}
                onChange={handleChange}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Expected Output / Test Spec</label>
              <input
                type="text"
                name="expectedOutput"
                className="form-input"
                placeholder="e.g. [5, 4, 3, 2, 1]"
                value={formData.expectedOutput}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Time Limit (Seconds)</label>
              <input
                type="number"
                name="timeLimit"
                className="form-input"
                min={5}
                max={300}
                value={formData.timeLimit}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isEditMode ? <Save size={18} /> : <Plus size={18} />}
              <span>{isSubmitting ? 'Saving...' : isEditMode ? 'Update Question' : 'Create Question'}</span>
            </button>
            <Link to="/interviewer/questions" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

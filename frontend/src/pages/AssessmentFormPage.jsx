import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { createAssessment, fetchAssessmentById, updateAssessment } from '../services/assessmentService';
import { CandidateSelector } from '../components/CandidateSelector';
import { QuestionSelector } from '../components/QuestionSelector';
import { Plus, Save, ArrowLeft, AlertCircle, Calendar, Clock } from 'lucide-react';
import '../styles/dashboard.css';

export const AssessmentFormPage = () => {
  const { id } = useParams();
  const isEditMode = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [startTime, setStartTime] = useState('');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    if (isEditMode) {
      const loadAssessment = async () => {
        try {
          const response = await fetchAssessmentById(id);
          if (response.success && response.data) {
            const a = response.data;
            setTitle(a.title || '');
            setDescription(a.description || '');
            setDuration(a.duration || 60);

            if (a.startTime) {
              // Convert ISO string to format suitable for datetime-local input
              const dateObj = new Date(a.startTime);
              const formatted = dateObj.toISOString().slice(0, 16);
              setStartTime(formatted);
            }

            setSelectedCandidateIds(a.candidates ? a.candidates.map((c) => c.candidateId) : []);
            setSelectedQuestionIds(a.questions ? a.questions.map((q) => q.questionId) : []);
          } else {
            setError(response.message);
          }
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to fetch assessment details.');
        } finally {
          setIsLoading(false);
        }
      };

      loadAssessment();
    }
  }, [id, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide an assessment title.');
      return;
    }

    if (selectedCandidateIds.length === 0) {
      setError('Please select at least one candidate for this assessment.');
      return;
    }

    if (selectedQuestionIds.length === 0) {
      setError('Please select at least one question for this assessment.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      title,
      description,
      duration: parseInt(duration, 10) || 60,
      startTime: startTime ? new Date(startTime).toISOString() : null,
      candidateIds: selectedCandidateIds,
      questionIds: selectedQuestionIds,
    };

    try {
      if (isEditMode) {
        const res = await updateAssessment(id, payload);
        if (res.success) {
          navigate(`/interviewer/assessments/${id}`);
        } else {
          setError(res.message);
        }
      } else {
        const res = await createAssessment(payload);
        if (res.success) {
          navigate('/interviewer/assessments');
        } else {
          setError(res.message);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while saving the assessment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title={isEditMode ? 'Edit Assessment' : 'Create Assessment'}>
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading assessment builder...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={isEditMode ? 'Edit Assessment' : 'Create Multi-Candidate Assessment'}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div className="section-card" style={{ marginBottom: '1.5rem' }}>
          <div className="section-header">
            <div>
              <h2 className="section-title">
                {isEditMode ? `Edit Assessment #${id}` : 'Assessment Configuration'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Set assessment details, duration schedule, assigned candidates, and ordered problem set.
              </p>
            </div>

            <Link to="/interviewer/assessments" className="btn-secondary">
              <ArrowLeft size={16} />
              <span>Back to Assessments</span>
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
              <label className="form-label">Assessment Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Full Stack JavaScript Technical Evaluation"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description / Candidate Instructions</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Brief guidelines or instructions for candidates taking this assessment..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={16} /> Scheduled Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={16} /> Duration (Minutes) *
                </label>
                <input
                  type="number"
                  className="form-input"
                  min={15}
                  max={300}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Candidate Selector Component */}
            <div style={{ marginTop: '1.5rem' }}>
              <CandidateSelector
                selectedCandidateIds={selectedCandidateIds}
                onChange={setSelectedCandidateIds}
              />
            </div>

            {/* Question Selector Component */}
            <div style={{ marginTop: '1.5rem' }}>
              <QuestionSelector
                selectedQuestionIds={selectedQuestionIds}
                onChange={setSelectedQuestionIds}
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '2rem',
                borderTop: '1px solid var(--border)',
                paddingTop: '1.25rem',
              }}
            >
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isEditMode ? <Save size={18} /> : <Plus size={18} />}
                <span>{isSubmitting ? 'Saving Assessment...' : isEditMode ? 'Update Assessment' : 'Save & Publish Assessment'}</span>
              </button>
              <Link to="/interviewer/assessments" className="btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

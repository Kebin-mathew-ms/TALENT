import React, { useState, useEffect } from 'react';
import { fetchQuestions } from '../services/questionService';
import { Search, BookOpen, Check, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';

export const QuestionSelector = ({ selectedQuestionIds = [], onChange }) => {
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadQuestions = async () => {
      setIsLoading(true);
      try {
        const response = await fetchQuestions({ limit: 100, search, category, difficulty });
        if (response.success) {
          setAvailableQuestions(response.data || []);
        }
      } catch (err) {
        console.error('Failed to load questions for selector:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [search, category, difficulty]);

  const toggleQuestionSelect = (id) => {
    if (selectedQuestionIds.includes(id)) {
      onChange(selectedQuestionIds.filter((qId) => qId !== id));
    } else {
      onChange([...selectedQuestionIds, id]);
    }
  };

  const moveQuestion = (index, direction) => {
    const updated = [...selectedQuestionIds];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= updated.length) return;

    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    onChange(updated);
  };

  const removeSelectedQuestion = (id) => {
    onChange(selectedQuestionIds.filter((qId) => qId !== id));
  };

  const questionMap = new Map(availableQuestions.map((q) => [q.id, q]));

  return (
    <div className="section-card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={18} color="#38bdf8" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Select & Order Questions</h3>
        </div>
        <span className="badge badge-scheduled">
          {selectedQuestionIds.length} question{selectedQuestionIds.length === 1 ? '' : 's'} selected
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.25rem', width: '100%', fontSize: '0.85rem' }}
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-input"
          style={{ fontSize: '0.85rem' }}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
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
          style={{ fontSize: '0.85rem' }}
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="">All Difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
      </div>

      {/* Selected & Ordered List */}
      {selectedQuestionIds.length > 0 && (
        <div style={{ marginBottom: '1.25rem', padding: '0.85rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#a5b4fc', marginBottom: '0.5rem' }}>
            Preserved Display Sequence (Order in Assessment):
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {selectedQuestionIds.map((qId, idx) => {
              const q = questionMap.get(qId);
              return (
                <div
                  key={qId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: '#818cf8', width: 24 }}>#{idx + 1}</span>
                    <span>{q?.title || `Question ID #${qId}`}</span>
                    {q?.difficulty && (
                      <span className="badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.5rem' }}>
                        {q.difficulty}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveQuestion(idx, -1)}
                      style={{ padding: '0.2rem', color: idx === 0 ? 'var(--text-dim)' : 'var(--text-main)' }}
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === selectedQuestionIds.length - 1}
                      onClick={() => moveQuestion(idx, 1)}
                      style={{ padding: '0.2rem', color: idx === selectedQuestionIds.length - 1 ? 'var(--text-dim)' : 'var(--text-main)' }}
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSelectedQuestion(qId)}
                      style={{ padding: '0.2rem', color: 'var(--accent-rose)', marginLeft: '0.25rem' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Bank Picker */}
      {isLoading ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading question bank...
        </div>
      ) : availableQuestions.length > 0 ? (
        <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {availableQuestions.map((q) => {
            const isSelected = selectedQuestionIds.includes(q.id);
            return (
              <div
                key={q.id}
                onClick={() => toggleQuestionSelect(q.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-input)',
                  border: isSelected ? '1px solid #38bdf8' : '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      border: isSelected ? 'none' : '1px solid var(--border)',
                      background: isSelected ? '#38bdf8' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center',
                      color: '#fff',
                    }}
                  >
                    {isSelected && <Check size={14} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{q.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Category: {q.category} • Time Limit: {q.timeLimit}s
                    </div>
                  </div>
                </div>

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
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No questions found matching criteria. Add questions to bank first.
        </div>
      )}
    </div>
  );
};

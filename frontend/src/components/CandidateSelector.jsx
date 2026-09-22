import React, { useState, useEffect } from 'react';
import { fetchCandidates } from '../services/candidateService';
import { Search, CheckSquare, Square, Users, Check } from 'lucide-react';

export const CandidateSelector = ({ selectedCandidateIds = [], onChange }) => {
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCandidates = async () => {
      setIsLoading(true);
      try {
        const response = await fetchCandidates({ limit: 100, search });
        if (response.success) {
          setCandidates(response.data || []);
        }
      } catch (err) {
        console.error('Failed to load candidate list for selector:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCandidates();
  }, [search]);

  const toggleSelect = (id) => {
    if (selectedCandidateIds.includes(id)) {
      onChange(selectedCandidateIds.filter((item) => item !== id));
    } else {
      onChange([...selectedCandidateIds, id]);
    }
  };

  const toggleSelectAll = () => {
    const visibleIds = candidates.map((c) => c.id);
    const allSelected = visibleIds.every((id) => selectedCandidateIds.includes(id));

    if (allSelected) {
      onChange(selectedCandidateIds.filter((id) => !visibleIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...selectedCandidateIds, ...visibleIds]));
      onChange(merged);
    }
  };

  const visibleIds = candidates.map((c) => c.id);
  const isAllSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedCandidateIds.includes(id));

  return (
    <div className="section-card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} color="#818cf8" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Select Candidates</h3>
        </div>
        <span className="badge badge-scheduled">
          {selectedCandidateIds.length} candidate{selectedCandidateIds.length === 1 ? '' : 's'} selected
        </span>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.25rem', width: '100%', fontSize: '0.875rem' }}
            placeholder="Search candidates by name, email, or skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="btn-secondary"
          style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
          onClick={toggleSelectAll}
          disabled={candidates.length === 0}
        >
          {isAllSelected ? <CheckSquare size={16} /> : <Square size={16} />}
          <span>{isAllSelected ? 'Deselect Visible' : 'Select Visible'}</span>
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading candidates...
        </div>
      ) : candidates.length > 0 ? (
        <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {candidates.map((cand) => {
            const isSelected = selectedCandidateIds.includes(cand.id);
            return (
              <div
                key={cand.id}
                onClick={() => toggleSelect(cand.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--primary-light)' : 'var(--bg-input)',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
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
                      background: isSelected ? 'var(--primary)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                    }}
                  >
                    {isSelected && <Check size={14} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cand.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{cand.email} • {cand.skills || 'No skills listed'}</div>
                  </div>
                </div>

                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  ID: #{cand.id}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No candidates found. Create candidate accounts first.
        </div>
      )}
    </div>
  );
};

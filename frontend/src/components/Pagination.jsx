import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total } = pagination;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        marginTop: '1.5rem',
        paddingTop: '1rem',
        borderTop: '1px solid var(--border)',
        fontSize: '0.875rem',
        color: 'var(--text-muted)',
      }}
    >
      <div>
        Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> (Total {total} items)
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          className="btn-secondary"
          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>

        <button
          className="btn-secondary"
          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

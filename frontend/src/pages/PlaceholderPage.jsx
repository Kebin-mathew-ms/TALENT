import React from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Sparkles, Construction } from 'lucide-react';
import '../styles/dashboard.css';

export const PlaceholderPage = ({ title, phaseName = 'Phase 2' }) => {
  return (
    <DashboardLayout title={title}>
      <div className="section-card" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.15)',
            color: '#818cf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}
        >
          <Construction size={32} />
        </div>

        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>{title} Module</h2>

        <p style={{ color: '#94a3b8', maxWidth: 500, margin: '0 auto 1.5rem', fontSize: '1.05rem', lineHeight: '1.6' }}>
          This feature module is scheduled for implementation in <strong>{phaseName}</strong> of Talent Flow.
        </p>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border)',
            padding: '0.5rem 1.25rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.875rem',
            color: '#a5b4fc',
          }}
        >
          <Sparkles size={16} />
          <span>Foundation & Architecture Ready</span>
        </div>
      </div>
    </DashboardLayout>
  );
};

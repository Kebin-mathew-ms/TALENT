import React from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, GraduationCap, Code2, ShieldAlert } from 'lucide-react';
import '../styles/dashboard.css';

export const ProfilePage = () => {
  const { user, role } = useAuth();

  return (
    <DashboardLayout title="My Profile">
      <div className="section-card" style={{ maxWidth: 800 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div className="avatar" style={{ width: 72, height: 72, fontSize: '1.75rem' }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>{user?.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className={`badge ${role === 'INTERVIEWER' ? 'badge-interviewer' : 'badge-candidate'}`}>
                {role}
              </span>
              <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>ID: #{user?.id}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={16} /> Email Address
            </label>
            <div className="form-input" style={{ background: '#0b0f19' }}>{user?.email}</div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Phone size={16} /> Phone Number
            </label>
            <div className="form-input" style={{ background: '#0b0f19' }}>{user?.phone || 'Not provided'}</div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <GraduationCap size={16} /> Education / Qualification
          </label>
          <div className="form-input" style={{ background: '#0b0f19' }}>{user?.education || 'Not provided'}</div>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Code2 size={16} /> Technical Skills
          </label>
          <div className="form-input" style={{ background: '#0b0f19' }}>{user?.skills || 'Not provided'}</div>
        </div>

        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem', color: '#94a3b8' }}>
          Account created on {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
        </div>
      </div>
    </DashboardLayout>
  );
};

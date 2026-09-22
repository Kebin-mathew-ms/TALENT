import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

export const DashboardLayout = ({ title, children }) => {
  const { user, role } = useAuth();

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <header className="top-header">
          <div className="page-title-group">
            <h1 className="page-title">{title}</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className={`badge ${role === 'INTERVIEWER' ? 'badge-interviewer' : 'badge-candidate'}`}>
              {role === 'INTERVIEWER' ? 'Interviewer Workspace' : 'Candidate Workspace'}
            </span>
          </div>
        </header>

        <main className="dashboard-view">{children}</main>
      </div>
    </div>
  );
};

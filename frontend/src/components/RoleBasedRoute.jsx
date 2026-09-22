import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RoleBasedRoute = ({ allowedRoles, children }) => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        <div>Validating permissions...</div>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(role)) {
    // Redirect candidate to candidate dashboard, interviewer to interviewer dashboard
    if (role === 'INTERVIEWER') {
      return <Navigate to="/interviewer/dashboard" replace />;
    } else if (role === 'CANDIDATE') {
      return <Navigate to="/candidate/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

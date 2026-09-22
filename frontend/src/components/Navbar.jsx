import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, LogIn, UserPlus, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { isAuthenticated, role } = useAuth();

  return (
    <nav className="landing-nav">
      <Link to="/" className="brand">
        <div className="brand-icon">
          <Zap size={22} />
        </div>
        <span>Talent Flow</span>
      </Link>

      <div className="nav-actions">
        {isAuthenticated ? (
          <Link
            to={role === 'INTERVIEWER' ? '/interviewer/dashboard' : '/candidate/dashboard'}
            className="btn-primary"
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
        ) : (
          <>
            <Link to="/login" className="btn-secondary">
              <LogIn size={18} />
              <span>Log In</span>
            </Link>
            <Link to="/register" className="btn-primary">
              <UserPlus size={18} />
              <span>Register Candidate</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

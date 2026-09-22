import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Zap,
  LayoutDashboard,
  Users,
  FileCode,
  BookOpen,
  BarChart3,
  ShieldCheck,
  User,
  LogOut,
  Calendar,
  History,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const interviewerNav = [
    { label: 'Dashboard', path: '/interviewer/dashboard', icon: LayoutDashboard },
    { label: 'Candidates', path: '/interviewer/candidates', icon: Users },
    { label: 'Assessments', path: '/interviewer/assessments', icon: FileCode },
    { label: 'Question Bank', path: '/interviewer/questions', icon: BookOpen },
    { label: 'Reports', path: '/interviewer/reports', icon: BarChart3 },
    { label: 'Proctoring', path: '/interviewer/proctoring', icon: ShieldCheck },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  const candidateNav = [
    { label: 'Dashboard', path: '/candidate/dashboard', icon: LayoutDashboard },
    { label: 'My Reports', path: '/candidate/reports', icon: BarChart3 },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  const navItems = role === 'INTERVIEWER' ? interviewerNav : candidateNav;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <NavLink to="/" className="sidebar-brand">
          <div className="brand-icon" style={{ width: 34, height: 34 }}>
            <Zap size={18} />
          </div>
          <span>Talent Flow</span>
        </NavLink>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-summary">
          <div className="avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'User'}</span>
            <span className="user-role-badge">
              {role === 'INTERVIEWER' ? 'Interviewer' : 'Candidate'}
            </span>
          </div>
        </div>

        <button onClick={handleLogout} className="btn-secondary btn-full" style={{ padding: '0.6rem' }}>
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

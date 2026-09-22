import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleBasedRoute } from './components/RoleBasedRoute';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { InterviewerDashboard } from './pages/InterviewerDashboard';
import { CandidateDashboard } from './pages/CandidateDashboard';
import { ProfilePage } from './pages/ProfilePage';
import { PlaceholderPage } from './pages/PlaceholderPage';

// Candidate Management Pages
import { CandidateListPage } from './pages/CandidateListPage';
import { CandidateFormPage } from './pages/CandidateFormPage';
import { CandidateDetailPage } from './pages/CandidateDetailPage';

// Question Bank Pages
import { QuestionListPage } from './pages/QuestionListPage';
import { QuestionFormPage } from './pages/QuestionFormPage';

// Assessment Management Pages
import { AssessmentListPage } from './pages/AssessmentListPage';
import { AssessmentFormPage } from './pages/AssessmentFormPage';
import { AssessmentDetailPage } from './pages/AssessmentDetailPage';
import { CandidateAssessmentDetailPage } from './pages/CandidateAssessmentDetailPage';

// Live Assessment & Phase 5 Reports & Analytics Pages
import { InterviewerLiveDashboardPage } from './pages/InterviewerLiveDashboardPage';
import { CandidateLiveSessionPage } from './pages/CandidateLiveSessionPage';
import { InterviewerProctoringPage } from './pages/InterviewerProctoringPage';
import { InterviewerReportListPage } from './pages/InterviewerReportListPage';
import { CandidateReportDetailPage } from './pages/CandidateReportDetailPage';
import { AssessmentResultsPage } from './pages/AssessmentResultsPage';
import { AssessmentAnalyticsPage } from './pages/AssessmentAnalyticsPage';

import './styles/global.css';

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Interviewer Routes */}
      <Route
        path="/interviewer/dashboard"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['INTERVIEWER']}>
              <InterviewerDashboard />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/interviewer/candidates"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['INTERVIEWER']}>
              <CandidateListPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/interviewer/candidates/new"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['INTERVIEWER']}>
              <CandidateFormPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/interviewer/candidates/:id"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['INTERVIEWER']}>
              <CandidateDetailPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/interviewer/candidates/:id/edit"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['INTERVIEWER']}>
              <CandidateFormPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/interviewer/questions"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['INTERVIEWER']}>
              <QuestionListPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/interviewer/questions/new"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['INTERVIEWER']}>
              <QuestionFormPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/interviewer/questions/:id/edit"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['INTERVIEWER']}>
              <QuestionFormPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/interviewer/assessments"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['INTERVIEWER']}>
              <AssessmentListPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/interviewer/assessments/new"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['INTERVIEWER']}>
              <AssessmentFormPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/interviewer/assessments/:id"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['INTERVIEWER']}>
              <AssessmentDetailPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/interviewer/assessments/:id/edit"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['INTERVIEWER']}>
              <AssessmentFormPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/interviewer/assessments/:id/live"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['INTERVIEWER']}>
              <InterviewerLiveDashboardPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/interviewer/assessments/:id/live/:sessionId"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['INTERVIEWER']}>
              <InterviewerLiveDashboardPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/interviewer/assessments/:id/results"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['INTERVIEWER']}>
              <AssessmentResultsPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/interviewer/assessments/:id/analytics"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['INTERVIEWER']}>
              <AssessmentAnalyticsPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/interviewer/reports"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['INTERVIEWER']}>
              <InterviewerReportListPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/interviewer/reports/:id"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['INTERVIEWER']}>
              <CandidateReportDetailPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/interviewer/proctoring"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['INTERVIEWER']}>
              <InterviewerProctoringPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      {/* Protected Candidate Routes */}
      <Route
        path="/candidate/dashboard"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['CANDIDATE']}>
              <CandidateDashboard />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate/reports"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['CANDIDATE']}>
              <InterviewerReportListPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate/reports/:id"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['CANDIDATE']}>
              <CandidateReportDetailPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate/assessments/:id"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['CANDIDATE']}>
              <CandidateAssessmentDetailPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate/assessments/:id/session"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['CANDIDATE']}>
              <CandidateLiveSessionPage />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate/upcoming"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['CANDIDATE']}>
              <PlaceholderPage title="Upcoming Assessments" phaseName="Phase 2" />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate/history"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['CANDIDATE']}>
              <PlaceholderPage title="Assessment History" phaseName="Phase 2" />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      />

      {/* Shared Profile Route */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

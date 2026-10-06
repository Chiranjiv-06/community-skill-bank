import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Route Guards
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import PublicRoute from './PublicRoute';

// Roles
import { ADMIN_ROLES, VOLUNTEER_ROLES } from '../utils/roles';

// Layouts
import VolunteerLayout from '../components/layout/VolunteerLayout';
import AdminLayout from '../components/layout/AdminLayout';

// Public Pages
import LandingPage from '../pages/public/LandingPage';
import NotFoundPage from '../pages/public/NotFoundPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Volunteer Pages
import VolunteerDashboard from '../pages/volunteer/VolunteerDashboard';
import ProfilePage from '../pages/volunteer/ProfilePage';
import SkillsPage from '../pages/volunteer/SkillsPage';
import EmergenciesPage from '../pages/volunteer/EmergenciesPage';
import EmergencyDetailPage from '../pages/emergency/EmergencyDetailPage';
import ReportEmergencyPage from '../pages/volunteer/ReportEmergencyPage';
import MyResponsesPage from '../pages/volunteer/MyResponsesPage';
import AssignmentsPage from '../pages/volunteer/AssignmentsPage';
import CertificationsPage from '../pages/volunteer/CertificationsPage';
import TrainingPage from '../pages/volunteer/TrainingPage';
import SkillPassportPage from '../pages/volunteer/SkillPassportPage';
import ActivitiesPage from '../pages/volunteer/ActivitiesPage';
import MyActivitiesPage from '../pages/volunteer/MyActivitiesPage';
import ContributionsPage from '../pages/volunteer/ContributionsPage';
import NotificationsPage from '../pages/volunteer/NotificationsPage';
import SyncPage from '../pages/volunteer/SyncPage';
import KnowledgePage from '../pages/volunteer/KnowledgePage';
import SettingsPage from '../pages/volunteer/SettingsPage';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminEmergenciesPage from '../pages/admin/AdminEmergenciesPage';
import EmergencyRequirementsPage from '../pages/admin/EmergencyRequirementsPage';
import MatchingPage from '../pages/admin/MatchingPage';
import RecommendationsPage from '../pages/admin/RecommendationsPage';
import ResponseMonitoringPage from '../pages/admin/ResponseMonitoringPage';
import VolunteerDirectoryPage from '../pages/admin/VolunteerDirectoryPage';
import AdminSkillsPage from '../pages/admin/AdminSkillsPage';
import AdminVerificationPage from '../pages/admin/AdminVerificationPage';
import VerificationQueuePage from '../pages/admin/VerificationQueuePage';
import AdminAssignmentsPage from '../pages/admin/AdminAssignmentsPage';
import AdminCertificationsPage from '../pages/admin/AdminCertificationsPage';
import AdminTrainingPage from '../pages/admin/AdminTrainingPage';
import AdminActivitiesPage from '../pages/admin/AdminActivitiesPage';
import AdminNotificationsPage from '../pages/admin/AdminNotificationsPage';
import AdminSyncPage from '../pages/admin/AdminSyncPage';
import AdminKnowledgePage from '../pages/admin/AdminKnowledgePage';
import AdminAnalyticsPage from '../pages/admin/AdminAnalyticsPage';
import SimulationPage from '../pages/admin/SimulationPage';
import AuditLogsPage from '../pages/admin/AuditLogsPage';
import SystemMetricsPage from '../pages/admin/SystemMetricsPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';
import AdminProfilePage from '../pages/admin/AdminProfilePage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes with Authenticated Redirection */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        }
      />
      <Route path="/landing" element={<Navigate to="/" replace />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Authenticated Root (Guarded by ProtectedRoute) */}
      <Route element={<ProtectedRoute />}>
        {/* Volunteer Application Subtree (Guarded by RoleRoute) */}
        <Route element={<RoleRoute allowedRoles={VOLUNTEER_ROLES} targetArea="volunteer" />}>
          <Route path="/volunteer" element={<VolunteerLayout />}>
            <Route index element={<Navigate to="/volunteer/dashboard" replace />} />
            <Route path="dashboard" element={<VolunteerDashboard />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="skills" element={<SkillsPage />} />
            <Route path="emergencies" element={<EmergenciesPage />} />
            <Route path="emergencies/:id" element={<EmergencyDetailPage />} />
            <Route path="report-emergency" element={<ReportEmergencyPage />} />
            <Route path="responses" element={<MyResponsesPage />} />
            <Route path="assignments" element={<AssignmentsPage />} />
            <Route path="certifications" element={<CertificationsPage />} />
            <Route path="training" element={<TrainingPage />} />
            <Route path="skill-passport" element={<SkillPassportPage />} />
            <Route path="activities" element={<ActivitiesPage />} />
            <Route path="my-activities" element={<MyActivitiesPage />} />
            <Route path="contributions" element={<ContributionsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="sync" element={<SyncPage />} />
            <Route path="knowledge" element={<KnowledgePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Admin Incident Command Subtree (Guarded by RoleRoute) */}
        <Route element={<RoleRoute allowedRoles={ADMIN_ROLES} targetArea="admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="emergencies" element={<AdminEmergenciesPage />} />
            <Route path="emergencies/:id" element={<EmergencyDetailPage />} />
            <Route path="emergencies/requirements" element={<EmergencyRequirementsPage />} />
            <Route path="matching" element={<MatchingPage />} />
            <Route path="recommendations" element={<RecommendationsPage />} />
            <Route path="response-monitoring" element={<ResponseMonitoringPage />} />
            <Route path="volunteers" element={<Navigate to="/admin/verification" replace />} />
            <Route path="skills" element={<AdminSkillsPage />} />
            <Route path="verification" element={<AdminVerificationPage />} />
            <Route path="verification-queue" element={<VerificationQueuePage />} />
            <Route path="assignments" element={<AdminAssignmentsPage />} />
            <Route path="certifications" element={<AdminCertificationsPage />} />
            <Route path="training" element={<AdminTrainingPage />} />
            <Route path="activities" element={<AdminActivitiesPage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
            <Route path="sync" element={<AdminSyncPage />} />
            <Route path="knowledge" element={<AdminKnowledgePage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="simulations" element={<SimulationPage />} />
            <Route path="simulation" element={<Navigate to="/admin/simulations" replace />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="audit" element={<Navigate to="/admin/audit-logs" replace />} />
            <Route path="metrics" element={<SystemMetricsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="profile" element={<AdminProfilePage />} />
          </Route>
        </Route>
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, AUTH_STATES } from '../context/AuthContext';
import { getDefaultDashboard } from '../utils/roles';
import LoadingState from '../components/states/LoadingState';

/**
 * PublicRoute Guard
 * - If session is currently restoring on refresh, displays LoadingState to avoid layout flicker.
 * - If user is already authenticated, redirects them to their role-appropriate dashboard (Sections 13, 14, 15).
 * - If user is unauthenticated, renders the requested public page.
 */
export const PublicRoute = ({ children }) => {
  const { isAuthenticated, role, loading, authStatus } = useAuth();

  if (loading || authStatus === AUTH_STATES.RESTORING_SESSION) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingState message="Loading..." minHeight="300px" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={getDefaultDashboard(role)} replace />;
  }

  return children ? children : <Outlet />;
};

export default PublicRoute;

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, AUTH_STATES } from '../context/AuthContext';
import LoadingState from '../components/states/LoadingState';

/**
 * ProtectedRoute Guard
 * - If session is currently restoring on initial load / refresh, displays LoadingState to avoid redirect flickering.
 * - If user is unauthenticated, redirects to /login and saves current attempted location in state.
 * - If user is authenticated, allows access to the nested route outlet.
 */
export const ProtectedRoute = () => {
  const { isAuthenticated, loading, authStatus } = useAuth();
  const location = useLocation();

  if (loading || authStatus === AUTH_STATES.RESTORING_SESSION) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingState message="Restoring secure responder session..." minHeight="320px" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

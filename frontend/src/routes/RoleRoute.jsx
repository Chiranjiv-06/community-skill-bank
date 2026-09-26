import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES, isAdminRole, isVolunteerRole } from '../utils/roles';
import UnauthorizedState from '../components/states/UnauthorizedState';

/**
 * RoleRoute Guard
 * - Verifies that the authenticated user possesses the role required for the target area.
 * - If an Admin tries to access the Volunteer area, seamlessly redirects to /admin/dashboard (Section 11).
 * - If a Volunteer tries to access the Admin area, presents UnauthorizedState without loading AdminLayout or admin content (Section 10).
 */
export const RoleRoute = ({ allowedRoles = [], targetArea = 'admin' }) => {
  const { role } = useAuth();

  const isAllowed = allowedRoles.includes(role);

  if (!isAllowed) {
    // If an Admin accesses Volunteer area, redirect them to the Admin Command Dashboard
    if (isAdminRole(role) && targetArea === 'volunteer') {
      return <Navigate to="/admin/dashboard" replace />;
    }

    // If a Volunteer attempts to access Admin console, show UnauthorizedState with clear return button
    if (isVolunteerRole(role) && targetArea === 'admin') {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-6)',
            background: 'var(--bg-app)'
          }}
        >
          <div style={{ maxWidth: '560px', width: '100%' }}>
            <UnauthorizedState
              title="Incident Command Access Restricted"
              message="You are currently authenticated as a Community Volunteer. Access to the Incident Command Console requires administrative clearance."
              redirectPath="/volunteer/dashboard"
              redirectLabel="Return to Volunteer Dashboard"
            />
          </div>
        </div>
      );
    }

    // Fallback unauthorized state for any other unspecified role access
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-6)',
          background: 'var(--bg-app)'
        }}
      >
        <div style={{ maxWidth: '560px', width: '100%' }}>
          <UnauthorizedState
            title="Access Restricted"
            message={`You do not have permission to access this area with your current role (${role || 'unassigned'}).`}
            redirectPath={isAdminRole(role) ? '/admin/dashboard' : '/volunteer/dashboard'}
            redirectLabel="Return to Your Dashboard"
          />
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default RoleRoute;

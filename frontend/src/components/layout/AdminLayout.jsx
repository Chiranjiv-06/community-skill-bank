import React from 'react';
import { Outlet } from 'react-router-dom';
import AppShell from './AppShell';
import AdminSidebar from '../navigation/AdminSidebar';

/**
 * Admin Application Layout
 * Integrated with Incident Command AdminSidebar, Topbar, and Outlet
 * Guarded upstream by ProtectedRoute and RoleRoute
 */
export const AdminLayout = () => {
  return (
    <AppShell sidebar={AdminSidebar}>
      <Outlet />
    </AppShell>
  );
};

export default AdminLayout;

import React from 'react';
import { Outlet } from 'react-router-dom';
import AppShell from './AppShell';
import VolunteerSidebar from '../navigation/VolunteerSidebar';

export const VolunteerLayout = () => {
  return (
    <AppShell sidebar={VolunteerSidebar}>
      <Outlet />
    </AppShell>
  );
};

export default VolunteerLayout;

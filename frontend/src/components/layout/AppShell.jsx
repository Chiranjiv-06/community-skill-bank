import React, { useState } from 'react';
import Topbar from './Topbar';
import OfflineBanner from '../sync/OfflineBanner';

/**
 * Reusable Application Shell Component
 * Integrates Topbar, arbitrary Sidebar (Volunteer or Admin), and Main content outlet
 */
export const AppShell = ({ sidebar: SidebarComponent, children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const toggleMobileDrawer = () => {
    setIsMobileDrawerOpen((prev) => !prev);
  };

  return (
    <div className="app-shell">
      {/* Mobile Drawer Overlay */}
      <div
        className={`mobile-overlay ${isMobileDrawerOpen ? 'is-open' : ''}`}
        onClick={() => setIsMobileDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Main Desktop Sidebar */}
      <SidebarComponent
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      {/* Mobile Off-canvas Drawer */}
      <SidebarComponent
        isMobile={true}
        onCloseMobile={() => setIsMobileDrawerOpen(false)}
        isCollapsed={false}
      />

      {/* Main Column */}
      <div className="app-main-layout">
        <Topbar
          onToggleSidebar={() => {
            if (window.innerWidth <= 1024) {
              toggleMobileDrawer();
            } else {
              toggleSidebarCollapse();
            }
          }}
        />

        {/* Offline notification ribbon */}
        <OfflineBanner />

        <main className="app-content" id="main-content" role="main">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;

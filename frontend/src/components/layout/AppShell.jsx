import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Topbar from './Topbar';
import OfflineBanner from '../sync/OfflineBanner';

/**
 * Reusable Application Shell Component
 * Integrates Topbar, arbitrary Sidebar (Volunteer or Admin), and Main content outlet
 */
export const AppShell = ({ sidebar: SidebarComponent, children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const location = useLocation();

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const toggleMobileDrawer = () => {
    setIsMobileDrawerOpen((prev) => !prev);
  };

  // Automatically close mobile drawer and clear any overlay when navigating routes
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isMobileDrawerOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsMobileDrawerOpen(false);
    };
    const closeOnDesktop = () => {
      if (window.innerWidth > 768) setIsMobileDrawerOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', closeOnDesktop);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', closeOnDesktop);
    };
  }, [isMobileDrawerOpen]);

  return (
    <div className={`app-shell ${isSidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
      {/* Mobile Drawer Overlay */}
      <div
        className={`mobile-overlay ${isMobileDrawerOpen ? 'is-open' : ''}`}
        onClick={() => setIsMobileDrawerOpen(false)}
        aria-hidden={!isMobileDrawerOpen}
        style={{ pointerEvents: isMobileDrawerOpen ? 'auto' : 'none' }}
      />

      {/* Main Desktop Sidebar */}
      <SidebarComponent
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      {/* Mobile Off-canvas Drawer */}
      <SidebarComponent
        isMobile={true}
        isOpen={isMobileDrawerOpen}
        onCloseMobile={() => setIsMobileDrawerOpen(false)}
        isCollapsed={false}
      />

      {/* Main Column */}
      <div className="app-main-layout">
        <Topbar
          onToggleSidebar={() => {
            if (window.innerWidth <= 768) {
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

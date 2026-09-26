import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  ChevronRight,
  Shield,
  User,
  LogOut,
  LogIn,
  RefreshCw
} from 'lucide-react';
import IconButton from '../common/IconButton';
import Dropdown from '../common/Dropdown';
import Button from '../common/Button';
import NotificationCenterDropdown from '../notifications/NotificationCenterDropdown';
import SyncStatusIndicator from '../sync/SyncStatusIndicator';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES, ROLE_LABELS, ROLE_BADGE_VARIANTS } from '../../utils/roles';

export const Topbar = ({ onToggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, role, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Parse path for breadcrumbs and title
  const pathParts = location.pathname.split('/').filter(Boolean);
  const section = pathParts[0] ? pathParts[0].toUpperCase() : 'APP';
  const pageName = pathParts[1]
    ? pathParts[1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Dashboard';

  const roleLabel = ROLE_LABELS[role] || 'Community Volunteer';
  const badgeVariant = ROLE_BADGE_VARIANTS[role] || 'badge-neutral';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="app-topbar">
      {/* Left: Toggles & Breadcrumbs */}
      <div className="topbar-left">
        <IconButton
          title="Toggle Navigation"
          size="md"
          className="desktop-toggle"
          onClick={onToggleSidebar}
        >
          <Menu size={20} />
        </IconButton>

        <div className="topbar-breadcrumbs">
          <Link to="/" style={{ color: 'var(--text-muted)' }}>HOME</Link>
          <ChevronRight size={14} />
          <span>{section}</span>
          <ChevronRight size={14} />
          <span className="active">{pageName}</span>
        </div>
      </div>

      {/* Right: Role Indicator, Theme Toggle, Alerts, User Profile */}
      <div className="topbar-right">
        {/* Role Indicator Badge (Display Only - Determined by Backend Role) */}
        {isAuthenticated && (
          <div
            className={`badge ${badgeVariant}`}
            style={{ padding: '6px 12px', gap: '6px', userSelect: 'none' }}
            title={`Active Clearance: ${roleLabel}`}
          >
            {role === ROLES.ADMIN ? <Shield size={14} /> : <User size={14} />}
            <span>{roleLabel}</span>
          </div>
        )}

        {/* Offline & Sync Status Indicator */}
        {isAuthenticated && <SyncStatusIndicator />}

        {/* Theme Toggle */}
        <IconButton
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          size="md"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </IconButton>

        {/* Interactive Notification Center Popover */}
        {isAuthenticated && <NotificationCenterDropdown />}

        {/* User Profile Badge & Menu or Sign In */}
        {isAuthenticated && currentUser ? (
          <Dropdown
            align="right"
            trigger={
              <div className="user-menu-btn" role="button" aria-haspopup="true">
                <div className="user-avatar">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="user-meta">
                  <span className="user-name">{currentUser?.name || 'Authorized Responder'}</span>
                  <span className="user-role-label">{roleLabel}</span>
                </div>
              </div>
            }
          >
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{currentUser?.name}</div>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{currentUser?.email}</div>
            </div>
            <Link
              to={role === ROLES.ADMIN ? '/admin/profile' : '/volunteer/profile'}
              style={{ textDecoration: 'none' }}
            >
              <button
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', margin: '4px 0' }}
              >
                <User size={15} />
                <span>View Profile</span>
              </button>
            </Link>
            <Link
              to={role === ROLES.ADMIN ? '/admin/sync' : '/volunteer/sync'}
              style={{ textDecoration: 'none' }}
            >
              <button
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', margin: '4px 0' }}
              >
                <RefreshCw size={15} />
                <span>Offline Sync</span>
              </button>
            </Link>
            <button
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--color-critical)' }}
              onClick={handleLogout}
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </Dropdown>
        ) : (
          <Link to="/login">
            <Button variant="primary" size="sm" icon={<LogIn size={15} />}>
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Topbar;

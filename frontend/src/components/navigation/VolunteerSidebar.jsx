import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  Zap,
  Award,
  GraduationCap,
  CreditCard,
  AlertTriangle,
  Flame,
  CheckCircle2,
  ClipboardList,
  Users,
  Calendar,
  HeartHandshake,
  Bell,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  X
} from 'lucide-react';
import NavItem from './NavItem';
import IconButton from '../common/IconButton';
import Badge from '../common/Badge';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export const VolunteerSidebar = ({
  isCollapsed = false,
  onToggleCollapse = () => {},
  isMobile = false,
  onCloseMobile = () => {}
}) => {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside
      className={`app-sidebar ${isCollapsed && !isMobile ? 'is-collapsed' : ''} ${isMobile ? 'sidebar-mobile-drawer is-open' : ''}`}
      aria-label="Volunteer Navigation"
    >
      {/* Brand Header */}
      <div className="sidebar-header">
        <Link to="/volunteer/dashboard" className="sidebar-brand" onClick={isMobile ? onCloseMobile : undefined}>
          <img src="/logo.svg" alt="CSB Shield" className="sidebar-logo" />
          {(!isCollapsed || isMobile) && (
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-title">COMMUNITY SKILL BANK</span>
              <span className="sidebar-brand-badge">VOLUNTEER PORTAL</span>
            </div>
          )}
        </Link>
        {isMobile ? (
          <IconButton title="Close Navigation" size="sm" onClick={onCloseMobile}>
            <X size={18} />
          </IconButton>
        ) : (
          <IconButton
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            size="sm"
            onClick={onToggleCollapse}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </IconButton>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="sidebar-nav-container">
        {/* Core Dashboard */}
        <ul className="sidebar-nav-list">
          <NavItem
            to="/volunteer/dashboard"
            label="Dashboard"
            icon={<LayoutDashboard size={19} />}
            isCollapsed={isCollapsed && !isMobile}
            onClick={isMobile ? onCloseMobile : undefined}
          />
        </ul>

        {/* Profile Section */}
        <div>
          <div className="sidebar-section-title">MY PROFILE</div>
          <ul className="sidebar-nav-list">
            <NavItem
              to="/volunteer/profile"
              label="Profile"
              icon={<User size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
            <NavItem
              to="/volunteer/skills"
              label="My Skills"
              icon={<Zap size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              badge={<Badge variant="primary" style={{ fontSize: '10px', padding: '1px 6px' }}>7</Badge>}
              onClick={isMobile ? onCloseMobile : undefined}
            />
            <NavItem
              to="/volunteer/certifications"
              label="Certifications"
              icon={<Award size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
            <NavItem
              to="/volunteer/training"
              label="Training"
              icon={<GraduationCap size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
            <NavItem
              to="/volunteer/skill-passport"
              label="Skill Passport"
              icon={<CreditCard size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
          </ul>
        </div>

        {/* Emergency Section */}
        <div>
          <div className="sidebar-section-title">EMERGENCY</div>
          <ul className="sidebar-nav-list">
            <NavItem
              to="/volunteer/emergencies"
              label="Emergencies"
              icon={<Flame size={19} color="var(--color-primary)" />}
              isCollapsed={isCollapsed && !isMobile}
              badge={<Badge variant="critical" style={{ fontSize: '10px', padding: '1px 6px' }}>3 Active</Badge>}
              onClick={isMobile ? onCloseMobile : undefined}
            />
            <NavItem
              to="/volunteer/report-emergency"
              label="Report Emergency"
              icon={<AlertTriangle size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
            <NavItem
              to="/volunteer/responses"
              label="My Responses"
              icon={<CheckCircle2 size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
            <NavItem
              to="/volunteer/assignments"
              label="My Assignments"
              icon={<ClipboardList size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
          </ul>
        </div>

        {/* Community Section */}
        <div>
          <div className="sidebar-section-title">COMMUNITY</div>
          <ul className="sidebar-nav-list">
            <NavItem
              to="/volunteer/activities"
              label="Activities"
              icon={<Users size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
            <NavItem
              to="/volunteer/my-activities"
              label="My Activities"
              icon={<Calendar size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
            <NavItem
              to="/volunteer/contributions"
              label="Contributions"
              icon={<HeartHandshake size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
          </ul>
        </div>

        {/* System & Resource Links */}
        <div>
          <div className="sidebar-section-title">RESOURCES & SYSTEM</div>
          <ul className="sidebar-nav-list">
            <NavItem
              to="/volunteer/notifications"
              label="Notifications"
              icon={<Bell size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              badge={<Badge variant="critical" style={{ fontSize: '10px', padding: '1px 6px' }}>1</Badge>}
              onClick={isMobile ? onCloseMobile : undefined}
            />
            <NavItem
              to="/volunteer/knowledge"
              label="Knowledge"
              icon={<BookOpen size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
            <NavItem
              to="/volunteer/settings"
              label="Settings"
              icon={<Settings size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
          </ul>
        </div>
      </div>

      {/* Footer / Quick Actions */}
      <div className="sidebar-footer">
        <button
          className="nav-item-link"
          style={{ width: '100%', border: 'none', background: 'transparent' }}
          onClick={toggleTheme}
          title="Toggle Theme"
        >
          <span className="nav-icon">{theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</span>
          {(!isCollapsed || isMobile) && (
            <span className="nav-item-label">{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
          )}
        </button>

        <button
          className="nav-item-link"
          style={{ width: '100%', border: 'none', background: 'transparent', color: 'var(--color-critical)' }}
          onClick={handleLogout}
          title="Logout"
        >
          <span className="nav-icon"><LogOut size={19} /></span>
          {(!isCollapsed || isMobile) && <span className="nav-item-label">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default VolunteerSidebar;

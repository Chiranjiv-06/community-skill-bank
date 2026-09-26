import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  Flame,
  FileSpreadsheet,
  GitMerge,
  Sparkles,
  Activity,
  Users2,
  Zap,
  CheckCheck,
  ClipboardList,
  Award,
  GraduationCap,
  ListChecks,
  CalendarDays,
  Bell,
  BookOpen,
  BarChart3,
  Cpu,
  History,
  Gauge,
  Settings,
  UserCheck,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import NavItem from './NavItem';
import IconButton from '../common/IconButton';
import Badge from '../common/Badge';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export const AdminSidebar = ({
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
      aria-label="Emergency Incident Command Navigation"
    >
      {/* Brand Header */}
      <div className="sidebar-header">
        <Link to="/admin/dashboard" className="sidebar-brand" onClick={isMobile ? onCloseMobile : undefined}>
          <img src="/logo.svg" alt="Admin Shield" className="sidebar-logo" />
          {(!isCollapsed || isMobile) && (
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-title">COMMUNITY SKILL BANK</span>
              <span className="sidebar-brand-badge" style={{ color: '#EF4444' }}>INCIDENT COMMAND</span>
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
            to="/admin/dashboard"
            label="Dashboard"
            icon={<LayoutDashboard size={19} />}
            isCollapsed={isCollapsed && !isMobile}
            onClick={isMobile ? onCloseMobile : undefined}
          />
        </ul>

        {/* Emergency Management */}
        <div>
          <div className="sidebar-section-title">EMERGENCY MANAGEMENT</div>
          <ul className="sidebar-nav-list">
            <NavItem
              to="/admin/emergencies"
              end={true}
              label="Emergencies"
              icon={<Flame size={19} color="var(--color-critical)" />}
              isCollapsed={isCollapsed && !isMobile}
              badge={<Badge variant="critical" style={{ fontSize: '10px', padding: '1px 6px' }}>3</Badge>}
              onClick={isMobile ? onCloseMobile : undefined}
            />
            <NavItem
              to="/admin/emergencies/requirements"
              label="Emergency Requirements"
              icon={<FileSpreadsheet size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
            <NavItem
              to="/admin/matching"
              label="Matching Engine"
              icon={<GitMerge size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
            <NavItem
              to="/admin/recommendations"
              label="Recommendations"
              icon={<Sparkles size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
            <NavItem
              to="/admin/response-monitoring"
              label="Response Monitoring"
              icon={<Activity size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
          </ul>
        </div>

        {/* Volunteers */}
        <div>
          <div className="sidebar-section-title">VOLUNTEERS</div>
          <ul className="sidebar-nav-list">
            <NavItem
              to="/admin/volunteers"
              label="Volunteer Directory"
              icon={<Users2 size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
            <NavItem
              to="/admin/skills"
              label="Skills Catalog"
              icon={<Zap size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
            <NavItem
              to="/admin/verification"
              label="Verification"
              icon={<CheckCheck size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
          </ul>
        </div>

        {/* Assignments */}
        <div>
          <div className="sidebar-section-title">ASSIGNMENTS</div>
          <ul className="sidebar-nav-list">
            <NavItem
              to="/admin/assignments"
              label="Assignment Management"
              icon={<ClipboardList size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
          </ul>
        </div>

        {/* Certification & Training */}
        <div>
          <div className="sidebar-section-title">CERTIFICATION & TRAINING</div>
          <ul className="sidebar-nav-list">
            <NavItem
              to="/admin/certifications"
              label="Certifications"
              icon={<Award size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
            <NavItem
              to="/admin/training"
              label="Training Programs"
              icon={<GraduationCap size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
            <NavItem
              to="/admin/verification-queue"
              label="Verification Queue"
              icon={<ListChecks size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              badge={<Badge variant="warning" style={{ fontSize: '10px', padding: '1px 6px' }}>4</Badge>}
              onClick={isMobile ? onCloseMobile : undefined}
            />
          </ul>
        </div>

        {/* Community */}
        <div>
          <div className="sidebar-section-title">COMMUNITY</div>
          <ul className="sidebar-nav-list">
            <NavItem
              to="/admin/activities"
              label="Activities"
              icon={<CalendarDays size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
          </ul>
        </div>

        {/* Intelligence, Ops & Audits */}
        <div>
          <div className="sidebar-section-title">COMMAND & INTELLIGENCE</div>
          <ul className="sidebar-nav-list">
            <NavItem
              to="/admin/notifications"
              label="Notifications"
              icon={<Bell size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
            <NavItem
              to="/admin/knowledge"
              label="Knowledge"
              icon={<BookOpen size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
            <NavItem
              to="/admin/analytics"
              label="Analytics"
              icon={<BarChart3 size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
            <NavItem
              to="/admin/simulations"
              label="Disaster Simulation"
              icon={<Cpu size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
            <NavItem
              to="/admin/audit-logs"
              label="Audit Logs"
              icon={<History size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
            <NavItem
              to="/admin/metrics"
              label="System Metrics"
              icon={<Gauge size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
          </ul>
        </div>

        {/* System Settings & Profile */}
        <div>
          <div className="sidebar-section-title">SYSTEM</div>
          <ul className="sidebar-nav-list">
            <NavItem
              to="/admin/settings"
              label="Settings"
              icon={<Settings size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
            <NavItem
              to="/admin/profile"
              label="Admin Profile"
              icon={<UserCheck size={19} />}
              isCollapsed={isCollapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
          </ul>
        </div>
      </div>

      {/* Footer Quick Controls */}
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

export default AdminSidebar;

import React from 'react';
import { NavLink } from 'react-router-dom';
import Tooltip from '../common/Tooltip';

/**
 * Reusable Sidebar Navigation Item
 * Supports active route matching, tooltips in collapsed state, and optional end prop
 */
export const NavItem = ({
  to,
  label,
  icon,
  badge = null,
  isCollapsed = false,
  onClick = null,
  end = false
}) => {
  const content = (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `nav-item-link ${isActive ? 'is-active' : ''}`}
      onClick={onClick}
    >
      <span className="nav-icon">{icon}</span>
      {!isCollapsed && <span className="nav-item-label">{label}</span>}
      {!isCollapsed && badge && <span className="nav-badge">{badge}</span>}
    </NavLink>
  );

  if (isCollapsed) {
    return (
      <li>
        <Tooltip content={label} position="right">
          {content}
        </Tooltip>
      </li>
    );
  }

  return <li>{content}</li>;
};

export default NavItem;
